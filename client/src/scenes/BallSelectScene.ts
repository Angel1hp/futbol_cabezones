import Phaser from 'phaser';

export class BallSelectScene extends Phaser.Scene {
  private prevData!: Record<string, unknown>;
  private ballNameText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BallSelectScene' });
  }

  init(data: Record<string, unknown>) {
    this.prevData = data;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const balls = [
      { id: 'classic', name: 'Pelota Clásica', key: 'ball', color: '#ffffff' },
      { id: 'fire', name: 'Pelota Infernal', key: 'ball_fire', color: '#ff4400' },
      { id: 'retro', name: 'Pelota Retro', key: 'ball_retro', color: '#aa7744' }
    ];

    // Tint overlay to make UI readable
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);

    this.add.text(width / 2, 60, 'SELECCIONA EL BALÓN', {
      font: '64px "Burbank", monospace',
      color: '#ffffff'
    }).setOrigin(0.5).setShadow(4, 4, '#00ff88', 0, true, true).setStroke('#000000', 8);

    this.ballNameText = this.add.text(width / 2, height - 150, balls[0].name.toUpperCase(), {
      font: '56px "Burbank", monospace',
      color: balls[0].color
    }).setOrigin(0.5).setShadow(4, 4, '#000000', 0, true, true).setStroke('#000000', 6);

    // --- CAROUSEL / GRID ---
    const startX = width / 2 - 200;
    const startY = height / 2;
    const spacing = 200;

    balls.forEach((ball, index) => {
      const x = startX + index * spacing;
      const y = startY;

      const card = this.add.graphics();
      card.fillStyle(0x111111, 0.9);
      card.fillRoundedRect(x - 75, y - 75, 150, 150, 12);
      
      const outline = this.add.graphics();
      
      const thumb = this.add.image(x, y, ball.key).setDisplaySize(100, 100);

      const hitArea = this.add.zone(x, y, 150, 150).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerdown', () => {
        this.cameras.main.flash(200, 255, 255, 255);
        this.time.delayedCall(300, () => {
          // Pass the selected ball to the next scene
          const nextData = { ...this.prevData, ballKey: ball.key };
          
          if (this.prevData.mode === 'online') {
            this.scene.start('LobbyScene', nextData);
          } else {
            this.scene.start('LocalGameScene', nextData);
          }
        });
      });
      
      hitArea.on('pointerover', () => {
        outline.clear();
        outline.lineStyle(5, Phaser.Display.Color.HexStringToColor(ball.color).color, 1);
        outline.strokeRoundedRect(x - 80, y - 80, 160, 160, 16);
        thumb.setDisplaySize(120, 120); // Zoom visual
        
        // Update name
        this.ballNameText.setText(ball.name.toUpperCase());
        this.ballNameText.setColor(ball.color);
      });

      hitArea.on('pointerout', () => {
        outline.clear();
        thumb.setDisplaySize(100, 100);  // Restaurar tamaño
      });
    });

    // Botón de Volver
    this.add.text(40, height - 50, '< VOLVER', { font: '36px "Burbank", monospace', color: '#00ff88' })
      .setStroke('#000000', 6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('StadiumSelectScene', this.prevData);
      });
  }
}
