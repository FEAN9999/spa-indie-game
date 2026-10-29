# Xoay đồ lô A: screen and desk as furniture, long pieces turn (save v30) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In build mode one **Xoay** button, in place of **Lật**, steps a piece through its facings. The 17 long pieces (15 long decor and seat kinds, plus the new screen and desk) get four facings: lying as now, stood upright, and each of those mirrored. Square pieces and beds only mirror, as Lật did. The two rattan screens and the reception desk stop being part of the room. They become furniture to move, turn and sell, and to buy again from the decor tab. The shop always keeps one desk, on floor 1. The owner's start tile follows the oldest desk. Old saves gain the screens and desk where they always stood. Save version 30.

**Architecture:**
- **`Item` gains `turned?: boolean`.** It is saved only when true, like `gift`.
  - `size(item)` swaps `w × h` when turned. Everything that reads a placed item's size goes through it.
  - `nextFacing(item)` is the cycle, and `canTurn(kind)` says which kinds have four facings.
  - Sim calls take a trailing `turned = false`, so every existing call and test keeps working.
- **Screens and desk become kinds.** They are `screen` and `desk`, and the layout chars `H` and `R` become item chars. So `shellOf` blanks them, and `itemsFromLayout` makes them the default shop's last three items.
  - `buildGrid` still files their tiles under `grid.decor.screen` and `grid.desks`, so receptionist, VIP and room-art code keeps reading the same grid fields.
- **`deskSpot(item)` is a desk's owner tile.** `claimed` keeps it, like a bed's work tile, and `placeProblem` requires every desk's spot to be reached from the door. This replaces the separate `ownerStart` extra.
  - `SpaSim.ownerStart()` is the oldest desk's spot. It replaces `OWNER_START` wherever the sim and crew read it.
- **The room view stops drawing fixtures.** Screens and desk are item sprites now.
  - An upright piece draws by its top row, so people on or beside its lower rows show in front.
  - Room art takes the screen row from the full layout, so the floors and runner never move.

