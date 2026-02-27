// Sound system for PickerWheelApp
// Uses Web Audio API for tick sounds (generated) and HTML Audio for celebration

const SETTINGS_KEY = 'pickerWheelSoundSettings';

export interface SoundSettings {
  enabled: boolean;
  tickEnabled: boolean;
  celebrationEnabled: boolean;
  volume: number; // 0-1
}

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  tickEnabled: true,
  celebrationEnabled: true,
  volume: 0.5,
};

export function getSoundSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* use defaults */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSoundSettings(settings: SoundSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Lazy AudioContext (created on first user interaction to satisfy browser autoplay policy)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Tick sound — short click generated via Web Audio API oscillator
// Sounds like a flapper hitting a peg
export function playTick(): void {
  const settings = getSoundSettings();
  if (!settings.enabled || !settings.tickEnabled) return;

  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Short percussive click — triangle wave with attack ramp to avoid pop
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);

  // Start at near-zero and ramp up over 3ms to prevent discontinuity pop
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(settings.volume * 0.3, ctx.currentTime + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

// Celebration sound — short fanfare/chime
export function playCelebration(): void {
  const settings = getSoundSettings();
  if (!settings.enabled || !settings.celebrationEnabled) return;

  const ctx = getAudioContext();
  const vol = settings.volume * 0.25;

  // Three-note ascending chime
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = freq;

    const start = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

    osc.start(start);
    osc.stop(start + 0.5);
  });
}
