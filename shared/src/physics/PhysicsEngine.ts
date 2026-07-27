import { GAME_CONFIG } from '../constants/gameConfig';
import { PlayerController } from './PlayerController';
import { BallPhysics } from './BallPhysics';
import { GoalDetector } from './GoalDetector';
import { CollisionManager } from './CollisionManager';

export interface PlayerPhysics {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  speedStat: number;
  jumpStat: number;
  kickStat: number;
  isKicking: boolean;
  kickCooldownTimer: number;
  // added from controller
  facingDir?: number; 
}

// We re-export the interface for backward compatibility
export interface BallPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  spin?: number;
}

export class PhysicsEngine {
  public players: PlayerController[];
  public ball: BallPhysics;

  private goalDetector: GoalDetector;
  private collisionManager: CollisionManager;

  constructor(playerCount: number = 2) {
    this.players = [];
    
    const paddingX = GAME_CONFIG.GOAL_WIDTH * (25 / 140); 
    const leftLimit = GAME_CONFIG.GOAL_WIDTH - paddingX;
    const rightLimit = GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.GOAL_WIDTH + paddingX;
    
    if (playerCount === 2) {
      this.players.push(new PlayerController('p1', leftLimit + 55 + 100, GAME_CONFIG.FIELD_HEIGHT - 50));
      this.players.push(new PlayerController('p2', rightLimit - 55 - 100, GAME_CONFIG.FIELD_HEIGHT - 50));
    } else if (playerCount === 4) {
      this.players.push(new PlayerController('p1', leftLimit + 55 + 100, GAME_CONFIG.FIELD_HEIGHT - 50));
      this.players.push(new PlayerController('p2', rightLimit - 55 - 100, GAME_CONFIG.FIELD_HEIGHT - 50));
      this.players.push(new PlayerController('p3', leftLimit + 55 + 10, GAME_CONFIG.FIELD_HEIGHT - 50));
      this.players.push(new PlayerController('p4', rightLimit - 55 - 10, GAME_CONFIG.FIELD_HEIGHT - 50));
    }

    this.ball = new BallPhysics(GAME_CONFIG.FIELD_WIDTH / 2, GAME_CONFIG.FIELD_HEIGHT / 2 - 100, GAME_CONFIG.BALL_RADIUS);

    this.goalDetector = new GoalDetector();
    this.collisionManager = new CollisionManager();
  }

  public update(dt: number, inputs: { [id: string]: any }): string | null {
    const paddingX = GAME_CONFIG.GOAL_WIDTH * (25 / 140);
    const leftLimit = GAME_CONFIG.GOAL_WIDTH - paddingX;
    const rightLimit = GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.GOAL_WIDTH + paddingX;
    const groundY = GAME_CONFIG.FIELD_HEIGHT;
    const goalY = groundY - GAME_CONFIG.GOAL_HEIGHT;
    const crossbarY = goalY + 30 + GAME_CONFIG.GOAL_HEIGHT * (23 / 215);

    // Actualizar Jugadores
    this.players.forEach(p => {
      if (inputs && inputs[p.id]) {
        p.applyInput(inputs[p.id], dt);
      }
      p.updatePhysics(dt, leftLimit, rightLimit, groundY, crossbarY);
    });

    // Actualizar Balón
    this.ball.update(dt);

    // Detectar rebotes contra la red y postes
    this.goalDetector.handleGoalCollisions(this.ball);

    // Administrar colisiones (Balón vs Jugador, Jugador vs Jugador, etc.)
    this.collisionManager.update(this.players, this.ball);

    // Comprobar goles
    return this.goalDetector.checkGoals(this.ball);
  }

  public resetPositions() {
    const paddingX = GAME_CONFIG.GOAL_WIDTH * (25 / 140);
    const leftLimit = GAME_CONFIG.GOAL_WIDTH - paddingX;
    const rightLimit = GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.GOAL_WIDTH + paddingX;
    
    this.players.forEach(p => {
      const halfW = GAME_CONFIG.PLAYER_WIDTH / 2;
      if (p.id === 'p1') { p.x = leftLimit + halfW + 100; p.facingDir = 1; }
      else if (p.id === 'p2') { p.x = rightLimit - halfW - 100; p.facingDir = -1; }
      else if (p.id === 'p3') { p.x = leftLimit + halfW + 10; p.facingDir = 1; }
      else if (p.id === 'p4') { p.x = rightLimit - halfW - 10; p.facingDir = -1; }

      p.y = GAME_CONFIG.FIELD_HEIGHT - 50;
      p.vx = 0;
      p.vy = 0;
      p.isKicking = false;
    });

    this.ball.reset(GAME_CONFIG.FIELD_WIDTH / 2, GAME_CONFIG.FIELD_HEIGHT / 2 - 100);
  }
}
