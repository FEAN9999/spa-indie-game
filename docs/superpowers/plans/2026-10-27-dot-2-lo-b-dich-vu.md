# Đợt 2 phần 3, lô B: Đá nóng và Tắm bùn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Đá nóng and Tắm bùn services end to end (recipes and hints, stone bed and mud tub, mineral-mud stock, two mini-games, in-shop looks), with save v13, and fit the bench and staff card to six services.

**Architecture:** Lô A made every service list generic (`RECIPE_IDS`, `SERVICE_IDS`, `STOCK_ITEMS`, `bedTile`/`workTile`, `repairRecipes`), so the two services are mostly new entries in existing maps. New pure rules go in `src/sim/stone.ts` and `src/sim/mud.ts`; the new `StoneScene` and `MudScene` play like `SteamScene`. `SpaScene` draws stones on a stone-bed customer's back, and a towel-wrapped head in the mud tub.

**Tech Stack:** TypeScript, Phaser 4 (view only), Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-dot-2-dich-vu-design.md` (approved 2026-10-27). Lô B covers §7 rows marked B, §8.3–8.4 for Đá nóng and Tắm bùn, §9.1, §9.3, §9.4, §10 at six rows, and the lô B half of §11–12.

## Global Constraints

- Branch `dot-2-dich-vu-b` from master `a2e5351`. Stage files by name. Never stage `CLAUDE.md`. No attribution lines in commits.
- `src/sim` stays pure (no Phaser). All copy lives in `src/strings/vi.ts`: short Vietnamese, friendly Saigon voice.
- Style A: cream cards with brown ink borders (`addCard`, `addButton`, `textStyle`), Be Vietnam Pro, palette `C`. Anything tapped is at least 110 px tall on the 1080×2160 canvas, and anything tapped in a mini-game at least 150 px across. Everything fits a portrait iPhone without scrolling. Textures are drawn at the size they are shown.
- Ids: services `stone` (Đá nóng) and `mud` (Tắm bùn); items `stoneBed` and `mudTub`; stock `mud`; scenes `StoneScene` and `MudScene`; hints `demoStone` and `demoMud`. Order everywhere: steam, stone, mud.
- Numbers (spec §7):
  - Đá nóng: price 130 000, open cost 650 000. Stone bed 1×3, price 550 000, beauty 0, group `bed`. Uses 1 oil (shared with massage) + 1 towel.
  - Tắm bùn: price 160 000, open cost 800 000. Mud tub 2×3, price 700 000, beauty 0, group `bed`. Uses 1 mud + 1 towel.
  - Mud stock "Túi bùn khoáng": restock 640 000 for 20, starts at 20.
  - Each new service with a bed: −0.05 on the arrival factor (already generic). All six open: 0.65.
  - Office workers also like `stone`; celebrities also like `mud`; picky customers like all six (already `SERVICE_IDS`).
- Recipes (spec §8.3): Đá nóng = Dầu dừa · Tinh dầu tràm · Gừng (`coconut`, `cajeput`, `ginger`), hints `coconut`, `cajeput`. Tắm bùn = Bùn khoáng · Muối hột · Mật ong (`mineralMud`, `salt`, `honey`), hints `mineralMud`, `salt`. Hint lines, verbatim:
  - stone/coconut: "Chỗ tui hay đi, người ta thoa dầu dừa lên lưng trước rồi mới đặt đá."
  - stone/cajeput: "Nhỏ vài giọt dầu tràm lên đá, hít vô là thông mũi liền."
  - mud/mineralMud: "Bùn phải là bùn khoáng nghen, bùn ao là ngứa cả tuần."
  - mud/salt: "Bùn mà không bỏ chút muối hột thì ngâm chẳng đã gì hết."
- Stone game (spec §9.3): 25 s; 6 spots; 4 stones in the pot; heat starts 0–0.2 and rises at 0.2–0.3 per second (hard: 0.26–0.39), capped at 1.4; below 0.55 cold, 0.55–0.85 good, above 0.85 hot. Score = good − hot. 3★ from 5, 2★ from 3, else 1★.
- Mud game (spec §9.4, the sketch's numbers): 20 s; mark starts 0.25 at rest; holding accelerates it up at 1.5 /s², releasing down at 1.1 /s²; speed capped at ±0.55 /s; the mark stops at 0 and 1. The green band's centre starts at 0.5 and drifts at 0.16 /s towards a target, first redrawn after 1 000 ms, then every 1 400–3 000 ms, to 0.18–0.82. Band half-height 0.11 (hard: 0.08). 3★ when the mark is inside the band ≥ 70% of the time, 2★ ≥ 45%, else 1★.
- Run tests with `npx vitest run`; type-check and build with `npm run build`. The suite has 562 tests at the base; it must stay green after every task. When a new service, item or stock item changes an existing test's full list, extend the expected list; never weaken an assertion.

## Review Focus

1. **A real v12 save** with Xông lá open, a tent placed, a steam course booked, herbs used and steam tries heard must load with nothing lost. Đá nóng and Tắm bùn come in unsolved and closed, mud stock 20, their tiers 0. → Task 1 fixture, Task 6 test.
2. **Oil shared by massage and Đá nóng.** Each customer of either uses one oil. With oil at 0, a technician serves neither, while Xông lá and Tắm bùn go on. → Task 5 test.
3. **The 2×3 mud tub on the floor.** Its work tile is beside the middle row: `x+2`, or `x−1` flipped. It can't go where that tile is off the floor. The customer reaches the bed tile and the owner the work tile. → Task 5 test; the head drawn centred on the tub is checked in Task 8.
4. **Stone taps at the edges.** A tap after the game is done, or on a pot slot outside 0–3, does nothing. The 6th stone placed ends the game at once. A time-out with fewer than 6 placed scores the empty spots 0. → Task 2 tests.
5. **Mud holding at the edges.** Held at the top, the mark stays at 1 and starts down as soon as it is released; released at the bottom it stays at 0. One long tick (a tab switch) plays out like the same time in 50 ms steps, and time inside never exceeds time played. A finger lifted outside the button counts as a release. → Task 3 tests; the release outside is checked in Task 8.

---

### Task 1: v12 save fixture from the untouched game

**Files:**
- Create: `tests/fixtures/save-v12.json`

**Interfaces:**
- Produces: a real v12 save for Task 6's test.

- [ ] **Step 1:** Before changing any source, write a throwaway Vitest file, `tests/sim/make-fixture.test.ts`, that builds the shop and writes the JSON. Keep it out of every commit. The shop:
  - `new SpaSim({ rng: createRng(12), autoSpawn: false })`, then `day = 9` and `money = 1_500_000`;
  - mask and massage open, a `massageBed` bought at `(6, 2)`;
  - Xông lá solved through `mixRecipe` (one wrong mix first, so `tries` has two entries), `recipes.steam.heard = ['pomelo']`, Xông lá opened with `openService`, and a `steamTent` bought on a free spot (find one with `canPlace`);
  - one technician hired with `hireStaff` from `tests/sim/helpers.ts` with `{ steam: 2 }`, and a course on `steam` booked through `study`;
  - one customer `waiting` for `steam`;
  - `stock.herbs = 13` and `stock.oil = 7`.
- [ ] **Step 2:** Run it to write `tests/fixtures/save-v12.json` from `JSON.stringify(sim.toSave(), null, 2)`. Check the file has `"v": 12`, a `steamTent` item, `recipes.steam.solved: true`, and a staff member with a `study`. Delete the throwaway test.
- [ ] **Step 3: Commit** only `tests/fixtures/save-v12.json`, message "Add a v12 save fixture with Xông lá open, a tent, a booked steam course and used herbs".

### Task 2: Hot-stone mini-game rules

**Files:**
- Create: `src/sim/stone.ts`, `tests/sim/stone.test.ts`
- Modify: `src/config.ts`. Add `STONE_LIMIT_MS = 25000`, `STONE_SPOTS = 6`, `STONE_POT = 4`, `STONE_GOOD = { min: 0.55, max: 0.85 }`, `STONE_MAX_HEAT = 1.4`, `STONE_START_HEAT = { min: 0, max: 0.2 }`, `STONE_RATE = { min: 0.2, max: 0.3 }` and `STONE_RATE_HARD = { min: 0.26, max: 0.39 }` (heat per second), and `STONE_STARS = { three: 5, two: 3 }`, each with a one-line comment in the file's style.

**Interfaces:**
- Consumes: `Rng` and `createRng` from `src/sim/rng.ts`; `Stars` from `economy.ts`.
- Produces:

```ts
export type StoneHeat = 'cold' | 'good' | 'hot'
export const heatOf: (h: number) => StoneHeat // < 0.55 cold, 0.55..0.85 good, > 0.85 hot
export const stoneStars: (score: number) => Stars
export class StoneGame {
  phase: 'play' | 'done'
  elapsedMs: number
  /** Each stone laid, in spot order. */
  placed: StoneHeat[]
  constructor(rng: Rng, hard?: boolean)
  /** The pot's stones' heat, slot 0..3. */
  heats(): number[]
  tick(ms: number): void
  /** Lays pot stone `slot` on the next spot; a fresh stone takes its place. */
  tap(slot: number): StoneHeat | null
  score(): number // good − hot
  stars(): Stars | null
}
```

- [ ] **Step 1: Write failing tests** in `tests/sim/stone.test.ts`. Use a scripted rng (`() => draws[i++]`) where exact values matter, `createRng` elsewhere.
  - **Grades:** `heatOf(0.549)` cold, `heatOf(0.55)` good, `heatOf(0.85)` good, `heatOf(0.851)` hot.
  - **Start:** 4 stones, each heat in [0, 0.2]. Each stone draws its start heat, then its rate, in slot order.
  - **Heating:** a stone drawn with start heat 0.1 and rate 0.2 is cold at 2 200 ms, good at 2 300 ms and at 3 700 ms, and hot at 3 800 ms. Heat never passes 1.4.
  - **Hard mode:** over 100 fresh stones every rate is in [0.26, 0.39]; in normal mode, [0.2, 0.3].
  - **Tapping:** `tap(i)` returns the stone's grade, appends it to `placed`, and slot `i` gets a fresh stone with heat ≤ 0.2.
  - **No-op taps:** `tap(4)` and `tap(-1)` return null and change nothing. So does any tap once `phase` is `'done'`.
  - **The end:** `phase` becomes `'done'` the moment the 6th stone is laid, or when `elapsedMs` reaches 25 000. `elapsedMs` never passes 25 000.
  - **Score and stars:**
    - 6 good → score 6, 3★. 5 good + 1 cold → 3★. 5 good + 1 hot → score 4, 2★.
    - 3 good + 3 cold → 2★. 4 good + 2 hot → score 2, 1★.
    - Timed out with 2 good laid → 1★.
    - `stoneStars(5)` 3, `stoneStars(4)` 2, `stoneStars(3)` 2, `stoneStars(2)` 1.
    - Before done, `stars()` is null.
- [ ] **Step 2:** Run `npx vitest run tests/sim/stone.test.ts`. Expected: FAIL, module missing.
- [ ] **Step 3: Implement `StoneGame`.** `tick` adds `rate × ms / 1000` to every stone's heat, capped, after clamping the step to the time left.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5: Commit** `src/sim/stone.ts`, `tests/sim/stone.test.ts` and `src/config.ts`, message "Add the hot-stone rules for the Đá nóng mini-game".

### Task 3: Mud-bath mini-game rules

**Files:**
- Create: `src/sim/mud.ts`, `tests/sim/mud.test.ts`
- Modify: `src/config.ts`. Add `MUD_LIMIT_MS = 20000`, `MUD_STEP_MS = 50`, `MUD_START = { mark: 0.25, band: 0.5 }`, `MUD_ACCEL = { up: 1.5, down: 1.1 }` (per s²), `MUD_MAX_SPEED = 0.55` (per s), `MUD_BAND_SPEED = 0.16` (per s), `MUD_BAND_RANGE = { min: 0.18, max: 0.82 }`, `MUD_RETARGET_MS = { first: 1000, min: 1400, max: 3000 }`, `MUD_HALF = 0.11`, `MUD_HALF_HARD = 0.08` and `MUD_STARS = { three: 0.7, two: 0.45 }`.

**Interfaces:**
- Consumes: `Rng`, `createRng`, `Stars`.
- Produces:

```ts
export type MudFeel = 'cold' | 'ok' | 'hot'
export const mudStars: (insideShare: number) => Stars
export class MudGame {
  phase: 'play' | 'done'
  elapsedMs: number
  insideMs: number
  /** The heat mark, 0 at the bottom of the column to 1 at the top. */
  mark: number
  /** Signed, per second. */
  speed: number
  /** The green band's centre. */
  band: number
  readonly half: number
  constructor(rng: Rng, hard?: boolean)
  hold(on: boolean): void
  tick(ms: number): void
  feel(): MudFeel // ok inside the band, cold below it, hot above it
  stars(): Stars | null
}
```

- [ ] **Step 1: Write failing tests** in `tests/sim/mud.test.ts`:
  - **Start:** mark 0.25, speed 0, band 0.5, `feel()` cold, half 0.11 (hard: 0.08).
  - **Released:** after `tick(3000)` with no hold, mark is 0 and speed is 0.
  - **Held:** after holding for 1 000 ms from the start, mark has risen by at most 0.55. Held for 5 000 ms, mark is 1 and speed 0. Released after that, mark is below 1 within 200 ms.
  - **Band:** over a whole game (seeds 1–5), the band centre stays within [0.18, 0.82] and moves at most 0.16 × the step per tick of 50 ms. It does not move before 1 000 ms, since its first target is its start.
  - **Sub-steps:** two games with the same seed and hold pattern, one given `tick(1000)` and the other 20× `tick(50)`, end in the same state.
  - **Inside time:** with no hold the mark sinks under the band, so `insideMs` is 0 after 2 000 ms. `insideMs ≤ elapsedMs` always.
  - **The end:** `phase` becomes `'done'` at 20 000 ms, and `elapsedMs` never passes it.
  - **It can be won:** a player who holds while `mark + 0.35 × speed < band` keeps the mark inside at least 90% of the time over seeds 1–5, in both modes, and so gets 3★.
  - **Stars:** `mudStars(0.7)` 3, `mudStars(0.69)` 2, `mudStars(0.45)` 2, `mudStars(0.44)` 1. Before done, `stars()` is null.
- [ ] **Step 2:** Run `npx vitest run tests/sim/mud.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `MudGame`**, following the sketch's loop per sub-step of at most `MUD_STEP_MS`, clamped to the time left:

