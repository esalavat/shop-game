// The order book's catalog pages (GDD #66): page 1 is open from the start, and each fancier page
// opens once you've found enough items for your Collection. After round 1, the pages open again in
// bolder colors at higher prices (color rounds, GDD #77); the catalog's "steps" are every page of
// every round, in the order they open (STEPS). Anything you've already found can always be ordered
// again, whatever page it's on.

import { ITEMS, STEPS, stepOf } from '../data/items.js';

export const foundCount = (state) => Object.keys(ITEMS).filter((id) => state.collection[id]).length;

/** How many catalog steps (pages of every round) are open (at least 1). */
export const openPageCount = (state, found = foundCount(state)) => STEPS.filter((p) => found >= p.opensAt).length;

export const pageOpen = (state, step) => step < openPageCount(state);

/** Can this item be ordered now? Its page is open, or it's already in your Collection. */
export const canOrder = (state, itemId) => Boolean(ITEMS[itemId]) && (pageOpen(state, stepOf(itemId)) || !!state.collection[itemId]);

/** Every item that can be ordered now: what customers may wish for when it isn't on the shelves. */
export const orderableItems = (state) => Object.keys(ITEMS).filter((id) => canOrder(state, id));

/** Items still to find before the next step opens, or null when every page is open. */
export function toNextPage(state) {
  const next = STEPS[openPageCount(state)];
  return next ? { page: openPageCount(state), need: next.opensAt - foundCount(state) } : null;
}

/** Items still to find before this step opens (0 if it's open). */
export const needFor = (state, step) => Math.max(0, STEPS[step].opensAt - foundCount(state));

/** Is any part of this round open? */
export const roundOpen = (state, round) => foundCount(state) >= STEPS.find((p) => p.round === round).opensAt;
