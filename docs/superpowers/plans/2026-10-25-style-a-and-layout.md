# Style A and the New Shop Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redraw every piece of the step-1a game in the approved "Gạch bông Sài Gòn" style and rebuild the shop in the approved layout, with customers lying on shampoo beds instead of sitting in chairs.

**Architecture:** Same as step 1a. Rules stay in `src/sim/` (no Phaser) and change only where beds and the layout need it: two new layout cells (bed ends, decor), bed slots, a work tile to the right of each bed. All art stays SVG strings generated in `src/art/` and rasterized at boot; this plan redraws them from the approved board and adds the new furniture. `RoomView` places furniture by horizontal runs of same-kind tiles.

**Tech Stack:** TypeScript ^7.0, Phaser ^4.2.1, Vite ^8.3, Vitest ^5.0, `@fontsource/be-vietnam-pro` ^5.3 (OFL, replaces `@fontsource/baloo-2`), Node 24.

**Spec:** `docs/superpowers/specs/2026-10-25-spa-game-design.md`, sections 4.4 (approach) and 7 (style, characters, layout). Visual reference: `docs/art/style-a-board.svg` (the approved board; open it in a browser, each piece is a commented `<g>`).

## Global Constraints

- Free only: every dependency is MIT/OFL/CC0. The new font is `@fontsource/be-vietnam-pro` (OFL).
- No pixel art. All art is vector SVG drawn in code (spec 4.4: "Vẽ lại bằng code, giữ cách làm của bước 1a").
- Every player-visible string comes from `src/strings/vi.ts`.
- `src/sim/**` must not import `phaser` or anything from `src/art`, `src/view`, `src/scenes`.
- Canvas 1080×2160, `Scale.FIT`, `CENTER_BOTH`. Primary target iPhone 17 Safari, viewport 402×874. Page and canvas background `#F3E6D3`.
- Every drawn shape has a `#4A2E22` outline. Outer outline ≈ 4 px and inner lines 2–3 px at 1080 width: `0.05` / `0.03` in tile units (art drawn at `TILE` px per unit), `1.3` / `0.9` in chibi units (`CHIBI_PX` = 2.4), `4` / `2.5` in fx and HUD art drawn at 1 px per unit.
- New art uses only the spec 7.1 palette (opacity variations allowed). No soft gradients; the only shadow is a flat `#4A2E22` ellipse at 18% opacity.
- Text is Be Vietnam Pro at weight 600 or 800 only.
- The shop layout is exactly the spec 7.3 grid.
- Work on branch `style-a` cut from `master`; never commit to `master`. Never `git add -A`. Every `git commit` in this plan runs as `git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit …`, with no attribution lines.
- Out of scope: buying beds, grid furniture placement and build mode (step 1b), new services, steam effects, owner customization.

## Review Focus

1. A customer on a bed must be drawn on top of the bed, both while waiting for the owner and during service, and the idle owner must be drawn behind the reception counter, not in front of it. (Task 5 Step 4 screenshots.)
2. From tapping a waiting customer to the mini-game opening takes at most 8 s even from the far end of the bench with the owner at the desk (spec 7.3 "Nhịp chơi"). (Task 1 test `brings a customer from the far end of the bench onto a bed within 8 seconds of the tap`.)
3. Tapping the "+" of an empty bed slot shows "Tính năng này có ở bản sau" and does not walk the owner over the slot. (Task 1 test `tapping an empty bed slot says it is coming soon and leaves the owner where they are`.)
4. Stacked Vietnamese marks (ặ, ổ, ữ) must not be clipped at the top of any text in the new font. (Task 2 `testString` and screenshot of "Tổng kết ngày 1".)
5. Be Vietnam Pro is wider than Baloo 2: money in the millions and a three-digit day must not overlap the rating star or each other. (Task 6 Step 3 screenshot with money 9.999.999 đ and day 100.)

---

## File Structure

```
docs/art/style-a-board.svg     approved board, reference only (not loaded by the game)
src/sim/grid.ts                legend: beds, bed ends, bed slots, decor; tileRuns(), isBedSlot()
src/sim/layout.ts              the approved shop layout (keeps the name SPA_LAYOUT_1A)
src/sim/types.ts               Station.bed, toast key 'comingSoon'
src/sim/spa.ts                 work tile right of each bed; tap on a bed slot
src/config.ts                  OWNER_START, CUSTOMER_SPEED
src/strings/vi.ts              stationsBusy copy
src/art/palette.ts             style A colors, character palettes
src/art/room.ts                room background texture only
src/art/furniture.ts           NEW: furniture and decor textures (moved out of room.ts)
src/art/chibi.ts               outlined parts, face-rest, blanket
src/art/fx.ts                  coin, shadow, bubbles, stars, nav icons
src/art/shampooArt.ts          mini-game close-up
src/view/text.ts               Be Vietnam Pro text style
src/view/RoomView.ts           places furniture by runs
src/view/CharacterView.ts      'lie' pose
src/view/Hud.ts                top bar, pause, bottom nav, hint, toast
src/scenes/SpaScene.ts         lying/sitting, owner facing, patience bar, ripple, money pop
src/scenes/ShampooScene.ts     card and bars
src/scenes/SummaryScene.ts     card and button
src/scenes/BootScene.ts        loading text, texture imports
src/main.ts, index.html, package.json   font and background
```

