import Bullet from '../../model/Bullet'
import BulletExplode from '../../model/BulletExplode'
import { EventsEnum } from '../../model/EventsEnum'
import MainSceneData from '../../model/MainSceneData'
import NewPlayerEvent from '../../model/NewPlayerEvent'
import Player from '../../model/Player'
import Point from '../../model/Point'
import TankDestroyed from '../../model/TankDestroyed'
import TankModel from '../../model/TankModel'
import PlayersList from '../objects/PlayersList'
import Radar from '../objects/Radar'
import Tank from '../objects/Tank'
import WeaponIndicator from '../objects/WeaponIndicator'

const KEY_DELTA = 100

type CursorKeys = {
    up: Phaser.Input.Keyboard.Key,
    down: Phaser.Input.Keyboard.Key,
    left: Phaser.Input.Keyboard.Key,
    right: Phaser.Input.Keyboard.Key,
    w: Phaser.Input.Keyboard.Key,
    a: Phaser.Input.Keyboard.Key,
    s: Phaser.Input.Keyboard.Key,
    d: Phaser.Input.Keyboard.Key,
    space: Phaser.Input.Keyboard.Key
}

export default class MainScene extends Phaser.Scene {
    socket: SocketIOClient.Socket
    background: Phaser.GameObjects.TileSprite|null = null
    weaponIndicators: Array<WeaponIndicator> = []
    cursorKeys: CursorKeys
    lastMousePosition: Point|null = null
    lastKeyTime: number
    radar: Radar
    playersList: PlayersList

    players: Record<string, Player> = {}
    tanks: Record<string, {entity: Tank, tankModel: TankModel}> = {}
    bullets: Record<string, {entity: Phaser.GameObjects.Sprite, bullet: Bullet}> = {}

    constructor() {
        super('MainScene');
    }

