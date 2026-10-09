# Known Issues & Bugs

Bugs and rough edges found in playtesting or development. Add new ones at the top of **Open** with
the date and how to reproduce. When one is fixed, move it to **Fixed** with the commit/milestone.
Design questions (not bugs) belong in [GDD.md](GDD.md) §18.

## Open

### Delivery boxes can block the cash register (2026-10-09, playtest)
- **What happens:** when many boxes are delivered, they stack up on the doorstep in front of the
  counter and block it, so you can't ring customers up and can't sell anything.
- **Why (likely):** `BOX_SPOTS` in `js/sim/stock.js` are three doorstep spots at x -1.2..-0.36, right
  in front of the counter (x -1.05). After three boxes they stack upward (`boxSpot` layers), and in the
  front-on camera the stack covers the counter. Taps land on the boxes' (enlarged) hitboxes first,
  so the counter / register can't be tapped. The stack may also hide the queue and checkout prompt.
- **Fix ideas:** spread spots along the doorstep away from the counter (toward the right of the
  shop), cap the stack height, or let counter taps win over box taps when a checkout is waiting.

## Fixed

_(none yet)_
