// Products sold in the shop. Orders come as boxes of `perBox` items.
//   cost:  what you pay the supplier per item
//   price: what customers pay per item (used once customers arrive)
//   model: which builder in render/models/items.js draws it
//   set:   Collection album page it belongs to

export const ITEMS = {
  teaset: { name: 'Tiny Tea Set', model: 'teaset', color: '#ff9ec4', cost: 6, price: 10, perBox: 3, set: 'tea' },
  chair: { name: 'Cozy Chair', model: 'chair', color: '#9fe0c8', cost: 8, price: 14, perBox: 3, set: 'parlor' },
  lamp: { name: 'Mushroom Lamp', model: 'lamp', color: '#ff8f8f', cost: 8, price: 14, perBox: 3, set: 'fairy' },
  bed: { name: 'Rosy Bed', model: 'bed', color: '#c8b6ff', cost: 10, price: 18, perBox: 3, set: 'bedroom' },
  doll: { name: 'Petal Doll', model: 'doll', color: '#ffd98a', cost: 12, price: 20, perBox: 3, set: 'dolls' },
  cottage: { name: 'Cottage Dollhouse', model: 'cottage', color: '#ffb8a0', cost: 24, price: 40, perBox: 2, set: 'houses' },
};

export const boxCost = (itemId) => ITEMS[itemId].cost * ITEMS[itemId].perBox;
