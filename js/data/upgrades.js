// Things to buy in the Grow sheet besides rooms: one-time upgrades and helpers (GDD #36, #37).
// Costs are first guesses, to tune with playtest feedback.

export const UPGRADES = {
  cart: { name: 'Stock Cart', icon: '🛒', cost: 60, desc: 'Carry two boxes at once, so restocking takes half the walking.' },
  shoes: { name: 'Comfy Shoes', icon: '👟', cost: 80, desc: 'Bouncy new shoes: your shopkeeper walks faster.' },
  lunch: { name: 'Lunchtime Delivery', icon: '🥪', cost: 100, desc: 'Pip comes at midday too. Order before lunch and it arrives halfway through the day.' },
  scanner: { name: 'Speedy Scanner', icon: '⚡', cost: 120, desc: 'Each tap at the register scans two items, and cashiers scan faster too.' },
  tall: { name: 'Tall Shelves', icon: '📚', cost: 250, desc: 'Every shelf gets a row on top: room for 12 things instead of 9, so you restock less often.' },
  giftwrap: { name: 'Gift Wrap', icon: '🎁', cost: 150, desc: 'Pretty wrapping paper: tips are twice as big when you ring people up yourself.' },
};

export const SCANNER = { perTap: 2, helperSpeed: 0.6 }; // Speedy Scanner: items per tap; cashiers' scan time × this
export const GIFT_WRAP_TIPS = 2;                          // Gift Wrap: tips × this

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
  // GDD #72: they stand at the bonus spots, so your shopkeeper doesn't have to.
  greeter: {
    name: 'Ollie', job: 'Greeter', icon: '👋', cost: 250,
    desc: 'Ollie waits by the door and says hello to everyone who comes in. Greeted customers often pick up a second thing.',
    look: { hair: 'curly', hairColor: '#8a5a3c', skin: '#e0a37c', outfit: '#9fe0c8', accessory: 'cap' },
  },
  dresser: {
    name: 'Rosa', job: 'Window Dresser', icon: '🪟', cost: 300, needs: 'display',
    desc: 'Rosa shows off your Dream Dollhouse in the Window Display, so more people stop to look and want what they see.',
    look: { hair: 'bob', hairColor: '#2e2430', skin: '#ffd9c2', outfit: '#f7a8d8', accessory: 'hat' },
  },
};
