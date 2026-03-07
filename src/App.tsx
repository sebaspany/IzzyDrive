import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDeviceTilt } from './hooks/useDeviceTilt';
import type { CarType, Difficulty, GameScreen } from './game/types';
import { CAR_DATA, DIFFICULTY_CONFIG } from './game/types';
import { createInitialState, updateGame } from './game/engine';
import {
  drawRoad,
  drawPlayerCar,
  drawObstacle,
  drawBoost,
  drawParticle,
  drawHUD,
} from './game/renderer';
import {
  playHappyBirthday,
  stopBirthdayMusic,
  playBoostSound,
  playCrashSound,
  playComboSound,
} from './game/audio';
import './App.css';

function App() {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [selectedCar, setSelectedCar] = useState<CarType>('bugatti');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [finalScore, setFinalScore] = useState(0);
  const [showRaceAgain, setShowRaceAgain] = useState(false);
  const [musicDone, setMusicDone] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef(createInitialState(0, 0));
  const animFrameRef = useRef<number>(0);
  const touchSteerRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const keySteerRef = useRef(0);
  const lastComboRef = useRef(1);
  const lastBoostedRef = useRef(false);
  const lastLivesRef = useRef(3);
  const tiltXRef = useRef(0);

  const { tiltX, requestPermission, isSupported } = useDeviceTilt();

  // Keep tiltX in a ref so the game loop reads it without re-initializing
  useEffect(() => {
    tiltXRef.current = tiltX;
  }, [tiltX]);

  // ============ START SCREEN ============
  const handleStartRace = useCallback(async () => {
    if (isSupported) {
      await requestPermission();
    }
    stopBirthdayMusic();
    setShowRaceAgain(false);
    setMusicDone(false);
    setScreen('playing');
  }, [isSupported, requestPermission]);

  // ============ GAME LOOP ============
  useEffect(() => {
    if (screen !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to window
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    };
    resize();

    const w = window.innerWidth;
    const h = window.innerHeight;

    gameStateRef.current = createInitialState(w, h);
    lastComboRef.current = 1;
    lastBoostedRef.current = false;
    lastLivesRef.current = 3;

    // Touch controls
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartXRef.current = touch.clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchStartXRef.current === null) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartXRef.current;
      // Normalize to -1..+1 based on screen width
      touchSteerRef.current = Math.max(-1, Math.min(1, dx / (w * 0.15)));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      touchStartXRef.current = null;
      touchSteerRef.current = 0;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Keyboard controls for desktop testing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keySteerRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') keySteerRef.current = 1;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        keySteerRef.current = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    window.addEventListener('resize', resize);

    const loop = () => {
      const state = gameStateRef.current;

      // Combine tilt, touch, and keyboard steering
      const steerInput = Math.abs(tiltXRef.current) > 0.05
        ? tiltXRef.current
        : (Math.abs(touchSteerRef.current) > 0.05 ? touchSteerRef.current : keySteerRef.current);

      // Update
      gameStateRef.current = updateGame(
        state,
        steerInput,
        0, // touchSteer already merged above
        difficulty,
        w,
        h
      );

      const gs = gameStateRef.current;

      // Sound effects
      if (gs.combo > lastComboRef.current && gs.combo > 1) {
        playComboSound(gs.combo);
      }
      lastComboRef.current = gs.combo;

      if (gs.boosted && !lastBoostedRef.current) {
        playBoostSound();
      }
      lastBoostedRef.current = gs.boosted;

      if (gs.lives < lastLivesRef.current) {
        playCrashSound();
      }
      lastLivesRef.current = gs.lives;

      // Draw
      const cw = w;
      const ch = h;
      const trackW = cw * DIFFICULTY_CONFIG[difficulty].trackWidth;

      ctx.save();

      // Screen shake
      if (gs.shakeTimer > 0) {
        const sx = (Math.random() - 0.5) * gs.shakeIntensity;
        const sy = (Math.random() - 0.5) * gs.shakeIntensity;
        ctx.translate(sx, sy);
      }

      // Clear
      ctx.clearRect(-10, -10, cw + 20, ch + 20);

      // Road
      drawRoad(ctx, cw, ch, trackW, gs.roadStripes, gs.trackOffset);

      // Obstacles
      for (const obs of gs.obstacles) {
        drawObstacle(ctx, obs);
      }

      // Boosts
      for (const boost of gs.boosts) {
        drawBoost(ctx, boost, gs.frameCount);
      }

      // Player car
      drawPlayerCar(
        ctx,
        gs.playerX,
        gs.playerY,
        selectedCar,
        gs.drifting,
        gs.driftDir,
        gs.boosted,
        gs.invincible
      );

      // Particles
      for (const p of gs.particles) {
        drawParticle(ctx, p);
      }

      // HUD
      drawHUD(ctx, cw, gs.score, gs.lives, gs.combo, gs.speed, gs.boosted, gs.drifting);

      ctx.restore();

      // Game over check
      if (gs.gameOver) {
        setFinalScore(Math.floor(gs.score));
        // Short delay then show celebration
        setTimeout(() => {
          setScreen('celebration');
        }, 800);
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', resize);
    };
  }, [screen, difficulty, selectedCar]);

  // ============ CELEBRATION SCREEN ============
  useEffect(() => {
    if (screen !== 'celebration') return;

    // Play happy birthday music
    playHappyBirthday(() => {
      setMusicDone(true);
    });

    // Show race again button after 3 seconds
    const timer = setTimeout(() => {
      setShowRaceAgain(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      stopBirthdayMusic();
    };
  }, [screen]);

  // ============ RENDER ============
  if (screen === 'start') {
    return <StartScreen
      selectedCar={selectedCar}
      setSelectedCar={setSelectedCar}
      difficulty={difficulty}
      setDifficulty={setDifficulty}
      onStart={handleStartRace}
      isSupported={isSupported}
    />;
  }

  if (screen === 'playing') {
    return (
      <div className="game-container">
        <canvas ref={canvasRef} className="game-canvas" />
      </div>
    );
  }

  if (screen === 'celebration') {
    return <CelebrationScreen
      score={finalScore}
      showRaceAgain={showRaceAgain}
      musicDone={musicDone}
      onRaceAgain={() => {
        stopBirthdayMusic();
        setScreen('start');
      }}
    />;
  }

  return null;
}

// ============ START SCREEN COMPONENT ============
function StartScreen({
  selectedCar,
  setSelectedCar,
  difficulty,
  setDifficulty,
  onStart,
  isSupported,
}: {
  selectedCar: CarType;
  setSelectedCar: (c: CarType) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  isSupported: boolean;
}) {
  const particleStyles = useMemo(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      left: `${(i * 5 + (i * 37 % 100)) % 100}%`,
      animationDelay: `${(i * 1.7) % 5}s`,
      animationDuration: `${3 + (i * 1.3) % 4}s`,
      backgroundColor: ['#ff0066', '#00ffcc', '#ffcc00', '#ff6600', '#00ccff'][i % 5],
    })),
  []);

  return (
    <div className="start-screen">
      <div className="start-bg-particles">
        {particleStyles.map((style, i) => (
          <div
            key={i}
            className="bg-particle"
            style={style}
          />
        ))}
      </div>

      <div className="start-content">
        <h1 className="game-title">
          <span className="title-ethans">Ethans</span>
          <span className="title-race">Race</span>
          <span className="title-blast">Blast</span>
        </h1>
        <p className="game-subtitle">
          Ethan's Epic Supercar Birthday Race Party – Go Fast, Have Fun!
        </p>

        <div className="car-selection">
          <h2 className="section-title">Choose Your Ride</h2>
          <div className="car-grid">
            {(Object.keys(CAR_DATA) as CarType[]).map(carKey => {
              const car = CAR_DATA[carKey];
              return (
                <button
                  key={carKey}
                  className={`car-card ${selectedCar === carKey ? 'selected' : ''}`}
                  onClick={() => setSelectedCar(carKey)}
                  style={{
                    borderColor: selectedCar === carKey ? car.neon : 'transparent',
                    boxShadow: selectedCar === carKey ? `0 0 20px ${car.neon}40` : 'none',
                  }}
                >
                  <CarThumbnail carType={carKey} size={70} />
                  <span className="car-name">{car.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="difficulty-selection">
          <h2 className="section-title">Difficulty</h2>
          <div className="difficulty-grid">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(diff => (
              <button
                key={diff}
                className={`diff-btn ${difficulty === diff ? 'selected' : ''}`}
                onClick={() => setDifficulty(diff)}
              >
                {DIFFICULTY_CONFIG[diff].label}
              </button>
            ))}
          </div>
        </div>

        {isSupported && (
          <p className="tilt-hint">Tilt your phone to steer!</p>
        )}

        <button className="race-button" onClick={onStart}>
          <span className="race-button-text">Race Party!</span>
          <span className="race-button-glow" />
        </button>
      </div>
    </div>
  );
}

// ============ CAR THUMBNAIL (SVG) ============
function CarThumbnail({ carType, size }: { carType: CarType; size: number }) {
  const colors = CAR_DATA[carType];
  const w = size * 0.55;
  const h = size;

  if (carType === 'cybertruck') {
    return (
      <svg width={w} height={h} viewBox="-25 -40 50 80" className="car-thumb-svg">
        <defs>
          <filter id={`glow-${carType}`}>
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#glow-${carType})`}>
          <polygon
            points="-22,35 -22,-20 -14,-35 14,-35 22,-20 22,35"
            fill={colors.body}
            stroke={colors.neon}
            strokeWidth="1.5"
          />
          <polygon
            points="-18,-18 18,-18 14,-30 -14,-30"
            fill="#99eeff"
            opacity="0.8"
          />
          <rect x="-20" y="-33" width="40" height="3" fill={colors.neon} />
          <rect x="-20" y="30" width="40" height="3" fill="#ff4444" />
        </g>
      </svg>
    );
  }

  if (carType === 'lambo') {
    return (
      <svg width={w} height={h} viewBox="-25 -42 50 84" className="car-thumb-svg">
        <defs>
          <filter id={`glow-${carType}`}>
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#glow-${carType})`}>
          <polygon
            points="-18,35 -20,15 -15,-30 0,-40 15,-30 20,15 18,35"
            fill={colors.body}
            stroke={colors.neon}
            strokeWidth="1.5"
          />
          <polygon
            points="-13,-5 0,-18 13,-5 11,8 -11,8"
            fill="#88ddff"
            opacity="0.8"
          />
          <rect x="-18" y="8" width="5" height="12" fill={colors.accent} />
          <rect x="13" y="8" width="5" height="12" fill={colors.accent} />
          <polygon points="-12,-28 -6,-28 -8,-22" fill="#ffffcc" />
          <polygon points="12,-28 6,-28 8,-22" fill="#ffffcc" />
        </g>
      </svg>
    );
  }

  // Bugatti
  return (
    <svg width={w} height={h} viewBox="-25 -40 50 80" className="car-thumb-svg">
      <defs>
        <filter id={`glow-${carType}`}>
          <feGaussianBlur stdDeviation="3" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#glow-${carType})`}>
        <path
          d="M-14,35 L-18,20 L-15,-25 Q0,-38 15,-25 L18,20 L14,35 Z"
          fill={colors.body}
          stroke={colors.neon}
          strokeWidth="1.5"
        />
        <path
          d="M-12,-5 Q0,-18 12,-5 L10,5 Q0,-2 -10,5 Z"
          fill="#66ccff"
          opacity="0.8"
        />
        <rect x="-2" y="-30" width="4" height="60" fill={colors.accent} opacity="0.6" />
        <circle cx="-10" cy="-22" r="3.5" fill="#ffffaa" />
        <circle cx="10" cy="-22" r="3.5" fill="#ffffaa" />
        <rect x="-13" y="28" width="7" height="3" fill="#ff3333" />
        <rect x="6" y="28" width="7" height="3" fill="#ff3333" />
      </g>
    </svg>
  );
}

// ============ CELEBRATION SCREEN ============
function CelebrationScreen({
  score,
  showRaceAgain,
  musicDone,
  onRaceAgain,
}: {
  score: number;
  showRaceAgain: boolean;
  musicDone: boolean;
  onRaceAgain: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Balloons and confetti
    interface BalloonObj {
      x: number;
      y: number;
      r: number;
      color: string;
      speed: number;
      wobble: number;
      wobbleSpeed: number;
    }

    interface ConfettiObj {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rot: number;
      rotSpeed: number;
    }

    const balloons: BalloonObj[] = [];
    const confetti: ConfettiObj[] = [];

    const balloonColors = [
      '#ff3366', '#33ccff', '#ffcc00', '#ff6600', '#66ff33',
      '#cc33ff', '#ff9999', '#00ffcc', '#ff0099', '#3399ff',
    ];

    // Create balloons
    for (let i = 0; i < 25; i++) {
      balloons.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 50 + Math.random() * 300,
        r: 18 + Math.random() * 18,
        color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
        speed: 0.8 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.03,
      });
    }

    // Create confetti
    const confettiColors = ['#ff0066', '#00ccff', '#ffcc00', '#ff6600', '#66ff33', '#cc33ff', '#ffffff'];
    for (let i = 0; i < 80; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        w: 4 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
      });
    }

    let running = true;

    const animate = () => {
      if (!running) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw confetti
      for (const c of confetti) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();

        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.rotSpeed;

        if (c.y > canvas.height + 20) {
          c.y = -20;
          c.x = Math.random() * canvas.width;
        }
      }

      // Draw balloons
      for (const b of balloons) {
        b.y -= b.speed;
        b.wobble += b.wobbleSpeed;
        const bx = b.x + Math.sin(b.wobble) * 15;

        // String
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, b.y + b.r);
        ctx.quadraticCurveTo(bx + 5, b.y + b.r + 20, bx - 3, b.y + b.r + 40);
        ctx.stroke();

        // Balloon body
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(bx, b.y, b.r * 0.85, b.r, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(bx - b.r * 0.25, b.y - b.r * 0.3, b.r * 0.2, b.r * 0.3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Knot
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(bx - 3, b.y + b.r);
        ctx.lineTo(bx + 3, b.y + b.r);
        ctx.lineTo(bx, b.y + b.r + 6);
        ctx.closePath();
        ctx.fill();

        // Reset if off screen
        if (b.y < -b.r - 50) {
          b.y = canvas.height + 50 + Math.random() * 100;
          b.x = Math.random() * canvas.width;
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
    };
  }, []);

  return (
    <div className="celebration-screen">
      <canvas ref={canvasRef} className="celebration-canvas" />
      <div className="celebration-content">
        <div className="celebration-emoji">🎉🏎️🎂</div>
        <h1 className="celebration-title">Happy 8th Birthday!</h1>
        <div className="celebration-score">
          <span className="score-label">Final Score</span>
          <span className="score-value">{score.toLocaleString()}</span>
        </div>
        <p className="celebration-message">
          Thanks for playing the game. - Ethan
        </p>
        {musicDone && !showRaceAgain && (
          <p className="music-note">Happy Birthday!</p>
        )}
        {showRaceAgain && (
          <button className="race-again-button" onClick={onRaceAgain}>
            Race Again!
          </button>
        )}
      </div>
    </div>
  );
}

export default App
