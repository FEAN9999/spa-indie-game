# Đợt 2 Phần 4 Lô A: Tầng 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From day 6 the player can open floor 2 for 2.000.000 đ. Beds, plants and the rest can go upstairs, and the owner and technicians climb the fixed stairs to serve there. Floor pills switch the view. Save v14 keeps the floors, and an old shop with furniture on the new stairs spot opens with that piece refunded.

**Architecture:**
- **One tall grid.** The shop is one `Grid` of 13 × 54: floor 1 is rows 0–17, floor 2 rows 18–35, the rooftop rows 36–53.
  - `towerOf` appends the two generated upper shells to the floor-1 shell.
  - `floorOf(y)` names a row's floor.
  - The stairs are a new cell, `'stairs'` (layout char `U`).
  - `Grid.links` joins the stair feet of consecutive open floors. `findPath` and `flood` step through links like a fifth direction, so every existing caller works across floors unchanged.
- **Climbing.** `moveAlong` treats a step whose floor differs as a climb. It counts `climbMs` on the mover to `STAIRS_MS`, then jumps.
- **The view shows one floor at a time.**
  - `RoomView.floor` shifts tile rows by `(floor − 1) × 18` and hides what is not on that floor.
  - `SpaScene` owns which floor is viewed.
  - A `FloorBar` draws the pills in the shop and in build mode's hold row.
  - The rooftop is in the rules but gets no pill or art until lô B.

