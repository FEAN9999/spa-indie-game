# Nhà hàng lô C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The restaurant grows like the spa. It gets four side houses (the near one before the far one on each side), a second floor, and a rooftop open-air eatery with umbrellas and lanterns. Diners, cooks and the owner use the stairs.

**Architecture:**
- `RestaurantSim` stops hard-coding one floor and no houses. It gains the spa's purchase API (`houseProblem`/`buyHouse`, `floorProblem`/`openFloor`) over its own 37-column tower shell, which already has stairs.
- Paths already cross floors once the grid has links, because `findPath` and `moveAlong` are shared with the spa.
- The view side stops tying everything to floor 1:
  - `RestaurantLayer` draws the viewed floor with a floor offset, like `RoomView`.
  - The street draws the restaurant's houses with their sale signs.
  - The floor buttons over the restaurant come from the restaurant.
- Save goes up one version so an older game refuses a grown restaurant instead of dropping it.

**Tech Stack:** Phaser 4.2.1, TypeScript, Vite 8, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-nha-hang-design.md`. Read §4.3 (expansion), §4.8 (inside the restaurant, stairs), §4.8b (the shop under the centre), §4.9 (cook cap), §7 Lô C, §9 Lô C and §10 (numbers, already updated: houses 4.5tr/9tr, floor 2 3tr, rooftop 6tr).

## Global Constraints

- **No change to the spa, the branches or a restaurant that has not grown.**
  - A v38 save opens as before: restaurant with 1 floor and no houses, spa as it was.
  - `tests/sim/same-draws.test.ts` passes unchanged.
  - The restaurant's draws stay on its own stream (`seed + 101`). Buying a house or a floor draws nothing.
- **Prices (§10):**
  - restaurant houses use the spa's `HOUSE_PRICE` (4.500.000 near, 9.000.000 far);
  - restaurant floors use the spa's `FLOOR_PRICE` (2: 3.000.000, 3: 6.000.000);
  - the umbrella table is `RESTAURANT_FURNITURE.umbrellaTable = 300_000` (em đề xuất: a dining table 225k plus the umbrella).
  - Houses and floors are on sale as soon as the restaurant is owned. The restaurant only exists from day 10, so there is no separate day rule.
- **Order:** the near house on a side before the far one, either side first. Floor 2 before the rooftop (floor 3). A floor cannot open while the door cannot reach the foot of the stairs below (`'blocked'`).
- **Cook cap:** `chefCap(floors, housesBought(houses))` is unchanged. It now grows: 2 + 2 per extra floor + 1 per house, max 10.
- **Rooftop (em đề xuất):**
  - Opening the rooftop sets out one umbrella table with four dining chairs for free, the way buying the restaurant sets out its first tables.
  - The umbrella table stands on the rooftop only. Dining tables, chairs, stoves and decor go on any open floor.
  - Lanterns are strung over the rooftop in its art and glow at night.
- **Seating:** a diner takes a free seat on the lowest floor first. Upstairs seats fill only when floor 1 is full.
- **Save:**
  - add `RESTAURANT_C_SAVE_VERSION` in `src/sim/save.ts`, with `SAVE_VERSION = RESTAURANT_C_SAVE_VERSION`;
  - its value is **origin/master's SAVE_VERSION + 1 at merge time**, which is 39 while master is at 38;
  - tests name the constant, never the number, except the one `'is version …'` case.
- **Copy (Vietnamese, exact).** New keys in `src/strings/vi.ts`:
  - Restaurant house card:
    - kicker reuses `restaurantKicker` "Nhà hàng";
    - the title reuses `houseTitleRight1` / `houseTitleLeft1` / `houseTitleRight2` / `houseTitleLeft2`;
    - lines are `houseLine1` "Thêm 6 ô bề ngang cho cả ba tầng." (reused), `restHouseLine2` "Đục tường thông sang, lát gạch như nhà hàng." and `restHouseLine3` "Thêm 1 chỗ đầu bếp.";
    - buttons reuse `houseBuy` "Mua · {money}" and `floorLater` "Để sau";
    - the short line reuses `floorShort`.
  - Restaurant floor card:
    - kicker `restaurantKicker`;
    - title reuses `floorName2` "Tầng 2" / `floorName3` "Sân thượng";
    - lines for floor 2: `restFloorLine2a` "Thêm phòng ăn sàn gỗ, treo đèn lồng." and `restFloorLine2b` "Thêm chỗ kê bàn ghế, thêm 2 đầu bếp.";
    - lines for the rooftop: `restFloorLine3a` "Quán ăn ngoài trời, dù che, dây đèn lồng." and `restFloorLine3b` "Có sẵn một bàn dù bốn ghế, thêm 2 đầu bếp.";
    - buttons reuse `floorOpen` "Mở · {money}" and `floorLater`;
    - notes reuse `floorOrder`, `floorBlocked` and `floorShort`.
  - Item `itemUmbrellaTable` "Bàn dù". Build problem `problemRoofOnly` "Bàn dù chỉ kê trên sân thượng".
  - **Remove** `restaurantNoFloors`.
- **Files are CRLF** (`core.autocrlf=true`). Edit with the Edit tool, or with Python using `newline=''` and `encoding='utf-8'`.
- **Commits:** one plain descriptive sentence each, present tense, with no prefix and no attribution lines.

## Review Focus

1. **Buying while people walk:** a house bought or a floor opened while a diner walks to a chair, or a cook to a stove, still gets them there (`changeRoom` re-routes). Test in Task 1.
2. **Serving upstairs:** a diner seated on floor 2 is served by the owner climbing the stairs, pays exactly once, and leaves down the stairs. Test in Task 2.
3. **Closing time with diners upstairs:** at the end of the day a diner on the rooftop walks down and out, and the day closes without anyone stuck. Test in Task 2.
4. **A grown save in the old game, an old save in the new one:**
   - a v38 save reads with 1 floor and no houses;
   - a v39 save keeps its upstairs and house furniture, upstairs diners and cooks, and a climb in progress;
   - a save with an item that breaks the grown room's rules drops only that item.
   - Test in Task 3.
5. **The street's other floor:**
   - viewing floor 2 or 3 over the restaurant while the spa has not opened that floor shows the spa block closed;
   - the floor buttons still let the player come back to floor 1 over the spa.
   - Browser check (Task 7) plus the pills test in Task 7.

---

### Task 1: The restaurant buys houses and opens floors

**Files:**
- Modify: `src/sim/restaurant.ts`, `src/sim/dining.ts` (`diningShellGrid(houses)`)
- Test: `tests/sim/restaurant-c.test.ts` (new)

**Interfaces:**
- Consumes:
  - `withHouses`, `widen`, `housesBought`, `NO_HOUSES`, `House`, `Houses` from `src/sim/layout.ts`;
  - `towerOf`, `floorOf` from `src/sim/floors.ts`;
  - `HOUSE_PRICE`, `FLOOR_PRICE`, `HOUSES_PER_SIDE` from config;
  - the spa's `houseProblem`/`buyHouse`/`shownHouses`/`floorProblem`/`openFloor`/`maxFloors` in `src/sim/spa.ts` (around lines 1396–1460) as the model.
- Produces:
  - `diningShellGrid(houses: Houses = NO_HOUSES): Grid`;
  - `RestaurantSim.floors: number`, `RestaurantSim.houses: Houses` (no longer readonly);
  - `housePrice(side: 'left' | 'right'): number`;
  - `houseProblem(side): 'max' | 'money' | null`;
  - `houseForSale(side): House | null`;
  - `buyHouse(side): 'max' | 'money' | null`. On success it takes the money, sets `houses`, rebuilds the shell, calls `changeRoom()` and emits `{ type: 'houseBought'; house: House }`.
  - `shownHouses(): Houses`: bought plus the next one per side, at most `HOUSES_PER_SIDE`;
  - `maxFloors(): number`: `max(1, grid.feet.length)`;
  - `floorProblem(floor: number): 'max' | 'order' | 'blocked' | 'money' | null`;
  - `openFloor(floor: number): 'max' | 'order' | 'blocked' | 'money' | null`. On success it takes the money, sets `floors`, calls `changeRoom()` and emits `{ type: 'floorOpened'; floor: number }`.
  - The two new `RestaurantEvent` members.
  - `freeSeats()` is sorted by `floorOf(tile.y)`, lowest first, keeping today's order within a floor.
  - `fromSave` reads `d.houses` and `d.floors` before building the grid.

- [ ] **Step 1: Write the failing tests** in `tests/sim/restaurant-c.test.ts`. Build a chain with an owned restaurant the way `tests/sim/restaurant-b.test.ts` does, with plenty of money.
  - `'buys the near house before the far one on each side, at the spa's house prices'`:
    - `houseProblem('right')` is null and `housePrice('right')` is `HOUSE_PRICE[0]`;
    - after `buyHouse('right')` the purse drops by `HOUSE_PRICE[0]`, `houses.right` is 1 and `housePrice('right')` is `HOUSE_PRICE[1]`;
    - after a second `buyHouse('right')`, a third returns `'max'`;
    - `shownHouses()` is `{ left: 1, right: 2 }` after the two right buys;
    - one `houseBought` event is drained per buy.
  - `'refuses a house it cannot pay for and keeps the money'`: with the purse at `HOUSE_PRICE[0] - 1`, `buyHouse('left')` returns `'money'` and nothing changes.
  - `'opens a bought house's tiles on every floor'`: after `buyHouse('left')`, a tile in the near-left house on floor 1 (restaurant col 7, row 10) and the same tile on floor 2 (row 10 + `FLOOR_ROWS`) are floor cells of `shellGrid()`.
  - `'opens floor 2 before the rooftop, at the spa's floor prices'`:
    - `floorProblem(3)` is `'order'` and `floorProblem(2)` is null;
    - `openFloor(2)` costs `FLOOR_PRICE[2]`, `floors` becomes 2 and `grid.links` is non-empty;
    - `openFloor(3)` costs `FLOOR_PRICE[3]`;
    - `floorProblem(4)` is `'max'`;
    - one `floorOpened` event per floor.
  - `'will not open a floor whose stairs the door cannot reach'`: wall off the stairs foot on floor 1 with items, using `place`. If `canPlace` refuses every way to wall it off, build the items list directly and call `changeRoom`. Then `floorProblem(2)` is `'blocked'`.
  - `'grows the cook cap with floors and houses'`: `chefCap()` is 2, then 4 after floor 2, then 6 after the rooftop, then 10 after all four houses.
  - `'seats diners on floor 1 before upstairs'`: open floor 2 and place a dining table with a chair on floor 2. `freeSeats()[0]` is on floor 1 while any floor-1 seat is free. With every floor-1 chair taken by diners, the next diner's chair is on floor 2.
  - `'a diner walking to a chair still gets there when a house is bought'` (Review Focus 1): spawn a diner, step until they are `toChair` with a non-empty path, `buyHouse('right')`, then step until they are seated. They reach `ordering` (or the state that follows sitting) within 30 s of sim time.
  - `'a grown restaurant comes back from its save'`: buy a house and open floor 2, then `RestaurantSim.fromSave(r.toSave(), …)` (as the existing save round-trip tests call it). It has the same `houses`, `floors` and `grid.links.length`.
