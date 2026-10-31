# Đồ trang trí mới Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 25 new buyable decor pieces (3 sets of 6, 7 loose), including pieces hung on the back wall and rugs under the furniture, plus a filter in the Trang trí tab.

**Architecture:** Wall pieces and rugs stay `group: 'decor'` items (so the tab, gifts, buy/move/sell and saves are untouched) and gain `layer: 'wall' | 'rug'` on their `ItemSpec`. The layer decides placement in `build.ts`, is skipped by `buildGrid`, and sets draw depth in `RoomView`. (The spec says "group mới"; section 7 leaves the code split to the builder, and a layer field ripples far less.)

**Tech Stack:** TypeScript, Phaser 4, Vitest, SVG-in-code art.

**Spec:** `docs/superpowers/specs/2026-10-31-do-trang-tri-design.md`

## Global Constraints

- `SAVE_VERSION = 35`; saves v34 and older load unchanged.
- Wall pieces: row `y % FLOOR_ROWS === 1`, floors 1–2 only, every tile below (`y + 1`) is `'floor'` in the shell; never turn (`canTurn` false), may flip.
- Rugs: lie flat on open `'floor'` shell tiles; overlap anything but rugs; never enter `buildGrid`; turned rugs are not upright.
- Depth order, bottom to top: room 0 → houses 0.5 → rugs 0.8 → parts (mats, bed slots, stairs) 1 → wall pieces 1.2 → bed lanterns 1.3 → festival 1.5 → items/people.
- Names, sizes, prices and beauty exactly as the spec's tables 5.2 and 5.3.
- Filter order: Tất cả → Sài Gòn xưa → Tre làng → Thiền xanh → Hoài cổ → Vườn hoa → Treo tường → Thảm.

## Review Focus

