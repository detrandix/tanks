import PreloadScene from './scenes/PreloadScene'
import MainScene from './scenes/MainScene'
import GameOverScene from './scenes/GameOverScene'
import Utils from '../services/Utils'

const normalizedDPR = Utils.getNormalizedDPR()
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
  scene: [PreloadScene, MainScene, GameOverScene],
};
export default config
