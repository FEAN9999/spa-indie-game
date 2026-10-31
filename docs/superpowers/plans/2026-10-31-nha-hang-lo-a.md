# Nhà hàng lô A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A restaurant beside the main spa on one 74-column street: an old house with a SANG NHƯỢNG sign that can be bought from day 10, then a restaurant with its own grid, diners who walk in or walk over from the spa, the owner biking between the two doors to take order tickets and cook Phở in a mini-game, restaurant furniture in Build mode, a "Nhà hàng" line on the day summary, and a new save version.

**Architecture:**
- The restaurant is its own sim, `RestaurantSim` (`src/sim/restaurant.ts`), on its own 37-column grid built with the spa's helpers (`widen`, `withHouses`, `towerOf`, `buildGrid`, `placeProblem`, `findPath`). It reads the main shop's purse, clock, day and power cut through the main `SpaSim` itself (a structural `RestaurantHost`), and draws from its own rng stream, so `tests/sim/same-draws.test.ts` keeps its fixtures.
- A small `Street` (`src/sim/street.ts`) owns where the owner is: in the spa, in the restaurant, walking out of one, or riding a timed street leg to the other. `Chain` holds `street: Street | null` (null until bought) and wires the purchase, the day, the branch trips and the save. `SpaSim` only gets a few small hooks; it does not learn about diners.
- The view draws the restaurant offset 37 tiles to the right of the spa grid through a `RestaurantLayer`; `SpaScene` routes taps by world x, follows the bike, widens the camera and the strip, and opens a new `PhoScene`. Panels (Build, Dịch vụ, Nhân viên, floor pill) act on the shop under the screen centre.

