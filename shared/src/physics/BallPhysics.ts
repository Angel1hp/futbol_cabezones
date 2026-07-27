import { GAME_CONFIG } from '../constants/gameConfig';
import { clamp } from './math';
export class BallPhysics {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public spin: number; // angular velocity

  constructor(x: number, y: number, radius: number = GAME_CONFIG.BALL_RADIUS) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.spin = 0;
  }

  public update(dt: number) {
    // Gravedad
    this.vy += GAME_CONFIG.GRAVITY * dt;
    this.vy = clamp(this.vy, -2000, GAME_CONFIG.MAX_FALL_SPEED);

    // Fricción aérea (muy ligera)
    this.vx *= GAME_CONFIG.AIR_RESISTANCE;

    // Aplicar efecto Magnus simulado (Spin afecta la trayectoria)
    // Si la pelota gira (spin), se desvía un poco
    if (Math.abs(this.spin) > 0.1) {
       // El spin afecta la vx dependiendo del tiempo en el aire
       this.vx += this.spin * 100 * dt;
       // Decaer el spin con el tiempo
       this.spin *= 0.98;
    } else {
       this.spin = 0;
    }

    // Actualizar posición
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Colisión suelo de la pelota
    const groundY = GAME_CONFIG.FIELD_HEIGHT;
    if (this.y + this.radius >= groundY) {
      this.y = groundY - this.radius;
      this.vy = -this.vy * 0.7; // Rebote
      this.vx *= 0.95; // Fricción rodando
    }

    // Rebote paredes superior y laterales
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.vy = -this.vy * 0.5;
    }

    // Las paredes laterales actúan como el fin de la red de los arcos
    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.vx = -this.vx * 0.5;
    } else if (this.x + this.radius >= GAME_CONFIG.FIELD_WIDTH) {
      this.x = GAME_CONFIG.FIELD_WIDTH - this.radius;
      this.vx = -this.vx * 0.5;
    }
  }

  public setVelocity(vx: number, vy: number) {
    this.vx = vx;
    this.vy = vy;
  }

  public addSpin(amount: number) {
    this.spin = clamp(this.spin + amount, -10, 10);
  }

  public reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.spin = 0;
  }
}
