# My Dream Dollhouse Shop — Technical Plan

> **Status:** Draft v0.1. Companion to [GDD.md](GDD.md).

## 1. Goals & Constraints

- **Mobile web first**, served as static files from GitHub Pages (`main` branch, repo root), the same setup as *migration*.
- **Store builds later** by wrapping the same web code with Capacitor. Nothing in the web build should block that.
- **Portrait, touch only**, 60 fps on a mid-range ~2021 phone.
- **No build step** to start: edit a file, refresh, push, done. We can add one later if it earns its place.
- **No accounts, ads, analytics, or third-party SDKs** (age rules, GDD §3.1).

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Language | Modern JavaScript (ES modules) + JSDoc types | Runs directly in the browser; JSDoc gives editor type-checking without a compiler |
| 3D | **Three.js r186**, vendored in `vendor/` and minified | Same as *migration*; mature, small API surface for what we need |
| UI | **HTML/CSS overlay** on top of the canvas | Crisp text, easy layout, safe-area support, accessible, and much faster to build than in-canvas UI |
| Module loading | Browser **import map** (`"three": "./vendor/three.module.js"`) | No bundler needed |
| Saves | `localStorage`, versioned JSON | Simple; works offline; Capacitor-compatible |
| Audio | Web Audio API, **synthesized** sound effects (`js/audio/audio.js`, no sound files) | Unlocked on first tap; respects the 🔊 mute toggle (`state.settings.muted`), which also stops vibration |
| Offline / install | PWA manifest + **network-first** service worker (`sw.js`) | Home-screen install and offline play; online it always fetches fresh files (see §9.3) |
| Store builds | Capacitor (iOS + Android) | Reuses the web build unchanged |
| Tests | `node --test` for pure game logic | Zero dependencies |

## 3. Repository Layout

```
index.html              # Game entry: canvas, UI overlay root, import map
style.css               # Global styles, UI theme tokens (pastel palette)
manifest.webmanifest    # PWA manifest (portrait, theme colors, icons)
sw.js                   # Service worker: network first, cache only as an offline fallback (§9.3)
icon.svg                # Favicon / app icon source
icons/                  # PNG app icons (192, 512, maskable 512, apple-touch) made from icon.svg / icons/maskable.svg with `sips`
vendor/                 # Third-party code, checked in (three.js + addons)
js/
  main.js               # Boot: load save, create systems, start loop
  core/
    loop.js             # Fixed-step simulation + render loop, pause on hidden tab
    events.js           # Tiny event bus (sim → render/UI notifications)
    rng.js              # Seeded random
    save.js             # Load/save/migrate, never overwriting a save it can't read (§9.4)
    channel.js          # Which build this is: 'main' (public) or 'dev' (/dev/), from <html data-channel>
  data/                 # Content as plain data (no logic)
    items.js            # Products: id, set, price, cost, shelfType, slotType, rarity, model
    shelves.js          # Shelf types and capacities
    rooms.js            # Room types and sizes; shelf room styles and prices (ROOM_STYLES, ROOM_COSTS, STAIR_COSTS)
    dollhouse.js        # Dream Dollhouse slots, Sparkle tuning, shop expansions (costs)
    customers.js        # Customer types: wants, budgets, looks
    story.js            # Regulars, story beats, triggers
    upgrades.js         # Upgrades (Stock Cart, Comfy Shoes, Lunchtime Delivery) and helpers (Mia): costs, tuning
    decor.js            # Room styles for the decoration shop (DECOR: paper, pattern, floor, rug, curtain, corner), Ribbon rates, roomLook()
  sim/                  # Pure game logic. No three.js, no DOM.
    state.js            # Creates a fresh game state; schema version
    day.js              # Day phases: morning → open → evening → close
    orders.js           # Order book, deliveries
    stock.js            # Boxes, shelves, inventory
    customers.js        # Spawning, browsing, buying, wish notes (state machines); walk to the room that has their item
    checkout.js         # Queue, scanning, tips
    marketing.js        # Morning picks, special days, Sparkle → foot traffic
    catalog.js          # Order book pages: which are open (by items found), canOrder, orderableItems (GDD #66)
    collection.js       # Dream Dollhouse placing, Sparkle, foot-traffic boost, window spot (unlocks happen in day.js)
    helpers.js          # Hired helpers doing jobs: Mia the cashier (state.cashier, live-only); Ollie the greeter and Rosa the window dresser standing at the bonus spots (state.greeter / state.dresser, live-only, GDD #72)
    tutorial.js         # First-day guide steps (state.tutorial: box → shelf → open → register → done), advanced each tick
    stocker.js          # Bea the stocker: fetches doorstep boxes and unpacks them in any room; Sorting Smarts (state.stocker, saved)
    upgrades.js         # Buying upgrades / hiring helpers (one-time; state.upgrades, state.helpers)
    rewards.js          # The Collection pays off (GDD #70): visitor bonus, theme coin gifts, shopkeeper styles from themes
    decor.js            # Ribbons (earning: wishes granted, window wants, finds, themes, end of day) and buying / putting on room styles (GDD #68)
    route.js            # Walking between rooms and onto the street (planRoute, startRoute/finishRoute/settleRoute/routeTo, doors)
    economy.js          # Coins, Hearts, Sparkle, costs
    story.js            # Checks triggers, queues story moments
    offline.js          # Offline earnings on return
  render/               # Everything three.js
    renderer.js         # WebGLRenderer, resize, pixel-ratio cap, shadows
    toon.js             # Toon material factory + shared gradient map, palette
    lighting.js         # Sun/hemi/fill/lamps; time-of-day blending
    camera.js           # Camera rig: room/building framing, pan, pinch, focus
    building.js         # Builds the room grid shell from state; each room drawn in its roomLook (styles, plus a preview in decorate-rooms mode)
    patterns.js         # Canvas textures for wallpaper patterns and floors (cached, never disposed), and swatch pictures for the panel
    rooms/              # Room interior builders per room type
    models/             # Procedural low-poly model builders (items, characters, furniture)
    views/              # Sync state → scene: shelves, customers, boxes, checkout, dollhouse (items in its rooms), keeper, helpers (Mia, Bea)
    pick.js             # Raycast taps → interactable objects
    fx.js               # 3D effects: tap ring, sparkle bursts, box poof (shared geometry; warmUp() precompiles shaders)
    quality.js          # Adaptive pixel ratio: steps down (2 → 1.5 → 1.25) if fps stays under 50
  ui/                   # DOM overlay
    hud.js              # Coins / Hearts / Sparkle / day progress bar (no digital timers)
    guide.js            # First-day guide arrows (3D-pinned bubbles + one over Open shop) and the idle morning nudge
    toolbar.js          # Bottom buttons
    orderbook.js, album.js, grow.js (Grow sheet: rooms, helpers, upgrades; Dollhouse button), decorate.js, day.js (summary)
    story.js            # Dialogue cards for story moments
    styler.js           # Decorate rooms (GDD #68): bottom panel, ◀ ▶ rooms, tabs, preview → Get it with Ribbons
    creator.js          # Shopkeeper creator (bottom panel; camera frames the shopkeeper above it)
    juice.js            # Game feel: sim events → sounds, sparkles, hearts, confetti, haptics
    confetti.js         # Full-screen DOM confetti (Web Animations API)
    overlay.js          # World-pinned bubbles and floating pop-ups (+12 🪙, hearts)
  input/
    touch.js            # Pointer events → tap / drag / pinch gestures
  audio/
    audio.js            # Web Audio synth: named sounds (pop, beep, chaching, bell, sparkle, fanfare…), buzz(), mute
assets/                 # Later: glTF models, sounds, fonts
prototypes/             # Throwaway experiments (e.g. camera styles)
tests/                  # node --test files for js/sim
docs/                   # GDD, tech plan
```

