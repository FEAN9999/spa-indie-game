# Step 1b Batch 3: Build Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From day 2 the player can buy beds, benches and decorations, place them on the floor grid, move, flip and sell them. Two furniture sets give a beauty bonus, and a prettier shop draws customers a little faster.

**Architecture:**
- The fixed shell stays a layout string: walls, door, screen, desk and the back wall.
- Everything movable becomes a list of `Item`s in the sim. The grid, the stations and the seats are rebuilt from shell + items whenever the items change.
- Station ids become item ids, so a sold or bought bed never shifts another bed's customer.
- The room texture is baked from the shell only. Every movable thing is a sprite, and so are the lanterns, the bench mat and the "+" bed slots.
- Build mode is its own scene over the frozen shop. Rules live in the sim and are unit-tested. The scene only drives them.

**Tech Stack:** TypeScript ^7, Phaser ^4.2.1, Vite ^8.3, Vitest ^5. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-26-step-1b-batches-2-7-design.md`: sections 4, 6.4 (build button: "Mới", morning pointer, first-open line), 7 and 12.

**Room map:** `.superpowers/sdd/batch3-room-map.md` describes how the room works before this batch, with file:line references. Read it before touching `grid.ts`, `spa.ts`, `RoomView.ts` or `room.ts`.

## Global Constraints

- Free only. No new npm dependencies. Draw all art in code (SVG strings like `src/art/furniture.ts`). Style A means cream/wood/teal tones, a 4 px ink `#4A2E22` outline at canvas scale, and chunky rounded shapes.
- Every player-visible string comes from `src/strings/vi.ts`.
- `src/sim/**`, `src/save/**`, `src/app/**`, `src/art/outline.ts` and `build/**` must not import `phaser`, `src/view` or `src/scenes`. Art tests mock Phaser with `vi.mock('phaser', () => ({}))`.
- Canvas is 1080×2160 and the primary target is iPhone 17 Safari (402×874).
  - Cards are `C.paper` with a 4 px `C.ink` outline and radius 60.
  - Primary buttons are `C.teal` with `C.paper` text. Plain buttons are `C.cream` with `C.ink` text.
  - Font is Be Vietnam Pro, weight 600 or 800 only.
  - Every button is at least 120 px tall.
- **Old shops must survive.** A shop saved by any earlier version opens as the same shop: the same furniture where it was, and the same customers on the same bed and the same seat. `tests/fixtures/save-v1.json` pins v1. This batch adds `tests/fixtures/save-v2.json`.
- **The default shop must look and play exactly as before** until the player changes something:
  - same tiles, same sprites at the same pixels
  - same first-free-seat and first-free-bed order
  - same arrival timing
- **Fixed, never movable:** walls, door, screen (`H`), desk (`R`). Nothing may cover the door tile, the tile just inside it (door.y − 1) or `OWNER_START` (9,13).
- **Prices, beauty and sets (spec 7.2):**

| kind | name (vi) | w×h | price | beauty | set |
|---|---|---|---|---|---|
| `bed` | Giường gội | 1×3 (+ work tile) | 300 000 | 0 | |
| `bench` | Ghế chờ mây | 3×1 (3 seats) | 150 000 | 1 | |
| `plant` | Chậu cây | 1×1 | 40 000 | 1 | |
| `tea` | Bàn trà | 2×1 | 60 000 | 2 | |
| `planter` | Bồn cây thấp | 3×1 | 60 000 | 2 | |
| `slippers` | Kệ dép | 2×1 | 50 000 | 1 | |
| `shelf` | Kệ sản phẩm | 3×1 | 120 000 | 3 | saigon |
| `cabinet` | Tủ khăn | 3×1 | 150 000 | 3 | saigon |
| `lotus` | Bể sen sứ xanh | 2×1 | 150 000 | 4 | saigon |
| `vase` | Bình hoa đào | 1×1 | 80 000 | 2 | saigon |
| `teaChest` | Tủ chè | 3×1 | 250 000 | 5 | saigon |
| `jar` | Chum sứ xanh trắng | 1×1 | 120 000 | 3 | saigon |
| `bambooBench` | Ghế chờ tre | 3×1 (3 seats) | 180 000 | 3 | bamboo |
| `bambooTea` | Bàn trà tre | 2×1 | 70 000 | 2 | bamboo |
| `bambooShelf` | Kệ tre | 2×1 | 100 000 | 3 | bamboo |
| `bambooLamp` | Đèn tre đứng | 1×1 | 60 000 | 2 | bamboo |
| `clayJar` | Chum nước gốm | 1×1 | 90 000 | 3 | bamboo |
| `areca` | Cây cau cảnh | 1×1 | 80 000 | 3 | bamboo |

