# Mở rộng đất lô A: the 37-column grid, a fixed HUD, swipe and pinch-zoom (save v33) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every floor becomes 37 columns wide with today's shop at columns 12–24 and the four houses' columns walled off, old saves move 12 columns right once (save v33, which also stores how many houses each side are bought), and the map can be swiped, pinch-zoomed and zoomed with + / − under a HUD that never moves. Nothing is for sale yet (lô B), so at normal zoom the game looks exactly as it does today.

**Architecture:**
- **One wide grid from the start (spec §4.1, Cách 1).** `SPA_LAYOUT_1A` stays the frozen 13-column shop. `widen()` pads it with 12 wall columns each side into `SHOP_LAYOUT`, the sim's default. `withHouses()` opens bought houses in floor 1's shell, and `towerOf` now keeps `#` cells on the floors above.
- **`MAP_X` becomes the map's origin, `33 − 12 × 78 = −903`.** Column 12's left edge then lands at screen x 33 when the camera is at home (zoom 1, no scroll). So the shop sits exactly where it sits today, and every `MAP_X + x * TILE` in the code stays right.
- **Room art does not change in lô A.** The 13-column textures are drawn at column 12, because the opened part is exactly the old shop. Lô B widens them.
- **Save v33.** `parseShop` reads `raw.v` first. For a shop saved before v33 (main and every branch), the oldest repairs run on the frozen 13-column items. Then every saved tile moves `+12` once, and `v` is set to 33 so a re-parse never moves it again. `houses` is new: `{ left, right }`, 0–2 each, always 0 at a branch.
- **A fixed HUD scene (spec §5, Cách A).** `HudScene` is a passive scene listed right after `SpaScene`. `SpaScene` draws the top bar, floor pills, hand pointer, every card it owns, the shutter, the position strip and + / − into it. It clears it on shutdown. `SpaScene`'s main camera is the map camera, with a viewport from y 210 to 1770.
- **Camera and gestures are pure math plus thin Phaser wrappers.** `view/camera.ts` holds the view state, its limits and the screen ↔ world conversions. `view/gestures.ts` tells taps, pans and pinches apart. `MapCamera` applies them to the Phaser camera and animates slides and glides. `MapGestures` wires pointer events, in `HudScene` for the shop and in `BuildScene` for build mode.

