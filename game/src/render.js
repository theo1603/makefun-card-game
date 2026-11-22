// Ember Court — all canvas drawing: table, heroes, lanes, cards, screens.
// Input reads the same geometry back through computeLayout, so clicks and
// pixels can never disagree.
import { BOARD_H, CARD_H, CARD_W, COLORS, ELEMENTS, FOE_BOARD_Y, H, LANE_GAP,
  LANE_W, LANE_X0, LANES, W, YOU_BOARD_Y, HAND_Y } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// Element sigils: flame, snowflake, leaf, gem — colour AND shape.
export function drawSigil(ctx, element, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.lineCap = 'round';
  if (element === 'ember') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.7, -s * 0.2, s * 0.55, s * 0.6, 0, s * 0.8);
    ctx.bezierCurveTo(-s * 0.55, s * 0.6, -s * 0.7, -s * 0.2, 0, -s);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.2);
    ctx.bezierCurveTo(s * 0.35, s * 0.15, s * 0.25, s * 0.5, 0, s * 0.55);
    ctx.bezierCurveTo(-s * 0.25, s * 0.5, -s * 0.35, s * 0.15, 0, -s * 0.2);
    ctx.fill();
  } else if (element === 'frost') {
    for (let i = 0; i < 3; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2); ctx.stroke();
  } else if (element === 'thorn') {
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.8); ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -s); ctx.lineTo(s * 0.75, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.75, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.moveTo(-s * 0.75, 0); ctx.lineTo(s * 0.75, 0); ctx.stroke();
  }
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const s = w / CARD_W;
  const el = ELEMENTS[card.element];
  const lift = opts.hover ? -18 : opts.selected ? -26 : 0;
  const yy = y + lift;
  ctx.save();
  if (opts.dim) ctx.globalAlpha = 0.45;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  rr(ctx, x, yy, w, h, 12 * s);
  ctx.fillStyle = '#f7efdc';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = opts.selected ? 5 : 2;
  ctx.strokeStyle = opts.selected ? COLORS.gold : '#3a2c14';
  ctx.stroke();
  // Element band.
  rr(ctx, x + 4 * s, yy + 4 * s, w - 8 * s, 30 * s, 8 * s);
  ctx.fillStyle = el.color;
  ctx.fill();
  text(ctx, card.name.toUpperCase(), x + w / 2, yy + 20 * s, Math.max(10, 13 * s), '#fff', 'center');
  // Mana gem.
  ctx.beginPath(); ctx.arc(x + 20 * s, yy + 46 * s, 15 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#2f6fd0'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
  text(ctx, String(card.cost), x + 20 * s, yy + 47 * s, Math.max(11, 16 * s), '#fff');
  // Sigil + element label.
  drawSigil(ctx, card.element, x + w / 2, yy + 92 * s, 26 * s, el.color);
  text(ctx, el.label, x + w / 2, yy + 128 * s, Math.max(9, 11 * s), el.dark, 'center');
  // Rules text: full-size cards only — on small board cards it would collide
  // with the attack/health pips, so minis show the sigil and values alone.
  if (s >= 0.95) {
    ctx.fillStyle = COLORS.ink;
    ctx.font = `italic ${Math.max(9, 11 * s)}px Georgia, serif`;
    ctx.textAlign = 'center';
    wrapText(ctx, card.text, x + w / 2, yy + 148 * s, w - 16 * s, 13 * s);
  }
  if (card.type === 'creature') {
    // Attack (sword) and health (heart) pips.
    ctx.beginPath(); ctx.arc(x + 26 * s, yy + h - 24 * s, 16 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
    text(ctx, String(card.atk), x + 26 * s, yy + h - 23 * s, Math.max(11, 16 * s), '#fff');
    ctx.beginPath(); ctx.arc(x + w - 26 * s, yy + h - 24 * s, 16 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#27ae60'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
    text(ctx, String(card.hp), x + w - 26 * s, yy + h - 23 * s, Math.max(11, 16 * s), '#fff');
  } else {
    rr(ctx, x + w / 2 - 34 * s, yy + h - 34 * s, 68 * s, 22 * s, 8 * s);
    ctx.fillStyle = el.dark; ctx.fill();
    text(ctx, 'SPELL', x + w / 2, yy + h - 23 * s, Math.max(9, 11 * s), '#fff');
  }
  if (card.frozen) {
    rr(ctx, x, yy, w, h, 12 * s);
    ctx.fillStyle = 'rgba(63,167,214,0.45)'; ctx.fill();
    drawSigil(ctx, 'frost', x + w / 2, yy + h / 2, 30 * s, '#dff3ff');
    text(ctx, 'FROZEN', x + w / 2, yy + h / 2 + 42 * s, Math.max(10, 13 * s), '#dff3ff');
  }
  ctx.restore();
}

function wrapText(ctx, str, cx, y, maxW, lineH) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, cx, y + i * lineH));
}

