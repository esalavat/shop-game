// Room types: how each kind of room looks and what furniture it starts with.

/** Interior size of every room: width, height, depth, and wall/floor thickness. */
export const ROOM_SIZE = { W: 3.4, H: 2.5, D: 2.6, T: 0.16 };

export const ROOM_TYPES = {
  shop: {
    name: 'Shop',
    paper: '#ffe1ec', stripe: '#ffd0e2', floor: '#e8b98a', curtain: '#ff9ec4',
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
    paper: '#fde7f3', stripe: '#f9d6ea', floor: '#e8b98a', curtain: '#c8b6ff',
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
    paper: '#e3f6ea', stripe: '#d3efdd', floor: '#d9b27c', curtain: '#9fe0c8',
    window: { x: -0.9, w: 0.8, h: 0.7 },
    fixtures: [],
  },
  // The Stairwell (GDD #58): two rooms, one above the other, built together. A spiral staircase in the
  // back-left corner (STAIRS in sim/route.js) and one shelf beside it, downstairs and up.
  stairs: {
    name: 'Stairwell', icon: '🪜',
    paper: '#fff4dc', stripe: '#ffeabf', floor: '#e8b98a', curtain: '#ffd98a',
    window: null,
    fixtures: [
      { kind: 'stairs', x: -1.1, z: -0.7 },
      { kind: 'shelf', x: 0.85, z: -1.06 },
      { kind: 'plant', x: 1.45, z: 0.8 },
    ],
  },
  landing: {
    name: 'Stairwell', icon: '🪜',
    paper: '#fff4dc', stripe: '#ffeabf', floor: '#e8b98a', curtain: '#ffd98a',
    window: null,
    fixtures: [
      { kind: 'stairhole', x: -1.1, z: -0.7 },
      { kind: 'shelf', x: 0.85, z: -1.06 },
    ],
  },
  // Expansion rooms (GDD §18 #8): plain shelf rooms, three shelves along the back wall. Each wears one of
  // ROOM_STYLES (room.style); a decoration shop will let you restyle them later.
  room: {
    name: 'Shelf Room', icon: '🛍️',
    paper: '#e4f1ff', stripe: '#d2e7ff', floor: '#e8b98a', curtain: '#a8d8ff',
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

/** Wallpapers for shelf rooms (room.style), handed out in turn as rooms are built. */
export const ROOM_STYLES = [
  { paper: '#e4f1ff', stripe: '#d2e7ff', curtain: '#a8d8ff' }, // sky
  { paper: '#e3f6ea', stripe: '#d3efdd', curtain: '#9fe0c8' }, // mint
  { paper: '#eef8dc', stripe: '#e1f1c8', curtain: '#ff8f8f' }, // leaf
  { paper: '#ece3ff', stripe: '#e0d4ff', curtain: '#c8b6ff' }, // lilac
  { paper: '#fff4dc', stripe: '#ffeabf', curtain: '#ffd98a' }, // butter
  { paper: '#ffe9df', stripe: '#ffdacb', curtain: '#ffb8a0' }, // peach
];

/**
 * Shelf rooms cost more the further they are from the middle of the building (the shop and the
 * Stairwell, on the ground), so a compact, squarish house is the cheapest way to grow (user, GDD #65).
 * A spot's ring is how far out it is, sideways or up, whichever is more: ROOM_COSTS[ring - 1], then
 * ROOM_COST_STEP more for each ring past the end of the list.
 */
export const ROOM_COSTS = [250, 400, 600, 850, 1150, 1500];
export const ROOM_COST_STEP = 450;
/** ...and each floor up costs this much more than the same spot below (a share, rounded to 10s). */
export const ROOM_FLOOR_MARKUP = 0.15;
/** The Stairwell (both of its first two floors), then each staircase up to a new floor: each costs more. */
export const STAIR_COSTS = [350, 700, 1200, 1900, 2800];
export const STAIR_COST_STEP = 1200;
