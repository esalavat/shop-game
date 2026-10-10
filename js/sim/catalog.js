// The order book's catalog pages (GDD #66): page 1 is open from the start, and each fancier page
// opens once you've found enough items for your Collection. After round 1, the pages open again in
// bolder colors at higher prices (color rounds, GDD #77); the catalog's "steps" are every page of
// every round, in the order they open (STEPS). Anything you've already found can always be ordered
// again, whatever page it's on.
// A step that has opened stays open (state.pagesOpen, GDD #79), so adding items or moving the
// thresholds never closes a page someone already has. Each step also needs a number of happy
// customers (state.hearts, GDD #80), so a page can open in the middle of the day, on a sale.

import { ITEMS, STEPS, stepOf } from '../data/items.js';

export const foundCount = (state) => Object.keys(ITEMS).filter((id) => state.collection[id]).length;

/** Has this shop found enough items and made enough customers happy for a step? */
const ready = (state, p, found) => found >= p.opensAt && (state.hearts ?? 0) >= p.hearts;

/** How many catalog steps (pages of every round) are open (at least 1). */
export const openPageCount = (state, found = foundCount(state)) =>
  Math.max(state.pagesOpen ?? 1, STEPS.filter((p) => ready(state, p, found)).length);

/** Remember how many steps are open, so they stay open. Returns the steps that just opened. */
export function notePagesOpen(state) {
  const before = state.pagesOpen ?? 1;
  state.pagesOpen = openPageCount(state);
  return STEPS.map((p, i) => i).filter((i) => i >= before && i < state.pagesOpen);
}

export const pageOpen = (state, step) => step < openPageCount(state);

/** Can this item be ordered now? Its page is open, or it's already in your Collection. */
export const canOrder = (state, itemId) => Boolean(ITEMS[itemId]) && (pageOpen(state, stepOf(itemId)) || !!state.collection[itemId]);

/** Every item that can be ordered now: what customers may wish for when it isn't on the shelves. */
export const orderableItems = (state) => Object.keys(ITEMS).filter((id) => canOrder(state, id));

/** The next step to open, with the items still to find and the Hearts still to earn, or null when every page is open. */
export function toNextPage(state) {
  const page = openPageCount(state);
  return STEPS[page] ? { page, ...needFor(state, page) } : null;
}

/** Items still to find (`need`) and happy customers still to make (`hearts`) before a step opens; both 0 if it's open. */
export function needFor(state, step) {
  if (pageOpen(state, step)) return { need: 0, hearts: 0 };
  return { need: Math.max(0, STEPS[step].opensAt - foundCount(state)), hearts: Math.max(0, STEPS[step].hearts - (state.hearts ?? 0)) };
}

/** "Find 3 new items and make 40 more customers happy ❤️" (what a locked step still needs). */
export function needText(state, step) {
  const { need, hearts } = needFor(state, step);
  const find = need ? `find ${need} new item${need > 1 ? 's' : ''}` : ''; // not "treasures": that's a page name (GDD #81)
  const happy = hearts ? `make ${hearts} more customer${hearts > 1 ? 's' : ''} happy ❤️` : '';
  const text = [find, happy].filter(Boolean).join(' and ');
  return text[0].toUpperCase() + text.slice(1);
}

/** Is any part of this round open? */
export const roundOpen = (state, round) => pageOpen(state, STEPS.findIndex((p) => p.round === round));