**Tech Stack:** Phaser 4.2.1, TypeScript, Vite 8, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-nha-hang-design.md` (lô A only: §4.1, 4.2, 4.4–4.8b, 4.10–4.12 for Phở, 4.15, 4.16, 4.17, §8, §9 lô A, §10). Phở rules come from the playtest sketch (artifact `VvbbLdEZY3eEHi7GjEkip5`) and the room from the sketch artifact `VMJsanDs8AacyggDiwv1Mb`; the values below are copied from both, so the executor does not need to open them.

## Global Constraints

- **Not in lô A:** Bánh xèo, Chè, cooks, ingredient stock, lessons (demo hand), restaurant houses, floors and rooftop. In lô A ingredients never run out, only the owner cooks, and while the owner is at a branch the restaurant gets no new diners.
- **Fixed decisions (do not reopen):** two separate 37-column grids, the restaurant drawn 37 tiles to the right, each with its own door; the walk between doors is a timed street leg; restaurant logic lives in its own sim class, not in branches through `SpaSim`; its own rng stream; a spa save without a restaurant loads and plays exactly as today; the game pauses while any mini-game scene is open; branches never get a restaurant.
- **Numbers (`src/config.ts`, new block):**
  - `RESTAURANT_DAY = 10`, `RESTAURANT_PRICE = 5_000_000`, `RESTAURANT_X0 = SHOP_COLS` (37: the world column where the restaurant grid's column 0 is drawn);
  - `DISH_PRICE = { pho: 60_000 }`, `DINER_TIP = [0, 5_000, 10_000, 20_000]` indexed by stars (0 for a walk-out);
  - `WALK_OVER_CHANCE = 1 / 3`, `WALK_OVER_TILES = SHOP_COLS` (a walker's leg takes `WALK_OVER_TILES / KINDS[kind].speed * 1000` ms, 7_400 ms at speed 5);
  - `DINER_GAP_MIN = 45` (game minutes between walk-ins on average), `DINER_PEAK_FACTOR = 2.5`, `DINER_PEAKS = [[660, 780], [1020, 1200]]` (11–13 h and 17–20 h, in clock minutes);
  - `EAT_MS = 8_000`, `RIDE_MS = 3_000`;
  - furniture: `stove` 400_000, `diningTable` 150_000, `diningChair` 60_000;
  - Phở (game pixels are the sketch's ×3): `PHO_LIMIT_MS = 25_000`, `PHO_CUT_X = [345, 480, 615, 750]`, `PHO_CUT_TOL = 36`, `PHO_CUT_MIN_SPAN = 270`, `PHO_BOIL_MS = 2_400`, `PHO_BAND = { tai: [0.42, 0.6], chin: [0.62, 0.8] }`, `PHO_BAND_HARD_SHRINK = 0.05` (each edge moves in by it for a hard customer), `PHO_BOIL_NEAR = 0.08`, `PHO_GOOD_CUTS = 3`.
- **Restaurant rng:** `createRng(seed + RESTAURANT_RNG_SALT)` with `RESTAURANT_RNG_SALT = 101` in `src/sim/chain.ts`. Branches use `seed + 1 + index` (at most `seed + 3`), so the streams never meet. Nothing in `SpaSim` draws differently.
- **Save:** `RESTAURANT_SAVE_VERSION` is one named constant in `src/sim/save.ts` and `SAVE_VERSION = RESTAURANT_SAVE_VERSION`. It is **origin/master's SAVE_VERSION + 1 at merge time**: 36 while origin/master is at 35. Task 14 re-checks it before merging. Tests name the constant, never the number, except the one `'is version …'` case.
- **Copy (exact, Vietnamese):** sign "SANG NHƯỢNG"; before day 10 the toast "Mở bán từ ngày 10"; buy card kicker "Nhà hàng", title "Mua căn nhà cũ làm nhà hàng", lines "Có sẵn 2 bếp, 2 bàn, 8 ghế." and "Bán Phở bò ngay hôm nay.", buttons "Mua · {money}" (existing `houseBuy`) and "Để sau" (existing `floorLater`), short of money "Còn thiếu {money}" (existing `floorShort`); shop label "Spa" / "Nhà hàng"; summary heading "Nhà hàng" with rows "Khách ăn", "Tiền món", "Tiền boa"; toasts "Hết bếp trống" (no free stove), "Cô chủ đang bận tay" (owner busy, tap on the other shop), "Nhà hàng chưa mở tầng trên"; build problems "Món này không kê ở đây được" and "Nhà hàng cần ít nhất một bếp, một bàn và một ghế"; item names "Bếp nấu", "Bàn ăn", "Ghế ăn", "Quầy chia món", "Kệ nguyên liệu", "Chậu rửa", "Quầy thu ngân"; Phở copy in Task 11.
- **Files are CRLF.** Edit with the Edit tool, or with Python using `newline=''` and `encoding='utf-8'`.
- **Commits:** one plain descriptive sentence each, present tense, no `feat:` prefix, no attribution lines.
- **Commands:** `npx vitest run <file>` for one file, `npm test` for all, `npx tsc --noEmit` for types, `npm run build` (= `tsc --noEmit && vite build`).
- **Worktree:** work only in `D:\Project\spa-indie-game\.superpowers\worktrees\nha-hang` (branch `nha-hang`). Its `node_modules` is a junction to the main repo's: never `rm -rf` it (unlink with `rmdir`). Other sessions commit and push in the main folder; never touch it or another worktree.

## Review Focus

1. **The owner goes to a branch while busy in the restaurant.** A carried dish is not lost: that diner eats and pays as usual. Ticket holders and diners waiting for food leave quietly, uncounted. Nothing is stuck when the owner comes back. Test: Task 6 `'leaves the restaurant tidy when the owner goes to a branch mid-carry'`.
2. **Save and reload mid-ride or at the restaurant.** A riding owner comes back at the spa door; an owner in the restaurant comes back there with the spa still "next door"; walkers on the street are dropped and not counted as walk-outs. Tests: Task 7 `'reloads a riding owner at the spa door and drops the walkers'` and `'reloads an owner standing in the restaurant there'`.
3. **The spa's day ends while diners are still eating.** The summary waits until the last diner has paid and left, then the day ends once. Test: Task 6 `'keeps the day open until the last diner has paid'`.
4. **Changing your mind during a trip.** A tap on the shop the owner is walking out of cancels the trip and acts there; a tap while riding replaces the tap to act on at arrival; a tap on the other shop while the owner is busy (serving, cooking, carrying) only toasts. Tests: Task 6 `'cancels the trip when the spa is tapped while walking out'`, `'acts on the last tap made while riding'`, `'refuses to leave mid-carry'`.
5. **Building in the restaurant while it is busy.** A stove being cooked at, a table or chair with a diner, and the last stove, table or chair cannot be moved or sold. Tests: Task 5 `'refuses to move a stove being cooked at or a chair with a diner'` and Task 3 `'refuses to sell the last stove, table or chair'`.

---

## File Structure

**Create**
- `src/sim/pho.ts`: Phở rules: the ticket, the band, the star rule and `PhoGame` (pure, no Phaser).
- `src/sim/dining.ts`: the restaurant's start room (shell rows and start items), `ShopSide`, `placeableIn`, `diningSeats`.
- `src/sim/restaurant.ts`: `RestaurantSim`: room and build ops, diners, the owner's order → cook → carry flow, stats, save.
- `src/sim/street.ts`: `Street`: where the owner is between the two shops, the ride, tap routing.
- `src/art/dining.ts`: pictures of the seven restaurant pieces (with turned pictures), spread into `FURNITURE`.
- `src/art/restaurant.ts`: the restaurant room texture, the old house with its sign, the closed lot fronts, the closed upper floors, the bike.
- `src/art/phoArt.ts`: the Phở card parts: board with dotted lines, beef, bowl, pot, needle dial, toppings, ticket.
- `src/view/street.ts`: pure view maths: street bounds, which shop is under an x, restaurant tile↔world, strip blocks and doors, bike and walker x.
- `src/view/RestaurantLayer.ts`: draws the restaurant block and everyone in it.
- `src/scenes/PhoScene.ts`: the Phở mini-game scene.
- Tests: `tests/sim/dining.test.ts`, `tests/sim/pho.test.ts`, `tests/sim/restaurant.test.ts`, `tests/sim/street.test.ts`, `tests/view/street.test.ts`, `tests/art/restaurant.test.ts`, `tests/art/phoArt.test.ts`.

**Modify**
- `src/config.ts` (new block), `src/sim/items.ts`, `src/sim/grid.ts`, `src/sim/build.ts`, `src/sim/spa.ts` (small hooks), `src/sim/chain.ts`, `src/sim/save.ts`, `src/strings/vi.ts`, `src/art/furniture.ts`, `src/scenes/BootScene.ts`, `src/main.ts`, `src/view/catalog.ts`, `src/view/camera.ts` (nothing removed), `src/view/PositionStrip.ts`, `src/view/RoomView.ts` (night overlay width, `colX`), `src/view/Hud.ts`, `src/view/summary.ts`, `src/scenes/SpaScene.ts`, `src/scenes/BuildScene.ts`, `src/scenes/SummaryScene.ts`, `tests/sim/helpers.ts`, `tests/sim/save.test.ts`, `tests/view/catalog.test.ts`, `tests/view/summary.test.ts`, `tests/view/strip.test.ts`.

---

### Task 1: Restaurant furniture: kinds, grid rules, shop filter, pictures

**Files:**
- Modify: `src/sim/items.ts` (`ItemKind`, `ItemGroup`, `ItemSpec`, `ITEMS`, `workTile`), `src/sim/grid.ts` (`buildGrid`), `src/sim/build.ts` (`BuildProblem`, `PROBLEM_TEXT`), `src/sim/spa.ts` (`canPlace`), `src/view/catalog.ts`, `src/strings/vi.ts`, `src/art/furniture.ts`
- Create: `src/sim/dining.ts` (`ShopSide`, `placeableIn` and `DINING_SHELL` in this task), `src/art/dining.ts`
- Test: `tests/sim/dining.test.ts`, `tests/view/catalog.test.ts`, `tests/art/furniture.test.ts` (no change expected: it must pass with the new kinds)

**Interfaces:**
- Produces in `items.ts`: kinds `'stove' | 'diningTable' | 'diningChair' | 'servingCounter' | 'ingredientShelf' | 'sink' | 'cashierCounter'`; `ItemGroup` gains `'dining'`; `ItemSpec` gains `shop?: 'restaurant'`.

  | kind | w×h | price | beauty | group | shop | name key |
  |---|---|---|---|---|---|---|
  | stove | 2×1 | 400_000 | 0 | dining | restaurant | `itemStove` "Bếp nấu" |
  | diningTable | 2×1 | 150_000 | 0 | dining | restaurant | `itemDiningTable` "Bàn ăn" |
  | diningChair | 1×1 | 60_000 | 0 | dining | restaurant | `itemDiningChair` "Ghế ăn" |
  | servingCounter | 5×1 | 250_000 | 1 | decor | restaurant | `itemServingCounter` "Quầy chia món" |
  | ingredientShelf | 1×1 | 120_000 | 1 | decor | restaurant | `itemIngredientShelf` "Kệ nguyên liệu" |
  | sink | 2×1 | 150_000 | 1 | decor | restaurant | `itemSink` "Chậu rửa" |
  | cashierCounter | 3×1 | 200_000 | 2 | decor | restaurant | `itemCashierCounter` "Quầy thu ngân" |

- Produces: `workTile(item)` is non-null for a stove: unturned `{ x: item.flip ? item.x + 1 : item.x, y: item.y + 1 }` (the cook stands in front, under the burner the picture draws on that side), turned `{ x: item.flip ? item.x - 1 : item.x + 1, y: item.y }`. Beds unchanged.
- Produces: `buildGrid`: a stove sets its footprint to `'decor'`, its work tile to `'work'` and pushes it to `grid.works`; a dining chair sets `'seat'` and pushes its tile to `grid.seats`; tables and the decor pieces set `'decor'`. Because the work tile goes through `claimed` and `grid.works`, `placeProblem` already keeps it free and reachable; the `seatFloor` rule stays for group `'seat'` only (dining chairs may stand on any floor).
- Produces in `dining.ts`: `DINING_SHELL: string[]`, the restaurant's bare 13-column room, 18 rows: rows 0–1 `'#############'`; rows 2–16 `'#...........#'` except rows 7–9 `'#..........U#'` (stairs at 13-column x = 11, like the spa); row 17 `'######D######'`. Widened with `widen()` the door is at `(18, 17)` and the stairs at x = 23, foot `(23, 10)`.
- Produces in `dining.ts`: `export type ShopSide = 'spa' | 'restaurant'` and `export function placeableIn(kind: ItemKind, shop: ShopSide): boolean`: spa-only = group `'bed'`, group `'seat'` or `desk`; restaurant-only = `ITEMS[kind].shop === 'restaurant'`; everything else is shared (plants, lamps, pictures, rugs, wall pieces, set pieces).
- Produces in `build.ts`: `BuildProblem` gains `'wrongShop'` (`problemWrongShop` "Món này không kê ở đây được") and `'lastDining'` (`problemLastDining` "Nhà hàng cần ít nhất một bếp, một bàn và một ghế").
- Produces: `SpaSim.canPlace` returns `'wrongShop'` for a kind with `!placeableIn(kind, 'spa')`, before anything else.
- Produces in `catalog.ts`: `catalogPage(group, page, open, gifts, filter = 'all', shop: ShopSide = 'spa')`: only kinds with `placeableIn(k, shop)`; gifts likewise filtered.
- Produces in `src/art/dining.ts`: `DINING_FURNITURE: Record<…7 kinds…, FurnitureSpec>` with a `-turned` picture for each kind `canTurn` accepts (`stove`, `diningTable`, `servingCounter`, `sink`, `cashierCounter`), spread into `FURNITURE` the way `NEW_DECOR` is.

- [ ] **Step 1: Write the failing tests.** In `tests/sim/dining.test.ts`:
  - `'gives a stove a work tile in front of it, either way round'`: `workTile({ id: 1, kind: 'stove', x: 15, y: 2, flip: false })` is `{ x: 15, y: 3 }`; with `flip: true` it is `{ x: 16, y: 3 }`; with `turned: true, flip: false` it is `{ x: 16, y: 2 }`.
  - `'makes a stove a work spot and a dining chair a seat on the grid'`: `grid = buildGrid(widen(DINING_SHELL), [stove at (15,2), chair at (14,7), table at (14,8)])`: `grid.works` contains `{ x: 15, y: 3 }`, `grid.cells[3][15]` is `'work'`, `grid.cells[2][15]` and `grid.cells[2][16]` are `'decor'`, `grid.seats` contains `{ x: 14, y: 7 }`, `grid.cells[8][14]` is `'decor'`.
  - `'keeps spa pieces in the spa, restaurant pieces in the restaurant, and shares the rest'`: `placeableIn('bed', 'restaurant')`, `placeableIn('bench', 'restaurant')`, `placeableIn('desk', 'restaurant')` are false; `placeableIn('stove', 'spa')`, `placeableIn('servingCounter', 'spa')` are false; `placeableIn('plant', 'restaurant')` and `placeableIn('plant', 'spa')` are true; every kind is placeable in at least one shop.
  - `'refuses a restaurant piece in the spa'`: `starShop(3, 10_000_000).canPlace('stove', 14, 4, false)` is `'wrongShop'`.
  In `tests/view/catalog.test.ts`:
  - change `'offers every kind but the gifts exactly once'` to collect over both shops: every non-gift kind appears exactly once across `('spa', groups bed/seat/decor)` and `('restaurant', groups dining/decor)`, except shared decor, which appears once per shop.
  - `'shows no restaurant piece on the spa decor tab'`: every entry of `catalogPage('decor', p, ALL_SERVICES, [])` over all pages has `placeableIn(kind, 'spa')`.

- [ ] **Step 2: Run and confirm they fail.** Run: `npx vitest run tests/sim/dining.test.ts tests/view/catalog.test.ts`. Expected: FAIL (`'stove'` is not an `ItemKind`, `placeableIn` not exported).

- [ ] **Step 3: Implement** the interfaces above. Add the seven name keys and the two problem keys to `vi.ts`. Draw the pictures in `src/art/dining.ts` in the style of `src/art/furniture.ts` (ink outline, palette colours; stove: steel top with two burners on the work side; table: wood top; chair: small stool-backed chair; counter, shelf with jars, sink with tap, cashier counter with a till). Each picture is as wide as its footprint and its turned picture as wide as its turned footprint, which `tests/art/furniture.test.ts` checks.

- [ ] **Step 4: Run whole suite + tsc.** Run: `npm test` then `npx tsc --noEmit`. Expected: all pass, including `tests/art/furniture.test.ts` and `tests/sim/same-draws.test.ts`.

- [ ] **Step 5: Commit.** Message: "Add the restaurant's furniture: stove with a work spot, dining table, dining chair as a seat, and four decor pieces, kept out of the spa's catalog and its Build mode".

---

### Task 2: Phở rules

**Files:**
- Create: `src/sim/pho.ts`
- Modify: `src/config.ts` (Phở constants from Global Constraints)
- Test: `tests/sim/pho.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Doneness = 'tai' | 'chin'
  export interface PhoTicket { doneness: Doneness; onion: 'little' | 'lots'; chili: boolean; extraHerb: boolean }
  export type Topping = 'onion' | 'chili' | 'herb'
  export type BoilResult = 'in' | 'near' | 'far'
  export function drawPhoTicket(rng: Rng, hard: boolean): PhoTicket
  export function boilBand(t: PhoTicket, hard: boolean): [number, number]
  export function ticketMatches(t: PhoTicket, counts: Record<Topping, number>): boolean
  export function phoStars(r: { goodCuts: number; boil: BoilResult; ticketOk: boolean }): Stars
  export class PhoGame {
    phase: 'cut' | 'boil' | 'top' | 'done'
    elapsedMs: number
    readonly limitMs: number            // PHO_LIMIT_MS
    readonly ticket: PhoTicket
    readonly hard: boolean
    needle: number                      // 0..1 while boiling
    cutsDone: boolean[]                 // one per PHO_CUT_X line
    goodCuts: number
    boil: BoilResult | null
    counts: Record<Topping, number>
    constructor(ticket: PhoTicket, hard?: boolean)
    cut(meanX: number, spanY: number): 'good' | 'off' | 'short' | null
    hold(ms: number): void
    release(): BoilResult | null
    add(t: Topping): void
    serve(): void
    tick(ms: number): void
    progress(): number                  // 0..1 for the bar: cuts 0–0.4, boil 0.4–0.7, top 0.7–1
    stars(): Stars | null               // null until phase 'done'
  }
  ```
- `drawPhoTicket` makes exactly three rng draws in this order: doneness (`< 0.5` → `'tai'`), onion (`< 0.5` → `'little'`), chili (`< 0.5` → true); `extraHerb = hard` (the picky or hard customer's extra line, §4.12).
- `boilBand`: `PHO_BAND[doneness]`, each edge moved inward by `PHO_BAND_HARD_SHRINK` when hard.
- `ticketMatches`: onion `little` → exactly 1, `lots` → at least 2; chili → at least 1 when wanted, 0 when not; herb at least 1, at least 2 with `extraHerb`.
- `phoStars`: `1 + (goodCuts >= PHO_GOOD_CUTS ? 1 : 0) + (boil === 'in' ? 1 : 0) - (boil === 'far' ? 1 : 0) - (ticketOk ? 0 : 1)`, clamped to 1..3.
- `cut`: only in phase `'cut'`, else null. `spanY < PHO_CUT_MIN_SPAN` → `'short'` and nothing is used up. Otherwise it uses up the nearest undone line (the lower index on a tie); `|meanX − line| <= PHO_CUT_TOL` → `'good'` (counts in `goodCuts`), else `'off'`. After the fourth line, phase `'boil'`.
- `hold(ms)`: in phase `'boil'`, `needle += ms / PHO_BOIL_MS`; at 1 it auto-releases. `release()`: judges the needle against `boilBand`: inside → `'in'`; less than `PHO_BOIL_NEAR` outside either edge → `'near'`; else `'far'`; phase `'top'`. Null outside phase `'boil'` or before any hold.
- `add` counts a topping in phase `'top'`; `serve()` ends the game (phase `'done'`) from `'top'`.
- `tick(ms)`: adds to `elapsedMs`; at `limitMs` the game ends as it stands: undone lines are not good, a boil never released is judged by `release()` if the needle moved, else `'far'`, and toppings are judged as they are.

- [ ] **Step 1: Write the failing tests** in `tests/sim/pho.test.ts` (use a `ticket()` helper building a `PhoTicket` literal):
  - `'draws a ticket from three rolls and adds the extra herb line for a hard customer'`: with an rng returning `0.1, 0.9, 0.1` the ticket is `{ doneness: 'tai', onion: 'lots', chili: true, extraHerb: false }`; with `hard: true`, `extraHerb` is true and still exactly three values are taken (count calls).
  - `'sets the band low for tái, high for chín, and narrower for a hard customer'`: `boilBand(tai, false)` is `[0.42, 0.6]`; `boilBand(chin, false)` is `[0.62, 0.8]`; `boilBand(tai, true)` is `[0.47, 0.55]` (`toBeCloseTo`).
  - `'judges a swipe by its nearest undone line'`: `cut(480, 100)` is `'short'` and `cutsDone` all false; `cut(480 + 30, 300)` is `'good'` and line 1 is done; another `cut(480, 300)` is `'off'` and uses up line 0 (345 and 615 are both 135 away; the lower index wins); after four cuts `phase` is `'boil'`.
  - `'judges the boil against the ticket's band'`: chín ticket, `hold(PHO_BOIL_MS * 0.7)` then `release()` is `'in'`; a new game with `hold(PHO_BOIL_MS * 0.57)` is `'near'`; `hold(PHO_BOIL_MS * 0.3)` is `'far'`; `hold(PHO_BOIL_MS * 2)` auto-releases at 1 and `boil` is `'far'`, phase `'top'`.
  - `'matches the toppings to the ticket'`: little onion, no chili: `{ onion: 1, chili: 0, herb: 1 }` true, `{ onion: 2, … }` false, `{ …, chili: 1 }` false, `{ …, herb: 0 }` false; lots of onion with chili `{ onion: 3, chili: 1, herb: 1 }` true; extra herb needs `herb: 2`.
  - `'scores one star to start, one for three good cuts, one in the band, minus one far and one for a wrong ticket'`: `phoStars({ goodCuts: 4, boil: 'in', ticketOk: true })` = 3; `{ 3, 'near', true }` = 2; `{ 2, 'in', true }` = 2; `{ 4, 'far', true }` = 1; `{ 4, 'in', false }` = 2; `{ 0, 'far', false }` = 1 (never below 1).
  - `'plays a whole bowl to three stars'`: four good cuts, a chín hold of 0.7, the ticket's toppings, `serve()`: `stars()` is 3.
  - `'ends at the time limit with what is done'`: two good cuts then `tick(PHO_LIMIT_MS)`: `phase` is `'done'`, `boil` is `'far'`, `stars()` is 1.