- Set names: `saigon` is "Sài Gòn xưa", `bamboo` is "Tre làng". A set is complete when the shop holds at least one of each of its 6 kinds. Every item of a complete set then counts its beauty ×1.5.
- Beauty speeds arrivals. The interval is multiplied by `1 − 0.2 × clamp((beauty − 21) / 60, 0, 1)`. The default shop's beauty is exactly 21, so it is unchanged, and the best case is 25 % more customers.
- Selling refunds `Math.floor(price / 2)`. Buying needs `money >= price`. Build actions never make money negative.
- Build mode freezes the shop: no sim updates, no clock, characters stand still. The hand pointer is hidden while it is open.
- Placement reasons and their strings:
  - `blocksPath`: "Chắn lối đi"
  - `overlap`: "Đè lên đồ khác"
  - `bedWall`: "Giường gội phải sát tường sau"
  - `busy`: "Đang có khách"
  - `lastBed`: "Tiệm cần ít nhất một giường gội"
  - `lastSeat`: "Tiệm cần ít nhất một ghế chờ"
  - `money`: "Còn thiếu {money}"
- Work on a branch `step-1b-build` made from `master` after batch 2 is merged. Never `git add -A`. Commit with `git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit …` and no attribution lines.
- Anh has authorized merging into `master` and pushing once `npm test`, `npm run build` and the browser run-through all pass (Task 8). Nothing else outward-facing.

## Review Focus

1. A batch-1 or batch-2 shop with a customer lying on the second bed and one waiting on the third seat opens with both in the same places, and the service finishes and pays as before. (Task 2: v1 and v2 fixture tests.)
2. A plant on (6,7) or (6,5), right below or above the only gap in the screen, is refused with "Chắn lối đi". The service room would be cut off. (Task 3.)
3. Moving or selling a bench with someone sitting or walking to it, or a bed in use, is refused with "Đang có khách". Selling the last bed or the last bench is refused. (Task 3.)
4. If an item is dropped where the owner or a walking customer stands, they step to the nearest free tile and still reach their seat, bed or the door after build mode closes. (Task 3.)
5. With a flipped bed, the owner works from its left side and faces right, and the customer still lies on it. (Task 3 sim test; Task 6 browser check.)

---

### Task 1: Items and the grid built from them

**Files:**
- Create: `src/sim/items.ts`, `tests/sim/items.test.ts`
- Modify: `src/sim/grid.ts`, `src/strings/vi.ts`

**Interfaces:**
- Produces, in `items.ts`:
  - `type ItemKind` (the 18 kinds in the table).
  - `type ItemGroup = 'bed' | 'seat' | 'decor'`.
  - `type SetId = 'saigon' | 'bamboo'`.
  - `interface ItemSpec { w: number; h: number; price: number; beauty: number; group: ItemGroup; set?: SetId; name: StringKey }`.
  - `ITEMS: Record<ItemKind, ItemSpec>` with the table values. `bed` is 1×3, and the two bench kinds are `group: 'seat'`.
  - `ITEM_KINDS: ItemKind[]`.
  - `interface Item { id: number; kind: ItemKind; x: number; y: number; flip: boolean }`. `(x, y)` is the top-left tile of the footprint.
  - `footprint(item): Tile[]`: w×h tiles from (x, y).
  - `workTile(item): Tile | null`: a bed's is `(flip ? x − 1 : x + 1, y + 1)`; everything else returns null.
  - `seatTiles(item): Tile[]`: a seat item's footprint, else `[]`.
  - `itemsFromLayout(rows: string[]): Item[]`:
    - Ids run from 1 in reading order of each item's top-left tile.
    - A bed is a `B` head with `C` below and `B` below that. Its `W` on the right means `flip: false`, on the left `flip: true`. A bed with neither throws `Bed at x,y has no work tile on its right`, keeping the existing message with the `C` tile's coordinates.
    - Runs of `S` become `bench` items 3 wide. `P` becomes `plant`.
    - Runs of `K L O V T G Y` become `cabinet shelf lotus vase tea slippers planter`. A run is split into pieces of the kind's width.
  - `shellOf(rows): string[]`: the layout with every item char (`B C W S P K L O V T G Y E`) replaced by `.`.
  - `DEFAULT_ITEMS = itemsFromLayout(SPA_LAYOUT_1A)`.
  - `BED_SLOTS: Tile[]`: the `E` tiles of `SPA_LAYOUT_1A`, `[{6,2},{8,2}]`. These are bed top-left tiles.
