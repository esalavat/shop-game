// Who visits the shop and how they look and behave.

export const CUSTOMER = {
  speed: 1.1,               // walking speed indoors (room units / s); the shopkeeper is quicker
  streetSpeed: 1.6,         // a brisker stroll along the sidewalk
  maxInShop: 5,             // counts people walking in and out along the street too
  perRoom: 2,
  patience: 150,            // seconds in the shop before they give up on the rest of their list (a backstop: never stuck)          // room for this many more with each shelf room built (GDD #58)
  spawnEvery: [6, 12],      // seconds between visitors (random in range)
  spawnEveryEmpty: [14, 22],// slower while the shelves are bare
  browseTime: [1.4, 2.8],   // seconds spent looking at a shelf
  wantsStocked: 0.75,       // chance the first wish is something already on the shelves
  secondItem: 0.3,          // chance they want a second thing
  tip: [0.05, 0.15],        // tip when you ring them up yourself: this share of what they paid, at random, at least 1 (GDD #85)
  kidChance: 0.35,
  greetedSecondItem: 0.6,   // chance a customer the shopkeeper greets at the door picks up a second thing (GDD #41)
};

export const LOOKS = {
  outfits: ['#ff9ec4', '#c8b6ff', '#9fe0c8', '#ffd98a', '#a8d8ff', '#ffb8a0', '#f7a8d8', '#b8e6a0'],
  hairColors: ['#6b3e2e', '#2e2430', '#f2c46b', '#c2563a', '#8a5a3c', '#e8d0a8', '#b07ad8'],
  skins: ['#ffd9c2', '#f5c4a0', '#e0a37c', '#b97a56', '#8d5a3c'],
  hair: ['bob', 'bun', 'pigtails', 'ponytail'],
};

export const ADULT_SCALE = 1.15;
export const KID_SCALE = 0.9;

/**
 * Shopkeeper styles you get by completing a theme in the Collection (GDD #70), for girls and boys:
 * theme (SETS in data/items.js) -> [creator row, value, name]. Locked until then (sim/rewards.js).
 */
export const THEME_LOOKS = {
  tea: ['outfit', '#ff6f8e', 'Strawberry outfit'],
  parlor: ['outfit', '#9466c4', 'Plum Velvet outfit'],
  fairy: ['accessory', 'flowers', 'Flower Crown'],
  bedroom: ['outfit', '#5f6fcf', 'Starry Night outfit'],
  dolls: ['accessory', 'bunny', 'Bunny Ears'],
  houses: ['accessory', 'crown', 'Royal Crown'],
  // Bolder ones for the color rounds' themes (GDD #77)
  tea2: ['outfit', '#ff2d6f', 'Hot Strawberry outfit'],
  parlor2: ['outfit', '#8a3ffc', 'Grape Soda outfit'],
  fairy2: ['accessory', 'flowers2', 'Sunset Flower Crown'],
  bedroom2: ['outfit', '#2f6bff', 'Electric Night outfit'],
  dolls2: ['accessory', 'bunny2', 'Candy Bunny Ears'],
  houses2: ['accessory', 'crown2', 'Ruby Crown'],
  tea3: ['outfit', '#b0124f', 'Ruby outfit'],
  parlor3: ['outfit', '#3b2470', 'Midnight Velvet outfit'],
  fairy3: ['accessory', 'flowers3', 'Jewel Flower Crown'],
  bedroom3: ['outfit', '#26215e', 'Galaxy outfit'],
  dolls3: ['accessory', 'bunny3', 'Midnight Bunny Ears'],
  houses3: ['accessory', 'crown3', 'Diamond Crown'],
  // Sweet Shop and Pet Corner (GDD #79)
  sweets: ['outfit', '#ff8fd0', 'Cotton Candy outfit'],
  sweets2: ['outfit', '#8fe03a', 'Sour Apple outfit'],
  sweets3: ['outfit', '#6b3a2a', 'Chocolate Truffle outfit'],
  pets: ['accessory', 'kitty', 'Kitty Ears'],
  pets2: ['accessory', 'kitty2', 'Ginger Kitty Ears'],
  pets3: ['accessory', 'kitty3', 'Silver Kitty Ears'],
};
const REWARD_ACCESSORIES = [
  ['flowers', 'Flower crown 🌸'], ['bunny', 'Bunny ears 🐰'], ['crown', 'Crown 👑'],
  ['flowers2', 'Sunset crown 🌺'], ['bunny2', 'Candy ears 🐰'], ['crown2', 'Ruby crown 👑'],
  ['flowers3', 'Jewel crown 💐'], ['bunny3', 'Midnight ears 🐰'], ['crown3', 'Diamond crown 💎'],
  ['kitty', 'Kitty ears 🐱'], ['kitty2', 'Ginger ears 🐱'], ['kitty3', 'Silver ears 🐱'],
];

/** Choices in the shopkeeper creator (ui/creator.js). */
export const CREATOR = {
  bodies: [['girl', 'Girl 👧'], ['boy', 'Boy 👦']], // GDD #43: the first choice
  hair: {
    girl: [['bob', 'Bob'], ['bun', 'Bun'], ['pigtails', 'Pigtails'], ['ponytail', 'Ponytail']],
    boy: [['short', 'Short'], ['spiky', 'Spiky'], ['curly', 'Curly'], ['swoop', 'Swoop']],
  },
  hairColors: LOOKS.hairColors,
  skins: LOOKS.skins,
  outfits: [...LOOKS.outfits, ...Object.values(THEME_LOOKS).filter(([row]) => row === 'outfit').map(([, c]) => c)],
  accessories: {
    girl: [['none', 'None'], ['bow', 'Bow 🎀'], ['glasses', 'Glasses 👓'], ['hat', 'Sun hat 👒'], ...REWARD_ACCESSORIES],
    boy: [['none', 'None'], ['bowtie', 'Bow tie 🎀'], ['glasses', 'Glasses 👓'], ['cap', 'Cap 🧢'], ...REWARD_ACCESSORIES],
  },
};
