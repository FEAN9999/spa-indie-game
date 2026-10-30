# Mở rộng đất, lô B (mua nhà) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From day 10 the main shop can buy the four neighbour houses, near before far on each side. Each house opens 6 columns on all three floors with its own walls and gạch bông, and adds one technician slot.

**Architecture:**
- The sim already has `houses`, `withHouses` and a private `rebuildShell` (lô A). Lô B adds the rules for buying.
- The view keeps the old 13-column room image. It lays one image per bought house over it, from the middle of the old wall column out to the house's outer wall, and one roof image with a sign per house for sale.
- The camera bounds cover bought houses plus the houses for sale.

**Tech Stack:** Phaser 4.2.1, TypeScript, Vite 8, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-30-mo-rong-dat-design.md`. Lô B is §4.2, §4.3, §4.6 (strip lots), §4.9, §7 lô B, §9 lô B and §10.

## Global Constraints

- The save stays at v33. Lô B adds no save field; `houses` is already saved. Adding the hint id `buyHouse` to `HINT_IDS` is the only change that reaches the save.
- Prices: `HOUSE_PRICE = [3_000_000, 6_000_000]`. The house next to the shop costs 3.000.000 đ and the far one 6.000.000 đ, on either side.
- `UNLOCK_DAY.houses = 10`.
- Technician cap: 3 + 2 × (floors − 1) + houses bought, so at most 11. The receptionist cap does not change.
- A branch never has houses and never offers any for sale.
- House colours:

  | House | Wall | Gạch bông (base, corners, flower) | Roof while for sale |
  |---|---|---|---|
  | R1 | `#F2C4C0` | `C.tile`, `C.teal`, `C.lotus` | tôn |
  | L1 | `#BFD9E6` | `C.cream`, `C.cobalt`, `C.terracotta` | ngói |
  | R2 | `#D9CBE8` | `C.cream`, `C.lotus`, `C.teal` | ngói |
  | L2 | `#CBE6C9` | `C.cream`, `C.wood`, `C.cobalt` | tôn |

- Buy card copy (verbatim):
  - Titles: "Mua nhà bên phải", "Mua nhà bên trái", "Mua thêm căn bên phải", "Mua thêm căn bên trái".
  - Lines: "Thêm 6 ô bề ngang cho cả ba tầng." / "Đục tường thông sang, giữ gạch bông và màu tường của nhà cũ." / "Thêm 1 chỗ kỹ thuật viên."
  - Buttons: "Mua · {money}" and "Để sau".
  - Short of money: "Còn thiếu {money}".
  - Sign: "BÁN NHÀ" / "CHÍNH CHỦ" and the price.
  - Hint, shown once: "Bấm Xây dựng để kê giường sang nhà mới".
- Buying uses the existing buy sound `thud`. The purchase animation takes about 0.7 s. No furniture is placed in a new house.
- Commit messages are one plain sentence, with no attribution lines. The files use CRLF: edit them with the Edit tool, not Python `str.replace`.

## Review Focus

1. **Buying while people are walking.** Buying mid-day while customers walk, staff work and the owner serves must not stop or teleport anyone. Walls only turn into floor. Test: Task 1 `keeps everyone where they are when a house is bought mid-walk`.
2. **Reloading after a purchase.** The houses, the open columns, the next house for sale and the camera bounds must all come back. Test: Task 1 `keeps the bought houses through a save`. Task 5 checks it in the browser.
3. **Power cuts and bench mats in a new house.** The power-cut dark must cover the bought columns, and a bench's mat in a house must not be cut off at the old shop's edge. Test: Task 3 `innerFloor` and `mapBounds(bought)` for the dark.
4. **Gestures over a roof.** A swipe or pinch across a roof for sale, or a tap there while a card is up or build mode is open, must not open the buy card. Only a plain tap on the map does. The tap goes through `onMapTap`, which already checks `mapFree()` and the slop. Task 5 checks it in the browser.
5. **Day 10 arriving.** The first morning of day 10 must widen the bounds before the day's jump home, and the strip must appear. Loading a day-10 save shows the same. Task 4 does this in `begin()` and `create()`. Task 5 checks it in the browser.

---

### Task 1: Rules for buying a house

**Files:**
- Modify: `src/config.ts` (`UNLOCK_DAY`, beside `FLOOR_PRICE`, beside `STAFF_PER_FLOOR`)
- Modify: `src/sim/layout.ts`, `src/sim/spa.ts` (beside `floorProblem`/`openFloor` and `FloorProblem`), `src/sim/types.ts` (`SimEvent`, `HINT_IDS`), `src/sim/crew.ts:95-104`, `src/sim/chain.ts:215`, `src/view/chain.ts:150`
- Test: `tests/sim/spa-houses.test.ts` (new), `tests/sim/floors.test.ts`

