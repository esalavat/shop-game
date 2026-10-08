// The whole game state: one plain, JSON-serializable object.
// Bump STATE_VERSION and add a migration in core/save.js whenever its shape changes.

import { makeRoom } from './building.js';
import { createKeeper } from './keeper.js';

export const STATE_VERSION = 2;

export function createState(now = Date.now()) {
  return {
    version: STATE_VERSION,
    day: { number: 1, phase: 'morning' },
    coins: 50,
    hearts: 0,
    sparkle: 0,
    building: {
      rooms: [makeRoom('r1', 'shop', 0, 0)],
    },
    keeper: createKeeper('r1'),
    shopkeeper: { hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#9fe0c8' },
    settings: { muted: false },
    lastSeen: now,
  };
}
