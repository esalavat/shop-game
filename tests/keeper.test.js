import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { walkTo, walkToFixture, tickKeeper, KEEPER_SPEED } from '../js/sim/keeper.js';
import { events } from '../js/core/events.js';
import { FIXTURES } from '../js/data/fixtures.js';

const run = (state, seconds) => { for (let t = 0; t < seconds; t += 0.1) tickKeeper(state, 0.1); };

test('walks to a tapped spot at walking speed', () => {
  const s = createState();
  const nav = buildNav(s.building.rooms[0]);
  s.keeper.x = -0.5; s.keeper.z = 0.3;
  assert.ok(walkTo(s, nav, 0.3, 0.3));
  tickKeeper(s, 0.1);
  assert.ok(Math.abs(s.keeper.x - (-0.5 + KEEPER_SPEED * 0.1)) < 1e-6);
  run(s, 2);
  assert.ok(Math.abs(s.keeper.x - 0.3) < 1e-6 && s.keeper.path.length === 0);
});

test('arriving at furniture faces it and announces arrival', () => {
  const s = createState();
  const nav = buildNav(s.building.rooms[0]);
  const shelf = s.building.rooms[0].fixtures.find((f) => f.kind === 'shelf');
  let arrived = null;
  const off = events.on('keeperArrived', (e) => (arrived = e.fixtureId));
  walkToFixture(s, nav, shelf);
  run(s, 6);
  off();
  assert.equal(arrived, shelf.id);
  assert.equal(s.keeper.facing, FIXTURES.shelf.use.face);
});