// ---- layout: the single source of click geometry ----
export function computeLayout(state) {
  const n = state.you.hand.length;
  // Hand fans between the hero panel (ends x=224) and the End Turn button (starts x=1088).
  const step = n > 1 ? Math.min(132, (836 - CARD_W) / (n - 1)) : 0;
  const handW = CARD_W + step * (n - 1);
  const handX0 = 224 + (836 - handW) / 2;
  const hand = state.you.hand.map((card, i) => ({
    card, x: handX0 + i * step, y: HAND_Y, w: CARD_W, h: CARD_H,
  }));
  const lanes = [0, 1, 2].map((lane) => ({
    lane,
    x: LANE_X0 + lane * (LANE_W + LANE_GAP),
    foe: { x: LANE_X0 + lane * (LANE_W + LANE_GAP), y: FOE_BOARD_Y, w: LANE_W, h: BOARD_H },
    you: { x: LANE_X0 + lane * (LANE_W + LANE_GAP), y: YOU_BOARD_Y, w: LANE_W, h: BOARD_H },
  }));
  return {
    hand, lanes,
    foeHero: { x: 24, y: 14, w: 380, h: 100 },
    youHero: { x: 24, y: 600, w: 200, h: 112 },
    endTurn: { x: 1088, y: 640, w: 168, h: 62 },
    playButton: { x: W / 2 - 130, y: 560, w: 260, h: 72 },
    againButton: { x: W / 2 - 130, y: 560, w: 260, h: 72 },
    mute: { x: W - 46, y: 14, w: 32, h: 32 },
  };
}

