# Step 1b Batch 4: Staff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From day 3 the player can hire a receptionist and up to three technicians. Technicians fetch and serve waiting customers by themselves. The receptionist greets new customers. Staff tire, rest, level up and are paid at the end of each day.

**Architecture:**
- Pure staff rules live in a new `src/sim/staff.ts`: the numbers, candidates, wages, stars, levels and rest counts.
- Staff behaviour lives in `SpaSim` as private methods next to the owner's. It reuses `moveAlong`, `findPath`, `freeSeat` and `startLeaving`.
  - A technician runs the owner's fetch flow, then a work timer instead of the mini-game.
  - `servingCustomerId` stays the owner's mini-game only, so the shop still freezes while the owner plays.
- The save grows to v4: staff, the day's candidates, `stats.wages`, and `customer.greet`. Older saves get no staff.
- The view adds `StaffLayer` (staff sprites in the shop) and `StaffScene` (the panel over the frozen shop). The staff plate opens the panel the way the build plate opens build mode.

**Tech Stack:** TypeScript ^7, Phaser ^4.2.1, Vite ^8.3, Vitest ^5. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-26-step-1b-batches-2-7-design.md`: section 8, plus 4 (bans), 6.4 (the staff button gets "Mới", a morning hand and a first-open line) and 12 (tests).

## Global Constraints

- Free only. No new npm dependencies. Draw all art in code (SVG strings like `src/art/chibi.ts`). Style A means cream, wood and teal tones, a 4 px ink `#4A2E22` outline at canvas scale, and chunky rounded shapes.
- Every player-visible string comes from `src/strings/vi.ts`.
- `src/sim/**`, `src/save/**`, `src/app/**`, `src/art/outline.ts` and `build/**` must not import `phaser`, `src/view` or `src/scenes`. Art tests mock Phaser with `vi.mock('phaser', () => ({}))`.
- Canvas is 1080×2160 and the primary target is iPhone 17 Safari (402×874).
  - Cards are `C.paper` with a 4 px `C.ink` outline and radius 60 (`addCard`).
  - Primary buttons are `C.teal` with `C.paper` text. Plain buttons are `C.cream` with `C.ink` text (`addButton`).
  - Font is Be Vietnam Pro, weight 600 or 800 only.
  - Every button is at least 120 px tall.
- **Old shops must survive.** A shop saved by any earlier version opens as the same shop, with no staff.
  - `tests/fixtures/save-v1.json` and `save-v2.json` pin v1 and v2. This batch adds `save-v3.json`.
  - New fields get defaults: `staff: []`, `candidates: []`, `candidatesDay: 0`, `nextStaffId: 1`, `stats.wages: 0`, `greet: 0` on every customer.
- **A shop without staff plays exactly as before.** Every existing test passes unchanged. The sim draws nothing new from its rng before day 3.
- **Staff rules (spec 8, numbers are the builder's starting values):**

| rule | value |
|---|---|
| caps | 1 receptionist (`lễ tân`), 3 technicians (`kỹ thuật viên`); staff who are leaving do not count |
| candidates | 3 each morning from day 3 (`UNLOCK_DAY.staff`); 1 in 3 is a receptionist |
| stats | `skill` Tay nghề, `speed` Tốc độ, `friendly` Thân thiện, `stamina` Sức bền; whole dots 1–5 |
| rare | 1 in 10 candidates; every stat 4 or 5; tag "Hiếm". Others have every stat 1–3 |
| wage per day | `40000 + (skill + speed + friendly + stamina − 4) × 5000`, so 40 000–120 000 đ |
| hiring | free and immediate; the new person walks in from the door |
| work time | `24000 − (speed − 1) × 3000` ms, so 24 s to 12 s, counted once customer and technician are both at the bed |
| walk speed | `3 + 0.5 × speed` tiles/s |
| stars | roll `r` from the sim's rng: 3 stars if `r < three`, 1 star if `r ≥ 1 − one`, else 2. Odds by skill 1–5: three `[0, 0.1, 0.25, 0.45, 0.65]`, one `[0.4, 0.25, 0.1, 0.05, 0]` |
| greeting | a greeted customer's patience × `1.15 + 0.02 × friendly` (rounded once with the day's ease); `greet` = the receptionist's friendliness |
| tips | tip = `round(tipFor(price, stars) × (1 + 0.05 × greet + (technician ? 0.05 × (friendly − 1) : 0)))` |
| rest | after `stamina + 2` customers (a receptionist: twice that many greetings); 35 000 ms beside the towel cabinet with a tea cup above the head |
| levels | 1 xp per customer served or greeted; level thresholds `[0, 3, 8, 15, 25]` for levels 1–5; each level raises one random stat below 5 by 1 and the wage by 5 000 |

