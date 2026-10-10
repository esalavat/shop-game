import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createState } from '../js/sim/state.js';
import { packShop, unpackShop, encodeShop, decodeShop, visitUrl } from '../js/sim/share.js';

const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/saves/v24.json', import.meta.url), 'utf8'));

test('a shop survives the trip through a link: rooms, styles, shelf items, dollhouse, shopkeeper and name (GDD #91)', async () => {
  const s = fixture();
  s.building.rooms[2].decor = { paper: 'mint', pattern: 'dots' };
  const text = await encodeShop(s);
  assert.match(text, /^v1\.[A-Za-z0-9_-]+$/);
  const shop = await decodeShop(text);
  assert.equal(shop.shopName, 'The Sparkly Teacup');
  assert.deepEqual(shop.dollhouse.slots, s.dollhouse.slots);
  assert.equal(shop.shopkeeper.hair, 'pigtails');
  assert.equal(shop.building.rooms.length, s.building.rooms.length);
  s.building.rooms.forEach((room, i) => {
    const got = shop.building.rooms[i];
    assert.deepEqual([got.type, got.col, got.floor, got.style, got.decor], [room.type, room.col, room.floor, room.style, room.decor]);
    assert.deepEqual(got.fixtures.map((f) => [f.kind, f.slots]), room.fixtures.map((f) => [f.kind, f.slots]));
  });
  assert.ok(text.length < 1500, `a 7-room shop fits in a short link (${text.length})`);
});

test('a new shop with the game\'s own sign makes a link too', async () => {
  const shop = await decodeShop(await encodeShop(createState(0)));
  assert.equal(shop.shopName, '');
  assert.equal(shop.building.rooms[0].type, 'shop');
});

test('hand-made links: bad names, items, looks, rooms and numbers are dropped or replaced, never trusted', () => {
  const p = packShop(fixture());
  p.n = 'shit shop';
  p.k = { body: 'alien', hair: '<script>', hairColor: 'red', skin: '#000000', outfit: 7, accessory: 'crown99' };
  p.h = { bedroom: 'nope', parlor: 'chair', evil: 'bed' };
  p.r[0][5][1][3] = ['doll', 'not-an-item', 42, null];
  p.r[0][4] = { paper: 'x'.repeat(500), floor: 'oak' };
  p.r.push(['spaceship', 1, 0, null, null, []], ['room', 99, 0, null, null, []], ['room', 40, 5, null, null, []], ['room', 0, 0, null, null, []]);
  p.r[1][5].push(['laser', 0, 0, 0], ['plant', 1e9, 0, 0]);
  const shop = unpackShop(p);
  assert.equal(shop.shopName, '');
  assert.deepEqual(shop.shopkeeper, { body: 'girl', hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#9fe0c8', accessory: 'none', created: true });
  assert.deepEqual(shop.dollhouse.slots, { parlor: 'chair' });
  assert.deepEqual(shop.building.rooms[0].fixtures[1].slots, ['doll', null, null, null]);
  assert.deepEqual(shop.building.rooms[0].decor, { floor: 'oak' });
  assert.equal(shop.building.rooms.length, fixture().building.rooms.length, 'unknown types, far-off spots, floating rooms and doubles are dropped');
  assert.equal(shop.building.rooms[1].fixtures.length, fixture().building.rooms[1].fixtures.length);
});

test('links that aren\'t shops are refused', async () => {
  await assert.rejects(decodeShop(''));
  await assert.rejects(decodeShop('hello'));
  await assert.rejects(decodeShop('v1.!!!'));
  await assert.rejects(decodeShop('v1.AAAA'));
  assert.throws(() => unpackShop({ r: [['room', 0, 0, null, null, []]] }), /no shop/);
  assert.throws(() => unpackShop(null));
});

test('the visit link sits next to the game, on whichever build made it', () => {
  assert.equal(visitUrl('https://esalavat.github.io/shop-game/dev/?debug', 'v1.abc'), 'https://esalavat.github.io/shop-game/dev/visit.html#v1.abc');
  assert.equal(visitUrl('https://esalavat.github.io/shop-game/', 'v1.abc'), 'https://esalavat.github.io/shop-game/visit.html#v1.abc');
});
