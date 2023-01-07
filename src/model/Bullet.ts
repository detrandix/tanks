import { WeaponsEnum } from './WeaponsEnum'

export default interface Bullet {
    id: string,
    playerId: string,
    x: number,
    y: number,
    angle: number,
    created: number,
    ttl: number,
    speed: number, // px / ms
    type: WeaponsEnum,
    damage: number,
}
