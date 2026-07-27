import Phaser from 'phaser';

export class CharacterSelectScene extends Phaser.Scene {
  private hoveredNameText!: Phaser.GameObjects.Text;
  private bigSprite!: Phaser.GameObjects.Sprite;
  private statBars: { [key: string]: Phaser.GameObjects.Graphics } = {};
  private matchConfig: Record<string, unknown> | null = null;
  private currentSelectionIndex = 0;
  private selectedSprites: string[] = [];
  private mode: string = 'online';
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data: { mode?: string, matchConfig?: Record<string, unknown> | null }) {
    this.mode = data.mode || 'online';
    this.matchConfig = data.matchConfig || null;
    this.currentSelectionIndex = 0;
    this.selectedSprites = [];
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo animado de video
    const bgVideo = this.add.video(width / 2, height / 2, 'menu_char_video');
    bgVideo.play(true);
    
    bgVideo.on('play', () => {
      // Usar la resolución nativa del video para calcular la escala correcta
      const videoW = bgVideo.video?.videoWidth || 1280;
      const videoH = bgVideo.video?.videoHeight || 720;
      const scaleX = width / videoW;
      const scaleY = height / videoH;
      bgVideo.setScale(Math.max(scaleX, scaleY));
    });

    let initialTitle = 'CHOOSE YOUR FIGHTER';
    if (this.mode === 'local' && this.matchConfig) {
      initialTitle = `JUGADOR 1: ELIGE`;
    }
    
    this.titleText = this.add.text(40, 40, initialTitle, {
      font: '64px "Burbank", monospace',
      color: '#ffffff'
    }).setShadow(4, 4, '#ff0055', 0, true, true).setStroke('#000000', 8);

    const characters = [
      { id: 'messi', name: 'Messi', sprite: 'char_messi', color: 0x00aaff, stats: { speed: 9.5, jump: 7.5, power: 9.0 } },
      { id: 'cristianor', name: 'CR7', sprite: 'char_cristianoR', color: 0xff0000, stats: { speed: 9.0, jump: 9.8, power: 9.5 } },
      { id: 'neymar', name: 'Neymar', sprite: 'char_neymar', color: 0xffff00, stats: { speed: 9.5, jump: 8.0, power: 8.5 } },
      { id: 'mbappe', name: 'Mbappé', sprite: 'char_mbappe', color: 0x0055ff, stats: { speed: 10, jump: 8.5, power: 9.0 } },
      { id: 'haaland', name: 'Haaland', sprite: 'char_haaland', color: 0x00ffaa, stats: { speed: 8.5, jump: 9.5, power: 10.0 } },
      { id: 'modric', name: 'Modric', sprite: 'char_modric', color: 0xffffff, stats: { speed: 8.0, jump: 8.0, power: 9.5 } },
      { id: 'messi_2009', name: 'Messi 2009', sprite: 'char_messi_2009', color: 0x99aaff, stats: { speed: 10.0, jump: 8.5, power: 8.5 } },
      { id: 'messi_2010', name: 'Messi 2010', sprite: 'char_messi_2010', color: 0x55aaff, stats: { speed: 9.8, jump: 8.0, power: 9.5 } },
      { id: 'cristianor_2008', name: 'CR7 2008', sprite: 'char_cristianoR_2008', color: 0xcc0000, stats: { speed: 9.5, jump: 10.0, power: 9.8 } },
      { id: 'neymar_2011', name: 'Neymar 2011', sprite: 'char_neymar_2011', color: 0xffff00, stats: { speed: 9.8, jump: 8.5, power: 8.5 } },
      { id: 'ronaldinho', name: 'Ronaldinho', sprite: 'char_ronaldinho', color: 0xffaa00, stats: { speed: 9.0, jump: 8.5, power: 10.0 } },
      { id: 'paolo', name: 'Paolo Guerrero', sprite: 'char_paolo_gerrero', color: 0xffffff, stats: { speed: 8.5, jump: 9.5, power: 9.5 } },
      { id: 'pele', name: 'Pelé', sprite: 'char_pele', color: 0xffff00, stats: { speed: 9.5, jump: 9.0, power: 9.5 } },
      { id: 'maradona', name: 'Maradona', sprite: 'char_maradona', color: 0x00aaff, stats: { speed: 9.8, jump: 8.0, power: 10.0 } },
      { id: 'vinicius', name: 'Vinicius Jr', sprite: 'char_vinicius', color: 0xffffff, stats: { speed: 10.0, jump: 8.5, power: 8.5 } },
      { id: 'vidal', name: 'Vidal', sprite: 'char_vidal', color: 0xff0000, stats: { speed: 8.0, jump: 9.0, power: 10.0 } },
      { id: 'ronaldo', name: 'Ronaldo R9', sprite: 'char_ronaldo', color: 0xffff00, stats: { speed: 9.8, jump: 9.5, power: 10.0 } },
      { id: 'alexis', name: 'Alexis Sánchez', sprite: 'char_alexis', color: 0xff0000, stats: { speed: 9.5, jump: 8.5, power: 9.0 } },
      { id: 'lamine_yamal', name: 'Lamine Yamal', sprite: 'char_lamine_yamal', color: 0xaa0000, stats: { speed: 9.8, jump: 8.0, power: 8.5 } },
      { id: 'benzema', name: 'Karim Benzema', sprite: 'char_benzema', color: 0xffffff, stats: { speed: 8.5, jump: 8.5, power: 9.8 } }
    ];

    // --- PANEL DERECHO (Detalles) ---
    const panelX = width - 250;
    const panelY = height / 2;
    
    // Fondo del panel
    this.add.rectangle(panelX, panelY, 500, height, 0x000000, 0.5);

    this.bigSprite = this.add.sprite(panelX, panelY - 70, characters[0].sprite).setDisplaySize(300, 300);
    
    this.hoveredNameText = this.add.text(panelX, panelY + 120, characters[0].name.toUpperCase(), {
      font: '56px "Burbank", monospace',
      color: '#ffffff'
    }).setOrigin(0.5).setShadow(4, 4, '#000000', 0, true, true).setStroke('#000000', 6);

    // Creador de barras de estadísticas
    const renderBar = (yOffset: number, label: string) => {
      this.add.text(panelX - 140, panelY + 175 + yOffset, label, { font: '24px "Burbank", monospace', color: '#dddddd' }).setStroke('#000000', 4);
      const barBg = this.add.graphics();
      barBg.fillStyle(0x333333, 1);
      barBg.fillRoundedRect(panelX - 40, panelY + 182 + yOffset, 200, 14, 7);
      
      const barFill = this.add.graphics();
      this.statBars[label] = barFill;
    };

    renderBar(0, 'SPEED');
    renderBar(30, 'JUMP');
    renderBar(60, 'POWER');

    const updatePanel = (char: { id: string; name: string; sprite: string; color: number; stats: Record<string, number> }) => {
      this.bigSprite.setTexture(char.sprite);
      this.hoveredNameText.setText(char.name.toUpperCase());
      
      const colorStr = Phaser.Display.Color.IntegerToColor(char.color).rgba;
      this.hoveredNameText.setColor(colorStr);
      
      // Actualizar el llenado de las barras
      const updateBar = (label: string, val: number, color: number) => {
        const bar = this.statBars[label];
        bar.clear();
        bar.fillStyle(color, 1);
        bar.fillRoundedRect(panelX - 40, panelY + 182 + (label==='SPEED'?0:label==='JUMP'?30:60), (val / 10) * 200, 14, 7);
      };
      
      updateBar('SPEED', char.stats.speed, char.color);
      updateBar('JUMP', char.stats.jump, char.color);
      updateBar('POWER', char.stats.power, char.color);
    };

    // Iniciar con el primer personaje
    updatePanel(characters[0]);

    // --- GRILLA DE PERSONAJES Y SCROLL ---
    const gridContainer = this.add.container(0, 0);
    
    const maskY = 110;
    const maskHeight = height - 160;
    
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(0, maskY, width - 250, maskHeight);
    maskGraphics.setVisible(false);
    const mask = maskGraphics.createGeometryMask();
    gridContainer.setMask(mask);

    const startX = 80;
    const startY = 170;
    const cols = 4;
    const spacingX = 130;
    const spacingY = 125;

    characters.forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      const card = this.add.graphics();
      card.fillStyle(0x222233, 0.8);
      card.fillRoundedRect(x - 60, y - 60, 120, 120, 12);
      
      const outline = this.add.graphics();
      
      const sprite = this.add.sprite(x, y, char.sprite).setDisplaySize(90, 90);

      const hitArea = this.add.zone(x, y, 120, 120).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      gridContainer.add([card, outline, sprite, hitArea]);

      hitArea.on('pointerdown', () => {
        // Efecto visual al seleccionar
        this.cameras.main.flash(200, 255, 255, 255);
        this.time.delayedCall(300, () => {
          if (this.mode === 'online') {
            this.scene.start('StadiumSelectScene', { mode: this.mode, characterId: char.id, spriteKey: char.sprite });
          } else if (this.mode === 'local' && this.matchConfig) {
            this.selectedSprites.push(char.sprite);
            const requiredSelections = this.matchConfig.mode === '2v2' ? 4 : 2;
            this.currentSelectionIndex++;
            
            if (this.currentSelectionIndex < requiredSelections) {
              this.titleText.setText(`JUGADOR ${this.currentSelectionIndex + 1}: ELIGE`);
            } else {
              this.scene.start('StadiumSelectScene', { 
                mode: 'local', 
                matchConfig: this.matchConfig, 
                selectedSprites: this.selectedSprites 
              });
            }
          }
        });
      });
      
      hitArea.on('pointerover', () => {
        this.sound.play('hover', { volume: 0.5 });
        outline.clear();
        outline.lineStyle(5, char.color, 1);
        outline.strokeRoundedRect(x - 65, y - 65, 130, 130, 16);
        sprite.setDisplaySize(105, 105); // Zoom visual
        updatePanel(char);
      });

      hitArea.on('pointerout', () => {
        outline.clear();
        sprite.setDisplaySize(90, 90);  // Restaurar tamaño
      });
    });

    // --- LÓGICA DEL SCROLL BAR ---
    const totalRows = Math.ceil(characters.length / cols);
    const totalGridHeight = totalRows * spacingY + 40;
    
    if (totalGridHeight > maskHeight) {
      const scrollBarX = startX + cols * spacingX - 30;
      
      const track = this.add.graphics();
      track.fillStyle(0x111122, 0.8);
      track.fillRoundedRect(scrollBarX, maskY, 12, maskHeight, 6);
      
      const thumbHeight = Math.max(40, (maskHeight / totalGridHeight) * maskHeight);
      const maxScrollY = maskHeight - totalGridHeight;
      const maxThumbY = maskHeight - thumbHeight;
      
      const thumb = this.add.graphics();
      
      const drawThumb = (yPos: number) => {
        thumb.clear();
        thumb.fillStyle(0xff0055, 1);
        thumb.fillRoundedRect(scrollBarX, yPos, 12, thumbHeight, 6);
      };
      
      let currentThumbY = maskY;
      drawThumb(currentThumbY);
      
      const thumbZone = this.add.zone(scrollBarX + 6, currentThumbY + thumbHeight / 2, 40, thumbHeight)
        .setOrigin(0.5)
        .setInteractive({ draggable: true, useHandCursor: true });

      const updateScroll = (newThumbY: number) => {
        newThumbY = Phaser.Math.Clamp(newThumbY, maskY, maskY + maxThumbY);
        currentThumbY = newThumbY;
        
        drawThumb(currentThumbY);
        thumbZone.y = currentThumbY + thumbHeight / 2;
        
        const scrollPercent = (currentThumbY - maskY) / maxThumbY;
        gridContainer.y = maxScrollY * scrollPercent;
      };

      this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
        if (gameObject === thumbZone) {
          updateScroll(pointer.y - thumbHeight / 2);
        }
      });

      this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number, deltaZ: number) => {
        if (pointer.x < width - 250) {
          updateScroll(currentThumbY + deltaY * 0.5);
        }
      });
    }

    // Botón de Volver
    this.add.text(40, height - 50, '< VOLVER', { font: '36px "Burbank", monospace', color: '#ff0055' })
      .setStroke('#000000', 6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}
