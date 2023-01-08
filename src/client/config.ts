import BootScene from './scenes/BootScene'
import PreloadScene from './scenes/PreloadScene'
import MainScene from './scenes/MainScene'
import GameOverScene from './scenes/GameOverScene'

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth * window.devicePixelRatio,
  height: window.innerHeight * window.devicePixelRatio,
  backgroundColor: '#ffffff',
  scale: {
    parent: 'phaser-game',
    mode: Phaser.Scale.NONE,
    width: window.innerWidth * window.devicePixelRatio,
    height: window.innerHeight * window.devicePixelRatio
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: [BootScene, PreloadScene, MainScene, GameOverScene],
};
export default config
