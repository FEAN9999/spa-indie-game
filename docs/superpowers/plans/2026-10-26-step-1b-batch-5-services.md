# Step 1b Batch 5: Face Mask, Massage and Five Customer Kinds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From day 4 the player can open two new services, face mask and massage, from a new "Dịch vụ" panel. Each new service has its own bed, its own mini-game and its own price. Customers come in five recognisable kinds that differ in patience, tips, favourite services and how harshly they review.

**Architecture:**
- First, the staff behaviour moves out of `src/sim/spa.ts` (862 lines) into `src/sim/crew.ts`, with no change to how it plays. The owner's chosen customer also stops losing the last bed to a technician.
- Services are pure data in a new `src/sim/services.ts`.
  - The mask chair and the massage bed are new `ItemKind`s in the existing `'bed'` group.
  - Each `Station` knows its service, and each `Customer` carries the service it wants.
  - Fetching, serving, paying and the busy toast all match on service.
- Customer kinds are pure data in a new `src/sim/customers.ts`. The sim draws a kind, then a service, at arrival.
- Each new mini-game copies the shampoo pattern: rules are a plain class in `src/sim` with unit tests, and the close-up is a Phaser scene over the frozen shop.
  - `SpaScene` picks the mini-game scene from the customer's service.
  - The star reveal and the two bars move into a shared view helper.
- Save goes to v5 with the open services and each customer's kind and service. Older shops open with shampoo only and their customers as office workers wanting shampoo.

**Tech Stack:** TypeScript ^7, Phaser ^4.2.1, Vite ^8.3, Vitest ^5. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-26-step-1b-batches-2-7-design.md`. This plan covers:
- section 9, the batch itself;
- section 4, the bans;
- section 6.3, the faint demo hand on a first mini-game;
- section 6.4, the "Mới" badge, morning hand and first-open line for the services button;
- section 8.2, technicians serve any service with a free matching bed;
- section 12, the tests.

## Global Constraints

### Rules carried over
- Free only. No new npm dependencies. All art is drawn in code as SVG strings, like `src/art/chibi.ts`.
- **Style A:** cream, wood and teal tones, a 4 px ink `#4A2E22` outline at canvas scale, chunky rounded shapes.
- Every player-visible string comes from `src/strings/vi.ts`.
- `src/sim/**`, `src/save/**`, `src/app/**`, `src/art/outline.ts` and `build/**` never import `phaser`, `src/view` or `src/scenes`. Art tests mock Phaser with `vi.mock('phaser', () => ({}))`.
- **Screen:** canvas 1080×2160. The primary target is iPhone 17 Safari (402×874).
  - Cards use `addCard` (paper, 4 px ink outline, radius 60). Buttons use `addButton` (primary teal, plain cream).
  - Font: Be Vietnam Pro, weight 600 or 800. Every button is at least 120 px tall.
- **Old shops must survive.** A shop saved by any earlier version opens as the same shop.
  - `tests/fixtures/save-v1.json`, `save-v2.json` and `save-v3.json` pin the older versions. `save-v4.json` was written by the batch-4 code: day 5, a receptionist, two technicians each serving, and the owner fetching a third customer. It is committed with this plan.
  - New fields get defaults: `services: ['shampoo']`; on every customer `service: 'shampoo'` and `kind: 'office'`.
- **A new mini-game never runs with day ease.** Services open on day 4 (`UNLOCK_DAY.services`), and `dayEase(4+)` adds no time. The mask and massage rules take no `extraMs`.
- **Freeze:** the shop and staff stand still while the owner plays, while paused and while a panel is open, as now.

### Services (spec 9.1)

| id | name | price | to open | bed kind | bed name | bed price | busy toast |
|---|---|---|---|---|---|---|---|
| `shampoo` | Gội đầu | 40 000 | built in | `bed` | Giường gội | 300 000 | `stationsBusy` "Giường gội đầu đang bận" (kept) |
| `mask` | Đắp mặt nạ | 60 000 | 200 000 | `maskBed` | Ghế đắp mặt nạ | 350 000 | `busyMask` "Ghế đắp mặt nạ đang bận" |
| `massage` | Massage | 90 000 | 400 000 | `massageBed` | Giường massage | 450 000 | `busyMassage` "Giường massage đang bận" |

- **Opening:**
  - Services open in the order shampoo, mask, massage.
  - Opening is refused while money is below 0 (`'debt'`), below the cost (`'money'`), or out of order (`'order'`).
  - Opening an open service does nothing and charges nothing.
- **The new beds:**
  - `maskBed` and `massageBed` are 1×3 like `bed`, with beauty 0, group `'bed'`, and the same work tile beside the middle tile (right, or left when flipped).
  - Unlike `bed`, they need no back wall and have no wall lantern.
  - The build catalogue shows a bed kind only once its service is open. The dashed bed slots stay shampoo-only.
- **Who wants what:**
  - A service is *available* when it is open and the shop has at least one bed of its kind.
  - An arriving customer picks among available services only.
  - When the last bed of a service is sold, every customer still arriving, walking to a seat or waiting who wants it picks again among the services still available.
- **Arrivals:** the arrival gap is multiplied by `1 − 0.1 × (available services − 1)` (`SERVICE_ARRIVAL_STEP = 0.1`). This applies on top of the existing beauty and day factors.
- **Pay:** a customer pays the price of their service. The tip is computed on that price.

### Customer kinds (spec 9.3)

