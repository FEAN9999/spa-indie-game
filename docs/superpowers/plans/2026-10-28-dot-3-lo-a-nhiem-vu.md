# Đợt 3 Phần 1 Lô A: Lịch tháng và Nhiệm vụ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The top bar shows the in-game month. From day 8 the Nhiệm vụ button opens a panel with three daily quests and one monthly quest, drawn to fit the shop. Finished quests pay at once with a toast. Save v15 keeps the progress, and old shops get quests sized to the time left.

**Architecture:**
- **Counting.** The sim counts as things happen. `Progress.total` holds running counts that are never reset.
  - Each quest stores `base`, the count when it was given. Its progress is `count − base`.
  - So a swap, a mid-day load or a mid-month unlock all count from the moment the quest was given, with no separate day or month counters.
  - `dayStart`, a copy of `total` at the start of the day, turns the day into a record of the last 3 days. Targets come from those records.
- **Pure rules.** The rules live in a new pure module, `src/sim/quests.ts`: pools, targets, rewards, rolls, settling and the day record. `SpaSim` owns one `progress` block. It calls the module at:
  - `payFor`, `loseCustomer`, `seatCustomer` and `study` (counting);
  - the day-end branch of `step` (closing);
  - `startDay` (rolling);
  - `fromSave` (catching up an old shop).
- **Own random stream.** Rolls and swaps draw from a stream of their own, so the shop's draws stay as they were.
- **View.** A new `QuestsScene` panel, modelled on `GuestBookScene`. The view only reads the sim and calls `swapQuest`. It never counts or pays.

