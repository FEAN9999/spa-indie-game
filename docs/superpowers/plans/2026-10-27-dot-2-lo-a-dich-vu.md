# Đợt 2 phần 3, lô A: bàn pha công thức và Xông lá — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the recipe bench (Mastermind-style mixing that unlocks new services), regulars' recipe hints, compact Services/Stock screens, and the Xông lá service end to end (tent, leaf-drop mini-game, herbs stock), with save v12.

**Architecture:** Pure rules go in `src/sim` (`recipes.ts` for recipes, mixing and hints; `steam.ts` for the mini-game). `SpaSim` gains a `recipes` book, `mixRecipe`, `benchOpen`, and a hint roll in `payFor`. Phaser scenes draw them: the new `RecipeScene` opens from `ServicesScene`, and the new `SteamScene` plays like `MassageScene`. A 2×2 "bed" (the tent) needs `workTile` and the bed tile generalised by item width.

**Tech Stack:** TypeScript, Phaser 4 (view only), Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-dot-2-dich-vu-design.md` (approved 2026-10-27). Lô A covers §7 rows marked A, §8, §9.1–9.2, §10, and the lô A half of §11–12.

## Global Constraints

- Branch `dot-2-dich-vu-a` from master `5062403`. Stage files by name. Never stage `CLAUDE.md`. No attribution lines in commits.
- `src/sim` stays pure (no Phaser). All copy lives in `src/strings/vi.ts`: short Vietnamese, friendly Saigon voice.
- Style A: cream cards with brown ink borders (`addCard`, `addButton`, `textStyle`), Be Vietnam Pro. Anything tapped is at least 110 px tall on the 1080×2160 canvas. Everything fits a portrait iPhone without scrolling.
- Ids: service `steam` (Xông lá), item `steamTent`, stock `herbs`, scene `SteamScene` and `RecipeScene`, hints `demoSteam` and `recipes`, event `recipeHint`.
- Ingredient ids, in shelf order: `pomelo` (Lá bưởi), `lemongrass` (Sả), `ginger` (Gừng), `salt` (Muối hột), `mineralMud` (Bùn khoáng), `honey` (Mật ong), `coconut` (Dầu dừa), `cajeput` (Tinh dầu tràm). Leaf-game decoys: `guava` (Lá ổi), `chili` (Ớt), `banana` (Lá chuối).
- Numbers (spec §7–9):
  - Xông lá: price 110 000, open cost 500 000. Tent 2×2, price 500 000, beauty 0, group `bed`.
  - Herbs: restock price 440 000 for 20; Xông lá uses 1 herbs + 1 towel.
  - Each open basic service past the first: −0.1 on the arrival factor (unchanged). Each new service with a bed: −0.05.
  - Mix cost 20 000. Hint chance 1/2.
  - Leaf game: 15 s, 6 to collect, a spawn every 550–800 ms, half decoys (hard: 60%), fall time 4 000–6 000 ms (hard: 3 000–4 500 ms). 3★ = 6 collected with 0 misses; 2★ = ≥ 4 collected with ≤ 2 misses; else 1★.
- Recipe Xông lá = Lá bưởi · Sả · Gừng. Hints name Lá bưởi and Sả. Hint lines (spec §8.4):
  - "Hồi xưa má tui nấu nồi xông có lá bưởi, thơm cả nhà."
  - "Nồi xông mà thiếu sả là mất nửa mùi."
- Fixed copy:
  - "Pha thử · 20.000 đ" (money formatted with `formatMoney`).
  - "Đúng {n} món".
  - "Đúng cả 3 món! Giờ mở được Xông lá."
  - Intro: "Dịch vụ mới phải pha đúng công thức mới mở được. Khách quen đôi khi kể bí quyết."
  - A row whose massage is not open shows the existing `serviceOrder` text with Massage.
- Run tests with `npx vitest run`, type-check and build with `npm run build`. The suite has 508 tests at the base; it must stay green after every task.

## Review Focus

1. **A real v11 save** opened mid-day must load with nothing lost. That means a booked course, a waiting customer and partly used stock all survive. The new parts come in empty: recipes unsolved, herbs 20, Xông lá tier 0 for everyone. → Task 1 fixture, Task 9 test.
2. **Money at the edges of a mix.**
   - Exactly 20 000 mixes down to 0.
   - 19 999 or a negative balance refuses.
   - Repeating a tried bowl is free even at 0 or in debt.
   → Task 7 tests.
3. **Hint timing.**
   - A hint never comes on a gift visit, never twice, and never for a solved recipe.
   - On a new-heart visit, `heart` is emitted before `recipeHint`, and the view shows the hint only after the heart bubble ends, even if the regular has walked out by then.
   → Task 7 tests (sim), Task 12 browser check.
4. **The 2×2 tent on the floor.**
   - Its work tile is beside the second row: `x+2`, or `x−1` when flipped.
   - It can't go where that tile is off the floor.
   - A customer reaches its bed tile, and the owner its work tile.
   → Task 5 tests.
5. **Leaf taps at the edges.**
   - A tap after the game is done, on an item already caught, or on one that fell out does nothing.
   - The game ends the moment the 6th is caught.
   → Task 3 tests.

---

### Task 1: v11 save fixture from the untouched game

**Files:**
- Create: `tests/fixtures/save-v11.json`

**Interfaces:**
- Produces: a real v11 save for Task 9's test.

- [ ] **Step 1:** Before changing any source, write a throwaway Vitest file, `tests/sim/make-fixture.test.ts`, that builds the shop and writes the JSON. Keep it out of every commit. The shop:
  - `new SpaSim({ rng: createRng(11), autoSpawn: false })`, then `day = 6` and `money = 900000`;
  - mask and massage open, with a `massageBed` bought at `(6, 2)`;
  - one technician hired with `hireStaff` from `tests/sim/helpers.ts`, with a course booked through the sim's study API;
  - one customer `waiting`;
  - `stock.oil = 7`.

  The file writes `JSON.stringify(sim.toSave(), null, 2)` to `tests/fixtures/save-v11.json`.
- [ ] **Step 2:** Run `npx vitest run tests/sim/make-fixture.test.ts`. Expected: the file exists with `"v": 11`.
- [ ] **Step 3:** Delete `tests/sim/make-fixture.test.ts`, then commit:

```bash
git add tests/fixtures/save-v11.json
git commit -m "Add a v11 save fixture with a booked course, a waiting customer and used stock"
```

### Task 2: Recipe rules

**Files:**
- Create: `src/sim/recipes.ts`
- Create: `tests/sim/recipes.test.ts`
- Modify: `src/config.ts` (add `RECIPE_TRY_COST = 20000` and `RECIPE_HINT_CHANCE = 0.5`, with one-line comments in the file's style)

**Interfaces:**
- Produces:

```ts
export type Ingredient = 'pomelo' | 'lemongrass' | 'ginger' | 'salt' | 'mineralMud' | 'honey' | 'coconut' | 'cajeput'
export const INGREDIENTS: readonly Ingredient[] // shelf order above
export type RecipeId = 'steam' // lô B adds 'stone' | 'mud'
export const RECIPE_IDS: readonly RecipeId[]
export interface RecipeSpec { ingredients: readonly [Ingredient, Ingredient, Ingredient]; hints: readonly [Ingredient, Ingredient] }
export const RECIPES: Record<RecipeId, RecipeSpec>
export interface RecipeTry { mix: Ingredient[]; right: number }
export interface RecipeState { solved: boolean; tries: RecipeTry[]; heard: Ingredient[] }
export type RecipeBook = Record<RecipeId, RecipeState>
export const emptyRecipes: () => RecipeBook
export const isMix: (x: unknown) => x is Ingredient[] // exactly 3 distinct known ingredients
export const sameMix: (a: readonly Ingredient[], b: readonly Ingredient[]) => boolean // order-free
export const rightCount: (id: RecipeId, mix: readonly Ingredient[]) => number
export function pickHint(book: RecipeBook, rng: Rng): { recipe: RecipeId; ingredient: Ingredient } | null
```

- [ ] **Step 1: Write failing tests** in `tests/sim/recipes.test.ts`:
  - `RECIPES.steam.ingredients` equals `['pomelo','lemongrass','ginger']`, and its hints equal `['pomelo','lemongrass']`.
  - `rightCount('steam', ['ginger','salt','pomelo'])` is 2. `rightCount('steam', ['honey','salt','coconut'])` is 0.
  - `sameMix(['salt','pomelo','ginger'], ['ginger','salt','pomelo'])` is true.
  - `isMix` is false for 2 items, for a repeated item, and for `['pomelo','sa','ginger']`.
  - `pickHint`:
    - returns null without calling `rng` when every recipe is solved, or every hint has been heard (use a counting rng);
    - returns null when the first draw is ≥ 0.5;
    - with draws `[0.1, 0.9]`, returns `{ recipe: 'steam', ingredient: 'lemongrass' }`;
    - never returns a heard ingredient.
- [ ] **Step 2:** Run `npx vitest run tests/sim/recipes.test.ts`. Expected: FAIL, because the module is missing.
- [ ] **Step 3: Implement `src/sim/recipes.ts`.**
  - `pickHint` collects the `(recipe, hint)` pairs of unsolved recipes not yet heard, in `RECIPE_IDS` then hint order.
  - It returns null before drawing when that list is empty.
  - Otherwise it draws once against `RECIPE_HINT_CHANCE`, and then once more to pick from the list.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5: Commit**: `git add src/sim/recipes.ts tests/sim/recipes.test.ts src/config.ts`, message "Add the recipe rules: three-ingredient mixes, right counts and regulars' hints".

### Task 3: Leaf-drop mini-game rules

**Files:**
- Create: `src/sim/steam.ts`
- Create: `tests/sim/steam.test.ts`
- Modify: `src/config.ts`. Add `STEAM_LIMIT_MS = 15000`, `STEAM_NEED = 6`, `STEAM_SPAWN_MS = { min: 550, max: 800 }`, `STEAM_FALL_MS = { min: 4000, max: 6000 }`, `STEAM_FALL_MS_HARD = { min: 3000, max: 4500 }`, `STEAM_DECOY_SHARE = 0.5`, `STEAM_DECOY_SHARE_HARD = 0.6` and `STEAM_STAR2 = { got: 4, misses: 2 }`.

**Interfaces:**
- Consumes: `RECIPES.steam.ingredients` and `Ingredient` from Task 2. `Rng` and `createRng` from `src/sim/rng.ts`. `Stars` from `economy.ts`.
- Produces:

```ts
export type Decoy = 'guava' | 'chili' | 'banana'
export const DECOYS: readonly Decoy[]
export type SteamThing = Ingredient | Decoy
export interface Falling { id: number; thing: SteamThing; x: number /* 0..1 across */; y: number /* 0 top .. 1 bottom */; good: boolean }
export class SteamGame {
  phase: 'play' | 'done'
  elapsedMs: number
  got: number
  misses: number
  constructor(rng: Rng, hard?: boolean)
  falling(): Falling[]
  tick(ms: number): void
  tap(id: number): 'good' | 'wrong' | null
  stars(): Stars | null
}
```

- [ ] **Step 1: Write failing tests** in `tests/sim/steam.test.ts`, with seeded `createRng`:
  - **The first spawn** comes at the first tick. Spawns then keep a 550–800 ms gap, and each `x` is within [0, 1].
  - **A good item:** tapping it raises `got` and removes it.
  - **A decoy:** tapping it raises `misses` and removes it.
  - **No-op taps:** an unknown id, or the same id tapped twice, returns null. So does a tap after `phase === 'done'`.
  - **Falling out:** an item whose `y` reaches 1 is removed with no penalty.
  - **The end:** `phase` becomes `'done'` the moment `got` reaches 6, or when `elapsedMs` reaches 15 000.
  - **Stars:**
    - 6 caught and 0 misses gives 3.
    - 6 caught and 2 misses gives 2.
    - 4 caught and 3 misses gives 1.
    - 3 caught gives 1.
    - Before done, `stars()` is null.
  - **Hard mode:** over 200 spawns its decoy share is within 0.6 ± 0.08, and every fall time is within 3 000–4 500 ms.
- [ ] **Step 2:** Run `npx vitest run tests/sim/steam.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `SteamGame`.**
  - Each spawn draws decoy-or-good, then which thing, then `x`, then its fall time. Good things are the three recipe ingredients.
  - `y = ageMs / fallMs`.
  - `tick` steps the clock in one go: spawn timer, ages, removals, then the time limit.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5: Commit** `src/sim/steam.ts`, `tests/sim/steam.test.ts` and `src/config.ts`, message "Add the leaf-drop rules for the Xông lá mini-game".