- **Money:** wages are taken when the day ends and the summary shows "Lương nhân viên". Money may go negative and is then shown in `C.lantern` red. While money is negative, `buy` and `hire` are refused. The shop keeps running: customers come, the owner and staff serve, and money recovers.
- **Letting go ("Cho nghỉ"):** a technician with a customer on the way to or on the bed finishes that customer first. Everyone else walks out at once. A dropped fetch leaves the customer waiting. The day's wage is still paid.
- **Never steal:** a technician never fetches a customer the owner is fetching. The owner can tap any waiting customer, including one a technician is walking to, and that technician gives the customer up.
- **Freeze:** while the owner plays the mini-game (`servingCustomerId !== null`), while paused, and while a panel is open, staff stand still and their timers stop.
- **Look:** staff wear a light-teal áo bà ba (`STAFF_SHIRT = 0x8fd3c1`) with a cream apron edged in brown. The owner has no apron.
- Work on branch `step-1b-staff`. Never `git add -A`; list files. Commit with `git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "…"`, no attribution lines, messages as plain sentences.
- Anh has authorized merging into `master` and pushing once `npm test`, `npm run build` and the browser run-through all pass (Task 8). Nothing else outward-facing. `gh` is not installed; watch Actions with `curl -s "https://api.github.com/repos/FEAN9999/spa-indie-game/actions/runs?per_page=1"`.

## Review Focus

1. **The owner's customer stays the owner's.** With two customers waiting and the owner walking to the first, a new technician takes the second. Tapping a customer a technician is walking to hands that customer to the owner, and the technician turns to someone else. (Task 2.)
2. **Old shops open as they were.** A batch-1, 2 or 3 shop opens with no staff, the same customers on the same beds and seats, and from day 3 three candidates. A v4 shop saved mid-service reopens with the customer still on the bed and the technician finishing and paying. (Tasks 1 and 4.)
3. **Wages can push money below zero without sticking the shop.** On the next day, customers still come, the owner still serves and earns, and hiring is refused with its reason until money is back at zero or above. (Task 3.)
4. **Furniture never strands staff.** Furniture dropped on a staff member's tile steps them aside, and they still reach their customer. A tired one in a shop with no towel cabinet rests where they stand. (Task 3.)
5. **Letting go mid-service.** The customer is still finished and paid, the technician walks out, the day still ends, and the wage is counted once. (Task 3.)

---

### Task 1: Staff rules, candidates and hiring

**Files:**
- Create: `src/sim/staff.ts`, `tests/sim/staff.test.ts`, `tests/sim/spa-staff.test.ts`, `tests/fixtures/save-v3.json`
- Modify: `src/config.ts`, `src/sim/spa.ts`, `src/strings/vi.ts`, `tests/sim/helpers.ts`, `tests/sim/save.test.ts`

**Interfaces:**
- Produces, in `config.ts`, every number from the staff rules table, named:
  - `STAFF_CAP = { receptionist: 1, technician: 3 }`, `CANDIDATES_PER_DAY = 3`, `RECEPTIONIST_CHANCE = 1 / 3`, `RARE_CHANCE = 0.1`
  - `WAGE_BASE = 40000`, `WAGE_PER_DOT = 5000`, `LEVEL_WAGE_RAISE = 5000`, `LEVEL_XP = [0, 3, 8, 15, 25]`
  - `STAFF_WORK_MS_SLOW = 24000`, `STAFF_WORK_MS_STEP = 3000`, `STAFF_REST_MS = 35000`
  - `STAFF_STAR_ODDS = { three: [0, 0.1, 0.25, 0.45, 0.65], one: [0.4, 0.25, 0.1, 0.05, 0] }`
  - `GREET_PATIENCE_BASE = 1.15`, `GREET_PATIENCE_PER_DOT = 0.02`, `GREET_TIP_PER_DOT = 0.05`, `STAFF_TIP_PER_DOT = 0.05`
- Produces, in `staff.ts`:
  - `type StaffRole = 'receptionist' | 'technician'`, `STAFF_ROLES: StaffRole[]`.
  - `STAT_KEYS = ['skill', 'speed', 'friendly', 'stamina'] as const`, `type StatKey`, `type StaffStats = Record<StatKey, number>`.
  - `interface Candidate { name: string; role: StaffRole; look: Look; stats: StaffStats; wage: number; rare: boolean }`.
  - `type StaffTask = { kind: 'fetch'; customerId: number } | { kind: 'serve'; customerId: number; stationId: number; leftMs: number; totalMs: number } | { kind: 'rest'; leftMs: number } | { kind: 'exit' }`.
  - `interface Staff extends Candidate { id: number; level: number; xp: number; pos: Vec; facing: Facing; path: Tile[]; task: StaffTask | null; sinceRest: number; leaving: boolean }`.
  - `wageFor(stats): number`, `makeCandidate(rng: Rng, taken: string[]): Candidate`, `workMs(speed): number`, `walkSpeed(speed): number`, `restAfter(s: Pick<Staff, 'role' | 'stats'>): number`, `staffStars(skill: number, roll: number): Stars`, `levelFor(xp: number): number`, `greetPatience(friendly): number`, `tipFactor(greet: number, technicianFriendly: number | null): number`.
  - `gainXp(s: Staff, rng: Rng): boolean`: adds 1 xp. When the level rises it raises a random stat below 5 (none if all are 5) and the wage by `LEVEL_WAGE_RAISE`, and returns true.
  - `makeCandidate` draws, in this order: role, rare, the four stats in `STAT_KEYS` order, the look (`randomLook`), then a name from `STAFF_NAMES` not in `taken`.
