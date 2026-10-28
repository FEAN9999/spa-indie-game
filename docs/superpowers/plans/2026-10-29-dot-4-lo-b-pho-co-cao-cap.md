# Đợt 4 lô B: Phố cổ và Khu cao cấp (save v24) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phố cổ opens on the chain map at 4★ for 8.000.000 đ and Khu cao cấp at 5★ for 12.000.000 đ. Each has its own room, its own gift piece (a Hội An lantern string, a moth-orchid pot) and its own customers (the backpacker, the lady), who never come to the main shop. Save version 24.

**Architecture:**
- **Lô A already does almost everything.** `Chain`, branches, the map, the sheet, switching, the summary and the beach all ship at master 71b95f6. Lô B fills in the two places lô A left as "Sắp có".
- **Two kinds** join `KINDS` with weight 0, so only a place's `PLACE_KINDS` draws them.
- **Two room textures and two gift pieces** follow the beach's pattern (`src/art/beach.ts`, `decor-surfboard`).
- **Every place opens once its stars are there:** `PLACES_READY` and the `'soon'` state go.
- **The map sheet's figures** move into the view's `PLACE_OWN`.

**Tech Stack:** Phaser 4, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-4-chuoi-spa-design.md`. Lô B covers:
- Phố cổ and Khu cao cấp in §7.4 and §8.6;
- v24 in §8.9;
- §9 lô B;
- §12 lô B.

**Visual reference:**
- The sketch `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\9ad07023-61da-40ae-b124-964377a3b4ba\scratchpad\sketch\template-chuoi.html` (1080×2160 game coordinates, one tile = 78 px). Published at https://claude.ai/artifact/PQf7QfKtqDq6o7EyPPXLyd.
- `c-7-pho.png` and `c-8-cao.png` beside it.
- Each art step names the sketch lines it follows. Where the spec gives copy, the spec wins.

**Baseline:**
- 1187 tests in 99 files pass on `dot-4-lo-b` at 71b95f6.
- Typecheck: `npx tsc --noEmit`.
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.

## Global Constraints

- **Numbers** (verbatim from spec §10; `PLACES` and `PLACE_KINDS` are already in `src/config.ts`):
  - `KINDS.backpacker`: `{ fromDay: 1, weight: 0, patience: 1.3, tip: [0.5, 1, 2], prefers: ['massage', 'steam', 'shampoo'], grading: 'normal', reviews: 1, speed: 5, hard: false }`.
  - `KINDS.lady`: `{ fromDay: 1, weight: 0, patience: 0.7, tip: [0, 1, 4], prefers: ['mask', 'mud', 'stone'], grading: 'harsh', reviews: 2, speed: 3.5, hard: true }`.
  - `PLACE_KINDS.oldTown = { backpacker: 4, elder: 3, student: 1, picky: 1 }` and `PLACE_KINDS.uptown = { lady: 4, office: 3, picky: 2 }`.
  - Phố cổ opens at 4★ for 8_000_000; Khu cao cấp at 5★ for 12_000_000.
- **The bans (spec §5), as in lô A:**
  - A main shop with no branch plays exactly as before. `same-draws.test.ts` and its fixture are untouched.
  - Nothing new draws from the main shop's rng.
  - The new kinds never come to the main shop.
  - Nothing is paid or charged twice. A reload never lays a gift piece again.
  - Quests, badges, rank and the guest book count the main shop only. The guest book lists the five main kinds and no new kind.
  - Old saves open with nothing lost.
  - Text never overflows or overlaps at iPhone width.
- **Save v24** (spec §8.9): no new field. The version only makes an older build refuse a save that may hold the new kinds ("quá mới"). A v23 save opens as it was.
- **Colours:** every hex in a room texture is a value of `C` (`src/art/palette.ts`), as `tests/art/beach.test.ts` checks. New colours for the chibi pieces also go in `C`, as lô A did for `straw`.
- **Sounds:** none new.
- **Copy, verbatim:**
  - kinds "Khách Tây ba lô", "Quý bà";
  - items "Dây đèn lồng Hội An", "Chậu lan hồ điệp";
  - decor phrases (the sheet's room row) "dây đèn lồng Hội An", "chậu lan hồ điệp".

## Plan Calls (mine, at planning)

- **The gift pieces are floor pieces,** like the surfboard: 1×1, `giftOnly`, beauty 3, laid with `gift: true` at tile (11, 10) in every place. Every branch uses `BRANCH_LAYOUT`, and lô A's test proves (11, 10) blocks no path and no spot.
  - **`lanternString`** ("Dây đèn lồng Hội An"): a dark wood post with an arm at the top, a cord hanging three silk lanterns one under another (red, mustard, teal), drawn with the sketch's `silkLantern` (lines 377–385). About 2.7 tiles tall, like the surfboard.
  - **`orchid`** ("Chậu lan hồ điệp"): the sketch's pot (line 542), cream with a mustard band, an arching stem with five flowers and two leaves. About 2.4 tiles tall.
- **The rooms keep the main room's shop front and street,** as the beach does. Only the floors, the back wall and the side walls are the place's own. The sketch's outside streets are not drawn.
- **Phố cổ's back wall carries the sketch's string of seven silk lanterns** (lines 447–452). The spec's room line names "đèn lồng lụa nhiều màu". The floor piece is a separate standing string.
- **Bed lamps stay the main shop's lantern at every place.** The spec says nothing about them. The sketch's per-place lamps (lines 533–538) are left for later, like lô A's deferred beach lanterns.
- **The lady's bun is hair style 3** ("bob with a bun", tinted with her hair colour), forced like the elder's grey hair. Her hair piece is an untinted gold hairpin across the bun. The sketch's `BUN(hair)` needs the hair colour, which an untinted worn piece cannot have.
- **The backpacker's blond hair** is one fixed colour, `BACKPACKER_HAIR = 0xe8c468` (the sketch's `western`).
- **The big pack is drawn over the body,** as the student's backpack is, because worn pieces sit above the body.
  - From the front: only what shows past the body's outline (the pack's two sides, the rolled mat's ends beside the shoulders) and the two straps.
  - From behind: the whole pack with the mat on top.
  - From the side: the pack's depth at the back.
- **Which sides each piece has:**
  - `cap`, `bigPack`, `hairpin`, `handbag`: down, side and up;
  - `pearls`: down and side only, hidden from behind like the tie.
- **`PLACES_READY` and the `'soon'` state are deleted,** not set to every place. Once every place is ready, `'soon'` and "Sắp có" are dead code that lô A added.
- **A saved branch with no place** (save repair) gets the first free place the main shop has the stars for. The old "first free ready place" would otherwise turn a broken 3★ save's spare branch into a Phố cổ the player never bought.
- **`PLACE_OWN` becomes a full `Record<PlaceId, …>`** in `src/view/chain.ts` and takes over `ChainScene`'s `FIGURE_OF`.
  - The sheet's disc always shows a figure. The lock image in the disc goes.
  - The locked pin keeps its lock.
  - This matches the sketch, which shows the place's customer on a locked sheet (line 886, `c-5-sheet-lock.png`).

## Review Focus

1. **An old v23 save with the beach open, at 4–5★, after the update.**
   - The beach and the owner's place are as they were.
   - Phố cổ reads "Mở được · 8.000.000 đ".
   - Buying it charges exactly once, and a reload neither charges again nor lays a second lantern string.
   - Covered by the T1 fixture test and the T4 open-and-reload test.
2. **Reload while the owner is at Khu cao cấp.**
   - She is back there, with one orchid at (11, 10).
   - The room is uptown's own (checked in the browser pass).
   - Covered by T4.
3. **A lady served at a branch.**
   - Her review counts twice on that branch's rating and not at all on the main shop's.
   - The guest book gains nothing.
   - Covered by T1.
4. **The new kinds at the main shop:** never, with or without the rival's picky factor. Covered by T1.
5. **The new sheets at 390 px:**
   - The rows "Khách riêng: Khách Tây ba lô · lượng khách ×1,0" and "1 tầng, bày sẵn như tiệm ngày đầu, thêm dây đèn lồng Hội An." wrap inside the sheet.
   - The backpacker's pack and the lady's bag are not cut off in the disc.
   - Checked in the browser pass.

---

### Task 1: The backpacker, the lady and save v24

**Files:**
- Create: `tests/fixtures/save-v23.json`
- Modify:
  - `src/sim/customers.ts`;
  - `src/sim/save.ts`;
  - `src/view/CharacterView.ts` (empty `WORN` entries only);
  - `tests/sim/branch.test.ts`, `tests/sim/customers.test.ts`, `tests/sim/save.test.ts`;
  - every test that asserts a saved version of 23.

**Interfaces:**
- Produces:
  - `CustomerKind` gains `'backpacker' | 'lady'`;
  - `CUSTOMER_KINDS = [...MAIN_KINDS, 'tourist', 'backpacker', 'lady']`;
  - `KINDS.backpacker`, `KINDS.lady` (Global Constraints);
  - `SAVE_VERSION = 24`.
- `WORN.backpacker` and `WORN.lady` are `[]` here, so `tsc` passes. Task 3 dresses them.

- [ ] **Step 1: Freeze the v23 fixture before anything changes.**
  - With the current code (v23), write `tests/fixtures/save-v23.json` from a throwaway script, then delete the script. A temporary vitest file that writes `JSON.stringify(chain.toSave())` is enough.
  - The save:
    - a main shop at 4★ with 9_000_000 đ, day 40;
    - the beach open, with one technician hired there;
    - the owner at the beach;
    - `told: true`;
    - a numeric `savedAt`.
  - It is never edited afterwards.
- [ ] **Step 2: Write the failing kind tests.**
  - **`customers.test.ts`:** `KINDS.backpacker` and `KINDS.lady` equal the Global Constraints values exactly.
  - **`branch.test.ts`,** in the kind-list `describe`:
    - **Review Focus 4:** `drawKind(40, rng, picky)` over 3000 draws, for `picky` 1 and 2, never gives `'backpacker'` or `'lady'`.
    - **Old town:** 9000 draws with `PLACE_KINDS.oldTown` give exactly `{backpacker, elder, student, picky}`, with the backpacker's share within 0.03 of 4/9.
    - **Uptown:** 9000 draws with `PLACE_KINDS.uptown` give exactly `{lady, office, picky}`, with the lady's share within 0.03 of 4/9.
    - **Review Focus 3:** on `SpaSim.newBranch('uptown', main, createRng(9))`, `ownerServes(branch, 3, { kind: 'lady', service: 'shampoo' })`:
      - adds two reviews to the branch's `reviews`;
      - leaves `main.reviews` as it was;
      - leaves `branch.book.served` keyed by the five main kinds and `kindsMet` empty.
- [ ] **Step 3: Write the failing save tests** in `save.test.ts`, in `describe('save version 24')`:
  - **The v23 fixture:**
    - `parseSave(structuredClone(v23))` equals the fixture.
    - `Chain.fromSave(parseSave(v23), 8)` has `at` `'beach'`, one beach branch with one technician, and the fixture's money.
    - Its `toSave().v` is 24.
  - **Kinds survive:** a branch customer whose `kind` is edited to `'lady'`, `'backpacker'` or `'moon'` in the JSON reads back as `'lady'`, `'backpacker'` and `'office'`.
  - **Every older save:** every fixture `v1`–`v23` parses and opens with `Chain.fromSave` without throwing, and saves as 24. The `describe('save version 23')` list stays as it is, because it expects an empty chain, and the v23 fixture has the beach.
  - **Too new:** `{ ...v23, v: 25 }` throws `SaveTooNewError`.
- [ ] **Step 4: Run them.** They fail on the missing kinds and version.
- [ ] **Step 5: Implement.**
  - Add the two kinds.
  - `SAVE_VERSION = 24`, and `parseVersioned` also accepts 23.
  - Add `backpacker: [], lady: []` to `WORN`.
  - Change every test assertion of a saved version 23 (`toSave().v`, `saved.v`) to 24.
- [ ] **Step 6: Check.** `tsc` and `vitest` are green, and `same-draws` is unchanged.
- [ ] **Step 7: Commit:** "Add the backpacker and the lady, who come only to their places, and save in version 24"

### Task 2: The rooms and gift pieces of Phố cổ and Khu cao cấp

**Files:**
- Create: `src/art/oldTown.ts`, `src/art/uptown.ts`, `tests/art/branchRooms.test.ts`
- Modify:
  - `src/art/palette.ts`, `src/art/furniture.ts`;
  - `src/sim/items.ts`, `src/sim/places.ts`, `src/sim/spa.ts` (`newBranch`);
  - `src/view/RoomView.ts`, `src/scenes/BootScene.ts`;
  - `src/strings/vi.ts`;
  - `tests/art/furniture.test.ts`, `tests/sim/branch.test.ts`.

**Interfaces:**
- Produces:
  - `oldTownRoomTexture(grid: Grid): string` and `uptownRoomTexture(grid: Grid): string`;
  - texture keys `'room-oldTown'`, `'room-uptown'`, `'decor-lanternString'`, `'decor-orchid'`;
  - `ITEMS.lanternString = { w: 1, h: 1, price: 0, beauty: 3, group: 'decor', giftOnly: true, name: 'itemLanternString' }` ("Dây đèn lồng Hội An");
  - `ITEMS.orchid = { w: 1, h: 1, price: 0, beauty: 3, group: 'decor', giftOnly: true, name: 'itemOrchid' }` ("Chậu lan hồ điệp");
  - `PLACE_DECOR: Record<PlaceId, { kind: ItemKind; x: number; y: number }>`, now total:
    - `beach: surfboard`;
    - `oldTown: lanternString`;
    - `uptown: orchid`;
    - all three at (11, 10).
  - `RoomView` floor 1 key: `'room'` for the main shop, `` `room-${place}` `` at a branch.

- [ ] **Step 1: Write the failing tests.**
  - **`tests/art/branchRooms.test.ts`,** for each of the two textures on `buildGrid(shellOf(BRANCH_LAYOUT), [])`, checked the way `beach.test.ts` does:
    - same viewBox as `roomTexture`;
    - differs from `roomTexture` and from `beachRoomTexture`;
    - every hex is in `C`.
  - **`furniture.test.ts`:** add `'lanternString'` and `'orchid'` to the gift-piece list.
  - **`branch.test.ts`:** turn the beach's decor test into one per place, `it.each` over `[['beach', 'surfboard'], ['oldTown', 'lanternString'], ['uptown', 'orchid']]`:
    - exactly one such item, `gift: true`, at (11, 10);
    - `placeProblem` for it among the others is null;
    - (11, 10) is not walkable;
    - `beauty()` is the others' beauty + 3.
- [ ] **Step 2: Run them.** They fail.
- [ ] **Step 3: Draw the Phố cổ room** after `SKINS.pho()` (sketch lines 424–455), `shell('pho')` (485–493) and `c-7-pho.png`, using the helpers `beach.ts` uses from `room.ts`:
  - **Floors:**
    - dark wood planks in the service room (`pho-a`);
    - gạch tàu tiles from the screen row's middle to the front (`pho-b`).
  - **Back wall:** Hội An yellow with weathered patches, a dark wood beam top and bottom and posts, a shuttered window at the right, and the string of seven silk lanterns.
  - **Side walls:** dark wood (`#5A3520`).
  - **Front:** the main room's shop front and street.
