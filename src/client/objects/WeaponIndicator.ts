export default class WeaponIndicator extends Phaser.GameObjects.Container {
    arc: Phaser.GameObjects.Graphics
    sprite: Phaser.GameObjects.Sprite

	constructor(scene: Phaser.Scene, x: number, y: number, weapon: string)
	{
		super(scene, x, y)
        this.setScrollFactor(0)

        this.arc = scene.add.graphics()
        this.setTimeToReload(1)

        this.sprite = scene.add.sprite(0, 0, weapon)

        this.add(this.arc)
        this.add(this.sprite)
	}

    setTimeToReload(percentage: number) {
        this.arc
            .clear()
            .fillStyle(0xffff00, 1)
            .slice(0, 0, 50, Phaser.Math.DegToRad(percentage*360), Phaser.Math.DegToRad(0), true)
            .fillPath()
        if (percentage < 1) {
            this.setAlpha(percentage / 1.2)
        } else {
            this.clearAlpha()
        }
    }
}
