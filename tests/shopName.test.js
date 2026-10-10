import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { cleanName, nameProblem, safeName, setShopName, signLines, NAME_MAX, DEFAULT_SIGN } from '../js/sim/shopName.js';
import { events } from '../js/core/events.js';

test('names are cleaned: no emoji or symbols, single spaces, at most NAME_MAX characters', () => {
  assert.equal(cleanName('  The   Sparkly 🌟 Teacup  '), 'The Sparkly Teacup');
  assert.equal(cleanName('Zoë’s Café & Co.'), "Zoë's Café & Co.");
  assert.equal(cleanName('a@b.com/x'), 'ab.comx');
  assert.equal([...cleanName('x'.repeat(40))].length, NAME_MAX);
  assert.equal(cleanName(null), '');
});

test('nice names pass, including ones with rude words hiding inside', () => {
  for (const n of ['The Sparkly Teacup', 'Classic Toys', 'Peacock Palace', 'Grape Jelly Shop', 'Raccoon Corner', 'Hello Dolly',
    'Wish It Shop', 'Fish It', 'Sussex Dolls', 'Skill Toys', 'Butterfly Barn', 'Shop 4 U', 'Since 2026', 'Swanky Dolls', 'Pussycat Place']) {
    assert.equal(nameProblem(cleanName(n)), null, n);
  }
});

test('rude words are caught, even in disguise', () => {
  for (const n of ['fuck shop', 'F U C K', 'sh1t', 'Fuuuuck', 'big ass shop', 'Sexy Dolls', 'b1tch', 'Kill Shop', 'shitty toys']) {
    assert.ok(nameProblem(cleanName(n)), n);
  }
});

test('no phone numbers or websites', () => {
  assert.ok(nameProblem('Call 5551234'));
  assert.ok(nameProblem('www dolls'));
  assert.ok(nameProblem('dolls.com'));
  assert.equal(safeName('dolls.com'), '');
  assert.equal(safeName(' Tea  Time '), 'Tea Time');
});

test('setShopName saves a good name, refuses a bad one, and an empty name brings the old sign back', () => {
  const s = createState(0);
  assert.equal(s.shopName, '');
  const seen = [];
  const off = events.on('shopNamed', (e) => seen.push(e.name));
  assert.deepEqual(setShopName(s, ' Bunny  Bakery '), { ok: true, name: 'Bunny Bakery' });
  assert.equal(s.shopName, 'Bunny Bakery');
  const bad = setShopName(s, 'shit shop');
  assert.equal(bad.ok, false);
  assert.ok(bad.problem);
  assert.equal(s.shopName, 'Bunny Bakery');
  setShopName(s, '   ');
  assert.equal(s.shopName, '');
  off();
  assert.deepEqual(seen, ['Bunny Bakery', '']);
});

test('the sign shows the game name, one short line, or two lines split near the middle', () => {
  assert.deepEqual(signLines(''), DEFAULT_SIGN);
  assert.deepEqual(signLines('Bunny Bakery'), ['Bunny Bakery']);
  assert.deepEqual(signLines('The Sparkly Teacup'), ['The Sparkly', 'Teacup']);
  assert.deepEqual(signLines('Supercalifragilistic'), ['Supercalifragilistic']);
});