| kind | look | patience × | tip × by 1/2/3 stars | prefers | grading | from day | walk tiles/s | hard mini-game |
|---|---|---|---|---|---|---|---|---|
| `student` | backpack | 1 | 0.5 / 0.5 / 0.5 | shampoo | easy | 1 | 5 | no |
| `office` | tie | 0.8 | 1 / 1 / 1 | shampoo, mask | normal | 1 | 5 | no |
| `picky` | glasses, frown | 1 | 0 / 0 / 2 | any | harsh | 3 | 5 | **yes** |
| `elder` | grey hair | 1.3 | 0.8 / 0.8 / 0.8 | massage | easy | 4 | 3.5 | no |
| `celeb` | sunglasses, wide hat | 0.8 | 3 / 3 / 3 | massage, mask | harsh, every review counts twice | 6 | 5 | no |

- **Drawing a kind:**
  - From day 6, a roll below `0.05` makes a celeb (about 1 in 20).
  - Otherwise the kind is weighted among those whose day has come: student 3, office 3, picky 2, elder 2.
- **Drawing a service:**
  - When the customer's preferred services include an available one, a roll below `0.7` picks uniformly among those.
  - Otherwise, or when none of the preferred services is available, the pick is uniform among all available services.
  - "Any" means all three services are preferred.