**Interfaces:**
- Produces, in `layout.ts`:
  - `type Side = 'left' | 'right'`
  - `interface House { side: Side; n: 1 | 2 }`
  - `housesBought(h: Houses): number`
- Produces, in `config.ts`: `HOUSE_PRICE: readonly [number, number]`, `STAFF_PER_HOUSE = 1`, `UNLOCK_DAY.houses = 10`.
- Produces, on `SpaSim`:
  - `houseForSale(side: Side): boolean`
  - `housePrice(side: Side): number` (the price of the next house on that side)
  - `houseProblem(side: Side): HouseProblem | null`
  - `buyHouse(side: Side): HouseProblem | null`
  - `shownHouses(): Houses` (bought houses plus one per side for sale)
- Produces, in `spa.ts`: `export type HouseProblem = 'branch' | 'max' | 'day' | 'money'`.
- Produces, as a `SimEvent`: `{ type: 'houseBought'; house: House }`.
- Produces, in `crew.ts`: `staffCap(role: StaffRole, floors: number, houses: number): number`. The `houses` argument is required, so every call site gets it.

- [ ] **Step 1: Write the failing tests.**

  In `tests/sim/spa-houses.test.ts`, use `newSim = () => new SpaSim({ rng: createRng(5), autoSpawn: false })`:
  - `'goes on sale on day 10, the near house first on each side'`:
    - On day 9: `houseForSale('right')` is false and `buyHouse('right')` is `'day'`.
    - On day 10: both sides are for sale, `housePrice('left') === 3_000_000`, and `shownHouses()` is `{ left: 1, right: 1 }` while `houses` is `{ left: 0, right: 0 }`.
  - `'buys all four, near then far, and says so'`:
    - Set day 10 and money 18_000_000.
    - `buyHouse('right')` is null. `houses` is `{0,1}`, money is 15_000_000, and the drained events contain `{ type: 'houseBought', house: { side: 'right', n: 1 } }` and `{ type: 'roomChanged' }`.
    - `housePrice('right')` is 6_000_000. Buy it, then `buyHouse('right')` is `'max'` and `houseForSale('right')` is false.
    - Do the same on the left. Money ends at 0, `houses` is `{2,2}`, and `shownHouses()` is `{2,2}`.
  - `'never sells the far house before the near one'`: on day 10 with 6_000_000, the first `buyHouse('left')` takes 3_000_000 and gives `houses.left === 1`. It is never 2.
  - `'refuses short of money and changes nothing'`: on day 10 with 2_999_999, the result is `'money'`, money and `houses` are unchanged, and no event is emitted.
  - `'never sells to a branch'`: on a `SpaSim.newBranch('beach', main, rng)` at day 12 with money, `houseProblem('right')` is `'branch'`, `houseForSale` is false and `shownHouses()` is `{0,0}`.
  - `'walks from the door through the old wall into the new house'`:
    - After buying R1: `findPath(sim.grid, sim.grid.door, t => tileEq(t, { x: 29, y: 3 }))` is not null and passes column 24.
    - After buying L1 and L2: a path reaches `{ x: 1, y: 3 }` through columns 12 and 6.
  - `'lets beds and benches stand in a bought house and reaches them'`:
    - After R1: `sim.buy('bed', 27, 3, false)` and `sim.buy('bench', 26, 13, false)` are both null.
    - Before buying, the same `buy` is a placement problem, not null.
  - `'opens the house upstairs when floor 2 opens'`:
    - Buy R1 on day 10, then `openFloor(2)`.
    - `isWalkable(sim.grid, { x: 27, y: 18 + 5 })` is true, and `{ x: 33, y: 18 + 5 }` is not.
  - `'keeps everyone where they are when a house is bought mid-walk'`:
    - Seat a customer with `seatAndWait`, and hire a technician with `hireStaff`. Advance so someone has a non-empty path.
    - Buy R1. Every customer's and staff member's `pos` and `path` are unchanged.
  - `'keeps the bought houses through a save'`:
    - Buy R1 and L1 on day 10, then round-trip `SpaSim.fromSave(sim.toSave(), …)`.
    - `houses` is `{1,1}`, `isWalkable(grid, {27, 3})` is true, and `shownHouses()` is `{2,2}`.
  - `'adds one technician per house, up to 11'`:
    - `staffCap('technician', 1, 1) === 4` and `staffCap('technician', 3, 4) === 11`.
    - `staffCap('receptionist', 3, 4) === 1`.
    - A shop with 3 technicians and R1 bought gets null from `hireProblem` for a technician candidate.

  In `tests/sim/floors.test.ts`: `housesBought({ left: 2, right: 1 }) === 3`.