**Tech Stack:** Phaser 4.2, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-30-mo-rong-dat-design.md`. Lô A covers:
- §4.1;
- §4.4, §4.4b, §4.5, §4.6 (without houses), §4.7, §4.8;
- §8;
- §9 (lô A).

Houses for sale, buying, house art and the technician cap are lô B.

**OSS research** (CLAUDE.md rule, done for the spec, §6):
- OpenRCT2 keeps a fixed map with owned / for-sale flags per tile.
- Phaser's `UIScene` beside a `WorldScene` example puts the UI in its own scene.
- We take the ideas only. The code is our own.

**Baseline:**
- 1636 tests in 122 files pass on `mo-rong` at 3bd8af1 (origin/master 8a1d9de plus the spec).
- Work in the worktree `D:\Project\spa-indie-game\.superpowers\worktrees\mo-rong`. `node_modules` resolves from the main folder above it.
- Typecheck: `npx tsc --noEmit` (it includes `tests/`).
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.
- Browser checks use the `/browse` skill (gstack) on `npx vite` at an iPhone frame of 390 × 844. Another session may share that browser (memory: shared gstack browser), so open your own tab and check it is still yours before each step.

## Global Constraints

- **Numbers (spec §10)**, in `src/config.ts`:
  - `SHOP_X0 = 12`, `HOUSE_COLS = 6`, `HOUSES_PER_SIDE = 2`;
  - `SHOP_COLS = 13 + 2 * HOUSES_PER_SIDE * HOUSE_COLS` (37);
  - `MAP_X = 33 - SHOP_X0 * TILE` (−903);
  - `OWNER_START = { x: 21, y: 13 }`;
  - `ZOOM_MAX = 1.6`, `ZOOM_STEP = 1.35`, `ZOOM_STEP_MS = 200`, `SLIDE_MS = 300`, `GLIDE_DECAY_MS = 250`;
  - `TAP_SLOP_PX = 20`, moved here from `SpaScene` and `BuildScene`, which import it;
  - `EDGE_SCROLL = 80`, `EDGE_SCROLL_SPEED = 0.9` (screen px per ms).
- **The house columns (spec §4.1 table):**

  | House | Opens | Old wall that becomes floor | Outer wall |
  |---|---|---|---|
  | left 1 | 7–11 | 12 | 6 |
  | left 2 | 1–5 | 6 | 0 |
  | right 1 | 25–29 | 24 | 30 |
  | right 2 | 31–35 | 30 | 36 |

  Only rows 2–16 of floor 1 open. Rows 0–1 and 17 stay wall. The stairs are at (23, 7–9), with the foot at (23, 10).
- **The map's view area** at normal play is `MAP_VIEW = { x: 0, y: 210, w: 1080, h: 1560 }`, from `MAP_Y` to `MAP_Y + (FLOOR_ROWS + STREET_TILES) * TILE`. In build mode its bottom is `min(panelTop, 1770)`.
- **Old shops lose nothing (spec §2).** A save from v1 to v32, main shop and every branch, opens with:
  - every item, person and path where it was, x + 12;
  - the same beauty;
  - the owner's start at (21, 13).
  - Pets are not saved and never move.
- **Branches** are 37 columns wide too, with all four houses always shut. `PLACE_DECOR` moves to (23, 10).
- **No new strings.** + and − are plain symbols.
- No new dependency.
- Commit messages are one plain sentence saying what changed, like the repo's history, with no prefix and no attribution lines.

## Review Focus

1. **A parsed old save parsed again** (the session does this, see `withScreensAndDesk`'s comment). It must move 12 columns once, never twice. Task 2 pins this.
2. **A pinch where the fingers lift one at a time.** No tap may fire, and the finger left behind pans on from where it is, without a jump. Task 5 pins this.
3. **A tap on a HUD control** (a floor pill, + / −, the strip, a card button) must never also tap the map tile under it. Task 6 pins this with a browser check, and `MapGestures` ignores a pointer that starts over a HUD object.
4. **A pre-stairs save (v13) with furniture on the new stairs spot.** `clearStairs` now runs on moved tiles against the wide shell, and must clear the same pieces it did before. Task 2 pins this through the existing test, moved +12.
5. **Switching shops while zoomed in.** The HUD is drawn once (no leftover pills or cards from the shop before), and the camera opens on the owner at normal zoom. Task 6 pins this in the browser.

---

### Task 1: A v32 fixture before anything changes

**Files:**
- Create: `tests/fixtures/save-v32.json`

**Interfaces:**
- Produces a chain written by today's code, which later tasks open as "an old save":
  - a main shop mid-day with:
    - a customer walking to a seat (`toSeat`, non-empty `path`);
    - one waiting on a seat;
    - the owner walking a customer to a bed (`task.kind === 'serve'`, non-empty `path`);
    - a technician walking with a non-empty `path`;
    - one pet;
    - a bed at (6, 2);
  - a beach branch with a customer walking.

- [ ] **Step 1: Write a throwaway generator** `tests/sim/make-v32.tmp.test.ts`, not to be committed:
  - start from `starShop(3, 20_000_000, 1, false)` and `new Chain(main, 7)`, as `tests/sim/chain.test.ts:24` does;
  - set up the state above with `hireStaff`, `spawnCustomer`, `advanceUntil` and `tapTile`, and buy one pet the way `tests/sim/spa-pets.test.ts` does;
  - `chain.open('beach')`;
  - write `JSON.stringify(chain.toSave(), null, 2)` to `tests/fixtures/save-v32.json` with `fs.writeFileSync`.
- [ ] **Step 2: Run it once.** `npx vitest run tests/sim/make-v32.tmp.test.ts`. Check the JSON has `"v": 32`, the paths, the staff and the branch. Then delete the generator.
- [ ] **Step 3: Commit**

```bash
git add tests/fixtures/save-v32.json
git commit -m "Keep a v32 chain mid-day, with people walking their paths and a branch, for the move to the wide grid to open"
```

### Task 2: The 37-column grid, and save v33 moves old shops 12 columns right

**Files:**
- Modify: `src/config.ts`
- Modify: `src/sim/layout.ts`
- Modify: `src/sim/floors.ts`
- Modify: `src/sim/items.ts`
- Modify: `src/sim/places.ts`
- Modify: `src/sim/spa.ts`
- Modify: `src/sim/save.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/view/RoomView.ts`
- Modify: `src/scenes/BuildScene.ts:46`
- Test: `tests/sim/floors.test.ts`
- Test: `tests/sim/save.test.ts`
- Test: every test that uses the default shop

**Interfaces:**
- Produces:
  - the config constants in Global Constraints (all but the zoom ones may land here);
  - `export function widen(rows: string[]): string[]` in `layout.ts`: 12 `#` either side of every row;
  - `export const SHOP_LAYOUT = widen(SPA_LAYOUT_1A)`. `SPA_LAYOUT_1A` stays the 13-column shop, with its doc comment saying it is the old shop, kept for its art and for saves before v33;
  - `DEFAULT_ITEMS` and `BED_SLOTS` come from `SHOP_LAYOUT`. Ids are unchanged, since widening keeps reading order;
  - `SpaSim`'s default `layout` is `SHOP_LAYOUT`;
  - `places.ts`:
    - `export const BRANCH_ROOM` is today's 13-column `BRANCH_LAYOUT`, for art;
    - `BRANCH_LAYOUT = widen(BRANCH_ROOM)`;
    - `PLACE_DECOR` is at x 23;
  - `towerOf` keeps `#` in the floors above: `replace(/[^U#]/g, '.')`;
  - `save.ts`:
    - `SAVE_VERSION = 33`;
    - `export const WIDE_SAVE_VERSION = 33`;
    - `parseVersioned` accepts 32;
    - a module constant `LEGACY_ITEMS = itemsFromLayout(SPA_LAYOUT_1A)` replaces `DEFAULT_ITEMS` in `withDefaultItems` and `withScreensAndDesk`;
    - `function shiftShop(data: SaveData, dx: number): void` moves `items[].x`, `owner.pos.x`, `owner.path[].x`, `customers[].pos.x`, `.path[].x`, `.seat.x` and `staff[].pos.x`, `.path[].x`.
