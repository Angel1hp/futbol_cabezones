export type { PlayerInput, EntityState, BallState, MatchSnapshot, ClientToServerEvents, ServerToClientEvents } from './types/network.types';
export type { Circle, AABB } from './physics/math';
export type { PlayerPhysics, BallPhysicsState } from './physics/PhysicsEngine';

import { GAME_CONFIG } from './constants/gameConfig';
import { clamp } from './physics/math';
import { PhysicsEngine } from './physics/PhysicsEngine';
import { PlayerController } from './physics/PlayerController';
import { BallPhysics } from './physics/BallPhysics';

export { GAME_CONFIG, clamp, PhysicsEngine, PlayerController, BallPhysics };
