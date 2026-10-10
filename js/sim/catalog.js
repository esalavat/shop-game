// The order book's catalog pages (GDD #66): page 1 is open from the start, and each fancier page
// opens once you've found enough items for your Collection. Anything you've already found can
// always be ordered again, whatever page it's on.

import { ITEMS, PAGES } from '../data/items.js';

export const foundCount = (state) => Object.keys(ITEMS).filter((id) => state.collection[id]).length;

/** How many catalog pages are open (at least 1). */
export const openPageCount = (state, found = foundCount(state)) => PAGES.filter((p) => found >= p.opensAt).length;

export const pageOpen = (state, page) => page < openPageCount(state);

/** Can this item be ordered now? Its page is open, or it's already in your Collection. */
export const canOrder = (state, itemId) => Boolean(ITEMS[itemId]) && (pageOpen(state, ITEMS[itemId].page) || !!state.collection[itemId]);

/** Every item that can be ordered now: what customers may wish for when it isn't on the shelves. */
export const orderableItems = (state) => Object.keys(ITEMS).filter((id) => canOrder(state, id));

/** Items still to find before the next page opens, or null when every page is open. */
export function toNextPage(state) {
  const next = PAGES[openPageCount(state)];
  return next ? { page: openPageCount(state), need: next.opensAt - foundCount(state) } : null;
}
