// Ember Court — deterministic screenshot states. ?shot=start|play|win|loss
// renders a fixed, readable scene of the real game code (same renderer, same
// cards) so the screenshots are honest renders, never composites.
import { makeCreature, makeHandCard } from './cards.js';
import { newGame } from './state.js';

function setHand(side, ids) { side.hand = ids.map((id) => makeHandCard(id)); }
function setBoard(side, lanes) {
  side.board = lanes.map((id) => (id ? makeCreature(id) : null));
}

export function makeShotState(shot) {
  const state = newGame(4242);
  if (shot === 'start') {
    state.phase = 'title';
    return state;
  }
  // A mid-game table: both sides developed, hands full, mana spent and open.
  state.phase = 'play';
  state.turn = 6;
  state.you.life = 17; state.you.mana = 5; state.you.maxMana = 6;
  state.foe.life = 19; state.foe.mana = 2; state.foe.maxMana = 6;
  setBoard(state.foe, ['frost-wolf', null, 'stone-golem']);
  setBoard(state.you, ['ember-knight', 'thorn-sprout', null]);
  state.you.board[0].atk = 4; // kindled once
  state.foe.board[0].frozen = false;
  setHand(state.you, ['cinder-drake', 'fireball', 'frost-nova', 'thorn-dryad', 'ember-surge', 'ash-hawk']);
  setHand(state.foe, ['fireball', 'stone-golem', 'frost-wisp']);
  state.log = ['The Warden plays Frost Wolf in lane 1.', 'Your Ember Knight kindles to 4 attack.'];
  if (shot === 'win') {
    state.phase = 'won';
    state.turn = 9;
    state.foe.life = 0;
    state.you.life = 11;
    state.stats.turnsTaken = 9;
    state.stats.played = 14;
    state.log = ['Cinder Drake roars — the Warden falls.', 'The Warden falls. The Court is yours!'];
    return state;
  }
  if (shot === 'loss') {
    state.phase = 'lost';
    state.turn = 11;
    state.you.life = 0;
    state.foe.life = 8;
    state.stats.turnsTaken = 11;
    state.stats.played = 16;
    state.log = ['Avalanche Titan crashes through lane 3.', 'Your hero falls. The embers fade.'];
    return state;
  }
  return state; // 'play'
}
