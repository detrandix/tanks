import { TankColorEnum } from './TankColorEnum';
import TankModel from './TankModel';
import Weapon from './Weapon';

export default interface Player {
    connected: number,
    lastAction: number,
    playerId: string,
    name: string,
    preferedColor: TankColorEnum,
    //tankModel: TankModel,
    tankModelId: string|null,
}