- [ ] **Step 2: Run and confirm they fail.** Run: `npx vitest run tests/sim/pho.test.ts`. Expected: FAIL, module `../../src/sim/pho` not found.

- [ ] **Step 3: Implement** `src/sim/pho.ts` and the config constants. Follow `src/sim/shampoo.ts` for the class shape (phase, `elapsedMs`, `tick`, `progress`, `stars`).

- [ ] **Step 4: Run whole suite + tsc.** Run: `npm test`, `npx tsc --noEmit`. Expected: all pass.

- [ ] **Step 5: Commit.** Message: "Add the Phở rules: a ticket of doneness, onion and chili with an extra herb line for picky customers, four cuts on dotted lines, a held boil judged against the ticket's band, toppings matched to the ticket, and stars from all three".

---

### Task 3: The restaurant's room and its build rules

**Files:**
- Modify: `src/sim/dining.ts` (room), `src/config.ts` (restaurant numbers from Global Constraints)
- Create: `src/sim/restaurant.ts` (the class with room and build ops only)
- Modify: `tests/sim/helpers.ts`
- Test: `tests/sim/restaurant.test.ts`

**Interfaces:**
- Consumes: Task 1's kinds, `workTile`, `buildGrid`, `placeableIn`, `DINING_SHELL`, `'wrongShop'`, `'lastDining'`.
- Produces in `dining.ts`:
  - `DINING_START: Omit<Item, 'id'>[]`, in 37-column coordinates (the sketch's top half; the bottom two tables are left empty on purpose, §4.2):
    - stoves `(15,2)`, `(18,2)` (work tiles `(15,3)`, `(18,3)`);
    - servingCounter `(13,5)`, `(19,5)` (the gap at `(18,5)` is the way to the stoves);
    - diningTable `(14,8)`, `(19,8)`;
    - diningChair `(14,7)`, `(15,7)`, `(14,9)`, `(15,9)`, `(19,7)`, `(20,7)`, `(19,9)`, `(20,9)`;
    - ingredientShelf `(13,2)`, `(14,2)`, `(23,2)`; sink `(21,2)`; cashierCounter `(20,14)`.
    All `flip: false`, not turned.
  - `export interface DiningSeat { tile: Tile; facing: Facing }` and `export function diningSeats(items: Item[]): DiningSeat[]`: every dining chair with a table tile at Manhattan distance 1, facing that tile (`'up'`/`'down'`/`'left'`/`'right'`). A chair touching no table is not a seat (it can still be placed: §4.8's "phải sát bàn mới có khách ngồi" is a use rule, not a placement rule).
- Produces in `restaurant.ts`:
  ```ts
  export type RestaurantHost = Pick<SpaSim, 'purse' | 'clock' | 'day' | 'powerOut'>
  export class RestaurantSim {
    items: Item[]
    grid: Grid
    readonly floors = 1
    readonly houses: Houses = NO_HOUSES
    constructor(opts: { host: RestaurantHost; rng: Rng; autoSpawn: boolean })
    get money(): number            // host.purse.money
    get day(): number              // host.day
    shellGrid(): Grid              // towerOf(withHouses(widen(DINING_SHELL), NO_HOUSES)), cached
    beauty(): number               // beautyOf(items)
    canPlace(kind: ItemKind, x: number, y: number, flip: boolean, movingId?: number, turned?: boolean): BuildProblem | null
    buy(kind: ItemKind, x: number, y: number, flip: boolean, turned?: boolean): BuildProblem | null
    move(id: number, x: number, y: number, flip: boolean, turned?: boolean): BuildProblem | null
    sell(id: number): BuildProblem | null
    isBusy(id: number): boolean     // false in this task; Task 5 fills it
    drainEvents(): RestaurantEvent[] // 'roomChanged' only in this task
  }
  ```
  Match `SpaSim`'s build method names, parameters and refund rule exactly, so Task 12's Build mode can take either. `canPlace`: `'wrongShop'` when `!placeableIn(kind, 'restaurant')`, else `placeProblem(shellGrid(), others, item, { door: grid.door, floors: 1 })`, else `'money'` on `buy`. `sell`/`move` refuse `'lastDining'` when the item is the last stove, the last table or the last chair, and `'busy'` when `isBusy(id)`. Every change rebuilds `grid` and emits `{ type: 'roomChanged' }`.
- `RestaurantEvent` (grows in Tasks 4–5): `{ type: 'roomChanged' }` now.
- Produces in `tests/sim/helpers.ts`: `export function restaurantFor(main: SpaSim, opts?: { seed?: number; autoSpawn?: boolean }): RestaurantSim` (rng `createRng((opts?.seed ?? 1) + 101)`, `autoSpawn` default false).

- [ ] **Step 1: Write the failing tests** in `tests/sim/restaurant.test.ts`, each with `main = starShop(3, 10_000_000)` and `r = restaurantFor(main)`:
  - `'opens with two stoves, two tables, eight chairs and the serving counter'`: counts by kind are stove 2, diningTable 2, diningChair 8, servingCounter 2; `diningSeats(r.items)` has 8 entries; `r.grid.door` is `{ x: 18, y: 17 }`; `r.grid.works` holds `(15,3)` and `(18,3)`.
  - `'lays every start piece where the build rules allow it'`: for each start item, `r.canPlace(item.kind, item.x, item.y, item.flip, item.id)` is null.
  - `'walks from the door to every chair and every stove'`: for each seat, `findPath(r.grid, r.grid.door, t => tileEq(t, seat.tile))` is not null; same for each work tile.
  - `'seats a diner only on a chair that touches a table'`: after `r.buy('diningChair', 14, 12, false)` (no table there) `diningSeats(r.items)` still has 8; after `r.buy('diningTable', 14, 13, false)` it has 9, and the new seat faces `'down'`.
  - `'buys and sells from the shared purse'`: `r.buy('stove', 21, 4, false)` is null (or pick any open spot that passes) and `main.money` drops by 400_000; `r.sell(thatId)` puts the same refund back as `SpaSim.sell` would for its price.
  - `'refuses spa pieces in the restaurant'`: `r.canPlace('bed', 14, 12, false)` and `r.canPlace('bench', 14, 12, false)` are `'wrongShop'`; `r.canPlace('plant', 14, 12, false)` is null.
  - `'refuses to sell the last stove, table or chair'`: sell one stove, one table and seven chairs (all succeed); selling the last of each is `'lastDining'`, and moving the last stove to a legal spot is still allowed.

- [ ] **Step 2: Run and confirm they fail.** Run: `npx vitest run tests/sim/restaurant.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement** the interfaces. Reuse `itemsFromLayout`-style id numbering (`nextItemId` field), `placeProblem`, `buildGrid`, `beautyOf`; do not touch `SpaSim` here.

- [ ] **Step 4: Run whole suite + tsc.** Expected: all pass.

- [ ] **Step 5: Commit.** Message: "Lay out the restaurant's room from the sketch's top half on its own 37-column grid, with build rules that keep at least one stove, table and chair and refuse the spa's pieces".

---

### Task 4: Diners: walk-ins with peaks, walk-overs from the spa, seats, patience

**Files:**
- Modify: `src/sim/restaurant.ts`, `src/sim/spa.ts` (export `moveAlong`)
- Test: `tests/sim/restaurant.test.ts`

**Interfaces:**
- Consumes: `drawKind`, `KINDS`, `randomLook`, `arrivalGapMs`, `moveAlong` (now `export function moveAlong(m: Mover, speed: number, dtMs: number)` in `spa.ts`), `drawPhoTicket`, `diningSeats`.
- Produces:
  ```ts
  export type DinerState = 'street' | 'arriving' | 'toChair' | 'ordering' | 'waitingFood' | 'eating' | 'leaving' | 'exiting'
  export type DishId = 'pho'
  export interface Diner extends Mover {
    id: number; look: Look; kind: CustomerKind; state: DinerState; stateMs: number
    patienceMs: number; patienceMaxMs: number
    chair: Tile | null; dish: DishId; ticket: PhoTicket
    stars: Stars | null; mood: 'happy' | 'ok' | 'angry' | null
    fromSpa: boolean
    legMs: number                       // the street leg's length; 0 for a walk-in
  }
  export interface RestaurantStats { served: number; income: number; tips: number; walkedAway: number }
  export function dinerGapMs(minutes: number): number
  ```
  On `RestaurantSim`: `diners: Diner[]`, `stats: RestaurantStats`, `ownerAway = false`, `advance(ms: number): number` (STEP_MS steps, like `SpaSim.advance`), `freeSeats(): DiningSeat[]`, `sellableDishes(): DishId[]` (`['pho']` while there is at least one stove), `spawnDiner(opts?: { kind?: CustomerKind; look?: Look }): Diner | null` (test hook, ignores the timer), `walkOver(c: Customer): boolean`, `busy(): boolean` (any diner, or Task 5's cooking), `clearOut(): void`, `startDay(): void`.
- `RestaurantEvent` gains `{ type: 'dinerArrived'; id: number }`, `{ type: 'dinerPassed' }` (a walk-in found no chair), `{ type: 'dinerLeft'; id: number; angry: boolean }`.
- `dinerGapMs(minutes)` = `DINER_GAP_MIN * REAL_MS_PER_GAME_MIN`, divided by `DINER_PEAK_FACTOR` when `minutes` is in `[from, to)` of a `DINER_PEAKS` entry. The next gap is `arrivalGapMs(dinerGapMs(clock.minutes), rng())`.
- Walk-ins (step): only when `autoSpawn && !ownerAway && !host.clock.isClosed`; the timer counts down (first arrival after `FIRST_ARRIVAL_MS`). On zero: no free seat → emit `dinerPassed`, no diner, no complaint; else a diner with `randomLook(rng)`, `drawKind(host.day, rng)`, `drawPhoTicket(rng, KINDS[kind].hard)`, state `'arriving'` at the door, chair reserved. The rng draw order (gap, look, kind, ticket) is fixed by this sentence so the tests can pin it.
- Walk-over `walkOver(c)`: true and a `'street'` diner (with the spa customer's look and kind, `fromSpa: true`, `legMs = WALK_OVER_TILES / KINDS[kind].speed * 1000`, chair reserved, a fresh ticket) only when all hold: `c.mood` is `'happy'` or `'ok'`; not `c.vip`, `c.idol` or `c.kol`; `!ownerAway`; `!host.clock.isClosed`; a free seat; `sellableDishes()` non-empty; and then `rng() < WALK_OVER_CHANCE` (the roll is the last check, so a refused walk-over draws nothing). After `legMs` in `'street'` the diner appears at the door as `'arriving'`.
- After `ARRIVE_MS` → `'toChair'` (path to the chair with `findPath`), on arrival `'ordering'` with the seat's facing, `patienceMs = patienceMaxMs = PATIENCE_MS * KINDS[kind].patience`, and `dinerArrived` is emitted.
- Patience falls only in `'ordering'`, and not while `host.powerOut()`. At 0: mood `'angry'`, `stats.walkedAway++`, `dinerLeft { angry: true }`, then `'leaving'` (path to door) → `'exiting'` (`EXIT_MS`) → removed.
- `startDay()`: stats to zero, diners cleared, timer to `FIRST_ARRIVAL_MS`. `clearOut()`: diners cleared, chairs freed.

- [ ] **Step 1: Write the failing tests** (in `tests/sim/restaurant.test.ts`; `main.clock.minutes` is set directly to choose the hour; a test `advance` helper runs `main.advance(ms)` then `r.advance(ms)` the way the chain will):
  - `'sends walk-ins two and a half times as often at lunch and dinner'`: `dinerGapMs(600)` equals `DINER_GAP_MIN * REAL_MS_PER_GAME_MIN`; `dinerGapMs(700)` and `dinerGapMs(1100)` equal that ÷ 2.5; `dinerGapMs(780)` is the base again.
  - `'brings more walk-ins at lunch than in the morning'`: two fresh restaurants with `autoSpawn: true` and seed 7, clocks pinned (set `minutes` every step) at 540 and at 720, each run 120_000 ms with diners cleared every 10_000 ms so chairs never fill; count `dinerArrived` + `dinerPassed`: lunch > morning.
  - `'seats a walk-in, shows a ticket and runs down patience only while ordering'`: `spawnDiner({ kind: 'student' })`, advance until state `'ordering'`; `ticket` is set, chair is one of the start seats; patience after 10_000 ms is `patienceMaxMs - 10_000`.
  - `'lets a walk-in pass by without a word when every chair is taken'`: fill 8 seats with `spawnDiner`; the 9th `spawnDiner` returns null; with `autoSpawn` and a short timer, the next walk-in emits `dinerPassed` and `stats.walkedAway` stays 0.
  - `'walks a third of the paying spa customers over'`: restaurant seed 5; call `walkOver` on 300 customers made by a local `customer(overrides)` helper (`mood: 'happy'`, kind `'student'`, no vip/idol/kol), calling `r.clearOut()` after each so seats stay free: the number of `true` results is between 70 and 130.
  - `'never walks a customer over without a free chair, after closing, from a branch trip, or for a star guest'`: 8 seats filled → false; `main.clock.minutes = 20 * 60` → false; `r.ownerAway = true` → false; `vip` set → false; `mood: 'angry'` → false; in every case `r.diners.length` does not grow.
  - `'takes the walker the street leg before they come in'`: a walk-over of kind `'student'` (speed 5) stays `'street'` for 7_350 ms and is `'arriving'` at 7_450 ms.
  - `'freezes ticket patience in a power cut'`: an ordering diner; `vi.spyOn(main, 'powerOut').mockReturnValue(true)`; 5_000 ms later its patience is unchanged.
  - `'walks out angry when nobody takes the ticket'`: advance past `patienceMaxMs`: `dinerLeft { angry: true }`, `stats.walkedAway` 1, and after `EXIT_MS` more the diner is gone and its seat free.

- [ ] **Step 2: Run and confirm they fail.** Expected: FAIL on the missing members.

- [ ] **Step 3: Implement.** Movement uses `moveAlong(d, KINDS[d.kind].speed, dt)` on the restaurant grid. Seats are tracked by tile from `diningSeats(items)`, recomputed on every room change; a diner whose chair was moved away (Task 5 refuses that while seated) never needs repair.

- [ ] **Step 4: Run whole suite + tsc.** Expected: all pass, `same-draws` untouched.

- [ ] **Step 5: Commit.** Message: "Bring diners to the restaurant: walk-ins two and a half times as often at lunch and dinner, a third of the paying spa customers walking over when a chair is free, a ticket held up from the chair, and patience that runs only while it is held".

---

### Task 5: The owner's turn in the restaurant: order, cook, carry, eat, pay

**Files:**
- Modify: `src/sim/restaurant.ts`, `src/strings/vi.ts` (`stovesBusy` "Hết bếp trống")
- Test: `tests/sim/restaurant.test.ts`

**Interfaces:**
- Produces on `RestaurantSim`:
  ```ts
  export type DiningTask = { kind: 'order'; dinerId: number } | { kind: 'cook'; dinerId: number; stoveId: number } | { kind: 'carry'; dinerId: number }
  owner: Mover & { task: DiningTask | null }
  ownerIn: boolean                  // the owner stands in this shop
  cookingDinerId: number | null     // a Phở game is open for this diner
  stoves: { id: number; work: Tile; dinerId: number | null }[]   // from the stove items, rebuilt on room change
  tapTile(t: Tile): void
  completeCooking(dinerId: number, stars: Stars): void
  ownerArrives(): void              // owner at the door tile, path [], task null, ownerIn true
  ownerLeaves(): void               // task null, path [], ownerIn false (only called when no task is held)
  ownerWalksOut(): boolean          // false while busy; else path to the door, task null
  ownerAtDoor(): boolean            // ownerIn, path empty, standing on grid.door
  ownerBusy(): boolean              // task !== null || cookingDinerId !== null
  leaveTown(): void                 // see below
  ```
- `RestaurantEvent` gains `{ type: 'cookReady'; dinerId: number; stoveId: number }`, `{ type: 'dinerPaid'; dinerId: number; amount: number; tip: number; tile: Tile }`, `{ type: 'toast'; key: 'stovesBusy' | 'powerWait' }`.
- `advance(ms)` returns 0 and does nothing while `cookingDinerId !== null` (the game pauses for the mini-game).
- `tapTile(t)`: ignored unless `ownerIn` and the owner has no task and nothing is cooking. A tap on an `'ordering'` diner's chair: power cut → toast `powerWait`; no stove free → toast `stovesBusy`; else task `order` and a path to `besideSeat(grid, chair)`. Any other walkable tile: walk there (like the spa).
- On reaching the diner (`order`): claim a free stove (none now → toast `stovesBusy`, task null, the diner keeps ordering); diner `'waitingFood'` (patience stops); task `cook`, path to the stove's work tile.
- On reaching the stove (`cook`): if `host.powerOut()` wait there (toast `powerWait` once) and check every step; else `cookingDinerId = dinerId` and emit `cookReady`.
- `completeCooking(dinerId, stars)`: `cookingDinerId = null`, stove freed, `diner.stars = stars`, task `carry`, path to `besideSeat`.
- On reaching the diner (`carry`): task null; diner `'eating'`. After `EAT_MS`: pays `DISH_PRICE[dish] + DINER_TIP[stars]` into `host.purse`, `stats.served++`, `stats.income += price`, `stats.tips += tip`, mood from stars with the same mapping `SpaSim.payFor` uses (a 1-star diner is not a walk-out and does not touch `walkedAway`); emit `dinerPaid` with the chair tile; then `'leaving'` → `'exiting'` → removed, seat freed.
- `isBusy(id)` (from Task 3): a stove whose `dinerId` is set, a chair whose seat is taken, a table any of whose seats is taken.
- `leaveTown()` (the owner goes to a branch): `ownerAway = true`, `ownerIn = false`; a diner the owner is carrying to is served at once (`'eating'`); every `'ordering'` or `'waitingFood'` diner and every `'street'` walker leaves quietly (mood null, not counted, seat and stove freed); owner task null. `busy()` now also counts `cookingDinerId`.

- [ ] **Step 1: Write the failing tests:**
  - `'serves Phở from the ticket to the till'`: `r.ownerArrives()`; a seated ordering diner; `r.tapTile(diner.chair)`; advance until `cookReady` (its `stoveId` is a start stove); `r.advance(1000)` returns 0; `r.completeCooking(id, 3)`; advance until `dinerPaid`: `amount` 60_000, `tip` 20_000, `main.money` up by 80_000, `r.stats` `{ served: 1, income: 60_000, tips: 20_000, walkedAway: 0 }`; then the diner leaves and the seat is free.
  - `'tips by the stars'`: three diners served at 1, 2 and 3 stars: their `dinerPaid` tips are exactly `[5_000, 10_000, 20_000]` (`DINER_TIP[stars]`; the 0 is only for a walk-out, who pays nothing).
  - `'says no stove is free when both are taken'`: set `r.stoves[0].dinerId` and `r.stoves[1].dinerId` to ids of two other seated diners, then tap a third, ordering diner: a `toast stovesBusy` event is drained and the owner's task stays null.
  - `'waits at the stove through a power cut'`: with `vi.spyOn(main, 'powerOut')` returning true once the owner has the `cook` task: no `cookReady`, exactly one `toast powerWait` over 5_000 ms; after the spy returns false, `cookReady` comes.
  - `'refuses to move a stove being cooked at or a chair with a diner'`: during cooking (`cookingDinerId` set, then completed only after the check), `r.move(stoveId, …)` and `r.sell(stoveId)` are `'busy'`; a chair under an eating diner and its table are `'busy'`.
  - `'ignores taps while cooking or carrying'`: during `carry`, `tapTile` on another ordering diner leaves the task as `carry`.
  - `'serves the carried dish and lets the waiting go when the owner leaves town'`: one diner being carried to, one ordering, one walker on the street; `r.leaveTown()`: the first is `'eating'` and later pays; the others are gone with `stats.walkedAway` 0 and no `dinerLeft { angry: true }`.

- [ ] **Step 2: Run and confirm they fail.**

- [ ] **Step 3: Implement.** Owner speed `OWNER_SPEED` through `moveAlong`. Reroute everyone after a room change the way `SpaSim.changeRoom` settles characters (a path blocked by new furniture is recomputed from `tileOf(pos)`).

- [ ] **Step 4: Run whole suite + tsc.**

- [ ] **Step 5: Commit.** Message: "Let the owner work the restaurant: take a diner's ticket, cook at a free stove when the power is on, carry the bowl to the table, and take the price and a tip by the stars after the diner has eaten".

---

### Task 6: The street and the chain: buying, riding, taps, branch trips, the day

**Files:**
- Create: `src/sim/street.ts`
- Modify: `src/sim/spa.ts` (hooks below), `src/sim/chain.ts`, `src/strings/vi.ts` (`ownerBusyTap` "Cô chủ đang bận tay")
- Test: `tests/sim/street.test.ts`

**Interfaces:**
- Produces in `spa.ts` (the only `SpaSim` changes in this plan besides `canPlace`, `moveAlong` and the save field):
  - `ownerNextDoor = false`: the owner is in the restaurant or on the street. Not saved by `SpaSim` itself. `tapTile` ignores taps while it is true; nothing else changes (`ownerHere` stays true, so customers keep coming and waiting customers do not leave quietly, §4.6).
  - `onCustomerGone: ((c: Customer) => void) | null = null`: called in `updateCustomer` just before an `'exiting'` customer is removed.
  - `keepOpen: () => boolean = () => false`: the day-end check becomes `clock.isClosed && customers.length === 0 && servingCustomerId === null && !this.keepOpen()`.
  - `autoSpawn` becomes `readonly` public.
  - `ownerWalksOut(): boolean`: false while the owner has a task or `servingCustomerId !== null`; else the owner paths to `grid.door` with no task. `ownerAtDoor(): boolean`. `ownerWalksIn(): void`: owner at `grid.door`, facing up, path [], task null.
- Produces in `street.ts`:
  ```ts
  export type OwnerWhere =
    | { at: ShopSide }
    | { at: 'leaving'; from: ShopSide; tap: Tile }
    | { at: 'riding'; to: ShopSide; ms: number; tap: Tile }
  export type TapResult = 'busy' | null
  export class Street {
    where: OwnerWhere
    constructor(spa: SpaSim, restaurant: RestaurantSim)
    tap(side: ShopSide, t: Tile): TapResult
    advance(ms: number): void
    rideProgress(): { to: ShopSide; k: number } | null   // k = ms / RIDE_MS
    ownerLeavesTown(): void
    ownerBack(): void
    startDay(): void
  }
  ```
- `tap(side, t)`:
  - `where.at === side` → that shop's `tapTile(t)`.
  - `where.at === 'leaving'`: `from === side` → stop walking out (owner path cleared), `where = { at: side }`, then that shop's `tapTile(t)`; else `where.tap = t`.
  - `where.at === 'riding'`: `to === side` → `where.tap = t`; a tap on the shop being ridden away from is ignored.
  - Owner in the other shop: the tap only starts a trip when `t` holds a waiting spa customer / an ordering diner, or is walkable on that shop's grid; when the current shop's owner is busy (spa: task or serving; restaurant: `ownerBusy()`), return `'busy'` (the scene toasts `ownerBusyTap`); else that shop's `ownerWalksOut()` and `where = { at: 'leaving', from: current, tap: t }`.
- `advance(ms)`: `restaurant.advance(ms)` first; then `leaving` → when the shop left has `ownerAtDoor()`: from spa set `spa.ownerNextDoor = true`, from restaurant `restaurant.ownerLeaves()`; `where = { at: 'riding', to: other, ms: 0, tap }`. `riding`: `ms += ms`; at `RIDE_MS` arrive: to spa → `spa.ownerNextDoor = false`, `spa.ownerWalksIn()`, `spa.tapTile(tap)`; to restaurant → `restaurant.ownerArrives()`, `restaurant.tapTile(tap)`; `where = { at: to }`.
- `ownerLeavesTown()`: `restaurant.leaveTown()`, `spa.ownerNextDoor = false`, `where = { at: 'spa' }`. `ownerBack()`: `restaurant.ownerAway = false`. `startDay()`: `restaurant.startDay()`, `ownerAway = false`, `ownerIn = false`, `spa.ownerNextDoor = false`, `where = { at: 'spa' }`.
- Produces in `chain.ts`:
  ```ts
  export const RESTAURANT_RNG_SALT = 101
  export type RestaurantProblem = 'owned' | 'day' | 'money'
  street: Street | null
  get restaurant(): RestaurantSim | null
  restaurantProblem(): RestaurantProblem | null    // owned → 'owned'; main.day < RESTAURANT_DAY → 'day'; money < RESTAURANT_PRICE → 'money'
  buyRestaurant(): RestaurantProblem | null        // pays, builds the sim (host = main, rng = createRng(seed + RESTAURANT_RNG_SALT), autoSpawn = main.autoSpawn), wires hooks, street
  cooking(): boolean                               // restaurant?.cookingDinerId != null
  ```
  Wiring (one private `wire()` used by `buyRestaurant` and `fromSave`): `main.onCustomerGone = c => restaurant.walkOver(c)`, `main.keepOpen = () => restaurant.busy()`. `onCustomerGone` must only fire for the main shop's own customers; branches never get the hooks.
  - `advance(ms)`: returns 0 at once while `cooking()`; else as now, then `this.street?.advance(ran)` and route restaurant events (Task 10 reads them from `chain.drainRestaurantEvents(): RestaurantEvent[]`, which the chain buffers).
  - `goTo(place)`: leaving the main shop for a branch → `street?.ownerLeavesTown()` before `main.ownerLeaves()`; coming back → `street?.ownerBack()`.
  - `startDay()` → `street?.startDay()`. `leaveCount()` adds the restaurant diners who would leave quietly (`'ordering'`, `'waitingFood'`, `'street'`) when the owner is at the main shop.

- [ ] **Step 1: Write the failing tests** in `tests/sim/street.test.ts`. A helper `owned(seed = 7)`: `chain = new Chain(starShop(3, 20_000_000, seed), seed)`, `chain.main.day = 10`, `chain.buyRestaurant()`:
  - `'sells the restaurant from day 10 for 5.000.000 đ, once'`: at day 9 `restaurantProblem()` is `'day'`; at day 10 with 4_999_999 it is `'money'`; with enough, `buyRestaurant()` is null, money down 5_000_000, `chain.restaurant!.items` has 2 stoves, 2 tables, 8 chairs; then `'owned'`.
  - `'never gives a branch a restaurant'`: after `chain.open('beach')`, the branch's `onCustomerGone` is null and `chain.restaurant` is the one restaurant.
  - `'rides from door to door in RIDE_MS'`: tap an ordering diner's chair on `'restaurant'`; advance until `where.at === 'riding'`; record; after `RIDE_MS - 50` it is still riding, after 100 more `where` is `{ at: 'restaurant' }` and the restaurant owner has task `order`.
  - `'keeps waiting spa customers and new arrivals while the owner is next door'` (§9): with `autoSpawn`, a spa customer seated and waiting with patience well above 20_000; ride to the restaurant; advance 15_000 ms: the customer is still `'waiting'` (not left), `main.ownerHere` is true, and at least one new `customerArrived` happened during the 15_000 ms (seed chosen so the gap allows it).
  - `'cancels the trip when the spa is tapped while walking out'`: tap a restaurant diner, then before the owner reaches the spa door `street.tap('spa', someFloorTile)`: `where` is `{ at: 'spa' }` and the spa owner walks to that tile.
  - `'acts on the last tap made while riding'`: tap diner A, advance into `'riding'`, tap diner B's chair: on arrival the owner's `order` task is for B.
  - `'refuses to leave mid-carry'`: owner at restaurant with task `carry`; `street.tap('spa', waitingCustomerTile)` is `'busy'` and `where` is unchanged.
  - `'pauses everything while a Phở bowl is cooking'`: when `cookReady` fires, `chain.advance(1000)` returns 0 and `main.clock.minutes` does not move.
  - `'keeps the day open until the last diner has paid'`: a diner eating at 19:59; advance past 20:00: no `dayEnded` while the diner is there; it comes once after the diner has left, and only once.
  - `'leaves the restaurant tidy when the owner goes to a branch mid-carry'`: owner at the restaurant carrying to A, B ordering; `chain.goTo('beach')` (branch opened): A pays later (money rises by 60_000 + tip), B is gone uncounted, `where` is `{ at: 'spa' }`, no new diner arrives over 120_000 ms; `chain.goTo(null)`: diners come again.
  - `'starts each day with the owner in the spa'`: from `where.at === 'restaurant'`, `chain.startDay()`: `where` is `{ at: 'spa' }`, `main.ownerNextDoor` false, restaurant stats zero.
  - `'walks a paying spa customer over through the chain'`: force `main`'s next served customer happy and stub the restaurant rng to return 0.1: after the customer exits, `restaurant.diners` holds a `fromSpa` `'street'` diner.

- [ ] **Step 2: Run and confirm they fail.**

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run whole suite + tsc.** `tests/sim/same-draws.test.ts` must still pass: the main shop with no restaurant draws exactly as before.

- [ ] **Step 5: Commit.** Message: "Put the restaurant on the chain: buy it from day 10, ride the owner between the two doors in three seconds with the last tap kept, keep both shops open while she is next door, hold the spa's day until the last diner pays, and close up quietly when she goes to a branch".

---

### Task 7: Save

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/restaurant.ts` (`toSave`/`fromSave`), `src/sim/street.ts` (`ownerAt`), `src/sim/chain.ts` (`toSave`/`fromSave`), `src/sim/spa.ts` (`toSave` writes `restaurant: null`)
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Produces in `save.ts`:
  ```ts
  /** The save that first has the restaurant: origin/master's SAVE_VERSION + 1 at merge time. */
  export const RESTAURANT_SAVE_VERSION = 36
  export const SAVE_VERSION = RESTAURANT_SAVE_VERSION
  export interface RestaurantSave {
    items: Item[]; nextItemId: number
    houses: Houses; floors: number                       // NO_HOUSES and 1 in lô A; kept for lô C
    diners: Diner[]; nextDinerId: number; untilArrivalMs: number
    stats: RestaurantStats
    owner: RestaurantSim['owner']; ownerIn: boolean; cookingDinerId: number | null
    ownerAt: 'spa' | 'restaurant' | 'street'
  }
  ```
  `SaveData` gains `restaurant: RestaurantSave | null`. `parseVersioned` adds 35 to its explicit list of known versions (the list now ends `… 34, 35, SAVE_VERSION`). `repairRestaurant(raw)`: main shop only; a save older than `RESTAURANT_SAVE_VERSION` or with no field → null; malformed diners dropped; items that fail the restaurant's placement rules are dropped (not thrown); a branch's `restaurant` is always null (in `repairChain`'s spread).
- Load rules (§8): diners in `'street'` are dropped and not counted; `ownerAt: 'street'` → `where = { at: 'spa' }`, spa owner at the spa door, restaurant `ownerIn` false; `ownerAt: 'restaurant'` → `main.ownerNextDoor = true`, restaurant owner as saved; a saved `cookingDinerId` → `cookingDinerId` cleared and the owner put back on `cook` at that stove, so the next step re-emits `cookReady`; owner at a branch (`chain.at !== null`) → `ownerAway = true`.
- `Street.toSave(): 'spa' | 'restaurant' | 'street'` (`leaving` and `riding` save as `'street'`); `Street.fromSave(spa, restaurant, at)`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/save.test.ts`:
  - change `'is version 35'` to `'is the restaurant version'`: `expect(SAVE_VERSION).toBe(RESTAURANT_SAVE_VERSION)` and `expect(RESTAURANT_SAVE_VERSION).toBe(36)`.
  - `'loads a version 35 save with no restaurant and plays it as before'`: parse `tests/fixtures/save-v35.json`; `restaurant` is null; `Chain.fromSave(data, seed).street` is null; advancing it 60_000 ms emits the same event types as before the change (compare against a chain built from the same parse with `restaurant` deleted).
  - `'round-trips a restaurant with diners, stats and furniture'`: build via Task 6's `owned()`, buy a table, seat two diners, serve one; `parseSave(JSON.stringify(chain.toSave()))` then `Chain.fromSave`: same items, diner ids and states, stats.
  - `'reloads a riding owner at the spa door and drops the walkers'`: owner riding, one `'street'` walker: after the round trip `street.where` is `{ at: 'spa' }`, the spa owner stands on `main.grid.door`, there is no walker, `stats.walkedAway` unchanged.
  - `'reloads an owner standing in the restaurant there'`: `where` is `{ at: 'restaurant' }`, `main.ownerNextDoor` is true, the restaurant owner's position is unchanged.
  - `'brings back a bowl that was cooking'`: saved with `cookingDinerId` set; after loading and one `advance(STEP_MS)`, a `cookReady` for that diner is drained.
  - `'never gives a branch a restaurant'`: a save whose branch carries a `restaurant` object loads with the branch's `restaurant` null.
  - keep `SaveTooNewError` for `SAVE_VERSION + 1` (the existing v99 case already covers it; add `SAVE_VERSION + 1` if the existing case hardcodes 99 only).

- [ ] **Step 2: Run and confirm they fail.**

- [ ] **Step 3: Implement.** Do not write a new fixture file in this task: a v36 fixture would have to be renumbered whenever Task 14 moves the version. Add `tests/fixtures/save-v<RESTAURANT_SAVE_VERSION>.json` only in Task 14, once the number is final.

- [ ] **Step 4: Run whole suite + tsc.**

- [ ] **Step 5: Commit.** Message: "Save the restaurant in a new version: its furniture, diners, stats and where the owner stands, with a riding owner put back at the spa door, walkers dropped uncounted, and older saves loading with no restaurant".

---

### Task 8: Street view helpers: bounds, shop under an x, strip blocks and doors, the bike

**Files:**
- Create: `src/view/street.ts`
- Modify: `src/view/PositionStrip.ts` (`StripModel`), `src/view/strip.ts`
- Test: `tests/view/street.test.ts`, `tests/view/strip.test.ts`

**Interfaces:**
- Produces in `src/view/street.ts`:
  ```ts
  export const restaurantX = (col: number): number => MAP_X + (RESTAURANT_X0 + col) * TILE
  export function restaurantTileAt(world: Vec): Tile          // inverse of restaurantX and the row maths RoomView uses
  export function streetBounds(spaShown: Houses): Rect        // mapBounds(spaShown)'s left edge to restaurantX(SHOP_X0 + 13), same y and h
  export function shopAt(worldX: number, owned: boolean): ShopSide   // 'restaurant' when owned and worldX >= restaurantX(0)
  export const DOOR_X = { spa: …, restaurant: … }             // world x of each door's centre: MAP_X + (18.5) * TILE and restaurantX(18.5)
  export function rideX(to: ShopSide, k: number): number      // from the other door to `to`'s door, linear in k (0..1)
  export function walkerX(d: Diner): number                   // a 'street' walker from the spa door toward the restaurant door by stateMs / legMs
  export interface StripBlock { from: number; to: number; restaurant: boolean }  // world x range
  export function stripBlocks(spaShown: Houses, owned: boolean): StripBlock[]
  export function ticketDots(diners: Diner[], visible: Rect, viewFloor: number): number[]  // world x of 'ordering' diners off-screen
  ```
  `streetBounds` is used at the main shop from day 1 (the old house is on the street before it is bought); a branch keeps `mapBounds`.
- `StripModel` changes `door: number` to `doors: number[]` and gains `blocks: StripBlock[]`; `PositionStrip` draws one mustard door tick per entry and fills each block's span (spa: the current bar colour; restaurant: `C.terracotta` at the same alpha). A branch passes `doors: [spaDoor]`, `blocks: []`, so it looks as today.

- [ ] **Step 1: Write the failing tests:**
  - `'spans the spa and the restaurant's main block'`: `streetBounds(NO_HOUSES)` has `x === mapBounds(NO_HOUSES).x` and right edge `x + w === restaurantX(SHOP_X0 + 13)`; with `{ left: 2, right: 0 }` the left edge moves out by 12 tiles and the right edge stays.
  - `'tells which shop is under an x'`: `shopAt(restaurantX(0) - 1, true)` is `'spa'`, `shopAt(restaurantX(0), true)` is `'restaurant'`, `shopAt(restaurantX(20), false)` is `'spa'`.
  - `'maps restaurant tiles to the world and back'`: for (18,17) and (14,7), `restaurantTileAt({ x: restaurantX(x + 0.5), y: <the row's centre> })` returns the tile.
  - `'rides from one door to the other'`: `rideX('restaurant', 0)` is `DOOR_X.spa`, `rideX('restaurant', 1)` is `DOOR_X.restaurant`, `rideX('spa', 0.5)` is the midpoint.
  - `'draws a walker along the street by the time walked'`: a `'street'` diner with `stateMs = legMs / 2` is at the midpoint of the two doors.
  - `'marks two blocks and two doors once the restaurant is bought'`: `stripBlocks(NO_HOUSES, true)` has two blocks meeting at `restaurantX(0)`, the second with `restaurant: true`; `stripBlocks(NO_HOUSES, false)` has one spa block and one restaurant block too (the old house is part of the street; it shows from day 1).
  - `'puts a red dot for each ticket held off-screen'`: an ordering diner whose world x is outside `visible` gives one dot at that x; an eating diner gives none.
  In `tests/view/strip.test.ts` update any case that builds a `StripModel` with `door` to `doors: [door]`, `blocks: []`.

- [ ] **Step 2: Run and confirm they fail.**

- [ ] **Step 3: Implement.** No Phaser import in `src/view/street.ts`.

- [ ] **Step 4: Run whole suite + tsc.** Expected: pass. `SpaScene` must compile with `doors: [door]` and `blocks: []` (the real wiring is Task 10).

- [ ] **Step 5: Commit.** Message: "Add the street's view maths: bounds from the spa to the restaurant's main block, which shop lies under an x, restaurant tiles in world space, the bike and walkers between the doors, and a strip with two blocks and two door ticks".

---

### Task 9: Street and restaurant art

**Files:**
- Create: `src/art/restaurant.ts`
- Modify: `src/scenes/BootScene.ts` (register textures)
- Test: `tests/art/restaurant.test.ts`

**Interfaces:**
- Produces: `export function restaurantTextures(): Record<string, string>` with keys:
  - `rest-room`: the restaurant's floor-1 room in tile units, `viewBox="0 0 13 ${FLOOR_ROWS + STREET_TILES}"`: terrazzo or tile floor, tiled kitchen strip behind the serving counter line (rows 2–4), cream walls with a menu board, the shop front with a red-and-yellow awning and the "NHÀ HÀNG" name board, and `street(13, FLOOR_ROWS)` from `src/art/room.ts` (export `street` is already exported). Reuse `rect`, `outline`, `glassPane`, `shopFront` from `room.ts`.
  - `rest-old`: the closed old house, same viewBox: shuttered front, faded paint, and a sign reading "SANG NHƯỢNG" across the shutter.
  - `lot-front`: a 6-column closed street front with `street(6, FLOOR_ROWS)`, `viewBox="0 0 6 …"`, for the empty lots between the spa and the restaurant.
  - `rest-upper`: a closed upper floor (`FLOOR_ROWS` rows, 13 columns) shown on floors 2 and 3 of the restaurant block.
  - `fx-bike`: the owner's bicycle, sized like `SCOOTER_BOX` in `src/art/fx.ts`.
- Produces: `RESTAURANT_LAMP` (an exported colour) for the warm stove lamps used in Task 10.

- [ ] **Step 1: Write the failing tests** in `tests/art/restaurant.test.ts` (with `vi.mock('phaser', () => ({}))` as the other art tests):
  - `'draws every restaurant texture as one svg'`: keys are exactly `['fx-bike', 'lot-front', 'rest-old', 'rest-room', 'rest-upper']` (sorted); each starts `<svg` and ends `</svg>`.
  - `'sizes the room, the old house and a lot to their columns and the street'`: viewBoxes `0 0 13 ${FLOOR_ROWS + STREET_TILES}` for `rest-room` and `rest-old`, `0 0 6 ${FLOOR_ROWS + STREET_TILES}` for `lot-front`, `0 0 13 ${FLOOR_ROWS}` for `rest-upper`.
  - `'hangs the SANG NHƯỢNG sign on the old house'`: `rest-old` contains `SANG NHƯỢNG`.

- [ ] **Step 2: Run and confirm they fail.**

- [ ] **Step 3: Implement**, then register with `loadSvgTextures(this, { …, ...restaurantTextures() })` in `BootScene`.

- [ ] **Step 4: Run whole suite + build.** Run: `npm test`, `npm run build`.

- [ ] **Step 5: Commit.** Message: "Draw the restaurant's room, the old house with its SANG NHƯỢNG sign, closed lot fronts and upper floors for the street, and the owner's bicycle".

---

### Task 10: The restaurant on the map

**Files:**
- Create: `src/view/RestaurantLayer.ts`
- Modify: `src/scenes/SpaScene.ts`, `src/view/RoomView.ts` (night and dark overlays take a bounds rect), `src/strings/vi.ts`
- Test: none new beyond Task 8's helpers; verified by `npm run build` and the browser check in Step 4.

**Interfaces:**
- Consumes: `chain.street`, `chain.restaurant`, `chain.restaurantProblem()`, `chain.buyRestaurant()`, `chain.cooking()`, `chain.drainRestaurantEvents()`, `Street.tap`, `rideProgress`, Task 8's helpers, Task 9's textures, `daylight(minutes)`.
- Produces: `class RestaurantLayer { constructor(scene: Phaser.Scene); sync(chain: Chain, viewFloor: number, minutes: number, powerOut: boolean): void; oldHouseHit(world: Vec): boolean; dinerAt(world: Vec): Diner | null; destroy(): void }`.
  - Draws `rest-old` (unbought) or `rest-room` + the restaurant items (`itemTexture`, placed with `restaurantX`) at `restaurantX(SHOP_X0)`; `lot-front` on each unshown spa right lot (spa columns 25–36 that `shownHouses` does not show) and on the restaurant's left lots (restaurant columns 0–11) and right lots (25–36 are beyond the bounds; skip them); `rest-upper` over the restaurant block when `viewFloor > 1` (diners and owner hidden then).
  - Diners with their look (reuse the chibi drawing the spa uses for customers), a ticket icon over `'ordering'` diners and their patience bar (same drawing as the spa's waiting bar), the restaurant owner while `ownerIn`, the bike at `rideX` on the sidewalk row while riding, walkers at `walkerX` on the sidewalk.
  - Night: the restaurant's wash and a warm glow over each stove and at the door when `daylight(minutes).lamps` and not `powerOut`; in a power cut, the block dims like the spa and each stove shows no flame.
- `SpaScene` (main shop only; a branch is untouched):
  - camera bounds `streetBounds(main.shownHouses())` from day 1 (`syncHouses` uses it); `RoomView`'s night/dark overlays are sized by the same rect, so the light covers all 74 columns.
  - `onMapTap(world)`: if `shopAt(world.x, owned) === 'restaurant'` or the tap is on the old house: unbought → `oldHouseHit` → before day 10 toast `restaurantLater` "Mở bán từ ngày 10", else the buy card (copy in Global Constraints) through `choose`, buying with `chain.buyRestaurant()` and sliding the camera to the restaurant; bought → `chain.street.tap('restaurant', restaurantTileAt(world))`. Spa side with a street → `chain.street.tap('spa', tile)` instead of `sim.tapTile`. A `'busy'` result toasts `ownerBusyTap`.
  - The spa owner sprite is hidden while `main.ownerNextDoor`.
  - Camera: when a ride starts, `showFloor(1)`; while riding, the camera centres on `rideX` every frame (`cam.jump`) unless a finger is down; on arrival it stays.
  - `playing()` = `sim.servingCustomerId !== null || chain.cooking()`; it replaces the "a mini-game is open" checks in `mapFree`, `updateFloorBar`, `updatePointer`, `openBuild`, `openStaff`, `openServices` and `showAway`.
  - Restaurant events: `cookReady` → launch `'PhoScene'` with `CookData` (Task 11; pending while paused, like `pendingService`), `dinerPaid` → `floatMoney` at the restaurant tile in world space, `toast` → `stovesBusy` / `powerWait`.
  - Strip: `blocks: stripBlocks(...)`, `doors: [DOOR_X.spa, DOOR_X.restaurant]` (spa only at a branch), owner x from the spa owner, the restaurant owner (`restaurantX`) or `rideX`, dots = spa dots + `ticketDots`.
  - Add to the `__spa` dev hooks: `restaurant: () => chain.restaurant`, `street: () => chain.street`.

- [ ] **Step 1: Implement** `RestaurantLayer` and the `SpaScene` wiring above. Keep the street culled: only diners and items on the current floor are visible; items are created once and moved, not recreated each frame.

- [ ] **Step 2: Build.** Run: `npm run build`. Expected: no type errors, bundle built.

- [ ] **Step 3: Run whole suite.** Run: `npm test`. Expected: all pass.

- [ ] **Step 4: Browser check** (dev bundle served with `vite preview`, gstack `$B` at 390×780, synthesized `mousedown`/`mousemove`/`mouseup` on the canvas only): day 9 save: the old house with its sign sits right of the spa; a tap on it toasts "Mở bán từ ngày 10". Set day 10: the buy card shows the copy above; buying drops 5.000.000 đ and the room appears with 2 stoves, 2 tables, 8 chairs. Spawn a diner with `__spa.restaurant().spawnDiner()`: it walks in and holds up a ticket. Tap it from the spa: the owner walks out, bikes on the sidewalk with the camera following, takes the ticket and goes to a stove (the Phở scene does not exist yet, so the `cookReady` launch is checked in Task 11). Screenshot each.

- [ ] **Step 5: Commit.** Message: "Show the restaurant on the street: the old house for sale beside the spa, the bought room with its diners and tickets, the owner biking between the doors with the camera behind her, lamps at night, dark stoves in a power cut, and taps routed to the shop under the finger".

---

### Task 11: The Phở scene

**Files:**
- Create: `src/scenes/PhoScene.ts`, `src/art/phoArt.ts`
- Modify: `src/main.ts` (scene list), `src/scenes/BootScene.ts` (textures), `src/scenes/SpaScene.ts` (launch on `cookReady`), `src/strings/vi.ts`
- Test: `tests/art/phoArt.test.ts`

**Interfaces:**
- Consumes: `PhoGame`, `PhoTicket`, `boilBand`, `PHO_*` config, `addMiniGameCard`, `setInstruction`, `drawBars`, `revealStars`, `oneFinger` input (as `ShampooScene`).
- Produces: `export interface CookData extends MiniGameData { ticket: PhoTicket }`; scene key `'PhoScene'`; `__finishForTest(stars: Stars): void` (dev hook, like `ShampooScene`); `onDone(stars)` → SpaScene calls `chain.restaurant.completeCooking(dinerId, stars)`.
- Produces in `phoArt.ts`: `phoTextures(): Record<string, string>` with keys `pho-board`, `pho-beef`, `pho-pot`, `pho-dial`, `pho-bowl`, `pho-onion`, `pho-chili`, `pho-herb`, `pho-ticket` (all `svg`).
- Layout (game pixels, the sketch's 360×300 ×3, on the mini-game card): ticket at top right; step pills "1 · Thái thịt", "2 · Trụng bánh", "3 · Thêm rau"; the board with the beef and the four dotted lines at `PHO_CUT_X`; the pot with the dial (band drawn from `boilBand(ticket, hard)`); the bowl with three topping buttons; the buttons "Giữ để trụng" (held) and "Bưng ra".
- A swipe is one finger-down to finger-up: its mean x and vertical span go to `game.cut(meanX, spanY)`.
- Copy (exact): instructions per phase: "Vuốt từ trên xuống theo từng vạch chấm để thái thịt", "Giữ để trụng, thả khi kim vào vạch vàng", "Chạm hành, ớt, rau theo phiếu rồi bấm Bưng ra". Ticket lines: "Phở bò tái" / "Phở bò chín", "Ít hành" / "Nhiều hành", "Có ớt" / "Không ớt", and "Thêm rau" when `extraHerb`. Feedback: cut `'good'` "Lát đẹp!", `'off'` "Hơi lệch vạch.", `'short'` "Vuốt dài hơn một chút, qua hết miếng thịt."; boil `'in'` "Vừa tới!", released below the band "Hơi sống.", above it "Hơi nhừ.".
- `demo` is always false in lô A (lessons are lô B).

- [ ] **Step 1: Write the failing test** in `tests/art/phoArt.test.ts`: `'draws every Phở part'`: keys of `phoTextures()` sorted equal the list above; each starts `<svg` and ends `</svg>`; `pho-board` draws four dashed lines (`stroke-dasharray` appears 4 times).

- [ ] **Step 2: Run and confirm it fails.**

- [ ] **Step 3: Implement** the art, the scene (rules from `PhoGame` only; the scene never scores), registration in `main.ts` and `BootScene`, and the `cookReady` → launch → `completeCooking` wiring in `SpaScene` (pending while paused, launched on resume, like `pendingService`).

- [ ] **Step 4: Build, test and browser check.** `npm run build`, `npm test`. In the browser: take a diner's ticket, cook: swipe the four lines (one short swipe shows the short message and uses nothing), hold the boil into the band, tap the ticket's toppings, Bưng ra; stars show; the owner carries the bowl; the diner eats for about 8 s and a money float shows 60.000 đ plus the tip. Repeat with a wrong topping and check one star fewer. `__finishForTest(3)` closes the scene and the flow continues. Screenshot each.

- [ ] **Step 5: Commit.** Message: "Cook Phở in its own mini-game: the order ticket on the card, four swipes on the dotted lines, a held boil with the ticket's band on the dial, toppings tapped to match, and the bowl served for the stars".

---

### Task 12: Panels act on the shop under the centre

**Files:**
- Modify: `src/scenes/BuildScene.ts`, `src/view/RoomView.ts` (`colX`), `src/view/Hud.ts` (shop label), `src/scenes/SpaScene.ts` (open the right panel), `src/view/catalog.ts` (already takes `shop` from Task 1), `src/strings/vi.ts`
- Test: `tests/view/catalog.test.ts` (one more case)

**Interfaces:**
- Produces in `BuildScene.ts`:
  ```ts
  export type BuildPlace = Pick<SpaSim, 'items' | 'grid' | 'floors' | 'money' | 'shellGrid' | 'canPlace' | 'buy' | 'move' | 'sell' | 'isBusy' | 'beauty'>
  export interface BuildRoom { floor: number; rowY(y: number): number; onFloor(y: number): boolean; itemAt(world: Vec): number | null; hide(id: number | null): void; worldToTile(world: Vec): Tile; tileToWorld(t: Tile): Vec; colX(x: number): number }
  ```
  `BuildData` gains `place: BuildPlace`, `shop: ShopSide`, `room: BuildRoom` (`sim` stays for the spa-only parts: gifts, pets, pills). `RestaurantSim` and `RestaurantLayer` satisfy `BuildPlace` and `BuildRoom` structurally (add the members they lack, e.g. `RestaurantLayer.colX = restaurantX`). `drawGrid` uses `room.colX(x)` instead of `MAP_X + x * TILE`. `RoomView` gains `colX(x) = MAP_X + x * TILE`.
- With `shop === 'restaurant'`: tabs `'dining'` (`buildTabDining` "Bếp & bàn") and `'decor'` (`buildTabDecor`, existing), no pets tab, no gifts, no floor bar; the catalog is `catalogPage(group, page, open, [], filter, 'restaurant')`.
- The shop under the centre: `centreShop() = chain.street ? shopAt(cam.centre.x, true) : 'spa'`. Build, Dịch vụ and Nhân viên open for it:
  - Dịch vụ at the restaurant → a `choose` card: kicker "Nhà hàng", title "Thực đơn", lines "Phở bò · 60.000 đ" and "Bánh xèo và Chè ba màu: sắp có", one button "Đóng".
  - Nhân viên at the restaurant → kicker "Nhà hàng", title "Đầu bếp", line "Chưa thuê được đầu bếp. Cô chủ tự nấu và bưng.", button "Đóng".
  - The floor pill while centred on the restaurant: a tap on a locked floor toasts `restaurantNoFloors` "Nhà hàng chưa mở tầng trên"; changing between opened floors still works for the whole street (§4.1).
- `Hud.setShopLabel(side: ShopSide | null)`: a small pill at the map's top-right (`GAME_W − 24`, `MAP_Y + 24`, right-aligned) reading "Spa" or "Nhà hàng"; null hides it. Shown at the main shop once the restaurant is owned; updated when the centre crosses `restaurantX(0)`.

- [ ] **Step 1: Write the failing test** in `tests/view/catalog.test.ts`: `'offers the dining pieces and the shared decor at the restaurant'`: `catalogPage('dining', 0, ALL_SERVICES, [], 'all', 'restaurant')` holds exactly `stove`, `diningTable`, `diningChair`; the restaurant's decor pages hold the four restaurant decor pieces and `plant`, and no `bed`, `bench` or `desk`.

- [ ] **Step 2: Run and confirm it fails** (or passes already from Task 1; if so, keep it as a guard and go on).

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Build, test and browser check.** `npm run build`, `npm test`. In the browser: centre on the restaurant: the label reads "Nhà hàng"; Build shows "Bếp & bàn" and "Trang trí"; buy a table and two chairs on the empty lower half and see a new diner sit there; the bed is not in the catalog; dragging a plant works; selling the last stove shows the `lastDining` message. Centre on the spa: label "Spa", Build as before with no stove anywhere. Menu and Đầu bếp cards show their copy. Screenshot each.

- [ ] **Step 5: Commit.** Message: "Make Build mode, the menu, staff and the floor pill work on the shop under the screen's centre, with a Spa or Nhà hàng label and the restaurant's own furniture tabs".

---

### Task 13: The day summary's "Nhà hàng" line

**Files:**
- Modify: `src/view/summary.ts`, `src/scenes/SummaryScene.ts`, `src/scenes/SpaScene.ts` (pass the stats), `src/strings/vi.ts`
- Test: `tests/view/summary.test.ts`

**Interfaces:**
- Produces: `export function restaurantRows(stats: RestaurantStats): { label: StringKey; value: number; kind: 'count' | 'money' }[]` → `[{ 'restaurantServed', served, 'count' }, { 'restaurantIncome', income, 'money' }, { 'restaurantTips', tips, 'money' }]` (copy "Khách ăn", "Tiền món", "Tiền boa"; heading key `summaryRestaurant` "Nhà hàng").
- `summaryLayout(kinds, chainShops, notesH, restaurantRows = 0)`; `SummaryLayout` gains `restaurantTop: number`. When `restaurantRows > 0`, a block (heading + rows + `CHAIN_PAD`) starts at `restaurantTop`, after the chain block, using the compact layout (same row heights as the chain block), and the card lifts the same way; with 0 it returns exactly what it does today.
- `SummaryData` gains `restaurant: RestaurantStats | null` (null at a branch day or before buying). The restaurant's money is already in the purse; it is not added to `summaryRows`, `dayProfit`, `chainSummaryRows`, the chain total, quests, records, rank or away money (§4.15).

- [ ] **Step 1: Write the failing tests:**
  - `'lists the restaurant's diners, dish money and tips'`: `restaurantRows({ served: 4, income: 240_000, tips: 35_000, walkedAway: 1 })` equals the three rows above with those values.
  - `'lays out a card with the restaurant block below the chain block'`: for the usual spa kinds, `summaryLayout(kinds, 1, 0, 3)` has `restaurantTop >= chainTop + 3 * chainRowH` (heading, one shop, total), `buttonY - restaurantTop >= 4 * chainRowH`, and `top + cardH <= GAME_H - 40`; `summaryLayout(kinds, 0, 0, 3)` uses the compact row heights.
  - `'keeps the card as it was with no restaurant'`: the existing `summaryLayout` cases pass unchanged with the fourth argument left out.
  - `'leaves the spa's profit alone'`: `dayProfit` of the spa stats is the same whether or not a restaurant block is shown (the rows function takes no spa stats).

- [ ] **Step 2: Run and confirm they fail.**

- [ ] **Step 3: Implement**; `SpaScene`'s `dayEnded` handler passes `chain.restaurant?.stats ?? null`, read before `chain.startDay()` resets it.

- [ ] **Step 4: Run whole suite + build.**

- [ ] **Step 5: Commit.** Message: "Add a Nhà hàng block to the day summary with its diners, dish money and tips, kept apart from the spa's profit, quests, records and rank".

---

### Task 14: Version re-check, full checks, review, ship

- [ ] **Step 1: Re-check the save version against origin/master.**
  Run: `git fetch && git show origin/master:src/sim/save.ts | grep SAVE_VERSION`.
  If origin/master's `SAVE_VERSION` is no longer 35, set `RESTAURANT_SAVE_VERSION` to that number + 1, add the old number to `parseVersioned`'s list, update the one `'is the restaurant version'` assertion, and merge origin/master into the branch in a temporary worktree first if it moved (see the memory note on shared checkouts). Then write `tests/fixtures/save-v<RESTAURANT_SAVE_VERSION>.json` from a day-12 chain with the restaurant bought and two diners, and add `'loads the restaurant fixture'` to `tests/sim/save.test.ts` (it parses, has 2 stoves, 2 diners).

- [ ] **Step 2: Run everything.** Run: `npm test` then `npm run build`. Expected: every test passes, including `tests/sim/same-draws.test.ts`, and the build succeeds.

- [ ] **Step 3: Browser checks** (spec §9; build the dev bundle into `D:/Project/spa-indie-game/.superpowers/dist-nha-hang`, serve with `vite preview` in the background, gstack `$B` at 390×780, synthesized `mousedown`/`mousemove`/`mouseup` on the canvas only, with no extra `mouseup` on `window`; the gstack browser is shared, so use one tab only). Screenshot each:
  1. The old house has its sign; a roof tap opens the buy card from day 10 (toast before).
  2. After buying, a swipe right shows the restaurant; zoomed all the way out shows the whole street.
  3. A diner sits and holds a ticket; tapping it from the spa sends the owner by bike, she cooks Phở, carries it, and the diner pays.
  4. The strip shows two blocks; a red dot sits over the right shop.
  5. Extra table, chairs and stove placed in the restaurant; a spa bed cannot be placed there.
  6. In the evening the restaurant's lamps are on; in a power cut the stoves stop.
  7. A branch plays as before (open it, play a customer, come back).
  8. Swiping along the street does not stutter (watch the frame time in the dev overlay or `performance.now()` deltas over a 3 s pan; no frame above 50 ms).
  9. A v35 save from before the branch loads and plays with no restaurant until it is bought.

- [ ] **Step 4: Final review.** Run `review-package` against the merge base. A fresh reviewer on the most capable model gets this plan, the spec and the Review Focus. Run one fix pass; each fix gets a test or browser check that fails first, then the whole suite.

- [ ] **Step 5: Ship.**
  1. Fetch and check origin/master and the branch log. If master moved, integrate in a temporary worktree and re-run Step 1's version check and the whole suite there.
  2. Fast-forward master and push.
  3. Write the memory file `nha-hang.md` (lô A live: commit, save version; lô B next) and its line in `MEMORY.md`.
  4. Report to Chồng yêu.