### Task 4: Art: ingredients, tent, steam pot and icons

**Files:**
- Create: `src/art/ingredients.ts`. It exports `ingredientTextures(): Record<string, string>`, keyed `ing-<thing>` for the 8 ingredients and 3 decoys, on a 1×1 viewBox at `TILE`.
- Create: `src/art/steamArt.ts`. It exports `steamTextures()` with `st-pot`: a cobalt pot of green leaves over a small fire, the sketch's kettle.
- Modify:
  - `src/art/furniture.ts`: add `FURNITURE.steamTent = { w: 2, h: 2.6, body }`, a round cream-and-terracotta striped tent seen from above at three-quarters, with a mustard top knob.
  - `src/art/fx.ts`:
    - `svc-steam` and `stock-herbs` badges, in the same `badge(...)` style as the neighbours;
    - `fx-steam`, two grey-blue steam curls.
  - `src/scenes/BootScene.ts`: load `ingredientTextures()` and `steamTextures()`.
- Test: `tests/art/ingredients.test.ts`, plus additions to `tests/art/fx.test.ts`.

**Interfaces:**
- Produces: the texture keys `ing-<SteamThing>` (all 11), `st-pot`, `steamTent` (furniture), `svc-steam`, `stock-herbs` and `fx-steam`.

- [ ] **Step 1: Write failing tests.**
  - `ingredientTextures()` has a key for every id in `INGREDIENTS` and `DECOYS`.
  - `steamTextures()` has `st-pot`.
  - `fxTextures()` has `svc-steam`, `stock-herbs` and `fx-steam`.
  - `FURNITURE.steamTent.w` is 2.
  - Use `vi.mock('phaser', () => ({}))` as the other art tests do.
