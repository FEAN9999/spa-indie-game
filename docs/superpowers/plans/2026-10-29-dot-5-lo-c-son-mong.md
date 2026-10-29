# Đợt 5 lô C: Sơn móng (save v29) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From 5★, with massage open, the main shop can learn Sơn móng through the lesson lô A built: pay 1.000.000 đ once, then on the teacher's hand pick the polish that matches the sample and trace the dotted pattern on five nails inside a magnifier, passing at 2★. The service then opens at every shop, a Bàn làm móng waits in the gift box, a Sơn móng stock appears in Kho, and office workers, stars and ladies start asking for it. A shop that has not learned it plays exactly as before. Save version 29.

**Architecture:**
- **Nails is the ninth `ServiceId`** and the third `LessonService`. The lesson, the paged panels, the learn line and the Hud dot are generic over `LESSON_SERVICES`, so they take nails with no new logic. This lot adds:
  - the data, including a new stock item, `polish`, as lô A added `salt`;
  - the per-service map entries;
  - a frozen log proving that a 5★ shop which has learned scrub and foot but not nails draws as before.
- **The game rules are a pure class,** `NailsGame` in `src/sim/nails.ts`, built like `FootGame`: it takes an `Rng` the scene seeds from `Date.now()`, so the sim's rng is never touched. `NailsScene` draws it: bottles, then a magnifier over a hand on a cushion.
- **Save v29 has no migration.** The per-key repairs already fill a missing stock key with `STOCK_START` (as for salt) and `nails` in the tiers and the counts; `repairLessons` reads `LESSON_SERVICES`.

