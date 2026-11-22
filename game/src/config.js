// Ember Court — shared constants: canvas size, palette, layout geometry.
// One job: every number the renderer and the input handler agree on lives here.
export const W = 1280;
export const H = 800;

export const COLORS = {
  felt: '#1d4a2f',
  feltDark: '#143522',
  feltLight: '#27603d',
  tableEdge: '#6b4a1f',
  gold: '#e8b64c',
  goldDark: '#9a7418',
  parchment: '#f4e8c8',
  ink: '#241a10',
  ember: '#e2482a',
  emberDark: '#8f1d0d',
  frost: '#3fa7d6',
  frostDark: '#14557a',
  thorn: '#57a83c',
  thornDark: '#2c5c1d',
  stone: '#8d8f96',
  stoneDark: '#4a4c55',
  heroYou: '#2a6ea8',
  heroFoe: '#a83226',
  danger: '#ff5a4e',
  mana: '#4aa3ff',
  button: '#c98f2d',
  buttonHover: '#e0a83e',
  panel: 'rgba(12, 20, 14, 0.82)',
};

// Element look: colour pair + a drawn sigil, never text alone.
export const ELEMENTS = {
  ember: { color: COLORS.ember, dark: COLORS.emberDark, label: 'Ember' },
  frost: { color: COLORS.frost, dark: COLORS.frostDark, label: 'Frost' },
  thorn: { color: COLORS.thorn, dark: COLORS.thornDark, label: 'Thorn' },
  stone: { color: COLORS.stone, dark: COLORS.stoneDark, label: 'Stone' },
};

export const CARD_W = 148;
export const CARD_H = 206;
export const HAND_Y = 566;
export const LANES = 3;
export const LANE_W = 300;
export const LANE_GAP = 26;
export const LANE_X0 = (W - (LANES * LANE_W + (LANES - 1) * LANE_GAP)) / 2;
export const FOE_BOARD_Y = 148;
export const YOU_BOARD_Y = 330;
export const BOARD_H = 168;
export const MAX_HAND = 7;
export const START_LIFE = 24;
export const MAX_MANA = 8;
export const DECK_SIZE = 30;
