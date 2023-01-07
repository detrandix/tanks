import Player from '../../model/Player'
import ProgressBar from './ProgressBar'

const TWEEN_IMORTALITY_DURATION = 300

export default class Tank extends Phaser.GameObjects.Container {
    tankBody: Phaser.GameObjects.Sprite
    tankTurret: Phaser.GameObjects.Sprite
    hpProgressBar: ProgressBar
    tweenImmortality: Phaser.Tweens.Tween|null = null

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

        this.updateImortality(player)
    }

    update(player: Player) {
        this.move(player)
        this.updateImortality(player)
    }

    move(player: Player) {
        this.x = player.x
        this.y = player.y

        if (this.tankBody.angle !== player.bodyRotation) {
            this.tankBody.angle = player.bodyRotation

            this.tankTurret.x = 50 * Math.cos(Phaser.Math.DegToRad(player.bodyRotation + 90))
            this.tankTurret.y = 50 * Math.sin(Phaser.Math.DegToRad(player.bodyRotation + 90))
        }

        this.tankTurret.angle = player.turretRotation
    }

    updateImortality(player: Player) {
        if (player.immortalityTtl === null && this.tweenImmortality?.isPlaying()) {
            this.tweenImmortality.complete()
            this.tweenImmortality = null
        } else if (player.immortalityTtl !== null && this.tweenImmortality === null) {
            this.tweenImmortality = this.scene.tweens.add({
                targets: [this],
                ease: 'Sine.easeInOut',
                duration: 300,
                delay: 0,
                repeat: player.immortalityTtl / TWEEN_IMORTALITY_DURATION,
                yoyo: true,
                alpha: 0.8,
            })
            this.tweenImmortality.addListener('complete', () => {
                this.alpha = 1
            })
        }
    }
}
