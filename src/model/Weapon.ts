import TimeToReload from './TimeToReload'
import { WeaponsEnum } from './WeaponsEnum'

export default interface Weapon {
    type: WeaponsEnum,
    timeToReload: TimeToReload|null,
}
