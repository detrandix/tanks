import TankModel from './TankModel'

export default interface BulletExplode {
    id: string
    hittedTankId: string
    x: number
    y: number
    angle: number
    updatedTank: TankModel
}
