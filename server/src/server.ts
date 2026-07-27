import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { ClientToServerEvents, ServerToClientEvents, PlayerInput } from '@futbol-cabezones/shared';

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

import { GameRoomManager } from './game/GameRoomManager';

const roomManager = new GameRoomManager(io);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Quick Match / Join Room logic
  socket.on('lobby:join_room', (data: { roomId: string, spriteKey?: string, ballKey?: string }) => {
    socket.join(data.roomId);
    const room = roomManager.getOrCreateRoom(data.roomId);
    room.addPlayer(socket.id, data.spriteKey);
    
    // El creador define la pelota
    if (room.players[socket.id] === 'p1' && data.ballKey) {
      room.ballKey = data.ballKey;
    }
    
    // Auto-start if target reached
    const targetPlayers = data.roomId.includes('2v2') ? 4 : 2;
    if (Object.keys(room.players).length === targetPlayers) {
      room.start(targetPlayers);
      
      const playersList = Object.keys(room.players).map(sId => ({
         id: room.players[sId],
         sprite: room.sprites[room.players[sId]]
      }));

      Object.keys(room.players).forEach(sId => {
        const role = room.players[sId];
        io.to(sId).emit('game:countdown', { 
          seconds: 3, 
          role,
          players: playersList,
          ballKey: room.ballKey
        });
      });
    }
  });

  socket.on('game:player_input', (data: PlayerInput) => {
    // Buscar la sala de este socket (ignorando la sala del propio socket.id)
    const roomIds = Array.from(socket.rooms).filter(id => id !== socket.id);
    if (roomIds.length > 0) {
      const room = roomManager.getOrCreateRoom(roomIds[0]);
      room.handleInput(socket.id, data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Server]: Running at http://localhost:${PORT}`);
});

export { io };
