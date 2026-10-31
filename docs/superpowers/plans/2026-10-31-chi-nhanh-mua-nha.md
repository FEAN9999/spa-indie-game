# Chi nhánh mua nhà Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each branch (beach, oldTown, uptown) can buy its four neighbour houses with the main shop's rules. The houses are drawn in the branch's own floor materials, with a wall or trim colour per house. The save moves to v34.

**Architecture:**
- The sim already sells houses (lô B). Lô B blocks a branch in two places: `houseProblem` and `save.ts`. This plan lifts both blocks.
- The art adds one floor-1 house texture per place and house, and one roof-for-sale texture per place. A new flat roof is added for uptown.
- The view picks texture keys and strip colours by `place` through small helpers in `view/houses.ts`. `RoomView` and `SpaScene` call those helpers.
- Nothing about the main shop changes.

**Tech Stack:** Phaser 4.2.1, TypeScript, Vite 8, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-chi-nhanh-mua-nha-design.md`. For background, see `docs/superpowers/plans/2026-10-30-mo-rong-lo-b.md`, which is lô B and is already shipped.

## Global Constraints

- **Save:** `SAVE_VERSION = 34`. A branch keeps its `houses` from v34 on. A branch saved before v34 loads with `{ left: 0, right: 0 }`.
- **Rules (unchanged from lô B):**
  - `HOUSE_PRICE = [3_000_000, 6_000_000]`, near before far, at most 2 per side;
  - `UNLOCK_DAY.houses = 10`;
  - the shared purse pays;
  - +1 technician per house. A branch has 1 floor, so its cap is 3 + 4 = 7. The receptionist cap stays 1.
- **Branch hints:** a branch never shows the "buyHouse" hint, because `hintDone` is always true at a branch. Leave it so.
- **Branch house colours** (exact, from the spec):

  | Place | R1 | L1 | R2 | L2 | Roof for sale |
  |---|---|---|---|---|---|
  | oldTown, wall | `#A9C29A` | `#9DBBD0` | `#E6AE96` | `#F2D28C` | tiles |
  | beach, board band | `#F2A48E` | `#9FD8C2` | `#F4D27A` | `C.sea` | tin |
  | uptown, trim and marble seam | `#5FA39A` | `#AEB6BC` | `#D99AA5` | `#8FB28A` | flat |

- **Main-shop texture keys stay as they are:** `house-<key>-<floor>` and `sale-<key>`.
- **Commits:** each message is one plain sentence, with no attribution lines. The files are CRLF: edit them with the Edit tool, or with Python using `newline=''` and `encoding='utf-8'`.

## Review Focus

1. **Switching shops.** Going from the main shop to a branch and back, each shop shows only its own houses, roofs and camera bounds. Checked in the browser in Task 4.
2. **Moving staff into a branch with houses.** The chain's move check honours the higher cap. Test: Task 1 `'lets the chain move a fifth technician into a branch with a house'`.
3. **A v33 save with a branch.** The branch opens with no houses, and from day 10 it shows the two roofs for sale. Test: Task 1 `'gives a branch saved before version 34 no house'`.
4. **The day finishing for a branch with houses.** At the end of the main shop's day, `finishDay` fast-runs every branch, and a branch with bought houses runs on its wider grid without error. Test: Task 1 `'runs a branch with a house to the end of the day'`.
5. **Buying at a branch.** The top bar's money is the shared purse, so it drops at once. The main shop's houses stay unchanged. Test: Task 1 `'buys a branch house from the shared purse and leaves the main shop alone'`.

---

### Task 1: Rules and save

**Files:**
- Modify: `src/sim/spa.ts`:
  - `HouseProblem` near line 97;
  - `houseProblem` near line 1390;
  - the comment on `houses` at line 216.
- Modify: `src/sim/save.ts`:
  - `SAVE_VERSION`, plus a new `BRANCH_HOUSES_SAVE_VERSION = 34` beside `WIDE_SAVE_VERSION`;
  - `parseShop` near line 268 and line 346;
  - `parseVersioned`'s list of known versions;
  - the comment on `houses` at line 120.
- Test:
  - `tests/sim/spa-houses.test.ts`;
  - `tests/sim/save.test.ts`: the `'is version 33'` case near line 124 and the `'never gives a branch a house'` case near line 188;
  - `tests/sim/chain.test.ts`.

**Interfaces:**
- Produces: `export type HouseProblem = 'max' | 'day' | 'money'`. The `'branch'` value is gone.
- Produces: `export const BRANCH_HOUSES_SAVE_VERSION = 34` in `save.ts`.

