export const GAME_CONFIG = {
  // Dimensiones del campo virtual (Servidor y Cliente usarán las mismas coordenadas base)
  FIELD_WIDTH: 1024,
  FIELD_HEIGHT: 576,

  // Físicas Globales
  GRAVITY: 1200,      // Pixeles por segundo al cuadrado
  FRICTION: 0.85,     // Fricción horizontal en el suelo (1 = nada, 0 = total)
  AIR_RESISTANCE: 0.99, // Fricción leve en el aire

  // Dimensiones de Entidades
  BALL_RADIUS: 16,
  PLAYER_WIDTH: 110,
  PLAYER_HEIGHT: 110,

  // Posiciones de los Arcos (Cajas AABB)
  GOAL_WIDTH: 180,
  GOAL_HEIGHT: 280,
  
  // Parámetros de Movimiento Base (serán modificados por las stats del personaje)
  BASE_SPEED: 400,
  BASE_JUMP: -600,
  MAX_FALL_SPEED: 1000,
  
  // Impulso de la patada
  KICK_FORCE_X: 600,
  KICK_FORCE_Y: -500,
  KICK_COOLDOWN_MS: 300,

  // Tiempo de Partida
  MATCH_DURATION_SECONDS: 120, // 2 minutos
};