- [ ] **Step 4: Draw the Khu cao cấp room** after `SKINS.cao()` (456–482), `shell('cao')` and `c-8-cao.png`:
  - **Floors:**
    - light wood in the service room (`cao-a`);
    - white marble with grey veins and gold seams from the screen row's middle to the front (`cao-b`).
  - **Back wall:** cream panels with gold trim top and bottom, a framed landscape at the left, and a gold-framed glass wall onto three towers at the right.
  - **Side walls:** gold (`#C9A24A`).
  - **Front:** the main room's shop front and street.
- [ ] **Step 5: Draw the two gift pieces** as Plan Calls describe, with the surfboard's entry as the model:
  - `FURNITURE['decor-lanternString'] = { w: 1, h: 2.7, body }`;
  - `FURNITURE['decor-orchid'] = { w: 1, h: 2.4, body }`.
- [ ] **Step 6: Wire them.**
  - Add the new colours to `C`.
  - Add the two `ItemKind`s and `ITEMS` entries, and the strings `itemLanternString: 'Dây đèn lồng Hội An'` and `itemOrchid: 'Chậu lan hồ điệp'`.
  - Make `PLACE_DECOR` total, and drop `newBranch`'s `if (decor)` guard.
  - `BootScene` registers `'room-oldTown'` and `'room-uptown'` from `BRANCH_LAYOUT`'s empty grid, beside `'room-beach'`.
  - `RoomView` picks `` `room-${place}` `` at a branch.
