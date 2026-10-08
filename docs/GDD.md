# Dream Doll Shop — Game Design Document

> **Status:** Draft v0.4 — for iteration. Nothing here is locked.
> Items marked **❓** are open questions. Items marked **💡** are proposals to react to.

## Decisions Log

| # | Decision | Version |
|---|---|---|
| 1 | Shop theme: **dollhouse shop** (dollhouses, dolls, tiny furniture & accessories) | v0.2 |
| 2 | **Mostly active** play, with modest offline earnings | v0.2 |
| 3 | **Tap directly**; a shopkeeper character moves around for charm | v0.2 |
| 4 | **Portrait** orientation | v0.2 |
| 5 | Start small, grow big through expansions and/or new locations | v0.2 |
| 6 | **No failure states.** Cozy, not stressful | v0.2 |
| 7 | Player does real shop jobs: **inventory, stocking, marketing, checkout** | v0.2 |
| 8 | Touchstones: *Eatventure*, *TCG Card Shop Tycoon*, *Tiny Tower* (for feel, not for copying mechanics) | v0.2–v0.3 |
| 9 | Title: **Dream Doll Shop** | v0.3 |
| 10 | Shop shown as a **dollhouse cutaway**; the building grows on a **grid in both X and Y** (wings and floors), not a tall tower | v0.3 |
| 11 | **Dream Dollhouse:** the player's own showpiece in the shop window; acts as the shop's advertisement | v0.3 |
| 12 | **Storyline events** with named regulars as you progress | v0.3 |
| 13 | **Workshop** is on the roadmap; **sharing creations with friends** is a future goal | v0.3 |
| 14 | **Fixed prices**, no player price-setting (see §4.5) | v0.3 |
| 15 | Play is structured in **shop days**; open hours last ~3–5 minutes | v0.3–v0.4 |
| 16 | Dream Dollhouse uses **fixed placement slots** for now; a free grid may come later | v0.4 |
| 17 | **Collection:** once you've received an item, it's unlocked forever and can be placed in the Dream Dollhouse at no cost | v0.4 |
| 18 | **Tone: made for a little girl.** Sweet, playful, whimsical, not a realistic adult retail store | v0.4 |

## 1. Pitch

You've just opened the sweetest little dollhouse shop in town! There are shelves of tiny teacups and itty-bitty beds, a basket of dolls in pretty dresses, and in the front window your very own **Dream Dollhouse**, waiting to be filled.

Unpack the delivery boxes, fill up the shelves, and *beep-beep-cha-ching!* ring up the happy kids and families who come to visit. Every new treasure you discover goes into your **Collection**, and you can put it right into your Dream Dollhouse. The prettier your dollhouse gets, the more people stop at the window to peek in, and the bigger your shop grows.

**Your shop is a dollhouse, and its window holds a dollhouse.** Building one grows the other.

## 2. Pillars

1. **Sweet and whimsical.** Every screen should make a kid smile: pastel colors, sparkles, hearts, bouncy animations, cute characters.
2. **Cozy over clicky.** The joy is in the shop looking lovely and customers being happy, not in watching numbers climb. Progress is shown *in the world* first, in numbers second.
3. **Playing shop.** You do the fun parts of running a shop (unpacking, stocking, ringing up), each as a short, tactile interaction that's satisfying on its own. It's pretend play, not business simulation.
4. **Your choice of jobs.** Hire helpers for the jobs you don't feel like doing; keep the ones you love.
5. **Collect and create.** Discover new treasures and decorate your Dream Dollhouse (and your shop) however you like.
6. **Nothing goes wrong.** No failure, no lost progress, no grumpy customers. The worst outcome is "a little slower."
7. **One thumb, portrait, little reading.** Every action is a tap or a short drag. Icons and pictures first; text short and simple.

## 3. Audience & Tone

- **Who it's for:** a little girl who loves dolls and dollhouses (and anyone who enjoys cute, cozy games).
- **Feel:** a playset come to life. Think of a toy shop in a picture book, not a real store.
- **Language:** short, warm, simple words. Icons do most of the explaining. Numbers kept small and friendly.
- **Names for things:**
  - **Coins:** the money you earn.
  - **Hearts ❤️:** how much customers love your shop (reputation).
  - **Sparkle ✨:** how dazzling your Dream Dollhouse and displays are (charm).
- ❓ **Is the actual target player a young child, or is this the tone for a general audience?** This matters for the store releases. Apps aimed at kids (Apple's Kids category, Google Play's Families policy, COPPA in the US) have strict rules: no third-party ads or tracking, a parental gate before purchases or external links, and limits on social features. 💡 Design as if kids will play it either way: no ads, no data collection, and any friend features gated behind a grown-up.

## 4. Platform & Tech Targets

