import Player from './Player';
import TankModel from './TankModel';
import TimeToReload from './TimeToReload';

export default interface MainSceneData {
    socket: SocketIOClient.Socket
    players: Record<string, Player>
    tanks: Record<string, TankModel>
}
