# Dream Doll Shop — Game Design Document

> **Status:** Draft v0.3 — for iteration. Nothing here is locked.
> Items marked **❓** are open questions. Items marked **💡** are proposals to react to.

## Decisions Log

| # | Decision | Version |
|---|---|---|
| 1 | Shop theme: **dollhouse shop** (dollhouses, dolls, miniature furniture & accessories) | v0.2 |
| 2 | **Mostly active** play, with modest offline earnings | v0.2 |
| 3 | **Tap directly**; a shopkeeper character moves around for charm | v0.2 |
| 4 | **Portrait** orientation | v0.2 |
| 5 | Start small, grow big through expansions and/or new locations | v0.2 |
| 6 | **No failure states.** Cozy, not stressful | v0.2 |
| 7 | Player does real shop jobs: **inventory, stocking, marketing, checkout** | v0.2 |
| 8 | Touchstones: *Eatventure*, *TCG Card Shop Tycoon*, *Tiny Tower* (for feel, not for copying mechanics) | v0.2–v0.3 |
| 9 | Title: **Dream Doll Shop** | v0.3 |
| 10 | Shop shown as a **dollhouse cutaway**; the building grows on a **grid in both X and Y** (wings and floors), not a tall tower | v0.3 |
| 11 | **Dream Dollhouse:** the player's own showpiece in the shop window, furnished with the best items; acts as the shop's advertisement | v0.3 |
| 12 | **Storyline events** with named regulars as you progress | v0.3 |
| 13 | **Workshop** is on the roadmap; **sharing creations with friends** is a future goal | v0.3 |
| 14 | **Fixed prices**, no player price-setting (see §4.5) | v0.3 |
| 15 | Play is structured in **shop days** | v0.3 |

## 1. Pitch

You open a tiny dollhouse shop: a few shelves of miniature chairs, a couple of dolls, and one little dollhouse in the front window. It's *your* dollhouse, the dream one you've always wanted to build. Order stock, unpack it onto shelves, ring up the delighted kids and collectors who wander in, and day by day grow your shop into a beloved destination.

As the business grows, so does your **Dream Dollhouse**. Every beautiful rare piece you add to it makes the window more enchanting and draws more people in. **Your shop is a dollhouse, and its window holds a dollhouse.** Building one grows the other.

## 2. Pillars

1. **Cozy over clicky.** The joy is in the shop looking lovely and customers being happy, not in watching numbers climb. Progress is shown *in the world* first, in numbers second.
2. **Real shopkeeping, light touch.** You do the actual jobs of running a shop, each as a short, tactile interaction that's satisfying on its own.
3. **Your choice of jobs.** Hire help for the jobs you don't enjoy; keep the ones you do.
4. **Build your dream.** Two creative canvases, the shop itself and the Dream Dollhouse, that are yours and that you'll want to show off.
5. **Nothing goes wrong.** No failure, no lost progress, no angry customers. The worst outcome is "a little slower."
6. **One thumb, portrait.** Every action is a tap or a short drag.

## 3. Platform & Tech Targets

| | |
|---|---|
| Platform now | Mobile web on GitHub Pages (`esalavat.github.io/shop-game`) |
| Platform later | iOS + Google Play by wrapping the web build (Capacitor, like *migration*) |
| Orientation | **Portrait**, locked |
| Input | Touch only: tap, short drags, two-finger/drag pan and pinch zoom across the building |
| Rendering | Three.js, vendored (no build step), low-poly meshes, toon shading |
| Performance | 60 fps on a mid-range ~2021 phone; rooms off-screen are simplified or culled |
| Saves | Local storage now; cloud save considered for store builds (also needed for sharing) |
| Offline | Installable PWA ❓ |

## 4. The Shopkeeping Jobs

Each job is a short, self-contained interaction. Early on, you do all of them. As the shop grows you can **hire staff** for any job, but you can always step in yourself, which is usually faster and comes with a small bonus.

### 4.1 Inventory: ordering stock
- Open the **catalog** (a cute supplier book) and order products.
- Orders arrive as **boxes** at the **next morning's delivery** (fits the day structure, §6). 💡 A pricier "express courier" upgrade delivers mid-day.
- The main decision is what to stock with your budget. Rarer items cost more and sell for more.
- Supplier catalogs unlock over time through progression and story events.

