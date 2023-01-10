import BulletExplode from './BulletExplode'
import Player from './Player'
import TankModel from './TankModel'

export default interface TankDestroyed {
    bullet: BulletExplode | null
    updatedPlayer: Player | null
    oldTank: TankModel
    newTank: TankModel | null
}