| | |
|---|---|
| Platform now | Mobile web on GitHub Pages (`esalavat.github.io/shop-game`) |
| Platform later | iOS + Google Play by wrapping the web build (Capacitor, like *migration*) |
| Orientation | **Portrait**, locked |
| Input | Touch only: tap, short drags, drag to pan and pinch to zoom across the building |
| Rendering | Three.js, vendored (no build step), low-poly meshes, toon shading |
| Performance | 60 fps on a mid-range ~2021 phone; rooms off-screen are simplified or culled |
| Saves | Local storage now; cloud save considered for store builds (also needed for sharing) |
| Privacy | No accounts, ads, or analytics in the web build |
| Offline | Installable PWA ❓ |

## 5. The Shop Jobs

Each job is a short, playful interaction. Early on, you do them all. As the shop grows you can **hire helpers** for any job, but you can always jump in yourself, which is usually faster and comes with a little bonus.

### 5.1 Ordering stock
- Open the **order book**, a picture catalog of cute items, and tap what you'd like.
- **Pip the delivery bunny** 💡 brings the boxes the **next morning** (an upgrade lets Pip come at lunchtime too).
- The main choice is what to get with your coins. Fancier items cost more and earn more.
- New catalog pages unlock as you grow and through story events.

### 5.2 Stocking shelves
- Tap a box to open it (*pop!*). Items hop out, and you tap or drag them onto shelves.
- Shelf types: little-things rack, doll display case, furniture shelf, dollhouse table.
- **Display bonus:** putting matching things together (a whole pink bedroom set) makes the shelf sparkle, and customers buy more. It's a nice reward that never punishes.

### 5.3 Ringing up customers
- A customer brings their treasures to the counter. Tap each item to scan it (*beep!*), then tap the register (*cha-ching!*). That's 2–4 taps.
- No making change.
- **The tedium fix:** hire a cashier helper any time. If you ring customers up yourself, you get **tips**, and sometimes a sweet moment (a kid hugging her new doll, a drawing pinned to your wall).

### 5.4 Spreading the word
- **The Dream Dollhouse window** (§6) is always on and is the biggest draw.
- **Morning picks:** hang posters, tie balloons on the door, or send out invitations, each bringing more visitors or a certain kind of visitor.
- **Special days** unlocked as you grow: Tea Party Day, Birthday Party, Doll Fashion Show, Sparkle Sale (extra customers, lower prices for the day).

### 5.5 Pricing (decided: fixed prices)
Each item has a set price. You earn more through:
- **Fancier stock:** rarer items cost more.
- **Display bonuses:** customers buy more items per visit.
- **Tips:** from ringing up customers yourself.
- **Special days**, like the Sparkle Sale.
- **Hearts:** a well-loved shop attracts more customers, and ones with bigger wish lists.

**Why:** setting prices feels like a spreadsheet and creates a way to "do it wrong," which doesn't fit a cozy pretend-play game. The fun choices are *what* to order, *how* to display it, and *how to decorate your Dream Dollhouse*.

### 5.6 Workshop (roadmap)
- A shop room where you build a dollhouse from your collection.
- **Requests** from regulars ("Can you make me a seaside cottage for my birthday?") act as story beats with special rewards. You can also make fancy dollhouses to sell.
- Uses the same decorating tools as the Dream Dollhouse.

## 6. The Dream Dollhouse ⭐

Your very own dollhouse, displayed in the shop's front window.

### 6.1 What it is
- A dollhouse with its own small grid of rooms (bedroom, living room, kitchen, nursery, pet room…), shown in the window and editable in a close-up **decorate mode**.
- It starts as a bare one-room house and grows: more rooms, roof styles, wallpaper, floors, twinkly lights.

### 6.2 The Collection
- Every item you **receive in a delivery** (or get as a story gift) is added to your **Collection**, a sticker-book style album.
- Anything in your Collection can be placed in the Dream Dollhouse **for free and forever**. It doesn't use up shop stock.
- Collection pages fill in by theme (Tea Time, Sweet Dreams Bedroom, Pet Friends, Princess Castle…). Completing a page gives a reward.
- Some **special treasures** only come from story events and can't be bought.
- That makes ordering new kinds of stock exciting twice: once for the shop, and once for your Collection.

### 6.3 Decorating
- Each dollhouse room has **fixed slots** (bed spot, table spot, wall spot, rug spot, shelf spot…). Tap a slot to pick an item from your Collection that fits it.
- Wallpaper, floors, and roof are chosen per room or for the whole house.
- 💡 A free placement grid can come later.

### 6.4 What it does
- **Sparkle ✨:** each placed item adds Sparkle based on how special it is. Matching sets and fully decorated rooms add bonus Sparkle.
- Sparkle is the shop's main advertisement: more passersby, and they stop and peek in the window with little hearts and "ooh!" bubbles. Some come inside.
- Sparkle milestones unlock new things (catalog pages, story moments, decorations).
- 💡 A customer sometimes points at something in the window: "I want that bed!" If you have it in stock, that's an easy sale.

