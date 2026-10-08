import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNav, findPath, isFree } from '../js/sim/nav.js';
import { makeRoom } from '../js/sim/building.js';
import { useSpot } from '../js/data/fixtures.js';

const shop = makeRoom('r1', 'shop', 0, 0);
const nav = buildNav(shop);

test('furniture blocks the floor; open floor and rugs do not', () => {
  const shelf = shop.fixtures.find((f) => f.kind === 'shelf');
  const rug = shop.fixtures.find((f) => f.kind === 'rug');
  assert.equal(isFree(nav, shelf.x, shelf.z), false);
  assert.equal(isFree(nav, rug.x, rug.z), true);
});

test('every fixture use-spot is reachable from the shopkeeper start', () => {
  for (const f of shop.fixtures) {
    const to = useSpot(f);
    if (!to) continue;
    assert.ok(isFree(nav, to.x, to.z), `${f.kind} use spot is blocked`);
    const path = findPath(nav, { x: -1.05, z: -0.42 }, to);
    assert.ok(path, `${f.kind} unreachable`);
    const end = path.at(-1);
    assert.ok(Math.hypot(end.x - to.x, end.z - to.z) < 1e-6);
  }
});

test('paths never pass through furniture', () => {
  const start = { x: -1.05, z: -0.42 }; // behind the counter
  const path = findPath(nav, start, { x: 1.0, z: -0.3 });
  let prev = start;
  for (const p of path) {
    for (let t = 0; t <= 1; t += 0.02) {
      assert.ok(isFree(nav, prev.x + (p.x - prev.x) * t, prev.z + (p.z - prev.z) * t));
    }
    prev = p;
  }
});

test('a target inside furniture snaps to a nearby free spot', () => {
  const counter = shop.fixtures.find((f) => f.kind === 'counter');
  const path = findPath(nav, { x: 0, z: 0.5 }, { x: counter.x, z: counter.z });
  assert.ok(path);
  const end = path.at(-1);
  assert.ok(isFree(nav, end.x, end.z));
  assert.ok(Math.hypot(end.x - counter.x, end.z - counter.z) < 0.8);
});

test('string-pulling makes open-floor walks a single straight segment', () => {
  const path = findPath(nav, { x: -0.5, z: 0.3 }, { x: 0.3, z: 0.5 });
  assert.equal(path.length, 1);
});
