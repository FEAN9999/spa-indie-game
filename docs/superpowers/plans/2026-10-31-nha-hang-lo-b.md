# Nhà hàng lô B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The restaurant gets its other two dishes, Bánh xèo and Chè ba màu, each with its own cooking mini-game. It also gets cooks who serve diners on their own, one stock item per dish plus shared rau thơm, and a guided first cook (lesson) for each of the three dishes. A dish whose stock runs out stops selling.

**Architecture:**
- The new dish rules are pure classes beside `PhoGame`: `BanhXeoGame` in `src/sim/banhXeo.ts` and `CheGame` in `src/sim/che.ts`. A small `src/sim/menu.ts` holds what is shared by dish: ids, stock items, ticket drawing.
- Cooks are pure helpers in `src/sim/chefs.ts`. `RestaurantSim` runs them, keeps the stock, learned dishes, wages and its own away book. It still reads only the host's purse, clock, day, power and staff names.
- The view gets:
  - two cook scenes that share the ticket and pill code with `PhoScene` through `src/view/cook.ts`;
  - a `MenuScene` (menu and stock) and a `ChefScene` (cooks), opened by Dịch vụ and Nhân viên when the screen centre is on the restaurant;
  - cooks drawn by `RestaurantLayer`.

**Tech Stack:** Phaser 4.2.1, TypeScript, Vite 8, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-nha-hang-design.md`. Lô B covers §4.5 point 5, §4.9, §4.10 (Bánh xèo, Chè), §4.11, §4.12, §4.13, §4.14, §4.15 (cook wages, stock, away money), §8 (lô B fields), §9 lô B and §10. Use **§10's numbers**, which were updated at the lô A ship and replace the older ones in the text above it. Lô A's plan is `docs/superpowers/plans/2026-10-31-nha-hang-lo-a.md`, and its code is the pattern for everything here.

## Global Constraints

- **Not in lô B:** restaurant houses, floor 2, the rooftop (lô C), cook courses, levels and traits, any 4th dish. The restaurant still has `floors = 1` and no houses, so the cook cap is 2.
- **Fixed decisions (do not reopen):**
  - dish money is halved and one-off prices are ×1.5, against the spec's §4 text;
  - the restaurant keeps its own stats, apart from spa quests, rank and records;
  - the ticket always has a third "always" line (Phở herb, Bánh xèo sprouts, Chè coconut), and a hard diner gets the "Thêm …" version of it;
  - restaurant logic stays out of `SpaSim`;
  - all restaurant draws come from the restaurant's own rng (`same-draws` must not change);
  - the game freezes while a cook scene is open (`cookingDinerId`).
- **Numbers (`src/config.ts`, restaurant block). Each one is a proposal ("em đề xuất") unless marked:**
  - `DISH_PRICE = { pho: 30_000, banhXeo: 28_000, che: 18_000 }`. These are the spec's 55k and 35k halved and rounded, and §10 already holds them.
  - `RESTAURANT_RESTOCK_PRICE = { phoKit: 200_000, batter: 180_000, cheKit: 120_000, herbs: 40_000 }`, for 20 portions each. These are half of §10's 400/360/240/80k, because dish money was halved. Keeping §10's numbers would spend about 80% of a Phở's 30k on stock, while spa stock runs about 30–45% of the service price.
  - The restaurant's stock uses the spa's `RESTOCK_AMOUNT` (20), `STOCK_START` (20) and `LOW_STOCK` (5).
  - `CHEF_CAP = { base: 2, perFloor: 2, perHouse: 1, max: 10 }` (spec, approved). `CHEF_WAGE_PER_DOT = 5_000`. A cook has two stats, so each dot counts double the spa's 2.500. A 2/2 cook earns 30.000, the same as an all-2 technician.
  - Bánh xèo:
    - `BX_LIMIT_MS = 25_000`;
    - `BX_PAN = { x: 430, y: 1110 }`, `BX_RING = { inner: 90, outer: 330 }`, `BX_SECTORS = 24`;
    - `BX_SPREAD_MIN = 0.3`, `BX_SPREAD_GOOD = 0.85`;
    - `BX_BROWN_MS = 6_000`;
    - `BX_BAND = { vua: [0.45, 0.62], ky: [0.68, 0.85] }`, `BX_BAND_HARD_SHRINK = 0.04`, `BX_FOLD_NEAR = 0.08`.
  - Chè:
    - `CHE_LIMIT_MS = 25_000`;
    - `CHE_POUR_MS = 3_000` (holding fills the whole glass in this time);
    - `CHE_LAYER_THICK = { beans: [0.3, 0.3, 0.15], jelly: [0.2, 0.2, 0.35] }` (bottom to top: red bean, mung bean, jelly);
    - `CHE_LAYER_TOL = 0.05`, `CHE_LAYER_TOL_HARD = 0.035`;
    - `CHE_ICE_TAPS = { little: 6, lots: 12 }`, `CHE_ICE_MS_PER_TAP = 400`;
    - `CHE_POUR_PASSES = { base: 4, extra: 6 }`, `CHE_PASS_PX = 220`.
- **Save:** add `RESTAURANT_B_SAVE_VERSION` in `src/sim/save.ts`, with `SAVE_VERSION = RESTAURANT_B_SAVE_VERSION`. Its value is **origin/master's SAVE_VERSION + 1 at merge time**, which is 38 while master is at 37. The controller re-checks it right before merging, so tests name the constant and never the number. The only exception is the one `'is version …'` case.
- **Copy (Vietnamese, exact).** New keys in `src/strings/vi.ts`:
  - Dish names: `dishPho` "Phở bò", `dishBanhXeo` "Bánh xèo", `dishChe` "Chè ba màu".
  - Stock names: `rstockPhoKit` "Nguyên liệu phở", `rstockBatter` "Bột bánh xèo", `rstockCheKit` "Đồ chè", `rstockHerbs` "Rau thơm".
  - Stock toast: `menuStockOut` "Hết {item}. Nhập thêm ở Thực đơn". A running-low item reuses `stockLow` "{item} sắp hết".
  - Menu panel:
    - `menuIntro` "Mỗi món tốn 1 phần nguyên liệu và 1 rau thơm. Hết thì món đó tạm ngưng.";
    - `menuDish` "{name} · {money}";
    - `menuLeft` "Còn {n} phần";
    - `menuPaused` "Hết, tạm ngưng bán";
    - `menuHerbsUse` "Dùng cho mọi món".
    - The button reuses `restock` "Nhập {n} · {money}".
  - Cook panel:
    - `chefTitle` "Đầu bếp" (kept);
    - `chefIntro` "Đầu bếp tự nhận khách, tự nấu, tự bưng. Nhà hàng thuê tối đa {n} người.";
    - `chefFull` "Nhà hàng đã đủ {n} đầu bếp";
    - `roleChef` "Đầu bếp".
    - The panel reuses `tabWorking`, `tabHiring`, `hire`, `letGo`, `letGoConfirm`, `wagePerDay`, `statSkill`, `statSpeed` and `hireNoMoney`.
  - Summary rows: `restaurantWages` "Lương đầu bếp", plus the existing `restockCost` "Nhập hàng".
  - Away card: "Nhà hàng" comes from `restaurantKicker` inside the existing `awayFrom` line.
  - Bánh xèo copy is in Task 9 and Chè copy in Task 10. Lesson lines are in Tasks 8–10.
  - **Remove** `menuPho`, `menuSoon` and `chefLine`. **Change** `restaurantLine2` to "Bán Phở, Bánh xèo và Chè ngay hôm nay."
- **Files are CRLF.** Edit with the Edit tool, or with Python using `newline=''` and `encoding='utf-8'`.
- **Commits:** one plain descriptive sentence each, present tense, with no `feat:` prefix and no attribution lines.
- **Commands:**
  - `npx vitest run <file>` runs one file and `npm test` runs all.
  - `npx tsc --noEmit` checks types.
  - `npm run build` runs `tsc --noEmit && vite build`.
- **Worktree:** work only in `D:\Project\spa-indie-game\.claude\worktrees\sad-lehmann-cc9fc8` (branch `claude/sad-lehmann-cc9fc8`). Its `node_modules` is a junction to the main repo's, so never `rm -rf` it. Never touch the main folder or another worktree.

## Review Focus

1. **The owner goes to a branch while a cook is working.** The cook's diner still gets the dish and pays. Ticket holders nobody has taken stay for the cook. Only the owner's own diner leaves quietly, and new diners keep coming while a cook works. Test: Task 5, `'keeps serving with a cook while the owner is at a branch'`.
2. **Stock runs out mid-day.** Diners already seated with that dish still get it, because portions are reserved at seating. No new diner orders it. With every dish out, nobody walks in and no spa customer walks over. Test: Task 4, `'reserves a seated diner's portion and stops the dish when none is left'`.
3. **Save and reload while a cook is cooking.** The cook keeps the task and the stove. The dish is neither lost nor paid twice. A cook whose diner is gone after the load stands idle. Test: Task 7, `'reloads a cook mid-cook and serves the dish once'`.
4. **Letting a cook go mid-cook.** The dish is finished and carried, then the cook walks out. Today's wage is counted once: at the letting go, not again at closing. Test: Task 5, `'finishes the dish of a cook let go mid-cook and pays the wage once'`.
5. **A power cut.** A cook's cooking timer stops, and no cook takes a new ticket. Both resume when the power returns. The owner's tap still gets the `powerWait` toast. Test: Task 5, `'stops a cook's stove in a power cut and goes on after'`.

