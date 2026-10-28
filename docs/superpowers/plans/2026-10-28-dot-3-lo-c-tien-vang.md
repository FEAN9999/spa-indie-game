# Lô C: tiền khi vắng (save v21) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A shop whose staff served every customer on its last finished day earns money while the game is closed or the phone is locked. Each hour away pays 1/4 of the recent average day profit, for at most 8 hours. A "Chủ tiệm về rồi" card shows the money on return. Save version 21.

**Architecture:**
- A pure `src/sim/away.ts` holds the `AwayBook` (the last 3 day profits, whether the last day qualified, whether the tip was shown) and the pay rule.
- `SpaSim` closes each day into the book and pays on `comeBack(ms)`. The sim never reads the real clock.
- `SaveSession` stamps `savedAt` (real time) on every write. `SpaScene` measures the time away in two places: on open, from the save's `savedAt`; on returning to a page that was not reloaded, from when the page was hidden. It then shows `AwayScene` or a one-time tip card.

**Tech Stack:** Phaser 4, TypeScript, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-3-hang-ao-vang-design.md`. Lô C covers §5 (the bans), §7.6, §7.7, §8.3, §8.4 (v21), §9 and §10 (the `AWAY_*` numbers).

## Global Constraints

- **Numbers** (`src/config.ts`):
  - `AWAY_MIN_MS = 10 * 60_000`
  - `AWAY_MAX_HOURS = 8`
  - `AWAY_DAY_SHARE = 0.25`
  - `AWAY_PROFIT_DAYS = 3`
- **When a day qualifies** (decided when the day ends):
  - The owner served no customer other than VIPs and Mi Mi (`stats.ownerServed === 0`).
  - The staff served at least 1 customer that day.
  - Walk-outs do not disqualify a day; they only lower its profit.
- **Pay** = `roundTo1000(min(AWAY_MAX_HOURS, ms / 3_600_000) × AWAY_DAY_SHARE × max(0, mean(profits)))`.
  - It is 0 when the last day did not qualify, when there are no profits yet, when `ms < AWAY_MIN_MS`, or when `ms` is negative (the clock went back).
  - Each day's profit is `dayProfit(stats)`, the summary's "Lãi" line, for the last `AWAY_PROFIT_DAYS` finished days, festival and hot days included. With 1–2 days, the mean is over those.
- **Money only.** The pay goes into `money`. It never goes into `stats`, `progress` (the quest counters, earned, best profit), quests or the summary.
  - The Triệu đầu badge reads live money, so the pay counts toward it.
  - Nothing else moves while away: the day, the time of day, customers, quests, stock, wages and staff stamina stay as they were.
- **Never paid twice:**
  - Paying saves at once, so `savedAt` becomes now.
  - A reload, an update or an import right after pays nothing.
  - An import stamps `savedAt` as the moment of import.
  - Switching to another slot pays that shop for the time nobody had it open, at most 8 hours, if that shop qualifies.
- **The tip** is shown once per shop, ever (`tipSeen`). It shows when all of these hold:
  - the time away is at least `AWAY_MIN_MS`;
  - the pay is 0 because the last day did not qualify (not because of a profit at or below 0);
  - `day >= UNLOCK_DAY.staff` (3).
- **The card** shows only for a shop that has an owner (`profileDone`). On open, it comes before the pause card. It plays `levelUp`.
- **Save v21:**
  - Adds `away` (`{ profits: [], ok: false, tipSeen: false }`), `savedAt` (`null`) and `stats.ownerServed` (`0`).
  - The first open after the update pays nothing.
- **No randomness.** `same-draws.test.ts` is unchanged.
- **Text** never overflows or overlaps at iPhone width.
- **Copy, verbatim from the spec and sketch:**
  - "Chủ tiệm về rồi"
  - "Vắng {time}", e.g. "Vắng 5 giờ 20 phút"
  - "Nhân viên kiếm được"
  - "+{money}", e.g. "+1.333.000 đ" (via `formatMoney`)
  - "Mỗi giờ vắng bằng 1/4 lãi một ngày (lãi trung bình 3 ngày gần nhất: {money})."
  - "Vắng hơn 8 giờ thì vẫn tính 8 giờ."
  - "Lịch, giờ trong ngày, nhiệm vụ và kho vẫn như lúc tắt game."
  - "Nhận tiền"
  - tip: "Mẹo · tiền khi vắng" / "Tắt game mà tiền vẫn vào" / "Ngày nào nhân viên làm hết khách (khách VIP thì chủ tiệm làm), tắt game tiền vẫn vào."

## Plan Calls (mine, at planning)

- **`SpaSim.comeBack(ms)` decides both the pay and the tip,** so all the rules are tested in the sim. The view only measures `ms` and shows the result.
- **The staff's count for the day** is `progress.total.staff − progress.dayStart.staff`, which the sim already keeps. When `dayStart` is null (the one day an old shop began before counting), the count is 0, so that day does not qualify.
- **On return to a page that was not reloaded,** the sim pays at once and saves. The card then waits only behind a mini-game (`servingCustomerId`) or a running update check (`holding`).
  - Otherwise it opens at once on top of whatever is open: the pause card, a panel, the summary.
  - It puts `modal` back as it was when it closes.
  - The update check is skipped on a return that brought a card. It runs on the next return.
- **A second return while a card is waiting or open** queues a second card, so no pay goes unseen.
- **Time away:**
  - Under 1 hour: "{m} phút".
  - Under 1 day: "{h} giờ {m} phút", without the minutes when they are 0.
  - From 1 day: "{d} ngày {h} giờ", without the hours when they are 0.
  - Minutes are rounded down.
- **The rule line with fewer days:**
  - With 1 day, it reads "(lãi ngày gần nhất: {money})".
  - With 2 days, it reads "(lãi trung bình 2 ngày gần nhất: {money})".
  - The mean shown is rounded to 1.000 đ.
- **The tip** is a quiet gold card through `badgeQueue`, with the coins icon on a mustard disc. `GoldCard.icon` gains an optional `tint`, because the badge icon textures are white.
- **The two figures on the card:**
  - The receptionist on the left and a technician on the right.
  - A missing one is filled with another staff member, then the owner. Nobody appears twice.
  - In a shop with no staff at all, the owner stands alone on the left.

## Review Focus

1. **Paid twice.** Pay, then reload, update or import at once: no second pay. A save from the future (the clock moved back) pays nothing. Covered by T1 (sim, negative `ms`) and T2 (session stamps); checked in the T5 browser pass.
2. **Owner work that does or does not disqualify.**
   - The owner served one ordinary customer → no pay, and the tip if due.
   - The owner served only a VIP and Mi Mi, and the staff served 1 → pays.
   - Covered by T1.
3. **Return with a mini-game open,** or with the summary or the year card up. The card waits behind the mini-game and is never lost, and it never opens under anything. Checked in the T5 browser pass.
4. **A long absence** (3 days): the title reads "Vắng 3 ngày", the capped line shows, the pay is for 8 hours, and the card fits. Covered by T3 (text) and the T5 browser pass.
5. **An old v20 save opened for the first time:** no pay, no tip and no card, and the next close and open works normally. Covered by T1 (save) and the T5 browser pass.

---

### Task 1: Away rules, sim state and save v21

**Files:**
- Create: `src/sim/away.ts`, `tests/sim/away.test.ts`, `tests/fixtures/save-v20.json`
- Modify: `src/config.ts`, `src/sim/types.ts` (`DayStats.ownerServed`), `src/sim/spa.ts`, `src/sim/save.ts`, `tests/sim/save.test.ts`

**Interfaces:**
- Produces from `src/sim/away.ts`:
  - `interface AwayBook { profits: number[]; ok: boolean; tipSeen: boolean }`
  - `emptyAwayBook(): AwayBook`
  - `closeAwayDay(book: AwayBook, profit: number, ownerServed: number, staffServed: number): void`, which keeps the last `AWAY_PROFIT_DAYS` profits
  - `awayPay(book: AwayBook, ms: number): number`
  - `repairAway(x: unknown): AwayBook`
- Produces on `SpaSim`:
  - `away: AwayBook`
  - `comeBack(ms: number): AwayResult`, with `AwayResult = { paid: number; ms: number; profit: number; days: number; capped: boolean; tip: boolean }`.
    - `profit` is the mean used.
    - `days` is `profits.length`.
    - `capped` is `ms > AWAY_MAX_HOURS` hours.
    - `tip` is true only when this call shows the tip, and the call then sets `tipSeen`.
    - Export `AwayResult` from `away.ts`.
- `SaveData` gains `away: AwayBook` and `savedAt: number | null`. `DayStats` gains `ownerServed: number`.

- [ ] **Step 1: Freeze the v20 fixture before anything changes.** With the current code (v20), write `tests/fixtures/save-v20.json`: a day-29 shop like `save-v19.json`, with `ownerOutfit: 'teal'`. Generate it from the sim the way `save-v19.json` was made. It is never edited afterwards.
- [ ] **Step 2: Write the failing rule tests** in `tests/sim/away.test.ts`. Use `ok` with profits `[1_000_000, 1_000_000, 1_000_000]` unless a test says otherwise.
  - **Pay amounts:**
    - 5 h 20 min → 1_333_000.
    - 12 h → 2_000_000 (capped).
    - 9 min 59 s → 0.
    - −1 h → 0.
  - **Profits:**
    - `[-300_000, 100_000, 200_000]` → 0.
    - `[]` → 0.
    - `[400_000]` for 2 h → 200_000.
    - `[333_333]` for 1 h → 83_000 (rounded to 1.000).
  - **Not ok** → 0.
  - **`closeAwayDay`:**
    - It keeps only the last 3 profits.
    - `ok` follows `ownerServed === 0 && staffServed >= 1`: (0, 1) → true; (1, 5) → false; (0, 0) → false.
  - **`repairAway`:**
    - Junk → empty.
    - Profits with non-numbers lose those entries and keep the last 3.
    - `ok: 'yes'` → false.
- [ ] **Step 3: Write the failing sim tests** in the same file, using the helpers in `tests/sim/helpers.ts` as the other `spa-*.test.ts` files do.
  - **Counting `ownerServed`:**
    - It goes up when the owner completes an ordinary customer's service.
    - It does not go up for a VIP, for Mi Mi (`kol`), or for a technician's customer.
  - **Day end:** a day where only staff served pushes `dayProfit(stats)` and sets `ok`. A day with one owner-served ordinary customer sets `ok = false`.
  - **`comeBack(5h20m)` on a qualifying shop:**
    - It adds 1_333_000 to `money`.
    - `stats`, `progress.total` and `day` are unchanged.
    - It returns `days: 3, capped: false, tip: false`.
  - **The tip:**
    - On day 3, not ok, 1 h → `tip: true` the first time, false the second.
    - On day 2 → false.
    - On a qualifying shop with a negative mean → false.
  - **Reload:** `toSave`/`fromSave` keeps `away`. `fromSave` re-emitting `dayEnded` does not push a profit twice.
- [ ] **Step 4: Implement.**
  - **`away.ts`:** the numbers come from config; no strings.
  - **In `payFor`:** `ownerServed++` when `technician === null && !c.vip && !c.kol`.
  - **At day end,** right after `recordDay`: `closeAwayDay(this.away, dayProfit(this.stats), this.stats.ownerServed, staffToday)`.
  - **`emptyStats`** gets `ownerServed: 0`.
- [ ] **Step 5: Implement save v21.**
  - `SAVE_VERSION = 21`, and `parseVersioned` also accepts 20.
  - In `parseSave`, after the outfits repair:
    - `data.away = repairAway(data.away)`;
    - `data.savedAt = isNumber(data.savedAt) ? data.savedAt : null`;
    - `stats.ownerServed` via `repairCount`.
  - `toSave()` writes `away` and `savedAt: null`; the session stamps the real value.
- [ ] **Step 6: Write the save tests** in `tests/sim/save.test.ts`:
  - `save-v20.json` parses with an empty away book, `savedAt: null` and `ownerServed: 0`, and keeps `ownerOutfit: 'teal'`.
  - Add v20 to the every-version list.
  - `savedAt: 'x'` → null.
  - A v21 round-trip keeps `savedAt`.
- [ ] **Step 7:** `npx tsc --noEmit` and `npx vitest run` are green; `same-draws.test.ts` is unchanged.
- [ ] **Step 8: Commit:** "Pay a shop whose staff did the work for the time it was closed, from the last three days' profit (save version 21)"

### Task 2: The session stamps the real time

**Files:**
- Modify: `src/save/session.ts`, `tests/save/session.test.ts`

**Interfaces:**
- Consumes `SaveData.savedAt` from Task 1.
- Produces:
  - `new SaveSession(store, current, reload, now = () => Date.now())`;
  - `get open(): boolean`, which is false once the session has closed.

- [ ] **Step 1: Write the failing tests,** with a fake `now` that returns 1000, then 2000.
  - `saveNow` stores `savedAt: 1000` whatever `current()` returned.
  - `switchTo(2)` stamps the shop it leaves.
  - `reloadForUpdate` stamps.
  - `replaceWith(data with savedAt: 5)` stores the import moment, not 5.
  - `open` is true before `reloadIfChangedElsewhere` finds a change and false after.
- [ ] **Step 2: Implement.** One private stamp step used by `write()` and `replaceWith`.
- [ ] **Step 3:** `tsc` and `vitest` are green.
- [ ] **Step 4: Commit:** "Stamp each save with the real time, an imported one with the moment it came in"

### Task 3: Texts and the "Chủ tiệm về rồi" card

**Files:**
- Create: `src/view/away.ts`, `tests/view/away.test.ts`, `src/scenes/AwayScene.ts`
- Modify: `src/strings/vi.ts`, `src/main.ts`, `src/view/festivals.ts` (`GoldCard.icon.tint`), `src/scenes/SpaScene.ts` (`showCard` applies the tint)

**Interfaces:**
- Consumes `AwayResult` from Task 1.
- Produces from `src/view/away.ts`:
  - `awayTime(ms: number): string` (the time-away rule in Plan Calls);
  - `awayLines(r: AwayResult): string[]`: the rule line, the capped line when `r.capped`, then the "still" line;
  - `awayTip(): GoldCard`.
- Produces `AwayData { sim: SpaSim; back: AwayResult; onDone: () => void }` and `AwayScene` (key `'AwayScene'`).

- [ ] **Step 1: Write the failing text tests:**
  - **`awayTime`:**
    - 5h20m → "5 giờ 20 phút".
    - 3 h → "3 giờ".
    - 25 min 59 s → "25 phút".
    - 3 days 2 h 10 min → "3 ngày 2 giờ".
    - 2 days → "2 ngày".
  - **`awayLines`:**
    - 3 days, mean 1_000_000 → exactly the spec's rule line and the "still" line.
    - With `capped` → the capped line between them.
    - With 1 day → "(lãi ngày gần nhất: …)".
    - With a mean of 333_333 → "333.000 đ".
  - **`awayTip()`:** the tip's three strings.
- [ ] **Step 2: Implement** the strings. Fill the "8 giờ" from `AWAY_MAX_HOURS` and the day count from `r.days`; keep "1/4" literal.
- [ ] **Step 3: Build `AwayScene`** after the sketch's `awayCard` (scratchpad `sketch/phac-thao-hang-ao.html` line 895; picture `sketch/h-away.png`):
  - dim the screen;
  - a paper card at x 90, y 330, w 900, its height grown to the text: `y + 200 − 330`;
  - kicker y 410, 34 px, terracotta;
  - title y 480, 60 px;
  - a sand ellipse at (540, 800), rx 300, ry 46;
  - the two figures at (400, 800) and (680, 800), scale 2.3, with `staffColors` for staff and `ownerColors` for the owner;
  - a mustard disc r 58 at (540, 690) holding `badge-coins` tinted ink;
  - "Nhân viên kiếm được" at y 900, 36 px, soft;
  - the amount at y 975, 72 px, `mustardDark`;
  - the lines from y 1080, 31 px, wrapped at 740, each paragraph followed by 14 px;
  - "Nhận tiền", 560 × 130, at `y + 80`;
  - `levelUp` on open;
  - the button calls `this.scene.stop()` first, then `onDone`.
- [ ] **Step 4: Gold card tint.** In `showCard`, `icon.tint`, when set, tints the picture.
- [ ] **Step 5:** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 6: Commit:** "Add the welcome-back card and the away texts"

### Task 4: Wiring in SpaScene

**Files:**
- Modify: `src/scenes/SpaScene.ts`

**Interfaces:**
- Consumes `sim.comeBack`, `session.open`, `AwayScene`/`AwayData`, `awayTip()`, and `saved.savedAt`.

- [ ] **Step 1: On open.**
  - In `create()`'s last branch (a saved shop with an owner), call `back = this.sim.comeBack(saved.savedAt === null ? 0 : Date.now() − saved.savedAt)`.
  - When `back.paid > 0`:
    - `saveNow()`;
    - set `modal`;
    - launch `AwayScene`.
    - Its `onDone`: float the money at `(TOP_BAR.moneyX + 120, 250)`, put `modal` back, then `if (!this.sim.dayOver) this.pause()`.
  - Otherwise:
    - when `back.tip`, push `awayTip()` onto `badgeQueue` and `saveNow()`;
    - then pause as today.
- [ ] **Step 2: On return without a reload.**
  - `saveOnHide` also records `hiddenAt = Date.now()`.
  - The `onReturn` callback runs, in order:
    1. `reloadIfChangedElsewhere()`;
    2. when `session.open` and `sim.profileDone`, `comeBack(Date.now() − hiddenAt)`, then clear `hiddenAt`;
    3. a pay saves at once and joins a small queue of held results;
    4. a tip goes onto `badgeQueue` and saves;
    5. `checkForUpdate()` runs only when nothing was paid.
  - In `update()`, show the next held result when `servingCustomerId === null && !holding && !this.awayOpen`. Remember `modal` before setting it, and put that value back in `onDone`.
- [ ] **Step 3:** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 4: Commit:** "Welcome the owner back with the staff's earnings on open and on return, and tell the tip once"

### Task 5: Browser check and ship

- [ ] **Step 1: Run a dev preview at iPhone width,** with inject saves made from `save-v20.json` by a scratch script. Check:
  1. A qualifying shop saved 5 h 20 min ago: on open, the card comes before the pause card, with the right amount and lines. "Nhận tiền" floats the money, then the pause card shows. A reload pays nothing.
  2. Saved 3 days ago: "Vắng 3 ngày", the capped line, 8 hours' pay, and the card fits.
  3. Not qualifying, day 5, saved 1 h ago: no card, and the tip card after "Chơi tiếp". A second reload with the clock moved on gives no tip.
  4. A return without a reload, with `hiddenAt` set back 2 h and `visibilityState` faked:
     - over the pause card: the card shows on top, and the pause card is still there after "Nhận tiền";
     - during a mini-game: the card waits until the mini-game ends.
  5. A day-36 shop saved after the summary (`dayOver`): the card first, then the summary.
  6. An old v20 save: nothing on first open.
- [ ] **Step 2: Ship.**
  - Run the whole-branch review and fix what it finds. `npx vitest run` must be green.
  - Fetch, and check that `origin/master` is still an ancestor and that the branch holds only this lô's commits.
  - Fast-forward master, push, and record the ship in memory.
