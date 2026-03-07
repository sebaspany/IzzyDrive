// Synthesize Happy Birthday melody using Web Audio API
// No external audio files needed!

let audioCtx: AudioContext | null = null;
let birthdayTimeout: ReturnType<typeof setTimeout> | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Happy Birthday melody notes (frequency, duration in beats)
const HAPPY_BIRTHDAY_NOTES: [number, number][] = [
  // "Hap-py birth-day to you"
  [262, 0.75], [262, 0.25], [294, 1], [262, 1], [349, 1], [330, 2],
  // "Hap-py birth-day to you"
  [262, 0.75], [262, 0.25], [294, 1], [262, 1], [392, 1], [349, 2],
  // "Hap-py birth-day dear Ethan"
  [262, 0.75], [262, 0.25], [523, 1], [440, 1], [349, 1], [330, 1], [294, 1],
  // "Hap-py birth-day to you"
  [466, 0.75], [466, 0.25], [440, 1], [349, 1], [392, 1], [349, 2],
];

export function playHappyBirthday(onComplete?: () => void) {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const tempo = 0.35; // seconds per beat
  let time = ctx.currentTime + 0.1;
  let totalDuration = 0;

  for (const [freq, beats] of HAPPY_BIRTHDAY_NOTES) {
    const duration = beats * tempo;
    const noteEnd = duration * 0.85;

    // Main oscillator (square wave for chiptune feel)
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    // Secondary oscillator for richness
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq;

    // Gain envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
    gain.gain.setValueAtTime(0.12, time + noteEnd * 0.7);
    gain.gain.linearRampToValueAtTime(0, time + noteEnd);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(0.06, time + 0.02);
    gain2.gain.setValueAtTime(0.06, time + noteEnd * 0.7);
    gain2.gain.linearRampToValueAtTime(0, time + noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + noteEnd);
    osc2.start(time);
    osc2.stop(time + noteEnd);

    time += duration;
    totalDuration += duration;
  }

  // Call onComplete when done
  if (onComplete) {
    birthdayTimeout = setTimeout(onComplete, totalDuration * 1000 + 500);
  }
}

export function stopBirthdayMusic() {
  if (birthdayTimeout) {
    clearTimeout(birthdayTimeout);
    birthdayTimeout = null;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

// Simple beep for game events
export function playBeep(freq: number = 440, duration: number = 0.1, volume: number = 0.1) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available, silently fail
  }
}

export function playBoostSound() {
  playBeep(880, 0.15, 0.08);
  setTimeout(() => playBeep(1100, 0.1, 0.06), 80);
}

export function playCrashSound() {
  playBeep(150, 0.3, 0.12);
  setTimeout(() => playBeep(100, 0.2, 0.08), 100);
}

export function playDriftSound() {
  playBeep(660, 0.05, 0.04);
}

export function playComboSound(combo: number) {
  playBeep(440 + combo * 60, 0.1, 0.06);
}