- Produces, in `grid.ts`: `buildGrid(shell: string[], items: Item[]): Grid`. It runs `parseLayout(shell)`, then stamps each item:
  - A bed sets `bedEnd`, `bed`, `bedEnd` down its column and `work` on its work tile.
  - A seat item sets `seat` on its tiles.
  - A `plant` sets `plant`.
  - Any other kind sets `decor`.
  - It fills `beds` (the middle tiles), `works`, `seats` and `plants` in item-id order, then tile order. The `decor` record keeps only `screen`; the others are empty lists. `bedSlots` is always `BED_SLOTS`.
- Strings: one `vi` entry per item name from the table. Set names `setSaigon: 'Sài Gòn xưa'` and `setBamboo: 'Tre làng'`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/items.test.ts`:
  - `reads the furniture of the default shop`: `DEFAULT_ITEMS` has 13 items. The two beds are ids 1 and 2 at (2,2) and (4,2), both `flip: false`. The cabinet is at (9,2) and the bench is at (2,13). There are three plants at (11,5), (1,16) and (11,16). Every kind and position matches the room map.
  - `builds the same grid the old layout gave`: `buildGrid(shellOf(SPA_LAYOUT_1A), DEFAULT_ITEMS)` has the same `cells`, `door`, `seats`, `beds`, `works`, `desks`, `plants`, `bedSlots` and `decor.screen` as `parseLayout(SPA_LAYOUT_1A)`.
  - `puts a flipped bed's work tile on its left`: `workTile({ kind: 'bed', x: 6, y: 2, flip: true, id: 9 })` is `{5,3}`, and the built grid has `work` at (5,3) and `bed` at (6,3).
  - `knows every kind's price, beauty and set`: spot-check `teaChest` (250000, 5, saigon), `areca` (80000, 3, bamboo) and `bed` (300000, 0, none). There are 6 kinds in each set.
- [ ] **Step 2:** `npm test`. The new tests fail.
- [ ] **Step 3: Implement.** `grid.test.ts` keeps passing unchanged, because `parseLayout` is untouched.
- [ ] **Step 4:** `npm test` and `npm run build` pass.
- [ ] **Step 5: Commit** with "List the shop's furniture as items and build the floor grid from them".