**Tech Stack:** Phaser 4, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-29-xoay-do-design.md`. Lô A covers:
- §4.1 to §4.5;
- §4.7, except the lô B line;
- §7 and §8 for lô A.

Beds (§4.6) are lô B and must not turn here.

**OSS research** (CLAUDE.md rule, done for the spec, §6):
- Stardew Valley gives each piece 1, 2 or 4 rotations, each with its own sprite.
- The Habbo emulator Arcturus swaps width and length for sideways rotations.
- We take the ideas only. The code is our own.

**Baseline:**
- 1473 tests in 116 files pass on `xoay-do` at eb7e7b0. That is master 38973fd plus the spec and the v29 fixture.
- Typecheck: `npx tsc --noEmit` (it includes `tests/`).
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.
- `tests/fixtures/save-v29.json` is already committed (eb7e7b0). Master 38973fd wrote it: a main shop with a mask bed at (6,2), ids 1–14 and `nextItemId` 15, plus the beach branch. Never edit it.

## Global Constraints

- **Old shops are untouched (spec §2, §4.7).** A save from v3 to v29, main shop and every branch, opens with:
  - every existing item, id, place and flip unchanged;
  - the screens and desk appended in this order:
    - `{ kind: 'screen', x: 1, y: 6 }`;
    - `{ kind: 'screen', x: 7, y: 6 }`;
    - `{ kind: 'desk', x: 8, y: 14 }`;
  - those three numbered from the save's `nextItemId`, which is then raised by 3;
  - the same `beauty()`;
  - `ownerStart()` equal to `{ x: 9, y: 13 }`.
- v1 and v2 saves already get them through `DEFAULT_ITEMS`. A save at v30 or later never gets them added, even with a screen sold.
- **New kinds (spec §4.3, §4.4).** Both go in `ITEMS` right after `slippers`, so the decor tab lists them after the plain decor:
  - `screen: { w: 5, h: 1, price: 200_000, beauty: 0, group: 'decor', name: 'itemScreen' }`;
  - `desk: { w: 3, h: 1, price: 400_000, beauty: 0, group: 'decor', name: 'itemDesk' }`.
- **Strings, exact:**
  - `itemScreen: 'Bình phong'`
  - `itemDesk: 'Quầy lễ tân'`
  - `problemDeskFloor: 'Quầy lễ tân chỉ đặt ở tầng 1'`
  - `problemLastDesk: 'Tiệm cần ít nhất một quầy lễ tân'`
  - `turn: 'Xoay'`
  - Remove `flip` once nothing uses it.
- **Facings (spec §4.1, §4.2):**
  - The cycle is `!turned → turned`, then `turned → !turned` with `flip` toggled. That is (F,F) → (T,F) → (F,T) → (T,T) → (F,F).
  - A turn keeps the middle tile `(x + ⌊w/2⌋, y + ⌊h/2⌋)` of the old size as the middle tile of the new size.
  - `canTurn(kind)` is `w !== h && group !== 'bed'`. That gives exactly 17 kinds: `bench, tea, planter, slippers, screen, desk, shelf, cabinet, lotus, teaChest, bambooBench, bambooTea, bambooShelf, silkScreen, regularsBoard, goldBoard, starWall`.
  - A kind that cannot turn only toggles `flip`.
- **Desk rules (spec §4.4):**
  - `deskSpot` of an unturned desk is `(x + 1, y − 1)`.
  - A turned desk's front faces right when `flip` is false. Its spot is then `(x − 1, y + 1)`, or `(x + 1, y + 1)` when flipped.
  - Every desk keeps its spot. A desk only stands on floor 1 (`deskFloor`). Selling the last desk gives `lastDesk`.
  - The oldest desk (lowest id) is the owner's start.
  - The owner starts the day facing the desk:
    - `'down'` for an unturned desk;
    - `'right'` for a turned, unflipped one;
    - `'left'` for a turned, flipped one.
  - The receptionist at home faces the desk tile beside them.
- **The floor split and the runner stay at layout row 6** in all four room textures (spec §4.3).
- **Beds never turn in lô A.** No new art for beds.
- No new dependency.
- Commit messages are one plain sentence saying what changed, like the repo's history, with no prefix and no attribution lines.

## Review Focus

1. **Turning a held piece at the edge of a floor.** For example, a 5-long screen turned on floor 2's top rows, or a bench at the right wall. The piece must stay wholly on the floor in view, never spill onto the floor above or below. Task 7 pins this with `clampToFloor`.
2. **Moving the desk while the receptionist stands at it.** They walk to the new spot and face the desk. Task 3 pins this.
3. **Two desks, then selling the oldest.** The owner's start moves to the other desk's spot, and the sale is allowed because that spot is already kept and reached. Task 3 pins this.
4. **A branch from an old save.** It gets its own screens and desk, and its owner starts at (9,13). Task 4 pins this.
5. **An upright waiting bench.** Its three tiles are seats a customer can be fetched from. Task 1 pins this.

---

### Task 1: Facings in the sim

**Files:**
- Modify: `src/sim/items.ts`
- Modify: `src/sim/spa.ts`, the methods `canPlace`, `buy`, `placeGift` and `move`
- Modify: `src/sim/save.ts`, the item repair next to the `gift` line in `parseShop`
- Test: `tests/sim/items.test.ts`, `tests/sim/build.test.ts`, `tests/sim/save.test.ts`

**Interfaces:**
- Produces, in `src/sim/items.ts`:
  - `Item.turned?: boolean`, with the doc "Stood on its side: its footprint is h × w. Saved only when true."
  - `size(item: { kind: ItemKind; turned?: boolean }): { w: number; h: number }`
  - `canTurn(kind: ItemKind): boolean`
  - `nextFacing(item: Item): Item`. It returns a new item and never mutates. `turned` is omitted, not `false`, when unturned.
- `footprint` uses `size`.
- Produces, on `SpaSim`:
  - `canPlace(kind, x, y, flip, movingId?: number, turned = false)`
  - `buy(kind, x, y, flip, turned = false)`
  - `placeGift(kind, x, y, flip, turned = false)`
  - `move(id, x, y, flip, turned = false)`
- The stored item carries `turned: true` only when true. A move with `turned` false deletes the key.

- [ ] **Step 1: Write the failing tests** in `tests/sim/items.test.ts`:

```ts
describe('facings', () => {
  const bench: Item = { id: 1, kind: 'bench', x: 2, y: 13, flip: false }
  it('stands a turned piece on its side', () => {
    expect(size({ kind: 'bench', turned: true })).toEqual({ w: 1, h: 3 })
    expect(footprint({ ...bench, x: 3, y: 12, turned: true })).toEqual([{ x: 3, y: 12 }, { x: 3, y: 13 }, { x: 3, y: 14 }])
  })
  it('turns a long piece through four facings about its middle tile', () => {
    const a = nextFacing(bench)
    expect(a).toEqual({ ...bench, x: 3, y: 12, turned: true })
    const b = nextFacing(a)
    expect(b).toEqual({ ...bench, flip: true })
    expect('turned' in b).toBe(false)
    const c = nextFacing(b)
    expect(c).toEqual({ ...bench, x: 3, y: 12, flip: true, turned: true })
    expect(nextFacing(c)).toEqual(bench)
  })
  it('turns a two-tile piece back onto its own tiles', () => {
    const tea: Item = { id: 2, kind: 'tea', x: 2, y: 10, flip: false }
    expect(footprint(nextFacing(tea))).toEqual([{ x: 3, y: 9 }, { x: 3, y: 10 }])
    expect(nextFacing(nextFacing(tea))).toEqual({ ...tea, flip: true })
  })
  it('only mirrors square pieces and beds', () => {
    expect(ITEM_KINDS.filter(canTurn).sort()).toEqual(['bambooBench', 'bambooShelf', 'bambooTea', 'bench', 'cabinet', 'goldBoard', 'lotus', 'planter', 'regularsBoard', 'shelf', 'silkScreen', 'slippers', 'starWall', 'tea', 'teaChest'])
    const plant: Item = { id: 3, kind: 'plant', x: 1, y: 16, flip: false }
    expect(nextFacing(plant)).toEqual({ ...plant, flip: true })
    const bed: Item = { id: 4, kind: 'bed', x: 2, y: 2, flip: false }
    expect(nextFacing(bed)).toEqual({ ...bed, flip: true })
  })
})
```

Task 2 adds `screen` and `desk` to the `canTurn` list in this test.

- [ ] **Step 2: Write the failing sim and save tests.**

In `tests/sim/build.test.ts`, using its `shop()` and `idOf`:

```ts
it('places, moves and keeps a turned piece, whose seats stand upright', () => {
  const sim = shop()
  const bench = idOf(sim, 'bench')
  expect(sim.move(bench, 4, 9, false, true)).toBeNull()
  expect(sim.items.find(i => i.id === bench)).toEqual({ id: bench, kind: 'bench', x: 4, y: 9, flip: false, turned: true })
  expect(sim.grid.seats).toEqual([{ x: 4, y: 9 }, { x: 4, y: 10 }, { x: 4, y: 11 }])
  expect(sim.buy('shelf', 2, 9, false, true)).toBeNull()
  expect(sim.items.at(-1)).toMatchObject({ kind: 'shelf', x: 2, y: 9, turned: true })
  expect(sim.move(bench, 2, 13, false)).toBeNull()
  expect('turned' in sim.items.find(i => i.id === bench)!).toBe(false)
  sim.book.gifts.push('silkScreen')
  expect(sim.placeGift('silkScreen', 6, 9, false, true)).toBeNull()
  expect(sim.items.at(-1)).toMatchObject({ kind: 'silkScreen', turned: true, gift: true })
})
```

Add a test to `tests/sim/save.test.ts`: "keeps a turned piece and drops a turned flag that is not true". It makes a shop with one piece turned and saves it. After the JSON round trip and `parseSave`, that item has `turned: true`. Then it edits the raw save so one item has `turned: false` and another has `turned: 'yes'`. Both parse with no `turned` key, and neither throws.

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/sim/items.test.ts tests/sim/build.test.ts tests/sim/save.test.ts`
Expected: FAIL. `size`, `nextFacing` and `canTurn` are not exported, and `turned` is not stored.