- [ ] **Step 7: Check.** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 8: Commit:** "Draw the old town and uptown rooms, with a Hội An lantern string and an orchid pot laid in each"

### Task 3: How the backpacker and the lady look

**Files:**
- Modify:
  - `src/art/chibi.ts`, `src/art/palette.ts`;
  - `src/view/CharacterView.ts`;
  - `tests/art/chibi.test.ts`, `tests/art/palette.test.ts`.

**Interfaces:**
- Consumes the two kinds from Task 1.
- Produces:
  - the chibi parts `cap-down|side|up`, `bigPack-down|side|up`, `hairpin-down|side|up`, `handbag-down|side|up` and `pearls-down|side`, all untinted and with anchors;
  - `BACKPACKER_HAIR = 0xe8c468` in `palette.ts`.
- `customerColors(look, 'backpacker')` has `hair: BACKPACKER_HAIR`.
- `customerColors(look, 'lady')` has `hairStyle: 3`.
- `WORN`:
  - `backpacker: [{ key: 'bigPack', on: 'body' }, { key: 'cap', on: 'hair' }]`;
  - `lady: [{ key: 'pearls', on: 'body' }, { key: 'handbag', on: 'body' }, { key: 'hairpin', on: 'hair' }]`.

- [ ] **Step 1: Write the failing tests.**
  - **`chibi.test.ts`:** following the tourist's test, each part key above exists in `chibiTextures()`, has no `-line` twin and has a `PART_ANCHORS` entry. `pearls-up` does not exist.
  - **`palette.test.ts`:**
    - `customerColors(look, 'backpacker')` equals `{ ...lookColors(look), hair: BACKPACKER_HAIR, kind: 'backpacker' }` for two different looks.
    - `customerColors(look, 'lady')` equals `{ ...lookColors(look), hairStyle: 3, kind: 'lady' }` for a look with hair style 0.
