import Player from '../model/Player'
import Point from '../model/Point'
import { TankColorEnum } from '../model/TankColorEnum'
import TankModel, { TankModelConstructor } from '../model/TankModel'
import { WeaponsEnum } from '../model/WeaponsEnum'

const absoluteDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2))
}

const findAvailablePosition = (players: Record<string, Player>): Point => {
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
    return {x, y}
}

export default class TankModelFactory {
    create(color: TankColorEnum, players: Record<string, Player>): TankModel {
        const availablePosition = findAvailablePosition(players)
        return new TankModel({
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
            color
        } as TankModelConstructor)
    }

    createFromPlayer(player: Player, players: Record<string, Player>): TankModel {
        return this.create(player.preferedColor, players)
    }
}