## How to read the board

The board is 390 px wide; one tile is about 28.8 board px across, but the board stretches the floor vertically (about 38 board px per row). Take shapes, colours and stroke weights from the named board group; take sizes from the footprint table in Task 4, never from the board's pixel heights. To compare, open both at phone size (Task 4 Step 4).

Browser checks use the gstack `/browse` skill's headless fallback:

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse.exe"
"$B" goto "http://localhost:5173/" && "$B" viewport 402x874
"$B" screenshot "<scratchpad>/<name>.png"   # then Read the png
"$B" console --errors                       # expect none
```

The dev server is `npm run dev -- --port 5173 --strictPort` in the background. Dev hooks: `window.__spa.sim`, `window.__spa.spa`, `window.__spa.game`.

---

### Task 1: Layout, beds and the sim

**Files:**
- Modify: `src/sim/grid.ts`, `src/sim/layout.ts`, `src/sim/types.ts:48-53,75`, `src/sim/spa.ts:83-88,118-139,156,256,263`, `src/sim/path.ts:13` (comment), `src/config.ts` (`OWNER_START`, `CUSTOMER_SPEED`), `src/strings/vi.ts` (`stationsBusy`)
- Modify (rename only, art is redone in Tasks 3–4): `src/art/room.ts`, `src/view/RoomView.ts`
- Test: `tests/sim/grid.test.ts`, `tests/sim/spa-owner.test.ts`

**Interfaces:**
- Produces:
  - `type Cell = 'wall' | 'floor' | 'door' | 'seat' | 'bed' | 'bedEnd' | 'work' | 'desk' | 'plant' | 'decor'` (`'chair'` is gone).
  - `type DecorKind = 'screen' | 'cabinet' | 'shelf' | 'lotus' | 'vase' | 'tea' | 'slippers' | 'planter'`.
  - `Grid` gains `beds: Tile[]` (the `C` tiles, replaces `chairs`), `bedSlots: Tile[]` (the `E` tiles), `decor: Record<DecorKind, Tile[]>` (every kind present, empty when unused). Tiles in every list are in reading order (row, then x).
  - `interface TileRun { left: number; right: number; row: number }` and `tileRuns(tiles: Tile[]): TileRun[]`: consecutive x in the same row form one run; input in reading order.
  - `isBedSlot(grid: Grid, t: Tile): boolean`: true for a slot's `E` tile and the two tiles below it.
  - `Station.bed: Tile` (replaces `chair`); `SimEvent` toast `key: 'stationsBusy' | 'comingSoon'`.
  - Legend: `#` wall, `.` floor, `D` door, `S` seat, `C` bed (the customer lies here), `B` bed end (head or foot, not walkable), `W` work, `E` bed slot (walkable floor), `R` desk, `P` plant, `H` screen, `K` cabinet, `L` shelf, `O` lotus, `V` vase, `T` tea, `G` slippers, `Y` planter. Every decor char is cell `'decor'` (not walkable).

- [ ] **Step 0: Branch and commit the docs**

```bash
git checkout -b style-a master
git add docs/superpowers/specs/2026-10-25-spa-game-design.md docs/art/style-a-board.svg docs/superpowers/plans/2026-10-25-style-a-and-layout.md
git commit -m "Add style A board, layout and plan to the design"
```

- [ ] **Step 1: Write the failing grid tests** (replace the first two tests in `tests/sim/grid.test.ts`, keep `rejects ragged layouts`)