### 6.5 Sharing (future)
- **Phase 1 (no server):** a **Snapshot** button makes a pretty photo of your Dream Dollhouse to save or share.
- **Phase 2:** share a dollhouse as a code or link that friends can open in a view-only viewer.
- **Phase 3 (needs a backend):** visit friends' dollhouses and leave a heart. If kids are the audience (§3), this must sit behind a parental gate and follow kids-store rules.

## 7. Shop Days

| Phase | What happens | Timer |
|---|---|---|
| **Morning** | Pip's deliveries arrive. Choose today's posters/balloons. Unpack and fill the shelves. | None |
| **Open** | Customers come and go. Fill shelves, ring up, enjoy. The sun moves across the sky. | ~3–5 min |
| **Evening** | Golden light; last customers wave goodbye; lamps glow. | Winding down |
| **Close** | Day summary: coins, happy customers, wish notes, Sparkle. Story moments happen here. Then order for tomorrow, buy upgrades, and decorate, all with no timer. | None |

- Days only advance when you play.
- **Offline earnings:** if you have helpers, they keep the shop open a little while you're away, at a reduced rate capped at a few hours. When you return: "While you were away, Mia sold 9 things and found a wish note!"
- 💡 Weekends bring more visitors; some special days only happen on certain days.
- 💡 Seasons: spring flowers, summer beach things, autumn leaves, snowy holidays, each with seasonal items and decorations.

## 8. Customers & Story

### 8.1 Customers
- Chunky, cute characters who walk in, look around, pick treasures, bring them to the counter, pay, and wave goodbye.
- **Who visits:** kids with their parents, best friends shopping together, grandparents picking out presents, birthday-party groups, window-peekers drawn in by the Dream Dollhouse. 💡 Maybe cute animal visitors in later towns/seasons.
- **No failure:**
  - If something's out of stock, they leave a **wish note** with a little picture ("I wish you had a tiny piano!"). It's a hint, not a penalty.
  - If the counter's busy, they keep browsing (and might find one more thing). Nobody ever leaves upset.

### 8.2 Regulars & story
- A small cast of named friends, each with a little story told over many days:
  - **Lily**, a girl saving up for her very first dollhouse. You help her fill it room by room.
  - **Grandma June**, who used to visit this shop when she was little and tells stories of the old shop and the town.
  - **Pip**, the delivery bunny, who's a little clumsy and very cheerful.
  - **Rosie**, who is planning the best birthday party ever and asks you to make a special dollhouse (introduces the Workshop).
- Story moments trigger at milestones (Sparkle level, new room, day count) and play out at closing time or as a customer visit.
- Rewards: special treasures for your Collection, new catalog pages, decorations, new rooms.
- 💡 Gentle overall story: the shop was a beloved old toy shop that had closed. As you bring it back, the town comes back to life and remembers its magic.

## 9. The Shop Building: Growing in X and Y

### 9.1 Building grid
- The shop is a **grid of rooms**, seen front-on like a dollhouse with the wall open.
- Expand **sideways** (new wings) and **upward** (new floors), so it becomes a wide, charming building and not a tower.
- Each new room costs coins and unlocks through milestones.
- The outside (roof, colors, sign, awning, flower boxes) is customizable and visible when zoomed out.

### 9.2 Room types
| Room | Purpose |
|---|---|
| **Shop room** | Shelves and customers. Can be themed (Doll Corner, Tiny Furniture, Princess Room, Pet Friends). Themed rooms attract matching visitors. |
| **Front window** | Holds the Dream Dollhouse. Ground floor, facing the street. |
| **Counter** | Checkout. A second counter comes later for busy days. |
| **Stockroom** | Where boxes go; holds more stock. |
| **Workshop** | Build requested and fancy dollhouses (§5.6). |
| **Tea corner** 💡 | Customers sit, sip, and stay longer. |
| **Helpers' room** | Needed to hire more helpers. |

### 9.3 Getting around (portrait)
- Drag to move around; pinch to zoom out to the whole building or into one room.
- Double-tap a room to zoom to it. A little room map at the bottom lets you jump around.
- The default view shows ~1–2 rooms; zooming out shows the whole building.

### 9.4 New locations
- Expanding the main building comes first.
- **Later ❓:** open a second shop somewhere new (a seaside town, a snowy village) with its own style. The first shop keeps running. Nothing is ever taken away.

## 10. Helpers

