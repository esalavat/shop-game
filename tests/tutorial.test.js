import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { advanceTutorial } from '../js/sim/tutorial.js';
import { openShop } from '../js/sim/day.js';

const shelf = (s) => s.building.rooms[0].fixtures.find((f) => f.slots);

test('a new game starts the guide at the doorstep boxes', () => {
  assert.equal(advanceTutorial(createState(0)), 'box');
});

test('the guide walks box → shelf → open → register → done', () => {
  const s = createState(0);
  s.keeper.carrying = { itemId: 'teaset', qty: 3 };
  assert.equal(advanceTutorial(s), 'shelf');
  s.keeper.carrying = null;
  shelf(s).slots[3] = 'teaset';
  assert.equal(advanceTutorial(s), 'open');
  openShop(s);
  assert.equal(advanceTutorial(s), 'register');
  s.day.stats.served = 1;
  assert.equal(advanceTutorial(s), 'done');
});

test('opening without stocking skips ahead to the register', () => {
  const s = createState(0);
  openShop(s);
  assert.equal(advanceTutorial(s), 'register');
});

test('the register step waits for the first sale, even on a later day', () => {
  const s = createState(0);
  s.tutorial = 'register';
  s.day = { ...s.day, number: 2, phase: 'morning' };
  assert.equal(advanceTutorial(s), 'register');
});

test('a finished guide stays finished', () => {
  const s = createState(0);
  s.tutorial = 'done';
  assert.equal(advanceTutorial(s), 'done');
});
