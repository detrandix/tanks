import Player from '../model/Player'
import { TankColorEnum } from '../model/TankColorEnum'
import TankModel from '../model/TankModel'
import { WeaponsEnum } from '../model/WeaponsEnum'
import Utils from './Utils'

const absoluteDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2))
}

export default class TankFactory {
    static create(playerId: string, players: Record<string, Player>): Player {
        let x, y, availablePosition
        do {
            x = Math.floor(Math.random() * 800)
            y = Math.floor(Math.random() * 800)
            availablePosition = true
            for (let id in players) {
                const {x: centerX, y: centerY} = players[id].tankModel.center
                if (absoluteDistance(x, y, centerX, centerY) < 200) {
                    availablePosition = false
                    break
                }
            }
        } while (! availablePosition)
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
                -160,
            ),
        }
    }
}
