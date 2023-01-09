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
import TankModel from '../model/TankModel'
import InitStateEvent from '../model/InitStateEvent'
import NewPlayerEvent from '../model/NewPlayerEvent'

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

let playersCount = 0
const players: Record<string, Player> = {}
const tanks: Record<string, TankModel> = {}
const sockets = {}
const bullets: Record<string, Bullet> = {}

const DEG2RAD = Math.PI/180
const deg2rad = (deg: number) => deg * DEG2RAD

// TODO: move to some DI
const tankModelFactory = new TankModelFactory()
const playerFactory = new PlayerFactory()

const initPlayer = (playerId: string): Player => {
    players[playerId] = playerFactory.create(playerId)
    const tankModel = tankModelFactory.create(players[playerId], tanks)
    players[playerId].tankModelId = tankModel.id
    tanks[tankModel.id] = tankModel
    return players[playerId]
}

const getTankModel = (playerId: string): TankModel|null => {
    if (! (playerId in players)) {
        return null
    }
    const tankModelId = players[playerId].tankModelId
    if (tankModelId === null) {
        return null
    }
    return tankModelId in tanks ? tanks[tankModelId] : null
}

const setDestroydTtl = (tankModel: TankModel): TankModel => {
    tankModel.destroyed = 10000 // 10s TTL
    return tankModel
}