- [ ] **Step 2: Run them.** They fail.
- [ ] **Step 3: Draw the pieces** after the sketch's `CAP`, `BIG_PACK`, `PEARLS` and `HANDBAG` (lines 222–245) and `LOOKS.western` and `LOOKS.lady` (275–278), in the existing part pattern:
  - **The cap:** cobalt, with a darker peak and a cream button. The peak points forward from the front, sideways from the side, and is hidden from behind.
  - **The big pack:** olive, with a terracotta rolled mat, drawn as Plan Calls describes.
  - **The pearls:** eleven white pearls on an arc at the collar.
  - **The handbag:** berry red with a gold handle and clasp, hanging at her right hand.
  - **The hairpin:** a gold pin with a gold bead, crossing the bun of hair style 3 (`bunDown`/`bunSide`).
- [ ] **Step 4: Wire them.**
  - Register the parts and anchors.
  - Fill `WORN.backpacker` and `WORN.lady`.
  - Set the backpacker's hair and the lady's hair style in `customerColors`.
  - New colours go in `C`.
- [ ] **Step 5: Check.** `tsc` and `vitest` are green.
- [ ] **Step 6: Commit:** "Dress the backpacker in a cap and a big pack, and the lady in pearls, a handbag and a hairpin on her bun"

### Task 4: Open Phố cổ at 4★ and Khu cao cấp at 5★