- Produces, in `vi.ts`: `export const STAFF_NAMES = ['Lan', 'Mai', 'Hoa', 'Cúc', 'Thảo', 'Hương', 'Linh', 'Ngọc', 'Trang', 'Vy', 'Tùng', 'Minh', 'Nam', 'Phúc', 'Khang', 'Bảo', 'Hùng', 'Tâm', 'An', 'Duy', 'Hạnh', 'Yến', 'Quân', 'Sơn'] as const`.
- Produces, on `SpaSim`:
  - `staff: Staff[] = []`, `candidates: Candidate[] = []`, `candidatesDay = 0`, private `nextStaffId = 1`.
  - `type HireProblem = 'money' | 'full'`. `hire(index: number): HireProblem | null` returns `'money'` while `money < 0` and `'full'` at the role's cap (not counting `leaving` staff). Otherwise it removes the candidate and adds a `Staff` with the next id, level 1, xp 0, `sinceRest` 0, `leaving` false, task null, standing on `grid.door` facing up. Money does not change.
  - `startDay()` refreshes the candidates when the new day is `>= UNLOCK_DAY.staff`: three `makeCandidate`s whose names avoid each other and the staff's, then `candidatesDay = day`. Earlier days draw nothing.
  - `buy` already refuses with `'money'` when money is negative; keep it so.
- Produces, in `tests/sim/helpers.ts`: `hireStaff(sim, role, stats = { skill: 3, speed: 3, friendly: 3, stamina: 3 }): Staff`. It appends a candidate with a fixed look and name and calls `hire` on it.

- [ ] **Step 1: Freeze the save format of today before changing anything.**
  - Write a throwaway `tests/make-v3.test.ts` that writes `JSON.stringify(sim.toSave(), null, 2)` to `tests/fixtures/save-v3.json` for this shop:
    - `new SpaSim({ rng: createRng(3), autoSpawn: false })`, with `setProfile` (a look other than the default and the name "Spa Gạch Bông").
    - `day = 4`, money 2 000 000, all `TUTORIAL_HINTS` plus `openBuild` marked.
    - Buy a bed at (6,2) and a `teaChest` on a valid floor spot.
    - Three customers seated with `seatAndWait`. The owner taps the second one's seat and plays until `inService`, so one customer is on bed 1 with `servingCustomerId` set and two wait on seats 1 and 3.
  - Run it once with `npx vitest run tests/make-v3.test.ts`, then delete it.
  - Add to `save.test.ts`: `opens a batch-3 shop as it was saved`. Day, money, items (with the bought bed and tea chest), every customer's bed and seat, and `servingCustomerId` match the fixture, and `serviceReady` is announced again.
  - Commit with "Freeze a batch-3 save as a test fixture".
- [ ] **Step 2: Write the failing tests** in `tests/sim/staff.test.ts`:
  - `pays 40 000 to 120 000 a day by stats`: all 1 gives 40000, all 5 gives 120000, `{ skill: 3, speed: 2, friendly: 1, stamina: 4 }` gives 70000.
  - `draws candidates`: over 2000 `makeCandidate(createRng(7), ['Lan'])`:
    - the receptionist share is within 0.28–0.39 and the rare share within 0.07–0.13
    - rare stats are all 4–5 and the others all 1–3
    - `wage === wageFor(stats)`, and the name is in `STAFF_NAMES` and never 'Lan'
  - `works 24 s at speed 1 and 12 s at speed 5, and walks 3.5 to 5.5 tiles a second`.
  - `rests after stamina + 2 customers, a receptionist after twice as many`: technician stamina 1 → 3, 5 → 7, receptionist stamina 1 → 6.
  - `turns skill into stars`:
    - `staffStars(1, 0)` is 2, `staffStars(1, 0.7)` is 1, `staffStars(5, 0.5)` is 3 and `staffStars(5, 0.99)` is 2.
    - The mean over rolls 0, 0.001, … 0.999 rises with skill and stays below 2.7 at skill 5.
  - `levels by experience`: `levelFor` of 0, 2, 3, 8, 15, 25 and 99 gives 1, 1, 2, 3, 4, 5, 5.
  - `raises the only stat below 5 and the wage on a level up`: xp 2, stats `{5,5,5,1}`, wage 100000. `gainXp` returns true, the level is 2, stamina is 2 and the wage is 105000. Called again at xp 3, it returns false.
  - `greets and tips by friendliness`: `greetPatience(1)` is 1.17 and `greetPatience(5)` 1.25 (toBeCloseTo). `tipFactor(0, null)` is 1, `tipFactor(4, null)` 1.2 and `tipFactor(0, 3)` 1.1.