- [ ] **Step 2:** Run `npx vitest run tests/art`. Expected: FAIL.
- [ ] **Step 3: Draw the pictures.**
  - Style A: palette `C`, ink outlines.
  - Match the shapes of the sketch page's icons:
    - leaf, stalks, knobby root;
    - salt crystals, mud bowl, honey jar;
    - coconut half, teal dropper bottle;
    - round guava leaf, red chili, long banana leaf.
  - The decoys must read clearly apart from the good leaves at 120 px.
- [ ] **Step 4:** Run `npx vitest run tests/art`. Expected: PASS.
- [ ] **Step 5: Commit** the art files, `src/scenes/BootScene.ts` and the tests, message "Draw the ingredients, the steam tent, the leaf pot and the Xông lá icons".

### Task 5: The Xông lá service in the sim

**Files:**
- Modify:
  - `src/sim/services.ts`
  - `src/config.ts`
  - `src/sim/items.ts`
  - `src/sim/grid.ts`
  - `src/sim/spa.ts`
  - `src/sim/stock.ts`
  - `src/sim/customers.ts`
  - `src/sim/economy.ts`
  - `src/sim/types.ts`
  - `src/strings/vi.ts`
  - `src/scenes/SpaScene.ts` (the two service maps only)
- Test: `tests/sim/services.test.ts`, `tests/sim/items.test.ts`, `tests/sim/grid.test.ts`, `tests/sim/economy.test.ts`, `tests/sim/customers.test.ts`, `tests/sim/stock.test.ts`, `tests/view/catalog.test.ts`

