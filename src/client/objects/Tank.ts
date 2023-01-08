import Bullet from '../../model/Bullet'
import BulletExplode from '../../model/BulletExplode'
import Player from '../../model/Player'
import { WeaponsEnum } from '../../model/WeaponsEnum'
import GeometryService from '../../services/GeometryService'
import ProgressBar from './ProgressBar'

const TWEEN_IMORTALITY_DURATION = 300
const SOUND_DISTANCE = 1000

const playDistanceSound = (sound: Phaser.Sound.BaseSound, player: Player, actualPlayer: Player) => {
    const playersDistance = Phaser.Math.Distance.Between(
        player.tankModel.center.x,
        player.tankModel.center.y,
        actualPlayer.tankModel.center.x,
        actualPlayer.tankModel.center.y
    )

    let normalizedVolume = 1 - (playersDistance / SOUND_DISTANCE)
    if (normalizedVolume > 0) {
        sound.play({volume: normalizedVolume})
    }
}

export default class Tank extends Phaser.GameObjects.Container {
    tankBody: Phaser.GameObjects.Sprite
    tankTurret: Phaser.GameObjects.Sprite
    hpProgressBar: ProgressBar
    tweenImmortality: Phaser.Tweens.Tween|null = null
    nameLabel: Phaser.GameObjects.Text
    exhaustAnimation: Phaser.GameObjects.Sprite
    impactAnimation: Phaser.GameObjects.Sprite
    exhaustHeavySound: Phaser.Sound.BaseSound
    exhaustGranadeSound: Phaser.Sound.BaseSound
    impactSound: Phaser.Sound.BaseSound

    constructor(scene: Phaser.Scene, player: Player) {
		super(scene, player.tankModel.center.x, player.tankModel.center.y)

        this.tankBody = scene.add
            .sprite(0, 0, 'tank-body-' + player.color)
            .setOrigin(0.5, 0.5)
            .setSize(player.tankModel.width, player.tankModel.height)
            .setDepth(1)
        this.tankBody.angle = player.tankModel.angle

        this.tankTurret = scene.add
            .sprite(
                player.tankModel.turretPosition.x,
                player.tankModel.turretPosition.y,
                'tank-turret-' + player.color
            )
            .setOrigin(player.tankModel.turretOrigin.x, player.tankModel.turretOrigin.y)
            .setDepth(2)
        this.tankTurret.angle = player.tankModel.turretAngle

        this.hpProgressBar = new ProgressBar(scene, 0, -100, 100, 10)
            .setDepth(3)
        scene.add.existing(this.hpProgressBar)

        this.nameLabel = scene.add
            .text(0, -80, player.name, {backgroundColor: 'rgba(0, 0, 0, .5)'})
            .setOrigin(0.5, 0)
            .setDepth(3)

        this.exhaustAnimation = this.scene.add.sprite(0, 0, 'exhaust0')
            .setDepth(4)
        this.exhaustAnimation.visible = false

        this.impactAnimation = this.scene.add.sprite(0, 0, 'impact0')
            .setDepth(1)
        this.impactAnimation.visible = false

        this.exhaustHeavySound = this.scene.sound.add('heavy-shot', {loop: false})
        this.exhaustGranadeSound = this.scene.sound.add('granade-shot', {loop: false})
        this.impactSound = this.scene.sound.add('hit', {loop: false})

        this.add([
            this.tankBody,
            this.tankTurret,
            this.hpProgressBar,
            this.nameLabel,
            this.exhaustAnimation,
            this.impactAnimation,
        ])

        this.updateImortality(player)
    }

    update(player: Player) {
        this.move(player)
        this.updateImortality(player)
        this.nameLabel.setText(player.name)
        this.hpProgressBar.progress(player.hp / player.maxHp)
    }

    move(player: Player) {
        this.x = player.tankModel.center.x
        this.y = player.tankModel.center.y

        if (this.tankBody.angle !== player.tankModel.angle) {
            this.tankBody.angle = player.tankModel.angle

            this.tankTurret.x = player.tankModel.turretPosition.x
            this.tankTurret.y = player.tankModel.turretPosition.y

            this.updateImpactAnimationPosition()
        }

        this.tankTurret.angle = player.tankModel.turretAngle
        this.setExhaustAnimationPosition(player)
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

    getSoundForWeapon(weapon: WeaponsEnum): Phaser.Sound.BaseSound {
        switch (weapon as WeaponsEnum) {
            case WeaponsEnum.Heavy: return this.exhaustHeavySound
            case WeaponsEnum.Granade: return this.exhaustGranadeSound
            default: throw `Unknown reapon ${weapon}`
        }
    }

    exhaust(player: Player, bullet: Bullet, actualPlayer: Player) {
        this.setExhaustAnimationPosition(player)
        this.exhaustAnimation.visible = true
        this.exhaustAnimation.play('exhaust', false)
        this.exhaustAnimation.once('animationcomplete', () => {
            this.exhaustAnimation.visible = false
        })

        const sound = this.getSoundForWeapon(bullet.type)
        playDistanceSound(sound, player, actualPlayer)
    }

    setExhaustAnimationPosition(player: Player) {
        this.exhaustAnimation.setPosition(player.tankModel.barrelEndPosition.x, player.tankModel.barrelEndPosition.y)
        this.exhaustAnimation.angle = player.tankModel.turretAngle + 180 // image is upside down
    }

    impact(bulletExplode: BulletExplode, player: Player, actualPlayer: Player) {
        const x = bulletExplode.x - this.x
        const y = bulletExplode.y - this.y
        this.impactAnimation.setPosition(x, y)
        this.impactAnimation.angle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(0, 0, x, y)) + 90
        this.impactAnimation.visible = true
        this.impactAnimation.play('shot-impact', false)
        this.impactAnimation.once('animationcomplete', () => {
            this.impactAnimation.visible = false
        })

        playDistanceSound(this.impactSound, player, actualPlayer)
    }

    updateImpactAnimationPosition() {
        const angleDiff = this.tankBody.angle - this.impactAnimation.angle
        this.impactAnimation.angle = this.tankBody.angle
        const newPoint = GeometryService.rotatePointAround(
            {x: this.impactAnimation.x, y: this.impactAnimation.y},
            {x: 0, y: 0},
            GeometryService.deg2rad(angleDiff)
        )
        this.impactAnimation.x = newPoint.x
        this.impactAnimation.y = newPoint.y
    }
}
