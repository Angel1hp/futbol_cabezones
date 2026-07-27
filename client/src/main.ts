import Phaser from 'phaser';
import { phaserConfig } from './config/phaser.config';

class GameApp {
  private game: Phaser.Game;

  constructor() {
    console.log('Initializing Phaser Game App...');
    this.game = new Phaser.Game(phaserConfig);
  }
}

// Start game when DOM and fonts are loaded
window.addEventListener('load', () => {
  if (document.fonts) {
    document.fonts.ready.then(() => {
      new GameApp();
    });
  } else {
    new GameApp();
  }
});