### Task 2: The shop keeps its furniture, and old saves keep their customers

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/save.ts`, `src/sim/types.ts`, `src/scenes/SpaScene.ts` (station lookups only), tests under `tests/sim/`
- Create: `tests/fixtures/save-v2.json`, frozen as described in Step 1

**Interfaces:**
- Consumes: Task 1's `Item`, `buildGrid`, `shellOf`, `itemsFromLayout`, `workTile` and `seatTiles`.
- Produces:
  - **`SpaSim`:**
    - `grid` is no longer readonly.
    - New `items: Item[]`, `private shell: string[]` and `private nextItemId`.
    - The constructor takes `layout` as before. It uses `shell = shellOf(layout)` and `items = itemsFromLayout(layout)`, then calls `rebuildRoom()`.
  - **`private rebuildRoom()`:**
    - Sets `grid = buildGrid(shell, items)`.
    - Sets `stations` from bed items, ordered by item id: `{ id: item.id, bed: middle tile, work: workTile }`.
    - Sets `seats` from seat items, ordered by item id, then x.
    - Keeps each station's or seat's `customerId` when the same station id or seat tile is still there.
  - **Station ids are item ids.** Everywhere `this.stations[i]` is indexed, use `stations.find(s => s.id === id)`. `Customer.stationId`, `OwnerTask.stationId` and `serviceReady.stationId` now hold item ids.
  - **Owner's facing at the station:** `SpaScene` faces the owner toward the bed. That is `'left'` when `bed.x < work.x`, else `'right'`. It replaces the fixed `'left'` at `SpaScene.ts:~198`.
  - **Save** (`SAVE_VERSION = 3`):
    - `SaveData` gains `items: Item[]` and `nextItemId: number`, and drops `stationCustomers` and `seatCustomers`.
    - `fromSave` rebuilds stations and seats from the items. It refills `customerId` from the customers: `c.stationId` for stations and `c.seat` for seats. It throws `SaveError` when a customer's `stationId` is not a bed item.
    - `parseSave`:
      - v1 and v2 saves get `items = DEFAULT_ITEMS` and `nextItemId = 14`.
      - Each old station index `i` in `customers[].stationId` and `owner.task.stationId` becomes the id of the i-th bed item in id order.
      - A v3 save must have `items` as a list of `{ id: int, kind ∈ ITEM_KINDS, x: int, y: int, flip: boolean }` with unique ids. Otherwise it throws `SaveError('items are not furniture')`.
  - **A save the shop cannot rebuild is kept.** Today `SpaScene.openShop` catches a `fromSave` `SaveError` and starts a fresh shop that the autosave then writes over the old one. Instead, move the raw save aside to the slot's `.broken` key, the way `store.load` does for unparseable saves, before starting fresh. Add a store method for this if needed.
  - **The newer-save guard from batch 2 keeps working.** `parseSave` accepts v1, v2 and v3, and `SaveTooNewError` is thrown only for `v > 3`.
  - **Hints** (`types.ts`):
    - `TUTORIAL_HINTS = ['tapCustomer','demoShampoo','money','star','patience','summary'] as const`.
    - `HINT_IDS = [...TUTORIAL_HINTS, 'openBuild'] as const`.
    - The v1 upgrade marks only `TUTORIAL_HINTS` done, so an old shop still gets the build button's "Mới" badge.

- [ ] **Step 1:** Freeze a v2 fixture. On the batch-2 code (`git stash` is not needed, because Task 1 does not change saves), write a test helper run once that saves `busyShop()` advanced until one customer is `inService` on the second bed and another is `waiting` on seat 3, and writes it as JSON to `tests/fixtures/save-v2.json`. Commit the JSON only and delete the helper. The fixture must have `v: 2`, `stationCustomers: [null, <id>]`, and a non-null `seatCustomers[2]`.
- [ ] **Step 2: Write the failing tests** in `tests/sim/save.test.ts`:
  - `opens a batch-2 shop with its customers on the same bed and seat`: load the v2 fixture. The serving customer's `stationId` is 2 and that station's bed is (4,3). The waiting customer's seat is (4,13), and `seats[2].customerId` is theirs. `items` equals `DEFAULT_ITEMS`. `completeService` pays the same amount as before.
  - `opens a batch-1 shop the same way`: the same checks on the v1 fixture, for whatever it holds.
  - `keeps bought furniture across a save`: push a `plant` item `{ id: 14, kind: 'plant', x: 6, y: 9, flip: false }` into `sim.items`, round-trip through `SpaSim.fromSave(sim.toSave(), …)`, and expect the item back and cell (6,9) to be `plant`.
  - `rejects furniture that is not furniture`: `items: [{ id: 1, kind: 'sofa', x: 1, y: 1, flip: false }]` throws.
  - `keeps the tap hint done but the build badge new for an old shop`: after loading the v1 fixture, `hintDone('tapCustomer')` is true and `hintDone('openBuild')` is false.
- [ ] **Step 3: Implement.** The existing sim and save suites must pass. Update an assertion only where it pinned a station index that is now an item id (1-based). Name each such change in the report.
- [ ] **Step 4:** `npm test` and `npm run build` pass. In the browser (dev server, 402×874), play one customer through the shampoo service in a fresh shop. Load the v1 fixture in slot 1 and play it on. Expect a clean console.
- [ ] **Step 5: Commit** with "Keep the shop's furniture in the save and give each bed a lasting id, so old shops keep their customers in place".

### Task 3: Placing, moving, flipping and selling

**Files:**
- Create: `src/sim/build.ts`, `tests/sim/build.test.ts`
- Modify: `src/sim/spa.ts`, `src/sim/types.ts` (event), `src/strings/vi.ts`

**Interfaces:**
- Produces:
  - `build.ts` holds `type BuildProblem = 'overlap' | 'blocksPath' | 'bedWall' | 'busy' | 'lastBed' | 'lastSeat' | 'money'` and the vi strings for each.
  - `placeProblem(shell: Grid, items: Item[], item: Item, extras: { door: Tile; ownerStart: Tile }): 'overlap' | 'bedWall' | 'blocksPath' | null` is pure, with `item` already excluded from `items` by the caller. Its checks run in this order:
    1. `overlap`: any footprint tile or the work tile falls outside the grid or on a non-floor shell cell (wall, door, screen, desk). Also any footprint tile or the work tile sits on another item's footprint, on another bed's work tile, on the tile inside the door, or on `ownerStart`.
    2. `bedWall`: the cell above a bed's top tile is not `wall`.
    3. `blocksPath`: do a BFS over walkable cells of `buildGrid` with the item added, starting from the door. Fail unless it reaches all of these:
       - every bed's work tile
       - a walkable neighbour of every seat
       - `ownerStart`
  - On `SpaSim`:
    - `canPlace(kind, x, y, flip, movingId?): BuildProblem | null`
    - `buy(kind, x, y, flip): BuildProblem | null` deducts the price and appends `{ id: nextItemId++ }`.
    - `move(id, x, y, flip): BuildProblem | null` is free.
    - `sell(id): BuildProblem | null` refunds half.
    - `isBusy(id): boolean` is true for a bed whose station has a customer, and for a seat item where any seat has a customer.
    - `beautyOf()` comes in Task 4.
    - Every successful change runs `rebuildRoom()` and then `settleCharacters()`.
  - `private settleCharacters()`:
    - The owner and each customer in `toSeat`, `waiting`, `toStation` or `leaving` whose tile is now neither walkable nor their own goal (seat or bed) moves to the nearest walkable tile. Nearest is by BFS over all cells from their tile, and the destination must also be reachable from the door.
    - Then every non-empty path is recomputed to its goal:
      - `toSeat`: the seat.
      - `toStation`: the bed.
      - `leaving`: the door.
      - The owner's `fetch`: a walkable tile beside the customer's seat.
      - The owner's `serve`: the work tile.
      - No task: the old path's last tile if it is still walkable, else stop.
  - Tapping a visible bed slot:
    - `tapTile` on a tile `isBedSlot` matches, while `canPlace('bed', slot.x, slot.y, false)` is null, emits `{ type: 'bedSlot', slot: Tile }` instead of the `comingSoon` toast.
    - Otherwise the tap falls through to the existing walk handling.
- Strings: the seven reason strings from the Global Constraints.

- [ ] **Step 1: Write the failing tests** in `tests/sim/build.test.ts`. Use a fresh default `SpaSim` with `money = 2_000_000`.
  - `buys a bed by the back wall and serves on it`:
    - `buy('bed', 6, 2, false)` returns null, money drops by 300 000, and there are 3 stations with the new id 14.
    - With stations 1 and 2 given a `customerId` by hand, a fetched waiting customer goes to (6,3), and the owner goes to (7,3).
  - `refuses a bed away from the back wall`: `canPlace('bed', 6, 8, false)` is `bedWall`.
  - `refuses anything on another item, the desk, the screen or the door's way in`: a plant at (2,13) on the bench, (9,14) on the desk, (3,6) on the screen, (6,16) inside the door, (9,13) on the owner's start, and (3,3) on a work tile all give `overlap`.
  - `refuses what would cut the shop in two`: a plant at (6,7) gives `blocksPath`, and so does one at (6,5). A plant at (7,9) gives null.
  - `refuses a bed whose work tile is blocked`: `canPlace('bed', 8, 2, false)` with the cabinet at (9..11,2) is null, because its work tile is (9,3). After `buy('plant', 9, 3)`, `canPlace('bed', 8, 2, false)` is `overlap`.
  - `flips a bed to work from its left`: `buy('bed', 8, 2, true)` puts the work tile at (7,3). A customer served there has the owner on (7,3).
  - `will not move or sell what a customer is using`: with a customer waiting on the bench, `move(benchId, …)` and `sell(benchId)` both give `busy`. With a customer in service on bed 1, `sell(1)` gives `busy`.
  - `keeps one bed and one bench`: after selling bed 2, `sell(1)` gives `lastBed`. With one bench, selling it gives `lastSeat`, and buying a second bench makes the sale possible.
  - `refunds half and never spends money it does not have`: at money 100 000, `buy('teaChest', …)` gives `money` and money is unchanged. `sell` of a 150 000 lotus adds 75 000.
  - `moves people out of the way`:
    - Stand the owner at (7,9) and `buy('plant', 7, 9)`. The owner is now on a walkable neighbour.
    - A customer `leaving` whose path crossed (6,12) still reaches the door after `buy('plant', 6, 12)`. If that blocks the path, the test uses a tile that doesn't.
  - `offers the bed slots only while a bed fits there`:
    - Tapping (6,3) on a fresh shop emits `bedSlot` with slot {6,2}.
    - After `buy('bed', 6, 2)`, tapping (6,3) emits no `bedSlot`.
