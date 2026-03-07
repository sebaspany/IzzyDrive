export type CarType = 'bugatti' | 'lambo' | 'cybertruck';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameScreen = 'start' | 'playing' | 'celebration';

export interface CarColors {
  body: string;
  accent: string;
  neon: string;
  name: string;
}

export const CAR_DATA: Record<CarType, CarColors> = {
  bugatti: {
    body: '#1a1aff',
    accent: '#00ccff',
    neon: '#00eeff',
    name: 'Bugatti Chiron',
  },
  lambo: {
    body: '#ff6600',
    accent: '#ffcc00',
    neon: '#ffaa00',
    name: 'Lamborghini Aventador',
  },
  cybertruck: {
    body: '#888899',
    accent: '#aabbcc',
    neon: '#66ffcc',
    name: 'Tesla Cybertruck',
  },
};

export interface DifficultyConfig {
  trackWidth: number; // fraction of canvas width
  obstacleSpeed: number;
  spawnRate: number; // lower = more frequent
  label: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    trackWidth: 0.75,
    obstacleSpeed: 3,
    spawnRate: 90,
    label: 'Easy',
  },
  medium: {
    trackWidth: 0.6,
    obstacleSpeed: 4.5,
    spawnRate: 60,
    label: 'Medium',
  },
  hard: {
    trackWidth: 0.5,
    obstacleSpeed: 6,
    spawnRate: 40,
    label: 'Hard',
  },
};

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'barrier';
  color: string;
  lane: number;
}

export interface Boost {
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RoadStripe {
  y: number;
}

export interface GameState {
  playerX: number;
  playerY: number;
  speed: number;
  baseSpeed: number;
  score: number;
  distance: number;
  combo: number;
  comboTimer: number;
  lives: number;
  boosted: boolean;
  boostTimer: number;
  drifting: boolean;
  driftDir: number;
  invincible: boolean;
  invincibleTimer: number;
  obstacles: Obstacle[];
  boosts: Boost[];
  particles: Particle[];
  roadStripes: RoadStripe[];
  frameCount: number;
  trackOffset: number;
  gameOver: boolean;
  shakeTimer: number;
  shakeIntensity: number;
}