## 4. Architecture

### 4.1 Three layers, one direction

```
  input ──► sim (pure state) ──events──► render (three.js)
                    ▲                  └► ui (DOM)
                    └──── ui actions ────┘
```

- **Sim** owns the **game state**: one plain, JSON-serializable object. Sim code never touches three.js or the DOM, so it can be unit-tested in Node and saved by just serializing the state.
- **Render** reads state each frame and keeps the 3D scene in sync (creates, moves, or removes objects). It never changes game state.
- **UI** reads state for display and calls **actions** (`orderItem`, `stockShelf`, `scanItem`, `hireHelper`, `placeInDollhouse`…) to change it.
- **Events** (`saleCompleted`, `boxDelivered`, `storyTriggered`…) let render/UI play effects (coin pops, sounds, dialogue) without the sim knowing about them.

### 4.2 Game state (sketch)

```js
{
  version: 19,                         // STATE_VERSION (js/sim/state.js)
  day: { number: 1, phase: 'morning', time: 0 },
  coins: 50, hearts: 0, sparkle: 0, ribbons: 4,   // Ribbons 🎀 for room styles (v17)
  decor: { owned: { 'pattern:stars': true } },     // styles bought (v17); free ones (price 0) aren't listed
  themeGifts: ['tea'],                 // themes whose coin gift was given, in order (v18, GDD #70)
  building: { rooms: [{ id, type, col, floor, style?, decor?, fixtures: [{ id, kind, x, z, slots? }] }] }, // type: shop | display | room | stairs | landing; style: shelf rooms (v16); decor: { kind: optionId } chosen styles (v17)
  stock: { boxes: [...], back: { itemId: count } },
  orders: [{ itemId, qty, arrivesDay }],
  customers: [{ id, type, state, pos, wants, cart, registerId, ... }],   // transient, not saved; registerId = where they pay (#73)
  queue, checkout, cashier,            // the shop register (transient); register rooms' are in registers[roomId] (#73)
  collection: { itemId: true },
  dollhouse: { slots: { slotId: itemId } },   // v0: 4 fixed rooms (data/dollhouse.js); later rooms/wallpaper
  helpers: { cashier: true },          // one-time hires (v8); Mia's position is live-only in `cashier`
  upgrades: { cart: true, shoes: true, lunch: true },   // (Sorting Smarts was removed in v16)
  keeper: { ..., carrying, spare, arriveRoom, legs, y }, // `spare` = second box on the Stock Cart; `arriveRoom` while walking between rooms (v9); `legs` / `y` for routes up the stairs (v15)
  stockers: [{ who, ...same walking fields, carrying, spare, job, timer }], // Bea, Theo, Juno once hired (v11 as `stocker`; a list since v19); who = HELPERS id
  shopkeeper: { hair, hairColor, skin, outfit, accessory, created },
  story: { seen: [...], flags: {...} },
  settings: { muted: false },
  best: { coins }, tutorial: 'done',
  lastSeen: 1760000000000
}
```