- [ ] **Step 2: Run** `npx vitest run tests/sim/restaurant-c.test.ts`. Expected: FAIL (`buyHouse` is not a function).
- [ ] **Step 3: Implement** the Interfaces above in `src/sim/restaurant.ts` and `src/sim/dining.ts`.
  - The cached `shell` must be rebuilt whenever `houses` changes.
  - `floorProblem`'s `'blocked'` uses `doorReach(grid, door)` on the floor below's foot, exactly as the spa does.
- [ ] **Step 4: Run** `npx vitest run tests/sim` and then `npm test`. Expected: PASS, with `same-draws` untouched.
- [ ] **Step 5: Commit.** Message: "Let the restaurant buy its side houses near before far and open floor 2 then the rooftop at the spa's prices, seat diners on the lowest floor first and grow the cook cap with them".

### Task 2: The umbrella table, the rooftop's first table, and serving upstairs

**Files:**
- Modify: `src/sim/items.ts`, `src/config.ts` (`RESTAURANT_FURNITURE.umbrellaTable`), `src/sim/dining.ts`, `src/sim/build.ts`, `src/sim/restaurant.ts`, `src/strings/vi.ts`
- Test: `tests/sim/restaurant-c.test.ts`, `tests/sim/dining.test.ts`

**Interfaces:**
- Consumes: Task 1's `openFloor`, `floors`.
- Produces:
  - the `ItemKind` `'umbrellaTable'`: `{ w: 2, h: 1, price: RESTAURANT_FURNITURE.umbrellaTable, beauty: 1, group: 'dining', shop: 'restaurant', name: 'itemUmbrellaTable' }`;
  - `diningSeats` counts a chair beside an `umbrellaTable` tile as a seat;
  - `BuildProblem` gains `'roofOnly'` with `PROBLEM_TEXT.roofOnly = 'problemRoofOnly'`. `placeProblem` returns `'roofOnly'` for an `umbrellaTable` whose `floorOf(item.y) !== 3`, checked right after the `deskFloor` rule;
  - `ROOF_START: Omit<Item, 'id'>[]` in `src/sim/dining.ts`: `umbrellaTable` at (15, 44), with `diningChair`s at (15, 43), (16, 43), (15, 45) and (16, 45). Floor 3 is rows 36–53, so this sits on the rooftop's left half, clear of the stairs at x = 23;
  - `openFloor(3)` adds `ROOF_START` with new ids before `changeRoom()`. Any piece that would not pass `canPlace` is skipped, which keeps it safe if the rooftop ever holds something;
  - `lastDining` treats tables as one kind: selling the last table blocks when no other `diningTable` **or** `umbrellaTable` remains;
  - copy `itemUmbrellaTable` "Bàn dù" and `problemRoofOnly` "Bàn dù chỉ kê trên sân thượng".

