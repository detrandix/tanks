import Player from '../model/Player'
import TankSetup from '../model/TankSetup'
import { WeaponsEnum } from '../model/WeaponsEnum'
import GeometryService from './GeometryService'

export default class TankSetupFactory {
    create(): TankSetup {
        // TODO: return setup based on tank type
        const width = 164
        const height = 245
        return {
            width,
            height,
            radius: GeometryService.pointsDistance({x: 0, y: 0}, {x: width/2, y: height/2}),
            bodyOrigin: {x: 0.5, y: 0.52},
            turretYOffset: 50,
            turretOrigin: {x: 0.5, y: 0.8},
            barrelEndYOffset: -160,
            maxHp: 100,
            weapons: [
                {type: WeaponsEnum.Heavy, timeToReload: null},
                {type: WeaponsEnum.Granade, timeToReload: null},
            ],
        }
    }
}