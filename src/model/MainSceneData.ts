import Player from './Player'
import TankModel from './TankModel'

export default interface MainSceneData {
    socket: SocketIOClient.Socket
    players: Record<string, Player>
    tanks: Record<string, TankModel>
}
