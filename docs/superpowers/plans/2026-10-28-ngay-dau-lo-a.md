# Ngày đầu lô A: chuỗi mục tiêu khởi nghiệp (save v22) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new shop runs an 11-goal starter chain. The chain shows on a strip above the bottom bar, pays small rewards, opens Build, Services and Staff early, and gifts the mask service and a mask bed. Chú Sáu opens the shop on day 1 and comes back on day 2. The summary teases tomorrow and shows records. Old saves are untouched.

**Architecture:**
- A pure `src/sim/starter.ts` holds the goal table and the `StarterBook`, plus `settleStarter`, which finishes goals in order from a `StarterShop` snapshot.
- `SpaSim` owns one book and settles it right where things happen: `count()`, `buy`, `placeGift`, `hire` and `openService`. It answers `featureOpen(f)` for every button, and it emits `goalDone`.
- The view reads only the sim: the goal line, the gold card, the summary notes and the locked toast live in a new `src/view/starter.ts`, and the chain list lives in a new `StarterScene`.

**Tech Stack:** Phaser 4, TypeScript, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-ngay-dau-design.md`. Lô A covers §2, §4.1–§4.4, §4.6, §4.7, §5–§8. The generous tip in §4.5 is lô B.

## Global Constraints

- **Goals, in order**:
  - `firstGuest`: served ≥ 1, 20.000 đ.
  - `threeStars`: owner3 ≥ 1, 30.000 đ.
  - `serveFew`: served ≥ 4, 30.000 đ, opens `build`.
  - `buyDecor`: bought ≥ 1, 40.000 đ.
  - `serveMore`: served ≥ 10. Reward is the mask gift. Opens `services`.
  - `placeMaskBed`: a `maskBed` item placed, 30.000 đ.
  - `maskTwice`: mask served ≥ 2, 50.000 đ.
  - `serveMany`: served ≥ 16, 50.000 đ, opens `staff`.
  - `hireTech`: a technician on staff, 50.000 đ.
  - `openMassage`: massage opened, 100.000 đ.
  - `massageTwice`: massage served ≥ 2, 100.000 đ.

  All of these numbers live in `src/config.ts`.
- **"served", "owner3" and "services[x]" are the running `progress.total` counts.** "bought" is the number of `decor` or `seat` purchases made through `buy` while the chain runs. Starting furniture never counts.
- **The mask gift:**
  - If mask is not open, open it for free. If the player already paid for it, give 200.000 đ (`SERVICE_OPEN_COST.mask`) instead.
  - Either way, push `'maskBed'` onto `book.gifts`.
  - The next plain arrival (not a regular, VIP or Mi Mi) once a mask bed exists asks for mask, once only.
- **Rewards** go into `money` and `stats.quests`, so the summary shows them under "Thưởng nhiệm vụ". A goal reached earlier finishes at once when its turn comes. Never pay a goal twice, across saves or reloads.
- **Feature deadlines:**
  - `build`, `services` and `staff` open at a goal **or** at `UNLOCK_DAY`, whichever comes first.
  - `stock` and `floors` stay on their day.
  - The daily quest system (`questsOpen()`: daily, monthly, badges and their banners, outfits, the Badges and Rank tabs) opens on `UNLOCK_DAY.quests` or on the day after the last goal, whichever comes first.
  - The Nhiệm vụ button opens from day 1 for a chain shop.
  - A button that has opened never locks again.
- **Chú Sáu:**
  - The first autospawned arrival of a chain shop whose Chú Sáu is unmet is `{ regular: 'sau' }`.
  - On day 2, a met Chú Sáu gets a `visitAt` between `REGULAR_VISIT_FROM_MIN` and `REGULAR_VISIT_TO_MIN`, drawn from `createRng(day * 3301 + nextId)`.
  - From day 7, `planDay` schedules only the unmet `SCHEDULED` regulars, `REGULAR_MEET_GAP_DAYS` apart: hanh 7, vy 9, khoa 11, tu 13, ba 15.
- **A new shop runs the chain only when built with `new SpaSim({ rng, starter: true })`** (only `SpaScene.openShop`). The default and every old save mean the chain has already passed: there is no strip, no card and no money, and everything opens by day exactly as today. This keeps the 77 existing test constructions and `same-draws.test.ts` unchanged.
- **Save v22:**
  - Adds `starter` (missing or broken means past) and `progress.life.record` (missing means `null`).
  - Freeze `tests/fixtures/save-v21.json` before bumping.
  - If `dot-4-chuoi` lands first with v22, this lot becomes v23 at merge (see Task 9).
- **Records:**
  - Set at the day's close when the old best is > 0: served > old `bestServed` gives `served`, else profit > old `bestProfit` gives `profit`.
  - Stored as `progress.life.record = { day, kind }`.
  - Applies to old saves too.
- **Copy (vi.ts):**
  - Goal names:
    - "Gội đầu cho Chú Sáu"
    - "Được 3 sao một lần"
    - "Phục vụ 4 khách"
    - "Mua một món trang trí"
    - "Phục vụ 10 khách"
    - "Đặt giường mặt nạ vào tiệm"
    - "Đắp mặt nạ cho 2 khách"
    - "Phục vụ 16 khách"
    - "Thuê một thợ"
    - "Mở dịch vụ Massage"
    - "Massage cho 2 khách"
  - Other copy:
    - "Xong mục tiêu"
    - "Mở nút {name}"
    - "Mở khi xong: {goal}"
    - "Mục tiêu: {goal} ({have}/{need})"
    - "Ngày mai Chú Sáu ghé lại"
    - "Ngày mai mở {name}"
    - "Từ mai có nhiệm vụ mỗi ngày"
    - "Kỷ lục mới: {n} khách!"
    - "Kỷ lục lãi: {money}!"
    - "Quà khai trương: mở Đắp mặt nạ, tặng 1 giường mặt nạ"
    - "Khởi nghiệp · đã xong {done}/{total}"
    - "Đặt giường mặt nạ ở đây"
  - One story line per goal that opens a button:
    - build: "Có tiền rồi thì sắm đồ cho tiệm đẹp hơn!"
    - services: "Tiệm đông rồi, làm thêm món mới cho khách chọn thôi!"
    - staff: "Tiệm đông rồi, thuê người phụ thôi!"
- **Text** never overflows at iPhone width.

## Review Focus

1. **A shop saved mid-chain and reopened** keeps its goal, pays nothing again and shows no card again. Test in Task 3.
2. **A chain shop that reaches a deadline day before the goal** has the button open with no hand pointing twice, and the goal that would open it still pays when done. Test in Task 3.
3. **A player who pays for mask before goal 5** gets the bed plus 200k, never a second mask opening. Test in Task 3.
4. **A shop that finishes the chain on day D** gets daily quests on D+1, not D, and no flood of badge banners from badges earned silently. Test in Task 4.
5. **The goal strip** hides while a toast or a panel is up and yields to an event or festival line. Test in Task 6.

---

### Task 1: The goal table and book (pure)

**Files:**
- Create: `src/sim/starter.ts`
- Modify: `src/config.ts` (append `STARTER_NEED`, `STARTER_REWARD`)
- Test: `tests/sim/starter.test.ts`

**Interfaces:**
- Produces:
  - `STARTER_GOAL_IDS` (readonly tuple in table order)
  - `type StarterGoalId`
  - `type StarterFeature = 'build' | 'services' | 'staff'`
  - `STARTER_OPENS: Partial<Record<StarterGoalId, StarterFeature>>`
  - `interface StarterShop { served; owner3; bought; maskBedPlaced: boolean; maskServed; technicians; massageOpen: boolean; massageServed }`
  - `interface StarterBook { at: number; doneDay: number | null; bought: number; opened: Partial<Record<StarterFeature, number>>; maskNext: boolean }`
  - `newStarter(): StarterBook` (at 0)
  - `pastStarter(): StarterBook` (at = length, doneDay null)
  - `isPast(b): boolean` (at = length and doneDay null)
  - `starterRunning(b): boolean`
  - `currentGoal(b): StarterGoalId | null`
  - `goalProgress(id, shop): { have: number; need: number }` (have capped at need; booleans as 0/1)
  - `settleStarter(b, shop, day): StarterGoalId[]`: finishes in order every reached goal from `at`, stamps `opened[f] = day` for goals that open f (keeping an earlier stamp), and sets `doneDay = day` when the last one finishes.
  - `repairStarter(x: unknown): StarterBook`: anything not a valid book gives `pastStarter()`.

- [ ] **Step 1: Write the failing tests**
  - `settles nothing for a fresh book and a fresh shop`
  - `finishes firstGuest then threeStars from one snapshot, in order, and stops at serveFew` (served 1, owner3 1, so it returns `['firstGuest','threeStars']` and `at === 2`)
  - `stamps build opened on the day serveFew finishes, and keeps an earlier stamp`
  - `sets doneDay when massageTwice finishes`
  - `goalProgress caps have at need and reads booleans as 0/1`
  - `repairStarter keeps a valid book and turns junk, out-of-range at or a missing book into pastStarter()`
  - `isPast is true only for pastStarter()`
- [ ] **Step 2:** Run `npx vitest run tests/sim/starter.test.ts`. Expected: FAIL, module missing.
- [ ] **Step 3:** Implement the table from Global Constraints. `STARTER_NEED` and `STARTER_REWARD` go in config (`serveMore` reward 0).
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: "Add the starter chain's goal table and book".

### Task 2: Gifts sit in their own tab, and `planDay` schedules only the unmet

**Files:**
- Modify: `src/view/catalog.ts:17-19`, `src/scenes/BuildScene.ts:133`, `src/sim/regulars.ts:89-93`
- Test: `tests/view/catalog.test.ts`, `tests/sim/regulars.test.ts`

- [ ] **Step 1: Failing tests**
  - `a gift bed is listed first in the bed tab, not the decor tab`: `catalogPage('bed', 0, ['shampoo','mask'], ['maskBed'])` has `{kind:'maskBed', gift:true}` first, and `catalogPage('decor', …)` has no maskBed.
  - `a met Chú Sáu is left out of the day-7 schedule`: emptyBook, sau met, `planDay(book, 7, rng)` gives meetDay hanh 7, vy 9, khoa 11, tu 13, ba 15, and sau.meetDay stays null.
  - Existing regulars tests still pass unchanged.
- [ ] **Step 2:** Run both files. Expected: the new tests fail.
- [ ] **Step 3:** In `catalogPage`, gifts filter to `ITEMS[k].group === group`. `BuildScene` opens on the first gift's group. In `planDay`, `unmet = SCHEDULED.filter(id => !met)`, and the schedule runs only when every unmet one has `meetDay === null`.
- [ ] **Step 4:** Run `npx vitest run tests/view tests/sim/regulars.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 3: SpaSim runs the chain

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/crew.ts:440,452`, `src/sim/types.ts` (SimEvent), `src/sim/unlocks.ts`
- Test: `tests/sim/spa-starter.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces, on `SpaSim`:
  - `starter: StarterBook`
  - `SpaSimOptions.starter?: boolean`
  - `featureOpen(f: Feature): boolean`
  - `opensToday(f: Feature): boolean`: the day it reached `UNLOCK_DAY`, or the day a goal opened it. For quests, also `doneDay + 1`.
  - `questsButtonOpen(): boolean`: `questsOpen() || !isPast(starter)`
  - `starterShop(): StarterShop`
  - event `{ type: 'goalDone'; goal: StarterGoalId; reward: number; opens: StarterFeature | null }`, where reward includes a mask refund

  `questsOpen()` becomes `isUnlocked('quests', day) || (doneDay !== null && day > doneDay)`.

