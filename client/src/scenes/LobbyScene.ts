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

    const username = (this.registry.get('username') || 'Invitado').toUpperCase();

    this.statusText = this.add.text(width / 2, height / 2, `BUSCANDO PARTIDA PARA:\n${username}`, {
      font: '32px "Burbank", monospace',
      color: '#00ff88',
      align: 'center'
    }).setOrigin(0.5).setStroke('#000000', 4);

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
    const username = this.registry.get('username') || 'Invitado';
    
    // Hardcoded room for now to facilitate Phase 4 testing
    const roomId = 'test_room_1';
    socket.emit('lobby:join_room', { roomId, spriteKey: this.spriteKey, ballKey: this.ballKey, username });

    socket.on('game:countdown', (data: { seconds: number, role?: string, players?: { id: string, sprite: string, username?: string }[], ballKey?: string }) => {
      // Encontrar al rival
      const myId = data.role;
      const opponent = data.players?.find(p => p.id !== myId);
      const opponentName = (opponent?.username || opponent?.sprite?.replace('char_', '') || 'Rival').toUpperCase();
      const myName = username.toUpperCase();

      this.statusText.setText(`¡RIVAL ENCONTRADO!\n${myName} VS ${opponentName}\nEmpezando en ${data.seconds}...`);
      this.statusText.setColor('#ffea00');
      
      this.time.delayedCall(data.seconds * 1000, () => {
        socket.off('game:countdown');
        this.scene.start('GameScene', { roomId, role: data.role, players: data.players, ballKey: data.ballKey });
      });
    });
  }
}
