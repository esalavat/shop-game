// The whole game state: one plain, JSON-serializable object.
// Bump STATE_VERSION and add a migration in core/save.js whenever its shape changes.

export const STATE_VERSION = 1;

export function createState(now = Date.now()) {
  return {
    version: STATE_VERSION,
    day: { number: 1, phase: 'morning' },
    coins: 50,
    hearts: 0,
    sparkle: 0,
    building: {
      rooms: [{ id: 'r1', type: 'shop', col: 0, floor: 0 }],
    },
    shopkeeper: { hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#9fe0c8' },
    settings: { muted: false },
    lastSeen: now,
  };
}
