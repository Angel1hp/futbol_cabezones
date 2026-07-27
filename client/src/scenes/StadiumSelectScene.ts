import Phaser from 'phaser';

export class StadiumSelectScene extends Phaser.Scene {
  private prevData: any;
  private bigBg!: Phaser.GameObjects.Image;
  private bigBgVideo!: Phaser.GameObjects.Video;
  private stadiumNameText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'StadiumSelectScene' });
  }

  init(data: any) {
    this.prevData = data;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const stadiums = [
      { id: 'classic', name: 'Estadio Clásico', key: 'bg_stadium', color: '#00ff88' },
      { id: 'fire', name: 'Estadio Infernal', key: 'bg_stadium_fire', color: '#ff4400' },
      { id: 'future', name: 'Estadio Futuro', key: 'bg_stadium_future', color: '#00ffff' },
      { id: 'bombonera', name: 'La Bombonera', key: 'video_bombonera', thumbKey: 'bg_bombonera', color: '#ffea00' }
    ];

    // Background preview
    this.bigBg = this.add.image(width / 2, height / 2, stadiums[0].key).setDisplaySize(width, height).setAlpha(0.4);
    this.bigBgVideo = this.add.video(width / 2, height / 2, 'video_bombonera').setAlpha(0.4).setVisible(false).setMute(true);
    this.bigBgVideo.on('play', () => {
      const videoW = this.bigBgVideo.video?.videoWidth || 1080;
      const videoH = this.bigBgVideo.video?.videoHeight || 720;
      const scaleX = width / videoW;
      const scaleY = height / videoH;
      this.bigBgVideo.setScale(Math.max(scaleX, scaleY));
    });
    
    // Tint overlay to make UI readable
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

    this.add.text(width / 2, 60, 'SELECCIONA EL ESTADIO', {
      font: '64px "Burbank", monospace',
      color: '#ffffff'
    }).setOrigin(0.5).setShadow(4, 4, '#ff0055', 0, true, true).setStroke('#000000', 8);

    this.stadiumNameText = this.add.text(width / 2, height - 150, stadiums[0].name.toUpperCase(), {
      font: '56px "Burbank", monospace',
      color: stadiums[0].color
    }).setOrigin(0.5).setShadow(4, 4, '#000000', 0, true, true).setStroke('#000000', 6);

    // --- CAROUSEL / GRID ---
    const startX = width / 2 - 330;
    const startY = height / 2;
    const spacing = 220;

    stadiums.forEach((stad, index) => {
      const x = startX + index * spacing;
      const y = startY;

      const card = this.add.graphics();
      card.fillStyle(0x111111, 0.9);
      card.fillRoundedRect(x - 100, y - 75, 200, 150, 12);
      
      const outline = this.add.graphics();
      
      const thumb = this.add.image(x, y, stad.thumbKey || stad.key).setDisplaySize(180, 130);

      const hitArea = this.add.zone(x, y, 200, 150).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerdown', () => {
        this.cameras.main.flash(200, 255, 255, 255);
        this.time.delayedCall(300, () => {
          // Pass the selected stadium to the next scene
          const nextData = { ...this.prevData, stadiumKey: stad.key };
          this.scene.start('BallSelectScene', nextData);
        });
      });
      
      hitArea.on('pointerover', () => {
        outline.clear();
        outline.lineStyle(5, Phaser.Display.Color.HexStringToColor(stad.color).color, 1);
        outline.strokeRoundedRect(x - 105, y - 80, 210, 160, 16);
        thumb.setDisplaySize(190, 140); // Zoom visual
        
        // Update background preview
        if (stad.key === 'video_bombonera') {
          this.bigBg.setVisible(false);
          this.bigBgVideo.setVisible(true);
          if (!this.bigBgVideo.isPlaying()) this.bigBgVideo.play(true);
        } else {
          this.bigBgVideo.setVisible(false);
          this.bigBgVideo.stop();
          this.bigBg.setVisible(true);
          this.bigBg.setTexture(stad.key);
        }
        this.stadiumNameText.setText(stad.name.toUpperCase());
        this.stadiumNameText.setColor(stad.color);
      });

      hitArea.on('pointerout', () => {
        outline.clear();
        thumb.setDisplaySize(180, 130);  // Restaurar tamaño
      });
    });

    // Botón de Volver
    this.add.text(40, height - 50, '< VOLVER', { font: '36px "Burbank", monospace', color: '#ff0055' })
      .setStroke('#000000', 6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('CharacterSelectScene', { mode: this.prevData.mode, matchConfig: this.prevData.matchConfig });
      });
  }
}