---

## File Structure

**Create**
- `src/sim/banhXeo.ts`: the Bánh xèo ticket, spread coverage, fold band, star rule and `BanhXeoGame`.
- `src/sim/che.ts`: the Chè ticket, layer marks, star rule and `CheGame`.
- `src/sim/menu.ts`: `DishId`, `DISH_IDS`, `DishTicket`, the restaurant's stock items, `DISH_STOCK`, `fullRestaurantStock`, `drawTicket`.
- `src/sim/chefs.ts`: `Chef`, `ChefCandidate`, `ChefTask`, `chefCap`, `chefWage`, `makeChefCandidate`, `cookMs`, `chefSkill`.
- `src/art/banhXeoArt.ts`, `src/art/cheArt.ts`: the two cook cards' pictures.
- `src/art/menuArt.ts`: the dish icons and the restaurant stock icons.
- `src/view/cook.ts`: what the three cook scenes share: `CookData`, `COOK_SCENE`, `ticketLines`, `addTicket`, `PILL`, `drawPills`.
- `src/scenes/BanhXeoScene.ts`, `src/scenes/CheScene.ts`, `src/scenes/MenuScene.ts`, `src/scenes/ChefScene.ts`.
- Tests:
  - `tests/sim/banhXeo.test.ts`, `tests/sim/che.test.ts`, `tests/sim/menu.test.ts`, `tests/sim/chefs.test.ts`, `tests/sim/restaurant-b.test.ts`;
  - `tests/view/cook.test.ts`;
  - `tests/art/banhXeoArt.test.ts`, `tests/art/cheArt.test.ts`, `tests/art/menuArt.test.ts`;
  - `tests/fixtures/save-v38.json` (renamed to the merge-time number).

**Modify**
- Sim and save: `src/config.ts`, `src/sim/restaurant.ts`, `src/sim/street.ts` (only if a test needs it), `src/sim/chain.ts`, `src/sim/away.ts` (the `places` type), `src/sim/save.ts`.
- Strings: `src/strings/vi.ts`.
- Scenes and views: `src/scenes/PhoScene.ts`, `src/scenes/SpaScene.ts`, `src/scenes/SummaryScene.ts`, `src/scenes/BootScene.ts`, `src/main.ts`, `src/view/RestaurantLayer.ts`, `src/view/summary.ts`, `src/view/away.ts`.
- Tests: `tests/sim/restaurant.test.ts` (diners now draw a dish), `tests/sim/save.test.ts`, `tests/view/summary.test.ts`, `tests/view/away.test.ts`.

---

### Task 1: Bánh xèo rules

**Files:**
- Create: `src/sim/banhXeo.ts`
- Modify: `src/config.ts` (the `BX_*` constants from Global Constraints)
- Test: `tests/sim/banhXeo.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Filling = 'tom' | 'thit'
  export type Crisp = 'vua' | 'ky'
  export interface BanhXeoTicket { filling: Filling; crisp: Crisp; extraSprouts: boolean }
  export type BxTopping = 'tom' | 'thit' | 'gia'
  export type FoldResult = 'in' | 'near' | 'far'
  export type BanhXeoPhase = 'spread' | 'fill' | 'fold' | 'done'
  export function drawBanhXeoTicket(rng: Rng, hard: boolean): BanhXeoTicket   // two rolls in order: filling (<0.5 tom), crisp (<0.5 vua); extraSprouts = hard
  export function spreadCoverage(points: { x: number; y: number }[]): number   // share of BX_SECTORS sectors around BX_PAN hit by a point whose distance from BX_PAN is in [BX_RING.inner, BX_RING.outer]
  export function foldBand(t: BanhXeoTicket, hard: boolean): [number, number]  // BX_BAND[crisp], each edge moved in by BX_BAND_HARD_SHRINK when hard
  export function fillMatches(t: BanhXeoTicket, counts: Record<BxTopping, number>): boolean  // the ticket's filling ≥ 1, the other filling 0, gia ≥ (extraSprouts ? 2 : 1)
  export function banhXeoStars(r: { spread: number; fold: FoldResult; ticketOk: boolean }): Stars
  export class BanhXeoGame {
    phase: BanhXeoPhase; elapsedMs: number; readonly limitMs: number
    spread: number      // the coverage of the swirl that counted, 0 until then
    brown: number       // 0..1 while folding
    fold: FoldResult | null
    counts: Record<BxTopping, number>
    constructor(readonly ticket: BanhXeoTicket, readonly hard?: boolean)
    swirl(points: { x: number; y: number }[]): 'good' | 'thin' | 'short' | null
    add(t: BxTopping): void
    doneFilling(): void
    foldNow(): FoldResult | null
    tick(ms: number): void
    progress(): number
    stars(): Stars | null
  }
  ```
- The rules:
  - `banhXeoStars` = 1, +1 if `spread >= BX_SPREAD_GOOD`, +1 if `fold === 'in'`, −1 if `fold === 'far'`, −1 if `!ticketOk`, clamped to 1..3.
  - `swirl` works only in `'spread'`. Below `BX_SPREAD_MIN` it returns `'short'` and the phase stays. Otherwise it sets `spread`, moves to `'fill'` and returns `'good'` (≥ GOOD) or `'thin'`.
  - `doneFilling` moves `'fill'` → `'fold'`.
  - `tick` runs only in `'fold'`, where it adds `ms / BX_BROWN_MS` to `brown`. At `brown >= 1` it folds by itself.
  - `foldNow` in `'fold'` scores `brown` against `foldBand`: `'in'` inside the band, `'near'` when less than `BX_FOLD_NEAR` outside it, `'far'` otherwise. Then it finishes.
  - When time runs out, the game finishes with `fold ?? 'far'`.
  - `progress`: `'spread'` 0, `'fill'` 0.35, `'fold'` `0.6 + 0.4 * brown`, `'done'` 1.