**Interfaces:**
- Consumes: `RecipeId`, `RecipeBook` and `emptyRecipes` from Task 2. The `steamTent`, `svc-steam` and `stock-herbs` textures from Task 4.
- Produces:

```ts
// services.ts
export type BasicService = 'shampoo' | 'mask' | 'massage'
export type RecipeService = RecipeId
export type ServiceId = BasicService | RecipeService
export const BASIC_SERVICES: readonly BasicService[]
export const RECIPE_SERVICES: readonly RecipeService[]
export const SERVICE_IDS: ServiceId[] // basic, then recipe services
export const isRecipeService: (id: ServiceId) => id is RecipeService
export type ServiceProblem = 'debt' | 'money' | 'order' | 'recipe'
// items.ts
export function bedTile(item: Item): Tile // flip ? (x, y+1) : (x+w−1, y+1); null-free, beds only
export function workTile(item: Item): Tile | null // flip ? (x−1, y+1) : (x+w, y+1)
// economy.ts
export const serviceArrivalFactor: (available: readonly ServiceId[]) => number
// spa.ts
recipes: RecipeBook // = emptyRecipes()
benchOpen(): boolean // services includes 'massage'
// stock.ts
export type StockItem = 'shampoo' | 'towel' | 'mask' | 'oil' | 'herbs'
```

