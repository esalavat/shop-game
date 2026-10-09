import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitLook } from '../js/ui/creator.js';
import { CREATOR } from '../js/data/customers.js';

test('switching to a boy swaps girls-only hair and accessories for boys ones', () => {
  const look = fitLook({ body: 'boy', hair: 'pigtails', accessory: 'bow' });
  assert.equal(look.hair, CREATOR.hair.boy[0][0]);
  assert.equal(look.accessory, 'none');
});

test('choices that fit both stay (glasses), and so does a fitting hair style', () => {
  const look = fitLook({ body: 'boy', hair: 'curly', accessory: 'glasses' });
  assert.deepEqual(look, { body: 'boy', hair: 'curly', accessory: 'glasses' });
  assert.equal(fitLook({ body: 'girl', hair: 'curly', accessory: 'cap' }).hair, 'bob');
});