- [ ] **Step 1: Write the failing tests** in `tests/sim/banhXeo.test.ts`:
  - `'draws the filling then the crispness, and gives a hard diner extra sprouts'`: with `rng` returning 0.2 then 0.7, `drawBanhXeoTicket(rng, true)` is `{ filling: 'tom', crisp: 'ky', extraSprouts: true }`.
  - `'measures a full ring as full and a half ring as half'`: points every 5° at radius 200 around `BX_PAN` give 1. The same over 180° give 0.5 ± 1/24. Points at radius 40 give 0.
  - `'needs a long enough swirl'`: a quarter ring returns `'short'` and the phase stays `'spread'`. A full ring then returns `'good'` and the phase becomes `'fill'`.
  - `'matches the fillings to the ticket'`: for `{ filling: 'tom', crisp: 'vua', extraSprouts: false }`, `{ tom: 1, thit: 0, gia: 1 }` matches. `{ tom: 1, thit: 1, gia: 1 }` does not, and neither does `{ tom: 1, thit: 0, gia: 0 }`. With `extraSprouts`, `gia: 1` does not match and `gia: 2` does.
  - `'browns over BX_BROWN_MS and folds by itself when burnt'`: after `doneFilling`, `tick(BX_BROWN_MS / 2)` gives `brown` 0.5. A further `tick(BX_BROWN_MS)` ends the game with `fold === 'far'`.
  - `'scores a fold in the band, near it and far from it'`: for `crisp: 'vua'`, folding at brown 0.5 gives `'in'`, at 0.4 gives `'near'`, at 0.2 gives `'far'`. For a hard diner at 0.46, the result is `'near'`.
  - `'scores stars like Phở'`: `{ spread: 0.9, fold: 'in', ticketOk: true }` → 3; `{ 0.5, 'in', true }` → 2; `{ 0.9, 'far', true }` → 1; `{ 0.9, 'in', false }` → 2; `{ 0.2, 'far', false }` → 1.
  - `'finishes on time with whatever was done'`: `tick(BX_LIMIT_MS)` in `'spread'` gives `phase === 'done'` and `stars() === 1`.

- [ ] **Step 2: Run and confirm they fail.** Run `npx vitest run tests/sim/banhXeo.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `src/sim/banhXeo.ts` and the constants. `spreadCoverage` maps `atan2(dy, dx)` into `BX_SECTORS` equal sectors and counts the distinct sectors hit.

- [ ] **Step 4: Run** `npx vitest run tests/sim/banhXeo.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit.** Message: "Add the Bánh xèo rules: a swirl that must cover the pan, fillings to the ticket, and a fold timed into the ticket's crispness band".

---

### Task 2: Chè ba màu rules

**Files:**
- Create: `src/sim/che.ts`
- Modify: `src/config.ts` (the `CHE_*` constants)
- Test: `tests/sim/che.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type CheMix = 'beans' | 'jelly'
  export type IceAmount = 'little' | 'lots'
  export interface CheTicket { mix: CheMix; ice: IceAmount; extraCoconut: boolean }
  export type ChePhase = 'layer' | 'ice' | 'pour' | 'done'
  export const CHE_LAYERS = ['redBean', 'mungBean', 'jelly'] as const
  export function drawCheTicket(rng: Rng, hard: boolean): CheTicket          // rolls in order: mix (<0.5 beans), ice (<0.5 little); extraCoconut = hard
  export function layerMarks(t: CheTicket): [number, number, number]           // running sums of CHE_LAYER_THICK[mix]: beans [0.3, 0.6, 0.75], jelly [0.2, 0.4, 0.75]
  export function cheStars(r: { goodLayers: number; iceFast: boolean; pourDone: boolean }): Stars
  export class CheGame {
    phase: ChePhase; elapsedMs: number; readonly limitMs: number
    layer: number         // the layer being poured, 0..2
    level: number         // the glass's fill, 0..1, carried on from layer to layer
    goodLayers: number
    taps: number; iceMs: number; iceFast: boolean
    passes: number
    constructor(readonly ticket: CheTicket, readonly hard?: boolean)
    hold(ms: number): void
    release(): 'good' | 'off' | null
    tap(): void
    swipeTo(x: number): boolean   // true when this move counted a pass
    endSwipe(): void
    iceTarget(): number           // CHE_ICE_TAPS[ice]
    passTarget(): number          // extraCoconut ? CHE_POUR_PASSES.extra : base
    tick(ms: number): void
    progress(): number
    stars(): Stars | null
  }
  ```
- The rules:
  - `cheStars` = 1, +1 if `goodLayers >= 2`, +1 if `iceFast`, −1 if `goodLayers === 0`, −1 if `!pourDone`, clamped to 1..3.
  - **Layering:**
    - `hold` adds `ms / CHE_POUR_MS` to `level` in `'layer'`, and releases on its own at 1.
    - `release` does nothing at a level no higher than where this layer started.
    - A released layer is good when `|level − layerMarks[layer]| ≤ (hard ? CHE_LAYER_TOL_HARD : CHE_LAYER_TOL)`.
    - After the third layer the phase is `'ice'`.
  - **Ice:**
    - `tick` adds to `iceMs` in `'ice'`.
    - `tap` counts in `'ice'`. At `iceTarget()` taps the phase becomes `'pour'`, with `iceFast = iceMs <= CHE_ICE_MS_PER_TAP * iceTarget()`.
  - **Pouring:**
    - `swipeTo` counts passes in `'pour'` and returns true on the move that counted one.
    - The first pass is the first time the finger is `CHE_PASS_PX` from the swipe's start, in either direction.
    - Each later pass needs `CHE_PASS_PX` back the other way from the furthest point reached. Moving on in the same direction only pushes that furthest point.
    - `endSwipe` forgets the anchor and the direction.
    - At `passTarget()` passes the game finishes with `pourDone = true`.
  - **Time out:** the game finishes with `pourDone = false`.
  - **Progress:** `'layer'` `level * 0.4`; `'ice'` `0.4 + 0.3 * taps / iceTarget()`; `'pour'` `0.7 + 0.3 * passes / passTarget()`; `'done'` 1.

- [ ] **Step 1: Write the failing tests** in `tests/sim/che.test.ts`:
  - `'draws the mix then the ice, and gives a hard diner more coconut'`: with rng 0.7 then 0.2, `drawCheTicket(rng, true)` is `{ mix: 'jelly', ice: 'little', extraCoconut: true }`.
  - `'puts the bean marks higher for nhiều đậu'`: `layerMarks` gives beans `[0.3, 0.6, 0.75]` and jelly `[0.2, 0.4, 0.75]`, each to 1e-9.
  - `'layers on from the last level and scores each against its mark'`: for beans, `hold(0.3 * CHE_POUR_MS)` then `release()` gives `'good'`. Then `hold(0.1 * CHE_POUR_MS)` and `release()` (level 0.4 against 0.6) gives `'off'`. Then `hold(0.35 * CHE_POUR_MS)` and `release()` (level 0.75) gives `'good'`. Afterwards `goodLayers` is 2 and the phase is `'ice'`.
  - `'narrows the mark for a hard diner'`: a release 0.045 off the mark is good for a plain diner and off for a hard one.
  - `'ignores a release before any pouring'`: a `release()` at the layer's start level returns null and the layer does not advance.
  - `'crushes the ice in iceTarget taps and rewards a fast hand'`: on `ice: 'little'`, six taps with `tick(300)` between them give phase `'pour'` and `iceFast` true. Six taps with `tick(500)` between them give `iceFast` false.
  - `'counts a pass each way across the glass'`: `swipeTo(300)`, `swipeTo(530)` → true (1 pass); `swipeTo(600)` → false (it pushes the far point); `swipeTo(370)` → true (2 passes); `swipeTo(250)` → false.
  - `'finishes when the coconut is poured, and scores'`: `cheStars({ goodLayers: 3, iceFast: true, pourDone: true })` is 3; `{ 2, false, true }` 2; `{ 0, true, true }` 1; `{ 3, true, false }` 2; `{ 0, false, false }` 1.
  - `'finishes on time without the coconut'`: `tick(CHE_LIMIT_MS)` gives `'done'`, and since the pour is not done the stars are 1.