- `parseShop` reads `const narrow = isObject(raw) && typeof raw.v === 'number' && raw.v < WIDE_SAVE_VERSION` next to `before`. As its last step it does `if (narrow) { shiftShop(data, SHOP_X0); data.v = SAVE_VERSION }`.
- `RoomView`:
  - the room image and the dark overlay are placed at `MAP_X + SHOP_X0 * TILE`;
  - every tile constant gains 12:
    - `SIGN.x` 19.8;
    - `WALL` 12.3 / 24.7;
    - `FLOOR` `{ left: 13, top: 2, right: 24, bottom: 17 }`;
    - `PLAQUE.x` 16.3;
    - `CANDLES` x 21.5, 16, 13.5, 23.2;
    - `STAIRS_TILE.x` 23;
    - the coop 22.75;
  - `RIVAL_SIGN.right` becomes `GAME_W - 16 + SHOP_X0 * TILE`.
- `BuildScene`'s `centre` x becomes `SHOP_X0 + 6`. Task 8 replaces it.
- `BootScene` draws the main room from `SPA_LAYOUT_1A`, as now, and the three branch rooms from `parseLayout(BRANCH_ROOM)`.

- [ ] **Step 1: Write the failing tests.**

In `tests/sim/floors.test.ts`:

```ts
it('widens the old shop to 37 columns, 12 walls either side', () => {
  const rows = widen(SPA_LAYOUT_1A)
  expect(rows.every(r => r.length === 37)).toBe(true)
  expect(rows[17]).toBe('#'.repeat(12) + '######D######' + '#'.repeat(12))
  expect(rows[5].slice(12, 25)).toBe(SPA_LAYOUT_1A[5])
})
it('keeps the walls of the unbought columns on every floor', () => {
  const tower = towerOf(shellOf(SHOP_LAYOUT))
  expect(tower[25]).toBe('#'.repeat(12) + '#..........U#' + '#'.repeat(12))
  expect(tower[18 + 5].slice(0, 13)).toBe('#'.repeat(13))
})
```

Change the existing `stacks three walled floors` test only by building from `SHOP_LAYOUT`: length 37, and row 25 as above.

In `tests/sim/save.test.ts`, import `v32` from `../fixtures/save-v32.json`:

```ts
describe('the wide grid in an older shop', () => {
  it('moves every tile of the main shop and each branch 12 columns right', () => {
    const data = parseSave(structuredClone(v32))
    expect(data.v).toBe(33)
    expect(data.items.map(i => i.x)).toEqual(v32.items.map(i => i.x + 12))
    expect(data.owner.pos).toEqual({ ...v32.owner.pos, x: v32.owner.pos.x + 12 })
    expect(data.owner.path).toEqual(v32.owner.path.map(t => ({ ...t, x: t.x + 12 })))
    expect(data.customers.map(c => [c.pos.x, c.seat?.x ?? null, c.path.map(t => t.x)])).toEqual(v32.customers.map(c => [c.pos.x + 12, c.seat ? c.seat.x + 12 : null, c.path.map(t => t.x + 12)]))
    expect(data.staff.map(s => [s.pos.x, s.path.map(t => t.x)])).toEqual(v32.staff.map(s => [s.pos.x + 12, s.path.map(t => t.x + 12)]))
    const branch = data.chain!.branches[0]
    expect(branch.items.map(i => i.x)).toEqual(v32.chain.branches[0].items.map(i => i.x + 12))
  })
  it('moves a parsed save only once', () => {
    const once = parseSave(structuredClone(v32))
    expect(parseSave(structuredClone(once))).toEqual(once)
  })
  it('opens mid-day with the same beauty, the owner behind the desk and everyone walking on', () => {
    const sim = open(v32)
    expect(sim.beauty()).toBe(beautyOf(v32.items as Item[]))
    expect(sim.ownerStart()).toEqual({ x: 21, y: 13 })
    sim.advance(5_000) // nobody is stuck on a wall: the walk goes on
  })
  it('furnishes a v1 shop on the old grid, then moves it once', () => {
    expect(parseSave(structuredClone(v1)).items.find(i => i.kind === 'desk')).toMatchObject({ x: 20, y: 14 })
  })
})
```

`withNewKeys` (`save.test.ts:69`) gains, for each shop:
- `houses` stays out until Task 3;
- the three appended pieces come from `itemsFromLayout(SPA_LAYOUT_1A)` instead of `DEFAULT_ITEMS`;
- as its last step for a shop with `v < 33`: every saved tile x + 12 (the same fields as `shiftShop`), then `v = 33`.

`withFurniture` (`:67`) takes the legacy items the same way.

- [ ] **Step 2: Run them to see them fail.**

Run: `npx vitest run tests/sim/floors.test.ts tests/sim/save.test.ts`
Expected: FAIL. `widen` and `SHOP_LAYOUT` are not defined.

- [ ] **Step 3: Implement** everything under Interfaces.

- [ ] **Step 4: Move the default shop's coordinates in the other tests.** Run `npx vitest run` and work through the failures with one rule:
- A test that uses the default shop changes only by adding 12 to x, and 13 → 37 where it states a width.
  - The default shop means: `new SpaSim` without `layout`, `DEFAULT_ITEMS`, `BED_SLOTS`, `OWNER_START`, a branch, or a fixture.
  - Expect, for example, `build.test.ts`, `items.test.ts`, `path.test.ts`, `spa-owner.test.ts`, `spa-floors.test.ts` (its `SPA_LAYOUT_1A` layout becomes `widen(...)`), `spa-staff.test.ts`, `spa-vips.test.ts`, `branch.test.ts`, `services.test.ts`, `massage.test.ts`, `nails.test.ts`, `view/floors.test.ts` and `view/lying.test.ts`.
