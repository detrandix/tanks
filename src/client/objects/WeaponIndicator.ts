export default class WeaponIndicator extends Phaser.GameObjects.Container {
    backgroundCircle: Phaser.GameObjects.Graphics
    arc: Phaser.GameObjects.Graphics
    image: Phaser.GameObjects.Sprite
    actualPercentage: number

	constructor(scene: Phaser.Scene, x: number, y: number, weapon: string)
	{
		super(scene, x, y)
        this.setScrollFactor(0)
        this.setDepth(100)

        this.backgroundCircle = scene.add.graphics()
            .fillStyle(0x999999, 1)
            .fillCircle(0, 0, 50)
            .closePath()

        this.arc = scene.add.graphics()
        this.setTimeToReload(1)
        this.actualPercentage = 1

        this.image = scene.add.sprite(0, 0, weapon)

        this.add([
            this.backgroundCircle,
            this.arc,
            this.image
        ])
	}

    setTimeToReload(percentage: number) {
        if (this.actualPercentage === percentage) {
            return
        }

        const alpha = percentage < 1 ? percentage / 1.2 : 1
        this.arc
            .clear()
            .fillStyle(0xffff00, alpha)
            .slice(0, 0, 50, Phaser.Math.DegToRad(percentage*360), Phaser.Math.DegToRad(0), true)
            .fillPath()
        this.actualPercentage = percentage
    }
}
