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

M0-M6 are done: skeleton, furnished shop and shopkeeper, the stock loop (order book, doorstep
deliveries, carrying boxes to shelves), customers with checkout and wish notes, the day cycle
(morning / open / twilight evening / closing summary, plus close early), and M6:

- **M6 (Collection & Dream Dollhouse v0), pushed 2026-10-09, waiting for the user's phone
  feedback.** Toolbar is now Order / Album / day button / Grow. Grow builds the Window Display
  (🪙 100, right of the shop) and then becomes the Dollhouse button. Decorate mode zooms in on the
  dollhouse with a bottom panel: 4 rooms (one slot each) and the Collection items that fit. Sparkle
  comes from placed items, speeds up visitor arrivals, and makes some visitors stop beside the
  window ("ooh!"); some of them want an item they saw there. Design: GDD v0.9 decisions #27-32.
  Numbers to tune with feedback: expansion cost (`js/data/dollhouse.js` `EXPANSIONS`), item
  Sparkle (`js/data/items.js`), traffic and peek rates (`SPARKLE` in `js/data/dollhouse.js`).

**Next: M7 (Helpers, upgrades, creator)**: hire a cashier, a few upgrades, a simple shopkeeper
creator. Before or during M7, revisit the early economy (GDD §18 #2): players sell out within the
first minute. Also fix the open bugs in `docs/ISSUES.md` (delivery boxes blocking the register).

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
- **Process with the user:** discuss design changes and update docs/GDD.md before building them.
  Each milestone ends with a push so the user can try it on their phone (a Pixel), then give
  feedback.
