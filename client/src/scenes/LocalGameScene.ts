import Phaser from 'phaser';
import { PhysicsEngine, GAME_CONFIG } from '@futbol-cabezones/shared';

export class LocalGameScene extends Phaser.Scene {
  private engine!: PhysicsEngine;
  
  // Phaser visual sprites
  private playerSprites: Phaser.GameObjects.Sprite[] = [];
  private ballSprite!: Phaser.GameObjects.Sprite;

  private matchConfig: any;
  private selectedSprites: string[] = [];
  private playerKeys: any[] = [];

  private stadiumKey: string = 'bg_stadium';
  private ballKey: string = 'ball';
  
  private scoreP1: number = 0;
  private scoreP2: number = 0;
  private p1ScoreText!: Phaser.GameObjects.Text;
  private p2ScoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timeRemaining!: number;
  private isGoalSequence: boolean = false;
  private isMatchOver: boolean = false;
  private bgMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'LocalGameScene' });
  }

  init(data: any) {
    this.playerSprites = [];
    this.playerKeys = [];
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.isGoalSequence = false;
    this.isMatchOver = false;

    this.matchConfig = data.matchConfig || {
      mode: '1v1',
      slots: [
        { type: 'HUMAN', keys: { up: Phaser.Input.Keyboard.KeyCodes.W, left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D, kick: Phaser.Input.Keyboard.KeyCodes.SPACE } },
        { type: 'CPU', keys: {} }
      ],
      matchDuration: 90,
      goalLimit: 5
    };
    this.timeRemaining = this.matchConfig.matchDuration;
    this.selectedSprites = data.selectedSprites || ['char_messi', 'char_mbappe'];
    if (data.stadiumKey) this.stadiumKey = data.stadiumKey;
    if (data.ballKey) this.ballKey = data.ballKey;
  }

  create() {
    // Create the backend-agnostic physics engine locally!
    const playerCount = this.matchConfig.mode === '2v2' ? 4 : 2;
    this.engine = new PhysicsEngine(playerCount);

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
    this.add.rectangle(width / 2, GAME_CONFIG.FIELD_HEIGHT + 10, width, 20, 0x00ff88, 0);

    // Goal visual markers (bajados un poco para que no floten)
    const goalVisualOffsetY = 30;
    this.add.sprite(GAME_CONFIG.GOAL_WIDTH / 2, GAME_CONFIG.FIELD_HEIGHT - GAME_CONFIG.GOAL_HEIGHT / 2 + goalVisualOffsetY, 'goal')
      .setDisplaySize(GAME_CONFIG.GOAL_WIDTH, GAME_CONFIG.GOAL_HEIGHT)
      .setFlipX(false); // Facing right

    this.add.sprite(GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.GOAL_WIDTH / 2, GAME_CONFIG.FIELD_HEIGHT - GAME_CONFIG.GOAL_HEIGHT / 2 + goalVisualOffsetY, 'goal')
      .setDisplaySize(GAME_CONFIG.GOAL_WIDTH, GAME_CONFIG.GOAL_HEIGHT)
      .setFlipX(true); // Facing left

    // Create Sprites based on engine initial state
    this.engine.players.forEach((p, i) => {
      const spriteKey = this.selectedSprites[i] || 'char_messi';
      const sprite = this.add.sprite(p.x, p.y, spriteKey).setDisplaySize(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT);
      this.playerSprites.push(sprite);
      
      // Bind keys for human
      if (this.matchConfig.slots[i].type === 'HUMAN' && this.input.keyboard) {
        const k = this.matchConfig.slots[i].keys;
        this.playerKeys[i] = {
          up: this.input.keyboard.addKey(k.up),
          left: this.input.keyboard.addKey(k.left),
          right: this.input.keyboard.addKey(k.right),
          kick: this.input.keyboard.addKey(k.kick)
        };
      } else {
        this.playerKeys[i] = null;
      }
    });

    this.ballSprite = this.add.sprite(this.engine.ball.x, this.engine.ball.y, this.ballKey).setDisplaySize(GAME_CONFIG.BALL_RADIUS * 2, GAME_CONFIG.BALL_RADIUS * 2);

    // Ball Particles (Estela)
    const particles = this.add.particles(0, 0, 'particle', {
      speed: 20,
      scale: { start: 1, end: 0 },
      alpha: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 300
    });
    particles.startFollow(this.ballSprite);

    const modeText = this.matchConfig.mode === '2v2' ? 'MODO LOCAL: 2 VS 2' : 'MODO LOCAL: 1 VS 1';
    this.add.text(10, 10, modeText, {
      font: '16px monospace', color: '#ffffff'
    });

    this.createScoreboard(width);
    
    // Back button to MainMenu
    const backBtn = this.add.text(10, 50, '< Volver', { font: '16px monospace', color: '#00ff88' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));

    // Audio de ambiente
    this.bgMusic = this.sound.add('ambiental', { loop: true, volume: 0.3 });
    this.bgMusic.play();
    
    // Detener la música del menú si estaba sonando
    const menuMusic = this.sound.get('music');
    if (menuMusic && menuMusic.isPlaying) {
      menuMusic.stop();
    }

    this.events.once('shutdown', () => {
      this.bgMusic.stop();
    });
  }

  update(time: number, delta: number) {
    const dt = delta / 1000;

    if (this.isGoalSequence) {
      // Si hubo gol, solo actualizamos las físicas sin input para que la pelota termine de caer
      this.engine.update(dt, {});
    } else {
      const inputs: any = {};
      
      this.engine.players.forEach((p, i) => {
        const slotConfig = this.matchConfig.slots[i];
        if (slotConfig.type === 'HUMAN') {
          const pk = this.playerKeys[i];
          inputs[p.id] = {
            sequence: 0,
            left: pk.left.isDown,
            right: pk.right.isDown,
            jump: Phaser.Input.Keyboard.JustDown(pk.up),
            kick: Phaser.Input.Keyboard.JustDown(pk.kick)
          };
        } else {
          // IA CPU logic
          const teamDir = (p.id === 'p1' || p.id === 'p3') ? 1 : -1; 
          const ballX = this.engine.ball.x;
          const pX = p.x;
          const distToBall = Math.abs(ballX - pX);
          
          inputs[p.id] = { sequence: 0, left: false, right: false, jump: false, kick: false };
          
          // Histéresis para evitar que el CPU tiemble (jitter) cuando está justo en el centro de la pelota
          let isBehind = false;
          if (teamDir === 1) {
             if (pX < ballX - 10) isBehind = true;
             else if (pX > ballX + 10) isBehind = false;
             else isBehind = p.facingDir === 1; // Mantener la inercia
          } else {
             if (pX > ballX + 10) isBehind = true;
             else if (pX < ballX - 10) isBehind = false;
             else isBehind = p.facingDir === -1; // Mantener la inercia
          }

          if (isBehind) {
            // Está en la posición correcta para empujar hacia el arco rival
            if (teamDir === 1) inputs[p.id].right = true;
            else inputs[p.id].left = true;
            
            // Saltar para cabecear si la pelota está alta
            if (distToBall < 100 && this.engine.ball.y < p.y - 20 && Math.random() < 0.2) {
              inputs[p.id].jump = true;
            }
            // Patear agresivamente
            if (distToBall < 110 && Math.random() < 0.4) {
              inputs[p.id].kick = true;
            }
          } else {
            // Está en el lado equivocado (entre la pelota y el arco rival)
            // Necesita moverse hacia la pelota para rebasarla
            if (pX < ballX) inputs[p.id].right = true;
            else inputs[p.id].left = true;
            
            // Saltar para cruzar por encima de la pelota y no meterse autogol
            if (distToBall < 100) {
              inputs[p.id].jump = true;
            }
          }
        }
      });

      // 1. Ejecutar Lógica Pura (Simulando lo que haría el servidor)
      const scorer = this.engine.update(dt, inputs);

      if (scorer) {
        this.isGoalSequence = true;
        
        // Detener el grito anterior si todavía está sonando para no duplicar
        this.sound.stopByKey('gool');
        this.sound.play('gool');

        if (scorer === 'p1') {
          this.scoreP1++;
          this.p1ScoreText.setText(this.scoreP1.toString());
        }
        if (scorer === 'p2') {
          this.scoreP2++;
          this.p2ScoreText.setText(this.scoreP2.toString());
        }

        const goalText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '¡GOL!', {
          font: '900 80px Inter, sans-serif', color: '#ffcc00'
        }).setOrigin(0.5).setShadow(4, 4, '#000000', 0, true, true);

        this.cameras.main.flash(500, 255, 255, 255);
        this.cameras.main.shake(500, 0.02);

        this.time.delayedCall(2000, () => {
          if (this.matchConfig.goalLimit > 0 && (this.scoreP1 >= this.matchConfig.goalLimit || this.scoreP2 >= this.matchConfig.goalLimit)) {
             this.endMatch();
          } else {
             this.engine.resetPositions();
             goalText.destroy();
             this.isGoalSequence = false;
          }
        });
      }
    }

    // 2. Renderizar Vistas (Client-side)
    this.engine.players.forEach((p, i) => {
      const sprite = this.playerSprites[i];
      sprite.setPosition(p.x, p.y);
      sprite.rotation = p.isKicking ? ((p.id === 'p1' || p.id === 'p3') ? 0.3 : -0.3) : 0;
      
      if (p.vx < 0) sprite.setFlipX(true);
      else if (p.vx > 0) sprite.setFlipX(false);
    });
    
    this.ballSprite.setPosition(this.engine.ball.x, this.engine.ball.y);
    
    // Rotación visual de la pelota
    if (Math.abs(this.engine.ball.vx) > 10) {
      this.ballSprite.rotation += (this.engine.ball.vx * dt) / 30;
    }
    
    // Update timer
    if (!this.isGoalSequence && !this.isMatchOver) {
      if (this.matchConfig.matchDuration > 0) {
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
          this.timeRemaining = 0;
          this.endMatch();
        }
        this.timerText.setText(this.formatTime(this.timeRemaining));
      } else {
        this.timerText.setText('∞');
      }
    }
  }

  private endMatch() {
    this.isMatchOver = true;
    this.isGoalSequence = true; // Para congelar inputs
    
    // Dim background
    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8).setDepth(99);
    
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, '¡FIN DEL PARTIDO!', { font: '900 64px Inter', color: '#fff' })
      .setOrigin(0.5).setDepth(100);
    
    let winnerText = 'EMPATE';
    if (this.scoreP1 > this.scoreP2) winnerText = 'GANA EL EQUIPO 1';
    else if (this.scoreP2 > this.scoreP1) winnerText = 'GANA EL EQUIPO 2';

    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, winnerText, { font: '700 48px Inter', color: '#00ff88' })
      .setOrigin(0.5).setDepth(100);

    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150, '> VOLVER AL MENÚ <', { font: '700 24px Inter', color: '#ff0055' })
      .setOrigin(0.5).setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));
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
    const p1Name = (this.selectedSprites[0] || 'char_messi').replace('char_', '').toUpperCase();
    const p2Name = (this.selectedSprites[1] || 'char_mbappe').replace('char_', '').toUpperCase();

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

    this.timerText = this.add.text(x, y + 50, this.formatTime(this.timeRemaining), {
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
