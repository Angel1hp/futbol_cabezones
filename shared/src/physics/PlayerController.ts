import { GAME_CONFIG } from '../constants/gameConfig';
import { PlayerInput } from '../types/network.types';
import { clamp, Circle, AABB } from './math';

export class PlayerController {
  public id: string;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public width: number;
  public height: number;
  
  public isGrounded: boolean;
  public speedStat: number;
  public jumpStat: number;
  public kickStat: number;
  
  public isKicking: boolean;
  public kickCooldownTimer: number;
  public facingDir: number; // 1 = Right, -1 = Left

  // The composite offsets relative to center (x, y)
  // Assuming sprite is 110x110. Center is (0,0)
  public headRadius: number = 30;
  public headOffsetY: number = -25; // Head is slightly above center
  public bodyWidth: number = 55;
  public bodyHeight: number = 60;
  public bodyOffsetY: number = 25; // Body is below center

  constructor(id: string, startX: number, startY: number) {
    this.id = id;
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.width = GAME_CONFIG.PLAYER_WIDTH;
    this.height = GAME_CONFIG.PLAYER_HEIGHT;
    this.isGrounded = false;
    this.speedStat = 1.0;
    this.jumpStat = 1.0;
    this.kickStat = 1.0;
    this.isKicking = false;
    this.kickCooldownTimer = 0;
    this.facingDir = (id === 'p1' || id === 'p3') ? 1 : -1;
  }

  public getHeadCircle(): Circle {
    return {
      x: this.x,
      y: this.y + this.headOffsetY,
      radius: this.headRadius
    };
  }

  public getBodyAABB(): AABB {
    return {
      x: this.x - this.bodyWidth / 2,
      y: this.y + this.bodyOffsetY - this.bodyHeight / 2,
      width: this.bodyWidth,
      height: this.bodyHeight
    };
  }

  public getKickHitbox(): AABB {
    // A temporary hitbox spawned in front of the foot when kicking
    const hitboxWidth = 40;
    const hitboxHeight = 40;
    return {
      x: this.x + (this.facingDir === 1 ? this.bodyWidth / 2 : -(this.bodyWidth / 2 + hitboxWidth)),
      y: this.y + this.bodyOffsetY,
      width: hitboxWidth,
      height: hitboxHeight
    };
  }

  public applyInput(input: PlayerInput, dt: number) {
    if (!input) return;

    // Movement
    const speed = GAME_CONFIG.BASE_SPEED * this.speedStat;
    if (input.left) {
      this.vx = -speed;
      this.facingDir = -1;
    } else if (input.right) {
      this.vx = speed;
      this.facingDir = 1;
    } else {
      // Friction
      if (this.isGrounded) {
        this.vx *= GAME_CONFIG.FRICTION;
      } else {
        this.vx *= GAME_CONFIG.AIR_RESISTANCE;
      }
    }

    // Jump
    if (input.jump && this.isGrounded) {
      this.vy = GAME_CONFIG.BASE_JUMP * this.jumpStat;
      this.isGrounded = false;
    }

    // Kick timer logic
    if (this.kickCooldownTimer > 0) {
      this.kickCooldownTimer -= dt * 1000;
      if (this.kickCooldownTimer <= 0) {
        this.isKicking = false;
        this.kickCooldownTimer = 0;
      }
    } else if (input.kick) {
      this.isKicking = true;
      this.kickCooldownTimer = GAME_CONFIG.KICK_COOLDOWN_MS;
    }
  }

  public updatePhysics(dt: number, leftLimit: number, rightLimit: number, groundY: number, crossbarY: number) {
    // Gravedad
    if (!this.isGrounded) {
      this.vy += GAME_CONFIG.GRAVITY * dt;
    }

    this.vy = clamp(this.vy, -2000, GAME_CONFIG.MAX_FALL_SPEED);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    let isStandingOnGoal = false;

    // Si el jugador está sobre la zona de los arcos, el travesaño actúa como suelo
    if (this.x - this.width / 2 < leftLimit || this.x + this.width / 2 > rightLimit) {
      if (this.y + this.height / 2 >= crossbarY && this.y - this.height / 2 < crossbarY) {
        this.y = crossbarY - this.height / 2;
        this.vy = 0;
        this.isGrounded = true;
        isStandingOnGoal = true;
      }
    }

    // Colisión suelo normal
    if (!isStandingOnGoal) {
      if (this.y + this.height / 2 >= groundY) {
        this.y = groundY - this.height / 2;
        this.vy = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    }

    // Limites laterales (solo si NO está parado encima del arco)
    if (!isStandingOnGoal && this.y + this.height / 2 > crossbarY) {
      if (this.x - this.width / 2 < leftLimit) {
        this.x = leftLimit + this.width / 2;
        this.vx = 0;
      } else if (this.x + this.width / 2 > rightLimit) {
        this.x = rightLimit - this.width / 2;
        this.vx = 0;
      }
    }
  }
}
