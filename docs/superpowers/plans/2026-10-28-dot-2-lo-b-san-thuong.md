# Đợt 2 Phần 4 Lô B: Sân thượng Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Once floor 2 is open, the player can open the rooftop for 4.000.000 đ.

- It is drawn in gạch tàu, with sky, a water tank, a towel line and bougainvillea.
- A pigeon coop sits over its stairs.
- It has its own third pill.
- Up to 7 technicians can work.
- The save format is unchanged.

**Architecture:** Lô A already put the rooftop in the rules: rows 36–53 of the tall grid, `FLOOR_PRICE[3]`, the `'order'` problem, and `staffCap` 3 → 5 → 7. Lô B is mostly the view:

- a `room-3` texture and a `coop` texture in `src/art/floors.ts`;
- `RoomView` showing them on floor 3;
- a third pill;
- a per-floor text on the open card.

Task 1 pins the rooftop rules with tests and fixes whatever they catch. Two leftovers from lô A ride along: toasts wider than the screen, and shampoo-bed lanterns on upper floors.

**Tech Stack:** TypeScript, Phaser ^4.2.1 (view only), Vite ^8.3, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-2-tang-design.md`, Lô B (§9), approved 2026-10-28. Rooftop look §7.1, coop §7.2, pills §7.3, open card §7.4, staff §7.7.

**Branch:** `dot-2-tang-b` in worktree `.superpowers/worktrees/dot-2-tang-b`, cut from master after this plan's commit.

## Global Constraints

- **Layering:** `src/sim/**` never imports Phaser, `src/view/**`, `src/scenes/**`, `src/art/**` or `src/audio/**`.
- **Text:** all player-facing text lives in `src/strings/vi.ts`, in Vietnamese with full diacritics. Money goes through `formatMoney`.
- **Numbers stay as lô A set them:**
  - `FLOOR_PRICE = { 2: 2_000_000, 3: 4_000_000 }`
  - `MAX_FLOORS = 3`
  - `STAIRS_MS = 1000` per floor climbed
  - technicians max `3 + 2 × (floors − 1)`, so 7 with the rooftop
  - receptionist stays 1
- **No save change:** `SAVE_VERSION` stays 14.
- **Rooftop look (§7.1):**
  - Gạch tàu floor.
  - Behind: sky, far roofs, a steel water tank, a towel line and a low wall.
  - In front: a low wall with bougainvillea hanging over it, and the neighbour's tin roof below.
  - Same 13 × 18 inner layout and brown outline as the other floors.
  - Every colour comes from palette `C`. The art test enforces this.
- **Coop (§7.2):** the pigeon coop covers the rooftop's three stairs cells. Anyone entering the stairs there disappears behind it. The rooftop shows no stairs sprite and no rope.
- **Pills (§7.3):**
  - Three pills: Tầng 1, Tầng 2, Sân thượng.
  - Each is 320 × 96, with a gap of 24, centred on (540, 1855).
  - A locked pill has a dashed edge, a lock and its price.
- **Open card (§7.4):**
  - It shows the floor's own name and two lines.
  - "Mở · {price}" and "Để sau".
  - The rooftop before floor 2 shows the note "Mở tầng 2 trước" and no open button.
  - When money is short, the button is dimmed with "Còn thiếu …".
- **Commits:** plain English subject lines in the repo's style, no attribution lines. Never stage `CLAUDE.md`.

## Review Focus

1. **Someone walking down from the rooftop** rises toward the coop and fades, and must pass behind it, never over it. A person standing on the foot (11, 46) is drawn in front of it.
2. **A long toast**, such as the stairs refund line of 1036 px, must stay inside the 1080 canvas, with its rounded ends visible.
3. **Build mode's hold row** shows three pills. Carrying a piece to the rooftop works like carrying it to floor 2. A locked pill in the hold row does nothing.
4. **Seven technicians** need seven distinct places to wait on floor 1, away from the desk spot and the stairs foot.
5. **A customer led from floor 1 to a bed on the rooftop** climbs twice (2 × `STAIRS_MS`) and passes through floor 2 on the way.
   - With the rooftop open, the view follows the owner each time a floor is reached.

---

### Task 1: Rooftop rules pinned by tests

**Files:**
- Test: `tests/sim/spa-floors.test.ts`
- Modify (only if a test fails): `src/sim/**`

**Interfaces:**
- Consumes: `SpaSim.openFloor(floor)`, `floorProblem(floor)`, `maxFloors()`, `staffCap(role, floors)`, `homeOf(h, s)`, `toSave()`, `parseSave`, `SpaSim.fromSave`, and the helpers already in `tests/sim/spa-floors.test.ts`.
- Produces: nothing new. This task shows the lô A rules hold for the rooftop.

- [ ] **Step 1: Write the tests.** Put them in `describe('the rooftop', …)`:
  - **"opens only after floor 2, for 4.000.000 đ":**
    - On day 6 with 10 000 000 đ and `floors = 1`, `floorProblem(3)` is `'order'`.
    - After `openFloor(2)`, `openFloor(3)` returns null, `floors` is 3, and money has fallen by 2 000 000 + 4 000 000.
    - `floorProblem(3)` is then `'max'`.
  - **"takes up to seven technicians":** with `floors = 3`, a hire goes through while there are fewer than 7 technicians, and the 8th technician is refused as full. Use the same hire path the existing 5-technician test uses.
  - **"gives seven technicians seven homes on floor 1":**
    - With `floors = 3` and 7 technicians, every `homeOf` is on floor 1 (`floorOf(y) === 1`).
    - No two homes are equal.
    - None equals the receptionist's spot or a stairs foot.
  - **"leads a customer from floor 1 to a bed on the rooftop, through floor 2":**
    - With `floors = 3`, a massage bed at (6, 38) is the only massage bed, and a massage customer is waiting.
    - Run the shop until that customer is `inService` on that bed.
    - On the way, the person leading them has a position on floor 2 at some step.
    - It takes at least `2 × STAIRS_MS` longer than leading the same customer to a bed at (6, 2) in an otherwise equal shop.
  - **"keeps the rooftop through a save":**
    - Take a shop with `floors = 3` and a `mudTub` at (2, 39).
    - Run it through `toSave()` → JSON → `parseSave` → `SpaSim.fromSave`.
    - The result has `floors` 3 and the tub at (2, 39).
- [ ] **Step 2: Run them.** `npx vitest run tests/sim/spa-floors.test.ts`
  - Expected: they pass.
  - If one fails, that is a real lô A gap for the rooftop. Fix it minimally in `src/sim/**` and keep the test.
- [ ] **Step 3: Commit.** `git commit -m "Pin the rooftop rules: opens after floor 2, seven technicians with homes on floor 1, a walk up two flights, and the save"`

### Task 2: Rooftop and coop art

**Files:**
- Modify: `src/art/floors.ts`, `src/art/palette.ts`
- Test: `tests/art/floors.test.ts`

**Interfaces:**
- Consumes: `rect`, `outline`, `FINE`, `STREET_TILES` (`src/art/room`), `svgDoc` (`src/art/svg`), `C` (`src/art/palette`).
- Produces: `floorTextures()` also returns:
  - `'room-3'`: the rooftop, same frame as `'room-2'`, viewBox `0 0 13 20`, top-left at the map origin.
  - `'coop'`: viewBox `0 0 1.5 4`. Its top-left goes at local tile (10.75, 6), so its bottom edge is the top of the foot row (local row 10).
- `BootScene` already loads everything `floorTextures()` returns.

- [ ] **Step 1: Write the failing tests** in `tests/art/floors.test.ts`:
  - The keys, sorted, are `['coop', 'room-2', 'room-3', 'stairs', 'stairsRope']`.
  - `viewBox(textures['room-3'])` equals the floor-1 room's viewBox.
  - `viewBox(textures.coop)` is `'0 0 1.5 4'`.
  - `room-3` fills its floor with a pattern named `gachtau`, i.e. it contains `fill="url(#gachtau)"`.
  - The existing palette test, that every `#rrggbb` is in `C`, covers the two new textures too.
- [ ] **Step 2: Run them.** `npx vitest run tests/art/floors.test.ts`. Expected: FAIL, because the keys are missing.
- [ ] **Step 3: Implement `roofRoom()` and `coop()` in `src/art/floors.ts`.**
  - Port them from the approved sketch's `roofRoom`, `bougain` and `hutArt`, in the scratchpad file `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\d602ec46-bce2-4f0a-a881-7f89225bdd38\scratchpad\sketch\template.html` (lines 169–223). Use the same structure as `floor2Room()` already in the file.
  - The sketch's `R` is `rect` and its `O` is `outline`.
  - For every colour literal in the sketch:
    - use the existing `C` entry where the value matches;
    - otherwise add a named entry to `C` with the sketch's exact value: sky clouds, the steel tank and its rib, the tin roof and its rib, the three gạch tàu shades, the bougainvillea pink, and the coop's dark doorway and steps. Reuse `C` step colours where the lô A stairs already did.
  - Keep the sketch's seeded `bougain` so the vines look the same on every load.
- [ ] **Step 4: Run the tests again.** `npx vitest run tests/art` → PASS.
- [ ] **Step 5: Commit.** `git commit -m "Draw the rooftop in gạch tàu with sky, water tank, towel line and bougainvillea, and a pigeon coop for its stairs"`

### Task 3: The rooftop on screen, and lanterns only on floor 1

**Files:**
- Modify: `src/view/RoomView.ts`, `src/view/StaffLayer.ts` and the customer drawing in `src/scenes/SpaScene.ts`, only as needed for the coop depth.

**Interfaces:**
- Consumes: textures `'room-3'` and `'coop'` (Task 2); `RoomView.setFloor(floor, floors, maxFloors)`, `rowY`, `ITEM_DEPTH_BIAS`, `climbPose`.
- Produces: `RoomView.setFloor(3, …)` draws the rooftop.

- [ ] **Step 1: Room texture per floor.** `setFloor` sets the room texture to `'room'`, `'room-2'` or `'room-3'` for floors 1, 2 and 3.
- [ ] **Step 2: Coop instead of stairs on floor 3.**
  - Create one `coop` image: origin (0, 0), x `MAP_X + 10.75 × TILE`, y `rowY` of the rooftop's local row 6, sized 1.5 × 4 tiles.
  - Show it only when `floor === 3`. On floor 3, hide the stairs sprite and the rope.
  - Give the coop a depth like an item whose bottom is the top of the foot row: `rowY(foot row) + ITEM_DEPTH_BIAS`.
  - Check against how people get their depth (`StaffLayer`: `setDepth(at.y)` with `at.y` lifted by `climbPose`, and the same for customers and the owner):
    - someone standing on the foot (11, 46) must be in front of the coop;
    - someone lifted by a climb must go behind it.
  - If a person's depth at the foot falls below the coop's, adjust the coop's depth rather than people's.
- [ ] **Step 3: Lanterns only on floor 1.** A shampoo bed's lantern shows only when the bed is on floor 1. On floor 2, the back wall has windows and its own lantern. On the rooftop, the back wall is sky.
  - A bed carried between floors gains or loses its lantern as it lands.
  - Keep lô A's per-floor lantern y, so a bed carried back down still hangs it on floor 1's wall.
- [ ] **Step 4: Verify.**
  - `npx tsc --noEmit` and `npx vitest run` pass. RoomView itself is not unit-tested.
  - The look is checked in the browser in Task 5.
- [ ] **Step 5: Commit.** `git commit -m "Show the rooftop with its coop over the stairs, people going down behind it, and lanterns only over floor-1 shampoo beds"`

### Task 4: Third pill, per-floor card text, and toasts that fit

**Files:**
- Modify: `src/view/floors.ts`, `src/scenes/SpaScene.ts` (`offerFloor`), `src/strings/vi.ts`, `src/view/ui.ts` (`addToast`)
- Test: `tests/view/floors.test.ts`

**Interfaces:**
- Consumes: `pills(sim, viewed)`, `FloorBar`. `FloorBar` already lays out any number of pills and already knows `floorName3`.
- Produces:
  - `pills` returns one pill for each floor from 1 to `sim.maxFloors()`. `FLOOR_PILLS` is removed.
  - New string keys `floorLine3a` and `floorLine3b`.

- [ ] **Step 1: Write the failing tests** in `tests/view/floors.test.ts`:
  - **"shows a third, locked pill for the rooftop at 4.000.000 đ":** on day 6 with `floors = 1`, `pills(sim, 1)` has floors `[1, 2, 3]`, states `['viewed', 'locked', 'locked']` and prices `[0, 2_000_000, 4_000_000]`.
  - **"opens the rooftop pill once the rooftop is open":** with `floors = 3`, `pills(sim, 3)` states are `['open', 'open', 'viewed']`.
  - **"puts the dot on Tầng 1 only, also when viewing the rooftop":** with a waiting customer, `pills(sim, 3).map(p => p.dot)` is `[true, false, false]`.
  - Update the existing two-pill expectations to three pills.
- [ ] **Step 2: Run them.** `npx vitest run tests/view/floors.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **`pills`:** loop to `sim.maxFloors()` and drop `FLOOR_PILLS`.
  - **`offerFloor`:** show `t(\`floorLine${floor}a\`)` and `t(\`floorLine${floor}b\`)`, typed as `StringKey`.
  - **Strings:**
    - `floorLine3a: 'Gạch tàu, giàn hoa giấy, bồn nước, chuồng cu.'`
    - `floorLine3b: 'Thêm chỗ kê giường, thêm 2 thợ.'`
  - **`addToast`:**
    - Wrap the label at 920 px (`wordWrap: { width: 920 }`, centred lines).
    - Size the box from the label: width + 80, height = label height + 40, and at least 80 tall.
    - Corner radius `min(40, height / 2)`.
    - A one-line toast looks exactly as before.
- [ ] **Step 4: Run.** `npx vitest run` and `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit.** `git commit -m "Add the Sân thượng pill and its own lines on the open card, and wrap toasts that would run past the screen"`

### Task 5: Verify (controller)

- [ ] **Step 1: Automated checks.** `npx vitest run` (twice), `npx tsc --noEmit` and `npm run build` → all green.
- [ ] **Step 2: Browser checks** at 390 × 780, on `npx vite preview` of the worktree build:
  1. On day 6 the three pills show. The rooftop card says "Mở tầng 2 trước" before floor 2 is open.
  2. Open floor 2, then open the rooftop. The view moves there.
  3. Put a mud tub on the rooftop. Carry a plant up from floor 2 with the hold-row pills.
  4. The owner leads a mud customer from floor 1 to the rooftop: the view follows to floor 2, then to the rooftop, and the mini-game opens.
  5. A person going down from the rooftop passes behind the coop.
  6. Seven technicians work, and the staff list has 8 people on 2 pages.
  7. Load the v13 fixture: the refund toast fits inside the screen.
  8. No lantern hangs over a shampoo bed on floor 2. No console errors.