io.on(EventsEnum.Connection, (socket) => {
    playersCount++
    console.log(`A user #${socket.id} just connected. (total count: ${playersCount})`)
    sockets[socket.id] = socket
    initPlayer(socket.id)
    socket.emit(EventsEnum.InitState, {
        players,
        tanks
    } as InitStateEvent) // send the players object to the new player
    socket.broadcast.emit(EventsEnum.NewPlayer, {
        player: players[socket.id],
        tank: tanks[players[socket.id].tankModelId as string]
    } as NewPlayerEvent) // update all other players of the new player

    socket.on(EventsEnum.BodyRotateLeft, () => {
        const tankModel = getTankModel(socket.id)
        if (tankModel === null) {
            return
        }
        tankModel.addRotation(-1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.TankMoved, tankModel)
    })

    socket.on(EventsEnum.BodyRotateRight, () => {
        const tankModel = getTankModel(socket.id)
        if (tankModel === null) {
            return
        }
        tankModel.addRotation(1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.TankMoved, tankModel)
    })

    socket.on(EventsEnum.MoveForward, () => {
        const tankModel = getTankModel(socket.id)
        if (tankModel === null) {
            return
        }
        tankModel.move(1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.TankMoved, tankModel)
    })

    socket.on(EventsEnum.MoveBackward, () => {
        const tankModel = getTankModel(socket.id)
        if (tankModel === null) {
            return
        }
        tankModel.move(-1)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.TankMoved, tankModel)
    })

    socket.on(EventsEnum.TurretRotate, (angleDiff: number) => {
        if (angleDiff > -.1 && angleDiff < 0.1) {
            return
        }
        const tankModel = getTankModel(socket.id)
        if (tankModel === null) {
            return
        }
        tankModel.addTurretRotation(angleDiff)
        players[socket.id].lastAction = Date.now()
        io.sockets.emit(EventsEnum.TankMoved, tankModel)
    })

    socket.on(EventsEnum.Fire, (index: number) => {
        const player = players[socket.id]
        const tankModel = getTankModel(socket.id)
        if (tankModel === null) {
            return
        }

        if (tankModel.weapons[index] === undefined || tankModel.weapons[index].timeToReload !== null) {
            return
        }

        const bullet = BulletFactory.create(tankModel.id, tankModel.weapons[index].type, tankModel)
        bullets[bullet.id] = bullet
        tankModel.weapons[index].timeToReload = WeaponService.getTimeToReload(tankModel.weapons[index].type)
        player.lastAction = Date.now()
        // this bullet will be proceeed in main loop - TODO: is this good solution?
    })

    socket.on(EventsEnum.Disconnected, () => {
        playersCount--
        console.log(`A user #${socket.id} has disconnected. (total count: ${playersCount})`);

        for (let id in tanks) {
            if (tanks[id].playerId === socket.id && tanks[id].destroyed === false) {
                setDestroydTtl(tanks[id])
                io.sockets.emit(
                    EventsEnum.TankDestroyed,
                    {
                        bullet: null,
                        updatedPlayer: null,
                        oldTank: tanks[id],
                        newTank: null,
                    } as TankDestroyed
                )
            }
        }

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

function bulletHitSomeTank(bullet: Bullet): TankModel|null {
    for (let id in tanks) {
        const tankModel = tanks[id]
        if (
            (bullet.tankId === tankModel.id && tankModel.destroyed === false) // skip own live tank
            || tankModel.immortalityTtl !== null // skip immortal tanks
        ) {
            continue
        }

        if (GeometryService.pointInsidePolygon(bullet, tankModel.polygon)) {
            return tankModel
        }
    }
    return null
}

setInterval(() => {
    let emitedBullets = []
    for (let id in bullets) {
        const bullet = updateBullet(bullets[id])
        const hittedTank = bulletHitSomeTank(bullet)
        if (hittedTank !== null) {
            if (hittedTank.destroyed !== false) {
                continue
            }

            hittedTank.hp -= bullet.damage

            const bulletExplode = {
                id,
                hittedTankId: hittedTank.id,
                x: bullet.x,
                y: bullet.y,
                angle: bullet.angle,
                updatedTank: hittedTank, // TODO: add another changes like destroyed
            } as BulletExplode

            if (hittedTank.destroyed) {
                io.sockets.emit(
                    EventsEnum.BulletExplode,
                    bulletExplode
                )
                continue
            }

            if (hittedTank.hp <= 0) {
                let newTank = null
                let hittedPlayer = null
                setDestroydTtl(hittedTank)
                if (hittedTank.playerId in players) {
                    newTank = tankModelFactory.create(players[hittedTank.playerId], tanks)
                    tanks[newTank.id] = newTank
                    hittedPlayer = players[hittedTank.playerId]
                    hittedPlayer.tankModelId = newTank.id
                }
                io.sockets.emit(
                    EventsEnum.TankDestroyed,
                    {
                        bullet: bulletExplode,
                        updatedPlayer: hittedPlayer,
                        oldTank: hittedTank,
                        newTank,
                    } as TankDestroyed
                )
            } else {
                io.sockets.emit(
                    EventsEnum.BulletExplode,
                    bulletExplode
                )
                io.sockets.emit(
                    EventsEnum.TankUpdate,
                    hittedTank
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

    let removeTanksIds = []
    for (let id in tanks) {
        for (let weapon of tanks[id].weapons) {
            if (weapon.timeToReload !== null) {
                if (weapon.timeToReload.ttl <= UPDATE_INTERVAL) {
                    weapon.timeToReload = null
                } else {
                    weapon.timeToReload.ttl -= UPDATE_INTERVAL
                }
            }
        }

        if (tanks[id].immortalityTtl !== null) {
            if (tanks[id].immortalityTtl <= UPDATE_INTERVAL) {
                tanks[id].immortalityTtl = null
            } else {
                tanks[id].immortalityTtl -= UPDATE_INTERVAL
            }
        }

        if (tanks[id].destroyed !== false) {
            tanks[id].destroyed -= UPDATE_INTERVAL
            if (tanks[id].destroyed <= 0) {
                io.sockets.emit(EventsEnum.RemoveTank, tanks[id])
                removeTanksIds.push(id)
            }
        }

        if (tanks[id].playerId in sockets) {
            // TODO: emit every time or only if there is change prom last emit?
            sockets[tanks[id].playerId].emit(EventsEnum.TankUpdate, tanks[id])
        }
    }

    for (let id in removeTanksIds) {
        delete tanks[id]
    }
}, UPDATE_INTERVAL)
