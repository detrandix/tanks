import 'source-map-support/register'

import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import path from 'path'
import compression from 'compression'
import Player from '../model/Player'
import Bullet from '../model/Bullet'
import TankModel from '../model/TankModel'

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

Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}
const tankColors = ['brown', 'green', 'cyan', 'blue']

function createTank(playerId: string): Player {
    const x = Math.floor(Math.random() * 300) + 200
    const y = Math.floor(Math.random() * 300) + 200
    return {
        connected: Date.now(),
        lastAction: Date.now(),
        playerId: playerId,
        name: 'Player' + playerId,
        color: tankColors.random(),
        timeToReload: null,
        hp: 100,
        maxHp: 100,
        immortalityTtl: 3000,
        tankModel: new TankModel(
            {x, y},
            164,
            256,
            0,
            50,
            0,
            {x: 0.5, y: 0.8},
        ), // TODO move constant to some TankFactory
    }
}

io.on('connection', (socket) => {
    console.log(`A user #${socket.id} just connected.`)
    sockets[socket.id] = socket
    players[socket.id] = createTank(socket.id)
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

    socket.on('fire', () => {
        if (players[socket.id].timeToReload !== null) {
            return
        }

        const id = uuid()
        fires[id] = {
            id,
            x: players[socket.id].tankModel.center.x,
            y: players[socket.id].tankModel.center.y,
            angle: players[socket.id].tankModel.turretAngle,
            created: Date.now(),
            ttl: 1000,
            speed: 1, // px / ms
        }
        players[socket.id].timeToReload = {
            ttl: 1000,
            total: 1000,
        }
        players[socket.id].lastAction = Date.now()
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

function updateFire(fire) {
    let removedTime = UPDATE_INTERVAL
    if (removedTime > fire.ttl) {
        removedTime = fire.tttl
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
        if (players[id].timeToReload !== null) {
            if (players[id].timeToReload.ttl <= UPDATE_INTERVAL) {
                players[id].timeToReload = null
            } else {
                players[id].timeToReload.ttl -= UPDATE_INTERVAL
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
