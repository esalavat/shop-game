// Things to buy in the Grow sheet besides rooms: one-time upgrades and helpers (GDD #36, #37).
// Costs are first guesses, to tune with playtest feedback.

export const UPGRADES = {
  cart: { name: 'Stock Cart', icon: '🛒', cost: 60, desc: 'Carry two boxes at once, so restocking takes half the walking.' },
  shoes: { name: 'Comfy Shoes', icon: '👟', cost: 80, desc: 'Bouncy new shoes: your shopkeeper walks faster.' },
  lunch: { name: 'Lunchtime Delivery', icon: '🥪', cost: 100, desc: 'Pip comes at midday too. Order before lunch and it arrives halfway through the day.' },
  // GDD #60: only listed once Bea is hired and a theme room is built (ui/grow.js).
  sorting: { name: 'Sorting Smarts', icon: '🗂️', cost: 120, desc: 'Bea puts each box in its matching theme room, so more things earn the theme bonus.' },
};

export const SHOES_SPEED = 1.4; // walking speed multiplier with Comfy Shoes

export const HELPERS = {
  cashier: {
    name: 'Mia', job: 'Cashier', icon: '🛎️', cost: 150,
    desc: 'Mia rings customers up for you, nice and steady. Step behind the counter any time to do it yourself (and get the tips).',
    look: { hair: 'pigtails', hairColor: '#2e2430', skin: '#b97a56', outfit: '#c8b6ff', accessory: 'bow' },
    scanTime: 0.9,  // seconds per item she scans
    ringTime: 0.8,  // seconds to ring up once everything is scanned
  },
  stocker: {
    name: 'Bea', job: 'Stocker', icon: '📦', cost: 200,
    desc: 'Bea carries boxes from the doorstep and fills the shelves, wished-for items first. Grab a box yourself any time.',
    look: { hair: 'ponytail', hairColor: '#e0a84a', skin: '#f1c7a5', outfit: '#ffb38a', accessory: 'glasses' },
    speed: 1.2,      // walking speed (the shopkeeper's is 1.7)
    pause: 0.45,     // seconds she takes to pick up a box or start unpacking
  },
};
