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

- **M8 (Polish pass), built 2026-10-09, approved by the user** (GDD v0.15,
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

- **Bea the stocker, built 2026-10-09, approved** (GDD v0.18 #51, #53): 🪙 200 in
  the Grow sheet. She fetches doorstep boxes (wished-for items first, then items not on the shelves) and
  unpacks them onto the emptiest shelf, in the morning, open hours and evening; never takes the box your
  shopkeeper is heading for; waits by the right wall. Code: `js/sim/stocker.js`, drawn in
  `js/render/views/helpers.js`. Save version 11 (now `state.stockers`, v19).
- **Midday mark** on the day bar for Lunchtime Delivery (#52), done.
- **Order book** cards show the sell price per item and a mint "+🪙 12 profit" tag for the box (#54), done.
- **Boy or girl shopkeeper** (#43, #55), done: the creator's first row; boys' hair short / spiky / curly /
  swoop and a bow tie or cap (`CREATOR` in `js/data/customers.js`, drawn in `js/render/models/character.js`).
  `shopkeeper.body`, save version 12.
- **Fixed:** boxes floating when you take one from the bottom of a stack (`settleBoxes`, docs/ISSUES.md).
- **Fixed 2026-10-09:** a big day's summary pushed "Start Day" off the screen (tester); the middle now scrolls.
- **Fixed 2026-10-09:** customers stuck behind the line so the shop could never close (user, with more rooms):
  walkers slip past people when blocked (`sim/crowd.js`), customers give up after 150 s, `tests/busyday.test.js`.

- **Public game and test build, built 2026-10-09** (GDD v0.21 #56, `docs/TECH.md` §9.1, §9.4): pushes to `main`
  deploy `/dev/`; `npm run release` publishes a GitHub Release, which deploys the public link. Separate saves
  per build (dev starts from a copy of the real save), a newer save is never overwritten, backups before
  migrating, and sample saves in `tests/fixtures/saves/` that every release must load. Repo settings: the
  `github-pages` environment allows `v*` tags. First release **v2026.10.9** is out (2026-10-09).

- **First-day guide, built 2026-10-09, approved** (GDD v0.22 #57): arrows over a box →
  a shelf → Open shop → the register, once per new game (`js/sim/tutorial.js`, `js/ui/guide.js`;
  `state.tutorial`, save version 13, existing saves skip it). Plus an "Open your shop!" arrow any morning after
  5 s of nothing happening.

- **Stairwell and upstairs rooms, built 2026-10-09, approved** (GDD v0.24 #58, #61, #64):
  Grow → Stairwell (🪙 350, after the first room); it always goes right next to the shop (rooms on that side move
  over) and builds two floors (spiral stairs, a shelf on each). Upstairs rooms connect through side doorways. Tap the
  stairs to send your shopkeeper up (the railing round the hole to come down). Customers and Bea climb too; everyone
  pays downstairs. Routes come in legs (`sim/route.js`, `docs/TECH.md` §4.3.3). `tests/stairs.test.js`. (Theme rooms,
  v0.23 #58, came first and were replaced by plain shelf rooms in #65.)
- **Quick evenings, built 2026-10-09, approved** (GDD v0.25 #62): 10 s of twilight, then
  shoppers pay for what they have or go home; the day closes once the last one has paid, while they're still walking
  away. **Close now** (#63, v0.26): in the evening the day button closes on the spot (two taps); customers put their
  things back on the shelves and go home (`sendEveryoneHome` in `sim/customers.js`, `closeNow` in `sim/day.js`).
- **Plain shelf rooms, more floors, prices by distance, built 2026-10-09, approved** (GDD v0.28
  #65): theme rooms and Sorting Smarts are gone (save v16 turns built theme rooms into shelf rooms and refunds
  Sorting Smarts). Grow → Build a room → tap a ＋ (each shows its price: by ring around the middle, sideways or up,
  +15% per floor, so a squarish house is cheapest). Grow → Another floor raises the Stairwell (each staircase costs
  more). Routes climb floor by floor. Prices are first guesses (`js/data/rooms.js`).
- **24 items on four catalog pages, built 2026-10-09, approved** (GDD v0.29 #66, the first step of
  #59): 6 themes × 4 items; order book tabs Starter / Favorites / Fancy Finds / Treasures, opening at 4 / 10 / 16 items
  found (toast + confetti + a "new" dot); found items can always be reordered; customers only wish for orderable items;
  album sections per theme. `js/sim/catalog.js`, `PAGES` and `page` in `js/data/items.js`, 18 new models in
  `js/render/models/items.js`. No save change. The user may swap or rename items later; the item table is in GDD §6.2.
  Open tuning question: Sparkle maxes out traffic with one Treasure (GDD §18 #10).
- **Back to the summary after ordering** (GDD v0.30 #67), done: ✕ on an order book opened from the summary
  reopens it; the toolbar's Day summary button is pink.
- **Decoration shop and Ribbons 🎀, built 2026-10-09, approved** (GDD v0.31 #68, §9.5): a new
  currency, Ribbons, from granted wish notes (+1, the note is used up), window-peekers buying what they pointed at (+1),
  new Collection items (+2), complete themes (+5) and +1 per 5 happy customers at closing (summary line). 🎀 in the HUD.
  Grow → 🎨 Decorate rooms: bottom panel, ◀ ▶ or tap a room; tabs Walls (colour + pattern), Floor, Rug, Curtains (rooms
  with a window), Corner (the plant spot). Tap to try a style on; owned ones go on at once, others show "Get it! 🎀 N".
  Buy once, use in every room; looks already in the game are free; just for looks. Code: `js/data/decor.js`,
  `js/sim/decor.js`, `js/ui/styler.js`, `js/render/patterns.js`; save version 17 (existing shops get 🎀 2 per item found +
  5 per complete theme). Prices and rates are first guesses. Debug panel has +20 🎀. Known: the shop's corner piece is
  hidden behind the counter (docs/ISSUES.md).
- **Theme rewards** (GDD v0.32 #69), done: completing a theme gives a matching room style (`THEME_STYLES` in
  `js/data/decor.js`; ownership worked out from the Collection, no save change); the album shows each reward. The user
  approved the Ribbon rates and prices for now.
- **Collection bonus and theme rewards, built 2026-10-09, waiting for the user's feedback** (GDD v0.33 #70): +2% visitors
  per item found, +5% per complete theme, up to +50% (added to Sparkle); the album shows it. Completing a theme gives
  🪙 100, then +50 for each one after, with confetti, and a shopkeeper style (Strawberry / Plum Velvet / Starry Night
  outfits, Flower Crown, Bunny Ears, Royal Crown), 🔒 in the creator until then. Old saves get theirs on first load.
  Code: `js/sim/rewards.js`, `COLLECTION` in `js/data/items.js`, `THEME_LOOKS` in `js/data/customers.js`; save version 18
  (`state.themeGifts`).
- **Stock counts in the order book, built 2026-10-09, waiting for feedback (also from the tester who asked)** (GDD v0.34
  #71): chips on each found item's card, 🏪 on shelves / 📦 in boxes / 🚚 coming, or "None in the shop!"; legend under the
  tabs. `stockCount` in `js/sim/stock.js`. No save change.
- **More helpers and upgrades (GDD v0.35 #72), in progress, built in four steps:**
  1. ✅ **Ollie the Greeter** (🪙 250, stands out by the left corner and greets everyone) and **Rosa the Window Dresser** (🪙 300,
     after the Window Display; shows off the Dream Dollhouse); their bonus rings go away once hired. Live-only
     `state.greeter` / `state.dresser` (`js/sim/helpers.js`). **Speedy Scanner** (🪙 120: two items per tap, cashiers
     faster) and **Gift Wrap** (🪙 150: tips ×2). No save change.
  2. ✅ **Tall Shelves** (🪙 250): every shelf gets a top row, 12 slots instead of 9, filled last (`fitShelves` in
     `js/sim/upgrades.js`, run on purchase and whenever a room is built; `tallSlots` in `js/data/fixtures.js`). Slot
     arrays just get longer, so no save change.
  3. ✅ **Up to three stockers**: Bea, then Theo (🪙 350), then Juno (🪙 500); each waits a little further from the right
     wall and they never head for the same box. **Save version 19:** `state.stocker` became `state.stockers` (each with
     `who`, its HELPERS id: 'stocker' | 'stocker2' | 'stocker3'); stock events say `by: 'keeper'` or that id.
  4. The second register became **register rooms** (#73, below).
- **Register rooms, built 2026-10-09, waiting for feedback** (GDD v0.36 #73): Grow → Upgrades → "Register room · floor N"
  (🪙 400, +200 each), once the stairs reach a floor without one. A copy of the shop, always straight above the
  highest register, in the shop's column; rooms in the way move left, and one that would float goes to the nearest
  safe spot (`addRegisterRoom` / `clearSpot` in `js/sim/building.js`; walkers in moved rooms stop where they are).
  Each comes with a cashier (Kai, Nell, Remy, Ivy: `REGISTER_CASHIERS`); customers pay on their floor (`registerFor`).
  Every register has { queue, checkout, cashier }, live-only: the shop's on `state` itself as before, register rooms'
  in `state.registers[roomId]` (`registerOf` in `js/sim/checkout.js`). Events `scanned` / `sale` / `checkoutCancelled`
  carry `roomId`. No save change (a new room type only). `tests/registers.test.js`.
- **Delivery bin, built 2026-10-09, works on the user's phone** (GDD v0.36 #74): two loose doorstep boxes, the rest in a
  crate at the right end of the doorstep with a count badge; tap it for a list by item, tap one to fetch it
  (`js/ui/bin.js`, `BIN` / `inBin` / `settleBoxes` in `js/sim/stock.js`, drawn in `js/render/views/boxes.js`). No save change.
- **Fixed 2026-10-09: pinch out further on a big house** (GDD §18 #14): pinching out can always show the whole house.
- **Room prices, built 2026-10-09, waiting for feedback** (GDD v0.37 #75, resolves §18 #13): by ring only (the same on every
  floor), +🪙 50 on every spot per shelf room built (×1.35 since #80, `ROOM_GROWTH`), so the cheapest spot always climbs; register rooms
  don't count. Staircases cheaper (500, 700, 950, 1250, +350). `roomCost` in `js/sim/building.js`. No save change.
- **Roller Skates 🛼, built 2026-10-09, waiting for feedback** (GDD v0.38 #76): 🪙 180 upgrade, locked until Bea is hired;
  every stocker walks ×1.4 (`SKATES_SPEED`; Comfy Shoes is the shopkeeper's only). No skates drawn on them (user). Upgrades can have `needs` (a helper id,
  `canBuyUpgrade` in `js/sim/upgrades.js`). No save change.
- **Color rounds, built 2026-10-09, approved and released** (GDD v0.39 #77, part of #59): every item comes in two more
  colors, **Bright** (round 2) and **Dazzle** (round 3), 72 stickers. Each round starts the four pages over once you've
  found 24 / 48 items (pages at +0 / +4 / +10 / +16), with prices ×16 a round. Order book: one card per item with a
  color dot per round (🔒 + "find N more" until open). Each round's themes are new themes ('tea2' "Tea Time ✦ Bright")
  with 🎀, coin gifts ×16 a round, bolder room styles (new decor options) and shopkeeper styles (outfits, and tinted
  accessories like 'crown3'). The album shows a round's sections once it opens. Code: `ROUNDS` / `COLORS` / `STEPS` in
  `js/data/items.js`, `sim/catalog.js`, `js/ui/orderbook.js`. No save change. Economy past round 1 still to tune (GDD §18 #15).
  **Customers shop by item, not color** (#78, user): wants and wishes are round-1 ids; any color on the shelf will do and
  they pay that color's price (`baseOf` in `js/data/items.js`, used in `sim/customers.js`, `sim/decor.js`, `sim/stocker.js`).
- **Sweet Shop and Pet Corner, built 2026-10-09, waiting for feedback** (GDD v0.41 #79): 8 new items (Lollipop Jar, Gumdrop
  Tree, Soda Fountain, Gingerbread House; Kitten Basket, Puppy Kennel, Songbird Cage, Pony Stable), one per page, priced inside
  each page's band (×16 a round unchanged), so 32 items and 96 stickers. Pages open at 0 / 5 / 13 / 21, Bright at 32, Dazzle at 64.
  **Opened pages never close: save version 20**, `state.pagesOpen` (`notePagesOpen` in `js/sim/catalog.js`; the migration
  counts what the old thresholds had opened). Rewards: Candy / Paw prints wallpaper patterns (`js/render/patterns.js`), new floors,
  rug, rose gold wallpaper, Cotton Candy / Sour Apple / Chocolate Truffle outfits, Kitty Ears ×3 (`character.js`). Order book
  (user): each page cheapest first (BASE in `js/data/items.js` is listed that way, tested), every card has a stock line ("Not
  ordered yet"), buy buttons line up.
- **Balancing script** (`npm run balance`, `scripts/balance.js`, `docs/TECH.md` §10): plays the real sim headless with a
  bot player and prints coins, customers, Hearts, Collection, Sparkle and purchases per day, plus milestone days and minutes.
  Keep it; re-run it after any economy change.
- **Balancing pass, built 2026-10-10, waiting for feedback** (GDD v0.42 #80, resolves §18 #10, #15): no early visitor cap
  (Sparkle curve `sparkleBoost` in `js/sim/collection.js`, bolder colors sparkle more, Collection bonus up to +100%); rounds
  ×12 / ×144 (was ×16 / ×256); room prices ×1.35 per shelf room (`ROOM_GROWTH`), staircases ×1.6 past the list, register
  rooms ×2, `niceCost` rounding; pricier later helpers and upgrades (Theo 1,200, Juno 5,000, ...); **each catalog page also
  needs Hearts** (`ROUNDS[].hearts` in `js/data/items.js`; pages can open on a sale), so the bot finds all 96 in ~3.8 h.
  No save change (opened pages stay open). Lock notes and the album teaser checked at phone size; pushed to `/dev/`.
- **Simpler order book, built 2026-10-10, waiting for feedback** (GDD v0.44 #82, half of §18 #17): color dots only once Bright
  opens (then all three, Dazzle locked); of the locked tabs only the next one shows. `js/ui/orderbook.js`. No save change.
- **Helpers and upgrades as a ladder, built 2026-10-10, waiting for feedback** (GDD v0.45 #83, resolves §18 #16, #17): each
  appears at a Hearts count and costs ~1.4-1.5× the one before (Stock Cart 60 ... Juno 12,000, made a little easier in #84; `hearts` in `js/data/upgrades.js`,
  `LADDER` / `ladder()` in `js/sim/upgrades.js`). Grow shows what you can get, the next one as a 🔒 teaser, and an "Already yours"
  icon row. The balance bot buys from the ladder (cheapest first). No save change.
- **Gift Wrap and Comfy Shoes removed, built 2026-10-10, waiting for feedback** (GDD v0.47 #85, user): tips are ~10% of the sale
  (`CUSTOMER.tip` = [0.05, 0.15] in `js/data/customers.js`, `completeSale` in `js/sim/checkout.js`); Roller Skates speed the
  shopkeeper too and don't need Bea. **Save version 21:** owners get 🪙 80 / 🪙 150 back with a toast (`REFUNDS` in
  `js/data/upgrades.js`; the migration leaves a live-only `state.refunds` that `main.js` toasts once).
- **Decorating opens with the first shelf room, built 2026-10-10, waiting for feedback** (GDD v0.48 #86): no Ribbons before then
  (`addRibbons` does nothing while `state.decorOpen` is false; HUD pill and Grow card hidden); `openDecor` in `js/sim/decor.js`
  (called from `addRoom` for a shelf room) pays `ribbonsForCollection` at the new rates (+1 an item, +3 a theme). Theme reward
  styles can't be bought (`buyDecor`). Complete themes emit `themeDone`. **Save version 22** (`decorOpen`, true for existing saves).
  **Next to design with the user:** fun, theme-matched Collection reward styles (GDD §18 #18).
- **Approved by the user 2026-10-09:** everything built that day (24 items and catalog pages, Stairwell and floors,
  shelf rooms and prices, quick evenings and Close now, Bea, the first-day guide, decoration shop) and the Pixel checks.
- **Planned next:** feedback on the balancing pass (#80). Later: more items past 100 (#59), more stockers
  (#60), **Instant Delivery** (GDD §11, on the §17 roadmap, design to discuss), Heart/Sparkle milestone unlocks (§18 #6). 

**Next:** feedback on the balancing pass (#80), the simpler order book (#82), the ladder (#83, #84), #85 and #86; designing special Collection reward styles (§18 #18); then a release. Waiting on feedback: the balancing pass (#80), Sweet Shop and Pet Corner (#79), Roller Skates (#76), room prices (#75), register rooms (#73), the
#72 helpers and upgrades, Collection rewards (#70), stock counts (#71).

**Releases:** the latest is **v2026.10.10** (2026-10-10): Sweet Shop and Pet Corner (#79), **save version 20**
(`state.pagesOpen`); before it v2026.10.9.12, color rounds (#77) and shopping by item (#78); v2026.10.9.11, Roller Skates (#76).
Not released yet: the balancing script, the balancing pass (#80), "new items" (#81), the simpler order book (#82), the ladder (#83, #84), #85 and #86. **Save versions 21 and 22** go out with them. The MVP list in GDD §17 is complete.

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
  **Releases** to the public link happen only when the user asks, and Claude runs them itself (the user asked not to
  be handed commands): first `echo n | npm run release` to preview what's going out, then `echo y | npm run release`
  to publish (a blind `--yes` gets blocked), `git pull`, and wait for the deploy with `gh run watch`. Mention it when a save-version change is going out. Details in `docs/TECH.md` §9.1.
- **Commits:** plain messages, with no "Co-Authored-By: Claude" trailer.
- **No digital timers** (countdowns like 2:15) anywhere in the game UI. Show time as a bar or
  through the lighting.
- **Process with the user:** discuss design changes and update docs/GDD.md before building them.
  Each milestone ends with a push so the user can try it on their phone (a Pixel) on the `/dev/` link,
  then give feedback; the user decides when it's released.
