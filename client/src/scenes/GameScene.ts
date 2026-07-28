import Phaser from 'phaser';
import { socketService } from '../services/socket.service';
import { GAME_CONFIG, MatchSnapshot } from '@futbol-cabezones/shared';

export class GameScene extends Phaser.Scene {
  private playerSprites: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private ballSprite!: Phaser.GameObjects.Sprite;
  
  private p1ScoreText!: Phaser.GameObjects.Text;
  private p2ScoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  private keys!: {
    w: Phaser.Input.Keyboard.Key,
    a: Phaser.Input.Keyboard.Key,
    d: Phaser.Input.Keyboard.Key,
    space: Phaser.Input.Keyboard.Key,
  };

  private inputSequence = 0;
  private lastInputJSON = '';
  
  // Interpolation targets
  private serverSnapshot: MatchSnapshot | null = null;
  private targets: { [id: string]: { x: number, y: number, isKicking: boolean, vx: number } } = {};
  private targetBall = { x: 0, y: 0 };

  private myRole!: string;
  private matchPlayers: { id: string, sprite: string, username?: string }[] = [];
  private ballKey: string = 'ball';
  private stadiumKey: string = 'bg_stadium';
  private bgMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { roomId?: string; role?: string; players?: { id: string; sprite: string; username?: string }[]; ballKey?: string; stadiumKey?: string }) {
    this.playerSprites = {};
    this.targets = {};
    this.serverSnapshot = null;
    this.inputSequence = 0;
    this.myRole = data.role || 'p1';
    this.matchPlayers = data.players || [
      { id: 'p1', sprite: 'char_messi' },
      { id: 'p2', sprite: 'char_mbappe' }
    ];
    this.stadiumKey = data.stadiumKey || 'bg_stadium';
    this.ballKey = data.ballKey || 'ball';
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

    // Goal visual markers (bajados un poco para que no floten)
    const goalVisualOffsetY = 30;
    this.add.sprite(GAME_CONFIG.GOAL_WIDTH / 2, GAME_CONFIG.FIELD_HEIGHT - GAME_CONFIG.GOAL_HEIGHT / 2 + goalVisualOffsetY, 'goal')
      .setDisplaySize(GAME_CONFIG.GOAL_WIDTH, GAME_CONFIG.GOAL_HEIGHT)
      .setFlipX(false); // Facing right

    this.add.sprite(GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.GOAL_WIDTH / 2, GAME_CONFIG.FIELD_HEIGHT - GAME_CONFIG.GOAL_HEIGHT / 2 + goalVisualOffsetY, 'goal')
      .setDisplaySize(GAME_CONFIG.GOAL_WIDTH, GAME_CONFIG.GOAL_HEIGHT)
      .setFlipX(true); // Facing left

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
    this.createScoreboard(width);

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
      this.p1ScoreText.setText(snapshot.score[0].toString());
      this.p2ScoreText.setText(snapshot.score[1].toString());
      this.timerText.setText(this.formatTime(snapshot.time));
    });

    socket.on('game:goal_scored', (data: { scorerId: string, newScore: [number, number] }) => {
      this.sound.stopByKey('gool');
      this.sound.play('gool');
      this.p1ScoreText.setText(data.newScore[0].toString());
      this.p2ScoreText.setText(data.newScore[1].toString());
      
      this.cameras.main.flash(500, 255, 255, 255);
      this.cameras.main.shake(500, 0.02);

      const scorerPlayer = this.matchPlayers.find(p => p.id === data.scorerId);
      const name = (scorerPlayer?.username || scorerPlayer?.sprite?.replace('char_', '') || 'Jugador').toUpperCase();
      
      const goalText = this.add.text(width / 2, height / 2, `¡GOL DE ${name}!`, {
        font: '900 80px Inter, sans-serif', color: '#ffcc00'
      }).setOrigin(0.5).setShadow(4, 4, '#000000', 0, true, true).setDepth(100);

      this.tweens.add({
        targets: goalText,
        scale: { from: 0.5, to: 1.2 },
        duration: 500,
        ease: 'Bounce.easeOut'
      });

      this.time.delayedCall(2500, () => {
        goalText.destroy();
      });
    });

    socket.on('game:match_ended', (data: { winnerId: string | null, finalScore: [number, number] }) => {
      // Dim background
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(99);
      
      this.add.text(width / 2, height / 2 - 50, '¡FIN DEL PARTIDO!', { font: '900 64px Inter', color: '#fff' })
        .setOrigin(0.5).setDepth(100);
      
      let winnerText = 'EMPATE';
      if (data.winnerId) {
         const winnerPlayer = this.matchPlayers.find(p => p.id === data.winnerId);
         const winnerName = (winnerPlayer?.username || winnerPlayer?.sprite?.replace('char_', '') || data.winnerId).toUpperCase();
         winnerText = `GANA ${winnerName}`;
      }

      this.add.text(width / 2, height / 2 + 50, winnerText, { font: '700 48px Inter', color: '#00ff88' })
        .setOrigin(0.5).setDepth(100);

      this.add.text(width / 2, height / 2 + 150, '> VOLVER AL MENÚ <', { font: '700 24px Inter', color: '#ff0055' })
        .setOrigin(0.5).setDepth(100)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
           const socket = socketService.getSocket();
           socket.disconnect();
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

    // 2. Enviar Input al Servidor SOLAMENTE si hubo cambios
    const currentState = JSON.stringify({ left: input.left, right: input.right, jump: input.jump, kick: input.kick });
    if (currentState !== this.lastInputJSON) {
      socket.emit('game:player_input', input);
      this.lastInputJSON = currentState;
    }

    // 3. Predicción / Interpolación visual
    const lerpFactor = 0.3; // Ajustable

    Object.keys(this.targets).forEach(id => {
      if (this.playerSprites[id]) {
        if (id === this.myRole) {
          // Predicción local (Client-Side Prediction simple) para respuesta instantánea
          const speed = GAME_CONFIG.BASE_SPEED * (delta / 1000);
          if (this.keys.a.isDown) {
            this.playerSprites[id].x -= speed;
            this.playerSprites[id].setFlipX(true);
          }
          if (this.keys.d.isDown) {
            this.playerSprites[id].x += speed;
            this.playerSprites[id].setFlipX(false);
          }
          
          // Corrección suave hacia la posición del servidor (Rubber-banding mitigation)
          this.playerSprites[id].x += (this.targets[id].x - this.playerSprites[id].x) * 0.1;
          this.playerSprites[id].y += (this.targets[id].y - this.playerSprites[id].y) * 0.3; 
        } else {
          // Rivales: Interpolación estricta hacia el snapshot del servidor
          this.playerSprites[id].x += (this.targets[id].x - this.playerSprites[id].x) * lerpFactor;
          this.playerSprites[id].y += (this.targets[id].y - this.playerSprites[id].y) * lerpFactor;
          
          // Flip visual para rivales
          const vx = this.targets[id].vx;
          if (vx < 0) this.playerSprites[id].setFlipX(true);
          else if (vx > 0) this.playerSprites[id].setFlipX(false);
        }
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

  private createScoreboard(width: number) {
    const boardWidth = 400;
    const boardHeight = 120;
    const x = width / 2;
    const y = 80;

    // Background panel
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.9); // Dark blue
    bg.fillRoundedRect(x - boardWidth / 2, y - boardHeight / 2, boardWidth, boardHeight, 16);
    
    // Neon borders
    bg.lineStyle(4, 0x00e5ff, 1);
    bg.strokeRoundedRect(x - boardWidth / 2, y - boardHeight / 2, boardWidth, boardHeight, 16);
    
    bg.lineStyle(2, 0xffea00, 0.8);
    bg.strokeRoundedRect(x - boardWidth / 2 - 8, y - boardHeight / 2 - 8, boardWidth + 16, boardHeight + 16, 20);

    // Top text (Estadio)
    this.add.text(x, y - 75, 'ESTADIO PRINCIPAL', {
      font: '24px "Burbank", monospace',
      color: '#ffea00'
    }).setOrigin(0.5).setShadow(0, 0, '#ffea00', 5, true, true).setStroke('#000000', 4);

    // VS text
    this.add.text(x, y - 10, 'VS', {
      font: '48px "Burbank", monospace',
      color: '#00e5ff'
    }).setOrigin(0.5).setShadow(0, 0, '#00e5ff', 10, true, true).setStroke('#000000', 6);

    // Scores
    this.p1ScoreText = this.add.text(x - 70, y - 10, '0', {
      font: '64px "Burbank", monospace',
      color: '#ffea00'
    }).setOrigin(0.5).setShadow(0, 0, '#ffea00', 10, true, true).setStroke('#000000', 6);

    this.p2ScoreText = this.add.text(x + 70, y - 10, '0', {
      font: '64px "Burbank", monospace',
      color: '#ff3366'
    }).setOrigin(0.5).setShadow(0, 0, '#ff3366', 10, true, true).setStroke('#000000', 6);

    // Names
    const p1 = this.matchPlayers.find(p => p.id === 'p1');
    const p2 = this.matchPlayers.find(p => p.id === 'p2');
    
    const p1Name = (p1?.username || p1?.sprite?.replace('char_', '') || 'MESSI').toUpperCase();
    const p2Name = (p2?.username || p2?.sprite?.replace('char_', '') || 'MBAPPE').toUpperCase();

    this.add.text(x - 140, y, p1Name, {
      font: '24px "Burbank", monospace',
      color: '#aaddff',
      align: 'center',
      wordWrap: { width: 100 }
    }).setOrigin(0.5).setStroke('#000000', 4);

    this.add.text(x + 140, y, p2Name, {
      font: '24px "Burbank", monospace',
      color: '#aaddff',
      align: 'center',
      wordWrap: { width: 100 }
    }).setOrigin(0.5).setStroke('#000000', 4);

    // Timer
    this.add.text(x, y + 30, 'MATCH TIME', {
      font: '16px "Burbank", monospace',
      color: '#ffffff'
    }).setOrigin(0.5).setStroke('#000000', 3);

    this.timerText = this.add.text(x, y + 50, '02:00', {
      font: '32px "Burbank", monospace',
      color: '#ffea00'
    }).setOrigin(0.5).setShadow(0, 0, '#ffea00', 5, true, true).setStroke('#000000', 4);
    
    // LIVE badge
    const badge = this.add.graphics();
    badge.fillStyle(0xff0044, 1);
    badge.fillRoundedRect(x + 50, y + 42, 36, 16, 4);
    this.add.text(x + 68, y + 50, 'LIVE', {
      font: '14px "Burbank", monospace', color: '#ffffff'
    }).setOrigin(0.5);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
