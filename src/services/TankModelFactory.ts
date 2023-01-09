import Player from '../model/Player'
import Point from '../model/Point'
import TankModel, { TankModelConstructor } from '../model/TankModel'
import GeometryService from './GeometryService'
import TankSetupFactory from './TankSetupFactory'

const MIN_TANK_DISTANCE = 50

const findAvailablePosition = (radius: number, tanks: Record<string, TankModel>): Point => {
    let x, y, availablePosition
    do {
        x = Math.floor(Math.random() * 800) // TODO: make better seeding of x/y
        y = Math.floor(Math.random() * 800)
        availablePosition = true
        for (let id in tanks) {
            if (GeometryService.pointsDistance({x, y}, tanks[id].center) < (radius + tanks[id].radius + MIN_TANK_DISTANCE)) {
                availablePosition = false
                break
            }
        }
    } while (! availablePosition)
    return {x, y}
}

export default class TankModelFactory {
    tankSetupFactory: TankSetupFactory

    constructor(tankSetupFactory: TankSetupFactory) {
        this.tankSetupFactory = tankSetupFactory
    }

    create(player: Player, tanks: Record<string, TankModel>): TankModel {
        const tankSetup = this.tankSetupFactory.create()
        const availablePosition = findAvailablePosition(tankSetup.radius, tanks)
        return new TankModel({
            playerId: player.playerId,
            center: availablePosition,
            width: tankSetup.width,
            height: tankSetup.height,
            radius: tankSetup.radius,
            angle: 0,
            bodyOrigin: tankSetup.bodyOrigin,
            turretYOffset: tankSetup.turretYOffset,
            turretAngle: 0,
            turretOrigin: tankSetup.turretOrigin,
            barrelEndYOffset: tankSetup.barrelEndYOffset,
            maxHp: tankSetup.maxHp,
            immortalityTtl: 3000,
            weapons: tankSetup.weapons,
            color: player.preferedColor
        })
    }
}
