# Shop Game — Game Design Document

> **Status:** Draft v0.2 — for iteration. Nothing here is locked.
> Items marked **❓** are open questions. Items marked **💡** are proposals to react to.

## Decisions Log

| # | Decision | Version |
|---|---|---|
| 1 | Shop theme: **dollhouse shop** (dollhouses, dolls, miniature furniture & accessories) | v0.2 |
| 2 | **Mostly active** play, with modest offline earnings | v0.2 |
| 3 | **Tap directly**; a shopkeeper character moves around for charm | v0.2 |
| 4 | **Portrait** orientation | v0.2 |
| 5 | Start small, grow big through **expansions and/or new locations** | v0.2 |
| 6 | **No failure states.** Cozy, not stressful | v0.2 |
| 7 | Player does real shop jobs: **inventory, stocking, marketing, checkout** | v0.2 |
| 8 | Touchstones: *Eatventure*, *TCG Card Shop Simulator / Tycoon* (for feel, not for copying mechanics) | v0.2 |

## 1. Pitch

You open a tiny dollhouse shop: a few shelves of miniature chairs, a couple of dolls, and one beautiful dollhouse in the window. Order stock, unpack it onto the shelves, put up flyers, and ring up the delighted collectors and kids who wander in. Over time your little shop grows into a beloved destination, with more rooms, rarer pieces, and maybe a second shop across town.

**The twist that fits the theme 💡:** the shop itself is shown like a dollhouse, as a cutaway 3D room viewed from the front with the wall removed. Expanding the shop feels like adding rooms to a dollhouse: a new floor on top, a wing to the side. The game becomes a dollhouse you're building, too.

**Working title ❓:** ideas: *Tiny Rooms*, *Little Shop of Littles*, *The Dollhouse Shop*, *Miniature Lane*, *Small Wonders*.

## 2. Pillars

1. **Cozy over clicky.** The joy is in the shop looking lovely and customers being happy, not in watching numbers climb. Progress is shown *in the world* first, in numbers second.
2. **Real shopkeeping, light touch.** You do the actual jobs of running a shop, each as a short, tactile interaction that's satisfying on its own.
3. **Your choice of jobs.** You're never forced to do a job you're tired of. Hire help for the jobs you don't enjoy and keep the ones you do.
4. **Nothing goes wrong.** No failure, no lost progress, no angry customers. The worst outcome is "a little slower."
5. **One thumb, portrait.** Every action is a tap or a short drag.

## 3. Platform & Tech Targets

| | |
|---|---|
| Platform now | Mobile web on GitHub Pages (`esalavat.github.io/shop-game`) |
| Platform later | iOS + Google Play by wrapping the web build (Capacitor, like *migration*) |
| Orientation | **Portrait**, locked |
| Input | Touch only: tap, short drags, vertical pan as the shop grows taller |
| Rendering | Three.js, vendored (no build step), low-poly meshes, toon shading |
| Performance | 60 fps on a mid-range ~2021 phone |
| Saves | Local storage now; cloud save considered for store builds |
| Offline | Installable PWA ❓ |

Portrait plus a dollhouse cutaway works well: dollhouses are tall, so the shop can **grow upward** (new floors) and the camera pans vertically, which suits a portrait screen.

## 4. The Shopkeeping Jobs

The heart of the game. Each job is a small, self-contained interaction. Early on, you do all of them. As the shop grows, you can **hire staff** for any job, but you can always step in and do a job yourself (usually faster, plus a small bonus like tips or happiness).

### 4.1 Inventory: ordering stock
- Open the **catalog** (a cute supplier book or tablet) and order products.
- Orders arrive as **boxes** delivered to the back room or doorstep after a short wait (real-time seconds, not hours).
- Budget is the main decision: which items, how many. Rarer items cost more and sell for more.
- 💡 Supplier catalogs unlock over time (e.g. "Victorian Miniatures Co.", "Woodland Critter Dolls").

### 4.2 Stocking shelves
- Tap a box to open it, then tap or drag items onto shelves. Items visibly fill the shelves.
- Shelves have types (small-items rack, doll display case, furniture shelf, dollhouse plinth).
- 💡 Arranging items nicely (matching sets together, e.g. a full bedroom set) gives a **display bonus**: customers linger and buy more. This rewards care without punishing anyone.