- [ ] **Step 2: Run the tests and confirm they fail.**

  Run: `npx vitest run tests/sim/spa-houses.test.ts tests/sim/floors.test.ts`

  Expected: FAIL. `houseForSale`, `buyHouse` and `housesBought` are not defined.

- [ ] **Step 3: Implement.**
  - `houseProblem` checks in this order: `place !== null` gives `'branch'`, `houses[side] >= HOUSES_PER_SIDE` gives `'max'`, `day < UNLOCK_DAY.houses` gives `'day'`, and `money < housePrice(side)` gives `'money'`.
  - `buyHouse` takes the money and sets `this.houses = { ...this.houses, [side]: n }`. It then calls `rebuildShell()` and `changeRoom()` and emits `houseBought`, like `openFloor`.
  - `houseForSale(side)` is `houseProblem(side)` being null or `'money'`.
  - `staffCap` adds `houses * STAFF_PER_HOUSE` for technicians only. Each call site passes `housesBought(sim.houses)` (in `chain.ts`, `shop.houses`).
  - Add `'buyHouse'` to the end of `HINT_IDS`.

- [ ] **Step 4: Run the whole suite.**

  Run: `npx vitest run` and `npx tsc --noEmit`

  Expected: all pass, with no type errors. Any test that lists `HINT_IDS` exactly gets `'buyHouse'` added.

- [ ] **Step 5: Commit.** Message: "Sell the four neighbour houses from day 10, near before far, for 3 and 6 million, opening their columns on every floor and adding a technician each"

### Task 2: House art

**Files:**
- Create: `src/art/houses.ts`
- Modify:
  - `src/art/room.ts`: turn `GACH_BONG_TILE` into `gachBongTile(base, corner, flower)`. Pull the glass pane drawing out of `shopFront` into `glassPane(x0, x1, rows)`.
  - `src/art/floors.ts`: export `shutterWindow` and `pot`.
  - `src/art/palette.ts`: add four wall colours and their dark tones.
  - `src/scenes/BootScene.ts`: load `houseTextures()`.
- Test: `tests/art/houses.test.ts` (new). `tests/art/room.test.ts` and `tests/art/floors.test.ts` stay green and unchanged.

**Interfaces:**
- Consumes `Side` and `House` from Task 1.
- Produces `HOUSE_LOOK: Record<'left1' | 'left2' | 'right1' | 'right2', { wall: string; wallDark: string; tiles: [string, string, string]; roof: 'tin' | 'tiles' }>`.
- Produces `houseKey(h: House): string`, which returns `'right1'` and so on.
- Produces `houseTextures(): Record<string, string>`. Its keys are `house-<key>-<floor>` for floors 1 to 3 (12 textures) and `sale-<key>` (4 textures).
- Palette:
  - `houseRose` `#F2C4C0`, dark `#E3A9A4`
  - `houseSky` `#BFD9E6`, dark `#A3C3D4`
  - `houseLilac` `#D9CBE8`, dark `#C2B0D6`
  - `houseLeaf` `#CBE6C9`, dark `#ADD2AA`

The house art is drawn for a right-hand house. Local x = 0 is the middle of the old wall column, where the tile border sits. Left houses use the same textures flipped (Task 3).

- **Bought textures:** 6.5 × (FLOOR_ROWS + STREET_TILES) tiles. Every floor's surface runs from x 0 to 6.0, which is the middle of the outer wall column, just as the old shop's floor ends at the middle of its wall. The outer side wall strip sits at 6.0–6.2.
  - **Floor 1:**
    - back wall rows 0–2 in the house's wall colour, with its dark band;
    - the house's gạch bông from row 2 to the front;
    - a dark seam along x = 0, the tile border on the old wall line;
    - glass front panes across the whole width, with no door;
    - `street(6.5, rows)`.
  - **Floor 2:**
    - planks;
    - back wall in the house colour, with one `shutterWindow`;
    - front wall in the house's dark tone, with one glass door;
    - the balcony in the shop's gạch bông, the railing and the road, as in `floor2Room`.
  - **Rooftop:**
    - sky;
    - gạch tàu;
    - back parapet and outer parapet in the house colour, with the terracotta cap;
    - low front wall in the house colour;
    - tin over the street rows.
