import config from './config'

export default class Game extends Phaser.Game {
  constructor() {
    super(config)
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    const actualWidth = this.scale.gameSize.width
    const actualHeight = this.scale.gameSize.height
    const newWidth = window.innerWidth * window.devicePixelRatio
    const newHeight = window.innerHeight * window.devicePixelRatio
    const diffWidth = newWidth - actualWidth
    const diffHeight = newHeight - actualHeight
    this.scale.resize(newWidth, newHeight)
    for (let scene of this.scene.scenes) {
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
