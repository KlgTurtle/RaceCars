class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
        this.OffTrackArrow = null;
        this.ShowDebug = false;


        this.ToggleDebug = function()
        {
            this.ShowDebug = !this.ShowDebug;
            this.DebugText.setText('');
        }
        this.debug = function () 
        {
            if (this.ShowDebug) 
            {

                let ourGame = this.scene.get('GameScene');
                let GameCar = ourGame.GetCar();
                if (typeof GameCar === 'undefined') return;
                var point1 = GameCar.Car.getTopLeft();
                //   var point2 = GameCar.Car.getBottomLeft();
                var point3 = GameCar.Car.getTopRight();
                var point4 = GameCar.Car.getBottomRight();

                var FrontL2R = new Phaser.Math.Vector2().copy(point4).subtract(point3).normalize();

                var Front2Back = new Phaser.Math.Vector2().copy(point3).subtract(point1).normalize();


                var CarVel = new Phaser.Math.Vector2({ x: GameCar.Car.body.velocity.x, y: GameCar.Car.body.velocity.y });
                var SidewaySpeed = CarVel.dot(FrontL2R);
                var ForwardSpeed = CarVel.dot(Front2Back);
                this.DebugText.setText(['Sideways Speed: ' + Number.parseFloat(SidewaySpeed).toFixed(2),
                'Forward Speed: ' + Number.parseFloat(ForwardSpeed).toFixed(2),
                'Angular Velocity: ' + Number.parseFloat(GameCar.Car.body.angularVelocity).toFixed(2),
                'Power:' + Number.parseFloat(GameCar.Power).toFixed(2)]);

           

            }
            else
            {
                this.ForwardForceDebug.setVisible(false);
                this.SidewayForceDebug.setVisible(false);
                this.DebugText.setText('');
            }
        }

    }
    preload() {
        this.load.image('GreenArrow', 'assets/textures/arrowGreen.png');
    }
    create() {
        this.ForwardForceDebug = this.add.line(50, 50, 150, 150, 300, 300, 0x00ff00);
        this.ForwardForceDebug.setDepth(3);
        this.SidewayForceDebug = new Phaser.GameObjects.Line(this);
        this.OffTrackArrow = this.matter.add.sprite(0, 0, 'GreenArrow');
        this.OffTrackArrow.setActive(false);
        this.OffTrackArrow.setVisible(false);
        this.LapTime = this.add.text(50, 50, '', { font: '32px Courier', fill: '#00ff00', stroke: '#00ff00', strokeThickness: 0.8 });
        this.LastLapTime = this.add.text(50, 50 + 64, '', {
            font: '32px Courier', fill: '#00ff00', stroke: '#00ff00',
            strokeThickness: 0.8
        });
        this.DebugText = this.add.text(50, 50 + 64 * 2, '', {
            font: '28px Courier', fill: '#00ff00', stroke: '#00ff00',
            strokeThickness: 0.8
        });
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

        ourGame.events.on('LapStart', function () {
            this.LapTimeFloat = 0;
            this.LapStarted = true;
        }, this);

        ourGame.events.on('LapEnd', function () {
            this.LapStarted = false;

            if (this.BestLapTime == 0 || (this.LapTimeFloat < this.BestLapTime)) {
                this.BestLapTime = this.LapTimeFloat;
            }

            if (this.BestLapTime > 0) {
                this.LastLapTime.setText('Best Lap: ' + Number.parseFloat(this.BestLapTime / 1000).toFixed(2) + 's');
            }
        }, this);


    }

    update(time, delta) {
        this.debug();
        let ourGame = this.scene.get('GameScene');


        this.LapTime.setRotation(-ourGame.cameras.main.rotation);
        this.LastLapTime.setRotation(-ourGame.cameras.main.rotation);


        if (this.LapStarted) {
            this.LapTimeFloat += delta;
            this.LapTime.setText('Lap Time: ' + Number.parseFloat(this.LapTimeFloat / 1000).toFixed(2) + 's');
        }
    }
}