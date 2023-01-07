import TankModel from './TankModel';
import TimeToReload from './TimeToReload';
import Weapon from './Weapon';

export default interface Player {
    connected: number,
    lastAction: number,
    playerId: string,
    name: string,
    color: string, // enum
    weapons: Array<Weapon>,
    hp: number,
    maxHp: number,
    immortalityTtl: number|null,
    tankModel: TankModel,
}
