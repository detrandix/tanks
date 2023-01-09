import BootScene from './scenes/BootScene'
import PreloadScene from './scenes/PreloadScene'
import MainScene from './scenes/MainScene'
import GameOverScene from './scenes/GameOverScene'

const getNormalizedDPR = (): number => {
  const dpr = window.devicePixelRatio
  if (dpr === 1 || dpr === 2) {
    return dpr
  }
  return 2 // actually we will support only retina display
}

const normalizedDPR = getNormalizedDPR()
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth * normalizedDPR,
  height: window.innerHeight * normalizedDPR,
  backgroundColor: '#000000',
  scale: {
    parent: 'phaser-game',
    mode: Phaser.Scale.NONE,
    width: window.innerWidth * normalizedDPR,
    height: window.innerHeight * normalizedDPR,
    zoom: 1 / normalizedDPR
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