- [ ] **Step 2: Run** `npx vitest run tests/sim/che.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement** `src/sim/che.ts` and the constants.

- [ ] **Step 4: Run** `npx vitest run tests/sim/che.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit.** Message: "Add the Chè ba màu rules: three layers held to their marks, ice crushed by quick taps, and coconut milk poured in passes across the glass".

---

### Task 3: The menu module and the cook helpers

**Files:**
- Create: `src/sim/menu.ts`, `src/sim/chefs.ts`
- Modify: `src/config.ts` (`DISH_PRICE`, `RESTAURANT_RESTOCK_PRICE`, `CHEF_CAP`, `CHEF_WAGE_PER_DOT`), `src/sim/restaurant.ts` (it now imports `DishId` from `menu.ts` and re-exports it)
- Test: `tests/sim/menu.test.ts`, `tests/sim/chefs.test.ts`

**Interfaces:**
- Produces in `menu.ts`:
  ```ts
  export type DishId = 'pho' | 'banhXeo' | 'che'
  export const DISH_IDS: readonly DishId[] = ['pho', 'banhXeo', 'che']
  export type DishTicket = PhoTicket | BanhXeoTicket | CheTicket
  export type RestaurantStockItem = 'phoKit' | 'batter' | 'cheKit' | 'herbs'
  export const RESTAURANT_STOCK_ITEMS: readonly RestaurantStockItem[] = ['phoKit', 'batter', 'cheKit', 'herbs']
  export const DISH_STOCK: Record<DishId, Exclude<RestaurantStockItem, 'herbs'>> = { pho: 'phoKit', banhXeo: 'batter', che: 'cheKit' }
  export type RestaurantStock = Record<RestaurantStockItem, number>
  export const fullRestaurantStock = (): RestaurantStock   // STOCK_START of each
  export function drawTicket(dish: DishId, rng: Rng, hard: boolean): DishTicket
  export const DISH_NAME: Record<DishId, StringKey>          // dishPho, dishBanhXeo, dishChe
  export const RSTOCK_NAME: Record<RestaurantStockItem, StringKey>
  ```
- Produces in `chefs.ts`:
  ```ts
  export interface ChefStats { skill: number; speed: number }
  export type DishTiers = Record<DishId, number>
  export interface ChefCandidate { name: string; look: Look; stats: ChefStats; wage: number; rare: boolean; tiers: DishTiers }
  export type ChefTask =
    | { kind: 'order'; dinerId: number }
    | { kind: 'cook'; dinerId: number; stoveId: number; leftMs: number }
    | { kind: 'carry'; dinerId: number; stars: Stars }
    | { kind: 'exit' }
  export interface Chef extends ChefCandidate, Mover { id: number; task: ChefTask | null; leaving: boolean }
  export const chefWage = (s: ChefStats): number          // WAGE_BASE + (skill + speed − 2) × CHEF_WAGE_PER_DOT
  export function chefCap(floors: number, houses: number): number   // min(max, base + (floors − 1) × perFloor + houses × perHouse)
  export function makeChefCandidate(rng: Rng, taken: string[]): ChefCandidate
  export const cookMs = (c: ChefCandidate, dish: DishId): number   // max(round(workMs(speed) × TIER_WORK_FACTOR ** tiers[dish]), WORK_FLOOR_MS)
  export const chefSkill = (c: ChefCandidate, dish: DishId): number  // min(5, skill + tiers[dish]); stars come from staffStars(chefSkill, roll)
  ```
- `makeChefCandidate` draws in this order:
  1. rare (`< RARE_CHANCE`);
  2. skill;
  3. speed (each `rare ? 4 + ⌊2r⌋ : 1 + ⌊3r⌋`);
  4. `randomLook`;
  5. a name from `STAFF_NAMES` not in `taken`;
  6. the specialty dish, `DISH_IDS[⌊3r⌋]`, at `rare ? RARE_TIER : 1`, with the other dishes at 0.

- [ ] **Step 1: Write the failing tests.**
  - `tests/sim/menu.test.ts`:
    - `'maps each dish to its own stock item'`;
    - `'starts a bought restaurant with STOCK_START of everything'`;
    - `'draws each dish's own ticket'`: `drawTicket('che', …)` has `mix` and `ice`, `'banhXeo'` has `filling`, `'pho'` has `doneness`;
    - `'prices the dishes from §10'`: `DISH_PRICE` equals `{ pho: 30_000, banhXeo: 28_000, che: 18_000 }`.
  - `tests/sim/chefs.test.ts`:
    - `'pays a cook like a technician'`: `chefWage({ skill: 2, speed: 2 })` is 30_000 and `{ 1, 1 }` is 20_000;
    - `'allows two cooks in a one-floor restaurant and never more than ten'`: `chefCap(1, 0)` is 2, `chefCap(3, 4)` is 10, `chefCap(2, 1)` is 5;
    - `'gives a candidate one specialty and a free name'`: over 50 seeds, exactly one dish has a tier > 0, the name is never in `taken`, and the stats are in 1..5;
    - `'cooks faster with speed and specialty, never under the floor'`: `cookMs` with speed 1 and tier 0 is `STAFF_WORK_MS_SLOW`; tier 1 is shorter; speed 5 with tier 3 is `WORK_FLOOR_MS`;
    - `'adds the specialty to the skill for the star roll'`: `chefSkill` for skill 3, tier 2 is 5, and for skill 4, tier 3 is still 5.

- [ ] **Step 2: Run** `npx vitest run tests/sim/menu.test.ts tests/sim/chefs.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement** both modules and the constants. Add the dish and stock name keys to `vi.ts`.

- [ ] **Step 4: Run** both files, then `npx tsc --noEmit`. Expected: PASS and no type errors.

- [ ] **Step 5: Commit.** Message: "Add the restaurant's menu of three dishes with their stock items and prices, and the cook's stats, wage, cap, cooking time and star skill".

---

### Task 4: Diners order any dish, and the stock runs down

**Files:**
- Modify: `src/sim/restaurant.ts`
- Test: `tests/sim/restaurant-b.test.ts` (new), `tests/sim/restaurant.test.ts` (fix only the tests that assumed Phở: pass `dish: 'pho'` to `spawnDiner`)

**Interfaces:**
- Consumes: Task 3's `menu.ts`.
- Produces on `RestaurantSim`:
  - `stock: RestaurantStock`, which starts at `fullRestaurantStock()`.
  - `Diner.ticket: DishTicket`.
  - `Diner.chefId: number | null`, which is null at seating (Task 5 sets it).
  - `spawnDiner(opts: { kind?; look?; dish?: DishId })`.
  - `portionsLeft(dish: DishId): number`: the lower of the dish's own stock and the herbs. Each one counts the stock less the portions held by diners not yet cooked for, meaning diners in `street`, `arriving`, `toChair` or `ordering` (only their own dish counts against the dish's item; every diner counts against the herbs).
  - `sellableDishes(): DishId[]`: `DISH_IDS` with `portionsLeft > 0`, and none at all when there is no stove.
  - `restock(item: RestaurantStockItem): void`: takes the price even when the purse is short, as the spa does. It adds `RESTOCK_AMOUNT` and adds the price to `stats.restock`.
  - `RestaurantStats` gains `wages`, `restock`, `ownerCooked` and `chefCooked`, all 0 in `emptyStats`.
  - A new event: `{ type: 'stockLow'; item: RestaurantStockItem; out: boolean }`.
- Behaviour:
  - `addDiner` picks the dish uniformly from `sellableDishes()` with one rng draw when there are two or more, then draws its ticket.
  - The step skips a walk-in when nothing is sellable, without a `dinerPassed` event.
  - `walkOver` already refuses when `sellableDishes()` is empty.
  - **Taking the stock:** when a diner moves to `waitingFood` (the owner's path today, the cook's path in Task 5), their dish item and one herb leave the stock. The step does this through one private `takePortion(d)`. When an item lands on `LOW_STOCK` it emits `stockLow` with `out: false`; when it lands on 0 it emits `out: true`.
  - **Restocking alone:** while `ownerAway`, each step restocks every item at or under `LOW_STOCK` that the purse can pay for.
  - **`cookReady`** gains `dish: DishId`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/restaurant-b.test.ts`, using `setup` as in `restaurant.test.ts`:
  - `'seats diners with every dish on the menu'`: over 60 `spawnDiner()` calls, with diners cleared between them, each of the three dishes appears, and each diner's ticket fits its dish.
  - `'reserves a seated diner's portion and stops the dish when none is left'`: set `stock.batter = 1`, then `spawnDiner({ dish: 'banhXeo' })`. Now `portionsLeft('banhXeo')` is 0 and `sellableDishes()` lacks `'banhXeo'`. Serve that diner through the owner: `stock.batter` is 0 and a `stockLow` event with `out: true` is drained. Set every item to 0: `sellableDishes()` is `[]`, a step past the walk-in timer with `autoSpawn` seats nobody, and `walkOver` of a happy customer returns false.
  - `'takes one herb for every dish'`: two diners served leave `stock.herbs` at `STOCK_START - 2`.
  - `'restocks at the purse's cost, even short of money'`: `restock('cheKit')` with money 0 leaves money at `-RESTAURANT_RESTOCK_PRICE.cheKit`, `stock.cheKit` at `STOCK_START + RESTOCK_AMOUNT` and `stats.restock` at that price.
  - `'restocks a low item by itself while the owner is at a branch'`: `ownerAway = true` and `stock.herbs = LOW_STOCK`. One `advance(STEP_MS)` raises the herbs by `RESTOCK_AMOUNT`.
  - `'tells the view which dish to cook'`: the owner takes a Chè diner and `cookReady` carries `dish: 'che'`.

