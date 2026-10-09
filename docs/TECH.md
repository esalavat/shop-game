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
    rooms.js            # Room types, sizes
    dollhouse.js        # Dream Dollhouse slots, Sparkle tuning, shop expansions (costs)
    customers.js        # Customer types: wants, budgets, looks
    story.js            # Regulars, story beats, triggers
    upgrades.js         # Upgrades (Stock Cart, Comfy Shoes, Lunchtime Delivery) and helpers (Mia): costs, tuning
  sim/                  # Pure game logic. No three.js, no DOM.
    state.js            # Creates a fresh game state; schema version
    day.js              # Day phases: morning → open → evening → close
    orders.js           # Order book, deliveries
    stock.js            # Boxes, shelves, inventory
    customers.js        # Spawning, browsing, buying, wish notes (state machines)
    checkout.js         # Queue, scanning, tips
    marketing.js        # Morning picks, special days, Sparkle → foot traffic
    collection.js       # Dream Dollhouse placing, Sparkle, foot-traffic boost, window spot (unlocks happen in day.js)
    helpers.js          # Hired helpers doing jobs: Mia the cashier (state.cashier, live-only)
    tutorial.js         # First-day guide steps (state.tutorial: box → shelf → open → register → done), advanced each tick
    stocker.js          # Bea the stocker: fetches doorstep boxes and unpacks them (state.stocker, saved so held boxes survive a reload)
    upgrades.js         # Buying upgrades / hiring helpers (one-time; state.upgrades, state.helpers)
    route.js            # Walking between rooms and onto the street (sidewalk lane, doors, greeter spot)
    economy.js          # Coins, Hearts, Sparkle, costs
    story.js            # Checks triggers, queues story moments
    offline.js          # Offline earnings on return
  render/               # Everything three.js
    renderer.js         # WebGLRenderer, resize, pixel-ratio cap, shadows
    toon.js             # Toon material factory + shared gradient map, palette
    lighting.js         # Sun/hemi/fill/lamps; time-of-day blending
    camera.js           # Camera rig: room/building framing, pan, pinch, focus
    building.js         # Builds the room grid shell from state
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
  version: 1,
  day: { number: 1, phase: 'morning', time: 0 },
  coins: 50, hearts: 0, sparkle: 0,
  building: { rooms: [{ id, type, col, floor, theme, shelves: [...] }] },
  stock: { boxes: [...], back: { itemId: count } },
  orders: [{ itemId, qty, arrivesDay }],
  customers: [{ id, type, state, pos, wants, cart, ... }],   // transient, not saved
  collection: { itemId: true },
  dollhouse: { slots: { slotId: itemId } },   // v0: 4 fixed rooms (data/dollhouse.js); later rooms/wallpaper
  helpers: { cashier: true },          // one-time hires (v8); Mia's position is live-only in `cashier`
  upgrades: { cart: true, shoes: true, lunch: true },
  keeper: { ..., carrying, spare, arriveRoom }, // `spare` = second box on the Stock Cart; `arriveRoom` while walking between rooms (v9)
  shopkeeper: { hair, hairColor, skin, outfit, accessory, created },
  story: { seen: [...], flags: {...} },
  settings: { muted: false },
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

### 4.3.3 Walking between rooms and the street (GDD #41)
- `walkTo(state, navs, dest)` takes the map of all room walk grids. `dest` is `{ roomId, x, z }` (room-local) or
  `{ street: true, x, z }` (shop coordinates). `sim/route.js` `planRoute` uses the room's grid when it can; otherwise
  she goes out her room's door, along `SIDEWALK.lane`, and in the other room's door.
- During such a walk the keeper is in **shop coordinates** (`roomId` = shop, like customers on the street), with
  `keeper.arriveRoom = { roomId, offset, from }`. On arrival she switches to the target room's coordinates. If a new walk
  starts mid-way, `settle()` first puts her back in whichever room she's actually standing in.
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
- `scripts/stamp.js <out> <version> [channel]` writes an import map that points every module at
  `file.js?v=<commit>`, and writes `<html data-channel data-version>` (read by `js/core/channel.js`). The
  dev channel also gets "(DEV)" in its title and home-screen app name, and a "DEV · <commit>" badge.
- Why stamping: GitHub Pages lets browsers cache each file for 10 minutes, and phones were loading a new
  `index.html` with old cached modules (blank screen). Stamping makes one deploy's files always load together.
- **Releasing:** `npm run release` (`scripts/release.js`) takes `origin/main` (what's on /dev/ now), shows
  the commits since the last release, warns if the save version changes, and after a "y" creates a GitHub
  Release tagged `v<year>.<month>.<day>` (`.2`, `.3`… for more the same day) with those commits as notes.
  Publishing it triggers the deploy. `-- --yes` skips the question; `-- <commit>` releases an older commit of main.
- **Rolling back:** `gh release edit <older tag> --latest`, then `gh workflow run pages.yml`. Only when the
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

## 12. Risks

| Risk | Mitigation |
|---|---|
| Too many meshes (lots of tiny items) hurts phone fps | Instancing/merging, culling off-screen rooms, perf budget checks per milestone |
| Safari evicts `localStorage` | Encourage home-screen install; save export; store builds |
| Procedural art looks too "programmer art" | Prototype shows it can look charming; swap in glTF models item by item later |
| Toon + shadows look muddy in cutaway interiors | Fill light + tuned gradient (already validated in the prototype) |
| Scope creep before the core loop is fun | Strict MVP list; everything else waits for "Next" |
