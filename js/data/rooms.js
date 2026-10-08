// Room types: how each kind of room looks. Gameplay data (costs, unlocks) comes later.

export const ROOM_TYPES = {
  shop: {
    name: 'Shop',
    paper: '#ffe1ec', stripe: '#ffd0e2', floor: '#e8b98a', curtain: '#ff9ec4',
    window: { x: 1.15, w: 0.7, h: 0.7 },
  },
  stock: {
    name: 'Stockroom',
    paper: '#e3f6ea', stripe: '#d3efdd', floor: '#d9b27c', curtain: '#9fe0c8',
    window: { x: -0.9, w: 0.8, h: 0.7 },
  },
  dolls: {
    name: 'Doll Corner',
    paper: '#ece3ff', stripe: '#e0d4ff', floor: '#e8b98a', curtain: '#c8b6ff',
    window: { x: 0, w: 1.0, h: 0.75 },
  },
  tea: {
    name: 'Tea Corner',
    paper: '#fff3c9', stripe: '#ffeab0', floor: '#e3b07f', curtain: '#ffd98a',
    window: { x: 0.7, w: 1.0, h: 0.75 },
  },
};
