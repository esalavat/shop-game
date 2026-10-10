// The Dream Dollhouse in the Window Display: a two-storey house with four rooms, one slot each.
//   cell: [column, storey] inside the house (0 = left / downstairs, 1 = right / upstairs)
//   fits: item kinds (ITEMS[id].kind) that can go there

export const DOLLHOUSE_SLOTS = [
  { id: 'bedroom', name: 'Bedroom', icon: '🛏️', cell: [0, 1], fits: ['bed', 'friend', 'light'] },
  { id: 'playroom', name: 'Playroom', icon: '🧸', cell: [1, 1], fits: ['toy', 'friend', 'light'] },
  { id: 'parlor', name: 'Parlor', icon: '🛋️', cell: [0, 0], fits: ['seat', 'friend', 'light'] },
  { id: 'tearoom', name: 'Tea Room', icon: '🫖', cell: [1, 0], fits: ['table', 'seat', 'light'] },
];

export const SPARKLE = {
  fullHouse: 5,       // bonus when every room has something in it
  // Visitors arrive (1 + trafficMore × Sparkle / (Sparkle + trafficHalf)) times as often: more Sparkle always
  // helps, a little less each time, never past ×(1 + trafficMore) (§18 #10).
  trafficMore: 1.2,
  trafficHalf: 150,   // the Sparkle that gives half of trafficMore
  peekBase: 0.25,     // chance a visitor stops at the window first, once anything is on show...
  peekPer: 1 / 60,    // ...plus this much per Sparkle...
  peekMax: 0.7,       // ...up to this
  peekWant: 0.5,      // chance a window-peeker then wants something from the dollhouse
  // While the shopkeeper is in the Window Display showing it off (GDD #41):
  keeperPeek: 0.2,    // ...this much more chance to stop at the window (up to keeperPeekMax)
  keeperPeekMax: 0.85,
  keeperPeekWant: 0.8, // ...and this chance they want something they saw
  peekTime: [1.6, 2.4], // seconds spent looking in the window
  peekOffset: [0.7, 1.15], // how far to the side of the window's middle they stand, so the dollhouse stays in view
};

/** Shop expansions, in the order they unlock. */
export const EXPANSIONS = [
  { type: 'display', cost: 100 },
];
