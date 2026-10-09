# Known Issues & Bugs

Bugs and rough edges found in playtesting or development. Add new ones at the top of **Open** with
the date and how to reproduce. When one is fixed, move it to **Fixed** with the commit/milestone.
Design questions (not bugs) belong in [GDD.md](GDD.md) §18.

## Open

_(none)_

## Fixed

### Delivery boxes can block the cash register (2026-10-09, playtest) — fixed in M7
- Boxes stacked on the doorstep right in front of the counter and covered it, so the register couldn't be tapped.
- **Fix:** `BOX_SPOTS` in `js/sim/stock.js` moved to the right end of the doorstep (x 0.66..1.8), away from the counter,
  with four spots before boxes stack. The Stock Cart upgrade also lets the shopkeeper carry two at a time.
