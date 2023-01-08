import 'source-map-support/register'

import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import path from 'path'
import compression from 'compression'
import Player from '../model/Player'
import Bullet from '../model/Bullet'
import BulletFactory from '../services/BulletFactory'
import WeaponService from '../services/WeaponService'
import TankModelFactory from '../services/TankModelFactory'
import { EventsEnum } from '../model/EventsEnum'
import GeometryService from '../services/GeometryService'
import BulletExplode from '../model/BulletExplode'
import PlayerFactory from '../services/PlayerFactory'
import TankDestroyed from '../model/TankDestroyed'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } });

const port = process.env.PORT || 3000

app.use(compression())

app.use('/static', express.static(path.join(__dirname, '../')))
app.use('/assets', express.static(path.join(__dirname, '../client/assets')))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/client/index.html'))
})

server.listen(port, () => {
    console.log(`Server running on port ${port}.`)
})

const players: Record<string, Player> = {}
//const tans:
const sockets = {}
const bullets: Record<string, Bullet> = {}

const DEG2RAD = Math.PI/180
const deg2rad = (deg: number) => deg * DEG2RAD

function uuid() {
    return crypto.randomUUID()
}

// TODO: move to some DI
const tankModelFactory = new TankModelFactory()
const playerFactory = new PlayerFactory(tankModelFactory)

io.on(EventsEnum.Connection, (socket) => {
    console.log(`A user #${socket.id} just connected.`)
    sockets[socket.id] = socket
    players[socket.id] = playerFactory.create(socket.id, players)
    socket.emit(EventsEnum.InitState, players) // send the players object to the new player
    socket.broadcast.emit(EventsEnum.NewPlayer, players[socket.id]) // update all other players of the new player

    socket.on(EventsEnum.BodyRotateLeft, () => {
        players[socket.id].tankModel.addRotation(-1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.PlayerMoved, players[socket.id])
    })

    socket.on(EventsEnum.BodyRotateRight, () => {
        players[socket.id].tankModel.addRotation(1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.PlayerMoved, players[socket.id])
    })

    socket.on(EventsEnum.MoveForward, () => { // TODO: move-forward
        players[socket.id].tankModel.move(1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.PlayerMoved, players[socket.id])
    })

    socket.on(EventsEnum.MoveBackward, () => {
        players[socket.id].tankModel.move(-1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.PlayerMoved, players[socket.id])
    })

    socket.on(EventsEnum.TurretRotate, (angleDiff: number) => {
        if (angleDiff > -.1 && angleDiff < 0.1) {
            return
        }

        players[socket.id].tankModel.addTurretRotation(angleDiff)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.PlayerMoved, players[socket.id])
    })

    socket.on(EventsEnum.Fire, (index: number) => {
        const player = players[socket.id]

        if (player.tankModel.weapons[index] === undefined || player.tankModel.weapons[index].timeToReload !== null) {
            return
        }

        const id = uuid()
        bullets[id] = BulletFactory.create(id, socket.id, player.tankModel.weapons[index].type, player.tankModel)
        player.tankModel.weapons[index].timeToReload = WeaponService.getTimeToReload(player.tankModel.weapons[index].type)
        player.lastAction = Date.now()
        // this bullet will be proceeed in main loop - TODO: is this good solution?
    })

    socket.on(EventsEnum.Disconnected, () => {
        console.log(`A user #${socket.id} has disconnected.`);
        delete players[socket.id]
        delete sockets[socket.id]
        io.emit(EventsEnum.RemovePlayer, socket.id)
    })
})

// update every 15ms (aproximatly 66 updates/s)
// TODO: maybe slow down after add interpolation to client code
const UPDATE_INTERVAL = 15

function updateBullet(bullet: Bullet): Bullet {
    let removedTime = UPDATE_INTERVAL
    if (removedTime > bullet.ttl) {
        removedTime = bullet.ttl
    }
    const move = bullet.speed * removedTime
    return {
        ...bullet,
        ttl: bullet.ttl - removedTime,
        x: bullet.x + move * Math.cos(deg2rad(bullet.angle - 90)),
        y: bullet.y + move * Math.sin(deg2rad(bullet.angle - 90)),
    }
}

function bulletHitSomePlayer(bullet: Bullet): Player|null {
    for (let id in players) {
        if (bullet.playerId === id) {
            continue
        }
        const player = players[id]
        if (GeometryService.pointInsidePolygon(bullet, player.tankModel.polygon)) {
            return player
        }
    }
    return null
}

setInterval(() => {
    let emitedBullets = []
    for (let id in bullets) {
        const bullet = updateBullet(bullets[id])
        const hittedPlayer = bulletHitSomePlayer(bullet)
        if (hittedPlayer !== null) {
            hittedPlayer.tankModel.hp -= bullet.damage

            const bulletExplode = {
                id,
                hittedPlayerId: hittedPlayer.playerId,
                x: bullet.x,
                y: bullet.y,
                angle: bullet.angle,
            } as BulletExplode

            if (hittedPlayer.tankModel.hp <= 0) {
                hittedPlayer.tankModel = tankModelFactory.createFromPlayer(hittedPlayer, players)
                io.sockets.emit(
                    EventsEnum.TankDestroyed,
                    {
                        bullet: bulletExplode,
                        updatedPlayer: hittedPlayer
                    } as TankDestroyed
                )
            } else {
                io.sockets.emit(
                    EventsEnum.BulletExplode,
                    bulletExplode
                )
                io.sockets.emit(
                    EventsEnum.PlayerUpdate,
                    hittedPlayer
                )
            }

            emitedBullets.push(bullet) // we wanna to create bullet, even if it hit target
            delete bullets[id]
        } else if (bullet.ttl > 0) {
            emitedBullets.push(bullet)
            bullets[id] = bullet
        } else {
            delete bullets[id]
        }
    }
    io.sockets.emit(EventsEnum.BulletsUpdate, emitedBullets)

    for (let id in players) {
        for (let weapon of players[id].tankModel.weapons) {
            if (weapon.timeToReload !== null) {
                if (weapon.timeToReload.ttl <= UPDATE_INTERVAL) {
                    weapon.timeToReload = null
                } else {
                    weapon.timeToReload.ttl -= UPDATE_INTERVAL
                }
            }
        }

        if (players[id].tankModel.immortalityTtl !== null) {
            if (players[id].tankModel.immortalityTtl <= UPDATE_INTERVAL) {
                players[id].tankModel.immortalityTtl = null
            } else {
                players[id].tankModel.immortalityTtl -= UPDATE_INTERVAL
            }
        }
        // TODO: emit every time or only if there is change prom last emit?
        sockets[id].emit(EventsEnum.PlayerUpdate, players[id])
    }
}, UPDATE_INTERVAL)
