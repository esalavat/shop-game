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