- [ ] **Step 2:** `npm test`. The new tests fail.
- [ ] **Step 3: Implement.** Replace the old `isBedSlot → comingSoon` test in `spa-owner.test.ts` with the `bedSlot` event and say so.
- [ ] **Step 4:** `npm test` and `npm run build` pass.
- [ ] **Step 5: Commit** with "Place, move, flip and sell furniture with rules that keep every bed and seat reachable".

### Task 4: Beauty and the two sets

**Files:**
- Modify: `src/sim/items.ts`, `src/sim/economy.ts`, `src/sim/spa.ts`, `src/config.ts`
- Test: `tests/sim/items.test.ts`, `tests/sim/economy.test.ts`

**Interfaces:**
- Produces:
  - `config.ts`: `BEAUTY_BASE = 21`, `BEAUTY_TOP = 81`, `BEAUTY_MAX_SPEEDUP = 0.2`.
  - `items.ts`:
    - `setProgress(items, set: SetId): number` counts the distinct set kinds present (0–6).
    - `beautyOf(items): number` is the sum of each item's beauty, ×1.5 for items of a set with progress 6.
  - `economy.ts`: `beautyArrivalFactor(beauty: number): number` is `1 − 0.2 × clamp((beauty − 21) / 60, 0, 1)`.
  - `spa.ts`:
    - The next-arrival interval also multiplies by `beautyArrivalFactor(this.beauty())`.
    - `beauty()` returns `beautyOf(this.items)`.