- [ ] **Step 2: Run** `npx vitest run tests/sim/restaurant-b.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.** Then fix `tests/sim/restaurant.test.ts` where it assumed Phở or Phở-only rng draws, by passing `dish: 'pho'`. Do not weaken any assertion.

- [ ] **Step 4: Run** `npx vitest run tests/sim/restaurant-b.test.ts tests/sim/restaurant.test.ts tests/sim/street.test.ts tests/sim/same-draws.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit.** Message: "Let diners order Phở, Bánh xèo or Chè from what the stock still covers, take a portion and a herb when the dish is cooked, and restock by hand or by itself while the owner is away".

---

### Task 5: Cooks who serve on their own, their wages and the day's close

**Files:**
- Modify: `src/sim/restaurant.ts`, `src/sim/chain.ts`, `src/config.ts` (if a constant is missing)
- Test: `tests/sim/restaurant-b.test.ts`

**Interfaces:**
- Consumes: Task 3's `chefs.ts` and Task 4's `takePortion`.
- Produces on `RestaurantSim`:
  - `chefs: Chef[]`, `nextChefId`, `candidates: ChefCandidate[]` and `candidatesDay: number` (0 means never drawn).
  - `todayCandidates(): ChefCandidate[]` draws `CANDIDATES_PER_DAY` candidates when `candidatesDay !== day`. Taken names are the cooks' plus the host's staff names, which means adding `'staff'` to `RestaurantHost`.
  - `chefCap(): number` returns `chefCap(this.floors, housesBought(this.houses))`.
  - `hireProblem(index): 'money' | 'full' | null`: `'money'` when the purse is below 0, and `'full'` when the cooks not leaving reach the cap.
  - `hire(index): 'money' | 'full' | null`: the cook appears on the door tile and walks home.
  - `fire(id)`, which mirrors the spa's `fire`:
    - after `dayClosed`, the cook is simply removed;
    - otherwise `leaving = true` and `stats.wages += wage`;
    - a cook holding `cook` or `carry` finishes that diner and then exits;
    - any other cook frees the diner they claimed (`chefId = null`) and exits at once.
  - `hasChefs(): boolean` is true when some cook is not leaving.
  - `chefHome(c): Tile` is the work tile of `stoves[c.id % stoves.length]`.
  - `dayClosed: boolean` and `closeDay(): void`:
    - adds every cook not leaving to `stats.wages`, takes `stats.wages` from the purse, and removes the cooks who are leaving;
    - sets `dayClosed = true`;
    - Task 6 adds the away book here.
  - `startDay()` puts each cook on their home tile with no task and sets `dayClosed = false`.
  - `clearOut()` also clears the cooks' tasks and paths.
- **The cook's step** runs in `step` after the owner's, with each cook at `walkSpeed(stats.speed)`:
  - **idle:**
    - a leaving cook takes `exit` to the door, where they are removed;
    - otherwise, while the power is on, the cook looks for the first diner who is `ordering`, has `chefId === null` and is not the owner's order target, as long as some stove has `dinerId === null`;
    - on finding one, the cook sets `chefId`, takes `order` and walks beside the chair;
    - with nothing to do and not at home, the cook walks home.
  - **`order`:**
    - if the diner is gone or no longer `ordering`, the task drops;
    - on arrival the cook claims a free stove; with none free, the diner's `chefId` goes back to null and the cook goes idle;
    - otherwise the cook takes the portion, the diner becomes `waitingFood` and the cook takes `cook` with `leftMs = cookMs(c, dish)`, walking to the stove's work tile.
  - **`cook`:** the timer runs only after arrival and only while the power is on. At 0 the cook rolls `staffStars(chefSkill(c, dish), rng())`, frees the stove and takes `carry`, walking beside the chair.
  - **`carry`:** on arrival the diner's `stars` are set, the diner is `eating`, `stats.chefCooked++`, the task clears and the cook walks home.
- **The owner's side:**
  - `tapTile` and `Street.wanted` ignore a diner with `chefId !== null`;
  - `completeCooking` adds `stats.ownerCooked++`;
  - the owner's `order` arrival takes the portion, as in Task 4.
- **`leaveTown` with cooks:**
  - the carried dish is still served;
  - only the diner of the owner's own `order` or `cook` task leaves, and only that stove is freed;
  - every other diner stays;
  - with no cooks it behaves as in lô A.
- **Diners while the owner is away:** walk-ins and `walkOver` work while `ownerAway` as long as `hasChefs()`.
- **`Chain`:**
  - in `advance`, after `street.advance`, call `restaurant.closeDay()` once `main.dayOver && !restaurant.dayClosed`;
  - in `fromSave`, set `restaurant.dayClosed = chain.main.dayOver`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/restaurant-b.test.ts` (the helper `withChef(r, stats?)` hires candidate 0 after setting its stats):
  - `'hires up to two cooks, never with a negative purse'`: three hires give `null, null, 'full'`. With money −1 the result is `'money'`.
  - `'draws today's candidates once a day, with names free in both shops'`.
  - `'lets a cook take a ticket, cook, carry and get paid for'`:
    - with one cook and one `spawnDiner({ dish: 'pho' })`, advance until the diner pays;
    - `stats.served` is 1, `stats.chefCooked` is 1 and `ownerCooked` is 0;
    - the diner went through `waitingFood` and `eating`;
    - the portion was taken;
    - the purse grew by `DISH_PRICE.pho + DINER_TIP[stars]`.
  - `'keeps the owner off a diner a cook has taken, and the cook off the owner's'`.
  - `'stops a cook's stove in a power cut and goes on after'`:
    - mock `host.powerOut` to true mid-cook: `leftMs` does not change over 5 s, and an idle second cook takes no ticket;
    - set it back to false: the dish finishes.
  - `'finishes the dish of a cook let go mid-cook and pays the wage once'`:
    - fire the cook during `cook`: the diner still eats and pays, and then the cook is gone;
    - `closeDay()` leaves `stats.wages` equal to that one wage.
  - `'keeps serving with a cook while the owner is at a branch'`:
    - the owner holds an `order` for diner A, a cook holds diner B, and diner C is `ordering` and untaken;
    - after `leaveTown()`, A leaves, B is served and pays, and C is later taken by the cook;
    - with `autoSpawn`, new diners arrive while `ownerAway`.
  - `'takes the cooks' wages from the purse when the day closes'`:
    - drive `starShop` + `Chain` through a day with one cook hired;
    - after `dayOver`, money fell by the wage, `stats.wages` equals it, and `closeDay` ran exactly once (a second `advance` changes nothing).

