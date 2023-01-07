import TimeToReload from './TimeToReload'

export default interface Weapon {
    type: WeaponEnum,
    timeToReload: TimeToReload|null,
}
