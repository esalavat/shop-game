// Products sold in the shop. Orders come as boxes of `perBox` items.
//   cost:    what you pay the supplier per item
//   price:   what customers pay per item (used once customers arrive)
//   model:   which builder in render/models/items.js draws it
//   set:     Collection album theme it belongs to (SETS)
//   page:    order book catalog page it's on (PAGES); fancier pages open as you collect (GDD #66)
//   kind:    what sort of thing it is, for Dream Dollhouse slots (data/dollhouse.js)
//   sparkle: how much Sparkle it adds when placed in the Dream Dollhouse (more special = more)
// Each page has one item per theme. Prices and Sparkle are first guesses, tunable here.

export const ITEMS = {
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

/** Collection album themes. */
export const SETS = {
  tea: 'Tea Time', parlor: 'Cozy Parlor', fairy: 'Fairy Garden', bedroom: 'Sweet Dreams', dolls: 'Doll Friends', houses: 'Little Houses',
};

/** Order book catalog pages (GDD #66): each opens once you've found `opensAt` items for your Collection. */
export const PAGES = [
  { name: 'Starter', icon: '🌱', opensAt: 0 },
  { name: 'Favorites', icon: '💖', opensAt: 4 },
  { name: 'Fancy Finds', icon: '🎀', opensAt: 10 },
  { name: 'Treasures', icon: '👑', opensAt: 16 },
];

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
  giftStep: 50,    // ...and this much more for each one after
};
