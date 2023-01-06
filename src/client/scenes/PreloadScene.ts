export default class Preload extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

	preload() {
        // brown tank
        this.load.image('tank-body-brown', 'assets/Hulls_Color_A/Hull_01.png')
        this.load.image('tank-turret-brown', 'assets/Weapon_Color_A/Gun_01.png')
        // green tank
        this.load.image('tank-body-green', 'assets/Hulls_Color_B/Hull_01.png')
        this.load.image('tank-turret-green', 'assets/Weapon_Color_B/Gun_01.png')
        // cyan tank
        this.load.image('tank-body-cyan', 'assets/Hulls_Color_C/Hull_01.png')
        this.load.image('tank-turret-cyan', 'assets/Weapon_Color_C/Gun_01.png')
        // blue tank
        this.load.image('tank-body-blue', 'assets/Hulls_Color_D/Hull_01.png')
        this.load.image('tank-turret-blue', 'assets/Weapon_Color_D/Gun_01.png')
        // others
        this.load.image('heavy-shell', 'assets/Effects/Heavy_Shell.png')
        this.load.image('granade-shell', 'assets/Effects/Granade_Shell.png')
        this.load.image('background', 'assets/background.jpg')
	}

	create() {
		//NOTE: Change to GameTitle if required
        this.scene.start('MainScene')



    /*socket.on('connect', () => {
        console.log("You're connected to socket.io")
      })

      // we wait until we have a valid clientId, then start the MainScene
      socket.on('clientId', (clientId: number) => {
        socket.clientId = clientId
        console.log('Your client id', clientId)
        this.scene.start('MenuScene', { socket })
      })*/
	}
}