```ts
// per sub-step of dt seconds
untilRetarget -= dt; if (untilRetarget <= 0) { target = between(rng, MUD_BAND_RANGE); untilRetarget = between(rng, MUD_RETARGET_MS) / 1000 }
band += sign(target - band) * min(|target - band|, MUD_BAND_SPEED * dt)
speed = clamp(speed + (held ? MUD_ACCEL.up : -MUD_ACCEL.down) * dt, -MUD_MAX_SPEED, MUD_MAX_SPEED)
mark += speed * dt   // at 0 or 1, clamp and drop the speed pushing outwards
if (|mark - band| <= half) insideMs += dt * 1000
```

- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5: Commit** `src/sim/mud.ts`, `tests/sim/mud.test.ts` and `src/config.ts`, message "Add the mud-bath rules for the Tắm bùn mini-game".

### Task 4: Art: stone bed, mud tub, icons and mini-game pictures

**Files:**
- Create: `src/art/stoneArt.ts` (exports `stoneTextures()`), `src/art/mudArt.ts` (exports `mudTextures()`)
- Modify: `src/art/furniture.ts`, `src/art/fx.ts`, `src/art/chibi.ts` (the towel wrap), `src/scenes/BootScene.ts`
- Test: `tests/art/stoneMud.test.ts`, additions to `tests/art/fx.test.ts`

