// Ember Court — mouse and keyboard input. Clicks resolve against the exact
// rectangles render.js publishes in computeLayout; nothing is hit-tested twice.
import { computeLayout } from './render.js';
import { endPlayerTurn, playCreature, playSpell } from './state.js';

function inside(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function attachInput(canvas, state, hooks) {
  const layout = () => computeLayout(state);

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function selectedCard() {
    return state.you.hand.find((c) => c.uid === state.selected) ?? null;
  }

  function clickHeroOrBoard(p, side) {
    const l = layout();
    // Enemy/own hero portrait.
    const hero = side === state.foe ? l.foeHero : l.youHero;
    if (inside(p.x, p.y, hero)) return { kind: 'hero', side };
    for (const lane of l.lanes) {
      const r = side === state.foe ? lane.foe : lane.you;
      if (inside(p.x, p.y, r) && side.board[lane.lane]) {
        return { kind: 'creature', side, lane: lane.lane };
      }
    }
    return null;
  }

  function handleClick(p) {
    hooks.onGesture();
    const l = layout();
    if (inside(p.x, p.y, l.mute)) { state.muted = !state.muted; return; }
    if (state.phase === 'title') {
      if (inside(p.x, p.y, l.playButton)) hooks.startGame();
      return;
    }
    if (state.phase === 'won' || state.phase === 'lost') {
      if (inside(p.x, p.y, l.againButton)) hooks.restart();
      return;
    }
    if (state.phase !== 'play') return;
    if (inside(p.x, p.y, l.endTurn)) { hooks.endTurn(); return; }
    const card = selectedCard();
    if (card) {
      // A card is selected: a lane click plays a creature, a target click casts a spell.
      if (card.type === 'creature') {
        for (const lane of l.lanes) {
          if (inside(p.x, p.y, lane.you)) {
            const idx = state.you.hand.findIndex((c) => c.uid === card.uid);
            if (playCreature(state, state.you, idx, lane.lane)) {
              state.selected = null; state.message = '';
              hooks.onPlay();
            }
            return;
          }
        }
      } else if (card.target === 'any-enemy') {
        const target = clickHeroOrBoard(p, state.foe);
        if (target) {
          const idx = state.you.hand.findIndex((c) => c.uid === card.uid);
          if (playSpell(state, state.you, idx, target)) {
            state.selected = null; state.message = '';
            hooks.onPlay();
          }
          return;
        }
      } else {
        const idx = state.you.hand.findIndex((c) => c.uid === card.uid);
        if (playSpell(state, state.you, idx, null)) {
          state.selected = null; state.message = '';
          hooks.onPlay();
        }
        return;
      }
      // Clicked elsewhere with a card selected: cancel, unless it is another hand card.
    }
    // Hand selection (topmost card wins: iterate from the last drawn).
    for (let i = l.hand.length - 1; i >= 0; i--) {
      const slot = l.hand[i];
      if (inside(p.x, p.y, slot)) {
        if (slot.card.cost > state.you.mana) {
          state.message = `${slot.card.name} costs ${slot.card.cost} mana — you have ${state.you.mana}.`;
          state.selected = null;
        } else {
          state.selected = state.selected === slot.card.uid ? null : slot.card.uid;
          state.message = '';
          hooks.onSelect();
        }
        return;
      }
    }
    state.selected = null;
  }

  canvas.addEventListener('pointerdown', (e) => handleClick(canvasPoint(e)));
  canvas.addEventListener('pointermove', (e) => {
    const p = canvasPoint(e);
    const l = layout();
    state.hoverUid = null;
    if (state.phase === 'play' || state.phase === 'ai') {
      for (let i = l.hand.length - 1; i >= 0; i--) {
        if (inside(p.x, p.y, l.hand[i])) { state.hoverUid = l.hand[i].card.uid; break; }
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    if (state.phase === 'title' && (e.key === ' ' || e.key === 'Enter')) { hooks.startGame(); return; }
    if ((state.phase === 'won' || state.phase === 'lost') && (e.key === 'r' || e.key === 'R')) { hooks.restart(); return; }
    if (state.phase !== 'play') return;
    if (e.key === 'Escape') { state.selected = null; state.message = ''; return; }
    if (e.key === 'Enter') { hooks.endTurn(); return; }
    if (e.key >= '1' && e.key <= '7') {
      const idx = Number(e.key) - 1;
      const card = state.you.hand[idx];
      if (card) {
        if (card.cost > state.you.mana) state.message = `${card.name} costs ${card.cost} mana — you have ${state.you.mana}.`;
        else { state.selected = state.selected === card.uid ? null : card.uid; state.message = ''; }
      }
    }
    if (e.key === 'm' || e.key === 'M') state.muted = !state.muted;
  });
}
