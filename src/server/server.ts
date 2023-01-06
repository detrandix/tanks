import 'source-map-support/register'

import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import path from 'path'
import compression from 'compression'
import Player from '../model/Player'
import Bullet from '../model/Bullet'

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

io.on('connection', (socket) => {
    console.log(`A user #${socket.id} just connected.`)
    sockets[socket.id] = socket
    players[socket.id] = {
        connected: Date.now(),
        lastAction: Date.now(),
        bodyRotation: 0,
        turretRotation: 0,
        x: Math.floor(Math.random() * 300) + 200,
        y: Math.floor(Math.random() * 300) + 200,
        playerId: socket.id,
        name: 'Player' + socket.id,
        color: tankColors.random(),
        timeToReload: null,
        hp: 100,
        maxHp: 100,
    }
    socket.emit('init-state', players) // send the players object to the new player
    socket.broadcast.emit('new-player', players[socket.id]) // update all other players of the new player

    socket.on('body-rotate-left', () => {
        players[socket.id].bodyRotation -= 1
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('body-rotate-right', () => {
        players[socket.id].bodyRotation += 1
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('move-up', () => {
        players[socket.id].x += Math.cos(deg2rad(players[socket.id].bodyRotation - 90))
        players[socket.id].y += Math.sin(deg2rad(players[socket.id].bodyRotation - 90))
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('move-down', () => {
        players[socket.id].x -= Math.cos(deg2rad(players[socket.id].bodyRotation - 90))
        players[socket.id].y -= Math.sin(deg2rad(players[socket.id].bodyRotation - 90))
        players[socket.id].lastAction = Date.now()
        io.sockets.emit('player-moved', players[socket.id])
    })

    socket.on('turret-rotate', (targetAngle: number) => {
        const diff = (players[socket.id].turretRotation - 90) - targetAngle
        players[socket.id].turretRotation -= diff // TODO: emit step by step
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
            x: players[socket.id].x,
            y: players[socket.id].y,
            angle: players[socket.id].turretRotation,
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
            sockets[id].emit('update-player', players[id])
        }
    }
}, UPDATE_INTERVAL)