- [ ] **Step 2: Run** `npx vitest run tests/sim/restaurant-b.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.** Keep the cook's step in its own private `updateChef(c, dt)`, next to `updateOwner`.

- [ ] **Step 4: Run** `npm test`. Expected: all pass, `same-draws` included.

- [ ] **Step 5: Commit.** Message: "Hire up to two cooks who take tickets, cook at a free stove for their speed and specialty, carry the dish and are paid at the day's close, and keep the restaurant serving through a cook while the owner is at a branch".

---

### Task 6: Lessons and the restaurant's away money

**Files:**
- Modify: `src/sim/restaurant.ts`, `src/sim/away.ts` (the `AwayResult.places` type), `src/sim/chain.ts` (`comeBack`), `src/view/away.ts`
- Test: `tests/sim/restaurant-b.test.ts`, `tests/view/away.test.ts`, `tests/sim/chain-away.test.ts`

**Interfaces:**
- Produces on `RestaurantSim`:
  - `learned: DishId[]`, which is `[]` for a new restaurant.
  - `needsLesson(dish): boolean`.
  - `completeCooking` adds the diner's dish to `learned`.
  - `away: AwayBook`.
  - `closeDay()` also calls `closeAwayDay(away, restaurantProfit(stats), stats.ownerCooked, stats.chefCooked)`. The profit is `income + tips − wages − restock`, and `restaurantProfit` is exported from `restaurant.ts`.
  - `comeBack(ms): AwayResult` pays `awayPay(away, ms)` into the purse. It returns `places: paid > 0 ? ['restaurant'] : []`, `profit: awayMean(away)`, `days: away.profits.length`, `capped` as the spa computes it, and `tip: false`.
- `AwayResult.places` becomes `(PlaceId | null | 'restaurant')[]`.
- `Chain.comeBack` adds the restaurant's result to its list of results when there is a restaurant.
- In `awayLines`, a single `'restaurant'` place reads `t('awayFrom', { place: t('restaurantKicker') })`.

- [ ] **Step 1: Write the failing tests:**
  - `'marks a dish learned after its first cook, once'`:
    - `needsLesson('che')` is true;
    - the owner cooks a Chè, and then it is false;
    - `needsLesson('pho')` stays true.
  - `'pays the restaurant for time away after a cooks-only day'`:
    - `closeDay` with `chefCooked: 3, ownerCooked: 0` and a profit of 200_000;
    - `comeBack(2 * 3_600_000)` pays `Math.round(2 * AWAY_DAY_SHARE * 200_000 / 1000) * 1000` and returns `places: ['restaurant']`.
  - `'pays nothing after a day the owner cooked'`.
  - In `tests/sim/chain-away.test.ts`, `'adds the restaurant's away pay to the shops''`.
  - In `tests/view/away.test.ts`, `'names the restaurant when it alone paid'`.

- [ ] **Step 2: Run** the three files. Expected: FAIL.

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run** `npm test`. Expected: PASS.

- [ ] **Step 5: Commit.** Message: "Remember which dishes the owner has cooked for the first-cook lesson, and pay the restaurant for time away after a day its cooks ran alone".

---

### Task 7: Save the stock, cooks, lessons and away book in a new version

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/restaurant.ts` (`toSave`, `fromSave`)
- Create: `tests/fixtures/save-v38.json`, a v38 save of a main shop with a restaurant that holds:
  - one cook mid-`cook`;
  - a Bánh xèo diner `waitingFood`;
  - a Chè diner `ordering`;
  - a partly used stock;
  - `learned: ['pho']`;
  - one away profit.
- Test: `tests/sim/save.test.ts`, `tests/sim/restaurant-b.test.ts`

**Interfaces:**
- Produces:
  - `RESTAURANT_B_SAVE_VERSION` (see Global Constraints), with `SAVE_VERSION = RESTAURANT_B_SAVE_VERSION`. The SAVE_VERSION comment gains ", 38 the restaurant's cooks, stock and lessons". Add 37 to the accepted list in `parseVersioned`.
  - `RestaurantSave` gains `stock`, `chefs: Chef[]`, `nextChefId`, `candidates`, `candidatesDay`, `learned: DishId[]` and `away: AwayBook`. `Diner` keeps `dish`, `ticket` and `chefId` in the save.
- `repairRestaurant` handles each version:
  - **v37:** stock is `fullRestaurantStock()`, there are no cooks or candidates, `candidatesDay` is 0, `learned` is `['pho']` (lô A players have cooked Phở already), `away` is `emptyAwayBook()`, every diner is `dish: 'pho'` with `chefId: null`, and the stats' new fields are 0.
  - **v38 onward:**
    - stock counts are integers ≥ 0, else `STOCK_START`;
    - a diner's ticket must fit its dish (each dish's fields checked against their literal values), else the diner is dropped;
    - cooks are repaired field by field, with the stats clamped to 1..5 and the tiers 0..`MAX_TIER`;
    - `learned` keeps only known dishes;
    - `away` goes through `repairAway`.
- `fromSave` keeps a cook's task when it still holds:
  - an `order` needs its diner `ordering` with `chefId` equal to the cook's id;
  - a `cook` needs a stove that exists and a diner `waitingFood`, and the stove's `dinerId` is restored;
  - a `carry` needs the diner `waitingFood`.
  Any other task is dropped, and the diner's `chefId` is cleared. The existing "a `waitingFood` diner whose dish is lost leaves" loop skips diners held by a kept cook task.

- [ ] **Step 1: Write the failing tests:**
  - In `save.test.ts`, `'is version …'` names the new number.
  - `'reads a v37 restaurant with full stock, no cooks and Phở learned'`, using `save-v37.json`.
  - `'reads the v38 fixture with its cook, stock and dishes'`.
  - `'round-trips a restaurant with cooks, candidates, stock, lessons and away book'`.
  - `'refuses a save newer than the game'` still passes, at `SAVE_VERSION + 1`.
  - In `restaurant-b.test.ts`, `'reloads a cook mid-cook and serves the dish once'`:
    - save mid-cook through `Chain.toSave`, then `parseSave` and `Chain.fromSave`;
    - the cook still holds `cook` and the stove its diner;
    - advance until paid: `stats.served` is 1 and the money rose by exactly one dish and its tip.
  - `'drops a cook's task whose diner is gone after a load'`.