- [ ] **Step 4: Implement them.**
- `footprint` uses `size`. `workTile` and `bedTile` keep `ITEMS[...].w`, because beds never turn here.
- `SpaSim.canPlace` builds the candidate with `turned` set only when true. Each of `buy`, `placeGift` and `move` passes `turned` through and stores it the same way (`delete item.turned` on false in `move`).
- In `parseShop`, extend the existing `gift` map. Keep `turned` only when it is `true`. `isItems` stays as it is.

- [ ] **Step 5: Run the suite.**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass, 1473 + the new tests.

- [ ] **Step 6: Commit**

```bash
git add src/sim/items.ts src/sim/spa.ts src/sim/save.ts tests/sim/items.test.ts tests/sim/build.test.ts tests/sim/save.test.ts
git commit -m "Let a long piece stand turned on its side, with its footprint swapped, through four facings about its middle tile, and keep the turn in the save"
```

### Task 2: The screens and the desk become furniture

**Files:**
- Modify: `src/sim/items.ts` (kinds, `ITEMS`, `RUN_KINDS`, `itemsFromLayout`, `deskSpot`)
- Modify: `src/sim/grid.ts` (`buildGrid`)
- Modify: `src/sim/build.ts` (`BuildProblem`, `PROBLEM_TEXT`, `claimed`, `placeProblem`)
- Modify: `src/sim/spa.ts` (`canPlace` call, `sell`)
- Modify: `src/sim/stairs.ts` (its `placeProblem` call)
- Modify: `src/strings/vi.ts`
- Test: `tests/sim/items.test.ts`, `tests/sim/build.test.ts`, plus the three tests that pass `ownerStart` to `placeProblem`:
  - `tests/sim/branch.test.ts:142`
  - `tests/sim/build.test.ts:297`
  - `tests/sim/save.test.ts:1124`

