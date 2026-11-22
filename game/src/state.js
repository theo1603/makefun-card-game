// Ember Court — game state and turn engine. Pure rules, no drawing here.
// A duel: 3 lanes, one creature per side per lane. At the end of a side's
// turn its creatures attack: lane-vs-lane, or the enemy hero when the lane
// is empty. Reduce the enemy hero to 0 life to win.
import { buildDeck, makeCreature, makeHandCard, mulberry32 } from './cards.js';
import { MAX_HAND, MAX_MANA, START_LIFE } from './config.js';

export function newSide(rng, seedOffset) {
  return {
    life: START_LIFE, maxLife: START_LIFE,
    mana: 1, maxMana: 1,
    deck: buildDeck(mulberry32(rng() * 0xffffffff + seedOffset)),
    hand: [], board: [null, null, null],
    fatigue: 0, emberPlayed: 0,
  };
}

export function newGame(seed = 20261122) {
  const rng = mulberry32(seed);
  const state = {
    seed, rng,
    turn: 1,
    phase: 'title', // title | play | ai | won | lost
    you: newSide(rng, 7),
    foe: newSide(rng, 99),
    log: ['Welcome to Ember Court. Outlast the Warden.'],
    selected: null, // uid of selected hand card
    message: '',
    stats: { played: 0, turnsTaken: 0 },
    floaters: [], // {x, y, text, color, born, life}
    shake: 0,
  };
  drawCards(state, state.you, 3);
  drawCards(state, state.foe, 3);
  return state;
}

export function drawCards(state, side, n) {
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= MAX_HAND) {
      if (side.deck.length) { side.deck.pop(); state.log.push('Hand full — a card is discarded.'); }
      continue;
    }
    const id = side.deck.pop();
    if (!id) {
      side.fatigue += 1;
      side.life -= side.fatigue;
      state.log.push(`The deck is empty — fatigue deals ${side.fatigue} damage.`);
      continue;
    }
    side.hand.push(makeHandCard(id));
  }
}

export function startTurn(state, side) {
  side.maxMana = Math.min(MAX_MANA, side.maxMana + 1);
  side.mana = side.maxMana;
  side.emberPlayed = 0;
  drawCards(state, side, 1);
  for (const c of side.board) if (c) c.bornTurn = state.turn;
}

export function other(state, side) {
  return side === state.you ? state.foe : state.you;
}

function log(state, text) {
  state.log.push(text);
  if (state.log.length > 4) state.log.shift();
}

export function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color, born: Date.now(), life: 1100 });
}

function damageCreature(state, side, lane, amount, source) {
  const c = side.board[lane];
  if (!c) return false;
  c.hp -= amount;
  if (c.hp <= 0) {
    side.board[lane] = null;
    log(state, `${c.name} is destroyed (${source}).`);
  }
  return true;
}

function damageHero(state, side, amount, x, y) {
  side.life -= amount;
  state.shake = 10;
  if (x !== undefined) addFloater(state, x, y, `-${amount}`, '#ff5a4e');
  if (side.life <= 0) {
    side.life = 0;
    state.phase = side === state.foe ? 'won' : 'lost';
    log(state, side === state.foe ? 'The Warden falls. The Court is yours!' : 'Your hero falls. The embers fade.');
  }
}

function healHero(state, side, amount) {
  side.life = Math.min(side.maxLife, side.life + amount);
}

function freezeCreature(c) { if (c) c.frozen = true; }

// One creature attacks: lane opponent, or the enemy hero when the lane is empty.
export function resolveAttack(state, attackerSide, lane) {
  const attacker = attackerSide.board[lane];
  if (!attacker) return;
  if (attacker.frozen) {
    attacker.frozen = false;
    log(state, `${attacker.name} thaws out and cannot attack.`);
    return;
  }
  const defenderSide = other(state, attackerSide);
  const defender = defenderSide.board[lane];
  const y = attackerSide === state.you ? 420 : 240;
  if (defender) {
    defender.hp -= attacker.atk;
    attacker.hp -= defender.atk;
    addFloater(state, 640, y, `${attacker.atk} ⚔ ${defender.atk}`, '#ffd76a');
    log(state, `${attacker.name} strikes ${defender.name} for ${attacker.atk}.`);
    if (defender.ability === 'thorns' && attacker.hp > 0) {
      attacker.hp -= 1;
      log(state, `Thorns bite back — ${attacker.name} takes 1.`);
    }
    if (defender.hp <= 0) { defenderSide.board[lane] = null; log(state, `${defender.name} is destroyed.`); }
    if (attacker.hp <= 0) { attackerSide.board[lane] = null; log(state, `${attacker.name} is destroyed.`); }
  } else {
    damageHero(state, defenderSide, attacker.atk, 640, y);
    log(state, `${attacker.name} hits the enemy hero for ${attacker.atk}.`);
  }
}

