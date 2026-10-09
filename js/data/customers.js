// Who visits the shop and how they look and behave.

export const CUSTOMER = {
  speed: 1.1,               // walking speed indoors (room units / s); the shopkeeper is quicker
  streetSpeed: 1.6,         // a brisker stroll along the sidewalk
  maxInShop: 5,             // counts people walking in and out along the street too
  perThemeRoom: 2,          // room for this many more with each theme room built (GDD #58)
  spawnEvery: [6, 12],      // seconds between visitors (random in range)
  spawnEveryEmpty: [14, 22],// slower while the shelves are bare
  browseTime: [1.4, 2.8],   // seconds spent looking at a shelf
  wantsStocked: 0.75,       // chance the first wish is something already on the shelves
  secondItem: 0.3,          // chance they want a second thing
  tip: [1, 3],              // coins tipped when you ring them up yourself
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

/** Choices in the shopkeeper creator (ui/creator.js). */
export const CREATOR = {
  bodies: [['girl', 'Girl 👧'], ['boy', 'Boy 👦']], // GDD #43: the first choice
  hair: {
    girl: [['bob', 'Bob'], ['bun', 'Bun'], ['pigtails', 'Pigtails'], ['ponytail', 'Ponytail']],
    boy: [['short', 'Short'], ['spiky', 'Spiky'], ['curly', 'Curly'], ['swoop', 'Swoop']],
  },
  hairColors: LOOKS.hairColors,
  skins: LOOKS.skins,
  outfits: LOOKS.outfits,
  accessories: {
    girl: [['none', 'None'], ['bow', 'Bow 🎀'], ['glasses', 'Glasses 👓'], ['hat', 'Sun hat 👒']],
    boy: [['none', 'None'], ['bowtie', 'Bow tie 🎀'], ['glasses', 'Glasses 👓'], ['cap', 'Cap 🧢']],
  },
};
