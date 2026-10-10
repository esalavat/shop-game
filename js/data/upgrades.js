// Things to buy in the Grow sheet besides rooms: one-time upgrades and helpers (GDD #36, #37).
// They come as a ladder (GDD #83): each appears once you've made `hearts` customers happy (state.hearts,
// all time) and costs about 1.4-1.5× the one before, so they arrive a couple of days apart.

export const UPGRADES = {
  cart: { name: 'Stock Cart', icon: '🛒', cost: 60, hearts: 0, desc: 'Carry two boxes at once, so restocking takes half the walking.' },
  shoes: { name: 'Comfy Shoes', icon: '👟', cost: 80, hearts: 5, desc: 'Bouncy new shoes: your shopkeeper walks faster.' },
  lunch: { name: 'Lunchtime Delivery', icon: '🥪', cost: 360, hearts: 40, desc: 'Pip comes at midday too. Order before lunch and it arrives halfway through the day.' },
  scanner: { name: 'Speedy Scanner', icon: '⚡', cost: 720, hearts: 85, desc: 'Each tap at the register scans two items, and cashiers scan faster too.' },
  tall: { name: 'Tall Shelves', icon: '📚', cost: 2000, hearts: 225, desc: 'Every shelf gets a row on top: room for 12 things instead of 9, so you restock less often.' },
  skates: { name: 'Roller Skates', icon: '🛼', cost: 1400, hearts: 160, needs: 'stocker', desc: 'Roller skates for your stockers: they zip boxes from the doorstep to the shelves much faster.' },
  giftwrap: { name: 'Gift Wrap', icon: '🎁', cost: 240, hearts: 25, desc: 'Pretty wrapping paper: tips are twice as big when you ring people up yourself.' },
};

export const SCANNER = { perTap: 2, helperSpeed: 0.6 }; // Speedy Scanner: items per tap; cashiers' scan time × this
export const GIFT_WRAP_TIPS = 2;                          // Gift Wrap: tips × this

export const SHOES_SPEED = 1.4;  // walking speed multiplier with Comfy Shoes (your shopkeeper only)
export const SKATES_SPEED = 1.4; // stockers' walking speed multiplier with Roller Skates (GDD #76)

export const HELPERS = {
  cashier: {
    name: 'Mia', job: 'Cashier', icon: '🛎️', cost: 160, hearts: 15,
    desc: 'Mia rings customers up for you, nice and steady. Step behind the counter any time to do it yourself (and get the tips).',
    look: { hair: 'pigtails', hairColor: '#2e2430', skin: '#b97a56', outfit: '#c8b6ff', accessory: 'bow' },
    scanTime: 0.9,  // seconds per item she scans
    ringTime: 0.8,  // seconds to ring up once everything is scanned
  },
  stocker: {
    name: 'Bea', job: 'Stocker', icon: '📦', cost: 520, hearts: 60,
    desc: 'Bea carries boxes from the doorstep and fills the shelves, wished-for items first. Grab a box yourself any time.',
    look: { hair: 'ponytail', hairColor: '#e0a84a', skin: '#f1c7a5', outfit: '#ffb38a', accessory: 'glasses' },
    speed: 1.2,      // walking speed (the shopkeeper's is 1.7)
    pause: 0.45,     // seconds she takes to pick up a box or start unpacking
  },
  // More stockers (GDD #72), each after the one before; they work just like Bea.
  stocker2: {
    name: 'Theo', job: 'Stocker', icon: '📦', cost: 4800, hearts: 425, needs: 'stocker',
    desc: 'Another pair of hands for the boxes. Theo and Bea never grab the same one.',
    look: { hair: 'swoop', hairColor: '#6b3e2e', skin: '#8d5a3c', outfit: '#a8d8ff', accessory: 'bowtie' },
  },
  stocker3: {
    name: 'Juno', job: 'Stocker', icon: '📦', cost: 12000, hearts: 650, needs: 'stocker2',
    desc: 'For a really big shop: Juno joins Bea and Theo filling shelves on every floor.',
    look: { hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#b8e6a0', accessory: 'bow' },
  },
  // GDD #72: they stand at the bonus spots, so your shopkeeper doesn't have to.
  greeter: {
    name: 'Ollie', job: 'Greeter', icon: '👋', cost: 1000, hearts: 120,
    desc: 'Ollie waits by the door and says hello to everyone who comes in. Greeted customers often pick up a second thing.',
    look: { hair: 'curly', hairColor: '#8a5a3c', skin: '#e0a37c', outfit: '#9fe0c8', accessory: 'cap' },
  },
  dresser: {
    name: 'Rosa', job: 'Window Dresser', icon: '🪟', cost: 3000, hearts: 300, needs: 'display',
    desc: 'Rosa shows off your Dream Dollhouse in the Window Display, so more people stop to look and want what they see.',
    look: { hair: 'bob', hairColor: '#2e2430', skin: '#ffd9c2', outfit: '#f7a8d8', accessory: 'hat' },
  },
};

/** The cashiers who come with register rooms (GDD #73), floor by floor; the list repeats if you build more. */
export const REGISTER_CASHIERS = [
  { name: 'Kai', look: { hair: 'short', hairColor: '#2e2430', skin: '#e0a37c', outfit: '#a8d8ff', accessory: 'bowtie' } },
  { name: 'Nell', look: { hair: 'ponytail', hairColor: '#f2c46b', skin: '#ffd9c2', outfit: '#ffb8a0', accessory: 'none' } },
  { name: 'Remy', look: { hair: 'curly', hairColor: '#6b3e2e', skin: '#8d5a3c', outfit: '#b8e6a0', accessory: 'glasses' } },
  { name: 'Ivy', look: { hair: 'bun', hairColor: '#b07ad8', skin: '#f5c4a0', outfit: '#c8b6ff', accessory: 'bow' } },
];
