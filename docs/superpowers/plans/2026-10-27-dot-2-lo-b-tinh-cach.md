# Đợt 2 lô B: tính cách — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every staff member and candidate has exactly one of six personalities, each with a good side and a small flaw the player can see in the shop.

**Architecture:** A `trait` field on `Candidate`/`Staff` in the pure sim (`src/sim/staff.ts`), read by the existing rule functions (`starSkill`, `serviceMs`, `tuition`, `restAfter`, `gainXp`, walking, tips, grading) and by two new staff tasks (`late`, `chat`) in `src/sim/crew.ts`. Save v11 repairs and migrates field by field. The staff panel shows a two-line trait pill; `StaffLayer` draws the small signs over heads.

**Tech Stack:** TypeScript, Phaser 4 (view only), Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-dot-2-nhan-vien-design.md` — §8 is this lot; §5 and §9 bind it too. Lô A (§7) is live at master 4214874.

## Global Constraints

- `src/sim/**` stays pure: no Phaser, view, art or audio imports. All player-facing copy lives in `src/strings/vi.ts`, short, friendly Saigon voice.
- Style A: cream cards with brown borders; buttons stay at least 120×96; the 1080-wide canvas must fit an iPhone in portrait.
- Exactly one trait per person, drawn as a candidate, kept on hire. Technicians draw uniformly from all six; receptionists only from Vui tính, Chăm chỉ, Ham học.
- The six traits (ids, good side, flaw, sign in the shop):
  - `deft` Khéo tay, hay đi trễ (technician): +1 skill for the star roll, total capped at 5 | each morning not in the shop until 8:30 game time (`DAY_START_MIN + 30`), then walks in from the door | a small clock over the head while walking in.
  - `quick` Nhanh nhẹn, hơi ẩu (technician): work time ×0.8 | about 1 service in 7 loses 1 star, never below 1 | a sweat drop over the head on that service.
  - `jolly` Vui tính, hay tám (both): technician's customers tip more; a receptionist's greeting gives more patience | now and then stands chatting 3–5 s; a chatting receptionist greets nobody | a "…" bubble over the head.
  - `diligent` Chăm chỉ, mau mệt (both): XP ×1.5 per customer | rests one customer sooner (rest count judged as now, minus 1) | the tea cup shows sooner (no new art).
  - `calm` Điềm tĩnh, chậm chạp (technician): picky customers (`kind === 'picky'`) served by this person grade like normal ones | walks 20% slower, work time unchanged | the slow walk itself (no new art).
  - `studious` Ham học, hay đòi lương (both): tuition −30%, rounded to the nearest 1.000 đ, the same number on button, card and money check | the level-up wage raise is doubled | a coin bubble over the head at level-up.
- Stacking (spec §7.1): star skill = base skill + tier + 1 if `deft`, capped at 5, for the star roll only; card, tip and wage keep base stats. Work time = `workMs(speed)` × 0.85^tier × 0.8 if `quick`, never below `WORK_FLOOR_MS` (6000).
- Late arrival: still employed, counted and fully paid; not late on the day they were hired; a reload before they arrive keeps them away and they arrive at the same minute; nothing moves while the owner plays a mini-game (the shop already freezes).
- Flaws stay mild: never mass walk-outs, never surprise money loss, never a stuck shop.
- Save v11: `trait` on every staff and candidate. Old shops: each person and candidate gets a random trait fitting the role, from a separate rng seeded from the save; everything else untouched.
- Never stage `CLAUDE.md`. Stage files by name.

## Review Focus

1. **An old shop after the upgrade** — a v10 shop (with lô A tiers and a booked course) opens on v11 with every person, tier and booking intact, each person a trait fitting the role, the same traits on every open, and a damaged trait (unknown, or a technician trait on a receptionist) redrawn. Test: Task 1 Step 2.
2. **A late technician across a reload, a firing and the hiring day** — closed before 8:30 and reopened, still away and arriving at 8:30; let go before arriving, gone with no ghost in the shop; hired today, at work at once. Test: Task 3 Step 1 (`stays away across a reload…`, `leaves at once when let go before arriving`, `is not late on the day she is hired`).
3. **A chatting receptionist when customers pour in** — the customers who arrive while she chats get no greeting bonus, but the shop never loses many more customers than with a steady receptionist. Test: Task 3 Step 1 (`a chatting receptionist greets nobody`, `flaws never empty the shop`).
4. **A sloppy star never goes below 1, and a deft star never above 5** — with a skill-5, tier-3 deft technician and a skill-1 quick one. Test: Task 2 Step 1 and Task 3 Step 1.
5. **A full staff panel with traits** — four rows, a "Hiếm" pill, the longest trait label ("Ham học / hay đòi lương"), three specialty badges and two buttons, on both tabs, no overlap or clipping at 390×844. Controller screenshot in Task 6.

---

### Task 1: The trait, its draw, and save v11

**Files:**
- Create: `tests/fixtures/save-v10.json` (before any source change)
- Modify: `src/sim/staff.ts`, `src/sim/crew.ts` (`hire`), `src/sim/save.ts`, `tests/sim/helpers.ts`
- Test: `tests/sim/staff.test.ts`, `tests/sim/save.test.ts`, `tests/save/code.test.ts` (version pin)

**Interfaces:**
- Produces (in `src/sim/staff.ts`):
  - `export type TraitId = 'deft' | 'quick' | 'jolly' | 'diligent' | 'calm' | 'studious'`
  - `export const TRAIT_IDS: readonly TraitId[]` (that order) and `export const RECEPTIONIST_TRAITS: readonly TraitId[] = ['jolly', 'diligent', 'studious']`
  - `export function drawTrait(rng: Rng, role: StaffRole): TraitId` — uniform over the role's list
  - `Candidate` gains `trait: TraitId` (so `Staff` has it too); `makeCandidate` draws it with `drawTrait` **after** all its existing draws; `hire` copies it
- Produces (in `tests/sim/helpers.ts`): `hireStaff(sim, role, stats?, tiers?, trait: TraitId = 'studious')`. `'studious'` changes only tuition and level-up raises; a test that pins a price or a raise passes a trait that leaves its assertion as it was — never weaken an assertion.

- [ ] **Step 1: Make the v10 fixture on the untouched code**

On the current HEAD, before editing `src/`, write a throwaway vitest file that builds a day-6 shop (shampoo and mask open, one receptionist and two technicians with different tiers, one technician with a booked course, three candidates including a technician, a waiting customer, one staff member at level 2 with xp 4) and writes `JSON.stringify(sim.toSave(), null, 2)` to `tests/fixtures/save-v10.json`. Run it once, check `"v": 10`, delete the throwaway test, commit the fixture alone (`git add tests/fixtures/save-v10.json`, message "Add a v10 save fixture with tiers and a booked course").

- [ ] **Step 2: Write the failing tests**

In `tests/sim/staff.test.ts`:
- `draws one of six traits for a technician and one of three for a receptionist` — 400 `makeCandidate(createRng(11), [])`: every technician's trait is in `TRAIT_IDS` and all six appear; every receptionist's trait is in `RECEPTIONIST_TRAITS` and all three appear.
- `hires a person with the trait they had as a candidate` — via `sim.hire`.

In `tests/sim/save.test.ts`, `describe('save version 11')` (import the v10 fixture):
- `opens a v10 shop with a trait for everyone and nothing else changed` — every staff member's `name/role/stats/level/xp/wage/tiers/study` equals the fixture's; each trait fits the role (receptionist ⇒ in `RECEPTIONIST_TRAITS`); candidates likewise, their stats and tiers unchanged.
- `draws the same traits every time the same save is opened` — `open(v10)` twice: equal traits; `advance(30_000)` both, `toSave()` equal.
- `opens every older save with a fitting trait on everyone` — v1…v10.
- `keeps traits through a round trip` — `viaJson`.
- `redraws a damaged trait` — staff `trait: 'grumpy'` → a valid trait; a receptionist with `trait: 'deft'` → one of `RECEPTIONIST_TRAITS`; a candidate with no trait → a valid trait.

Update the version pins (`v: 10` → `v: 11`, too-new `11` → `12`).

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/sim/staff.test.ts tests/sim/save.test.ts`
Expected: FAIL (no `drawTrait`, no `trait`, version 10).

- [ ] **Step 4: Implement**

- `src/sim/staff.ts`: the type, lists, `drawTrait`, the field, the draw in `makeCandidate`.
- `crew.hire`: copy `trait`. `hireStaff` helper as above.
- `src/sim/save.ts`: `SAVE_VERSION = 11`, accept 10. In `parseSave`, after the tiers repair, one rng `createRng(data.day * 2003 + data.nextStaffId)` shared in order by staff then candidates, drawn from only when a record's `trait` is not valid for its role: `drawTrait(r, role)`.
- Seeded tests that shift because `makeCandidate` draws once more: update their expected values; keep the draw and its place.

- [ ] **Step 5: Run the whole suite** — `npm test`, expected PASS.

- [ ] **Step 6: Commit**

```bash
git add src/sim/staff.ts src/sim/crew.ts src/sim/save.ts tests/sim/helpers.ts tests/sim/staff.test.ts tests/sim/save.test.ts tests/save/code.test.ts
git commit -m "Give every staff member and candidate a personality, with save v11 drawing one for old shops"
```
(Add any other test file whose seeded expectations you updated.)

---

### Task 2: The good sides, and the flaws that are only numbers

**Files:**
- Modify: `src/config.ts` (staff block), `src/sim/staff.ts`, `src/sim/crew.ts` (`CrewHost.payFor`, `updateTechnician`), `src/sim/spa.ts` (`spawnCustomer`, `payFor`, the staff `moveAlong` in `update`)
- Test: `tests/sim/staff.test.ts`, `tests/sim/spa-staff.test.ts`

**Interfaces:**
- Consumes: `TraitId`, `Candidate.trait`, `hireStaff(…, trait)` from Task 1; lô A's `starSkill`, `serviceMs`, `tuition`, `restAfter`, `gainXp`, `walkSpeed`, `greetPatience`, `tipFactor`.
- Produces (in `src/config.ts`): `QUICK_WORK_FACTOR = 0.8`, `JOLLY_TIP = 0.1`, `JOLLY_GREET_PATIENCE = 0.1`, `DILIGENT_XP = 1.5`, `CALM_WALK_FACTOR = 0.8`, `STUDIOUS_TUITION = 0.7`, `STUDIOUS_RAISE = 2`
- Produces (in `src/sim/staff.ts`):
  - `starSkill` adds 1 for `deft` (still capped at 5); `serviceMs` multiplies by `QUICK_WORK_FACTOR` for `quick` (floor unchanged)
  - `tuition` for `studious` is `Math.round(price * STUDIOUS_TUITION / 1000) * 1000`
  - `restAfter` is one less for `diligent`, never below 1 (its parameter type widens to include `trait`)
  - `gainXp` adds `DILIGENT_XP` for `diligent`, else 1; the level-up raise is `LEVEL_WAGE_RAISE * STUDIOUS_RAISE` for `studious`
  - `export const staffWalkSpeed = (s: Candidate): number` — `walkSpeed(s.stats.speed)`, ×`CALM_WALK_FACTOR` for `calm`
  - `export const greeterPatience = (greeter: Candidate): number` — `greetPatience(greeter.stats.friendly)` + `JOLLY_GREET_PATIENCE` for `jolly`
- Changes: `CrewHost.payFor(c, station, stars, technician: Staff | null)` (was `technicianFriendly: number | null`). `SpaSim.payFor` computes the tip with `tipFactor(c.greet, technician?.stats.friendly ?? null)` plus `JOLLY_TIP` when the technician is `jolly`; grades a `picky` customer as `'normal'` when the technician is `calm`; passes "owner did it" to the regulars as `technician === null`. The owner's own service passes `null` as before.

- [ ] **Step 1: Write the failing tests**

In `tests/sim/staff.test.ts`:
- `adds a dot of skill for a deft technician, still up to 5` — skill 3, `mask: 1`, deft → `starSkill(s, 'mask') === 5`; skill 5, tier 3, deft → 5; not deft → 4.
- `works 20% faster when quick, never under the floor` — speed 3, tier 0, quick → `Math.round(workMs(3) * 0.8)`; speed 5, tier 3, quick → `WORK_FLOOR_MS`.
- `cuts a studious person's tuition by 30%, to the thousand` — 100000/200000/400000 → 70000/140000/280000; receptionist greet at friendly 1 → 35000.
- `rests a diligent person one customer sooner` — stamina 3 technician → 4 (was 5); stamina 3 receptionist → 9 (was 10); stamina 1, diligent → never below 1.
- `gives a diligent person 1.5 experience and a studious one a double raise` — diligent at xp 0 → 1.5 after one `gainXp`; studious levelling up → wage + `2 * LEVEL_WAGE_RAISE`; others + `LEVEL_WAGE_RAISE`.
- `walks a calm technician 20% slower` — `staffWalkSpeed` = `walkSpeed(speed) * 0.8`.
- `gives a jolly greeter's customers more patience` — `greeterPatience` = `greetPatience(f) + 0.1`.

In `tests/sim/spa-staff.test.ts`:
- `tips more after a jolly technician` — two shops, same seed and customer, a technician who differs only in `jolly` vs `diligent`: the jolly one's `paid` tip is larger (or equal only when the base tip is 0 — use a 3-star case).
- `lets a calm technician's picky customers grade like normal ones` — a picky customer served at 2 stars by a calm technician adds `reviewScore(2, 'normal')` to `sim.reviews`; by a non-calm one `reviewScore(2, 'harsh')`.
- `serves a studious person's course at the cut price` — `study()` takes 70000 for tier 0→1.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim/staff.test.ts tests/sim/spa-staff.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** as in Interfaces. Use `staffWalkSpeed` where staff move (`spa.ts` update) and `greeterPatience` where a greeted customer's patience is set (`spawnCustomer`).

- [ ] **Step 4: Run the whole suite** — `npm test`, expected PASS (update a seeded expectation only where a trait now changes it, and say so in the report).

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/sim/staff.ts src/sim/crew.ts src/sim/spa.ts tests/sim/staff.test.ts tests/sim/spa-staff.test.ts
git commit -m "Give each personality its good side, and the flaws that are only numbers"
```

---

### Task 3: The flaws you can watch — late, chatting, sloppy

**Files:**
- Modify: `src/config.ts`, `src/sim/staff.ts` (`StaffTask`), `src/sim/crew.ts` (`startDay`, `updateStaff`, `updateTechnician`, `greet`, `staffGoal`), `src/sim/types.ts` (`SimEvent`), `src/sim/save.ts` (`repairTask`)
- Test: `tests/sim/spa-staff.test.ts`, `tests/sim/save.test.ts`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces (in `src/config.ts`): `LATE_MIN = 30`, `SLOPPY_CHANCE = 1 / 7`, `CHAT_CHANCE = 0.25`, `CHAT_MS_MIN = 3000`, `CHAT_MS_MAX = 5000`
- Produces (in `src/sim/staff.ts`): `StaffTask` gains `{ kind: 'late'; untilMinute: number }` and `{ kind: 'chat'; leftMs: number }`
- Produces (in `src/sim/types.ts`): `SimEvent` gains `{ type: 'sloppy'; staffId: number }`

Behaviour:
- **Late:** `crew.startDay` puts each `deft` staff member (not leaving) on the door tile with task `late` until `DAY_START_MIN + LATE_MIN`. While `sim.clock.minutes` is below it they do nothing. At or after it, they walk to their home tile with the task still `late`; on arriving the task clears. Hiring never sets `late`. `staffGoal` for `late` is the home tile. Letting go a late person who has not arrived: they leave from the door at once (removed on the next step), wage paid as for anyone let go.
- **Chatting:** after a `jolly` technician finishes a customer or a `jolly` receptionist greets one, when they are not due a rest and not leaving, with chance `CHAT_CHANCE` they take task `chat` for `CHAT_MS_MIN + rng() * (CHAT_MS_MAX - CHAT_MS_MIN)` ms where they stand; the task counts down with `dt` and then clears. The extra rng draws happen only for `jolly` people. A chatting receptionist is not "at the desk", so arrivals during the chat get no greeting.
- **Sloppy:** when a `quick` technician finishes, after the star roll, with chance `SLOPPY_CHANCE` (one more rng draw, only for `quick`) the stars drop by one, never below 1, and `sloppy` is emitted.
- `repairTask` keeps a `late` task with a numeric `untilMinute` and a `chat` task with a numeric `leftMs`.

- [ ] **Step 1: Write the failing tests**

In `tests/sim/spa-staff.test.ts` (`describe('flaws')`):
- `keeps a deft technician out until 8:30, then walks her in` — hire deft, end the day, `startDay()`: on the door tile, task `late`, fetches nobody while a customer waits; advance until `clock.minutes >= DAY_START_MIN + LATE_MIN`, then until her task is null: she is on her home tile.
- `is not late on the day she is hired` — hire deft mid-day: task is not `late`.
- `stays away across a reload and arrives at the same minute` — at 8:10 round-trip the save: the copy's technician still has task `late` with the same `untilMinute`.
- `leaves at once when let go before arriving` — `fire` before 8:30: within a step she is gone from `sim.staff`; `stats.wages` includes her wage.
- `a chatting receptionist greets nobody` — a jolly receptionist given task `chat` by hand: a customer spawned meanwhile has `greet === 0`; after the chat clears, the next one has `greet > 0`.
- `chats now and then after work, only when jolly` — over 40 served customers a jolly technician starts at least one `chat` task, each lasting 3000–5000 ms; a non-jolly one never does.
- `drops a quick technician's star now and then, never below 1` — over 70 services, at least one `sloppy` event; with a skill-1 quick technician no review below the 1-star score.
- `flaws never empty the shop` — for seeds 1–3, run a full day with autoSpawn and the same layout twice: staff with traits `deft`, `quick`, `jolly` (technicians) and `jolly` (receptionist), and staff with `studious` everywhere; the flawed day's `stats.walkedAway + stats.angry` is at most the steady day's + 3.

In `tests/sim/save.test.ts`: `keeps a late or chatting task through a round trip` and `drops a damaged late or chat task`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sim/spa-staff.test.ts tests/sim/save.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** as described.

- [ ] **Step 4: Run the whole suite** — `npm test`, expected PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/sim/staff.ts src/sim/crew.ts src/sim/types.ts src/sim/save.ts tests/sim/spa-staff.test.ts tests/sim/save.test.ts
git commit -m "Let the flaws show: a late morning, a chat now and then, a sloppy service"
```

---

### Task 4: The trait on the staff cards

**Files:**
- Modify: `src/view/staffCard.ts`, `src/scenes/StaffScene.ts`, `src/strings/vi.ts`
- Test: `tests/view/staffCard.test.ts`

**Interfaces:**
- Consumes: `TraitId` (Task 1).
- Produces (in `src/view/staffCard.ts`): `export function traitLines(trait: TraitId): [string, string]` — the good side and the flaw, from strings:
  - `traitDeft: 'Khéo tay'`, `flawDeft: 'hay đi trễ'`
  - `traitQuick: 'Nhanh nhẹn'`, `flawQuick: 'hơi ẩu'`
  - `traitJolly: 'Vui tính'`, `flawJolly: 'hay tám'`
  - `traitDiligent: 'Chăm chỉ'`, `flawDiligent: 'mau mệt'`
  - `traitCalm: 'Điềm tĩnh'`, `flawCalm: 'chậm chạp'`
  - `traitStudious: 'Ham học'`, `flawStudious: 'hay đòi lương'`

Layout: on both tabs, a two-line pill (good side above, flaw below, about 22 px text, cream with brown border like the "Hiếm" pill) on the name line, right of the name and the "Hiếm" pill, ending left of the button column (x < 725) and clear of the role line below. Names come from `STAFF_NAMES` (five letters at most).

- [ ] **Step 1: Write the failing test** — `names each trait's good side and flaw`: `traitLines('deft')` is `['Khéo tay', 'hay đi trễ']`, `traitLines('studious')` is `['Ham học', 'hay đòi lương']`, and every `TRAIT_IDS` entry gives two non-empty strings.
- [ ] **Step 2: Run it to see it fail** — `npx vitest run tests/view/staffCard.test.ts`, FAIL.
- [ ] **Step 3: Implement** the helper, strings and the pill.
- [ ] **Step 4: Run the suite and the build** — `npm test && npm run build`, PASS.
- [ ] **Step 5: Commit**

```bash
git add src/view/staffCard.ts src/scenes/StaffScene.ts src/strings/vi.ts tests/view/staffCard.test.ts
git commit -m "Show each person's personality on the staff cards"
```

---

### Task 5: The signs over heads in the shop

**Files:**
- Modify: `src/art/fx.ts` (two small icons), `src/view/StaffLayer.ts`, `src/scenes/SpaScene.ts` (route `sloppy`), `src/strings/vi.ts` if a label is needed

**Interfaces:**
- Consumes: `late`/`chat` tasks and the `sloppy` event (Task 3), `trait` (Task 1), the `levelUp` event.
- Produces: textures `icon-clock` (a small round clock) and `icon-sweat` (a blue sweat drop), style A (ink outline, palette colours), about the tea cup's size.

Behaviour in `StaffLayer`:
- A person whose task is `late` while `sim.clock.minutes` is below `untilMinute` is hidden (no sprite, no bar, no cup); once walking in, `icon-clock` bobs over the head like the tea cup until the task clears.
- While the task is `chat`, a small "…" pill (same style as the greeting pill) shows over the head.
- On `sloppy`, `icon-sweat` pops over the head for about a second.
- On `levelUp` of a `studious` person, a `coin` image pops over the head next to the existing "Lên cấp!" label.
- Hidden people do not get a greeting pill or celebration drawn where nobody stands.

- [ ] **Step 1: Implement** (no unit test: view-only; the controller checks it in the browser).
- [ ] **Step 2: Run the suite and the build** — `npm test && npm run build`, PASS.
- [ ] **Step 3: Commit**

```bash
git add src/art/fx.ts src/view/StaffLayer.ts src/scenes/SpaScene.ts src/strings/vi.ts
git commit -m "Show the personalities in the shop: a clock walking in late, a chat bubble, a sweat drop, a coin"
```

---

### Task 6: Controller check and ship (controller only, no implementer)

- [ ] Final whole-branch review (opus), one fix wave, scoped re-review.
- [ ] Browser run-through at 390×844: traits on both tabs (screenshot four full rows with the longest label and a rare pill); next morning a deft technician absent until 8:30 then walking in with the clock; a jolly receptionist's "…" and an ungreeted customer during it; a sloppy sweat drop; a studious level-up coin; reload before 8:30 keeps her away; a v10 save in localStorage opens with traits; no console errors.
- [ ] Ship: `git fetch`, origin/master unchanged, ff-merge, `npm test`, push, poll `version.json`, live smoke check, delete the branch.
