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
/** A shop where decorating is open (GDD #86). */
const decorShop = () => Object.assign(createState(), { decorOpen: true });

test('decorating opens with the first shelf room, paying the Collection\'s Ribbons so far (GDD #86)', async () => {
  const { buildRoom } = await import('../js/sim/building.js');
  const { events } = await import('../js/core/events.js');
  const s = createState();
  assert.equal(s.decorOpen, false);
  assert.equal(s.ribbons, 0, 'no Ribbons on day 1');
  assert.deepEqual(s.decor.owned, {});
  // Before it opens, nothing is earned...
  ribbonsForSale(s, { id: 'c1', windowWant: 'chair' }, ['chair']);
  Object.assign(s.collection, { cupcakes: true, trolley: true, caketower: true, teddy: true }); // Tea Time complete
  ribbonsForFinds(s, ['caketower', 'teddy']);
  assert.equal(s.ribbons, 0);
  // ...and a theme's style can't be bought (it's a reward), though it's already yours.
  assert.ok(ownsDecor(s, 'pattern', 'teacups'));
  // The first shelf room opens it, with every one-time Ribbon so far: 6 items and Tea Time.
  s.coins = 1e4;
  buildExpansion(s);
  let opened = null;
  const off = events.on('decorOpened', (e) => (opened = e));
  assert.ok(buildRoom(s, -1, 0));
  off();
  assert.equal(s.decorOpen, true);
  assert.equal(s.ribbons, 6 * RIBBONS.newItem + RIBBONS.theme);
  assert.deepEqual(opened, { ribbons: s.ribbons });
  assert.ok(buildRoom(s, 2, 0));
  assert.equal(s.ribbons, 6 * RIBBONS.newItem + RIBBONS.theme, 'only once');
});

test('theme reward styles can only be won, never bought (GDD #86)', async () => {
  const { THEME_STYLES } = await import('../js/data/decor.js');
  const s = decorShop();
  s.ribbons = 1000;
  for (const [kind, id] of Object.values(THEME_STYLES)) assert.equal(buyDecor(s, kind, id), false, `${kind}:${id}`);
  s.decor.owned['pattern:stars'] = true; // bought before #86: still yours
  assert.ok(ownsDecor(s, 'pattern', 'stars'));
});

test('every room type and wallpaper has a full look', () => {
  for (const type of ['shop', 'display', 'stairs', 'landing', 'room']) {
    const look = roomLook({ type, fixtures: [], style: type === 'room' ? 2 : undefined });
    for (const kind of Object.keys(DECOR)) assert.ok(look[kind], `${type} ${kind}`);
  }
  for (const st of ROOM_STYLES) for (const [kind, id] of Object.entries(st)) assert.ok(DECOR[kind].some((o) => o.id === id), id);
});

test('free looks are owned; paid ones are bought once with Ribbons and work in every room', () => {
  const s = decorShop();
  assert.ok(ownsDecor(s, 'paper', 'mint'));
  assert.ok(!ownsDecor(s, 'pattern', 'dots'));
  s.ribbons = 5;
  assert.equal(buyDecor(s, 'pattern', 'dots'), false, 'too few Ribbons');
  assert.equal(styleRoom(s, 'r1', 'pattern', 'dots'), false, 'not yours yet');
  s.ribbons = 8;
  assert.ok(buyDecor(s, 'pattern', 'dots'));
  assert.equal(s.ribbons, 2);
  assert.equal(buyDecor(s, 'pattern', 'dots'), false, 'only once');
  assert.ok(styleRoom(s, 'r1', 'pattern', 'dots'));
  assert.equal(roomDecor(shop(s)).pattern, 'dots');
  assert.equal(roomDecor(shop(s)).paper, 'pink', 'the rest stays');
  s.coins = 500;
  const display = buildExpansion(s);
  assert.ok(styleRoom(s, display.id, 'pattern', 'dots'), 'free in another room');
  assert.equal(s.ribbons, 2);
});

