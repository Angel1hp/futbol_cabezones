import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { AuthScene } from '../scenes/AuthScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { LocalMenuScene } from '../scenes/LocalMenuScene';
import { LocalSetupScene } from '../scenes/LocalSetupScene';
import { LocalGameScene } from '../scenes/LocalGameScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { StadiumSelectScene } from '../scenes/StadiumSelectScene';
import { BallSelectScene } from '../scenes/BallSelectScene';
import { LobbyScene } from '../scenes/LobbyScene';
import { GameScene } from '../scenes/GameScene';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1024,
  height: 576,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, PreloadScene, AuthScene, MainMenuScene, LocalMenuScene, LocalSetupScene, LocalGameScene, CharacterSelectScene, StadiumSelectScene, BallSelectScene, LobbyScene, GameScene]
};
