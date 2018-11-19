class RaceCar {
    constructor(SceneObj, x, y, TileSize, TileScale, raceTrack, ImageNameCar, ImageNameArrow) {
        this.Car = SceneObj.matter.add.image(x + RaceCar.StartLineDeltaX + (TileSize / 2) * TileScale,
            y + RaceCar.StartLineDeltaY + (TileSize / 2) * TileScale, ImageNameCar);
        this.Car.setFrictionAir(0.03);
        
        this.TileSize = TileSize;
        this.TileScale = TileScale;
     //  this.Car.setFrictionStatic(1);
        this.Car.setMass(1.5);
        this.WheelDir = 0;
        this.Car.setScale(1.8);
      //  this.Car.body.setAngularDrag(0.1);
        // this.OffTrackArrow.setScrollFactor(0.99,0.99);
        //   this.OffTrackArrow.setScale(0.25);
        this.raceTrack  = raceTrack;
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
      //  this.graphics = SceneObj.add.graphics({ fillStyle: { color: 0x00ff00 }, lineStyle: { color: 0x00ff00 } });
        this.offTrackPointer = new Phaser.Geom.Triangle;
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
        var vDir = new Phaser.Math.Vector2(RaceCarObj.LastValidX - RaceCarObj.Car.x,
            RaceCarObj.LastValidY - RaceCarObj.Car.y);
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
            if (!Phaser.Geom.Rectangle.Contains(SceneObj.cameras.main.worldView, RaceCarObj.LastValidX, RaceCarObj.LastValidY)) {
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
     //   this.graphics.clear();
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
        factor = (T == null) ? factor/2 : factor;
        if (this.LastValidTile != null) {
            // We're not on track, if we're far enough we'll trigger the "off track" event.
            if (T == null) {
                this.OnTrack = false;
                var FoundTiles = trackLayer.getTilesWithinShape(new Phaser.Geom.Circle(this.Car.x, this.Car.y, SceneObj.game.config.height / 6),
                    { isNotEmpty: true });
                if (FoundTiles.length == 0) 
                {
                    SceneObj.events.emit('offTrack', this, SceneObj);
                }
                else
                {

                    var N1ValidTile = trackLayer.findTile(t => t.properties.TileId == this.LastValidTile.properties.nextTileId);
                    var DistToNext = Phaser.Math.Distance.Between(this.Car.x, this.Car.y, 
                    N1ValidTile.getCenterX(), N1ValidTile.getCenterY());
                  

                    // if we're closer to the next valid tile than to the last valid one and also close enough, update last valid tile
                    if (DistToNext < this.TileSize*this.TileScale*1.5)
                    {
                        this.LastValidTile.clearAlpha();
                        this.LastValidTile = N1ValidTile;
                    }
                    else debugger;
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
                if ((tileOffset > 0 && tileOffset < 6) || (tileOffset < 0 && distToStart1+distToStart2 < 6)) 
                {
                    this.LastValidTile.clearAlpha();
                    this.LastValidTile = T;
                    this.OnTrack = true;
                }
                else
                {
                    this.OnTrack = false;
                    SceneObj.events.emit('offTrack', this, SceneObj);
                }
            }
        }
        return factor;
    }
    update(SceneObj) {
        this.debug(SceneObj);
        var origX = this.Car.x;
        var origY = this.Car.y;
        var CurrTile = trackLayer.getTileAt(trackLayer.worldToTileX(origX), trackLayer.worldToTileY(origY));
        var point1 = this.Car.getTopLeft();
        var point2 = this.Car.getBottomLeft();
        var point3 = this.Car.getTopRight();
        var point4 = this.Car.getBottomRight();
        var FrontCenter = new Phaser.Math.Vector2({x: (point3.x + point4.x) / 2, y: (point3.y + point4.y) / 2});
        
        var FrontL2R = new Phaser.Math.Vector2().copy(point4).subtract(point3).normalize();

        var Front2Back1 = new Phaser.Math.Vector2().copy(point3).subtract(point1).normalize();
        var Front2Back2 = new Phaser.Math.Vector2().copy(point4).subtract(point2).normalize();



        var PrevValidTile = this.LastValidTile;
        var powerFactor = this.checkTileValidity(SceneObj, CurrTile);
        if (this.NearLapEnd && 
            ((this.raceTrack.GetStartLineAxis() == 'x' && this.Car.x >= this.raceTrack.StartLineTile.getRight()) ||
             (this.raceTrack.GetStartLineAxis() == 'y' && this.Car.y >= this.raceTrack.StartLineTile.getBottom())))
        {
            this.NearLapEnd = false;
            SceneObj.events.emit('LapEnd');
            SceneObj.events.emit('LapStart');
        }
        else if (this.LastValidTile.properties.TileId >= 1 && 
            (PrevValidTile.properties.TileId >= this.MaxTileId-5 || PrevValidTile.properties.TileId == 0) )
        {
            this.NearLapEnd = true;   
        }
        //this.Car.body.drag = dragFactor;
 
        var factor = 0.00005;
        if (cursors.left.isDown)
        {
            this.WheelDir = Math.min(this.WheelDir + 0.25, 1);
        }
        if (cursors.right.isDown)
        {
            this.WheelDir = Math.max(this.WheelDir - 0.25, -1);
        }
        if (this.WheelDir != 0)
        {
            var steeringFactor = 1;
            if (this.Power < 0)
            {
                steeringFactor = -1;
            }
            this.Car.applyForceFrom(FrontCenter, FrontL2R.clone().scale(-steeringFactor*this.Car.body.speed*this.Car.body.speed*this.WheelDir/200000));

        }
   

        if (cursors.up.isDown) 
        {
            this.Power = Math.min(this.Power + 3, 25);
           // PowerDiff = 1;

        }
        else if (cursors.down.isDown) {
            this.Power = Math.max(-18, this.Power - 2);
        }
        else if (this.Power > 0)
        {
            this.Power /= 1.01;
            //PowerDiff = -1;
        }
        if (!cursors.left.isDown && !cursors.right.isDown && this.WheelDir != 0)
            {

                
                
                    this.WheelDir /= 2000;
                    if (Math.abs(this.WheelDir) < 0.0001)
                    {
                        this.WheelDir = 0;
                    }
                

            }

         this.Car.applyForceFrom(point1,Front2Back1.clone().scale(powerFactor*this.Power*0.0005));
         this.Car.applyForceFrom(point2, Front2Back2.clone().scale(powerFactor*this.Power*0.0005));

          if (this.Car.body.speed > 0.01)
          {
            var newZoom = Math.max(0.29, 0.5 - this.Car.body.speed/100);
            if (Math.abs(SceneObj.cameras.main.zoom - newZoom) > 0.001)
            {
                SceneObj.cameras.main.zoom += (newZoom - SceneObj.cameras.main.zoom) > 0 ? 0.001 : -0.001;
            }
            else
            {
                SceneObj.cameras.main.zoom =  newZoom;
            }
          }
        // SceneObj.cameras.main.x = ((game.config.width / 2 - this.Car.x < 0) && (this.Car.x - (worldWidth - game.config.width / 2) < 0)) ? game.config.width / 2 - this.Car.x : SceneObj.cameras.main.x;
        //   SceneObj.cameras.main.y = ((game.config.height / 2 - this.Car.y < 0) && (this.Car.y - (worldHeight - game.config.height / 2) < 0)) ? game.config.height / 2 - this.Car.y : SceneObj.cameras.main.y;
    }
}
RaceCar.StartLineDeltaX = 0;
RaceCar.StartLineDeltaY = 0;