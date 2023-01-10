import { TankColorEnum } from './TankColorEnum'

export default interface Player {
    connected: number
    lastAction: number
    playerId: string
    name: string
    preferedColor: TankColorEnum
    //tankModel: TankModel,
    tankModelId: string | null
}
