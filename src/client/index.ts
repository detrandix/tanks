import 'phaser'
import resize from './components/resize'
import Game from './Game'
import FullScreenEvent from './components/FullScreenEvent'

window.addEventListener('DOMContentLoaded', () => {
  let game = new Game()

  /*window.addEventListener('resize', () => {
    resize(game)
  })

  FullScreenEvent(() => resize(game))

  resize(game)*/
})