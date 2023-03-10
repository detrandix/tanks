import Utils from '../services/Utils'
import config from './config'

export default class Game extends Phaser.Game {
    constructor() {
        super(config)
        window.addEventListener('resize', () => this.resize())
    }

    resize() {
        const normalizedDPR = Utils.getNormalizedDPR()

        const actualWidth = this.scale.gameSize.width
        const actualHeight = this.scale.gameSize.height
        const newWidth = window.innerWidth * normalizedDPR
        const newHeight = window.innerHeight * normalizedDPR
        const diffWidth = newWidth - actualWidth
        const diffHeight = newHeight - actualHeight
        this.scale.resize(newWidth, newHeight)
        for (const scene of this.scene.scenes) {
            if (scene.scene.settings.active) {
                // Scale the camera
                scene.cameras.main.setViewport(0, 0, newWidth, newHeight)
                if (typeof scene['resize'] === 'function') {
                    scene.resize(diffWidth, diffHeight)
                }
            }
        }
    }
}