- Tests on their own small layouts, and tests that parse `SPA_LAYOUT_1A` itself, do not change.
- `tests/art/branchRooms.test.ts` uses `BRANCH_ROOM`.
- If a test needs any other change to pass, stop and report it. It is a behaviour change, not a coordinate.

- [ ] **Step 5: Run the suite and the typecheck.**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass. The count is 1636 plus the new tests.

- [ ] **Step 6: Look at it.** `npx vite`, at 390 × 844:
- the shop draws exactly where it did;
- a customer walks in, sits and is served;
- build mode moves a bed;
- a branch opens and plays.

The map is still unzoomable.

- [ ] **Step 7: Commit**

```bash
git add -A src tests
git commit -m "Lay every floor out 37 columns wide with the old shop at columns 12 to 24 and the rest walled, and move shops saved before version 33 twelve columns right once"
```

### Task 3: Houses in the shell and in the save

**Files:**
- Modify: `src/sim/layout.ts`
- Modify: `src/sim/spa.ts`
- Modify: `src/sim/save.ts`
- Test: `tests/sim/floors.test.ts`
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Produces:
  - `export interface Houses { left: number; right: number }`, with `export const NO_HOUSES: Houses = { left: 0, right: 0 }` in `layout.ts`;
  - `export function withHouses(shell: string[], houses: Houses): string[]`. It opens floor 1's rows 2–16 per the Global Constraints table, inner houses first. It returns the shell untouched for `NO_HOUSES`, and throws for houses on a shell whose width is not `SHOP_COLS`;
  - `SpaSim.houses: Houses`, public, starting at `{ ...NO_HOUSES }`;
  - the private floor-1 shell is kept as `base`, and `this.shell = towerOf(withHouses(base, this.houses))`. Lô B calls the same rebuild after a purchase;
  - `SaveData.houses: Houses`, written by `toSave`.
- `parseShop` sets `data.houses`:
  - a branch always gets `{ left: 0, right: 0 }`;
  - the main shop gets each side as a whole number from 0 to `HOUSES_PER_SIDE`, else 0.
- `fromSave` sets `sim.houses` and rebuilds the shell before the `offFloor` check. So an item in an unbought house is a `SaveError`, like an item on a wall.

- [ ] **Step 1: Write the failing tests.**

```ts
it('opens the inner left house: its five columns and the old wall become floor, its outer wall stays', () => {
  const rows = withHouses(shellOf(SHOP_LAYOUT), { left: 1, right: 0 })
  expect(rows[5].slice(6, 13)).toBe('#......')
  expect(rows[0]).toBe(shellOf(SHOP_LAYOUT)[0])
  expect(rows[17]).toBe(shellOf(SHOP_LAYOUT)[17])
})
it('opens both right houses through to column 36', () => {
  const rows = withHouses(shellOf(SHOP_LAYOUT), { left: 0, right: 2 })
  expect(rows[9].slice(24, 37)).toBe('............#')
})
it('carries a bought house up to the floors above', () => {
  const tower = towerOf(withHouses(shellOf(SHOP_LAYOUT), { left: 2, right: 0 }))
  expect(tower[18 + 5].slice(0, 13)).toBe('#............')
})
```

In `save.test.ts`:
- a v33 main shop with `houses: { left: 1, right: 0 }` and a bed at x 8 opens with the bed there;
- the same save with `houses` `{0,0}` throws `SaveError`;
- `houses: { left: 5, right: -1 }` parses to `{0,0}`;
- a branch saved with `{ left: 1, right: 1 }` parses to `{0,0}`;
- `toSave()` round-trips `houses`.

`withNewKeys` adds `houses ??= { left: 0, right: 0 }`.

