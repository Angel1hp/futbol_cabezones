import Phaser from 'phaser';

export interface PlayerConfig {
  type: 'HUMAN' | 'CPU';
  keys: {
    up: number;
    left: number;
    right: number;
    kick: number;
  };
}

export interface MatchConfig {
  mode: '1v1' | '2v2';
  slots: PlayerConfig[];
  matchDuration: number;
  goalLimit: number;
}

export class LocalSetupScene extends Phaser.Scene {
  private config!: MatchConfig;
  private slotContainers: Phaser.GameObjects.Container[] = [];
  
  // Para el remapeo
  private isRemapping: boolean = false;
  private remapOverlay!: Phaser.GameObjects.Container;
  private remapText!: Phaser.GameObjects.Text;
  private currentRemapSlot: number = -1;
  private currentRemapAction: number = 0; // 0=up, 1=left, 2=right, 3=kick
  
  constructor() {
    super({ key: 'LocalSetupScene' });
  }

  init() {
    this.slotContainers = []; // <--- LIMPIEZA AÑADIDA AQUÍ
    this.config = {
      mode: '1v1',
      slots: [
        { type: 'HUMAN', keys: { up: Phaser.Input.Keyboard.KeyCodes.W, left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D, kick: Phaser.Input.Keyboard.KeyCodes.SPACE } },
        { type: 'CPU', keys: { up: Phaser.Input.Keyboard.KeyCodes.UP, left: Phaser.Input.Keyboard.KeyCodes.LEFT, right: Phaser.Input.Keyboard.KeyCodes.RIGHT, kick: Phaser.Input.Keyboard.KeyCodes.ENTER } },
        { type: 'CPU', keys: { up: Phaser.Input.Keyboard.KeyCodes.I, left: Phaser.Input.Keyboard.KeyCodes.J, right: Phaser.Input.Keyboard.KeyCodes.L, kick: Phaser.Input.Keyboard.KeyCodes.U } },
        { type: 'CPU', keys: { up: Phaser.Input.Keyboard.KeyCodes.NUMPAD_EIGHT, left: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR, right: Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX, kick: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO } }
      ],
      matchDuration: 90,
      goalLimit: 5
    };
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Video Background
    const bgVideo = this.add.video(width / 2, height / 2, 'menu_char_video');
    bgVideo.play(true);
    bgVideo.on('play', () => {
      const videoW = bgVideo.video?.videoWidth || 1080;
      const videoH = bgVideo.video?.videoHeight || 720;
      const scaleX = width / videoW;
      const scaleY = height / videoH;
      bgVideo.setScale(Math.max(scaleX, scaleY));
    });

    
    this.add.text(width / 2, 40, 'CONFIGURACIÓN LOCAL', { font: '48px "Burbank", cursive', color: '#ffcc00' })
      .setOrigin(0.5).setStroke('#000000', 8).setShadow(4, 4, '#000000', 0, true, false);

    // Toggle 1v1 / 2v2
    const modeBtn = this.add.graphics();
    modeBtn.fillStyle(0x0055ff, 1).fillRoundedRect(width / 2 - 120, 75, 240, 50, 16);
    modeBtn.lineStyle(4, 0x000000, 1).strokeRoundedRect(width / 2 - 120, 75, 240, 50, 16);
    const modeText = this.add.text(width / 2, 100, 'MODO: 1 VS 1', { font: '28px "Burbank", cursive', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#000000', 6);
    
    const modeHit = this.add.zone(width / 2, 100, 240, 50).setInteractive({ useHandCursor: true });
    modeHit.on('pointerdown', () => {
      this.config.mode = this.config.mode === '1v1' ? '2v2' : '1v1';
      modeText.setText(`MODO: ${this.config.mode.toUpperCase()}`);
      this.renderSlots();
    });

    // Time button
    const timeBtn = this.add.graphics();
    timeBtn.fillStyle(0x8833ff, 1).fillRoundedRect(width / 2 - 240, 145, 220, 50, 16);
    timeBtn.lineStyle(4, 0x000000, 1).strokeRoundedRect(width / 2 - 240, 145, 220, 50, 16);
    const timeText = this.add.text(width / 2 - 130, 170, 'TIEMPO: 1:30', { font: '24px "Burbank", cursive', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#000000', 5);
    const timeHit = this.add.zone(width / 2 - 130, 170, 220, 50).setInteractive({ useHandCursor: true });
    
    const times = [60, 90, 120, 180, 0];
    const timeLabels = ['1:00', '1:30', '2:00', '3:00', 'INFINITO'];
    let timeIdx = 1;
    timeHit.on('pointerdown', () => {
      timeIdx = (timeIdx + 1) % times.length;
      this.config.matchDuration = times[timeIdx];
      timeText.setText(`TIEMPO: ${timeLabels[timeIdx]}`);
    });

    // Goals button
    const goalsBtn = this.add.graphics();
    goalsBtn.fillStyle(0xff3366, 1).fillRoundedRect(width / 2 + 20, 145, 220, 50, 16);
    goalsBtn.lineStyle(4, 0x000000, 1).strokeRoundedRect(width / 2 + 20, 145, 220, 50, 16);
    const goalsText = this.add.text(width / 2 + 130, 170, 'GOLES: 5', { font: '24px "Burbank", cursive', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#000000', 5);
    const goalsHit = this.add.zone(width / 2 + 130, 170, 220, 50).setInteractive({ useHandCursor: true });

    const goals = [3, 5, 10, 0];
    const goalsLabels = ['3', '5', '10', 'SIN LÍMITE'];
    let goalsIdx = 1;
    goalsHit.on('pointerdown', () => {
      goalsIdx = (goalsIdx + 1) % goals.length;
      this.config.goalLimit = goals[goalsIdx];
      goalsText.setText(`GOLES: ${goalsLabels[goalsIdx]}`);
    });

    // Slots
    const startX = 200;
    const spacingX = 208;

    for (let i = 0; i < 4; i++) {
      const container = this.add.container(startX + (i * spacingX), 340);
      this.slotContainers.push(container);
      
      const bg = this.add.graphics();
      bg.fillStyle(0x222233, 0.9).fillRoundedRect(-100, -120, 200, 250, 20);
      bg.lineStyle(4, i % 2 === 0 ? 0x00ccff : 0xff3399, 1).strokeRoundedRect(-100, -120, 200, 250, 20);
      
      const title = this.add.text(0, -90, `JUGADOR ${i + 1}`, { font: '28px "Burbank", cursive', color: i % 2 === 0 ? '#00ccff' : '#ff3399' })
        .setOrigin(0.5).setStroke('#000000', 6);
      
      // Type Toggle (HUMAN/CPU)
      const typeBtn = this.add.graphics();
      const typeText = this.add.text(0, -40, '', { font: '24px "Burbank", cursive', color: '#ffffff' })
        .setOrigin(0.5).setStroke('#000000', 5);
      const typeHit = this.add.zone(0, -40, 140, 40).setInteractive({ useHandCursor: true });
      
      typeHit.on('pointerdown', () => {
        if (i === 0) return; // P1 siempre humano para asegurar alguien juegue
        this.config.slots[i].type = this.config.slots[i].type === 'HUMAN' ? 'CPU' : 'HUMAN';
        this.renderSlots();
      });

      // Controls info
      const controlsText = this.add.text(0, 30, '', { font: '18px "Burbank", cursive', color: '#dddddd', align: 'center' })
        .setOrigin(0.5).setStroke('#000000', 4);
      
      // Remap Btn
      const remapBtnBg = this.add.graphics();
      const remapTextBtn = this.add.text(0, 95, 'EDITAR TECLAS', { font: '20px "Burbank", cursive', color: '#ffffff' })
        .setOrigin(0.5).setStroke('#000000', 5);
      const remapHit = this.add.zone(0, 90, 140, 30).setInteractive({ useHandCursor: true });
      
      remapHit.on('pointerdown', () => {
        if (this.config.slots[i].type === 'HUMAN') {
          this.startRemap(i);
        }
      });

      container.add([bg, title, typeBtn, typeText, typeHit, controlsText, remapBtnBg, remapTextBtn, remapHit]);
    }

    this.renderSlots();

    // Remap Overlay
    this.remapOverlay = this.add.container(width / 2, height / 2).setDepth(100).setVisible(false);
    const overlayBg = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setInteractive(); // Bloquea clicks
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x333344, 1).fillRoundedRect(-250, -100, 500, 200, 16);
    panelBg.lineStyle(3, 0x00ff88, 1).strokeRoundedRect(-250, -100, 500, 200, 16);
    
    this.remapText = this.add.text(0, 0, 'PRESIONA LA TECLA PARA: ARRIBA', { font: '32px "Burbank", cursive', color: '#00ff88', align: 'center' })
      .setOrigin(0.5).setStroke('#000000', 6);
    this.remapOverlay.add([overlayBg, panelBg, this.remapText]);

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', this.handleKeyDown, this);
    }

    // Botones inferiores
    this.add.text(40, height - 50, '< VOLVER', { font: '36px "Burbank", cursive', color: '#ff0055' })
      .setStroke('#000000', 6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));

    const startBtn = this.add.text(width - 40, height - 50, 'CONTINUAR >', { font: '36px "Burbank", cursive', color: '#00ff88' })
      .setOrigin(1, 0)
      .setStroke('#000000', 6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('CharacterSelectScene', { mode: 'local', matchConfig: this.config });
      });
      
    // Pulse animation
    this.tweens.add({
      targets: startBtn,
      alpha: 0.5,
      yoyo: true,
      repeat: -1,
      duration: 600
    });
  }

  private renderSlots() {
    const is2v2 = this.config.mode === '2v2';

    this.slotContainers.forEach((container, i) => {
      if (i > 1 && !is2v2) {
        container.setAlpha(0.2);
        container.list.forEach(c => { if (c instanceof Phaser.GameObjects.Zone) c.disableInteractive(); });
      } else {
        container.setAlpha(1);
        container.list.forEach(c => { if (c instanceof Phaser.GameObjects.Zone) c.setInteractive(); });
      }

      const typeBtn = container.list[2] as Phaser.GameObjects.Graphics;
      const typeText = container.list[3] as Phaser.GameObjects.Text;
      const controlsText = container.list[5] as Phaser.GameObjects.Text;
      const remapBtnBg = container.list[6] as Phaser.GameObjects.Graphics;
      const remapTextBtn = container.list[7] as Phaser.GameObjects.Text;
      const remapHit = container.list[8] as Phaser.GameObjects.Zone;

      const slotConfig = this.config.slots[i];
      
      typeBtn.clear();
      typeBtn.fillStyle(slotConfig.type === 'HUMAN' ? 0x00cc44 : 0xaa4400, 1).fillRoundedRect(-80, -60, 160, 45, 16);
      typeBtn.lineStyle(4, 0x000000, 1).strokeRoundedRect(-80, -60, 160, 45, 16);
      typeText.setText(slotConfig.type === 'HUMAN' ? 'HUMANO' : 'CPU');
      
      if (i === 0) typeText.setText('HUMANO (FIJO)');

      remapBtnBg.clear();
      if (slotConfig.type === 'HUMAN') {
        remapBtnBg.fillStyle(0xff8800, 1).fillRoundedRect(-70, 75, 140, 40, 12);
        remapBtnBg.lineStyle(3, 0x000000, 1).strokeRoundedRect(-70, 75, 140, 40, 12);
        remapTextBtn.setAlpha(1);
        remapHit.setInteractive();
        
        const keyNames = this.getKeyNames(slotConfig.keys);
          controlsText.setText(`Arriba: ${keyNames.up}\nIzquierda: ${keyNames.left}\nDerecha: ${keyNames.right}\nPatear: ${keyNames.kick}`);
      } else {
        remapBtnBg.fillStyle(0x222233, 1).fillRoundedRect(-70, 75, 140, 40, 12);
        remapBtnBg.lineStyle(3, 0x000000, 1).strokeRoundedRect(-70, 75, 140, 40, 12);
        remapTextBtn.setAlpha(0.3);
        remapHit.disableInteractive();
        controlsText.setText('Controlado por\nInteligencia\nArtificial');
      }
    });
  }
  
  private getKeyName(keyCode: number): string {
    for (let key in Phaser.Input.Keyboard.KeyCodes) {
      if ((Phaser.Input.Keyboard.KeyCodes as any)[key] === keyCode) {
        return key;
      }
    }
    return String.fromCharCode(keyCode);
  }

  private getKeyNames(keys: any) {
    return {
      up: this.getKeyName(keys.up),
      left: this.getKeyName(keys.left),
      right: this.getKeyName(keys.right),
      kick: this.getKeyName(keys.kick)
    };
  }

  private startRemap(slotIndex: number) {
    this.isRemapping = true;
    this.currentRemapSlot = slotIndex;
    this.currentRemapAction = 0;
    this.updateRemapText();
    this.remapOverlay.setVisible(true);
  }

  private updateRemapText() {
    const actions = ['ARRIBA (SALTAR)', 'IZQUIERDA', 'DERECHA', 'PATEAR'];
    this.remapText.setText(`JUGADOR ${this.currentRemapSlot + 1}\n\nPRESIONA LA TECLA PARA:\n\n[ ${actions[this.currentRemapAction]} ]`);
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.isRemapping) return;
    
    event.preventDefault();
    const keyCode = event.keyCode;
    const keys = this.config.slots[this.currentRemapSlot].keys;

    if (this.currentRemapAction === 0) keys.up = keyCode;
    else if (this.currentRemapAction === 1) keys.left = keyCode;
    else if (this.currentRemapAction === 2) keys.right = keyCode;
    else if (this.currentRemapAction === 3) keys.kick = keyCode;

    this.currentRemapAction++;
    if (this.currentRemapAction > 3) {
      this.isRemapping = false;
      this.remapOverlay.setVisible(false);
      this.renderSlots();
    } else {
      this.updateRemapText();
    }
  }

  // Se llama automáticamente cuando la escena cambia
  shutdown() {
    if (this.input.keyboard) {
      this.input.keyboard.off('keydown', this.handleKeyDown, this);
    }
  }
}
