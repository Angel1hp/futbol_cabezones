import { BallPhysics } from './BallPhysics';
import { PlayerController } from './PlayerController';
import { checkCircleCollision, normalize, distance } from './math';

export class HeaderSystem {
  /**
   * Resuelve la colisión entre la cabeza del jugador y el balón.
   * Modifica la velocidad del balón directamente aplicando un impulso vectorial.
   * Retorna true si hubo colisión.
   */
  public resolveHeader(player: PlayerController, ball: BallPhysics): boolean {
    const head = player.getHeadCircle();
    const ballCircle = { x: ball.x, y: ball.y, radius: ball.radius };

    if (!checkCircleCollision(head, ballCircle)) {
      return false;
    }

    // Calcular el vector de colisión (desde la cabeza hacia el balón)
    const dx = ball.x - head.x;
    const dy = ball.y - head.y;
    
    // Normalizar vector (dirección del cabezazo)
    let normal = normalize({ x: dx, y: dy });
    if (normal.x === 0 && normal.y === 0) {
      normal = { x: 0, y: -1 }; // Por defecto hacia arriba si los centros coinciden exactamente
    }

    // Separar los objetos para que no se queden atascados
    const dist = distance({ x: head.x, y: head.y }, { x: ball.x, y: ball.y });
    const overlap = (head.radius + ball.radius) - dist;
    if (overlap > 0) {
      ball.x += normal.x * overlap;
      ball.y += normal.y * overlap;
    }

    // Calcular potencia base del cabezazo
    let power = 400; // Impulso base
    
    // Añadir potencia extra basada en la velocidad del jugador
    if (Math.abs(player.vx) > 0) power += 150;
    
    // Si el jugador está saltando o subiendo, agregar un rebote más alto y fuerte
    if (player.vy < -50) {
      power += 250;
      // Inclinamos el vector normal ligeramente más hacia arriba para favorecer globos
      normal.y -= 0.5;
      normal = normalize(normal);
    }

    // Aplicar el impulso a la velocidad de la pelota
    // Eliminamos la velocidad actual de la pelota para darle una nueva trayectoria "limpia" (efecto Arcade)
    ball.vx = normal.x * power + (player.vx * 0.5); // Hereda un 50% de la velocidad horizontal del jugador
    ball.vy = normal.y * power + Math.min(player.vy * 0.5, 0); // Hereda impulso hacia arriba si lo hay

    // Añadir efecto de rotación si golpea corriendo
    if (Math.abs(player.vx) > 100) {
      ball.addSpin(player.facingDir * 2);
    }

    return true;
  }
}
