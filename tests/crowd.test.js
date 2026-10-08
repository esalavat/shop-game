import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { separate } from '../js/sim/crowd.js';
import { stepAlong } from '../js/sim/walker.js';

const person = (x, z, path = []) => ({ roomId: 'r1', x, z, facing: Math.PI / 2, path });

test('someone walking steps around a person standing still instead of through them', () => {
  const s = createState();
  const navs = new Map([['r1', buildNav(s.building.rooms[0])]]);
  s.keeper.x = 0.3; s.keeper.z = 0.3; s.keeper.path = [];
  const walker = person(-0.6, 0.3, [{ x: 1.0, z: 0.3 }]);
  s.customers = [walker];
  let closest = Infinity;
  for (let t = 0; t < 3 && walker.path.length; t += 0.1) {
    stepAlong(walker, 1.1, 0.1);
    separate(s, navs);
    closest = Math.min(closest, Math.hypot(walker.x - s.keeper.x, walker.z - s.keeper.z));
  }
  assert.equal(s.keeper.x, 0.3, 'the person standing still is not pushed');
  assert.ok(closest > 0.3, `passed within ${closest.toFixed(2)}`);
  assert.equal(walker.path.length, 0, 'and still gets where they were going');
});

test('two people standing still are left alone', () => {
  const s = createState();
  const navs = new Map([['r1', buildNav(s.building.rooms[0])]]);
  s.keeper.x = 0; s.keeper.z = 0.3;
  s.customers = [person(0.1, 0.3)];
  separate(s, navs);
  assert.equal(s.customers[0].x, 0.1);
});
