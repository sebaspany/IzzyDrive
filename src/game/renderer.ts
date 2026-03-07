import type { CarType, Obstacle, Boost, Particle } from './types';
import { CAR_DATA } from './types';

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  trackWidth: number,
  stripes: { y: number }[],
  trackOffset: number
) {
  // Background grass
  ctx.fillStyle = '#1a472a';
  ctx.fillRect(0, 0, w, h);

  // Road
  const roadLeft = (w - trackWidth) / 2;
  ctx.fillStyle = '#333344';
  ctx.fillRect(roadLeft, 0, trackWidth, h);

  // Road edge lines (neon glow)
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(roadLeft, 0);
  ctx.lineTo(roadLeft, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(roadLeft + trackWidth, 0);
  ctx.lineTo(roadLeft + trackWidth, h);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Dashed center line
  ctx.strokeStyle = '#ffff66';
  ctx.lineWidth = 2;
  ctx.setLineDash([30, 20]);
  ctx.lineDashOffset = -trackOffset;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Road stripes (lane markings)
  const laneWidth = trackWidth / 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([20, 30]);
  ctx.lineDashOffset = -trackOffset;
  for (let i = 1; i < 3; i++) {
    const lx = roadLeft + laneWidth * i;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Extra road texture stripes
  for (const stripe of stripes) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(roadLeft, stripe.y, trackWidth, 4);
  }
}

export function drawPlayerCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  carType: CarType,
  drifting: boolean,
  driftDir: number,
  boosted: boolean,
  invincible: boolean
) {
  const colors = CAR_DATA[carType];
  const carW = 40;
  const carH = 70;

  ctx.save();
  ctx.translate(x, y);

  // Slight rotation when drifting
  if (drifting) {
    ctx.rotate((driftDir * Math.PI) / 12);
  }

  // Invincibility flash
  if (invincible && Math.floor(Date.now() / 100) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // Neon glow underneath
  ctx.shadowColor = boosted ? '#ff00ff' : colors.neon;
  ctx.shadowBlur = boosted ? 30 : 15;

  if (carType === 'cybertruck') {
    drawCybertruck(ctx, carW, carH, colors, boosted);
  } else if (carType === 'lambo') {
    drawLambo(ctx, carW, carH, colors, boosted);
  } else {
    drawBugatti(ctx, carW, carH, colors, boosted);
  }

  ctx.shadowBlur = 0;

  // Boost flame
  if (boosted) {
    drawBoostFlame(ctx, carH);
  }

  // Drift sparks
  if (drifting) {
    drawDriftSparks(ctx, carW, carH, driftDir);
  }

  ctx.restore();
}

function drawBugatti(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: { body: string; accent: string; neon: string },
  boosted: boolean
) {
  // Rounded body
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, h / 2);
  ctx.lineTo(-w / 2, h / 2 - 15);
  ctx.lineTo(-w / 2 + 3, -h / 2 + 10);
  ctx.quadraticCurveTo(0, -h / 2 - 5, w / 2 - 3, -h / 2 + 10);
  ctx.lineTo(w / 2, h / 2 - 15);
  ctx.lineTo(w / 2 - 6, h / 2);
  ctx.closePath();
  ctx.fill();

  // Windshield
  ctx.fillStyle = '#66ccff';
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 8, -5);
  ctx.quadraticCurveTo(0, -18, w / 2 - 8, -5);
  ctx.lineTo(w / 2 - 10, 5);
  ctx.quadraticCurveTo(0, -2, -w / 2 + 10, 5);
  ctx.closePath();
  ctx.fill();

  // Accent stripe
  ctx.fillStyle = colors.accent;
  ctx.fillRect(-2, -h / 2 + 5, 4, h - 10);

  // Headlights
  ctx.fillStyle = boosted ? '#ff00ff' : '#ffffaa';
  ctx.beginPath();
  ctx.arc(-w / 2 + 10, -h / 2 + 15, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w / 2 - 10, -h / 2 + 15, 4, 0, Math.PI * 2);
  ctx.fill();

  // Taillights
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(-w / 2 + 5, h / 2 - 8, 8, 4);
  ctx.fillRect(w / 2 - 13, h / 2 - 8, 8, 4);
}

