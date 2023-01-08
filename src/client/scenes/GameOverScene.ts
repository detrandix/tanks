export default class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

	create() {
	}

	restartGame() {
		this.scene.start('MainScene');
	}
}
