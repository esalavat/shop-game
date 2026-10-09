// Room types: how each kind of room looks and what furniture it starts with.

/** Interior size of every room: width, height, depth, and wall/floor thickness. */
export const ROOM_SIZE = { W: 3.4, H: 2.5, D: 2.6, T: 0.16 };

function themeRoom(theme, name, icon, colors) {
  return {
    name, theme, icon, floor: '#e8b98a', ...colors,
    window: null, // the shelves fill the back wall; a sign with the theme sits above them
    fixtures: [
      { kind: 'rug', x: 0, z: 0.25 },
      { kind: 'shelf', x: -1.15, z: -1.06 },
      { kind: 'shelf', x: 0, z: -1.06 },
      { kind: 'shelf', x: 1.15, z: -1.06 },
      { kind: 'plant', x: -1.45, z: 0.8 },
    ],
  };
}

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
  // Theme rooms (GDD #58): one per Collection theme (ITEMS[id].set), three shelves along the back wall.
  // Items of the room's theme sell better there (THEME_BONUS).
  tea: themeRoom('tea', 'Tea Time', '🫖', { paper: '#e4f1ff', stripe: '#d2e7ff', curtain: '#a8d8ff' }),
  parlor: themeRoom('parlor', 'Cozy Parlor', '🛋️', { paper: '#e3f6ea', stripe: '#d3efdd', curtain: '#9fe0c8' }),
  fairy: themeRoom('fairy', 'Fairy Garden', '🍄', { paper: '#eef8dc', stripe: '#e1f1c8', curtain: '#ff8f8f' }),
  bedroom: themeRoom('bedroom', 'Sweet Dreams', '🛏️', { paper: '#ece3ff', stripe: '#e0d4ff', curtain: '#c8b6ff' }),
  dolls: themeRoom('dolls', 'Doll Friends', '🎀', { paper: '#fff4dc', stripe: '#ffeabf', curtain: '#ffd98a' }),
  houses: themeRoom('houses', 'Little Houses', '🏡', { paper: '#ffe9df', stripe: '#ffdacb', curtain: '#ffb8a0' }),
};

/** Theme room types, in the order the Grow sheet lists them. */
export const THEME_ROOMS = Object.keys(ROOM_TYPES).filter((t) => ROOM_TYPES[t].theme);
/** What each theme room costs: the first one built, the second, ... (the last repeats). */
export const THEME_ROOM_COSTS = [250, 400, 600, 850, 1150, 1500];
/** Items sold from their own theme room earn this much extra (a share of the price, rounded up). */
export const THEME_BONUS = 0.25;
