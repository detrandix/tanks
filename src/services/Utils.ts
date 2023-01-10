import { TankColorEnum } from '../model/TankColorEnum'

export default class Utils {
    static randomTankColor(): keyof typeof TankColorEnum {
        const values = Object.keys(TankColorEnum)
        const enumKey = values[Math.floor(Math.random() * values.length)]
        return enumKey as keyof typeof TankColorEnum
    }

    static uuid(): string {
        return crypto.randomUUID()
    }

    static getNormalizedDPR(): number {
        const dpr = window.devicePixelRatio
        if (dpr === 1 || dpr === 2) {
            return dpr
        }
        return 2 // actually we will support only retina display
    }
}