- **Sale textures:** 6 × 20 tiles, covering the house's own 6 columns.
  - Roof rows 0 to about 16.6. Ngói is terracotta rows with `C.lanternDark` lines. Tôn is `C.tin` with `C.tinRib` ribs.
  - A grey roller shutter with slats, using `C.silver` and `C.tankRib`, at the front up to row 18.
  - `street(6, rows)` below.
  - The sign is not in the texture; Task 3 draws it.

The finer drawing is the implementer's call (spec §11), within these parts and colours.

- [ ] **Step 1: Write the failing tests.**

  `tests/art/houses.test.ts` (with `vi.mock('phaser', () => ({}))`):
  - `'draws three floors for each house and a roof for each house for sale'`: the sorted keys equal the 16 names, and every value starts with `<svg` and ends with `</svg>`.
  - `'sizes a bought house half a column wider than its own six'`: the `house-*` viewBox is `0 0 6.5 ${FLOOR_ROWS + STREET_TILES}`, and the `sale-*` viewBox is `0 0 6 ${FLOOR_ROWS + STREET_TILES}`.
  - `'paints each house in its own wall and tiles'`:
    - For every key, `house-<key>-1` contains `HOUSE_LOOK[key].wall` and all three `tiles` colours.
    - `house-right1-1` does not contain `C.wall`, the old shop's yellow.
  - `'roofs R1 and L2 in tin, L1 and R2 in tiles'`: `sale-right1` contains `C.tinRib`, and `sale-left1` contains `C.lanternDark`.
  - `'keeps the old gạch bông'`: `GACH_BONG_TILE === gachBongTile(C.tile, C.terracotta, C.teal)`, and the existing room tests pass unchanged.

- [ ] **Step 2: Run the tests and confirm they fail.**

  Run: `npx vitest run tests/art/houses.test.ts`

  Expected: FAIL, because the module `src/art/houses` is missing.

- [ ] **Step 3: Implement** `houses.ts` and the helpers in `room.ts` and `floors.ts`, and add `...houseTextures()` to `BootScene`'s `loadSvgTextures` map.

- [ ] **Step 4: Run the art tests and the type check.**

  Run: `npx vitest run tests/art` and `npx tsc --noEmit`

  Expected: PASS.

- [ ] **Step 5: Commit.** Message: "Draw the four neighbour houses on every floor in their own walls and gạch bông, and their roofs and shutters while for sale"

### Task 3: Houses on the map and on the strip

**Files:**
- Create: `src/view/houses.ts` (pure, no Phaser)
- Modify: `src/view/RoomView.ts` (constructor, `showFloor`, `placeMat`, the `dark` rectangle), `src/view/PositionStrip.ts` (`StripModel`, `show`)
- Test: `tests/view/houses.test.ts` (new)

**Interfaces:**
- Consumes `Houses`, `House`, `Side` (Task 1), `houseKey` and `HOUSE_LOOK` (Task 2), and `mapBounds` and `Rect` (`camera.ts`).
- Produces, in `view/houses.ts`:
  - `houseRect(h: House): Rect`, the world rect of the house's own 6 columns, `{ y: MAP_Y, h: MAP_VIEW.h }`.
  - `houseImageX(h: House): number`, the left edge of the bought image: `rect.x − TILE/2` on the right, `rect.x` on the left.
  - `forSale(bought: Houses, shown: Houses): House[]`
  - `saleAt(bought: Houses, shown: Houses, worldX: number): House | null`
  - `innerFloor(h: Houses): { left: number; top: number; right: number; bottom: number }`, in tiles, right and bottom exclusive. It replaces the `FLOOR` const.
  - `stripLots(bought: Houses, shown: Houses): StripLot[]`, where `StripLot = { x: number; w: number; fill: string | null }`. `fill` is the wall colour of a bought house, or null for a house for sale.
- Produces, on `RoomView`: `setHouses(bought: Houses, shown: Houses, justBought: House | null = null): void`.
- Produces, on `StripModel`: `lots: StripLot[]`.