```ts
it('parses the shop layout', () => {
  const g = parseLayout(SPA_LAYOUT_1A)
  expect([g.cols, g.rows]).toEqual([13, 18])
  expect(g.door).toEqual({ x: 6, y: 17 })
  expect(g.seats).toEqual([{ x: 2, y: 13 }, { x: 3, y: 13 }, { x: 4, y: 13 }])
  expect(g.beds).toEqual([{ x: 2, y: 3 }, { x: 4, y: 3 }])
  expect(g.works).toEqual([{ x: 3, y: 3 }, { x: 5, y: 3 }])
  expect(g.desks).toEqual([{ x: 8, y: 14 }, { x: 9, y: 14 }, { x: 10, y: 14 }])
  expect(g.bedSlots).toEqual([{ x: 6, y: 2 }, { x: 8, y: 2 }])
  expect(g.decor.screen).toHaveLength(10)
  expect(g.decor.cabinet).toEqual([{ x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 }])
  expect(g.decor.planter).toEqual([{ x: 2, y: 12 }, { x: 3, y: 12 }, { x: 4, y: 12 }])
  expect(g.decor.vase).toEqual([{ x: 11, y: 11 }])
})

it('knows what can be walked on', () => {
  const g = parseLayout(SPA_LAYOUT_1A)
  const walk = (x: number, y: number) => isWalkable(g, { x, y })
  expect([walk(5, 9), walk(6, 17), walk(3, 3), walk(6, 2), walk(6, 6)]).toEqual([true, true, true, true, true]) // floor, door, work, bed slot, screen opening
  expect([walk(0, 5), walk(2, 3), walk(2, 2), walk(2, 4), walk(5, 6), walk(8, 14), walk(2, 13), walk(3, 12), walk(-1, 0)]).toEqual(
    [false, false, false, false, false, false, false, false, false], // wall, bed, bed head, bed foot, screen, desk, seat, planter, out of bounds
  )
})

it('groups tiles into horizontal runs', () => {
  const tiles = [{ x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 4, y: 9 }]
  expect(tileRuns(tiles)).toEqual([{ left: 1, right: 3, row: 6 }, { left: 7, right: 8, row: 6 }, { left: 4, right: 4, row: 9 }])
})

it('treats a bed slot and the two tiles below it as the slot', () => {
  const g = parseLayout(SPA_LAYOUT_1A)
  expect([2, 3, 4, 5].map(y => isBedSlot(g, { x: 6, y }))).toEqual([true, true, true, false])
  expect(isBedSlot(g, { x: 7, y: 3 })).toBe(false)
})
```

- [ ] **Step 2: Run** `npx vitest run tests/sim/grid.test.ts`. Expected: FAIL (`tileRuns`/`isBedSlot` not exported, `beds` undefined).

- [ ] **Step 3: Implement the grid and the layout.** In `grid.ts`, extend the legend and types as in Interfaces; `parseLayout` initializes `decor` with an empty list per kind and fills lists in reading order; add `tileRuns` and `isBedSlot`. Replace `SPA_LAYOUT_1A` with exactly:

```ts
// # wall  . floor  D door  S seat  C bed (customer lies here)  B bed head/foot  W owner work tile  E empty bed slot
// R desk  P plant  H screen  K towel cabinet  L product shelf  O lotus basin  V peach vase  T tea table  G slipper rack  Y planter
export const SPA_LAYOUT_1A = [
  '#############',
  '#############',
  '#.B.B.E.EKKK#',
  '#.CWCW......#',
  '#.B.B.......#',
  '#..........P#',
  '#HHHHH.HHHHH#',
  '#.LLL....OO.#',
  '#...........#',
  '#...........#',
  '#...........#',
  '#..........V#',
  '#.YYY.......#',
  '#.SSS.......#',
  '#.......RRR.#',
  '#..TT.......#',
  '#P..GG.....P#',
  '######D######',
]
```

- [ ] **Step 4: Run** `npx vitest run tests/sim/grid.test.ts`. Expected: PASS.

- [ ] **Step 5: Write the failing sim tests** in `tests/sim/spa-owner.test.ts` (import `isWalkable` from grid):

```ts
it('serves each bed from the work tile on its right', () => {
  const sim = fresh()
  expect(sim.stations.map(s => [s.bed, s.work])).toEqual([
    [{ x: 2, y: 3 }, { x: 3, y: 3 }],
    [{ x: 4, y: 3 }, { x: 5, y: 3 }],
  ])
})

it('rejects a bed with no work tile on its right', () => {
  const layout = ['#####', '#.CW#', '#.C.#', '##D##']
  expect(() => new SpaSim({ rng: createRng(1), layout })).toThrow('Bed at 2,2 has no work tile on its right')
})

it('starts the day with the owner behind the reception desk', () => {
  const sim = fresh()
  const o = sim.ownerTile()
  expect(isWalkable(sim.grid, o)).toBe(true)
  expect(sim.grid.desks).toContainEqual({ x: o.x, y: o.y + 1 })
})

it('tapping an empty bed slot says it is coming soon and leaves the owner where they are', () => {
  const sim = fresh()
  for (const y of [2, 3, 4]) {
    sim.tapTile({ x: 6, y })
    expect(sim.drainEvents()).toContainEqual({ type: 'toast', key: 'comingSoon' })
  }
  expect(sim.owner.path).toEqual([])
})

it('brings a customer from the far end of the bench onto a bed within 8 seconds of the tap', () => {
  const sim = fresh()
  const c = seatAndWait(sim)
  expect(c.seat).toEqual({ x: 2, y: 13 }) // the first seat is the farthest from the beds
  sim.tapTile(c.seat!)
  let ms = 0
  while (c.state !== 'inService' && ms <= 20_000) {
    sim.advance(100)
    ms += 100
  }
  expect(ms).toBeLessThanOrEqual(8_000)
})
```