**Tech Stack:** Phaser 4, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-29-dot-5-dich-vu-moi-design.md`. Lô C covers:
- nails in §7.1 (its table row and bullets);
- the nails lines of §7.2 and of the §8 intro;
- §8.3;
- §9 and §10 for lô C.

**Visual reference:** the approved sketch, `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\9ad07023-61da-40ae-b124-964377a3b4ba\scratchpad\sketch\template-dich-vu.html`, published at https://claude.ai/artifact/P2j3iiJzkyVgQr24Vtoa39.
- It uses the game's 1080×2160 frame, so its numbers carry over unscaled.
- Each art step names the sketch lines it follows. Re-express them in the game's patterns; do not paste the sketch.

**OSS research** (CLAUDE.md rule; done for the spec, notes in scratchpad `dot-5-oss.md`): NailSalon picks a colour by tapping the right bottle; Letterpaint and dalgona games fail a stroke that leaves the line, which the spec drops for dotted strokes that only count smudges. Our own code.

**Baseline:**
- 1416 tests in 114 files pass on `dot-5-dich-vu` at 26acb6f (equal to master).
- Typecheck: `npx tsc --noEmit` (it includes `tests/`).
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.

## Global Constraints

- **The bans (spec §5):**
  - A shop that has not learned nails plays exactly as before:
    - every old test still passes;
    - `draws-six-services.json`, `draws-seven-services.json` and the new `draws-eight-services.json` are never edited;
    - nothing new is drawn from the sim's rng;
    - paying the tuition alone changes no draw.
  - Nails never changes `serviceArrivalFactor`. The "Đủ món" badge goal stays 6, and the rank's service part stays full at 6 ("6/6 món").
  - Tuition is never paid twice. Old saves open with nothing lost.
  - Playable with a thumb at 390 px, with no text overflowing.
- **Numbers** (spec §7.1, verbatim):
  - nails opens to learn at 5★ with massage open;
  - tuition 1.000.000 đ, price 220.000 đ;
  - it uses Sơn móng (560.000 đ per 20, with 20 on hand once learned) and a towel;
  - Bàn làm móng costs 750.000 đ, and one is given to the gift box;
  - staff tiers and courses as for the old services;
  - office, celeb and lady add nails to `prefers`, and picky likes every service.
- **The game** (spec §8.3, verbatim):
  - the customer's hand on a cushion, 5 nails; a sample card in the top corner with one colour and one pattern (chấm bi, sọc, trái tim, hoa);
  - step 1: 4 bottles; tap the sample's colour. A wrong one: the customer shakes her head, that bottle fades, pick again; each wrong pick counts toward the stars;
  - step 2: each nail's pattern as a dotted line, big in a magnifier above the hand. A dot lights when the finger reaches it, counting the stretch between two touches;
  - a nail ends when every dot is lit, or on lifting after the last dot is reached;
  - leaving the nail's edge while painting is one smudge, with 8 px of slack on the 1080 frame;
  - a nail is **đẹp** with at least 80% of its dots lit and at most 1 smudge;
  - the hard version (khách khó tính and quý bà, plus VIPs and stars as in every game): finer dots and the harder patterns (trái tim, hoa); zig-zag scribbling is allowed;
  - 3★: the right colour first time and 5 good nails; 2★: at most 1 wrong pick and at least 3 good nails; else 1★. 25 seconds.
- **Save version: the next free number on master, v29 today.**
  - `SAVE_VERSION` in `src/sim/save.ts` is the only place the number lives in `src`.
  - Tests compare a written version with `SAVE_VERSION`.
  - The controller re-checks master's save version at ship time. If master took 29, renumber as lô A's plan says: bump, accept the old number, rename the `describe` titles, and add the fixture to the "opens every older save" lists.
- **Copy, verbatim** (spec §7.2, §8):
  - "Chọn lọ sơn đúng màu thẻ mẫu.", "Kéo ngón theo nét chấm, đừng lem ra ngoài móng.";
  - "Chọn lọ đúng màu khách muốn", "Kéo ngón theo nét chấm";
  - floating words "Lem rồi!", "Đẹp!", "Chưa đẹp";
  - names "Sơn móng" (the service and the stock) and "Bàn làm móng".
- **Layers:**
  - `src/sim/**` has no Phaser and no strings.
  - Numbers go in `src/config.ts`, strings in `src/strings/vi.ts`, art in `src/art/*`.
  - Every new hex is a value of `C`, and every colour added here is used by some task.
  - Doc comments sit directly on their function.
- **Sounds:** none new, and the nails game plays none of its own.

## Review Focus

1. **A 5★ shop that has learned Chà muối biển and Ngâm chân but not Sơn móng draws exactly as before,** at the main shop and the beach, and also once the nails tuition is paid. Covered by T1 (frozen log and its paid variant).
2. **A slow, careful thumb is not punished.** Tracing at 200 px/s (about half the sketch's 380) gives 3★ on every seed 1–50, normal and hard; at 130 px/s it still gives at least 2★ (spec §5: a first-time adult who follows the line gets 2★). Covered by T3.
3. **Touches that do not count cost nothing.** A tap between bottles or on a faded bottle is not another wrong pick. Touches during the coat or the "Đẹp!" pause light nothing and smudge nothing. A stroke that starts outside the nail and slides in is not a smudge. Covered by T3; the demo hand surviving them is T4 and the browser pass.
4. **A finger still down when a nail ends** starts the next nail clean: no dot lit from the old point, no smudge, no segment across. Covered by T3.
5. **At Khu cao cấp, ladies and office workers ask for Sơn móng only once that branch has its own desk,** and the arrival factor is unchanged. Office workers do the same at the main shop. Covered by T1.

---

### Task 1: Pin today's draws and save, put Sơn móng in the data, the lesson, the stock and the art, and hold updates during a lesson

**Files:**
- Create: `tests/fixtures/draws-eight-services.json`, `tests/fixtures/save-v28.json`
- Modify:
  - `src/config.ts`;
  - `src/sim/services.ts`, `src/sim/items.ts`, `src/sim/stock.ts`, `src/sim/customers.ts`, `src/sim/types.ts` (`HINT_IDS`, the toast key union);
  - `src/strings/vi.ts`;
  - `src/art/palette.ts`, `src/art/fx.ts`, `src/art/furniture.ts`;
  - `src/view/lesson.ts`;
  - `src/scenes/LessonScene.ts` (`GAME_SCENE`, `LESSON_DEMO`);
  - `src/scenes/SpaScene.ts` (`MINI_GAME_SCENE`, `DEMO_HINT`, the away-card gate, `checkForUpdate`);
  - `src/app/update.ts` (`shouldReload`).
- Test:
  - `tests/sim/helpers.ts`, `tests/sim/same-draws.test.ts`, `tests/sim/lessons.test.ts`;
  - `tests/sim/services.test.ts`, `items.test.ts`, `stock.test.ts`, `customers.test.ts`, `economy.test.ts`, `staff.test.ts`, `badges.test.ts`, `rank.test.ts`;
  - `tests/view/lesson.test.ts`, `rank.test.ts`, `servicesPanel.test.ts`, `catalog.test.ts`, `staffCard.test.ts`;
  - `tests/app/update.test.ts`;
  - `tests/sim/save.test.ts` (`withNewKeys` and today's pinned literals only).

**Interfaces:**
- Produces, in `src/sim/services.ts`:
  - `LessonService = 'scrub' | 'foot' | 'nails'`, with `LESSON_SERVICES = ['scrub', 'foot', 'nails']`;
  - `SERVICE_IDS` ends `…, 'scrub', 'foot', 'nails'`;
  - `SERVICES.nails = { price: SERVICE_PRICE.nails, openCost: SERVICE_OPEN_COST.nails, bed: 'nailDesk', name: 'serviceNails', busy: 'busyNails' }`.
- Elsewhere in the sim:
  - `ItemKind` gains `'nailDesk'`: `ITEMS.nailDesk = { w: 2, h: 2, price: 750_000, beauty: 0, group: 'bed', name: 'itemNailDesk' }`, listed right after `footChair`. Its bed tile is the lower row's tile beside the work tile, as for every bed.
  - `StockItem` gains `'polish'`, last in `STOCK_ITEMS`. `STOCK_USES.nails = ['polish', 'towel']`, `STOCK_NAME.polish = 'stockPolish'`, and `fullStock()` has `polish: STOCK_START`.
  - `KINDS.office.prefers = ['shampoo', 'mask', 'stone', 'nails']`, `KINDS.celeb.prefers = ['massage', 'mask', 'mud', 'nails']`, `KINDS.lady.prefers = ['mask', 'mud', 'stone', 'nails']`.
  - `HINT_IDS` gains `'demoNails'` right after `'demoFoot'`; the toast key union gains `'busyNails'` right after `'busyFoot'`.
- Config: `SERVICE_PRICE.nails = 220000`, `SERVICE_OPEN_COST.nails = 1000000`, `LESSON_STARS = { scrub: 3, foot: 4, nails: 5 }`, `RESTOCK_PRICE.polish = 560000`.
- Strings:
  - `serviceNails: 'Sơn móng'`, `stockPolish: 'Sơn móng'`;
  - `itemNailDesk: 'Bàn làm móng'`, `busyNails: 'Bàn làm móng đang bận'`;
  - `learnHowNails1: 'Chọn lọ sơn đúng màu thẻ mẫu.'`, `learnHowNails2: 'Kéo ngón theo nét chấm, đừng lem ra ngoài móng.'`.
- Colour: `C.pinkPale = '#F7C6D0'` (sketch line 143), used by the three textures below and by Task 4's cushion.
- Textures: `'svc-nails'` and `'stock-polish'` (fx), `'nailDesk'` (furniture).
- Scene maps: `MINI_GAME_SCENE.nails` and `GAME_SCENE.nails` are `'NailsScene'` (registered in Task 4); `DEMO_HINT.nails` and `LESSON_DEMO.nails` are `'demoNails'`.
- App shell: `shouldReload(running: string, latest: string | null, serving: boolean, lesson: boolean): boolean`, documented as "never in dev, never in the middle of a service or a lesson".
- Test helper `learnFoot(chain: Chain): void` in `tests/sim/helpers.ts`, documented as "A 5-star main shop that has learned Chà muối biển and Ngâm chân, with their beds placed and the branches told":
  - `learnScrub(chain)`;
  - `chain.main.rank.stars = 5`;
  - `chain.main.services` = the six old ids, `'scrub'`, `'foot'`;
  - `placeFirst(chain.main, 'footChair')`;
  - `chain.sync()`.

- [ ] **Step 1: Freeze both fixtures before anything changes.** With today's code, add `learnFoot`, then write both fixtures from a throwaway vitest file and delete it.
  - **`tests/fixtures/draws-eight-services.json`** is `sixServiceLog(4, learnFoot)`.
  - **`tests/fixtures/save-v28.json`:**
    - `starShop(5, 20_000_000, 3)` with `services = ['shampoo', 'mask', 'massage', 'scrub', 'foot']`;
    - `placeFirst` for `maskBed`, `massageBed`, `scrubBed` and `footChair`;
    - a technician hired with tiers `{ massage: 2, scrub: 1, foot: 1 }`;
    - a `Chain(main, 8)` with the beach and the old town open, one technician hired at the old town, then `chain.sync()` and `chain.startDay()`;
    - the main technician's `study` set to `{ course: 'foot', paid: 100000 }`;
    - `main.spawnCustomer({ kind: 'elder', service: 'foot' })`;
    - `savedAt` set to `1_800_000_000_000` on the written JSON.
  - Neither file is edited afterwards.
- [ ] **Step 2: Write the failing tests.**
  - **`same-draws.test.ts` (Review Focus 1),** each with a `30_000` timeout like the existing ones:
    - "draws the same in a 5-star chain with Chà muối biển and Ngâm chân learned while Sơn móng is not": `sixServiceLog(4, learnFoot)` equals the new fixture;
    - "draws the same when the Sơn móng tuition is paid and the lesson not passed": the same with `c => { learnFoot(c); expect(c.main.payLesson('nails')).toBeNull() }`.
  - **`services.test.ts`:**
    - `SERVICE_IDS` ends with `'scrub', 'foot', 'nails'`, and `LESSON_SERVICES` is `['scrub', 'foot', 'nails']`;
    - `SERVICES.nails` as in the Interfaces, with 220_000 and 1_000_000;
    - `serviceOfBed('nailDesk')` is `'nails'`, `isLessonService('nails')` is true, `LESSON_STARS.nails` is 5.
  - **`items.test.ts`:**
    - `ITEMS.nailDesk` as above, at index `footChair`'s + 1 in `ITEM_KINDS`;
    - a desk at (4, 6) has `bedTile` (5, 7) and `workTile` (6, 7); flipped, (4, 7) and (3, 7).
  - **`stock.test.ts`:**
    - `STOCK_ITEMS` ends `'salt', 'polish'`; `STOCK_USES.nails` is `['polish', 'towel']`;
    - `fullStock().polish` is 20 and `RESTOCK_PRICE.polish` is 560_000;
    - `stockUsers('polish', [...SERVICE_IDS])` is `['nails']`;
    - `stockItemsFor([...six, 'nails'])` is the six old items then `'polish'`, without `'salt'`.
  - **`customers.test.ts`:** office's, celeb's and lady's `prefers` as above, and picky's equals `SERVICE_IDS`.
  - **`economy.test.ts`:** `serviceArrivalFactor` of the six old ids plus scrub, foot and nails equals that of the six.
  - **`staff.test.ts`:**
    - `noTiers().nails` is 0;
    - `candidatePool(SERVICE_IDS)` ends `'scrub', 'foot', 'nails'`;
    - `courses(tech, [...six, 'nails'])` ends with `'nails'`.
  - **`badges.test.ts`:** `badgeProgress('allServices', { ...zeroShop(), services: 9 })` is `[6, 6]`.
  - **`tests/sim/rank.test.ts`:** `monthInput(emptyRankBook(13, 100, 5), 15, 4, 30, 9, { served: 145, lost: 10 }).services` is 6.
  - **`lessons.test.ts`, `describe('Sơn móng')`:**
    - **Who can learn:** `starShop(4).lessonProblem('nails')` is `'stars'`, `starShop(5)` gives null, and money 999_999 gives `'money'`.
    - **Paying and passing:** `payLesson('nails')` takes exactly 1_000_000; `passLesson('nails')` leaves `book.gifts` with one `'nailDesk'`; `stock.polish` is 20.
    - **Any order,** on `starShop(5)`:
      - `learnable()` is `'scrub'`;
      - pay and pass nails: `services` is `['shampoo', 'mask', 'massage', 'nails']`, and `learnable()` is still `'scrub'`;
      - pay and pass scrub, then foot: `services` ends `'scrub', 'foot', 'nails'`.
    - **Review Focus 5:** a `Chain(starShop(5), 11)` with `uptown` open, and nails passed at the main shop, then `chain.sync()`:
      - before `placeFirst(uptown, 'nailDesk')`, 300 `drawService('lady', uptown.availableServices(), rng)` never give `'nails'`;
      - after it, they do;
      - `serviceArrivalFactor(uptown.availableServices())` is unchanged by the desk;
      - at the main shop with `placeFirst(main, 'nailDesk')`, 300 office draws include `'nails'`.
    - **Served by staff:** at the main shop with nails learned and a desk, a technician (tiers `{}`) serves `spawnCustomer({ kind: 'office', service: 'nails' })`:
      - the `'paid'` amount is `rankPrice(220_000, 5)`;
      - `stock.polish` and `stock.towel` each drop by 1.
  - **`tests/view/lesson.test.ts`:**
    - `lessonTitle('nails')` is `'Học Sơn móng'`;
    - `lessonHowTo('nails')` is the two spec lines;
    - `lessonPassLine('nails')` is `'Tiệm đã có Sơn móng. Quà: một Bàn làm móng trong hộp quà.'`.
  - **`tests/view/rank.test.ts`:**
    - `learnLine(m(4, 5), ['massage'])` is `'Món mới để học: Sơn móng.'`, and null when the services hold `'nails'`;
    - the test "is null for other rises and for keeping" drops its `m(4, 5)` line, which now names Sơn móng.
  - **`servicesPanel.test.ts`:**
    - `panelPage(SERVICE_IDS, 1).rows` and `panelPage(SERVICE_IDS, -1).rows` are `['scrub', 'foot', 'nails']`;
    - `panelPage(stockItemsFor([...SIX, 'scrub', 'nails']), 1).rows` is `['salt', 'polish']`;
    - `lessonAction(starShop(4), 'nails')` is `{ kind: 'note', text: 'Đạt 5★' }`;
    - `lessonAction(starShop(5), 'nails')` is `{ kind: 'learn', label: 'Học nghề\n1.000.000 đ', faded: false }`;
    - `servicesOpening(starShop(5), true, false)` is `{ tab: 'services', page: 1 }`.
  - **`catalog.test.ts`:** "lists the nail desk only once Sơn móng is open", across all pages of `catalogPage('bed', …)`; and the `all` list in "offers every kind but the gifts exactly once" gains `'nails'`.
  - **`tests/app/update.test.ts`:** the existing calls gain a fourth argument `false`, and `shouldReload('a', 'b', false, true)` is false ("never reloads in the middle of a lesson").
- [ ] **Step 3: Run them to see them fail.** Run: `npx vitest run tests/sim tests/view tests/app`. Expected: the new assertions fail. In `same-draws.test.ts` only the nails-paid test fails (`payLesson('nails')` throws today); the other six pass.
- [ ] **Step 4: Implement.**
  - Add the ids, item, stock item, prefers, hint, toast key, config, strings and scene-map entries in the Interfaces.
  - `HOW_TO.nails = ['learnHowNails1', 'learnHowNails2']`.
  - In `SpaScene`'s away-card gate, add `!this.scene.isActive('NailsScene')` beside the Scrub and Foot ones.
  - **Hold the update during a lesson** (lô B follow-up). In `checkForUpdate`:
    - the early return also fires while `this.scene.isActive('LessonScene')`;
    - after the await, `shouldReload(BUILD_ID, latest, this.sim.servingCustomerId !== null, this.scene.isActive('LessonScene'))`, since a lesson can start during the wait.
  - **Art**, with `C.pinkPale` added:
    - `'svc-nails'`: a red bottle beside a painted nail on a pinkPale badge (sketch line 588);
    - `'stock-polish'`: two bottles, red and teal, on a pinkPale badge (line 598);
    - `FURNITURE.nailDesk = { w: 2.1, h: 2.45, body }`:
      - the sketch's low desk (lines 288–293: woodLight top, pinkPale hand cushion with a lotusDark dashed seam, a mustard lamp, three bottles) in the lower 1.45 tiles;
      - in the upper row, over the right-hand column, the customer's padded stool (woodLight frame, pinkPale seat). It sits behind the desk, the way the sketch seats the lady behind it (lines 382–385). The art mirrors when the item is flipped, as for the mud tub.
- [ ] **Step 5: Update the tests that pin today's lists.**
  - The `SERVICE_IDS` and `LESSON_SERVICES` lists, `STOCK_ITEMS`, lady's full `KINDS` entry (`customers.test.ts:154`) and the stock and tier records gain the new entry. These are the `FULL` stock in `stock.test.ts`, the `salt: 20` records in `save.test.ts`, and the `scrub: 0, foot: 0` tier records in `save.test.ts` and `staffCard.test.ts`. `npx tsc --noEmit` lists any left.
  - In `save.test.ts`, two repair tests use `'nails'` as an unknown id: `t2.study.course` (line 797) and the dropped daily quest's `service` (line 1204). Both become `'waxing'`.
  - `withNewKeys` also sets `stock.polish ??= 20`, and `nails ??= 0` in every tiers record and both counts. The two `foot = 0` lines become `foot ??= 0`, since the v28 fixture has a foot tier. Its doc comment names Sơn móng too.
- [ ] **Step 6: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean and all green, with all seven tests in `same-draws.test.ts` passing.
- [ ] **Step 7: Commit.** Stage the files by name. Message: `Add Sơn móng to the services, the lesson, the stock, the beds and the staff tiers, learned at 5 stars without bringing more customers, and hold an update's reload while a lesson is open`.

### Task 2: Save version 29

**Files:**
- Modify: `src/sim/save.ts`
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Consumes: the v28 fixture and `withNewKeys` (Task 1).
- Produces: `SAVE_VERSION = 29`, with `parseVersioned` also accepting 28.

- [ ] **Step 1: Write the failing tests** in `describe('save version 29')`, mirroring the v28 block:
  - **The v28 fixture:**
    - `parseSave(structuredClone(v28))` equals `withNewKeys(v28)`;
    - `Chain.fromSave(parseSave(v28), 8)` has `'scrub'` and `'foot'` and no `'nails'` in the main shop's `services`;
    - the technician has foot tier 1, nails tier 0 and the `'foot'` course; there is one foot chair;
    - the old town has foot, one staff member and `stock.polish` 20, as the main shop does;
    - it saves as `SAVE_VERSION`.
  - **Every older save:** every fixture v1–v28 opens with `Chain.fromSave` and saves as `SAVE_VERSION`.
  - **Versions:** 28 and `SAVE_VERSION` open, and `SAVE_VERSION + 1` throws `SaveTooNewError`.
  - **`lessonsPaid`:** read through the v28 fixture, as the v28 block's `paid` helper does:
    - `['nails']` is kept;
    - `['nails', 'foot', 'scrub']` with services `['shampoo']` reads `['scrub', 'foot', 'nails']`;
    - `['nails']` with `'nails'` in `services` reads `[]`.
  - **Polish:** the v28 fixture with `stock.polish = 7` reads 7, and with `-1` reads 20.
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/sim/save.test.ts`.
- [ ] **Step 3: Implement** `SAVE_VERSION = 29`, and add 28 to the versions `parseVersioned` accepts. No migration line.
- [ ] **Step 4: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean, all green.
- [ ] **Step 5: Commit.** Message: `Save in version 29, so a build from before Sơn móng refuses a save that has it instead of dropping it`.

### Task 3: The Sơn móng rules

**Files:**
- Create: `src/sim/nails.ts`, `tests/sim/nails.test.ts`
- Modify: `src/config.ts`

**Interfaces:**
- Produces, in `src/config.ts`. These are the sketch's `NAILS` (lines 1297–1306), in ms and in game pixels on the card, under a section comment like foot's:
  - `NAILS_LIMIT_MS = 25000`, `NAILS_COUNT = 5`;
  - `NAILS_BOTTLE_X = [225, 435, 645, 855]`, `NAILS_BOTTLE_Y = 930`, `NAILS_BOTTLE_HIT = { x: 95, y: 130 }`: how far from a bottle's centre a tap still picks it;
  - `NAILS_NAIL = { x: 540, y: 905 }`: the big nail's centre;
  - `NAILS_SHAPE = { hw: 120, top: -165, cap: -45, bottom: 150 }`: half width, top, where the round top meets the sides, bottom;
  - `NAILS_EDGE_TOL = 8`;
  - `NAILS_DOT_R = 16` and `NAILS_DOT_R_HARD = 10` (drawn); `NAILS_REACH = 50` and `NAILS_REACH_HARD = 34`: how far from the finger's path a dot lights; `NAILS_GAP = 46` and `NAILS_GAP_HARD = 36`: the spacing of the dots;
  - `NAILS_COAT_MS = 500`, `NAILS_NEXT_MS = 450`, `NAILS_SHAKE_MS = 600`;
  - `NAILS_GOOD = { lit: 0.8, smudges: 1 }`, `NAILS_STARS = { wrong2: 1, good2: 3 }`.
- Produces, in `src/sim/nails.ts`:
  - `export type NailsPattern = 'dots' | 'stripes' | 'heart' | 'flower'`, with `NAILS_PATTERNS = ['dots', 'stripes']` and `NAILS_PATTERNS_HARD = ['heart', 'flower']`.
  - `export type NailsPhase = 'pick' | 'coat' | 'trace' | 'next' | 'done'`.
  - `export interface NailsPt { x: number; y: number }`, and `export interface NailsTouch { lit: number; smudge: boolean }`: the dots this touch lit, and whether it was a smudge.
  - `export const nailsBottleAt = (x: number, y: number): number | null`: the bottle whose box (±`NAILS_BOTTLE_HIT`) holds the point.
  - `export const inNail = (x: number, y: number): boolean`: on the big nail, card pixels, with `NAILS_EDGE_TOL` of slack (sketch lines 1312–1317).
  - `export const nailsDots = (pattern: NailsPattern, gap: number): NailsPt[]`: the pattern's dots round `NAILS_NAIL`, spaced `gap` along its line.
  - `export const nailGood = (lit: number, total: number, smudges: number): boolean`.
  - `export const nailsStars = (wrong: number, good: number): Stars`: 3 when `wrong === 0 && good === NAILS_COUNT`; 2 when `wrong <= NAILS_STARS.wrong2 && good >= NAILS_STARS.good2`; else 1.
  - `export class NailsGame`, built by `constructor(rng: Rng, hard = false)`:
    - **Drawn once, in this order:**
      - `readonly order: readonly number[]`: the colour on each bottle, left to right, a Fisher–Yates shuffle of 0–3 (`i` from 3 down to 1, `j = floor(rng() · (i + 1))`);
      - `readonly colour: number`: the sample's colour, `floor(rng() · 4)`;
      - `readonly pattern: NailsPattern`: `floor(rng() · 2)` of the normal or the hard list.
    - **Fixed by `hard`:** `readonly dots: readonly NailsPt[]`, `readonly reach: number`, `readonly dotR: number`.
    - **State:**
      - `phase: NailsPhase = 'pick'`, `phaseMs`, `elapsedMs`;
      - `wrong`; `faded: number[]` (the bottles picked wrong, in order); `shakeMs`;
      - `nail`; `lit: boolean[]`; `smudges`; `blobs: NailsPt[]` (where the finger left the nail); `outside` (from a smudge until the finger is back on the nail or lifts);
      - `results: boolean[]` (good or not, per finished nail); `litAll: boolean[][]` (each finished nail's lit dots).
    - **Methods:**
      - `pick(bottle: number): 'right' | 'wrong' | null`;
      - `down(x: number, y: number): NailsTouch`, `move(x: number, y: number): NailsTouch`, `up(): void`;
      - `tick(ms: number): void`;
      - `progress(): number`: 0 in `'pick'` and `'coat'`, `(results.length + litCount / dots.length) / NAILS_COUNT` in `'trace'`, and `results.length / NAILS_COUNT` after;
      - `stars(): Stars | null`: `nailsStars(wrong, good nails)` once `'done'`, else null.

- [ ] **Step 1: Write the failing tests.**
  - **The test helpers:**
    - `listRng(values)` returns the values in order, then 0.
    - `abs(g, i)` is dot `i` in card pixels.
    - `traceReady(rngValues)`: a normal game that picks the sample's bottle and ticks 16 ms frames to `'trace'`.
    - `play(g, { wrong = 0, pxPerS = 380, smudge = [], pickMs = 600 })` runs 16 ms frames, input then tick, until `'done'`. It is the sketch's `nailsPlan` (lines 1610–1644):
      - in `'pick'`, every `pickMs` it picks. Its first `wrong` picks take the first unfaded bottle not of the sample's colour; then it takes the sample's;
      - in `'trace'`, on each new nail it routes through the dots in card pixels. `smudge[i] = k` inserts `k` detours 150 px sideways (away from x 540) and back, after dots `floor(n · m / (k + 1))` for `m = 1..k`;
      - it advances `pxPerS · 0.016` px along the route each frame, with `down` at the start and `move` after; at the end it moves to the last point and calls `up`.
  - **The draw:**
    - `new NailsGame(listRng([0, 0, 0, 0.5, 0]))` has `order` `[1, 2, 3, 0]`, `colour` 2, pattern `'dots'` with 9 dots, `reach` 50 and `dotR` 16; the sample's bottle is 1.
    - With `0.6` last, the pattern is `'stripes'`, with 19 dots.
    - Hard: `'heart'` (17 dots) and `'flower'` (22 dots), with `reach` 34 and `dotR` 10.
    - For seeds 1–50 from `createRng`, normal and hard:
      - `order` is a permutation of 0–3;
      - the pattern is from the right list;
      - every dot is `inNail` in card pixels.
    - `nailsDots('dots', 46)[0]` is (0, −122), and `nailsDots('stripes', 46)[0]` is (−70, −118).
  - **The edges:**
    - `inNail` is true at (668, 905), (540, 732) and (540, 1063), and false at (669, 905), (540, 731) and (540, 1064);
    - `nailsBottleAt` gives 0 at (225, 930) and 3 at (950, 930); null at (951, 930), 1 at (435, 800), null at (435, 799), and null at (330, 930), between two bottles.
  - **The pick:**
    - `pick(0)` is `'wrong'`, with `wrong` 1, `faded` `[0]` and `shakeMs` 600; `shakeMs` is 0 after 600 ms of ticks;
    - `pick(0)` again is null, and `wrong` stays 1 (Review Focus 3);
    - `pick(1)` is `'right'`, and the phase is `'coat'`, then `'trace'` after `NAILS_COAT_MS`;
    - `pick` returns null in every other phase.
  - **Review Focus 3:** in `'pick'`, `'coat'` and `'next'`, `down` and `move` return `{ lit: 0, smudge: false }` and change neither `lit` nor `smudges`.
  - **The stretch between two touches**, from `traceReady([0, 0, 0, 0.5, 0])`:
    - `down(440, 783)` is `{ lit: 0, smudge: false }`;
    - `move(640, 783)` is `{ lit: 2, smudge: false }`, with dots 0 and 1 lit;
    - neither end is within 50 of any dot.
  - **Smudges:**
    - `down(540, 905)`; `move(668, 905)` is no smudge; `move(669, 905)` is a smudge, with `outside` true;
    - `move(540, 905)` is none, with `outside` false; `move(400, 905)` is a smudge;
    - `smudges` is 2, with 2 `blobs`, and `up()` clears `outside`.
  - **Review Focus 3:** `down(740, 905)` then `move(540, 905)` is `{ lit: 3, smudge: false }`, and `smudges` stays 0.
  - **Ending a nail:**
    - `down` on dot 0, then `move` to each dot in turn: after dot 7 the phase is `'next'` (dot 8 is in reach), with `results` `[true]`;
    - `down` on dot 8 lights dots 7 and 8, and the phase stays `'trace'`; `up()` then gives `'next'` and `results` `[false]` (2 of 9);
    - `up()` with the last dot unlit keeps the phase `'trace'`.
    - After `NAILS_NEXT_MS` in `'next'`: `nail` 1, `lit` all false, `smudges` 0, `blobs` empty, `'trace'`; `litAll[0]` holds the first nail's dots.
  - **Review Focus 4:** end nail 0 by moves alone, with no `up`, and tick to `'trace'`. The next `move(300, 905)` is `{ lit: 0, smudge: false }`, and the one after lights from there.
  - **3★:**
    - `play` on `[0, 0, 0, 0.5, 0]`: `results` five `true`, `stars()` 3, `progress()` 1, `elapsedMs` between 6_500 and 8_000;
    - on stripes: 3★, with `elapsedMs` between 12_000 and 13_500;
    - `smudge: [1, 1, 1, 1, 1]`: still 3★, since one smudge keeps a nail good;
    - hard, heart and flower: 3★.
  - **2★:**
    - `wrong: 1`;
    - `smudge: [2, 2]`: `results` `[false, false, true, true, true]`;
    - `wrong: 1, smudge: [0, 0, 0, 0, 2]`: four good nails, which was the old rule's 1★ cliff;
    - stripes at 120 px/s: time runs out on the fourth nail, which does not count, so `results` has 3 entries, with `elapsedMs` 25_000.
  - **1★:**
    - `smudge: [2, 2, 2]`;
    - `wrong: 2` with five good nails;
    - no touches: `'done'` at `elapsedMs` 25_000, with `results` empty.
  - **Review Focus 2:** for seeds 1–50, normal and hard, `play` at 200 px/s gives 3★, and at 130 px/s at least 2★.
  - **`nailsStars`:** `(0, 5)` → 3, `(1, 5)` → 2, `(0, 3)` → 2, `(1, 4)` → 2, `(1, 2)` → 1, `(2, 5)` → 1.
  - **`nailGood`:** `(8, 10, 1)` is true; `(7, 10, 0)` and `(10, 10, 2)` are false.
  - **Done:** afterwards `pick` returns null, `down` and `move` return zero, and `tick` changes nothing.
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/sim/nails.test.ts`. Expected: FAIL, no module.
- [ ] **Step 3: Implement `NailsGame`,** after the sketch's `MAKE.nails` rules (lines 1407–1486, 1558–1562).
  - **`nailsDots`:**
    - `patternLine` follows sketch lines 1318–1336 exactly, with the same constants;
    - `dotsAlong` follows lines 1337–1358, closed for heart and flower;
    - a dot lights when its distance to the touch segment is at most `reach` (segment distance, lines 1359–1364).
  - **`pick(bottle)`:**
    - null unless `'pick'` and the bottle is not faded;
    - **right:** go to `'coat'`;
    - **wrong:** `wrong++`, push to `faded`, `shakeMs = NAILS_SHAKE_MS`.
  - **`down(x, y)`** (`'trace'` only): starts a stroke at the point, notes whether it is on the nail, and lights against the point itself.
  - **`move(x, y)`** (`'trace'` only):
    - with no stroke under way, it starts one there and lights nothing;
    - else, leaving the nail (on it before, off it now) is a smudge: `smudges++`, push the point to `blobs`, `outside = true`;
    - coming back on clears `outside`;
    - then it lights against the segment from the last point.
  - **Ending a nail:** when every dot is lit, or on `up()` in `'trace'` with a stroke under way and the last dot lit:
    - push `nailGood(lit count, dots, smudges)` to `results` and a copy of `lit` to `litAll`;
    - clear the stroke and `outside`;
    - go to `'next'`.
  - **`up()`** clears the stroke and `outside`.
  - **`tick(ms)`:**
    - nothing when done or when `ms <= 0`;
    - `phaseMs += ms`; `shakeMs` counts down to 0;
    - `elapsedMs = min(NAILS_LIMIT_MS, elapsedMs + ms)` in every phase, and the game is done at the limit;
    - at most one move per tick: `'coat'` → `'trace'` at `NAILS_COAT_MS`; `'next'` → the next nail at `NAILS_NEXT_MS`, or `'done'` after the fifth.
- [ ] **Step 4: Run the tests.** Run: `npx vitest run tests/sim/nails.test.ts`. Expected: PASS. If a timing edge misses by one frame, fix the test's frame arithmetic, never the spec's numbers.
- [ ] **Step 5: Commit.** Message: `Add the Sơn móng rules: pick the sample's polish, light the dots along each nail's pattern including the stretch between two touches, count each slip past the edge as a smudge, and stars after 25 seconds`.

### Task 4: The nails game on screen, and the customer at the desk

**Files:**
- Create: `src/scenes/NailsScene.ts`, `src/art/nailsArt.ts`, `tests/art/nailsArt.test.ts`
- Modify:
  - `src/art/palette.ts`;
  - `src/scenes/BootScene.ts`;
  - `src/main.ts` (`NailsScene` after `FootScene`);
  - `src/scenes/SpaScene.ts` (the seated services);
  - `src/view/miniGame.ts` and `src/scenes/LessonScene.ts` (the teacher flag);
  - `src/config.ts` (`FOOT_SEAT_MS`'s doc comment only);
  - `src/strings/vi.ts`.

**Interfaces:**
- Consumes:
  - `NailsGame` (its `dots`, `reach`, `dotR` and state), `nailsBottleAt`, `NAILS_*` (Task 3);
  - `MiniGameData`, `addMiniGameCard`, `setInstruction`, `drawBars`, `revealStars`;
  - `customerColors`, `teacherColors`, `CharacterView`, the `'hand'` texture;
  - `C.pinkPale` (Task 1).
- Produces:
  - `nailsTextures(): Record<string, string>`, with five textures:
    - `'nails-cushion'`: the pinkPale cushion with its lotusDark dashed seam;
    - `'nails-hand'`: the five fingers and the palm in white, with the crease in `#DCDCDC`, to be tinted by skin;
    - `'nails-hand-line'`: their ink silhouette, each finger 9 px wider, drawn under `'nails-hand'`;
    - `'nails-tip'`: the fingertip in the lens, white with a `#DCDCDC` crease, already clipped to the lens circle, to be tinted;
    - `'nails-tip-line'`: its ink edge, clipped the same way.
  - Also exported from `nailsArt.ts`:
    - `NAILS_BOX`: each texture's top-left on the card, as `FOOT_BOX` does;
    - `NAILS_FINGERS`: the sketch's fingers, as tip x, y, base x, y and width (line 1304).
  - New colour in `C`: `nailBare: '#F6D9D2'` (sketch line 1305), for the bare small nails.
  - `MiniGameData.teacher?: boolean`: "the lesson's practice game, whose customer is the teacher". `LessonScene` sets it.
  - Scene key `'NailsScene'`, opened with `MiniGameData`.
  - Strings:
    - `nailsPick: 'Chọn lọ đúng màu khách muốn'`, `nailsTrace: 'Kéo ngón theo nét chấm'`;
    - `nailsSmudge: 'Lem rồi!'`, `nailsGood: 'Đẹp!'`, `nailsBad: 'Chưa đẹp'`.

- [ ] **Step 1: Write the failing test** `tests/art/nailsArt.test.ts`, the way `footArt.test.ts` does:
  - the five textures are `<svg` documents;
  - every hex in them is a value of `C`, or `#FFFFFF`/`#DCDCDC` in `'nails-hand'` and `'nails-tip'`, which hold both.
- [ ] **Step 2: Run it to see it fail.** Run: `npx vitest run tests/art/nailsArt.test.ts`.
- [ ] **Step 3: Implement the art and the scene.**
  - Register `nailsTextures()` in `BootScene` beside `footTextures()`.
  - **The card:** `addMiniGameCard(this, t('nailsPick'))`; rules from `new NailsGame(createRng(Date.now()), params.hard)`. The game takes no day-ease time. Polish colour `k` is `[C.lantern, C.lotus, C.teal, C.mustard][k]`, the sketch's four hexes (line 1298).
  - **The customer and the sample** (sketch lines 1488–1497):
    - a sand disc of r 92 at (170, 590) holds the customer's chibi standing, scale 1.3, feet at the disc's foot. It uses `teacherColors()` when `params.teacher`, else `customerColors(look, kind, null, null, false, idol ?? null)` as `MaskScene` does;
    - a cream card (288, 482, 250 × 216, r 32) with its speech point holds the sample nail at (413, 592), scale 0.4, in the sample colour with its whole pattern;
    - while `phase === 'pick' && shakeMs > 0`, the chibi swings `sin(now · 0.04) · 10 · shakeMs / NAILS_SHAKE_MS` px in x.
  - **The hand** (sketch lines 1389–1401): `'nails-cushion'`, `'nails-hand-line'`, then `'nails-hand'` tinted by the skin.
    - Each finger carries a small nail 30 px from its tip, turned along it, `0.64 × 0.8` of the finger's width (lines 1402–1406, 1498–1510). It is drawn on one `Graphics` with `save`/`translateCanvas`/`rotateCanvas`/`restore`.
    - It is `C.nailBare` until coated. In `'coat'`, nail `i` takes the polish once `phaseMs / NAILS_COAT_MS > i / 5`.
    - The nail under way has a mustard ring during `'trace'`.
    - A finished nail shows its pattern small, and above it a teal disc with a check (good) or a lantern disc with a cross.
  - **The pick** (sketch lines 1382–1388, 1512–1519): the four bottles at `NAILS_BOTTLE_X`, `NAILS_BOTTLE_Y` in their `order` colours. Faded ones are at alpha 0.35. The last of `faded` shakes `sin(now · 0.05) · 10` px, only while `phase === 'pick' && shakeMs > 0`.
  - **The lens** (sketch lines 1521–1544), from `'coat'` on:
    - the cream pointer from the lens to the small nail under way;
    - a sand disc at (540, 930), r 250; `'nails-tip'` tinted by skin, then `'nails-tip-line'`;
    - the nail at `NAILS_NAIL` in the polish colour, with its outline in ink, or lantern while `phase === 'trace' && outside`, and the cream shine;
    - in `'trace'`:
      - the faint cream guide through the dots;
      - the lit strokes: a lit dot of `'dots'` is a cream disc of 1.15 r; for the other patterns, each lit dot joins its lit predecessor, wrapping for heart and flower, with ink under cream and a disc at each dot so the joints are round;
      - a teal ring on the first dot and a mustard ring on the last;
      - the dots, cream, faint until lit;
    - in `'next'`, the finished pattern from `litAll`;
    - the `blobs` in the polish colour; the rim, ink 8 with a cream inner ring.
  - **Words:**
    - a smudge floats `nailsSmudge` in lantern at (x, y − 70);
    - a nail's end (`results.length` grows) floats `nailsGood` in teal or `nailsBad` in lantern at (540, 700);
    - both are styled as `ScrubScene.floatWord`.
  - **The instruction** follows the phase, set only when the phase changes: `nailsPick` in `'pick'`, `nailsTrace` in `'coat'`, `'trace'` and `'next'`.
  - **Input:**
    - **`pointerdown`:** in `'pick'`, `nailsBottleAt` then `pick`; in `'trace'`, `down`.
    - **`pointermove`** while `p.isDown`: `move`.
    - **Lifting:** `pointerup`, `pointerupoutside` and `gameout` call `up`, as in `ScrubScene`.
    - Nothing reaches the rules once revealed.
  - **`update(_, delta)`:** `tick(delta)` every frame, then draw, then `drawBars(bars, progress(), 1 − elapsedMs / NAILS_LIMIT_MS)`. Once `'done'`, `reveal(stars)`.
  - **`reveal(stars)`:**
    - sets the instruction to `t('shampooDone')` ("Xong rồi!"), as every game does;
    - hides the demo hand and the lens, keeps the hand with its marks, and draws the bars;
    - then `revealStars(this, stars, () => { onDone(stars); this.scene.stop() })`.
  - `__finishForTest(stars: Stars): void`, as in `FootScene`.
  - **The demo hand** (when `params.demo`), the `'hand'` texture at alpha 0.6:
    - it is visible from the first frame of `'pick'`. It taps the sample's bottle every 800 ms: a 50 px drop in the first half, a press at scale 0.92 from 50% to 75%;
    - its pick part ends only when `pick()` returns non-null;
    - in `'trace'` on nail 0 it follows the dots at 260 px/s, rests 600 ms at the last, and loops (sketch lines 1546–1557). It is destroyed only when a `down` or `move` returns `lit > 0`;
    - it is hidden in `'coat'` and `'next'`;
    - a tap on empty space, on a faded bottle, or during the coat never touches it.
  - **The seated customer in `SpaScene`:**
    - widen the foot chair's pose instead of copying it. A module-level `SEATED: readonly ServiceId[] = ['foot', 'nails']`, documented as "services whose customer sits on the station's upper tile instead of lying";
    - `seated = onStation && SEATED.includes(c.service)`, and its comment names the nail desk;
    - the lift, the `'sit'` pose, the `'down'` facing and the hidden VIP or star mark then apply unchanged. The customer sits on the stool behind the desk, as the sketch places her (lines 382–385);
    - `FOOT_SEAT_MS`'s doc comment names the nail desk's seat too.
- [ ] **Step 4: Run the whole suite and build.** Run: `npx tsc --noEmit && npx vitest run && npx vite build --outDir .superpowers/dist-check`. Expected: clean, all green, built.
- [ ] **Step 5: Commit.** Message: `Play Sơn móng on the customer's hand: pick the sample's polish, trace each nail's dots in a magnifier with smudges left as blots, and seat the customer at the nail desk`.

### Task 5: Browser pass at 390 px (controller)

The controller runs this after the final whole-branch review. Nothing here is committed.

- **Setup:**
  - Build and serve as for lô B, then set `$B viewport 390x844`.
  - Make saves from the real sim with a throwaway test, as lô A did.
  - Drive mini-games from `game.events` `'prestep'`, never from `setInterval`. The headless page runs at about 9 fps.
  - **Tricks from lô B:**
    - the real clock is `sim.clock.minutes`;
    - a judge day is when `dayOfMonth(day) === 3`, from day 9;
    - the month's counts reset on load, so set `rank.month` at runtime;
    - restock towels before blaming idle staff.
- **The checklist:**
  1. **A 4★ shop with scrub and foot learned:** page 2 of Dịch vụ shows a faded Sơn móng reading "Đạt 5★"; Kho page 2 shows Muối biển only.
  2. **The rise to 5★:** the month card's box holds "Món mới để học: Sơn móng.", the Dịch vụ dot shows, and the panel opens on page 2.
  3. **The lesson:**
     - "Học nghề / 1.000.000 đ" fits, and pays once: "Để sau" and a reload leave "Học tiếp" at no charge;
     - the teacher card shows the two nails lines;
     - the portrait is the teacher in her áo dài.
  4. **The demo hand:**
     - it shows on the first frame, tapping the right bottle;
     - it survives a tap on empty space before the first real pick;
     - it comes back for nail 0's dots, survives a tap during the coat, and goes once a touch lights a dot.
  5. **The pick:** a wrong bottle shakes and fades while the customer shakes her head; a second tap on it does nothing; a perfect trace then ends at 2★.
  6. **The trace:**
     - dots light along the drag, including across a quick flick between two far touch points;
     - a drag past the nail's edge floats "Lem rồi!", leaves a blot, and turns the outline red until the finger is back;
     - lifting after the last dot finishes a nail with "Đẹp!" or "Chưa đẹp", and the small nail gets its mark;
     - the instruction stays on one line in both steps, and reads "Xong rồi!" at the reveal.
  7. **Fail and pass:** failing gives "Chưa đạt"; passing gives "Học xong!" with the Bàn làm móng on its disc; Build lists the desk first in Giường as Quà.
  8. **Real customers:**
     - an office customer walks to the desk, sits on the stool behind it facing down, and is served there by a technician;
     - a lady or a picky customer gets finer dots and a heart or a flower;
     - Kho's Sơn móng row (560.000 đ) does not overflow.
  9. **Khu cao cấp:**
     - its Dịch vụ row reads "Chưa có Bàn làm móng";
     - after a desk, its ladies and office workers ask for nails;
     - the course picker's nine rows fit the screen.
  10. **The update hold** (Task 1), on the production build:
      - point `version.json` at another version;
      - with a lesson game open, fire `visibilitychange` with `visibilityState` 'visible': no reload;
      - after the lesson closes, the same event reloads.
  11. **A reload of a v29 save** keeps nails, the desk and the polish count. The console has no errors.
- **Reset `$B`:** `localStorage.clear()`, then about:blank, then 1280x720.
- **Ship:**
  - check `origin/master` and the open branches (`le-tan-chi-so` and any other) for a save version;
  - integrate in a temp worktree, renumbering if v29 is taken;
  - re-run the tests, merge, push, then report to Chồng yêu.

## Calls I made

- **Bàn làm móng is 2 × 2, not the sketch's 2 × 1,** because every bed's bed and work tiles sit on its second row; the customer sits on a stool behind the desk through the foot chair's widened pose (`SEATED = ['foot', 'nails']`). Cost if wrong: a bigger piece to fit; 2 × 1 needs one-row beds in `bedTile`, `workTile` and `buildGrid`.
- **The practice game's portrait is the teacher, not the sketch's office worker** (spec over sketch: §7.2 makes the teacher the customer), via a new `MiniGameData.teacher` flag. Cost if wrong: two lines to drop.
- **The demo hand shows in both steps of the first game** (the sketch shows it only for the trace): on the right bottle until a bottle tap counts, then on nail 0's dots until a touch lights one. Cost if wrong: it gives away the first pick once.
- **The 25 s clock runs through the pick, the 500 ms coat and the 450 ms after each nail,** as the sketch's does. Cost if wrong: about 3 s less tracing; Review Focus 2 pins that a slow thumb still gets 3★.
- **The lift rule is literal:** lifting once the last dot is lit ends the nail even if the stroke began there. Cost if wrong: a child who taps the gold end ring first loses that nail; a one-line guard in `up` fixes it.
- **A smudge is each on-to-off crossing of the nail's edge;** a stroke that starts outside is none, and the red outline lasts until the finger is back or lifts. Cost if wrong: none known.
- **A finger still down across a nail's end starts a fresh stroke at its next move.** Cost if wrong: one frame of lighting.
- **The stock key is `polish`, shown as "Sơn móng" like the service,** as the spec names both. Cost if wrong: a string change; renaming the key needs a save repair.
- **Colours are indices 0–3 drawn as lantern, lotus, teal and mustard** (the sketch's four hexes), and bottles are dealt by Fisher–Yates instead of a random sort. Cost if wrong: none to players.
- **The pattern shapes stay as the sketch's formulas in `src/sim/nails.ts`;** only tunable numbers go in `config.ts`. Cost if wrong: reshaping a pattern is a code edit.
- **Save v29 though only keys are added,** so a lô B build refuses the save instead of dropping nails and a paid tuition. Cost if wrong: none.
- **Two old save tests that used `'nails'` as an unknown id now use `'waxing'`.** Cost if wrong: none.
- **The update hold adds a `lesson` argument to the pure `shouldReload`,** so it is unit-tested, plus one browser check. Cost if wrong: none.
