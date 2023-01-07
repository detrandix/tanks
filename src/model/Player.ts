import TimeToReload from './TimeToReload';

export default interface Player {
    connected: number,
    lastAction: number,
    bodyRotation: number,
    turretRotation: number,
    x: number,
    y: number,
    playerId: string,
    name: string,
    color: string, // enum
    timeToReload: TimeToReload|null,
    hp: number,
    maxHp: number,
    immortalityTtl: number|null,
}
