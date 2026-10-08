import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addRoom, hasRoom } from '../js/sim/building.js';
import { createState } from '../js/sim/state.js';

test('rooms can grow sideways and upward', () => {
  const s = createState();
  assert.ok(addRoom(s, 'stock', 1, 0));
  assert.ok(addRoom(s, 'dolls', 0, 1));
  assert.ok(hasRoom(s, 1, 0) && hasRoom(s, 0, 1));
});

test('cannot place two rooms in one slot', () => {
  const s = createState();
  assert.equal(addRoom(s, 'stock', 0, 0), null);
});

test('upper floors need a room underneath', () => {
  const s = createState();
  assert.equal(addRoom(s, 'tea', 3, 1), null);
});
