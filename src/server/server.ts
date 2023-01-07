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
import TankFactory from '../services/TankFactory'
import { EventsEnum } from '../model/EventsEnum'
import GeometryService from '../services/GeometryService'
import BulletExplode from '../model/BulletExplode'

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
const sockets = {}
const bullets: Record<string, Bullet> = {}

const DEG2RAD = Math.PI/180
const deg2rad = (deg: number) => deg * DEG2RAD

function uuid() {
    return crypto.randomUUID()
}

io.on(EventsEnum.Connection, (socket) => {
    console.log(`A user #${socket.id} just connected.`)
    sockets[socket.id] = socket
    players[socket.id] = TankFactory.create(socket.id)
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

        if (player.weapons[index] === undefined || player.weapons[index].timeToReload !== null) {
            return
        }

        const id = uuid()
        bullets[id] = BulletFactory.create(id, socket.id, player.weapons[index].type, player.tankModel)
        player.weapons[index].timeToReload = WeaponService.getTimeToReload(player.weapons[index].type)
        player.lastAction = Date.now()
        io.sockets.emit(EventsEnum.BulletsUpdate, bullets)
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
            hittedPlayer.hp -= bullet.damage
            // TODO solve death player
            io.sockets.emit(
                EventsEnum.BulletExplode,
                {
                    id,
                    hittedPlayerId: hittedPlayer.playerId,
                    x: bullet.x,
                    y: bullet.y,
                    angle: bullet.angle,
                } as BulletExplode
            )
            io.sockets.emit(
                EventsEnum.PlayerUpdate,
                hittedPlayer
            )
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
        for (let weapon of players[id].weapons) {
            if (weapon.timeToReload !== null) {
                if (weapon.timeToReload.ttl <= UPDATE_INTERVAL) {
                    weapon.timeToReload = null
                } else {
                    weapon.timeToReload.ttl -= UPDATE_INTERVAL
                }
            }
        }

        if (players[id].immortalityTtl !== null) {
            if (players[id].immortalityTtl <= UPDATE_INTERVAL) {
                players[id].immortalityTtl = null
            } else {
                players[id].immortalityTtl -= UPDATE_INTERVAL
            }
        }
        // TODO: emit every time or only if there is change prom last emit?
        sockets[id].emit(EventsEnum.PlayerUpdate, players[id])
    }
}, UPDATE_INTERVAL)