function drawManaGems(ctx, mana, maxMana, x, y, gap = 26, r = 10, showCount = true) {
  for (let i = 0; i < maxMana; i++) {
    ctx.beginPath(); ctx.arc(x + i * gap, y, r, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? '#4aa3ff' : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#dfeeff'; ctx.stroke();
  }
  if (showCount) text(ctx, `${mana}/${maxMana}`, x + maxMana * gap + 8, y + 1, 15, '#dfeeff', 'left');
}

function drawHeroPanel(ctx, name, side, x, y, w, h, color, isYou) {
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = 'rgba(10,16,12,0.72)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 36, y + 36, 26, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
  text(ctx, isYou ? 'YOU' : 'AI', x + 36, y + 37, 14, '#fff');
  text(ctx, name, x + 70, y + 30, 18, '#f4e8c8', 'left');
  // Life bar.
  rr(ctx, x + 70, y + 46, w - 82, 18, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
  rr(ctx, x + 70, y + 46, (w - 82) * Math.max(0, side.life / side.maxLife), 18, 8);
  ctx.fillStyle = side.life <= 8 ? COLORS.danger : '#e2482a'; ctx.fill();
  text(ctx, `♥ ${side.life} / ${side.maxLife}`, x + 70 + (w - 82) / 2, y + 56, 13, '#fff');
  if (isYou) drawManaGems(ctx, side.mana, side.maxMana, x + 74, y + 84, 14, 7, false);
  else drawManaGems(ctx, side.mana, side.maxMana, x + 74, y + 84, 20, 9, true);
}

function drawLane(ctx, lane, state, layout) {
  const l = layout.lanes[lane];
  rr(ctx, l.foe.x, l.foe.y, l.foe.w, l.foe.h, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(232,182,76,0.35)'; ctx.stroke();
  rr(ctx, l.you.x, l.you.y, l.you.w, l.you.h, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
  ctx.stroke();
  text(ctx, `LANE ${lane + 1}`, l.foe.x + 14, l.foe.y + 16, 12, 'rgba(244,232,200,0.45)', 'left');
  const foeCard = state.foe.board[lane];
  const youCard = state.you.board[lane];
  if (foeCard) drawCardFace(ctx, foeCard, l.foe.x + (l.foe.w - 120) / 2, l.foe.y + 14, 120, 140);
  if (youCard) drawCardFace(ctx, youCard, l.you.x + (l.you.w - 120) / 2, l.you.y + 14, 120, 140);
}

function drawTable(ctx, state, layout) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  // Felt table.
  ctx.fillStyle = COLORS.felt; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.feltDark; ctx.fillRect(0, 0, W, 128);
  ctx.fillStyle = COLORS.feltDark; ctx.fillRect(0, 516, W, 284);
  ctx.strokeStyle = COLORS.tableEdge; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, 128); ctx.lineTo(W, 128); ctx.moveTo(0, 516); ctx.lineTo(W, 516); ctx.stroke();
  for (let lane = 0; lane < LANES; lane++) drawLane(ctx, lane, state, layout);
  drawHeroPanel(ctx, 'Warden of Cinders', state.foe, layout.foeHero.x, layout.foeHero.y, layout.foeHero.w, layout.foeHero.h, COLORS.heroFoe, false);
  drawHeroPanel(ctx, 'You', state.you, layout.youHero.x, layout.youHero.y, layout.youHero.w, layout.youHero.h, COLORS.heroYou, true);
  text(ctx, `Turn ${state.turn}`, W / 2, 40, 20, '#f4e8c8');
  text(ctx, state.phase === 'ai' ? 'The Warden is thinking…' : 'Your turn — play a card, then End Turn', W / 2, 66, 15, '#cbbf9a');
  // End turn button.
  const b = layout.endTurn;
  const canEnd = state.phase === 'play';
  text(ctx, `Mana ${state.you.mana}/${state.you.maxMana}  ·  Deck ${state.you.deck.length}`, b.x + b.w / 2, b.y - 14, 14, '#dfeeff');
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = canEnd ? COLORS.button : 'rgba(120,110,90,0.6)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
  text(ctx, 'END TURN', b.x + b.w / 2, b.y + b.h / 2, 19, '#fff');
  text(ctx, 'Enter ↵', b.x + b.w / 2, b.y + b.h + 16, 12, '#cbbf9a');
  // Hand.
  for (const slot of layout.hand) {
    const isSel = state.selected === slot.card.uid;
    const isHover = state.hoverUid === slot.card.uid;
    const affordable = slot.card.cost <= state.you.mana;
    drawCardFace(ctx, slot.card, slot.x, slot.y, slot.w, slot.h,
      { selected: isSel, hover: isHover && !isSel, dim: !affordable && state.phase === 'play' });
  }
  if (state.selected !== null) {
    text(ctx, 'Now click a lane (creature) or a target (spell) — Esc to cancel',
      W / 2, 545, 15, '#ffd76a');
  } else if (state.message) {
    text(ctx, state.message, W / 2, 545, 15, '#ffd76a');
  }
  // Log.
  ctx.fillStyle = 'rgba(10,16,12,0.6)';
  ctx.fillRect(240, 516, 800, 26);
  text(ctx, state.log[state.log.length - 1] || '', 640, 530, 14, '#e8dcc0', 'center', 'normal');
  // Floaters.
  const now = Date.now();
  state.floaters = state.floaters.filter((f) => now - f.born < f.life);
  for (const f of state.floaters) {
    const age = (now - f.born) / f.life;
    ctx.globalAlpha = 1 - age;
    text(ctx, f.text, f.x, f.y - age * 40, 26, f.color);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawTitle(ctx, state) {
  ctx.fillStyle = COLORS.feltDark; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.16;
  drawSigil(ctx, 'ember', W / 2, 300, 220, '#e2482a');
  ctx.restore();
  drawSigil(ctx, 'ember', W / 2, 150, 46, COLORS.gold);
  text(ctx, 'EMBER COURT', W / 2, 250, 84, '#f4e8c8');
  text(ctx, 'A duel of cinders, frost and thorn — outwit the Warden of Cinders', W / 2, 310, 22, '#e8b64c', 'center', 'normal');
  // Preview fan of three cards.
  const preview = [
    { name: 'Cinder Drake', element: 'ember', type: 'creature', cost: 5, atk: 5, hp: 4, text: 'Roar: deal 2 damage to the enemy hero when played.' },
    { name: 'Frost Wolf', element: 'frost', type: 'creature', cost: 3, atk: 4, hp: 2, text: 'Freeze the creature opposite it when played.' },
    { name: 'Thorn Dryad', element: 'thorn', type: 'creature', cost: 4, atk: 3, hp: 5, text: 'Mend: restore 3 life to your hero when played.' },
  ];
  preview.forEach((card, i) => {
    ctx.save();
    ctx.translate(W / 2 + (i - 1) * 190, 450);
    ctx.rotate((i - 1) * 0.08);
    drawCardFace(ctx, card, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
    ctx.restore();
  });
  const b = computeLayout(state).playButton;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = COLORS.button; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
  text(ctx, '▶  PLAY', b.x + b.w / 2, b.y + b.h / 2, 30, '#fff');
  text(ctx, 'Click PLAY or press Space — 1-7 select a card, Enter ends your turn',
    W / 2, 660, 16, '#cbbf9a', 'center', 'normal');
  text(ctx, 'Reduce the Warden to 0 life. Your creatures attack at the end of your turn.',
    W / 2, 690, 16, '#cbbf9a', 'center', 'normal');
  text(ctx, 'Mana grows each turn · Kindle Ember cards to grow stronger · Freeze the foe',
    W / 2, 720, 16, '#cbbf9a', 'center', 'normal');
}

function drawEnd(ctx, state, won) {
  drawTable(ctx, state, computeLayout(state));
  ctx.fillStyle = 'rgba(8,12,9,0.78)'; ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  text(ctx, won ? '★ VICTORY ★' : 'DEFEAT', cx, 250, 80, won ? COLORS.gold : '#c9c9c9');
  text(ctx, won ? 'The Warden falls. The Court is yours!' : 'Your hero falls. The embers fade…',
    cx, 330, 26, '#f4e8c8', 'center', 'normal');
  text(ctx, `Turns: ${state.stats.turnsTaken}   ·   Cards played: ${state.stats.played}   ·   Life left: ${state.you.life}`,
    cx, 390, 20, '#e8dcc0', 'center', 'normal');
  text(ctx, won ? 'The court remembers its new champion.' : 'The Warden shuffles the deck. Rematch?',
    cx, 430, 18, '#cbbf9a', 'center', 'normal');
  const b = computeLayout(state).againButton;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = COLORS.button; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
  text(ctx, 'PLAY AGAIN', b.x + b.w / 2, b.y + b.h / 2, 26, '#fff');
  text(ctx, 'or press R', cx, 660, 15, '#cbbf9a', 'center', 'normal');
}

export function draw(ctx, state) {
  const layout = computeLayout(state);
  if (state.phase === 'title') drawTitle(ctx, state);
  else if (state.phase === 'won') drawEnd(ctx, state, true);
  else if (state.phase === 'lost') drawEnd(ctx, state, false);
  else drawTable(ctx, state, layout);
  // Mute corner.
  const m = layout.mute;
  rr(ctx, m.x, m.y, m.w, m.h, 8);
  ctx.fillStyle = 'rgba(10,16,12,0.6)'; ctx.fill();
  text(ctx, state.muted ? '✕' : '♪', m.x + 16, m.y + 17, 16, '#f4e8c8');
}
