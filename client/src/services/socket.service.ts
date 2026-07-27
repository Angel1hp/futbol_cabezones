import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@futbol-cabezones/shared';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private wsUrl = import.meta.env.VITE_WS_SERVER_URL || 'http://localhost:3000';

  public connect(token?: string) {
    if (this.socket?.connected) return;

    this.socket = io(this.wsUrl, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket Server:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.warn('❌ Disconnected from WebSocket Server');
    });
  }

  public getSocket() {
    if (!this.socket) {
      this.connect();
    }
    return this.socket!;
  }
}

export const socketService = new SocketService();
