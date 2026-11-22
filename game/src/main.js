// Ember Court — bootstrap and game loop. Wires the title screen, the turn
// engine, the Warden's turns (one action at a time, so you can watch it
// think) and the renderer. Static files only: no network, no build step.
import { combatPhase, endPlayerTurn, newGame, startTurn } from './state.js';
import { chooseAiAction } from './ai.js';
import { draw } from './render.js';
import { attachInput } from './input.js';
import { makeShotState } from './shots.js';
import { sfx } from './audio.js';
import { H, W } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
let state = shot ? makeShotState(shot) : newGame(Number(params.get('seed') ?? 20261122));
state.muted = false;
state.hoverUid = null;

let aiTimer = null;

function clearAi() { if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; } }

function runAiTurn() {
  // The Warden draws, then plays one card at a time, then attacks.
  startTurn(state, state.foe);
  const step = () => {
    if (state.phase !== 'ai') return;
    const action = chooseAiAction(state);
    if (action) {
      action.run();
      sfx.play(state);
      aiTimer = setTimeout(step, 700);
      return;
    }
    combatPhase(state, state.foe);
    sfx.hit(state);
    if (state.phase === 'won' || state.phase === 'lost') { finishEnd(); return; }
    state.turn += 1;
    startTurn(state, state.you);
    state.phase = 'play';
  };
  aiTimer = setTimeout(step, 800);
}

function finishEnd() {
  clearAi();
  if (state.phase === 'won') sfx.win(state);
  if (state.phase === 'lost') sfx.lose(state);
}

const hooks = {
  onGesture() { sfx.unlock(); },
  onSelect() { sfx.select(state); },
  onPlay() { sfx.play(state); },
  startGame() {
    sfx.unlock();
    state.phase = 'play';
    startTurn(state, state.you);
  },
  restart() {
    clearAi();
    // Mutate the same object input.js closed over; never rebind it.
    const fresh = newGame((Date.now() % 100000) + 1);
    for (const key of Object.keys(fresh)) state[key] = fresh[key];
    state.muted = false;
    state.hoverUid = null;
    state.phase = 'play';
    startTurn(state, state.you);
  },
  endTurn() {
    if (state.phase !== 'play') return;
    endPlayerTurn(state);
    if (state.phase === 'won' || state.phase === 'lost') { finishEnd(); return; }
    sfx.hit(state);
    runAiTurn();
  },
};

attachInput(canvas, state, hooks);

function frame() {
  if (state.shake > 0) state.shake = Math.max(0, state.shake - 0.6);
  draw(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