- [ ] **Step 3: Write the failing tests** in `tests/sim/spa-staff.test.ts`:
  - `offers three new candidates each morning from day 3`: day 1 to 2 gives none; day 2 to 3 gives 3 with distinct names and `candidatesDay` 3. A hired name is not offered again the next morning.
  - `hires at once and for free`: money is unchanged, the candidate is gone, and the staff member stands on the door tile at level 1.
  - `refuses a second receptionist and a fourth technician`: each returns `'full'`. After `staff[0].leaving = true`, a replacement is hired.
  - `refuses to hire or buy while money is negative`: at money −1, `hire` gives `'money'` and `buy('plant', …)` gives `'money'`.
- [ ] **Step 4:** `npm test`. The new tests fail.
- [ ] **Step 5: Implement.**
- [ ] **Step 6:** `npm test` and `npm run build` pass.
- [ ] **Step 7: Commit** with "Add staff candidates, wages and hiring caps to the shop".

### Task 2: Technicians and the receptionist at work

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/types.ts`, `src/sim/save.ts`, `tests/sim/spa-staff.test.ts`

**Interfaces:**
- Consumes Task 1.
- Produces:
  - `Customer.greet: number`: the receptionist's friendliness when they greeted this customer, else 0. `parseSave` gives every saved customer without `greet` the value 0.
  - `SimEvent` gains `{ type: 'greeted'; staffId: number; customerId: number }`.
  - `SpaSim.receptionSpot(): Tile`: the first tile, in `flood` order from `OWNER_START` over walkable tiles, that touches a desk tile and is not `OWNER_START`. It is `OWNER_START` itself if there is none.
  - Private `homeOf(s)`: a receptionist's is `receptionSpot()`. The k-th technician (in `staff` order) gets the k-th tile of that flood that is neither `OWNER_START` nor the reception spot. `hire` sends the new person walking from the door to their home.
  - Staff walk at `walkSpeed(stats.speed)`, updated in `step` after the owner's task.
- **Technician with no task and not leaving:**
  - It picks a waiting customer when `free beds > fetches in progress`. Fetches in progress are the owner's (if `owner.task.kind === 'fetch'`) plus every technician's.
  - It skips customers the owner or another technician is fetching. Of the rest it takes the one with the largest `stateMs`, ties to the lower id.
  - It walks beside the seat, like the owner. If no path exists, it waits.
- **On arrival:** if the customer is no longer waiting, the technician drops the task. Otherwise it takes the first free bed exactly as the owner does, or drops the task if none is free. It sends the customer `toStation`, walks to the work tile, and sets `serve` with `leftMs = totalMs = workMs(speed)`.
  - When both have arrived, the customer becomes `inService`. `leftMs` counts down. At 0 the customer pays with `staffStars(skill, rng())` and the tip from `tipFactor(c.greet, friendly)`, gets a review and mood, the bed is freed, the customer leaves, and the task clears.
  - `servingCustomerId` is never set by staff.
  - Pull the shared payment out of `completeService` into one private method that both use. The owner's payment uses `tipFactor(c.greet, null)`.
- **`tapTile` on a waiting customer** also clears any technician's fetch of that customer (task null, path empty).
- **Receptionist with no task:** it walks to `receptionSpot()` whenever it is not there.
  - It is "at the desk" when the task is null, the path is empty, it is not leaving, and it stands on the spot.
  - `spawnCustomer` greets the new customer when a receptionist is at the desk. It sets `patienceMs = patienceMaxMs = round(PATIENCE_MS × dayEase(day).patience × greetPatience(friendly))` and `greet = friendly`, and emits `greeted`.

- [ ] **Step 1: Write the failing tests** in `spa-staff.test.ts` (day 3, `autoSpawn: false`, staff hired with `hireStaff`):
  - `a technician walks in and serves the customer who has waited longest`:
    - A then B are seated. The technician fetches A, A lies on a bed, and `servingCustomerId` stays null.
    - About `workMs(3)` after A is `inService`, `paid` comes for A with amount 40000, `stats.served` is 1, A is `leaving` and the bed is free.
  - `the payment matches the review's stars`: the tip in `paid` equals `round(tipFor(40000, score − 2) × tipFactor(0, friendly))`, where `score` comes from the `review` event.
  - `a technician never takes the customer the owner tapped`: A and B are seated and the owner taps A's seat before the hire. The technician fetches B, and `serviceReady` comes for A.
  - `the owner can take a customer a technician is walking to`: while the technician walks to A, the owner taps A's seat. `owner.task` is fetch A, and no technician's task names A.
  - `a technician waits when every free bed is spoken for`: two beds and three seated customers. The owner fetches A, technician 1 fetches B, and technician 2 keeps no task until a bed frees up.
  - `works 24 s at speed 1 and 12 s at speed 5`: time from `inService` to `paid`, within ±100 ms.
  - `the shop stands still while the owner plays`: the owner serves A (`servingCustomerId` set) while a technician serves B. After `advance(10000)`, the technician's `leftMs` and position have not changed.
  - `the receptionist stands behind the desk and greets each new customer`:
    - Once the receptionist is at the desk, `receptionSpot()` touches a desk tile and is not `OWNER_START`.
    - A new customer gets `greet` = friendliness and `patienceMaxMs` from the formula, and `greeted` is emitted.
    - A customer who arrives while the receptionist is still walking in has `greet` 0.
  - `a greeted customer tips the owner more`: friendliness 4 and 3 stars give a tip of 12000.
