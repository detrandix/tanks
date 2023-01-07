import Player from '../../model/Player'
import ProgressBar from './ProgressBar'

const TWEEN_IMORTALITY_DURATION = 300

export default class Tank extends Phaser.GameObjects.Container {
    tankBody: Phaser.GameObjects.Sprite
    tankTurret: Phaser.GameObjects.Sprite
    hpProgressBar: ProgressBar
    tweenImmortality: Phaser.Tweens.Tween|null = null
    nameLabel: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene, player: Player) {
		super(scene, player.x, player.y)

        this.tankBody = scene.add
            .sprite(0, 0, 'tank-body-' + player.color)
            .setOrigin(0.5, 0.5)
            .setSize(player.tankModel.width, player.tankModel.height)
        this.tankBody.angle = player.tankModel.angle

        this.tankTurret = scene.add
            .sprite(
                player.tankModel.turretPosition.x,
                player.tankModel.turretPosition.y,
                'tank-turret-' + player.color
            )
            .setOrigin(player.tankModel.turretOrigin.x, player.tankModel.turretOrigin.y)
        this.tankTurret.angle = player.tankModel.turretAngle

        this.hpProgressBar = new ProgressBar(scene, 0, -100, 100, 10)
        scene.add.existing(this.hpProgressBar)

        this.nameLabel = scene.add
            .text(0, -80, player.name, {backgroundColor: 'rgba(0, 0, 0, .5)'})
            .setOrigin(0.5, 0)

        this.add([
            this.tankBody,
            this.tankTurret,
            this.hpProgressBar,
            this.nameLabel,
        ])

        this.updateImortality(player)
    }

    update(player: Player) {
        this.move(player)
        this.updateImortality(player)
        this.nameLabel.setText(player.name)
    }

    move(player: Player) {
        this.x = player.tankModel.center.x
        this.y = player.tankModel.center.y

        if (this.tankBody.angle !== player.tankModel.angle) {
            this.tankBody.angle = player.tankModel.angle

            this.tankTurret.x = player.tankModel.turretPosition.x
            this.tankTurret.y = player.tankModel.turretPosition.y
        }

        this.tankTurret.angle = player.tankModel.turretAngle
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
