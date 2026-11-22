// Ember Court — tiny WebAudio synth. No audio files: every sound is a few
// oscillators, created only after the player's first gesture.
let ctx = null;

function audio() {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  try {
    if (!ctx) ctx = new window.AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(ac, freq, at, dur, type, gain) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + at);
  g.gain.setValueAtTime(0.0001, ac.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + at);
  osc.stop(ac.currentTime + at + dur + 0.05);
}

export const sfx = {
  unlock() { audio(); },
  play(state) {
    if (state.muted) return;
    const ac = audio(); if (!ac) return;
    tone(ac, 520, 0, 0.12, 'triangle', 0.12);
    tone(ac, 780, 0.06, 0.14, 'triangle', 0.10);
  },
  select(state) {
    if (state.muted) return;
    const ac = audio(); if (!ac) return;
    tone(ac, 660, 0, 0.06, 'sine', 0.08);
  },
  hit(state) {
    if (state.muted) return;
    const ac = audio(); if (!ac) return;
    tone(ac, 180, 0, 0.16, 'sawtooth', 0.10);
    tone(ac, 90, 0.02, 0.2, 'square', 0.07);
  },
  win(state) {
    if (state.muted) return;
    const ac = audio(); if (!ac) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, i * 0.12, 0.3, 'triangle', 0.12));
  },
  lose(state) {
    if (state.muted) return;
    const ac = audio(); if (!ac) return;
    [392, 330, 262, 196].forEach((f, i) => tone(ac, f, i * 0.14, 0.3, 'sine', 0.10));
  },
};