- [ ] **Step 1: Write the failing tests:**
  - `scores the default shop 21 with Sài Gòn xưa at 4 of 6`.
  - `adds half again for a full set`: the default items plus a `teaChest` and a `jar` give `setProgress` 6. Beauty is 21 + 5 + 3 + (3 + 3 + 4 + 2 + 5 + 3) × 0.5 = 39.
  - `draws customers faster as the shop gets prettier, up to a quarter more`: `beautyArrivalFactor` at 21, 51, 81 and 200 gives 1, 0.9, 0.8 and 0.8. At 0 it gives 1.
  - `leaves the default shop's arrival timing alone`: the existing seeded arrival tests pass unchanged.
- [ ] **Step 2:** `npm test`. The new tests fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** `npm test` and `npm run build` pass.
- [ ] **Step 5: Commit** with "Score the shop's beauty, reward a full set, and let a pretty shop draw more customers".

### Task 5: Furniture art

**Files:**
- Modify: `src/art/furniture.ts`, `src/art/room.ts`, `src/scenes/BootScene.ts` (room built from the shell)
- Test: `tests/art/furniture.test.ts` (create)

**Interfaces:**
- Produces:
  - `FURNITURE` gains textures for these kinds: `teaChest`, `jar`, `bambooBench`, `bambooTea`, `bambooShelf`, `bambooLamp`, `clayJar` and `areca`. Each one's width in tiles equals its footprint w. Its height may rise above the footprint, the way the existing art does.
  - It also gains `lantern` (the wall lantern now drawn in `room.ts`), `benchMat` (the cói mat now baked under the bench) and `bedSlot` (the dashed outline plus the "+" now baked).
  - `itemTexture(kind: ItemKind): string` maps each kind to its texture key. The existing kinds keep their keys: `bed`, `bench`, `plant`, `decor-cabinet`, and so on.
  - `roomTexture(grid)` no longer draws lanterns, the bench mat or the bed slots. The louvre window is drawn at a fixed centre x of 10.5 tiles, where it is today.
  - `BootScene` builds the room from `buildGrid(shellOf(SPA_LAYOUT_1A), [])`. The runner mat and the floor split come from the shell's door and screen, which don't move.
- Art direction:
  - **Tủ chè:** a low dark-wood chest with brass corners and a tea set on top.
  - **Chum sứ:** a blue-and-white jar.
  - **Bamboo pieces:** yellow bamboo with visible nodes and woven mây, with brown pottery for the clay jar and green leaves for the areca palm.
  - **Shared rules:** every piece uses the same outline weight and the same light from the top-left as the existing furniture. Nothing may look like the customers' shirt colours.

- [ ] **Step 1: Write the failing test:** `has art for every item kind and the room's movable parts`. For every `ITEM_KINDS` kind, `furnitureTextures()` has `itemTexture(kind)`. It also has `lantern`, `benchMat` and `bedSlot`.
- [ ] **Step 2:** `npm test`. The test fails.
- [ ] **Step 3: Implement.** Draw the eight new pieces and move the three baked parts into textures.
- [ ] **Step 4:** `npm test` and `npm run build` pass. On the dev server at 1080×2160, show every texture in a temporary grid, the same way Task 4 of batch 2 did it with a throwaway `__spa` call that is not committed. Screenshot it and zoom in. The outlines must be clean and every piece must read clearly at size. Fix anything that doesn't, then re-check.
- [ ] **Step 5: Commit** with "Draw the Tre làng set, the tea chest and the blue-and-white jar, and lift the lanterns, mat and bed slots off the floor".

### Task 6: The room drawn from the items, and buying a bed from its slot

