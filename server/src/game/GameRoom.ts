import { Server } from 'socket.io';
import { PhysicsEngine, GAME_CONFIG } from '@futbol-cabezones/shared';
import { supabaseAdmin } from '../config/supabaseAdmin';

export class GameRoom {
  public id: string;
  public players: { [socketId: string]: string } = {}; // socketId -> 'p1' | 'p2' | 'p3' | 'p4'
  public sprites: { [role: string]: string } = {};
  public ballKey: string = 'ball';
  private io: Server;
  
  private engine!: PhysicsEngine;
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private TICK_RATE = 60;
  
  private currentTick = 0;
  private latestInputs: { [role: string]: any } = {};

  public isRunning = false;
  private state: 'PLAYING' | 'GOAL_SCORED' | 'FINISHED' = 'PLAYING';
  private score: [number, number] = [0, 0];
  private remainingTime: number = GAME_CONFIG.MATCH_DURATION_SECONDS;
  
  constructor(id: string, io: Server) {
    this.id = id;
    this.io = io;
    this.engine = new PhysicsEngine();
  }

  public addPlayer(socketId: string, spriteKey?: string) {
    if (!this.players[socketId]) {
      const assignedRoles = Object.values(this.players);
      let role = 'p1';
      if (!assignedRoles.includes('p1')) role = 'p1';
      else if (!assignedRoles.includes('p2')) role = 'p2';
      else if (!assignedRoles.includes('p3')) role = 'p3';
      else if (!assignedRoles.includes('p4')) role = 'p4';
      
      this.players[socketId] = role;
      if (spriteKey) this.sprites[role] = spriteKey;
    }
    return this.players[socketId];
  }

  public removePlayer(socketId: string) {
    delete this.players[socketId];
    if (Object.keys(this.players).length === 0) {
      this.stop();
    }
  }

  public handleInput(socketId: string, inputData: any) {
    const role = this.players[socketId];
    if (role) {
      this.latestInputs[role] = inputData;
    }
  }

  public start(targetPlayers: number) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.engine = new PhysicsEngine(targetPlayers);
    
    const msPerTick = 1000 / this.TICK_RATE;
    const dt = msPerTick / 1000;
    
    let lastTime = Date.now();

    this.gameLoopInterval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      this.currentTick++;

      // Si está pausado por gol o fin de partido, saltar actualización física
      let goalScored: string | null = null;
      if (this.state === 'PLAYING') {
        goalScored = this.engine.update(dt, this.latestInputs);
        this.remainingTime -= dt;

        if (goalScored) {
          this.handleGoal(goalScored);
        } else if (this.remainingTime <= 0) {
          this.endMatch();
        }
      }
      
      // Construir Snapshot
      const snapshot = {
        tick: this.currentTick,
        time: Math.max(0, Math.ceil(this.remainingTime)),
        players: this.engine.players.map(p => ({
          id: p.id,
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
          isKicking: p.isKicking
        })),
        ball: {
          x: this.engine.ball.x,
          y: this.engine.ball.y,
          vx: this.engine.ball.vx,
          vy: this.engine.ball.vy,
          rotation: 0
        },
        score: this.score
      };

      // Broadcast a la sala
      this.io.to(this.id).emit('game:snapshot', snapshot);
      
    }, msPerTick);
  }

  private handleGoal(scorerId: string) {
    this.state = 'GOAL_SCORED';
    if (scorerId === 'p1') this.score[0]++;
    else if (scorerId === 'p2') this.score[1]++;

    this.io.to(this.id).emit('game:goal_scored', { scorerId, newScore: this.score });

    setTimeout(() => {
      if (this.state !== 'FINISHED') {
        this.engine.resetPositions();
        this.state = 'PLAYING';
      }
    }, 3000);
  }

  private async endMatch() {
    this.state = 'FINISHED';
    
    let winnerId: string | null = null;
    if (this.score[0] > this.score[1]) winnerId = 'p1';
    else if (this.score[1] > this.score[0]) winnerId = 'p2';

    this.io.to(this.id).emit('game:match_ended', { winnerId, finalScore: this.score });
    this.stop();

    console.log(`[GameRoom] Partida ${this.id} finalizada. P1: ${this.score[0]} - P2: ${this.score[1]}`);

    try {
      // Registrar la partida usando service_role para bypassear RLS
      const { data: matchData, error: matchError } = await supabaseAdmin.from('matches').insert({
        started_at: new Date(Date.now() - GAME_CONFIG.MATCH_DURATION_SECONDS * 1000).toISOString(),
        duration_seconds: GAME_CONFIG.MATCH_DURATION_SECONDS,
      }).select().single();

      if (matchError) throw matchError;

      console.log(`[GameRoom] Guardada partida en DB: ${matchData.id}`);
      // Nota: Falta vincular UUIDs reales de usuarios en this.players para insertar en match_players.
      // Se completará cuando los usuarios inicien sesión correctamente.
    } catch (err: any) {
      console.error('[GameRoom] Error guardando partida:', err.message);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }
}
