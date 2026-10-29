# Xoay đồ lô B: beds turn four ways (save v31) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every bed kind gets the four facings that lô A gave the long pieces.
- Lying across the floor, the customer's tile is the second tile from the bed's head, on its top row.
- The work tile is right behind that tile (above it), so the owner and technicians stand behind the bed, facing down.
- A turned shampoo bed brings its own standing basin, so it does not need the back wall. A bed standing up the floor still does.
- The customer lies along the turned bed with their head at its head. In the foot chair and at the nail desk they sit toward the head end, facing away from it.
- Save version 31.

**Architecture:**
- **One rule decides which kinds turn.** `canTurn` opens to every bed. From that, `nextFacing`, `itemTexture(kind, turned)`, `parseShop` and the Xoay button all give beds four facings with no change of their own.
- **Facing-aware helpers in `items.ts`** do the geometry; the scene only applies it:
  - `bedTile` and `workTile` follow the facing;
  - `headSide(item)` is the unit step from the customer's tile toward the head;
  - `bedCentreOffset(item)` is the piece's centre measured from the customer's tile;
  - `workFacing(station)` is the way someone at the work tile faces;
  - `isUpright(item)` is true only for a turned piece that is not a bed.
- **The grid tells which way a customer steps onto a bed.** If the cell above the bed tile is `'work'`, the step is vertical; otherwise it is horizontal, as now. `onBed` reads that.
- **Eight new bed pictures.** The steam tent is round and keeps its picture under the `-turned` key.

