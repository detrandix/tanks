import io from 'socket.io-client'
import Bullet from '../../model/Bullet';
import MainSceneData from '../../model/MainSceneData';
import Player from '../../model/Player';
import Point from '../../model/Point';
import Tank from '../objects/Tank'
import WeaponIndicator from '../objects/WeaponIndicator'

export default class MainScene extends Phaser.Scene {
    background: Phaser.GameObjects.TileSprite|null
    weaponIndicators: Array<WeaponIndicator>
    socket: SocketIOClient.Socket
    cursorKeys: object

    state: {
        tanks: Record<string, {entity: Tank, player: Player}>,
        fires: Record<string, {entity: Phaser.GameObjects.TileSprite, data: Bullet}>,
        lastMousePosition: Point|null
    };

    constructor() {
        super('MainScene');

        this.background = null
        this.weaponIndicators = []
        this.state = {
            tanks: {},
            // TODO: renmate to bullets
            fires: {},
            lastMousePosition: null,
        }
    }

	create({socket, players}: MainSceneData) {
        this.socket = socket

        if (! (this.socket.id in players)) {
            throw "server error" // TODO: probably reload socket connection?
        }

        this.input.setPollAlways()
        this.input.mouse.disableContextMenu()

        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background')
            .setTileScale(.5, .5)
            .setScrollFactor(0)

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

        this.socket.on('new-player', (player: Player) => {
            this.createTank(player)
        })

        this.socket.on('player-moved', (player: Player) => this.updateTank(player))

        this.socket.on('remove-player', (id: string) => {
            if (id in this.state.tanks) {
                this.state.tanks[id].entity.destroy()
                delete this.state.tanks[id]
            }
        })

        this.socket.on('update-player', (player: Player) => {
            if (player.playerId in this.state.tanks) {
                this.state.tanks[player.playerId].player = player
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
        })

        this.socket.on('fires', (fires: Record<string, Bullet>) => {
            for (let id in fires) {
                if (id in this.state.fires) {
                    // update
                    this.state.fires[id].entity.x = fires[id].x
                    this.state.fires[id].entity.y = fires[id].y
                    this.state.fires[id].entity.angle = fires[id].angle
                    this.state.fires[id].data = fires[id]
                } else {
                    // create
                    const fire = this.add
                        .sprite(fires[id].x, fires[id].y, fires[id].type)
                        .setOrigin(0.5, 0.5)
                        .setSize(40, 40)
                    fire.angle = fires[id].angle
                    this.state.fires[id] = {
                        entity: fire,
                        data: fires[id]
                    }
                }
            }
            for (let id in this.state.fires) {
                if (! (id in fires)) {
                    // delete
                    this.state.fires[id].entity.destroy()
                    delete this.state.fires[id]
                }
            }
        })

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

    onMouseClick(pointer: Phaser.Input.Pointer) {
        if (pointer.leftButtonDown()) {
            this.socket.emit('fire', 0)
        } else if (pointer.rightButtonDown()) {
            this.socket.emit('fire', 1)
        }
    }

    onMouseMove(pointer: Phaser.Input.Pointer) {
        if (this.state.lastMousePosition === null) {
            this.state.lastMousePosition = {
                x: pointer.worldX,
                y: pointer.worldY,
            }
            return
        }

        const tankModel = this.state.tanks[this.socket.id].player.tankModel

        const prevAngleToPointer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
            tankModel.center.x + tankModel.turretPosition.x,
            tankModel.center.y + tankModel.turretPosition.y,
            this.state.lastMousePosition.x,
            this.state.lastMousePosition.y
        )) + 90

        const angleToPointer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
            tankModel.center.x + tankModel.turretPosition.x,
            tankModel.center.y + tankModel.turretPosition.y,
            pointer.worldX,
            pointer.worldY
        )) + 90

        this.socket.emit('turret-rotate', Phaser.Math.Angle.ShortestBetween(
            prevAngleToPointer,
            angleToPointer
        ))

        this.state.lastMousePosition = {
            x: pointer.worldX,
            y: pointer.worldY,
        }
    }

    createTank(player: Player) {
        const entity = new Tank(this, player)
        this.add.existing(entity)

        const data = {
            entity,
            player
        }
        this.state.tanks[player.playerId] = data
        return data
    }

    updateBackground(player: Player, playerOld: Player) {
        const diffX = player.tankModel.center.x - playerOld.tankModel.center.x
        const diffY = player.tankModel.center.y - playerOld.tankModel.center.y
        this.background.tilePositionX += diffX / this.background.tileScaleX
        this.background.tilePositionY += diffY / this.background.tileScaleY
    }

    updateTank(player: Player) {
        if (! player.playerId in this.state.tanks) {
            return
        }

        if (this.socket.id === player.playerId) {
            this.updateBackground(player, this.state.tanks[player.playerId].player)
        }

        this.state.tanks[player.playerId].entity.update(player)
        this.state.tanks[player.playerId].player = player
    }

	update() {
        if (this.socket.id in this.state.tanks) {
            const tank = this.state.tanks[this.socket.id]

            if (this.cursorKeys.left.isDown || this.cursorKeys.a.isDown) {
                this.socket.emit('body-rotate-left')
                // interpolate
            } else if (this.cursorKeys.right.isDown || this.cursorKeys.d.isDown) {
                this.socket.emit('body-rotate-right')
            }

            if (this.cursorKeys.up.isDown || this.cursorKeys.w.isDown) {
                this.socket.emit('move-up')
            } else if (this.cursorKeys.down.isDown || this.cursorKeys.s.isDown) {
                this.socket.emit('move-down')
            }
        }
	}
}
