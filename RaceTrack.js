class RaceTrack {
            constructor(TrackTileLayer) {
                this.TrackTileLayer = TrackTileLayer;
                this.MaxTileId = -1;
                this.StartLineTile = this.TrackTileLayer.findTile(t => t.properties.startLine == true);
                // StartLineTile.tint = 0xaabbcc;
                var CurrDirX, CurrDirY;
                if (this.StartLineTile.properties.direction == 'x') {
                    CurrDirX = 1;
                    CurrDirY = 0;
                }
                else {
                    CurrDirX = 0;
                    CurrDirY = -1;
                }
                this.StartLineTile.properties.TileId = 0;
                var PrevTile = this.StartLineTile;
                var CurrTile = this.TrackTileLayer.getTileAt(this.StartLineTile.x + CurrDirX, this.StartLineTile.y + CurrDirY);
                var bLooped = false;
                do {
                    if (CurrTile.properties.TileId == -1) {
                        CurrTile.properties.TileId = PrevTile.properties.TileId + 1;
                    }
                    else {
                        this.MaxTileId = PrevTile.properties.TileId;
                        bLooped = true;
                    }
                    PrevTile.properties.nextTileId = CurrTile.properties.TileId;
                    PrevTile = CurrTile;
                    if (PrevTile.properties.turn) {
                        var temp = CurrDirX;
                        CurrDirX = CurrDirY;
                        CurrDirY = temp;
                    }
                    CurrTile = this.TrackTileLayer.getTileAt(PrevTile.x + CurrDirX, PrevTile.y + CurrDirY);
                    if (CurrTile == null) {
                        CurrDirX *= -1;
                        CurrDirY *= -1;
                        CurrTile = this.TrackTileLayer.getTileAt(PrevTile.x + CurrDirX, PrevTile.y + CurrDirY);
                    }
                } while (!bLooped)

                this.GetStartLineAxis = function() 
                { 
                    return this.StartLineTile.properties.direction; 
                }
            }

           
        }