- [ ] **Step 1: Write the failing tests.**
  - In `tests/sim/dining.test.ts`, `'counts a chair beside an umbrella table as a seat'`: items `[umbrellaTable at (15,44), diningChair at (15,43)]` give one seat at (15,43) facing `'down'`.
  - In `tests/sim/restaurant-c.test.ts`:
    - `'sets out an umbrella table with four chairs when the rooftop opens'`: after `openFloor(2)` and `openFloor(3)` the items hold one `umbrellaTable` on floor 3 and four `diningChair`s at the `ROOF_START` tiles. `freeSeats()` has four seats on floor 3, and the purse dropped by exactly `FLOOR_PRICE[3]` for the rooftop.
    - `'keeps the umbrella table on the rooftop'`: `canPlace('umbrellaTable', 15, 10, false)` (floor 1) is `'roofOnly'`, and on the rooftop at an open spot it is null. A `diningTable` on the rooftop is allowed.
    - `'will not sell the last table while an umbrella table stands'`: the opposite case. With only an umbrella table left, selling it is `'lastDining'`. With a dining table and an umbrella table, selling either one is allowed.
    - `'serves a diner seated upstairs: the owner climbs, cooks, carries, and the diner pays once'` (Review Focus 2):
      - open floor 2 and move every floor-1 chair off, or fill them with seated diners, so the next diner sits on floor 2;
      - drive the owner through the tap, cook and carry steps, completing the cook as the existing Phở serve tests do;
      - exactly one `dinerPaid` event for that diner;
      - the owner's path crossed the stairs: her `pos.y` was on floor 2 at some step;
      - the diner then leaves through the door.
    - `'at closing a diner on the rooftop walks down and the day closes'` (Review Focus 3): seat a diner on the rooftop who has eaten, or let them leave through `keepOpen` ending, then run the chain to `dayOver`. No diner remains, and `closeDay` ran once (wages charged once).
