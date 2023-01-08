import Player from '../../model/Player';
import io from 'socket.io-client'
import MainSceneData from '../../model/MainSceneData';

export default class Preload extends Phaser.Scene {
    socket: SocketIOClient.Socket;

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
        // exhaust
        this.load.image('exhaust0', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_000.png')
        this.load.image('exhaust1', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_001.png')
        this.load.image('exhaust2', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_002.png')
        this.load.image('exhaust3', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_003.png')
        this.load.image('exhaust4', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_004.png')
        this.load.image('exhaust5', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_005.png')
        this.load.image('exhaust6', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_006.png')
        this.load.image('exhaust7', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_007.png')
        this.load.image('exhaust8', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_008.png')
        this.load.image('exhaust9', 'assets/Effects/Sprites/Sprite_Effects_Exhaust_01_009.png')
        // shot impact
        this.load.image('impact0', 'assets/Effects/Sprites/Sprite_Fire_Shots_Impact_A_000.png')
        this.load.image('impact1', 'assets/Effects/Sprites/Sprite_Fire_Shots_Impact_A_001.png')
        this.load.image('impact2', 'assets/Effects/Sprites/Sprite_Fire_Shots_Impact_A_002.png')
        this.load.image('impact3', 'assets/Effects/Sprites/Sprite_Fire_Shots_Impact_A_003.png')
        // music
        this.load.audio('heavy-shot', 'assets/music/heavy-shot.wav')
        this.load.audio('granade-shot', 'assets/music/granade-shot.wav')
        this.load.audio('hit', 'assets/music/hit.wav')
	}

	create() {
        this.anims.create({
            key: 'exhaust',
            frames: [
                {key: 'exhaust0'},
                {key: 'exhaust1'},
                {key: 'exhaust2'},
                {key: 'exhaust3'},
                {key: 'exhaust4'},
                {key: 'exhaust5'},
                {key: 'exhaust6'},
                {key: 'exhaust7'},
                {key: 'exhaust8'},
                {key: 'exhaust9'},
            ],
            frameRate: 16,
            repeat: 0
        })

        this.anims.create({
            key: 'shot-impact',
            frames: [
                {key: 'impact0'},
                {key: 'impact1'},
                {key: 'impact2'},
                {key: 'impact3'},
            ],
            frameRate: 16,
            repeat: 5
        })

        this.socket = io()

        this.socket.on('init-state', (players: Record<string, Player>) => {
            this.scene.start('MainScene', {
                socket: this.socket,
                players
            } as MainSceneData)
        })
	}
}
