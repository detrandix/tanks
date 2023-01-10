import Player from '../../model/Player'

const FONT_SIZE = 14
const PADDING = 10

export default class PlayersList extends Phaser.GameObjects.Container {
    rectangle: Phaser.GameObjects.Rectangle
    playersContainer: Phaser.GameObjects.Container
    transformedFontSize: number
    transformedPadding: number

    constructor(scene: Phaser.Scene, x: number, y: number, players: Record<string, Player>, playerId: string) {
        super(scene, x, y)
        this.setScrollFactor(0)
        this.setDepth(100)

        this.transformedFontSize = scene.scale.transformY(FONT_SIZE)
        this.transformedPadding = scene.scale.transformY(PADDING)

        const width = scene.scale.transformX(250)
        const height = scene.scale.transformY(200)
        this.rectangle = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(1, 0)
        const titleFontSize = scene.scale.transformY(16)
        const title = this.scene.add
            .text(-width + this.transformedPadding, this.transformedPadding, 'Players:', {
                fontFamily: 'monospace',
                fontSize: titleFontSize + 'px',
                //fontStyle: 'strong'
            })
            .setOrigin(0, 0)
        this.playersContainer = new Phaser.GameObjects.Container(
            scene,
            -width + this.transformedPadding,
            2 * this.transformedPadding + titleFontSize,
        )

        this.add([this.rectangle, title, this.playersContainer])

        this.updatePlayers(players, playerId)
    }

    updatePlayers(players: Record<string, Player>, playerId: string): void {
        for (let children of this.playersContainer.list) {
            children.destroy()
        }
        this.playersContainer.removeAll()

        let y = 0
        const yStep = this.scene.scale.transformY(FONT_SIZE + PADDING)
        const fontSize = this.scene.scale.transformY(FONT_SIZE)

        // TODO: sort players
        for (let id in players) {
            const text = this.scene.add
                .text(0, y, players[id].name, {
                    fontFamily: 'monospace',
                    fontSize: fontSize + 'px',
                    color: id === playerId ? 'yellow' : 'white',
                })
                .setOrigin(0, 0)
            this.playersContainer.add(text)
            y += yStep
        }

        this.rectangle.height = this.playersContainer.y + y
    }
}