- [ ] **Step 2: Run** the two files. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: "Add the rooftop's umbrella table, set one out with four chairs when the rooftop opens, keep it on the rooftop, and serve diners upstairs through the stairs".

### Task 3: Save a grown restaurant

**Files:**
- Modify: `src/sim/save.ts`
- Create: `tests/fixtures/save-v39.json`
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Consumes: Task 1's `diningShellGrid(houses)`, `RestaurantSim.fromSave` reading `houses` and `floors`.
- Produces:
  - `RESTAURANT_C_SAVE_VERSION = 39`, with `SAVE_VERSION = RESTAURANT_C_SAVE_VERSION`. `parseVersioned` accepts 37, 38 and 39.
  - `repairRestaurant` builds the shell from the repaired `houses`. It validates items with `placementProblem('restaurant', shell, …, { door, floors })` using the repaired `floors`, not 1.
  - Diners, chefs and the owner keep a valid `climbMs` through the spa's `climb()` helper (save.ts around line 505).
  - The `RestaurantSave` doc comment on `houses`/`floors` says what they are now.

- [ ] **Step 1: Write the failing tests** in `tests/sim/save.test.ts`, next to the restaurant fixture tests (around lines 2436–2507):
  - Change the `'is version …'` case to expect 39, naming `RESTAURANT_C_SAVE_VERSION`.
  - `'reads a v38 restaurant with one floor and no houses'`: the `save-v38.json` fixture loads with `floors` 1 and `houses` `NO_HOUSES`, and the same item count as before.
  - `'round-trips a grown restaurant: houses, floors, upstairs furniture, an upstairs diner and a cook mid-climb'`:
    - build a chain, buy a right house, open floors 2 and 3;
    - place a dining table and chair in the house on floor 2, and keep the rooftop's `ROOF_START`;
    - seat a diner on floor 2 and give a cook `climbMs` 400 on the stairs;
    - serialise, then parse with the current reader;
    - every item is kept, the diner's chair is on floor 2, the cook's `climbMs` is 400, and `houses`/`floors` match.
  - `'drops only the item that breaks the grown room'`: a v39 restaurant with floors 2 and one dining table placed on floor 3 (not open) loads without that table and with everything else.
  - `'reads the v39 fixture'`: `tests/fixtures/save-v39.json` loads with its houses, floors 3 and the `ROOF_START` umbrella table. Generate the fixture from the round-trip test's chain with a one-off script, then commit it pretty-printed like `save-v38.json`.
