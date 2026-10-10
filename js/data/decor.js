// Room styles for the decoration shop (GDD #68), bought with Ribbons 🎀. Each kind is a list of
// options; `price` is in Ribbons and 0 means everyone has it from the start (the looks already in the
// game). A bought style is yours in every room, forever. Prices are first guesses, tunable here.
//   paper:   wallpaper colour (paper) and its pattern colour (stripe)
//   pattern: what's printed on the wallpaper, in the stripe colour
//   floor:   colour, a second colour for checkers / tiles, and the style (planks, checker, tiles, carpet)
//   rug:     shape and colours ('none' is no rug)
//   curtain: curtain colour (only rooms with a window)
//   corner:  the piece standing in the room's plant spot

import { ROOM_TYPES, ROOM_STYLES } from './rooms.js';

export const DECOR = {
  paper: [
    { id: 'pink', name: 'Pink', paper: '#ffe1ec', stripe: '#ffd0e2', price: 0 },
    { id: 'rose', name: 'Rose', paper: '#fde7f3', stripe: '#f9d6ea', price: 0 },
    { id: 'peach', name: 'Peach', paper: '#ffe9df', stripe: '#ffdacb', price: 0 },
    { id: 'butter', name: 'Butter', paper: '#fff4dc', stripe: '#ffeabf', price: 0 },
    { id: 'leaf', name: 'Leaf', paper: '#eef8dc', stripe: '#e1f1c8', price: 0 },
    { id: 'mint', name: 'Mint', paper: '#e3f6ea', stripe: '#d3efdd', price: 0 },
    { id: 'sky', name: 'Sky', paper: '#e4f1ff', stripe: '#d2e7ff', price: 0 },
    { id: 'lilac', name: 'Lilac', paper: '#ece3ff', stripe: '#e0d4ff', price: 0 },
    { id: 'cream', name: 'Cream', paper: '#fff8ef', stripe: '#f6e6d4', price: 3 },
    { id: 'bubblegum', name: 'Bubblegum', paper: '#ffd3e6', stripe: '#ffb8d6', price: 3 },
    { id: 'coral', name: 'Coral', paper: '#ffddd6', stripe: '#ffc6bb', price: 3 },
    { id: 'aqua', name: 'Aqua', paper: '#d9f5f3', stripe: '#c2ece8', price: 3 },
    { id: 'violet', name: 'Violet', paper: '#e2d3fa', stripe: '#d2bdf4', price: 3 },
    { id: 'sage', name: 'Sage', paper: '#e4ecdb', stripe: '#d3dfc6', price: 3 },
  ],
  pattern: [
    { id: 'stripes', name: 'Stripes', price: 0 },
    { id: 'plain', name: 'Plain', price: 0 },
    { id: 'dots', name: 'Polka dots', price: 6 },
    { id: 'gingham', name: 'Gingham', price: 8 },
    { id: 'stars', name: 'Stars', price: 10 },
    { id: 'hearts', name: 'Hearts', price: 10 },
  ],
  floor: [
    { id: 'honey', name: 'Honey wood', style: 'planks', color: '#e8b98a', price: 0 },
    { id: 'maple', name: 'Maple', style: 'planks', color: '#f2d3a8', price: 4 },
    { id: 'cocoa', name: 'Cocoa wood', style: 'planks', color: '#c99268', price: 5 },
    { id: 'whitewood', name: 'White wood', style: 'planks', color: '#f3ebe3', price: 5 },
    { id: 'lilaccarpet', name: 'Lilac carpet', style: 'carpet', color: '#ddd0f7', price: 8 },
    { id: 'skytiles', name: 'Sky tiles', style: 'tiles', color: '#d4eaff', color2: '#fbfdff', price: 8 },
    { id: 'pinkcheck', name: 'Pink checker', style: 'checker', color: '#ffc9dd', color2: '#fff6ee', price: 10 },
    { id: 'mintcheck', name: 'Mint checker', style: 'checker', color: '#bfeedd', color2: '#fff6ee', price: 10 },
  ],
  rug: [
    { id: 'lilac', name: 'Lilac', shape: 'round', color: '#c8b6ff', color2: '#ddd1ff', price: 0 },
    { id: 'none', name: 'No rug', shape: 'none', price: 0 },
    { id: 'pink', name: 'Pink', shape: 'round', color: '#ff9ec4', color2: '#ffc7dd', price: 3 },
    { id: 'mint', name: 'Mint', shape: 'round', color: '#9fe0c8', color2: '#c9f0e1', price: 3 },
    { id: 'butter', name: 'Butter', shape: 'round', color: '#ffd98a', color2: '#ffeab8', price: 3 },
    { id: 'striped', name: 'Striped', shape: 'rect', color: '#a8d8ff', color2: '#fff6ee', price: 8 },
    { id: 'heart', name: 'Heart', shape: 'heart', color: '#ff8fb8', color2: '#ffc7dd', price: 12 },
    { id: 'star', name: 'Star', shape: 'star', color: '#ffd166', color2: '#ffe9a8', price: 12 },
    { id: 'flower', name: 'Flower', shape: 'flower', color: '#c8b6ff', color2: '#ffd98a', price: 12 },
  ],
  curtain: [
    { id: 'pink', name: 'Pink', color: '#ff9ec4', price: 0 },
    { id: 'peach', name: 'Peach', color: '#ffb8a0', price: 0 },
    { id: 'coral', name: 'Coral', color: '#ff8f8f', price: 0 },
    { id: 'butter', name: 'Butter', color: '#ffd98a', price: 0 },
    { id: 'mint', name: 'Mint', color: '#9fe0c8', price: 0 },
    { id: 'sky', name: 'Sky', color: '#a8d8ff', price: 0 },
    { id: 'lilac', name: 'Lilac', color: '#c8b6ff', price: 0 },
    { id: 'lace', name: 'Lace white', color: '#fffaf4', price: 3 },
    { id: 'berry', name: 'Berry', color: '#e0679a', price: 3 },
    { id: 'teal', name: 'Teal', color: '#6cc7c0', price: 3 },
  ],
  corner: [
    { id: 'plant', name: 'Plant', icon: '🪴', price: 0 },
    { id: 'fern', name: 'Fern', icon: '🌿', price: 6 },
    { id: 'cactus', name: 'Cactus', icon: '🌵', price: 6 },
    { id: 'flowers', name: 'Flowers', icon: '💐', price: 6 },
    { id: 'lamp', name: 'Floor lamp', icon: '💡', price: 8 },
    { id: 'books', name: 'Bookcase', icon: '📚', price: 10 },
    { id: 'balloons', name: 'Balloons', icon: '🎈', price: 10 },
    { id: 'gumball', name: 'Gumball machine', icon: '🍬', price: 12 },
  ],
};

