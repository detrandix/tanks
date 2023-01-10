import Player from './Player'
import TankModel from './TankModel'

export default interface NewPlayerEvent {
    player: Player
    tank: TankModel
}