- [ ] **Step 2: Run** `npx vitest run tests/sim/save.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: "Save the restaurant's houses and floors in a new version, keeping upstairs furniture, diners and cooks on the stairs, and read an older save with one floor and no houses".

### Task 4: Art for the restaurant's upper floors, rooftop, houses, umbrella table and the spa's closed upper floor

**Files:**
- Modify: `src/art/restaurant.ts`, `src/scenes/BootScene.ts` only if a new texture function needs registering, and the dining furniture art file that draws `diningTable` (find it with `grep -rn "diningTable" src/art`)
- Test: `tests/art/restaurant.test.ts`, and the furniture art test that lists dining textures

**Interfaces:**
- Produces these textures, in the style of `rest-room` and the spa's `art/floors.ts` / `art/houses.ts`, all SVG through the existing helpers:
  - **`rest-room-2`:** 13 × 18 tiles like `rest-room`. An indoor dining room, wooden floor, cream walls, two paper lanterns on the back wall, a window row, and the stairs gap at x 11, rows 7–9, left clear for the shared `stairs` image.
  - **`rest-room-3`:** 13 × 18. The rooftop, with a gạch tàu (terracotta) floor, a low parapet on three sides, potted plants in the corners, and two strings of red/yellow lanterns crossing overhead on rows 3–4. Export `ROOF_LANTERNS: { x: number; y: number }[]`, the lantern centres in tile units within the 13-column block, for the night glow.
  - **`rest-house-<left1|left2|right1|right2>-<1|2|3>`:** a restaurant house per side, slot and floor, 6 × 18.
    - The ground floor is a shopfront with a striped awning (terracotta/cream) and the restaurant's terrazzo floor. Floor 2 has a wooden floor. Floor 3 is a rooftop parapet.
    - Each slot gets a wall colour from a new `REST_HOUSE_LOOK` (four warm colours unlike the spa's `HOUSE_LOOK`).
    - Draw them as right-hand houses and flip for the left, as `houseTextures()` does.
  - **`rest-sale-<key>`:** the "BÁN NHÀ" sign for each restaurant house, reusing `saleTexture(roof)` with the house's roof kind.
  - **`spa-upper`:** 13 × 18, the spa's main shop seen on a floor the spa has not opened. A closed upper front (shuttered windows, wall in the spa's colour), the counterpart of `rest-upper`.
  - **`umbrellaTable`:** furniture, 2 × 1 tiles, drawn like `diningTable` with a red-and-cream market umbrella over it, taller than its footprint, the way beds draw over their tiles.
- [ ] **Step 1: Update the failing tests.**
  - `tests/art/restaurant.test.ts`: the exact key list grows to include `rest-room-2`, `rest-room-3`, the 12 `rest-house-*` keys, the 4 `rest-sale-*` keys and `spa-upper`. The viewBox checks cover `rest-room-2`/`rest-room-3` (same as `rest-room`) and a `rest-house-right1-1` (6 tiles wide).
  - `ROOF_LANTERNS` has at least 4 entries, all within x 0–13 and y 2–6.
  - The furniture test lists `umbrellaTable`.
- [ ] **Step 2: Run** `npx vitest run tests/art`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: "Draw the restaurant's upper dining room, its lantern-strung rooftop, its own side houses and sale signs, the umbrella table and the spa's closed upper front".

### Task 5: The restaurant drawn on every floor

**Files:**
- Modify: `src/view/RestaurantLayer.ts`, `src/view/street.ts` (`restaurantTileAt`, `ticketDots` comment), `src/scenes/SpaScene.ts` (only `showFloor` → `restaurant.setFloor`, the restaurant tap in `onMapTap`, the money float)
- Test: `tests/view/street.test.ts`

**Interfaces:**
- Consumes: Task 1's `floors`; Task 4's textures and `ROOF_LANTERNS`; `climbPose` and `FLOOR_ROWS` from `src/view/floors.ts` / config; `RoomView.rowY` / `worldToTile` as the model for the floor offset.
- Produces:
  - **`RestaurantLayer.setFloor(floor: number): void`**, called from `SpaScene.showFloor` next to `room.setFloor`. It replaces the fixed `floor = 1`.
    - Textures: floor 1 is `rest-room` (or `rest-old` while for sale). On an open floor 2 or 3 it is `rest-room-2` / `rest-room-3`. On a floor the restaurant has not opened it is `rest-upper`.
    - Items, diners, cooks and the owner are visible when `floorOf(their y) === floor`. Each one on the stairs is drawn with `climbPose`, like the spa's people.
    - The bike, wash and door light stay floor-1 only.
  - **Row offset:** `tileWorld` and `rowY` subtract `(floor - 1) * FLOOR_ROWS` from y, as `RoomView.rowY` does. So do item placement and `placeItemBody`'s y.
  - **`restaurantTileAt(world: Vec, floor = 1): Tile`** adds `(floor - 1) * FLOOR_ROWS` back. `dinerAt` and `itemAt` work on the viewed floor.
  - **Night light:**
    - stove and item glows are shown for the viewed floor's pieces;
    - on the rooftop, one lantern glow per `ROOF_LANTERNS` entry (tinted `RESTAURANT_LAMP`, `addGlow` like the stoves), lit with the same `lamps` value, and 0 in a power cut.
  - **`SpaScene.onMapTap`** sends restaurant taps on any floor, with `restaurantTileAt(w, this.viewFloor)`. The paid-money float shows when the diner's floor is the viewed floor, with floor-local y.
- [ ] **Step 1: Write the failing test** in `tests/view/street.test.ts`, `'maps a world point to a restaurant tile on the viewed floor'`: the world point that gives `{ x, y }` on floor 1 gives `{ x, y: y + FLOOR_ROWS }` with floor 2.
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: "Draw the restaurant's viewed floor, its upstairs furniture and the people on it, climbing on the stairs, light the rooftop's lanterns at night, and take taps on every floor".

### Task 6: The restaurant's houses on the street

**Files:**
- Modify: `src/view/RestaurantLayer.ts`, `src/view/street.ts` (`streetBounds`, `stripBlocks`, a restaurant `saleAt`), `src/scenes/SpaScene.ts` (`onMapTap` roof tap, `offerRestaurantHouse`, the `houseBought` restaurant event, `syncRestaurantHouses`), `src/strings/vi.ts`
- Test: `tests/view/street.test.ts`

**Interfaces:**
- Consumes:
  - Task 1's `houses`, `shownHouses()`, `houseProblem`, `buyHouse` and `houseBought` event;
  - Task 4's `rest-house-*` and `rest-sale-*`;
  - `houseRect`/`houseImageX`/`housesBetween`/`saleAt` in `src/view/houses.ts` as the model. Those are hard-wired to the spa's columns, so the restaurant's versions add `RESTAURANT_X0` tiles.
- Produces:
  - **`restaurantHouseRect(h: House): Rect`** and **`restaurantHouseImageX(h: House): number`** in `src/view/street.ts`: the spa's rect moved right by `RESTAURANT_X0 * TILE`.
  - **`restaurantSaleAt(bought: Houses, shown: Houses, worldX: number): House | null`.**
  - **`streetBounds(spaShown: Houses, restShown: Houses = NO_HOUSES): Rect`**: the right edge reaches the right side of the restaurant's last shown right house. The left houses are already inside the bounds.
  - **`stripBlocks(spaShown, restShown = NO_HOUSES)`**: the restaurant block widens to its shown houses.
  - **`RestaurantLayer`:**
    - draws each shown restaurant house with `rest-house-<key>-<floor>` for the viewed floor;
    - shows a `rest-sale-<key>` sign on each house for sale on floor 1;
    - hides the plain `lot-front` placeholder where a restaurant house shows;
    - **`setHouses(bought: Houses, shown: Houses): void`**, called on sync and after a buy.
  - **`SpaScene`:**
    - a floor-1 tap on a restaurant roof for sale slides the camera there and calls **`offerRestaurantHouse(side)`**. That is a `choose()` card like `offerRestaurant`, with the copy in Global Constraints. A `'money'` problem adds the `floorShort` line, and a failed buy toasts it.
    - The restaurant's `houseBought` event calls `restaurant.setHouses`, updates `cam.setBounds(streetBounds(...))`, slides to the house, plays `'thud'` and saves.
  - Copy `restHouseLine2` and `restHouseLine3`.
- [ ] **Step 1: Write the failing tests** in `tests/view/street.test.ts`:
  - `'widens the street to the restaurant's shown right houses'`: `streetBounds(NO_HOUSES, { left: 1, right: 1 })` has its right edge at `restaurantHouseRect({ side: 'right', n: 1 })`'s right edge. With `right: 2` it is the far house's right edge.
  - `'finds the restaurant's house for sale under a world x'`: with bought `{left:0,right:1}` and shown `{left:1,right:2}`, `restaurantSaleAt` at the centre of the far-right house is `{ side: 'right', n: 2 }`. It is `{side:'left',n:1}` at the near-left house, and null at the bought near-right house.
  - Update the existing `streetBounds`/`stripBlocks` tests so a call without `restShown` is unchanged.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: "Show the restaurant's side houses on the street with their sale signs, buy one from a card on its roof, and widen the street and the strip to them".