- **Review from stars:**

  | grading | 1 star | 2 stars | 3 stars |
  |---|---|---|---|
  | easy | 4 | 5 | 5 |
  | normal (today's `REVIEW_FOR_STARS`) | 3 | 4 | 5 |
  | harsh | 2 | 3 | 5 |

  A customer who walks out angry still leaves `ANGRY_REVIEW` 1. A celeb pushes every review twice.
- **Patience:** `round(PATIENCE_MS × dayEase.patience × greetPatience (if greeted) × kind.patience)`, rounded once.
- **Tip:** `round(tipFor(price, stars) × kind.tip[stars − 1] × tipFactor(greet, technicianFriendly))`.

### Mini-games (spec 9.2)

Each mini-game takes about 15–25 s and gives 1–3 stars. Each is a card over the frozen shop, like the shampoo one. The first game of each kind shows a faint demo hand until the first touch. That hint is saved: `demoMask`, `demoMassage`.

**Shampoo, hard version (picky customers):** `FOAM_SWIPES_HARD = 9` and `DRY_SWIPES_HARD = 6`, instead of 6 and 4.

**Face mask.** The face is the unit circle in game coordinates `(x, y) ∈ [−1, 1]²`.

| rule | normal | hard (picky) |
|---|---|---|
| paint cells | a 20×20 grid over `[−1, 1]²`; a cell counts when its centre is in the unit circle | same |
| eye zones | circles at `(−0.38, −0.1)` and `(0.38, −0.1)`, radius `0.16` | radius `0.22` |
| brush | marks every face cell outside the eye zones whose centre is within `0.18` of the finger | same |
| coverage goal | `0.9` of the face cells outside the eye zones | `0.95` |
| eye error | +1 each time a stroke enters an eye zone; a stroke ends when the finger lifts | same |
| cucumbers | after the paint goal: drop a slice within `0.25` of an empty eye centre and it snaps there; anywhere else it returns to the tray | same |
| stars | done ≤ 15 000 ms → 3, ≤ 22 000 → 2, else 1; then −1 if errors ≥ 3, never below 1 | same |
| time limit | 25 000 ms → 1 star | same |

**Massage.** Back coordinates `(x, y) ∈ [−1, 1]²`. There are 10 points one after another, at the fixed positions `MASSAGE_POINTS`. Indices 3 and 7 are hold points, in turmeric yellow (`C.mustard`); the rest are tap points.

| rule | normal | hard (picky) |
|---|---|---|
| tap point | appears, its ring shrinks for `RING_MS` 1400, and "close" is the end of that shrink | 1000 |
| judging a tap | a press within `0.25` of the point: `abs(press − close)` ≤ 150 ms is perfect, ≤ 350 ms is good, any other press is a miss. A press elsewhere is ignored. No press by close + good-window is a miss | 100 / 220 ms |
| hold point | a press on it fills its ring over 1500 ms of holding; lifting early empties the ring; unfinished 4000 ms after it appears is a miss; a full ring is perfect | same |
| gap | the next point appears this long after the last one is judged: 400 ms | 250 ms |
| score | perfect 2, good 1, miss 0, out of 20 | same |
| stars | score ≥ 16 → 3, ≥ 10 → 2, else 1 | same |

Feedback words over the point: "Tuyệt!", "Tốt", "Trượt".

### Strings to add to `vi.ts`

All copy is exact:
- `serviceShampoo` 'Gội đầu', `serviceMask` 'Đắp mặt nạ', `serviceMassage` 'Massage'.
- `itemMaskBed` 'Ghế đắp mặt nạ', `itemMassageBed` 'Giường massage'.
- `busyMask` 'Ghế đắp mặt nạ đang bận', `busyMassage` 'Giường massage đang bận'.
- `servicesTitle` 'Dịch vụ'.
- `servicesIntro` 'Mở dịch vụ mới rồi mua giường cho dịch vụ đó ở nút Xây dựng.'
- `servicePrice` 'Khách trả {money}', `serviceNeeds` 'Cần {bed} · {money}', `serviceOpen` 'Mở · {money}'.
- `serviceOpened` 'Đang có', `serviceNoBed` 'Chưa có {bed}'.
- `serviceDebt` 'Tiền đang âm, chưa mở dịch vụ được', `serviceOrder` 'Mở {name} trước'.
- `serviceJustOpened` 'Đã mở {name}. Mua {bed} ở nút Xây dựng.'
- `hintServices` 'Mở thêm dịch vụ mới ở đây'.
- `maskPaint` 'Tô mặt nạ kín khuôn mặt, tránh vùng mắt', `maskCucumber` 'Kéo hai lát dưa leo đặt lên mắt'.
- `massageTap` 'Chạm vào điểm sáng khi vòng khép lại', `massageHold` 'Giữ ngón tay trên huyệt cho tới khi vòng đầy'.
- `massagePerfect` 'Tuyệt!', `massageGood` 'Tốt', `massageMiss` 'Trượt'.
- The mini-game end keeps `shampooDone` 'Xong rồi!' for all three.

### Workflow
- Work on branch `step-1b-services`. Never `git add -A`; list files. Never stage `CLAUDE.md`.
- Commit with `git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "…"`. No attribution lines. Messages are plain sentences about what the player gets.
- Anh has authorized merging into `master` and pushing once `npm test`, `npm run build` and the browser run-through pass (Task 8). Nothing else outward-facing.

## Review Focus

1. **A service with no bed.** If the last mask chair is sold, mask customers who are arriving, walking to a seat or waiting switch to a service the shop has. Nobody waits for a bed that is gone, and new arrivals never ask for it. (Task 2.)
2. **Old shops open as they were.** A v1–v4 shop opens with shampoo only, and its customers become office workers wanting shampoo. The v4 fixture's technicians finish their customers, who pay 40 000 plus tip. (Tasks 2 and 3.)
3. **Busy beds are per service.**
   - The owner taps a mask customer while every mask chair is taken: the toast reads "Ghế đắp mặt nạ đang bận" and the owner stays put.
   - There is one free chair and a technician is heading for another mask customer: the owner's customer gets the chair, and the technician turns back. (Tasks 1 and 2.)
4. **Pause or reload mid-game.** Pausing or reloading during a mask or massage service reopens that same mini-game for that customer. (Task 6.)
5. **Opening services.** These are refused, each with its reason: opening while in debt, opening without enough money, and opening massage before mask. Opening twice charges once. The new bed appears in build mode only after its service opens. (Tasks 2 and 5.)

---

### Task 1: Staff behaviour in its own file, and the owner keeps the last bed

**Files:**
- Create: `src/sim/crew.ts`
- Modify: `src/sim/spa.ts`, `src/sim/grid.ts`, `src/sim/types.ts`, `src/scenes/StaffScene.ts`
- Test: `tests/sim/spa-staff.test.ts`, `tests/sim/grid.test.ts`

**Interfaces:**
- Produces:
  - `src/sim/types.ts`: `export interface Mover { pos: Vec; facing: Facing; path: Tile[] }`. Move it out of `spa.ts`.
  - `src/sim/grid.ts`: `export const besideSeat = (grid: Grid, seat: Tile) => (t: Tile): boolean`, true when `t` is walkable and one step from `seat`. Use it in place of the four inline copies: `tapTile`, `ownerGoal`, `staffGoal` and `fetchWaiting`.
  - `src/sim/crew.ts`:
    - `export interface CrewHost { sim: SpaSim; rng: Rng; emit(e: SimEvent): void; walkTo(m: Mover, isGoal: (t: Tile) => boolean): Tile[] | null; sendToBed(c: Customer, station: Station): void; payFor(c: Customer, station: Station, stars: Stars, technicianFriendly: number | null): void; takeStaffId(): number }`
    - Exported functions holding today's staff behaviour: home tiles, the receptionist at the desk, candidates, hiring, letting go, the per-step update, fetch, serve, rest, XP, exit, walk goals, the day-start placement, the load-time task repair and the day-end wages.
    - `import type { SpaSim }` only, with no value import from `spa.ts`.
  - `SpaSim` builds one `CrewHost` in its constructor, with closures over its private helpers so they stay private, and calls into `crew.ts`. Its public API is unchanged: `staff`, `candidates`, `candidatesDay`, `hire`, `fire`, `receptionSpot`. It adds `hireProblem(index: number): HireProblem | null`.
  - `src/sim/spa.ts` ends at 650 lines or fewer.

- [ ] **Step 1: Write the failing tests** in `tests/sim/spa-staff.test.ts`:

```ts
it('tells why a candidate cannot be hired without hiring them', () => {
  const sim = newSim(); sim.startDay(); sim.startDay()
  expect(sim.hireProblem(0)).toBeNull()
  for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
  sim.candidates.push({ ...sim.staff[0], name: 'Extra' })
  expect(sim.hireProblem(sim.candidates.length - 1)).toBe('full')
  sim.money = -1
  expect(sim.hireProblem(0)).toBe('money')
  expect(sim.staff).toHaveLength(3)
})

it('gives the owner the last free bed when a technician is on the way to someone else', () => {
  // two beds taken, one free; a technician walking to A; the owner taps B
  // → the technician drops A (task null), B lies on the free bed, and no stationsBusy toast is emitted
})
```

In `tests/sim/grid.test.ts`, add a test for `besideSeat`: the four neighbours of a seat that are floor are true, and the seat, a wall and a tile two steps away are false.

- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/sim/spa-staff.test.ts tests/sim/grid.test.ts`. Expected: FAIL (`hireProblem`/`besideSeat` missing, and the technician keeps A).
- [ ] **Step 3: Move the staff code into `crew.ts`** behind `CrewHost`, with no behaviour change. Add `hireProblem` (`hire` calls it). Add `besideSeat`.
- [ ] **Step 4: Fix the bed race.** When the owner taps a waiting customer and the free beds number no more than the technicians' fetches still on their way, drop technicians' fetches, the last-hired first, until they are fewer than the free beds. A dropped technician is idle and picks again on the next step.
- [ ] **Step 5: Use the sim in `StaffScene`.** Replace `StaffScene.refusal` with `sim.hireProblem(i)` and delete the copy.
- [ ] **Step 6: Run the whole suite.** Run `npm test`. Expected: PASS, with every pre-existing test unchanged. Run `npm run build`. Expected: OK.
- [ ] **Step 7: Commit.** "Move the staff's behaviour into its own file, and let the owner keep the last free bed when a technician is heading for someone else".

### Task 2: Services in the shop

**Files:**
- Create: `src/sim/services.ts`
- Modify:
  - sim: `src/config.ts`, `src/sim/items.ts`, `src/sim/grid.ts`, `src/sim/types.ts`, `src/sim/economy.ts`, `src/sim/spa.ts`, `src/sim/crew.ts`, `src/sim/save.ts`
  - strings: `src/strings/vi.ts`
- Test: `tests/sim/services.test.ts` (new), `tests/sim/items.test.ts`, `tests/sim/economy.test.ts`, `tests/sim/save.test.ts`

**Interfaces:**
- Consumes: `CrewHost`, `besideSeat` (Task 1).
- Produces:
  - `src/sim/services.ts`:
    - `export type ServiceId = 'shampoo' | 'mask' | 'massage'`
    - `export const SERVICE_IDS: ServiceId[]`, which is also the opening order.
    - `export interface ServiceSpec { price: number; openCost: number; bed: ItemKind; name: StringKey; busy: StringKey }`
    - `export const SERVICES: Record<ServiceId, ServiceSpec>`
    - `export function serviceOfBed(kind: ItemKind): ServiceId | null`
    - `export type ServiceProblem = 'debt' | 'money' | 'order'`
  - `config.ts`: `SERVICE_PRICE`, `SERVICE_OPEN_COST`, `SERVICE_ARRIVAL_STEP = 0.1`. Remove `SHAMPOO_PRICE` once nothing uses it.
  - `items.ts`:
    - `maskBed` and `massageBed` go right after `bed`, so `ITEM_KINDS` lists the beds together.
    - `workTile` covers every `'bed'`-group kind.
  - `grid.ts`: `buildGrid` marks every `'bed'`-group kind as bed cells with a work tile.
  - `build.ts`: `'bedWall'` stays for `kind === 'bed'` only.
  - `types.ts`:
    - `Station.service: ServiceId` and `Customer.service: ServiceId`.
    - Toast event: `{ type: 'toast'; key: 'stationsBusy' | 'busyMask' | 'busyMassage' }`.
  - `economy.ts`: `export const serviceArrivalFactor = (available: number): number`, equal to `1 − SERVICE_ARRIVAL_STEP × (available − 1)`.
  - `SpaSim`:
    - `services: ServiceId[] = ['shampoo']`
    - `serviceProblem(id: ServiceId): ServiceProblem | null`
    - `openService(id: ServiceId): ServiceProblem | null`
    - `availableServices(): ServiceId[]`, in `SERVICE_IDS` order.
    - `spawnCustomer(opts?: { service?: ServiceId })`. Task 3 adds `kind`. With no service given, the draw is uniform among available services, from the sim's rng, after the look.
  - `save.ts`:
    - `SAVE_VERSION = 5`, and `SaveData.services: ServiceId[]`.
    - v1–v4 upgrade through `withShampooOnly`.
    - `parseSave` repairs instead of rejecting: unknown service ids are dropped, `'shampoo'` is always included, and a customer's unknown `service` becomes `'shampoo'`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/services.test.ts`. Each test builds its own shop with `autoSpawn: false`.

```ts
it('opens the mask, then massage, for their price, never in debt or out of order', () => {
  // day 4, money 1_000_000: openService('massage') → 'order'; openService('mask') → null and money 800_000;
  // openService('mask') again → null and money still 800_000; money 100_000 → openService('massage') → 'money';
  // money -1 → 'debt'; services stays ['shampoo', 'mask'] through the refusals
})
it('lets customers pick only services that are open and have a bed', () => {
  // mask open but no maskBed → 200 arrivals all want 'shampoo'; buy a maskBed → both appear in 200 arrivals
})
it('sends each customer to a bed of their service and charges its price', () => {
  // a mask customer tapped → lies on the maskBed (station.service 'mask'); completeService(…, 3) → paid amount 60_000, tip tipFor(60_000, 3)
})
it('says the right bed is busy and keeps the owner still', () => {
  // the only maskBed is taken; tap a waiting mask customer → toast { key: 'busyMask' }, owner.task null, owner.path empty
})
it('lets a technician serve only beds of the customer\'s service', () => {
  // one free shampoo bed, one waiting mask customer and no free mask bed → the technician stays idle
})
it('moves waiting customers to another service when the last bed of theirs is sold', () => {
  // a waiting mask customer; sell the only maskBed → customer.service is 'shampoo'
})
it('brings customers more often for each extra service the shop offers', () => {
  expect(serviceArrivalFactor(1)).toBe(1); expect(serviceArrivalFactor(3)).toBeCloseTo(0.8)
})
```

Also add these:
- `items.test.ts`: `workTile` of a `maskBed` and a flipped `massageBed`.
- `build`: a `maskBed` away from the back wall is allowed, but a `bed` there gets `'bedWall'`.
- `save.test.ts`:
  - v4 opens: `open(v4)` has `services` `['shampoo']` and every customer has `service` `'shampoo'`. Advance until both technicians have paid: each `paid` amount is 40 000.
  - A v5 round trip keeps `services` and `customer.service`.
  - `services: ['massage', 'x']` repairs to `['shampoo', 'massage']`.
  - Move the version-boundary tests to 5/6.

- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/sim/services.test.ts tests/sim/save.test.ts tests/sim/items.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement it as the Interfaces block says.**
  - The tap-time busy check counts the owner's own bed. The free beds of the customer's service must be more than zero; Task 1's drop rule then applies within that service.
  - A technician's `fetchWaiting` counts free beds and fetches per service.
  - `rebuildRoom` sets `Station.service` from the bed kind.
  - The re-pick after a sale lives in `changeRoom`.
- [ ] **Step 4: Run the whole suite.** Run `npm test`. Expected: PASS. The existing toast test in `spa-owner.test.ts` keeps its `stationsBusy` key. Run `npm run build`. Expected: OK.
- [ ] **Step 5: Commit.** "Let the shop open face masks and massage, each with its own bed and price, and save the services a shop has".

### Task 3: Five kinds of customer

**Files:**
- Create: `src/sim/customers.ts`
- Modify: `src/config.ts`, `src/sim/types.ts`, `src/sim/spa.ts`, `src/sim/crew.ts`, `src/sim/economy.ts`, `src/sim/save.ts`, `tests/sim/helpers.ts`
- Test: `tests/sim/customers.test.ts` (new), plus the existing sim tests listed in Step 4

**Interfaces:**
- Consumes: `ServiceId`, `availableServices()`, and `spawnCustomer(opts)` (Task 2).
- Produces:
  - `src/sim/customers.ts`:
    - `export type CustomerKind = 'student' | 'office' | 'picky' | 'elder' | 'celeb'` and `export const CUSTOMER_KINDS: CustomerKind[]`.
    - `export type Grading = 'easy' | 'normal' | 'harsh'`
    - `export interface KindSpec { fromDay: number; weight: number; patience: number; tip: [number, number, number]; prefers: ServiceId[]; grading: Grading; reviews: 1 | 2; speed: number; hard: boolean }`
    - `export const KINDS: Record<CustomerKind, KindSpec>`, with the Global Constraints table. Celeb has weight 0 and is drawn by its own roll.
    - `export function drawKind(day: number, rng: Rng): CustomerKind`
    - `export function drawService(kind: CustomerKind, available: ServiceId[], rng: Rng): ServiceId`
  - `economy.ts`: `reviewScore(stars: Stars, grading: Grading = 'normal'): number`.
  - `types.ts`: `Customer.kind: CustomerKind`.
  - `spawnCustomer(opts?: { kind?: CustomerKind; service?: ServiceId })` draws what it is not given, in this order: look, then kind, then service.
  - `tests/sim/helpers.ts`:
    - `seatAndWait(sim, opts?)` and `startService(sim, opts?)` pass `opts` to `spawnCustomer`.
    - With no `opts` they default to `{ kind: 'office', service: 'shampoo' }`, so the existing tests keep one known kind.

- [ ] **Step 1: Write the failing tests** in `tests/sim/customers.test.ts`:

```ts
it('meets only students and office workers on days 1 and 2, then picky ones, elders and from day 6 a few celebrities', () => {
  // drawKind over 2000 seeded rolls per day: day 2 ⊆ {student, office}; day 3 adds picky; day 4 adds elder;
  // day 6 has celeb at a share between 0.03 and 0.07
})
it('mostly picks a preferred service the shop has, else any it has', () => {
  // elder with ['shampoo','massage'] available: massage share in 1000 draws between 0.75 and 0.85 (0.7 + 0.3/2)
  // elder with only ['shampoo'] → always shampoo
})
it('reviews by grading', () => {
  expect([1, 2, 3].map(s => reviewScore(s as Stars, 'easy'))).toEqual([4, 5, 5])
  expect([1, 2, 3].map(s => reviewScore(s as Stars, 'harsh'))).toEqual([2, 3, 5])
})
it('pays a picky customer\'s tip only for three stars, and counts a celebrity twice', () => {
  // picky served with 2 stars → tip 0, review 3; with 3 stars → tip round(tipFor(40_000, 3) × 2) = 20_000
  // celeb served with 3 stars → two review events of 5; a celeb who walks out angry → two reviews of 1
})
it('gives elders more patience and a slower walk', () => {
  // day 4 elder: patienceMaxMs === round(PATIENCE_MS × 1.3); an elder takes longer than an office worker to reach the same seat
})
```

In `save.test.ts`:
- `kind` round-trips through a v5 save.
- An unknown or missing `kind` becomes `'office'`.
- Every customer of v1–v4 opens as `'office'`.

- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/sim/customers.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement it.**
  - Patience and tip multiply per the Global Constraints.
  - `payFor` and the angry path push each review `KINDS[kind].reviews` times, with `reviewScore(stars, grading)`.
  - Customers walk at `KINDS[kind].speed` when going to a seat, to a bed or to the door.
  - The re-pick after a sold bed (Task 2) uses `drawService`.
- [ ] **Step 4: Update the existing tests.** Where an existing test pins a tip, a patience or a review on a customer it did not spawn through the helpers, give that customer `{ kind: 'office', service: 'shampoo' }`. If its number then changes (office patience ×0.8; office tips and reviews equal today's), update the number from the table. List every test whose expected value changed in the report. Then run `npm test` (expected: PASS) and `npm run build` (expected: OK).
- [ ] **Step 5: Commit.** "Bring in students, office workers, picky customers, elders and the odd celebrity, each with their own patience, tips, favourite services and reviews".

### Task 4: The new beds and the customers in the shop

**Files:**
- Modify:
  - art: `src/art/furniture.ts`, `src/art/fx.ts`, `src/art/chibi.ts`, `src/art/palette.ts`
  - view: `src/view/CharacterView.ts`, `src/view/RoomView.ts`
  - scene: `src/scenes/SpaScene.ts`
- Test: `tests/art/furniture.test.ts`, `tests/art/chibi.test.ts`, `tests/art/palette.test.ts`

**Interfaces:**
- Consumes: `Customer.kind` and `Customer.service`, `SpaSim.availableServices()`, and the new item kinds.
- Produces:
  - **Furniture:** `FURNITURE.maskBed` and `FURNITURE.massageBed`, anchored like `bed` on their 1×3 footprint, with no wall basin. The mask chair is a padded mint-teal recliner, raised at the head. The massage bed is wood with a cream sheet, a face hole at the head and a rolled towel.
  - **Service icons** in `fx.ts`: `svc-shampoo`, `svc-mask` and `svc-massage`, round 56 px badges.
  - **Chibi parts** in `chibi.ts`, untinted like the apron:
    - `backpack-down`, `backpack-side`, `backpack-up`
    - `tie-down`
    - `glasses-down`, `glasses-side`, `face-frown`
    - `sunglasses-down`, `sunglasses-side`
    - `hat-down`, `hat-side`, `hat-up` (wide brim)
    - `mask-face`: a mint layer over the face with two cucumber slices on the eyes, for a customer lying face up.
  - **Palette:** `ELDER_HAIR = 0xd8d2c8` and `export function customerColors(look: Look, kind: CustomerKind): CharacterColors`. An elder's hair is `ELDER_HAIR`. `CharacterColors` gains `kind?: CustomerKind`.
  - **`CharacterView`:**
    - Draws the kind's parts for the current facing.
    - Hides the accessories while lying. A celebrity's hat and sunglasses come off on the bed.
    - `setMask(on: boolean)` shows `mask-face` over the face while lying face up.
    - Lying with facing `'up'` shows the back of the head with no face. That is the face-down massage pose.
  - **`SpaScene`:**
    - Customers are drawn with `customerColors(c.look, c.kind)`.
    - A customer lying on a massage bed faces `'up'`.
    - `setMask(c.service === 'mask' && c.state === 'inService')`.
    - While a customer waits and the shop offers more than one available service, their service icon sits centred just above the patience bar.

- [ ] **Step 1: Write the failing art tests.**
  - The texture maps hold every new key.
  - `PART_ANCHORS` has every new chibi part.
  - `customerColors(look, 'elder').hair === ELDER_HAIR`, and for a student it equals `lookColors(look).hair`.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/art`. Expected: FAIL.
- [ ] **Step 3: Draw the art and wire up `CharacterView` and `SpaScene`** as the Interfaces block says. Keep each accessory inside the chibi's outline style: 1.3-unit ink lines, chunky and rounded.
- [ ] **Step 4: Run the checks.** Run `npm test` (expected: PASS) and `npm run build` (expected: OK).
- [ ] **Step 5: Look at it in the dev server at 402×874.**
  - Seed a day-6 shop through `window.__spa.sim`: open both services, buy both beds, and spawn one customer of each kind with `spawnCustomer({ kind, service })`.
  - Screenshot the customers waiting, lying on each bed, and a mask customer in service.
  - Fix anything clipped or misaligned before committing. Save the screenshots in the plan workspace.
- [ ] **Step 6: Commit.** "Draw the mask chair, the massage bed and each kind of customer, with a service badge above the waiting".

### Task 5: The services panel

**Files:**
- Create: `src/scenes/ServicesScene.ts`
- Modify:
  - view: `src/view/Hud.ts`, `src/view/catalog.ts`
  - scenes: `src/scenes/BuildScene.ts`, `src/scenes/SpaScene.ts`
  - sim: `src/sim/types.ts`, `src/sim/tutorial.ts`
  - other: `src/main.ts`, `src/strings/vi.ts`
- Test: `tests/view/catalog.test.ts`, `tests/sim/tutorial.test.ts`

**Interfaces:**
- Consumes: `SERVICES`, `serviceProblem` and `openService` (Task 2), and the service icons (Task 4).
- Produces:
  - `HINT_IDS` gains `'openServices'`.
  - `pickHint` returns `{ hint: 'openServices' }` when `day === UNLOCK_DAY.services` and the hint is not done. It checks this after the build and staff hints.
  - `Hud`:
    - A sixth constructor argument, `onServices: () => void`.
    - The services plate has `hint: 'openServices'`, so it wears "Mới".
    - `export const SERVICES_PLATE_TOP`.
  - `catalogPage(group: ItemGroup, page: number, open: ServiceId[])`: the bed group lists only kinds whose service is in `open`.
  - `ServicesScene`:
    - Takes `{ sim, intro, onChange, onClose }`, like `StaffScene`.
    - Title, then the intro line the first time, then one row per service: icon, name, `servicePrice`, `serviceNeeds`.
    - On the right of each row:
      - open with a bed: the pill `serviceOpened`;
      - open with no bed: `serviceNoBed` in `C.lantern`;
      - otherwise: a primary `serviceOpen` button, faded when `serviceProblem` is not null.
    - A tap on a faded button toasts the reason: `serviceDebt`, `problemMoney` with the shortfall, or `serviceOrder` with the earlier service's name.
    - Opening a service toasts `serviceJustOpened`, saves and redraws the panel.
    - "Xong" at the bottom.

- [ ] **Step 1: Write the failing tests.**
  - `catalogPage('bed', 0, ['shampoo'])` gives `['bed']`.
  - `catalogPage('bed', 0, ['shampoo', 'mask'])` gives `['bed', 'maskBed']`.
  - `pickHint` on day 4 gives `openServices`, and after `markHint('openServices')` gives null.
  - On day 5, an old shop that never saw the hint gets no hand.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/view/catalog.test.ts tests/sim/tutorial.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement the panel.**
  - `SpaScene.openServices()` follows `openStaff()`: the same guards, `intro` taken from the hint, and `markHint` on open.
  - `updatePointer` shows `hintServices` at `SERVICES_PLATE_TOP`.
  - `BuildScene` passes `sim.services` to `catalogPage`.
  - Register `ServicesScene` in `main.ts`.
- [ ] **Step 4: Run the checks.** Run `npm test` (expected: PASS) and `npm run build` (expected: OK).
- [ ] **Step 5: Look at it in the dev server at 402×874.** Screenshot the panel before opening a service, after opening the mask with no chair yet, and with everything open. Check that no text is cut off.
- [ ] **Step 6: Commit.** "Open the services panel from day 4: open face masks and massage there, and find their beds in build mode once open".

### Task 6: The face-mask mini-game

**Files:**
- Create: `src/sim/mask.ts`, `src/art/maskArt.ts`, `src/scenes/MaskScene.ts`, `src/view/miniGame.ts`
- Modify:
  - sim: `src/config.ts`, `src/sim/shampoo.ts`, `src/sim/types.ts`
  - scenes: `src/scenes/ShampooScene.ts`, `src/scenes/SpaScene.ts`, `src/scenes/BootScene.ts`
  - other: `src/main.ts`, `src/strings/vi.ts`
- Test: `tests/sim/mask.test.ts` (new), `tests/sim/shampoo.test.ts`, `tests/art/maskArt.test.ts` (new)

**Interfaces:**
- Consumes: `KINDS[kind].hard` (Task 3) and `Customer.service` (Task 2).
- Produces:
  - `src/sim/mask.ts`:
    - `export type MaskPhase = 'paint' | 'cucumber' | 'done'`
    - `export class MaskGame`, with:
      - `constructor(hard = false)`
      - `phase`, `elapsedMs`, `errors`, `readonly limitMs`
      - `paint(x: number, y: number): void` and `lift(): void`
      - `placeCucumber(x: number, y: number): 0 | 1 | null`, returning the eye it snapped to.
      - `tick(ms: number): void`
      - `coverage(): number`, `progress(): number`
      - `eyes(): { x: number; y: number; r: number }[]`
      - `stars(): Stars | null`
  - `ShampooGame`: `constructor(extraMs = 0, hard = false)`.
  - `src/view/miniGame.ts`:
    - `export interface MiniGameData { look: Look; kind: CustomerKind; extraMs: number; hard: boolean; demo: boolean; onDone: (stars: Stars) => void }`
    - `export function drawBars(g, progress, timeLeft)`
    - `export function revealStars(scene, stars, onDone)`. `ShampooScene` now uses both and takes `MiniGameData`.
  - `HINT_IDS` gains `'demoMask'`.
  - `SpaScene`:
    - On `serviceReady` it launches `MINI_GAME_SCENE[c.service]`: shampoo `'ShampooScene'`, mask `'MaskScene'`. Task 7 adds massage.
    - It passes `hard: KINDS[c.kind].hard` and `demo: !hintDone(demo hint of that service)`.
    - `pendingService` keeps the scene key with the data.
    - Until Task 7 lands, a massage `serviceReady` falls back to `'ShampooScene'`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/mask.test.ts`:

```ts
it('fills to the goal by painting the face outside the eyes, then waits for cucumbers', () => {
  // sweep paint(x, y) over the unit disc on a 0.1 grid → phase 'cucumber', coverage() ≥ 0.9, errors counted for the eye passes
})
it('counts one error per stroke that enters an eye, not per move', () => {
  // paint(-0.38,-0.1); paint(-0.37,-0.1); lift(); paint(-0.38,-0.1) → errors 2
})
it('needs 95% and has bigger eyes for a picky customer', () => {
  expect(new MaskGame(true).eyes()[0].r).toBe(0.22)
})
it('snaps a slice near an empty eye and refuses one far from both', () => {
  // in phase 'cucumber': placeCucumber(-0.3,-0.05) → 0; placeCucumber(-0.38,-0.1) → null (eye 0 is full); placeCucumber(0.3,-0.1) → 1 → phase 'done'
})
it('stars by time, one fewer for three errors, and one star at the time limit', () => {
  // done at 10 s with 0 errors → 3; at 10 s with 3 errors → 2; at 20 s → 2; tick(25_000) before finishing → 1
})
```

In `shampoo.test.ts`, a hard game needs 9 foam swipes to reach rinse.

- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/sim/mask.test.ts tests/sim/shampoo.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `MaskGame` and the hard shampoo.**
- [ ] **Step 4: Build the scene.**
  - **Textures** in `maskArt.ts`: `mk-pillow`, `mk-hair` (tinted hair fanned on the pillow, with a `-line` layer), `mk-cucumber` and `mk-frown`.
  - **Face:** the face reuses `sh-head` and `sh-head-line`. The face circle maps to a 300 px radius on the card.
  - **Paint:** mint blobs (`#BFE8D2` with an ink edge at 0.3 alpha) are drawn into a `RenderTexture` clipped to the face circle, where the finger paints.
  - **Eye hit:** the frown overlay shows for 600 ms.
  - **Cucumbers:** two slices wait in a tray below the face and are dragged onto the eyes.
  - **Demo hand:**
    - paint phase: it sweeps side to side across the cheek;
    - cucumber phase: it drags from the tray to the left eye.
  - **Reveal:** the reveal and the bars come from `miniGame.ts`, and `__finishForTest` is kept as in `ShampooScene`.
- [ ] **Step 5: Run the checks.** Run `npm test` (expected: PASS) and `npm run build` (expected: OK).
- [ ] **Step 6: Play it in the dev server at 402×874.**
  - Open the mask service on a day-4 shop and seat a mask customer.
  - Play the mini-game by dispatching pointer events on the canvas.
  - Screenshot the paint phase, the cucumber phase and the reveal.
  - Pause mid-game and resume: the mask game reopens.
- [ ] **Step 7: Commit.** "Add the face-mask mini-game: paint the mint mask on without touching the eyes, then lay cucumber slices on them".

### Task 7: The massage mini-game

**Files:**
- Create: `src/sim/massage.ts`, `src/art/massageArt.ts`, `src/scenes/MassageScene.ts`
- Modify:
  - sim: `src/config.ts`, `src/sim/types.ts`
  - scenes: `src/scenes/SpaScene.ts`, `src/scenes/BootScene.ts`
  - other: `src/main.ts`, `src/strings/vi.ts`
- Test: `tests/sim/massage.test.ts` (new), `tests/art/massageArt.test.ts` (new)

**Interfaces:**
- Consumes: `MiniGameData`, `drawBars`, `revealStars` and the `MINI_GAME_SCENE` map (Task 6).
- Produces:
  - `config.ts`: `MASSAGE_POINTS: readonly { x: number; y: number }[]`, 10 points spread over the back. Keep them at least 0.5 apart and inside `[−0.7, 0.7]²`. Also the timings in the Global Constraints table.
  - `src/sim/massage.ts`:
    - `export type Judgement = 'perfect' | 'good' | 'miss'`
    - `export interface MassagePoint { index: number; kind: 'tap' | 'hold'; x: number; y: number; ring: number }`. `ring` is 1 at appearance down to 0 at close for a tap, and 0 to 1 as a hold fills.
    - `export class MassageGame`, with:
      - `constructor(hard = false)`
      - `phase: 'play' | 'done'`, `elapsedMs`, `results: Judgement[]`
      - `current(): MassagePoint | null`
      - `press(x: number, y: number): void`, `release(): void`, `tick(ms: number): void`
      - `score(): number`, `stars(): Stars | null`
      - `lastJudgement(): Judgement | null`
  - `HINT_IDS` gains `'demoMassage'`. `MINI_GAME_SCENE.massage = 'MassageScene'`, and the fallback from Task 6 is removed.

- [ ] **Step 1: Write the failing tests** in `tests/sim/massage.test.ts`:

```ts
it('judges a tap by how close to the ring closing it lands', () => {
  // first point: tick(RING_MS - 100), press(at the point) → 'perfect'; next point after the gap, press 300 ms early → 'good'
})
it('ignores a press away from the point and misses a point nobody touched', () => {
  // press(far) → results unchanged; tick past close + good window → 'miss'
})
it('fills a hold point only while held, and misses it after 4 s', () => {
  // reach index 3: press, tick(1000), release → ring back to 0; press, tick(1500) → 'perfect'
})
it('plays faster with tighter windows for a picky customer', () => {
  // hard: a press 120 ms off close → 'good', not 'perfect'
})
it('stars by score after the tenth point', () => {
  // all perfect → score 20, 3 stars; 5 perfect + 5 miss → 10, 2 stars; all miss → 1 star; phase 'done' after index 9
})
```

- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/sim/massage.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `MassageGame`.**
- [ ] **Step 4: Build the scene.**
  - **Textures** in `massageArt.ts`: `ms-back`, a back lying face down seen from above with the shoulders, a towel at the waist and the nape. It is tinted with the skin colour and has a `-line` layer. Also `ms-hair` (the back of the head, tinted hair), `ms-point`, `ms-ring` and `ms-hold`.
  - **Mapping:** the back's `[−1, 1]²` maps to a 360 px half-width on the card.
  - **Feedback word:** each judgement floats its word over the point for 600 ms.
  - **Demo hand:** it taps on the first point as its ring closes. On the first hold point it presses and holds.
- [ ] **Step 5: Run the checks.** Run `npm test` (expected: PASS) and `npm run build` (expected: OK).
- [ ] **Step 6: Play it in the dev server at 402×874.** Play a full round of massage. Screenshot a tap point, a hold point and the reveal. Reload mid-game: the massage game reopens for that customer.
- [ ] **Step 7: Commit.** "Add the massage mini-game: tap the glowing points as their rings close and hold the turmeric pressure points".

### Task 8: Check everything and ship

**Files:** none new. This task only fixes what the checks find, then merges and pushes.

- [ ] **Step 1: Run the tests and the build.** Run `npm test` and `npm run build`. Expected: all pass, and the build is OK.
- [ ] **Step 2: Play through it on the dev server** at 402×874 with an iPhone user agent:
  1. On a v4 fixture shop moved to day 4, the "Dịch vụ" plate wears "Mới" and the hand points at it with `hintServices`.
  2. Open the mask service. Build mode now offers the mask chair. Buy one and place it away from the back wall.
  3. Customers arrive wanting mask, with the badge above their head. Play a mask service.
  4. Open massage and buy its bed. Play a massage service.
  5. A technician serves a mask customer and a massage customer. Check the lying poses and the mask overlay.
  6. A picky customer gets the hard version: shampoo needs more swipes.
  7. Sell the only mask chair while a mask customer waits: they switch service.
  8. Reload in the middle of a mask service: the mask game reopens.
  9. Open the v1, v2, v3 and v4 fixtures.
  10. The console shows no errors.

  Save screenshots in the plan workspace.
- [ ] **Step 3: Check the production build.** Run `npx vite preview --port 4173 --strictPort` and open the v4 fixture. Expected: no console errors.
- [ ] **Step 4: Ship.** Run `git checkout master && git merge --ff-only step-1b-services && git push origin master`. Watch the Actions run with curl until it completes with success. Then check that `https://fean9999.github.io/spa-indie-game/version.json` shows the new commit and that the live site opens a day-4 shop with the "Dịch vụ" plate wearing "Mới".