Also update the existing tests: `tapping a wall or furniture does nothing` taps `(0,5)`, `(8,14)` desk, `(3,12)` planter, `(5,6)` screen and `(2,2)` bed head; the paid event expects `tile: sim.stations[0].bed`; rename "brings them to a chair" to "brings them to a bed" and "every chair is busy" to "every bed is busy".

- [ ] **Step 6: Run** `npm test`. Expected: the new tests FAIL (`stations[].bed` undefined, no toast, owner start not behind the desk, pacing over 8 s).

- [ ] **Step 7: Implement.**
  - `spa.ts`: stations come from `grid.beds`; the work tile is `{ x: bed.x + 1, y: bed.y }`, else throw `` `Bed at ${bed.x},${bed.y} has no work tile on its right` ``. Use `station.bed` wherever `station.chair` was. In `tapTile`, after the waiting-customer check and before walking: if `isBedSlot(this.grid, t)`, emit `{ type: 'toast', key: 'comingSoon' }` and return.
  - `types.ts`: `Station.bed`, toast key union.
  - `config.ts`: `OWNER_START = { x: 9, y: 13 }`; `CUSTOMER_SPEED = 4` (worst case: owner 8 tiles at 4/s, then the customer 20 tiles at 4/s ≈ 7 s; at the old 2.5 it is 10 s).
  - `vi.ts`: `stationsBusy: 'Giường gội đầu đang bận'`.
  - `path.ts` comment: "(seats, beds)".
  - `room.ts` and `RoomView.ts`: replace `grid.chairs` with `grid.beds` so the build compiles; nothing else.

- [ ] **Step 8: Verify.** `npm test` passes (all files); `npm run build` exits 0.

- [ ] **Step 9: Commit.** `git add src tests && git commit -m "Lay out the shop with shampoo beds, screen and decor"`

---

### Task 2: Style A palette and Be Vietnam Pro

**Files:**
- Modify: `src/art/palette.ts` (`C` only), `src/view/text.ts`, `src/main.ts`, `index.html`, `package.json`, `package-lock.json`, `src/scenes/BootScene.ts`
- Modify (weight literals only): `src/view/Hud.ts`, `src/scenes/SpaScene.ts`, `src/scenes/ShampooScene.ts`, `src/scenes/SummaryScene.ts`

**Interfaces:**
- Produces: `C` keys used by Tasks 3–7:
  `ink #4A2E22`, `cream #FBF7EE`, `paper #FBF3E4`, `sand #F3E6D3`, `tile #F6ECDB`, `tileSeam #E2D3BC`, `terracotta #C65D3B`, `teal #2F7D6E`, `tealLight #3E9682`, `tealDark #2A6B5C`, `mustard #E3A73B`, `mustardDark #C78A22`, `wall #F2CC6B`, `wallDark #E0B04F`, `cobalt #2D5FA8`, `wood #8A5634`, `woodDark #6B4027`, `woodLight #A86E45`, `plank #C99A6A`, `plankLine #A87A4E`, `lantern #D8463A`, `lanternDark #A8302A`, `lotus #F28CA0`, `lotusDark #E8708A`, `leaf #4E9A6B`, `leafLight #5FAE7B`, `water #BFE3F2`, `waterDeep #7FC4D8`, `glass #CFE8F0`, `weave #D9A866`, `weaveLine #B98544`, `mat #EBD29E`, `matLine #D9B577`, `sidewalk #E9DCC8`, `sidewalkLine #D8C8B0`, `road #D4C5B1`, `green #6DB36A`.
  Old keys that are still referenced and not redefined above stay in a block marked `// legacy pastel: removed in Task 7` (`gold`, `goldDark`, `lavender`, `lavenderLight`, `lavenderDark`, `mint`, `mintLight`, `pink`, `pinkDark`, `desk`, `deskDark`, `floor`, `wallCap`, `wallLine`, `sky`, `rugCream`, `text`, `textSoft`, `red`).
- Produces: `textStyle(size: number, weight: '600' | '800' = '800', color: string = C.ink)` with `fontFamily: '"Be Vietnam Pro"'` and `testString: '|MÉqgyẶỖ'` so stacked marks are measured.

- [ ] **Step 1: Swap the font package.** `npm uninstall @fontsource/baloo-2 && npm install @fontsource/be-vietnam-pro@^5.3.0`. Expected: `package.json` lists `@fontsource/be-vietnam-pro`, not `baloo-2`.
- [ ] **Step 2: Implement.**
  - `main.ts`: import `@fontsource/be-vietnam-pro/600.css` and `800.css`; preload `600 40px "Be Vietnam Pro"` and `800 40px "Be Vietnam Pro"` with the existing Vietnamese sample; `backgroundColor: '#F3E6D3'`.
  - `index.html`: `theme-color` and `body` background `#F3E6D3`.
  - `palette.ts`: `C` as in Interfaces.
  - `text.ts`: the new `textStyle`. Every call site maps `'500'` → `'600'` and `'700'` → `'800'`.
  - `BootScene.ts`: the loading text uses `textStyle(56, '600')`.
