# My Dream Dollhouse Shop — Game Design Document

> **Status:** Draft v0.37 — for iteration. Nothing here is locked.
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
| 9 | Title: **My Dream Dollhouse Shop** (was *Dream Doll Shop*) | v0.3–v0.5 |
| 10 | Shop shown as a **dollhouse cutaway**; the building grows on a **grid in both X and Y** (wings and floors), not a tall tower | v0.3 |
| 11 | **Dream Dollhouse:** the player's own showpiece in the shop window; acts as the shop's advertisement | v0.3 |
| 12 | **Storyline events** with named regulars as you progress | v0.3 |
| 13 | **Workshop** is on the roadmap; **sharing creations with friends** is a future goal | v0.3 |
| 14 | **Fixed prices**, no player price-setting (see §5.5) | v0.3 |
| 15 | Play is structured in **shop days**; open hours last ~3–5 minutes | v0.3–v0.4 |
| 16 | Dream Dollhouse uses **fixed placement slots** for now; a free grid may come later | v0.4 |
| 17 | **Collection:** once you've received an item, it's unlocked forever and can be placed in the Dream Dollhouse at no cost | v0.4 |
| 18 | **Tone:** sweet, playful, whimsical, girl-focused, not a realistic adult retail store | v0.4 |
| 19 | **Target audience: ages 11–15.** Cute and aesthetic, but never babyish | v0.5 |
| 20 | **Customizable shopkeeper** (hair, outfits, colors) | v0.5 |
| 21 | Camera: **orthographic "diorama"**, straight-on (no angle), **no outlines** (chosen from `prototypes/camera/`) | v0.6 |
| 22 | Evening is **purple twilight**, not orange/golden | v0.6 |
| 23 | The Dream Dollhouse is **unlocked when the shop first expands**: it gets its own **Window Display room** next to the shop. The starting shop is just counter + two shelves | v0.7 |
| 24 | Customers **walk in along the sidewalk** from either side and leave the same way, fading out near the end of the road | v0.7 |
| 25 | **Close early any time:** the day button becomes a Close button during open hours (tap twice to confirm). When sold out it becomes a one-tap "Close early" with a nudge. Never closes automatically (customers at bare shelves still leave useful wish notes) | v0.8 |
| 26 | Open hours last **3 minutes**, evening **25 seconds** (tunable in `js/sim/day.js`). Evening length changed by #33 | v0.8 |
| 27 | **First expansion:** a **Grow** button in the toolbar opens the build sheet. The Window Display costs **🪙 100**, can be built any time, and goes right of the shop | v0.9 |
| 28 | **Dream Dollhouse v0** is a two-storey house with **4 rooms, one slot each**: Bedroom, Playroom (upstairs), Parlor, Tea Room (downstairs). Each slot fits some kinds of item (bed, seat, table, light, friend, toy). An item can go in several slots at once (Collection items are free and unlimited) | v0.9 |
| 29 | **Decorate mode:** tap the Dream Dollhouse (or the toolbar's Dollhouse button). The camera zooms in; a bottom panel shows the 4 rooms and the Collection items that fit the chosen one. Tapping a room in the dollhouse also picks it. The shop keeps running while you decorate | v0.9 |
| 30 | **Sparkle ✨** = the sum of the placed items' Sparkle (more special items sparkle more), **+5** when all 4 rooms are filled | v0.9 |
| 31 | **Sparkle drives foot traffic:** customers arrive more often (up to 1.5× at 30 Sparkle) and some stop at the window first ("ooh!"). Window-peekers often **want something they saw in the dollhouse** (the bubble shows it) | v0.9 |
| 32 | **Collection album** (toolbar button) shows every item as a sticker: found ones in color, the rest as silhouettes. Album pages and page rewards wait until there are more items per theme | v0.9 |
| 33 | **Short evening:** twilight fades in over **5 seconds**, then the day closes as soon as the shop is empty. Customers still inside finish first, however long that takes (playtest: the 25 s evening was mostly waiting) | v0.10 |
| 34 | **No digital timers anywhere.** Time of day shows only as the progress bar at the top; the Close button just says "Close" (it used to show a countdown like 2:15) | v0.11 |
| 35 | **Grow stays in the toolbar for good.** Once the Window Display is built, a separate **Dollhouse** button appears, so the toolbar is Order / Album / day / Dollhouse / Grow. The Grow sheet lists **Rooms**, **Helpers**, and **Upgrades** | v0.12 |
| 36 | **Cashier helper (Mia):** a **one-time hire** (🪙 150), no wages. She stands at the register and rings customers up at a steady pace, with no tips. When your shopkeeper steps behind the counter, Mia steps aside and you ring people up yourself (with tips). Hearts count either way | v0.12 |
| 37 | **First upgrades** (one-time buys in the Grow sheet): **Lunchtime delivery** (🪙 100; orders placed before midday arrive when the day bar reaches halfway), **Stock cart** (🪙 60; carry **2 boxes** per trip), **Comfy shoes** (🪙 80; your shopkeeper walks faster). More shelf space waits for a new shop room (a third shelf would hide things in the straight-on view) | v0.12 |
| 38 | **Shopkeeper creator:** hair style, hair color, skin tone, outfit color, and one accessory (none, bow, glasses, or hat). Shown on a new game and once for existing saves; tap your shopkeeper in the morning to change it any time | v0.12 |
| 39 | **Early economy stays as it is.** Selling out on Day 1 is fine now that you can close early (#25, #33); early progress feels good (playtest) | v0.12 |
| 40 | **Pip's rescue box:** if a morning starts with nothing to sell (empty shelves, no boxes, nothing ordered) and not enough coins for the cheapest box, Pip brings a free box of the cheapest item, "just because". You can never get stuck (#6, §11) | v0.13 |
| 41 | **The shopkeeper can leave the shop room** (playtest: once Mia has the register there was nowhere good to stand). She walks out the front, along the sidewalk, and into another ground-floor room. **Each room can give a bonus while she's in it**: the **Window Display** makes window-peekers more common and more likely to want something from the dollhouse. The sidewalk is free to walk (no bonus), except the **greeter spot** by the shop door: customers she greets are more likely to pick up a second item | v0.14 |
| 42 | **Randomize button** (🎲) in the shopkeeper creator | v0.14 |
| 43 | **Boy or girl shopkeeper** (planned, not built yet): the creator gets a first choice between a male and a female shopkeeper, with matching hair styles and outfits. Game text should say "your shopkeeper" rather than "she" | v0.14 |
| 44 | **Bonus spots glow on the ground** (playtest: the bonus spots weren't clear): a soft ring at the greeter spot (pink) and beside the Dream Dollhouse (yellow). Tap a ring to send the shopkeeper there; it stays lit under her while the bonus is on. The Window Display bonus still counts anywhere in the room; the ring marks the best spot (beside the dollhouse, not hiding it). After walking to a spot on the floor or sidewalk, she **turns to face the camera** | v0.14 |
| 45 | **Polish pass juice** (M8): coins, tips and hearts pop at the register and the counter bumps; hearts float up from happy customers; stocked items hop onto the shelf, **squash and stretch** into place and sparkle; an emptied box goes *poof*; dollhouse items sparkle; window-peekers get a little sparkle; **confetti** when you build a room, hire a helper or buy an upgrade | v0.15 |
| 46 | **Sound effects are synthesized in code** (Web Audio, no sound files): pop, scan beep, cha-ching, door bell when a customer walks in, sparkle chimes, a confetti fanfare, and little jingles when the shop opens and closes. **No music yet** (it waits for a later milestone). A **🔊 mute button** in the HUD is saved with the game | v0.15 |
| 47 | **Light haptics:** short vibrations on a sale, stocking a shelf, and confetti moments (Android phones; iPhone Safari can't vibrate). Muting also turns them off | v0.15 |
| 48 | **End-of-day celebration:** the closing summary counts the numbers up with ticks and a cha-ching. Beating your best day for coins shows **"New record! 🏆"** with confetti (Day 1 just sets the first record) | v0.15 |
| 49 | **Bouncy UI:** buttons squish when pressed, sheets and panels spring open, toasts pop in, with a soft tap sound | v0.15 |
| 50 | **Installable and playable offline** (PWA): "Add to Home screen" gives a proper app icon, and the game opens without a connection. Online, it always loads the newest version | v0.15 |
| 51 | **Stocker helper** (planned, not built yet): a second one-time hire who carries delivery boxes from the doorstep to the shelves and unpacks them, so stocking can run on its own like checkout does with Mia. Details are a proposal in §10, open for feedback | v0.16 |
| 52 | **Midday mark on the day bar** (user request): with Lunchtime Delivery owned, a small mark sits halfway along the HUD's day bar during open hours. It **glows butter yellow and pulses** while a lunch order is on its way, and fades once midday has passed. Without the upgrade, no mark. (A mark, not a countdown, so it keeps #34) | v0.17 |
| 53 | **Bea the stocker** (builds #51): one-time hire, **🪙 200**. She carries boxes from the doorstep to the shelves and unpacks them, slower than you, in the **morning, open hours and evening**. She unpacks **wished-for items first**, then items that aren't on the shelves yet, onto the emptiest shelf; uses the Stock Cart too. She never takes the box your shopkeeper is heading for; when there's nothing to do she waits by the right wall | v0.18 |
| 54 | **Order book shows what you'll earn** (user, resolves §18 #4): each card shows the **sell price per item** ("Sells for 🪙 10 each") and the **profit for the whole box** as a mint tag ("+🪙 12 profit"), so you can see which items earn the most. Tips aren't counted | v0.19 |
| 55 | **Boy or girl shopkeeper built** (#43): the creator's first row is **Girl 👧 / Boy 👦**. Boys' hair: **short, spiky, curly, swoop**; boys' accessories: **bow tie, glasses, cap** (girls keep bob / bun / pigtails / ponytail and bow / glasses / sun hat). Switching keeps whatever fits both (colors, glasses). Outfit colors are the same for both. 🎲 randomizes within your choice. Existing shops keep a girl | v0.20 |
| 56 | **Public game and test build** (user): the game is shared at the main link, which only changes on a **release** (about once a day, `npm run release`). Every change goes to the **test build at `/dev/`** first. The test build has a DEV badge, installs as its own app ("Dollhouse Shop DEV"), and plays on a **copy** of your real save, so testing never touches real progress. **Saves are never lost**: a save from a newer version is never overwritten (the game asks you to update instead), and every release must still load sample saves from all earlier versions (docs/TECH.md §9.1, §9.4) | v0.21 |
| 57 | **First-day guide** (user): in a brand-new game, once the creator closes, a bouncing pink arrow with a short label points at the next thing to do: **a doorstep box** ("Tap a box!") → **a shelf** ("Tap a shelf to unpack!") → **Open shop** ("Open your shop!") → **the counter** when the first customer lines up ("Tap the register!"; the "Tap to scan" prompt takes over once you're there). It ends with the first sale and never comes back; it only moves forward and skips ahead if you do. Existing shops don't see it. **Morning nudge:** any morning, if nothing has happened for **5 seconds** (no taps, shopkeeper standing still), the "Open your shop!" arrow appears until the next tap | v0.22 |
| 58 | **More rooms, themed and upstairs** (user; planned, §9): **Grow → Build a room → pick a theme → tap a glowing ＋ spot** on the building. Six **theme rooms**, one per Collection theme (Tea Time, Cozy Parlor, Fairy Garden, Sweet Dreams, Doll Friends, Little Houses), each with **3 shelves** and its own wallpaper. Any item can go anywhere, but **items sell better in their matching room** (a theme bonus on each sale). Customers walk to the room that has what they want and pay at the one counter in the main shop. **Upstairs:** build a **Stairwell** once (a room column with a spiral staircase in the back corner and one shelf beside it, on both floors); then ＋ spots appear upstairs next to it, and upstairs rooms connect through doorways. One upstairs floor for now. Built in two steps: ground-floor theme rooms first, then the Stairwell and upstairs | v0.23 |
| 59 | **Lots of items, and a Collection that pays off** (user; planned after #58, §6.2, §5.1): aim for **100+ items** over time. Prices **scale up** like today, projected forward: fancier items cost more and make more profit. Many items come in **color variants** (the same chair in mint, pink and lilac), each its own sticker. Each theme is an **album page**; the **order book grows as you collect** (new catalog pages open as you find more items, fancier ones last). **Collection bonus:** each item found brings a few percent more customers; **completing a page** gives a bigger customer boost, a **coin gift with confetti**, and a **shopkeeper style** (an outfit color or accessory). 💡 Later: special things that unlock at **Heart and Sparkle milestones** (§18 #6) | v0.23 |
| 60 | **Smarter and more stockers** (user; planned with #58, §10): a **Sorting Smarts** upgrade makes stockers unpack each box into its **matching theme room** when there's one with space (otherwise the emptiest shelf, as now). Later, **hire more than one stocker**, each costing more | v0.23 |
| 61 | **Stairwell and upstairs, as built** (#58 step 2): the Stairwell shows up in Grow after the first theme room (🪙 350) and is placed on a ground-floor ＋ like a theme room; it builds both floors at once. Spiral stairs in the back-left corner (one full turn), one shelf on each floor, a railing round the hole upstairs. Upstairs rooms open into each other through side doorways and have a **low railing along the open front**. The roof steps: each run of rooms with the same height gets its own roof; the sign stays over the shop. **Tap the stairs** to send your shopkeeper up (or the railing upstairs to come down); the view follows. Customers and Bea use the stairs too; everyone still pays at the shop counter | v0.24 |
| 62 | **Quick evenings** (user; replaces the waiting part of #33): twilight lasts **10 seconds**. When it's over, everyone still shopping stops: customers holding something go straight to the counter and pay for what they have; customers with nothing go home. The day closes as soon as the last one has paid (or given up), **without waiting for them to walk off-screen**; they keep walking away behind the summary | v0.25 |
| 63 | **Close now in the evening** (user): during the evening the day button says **Close now**; two taps (one if nobody's left) close the shop on the spot. Everyone still in the shop goes home without paying, and **whatever they were holding goes back on the shelves** (its own spot if it's free, else another shelf, else a box on the doorstep) | v0.26 |
| 64 | **The Stairwell's spot is fixed** (user; changes #61): it's still a Grow purchase (🪙 350, after the first expansion room), but you don't choose where it goes: it's always built **right next to the main shop**, and the Window Display and any rooms on that side **move over one place**. **Upstairs rooms must sit on top of a room below** (nothing floats) | v0.27 |
| 65 | **Plain shelf rooms, more floors, prices by distance** (user; replaces the theme rooms of #58 and Sorting Smarts of #60): expansion rooms are **plain shelf rooms** (3 shelves, a pastel wallpaper each, handed out in turn); a **decoration shop** with its own currency will let you restyle them later. No theme bonus. **More floors:** after the Stairwell, Grow offers **Another floor**: the stairs go up one more floor with a landing and a shelf; **each staircase costs more** (🪙 350 for the Stairwell, then 700, 1200, 1900, 2800, then +1200 each). **Room prices grow with distance from the middle** (the shop and the Stairwell) so a **compact, squarish house is cheapest**: a spot's *ring* is how far out it is sideways or up, whichever is more (🪙 250, 400, 600, 850, 1150, 1500, then +450 a ring), and every floor up adds 15% over the same spot below. Each ＋ shows its price. Upstairs rooms always sit on a room below. Theme rooms already built on `/dev/` became shelf rooms with their stock; Sorting Smarts was refunded | v0.28 |
| 66 | **24 items on four catalog pages** (user; first step of #59): six themes × four items. The order book has **four pages** (tabs), **one item per theme on each page**, fancier and more profitable as you go: **Starter** (open from the start, box profit 🪙 12-18), **Favorites** (opens when you've found **4** items, 🪙 21-32), **Fancy Finds** (**10** found, 🪙 36-56), **Treasures** (**16** found, 🪙 70-120). A page opening gets a toast, confetti and a "new" dot on its tab. **Items you've already found can always be ordered again**, whatever page they're on. Customers only **wish for items you can order now**. The album shows one section per theme ("2 / 4"). The six original items keep their prices. Prices and Sparkle (about price ÷ 4) are first guesses; the user may swap or rename items later. Color variants, the Collection bonus and page rewards are still to come (#59) | v0.29 |
| 67 | **Back to the summary after ordering** (user): closing the order book you opened from the day summary brings the summary back, so "Start Day N" is right there. After closing, the toolbar's **Day summary** button is pink like the other "do this next" buttons (Open shop, Close early) | v0.30 |
| 68 | **Decoration shop and Ribbons 🎀** (user; resolves §18 #9): a new currency, **Ribbons 🎀**, earned by caring for customers and collecting, not by selling more: **+1** when a sale grants a wish note (the note is used up), **+1** when a window-peeker buys the thing they pointed at, **+2** for each new Collection item, **+5** for completing a theme (all four items), and an end-of-day gift of **+1 per 5 happy customers**. New shops start with 🎀 4 (the two starter items); existing shops get 🎀 2 per item found plus 5 per complete theme. **Grow → 🎨 Decorate rooms** opens decorate mode: the camera zooms to a room above a bottom panel; ◀ ▶ (or tapping a room) changes room. Every room can be styled: **Walls** (colour and pattern), **Floor**, **Rug**, **Curtains** (rooms with a window) and the **Corner** piece (the room's plant spot). Tapping a style **shows it on the room straight away**; one you don't own shows its 🎀 price and a Get it button. **Bought once, yours forever, in any room**; restyling is free. The colours and looks already in the game are free. **Styles are just for looks** (no Sparkle or bonus). The shop keeps running while you decorate. Prices are first guesses (`js/data/decor.js`) | v0.31 |
| 69 | **Complete a theme, get a room style** (user): finishing a theme in the Collection (all four items) gives a matching room style for free, on top of the 🎀 5: Tea Time → Gingham wallpaper, Cozy Parlor → Bookcase, Fairy Garden → Flower rug, Sweet Dreams → Stars wallpaper, Doll Friends → Hearts wallpaper, Little Houses → Pink checker floor. They can still be bought with Ribbons before that. The album shows each theme's reward; a toast and confetti announce it. Themes completed before the update count. The user is happy with the Ribbon rates and prices for now (balance later if needed) | v0.32 |
| 70 | **Collection bonus and theme rewards** (user; part of #59): every item found brings **+2% more visitors** and every complete theme **+5% more**, up to **+50%**; it adds to Sparkle's boost (so at most twice as many visitors). The album shows the bonus ("Collection bonus: +16% customers"). Completing a theme (an album page) also gives a **coin gift with confetti**: 🪙 **100** for the first theme you complete, **+50** for each one after (100, 150, 200 ... 350), and a **shopkeeper style** for girls and boys, a mix of outfit colours and accessories: Tea Time → **Strawberry** outfit, Cozy Parlor → **Plum Velvet** outfit, Fairy Garden → **Flower Crown**, Sweet Dreams → **Starry Night** outfit, Doll Friends → **Bunny Ears**, Little Houses → **Royal Crown**. Locked styles show in the creator with a 🔒 and say which theme unlocks them. Shops that already finished themes get the coins and styles the first time they open the updated game. Numbers are first guesses (`js/data/items.js` `COLLECTION`) | v0.33 |
| 71 | **Stock counts in the order book** (tester and user; resolves §18 #11): every item you've found shows how many you have, as little chips: 🏪 on the shelves (all rooms), 📦 in boxes (on the doorstep or being carried) and 🚚 coming (ordered). A legend line under the tabs explains the icons. An item with none on the shelves or in boxes says **"None in the shop!"** in pink, so gaps stand out. The counts update live while the book is open | v0.34 |
| 72 | **More helpers and upgrades** (user; resolves §18 #12). All from the Grow sheet, one-time buys, prices first guesses. **Helpers:** **Ollie the Greeter** (🪙 250) stands at the greeter spot by the door during open hours and greets everyone who comes in (the same bonus your shopkeeper gives there; the greeter ring goes away once he's hired). **Rosa the Window Dresser** (🪙 300, once the Window Display is built) stands beside the Dream Dollhouse showing it off (the same bonus as your shopkeeper there; that ring goes away too). **More stockers:** up to **three** (Bea 🪙 200, then **Theo** 🪙 350 and **Juno** 🪙 500), who never fetch the same box. (A second register on the same counter was planned here; it became register rooms, #73.) **Upgrades:** **Speedy Scanner** (🪙 120: each tap scans two items, and cashiers scan faster), **Gift Wrap** (🪙 150: tips are twice as big when you ring people up yourself), **Tall Shelves** (🪙 250: every shelf gets one more row). Built in steps: greeter, window dresser, scanner and gift wrap → tall shelves → more stockers | v0.35 |
| 73 | **Register rooms** (user; replaces the "second register on the same counter" of #72, which had no room to grow): an upgrade in the **Upgrades** section, **one per floor**, available once the stairs reach a floor without one. Each is a room that **looks like the shop** (counter, two shelves, window, plant, rug) and **always goes directly above the highest register so far**, in the shop's column, left of the Stairwell, like the Stairwell always goes right of the shop. So with 4 floors and 4 registers the middle of the house is a column of registers and a column of stairs. Rooms already on that floor left of the stairs **move over one place** to make space; a room that would then hang over nothing moves instead to the **nearest free spot that has something under it**, with its stock and decorations. **Each comes with its own cashier** (Kai first, a new one per floor), and your shopkeeper can step behind any register for tips. Customers **pay on their floor** (or come down to the nearest floor below with a register), then go home. Price 🪙 400 for the first, more for each one up (first guesses) | v0.36 |
| 74 | **Delivery bin** (user; fixes "boxes stack too high and hide the shelves", docs/ISSUES.md): the first **two boxes** sit on the doorstep as before (one tap to grab), and everything past that goes into a **delivery bin** at the right end of the doorstep, where the third spot was, with a **count badge**. Nothing stacks any more. **Tap the bin** to open a list of the boxes inside (item picture, name, how many) and tap one: your shopkeeper fetches it from the bin. When a doorstep spot frees up, the next box comes out of the bin onto it. Stockers take doorstep boxes first, then from the bin. (Two loose spots, not four: the bin has to sit in front of the shop so it's in view when the camera is on the shop.) | v0.36 |
| 75 | **Room prices: same by ring, and always climbing** (user; resolves §18 #13, replaces the per-floor markup of #65, which made shops grow into a pyramid): a spot's price depends only on its **ring** (how far out from the middle it is, sideways or up, whichever is more), so **the same distance out costs the same on every floor** (🪙 250, 400, 600, 850, 1150, 1500, then +450 a ring). On top of that, **every spot costs 🪙 50 more for each shelf room you already have**, so whenever you build a room, every price goes up and the cheapest spot always costs more than before. The middle is the shop's column and the Stairwell's; **register rooms don't count**: they sit in the middle and don't add to the price. **Staircases are cheaper** so going up keeps pace with going out: 🪙 350 (the Stairwell), 500, 700, 950, 1250, then +350 each. First guesses | v0.37 |

## 1. Pitch

You've just opened the cutest little dollhouse shop in town. There are shelves of tiny teacups and miniature beds, a basket of dolls in their best outfits, and in the front window your very own **Dream Dollhouse**, waiting to be filled.

Unpack the delivery boxes, fill up the shelves, and *beep-beep-cha-ching!* ring up the happy kids and families who come to visit. Every new treasure you discover goes into your **Collection**, and you can put it right into your Dream Dollhouse. The prettier your dollhouse gets, the more people stop at the window to peek in, and the bigger your shop grows.

**Your shop is a dollhouse, and its window holds a dollhouse.** Building one grows the other.

## 2. Pillars

1. **Cute and aesthetic.** Every screen should be something you'd want to screenshot: pastel colors, sparkles, bouncy animations, adorable characters. Cute, never babyish.
2. **Cozy over clicky.** The joy is in the shop looking lovely and customers being happy, not in watching numbers climb. Progress is shown *in the world* first, in numbers second.
3. **Playing shop.** You do the fun parts of running a shop (unpacking, stocking, ringing up), each as a short, tactile interaction that's satisfying on its own. It's pretend play, not business simulation.
4. **Your choice of jobs.** Hire helpers for the jobs you don't feel like doing; keep the ones you love.
5. **Collect and create.** Discover new treasures and decorate your Dream Dollhouse (and your shop) however you like.
6. **Nothing goes wrong.** No failure, no lost progress, no grumpy customers. The worst outcome is "a little slower."
7. **One thumb, portrait.** Every action is a tap or a short drag. Icons first; text short, friendly, and a little witty.

## 3. Audience & Tone

- **Who it's for:** players aged **11–15**, mainly girls, who love cute things, decorating, collecting, and cozy games. Comparable vibes: *Animal Crossing*, *Hello Kitty Island Adventure*, *Toca Boca*, *Paper Doll*-style dress-up, plus the "show off your room" culture of social media.
- **Feel:** a gorgeous miniature world that's fun to play shop in. Charming and a bit whimsical, but with real choices and things worth showing off.
- **Not babyish:** no baby talk, no over-explaining. Writing is warm, light, and a little funny. Characters have personality.
- **What this age cares about (design priorities):**
  - **Self-expression:** shopkeeper style, shop decor, the Dream Dollhouse. Lots of combinations, not just upgrades.
  - **Aesthetics:** themed collections in styles they recognize (cottagecore, kawaii, fairy, Y2K, princess, cozy café).
  - **Showing off:** Snapshot sharing matters more for this audience and moves up the roadmap.
  - **Collecting:** completing Collection pages and finding rare treasures.
- **Names for things:**
  - **Coins:** the money you earn.
  - **Hearts ❤️:** how much customers love your shop (reputation).
  - **Sparkle ✨:** how dazzling your Dream Dollhouse and displays are (charm).

### 3.1 Age rules & privacy
Ages 11–12 are under 13, so the store versions count as a **mixed-audience** app that includes children:
- **US COPPA / Google Play Families policy:** no collecting personal data from under-13s without parental consent, no behavioral ads or third-party tracking SDKs.
- **Apple:** the Kids category is for ages 11 and under, so this probably *won't* go in it, but Apple's rules for apps that children use still apply.
- **Design rules this gives us:**
  - No ads, no analytics/tracking SDKs, no accounts in the web build.
  - Sharing starts as **Snapshot images and share codes**: no chat, no free text, no friend lists.
  - Any future online features (visiting friends' shops) use **preset reactions only** (hearts, stickers), never free chat, and get an age check / parental gate.
  - No loot boxes or random paid rewards.

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
| Offline | Installable PWA; works offline after the first visit (decision #50) |

## 5. The Shop Jobs

Each job is a short, playful interaction. Early on, you do them all. As the shop grows you can **hire helpers** for any job, but you can always jump in yourself, which is usually faster and comes with a little bonus.

### 5.1 Ordering stock
- Open the **order book**, a picture catalog of cute items, and tap what you'd like.
- **Pip the delivery bunny** 💡 brings the boxes the **next morning**. The **Lunchtime delivery** upgrade (#37) lets Pip come at midday too: orders placed in the morning or the first half of open hours arrive when the day bar reaches halfway. A mark at the halfway point of the day bar shows when, and glows while a lunch order is on its way (#52).
- The main choice is what to get with your coins. Fancier items cost more and earn more. Each card shows the box cost, the sell price per item, and the profit for the box (#54).
- **Catalog pages (v0.29, #66):** the order book has four tabbed pages (Starter, Favorites, Fancy Finds, Treasures), one item per theme on each. Pages open as your Collection grows (at 4, 10 and 16 items found); anything already found can always be reordered. 💡 Later pages could also come from story events.

### 5.2 Stocking shelves
- Tap a box to open it (*pop!*). Items hop out, and you tap or drag them onto shelves.
- Shelf types: little-things rack, doll display case, furniture shelf, dollhouse table.
- **Display bonus:** putting matching things together (a whole pink bedroom set) makes the shelf sparkle, and customers buy more. It's a nice reward that never punishes.

### 5.3 Ringing up customers
- A customer brings their treasures to the counter. Tap each item to scan it (*beep!*), then tap the register (*cha-ching!*). That's 2–4 taps.
- No making change.
- **The tedium fix:** hire a cashier helper any time (Mia, 🪙 150 once; #36). If you ring customers up yourself, you get **tips**, and sometimes a sweet moment (a kid hugging her new doll, a drawing pinned to your wall).

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
- **Unlocked with the first expansion (decided v0.7):** the starting shop is small, so the Dream Dollhouse arrives with a **Window Display room** built next to the shop, facing the street like a real shop window. Unlocking it is a milestone moment.
- **How you get it (v0.9):** the toolbar's **Grow 🔨** button opens a build sheet; the Window Display costs **🪙 100** and is built right of the shop. The Grow button glows once you can afford it, then becomes the **Dollhouse 🏠** button.
- A dollhouse with its own small grid of rooms (bedroom, living room, kitchen, nursery, pet room…), shown in the window and editable in a close-up **decorate mode**.
- It starts as a bare one-room house and grows: more rooms, roof styles, wallpaper, floors, twinkly lights.

### 6.2 The Collection
- Every item you **receive in a delivery** (or get as a story gift) is added to your **Collection**, a sticker-book style album.
- **v0 album (v0.9):** one page with every item as a sticker (found = in color, not yet = silhouette with "Order one to find it"), a "4 of 6 found" count, and a 🏠 badge on items in your dollhouse.
- **24 items (v0.29, #66):** the album has one section per theme with four stickers each and a "1 / 4" count (🌟 when complete). Page rewards came in v0.33 (#70).

  | Page (opens at) | Tea Time | Cozy Parlor | Fairy Garden | Sweet Dreams | Doll Friends | Little Houses |
  |---|---|---|---|---|---|---|
  | **Starter** (start) | Tiny Tea Set 6→10 | Cozy Chair 8→14 | Mushroom Lamp 8→14 | Star Nightlight 6→10 | Teddy Bear 7→12 | Tiny Birdhouse 6→10 |
  | **Favorites** (4 found) | Cupcake Stand 10→17 | Rocking Chair 11→19 | Fairy Swing 11→19 | Rosy Bed 10→18 | Petal Doll 12→20 | Cottage Dollhouse 24→40 |
  | **Fancy Finds** (10) | Tea Trolley 26→44 | Velvet Sofa 30→50 | Firefly Lantern 28→48 | Canopy Bed 34→58 | Bunny Family 32→54 | Treehouse 40→68 |
  | **Treasures** (16) | Royal Cake Tower 50→85 | Grand Piano 60→100 | Unicorn Carousel 65→110 | Cloud Princess Bed 70→120 | Porcelain Princess 55→95 | Castle Dollhouse 90→150 |

  (cost → sell price per item. Boxes hold 3 on the first two pages, 2 after that, except the Cottage Dollhouse at 2.)
- Anything in your Collection can be placed in the Dream Dollhouse **for free and forever**. It doesn't use up shop stock.
- Collection pages fill in by theme (Tea Time, Sweet Dreams Bedroom, Pet Friends, Princess Castle…). Completing a page gives a reward.
- **Growing to 100+ items (v0.23, #59):** prices scale up the way they do now (fancier = costs more, more profit). Many items come in **color variants**, each its own sticker. New **catalog pages open in the order book as you find more items**; the fanciest come last.
- **Collection bonus (#59, built in v0.33 #70):** each item found brings **+2%** more customers and each complete theme **+5%**, up to **+50%**, added to Sparkle's boost. **Completing a theme** also gives a **coin gift with confetti** (🪙 100 for the first, +50 for each after), a room style (#69), 🎀 5 (#68), and a **shopkeeper style**:

  | Theme | Shopkeeper style |
  |---|---|
  | Tea Time | Strawberry outfit colour |
  | Cozy Parlor | Plum Velvet outfit colour |
  | Fairy Garden | Flower Crown accessory |
  | Sweet Dreams | Starry Night outfit colour |
  | Doll Friends | Bunny Ears accessory |
  | Little Houses | Royal Crown accessory |
- Some **special treasures** only come from story events and can't be bought.
- That makes ordering new kinds of stock exciting twice: once for the shop, and once for your Collection.

### 6.3 Decorating
- Each dollhouse room has **fixed slots** (bed spot, table spot, wall spot, rug spot, shelf spot…). Tap a slot to pick an item from your Collection that fits it.
- **v0 (v0.9):** 4 rooms with one slot each. Every item has a kind; each room fits a few kinds:

  | Room | Fits | e.g. |
  |---|---|---|
  | Bedroom (upstairs left) | bed, friend, light | Rosy Bed, Petal Doll, Mushroom Lamp |
  | Playroom (upstairs right) | toy, friend, light | Cottage Dollhouse, Petal Doll |
  | Parlor (downstairs left) | seat, friend, light | Cozy Chair |
  | Tea Room (downstairs right) | table, seat, light | Tiny Tea Set, Cozy Chair |

  The starter items (tea set, chair) fit right away. One item can fill several rooms. Tapping the same item again (or "Empty") takes it out.
- Wallpaper, floors, and roof are chosen per room or for the whole house.
- 💡 A free placement grid can come later.

### 6.4 What it does
- **Sparkle ✨:** each placed item adds Sparkle based on how special it is. Matching sets and fully decorated rooms add bonus Sparkle.
  - **v0 numbers (v0.9):** tea set 3, chair 4, lamp 4, bed 5, doll 6, cottage 10; +5 when all 4 rooms are filled (max 30 today). Tunable in `js/data/items.js` and `js/data/dollhouse.js`.
  - **Foot traffic (v0.9):** visitors arrive up to 1.5× as often (at 30 Sparkle). With anything in the window, 25–70% of visitors (more with more Sparkle) stop beside the window first (to one side, so they don't block the view) with an "ooh!" bubble, and half of those then want an item from the dollhouse.
- Sparkle is the shop's main advertisement: more passersby, and they stop and peek in the window with little hearts and "ooh!" bubbles. Some come inside.
- Sparkle milestones unlock new things (catalog pages, story moments, decorations).
- **Decided v0.9:** a window-peeker sometimes points at something in the window ("I want that!" with its picture). If you have it in stock, that's an easy sale; if not, it becomes a wish note.

### 6.5 Sharing (future)
- **Phase 1 (no server):** a **Snapshot** button makes a pretty photo of your Dream Dollhouse to save or share.
- **Phase 2:** share a dollhouse as a code or link that friends can open in a view-only viewer.
- **Phase 3 (needs a backend):** visit friends' dollhouses and leave a heart or sticker. Preset reactions only (no chat), with an age check / parental gate (§3.1).
- For this age group, sharing is a big motivator. Snapshot is planned right after the MVP.

## 7. Shop Days

| Phase | What happens | Timer |
|---|---|---|
| **Morning** | Pip's deliveries arrive. Choose today's posters/balloons. Unpack and fill the shelves. | None |
| **Open** | Customers come and go. Fill shelves, ring up, enjoy. The sun moves across the sky. | ~3–5 min |
| **Evening** | Purple twilight; last customers wave goodbye; lamps glow softly. | 10 s of twilight; then shoppers pay for what they have or go home, and it closes once the last one has paid (#62) |
| **Close** | Day summary: coins, happy customers, wish notes, Sparkle. Story moments happen here. Then order for tomorrow, buy upgrades, and decorate, all with no timer. | None |

- **Close early (decided v0.8):** the day button (🕒 Close) closes the shop any time (two taps). When sold out, one tap and a "Sold out! 🎉" nudge. Closing early goes to evening, so the last customers still finish. **Close now (v0.26, #63):** in the evening the button closes right away (two taps); customers put back what they were holding and go home.
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
- **Building rooms (v0.28, #65; was theme rooms in v0.23, #58):** **Grow → Build a room**, then tap one of the glowing **＋ spots** on the building (each shows its price: further out, sideways or up, costs more, the same on every floor, and every room you build raises all prices by 🪙 50; #75). Plain shelf rooms with three shelves, restyled later in a decoration shop. *Old v0.23 text:* **Grow → Build a room → pick a theme**, then tap one of the glowing **＋ spots** on the building: either end of the ground floor, or upstairs next to the Stairwell or another upstairs room. Costs rise with each room (🪙 250, 400, 600, 850, 1150, 1500; tune with play). **Built (step 1):** theme rooms open once the Window Display is built; the theme bonus is **+25% of the price** (rounded up), shown as "theme bonus ✨" at the register; each theme room also makes room for 2 more customers at a time. Sorting Smarts costs 🪙 120 and shows up once Bea is hired and a theme room is built.
- **Upstairs (#58, #61, #64, #65):** the **Stairwell** (built once, 🪙 350, after your first room, always right next to the shop; then **Another floor** as many times as you like, each a bit pricier: 🪙 500, 700, 950, 1250, then +350, #75) is a room column with a spiral staircase in the back corner and one shelf beside it, on the ground floor and upstairs. Upstairs rooms open into each other through doorways; customers, helpers and your shopkeeper walk up the stairs and across. One upstairs floor for now.
- The outside (roof, colors, sign, awning, flower boxes) is customizable and visible when zoomed out.

### 9.5 Decorating rooms (v0.31, #68)
- **Ribbons 🎀** pay for room styles. They come from caring for customers and collecting: +1 per wish note granted (selling something a customer wished for), +1 when a window-peeker buys what they pointed at, +2 per new Collection item, +5 per complete theme, and +1 per 5 happy customers at closing (shown in the day summary).
- **Grow → 🎨 Decorate rooms** zooms to a room with a bottom panel. ◀ ▶ or a tap on another room switches rooms. Tabs: **Walls** (a colour and a pattern: plain, stripes, polka dots, gingham, stars, hearts), **Floor** (woods, checkers, tiles, carpet), **Rug**, **Curtains** (only rooms with a window) and **Corner** (the room's plant spot: plant, fern, flowers, lamp, bookcase, balloons…).
- Tap a style to see it on the room right away. Styles you own apply at once; others show their 🎀 price with a **Get it** button (or how many more you need). Leaving without buying puts the room back.
- **Buy once, use anywhere:** an owned style works in every room, free forever. The looks already in the game are free.
- **Just for looks:** styles don't change Sparkle, prices or customers.
- **Theme rewards (v0.32, #69):** completing a theme gives a matching style free (Tea Time → Gingham wallpaper, Cozy Parlor → Bookcase, Fairy Garden → Flower rug, Sweet Dreams → Stars wallpaper, Doll Friends → Hearts wallpaper, Little Houses → Pink checker floor), shown in the album under each theme.
- 💡 Later: matching sets, the outside of the building (roof, awning, sign), seasonal styles.

### 9.2 Room types
| Room | Purpose |
|---|---|
| **Shop room** | Shelves, the counter and customers. Sells anything. |
| **Shelf rooms (#65)** | Three shelves and a pastel wallpaper. Built at ＋ spots; the further from the middle (sideways or up), the pricier. Restyle any room with Ribbons 🎀 (§9.5, #68). (Replaced the six theme rooms of #58.) |
| **Stairwell (#58, #64, #65)** | Spiral staircase plus one shelf on each floor, right next to the shop. Grows a floor at a time. Needed for upstairs rooms. |
| **Front window** | Holds the Dream Dollhouse. Ground floor, facing the street. |
| **Counter** | Checkout. A second counter comes later for busy days. |
| **Stockroom** | Where boxes go; holds more stock. |
| **Workshop** | Build requested and fancy dollhouses (§5.6). |
| **Tea corner** 💡 | Customers sit, sip, and stay longer. |
| **Helpers' room** | Needed to hire more helpers. |

### 9.3 Getting around (portrait)
- Drag to move around; pinch to zoom out to the whole building or into one room.
- Characters go between ground-floor rooms along the sidewalk, and up the Stairwell (floor by floor) to upstairs rooms, through doorways between rooms on the same floor (#58, #65).
- Double-tap a room to zoom to it. A little room map at the bottom lets you jump around.
- The default view shows ~1–2 rooms; zooming out shows the whole building.

### 9.4 New locations
- Expanding the main building comes first.
- **Later ❓:** open a second shop somewhere new (a seaside town, a snowy village) with its own style. The first shop keeps running. Nothing is ever taken away.

## 10. Helpers

- Hire helpers for any job: **Stocker**, **Cashier**, **Orderer** (re-orders favorites), **Poster Hanger**.
- Helpers are named, cute characters; they work at a steady pace and can be upgraded.
- Hiring is about choosing what *you* want to do.
- **Helpers are one-time hires** (no wages), bought from the Grow sheet. First one (v0.12): **Mia the cashier** (#36). She works the register at a steady pace without tips; whenever your shopkeeper steps behind the counter, Mia steps aside so you can ring people up yourself.
- **Bea the stocker (v0.18, #51, #53):** a **one-time hire** (🪙 200). She works in the morning, during open hours and in the evening: picks up a box from the doorstep, walks it to the emptiest shelf with free space, and unpacks it, at a steady pace a bit slower than you. She uses the Stock Cart too. **Smart picks:** wished-for items first, then items that aren't on the shelves yet. **You can always jump in:** she never takes the box your shopkeeper is heading for, and when there's nothing to do she waits by the right wall. With Mia and Bea both hired, your shopkeeper is free for the bonus spots or decorating. **Planned (#60):** a **Sorting Smarts** upgrade so stockers put each box in its matching theme room (#58) when one has space, and later **more stockers** (each one costs more). 💡 Later: an **Orderer** helper who re-orders what sells (not decided; ordering may be too fun to hand over).
- **More helpers (v0.35, #72):** **Ollie the Greeter** (door), **Rosa the Window Dresser** (Window Display), up to **three stockers** (Bea, Theo, Juno), and **register rooms** above the shop, one per floor, each with a cashier (#73). Upgrades: **Speedy Scanner**, **Gift Wrap**, **Tall Shelves**.
- Your shopkeeper is always there and walks to whatever you tap.
- **Where she goes when helpers do the work (v0.14, #41):** she can walk out to the sidewalk and into other ground-floor rooms. Each room can give a bonus while she's in it. First ones: the **Window Display** (more window-peekers, and they want what they saw more often) and the **greeter spot** by the shop door (greeted customers often pick up a second item). Bonus spots are marked with a **glowing ring** on the ground; tap it to go there (#44). Future rooms get their own bonus (💡 Stockroom: unpack faster; Tea Corner: customers stay longer).
- **Customizable shopkeeper (decided):** hairstyle, hair color, skin tone, outfits, accessories (bows, glasses, aprons, hats). Set up in a quick character creator at the start, and changeable anytime. **v0.12 creator (#38):** hair style (bob, bun, pigtails, ponytail), hair color, skin tone, outfit color, accessory (none, bow, glasses, hat). Tap your shopkeeper in the morning to reopen it. A 🎲 button picks a random look (#42). **Boy or girl (v0.20, #43, #55):** the first row picks girl or boy; boys get short / spiky / curly / swoop hair and a bow tie or cap. Game text says "your shopkeeper", never "she".
- Outfits and accessories are earned through Collection pages, story moments, special days, and seasons. They're great rewards because they're about self-expression, not power.
- 💡 Matching **shop uniforms** for helpers that you design.

## 11. Economy & Progression

- Two currencies: **coins** (from sales) and **Ribbons 🎀** (from granted wishes, window wants, Collection finds and happy days; spent only on room styles, §9.5, #68). Two progress meters that are never spent: **Hearts ❤️** and **Sparkle ✨**.
- Costs scale gently; early on, something new should be affordable every day or so.
- You can't go broke. Unsold stock just waits on the shelf. If you ever spend everything with nothing left to sell, Pip brings a free box the next morning (#40).
- Goals: gentle milestone lists, Collection pages, regulars' stories, and room unlocks.
- **Upgrades (v0.12, #37)** are one-time buys in the Grow sheet: Lunchtime delivery (🪙 100), Stock cart (🪙 60, carry 2 boxes), Comfy shoes (🪙 80, walk faster). Costs to tune with feedback (`js/data/upgrades.js`).
- 💡 **Future upgrade ideas (user, 2026-10-09):** **Instant Delivery**: orders arrive right away instead of next morning or at lunch (a pricier upgrade, or maybe a per-order option). Not designed yet; on the roadmap (§17). (More stockers came in #72; Sorting Smarts was dropped in #65.)

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

Big buttons sit at the **bottom of the screen**: order book, posters, helpers, decorate, Collection. Today (v0.12): **Order**, **Album**, the **day button**, **Dollhouse** (once the Window Display is built), and **Grow** (rooms, helpers, upgrades; #35). The top shows coins, Hearts, Sparkle, and the day's progress bar. **No digital timers anywhere** (decision #34): time shows as the bar and the light, never as numbers.

## 13. Camera

- **Orthographic "diorama" camera (decided)**, straight-on with a slight (~9°) top-down tilt and no side angle. No perspective distortion, so rooms line up neatly as the building grows, and zoomed out it reads like a dollhouse.
- Gentle idle sway; lighting changes through the day.

## 14. Art Direction

- **Style:** low-poly 3D, chunky cartoony proportions, rounded shapes. It should look like a toy.
- **Palette:** pastels with pops of brightness: pink, lavender, mint, butter yellow, sky blue, cream, and warm wood.
- **Shading:** toon shading (`MeshToonMaterial`, stepped gradient), soft colored shadows. **No outlines** (decided).
- **Lighting:** warm sunlight through the windows during the day. Evening shifts to **purple twilight** (lavender/indigo sky, cool lilac light) with soft pink-white lamps and fairy lights, not orange or golden.
- **Juice:** sparkles, floating hearts, bouncy squash-and-stretch, confetti for milestones.
- **Characters:** round bodies, big heads and eyes, rosy cheeks, few polys, lots of outfit/hair color variety.
- **Products:** tiny furniture, teacups, dolls with great outfits, pets, dollhouses (each its own little house!), in recognizable aesthetic sets (cottagecore, kawaii, fairy garden, Y2K, princess, cozy café) plus a sprinkle of fantasy (unicorn lamp, mushroom house, castle dollhouse).
- **UI:** round, chunky, candy-colored buttons; big icons; friendly rounded font.
- **Assets:** placeholder geometry in code → CC0 low-poly packs (Kenney, Quaternius) → custom Blender glTF later.
- **Asset reuse:** each product has one model, used on shelves, in customers' hands, in the Collection, and in the Dream Dollhouse.

## 15. Audio

- **Sound effects (built in M8, decision #46):** synthesized in code with Web Audio, so there are no sound files to download. Pop (taps, boxes, items landing), beep (scanning), cha-ching (a sale), door bell (a customer walks in), sparkle chimes (stocking, the dollhouse, window-peekers), a fanfare with confetti, and short jingles for opening, evening, and a new morning. Sounds start on your first tap (phones require it).
- **Haptics (#47):** short vibrations on a sale, stocking, and confetti moments where the phone supports it.
- **Mute toggle** (🔊 in the HUD, saved) turns off sounds and vibration.
- **Later:** a cheerful music-box / ukulele loop that changes with the time of day, with its own toggle.

## 16. Monetization (future store builds)

❓ Undecided and out of scope for the web build. Options that fit the audience and the age rules (§3.1):
- **Paid up-front, no ads, no IAP:** simplest and the most parent-friendly.
- **Free to try + one-time unlock** of the full game: lets players try before a parent pays.
- **Cosmetic packs** (outfits, decor themes) sold directly with no randomness, behind platform parental controls.

Never: ads, loot boxes, energy timers, or pay-to-skip.

## 17. Roadmap

### MVP: first playable on GitHub Pages
Goal: prove that the shop jobs, the day rhythm, and the Dream Dollhouse feel good together.

- [x] One-room shop (dollhouse cutaway), portrait, fixed camera
- [x] Shopkeeper who walks to what you tap
- [x] **Day cycle:** morning → open → evening → close summary
- [x] **Ordering:** order book with ~6 items; boxes arrive next morning
- [x] **Stocking:** carry boxes from the doorstep, place items on 2 shelves
- [x] **Checkout:** scan + ring up, with tips
- [x] **Collection:** items unlock when first received; sticker album
- [x] **First expansion → Window Display room with Dream Dollhouse v0:** 4 rooms with one slot each; Sparkle increases visitors
- [x] Customers browse, buy, and leave wish notes
- [x] Hire one cashier helper
- [x] **Bea the stocker** helper (#53)
- [x] Simple shopkeeper creator (a few hairstyles, colors, outfits), girl or boy (#55)
- [x] Coins, a few upgrades, local save
- [x] Toon-shaded low-poly placeholder art in the pastel palette
- [x] Playable on a phone browser
- [x] **Polish pass:** juice, sound effects, haptics, bouncy UI, end-of-day celebration, installable offline PWA (#45-50)
- [x] **First-day guide** arrows and the morning Open-shop nudge (#57)

### Next
- [x] **Theme rooms on the ground floor** with ＋ spots and a theme bonus (#58, step 1)
- [x] ~~**Sorting Smarts** upgrade: stockers use the matching theme room (#60)~~ (removed with theme rooms, #65)
- [x] **Plain shelf rooms, more floors, prices by distance** (#65)
- [x] **Stairwell and upstairs rooms** (#58, step 2, #61)
- [ ] More than one stocker (#60, later)
- [x] **24 items on four catalog pages that open as you collect** (#66, first step of #59)
- [x] **Collection bonus and theme rewards: coins, shopkeeper styles** (#70, part of #59)
- [x] **More helpers and upgrades** (#72): greeter, window dresser, Speedy Scanner, Gift Wrap; Tall Shelves; more stockers
- [x] **Delivery bin** (#74)
- [x] **Register rooms**, one per floor above the shop, each with a cashier (#73)
- [ ] **Instant Delivery** upgrade: orders arrive right away (§11; design to discuss)
- [ ] **Color variants and more items toward 100+** (#59)
- [x] **Decoration shop with Ribbons 🎀:** style every room's walls, floor, rug, curtains and corner (#68)
- Building grid expansion (X and Y), room types, pan/zoom
- More morning picks and special days
- First regulars and story moments
- More items, Collection pages, decorations
- **Snapshot sharing** (high priority for this audience)
- More Dream Dollhouse rooms
- More shopkeeper outfits and accessories
- Offline earnings; background music (sound effects are done, #46)

### Later
- Workshop and requests
- Seasons
- Share codes / friends' dollhouses (preset reactions only, age-gated)
- Second location
- Capacitor builds for iOS / Android

## 18. Open Questions

1. Monetization model for the store builds (§16), which can wait until then.
2. **Early economy is too tight** (playtest, Day 1): with 50 coins and 18 shelf slots you can sell out in the first minute of a 3-minute day. Options for the upgrades milestone: bigger or extra shelves, a lunchtime delivery, more starting coins or stock, cheaper bulk boxes, slower browsing. **Resolved in v0.12 (decision #39):** no change. Close early covers it, and the user says early progress feels good.
3. ~~**Evening is too long**~~ (playtest after M6, 2026-10-09). **Resolved in v0.10 (decision #33):** 5 s of twilight, then the day closes once the shop is empty. The user tried it and approved it.
4. ~~**Order book shows only the cost**~~ (user, 2026-10-09). **Resolved in v0.19 (decision #54):** cards show the sell price per item and the profit per box.
5. **Changing prices with demand?** (user, 2026-10-09): could prices go up when lots of customers want something? This pulls against **fixed prices** (#14, §5.5), which keep the game from feeling like a spreadsheet. 💡 Ways to reward demand without setting prices: wished-for items earn a bonus tip when they're back on the shelf, a "Popular! ⭐" tag on items that sell out a lot (customers pay a little extra), or the Sparkle Sale / special days (§5.4). Not decided.
6. **Heart and Sparkle milestones** (user, 2026-10-09): special things could unlock at Heart milestones (from happy customers) or Sparkle milestones (from the Dream Dollhouse), alongside the Collection unlocks (#59). Ideas: rare items, decorations, story moments, shopkeeper styles. Not designed yet.
7. ~~**Evening ends too slowly with a big building**~~ (user, 2026-10-09): closing waited for every customer to walk off-screen, and the last ones could wander from room to room. **Resolved in v0.25 (decision #62):** after 10 s of twilight shoppers pay for what they have or go home, and the day closes once they've paid.
8. ~~**Rethink the building**~~ (user, 2026-10-09). **Resolved in v0.27-v0.28 (decisions #64, #65):** the Stairwell always goes right of the shop, rooms are plain shelf rooms, floors keep going up (each staircase pricier), and rooms cost more the further they are from the middle, sideways or up. Prices are first guesses to tune with play. A **decoration shop** (its own currency, styles each room) is next to design.
9. ~~**Decoration shop**~~ (user, 2026-10-09). **Resolved in v0.31-v0.32 (#68, #69):** Ribbons 🎀 (wishes granted, window wants, Collection finds, happy days); walls, floor, rug, curtains and corner per room; buy once, use anywhere; just for looks; completing a theme gives a style. Rates and prices approved for now; rebalance if playtests show problems.
10. **Sparkle tops out fast with fancy items** (2026-10-09, #66): visitor traffic is already at its 1.5× cap at 30 Sparkle, and one Treasure (e.g. the Castle Dollhouse, 35) gets there alone. Rethink the Sparkle curve (higher cap, or more Sparkle needed) when tuning the new items.
11. ~~**Seeing your stock**~~ (tester, 2026-10-09). **Resolved in v0.34 (#71):** stock counts on the order book cards. a tester wants to see all their inventory: they try to stock evenly and make sure they have everything, and it's hard to tell what's on the shelves. Idea (user): the order book shows how many of each item you already have when buying. Not designed yet.
12. ~~**More helpers and upgrades**~~ (user, 2026-10-09). **Resolved in v0.35 (#72).**
13. **Room prices make a pyramid, not a square** (user, 2026-10-09): with prices by ring around the middle plus +15% per floor (#65), building wide on the ground floor stays cheaper than going up, so shops naturally grow into a pyramid instead of the squarish house #65 meant to encourage. ✅ **Resolved (#75):** prices by ring only, the same on every floor, +🪙 50 per shelf room built; cheaper staircases.
14. **Pinch out further on a big house** (user, 2026-10-09): the furthest you can zoom out by pinching should grow with the house, so a big shop fits on screen. ✅ **Done (2026-10-09):** past the usual limit, pinching out keeps going until the whole house fits, drifting to its middle (`limits.fit` in `js/render/camera.js`).