**Tech Stack:** TypeScript, Phaser ^4.2.1 (view only), Vite ^8.3, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-3-nhiem-vu-design.md`, Lô A (§9), approved 2026-10-28. Rules in §5, §7.1–7.6 and §8; numbers in §10; builder calls in §11.

**Branch:** `dot-3-nhiem-vu-a` in worktree `.superpowers/worktrees/dot-3-nhiem-vu-a`, cut from master after the plan commit. Task 0 (fixtures) is done there first, before any code change.

## Global Constraints

- **Layering:** `src/sim/**` never imports Phaser, `src/view/**`, `src/scenes/**`, `src/art/**` or `src/audio/**`.
- **Text:** all player-facing text lives in `src/strings/vi.ts`, in Vietnamese with full diacritics, copied exactly from the spec as listed in Tasks 1, 6 and 7. Money is shown with `formatMoney`.
- **Numbers (`src/config.ts`), exactly:**
  - Calendar: `DAYS_PER_MONTH = 3`, `MONTHS_PER_YEAR = 12`, `UNLOCK_DAY.quests = 8`.
  - Quest counts: `QUESTS_PER_DAY = 3`, `QUEST_SWAPS_PER_DAY = 1`, `QUEST_RECENT_DAYS = 3`.
  - Targets: `QUEST_TARGET_SHARE = 0.8`.
  - Rewards: `QUEST_REWARD_SHARE = 0.05`, `QUEST_REWARD_MIN = 30_000`, `QUEST_HARD_FACTOR = 1.5`, `MONTH_QUEST_REWARD_FACTOR = 5`.
  - Late loads: `QUEST_MIN_LEFT_MIN = 120`.
  - Defaults with no finished day: `QUEST_DEFAULT_DAY = { served: 10, earned: 500_000, tips: 50_000, owner3: 3, staff: 4 }`.
  - Floors of the targets: `QUEST_FLOOR = { serve: 5, owner3Min: 2, owner3Max: 6, earn: 150_000, tips: 20_000, service: 2, staff: 3, monthOwner3: 4 }`.
  - Clean day: `CLEAN_DAY_MIN_SERVED = 15`.
- **Money rounding:** every quest money amount (money targets and rewards) goes through `roundMoney(x) = max(10_000, round(x / 10_000) × 10_000)`.
- **Own random stream:** quest rolls never call the shop's `rng`.
  - Rolls use `createRng(this.day * 4241 + this.nextId)`.
  - A swap uses `createRng(this.day * 4241 + this.nextId + 101)`.
- **The view never counts or settles.** The `dayEnded` handler in `SpaScene` is not given any quest logic.
- **Save:**
  - `SAVE_VERSION = 15`, and every v1–v14 fixture still opens.
  - A missing or damaged progress block is repaired field by field, never a `SaveError`.
  - Stairs clearing is keyed to saves before v14 (`STAIRS_SAVE_VERSION = 14`), not to "older than the current version".
- **No penalty, ever.** An unfinished quest is simply dropped, with no toast for a failed or dropped quest.
- **Commits:** plain English subject lines in the repo's style, no attribution lines. Never stage `CLAUDE.md`.

## Review Focus

1. **A v14 save with floor 2 open, loaded once `SAVE_VERSION` is 15.**
   - It must keep `floors: 2` and get no `clearStairs`.
   - Today `parseSave` flags every save older than the current version as pre-stairs.
   - Test in Task 4.
2. **One payment that finishes two quests at once** (serve and earn).
   - Both are paid, and two `questDone` events come out, daily ones first.
   - `money` and `stats.quests` each rise by the sum.
   - Test in Task 5.
3. **Gift money and quest rewards never count toward "Kiếm tiền"** (`total.earned`). Otherwise one reward could feed the next quest.
   - Test the gift in Task 2 and the reward in Task 5.
4. **A customer who loses patience after 20:00, while the shop is still emptying, fails "Không để khách nào bỏ về".**
   - Test in Task 5.
5. **Reloading a lô-A save mid-day keeps today's quests.**
   - No re-roll, the same `base`, progress and `swaps`, and no extra `questDone` on load.
   - Test in Task 5.

---

### Task 0: Fixtures from the untouched code (setup, before any code change)

**Files:**
- Create: `tests/fixtures/save-v14.json`, `tests/fixtures/run-before-quests.json`, `tests/sim/same-draws.test.ts`
- Modify: `tests/sim/helpers.ts`

**Interfaces:**
- Produces `runLog(days = 10): { day: number; arrivals: string[]; candidates: string[] }[]` in `tests/sim/helpers.ts`. Its doc comment says what it is for: checking that new rules leave the shop's draws alone.
  - Shop: `new SpaSim({ rng: createRng(2024) })`, with `profileDone = true` and one technician from `hireStaff(sim, 'technician')` on day 1.
  - Per day: loop `sim.advance(100)` and drain events until `sim.dayOver` (cap 400 000 ms). For each `customerArrived`, look the customer up at once and push `` `${c.id}:${c.kind}:${c.service}:${c.regular ?? ''}:${c.vip ?? ''}` ``.
  - Then call `sim.startDay()` and record `sim.candidates.map(c => `${c.name}:${c.role}`)`.

- [ ] **Step 1: Write `runLog`, and `same-draws.test.ts` with `expect(runLog()).toEqual(fixture)`.**
- [ ] **Step 2: Generate `run-before-quests.json`.** Use a throwaway vitest file that writes `JSON.stringify(runLog(), null, 2)`, then delete it. Run `npx vitest run tests/sim/same-draws.test.ts`. Expected: PASS.
- [ ] **Step 3: Generate `save-v14.json` with a throwaway vitest file, then delete it.** The shop:
  - `new SpaSim({ rng: createRng(14), autoSpawn: false })`, `profileDone = true`, `hints = [...TUTORIAL_HINTS]`, `day = 11`;
  - `money = 5_000_000`, then `openFloor(2)` returns null;
  - `hireStaff(sim, 'technician')`;
  - `clock.minutes = 660`, `stats.served = 6`, `money = 800_000`.

  Write `sim.toSave()` as 2-space JSON. Check: `v` 14, `floors` 2, `day` 11, `minutes` 660, one staff.
- [ ] **Step 4: Commit.** `git add tests/fixtures/save-v14.json tests/fixtures/run-before-quests.json tests/sim/helpers.ts tests/sim/same-draws.test.ts && git commit -m "Add a v14 save fixture and a ten-day draw log from before quests"`

### Task 1: The calendar, the numbers and the month in the top bar

**Files:**
- Create: `src/sim/calendar.ts`, `tests/sim/calendar.test.ts`
- Modify: `src/config.ts`, `src/view/Hud.ts`, `src/strings/vi.ts`

**Interfaces:**
- **Produces, `config.ts`:** every number in Global Constraints. Also `DAY_MINUTES = DAY_END_MIN − DAY_START_MIN` (720).
- **Produces, `calendar.ts`:** pure functions from §8.1:
  - `monthOf(day)`, `yearOf(day)`, `dayOfMonth(day)`;
  - `daysLeftInMonth(day) = DAYS_PER_MONTH − dayOfMonth(day) + 1`, which counts today;
  - `monthStart(day) = day − dayOfMonth(day) + 1`.
- **Produces, strings:** `monthLabel: 'Tháng {month}'`.

- [ ] **Step 1: Write the failing tests.**
  - `monthOf`: 1 → 1, 3 → 1, 4 → 2, 11 → 4, 36 → 12, 37 → 1.
  - `yearOf`: 36 → 1, 37 → 2.
  - `dayOfMonth`: 1 → 1, 3 → 3, 4 → 1.
  - `daysLeftInMonth`: 8 → 2, 9 → 1, 10 → 3.
  - `monthStart`: 8 → 7, 10 → 10.
- [ ] **Step 2: Run `npx vitest run tests/sim/calendar.test.ts`.** Expected: FAIL, because the module is missing.
- [ ] **Step 3: Implement `calendar.ts` and the config numbers.**
  - `Hud.update` sets `dayTime` to `` `${t('dayLabel', { day })} · ${t('monthLabel', { month: monthOf(day) })} · ${clock.label()}` ``.
  - `clockStar` keeps following the text's width.
- [ ] **Step 4: Run `npm test`.** Expected: all pass. Adding `quests` to `UNLOCK_DAY` changes nothing else yet.
- [ ] **Step 5: Commit.** `Show the in-game month in the top bar, three days to a month`

### Task 2: Counting in the sim

**Files:**
- Create: `src/sim/quests.ts` (types and counting only), `tests/sim/spa-counts.test.ts`
- Modify: `src/sim/types.ts`, `src/sim/spa.ts`, `src/sim/economy.ts`, `src/sim/save.ts` (one repair line), `src/view/summary.ts` (profit via `dayProfit`), and every `DayStats` literal in `tests/` (grep `gifts:`), each of which gains `quests: 0`

**Interfaces:**
- **Produces, `quests.ts`:**
  - `Counts { served, earned, tips, owner3, staff, lost, hearts, courses: number; services: Record<ServiceId, number> }`.
  - `zeroCounts(): Counts`.
  - `DayRecord { served, earned, tips, owner3, staff: number }`.
  - `Life { dailies, bestServed, bestProfit: number; cleanDay: boolean }`.
  - `Progress`:
    - `total: Counts`;
    - `dayStart: Counts | null`, which is null when today began before counting;
    - `recent: DayRecord[]`, newest last, at most 3;
    - `life: Life`;
    - `questDay: number` and `daily: Quest[]`;
    - `yesterday: QuestKind[]`;
    - `swaps: number`;
    - `monthFrom: number` and `monthly: Quest | null`;
    - `lastMonthKind: QuestKind | null`;
    - `seenDay: number`.
  - `emptyProgress(): Progress`, which has `dayStart: zeroCounts()` and zeros, nulls and empty lists elsewhere.
  - `recordDay(p: Progress, stats: DayStats): void`:
    - When `dayStart` is not null, it pushes `total − dayStart` (served, earned, tips, owner3, staff) and keeps the last `QUEST_RECENT_DAYS`.
    - It always updates `life`: `bestServed` from `stats.served`, `bestProfit` from `dayProfit(stats)`, and `cleanDay ||= stats.served >= CLEAN_DAY_MIN_SERVED && stats.angry + stats.walkedAway === 0`.
  - The `Quest` and `QuestKind` types are declared here too, and used from Task 3 on:
    - `QuestKind = 'serve' | 'owner3' | 'earn' | 'tips' | 'service' | 'staff' | 'noWalk' | 'heart' | 'study'`;
    - `Quest { kind; period: 'day' | 'month'; service: ServiceId | null; target; reward; base: number; state: 'open' | 'done' | 'failed' }`.
- **Produces, `DayStats`:** a new field `quests: number`, the quest money paid today.
- **Produces, `economy.ts`:** `dayProfit(s: DayStats) = income + tips + gifts + quests − wages − restock`.
- **Produces, `SpaSim`:** a public `progress: Progress = emptyProgress()`. Counts change as follows:
  - **`payFor`:**
    - `served += 1`, `earned += price + tip`, `tips += tip`, `services[c.service] += 1`;
    - `owner3 += 1` when `technician === null && stars === 3`;
    - `staff += 1` when `technician !== null`;
    - `hearts += 1` when `addVisit` returned a heart.
  - **`loseCustomer`, and `seatCustomer` with no seat:** `lost += 1`.
  - **`SpaSim.study`, when it returns null:** `courses += 1`.
  - **`startDay`:** sets `dayStart` to a copy of `total`.
  - **The day-end branch of `step`:** calls `recordDay(progress, stats)` after `payWages`, before `dayEnded`.
  - All count changes go through one private `count(apply: (t: Counts) => void)`. Task 5 adds settling to it.
- **Save:** `parseSave` repairs `stats.quests` like `stats.gifts` (a number, else 0).

- [ ] **Step 1: Write the failing tests in `spa-counts.test.ts`.**
  - **Owner, 3 stars:** an owner service done with 3 stars moves `served`, `earned` (price + tip), `tips`, `services.shampoo` and `owner3` by one service's worth, and leaves `staff` at 0.
  - **Owner, 2 stars:** a 2-star owner service leaves `owner3` at 0.
  - **Technician:** a technician's customer (via `hireStaff`, then advance until paid) moves `staff`, not `owner3`.
  - **Losing customers:** a customer who runs out of patience moves `lost`. So does one who finds no seat.
  - **Gift money (Review Focus 3):** a regular's money gift leaves `earned` exactly at price + tip. Set the regular's points one visit short of 5 hearts, as in `spa-regulars.test.ts`.
  - **Study:** a booked course moves `courses`. A refused one (`'money'`) does not.
  - **Day end:** with `dayStart` set by `startDay`, it records `{ served, earned, tips, owner3, staff }` for the day. After four days `recent` has 3 entries.
  - **No partial day:** with `dayStart = null`, the day end records nothing in `recent` but still updates `life.bestServed`.
  - **Clean day:** `life.cleanDay` turns true after a day with `stats.served = 15`, `angry = 0` and `walkedAway = 0`, and stays false at 14.
- [ ] **Step 2: Run `npx vitest run tests/sim/spa-counts.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement as in Interfaces.**
- [ ] **Step 4: Run `npm test`.** Expected: all pass, `same-draws` included.
- [ ] **Step 5: Commit.** `Count served, earned, tips, owner and staff work, walk-outs, hearts and courses as they happen, and keep the last three days`

### Task 3: Quest rules (pure)

**Files:**
- Modify: `src/sim/quests.ts`
- Test: `tests/sim/quests.test.ts`

**Interfaces:**
- **Consumes:** the types from Task 2, `Rng`, the config numbers and `monthStart`.
- **Produces:**
  - `QuestShop { available: ServiceId[]; technicians: number; heartable: boolean; heartDue: boolean; canStudy: boolean }`. Field meanings:
    - `technicians` counts technicians who are not leaving;
    - `heartable`: some met regular has fewer than 5 hearts;
    - `heartDue`: such a regular has `visitAt !== null` today;
    - `canStudy`: some person who is not leaving has `courses(s, services).length > 0`.
  - `roundMoney(x: number): number`.
  - `countOf(q: Quest, t: Counts): number`. It reads the count the kind measures: serve → `served`, `service` → `services[q.service]`, noWalk → `lost`, heart → `hearts`, study → `courses`, and so on.
  - `progressOf(q: Quest, t: Counts): number = min(q.target, countOf − base)`. It is 0 for noWalk.
  - `dailyPool(shop): QuestKind[]` returns kinds in this order:
    - `serve, owner3, earn, tips` always;
    - `service` when `available` has more than shampoo;
    - `staff` when `technicians > 0`;
    - `noWalk` always.
  - `monthlyPool(shop, daysLeft: number): QuestKind[]` returns:
    - `serve, earn, owner3` always;
    - `heart` when `heartable && (daysLeft >= 2 || heartDue)`;
    - `study` when `canStudy`.

    `daysLeft` is a whole number of days, counting today.
  - `pickKinds(pool, avoid, n, rng): QuestKind[]` shuffles the kinds not in `avoid`, then those in `avoid`, each with Fisher-Yates on `rng`, and returns the first `n`.
  - `averageDay(recent: DayRecord[]): DayRecord` returns the mean of each field, or `QUEST_DEFAULT_DAY` when `recent` is empty.
  - `fullTarget(kind, avg, services: number): number`, from spec §8.4:
    - serve: `max(5, round(0.8 × served))`;
    - owner3: `clamp(round(0.8 × owner3), 2, 6)`;
    - earn: `max(150k, roundMoney(0.8 × earned))`;
    - tips: `max(20k, roundMoney(0.8 × tips))`;
    - service: `max(2, round(0.8 × served / services))`;
    - staff: `max(3, round(0.8 × staff))`;
    - noWalk, heart, study: 1.
  - `baseReward(avg) = max(30_000, roundMoney(0.05 × avg.earned))`.
  - `dailyQuest(kind, avg, shop, share, t: Counts, rng): Quest`:
    - The target is 1 for noWalk. Otherwise it is `max(1, round(fullTarget × share))`, through `roundMoney` for earn and tips.
    - The reward is `roundMoney(baseReward × (owner3 or noWalk ? 1.5 : 1) × share)`.
    - A service quest draws its service uniformly from `available` minus shampoo.
    - `base = countOf(quest, t)`.
  - `monthlyQuest(kind, avg, shop, daysLeft: number, t): Quest`. Here `daysLeft` may be fractional.
    - serve: `round(fullTarget × daysLeft)`;
    - earn: `roundMoney(fullTarget × daysLeft)`;
    - owner3: `max(round(4 × min(1, daysLeft)), round(fullTarget × daysLeft))`;
    - heart and study: 1;
    - every target at least 1.
    - The reward is `roundMoney(5 × baseReward × daysLeft / 3)`.
  - `rollDay(p, day, shop, share, rng): void` does four things:
    - sets `yesterday` to today's kinds when `p.questDay === day − 1`, else `[]`;
    - sets `daily` to `QUESTS_PER_DAY` quests from `pickKinds(dailyPool(shop), yesterday, 3, rng)`;
    - sets `swaps = QUEST_SWAPS_PER_DAY`;
    - sets `questDay = day`.
  - `rollMonth(p, day, shop, daysLeft, rng): void` does three things:
    - sets `lastMonthKind = p.monthly?.kind ?? p.lastMonthKind`;
    - sets `monthly` from `pickKinds(monthlyPool(shop, ceil(daysLeft)), [lastMonthKind], 1, rng)`;
    - sets `monthFrom = monthStart(day)`.
  - `swap(p, i, shop, share, rng): 'swaps' | 'done' | null`:
    - It refuses with `'swaps'` when `p.swaps === 0` and with `'done'` when the quest is done.
    - Otherwise it replaces `daily[i]` with a `dailyQuest` of a kind outside every current kind, preferring kinds outside `yesterday`, scaled by `share`. A failed quest may be swapped.
    - It then takes one swap.
  - `settle(p): Quest[]` handles open quests, daily first, then the monthly:
    - noWalk becomes `'failed'` when `lost > base`;
    - any other kind becomes `'done'` when `progressOf ≥ target`.

    It returns the newly done quests.
  - `closeNoWalk(p): Quest[]` turns open noWalk quests `'done'` and returns them.

- [ ] **Step 1: Write the failing tests.**
  - **Pools:**
    - A shampoo-only shop with no technicians has `dailyPool` = `serve, owner3, earn, tips, noWalk`.
    - Adding a mask bed and opening mask adds `service`. A technician who is leaving does not add `staff`.
    - A service quest never draws shampoo (200 rolls, seeds 1–200).
  - **`monthlyPool`:**
    - `heart` is absent with `heartable` and `daysLeft` 1 when not due.
    - It is present when due, and present with `daysLeft` 2.
    - `study` is absent when `canStudy` is false.
  - **Targets with the defaults** (`averageDay([])`, two services available):
    - serve 8, owner3 2, earn 400 000, tips 40 000, service 4, staff 3;
    - base reward 30 000, owner3 reward 50 000 (45 000 rounds up).
  - **Targets from one recorded day** `{ served: 20, earned: 1_000_000, tips: 100_000, owner3: 5, staff: 12 }`:
    - serve 16, owner3 4, earn 800 000, tips 80 000, staff 10;
    - base 50 000, noWalk reward 80 000.
  - **Clamping:** with `owner3: 10`, the owner3 target is 6.
  - **Averaging:** `averageDay` of served 10, 20 and 30 is 20.
  - **Scaling, share 0.75:** the serve quest with the defaults has target 6 and reward 20 000. Every target is at least 1, even with share 1/6.
  - **Monthly quests with the defaults:**
    - daysLeft 2: serve target 16, reward 100 000;
    - daysLeft 3: owner3 target 6;
    - daysLeft 1: owner3 target 4.
  - **No repeats:** `rollDay` with yesterday `serve, owner3, earn` on a shop whose pool is 5 kinds gives `tips` and `noWalk` plus one of yesterday's. With 7 kinds it repeats none. It never repeats a kind within the day.
  - **Swaps:**
    - A swap replaces a failed noWalk with a kind outside the other two, with `base` at the current count.
    - A second swap returns `'swaps'`, and swapping a done quest returns `'done'`.
  - **Settling:**
    - `settle` marks serve done exactly once: a second call returns `[]`.
    - It fails noWalk when `lost` rises, and `closeNoWalk` then returns nothing for it.
- [ ] **Step 2: Run `npx vitest run tests/sim/quests.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement as in Interfaces.**
- [ ] **Step 4: Run `npx vitest run tests/sim/quests.test.ts`.** Expected: PASS.
- [ ] **Step 5: Commit.** `Draw daily and monthly quests the shop can do, sized from its last three days`

### Task 4: Save v15

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/spa.ts` (`toSave`/`fromSave` carry `progress`)
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- **Produces:**
  - `SAVE_VERSION = 15` and `STAIRS_SAVE_VERSION = 14`. `parseSave` computes `before` as `raw.v < STAIRS_SAVE_VERSION`.
  - `parseVersioned` accepts 14.
  - `SaveData.progress: Progress`.
  - `repairProgress(x: unknown): Progress`:
    - When the block is missing, it returns `emptyProgress()` with `dayStart: null`.
    - Otherwise it repairs field by field:
      - counts are whole numbers ≥ 0, with every service present;
      - `recent` keeps valid records only, the last 3;
      - quests with an unknown kind, an unknown or missing service on a service quest, a target that is not a whole number ≥ 1, or a bad state are dropped;
      - `daily` keeps at most 3;
      - `swaps` is clamped to 0–1;
      - `life` is repaired the same way.
- `toSave` writes `progress`, and `fromSave` reads it.

- [ ] **Step 1: Write the failing tests.**
  - **The v14 fixture (Review Focus 1):** parses to `v` 15, `floors` 2, no `clearStairs`, `progress.dayStart === null`, empty `daily`, and `questDay` 0.
  - **Every older fixture:** v1–v13 still parse, and v13 is still flagged `clearStairs`.
  - **Round trip:** a progress block with counts, 2 recent days, 3 daily quests (one done, one failed) and a monthly quest survives `toSave` → `parseSave` → `fromSave` unchanged.
  - **Damage:**
    - a quest with kind `'fly'` is dropped;
    - a service quest with service `'nails'` is dropped;
    - `swaps: 7` becomes 1;
    - `total.served: -3` becomes 0;
    - `progress: 'x'` becomes an empty block with `dayStart: null`.

    None of these throws.
- [ ] **Step 2: Run `npx vitest run tests/sim/save.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test`.** Expected: all pass.
- [ ] **Step 5: Commit.** `Save v15 keeps the quest progress; a v14 shop keeps its floors`

### Task 5: Quests in the shop

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/types.ts`
- Test: `tests/sim/spa-quests.test.ts`

**Interfaces:**
- **Consumes:** everything from `quests.ts` (Task 3), `isUnlocked`, and the calendar functions.
- **Produces, `SimEvent`:**
  - `{ type: 'questDone'; quest: Quest }`, which carries a copy of the quest;
  - `{ type: 'monthStarted'; month: number }`.
- **Produces, `SpaSim`:**
  - `questsOpen(): boolean`, which is `isUnlocked('quests', day)`.
  - `questShop(): QuestShop`, built from `availableServices()`, the staff, `book.regulars` and `courses`.
  - `swapQuest(i): 'swaps' | 'done' | 'closed' | null`. It refuses with `'closed'` while `dayOver`. It uses `share = (DAY_END_MIN − minutes) / DAY_MINUTES`.
  - `questsDot(): boolean`, true when all of these hold:
    - `questsOpen()`;
    - `hintDone('openQuests')`;
    - `progress.seenDay !== day`;
    - there is a daily or a monthly quest.
  - `markQuestsSeen(): void`, which sets `seenDay = day`.
  - `private payQuests(done: Quest[])`, which for each quest:
    - adds `reward` to `money` and to `stats.quests`;
    - adds 1 to `life.dailies` for a daily quest;
    - emits `questDone`.
  - `count()` now calls `payQuests(settle(progress))`.
- **The day-end branch:** `payWages` → `payQuests(closeNoWalk(progress))` → `recordDay` → `planBooking` → `dayEnded`.
- **`startDay`,** after `clearStale`:
  - It sets `dayStart`.
  - When `questsOpen()`, it calls `rollDay(share 1)`.
  - Also when `questsOpen()`, if `monthFrom !== monthStart(day)`, it calls `rollMonth(daysLeftInMonth(day))`, and emits `monthStarted` when `dayOfMonth(day) === 1`.
  - When quests are locked, `daily` and `monthly` stay empty.
- **`fromSave`,** at the end, calls `catchUpQuests()`. It does nothing unless `questsOpen() && !dayOver`. Then:
  - When `questDay !== day`:
    - with `left = DAY_END_MIN − minutes` at least `QUEST_MIN_LEFT_MIN`, it calls `rollDay(share = left / DAY_MINUTES)`;
    - otherwise it sets `daily = []`, `swaps = 0` and `questDay = day`.
  - When `monthFrom !== monthStart(day)`, with `daysLeft = daysLeftInMonth(day) − 1 + left / DAY_MINUTES`:
    - when `daysLeft ≥ QUEST_MIN_LEFT_MIN / DAY_MINUTES`, it calls `rollMonth(daysLeft)`;
    - otherwise the monthly waits.

  It emits nothing.

- [ ] **Step 1: Write the failing tests.** Use `autoSpawn: false`. Reach day 8 with `sim.day = 7; sim.startDay()`. Give a chosen quest by setting `sim.progress.daily` to a literal whose `base` comes from `countOf`.
  - **Unlocking:**
    - Day 7 → `startDay` gives no quests.
    - Day 8 gives 3 dailies, `swaps` 1, and a monthly with `monthFrom` 7, sized for 2 days. There is no `monthStarted` event.
    - Day 9 → 10 gives a new monthly with `monthFrom` 10 and emits `monthStarted` with `{ month: 4 }`. Its kind differs from day 9's monthly whenever the pool has another.
  - **Completion:**
    - A serve-1 quest finished by one owner service is paid once.
    - `money` rises by price + tip + reward, `stats.quests` by the reward, and `life.dailies` by 1, with one `questDone`.
  - **Two at once (Review Focus 2):** serve-1 and earn-10 000 on one payment pay both. The events are in daily order and the sums add up.
  - **Rewards are not earnings (Review Focus 3):** after a reward is paid, `total.earned` equals the service's price + tip.
  - **noWalk:**
    - With no one lost, it is done at the day end, and the summary's `stats.quests` includes it.
    - A customer lost at 19:00 fails it, and the day end pays nothing.
    - **Review Focus 4:** a customer who runs out of patience after `clock.minutes` reaches 1200 (shop still emptying) fails it too.
  - **Paid once across a reload:**
    - Finish the day, then `toSave` → `parseSave` → `fromSave` on the summary.
    - `money` and `stats.quests` are unchanged, and the drained events hold `dayEnded` but no `questDone`.
    - `startDay` pays nothing for the old day.
  - **Reloading mid-day (Review Focus 5):**
    - A lô-A save from mid-day keeps `questDay`, the same 3 kinds with the same `base`, and `swaps`.
    - A served customer before saving still counts after loading.
  - **Swaps:**
    - `swapQuest(0)` at minute 840 gives a quest counting from now, with its target scaled by 360/720.
    - The second swap returns `'swaps'`, and a swap after the day ends returns `'closed'`.
  - **An old shop opened from the v14 fixture** (minute 660, day 11):
    - 3 dailies, each target at least 1 and no more than its full-day target;
    - the serve quest, if drawn, has target 6;
    - a monthly with `monthFrom` 10;
    - no events.
  - **Late and summary loads:**
    - Opened at minute 1100, there are no dailies but there is a monthly.
    - Opened with `dayOver` true, there is nothing until `startDay`, and then the day is rolled.
  - **Heart quest:** on the last day of a month, a heart quest is never drawn when no met regular under 5 hearts is due. Run 100 rolls, with `nextId` from 1 to 100, and set `day` and `book` so that `heartable` holds and nobody is due.
  - **Study quest:** it is finished the moment `study()` succeeds.
  - **The red dot:** `questsDot()` is false before `openQuests` is marked and after `markQuestsSeen()`. It is true the next morning.
  - **Same draws:** `same-draws.test.ts` still passes, and it now runs quests from day 8.
- [ ] **Step 2: Run `npx vitest run tests/sim/spa-quests.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement as in Interfaces.**
- [ ] **Step 4: Run `npm test`.** Expected: all pass.
- [ ] **Step 5: Commit.** `Give the day's and the month's quests from day 8, pay them as they finish, and catch up an old shop`

### Task 6: The Nhiệm vụ button and panel

**Files:**
- Create: `src/scenes/QuestsScene.ts`, `src/view/quests.ts`, `tests/view/quests.test.ts`
- Modify:
  - `src/sim/types.ts` (`HINT_IDS` gains `'openQuests'` at the end);
  - `src/sim/tutorial.ts`;
  - `src/view/Hud.ts`;
  - `src/scenes/SpaScene.ts`;
  - `src/main.ts`;
  - `src/art/palette.ts` (`soft: '#7A5E50'`, `tealPale: '#E1F0EA'`, `goldPale: '#FFF2D3'`);
  - `src/art/fx.ts` (one new texture, `quest-guest`: a customer's head and shoulders in style A);
  - `src/strings/vi.ts`;
  - `tests/sim/tutorial.test.ts`.

**Interfaces:**
- **`pickHint`:** returns `{ hint: 'openQuests' }` when `sim.day === UNLOCK_DAY.quests && !sim.hintDone('openQuests')`, after the `openStock` line. `Pointer` gains that member.
- **`Hud`:**
  - The NAV quests entry becomes `{ key: 'navQuests', icon: 'icon-quests', feature: 'quests', hint: 'openQuests' }`.
  - The constructor gains `onQuests: () => void` after `onBook`.
  - The quests plate gets a red dot like the services one, visible when `!locked && sim.questsDot()`.
  - Export `QUESTS_PLATE_TOP = { x: navX(3), y: NAV_Y − PLATE_R }`.
- **`SpaScene`:**
  - `openQuests()`, modelled on `openBook`:
    - the same guards;
    - `intro = !hintDone('openQuests')`, then `markHint('openQuests')` and `sim.markQuestsSeen()`;
    - it launches `QuestsScene`, and its `onClose` clears `modal` and saves.
  - `updatePointer` shows `t('hintQuests')` at `QUESTS_PLATE_TOP`, pointing down.
- **`src/view/quests.ts`** (pure):
  - `questTitle(q: Quest): string`. A service quest uses the service's name in lower case (`toLocaleLowerCase('vi')`).
  - `shortMoney(n)`: under 1 000 000, `` `${floor(n / 1000)}k` ``. From 1 000 000, `floor(n / 100 000) / 10` with a decimal comma and no `,0`, plus `tr`.
  - `questCount(q, t: Counts): string` gives `"4/10"`, or `shortMoney` on both sides for earn and tips.
  - `QUEST_ICON: Record<QuestKind, string>`:
    - serve `quest-guest`, owner3 `star`, earn `coin`, tips `coin`, service `svc-<id>`;
    - staff `icon-staff`, noWalk `heart-full`, heart `heart-full`, study `icon-book`.
- **`QuestsScene`** (`QuestsData { sim; intro: boolean; onClose }`). The layout follows the sketch in canvas px:
  - **Frame:** a dim layer, `addCard(40, 230, 1000, 1760)`, and the title `navQuests` at y 290 in size 60. When `intro` is set, `questsIntro` sits at y 400, centred, wrap 860, styled like the guest book's intro.
  - **Daily header:** `questsToday` at (90, 545) in size 40, left. At (990, 545) in size 30, right, colour `soft`, it shows `questSwapsLeft` or `questNoSwaps`.
  - **Daily rows:** at y `590 + i × 212`, height 192, x 80, width 920, radius 40. The fill is `cream`, or `tealPale` when done. A failed row is drawn at alpha 0.6.
    - An icon disc of r 54 at x 165, filled `sand`.
    - The title at x 245 in size 36, wrapped at 500.
    - A progress bar of 330 × 40 at x 245 with `questCount` at x 592. noWalk shows a line instead: `questNoWalkOpen`, `questNoWalkDone` or `questNoWalkFailed`.
    - The reward `+{money}` at x 895, in `mustardDark`.
    - A "Xong" stamp (teal pill with a tick, 140 × 64) when done. Otherwise, while `swaps > 0`, a plain `questSwap` button (140 × 64).
  - **Month header:** `questMonth` or `questMonthToday` at (90, 1270). `questYear` at (990, 1270).
  - **Month row:** at y 1315, height 236, filled `goldPale`, with a `mustard` disc and no swap button.
  - **Empty sections:** with no dailies or no monthly, that section shows `questsNoneToday` in its place.
  - **Footer:** `questFooter` at (540, 1620) in size 30, `soft`.
  - **Done button:** `addButton(MID, 1895, 560, 130, t('done'), 'primary')`.
  - **Swap:** tapping Đổi calls `sim.swapQuest(i)` and redraws.
- **Strings, exactly:**
  - `hintQuests: 'Mỗi ngày có việc nhỏ, xong là có thưởng'`
  - `questsIntro: 'Mỗi sáng có 3 việc nhỏ. Xong là tiền tự vào két, không xong thì thôi.'`
  - `questsToday: 'Hôm nay · Ngày {day}'`
  - `questSwapsLeft: 'Đổi được {n} việc'`
  - `questNoSwaps: 'Hết lượt đổi'`
  - `questSwap: 'Đổi'`
  - `questStamp: 'Xong'`
  - `questMonth: 'Tháng {month} · còn {n} ngày'`
  - `questMonthToday: 'Tháng {month} · còn hôm nay'`
  - `questYear: 'Năm {year}'`
  - `questFooter: 'Việc không xong thì thôi, không bị phạt.'`
  - `questsNoneToday: 'Sáng mai có việc mới'` **(em quyết)**
  - `questNoWalkOpen: 'Chưa ai bỏ về · tính lúc đóng cửa'`
  - `questNoWalkDone: 'Cả ngày không ai bỏ về'`
  - `questNoWalkFailed: 'Có khách bỏ về rồi · mai làm lại'`
  - `questServe: 'Phục vụ {n} khách'`
  - `questOwner3: 'Tự tay làm {n} khách 3 sao'`
  - `questEarn: 'Kiếm {money} trong ngày'`
  - `questTips: 'Nhận {money} tiền tip'`
  - `questService: 'Làm {n} lượt {service}'`
  - `questStaff: 'Thợ làm {n} khách'`
  - `questNoWalk: 'Không để khách nào bỏ về'`
  - `questServeMonth: 'Phục vụ {n} khách trong tháng'`
  - `questOwner3Month: 'Tự tay làm {n} khách 3 sao trong tháng'`
  - `questEarnMonth: 'Kiếm {money} trong tháng'`
  - `questHeart: 'Cho 1 khách quen lên thêm 1 tim'`
  - `questStudy: 'Cho 1 người đi học 1 khoá'`

- [ ] **Step 1: Write the failing tests.**
  - **`pickHint`:**
    - It gives `openQuests` on day 8, and not on day 9 or after the hint is done.
    - **Ordering:** an `openStock` hint still comes first on day 5.
  - **`questTitle`:**
    - serve 10 → `'Phục vụ 10 khách'`;
    - earn month 12 000 000 → `'Kiếm 12.000.000 đ trong tháng'`;
    - service massage 3 → `'Làm 3 lượt massage'`;
    - owner3 month 15 → `'Tự tay làm 15 khách 3 sao trong tháng'`.
  - **`shortMoney`:**
    - 310 000 → `'310k'`;
    - 699 999 → `'699k'`;
    - 2 000 000 → `'2tr'`;
    - 1 250 000 → `'1,2tr'`;
    - 12 000 000 → `'12tr'`.
  - **`questCount`:** 4 of 10 → `'4/10'`, and earn 310k of 700k → `'310k/700k'`.
- [ ] **Step 2: Run `npx vitest run tests/view/quests.test.ts tests/sim/tutorial.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement as in Interfaces.**
- [ ] **Step 4: Run `npm test && npm run build`.** Expected: all pass, and the build is clean.
- [ ] **Step 5: Commit.** `Open the Nhiệm vụ button on day 8 with its hand, badge and red dot, and draw the quest panel`

### Task 7: Finishing a quest, a new month, and the summary row

**Files:**
- Modify:
  - `src/scenes/SpaScene.ts`;
  - `src/view/Hud.ts` (`lastToastAt`);
  - `src/audio/cues.ts`;
  - `src/view/summary.ts`;
  - `src/strings/vi.ts`;
  - `tests/view/summary.test.ts`;
  - the cue test, if one covers `cueFor`.

**Interfaces:**
- **`cueFor`:** `questDone` → `'coin'`.
- **`Hud.toast`:** records `lastToastAt = scene.time.now`.
- **`SpaScene.queueToast(text)`:**
  - shows at `max(now, hud.lastToastAt + LATE_TOAST_MS, toastQueueAt)`;
  - sets `toastQueueAt` to that time + `LATE_TOAST_MS`.
- **The `questDone` case:**
  - a money float under the top bar's money, from `floatMoneyAt(TOP_BAR.moneyX + 120, 250, reward, HUD_DEPTH + 40)`. `floatMoney(tile)` is refactored onto the same `floatMoneyAt`.
  - `queueToast(t('questDoneToast', { name: questTitle(q), money: formatMoney(q.reward) }))`.
- **The `monthStarted` case:** a toast on the morning stagger, `studiedToastMs`, after the banner and any study toasts.
- **`summaryRows`:**
  - after `giftMoney`, a `{ label: 'questReward', value: stats.quests, kind: 'money' }` row when `stats.quests > 0`;
  - the profit row uses `dayProfit(stats)`.
- **Strings, exactly:**
  - `questDoneToast: 'Xong nhiệm vụ: {name} · +{money}'`
  - `monthQuestToast: 'Tháng {month}: có nhiệm vụ tháng mới'`
  - `questReward: 'Thưởng nhiệm vụ'`

- [ ] **Step 1: Write the failing tests.**
  - **Summary rows:**
    - with `quests: 90_000`, there is a `questReward` row of 90 000 right after the gift row, and profit includes it;
    - with `quests: 0`, there is no row.
  - **Cue:** `cueFor({ type: 'questDone', … })` is `'coin'`.
- [ ] **Step 2: Run `npx vitest run tests/view/summary.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test && npm run build`.** Expected: all pass.
- [ ] **Step 5: Commit.** `Pay a finished quest with a coin, a money float and a toast, greet each new month, and add the quest money to the day's summary`

### Task 8: Verify and ship

- [ ] **Step 1: Run `npm test` and `npm run build` on the branch.** Expect all to pass.
- [ ] **Step 2: Browser checks at iPhone size** (gstack `$B`, `npx vite preview` after a build in the worktree). Use dev saves through `window.__spa`.
  1. **Top bar:** "Ngày 11 · Tháng 4 · 10:34" fits with the VIP star showing, and so does "Ngày 100 · Tháng 10 · 10:34".
  2. **Locked button:** before day 8 the button is locked, and a tap says "Mở vào ngày 8".
  3. **Day 8:** the hand and its line point at the button, which shows "Mới". The first open shows the intro line. The next morning the red dot shows and goes once the panel opens.
  4. **Panel:** it matches the sketch, including a done row, a failed noWalk row and the monthly row. The longest titles do not run over the reward or the stamp.
  5. **Finishing a quest:** finishing a serve quest shows the coin, the money float and the toast. When a heart toast comes on the same payment, the quest toast follows it rather than replacing it.
  6. **Swap:** Đổi works once, then shows "Hết lượt đổi".
  7. **New month:** day 9 → 10 shows the month toast after the morning banner, and the new monthly row appears.
  8. **Summary:** the row "Thưởng nhiệm vụ" shows, and the card still fits with gift, wages and restock rows.
  9. **Old shop:** loading the v14 fixture at day 11 shows quests sized to the time left. Floor 2 is still open.
  10. **Console:** no errors.
- [ ] **Step 3: Final whole-branch review, then ship.**
  - Fetch, and merge onto the latest `origin/master` in a temp worktree if master moved.
  - Run the tests again and push master.
  - Report to anh in Vietnamese.