function drawLambo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: { body: string; accent: string; neon: string },
  boosted: boolean
) {
  // Angular aggressive body
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(-w / 2 - 2, h / 2 - 20);
  ctx.lineTo(-w / 2 + 5, -h / 2 + 5);
  ctx.lineTo(0, -h / 2 - 8);
  ctx.lineTo(w / 2 - 5, -h / 2 + 5);
  ctx.lineTo(w / 2 + 2, h / 2 - 20);
  ctx.lineTo(w / 2, h / 2);
  ctx.closePath();
  ctx.fill();

  // Windshield
  ctx.fillStyle = '#88ddff';
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 7, -3);
  ctx.lineTo(0, -15);
  ctx.lineTo(w / 2 - 7, -3);
  ctx.lineTo(w / 2 - 9, 8);
  ctx.lineTo(-w / 2 + 9, 8);
  ctx.closePath();
  ctx.fill();

  // Side intakes
  ctx.fillStyle = colors.accent;
  ctx.fillRect(-w / 2 + 2, 10, 5, 15);
  ctx.fillRect(w / 2 - 7, 10, 5, 15);

  // Headlights (angular)
  ctx.fillStyle = boosted ? '#ff00ff' : '#ffffcc';
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, -h / 2 + 8);
  ctx.lineTo(-w / 2 + 14, -h / 2 + 8);
  ctx.lineTo(-w / 2 + 10, -h / 2 + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w / 2 - 6, -h / 2 + 8);
  ctx.lineTo(w / 2 - 14, -h / 2 + 8);
  ctx.lineTo(w / 2 - 10, -h / 2 + 14);
  ctx.closePath();
  ctx.fill();

  // Taillights
  ctx.fillStyle = '#ff2200';
  ctx.fillRect(-w / 2 + 3, h / 2 - 6, 10, 3);
  ctx.fillRect(w / 2 - 13, h / 2 - 6, 10, 3);
}

function drawCybertruck(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: { body: string; accent: string; neon: string },
  boosted: boolean
) {
  const cw = w + 8;
  // Angular/boxy body
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.moveTo(-cw / 2, h / 2);
  ctx.lineTo(-cw / 2, -h / 2 + 15);
  ctx.lineTo(-cw / 2 + 8, -h / 2);
  ctx.lineTo(cw / 2 - 8, -h / 2);
  ctx.lineTo(cw / 2, -h / 2 + 15);
  ctx.lineTo(cw / 2, h / 2);
  ctx.closePath();
  ctx.fill();

  // Bed area (darker)
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-cw / 2 + 3, 10, cw - 6, h / 2 - 12);

  // Windshield (angular)
  ctx.fillStyle = '#99eeff';
  ctx.beginPath();
  ctx.moveTo(-cw / 2 + 5, -h / 2 + 18);
  ctx.lineTo(cw / 2 - 5, -h / 2 + 18);
  ctx.lineTo(cw / 2 - 8, -h / 2 + 5);
  ctx.lineTo(-cw / 2 + 8, -h / 2 + 5);
  ctx.closePath();
  ctx.fill();

  // Light bar
  ctx.fillStyle = boosted ? '#ff00ff' : colors.neon;
  ctx.fillRect(-cw / 2 + 3, -h / 2 + 2, cw - 6, 3);

  // Taillights
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(-cw / 2 + 2, h / 2 - 5, cw - 4, 3);
}