- [ ] **Step 1: Failing tests**, each with `new SpaSim({ rng: createRng(5), starter: true })` and `autoSpawn` where noted:
  - `the first arrival of a chain shop is Chú Sáu` (autoSpawn, advance to the first `customerArrived`, `regular === 'sau'`).
  - `a plain shop's first arrival is a stranger` (default options).
  - `serving one customer finishes firstGuest: +20.000 đ into money and stats.quests, one goalDone event`.
  - `four served opens build on day 1, and opensToday('build') is true`.
  - `buying a plant finishes buyDecor; moving one does not count`.
  - `ten served opens mask free, gives a maskBed gift and opens services`.
  - `with mask already paid for, serveMore pays 200.000 đ and the bed, and services stays one mask`.
  - `after the gift, the next plain arrival with a mask bed asks for mask, the one after draws as usual` (autoSpawn).
  - `placing the gift bed finishes placeMaskBed at once when its turn comes`.
  - `serveMany opens staff and fills today's candidates at once`.
  - `day 2 opens build by its deadline though serveFew is not done; serveFew still pays later`.
  - `a reload after a goal pays nothing again and emits no goalDone` (`viaJson` round trip, then drain).
  - `a plain shop never emits goalDone and opens build on day 2, staff on day 3`.
  - `day 2 brings a met Chú Sáu between 9:00 and 17:00`.
  - `the away tip waits for staff to open, by goal or by day` (`comeBack` tip).
