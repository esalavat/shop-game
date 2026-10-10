// Room types: how each kind of room looks and what furniture it starts with.

/** Interior size of every room: width, height, depth, and wall/floor thickness. */
export const ROOM_SIZE = { W: 3.4, H: 2.8, D: 2.6, T: 0.16 }; // H was 2.5; taller so more wallpaper shows (user, 2026-10-10)

export const ROOM_TYPES = {
  shop: {
    name: 'Shop',
    decor: { paper: 'pink', curtain: 'pink' }, // default looks (data/decor.js); restyled with Ribbons (GDD #68)
    // The window sits behind the counter as the shopkeeper's backdrop; no shelf there, so she
    // never hides any stock.
    window: { x: -1.0, w: 0.8, h: 0.7 },
    fixtures: [
      { kind: 'rug', x: 0.3, z: 0.15 },
      { kind: 'shelf', x: -0.05, z: -1.06 },
      { kind: 'shelf', x: 1.1, z: -1.06 },
      { kind: 'counter', x: -1.05, z: 0.1 },
      { kind: 'plant', x: -1.45, z: -1.05 },
    ],
  },
  display: {
    name: 'Window Display',
    decor: { paper: 'rose', curtain: 'lilac' },
    window: { x: 0, w: 1.2, h: 0.8 },
    fixtures: [
      { kind: 'rug', x: 0, z: 0.35 },
      { kind: 'pedestal', x: 0, z: 0.35 }, // the Dream Dollhouse
      { kind: 'plant', x: -1.2, z: 0.6 },
      { kind: 'plant', x: 1.2, z: 0.6 },
    ],
  },
  stock: {
    name: 'Stockroom',
    decor: { paper: 'mint', curtain: 'mint' },
    window: { x: -0.9, w: 0.8, h: 0.7 },
    fixtures: [],
  },
  // The Stairwell (GDD #58): two rooms, one above the other, built together. A spiral staircase in the
  // back-left corner (STAIRS in sim/route.js) and one shelf beside it, downstairs and up.
  // Register rooms (GDD #73): a copy of the shop, one per floor, stacked above it. Each has its own cashier.
  register: {
    name: 'Register Room', icon: '🛎️',
    decor: { paper: 'pink', curtain: 'pink' },
    window: { x: -1.0, w: 0.8, h: 0.7 },
    fixtures: [
      { kind: 'rug', x: 0.3, z: 0.15 },
      { kind: 'shelf', x: -0.05, z: -1.06 },
      { kind: 'shelf', x: 1.1, z: -1.06 },
      { kind: 'counter', x: -1.05, z: 0.1 },
      { kind: 'plant', x: -1.45, z: -1.05 },
    ],
  },
  stairs: {
    name: 'Stairwell', icon: '🪜',
    decor: { paper: 'butter', curtain: 'butter' },
    window: null,
    fixtures: [
      { kind: 'stairs', x: -1.1, z: -0.7 },
      { kind: 'shelf', x: 0.85, z: -1.06 },
      { kind: 'plant', x: 1.45, z: 0.8 },
    ],
  },
  landing: {
    name: 'Stairwell', icon: '🪜',
    decor: { paper: 'butter', curtain: 'butter' },
    window: null,
    fixtures: [
      { kind: 'stairhole', x: -1.1, z: -0.7 },
      { kind: 'shelf', x: 0.85, z: -1.06 },
    ],
  },
  // Expansion rooms (GDD §18 #8): plain shelf rooms, three shelves along the back wall. Each wears one of
  // ROOM_STYLES (room.style) until restyled with Ribbons (room.decor, GDD #68).
  room: {
    name: 'Shelf Room', icon: '🛍️',
    decor: { paper: 'sky', curtain: 'sky' },
    window: null, // the shelves fill the back wall
    fixtures: [
      { kind: 'rug', x: 0, z: 0.25 },
      { kind: 'shelf', x: -1.15, z: -1.06 },
      { kind: 'shelf', x: 0, z: -1.06 },
      { kind: 'shelf', x: 1.15, z: -1.06 },
      { kind: 'plant', x: -1.45, z: 0.8 },
    ],
  },
};

/** Wallpapers for shelf rooms (room.style), handed out in turn as rooms are built (ids in data/decor.js). */
export const ROOM_STYLES = [
  { paper: 'sky', curtain: 'sky' },
  { paper: 'mint', curtain: 'mint' },
  { paper: 'leaf', curtain: 'coral' },
  { paper: 'lilac', curtain: 'lilac' },
  { paper: 'butter', curtain: 'butter' },
  { paper: 'peach', curtain: 'peach' },
];

/**
 * Shelf rooms cost more the further they are from the middle of the building (the shop and the
 * Stairwell, on the ground), so a compact, squarish house is the cheapest way to grow (user, GDD #65, #75).
 * A spot's ring is how far out it is, sideways or up, whichever is more: ROOM_COSTS[ring - 1], then
 * ROOM_COST_STEP more for each ring past the end of the list. Going up costs the same as going out, and
 * every spot costs ROOM_GROWTH times as much for each shelf room you already have, so prices keep up with
 * a richer shop (#75, GDD #80).
 */
export const ROOM_COSTS = [250, 400, 600, 850, 1150, 1500];
export const ROOM_COST_STEP = 450;
export const ROOM_GROWTH = 1.35;
/** The Stairwell (both of its first two floors), then each staircase up to a new floor; past the list, STAIR_GROWTH times the one before. */
export const STAIR_COSTS = [350, 500, 700, 950, 1250];
export const STAIR_GROWTH = 1.6;
/** Register rooms (GDD #73): the first costs this, and each one higher up REGISTER_GROWTH times the one before. */
export const REGISTER_COST = 400;
export const REGISTER_GROWTH = 2;

/** Big prices rounded to friendly numbers: 2 significant figures (1234 -> 1200, 56789 -> 57000). */
export function niceCost(n) {
  const step = 10 ** Math.max(1, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / step) * step;
}
