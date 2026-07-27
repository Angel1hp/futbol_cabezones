// shared/src/types/network.types.ts

export interface PlayerInput {
  sequence: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  kick: boolean;
}

export interface EntityState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isKicking: boolean;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
}

export interface MatchSnapshot {
  tick: number;
  time: number;
  players: EntityState[];
  ball: BallState;
  score: [number, number];
}

export interface ClientToServerEvents {
  "lobby:create_room": (data: { isPrivate: boolean }) => void;
  "lobby:join_room": (data: { roomId: string; spriteKey?: string }) => void;
  "lobby:quick_match": () => void;
  "character:select": (data: { characterId: string }) => void;
  "game:player_input": (data: PlayerInput) => void;
}

export interface ServerToClientEvents {
  "auth:success": (data: { userId: string; username: string }) => void;
  "lobby:room_updated": (data: { roomId: string; players: any[] }) => void;
  "game:countdown": (data: {
    seconds: number;
    role?: string;
    players?: { id: string; sprite: string }[];
    ballKey?: string;
  }) => void;
  "game:snapshot": (data: MatchSnapshot) => void;
  "game:goal_scored": (data: { scorerId: string; newScore: [number, number] }) => void;
  "game:match_ended": (data: { winnerId: string | null; finalScore: [number, number] }) => void;
}
