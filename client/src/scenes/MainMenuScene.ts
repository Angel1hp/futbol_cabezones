import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Iniciar música de fondo de los menús
    let menuMusic = this.sound.get('music') as Phaser.Sound.BaseSound;
    if (!menuMusic) {
      menuMusic = this.sound.add('music', { loop: true, volume: 0.4 });
    }
    if (!menuMusic.isPlaying) {
      menuMusic.play();
    }

    // Fondo animado de video
    const bgVideo = this.add.video(width / 2, height / 2, 'menu_inicial_video');
    bgVideo.play(true);
    
    bgVideo.on('play', () => {
      // Usar la resolución nativa del video para calcular la escala correcta
      const videoW = bgVideo.video?.videoWidth || 1080;
      const videoH = bgVideo.video?.videoHeight || 720;
      const scaleX = width / videoW;
      const scaleY = height / videoH;
      bgVideo.setScale(Math.max(scaleX, scaleY));
    });

    // Title
    const titleText = this.add.text(width / 2, 100, 'FÚTBOL CABEZONES', {
      font: '80px "Burbank", monospace',
      color: '#ff9900'
    }).setOrigin(0.5);
    titleText.setStroke('#000000', 8);
    titleText.setShadow(6, 6, '#000000', 0, true, false);

    const subtitleText = this.add.text(width / 2, 165, 'Multijugador Online en Tiempo Real', {
      font: '28px "Burbank", monospace',
      color: '#00ff88'
    }).setOrigin(0.5);
    subtitleText.setStroke('#000000', 4);

    // Menu Buttons
    const buttons = [
      { label: 'JUGAR PARTIDA', textFill: '#00ff88', scene: 'CharacterSelectScene' },
      { label: 'MODO LOCAL', textFill: '#ff0055', scene: 'LocalMenuScene' },
      { label: 'MI PERFIL', textFill: '#ffd700', scene: 'ProfileScene' },
      { label: 'RANKING MUNDIAL', textFill: '#00ccff', scene: 'LeaderboardScene' },
      { label: 'CONFIGURACIÓN', textFill: '#ff9900', scene: 'SettingsScene' }
    ];

    buttons.forEach((btn, index) => {
      const y = 240 + index * 70;

      const btnText = this.add.text(width / 2, y, btn.label, {
        font: '36px "Burbank", monospace',
        color: btn.textFill
      }).setOrigin(0.5);
      
      btnText.setStroke('#000000', 6);
      btnText.setShadow(4, 4, '#000000', 0, true, false);

      // Interactive hit area
      const hitArea = this.add.zone(width / 2, y, 400, 50).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerover', () => {
        this.sound.play('hover', { volume: 0.5 });
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
        console.log(`Navigating to ${btn.scene}`);
        if (btn.scene === 'LocalMenuScene') {
          this.scene.start('LocalSetupScene');
        } else if (this.scene.get(btn.scene)) {
          this.scene.start(btn.scene);
        } else {
          alert(`La escena ${btn.scene} estará disponible en la siguiente fase.`);
        }
      });
    });

    // Footer info
    this.add.text(width / 2, height - 30, 'v1.0.0-alpha | Powered by Phaser 3 & Supabase', {
      font: '12px monospace',
      color: '#666688'
    }).setOrigin(0.5);
  }
}
