import Player from '../model/Player'
import { TankColorEnum } from '../model/TankColorEnum'
import TankModelFactory from './TankModelFactory'
import Utils from './Utils'

export default class PlayerFactory {
    tankModelFactory: TankModelFactory

    constructor(tankModelFactory: TankModelFactory) {
        this.tankModelFactory = tankModelFactory
    }

    create(playerId: string, players: Record<string, Player>): Player {
        const createTime = Date.now()
        const randomTankColor: TankColorEnum = TankColorEnum[Utils.randomTankColor()]
        const tankModel = this.tankModelFactory.create(randomTankColor, players)
        // TODO: maybe completly separate Player and TankModel, so this doesn't need `players`
        return {
            connected: createTime,
            lastAction: createTime,
            playerId,
            name: 'Player' + playerId,
            preferedColor: randomTankColor,
            tankModel,
        }
    }
}
