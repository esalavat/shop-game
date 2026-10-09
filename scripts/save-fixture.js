// Writes tests/fixtures/saves/v<STATE_VERSION>.json: a well-progressed shop saved by the current
// code. tests/saves.test.js loads every one of these with the latest code, so a save from any
// released version must keep loading with its progress intact (docs/TECH.md §9.4).
//
// Run it right after bumping STATE_VERSION (and adding the migration). Older fixtures are never
// rewritten: they stand for real saves already on players' phones.
//
// Usage: node scripts/save-fixture.js

import { existsSync, writeFileSync } from 'node:fs';
import { createState, STATE_VERSION, TRANSIENT } from '../js/sim/state.js';
import { addCoins } from '../js/sim/economy.js';
import { buildExpansion, buildThemeRoom, roomSpots } from '../js/sim/building.js';
import { buyUpgrade, hireHelper } from '../js/sim/upgrades.js';
import { placeInDollhouse } from '../js/sim/collection.js';
import { placeOrder } from '../js/sim/orders.js';
import { createStocker } from '../js/sim/stocker.js';
import { ITEMS } from '../js/data/items.js';
import { UPGRADES, HELPERS } from '../js/data/upgrades.js';

const path = `tests/fixtures/saves/v${STATE_VERSION}.json`;
if (existsSync(path)) {
  console.error(`${path} already exists; fixtures are never rewritten.`);
  process.exit(1);
}

const s = createState(Date.UTC(2026, 9, 9));
addCoins(s, 2000);
buildExpansion(s);
const spot = roomSpots(s).at(-1);
buildThemeRoom(s, 'tea', spot.col, spot.floor); // a theme room (GDD #58), with a box of tea sets on its shelf
for (const id of Object.keys(UPGRADES)) buyUpgrade(s, id);
for (const id of Object.keys(HELPERS)) hireHelper(s, id);
const shop = s.building.rooms.find((r) => r.type === 'shop');
if (s.helpers.stocker && !s.stocker) s.stocker = createStocker(shop.id);
for (const id of Object.keys(ITEMS)) s.collection[id] = true;
placeInDollhouse(s, 'bedroom', 'bed');
placeInDollhouse(s, 'parlor', 'chair');
placeInDollhouse(s, 'tearoom', 'teaset');
const shelves = shop.fixtures.filter((f) => f.slots);
shelves[0].slots.fill('doll', 0, 3);
shelves[1].slots.fill('lamp', 0, 2);
s.building.rooms.find((r) => r.type === 'tea')?.fixtures.find((f) => f.slots)?.slots.fill('teaset', 3, 6);
placeOrder(s, 'cottage');
s.wishes = ['cottage'];
s.hearts = 42;
s.coins = 777;
s.day = { ...s.day, number: 9, phase: 'morning', time: 0 };
s.best = { coins: 321 };
s.shopkeeper = { ...s.shopkeeper, hair: 'pigtails', hairColor: '#6b3e2e', outfit: '#ff9ec4', accessory: 'bow', created: true };
s.settings = { muted: true };
s.tutorial = 'done';

const saved = { ...s };
for (const key of TRANSIENT) delete saved[key];
writeFileSync(path, JSON.stringify(saved, null, 1) + '\n');
console.log(`Wrote ${path}`);