- Hire helpers for any job: **Stocker**, **Cashier**, **Orderer** (re-orders favorites), **Poster Hanger**.
- Helpers are named, cute characters; they work at a steady pace and can be upgraded.
- Hiring is about choosing what *you* want to do.
- Your shopkeeper is always there and walks to whatever you tap.
- ❓ Is the shopkeeper customizable (hair, outfit, colors)? 💡 Yes, a natural fit for the audience, and outfits are nice rewards.

## 11. Economy & Progression

- One currency: **coins**. Two progress meters that are never spent: **Hearts ❤️** and **Sparkle ✨**.
- Costs scale gently; early on, something new should be affordable every day or so.
- You can't go broke. Unsold stock just waits on the shelf.
- Goals: gentle milestone lists, Collection pages, regulars' stories, and room unlocks.

## 12. Controls (Portrait, Touch)

| Gesture | Action |
|---|---|
| Tap | Interact: open box, scan item, ring up, open panel |
| Tap/drag item onto shelf | Fill a shelf |
| Drag | Move around the building |
| Pinch | Zoom between one room and the whole building |
| Double-tap room | Zoom to that room |
| Tap & hold | See what something is |
| Decorate mode | Tap a slot → pick an item from your Collection |

Big buttons sit at the **bottom of the screen**: order book, posters, helpers, decorate, Collection. The top shows coins, Hearts, Sparkle, and a little sun/moon clock.

## 13. Camera

- Front-on **dollhouse cutaway** with a slight top-down tilt.
- Orthographic vs low-FOV perspective ❓, to be decided by prototyping both.
- Gentle idle sway; lighting changes through the day.

## 14. Art Direction

- **Style:** low-poly 3D, chunky cartoony proportions, rounded shapes. It should look like a toy.
- **Palette:** pastels with pops of brightness: pink, lavender, mint, butter yellow, sky blue, cream, and warm wood.
- **Shading:** toon shading (`MeshToonMaterial`, stepped gradient), soft colored shadows. Optional outline pass ❓.
- **Lighting:** warm sunlight through the windows moving across the day; twinkly lamps and fairy lights in the evening.
- **Juice:** sparkles, floating hearts, bouncy squash-and-stretch, confetti for milestones.
- **Characters:** round bodies, big heads and eyes, rosy cheeks, few polys, lots of outfit/hair color variety.
- **Products:** tiny furniture, teacups, dolls in dresses, pets, dollhouses (each its own little house!), with a sprinkle of fantasy (unicorn lamp, rainbow rug, castle dollhouse).
- **UI:** round, chunky, candy-colored buttons; big icons; friendly rounded font.
- **Assets:** placeholder geometry in code → CC0 low-poly packs (Kenney, Quaternius) → custom Blender glTF later.
- **Asset reuse:** each product has one model, used on shelves, in customers' hands, in the Collection, and in the Dream Dollhouse.

## 15. Audio

- Cheerful music-box / ukulele loop that changes with the time of day; *pop*, *beep*, *cha-ching*, door bell, sparkle chimes.
- Mute toggle from day one.

## 16. Monetization (future store builds)

❓ Undecided and out of scope for the web build. Given the audience, the leading option is **paid up-front with no ads and no in-app purchases** (simplest for kids-store rules and the most parent-friendly).

## 17. Roadmap

### MVP: first playable on GitHub Pages
Goal: prove that the shop jobs, the day rhythm, and the Dream Dollhouse feel good together.

- [ ] One-room shop (dollhouse cutaway), portrait, fixed camera
- [ ] Shopkeeper who walks to what you tap
- [ ] **Day cycle:** morning → open → evening → close summary
- [ ] **Ordering:** order book with ~6 items; boxes arrive next morning
- [ ] **Stocking:** open boxes, place items on 3–4 shelves
- [ ] **Checkout:** scan + ring up, with tips
- [ ] **Collection:** items unlock when first received
- [ ] **Dream Dollhouse v0:** one room in the window with ~4 fixed slots; Sparkle increases visitors
- [ ] Customers browse, buy, and leave wish notes
- [ ] Hire one cashier helper
- [ ] Coins, a few upgrades, local save
- [ ] Toon-shaded low-poly placeholder art in the pastel palette
- [ ] Playable on a phone browser

### Next
- Building grid expansion (X and Y), room types, pan/zoom
- More morning picks and special days
- First regulars and story moments
- More items, Collection pages, decorations
- More Dream Dollhouse rooms; Snapshot sharing
- Shopkeeper customization
- Offline earnings; audio

### Later
- Workshop and requests
- Seasons
- Share codes / friends' dollhouses (parent-gated)
- Second location
- Capacitor builds for iOS / Android

## 18. Open Questions

1. **Audience:** is the real target player a young child (which triggers kids-store rules), or is the little-girl feel the tone for a general audience? (§3)
2. Customizable shopkeeper: yes? (§10)
3. Orthographic vs perspective camera (we'll prototype both).
