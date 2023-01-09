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
}