test('a preview shows on top without changing the room', () => {
  const s = decorShop();
  assert.equal(roomLook(shop(s), { floor: 'pinkcheck' }).floor.id, 'pinkcheck');
  assert.equal(roomDecor(shop(s)).floor, 'honey');
});

test('curtains need a window and the corner a plant spot', () => {
  const s = decorShop();
  assert.ok(canStyle(shop(s), 'curtain'));
  assert.ok(canStyle(shop(s), 'corner'));
  const landing = { type: 'landing', fixtures: [{ kind: 'stairhole' }, { kind: 'shelf' }] };
  assert.ok(!canStyle(landing, 'curtain'));
  assert.ok(!canStyle(landing, 'corner'));
  assert.ok(!canStyle(landing, 'rug'));
  assert.ok(canStyle(landing, 'floor'));
});

test('selling a wished-for item grants the wish note for a Ribbon', () => {
  const s = decorShop();
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
  const s = decorShop();
  const before = s.ribbons;
  ribbonsForSale(s, { id: 'c1', windowWant: 'chair' }, ['chair']);
  assert.equal(s.ribbons, before + RIBBONS.window);
  ribbonsForSale(s, { id: 'c2', windowWant: 'chair' }, ['teaset']);
  assert.equal(s.ribbons, before + RIBBONS.window, 'something else: no Ribbon');
});

test('new Collection items earn Ribbons, and completing a theme earns more', () => {
  const s = decorShop();
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
  const s = decorShop();
  s.day.phase = 'evening';
  s.day.stats.served = RIBBONS.perHappy * 2 + 1;
  const before = s.ribbons;
  closeNow(s);
  assert.equal(s.ribbons, before + 2);
  assert.equal(s.day.stats.ribbons, 2);
  startNextDay(s);
  assert.equal(s.day.stats.ribbons, 0);
});

test('completing a theme gives its room style for free (GDD #69)', async () => {
  const { THEME_STYLES } = await import('../js/data/decor.js');
  const s = decorShop();
  const [kind, id] = THEME_STYLES.tea;
  assert.ok(!ownsDecor(s, kind, id));
  s.collection.cupcakes = s.collection.trolley = true;
  const before = s.ribbons;
  let event = null;
  const { events } = await import('../js/core/events.js');
  events.on('themeDone', (e) => (event = e));
  s.orders.push({ itemId: 'caketower', qty: 2, arrivesDay: 1 });
  deliverOrders(s, () => true);
  assert.ok(ownsDecor(s, kind, id), 'yours now');
  assert.deepEqual(event.style, { kind, id });
  assert.equal(s.ribbons, before + RIBBONS.newItem + RIBBONS.theme, 'Ribbons too');
  assert.ok(styleRoom(s, 'r1', kind, id));
});

test('a theme completed before this update already counts', () => {
  const s = decorShop();
  Object.assign(s.collection, { cupcakes: true, trolley: true, caketower: true });
  assert.ok(ownsDecor(s, 'pattern', 'teacups'));
});

test('each theme\'s prize is its own picture wallpaper, one per round; the old prizes are on sale (GDD #87)', async () => {
  const { THEME_STYLES, OLD_THEME_STYLES, decorOption } = await import('../js/data/decor.js');
  const { SETS } = await import('../js/data/items.js');
  assert.deepEqual(Object.keys(THEME_STYLES).sort(), Object.keys(SETS).sort());
  const ids = new Set();
  for (const [set, [kind, id]] of Object.entries(THEME_STYLES)) {
    const o = decorOption(kind, id);
    assert.ok(o?.prize, `${set} has a picture`);
    assert.equal(o.round, /\d$/.test(set) ? Number(set.at(-1)) - 1 : 0, `${set} in its round's colors`);
    ids.add(id);
  }
  assert.equal(ids.size, 24, 'all different');
  const s = decorShop();
  s.ribbons = 1000;
  for (const [kind, id] of Object.values(OLD_THEME_STYLES)) assert.ok(buyDecor(s, kind, id), `${kind}:${id} can be bought now`);
});