function drawBoostFlame(ctx: CanvasRenderingContext2D, carH: number) {
  const flameColors = ['#ff6600', '#ffcc00', '#ff00ff', '#ff3366'];
  for (let i = 0; i < 5; i++) {
    const size = 6 + Math.random() * 8;
    const ox = (Math.random() - 0.5) * 20;
    ctx.fillStyle = flameColors[Math.floor(Math.random() * flameColors.length)];
    ctx.beginPath();
    ctx.arc(ox, carH / 2 + 10 + Math.random() * 15, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDriftSparks(
  ctx: CanvasRenderingContext2D,
  carW: number,
  carH: number,
  driftDir: number
) {
  const sparkX = driftDir > 0 ? -carW / 2 - 3 : carW / 2 + 3;
  ctx.fillStyle = '#ffff00';
  for (let i = 0; i < 4; i++) {
    const sy = carH / 2 - 5 + Math.random() * 10;
    ctx.beginPath();
    ctx.arc(sparkX + (Math.random() - 0.5) * 6, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  ctx.save();
  ctx.translate(obs.x, obs.y);

  if (obs.type === 'car') {
    // Simple enemy car shape
    ctx.fillStyle = obs.color;
    ctx.shadowColor = obs.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-obs.width / 2 + 4, obs.height / 2);
    ctx.lineTo(-obs.width / 2, -obs.height / 2 + 10);
    ctx.quadraticCurveTo(0, -obs.height / 2 - 3, obs.width / 2, -obs.height / 2 + 10);
    ctx.lineTo(obs.width / 2 - 4, obs.height / 2);
    ctx.closePath();
    ctx.fill();

    // Windshield
    ctx.fillStyle = 'rgba(100,200,255,0.6)';
    ctx.fillRect(-obs.width / 2 + 6, -obs.height / 2 + 15, obs.width - 12, 12);

    // Taillights (facing player)
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(-obs.width / 2 + 3, obs.height / 2 - 5, 6, 3);
    ctx.fillRect(obs.width / 2 - 9, obs.height / 2 - 5, 6, 3);
  } else {
    // Barrier
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
    // Warning stripes
    ctx.fillStyle = '#ffff00';
    for (let i = 0; i < obs.width; i += 12) {
      ctx.fillRect(-obs.width / 2 + i, -obs.height / 2, 6, obs.height);
    }
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawBoost(ctx: CanvasRenderingContext2D, boost: Boost, frame: number) {
  if (!boost.active) return;
  ctx.save();
  ctx.translate(boost.x, boost.y);

  // Pulsing glow
  const pulse = 1 + Math.sin(frame * 0.1) * 0.3;
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20 * pulse;

  // Lightning bolt shape
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.moveTo(-6, -boost.radius);
  ctx.lineTo(4, -3);
  ctx.lineTo(-2, 0);
  ctx.lineTo(6, boost.radius);
  ctx.lineTo(-4, 3);
  ctx.lineTo(2, 0);
  ctx.closePath();
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = '#66ffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, boost.radius * pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const alpha = p.life / p.maxLife;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  w: number,
  score: number,
  lives: number,
  combo: number,
  speed: number,
  boosted: boolean,
  drifting: boolean
) {
  const dpr = window.devicePixelRatio || 1;
  const baseSize = Math.min(w / 25, 18);

  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${baseSize * 1.2}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${Math.floor(score)}`, 15, 30 * dpr > 30 ? 35 : 30);

  // Speed
  ctx.fillStyle = boosted ? '#ff00ff' : '#00ff88';
  ctx.font = `bold ${baseSize}px 'Segoe UI', sans-serif`;
  ctx.fillText(`${Math.floor(speed * 20)} mph`, 15, 55);

  // Lives (hearts)
  ctx.font = `${baseSize * 1.3}px sans-serif`;
  ctx.textAlign = 'right';
  let heartsStr = '';
  for (let i = 0; i < 3; i++) {
    heartsStr += i < lives ? '\u2764\uFE0F' : '\uD83D\uDDA4';
  }
  ctx.fillText(heartsStr, w - 15, 32);

  // Combo
  if (combo > 1) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 15;
    ctx.font = `bold ${baseSize * 1.5}px 'Segoe UI', sans-serif`;
    ctx.fillText(`COMBO x${combo}!`, w / 2, 75);
    ctx.shadowBlur = 0;
  }

  // Drift indicator
  if (drifting) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff66cc';
    ctx.shadowColor = '#ff00aa';
    ctx.shadowBlur = 10;
    ctx.font = `bold ${baseSize * 1.1}px 'Segoe UI', sans-serif`;
    ctx.fillText('DRIFT!', w / 2, 100);
    ctx.shadowBlur = 0;
  }

  // Boost indicator
  if (boosted) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.font = `bold ${baseSize}px 'Segoe UI', sans-serif`;
    ctx.fillText('BOOST!', w / 2, 125);
    ctx.shadowBlur = 0;
  }

  // Tilt instruction (small at bottom)
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `${baseSize * 0.7}px sans-serif`;
}

export function drawCrashExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  const maxRadius = 60;
  const radius = maxRadius * progress;
  const alpha = 1 - progress;

  // Multiple colored rings
  const colors = ['#ff6600', '#ffcc00', '#ff0066', '#ff3333'];
  colors.forEach((color, i) => {
    ctx.globalAlpha = alpha * (1 - i * 0.2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4 - i;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, radius * (1 + i * 0.3), 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}
