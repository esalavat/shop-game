# My Dream Dollhouse Shop

A cozy, mobile-first (portrait, touch-only) low-poly 3D shop game for ages 11-15, built with
three.js and plain ES modules (no build step). Live at https://esalavat.github.io/shop-game/.

- **Design:** [docs/GDD.md](docs/GDD.md). The Decisions Log at the top is the source of truth;
  §18 lists open questions.
- **Tech plan and progress:** [docs/TECH.md](docs/TECH.md). §11 is the milestone list (✅ = done).
- **Bugs and rough edges:** [docs/ISSUES.md](docs/ISSUES.md).

## Keeping the docs current (always)

The docs must be enough for a brand-new session to pick up where the last one stopped, with no
chat history. Update them as part of the work, in the same commit, whenever they're affected:

- **Game design decisions** (anything the user decides or approves, and design choices made while
  building) → `docs/GDD.md`: add a row to the Decisions Log with the version, update the relevant
  section and the §17 roadmap checkboxes, and bump the draft version. Unresolved design questions
  and playtest feedback go in §18.
- **Progress** → the **Status** section below: what's done, what's next, and anything half-finished
  or waiting on the user's feedback. Also tick the milestone in `docs/TECH.md` §11.
- **Technical changes** (new modules, state shape, architecture) → `docs/TECH.md` and the "How the
  code is organized" section below if it changes.
- **Bugs** the user reports or that you notice → `docs/ISSUES.md` (move to Fixed when fixed).
- **Working rules** the user gives → this file.

Before ending a session or pushing, re-read Status and make sure it's true.

## Status

M0-M7 are done and approved by the user: skeleton, furnished shop and shopkeeper, the stock loop
(order book, doorstep deliveries, carrying boxes to shelves), customers with checkout and wish
notes, the day cycle (morning / open / short twilight evening / closing summary, plus close early),
Collection and Dream Dollhouse v0 (M6), and M7.

- **M7 (Helpers, upgrades, creator), approved 2026-10-09** (GDD v0.12-v0.14, decisions #35-44):
  - The toolbar has 5 buttons once the Window Display is built: Order / Album / day / Dollhouse / Grow.
    The Grow sheet lists rooms, helpers and upgrades.
  - **Mia the cashier** (🪙 150, one-time) rings people up without tips. She steps aside when the
    shopkeeper comes to the counter.
  - **Upgrades:** Stock Cart (🪙 60, carry 2 boxes), Comfy Shoes (🪙 80, walk faster), Lunchtime
    Delivery (🪙 100, orders placed before midday arrive at midday). Numbers are in `js/data/upgrades.js`.
  - **Shopkeeper creator** with a 🎲 randomize button. It shows on a new game; tap the shopkeeper in
    the morning to change it.
  - **The shopkeeper can walk out to the sidewalk and into the Window Display** (#41). Bonus spots are
    marked with a glowing ring and a bobbing icon (#44):
    - ✨ beside the dollhouse: more window-peekers, who want what they saw
    - 👋 the greeter spot by the shop door: greeted customers often pick up a second item
  - **Pip's rescue box** (#40): if a morning starts with nothing to sell, nothing ordered, and too few
    coins, Pip brings a free box, so you can never get stuck.
  - **Fixed:** boxes blocking the register; flickering rings and street edge on the phone.
  - The early economy stays as it is (#39): closing early covers selling out.

**Next: M8 (Polish pass)**: juice (pops, sparkles), first sounds, phone perf check, PWA manifest
(`docs/TECH.md` §11). Discuss the plan with the user first.

**Not scheduled yet (ideas the user raised, in the GDD):**
- Boy or girl shopkeeper choice in the creator (#43).
- Show the sell price and profit in the order book (§18 #4).
- Demand-based pricing vs fixed prices (§18 #5).

## How the code is organized

- `js/sim/` is pure game logic on one JSON-serializable `state` object (no three.js or DOM), so it
  can be unit-tested in Node. `js/render/` draws state with three.js; `js/ui/` is the DOM overlay.
  The sim emits events (`js/core/events.js`) that render and UI react to.
- Content lives in `js/data/` (items, fixtures, rooms, customers, dollhouse slots / Sparkle /
  expansions, upgrades and helpers).
- Walking between rooms and onto the street is in `js/sim/route.js`. During such a walk the keeper
  uses shop-room coordinates and switches rooms on arrival (`docs/TECH.md` §4.3.3).
- Positions are room-local: x across the room, z from the back wall (-D/2) to the open front (+D/2).
  Room size is `ROOM_SIZE` in `js/data/rooms.js`. Customers keep shop-room coordinates even on the
  sidewalk in front of other rooms (e.g. peeking at the Window Display, `windowX` in
  `js/sim/collection.js`).
- `js/main.js` wires everything together: a fixed-step 10 Hz sim tick plus per-frame rendering with
  interpolation.

## Working rules

- **Saves:** when the shape of `state` changes, bump `STATE_VERSION` in `js/sim/state.js` and add
  a migration in `js/core/save.js` (with a test in `tests/save.test.js`). Live-only fields
  (customers, queue, checkout) are listed in `TRANSIENT` and never saved.
- **Tests:** `npm test` (node --test, zero dependencies). Add tests for new sim behavior.
- **Run locally:** `npm run serve`, then open http://localhost:8123. Add `?debug` for the debug
  panel: fill shelves, spawn customer, skip ahead, add rooms, reset save. The local server disables
  caching on purpose.
- **Verify in the browser at phone size** (375x812) before pushing.
- **Deploy:** push to `main`. GitHub Actions (`.github/workflows/pages.yml`) runs the tests, then
  `scripts/stamp.js` version-stamps every module URL so phones never mix cached files from
  different deploys.
- **Commits:** plain messages, with no "Co-Authored-By: Claude" trailer.
- **No digital timers** (countdowns like 2:15) anywhere in the game UI. Show time as a bar or
  through the lighting.
- **Process with the user:** discuss design changes and update docs/GDD.md before building them.
  Each milestone ends with a push so the user can try it on their phone (a Pixel), then give
  feedback.