- [ ] **Step 2:** Run `npx vitest run tests/sim/spa-starter.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Settle via `private advanceStarter()`, called at the end of `count()`, `buy`, `placeGift`, `hire` and `openService`. It pays, applies the mask gift, calls `refreshCandidates(this.crew)` when staff opens and `candidatesDay !== day`, and emits.
  - `buy` bumps `starter.bought` for `decor`/`seat` while the chain runs.
  - In the arrival branch of `step`, the Chú Sáu opening comes first, then a due regular, then the mask-next customer.
  - In `startDay`, apply the day-2 Chú Sáu visit.
  - Replace the direct `UNLOCK_DAY.staff` checks (away tip, crew ×2) with `featureOpen('staff')`. `floorProblem` and `stockTracked` stay.
- [ ] **Step 4:** Run `npx vitest run`. Expected: all pass, `same-draws` included.
- [ ] **Step 5:** Commit.

### Task 4: Save v22, records and the quest switch-over

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/quests.ts` (`Life.record`, `recordDay(p, stats, busy, day)`), `src/sim/spa.ts` (toSave/fromSave, the `recordDay` call)
- Create: `tests/fixtures/save-v21.json` (written by the current code before the bump)
- Test: `tests/sim/save.test.ts`, `tests/sim/quests.test.ts`, `tests/sim/spa-starter.test.ts`

