# Đợt 5 lô A: Chà muối biển, buổi học nghề và màn Dịch vụ có trang (save v26) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From 3★, with massage open, the main shop can learn Chà muối biển: pay 700.000 đ once, play a practice game on a teacher's back, and pass at 2★. The service then opens at every shop, a Giường chà muối waits in the gift box, and customers who like it start asking for it. The Dịch vụ and Kho panels show six rows a page. A shop that has not learned it plays exactly as before. Save version 26.

**Architecture:**
- **Scrub is a seventh `ServiceId`** at the end of `SERVICE_IDS`, of a new group, `LessonService`. Every list that feeds a random draw is built from the services the shop has, so a shop without scrub draws as before. A frozen log of a busy 3★ chain pins that.
- **Learned means `services` holds it.** The one new saved field is `lessonsPaid`, the lesson services whose tuition is paid and whose lesson is not passed. It is generic, so lô B and lô C only add ids.
- **The game rules are a pure class** (`ScrubGame`, like `MudGame`), driven by finger positions and game-time ticks. `ScrubScene` draws it on the massage's back.
- **`LessonScene`** owns the teacher card and the two result cards. It sits over the services panel the way `RecipeScene` does and launches the game scene.

**Tech Stack:** Phaser 4, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-29-dot-5-dich-vu-moi-design.md`. Lô A covers:
- scrub in §7.1;
- §7.2 (the lesson);
- §7.3 (pages);
- the §5 bans;
- the §8 intro and §8.1;
- §9 for lô A.

Foot and nails (lô B, lô C) come later, each with its own plan. No row, rank-card line or code path for them ships here.

**Visual reference:**
- The approved sketch, `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\9ad07023-61da-40ae-b124-964377a3b4ba\scratchpad\sketch\template-dich-vu.html`, published at https://claude.ai/artifact/P2j3iiJzkyVgQr24Vtoa39.
- It uses the game's own 1080×2160 frame, and its game card sits where `addMiniGameCard` puts it. Its numbers carry over unscaled.
- Each art step names the sketch lines it follows. Re-express them in the game's patterns; do not paste the sketch. Where the spec gives copy, the spec wins.

**OSS research** (CLAUDE.md rule; done for the spec, notes in scratchpad `dot-5-oss.md`): westures `Swivel` counts a finger's angle round a centre with a dead zone (spec §6). Scrub counts turns the same way, with our own code.

**Baseline:**
- 1239 tests in 104 files pass on `dot-5-dich-vu` at 4767f71 (master 86a6a92 plus the spec).
- Typecheck: `npx tsc --noEmit`.
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.

## Global Constraints

- **The bans (spec §5):**
  - A shop that has not learned scrub plays exactly as before. Every old test still passes, `same-draws.test.ts` and its fixture are untouched, and nothing new is drawn from any rng. Paying the tuition alone changes no draw.
  - Scrub never changes `serviceArrivalFactor`.
  - The "Đủ món" badge goal is 6 and any six services count. The rank's service part is full at 6 and its card never reads more than "6/6 món".
  - Tuition is never paid twice: a retry or a reload costs nothing.
  - Old saves open with nothing lost.
  - The game is playable with a thumb on an iPhone. Text never overflows or overlaps at 390 px.
- **Numbers** (spec §7.1, verbatim):
  - scrub opens to learn at 3★ with massage open;
  - tuition 700.000 đ, price 170.000 đ;
  - Muối biển costs 400.000 đ for 20, and the shop has 20 when the lesson is passed;
  - Giường chà muối costs 600.000 đ, one is given to the gift box;
  - staff tiers and courses as for the old services (100.000 / 200.000 / 400.000 đ);
  - student and tourist add scrub to `prefers`; picky likes every service.
- **The game** (spec §8.1, verbatim):
  - 4 salt patches (hard: 5), 3 turns each;
  - a speed cap only, lower in the hard version;
  - over the cap: "Rát quá!", and the turn under way is not counted;
  - counting resumes under 80% of the cap;
  - turns count by angle round the patch, either way round, paused in the dead zone and past the far limit;
  - 3★ all patches clean with at most 1 cry; 2★ at least 3 clean; else 1★;
  - 20 seconds.
- **Save version: the next free number on master, v26 today.**
  - `SAVE_VERSION` in `src/sim/save.ts` is the only place the number lives in `src`. `parseVersioned` accepts 25 as one more entry.
  - The migration is the `lessonsPaid` repair line in `parseShop`. The other new keys are filled by the per-key repairs that already exist (stock, tiers, counts).
  - Tests compare a written version with `SAVE_VERSION`, never a literal.
  - The celebrity-guests branch (`ngoi-sao`) may take v26 first. Renumbering at merge is then: `SAVE_VERSION` to 27, accept 26 as well, rename the `describe` titles, and add their v26 fixture to the "opens every older save" lists.
- **Copy, verbatim** (spec §7.2, §8, §8.1):
  - "Học nghề", "Học tiếp", "Học {tên món}", "Bắt đầu";
  - "Đặt ngón lên vệt muối rồi xoay vòng tròn.", "Xoay vừa tay thôi, nhanh quá khách kêu rát.";
  - "Học xong!", "Tiệm đã có {tên món}. Quà: một {tên đồ} trong hộp quà.", "Xong";
  - "Chưa đạt", "Thử lại không mất tiền.", "Thử lại", "Để sau";
  - "Món mới để học: {tên món}.", "Đạt 3★";
  - "Xoay vòng tròn trên vệt muối", "Rát quá!";
  - names "Chà muối biển", "Giường chà muối", "Muối biển".
- **Layers:**
  - `src/sim/**` has no Phaser and no strings.
  - Numbers go in `src/config.ts`, strings in `src/strings/vi.ts`, art in `src/art/*`.
  - Every new hex is a value of `C` (`src/art/palette.ts`).
- **Sounds:** none new.

## Plan Calls (mine, at planning)

- **Tuition is `SERVICES.scrub.openCost`** (`SERVICE_OPEN_COST.scrub = 700_000`). `serviceProblem` returns a new `'lesson'` for a lesson service that is not learned, so `openService` can never open scrub for money.
- **Salt is in every shop's stock from the start,** at `STOCK_START` (20). The stock tab hides it until scrub is learned, so the shop has 20 when the lesson is passed and no code runs at that moment. An old save gets 20 from the existing stock repair.
- **The gift box** is `book.gifts`, as for the mask bed. `passLesson` pushes `'scrubBed'` at the main shop only. A branch buys its own bed (spec §7.1).
- **"Món mở ở mọi tiệm từ lúc này"** (§7.2): the services panel's `onChange` also calls `chain.sync()`. A save written right after the pass then already has scrub at every branch.
- **"Mở massage trước"** reuses the recipe rows' `serviceOrder`, which reads "Mở Massage trước", with a capital M. The two faded rows then say the same thing.
- **The teacher** is a new dress in `src/art/outfits.ts`, not a wardrobe outfit: the sketch's purple áo dài (`#8E6BB0`, cream trim) and the existing nón lá. `OUTFIT_IDS` is unchanged.
- **The lesson game:**
  - the customer is the teacher (`TEACHER_LOOK`, kind `'office'`), with `hard: false` and `extraMs: 0`;
  - the demo hand shows while `demoScrub` is not done;
  - the hint is marked when a lesson game ends, pass or fail, so a retry and every real customer play without the hand.
- **Opening the panel** (§7.2): the stock intro wins first, then a service to learn (services tab, its page), then low stock.
- **The rank-up line** is its own text under the sub, in `C.tealDark` weight 800. Sub and line shrink together to the box's 170 px when taller.
- **Scrub runs without power** (`MACHINES` unchanged). It is never a festival service, because it sits after `mud` in `SERVICE_IDS`.
- **A daily "Làm {n} lượt" quest may name scrub** once it has a bed, by the existing draw over available services. Spec §4 rules out new quests, not this.
- **The scrub customer lies face down,** as on the massage and stone beds.
- **Scene order:** `LessonScene` and `ScrubScene` go right after `RecipeScene` in `main.ts`. Phaser draws scenes in list order, and the game must draw over the lesson, which draws over the panel. A real customer's game above the pause and summary scenes is safe: its full-screen dim takes every tap, so nothing opens over it.
- **The rules work in game pixels from the back's centre,** (540, 1090) on the card, which is where `MassageScene` puts the back. The scene subtracts that centre from the pointer.

## Review Focus

1. **A shop that has not learned scrub draws exactly as before.** This holds for a busy 3★ chain with every old service open, a bed of each, staff, candidates, quests, festivals and events, at the main shop and at the beach, and also once the tuition is paid but the lesson is not passed. Covered by T1 (frozen log) and T3 (paid variant).
2. **Scrub reaches customers only through learning.** Before the pass no customer, main or branch, asks for scrub. After it, the beach's tourists ask once the beach has its own bed, and the arrival factor is unchanged. Covered by T3.
3. **A thumb turning right at the cap** (swinging between 2.2 and 2.8 turns a second) hears "Rát quá!" once, not on every swing, and the counting waits. Covered by T4.
4. **A reload in the middle of a lesson** (after paying, during the game or on the "Chưa đạt" card) shows "Học tiếp", charges nothing, and the panel's dot is gone. Covered by T3 (sim) and T7 (`lessonAction`); seen in the browser pass.
5. **The panels and cards at 390 px:**
   - the seventh row on page 2, with arrows beside "Xong";
   - "Học nghề / 700.000 đ" on two lines inside the 310 button;
   - the teacher card's two lines;
   - the rank-up box with its new line.
   Covered by T7 (`panelPage`); seen in the browser pass.

---

### Task 1: Pin today's draws, and put Chà muối biển in the data

**Files:**
- Create: `tests/fixtures/draws-six-services.json`, `tests/fixtures/save-v25.json`
- Modify:
  - `src/config.ts`;
  - `src/sim/services.ts`, `src/sim/items.ts`, `src/sim/stock.ts`, `src/sim/customers.ts`, `src/sim/economy.ts`, `src/sim/staff.ts`, `src/sim/badges.ts`, `src/sim/rank.ts`, `src/sim/types.ts` (`HINT_IDS`);
  - `src/strings/vi.ts`;
  - `src/art/palette.ts`, `src/art/fx.ts`, `src/art/furniture.ts`;
  - `src/scenes/ServicesScene.ts` (the stock filter only);
  - `src/scenes/SpaScene.ts` (the `MINI_GAME_SCENE` and `DEMO_HINT` entries only).
- Test:
  - `tests/sim/helpers.ts`, `tests/sim/same-draws.test.ts`;
  - `tests/sim/services.test.ts`, `items.test.ts`, `stock.test.ts`, `customers.test.ts`, `economy.test.ts`, `staff.test.ts`, `badges.test.ts`, `rank.test.ts`;
  - `tests/view/catalog.test.ts`, `tests/view/rank.test.ts`, `tests/art/fx.test.ts`;
  - `tests/sim/save.test.ts` (the v22–v24 equality tests).

**Interfaces:**
- Produces, in `src/sim/services.ts`:
  - `export type LessonService = 'scrub'`;
  - `ServiceId = BasicService | RecipeService | LessonService`;
  - `export const LESSON_SERVICES: readonly LessonService[] = ['scrub']`;
  - `export const isLessonService = (id: ServiceId): id is LessonService`;
  - `SERVICE_IDS = [...BASIC_SERVICES, ...RECIPE_SERVICES, ...LESSON_SERVICES]`;
  - `SERVICES.scrub = { price: SERVICE_PRICE.scrub, openCost: SERVICE_OPEN_COST.scrub, bed: 'scrubBed', name: 'serviceScrub', busy: 'busyScrub' }`.
- Elsewhere in the sim:
  - `ItemKind` gains `'scrubBed'`: `ITEMS.scrubBed = { w: 1, h: 3, price: 600_000, beauty: 0, group: 'bed', name: 'itemScrubBed' }`, listed right after `mudTub`.
  - `StockItem` gains `'salt'`, last in `STOCK_ITEMS`. `STOCK_USES.scrub = ['salt', 'towel']`, `STOCK_NAME.salt = 'stockSalt'`, and `fullStock()` has `salt: STOCK_START`.
  - `export const stockItemsFor = (open: readonly ServiceId[]): StockItem[]`: the items some open service uses, in `STOCK_ITEMS` order (today's stock-tab filter, moved).
  - `HINT_IDS` gains `'demoScrub'` after `'demoMud'`.
- In `src/config.ts`:
  - `SERVICE_PRICE.scrub = 170000`, `SERVICE_OPEN_COST.scrub = 700000` (the tuition), `RESTOCK_PRICE.salt = 400000`;
  - `export const LESSON_STARS = { scrub: 3 } as const`;
  - `BADGE_GOALS.allServices = 6`.
- Strings:
  - `serviceScrub: 'Chà muối biển'`;
  - `itemScrubBed: 'Giường chà muối'`;
  - `stockSalt: 'Muối biển'`;
  - `busyScrub: 'Giường chà muối đang bận'`.
- Textures: `'svc-scrub'` and `'stock-salt'` (fx), and `'scrubBed'` (furniture).
- Test helpers in `tests/sim/helpers.ts`:
  - `placeFirst(sim: SpaSim, kind: ItemKind): void` buys `kind` at the first tile `canPlace` accepts, scanning rows top to bottom and columns left to right with `flip` false. It throws when none fits.
  - `sixServiceLog(days = 4, before?: (chain: Chain) => void): { days: { day: number; main: string[]; beach: string[]; candidates: string[]; quests: string[] }[]; next: number }`.

- [ ] **Step 1: Freeze both fixtures before anything changes.** With today's code, add the two helpers, then write both fixtures from a throwaway vitest file and delete it.
  - **`sixServiceLog`:**
    - **Setup:**
      - `const rng = createRng(2025)` and `new SpaSim({ rng })`;
      - day 40, `rank.stars = 3`, `profileDone`, money 50_000_000;
      - `services` = the six old ones;
      - `placeFirst` for `maskBed`, `massageBed`, `steamTent`, `stoneBed`, `mudTub`, in that order;
      - three `hireStaff(main, 'technician')`;
      - `new Chain(main, 11)`, `open('beach')`, and one `hireStaff` technician at the beach;
      - then `before?.(chain)`.
    - **Each day:**
      - `chain.advance(100)` until `main.dayOver`, draining the main shop's events and throwing past 400_000 ms;
      - log every customer new to `main.customers` and to the beach's as `` `${id}:${kind}:${service}:${regular ?? ''}:${vip ?? ''}:${kol}` ``;
      - then `chain.finishDay()` and `chain.startDay()`;
      - log the main shop's candidates as `` `${name}:${role}:${specialty}` ``, where `specialty` joins `` `${id}${n}` `` for every tier above 0;
      - log its daily quests as `` `${kind}:${service}:${target}` ``.
    - **`next`** is `rng()` after the last day.
  - **`tests/fixtures/draws-six-services.json`** is `sixServiceLog(4)`.
  - **`tests/fixtures/save-v25.json`:**
    - `starShop(3, 20_000_000, 3)`, with `placeFirst` for `maskBed` and `massageBed`;
    - a technician hired with tiers `{ massage: 2 }`;
    - a `Chain(main, 8)` with the beach open and one technician hired there;
    - `chain.startDay()`, so both shops have candidates;
    - then the main technician booked on a `'mask'` course;
    - one office customer spawned for massage at the main shop;
    - `savedAt` set to `1_800_000_000_000` on the written JSON.
  - Neither file is edited afterwards.
- [ ] **Step 2: Write the failing tests.**
  - **`same-draws.test.ts`:** "draws the same in a 3-star chain with every old service open while Chà muối biển is not learned": `expect(sixServiceLog(4)).toEqual(sixFixture)`. It passes now and must keep passing.
  - **`services.test.ts`:**
    - `SERVICE_IDS` is the six old ids then `'scrub'`;
    - `SERVICES.scrub` equals the Interfaces value with 170_000 and 700_000;
    - `serviceOfBed('scrubBed')` is `'scrub'`;
    - `isLessonService('scrub')` is true and `isLessonService('mud')` false;
    - `LESSON_STARS.scrub` is 3.
  - **`items.test.ts`:** `ITEMS.scrubBed` as above, and its index in `ITEM_KINDS` is `mudTub`'s + 1.
  - **`stock.test.ts`:**
    - `STOCK_ITEMS` ends with `'salt'`;
    - `STOCK_USES.scrub` is `['salt', 'towel']`;
    - `fullStock().salt` is 20 and `RESTOCK_PRICE.salt` is 400_000;
    - `stockItemsFor(six)` is the six old items;
    - `stockItemsFor([...six, 'scrub'])` is all seven.
  - **`customers.test.ts`:**
    - `KINDS.student.prefers` is `['shampoo', 'scrub']`;
    - `KINDS.tourist.prefers` is `['mud', 'stone', 'massage', 'scrub']`;
    - `KINDS.picky.prefers` equals `SERVICE_IDS`.
  - **`economy.test.ts`:**
    - `serviceArrivalFactor([...six, 'scrub'])` is close to 0.65;
    - `serviceArrivalFactor(['shampoo', 'mask', 'massage', 'scrub'])` is 0.8.
  - **`staff.test.ts`:**
    - `candidatePool(six)` is the six old ids in today's order;
    - `candidatePool(['shampoo', 'scrub'])` is `['shampoo', 'mask', 'massage', 'scrub']`;
    - `noTiers().scrub` is 0;
    - `courses(tech, [...six, 'scrub'])` ends with `'scrub'`, and `tuition(tech, 'scrub')` is 100_000 for a tier-0 technician hired with trait `'calm'` (`hireStaff`'s default, `'studious'`, pays less).
  - **`badges.test.ts`:**
    - `BADGES.allServices.goal` is 6;
    - `badgeProgress('allServices', { ...zeroShop(), services: 7 })` is `[6, 6]`.
  - **`rank.test.ts`:**
    - `monthInput(book, 15, 4, 30, 7, { served: 145, lost: 10 }).services` is 6;
    - `rankParts` of it has 20 at index 2.
  - **`tests/view/rank.test.ts`:** `partRows` of that input reads `'6/6 món'`.
  - **`catalog.test.ts`:**
    - across all pages of `catalogPage('bed', …, [...six, 'scrub'], [])` the kinds include `'scrubBed'`;
    - with `six` they do not.
  - **`fx.test.ts`:** `svc-${id}` exists for every id in `SERVICE_IDS`. Today's loops already cover `stock-salt` and every item's texture.
- [ ] **Step 3: Run them to see them fail.** Run: `npx vitest run tests/sim tests/view tests/art`. Expected: the new assertions fail, and the frozen-draws test passes.
- [ ] **Step 4: Implement.**
  - Add the ids, items, stock, config and strings in the Interfaces.
  - `serviceArrivalFactor` works on `available.filter(id => !isLessonService(id))`.
  - `candidatePool` appends `LESSON_SERVICES.filter(id => open.includes(id))` after the recipe services.
  - `BADGES.allServices.goal = BADGE_GOALS.allServices`, and `badges.ts` drops its `SERVICE_IDS` import.
  - `monthInput` stores `Math.min(services, RANK_SERVICES_FULL)`.
  - `ServicesScene`'s stock filter becomes `stockItemsFor(sim.services)`.
  - In `SpaScene`, `MINI_GAME_SCENE.scrub = 'ScrubScene'` (registered in Task 5) and `DEMO_HINT.scrub = 'demoScrub'`.
  - **Art**, with the colours going in `C` (`seaPale: '#CFE8F0'`, `scrubSheet: '#DCEFF4'`):
    - `'svc-scrub'`: a wooden bowl heaped with sea salt, a wave on its side (sketch line 584);
    - `'stock-salt'`: a glass jar of salt with a cobalt lid (line 596);
    - `FURNITURE.scrubBed = { w: 1.1, h: 3.15, body }`: a massage-style bed in sea colours, with a face cradle and a bowl of salt at its foot (lines 268–279).
- [ ] **Step 5: Update the tests that pin today's lists.**
  - The `SERVICE_IDS` list (`services.test.ts:66`), picky's `prefers` (`customers.test.ts:51`) and `STOCK_ITEMS` (`stock.test.ts:22`) gain the new entry.
  - In `save.test.ts`, add `withNewKeys(raw)`. For the main shop and each `chain.branches[]` it adds:
    - `stock.salt: 20`;
    - `scrub: 0` to every staff member's and candidate's `tiers`;
    - `scrub: 0` to `progress.total.services`, and to `progress.dayStart.services` when `dayStart` is an object.
  - The v22, v23 and v24 equality tests compare against `withNewKeys(...)` of their expected value. Add to it only keys of a `ServiceId` or `StockItem` record.
- [ ] **Step 6: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean, all green, both same-draws tests passing.
- [ ] **Step 7: Commit.** Stage the files by name. Message: `Add Chà muối biển to the services, stock, beds and staff tiers without letting it bring more customers, keeping the badge and the rank at six services`.

### Task 2: Save version 26

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/spa.ts` (field, `toSave`, `fromSave`)
- Test: `tests/sim/save.test.ts`, `tests/save/code.test.ts`

**Interfaces:**
- Consumes: `LessonService`, `LESSON_SERVICES`, the v25 fixture and `withNewKeys` (Task 1).
- Produces:
  - `SpaSim.lessonsPaid: LessonService[] = []`, documented as "the lesson services whose tuition is paid and whose lesson is not passed yet";
  - `SaveData.lessonsPaid: LessonService[]`;
  - `SAVE_VERSION = 26`.

- [ ] **Step 1: Write the failing tests** in `describe('save version 26')`, with `withNewKeys` now also adding `lessonsPaid: []` to every shop:
  - **The v25 fixture:**
    - `parseSave(structuredClone(v25))` equals `withNewKeys(v25)`.
    - `Chain.fromSave(parseSave(v25), 8)` has `at` null, a beach branch with one technician, and the main technician's massage tier 2, `'mask'` course and money.
    - It saves as `SAVE_VERSION`.
  - **Every older save:** every fixture v1–v25 opens with `Chain.fromSave` and saves as `SAVE_VERSION`.
  - **Versions:** 25 and `SAVE_VERSION` open, and `SAVE_VERSION + 1` throws `SaveTooNewError`.
  - **`lessonsPaid` repair:**
    - `['scrub']` is kept;
    - `['scrub', 'scrub']` reads `['scrub']`;
    - `['moon', 3]` and `'scrub'` read `[]`;
    - `['scrub']` with `'scrub'` already in `services` reads `[]`.
  - **Round trip:** `sim.lessonsPaid = ['scrub']` survives `toSave` → JSON → `parseSave` → `fromSave`.
  - **Old version literals:**
    - every existing assertion that a written save's version is 25 (`save.test.ts` and `code.test.ts:43`) asserts `SAVE_VERSION`;
    - "opens 25 and refuses 26" becomes the versions test above;
    - "still leaves alone only saves newer than version 25" (`save.test.ts:252`) also reads `v: SAVE_VERSION` back as `SAVE_VERSION`, and throws at `SAVE_VERSION + 1`;
    - titles say "the current version".
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/sim/save.test.ts tests/save`.
- [ ] **Step 3: Implement.**
  - `SAVE_VERSION = 26`, and `parseVersioned` also accepts 25.
  - `parseShop` adds `data.lessonsPaid = repairLessons(data.lessonsPaid, data.services)` beside the services repair: `LESSON_SERVICES` that are in the list and not in `services`.
  - `toSave` writes `lessonsPaid`, and `fromSave` reads it.
- [ ] **Step 4: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean, all green.
- [ ] **Step 5: Commit.** Message: `Save in version 26 with the lessons paid for and not yet passed`.

### Task 3: Learning a service in the sim

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/services.ts` (`ServiceProblem`)
- Test: `tests/sim/lessons.test.ts` (new), `tests/sim/same-draws.test.ts`

**Interfaces:**
- Consumes: `LESSON_STARS`, `SERVICES.scrub.openCost`, `lessonsPaid` (Tasks 1–2).
- Produces, in `src/sim/spa.ts`:
  - `export type LessonState = 'no' | 'paid' | 'yes'`;
  - `export type LessonProblem = 'main' | 'stars' | 'order' | 'debt' | 'money'`;
  - `SpaSim.lessonState(id: LessonService): LessonState`: `'yes'` when `services` holds it, `'paid'` when `lessonsPaid` does, else `'no'`.
  - `SpaSim.lessonProblem(id: LessonService): LessonProblem | null`, checked in this order:
    - `'main'` at a branch;
    - `'stars'` below `LESSON_STARS[id]`;
    - `'order'` without massage;
    - null when paid or learned;
    - `'debt'` when money < 0;
    - `'money'` when short of the tuition.
  - `SpaSim.payLesson(id: LessonService): LessonProblem | null`. In state `'no'` with no problem, it takes the tuition once and adds `id` to `lessonsPaid`. In `'paid'` and `'yes'` it charges nothing and returns null. It never touches `stats`.
  - `SpaSim.passLesson(id: LessonService): void`. It throws unless the state is `'paid'`. Otherwise:
    - `services = SERVICE_IDS.filter(x => x === id || services.includes(x))`;
    - it removes `id` from `lessonsPaid`;
    - it pushes `SERVICES[id].bed` onto `book.gifts`.
  - `SpaSim.learnable(): LessonService | null`: the first lesson service in state `'no'` whose problem is null, `'debt'` or `'money'`. Money never hides it.
  - `ServiceProblem` gains `'lesson'`. `serviceProblem(id)` returns it for a lesson service not in `services`, right after the "already open" check.

- [ ] **Step 1: Write the failing tests** in `tests/sim/lessons.test.ts`. Unless stated, the shop is `starShop(3)` (mask and massage open, 20_000_000 đ).
  - **Who can learn:**
    - `starShop(2)` → `'stars'`;
    - `starShop(3)` with `services = ['shampoo', 'mask']` → `'order'`;
    - `starShop(3)` → null;
    - money 699_999 → `'money'`;
    - money −1 → `'debt'`;
    - the beach branch of a `Chain` → `'main'`.
  - **Paying once:**
    - `payLesson('scrub')` takes exactly 700_000, and the state is `'paid'`;
    - `stats` deep-equals its value before, so `dayProfit(stats)` is unchanged;
    - a second `payLesson` returns null and takes nothing;
    - with `'money'` it returns `'money'`, takes nothing, and the state stays `'no'`.
  - **Passing:**
    - after pay and `passLesson`, the state is `'yes'`, `services` ends with `'scrub'` and `lessonsPaid` is empty;
    - `book.gifts` has one `'scrubBed'`;
    - `stock.salt` is 20;
    - a later `payLesson` takes nothing;
    - `passLesson` in state `'no'` throws.
  - **Retry and reload (Review Focus 4):**
    - pay, then no pass: the state is `'paid'`;
    - after `Chain.fromSave(parseSave(JSON.parse(JSON.stringify(chain.toSave()))), 8)` the state is still `'paid'` and the money is the same;
    - `payLesson` takes nothing, and `passLesson` works.
  - **`learnable`:**
    - `starShop(3)` → `'scrub'`, also with money 0;
    - after paying → null;
    - `starShop(2)`, a 3★ shop without massage, and a branch → null.
  - **The old open path:** `serviceProblem('scrub')` is `'lesson'` before the pass and null after. `openService('scrub')` returns `'lesson'` and takes nothing.
  - **Review Focus 2 (customers and branches),** on a `Chain` with the beach open:
    - Before the pass:
      - 300 `drawService('tourist', beach.availableServices(), rng)` never give `'scrub'`;
      - `beach.lessonProblem('scrub')` is `'main'`.
    - After `payLesson`, `passLesson` and `chain.sync()`:
      - the beach's `services` includes `'scrub'` and its state is `'yes'`;
      - `beach.book.gifts` has no `'scrubBed'`;
      - `catalogPage` at the beach offers `'scrubBed'`;
      - after `chain.startDay()` the beach still has scrub.
    - After `placeFirst(beach, 'scrubBed')`:
      - 300 tourist draws include `'scrub'`;
      - `serviceArrivalFactor(beach.availableServices())` equals its value before the bed.
  - **Served by staff:** at the main shop with scrub learned and `placeFirst(main, 'scrubBed')`, one technician (tiers `{}`) serves `spawnCustomer({ kind: 'student', service: 'scrub' })`:
    - the `'paid'` event's amount is `rankPrice(170_000, 3)`;
    - `stock.salt` and `stock.towel` each drop by 1.
  - **`same-draws.test.ts` (Review Focus 1):** `sixServiceLog(4, c => { expect(c.main.payLesson('scrub')).toBeNull() })` equals the fixture.
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/sim/lessons.test.ts tests/sim/same-draws.test.ts`.
- [ ] **Step 3: Implement** the Interfaces in `src/sim/spa.ts` and `src/sim/services.ts`.
- [ ] **Step 4: Run the whole suite.** Run: `npx tsc --noEmit && npx vitest run`. Expected: clean, all green.
- [ ] **Step 5: Commit.** Message: `Learn a new service at its stars with massage open, paying the tuition once and opening it at every shop with its bed in the gift box when the lesson is passed`.

### Task 4: The Chà muối biển rules

**Files:**
- Create: `src/sim/scrub.ts`, `tests/sim/scrub.test.ts`
- Modify: `src/config.ts`

**Interfaces:**
- Produces, in `src/config.ts`. These are the sketch's `SCRUB` (line 1016), in game pixels from the back's centre:
  - `SCRUB_LIMIT_MS = 20000`;
  - `SCRUB_SPOTS = [{ x: -150, y: -200 }, { x: 150, y: -120 }, { x: -140, y: 60 }, { x: 140, y: 190 }]`;
  - `SCRUB_SPOTS_HARD = [{ x: -150, y: -210 }, { x: 150, y: -170 }, { x: 0, y: -20 }, { x: -150, y: 160 }, { x: 150, y: 190 }]`;
  - `SCRUB_TURNS = 3`;
  - `SCRUB_DEAD_R = 40`, `SCRUB_FAR_R = 260`;
  - `SCRUB_CAP = 2.5`, `SCRUB_CAP_HARD = 1.8` (turns a second);
  - `SCRUB_TAU_S = 0.25`, `SCRUB_REARM = 0.8`;
  - `SCRUB_STARS = { burns: 1, clean2: 3 }`;
  - for drawing only: `SCRUB_PATCH_R = 92`, `SCRUB_RING_R = 150`.
- Produces, in `src/sim/scrub.ts`:
  - `export interface ScrubSpot { x: number; y: number }`.
  - `export const scrubStars = (cleaned: number, spots: number, burns: number): Stars`: 3 when every patch is clean and `burns <= SCRUB_STARS.burns`; 2 when `cleaned >= SCRUB_STARS.clean2`; else 1.
  - `export class ScrubGame`, built by `constructor(hard = false)`. No rng.
    - **Public fields:** `phase: 'play' | 'done'`, `elapsedMs`, `readonly spots: readonly ScrubSpot[]` and `readonly cap`.
    - **Counters**, which the scene diffs:
      - `index`: the patch being scrubbed;
      - `steps`: turns counted on it;
      - `turns`: counted over the game;
      - `cleaned`, `burns`;
      - `acc`: signed radians toward the next turn;
      - `speed`: smoothed, in turns a second;
      - `armed`.
    - **Methods:**
      - `spot(): ScrubSpot | null`: null once all are clean;
      - `down(x, y)`, `move(x, y)`, `up()`, with positions relative to the back's centre;
      - `tick(ms: number)`;
      - `progress(): number`: `(cleaned * SCRUB_TURNS + steps + min(1, |acc| / 2π)) / (spots.length * SCRUB_TURNS)`;
      - `stars(): Stars | null`: null until done.

- [ ] **Step 1: Write the failing tests.**
  - **The test helpers:**
    - `spin(g, tps, ms, r = 110, dir = 1, until?: () => boolean)` moves the finger round `g.spot()` at `tps` turns a second, `r` px out, in 16 ms frames. Each frame is one `move`, then `tick(16)`. It calls `down` first, keeps its angle across calls, and stops after `ms`, when the game is done, or when `until()` holds after a frame. "Spin 1.5 until X" below means `spin(g, 1.5, 20_000, 110, 1, () => X)`.
    - `wait(g, ms)` ticks without moving.
  - **Setup:** a new game has 4 spots and cap 2.5; the hard one has 5 and 1.8. `progress()` is 0.
  - **3★:**
    - `spin(g, 1.5, 20_000)` ends before 9_000 ms with cleaned 4, burns 0, `stars()` 3 and `progress()` 1;
    - steady 0.7 and steady 2.4 turns a second also give 3★ (spec §8.1's 0,65–2,4 band);
    - `dir = -1` gives the same as `dir = 1`.
  - **2★:**
    - spin 1.5 until `cleaned === 3`, then `wait` to the end: 2★;
    - spin 3.2 for 600 ms, then 1 for 1000 ms, then 3.2 for 600 ms, then 1.5 to the end: cleaned 4, burns 2, 2★.
  - **1★:**
    - spin 1.5 until `cleaned === 2`, then wait: 1★;
    - `spin(g, 3, 20_000)` (fast forever): burns 1, cleaned 0, 1★, done at 20_000.
  - **Hard:**
    - `spin(hard, 1.5, 20_000)`: cleaned 5, 3★;
    - `spin(hard, 2.4, 20_000)`: burns 1, 1★;
    - 3 of 5 clean is 2★.
  - **"Rát quá!" and re-arming:**
    - spin 3 for 700 ms: burns 1 and `armed` false;
    - then 2.2 for 3000 ms: burns still 1, `turns` unchanged, `armed` false;
    - then 1.5 for 500 ms: `armed` true;
    - then 1.5 for 1500 ms: `turns` has grown.
  - **The turn under way is dropped:** spin 1.5 until `steps === 1` and `|acc| >= π`. Then spin 8 frame by frame until `burns === 1`: `steps` is still 1 and `acc` is 0.
  - **Review Focus 3:** alternate 2.2 and 2.8 turns a second every 300 ms for 6000 ms. Burns is exactly 1.
  - **The dead zone and the far limit:** spinning 1 turn a second for 3000 ms at r 30 or at r 280 counts 0 turns and never burns; at r 50 and at r 250 it counts at least 2.
  - **Lifting:**
    - `down` at angle 0, `move` to π/2, `up`;
    - `down` at π (no count), `move` to 3π/2;
    - `acc` is close to π.
  - **Time:**
    - `wait(g, 20_000)`: done, `elapsedMs` 20_000, 1★;
    - a `tick` or `move` after done changes nothing.
  - **`scrubStars`:** `(4, 4, 1)` → 3, `(4, 4, 2)` → 2, `(3, 5, 0)` → 2, `(2, 4, 0)` → 1.
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/sim/scrub.test.ts`. Expected: FAIL, no module.
- [ ] **Step 3: Implement `ScrubGame`.** The algorithm, after the sketch's `MAKE.scrub` (lines 1069–1157):
  - **`move(x, y)`:**
    - Does nothing when done.
    - The finger is at distance `r` from the current spot. With `r < SCRUB_DEAD_R` or `r > SCRUB_FAR_R`, set `lastA = null` and stop.
    - `a = atan2`. With a `lastA`, take `d = a - lastA` wrapped into (−π, π] and add it to `moved`.
    - When `armed`, also add it to `acc`. When `|acc| >= 2π`:
      - `acc = 0`, then `steps++` and `turns++`;
      - at `SCRUB_TURNS`: `cleaned++`, `index++`, `steps = 0`, `lastA = null`, and done when no spot is left; return.
    - Set `lastA = a`.
  - **`down`** sets `lastA = null`, then calls `move`. **`up`** sets `lastA = null`.
  - **`tick(ms)`:**
    - Does nothing when done or when `ms <= 0`.
    - `elapsedMs = min(SCRUB_LIMIT_MS, elapsedMs + ms)`.
    - `speed += (|moved| / dt / 2π − speed) · (1 − e^(−dt / SCRUB_TAU_S))`, with `dt` in seconds; then `moved = 0`.
    - When `armed && speed > cap`: `armed = false`, `burns++`, `acc = 0`.
    - Else when `!armed && speed < cap * SCRUB_REARM`: `armed = true`.
    - Done at the limit.
- [ ] **Step 4: Run the tests.** Run: `npx vitest run tests/sim/scrub.test.ts`. Expected: PASS. If an edge case misses only by a frame, fix the test's frame arithmetic, never the spec's numbers.
- [ ] **Step 5: Commit.** Message: `Add the Chà muối biển rules: turns counted by angle round each salt patch, a speed cap that cries Rát quá! until the hand slows, and stars after 20 seconds`.

### Task 5: The scrub game on screen

**Files:**
- Create: `src/scenes/ScrubScene.ts`, `src/art/scrubArt.ts`, `tests/art/scrubArt.test.ts`
- Modify:
  - `src/art/palette.ts`;
  - `src/scenes/BootScene.ts`;
  - `src/main.ts` (scene list: `ScrubScene` after `RecipeScene`);
  - `src/scenes/SpaScene.ts` (facing on the scrub bed);
  - `src/strings/vi.ts`.

**Interfaces:**
- Consumes: `ScrubGame`, `SCRUB_*` (Task 4); `MiniGameData`, `addMiniGameCard`, `drawBars`, `revealStars`; the massage textures `ms-bed`, `ms-back`, `ms-back-line`, `ms-hair`, `ms-hair-line` with `MS_ORIGIN`; the `'hand'` texture.
- Produces:
  - `scrubTextures(): Record<string, string>` with `'scrub-salt'`: the salt smear of radius `SCRUB_PATCH_R` with its eight grains (sketch lines 1040–1057). New colours go in `C`: `saltWhite: '#FDFCF8'`, `saltGrey: '#E4EEF0'`, `burnPale: '#FBE3DC'`.
  - Scene key `'ScrubScene'`, opened with `MiniGameData`.
  - Strings: `scrubTurn: 'Xoay vòng tròn trên vệt muối'`, `scrubBurn: 'Rát quá!'`.

- [ ] **Step 1: Write the failing test** `tests/art/scrubArt.test.ts`:
  - `'scrub-salt'` is an `<svg` document whose viewBox holds the patch and its grains;
  - every hex in it is a value of `C`, checked the way `beach.test.ts` does.
- [ ] **Step 2: Run it to see it fail.** Run: `npx vitest run tests/art/scrubArt.test.ts`.
- [ ] **Step 3: Implement the art and the scene.**
  - Register `scrubTextures()` in `BootScene` beside `massageTextures()`.
  - **The card:** `addMiniGameCard(this, t('scrubTurn'))`. The back is drawn as `MassageScene` draws it at `BACK = { x: 540, y: 1090 }`, tinted by `customerColors(look, kind)`. The rules get `new ScrubGame(params.hard)`; the scrub takes no day-ease time.
  - **The patch** at `BACK + spot()`:
    - `'scrub-salt'` at alpha `[1, 0.62, 0.3][steps]`;
    - a dashed ring of `SCRUB_RING_R` in `C.tealDark` at alpha 0.45;
    - the turn under way as an arc from the top, `|acc|/2π` of the ring, teal over ink;
    - a cream ring that grows from `SCRUB_PATCH_R` and fades over 350 ms each time `turns` grows (sketch lines 1133–1146).
  - **The meter** above the patch, centred at `(x, y − 178)` (sketch lines 1058–1068):
    - a 152 × 86 cream box, filled `C.burnPale` for 700 ms after a cry and while `!armed`;
    - a teal arc up to `cap`, a lantern arc from `cap` to `1.6 × cap`;
    - an ink needle at `speed`.
  - **"Rát quá!"** floats up from `(x, y + 70)` in `C.lantern` each time `burns` grows, sized and timed as `MassageScene`'s `WORD` (60 px, a cream stroke of 12, rising 80 px over 600 ms).
  - **Input:**
    - `pointerdown` → `down(p.x − BACK.x, p.y − BACK.y)`;
    - `pointermove` while `p.isDown` → `move(…)`;
    - `pointerup`, `pointerupoutside` and `gameout` → `up()`.
  - **`update(_, delta)`:** `tick(delta)`, then `drawBars(bars, progress(), 1 − elapsedMs / SCRUB_LIMIT_MS)`.
  - **The end:** once `phase === 'done'`, `revealStars(this, stars, () => { onDone(stars); this.scene.stop() })`.
  - **The demo hand** (when `params.demo`): the `'hand'` image at alpha 0.6, its fingertip circling the current patch at radius 110 and 1.2 turns a second, until the first `pointerdown` (sketch lines 1147–1152).
  - **In `SpaScene`'s customer placement,** a customer lying for scrub faces `'up'` (face down), as for massage and stone.
- [ ] **Step 4: Run the whole suite and build.** Run: `npx tsc --noEmit && npx vitest run && npx vite build --outDir .superpowers/dist-check`. Expected: clean, all green, built.
- [ ] **Step 5: Commit.** Message: `Play Chà muối biển on the customer's back, with salt patches that fade each turn, a speed meter, Rát quá! and a demo hand the first time`.

### Task 6: The teacher and the lesson scene

**Files:**
- Create: `src/scenes/LessonScene.ts`, `src/view/lesson.ts`, `tests/view/lesson.test.ts`
- Modify:
  - `src/art/outfits.ts`, `src/art/palette.ts`;
  - `src/view/CharacterView.ts` (the dress id type only);
  - `src/config.ts`, `src/strings/vi.ts`;
  - `src/main.ts` (`LessonScene` after `RecipeScene`, before `ScrubScene`).
- Test: `tests/view/lesson.test.ts`, `tests/art/outfits.test.ts`, `tests/art/palette.test.ts`

**Interfaces:**
- Consumes: `payLesson`'s state, `passLesson`, `hintDone`/`markHint` (Task 3); `'ScrubScene'` (Task 5); `itemTexture`.
- Produces:
  - **Config:** `LESSON_PASS_STARS = 2`.
  - **Art** in `src/art/outfits.ts`, which keeps its own hex constants rather than `C`:
    - the existing private `type DressedId = Exclude<OutfitId, 'baba'>` becomes `export type DressedId = Exclude<OutfitId, 'baba'> | 'teacher'`;
    - `const TEACHER = '#8E6BB0'` (the sketch's `TEACHER_CLOTH`), and `OUTFITS.teacher = aoDai({ cloth: TEACHER, trim: CREAM, hat: NON_LA_HAT })`;
    - `OUTFIT_PANTS.teacher = 0xfbf7ee`, cream as under every áo dài;
    - `OUTFIT_HAS_HAT` is typed `readonly (OutfitId | 'teacher')[]`, so the outfit tests can still ask it about `'baba'`.
    - `CharacterColors.outfit?: OutfitId | 'teacher'`, and `CharacterView` reads it as a `DressedId`.
  - **In `src/art/palette.ts`:**
    - `export const TEACHER_LOOK: Look = { skin: 1, hair: 0, hairStyle: 3, shirt: 0 }`;
    - `export function teacherColors(): CharacterColors`, which is `{ ...lookColors(TEACHER_LOOK), outfit: 'teacher' }`.
  - **In `src/view/lesson.ts`:**
    - `lessonTitle(id: LessonService): string`;
    - `lessonHowTo(id: LessonService): readonly [string, string]`;
    - `lessonPassLine(id: LessonService): string`.
  - **`export interface LessonData { sim: SpaSim; service: LessonService; onChange: () => void; onClose: () => void }`,** scene key `'LessonScene'`.
  - **Strings:**
    - `learnTitle: 'Học {name}'`;
    - `learnHowScrub1: 'Đặt ngón lên vệt muối rồi xoay vòng tròn.'`, `learnHowScrub2: 'Xoay vừa tay thôi, nhanh quá khách kêu rát.'`;
    - `learnStart: 'Bắt đầu'`;
    - `learnPassTitle: 'Học xong!'`, `learnPassLine: 'Tiệm đã có {name}. Quà: một {bed} trong hộp quà.'`;
    - `learnFailTitle: 'Chưa đạt'`, `learnFailLine: 'Thử lại không mất tiền.'`, `learnRetry: 'Thử lại'`;
    - "Để sau" is the existing `later`, and "Xong" the existing `done`.

- [ ] **Step 1: Write the failing tests.**
  - **`lesson.test.ts`:**
    - `lessonTitle('scrub')` is `'Học Chà muối biển'`;
    - `lessonHowTo('scrub')` is the two spec lines;
    - `lessonPassLine('scrub')` is `'Tiệm đã có Chà muối biển. Quà: một Giường chà muối trong hộp quà.'`.
  - **`outfits.test.ts`:**
    - `outfit-teacher-down|side|up`, `sleeve-teacher` and `outfitHat-teacher-down|side|up` are in `OUTFIT_PARTS`;
    - `OUTFIT_IDS` does not include `'teacher'`;
    - the pinned hat list ("has a hat from three sides for the nón lá…") becomes `['gam', 'lotus', 'mai', 'teacher', 'year']`.
  - **`palette.test.ts`:** `teacherColors()` equals `{ ...lookColors(TEACHER_LOOK), outfit: 'teacher' }`.
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/view/lesson.test.ts tests/art`.
- [ ] **Step 3: Implement `LessonScene`.**
  - **Underneath:** a full-screen ink dim at 0.6 that takes taps, as `ServicesScene` has.
  - **The teacher card** (sketch lines 735–751), a 900-wide card centred on the screen:
    - the title `lessonTitle` at 58 px, fitted to 800;
    - a `CharacterView(teacherColors())` facing down and standing, scaled 2.4, on a sand ellipse;
    - the two `lessonHowTo` lines at 36 px, wrapped to 640, each after a teal disc numbered 1 and 2;
    - "Bắt đầu" (520 × 130, primary).
  - **Starting:** hide this scene and launch `'ScrubScene'` (a `Record<LessonService, string>` in the scene) with:
    - `{ look: TEACHER_LOOK, kind: 'office', extraMs: 0, hard: false, demo: !sim.hintDone('demoScrub') }`;
    - `onDone(stars)`:
      - `markHint('demoScrub')`;
      - when `stars >= LESSON_PASS_STARS`, `passLesson`;
      - `onChange()`;
      - show this scene with the pass or the fail card.
  - **The pass card** (lines 759–769), on `C.goldPale`:
    - "Học xong!" in `C.mustardDark`;
    - the bed's `itemTexture(SERVICES[id].bed)` fitted into 200 px on a gold disc of radius 130;
    - `lessonPassLine` at 38 px, wrapped to 720;
    - "Xong", which closes.
  - **The fail card** (lines 770–782):
    - "Chưa đạt";
    - the teacher at 2×;
    - "Thử lại không mất tiền.";
    - "Để sau" (plain, 340 × 124), which closes;
    - "Thử lại" (primary, 380 × 124), which starts again.
  - **Every card** grows with its text and is centred on the screen.
  - **Closing:** `onClose()`, then `this.scene.stop()`.
- [ ] **Step 4: Run the whole suite and build.** Run: `npx tsc --noEmit && npx vitest run && npx vite build --outDir .superpowers/dist-check`. Expected: clean, all green, built.
- [ ] **Step 5: Commit.** Message: `Teach a new service on a teacher's card in áo dài and nón lá, play the lesson on her back, and end on Học xong! with the bed as a gift or Chưa đạt with a free retry`.

### Task 7: Dịch vụ and Kho with pages, and the Học nghề row

**Files:**
- Create: `src/view/servicesPanel.ts`, `tests/view/servicesPanel.test.ts`
- Modify:
  - `src/scenes/ServicesScene.ts`;
  - `src/scenes/SpaScene.ts` (`openServices`);
  - `src/strings/vi.ts`.

**Interfaces:**
- Consumes:
  - `lessonState`, `lessonProblem`, `payLesson`, `learnable` (Task 3);
  - `stockItemsFor` (Task 1);
  - `LessonData`, `'LessonScene'` (Task 6).
- Produces, in `src/view/servicesPanel.ts`:
  - `export type Tab = 'services' | 'stock'`, moved here from `ServicesScene`, which imports it.
  - `export const PANEL_ROWS = 6`.
  - `export function panelPage<T>(rows: readonly T[], page: number): { rows: T[]; page: number; pages: number }`: six rows a page, `page` wrapped both ways.
  - `export const rowPage = (index: number): number => Math.floor(index / PANEL_ROWS)`.
  - `export function servicesOpening(sim: SpaSim, stock: boolean, stockIntro: boolean): { tab: Tab; page: number }`:
    - `learn = sim.learnable()`;
    - the tab is `'stock'` when `stock && (stockIntro || (!learn && sim.lowStock().length > 0))`;
    - on the services tab with `learn`, the page is `rowPage(SERVICE_IDS.indexOf(learn))`, else 0.
  - `export type LessonAction = { kind: 'note'; text: string } | { kind: 'learn'; label: string; faded: boolean } | { kind: 'goOn'; label: string } | { kind: 'learned' }`.
  - `export function lessonAction(sim: SpaSim, id: LessonService): LessonAction`, in this order:
    - `'learned'` when the state is `'yes'`;
    - a note with `serviceAtMain` for `'main'`;
    - a note with `learnNeedStars` for `'stars'`;
    - a note with `serviceOrder` and massage's name for `'order'`;
    - `'goOn'` when paid;
    - else `'learn'`, labelled with the tuition, faded when there is a problem.
- `ServicesData.page: number`.
- Strings: `learnNeedStars: 'Đạt {n}★'`, `learnButton: 'Học nghề\n{money}'`, `learnGoOn: 'Học tiếp'`.

- [ ] **Step 1: Write the failing tests** in `servicesPanel.test.ts`.
  - **`panelPage`:**
    - on `SERVICE_IDS`: `pages` 2, page 0 the six old ids, page 1 `['scrub']`;
    - page 2 reads page 0, and page −1 reads page 1;
    - six rows: `pages` 1.
  - **Kho:** `panelPage(stockItemsFor([...six, 'scrub']), 1).rows` is `['salt']`, and `stockItemsFor(six)` is one page.
  - **`rowPage`:** `rowPage(5)` is 0 and `rowPage(6)` is 1.
  - **`servicesOpening`**, on `starShop(3)` with stock on:
    - `{ tab: 'services', page: 1 }`, also with `stock.shampoo = 2`;
    - after `payLesson` with low stock: `{ tab: 'stock', page: 0 }`;
    - with `stockIntro`: `'stock'`;
    - `starShop(2)` with nothing low: `{ tab: 'services', page: 0 }`.
  - **`lessonAction`:**
    - `starShop(2)` → `{ kind: 'note', text: 'Đạt 3★' }`;
    - 3★ without massage → `{ kind: 'note', text: 'Mở Massage trước' }`;
    - a branch → `{ kind: 'note', text: 'Mở ở tiệm gốc' }`;
    - `starShop(3)` → `{ kind: 'learn', label: 'Học nghề\n700.000 đ', faded: false }`;
    - money 100 and money −1 → `faded: true`;
    - after `payLesson` → `{ kind: 'goOn', label: 'Học tiếp' }`, the same after a JSON reload (Review Focus 4);
    - after `passLesson` → `{ kind: 'learned' }`.
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/view/servicesPanel.test.ts`.
- [ ] **Step 3: Implement the panel.**
  - **Pages:**
    - `ServicesScene` keeps `page`, set from `data.page`;
    - it draws `panelPage(...).rows`: `SERVICE_IDS` on the services tab, `stockItemsFor(sim.services)` on the stock tab;
    - with `pages > 1`, the page arrows sit beside "Xong" as on the staff panel: `ARROW_X = 150`, 100 × 130, `t('prevPage')` and `t('nextPage')`, plain, size 64, at `DONE_Y`;
    - changing tab sets the page to 0.
  - **A lesson-service row** draws its icon, name, price and bed lines as today. Its action column follows `lessonAction`:
    - **`'note'`:** the row's objects go to `FADED_ALPHA`, and the text is drawn in the action column as `serviceAtMain` is drawn today.
    - **`'learn'`:** an `addButton` at `ACTION_X`, `ACTION_W` × `ACTION_H`, size 32, whose label text is set to centre alignment. It is faded when `faded`.
      - A tap calls `payLesson`.
      - `'debt'` toasts `serviceDebt`.
      - `'money'` toasts `problemMoney` with the shortfall.
      - Otherwise it calls `onChange()`, then opens the lesson.
    - **`'goOn'`:** a primary button that opens the lesson.
    - **`'learned'`:** falls through to today's "Đang có" / "Chưa có {bed}".
  - **Opening the lesson,** as `openBench` does:
    - `this.scene.setVisible(false)`;
    - launch `'LessonScene'` with `{ sim, service, onChange: params.onChange, onClose: () => { this.scene.setVisible(true); this.show() } }`.
  - **In `SpaScene.openServices`:**
    - the tab and page come from `servicesOpening(sim, stock, stockIntro)`;
    - `onChange` becomes `() => { this.chain.sync(); this.session.saveNow() }`.
- [ ] **Step 4: Run the whole suite and build.** Run: `npx tsc --noEmit && npx vitest run && npx vite build --outDir .superpowers/dist-check`. Expected: clean, all green, built.
- [ ] **Step 5: Commit.** Message: `Page the Dịch vụ and Kho panels six rows at a time and add the Học nghề row, which takes the tuition once and opens the lesson`.

### Task 8: Telling the player there is a service to learn

**Files:**
- Modify:
  - `src/view/rank.ts`, `src/scenes/RankScene.ts`;
  - `src/view/Hud.ts`;
  - `src/strings/vi.ts`.
- Test: `tests/view/rank.test.ts`

**Interfaces:**
- Consumes: `LESSON_STARS`, `LESSON_SERVICES`, `learnable()`.
- Produces:
  - `learnLine(r: MonthResult): string | null` in `src/view/rank.ts`. When `r.after > r.before` and a lesson service has `LESSON_STARS[id] === r.after`, it is `t('rankLearnNew', { name })`; else null.
  - String: `rankLearnNew: 'Món mới để học: {name}.'`.

- [ ] **Step 1: Write the failing tests.** In `tests/view/rank.test.ts`, with the existing `m(...)` builder:
  - a rise 2 → 3 gives `'Món mới để học: Chà muối biển.'`;
  - a rise 3 → 4 and a rise 1 → 2 give null;
  - keeping 3★ gives null;
  - `monthOutcome` is unchanged (its tests stay as they are).
- [ ] **Step 2: Run them to see them fail.** Run: `npx vitest run tests/view/rank.test.ts`.
- [ ] **Step 3: Implement.**
  - **`RankScene`:**
    - draws `learnLine(r)` under the sub: `textStyle(32, '800', C.tealDark)`, centred, wrapped to 740, 8 px below the sub;
    - the sub and the line sit in one container, scaled by `170 / height` when taller than 170. This replaces today's scaling of the sub alone.
  - **`Hud`:** the services plate's dot shows while `lowStock().length > 0 || learnable() !== null`.
- [ ] **Step 4: Run the whole suite and build.** Run: `npx tsc --noEmit && npx vitest run && npx vite build --outDir .superpowers/dist-check`. Expected: clean, all green, built.
- [ ] **Step 5: Commit.** Message: `Name the service a new star lets the shop learn on the rank-up card, and dot the Dịch vụ button until its tuition is paid`.

### Task 9: Browser pass at 390 px (controller)

The controller runs this after the final whole-branch review. Nothing here is committed.

- **Build and serve** as lô B did:
  - `NODE_ENV=development npx vite build --mode development --outDir .superpowers/dist-dev`;
  - `npx vite preview --outDir .superpowers/dist-dev --port 5194 --strictPort --host 127.0.0.1`, in the background;
  - `$B viewport 390x844`.
- **The checklist:**
  1. **An old shop:** inject a day-12 2★ save with every old service open. Dịch vụ opens on page 1, the six rows as before. Page 2 has a faded Chà muối biển reading "Đạt 3★". The arrows sit beside "Xong" without touching it, and no dot shows.
  2. **The rise to 3★:** inject a shop just before a judge day with points for 3★, massage open and 2.000.000 đ. The rank-up box holds "Món mới để học: Chà muối biển." inside it. Next morning the Dịch vụ button has the red dot, and the panel opens on page 2.
  3. **The Học nghề button:** "Học nghề / 700.000 đ" sits on two centred lines inside the button, and the row text never runs under it. At 600.000 đ the button is faded and a tap toasts "Còn thiếu 100.000 đ". At negative money it toasts the debt line.
  4. **Paying and the teacher card:**
     - pay: the money drops 700.000 đ once;
     - the card reads "Học Chà muối biển", with the teacher in a purple áo dài and nón lá;
     - the two numbered lines wrap inside the card;
     - "Bắt đầu".
  5. **The first lesson:**
     - the demo hand circles the first patch until the first touch;
     - "Xoay vòng tròn trên vệt muối" is on one line;
     - the patch fades with each turn;
     - spinning fast shows "Rát quá!" once, rising from under the patch and never over the meter;
     - slowing down resumes the count.
  6. **The fail path:**
     - lift the finger and let the time run out: "Chưa đạt" and "Thử lại không mất tiền.";
     - "Để sau": the row reads "Học tiếp", and the money is unchanged;
     - reload: still "Học tiếp", the same money, and no dot (Review Focus 4).
  7. **The pass path:**
     - "Học tiếp", then the game: no demo hand;
     - reach 2★: "Học xong!", the bed on its gold disc, the line wrapped inside the card;
     - "Xong": the row reads "Chưa có Giường chà muối".
  8. **The bed and the stock:** Build shows the Giường chà muối gift card first in Giường. Place it and the row reads "Đang có". Kho's Muối biển reads "Còn 20", on page 2 when the shop has seven stock items.
  9. **Real customers:**
     - a student or a tourist asks for scrub and lies face down on the bed;
     - a plain customer gets 4 patches;
     - a picky customer gets 5 and hits "Rát quá!" sooner;
     - a technician serves scrub on her own;
     - her course "Chà muối biển → bậc 1 · 100.000 đ" fits its button, and the course picker's seven rows fit the screen.
  10. **The beach:** its Dịch vụ row reads "Chưa có Giường chà muối" (no Học nghề). Buy a bed there, and tourists ask for scrub.
  11. **The rank tab** reads "6/6 món" with seven services, and the "Đủ món" badge is as it was.
  12. **The console** has no errors after `$B console --clear`.
- **Reset `$B`:** about:blank, 1280x720, `localStorage.clear()`.
- **Ship** (shared checkout rule):
  - check `origin/master` and the `ngoi-sao` and `le-tan-chi-so` branches for a save version or edits to `config.ts`, `vi.ts`, `save.ts`, `customers.ts`, `items.ts`, `SpaScene.ts` or `main.ts`;
  - integrate in a temporary worktree, renumbering the save as Global Constraints says if v26 is taken;
  - re-run the tests, merge, push, then report to Chồng yêu.