**Files:**
- Modify: `src/view/RoomView.ts`, `src/scenes/SpaScene.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes: Task 2's `sim.items` and station ids, Task 3's `bedSlot` event and `buy`, and Task 5's textures and `itemTexture`.
- Produces:
  - `RoomView.sync(items: Item[], slots: { tile: Tile; open: boolean }[]): void`. It creates, moves, flips (`setFlipX`) and destroys one sprite per item, keyed by id.
    - Each item sprite is anchored at its footprint's bottom-centre with origin (0.5, 1), and its depth is the bottom pixel y, as today.
    - A bed's `lantern` sits on the back wall above its work tile, at the x and y the baked lantern had.
    - A `bench` (rattan) carries its `benchMat` at depth 1, at the place the baked mat had relative to the seats.
    - Bed slots show the `bedSlot` sprite only when `open`.
  - `RoomView.hide(id: number | null): void` hides one item's sprite while build mode moves it (used in Task 7).
  - `SpaScene` calls `sync` once at create and after every build change, which comes from the `roomChanged` sim event. Add that event to Task 3's successful `buy`, `move` and `sell` if Task 3 did not.
  - Quick buy:
    - On `bedSlot`, if build is locked, the toast is `unlocksOn` with `UNLOCK_DAY.build`.
    - If `money < 300 000`, the toast is the `money` reason with the missing amount, `formatMoney`.
    - Otherwise a confirm card opens: the dim backdrop swallows taps, the shop is modal-frozen like the owner card, and it reads `quickBuyBed: 'Mua giường gội {money}?'`. The buttons are plain `cancel` and primary `buy: 'Mua'`.
    - "Mua" calls `buy('bed', slot.x, slot.y, false)`, then `sync`, then `session.saveNow()`.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Check in the browser** at 402×874 with cleared storage:
  - The default shop looks exactly like `master`: lanterns, mat, beds, bench, plants and slots in the same pixels. Screenshot both builds in the same state (the owner card closed) and compare them side by side.
  - On day 1, tapping a slot gives "Mở vào ngày 2".
  - Set `__spa.sim.day = 2` and money to 500 000. Tap slot (6,2), get the card, then "Mua". The bed appears with its lantern, the slot's "+" goes away, and money drops by 300 000.
  - Play a customer onto the new bed. They lie on it, the owner stands on its right, and the mini-game opens.
  - Through the console: `buy('bed', 8, 2, true)` on a shop with money gives a flipped bed. A customer served there has the owner on its left, facing right.
  - Reload: the new beds are still there.
  - The console is clean.
- [ ] **Step 3:** `npm test` and `npm run build` pass.
- [ ] **Step 4: Commit** with "Draw the room from its furniture and buy a bed straight from an empty slot".

### Task 7: Build mode

**Files:**
- Create: `src/scenes/BuildScene.ts`
- Modify: `src/scenes/SpaScene.ts`, `src/view/Hud.ts`, `src/main.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes everything above, plus `HandPointer`, `isUnlocked` and the hint queue from batch 2.
- Produces:
  - **`BuildData`:** `{ sim: SpaSim; room: RoomView; onChange: () => void; onClose: () => void }`.
  - **Opening and closing.** `SpaScene.openBuild()` sets `modal` (frozen, pointer hidden) and launches `BuildScene`.
    - `onChange` runs `room.sync(...)` and saves.
    - `onClose` clears `modal` and saves.
    - The first open marks `openBuild`.
  - **Hud.** The `navBuild` plate opens build mode once it is unlocked; the other unlocked plates still toast `comingSoon`.
    - While `!hintDone('openBuild')`, the plate shows a small "Mới" badge (`newBadge: 'Mới'`). It is a lantern-red pill with paper text, top-left of the plate, mirroring the lock icon.
  - **Morning hand.** On the morning of `UNLOCK_DAY.build`, while `!hintDone('openBuild')`, the hint queue points the hand down at the build plate with `hintBuild: 'Có tiền rồi thì mua thêm giường ở đây'`.
    - It ranks below the batch-2 tutorial hints and above nothing else. It is shown only when the day equals the unlock day, so an old shop past day 2 gets the badge but no hand.
  - **`BuildScene` layout, over the shop.**
    - **Grid.** A faint grid over every floor tile, 2 px ink at 15 % alpha.
    - **Panel.** A paper panel fills y 1640–2160, covering the street strip and the nav.
      - Tabs: `tabBeds: 'Giường'`, `tabSeats: 'Ghế chờ'`, `tabDecor: 'Trang trí'`.
      - Below the tabs, one line: `beautyTotal: 'Tiệm đẹp: {n}'`, then the two set lines. Each set line reads `setProgress: '{name} {have}/6'`, or `setDone: '{name} · Đủ bộ!'` once all 6 pieces are in.
      - A row of item cards, 4 per page, with `‹ ›` page buttons when the tab holds more. Each card shows the texture fitted into it, the name, the price and `beautyPlus: 'Đẹp +{n}'`.
      - A card the shop cannot afford is at 45 % alpha and shows `money` with the missing amount instead of the price.
      - A plain `done: 'Xong'` button closes build mode.
      - The first time the panel opens, it shows `buildIntro: 'Mua đồ, kéo để kê lại tiệm. Tiệm càng đẹp càng đông khách.'` as a note above the tabs.
    - **Holding a new item.**
      - Tapping an affordable card makes a ghost of that item. It starts on the valid spot nearest the room centre (6, 9), found by trying tiles in growing rings. If no spot is valid, it starts at the centre.
      - The ghost is drawn 16 px above its tiles at 90 % alpha. Its footprint (and a bed's work tile) is filled at 35 % in teal when it can be placed, or in `C.lantern` red when it cannot.
      - The panel shrinks to one row: plain `cancel`, plain `flip: 'Lật'`, and primary `place: 'Đặt'`.
      - Dragging anywhere above the panel moves the ghost by whole tiles relative to where the finger started. It is clamped inside the grid.
      - "Đặt" calls `buy`. A non-null result toasts its reason and keeps the ghost.
    - **Holding an existing item.**
      - A tap (under 20 px of movement) on an item's tile selects it, unless it `isBusy`, which toasts `busy`. Its sprite is hidden (`room.hide(id)`) and the ghost takes its place.
      - The row has `cancel`, `flip`, `sell: 'Bán · {money}'` (the refund) and `place`.
      - "Đặt" calls `move`. "Bán" calls `sell`. "Thôi" puts it back.
      - `done` is hidden while anything is held.
    - **Rules.** Every sim call goes through `buy`/`move`/`sell`; the scene never edits `sim.items`.
    - **Taps.** Taps on the panel never reach the shop.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Check in the browser** at 402×874 with cleared storage, screenshotting each step:
  - **Day 1.** The build plate is locked.
  - **Day 2 morning.** Set `__spa.sim.day = 2` and money to 1 000 000, then run the summary path or reload. The plate shows "Mới", and the hand points at it with the line.
  - **First open.** Tap the plate. Time stops (the clock is frozen), the grid shows, and the panel has the intro note, the tabs, "Tiệm đẹp: 21", "Sài Gòn xưa 4/6" and "Tre làng 0/6". The "Mới" badge and the hand are gone.
  - **Buy a tea chest.**
    - In Trang trí, tap Tủ chè. A ghost appears with green tiles.
    - Drag it onto the screen gap: the tiles turn red, and "Đặt" toasts "Chắn lối đi".
    - Drag it to a free spot and "Đặt". Money drops.
    - Buy a Chum sứ the same way. The set line reads "Sài Gòn xưa · Đủ bộ!" and the beauty total rises to 39.
  - **Move and flip.** Select the bench while a customer sits on it: "Đang có khách". With it empty, move it and flip it. The mat follows.
  - **Sell.** Sell a plant: the money goes up by 20 000.
  - **Unaffordable cards.** With money at 50 000, the Tủ chè card is faded and reads "Còn thiếu 200.000 đ".
  - **Close.** "Xong" closes build mode. The clock runs, and customers walk to their seats along the new paths.
  - **Reload.** Everything is where it was left.
  - **Old shop.** Load the v1 fixture with day set to 3. The plate shows "Mới" and there is no hand.
  - **Console.** Clean.
- [ ] **Step 3:** `npm test` and `npm run build` pass.
- [ ] **Step 4: Commit** with "Open build mode from day 2: buy, drag, flip and sell furniture on a grid while the shop waits".

### Task 8: Whole-branch check and ship

- [ ] Run `npm test` and `npm run build`. Both must pass.
- [ ] Do a fresh browser run-through at 402×874 on `npx vite preview --port 4173 --strictPort`:
  - day 1 to day 2
  - quick-buy a bed
  - build mode buy, move and sell
  - reload
  - the v1 and v2 fixtures in slots
  - iPhone user agent
  - the console stays clean
- [ ] Merge into `master` with `git checkout master && git merge --ff-only step-1b-build && git push origin master`.
- [ ] Watch the GitHub Actions run until it finishes (`gh run list --limit 1`, then `gh run watch <id>`). Open https://fean9999.github.io/spa-indie-game/ with the browse binary and check that the new build is live: the build plate opens on day 2.
- [ ] Report to anh in Vietnamese.
