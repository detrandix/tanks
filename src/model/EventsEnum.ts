export enum EventsEnum {
    // emmited states
    InitState = 'init-state',
    NewPlayer = 'new-player',
    RemovePlayer = 'remove-player',
    BulletsUpdate = 'bullets-player',
    PlayerUpdate = 'update-player',
    PlayerMoved = 'player-moved',
    BulletExplode = 'bullet-explode',
    TankDestroyed = 'tank-destroyed',
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
