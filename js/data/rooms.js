// Room types: how each kind of room looks and what furniture it starts with.

/** Interior size of every room: width, height, depth, and wall/floor thickness. */
export const ROOM_SIZE = { W: 3.4, H: 2.5, D: 2.6, T: 0.16 };

export const ROOM_TYPES = {
  shop: {
    name: 'Shop',
    paper: '#ffe1ec', stripe: '#ffd0e2', floor: '#e8b98a', curtain: '#ff9ec4',
    window: { x: 1.15, w: 0.7, h: 0.7 },
    fixtures: [
      { kind: 'rug', x: -0.3, z: 0.1 },
      { kind: 'shelf', x: -0.95, z: -1.06 },
      { kind: 'shelf', x: 0.25, z: -1.06 },
      { kind: 'counter', x: -1.05, z: 0.1 },
      { kind: 'pedestal', x: 1.15, z: 0.85 }, // the Dream Dollhouse, in front of the window
      { kind: 'plant', x: 1.42, z: -1.02 },
    ],
  },
  stock: {
    name: 'Stockroom',
    paper: '#e3f6ea', stripe: '#d3efdd', floor: '#d9b27c', curtain: '#9fe0c8',
    window: { x: -0.9, w: 0.8, h: 0.7 },
    fixtures: [],
  },
  dolls: {
    name: 'Doll Corner',
    paper: '#ece3ff', stripe: '#e0d4ff', floor: '#e8b98a', curtain: '#c8b6ff',
    window: { x: 0, w: 1.0, h: 0.75 },
    fixtures: [],
  },
  tea: {
    name: 'Tea Corner',
    paper: '#fff3c9', stripe: '#ffeab0', floor: '#e3b07f', curtain: '#ffd98a',
    window: { x: 0.7, w: 1.0, h: 0.75 },
    fixtures: [],
  },
};