**Interfaces:**
- Consumes `size` and `footprint` from Task 1.
- Produces:
  - `ItemKind` gains `'screen' | 'desk'`.
  - `deskSpot(item: Item): Tile | null`, in `items.ts`. It is null for anything but a desk.
  - `claimed(item)` returns the footprint, plus a bed's work tile, plus a desk's spot.
  - `placeProblem(shell, items, item, extras: { door: Tile; floors: number })` returns `'overlap' | 'bedWall' | 'seatFloor' | 'deskFloor' | 'blocksPath' | null`. The `ownerStart` extra is gone.
  - `BuildProblem` gains `'deskFloor' | 'lastDesk'`.
  - `sell` returns `'lastDesk'` for the only desk.

- [ ] **Step 1: Write the failing tests.**

In `tests/sim/items.test.ts`:

```ts
it("makes the screens and the desk the default shop's last items", () => {
  const n = DEFAULT_ITEMS.length
  expect(DEFAULT_ITEMS.slice(-3)).toEqual([
    { id: n - 2, kind: 'screen', x: 1, y: 6, flip: false },
    { id: n - 1, kind: 'screen', x: 7, y: 6, flip: false },
    { id: n, kind: 'desk', x: 8, y: 14, flip: false },
  ])
  expect(DEFAULT_ITEMS.slice(0, -3).map(i => i.kind)).toEqual(['bed', 'bed', 'cabinet', 'plant', 'shelf', 'lotus', 'vase', 'planter', 'bench', 'tea', 'plant', 'slippers', 'plant'])
  const shell = shellOf(SPA_LAYOUT_1A)
  expect([shell[6], shell[14]]).toEqual(['#...........#', '#...........#'])
})
it('keeps the tile behind a desk for the owner', () => {
  const desk: Item = { id: 1, kind: 'desk', x: 8, y: 14, flip: false }
  expect(deskSpot(desk)).toEqual({ x: 9, y: 13 })
  expect(deskSpot({ ...desk, x: 4, y: 9, turned: true })).toEqual({ x: 3, y: 10 })
  expect(deskSpot({ ...desk, x: 4, y: 9, turned: true, flip: true })).toEqual({ x: 5, y: 10 })
  expect(deskSpot({ id: 2, kind: 'bench', x: 2, y: 13, flip: false })).toBeNull()
  expect(claimed(desk)).toContainEqual({ x: 9, y: 13 })
})
```

Add `'desk'` and `'screen'` to the expected `canTurn` list from Task 1. The existing `g.desks` and `g.decor.screen` checks at `items.test.ts:35-39` must keep passing unchanged.

In `tests/sim/build.test.ts`:

```ts
it('moves, turns, sells and buys back a screen', () => {
  const sim = shop()
  const screen = idOf(sim, 'screen')
  expect(sim.move(screen, 9, 8, false, true)).toBeNull()
  expect(sim.sell(screen)).toBeNull()
  expect(sim.money).toBe(2_000_000 + 100_000)
  expect(sim.buy('screen', 1, 6, false)).toBeNull()
  expect(sim.money).toBe(2_000_000 + 100_000 - 200_000)
})
it('keeps the desk on floor 1, its spot free, and one desk in the shop', () => {
  const sim = shop()
  sim.money = 10_000_000
  const desk = idOf(sim, 'desk')
  expect(sim.canPlace('plant', 9, 13, false)).toBe('overlap')
  expect(sim.canPlace('desk', 6, 2, false)).toBe('overlap') // its spot (7,1) is the back wall
  expect(sim.sell(desk)).toBe('lastDesk')
  sim.floors = 2
  expect(sim.canPlace('desk', 4, 28, false)).toBe('deskFloor')
  expect(sim.buy('desk', 4, 10, false)).toBeNull()
  expect(sim.sell(desk)).toBeNull()
  expect(sim.money).toBe(10_000_000 - 400_000 + 200_000)
  expect(t(PROBLEM_TEXT.lastDesk)).toBe('Tiệm cần ít nhất một quầy lễ tân')
  expect(t(PROBLEM_TEXT.deskFloor)).toBe('Quầy lễ tân chỉ đặt ở tầng 1')
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim/items.test.ts tests/sim/build.test.ts`
Expected: FAIL, unknown kinds `screen` and `desk`.

- [ ] **Step 3: Implement the change.**
- Add the two `ITEMS` entries right after `slippers` (see Global Constraints) and the four strings.
- `RUN_KINDS` gains `H: 'screen', R: 'desk'`. The screen row splits into its two 5-tile runs by `w`, as the other runs do.
- `itemsFromLayout` gives `screen` and `desk` the last ids, keeping reading order among them and among the rest.
- `grid.ts` keeps `H` and `R` in its `parseLayout` tables, because the room art still parses the full layout (Task 6). In `buildGrid`:
  - a `desk` sets its cells to `'desk'` and pushes its tiles to `grid.desks`;
  - a `screen` sets its cells to `'decor'` and pushes its tiles to `grid.decor.screen`.
