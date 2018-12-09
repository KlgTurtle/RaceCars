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
        this.LastReturnToTileId;

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

    KeepSpeed(speed)
    {
        if (this.ForwardSpeed > speed)
        {
            this.PressDown();
        }
        else
        {
            this.PressUp();
        }
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
       
        if (this.ReturnToTrackJob == null)
        {
            this.TrackDir.set(this.N3Tile.getCenterX() - this.N2Tile.getCenterX(), this.N3Tile.getCenterY() - this.N2Tile.getCenterY()).normalize();
            this.ReturnToTrackJob = new CarGoToLastValidTile(this,
                this.TrackDir);
            this.LastReturnToTileId = this.LastValidTile.properties.TileId;
        }

        var IsFinished = this.ReturnToTrackJob.Execute();
        if (IsFinished)
        {
            this.ReturnToTrackJob = null;
        }


  
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
            if (this.CurrTile != null && 
               (this.OnTrack || this.CurrTile.properties.TileId >= this.LastReturnToTileId) && 
                this.ReturnToTrackJob == null)
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
        if (this.OnTrack || (this.CurrTile && this.CurrTile.properties.TileId >= this.LastReturnToTileId)) 
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

const SeekingTargetState = 0;
const ApproachingState = 1;
const AligningState = 2;
class CarGoToLastValidTile
{
    constructor(RaceCar, AlignVec) 
    {
        this.RaceCar = RaceCar;
        //this.Target = new Phaser.Math.Vector2(x, y);
        this.RaceCarCircle = new Phaser.Geom.Circle(this.RaceCar.Car.x, this.RaceCar.Car.y, this.RaceCar.Car.width);
        this.RaceCarLine = new Phaser.Geom.Line;
        this.TargetRect = this.RaceCar.LastValidTile.getBounds();
        this.TargetRectX2 = Phaser.Geom.Rectangle.Clone(this.TargetRect);
        this.TargetRectX2.x -= this.TargetRectX2.width/2;
        this.TargetRectX2.y -= this.TargetRectX2.height/2;
        this.TargetRectX2.width *= 2;
        this.TargetRectX2.height *= 2;
        this.Finished = false;
        this.AlignVec = AlignVec;
        this.WorkVec = new Phaser.Math.Vector2;
      //  this.TargetTileId = this.RaceCar.LastValidTile.properties.TileId;
           this.DistToTarget = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, this.TargetRect.x, this.TargetRect.y);
      //  this.DistToPoint = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, x, y);
   //     this.DistOfApproach = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, x, y);
      
        this.State = SeekingTargetState;


    }

    IsFinished()
    {
        return this.Finished;
    }

    Execute()
    {
        this.Finished = false;
        
        switch (this.State)
        {
            case SeekingTargetState:
            {
                this.RaceCar.KeepSpeed(40);
                this.WorkVec.set(this.TargetRect.x - this.RaceCar.Car.x, this.TargetRect.y - this.RaceCar.Car.y).normalize();
                if (this.WorkVec.dot(this.RaceCar.ForwardVec) >= 0.99)
                {
                 //   this.RaceCar.PressUp();
                    this.State = ApproachingState;
                    this.DistToTarget = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, this.TargetRect.x, this.TargetRect.y);
                }
                else
                {
                  //  this.RaceCar.PressUp();
                    this.RaceCar.TurnToPoint(this.TargetRect.x, this.TargetRect.y, 0.01);
                }
                break;
            }
            case ApproachingState:
            {       
                this.RaceCar.KeepSpeed(25);
                var CurrDistToTarget = Phaser.Math.Distance.Between(this.RaceCar.Car.x, this.RaceCar.Car.y, this.TargetRect.x, this.TargetRect.y);
                if (CurrDistToTarget <= this.DistToTarget + 10)
                {
                    this.DistToTarget = CurrDistToTarget;
                    if (Phaser.Geom.Intersects.RectangleToRectangle(this.RaceCar.Car.getBounds(), this.TargetRect))
                    {
                        this.State = AligningState
                    }
                }
                else
                {
                    this.State = SeekingTargetState; 
                }
                break;
            }
            case AligningState:
            {
                this.RaceCar.KeepSpeed(20);
                var TurnDone = this.RaceCar.DoTurn(this.AlignVec, 0.01);
             //   this.RaceCar.KeepSpeed(20); 
                this.RaceCarCircle.setTo(this.RaceCar.Car.x, this.RaceCar.Car.y, this.RaceCar.Car.width);

                // if we're getting too far away again or we're aligned enough, mark us as finished
                if (!Phaser.Geom.Intersects.CircleToRectangle(this.RaceCarCircle, this.TargetRect) || !TurnDone)
                {
                    this.Finished = true;
                }
                break;
             }
        }
       
        return this.Finished;
    }
}
