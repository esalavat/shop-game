import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buyDecor, ownsDecor, styleRoom, canStyle, ribbonsForSale, ribbonsForFinds } from '../js/sim/decor.js';
import { startCheckout, scanNext, completeSale } from '../js/sim/checkout.js';
import { deliverOrders, startNextDay, closeNow } from '../js/sim/day.js';
import { buildExpansion } from '../js/sim/building.js';
import { DECOR, RIBBONS, roomDecor, roomLook } from '../js/data/decor.js';
import { ROOM_STYLES } from '../js/data/rooms.js';

const shop = (s) => s.building.rooms[0];

test('a new shop starts with Ribbons for its two starter items', () => {
  const s = createState();
  assert.equal(s.ribbons, 2 * RIBBONS.newItem);
  assert.deepEqual(s.decor.owned, {});
});

test('every room type and wallpaper has a full look', () => {
  for (const type of ['shop', 'display', 'stairs', 'landing', 'room']) {
    const look = roomLook({ type, fixtures: [], style: type === 'room' ? 2 : undefined });
    for (const kind of Object.keys(DECOR)) assert.ok(look[kind], `${type} ${kind}`);
  }
  for (const st of ROOM_STYLES) for (const [kind, id] of Object.entries(st)) assert.ok(DECOR[kind].some((o) => o.id === id), id);
});

test('free looks are owned; paid ones are bought once with Ribbons and work in every room', () => {
  const s = createState();
  assert.ok(ownsDecor(s, 'paper', 'mint'));
  assert.ok(!ownsDecor(s, 'pattern', 'stars'));
  s.ribbons = 9;
  assert.equal(buyDecor(s, 'pattern', 'stars'), false, 'too few Ribbons');
  assert.equal(styleRoom(s, 'r1', 'pattern', 'stars'), false, 'not yours yet');
  s.ribbons = 12;
  assert.ok(buyDecor(s, 'pattern', 'stars'));
  assert.equal(s.ribbons, 2);
  assert.equal(buyDecor(s, 'pattern', 'stars'), false, 'only once');
  assert.ok(styleRoom(s, 'r1', 'pattern', 'stars'));
  assert.equal(roomDecor(shop(s)).pattern, 'stars');
  assert.equal(roomDecor(shop(s)).paper, 'pink', 'the rest stays');
  s.coins = 500;
  const display = buildExpansion(s);
  assert.ok(styleRoom(s, display.id, 'pattern', 'stars'), 'free in another room');
  assert.equal(s.ribbons, 2);
});

test('a preview shows on top without changing the room', () => {
  const s = createState();
  assert.equal(roomLook(shop(s), { floor: 'pinkcheck' }).floor.id, 'pinkcheck');
  assert.equal(roomDecor(shop(s)).floor, 'honey');
});

test('curtains need a window and the corner a plant spot', () => {
  const s = createState();
  assert.ok(canStyle(shop(s), 'curtain'));
  assert.ok(canStyle(shop(s), 'corner'));
  const landing = { type: 'landing', fixtures: [{ kind: 'stairhole' }, { kind: 'shelf' }] };
  assert.ok(!canStyle(landing, 'curtain'));
  assert.ok(!canStyle(landing, 'corner'));
  assert.ok(!canStyle(landing, 'rug'));
  assert.ok(canStyle(landing, 'floor'));
});

test('selling a wished-for item grants the wish note for a Ribbon', () => {
  const s = createState();
  s.wishes = [{ itemId: 'lamp', day: 1 }, { itemId: 'teaset', day: 1 }, { itemId: 'lamp', day: 1 }];
  const before = s.ribbons;
  const customer = { id: 'c1', basket: ['lamp', 'chair'], state: 'queue' };
  s.customers.push(customer);
  startCheckout(s, customer);
  scanNext(s); scanNext(s);
  completeSale(s, () => 0);
  assert.equal(s.ribbons, before + RIBBONS.wish);
  assert.deepEqual(s.wishes.map((w) => w.itemId), ['teaset', 'lamp'], 'one note used up');
  assert.equal(s.day.stats.ribbons, RIBBONS.wish);
});

test('a window-peeker buying what they pointed at earns a Ribbon', () => {
  const s = createState();
  const before = s.ribbons;
  ribbonsForSale(s, { id: 'c1', windowWant: 'chair' }, ['chair']);
  assert.equal(s.ribbons, before + RIBBONS.window);
  ribbonsForSale(s, { id: 'c2', windowWant: 'chair' }, ['teaset']);
  assert.equal(s.ribbons, before + RIBBONS.window, 'something else: no Ribbon');
});

test('new Collection items earn Ribbons, and completing a theme earns more', () => {
  const s = createState();
  s.collection.cupcakes = s.collection.trolley = true;
  const before = s.ribbons;
  s.orders.push({ itemId: 'caketower', qty: 2, arrivesDay: 1 }, { itemId: 'teaset', qty: 3, arrivesDay: 1 });
  const delivered = deliverOrders(s, () => true);
  assert.deepEqual(delivered.discovered, ['caketower']);
  assert.equal(s.ribbons, before + RIBBONS.newItem + RIBBONS.theme, 'Tea Time is complete');
  ribbonsForFinds(s, []);
  assert.equal(s.ribbons, before + RIBBONS.newItem + RIBBONS.theme);
});

test('closing gives a Ribbon for every few happy customers', () => {
  const s = createState();
  s.day.phase = 'evening';
  s.day.stats.served = RIBBONS.perHappy * 2 + 1;
  const before = s.ribbons;
  closeNow(s);
  assert.equal(s.ribbons, before + 2);
  assert.equal(s.day.stats.ribbons, 2);
  startNextDay(s);
  assert.equal(s.day.stats.ribbons, 0);
});
