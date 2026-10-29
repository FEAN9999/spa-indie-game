# Đợt 5 lô B: Ngâm chân thảo mộc (save v27) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From 4★, with massage open, the main shop can learn Ngâm chân thảo mộc through the lesson lô A built: pay 850.000 đ once, play a memory game on the teacher's foot, and pass at 2★. The service then opens at every shop, a Ghế ngâm chân waits in the gift box, and elders and backpackers start asking for it. A shop that has not learned it plays exactly as before. Save version 27.

**Architecture:**
- **Foot is the eighth `ServiceId`** and the second `LessonService`, after `scrub`. Lô A made the lesson, the paged panels, the learn line and the Hud dot generic over `LESSON_SERVICES`, so they take foot with no new logic. This lot adds:
  - the data;
  - the per-service map entries;
  - a frozen log proving that a shop which has learned scrub but not foot draws as before.
- **The game rules are a pure class,** `FootGame`, built like `MudGame`: it takes an `Rng` the scene seeds from `Date.now()`, so the sim's rng is never touched. `FootScene` draws it on a foot over a herb basin.
- **Save v27 has no migration.** The existing per-key repairs fill `foot` in the tiers and counts, and `repairLessons` already reads `LESSON_SERVICES`.

**Tech Stack:** Phaser 4, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-29-dot-5-dich-vu-moi-design.md`. Lô B covers:
- foot in §7.1;
- the foot lines of §7.2 and of the §8 intro;
- §8.2;
- §9 for lô B.

Nails (lô C) comes later, with its own plan.

**Visual reference:** the approved sketch, `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\9ad07023-61da-40ae-b124-964377a3b4ba\scratchpad\sketch\template-dich-vu.html`, published at https://claude.ai/artifact/P2j3iiJzkyVgQr24Vtoa39.
- It uses the game's 1080×2160 frame, so its numbers carry over unscaled.
- Each art step names the sketch lines it follows. Re-express them in the game's patterns; do not paste the sketch.

**OSS research** (CLAUDE.md rule; done for the spec, notes in scratchpad `dot-5-oss.md`): simon2020 grows one sequence round by round. Foot does the same, with our own code.

**Baseline:**
- 1309 tests in 109 files pass on `dot-5-dich-vu` at master f9fc5da.
- Typecheck: `npx tsc --noEmit`.
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.

## Global Constraints

- **The bans (spec §5):**
  - A shop that has not learned foot plays exactly as before:
    - every old test still passes;
    - `draws-six-services.json` and the new `draws-seven-services.json` are never edited;
    - nothing new is drawn from the sim's rng;
    - paying the tuition alone changes no draw.
  - Foot never changes `serviceArrivalFactor`. The "Đủ món" badge goal stays 6, and the rank's service part stays full at 6 ("6/6 món").
  - Tuition is never paid twice. Old saves open with nothing lost.
  - Playable with a thumb at 390 px, with no text overflowing.
- **Numbers** (spec §7.1, verbatim):
  - foot opens to learn at 4★ with massage open;
  - tuition 850.000 đ, price 190.000 đ;
  - it uses Gói lá xông (herbs, shared with xông lá) and a towel;
  - Ghế ngâm chân costs 650.000 đ, and one is given to the gift box;
  - staff tiers and courses as for the old services;
  - elder and backpacker add foot to `prefers`, and picky likes every service.
- **The game** (spec §8.2, verbatim):
  - 6 points on the sole;
  - each round the points light one by one, with a rising "tinh", and the player taps them back in order;
  - rounds of 3, 4 and 5 points (hard: 4, 5, 6, lit faster), as one sequence that grows;
  - a wrong tap shakes the point red and replays the round once from the first point; a second wrong tap skips the round;
  - 3★ all 3 rounds with at most 1 mistake in the game; 2★ at least 2 rounds; else 1★;
  - 15 seconds, counted only while it is the player's turn to tap.
- **Save version: the next free number on master, v27 today.**
  - `SAVE_VERSION` in `src/sim/save.ts` is the only place the number lives in `src`.
  - Tests compare a written version with `SAVE_VERSION`.
  - If `ngoi-sao` takes v27 first, renumber at merge as lô A's plan says: bump, accept the old number, rename the `describe` titles, and add their fixture to the "opens every older save" lists.
- **Copy, verbatim** (spec §7.2, §8):
  - "Nhìn các huyệt sáng lên lần lượt.", "Rồi bấm lại đúng thứ tự đó.";
  - "Nhớ thứ tự huyệt sáng", "Bấm lại đúng thứ tự", "Sai rồi, xem lại một lần", "Bỏ qua lượt này", "Đúng rồi!";
  - names "Ngâm chân thảo mộc" and "Ghế ngâm chân".
- **Layers:**
  - `src/sim/**` has no Phaser and no strings.
  - Numbers go in `src/config.ts`, strings in `src/strings/vi.ts`, art in `src/art/*`.
  - Every new hex is a value of `C`.
- **Sounds:** none new. The "tinh" is the existing `'star'` one-shot, whose `step` raises the pitch: `sound.play('star', step)`.

## Plan Calls (mine, at planning)

- **Version 27, though the save's shape is unchanged.** A lô A build opening a newer save would drop `'foot'` from `services` and `lessonsPaid`, and with it a paid tuition. With the bump, it refuses the save as too new instead.
- **No new stock item.** `STOCK_USES.foot = ['herbs', 'towel']`, so the Kho row for Gói lá xông reads "Dùng cho Xông lá, Ngâm chân thảo mộc" once foot is open.
- **The Ghế ngâm chân is a 1 × 2 `'bed'`-group item.** Its station's bed tile is the lower tile, as for every bed. The customer sits in it (`'sit'` pose, facing down) instead of lying, with their feet in the basin (sketch line 381).
- **The lesson's demo hint is per service.** In `LessonScene`, `LESSON_DEMO: Record<LessonService, HintId> = { scrub: 'demoScrub', foot: 'demoFoot' }` replaces the literal `'demoScrub'`. Without it, a foot lesson would skip its hand once scrub had been played.
- **The sequence never repeats a point twice in a row** (sketch rule), so every flash is visible as a new one.
- **A tap reaches the nearest point within `FOOT_TAP_R`** (the 66 px point plus 14 px slop). Elsewhere it is ignored, never a mistake.
- **No wrong-tap sound.** The red shake and the line "Sai rồi, xem lại một lần" carry it.

## Review Focus

1. **A shop that has learned Chà muối biển but not Ngâm chân draws exactly as before.** This covers a 4★ chain with seven services open, a scrub bed and staff, at the main shop and at the beach, and also once foot's tuition is paid. Covered by T1 (frozen log and its paid variant).
2. **A slow but correct thumb gets 3★.** At 1 second a point, the normal game ends with 3★, and the clock reads about 12 seconds of the 15. The clock never runs while points light up, after a mistake, or between rounds. Covered by T3.
3. **Taps are ignored outside the player's turn and between points.** A tap during the lead, the show, the red shake or "Đúng rồi!" is ignored, and so is one more than 80 px from every point; neither is a mistake. A tap between two close points goes to the nearer one. Covered by T3.
4. **A 4★ shop that never learned scrub:**
   - Dịch vụ opens on page 2, with both rows offering "Học nghề";
   - the rise to 4★ names Ngâm chân thảo mộc only;
   - learning foot first works, and scrub stays learnable afterwards.
   Covered by T1.
5. **At Phố cổ, backpackers ask for foot only once that branch has its own chair,** and the arrival factor is unchanged. The same holds for elders at the main shop. Covered by T1.

---

### Task 1: Pin today's draws, and put Ngâm chân thảo mộc in the data, the lesson and the art

**Files:**
- Create: `tests/fixtures/draws-seven-services.json`, `tests/fixtures/save-v26.json`
- Modify:
  - `src/config.ts`;
  - `src/sim/services.ts`, `src/sim/items.ts`, `src/sim/stock.ts`, `src/sim/customers.ts`, `src/sim/types.ts` (`HINT_IDS`);
  - `src/strings/vi.ts`;
  - `src/art/palette.ts`, `src/art/fx.ts`, `src/art/furniture.ts`;
  - `src/view/lesson.ts`;
  - `src/scenes/LessonScene.ts` (`GAME_SCENE`, `LESSON_DEMO`);
  - `src/scenes/SpaScene.ts` (the `MINI_GAME_SCENE` and `DEMO_HINT` entries only).
- Test:
  - `tests/sim/helpers.ts`, `tests/sim/same-draws.test.ts`, `tests/sim/lessons.test.ts`;
  - `tests/sim/services.test.ts`, `items.test.ts`, `stock.test.ts`, `customers.test.ts`, `economy.test.ts`, `staff.test.ts`;
  - `tests/view/lesson.test.ts`, `tests/view/rank.test.ts`, `tests/view/servicesPanel.test.ts`, `tests/view/catalog.test.ts`;
  - `tests/sim/save.test.ts` (`withNewKeys` only).

**Interfaces:**
- Produces, in `src/sim/services.ts`:
  - `LessonService = 'scrub' | 'foot'`, with `LESSON_SERVICES = ['scrub', 'foot']`;
  - `SERVICE_IDS` ends `…, 'scrub', 'foot'`;
  - `SERVICES.foot = { price: SERVICE_PRICE.foot, openCost: SERVICE_OPEN_COST.foot, bed: 'footChair', name: 'serviceFoot', busy: 'busyFoot' }`.
- Elsewhere in the sim:
  - `ItemKind` gains `'footChair'`. `ITEMS.footChair = { w: 1, h: 2, price: 650_000, beauty: 0, group: 'bed', name: 'itemFootChair' }`, listed right after `scrubBed`.
  - `STOCK_USES.foot = ['herbs', 'towel']`.
  - `KINDS.elder.prefers = ['massage', 'steam', 'foot']` and `KINDS.backpacker.prefers = ['massage', 'steam', 'shampoo', 'foot']`.
  - `HINT_IDS` gains `'demoFoot'` after `'demoScrub'`.
- Config: `SERVICE_PRICE.foot = 190000`, `SERVICE_OPEN_COST.foot = 850000`, `LESSON_STARS = { scrub: 3, foot: 4 }`.
- Strings:
  - `serviceFoot: 'Ngâm chân thảo mộc'`;
  - `itemFootChair: 'Ghế ngâm chân'`;
  - `busyFoot: 'Ghế ngâm chân đang bận'`;
  - `learnHowFoot1: 'Nhìn các huyệt sáng lên lần lượt.'`, `learnHowFoot2: 'Rồi bấm lại đúng thứ tự đó.'`.
- Textures: `'svc-foot'` (fx) and `'footChair'` (furniture).
- Scene maps: `MINI_GAME_SCENE.foot` and `GAME_SCENE.foot` are `'FootScene'` (registered in Task 4), and `DEMO_HINT.foot` is `'demoFoot'`.
- Test helper `learnScrub(chain: Chain): void` in `tests/sim/helpers.ts`:
  - `chain.main.rank.stars = 4`;
  - `chain.main.services` = the six old ids and `'scrub'`;
  - `placeFirst(chain.main, 'scrubBed')`;
  - `chain.sync()`.

- [ ] **Step 1: Freeze both fixtures before anything changes.** With today's code, add `learnScrub`, then write both fixtures from a throwaway vitest file and delete it.
  - **`tests/fixtures/draws-seven-services.json`** is `sixServiceLog(4, learnScrub)`.
  - **`tests/fixtures/save-v26.json`:**
    - `starShop(4, 20_000_000, 3)` with `services = ['shampoo', 'mask', 'massage', 'scrub']`;
    - `placeFirst` for `maskBed`, `massageBed` and `scrubBed`;
    - a technician hired with tiers `{ massage: 2, scrub: 1 }`;
    - a `Chain(main, 8)` with the beach open, one technician hired there, then `chain.sync()` and `chain.startDay()`;
    - the main technician's `study` set to `{ course: 'scrub', paid: 100000 }`;
    - one student spawned for scrub at the main shop;
    - `savedAt` set to `1_800_000_000_000` on the written JSON.
  - Neither file is edited afterwards.
- [ ] **Step 2: Write the failing tests.**
  - **`same-draws.test.ts` (Review Focus 1):**
    - "draws the same in a 4-star chain with Chà muối biển learned while Ngâm chân is not": `sixServiceLog(4, learnScrub)` equals the new fixture;
    - the same with `c => { learnScrub(c); expect(c.main.payLesson('foot')).toBeNull() }`.
  - **`services.test.ts`:**
    - `SERVICE_IDS` ends with `'scrub', 'foot'`;
    - `SERVICES.foot` as in the Interfaces, with 190_000 and 850_000;
    - `serviceOfBed('footChair')` is `'foot'`;
    - `isLessonService('foot')` is true;
    - `LESSON_STARS.foot` is 4.
  - **`items.test.ts`:** `ITEMS.footChair` as above, at index `scrubBed`'s + 1 in `ITEM_KINDS`.
  - **`stock.test.ts`:**
    - `STOCK_USES.foot` is `['herbs', 'towel']`;
    - `stockUsers('herbs', ['steam', 'foot'])` is `['steam', 'foot']`;
    - `stockItemsFor(['shampoo', 'foot'])` is `['shampoo', 'towel', 'herbs']`.
  - **`customers.test.ts`:** elder's and backpacker's `prefers` as above, and picky's equals `SERVICE_IDS`.
  - **`economy.test.ts`:** `serviceArrivalFactor` of the six old ids plus scrub and foot equals that of the six.
  - **`staff.test.ts`:**
    - `noTiers().foot` is 0;
    - `candidatePool([...six, 'scrub', 'foot'])` ends `'scrub', 'foot'`;
    - `courses(tech, [...six, 'foot'])` ends with `'foot'`.
  - **`lessons.test.ts`:**
    - **Who can learn:**
      - `starShop(3).lessonProblem('foot')` is `'stars'`;
      - `starShop(4)` gives null;
      - money 849_999 gives `'money'`.
    - **Paying and passing:**
      - `payLesson('foot')` takes exactly 850_000;
      - `passLesson('foot')` leaves `book.gifts` with one `'footChair'`;
      - `stock.herbs` is unchanged.
    - **Review Focus 4,** on `starShop(4)`:
      - `learnable()` is `'scrub'`;
      - pay and pass foot: `services` is `['shampoo', 'mask', 'massage', 'foot']`, and `learnable()` is `'scrub'`;
      - pay and pass scrub: `services` ends `'scrub', 'foot'`.
    - **Review Focus 5:** a `Chain` with `oldTown` open, and foot passed at the main shop, then `chain.sync()`:
      - before `placeFirst(oldTown, 'footChair')`, 300 `drawService('backpacker', oldTown.availableServices(), rng)` never give `'foot'`;
      - after it, they do;
      - `serviceArrivalFactor(oldTown.availableServices())` is unchanged by the chair;
      - at the main shop with `placeFirst(main, 'footChair')`, 300 elder draws include `'foot'`.
    - **Served by staff:** at the main shop with foot learned and a chair, a technician serves `spawnCustomer({ kind: 'elder', service: 'foot' })`:
      - the `'paid'` amount is `rankPrice(190_000, 4)`;
      - `stock.herbs` and `stock.towel` each drop by 1.
  - **`tests/view/lesson.test.ts`:**
    - `lessonTitle('foot')` is `'Học Ngâm chân thảo mộc'`;
    - `lessonHowTo('foot')` is the two spec lines;
    - `lessonPassLine('foot')` is `'Tiệm đã có Ngâm chân thảo mộc. Quà: một Ghế ngâm chân trong hộp quà.'`.
  - **`tests/view/rank.test.ts`:**
    - a rise 3 → 4 gives `'Món mới để học: Ngâm chân thảo mộc.'`, and null when `services` holds foot;
    - a rise 2 → 3 still names Chà muối biển.
  - **`servicesPanel.test.ts`:**
    - `panelPage(SERVICE_IDS, 1).rows` is `['scrub', 'foot']`;
    - `lessonAction(starShop(3), 'foot')` is `{ kind: 'note', text: 'Đạt 4★' }`;
    - `lessonAction(starShop(4), 'foot')` is `{ kind: 'learn', label: 'Học nghề\n850.000 đ', faded: false }`;
    - `servicesOpening(starShop(4), true, false)` is `{ tab: 'services', page: 1 }`.
  - **`catalog.test.ts`:** across all pages of `catalogPage('bed', …)`, the kinds include `'footChair'` with foot open, and do not without it.
- [ ] **Step 3: Run them to see them fail.** Run: `npx vitest run tests/sim tests/view`. Expected: the new assertions fail, and both frozen-draws tests pass.
- [ ] **Step 4: Implement.**
  - Add the ids, item, stock use, prefers, hint, config, strings and scene-map entries in the Interfaces.
  - In `LessonScene`, use `LESSON_DEMO[service]` for both `hintDone` and `markHint`.
  - `HOW_TO.foot = ['learnHowFoot1', 'learnHowFoot2']`.
  - **Art.** Add the colours to `C`: `herb: '#7FA86A'`, `herbDark: '#5E8A4C'`.
    - `'svc-foot'`: a foot in a wooden basin of herb water with a leaf (sketch line 586);
    - `FURNITURE.footChair = { w: 1.1, h: 2.2, body }`: a wooden armchair with teal cushions, and a basin of herb water with two leaves and a lotus petal at its foot (lines 279–287).
- [ ] **Step 5: Update the tests that pin today's lists.**
  - The `SERVICE_IDS` list, picky's `prefers` and the `HINT_IDS`-dependent lists gain the new entry.
  - `withNewKeys` in `save.test.ts` also sets `foot: 0` wherever it sets `scrub: 0`, and its doc comment names Ngâm chân too.
- [ ] **Step 6: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean and all green, with all three frozen-draws tests passing.
- [ ] **Step 7: Commit.** Stage the files by name. Message: `Add Ngâm chân thảo mộc to the services, the lesson, the beds and the staff tiers, learned at 4 stars, without letting it bring more customers`.

### Task 2: Save version 27

**Files:**
- Modify: `src/sim/save.ts`
- Test: `tests/sim/save.test.ts`, `tests/save/code.test.ts` (only if it holds a version literal)

**Interfaces:**
- Consumes: the v26 fixture and `withNewKeys` (Task 1).
- Produces: `SAVE_VERSION = 27`, with `parseVersioned` also accepting 26.

- [ ] **Step 1: Write the failing tests** in `describe('save version 27')`:
  - **The v26 fixture:**
    - `parseSave(structuredClone(v26))` equals `withNewKeys(v26)`;
    - `Chain.fromSave(parseSave(v26), 8)` has `'scrub'` in the main shop's `services`, the technician's scrub tier 1, the `'scrub'` course, one scrub bed, and a beach branch with scrub;
    - it saves as `SAVE_VERSION`.
  - **Every older save:** every fixture v1–v26 opens with `Chain.fromSave` and saves as `SAVE_VERSION`.
  - **Versions:** 26 and `SAVE_VERSION` open, and `SAVE_VERSION + 1` throws `SaveTooNewError`.
  - **`lessonsPaid`:**
    - `['foot']` is kept;
    - `['foot', 'scrub']` reads `['scrub', 'foot']`;
    - `['foot']` with `'foot'` in `services` reads `[]`.
  - **Old titles and literals:** `describe('save version 26')` keeps its tests. Any assertion or title that pins 26 as the current version reads `SAVE_VERSION` / "the current version".
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/sim/save.test.ts tests/save`.
- [ ] **Step 3: Implement** `SAVE_VERSION = 27`, and add 26 to the versions `parseVersioned` accepts. No migration line.
- [ ] **Step 4: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean, all green.
- [ ] **Step 5: Commit.** Message: `Save in version 27, so a build from before Ngâm chân refuses a save that has it instead of dropping it`.

### Task 3: The Ngâm chân rules

**Files:**
- Create: `src/sim/foot.ts`, `tests/sim/foot.test.ts`
- Modify: `src/config.ts`

**Interfaces:**
- Produces, in `src/config.ts`. These are the sketch's `FOOT` (lines 1160–1163), in ms and in game pixels on the card:
  - `FOOT_LIMIT_MS = 15000`;
  - `FOOT_POINTS = [{ x: 470, y: 760 }, { x: 615, y: 790 }, { x: 470, y: 940 }, { x: 615, y: 960 }, { x: 505, y: 1110 }, { x: 565, y: 1270 }]`;
  - `FOOT_POINT_R = 66` (drawn), `FOOT_TAP_R = 80`;
  - `FOOT_ROUNDS = [3, 4, 5]`, `FOOT_ROUNDS_HARD = [4, 5, 6]`;
  - `FOOT_ON_MS = 500`, `FOOT_GAP_MS = 200`, `FOOT_ON_HARD_MS = 340`, `FOOT_GAP_HARD_MS = 140`;
  - `FOOT_LEAD_MS = 700`, `FOOT_WRONG_MS = 800`, `FOOT_NEXT_MS = 700`;
  - `FOOT_STARS = { mistakes: 1, pass2: 2 }`.
- Produces, in `src/sim/foot.ts`:
  - `export type FootPhase = 'lead' | 'show' | 'input' | 'wrong' | 'wrong2' | 'next' | 'done'`.
  - `export const footPointAt = (x: number, y: number): number | null`: the index of the nearest `FOOT_POINTS` entry within `FOOT_TAP_R`, else null.
  - `export const footStars = (passed: number, mistakes: number): Stars`: 3 when `passed === 3 && mistakes <= FOOT_STARS.mistakes`; 2 when `passed >= FOOT_STARS.pass2`; else 1.
  - `export class FootGame`, built by `constructor(rng: Rng, hard = false)`:
    - **Fields:**
      - `readonly seq: readonly number[]`: points 0–5, of the last round's length, with no point twice in a row;
      - `readonly rounds: readonly number[]`;
      - `phase: FootPhase = 'lead'`;
      - `phaseMs`;
      - `round`;
      - `idx`: the points tapped right so far this round;
      - `mistakes`, `passed`;
      - `results: ('ok' | 'skip')[]`;
      - `elapsedMs`: input time only;
      - `wrongPoint: number | null`.
    - **Methods:**
      - `length(): number`: `rounds[round]`;
      - `lit(): { step: number; point: number } | null`: during `'show'`, step `k` is lit while `phaseMs` is in `[k·(on+gap), k·(on+gap)+on)`, for `k < length()`;
      - `tap(point: number): 'right' | 'wrong' | null`;
      - `tick(ms: number)`;
      - `progress(): number`: `(results.length + (phase is 'input' or 'wrong' ? idx / length() : 0)) / 3`;
      - `stars(): Stars | null`: null until `'done'`.

- [ ] **Step 1: Write the failing tests.**
  - **The test helpers:**
    - `listRng(values)` returns the values in order, then 0.
    - `play(g, { msPerTap = 300, fails = {} })` ticks in 16 ms frames. In `'input'`, after every `msPerTap` it taps `seq[idx]`. `fails[round] = n` makes the first `n` input taps of that round tap `(seq[idx] + 1) % 6`. It stops at `'done'`.
  - **The sequence:**
    - `new FootGame(listRng([0, 0, 0.2, 0.2, 0.5, 0.9]))` has `seq` `[0, 1, 3, 5, 0]`: the second 0 and the second 0.2 repeat the point before and are drawn again, and the list then runs out to 0.
    - For seeds 1–50 from `createRng`, the normal `seq` has length 5 and the hard one 6, with no equal neighbours and every value in 0–5.
  - **The show:**
    - after `FOOT_LEAD_MS` the phase is `'show'`;
    - at `phaseMs` 0–499, `lit()` is step 0 at `seq[0]`; at 500–699 it is null; at 700, step 1;
    - after 3 × 700 ms the phase is `'input'` with `idx` 0;
    - round 1 lights `seq[0..3]`, starting with round 0's three points (the Simon rule);
    - hard lights for 340 ms with 140 ms gaps.
  - **3★:**
    - `play(g)`: `passed` 3, mistakes 0, `results` `['ok', 'ok', 'ok']`, `stars()` 3, `progress()` 1;
    - with `fails: { 1: 1 }`: the round replays (phase `'wrong'`, then `'lead'`, then a full show) and is passed; mistakes 1, 3★.
  - **Review Focus 2:** `play(g, { msPerTap: 1000 })` gives 3★, with `elapsedMs` between 11_500 and 12_500. After round 0's lead and show, `elapsedMs` is still 0. It does not grow during `'wrong'` or `'next'`.
  - **2★:**
    - `fails: { 1: 2 }`: round 1 is skipped (`'wrong2'`, then `results[1]` is `'skip'`), so `passed` is 2 and the stars 2;
    - `fails: { 0: 1, 2: 1 }`: `passed` 3 with mistakes 2, which is 2★.
  - **1★:**
    - `fails: { 0: 2, 1: 2 }` gives 1★;
    - with no taps the game is done once `elapsedMs` reaches 15_000, after 700 + 2_100 ms of lead and show, with 1★.
  - **Hard:** `play(new FootGame(rng, true))` passes rounds of 4, 5 and 6 for 3★.
  - **Review Focus 3:**
    - `tap(seq[0])` in `'lead'`, `'show'`, `'wrong'` and `'next'` returns null and changes neither `idx` nor `mistakes`;
    - `footPointAt` at each point's centre returns its index;
    - 79 px right of point 5 gives 5, and 81 px right gives null;
    - (540, 775), between points 0 and 1, gives 0.
  - **Done:** after `'done'`, `tap` returns null, and `tick` changes nothing.
  - **`footStars`:** `(3, 1)` → 3, `(3, 2)` → 2, `(2, 0)` → 2, `(1, 0)` → 1.
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/sim/foot.test.ts`. Expected: FAIL, no module.
- [ ] **Step 3: Implement `FootGame`,** after the sketch's `MAKE.foot` (lines 1182–1249).
  - **The constructor** draws `seq` with `Math.floor(rng() * 6)`, drawing again while the value equals the one before.
  - **`tap(point)`:**
    - It returns null unless the phase is `'input'`.
    - **Right** (`point === seq[idx]`): `idx++`. At `length()`, push `'ok'`, `passed++`, and go to `'next'`.
    - **Wrong:** `mistakes++` and `wrongPoint = point`. Go to `'wrong2'` if this round has already replayed, else to `'wrong'`, and mark it replayed.
  - **`tick(ms)`:**
    - It does nothing when done or when `ms <= 0`.
    - `phaseMs += ms`. In `'input'`, `elapsedMs = min(FOOT_LIMIT_MS, elapsedMs + ms)`, and the game is done at the limit.
    - **Moves**, each setting `phaseMs = 0`:
      - `'lead'` → `'show'` at `FOOT_LEAD_MS`;
      - `'show'` → `'input'` (with `idx = 0`) at `length() × (on + gap)`;
      - `'wrong'` → `'lead'` (with `idx = 0`) at `FOOT_WRONG_MS`;
      - `'wrong2'` → push `'skip'`, then the next round, at `FOOT_WRONG_MS`;
      - `'next'` → the next round at `FOOT_NEXT_MS`.
    - **The next round:** `round++`, `idx = 0`, not replayed; `'done'` after the third round, else `'lead'`.
- [ ] **Step 4: Run the tests.** Run: `npx vitest run tests/sim/foot.test.ts`. Expected: PASS. If a timing edge misses by one frame, fix the test's frame arithmetic, never the spec's numbers.
- [ ] **Step 5: Commit.** Message: `Add the Ngâm chân rules: a sequence of points that grows each round, a replay after a wrong tap and a skip after the second, and a clock that only runs on the player's turn`.

### Task 4: The foot game on screen, and the customer in the chair

**Files:**
- Create: `src/scenes/FootScene.ts`, `src/art/footArt.ts`, `tests/art/footArt.test.ts`
- Modify:
  - `src/art/palette.ts`;
  - `src/scenes/BootScene.ts`;
  - `src/main.ts` (`FootScene` after `ScrubScene`);
  - `src/scenes/SpaScene.ts` (the seated pose);
  - `src/strings/vi.ts`.

**Interfaces:**
- Consumes:
  - `FootGame`, `footPointAt` and `FOOT_*` (Task 3);
  - `MiniGameData`, `addMiniGameCard`, `setInstruction`, `drawBars`, `revealStars`;
  - `customerColors`, the `'hand'` texture, and `sound.play('star', step)`.
- Produces:
  - `footTextures(): Record<string, string>` with four textures:
    - `'foot-basin-back'`: the back rim and the herb water, with leaves and petals;
    - `'foot-sole'`: the sole and toes in white, with the pads in `#E6E6E6`, to be tinted by skin;
    - `'foot-sole-line'`: the sole's and toes' ink outlines;
    - `'foot-basin-front'`: where the heel meets the water, the basin's front wall, and the folded towel.
  - New colour in `C`: `wrongPink: '#F4B3A8'` (`herb` comes from Task 1).
  - Scene key `'FootScene'`, opened with `MiniGameData`.
  - Strings:
    - `footWatch: 'Nhớ thứ tự huyệt sáng'`;
    - `footTap: 'Bấm lại đúng thứ tự'`;
    - `footWrong: 'Sai rồi, xem lại một lần'`;
    - `footSkip: 'Bỏ qua lượt này'`;
    - `footRight: 'Đúng rồi!'`.

- [ ] **Step 1: Write the failing test** `tests/art/footArt.test.ts`:
  - all four textures are `<svg` documents;
  - every hex in them is a value of `C`, or `#FFFFFF`/`#E6E6E6` in `'foot-sole'`, checked the way `scrubArt.test.ts` does.
- [ ] **Step 2: Run it to see it fail.** Run: `npx vitest run tests/art/footArt.test.ts`.
- [ ] **Step 3: Implement the art and the scene.**
  - Register `footTextures()` in `BootScene` beside `scrubTextures()`.
  - **The card:**
    - `addMiniGameCard(this, t('footWatch'))`;
    - the foot drawn at the sketch's coordinates (`footArt`, lines 1164–1181): basin back, then the sole tinted by `customerColors(look, kind).skin`, then its line texture, then the basin front;
    - rules from `new FootGame(createRng(Date.now()), params.hard)`. The game takes no day-ease time.
  - **The points,** redrawn each frame on one `Graphics` at `FOOT_POINTS` (sketch lines 1250–1281):
    - **lit:** a glow of r 84, a mustard ring of r 72 and width 10, a mustard disc of r 44 with ink, and a cream centre of r 18;
    - **wrong** (during `'wrong'` and `'wrong2'`, at `wrongPoint`):
      - a `C.wrongPink` disc of r 66 at 0.85;
      - a lantern disc of r 40 with a cream cross;
      - it shakes by `sin(now · 0.06) · 12 · (1 − phaseMs / FOOT_WRONG_MS)` px in x;
    - **flash** for 300 ms after a right tap: a mint ring growing from r 66 to 86 as it fades, and a tealLight disc of r 40;
    - **idle:** a glow of r 64 at 0.55, a cream disc of r 36, and a tealLight centre of r 15.
  - **The round dots** at `(480 + 60i, 492)`, r 17, ink edge 4 (sketch lines 1276–1281):
    - teal with a cream check for `'ok'`;
    - lantern with a cream cross for `'skip'`;
    - cream with a `C.mustardDark` edge of 6 for the round under way;
    - cream otherwise.
  - **The instruction** follows the phase through `setInstruction`, and is set only when the phase changes:
    - lead and show: `footWatch`;
    - input: `footTap`;
    - wrong: `footWrong`;
    - wrong2: `footSkip`;
    - next: `footRight`.
  - **The "tinh":** `sound.play('star', step)` when `lit()` reaches a new step, and `sound.play('star', idx − 1)` on each right tap.
  - **Input:** on `pointerdown`, `footPointAt(p.x, p.y)`; when it is not null, `tap(it)`, and start the flash on `'right'`.
  - **`update(_, delta)`:** `tick(delta)`, then `drawBars(bars, progress(), 1 − elapsedMs / FOOT_LIMIT_MS)`.
  - **The end:** once `phase === 'done'`, `revealStars(this, stars, () => { onDone(stars); this.scene.stop() })`.
  - **The demo hand** (when `params.demo`), during round 0's input until the first `pointerdown` (sketch lines 1283–1289):
    - its fingertip taps round 0's points in order, one every 800 ms;
    - each tap drops 50 px onto the point in the first half;
    - it presses at scale 0.92 from 50% to 75%.
  - **In `SpaScene`'s customer placement,** a customer at a foot station with no path left is drawn in the `'sit'` pose, facing `'down'`. They sit on the chair's seat with their feet over the basin (sketch line 381). Adjust the drawn y so the seat holds them, and check it in the browser pass.
- [ ] **Step 4: Run the whole suite and build.** Run: `npx tsc --noEmit && npx vitest run && npx vite build --outDir .superpowers/dist-check`. Expected: clean, all green, built.
- [ ] **Step 5: Commit.** Message: `Play Ngâm chân on the customer's foot over a herb basin, lighting the points with a rising tinh, shaking a wrong one red, and seat the customer in the foot chair`.

### Task 5: Browser pass at 390 px (controller)

The controller runs this after the final whole-branch review. Nothing here is committed.

- **Setup:**
  - Build the dev bundle and serve it as for lô A, then set `$B viewport 390x844`.
  - Make saves from the real sim with a throwaway test, as lô A did.
  - Drive mini-games from `game.events` `'prestep'`, never from `setInterval`. The headless page runs at about 9 fps.
- **The checklist:**
  1. **A 3★ shop with scrub learned:**
     - page 2 of Dịch vụ shows Chà muối biển and a faded Ngâm chân thảo mộc reading "Đạt 4★";
     - Kho's Gói lá xông row does not yet name Ngâm chân.
  2. **The rise to 4★:** the month card's box holds "Món mới để học: Ngâm chân thảo mộc.", the Dịch vụ dot shows, and the panel opens on page 2.
  3. **The lesson:**
     - "Học nghề / 850.000 đ" fits, and pays once;
     - the teacher card shows the two foot lines;
     - the first game shows the demo hand tapping round 0;
     - the instruction changes with the phase and stays on one line;
     - the points light one by one, with the tinh rising.
  4. **The fail and pass paths:**
     - a wrong tap shakes the point red and replays;
     - a second wrong tap skips, with a cross on the round dot;
     - failing gives "Chưa đạt";
     - passing gives "Học xong!", with the Ghế ngâm chân on its disc;
     - Build lists the chair first in Giường as Quà.
  5. **Real customers:**
     - an elder asks for foot and sits in the chair with their feet in the basin;
     - a technician serves them;
     - a picky customer gets rounds of 4, 5 and 6, lit faster;
     - Kho's Gói lá xông row reads "Dùng cho Xông lá, Ngâm chân thảo mộc" without overflowing.
  6. **Phố cổ:**
     - its Dịch vụ row reads "Chưa có Ghế ngâm chân";
     - after a chair, backpackers ask for foot;
     - the course picker's eight rows fit the screen.
  7. **The console** has no errors.
- **Reset `$B`:** `localStorage.clear()`, then about:blank, then 1280x720.
- **Ship:**
  - check `origin/master` and the `ngoi-sao` and `le-tan-chi-so` branches for a save version;
  - integrate, renumbering if v27 is taken;
  - re-run the tests, merge, push, then report to Chồng yêu.
