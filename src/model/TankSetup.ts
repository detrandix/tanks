import Point from './Point'
import Weapon from './Weapon'

export default interface TankSetup {
    width: number
    height: number
    radius: number
    bodyOrigin: Point
    turretYOffset: number
    turretOrigin: Point
    barrelEndYOffset: number
    maxHp: number
    weapons: Array<Weapon>
}
