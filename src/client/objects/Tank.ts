import Player from '../../model/Player'
import ProgressBar from './ProgressBar'

export default class Tank extends Phaser.GameObjects.Container {
    tankBody: Phaser.GameObjects.Sprite
    tankTurret: Phaser.GameObjects.Sprite
    hpProgressBar: ProgressBar

    constructor(scene: Phaser.Scene, player: Player) {
		super(scene, player.x, player.y)

        this.tankBody = scene.add
            .sprite(0, 0, 'tank-body-' + player.color)
            .setOrigin(0.5, 0.5)
            .setSize(164, 256)

        this.tankTurret = scene.add
            .sprite(
                // TODO - make this somehow better
                50 * Math.cos(Phaser.Math.DegToRad(player.bodyRotation + 90)),
                50 * Math.sin(Phaser.Math.DegToRad(player.bodyRotation + 90)),
                'tank-turret-' + player.color)
            .setOrigin(0.5, 0.8)


        this.hpProgressBar = new ProgressBar(scene, 0, -100, 100, 10)
        scene.add.existing(this.hpProgressBar)

        this.add(this.tankBody)
        this.add(this.tankTurret)
        this.add(this.hpProgressBar)
    }

    move(player: Player) {
        this.x = player.x
        this.y = player.y
        this.tankBody.angle = player.bodyRotation

        this.tankTurret.x = 50 * Math.cos(Phaser.Math.DegToRad(player.bodyRotation + 90))
        this.tankTurret.y = 50 * Math.sin(Phaser.Math.DegToRad(player.bodyRotation + 90))
        this.tankTurret.angle = player.turretRotation
    }
}
