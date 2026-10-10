// Saves from every released version must keep loading with their progress intact (docs/TECH.md
// §9.4). tests/fixtures/saves/v<n>.json are made by scripts/save-fixture.js and never rewritten.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { loadGame, saveGame, SAVE_KEY } from '../js/core/save.js';
import { STATE_VERSION, TRANSIENT } from '../js/sim/state.js';

// v12 was the save version when the public release channel started (GDD #56).
const FIRST_FIXTURE = 12;
const DIR = new URL('./fixtures/saves/', import.meta.url);

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    keys: () => [...m.keys()],
  };
}

const fixtures = readdirSync(DIR).filter((f) => /^v\d+\.json$/.test(f))
  .map((f) => ({ name: f, raw: readFileSync(new URL(f, DIR), 'utf8') }));

test('there is a sample save for every save version since the first release', () => {
  const have = new Set(fixtures.map((f) => JSON.parse(f.raw).version));
  for (let v = FIRST_FIXTURE; v <= STATE_VERSION; v++) {
    assert.ok(have.has(v), `missing tests/fixtures/saves/v${v}.json: run node scripts/save-fixture.js after bumping STATE_VERSION`);
  }
});

/**
 * What migrations change on purpose, so "progress intact" compares against it: v16 turned theme rooms
 * into shelf rooms and refunded Sorting Smarts (GDD §18 #8).
 */
const THEMES = ['tea', 'parlor', 'fairy', 'bedroom', 'dolls', 'houses'];
function expected(save) {
  const d = structuredClone(save);
  if (d.version < 16) {
    if (d.upgrades?.sorting) { d.coins += 120; delete d.upgrades.sorting; }
    for (const r of d.building.rooms) if (THEMES.includes(r.type)) r.type = 'room';
  }
  return d;
}

for (const { name, raw } of fixtures) {
  const old = expected(JSON.parse(raw));

  test(`${name} loads with all its progress`, () => {
    const store = memoryStorage();
    store.setItem(SAVE_KEY, raw);
    const s = loadGame(store);
    assert.equal(s.version, STATE_VERSION);
    for (const key of ['coins', 'hearts', 'sparkle', 'nextId', 'best', 'upgrades', 'helpers', 'collection', 'dollhouse', 'wishes', 'orders']) {
      assert.deepEqual(s[key], old[key], key);
    }
    assert.equal(s.day.number, old.day.number);
    assert.deepEqual(s.building.rooms.map((r) => [r.id, r.type, r.col, r.floor]), old.building.rooms.map((r) => [r.id, r.type, r.col, r.floor]));
    const stock = (st) => st.building.rooms.flatMap((r) => r.fixtures.flatMap((f) => f.slots ?? [])).filter(Boolean).sort();
    assert.deepEqual(stock(s), stock(old), 'shelf stock');
    assert.equal(s.boxes.length, old.boxes.length, 'boxes');
    for (const key of ['hair', 'hairColor', 'skin', 'outfit', 'accessory', 'created']) assert.equal(s.shopkeeper[key], old.shopkeeper[key], key);
    assert.equal(s.settings.muted, old.settings.muted);
    assert.equal(s.stockers.length, old.stockers?.length ?? (old.stocker ? 1 : 0), 'stockers');
  });

  test(`${name} keeps a copy of itself when it's upgraded, and round-trips`, () => {
    const store = memoryStorage();
    store.setItem(SAVE_KEY, raw);
    const s = loadGame(store);
    if (old.version < STATE_VERSION) assert.equal(store.getItem(`${SAVE_KEY}_v${old.version}`), raw);
    saveGame(s, store, 1);
    const again = loadGame(store);
    const strip = (st) => { const c = structuredClone(st); for (const k of [...TRANSIENT, 'lastSeen']) delete c[k]; return c; };
    assert.deepEqual(strip(again), strip(s));
  });
}