**Tech Stack:** TypeScript, Phaser ^4.2.1 (view only), Vite ^8.3, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-2-tang-design.md`, Lô A (§9), approved 2026-10-28. Rules in §5, §7 and §8; numbers in §10; builder calls in §11.

**Branch:** `dot-2-tang-a` in worktree `.superpowers/worktrees/dot-2-tang-a`, cut from master after the plan commit. Task 0 (fixture) is done there first.

## Global Constraints

- **Layering:** `src/sim/**` never imports Phaser, `src/view/**`, `src/scenes/**`, `src/art/**` or `src/audio/**`.
- **Text:** all player-facing text lives in `src/strings/vi.ts`, in Vietnamese with full diacritics. Money is shown with `formatMoney`.
- **Numbers (`src/config.ts`), exactly:**
  - `FLOOR_ROWS = 18`
  - `MAX_FLOORS = 3`
  - `FLOOR_PRICE = { 2: 2_000_000, 3: 4_000_000 }`
  - `STAIRS_MS = 1000`
  - `UNLOCK_DAY.floors = 6`
  - `STAFF_PER_FLOOR = 2`: technicians max `3 + 2 × (floors − 1)`; receptionist stays 1.
- **Stairs:** cells (11, 7), (11, 8), (11, 9) on every floor; foot (11, 10) on every floor, i.e. (11, 10 + 18(k − 1)) on floor k.
  - Stairs cells are neither walkable nor placeable.
  - The foot is walkable, but no item may claim it, a bed's work tile included.
- **Default furniture unchanged:** `DEFAULT_ITEMS` stays as it is; only the shell gains the `U` cells.
- **Save:**
  - `SAVE_VERSION = 14`.
  - Every v1–v13 fixture still opens.
  - A v14 save with an item on a locked floor or touching a stairs cell or a foot is damaged: `SaveError`.
- **Floor pills:**
  - Shown from day 6, only when the shop has stairs.
  - Lô A shows two pills: Tầng 1 and Tầng 2.
  - Each pill is about 320 × 96 px, at least 96 px tall, centred on y 1855.
- **Toasts** move from y 1790 to y 1690.
- **The view changes floor by itself only:**
  - at load, to the owner's floor;
  - at day start, to floor 1;
  - right after a floor opens, to that floor;
  - while the owner is on a serve leg, when they arrive on another floor.
  - Every other change is the player's tap.
- **Every floor's rules run each step; only the viewed floor is drawn.**
- **Commits:** plain English subject lines in the repo's style, no attribution lines. Never stage `CLAUDE.md`.

## Review Focus

1. **A build change while someone is mid-climb.** They must not teleport, freeze or lose their climb time if their new route still climbs; if it does not, the count resets. Test in Task 2.
2. **Cutting the floor-1 stair foot off from the door while floor 2 is still locked.** This must be refused with `blocksPath`, so the floor can always be opened later. Test in Task 1.
3. **Save and reload in the middle of a climb.** The same `climbMs` and the same arrival time on the next floor. Test in Task 3.
4. **An old shop whose bed only touches the foot through its work tile.** The bed is removed and refunded like any other; its customer leaves with no review. Test in Task 3.
5. **A customer served upstairs.** They walk down the stairs and out of the door. A technician fetches from floor 1 to a floor-2 bed when it is the only free one. Test in Task 2.

---

### Task 0: A v13 fixture with furniture on the stairs spot (setup, before any code change)

**Files:**
- Create: `tests/fixtures/save-v13.json`

- [ ] **Step 1: Generate the fixture with the untouched v13 code.** Use a throwaway vitest file and delete it afterwards. The shop:
  - day 7, minute 600, money 300 000;
  - services `['shampoo', 'massage']`;
  - the default furniture, plus a bought `massageBed` at (11, 7) with `flip: true` (footprint (11, 7–9), work tile (10, 8));
  - a gift `vyPainting` placed at (11, 10) (put `'vyPainting'` in `book.gifts` first, then `placeGift`);
  - one customer in service on the massage bed, with `servingCustomerId` set to them;
  - the owner standing on (10, 8).
  
  Write `sim.toSave()` to the file with 2-space JSON.
- [ ] **Step 2: Check it.** `v` is 13. The items include id-numbered `massageBed` at x 11, y 7, flip true, and `vyPainting` with `gift: true` at (11, 10).
- [ ] **Step 3: Commit.** `git add tests/fixtures/save-v13.json && git commit -m "Add a v13 save fixture with a massage bed and a gift on the new stairs spot"`

### Task 1: The tall grid, stairs and links

**Files:**
- Modify: `src/config.ts`, `src/sim/layout.ts`, `src/sim/grid.ts`, `src/sim/path.ts`, `src/sim/build.ts`, `src/strings/vi.ts`
- Create: `src/sim/floors.ts`
- Test: `tests/sim/floors.test.ts` (new), `tests/sim/grid.test.ts`, `tests/sim/path.test.ts`, `tests/sim/build.test.ts`

**Interfaces:**
- **Produces, config:** `FLOOR_ROWS`, `MAX_FLOORS`, `FLOOR_PRICE: Record<number, number>`, `STAIRS_MS`, `STAFF_PER_FLOOR`, and `UNLOCK_DAY.floors`.
- **Produces, `floors.ts`:**
  - `floorOf(y: number): number`, which is `Math.floor(y / FLOOR_ROWS) + 1`.
  - `towerOf(shell: string[]): string[]`:
    - A shell with no `U` comes back unchanged (one floor).
    - Otherwise it must have `FLOOR_ROWS` rows, or the function throws.
    - It returns `MAX_FLOORS × 18` rows. Each generated floor has rows 0–1 all `#` and row 17 all `#`; rows 2–16 are `#`, then `.` or `U` (copying floor 1's `U` cells), then `#`.
- **Produces, `grid.ts`:**
  - `Cell` gains `'stairs'`; the layout char is `U`.
  - `Grid` gains:
    - `stairs: Tile[]`;
    - `feet: Tile[]`: per floor, the tile under that floor's lowest stairs cell, index = floor − 1;
    - `links: [Tile, Tile][]`.
  - `buildGrid(shell, items, floors = 1)` links `feet[k − 1]` with `feet[k]` for every k < `floors`.
- **Produces, `path.ts`:** `neighbours(grid: Grid, t: Tile): Tile[]` returns the four `DIRS` steps in order, then the far end of every link at `t`. `findPath` uses it.
- **Produces, `build.ts`:**
  - `flood` uses `neighbours`.
  - `claimed(item)` is now exported.
  - `offFloor(shell, item, floors: number)` is also true for a claimed tile above `floors`.
  - `placeProblem(shell, items, item, { door, ownerStart, floors })` can also return `'seatFloor'`.
  - `BuildProblem` gains `'seatFloor'`, with `PROBLEM_TEXT.seatFloor = 'problemSeatFloor'` ("Ghế chờ chỉ đặt ở tầng 1").

- [ ] **Step 1: Write the failing tests.**
  - `floors.test.ts`:
    - `floorOf(0) === 1`, `floorOf(17) === 1`, `floorOf(18) === 2`, `floorOf(53) === 3`.
    - `towerOf(shellOf(SPA_LAYOUT_1A))` has 54 rows of 13.
    - Row 25 (18 + 7) is `'#..........U#'`, row 18 is all `#`, and row 35 is all `#`.
    - `towerOf(['#####','#...#','##D##'])` comes back unchanged.
    - `towerOf` of a 5-row layout with a `U` throws.
  - `grid.test.ts`:
    - `parseLayout(towerOf(shellOf(SPA_LAYOUT_1A)))` has `stairs` of length 9 and `feet` equal to `[{x:11,y:10},{x:11,y:28},{x:11,y:46}]`.
    - `isWalkable` is false on (11, 8) and true on (11, 10).
    - `buildGrid(shell, [], 1).links` is empty; with `floors` 2 it is `[[{11,10},{11,28}]]`.
  - `path.test.ts`:
    - On the tower with 2 floors, `findPath` from (9, 13) to (5, 30) passes (11, 10) then (11, 28) as consecutive steps.
    - With 1 floor it returns null.
  - `build.test.ts`:
    - On the tower shell, these are `'overlap'`: a plant on (11, 8); a plant on (11, 10); a plant on (11, 28); a massage bed at (11, 7) with `flip: true`.
    - A bench at (2, 25) with `floors` 2 is `'seatFloor'`.
    - A plant at (5, 25) with `floors` 1 is `'overlap'` (locked floor).
    - A plant at (10, 10) with `floors` 1 is `'blocksPath'`: with the stairs above and the default vase on (11, 11), (10, 10) is the floor-1 foot's only way in (Review Focus 2).
    - Every existing `placeProblem` call passes `floors: 1` and keeps its result.
- [ ] **Step 2: Run the tests and confirm they fail.** `npx vitest run tests/sim/floors.test.ts tests/sim/grid.test.ts tests/sim/path.test.ts tests/sim/build.test.ts`. Expect failures on the missing exports and fields.
- [ ] **Step 3: Implement.**
  - Add `U` to `SPA_LAYOUT_1A` at (11, 7), (11, 8) and (11, 9), and to the legend comment.
  - Write `floors.ts` and the config values.
  - Grid:
    - `parseLayout` fills `stairs` and computes `feet` from them.
    - `buildGrid` copies them and builds `links`.
  - Path: `neighbours`, used by `findPath`. It keeps the BFS order of `DIRS` first.
  - Build:
    - `flood` uses `neighbours`.
    - `placeProblem` adds `shell.feet` to the kept tiles. It rejects a `group: 'seat'` item with `floorOf(item.y) !== 1` as `'seatFloor'`, after `overlap` and `bedWall`. It builds the grid with `floors` and also requires `feet[0]` reached when the shell has feet.
  - `vi.ts`: add `problemSeatFloor: 'Ghế chờ chỉ đặt ở tầng 1'`.
  - Note: `SpaSim` still passes the old arguments until Task 2. Make `SpaSim.canPlace` pass `floors: 1` and `fromSave` pass `1` to `offFloor`, so the build stays green.
- [ ] **Step 4: Run all tests.** `npm test`. Expect all to pass, including every old grid, path, build and save test.
- [ ] **Step 5: Commit.** `git commit -m "Stack three floors on one tall grid, with fixed stairs whose feet link open floors"`

### Task 2: The shop on several floors

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/crew.ts`, `src/sim/types.ts`, `src/sim/staff.ts`, `src/sim/tutorial.ts`, `src/strings/vi.ts`
- Test: `tests/sim/spa-floors.test.ts` (new), `tests/sim/tutorial.test.ts`, `tests/sim/spa-staff.test.ts`

**Interfaces:**
- **Consumes (Task 1):** `towerOf`, `floorOf`, `buildGrid(shell, items, floors)`, `placeProblem(…, { floors })`, `Grid.feet`.
- **Produces, `types.ts`:**
  - `Mover`, `Owner` and `Customer` gain `climbMs?: number`; `Staff` gains it in `staff.ts`.
  - `SimEvent` gains `{ type: 'floorOpened'; floor: number }`.
  - `HINT_IDS` gains `'openFloor'`.
- **Produces, `SpaSim`:**
  - `floors: number`, starting at 1.
  - `maxFloors(): number`, which is `Math.max(1, grid.feet.length)`.
  - `floorProblem(floor: number): FloorProblem | null`, where `export type FloorProblem = 'max' | 'day' | 'order' | 'blocked' | 'money'`. Checks in that order:
    - `max`: `floor <= floors` or `floor > maxFloors()`;
    - `day`: before `UNLOCK_DAY.floors`;
    - `order`: `floor > floors + 1`;
    - `blocked`: the door does not reach `grid.feet[floor − 2]`;
    - `money`: `money < FLOOR_PRICE[floor]`.
  - `openFloor(floor: number): FloorProblem | null`. It takes the price, sets `floors`, runs `changeRoom()` and emits `floorOpened`.
- **Produces, `crew.ts`:** `staffCap(role: StaffRole, floors: number): number`.
- **Produces, `tutorial.ts`:** `Pointer` gains `{ hint: 'openFloor' }`, picked when `sim.floors > 1 && !sim.hintDone('openFloor')`.

- [ ] **Step 1: Write the failing tests** in `spa-floors.test.ts`. Use `advanceUntil` and `seatAndWait` from `helpers.ts`; set `sim.day = 6` and enough money where needed.
  - **`openFloor`:**
    - Day 5 gives `'day'`. `openFloor(3)` first gives `'order'`. Money 1 999 999 gives `'money'`.
    - Day 6 with 2 000 000 returns null: `floors` is 2, money is 0, and a `floorOpened` event with floor 2 is emitted.
    - `openFloor(2)` again gives `'max'`.
    - A shop built with a layout without `U` gives `'max'` and `maxFloors() === 1`.
  - **`blocked`:** wall off the floor-1 foot by assigning `sim.items` directly and rebuilding through a public path such as a round trip via `toSave`/`fromSave`. `floorProblem(2)` is `'blocked'`.
  - **Climbing:**
    - The owner is on (11, 10) with path `[{11,28}, {11,29}]`.
    - After `advance(950)` they are still on (11, 10) with `climbMs` near 950, facing `'up'`.
    - After another `advance(100)` they are on floor 2 at or past (11, 28), and `climbMs` is 0 or absent.
  - **Reroute mid-climb (Review Focus 1):**
    - The owner is at the foot with `climbMs` 500, heading up. Buying a plant elsewhere keeps `climbMs` 500.
    - Then the owner taps a floor-1 tile: the next step is not a jump, and `climbMs` resets.
  - **Bed order:** with floors 2, a shampoo bed bought at (2, 20) and the default floor-1 shampoo beds, a fetched customer goes to the floor-1 bed. When both floor-1 shampoo beds are taken, the next goes to (2, 20), whose station is listed after the floor-1 ones.
  - **Served upstairs (Review Focus 5):**
    - The only free massage bed is on floor 2. Tapping the waiting massage customer gets them to `inService` on floor 2.
    - `completeService` then makes them leave through (11, 28) and (11, 10) to the door, and they are removed.
  - **A technician fetches upstairs:** hire a technician with tier 1 massage, open massage, and leave only a floor-2 massage bed. The technician's serve task points to that bed's station, and they reach its work tile.
  - **Seats:** with floors 2, buying a bench at (2, 25) returns `'seatFloor'`. `sim.seats` holds only floor-1 tiles.
  - **Staff cap:** `staffCap('technician', 1) === 3`, `2 → 5`, `3 → 7`; `staffCap('receptionist', 3) === 1`. With floors 2, a 4th and 5th technician can be hired and a 6th is `'full'`.
  - **`homeOf`:** with floors 2 and 5 technicians, every home has `floorOf(y) === 1` and none is (11, 10).
  - **`tutorial.test.ts`:** after `openFloor(2)`, `pickHint` gives `{ hint: 'openFloor' }` until `markHint('openFloor')`.
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run tests/sim/spa-floors.test.ts tests/sim/tutorial.test.ts`
- [ ] **Step 3: Implement.**
  - **`SpaSim`:**
    - `shell = towerOf(shellOf(layout))`.
    - `rebuildRoom` uses `buildGrid(this.shell, this.items, this.floors)`. Stations are sorted by `floorOf(bed.y)` then id. Seats come only from floor-1 seat items.
    - `canPlace` passes `floors`. `toSave` gains `floors`; the save itself is Task 3. `fromSave` reads `d.floors ?? 1` until then.
  - **`moveAlong` climb step:**
    - When `floorOf(path[0].y) !== floorOf(m.pos.y)`, face `'up'`.
    - Add the frame's time, `budget / speed × 1000` ms, to `climbMs`. At `STAIRS_MS`, set `pos` to the target, shift the path, clear `climbMs` and carry the leftover time on as walking budget.
    - At the start of `moveAlong`, clear `climbMs` when the path is empty or `path[0]` is not a jump.
  - **`crew.ts`:** `hireProblem` uses `staffCap(c.role, sim.floors)`. `homeOf` filters its flood to `floorOf(t.y) === 1` and excludes `sim.grid.feet`.
  - **`vi.ts`:** `hintOpenFloor: 'Bấm Xây dựng để kê giường lên tầng mới'`.
- [ ] **Step 4: Run all tests.** `npm test`. Expect all to pass.
- [ ] **Step 5: Commit.** `git commit -m "Open floor 2 from day 6: climb the stairs, take the lowest free bed, seat only downstairs, and hire two more technicians a floor"`

### Task 3: Save v14 and old shops

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/spa.ts`, `src/sim/types.ts`, `src/strings/vi.ts`
- Create: `src/sim/stairs.ts`
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- **Consumes:** `tests/fixtures/save-v13.json` (Task 0), `claimed`, `placeProblem`, `nearestSpot` (Task 1), `SpaSim.floors` (Task 2).
- **Produces:**
  - `SAVE_VERSION = 14`.
  - `SaveData` gains:
    - `floors: number`;
    - `clearStairs?: true`. `parseSave` sets it on any save older than v14; `toSave` never writes it.
  - `parseSave`:
    - keeps a v14 `floors` that is an integer from 1 to `MAX_FLOORS`, else 1; older saves get 1;
    - keeps `climbMs` on the owner, customers and staff when it is a finite number ≥ 0, else drops it.
  - `stairs.ts`: `clearStairs(d: SaveData, shell: Grid): StairsNote`, where `StairsNote = { count: number; refund: number; rebuy: ItemKind | null; leavers: number[] }`.
  - `SimEvent` gains `{ type: 'stairsCleared'; count: number; refund: number; rebuy: ItemKind | null }`.

- [ ] **Step 1: Write the failing tests** in `save.test.ts`, in a new `describe('save version 14')`.
  - **Round trip:** a shop with floors 2 and a bed on floor 2 keeps both. A mid-climb owner (`climbMs` 400) keeps 400 and arrives on floor 2 after the same `advance` as the original (Review Focus 3).
  - **Damaged v14 saves:**
    - `floors` 7 opens with `floors` 1, and then an item on floor 2 throws `SaveError`.
    - An item on (11, 8) throws `SaveError`.
  - **The v13 fixture:**
    - The massage bed is gone and money is 300 000 + 450 000.
    - `book.gifts` ends with `'vyPainting'`, which is no longer among the items.
    - The served customer is `leaving` with no new review, `stats.walkedAway` and `stats.angry` unchanged, and `servingCustomerId` null.
    - No `serviceReady` event; one `stairsCleared` event with count 2, refund 450 000 and rebuy null.
    - The owner is on a walkable tile.
    - `toSave().v` is 14 and has no `clearStairs`.
  - **Every older fixture (v1–v12)** opens with `floors` 1 and the same items as before, since none is on the stairs spot.
  - **Work tile only (Review Focus 4):**
    - Build a v13-shaped `SaveData` from a `toSave()` with `v` set to 13 and `floors` deleted. Add a massage bed at (7, 8) with `flip: false` (a control) and one at (10, 9) with `flip: false`, whose work tile (11, 10) is the foot.
    - Only the second is removed and refunded.
  - **The last shampoo bed:** a v13-shaped save whose default shampoo beds are removed and whose only `bed` stands on (11, 7) with `flip: true` loses no money. The bed is moved to a spot where `placeProblem` is null on floor 1, and no `stairsCleared` event is emitted when nothing else was removed.
  - **Reroute after move:** a customer on the moved bed leaves quietly.
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run tests/sim/save.test.ts`
- [ ] **Step 3: Implement.**
  - **`save.ts`:** read the raw version before `parseVersioned`, which must now accept v13 as an older version. Update the old "only saves newer than version 13" test to 14.
  - **`clearStairs`:**
    - Spot tiles are `shell.stairs` plus `shell.feet`. Touched items are those whose `claimed` tiles meet the spot, in id order.
    - **The last `bed`, or the last seat item:** move it with `nearestSpot` from the tile inside the door, trying its own flip and then the other. Fits means `placeProblem` on the floor-1 shell with `floors: 1` against the other items is null. If nothing fits, remove it, refund it and set `rebuy`.
    - **Any other touched item:** remove it. A gift goes to `book.gifts`; otherwise refund the full `ITEMS[kind].price`. `count` counts every removed item.
    - **Customers** whose `stationId` is a touched item, or whose seat is on a touched item: set `stationId` null, `seat` null and `state` `'leaving'`, and push their id to `leavers`.
    - If `servingCustomerId` is one of them, set it to null. An owner task naming one of them becomes null.
  - **`fromSave`:**
    - When `d.clearStairs`, run `clearStairs` before the `offFloor` check. The check now uses `d.floors`, and also throws for an item that touches a stairs cell or a foot.
    - After `repairAfterLoad`, when `d.clearStairs`: run `settleCharacters()`; call `startLeaving` for each leaver; and emit `stairsCleared` when `count > 0` or `rebuy` is set.
  - **`vi.ts`:**
    - `stairsRefund: 'Chỗ cầu thang mới có {count} món đồ, đã hoàn {money}'`
    - `stairsGifts: 'Quà ở chỗ cầu thang mới đã về sổ khách'`
    - `stairsRebuy: 'Không còn chỗ cho {item}, nhớ mua lại nhé'`
- [ ] **Step 4: Run all tests.** `npm test`. Expect all to pass.
- [ ] **Step 5: Commit.** `git commit -m "Save v14: keep the floors and the climb, and clear the new stairs spot in older shops with a full refund"`

### Task 4: Art for the stairs and floor 2

**Files:**
- Create: `src/art/floors.ts`
- Modify: `src/art/room.ts`, `src/scenes/BootScene.ts`
- Test: `tests/art/floors.test.ts` (new), `tests/art/room.test.ts`

**Interfaces:**
- **Produces:**
  - `floorTextures(): Record<string, string>`, an SVG per key:
    - `'room-2'`: the floor-2 room. It is the same size as `'room'` (13 × (18 + `STREET_TILES`) tiles), with the balcony in the street band.
    - `'stairs'`: covers tiles (11, 7–9), drawn from its top-left.
    - `'stairsRope'`: the rope and small sign over the bottom step.
  - `roomBody` draws a `'stairs'` cell as floor; the `stairs` sprite covers it.
- **Reference:** port the look from the approved sketch's `floor2Room` and `stairsArt` generators. They are in the scratchpad file `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\d602ec46-bce2-4f0a-a881-7f89225bdd38\scratchpad\sketch\template.html`. Floor 2 has:
  - a wood floor;
  - two green cửa chớp windows and a lantern on the back wall;
  - two glass doors in the front wall onto a gạch bông balcony with an iron railing and four flower pots.
  
  Use `palette.ts` colours and the outline helper the other art uses. Keep the brown outline.

- [ ] **Step 1: Write the failing tests,** modelled on `tests/art/room.test.ts`. Each `floorTextures()` key is a well-formed `<svg` string with the expected `viewBox`. `'room-2'` reuses `GACH_BONG_TILE`. No colour outside `C`, if `palette.test.ts`'s rule covers new files.
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run tests/art`
- [ ] **Step 3: Implement** `floors.ts`, the `roomBody` change, and load `...floorTextures()` in `BootScene`.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expect both to pass.
- [ ] **Step 5: Commit.** `git commit -m "Draw the stairs, their rope, and floor 2 with its wood floor, shutters and balcony"`

### Task 5: The view shows one floor

**Files:**
- Modify: `src/view/RoomView.ts`, `src/scenes/SpaScene.ts`, `src/view/StaffLayer.ts`, `src/view/CharacterView.ts` (only if needed for alpha)
- Create: `src/view/floors.ts`
- Test: `tests/view/floors.test.ts` (new)

**Interfaces:**
- **Consumes:** `floorOf`, `SpaSim.floors`, `climbMs`, and the textures from Task 4.
- **Produces, `src/view/floors.ts` (pure, no Phaser):**
  - `followFloor(sim: SpaSim, viewed: number): number` gives the owner's floor while `owner.task?.kind === 'serve'` and the owner is not mid-climb (`!(owner.climbMs > 0)`); otherwise `viewed`.
  - `climbPose(m: { pos: Vec; climbMs?: number }): { lift: number; alpha: number } | null`. While `climbMs > 0`, with k = climbMs / STAIRS_MS, it gives `lift = 2.5 × k` tiles and `alpha = 1 − k`; otherwise null.
- **Produces, `RoomView`:**
  - `floor: number` and `setFloor(floor: number, floors: number, maxFloors: number): void`. It swaps the room texture (`'room'` or `'room-2'`), shows the desk and screen only on floor 1, shows the `stairs` sprite, and shows `stairsRope` when `floors === floor` and `floor < maxFloors`. The caller re-syncs after it.
  - `sync` hides items, lanterns, mats and bed slots that are not on the viewed floor.
  - `onFloor(y: number): boolean`.
  - `tileToWorld` and `worldToTile` shift rows by `(floor − 1) × FLOOR_ROWS`. Every direct `MAP_Y + y × TILE` in `RoomView` goes through one private `rowY(y)`.
- **Produces, `SpaScene`:**
  - `viewFloor` and `showFloor(floor: number)`, the single place that changes it and re-syncs `RoomView`.
  - It sets the floor at load (`floorOf(owner.pos.y)`), after `startDay()` (1), on `floorOpened` (the new floor), and each frame from `followFloor`.

- [ ] **Step 1: Write the failing tests** for `followFloor` and `climbPose`:
  - no task → viewed;
  - serve task with the owner on floor 2 → 2;
  - serve task mid-climb → viewed;
  - a fetch task with the owner on floor 2 → viewed;
  - `climbPose` at `climbMs` 500 → lift 1.25, alpha 0.5;
  - no `climbMs` → null.
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run tests/view/floors.test.ts`
- [ ] **Step 3: Implement.**
  - **Characters:** the owner, customers and staff are visible only when `room.onFloor(pos.y)`. Customers on the street count as floor 1. While `climbPose` is non-null, draw them lifted toward the stairs and faded, on the floor they are leaving.
  - **Pop-ups:** every bubble, heart, money pop-up and review bubble anchored on a customer or tile is skipped when that tile is not on the viewed floor.
  - **Taps:** `worldToTile` gives tower rows, so `sim.tapTile` gets the right floor.
  - **Bed slots** (floor 1 only) are hidden on other floors.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expect both to pass.
- [ ] **Step 5: Commit.** `git commit -m "Show one floor at a time and follow the owner up the stairs on the way to a bed"`

### Task 6: Floor pills and opening a floor

**Files:**
- Create: `src/view/FloorBar.ts`
- Modify: `src/view/floors.ts`, `src/view/Hud.ts`, `src/scenes/SpaScene.ts`, `src/strings/vi.ts`
- Test: `tests/view/floors.test.ts`

**Interfaces:**
- **Consumes:** `floorProblem`, `openFloor`, `FLOOR_PRICE`, `showFloor`, `pickHint`'s `openFloor`, and the `stairsCleared` event.
- **Produces, `src/view/floors.ts`:**
  - `FLOOR_PILLS = 2` (lô B sets it to 3).
  - `showPills(sim): boolean`, which is `sim.day >= UNLOCK_DAY.floors && sim.maxFloors() > 1`.
  - `interface Pill { floor: number; state: 'viewed' | 'open' | 'locked'; price: number; face: boolean; dot: boolean }`.
  - `pills(sim: SpaSim, viewed: number): Pill[]`:
    - one pill per floor 1…`min(FLOOR_PILLS, maxFloors())`;
    - `face` is true on `floorOf(owner.pos.y)`;
    - `dot` is true only on floor 1, when `viewed !== 1` and some customer is `'waiting'`.
- **Produces, `FloorBar`:** `new FloorBar(scene, depth, onTap: (floor: number) => void)` with `.show(pills: Pill[])` and `.hide()`.
  - The pills are 320 × 96 with a 24 px gap, centred as a row on (540, 1855).
  - Viewed is teal with cream text; open is cream; locked has a dashed edge, a lock and the price.
  - The face is a small owner head on the pill's left, drawn the way the game already draws the owner's look (or a simple face in the owner's hair colour if no head-only drawing exists). The dot is red, top right.

- [ ] **Step 1: Write the failing tests** for `showPills` and `pills`:
  - Day 5 → false; day 6 → true; a layout without stairs → false.
  - Two pills with states `viewed`/`locked` and price 2 000 000 on floor 2.
  - Face on floor 1.
  - Viewing 2 with a waiting customer gives `dot` on pill 1 only; viewing 1 gives no dot.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
  - **`Hud`:** toast y 1790 → 1690. `SpaScene` owns one `FloorBar` and refreshes it each frame from `pills` when `showPills`.
  - **Tap behaviour:** tapping a viewed or open pill calls `showFloor`; tapping a locked one calls `offerFloor(floor)`. Copy the `offerBed` card pattern.
    - The card shows the title `floorName2`, two lines `floorLine2a`/`floorLine2b`, and buttons `Để sau` and `Mở · {money}`.
    - On `money`, the open button is dimmed and does nothing, with `floorShort` "Còn thiếu {money}" under it.
    - On `order` the card shows `floorOrder` "Mở tầng 2 trước"; on `blocked` it shows `floorBlocked` "Dọn lối tới cầu thang trước". Neither has an open button.
  - **On open:** `sound.play` the purchase sound that buying furniture uses, `showFloor(floor)`, `syncRoom()`, `session.saveNow()`.
  - **`openFloor` hint:** the pointer at `BUILD_PLATE_TOP` with `hintOpenFloor`. `openBuild` marks `'openFloor'` when `floors > 1`.
  - **`stairsCleared`:** toast `stairsRefund` when `refund > 0`, else `stairsGifts` when `count > 0`. Then, after `LATE_TOAST_MS`, `stairsRebuy` with the item's name when `rebuy` is set.
  - **`vi.ts`:**
    - `floorName1: 'Tầng 1'`, `floorName2: 'Tầng 2'`, `floorName3: 'Sân thượng'`
    - `floorLine2a: 'Sàn gỗ, cửa chớp xanh, ban công gạch bông.'`
    - `floorLine2b: 'Thêm chỗ kê giường, thêm 2 thợ.'`
    - `floorOpen: 'Mở · {money}'`, `floorLater: 'Để sau'`
    - `floorShort: 'Còn thiếu {money}'`, `floorOrder: 'Mở tầng 2 trước'`, `floorBlocked: 'Dọn lối tới cầu thang trước'`
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expect both to pass.
- [ ] **Step 5: Commit.** `git commit -m "Add floor pills with the owner's face and a waiting dot, and a card to open floor 2"`

### Task 7: Build mode on each floor

**Files:**
- Modify: `src/scenes/BuildScene.ts`, `src/scenes/SpaScene.ts` (`openBuild` passes the viewed floor and a way to change it)
- Test: `tests/view/floors.test.ts` (pure helper only)

**Interfaces:**
- **Consumes:** `RoomView.floor`/`setFloor`/`rowY`, `FloorBar`, `pills`, `floorOf`, `FLOOR_ROWS`.
- **Produces:**
  - `carryTo(item: Item, floor: number): Item` in `src/view/floors.ts`: the same item with `y` moved by whole floors so that `floorOf(y) === floor`, keeping its row within the floor.
  - `BuildData` gains `showFloor: (floor: number) => void`.

- [ ] **Step 1: Write the failing test.** `carryTo({ kind: 'plant', x: 4, y: 12, … }, 2).y === 30` and back to 1 gives 12.
- [ ] **Step 2: Run it and confirm it fails.**
- [ ] **Step 3: Implement.**
  - `drawGrid` outlines only the viewed floor's `'floor'` cells, read from the sim's tower shell. Expose `sim.shellGrid(): Grid`, the parsed tower shell, unbuilt.
  - The ghost, the tint and `CENTRE` use the viewed floor's rows: `CENTRE` becomes (6, 9 + (floor − 1) × 18).
  - **Hold mode:** a `FloorBar` above the hold row shows the open floors. Tapping another floor calls `showFloor` and moves the held item with `carryTo`. If it does not fit there, it moves to the `nearestSpot` that fits on that floor, else stays where `carryTo` put it. Then the ghost is redrawn. The FloorBar is removed in `letGo` and in catalog mode.
  - Toasts in build mode use y 1690 if they sat in the pill band.
  - A bench put upstairs shows `problemSeatFloor`. `problemText` must handle `'seatFloor'`.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expect both to pass.
- [ ] **Step 5: Commit.** `git commit -m "Build on the floor in view, and carry a held piece to another floor with the floor pills"`

### Task 8: Staff screen pages

**Files:**
- Modify: `src/scenes/StaffScene.ts`, `src/strings/vi.ts` (only if a label is needed)

- [ ] **Step 1: Implement.** The "Đang làm" tab shows `MAX_ROWS` (4) people a page, with left and right arrows like the build catalog's when there are more than 4. The page resets when the tab opens and clamps after a firing. Reuse `catalogPage`'s paging shape, or a tiny pure helper with a test if one is added.
- [ ] **Step 2: Run** `npm test` and `npm run build`. Expect both to pass.
- [ ] **Step 3: Commit.** `git commit -m "Page the staff list four people at a time"`

### Task 9: Verify and ship

- [ ] **Step 1:** `npm test` and `npm run build` on the branch. Expect all to pass.
- [ ] **Step 2: Browser checks at iPhone size** (gstack `$B`, `npm run dev`). Use a dev save at day 6 with money:
  1. Open floor 2. The view moves there and the hint shows.
  2. Put a massage bed on floor 2. Carry a plant up from floor 1 with the pills in hold mode.
  3. The owner takes a massage customer up and the view follows; after the mini-game the view stays.
  4. A technician comes down to fetch.
  5. The red dot shows on Tầng 1 while viewing floor 2 with a new customer.
  6. Load the v13 fixture: the refund toast shows and the stairs are clear.
  7. The staff screen shows 6 people over 2 pages.
  8. No console errors.
- [ ] **Step 3: Final whole-branch review,** then ship: fetch, merge onto the latest `origin/master` in a temp worktree if master moved, run the tests again, push master. Report to anh in Vietnamese.