/** The decorate panel's tabs, in order. Walls has two rows: colour (paper) and pattern. */
export const DECOR_TABS = [
  { id: 'walls', name: 'Walls', icon: '🖼️', kinds: ['paper', 'pattern'] },
  { id: 'floor', name: 'Floor', icon: '🪵', kinds: ['floor'] },
  { id: 'rug', name: 'Rug', icon: '🟣', kinds: ['rug'] },
  { id: 'curtain', name: 'Curtains', icon: '🪟', kinds: ['curtain'] },
  { id: 'corner', name: 'Corner', icon: '🪴', kinds: ['corner'] },
];

/** Every room starts with these, unless its type or wallpaper (ROOM_STYLES) says otherwise. */
const BASE = { paper: 'pink', pattern: 'stripes', floor: 'honey', rug: 'lilac', curtain: 'pink', corner: 'plant' };

/**
 * Completing a theme in the Collection gives you a matching style for free (GDD #69), on top of the
 * Ribbons. Still buyable with Ribbons before that. theme (SETS in data/items.js) -> [kind, id].
 */
export const THEME_STYLES = {
  tea: ['pattern', 'gingham'],
  parlor: ['corner', 'books'],
  fairy: ['rug', 'flower'],
  bedroom: ['pattern', 'stars'],
  dolls: ['pattern', 'hearts'],
  houses: ['floor', 'pinkcheck'],
};

/** The full name of a style, e.g. "Gingham wallpaper". */
export function styleName(kind, id) {
  const o = decorOption(kind, id);
  return { paper: `${o.name} wallpaper`, pattern: `${o.name} wallpaper`, floor: `${o.name} floor`, rug: `${o.name} rug`, curtain: `${o.name} curtains`, corner: o.name }[kind];
}

/** How Ribbons are earned (GDD #68). */
export const RIBBONS = {
  wish: 1,       // a sale grants a wish note
  window: 1,     // a window-peeker buys what they pointed at
  newItem: 2,    // each new Collection item
  theme: 5,      // all four items of a theme found
  perHappy: 5,   // +1 at closing for every this many happy customers
};

export const decorOption = (kind, id) => DECOR[kind].find((o) => o.id === id) ?? null;

/** A room's style ids: its defaults, then what the player chose (room.decor), then a preview on top. */
export function roomDecor(room, preview = null) {
  const style = room.style != null ? ROOM_STYLES[room.style % ROOM_STYLES.length] : null;
  return { ...BASE, ...ROOM_TYPES[room.type].decor, ...style, ...room.decor, ...preview };
}

/** A room's look for drawing: each style id turned into its option (paper colours, floor, ...). */
export function roomLook(room, preview = null) {
  const ids = roomDecor(room, preview);
  const look = {};
  for (const kind of Object.keys(DECOR)) look[kind] = decorOption(kind, ids[kind]) ?? DECOR[kind][0];
  return look;
}
