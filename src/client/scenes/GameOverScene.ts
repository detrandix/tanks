export default class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

	create() {
	}

	restartGame() {
		this.game.state.start('MainScene');
	}
}
