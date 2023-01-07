import io from 'socket.io-client'
import Bullet from '../../model/Bullet';
import MainSceneData from '../../model/MainSceneData';
import Player from '../../model/Player';
import Tank from '../objects/Tank'
import WeaponIndicator from '../objects/WeaponIndicator'

export default class MainScene extends Phaser.Scene {
    background: Phaser.GameObjects.TileSprite|null;
    leftWeapon: WeaponIndicator|null; // TODO: is this good solution?
    rightWeapon: WeaponIndicator|null; // TODO: is this good solution?
    socket: SocketIOClient.Socket;
    cursorKeys: object;

    state: {
        tanks: Record<string, {entity: Tank, player: Player}>;
        fires: Record<string, Bullet>;
    };

    constructor() {
        super('MainScene');

        this.background = null
        this.state = {
            tanks: {},
            // TODO: renmate to bullets
            fires: {},
        }
        this.leftWeapon = null
        this.rightWeapon = null
    }

	create({socket, players}: MainSceneData) {
        this.socket = socket

        if (! (this.socket.id in players)) {
            throw "server error" // TODO: probably reload socket connection?
        }

        // look for mouse position permanent
        this.input.setPollAlways()

        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background')
            .setTileScale(.5, .5)
            .setScrollFactor(0)

        this.leftWeapon = new WeaponIndicator(this, 100, 100, 'heavy-shell')
        this.add.existing(this.leftWeapon)
        this.rightWeapon = new WeaponIndicator(this, 300, 100, 'granade-shell')
        this.add.existing(this.rightWeapon)

        for (let id in players) {
            if (this.socket.id === id) {
                const tank = this.createTank(players[id])

                this.cameras.main.startFollow(tank.entity)
                this.cameras.main.setFollowOffset(-this.cameras.main.centerX/2, -this.cameras.main.centerY/2)
                // initial centerinf of map
                this.background.tilePositionX = players[id].x / this.background.tileScaleX
                this.background.tilePositionY = players[id].y / this.background.tileScaleY
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
                if (player.timeToReload) {
                    this.leftWeapon.setTimeToReload((player.timeToReload.total - player.timeToReload.ttl) / player.timeToReload.total)
                } else {
                    this.leftWeapon.setTimeToReload(1)
                }
            }
        })

        this.socket.on('fires', (fires: Record<string, Bullet>) => {
            for (let id in fires) {
                if (id in this.state.fires) {
                    // update
                    this.state.fires[id].fire.x = fires[id].x
                    this.state.fires[id].fire.y = fires[id].y
                    this.state.fires[id].fire.angle = fires[id].angle
                    this.state.fires[id].data = fires[id]
                } else {
                    // create
                    const fire = this.add
                        .sprite(fires[id].x, fires[id].y, 'heavy-shell')
                        .setOrigin(0.5, 0.5)
                        .setSize(40, 40)
                    fire.angle = fires[id].angle
                    this.state.fires[id] = {
                        fire,
                        data: fires[id]
                    }
                }
            }
            for (let id in this.state.fires) {
                if (! (id in fires)) {
                    // delete
                    this.state.fires[id].fire.destroy()
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

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.socket.emit('fire')
            }
        })
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
        const diffX = player.x - playerOld.x
        const diffY = player.y - playerOld.y
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

            //console.log([this.input.activePointer.worldX, this.input.activePointer.worldY])

            const newTurretAngle = Phaser.Math.Angle.Between(
                tank.player.x - 50 * Math.cos(Phaser.Math.DegToRad(tank.player.bodyRotation - 90)),
                tank.player.y - 50 * Math.sin(Phaser.Math.DegToRad(tank.player.bodyRotation - 90)),
                this.input.activePointer.worldX,
                this.input.activePointer.worldY
            )
            // TODO: emit only if there is change in angle
            this.socket.emit('turret-rotate', Phaser.Math.RadToDeg(newTurretAngle))

            //if (this.cursorKeys.space.down) {
            //    console.log('XXX')
            //    this.socket.emit('fire')
            //}
        }
	}
}