### 4.3 Game loop
- **Fixed-step sim** (e.g. 10 ticks/sec) for determinism and cheap logic; **render every animation frame** with interpolation for smooth movement.
- Sim only advances during the **Open/Evening** phases; Morning and Close are untimed.
- Pause sim and rendering when the tab is hidden (`visibilitychange`); on return, compute offline earnings from `lastSeen`.

### 4.3.1 Decorate mode (M6)
- `ui/decorate.js` is a bottom panel (not a dimmed sheet) so the 3D dollhouse stays visible and tappable above it.
  `main.js` frames the camera with `rig.frame(..., lift)`, where `lift` raises the target above the panel.
- While decorating, taps only hit the dollhouse's room hitboxes (`views/dollhouse.js`); the shop sim keeps running.
- **Decorate rooms (GDD #68)** works the same way: `ui/styler.js` is a bottom panel; `main.js` frames the chosen room
  above it, and taps only pick rooms (`world.building.hitTargets`). A room's look is `roomLook(room, preview)`
  (`data/decor.js`): base defaults ← the room type's `decor` ← its wallpaper (`ROOM_STYLES[room.style]`) ←
  `room.decor` ← a preview. Trying on a style you don't own rebuilds the world with `createBuilding(..., { roomId, decor })`
  and never touches state, so an autosave can't keep an unpaid style; buying calls `buyDecor` then `styleRoom`
  (`decorChanged` → rebuild). Wallpaper patterns and floors are canvas textures (`render/patterns.js`) printed on the
  back wall / floor boxes; the corner piece replaces the plant fixture's model (same footprint) and the rug the rug's.
- Ribbons are earned in the sim: `ribbonsForSale` (from `completeSale`: a wished-for item uses up the oldest matching
  wish note; a window-peeker's `windowWant`), `ribbonsForFinds` (from `deliverOrders`), `ribbonsForDay` (at closing).
  All go through `addRibbons`, which also counts `day.stats.ribbons` and emits `ribbons`.
- Theme rewards (GDD #69): `ownsDecor` also counts a style as owned when the theme in `THEME_STYLES` that gives it is
  complete, so nothing extra is saved and old saves get theirs on load.
- Collection rewards (GDD #70, `sim/rewards.js`): `collectionBonus` (+2% per item found, +5% per complete theme, up to
  +50%; numbers in `COLLECTION`, `data/items.js`) is added to Sparkle's boost in `trafficBoost`. `giftCompleteThemes`
  pays a coin gift for each complete theme not yet in `state.themeGifts` (🪙 100, then +50 each) and emits `themeGift`;
  it runs after each delivery and once on load (so themes finished before v18 pay out with the celebration).
  Shopkeeper styles (`THEME_LOOKS` in `data/customers.js`) are owned when their theme is complete (`ownsLook`); the
  creator shows the rest with a 🔒.

### 4.3.2 Helpers & upgrades (M7)
- `sim/helpers.js`: Mia stands at the counter's use spot (the till). When the shopkeeper is at the counter or walking
  to it, Mia walks to a spot beside it; `cashierReady()` (keeper at counter, or Mia at the till) lets the next
  customer start checkout. Mia scans one item every `scanTime` and rings up with `completeSale(..., { tip: false })`.
  Whoever is at the till serves; if the shopkeeper leaves mid-checkout, Mia finishes it.
- Lunchtime Delivery: orders placed before `MIDDAY` (in `sim/day.js`) get `lunch: true, arrivesDay: today` and are delivered
  when the open-hours clock crosses midday; if the day closes earlier they come the next morning.
- Stock Cart: `keeper.spare` holds a second box; `stockShelf` moves it into her hands when the first one empties.
- The shopkeeper creator edits `state.shopkeeper`; `views/keeper.js` `setLook()` rebuilds her model. In the morning the
  keeper has a tap hitbox that opens it.

### 4.3.3 Walking between rooms and the street (GDD #41, #58)
- `walkTo(state, navs, dest)` takes the map of all room walk grids. `dest` is `{ roomId, x, z }` (room-local) or
  `{ street: true, x, z }` (shop coordinates). `sim/route.js` `planRoute` uses the room's grid when it can; otherwise
  she goes out her room's door, along `SIDEWALK.lane`, and in the other room's door.
- During such a walk the keeper is in **shop coordinates** (`roomId` = shop, like customers on the street), with
  `keeper.arriveRoom = { roomId, offset, from }`. On arrival she switches to the target room's coordinates. If a new walk
  starts mid-way, `settleRoute()` first puts her back in whichever room she's actually standing in.
- **Everyone walks this way** (#58): `startRoute` / `walkRoute` / `finishRoute` / `settleRoute` / `routeTo` in
  `sim/route.js` work on anything with `roomId, x, z, y, path, legs, arriveRoom`: the shopkeeper, customers and Bea
  (saved for the keeper and Bea, save v15). Their views reset interpolation when `roomId` changes mid-tick, so nobody
  slides across the building, and add `y` (height on the stairs) to their position.
- **Routes in legs** (#58 step 2): `planRoute` returns `{ legs }`, each `{ frame, path, arrive, climb }`. A leg is
  walked in `frame`'s room coordinates and ends in `arrive`. Ground walks between rooms use the shop's frame (the street
  is in shop coordinates); upstairs walks use the room they start in and go through `DOORWAY`s in the side walls;
  the climb uses the ground Stairwell's frame, with path points carrying `y` (one turn round `STAIRS.center`,
  `FLOOR_H` high). Frames differ by `(col, floor)` × `(W + T, H + T)`. `beginLeg` / `endLeg` convert x and y;
  `agent.legs` holds the rest; `walkRoute` moves on to the next leg and returns true only at the very end, then the
  caller runs `finishRoute`. Someone on the stairs (`onStairs`) finishes the climb before a new walk (`routeStart`
  plans from the end of it). `routeEnd` / `routeEndPath` give the end of the whole route (tap ring, leaving customers).
- **Stairwell, floors and shelf rooms** (`sim/building.js`, GDD #64, #65): `buildStairwell` (after the first shelf room)
  always adds it right of the shop: `insertColumn` moves every room from that column one place right and shifts
  anyone mid-walk (their path points past the gap) so they still arrive. `buildFloor` adds a `landing` on top and a
  `stairs` fixture to the landing below. `stairRooms` lists the column bottom up; `stairCost` (STAIR_COSTS) rises per
  staircase. Shelf rooms are type `room` with `room.style` (ROOM_STYLES, drawn in `render/building.js`);
  `roomCost(state, col, floor)` = ROOM_COSTS by ring (`max(distanceOut, floor)`) × (1 + 0.15·floor);
  `roomSpots` lists ends of the ground floor plus any spot on top of a room next to a room on that floor.
  Routes climb floor by floor (`planRoute`, a climb leg per floor; `stairRoom(state, floor)` in `sim/route.js`).
  Fixtures `stairs` / `stairhole` keep the corner off the walk grids. Drawing: an L-shaped landing slab and floor,
  doorways in shared upstairs walls, a front railing upstairs, stepped roofs (`addRoofs`).
  Customers whose first want is upstairs come in through the ground Stairwell (`headInside`).
- **Rooms customers shop in** (`sim/building.js` `sellingRooms`: rooms with shelves). Customers pick the room
  for each want with `roomWith` (here, else the nearest room with one), come in through that
  room's door from the street (`headInside`), walk between rooms with `routeTo`, and line up at the shop counter
  (`goToQueueSpot` re-checks their place in line on arrival). Customers coming for something upstairs walk in
  through the ground Stairwell. Bea's `shelfFor` picks the emptiest shelf in any room. In the evening (GDD #62, #63)
  shoppers stop after `DAY_LENGTH.evening` and pay or leave; `sendEveryoneHome` + `closeNow` close on the spot,
  putting held items back (`customer.takenFrom`).
- **Crowds never deadlock** (`sim/crowd.js`): walkers who make no progress toward their next waypoint for 8 ticks
  slip through people for 15 ticks (progress kept in a WeakMap, nothing saved). Customers also give up after
  `CUSTOMER.patience` seconds of shopping. `tests/busyday.test.js` replays full busy days and requires them to close.
- **Placement mode** (`main.js`): the Grow sheet's "Build a room" calls `startPlacing()`, which zooms out to show
  the + spots (overlay bubbles with class `place`, the only tappable ones, each with its `roomCost`; class `short`
  when you can't afford it) and a banner with Cancel.
- Bonuses: `keeperShowingOff()` (in the Window Display) raises `peekChance` / `peekWantChance` (`SPARKLE.keeper*`).
  `keeperGreeting()` (standing at `GREETER`) makes customers who reach the door `greeted`, often adding a second want
  (`CUSTOMER.greetedSecondItem`).
- Input: an invisible sidewalk strip in `main.js` (`world.street`). Taps near the shop door go to the greeter spot;
  other sidewalk taps go there (clamped to `streetBounds`). Rooms upstairs aren't reachable yet (no stairs).
- Bonus spots (GDD #44): `render/views/spots.js` draws a ring at `GREETER` and `SHOWOFF` (`sim/route.js`) and gives
  each a tap box (`userData.spot`). `markers()` feeds bobbing DOM icons (👋 / ✨, `.bubble.spot`) that `main.js` shows
  while she's elsewhere. The show-off spot only shows once Sparkle > 0. Floor and sidewalk walks end facing the camera (`face: 0`).

### 4.4 Customers & movement
- Each customer is a small **state machine**: `enter → browse(shelf) → pick → queue → checkout → leave` (plus `peekWindow`, `wishNote`).
- Movement uses **waypoints per room** (door, in front of each shelf, queue spots, counter), not a general pathfinding library. Multi-room movement goes through a simple room graph (doors and stairs). This is enough for a dollhouse layout and very cheap.

### 4.5 Saves
- Autosave at every phase change, after purchases, and every ~15 s during Open, plus on `visibilitychange`/`pagehide`.
- `version` field + **migration functions** so old saves always load. The safety rules and the sample
  saves that guard them are in §9.4.
- Transient data (walking customers) isn't saved; the day resumes cleanly.
- Export/import as a compressed **base64 string**, which later becomes the Dream Dollhouse **share code** (GDD §6.5).

## 5. Rendering

### 5.1 Look
- `MeshToonMaterial` with a shared 3-step gradient map, one material per palette color (cached).
- Lighting: hemisphere (ambient) + **sun** (casts shadows; position/color follow time of day) + **shadowless fill** from the viewer's side so cutaway interiors never go flat + pendant **point lights** that fade in at evening.
- No outline pass (decided). Evening is a purple twilight palette (see `EVE` in the prototype).
- Proven in `prototypes/camera/`.

### 5.2 Camera
- A rig with a **center**, **framing size** (fit room or whole building to the portrait screen), and **zoom**, with smoothing. Uses an **orthographic camera** (decided), front-on with a ~9° downward tilt.
- Gestures: drag to pan (clamped to the building), pinch to zoom, tap a room to focus it.

### 5.3 Models
- Phase 1: **procedural low-poly builders in code** (boxes, cylinders, icosahedrons), like the prototype. Fast to iterate, zero asset pipeline.
- Phase 2: **glTF** models (CC0 packs, then custom Blender models) via `GLTFLoader`, loaded per item from `data/items.js`. Builders and glTF share one interface: `createModel(itemId) → Object3D`.
- One model per item, reused on shelves, in hands, in the Collection album (rendered to a thumbnail), and in the Dream Dollhouse.

### 5.4 Performance budget
| Budget | Target |
|---|---|
| Draw calls | < 250 in the default room view |
| Shadow map | One 2048² directional map; small props don't cast shadows |
| Pixel ratio | Capped at 2; `render/quality.js` drops to 1.5, then 1.25, if fps stays < 50 (never back up) |
| Point lights | ≤ 6, always present (intensity animated), so shaders don't recompile |
| Geometry | Merge static room furniture with `BufferGeometryUtils.mergeGeometries`; `InstancedMesh` for repeated shelf items |
| Off-screen rooms | Hidden or simplified when the camera is zoomed into one room |

**M8 perf check (2026-10-09):** Chrome emulating a Pixel-sized screen (412×915 at 2.625×) with the CPU
slowed 4×: 60 fps at rest, 56–60 fps with sparkles, poofs and confetti firing every 250 ms. The only
hitch was ~100 ms the first time a sparkle appeared (shader compile), now removed by `fx.warmUp()` at
boot. Draw calls are ~280–430 with a full shop and customers, over the 250 budget but not yet a problem;
merging static furniture (above) is the first fix if a real phone struggles. Check on the Pixel with
`?debug` (the panel shows fps and the current pixel ratio).

**Gotcha:** the CSS `scale` property multiplies an element's inline `transform` too, so animating `scale`
on an element positioned with `transform: translate(...)` also slides it toward the corner. World-pinned
pop-ups (`ui/overlay.js`) animate an inner `<span>` instead. Buttons use `scale` for their squish; that's
fine because they aren't positioned with transforms.

## 6. Input
- Pointer Events only (covers touch and mouse for desktop testing).
- Gesture recognizer: **tap** (< 8 px movement, < 400 ms), **drag**, **pinch**, **long-press** (info tooltip).
- Taps are raycast against an **interactables** list (boxes, shelves, register, customers, dollhouse slots), not the whole scene.
- `touch-action: none` on the canvas; UI buttons use `touch-action: manipulation`.

## 7. UI
- DOM overlay with CSS variables for the pastel palette, rounded chunky buttons, big tap targets (≥ 44 px).
- Layout respects `env(safe-area-inset-*)` for notches and home indicators.
- Panels slide up from the bottom (thumb reach). The HUD sits at the top.
- On desktop, the game renders inside a centered phone-shaped frame (as the prototype does).

## 8. Mobile Web Details
- Viewport meta: no zoom, `viewport-fit=cover`.
- Prevent pull-to-refresh and overscroll (`overscroll-behavior: none`).
- Portrait lock via manifest `"orientation": "portrait"`; show a "please rotate" card if the phone is held landscape.
- Audio unlocks on the first tap (iOS requirement): `main.js` calls `audio.unlock()` on every pointerdown (it also resumes after an interruption).
- `localStorage` can be wiped by Safari for sites unused for 7+ days (unless installed to the home screen). This is mitigated by the PWA install prompt and save export, and fixed for good in the store builds.

## 9. Deployment

### 9.1 GitHub Pages: the public game and the test build (now)
One Pages site holds two builds (GDD #56):

| Link | What's there | Updated by |
|---|---|---|
| `https://esalavat.github.io/shop-game/` | The public game: the **latest GitHub Release** | `npm run release` |
| `https://esalavat.github.io/shop-game/dev/` | The test build: the **tip of `main`** | every push to `main` |

- `.github/workflows/pages.yml` runs on a push to `main`, a published release, or by hand. It always rebuilds
  **both**: it checks out the latest release (or `main` before the first release) into a worktree, runs its
  tests and stamps it into `_site/`, then runs `main`'s tests and stamps it into `_site/dev/` with the
  `dev` channel. Failing tests stop the deploy, so the site stays as it was.
- Pages names each deploy after `GITHUB_SHA` and silently skips a commit it has already deployed (the
  API only takes real commits as the version, and `actions/deploy-pages` always uses the triggering one).
  A release of `main`'s tip has the same commit as the push before it, so its own run deploys nothing new
  (this bit the first same-day release). The release script therefore also pushes an empty
  `Release <tag>` commit to `main`; that push's run publishes the release.
- `scripts/stamp.js <out> <version> [channel]` writes an import map that points every module at
  `file.js?v=<commit>`, and writes `<html data-channel data-version>` (read by `js/core/channel.js`). The
  dev channel also gets "(DEV)" in its title and home-screen app name, and a "DEV · <commit>" badge.
- Why stamping: GitHub Pages lets browsers cache each file for 10 minutes, and phones were loading a new
  `index.html` with old cached modules (blank screen). Stamping makes one deploy's files always load together.
- **Releasing:** `npm run release` (`scripts/release.js`) takes `origin/main` (what's on /dev/ now), shows
  the commits since the last release, warns if the save version changes, and after a "y" creates a GitHub
  Release tagged `v<year>.<month>.<day>` (`.2`, `.3`… for more the same day) with those commits as notes,
  then pushes the empty `Release <tag>` commit (built with `git commit-tree`, so the working tree is
  untouched; `git pull` afterwards). `-- --yes` skips the question; `-- <commit>` releases an older commit of main.
- **Rolling back:** `gh release edit <older tag> --latest`, then push any new commit to `main` (an empty
  one is fine) so the deploy isn't skipped. Only when the
  bad release didn't change the save version: players who opened it already have upgraded saves, and older
  code shows them the "newer version" card (§9.4). In that case fix forward.
- The `github-pages` environment allows deploys from the `main` branch and `v*` tags (repo settings).
- `.github/workflows/test.yml` runs the tests on pull requests into `main`.
- `index.html` shows a "Reload" card if the game hasn't started within 10 s or `main.js` fails to load.
- Prototypes live under `prototypes/` and are also published (e.g. `/prototypes/camera/`), which is handy for phone testing.

### 9.2 Store builds (later)
- Add Capacitor (`package.json`, `capacitor.config.json`, `ios/`, `android/`; the native folders are already gitignored, as in *migration*).
- A tiny copy script assembles `dist/` (index.html, style.css, js/, vendor/, assets/) as Capacitor's `webDir`.
- Native plugins only where needed (haptics, status bar, splash, and maybe Preferences for saves).

### 9.3 Offline and install (PWA)
- `manifest.webmanifest` + PNG icons in `icons/` make "Add to Home screen" give a proper app icon
  (Android uses `icon-maskable-512.png`, cropped to its own shape; iOS uses `apple-touch-icon.png`).
- `sw.js` is **network first**: online, every request goes to the network as before (so deploys and the
  stamped `?v=` module URLs work exactly as in §9.1), and each good response is copied into the cache.
  Only when the network fails does the cache answer. Cache keys drop the query string, so the cache
  keeps one copy per file instead of growing with each deploy.
- `index.html` registers it on load. `scripts/stamp.js` publishes `sw.js` and `icons/`.
- Never switch it to cache-first without a versioning plan: that would bring back the stale-file blank screen.
- The public game and the test build each register their own `sw.js`. The public one's scope
  (`/shop-game/`) also covers `/shop-game/dev/`, so it ignores requests under `dev/`; the caches are
  `mdds` and `mdds-dev`.

### 9.4 Never losing a save
Players' progress must survive every release. Both builds share one origin (`esalavat.github.io`), so
they share `localStorage`, and the test build often has a newer save version than the public game.

- **One save per build.** The public game uses `mdds_save`; the test build uses `mdds_save_dev`. The first
  time the test build opens, it loads a **copy** of `mdds_save` (so you test on real progress) and from
  then on saves only to its own key. Debug panel on dev: "Copy main save" copies it again; "Reset save" starts a new game.
- **A newer save is never overwritten.** If the save's version is above `STATE_VERSION` (an old cached page
  after an update, or a rolled-back release), `loadGame` returns a fresh state that `saveGame` refuses to
  write (`isSaveLocked`), and the game shows "Your shop was saved by a newer version of the game" with an
  Update button (a fresh reload).
- **Backups before risk.** Before migrating, the original is kept under `<key>_v<n>` (one per old version).
  A save that isn't valid JSON, or whose migration throws, is kept under `<key>_broken` before starting over,
  so a fix can bring it back.
- **Sample saves.** `tests/fixtures/saves/v<n>.json` is a well-progressed shop saved by version n
  (`node scripts/save-fixture.js` writes one for the current `STATE_VERSION`; it never rewrites an existing
  one). `tests/saves.test.js` loads every sample with the latest code and checks coins, Hearts, Sparkle,
  day, rooms, shelf stock, boxes, orders, collection, Dollhouse, upgrades, helpers, the shopkeeper's look
  and settings all survive, and that it round-trips. It fails if any version from v12 on has no sample.
- **When the save shape changes:** bump `STATE_VERSION`, add the migration and its test, then run
  `node scripts/save-fixture.js`. Never edit or delete an old sample, and never remove or rename a saved field
  without a migration.

## 10. Testing
- **Sim unit tests** (`node --test tests/`): economy math, day phases, order delivery, customer state transitions, save migrations.
- **Manual phone testing** on the Pages URL each milestone (iPhone Safari + Android Chrome).
- **Save safety** (`tests/saves.test.js`): every released save version's sample save still loads (§9.4).
- `?debug` URL flag: fps meter, speed-up time, add coins, skip to phase, reset save (and copy the main save, on dev).

## 11. Build Order (MVP milestones)

| # | Milestone | Done when… |
|---|---|---|
| M0 | **Camera prototype** ✅ | Chose orthographic diorama, no angle, no outlines, twilight evening (`prototypes/camera/`) |
| M1 | **Skeleton** ✅ | `index.html`, import map, loop, renderer, camera rig, one empty room, HUD, save/load, debug flag; deployed |
| M2 | **Shop room & shopkeeper** ✅ | Furnished room with shelves and counter; shopkeeper walks to tapped spots |
| M3 | **Stock loop** ✅ | Order book → boxes arrive next morning → open boxes → items onto shelves |
| M4 | **Customers & checkout** ✅ | Customers browse, pick, queue; tap-to-scan checkout; coins and tips; wish notes |
| M5 | **Day cycle** ✅ | Morning → Open → Evening → Close with lighting changes and a day summary |
| M6 | **Collection & Dream Dollhouse v0** ✅ | Items unlock on delivery; first expansion builds the Window Display room; dollhouse with fixed slots; Sparkle drives foot traffic |
| M7 | **Helpers, upgrades, creator** ✅ | Hire a cashier; a few upgrades; simple shopkeeper creator |
| M8 | **Polish pass** ✅ | Juice (pops, sparkles), first sounds, phone perf check, PWA manifest |

Each milestone ends with a push so it's playable on your phone.

**After the MVP** (GDD §17 "Next"; progress also in CLAUDE.md Status):

| Feature | Status |
|---|---|
| Public game from releases, test build at `/dev/`, save safety (GDD #56, §9) | ✅ |
| First-day guide and morning Open-shop nudge (#57) | ✅ approved |
| Theme rooms on the ground floor + Sorting Smarts (#58 step 1, #60) | ✅ built, then replaced by plain shelf rooms (#65) |
| Crowd deadlock fix (customers stuck behind the line) | ✅ |
| Stairwell and upstairs rooms (#58 step 2, #61, #64) | ✅ approved; see §4.3.3, §11.1 |
| Quick evenings and Close now (#62, #63) | ✅ approved |
| Plain shelf rooms, more floors, prices by distance (#65) | ✅ approved |
| Decoration shop with Ribbons 🎀 (#68) | ✅ approved; see §4.3.1 |
| 24 items on four catalog pages that open as you collect (#66) | ✅ approved |
| Collection bonus and theme rewards: coins, shopkeeper styles (#70, part of #59) | ✅ built (waiting for the user's feedback) |
| Stock counts in the order book (#71) | ✅ built (waiting for the user's feedback); `stockCount` in `sim/stock.js` |
| More helpers and upgrades (#72) | ✅ built (greeter, window dresser, scanner, gift wrap; tall shelves; up to three stockers, save v19); the second register became #73 |
| Delivery bin (#74) | ✅ built (waiting for the user's feedback); `js/ui/bin.js`, `BIN` in `sim/stock.js` |
| Register rooms (#73) | ✅ built (waiting for the user's feedback); `registerOf` in `sim/checkout.js`, `addRegisterRoom` in `sim/building.js` |
| Color variants and more items (#59) | ⏭ later |

### 11.1 Plan: Stairwell and upstairs (#58 step 2) — ✅ built 2026-10-09
The plan as worked out; it was built this way (GDD #61, §4.3.3). Differences: the upstairs half is its own room
type `landing`; legs are `{ frame, path, arrive, climb }` and offsets come from the rooms' columns and floors;
someone told to go elsewhere while on the stairs finishes the climb first (`routeStart`). Doorways are at z = 0.25
(clear of the stairhole and the theme rooms' plant).
- **Stairwell = two rooms**, type `stairs`, at `(col, 0)` and `(col, 1)`, built together for 🪙 350 at a ground-floor
  ＋ spot (after the first theme room). Each has one shelf on the right of the back wall (x ≈ +0.85). A `stairs`
  fixture (not walkable, ~1.2 × 1.2) in the back-left corner of the ground part, and a `stairhole` fixture (same
  footprint, with a railing) upstairs, so both walk grids keep people off it. The upper slab needs an L-shaped floor
  (and the ground part an L-shaped ceiling) leaving the corner open; the room's floor plane too.
- **Upstairs ＋ spots** (`roomSpots`): floor 1 above any ground room, next to (col ± 1) the stairwell top or another
  upstairs room. `addRoom` already refuses floating rooms. One upstairs floor for now.
- **Doorways:** the side wall between two adjacent upstairs rooms gets a door gap (≈ 0.7 wide, ~1.9 tall, at
  z ≈ 0.2). Ground rooms still connect only along the sidewalk. Upstairs rooms get a low railing along the open front.
- **Roof:** `createBuilding` assumes a rectangular footprint. Make it stepped: one prism roof per run of adjacent
  columns with the same top height (lower runs get their own roof against the taller wall); the sign and chimney go
  on the tallest run. `layoutRooms` height / `roofTop` feed the camera limits and `lighting.fitTo`.
- **Routes in legs** (`sim/route.js`): a route becomes a list of legs, each `{ path, frameRoomId, fromOffset,
  arriveRoomId, arriveOffset, enter? }`; the agent keeps the rest in `agent.legs`. Ground legs use the shop frame
  (as now); upstairs legs use the starting room's frame with x offsets `(col - startCol) * (W + T)`, through the
  doorways (nav path to the side door point, straight through, nav path on). Ground → upstairs = ground leg to the
  stair foot (≈ (-0.35, -0.7) in the stairwell), a **climb leg** in the ground stairwell frame (one turn around the
  pole, centre ≈ (-1.1, -0.7), radius ≈ 0.45, with `y` rising from 0 to `H + T`), then `enter: { roomId: top, y: 0 }`
  and an upstairs leg. Down is the reverse (switch to the ground stairwell frame at `y = H + T` first).
- **Height:** path points may carry `y`; `stepAlong` (`sim/walker.js`) interpolates `agent.y` when they do. Views
  (keeper, customers, helpers) add `agent.y ?? 0` to the height and keep the "switched rooms this tick: don't slide"
  reset. `keeper` / `stocker` gain `y` and `legs` → **save v15** (migration + `node scripts/save-fixture.js`).
- **Callers:** where a path ends (`tickKeeper`, `tickStocker`, `tickCustomers`), first try `continueRoute(agent)`
  (starts the next leg; keep walking), and only then treat it as arrived (`finishRoute`, tasks, states).
  `settleRoute` (re-planning mid-walk) must also handle someone on the stairs or upstairs.
- **Who goes up:** customers via `roomWith` (any selling room, so upstairs rooms count), Bea via `shelfFor`, the
  shopkeeper by tapping (first tap on another room focuses it, as now). Checkout stays at the shop counter downstairs.
- **Tests:** building (spots, stairwell pair, upstairs adjacency), routes up and down and across doorways, a customer
  buying upstairs and paying downstairs, Bea stocking upstairs, and the busy-day test (`tests/busyday.test.js`) with
  an upstairs room. Run a stress check (many seeded days) before pushing.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Too many meshes (lots of tiny items) hurts phone fps | Instancing/merging, culling off-screen rooms, perf budget checks per milestone |
| Safari evicts `localStorage` | Encourage home-screen install; save export; store builds |
| Procedural art looks too "programmer art" | Prototype shows it can look charming; swap in glTF models item by item later |
| Toon + shadows look muddy in cutaway interiors | Fill light + tuned gradient (already validated in the prototype) |
| Scope creep before the core loop is fun | Strict MVP list; everything else waits for "Next" |