- [ ] **Step 1:** Freeze the fixture. A throwaway test writes `JSON.stringify(sim.toSave())` of a mid-game shop (day 3, a technician, some served) to `tests/fixtures/save-v21.json`. Delete the throwaway.
- [ ] **Step 2: Failing tests**
  - `a v21 save opens with the chain past, nothing paid and no goalDone`.
  - `a chain shop mid-chain round-trips its book exactly`.
  - `recordDay marks a served record over an old best, a profit record otherwise, and none on the first day`.
  - `a v21 save's life gains record null`.
  - `finishing the chain on day D opens daily quests on D+1, not D, with no badge event on D+1 for badges reached during the chain`.
  - `during the chain no badge event is emitted and newOutfits() is empty`.
- [ ] **Step 3:** Run them. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - `SAVE_VERSION = 22`, accept `raw.v === 21`.
  - `data.starter = repairStarter(data.starter)`.
  - `repairProgress` keeps a valid `life.record`, else `null`.
  - Bump the version pins in tests that pin 21.
- [ ] **Step 5:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 6:** Commit.

### Task 5: Hints and the locked toast

**Files:**
- Modify: `src/sim/tutorial.ts`, `src/sim/types.ts` (`HINT_IDS` += `'openStarter'`), `src/view/Hud.ts`, `src/scenes/SpaScene.ts` (offerBed, updatePointer `placeGift`), `src/strings/vi.ts`
- Create: `src/view/starter.ts` (`lockedText(sim, f): string`)
- Test: `tests/sim/tutorial.test.ts`, `tests/view/starter.test.ts`

- [ ] **Step 1: Failing tests**
  - `the build hand shows on the day a goal opens build, and again on day 2 if still unopened`.
  - `the quests hand shows on the first day of daily quests, never during the chain`.
  - `placeGift points at Build while placeMaskBed is current and the gift waits`.
  - `lockedText names the goal that opens a locked button in a chain shop, and the day in a plain shop`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `pickHint` uses `sim.opensToday(f)`, and adds `{ hint: 'placeGift' }` after the book hint.
  - Hud plates use `featureOpen` / `questsButtonOpen`. The quests plate's "Mới" reads `openStarter` while `!questsOpen()`.
  - The toast uses `lockedText`.
  - `offerBed` uses `featureOpen('build')`.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 6: The goal strip and the gold card

