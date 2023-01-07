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
const fires: Record<string, Bullet> = {}

const DEG2RAD = Math.PI/180
const deg2rad = (deg: number) => deg * DEG2RAD

function uuid() {
    return crypto.randomUUID()
}

io.on('connection', (socket) => {
    console.log(`A user #${socket.id} just connected.`)
    sockets[socket.id] = socket
    players[socket.id] = TankFactory.create(socket.id)
    socket.emit('init-state', players) // send the players object to the new player
    socket.broadcast.emit('new-player', players[socket.id]) // update all other players of the new player

    socket.on('body-rotate-left', () => {
        players[socket.id].tankModel.addRotation(-1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('body-rotate-right', () => {
        players[socket.id].tankModel.addRotation(1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('move-up', () => { // TODO: move-forward
        players[socket.id].tankModel.move(1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('move-down', () => {
        players[socket.id].tankModel.move(-1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('turret-rotate', (angleDiff: number) => {
        if (angleDiff > -.1 && angleDiff < 0.1) {
            return
        }

        players[socket.id].tankModel.addTurretRotation(angleDiff)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('fire', (index) => {
        const player = players[socket.id]

        if (player.weapons[index] === undefined || player.weapons[index].timeToReload !== null) {
            return
        }

        const id = uuid()
        fires[id] = BulletFactory.create(id, player.weapons[index].type, player.tankModel)
        player.weapons[index].timeToReload = WeaponService.getTimeToReload(player.weapons[index].type)
        player.lastAction = Date.now()
        io.sockets.emit('fires', fires)
    })

    socket.on('disconnect', () => {
        console.log(`A user #${socket.id} has disconnected.`);
        delete players[socket.id]
        delete sockets[socket.id]
        io.emit('remove-player', socket.id)
    })
})

// update every 15ms (aproximatly 66 updates/s)
// TODO: maybe slow down after add interpolation to client code
const UPDATE_INTERVAL = 15

function updateFire(fire: Bullet) {
    let removedTime = UPDATE_INTERVAL
    if (removedTime > fire.ttl) {
        removedTime = fire.ttl
    }
    const move = fire.speed * removedTime
    return {
        ...fire,
        ttl: fire.ttl - removedTime,
        x: fire.x + move * Math.cos(deg2rad(fire.angle - 90)),
        y: fire.y + move * Math.sin(deg2rad(fire.angle - 90)),
    }
}

setInterval(() => {
    for (let id in fires) {
        const fire = updateFire(fires[id])
        if (fire.ttl > 0) {
            fires[id] = fire
        } else {
            delete fires[id]
        }
    }
    io.sockets.emit('fires', fires)

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
        sockets[id].emit('update-player', players[id])
    }
}, UPDATE_INTERVAL)
