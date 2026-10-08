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
| Audio | Web Audio API (small wrapper) | Unlocked on first tap; respects a mute toggle |
| Offline / install | PWA manifest + service worker (later) | Home-screen install on phones before store builds |
| Store builds | Capacitor (iOS + Android) | Reuses the web build unchanged |
| Tests | `node --test` for pure game logic | Zero dependencies |

## 3. Repository Layout

```
index.html              # Game entry: canvas, UI overlay root, import map
style.css               # Global styles, UI theme tokens (pastel palette)
manifest.webmanifest    # PWA manifest (portrait, theme colors, icons)
sw.js                   # Service worker (later)
icon.svg
vendor/                 # Third-party code, checked in (three.js + addons)
js/
  main.js               # Boot: load save, create systems, start loop
  core/
    loop.js             # Fixed-step simulation + render loop, pause on hidden tab
    events.js           # Tiny event bus (sim → render/UI notifications)
    rng.js              # Seeded random
    save.js             # Load/save/migrate, autosave, offline-time calc
  data/                 # Content as plain data (no logic)
    items.js            # Products: id, set, price, cost, shelfType, slotType, rarity, model
    shelves.js          # Shelf types and capacities
    rooms.js            # Room types, sizes, unlock costs
    customers.js        # Customer types: wants, budgets, looks
    story.js            # Regulars, story beats, triggers
    upgrades.js
  sim/                  # Pure game logic. No three.js, no DOM.
    state.js            # Creates a fresh game state; schema version
    day.js              # Day phases: morning → open → evening → close
    orders.js           # Order book, deliveries
    stock.js            # Boxes, shelves, inventory
    customers.js        # Spawning, browsing, buying, wish notes (state machines)
    checkout.js         # Queue, scanning, tips
    marketing.js        # Morning picks, special days, Sparkle → foot traffic
    collection.js       # Unlocks, album pages, Dream Dollhouse slots, Sparkle
    helpers.js          # Hired helpers doing jobs
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
    views/              # Sync state → scene: shelves, customers, boxes, dollhouse
    pick.js             # Raycast taps → interactable objects
    fx.js               # Coin pops, sparkles, hearts, confetti
  ui/                   # DOM overlay
    hud.js              # Coins / Hearts / Sparkle / clock
    toolbar.js          # Bottom buttons
    panels/             # Order book, Collection album, helpers, decorate, day summary
    story.js            # Dialogue cards for story moments
    creator.js          # Shopkeeper creator
  input/
    touch.js            # Pointer events → tap / drag / pinch gestures
  audio/
    audio.js
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
  dollhouse: { rooms: [{ type, wallpaper, floor, slots: { slotId: itemId } }] },
  helpers: [{ id, job, level, look }],
  shopkeeper: { hair, hairColor, skin, outfit, accessories },
  story: { seen: [...], flags: {...} },
  settings: { muted: false },
  lastSeen: 1760000000000
}
```

### 4.3 Game loop
- **Fixed-step sim** (e.g. 10 ticks/sec) for determinism and cheap logic; **render every animation frame** with interpolation for smooth movement.
- Sim only advances during the **Open/Evening** phases; Morning and Close are untimed.
- Pause sim and rendering when the tab is hidden (`visibilitychange`); on return, compute offline earnings from `lastSeen`.

### 4.4 Customers & movement
- Each customer is a small **state machine**: `enter → browse(shelf) → pick → queue → checkout → leave` (plus `peekWindow`, `wishNote`).
- Movement uses **waypoints per room** (door, in front of each shelf, queue spots, counter), not a general pathfinding library. Multi-room movement goes through a simple room graph (doors and stairs). This is enough for a dollhouse layout and very cheap.

### 4.5 Saves
- Autosave at every phase change, after purchases, and every ~15 s during Open, plus on `visibilitychange`/`pagehide`.
- `version` field + **migration functions** so old saves always load.
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
| Pixel ratio | Capped at 2 (drop to 1.5 if fps < 50) |
| Point lights | ≤ 6, always present (intensity animated), so shaders don't recompile |
| Geometry | Merge static room furniture with `BufferGeometryUtils.mergeGeometries`; `InstancedMesh` for repeated shelf items |
| Off-screen rooms | Hidden or simplified when the camera is zoomed into one room |

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
- Audio unlocks on the first tap (iOS requirement).
- `localStorage` can be wiped by Safari for sites unused for 7+ days (unless installed to the home screen). This is mitigated by the PWA install prompt and save export, and fixed for good in the store builds.

## 9. Deployment

### 9.1 GitHub Pages (now)
- Push to `main` → live at `https://esalavat.github.io/shop-game/`.
- Cache busting: version query strings on `main.js`/`style.css` (`?v=12`), plus the service worker cache version once we add it.
- Prototypes live under `prototypes/` and are also published (e.g. `/prototypes/camera/`), which is handy for phone testing.

### 9.2 Store builds (later)
- Add Capacitor (`package.json`, `capacitor.config.json`, `ios/`, `android/`; the native folders are already gitignored, as in *migration*).
- A tiny copy script assembles `dist/` (index.html, style.css, js/, vendor/, assets/) as Capacitor's `webDir`.
- Native plugins only where needed (haptics, status bar, splash, and maybe Preferences for saves).

## 10. Testing
- **Sim unit tests** (`node --test tests/`): economy math, day phases, order delivery, customer state transitions, save migrations.
- **Manual phone testing** on the Pages URL each milestone (iPhone Safari + Android Chrome).
- `?debug` URL flag: fps meter, speed-up time, add coins, skip to phase, reset save.

## 11. Build Order (MVP milestones)

| # | Milestone | Done when… |
|---|---|---|
| M0 | **Camera prototype** ✅ | Chose orthographic diorama, no angle, no outlines, twilight evening (`prototypes/camera/`) |
| M1 | **Skeleton** ✅ | `index.html`, import map, loop, renderer, camera rig, one empty room, HUD, save/load, debug flag; deployed |
| M2 | **Shop room & shopkeeper** ✅ | Furnished room with shelves and counter; shopkeeper walks to tapped spots |
| M3 | **Stock loop** ✅ | Order book → boxes arrive next morning → open boxes → items onto shelves |
| M4 | **Customers & checkout** | Customers browse, pick, queue; tap-to-scan checkout; coins and tips; wish notes |
| M5 | **Day cycle** | Morning → Open → Evening → Close with lighting changes and a day summary |
| M6 | **Collection & Dream Dollhouse v0** | Items unlock on delivery; window dollhouse with fixed slots; Sparkle drives foot traffic |
| M7 | **Helpers, upgrades, creator** | Hire a cashier; a few upgrades; simple shopkeeper creator |
| M8 | **Polish pass** | Juice (pops, sparkles), first sounds, phone perf check, PWA manifest |

Each milestone ends with a push so it's playable on your phone.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Too many meshes (lots of tiny items) hurts phone fps | Instancing/merging, culling off-screen rooms, perf budget checks per milestone |
| Safari evicts `localStorage` | Encourage home-screen install; save export; store builds |
| Procedural art looks too "programmer art" | Prototype shows it can look charming; swap in glTF models item by item later |
| Toon + shadows look muddy in cutaway interiors | Fill light + tuned gradient (already validated in the prototype) |
| Scope creep before the core loop is fun | Strict MVP list; everything else waits for "Next" |
