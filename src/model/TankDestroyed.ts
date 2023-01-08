import BulletExplode from './BulletExplode'
import Player from './Player'

export default interface TankDestroyed {
    bullet: BulletExplode,
    updatedPlayer: Player
}