	create({socket, players, tanks}: MainSceneData): void {
        this.socket = socket

        if (! (this.socket.id in players)) {
            throw "server error" // TODO: probably reload socket connection?
        }

        this.input.setPollAlways()
        this.input.mouse.disableContextMenu()
        this.cameras.main.setRoundPixels(true)

        this.loadInitSituation(players, tanks)

        this.socket.on(EventsEnum.NewPlayer, (newPlayerEvent: NewPlayerEvent) => this.onNewPlayer(newPlayerEvent))
        this.socket.on(EventsEnum.TankMoved, (tank: TankModel) => this.onTankMoved(tank))
        this.socket.on(EventsEnum.RemovePlayer, (id: string) => this.onRemovePlayer(id))
        this.socket.on(EventsEnum.TankUpdate, (tank: TankModel) => this.onTankUpdate(tank))
        this.socket.on(EventsEnum.BulletsUpdate, (bullets: Record<string, Bullet>) => this.onBulletsUpdate(bullets))
        this.socket.on(EventsEnum.BulletExplode, (bulletExplode: BulletExplode) => this.onBulletExplode(bulletExplode))
        this.socket.on(EventsEnum.TankDestroyed, (tankDestroyed: TankDestroyed) => this.onTankDestroyed(tankDestroyed))
        this.socket.on(EventsEnum.RemoveTank, (tank: TankModel) => this.onRemoveTank(tank))

        this.cursorKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        }) as CursorKeys

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onMouseClick(pointer))
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.onMouseMove(pointer))

        this.lastKeyTime = Date.now()
	}

    getPlayerByTankModel(tankModel: TankModel): Player|null {
        return tankModel.playerId in this.players ? this.players[tankModel.playerId] : null
    }

    getPlayerByTankId(tankId: string): Player|null {
        if (! (tankId in this.tanks)) {
            return null
        }
        return this.getPlayerByTankModel(this.tanks[tankId].tankModel)
    }

    getActualPlayerTankModel(): TankModel|null {
        if (! (this.socket.id in this.players)) {
            return null
        }
        const playerTankId = this.players[this.socket.id].tankModelId
        if (playerTankId === null) {
            return null
        }
        return playerTankId in this.tanks ? this.tanks[playerTankId].tankModel : null
    }

    getTankModelByTankId(tankId: string): TankModel|null {
        if (! (tankId in this.tanks)) {
            return null
        }
        return this.tanks[tankId].tankModel
    }

    getPlayerIdByTankId(tankId: string): string|null {
        return tankId in this.tanks ? this.tanks[tankId].tankModel.playerId : null
    }

    getPlayerByPlayerId(playerId: string): Player|null {
        return playerId in this.players ? this.players[playerId] : null
    }

    setCamerasAndWeapons(tank: {entity: Tank, tankModel: TankModel}) {
        this.cameras.main.startFollow(tank.entity)
        this.background.tilePositionX = this.scale.transformX(tank.tankModel.center.x) / this.background.tileScaleX
        this.background.tilePositionY = this.scale.transformY(tank.tankModel.center.y) / this.background.tileScaleY

        for (let weaponIndicator of this.weaponIndicators) {
            weaponIndicator.destroy()
        }
        this.weaponIndicators = []
        const y = this.cameras.main.height - this.scale.transformY(100)
        for (let i=0; i<tank.tankModel.weapons.length; i++) {
            const weapon = tank.tankModel.weapons[i]
            const x = this.scale.transformX(100 + i * 120)
            const weaponIndicator = new WeaponIndicator(this, x, y, weapon.type)
            this.add.existing(weaponIndicator)
            this.weaponIndicators.push(weaponIndicator)
        }
    }

    loadInitSituation(players: Record<string, Player>, tanks: Record<string, TankModel>): void {
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width * 2, this.cameras.main.height * 2, 'background')
            .setTileScale(.5, .5)
            .setScrollFactor(0)

        this.radar = new Radar(
            this,
            this.scale.transformX(150),
            this.scale.transformY(150),
            this.socket.id,
            tanks
        )
        this.add.existing(this.radar)

        this.playersList = new PlayersList(
            this,
            this.cameras.main.width - this.scale.transformX(50),
            this.scale.transformY(50),
            players,
            this.socket.id
        )
        this.add.existing(this.playersList)

        this.players = players

        for (let id in tanks) {
            if (this.socket.id === tanks[id].playerId) {
                const tank = this.createTank(tanks[id])
                this.setCamerasAndWeapons(tank)
            } else {
                this.createTank(tanks[id])
            }
        }
    }

    onMouseClick(pointer: Phaser.Input.Pointer): void {
        if (pointer.leftButtonDown()) {
            this.socket.emit(EventsEnum.Fire, 0)
        } else if (pointer.rightButtonDown()) {
            this.socket.emit(EventsEnum.Fire, 1)
        }
    }

    onMouseMove(pointer: Phaser.Input.Pointer): void {
        if (this.lastMousePosition === null) {
            this.lastMousePosition = {
                x: pointer.worldX,
                y: pointer.worldY,
            }
            return
        }

        const tankModel = this.getActualPlayerTankModel()
        if (tankModel === null) {
            return
        }

        const tankTurretX = this.scale.transformX(tankModel.center.x + tankModel.turretPosition.x)
        const tankTurretY = this.scale.transformX(tankModel.center.y + tankModel.turretPosition.y)

        const prevAngleToPointer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
            tankTurretX,
            tankTurretY,
            this.lastMousePosition.x,
            this.lastMousePosition.y
        )) + 90

        const angleToPointer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
            tankTurretX,
            tankTurretY,
            pointer.worldX,
            pointer.worldY
        )) + 90

        this.socket.emit(EventsEnum.TurretRotate, Phaser.Math.Angle.ShortestBetween(
            prevAngleToPointer,
            angleToPointer
        ))

        this.lastMousePosition = {
            x: pointer.worldX,
            y: pointer.worldY,
        }
    }

    createTank(tank: TankModel): {entity: Tank, tankModel: TankModel} {
        const entity = new Tank(this, tank, this.getPlayerByPlayerId(tank.playerId))
        this.add.existing(entity)

        if (tank.destroyed !== false) {
            entity.destroyed()
        }

        const data = {
            entity,
            tankModel: tank
        }
        this.tanks[tank.id] = data
        return data
    }

    onNewPlayer(newPlayerEvent: NewPlayerEvent): void {
        this.players[newPlayerEvent.player.playerId] = newPlayerEvent.player
        this.createTank(newPlayerEvent.tank)
        this.playersList.updatePlayers(this.players, this.socket.id)
    }

    onTankMoved(tank: TankModel): void {
        this.updateTank(tank)
    }

    onRemovePlayer(id: string): void {
        delete this.players[id]
        this.playersList.updatePlayers(this.players, this.socket.id)
    }

    onTankUpdate(tankModel: TankModel): void {
        if (! (tankModel.id in this.tanks)) {
            return
        }

        // TODO: do this only in one place
        this.tanks[tankModel.id].entity.update(tankModel, this.getPlayerByTankModel(tankModel))
        this.tanks[tankModel.id].tankModel = tankModel

        if (tankModel.playerId === this.socket.id) {
            for (let i=0; i<tankModel.weapons.length; i++) {
                // TODO: check if there is more/less weapons
                const timeToReload = tankModel.weapons[i].timeToReload
                if (timeToReload) {
                    this.weaponIndicators[i].setTimeToReload((timeToReload.total - timeToReload.ttl) / timeToReload.total)
                } else {
                    this.weaponIndicators[i].setTimeToReload(1)
                }
            }
        }
    }

    onBulletsUpdate(bullets: Record<string, Bullet>): void {
        for (let id in bullets) {
            if (id in this.bullets) {
                // update
                this.bullets[id].entity.x = this.scale.transformX(bullets[id].x)
                this.bullets[id].entity.y = this.scale.transformY(bullets[id].y)
                this.bullets[id].entity.angle = bullets[id].angle
                this.bullets[id].bullet = bullets[id]
            } else {
                // create
                const fire = this.add
                    .sprite(
                        this.scale.transformX(bullets[id].x),
                        this.scale.transformY(bullets[id].y),
                        bullets[id].type
                    )
                    .setOrigin(0.5, 0.5)
                    .setSize(40, 40)
                fire.angle = bullets[id].angle
                this.bullets[id] = {
                    entity: fire,
                    bullet: bullets[id]
                }

                if (this.getPlayerIdByTankId(bullets[id].tankId) === this.socket.id) {
                    this.cameras.main.shake(250)
                }
                this.tanks[bullets[id].tankId].entity.exhaust(this.tanks[bullets[id].tankId].tankModel, bullets[id], this.getActualPlayerTankModel())
            }
        }
        for (let id in this.bullets) {
            if (! (id in bullets)) {
                // delete
                this.bullets[id].entity.destroy()
                delete this.bullets[id]
            }
        }
    }

    onBulletExplode(bulletExplode: BulletExplode): void {
        if (! (bulletExplode.hittedTankId in this.tanks)) {
            return
        }

        const hittedTank = this.tanks[bulletExplode.hittedTankId]
        hittedTank.entity.impact(
            bulletExplode,
            hittedTank.tankModel,
            this.getActualPlayerTankModel()
        )

        const hittedTankModel = bulletExplode.updatedTank
        if (hittedTankModel !== null && hittedTankModel.destroyed === false && hittedTankModel.playerId === this.socket.id) {
            this.cameras.main.shake(250)
            if (hittedTankModel.hp < hittedTankModel.maxHp / 2) {
                this.cameras.main.flash(250, 255, 0, 0)
            }
        }
    }

    onTankDestroyed(tankDestroyed: TankDestroyed): void {
        if (tankDestroyed.bullet) {
            this.onBulletExplode(tankDestroyed.bullet)
        }
        this.updateTank(tankDestroyed.oldTank)
        this.tanks[tankDestroyed.oldTank.id].entity.destroyed()
        if (tankDestroyed.newTank !== null) {
            const tank = this.createTank(tankDestroyed.newTank)
            if (tankDestroyed.updatedPlayer.playerId === this.socket.id) {
                this.setCamerasAndWeapons(tank)
            }
        }
        if (tankDestroyed.updatedPlayer !== null) {
            this.updatePlayer(tankDestroyed.updatedPlayer)
        }
    }

    onRemoveTank(tank: TankModel): void {
        if (! (tank.id in this.tanks)) {
            return
        }

        this.tanks[tank.id].entity.destroy()
        delete this.tanks[tank.id]
    }

    updateBackground(tankModel: TankModel, tankModelOld: TankModel): void {
        if (this.background === null) {
            return
        }
        const diffX = this.scale.transformX(tankModel.center.x - tankModelOld.center.x)
        const diffY = this.scale.transformY(tankModel.center.y - tankModelOld.center.y)
        this.background.tilePositionX += diffX / this.background.tileScaleX
        this.background.tilePositionY += diffY / this.background.tileScaleY
    }

    updateTank(tankModel: TankModel): void {
        if (! (tankModel.id in this.tanks)) {
            return
        }

        if (this.socket.id === tankModel.playerId) {
            this.updateBackground(tankModel, this.tanks[tankModel.id].tankModel)
        }

        this.tanks[tankModel.id].entity.update(tankModel, this.getPlayerByTankModel(tankModel))
        this.tanks[tankModel.id].tankModel = tankModel
    }

    updatePlayer(player: Player): void {
        if (! (player.playerId in this.players)) {
            return
        }
        this.players[player.playerId] = player
    }

	update(): void {
        this.processKeys()

        let itemsForRadar = {} as Record<string, TankModel>
        for (let id in this.tanks) {
            itemsForRadar[id] = this.tanks[id].tankModel
        }
        this.radar.drawTanks(itemsForRadar)
	}

    processKeys(): void {
        const actualTime = Date.now()
        /*if (actualTime - this.lastKeyTime < KEY_DELTA) {
            return
        } - TODO: make some measures on this */

        if (this.cursorKeys.left.isDown || this.cursorKeys.a.isDown) {
            this.socket.emit(EventsEnum.BodyRotateLeft)
            // TODO: interpolate
        } else if (this.cursorKeys.right.isDown || this.cursorKeys.d.isDown) {
            this.socket.emit(EventsEnum.BodyRotateRight)
        }

        if (this.cursorKeys.up.isDown || this.cursorKeys.w.isDown) {
            this.socket.emit(EventsEnum.MoveForward)
        } else if (this.cursorKeys.down.isDown || this.cursorKeys.s.isDown) {
            this.socket.emit(EventsEnum.MoveBackward)
        }

        if (this.cursorKeys.space.isDown) {
            this.socket.emit(EventsEnum.Fire, 0)
        }

        this.lastKeyTime = actualTime
    }
}
