// Tiny WebAudio sound effects — short oscillator blips, no audio files.
// Everything is wrapped so a browser without audio (or a headless shot)
// never breaks the game.
let ctx = null;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

function blip(freq, dur, type, vol, slideTo) {
  const ac = audio();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.08, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch {
    // sound is garnish; a failure here must never stop the game
  }
}

export const sfx = {
  pickup() {
    blip(880, 0.09, 'sine', 0.07, 1320);
  },
  coin() {
    blip(1320, 0.07, 'triangle', 0.06, 1760);
  },
  smoke() {
    blip(220, 0.25, 'sawtooth', 0.05, 110);
  },
  emp() {
    blip(1800, 0.3, 'square', 0.04, 220);
  },
  spotted() {
    blip(330, 0.22, 'sawtooth', 0.09, 495);
  },
  alarm() {
    blip(660, 0.35, 'square', 0.06, 440);
  },
  caught() {
    blip(196, 0.5, 'sawtooth', 0.1, 98);
  },
  vault() {
    blip(523, 0.12, 'sine', 0.08);
    setTimeout(() => blip(784, 0.16, 'sine', 0.08), 110);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'sine', 0.08), i * 130));
  },
};
