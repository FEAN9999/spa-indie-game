# Đợt 3 phần 3–5, lô A: hạng tiệm và Spa của năm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The shop gets a 1–5 star grade judged on the last evening of each month from day 9 (five parts × 20 points, up at most one star a month, never down), a one-time reward per new star, +5% prices per star from 2 stars, a plaque by the door, a "Hạng tiệm" tab, a month card after the summary, and on day 36, 72… the Spa của năm race against four street rivals with money, a gold cup and a bằng khen. Save v19.

**Architecture:** Rules live in a pure module `src/sim/rank.ts` (parts, stars, prices, rivals, judging a `RankBook`). `SpaSim` owns the book: it snapshots the month's counters in `startDay`, judges month and year in its day-end block before `dayEnded`, pays into `money` (never `stats`), and prices in `payFor`. Results are saved, so the view only reads them: pure texts in `src/view/rank.ts`, a third tab in `QuestsScene`, a new `RankScene` for the month and year cards chained after `SummaryScene`, and a plaque in `RoomView`.

**Tech Stack:** TypeScript, Phaser 4 (view only), Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-3-hang-ao-vang-design.md` (sections 5, 7.1–7.4, 7.7, 8.1, 8.4 v19, 10). Approved sketch: https://claude.ai/artifact/9ggNDtY5Cv8muth1Et58xg (tab, month card, year card, plaque, cup and certificate art). Sketch source: `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\9ad07023-61da-40ae-b124-964377a3b4ba\scratchpad\sketch\template-hang.html` (functions `rankTab`, `partRow`, `monthCard`, `yearCard`, `plaque`, constants `CUP`, `CERT`).

## Global Constraints

- `src/sim/**` imports no Phaser. Strings in `src/strings/vi.ts`, numbers in `src/config.ts`.
- The grade never goes down; ranks 4–5 lose nothing (spec 5).
- Paid once: reload, or `fromSave` re-emitting `dayEnded`, never judges again, pays again or gives a cup or certificate again.
- The grade is not on the top bar.
- No new random draws. `same-draws` (7 days) stays green; 1-star prices are exactly today's prices, so every existing payment test stays green.
- Rank money goes into `money` only: not `stats`, not `progress` counters, not the summary rows.
- Config (spec 10): `RANK_FROM_DAY 9`, `RANK_RATING [3, 4.8]`, `RANK_BEAUTY_FULL 60`, `RANK_SERVED_FULL 25`, `RANK_LOST_ZERO 0.2`, `RANK_STAR_AT [30, 50, 70, 85]`, `RANK_REWARD {2: 200_000, 3: 400_000, 4: 700_000, 5: 1_000_000}`, `RANK_PRICE_STEP 0.05`, rivals Tiệm gội Cô Ba 48, Ngọc Lan Spa 58, Spa Hoa Sen 66, SPA MỚI 74, `RIVAL_YEAR_STEP 4`, `RIVAL_SCORE_MAX 86`, `YEAR_REWARD [3_000_000, 1_000_000, 500_000, 0, 0]`, `TROPHY_BEAUTY 8`, `MERIT_BEAUTY 5`.
- A month with no customers scores 0 on the walk-out part (spec 8.1, decided at planning).
- Sounds (7.7): a new star and year places 1–3 play `levelUp`; keeping a star and places 4–5 add no sound.
- Text on screen never overflows or overlaps at iPhone width.
- Never stage `CLAUDE.md`. No attribution lines in commits.

## Review Focus

1. Reload on the judging evening, with the summary or a card open: no second judging or payment, the cards come back from `rank.last`/`rank.lastYear`. → Task 3 and Task 4 tests.
2. A month with no customers or no reviews: every part is a whole number 0–20, never NaN; an empty month gives 0 for walk-outs. → Task 1 tests.
3. An old v18 shop loaded on day 29 (mid-month) or on day 36 after its day ended: 1 star, first judging at this month's end, a year award from only the months judged since. → Task 4 tests.
4. A grade price with a festival service, a VIP and a tip: grade first (rounded to 1.000 đ), then ×1.2 or ×3; tip on the festival price as today. → Task 3 test.
5. Long texts at iPhone width: "Tổng 61 điểm · đủ lên 3 sao tối ngày 15", "Thưởng 1.000.000 đ. Từ mai khách trả thêm 20%…", a 20-letter shop name next to "86 điểm" in both tables. → Task 7 browser check.

---

### Task 1: The rank rules

**Files:**
- Create: `src/sim/rank.ts`, `tests/sim/rank.test.ts`, `tests/fixtures/save-v18.json`
- Modify: `src/config.ts`

**Interfaces:**
- Produces:
  - `type Stars = 1 | 2 | 3 | 4 | 5`
  - `interface RankInput { rating: number | null; beauty: number; services: number; servedPerDay: number; lostShare: number | null }` (`lostShare` null = no customers this month)
  - `interface MonthResult { day: number; input: RankInput; parts: number[]; total: number; before: Stars; after: Stars; reward: number }`
  - `type RivalId = 'coBa' | 'ngocLan' | 'hoaSen' | 'spaMoi'`
  - `interface YearRow { rival: RivalId | null; pts: number }` (null = the shop)
  - `interface YearResult { day: number; year: number; score: number; table: YearRow[]; place: number; reward: number; gifts: ('trophy' | 'merit')[] }`
  - `interface RankBook { stars: Stars; month: { from: number; served: number; lost: number }; scores: number[]; last: MonthResult | null; lastYear: YearResult | null; wins: number; meritGiven: boolean }`
  - `emptyRankBook(from: number, served: number, lost: number): RankBook`
  - `rankParts(input: RankInput): number[]` (5 whole numbers), `starsFor(total: number): Stars`
  - `rankPrice(price: number, stars: Stars): number`
  - `monthInput(book: RankBook, day: number, rating: number | null, beauty: number, services: number, total: { served: number; lost: number }): RankInput`
  - `isJudgeDay(day: number): boolean`, `isYearEnd(day: number): boolean`
  - `rivalsFor(year: number): YearRow[]`, `standings(mine: number, year: number): YearRow[]`
  - `judgeMonth(book: RankBook, input: RankInput, day: number): MonthResult` (mutates the book)
  - `judgeYear(book: RankBook, day: number): YearResult | null` (mutates the book; null when `scores` is empty)
  - `yearSoFar(book: RankBook, nowTotal: number): number`

- [ ] **Step 0: Freeze `tests/fixtures/save-v18.json`** before any change, with a throwaway vitest script in the scratchpad (as for v17). Build a shop on day 29 (month 10 is days 28–30), `profileDone`, one customer waiting, `progress.total.served` 200 and `lost` 12, `progress.dayStart` with `served` 190, `lost` 11, and write `toSave()`. Check it has `v: 18` and no `rank` key.
- [ ] **Step 1: Write the failing tests** in `tests/sim/rank.test.ts`:
  - `scores the sketch's two shops`: `rankParts({ rating: 4.2, beauty: 40, services: 4, servedPerDay: 14, lostShare: 0.09 })` → `[13, 13, 13, 11, 11]` (61); `{ 4.4, 48, 4, 14, 0.10 }` → `[16, 16, 13, 11, 10]` (66).
  - `keeps every part a whole number from 0 to 20`: rating null → 0, 2.5 → 0, 5 → 20; beauty 0 → 0, 90 → 20; services 1 → 3, 6 → 20; served 0 → 0, 30 → 20; lostShare 0 → 20, 0.25 → 0, null → 0.
  - `turns points into stars`: 29 → 1, 30 → 2, 49 → 2, 50 → 3, 69 → 3, 70 → 4, 84 → 4, 85 → 5, 100 → 5.
  - `raises prices 5% a star from 2 stars, to the nearest 1.000 đ`: `rankPrice(40000, 1)` 40000, `(40000, 2)` 42000, `(90000, 2)` 95000 (94.500 rounds up), `(160000, 5)` 192000.
  - `judges on the last day of each month from day 9, and the year on day 36, 72`: `isJudgeDay` false on 3, 6, 8, 10, true on 9, 12, 36; `isYearEnd` true on 36, 72, false on 35, 37.
  - `reads the month from its snapshot`: book month `{ from: 13, served: 100, lost: 5 }`, day 15, total `{ served: 145, lost: 10 }` → `servedPerDay` 15, `lostShare` 0.1; total equal to the snapshot → `servedPerDay` 0, `lostShare` null.
  - `climbs one star a month and never falls`: book at 1 star, `judgeMonth` with an input worth 100 (`{ 4.8, 60, 6, 25, 0 }`) → `after` 2, `reward` 200000, `stars` 2, `scores` [100], `last` set; again → 3 and 400000; a later input worth 10 → `after` = `before`, reward 0.
  - `rivals climb 4 a year up to 86`: year 1 → 48, 58, 66, 74; year 2 → 52, 62, 70, 78; year 5 → 64, 74, 82, 86; year 10 → all 86.
  - `ranks the shop first on a tie`: `standings(74, 1)` → shop first; `standings(66, 1)` → second; `standings(40, 1)` → fifth.
  - `pays the year by place, the cup and the certificate once each`: scores [70, 76] (avg 73) in year 1 → place 2, reward 1000000, gifts ['merit'], `meritGiven` true, `scores` []; next year a second place gives no merit; scores [80] → place 1, 3000000, gifts ['trophy'], `wins` 1; a second win has no gifts and `wins` 2; empty scores → null.
  - `projects the year with this month so far`: scores [55, 58], now 61 → 58.
- [ ] **Step 2: Run** `npx vitest run tests/sim/rank.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement.** Config numbers from Global Constraints; rivals as `RIVALS: { id: RivalId; base: number }[]` in config order Cô Ba, Ngọc Lan, Hoa Sen, SPA MỚI. Each part is `Math.round(20 × clamp01(…))`; the year score is `Math.round(mean(scores))`. `judgeMonth` raises `stars` by one only when `starsFor(total) > stars`; `RANK_REWARD[after]` only when it rose.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** "Add the shop grade rules: five parts, stars, prices and the street's rivals".

### Task 2: The gold cup and the bằng khen

**Files:**
- Modify: `src/sim/items.ts`, `src/config.ts`, `src/art/furniture.ts`, `src/strings/vi.ts`
- Test: `tests/sim/items.test.ts`, `tests/art/furniture.test.ts`

**Interfaces:**
- Produces: `ItemKind` `'trophy'` and `'merit'`, both `giftOnly`, 1×1, group `decor`, price 0, beauty `TROPHY_BEAUTY` / `MERIT_BEAUTY`, names `itemTrophy` "Cúp vàng", `itemMerit` "Bằng khen"; art `decor-trophy`, `decor-merit` ({ w: 1, h: 1.9 }).

- [ ] **Step 1: Write the failing tests**: `trophy` and `merit` are gift-only 1×1 decor with beauty 8 and 5 and are never in the shop's catalog; extend the furniture art test's kind list so both draw.
- [ ] **Step 2: Run** `npx vitest run tests/sim/items.test.ts tests/art/furniture.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Art with `keepsake(…)` like `certificate`: the cup from the sketch's `CUP` (gold bowl with handles, cream star, wooden base); the bằng khen from `CERT` with a silver seal (`C.silver` if the palette has it, else a light grey from the palette).
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** "Add the gold cup and the bằng khen keepsakes".

### Task 3: The shop judges its month and its year, and prices by grade

**Files:**
- Modify: `src/sim/spa.ts`
- Create: `tests/sim/spa-rank.test.ts`

**Interfaces:**
- Consumes: Task 1, Task 2.
- Produces: `SpaSim.rank: RankBook` (new shop: `emptyRankBook(1, 0, 0)`), `SpaSim.rankNow(): { input: RankInput; parts: number[]; total: number }` for the tab.

- [ ] **Step 1: Write the failing tests** in `tests/sim/spa-rank.test.ts`, with the `on(day, prep)` and `close(sim)` helpers of `spa-events.test.ts`:
  - `takes the month's snapshot on its first day`: `on(13)` with `progress.total` served 50, lost 4 → `rank.month` `{ from: 13, served: 50, lost: 4 }`; `on(14)` keeps the earlier snapshot.
  - `judges day 9's evening and pays a new star once`: `on(9)`, prep: 20 reviews of 5, `progress.total.served` 45 with `rank.month` `{ from: 7, served: 0, lost: 0 }` (parts 20, 7, 3, 12, 20 = 62) → after `close`: `rank.stars` 2 (one step, though 62 is worth 3), `rank.last.day` 9, and `money` rose exactly 200000 more than in the same shop prepared at 5 stars; `stats.quests` and `progress.total.earned` equal the twin's. `SpaSim.fromSave(parseSave(sim.toSave()))` (which re-emits `dayEnded`) → same `money`, same `rank`.
  - `judges nothing before day 9 or mid-month`: closing day 8 and day 13 leaves `rank.last` null.
  - `judges the year after the month on day 36`: `on(36)` with `rank.scores` [72, 72, 72] and a month worth 48–75 points (so the average is 66–73) → `rank.lastYear.place` 2, reward 1000000 in `money`, `book.gifts` gains one `merit`; reload pays nothing again.
  - `charges the grade's price before the festival and VIP factors`: at 2 stars a shampoo (40000) pays 42000; a festival-month service pays `Math.round(42000 × FESTIVAL_PRICE)`; a VIP pays `42000 × VIP_PRICE_FACTOR`; at 1 star the payments equal today's.
  - `reads the month so far for the tab`: `rankNow().total` equals `rankParts(monthInput(…))` summed for the current counters.
- [ ] **Step 2: Run** `npx vitest run tests/sim/spa-rank.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `startDay`: after `day++`, when `dayOfMonth(day) === 1`, `rank.month = { from: day, served: total.served, lost: total.lost }`.
  - Day-end block in `step`, after `recordDay`, before `planBooking`: when `isJudgeDay(day)`, `judgeMonth(rank, monthInput(…), day)` and add its reward to `money`; then when `isYearEnd(day)`, `judgeYear`, add its reward to `money`, push its gifts to `book.gifts`. No events: the view reads `rank.last` / `rank.lastYear`.
  - `payFor`: `plain = rankPrice(SERVICES[c.service].price, this.rank.stars)`; the rest unchanged.
- [ ] **Step 4: Run** `npx vitest run tests/sim`. Expected: all PASS, including `same-draws`.
- [ ] **Step 5: Commit** "Judge the shop's month and year at day end, and price services by its grade".

### Task 4: Save version 19

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/spa.ts` (`toSave`, `fromSave`)
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Consumes: Task 1, Task 3.
- Produces: `SaveData.rank: RankBook`, `SAVE_VERSION = 19`, `export function repairRank(x: unknown, day: number, start: { served: number; lost: number }): RankBook`.

- [ ] **Step 1: Write the failing tests** in a `describe('save version 19')`:
  - `gives the v18 shop one star and starts its month today`: open `save-v18.json` → `rank.stars` 1, `rank.month` `{ from: 29, served: 190, lost: 11 }` (its `dayStart`), `scores` [], `last` null, `toSave().v` 19.
  - `judges an old shop at the end of its month`: the v18 shop run to the end of day 29 has no `rank.last`; `startDay` to 30 and close → judged, `servedPerDay` over the 2 days 29–30.
  - `gives an old shop's year award from the months since`: an old shop judged only on day 36 gets a `lastYear` whose score is that one month.
  - `still opens every older save` with v18 added.
  - `repairs a damaged rank book field by field`: stars 0, 6, 2.5 or 'x' → 1; a bad `month` → `{ from: day, ...start }`; scores keep only whole numbers 0–100; `last`/`lastYear` that are not objects → null; `wins` and `meritGiven` like `repairCount` / `repairBool`. A good book comes back equal.
  - `round-trips a judged shop`: `fromSave(toSave())` keeps `rank` deep-equal.
- [ ] **Step 2: Run** `npx vitest run tests/sim/save.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `parseVersioned` accepts 18; `parseSave` ends with `data.rank = repairRank(data.rank, data.day, data.progress.dayStart ?? data.progress.total)`, with the comment "shops saved before version 19 start at one star, their month counted from today". A saved `last`/`lastYear` object is kept as is when it has a whole `day`.
- [ ] **Step 4: Run** `npx vitest run`. Expected: all PASS.
- [ ] **Step 5: Commit** "Save the shop's grade (save version 19)".

### Task 5: The grade's texts

**Files:**
- Create: `src/view/rank.ts`, `tests/view/rank.test.ts`
- Modify: `src/strings/vi.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `RANK_PART_ICON: string[]` = `['badge-star', 'badge-sparkle', 'badge-lotus', 'badge-people', 'badge-heart']`
  - `partRows(input: RankInput, parts: number[]): { icon: string; name: string; value: string; pts: number }[]`
  - `starsLine(stars: Stars): string`, `totalLine(total: number, stars: Stars, judgeDay: number): string`, `judgeDayOf(day: number): number`
  - `monthOutcome(r: MonthResult): { head: string; sub: string }`
  - `yearLines(r: YearResult, shopName: string): { rows: { name: string; pts: string; me: boolean }[]; lines: string[]; button: string }`

- [ ] **Step 1: Write the failing tests** with the spec's exact copy:
  - part rows for `{ 4.2, 40, 4, 14, 0.09 }` → names "Điểm đánh giá", "Điểm đẹp", "Số dịch vụ", "Khách mỗi ngày", "Khách bỏ về"; values "4,2", "40", "4/6 món", "14 khách", "9%"; rating null → "chưa có"; `lostShare` null → "0%".
  - `starsLine(1)` "Tiệm 1 sao"; `starsLine(3)` "Tiệm 3 sao · khách trả thêm 10%".
  - `totalLine(46, 2, 15)` "Tổng 46 điểm · cần 50 để lên 3 sao"; `(61, 2, 15)` "Tổng 61 điểm · đủ lên 3 sao tối ngày 15"; `(88, 5, 15)` "Tổng 88 điểm". `judgeDayOf(8)` 9, `(13)` 15.
  - `monthOutcome`: up to 3 → "Lên 3 sao!" / "Thưởng 400.000 đ. Từ mai khách trả thêm 10%, biển cạnh cửa đổi theo."; with a total worth 4 stars adds " Điểm đủ cao hơn nữa: tháng sau lên tiếp."; kept 2 at 46 → "Giữ 2 sao" / "Còn 4 điểm nữa là lên 3 sao. Hạng không bao giờ tụt."; at 5 → "Giữ 5 sao" / "Tiệm đã ở hạng cao nhất."
  - `yearLines`: first win with a trophy → "Tiệm đoạt Spa của năm! Thưởng 3.000.000 đ.", "Lần đầu nên có thêm cúp vàng (vào Xây dựng).", button "Nhận thưởng"; second with merit → "Hạng nhì. Thưởng 1.000.000 đ và bằng khen."; second without → "Hạng nhì. Thưởng 1.000.000 đ."; third → "Hạng ba. Thưởng 500.000 đ."; fourth → "Năm sau cố lên. Không mất gì.", button "Đóng"; last line "Năm 2 các tiệm kia lên thêm 4 điểm. Điểm của tiệm năm nay: 68, trung bình các tháng." and, once every rival is at 86, only "Điểm của tiệm năm nay: 68, trung bình các tháng."; rows name the rivals "Tiệm gội Cô Ba", "Ngọc Lan Spa", "Spa Hoa Sen", "SPA MỚI" and the shop by `shopName`, points "74 điểm".
- [ ] **Step 2: Run** `npx vitest run tests/view/rank.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** with new keys in `vi.ts`; also add the tab and card copy used by Tasks 6–7: `tabRank` "Hạng tiệm", `rankMonthHead` "Tháng {month}, tới hôm nay", `rankJudgeOn` "chấm tối ngày {day}", `rankYearHead` "Spa của năm · năm {year}", `rankYearNote` "Điểm của tiệm là trung bình các tháng đã chấm trong năm.", `rankCardKicker` "Tối ngày {day} · chấm hạng tháng {month}", `rankTotal` "Tổng", `openDay` "Mở cửa ngày {day}", `rankUpToast` "Tiệm lên {n} sao · biển hạng cạnh cửa đã đổi", `yearKicker` "Tối ngày {day} · hết năm {year}", `yearTitle` "Spa của năm", `yearPlace` "Hạng {n}". Money with `formatMoney`.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** "Write the grade's texts for the tab and the cards".

### Task 6: The "Hạng tiệm" tab

**Files:**
- Modify: `src/scenes/QuestsScene.ts`

**Interfaces:**
- Consumes: Task 3 (`sim.rank`, `sim.rankNow()`), Task 5.

- [ ] **Step 1: Implement.** `TAB_X = { quests: 220, badges: 540, rank: 860 }`, `TAB_W` 300. A `rankTab()` laid out as the sketch's `rankTab` (stars at y 560, `starsLine` 650, month head 740 with `rankJudgeOn` right-aligned, five part rows from 790 every 100 with disc icon, name, value, a bar out of 20 and the points, `totalLine` at 1310, year head 1410 with "tối ngày 36/72…" right, the 5-row table from 1452 every 64 with the shop's row on a pale teal pill, the note at 1790). Year rows come from `standings(yearSoFar(rank, rankNow().total), yearOf(day))`. Every text that can grow is scaled to its box like `fit` in `InspectScene`.
- [ ] **Step 2: Run** `npx tsc --noEmit` and `npx vitest run`. Expected: no errors, all PASS.
- [ ] **Step 3: Commit** "Add the Hạng tiệm tab to the quest panel".

### Task 7: The month and year cards, and the plaque by the door

**Files:**
- Create: `src/scenes/RankScene.ts`
- Modify: `src/scenes/SpaScene.ts`, `src/scenes/SummaryScene.ts`, `src/view/RoomView.ts`, `src/main.ts`

**Interfaces:**
- Consumes: Tasks 3, 5.
- Produces: `interface RankData { sim: SpaSim; kind: 'month' | 'year'; onDone: () => void }`; `RoomView.setRank(stars: Stars): void`.

- [ ] **Step 1: Implement `RankScene`** as the sketch's `monthCard` and `yearCard`: a dimmed screen and a card; the month card's bars grow and the total counts up over 800 ms, a new star pops; the year card shows the cup, the certificate or "Hạng N", the table, `yearLines` text, and grows to fit its text. The month card's button reads `openDay` for tomorrow, or opens the year card first on a year end; the year card's button is `yearLines(…).button`. A new star and places 1–3 play `levelUp`.
- [ ] **Step 2: Chain it in `SpaScene`'s `dayEnded`.** `SummaryScene` keeps its button; on a judging evening (`rank.last?.day === sim.day`) `onNewDay` launches `RankScene` month instead of starting the day, then the year card when `rank.lastYear?.day === sim.day`, then the existing start-of-day steps. Only the last button plays `startOfDay`; the summary's plays `tap`. On closing: rewards float with `floatMoneyAt(TOP_BAR.moneyX + 120, 250, …)`; a new star queues `rankUpToast` and calls `room.setRank`. A reload on the summary or a card shows the same cards from the saved results and pays nothing.
- [ ] **Step 3: Draw the plaque** in `RoomView` as the sketch's `plaque`: a wooden board with five star slots, the first `stars` gold, centred at tile (4.3, 17.5) on floor 1, visible only on floor 1, depth by its bottom like the rival sign. `SpaScene` calls `setRank(sim.rank.stars)` on create.
- [ ] **Step 4: Run** `npx tsc --noEmit` and `npx vitest run`. Expected: no errors, all PASS.
- [ ] **Step 5: Commit** "Show the month's grade and the Spa của năm after the summary, and hang the grade by the door".

### Task 8: Browser check and ship

- [ ] **Step 1:** Build a dev preview (`NODE_ENV=development npx vite build --outDir .superpowers/dist-dev`, `vite preview --outDir .superpowers/dist-dev`) and drive it with `window.__spa` at iPhone width (1080×2160 game):
  - a shop on day 9 closed with a month worth 3 stars: summary → month card "Lên 2 sao!" → plaque shows 2 stars → next day a shampoo pays 42.000 đ;
  - reload on the month card: the same card, the money unchanged;
  - the Hạng tiệm tab on day 13 with a 20-letter shop name; the year card on day 36 for places 1, 2 and 4;
  - Review Focus 5 texts fit.
- [ ] **Step 2:** Whole-branch review, fix what it finds, `npx vitest run` green, then merge to master, push, and record the ship in memory.