- [ ] **Step 1: Write the failing tests.**

  In `tests/sim/spa-houses.test.ts`, replace `'never sells to a branch'` with these cases. Each uses `main = day10()` and `branch = SpaSim.newBranch('beach', main, createRng(9))`, with `branch.day = 12`:
  - `'buys a branch house from the shared purse and leaves the main shop alone'`:
    - `branch.houseForSale('right')` is true and `branch.shownHouses()` is `{ left: 1, right: 1 }`.
    - `branch.buyHouse('right')` is null. `main.money` drops by 3_000_000.
    - `branch.houses` is `{ left: 0, right: 1 }` and `main.houses` is `{ left: 0, right: 0 }`.
    - The branch's drained events contain `{ type: 'houseBought', house: { side: 'right', n: 1 } }`.
  - `'lets a branch stand beds in its houses and walk to them'`:
    - After `branch.buyHouse('left')`, `branch.buy('bed', 9, 2, false)` is null, and a bench bought on a free tile of the same house (cols 6–11) is null too.
    - `findPath(branch.grid, branch.grid.door, t => tileEq(t, { x: 9, y: 3 }))` is not null.
  - `'caps a branch at 7 technicians with all four houses'`:
    - Buy all four, so money must be at least 18_000_000.
    - `hireStaff` 7 technicians on the branch, and the eighth throws `'full'`.
  - `'runs a branch with a house to the end of the day'`:
    - With `autoSpawn` on, through `SpaSim.newBranch('oldTown', starShop(4, 30_000_000, 3, true), createRng(4))` with day ≥ 10, buy R1 and L1.
    - `advanceUntil(branch, () => branch.dayOver, 400_000)` does not throw.

  In `tests/sim/save.test.ts`:
  - Change `expect(SAVE_VERSION).toBe(33)` to `toBe(34)`.
  - Replace `'never gives a branch a house'` with two cases, both starting from `structuredClone(parseSave(structuredClone(v32)))` (the fixture already used there):
    - `'keeps a branch's houses from version 34'`: set `raw.chain.branches[0].houses = { left: 1, right: 1 }` and `raw.chain.branches[0].v = 34`. `parseSave(raw).chain!.branches[0].houses` is `{ left: 1, right: 1 }`.
    - `'gives a branch saved before version 34 no house'`: set the same houses with `v = 33`. The result is `{ left: 0, right: 0 }`.

  In `tests/sim/chain.test.ts`, add `'lets the chain move a fifth technician into a branch with a house'`. Use a chain built the way the file's other cases build one: `starShop`, `new Chain(main, …)`, `chain.open('beach')`.
  - The branch has 3 technicians and the main shop has a spare one. `chain.moveProblem(null, spareId, 'beach')` is `'full'`.
  - After `chain.shop('beach')!.day = 12` and `chain.shop('beach')!.buyHouse('right')`, the same call is null.

- [ ] **Step 2: Run them and confirm they fail.**

  Run: `npx vitest run tests/sim/spa-houses.test.ts tests/sim/save.test.ts tests/sim/chain.test.ts`

  Expected: FAIL. The branch's `buyHouse` returns `'branch'`, the version is 33, and the branch's houses come back as zero.

- [ ] **Step 3: Implement.**
  - `houseProblem` drops its first line.
  - `parseShop` reads `oldBranchHouses = raw.v < BRANCH_HOUSES_SAVE_VERSION` before `parseVersioned`, the way it reads `narrow`.
  - Line 346 becomes: `isPlaceId(data.place) && oldBranchHouses ? { left: 0, right: 0 } : repairHouses(data.houses)`.
  - `parseVersioned` accepts 33 as an older version.
  - Update the two "a branch never has any" comments.

- [ ] **Step 4: Run the whole suite and the type check.**

  Run: `npx vitest run` and `npx tsc --noEmit`

  Expected: all pass. If a test elsewhere pins version 33 or a branch's `'branch'` problem, update it to the new rule, and record a ruling for each one.

- [ ] **Step 5: Commit.** Message: "Let each branch buy its own four neighbour houses from the shared purse, and save in version 34 so a build from before refuses a branch with houses instead of dropping them"

### Task 2: Branch house art

**Files:**
- Create: `src/art/branchHouses.ts`
- Modify:
  - `src/art/houses.ts`: export `Roof` and `saleTexture(roof)`, taken out of the private `sale(look)`. Add the `'flat'` roof.
  - `src/art/beach.ts`, `src/art/oldTown.ts`, `src/art/uptown.ts`: export the floor pattern constants (`BEACH_TILES`, `SAND_PLANKS`, `PHO_PLANKS`, `PHO_TILES`, `CAO_PLANKS`, `MARBLE`). Turn `MARBLE` into `marble(seam: string)`, so the gold seam can take a trim colour, with `MARBLE = marble(C.caoGoldLight)` kept.
  - `src/art/palette.ts`: add the 11 new colours from the Global Constraints table (L2 at the beach reuses `C.sea`), each with a `…Dark` tone of the implementer's choosing. Add `roofConcrete` and `roofConcreteLine`.
  - `src/scenes/BootScene.ts`: add `...branchHouseTextures(parseLayout(BRANCH_ROOM))`.
