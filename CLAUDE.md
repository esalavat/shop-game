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
Collection and Dream Dollhouse v0 (M6), and M7 (Mia the cashier, three upgrades, the shopkeeper
creator, walking out to the Window Display and the greeter spot, Pip's rescue box).

- **M8 (Polish pass), built 2026-10-09, waiting for the user's feedback on the phone** (GDD v0.15,
  decisions #45-50):
  - **Juice:** coins, tips and hearts pop at the register; hearts float up from happy customers;
    stocked items squash and stretch onto the shelf with a sparkle; an emptied box goes *poof*;
    dollhouse items and window-peekers sparkle; **confetti** for a new room, helper or upgrade.
  - **Sounds**, all synthesized in code (no files): pop, scan beep, cha-ching, door bell when a
    customer walks in, sparkle chimes, fanfare, open / evening / morning jingles. **No music yet.**
    🔊 **mute button** in the HUD (saved; also stops vibration).
  - **Haptics:** short vibrations on a sale, stocking, and confetti (Android only).
  - **Bouncy UI:** buttons squish, sheets and panels spring open, toasts and pop-ups pop in.
  - **End-of-day celebration:** the summary counts up with ticks and a cha-ching; beating your best
    day for coins shows "New record! 🏆" with confetti (`state.best.coins`; save version 10).
  - **Perf:** adaptive pixel ratio (`render/quality.js`); shaders for effects compile at boot. 60 fps
    in Chrome with a 4× slower CPU at Pixel size (`docs/TECH.md` §5.4). Not yet checked on the real Pixel.
  - **PWA:** PNG app icons, network-first service worker (`sw.js`), so it installs to the home screen
    and opens offline (`docs/TECH.md` §9.3).
  - Things to ask the user about: are the sounds too loud, too many, or annoying (the door bell rings
    for every customer)? Does the home-screen install work on the Pixel? Does the fps stay smooth?

**Next:** the user's M8 feedback, then pick from "Not scheduled yet" below or the GDD §17 "Next" list.
The MVP list in GDD §17 is complete.

**Not scheduled yet (ideas the user raised, in the GDD):**
- Boy or girl shopkeeper choice in the creator (#43).
- Show the sell price and profit in the order book (§18 #4).
- Demand-based pricing vs fixed prices (§18 #5).
- Background music (a music-box loop by time of day, GDD §15).

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
- Game feel is event-driven: `js/ui/juice.js` listens to sim events and plays sounds
  (`js/audio/audio.js`), 3D effects (`js/render/fx.js`), pop-ups (`js/ui/overlay.js`) and confetti
  (`js/ui/confetti.js`). Add new feedback there rather than in the sim.
- `js/main.js` wires everything together: a fixed-step 10 Hz sim tick plus per-frame rendering with
  interpolation.

## Working rules

- **Saves:** when the shape of `state` changes, bump `STATE_VERSION` in `js/sim/state.js` and add
  a migration in `js/core/save.js` (with a test in `tests/save.test.js`). Live-only fields
  (customers, queue, checkout) are listed in `TRANSIENT` and never saved.
- **Tests:** `npm test` (node --test, zero dependencies). Add tests for new sim behavior.
- **Run locally:** `npm run serve`, then open http://localhost:8123 (`scripts/serve.js` also takes a
  `PORT` env var; the preview config in `.claude/launch.json` lets it pick a free port). Add `?debug` for the debug
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