### 4.2 Stocking shelves
- Tap a box to open it, then tap or drag items onto shelves. Items visibly fill the shelves.
- Shelf types: small-items rack, doll display case, furniture shelf, dollhouse plinth.
- **Display bonus:** grouping matching sets (e.g. a full Victorian bedroom set) makes customers linger and buy more. This rewards care and never punishes.

### 4.3 Ringing up customers
- A customer brings items to the counter. Tap each item to scan it (*beep*), then tap the register (*cha-ching*). That's 2–4 taps.
- No making change. It keeps checkout snappy.
- **The tedium fix:** hire a cashier whenever you like. Ringing customers up yourself earns **tips** and can trigger little moments (a kid hugging a new doll, a collector's thank-you note), so it's rewarding but never mandatory.

### 4.4 Marketing
- **Window display = the Dream Dollhouse** (§5). It's always on and is your biggest long-term draw.
- **Day campaigns**, chosen in the morning: flyers (cheap boost), newspaper ad (bigger boost), social post (attracts a specific customer type).
- **Events** unlocked through progression: "Tea Party Saturday", "Collector's Night", "Sale Day" (more customers, lower prices for that day).
- Marketing affects **how many** customers come and **which types**.

### 4.5 Pricing (decided: fixed prices)
Each item has a fixed price. You earn more through:
- **Better stock:** rarer, pricier items.
- **Display bonuses:** customers buy more items per visit.
- **Tips:** from doing checkout yourself.
- **Events:** e.g. Sale Day trades margin for volume, as an occasional fun choice.
- **Reputation:** a higher reputation brings bigger-spending customer types (collectors).

**Why:** setting prices tends to feel like a spreadsheet, and it creates a way to "do it wrong" (customers walking out over prices), which conflicts with the cozy, no-failure pillar. The interesting decisions are *what* to stock, *how* to display it, and *what goes in your Dream Dollhouse*.

### 4.6 Workshop (roadmap)
- A shop room where you build a dollhouse from parts and furnishings you've stocked.
- Uses: **commissions** from regulars ("Could you make me a seaside cottage?"), which serve as story beats with special rewards, and premium dollhouses to sell.
- Shares its building/decorating tools with the Dream Dollhouse editor (§5).

## 5. The Dream Dollhouse ⭐

The game's signature feature: your personal dollhouse, displayed in the shop's front window.

### 5.1 What it is
- A miniature dollhouse with its own small grid of rooms (bedroom, parlor, kitchen, nursery…), shown in the window and editable in a close-up **build mode**.
- It starts as a bare one-room shell and grows over the game: new rooms, roof styles, wallpaper, floors, lights.

### 5.2 How items get into it
- Any product you've stocked can be **set aside** for the Dream Dollhouse ("Keep one for me 💖").
- Setting an item aside uses up one unit, so you give up that sale. That's a gentle, meaningful choice, never a punishment.
- Some special pieces are only obtainable through **story events** or rare supplier deliveries, and they can't be sold. They exist to be treasured.

### 5.3 What it does
- **Charm:** each item adds Charm based on its rarity. Matching sets and fully furnished rooms add bonus Charm.
- Charm is the shop's main **advertisement**: it raises passerby foot traffic and draws collectors.
- Passersby visibly **stop at the window** to admire it. Some come in, some leave a sweet comment.
- Charm milestones unlock things (new suppliers, story beats, decor).
- 💡 Customers sometimes ask about an item they saw in the window. If you stock it, that's an easy sale.

### 5.4 Sharing (future)
- **Phase 1 (no server needed):** a "Snapshot" button renders a pretty photo of your Dream Dollhouse to share via the phone's share sheet.
- **Phase 2:** export/import a dollhouse as a share code or link that friends can view in a read-only viewer.
- **Phase 3 (needs a backend and accounts):** visit friends' shops and Dream Dollhouses, leave a heart, and maybe a weekly themed showcase.
- ❓ Backend choice is deferred to the store-release phase (e.g. Firebase, or Game Center / Play Games for friends lists).

## 6. Shop Days

Play is structured in days. They give each session a natural rhythm and end it on a cozy beat.

| Phase | What happens | Pressure |
|---|---|---|
| **Morning** | Deliveries arrive. Pick today's marketing. Unpack and stock. Shop is closed and untimed. | None |
| **Open** | Customers come and go. Stock, ring up, react. The sun moves across the sky. | Gentle (timer runs) |
| **Evening** | Golden light; last customers trickle out; lamps glow. | Winding down |
| **Close** | End-of-day summary: coins, happy customers, wish notes, Charm. Story beats happen here. Then order stock for tomorrow, upgrade, decorate, and edit the Dream Dollhouse, all untimed. | None |

- An **open-hours** stretch lasts ❓ ~3–5 real minutes, enough for a satisfying burst that fits a short session.
- Days only advance when you play. Nothing happens in real time while you're away except offline earnings.
- **Offline earnings:** if you have staff, they run quiet "skeleton days" while you're away at a reduced rate, capped at a few hours. You'll see a cozy note on return: "While you were away, Mia sold 9 items and found a wish note."
- 💡 Weekdays vs weekends: weekends bring more customers, and certain events only happen on certain days.
- 💡 Seasons: every ~2 weeks of in-game days the season changes (spring flowers, holiday decorations), with seasonal stock and visitors.

## 7. Customers & Story

### 7.1 Customers
- They walk in, browse, pick items, bring them to the counter, pay, and leave. All are chunky, cute low-poly characters.
- **Types:** kids (dolls, cheap accessories), families (dollhouses), collectors (rare pieces, pay well, attracted by Charm), decorators (furniture sets), passersby (window shoppers).
- **No failure:**
  - If something's out of stock, they leave a **wish note** ("I was hoping for a tiny piano!") as a gentle hint.
  - A busy counter means customers browse longer, not lose patience. Nobody ever storms out.

### 7.2 Regulars & storyline events
- A cast of named regulars, each with a small arc spread over many days. For example:
  - **Lily**, a girl saving up for her first dollhouse. You help her furnish it room by room.
  - **Mr. Abernathy**, a retired collector who knew the shop's old owner and gradually shares its history.
  - **Rosa**, a theatre set designer who commissions unusual pieces (and introduces the Workshop).
- Story beats trigger at **milestones** (Charm level, new expansion, day count) and play out at **day close** or as a customer visit.
- Rewards: unique Dream Dollhouse pieces, new suppliers, decor, and new rooms.
- 💡 An overarching light story: you inherited or revived a beloved old dollhouse shop, and each expansion uncovers more of its past (and of the town).

## 8. The Shop Building: Growing in X and Y

### 8.1 Building grid
- The shop is a **grid of room slots**, viewed front-on like a dollhouse cutaway.
- Expand **sideways** (new wings left/right) and **upward** (new floors), so the shop grows into a wide, charming building rather than a tower. 💡 Maybe a basement stockroom too.
- Each new room has a cost and is unlocked through progression milestones.
- The building's exterior (roof, facade, sign) is customizable and visible when zoomed out.

### 8.2 Room types
| Room | Purpose |
|---|---|
| **Shop floor** | Shelves and customers. Can be themed (Doll Corner, Furniture Gallery, Victorian Room, Garden Miniatures). Themed rooms attract matching customers. |
| **Front window** | Holds the Dream Dollhouse. Fixed on the ground floor facing the street. |
| **Counter** | Checkout. A second counter is added later for busier shops. |
| **Stockroom** | Where deliveries land; more storage capacity. |
| **Workshop** | Build commissions and premium dollhouses (§4.6). |
| **Tea nook** 💡 | A cozy rest spot: customers linger longer and buy more. |
| **Staff room** | Required to hire beyond a few staff; cosmetic charm. |

### 8.3 Navigating the building (portrait)
- Drag to pan in both directions; pinch to zoom out and see the whole building, or zoom into a room.
- 💡 Double-tap a room to snap-zoom to it. The bottom UI shows a mini room map for quick jumps.
- Since the building grows sideways too, portrait mode relies on zoom: the default view shows ~1–2 rooms, and zooming out shows the whole building with less detail.

### 8.4 New locations
- **Decided:** expansions within the main building come first.
- **Later ❓:** once the main building is large, open a second shop in a new part of town with a different theme (seaside, city boutique). The first shop keeps running. No prestige reset; nothing is ever taken away.

## 9. Staff

- Hire for any job: **Stocker**, **Cashier**, **Buyer** (auto-reorders best-sellers), **Marketer**.
- Staff are named characters with looks; they work at a steady pace and can be upgraded.
- Hiring is about choosing what *you* want to do, not just efficiency.
- The player-shopkeeper is always present and walks to whatever you tap.

## 10. Economy & Progression

- One currency: **coins**. Plus two progress meters that aren't spent: **Reputation** (from happy customers) and **Charm** (from the Dream Dollhouse and displays).
- Costs scale gently; early on, something new should be affordable every day or so.
- You can't go broke. Unsold stock just waits on the shelf.
- Progress goals: gentle milestone lists, regulars' story arcs, and room/Charm unlocks.

## 11. Controls (Portrait, Touch)

| Gesture | Action |
|---|---|
| Tap object | Interact: open box, scan item, finish sale, open panel |
| Tap/drag item onto shelf | Stock a shelf |
| Drag | Pan around the building |
| Pinch | Zoom between room view and whole-building view |
| Double-tap room | Snap-zoom to that room |
| Tap & hold | Info tooltip |
| Build mode | Tap a slot → choose an item; drag to move; tap to rotate |

UI sits at the **bottom of the screen**: catalog, marketing, staff, build. The top shows coins, Reputation, Charm, and the time of day.

## 12. Camera

- Front-on **dollhouse cutaway** with a slight top-down tilt.
- Orthographic or low-FOV perspective ❓ (orthographic reads as "diorama"; perspective feels warmer). Decide by prototyping both.
- Gentle idle sway for life. Time-of-day lighting shifts across the shop day.

## 13. Art Direction

- **Style:** low-poly 3D, chunky cartoony proportions, rounded silhouettes, warm palette (cream, rose, sage, butter yellow, wood tones).
- **Shading:** toon shading (`MeshToonMaterial`, stepped gradient), soft colored shadows. Optional outline pass ❓.
- **Lighting:** warm sunlight through windows that moves across the day; lamps glow in the evening.
- **Characters:** bean/capsule bodies, big heads, few polys, color variations.
- **Products:** miniatures that read as miniatures: tiny chairs, beds, teapots, dolls, little dollhouses.
- **UI:** rounded, chunky, playful; paper/wood textures; bouncy coin and heart pop-ups.
- **Assets:** placeholder geometry in code → CC0 low-poly packs (Kenney, Quaternius) → custom Blender glTF later.
- **Asset reuse:** each product has one model, used on shelves, in customers' hands, and inside the Dream Dollhouse. That keeps the art budget sane.

## 14. Audio

- Soft acoustic/music-box loop that shifts mood by time of day; register *cha-ching*, scanner *beep*, box rustle, door chime.
- Mute toggle from day one.

## 15. Monetization (future store builds)

❓ Undecided and out of scope for the web build. If any, it should fit the cozy tone (paid up-front, or optional cosmetic packs). No pay-to-skip pressure.

## 16. Roadmap

### MVP: first playable on GitHub Pages
Goal: prove that the jobs, the day rhythm, and the Dream Dollhouse feel good together.

- [ ] One-room shop (dollhouse cutaway), portrait, fixed camera
- [ ] Shopkeeper who walks to what you tap
- [ ] **Day cycle:** morning → open → evening → close summary
- [ ] **Inventory:** catalog with ~6 products; orders arrive next morning
- [ ] **Stocking:** open boxes, place items on 3–4 shelves
- [ ] **Checkout:** scan + ring up, with tips
- [ ] **Dream Dollhouse v0:** one room in the window, set aside items to place in ~4 slots, Charm increases foot traffic
- [ ] Customers browse, buy, and leave wish notes
- [ ] Hire one cashier
- [ ] Coins, a few upgrades, local save
- [ ] Toon-shaded low-poly placeholder art
- [ ] Playable on a phone browser

### Next
- Building grid expansion (X and Y), room types, pan/zoom
- More marketing options and events
- First regulars and story events
- More products, suppliers, decor
- Dream Dollhouse rooms and free placement; Snapshot sharing
- Offline earnings; audio

### Later
- Workshop and commissions
- Seasons
- Share codes / friends' dollhouses
- Second location
- Capacitor builds for iOS / Android

## 17. Open Questions

1. **Dream Dollhouse placement:** fixed slots per room (simpler, great on touch) or free placement on a grid (more creative)? 💡 Slots for the MVP, a fine grid later.
2. Does setting an item aside for the Dream Dollhouse feel right, or should good items go into it automatically (a "collection" approach)?
3. Open-hours length: ~3–5 minutes per day feel right?
4. Any regular characters or story ideas you'd like to add?
5. Orthographic vs perspective camera (we'll prototype both).