- [ ] **Step 2:** `npm test`. The new tests fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** `npm test` and `npm run build` pass. The owner and customer tests pass unchanged.
- [ ] **Step 5: Commit** with "Let technicians fetch and serve waiting customers and the receptionist greet new ones".

### Task 3: Rest, levels, wages, letting go, new days and moved furniture

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/types.ts`, `tests/sim/spa-staff.test.ts`

**Interfaces:**
- Consumes Tasks 1–2.
- Produces:
  - **Experience and rest.**
    - `DayStats.wages: number`; `emptyStats()` starts it at 0.
    - `SimEvent` gains `{ type: 'levelUp'; staffId: number; level: number }`.
    - A served customer (technician) or a greeting (receptionist) runs `gainXp`, emitting `levelUp` when it returns true, and adds 1 to `sinceRest`.
    - At `restAfter` the staff member takes the `rest` task and walks to the rest spot: the nearest tile, in `flood` order over walkable tiles from where they stand, that touches a `cabinet` item. With no cabinet or none reachable, the spot is where they stand.
    - `leftMs` starts at `STAFF_REST_MS` and counts down once they arrive. At 0, `sinceRest` resets to 0 and the task clears.
  - **`fire(id: number): void`.**
    - It sets `leaving` and adds the wage to `stats.wages` at once.
    - A technician with a `serve` task keeps it. Anyone else drops their task and takes `exit`, walking to the door.
    - A technician finishing a service while leaving takes `exit`, not `rest`. A staff member with `exit` who reaches the door is removed from `staff`.
  - **Day end** (where `dayOver` is set): add the wages of everyone not leaving to `stats.wages`, subtract the whole `stats.wages` from money, remove the leaving staff, then emit `dayEnded`.
  - **`startDay()`:** every staff member goes to `homeOf` with an empty path, task null, `sinceRest` 0 and facing down.
  - **`settleCharacters()`** also steps staff aside and reroutes them to their goal:
    - fetch: beside the customer's seat
    - serve: the work tile
    - rest: the rest spot, found again
    - exit: the door
    - none: the end of their path, if still walkable

- [ ] **Step 1: Write the failing tests** in `spa-staff.test.ts`:
  - `a tired technician rests by the towel cabinet for 35 s, then works again`:
    - With stamina 1 and three customers served, the technician takes `rest` and stands on a tile beside a `cabinet` tile.
    - A customer seated meanwhile is not fetched before 35 s have passed, and is fetched after.
  - `with no towel cabinet a tired technician rests where they stand`: sell the cabinet first.
  - `the receptionist rests after twice as many greetings`: with stamina 1, six greetings send the receptionist to rest. A customer arriving then has `greet` 0, and the receptionist is back at `receptionSpot()` after the rest.
  - `each customer earns experience`: at xp 2, one service brings `levelUp` with level 2 and the wage up 5000.
  - `wages are taken when the day ends`: one technician with wage W. The clock is moved to `DAY_END_MIN` with no customers. `dayEnded` carries `wages` W, and money dropped by W.
  - `a shop with no staff pays no wages`: `stats.wages` is 0 and money is unchanged at day end.
  - `money below zero does not stop the shop`:
    - Money 10000 and three technicians drive money negative at day end. After `startDay`, a seated customer is fetched by a technician and paid.
    - `hire` gives `'money'` until money is ≥ 0, then hires.
  - `letting a technician go mid-service`:
    - `fire` while the customer is on the bed: the customer is still paid, then the technician takes `exit` and is removed at the door.
    - At day end `stats.wages` holds the wage once, and money dropped by it once.
  - `letting an idle or fetching staff member go`: they walk out at once, and a customer being fetched keeps `waiting` on their seat.
  - `each new day starts with staff at home and rested`: the receptionist is on `receptionSpot()`, technicians are on distinct tiles, tasks are null and `sinceRest` is 0.
  - `furniture dropped on a staff member moves them aside`:
    - An idle technician stands on tile T. Buying a plant on T moves them to a walkable tile.
    - A customer seated next is then fetched and paid.
- [ ] **Step 2:** `npm test`. The new tests fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** `npm test` and `npm run build` pass.
- [ ] **Step 5: Commit** with "Give staff rests, levels and a daily wage, and let the player let them go".

### Task 4: Save v4

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/spa.ts`, `tests/sim/save.test.ts`