**Files:**
- Modify:
  - `src/sim/places.ts`, `src/sim/chain.ts`, `src/sim/save.ts`;
  - `src/view/chain.ts`;
  - `src/scenes/ChainScene.ts`;
  - `src/strings/vi.ts`;
  - `tests/sim/chain.test.ts`, `tests/sim/save.test.ts`, `tests/view/chain.test.ts`.

**Interfaces:**
- Consumes:
  - Task 1's kinds;
  - Task 2's `PLACE_DECOR`;
  - Task 3's looks (`CharacterView` draws them in the sheet's disc).
- Produces:
  - `OpenProblem = 'open' | 'stars' | 'money'`;
  - `PinState = 'here' | 'open' | 'can' | 'lock'`;
  - `figureOf(place: PlaceId | null): { kind: CustomerKind; look: Look }` in `src/view/chain.ts`.
- `PLACES_READY` and the `pinSoon` string are gone.

- [ ] **Step 1: Write the failing tests.**
  - **`tests/sim/chain.test.ts`.** Replace the two `'soon'` tests with these:
    - **What stops a place opening:**
      - `starShop(4)` with oldTown → null;
      - `starShop(4, 7_999_999)` with oldTown → `'money'`;
      - `starShop(4)` with uptown → `'stars'`;
      - `starShop(5)` with uptown → null.
    - **All three places:** at 5★ with 30_000_000, open `'uptown'`, `'beach'` and `'oldTown'` in that order.
      - Each returns null.
      - The branches' places are `['beach', 'oldTown', 'uptown']`.
      - Money is 5_000_000.
      - oldTown holds one `lanternString` and uptown one `orchid`.
    - **Review Focus 2:** with uptown open and the owner there, `Chain.fromSave(viaJson(chain.toSave()), 8)`:
      - has `at` `'uptown'`;
      - has exactly one `orchid` there;
      - has the same money.
    - **Review Focus 1:** load the v23 fixture with `Chain.fromSave(parseSave(v23), 8)`.
      - `openProblem('oldTown')` is null and `openProblem('uptown')` is `'stars'`.
      - `open('oldTown')` takes exactly 8_000_000.
      - After a reload via JSON: money is the same, there are two branches, there is one `lanternString`, and `at` is still `'beach'`.
  - **`tests/sim/save.test.ts`.** Rename the repair test to "…to the first free place the main shop has the stars for", and add:
    - a place-less second branch beside the beach in a 4★ main shop's save comes back as `'oldTown'`;
    - at 3★ it is dropped, as the existing tests already say.
  - **`tests/view/chain.test.ts`.** Replace the "coming soon" tests with these:
    - **Pins at 5★ with 20_000_000:**
      - oldTown → `['can', 'Mở được · 8.000.000 đ']`;
      - uptown → `['can', 'Mở được · 12.000.000 đ']`.
    - **Pin at 4★:** uptown → `['lock', 'Cần 5★ · 12.000.000 đ']`.
    - **The locked oldTown sheet at 3★** equals:
      - title `'Phố cổ'`;
      - status `'Mở khi tiệm gốc đạt 4★ · 8.000.000 đ'`;
      - rows `['Khách riêng: Khách Tây ba lô · lượng khách ×1,0', 'Giá dịch vụ ×1,2', '1 tầng, bày sẵn như tiệm ngày đầu, thêm dây đèn lồng Hội An.']`;
      - button `{ text: 'Cần 4★', on: false }`;
      - `short` and `warn` null.
    - **The uptown sheet at 5★ with 10_000_000:**
      - status `'Mở được · tiệm gốc đang 5★'`;
      - rows `['Khách riêng: Quý bà · lượng khách ×0,8', 'Giá dịch vụ ×1,6', '1 tầng, bày sẵn như tiệm ngày đầu, thêm chậu lan hồ điệp.']`;
      - button `{ text: 'Mở chi nhánh · 12.000.000 đ', on: false }`;
      - short `'Còn thiếu 2.000.000 đ'`.
    - **`figureOf`:**
      - `null` → `'student'`;
      - `'beach'` → `'tourist'`;
      - `'oldTown'` → `'backpacker'`;
      - `'uptown'` → `'lady'`.
    - **`mapSub`** with all three open at 5★ → `'Tiệm gốc 5★ · 4/4 tiệm'`.
