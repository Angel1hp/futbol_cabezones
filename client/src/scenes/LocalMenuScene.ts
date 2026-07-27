import Phaser from 'phaser';

export class LocalMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LocalMenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    const titleText = this.add.text(width / 2, 120, 'MODO LOCAL', {
      font: '40px "Burbank", monospace',
      color: '#00ccff'
    }).setOrigin(0.5);
    titleText.setStroke('#000000', 8);
    titleText.setShadow(6, 6, '#000000', 0, true, false);

    // Buttons
    const buttons = [
      { label: '1 JUGADOR', textFill: '#00ff88', vsCpu: true },
      { label: '2 JUGADORES', textFill: '#ff0055', vsCpu: false }
    ];

    buttons.forEach((btn, index) => {
      const y = 260 + index * 90;
      
      const btnText = this.add.text(width / 2, y, btn.label, {
        font: '24px "Burbank", monospace',
        color: btn.textFill
      }).setOrigin(0.5);
      
      btnText.setStroke('#000000', 6);
      btnText.setShadow(4, 4, '#000000', 0, true, false);

      const hitArea = this.add.zone(width / 2, y, 400, 60).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: [btnText],
          scale: 1.05,
          duration: 100
        });
      });

      hitArea.on('pointerout', () => {
        this.tweens.add({
          targets: [btnText],
          scale: 1.0,
          duration: 100
        });
      });

      hitArea.on('pointerdown', () => {
        const mode = btn.vsCpu ? 'local_vs_cpu' : 'local_2p';
        this.scene.start('CharacterSelectScene', { mode });
      });
    });

    // Back button to MainMenu
    const backBtn = this.add.text(30, 40, '< VOLVER', { font: '20px "Burbank", monospace', color: '#ff0055' })
      .setInteractive({ useHandCursor: true });
    backBtn.setStroke('#000000', 6);
    backBtn.setShadow(4, 4, '#000000', 0, true, false);
      
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#00ff88'));
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}
