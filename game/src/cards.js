// Ember Court — the card catalogue. All names, art direction and rules text
// are original to this game. Four elements, each told apart by colour AND
// sigil shape: Ember (flame), Frost (snowflake), Thorn (leaf), Stone (gem).
// Creatures fight lane-vs-lane; spells target a creature or a hero.
export const CARDS = [
  { id: 'cinder-imp', name: 'Cinder Imp', element: 'ember', type: 'creature', cost: 1, atk: 2, hp: 1,
    ability: 'kindle', text: 'Kindle: +1 attack whenever you play another Ember card.' },
  { id: 'frost-wisp', name: 'Frost Wisp', element: 'frost', type: 'creature', cost: 1, atk: 1, hp: 3,
    ability: 'freeze', text: 'Freeze the creature opposite it when played.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', element: 'thorn', type: 'creature', cost: 2, atk: 2, hp: 3,
    ability: 'thorns', text: 'Thorns: attackers take 1 damage.' },
  { id: 'ash-hawk', name: 'Ash Hawk', element: 'ember', type: 'creature', cost: 2, atk: 3, hp: 2,
    ability: 'swift', text: 'Swift: attacks at once when played.' },
  { id: 'stone-golem', name: 'Stone Golem', element: 'stone', type: 'creature', cost: 3, atk: 2, hp: 6,
    ability: null, text: 'A patient wall of river rock.' },
  { id: 'ember-knight', name: 'Ember Knight', element: 'ember', type: 'creature', cost: 3, atk: 3, hp: 3,
    ability: 'kindle-plus', text: 'Kindle: +1 attack and +1 health whenever you play another Ember card.' },
  { id: 'frost-wolf', name: 'Frost Wolf', element: 'frost', type: 'creature', cost: 3, atk: 4, hp: 2,
    ability: 'freeze', text: 'Freeze the creature opposite it when played.' },
  { id: 'thorn-dryad', name: 'Thorn Dryad', element: 'thorn', type: 'creature', cost: 4, atk: 3, hp: 5,
    ability: 'mend', text: 'Mend: restore 3 life to your hero when played.' },
  { id: 'cinder-drake', name: 'Cinder Drake', element: 'ember', type: 'creature', cost: 5, atk: 5, hp: 4,
    ability: 'roar', text: 'Roar: deal 2 damage to the enemy hero when played.' },
  { id: 'avalanche-titan', name: 'Avalanche Titan', element: 'frost', type: 'creature', cost: 6, atk: 6, hp: 7,
    ability: 'blizzard', text: 'Blizzard: freeze every enemy creature when played.' },
  { id: 'ember-surge', name: 'Ember Surge', element: 'ember', type: 'spell', cost: 1,
    ability: 'draw2', text: 'Draw 2 cards.' },
  { id: 'fireball', name: 'Fireball', element: 'ember', type: 'spell', cost: 2,
    ability: 'bolt3', target: 'any-enemy', text: 'Deal 3 damage to a creature or hero.' },
  { id: 'frost-nova', name: 'Frost Nova', element: 'frost', type: 'spell', cost: 2,
    ability: 'freeze-all', text: 'Freeze every enemy creature.' },
  { id: 'verdant-bloom', name: 'Verdant Bloom', element: 'thorn', type: 'spell', cost: 2,
    ability: 'heal5-draw', text: 'Restore 5 life and draw a card.' },
  { id: 'quake', name: 'Quake', element: 'stone', type: 'spell', cost: 4,
    ability: 'quake2', text: 'Deal 2 damage to every enemy creature.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// Deterministic shuffle (mulberry32) so a seed replays the same deal.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDeck(rng) {
  const deck = [];
  for (const card of CARDS) {
    deck.push(card.id, card.id);
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

let uidCounter = 1;
export function makeCreature(cardId) {
  const def = CARD_BY_ID[cardId];
  return {
    uid: uidCounter++, id: cardId, name: def.name, element: def.element,
    type: 'creature', cost: def.cost, atk: def.atk, hp: def.hp, maxHp: def.hp,
    ability: def.ability, text: def.text, frozen: false, bornTurn: 0,
  };
}

export function makeHandCard(cardId) {
  const def = CARD_BY_ID[cardId];
  return { uid: uidCounter++, id: cardId, name: def.name, element: def.element,
    type: def.type, cost: def.cost, atk: def.atk ?? 0, hp: def.hp ?? 0,
    ability: def.ability, text: def.text, target: def.target ?? null };
}