- [ ] **Step 2: Run them.** They fail.
- [ ] **Step 3: Implement.**
  - Delete `PLACES_READY`, the `'soon'` problem and pin state, and `pinSoon`.
  - In the save repair, a place-less branch takes the first free id in `PLACE_IDS` with `PLACES[id].stars <= main.rank.stars`.
  - **`PLACE_OWN`** becomes `Record<PlaceId, { kind: CustomerKind; look: Look; name: StringKey; decor: StringKey }>`:
    - **beach:** the beach's look from `FIGURE_OF`;
    - **oldTown:** `{ skin: 0, hair: 0, hairStyle: 2, shirt: 4 }`;
    - **uptown:** `{ skin: 0, hair: 0, hairStyle: 3, shirt: 3 }`;
    - **strings:** `kindBackpacker: 'Khách Tây ba lô'`, `kindLady: 'Quý bà'`, `decorOldTown: 'dây đèn lồng Hội An'`, `decorUptown: 'chậu lan hồ điệp'`.
  - `figureOf(null)` is the main shop's student from `FIGURE_OF`.
  - In `ChainScene`:
    - draw the disc's figure from `figureOf`;
    - delete `FIGURE_OF`, `FIGURE.lock` and the disc's lock image;
    - drop every `'soon'` comparison and `PIN_FILL.soon`.