- [ ] **Step 2: Run** `npx vitest run tests/sim/save.test.ts tests/sim/restaurant-b.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.** Write the fixture by running a real sim in a scratch test, saving it, and trimming it. Keep it valid JSON with `"v"` set to the new version.

- [ ] **Step 4: Run** `npm test`. Expected: PASS.

- [ ] **Step 5: Commit.** Message: "Save the restaurant's stock, cooks, candidates, learned dishes and away book in a new version, reading a lô A save with full stock, no cooks and Phở already learned".

---

### Task 8: Shared cook-scene parts, and Phở's lesson hand

**Files:**
- Create: `src/view/cook.ts`, `src/art/menuArt.ts`
- Modify: `src/scenes/PhoScene.ts` (use `cook.ts`, add the lesson), `src/scenes/BootScene.ts` (`menuTextures()`), `src/strings/vi.ts`
- Test: `tests/view/cook.test.ts`, `tests/art/menuArt.test.ts`

**Interfaces:**
- Produces in `cook.ts`:
  ```ts
  export interface CookData<T extends DishTicket = DishTicket> extends MiniGameData { ticket: T }
  export const COOK_SCENE: Record<DishId, string> = { pho: 'PhoScene', banhXeo: 'BanhXeoScene', che: 'CheScene' }
  export function ticketLines(dish: DishId, ticket: DishTicket): StringKey[]   // four lines for Phở as today; three for the others (Task 9, Task 10)
  export function addTicket(scene: Phaser.Scene, dish: DishId, ticket: DishTicket): void   // PhoScene's addTicket moved here, with TICKET's numbers
  export const PILL: { x: number; w: number; h: number; ys: number[]; size: number }      // moved from PhoScene
  export function addPills(scene: Phaser.Scene, labels: string[]): (at: number) => void  // draws the three pills, returns the redraw PhoScene's drawPills did
  ```
- Produces in `menuArt.ts`, through `menuTextures()`:
  - `dish-pho`, `dish-banhXeo`, `dish-che` (each 90×90): a bowl of phở, a folded yellow crêpe, a tall glass in three bands;
  - `rstock-phoKit`, `rstock-batter`, `rstock-cheKit`, `rstock-herbs` (each 60×60): a bundle of noodles, a bag of flour, a pot of beans, a basil sprig.
- **The lesson:**
  - when `params.demo` is true, the scene holds a `HandPointer`;
  - on each station it shows that step's lesson line, pointing at the station's target: the first uncut line's top for the cut, the hold button for the boil, the onion button for the toppings;
  - it hides at the reveal.
  - The Phở lines are `phoLearnCut` "Vuốt dọc theo vạch chấm, từ trên xuống", `phoLearnBoil` "Giữ nút, thả tay khi kim vào vạch vàng" and `phoLearnTop` "Chạm rau đúng như phiếu, rồi bấm Bưng ra".

- [ ] **Step 1: Write the failing tests:**
  - `'lists the Phở ticket's four lines'`: for `{ doneness: 'tai', onion: 'lots', chili: false, extraHerb: true }`, the lines are `['phoTai', 'phoOnionLots', 'phoNoChili', 'phoExtraHerb']`.
  - `'opens each dish in its own scene'`.
  - `menuArt.test.ts`, `'draws every dish and stock icon'`, follows `phoArt.test.ts`: sorted keys plus the `<svg … </svg>` check.

- [ ] **Step 2: Run** them. Expected: FAIL.

- [ ] **Step 3: Implement.** Move the code out of `PhoScene` without changing what it draws: same positions, same copy.

- [ ] **Step 4: Run** `npm test` and `npx tsc --noEmit`. Expected: PASS.

- [ ] **Step 5: Commit.** Message: "Share the order ticket and step pills between the cook scenes, add dish and stock icons, and guide a first Phở with the lesson hand".

---

### Task 9: The Bánh xèo scene

**Files:**
- Create: `src/scenes/BanhXeoScene.ts`, `src/art/banhXeoArt.ts`
- Modify: `src/main.ts` (register the scene), `src/scenes/BootScene.ts` (`banhXeoTextures()`), `src/view/cook.ts` (`ticketLines` for `banhXeo`), `src/strings/vi.ts`
- Test: `tests/art/banhXeoArt.test.ts`, `tests/view/cook.test.ts`

**Interfaces:**
- Consumes: Task 1's `BanhXeoGame`, Task 8's `cook.ts`, `HandPointer`, `oneFinger`, `drawBars` and `revealStars`.
- **Art (`banhXeoTextures()`):**
  - `bx-pan`: a black cast-iron pan with a wooden handle to the left, centred on `BX_PAN`, about 300 px in radius;
  - `bx-tom`, `bx-thit`, `bx-gia` (each 60×60): a pink shrimp, a pork slice, a few bean sprouts.
  - The fold step reuses `pho-dial` and `PHO_DIAL` for the crispness needle and band. The batter and the folded crêpe are drawn with `Graphics`, so their colour can follow `brown`.
- **Stations:**
  - **spread:**
    - a swipe that starts inside the pan's outer ring is collected and its trail drawn;
    - on lift, `rules.swirl(points)` runs and the batter sectors it reached are painted;
    - the floating words are `bxSpreadGood` "Kín chảo!", `bxSpreadThin` "Còn hở chảo." and `bxSpreadShort` "Vuốt cả một vòng quanh chảo.".
  - **fill:**
    - a full batter disc;
    - three buttons in a row (Tôm, Thịt, Giá, with icons, counting `{name} ×{n}` with `phoCount`);
    - a primary button `bxDone` "Xong" that calls `doneFilling()`;
    - each tap drops a bit onto the batter.
  - **fold:**
    - the batter's colour lerps from `C.cream` through `C.mustard` to `C.woodDark` with `brown`;
    - the dial on the right shows the band and the needle;
    - a primary button `bxFold` "Gập bánh" calls `foldNow()`;
    - the result word is `bxFoldIn` "Giòn vừa tới!", or below the band `bxFoldSoft` "Hơi non." and above it `bxFoldBurnt` "Hơi cháy.";
    - the folded half-disc stays until the reveal.
- **Copy:**
  - instructions: `bxSpread` "Vuốt một vòng quanh chảo để tráng bột", `bxFill` "Chạm tôm, thịt, giá theo phiếu rồi bấm Xong", `bxFoldTip` "Bánh vàng dần, bấm Gập bánh khi kim vào vạch vàng";
  - steps: `bxStepSpread` "1 · Tráng bột", `bxStepFill` "2 · Thêm nhân", `bxStepFold` "3 · Gập bánh";
  - ticket: `bxTom` "Bánh xèo tôm", `bxThit` "Bánh xèo thịt", `bxVua` "Giòn vừa", `bxKy` "Giòn kỹ", `bxGiaLine` "Có giá", `bxExtraGia` "Thêm giá";
  - buttons: `bxTomTap` "Tôm", `bxThitTap` "Thịt", `bxGiaTap` "Giá";
  - lesson: `bxLearnSpread` "Đặt ngón tay trong chảo, vuốt tròn một vòng", `bxLearnFill` "Chạm nhân đúng như phiếu, rồi bấm Xong", `bxLearnFold` "Chờ kim lên vạch vàng rồi bấm Gập bánh".
- `ticketLines('banhXeo', t)` is `[filling, crisp, sprouts]`.
- Like `PhoScene`, it offers a dev-only `__finishForTest(stars)` and calls `params.onDone(stars)` after `revealStars`.

- [ ] **Step 1: Write the failing tests:** `'lists the Bánh xèo ticket's three lines'` and `'draws every Bánh xèo part'`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement**, following `PhoScene`'s structure.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS and a clean build.
- [ ] **Step 5: Commit.** Message: "Cook Bánh xèo in its own mini-game: swirl the batter round the pan, add the ticket's fillings, and fold when the crêpe browns into the ticket's band".

---

### Task 10: The Chè scene

**Files:**
- Create: `src/scenes/CheScene.ts`, `src/art/cheArt.ts`
- Modify: `src/main.ts`, `src/scenes/BootScene.ts` (`cheTextures()`), `src/view/cook.ts` (`ticketLines` for `che`), `src/strings/vi.ts`
- Test: `tests/art/cheArt.test.ts`, `tests/view/cook.test.ts`

**Interfaces:**
- Consumes: Task 2's `CheGame` and Task 8's `cook.ts`.
- **Art (`cheTextures()`):**
  - `che-glass`: a tall clear glass with a straw slot. `CHE_GLASS = { x: 540, top: 860, bottom: 1420, halfW: 170 }` is exported with it, so the scene can draw the layers inside;
  - `che-ice`: a big ice block on a towel, about 360 px across;
  - `che-coconut`: a small jug.
  - The layers are drawn with `Graphics` in `C.terracotta` (red bean), `C.mustard` (mung bean) and `C.leaf` (jelly).
