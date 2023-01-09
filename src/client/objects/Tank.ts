import Bullet from '../../model/Bullet'
import BulletExplode from '../../model/BulletExplode'
import Player from '../../model/Player'
import TankModel from '../../model/TankModel'
import { WeaponsEnum } from '../../model/WeaponsEnum'
import GeometryService from '../../services/GeometryService'
import ProgressBar from './ProgressBar'

const TWEEN_IMORTALITY_DURATION = 300
const SOUND_DISTANCE = 1000

const playDistanceSound = (sound: Phaser.Sound.BaseSound, tankModel: TankModel, actualPlayerTankModel: TankModel): void => {
    const playersDistance = Phaser.Math.Distance.Between(
        tankModel.center.x,
        tankModel.center.y,
        actualPlayerTankModel.center.x,
        actualPlayerTankModel.center.y
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
    explosionAnimation: Phaser.GameObjects.Sprite
    exhaustHeavySound: Phaser.Sound.BaseSound
    exhaustGranadeSound: Phaser.Sound.BaseSound
    impactSound: Phaser.Sound.BaseSound

    constructor(scene: Phaser.Scene, tankModel: TankModel, player: Player|null) {
		super(scene, tankModel.center.x, tankModel.center.y)

        this.tankBody = scene.add
            .sprite(0, 0, 'tank-body-' + tankModel.color)
            .setOrigin(0.5, 0.5)
            .setSize(tankModel.width, tankModel.height)
            .setDepth(1)
        this.tankBody.angle = tankModel.angle

        this.tankTurret = scene.add
            .sprite(
                tankModel.turretPosition.x,
                tankModel.turretPosition.y,
                'tank-turret-' + tankModel.color
            )
            .setOrigin(tankModel.turretOrigin.x, tankModel.turretOrigin.y)
            .setDepth(2)
        this.tankTurret.angle = tankModel.turretAngle

        this.hpProgressBar = new ProgressBar(scene, 0, -100, 100, 10)
            .setDepth(3)
        scene.add.existing(this.hpProgressBar)

        // TODO: what to do in `UNKOWN` situation?
        this.nameLabel = scene.add
            .text(0, -80, player ? player.name : 'UNKNOWN', {backgroundColor: 'rgba(0, 0, 0, .5)'})
            .setOrigin(0.5, 0)
            .setDepth(3)

        this.exhaustAnimation = this.scene.add.sprite(0, 0, 'exhaust0')
            .setDepth(4)
        this.exhaustAnimation.visible = false

        this.impactAnimation = this.scene.add.sprite(0, 0, 'impact0')
            .setDepth(1)
        this.impactAnimation.visible = false

        this.explosionAnimation = this.scene.add.sprite(0, 0, 'explosion0')
            .setDepth(4)
            .setOrigin(0.5, 0.5)
        this.explosionAnimation.visible = false

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
            this.explosionAnimation,
        ])

        this.updateImortality(tankModel)
    }

    update(tankModel: TankModel, player: Player|null): void {
        this.move(tankModel)
        this.updateImortality(tankModel)
        // TODO: what to do in `UNKOWN` situation?
        this.nameLabel.setText(player ? player.name : 'UNKNOWN')
        this.hpProgressBar.progress(tankModel.hp / tankModel.maxHp)
    }

    move(tankModel: TankModel): void {
        this.x = tankModel.center.x
        this.y = tankModel.center.y

        if (this.tankBody.angle !== tankModel.angle) {
            this.tankBody.angle = tankModel.angle

            this.tankTurret.x = tankModel.turretPosition.x
            this.tankTurret.y = tankModel.turretPosition.y

            this.updateImpactAnimationPosition()
        }

        this.tankTurret.angle = tankModel.turretAngle
        this.setExhaustAnimationPosition(tankModel)
    }

    updateImortality(tankModel: TankModel): void {
        if (tankModel.immortalityTtl === null && this.tweenImmortality?.isPlaying()) {
            this.tweenImmortality.complete()
            this.tweenImmortality = null
        } else if (tankModel.immortalityTtl !== null && this.tweenImmortality === null) {
            this.tweenImmortality = this.scene.tweens.add({
                targets: [this],
                ease: 'Sine.easeInOut',
                duration: 300,
                delay: 0,
                repeat: tankModel.immortalityTtl / TWEEN_IMORTALITY_DURATION,
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

    exhaust(tankModel: TankModel, bullet: Bullet, actualPlayerTankModel: TankModel|null): void {
        this.setExhaustAnimationPosition(tankModel)
        this.exhaustAnimation.visible = true
        this.exhaustAnimation.play('exhaust', false)
        this.exhaustAnimation.once('animationcomplete', () => {
            this.exhaustAnimation.visible = false
        })

        if (actualPlayerTankModel !== null) {
            const sound = this.getSoundForWeapon(bullet.type)
            playDistanceSound(sound, tankModel, actualPlayerTankModel)
        }
    }

    setExhaustAnimationPosition(tankModel: TankModel): void {
        if (! this.exhaustAnimation.active) {
            return
        }
        this.exhaustAnimation.setPosition(tankModel.barrelEndPosition.x, tankModel.barrelEndPosition.y)
        this.exhaustAnimation.angle = tankModel.turretAngle + 180 // image is upside down
    }

    impact(bulletExplode: BulletExplode, tankModel: TankModel, actualPlayerTankModel: TankModel|null): void {
        const x = bulletExplode.x - this.x
        const y = bulletExplode.y - this.y
        this.impactAnimation.setPosition(x, y)
        this.impactAnimation.angle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(0, 0, x, y)) + 90
        this.impactAnimation.visible = true
        this.impactAnimation.play('shot-impact', false)
        this.impactAnimation.once('animationcomplete', () => {
            this.impactAnimation.visible = false
        })

        if (actualPlayerTankModel !== null) {
            playDistanceSound(this.impactSound, tankModel, actualPlayerTankModel)
        }
    }

    updateImpactAnimationPosition(): void {
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

    destroyed(): void {
        this.setAlpha(0.7)
        this.explosionAnimation.visible = true
        this.explosionAnimation.play('explosion', false)
        this.explosionAnimation.once('animationcomplete', () => {
            this.explosionAnimation.visible = false
        })
    }
}
