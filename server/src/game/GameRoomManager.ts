import { Server } from 'socket.io';
import { GameRoom } from './GameRoom';

export class GameRoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public getOrCreateRoom(roomId: string): GameRoom {
    if (!this.rooms.has(roomId)) {
      const room = new GameRoom(roomId, this.io);
      this.rooms.set(roomId, room);
    }
    return this.rooms.get(roomId)!;
  }

  public removeRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.stop();
      this.rooms.delete(roomId);
    }
  }

  public handleDisconnect(socketId: string) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players[socketId]) {
        room.removePlayer(socketId);
        if (Object.keys(room.players).length === 0) {
          this.removeRoom(roomId);
        }
      }
    }
  }
}
