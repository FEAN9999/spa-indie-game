# Đợt 2 lô A: chuyên môn và đi học — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Technicians get a tier 0–3 per service that speeds that service and lifts its star roll, the owner can pay for a person to study one course tonight, and free technicians prefer their best service without abandoning anyone.

**Architecture:** Tiers and the pending course live on `Staff`/`Candidate` in the pure sim (`src/sim/staff.ts` rules, `src/sim/crew.ts` behaviour, `src/sim/spa.ts` public API). Save v10 repairs and migrates field by field in `parseSave`. The staff panel (`StaffScene`) gets a specialty row, a study button, a course chooser and a confirm card; the shop shows a toast and sparks on the morning a course finishes.

**Tech Stack:** TypeScript, Phaser 4 (view only), Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-dot-2-nhan-vien-design.md` — §7 is this lot; §4, §5 and §9 bind it too. Lô B (§8, tính cách) is a later plan: do not build any trait.

## Global Constraints

- `src/sim/**` stays pure: no Phaser, view, art or audio imports. All player-facing copy lives in `src/strings/vi.ts`, Vietnamese, short, friendly Saigon voice.
- Style A: cream cards with brown borders (`addCard`, `addButton` from `src/view/ui.ts`), buttons at least 120 px wide and 96 px tall, the 1080-wide game canvas must fit an iPhone in portrait.
- Tiers: integers 0–3 per service (`MAX_TIER = 3`); a new technician candidate has tier 1 in exactly one service (rare: tier 2), drawn uniformly from **all** `SERVICE_IDS`, open or not; receptionists have no tiers (all 0).
- Per tier on its own service: work time ×0.85 (multiplied, walking unchanged) and +1 skill dot for the star roll only, capped at 5. Card, tip and wage keep the base stats.
- Work time never below `WORK_FLOOR_MS` = half of `workMs(5)` = 6000 ms.
- Tuition (paid on confirm, not counted in the day's Chi, no wage change): technician to tier 1 100.000 đ, to tier 2 200.000 đ, to tier 3 400.000 đ; receptionist "Tiếp khách" +1 friendly, to dot 2 50.000 đ, 3 100.000 đ, 4 200.000 đ, 5 400.000 đ. One course per person per night; refused when money < tuition (so also when money < 0).
- Courses: a technician studies an **open** service below tier 3; a receptionist studies "Tiếp khách" while friendly < 5. With no course left the button reads "Đã giỏi nhất" and does nothing.
- The course takes effect when the next day starts (`SpaSim.startDay`), never on load; a reload keeps the pending course. Firing someone with a pending course refunds exactly what was paid, also when money is negative and also after the day has ended.
- Fetch order for a free technician, inside the part-1 rules (regular yield 10 s, never fetch a VIP, VIP's service held) which stay first: (1) customers who have lost more than half of `patienceMaxMs`, longest wait first; (2) then the service where this technician's tier is highest; (3) then longest wait, then lowest id.
- Save v10: `tiers` on every staff and candidate, `study` on every staff. Old shops: each technician gets tier 1 in one service drawn from the save's **open** services, candidates follow the new-candidate rule, stats/level/xp/wage untouched; draws use a separate rng seeded from the save, never the shop's rng.
- One-time line, the first time the staff panel opens while a technician works there: "Cho nhân viên đi học để giỏi hơn một dịch vụ. Học tối nay, sáng mai giỏi lên." No new pointer.
- Morning toast for a finished course: "Lan học xong massage bậc 2!" plus the level-up sparks over the person.
- Never stage `CLAUDE.md`. Stage files by name.

## Review Focus

1. **An old shop's staff after the upgrade** — a v9 shop opened on v10 keeps every person with the same stats, level, xp and wage, every technician has exactly one tier 1 in a service that shop has open, and opening it twice gives the same specialties. Test: Task 1 Step 1 (`opens a v9 shop…`, `draws the same specialties…`).
2. **A course booked, then the game closed** — closed mid-day, or on the summary screen after the day ended: on reopen the course is still pending, the money is still gone, and the tier rises exactly once when the next day starts. Test: Task 3 Step 1 (`keeps a booked course through a reload…`, `applies a course booked before the summary save once`).
3. **Letting go of someone who is booked** — refund of exactly what was paid, with money negative, and after the day ended (where `fire` removes at once). Test: Task 3 Step 1 (`refunds the tuition when a booked person is let go`).
4. **Customers left waiting because nobody has their specialty** — a mask customer with three shampoo specialists in the shop still gets fetched before her patience runs out, and the part-1 regular yield and VIP hold still win. Test: Task 2 Step 1 (`fetches a customer past half her patience first…`, `keeps the regular's owner window and the VIP hold over a specialty`).
5. **A full staff panel** — four rows (receptionist + three technicians), long names, the "Hiếm" pill, three specialty badges, a booked line and two buttons must not overlap or clip on the iPhone viewport. Checked by the controller's browser screenshot in Task 6; Task 4 Step 1 pins the pure layout helper.

---

### Task 1: Tiers on staff and candidates, save v10

**Files:**
- Create: `tests/fixtures/save-v9.json` (before any source change)
- Modify: `src/config.ts` (staff block near `RARE_CHANCE`), `src/sim/staff.ts`, `src/sim/crew.ts:89-120` (`hire`), `src/sim/save.ts`
- Test: `tests/sim/staff.test.ts`, `tests/sim/save.test.ts`, `tests/sim/helpers.ts`

**Interfaces:**
- Produces (in `src/sim/staff.ts`):
  - `export type Tiers = Record<ServiceId, number>`
  - `export type Course = ServiceId | 'greet'`
  - `export interface Study { course: Course; paid: number }`
  - `Candidate` gains `tiers: Tiers`; `Staff` gains `study: Study | null`
  - `export function noTiers(): Tiers` — every service 0
  - `export function drawTiers(rng: Rng, role: StaffRole, tier: number, pool: readonly ServiceId[]): Tiers` — receptionist: `noTiers()`; technician: `tier` in one service picked uniformly from `pool`, 0 elsewhere
- Produces (in `src/config.ts`): `MAX_TIER = 3`, `RARE_TIER = 2`
- Produces (in `tests/sim/helpers.ts`): `hireStaff(sim, role, stats?, tiers?: Partial<Tiers>)` — tiers default all 0

- [ ] **Step 1: Make the v9 fixture on the untouched code**

On the current HEAD, before editing anything under `src/`, write a throwaway vitest file that builds a day-5 shop (shampoo and mask open, one receptionist and two technicians hired, three candidates of the day including at least one technician, at least one customer waiting) and writes `JSON.stringify(sim.toSave(), null, 2)` to `tests/fixtures/save-v9.json`. Run it once, check `"v": 9` in the file, delete the throwaway test. Commit the fixture alone:

```bash
git add tests/fixtures/save-v9.json
git commit -m "Add a v9 save fixture with staff and candidates"
```

- [ ] **Step 2: Write the failing tests**

In `tests/sim/staff.test.ts`:
- `gives a new technician tier 1 in exactly one service, drawn from every service` — 300 candidates from `makeCandidate(createRng(7), [])`; every technician has exactly one non-zero tier, equal to 1 when `!rare` and 2 when `rare`; across them every id in `SERVICE_IDS` appears as a specialty.
- `gives a receptionist candidate no tiers` — every receptionist in the same draw has `tiers` equal to `noTiers()`.
- `draws a tier from the pool it is given` — `drawTiers(createRng(3), 'technician', 1, ['mask'])` equals `{ ...noTiers(), mask: 1 }`.

In `tests/sim/save.test.ts`, a new `describe('save version 10')` (import the v9 fixture):
- `opens a v9 shop: every technician gets tier 1 in one open service, nothing else changes` — for each staff, `name/role/stats/level/xp/wage/rare` equal the fixture's; each technician has exactly one non-zero tier, value 1, in a service listed in `v9.services`; the receptionist has `noTiers()`; every `study` is `null`.
- `gives v9 candidates a specialty by the new-candidate rule` — technician candidates: one non-zero tier, 1 or 2 per `rare`, in `SERVICE_IDS`; receptionist candidates `noTiers()`; candidate stats unchanged.
- `draws the same specialties every time the same save is opened` — `open(v9)` twice: staff and candidate `tiers` equal; then `advance(30_000)` on both and `toSave()` equal.
- `opens every older save with a specialty on each technician` — for v1…v9 every technician has exactly one tier 1 in an open service.
- `keeps tiers and a pending course through a round trip` — staff with `tiers { shampoo: 2, mask: 1, massage: 0 }` and `study { course: 'mask', paid: 200000 }`, a receptionist with `study { course: 'greet', paid: 50000 }`: `viaJson(sim).toSave()` equals `sim.toSave()`.
- `repairs damaged tiers and courses field by field` — on a technician, `tiers: { shampoo: 7, mask: -1, massage: 'x' }` → `{ shampoo: 3, mask: 0, massage: 0 }`; on a receptionist, `tiers: { shampoo: 2 }` → `noTiers()`; `study: { course: 'nails', paid: 5 }` → `null`; a technician's `study: { course: 'greet', paid: 50000 }` → `null`; `study: { course: 'mask', paid: -3 }` → `null`; a receptionist's `study: { course: 'greet', paid: 50000 }` is kept.

Update the existing tests that pin the version (`v: 9` → `v: 10`, too-new `10` → `11`).

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/sim/staff.test.ts tests/sim/save.test.ts`
Expected: FAIL (`noTiers`/`drawTiers` not exported, no `tiers` on staff, version 9).

- [ ] **Step 4: Implement**

- `src/config.ts`: `MAX_TIER`, `RARE_TIER` with one-line comments like their neighbours.
- `src/sim/staff.ts`: the types and two functions above. `makeCandidate` draws the specialty with `drawTiers(rng, role, rare ? RARE_TIER : 1, SERVICE_IDS)` **after** all its existing draws.
- `src/sim/crew.ts` `hire`: copy `tiers: { ...c.tiers }` and set `study: null`.
- `tests/sim/helpers.ts` `hireStaff`: add the `tiers` parameter, candidate literal gets `tiers: { ...noTiers(), ...tiers }`.
- `src/sim/save.ts`: `SAVE_VERSION = 10`; `parseVersioned` also accepts 9. In `parseSave`, after the existing staff/candidate repair, one migration rng `createRng(data.day * 1009 + data.nextStaffId)` shared in order by staff then candidates, drawn from **only** for a record whose `tiers` is not an object: staff → `drawTiers(r, s.role, 1, data.services)`, candidate → `drawTiers(r, c.role, c.rare ? RARE_TIER : 1, SERVICE_IDS)`. A `tiers` object is clamped per service to an integer 0–`MAX_TIER` (anything else 0); a receptionist always gets `noTiers()`. `study` is kept only when it is an object whose `course` fits the role (`SERVICE_IDS` for a technician, `'greet'` for a receptionist) and whose `paid` is a finite number ≥ 0; otherwise `null`. Add `tiers`/`study` to the `SaveData` staff/candidate types wherever `checkStaff`/`checkCandidates` expect them, without making them throw (they are repaired, not required).
- Seeded tests elsewhere that shift because `makeCandidate` now draws more: update their expected values; do not remove the draw or reorder it.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS, all files.

- [ ] **Step 6: Commit**

```bash
git add src/config.ts src/sim/staff.ts src/sim/crew.ts src/sim/save.ts tests/sim/helpers.ts tests/sim/staff.test.ts tests/sim/save.test.ts
git commit -m "Give technicians a tier per service, with save v10 drawing one for old shops"
```
(Add any other test file whose seeded expectations you updated.)

---

### Task 2: What a tier does, and who a technician fetches

**Files:**
- Modify: `src/config.ts`, `src/sim/staff.ts`, `src/sim/crew.ts` (`updateTechnician` ~220-261, `fetchWaiting` ~268-298)
- Test: `tests/sim/staff.test.ts`, `tests/sim/spa-staff.test.ts`

**Interfaces:**
- Consumes: `Tiers`, `Staff.tiers`, `hireStaff(sim, role, stats?, tiers?)` from Task 1.
- Produces (in `src/sim/staff.ts`):
  - `export function starSkill(s: Candidate, service: ServiceId): number` — `min(5, s.stats.skill + s.tiers[service])`
  - `export function serviceMs(s: Candidate, service: ServiceId): number` — `max(round(workMs(s.stats.speed) * TIER_WORK_FACTOR ** s.tiers[service]), WORK_FLOOR_MS)`
- Produces (in `src/config.ts`): `TIER_WORK_FACTOR = 0.85`, `WORK_FLOOR_MS = (STAFF_WORK_MS_SLOW - 4 * STAFF_WORK_MS_STEP) / 2` (6000, half of `workMs(5)`)

Lô B will add trait terms to `starSkill` and `serviceMs`; keep each a single expression a later term can join.

- [ ] **Step 1: Write the failing tests**

In `tests/sim/staff.test.ts`:
- `adds the tier of the service served to the skill for stars, up to 5` — skill 3 with `mask: 1` → `starSkill(s, 'mask') === 4`, `starSkill(s, 'shampoo') === 3`; skill 5 with `mask: 2` → 5.
- `works a tiered service 15% faster per tier, never under the floor` — tier 0 → `workMs(speed)`; tier 1 speed 3 → `Math.round(workMs(3) * 0.85)`; tier 3 speed 1 → `Math.round(workMs(1) * 0.85 ** 3)`; `WORK_FLOOR_MS === workMs(5) / 2`; for every speed 1–5 and tier 0–3, `serviceMs ≥ WORK_FLOOR_MS`.

In `tests/sim/spa-staff.test.ts`:
- `serves a tiered service in the shorter time` — a technician with `shampoo: 2` fetches a waiting shampoo customer; once her task is `serve`, `task.totalMs === serviceMs(tech, 'shampoo')` and it is less than `workMs(tech.stats.speed)`.
- `rolls stars with the tier of the service served` — two shops with the same seed, only shampoo open, one skill-1 technician each, one with `shampoo: 3`, the other with none; the owner never taps; spawn and serve 20 shampoo customers in each (seatAndWait then `advanceUntil` the technician has finished each); the tiered shop's count of `3` in `sim.reviews` is greater than the plain shop's.
- `prefers the service of her highest tier` — mask open with a free mask bed and a free shampoo bed; a shampoo customer seated first (longer wait), then a mask customer; a technician with `mask: 1` is hired while both wait: she fetches the mask customer.
- `takes the longest wait when no customer is of her specialty` — same shop, technician with `massage: 1`: she fetches the shampoo customer who waited longer.
- `fetches a customer past half her patience first, specialty or not` — a technician with `mask: 2`; a shampoo customer whose `patienceMs` is set to just under `patienceMaxMs / 2`, and a mask customer who arrived earlier with full patience; she fetches the shampoo customer. With two customers past half, the longer wait goes first.
- `keeps the regular's owner window and the VIP hold over a specialty` — a regular inside her `REGULAR_OWNER_MS` window wanting the technician's specialty, past half patience, is not fetched; with a mask VIP in the shop not yet sent to a bed, a technician with `mask: 3` fetches no mask customer, even one past half patience. (Use the part-1 test setups in this file as the model.)

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim/staff.test.ts tests/sim/spa-staff.test.ts`
Expected: FAIL (`starSkill`, `serviceMs` missing; fetch order is wait-only).

- [ ] **Step 3: Implement**

- `updateTechnician`: the serve task's `total` is `serviceMs(s, c.service)`; the star roll is `staffStars(starSkill(s, c.service), h.rng())`. Tip and greeting keep `s.stats`.
- `fetchWaiting`: keep the filter exactly as it is; replace the sort with: urgent (`c.patienceMs < c.patienceMaxMs / 2`) before not urgent; among urgent, `stateMs` desc then `id` asc; among the rest, `s.tiers[c.service]` desc, then `stateMs` desc, then `id` asc. Update the function's doc comment to say so.
- Seeded tests that change because technicians now pick differently: update expectations, keep the rule.

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/sim/staff.ts src/sim/crew.ts tests/sim/staff.test.ts tests/sim/spa-staff.test.ts
git commit -m "Let a tier speed its service and lift its stars, and fetch by specialty without leaving anyone to wait out"
```

---

### Task 3: Paying for a course, and the morning it pays off

**Files:**
- Modify: `src/config.ts`, `src/sim/staff.ts`, `src/sim/spa.ts` (next to `hire`/`fire`), `src/sim/crew.ts` (`fire`, `startDay`), `src/sim/types.ts` (`SimEvent`), `src/audio/cues.ts`
- Test: `tests/sim/staff.test.ts`, `tests/sim/spa-staff.test.ts`, `tests/sim/save.test.ts`, `tests/audio/cues.test.ts`

**Interfaces:**
- Consumes: `Course`, `Study`, `Staff.study`, `MAX_TIER` from Task 1.
- Produces (in `src/config.ts`): `STUDY_PRICE = [100000, 200000, 400000]` (index = current tier), `GREET_STUDY_PRICE = [50000, 100000, 200000, 400000]` (index = current friendly − 1)
- Produces (in `src/sim/staff.ts`):
  - `export function courses(s: Staff, open: readonly ServiceId[]): Course[]` — technician: open services with tier < `MAX_TIER`, in `SERVICE_IDS` order; receptionist: `['greet']` while friendly < 5, else `[]`
  - `export function tuition(s: Staff, course: Course): number` — the price above; lô B will apply its discount here, rounded to 1000, so every caller must use this one function
- Produces (in `src/sim/spa.ts`):
  - `export type StudyProblem = 'money' | 'booked' | 'course'` — `'course'`: no such working person, they are leaving, or the course is not in `courses(s, this.services)`; `'booked'`: they already have a course tonight; `'money'`: `money < tuition`
  - `studyProblem(staffId: number, course: Course): StudyProblem | null`
  - `study(staffId: number, course: Course): StudyProblem | null` — on success takes `tuition` from `money` (not from `stats`) and sets `study = { course, paid }`
- Produces (in `src/sim/types.ts`): `SimEvent` gains `{ type: 'studied'; staffId: number; course: Course; level: number }` — `level` is the new tier, or the new friendly dots for `'greet'`
- `cueFor` maps `'studied'` to `'levelUp'`.

- [ ] **Step 1: Write the failing tests**

In `tests/sim/staff.test.ts`:
- `offers a technician every open service below tier 3` — tiers `{ shampoo: 3, mask: 1, massage: 0 }`, open `['shampoo', 'mask']` → `['mask']`; open all three → `['mask', 'massage']`.
- `offers a receptionist Tiếp khách until 5 dots` — friendly 4 → `['greet']`; friendly 5 → `[]`.
- `prices a course by the step it climbs` — tiers 0/1/2 → 100000/200000/400000; receptionist friendly 1/2/3/4 → 50000/100000/200000/400000.

In `tests/sim/spa-staff.test.ts` (`describe('studying')`):
- `takes the tuition at once and books the course` — money 500000, technician `mask: 1`, mask open: `study(id, 'mask')` returns null, money is 300000, `study` is `{ course: 'mask', paid: 200000 }`, `stats` unchanged (Chi untouched).
- `refuses a second course the same night, an unoffered course and too little money` — after one booking → `'booked'`; massage closed → `'course'`; shampoo at tier 3 → `'course'`; money 99000 for a 100000 course → `'money'`; money −5000 → `'money'`; a leaving person → `'course'`; `studyProblem` returns the same as `study` and changes nothing.
- `raises the tier when the next day starts, once` — book mask tier 1→2, end the day (`advanceUntil(sim, () => sim.dayOver)`), tier still 1; `startDay()` → tier 2, `study` null, events contain `{ type: 'studied', staffId, course: 'mask', level: 2 }`; another `startDay()` leaves tier 2 and emits no `studied`.
- `raises a receptionist's friendliness, never past 5` — friendly 4 → book greet → next day friendly 5, `wage` unchanged; `courses` now `[]`.
- `keeps a booked course through a reload in the middle of the day` — book, `viaJson`-style round trip (`SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts)`), tier unchanged and `study` kept on the copy; ending that day and `startDay()` on the copy raises the tier.
- `applies a course booked before the summary save once` — book, run to `dayOver`, round-trip (the summary-screen save), then `startDay()` on the copy: tier +1 exactly once.
- `refunds the tuition when a booked person is let go` — mid-day: book 200000, set money to −50000, `fire(id)` → money 150000 and `study` null; after `dayOver`: book, `fire(id)` → refunded and the person is gone.
- `does not count tuition in the day's costs` — book a course, end the day: `stats.wages` equals the day's wages only, and the `dayEnded` stats have no tuition in them.

In `tests/audio/cues.test.ts`: `cueFor({ type: 'studied', staffId: 1, course: 'mask', level: 2 })` is `'levelUp'`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim/staff.test.ts tests/sim/spa-staff.test.ts tests/audio/cues.test.ts`
Expected: FAIL (`courses`, `tuition`, `study` missing).

- [ ] **Step 3: Implement**

- Config prices and the two staff functions as above.
- `SpaSim.studyProblem`/`study` with doc comments like `hire`'s; the logic may live in `crew.ts` next to `hire` like the existing pairs.
- `crew.fire`: when the person has a `study`, add `study.paid` back to `money` and clear it, before either branch (day over or not).
- `crew.startDay`: before refreshing candidates, for each staff with a `study`, raise the tier (or friendly) by 1 capped at `MAX_TIER` (or 5), emit `studied` with the new level, clear `study`. Nothing on load (`repairAfterLoad` untouched).
- `cueFor`: add the case.

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/sim/staff.ts src/sim/spa.ts src/sim/crew.ts src/sim/types.ts src/audio/cues.ts tests/sim/staff.test.ts tests/sim/spa-staff.test.ts tests/audio/cues.test.ts
git commit -m "Let the owner pay for a night course that raises a tier or friendliness the next morning"
```

---

### Task 4: The staff panel — specialty row, study button, chooser, intro line

**Files:**
- Create: `src/view/staffCard.ts` (pure, no Phaser), `tests/view/staffCard.test.ts`
- Modify: `src/scenes/StaffScene.ts`, `src/scenes/SpaScene.ts` (`openStaff` ~305-321), `src/sim/types.ts` (`HINT_IDS`), `src/strings/vi.ts`

**Interfaces:**
- Consumes: `Tiers`, `Course`, `courses`, `tuition` (Task 1/3), `SpaSim.studyProblem`/`study` (Task 3), textures `svc-${id}`, `star`, `star-empty`, `icon-book`.
- Produces (in `src/view/staffCard.ts`):
  - `export function specialtyOf(person: Candidate, open: readonly ServiceId[]): { service: ServiceId; tier: number; dim: boolean }[]` — services with tier > 0 in `SERVICE_IDS` order, `dim` when not in `open`
  - `export function courseName(course: Course): string` — lowercased service name (`t(SERVICES[id].name).toLocaleLowerCase('vi')`), or `t('courseGreet')`
  - `export type StudyButton = { kind: 'booked'; course: Course } | { kind: 'best' } | { kind: 'noMoney' } | { kind: 'open'; courses: Course[] }`
  - `export function studyButton(sim: SpaSim, s: Staff): StudyButton` — booked if `s.study`; best if no courses; noMoney if money < the cheapest course's tuition; else open
- `HINT_IDS` gains `'study'`. `StaffData` gains `studyIntro: boolean`.

Strings to add (exact copy where the spec fixes it):
- `study: 'Cho đi học'`, `studyBest: 'Đã giỏi nhất'`, `studyTonight: 'Tối nay học: {course}'`
- `studyPick: '{name} học gì tối nay?'`, `studyOption: '{course} → bậc {n} · {money}'`, `studyGreetOption: 'Tiếp khách → {n} chấm · {money}'`
- `studyConfirm: 'Cho {name} đi học {course} tối nay? {money}'`
- `studyNoMoney: 'Chưa đủ tiền cho khoá học'`, `courseGreet: 'tiếp khách'`
- `studyIntro: 'Cho nhân viên đi học để giỏi hơn một dịch vụ. Học tối nay, sáng mai giỏi lên.'`

Layout (row height stays `ROW_H` 290, four rows): name, role, wage and a specialty row stacked at the left (`TEXT_X`), stat labels and dots kept at the row's bottom; on the working tab the right column holds two buttons (study above, "Cho nghỉ" below, each ≥ 240×96); on the hiring tab "Thuê" as now. A specialty badge is the `svc-*` icon with 1–3 small `star` images beside it, `dim` badges at `FADED_ALPHA`. The booked state replaces the study button with `icon-book` and `studyTonight` text (may wrap to two lines) in the same box. Pick exact y offsets so nothing overlaps; the controller checks a screenshot.

Behaviour:
- Study tap: `best` does nothing (faded label `studyBest`); `noMoney` is faded and toasts `studyNoMoney`; `open` with one course goes straight to the confirm card; with more, a chooser card over the panel (same overlay/card pattern as `confirmLetGo`) lists one button per course with `studyOption`/`studyGreetOption`, faded and toasting `studyNoMoney` when that course costs more than the money, plus Cancel. A chosen course opens the confirm card (`studyConfirm`, Cancel / `study`). Confirm calls `sim.study`; on a problem toast it (`money` → `studyNoMoney`), on success `onChange()` and redraw.
- Intro: `SpaScene.openStaff` sets `studyIntro = !intro && !sim.hintDone('study') && sim.staff.some(s => s.role === 'technician' && !s.leaving)` and marks `'study'` when it is shown. `StaffScene` draws `studyIntro` text where `staffIntro` goes (`INTRO_Y`), only when `intro` is false.

- [ ] **Step 1: Write the failing tests**

In `tests/view/staffCard.test.ts`:
- `lists the services a person has a tier in, dimming the closed ones` — tiers `{ shampoo: 0, mask: 2, massage: 1 }`, open `['shampoo', 'mask']` → `[{ service: 'mask', tier: 2, dim: false }, { service: 'massage', tier: 1, dim: true }]`; `noTiers()` → `[]`.
- `names a course in lower case` — `courseName('massage') === 'massage'`, `courseName('mask') === 'đắp mặt nạ'`, `courseName('greet') === 'tiếp khách'`.
- `shows the study button's state` — booked → `{ kind: 'booked', course }`; receptionist at friendly 5 → `best`; technician whose open services are all tier 3 → `best`; money 99000 with a cheapest course of 100000 → `noMoney`; money −1 → `noMoney`; enough money → `open` with the courses.
- `fills the confirm line from the spec` — `t('studyConfirm', { name: 'Lan', course: courseName('massage'), money: formatMoney(200000) })` is `'Cho Lan đi học massage tối nay? 200.000 đ'`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/view/staffCard.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement the helper, strings, hint id, and the panel**

As described above. `npm run build` must pass (type-check of the scenes).

- [ ] **Step 4: Run the suite and the build**

Run: `npm test && npm run build`
Expected: PASS, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/view/staffCard.ts tests/view/staffCard.test.ts src/scenes/StaffScene.ts src/scenes/SpaScene.ts src/sim/types.ts src/strings/vi.ts
git commit -m "Show specialties on staff cards and let the owner send someone to study from the panel"
```

---

### Task 5: The morning a course pays off, in the shop

**Files:**
- Modify: `src/view/StaffLayer.ts`, `src/scenes/SpaScene.ts` (`handle`, `showMorningBanner`), `src/strings/vi.ts`

**Interfaces:**
- Consumes: the `studied` event (Task 3), `courseName` (Task 4).
- Produces: `StaffLayer.handle` reacts to `studied` with the level-up sparks and a rising `t('studiedPill')` label (share one private method with `levelUp`, taking the label).

Strings: `studiedToast: '{name} học xong {course} bậc {n}!'`, `studiedGreetToast: '{name} học xong tiếp khách, thân thiện {n} chấm!'`, `studiedPill: 'Giỏi lên!'`.

Behaviour: `SpaScene.handle` routes `studied` to `staffLayer` and queues its toast. Toasts replace each other (`Hud.toast`), so the morning's toasts must not overwrite each other: the first `studied` toast of a morning shows `LATE_TOAST_MS` after the VIP-today toast when `showMorningBanner` showed one, else at once; each further one `LATE_TOAST_MS` after the previous. The person's name comes from `sim.staff` by `staffId`.

- [ ] **Step 1: Implement**

No new pure logic: the toast order lives in the scene. Keep the queue small (a counter or the time of the last morning toast) and reset it in `showMorningBanner`.

- [ ] **Step 2: Run the suite and the build**

Run: `npm test && npm run build`
Expected: PASS, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/view/StaffLayer.ts src/scenes/SpaScene.ts src/strings/vi.ts
git commit -m "Celebrate a finished course in the morning with sparks and a toast"
```

---

### Task 6: Controller check and ship (controller only, no implementer)

- [ ] Final whole-branch review (opus), one fix wave, scoped re-review.
- [ ] Browser run-through at 390×844 with the gstack daemon on `npx vite --port 5199 --strictPort`: hire a technician and see the specialty row on both tabs; fill four rows (receptionist + three technicians, one rare, one with three badges, one booked) and screenshot for overlap or clipped text; book a course, see money drop and the book line; reload mid-day and see it kept; end the day, reload on the summary screen, next day: toast, sparks, new tier on the card; let a booked person go and see the refund; watch a technician take her specialty's customer; console has no errors.
- [ ] Ship as in part 1: `git fetch`, origin/master unchanged, ff-merge into master, `npm test`, push, poll `version.json`, live smoke check, delete the branch.