**Interfaces:**
- Produces these texture keys:
  - furniture `stoneBed` (`FURNITURE.stoneBed`, w 1.1 like `massageBed`) and `mudTub` (`FURNITURE.mudTub`, w 2);
  - badges `svc-stone`, `svc-mud` and `stock-mud`, in the neighbours' `badge(...)` style;
  - `fx-stones`: a short row of dark stones with warm rims, to lie on a face-down customer's back in the shop;
  - `towel-wrap`: a cream towel wrapped round the hair, seen from above, anchored in `PART_ANCHORS` like the other head parts;
  - stone game: `sn-stone` (fill only, white, for tinting) and `sn-stone-line` (its ink outline), `sn-spot` (an empty dashed spot), `sn-pot` (a pot of water that holds 4 stones in a row);
  - mud game: `mud-tub` (a wooden tub seen from the front with mud at the rim), `mud-head` (fill only, for the skin tint) and `mud-head-line`, `mud-towel`, `mud-face-cold`, `mud-face-ok`, `mud-face-hot` (eyes, mouth and blush only), and `mud-steam`.

- [ ] **Step 1: Write failing tests.** `stoneTextures()` and `mudTextures()` have every key above; `fxTextures()` has `svc-stone`, `svc-mud`, `stock-mud` and `fx-stones`; `FURNITURE.mudTub.w` is 2 and `FURNITURE.stoneBed` exists. Use `vi.mock('phaser', () => ({}))` as the other art tests do.
- [ ] **Step 2:** Run `npx vitest run tests/art`. Expected: FAIL.
- [ ] **Step 3: Draw.** Style A: palette `C`, ink outlines, the sketch page's shapes (it lives at `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\7f531ce2-17d8-4e8a-b4a3-ff57b8dae4c1\scratchpad\phan3-phac-thao.html`; the stone and mud games are around lines 330–415, the furniture around 451–484):
  - the stone bed is the massage bed with a sand headrest and a column of four dark stones, two with orange rims;
  - the mud tub is a rounded wooden tub with staves, dark mud inside, a cream towel headrest at the top and a few pale bubbles;
  - the stone and mud textures are drawn at the size the scenes show them (Tasks 7 and 8 set display sizes, as `SteamScene` does).
  - Tinted parts follow `massageArt.ts`: fills only in white, plus a separate lines-only texture, using `fillsOnly`/`linesOnly` from `outline.ts`.
  - `BootScene` loads `stoneTextures()` and `mudTextures()`.
