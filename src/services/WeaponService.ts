import TimeToReload from '../model/TimeToReload'
import { WeaponsEnum } from '../model/WeaponsEnum'

const getTimeToReload = (type: WeaponsEnum): number => {
    switch (type as WeaponsEnum) {
        case WeaponsEnum.Heavy: return 1000
        case WeaponsEnum.Granade: return 2000
        default: throw `Unknown weapon type ${type}`
    }
}

export default class WeaponService {
    static getTimeToReload(type: WeaponsEnum): TimeToReload {
        const timeToReload = getTimeToReload(type)
        return {
            ttl: timeToReload,
            total: timeToReload,
        }
    }
}
