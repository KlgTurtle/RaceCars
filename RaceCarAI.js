class RaceCarAI extends RaceCar
{
    constructor(SceneObj, x, y, TileSize, TileScale, raceTrack, ImageNameCar, ImageNameArrow)
    {
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

        this.ReturnToTrackJob = null;

        this.Car.angle += 180;
    }

    IsHuman()
    {
        return false;
    }

    PressUp()
    {
        this.Input.Up = true;
        this.Input.Down = false;
    }

    PressDown()
    {
        this.Input.Up = false;
        this.Input.Down = true;
    }

    PressRight()
    {
        this.Input.Right = true;
        this.Input.Left = false;
    }

    PressLeft()
    {
        this.Input.Right = false;
        this.Input.Left = true;
    }

    ClearInput()
    {
        this.PrevInput.Right = this.Input.Right;
        this.PrevInput.Left = this.Input.Left;
        this.PrevInput.Up = this.Input.Up;
        this.PrevInput.Down = this.Input.Down;

        this.Input.Right = this.Input.Left = this.Input.Up = this.Input.Down = false;
    }

    TurnToPoint(x, y, tolerance)
    {
        this.TurnVector.set(x - this.Car.x, y - this.Car.y).normalize();
        return this.DoTurn(this.TurnVector, tolerance);
    }

    DoTurn(TurnVector, tolerance)
    {
        var CosAngleWithRoad = TurnVector.dot(this.ForwardVec);
        var TurnRequired = false;

        if (CosAngleWithRoad < 1 - tolerance)
        {
            TurnRequired = true;

            // Rotate the car vector slightly clockwise and calculate new dot with road
            this.CarForwardVec.setToPolar(this.ForwardVec.clone().angle() + 0.01, 1);
            var CosAngleWithRoad2 = TurnVector.dot(this.CarForwardVec);

            // IF we're closer to 1 now it means we're more aligned, so press right (right == clockwise)
            if (CosAngleWithRoad2 > CosAngleWithRoad)
            {
                this.PressRight();
            }
            else
            {
                this.PressLeft();
            }
        }

        return TurnRequired;
    }
    UpdateInputOnTrack()
    {


        this.ReturningToTrack = false;

        // Slow down before a turn
        if ((this.N1Tile.properties.turn && this.ForwardSpeed > 25))
        {
            this.PressDown();
        }

        else if (!(this.N2Tile.properties.turn && this.ForwardSpeed > 35) &&
            !(this.N3Tile.properties.turn && this.ForwardSpeed > 45)) 
        {
            this.PressUp();
        }

        var turnFactor;
        if (this.N1Tile.properties.turn)
        {
            this.TurnVector.set(this.N2Tile.getCenterX() - this.N1Tile.getCenterX(),
                this.N2Tile.getCenterY() - this.N1Tile.getCenterY()).normalize();
            turnFactor = 0.1;

        }
        else if (!this.CurrTile.properties.turn &&
            !this.N1Tile.properties.turn &&
            !this.N2Tile.properties.turn) //&&
        //   !this.N3Tile.properties.turn)
        {
            this.WorkRect = this.Car.getBounds();
            Phaser.Geom.Rectangle.Inflate(this.WorkRect, this.Car.width / 2, this.Car.height / 2);
            if (!Phaser.Geom.Rectangle.ContainsRect(this.CurrTile.getBounds(), this.WorkRect))
            {

                //   this.TurnVector.set(this.N2Tile.getCenterX() - this.Car.x,
                //       this.N2Tile.getCenterY() - this.Car.y).normalize();
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
        // if (this.ReturningToTrack)
        // {
        //     var N1ReturningTile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.ReturningToTile.properties.nextTileId);
        //     this.TrackDir.set(N1ReturningTile.getCenterX() - this.ReturningToTile.getCenterX(),
        //     N1ReturningTile.getCenterY() - this.ReturningToTile.getCenterY()).normalize();

        //     // dot will range between -1 and 1, so normalize so its between 0 and 1
        //     var Alignment = (this.TrackDir.dot(this.ForwardVec) + 1) / 2;
        //     var Dist = Phaser.Math.Distance.Between(this.Car.x, this.Car.y,
        //         this.ReturningToTile.getCenterX(), this.ReturningToTile.getCenterY());
        //     if (Dist > this.ReturningToTileDist + 20)
        //     {
        //         this.PressUp();
        //         this.PressRight();
        //         this.ReturningToTrack = false;
        //     }
        //     else {
        //         var PerformingTurn = false;
        //         var CarRect = this.Car.getBounds();
        //         var TileRect = this.ReturningToTile.getBounds();
        //         var IntRect = Phaser.Geom.Rectangle.Intersection(CarRect, TileRect);
        //         if (Dist/this.ForwardSpeed < 100)
        //         {
        //             PerformingTurn = this.DoTurn(this.TrackDir, (IntRect.width != 0 || IntRect.height != 0) ? 0.01 : 0.1);
        //             if (this.ForwardSpeed > 20) 
        //             {
        //                 this.PressDown();
        //             }
        //         }

        //         /* && ((Dist < (this.TileSize * this.TileScale / Alignment) && this.ForwardSpeed > 5) ||
        //             (Dist < (2 * this.TileSize * this.TileScale / Alignment) && this.ForwardSpeed > 15) ||
        //             (Dist < (3 * this.TileSize * this.TileScale / Alignment) && this.ForwardSpeed > 25)) */
        //         if (PerformingTurn) {
        //             this.PressDown();
        //         }
        //         else {
        //             this.PressUp();
        //         }



        //     }

        //     this.ReturningToTileDist = Dist;
        // }
        if (this.ReturnToTrackJob == null)
        {
            this.TrackDir.set(this.N3Tile.getCenterX() - this.N2Tile.getCenterX(), this.N3Tile.getCenterY() - this.N2Tile.getCenterY()).normalize();
            this.ReturnToTrackJob = new CarGoToPoint(this, this.N3Tile.getBounds(),
                this.TrackDir);
        }

        var IsFinished = this.ReturnToTrackJob.Execute();
        if (IsFinished)
        {
            this.ReturnToTrackJob = null;
        }


        // this.CarForwardVec.copy(this.ForwardVec).scale(15000);
        // var DirOK = false;

        // this.SearchLine.setTo(this.Car.x, this.Car.y, this.Car.x + this.CarForwardVec.x, this.Car.y + this.CarForwardVec.y);
        // var FoundTiles = this.raceTrack.TrackTileLayer.getTilesWithinShape(this.SearchLine, { isNotEmpty: true });
        // for (var j = 0; j < FoundTiles.length; ++j) {
        //     if (/*!FoundTiles[j].properties.turn &&*/ (
        //         FoundTiles[j].properties.TileId == this.LastValidTile.properties.TileId ||
        //         FoundTiles[j].properties.TileId == this.N1Tile.properties.TileId ||
        //         FoundTiles[j].properties.TileId == this.N2Tile.properties.TileId || 
        //         FoundTiles[j].properties.TileId == this.N3Tile.properties.TileId )) 
        //     {
        //         this.PressUp();
        //         DirOK = true;
        //         this.SeekingReturn = false;
        //         this.ReturningToTrack = true;

        //         this.ReturningToTile = FoundTiles[j];
        //         this.ReturningToTileDist = Phaser.Math.Distance.Between(this.Car.x, this.Car.y,
        //             this.ReturningToTile.getCenterX(), this.ReturningToTile.getCenterY());
        //         break;
        //     }
        // }





        //     if (!DirOK) {

        //         this.PressUp();
        //         //this.PressRight();


        //  //       var N1LastValidTile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == this.LastValidTile.properties.nextTileId);
        //        // var N2LastValidTile = this.raceTrack.TrackTileLayer.findTile(t => t.properties.TileId == N1LastValidTile.properties.nextTileId);
        //         this.TrackDir.set(this.LastValidTile.getCenterX() - this.Car.x,
        //         this.LastValidTile.getCenterY() - this.Car.y).normalize();
        //         if (!this.SeekingReturn)
        //         {
        //             this.DoTurn(this.TrackDir, 0);
        //             this.SeekingReturn = true;
        //         }
        //         else 
        //         {
        //             this.PrevInput.Right ? this.PressRight() : this.PressLeft();
        //         }



        // }
        //}
    }
    UpdateInput()
    {


        this.ClearInput();

        var TooCloseToEdge = false;

        const tolerance = 0.01;
        if (this.ForwardSpeed < 0.1 && (Math.abs(this.ForwardVec.x) < 0 + tolerance || Math.abs(this.ForwardVec.y) < 0 + tolerance))
        {
            this.FrontOfCarVec.set(this.Car.x, this.Car.y).add(this.ForwardVec.clone().scale(this.Car.width * 15));
            this.worldRect.setTo(0, 0, worldWidth, worldHeight);

            if (!this.worldRect.contains(this.FrontOfCarVec.x, this.FrontOfCarVec.y))
            {
                this.PressDown();
                TooCloseToEdge = true;
            }
        }

        if (!TooCloseToEdge)
        {
            if (this.CurrTile != null && this.OnTrack && this.ReturnToTrackJob == null)
            {
                this.UpdateInputOnTrack();
            }
            else
            {
                this.UpdateInputOffTrack();
            }
        }
    }


    UpdateState(SceneObj)
    {
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

    update(SceneObj, time, delta)
    {

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

class CarGoToPoint
{
    constructor(RaceCar, TargetRect, AlignVec) 
    {
        this.RaceCar = RaceCar;
        //this.Target = new Phaser.Math.Vector2(x, y);
        this.RaceCarCircle = new Phaser.Geom.Circle(this.RaceCar.Car.x, this.RaceCar.Car.y, this.RaceCar.Car.width);
        this.RaceCarLine = new Phaser.Geom.Line;
        this.TargetRect = TargetRect;
        this.TargetRectX2 = Phaser.Geom.Rectangle.Clone(this.TargetRect);
        this.TargetRectX2.x -= this.TargetRectX2.width / 2;
        this.TargetRectX2.y -= this.TargetRectX2.height / 2;
        this.TargetRectX2.width *= 2;
        this.TargetRectX2.height *= 2;
        this.Finished = false;
        this.AlignVec = AlignVec;
        //   this.DistToPoint = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, x, y);
      //  this.DistToPoint = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, x, y);
   //     this.DistOfApproach = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, x, y);
        this.Aligning = false;

    }

    IsFinished()
    {
        return this.Finished;
    }

    Execute()
    {
        // this.RaceCarCircle.setPosition(this.RaceCar.Car.x, this.RaceCar.Car.y);
        // if (this.RaceCarCircle.contains(this.Target.x, this.Target.y))
        // {
        //     this.Finished = true;
        // }
        // else
        // {
     //   var CurrDist = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, this.Target.x, this.Target.y);

        if (!this.Aligning)
        {
            // Check that we're not inside the target rectangle yet
            if (!Phaser.Geom.Rectangle.Contains(this.TargetRect, this.RaceCar.Car.x, this.RaceCar.Car.y))/*CurrDist > this.DistOfApproach*/
            {
             //   this.RaceCar.GraphicsPool[this.RaceCar.GraphicsPoolCurr].fillRectShape(this.TargetRectX2);
                // Check if we're on the outer perimeter (Target Rectangle blown up by a factor of 2)
                if (Phaser.Geom.Rectangle.Contains(this.TargetRectX2, this.RaceCar.Car.x, this.RaceCar.Car.y))
                {
                    this.RaceCar.PressUp();

                    // Project a line in the direction car is heading, that's the size of the distance to the target rectangle
                    this.RaceCarLine.setTo(this.RaceCar.Car.x, this.RaceCar.Car.y, this.TargetRect.x, this.TargetRect.y);

                    // If that line does not intersect with our target rectangle, keep turning until it does.
                    if (!Phaser.Geom.Intersects.LineToRectangle(this.RaceCarLine, this.TargetRect))
                    {
                        this.RaceCar.TurnToPoint(this.TargetRect.x, this.TargetRect.y, 0.01);
                    }
                   
                }
                else
                {
                    //this.RaceCar.GraphicsPool[this.RaceCar.GraphicsPoolCurr].fillRectShape(this.TargetRect);
                    // if we are moving farther from our destination, keep turning and update maximal distance

                    //   this.DistOfApproach = CurrDist;
                    this.RaceCar.TurnToPoint(this.TargetRect.x, this.TargetRect.y, 0.01);


                    this.RaceCar.PressUp();
                }
            }
            // Inside the target rectangle. Start alignment phase.
            else //if (CurrDist > this.RaceCarCircle.radius * 2) 
            {
                if (this.RaceCar.ForwardSpeed > 25)
                {
                    this.RaceCar.PressDown();
                }
                else 
                {
                    this.RaceCar.PressUp();
                }
                
                var CurrAlignmnet = this.RaceCar.ForwardVec.dot(this.AlignVec);

            //     if ((CurrDist >= this.RaceCarCircle.radius * 3) && CurrAlignmnet < 0.8)
            //     {
            //         this.RaceCar.DoTurn(this.AlignVec, 0.01);
            //     }
            //     else if (CurrDist > this.RaceCarCircle.radius)
            //     {
            //         this.RaceCar.TurnToPoint(this.Target.x, this.Target.y, 0.01);
            //     }
                
                

            // }
            // // we are a radius distance away, start alignment phase
            // else 
            // {
                this.RaceCar.DoTurn(this.AlignVec, 0.01);
                this.RaceCar.PressUp();
                this.Aligning = true;
            }

            this.Finished = false;
        }
        else
        {
            var TurnDone = this.RaceCar.DoTurn(this.AlignVec, 0.01);
            if (this.RaceCar.ForwardSpeed > 20)
            {
                this.RaceCar.PressDown();
            }
            else 
            {
                this.RaceCar.PressUp();
            }
            this.RaceCarCircle.setTo(this.RaceCar.Car.x, this.RaceCar.Car.y, this.RaceCar.Car.width);

            // if we're getting too far away again or we're aligned enough, mark us as finished
            if (!Phaser.Geom.Intersects.CircleToRectangle(this.RaceCarCircle, this.TargetRect) || !TurnDone)
            {
                this.Finished = true;
            }
        }
        //  }

        return this.Finished;
    }
}