- `placeProblem`:
  - Drop `ownerStart` from `kept`. The desks' `claimed` now carries their spots.
  - After the `seatFloor` check, add `item.kind === 'desk' && floorOf(item.y) !== 1 → 'deskFloor'`.
  - Replace `reached(ownerStart)` with: every desk in `[...items, item]` has its `deskSpot` reached.
  - Update its doc comment.
- In `sell`, after the `lastSeat` line, add: the only `desk` → `'lastDesk'`. Update its doc comment ("one shampoo bed, one seat and one desk").
- Remove `ownerStart` from the calls in `spa.ts` and `stairs.ts`, and from the three tests listed under Files.
- Tests that count the default shop's items, or list them whole, change by exactly the three new items at the end. Change nothing else in them.

- [ ] **Step 4: Run the suite.**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass. Any other failure is a real regression to fix in code, not in the test.

- [ ] **Step 5: Commit**

```bash
git add -A src tests
git commit -m "Make the two rattan screens and the reception desk furniture, sold in the decor tab, with the desk kept on floor 1, its owner's tile kept free and reached, and one desk always left"
```

### Task 3: The owner's start follows the desk

**Files:**
- Modify: `src/sim/spa.ts`:
  - the constructor's owner;
  - `ownerArrives`;
  - `startDay`;
  - `standSpot`;
  - a new `ownerStart()` and `ownerStartFacing()`.
- Modify: `src/sim/crew.ts` (`groundFloor`, `receptionSpot`, `homeOf`, `walkHome`)
- Test: `tests/sim/spa-owner.test.ts`

**Interfaces:**
- Consumes `deskSpot` from Task 2.
- Produces, on `SpaSim`:
  - `ownerStart(): Tile`, the `deskSpot` of the desk with the lowest id. It falls back to `OWNER_START` only for a layout with no desk, which some test layouts have.
  - `ownerStartFacing(): Facing`, with the values from Global Constraints.
- Every use of `OWNER_START` in `spa.ts` and `crew.ts` reads `sim.ownerStart()` instead. `OWNER_START` stays in `config.ts` as the fallback and for the tests that import it.

- [ ] **Step 1: Write the failing tests** in `tests/sim/spa-owner.test.ts`, with a `new SpaSim({ rng: createRng(1), autoSpawn: false })` shop, `money` 10 000 000:

```ts
it('starts the day behind the moved desk, facing it', () => {
  const desk = sim.items.find(i => i.kind === 'desk')!.id
  expect(sim.ownerStart()).toEqual({ x: 9, y: 13 })
  expect(sim.move(desk, 4, 9, false, true)).toBeNull()
  expect(sim.ownerStart()).toEqual({ x: 3, y: 10 })
  expect(sim.ownerStartFacing()).toBe('right')
  sim.startDay()
  expect(sim.owner.pos).toEqual({ x: 3, y: 10 })
  expect(sim.owner.facing).toBe('right')
})
it('starts at the oldest desk, and at the next once it is sold', () => {
  const old = sim.items.find(i => i.kind === 'desk')!.id
  expect(sim.buy('desk', 4, 10, false)).toBeNull()
  expect(sim.ownerStart()).toEqual({ x: 9, y: 13 })
  expect(sim.sell(old)).toBeNull()
  expect(sim.ownerStart()).toEqual({ x: 5, y: 9 })
})
```

