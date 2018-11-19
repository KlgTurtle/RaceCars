class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
        this.OffTrackArrow = null;
    }
    preload() {
        this.load.image('GreenArrow', 'assets/Spritesheets/new/AssetPack/arrowGreen.png');
    }
    create() {

        this.OffTrackArrow = this.matter.add.sprite(0, 0, 'GreenArrow');
        this.OffTrackArrow.setActive(false);
        this.OffTrackArrow.setVisible(false);
        this.LapTime = this.add.text(50, 50, '', { font: '32px Courier', fill: '#00ff00' , stroke: '#00ff00' , strokeThickness: 0.8});
        this.LastLapTime = this.add.text(50, 50+64, '', { font: '32px Courier', fill: '#00ff00', stroke: '#00ff00' ,
                                             strokeThickness: 0.8});
        this.LapStarted = false;
        this.LapTimeFloat = 0;
        this.LapsFinished = 0;
        this.BestLapTime = 0;

        //  Grab a reference to the Game Scene
        let ourGame = this.scene.get('GameScene');
        //  Listen for events from it
        ourGame.events.on('ShowOffTrackArrow', function (trX, trY, vDirAngle) {
            this.OffTrackArrow.setVisible(true);
            let gameheight = this.game.config.height;
            let gamewidth = this.game.config.width;
            this.OffTrackArrow.x = Math.min(gamewidth - this.OffTrackArrow.width / 2, Math.max(this.OffTrackArrow.width / 2, trX));
            this.OffTrackArrow.y = Math.min(gameheight - this.OffTrackArrow.height / 2, Math.max(this.OffTrackArrow.height / 2, trY));
            this.OffTrackArrow.setRotation(Math.PI / 2 + vDirAngle);
        }, this);
        ourGame.events.on('HideOffTrackArrow', function () {
            this.OffTrackArrow.setVisible(false);
        }, this);

        ourGame.events.on('LapStart', function()
        {
            this.LapTimeFloat = 0;
            this.LapStarted = true;
        }, this);

        ourGame.events.on('LapEnd', function() 
        {
            this.LapStarted = false;

            if (this.BestLapTime == 0 || (this.LapTimeFloat < this.BestLapTime))
            {
                this.BestLapTime = this.LapTimeFloat;
            }

            if (this.BestLapTime > 0)
            {
                this.LastLapTime.setText('Best Lap: ' + Number.parseFloat(this.BestLapTime/1000).toFixed(2) + 's');
            }
        }, this);

        
    }
    update(time, delta)
    {
        if (this.LapStarted)
        {
            this.LapTimeFloat += delta;
            this.LapTime.setText('Lap Time: ' + Number.parseFloat(this.LapTimeFloat/1000).toFixed(2) +'s');
        }
    }
}