- [ ] **Step 4: Check.** `tsc`, `vitest` and `vite build` are green, and `grep -rn "PLACES_READY\|'soon'\|pinSoon\|FIGURE_OF" src` finds only the guest book's own `'soon'`.
- [ ] **Step 5: Commit:** "Open the old town at 4 stars and uptown at 5, each sheet showing its own customer"

---

## After the tasks: browser check and ship (controller)

- **Build and serve** as lô A did:
  - `NODE_ENV=development npx vite build --mode development --outDir .superpowers/dist-dev`;
  - `npx vite preview --outDir .superpowers/dist-dev --port 5194 --strictPort --host 127.0.0.1`, in the background;
  - `$B viewport 390x844`.
- **Inject a 5★ main shop with 25_000_000 đ.** Then:
  1. The map: Phố cổ and Khu cao cấp read "Mở được"; their sheets show the backpacker and the lady; the rows wrap inside the sheet (Review Focus 5).
  2. Open both. Each takes its price once. Go to each:
     - the room is the place's own;
     - the gift piece stands at (11, 10);
     - the ribbon reads "{shop} · Phố cổ" or "{shop} · Khu cao cấp".
  3. Hire a technician at uptown and run until a lady and a backpacker come:
     - the cap, the big pack, the pearls, the handbag and the hairpin show from the front, the side and behind;
     - nothing shows on the bed.
  4. Reload at uptown: the owner is there, with one orchid and the same money (Review Focus 2).
  5. At 4★: the uptown pin is locked, "Cần 5★ · 12.000.000 đ", and its sheet shows the lady.
- `$B console --errors` is empty after `$B console --clear`.
- Reset `$B` (about:blank, 1280x720, `localStorage.clear()`).
- **Ship:** check `origin/master`, merge, push, then report to Chồng yêu.
