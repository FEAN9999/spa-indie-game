# Đợt 4 lô C: chuyển nhân viên và tiền khi vắng cả chuỗi (save v25) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A staff member can be sent to another shop of the chain from the staff panel ("Chuyển tiệm"). They finish today where they are and start tomorrow at the new shop with everything kept. Coming back after time away pays every shop's staff, not only the main shop's, and the "Chủ tiệm về rồi" card says how many shops paid. Save version 25.

**Architecture:**
- **Lô A and B already do almost everything.** `Chain`, branches with their own `SpaSim`, the shared purse, and every shop's `AwayBook` all exist at master 7c2318b. Each branch already closes its day into its own book (`closeAwayDay` in `SpaSim`). Only the main shop's `comeBack` is ever called.
- **A move is a mark on the person,** `Staff.moveTo`. `Chain.startDay()` carries the marked people over before any shop's morning. Nobody is ever on the road in a save (spec §6, approach A).
- **`Chain.comeBack(ms)`** calls every shop's `comeBack` and sums the results. The card reads the list of shops that paid.

**Tech Stack:** Phaser 4, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-4-chuoi-spa-design.md`. Lô C covers:
- §7.9 and §8.7 (moving staff);
- §7.10 and §8.8 (time away for the whole chain);
- v25 in §8.9;
- §9 lô C;
- §12 lô C.

**Visual reference:** the sketch's staff card `scratchpad/sketch/c-13-staff.png` (in the session scratchpad `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\9ad07023-61da-40ae-b124-964377a3b4ba\scratchpad\sketch\`). It shows one person per card with "Cho nghỉ" and "Chuyển tiệm" side by side, and the title "Nhân viên · Tiệm gốc". The game's panel lists people in rows, so Task 3 adapts it (see Plan Calls).

**OSS research** (CLAUDE.md rule; done for the spec, notes in scratchpad `dot-4-oss.md`): Widelands walks workers between warehouses on the road (rejected in spec §6: nobody on the road in a save); Mindustry pays unplayed sectors by a measured average (the Đợt 3 away rule each shop keeps).

**Baseline:**
- 1213 tests in 102 files pass on `dot-4-lo-c` at 7c2318b.
- Typecheck: `npx tsc --noEmit`.
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.

## Global Constraints

- **The bans (spec §5), as in lô A and B:**
  - A main shop with no branch plays exactly as before. `same-draws.test.ts` and its fixture are untouched. The staff panel without a branch looks exactly as before.
  - Nothing new draws from any rng. A move draws nothing.
  - Nothing is paid or charged twice. A reload neither moves anyone twice nor pays time away twice.
  - Quests, badges, rank and Spa của năm count the main shop only.
  - Old saves open with nothing lost.
  - Text never overflows or overlaps at iPhone width.
- **Moving (spec §7.9, §8.7):**
  - `Staff.moveTo: PlaceId | 'main' | null`; `'main'` is the main shop.
  - The person works the rest of today at the old shop and is paid there tonight. Next morning they are at the new shop like everyone else, keeping name, look, wage, stats, tiers, trait, level, xp and tonight's course result. They get a new id from the new shop.
  - Room: the people of that role at the target who are not leaving, plus those already moving there, must stay below `staffCap(role, target.floors)` (a branch has 1 floor: 3 technicians, 1 receptionist).
  - Someone let go cannot move. Letting go someone who is moving cancels the move.
- **Time away (spec §7.10, §8.8):** each shop pays by the Đợt 3 rule from its own book (`awayPay`), into the one purse. The tip card stays the main shop's. The card's figures stay the main shop's staff.
- **Save v25** (spec §8.9): `Staff.moveTo`; every older staff member reads `moveTo: null`. A v24 save opens as it was.
- **Sounds:** none new.
- **Copy, verbatim:**
  - "Chuyển tiệm", "Hết chỗ", "Mai sang {place}", "Ở lại", "Cả {n} tiệm" (spec §7.9, §7.10);
  - mine: "Chuyển {name} sang tiệm nào?", "Nhân viên · {place}", "Từ chi nhánh {place}", "Mỗi giờ vắng bằng 1/4 lãi một ngày của mỗi tiệm (cộng lãi trung bình các tiệm: {money}).".
- **Layers:** the sim (`src/sim/**`) has no Phaser and no strings. Place names on screen come from `placeName` in `src/view/chain.ts`.

## Plan Calls (mine, at planning)

- **Branch away books saved by v23–v24 are kept, not emptied.** Spec §8.9 says those branches "nhận sổ trống", written when the spec assumed branches had no book. Since lô A every branch closes each day into its own book with the same `closeAwayDay` rule, so the saved books are real. Emptying them would throw away days the staff really worked.
- **Hiring counts people moving in.** `SpaSim.incoming(role)` (set by the chain) is added to the count in `hireProblem`. A booked move can then never be squeezed out by a hire at the target. A move that still finds no room in the morning (only a damaged save) is dropped and the person stays.
- **A course booked tonight pays off at the new shop.** The mover is carried over before any shop's morning, so the target's `startDay` finishes the course. Leaving the main shop, the "học xong" card is not shown, because a branch's morning cards are dropped. The new tier still shows on the person's row.
- **The staff panel with a branch open** (Task 3):
  - Title "Nhân viên · {place}".
  - The working tab shows 3 rows a page, each 380 tall, with a move line under the stats: a "Chuyển tiệm" button, or the mustard strip "Mai sang {place}" with an "Ở lại" button.
  - The study and "Cho nghỉ" buttons stay where they are, so a mover can still be let go.
  - The hiring tab is unchanged.
- **The shop picker** lists every other open shop: the main shop first, then the branches in map order. A full shop is faded, reads "{place} · Hết chỗ", and does nothing on tap.
- **The away card** reads `AwayResult.places`, the shops that paid:
  - two or more shops: the line "Cả {n} tiệm" and a chain rule line with the sum of their mean profits;
  - only a branch: "Từ chi nhánh {place}" and that branch's own rule line;
  - only the main shop: exactly as before.
- **The tip waits for a return that pays nothing.** When a branch pays while the main shop would show its tip, the chain gives no tip and the main shop's `tipSeen` stays false. The card and the tip never stack.

## Review Focus

1. **A good technician moved from the main shop to a branch** (the §12 lô C playtest).
   - She serves at the main shop until 20:00 and is paid there.
   - Next morning she stands at the branch, with her name, stars, trait, level and tonight's course.
   - The main shop no longer lists her.
   - A reload before morning keeps the move.
   - Covered by T1.
2. **The last free slot at a branch.**
   - After one move booked into it, hiring there says full, and a second mover sees "Hết chỗ".
   - Letting the first mover go frees the slot at once.
   - Covered by T1 (sim) and T3 (`moveOptions`).
3. **Ids at the new shop** never clash with anyone there, now or after a later hire, across a reload. Covered by T1.
4. **Reopening after two hours with two shops whose last day qualifies.**
   - Each pays once into one purse, and a branch whose last day was "Tạm nghỉ" pays nothing.
   - The card says "Cả 2 tiệm".
   - Covered by T2; the card is checked in the browser pass.
5. **The staff panel and the away card at 390 px with branches open.**
   - Three rows and their move lines fit.
   - "Mai sang Khu cao cấp" fits in its strip.
   - The picker card and the card's extra lines stay inside their cards.
   - Checked in the browser pass.

---

### Task 1: Moving staff in the sim, save v25

**Files:**
- Create: `tests/fixtures/save-v24.json`
- Modify:
  - `src/sim/staff.ts` (`MoveTo`, `Staff.moveTo`);
  - `src/sim/crew.ts` (`hire`, `hireProblem`, `fire`);
  - `src/sim/spa.ts` (`incoming`, `takeIn`);
  - `src/sim/chain.ts` (moves, morning carry-over, load repair, wiring `incoming`);
  - `src/sim/save.ts` (`SAVE_VERSION = 25`, accept 24, repair `moveTo`).
- Test:
  - `tests/sim/chain.test.ts` (or a new `tests/sim/move.test.ts` beside it);
  - `tests/sim/save.test.ts`;
  - `tests/save/code.test.ts` (24 → 25);
  - every test that builds a `Staff` literal gains `moveTo: null`.

**Interfaces:**
- Consumes: `Chain`, `SpaSim.newBranch`, `staffCap(role, floors)` (crew.ts), `PLACE_IDS`.
- Produces:
  - `export type MoveTo = PlaceId | 'main' | null` in `src/sim/staff.ts` (type-only import of `PlaceId`), and `Staff.moveTo: MoveTo`.
  - `SpaSim.incoming: (role: StaffRole) => number`, default `() => 0`: how many people of `role` move here tomorrow.
  - `SpaSim.takeIn(s: Staff): void` adds a person from another shop:
    - a new id from this shop's `nextStaffId`;
    - `moveTo` null, `task` null, `path` empty, standing on the door tile;
    - this shop's `startDay` then places them as usual.
  - In `src/sim/chain.ts`:
    - `export type MoveProblem = 'staff' | 'place' | 'full'`:
      - `staff`: no such working person at `from`, or they are leaving;
      - `place`: `to` is their own shop or has no branch;
      - `full`: no room left there for their role.
    - `export const moveDest = (to: Exclude<MoveTo, null>): PlaceId | null => (to === 'main' ? null : to)`.
    - `Chain.moveProblem(from: PlaceId | null, id: number, to: PlaceId | null): MoveProblem | null`. A person already moving to `to` is not counted twice.
    - `Chain.move(from: PlaceId | null, id: number, to: PlaceId | null): MoveProblem | null` sets `moveTo` (`'main'` for null).
    - `Chain.stay(from: PlaceId | null, id: number): void` sets `moveTo` back to null.

- [ ] **Step 1: Freeze the v24 fixture before anything changes.**
  - With the current code (v24), write `tests/fixtures/save-v24.json` from a throwaway vitest file, then delete the file. Lô B froze v23 the same way.
  - The chain to freeze:
    - a main shop at 3★ or more with the beach open;
    - one technician hired at the main shop and one at the beach;
    - the owner at the beach (`chain.goTo('beach')`);
    - the main shop's `away` set to `{ profits: [300000], ok: true, tipSeen: false }` and the beach's to `{ profits: [200000], ok: true, tipSeen: false }` before saving;
    - a numeric `savedAt`.
  - Task 2 reads these books.

- [ ] **Step 2: Write the failing tests.**
  - **Moving, at the sim level** (a chain with the main shop at 3★ and the beach open; technicians hired with `hire`):
    - `moveProblem(null, id, 'beach')` is null, and `move` sets `moveTo` to `'beach'`. Until `chain.startDay()` she is still in `main.staff`.
    - After `chain.startDay()`:
      - `main.staff` no longer has her;
      - `beach.staff` has one person whose name, look, wage, stats, tiers, trait, level and xp equal hers;
      - her `moveTo` is null;
      - her id is used by nobody else at the beach.
    - A course booked at the main shop before the move pays off at the beach: the tier is one higher, and no tuition comes back.
    - A beach technician moved with `move('beach', id, null)` has `moveTo === 'main'` and starts the next day at the main shop.
    - `stay` cancels: after `move` then `stay`, `startDay` leaves her at the main shop.
    - **Room:**
      - the beach with 2 technicians takes one mover;
      - then `beach.hireProblem(i)` for a technician candidate is `'full'`;
      - a second main-shop technician gets `'full'` from `moveProblem(null, id2, 'beach')`;
      - `chain.main.fire(firstMoverId)` sets her `moveTo` to null, after which the second move is allowed.
    - `moveProblem` gives:
      - `'staff'` for an unknown id and for someone let go;
      - `'place'` for `to` equal to her own shop and for `'oldTown'` while it has no branch.
    - A `moveTo` set by hand to a beach that is full by morning: she stays, and `moveTo` is null.
    - **Ids:** with beach staff ids 1 and 2, the mover becomes 3 and the next beach hire 4.
    - **Reload:** a move booked, then `Chain.fromSave(parseSave(chain.toSave()), seed)`. The move is still there and is applied by the next `startDay`.
  - **Save:**
    - `parseSave(structuredClone(v24))` equals the fixture with `moveTo: null` added to every staff member, main shop and branch. Nothing else changes.
    - `Chain.fromSave(parseSave(v24), 8)` has `at` `'beach'`, the beach's technician, and saves as 25.
    - 25 opens; 26 throws `SaveTooNewError`.
    - Every fixture v1–v24 opens with `Chain.fromSave` and saves as 25.
    - A `moveTo` of `'moon'` or `3` reads as null.
    - After `Chain.fromSave`, these become null:
      - a `moveTo` naming the person's own shop;
      - a `moveTo` naming a place with no branch;
      - a leaving person's `moveTo`.
  - `tests/save/code.test.ts`: the version it writes and reads is 25.

- [ ] **Step 3: Run them to see them fail.** Run: `npx vitest run tests/sim tests/save`. Expected: the new tests fail (no `moveTo`, no `move`, version 24).

- [ ] **Step 4: Implement.**
  - `hire` writes `moveTo: null`.
  - `hireProblem` adds `sim.incoming(c.role)` to the count.
  - `fire` sets `moveTo` to null before anything else.
  - `Chain.startDay()` carries movers over first, before `this.main.startDay()`:
    - walk the main shop's staff, then each branch's in `PLACE_IDS` order;
    - a person whose target has room leaves the old shop's `staff` and goes in by `target.takeIn`;
    - one whose target has no room or no branch stays, with `moveTo` null.
  - The chain sets `incoming` on the main shop in its constructor and on each branch in `open` and `fromSave`. It counts the staff of other shops whose `moveTo` targets this shop, have this role and are not leaving.
  - `Chain.fromSave` clears the bad `moveTo`s listed in Step 2.
  - `parseShop` repairs `moveTo` beside `look` and `task` (save.ts:262): `'main'` or a `PlaceId` is kept, anything else is null.

- [ ] **Step 5: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean, all green, `same-draws` untouched.

- [ ] **Step 6: Commit.**
  - Stage the files by name.
  - Message: `Let a staff member move to another shop of the chain the next morning, keeping everything, with save version 25`.

### Task 2: Time away paid by every shop

**Files:**
- Modify:
  - `src/sim/away.ts` (`AwayResult.places`);
  - `src/sim/spa.ts` (`comeBack` fills `places`);
  - `src/sim/chain.ts` (`comeBack`);
  - `src/view/away.ts` (`awayLines`);
  - `src/strings/vi.ts`;
  - `src/scenes/SpaScene.ts` (both `this.chain.main.comeBack(` calls; the comment in `showAway`).
- Test: `tests/sim/away.test.ts` or `tests/sim/chain.test.ts`; the existing `awayLines` tests (find them with `grep -rn awayLines tests`).

**Interfaces:**
- Consumes:
  - the v24 fixture (Task 1);
  - `placeName(place)` from `src/view/chain.ts`;
  - `awayPay`, `awayMean`.
- Produces:
  - `AwayResult.places: (PlaceId | null)[]`: the shops that paid, the main shop (null) first, then branches in `PLACE_IDS` order. `SpaSim.comeBack` gives `paid > 0 ? [this.place] : []`.
  - `Chain.comeBack(ms: number): AwayResult`:
    - `paid` is the sum and `places` the concatenation;
    - `profit` and `days` are those of the only paying shop when there is one;
    - with two or more paying shops, `profit` is the sum of their `profit`s and `days` the main shop's;
    - `ms` and `capped` are the main shop's.
  - Strings: `awayShops: 'Cả {n} tiệm'`, `awayFrom: 'Từ chi nhánh {place}'`, `awayRuleChain: 'Mỗi giờ vắng bằng 1/4 lãi một ngày của mỗi tiệm (cộng lãi trung bình các tiệm: {money}).'`.

- [ ] **Step 1: Write the failing tests.**
  - **Chain pay** (main book ok `[300000]`, beach ok `[200000]`, an oldTown branch whose book is not ok; `ms = 2 * 3_600_000`):
    - `paid` is 250_000 (150_000 + 100_000);
    - the purse goes up by exactly 250_000;
    - `places` is `[null, 'beach']`, `profit` 500_000, `capped` false.
  - **A branch alone** (main book not ok): `places` is `['beach']`, `profit` 200_000, `days` 1, `paid` 100_000.
  - **Nothing qualifies:** `paid` 0, `places` empty.
  - **The tip:**
    - the main book is not ok and its tip is unseen, with staff open:
      - while the beach pays, `tip` is false and `main.away.tipSeen` stays false;
      - with the beach not ok as well, `tip` is true and `tipSeen` becomes true;
    - a branch never gives the chain a tip.
  - **The v24 fixture:** `Chain.fromSave(parseSave(v24), 8).comeBack(2 * 3_600_000).places` is `[null, 'beach']`.
  - **`awayLines`:**
    - `places: [null]` gives the lines as today (the existing tests stay);
    - `places: [null, 'beach']`, `profit: 500000` gives `['Cả 2 tiệm', 'Mỗi giờ vắng bằng 1/4 lãi một ngày của mỗi tiệm (cộng lãi trung bình các tiệm: 500.000 đ).', <awayStill>]`;
    - `places: ['uptown']`, `days: 2`, `profit: 400000` gives `['Từ chi nhánh Khu cao cấp', <awayRule with 2 days and 400.000 đ>, <awayStill>]`;
    - `capped` puts the capped line right after the rule line, as today.

- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/sim tests/view`.

- [ ] **Step 3: Implement.**
  - `Chain.comeBack` calls `comeBack` on the main shop, then on each branch.
  - When a branch paid while the main shop's result has `tip`, set `this.main.away.tipSeen = false` and return `tip: false`.
  - `SpaScene` calls `this.chain.comeBack(…)` at both sites, with the same logic around them.
  - `showAway` still passes `sim: this.chain.main`. Its comment becomes: the card's figures are the main shop's staff.
  - `AwayScene` needs no change: its lines come from `awayLines`, and the card grows with them.

- [ ] **Step 4: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean, all green.

- [ ] **Step 5: Commit.** Message: `Pay time away from every shop of the chain into the one purse, the card counting the shops that paid`.

### Task 3: "Chuyển tiệm" on the staff panel

**Files:**
- Modify:
  - `src/scenes/StaffScene.ts`;
  - `src/scenes/SpaScene.ts` (`StaffData` gets `chain: this.chain`);
  - `src/view/staffCard.ts` (`moveOptions`);
  - `src/strings/vi.ts`.
- Test: `tests/view/staffCard.test.ts` (create it if there is none).

**Interfaces:**
- Consumes: `Chain.moveProblem`, `Chain.move`, `Chain.stay`, `moveDest` (Task 1); `placeName`.
- Produces:
  - `StaffData.chain: Chain`.
  - `moveOptions(chain: Chain, from: PlaceId | null, id: number): { place: PlaceId | null; full: boolean }[]`:
    - every open shop except `from`, the main shop first, then branches in `PLACE_IDS` order;
    - `full` is `chain.moveProblem(from, id, place) === 'full'`.
  - Strings:
    - `moveButton: 'Chuyển tiệm'`;
    - `movePick: 'Chuyển {name} sang tiệm nào?'`;
    - `moveFull: '{place} · Hết chỗ'`;
    - `moveTomorrow: 'Mai sang {place}'`;
    - `moveStay: 'Ở lại'`;
    - `staffTitleAt: 'Nhân viên · {place}'`.

- [ ] **Step 1: Write the failing `moveOptions` tests.**
  - With the main shop, the beach and uptown open, a beach technician gets `[{ place: null, full: false }, { place: 'uptown', full: false }]`.
  - Uptown with 3 technicians: uptown is `full: true`.
  - Uptown with 2 technicians plus one booked mover: uptown is `full: true` for a second technician.
  - A receptionist sees the main shop full when it already has a receptionist.

- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/view/staffCard.test.ts`.

- [ ] **Step 3: Implement `moveOptions` and the panel.** Everything below applies only when `chain.branches.length > 0`. Otherwise the panel is untouched.
  - **Title:** `t('staffTitleAt', { place: placeName(chain.at) })`.
  - **Working tab:** 3 rows a page, row height 380. Each row is drawn as today, plus a move line centred at `y0 + 330`:
    - **Not moving:** a plain `addButton` "Chuyển tiệm" at `ACTION_X`, `PAIR_W` × `PAIR_H`, font `PAIR_SIZE`. It opens the picker.
    - **Moving:**
      - a strip from `TEXT_X` to `ACTION_X - PAIR_W / 2 - 20`, `PAIR_H` tall, rounded like the study box, filled `C.mustard` with an ink stroke;
      - inside it, `t('moveTomorrow', { place: placeName(moveDest(s.moveTo)) })` in `textStyle(32, '600')`, centred;
      - a plain "Ở lại" button at `ACTION_X`, which calls `chain.stay(chain.at, s.id)`, then `onChange()`, then `show()`.
  - **The picker:** an `askCard` built like `chooseCourse`:
    - the heading `t('movePick', { name })`;
    - one 760 × 110 button per option, labelled with `placeName`, or `t('moveFull', { place })` and faded (`FADED_ALPHA`, inert) when full;
    - a cancel button;
    - a pick calls `chain.move(chain.at, id, place)`, then `onChange()`, then `show()`.
  - **The hiring tab** keeps 4 rows of 290.

- [ ] **Step 4: Run the whole suite and build.** Run: `npx tsc --noEmit && npx vitest run && npx vite build --outDir .superpowers/dist-check`. Expected: clean, all green, built.

- [ ] **Step 5: Commit.** Message: `Add Chuyển tiệm to each staff row once the chain has a branch, with tomorrow's shop on a strip and Ở lại to cancel`.

### After the tasks (controller)

- **Final whole-branch review.**
- **Browser pass at 390 px** with a dev build (`NODE_ENV=development npx vite build --outDir .superpowers/dist-dev`, `vite preview`):
  - **The staff panel at the main shop, with the beach and uptown open:**
    - the title reads "Nhân viên · Tiệm gốc";
    - 3 rows a page, each with a move line;
    - the picker card, with a full shop faded;
    - the strip "Mai sang Khu cao cấp" and "Ở lại".
  - **The next morning:** the mover stands at uptown with her stars, and the main shop no longer lists her.
  - **Time away:** set the slot's `savedAt` two hours back and reload. The card shows the total, "Cả 2 tiệm" and the chain rule line inside the card. A second reload right away shows no card.
  - **The console** has no errors.
