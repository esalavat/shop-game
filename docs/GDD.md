# Shop Game — Game Design Document

> **Status:** Draft v0.1 — for iteration. Nothing here is locked.
> Items marked **❓** are open questions to decide together.

## 1. Pitch

You inherit a tiny, run-down corner shop. Stock the shelves, serve the customers, and reinvest your earnings to grow it into a bustling store — and eventually a whole little chain. Cozy, readable, and playable one-handed in short sessions.

**Working title:** ❓ (placeholder: *Shop Game*)

## 2. Pillars

1. **Satisfying loop in seconds.** Tap → something happens → coins come in. Every session, even 60 seconds, ends with visible progress.
2. **Watch it grow.** The shop physically expands on screen: new shelves, new rooms, more customers, nicer decor.
3. **Cozy, not stressful.** Mild pressure (customers waiting) but no harsh fail states.
4. **One thumb.** Every action reachable with taps and drags in portrait mode.

## 3. Platform & Tech Targets

| | |
|---|---|
| Platform now | Mobile web, hosted on GitHub Pages (`esalavat.github.io/shop-game`) |
| Platform later | iOS App Store + Google Play, by wrapping the web build (e.g. Capacitor, as with *migration*) |
| Orientation | Portrait ❓ (portrait suits one-handed play; landscape shows more of the shop) |
| Input | Touch only: tap, drag, pinch/two-finger pan for camera ❓ |
| Rendering | Three.js, vendored (no build step required), low-poly meshes, toon/flat shading |
| Performance | Target 60 fps on a mid-range phone from ~2021; cap draw calls, small textures |
| Saves | Local storage now; cloud save is a store-release question |
| Offline | Installable PWA with offline play ❓ |

## 4. Core Loop

```
 Restock shelves ──► Customers browse & pick items ──► Checkout (earn coins)
       ▲                                                       │
       └──── Buy stock / upgrades / expansions ◄───────────────┘
```

**Moment-to-moment (seconds):** tap a stockroom crate to restock a shelf; tap the register to ring up a waiting customer; tap coins/tips to collect.

**Session (minutes):** spend earnings on more stock, better shelves, a new product line, or a hire. Hit a goal ("Serve 20 customers", "Earn 500 coins") to unlock the next milestone.

**Long term (days/weeks):** expand the floor plan, unlock new product categories, open themed sections, and eventually additional shops. ❓

## 5. Gameplay Systems

### 5.1 Products
- Each product has: cost price, sell price, shelf type, restock size, demand.
- Start with one category (e.g. snacks), unlock more (drinks, produce, toys, electronics…).
- ❓ Does the player set prices, or are prices fixed and upgraded? (Setting prices adds depth but is fiddly on touch. Proposal: fixed prices with upgrades early, optional price tweaking unlocked later.)

### 5.2 Customers
- Walk in, browse shelves, pick 1–N items, queue at the register, pay, leave.
- Patience meter: if they wait too long or the item they want is out of stock, they leave unhappy (lost sale, small reputation hit).
- Customer types with different wants and budgets ❓ (e.g. kids, shoppers in a hurry, big spenders, VIPs with special requests).

### 5.3 Staff (automation)
- Early game: the player does everything by tapping.
- Hire a **cashier** to auto-checkout, a **stocker** to auto-restock, etc.
- Staff have upgradable speed. This is the main "idle" progression lever.
- ❓ How idle should the game be? Options:
  - **A. Active-first** — staff help, but the player is always busy (like *Overcooked*-lite).
  - **B. Hybrid idle** — active early, increasingly automated; earn while away (like many mobile tycoon games).
  - Proposal: **B**, with offline earnings capped to a few hours.

### 5.4 Shop Growth
- **Upgrades:** faster register, bigger shelves, more stock capacity.
- **Expansions:** knock out walls to add floor space; new rooms/sections.
- **Decor:** cosmetic + small reputation bonus (cozy factor).
- **Reputation / star rating:** drives customer volume and unlocks.

### 5.5 Economy
- Single soft currency: coins.
- ❓ Second currency (gems) for later monetization? Proposal: none for v1 — keep it clean.
- Costs scale geometrically; tuned so a new upgrade is always within ~1–3 minutes of play early on.

### 5.6 Progression & Goals
- Milestone checklist per level ("Stock 3 product types", "Reach 3 stars").
- Completing milestones unlocks the next expansion / category.
- ❓ Single shop that grows forever, or multiple shops/locations (prestige-like reset with bonuses)?

### 5.7 Fail States
- No game over. Worst case: unhappy customers, slower income, lower rating.

## 6. Controls (Touch)

| Gesture | Action |
|---|---|
| Tap object | Interact (restock, checkout, collect coins, open upgrade panel) |
| Drag on floor | Pan camera ❓ |
| Pinch | Zoom ❓ |
| Tap & hold | Show info tooltip |
| Build mode drag | Place/move shelves and decor ❓ |

❓ **Player avatar or god view?**
- **A. God view:** tap things directly; no character. Simplest, best for one thumb.
- **B. Shopkeeper avatar:** tap where to walk, character carries boxes. More charming, slower.
- Proposal: **A** to start, with the shopkeeper as a visible character who auto-animates to where you tap (charm without the control cost).

## 7. Camera

- Fixed isometric-ish 3/4 view looking into the shop, slightly tilted, orthographic or low-FOV perspective ❓.
- Shop fits the screen early; camera pans/zooms as the shop grows.

## 8. Art Direction

- **Style:** low-poly 3D, chunky proportions, soft rounded silhouettes, bright saturated palette.
- **Shading:** toon/cel shading (stepped lighting via `MeshToonMaterial` or flat shading), soft colored shadows, optional outline pass ❓ (outlines look great but cost performance).
- **Lighting:** warm key light + cool ambient/hemisphere fill, baked-looking blob or simple shadow maps.
- **Characters:** simple capsule/bean-shaped customers with big heads, few polys, color variations — cheap to render in crowds.
- **UI:** big rounded buttons, chunky font, coin pop-ups and bouncy juice.
- **Asset pipeline ❓:** hand-built geometry in code at first (boxes/cylinders) → later free CC0 low-poly packs (e.g. Kenney, Quaternius) or custom models in Blender exported as glTF.

## 9. Audio

- Light, upbeat loop; cash-register "cha-ching"; soft UI pops.
- Respect the mute switch / provide a mute toggle. ❓ priority for v1.

## 10. Monetization (future store builds)

❓ Undecided. Options: paid up-front, free + rewarded ads (e.g. "double offline earnings"), small IAP. Not in scope for the web build.

## 11. MVP Scope (first playable on GitHub Pages)

The smallest version that proves the loop is fun:

- [ ] One room shop, fixed camera
- [ ] 2–3 products, 2–3 shelves, 1 register
- [ ] Customers spawn, browse, queue, pay, leave
- [ ] Tap to restock and tap to checkout
- [ ] Coins + 3–5 upgrades (shelf capacity, register speed, hire cashier)
- [ ] Local save
- [ ] Toon-shaded low-poly look with placeholder geometry
- [ ] Deployed and playable on a phone browser

**Out of scope for MVP:** expansions, multiple shops, decor, audio, monetization, store builds.

## 12. Open Questions (summary)

1. Working title?
2. Portrait or landscape?
3. Active-first vs hybrid idle?
4. Avatar vs god view?
5. Player-set prices or fixed?
6. One shop forever vs multiple locations?
7. What kind of shop — general store, or a themed one (bakery, toy shop, plant shop, magic shop…)?
8. Outline shading: yes/no?
9. Any reference games you love (or want to avoid)?
