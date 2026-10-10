// Products sold in the shop. Orders come as boxes of `perBox` items.
//   cost:    what you pay the supplier per item
//   price:   what customers pay per item (used once customers arrive)
//   model:   which builder in render/models/items.js draws it
//   set:     Collection album theme it belongs to (SETS)
//   page:    order book catalog page it's on (PAGES); fancier pages open as you collect (GDD #66)
//   kind:    what sort of thing it is, for Dream Dollhouse slots (data/dollhouse.js)
//   sparkle: how much Sparkle it adds when placed in the Dream Dollhouse (more special = more)
//   round:   which color round it's from (ROUNDS, GDD #77); base: the round-1 item it's a color of
// Each page has one item per theme. Prices and Sparkle are first guesses, tunable here.
// BASE lists round 1; ITEMS adds each one's Bright and Dazzle colors (COLORS) at ×16 prices a round.

const BASE = {
  // Page 1: Starter (box profit 12-18)
  teaset: { name: 'Tiny Tea Set', model: 'teaset', color: '#ff9ec4', cost: 6, price: 10, perBox: 3, set: 'tea', page: 0, kind: 'table', sparkle: 3 },
  chair: { name: 'Cozy Chair', model: 'chair', color: '#9fe0c8', cost: 8, price: 14, perBox: 3, set: 'parlor', page: 0, kind: 'seat', sparkle: 4 },
  lamp: { name: 'Mushroom Lamp', model: 'lamp', color: '#ff8f8f', cost: 8, price: 14, perBox: 3, set: 'fairy', page: 0, kind: 'light', sparkle: 4 },
  nightlight: { name: 'Star Nightlight', model: 'nightlight', color: '#ffd98a', cost: 6, price: 10, perBox: 3, set: 'bedroom', page: 0, kind: 'light', sparkle: 3 },
  teddy: { name: 'Teddy Bear', model: 'teddy', color: '#d9a67a', cost: 7, price: 12, perBox: 3, set: 'dolls', page: 0, kind: 'friend', sparkle: 3 },
  birdhouse: { name: 'Tiny Birdhouse', model: 'birdhouse', color: '#a8d8ff', cost: 6, price: 10, perBox: 3, set: 'houses', page: 0, kind: 'toy', sparkle: 3 },
  // Page 2: Favorites (box profit 21-32)
  cupcakes: { name: 'Cupcake Stand', model: 'cupcakes', color: '#ffb8d9', cost: 10, price: 17, perBox: 3, set: 'tea', page: 1, kind: 'table', sparkle: 4 },
  rocker: { name: 'Rocking Chair', model: 'rocker', color: '#ffd98a', cost: 11, price: 19, perBox: 3, set: 'parlor', page: 1, kind: 'seat', sparkle: 5 },
  swing: { name: 'Fairy Swing', model: 'swing', color: '#c8f0b0', cost: 11, price: 19, perBox: 3, set: 'fairy', page: 1, kind: 'toy', sparkle: 5 },
  bed: { name: 'Rosy Bed', model: 'bed', color: '#c8b6ff', cost: 10, price: 18, perBox: 3, set: 'bedroom', page: 1, kind: 'bed', sparkle: 5 },
  doll: { name: 'Petal Doll', model: 'doll', color: '#ffd98a', cost: 12, price: 20, perBox: 3, set: 'dolls', page: 1, kind: 'friend', sparkle: 6 },
  cottage: { name: 'Cottage Dollhouse', model: 'cottage', color: '#ffb8a0', cost: 24, price: 40, perBox: 2, set: 'houses', page: 1, kind: 'toy', sparkle: 10 },
  // Page 3: Fancy Finds (box profit 36-56)
  trolley: { name: 'Tea Trolley', model: 'trolley', color: '#9fe0c8', cost: 26, price: 44, perBox: 2, set: 'tea', page: 2, kind: 'table', sparkle: 11 },
  sofa: { name: 'Velvet Sofa', model: 'sofa', color: '#b48bd6', cost: 30, price: 50, perBox: 2, set: 'parlor', page: 2, kind: 'seat', sparkle: 12 },
  lantern: { name: 'Firefly Lantern', model: 'lantern', color: '#8fd19e', cost: 28, price: 48, perBox: 2, set: 'fairy', page: 2, kind: 'light', sparkle: 12 },
  canopy: { name: 'Canopy Bed', model: 'canopy', color: '#ffb8d9', cost: 34, price: 58, perBox: 2, set: 'bedroom', page: 2, kind: 'bed', sparkle: 14 },
  bunnies: { name: 'Bunny Family', model: 'bunnies', color: '#fff6ee', cost: 32, price: 54, perBox: 2, set: 'dolls', page: 2, kind: 'friend', sparkle: 13 },
  treehouse: { name: 'Treehouse', model: 'treehouse', color: '#d7a877', cost: 40, price: 68, perBox: 2, set: 'houses', page: 2, kind: 'toy', sparkle: 17 },
  // Page 4: Treasures (box profit 70-120)
  caketower: { name: 'Royal Cake Tower', model: 'caketower', color: '#ff9ec4', cost: 50, price: 85, perBox: 2, set: 'tea', page: 3, kind: 'table', sparkle: 20 },
  piano: { name: 'Grand Piano', model: 'piano', color: '#fff6ee', cost: 60, price: 100, perBox: 2, set: 'parlor', page: 3, kind: 'toy', sparkle: 24 },
  carousel: { name: 'Unicorn Carousel', model: 'carousel', color: '#c8b6ff', cost: 65, price: 110, perBox: 2, set: 'fairy', page: 3, kind: 'toy', sparkle: 26 },
  cloudbed: { name: 'Cloud Princess Bed', model: 'cloudbed', color: '#a8d8ff', cost: 70, price: 120, perBox: 2, set: 'bedroom', page: 3, kind: 'bed', sparkle: 28 },
  princess: { name: 'Porcelain Princess', model: 'princess', color: '#c8b6ff', cost: 55, price: 95, perBox: 2, set: 'dolls', page: 3, kind: 'friend', sparkle: 22 },
  castle: { name: 'Castle Dollhouse', model: 'castle', color: '#ffb8d9', cost: 90, price: 150, perBox: 2, set: 'houses', page: 3, kind: 'toy', sparkle: 35 },
};

