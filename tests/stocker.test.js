import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { tickStockers, chooseBox, STOCKER_WAIT } from '../js/sim/stocker.js';
import { tickKeeper, walkToBox } from '../js/sim/keeper.js';
import { dropBox, settleBoxes, pickUpBox, boxSpot, inBin, BOX_SPOTS } from '../js/sim/stock.js';
import { soldOut } from '../js/sim/day.js';
import { hireHelper, buyUpgrade } from '../js/sim/upgrades.js';
import { HELPERS, UPGRADES } from '../js/data/upgrades.js';

const shelvesOf = (s) => s.building.rooms[0].fixtures.filter((f) => f.slots);
const navsFor = (s) => new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
const run = (s, navs, seconds) => {
  for (let t = 0; t < seconds; t += 0.1) { tickKeeper(s, 0.1); tickStockers(s, navs, 0.1); }
};
const stocked = (s) => shelvesOf(s).flatMap((f) => f.slots).filter(Boolean).length;

function beaShop() {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.coins = HELPERS.stocker.cost;
  assert.ok(hireHelper(s, 'stocker'));
  return { s, navs: navsFor(s) };
}

test('Bea costs coins and starts by the wall', () => {
  const { s, navs } = beaShop();
  assert.equal(s.coins, 0);
  run(s, navs, 0.1);
  assert.ok(s.stockers[0]);
});

test('Bea carries the doorstep boxes to the shelves and unpacks them', () => {
  const { s, navs } = beaShop();
  assert.equal(s.boxes.length, 2); // the starter boxes: 3 tea sets, 3 chairs
  run(s, navs, 40);
  assert.equal(s.boxes.length, 0);
  assert.equal(stocked(s), 6);
  assert.equal(s.stockers[0].carrying, null);
  assert.ok(Math.hypot(s.stockers[0].x - STOCKER_WAIT.x, s.stockers[0].z - STOCKER_WAIT.z) < 0.1); // back by the wall
});

test('she fetches wished-for items first, then items that are not on the shelves', () => {
  const { s } = beaShop();
  s.boxes = [];
  dropBox(s, 'teaset', 3);
  dropBox(s, 'chair', 3);
  dropBox(s, 'doll', 3);
  shelvesOf(s)[0].slots[4] = 'teaset';
  assert.equal(chooseBox(s).itemId, 'chair'); // not on the shelves yet
  s.wishes.push({ itemId: 'doll', day: 1 });
  assert.equal(chooseBox(s).itemId, 'doll');
});

test("she never takes the box the shopkeeper is walking to", () => {
  const { s, navs } = beaShop();
  const first = chooseBox(s);
  assert.ok(walkToBox(s, navs, first));
  assert.notEqual(chooseBox(s).id, first.id);
});

test('she stops when the shelves are full, holding on to what is left', () => {
  const { s, navs } = beaShop();
  for (const f of shelvesOf(s)) f.slots = f.slots.map((_, i) => (i === 0 ? null : 'doll'));
  run(s, navs, 40);
  assert.equal(stocked(s), 18);
  assert.equal(s.boxes.length + (s.stockers[0].carrying ? 1 : 0) + (s.stockers[0].spare ? 1 : 0), 2); // nothing lost
});

test('a box in her hands still counts as stock (not sold out)', () => {
  const { s } = beaShop();
  const box = s.boxes[0];
  s.day.phase = 'close'; // so she doesn't start working on her own
  tickStockers(s, navsFor(s), 0.1);
  pickUpBox(s, box.id, s.stockers[0], 'stocker');
  s.boxes = [];
  assert.equal(soldOut(s), false);
});

test('no Bea until she is hired, and she rests after closing', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  const navs = navsFor(s);
  run(s, navs, 5);
  assert.equal(s.stockers[0], undefined);
  assert.equal(s.boxes.length, 2);

  const hired = beaShop();
  hired.s.day.phase = 'close';
  run(hired.s, hired.navs, 10);
  assert.equal(hired.s.boxes.length, 2);
});

test('extra boxes go in the delivery bin, and come out onto the doorstep as spots free up (GDD #74)', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.boxes = [];
  const n = BOX_SPOTS.length;
  const boxes = Array.from({ length: n + 3 }, () => dropBox(s, 'chair', 3));
  assert.deepEqual(boxes.map(inBin), [...Array(n).fill(false), true, true, true]);
  assert.ok(boxes.every((b) => boxSpot(b.spot).layer === 0), 'nothing stacks');
  assert.ok(pickUpBox(s, boxes[1].id));
  assert.equal(boxes[n].spot, 1, 'the first box in the bin comes out');
  assert.deepEqual([boxes[n + 1].spot, boxes[n + 2].spot], [n, n + 1], 'the rest keep their order');
  assert.ok(pickUpBox(s, boxes[n + 2].id, s.keeper.carrying ? { carrying: null, spare: null } : s.keeper), 'fetched straight from the bin');
  assert.equal(settleBoxes(s), false); // already settled
});

test('old saves with stacked boxes put the stacked ones in the bin', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.boxes = [0, 1, 4, 5, 2].map((spot, i) => ({ id: `b${i}`, itemId: 'chair', qty: 3, roomId: 'r1', spot }));
  settleBoxes(s);
  assert.deepEqual(s.boxes.map((b) => b.spot), [0, 1, 3, 4, 2]);
});

test('Theo comes after Bea and Juno after Theo; they never head for the same box (GDD #72)', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.coins = 1e6;
  assert.equal(hireHelper(s, 'stocker2'), false, 'Bea first');
  assert.ok(hireHelper(s, 'stocker'));
  assert.equal(hireHelper(s, 'stocker3'), false, 'Theo first');
  assert.ok(hireHelper(s, 'stocker2'));
  assert.ok(hireHelper(s, 'stocker3'));
  const navs = navsFor(s);
  run(s, navs, 0.1);
  assert.deepEqual(s.stockers.map((b) => b.who), ['stocker', 'stocker2', 'stocker3']);
  const heading = s.stockers.filter((b) => b.job?.type === 'pickup').map((b) => b.job.boxId);
  assert.equal(heading.length, 2, 'two boxes, two stockers fetching');
  assert.equal(new Set(heading).size, 2, 'different boxes');
  run(s, navs, 40);
  assert.equal(s.boxes.length, 0);
  assert.equal(stocked(s), 6);
  assert.ok(s.stockers.every((b) => !b.carrying && !b.spare));
});

test('Roller Skates make stockers finish the doorstep boxes sooner', () => {
  const timeToEmpty = (skates) => {
    const { s, navs } = beaShop();
    if (skates) {
      s.coins = UPGRADES.skates.cost;
      assert.ok(buyUpgrade(s, 'skates'));
    }
    let t = 0;
    for (; s.boxes.length || s.stockers[0]?.carrying || stocked(s) < 6; t += 0.1) { tickKeeper(s, 0.1); tickStockers(s, navs, 0.1); }
    return t;
  };
  const plain = timeToEmpty(false), fast = timeToEmpty(true);
  assert.ok(fast < plain * 0.9, `${fast.toFixed(1)} s with skates vs ${plain.toFixed(1)} s`);
});
