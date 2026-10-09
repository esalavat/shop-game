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

M0-M7 are done: skeleton, furnished shop and shopkeeper, the stock loop (order book, doorstep
deliveries, carrying boxes to shelves), customers with checkout and wish notes, the day cycle
(morning / open / short twilight evening / closing summary, plus close early), Collection and
Dream Dollhouse v0 (M6, approved), and M7:

- **M7 (Helpers, upgrades, creator), built 2026-10-09 (GDD v0.12 decisions #35-39), waiting for the
  user to try it on their phone.**
  - The toolbar has 5 buttons once the Window Display is built: Order / Album / day / Dollhouse / Grow.
    The Grow sheet lists rooms, helpers and upgrades.
  - **Mia the cashier** (🪙 150, one-time) rings people up without tips. She steps aside when the
    shopkeeper comes to the counter.
  - **Upgrades:** Stock Cart (🪙 60, carry 2 boxes), Comfy Shoes (🪙 80, walk faster), Lunchtime
    Delivery (🪙 100, orders placed before midday arrive at midday).
  - **Shopkeeper creator:** hair, colors, outfit, accessory. It shows on a new game and once for old
    saves. Tap the shopkeeper in the morning to change it.
  - **Fixed:** delivery boxes no longer block the register; they sit on the right of the doorstep.
  - Numbers to tune with feedback are in `js/data/upgrades.js`.
- The early economy stays as it is (decision #39): closing early covers selling out.
- **Pip's rescue box (GDD v0.13 #40), built 2026-10-09:** if a morning starts with nothing to sell,
  nothing ordered, and too few coins for the cheapest box, Pip brings a free one, so you can never get stuck.

**Next:** get the user's feedback on M7, then M8 (Polish pass: juice, first sounds, phone perf, PWA
manifest). Open design questions from the user are in GDD §18 #4 (show sell price / profit in the order
book) and #5 (demand-based pricing vs fixed prices); neither is scheduled yet.

## How the code is organized

- `js/sim/` is pure game logic on one JSON-serializable `state` object (no three.js or DOM), so it
  can be unit-tested in Node. `js/render/` draws state with three.js; `js/ui/` is the DOM overlay.
  The sim emits events (`js/core/events.js`) that render and UI react to.
- Content lives in `js/data/` (items, fixtures, rooms, customers, dollhouse slots / Sparkle /
  expansions).
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