- [ ] **Step 3: Verify.** `npm test` passes; `npm run build` exits 0. In the browser at 402×874: the HUD text is Be Vietnam Pro and the letterbox is sand-coloured. Run `"$B" js "window.__spa.sim.advance(900000)"` and screenshot: "Tổng kết ngày 1" shows its marks uncut. `console --errors` is empty.
- [ ] **Step 4: Commit.** `git add package.json package-lock.json index.html src && git commit -m "Switch to the style A palette and Be Vietnam Pro"`

---

### Task 3: Room texture

**Files:**
- Modify: `src/art/room.ts` (`roomBody`, `roomTexture`; `STREET_TILES` unchanged)

**Interfaces:**
- Consumes: `Grid` fields from Task 1 (`door`, `works`, `seats`, `bedSlots`, `decor.screen`, `decor.cabinet`); `C` from Task 2.
- Produces: `roomTexture(grid: Grid): string`, unchanged signature, still `svgDoc([0, 0, cols, rows + STREET_TILES], TILE, …)`.

Everything below is in tile units and derived from the grid, so a different layout still draws sensibly.

- [ ] **Step 1: Implement `roomBody(grid)`, drawn back to front:**
  - **Floors.** The service room runs from y 2 down to the middle of the screen row (screen row + 0.5) in wood planks: rows 0.5 tall, staggered joints about every 1.6 tiles, `plank` with `plankLine` 0.03 lines. The rest, down to the front wall, is gạch bông. Use the board's `tile` pattern scaled to one grid tile (divide its numbers by 24), `patternUnits="userSpaceOnUse"`, origin at 0,0 so each viên gạch matches a grid tile. Floor x spans 0.5 to cols − 0.5 as today. Add a 0.1-tall `ink` band at 14% opacity under the back wall.
  - **Runner.** A `mat` strip 0.8 wide centred on the door column, from the bottom of the screen row to the front wall. Add `matLine` weave lines, two `terracotta` border lines and an `ink` 0.03 outline.
  - **Waiting-area mat.** x runs from the first seat x − 0.4 to the last seat x + 1.4, and y from the seat row − 0.2 to the seat row + 2.9, so it holds the bench and the tea table. Use `mat` with a `terracotta` inner border and an `ink` outline (board: the mat under the waiting bench).
  - **Back wall** (y 0–2). The face is `wall` with an `ink` 0.05 outline and a `wallDark` baseboard from y 1.65.
    - A louvre window: `tealLight` panes, `tealDark` slats, about 1.5 × 1.0, centred over the cabinet run.
    - A clock: `cream` r 0.3 at (cols / 2, 0.9), with hands.
    - A red lantern hanging over each work tile at x + 0.5: `lantern` body with `lanternDark` ribs, `mustard` caps and a tassel, about 0.65 tall.
  - **Bed slots.** For each slot: a dashed outline (`ink` at 50%, `cream` fill at 40%, dash 0.12 0.09) where the Task 4 `bed` texture would sit. That is a wall basin over y 1.3–1.9 and a frame 1.1 wide from y 1.9 to the bottom of the slot's third tile. Put a "+" in a `cream` circle r 0.3 with a `terracotta` ring at the centre of the middle tile.
  - **Side walls.** Strips at 0.3–0.5 and cols − 0.5 to cols − 0.3, in `wallDark` with an `ink` outline.
  - **Shop front** (front wall row). `glass` panes either side of the door opening with `tealLight` mullions every 0.7, a `tealLight` top rail and white glints. `wood` door posts, and a `terracotta` doormat in the opening.
  - **Street.** `sidewalk` with `sidewalkLine` joints, then `road` with a dashed `cream` centre line. Same heights as today.
- [ ] **Step 2: Verify.** `npm run build` exits 0. Screenshot at 402×874: the plank and gạch bông zones split at the screen row, one gạch bông per tile, the dashed slots show "+", the lanterns sit between the beds and the shop front is glass. Old furniture art is still drawn on top until Task 4. `console --errors` is empty.
- [ ] **Step 3: Commit.** `git add src/art/room.ts && git commit -m "Draw the style A room: planks, gach bong, wall and shop front"`

---

### Task 4: Furniture, decor and placement by runs

**Files:**
- Create: `src/art/furniture.ts` (the `FURNITURE` table and `furnitureTextures()` move here from `room.ts` and are redrawn)
- Modify: `src/art/room.ts` (drop the furniture code), `src/view/RoomView.ts`, `src/scenes/BootScene.ts` (import)

