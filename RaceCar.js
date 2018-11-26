class RaceCar {
    constructor(SceneObj, x, y, TileSize, TileScale, raceTrack, ImageNameCar, ImageNameArrow) {
        this.Car = SceneObj.matter.add.image(x + RaceCar.StartLineDeltaX + (TileSize / 2) * TileScale,
            y + RaceCar.StartLineDeltaY + (TileSize / 2) * TileScale, ImageNameCar);
        this.Car.setFrictionAir(0.03);

        this.TileSize = TileSize;
        this.TileScale = TileScale;
        //  this.Car.setFrictionStatic(1);
        this.Car.setMass(3000);
        this.WheelDir = 0;
        this.Car.setScale(1.8);
        this.Car.depth = 1;
        //  this.Car.body.setAngularDrag(0.1);
        // this.OffTrackArrow.setScrollFactor(0.99,0.99);
        //   this.OffTrackArrow.setScale(0.25);
        this.raceTrack = raceTrack;
        this.NearLapEnd = false;
        this.LapsCompleted = 0;
        this.Place = 0;
        this.Power = 0;
        this.CompletedRace = false;
        this.TimeLeftTrack = 0;
        this.LastValidTile = null;
        this.LastValidX = this.Car.x;
        this.LastValidY = this.Car.y;
        this.OnTrack = true;
        this.alphaFactor = 1;
        this.OffTrackTimerId = 0;
        this.Slipping = false;
        this.LastSlipPoint1 = null;
        this.LastSlipPoint2 = null;
        this.GraphicsPool = [];
        this.GraphicsPoolSize = 5;
        this.GraphicsPoolCurr = 0;
        this.ImpulseCorrectionStarted = false;
        this.ImpulseCorrectionDelta = 0;
        this.OriginalAngularVel = 0;

        this.CurrTile = null;
        this.RearLeft = this.Car.getTopLeft();
        this.RearRight = this.Car.getBottomLeft();
        this.FrontLeft = this.Car.getTopRight();
        this.FrontRight = this.Car.getBottomRight();
        this.FrontCenter = new Phaser.Math.Vector2;
        this.BackCenter = new Phaser.Math.Vector2;
        this.SidewayVec = new Phaser.Math.Vector2;
        this.ForwardVec = new Phaser.Math.Vector2;
        this.CarVel = new Phaser.Math.Vector2;
        this.SidewaySpeed = 0;
        this.ForwardSpeed = 0;

        this.Lmode = false;

        for (var i = 0; i < this.GraphicsPoolSize; ++i) {
            this.GraphicsPool[i] = SceneObj.add.graphics({ fillStyle: { color: 0x000000 }, lineStyle: { color: 0x000000, width: 7 } });
        }

        if (RaceCar.StartLineDeltaX == RaceCar.StartLineDeltaY) {
            RaceCar.StartLineDeltaY -= (TileSize / 2) * TileScale;
        }
        else {
            RaceCar.StartLineDeltaX -= (TileSize / 2) * TileScale;
        }
        SceneObj.events.once('offTrack', this.handleOffTrack, this);
        //SceneObj.
    }
    ShowOffTrackArrow(RaceCarObj, SceneObj) {
        // vector directed from the car to the last valid tile
        var vDir = new Phaser.Math.Vector2(RaceCarObj.LastValidTile.getCenterX() - RaceCarObj.Car.x,
            RaceCarObj.LastValidTile.getCenterY() - RaceCarObj.Car.y);
        vDir.normalize();
        var vDirPerp = new Phaser.Math.Vector2(-vDir.y, vDir.x);
        var trX = 0, trY = 0;
        var trVec;
        var vDirAngle = vDir.angle();
        // TOP
        if (vDirAngle >= 5 * Math.PI / 4 && vDirAngle <= 7 * Math.PI / 4) {
            trY = 0;
            var factor = (SceneObj.game.config.height / 2) / vDir.y;
            trX = SceneObj.game.config.width / 2 - vDir.x * factor;
        }
        // RIGHT
        else if (vDirAngle >= 7 * Math.PI / 4 || vDirAngle <= Math.PI / 4) {
            trX = SceneObj.game.config.width;
            var factor = (SceneObj.game.config.width / 2) / vDir.x;
            trY = SceneObj.game.config.height / 2 + vDir.y * factor;
        }
        // BOTTOM
        else if (vDirAngle >= Math.PI / 4 && vDirAngle <= 3 * Math.PI / 4) {
            trY = SceneObj.game.config.height;
            var factor = (SceneObj.game.config.height / 2) / vDir.y;
            trX = SceneObj.game.config.width / 2 + vDir.x * factor;
        }
        // LEFT (or as Sherlock Holmes said...)
        else // if (vDirAngle >= 3*Math.PI/4 && vDirAngle <= 5*Math.PI/4)
        {
            trX = 0;
            var factor = (SceneObj.game.config.width / 2) / vDir.x;
            trY = SceneObj.game.config.height / 2 - vDir.y * factor;
        }
        //  trX = Math.min(Math.max(trX, 0), SceneObj.game.config.width);
        //  trY = Math.min(Math.max(trY, 0), SceneObj.game.config.height);
        vDir.scale(40);
        vDirPerp.scale(10);
        SceneObj.events.emit('ShowOffTrackArrow', trX, trY, vDirAngle);
    }
    handleOffTrackInterval(RaceCarObj, SceneObj) {
        if (!RaceCarObj.OnTrack && RaceCarObj.LastValidTile) {
            if ((RaceCarObj.alphaFactor > 0 && RaceCarObj.LastValidTile.alpha >= 1) ||
                (RaceCarObj.alphaFactor < 0 && RaceCarObj.LastValidTile.alpha <= 0.7)) {
                RaceCarObj.alphaFactor *= -1;
            }
            RaceCarObj.LastValidTile.setAlpha(RaceCarObj.LastValidTile.alpha + 0.05 * RaceCarObj.alphaFactor);

            var LastValidTileRect = RaceCarObj.LastValidTile.getBounds(SceneObj.cameras.main);
            if (!Phaser.Geom.Rectangle.Overlaps(SceneObj.cameras.main.worldView, LastValidTileRect)) {
                RaceCarObj.ShowOffTrackArrow(RaceCarObj, SceneObj);
            }
            else {
                SceneObj.events.emit('HideOffTrackArrow');
            }
        }
        else {
            RaceCarObj.LastValidTile.clearAlpha();
            clearInterval(RaceCarObj.OffTrackTimerId);
            SceneObj.events.emit('HideOffTrackArrow');
            SceneObj.events.once('offTrack', RaceCarObj.handleOffTrack, RaceCarObj);
        }
    }
    handleOffTrack(RaceCarObj, SceneObj) {
        RaceCarObj.OffTrackTimerId = setInterval(RaceCarObj.handleOffTrackInterval, 50, RaceCarObj, SceneObj);
    }
    debug(SceneObj) {
        // text.setPosition(100 - SceneObj.cameras.main.x, 100 - SceneObj.cameras.main.y);
        // text.setText([
        //     'position.x: ' + this.Car.body.position.x,
        //     'position.y: ' + this.Car.body.position.y,
        //     'velocity.x: ' + this.Car.body.velocity.x,
        //     'velocity.y: ' + this.Car.body.velocity.y,
        //     'camrea.x:' + SceneObj.cameras.main.x,
        //     'camera.y:' + SceneObj.cameras.main.y
        // ]);
    }
    checkTileValidity(SceneObj, T) {

        var factor = 1;
        if (T != null && ((this.LastValidTile == null) ||
            (this.LastValidTile.properties.TileId == T.properties.TileId) ||
            ((this.LastValidTile.properties.TileId != T.properties.TileId) &&
                this.LastValidTile.properties.nextTileId == T.properties.TileId))) {
            if (this.OnTrack) {
                this.LastValidTile = T;
                this.LastValidX = this.Car.x;
                this.LastValidY = this.Car.y;
            }
            else if (this.LastValidTile.properties.TileId == T.properties.TileId) {
                this.OnTrack = true;
            }
            return factor;
        }
        factor = (T == null) ? factor*0.75 : factor;
        if (this.LastValidTile != null) {
            // We're not on track, if we're far enough we'll trigger the "off track" event.
            if (T == null) {
                this.OnTrack = false;
                var FoundTiles = trackLayer.getTilesWithinShape(new Phaser.Geom.Circle(this.Car.x, this.Car.y, SceneObj.game.config.height / 6),
                    { isNotEmpty: true });
                if (FoundTiles.length == 0) {
                    SceneObj.events.emit('offTrack', this, SceneObj);
                }
                else {

                    var N1ValidTile = trackLayer.findTile(t => t.properties.TileId == this.LastValidTile.properties.nextTileId);
                    var DistToNext = Phaser.Math.Distance.Between(this.Car.x, this.Car.y,
                        N1ValidTile.getCenterX(), N1ValidTile.getCenterY());


                    // if we're closer to the next valid tile than to the last valid one and also close enough, update last valid tile
                    if (DistToNext < this.TileSize * this.TileScale * 1.5) {
                        this.LastValidTile.clearAlpha();
                        this.LastValidTile = N1ValidTile;
                    }

                }
            }
            // We're on track, make sure that we're on a valid tile, or on a close enough tile, otherwise trigger "off track" event.
            else {
                var FoundTiles = trackLayer.getTilesWithinShape(
                    new Phaser.Geom.Circle(this.LastValidTile.getCenterX(), this.LastValidTile.getCenterY(),
                        SceneObj.game.config.height / 6),
                    { isNotEmpty: true });


                var tileOffset = (T.properties.TileId - this.LastValidTile.properties.TileId);
                var distToStart1 = T.properties.TileId;
                var distToStart2 = this.MaxTileId - this.LastValidTile.properties.TileId;
                if ((tileOffset > 0 && tileOffset < 6) || (tileOffset < 0 && distToStart1 + distToStart2 < 6)) {
                    this.LastValidTile.clearAlpha();
                    this.LastValidTile = T;
                    this.OnTrack = true;
                }
                else {
                    this.OnTrack = false;
                    SceneObj.events.emit('offTrack', this, SceneObj);
                }
            }
        }
        return factor;
    }

    CheckIfSlipping() {
        if (this.CurrTile == null) {
            this.Slipping = false;
            this.LastSlipPoint1 = null;
            this.LastSlipPoint2 = null;
            return;
        }

        // var v = CurrTile.tileset[0].getTileData(CurrTile.index);
        var CurrTileRect = this.CurrTile.getBounds();
        var TileContainsBackWheels = Phaser.Geom.Rectangle.Contains(CurrTileRect, this.RearLeft.x, this.RearLeft.y) &&
            Phaser.Geom.Rectangle.Contains(CurrTileRect, this.RearRight.x, this.RearRight.y);
        if ((TileContainsBackWheels) && (this.ForwardSpeed > 0) && (Math.abs(this.SidewaySpeed) > 1) && 
        (Math.abs(this.SidewaySpeed) >= this.ForwardSpeed)) {
            if (!this.Slipping) {
                this.GraphicsPool[this.GraphicsPoolCurr].clear();
            }
            this.Slipping = true;
        }
        else {

            this.Slipping = false;
            this.LastSlipPoint1 = null;
            this.LastSlipPoint2 = null;
        }
    }

    RenderSlipMarks() {
        if (this.Slipping) {
            if (this.LastSlipPoint1 == null) {
                this.LastSlipPoint1 = this.RearLeft;
                this.LastSlipPoint2 = this.RearRight;
            }
            else if (this.LastSlipPoint1 != this.RearLeft || this.LastSlipPoint2 != this.RearRight) {
                this.GraphicsPool[this.GraphicsPoolCurr].strokePoints([this.RearLeft, this.LastSlipPoint1]);
                this.GraphicsPool[this.GraphicsPoolCurr].strokePoints([this.RearRight, this.LastSlipPoint2]);
                this.LastSlipPoint1 = this.RearLeft;
                this.LastSlipPoint2 = this.RearRight;
                this.GraphicsPoolCurr = (this.GraphicsPoolCurr + 1) % this.GraphicsPoolSize;
            }
        }
    }

    UpdateState()
    {
        this.CurrTile = trackLayer.getTileAt(trackLayer.worldToTileX(this.Car.x), trackLayer.worldToTileY(this.Car.y));
        this.RearLeft = this.Car.getTopLeft();
        this.RearRight = this.Car.getBottomLeft();
        this.FrontLeft = this.Car.getTopRight();
        this.FrontRight = this.Car.getBottomRight();
        this.FrontCenter.setTo((this.FrontLeft.x + this.FrontRight.x) / 2, (this.FrontLeft.y + this.FrontRight.y) / 2);
        this.BackCenter.setTo((this.RearLeft.x + this.RearRight.x) / 2,(this.RearLeft.y + this.RearRight.y) / 2);
        this.SidewayVec.copy(this.FrontRight).subtract(this.FrontLeft).normalize();
        this.ForwardVec.copy(this.FrontLeft).subtract(this.RearLeft).normalize();
        this.CarVel.setTo(this.Car.body.velocity.x, this.Car.body.velocity.y);
        this.SidewaySpeed = this.CarVel.dot(this.SidewayVec);
        this.ForwardSpeed = this.CarVel.dot(this.ForwardVec);
    }

    update(SceneObj, time, delta) 
    {
        var deltaSecs = delta / 1000;

       

        


        this.UpdateState();

 



        this.CheckIfSlipping();

        var PrevValidTile = this.LastValidTile;
        var powerFactor = this.checkTileValidity(SceneObj, this.CurrTile);
        
        if (this.NearLapEnd &&
            ((this.raceTrack.GetStartLineAxis() == 'x' && this.Car.x >= this.raceTrack.StartLineTile.getRight()) ||
                (this.raceTrack.GetStartLineAxis() == 'y' && this.Car.y >= this.raceTrack.StartLineTile.getBottom()))) {
            this.NearLapEnd = false;
            SceneObj.events.emit('LapEnd');
            SceneObj.events.emit('LapStart');
        }
        else if (this.LastValidTile.properties.TileId >= 1 &&
            (PrevValidTile.properties.TileId >= this.MaxTileId - 5 || PrevValidTile.properties.TileId == 0)) {
            this.NearLapEnd = true;
        }


     //   this.HandleKeyInput()
        if (cursors.left.isDown) {
            this.WheelDir = Math.min(this.WheelDir +  delta/50, 0.6);
        }
        else if (cursors.right.isDown) {
            this.WheelDir = Math.max(this.WheelDir -  delta/50, -0.6);
        }
        else 
        {
            this.WheelDir *= 0.0001*deltaSecs;
        }

        if (this.WheelDir != 0) {
            var steeringFactor = (this.Power >= 0) ? 1 : -1;
            this.Car.applyForceFrom(this.FrontCenter, 
                this.SidewayVec.clone().scale(-steeringFactor * this.Car.body.speed * this.Car.body.speed * this.WheelDir/50));
        }


        if (cursors.up.isDown) {
            this.Power = Math.min(this.ForwardSpeed > 0 ? this.Power + 30 * deltaSecs : this.Power + 10 * deltaSecs, 55);
        }
        else if (cursors.down.isDown) {
            this.Power = Math.max(-10, this.ForwardSpeed > 0 ? this.Power - 25 * deltaSecs : this.Power - 10 * deltaSecs);
        }
         else if (this.Power != 0) {
             var PowerDamp = this.ForwardSpeed > 1 ? 8 * deltaSecs : 30 * deltaSecs;

            this.Power = PowerDamp > Math.abs(this.Power) ? 0 : this.Power-Math.sign(this.Power) * PowerDamp;
         }

        if (!cursors.left.isDown && !cursors.right.isDown && cursors.up.isDown && this.WheelDir != 0 &&
            Math.abs(this.Car.body.angularVelocity) > 0.02) {

            this.WheelDir /= 2;
            if (Math.abs(this.WheelDir) < 0.001) {
                this.WheelDir = 0;
            }

            if (!this.ImpulseCorrectionStarted) {
                this.ImpulseCorrectionStarted = true;
                this.OriginalAngularVel = this.Car.body.angularVelocity;

            }

            this.ImpulseCorrectionDelta += delta;
            var newAngularVelocity = Math.sign(this.OriginalAngularVel) *
                Math.max(0, 
                    Math.abs(this.OriginalAngularVel) - this.ImpulseCorrectionDelta/500 /** Math.abs(this.OriginalAngularVel) / 30*/);
            this.Car.setAngularVelocity(newAngularVelocity);





        }
        else {
            this.ImpulseCorrectionStarted = false;
            this.ImpulseCorrectionDelta = 0;
        }




        
        this.Car.applyForceFrom(this.BackCenter, this.ForwardVec.clone().scale(powerFactor * this.Power));
        if (this.Car.body.speed > 0.01) 
        {
            var newZoom = Math.max(0.29, 0.5 - this.Car.body.speed / 100);
            if (Math.abs(SceneObj.cameras.main.zoom - newZoom) > 0.001) 
            {
                SceneObj.cameras.main.zoom += (newZoom - SceneObj.cameras.main.zoom) > 0 ? 0.001 : -0.001;
            }
            else {
                SceneObj.cameras.main.zoom = newZoom;
            }
        }


        if (this.Lmode) 
        {
            var newAngle = 270 - this.ForwardVec.angle() * (180 / Math.PI);

            let UIScene = SceneObj.scene.get('UIScene');


            SceneObj.cameras.main.setAngle(newAngle);
            UIScene.cameras.main.setAngle(newAngle);
        }

        this.RenderSlipMarks();


    }
}
RaceCar.StartLineDeltaX = 0;
RaceCar.StartLineDeltaY = 0;