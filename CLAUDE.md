# My Dream Dollhouse Shop

A cozy, mobile-first (portrait, touch-only) low-poly 3D shop game for ages 11-15, built with
three.js and plain ES modules (no build step). The public game is at https://esalavat.github.io/shop-game/
(the latest release); the test build is at https://esalavat.github.io/shop-game/dev/ (the tip of `main`).

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

- **M8 (Polish pass), built 2026-10-09; the user approved the sounds, other feedback still to come** (GDD v0.15,
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
  - Still to hear from the user: does the home-screen install work on the Pixel, and does the fps stay smooth?

- **Bea the stocker, built 2026-10-09, waiting for the user's feedback** (GDD v0.18 #51, #53): 🪙 200 in
  the Grow sheet. She fetches doorstep boxes (wished-for items first, then items not on the shelves) and
  unpacks them onto the emptiest shelf, in the morning, open hours and evening; never takes the box your
  shopkeeper is heading for; waits by the right wall. Code: `js/sim/stocker.js`, drawn in
  `js/render/views/helpers.js`. Stock events carry `by: 'keeper' | 'stocker'`. Save version 11.
- **Midday mark** on the day bar for Lunchtime Delivery (#52), done.
- **Order book** cards show the sell price per item and a mint "+🪙 12 profit" tag for the box (#54), done.
- **Boy or girl shopkeeper** (#43, #55), done: the creator's first row; boys' hair short / spiky / curly /
  swoop and a bow tie or cap (`CREATOR` in `js/data/customers.js`, drawn in `js/render/models/character.js`).
  `shopkeeper.body`, save version 12.
- **Fixed:** boxes floating when you take one from the bottom of a stack (`settleBoxes`, docs/ISSUES.md).
- **Fixed 2026-10-09:** customers stuck behind the line so the shop could never close (user, with more rooms):
  walkers slip past people when blocked (`sim/crowd.js`), customers give up after 150 s, `tests/busyday.test.js`.

- **Public game and test build, built 2026-10-09** (GDD v0.21 #56, `docs/TECH.md` §9.1, §9.4): pushes to `main`
  deploy `/dev/`; `npm run release` publishes a GitHub Release, which deploys the public link. Separate saves
  per build (dev starts from a copy of the real save), a newer save is never overwritten, backups before
  migrating, and sample saves in `tests/fixtures/saves/` that every release must load. Repo settings: the
  `github-pages` environment allows `v*` tags. First release **v2026.10.9** is out (2026-10-09).

- **First-day guide, built 2026-10-09, waiting for the user's feedback** (GDD v0.22 #57): arrows over a box →
  a shelf → Open shop → the register, once per new game (`js/sim/tutorial.js`, `js/ui/guide.js`;
  `state.tutorial`, save version 13, existing saves skip it). Plus an "Open your shop!" arrow any morning after
  5 s of nothing happening. On `/dev/` only until the user releases it.

- **Stairwell and upstairs rooms, built 2026-10-09, waiting for the user's feedback** (GDD v0.24 #58, #61, #64):
  Grow → Stairwell (🪙 350, after the first room); it always goes right next to the shop (rooms on that side move
  over) and builds two floors (spiral stairs, a shelf on each). Upstairs rooms connect through side doorways. Tap the
  stairs to send your shopkeeper up (the railing round the hole to come down). Customers and Bea climb too; everyone
  pays downstairs. Routes come in legs (`sim/route.js`, `docs/TECH.md` §4.3.3). `tests/stairs.test.js`. (Theme rooms,
  v0.23 #58, came first and were replaced by plain shelf rooms in #65.) On `/dev/` only.
- **Quick evenings, built 2026-10-09, waiting for the user's feedback** (GDD v0.25 #62): 10 s of twilight, then
  shoppers pay for what they have or go home; the day closes once the last one has paid, while they're still walking
  away. **Close now** (#63, v0.26): in the evening the day button closes on the spot (two taps); customers put their
  things back on the shelves and go home (`sendEveryoneHome` in `sim/customers.js`, `closeNow` in `sim/day.js`).
  On `/dev/` only.
- **Plain shelf rooms, more floors, prices by distance, built 2026-10-09, waiting for the user's feedback** (GDD v0.28
  #65): theme rooms and Sorting Smarts are gone (save v16 turns built theme rooms into shelf rooms and refunds
  Sorting Smarts). Grow → Build a room → tap a ＋ (each shows its price: by ring around the middle, sideways or up,
  +15% per floor, so a squarish house is cheapest). Grow → Another floor raises the Stairwell (each staircase costs
  more). Routes climb floor by floor. Prices are first guesses (`js/data/rooms.js`). On `/dev/` only.
- **Next to design:** the **decoration shop** (its own currency) to restyle rooms (GDD #65).
- **Planned next, in order:** (#59) **more items** (toward 100+, color variants, catalog pages that open as you
  collect), the **Collection bonus** and page rewards (coins, confetti, a shopkeeper style). Later: more stockers
  (#60), Instant Delivery (GDD §11), Heart/Sparkle milestone unlocks (§18 #6). Open issue: delivery boxes stack too
  high (delivery-bin idea, docs/ISSUES.md).

**Next:** hear back on shelf rooms / floors / prices (#65), the Stairwell, quick evenings and Close now on `/dev/`;
then design the decoration shop or #59 (more items), whichever the user picks; hear back about quick evenings
and Close now on `/dev/`; then #59 (more items). Still waiting on: M8 feedback (home-screen install, fps on the Pixel), Bea and
first-day-guide feedback. Nothing new has been released since **v2026.10.9.2** (first-day guide); theme rooms, the
crowd fix, the Stairwell and shelf rooms are on `/dev/` only, and releasing them changes the save version (v13 → v16). The MVP list
in GDD §17 is complete.

**Not scheduled yet (ideas the user raised, in the GDD):**
- Demand-based pricing vs fixed prices (§18 #5).
- Background music (a music-box loop by time of day, GDD §15).
- An Orderer helper who re-orders what sells (GDD §10, not decided).

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

- **Saves are never lost** (people play the public game now; `docs/TECH.md` §9.4): when the shape of `state`
  changes, bump `STATE_VERSION` in `js/sim/state.js`, add a migration in `js/core/save.js` (with a test in
  `tests/save.test.js`), then run `node scripts/save-fixture.js` to add the new sample save. Never edit or
  delete old samples in `tests/fixtures/saves/`, and never drop or rename a saved field without a migration.
  Live-only fields (customers, queue, checkout) are listed in `TRANSIENT` and never saved. Anything else
  kept in the browser must be per build (see `js/core/channel.js`): both builds share one origin.
- **Tests:** `npm test` (node --test, zero dependencies). Add tests for new sim behavior.
- **Run locally:** `npm run serve`, then open http://localhost:8123 (`scripts/serve.js` also takes a
  `PORT` env var; the preview config in `.claude/launch.json` lets it pick a free port). Add `?debug` for the debug
  panel: fill shelves, spawn customer, skip ahead, add rooms, reset save. The local server disables
  caching on purpose.
- **Verify in the browser at phone size** (375x812) before pushing.
- **Deploy:** push to `main` → the test build at `/dev/` (GitHub Actions `.github/workflows/pages.yml` runs
  the tests, then `scripts/stamp.js` version-stamps every module URL so phones never mix cached files).
  **Releases** to the public link happen only when the user asks: `npm run release` (it shows what's going
  out and asks first). Mention it when a save-version change is going out. Details in `docs/TECH.md` §9.1.
- **Commits:** plain messages, with no "Co-Authored-By: Claude" trailer.
- **No digital timers** (countdowns like 2:15) anywhere in the game UI. Show time as a bar or
  through the lighting.
- **Process with the user:** discuss design changes and update docs/GDD.md before building them.
  Each milestone ends with a push so the user can try it on their phone (a Pixel) on the `/dev/` link,
  then give feedback; the user decides when it's released.
