// Products sold in the shop. Orders come as boxes of `perBox` items.
//   cost:    what you pay the supplier per item
//   price:   what customers pay per item (used once customers arrive)
//   model:   which builder in render/models/items.js draws it
//   set:     Collection album theme it belongs to (SETS)
//   kind:    what sort of thing it is, for Dream Dollhouse slots (data/dollhouse.js)
//   sparkle: how much Sparkle it adds when placed in the Dream Dollhouse (more special = more)

export const ITEMS = {
  teaset: { name: 'Tiny Tea Set', model: 'teaset', color: '#ff9ec4', cost: 6, price: 10, perBox: 3, set: 'tea', kind: 'table', sparkle: 3 },
  chair: { name: 'Cozy Chair', model: 'chair', color: '#9fe0c8', cost: 8, price: 14, perBox: 3, set: 'parlor', kind: 'seat', sparkle: 4 },
  lamp: { name: 'Mushroom Lamp', model: 'lamp', color: '#ff8f8f', cost: 8, price: 14, perBox: 3, set: 'fairy', kind: 'light', sparkle: 4 },
  bed: { name: 'Rosy Bed', model: 'bed', color: '#c8b6ff', cost: 10, price: 18, perBox: 3, set: 'bedroom', kind: 'bed', sparkle: 5 },
  doll: { name: 'Petal Doll', model: 'doll', color: '#ffd98a', cost: 12, price: 20, perBox: 3, set: 'dolls', kind: 'friend', sparkle: 6 },
  cottage: { name: 'Cottage Dollhouse', model: 'cottage', color: '#ffb8a0', cost: 24, price: 40, perBox: 2, set: 'houses', kind: 'toy', sparkle: 10 },
};

/** Collection album themes. */
export const SETS = {
  tea: 'Tea Time', parlor: 'Cozy Parlor', fairy: 'Fairy Garden', bedroom: 'Sweet Dreams', dolls: 'Doll Friends', houses: 'Little Houses',
};

export const boxCost = (itemId) => ITEMS[itemId].cost * ITEMS[itemId].perBox;
/** What a whole box earns once every item sells (before tips). */
export const boxProfit = (itemId) => (ITEMS[itemId].price - ITEMS[itemId].cost) * ITEMS[itemId].perBox;