### 4.3 Ringing up customers
- A customer brings items to the counter. Tap each item to scan it (*beep*), tap the register to finish (*cha-ching*), and they leave happy.
- Kept short (2–4 taps) so it doesn't get tedious.
- **The tedium fix:** hire a cashier any time. But checkout done by you earns **tips** and occasionally triggers a little moment (a kid hugging a new doll, a collector's thank-you note). That makes doing it yourself rewarding without making it mandatory.
- ❓ Should we include giving change (like TCG Card Shop)? 💡 Not by default. Maybe as an optional "precise change" tip bonus later.

### 4.4 Marketing
- Choose a campaign: **flyers** (cheap, short), **window display** (arrange a showpiece in the front window), **newspaper ad**, **social post**, **events** (e.g. "Tea Party Saturday", "Collector's Night").
- Marketing increases customer flow and can attract specific **customer types** (collectors, families, decorators).
- 💡 The window display is the hero marketing feature: put your nicest dollhouse in the window and passersby stop to look. Purely visual and cozy, with a real effect.

### 4.5 Pricing ❓
- Option A: fixed prices, raised via upgrades.
- Option B: you set prices from a few simple presets (Bargain / Fair / Premium) that trade customer happiness against margin.
- 💡 Start with A in the MVP; consider B later.

### 4.6 Workshop (later, optional) 💡
- Build or furnish a dollhouse from parts you've stocked, then sell it as a premium item or put it in the window.
- A creative, cozy "decorate" mode that ties back to the theme. Possibly the game's long-term creative outlet.

## 5. Customers

- Customers walk in, browse, pick items, bring them to the counter, pay, and leave. All are chunky, cute low-poly characters.
- **Types** with different wants: kids (dolls, cheap accessories), collectors (rare pieces, pay well), families (dollhouses), decorators (furniture sets), regulars (named characters who return).
- **No failure:**
  - Customers never leave angry. If something's out of stock, they leave a **wish note** ("I was hoping for a tiny piano!"). That's a gentle hint about what to order, not a penalty.
  - If the counter's busy, customers browse longer (and might pick up another item) instead of losing patience.
- **Regulars 💡:** a handful of named recurring customers with small story arcs (a girl building her first dollhouse, a retired collector, a set designer). Serving them unlocks items, decor, or new suppliers. This brings the "cozy, not numbers" feeling.

## 6. Staff

- Hire for any job: **Stocker**, **Cashier**, **Buyer** (auto-reorders best-sellers), **Marketer**.
- Staff are characters with names and looks; they work at a steady pace and can be upgraded.
- Hiring is about **choosing what you want to do**, not just efficiency.
- The player-shopkeeper is always present and animates to whatever you tap ("walks over and opens the box").

## 7. Progression & Growth

### 7.1 What grows
- **Stock variety:** new product lines and suppliers.
- **Shop space:** new shelves, then new rooms/floors (dollhouse-style expansions).
- **Decor:** wallpaper, flooring, lighting, plants, signage. Mostly cosmetic, with small "coziness" bonuses.
- **Reputation:** a warm rating ("Hearts"?) that grows from happy customers and nice displays, and unlocks milestones.

### 7.2 How it grows: expansions and locations
- **Phase 1: The Corner Shop.** One small room.
- **Phase 2: Expansions.** Add rooms and floors to the same building. The shop literally becomes a bigger dollhouse.
- **Phase 3: New locations ❓.** Open a second shop with a different theme (e.g. a seaside shop with nautical miniatures, a city boutique for collectors). The first shop keeps running and earning at a relaxed pace.
- 💡 No prestige reset. Your shops are never taken away from you.

### 7.3 Goals
- Gentle milestone list per phase ("Sell your first dollhouse", "Fill the furniture shelf", "Make 3 regulars happy").
- Regulars' little stories act as narrative goals.

### 7.4 Offline earnings
- While you're away, your staff keep the shop ticking over at a **reduced rate**, capped at a few hours.
- On return, a cozy summary: "While you were away: 12 customers visited, 3 wish notes left."
- Kept modest so the game stays **mostly active**.

## 8. Economy

- One currency: **coins**.
- Costs scale gently; early on, something new should be affordable every 1–3 minutes.
- No second/premium currency for now.
- Since there's no failure, there's no debt and you can't go broke. Stock you've bought just sits on the shelf until it sells.

## 9. Controls (Portrait, Touch)

| Gesture | Action |
|---|---|
| Tap object | Interact: open box, scan item, finish sale, open panel |
| Tap/drag item onto shelf | Stock a shelf |
| Vertical swipe | Pan between floors (once the shop has more than one) |
| Pinch | Zoom ❓ (maybe just two fixed zoom levels) |
| Tap & hold | Info tooltip |

UI lives at the **bottom of the screen** within thumb reach: catalog, marketing, staff, decor. The top shows coins and reputation.

## 10. Camera

- Front-on **dollhouse cutaway** view with a slight top-down tilt, so you see into the room like peering into a dollhouse.
- Orthographic or low-FOV perspective ❓ (orthographic reads more "diorama"; perspective feels warmer).
- Gentle idle camera sway / parallax for life.
- As the shop grows, the camera pans between rooms/floors.

## 11. Art Direction

- **Style:** low-poly 3D, chunky cartoony proportions, rounded silhouettes, warm saturated palette (cream, rose, sage, butter yellow, wood tones).
- **Shading:** toon/cel shading (`MeshToonMaterial` with a stepped gradient), soft colored shadows. Optional outline pass ❓ (performance cost).
- **Lighting:** warm key light from the shop windows, soft hemisphere fill, little lamps that glow. Possibly a day→evening light shift over a "shop day" 💡.
- **Characters:** bean/capsule bodies, big heads, few polys, color variations for crowds.
- **Products:** miniatures look like miniatures: tiny chairs, beds, teapots, dolls, and dollhouses (each a little house!).
- **UI:** rounded, chunky, playful; wooden/paper textures; bouncy juice on coin and heart pop-ups.
- **Assets:** placeholder geometry built in code first → CC0 low-poly packs (Kenney, Quaternius) → custom Blender glTF later.

## 12. Audio

- Soft acoustic/music-box loop, register *cha-ching*, scanner *beep*, box-opening rustle, door chime when customers enter.
- Mute toggle from day one.

## 13. Monetization (future store builds)

❓ Undecided and out of scope for the web build. If any, it should fit the cozy tone (e.g. paid up-front, or optional cosmetic packs). No pay-to-skip pressure.

## 14. MVP Scope (first playable on GitHub Pages)

Goal: prove that the four jobs feel good and that the shop feels cozy.

- [ ] One-room dollhouse-cutaway shop, portrait, fixed camera
- [ ] Shopkeeper character who walks to what you tap
- [ ] **Inventory:** catalog with ~5 products; orders arrive as boxes
- [ ] **Stocking:** open boxes, place items on 3–4 shelves
- [ ] **Checkout:** scan items + ring up, with tips
- [ ] **Marketing:** one option (flyers or window display)
- [ ] Customers browse, buy, leave wish notes when something's missing
- [ ] Hire one staff member (cashier) to show the "choose your jobs" idea
- [ ] Coins, a few upgrades, local save
- [ ] Toon-shaded low-poly placeholder art
- [ ] Deployed and playable on a phone browser

**Out of scope for MVP:** expansions/floors, new locations, decor, regulars' stories, workshop, offline earnings, audio polish, store builds.

## 15. Open Questions

1. Working title? (ideas in §1)
2. Do you like the **shop-as-a-dollhouse cutaway** presentation and growing **upward with new floors**?
3. Pricing: fixed, or simple presets (Bargain / Fair / Premium)?
4. Include giving change at checkout, or keep it tap-tap-done?
5. Do **regulars with little stories** appeal, or keep customers anonymous?
6. **Workshop** (building/decorating dollhouses to sell): want it on the roadmap?
7. Expansions only, or also new locations? (§7.2)
8. Orthographic (diorama) or perspective camera?
9. Should there be a "shop day" structure (open → evening → close, with a daily summary) or continuous play? 💡 A day cycle gives sessions a natural rhythm and a cozy end-of-day moment.