- [ ] **Step 2: Run them to see them fail.** `npx vitest run tests/sim/floors.test.ts tests/sim/save.test.ts`. Expected: FAIL, `withHouses` is not defined.
- [ ] **Step 3: Implement** everything under Interfaces.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit`. Expected: all pass.
- [ ] **Step 5: Commit**

```bash
git add src/sim tests/sim
git commit -m "Build floor 1's shell from the houses bought each side, opening their columns and the old wall on every floor, and keep the count in the save"
```

### Task 4: Camera math

**Files:**
- Create: `src/view/camera.ts`
- Test: `tests/view/camera.test.ts`

**Interfaces:**
- No Phaser import. It produces:
  - `export interface Rect { x: number; y: number; w: number; h: number }`;
  - `export interface View { zoom: number; cx: number; cy: number }`, where `cx`, `cy` is the world point at the middle of the area;
  - `export const MAP_VIEW: Rect`;
  - `export const buildArea = (panelTop: number): Rect`. Its bottom is `Math.min(panelTop, MAP_VIEW.y + MAP_VIEW.h)`;
  - `export function mapBounds(houses: Houses): Rect`. It spans columns `SHOP_X0 − left × 6` to `SHOP_X0 + 12 + right × 6`, rows `MAP_Y` to `MAP_Y + 1560`;
  - `export function minZoom(bounds: Rect, area: Rect): number`, which is `Math.min(1, area.w / bounds.w)`;
  - `export function clampView(v: View, bounds: Rect, area: Rect): View`:
    - the zoom is held between `minZoom` and `ZOOM_MAX`;
    - on each axis, the view is centred on the bounds when they fit inside the area at that zoom, and otherwise clamped so the area never shows past them;
  - the conversions: `toScreen(v, area, wx, wy): Vec`, `toWorld(v, area, sx, sy): Vec` and `visibleWorld(v, area): Rect`;
  - `export function contains(r: Rect, x: number, y: number, margin = 0): boolean`;
  - `export function zoomAbout(v, area, factor, sx, sy, bounds): View`. The world point under (sx, sy) stays there, then the result is clamped;
  - `export function panBy(v, area, dx, dy, bounds): View`. dx, dy are screen px the finger moved, and the map follows it;
  - `export function refit(v, from: Rect, to: Rect, bounds): View`. It keeps every world point at its screen point while the area changes, then clamps;
  - `export function dragTile(from: Tile, down: Vec, now: Vec): Tile`. It adds the world distance in whole tiles, `Math.round(Δ / TILE)`.

- [ ] **Step 1: Write the failing tests.** `shop = mapBounds(NO_HOUSES)` is `{ x: 33, y: 210, w: 1014, h: 1560 }`, and `all = mapBounds({ left: 2, right: 2 })` is `{ x: -903, …, w: 2886 }`.

```ts
const home = clampView({ zoom: 1, cx: 0, cy: 0 }, shop, MAP_VIEW)
it('at normal zoom puts the old shop exactly where it always was', () => {
  expect(home).toEqual({ zoom: 1, cx: 540, cy: 990 })
  expect(toScreen(home, MAP_VIEW, 33, 210)).toEqual({ x: 33, y: 210 })
})
it('keeps the point between the fingers still while zooming in, within the limits', () => {
  const v = zoomAbout(home, MAP_VIEW, 1.6, 100, 300, shop)
  expect(v.zoom).toBe(1.6)
  expect(toScreen(v, MAP_VIEW, 100, 300)).toEqual({ x: 100, y: 300 })
  expect(zoomAbout(home, MAP_VIEW, 3, 540, 990, shop).zoom).toBe(1.6)
  expect(zoomAbout(home, MAP_VIEW, 0.5, 540, 990, shop)).toEqual(home)
})
it('never pans past the map', () => {
  const v = zoomAbout(home, MAP_VIEW, 1.6, 540, 990, shop)
  expect(panBy(v, MAP_VIEW, -10_000, 0, shop).cx).toBe(1047 - 540 / 1.6)
  expect(panBy(v, MAP_VIEW, 0, 10_000, shop).cy).toBe(210 + 780 / 1.6)
})
it('zooms out until the whole row fits the width, centred', () => {
  expect(minZoom(all, MAP_VIEW)).toBeCloseTo(1080 / 2886)
  expect(clampView({ zoom: 0.1, cx: 0, cy: 0 }, all, MAP_VIEW)).toEqual({ zoom: 1080 / 2886, cx: 540, cy: 990 })
})
it('keeps the map still on screen when build mode shortens the area', () => {
  const area = buildArea(1640)
  const v = refit(home, MAP_VIEW, area, shop)
  expect(toScreen(v, area, 33, 210)).toEqual({ x: 33, y: 210 })
  expect(buildArea(1940)).toEqual(MAP_VIEW)
})
it('moves a held piece by the whole tiles the finger crossed on the map', () => {
  expect(dragTile({ x: 20, y: 5 }, { x: 0, y: 0 }, { x: 2.4 * 78, y: -0.6 * 78 })).toEqual({ x: 22, y: 4 })
})
```

Add a `contains` case with a margin.

- [ ] **Step 2: Run them to see them fail.** `npx vitest run tests/view/camera.test.ts`. Expected: FAIL, the module is missing.
- [ ] **Step 3: Implement** `camera.ts`.
- [ ] **Step 4: Run** `npx vitest run tests/view/camera.test.ts && npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/view/camera.ts tests/view/camera.test.ts
git commit -m "Add the map view's math: its zoom limits and clamping, screen and map points, zooming about a point, panning, refitting a shorter area and dragging by tiles"
```

### Task 5: Telling taps, pans and pinches apart

**Files:**
- Create: `src/view/gestures.ts`
- Test: `tests/view/gestures.test.ts`

**Interfaces:**
- No Phaser import. It produces:

```ts
export type GestureStep =
  | { kind: 'none' }
  | { kind: 'pan'; dx: number; dy: number }
  | { kind: 'pinch'; factor: number; x: number; y: number; dx: number; dy: number }
  | { kind: 'tap'; x: number; y: number }
  | { kind: 'release'; vx: number; vy: number }
