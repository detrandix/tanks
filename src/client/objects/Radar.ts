import Player from '../../model/Player'
import TankModel from '../../model/TankModel'
import Tank from './Tank'

const CIRCLE_RADIUS = 100
const INNER_CIRCLES_COUNT = 10
const MAX_DISTANCE = 1500
const LINES_COUNT = 30

export default class Radar extends Phaser.GameObjects.Container {
    mainPlayerId: string
    lineAngle: number
    dotsContainer: Phaser.GameObjects.Container

    constructor(scene: Phaser.Scene, x: number, y: number, mainPlayerId: string, players: Record<string, Player>) {
        super(scene, x, y)
        this.setScrollFactor(0)
        this.setDepth(100)
        this.lineAngle = 0
        this.mainPlayerId = mainPlayerId

        this.createBackgroundCircle()

        this.dotsContainer = new Phaser.GameObjects.Container(scene, 0, 0)
        this.add(this.dotsContainer)

        this.drawPlayers(players)
    }

    createBackgroundCircle() {
        this.add(this.scene.add.graphics()
            .fillStyle(0x000000, 1)
            .fillCircle(0, 0, CIRCLE_RADIUS)
            .closePath())

        const step = CIRCLE_RADIUS/INNER_CIRCLES_COUNT
        for (let radius=step; radius<=CIRCLE_RADIUS; radius += step) {
            this.add(this.scene.add.graphics()
                .lineStyle(1, 0x70c470, 1)
                .strokeCircle(0, 0, radius)
                .closePath())
        }

        const linesGroup = this.scene.add.container(0 ,0)
        this.add(linesGroup)
        for (let i=-LINES_COUNT; i<=0; i++) {
            const line = this.scene.add.line(0, 0, 0, 0, 0, -CIRCLE_RADIUS, 0x76d27b, 0.5 + 0.5 * (i/LINES_COUNT))
                .setOrigin(0, 0)
            line.angle = i
            linesGroup.add(line)
        }

        this.scene.tweens.add({
            targets: linesGroup,
            ease: 'Linear',
            duration: 2000,
            delay: 0,
            repeat: -1,
            yoyo: false,
            angle: 360,
        })
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