- [ ] **Step 1: Write failing tests.**
  - **services:**
    - Opening `steam` with massage closed gives `'order'`.
    - With massage open but the recipe unsolved, it gives `'recipe'`.
    - With `sim.recipes.steam.solved = true` and money 600 000, it opens for 500 000, so money is 100 000.
    - In debt it gives `'debt'`, and short of money `'money'`.
  - **items/grid:**
    - A `steamTent` at `(8, 8)` has its footprint at x 8–9, y 8–9.
    - Its `workTile` is `(10, 9)` and its `bedTile` is `(9, 9)`.
    - Flipped, they are `(7, 9)` and `(8, 9)`.
    - `bed`, `maskBed` and `massageBed` keep their tiles: work at `(x+1, y+1)`, bed at `(x, y+1)`.
    - The grid marks the bed tile `'bed'`, the other three `'bedEnd'`, and the work tile `'work'`.
    - `canPlace('steamTent', 10, 8, false)` is refused (`offFloor`).
  - **spa:**
    - With steam solved and open, a tent bought at `(8, 8)`, and a `steam` customer `startService`d, the customer's position equals `bedTile`.
    - The owner stands on `(10, 9)`.
    - The stock lost 1 herbs and 1 towel (`day = 5`).
  - **economy:**
    - `serviceArrivalFactor(['shampoo','mask','massage'])` is 0.8.
    - `serviceArrivalFactor(['shampoo','mask','massage','steam'])` is 0.75, within float tolerance.
  - **customers:** the elder `prefers` includes `'steam'`.
  - **stock:**
    - `fullStock().herbs` is 20, and `STOCK_USES.steam` is `['herbs','towel']`.
    - `RESTOCK_PRICE.herbs` is 440 000.
  - **catalog:** the bed tab lists `steamTent` only when `'steam'` is open.
- [ ] **Step 2:** Run the listed tests. Expected: FAIL.
- [ ] **Step 3: Implement the sim side.**
  - Add `steam` to the config prices, and `herbs` to `RESTOCK_PRICE`. Add `RECIPE_ARRIVAL_STEP = 0.05` next to `SERVICE_ARRIVAL_STEP`.
  - Add `SERVICES.steam = { bed: 'steamTent', name: 'serviceSteam', busy: 'busySteam', … }`, and add `'busySteam'` to the toast-key union in `types.ts`.
  - `serviceProblem`, in this order:
    1. open → null;
    2. debt;
    3. for a basic service, the old order rule; for a recipe service, `'order'` until massage is open, then `'recipe'` until solved;
    4. money.
  - `ITEMS.steamTent` goes right after `massageBed`, with name `'itemSteamTent'`.
  - `rebuildRoom`'s station bed and `buildGrid`'s bed cell and `grid.beds` both use `bedTile`.
  - `serviceArrivalFactor` takes the available list: 1 − 0.1 × (basic count − 1) − 0.05 × (recipe count).
  - The elder's `prefers` becomes `['massage', 'steam']`.
  - **Strings:** `serviceSteam: 'Xông lá'`, `itemSteamTent: 'Lều xông lá'`, `stockHerbs: 'Gói lá xông'` and `busySteam: 'Lều xông đang bận'`.
  - **SpaScene's maps:**
    - `MINI_GAME_SCENE.steam = 'SteamScene'`, which Task 6 registers. Until then it can't be reached, because no recipe can be solved through the game yet.
    - `DEMO_HINT.steam = 'demoSteam'`, with `'demoSteam'` added to `HINT_IDS`.
- [ ] **Step 4:** Run `npx vitest run` and `npm run build`. Expected: all pass, with no type errors.
- [ ] **Step 5: Commit** every modified file above, by name, message "Add Xông lá to the shop's rules: the steam tent, herbs stock and the any-order opening after massage".

### Task 6: The leaf-drop scene and the tent in the shop

