class RaceCarAI extends RaceCar {
    constructor(SceneObj, x, y, TileSize, TileScale, raceTrack, ImageNameCar, ImageNameArrow) {
        super(SceneObj, x, y, TileSize, TileScale, raceTrack, ImageNameCar, ImageNameArrow);
        this.Input = new Object(
            {
                Up: false,
                Down: false,
                Right: false,
                Left: false
            });
        this.PrevInput = new Object(
            {
                Up: false,
                Down: false,
                Right: false,
                Left: false
            });
        this.TrackDir = new Phaser.Math.Vector2;
        this.TurnVector = new Phaser.Math.Vector2;
        this.CarForwardVec = new Phaser.Math.Vector2;
        this.FrontOfCarVec = new Phaser.Math.Vector2;
        this.worldRect = new Phaser.Geom.Rectangle;

        this.N1Tile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.CurrTile.properties.nextTileId);
        this.N2Tile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.N1Tile.properties.nextTileId);
        this.N3Tile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.N2Tile.properties.nextTileId);

        this.SearchLine = new Phaser.Geom.Line;

        this.ReturningToTrack = false;
        this.ReturningToTile = null;
        this.ReturningToTileDist = 0;

         this.Car.angle += 180;
    }

    IsHuman() {
        return false;
    }

    PressUp() {
        this.Input.Up = true;
        this.Input.Down = false;
    }

    PressDown() {
        this.Input.Up = false;
        this.Input.Down = true;
    }

    PressRight() {
        this.Input.Right = true;
        this.Input.Left = false;
    }

    PressLeft() {
        this.Input.Right = false;
        this.Input.Left = true;
    }

    ClearInput() {
        this.PrevInput.Right = this.Input.Right;
        this.PrevInput.Left = this.Input.Left;
        this.PrevInput.Up = this.Input.Up;
        this.PrevInput.Down = this.Input.Down;

        this.Input.Right = this.Input.Left = this.Input.Up = this.Input.Down = false;
    }

    DoTurn(TurnVector, tolerance)
    {
        var CosAngleWithRoad = TurnVector.dot(this.ForwardVec);
        var TurnRequired = false;
        
        if (CosAngleWithRoad < 1 - tolerance) {
            TurnRequired = true;

            // Rotate the car vector slightly clockwise and calculate new dot with road
            this.CarForwardVec.setToPolar(this.ForwardVec.clone().angle() + 0.01, 1);
            var CosAngleWithRoad2 = TurnVector.dot(this.CarForwardVec);

            // IF we're closer to 1 now it means we're more aligned, so press right (right == clockwise)
            if (CosAngleWithRoad2 > CosAngleWithRoad) {
                this.PressRight();       
            }
            else {
                this.PressLeft();
            }
        }

        return TurnRequired;
    }
    UpdateInputOnTrack() {
        

        this.ReturningToTrack = false;

        // SLow down before a turn
        if ((this.N1Tile.properties.turn && this.ForwardSpeed > 25) ||
            (this.N2Tile.properties.turn && this.ForwardSpeed > 35) ||
            (this.N3Tile.properties.turn && this.ForwardSpeed > 45)) {
          //  this.PressDown();
        }
        else {
            this.PressUp();
        }

        
        var turnFactor;
        if (this.N1Tile.properties.turn) {
            this.TurnVector.set(this.N2Tile.getCenterX() - this.N1Tile.getCenterX(),
                this.N2Tile.getCenterY() - this.N1Tile.getCenterY()).normalize();
            turnFactor = 0.1;

        }
        else if (!this.CurrTile.properties.turn &&
                !this.N1Tile.properties.turn &&
                !this.N2Tile.properties.turn &&
                !this.N3Tile.properties.turn)
        {
            this.TurnVector.set(this.N3Tile.getCenterX() - this.Car.x,
                this.N3Tile.getCenterY() - this.Car.y).normalize();
            turnFactor = 0.01; 
        }
        else
        {
            this.TurnVector.set(this.N1Tile.getCenterX() - this.CurrTile.getCenterX(),
                this.N1Tile.getCenterY() - this.CurrTile.getCenterY()).normalize();
            turnFactor = 0.01; 
        }


        this.DoTurn(this.TurnVector, turnFactor);
    }





    UpdateInputOffTrack() 
    {
        if (this.ReturningToTrack)
        {
            var N1ReturningTile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.ReturningToTile.properties.nextTileId);
            this.TrackDir.set(N1ReturningTile.getCenterX() - this.ReturningToTile.getCenterX(),
            N1ReturningTile.getCenterY() - this.ReturningToTile.getCenterY()).normalize();

            // dot will range between -1 and 1, so normalize so its between 0 and 1
            var Alignment = (this.TrackDir.dot(this.ForwardVec) + 1) / 2;
            var Dist = Phaser.Math.Distance.Between(this.Car.x, this.Car.y,
                this.ReturningToTile.getCenterX(), this.ReturningToTile.getCenterY());
            if (Dist > this.ReturningToTileDist + 20)
            {
                this.PressUp();
                this.PressRight();
                this.ReturningToTrack = false;
            }
            else {
                var PerformingTurn = false;
                var CarRect = this.Car.getBounds();
                var TileRect = this.ReturningToTile.getBounds();
                var IntRect = Phaser.Geom.Rectangle.Intersection(CarRect, TileRect);
                if (Dist/this.ForwardSpeed < 100)
                {
                    PerformingTurn = this.DoTurn(this.TrackDir, (IntRect.width != 0 || IntRect.height != 0) ? 0.01 : 0.1);
                    if (this.ForwardSpeed > 20) 
                    {
                        this.PressDown();
                    }
                }

                /* && ((Dist < (this.TileSize * this.TileScale / Alignment) && this.ForwardSpeed > 5) ||
                    (Dist < (2 * this.TileSize * this.TileScale / Alignment) && this.ForwardSpeed > 15) ||
                    (Dist < (3 * this.TileSize * this.TileScale / Alignment) && this.ForwardSpeed > 25)) */
                if (PerformingTurn) {
                    this.PressDown();
                }
                else {
                    this.PressUp();
                }

               

            }

            this.ReturningToTileDist = Dist;
        }
        else {

            this.CarForwardVec.copy(this.ForwardVec).scale(15000);
            var DirOK = false;
            
            this.SearchLine.setTo(this.Car.x, this.Car.y, this.Car.x + this.CarForwardVec.x, this.Car.y + this.CarForwardVec.y);
            var FoundTiles = this.raceTrack.TrackTileLayer.getTilesWithinShape(this.SearchLine, { isNotEmpty: true });
            for (var j = 0; j < FoundTiles.length; ++j) {
                if (/*!FoundTiles[j].properties.turn &&*/ (
                    FoundTiles[j].properties.TileId == this.LastValidTile.properties.TileId ||
                    FoundTiles[j].properties.TileId == this.N1Tile.properties.TileId ||
                    FoundTiles[j].properties.TileId == this.N2Tile.properties.TileId || 
                    FoundTiles[j].properties.TileId == this.N3Tile.properties.TileId )) 
                {
                    this.PressUp();
                    DirOK = true;
                    this.SeekingReturn = false;
                    this.ReturningToTrack = true;
                    
                    this.ReturningToTile = FoundTiles[j];
                    this.ReturningToTileDist = Phaser.Math.Distance.Between(this.Car.x, this.Car.y,
                        this.ReturningToTile.getCenterX(), this.ReturningToTile.getCenterY());
                    break;
                }
            }
        
            

            if (!DirOK) {
                
                this.PressUp();
                //this.PressRight();

                
                var N1LastValidTile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.LastValidTile.properties.nextTileId);
               // var N2LastValidTile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == N1LastValidTile.properties.nextTileId);
                this.TrackDir.set(this.LastValidTile.getCenterX() - this.Car.x,
                this.LastValidTile.getCenterY() - this.Car.y).normalize();
                if (!this.SeekingReturn)
                {
                    this.DoTurn(this.TrackDir, 0);
                    this.SeekingReturn = true;
                }
                else 
                {
                    this.PrevInput.Right ? this.PressRight() : this.PressLeft();
                }

                

            }
        }
    }
    UpdateInput() {

        
        this.ClearInput();

        var TooCloseToEdge = false;

        const tolerance = 0.01;
        if (this.ForwardSpeed < 0.1 && (Math.abs(this.ForwardVec.x) < 0+tolerance || Math.abs(this.ForwardVec.y) < 0+tolerance)) {
            this.FrontOfCarVec.set(this.Car.x, this.Car.y).add(this.ForwardVec.clone().scale(this.Car.width*15));
            this.worldRect.setTo(0, 0, worldWidth, worldHeight);

            if (!this.worldRect.contains(this.FrontOfCarVec.x, this.FrontOfCarVec.y)) {
                this.PressDown();
                TooCloseToEdge = true;
            }
        }

        if (!TooCloseToEdge) {
            if (this.CurrTile != null && this.OnTrack) {
                this.UpdateInputOnTrack();
            }
            else {
                this.UpdateInputOffTrack();
            }
        }
    }


    UpdateState(SceneObj) {
        super.UpdateState();
        this.powerFactor = this.checkTileValidity(SceneObj, this.CurrTile);
        // Check if we're on the track
        // if (this.CurrTile == null) {
        //     this.N1Tile = this.N2Tile = this.N3Tile = null;
        // }
        // If we really moved by a single tile, we can use also the 2nd and 3rd degree tiles to save performance
        if (this.OnTrack) 
        {
            if (this.N1Tile && this.CurrTile.properties.TileId == this.N1Tile.properties.TileId) 
            {
                this.N1Tile = this.N2Tile;
                this.N2Tile = this.N3Tile;
                this.N3Tile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.N2Tile.properties.nextTileId);
            }
            // If no next tile, or next tile is not the expected one (returned to track) update
            else  
            {
                this.N1Tile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.CurrTile.properties.nextTileId);
                this.N2Tile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.N1Tile.properties.nextTileId);
                this.N3Tile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.N2Tile.properties.nextTileId);
            }
        }
        // else
        // {
        //     this.N1Tile = this.N2Tile = this.N3Tile = null;
        // }
 







    }

    update(SceneObj, time, delta) {
        
        this.UpdateState(SceneObj);
        this.CheckIfSlipping();
        
        this.CheckLapEnd(SceneObj, delta);

        this.UpdateInput();

        this.HandleInput(this.Input.Up, this.Input.Down, this.Input.Left, this.Input.Right, delta, delta / 1000);
        this.ApplyForces(SceneObj);
        this.RenderSlipMarks();
      //  this.AdjustCamera(SceneObj);
    }
}