**Interfaces:**
- Consumes Tasks 1–3.
- Produces:
  - `SAVE_VERSION = 4`. `SaveData` gains `staff: Staff[]`, `candidates: Candidate[]`, `candidatesDay: number` and `nextStaffId: number`. Its `stats` and `customers` carry `wages` and `greet`.
  - **Upgrades.** v1, v2 and v3 saves upgrade through the existing steps, then one more that adds the defaults from Global Constraints.
  - **v4 checks**, each failure a `SaveError`:
    - Every staff member has a whole-number id (no id twice), a string name, a role in `STAFF_ROLES`, and four whole-number stats from 1 to 5.
    - Each also has a level from 1 to 5, numeric `xp`, `wage` and `sinceRest`, a boolean `leaving`, and a `pos` with numeric x and y.
    - Every candidate has a string name, a known role, valid stats, a numeric wage and a boolean `rare`.
    - `candidatesDay` and `nextStaffId` are numbers.
  - **`toSave` / `fromSave`** carry the staff, candidates, `candidatesDay` and `nextStaffId` (never below any saved id + 1).
    - `fromSave` drops (sets to null) a fetch task whose customer is not waiting, and a serve task whose customer is gone or not on that bed.
    - When `day >= UNLOCK_DAY.staff` and `candidatesDay !== day`, `fromSave` draws the day's candidates.

- [ ] **Step 1: Write the failing tests** in `save.test.ts`:
  - `opens batch-1, 2 and 3 shops with no staff`: for each fixture, `staff` is empty, `stats.wages` is 0 and every customer's `greet` is 0. The v3 shop (day 4) has three candidates and `candidatesDay` 4.
  - `keeps a technician in the middle of a service`:
    - A JSON round trip (`toSave` → `JSON.stringify` → `parse` → `parseSave` → `fromSave`) keeps the staff member's id, name, stats, level, xp, wage, pos and task.
    - It keeps the customer on the same bed with `station.customerId` set, and the same candidate names.
    - Advancing then pays the customer.
  - `keeps a resting receptionist and a technician walking out`.
  - `drops a saved task whose customer is gone`: a fetch task naming customer 999 loads as null.
  - `rejects staff that are not staff`: role `'boss'`, a stat of 7 or a duplicate staff id each throw `SaveError`.
  - The existing too-new test uses `SAVE_VERSION + 1`, so it still passes.
- [ ] **Step 2:** `npm test`. The new tests fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** `npm test` and `npm run build` pass. Every earlier fixture test passes unchanged.
- [ ] **Step 5: Commit** with "Save the staff and the day's candidates, and open older shops with none".

### Task 5: Staff art

**Files:**
- Modify: `src/art/chibi.ts`, `src/art/palette.ts`, `src/art/fx.ts`, `src/view/CharacterView.ts`, `tests/art/chibi.test.ts`, `tests/art/palette.test.ts`

**Interfaces:**
- Produces:
  - **Palette.** `STAFF_SHIRT = 0x8fd3c1`, `CharacterColors.apron?: boolean`, and `staffColors(look: Look): CharacterColors`. It takes skin, hair and hair style from the customer palettes, `shirt: STAFF_SHIRT` and `apron: true`.
  - **Apron parts.** `apron-down` and `apron-side` in `chibi.ts` use the body's viewBox. They are cream `#FBF7EE` with a brown `#8A5634` edge and ink lines, and they are not tinted, so they get no `-line` texture.
    - Down: a bib with two straps to the collar and a skirt to the hem.
    - Side: a narrow strip on the front edge.
  - **`CharacterView` with `apron`.** The apron sits over the body inside `upper`, at the body's place.
    - Facing down it shows `apron-down`. Facing left or right it shows `apron-side`, flipped for left. Facing up it is hidden.
    - It hides whenever the body hides, and follows the body's breathing scale.
  - **Effects.** `fx.ts` gains `tea-cup`, about 56×56: a cream cup with a teal band on a saucer, two steam curls, and an ink outline. It also gains `spark`, about 24×24: a white four-point star with a thin ink outline, tinted where it is used.

- [ ] **Step 1: Write the failing tests:**
  - `chibi.test.ts`: the textures include `apron-down` and `apron-side` but not `apron-down-line`. `fxTextures()` includes `tea-cup` and `spark`.
  - `palette.test.ts`: `STAFF_SHIRT` is not in `SHIRT` or `OWNER_SHIRT`. `staffColors(look).apron` is true, and `ownerColors` and `lookColors` have no apron.
- [ ] **Step 2:** `npm test`. The new tests fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** `npm test` and `npm run build` pass.
- [ ] **Step 5: Commit** with "Draw staff in a light-teal áo bà ba with an apron, and a tea cup and sparks".

### Task 6: Staff in the shop

