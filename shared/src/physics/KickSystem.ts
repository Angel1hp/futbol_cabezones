import { BallPhysics } from './BallPhysics';
import { PlayerController } from './PlayerController';
import { checkCircleAABBCollision } from './math';
import { GAME_CONFIG } from '../constants/gameConfig';

export class KickSystem {
  /**
   * Intenta realizar una patada.
   * Si la pelota está dentro de la hitbox temporal, aplica un impulso masivo.
   * Retorna true si hubo contacto.
   */
  public resolveKick(player: PlayerController, ball: BallPhysics): boolean {
    // Si no está pateando o el timer ya expiró el "sweet spot" (ej. 120ms)
    // Supongamos que KICK_COOLDOWN_MS es 300, la ventana activa es cuando quedan más de 180ms
    const activeWindow = GAME_CONFIG.KICK_COOLDOWN_MS - 120;
    if (!player.isKicking || player.kickCooldownTimer < activeWindow) {
      return false;
    }

    const hitbox = player.getKickHitbox();
    const ballCircle = { x: ball.x, y: ball.y, radius: ball.radius };

    if (!checkCircleAABBCollision(ballCircle, hitbox)) {
      return false;
    }

    // Calcular potencia base
    let forceX = GAME_CONFIG.KICK_FORCE_X * player.kickStat;
    let forceY = GAME_CONFIG.KICK_FORCE_Y * player.kickStat;

    // Modificadores basados en el estado del jugador
    if (!player.isGrounded) {
      // Patada en el aire (Volea / Chilena)
      forceX *= 1.2; 
      // Si está cayendo, la pelota va más hacia abajo/recta
      if (player.vy > 50) {
        forceY = -100;
      } else {
        // Si está subiendo, va muy arriba
        forceY *= 1.3;
      }
    } else if (Math.abs(player.vx) > 50) {
      // Patada corriendo (tiro potente a media altura)
      forceX *= 1.1;
      forceY *= 0.7; 
    } else {
      // Patada quieto (tiro bombeado, vaselina)
      forceX *= 0.8;
      forceY *= 1.2;
    }

    // Aplicar dirección
    forceX *= player.facingDir;

    // Anular velocidad previa para el toque Arcade perfecto
    ball.vx = forceX;
    ball.vy = forceY;

    // Añadir mucho efecto en patadas fuertes
    ball.addSpin(player.facingDir * 5);

    // Cancelar la patada para no golpear varias veces en el mismo frame/cooldown
    player.isKicking = false;
    player.kickCooldownTimer = GAME_CONFIG.KICK_COOLDOWN_MS - 121; // Lo pasamos fuera de la ventana activa

    return true;
  }
}