/**
 * Color rounds (GDD #77): after round 1, every item comes back in a bolder color. Each round starts
 * the catalog pages over once you've found `opensAt` items, with prices `mult` times round 1's.
 */
export const ROUNDS = [
  { name: '', opensAt: 0, mult: 1 },
  { name: 'Bright', icon: '🌈', opensAt: 24, mult: 16 },
  { name: 'Dazzle', icon: '💎', opensAt: 48, mult: 256 },
];

/** The colors items come in, by name. */
export const PAINTS = {
  'Hot Pink': '#ff3d8b', Tangerine: '#ff8a2b', Lime: '#9be22d', 'Electric Blue': '#2f8cff',
  Turquoise: '#19c6c6', Violet: '#9b4dff', Sunshine: '#ffd21f', Cherry: '#ff3b3b',
  Gold: '#e8b923', Ruby: '#c2185b', Emerald: '#1fa36b', Sapphire: '#2546b8',
  Midnight: '#2b2d6e', Amethyst: '#7b3fc4', Silver: '#c9cfd8', 'Rose Gold': '#e7a08f',
};

/** Each item's Bright and Dazzle colors (rounds 2 and 3). */
const COLORS = {
  teaset: ['Tangerine', 'Gold'], chair: ['Hot Pink', 'Sapphire'], lamp: ['Violet', 'Emerald'],
  nightlight: ['Electric Blue', 'Amethyst'], teddy: ['Lime', 'Rose Gold'], birdhouse: ['Cherry', 'Midnight'],
  cupcakes: ['Turquoise', 'Ruby'], rocker: ['Hot Pink', 'Emerald'], swing: ['Sunshine', 'Amethyst'],
  bed: ['Lime', 'Ruby'], doll: ['Electric Blue', 'Rose Gold'], cottage: ['Turquoise', 'Sapphire'],
  trolley: ['Cherry', 'Gold'], sofa: ['Tangerine', 'Emerald'], lantern: ['Violet', 'Gold'],
  canopy: ['Electric Blue', 'Midnight'], bunnies: ['Hot Pink', 'Silver'], treehouse: ['Lime', 'Amethyst'],
  caketower: ['Sunshine', 'Sapphire'], piano: ['Cherry', 'Midnight'], carousel: ['Tangerine', 'Silver'],
  cloudbed: ['Sunshine', 'Rose Gold'], princess: ['Turquoise', 'Ruby'], castle: ['Violet', 'Gold'],
};

