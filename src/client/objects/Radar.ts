import Player from '../../model/Player'
import TankModel from '../../model/TankModel'
import Tank from './Tank'

const CIRCLE_RADIUS = 100
const MAX_DISTANCE = 1000

export default class Radar extends Phaser.GameObjects.Container {
    mainPlayerId: string
    backgroundCircle: Phaser.GameObjects.Graphics
    dotsContainer: Phaser.GameObjects.Container

    constructor(scene: Phaser.Scene, x: number, y: number, mainPlayerId: string, players: Record<string, Player>) {
        super(scene, x, y)
        this.setScrollFactor(0)
        this.setDepth(100)
        this.mainPlayerId = mainPlayerId
        this.backgroundCircle = scene.add.graphics()
            .fillStyle(0x000000, 1)
            .fillCircle(0, 0, CIRCLE_RADIUS)
            .closePath()
        this.dotsContainer = new Phaser.GameObjects.Container(scene, 0, 0)

        this.add([
            this.backgroundCircle,
            this.dotsContainer
        ])

        this.drawPlayers(players)
    }

    drawPlayers(players: Record<string, Player>) {
        this.dotsContainer.removeAll()

        const mainPlayer = players[this.mainPlayerId]
        for (let id in players) {
            if (id === this.mainPlayerId) {
                continue
            }

            const player = players[id]
            const distance = Phaser.Math.Distance.Between(
                player.tankModel.center.x,
                player.tankModel.center.y,
                mainPlayer.tankModel.center.x,
                mainPlayer.tankModel.center.y
            )

            const angle = Phaser.Math.Angle.Between(
                player.tankModel.center.x,
                player.tankModel.center.y,
                mainPlayer.tankModel.center.x,
                mainPlayer.tankModel.center.y
            ) + Math.PI

            const circleDistace = distance <= MAX_DISTANCE ? CIRCLE_RADIUS * (distance / MAX_DISTANCE) : CIRCLE_RADIUS

            let x = circleDistace * Math.cos(angle)
            let y = circleDistace * Math.sin(angle)

            let circle = this.scene.add.circle(x, y, 3, 0x00ff00)
            this.dotsContainer.add(circle)
        }
    }
}
