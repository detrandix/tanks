import Player from '../../model/Player';
import io from 'socket.io-client'
import MainSceneData from '../../model/MainSceneData';
import { EventsEnum } from '../../model/EventsEnum';
import InitStateEvent from '../../model/InitStateEvent';

export default class Preload extends Phaser.Scene {
    socket: SocketIOClient.Socket;

    constructor() {
        super('PreloadScene');
    }

	preload() {
        let dpr = this.scale.displayScale.x // we suppose that x === y

        // brown tank
        this.load.image('tank-body-brown', `assets/images/tank-01/color-a/body@${dpr}.png`)
        this.load.image('tank-turret-brown', `assets/images/tank-01/color-a/turret@${dpr}.png`)
        // green tank
        this.load.image('tank-body-green', `assets/images/tank-01/color-b/body@${dpr}.png`)
        this.load.image('tank-turret-green', `assets/images/tank-01/color-b/turret@${dpr}.png`)
        // cyan tank
        this.load.image('tank-body-cyan', `assets/images/tank-01/color-c/body@${dpr}.png`)
        this.load.image('tank-turret-cyan', `assets/images/tank-01/color-c/turret@${dpr}.png`)
        // blue tank
        this.load.image('tank-body-blue', `assets/images/tank-01/color-d/body@${dpr}.png`)
        this.load.image('tank-turret-blue', `assets/images/tank-01/color-d/turret@${dpr}.png`)
        // others
        this.load.image('heavy-shell', `assets/images/weapons/heavy-shell@${dpr}.png`)
        this.load.image('granade-shell', `assets/images/weapons/granade-shell@${dpr}.png`)
        this.load.image('background', `assets/images/background@${dpr}.jpg`)
        dpr = 1 // TODO: only temporary solution
        // exhaust
        this.load.image('exhaust0', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_000@${dpr}.png`)
        this.load.image('exhaust1', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_001@${dpr}.png`)
        this.load.image('exhaust2', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_002@${dpr}.png`)
        this.load.image('exhaust3', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_003@${dpr}.png`)
        this.load.image('exhaust4', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_004@${dpr}.png`)
        this.load.image('exhaust5', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_005@${dpr}.png`)
        this.load.image('exhaust6', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_006@${dpr}.png`)
        this.load.image('exhaust7', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_007@${dpr}.png`)
        this.load.image('exhaust8', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_008@${dpr}.png`)
        this.load.image('exhaust9', `assets/images/effects/exhaust-01/Sprite_Effects_Exhaust_01_009@${dpr}.png`)
        // shot impact
        this.load.image('impact0', `assets/images/effects/fire-shot-impact/Sprite_Fire_Shots_Impact_A_000@${dpr}.png`)
        this.load.image('impact1', `assets/images/effects/fire-shot-impact/Sprite_Fire_Shots_Impact_A_001@${dpr}.png`)
        this.load.image('impact2', `assets/images/effects/fire-shot-impact/Sprite_Fire_Shots_Impact_A_002@${dpr}.png`)
        this.load.image('impact3', `assets/images/effects/fire-shot-impact/Sprite_Fire_Shots_Impact_A_003@${dpr}.png`)
        // explosion
        this.load.image('explosion0', `assets/images/effects/explosion/Sprite_Effects_Explosion_000@${dpr}.png`)
        this.load.image('explosion1', `assets/images/effects/explosion/Sprite_Effects_Explosion_001@${dpr}.png`)
        this.load.image('explosion2', `assets/images/effects/explosion/Sprite_Effects_Explosion_002@${dpr}.png`)
        this.load.image('explosion3', `assets/images/effects/explosion/Sprite_Effects_Explosion_003@${dpr}.png`)
        this.load.image('explosion4', `assets/images/effects/explosion/Sprite_Effects_Explosion_004@${dpr}.png`)
        this.load.image('explosion5', `assets/images/effects/explosion/Sprite_Effects_Explosion_005@${dpr}.png`)
        this.load.image('explosion6', `assets/images/effects/explosion/Sprite_Effects_Explosion_006@${dpr}.png`)
        this.load.image('explosion7', `assets/images/effects/explosion/Sprite_Effects_Explosion_007@${dpr}.png`)
        this.load.image('explosion8', `assets/images/effects/explosion/Sprite_Effects_Explosion_008@${dpr}.png`)
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

        this.anims.create({
            key: 'explosion',
            frames: [
                {key: 'explosion0'},
                {key: 'explosion1'},
                {key: 'explosion2'},
                {key: 'explosion3'},
                {key: 'explosion4'},
                {key: 'explosion5'},
                {key: 'explosion6'},
                {key: 'explosion7'},
                {key: 'explosion8'},
            ],
            frameRate: 16,
            repeat: -1
        })

        this.socket = io()

        this.socket.on(EventsEnum.InitState, (initStateEvent: InitStateEvent) => {
            this.scene.start('MainScene', {
                socket: this.socket,
                players: initStateEvent.players,
                tanks: initStateEvent.tanks,
            } as MainSceneData)
        })
	}
}
