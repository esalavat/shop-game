// The Collection pays off (GDD #70): every item found and theme complete brings more visitors, and
// completing a theme gives a coin gift (bigger each time) and a shopkeeper style. Room styles and
// Ribbons for themes are in sim/decor.js (#68, #69).
// state.themeGifts lists the themes whose coin gift has been given, in order; shopkeeper styles are
// worked out from the Collection, like theme room styles.

import { events } from '../core/events.js';
import { COLLECTION, ITEMS, ROUNDS, SETS, setRound } from '../data/items.js';
import { THEME_LOOKS } from '../data/customers.js';
import { themeComplete } from './decor.js';
import { addCoins } from './economy.js';

export const completeThemes = (state) => Object.keys(SETS).filter((set) => themeComplete(state.collection, set));

/** Extra visitors from the Collection, e.g. 0.16 for +16%. */
export function collectionBonus(state) {
  const found = Object.keys(ITEMS).filter((id) => state.collection[id]).length;
  return Math.min(COLLECTION.maxBonus, found * COLLECTION.perItem + completeThemes(state).length * COLLECTION.perTheme);
}

/** Coins for the nth theme completed in a color round (0 = the first), × the round's prices (GDD #77). */
export const themeGift = (n, round = 0) => (COLLECTION.giftFirst + n * COLLECTION.giftStep) * ROUNDS[round].mult;

/**
 * Give the coin gift for every complete theme that hasn't had one yet: after a delivery, and on
 * load for shops that finished themes before the update. Returns the themes it paid for.
 */
export function giftCompleteThemes(state) {
  const paid = [];
  for (const set of completeThemes(state)) {
    if (state.themeGifts.includes(set)) continue;
    const round = setRound(set);
    const coins = themeGift(state.themeGifts.filter((t) => setRound(t) === round).length, round);
    state.themeGifts.push(set);
    addCoins(state, coins);
    const [row, value, name] = THEME_LOOKS[set];
    events.emit('themeGift', { set, coins, look: { row, value, name } });
    paid.push(set);
  }
  return paid;
}

/** The theme that unlocks this shopkeeper style, or null if it's free. */
export function lookTheme(row, value) {
  return Object.keys(THEME_LOOKS).find((set) => THEME_LOOKS[set][0] === row && THEME_LOOKS[set][1] === value) ?? null;
}

/** Can the shopkeeper wear this? Everything is free except theme rewards still to earn. */
export function ownsLook(state, row, value) {
  const set = lookTheme(row, value);
  return !set || themeComplete(state.collection, set);
}
