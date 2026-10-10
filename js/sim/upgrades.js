// One-time buys from the Grow sheet: upgrades and helpers. Both are kept as id -> true.

import { events } from '../core/events.js';
import { UPGRADES, HELPERS } from '../data/upgrades.js';
import { addCoins } from './economy.js';

export const hasUpgrade = (state, id) => !!state.upgrades?.[id];
export const hasHelper = (state, id) => !!state.helpers?.[id];

export function buyUpgrade(state, id) {
  const u = UPGRADES[id];
  if (!u || hasUpgrade(state, id) || state.coins < u.cost) return false;
  addCoins(state, -u.cost);
  state.upgrades[id] = true;
  events.emit('upgradeBought', { id });
  return true;
}

/** Some helpers need a room first (Rosa needs the Window Display). */
export const canHire = (state, id) => HELPERS[id]?.needs !== 'display' || state.building.rooms.some((r) => r.type === 'display' && r.floor === 0);

export function hireHelper(state, id) {
  const h = HELPERS[id];
  if (!h || hasHelper(state, id) || !canHire(state, id) || state.coins < h.cost) return false;
  addCoins(state, -h.cost);
  state.helpers[id] = true;
  events.emit('helperHired', { id });
  return true;
}