**Files:**
- Create: `src/scenes/SteamScene.ts`
- Modify: `src/main.ts` (register `SteamScene`), `src/scenes/SpaScene.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes:
  - `SteamGame`, `Falling` and `DECOYS` (Task 3);
  - the `ing-*`, `st-pot` and `fx-steam` textures (Task 4);
  - the `steam` service (Task 5);
  - `MiniGameData`, `addMiniGameCard`, `drawBars` and `revealStars` from `src/view/miniGame.ts`.
- Produces: `INGREDIENT_NAME: Record<SteamThing, string>` in `vi.ts`, with the spec's names for all 11 things. Task 11 uses it.

- [ ] **Step 1: Implement.**
  - **Strings:**
    - the instruction `steamTap`, one line naming lá bưởi, sả and gừng;
    - `INGREDIENT_NAME`;
    - the wrong-tap line `steamWrong: '{name} không có trong công thức'`.
  - **`SteamScene`**, built like `MassageScene`:
    - `new SteamGame(createRng(Date.now()), params.hard)`.
    - A pot at the card's foot, and falling `ing-*` sprites with their name under each. Each tappable area is at least 150 px across.
    - Progress `got/6` and time bars.
    - A caught item flies into the pot. A wrong tap shows `steamWrong` briefly in lantern red.
    - When the game is done, `revealStars`, then `params.onDone`.
    - With `params.demo`, a faint hand (as in `MassageScene`) taps the first good item until the first touch.
  - **SpaScene:**
    - In `syncCustomer`, a customer lying at a `steam` station is hidden.
    - While a steam station has a customer lying in it, an `fx-steam` image bobs above the tent.
- [ ] **Step 2: Check it.**
  - `npx vitest run` and `npm run build` pass.
  - In the browser at 390×844, use the console to set `recipes.steam.solved`, open steam and buy a tent. The owner serves a Xông lá customer and plays the game through, with the demo hand the first time.
  - Take a screenshot mid-game and one of the tent with steam.
  - The console has no errors.
- [ ] **Step 3: Commit** `src/scenes/SteamScene.ts`, `src/main.ts`, `src/scenes/SpaScene.ts` and `src/strings/vi.ts`, message "Add the Xông lá leaf-drop game, and hide the customer in a steaming tent".

### Task 7: Mixing, the bench gate, hints and the candidate pool

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/types.ts`, `src/sim/staff.ts`, `src/sim/crew.ts`
- Create: `tests/sim/spa-recipes.test.ts`
- Test: `tests/sim/staff.test.ts`

**Interfaces:**
- Consumes: Task 2 (`isMix`, `sameMix`, `rightCount`, `pickHint`) and Task 5 (`benchOpen`, `recipes`, `BASIC_SERVICES`, `isRecipeService`).
- Produces:

```ts
// spa.ts
export type MixOutcome = { kind: 'tried'; right: number } | { kind: 'repeat'; right: number } | { kind: 'problem'; problem: 'debt' | 'money' }
mixRecipe(id: RecipeId, mix: readonly Ingredient[]): MixOutcome // throws on !isMix, !benchOpen(), or a solved recipe
// types.ts SimEvent
| { type: 'recipeHint'; customerId: number; regular: RegularId; recipe: RecipeId; ingredient: Ingredient }
// staff.ts
export const candidatePool: (open: readonly ServiceId[]) => ServiceId[] // basic services + open recipe services
export function makeCandidate(rng: Rng, taken: string[], open: readonly ServiceId[]): Candidate
```

- [ ] **Step 1: Write failing tests** in `tests/sim/spa-recipes.test.ts`. Use a shop with mask and massage open, `money = 1_000_000`.
  - **Mixing:**
    - A wrong mix returns `{kind:'tried', right: 2}`, takes 20 000, and adds one try.
    - The same bowl in another order returns `{kind:'repeat', right: 2}` and takes nothing.
    - The right bowl solves the recipe, so `serviceProblem('steam')` is null.
    - `stats` is unchanged by mixing.
  - **Money:**
    - At exactly 20 000, a new mix leaves 0.
    - At 19 999, it gives `problem: 'money'` with nothing spent and no try added.
    - At −1, it gives `'debt'`.
    - A repeat at 0 and at −1 still answers `'repeat'`.
  - **Refusals:** `mixRecipe` throws for a 2-item bowl, before massage is open, and once solved.
  - **Hints**, with a regular served by `startService`/`completeService` in the shop (see `tests/sim/spa-regulars.test.ts` for the setup):
    - **What it emits:** with massage open and an rng whose hint draws pass, a 2★ visit emits `recipeHint` with `ingredient` in `['pomelo','lemongrass']`. The hint is pushed to `recipes.steam.heard`.
    - **When it doesn't:** none comes on a 1★ visit, before massage is open, after the recipe is solved, after both hints are heard, or on the visit that gives the regular's gift.
    - **After a heart:** on a visit that gives a new heart (and no gift), the events come in this order: `heart`, then `recipeHint`.
  - **staff:**
    - `candidatePool(['shampoo'])` equals `['shampoo','mask','massage']`.
    - `candidatePool(['shampoo','mask','massage','steam'])` adds `'steam'`.
    - Over 300 candidates drawn with steam closed, no one has a steam tier above 0.
