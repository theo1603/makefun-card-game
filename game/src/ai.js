// Ember Court — the Warden's brain. Readable, counterable heuristics:
// fill empty lanes first, freeze big threats, burn face when lethal is near,
// heal when hurt, and never waste a spell on an empty board.
import { playCreature, playSpell, other } from './state.js';

// Value of a creature card in a lane: base stats, plus lane pressure.
function creatureValue(state, card, lane) {
  const foe = state.foe.board[lane];
  const mine = state.you.board[lane];
  let value = card.atk * 2 + card.hp;
  if (!foe) value += 3; // an open lane hits the hero next turn
  if (mine && mine.atk >= card.hp) value -= 2; // it would die attacking
  if (card.ability === 'freeze' && foe && foe.atk >= 3) value += 3;
  if (card.ability === 'swift') value += 2;
  if (card.ability === 'blizzard' && state.you.board.filter(Boolean).length >= 2) value += 4;
  if (card.ability === 'mend' && state.foe.life <= 12) value += 3;
  if (card.ability === 'roar') value += 2;
  return value;
}

// Pick the single best affordable action right now, or null to pass.
export function chooseAiAction(state) {
  const ai = state.foe;
  const you = state.you;
  let best = null;
  const consider = (value, run) => { if (!best || value > best.value) best = { value, run }; };

  ai.hand.forEach((card, i) => {
    if (card.cost > ai.mana) return;
    if (card.type === 'creature') {
      for (let lane = 0; lane < 3; lane++) {
        if (ai.board[lane]) continue;
        const v = creatureValue(state, card, lane) - card.cost;
        consider(v, () => playCreature(state, ai, ai.hand.indexOf(card), lane));
      }
    } else {
      switch (card.ability) {
        case 'bolt3': {
          // Lethal first, else the biggest enemy creature, else face when ahead.
          if (you.life <= 3) consider(20, () => playSpell(state, ai, ai.hand.indexOf(card), { kind: 'hero', side: you }));
          let bigLane = -1, bigAtk = 0;
          you.board.forEach((c, lane) => { if (c && c.atk > bigAtk) { bigAtk = c.atk; bigLane = lane; } });
          if (bigLane >= 0 && bigAtk >= 3) consider(8 + bigAtk, () => playSpell(state, ai, ai.hand.indexOf(card), { kind: 'creature', side: you, lane: bigLane }));
          else if (you.life <= 10) consider(6, () => playSpell(state, ai, ai.hand.indexOf(card), { kind: 'hero', side: you }));
          break;
        }
        case 'freeze-all':
          if (you.board.filter(Boolean).length >= 2) consider(9, () => playSpell(state, ai, ai.hand.indexOf(card), null));
          break;
        case 'heal5-draw':
          if (ai.life <= 14) consider(9, () => playSpell(state, ai, ai.hand.indexOf(card), null));
          else if (ai.hand.length <= 2) consider(4, () => playSpell(state, ai, ai.hand.indexOf(card), null));
          break;
        case 'draw2':
          if (ai.hand.length <= 3) consider(6, () => playSpell(state, ai, ai.hand.indexOf(card), null));
          break;
        case 'quake2': {
          const weak = you.board.filter((c) => c && c.hp <= 2).length;
          if (weak >= 2) consider(6 + weak * 2, () => playSpell(state, ai, ai.hand.indexOf(card), null));
          break;
        }
        default: break;
      }
    }
  });
  return best;
}

export function aiHasPlayable(state) {
  return state.foe.hand.some((c) => c.cost <= state.foe.mana);
}
