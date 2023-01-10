import Bullet from '../model/Bullet'
import TankModel from '../model/TankModel'
import { WeaponsEnum } from '../model/WeaponsEnum'
import Utils from './Utils'

const getBulletProperties = (type: WeaponsEnum): { ttl: number; speed: number; damage: number } => {
    switch (type as WeaponsEnum) {
        case WeaponsEnum.Heavy:
            return { ttl: 1000, speed: 1, damage: 20 }
        case WeaponsEnum.Granade:
            return { ttl: 800, speed: 0.5, damage: 50 }
        default:
            throw `Unknown weapon type ${type}`
    }
}

export default class BulletFactory {
    static create(tankId: string, type: WeaponsEnum, tankModel: TankModel): Bullet {
        const { ttl, speed, damage } = getBulletProperties(type)
        return {
            id: Utils.uuid(),
            tankId,
            x: tankModel.center.x + tankModel.barrelEndPosition.x,
            y: tankModel.center.y + tankModel.barrelEndPosition.y,
            angle: tankModel.turretAngle,
            created: Date.now(),
            ttl,
            speed,
            type,
            damage,
        }
    }
}