Add a third test, "sends the receptionist to the moved desk, facing it", using `hireStaff(sim, 'receptionist')` and `advanceUntil` from `helpers.ts`:
1. Advance until the receptionist stands on `sim.receptionSpot()`, then expect `facing` `'down'`.
2. Move the desk turned to `(4, 9)`.
3. Advance until they stand on the new `sim.receptionSpot()`. That spot is beside a desk tile and is not `(3, 10)`. Expect `facing` `'right'`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim/spa-owner.test.ts`
Expected: FAIL, `ownerStart` is not a function.

- [ ] **Step 3: Implement the change.**
- The owner is placed at `ownerStart()` facing `ownerStartFacing()` in three places: the constructor (after `rebuildRoom`), `ownerArrives` and `startDay`.
- `standSpot` excludes `this.ownerStart()`.
- In `crew.ts`, `groundFloor`, `receptionSpot` and `homeOf` read `sim.ownerStart()`.
- In `walkHome`, a receptionist at home faces the desk tile next to them (`grid.desks` at Manhattan distance 1: the direction from them to it). Others keep `'down'`.
- Update the doc comments that say "the owner's start" where they now mean the desk's spot.

- [ ] **Step 4: Run the suite.**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass. With the desk where it was, nothing that used `OWNER_START` changes.

- [ ] **Step 5: Commit**

```bash
git add src/sim/spa.ts src/sim/crew.ts tests/sim/spa-owner.test.ts
git commit -m "Start the owner's day behind the oldest desk, facing it, and keep the receptionist, the waiting stars and the staff homes by the desk wherever it stands"
```

### Task 4: Save v30 gives older shops their screens and desk

**Files:**
- Modify: `src/sim/save.ts`
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Consumes `DEFAULT_ITEMS` from Task 2.
- Produces:
  - `SAVE_VERSION = 30`;
  - `export const FURNISHED_SAVE_VERSION = 30`, the version from which the screens and desk are items;
  - `parseVersioned` accepts `raw.v === 29`.
- `parseShop` reads `raw.v` before `parseVersioned`, as it does for the stairs. For `3 ≤ v < 30` it appends copies of `DEFAULT_ITEMS`' screen, screen and desk, numbered from `data.nextItemId`, and raises `nextItemId` by 3. Branches go through `parseShop` too.

- [ ] **Step 1: Write the failing tests** in `tests/sim/save.test.ts`, importing `v29` from `../fixtures/save-v29.json`:

```ts
describe('the screens and the desk in an older shop', () => {
  it('stands them where they always stood, as the newest items, in the main shop and each branch', () => {
    const data = parseSave(structuredClone(v29))
    expect(data.items.slice(-3)).toEqual([
      { id: 15, kind: 'screen', x: 1, y: 6, flip: false },
      { id: 16, kind: 'screen', x: 7, y: 6, flip: false },
      { id: 17, kind: 'desk', x: 8, y: 14, flip: false },
    ])
    expect(data.items.slice(0, -3)).toEqual(v29.items)
    expect(data.nextItemId).toBe(18)
    for (const b of data.chain!.branches) expect(b.items.slice(-3).map(i => [i.kind, i.x, i.y])).toEqual([['screen', 1, 6], ['screen', 7, 6], ['desk', 8, 14]])
  })
  it('opens with the same beauty and the owner behind the desk', () => {
    const sim = open(v29)
    expect(sim.beauty()).toBe(beautyOf(v29.items as Item[]))
    expect(sim.ownerStart()).toEqual({ x: 9, y: 13 })
  })
  it('adds them once to a shop rebuilt from the default furniture', () => {
    for (const raw of [v1, v2]) expect(parseSave(structuredClone(raw)).items.filter(i => i.kind === 'desk')).toHaveLength(1)
  })
  it('never adds them again to a shop saved with them', () => {
    const sim = open(v29)
    expect(sim.sell(sim.items.find(i => i.kind === 'screen')!.id)).toBeNull()
    expect(parseSave(JSON.parse(JSON.stringify(sim.toSave()))).items.filter(i => i.kind === 'screen')).toHaveLength(1)
  })
})
```

Also add a test that a branch from `v29`, opened through the chain's loader as the chain tests do, has `ownerStart()` equal to `{ x: 9, y: 13 }`.

Also check the pre-stairs case: `open(v13)` still clears the stairs exactly as its existing test expects, and its desk is at `(8, 14)`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim/save.test.ts`
Expected: FAIL. No screens or desk are appended, and the save is at v29.

- [ ] **Step 3: Implement the change** as described under Interfaces.
- Write the doc comment in the style of the stairs version constant.
- Bump existing tests only where they assert `SAVE_VERSION`'s literal value.
- Add `v29` to the fixture lists that walk every old fixture (`save.test.ts:1765` and the like), if their checks still hold.