- Test: `tests/art/branchHouses.test.ts` (new). The existing `tests/art/houses.test.ts`, `room.test.ts` and `beach.test.ts` stay green and unchanged.

**Interfaces:**
- Consumes `HouseKey` from `art/houses.ts` and `PlaceId` from `sim/places.ts`.
- Produces, in `art/houses.ts`:
  - `export type Roof = 'tin' | 'tiles' | 'flat'`
  - `export function saleTexture(roof: Roof): string`, which returns a 6 × (FLOOR_ROWS + STREET_TILES) SVG.
  - `HOUSE_LOOK[k].roof` keeps its type `'tin' | 'tiles'`.
- Produces, in `art/branchHouses.ts`:
  - `export const BRANCH_HOUSE_LOOK: Record<PlaceId, { roof: Roof; colors: Record<HouseKey, string> }>`, holding the table's values.
  - `export function branchHouseTextures(grid: Grid): Record<string, string>`. Its keys are `house-<place>-<key>` (12) and `sale-<place>` (3).

**Drawing:**
- Each branch house is the main shop's floor-1 house frame:
  - 6.5 × 20 tiles, drawn for a right-hand house;
  - floor from local x 0 to 6.0, outer wall strip at 6.0–6.2;
  - glass across the front with `glassPane`, then `street`.
- The floor is split like the branch room: the back pattern from row 2 to `grid.decor.screen[0].y + 0.5`, the front pattern from there to the front. Each pattern starts half a tile in (`x="0.5"`) so it sits on the grid.
- **oldTown:**
  - back wall in the house colour, with `phoWood` beams top and bottom and a post at the outer end;
  - one wall piece, for example a shuttered window or a single `silkLantern`.
- **beach:**
  - a `C.cream` wall with the board band in the house colour where the room's `seaWash` band is;
  - one shell or life ring.
- **uptown:**
  - a `C.caoWall` panelled wall, with its trim lines in the house colour;
  - the front marble from `marble(colour)`;
  - one small framed picture.
- **The flat roof** (`saleTexture('flat')`):
  - `roofConcrete` slabs with `roofConcreteLine` joints;
  - a raised parapet edge;
  - a small water tank, using `C.tank` and `C.tankRib`;
  - the same roller shutter and street as the other roofs.

- [ ] **Step 1: Write the failing tests** in `tests/art/branchHouses.test.ts`, with `vi.mock('phaser', () => ({}))`:
  - `'draws a house per place and side, and a roof per place'`: the sorted keys equal the 15 names, and each value is a well-formed `<svg … </svg>`.
  - `'sizes branch houses like the main shop's'`: `house-*` has viewBox `0 0 6.5 20`, and `sale-*` has `0 0 6 20`.
  - `'paints each branch house in its own colour on its place's floor'`, for every place and key:
    - the texture contains `BRANCH_HOUSE_LOOK[place].colors[key]`;
    - an oldTown house contains `C.phoTile`, a beach house contains `C.beachPlank`, and an uptown house contains `C.marble`;
    - none contains `C.tileSeam`, the main shop's gạch bông seam.
  - `'roofs the old town in tiles, the beach in tin and uptown flat'`:
    - `sale-oldTown` contains `C.lanternDark`;
    - `sale-beach` contains `C.tinRib`;
    - `sale-uptown` contains `C.roofConcrete`.
  - `'keeps the uptown room's gold marble'`: `MARBLE === marble(C.caoGoldLight)`.

- [ ] **Step 2: Run and confirm they fail.**

  Run: `npx vitest run tests/art/branchHouses.test.ts`

  Expected: FAIL, because the module is missing.

- [ ] **Step 3: Implement** the art and the palette entries, and wire `BootScene`.

- [ ] **Step 4: Run the art tests and the type check.**

  Run: `npx vitest run tests/art` and `npx tsc --noEmit`

  Expected: PASS.

- [ ] **Step 5: Look at the art.**
  - Dump every texture to an HTML page, with each one in its own `<img src="data:image/svg+xml;base64,…">`. Separate images keep the pattern ids from clashing.
  - Screenshot the page with gstack `$B`, and check that each place reads as its own and each house as distinct.

- [ ] **Step 6: Commit.** Message: "Draw each branch's four neighbour houses on its own floors with a wall or trim colour per house, and a tile, tin or new flat roof while they are for sale"

