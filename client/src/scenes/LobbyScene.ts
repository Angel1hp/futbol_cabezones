import Phaser from 'phaser';
import { socketService } from '../services/socket.service';

export class LobbyScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  private spriteKey!: string;
  private ballKey!: string;

  init(data: { spriteKey?: string, ballKey?: string }) {
    this.spriteKey = data?.spriteKey || 'char_messi';
    this.ballKey = data?.ballKey || 'ball';
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x121224);

    this.statusText = this.add.text(width / 2, height / 2, 'CONECTANDO AL SERVIDOR...', {
      font: '600 24px Inter, monospace',
      color: '#00ff88'
    }).setOrigin(0.5);

    // Get socket and set up listeners
    const socket = socketService.getSocket();

    if (socket.connected) {
      this.joinRoom(socket);
    } else {
      socket.once('connect', () => {
        this.joinRoom(socket);
      });
    }

    // Cancel button
    this.add.text(10, 10, '< Cancelar', { font: '16px monospace', color: '#ff0055' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        socket.off('game:countdown');
        this.scene.start('MainMenuScene');
      });
  }

  private joinRoom(socket: import('socket.io-client').Socket) {
    this.statusText.setText('BUSCANDO PARTIDA...\n(Esperando rival)');
    
    // Hardcoded room for now to facilitate Phase 4 testing
    const roomId = 'test_room_1';
    socket.emit('lobby:join_room', { roomId, spriteKey: this.spriteKey, ballKey: this.ballKey });

    socket.on('game:countdown', (data: { seconds: number, role?: string, players?: { id: string, sprite: string }[], ballKey?: string }) => {
      this.statusText.setText(`¡RIVAL ENCONTRADO!\nEl partido empieza en ${data.seconds}...`);
      
      this.time.delayedCall(data.seconds * 1000, () => {
        socket.off('game:countdown');
        this.scene.start('GameScene', { roomId, role: data.role, players: data.players, ballKey: data.ballKey });
      });
    });
  }
}