const THEMES = {
  tea: 'Tea Time', parlor: 'Cozy Parlor', fairy: 'Fairy Garden', bedroom: 'Sweet Dreams', dolls: 'Doll Friends', houses: 'Little Houses',
};

/** The theme id for a round: 'tea', then 'tea2', 'tea3'. */
export const themeId = (set, round) => (round ? `${set}${round + 1}` : set);

/** Collection album themes, round by round (GDD #77): 'tea' Tea Time, 'tea2' Tea Time ✦ Bright, ... */
export const SETS = {};
ROUNDS.forEach((r, round) => {
  for (const [set, name] of Object.entries(THEMES)) SETS[themeId(set, round)] = round ? `${name} ✦ ${r.name}` : name;
});
/** Which round a theme is from. */
export const setRound = (set) => (/\d$/.test(set) ? Number(set.at(-1)) - 1 : 0);

/** Every item: round 1 as listed, then each round's colors ('teaset2', 'teaset3', ...). */
export const ITEMS = {};
ROUNDS.forEach((r, round) => {
  for (const [id, item] of Object.entries(BASE)) {
    if (!round) { ITEMS[id] = { ...item, round: 0, base: id }; continue; }
    const paint = COLORS[id][round - 1];
    ITEMS[themeId(id, round)] = {
      ...item, name: `${paint} ${item.name}`, color: PAINTS[paint], cost: item.cost * r.mult, price: item.price * r.mult,
      set: themeId(item.set, round), round, base: id,
    };
  }
});

/** An item's colors, round by round: ['teaset', 'teaset2', 'teaset3']. */
export const colorsOf = (id) => ROUNDS.map((r, round) => themeId(ITEMS[id].base, round));

/** Order book catalog pages (GDD #66): each opens once you've found `opensAt` items for your Collection. */
export const PAGES = [
  { name: 'Starter', icon: '🌱', opensAt: 0 },
  { name: 'Favorites', icon: '💖', opensAt: 4 },
  { name: 'Fancy Finds', icon: '🎀', opensAt: 10 },
  { name: 'Treasures', icon: '👑', opensAt: 16 },
];

/**
 * Every page of every round, in the order they open: the catalog's steps. An item is on step
 * `round * PAGES.length + page`.
 */
export const STEPS = ROUNDS.flatMap((r, round) => PAGES.map((p, page) => ({ round, page, opensAt: r.opensAt + p.opensAt })));
export const stepOf = (id) => ITEMS[id].round * PAGES.length + ITEMS[id].page;

export const boxCost = (itemId) => ITEMS[itemId].cost * ITEMS[itemId].perBox;
/** What a whole box earns once every item sells (before tips). */
export const boxProfit = (itemId) => (ITEMS[itemId].price - ITEMS[itemId].cost) * ITEMS[itemId].perBox;

/**
 * The Collection pays off (GDD #70): more visitors for every item found and theme complete (added to
 * Sparkle's boost), and a coin gift for each theme you complete, bigger each time.
 */
export const COLLECTION = {
  perItem: 0.02,   // +2% visitors per item found
  perTheme: 0.05,  // +5% more per complete theme
  maxBonus: 0.5,   // up to +50%
  giftFirst: 100,  // coins for the first theme you complete...
  giftStep: 50,    // ...and this much more for each one after (both × the round's price `mult`, GDD #77)
};
