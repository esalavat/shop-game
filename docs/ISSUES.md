# Known Issues & Bugs

Bugs and rough edges found in playtesting or development. Add new ones at the top of **Open** with
the date and how to reproduce. When one is fixed, move it to **Fixed** with the commit/milestone.
Design questions (not bugs) belong in [GDD.md](GDD.md) §18.

## Open

### The shop's corner piece hides behind the counter (2026-10-09, noticed in testing)
- In the main shop the plant spot is in the back-left corner, behind the counter, so a new corner piece (Decorate
  rooms → Corner, GDD #68) is mostly hidden by your shopkeeper, Mia and the customer at the till. Other rooms show it
  near the front. Could move the shop's plant (its fixture position is saved, so it needs a migration) or give the shop
  a different decor spot.

### Toasts sit on top of the "Tap a ＋" banner (2026-10-09, noticed in testing)
- In room placement mode, a toast (e.g. "Your 🪜 Stairwell is open!") appears over the place banner at the top, so
  both are hard to read for a moment. Minor; move toasts below the banner while it shows, or hide the banner first.

### A Stairwell built before v0.27 can sit away from the shop (2026-10-09, test build only)
- Between v0.24 and v0.27 (on `/dev/` only) you chose where the Stairwell went. Those saves keep it where it is; new
  ones always go right of the shop (#64). Nothing breaks (routes work from any column), it just doesn't match the
  rule. Never on the public game.

### Delivery boxes stack too high and hide the shelves (2026-10-09, user)
- The doorstep has four box spots (`BOX_SPOTS` in `js/sim/stock.js`); every box after that stacks on top. A big
  delivery (or a few days of orders left unpacked) builds tall towers in front of the shop that hide the shelves
  behind them and get in the way of tapping them.
- **Idea (user):** a **delivery bin** on the doorstep instead of loose stacks. Tap it to open a window listing every
  box waiting (item picture, how many); tap one there to send your shopkeeper to fetch it. The bin could show a few
  boxes poking out, or a count, so you can still see at a glance that deliveries came. Bea would take boxes from
  the bin the same way. Needs a design pass (GDD) before building: where the bin sits, whether some boxes still
  show on the doorstep, and how the first-day guide's "Tap a box!" arrow (#57) points at the bin.
- **Designed 2026-10-09 (GDD #74), being built:** three loose doorstep spots plus a delivery bin with a count badge and
  a list to pick from.

## Fixed

### A big day's summary hides the "Start Day" button (2026-10-09, tester, Day 37) — fixed
- With many kinds of items sold, the summary grew taller than the sheet: "Start Day N" was pushed off the bottom
  of the screen and nothing scrolled, so the player was stuck.
- **Fix:** the middle of the summary (record, stats, Ribbons, sold, wishes) is a scroll box (`.summary-scroll`);
  the title and the Order / Start Day buttons always stay on screen.

### After ordering from the day summary there's no "Start Day" button (2026-10-09, user) — fixed
- Summary → "Order for tomorrow" → ✕ left you on the toolbar; you had to know to tap "Day summary" (a plain button)
  to find "Start Day N".
- **Fix (GDD #67):** closing the order book (✕ or the backdrop) after opening it from the summary brings the summary
  back (`open({ then })` in `js/ui/orderbook.js`). The toolbar's "Day summary" button is pink (`primary`) after closing.

### Evening waits for customers to walk all the way off-screen (2026-10-09, user) — fixed
- In the evening the day only closes once `state.customers` is empty (`tickDay` in `js/sim/day.js`), and a
  customer is only removed when they reach the end of the road. With the Window Display and theme rooms the
  building is wide, so after the last one pays (or decides to leave) you wait a long time with nothing to do.
- **Wanted (user):** close as soon as nobody is still shopping, in line or paying, i.e. everyone left is in the
  `leaving` state. They can keep walking away behind the closing summary (or be cleared). GDD §18 #7.
- **Fix (GDD #62):** the evening is 10 s; when it's over, `tickCustomers` sends everyone still shopping (any state in
  `GIVE_UP`, the same backstop as `CUSTOMER.patience`) to the line with what they have, or home. `tickDay` closes once
  every customer left is `leaving`. In a scratch run of 60 busy days with upstairs rooms the evening went from 40 s
  (median; 75 s worst) to 18 s (54 s worst); what's left is the line paying. Tests in `tests/day.test.js`.

### Customers stuck at the shelves; the shop could never close (2026-10-09, user, Day 9 with Tea Time) — fixed
- Customers bunched up at two shelves (in Tea Time and the shop) and never moved, so the evening never ended
  (closing waits for everyone to leave). Reloading the page clears it (customers aren't saved).
- **Cause:** the people at the shelves were waiting for a place in line (`waitingQueue`). The line itself was
  deadlocked: a customer coming back from a theme room joins the line before arriving, and their walk to their spot
  passed right beside someone already standing in line. `sim/crowd.js` pushed the walker back every tick (people
  standing are never pushed), so they never arrived, the front of the line never reached the counter, and Mia
  could never ring anyone up. More rooms meant more customers and more walking past the line, so it showed up with
  theme rooms; it could happen before too.
- **Fix:** `separate()` tracks whether each walker is getting closer to their next waypoint; after 8 ticks without
  progress they slip through people for 15 ticks. Plus a backstop: a customer still shopping after
  `CUSTOMER.patience` (150 s) gives up on the rest of their list and pays (or leaves). `tests/busyday.test.js`
  replays a day that used to freeze. A scratch stress run (75 busy days, two theme rooms, Mia and Bea) went from
  50 stuck runs to none.

### Boxes float in the air when you take one from the bottom of a stack (2026-10-09, user) — fixed
- With more than four boxes on the doorstep they stack. Tapping a box in the bottom row picks it up, but the
  box above it stays where it was, floating.
- Cause: a box's place is a fixed spot number (`BOX_SPOTS` in `js/sim/stock.js`; spot 4 sits on top of
  spot 0), and nothing moved the upper box down when the one below left.
- **Fix:** `settleBoxes()` in `js/sim/stock.js` drops boxes into the gap after any pickup (by the shopkeeper or
  Bea), and on load for older saves. The boxes view animates the drop.

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
