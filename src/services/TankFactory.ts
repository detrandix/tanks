import Player from '../model/Player'
import { TankColorEnum } from '../model/TankColorEnum'
import TankModel from '../model/TankModel'
import { WeaponsEnum } from '../model/WeaponsEnum'
import Utils from './Utils'

export default class TankFactory {
    static create(playerId: string): Player {
        const x = Math.floor(Math.random() * 300) + 200
        const y = Math.floor(Math.random() * 300) + 200
        return {
            connected: Date.now(),
            lastAction: Date.now(),
            playerId,
            name: 'Player' + playerId,
            color: TankColorEnum[Utils.randomTankColor()],
            weapons: [
                {type: WeaponsEnum.Heavy, timeToReload: null},
                {type: WeaponsEnum.Granade, timeToReload: null},
            ],
            hp: 100,
            maxHp: 100,
            immortalityTtl: 3000,
            // TODO: create factory for TankModels
            tankModel: new TankModel(
                {x, y},
                164,
                256,
                0,
                50,
                0,
                {x: 0.5, y: 0.8},
            ),
        }
    }
}