- [ ] **Step 4:** Run `npx vitest run tests/art`. Expected: PASS. Then render every new texture in the browser with the scratchpad helper `artcheck.js` (extend its key lists) and look at it beside the massage bed and the tent: same ink weight, readable at phone size.
- [ ] **Step 5: Commit** the art files, `src/scenes/BootScene.ts` and the tests, message "Draw the stone bed, the mud tub, their icons and the Đá nóng and Tắm bùn game pictures".

### Task 5: Đá nóng and Tắm bùn in the sim

**Files:**
- Modify: `src/sim/recipes.ts`, `src/sim/services.ts`, `src/config.ts`, `src/sim/items.ts`, `src/sim/stock.ts`, `src/sim/customers.ts`, `src/sim/types.ts`, `src/strings/vi.ts`, `src/scenes/SpaScene.ts` (the two service maps only)
- Test: `tests/sim/recipes.test.ts`, `tests/sim/services.test.ts`, `tests/sim/items.test.ts`, `tests/sim/grid.test.ts`, `tests/sim/economy.test.ts`, `tests/sim/customers.test.ts`, `tests/sim/stock.test.ts`, `tests/sim/staff.test.ts`, `tests/sim/spa-recipes.test.ts`, `tests/view/catalog.test.ts`, and any existing test whose full list of services, items or stock grows