- [ ] **Step 1: Write the failing tests.**

  `tests/view/houses.test.ts`:
  - `'places each house on its own six columns'`:
    - `houseRect({side:'right',n:1})` is `{ x: 1047, y: 210, w: 468, h: 1560 }`.
    - `houseRect({side:'left',n:2}).x === -903`.
    - `houseImageX` for R1 is `1008` and for L1 is `-435`.
  - `'lists the houses for sale and finds one under a tap'`:
    - With `bought {0,1}` and `shown {1,2}`: `forSale` gives `[{left,1},{right,2}]`.
    - `saleAt` at the x of column 8 gives L1. At column 27 (bought) it gives null. At column 33 it gives R2. At column 18 (the old shop) it gives null.
  - `'widens the floor a bench mat may cover with every bought house'`:
    - `innerFloor({0,0})` is `{ left: 13, top: 2, right: 24, bottom: 17 }`.
    - `innerFloor({1,2})` is `{ left: 7, top: 2, right: 36, bottom: 17 }`.
  - `'shows bought houses in their wall colour and houses for sale as empty lots'`:
    - `stripLots({0,1}, {1,2})` gives three lots: R1 with `fill: HOUSE_LOOK.right1.wall`, and L1 and R2 with `fill: null`.
    - Each lot's `x` and `w` equal its `houseRect`.

- [ ] **Step 2: Run the tests and confirm they fail.**

  Run: `npx vitest run tests/view/houses.test.ts`

  Expected: FAIL, because the module is missing.

- [ ] **Step 3: Implement** `view/houses.ts`.

- [ ] **Step 4: Run the tests and confirm they pass.**

  Run: `npx vitest run tests/view/houses.test.ts`

  Expected: PASS.

- [ ] **Step 5: Change `RoomView`.**
  - `setHouses` keeps one image per bought house. It sits at `houseImageX`, `MAP_Y`, origin 0, depth `HOUSE_DEPTH = 0.5` (over the room at 0, under the parts at 1), with `flipX` on the left. Its texture is `house-<key>-<floor>`.
  - It keeps one `sale-<key>` image per house for sale at `houseRect`, flipped on the left, with a sign container at depth `HOUSE_DEPTH + 0.1`.
    - The sign is white with a `C.lantern` border, centred on the house at row 14.
    - It reads "BÁN NHÀ", "CHÍNH CHỦ" and `formatMoney(HOUSE_PRICE[n − 1])`.
  - It sets `dark` to `mapBounds(bought)`'s x and width.
  - `showFloor` swaps the bought images' textures, and the sale roofs show on every floor.
  - `placeMat` uses `innerFloor(this.houses)`.
  - With `justBought`, the old roof and sign fade and rise 60 px over 400 ms, then are destroyed. 8 `C.sand` circles of radius 14–22 rise 60 px and fade over 500 ms along the old wall column. The new image fades in from alpha 0 over 300 ms after 400 ms.

- [ ] **Step 6: Change `PositionStrip.show`.** After the cream bar and before the frame, draw each lot:
  - A filled lot is its wall colour, inset in the bar.
  - A null lot has a dashed `C.ink` outline and a small `C.lantern` square for the sign.

- [ ] **Step 7: Run the whole suite and the type check.**

  Run: `npx vitest run` and `npx tsc --noEmit`

  Expected: PASS. Callers of `StripModel` fail the type check until Task 4. If so, pass `lots: []` at the one call site in `SpaScene` in this task.

- [ ] **Step 8: Commit.** Message: "Lay the bought houses and the roofs for sale beside the old room on every floor, widen the power-cut dark and the bench mats with them, and show them on the strip"

### Task 4: The buy card and the purchase in the shop

**Files:**
- Modify: `src/scenes/SpaScene.ts`:
  - `create` around lines 300–322
  - `begin()` in `showRankCards`, around line 960
  - the strip model, around line 1043
  - `onMapTap`, around line 1838
  - a new `offerHouse` beside `offerFloor`
  - the events switch, beside `'floorOpened'`
- Modify: `src/strings/vi.ts`, beside the `floor*` strings
- Test: `tests/strings/strings.test.ts`, which gets a new case `'fills the buy card strings'`:
  - `t('houseBuy', { money: formatMoney(3_000_000) })` gives `'Mua · 3.000.000 đ'`.
  - `t('houseTitleLeft2')` gives `'Mua thêm căn bên trái'`.
  - `t('buyHouseHint')` matches the copy in Global Constraints.

  Write this case first, and watch it fail. The rest of the behaviour is checked in the browser in Task 5.

