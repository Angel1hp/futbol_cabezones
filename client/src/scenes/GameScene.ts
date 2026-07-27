import Phaser from 'phaser';
import { socketService } from '../services/socket.service';
import { GAME_CONFIG, MatchSnapshot } from '@futbol-cabezones/shared';

export class GameScene extends Phaser.Scene {
  private playerSprites: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private ballSprite!: Phaser.GameObjects.Sprite;
  
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private goalOverlay!: Phaser.GameObjects.Text;

  private keys!: {
    w: Phaser.Input.Keyboard.Key,
    a: Phaser.Input.Keyboard.Key,
    d: Phaser.Input.Keyboard.Key,
    space: Phaser.Input.Keyboard.Key,
  };

  private inputSequence = 0;
  
  // Interpolation targets
  private serverSnapshot: MatchSnapshot | null = null;
  private targets: { [id: string]: { x: number, y: number, isKicking: boolean, vx: number } } = {};
  private targetBall = { x: 0, y: 0 };

  private myRole!: string;
  private matchPlayers: { id: string, sprite: string }[] = [];
  private ballKey: string = 'ball';
  private stadiumKey: string = 'bg_stadium';
  private bgMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: any) {
    this.playerSprites = {};
    this.targets = {};
    this.serverSnapshot = null;
    this.inputSequence = 0;

    this.myRole = data?.role || 'p1';
    this.matchPlayers = data?.players || [
      { id: 'p1', sprite: 'char_messi' },
      { id: 'p2', sprite: 'char_mbappe' }
    ];
    this.ballKey = data?.ballKey || 'ball';
    this.stadiumKey = data?.stadiumKey || 'bg_stadium';
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    if (this.stadiumKey === 'video_bombonera') {
      const bgVideo = this.add.video(width / 2, height / 2, this.stadiumKey).setMute(true);
      bgVideo.play(true);
      bgVideo.on('play', () => {
        const videoW = bgVideo.video?.videoWidth || 1080;
        const videoH = bgVideo.video?.videoHeight || 720;
        const scaleX = width / videoW;
        const scaleY = height / videoH;
        bgVideo.setScale(Math.max(scaleX, scaleY));
      });
    } else {
      this.add.image(width / 2, height / 2, this.stadiumKey).setDisplaySize(width, height);
    }
    
    // Suelo invisible
    this.add.rectangle(width / 2, GAME_CONFIG.FIELD_HEIGHT + 10, width, 20, 0x00ff88, 0); // Oculto

    // Goal visual markers
    this.add.rectangle(GAME_CONFIG.GOAL_WIDTH / 2, GAME_CONFIG.FIELD_HEIGHT - GAME_CONFIG.GOAL_HEIGHT / 2, GAME_CONFIG.GOAL_WIDTH, GAME_CONFIG.GOAL_HEIGHT, 0xff0055, 0.3);
    this.add.rectangle(GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.GOAL_WIDTH / 2, GAME_CONFIG.FIELD_HEIGHT - GAME_CONFIG.GOAL_HEIGHT / 2, GAME_CONFIG.GOAL_WIDTH, GAME_CONFIG.GOAL_HEIGHT, 0x0055ff, 0.3);

    // Ball Particles (Estela)
    const particles = this.add.particles(0, 0, 'particle', {
      speed: 20,
      scale: { start: 1, end: 0 },
      alpha: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 300
    });

    // Sprites
    this.matchPlayers.forEach((p, i) => {
      const startX = (p.id === 'p1' || p.id === 'p3') ? 200 : 800;
      this.playerSprites[p.id] = this.add.sprite(startX, 300, p.sprite).setDisplaySize(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT);
      this.targets[p.id] = { x: startX, y: 300, isKicking: false, vx: 0 };
    });

    this.ballSprite = this.add.sprite(width / 2, 200, this.ballKey).setDisplaySize(GAME_CONFIG.BALL_RADIUS * 2, GAME_CONFIG.BALL_RADIUS * 2);
    
    particles.startFollow(this.ballSprite);

    // Controls
    if (this.input.keyboard) {
      this.keys = {
        w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      };
    }

    // UI
    this.scoreText = this.add.text(width / 2, 30, '0 - 0', { font: '900 48px Inter, monospace', color: '#ffffff' }).setOrigin(0.5);
    this.timeText = this.add.text(width / 2, 70, '02:00', { font: '600 24px Inter, monospace', color: '#00ff88' }).setOrigin(0.5);
    
    this.goalOverlay = this.add.text(width / 2, height / 2, '¡GOOOOOL!', { font: '900 80px Inter, sans-serif', color: '#ffcc00' })
      .setOrigin(0.5).setAlpha(0).setShadow(0, 5, '#000000', 10);

    // Socket
    const socket = socketService.getSocket();
    socket.on('game:snapshot', (snapshot: MatchSnapshot) => {
      this.serverSnapshot = snapshot;
      
      snapshot.players.forEach(p => {
        if (!this.targets[p.id]) this.targets[p.id] = { x: p.x, y: p.y, isKicking: p.isKicking, vx: p.vx };
        this.targets[p.id].x = p.x;
        this.targets[p.id].y = p.y;
        this.targets[p.id].isKicking = p.isKicking;
        this.targets[p.id].vx = p.vx;
        
        if (this.playerSprites[p.id]) {
          this.playerSprites[p.id].rotation = p.isKicking ? ((p.id === 'p1' || p.id === 'p3') ? 0.3 : -0.3) : 0;
        }
      });
      
      this.targetBall.x = snapshot.ball.x;
      this.targetBall.y = snapshot.ball.y;

      // Update UI Timer and Score quietly if not interrupted
      this.scoreText.setText(`${snapshot.score[0]} - ${snapshot.score[1]}`);
      const m = Math.floor(snapshot.time / 60);
      const s = snapshot.time % 60;
      this.timeText.setText(`${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`);
    });

    socket.on('game:goal_scored', (data: { scorerId: string, newScore: [number, number] }) => {
      this.sound.stopByKey('gool');
      this.sound.play('gool');
      this.scoreText.setText(`${data.newScore[0]} - ${data.newScore[1]}`);
      
      // Camera shake para impacto
      this.cameras.main.shake(500, 0.02);

      const scorerPlayer = this.matchPlayers.find(p => p.id === data.scorerId);
      const name = scorerPlayer ? scorerPlayer.sprite.replace('char_', '') : 'Jugador';
      
      this.goalOverlay.setText(`¡GOL DE ${name.toUpperCase()}!`);
      this.goalOverlay.setAlpha(1);

      this.tweens.add({
        targets: this.goalOverlay,
        scale: { from: 0.5, to: 1.2 },
        duration: 500,
        ease: 'Bounce.easeOut'
      });

      // Ocultar después de 3 segundos (antes de que se resetee la posición)
      this.time.delayedCall(2500, () => {
        this.tweens.add({
          targets: this.goalOverlay,
          alpha: 0,
          duration: 500
        });
      });
    });

    socket.on('game:match_ended', (data: { winnerId: string | null, finalScore: [number, number] }) => {
      this.goalOverlay.setText(data.winnerId ? `¡GANÓ ${data.winnerId.toUpperCase()}!` : '¡EMPATE!');
      this.goalOverlay.setAlpha(1);
      
      this.time.delayedCall(4000, () => {
        this.scene.start('MainMenuScene');
      });
    });

    this.add.text(10, 10, 'ONLINE MATCH', { font: '16px monospace', color: '#00ff88' });

    // Salir con ESC
    this.add.text(width - 150, 10, 'ESC para salir', { font: '16px monospace', color: '#ff0055' });
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        const socket = socketService.getSocket();
        socket.disconnect();
        this.scene.start('MainMenuScene');
      });
    }

    // Audio de ambiente
    this.bgMusic = this.sound.add('ambiental', { loop: true, volume: 0.3 });
    this.bgMusic.play();
    
    // Detener la música del menú si estaba sonando
    const menuMusic = this.sound.get('music');
    if (menuMusic && menuMusic.isPlaying) {
      menuMusic.stop();
    }
  }

  update(time: number, delta: number) {
    const socket = socketService.getSocket();

    // 1. Recolectar Input Local
    const input = {
      sequence: this.inputSequence++,
      left: this.keys.a.isDown,
      right: this.keys.d.isDown,
      jump: Phaser.Input.Keyboard.JustDown(this.keys.w),
      kick: Phaser.Input.Keyboard.JustDown(this.keys.space)
    };

    // 2. Enviar Input al Servidor
    socket.emit('game:player_input', input);

    // 3. Predicción / Interpolación visual
    const lerpFactor = 0.3; // Ajustable

    Object.keys(this.targets).forEach(id => {
      if (this.playerSprites[id]) {
        this.playerSprites[id].x += (this.targets[id].x - this.playerSprites[id].x) * lerpFactor;
        this.playerSprites[id].y += (this.targets[id].y - this.playerSprites[id].y) * lerpFactor;
        
        // Flip visual
        const vx = this.targets[id].vx;
        if (vx < 0) this.playerSprites[id].setFlipX(true);
        else if (vx > 0) this.playerSprites[id].setFlipX(false);
      }
    });

    this.ballSprite.x += (this.targetBall.x - this.ballSprite.x) * lerpFactor;
    this.ballSprite.y += (this.targetBall.y - this.ballSprite.y) * lerpFactor;

    // Flip X (local override temporal para mejor feel)
    if (this.playerSprites[this.myRole]) {
      if (this.keys.a.isDown) this.playerSprites[this.myRole].setFlipX(true);
      else if (this.keys.d.isDown) this.playerSprites[this.myRole].setFlipX(false);
    }
    
    // Rotación de la pelota (simulación local sencilla)
    if (this.serverSnapshot && Math.abs(this.serverSnapshot.ball.vx) > 10) {
      this.ballSprite.rotation += (this.serverSnapshot.ball.vx * (delta/1000)) / 30;
    }
  }

  // Cleanup en caso de salir
  public shutdown() {
    const socket = socketService.getSocket();
    socket.off('game:snapshot');
    if (this.bgMusic) {
      this.bgMusic.stop();
    }
  }
}
