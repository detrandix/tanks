import Player from './Player';
import TimeToReload from './TimeToReload';

export default interface MainSceneData {
    socket: SocketIOClient.Socket
    players: Record<string, Player>
}