**Interfaces:**
- Consumes: the textures of Task 4.
- Produces:

```ts
// recipes.ts
export type RecipeId = 'steam' | 'stone' | 'mud'
export const RECIPE_IDS: readonly RecipeId[] // ['steam', 'stone', 'mud']
// stock.ts
export type StockItem = 'shampoo' | 'towel' | 'mask' | 'oil' | 'herbs' | 'mud'
// items.ts: ItemKind adds 'stoneBed' | 'mudTub', listed right after 'steamTent'
// types.ts: HINT_IDS adds 'demoStone', 'demoMud' after 'demoSteam'; the toast keys add 'busyStone', 'busyMud'
```

- [ ] **Step 1: Write failing tests.**
  - **recipes:**
    - `RECIPES.stone` and `RECIPES.mud` hold the Global Constraints' ingredients and hints; `emptyRecipes()` has all three.
    - `pickHint` with steam solved and both stone hints heard only ever returns `{ recipe: 'mud', … }`.
    - With nothing heard and draws `[0.1, 0.99]`, it returns `{ recipe: 'mud', ingredient: 'salt' }`.
    - `RECIPE_HINT_TEXT` has the four lines verbatim (`tests/strings` style).
  - **services:**
    - `SERVICES.stone` and `SERVICES.mud` equal `{ price, openCost, bed, name: 'serviceStone' | 'serviceMud', busy: 'busyStone' | 'busyMud' }` with the Global Constraints' numbers.
    - Each gives `'order'` before massage is open and `'recipe'` until solved.
    - The three recipe services open in any order: solve all three, then open mud, then steam, then stone, each succeeding with enough money.
  - **items/grid:**
    - `ITEMS.stoneBed` and `ITEMS.mudTub` equal the Global Constraints' specs, and `ITEM_KINDS.slice(0, 6)` is the six beds in service order.
    - A `mudTub` at `(8, 8)`: footprint x 8–9, y 8–10; `workTile` `(10, 9)`, `bedTile` `(9, 9)`; flipped, `(7, 9)` and `(8, 9)`. The grid marks the bed tile `'bed'`, the other five `'bedEnd'`, and the work tile `'work'`. Placing it where the work tile would be off the floor is refused (`offFloor`).
    - A `stoneBed` has the massage bed's tiles.
  - **spa:**
    - With mud solved and open and a tub bought, a `mud` customer `startService`d lies on `bedTile`, the owner stands on `workTile`, and the stock lost 1 mud and 1 towel.
    - A `stone` customer uses 1 oil and 1 towel.
    - **Shared oil** (Review Focus 2): with massage, stone, steam and mud open, a bed of each, a technician with tiers in all four, and `stock.oil = 0`, waiting customers of massage and stone are not served while steam and mud customers are.
  - **economy:** `serviceArrivalFactor` of all six is 0.65, within float tolerance.
  - **customers:** office `prefers` includes `'stone'`; celeb includes `'mud'`; picky has all six.
  - **stock:** `STOCK_ITEMS` ends with `'mud'`; `fullStock().mud` is 20; `STOCK_USES.stone` is `['oil','towel']` and `STOCK_USES.mud` is `['mud','towel']`; `RESTOCK_PRICE.mud` is 640 000.
  - **staff:** `candidatePool` of all six open is the six in order; with stone and mud closed, 300 candidates never have a stone or mud tier above 0.
  - **catalog:** the bed tab lists `stoneBed` only when `'stone'` is open, and `mudTub` only when `'mud'` is open.