- [ ] **Step 4: Run the suite.**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/sim/save.ts tests/sim/save.test.ts
git commit -m "Raise the save to version 30, giving every older shop and branch its two screens and its desk where they always stood, numbered after its other furniture"
```

### Task 5: Upright pictures for the 17 long pieces

**Files:**
- Modify: `src/art/furniture.ts`
- Test: `tests/art/furniture.test.ts`

**Interfaces:**
- Consumes `canTurn`, `ITEMS` and `ITEM_KINDS` from Tasks 1 and 2.
- Produces `itemTexture(kind: ItemKind, turned = false): string`.
  - A kind that `canTurn` with `turned` gets `${itemTexture(kind)}-turned`.
  - Anything else gets `itemTexture(kind)`, as now.
- `FURNITURE` gains one `-turned` entry per kind that can turn. `furnitureTextures()` already loads every `FURNITURE` entry.

- [ ] **Step 1: Write the failing tests** in `tests/art/furniture.test.ts`:

```ts
it('draws an upright picture of its own for every piece that turns', () => {
  const tex = furnitureTextures()
  const turning = ITEM_KINDS.filter(canTurn)
  expect(turning).toHaveLength(17)
  for (const kind of turning) {
    const key = itemTexture(kind, true)
    expect(key).toBe(`${itemTexture(kind)}-turned`)
    expect(tex[key], kind).toBeDefined()
    expect(FURNITURE[key].w, kind).toBeGreaterThanOrEqual(1)
    expect(FURNITURE[key].w, kind).toBeLessThanOrEqual(1.2)
    expect(FURNITURE[key].h, kind).toBeGreaterThanOrEqual(ITEMS[kind].w)
    expect(FURNITURE[key].body, kind).not.toBe(FURNITURE[itemTexture(kind)].body)
  }
})
it('keeps one picture for every piece that only mirrors', () => {
  for (const kind of ITEM_KINDS.filter(k => !canTurn(k))) expect(itemTexture(kind, true)).toBe(itemTexture(kind))
})
it('draws the screen and the desk as wide as their footprints', () => {
  expect(FURNITURE[itemTexture('screen')].w).toBe(5)
  expect(FURNITURE[itemTexture('desk')].w).toBe(3)
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/art/furniture.test.ts`
Expected: FAIL, no `-turned` textures.

- [ ] **Step 3: Draw the 17 upright bodies in `furniture.ts`,** each next to its lying version, with a one-line comment like the others.

The same view rules hold: seen from the front and above, the bottom-centre anchor (`RoomView` sets the bottom of the footprint's last row), and the existing palette, `ink`/`FINE` strokes and `rect` helpers.

What each picture shows:
- The piece's top runs up the screen for its whole length.
- Its short end faces the viewer at the bottom, with the height the lying picture shows.
- The side that faced the viewer now faces right, and shows only as a thin edge or details over the right rim.
- Mirroring (`setFlipX`) gives the left-facing one.
- Keep each piece recognisable from its own details:
  - cabinet: towels on top;
  - shelf: bottles;
  - tea table: cups;
  - benches: slats or the bamboo poles;
  - lotus basin: water and flowers;
  - screen: weave and posts;
  - desk: the counter top with the lotus vase, book and bell;
  - boards and pictures: seen edge-on with a sliver of the face.

`FURNITURE` sizes: `w` about 1.1, and `h` equal to the length in tiles plus the height the lying picture rises above its footprint. For example, the cabinet's lying `h` is 1.5, so its upright `h` is 3.5.

- [ ] **Step 4: Run the art tests and the suite.**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/art/furniture.ts tests/art/furniture.test.ts
git commit -m "Draw an upright picture for each long piece, the screen and the desk: its top running up the floor and its short end to the front"
```

### Task 6: The room draws turned pieces, the screens and the desk

**Files:**
- Modify: `src/view/RoomView.ts`
- Modify: `src/view/floors.ts` (new `deskCandle`)
- Modify: `src/scenes/BootScene.ts` (four room textures)
- Modify: `src/scenes/SpaScene.ts` (the facing line near 1490)
- Modify: `src/sim/items.ts` (new `seatFacing`)
- Test: `tests/view/floors.test.ts`, `tests/sim/items.test.ts`

**Interfaces:**
- Consumes `size` from Task 1, `itemTexture(kind, turned)` from Task 5, and `deskSpot` and kinds from Task 2.
- Produces:
  - `seatFacing(item: Item): Facing` in `items.ts`. It is `'down'` for an unturned seat piece, `'right'` for a turned unflipped one and `'left'` for a turned flipped one.
  - `deskCandle(desk: Item): Vec` in `view/floors.ts`, the candle's floor-local tile position, `{ x: desk.x + w / 2, y: localY + h / 2 − 0.6 }` with `size(desk)`. For the default desk it is `{ x: 9.5, y: 13.9 }`, today's first candle.

- [ ] **Step 1: Write the failing tests.**

```ts
// tests/sim/items.test.ts
it('seats a waiting customer facing the front of the bench', () => {
  const bench: Item = { id: 1, kind: 'bench', x: 2, y: 13, flip: false }
  expect([seatFacing(bench), seatFacing({ ...bench, turned: true }), seatFacing({ ...bench, turned: true, flip: true })]).toEqual(['down', 'right', 'left'])
})
// tests/view/floors.test.ts
it('stands the desk candle on the middle of the desk', () => {
  expect(deskCandle({ id: 1, kind: 'desk', x: 8, y: 14, flip: false })).toEqual({ x: 9.5, y: 13.9 })
  expect(deskCandle({ id: 1, kind: 'desk', x: 4, y: 9, flip: false, turned: true })).toEqual({ x: 4.5, y: 9.9 })
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim/items.test.ts tests/view/floors.test.ts`
Expected: FAIL, the functions are not exported.

- [ ] **Step 3: Implement the change.**
- **`RoomView`:**
  - Remove the `fixtures` field, its constructor loop and its `setFloor` line. Fix the class and `setFloor` doc comments, and the doubled doc line above `setFloor`.
  - In `sync`, each body takes `itemTexture(item.kind, item.turned)`, setting it again when the facing changes, and is placed by `size(item)`.
  - An upright item's depth is `rowY(item.y + 1) + ITEM_DEPTH_BIAS`, its top row. Others keep `rowY(item.y + h) + ITEM_DEPTH_BIAS`.
  - A bench's mat shows only while the bench is unturned. `hide()` must not show it again for a turned bench.
  - The first candle pair, glow and candle, stands at `deskCandle` of the oldest desk, moved in `sync`.
- **`BootScene`:** the four room textures take `parseLayout(SPA_LAYOUT_1A)` and `parseLayout(BRANCH_LAYOUT)` instead of `buildGrid(shellOf(...), [])`, so `grid.decor.screen` still finds row 6.
- **`SpaScene`:** a customer sitting on a seat while waiting faces `seatFacing` of the seat item under them. A VIP standing, a customer seated at the foot chair or nail desk, and anyone else keep today's facing.

- [ ] **Step 4: Run the suite and the build.**

Run: `npx vitest run && npx tsc --noEmit && npx vite build --outDir .superpowers/dist-check`
Expected: all pass, the build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/view/RoomView.ts src/view/floors.ts src/scenes/BootScene.ts src/scenes/SpaScene.ts src/sim/items.ts tests/sim/items.test.ts tests/view/floors.test.ts
git commit -m "Draw the screens and the desk as furniture, each piece by its facing, an upright one in front of no one on its lower rows, the desk candle on the desk, and waiting customers facing the front of an upright bench"
```

### Task 7: The Xoay button

**Files:**
- Modify: `src/scenes/BuildScene.ts`
- Modify: `src/view/floors.ts` (new `clampToFloor`)
- Modify: `src/strings/vi.ts` (`turn`, remove `flip`)
- Test: `tests/view/floors.test.ts`

**Interfaces:**
- Consumes:
  - `nextFacing`, `size` and `claimed` from Tasks 1 and 2;
  - `itemTexture(kind, turned)` from Task 5;
  - the `turned` parameters of the sim from Task 1.
- Produces `clampToFloor(item: Item, floor: number, cols: number): Item`. It returns the item moved the least so that its whole `size` lies within `0..cols−1` and within the rows of `floor`.

- [ ] **Step 1: Write the failing test** in `tests/view/floors.test.ts`:

```ts
it('keeps a turned piece wholly on the floor in view', () => {
  const screen: Item = { id: 1, kind: 'screen', x: 3, y: 16, flip: false, turned: true }
  expect(clampToFloor(screen, 2, 13)).toEqual({ ...screen, y: 18 })
  expect(clampToFloor({ ...screen, y: 33 }, 2, 13)).toEqual({ ...screen, y: 31 })
  expect(clampToFloor({ id: 2, kind: 'screen', x: 10, y: 8, flip: false }, 1, 13)).toEqual({ id: 2, kind: 'screen', x: 8, y: 8, flip: false })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/view/floors.test.ts`
Expected: FAIL, `clampToFloor` is not exported.

- [ ] **Step 3: Implement the change.**
- **`clampToFloor`.**
- **`BuildScene`:**
  - The hold row's second button reads `t('turn')` and calls `turn()`, which replaces `flip()`. `turn()` sets the held item to `clampToFloor(nextFacing(item), room.floor, cols)` and redraws the ghost.
  - `onMove` clamps with `clampToFloor` instead of its own `Clamp` lines.
  - `drawGhost` places the ghost by `size(item)`, sets `itemTexture(item.kind, item.turned)` with `setFlipX(item.flip)`, and asks `canPlace(..., item.turned ?? false)`. It tints `claimed(item)`, so a desk shows its owner tile.
  - `carry` uses `size(item).h` and passes `turned`.
  - `place()` passes `item.turned ?? false` to `move`, `placeGift` and `buy`.
  - Update the doc comment that lists the hold row's buttons.
- **Strings:** `turn: 'Xoay'`. Remove `flip` once no code uses it.

- [ ] **Step 4: Run the suite and the build.**

Run: `npx vitest run && npx tsc --noEmit && npx vite build --outDir .superpowers/dist-check`
Expected: all pass, the build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BuildScene.ts src/view/floors.ts src/strings/vi.ts tests/view/floors.test.ts
git commit -m "Swap Lật for Xoay in build mode, stepping the held piece through its facings and keeping it on the floor in view, with a desk's owner tile tinted"
```
