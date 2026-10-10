import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { collectionBonus, giftCompleteThemes, ownsLook, themeGift } from '../js/sim/rewards.js';
import { trafficBoost } from '../js/sim/collection.js';
import { deliverOrders } from '../js/sim/day.js';
import { events } from '../js/core/events.js';
import { COLLECTION, ITEMS } from '../js/data/items.js';
import { CREATOR, THEME_LOOKS } from '../js/data/customers.js';

const theme = (set) => Object.keys(ITEMS).filter((id) => ITEMS[id].set === set);
const own = (s, ids) => { for (const id of ids) s.collection[id] = true; };

test('each item found and theme complete brings more visitors, up to a cap', () => {
  const s = createState();
  assert.equal(collectionBonus(s), 2 * COLLECTION.perItem); // the two starter items
  assert.equal(trafficBoost(s), 1 + 2 * COLLECTION.perItem);
  own(s, theme('tea'));
  assert.equal(collectionBonus(s), 5 * COLLECTION.perItem + COLLECTION.perTheme);
  own(s, Object.keys(ITEMS));
  assert.equal(collectionBonus(s), COLLECTION.maxBonus);
});

test('completing a theme gives coins once, more for each theme after the first', () => {
  const s = createState();
  const gifts = [];
  const off = events.on('themeGift', (e) => gifts.push(e));
  own(s, theme('tea').filter((id) => id !== 'caketower'));
  s.orders.push({ itemId: 'caketower', qty: 2, arrivesDay: 1 });
  const coins = s.coins;
  deliverOrders(s, () => true);
  assert.deepEqual(s.themeGifts, ['tea']);
  assert.equal(s.coins, coins + COLLECTION.giftFirst);
  assert.deepEqual(gifts[0], { set: 'tea', coins: COLLECTION.giftFirst, look: { row: 'outfit', value: THEME_LOOKS.tea[1], name: THEME_LOOKS.tea[2] } });
  assert.deepEqual(giftCompleteThemes(s), [], 'only once');
  own(s, theme('fairy'));
  own(s, theme('dolls'));
  assert.deepEqual(giftCompleteThemes(s), ['fairy', 'dolls']);
  assert.equal(s.coins, coins + themeGift(0) + themeGift(1) + themeGift(2));
  assert.equal(themeGift(1), COLLECTION.giftFirst + COLLECTION.giftStep);
  off?.();
});

test('theme shopkeeper styles are locked until the theme is complete', () => {
  const s = createState();
  assert.ok(ownsLook(s, 'accessory', 'bow'));
  assert.ok(ownsLook(s, 'outfit', CREATOR.outfits[0]));
  assert.ok(!ownsLook(s, 'accessory', 'crown'));
  assert.ok(!ownsLook(s, 'outfit', THEME_LOOKS.tea[1]));
  own(s, theme('houses'));
  assert.ok(ownsLook(s, 'accessory', 'crown'));
});

test('every theme style is in the creator, for girls and boys', () => {
  for (const [row, value] of Object.values(THEME_LOOKS)) {
    if (row === 'outfit') assert.ok(CREATOR.outfits.includes(value));
    else for (const body of ['girl', 'boy']) assert.ok(CREATOR.accessories[body].some(([id]) => id === value), `${body} ${value}`);
  }
});
