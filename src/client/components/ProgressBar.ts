import NumberService from '../../services/NumberService'

export default interface ProgressBarOptions {
    initPercentage: number
    borderColor: number
    progressColor: number
    showLabel: boolean
    labelFontSize: number
    labelFontFamily: string
    labelColor: string
    progressBarOffset: number
}

export default class ProgressBar extends Phaser.GameObjects.Container {
    progressColor: number
    progressBox: Phaser.GameObjects.Graphics
    progressBar: Phaser.GameObjects.Graphics
    progressLabel: Phaser.GameObjects.Text
    progressBarOffset: number
    lastPercentage: number

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        options: Partial<ProgressBarOptions> = {},
    ) {
        super(scene, x, y)

        this.width = width
        this.height = height
        this.progressColor = options.progressColor || 0x00ff00
        this.progressBarOffset = options.progressBarOffset || 1

        this.progressBox = scene.add.graphics()
        this.progressBar = scene.add.graphics()

        this.progressBox.fillStyle(options.borderColor || 0x000000, 0.8).fillRect(-width / 2, 0, width, height)

        const labelFontSize = options.labelFontSize || height - 2 * this.progressBarOffset - 4
        this.progressLabel = scene.add
            .text(0, height / 2, '', {
                fontFamily: 'monospace',
                fontSize: labelFontSize + 'px',
                color: options.labelColor || 'white',
            })
            .setOrigin(0.5, 0.5)
        this.progressLabel.setVisible(options.showLabel || false)

        const initPercentage = options.initPercentage || 1
        this.lastPercentage = -initPercentage // some different value, to force update
        this.progress(initPercentage)

        this.add([this.progressBox, this.progressBar, this.progressLabel])
    }

    progress(percentage: number) {
        if (percentage === this.lastPercentage) {
            return
        }

        const normalizedPercentage = Math.max(0, percentage)
        this.progressBar
            .clear()
            .fillStyle(this.progressColor, 1)
            .fillRect(
                -this.width / 2 + this.progressBarOffset,
                this.progressBarOffset,
                (this.width - 2 * this.progressBarOffset) * normalizedPercentage,
                this.height - 2 * this.progressBarOffset,
            )
        this.progressLabel.setText(NumberService.roundToOneDecimalPlace(100 * normalizedPercentage) + '%')
        this.lastPercentage = percentage
    }
}
