export default class ProgressBar extends Phaser.GameObjects.Container {
    progressColor: number;
    progressBox: Phaser.GameObjects.Graphics;
    progressBar: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, borderColor = 0x000000, progressColor = 0x00ff00, percentage = 1) {
        super(scene, x, y)

        this.width = width
        this.height = height
        this.progressColor = progressColor

        this.progressBox = scene.add.graphics();
        this.progressBar = scene.add.graphics();

        this.progressBox
            .fillStyle(borderColor, 0.8)
            .fillRect(-width/2, 0, width, height)

        this.progress(percentage)

        this.add(this.progressBox)
        this.add(this.progressBar)
    }

    progress(percentage: number) {
        this.progressBar
            .clear()
            .fillStyle(this.progressColor, 1)
            .fillRect(-this.width/2 + 1, 1, (this.width - 2) * percentage, this.height - 2)
    }
}
