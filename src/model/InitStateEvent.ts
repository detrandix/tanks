import Player from './Player'
import TankModel from './TankModel'

export default interface InitStateEvent {
    players: Record<string, Player>,
    tanks: Record<string, TankModel>,
}