**Interfaces:**
- Consumes `houseProblem`, `buyHouse`, `housePrice`, `shownHouses` and `houseBought` (Task 1). Consumes `setHouses`, `houseRect`, `saleAt` and `stripLots` (Task 3).
- Produces these string keys:
  - `houseTitleRight1`, `houseTitleLeft1`, `houseTitleRight2`, `houseTitleLeft2`
  - `houseLine1`, `houseLine2`, `houseLine3`
  - `houseBuy` ("Mua · {money}")
  - `saleSign1`, `saleSign2`
  - `buyHouseHint`
- "Để sau" reuses `floorLater`, and "Còn thiếu" reuses `floorShort`.

- [ ] **Step 1: Add the strings and the private `syncHouses(justBought: House | null = null)`.** It calls `this.room.setHouses(sim.houses, sim.shownHouses(), justBought)` and `this.cam.setBounds(mapBounds(sim.shownHouses()))`. Call it:
  - in `create`, after the room and before `cam.jump`, constructing the camera with `mapBounds(sim.shownHouses())`;
  - in `begin()`, right after `this.chain.startDay()` and before the jump home.

- [ ] **Step 2: Pass the lots to the strip.** The strip model passes `lots: stripLots(sim.houses, sim.shownHouses())`.

- [ ] **Step 3: Send taps on a roof to the buy card.** In `onMapTap`, after the `over.length > 0` return and before the customer hit test, check `saleAt(sim.houses, sim.shownHouses(), w.x)`. When it finds a house, `slideTo` its rect's centre x, call `offerHouse(house.side)`, and return.

- [ ] **Step 4: Add `offerHouse(side)`.** It is `offerFloor`'s card:
  - the title from side and n;
  - the three lines;
  - "Để sau";
  - the buy button `houseBuy` at `housePrice(side)`, faded with `floorShort` under it when the problem is `'money'`.

  The buy handler closes the card. If `sim.buyHouse(side)` is null, it plays `thud` and saves; the event does the rest.

- [ ] **Step 5: Handle `case 'houseBought'`.**
  1. Call `syncHouses(e.house)`, which sets the bounds before the slide.
  2. Slide to the centre of `houseRect(e.house)`.
  3. Call `syncRoom()`.
  4. If `!sim.hintDone('buyHouse')`, call `queueToast(t('buyHouseHint'))` and then `sim.markHint('buyHouse')`.

- [ ] **Step 6: Run the whole suite, the type check and a build.**

  Run: `npx vitest run`, `npx tsc --noEmit` and `npx vite build`

  Expected: all pass.

- [ ] **Step 7: Commit.** Message: "Open the buy card from a roof for sale, buy the house with the floor card's rules, play the roof lifting and the dust, slide to the new house and hint at building there once"

### Task 5: Browser checks, review, ship

**Files:** none, apart from fixes the checks or the review call for.

- [ ] **Step 1: Build and serve the dev bundle.**
  - Build: `NODE_ENV=development npx vite build --mode development --outDir D:/Project/spa-indie-game/.superpowers/dist-mo-rong`
  - Serve it in the background with `npx vite preview --outDir … --port N --strictPort`.
  - Drive it with gstack `$B` in an iPhone-sized viewport, using `window.__spa` to set the day and money.

- [ ] **Step 2: Check each item, with a screenshot for each:**
  1. Day 9 shows no roofs and the map fits at zoom 1. Day 10, via the day-start path, shows both roofs, the signs with prices and the strip lots.
  2. A roof tap slides there and opens the card. Short of money, the button fades with "Còn thiếu …". A swipe across a roof does not open the card.
  3. Buy R1. The roof lifts, dust rises and the pink room appears. The camera slides to it, R2 goes on sale, and the hint toast shows once.
  4. In build mode, move a massage bed into R1. The owner leads a customer there and the camera follows.
  5. Buy all four, zoom fully out, and see the whole row.
  6. Open floor 2 after buying. Floor 2 and the rooftop show the houses wide.
  7. With a customer waiting off screen, the strip shows a red dot.
  8. Reload and see the same houses. Switch to a branch: it has no roofs. Switch back.
  9. During a power cut, the dark covers the houses.

- [ ] **Step 3: Run the final review.** Run `review-package` against the merge base. A fresh reviewer on the most capable model gets the plan, the spec and this Review Focus. Run one fix pass with RED to GREEN tests, then run the whole suite.

- [ ] **Step 4: Ship.**
  1. Fetch, check origin/master and the branch log, and rebase or merge in a temporary worktree if master moved.
  2. Run the whole suite again.
  3. Merge into master and push.
  4. Update the memory file `mo-rong-dat-plan.md`.
  5. Report to Chồng yêu with the §12 iPhone list.
