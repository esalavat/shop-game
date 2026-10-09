# My Dream Dollhouse Shop

A cozy, mobile-first (portrait, touch-only) low-poly 3D shop game for ages 11-15, built with
three.js and plain ES modules (no build step). Live at https://esalavat.github.io/shop-game/.

- **Design:** [docs/GDD.md](docs/GDD.md). The Decisions Log at the top is the source of truth;
  §18 lists open questions.
- **Tech plan and progress:** [docs/TECH.md](docs/TECH.md). §11 is the milestone list (✅ = done).

## Status

M0-M5 are done: skeleton, furnished shop and shopkeeper, the stock loop (order book, doorstep
deliveries, carrying boxes to shelves), customers with checkout and wish notes, and the day cycle
(morning / open / twilight evening / closing summary, plus close early).

**Next: M6 (Collection & Dream Dollhouse v0).** The Collection album UI (unlocks are already
tracked in `state.collection`), and the first expansion, which builds a Window Display room
(room type `display` already exists in `js/data/rooms.js`) holding the Dream Dollhouse with fixed
decorating slots; Sparkle drives foot traffic. Before or during M7, revisit the early economy
(GDD §18 #2): players sell out within the first minute.

## How the code is organized

- `js/sim/` is pure game logic on one JSON-serializable `state` object (no three.js or DOM), so it
  can be unit-tested in Node. `js/render/` draws state with three.js; `js/ui/` is the DOM overlay.
  The sim emits events (`js/core/events.js`) that render and UI react to.
- Content lives in `js/data/` (items, fixtures, rooms, customers).
- Positions are room-local: x across the room, z from the back wall (-D/2) to the open front (+D/2).
  Room size is `ROOM_SIZE` in `js/data/rooms.js`.
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