export class Gestures {
  down(id: number, x: number, y: number, t: number): GestureStep
  move(id: number, x: number, y: number, t: number): GestureStep
  up(id: number, x: number, y: number, t: number): GestureStep
  cancel(): void
  /** A pan or pinch is under way. */
  get busy(): boolean
}
```

- The rules (spec §4.5):
  - **One finger** past `TAP_SLOP_PX` from where it went down becomes a pan. Its first step carries the whole distance from the down point, so the map does not lag the finger.
  - **A second finger** makes the gesture a pinch until every finger is up, and no tap fires anywhere in it.
    - `factor` is the change in finger distance since the last step.
    - `x`, `y` is the midpoint now. `dx`, `dy` is how far the midpoint moved.
    - The caller applies `zoomAbout`, then `panBy`.
  - **Lifting a finger during a pinch** leaves the other as a pan from where it is. Its next step is measured from there.
  - **The last finger up** gives `tap` only if the gesture was one finger that never passed the slop. After a pan it gives `release` with the velocity of the last move (px/ms); otherwise `none`.

- [ ] **Step 1: Write the failing tests.**
  - A press and lift 19 px away is a tap at the up point. 21 px away is a pan, then a release.
  - A pan's first step is `{ dx: 25, dy: 0 }` for a 25 px move. The next 5 px move gives `{ dx: 5, dy: 0 }`.
  - Two fingers 100 px apart moving to 150 px give `factor` 1.5 about their midpoint.
  - Fingers lifted one by one after a pinch give no tap. The remaining finger's next 10 px move gives `pan` `{ dx: 10 }`.
  - `busy` is true from the slop or the second finger until the last finger is up.
- [ ] **Step 2: Run them to see them fail.** `npx vitest run tests/view/gestures.test.ts`.
- [ ] **Step 3: Implement** `gestures.ts`.
- [ ] **Step 4: Run** `npx vitest run tests/view/gestures.test.ts && npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/view/gestures.ts tests/view/gestures.test.ts
git commit -m "Tell a tap from a swipe and a pinch: past twenty pixels a finger pans, a second finger makes the whole touch a pinch, and only an untouched single press taps"
```

### Task 6: The fixed HUD scene and the zooming map

**Files:**
- Create: `src/scenes/HudScene.ts`
- Create: `src/view/MapCamera.ts`
- Create: `src/view/MapGestures.ts`
- Create: `src/view/ZoomButtons.ts`
- Modify: `src/main.ts` (scene list, `input: { activePointers: 2 }`)
- Modify: `src/scenes/BootScene.ts:63`
- Modify: `src/scenes/SpaScene.ts`
- Modify: `src/view/HandPointer.ts`
- Modify: `src/view/SpeechBubble.ts`

**Interfaces:**
- **`HudScene`** (`key 'HudScene'`) has no logic of its own.
  - `clear(): void` kills its tweens and timers and destroys every child.
  - BootScene launches it, then starts `SpaScene`: `this.scene.launch('HudScene'); this.scene.start('SpaScene')`. So it is running before `SpaScene.create`, and it stays running across shop switches.
  - It is listed right after `SpaScene` in `main.ts`. So it draws over the map and under Build, Staff, the mini-games and every other scene.
- **`MapCamera`**, `constructor(scene: Phaser.Scene, area: Rect, bounds: Rect)`, wraps `scene.cameras.main`:
  - It sets the viewport to the area, and applies `setZoom(v.zoom)` with `centerOn(v.cx, v.cy)` each `update`.
  - State: `view: View`, `area: Rect`, `bounds: Rect`.
  - Setting it: `setArea(area: Rect)` refits; `setBounds(b: Rect)` clamps; `jump(v: Partial<View>)` sets the view at once.
  - Animated: `slideTo(wx: number, wy?: number, zoom?: number)` eases over `SLIDE_MS` to a clamped target; `zoomStep(dir: 1 | -1)` zooms by `ZOOM_STEP` about the area's middle over `ZOOM_STEP_MS`.
  - Instant from fingers: `pan(dx, dy)` and `pinch(factor, x, y, dx, dy)`. Both stop any slide or glide.
  - `release(vx, vy)` starts a glide that decays by e every `GLIDE_DECAY_MS` and stops under 0.02 px/ms.
  - `update(dtMs: number)`.
  - Queries: `toScreen(wx, wy)`, `toWorld(sx, sy)`, `visible(): Rect`, `isVisible(wx, wy, margin = 0)`, and `overflowsX(): boolean` (`bounds.w × zoom > area.w`).
- **`MapGestures`**, `constructor(input: Phaser.Input.InputPlugin, cam: MapCamera, opts: { allow: (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => boolean; onTap: (p: Phaser.Input.Pointer) => void })`:
  - It feeds `Gestures` from `pointerdown`, `pointermove`, `pointerup` and `pointerupoutside`. Only pointers whose `pointerdown` passed `allow` are tracked.
  - It turns each step into `cam.pan`, `cam.pinch`, `cam.release` or `onTap`.
  - On `wheel` with `ctrlKey` it calls `cam.pinch(Math.exp(-deltaY / 100), p.x, p.y, 0, 0)`. A wheel without ctrl does nothing.
  - `busy` and `destroy()`.
- **`ZoomButtons`**, `constructor(scene, depth, onZoom: (dir: 1 | -1) => void)`:
  - `show(x: number, plusY: number, minusY: number)` and `hide()`;
  - two `addButton` squares of 92 px, labelled + and −.
- **`SpaScene`:**
  - `private ui!: HudScene` is set first thing in `create`, and the `SHUTDOWN` handler calls `this.ui.clear()` and `this.gestures.destroy()`.
  - `Hud`, `FloorBar` and `HandPointer` are built on `this.ui`.
  - `shutter`, `showTooNew`, `showCard`, `offerFloor` and `offerBed` draw with `this.ui.add`, `addCard(this.ui, …)`, `addButton(this.ui, …)`, `addMedal(this.ui, …)` and `this.ui.tweens`.
  - `floatMoneyAt(on: Phaser.Scene, x, y, amount, depth)`: the money counter's calls (`HUD_DEPTH + 40`) pass `this.ui`, and the map's calls pass `this`.
  - `private cam!: MapCamera` is `new MapCamera(this, MAP_VIEW, mapBounds(sim.houses))`, then on load `jump({ zoom: 1, cx: owner's world x })`. It updates in `update`.
  - `private gestures!: MapGestures` sits on `this.ui.input`.
    - `allow` is `over.length === 0 && !this.modal && !this.holding && !sim.paused && !sim.dayOver && sim.servingCustomerId === null`.
    - `onTap` is `onMapTap`.
  - `this.input.on('pointerup', this.onTap)` goes.
  - **`onMapTap(p)`** is today's `onTap`, except:
    - `over` is `this.input.hitTestPointer(p)`;
    - the customer hit test and `room.worldToTile` use `this.cam.toWorld(p.x, p.y)`.
  - **The zoom buttons** are `ZoomButtons` on `this.ui` at `show(1010, 1520, 1630)`. They are shown whenever the map is free (the `allow` condition without `over`).
  - **The morning view:** at the morning start in `showRankCards`' `begin`, after `showFloor(1)`, `this.cam.jump({ zoom: 1, cx: 540, cy: 990 })`.
  - **The hand pointer:**
    - the customer hints convert the point with `this.cam.toScreen`;
    - when the pointed customer's id changes and they are off view, `cam.slideTo` them;
    - `HandPointer.show` with the same text and direction only moves the hand and box, keeping the bob running.
  - **Speech bubbles:** `SpeechBubble.setPosition(x, y, bounds = { left: 0, right: GAME_W })` clamps within `bounds`. `SpaScene` passes `cam.visible()`'s x range.
  - In DEV, `cam` joins `window.__spa`.

- [ ] **Step 1: Build `HudScene`, `MapCamera`, `MapGestures` and `ZoomButtons`, then move the HUD as above.**
- [ ] **Step 2: Run** `npx vitest run && npx tsc --noEmit`. Expected: all pass, with no test changed.
- [ ] **Step 3: Check in the browser** at 390 × 844, on a shop with two floors open and customers waiting, set up through `window.__spa` in DEV:
- **At normal zoom it looks identical to master** (screenshot both). The top bar, today line, floor pills and nav sit where they did.
- **Zooming:**
  - + zooms to 1.35, then to 1.6, then stops;
  - − returns to 1 and stops;
  - ctrl + wheel zooms about the pointer, and the page itself never zooms.
- **Zoomed in:**
  - dragging pans all four ways and stops at the map's edges;
  - a flick glides and stops;
  - the top bar, pills, nav, + / − and the today line never move or scale.
- **Taps:**
  - a drag released over a waiting customer does not fetch them;
  - a tap still fetches a customer and sends the owner to a tile;
  - a tap on + / − or a floor pill does nothing on the map under it;
  - a pet still takes a pat at 1.6×.
- **Cards and switching:**
  - the floor card, bed card, badge card and switch shutter draw full-size over a zoomed map;
  - switching to the branch and back while zoomed shows one HUD, no leftover card, at zoom 1 on the owner.
- **Speech:** a bubble at the edge of the view stays inside it.
- [ ] **Step 4: Commit**

```bash
git add src tests
git commit -m "Draw the top bar, floor buttons, cards and shutter in their own scene over the map, and let the map pan, glide, pinch and step through zoom 1 to 1.6 with plus and minus under them"
```

### Task 7: The position strip and following the owner

**Files:**
- Create: `src/view/strip.ts`
- Create: `src/view/PositionStrip.ts`
- Modify: `src/view/FloorBar.ts` (export the face drawing)
- Modify: `src/scenes/SpaScene.ts`
- Test: `tests/view/strip.test.ts`

**Interfaces:**
- **`strip.ts`** has no Phaser import:
  - `export const STRIP = { x: 140, y: 1770, w: 800, h: 24, hitH: 72 }`. The hit band 1734–1806 is clear of the today line and of the pills from 1807 down;
  - `export function stripX(bounds: Rect, worldX: number): number` is linear and clamped to the strip;
  - `export function worldXAt(bounds: Rect, sx: number): number` is its inverse;
  - `export function offscreenWaiting(customers: Customer[], viewFloor: number, visible: Rect): number[]` gives the world x (`MAP_X + (pos.x + 0.5) × TILE`) of every `waiting` customer on another floor than `viewFloor`, or outside `visible`'s x range.
- **`FloorBar.ts`** exports `drawFace(scene, look, x, y): Phaser.GameObjects.Graphics`, today's private `face`, and uses it itself.
- **`PositionStrip`**, `constructor(scene, depth, onTap: (sx: number) => void)`:
  - `show(m: { bounds: Rect; visible: Rect; door: number; owner: number; dots: number[]; look: Look })` and `hide()`;
  - it redraws only when `m` changes;
  - it draws a cream bar for the bought span, an orange tick at the door, a teal frame for `visible`, the owner's face and red dots.
- **`SpaScene`:**
  - The strip is on `this.ui`, shown when the map is free and `cam.overflowsX()`, hidden otherwise and while `this.holding`.
  - A tap slides to `worldXAt(bounds, sx)`, keeping zoom and y.
  - **Following (spec §4.7):** each frame, when:
    - the map is free;
    - `!this.gestures.busy`;
    - the owner's task is `serve` and their path is not empty;
    - the owner is on the viewed floor;
    - and `!cam.isVisible(at.x, at.y, TILE)` for their world point `at`;
    
    then `cam.slideTo(at.x, at.y)`. Floor following (`followFloor`) stays as is, and keeps zoom and x.

- [ ] **Step 1: Write the failing tests.**

```ts
const shop = mapBounds(NO_HOUSES)
it('lays the shop along the strip', () => {
  expect(stripX(shop, 33)).toBe(140)
  expect(stripX(shop, 1047)).toBe(940)
  expect(worldXAt(shop, stripX(shop, 500))).toBeCloseTo(500)
})
it('dots the waiting customers out of view or upstairs', () => {
  const waiting = (x: number, y: number) => ({ state: 'waiting', pos: { x, y } }) as Customer
  const left = { x: 33, y: 210, w: 400, h: 1560 }
  expect(offscreenWaiting([waiting(13, 14), waiting(22, 14), waiting(13, 20)], 1, left)).toEqual([MAP_X + 22.5 * TILE, MAP_X + 13.5 * TILE])
})
```

Also check that a customer walking (`toSeat`) gets no dot.

- [ ] **Step 2: Run them to see them fail.** `npx vitest run tests/view/strip.test.ts`.
- [ ] **Step 3: Implement** `strip.ts`, `PositionStrip`, `drawFace` and the `SpaScene` wiring.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit`. Expected: all pass.
- [ ] **Step 5: Check in the browser:**
- **The strip:**
  - it is hidden at zoom 1;
  - at 1.6 it shows, with the frame following a pan;
  - tapping its far end slides there.
- **Dots:** with a customer waiting off view, a red dot sits at their place on the strip, and the Tầng 1 pill dot still shows when viewing floor 2.
- **Following:** zoomed in, at the left edge, when the owner leads a customer to a bed on the right, the camera slides with them.
- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "Show a strip of the whole row when the map is wider than the screen, with the view's frame, the owner, the door and red dots for customers waiting out of sight, and slide after the owner leading a customer out of view"
```

### Task 8: Build mode on the map camera

**Files:**
- Modify: `src/scenes/BuildScene.ts`
- Modify: `src/scenes/SpaScene.ts` (`openBuild`)

**Interfaces:**
- **`BuildData`** gains `map: Phaser.Scene` (the `SpaScene`) and `cam: MapCamera`.
- **The grid, tint and ghost** are made with `params.map.add` at depths 9500, 9501 and 9502, so the map camera draws them, and `close()` destroys them.
- **Every map point** goes through `cam.toWorld(p.x, p.y)`. That covers `pickUp`, `room.itemAt` and the drag.
- **The drag** stores the world point where it went down. `onMove`, and each frame of an edge scroll, set the piece with `dragTile(from, downWorld, cam.toWorld(p.x, p.y))`, then `clampToFloor` as now.
- **The view area:**
  - on create, and whenever the panel switches between catalogue and hold row, `cam.setArea(buildArea(this.panelTop()))`;
  - `close()` restores `cam.setArea(MAP_VIEW)`.
- **Gestures** are a `MapGestures` on Build's own input. `allow` is: nothing held, `p.y < panelTop()`, and no item under the point, so a press on a piece keeps today's pick-and-carry.
  - A second finger down while a pick is pending clears `this.drag` and lets the pinch run.
  - Taps keep going through today's `onUp` (`onTap` is a no-op).
- **Edge scroll:** a new `update(_, delta)`. While a piece is held and dragged with the finger within `EDGE_SCROLL` px of the area's left or right edge, it calls `cam.pan(±EDGE_SCROLL_SPEED × delta, 0)` (the map moves toward the edge the finger is at), then re-places the piece.
- **`centre(floor)`** becomes the world tile at the area's middle: `room.worldToTile(cam.view.cx, cam.view.cy)` on the floor in view.
- **Build's `ZoomButtons`** sit at `show(1010, top - 180, top - 70)`, with `top = Math.min(this.panelTop(), 1770)`.

- [ ] **Step 1: Implement** everything under Interfaces.
- [ ] **Step 2: Run** `npx vitest run && npx tsc --noEmit`. Expected: all pass.
- [ ] **Step 3: Check in the browser:**
- **At 1.6×:**
  - picking up a bed, the ghost and tint sit on its tiles;
  - dragging moves it one tile per tile of finger travel on the map;
  - dragging it to the right edge scrolls the map and keeps it under the finger;
  - placing works.
- **With nothing held:** a drag on the floor pans, + / − zoom, and a tap on a piece picks it up.
- **New pieces:** a piece bought while zoomed onto a corner appears near the middle of the view.
- **Closing build** leaves the map where it was, with the strip back.
- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "Let build mode use the map's zoom and place, carrying a piece by the tiles the finger crosses on the map, scrolling at the edges, and swiping or zooming when nothing is held"
```

### Task 9: Whole-branch check and ship lô A

- [ ] **Step 1: Bring in master.** `git fetch origin`. If `origin/master` moved past 8a1d9de, `git merge origin/master` in the worktree.
  - If master raised `SAVE_VERSION`, renumber ours to the next number. Move `WIDE_SAVE_VERSION`, the fixture and the tests with it.
  - Re-run Task 2's step 4 rule on any new test that uses the default shop.
- [ ] **Step 2: Run everything.** `npx vitest run && npx tsc --noEmit && npx vite build --outDir .superpowers/dist-check`. Expected: all pass.
- [ ] **Step 3: Request a whole-branch review** (superpowers:requesting-code-review) against the spec and this plan. Fix what it finds.
- [ ] **Step 4: Run spec §9's lô A browser list** once more end to end at 390 × 844, including "one branch plays as before".
- [ ] **Step 5: Ship.**
  - `git push origin HEAD:master` (a fast-forward; if it is refused, go back to step 1).
  - Tell Chồng yêu it is live, and list spec §12's iPhone checks that apply to lô A: is pinch smooth, are + / − needed, is the blur at 1.6× all right.