### Task 7: Floor buttons, the floor card and following the owner over the restaurant

**Files:**
- Modify:
  - `src/view/floors.ts` (`restaurantPills`, `showPills` over the restaurant);
  - `src/scenes/SpaScene.ts` (`updateFloorBar`, `tapFloor`, `offerRestaurantFloor`, the `floorOpened` restaurant event, follow the owner, `openBuild`);
  - `src/scenes/BuildScene.ts` (pills for the restaurant);
  - `src/view/RoomView.ts` (`spa-upper` cover);
  - `src/strings/vi.ts`.
- Test: `tests/view/floors.test.ts`

**Interfaces:**
- Consumes: Task 1's `floors`, `maxFloors`, `floorProblem`, `openFloor` and `floorOpened`; Task 4's `spa-upper`; Task 5's `RestaurantLayer.setFloor`.
- Produces:
  - **`restaurantPills(r: RestaurantSim, viewed: number, ownerHere: boolean): Pill[]`** in `src/view/floors.ts`, one pill per floor up to `r.maxFloors()`:
    - `state` follows `pills`;
    - `price: FLOOR_PRICE[floor] ?? 0`;
    - `face` when `ownerHere` and the restaurant owner is on that floor;
    - `dot` when the floor is not viewed and a diner on it is `ordering` with `chefId === null`.
  - **`SpaScene.updateFloorBar`:**
    - over the restaurant (`centreShop() === 'restaurant'`) the bar shows `restaurantPills(...)` whenever the restaurant is owned;
    - over the spa it shows the spa's pills when `showPills(sim)`, **or whenever `viewFloor !== 1`**, so the player can always come back down;
    - remove the price-zeroing.
  - **`tapFloor` over the restaurant:**
    - an open floor is shown;
    - a locked one calls **`offerRestaurantFloor(floor)`**, a `choose()` card. The kicker is `restaurantKicker`, the title `floorName2`/`floorName3`, and the lines `restFloorLine2a`/`b` or `restFloorLine3a`/`b`. A problem adds a note (`floorOrder`, `floorBlocked`, or `floorShort` with the missing money). The buttons are `floorOpen` and `floorLater`;
    - on yes, `openFloor(floor)` runs; a failure toasts the note.
    - The restaurant's `floorOpened` event calls `showFloor(floor)` and saves.
  - Remove the `restaurantNoFloors` key and its use.
  - **`RoomView.setFloor(floor, floors, maxFloors)`** covers the spa's main 13 columns with `spa-upper` when `floor > floors`. The spa's own houses keep their upper textures. The cover hides when `floor <= floors`.
  - **Following the owner:** when the restaurant owner is in (`r.ownerIn`), not riding, holding a task, and her floor changes from the last frame's, the view shows her floor. This mirrors `followFloor` for the spa owner, with the same `!this.modal` guard and a `lastRestOwnerFloor` field.
  - **Build mode over the restaurant:**
    - `openBuild` no longer forces floor 1 when the restaurant has more than one open floor;
    - `BuildScene` shows the floor pills while a piece is held for the restaurant too, with `restaurantPills(place, viewed, false)` when `shop === 'restaurant' && place.floors > 1`;
    - moving a held piece between floors uses `carryTo`/`clampToFloor` as for the spa.
- [ ] **Step 1: Write the failing tests** in `tests/view/floors.test.ts`:
  - `'gives the restaurant one pill per floor with the spa's floor prices'`: an owned restaurant with floors 1 and `maxFloors()` 3 has states `['viewed','locked','locked']` and prices `[0, FLOOR_PRICE[2], FLOOR_PRICE[3]]` when viewed is 1.
  - `'marks a restaurant floor with a diner waiting for the owner'`: a diner `ordering` with `chefId` null on floor 2, viewed 1, gives `dot: true` on floor 2 only. The same diner with a `chefId` gives no dot.
  - `'puts the owner's face on her floor only when she is in the restaurant'`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: "Show the restaurant's floor buttons over it, open its floor 2 and rooftop from a card, follow the owner up its stairs, let build mode carry pieces between its floors, and close the spa's front on a floor it has not opened".