- [ ] **Step 2:** Run `npx vitest run tests/sim/spa-recipes.test.ts tests/sim/staff.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **`mixRecipe`:** check the refusals first. Then a repeat, which is free. Then debt and money. Then charge `RECIPE_TRY_COST` without touching `stats`, record the try, and set `solved` when right is 3.
  - **`payFor`:** after `addVisit`, when `c.regular`, `stars >= 2`, `benchOpen()` and `!r.gift`, call `pickHint(this.recipes, this.rng)`. On a hit, push the hint to `heard` and emit `recipeHint` after the `heart`/`gift` events.
  - **Candidates:** `refreshCandidates` passes `sim.services`. `makeCandidate` draws its tier pool from `candidatePool(open)`.
  - **Fixed seeds:** if this rng change moves any existing seeded test, re-pick the test's seed or setup. Never weaken an assertion.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit**, message "Mix recipes at the bench, let regulars drop hints, and draw specialties only from services a shop can have".

### Task 8: Hint bubbles after the heart bubble

**Files:**
- Modify: `src/scenes/SpaScene.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes: the `recipeHint` event from Task 7.
- Produces: `RECIPE_HINT_TEXT: Record<RecipeId, Partial<Record<Ingredient, string>>>` in `vi.ts`, holding the two lô A lines from Global Constraints.

- [ ] **Step 1: Implement.**
  - `sayNext(customerId, text, ms)`: when that customer has a live bubble, queue the line; otherwise `say` now.
  - In `moveBubbles`, a done bubble with a queued line hands its spot to the new bubble, so it shows even after the customer has left.
  - `recipeHint` calls `sayNext` with `BUBBLE_MS.story`.
- [ ] **Step 2:** Run `npm run build` and `npx vitest run` (`tests/strings` covers the new copy). Expected: PASS.
- [ ] **Step 3: Commit**, message "Show a regular's recipe hint as a bubble, after the heart story when both come at once".

### Task 9: Save v12

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/spa.ts` (`toSave`/`fromSave`)
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Consumes: `RecipeBook`, `isMix` and `rightCount` (Task 2), and the `steam` service (Task 5).
- Produces: `SaveData.recipes: RecipeBook`, and `SAVE_VERSION = 12`.

- [ ] **Step 1: Write failing tests.**
  - **Round trip:** `toSave` then `fromSave` keeps `recipes`: solved, tries and heard.
  - **The v11 fixture** from Task 1 parses, and:
    - every old field is equal;
    - `recipes` equals `emptyRecipes()`;
    - `stock.herbs` is 20;
    - every staff member's and candidate's `tiers.steam` is 0;
    - the booked course is kept.
  - **Every older fixture** (v1–v10) still parses, with empty recipes.
  - **Damaged recipes:**
    - a try with 2 items, an unknown ingredient, or a repeated ingredient is dropped;
    - a saved `right` that disagrees is recomputed;
    - a heard ingredient that is not one of that recipe's hints is dropped;
    - a try with all 3 right marks the recipe solved;
    - `services` containing `steam` marks it solved;
    - a non-object `recipes` becomes empty.
- [ ] **Step 2:** Run `npx vitest run tests/sim/save.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `SAVE_VERSION = 12`, and `parseVersioned` accepts 11.
  - `repairRecipes(x, services)` is used in `parseSave`.
  - The sim saves and loads `recipes`.
  - Herbs and the steam tier already default through the existing stock and tier repair. Confirm this with the test, and don't duplicate it.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** `src/sim/save.ts`, `src/sim/spa.ts` and `tests/sim/save.test.ts`, message "Save v12: keep the recipe book, and open older shops with no recipes, fresh herbs and no Xông lá tier".

### Task 10: Compact Services and Stock screens, with the recipe rows

**Files:**
- Modify: `src/scenes/ServicesScene.ts`, `src/scenes/SpaScene.ts` (the intro hint), `src/sim/types.ts` (`'recipes'` in `HINT_IDS`), `src/strings/vi.ts`

**Interfaces:**
- Consumes: `isRecipeService`, `benchOpen`, `recipes` and `serviceProblem` (Tasks 5 and 7).
- Produces: the `ServicesScene` row action for an unsolved recipe service, which calls `this.openBench(id)`. Task 11 fills it in with `this.scene.launch('RecipeScene', …)`. Until then it is a no-op that only shows the button.