- [ ] **Step 2:** Run the listed tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Recipes, prices, open costs, `RESTOCK_PRICE.mud`, items, stock and preferences from Global Constraints. `RECIPE_SERVICES` comes from `RECIPE_IDS`.
  - `RECIPE_HINT_TEXT` gets the four lines.
  - **Strings:** `serviceStone: 'Đá nóng'`, `serviceMud: 'Tắm bùn'`, `itemStoneBed: 'Giường đá nóng'`, `itemMudTub: 'Bồn tắm bùn'`, `stockMud: 'Túi bùn khoáng'`, `busyStone: 'Giường đá đang bận'`, `busyMud: 'Bồn bùn đang bận'`.
  - **SpaScene's maps:** `MINI_GAME_SCENE.stone = 'StoneScene'`, `.mud = 'MudScene'` (registered in Tasks 7 and 8; unreachable until then, since no recipe can be solved in play before the bench offers it); `DEMO_HINT.stone = 'demoStone'`, `.mud = 'demoMud'`.
  - Existing tests that list every service, item or stock item get the new entries (for example the v11 save test's stock now also has `mud: 20`).
- [ ] **Step 4:** Run `npx vitest run` and `npm run build`. Expected: all pass, no type errors.
- [ ] **Step 5: Commit** every modified file by name, message "Add Đá nóng and Tắm bùn to the shop's rules: recipes and hints, the stone bed, the mud tub and mineral-mud stock".

### Task 6: Save v13

**Files:**
- Modify: `src/sim/save.ts`
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Consumes: the v12 fixture (Task 1) and the services of Task 5.
- Produces: `SAVE_VERSION = 13`.

- [ ] **Step 1: Write failing tests.**
  - **The v12 fixture** parses, and:
    - every old field is equal (skip the keys the v11 test skips);
    - `recipes.steam` is kept exactly, and `recipes.stone` and `recipes.mud` are empty;
    - `stock` is the saved stock plus `mud: 20`;
    - every staff member's and candidate's `tiers.stone` and `tiers.mud` are 0, and the steam tier of 2 is kept;
    - the booked steam course, the tent and the waiting steam customer are kept;
    - `toSave().v` is 13.
  - **The v11 test** expects `SAVE_VERSION` instead of 12.
  - **Every older fixture** (v1–v11) still parses, with all three recipes empty.
  - **Damaged recipes:** a `stone` try with `right` 3 saved as 1 is recomputed and marks stone solved; `services` containing `mud` marks mud solved; a heard `ginger` for stone is dropped (it is not a hint).
- [ ] **Step 2:** Run `npx vitest run tests/sim/save.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `SAVE_VERSION = 13`; `parseVersioned` accepts 12. The recipe, stock and tier repairs are already generic; confirm with the tests and don't duplicate them.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** `src/sim/save.ts` and `tests/sim/save.test.ts`, message "Save v13: open older shops with Đá nóng and Tắm bùn unsolved, fresh mineral mud and no new tiers".

### Task 7: The Đá nóng scene and stones on the back in the shop

**Files:**
- Create: `src/scenes/StoneScene.ts`
- Modify: `src/main.ts` (register `StoneScene`), `src/scenes/SpaScene.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes: `StoneGame`, `heatOf` (Task 2); the `sn-*`, `ms-*` and `fx-stones` textures (Task 4); `MiniGameData`, `addMiniGameCard`, `setInstruction`, `drawBars`, `revealStars` from `src/view/miniGame.ts`.

- [ ] **Step 1: Implement.**
  - **Strings:** `stoneTap: 'Chạm viên đá lúc nó chuyển cam'`, and the customer's lines `stoneGood: 'Ấm vừa, dễ chịu quá'`, `stoneCold: 'Hơi nguội…'`, `stoneHot: 'Á! Nóng quá!'`.
  - **`StoneScene`**, built like `SteamScene`:
    - `new StoneGame(createRng(Date.now()), params.hard)`.
    - The upper part of the card is the customer's back from `MassageScene` (`ms-bed`, `ms-back` tinted with the skin, `ms-hair` tinted with the hair, and their line textures), scaled to fit, with 6 `sn-spot` spots in two columns of three on it.
    - The lower part is `sn-pot` with the 4 stones in a row, each at least 150 px across. Each frame, a stone's tint follows its heat: grey warming towards brown while cold, orange with a mustard glow while good, red with a small jitter while hot.
    - A tapped stone flies to the next spot and stays there in its colour. The customer's line for its grade shows over the head for about a second; a hot stone also shakes the back.
    - Progress is `placed / 6`, plus the time bar. When done, `revealStars`, then `params.onDone`.
    - With `params.demo`, the faint hand taps whichever stone is good, and waits when none is, until the first touch.
    - A dev-only `__finishForTest(stars)` like `SteamScene`'s.
  - **SpaScene:**
    - A customer lying on a stone bed lies face down, like massage.
    - While that customer is `inService`, an `fx-stones` image lies on the back, at the customer's depth.
- [ ] **Step 2: Check it.**
  - `npx vitest run` and `npm run build` pass.
  - In the browser at 390×844, use the console to solve and open stone and buy a stone bed. The owner serves a Đá nóng customer and plays the game through, with the demo hand the first time; lay at least one hot stone to see the shake and line.
  - Take a screenshot mid-game, and one of the customer with stones in the shop. The console has no errors.
- [ ] **Step 3: Commit** `src/scenes/StoneScene.ts`, `src/main.ts`, `src/scenes/SpaScene.ts` and `src/strings/vi.ts`, message "Add the Đá nóng stone game, and lay stones on the customer's back in the shop".

### Task 8: The Tắm bùn scene and the head in the tub

**Files:**
- Create: `src/scenes/MudScene.ts`
- Modify: `src/main.ts` (register `MudScene`), `src/scenes/SpaScene.ts`, `src/view/CharacterView.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes: `MudGame` (Task 3); the `mud-*` and `towel-wrap` textures (Task 4); the mini-game helpers.
- Produces: `CharacterView.setTowel(on: boolean): void`.

- [ ] **Step 1: Implement.**
  - **Strings:** `mudHold: 'Giữ để thêm nước nóng'` (the button), `mudTap: 'Giữ vạch nhiệt trong khoảng xanh'` (the instruction), and the status lines `mudOk: 'Vừa ấm, khách lim dim'`, `mudCold: 'Nguội quá, khách run'`, `mudHot: 'Nóng quá, khách nhăn mặt'`.
  - **`MudScene`**, built like `SteamScene`:
    - `new MudGame(createRng(Date.now()), params.hard)`.
    - A heat column at the left of the card, drawn with Graphics: the green band (stronger while the mark is inside) and the mark.
    - The tub at the right: `mud-tub`, `mud-head` tinted with the skin, `mud-head-line`, `mud-towel`, the face for `feel()`, and `mud-steam` whose alpha follows the mark. The status line under the tub.
    - A primary hold button with `mudHold` across the card's foot, at least 140 px tall. Pointer down on it holds; `pointerup`, `pointerupoutside` and `gameout` release, as in `MassageScene`.
    - Progress is `insideMs / (0.7 × 20 000)`, capped at 1, so a full bar means 3★; plus the time bar. When done, `revealStars`, then `params.onDone`.
    - With `params.demo`, the faint hand rests on the button and presses while the mark is below the band, until the first touch.
    - A dev-only `__finishForTest(stars)`.
  - **CharacterView.setTowel(on):** while lying, hides the blanket and the hair and hair-worn parts and shows `towel-wrap` on the head, so only the face and towel show; off restores them. Like `setMask`.
  - **SpaScene:** a customer lying in a mud tub gets `setTowel(true)`, and is drawn half a tile towards the tub's other column (the same side rule as the steam puff), so the head sits in the middle of the tub.
- [ ] **Step 2: Check it.**
  - `npx vitest run` and `npm run build` pass.
  - In the browser at 390×844, solve and open mud and buy a tub (also try it flipped). The owner serves a Tắm bùn customer and plays the game through, with the demo hand the first time. Press the button, slide the finger off it and lift: the mark must fall (Review Focus 5).
  - Take a screenshot mid-game, and one of the head in the tub in the shop, both orientations. The console has no errors.
- [ ] **Step 3: Commit** `src/scenes/MudScene.ts`, `src/main.ts`, `src/scenes/SpaScene.ts`, `src/view/CharacterView.ts` and `src/strings/vi.ts`, message "Add the Tắm bùn heat game, and show only a towel-wrapped head in the mud tub".

### Task 9: Fit the bench and staff card to six services, and spread the falling leaves

**Files:**
- Modify: `src/scenes/RecipeScene.ts`, `src/scenes/StaffScene.ts`, `src/sim/steam.ts`, `src/config.ts`
- Test: `tests/sim/steam.test.ts`

**Interfaces:**
- Consumes: the three recipes and four lô B hint lines (Task 5).
- Produces: `STEAM_LANES = 4` and `STEAM_LANE_JITTER = 0.04` in `config.ts`.

- [ ] **Step 1: Leaf lanes (test first).** In `tests/sim/steam.test.ts`: over 200 spawns, no spawn's lane (`Math.floor(x × 4)`) equals either of the two before it, and every `x` is within its lane's centre ± 0.04. Run it: FAIL. Then in `SteamGame.spawn`, draw decoy-or-good, thing, lane (uniform among the lanes not used by the last two spawns), jitter, then fall time; `x = (lane + 0.5) / STEAM_LANES + jitter`. Run `npx vitest run tests/sim/steam.test.ts`: PASS.
- [ ] **Step 2: Recipe bench.**
  - Three chips (Xông lá, Đá nóng, Tắm bùn, any with ✓) fit side by side inside the card.
  - With both hints of a recipe heard (the longest is the stone/coconut line, two lines at the hint size) and 4 tries, nothing reaches below `DONE_Y − 65` = 1830 and nothing overlaps. Make the room by tightening the shelf rows and the hint text a little; keep shelf tiles at least 150 px tall and hint text at least 28.
- [ ] **Step 3: Staff card.** Up to 4 specialty badges keep today's look. With 5 or 6, the step drops to 80 px and each tier's stars stand in a column right of its icon, so the row still ends left of the action button (`ACTION_X − ACTION_W / 2` = 730).
- [ ] **Step 4: Check it.** `npx vitest run` and `npm run build` pass. In the browser at 390×844, take screenshots of: the bench with all three chips and two heard stone hints plus 4 tries; a staff member with tiers in all six; and the Services and Stock tabs with all six services open and all six stock items. Nothing overlaps or is cut.
- [ ] **Step 5: Commit** the three source files, `src/config.ts` and the test, message "Fit three recipes on the bench and six specialties on the staff card, and drop leaves in separate lanes".

### Task 10: Whole lô check and ship (controller)

- [ ] **Full suite and build:** `npx vitest run` and `npm run build` both pass.
- [ ] **Browser run at iPhone size**, from a day-9 shop with massage and Xông lá open (set up through the console):
  1. The bench shows three chips. Pha a wrong Đá nóng mix, repeat it free, then the right one.
  2. Hear a lô B hint: force a regular's visit with steam solved; the bubble says a stone or mud line, and the bench shows it under its recipe.
  3. Open Đá nóng and Tắm bùn, buy a stone bed and a tub.
  4. The owner serves one of each and plays both games, demo hands the first time.
  5. A technician serves one of each; oil and mud go down.
  6. The shop looks: stones on a back, a towel-wrapped head in the tub.
  7. The Services and Stock tabs with six rows each.
  8. Reload mid-day; everything is kept.
  9. The console has no errors.
- [ ] **Ship:**
  - Check `origin/master`, since other sessions push here. Integrate in a temp worktree if it moved, and re-run the suite.
  - Merge `dot-2-dich-vu-b` into master with `--ff-only` if possible, then push.
  - Check that GitHub Actions passes and that the live site serves the new build.