- A rug under a bed in a v35 save must load (fromSave's stairs-foot check and `offFloor`) — test in Task 2.
- A wall piece in a bought house's wall: allowed only once the house is bought (shell cell below is floor) — test in Task 1.
- Tapping a bed lying on a rug picks the bed, not the rug — checked in Task 5 browser step (BuildScene has no unit tests).
- Gift waiting while the filter is on Thảm: the filter resets to Tất cả — Task 5.
- A rug on the stairs foot or the tile inside the door — allowed, walkers unaffected — test in Task 1.

---

### Task 1: Layers in the sim, the 25 kinds and 3 sets

**Files:**
- Modify: `src/sim/items.ts`, `src/sim/build.ts`, `src/sim/grid.ts:110-140`, `src/strings/vi.ts`
- Test: `tests/sim/decor-layers.test.ts`

**Interfaces:**
- Produces: `ItemSpec.layer?: 'wall' | 'rug'`; `layerOf(kind: ItemKind): 'floor' | 'wall' | 'rug'`; `SetId = 'saigon' | 'bamboo' | 'zen' | 'retro' | 'garden'`; `SET_IDS: SetId[]` (that order); string keys `setZen 'Thiền xanh'`, `setRetro 'Hoài cổ'`, `setGarden 'Vườn hoa'`, one `item*` key per new kind.
- New kinds (ids → spec rows): zen `waterfall, bonsai, stoneLamp, inkBamboo(wall 2), candleShelf(wall 1), sedgeRug(2×2)`; retro `gramophone, standFan, sewingMachine(2×1), pendulumClock(wall), birdCage(wall), redRug(3×2)`; garden `fishTank(2×1), bougainvillea, sunflowerVase, fernBasket(wall), succulentShelf(wall 2), grassRug(2×2)`; loose `lacquerPainting(wall 2), rattanMirror(wall), wallLantern(wall), conicalHat(wall), runnerRug(1×3), roundRug(2×2), brocadeRug(2×3)`. Wall pieces have `h: 1`. A "2×1" floor piece is `w: 2, h: 1`; rug "3×2" is `w: 3, h: 2`, "1×3" is `w: 1, h: 3`, "2×3" is `w: 2, h: 3`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/decor-layers.test.ts`, using `SpaSim` via `tests/sim/helpers.ts` like `build.test.ts` does:
  - `wall piece hangs only on the second wall row of an open floor`: `canPlace('rattanMirror', 15, 1, false)` null; `(15, 0)` 'overlap'; `(15, 2)` 'overlap'; `(12, 1)` (side-wall corner: tile below is wall) 'overlap'; floor 2 `(15, 19)` null once floors ≥ 2, 'overlap' before; floor 3 `(15, 37)` 'overlap' with 3 floors open.
  - `wall piece on a house wall only once the house is bought`: column `SHOP_X0 - 2` row 1 'overlap', then after `buyHouse('left')` null.
  - `two wall pieces cannot share a tile; a wall piece ignores beds below`: buy `inkBamboo` at (14,1), `rattanMirror` at (15,1) → 'overlap'; at (16,1) → null.
  - `rug lies under beds, seats, the door tile inside and the stairs foot, and leaves the grid alone`: snapshot `sim.grid.cells` JSON, buy `brocadeRug` at a spot covering a default bed and its work tile → null, cells JSON unchanged; `runnerRug` covering `door.y - 1` → null; `roundRug` over another rug → 'overlap'; rug on a wall tile → 'overlap'.
  - `rugs turn flat, wall pieces never turn`: `canTurn('redRug')` true, `isUpright({...redRug, turned: true})` false; `canTurn('inkBamboo')` false.
  - `a full new set counts half again`: six `zen` pieces placed → `beautyOf` equals 1.5 × their sum.

- [ ] **Step 2: Run** `npx vitest run tests/sim/decor-layers.test.ts` — expect FAIL (unknown kinds).

- [ ] **Step 3: Implement.**
  - `items.ts`: add kinds/specs/`layer`/`set`, `SET_IDS`, `layerOf`; `canTurn` false for wall; `isUpright` false for rugs; `beautyOf` loops `SET_IDS`.
  - `build.ts`: `claimed` returns `[]` for wall and rug pieces. `offFloor` per layer: floor as now; wall = every footprint tile has `y % FLOOR_ROWS === 1`, `floorOf(y) <= Math.min(floors, 2)`, shell cell at `y` is `'wall'` and at `y + 1` is `'floor'`; rug = every footprint tile in bounds, on an open floor, shell cell `'floor'`. `placeProblem`: for a wall/rug item return `'overlap'` if `offFloor` or its footprint meets a same-layer item's footprint, else null (no path checks).
  - `grid.ts` `buildGrid`: skip items whose `layerOf` is not `'floor'`.
  - `vi.ts`: names from the spec tables.

- [ ] **Step 4: Run** `npx vitest run` — expect all PASS (`items.test.ts`, `build.test.ts` included).

- [ ] **Step 5: Commit** "Add wall pieces and rugs as decor layers, with 25 new pieces in three new sets".

### Task 2: Save version 35

**Files:**
- Modify: `src/sim/save.ts:28`, `src/sim/spa.ts:945-952`
- Create: `tests/fixtures/save-v35.json`
- Test: `tests/sim/save.test.ts`

- [ ] **Step 1: Failing test** `loads a v35 shop with a wall piece and a rug under a bed`: fixture is a fresh v35 save (generate from `toSave()` of a sim with `rattanMirror` at (15,1) and `brocadeRug` under a bed) → `SpaSim.fromSave` keeps both items with their x/y, and `sim.grid` equals that of the same shop without them.
- [ ] **Step 2: Run** — expect FAIL (version / fixture).
- [ ] **Step 3:** bump `SAVE_VERSION` to 35; confirm `fromSave`'s `offFloor` and `onFoot` checks pass through Task 1's layer rules (claimed `[]`); write the fixture.
- [ ] **Step 4: Run** `npx vitest run` — PASS.
- [ ] **Step 5: Commit** "Save in version 35, so a build from before refuses a shop with wall pieces or rugs instead of dropping them".

### Task 3: Catalogue filter

**Files:**
- Modify: `src/view/catalog.ts`
- Test: `tests/view/catalog.test.ts`

**Interfaces:**
- Produces: `type DecorFilter = 'all' | SetId | 'wall' | 'rug'`; `DECOR_FILTERS: DecorFilter[]` in the spec's order; `catalogPage(group, page, open, gifts, filter: DecorFilter = 'all')`.

- [ ] **Step 1: Failing tests:** `'all'` lists every non-gift decor kind in `ITEMS` order (42 cards → 11 pages); `'bamboo'` lists the six bamboo kinds including `bambooBench` (a seat); `'wall'` lists only wall-layer kinds; `'rug'` only rugs; a waiting gift heads `'all'` and is absent from `'rug'`; filter is ignored on the bed and seat tabs.
- [ ] **Step 2: Run** `npx vitest run tests/view/catalog.test.ts` — FAIL.
- [ ] **Step 3: Implement.** A set filter draws from every group; gifts shown only under `'all'` (no gift is in a set or a layer).
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** "Filter the Trang trí cards by set, wall pieces or rugs".

### Task 4: Art for the 25 pieces

**Files:**
- Create: `src/art/newDecor.ts` exporting `NEW_DECOR: Record<string, { w: number; h: number; body: string }>` keyed `decor-<kind>` and `decor-<kind>-turned`
- Modify: `src/art/furniture.ts` (spread `NEW_DECOR` into `FURNITURE`), `src/art/palette.ts` (new colours only if needed)

- [ ] **Step 1:** Draw in the existing style (ink outline `LINE`/`FINE`, palette `C`). Floor pieces: front three-quarter view, `w` tiles wide, height as needed (1–2.4), turned variant for `waterfall`, `sewingMachine`, `fishTank` (edge-on, like `teaTurned`). Rugs: top-down, exactly `w × h` with a 0.05 inset, turned variant for non-square rugs (`h × w`). Wall pieces: `w` wide, height 2 — art between y 0.25 and 1.6, transparent below — anchored so the image bottom sits on the floor line (y = 2 of the floor).
- [ ] **Step 2:** `npx tsc --noEmit` clean; open `zz-gallery.html` (throwaway, never committed) and screenshot every new piece; fix anything off-style.
- [ ] **Step 3: Commit** "Draw the 25 new decor pieces".

### Task 5: Room view and build mode

**Files:**
- Modify: `src/view/RoomView.ts`, `src/view/floors.ts` (`clampToFloor`), `src/scenes/BuildScene.ts`, `src/strings/vi.ts`
- Test: `tests/view/floors.test.ts` (clamp)

- [ ] **Step 1: Failing test:** `clampToFloor` puts a wall piece on its floor's row 1 whatever `y` it is given; other pieces as before.
- [ ] **Step 2: Implement:**
  - `RoomView.sync` depth: rug 0.8, wall 1.2, bed lanterns 1.3; wall art anchored at `rowY(floorTop + 2)`.
  - `BuildScene.itemUnder`: floor-layer footprint → wall-layer footprint → drawn non-rug → rug footprint.
  - Trang trí info line: "Đẹp N" left, `◀ name [have/6] ▶` right (`filterName` strings `filterAll 'Tất cả'`, `filterWall 'Treo tường'`, `filterRug 'Thảm'`; set names reuse `set*`); filter kept on the scene instance, page reset on change, reset to `'all'` when build opens for a gift. Bed and seat tabs show only "Đẹp N".
  - `takeNew` spot search: for a wall piece search row-1 tiles of the floor in view.
- [ ] **Step 3:** `npx vitest run` and `npx tsc --noEmit` — PASS.
- [ ] **Step 4: Browser check** (dev server, mobile viewport): buy a painting on floor 1, floor 2, a bought house; a rug under a bed and the bench; walkers cross the rug; tap the bed on the rug picks the bed; filter cycles; festival bunting over a painting; reload keeps everything.
- [ ] **Step 5: Commit** "Hang wall pieces, lay rugs under the furniture, and add the set filter to build mode".

### Task 6: Ship

- [ ] `git fetch`; confirm `origin/master` is still the base or rebase in this worktree; `npx vitest run`, `npm run build`.
- [ ] `git push origin HEAD:master`; update memory.