### Task 3: Branch houses on the map and the strip

**Files:**
- Modify:
  - `src/view/houses.ts`: add the helpers, and give `stripLots` a place;
  - `src/view/RoomView.ts`: `setHouses`, `saleParts` and `setFloor`, so they use the helpers with `this.place`;
  - `src/scenes/SpaScene.ts`: `updateStrip` passes `sim.place` to `stripLots`.
- Test: `tests/view/houses.test.ts`

**Interfaces:**
- Consumes `BRANCH_HOUSE_LOOK` from Task 2.
- Produces, in `view/houses.ts`:
  - `houseTextureKey(place: PlaceId | null, h: House, floor: number): string`. This is `house-<place>-<key>` at a branch, or `house-<key>-<floor>` at the main shop.
  - `saleTextureKey(place: PlaceId | null, h: House): string`. This is `sale-<place>` at a branch, or `sale-<key>` at the main shop.
  - `houseColor(place: PlaceId | null, h: House): string`. This is `BRANCH_HOUSE_LOOK[place].colors[key]` at a branch, or `HOUSE_LOOK[key].wall` at the main shop.
  - `stripLots(bought: Houses, shown: Houses, place: PlaceId | null = null): StripLot[]`. The fill comes from `houseColor`.

- [ ] **Step 1: Write the failing tests** in `tests/view/houses.test.ts`:
  - `'names each house's texture by its place'`:
    - `houseTextureKey(null, {side:'right',n:1}, 2) === 'house-right1-2'`;
    - `houseTextureKey('beach', {side:'left',n:2}, 1) === 'house-beach-left2'`;
    - `saleTextureKey(null, {side:'left',n:1}) === 'sale-left1'`;
    - `saleTextureKey('uptown', {side:'left',n:1}) === 'sale-uptown'`.
  - `'colours a branch's lots in its own houses' colours'`:
    - `stripLots({0,1}, {1,2}, 'oldTown')` gives R1 the fill `BRANCH_HOUSE_LOOK.oldTown.colors.right1`, and gives L1 and R2 the fill null;
    - `stripLots({0,1}, {1,2})` still gives R1 the fill `HOUSE_LOOK.right1.wall`.

- [ ] **Step 2: Run and confirm they fail.**

  Run: `npx vitest run tests/view/houses.test.ts`

  Expected: FAIL, because the helpers are not exported.

- [ ] **Step 3: Implement** the helpers. Then switch the three places in `RoomView` and the one in `SpaScene` to use them.

- [ ] **Step 4: Run the whole suite, the type check and a build.**

  Run: `npx vitest run`, `npx tsc --noEmit` and `npx vite build`

  Expected: all pass.

- [ ] **Step 5: Commit.** Message: "Show each branch's own houses, roofs and strip colours, picked by its place"

### Task 4: Browser checks, review, ship

- [ ] **Step 1: Build the dev bundle and serve it.**
  - Build into `D:/Project/spa-indie-game/.superpowers/dist-mo-rong`, then serve it with `vite preview` in the background.
  - Drive it with gstack `$B` at 390×780. Tap through synthesized mouse events on the canvas: `mousedown`, `mousemove` and `mouseup` on the canvas only, with no extra `mouseup` on `window`, or one tap counts twice.

- [ ] **Step 2: Set up a chain.**
  - Day 40, stars 5 and plenty of money. Set `profileDone` and the hints.
  - Open all three branches with `__spa.chain.open(place)`.
  - Save and reload.

- [ ] **Step 3: Check, with a screenshot each:**
  1. At each branch, the two roofs show in that place's style, with signs, and the strip shows the dashed lots.
  2. A roof tap at a branch opens the card. Buying lifts the roof, and the house appears in the place's style. The camera slides to it, and the purse drops in the top bar.
  3. At a branch, a bed moved into the new house gets a customer there.
  4. Buy all four at one branch and zoom out to see the whole row.
  5. Switch to the main shop, then to another branch, then back. Each shop shows only its own houses.
  6. Reload: the branch's houses come back.
  7. During a power cut at a branch, the dark covers its houses.

- [ ] **Step 4: Run the final review.**
  - Run `review-package` against the merge base, and give a fresh reviewer on the most capable model the plan, the spec and this Review Focus.
  - Run one fix pass. Each fix gets a test or browser check that fails first, then the whole suite.

- [ ] **Step 5: Ship.**
  1. Fetch and check origin/master. If it moved, integrate in a temporary worktree.
  2. Run the whole suite again, then fast-forward master and push.
  3. Update the memory file `chi-nhanh-mua-nha.md` and its line in `MEMORY.md`.
  4. Report to Chồng yêu.