- [ ] **Step 1: Implement.**
  - **Space:** set `ROW_H` and `STOCK_ROW_H` so six of each fit between the tabs (`TABBED_ROW_TOP`) and the top of the Done button (`DONE_Y − 65`), at about 200 px each. Shrink the row texts until each row's text and button sit inside its height. Keep the button height at 110 or more.
  - **Recipe service rows:**
    - Massage closed: faded, with the `serviceOrder` text naming Massage, and no button.
    - Not solved: a primary button "Pha công thức" (`serviceRecipe`).
    - Solved: the normal "Mở · {money}" button.
    - Open: as now.
  - **`open()`:** for a recipe service, the `'order'` toast names Massage.
  - **The intro line:** the first time the screen opens with `benchOpen()` and `'recipes'` not done, the intro is `recipesIntro`, the exact spec line. Mark it on close.
- [ ] **Step 2: Check it.**
  - `npm run build` passes, and so does `npx vitest run`.
  - In the browser at 390×844, with a shop that has all four services open and all five stock items in use, take a screenshot of both tabs.
  - Nothing overlaps, and nothing is cut.
- [ ] **Step 3: Commit**, message "Fit six services and six stock items on the Services screen, with a recipe button for the new services".

### Task 11: The recipe bench screen

**Files:**
- Create: `src/scenes/RecipeScene.ts`
- Modify: `src/main.ts` (register it), `src/scenes/ServicesScene.ts` (`openBench`), `src/strings/vi.ts`

**Interfaces:**
- Consumes:
  - `mixRecipe` and `MixOutcome` (Task 7);
  - `RECIPE_HINT_TEXT` (Task 8);
  - `INGREDIENT_NAME` and the `ing-*` textures (Tasks 4 and 6);
  - `RECIPE_SERVICES` (Task 5).
- Produces: `RecipeScene` with data `{ sim: SpaSim; service: RecipeId; onChange: () => void; onClose: () => void }`.

- [ ] **Step 1: Implement**, following the sketch page.
  - **Page layout:**
    - a dim backdrop and a card;
    - the title "Bàn pha công thức" and the current money;
    - a chip per `RECIPE_SERVICES` entry, with ✓ when solved (one chip in lô A);
    - a bowl of 3 slots, where tapping a filled slot empties it;
    - a 4×2 shelf of the 8 `INGREDIENTS`, each with icon and name, disabled once in the bowl;
    - the mix button "Pha thử · 20.000 đ", faded until the bowl is full, and faded with the reason toast on `'money'`/`'debt'`;
    - one result line;
    - the heard hint lines of the selected recipe;
    - the last 4 tries, newest first, each with 3 icons and "đúng n/3";
    - Done.
  - **What a mix shows:**
    - **Tapping a full shelf:** shows the line "Chén đã đủ 3 món".
    - **A repeat:** the line "Chén này pha rồi: đúng {n} món".
    - **A miss:** "Đúng {n} món", with n filled dots.
    - **The solve:** the bowl shows the recipe, the `star` sound and a spark burst, and the line "Đúng cả 3 món! Giờ mở được Xông lá."
  - **Wiring:**
    - Every mix calls `onChange`, so the HUD money updates.
    - Done calls `onClose` and stops the scene.
    - `ServicesScene.openBench` launches `RecipeScene` with `onClose: () => this.show()`.
- [ ] **Step 2: Check it.**
  - `npm run build` and `npx vitest run` pass.
  - In the browser at 390×844, open the bench from Services. Mix wrong, repeat the bowl, then mix right.
  - The Services row changes to "Mở · 500.000 đ".
  - Take a screenshot of each state. Nothing overlaps, and the console has no errors.
- [ ] **Step 3: Commit**, message "Add the recipe bench: mix three ingredients, see how many are right, and unlock Xông lá".

### Task 12: Whole lô check and ship (controller)

- [ ] **Full suite and build:** `npx vitest run` and `npm run build` both pass.
- [ ] **Browser run at iPhone size**, from a fresh day-6 shop with massage open (set up through the console):
  1. See the intro line.
  2. Hear a hint: force a regular's visit, and check the hint bubble follows the heart bubble.
  3. Pha thử a wrong mix, then the right one.
  4. Open Xông lá and buy the tent.
  5. The owner serves a Xông lá customer and plays the leaf game, with the demo hand the first time. The customer is hidden in the tent, and steam bobs over it.
  6. A technician serves one.
  7. Herbs go down.
  8. Reload the page mid-day, and everything is kept.
  9. The console has no errors.
- [ ] **Ship:**
  - Check `origin/master`, since other sessions push here. Integrate in a temp worktree if it moved, and re-run the suite.
  - Merge `dot-2-dich-vu-a` into master with `--ff-only` if possible, then push.
  - Check that GitHub Actions passes and that the live site serves the new build.
