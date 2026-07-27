import { PlayerController } from './PlayerController';
import { BallPhysics } from './BallPhysics';
import { HeaderSystem } from './HeaderSystem';
import { KickSystem } from './KickSystem';
import { checkAABBCollision } from './math';

export class CollisionManager {
  private headerSystem: HeaderSystem;
  private kickSystem: KickSystem;

  constructor() {
    this.headerSystem = new HeaderSystem();
    this.kickSystem = new KickSystem();
  }

  public update(players: PlayerController[], ball: BallPhysics) {
    // 1. Colisiones entre jugadores (Body-blocking)
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        this.resolvePlayerPlayer(players[i], players[j]);
      }
    }

    // 2. Colisiones de jugadores con la pelota
    players.forEach(p => {
      // Intentar cabezazo primero (choque de cuerpos)
      const headed = this.headerSystem.resolveHeader(p, ball);
      
      // Intentar patada
      const kicked = this.kickSystem.resolveKick(p, ball);

      // Si no fue cabezazo ni patada (o si la pelota choca con el cuerpo)
      if (!headed && !kicked) {
        this.resolveBodyBall(p, ball);
      }
    });
  }

  private resolvePlayerPlayer(p1: PlayerController, p2: PlayerController) {
    const b1 = p1.getBodyAABB();
    const b2 = p2.getBodyAABB();

    if (checkAABBCollision(b1, b2)) {
      const overlapX = Math.min(b1.x + b1.width - b2.x, b2.x + b2.width - b1.x);
      const overlapY = Math.min(b1.y + b1.height - b2.y, b2.y + b2.height - b1.y);

      // Separación vertical si es menor que la horizontal (alguien saltó encima)
      if (overlapY < overlapX) {
        if (p1.y < p2.y) {
          // p1 está encima de p2, lo situamos encima de toda su altura (cabeza incluida)
          p1.y = p2.y - 110;
          if (p1.vy > 0) p1.vy = 0;
          p1.isGrounded = true;
        } else {
          // p2 está encima de p1
          p2.y = p1.y - 110;
          if (p2.vy > 0) p2.vy = 0;
          p2.isGrounded = true;
        }
      } else {
        // Separación horizontal
        if (p1.x < p2.x) {
          p1.x -= overlapX / 2;
          p2.x += overlapX / 2;
        } else {
          p1.x += overlapX / 2;
          p2.x -= overlapX / 2;
        }
      }
    }
  }

  private resolveBodyBall(player: PlayerController, ball: BallPhysics) {
    const body = player.getBodyAABB();
    // Aproximación rápida para la pelota golpeando el cuerpo rectangular
    // Si la pelota entra en el AABB del cuerpo
    if (
      ball.x + ball.radius > body.x &&
      ball.x - ball.radius < body.x + body.width &&
      ball.y + ball.radius > body.y &&
      ball.y - ball.radius < body.y + body.height
    ) {
      // Choque simple y rebote amortiguado
      if (ball.x < player.x) {
        ball.x = body.x - ball.radius;
        ball.vx = -Math.abs(ball.vx) * 0.5 - 100;
      } else {
        ball.x = body.x + body.width + ball.radius;
        ball.vx = Math.abs(ball.vx) * 0.5 + 100;
      }
    }
  }
}
