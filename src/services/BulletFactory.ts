import Bullet from '../model/Bullet'
import TankModel from '../model/TankModel'
import { WeaponsEnum } from '../model/WeaponsEnum'

const getBulletProperties = (type: WeaponsEnum): {ttl: number, speed: number} => {
    switch (type as WeaponsEnum) {
        case WeaponsEnum.Heavy: return {ttl: 1000, speed: 1}
        case WeaponsEnum.Granade: return {ttl: 800, speed: 0.5}
        default: throw `Unknown weapon type ${type}`
    }
}

export default class BulletFactory {
    static create(id: string, type: WeaponsEnum, tankModel: TankModel): Bullet {
        const {ttl, speed} = getBulletProperties(type)
        return {
            id,
            x: tankModel.center.x,
            y: tankModel.center.y,
            angle: tankModel.turretAngle,
            created: Date.now(),
            ttl,
            speed,
            type,
        }
    }
}
