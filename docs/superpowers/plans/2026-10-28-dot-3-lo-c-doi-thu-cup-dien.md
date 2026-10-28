# Đợt 3 phần 2, lô C: đối thủ và cúp điện — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The scheduler from lô B gets its last two events: a rival shop opening next door (twice the picky customers, who grade like normal customers that day, and a 3-star challenge with a reward) and a power cut from 14:00 to 16:00 in shops with a machine service (dark room with candles, machines idle, waiting patience frozen, 1.5× tips). No save change.

**Architecture:** Rules stay in the sim. `src/sim/events.ts` adds the two kinds, a `machines` flag to `planEvent`, and pure helpers `rivalToday`, `rivalTarget`, `powerOutAt`. `SpaSim` reads them for the kind draw, grading, the 3-star count, service starts, new customers' service, patience and tips, and emits `powerWarn`/`powerOff`/`powerOn` on crossing their minutes and `rivalBeaten` once. The view extends `src/view/events.ts` and `today.ts`, and `RoomView` draws the rival's sign and the dark room.

**Tech Stack:** TypeScript, Phaser 4 (view only), Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-3-le-su-kien-design.md` (sections 5, 7.3, 7.4, 7.7, 7.8, 7.9, 8.4, 8.5 đối thủ/cúp điện, 8.6 "Lô C", 10). Approved sketch: https://claude.ai/artifact/Mv6UqNrH4C1EQ4ynKeqdzN (rival and power texts, the SPA MỚI sign with two balloons, the dark room with candles and the machine's off mark, the `shop` and `bolt` icons).

## Global Constraints

- `src/sim/**` imports no Phaser. Strings in `src/strings/vi.ts`, numbers in `src/config.ts`.
- No save change: lô C uses the v18 `EventBook` as it is (`count` for the 3-star count). `SAVE_VERSION` stays 18.
- No event takes money, shop stars or items (spec 5): picky customers grade `normal` on the rival's day; nobody loses patience while the power is out.
- Every event is announced from the summary of the day before; reload never redraws or replays a toast or a reward.
- No two events a day, none in a festival month, none on a VIP's day. The power cut only in a shop with a machine service it can do (`steam`, `stone`, `mud` with a bed).
- Config (spec 10): `RIVAL_PICKY_FACTOR 2`, `RIVAL_TARGET_SHARE 0.3`, `RIVAL_TARGET_MIN 4`, `POWER_FROM_MIN 840`, `POWER_TO_MIN 960`, `POWER_WARN_MIN 60`, `POWER_TIP_FACTOR 1.5`.
- Sounds (7.9): the rival beaten card plays `levelUp`; morning cards and toasts are silent.
- Text on screen never overflows or overlaps at iPhone width.
- Never stage `CLAUDE.md`. No attribution lines in commits.

## Review Focus

1. Reload during the power cut, or after 13:00 on its day: the room is dark again at once, and no warn, off or on toast plays a second time. → Task 3 test "says each power change once, and not again after a reload".
2. 14:00 comes while the owner walks a machine customer to a bed, or a technician fetches one: the walk is called off, the customer sits back down and waits without losing patience; a machine service already running finishes. → Task 3 tests.
3. A regular who likes steam, or the festival-less elder who prefers it, arrives during the cut: she asks for a hand service instead. → Task 3 test "new customers ask for a hand service while the power is out".
4. The 3-star count passes the target, a reload, then more 3 stars: one reward, one card. → Task 2 test "pays the rival reward once".
5. Long texts at iPhone width: the summary note for the rival (the longest note), "Giữ khách · 12/12 khách 3 sao", the warn toast with three machines. → Task 6 browser check.

---

### Task 1: The two new kinds in the scheduler

**Files:**
- Modify: `src/sim/events.ts`, `src/config.ts`, `src/sim/spa.ts` (the `planEvent` call)
- Test: `tests/sim/events.test.ts`, `tests/sim/spa-events.test.ts`

**Interfaces:**
- Produces:
  - `EventKind = 'kol' | 'inspect' | 'rival' | 'power'`, `EVENT_KINDS` in that order.
  - `MACHINES: readonly ServiceId[] = ['steam', 'stone', 'mud']`.
  - `planEvent(book, day, vipDay, machines: boolean, rng)`: kinds are `EVENT_KINDS` without `last`, and without `power` unless `machines`. Minute: KOL as now, inspector `INSPECT_MIN`, power `POWER_FROM_MIN`, rival `0` (unused).
  - `SpaSim.hasMachines(): boolean` = some of `MACHINES` is in `availableServices()`; the day-end call passes it.

- [ ] **Step 1: Write the failing tests:** a shop without machines never draws `power` over 400 seeds, one with machines draws all four; a power plan's minute is 840; after `last = 'kol'` the draw is one of the other three (the old "draws inspect after kol" test becomes this); the first-year count test passes `machines: true` and keeps its 5–8 bound (widen only by ruling); `repairEvents` keeps a `rival` and a `power` plan.
- [ ] **Step 2: Run** `npx vitest run tests/sim/events.test.ts tests/sim/spa-events.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**, with the four config numbers for the power and the three for the rival.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: PASS (`same-draws` stays green: the scheduler has its own rng).
- [ ] **Step 5: Commit** "Let the scheduler book the rival's opening, and a power cut in a shop with machines".

### Task 2: The rival's day

**Files:**
- Modify: `src/sim/customers.ts`, `src/sim/events.ts`, `src/sim/spa.ts`, `src/sim/types.ts`
- Test: `tests/sim/customers.test.ts`, `tests/sim/spa-events.test.ts`

**Interfaces:**
- Produces:
  - `drawKind(day, rng, pickyFactor = 1)`: the picky weight × `pickyFactor`.
  - `rivalToday(book, day): boolean` = a `rival` plan for `day`.
  - `rivalTarget(recent: DayRecord[]): number` = `max(RIVAL_TARGET_MIN, round(RIVAL_TARGET_SHARE × averageDay(recent).served))` (in `src/sim/quests.ts` or `events.ts`, whichever avoids an import cycle).
  - `SpaSim.rivalTarget(): number`; event `{ type: 'rivalBeaten'; reward: number }`.

- [ ] **Step 1: Write the failing tests:**
  - `drawKind` with factor 2 draws picky about twice as often over 4000 draws on day 20 (ratio between 1.7 and 2.3).
  - On the rival's day a picky customer's 1-star service adds `reviewScore(1, 'normal')`, the day after `reviewScore(1, 'harsh')`.
  - Every 3-star payment that day adds 1 to `eventBook.count` (owner or technician, any kind, VIP or not); 2 stars adds nothing; on other days nothing.
  - Reaching the target pays `eventReward()` into `money` and `stats.quests` and emits `rivalBeaten` once; more 3 stars, and a save/load round trip with `count` at the target, pay nothing more.
  - `rivalTarget` is 4 with no history and `round(0.3 × served)` above it.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** in `spawnCustomer` (factor when `rivalToday`), `payFor` (grading and count; the calm technician's rule stays), and a private `rivalScored()` that pays when `count === rivalTarget()`.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** "Run the rival's day: twice the picky customers, graded fairly, and a reward for enough 3 stars".

### Task 3: The power cut

**Files:**
- Modify: `src/sim/events.ts`, `src/sim/spa.ts`, `src/sim/crew.ts`, `src/sim/types.ts`
- Test: `tests/sim/spa-events.test.ts`

**Interfaces:**
- Produces:
  - `powerOutAt(book, day, minutes): boolean` = a `power` plan for `day` and `POWER_FROM_MIN <= minutes < POWER_TO_MIN`; `SpaSim.powerOut()`.
  - Events `{ type: 'powerWarn'; machines: ServiceId[] }` (the shop's machine services), `{ type: 'powerOff' }`, `{ type: 'powerOn' }`, and the toast key `powerWait`.

- [ ] **Step 1: Write the failing tests:**
  - "says each power change once, and not again after a reload": stepping across 780, 840 and 960 emits warn, off and on once each; a shop loaded from a save at minute 900 emits none of them while stepping to 950, and `powerOut()` is true there.
  - While out: tapping a waiting steam customer emits the `powerWait` toast and sets no task; a technician skips her and takes a waiting shampoo customer; the owner's fetch of a steam customer begun at 839 is called off at 840 and she is `waiting` again with her patience; a stone service in progress finishes and pays.
  - "new customers ask for a hand service while the power is out": 200 arrivals in the cut (a regular who likes steam among them) ask only for services outside `MACHINES`.
  - A waiting customer's `patienceMs` is the same at 950 as at 845; it falls again after 960.
  - A service paid at 900 tips `round(plain tip × POWER_TIP_FACTOR)`; one paid at 970 tips the plain amount.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** Crossings use the clock minute before and after `clock.advance` in `step`. The owner's and the technicians' fetch checks for a machine service go where the stock check already is. The draw for new customers filters `MACHINES` out of `available` (and out of a regular's `likes`).
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** "Cut the power from 14:00 to 16:00: machines rest, nobody loses patience, and hand services tip half again".

### Task 4: Event words for the rival and the power cut

**Files:**
- Modify: `src/view/events.ts`, `src/view/today.ts`, `src/scenes/SpaScene.ts`, `src/strings/vi.ts`
- Test: `tests/view/events.test.ts`, `tests/view/today.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: `EVENT_ICON.rival = { texture: 'event-shop', disc: C.wall }`, `EVENT_ICON.power = { texture: 'event-bolt', disc: C.glow }`; `rivalBeatenCard(e)`; `powerWarnText(machines)`.

- [ ] **Step 1: Write the failing tests** with the exact texts:
  - Notes: "Ngày mai: Spa Mới khai trương sát bên · khách khó tính ghé nhiều gấp đôi. Làm {n} khách 3 sao là giữ được khách." and "Ngày mai: Cúp điện 14:00 – 16:00 · máy nghỉ 2 tiếng." (`eventNote` takes the target for the rival).
  - Morning cards (quiet): rival "Spa Mới khai trương sát bên" / "Khách khó tính ghé nhiều gấp đôi để so hai tiệm. Làm {n} khách 3 sao là giữ được khách, có thưởng."; power "Cúp điện 14:00 – 16:00" / "Máy nghỉ 2 tiếng. Khách đang chờ không sốt ruột, khách làm tay tip gấp rưỡi."
  - Beaten card (not quiet): head "Giữ được khách · +{money}", name "Khách vẫn chọn tiệm mình!", line "Spa Mới khai trương đông mấy cũng không lấy được khách quen.", icon `heart-full` on `C.lotus`.
  - Today's lines, power first: "Cúp điện 14:00 – 16:00" before the cut, "Đang cúp điện · có lại lúc 16:00" during, nothing after; rival "Giữ khách · {n}/{target} khách 3 sao", then "Đã giữ được khách".
  - Toasts: warn "1 tiếng nữa cúp điện · máy xông lá, đá nóng sẽ nghỉ" (the shop's machines, lower case, in `MACHINES` order); off "Cúp điện rồi · gội đầu, mặt nạ, massage vẫn làm được"; on "Có điện lại rồi"; `powerWait` "Đang cúp điện, chờ có điện nhé".
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement**, and in `SpaScene`: `rivalBeaten` floats the money like a finished quest and queues the card; the three power events queue their toasts.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** "Tell the rival's day and the power cut on the summary, the morning card, today's line and toasts".

### Task 5: Art: the SPA MỚI sign, the dark room, two icons

**Files:**
- Modify: `src/art/fx.ts`, `src/view/RoomView.ts`, `src/scenes/SpaScene.ts`
- Test: `tests/art/fx.test.ts`

**Interfaces:**
- Produces: textures `event-shop`, `event-bolt` (sketch `shop` and `bolt` paths, drawn like `event-clip`), `fx-candle`, `fx-glow`, `power-off`; `RoomView.setRival(on: boolean)`, `RoomView.setPowerOut(on: boolean, machineBeds: Tile[])`.

- [ ] **Step 1: Write the failing test:** `fxTextures()` has the five textures.
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The sign stands on the floor-1 sidewalk right of the door, as in the sketch: a cream board "SPA MỚI" (terracotta, 36) over "Khai trương hôm nay" (soft, 24), two balloons (lotus and water) on strings. Shown only on floor 1 on the rival's day.
  - The dark room: a `#1E2440` layer at 0.48 over the room and the people, under the HUD; four candles with a soft glow on each floor; a `power-off` mark (cream disc, ink bolt, terracotta slash) over each machine bed on the floor in view.
  - `SpaScene.update` calls both every frame from the sim, like `setFestival`.
- [ ] **Step 4: Run** `npx vitest run tests/art` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** "Draw the rival's SPA MỚI sign and the dark room with candles and idle machines".

### Task 6: Browser check

- [ ] Dev build, preview on 5193. With `window.__spa`, plan each event and look at: the summary notes, the morning cards, the sign on floor 1 (and not on floor 2), the rival line counting up and the beaten card with its money; the 13:00 toast, the dark room on each floor with the marks on the machines, a tap on a steam customer, the 16:00 toast and the room lit again; a reload in the middle of the cut.
- [ ] Fix anything that overflows or overlaps; ledger it.
