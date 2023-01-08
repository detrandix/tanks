import Bullet from '../../model/Bullet'
import BulletExplode from '../../model/BulletExplode'
import { EventsEnum } from '../../model/EventsEnum'
import MainSceneData from '../../model/MainSceneData'
import Player from '../../model/Player'
import Point from '../../model/Point'
import Radar from '../objects/Radar'
import Tank from '../objects/Tank'
import WeaponIndicator from '../objects/WeaponIndicator'

export default class MainScene extends Phaser.Scene {
    socket: SocketIOClient.Socket
    background: Phaser.GameObjects.TileSprite|null = null
    weaponIndicators: Array<WeaponIndicator> = []
    cursorKeys: object
    lastMousePosition: Point|null = null
    radar: Radar

    tanks: Record<string, {entity: Tank, player: Player}> = {}
    bullets: Record<string, {entity: Phaser.GameObjects.Sprite, data: Bullet}> = {}

    constructor() {
        super('MainScene');
    }

	create({socket, players}: MainSceneData): void {
        this.socket = socket

        if (! (this.socket.id in players)) {
            throw "server error" // TODO: probably reload socket connection?
        }

        this.input.setPollAlways()
        this.input.mouse.disableContextMenu()

        this.loadInitSituation(players)

        this.socket.on(EventsEnum.NewPlayer, (player: Player) => this.onNewPlayer(player))
        this.socket.on(EventsEnum.PlayerMoved, (player: Player) => this.onPlayerMoved(player))
        this.socket.on(EventsEnum.RemovePlayer, (id: string) => this.onRemovePlayer(id))
        this.socket.on(EventsEnum.PlayerUpdate, (player: Player) => this.onPlayerUpdate(player))
        this.socket.on(EventsEnum.BulletsUpdate, (bullets: Record<string, Bullet>) => this.onBulletsUpdate(bullets))
        this.socket.on(EventsEnum.BulletExplode, (bulletExplode: BulletExplode) => this.onBulletExplode(bulletExplode))

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
        })

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onMouseClick(pointer))
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.onMouseMove(pointer))
	}

    loadInitSituation(players: Record<string, Player>): void {
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background')
            .setTileScale(.5, .5)
            .setScrollFactor(0)

        // TODO: move to right
        this.radar = new Radar(this, 200, 200, this.socket.id, players)
        this.add.existing(this.radar)

        for (let id in players) {
            if (this.socket.id === id) {
                const tank = this.createTank(players[id])

                for (let i=0; i<players[id].weapons.length; i++) {
                    const weapon = players[id].weapons[i]
                    const weaponIndicator = new WeaponIndicator(this, 150 * (i + 1), 100, weapon.type)
                    this.add.existing(weaponIndicator)
                    this.weaponIndicators.push(weaponIndicator)
                }

                this.cameras.main.startFollow(tank.entity)
                this.cameras.main.setFollowOffset(-this.cameras.main.centerX/2, -this.cameras.main.centerY/2)
                this.background.tilePositionX = players[id].tankModel.center.x / this.background.tileScaleX
                this.background.tilePositionY = players[id].tankModel.center.y / this.background.tileScaleY
            } else {
                this.createTank(players[id])
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

        const tankModel = this.tanks[this.socket.id].player.tankModel

        const prevAngleToPointer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
            tankModel.center.x + tankModel.turretPosition.x,
            tankModel.center.y + tankModel.turretPosition.y,
            this.lastMousePosition.x,
            this.lastMousePosition.y
        )) + 90

        const angleToPointer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
            tankModel.center.x + tankModel.turretPosition.x,
            tankModel.center.y + tankModel.turretPosition.y,
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

    createTank(player: Player): {entity: Tank, player: Player} {
        const entity = new Tank(this, player)
        this.add.existing(entity)

        const data = {
            entity,
            player
        }
        this.tanks[player.playerId] = data
        return data
    }

    onNewPlayer(player: Player): void {
        this.createTank(player)
    }

    onPlayerMoved(player: Player): void {
        this.updateTank(player)
    }

    onRemovePlayer(id: string): void {
        if (id in this.tanks) {
            this.tanks[id].entity.destroy()
            delete this.tanks[id]
        }
    }

    onPlayerUpdate(player: Player): void {
        if (! (player.playerId in this.tanks)) {
            return
        }

        // TODO: do this only in one place
        this.tanks[player.playerId].entity.update(player)
        this.tanks[player.playerId].player = player
        for (let i=0; i<player.weapons.length; i++) {
            // TODO: check if there is more/less weapons
            const timeToReload = player.weapons[i].timeToReload
            if (timeToReload) {
                this.weaponIndicators[i].setTimeToReload((timeToReload.total - timeToReload.ttl) / timeToReload.total)
            } else {
                this.weaponIndicators[i].setTimeToReload(1)
            }
        }
    }

    onBulletsUpdate(bullets: Record<string, Bullet>): void {
        for (let id in bullets) {
            if (id in this.bullets) {
                // update
                this.bullets[id].entity.x = bullets[id].x
                this.bullets[id].entity.y = bullets[id].y
                this.bullets[id].entity.angle = bullets[id].angle
                this.bullets[id].data = bullets[id]
            } else {
                // create
                const fire = this.add
                    .sprite(bullets[id].x, bullets[id].y, bullets[id].type)
                    .setOrigin(0.5, 0.5)
                    .setSize(40, 40)
                fire.angle = bullets[id].angle
                this.bullets[id] = {
                    entity: fire,
                    data: bullets[id]
                }
                this.tanks[bullets[id].playerId].entity.exhaust(this.tanks[bullets[id].playerId].player, bullets[id], this.tanks[this.socket.id].player)
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
        const hitted = this.tanks[bulletExplode.hittedPlayerId]
        hitted.entity.impact(
            bulletExplode,
            hitted.player,
            this.tanks[this.socket.id].player
        )
        if (bulletExplode.hittedPlayerId === this.socket.id) {
            this.cameras.main.shake(250)
            if (hitted.player.hp < hitted.player.maxHp / 2) {
                this.cameras.main.flash(250, 255, 0, 0)
            }
        }
    }

    updateBackground(player: Player, playerOld: Player): void {
        const diffX = player.tankModel.center.x - playerOld.tankModel.center.x
        const diffY = player.tankModel.center.y - playerOld.tankModel.center.y
        this.background.tilePositionX += diffX / this.background.tileScaleX
        this.background.tilePositionY += diffY / this.background.tileScaleY
    }

    updateTank(player: Player): void {
        if (! player.playerId in this.tanks) {
            return
        }

        if (this.socket.id === player.playerId) {
            this.updateBackground(player, this.tanks[player.playerId].player)
        }

        this.tanks[player.playerId].entity.update(player)
        this.tanks[player.playerId].player = player
    }

	update(): void {
        if (! (this.socket.id in this.tanks)) {
            return
        }

        const tank = this.tanks[this.socket.id]

        if (this.cursorKeys.left.isDown || this.cursorKeys.a.isDown) {
            this.socket.emit(EventsEnum.BodyRotateLeft)
            // interpolate
        } else if (this.cursorKeys.right.isDown || this.cursorKeys.d.isDown) {
            this.socket.emit(EventsEnum.BodyRotateRight)
        }

        if (this.cursorKeys.up.isDown || this.cursorKeys.w.isDown) {
            this.socket.emit(EventsEnum.MoveForward)
        } else if (this.cursorKeys.down.isDown || this.cursorKeys.s.isDown) {
            this.socket.emit(EventsEnum.MoveBackward)
        }

        let itemsForRadar = {} as Record<string, Player>
        for (let id in this.tanks) {
            itemsForRadar[id] = this.tanks[id].player
        }
        this.radar.drawPlayers(itemsForRadar)
	}
}