**Files:**
- Modify: `src/view/starter.ts` (`goalLine(sim): TodayLine | null`, `goalCard(e): GoldCard`), `src/view/today.ts`, `src/view/Hud.ts` (hide the today line while a toast is up), `src/art/fx.ts` (`icon-flag`), `src/scenes/SpaScene.ts` (`goalDone` → `floatMoneyAt` + `badgeQueue.push(goalCard(e))`), `src/strings/vi.ts`
- Test: `tests/view/starter.test.ts`, `tests/view/today.test.ts`

- [ ] **Step 1: Failing tests**
  - `goalLine shows "Phục vụ 4 khách · 2/4", no count when need is 1, and null for a past or finished chain`.
  - `todayLine prefers an event, a festival or a hot day over the goal line`.
  - `goalCard for serveFew reads "Xong mục tiêu" / "Phục vụ 4 khách" / "+30.000 đ · Mở nút Xây dựng. Có tiền rồi thì sắm đồ cho tiệm đẹp hơn!"`.
  - `goalCard for serveMore names the mask gift and the Dịch vụ button`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. `Hud.updateToday` treats `scene.time.now < lastToastAt + 2000` as covered.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 7: The chain list (StarterScene) and the Nhiệm vụ button

**Files:**
- Create: `src/scenes/StarterScene.ts`
- Modify: `src/main.ts` (register), `src/scenes/SpaScene.ts` (`onQuests`: `questsOpen()` → QuestsScene, else StarterScene, marking `openStarter`), `src/view/starter.ts` (`chainRows(sim)`)
- Test: `tests/view/starter.test.ts`

- [ ] **Step 1: Failing test:** `chainRows marks done, current with have/need, and later rows with what they open`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement. The card follows `GuestBookScene` (paper card, title "Nhiệm vụ", subtitle "Khởi nghiệp · đã xong {done}/{total}", 11 rows, footer "Từ mai có nhiệm vụ mỗi ngày" once done, "Xong" button), laid out like sketch board 3.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 8: Summary notes, and a new shop runs the chain

**Files:**
- Modify: `src/view/starter.ts` (`starterNotes(sim): { text: string; booking: boolean }[]`), `src/scenes/SummaryScene.ts:53`, `src/scenes/SpaScene.ts:354` (`starter: true`)
- Test: `tests/view/starter.test.ts`

- [ ] **Step 1: Failing tests**
  - `day 1 of a chain shop with Chú Sáu met: goal line, then "Ngày mai Chú Sáu ghé lại"`.
  - `the eve of a deadline says "Ngày mai mở Nhân viên"`.
  - `the day the chain finishes says "Từ mai có nhiệm vụ mỗi ngày"`.
  - `a record day says "Kỷ lục mới: 9 khách!", or "Kỷ lục lãi: …" for profit`.
  - `a plain shop gets only the record line`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. Notes go before `summaryNotes(...)`. Tomorrow lines are teal (`booking: true`).
- [ ] **Step 4:** Run `npx vitest run` and `npm run build`. Expected: PASS, and a clean build.
- [ ] **Step 5:** Commit.

### Task 9: Browser check, merge and ship

- [ ] **Step 1:** In the worktree, `npm run dev`. On a fresh slot at iPhone size (390×844), play day 1 to day 3:
  - Chú Sáu comes first, with his line.
  - The strip counts up.
  - Cards come one at a time, never during a mini-game.
  - The Build hand comes after `serveFew`.
  - The plant pays 40k.
  - The summary has the goal line and the Chú Sáu line.
  - Day 2: Chú Sáu returns, the mask card, the bed in the bed tab, the first mask customer.
  - Day 3: Staff opens.

  Then load an existing shop: no strip, no cards.
- [ ] **Step 2:** `git fetch`, then check `origin/master` and `dot-4-chuoi`.
  - If v22 is already taken on master, renumber to the next free version and freeze that fixture.
  - Integrate in a temp worktree if master moved, and rerun `npx vitest run` and `npm run build`.
- [ ] **Step 3:** Merge to master, `git push origin HEAD:master`, then report.