**Interfaces:**
- Consumes: `tileRuns`, `Grid.beds`, `seats`, `desks`, `plants`, `decor` (Task 1); `C` (Task 2).
- Produces: texture keys `bed`, `bench`, `desk`, `plant`, and `decor-<kind>` for every `DecorKind`. `FURNITURE: Record<string, { w: number; h: number }>` in tiles. `'chair-shampoo'` and `'seat'` are gone.

Each texture is anchored at the bottom-centre of its run, as `place()` does today. Footprints (w × h tiles) and what to draw, following the named board group:

| Key | w × h | Board group | Notes |
|---|---|---|---|
| `bed` | 1.1 × 3.7 | wall basins + shampoo beds | Basin on the wall face in the top 0.6: `cream` porcelain, `water` bowl, `cobalt` band, `mustard` tap. Then the `wood` frame with a `tealLight` mattress, a `cream` pillow at the head and a `woodDark` foot board with legs reaching the bottom edge. |
| `bench` | 3.2 × 1.35 | waiting bench | `wood` backrest bar along the top. `weave` seat with three `terracotta` cushions, `woodDark` end posts and legs. |
| `desk` | 3 × 1.3 | reception desk | `wood` top with a `woodLight` edge. `woodDark` front with three recessed panels. On top: a `cream` lotus vase with a `cobalt` band, a notebook with `terracotta` lines, and a `mustard` bell. No stool. |
| `plant` | 1 × 1.6 | plants by the shop window | Three `leaf`/`leafLight` leaves in a `cream` pot with a `cobalt` band. |
| `decor-screen` | 5 × 1.3 | rattan screen | `weave` panel between `woodDark` top and bottom rails. `wood` posts at 1/3 and 2/3, and taller end posts. |
| `decor-cabinet` | 3 × 1.5 | towel cabinet | A `woodLight` top shelf holding four rolled towels (`cream`, `tealLight`, `cream`, `terracotta`). A two-door `wood` cupboard with `woodDark` panels and `mustard` knobs. |
| `decor-shelf` | 3 × 1.3 | product shelf | `wood` shelf with `woodDark` cubbies. Bottles in `cobalt`, `tealLight`, `terracotta`, `mustard` with `cream` caps, plus a `cream` jar. |
| `decor-lotus` | 2 × 1.1 | lotus basin | `cobalt` body with a `cream` rim band, `waterDeep` water, two lily pads and a `lotus`/`lotusDark` flower. |
| `decor-vase` | 1 × 1.9 | peach blossom vase | `cream` vase with a `cobalt` band. `woodDark` branches with `lotus` blossoms. |
| `decor-tea` | 2 × 0.9 | tea table | Low `wood` table. A `cream` teapot with a `cobalt` band and two cups. |
| `decor-slippers` | 2 × 0.9 | slipper rack | Low `wood` rack holding three pairs: `tealLight`, `terracotta`, `mustard`. |
| `decor-planter` | 3 × 1.1 | none (spec 7.3) | Long `terracotta` box with a `woodDark` rim and a row of round `leaf`/`leafLight` shrubs. |

- [ ] **Step 1: Implement `src/art/furniture.ts`** with the table above and every texture outlined per Global Constraints.
- [ ] **Step 2: Implement placement in `RoomView`.**
  - For each bed tile `b`: `place('bed', b.x, b.x, b.y + 1)`, so the foot tile's bottom is the anchor.
  - Then for each `tileRuns` run: `bench` over the seats, `desk` over the desks, `plant` over the plants, and `decor-<kind>` over `decor[kind]`.
- [ ] **Step 3: Verify.** `npm test` passes; `npm run build` exits 0.
- [ ] **Step 4: Compare with the board.** Run `"$B" goto "file:///D:/Project/spa-indie-game/docs/art/style-a-board.svg"` and screenshot it, then screenshot the game at 402×874 and compare. Every board piece is present at its spec 7.3 tile, with the same colours and outlines. The screen opening lines up with the door, and nothing floats off its tiles. `console --errors` is empty.
- [ ] **Step 5: Commit.** `git add src && git commit -m "Add style A furniture and decor, placed by runs"`

---

### Task 5: Characters and the lying pose

**Files:**
- Modify: `src/art/chibi.ts`, `src/art/palette.ts` (`SKIN`, `HAIR`, `SHIRT`, `PANTS`, `OWNER_COLORS`), `src/view/CharacterView.ts`, `src/scenes/SpaScene.ts` (`syncCustomer`, owner facing in `update`)

**Interfaces:**
- Consumes: `C.ink` (Task 2); `Station.bed`, `Station.work` (Task 1).
- Produces: `type Pose = 'stand' | 'walk' | 'sit' | 'lie'`; part keys `face-rest` and `blanket` (in `PART_ANCHORS` like the other parts).

