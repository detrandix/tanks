export enum EventsEnum {
    // emmited states
    InitState = 'init-state',
    NewPlayer = 'new-player',
    RemovePlayer = 'remove-player',
    BulletsUpdate = 'bullets-player',
    BulletExplode = 'bullet-explode',
    TankMoved = 'tank-moved',
    TankUpdate = 'tank-update',
    TankDestroyed = 'tank-destroyed',
    RemoveTank = 'remove-tank',
    // revieved states
    Connection = 'connection',
    BodyRotateLeft = 'body-rotate-left',
    BodyRotateRight = 'body-rotate-right',
    MoveForward = 'move-forward',
    MoveBackward = 'move-backward',
    TurretRotate = 'turret-rotate',
    Fire = 'fire',
    Disconnected = 'disconnect',
}
