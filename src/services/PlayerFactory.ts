import Player from '../model/Player'
import { TankColorEnum } from '../model/TankColorEnum'
import Utils from './Utils'

export default class PlayerFactory {
    create(playerId: string): Player {
        const createTime = Date.now()
        const randomTankColor: TankColorEnum = TankColorEnum[Utils.randomTankColor()]

        return {
            connected: createTime,
            lastAction: createTime,
            playerId,
            name: 'Player' + playerId,
            preferedColor: randomTankColor,
            tankModelId: null,
        }
    }
}