export function combatPhase(state, side) {
  for (let lane = 0; lane < 3; lane++) {
    if (state.phase === 'won' || state.phase === 'lost') return;
    resolveAttack(state, side, lane);
  }
}

// Kindle: Ember creatures on board grow when their owner plays another Ember card.
function applyKindle(state, side, playedCard) {
  if (playedCard.element !== 'ember') return;
  side.emberPlayed += 1;
  if (side.emberPlayed < 1) return;
  for (const c of side.board) {
    if (!c) continue;
    if (c.ability === 'kindle') { c.atk += 1; }
    if (c.ability === 'kindle-plus') { c.atk += 1; c.hp += 1; c.maxHp += 1; }
  }
}

function onPlayTriggers(state, side, card, lane) {
  const foe = other(state, side);
  const opposite = lane === null ? null : foe.board[lane];
  switch (card.ability) {
    case 'freeze': freezeCreature(opposite); if (opposite) log(state, `${opposite.name} is frozen solid.`); break;
    case 'mend': healHero(state, side, 3); log(state, `${card.name} mends its hero for 3.`); break;
    case 'roar': damageHero(state, foe, 2, 640, 200); log(state, `${card.name} roars — 2 damage to the enemy hero.`); break;
    case 'blizzard':
      for (const c of foe.board) freezeCreature(c);
      log(state, 'A blizzard freezes every enemy creature.');
      break;
    default: break;
  }
  if (card.ability === 'swift' && lane !== null) resolveAttack(state, side, lane);
}

export function playCreature(state, side, handIndex, lane) {
  const card = side.hand[handIndex];
  if (!card || card.type !== 'creature') return false;
  if (side.mana < card.cost) { state.message = 'Not enough mana.'; return false; }
  if (side.board[lane]) { state.message = 'That lane is occupied.'; return false; }
  side.mana -= card.cost;
  side.hand.splice(handIndex, 1);
  const creature = makeCreature(card.id);
  creature.bornTurn = state.turn;
  side.board[lane] = creature;
  state.stats.played += 1;
  applyKindle(state, side, card);
  onPlayTriggers(state, side, card, lane);
  log(state, `${side === state.you ? 'You play' : 'The Warden plays'} ${card.name} in lane ${lane + 1}.`);
  return true;
}

// target: {kind:'hero', side} or {kind:'creature', side, lane}
export function playSpell(state, side, handIndex, target) {
  const card = side.hand[handIndex];
  if (!card || card.type !== 'spell') return false;
  if (side.mana < card.cost) { state.message = 'Not enough mana.'; return false; }
  const foe = other(state, side);
  if (card.ability === 'bolt3') {
    if (!target) { state.message = 'Choose a target: a creature or the enemy hero.'; return false; }
    if (target.kind === 'hero') damageHero(state, target.side, 3, 640, target.side === state.foe ? 90 : 700);
    else damageCreature(state, target.side, target.lane, 3, 'Fireball');
  }
  side.mana -= card.cost;
  side.hand.splice(handIndex, 1);
  state.stats.played += 1;
  applyKindle(state, side, card);
  switch (card.ability) {
    case 'draw2': drawCards(state, side, 2); break;
    case 'freeze-all': for (const c of foe.board) freezeCreature(c); log(state, 'Frost Nova freezes every enemy creature.'); break;
    case 'heal5-draw': healHero(state, side, 5); drawCards(state, side, 1); log(state, 'Verdant Bloom restores 5 life.'); break;
    case 'quake2':
      for (let lane = 0; lane < 3; lane++) damageCreature(state, foe, lane, 2, 'Quake');
      log(state, 'The ground shakes — 2 damage to every enemy creature.');
      break;
    case 'bolt3': log(state, `Fireball deals 3 damage.`); break;
    default: break;
  }
  return true;
}

export function endPlayerTurn(state) {
  if (state.phase !== 'play') return;
  state.phase = 'ai';
  state.selected = null;
  state.stats.turnsTaken += 1;
  combatPhase(state, state.you);
}
