import TankModel from './TankModel';
import TimeToReload from './TimeToReload';

export default interface Player {
    connected: number,
    lastAction: number,
    playerId: string,
    name: string,
    color: string, // enum
    timeToReload: TimeToReload|null,
    hp: number,
    maxHp: number,
    immortalityTtl: number|null,
    tankModel: TankModel,
}