- **Stations:**
  - **layer:**
    - the glass and the three marks as dashed lines;
    - a teal hold button `cheHold` "Giữ để múc", with the current layer named on it ("Giữ để múc · Đậu đỏ" and so on through `cheRedBean` "Đậu đỏ", `cheMungBean` "Đậu xanh", `cheJelly` "Thạch");
    - the release words are `cheLayerGood` "Vừa vạch!" and `cheLayerOff` "Lệch vạch.".
  - **ice:**
    - a tap on the block counts;
    - shards fly and the count reads `cheIceCount` "Đá {n}/{target}";
    - at the end the word is `cheIceFast` "Nhanh tay!" when `iceFast`, else `cheIceDone` "Xong đá.".
  - **pour:**
    - a swipe over the glass calls `swipeTo(x)` on each move and `endSwipe()` on lift;
    - each pass draws a white drizzle line over the top and updates `chePourCount` "Cốt dừa {n}/{target}".
- **Copy:**
  - instructions: `cheLayer` "Giữ để múc từng lớp, thả khi tới vạch", `cheIce` "Chạm thật nhanh để đập đá", `chePour` "Vuốt qua lại để rưới nước cốt dừa";
  - steps: `cheStepLayer` "1 · Múc chè", `cheStepIce` "2 · Đập đá", `cheStepPour` "3 · Rưới cốt dừa";
  - ticket: `cheBeans` "Chè nhiều đậu", `cheJellyLine` "Chè nhiều thạch", `cheIceLittle` "Ít đá", `cheIceLots` "Nhiều đá", `cheCoconutLine` "Có nước cốt dừa", `cheExtraCoconut` "Thêm nước cốt dừa";
  - lesson: `cheLearnLayer` "Giữ nút, thả tay khi lớp chè tới vạch", `cheLearnIce` "Chạm thật nhanh vào cục đá", `cheLearnPour` "Vuốt qua lại trên ly".
- `ticketLines('che', t)` is `[mix, ice, coconut]`.

- [ ] **Step 1: Write the failing tests:** `'lists the Chè ticket's three lines'` and `'draws every Chè part'`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement**, following `PhoScene`'s structure.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: "Cook Chè ba màu in its own mini-game: hold three layers to their marks, crush the ice with quick taps, and pour coconut milk in passes across the glass".

---

### Task 11: The menu and stock panel, and opening the right cook scene

**Files:**
- Create: `src/scenes/MenuScene.ts`
- Modify: `src/scenes/SpaScene.ts` (`openServices`, `cook`, `handleRestaurant`), `src/main.ts`, `src/strings/vi.ts`
- Test: `tests/strings/strings.test.ts` (it must still pass with the removed keys)

**Interfaces:**
- `MenuData { restaurant: RestaurantSim; onChange: () => void; onClose: () => void }`.
- **The panel**, in the style of the `ServicesScene` stock tab:
  - title `menuTitle` "Thực đơn", with the `menuIntro` line under it;
  - one row per dish: the `dish-*` icon, `menuDish` (name · price), and `menuLeft` with `portionsLeft`. The line reads `menuPaused` in `C.lantern` at 0, and is drawn in `C.lantern` at or under `LOW_STOCK`. The dish's own restock button is `restock` with `RESTOCK_AMOUNT` and the price;
  - a fourth row for rau thơm, with `menuHerbsUse`;
  - "Xong" to close.
  - Restock calls `restaurant.restock(item)`, then `onChange()`, and redraws.
- **`SpaScene.openServices`:** over the restaurant it launches `MenuScene` (`modal = true`). `onChange` saves.
- **`SpaScene.cook`:**
  - it launches `COOK_SCENE[d.dish]` with `ticket: d.ticket`;
  - it passes `demo: restaurant.needsLesson(d.dish)` and `hard: KINDS[d.kind].hard`, plus the same `extraMs` as today.
  - `pendingCook` keeps working for every dish.
- **`handleRestaurant`:** a `stockLow` event toasts `menuStockOut` with the item's name when `out`, and `stockLow` with the name otherwise.

- [ ] **Step 1: Implement** (view only: no unit test beyond the strings check).
- [ ] **Step 2: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 3: Commit.** Message: "Open the restaurant's menu from Dịch vụ, with each dish's price and portions left and a restock button per stock item, and cook each diner's dish in its own scene with the lesson hand the first time".

---

### Task 12: The cook panel

**Files:**
- Create: `src/scenes/ChefScene.ts`
- Modify: `src/scenes/SpaScene.ts` (`openStaff`), `src/main.ts`, `src/strings/vi.ts`

**Interfaces:**
- `ChefData { restaurant: RestaurantSim; onChange: () => void; onClose: () => void }`.
- **The panel**, in the style of `StaffScene` with its layout numbers (`TITLE_Y`, `TAB_Y`, `ROW_TOP`, `ROW_H`, `ACTION_X`…):
  - title `chefTitle`, with `chefIntro` showing `chefCap()`;
  - two tabs, `tabWorking` (n = cooks not leaving) and `tabHiring`;
  - each row shows the cook as a `CharacterView` with `staffColors(look)`, the name, `roleChef`, `wagePerDay`, two stat lines (`statSkill`, `statSpeed`) with five dots each, and the specialty as its `dish-*` icon at 0.6 with `tier` small stars;
  - the action is "Cho nghỉ" (plain), which confirms with `letGoConfirm`, or "Thuê" (primary);
  - a refused hire toasts `hireNoMoney` or `chefFull` (n = cap);
  - it shows at most 4 rows, with no paging (the cap is 2 and there are 3 candidates in lô B);
  - a cook who is leaving is not listed.
- **`SpaScene.openStaff`:** over the restaurant it launches `ChefScene` (`modal = true`). It opens on the hiring tab when there are no cooks. `onChange` saves.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 3: Commit.** Message: "Hire and let go of the restaurant's cooks from Nhân viên over the restaurant, with each one's skill, speed, wage and dish specialty".

---

### Task 13: Cooks and dishes on the street, and the summary rows

**Files:**
- Modify: `src/view/RestaurantLayer.ts`, `src/view/summary.ts`, `src/scenes/SummaryScene.ts` (only if the row count needs it), `src/strings/vi.ts`
- Test: `tests/view/summary.test.ts`

**Interfaces:**
- **`RestaurantLayer`:**
  - **`syncChefs`:** one `CharacterView(staffColors(look))` per cook, kept by id and destroyed when they go. Each cook stands or walks like the owner, faces up at the stove while their task is `cook` and their path is empty, and shows on floor 1 only. `destroy()` clears them.
  - **Tickets:** a diner's ticket uses `rest-ticket-${dish}`, generated like `rest-ticket` but with the header in `C.terracotta` (Phở), `C.mustard` (Bánh xèo) or `C.leaf` (Chè).
- **`restaurantRows(stats)`:** after the tips row, it adds `restaurantWages` when `stats.wages > 0` and `restockCost` when `stats.restock > 0`, both as money. The one-line form keeps showing diners and income + tips.

- [ ] **Step 1: Write the failing test** in `tests/view/summary.test.ts`, `'adds the cooks' wages and the restock to the restaurant block when there are any'`: with wages 30_000 and restock 0, the labels are `['restaurantServed', 'restaurantIncome', 'restaurantTips', 'restaurantWages']`.
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: "Draw the restaurant's cooks walking, taking tickets and cooking, colour each ticket by its dish, and add the cooks' wages and the restock to the restaurant's summary block".

---

### Task 14: Whole-branch check (controller)

- [ ] `npm test`: all pass, `same-draws` included.
- [ ] `npm run build`: clean.
- [ ] Browser check at 390×780 (`npm run dev`, a dev save on day ≥ 10 with the restaurant bought):
  - cook one Bánh xèo and one Chè by hand, each showing the lesson hand the first time only;
  - Phở shows no lesson on a v37 save;
  - hire a cook and watch them take a ticket, cook and carry;
  - open Thực đơn, restock, and run a dish to 0 so it stops being ordered;
  - the summary shows the cook's wage;
  - no console errors.
- [ ] Right before merging: `git fetch` and read origin/master's `SAVE_VERSION`. Set `RESTAURANT_B_SAVE_VERSION` to that + 1, rename the fixture to match, re-run `npm test`, and fast-forward push.
