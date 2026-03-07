import type {
  GameState,
  Obstacle,
  Boost,
  Particle,
  Difficulty,
} from './types';
import { DIFFICULTY_CONFIG } from './types';

const OBSTACLE_COLORS = ['#ff3366', '#cc33ff', '#33ccff', '#ff9933', '#66ff33', '#ff3333'];

export function createInitialState(canvasWidth: number, canvasHeight: number): GameState {
  const stripes: { y: number }[] = [];
  for (let y = 0; y < canvasHeight; y += 50) {
    stripes.push({ y });
  }

  return {
    playerX: canvasWidth / 2,
    playerY: canvasHeight - 120,
    speed: 3,
    baseSpeed: 3,
    score: 0,
    distance: 0,
    combo: 1,
    comboTimer: 0,
    lives: 3,
    boosted: false,
    boostTimer: 0,
    drifting: false,
    driftDir: 0,
    invincible: false,
    invincibleTimer: 0,
    obstacles: [],
    boosts: [],
    particles: [],
    roadStripes: stripes,
    frameCount: 0,
    trackOffset: 0,
    gameOver: false,
    shakeTimer: 0,
    shakeIntensity: 0,
  };
}

export function updateGame(
  state: GameState,
  tiltX: number,
  touchSteer: number,
  difficulty: Difficulty,
  canvasWidth: number,
  canvasHeight: number
): GameState {
  if (state.gameOver) return state;

  const config = DIFFICULTY_CONFIG[difficulty];
  const next = { ...state };
  next.frameCount++;

  // Combine tilt and touch steering
  const steer = Math.abs(tiltX) > 0.05 ? tiltX : touchSteer;

  // Speed management
  const targetSpeed = config.obstacleSpeed + next.distance / 5000;
  next.baseSpeed = next.baseSpeed + (targetSpeed - next.baseSpeed) * 0.01;
  next.speed = next.boosted ? next.baseSpeed * 1.8 : next.baseSpeed;

  // Track dimensions
  const trackW = canvasWidth * config.trackWidth;
  const trackLeft = (canvasWidth - trackW) / 2;
  const trackRight = trackLeft + trackW;
  const playerHalfW = 22;

  // Steering
  const steerSpeed = 5 + next.speed * 0.5;
  next.playerX += steer * steerSpeed;

  // Clamp to track with crash detection
  const hitLeftWall = next.playerX - playerHalfW < trackLeft;
  const hitRightWall = next.playerX + playerHalfW > trackRight;

  if (hitLeftWall || hitRightWall) {
    // Bounce back slightly
    if (hitLeftWall) next.playerX = trackLeft + playerHalfW + 2;
    if (hitRightWall) next.playerX = trackRight - playerHalfW - 2;

    // Wall scrape - lose speed but not a life
    next.speed *= 0.95;
    next.combo = 1;
    next.comboTimer = 0;
  }

  // Drift detection
  const driftThreshold = 0.4;
  if (Math.abs(steer) > driftThreshold && next.speed > 3) {
    if (!next.drifting) {
      next.drifting = true;
      next.driftDir = steer > 0 ? 1 : -1;
    }
    // Build combo while drifting
    next.comboTimer += 1;
    if (next.comboTimer > 30) {
      next.combo = Math.min(next.combo + 1, 10);
      next.comboTimer = 0;
      // Drift sparks particles
      spawnDriftParticles(next, steer > 0 ? 1 : -1);
    }
  } else {
    next.drifting = false;
    next.driftDir = 0;
    // Decay combo
    if (next.comboTimer > 0) {
      next.comboTimer -= 0.5;
    }
  }

  // Score
  next.distance += next.speed;
  next.score += next.speed * 0.1 * next.combo;

  // Track offset for road animation
  next.trackOffset += next.speed * 3;

  // Boost timer
  if (next.boosted) {
    next.boostTimer--;
    if (next.boostTimer <= 0) {
      next.boosted = false;
    }
  }

  // Invincibility timer
  if (next.invincible) {
    next.invincibleTimer--;
    if (next.invincibleTimer <= 0) {
      next.invincible = false;
    }
  }

  // Shake timer
  if (next.shakeTimer > 0) {
    next.shakeTimer--;
  }

  // Spawn obstacles
  if (next.frameCount % config.spawnRate === 0) {
    const lanes = 3;
    const laneW = trackW / lanes;
    const lane = Math.floor(Math.random() * lanes);
    const obsX = trackLeft + laneW * lane + laneW / 2;
    const isBarrier = Math.random() < 0.25;

    const obs: Obstacle = {
      x: obsX,
      y: -80,
      width: isBarrier ? laneW * 0.8 : 36,
      height: isBarrier ? 20 : 60,
      type: isBarrier ? 'barrier' : 'car',
      color: OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)],
      lane,
    };
    next.obstacles = [...next.obstacles, obs];
  }

  // Spawn boosts (less frequent)
  if (next.frameCount % (config.spawnRate * 3) === 0) {
    const lanes = 3;
    const laneW = trackW / lanes;
    const lane = Math.floor(Math.random() * lanes);
    const bx = trackLeft + laneW * lane + laneW / 2;

    const boost: Boost = {
      x: bx,
      y: -30,
      radius: 15,
      active: true,
    };
    next.boosts = [...next.boosts, boost];
  }

  // Update obstacles
  next.obstacles = next.obstacles
    .map(obs => ({ ...obs, y: obs.y + next.speed * 2.5 }))
    .filter(obs => obs.y < canvasHeight + 100);

  // Update boosts
  next.boosts = next.boosts
    .map(b => ({ ...b, y: b.y + next.speed * 2.5 }))
    .filter(b => b.y < canvasHeight + 50 && b.active);

  // Collision detection - obstacles
  if (!next.invincible) {
    const playerTop = next.playerY - 35;
    const playerBottom = next.playerY + 35;
    const playerLeft = next.playerX - playerHalfW;
    const playerRight = next.playerX + playerHalfW;

    for (const obs of next.obstacles) {
      const obsTop = obs.y - obs.height / 2;
      const obsBottom = obs.y + obs.height / 2;
      const obsLeft = obs.x - obs.width / 2;
      const obsRight = obs.x + obs.width / 2;

      if (
        playerRight > obsLeft + 4 &&
        playerLeft < obsRight - 4 &&
        playerBottom > obsTop + 4 &&
        playerTop < obsBottom - 4
      ) {
        // Crash!
        next.lives--;
        next.combo = 1;
        next.comboTimer = 0;
        next.invincible = true;
        next.invincibleTimer = 90; // 1.5 seconds
        next.shakeTimer = 20;
        next.shakeIntensity = 8;
        next.speed = next.baseSpeed * 0.5;

        // Crash explosion particles
        spawnCrashParticles(next, obs.x, obs.y);

        // Remove the obstacle we hit
        next.obstacles = next.obstacles.filter(o => o !== obs);

        if (next.lives <= 0) {
          next.gameOver = true;
        }
        break;
      }
    }
  }

  // Collision detection - boosts
  for (let i = 0; i < next.boosts.length; i++) {
    const b = next.boosts[i];
    if (!b.active) continue;
    const dx = next.playerX - b.x;
    const dy = next.playerY - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < b.radius + 25) {
      next.boosted = true;
      next.boostTimer = 120; // 2 seconds
      next.boosts = next.boosts.map((boost, j) =>
        j === i ? { ...boost, active: false } : boost
      );
      // Boost pickup particles
      spawnBoostParticles(next, b.x, b.y);
      next.score += 50 * next.combo;
    }
  }

  // Update particles
  next.particles = next.particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      life: p.life - 1,
    }))
    .filter(p => p.life > 0);

  // Update road stripes
  next.roadStripes = next.roadStripes.map(s => {
    let ny = s.y + next.speed * 3;
    if (ny > canvasHeight + 10) ny -= canvasHeight + 60;
    return { y: ny };
  });

  return next;
}