**Tech Stack:** Phaser 4, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-29-xoay-do-design.md`. Lô B covers:
- §4.1 (the bed column of the table);
- §4.2 (beds now get all four facings);
- §4.6;
- §4.7, the lô B line;
- §7 and §8 for lô B.

**OSS research** (CLAUDE.md rule, done for the spec, §6):
- Stardew Valley gives each piece its own sprite per rotation.
- The Habbo emulator Arcturus swaps width and length when a piece turns sideways.
- We take the ideas only. The code is our own.

**Baseline:**
- 1502 tests in 116 files pass on `xoay-do` at 3d676e9. That is master e39f596 (lô A, save v30) plus the v30 fixture.
- Commands:
  - typecheck: `npx tsc --noEmit`;
  - tests: `npx vitest run`;
  - build: `npx vite build --outDir .superpowers/dist-check`.
- `tests/fixtures/save-v30.json` was written by master e39f596. It holds:
  - the main shop, items 1–17, with the screens and desk as 15–17 and the cabinet (id 3) turned at (1,7);
  - the beach branch.
- Never edit that fixture.

## Global Constraints

**Facings for beds** (spec §4.1 table, bed column):

| `turned` | `flip` | Bed |
|---|---|---|
| no | no | standing up the floor, head on top, work tile on the right (as now) |
| yes | no | lying across, head on the left, work tile behind |
| no | yes | standing up the floor, work tile on the left (as now) |
| yes | yes | lying across, head on the right, work tile behind |

**Tiles and placement:**
- A turned bed's footprint is `h × w`.
- The customer's tile is on the top row, the second column from the head.
- The work tile is directly above the customer's tile. So a turned bed cannot stand against the back wall: its work tile would be on the wall, and `offFloor` already refuses that as `'overlap'`.
- A turned shampoo bed has a standing basin on legs at its head end and needs no wall. A shampoo bed standing up the floor still needs its head against the back wall (`'bedWall'`).

**Drawing:**
- The lantern hangs only over a shampoo bed standing up the floor, on floor 1. A turned bed has none. Lô A's `hide()` already hides a turned piece's part.
- The lying customer reuses today's lying figure, turned 90° so the head lies toward the bed's head. Mask, towel and blanket turn with it.
- These follow the facing:
  - the half-tile shift in the mud tub;
  - the steam over the tent;
  - the hot stones on the back;
  - the foot chair, where the customer faces the basin;
  - the nail desk's stool.
- A customer steps between the work tile and a turned bed vertically. `onBed` and the draw order follow the bed's facing.

**Pictures and save:**
- 8 bed kinds get a new across-the-floor picture. The steam tent reuses its picture, and only its work tile changes.
- Save v31. A lô A build (v30) refuses a shop with a turned bed because the save is newer.

**What must not change:**
- The mini-games are untouched.
- A shop saved at v30 opens with nothing changed but `v`. Its beds stand up the floor as before.
- Square pieces that are not beds (the vase, plant, jar…) still only mirror.
- Pieces turned in lô A keep their upright drawing, depth and seat facing.
- No feature beyond the spec. Match the surrounding code style. Commit messages are one plain sentence saying what the game now does, with no attribution lines.

## Review Focus

1. **A turned bed pushed against the back wall, or with its work tile on another piece:** it is refused ('overlap'), never placed with an unreachable work tile. Tests are in Task 2.
2. **A turned bed whose work tile is sealed off by other furniture:** it is refused ('blocksPath'). Task 2.
3. **A customer, the owner and a hired technician all complete a service on a turned bed:** walk in, lie down, get served, pay, leave. Task 2.
4. **A shop saved at v30, the main shop and its branch:** it opens exactly as saved, with its vertical beds and its upright cabinet unchanged. Task 2.
5. **A turned bed on floor 2:** it places and is served like one on floor 1. Task 2.

---

### Task 1: Across-the-floor pictures for the beds

**Files:**
- Modify: `src/art/furniture.ts`
- Test: `tests/art/furniture.test.ts`

**Interfaces:**
- Consumes `ITEMS`, `ITEM_KINDS` and `itemTexture(kind, turned)` from lô A.
- Produces one `FURNITURE` entry per bed kind, keyed `${itemTexture(kind)}-turned`. The kinds are `bed, maskBed, massageBed, steamTent, stoneBed, mudTub, scrubBed, footChair, nailDesk`.
  - `furnitureTextures()` already loads every entry.
  - `itemTexture` will hand these keys out once Task 2 lets beds turn.
  - Until then the entries are unused, and every existing test stays green.

- [ ] **Step 1: Write the failing tests** in `tests/art/furniture.test.ts`:

```ts
it('draws every bed lying across the floor, as wide as its turned footprint', () => {
  const beds = ITEM_KINDS.filter(k => ITEMS[k].group === 'bed')
  expect(beds).toHaveLength(9)
  for (const kind of beds) {
    const across = FURNITURE[`${itemTexture(kind)}-turned`]
    expect(across, kind).toBeDefined()
    expect(across.w, kind).toBeGreaterThanOrEqual(ITEMS[kind].h)
    expect(across.w, kind).toBeLessThanOrEqual(ITEMS[kind].h + 0.2)
    expect(across.h, kind).toBeGreaterThanOrEqual(ITEMS[kind].w)
    if (kind === 'steamTent') expect(across).toEqual(FURNITURE[itemTexture(kind)])
    else expect(across.body, kind).not.toBe(FURNITURE[itemTexture(kind)].body)
  }
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/art/furniture.test.ts`
Expected: FAIL, no `bed-turned`.

- [ ] **Step 3: Draw the 8 across bodies in `furniture.ts`.**
  - Put each one next to its standing version, with a one-line comment like the others.
  - `steamTent-turned` is the same `{ w, h, body }` as `steamTent`.
  - The view rules are the ones the beds already use:
    - seen from the front and above;
    - the bottom-centre anchor (RoomView sets the bottom of the footprint's last row);
    - the head drawn on the **left**, since `setFlipX` gives the head-right facing;
    - the existing palette, `ink`/`FINE` strokes and `rect` helpers, reusing the standing pictures' parts where they fit.
  - What each picture shows (the customer's tile is the second column from the left, top row):
    - **bed** (shampoo): the bed lying left to right on a wood frame. At its head end, a standing basin of water on two legs, inside the head tile. A cushion under the head and the folded towel at the foot.
    - **maskBed:** the mint recliner lying across, its raised back at the left.
    - **massageBed:** the cream-sheeted table with the face hole at the left and the rolled towel at the right.
    - **stoneBed:** the massage table with the four stones in a row along the sheet.
    - **scrubBed:** the face cradle at the left and the bowl of salt at the right.
    - **mudTub:** the round tub, three tiles wide and two deep, full of mud, with the head towel at the left.
    - **footChair:** the armchair seen from its side on the left tile, facing right, and the basin of herb water on the right tile.
    - **nailDesk:** the customer's padded stool on the left tile's top row. Over the right column, the low table with the hand cushion near the top, the lamp and three bottles. The technician will stand behind it, above the footprint.
  - Sizes: `w` is the turned length plus up to 0.2. `h` is the turned depth plus the height the front rises, like the standing beds' extra.

- [ ] **Step 4: Look at the art.** Render the 8 new textures and the 9 standing ones side by side to PNG, as lô A Task 5 did with headless Chrome, and view them. Do not commit throwaway files.

- [ ] **Step 5: Run the suite.**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/art/furniture.ts tests/art/furniture.test.ts
git commit -m "Draw each bed lying across the floor, head to the left, the shampoo bed with a standing basin, the foot chair beside its basin and the nail stool beside its table"
```

---

### Task 2: Beds turn in the sim, save v31

**Files:**
- Modify: `src/sim/items.ts` (`canTurn`, `bedTile`, `workTile`, and new `headSide`, `bedCentreOffset`, `workFacing`, `isUpright`)
- Modify: `src/sim/grid.ts` (`onBed`)
- Modify: `src/sim/build.ts` (`bedWall` only when not turned)
- Modify: `src/sim/save.ts` (`SAVE_VERSION = 31`, accept 30)
- Modify: `src/view/RoomView.ts` (one line: the upright depth uses `isUpright`)
- Test: `tests/sim/items.test.ts`, `tests/sim/grid.test.ts`, `tests/sim/build.test.ts`, `tests/sim/save.test.ts`, the spa and staff tests (see Step 1), `tests/art/furniture.test.ts` (two lô A tests narrowed)

**Interfaces:**
- Consumes `size`, `nextFacing`, `claimed`, `offFloor`, `placeProblem` and `parseShop`'s `canTurn` filter from lô A, and the Task 1 textures.
- Produces:
  - `canTurn(kind)`: `group === 'bed' || w !== h`.
  - `bedTile(item)` and `workTile(item)` by facing. For a turned bed of turned width `W`:
    - the customer's tile is `{ x: flip ? x + W − 2 : x + 1, y }`;
    - the work tile is that tile's `{ x, y: y − 1 }`.
    - Unturned beds are unchanged.
  - `headSide(item: Item): Vec`: `{0,−1}` unturned, `{−1,0}` turned, `{1,0}` turned and flipped.
  - `bedCentreOffset(item: Item): Vec`: the footprint's centre minus the bed tile's centre, in tiles: `{ x: item.x + W/2 − (bed.x + 0.5), y: item.y + H/2 − (bed.y + 0.5) }` with `size(item)`.
  - `workFacing(s: { bed: Tile; work: Tile }): Facing`:
    - `'down'` when the work tile is above the bed tile;
    - else `'left'` when the bed is left of the work tile;
    - else `'right'`.
  - `isUpright(item: Item): boolean`: `item.turned === true && ITEMS[item.kind].group !== 'bed'`.
  - `onBed(grid, p)` decides the step axis per bed:
    - **vertical** when `grid.cells[b.y − 1]?.[b.x] === 'work'`: `|p.x − b.x| < 0.5 && |p.y − b.y| < 0.5`, so a customer coming from the work tile behind is on the bed once their feet cross onto its row;
    - **horizontal** otherwise, as now.

- [ ] **Step 1: Write the failing tests.**

```ts
// tests/sim/items.test.ts
it('turns every bed four ways, the customer second from the head and the work tile behind', () => {
  const at = (kind: ItemKind, turned: boolean, flip: boolean): Item => ({ id: 1, kind, x: 4, y: 8, flip, ...(turned && { turned }) })
  const tiles = (i: Item) => [bedTile(i), workTile(i), headSide(i)]
  expect(tiles(at('bed', false, false))).toEqual([{ x: 4, y: 9 }, { x: 5, y: 9 }, { x: 0, y: -1 }])
  expect(tiles(at('bed', true, false))).toEqual([{ x: 5, y: 8 }, { x: 5, y: 7 }, { x: -1, y: 0 }])
  expect(tiles(at('bed', true, true))).toEqual([{ x: 5, y: 8 }, { x: 5, y: 7 }, { x: 1, y: 0 }])
  expect(tiles(at('footChair', true, false))).toEqual([{ x: 5, y: 8 }, { x: 5, y: 7 }, { x: -1, y: 0 }])
  expect(tiles(at('footChair', true, true))).toEqual([{ x: 4, y: 8 }, { x: 4, y: 7 }, { x: 1, y: 0 }])
  expect(tiles(at('nailDesk', true, true))).toEqual([{ x: 4, y: 8 }, { x: 4, y: 7 }, { x: 1, y: 0 }])
  expect(footprint(at('mudTub', true, false))).toHaveLength(6)
  expect(size(at('mudTub', true, false))).toEqual({ w: 3, h: 2 })
  expect(bedCentreOffset(at('mudTub', false, false))).toEqual({ x: -0.5, y: 0 })
  expect(bedCentreOffset(at('mudTub', false, true))).toEqual({ x: 0.5, y: 0 })
  expect(bedCentreOffset(at('mudTub', true, false))).toEqual({ x: 0, y: 0.5 })
  expect(bedCentreOffset(at('steamTent', false, false))).toEqual({ x: -0.5, y: -0.5 })
  expect(bedCentreOffset(at('steamTent', true, false))).toEqual({ x: -0.5, y: 0.5 })
  expect(workFacing({ bed: { x: 5, y: 8 }, work: { x: 5, y: 7 } })).toBe('down')
  expect(workFacing({ bed: { x: 4, y: 9 }, work: { x: 5, y: 9 } })).toBe('left')
  expect(workFacing({ bed: { x: 4, y: 9 }, work: { x: 3, y: 9 } })).toBe('right')
  expect(ITEM_KINDS.filter(k => ITEMS[k].group === 'bed').every(canTurn)).toBe(true)
  expect([isUpright(at('bed', true, false)), isUpright({ id: 2, kind: 'bench', x: 2, y: 9, flip: false, turned: true })]).toEqual([false, true])
})
// tests/sim/grid.test.ts
it('steps onto a turned bed from behind it, and onto a standing bed from its side', () => {
  const across: Item = { id: 30, kind: 'massageBed', x: 4, y: 9, flip: false, turned: true }
  const grid = buildGrid(shellOf(SPA_LAYOUT_1A), [...DEFAULT_ITEMS, across])
  expect([onBed(grid, { x: 5, y: 8.4 }), onBed(grid, { x: 5, y: 8.6 }), onBed(grid, { x: 5.6, y: 9 })]).toEqual([false, true, false])
  expect(onBed(grid, { x: 2.5, y: 3 })).toBe(true) // the default shampoo bed at x 2, customer tile (2,3), stepped onto from (3,3)
})
// tests/sim/build.test.ts
it('places a turned shampoo bed mid-room, never against the back wall, and keeps the wall rule for a standing one', () => {
  const shell = shellOf(SPA_LAYOUT_1A)
  const extras = { door: { x: 6, y: 17 }, floors: 1 }
  const bed = (x: number, y: number, turned: boolean): Item => ({ id: 30, kind: 'bed', x, y, flip: false, ...(turned && { turned }) })
  expect(placeProblem(shell, DEFAULT_ITEMS, bed(4, 9, true), extras)).toBeNull()
  expect(placeProblem(shell, DEFAULT_ITEMS, bed(6, 2, true), extras)).toBe('overlap')
  expect(placeProblem(shell, DEFAULT_ITEMS, bed(4, 9, false), extras)).toBe('bedWall')
})
```
- **Also in `build.test.ts`, the sealed-off work tile (Review Focus 2):**
  - A turned massage bed at (4,9) is fine on its own.
  - Add pieces that wall in its work tile (5,8). Pick them from the real layout so that only the reach rule fires.
  - Then the bed gives `'blocksPath'`.
- **Also in `build.test.ts`, floor 2 (Review Focus 5):** a turned massage bed on an open floor 2 places, with `floors: 2` and a free row below the floor's top wall. Use the stairs tests' floor-2 set-up.
- **In `save.test.ts`:**
  - `SAVE_VERSION` is 31.
  - `parseSave(structuredClone(v30))` equals the fixture with `v: 31` and nothing else changed, for the main shop and the branch. Follow the v28 test's `withNewKeys` pattern; there are no new keys this time.
  - The cabinet keeps `turned: true`, and a turned bed added to the save keeps `turned: true`.
  - Lô A's test that dropped `turned` from a bed now drops it only from a square piece that is not a bed. Narrow it; do not delete it.
- **Spa and staff tests (Review Focus 3):** find the existing test that walks a customer through a service on the default shop to payment, and the one where a hired technician serves. Grep `tests/sim/` for `pays` / `paid` / `technician`. Add a twin of each, with the shop's service bed replaced by a turned one at a free mid-room spot:
  - the customer reaches the bed tile;
  - whoever serves stands on the work tile;
  - the customer pays.
- **Lô A tests that say a bed only mirrors now expect the four facings.** These are the `canTurn` kind list in `items.test.ts`, any `nextFacing` test on a bed, and any `itemTexture(bed, true)` check. Narrow or update each one; do not delete it.
- **In `tests/art/furniture.test.ts`:** lô A's "upright picture for every piece that turns … toHaveLength(17)" now filters `canTurn(k) && ITEMS[k].group !== 'bed'`. "Keeps one picture for every piece that only mirrors" stays as it is; beds have simply left that list.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim tests/art`
Expected: FAIL. `headSide` is not exported, the turned bed tiles are wrong, and `SAVE_VERSION` is 30.

- [ ] **Step 3: Implement.**
  - Use the signatures in Interfaces.
  - `placeProblem`'s `bedWall` line gains `&& !item.turned`, and its comment says the standing basin.
  - `parseVersioned` accepts `raw.v === 30`.
  - In `RoomView.sync`, the depth line uses `isUpright(item)` instead of `item.turned`, so a turned bed draws by its bottom row like any lying piece.
  - Update the doc comments of `canTurn`, `bedTile`, `workTile` and `onBed` to say the turned case.

- [ ] **Step 4: Run the suite and the build.**

Run: `npx vitest run && npx tsc --noEmit && npx vite build --outDir .superpowers/dist-check`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/sim/items.ts src/sim/grid.ts src/sim/build.ts src/sim/save.ts src/view/RoomView.ts tests/
git commit -m "Let every bed lie across the floor too, its customer second from the head and its work tile behind, a shampoo bed with its standing basin free of the wall, in save version 31"
```

---

### Task 3: Customers, the owner and technicians at a turned bed

**Files:**
- Modify: `src/scenes/SpaScene.ts`:
  - the owner's facing (~1089);
  - `machineBeds` (~931);
  - `syncCustomer`: lying, mud tub, steam, stones, seated.
- Modify: `src/view/StaffLayer.ts` (the facing at work, ~146).
- Modify: `src/view/CharacterView.ts` only if turning the lying figure needs a hook there.

**Interfaces:**
- Consumes `headSide`, `bedCentreOffset`, `workFacing`, `size` and `onBed` from Task 2, and the station list (`sim.stations`, whose `id` is the bed item's id).
- Produces no new API.

- [ ] **Step 1: Implement**, keeping every standing bed exactly as today:
  - **At the work tile:** the owner (SpaScene) and staff (StaffLayer) face `workFacing(station)`.
  - **`machineBeds`:** the off mark's top-centre tile uses `size(i).w`.
  - **Lying on a turned bed:** the customer's figure turns about the bed tile's centre, by −90° when `headSide.x` is −1 and +90° when it is +1, so the head lies toward the bed's head.
    - The mask, the mud towel and anything else drawn as part of the figure turn with it.
    - The lying facing values (`'up'` for massage, stone and scrub; `'down'` otherwise) stay as they are.
  - **Mud tub:** the customer shifts by `bedCentreOffset(item)` tiles, replacing the `tub.work.x > tub.bed.x` rule. It gives the same half tile for a standing tub, and half a tile down for a turned one.
  - **Steam tent:** the steam's centre is `x = p.x + offset.x · TILE` and `y = p.y + (offset.y + 0.5) · TILE − TENT_KNOB_TILES · TILE`, with `offset = bedCentreOffset(tent item)`. That gives today's position for a standing tent.
  - **Hot stones:** they turn with the customer, about the same centre, so they stay along the back.
  - **Seated at the foot chair or nail desk:** the lift moves the customer one tile along `headSide`. That is up today, and left or right on a turned piece. They face away from the head: `'down'` today, `'right'` when the head is left, `'left'` when it is right.
  - **Draw order:** a customer stepping onto a turned bed from the work tile behind it draws behind the bed until `onBed` is true, then over it. Check that the depth `onBed` gives still covers a one-row turned bed and the two-row turned tub.

- [ ] **Step 2: Run the suite and the build.**

Run: `npx vitest run && npx tsc --noEmit && npx vite build --outDir .superpowers/dist-check`
Expected: all pass, the build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/SpaScene.ts src/view/StaffLayer.ts src/view/CharacterView.ts
git commit -m "Lay the customer along a turned bed with their head at its head, sit them toward the head of a turned foot chair or nail desk facing away from it, and stand whoever serves behind the bed facing down"
```

The browser check after the final review covers how this looks, with every bed kind in each facing beside its master counterpart.
