# Known Issues & Bugs

Bugs and rough edges found in playtesting or development. Add new ones at the top of **Open** with
the date and how to reproduce. When one is fixed, move it to **Fixed** with the commit/milestone.
Design questions (not bugs) belong in [GDD.md](GDD.md) §18.

## Open

_(none)_

## Fixed

### Bonus-spot rings and the street edge flickered on the phone (2026-10-09, user video) — fixed
- The greeter ring was drawn at exactly the sidewalk's top height, and the sidewalk and road overlapped by a thin
  strip at the same height, so both z-fought (flickered, looked dashed) on the Pixel.
- **Fix:** rings float 0.05 above the ground with a polygon offset (`render/views/spots.js`); the road sits slightly
  lower than the sidewalk and they no longer overlap (`render/environment.js`). Keep flat decals clear of other
  surfaces by at least a few hundredths: phones have coarse depth buffers.

### Soft-lock: no stock and no coins (2026-10-09, user) — fixed after M7 (GDD v0.13 #40)
- Spending everything (upgrades, helpers, Window Display) with empty shelves and nothing ordered left you with
  fewer coins than the cheapest box, so you could never earn again. Possible since M6, much easier after M7.
- **Fix:** Pip's rescue box. `rescueIfStuck()` in `js/sim/day.js` runs each morning: if nothing is left to sell,
  nothing is on order, and you can't afford the cheapest box, Pip drops a free box of it.

### Delivery boxes can block the cash register (2026-10-09, playtest) — fixed in M7
- Boxes stacked on the doorstep right in front of the counter and covered it, so the register couldn't be tapped.
- **Fix:** `BOX_SPOTS` in `js/sim/stock.js` moved to the right end of the doorstep (x 0.66..1.8), away from the counter,
  with four spots before boxes stack. The Stock Cart upgrade also lets the shopkeeper carry two at a time.
