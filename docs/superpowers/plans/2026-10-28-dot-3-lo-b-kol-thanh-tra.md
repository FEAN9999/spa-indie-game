# Đợt 3 phần 2, lô B: KOL và thanh tra — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Random events start: a scheduler books at most one event a day from day 10 outside festival months, the day before; lô B's two events are KOL Mi Mi (3 stars → two "đang hot" days) and the hygiene inspector (three checks at 15:00, reward and a one-time Giấy khen). Save v18.

**Architecture:** Rules live in the sim. `src/sim/events.ts` holds the `EventBook` and the pure scheduler, drawn at day end from its own rng stream right after the VIP booking; `SpaSim` reads the book for arrivals, patience, Mi Mi and the inspection. The view gets pure text/card helpers in `src/view/events.ts` and `src/view/today.ts`, one new overlay scene `InspectScene`, and art for Mi Mi's phone, the inspector, three event icons and the certificate.

**Tech Stack:** TypeScript, Phaser 4 (view only), Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-3-le-su-kien-design.md` (sections 5, 7.3–7.6, 7.9, 8.2, 8.4, 8.5 KOL/thanh tra, 8.6 v18, 10). Approved sketch: https://claude.ai/artifact/Mv6UqNrH4C1EQ4ynKeqdzN (event texts, inspector card layout, Mi Mi/inspector/certificate art).

## Global Constraints

- `src/sim/**` imports no Phaser. Strings in `src/strings/vi.ts`, numbers in `src/config.ts`.
- No event takes money, shop stars or items (spec 5). Mi Mi's reviews never enter `reviews`, good or bad.
- Every event is announced from the summary of the day before; reload never redraws (spec 5).
- No two events a day, none in a festival month, none on a VIP's day.
- Rewards are paid once: reload, or `fromSave` re-emitting `dayEnded`, pays nothing again.
- Text on screen never overflows or overlaps at iPhone width.
- New draws use their own rng: the scheduler uses `createRng(day * 6151 + nextId)`. `same-draws` (7 days) must stay green.
- Config (spec 10): `EVENT_FROM_DAY 10`, `EVENT_GAP_DAYS [2, 4]`, `EVENT_REWARD_FACTOR 2`, `HOT_DAYS 2`, `HOT_ARRIVAL 0.8`, `INSPECT_MIN 900`, `INSPECT_BEAUTY 30`, `CERTIFICATE_BEAUTY 4`.
- Sounds (7.9): inspection passed plays `levelUp`; the morning event card and the hot card are silent; toasts add no sound.
- Never stage `CLAUDE.md`. No attribution lines in commits.

## Review Focus

1. Reload on the summary after tomorrow's event was planned, and reload while Mi Mi is in the shop: no second plan, she is still Mi Mi (no review, 3 stars still makes hot). → Task 5 tests.
2. 15:00 passes while the owner is in a mini-game or a panel is open: the sim does not step, so the inspection waits and happens once when the shop runs again. → Task 4 test "inspects once, at the first step at or after 15:00".
3. Tomorrow has a VIP, or is in a festival month, or an old v17 shop loads on day 30: no event on those days; an old shop's events start from tomorrow at the earliest. → Task 1 and Task 5 tests.
4. Mi Mi arrives to a full shop, or walks out: she stands like a VIP instead of leaving at the door; walking out costs no stars and only says she left. → Task 3 tests.
5. Long texts at iPhone width: "Dầu massage chỉ còn 3" in a check row, a 7-digit "Đạt! +1.234.000 đ", the today line "KOL Mi Mi hẹn 14:30". → Task 9 browser check.

---

### Task 1: The event book and the scheduler

**Files:**
- Create: `src/sim/events.ts`, `tests/sim/events.test.ts`, `tests/fixtures/save-v17.json`
- Modify: `src/config.ts`

**Interfaces:**
- Produces:
  - `type EventKind = 'kol' | 'inspect'`, `EVENT_KINDS: EventKind[]`
  - `interface EventPlan { kind: EventKind; day: number; minute: number }`
  - `interface EventBook { nextDay: number; last: EventKind | null; plan: EventPlan | null; hotUntil: number; count: number; inspected: boolean; certGiven: boolean }`
  - `emptyEventBook(nextDay = EVENT_FROM_DAY): EventBook`
  - `planEvent(book: EventBook, day: number, vipDay: number | null, rng: Rng): EventPlan | null` — plans for `day + 1`
  - `dueKol(book, day, minutes): boolean`, `hotOn(book, day): boolean`, `hotDaysLeft(book, day): number`
  - `KOL_LOOK: Look` = `{ skin: 0, hair: 1, hairStyle: 1, shirt: 3 }` (pink shirt)

- [ ] **Step 0: Freeze `tests/fixtures/save-v17.json`** before any sim change. Use a throwaway vitest script in the scratchpad (as for v16) that builds a shop on day 13 (month 5, no festival) with one customer waiting, a month quest and `festival.keepsakes: ['march8']`, and writes `toSave()`. Check it has `v: 17` and no `events` key.
- [ ] **Step 1: Write the failing tests** in `tests/sim/events.test.ts`:
  - `plans nothing before day 10, in a festival month, before nextDay or on a VIP's day, and draws nothing then`: use a counting rng. `planEvent(emptyEventBook(), 8, null, rng)` → null (tomorrow is 9). `planEvent(book, 21, null, rng)` → null (tomorrow, day 22, is Trung thu). `nextDay: 15` with day 12 → null. `vipDay: 13` with day 12 → null. Each null leaves the book unchanged and the rng uncalled.
  - `plans tomorrow on day 9`: day 9 → plan `{ day: 10 }`, `book.plan` set, `book.last` = its kind.
  - `never repeats the last event, and spaces the next one 2 to 4 days`: for seeds 1–200 with `last: 'kol'` → kind `'inspect'`; `nextDay − plan.day` ∈ [2, 4], all three gaps seen.
  - `books Mi Mi on a half hour from 10:00 to 17:00 and the inspector at 15:00`: over seeds, KOL minutes are in {600, 630, …, 1020} with both ends seen; inspect minute is 900.
  - `brings about five events in the first year`: for seeds 1–100, run `planEvent` for days 9–35 with no VIP; the average count is between 4 and 7.
  - `is hot the two days after Mi Mi's 3 stars`: `hotUntil: 14` → `hotOn` false on 12, true on 13 and 14, false on 15; `hotDaysLeft` 2 on 13, 1 on 14, 0 on 15; `hotUntil: 0` → never.
  - `dueKol` is true only for a kol plan of that day once `minutes >= minute`.
- [ ] **Step 2: Run** `npx vitest run tests/sim/events.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement.** Add the eight config numbers. `planEvent` checks `d = day + 1`: `d >= EVENT_FROM_DAY`, `festivalOf(d) === null`, `d >= book.nextDay`, `vipDay !== d`, and at least one kind other than `last`. Draws, in order: the kind (uniform over the kinds left), the KOL's half hour as `planBooking` does (`VIP_FROM_MIN`/`VIP_TO_MIN`; none for the inspector, whose minute is `INSPECT_MIN`), then the gap in `EVENT_GAP_DAYS`. It sets `nextDay = d + gap`, `last`, `plan`.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** "Add the event book and the scheduler that books tomorrow's KOL or inspector".

### Task 2: The shop plans, announces and runs hot days

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/types.ts`
- Create: `tests/sim/spa-events.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `SpaSim.events: EventBook`, `SpaSim.hotToday(): boolean`
  - events `{ type: 'eventToday'; plan: EventPlan }` and `{ type: 'hotStarted'; until: number }`
  - `eventArrivalFactor()` = `Math.min(festival ? FESTIVAL_ARRIVAL : 1, hot ? HOT_ARRIVAL : 1)`; patience factor `FESTIVAL_PATIENCE` once if festival or hot.

- [ ] **Step 1: Write the failing tests** in `tests/sim/spa-events.test.ts`:
  - `plans tomorrow's event at the end of the day from a stream of its own`: two shops on day 12 run to `dayOver`; one has `events.nextDay = 999`. The first has `events.plan.day === 13`, the second none, and the next `sim.rng()` of both is equal.
  - `skips a day the VIP is booked for`: `vip.booking = { vip: 'singer', day: 13, minute: 700 }` before day 12 ends → `events.plan` null.
  - `announces today's event in the morning, and only that day`: `plan = { kind: 'inspect', day: 13, minute: 900 }`, `day = 12`, `startDay()` → `eventToday` with that plan; the next `startDay()` drops the plan and announces nothing.
  - `resets the day's count and inspection each morning`.
  - `brings customers closer and more patient on a hot day, once even in a festival`: `hotUntil` covering today → factor 0.8; on a hot festival day still 0.8; a plain customer's patience is ×1.2 (±1 ms) as in the festival test.
  - `leaves hot days out of the recent days`: a hot day's `recordDay` adds nothing to `progress.recent`.
  - `announces the first hot day only`: `hotStarted { until }` on `hotUntil − 1`, none on `hotUntil`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** At day end, right after `planBooking`: `planEvent(this.events, this.day, this.vip.booking?.day ?? null, createRng(this.day * 6151 + this.nextId))`. In `startDay`, after `clearStale(this.vip, …)`: drop a plan for a day gone by, set `count = 0`, `inspected = false`. At the end of `startDay`, after `festivalStarted`: emit `eventToday` if `plan.day === day`, and `hotStarted` if `day === hotUntil − HOT_DAYS + 1`. `recordDay` busy = festival or hot.
- [ ] **Step 4: Run** `npx vitest run tests/sim`. Expected: PASS (same-draws included).
- [ ] **Step 5: Commit** "Plan tomorrow's event at day end, announce it in the morning, and run hot days like a festival".

### Task 3: Mi Mi comes, is served, and posts or leaves

**Files:**
- Modify: `src/sim/types.ts` (`Customer.kol: boolean`), `src/sim/spa.ts`, `tests/sim/helpers.ts` (SpawnOptions passes `kol`)
- Test: `tests/sim/spa-events.test.ts`

**Interfaces:**
- Produces: `spawnCustomer({ kol: true })`; events `{ type: 'kolArrived'; customerId }`, `{ type: 'kolPosted'; customerId }`, `{ type: 'kolLeft'; customerId }`.

- [ ] **Step 1: Write the failing tests:**
  - `brings Mi Mi at her minute, once, on top of the usual arrivals`: plan kol today at 870; step to 869 → no `kol` customer; step past 870 → one, with `KOL_LOOK`, kind `office`, `kolArrived`, and `events.plan` null; stepping on brings no second.
  - `seats Mi Mi like a VIP when the shop is full`: every seat taken → she goes to the stand spot, no `noSeat`, no walkedAway.
  - `does not count Mi Mi's stars toward the shop`: `reviews` unchanged after `ownerServes(sim, 3, { kol: true })`, after 1 star, and after she runs out of patience.
  - `makes the next two days hot when Mi Mi gets 3 stars`: `hotUntil === day + HOT_DAYS`, `kolPosted`.
  - `only says Mi Mi left below 3 stars or when she walks out`: `kolLeft`, `hotUntil` unchanged.
  - `gives Mi Mi no festival or hot patience`: her patience on a hot day equals a plain day's (both `kol`).
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** Every customer gets `kol: false` except Mi Mi. In `spawnCustomer`, `kol` takes `KOL_LOOK`, kind `office`, `drawService` (no likes, no festival service), and patience without `eventPatienceFactor`; it clears a today's kol plan and emits `kolArrived`. In `step`, beside `dueVip`: `if (dueKol(...)) this.spawnCustomer({ kol: true })`. `seatCustomer` treats her like a VIP. `addReview` returns at once for her. `payFor` emits `kolPosted` and sets `hotUntil` on 3 stars, else `kolLeft`; `loseCustomer` emits `kolLeft`.
- [ ] **Step 4: Run** `npx vitest run tests/sim`. Expected: PASS.
- [ ] **Step 5: Commit** "Bring Mi Mi at her booked minute; her 3 stars make two hot days and her reviews never touch the shop's stars".

### Task 4: The inspection and the Giấy khen

**Files:**
- Modify: `src/sim/items.ts` (`certificate`), `src/strings/vi.ts` (`itemCertificate: 'Giấy khen'`), `src/sim/spa.ts`, `src/sim/types.ts`
- Test: `tests/sim/spa-events.test.ts`, `tests/sim/items.test.ts`

**Interfaces:**
- Produces:
  - `{ type: 'inspected'; checks: { stock: boolean; calm: boolean; tidy: boolean }; low: { item: StockItem; count: number } | null; lost: number; beauty: number; reward: number; cert: boolean }`
  - private `eventReward(): number` = `EVENT_REWARD_FACTOR * baseReward(averageDay(this.progress.recent))` (lô C reuses it)
  - item `certificate`: `{ w: 1, h: 1, price: 0, beauty: CERTIFICATE_BEAUTY, group: 'decor', giftOnly: true, name: 'itemCertificate' }`

- [ ] **Step 1: Write the failing tests:**
  - items: `certificate` is gift-only decor worth 4 beauty.
  - `inspects once, at the first step at or after 15:00, and pays twice a daily reward when all three pass`: plan inspect today; decor bought until `beauty() >= 30`; nothing at 899; at the first step ≥ 900 one `inspected` with all checks true, `reward === 2 * baseReward(averageDay(progress.recent))`, money and `stats.quests` up by it, `certificate` in `book.gifts`, `cert: true`, `inspected` set; stepping on, nothing more.
  - `gives the Giấy khen only on the first pass`: `certGiven: true` → reward paid, `cert: false`, no gift.
  - `fails a check and pays nothing`: three shops, each failing one check: a stock item at `LOW_STOCK` (`low` names it and its count), one walk-away (`lost: 1`), beauty 21. Reward 0, no gift, money unchanged.
  - `inspects nothing on another day`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** In `step`, after the arrivals block and outside `autoSpawn`: the first time `!inspected` and an inspect plan for today has `clock.minutes >= plan.minute`, `inspect()`. Stock = `lowStock()` empty (`low` = the first one and its count). Calm = `stats.angry + stats.walkedAway === 0`, the same "bỏ về" the noWalk quest counts. Tidy = `beauty() >= INSPECT_BEAUTY`.
- [ ] **Step 4: Run** `npx vitest run tests/sim`. Expected: PASS.
- [ ] **Step 5: Commit** "Inspect the shop at 15:00 on its day: three checks, twice a daily reward and a first Giấy khen".

### Task 5: Save v18

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/spa.ts` (toSave, fromSave)
- Test: `tests/sim/save.test.ts`, `tests/save/code.test.ts`, `tests/sim/spa-events.test.ts`

**Interfaces:**
- Produces: `SAVE_VERSION = 18`, `SaveData.events: EventBook`, `repairEvents(x: unknown, day: number): EventBook` (exported).

- [ ] **Step 1: Write the failing tests:**
  - `a v17 shop gets an empty event book from tomorrow, and nobody in it is Mi Mi`: open the v17 fixture → `events` equals `emptyEventBook(max(day + 1, 10))`; every customer `kol: false`.
  - `repairs a damaged event book field by field`: unknown `last` → null; a plan with an unknown kind, a non-integer day, or a day more than one ahead → null; negative or fractional `nextDay`/`hotUntil`/`count` → 0; non-boolean flags → false. A good book round-trips unchanged.
  - `keeps Mi Mi through a reload`: spawn her, save and load → `kol: true`; serve her 3 stars → no review, hot.
  - `keeps tomorrow's plan through a reload on the summary and plans nothing again`: end a day with a plan, reload with `dayOver` → same plan, same `nextDay`.
  - Version pins 17 → 18 in save and code tests; the newer-than test uses 19.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** Bump the version and accept 17 in `parseVersioned`. Every customer `kol: c.kol === true`. `data.events = repairEvents(data.events, data.day)`, where a missing book is `emptyEventBook(Math.max(day + 1, EVENT_FROM_DAY))`. `toSave`/`fromSave` carry `events` (cloned).
- [ ] **Step 4: Run** `npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** "Save the event book and Mi Mi's flag (save v18)".

### Task 6: Event words: the summary note, the clock star, today's line, cards and toasts

**Files:**
- Create: `src/view/events.ts`, `src/view/today.ts`, `tests/view/events.test.ts`, `tests/view/today.test.ts`
- Modify: `src/view/festivals.ts` (`todayLine` → `festivalLine(sim): TodayLine | null`; `todayShown` moves to `today.ts`), `src/view/vip.ts` (`summaryNotes`, `clockStar`), `src/view/Hud.ts`, `src/scenes/SummaryScene.ts`, `src/scenes/SpaScene.ts`, `src/strings/vi.ts`, `tests/view/festivals.test.ts`

**Interfaces:**
- Produces:
  - `interface TodayLine { icon: { texture: string; disc: string }; text: string }`. Hud draws `icon.disc` and `icon.texture` instead of the festival's colours and keepsake.
  - `EVENT_ICON`: kol `{ texture: 'event-phone', disc: C.lotus }`, inspect `{ texture: 'event-clip', disc: C.water }`, hot `{ texture: 'event-spark', disc: C.mustard }`.
  - `eventNote(plan): string`, `eventCard(plan): GoldCard`, `hotCard(): GoldCard`, `eventLine(sim): TodayLine | null`, `inspectRows(e)`, `inspectResult(e)`.
  - `todayLine(sim)` in `today.ts`, in order: inspection, KOL, festival, hot. `todayShown(sim, covered)`.
  - `summaryNotes(firstDay, vip, events, day, vipHintDone)`, `clockStar(vip, events, day, minutes)`.
  - `GoldCard.quiet?: boolean`; `showCard` plays `levelUp` unless quiet.
- Exact copy (vi.ts):
  - `eventNoteKol` 'Ngày mai: KOL Mi Mi ghé review lúc {time} · được 3 sao thì 2 ngày sau khách đông hơn.'
  - `eventNoteInspect` 'Ngày mai: Thanh tra vệ sinh ghé khoảng {time} · xem kho, khách bỏ về và độ gọn đẹp.'
  - Cards (head 'Hôm nay'):
    - `eventKolName` 'KOL Mi Mi ghé review' / `eventKolLine` 'Hẹn {time}. Làm cho Mi Mi được 3 sao thì 2 ngày sau khách đông hơn.'
    - `eventInspectName` 'Thanh tra vệ sinh ghé' / `eventInspectLine` 'Khoảng {time}. Xem kho, khách bỏ về và độ gọn đẹp. Đạt có thưởng, chưa đạt không phạt.'
  - Hot card: `hotHead` 'Video của Mi Mi lên sóng', `hotName` 'Tiệm đang hot!', `hotLine` 'Hôm nay và ngày mai khách tới đông hơn khoảng 1/4.'
  - Today: `todayInspect` 'Thanh tra ghé lúc {time}', `todayKol` 'KOL Mi Mi hẹn {time}', `todayKolHere` 'Mi Mi đang ở tiệm', `todayHot` 'Đang hot · còn {n} ngày', `todayHotLast` 'Đang hot · còn hôm nay'
  - Toasts: `kolArrivedToast` 'Mi Mi tới rồi · làm cho Mi Mi 3 sao nhé', `kolPostedToast` 'Mi Mi khen hết lời', `kolLeftToast` 'Mi Mi về rồi, không đăng bài'
  - Inspection:
    - `inspectTitle` 'Thanh tra vệ sinh', `inspectSub` 'Ghé lúc {time} · xem 3 việc'
    - `inspectStock` 'Kho đủ hàng' / `inspectStockOk` 'Món nào cũng còn từ {n} trở lên' / `inspectStockLow` '{item} chỉ còn {count}'
    - `inspectCalm` 'Không ai bỏ về' / `inspectCalmOk` 'Từ sáng chưa khách nào bỏ về' / `inspectCalmLost` 'Có {n} khách bỏ về'
    - `inspectTidy` 'Tiệm gọn đẹp' / `inspectTidyLine` 'Điểm đẹp {beauty}, cần từ {need}'
    - `inspectPass` 'Đạt! +{money}' / `inspectPassCert` 'Lần đầu đạt: tặng món trang trí Giấy khen' / `inspectPassMoney` 'Thưởng bằng hai nhiệm vụ ngày'
    - `inspectFail` 'Chưa đạt · không bị phạt' / `inspectHintStock` 'Lần sau nhớ nhập thêm hàng trước giờ hẹn nhé' / `inspectHintCalm` 'Lần sau để ý khách đang chờ nhé' / `inspectHintTidy` 'Lần sau thêm cây, tranh cho tiệm đẹp hơn nhé'
    - `inspectDone` 'Xong', `certToast` 'Giấy khen đã vào Xây dựng'

- [ ] **Step 1: Write the failing tests** (`tests/view/events.test.ts`, `tests/view/today.test.ts`, updated festival tests):
  - `eventNote` gives both exact sentences with the time ("14:30", "15:00").
  - `summaryNotes` adds the event note, marked, when the plan is for tomorrow, and not when it is for today.
  - `clockStar` lights from 60 minutes before Mi Mi's minute, and not for the inspector.
  - Today's line in order: the inspection until done; Mi Mi booked, then here (a `kol` customer), then nothing; the festival line as before; hot with "còn 2 ngày", then "còn hôm nay". Each line carries its icon.
  - `eventCard` and `hotCard` are quiet; festival and badge cards are not.
  - `inspectRows` shows ok and failed details: "Dầu massage chỉ còn 3", "Có 2 khách bỏ về", "Điểm đẹp 34, cần từ 30". `inspectResult` gives pass with the certificate line, pass with the money line, and a fail with the first failed check's hint.
- [ ] **Step 2: Run** `npx vitest run tests/view`. Expected: FAIL.
- [ ] **Step 3: Implement**, and wire it up:
  - SummaryScene passes `sim.events`; Hud uses the new `clockStar` and `todayShown`.
  - SpaScene queues `eventCard` on `eventToday` and `hotCard` on `hotStarted`.
  - It toasts on `kolArrived` / `kolPosted` / `kolLeft`.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: PASS, clean.
- [ ] **Step 5: Commit** "Tell tomorrow's event on the summary, star the clock for Mi Mi, and add the event lines, cards and toasts".

### Task 7: Art: event icons, Mi Mi's phone, the inspector, the certificate

**Files:**
- Modify: `src/art/fx.ts`, `src/art/chibi.ts`, `src/art/palette.ts`, `src/view/CharacterView.ts`, `src/art/furniture.ts`, `src/scenes/SpaScene.ts` (Mi Mi's star)
- Test: `tests/art/furniture.test.ts`, `tests/art/chibi.test.ts` (or the existing chibi/palette test file)

**Interfaces:**
- Produces:
  - textures `event-phone`, `event-clip`, `event-spark` (64×64, ink strokes from the sketch's ICON paths)
  - chibi parts `phone-down`, `phone-side`, `clipboard-down`, `clipboard-side`
  - `CharacterColors.visitor?: 'kol' | 'inspector'`, worn ahead of the VIP's, regular's and kind's things
  - `customerColors(look, kind, regular, vip, kol = false)`, `inspectorColors(): CharacterColors` (navy shirt 0x3d4a66)
  - `decor-certificate`, built from the sketch's Giấy khen through the keepsake wrapper

- [ ] **Step 1: Write the failing tests:**
  - every `decor-*` item including `certificate` has art;
  - `PART_ANCHORS` has the four new parts;
  - `fxTextures()` has the three icons;
  - `customerColors(…, true).visitor === 'kol'`, and `inspectorColors().visitor === 'inspector'`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The phone is a small dark phone in a pink case at the right hand. The clipboard is cream paper on a brown board with two ink lines. Copy the size and line weight of `micPin`.
  - Mi Mi shows the VIP star over her head while `arriving` or `toSeat`.
- [ ] **Step 4: Run** `npx vitest run tests/art` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** "Draw Mi Mi's phone, the inspector's clipboard, three event icons and the Giấy khen".

### Task 8: The inspection card

**Files:**
- Create: `src/scenes/InspectScene.ts`
- Modify: `src/main.ts` (register), `src/scenes/SpaScene.ts`

**Interfaces:**
- Consumes: the `inspected` event and `inspectRows` / `inspectResult` (Task 6), `inspectorColors` (Task 7).
- Produces: `InspectData { result: Extract<SimEvent, { type: 'inspected' }>; onDone: () => void }`.

- [ ] **Step 1: Build the scene** to the sketch's layout:
  - Dimmed backdrop that takes taps.
  - Card x 90, y 400, w 900, h 1120.
  - Disc at (540, 520), r 70, `C.water`, holding `event-clip`.
  - Title at y 650 (56); sub at 712 (30).
  - Three rows at y 830 + 140·i, each 800 × 116. A row's mark is a teal tick or a terracotta cross, appearing 450 ms × (i + 1) in.
  - Result at 1260 / 1318, appearing at 1800 ms, with `levelUp` on a pass.
  - "Xong" button at (540, 1430), 520 × 120.
  - Fit-scale any text wider than its row.
- [ ] **Step 2: Wire SpaScene:** on `inspected`, pause the sim and stand an inspector `CharacterView` at the floor-1 door facing down. Launch `InspectScene`; on Xong, unpause, remove the inspector, float the reward's money, and toast `certToast` when `cert` is true.
- [ ] **Step 3: Run** `npx tsc --noEmit` and `npx vitest run`. Expected: clean, PASS.
- [ ] **Step 4: Commit** "Show the inspector at the door and the inspection card with its three checks".

### Task 9: Browser check

- [ ] Dev build (`NODE_ENV=development npx vite build --outDir .superpowers/dist-dev`, preview on 5193). With `window.__spa`, plan each event and look at:
  - the summary's "Ngày mai" line and the morning card;
  - the clock star and today's line through Mi Mi's day;
  - Mi Mi with her phone and star;
  - the 3-star toast and the next morning's hot card and line;
  - the inspection card passing (Giấy khen in Build) and failing on each check, with a long stock name and a 7-digit reward.
- [ ] Fix anything that overflows or overlaps; ledger it.