- [ ] **Step 1: Redraw the parts in `chibi.ts`.**
  - Outlines: every silhouette (leg, arm, body, head and ears, every hair shape) gets an `ink` stroke of 1.3 units; inner lines (mouth, collar, seam) 0.9. The fills stay white or grey so tinting still works.
  - Pad each viewBox by at least 0.7 units wherever a shape touches its edge, so outlines are not clipped. `PART_ANCHORS` follows automatically.
  - `body` gets a short band collar and a centre seam (áo bà ba), drawn in the shade grey.
  - Faces: eyes `#2B201C`, blush `#F09A86` at 0.75 opacity.
  - New `face-rest`: closed-eye arcs, blush, a small smile.
  - New `blanket`: not tinted. A `terracotta` rect 24 × 60 units with radius 5, a `cream` stripe 6 units below its top and an `ink` outline. viewBox origin at the top centre.
- [ ] **Step 2: Set the character palettes.**
  - `SKIN = [0xf7d5b8, 0xebc3a0, 0xd9a47e]`
  - `HAIR = [0x2b201c, 0x5b3a29, 0x7a4a2f, 0x9a5b36, 0xc98b5a]`
  - `SHIRT = [0xc65d3b, 0xe3a73b, 0x2d5fa8, 0xf28ca0, 0xfbf7ee]`. No teal, so the owner stands out (spec 7.2).
  - `PANTS = 0x3b2b26`
  - `OWNER_COLORS = { skin: 0xf7d5b8, hair: 0x2b201c, hairStyle: 0, shirt: 0x2f7d6e }`
