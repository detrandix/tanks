import Player from '../model/Player'
import Point from '../model/Point'
import { TankColorEnum } from '../model/TankColorEnum'
import TankModel, { TankModelConstructor } from '../model/TankModel'
import { WeaponsEnum } from '../model/WeaponsEnum'

const absoluteDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2))
}

const findAvailablePosition = (tanks: Record<string, TankModel>): Point => {
    let x, y, availablePosition
    do {
        x = Math.floor(Math.random() * 800)
        y = Math.floor(Math.random() * 800)
        availablePosition = true
        for (let id in tanks) {
            const {x: centerX, y: centerY} = tanks[id].center
            if (absoluteDistance(x, y, centerX, centerY) < 200) {
                availablePosition = false
                break
            }
        }
    } while (! availablePosition)
    return {x, y}
}

export default class TankModelFactory {
    create(player: Player, tanks: Record<string, TankModel>): TankModel {
        const availablePosition = findAvailablePosition(tanks)
        return new TankModel({
            playerId: player.playerId,
            center: availablePosition,
            width: 164,
            height: 256,
            angle: 0,
            turretYOffset: 50,
            turretAngle: 0,
            turretOrigin: {x: 0.5, y: 0.8},
            barrelEndYOffset: -160,
            maxHp: 100,
            immortalityTtl: 3000,
            weapons: [
                {type: WeaponsEnum.Heavy, timeToReload: null},
                {type: WeaponsEnum.Granade, timeToReload: null},
            ],
            color: player.preferedColor
        } as TankModelConstructor)
    }
}
