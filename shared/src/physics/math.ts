export interface Vector2 {
  x: number;
  y: number;
}

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Retorna true si hay intersección entre dos AABB
 */
export function checkAABBCollision(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Retorna true si hay intersección entre un AABB y un Círculo
 */
export function checkCircleAABBCollision(circle: Circle, rect: AABB): boolean {
  // Encuentra el punto del rectángulo más cercano al centro del círculo
  let testX = circle.x;
  let testY = circle.y;

  if (circle.x < rect.x) testX = rect.x; // Borde izquierdo
  else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width; // Borde derecho

  if (circle.y < rect.y) testY = rect.y; // Borde superior
  else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height; // Borde inferior

  // Distancia del círculo a ese punto
  const distX = circle.x - testX;
  const distY = circle.y - testY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  return distance <= circle.radius;
}

/**
 * Retorna true si hay intersección entre dos círculos
 */
export function checkCircleCollision(c1: Circle, c2: Circle): boolean {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distanceSq = dx * dx + dy * dy;
  const radiusSum = c1.radius + c2.radius;
  return distanceSq <= radiusSum * radiusSum;
}

/**
 * Limita un valor entre un mínimo y un máximo
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// === Funciones Auxiliares de Vectores ===

export function distanceSq(v1: Vector2, v2: Vector2): number {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  return dx * dx + dy * dy;
}

export function distance(v1: Vector2, v2: Vector2): number {
  return Math.sqrt(distanceSq(v1, v2));
}

export function normalize(v: Vector2): Vector2 {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function dotProduct(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.x + v1.y * v2.y;
}
