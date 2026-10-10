// A busy day with more rooms must always end (docs/ISSUES.md: customers stuck behind the line).
// This replays a day that used to deadlock: a customer walking back from another room to their place
// in line was pushed back forever by someone standing in line, so nobody could be served and the
// shop could never close.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { buildExpansion, buildRoom, roomSpots } from '../js/sim/building.js';
import { tickCustomers } from '../js/sim/customers.js';
import { tickKeeper } from '../js/sim/keeper.js';
import { tickHelpers } from '../js/sim/helpers.js';
import { tickStockers } from '../js/sim/stocker.js';
import { separate } from '../js/sim/crowd.js';
import { tickDay, openShop } from '../js/sim/day.js';
import { dropBox } from '../js/sim/stock.js';
import { rng } from '../js/core/rng.js';
import { ITEMS } from '../js/data/items.js';

for (const seed of [2332, 2235]) {
  test(`a busy day with two shelf rooms, Mia and Bea reaches closing time (seed ${seed})`, () => {
    const rand = rng(seed);
    const s = createState(0);
    s.coins = 1e6;
    buildExpansion(s);
    buildRoom(s, roomSpots(s)[0].col, 0);
    buildRoom(s, roomSpots(s).at(-1).col, 0);
    s.helpers = { cashier: true, stocker: true };
    s.upgrades = { cart: true };
    const navs = new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
    s.keeper.x = 0.6; s.keeper.z = 0.6; // out from behind the counter, so Mia rings people up
    const ids = Object.keys(ITEMS);
    for (let i = 0; i < 8; i++) dropBox(s, ids[Math.floor(rand() * ids.length)], 3);
    openShop(s);
    let t = 0;
    while (s.day.phase !== 'close' && t < 900) {
      tickKeeper(s, 0.1); tickHelpers(s, 0.1, rand); tickStockers(s, navs, 0.1); tickCustomers(s, navs, 0.1, rand); separate(s, navs); tickDay(s, 0.1);
      t += 0.1;
    }
    assert.equal(s.day.phase, 'close', `still ${s.day.phase} with ${s.customers.length} customers: ${s.customers.map((c) => c.state).join(', ')}`);
  });
}