- [ ] **Step 3: Implement the `'lie'` pose and use it.**
  - `CharacterView`:
    - Keep the shadow image as a field.
    - In `'lie'`, hide the shadow, legs, arms and body, and show a `blanket` image placed in the container before `upper`, top at `-1.1 * TILE`.
    - Shift `upper.y` so the head centre sits at `-1.45 * TILE` from the feet origin (the bottom of the bed's middle tile). That is `upper.y = -1.45 * TILE - HEAD_Y`.
    - The face uses `face-rest` while lying. `setPose` re-applies the current facing so the face texture follows on the way out of `'lie'`.
  - `SpaScene.syncCustomer`:
    - `lying = c.stationId !== null && c.path.length === 0` (on the bed, waiting for the owner or being served); `sitting = c.state === 'waiting'`.
    - Lying and sitting customers face down.
    - Depth is `p.y + TILE + 1` when lying (above the bed, whose anchor is one tile lower), `p.y + 1` when sitting, else `p.y`.
  - `SpaScene.update`: while `owner.task?.kind === 'serve'` and the owner's path is empty, the owner faces `'left'`, towards the bed.
- [ ] **Step 4: Verify** at 402×874 (`npm run build` exits 0 first):
  - The idle owner wears teal behind the desk; the counter hides the owner's legs.
  - `"$B" js "window.__spa.sim.spawnCustomer(); window.__spa.sim.advance(4000)"` and screenshot: the customer sits on the bench with outlines.
  - `"$B" js "const s=window.__spa.sim; s.tapTile(s.customers[0].seat); s.advance(9000); window.__spa.game.scene.getScene('ShampooScene').sys.setVisible(false)"` and screenshot.
    - The customer lies on bed 1 with the blanket and closed eyes, drawn over the bed.
    - The owner stands right of the bed, facing it.
  - `console --errors` is empty.
- [ ] **Step 5: Commit.** `git add src && git commit -m "Outline the characters and lay customers on the shampoo bed"`

---

### Task 6: FX and HUD

**Files:**
- Modify: `src/art/fx.ts`, `src/view/Hud.ts`, `src/scenes/SpaScene.ts` (patience bar, ripple tint, `floatMoney` stroke)

**Interfaces:**
- Consumes: `C` (Task 2), `textStyle` (Task 2). Texture keys and sizes are unchanged, so callers keep their scales.

- [ ] **Step 1: Redraw `fx.ts`** (1 px per unit; outline 4, inner 2.5):
  - `coin`: `mustard` disc with an `ink` outline, a `mustardDark` inner ring, and a `paper` square hole with an `ink` outline (board: HUD coin).
  - `shadow`: `ink` at 18%.
  - Bubbles: `cream` frame with an `ink` outline. Happy is a `lotusDark` heart. OK is a `mustard` face with `ink` features. Angry is a `lantern` face with `cream` features.
  - `star`: `mustard` fill, `ink` stroke 6. `star-empty`: `#EADBC4` fill, `#C9B49A` stroke.
  - `ripple`: unchanged.
  - Nav icons: copy the board's four icon groups (HUD, bottom nav) into the existing 64-unit viewBoxes, `ink` stroke 2.6.
- [ ] **Step 2: Restyle `Hud.ts` and `SpaScene`** (geometry unchanged unless stated):
  - **Top bar.** `paper` fill with a 4 px `ink` stroke. The day/time label is weight 600 in `ink`.
  - **Pause.** A `teal` circle with a 4 px `ink` stroke and `paper` bars. The overlay is `0x2b201c` at 0.6 with `paper` text.
  - **Bottom bar.** `paper` with a 4 px `ink` stroke. Each nav button is a `cream` circle r 62 with a `cobalt` 5 px ring and an inner `cobalt` 2 px ring at r 52. Drop `NAV.bg`. Labels are weight 600 in `ink`.
  - **Hint.** A `paper` pill, radius 12, with a 4 px `ink` stroke.
  - **Toast.** An `ink` pill with `paper` text.
  - **Patience bar.** A `paper` pill with a 3 px `ink` stroke. The fill is `green` above 50%, `mustard` above 25%, else `lantern`.
  - **Ripple.** No tint, so it draws white as on the board.
  - **`floatMoney`.** Text stroke is `cream`.
- [ ] **Step 3: Verify** at 402×874 (`npm run build` exits 0 first):
  - Screenshot the default HUD and compare it with the board.
  - Run `"$B" js "window.__spa.sim.money = 9999999; window.__spa.sim.day = 100"` and screenshot. "9.999.999 đ", the star and rating, and "Ngày 100 · 08:00" do not touch. If anything overlaps, lower that text's size in 4 px steps until it clears.
  - Seat a customer as in Task 5 and screenshot: the patience bar and the white ripple show.
  - `console --errors` is empty.
- [ ] **Step 4: Commit.** `git add src && git commit -m "Restyle effects and HUD in style A"`

---

### Task 7: Mini-game, summary and palette cleanup

**Files:**
- Modify: `src/art/shampooArt.ts`, `src/scenes/ShampooScene.ts`, `src/scenes/SummaryScene.ts`, `src/art/palette.ts` (delete the legacy block)

**Interfaces:**
- Consumes: `C`, `textStyle` (Task 2). Mini-game texture keys, sizes and the `SH_HAIR` zone are unchanged, so hit tests do not move.

- [ ] **Step 1: Redraw `shampooArt.ts`** with outlines:
  - `sh-basin`: `cream` porcelain with a `cobalt` band, `water`/`waterDeep` water and a `wood` headrest with a `tealLight` pad.
  - `sh-head`: outlined, blush `#F09A86`.
  - `sh-hair`: outlined, with shade strands.
  - `sh-foam`: white with a thin `ink` outline at 40%.
  - `sh-drop`: `waterDeep` with an outline.
  - `sh-towel`: `terracotta` with `cream` stripes.
  - `sh-shower`: a `mustard`/`mustardDark` brass head and handle.
- [ ] **Step 2: Restyle the scenes.**
  - `ShampooScene`: the card is `paper` with a 4 px `ink` stroke and the dim layer is `0x2b201c` at 0.6. The progress bar is a `#EADBC4` track with a `teal` fill; the time bar is a `#EADBC4` track with a `mustard` fill.
  - `SummaryScene`: the card is `paper` with a 4 px `ink` stroke, dividers are `tileSeam`, labels are weight 600 in `ink`, and the button is `teal` with a 4 px `ink` stroke and `paper` text.
- [ ] **Step 3: Delete the legacy block from `C`.** Expected: `npm run build` exits 0, which proves no file still uses a pastel key.
- [ ] **Step 4: Verify.**
  - Bring a customer into service as in Task 5 (without hiding the scene) and screenshot the card.
  - Run `"$B" js "window.__spa.game.scene.getScene('ShampooScene').__finishForTest(3)"` and screenshot the stars.
  - Run `"$B" js "window.__spa.sim.advance(900000)"` and screenshot the summary.
  - `console --errors` is empty.
- [ ] **Step 5: Commit.** `git add src && git commit -m "Restyle the shampoo mini-game and summary, drop the pastel palette"`

---

### Task 8: Whole-game check

**Files:** none unless a check fails. Fix the cause in the owning task's file and commit it with that task's message style.

- [ ] **Step 1: Run the automated checks.** `npm test` passes and `npm run build` exits 0.
- [ ] **Step 2: Serve one customer end to end at 402×874** through the dev hooks: spawn, `tapTile` the seat, advance, `__finishForTest(3)`.
  - Screenshot each stage: walking in, seated, on the bed under the mini-game card, stars, then the coin pop and the happy bubble as they leave.
  - `console --errors` is empty.
  - Real touch on the mini-game is unchanged by this plan and is checked by anh in Step 4.
- [ ] **Step 3: Play a whole day.**
  - Run `"$B" js "window.__spa.sim.advance(900000)"`, screenshot the summary, press "Ngày mới" and screenshot day 2 at 08:00.
  - Run `"$B" viewport 874x402` and screenshot. The game is letterboxed in sand, the HUD is fully visible and nothing is stretched.
- [ ] **Step 4: Hand over for the iPhone.** Give anh the LAN URL (`Network:` line of the dev server) to play a day on the iPhone 17. Name what is unverified until then: touch feel, Safari font rendering and pacing by hand.
