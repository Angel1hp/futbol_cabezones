import { BallPhysics } from './BallPhysics';
import { GAME_CONFIG } from '../constants/gameConfig';

export class GoalDetector {
  private crossbarY: number;
  private leftGoalRightEdge: number;
  private rightGoalLeftEdge: number;
  private leftGoalLine: number;
  private rightGoalLine: number;

  constructor() {
    const goalY = GAME_CONFIG.FIELD_HEIGHT - GAME_CONFIG.GOAL_HEIGHT;
    this.crossbarY = goalY + 30 + GAME_CONFIG.GOAL_HEIGHT * (23 / 215);

    this.leftGoalRightEdge = GAME_CONFIG.GOAL_WIDTH;
    this.rightGoalLeftEdge = GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.GOAL_WIDTH;

    const paddingX = GAME_CONFIG.GOAL_WIDTH * (25 / 140);
    this.leftGoalLine = GAME_CONFIG.GOAL_WIDTH - paddingX;
    this.rightGoalLine = GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.GOAL_WIDTH + paddingX;
  }

  /**
   * Resuelve rebotes de la pelota contra los postes/travesaños
   */
  public handleGoalCollisions(ball: BallPhysics) {
    // Left Goal Crossbar
    if (ball.x < this.leftGoalRightEdge + ball.radius) {
      if (ball.y + ball.radius >= this.crossbarY && ball.y - ball.radius <= this.crossbarY + 25) {
        // Hit from top
        if (ball.vy >= 0 && ball.y < this.crossbarY) {
          ball.y = this.crossbarY - ball.radius;
          ball.vy = -ball.vy * 0.7;
          // Evitar que se quede estancada
          if (Math.abs(ball.vx) < 80) {
            ball.vx = 80; // Deslizar hacia el centro
          }
        }
        // Hit from front (post)
        else if (ball.x > this.leftGoalRightEdge && ball.vx < 0) {
          ball.x = this.leftGoalRightEdge + ball.radius;
          ball.vx = -ball.vx * 0.7;
        }
      }
    }

    // Right Goal Crossbar
    if (ball.x > this.rightGoalLeftEdge - ball.radius) {
      if (ball.y + ball.radius >= this.crossbarY && ball.y - ball.radius <= this.crossbarY + 25) {
        // Hit from top
        if (ball.vy >= 0 && ball.y < this.crossbarY) {
          ball.y = this.crossbarY - ball.radius;
          ball.vy = -ball.vy * 0.7;
          if (Math.abs(ball.vx) < 80) {
            ball.vx = -80; // Deslizar hacia el centro
          }
        }
        // Hit from front (post)
        else if (ball.x < this.rightGoalLeftEdge && ball.vx > 0) {
          ball.x = this.rightGoalLeftEdge - ball.radius;
          ball.vx = -ball.vx * 0.7;
        }
      }
    }
  }

  /**
   * Revisa si la pelota cruzó la línea de gol.
   * Retorna 'p1' o 'p2' (el ID del que anota el punto), o null.
   */
  public checkGoals(ball: BallPhysics): string | null {
    if (ball.y > this.crossbarY + ball.radius) {
      if (ball.x < this.leftGoalLine - ball.radius) {
        return 'p2'; // Gol en el arco izquierdo (defendido por p1)
      } else if (ball.x > this.rightGoalLine + ball.radius) {
        return 'p1'; // Gol en el arco derecho (defendido por p2)
      }
    }
    return null;
  }
}