**Files:**
- Create: `src/view/StaffLayer.ts`
- Modify: `src/scenes/SpaScene.ts`, `src/view/Hud.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes Tasks 1–5.
- Produces:
  - `class StaffLayer`:
    - `constructor(scene: Phaser.Scene, room: RoomView)`
    - `update(sim: SpaSim, dt: number): void`
    - `handle(e: SimEvent): void` for `greeted` and `levelUp`
  - **`update`** keeps one `CharacterView(staffColors(look))` per staff id. It creates one for a new id and destroys one whose id is gone.
    - Position comes from `room.tileToWorld(pos)`, with depth `y`.
    - The pose is `walk` while the path is not empty, else `stand`.
    - A technician standing on the work tile with a `serve` task faces the bed, the way the owner does.
  - **Above the head:**
    - While resting (task `rest`, path empty): a gently bobbing `tea-cup`.
    - While working (task `serve`, path empty, customer `inService`): a progress bar like the patience bar. It fills teal by `1 − leftMs / totalMs`.
  - **`greeted`:** a speech pill above the receptionist with `staffGreet: 'Xin chào!'` (cream, ink outline, 30 px weight 800), shown for 1.5 s.
  - **`levelUp`:** about ten `spark`s tinted mustard, lotus and teal burst 80–120 px out from the head and fade in 0.7 s. `levelUp: 'Lên cấp!'` rises and fades over 1.2 s.
  - **`SpaScene`** creates the layer after the customers and calls `update(sim, dt)` every frame (`dt` 0 while frozen). `handle` routes `greeted` and `levelUp` to it.
  - **`Hud`** draws the money in `C.lantern` while money is negative, `C.ink` otherwise.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Check in the browser** at 402×874 (`npm run dev`, hooks on `window.__spa`), screenshotting each step:
  - **Hire.** On day 3, put a candidate in `sim.candidates` and hire it. The technician walks in from the door in a light-teal shirt and apron.
  - **Serve.** They fetch a waiting customer, lead them to a bed and work with the bar filling. Money floats up and a review bubble shows.
  - **Greet.** Hire a receptionist. They stand beside the desk, and the next customer brings "Xin chào!".
  - **Rest.** Set `sinceRest` to one below `restAfter`. After the next customer, the technician walks to the towel cabinet with a tea cup above the head.
  - **Level up.** Set `xp` to 2. The next customer brings sparks and "Lên cấp!".
  - **Mini-game.** While the owner plays, the staff stand still.
  - **Negative money.** Set money to −50 000. The top bar shows it in red.
  - **Console.** Clean.
- [ ] **Step 3:** `npm test` and `npm run build` pass.
- [ ] **Step 4: Commit** with "Show staff at work in the shop: walking, serving, greeting, resting and levelling up".

### Task 7: The staff panel, its button, the morning hint and the wages row

**Files:**
- Create: `src/scenes/StaffScene.ts`
- Modify: `src/view/Hud.ts`, `src/scenes/SpaScene.ts`, `src/scenes/SummaryScene.ts`, `src/main.ts`, `src/sim/types.ts`, `src/sim/tutorial.ts`, `src/strings/vi.ts`, `tests/sim/tutorial.test.ts`

**Interfaces:**
- Consumes Tasks 1–6.
- Produces:
  - **Hint.** `HINT_IDS` gains `'openStaff'`. `Pointer` gains `{ hint: 'openStaff' }`.
    - `pickHint` returns it after the build check, when `day === UNLOCK_DAY.staff && !hintDone('openStaff')`.
    - `Hud` exports `STAFF_PLATE_TOP = { x: navX(1), y: NAV_Y − PLATE_R }`.
    - The `navStaff` entry gets `hint: 'openStaff'`, so it wears "Mới" until the panel is first opened.
    - `SpaScene.updatePointer` shows `hintStaff` there, pointing down.
  - **Opening.**
    - `Hud` takes a fifth constructor argument `onStaff: () => void`. The unlocked staff plate calls it.
    - `SpaScene.openStaff()` has the same guards as `openBuild`. It sets `modal`, marks `openStaff`, and launches `StaffScene` with `StaffData { sim; intro: boolean; onChange: () => void; onClose: () => void }`.
    - `onChange` saves. `onClose` clears `modal` and saves.
  - **`StaffScene`**, registered in `main.ts`. It sits over the frozen shop and every tap stays in it:
    - **Frame.** A dim backdrop (ink 0.6, interactive), and `addCard(40, 230, 1000, 1760)`. The title `staffTitle` (60/800) is centred at y 310.
    - **Intro.** On the first open only, `staffIntro` (32/600, wrap 900) is centred at y 395.
    - **Tabs.** Two tabs, 440×120 at (300, 500) and (780, 500): `tabWorking` (with `{n}` = staff not leaving) and `tabHiring`. The active tab is primary, the other plain, with labels at 44.
    - **Rows.** Rows start at y 590, are 290 tall, and number up to 4. Thin `C.tileSeam` lines separate them. Each row has:
      - a standing `CharacterView` facing down with its feet at (150, y0 + 185)
      - the name (46/800) at (250, y0 + 50), with a mustard "Hiếm" pill (ink outline, 26/800) after it for a rare person
      - the role, plus ` · ` and `staffLevel` for staff, at (250, y0 + 108), 32/600
      - `wagePerDay` at (250, y0 + 160), 32/600
      - the action button, 260×120 at (860, y0 + 105), label 44
      - four stat blocks 225 wide from x 90, each with its label (26/600) at y0 + 215 and five dots (r 10, step 26) at y0 + 255. A dot is mustard up to the value and `C.tileSeam` beyond it, each with a 3 px ink outline.
    - **Đang làm.** Each staff member who is not leaving gets a plain `letGo` button. It opens a confirm card over the panel: `letGoConfirm` with the name and wage, plain `cancel` and plain `letGo`. The confirming button calls `fire`, then `onChange`.
      - With nobody working, `noStaff` is centred at y 800.
    - **Tuyển người.** Each candidate gets a primary `hire` button. When `hire` would refuse, the button is drawn at 45 % alpha, and tapping it toasts the reason:
      - `hireNoMoney` for money
      - `hireFullReceptionist` or `hireFullTechnician` for a full role
      - Otherwise it hires, calls `onChange` and redraws.
      - With no candidates left, `noCandidates` is centred at y 800.
      - While money is negative, `hireNoMoney` is shown in `C.lantern` at y 1785.
    - **Closing.** The primary `done` button, 560×130 at (540, 1895), closes the panel. Toasts sit at y 2060.
  - **Summary.** When `stats.wages > 0`, a `wages` row shows `formatMoney(-wages)` after the tips row, and `ROW_STEP` becomes 100 so the last row stays at y 1290. The balance value is drawn in `C.lantern` when money is negative.
  - **Strings:**
    - `staffTitle: 'Nhân viên'`, `tabWorking: 'Đang làm · {n}'`, `tabHiring: 'Tuyển người'`
    - `staffIntro: 'Thuê là làm ngay, không tốn tiền thuê. Lương trừ lúc hết ngày.'`
    - `roleReceptionist: 'Lễ tân'`, `roleTechnician: 'Kỹ thuật viên'`, `staffLevel: 'Cấp {n}'`, `wagePerDay: 'Lương {money}/ngày'`, `rare: 'Hiếm'`
    - `statSkill: 'Tay nghề'`, `statSpeed: 'Tốc độ'`, `statFriendly: 'Thân thiện'`, `statStamina: 'Sức bền'`
    - `hire: 'Thuê'`, `letGo: 'Cho nghỉ'`, `letGoConfirm: 'Cho {name} nghỉ việc? Hôm nay vẫn trả lương {money}.'`
    - `hireNoMoney: 'Tiền đang âm, chưa thuê thêm người được'`, `hireFullReceptionist: 'Tiệm đã có lễ tân'`, `hireFullTechnician: 'Tiệm đã đủ 3 kỹ thuật viên'`
    - `noStaff: 'Chưa có ai. Mở "Tuyển người" để thuê.'`, `noCandidates: 'Hôm nay không còn ai. Sáng mai có người mới.'`
    - `hintStaff: 'Đông khách thì thuê người phụ ở đây'`, `wages: 'Lương nhân viên'`

- [ ] **Step 1: Write the failing tests** in `tutorial.test.ts`:
  - `points at the staff button on the morning of day 3 until it is opened`: on day 3, after the tutorial hints, the result is `{ hint: 'openStaff' }`. After `markHint('openStaff')` it is null.
  - `no staff hand on a shop past day 3`: on day 4 it is null.
  - `the build hand still shows only on day 2`.
- [ ] **Step 2:** `npm test`. The new tests fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Check in the browser** at 402×874 with cleared storage, screenshotting each step:
  - **Day 2.** The staff plate is locked: "Mở vào ngày 3".
  - **Day 3 morning.** The plate shows "Mới", and the hand points at it with the line.
  - **First open.** The intro line shows, and "Tuyển người" lists three candidates. A rare one shows its tag; set `sim.candidates[0].rare = true` with stats 5 and reopen to see it.
  - **Hire.** Hire a technician and a receptionist. A second receptionist's button is faded, and tapping it toasts "Tiệm đã có lễ tân".
  - **Đang làm.** Both people show with their level and wage.
  - **Let go.** "Cho nghỉ" opens the confirm card. "Thôi" keeps the person. "Cho nghỉ" lets them go, and they walk out after closing.
  - **Negative money.** At −50 000, the hiring tab shows the red note, and "Thuê" toasts "Tiền đang âm, chưa thuê thêm người được".
  - **Day end.** The summary has "Lương nhân viên" with the wages, and the balance is red if negative.
  - **Reload.** The staff and the candidates are as left.
  - **Old shop.** Load `save-v3.json` (day 4). The plate shows "Mới", there is no hand, and the panel has three candidates.
  - **Console.** Clean, and no text is cut.
- [ ] **Step 5:** `npm test` and `npm run build` pass.
- [ ] **Step 6: Commit** with "Open the staff panel from day 3: hire and let go, with the morning hint and the wages on the summary".

### Task 8: Whole-branch check and ship

- [ ] Run `npm test` and `npm run build`. Both must pass.
- [ ] Do a fresh browser run-through at 402×874 with the iPhone user agent on `npx vite preview --port 4173 --strictPort`:
  - day 1 to day 3
  - hire a technician and a receptionist, and watch a day with them
  - let one go
  - the day-end wages
  - reload
  - the v1, v2 and v3 fixtures in slots
  - the console stays clean
- [ ] Merge into `master` with `git checkout master && git merge --ff-only step-1b-staff && git push origin master`.
- [ ] Watch the Actions run with the `curl` above until it completes successfully. Check that `https://fean9999.github.io/spa-indie-game/version.json` shows the new commit, and that the staff plate opens on day 3 on the live site.
- [ ] Report to anh in Vietnamese.