function spawnCrashParticles(state: GameState, x: number, y: number) {
  const colors = ['#ff6600', '#ffcc00', '#ff0066', '#ff3333', '#ffffff'];
  const newParticles: Particle[] = [];
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 6;
    newParticles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 30 + Math.random() * 30,
      maxLife: 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 5,
    });
  }
  state.particles = [...state.particles, ...newParticles];
}

function spawnDriftParticles(state: GameState, dir: number) {
  const colors = ['#ffff00', '#ffaa00', '#ff6600'];
  const newParticles: Particle[] = [];
  for (let i = 0; i < 5; i++) {
    newParticles.push({
      x: state.playerX + (dir > 0 ? -20 : 20),
      y: state.playerY + 30 + Math.random() * 10,
      vx: -dir * (1 + Math.random() * 2),
      vy: 1 + Math.random() * 2,
      life: 15 + Math.random() * 15,
      maxLife: 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 3,
    });
  }
  state.particles = [...state.particles, ...newParticles];
}

function spawnBoostParticles(state: GameState, x: number, y: number) {
  const colors = ['#00ffff', '#66ffff', '#00ccff', '#ffffff'];
  const newParticles: Particle[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 1 + Math.random() * 4;
    newParticles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 20 + Math.random() * 20,
      maxLife: 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 4,
    });
  }
  state.particles = [...state.particles, ...newParticles];
}
