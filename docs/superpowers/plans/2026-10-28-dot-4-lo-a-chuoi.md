# Đợt 4 lô A: chuỗi và Bãi biển (save v23) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A shop at 3★ gets a fifth button, Chuỗi. It opens a map where the owner buys a beach branch for 5.000.000 đ and can walk into it. The branch has its own room, surfboard, tourists and staff, and keeps running while she is elsewhere, on one clock and one purse. Every evening's summary adds a chain block. Save version 23.

**Architecture:**
- **A branch is a `SpaSim` with `place` set.** It has its own rng and shares the main shop's purse. `src/sim/places.ts` holds the place data and the pure price rule.
- **A new `Chain` (`src/sim/chain.ts`) owns the main shop and its branches.**
  - It runs the shop the owner is in, then every other shop for exactly the ms that shop ran.
  - It routes the events of the shops she is away from.
  - It is the save: the main shop's save carries `place` and `chain`.
- **`SpaScene` drives `chain.active()`.**
  - Switching shops saves, then restarts the scene with the same in-memory `Chain` (no page reload). Held cards survive and no away pay fires.
  - `ChainScene` draws the map; `ChoiceScene` draws the two cards with buttons.

**Tech Stack:** Phaser 4, TypeScript 7, Vite 8, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-4-chuoi-spa-design.md`. Lô A covers:
- §5 (the bans);
- §7.1–7.3, the beach in §7.4, §7.5–7.8 and §7.11;
- §8.1–8.5, the tourist in §8.6 and v23 in §8.9;
- §9 lô A and §10.

**Visual reference:**
- The sketch `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\9ad07023-61da-40ae-b124-964377a3b4ba\scratchpad\sketch\template-chuoi.html`, an SVG in 1080×2160 game coordinates. It is also published at https://claude.ai/artifact/PQf7QfKtqDq6o7EyPPXLyd.
- The `c-*.png` pictures beside the sketch.
- Each art and scene step names the sketch lines it follows. Where the spec gives copy, the spec wins over the sketch.

**Baseline:**
- 1007 tests in 89 files pass on `dot-4-chuoi` at 2b8ba89.
- Typecheck: `npx tsc --noEmit`.
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.

## Global Constraints

- **Numbers** (`src/config.ts`, verbatim from spec §10):
  ```ts
  export const CHAIN_FROM_STARS = 3
  export const PLACES = {
    beach:   { stars: 3, price: 5_000_000,  arrival: 1.2, priceFactor: 1.0 },
    oldTown: { stars: 4, price: 8_000_000,  arrival: 1.0, priceFactor: 1.2 },
    uptown:  { stars: 5, price: 12_000_000, arrival: 0.8, priceFactor: 1.6 },
  }
  export const PLACE_KINDS = {
    beach:   { tourist: 5, student: 2, office: 1, picky: 1 },
    oldTown: { backpacker: 4, elder: 3, student: 1, picky: 1 },
    uptown:  { lady: 4, office: 3, picky: 2 },
  }
  ```
  - Mine: `CHAIN_FINISH_MS = 300_000`, the game ms a branch may be fast-run at day end.
  - `KINDS.tourist`: `{ fromDay: 1, weight: 0, patience: 0.9, tip: [1.5, 1.5, 1.5], prefers: ['mud', 'stone', 'massage'], grading: 'easy', reviews: 1, speed: 4, hard: false }`.
  - Auto-restock uses the existing `LOW_STOCK` (5), `RESTOCK_AMOUNT` (20) and `RESTOCK_PRICE`.
  - A branch has 1 floor, at most 3 technicians and 1 receptionist (`staffCap(role, 1)`).
- **The bans (spec §5):**
  - **A main shop with no branch plays exactly as before.** Every old test still passes, and `same-draws.test.ts` and its fixture are untouched.
  - **Nothing new draws from the main shop's rng.** A branch draws from `createRng(seed + 1 + PLACE_IDS.indexOf(place))`.
  - **The shops' clocks never differ.** They show the same day and the same minute.
  - **Nothing is paid or charged twice.** A reload never reopens a branch, never charges its price again and never pays away money again.
  - **Quests, badges, rank and Spa của năm count the main shop only.** The main shop counts as usual while the owner is away.
  - **The main shop's cards are never lost** to the owner being away (§7.8).
  - **An absent shop never lets the owner serve.** There are no hidden mini-games.
  - **An absent shop with no technician gets no customers.** Nobody walks out unfairly.
  - **Old saves open with nothing lost.**
  - **Text never overflows or overlaps** at iPhone width.
- **Save v23:**
  - `SaveData.place: PlaceId | null`.
  - `SaveData.chain: { at: PlaceId | null; told: boolean; branches: SaveData[] } | null`.
    - Only the main shop has a chain; a branch has `chain: null`.
    - `told` means the "Mở chuỗi spa" card has been shown.
  - A v22 or older save gets `place: null` and `chain: { at: null, told: false, branches: [] }`.
- **Sounds:** opening a branch plays `levelUp`; switching shops plays `chime`. No new sounds.
- **Copy, verbatim:**
  - **Names:**
    - nav "Chuỗi";
    - places "Tiệm gốc", "Bãi biển", "Phố cổ", "Khu cao cấp";
    - kind "Khách du lịch";
    - item "Ván lướt sóng";
    - decor phrase "ván lướt sóng".
  - **Ribbon at a branch:** "{shop} · {place}".
  - **Unlock card:**
    - head "Tiệm gốc đạt 3★";
    - name "Mở chuỗi spa";
    - line "Tiệm đạt 3 sao. Giờ chủ tiệm mở được chi nhánh ở nơi khác.".
  - **Map:**
    - title "Chuỗi spa";
    - subtitle "Tiệm gốc {n}★ · {k}/4 tiệm".
  - **Pins:** "Cần {n}★ · {price}", "Mở được · {price}", "Sắp có", "Tạm nghỉ", "{profit} hôm nay".
  - **Sheet status:**
    - main: "Hạng {n}★ · đủ các kiểu khách";
    - locked: "Mở khi tiệm gốc đạt {n}★ · {price}";
    - can open: "Mở được · tiệm gốc đang {n}★";
    - not ready: "Sắp có";
    - absent with no technician: "Tạm nghỉ · chưa có thợ";
    - otherwise: "Đang mở".
  - **Sheet rows:**
    - "Khách riêng: {kind} · lượng khách ×{arrival}";
    - "Giá dịch vụ ×{factor}" (factors with a comma: "×1,2");
    - "Hôm nay: {n} khách · {m} bỏ về";
    - "Lãi hôm nay: {profit}";
    - "{t}/{tc} thợ · {r}/{rc} lễ tân";
    - "Kho đủ" or "Kho sắp hết: {items}";
    - "1 tầng, bày sẵn như tiệm ngày đầu, thêm {decor}.".
  - **Sheet buttons and lines:**
    - "Mở chi nhánh · {price}";
    - "Còn thiếu {money}" (the existing `problemMoney`);
    - "Đến tiệm";
    - "Chủ tiệm đang ở đây";
    - "Đã đóng cửa";
    - "Cần {n}★";
    - "Sắp có";
    - "Rời {place}: {n} khách đang chờ sẽ về, không đánh giá".
  - **Toasts:** "Đã mở chi nhánh {place}", "Chủ tiệm đến {place}", "Chủ tiệm về tiệm gốc".
  - **Notice when a branch has no technician:**
    - head "Chi nhánh {place}";
    - name "Chưa có thợ";
    - line "Vào Nhân viên để thuê người. Lúc chủ tiệm vắng mà chưa có thợ, tiệm treo biển Tạm nghỉ.".
  - **Closing card:**
    - kicker "20:00 · {place}";
    - title "Đóng cửa rồi";
    - lines "Chủ tiệm về tiệm gốc kiểm sổ." and, only with a technician, "Nhân viên chi nhánh làm nốt khách còn lại.";
    - button "Về tiệm gốc".
  - **VIP card:**
    - kicker "Tiệm gốc · khách VIP";
    - title "{name} đã đến tiệm gốc";
    - line "Chỉ chủ tiệm mới làm được. Chị chờ được một lúc, quá lâu thì chị về.";
    - buttons "Về ngay" and "Ở lại".
  - **Services row at a branch:** "Mở ở tiệm gốc".
  - **Summary:** "Cả chuỗi hôm nay", "Tổng".
  - **Signed money:** `{profit}` is `formatMoney` with a "+" in front when above 0.

## Plan Calls (mine, at planning)

- **Where the `Chain` lives across a switch:** in the scene's restart data, `SpaSceneData { chain, mainCards, arrived }`.
  - A restart makes a new `SaveSession` (it reads the slot as just written).
  - A restart does not load, does not pay away money and does not pause.
- **Branch room:** `BRANCH_LAYOUT` is `SPA_LAYOUT_1A` with `U` turned into `.`.
  - A branch therefore has no stairs. `maxFloors()` is 1 by itself, and `RoomView` hides the stairs, as in the sketch's beach room.
  - The room art already draws stairs cells as floor.
- **The surfboard:**
  - It is a 1×1 `giftOnly` decor piece, `surfboard`, with beauty 3 (like the jar and the areca).
  - It is put down with `gift: true` at tile (11, 10), so it can be moved but never sold.
  - That tile blocks no path and no spot.
- **Purse:** `SpaSim.purse = { money }`, and `money` becomes a get/set over it, so every `this.money += …` runs as before. A branch shares `main.purse`.
- **The ms rule:**
  - `step` returns whether it ran, and `advance(ms)` returns the ms it really stepped.
  - The other shops then run exactly that many ms, in `STEP_MS` chunks.
- **Auto-restock** runs on every step of an absent shop, not only after `sendToBed`. A shop left already low, or one that ran dry while the purse was short, buys as soon as the purse can pay.
- **Lô B places stay shut in lô A:**
  - `openProblem` returns `'stars'` while stars are short, so the pin reads "Cần 4★ · 8.000.000 đ" as in the spec.
  - Once stars suffice it returns `'soon'`, and the pin reads "Sắp có".
- **Services are opened at the main shop only.**
  - At a branch, `serviceProblem` returns a new `'main'` for any service not open, and `openService` refuses it.
  - The row reads "Mở ở tiệm gốc".
- **Event routing for the shops the owner is away from:**
  - Branch events are dropped.
  - The main shop's `vipArrived` goes to `vipCalls`.
  - These main-shop events go, in order, to `held`: `badge`, `questDone`, `festivalQuestDone`, `inspected`, `kolPosted`, `rivalBeaten`, `heart`, `gift`, `bookPage`, `recipeHint` and `dayEnded`.
  - Everything else is dropped.
  - The scene at the main shop feeds `held` through `handle`. `say`, `sayNext` and `floatHeart` skip a customer who has left.
- **The main shop's view cards** (`badgeQueue`, `inspectNote`) ride in `mainCards`. They are pumped only at the main shop. A branch pumps its own queue (the no-technician notice).
- **The unlock card** is a `GoldCard` pushed onto `badgeQueue` when the main shop is free and `chain.shouldTell()`. Being pulled, it follows the month card on the evening of 3★, and it shows once on first open for an old 3★+ shop.
- **The closing card's second line** shows only when the branch has a technician. Without one, the customers leave quietly and the line would be wrong.
- **`sync()`** copies `services`, `ownerLook`, `ownerOutfit`, `shopName` and `profileDone` from the main shop to every branch.
  - It runs in `open`, `goTo` and `startDay`.
  - The scene calls it after the owner card or a name edit saves. The owner card always edits `chain.main`.
- **Day end:**
  - `finishDay(capMs)` fast-runs each branch for up to `CHAIN_FINISH_MS`.
  - A branch still not over then gets `clearOut()` (every customer gone at once, staff tasks repaired) and one more step, which ends its day and pays its wages.
- **Summary fit:** with a chain block, the summary uses a compact layout from a pure `summaryLayout`. With no chain block, the layout is exactly today's.
- **At a branch,** the rank plaque and the today line are hidden. Rank and festivals belong to the main shop.

## Review Focus

1. **Reload or update while the owner is at the beach.**
   - She is back at the beach, and the money is the same.
   - Nothing is charged or paid again.
   - After 20:00 the closing card shows again.
   - Covered by the T4 round-trip tests; checked in the T9 browser pass.
2. **Switching while walking a customer to a bed, or leaving a shop with no technician and people waiting.**
   - That customer is back on a seat, with the stock returned.
   - The waiting customers leave with no review, no angry or lost count and no lost regular visit.
   - Covered by T2.
3. **An absent shop that ran an item to 0 while the purse was short** buys it as soon as the purse can pay. Covered by T2.
4. **The main shop's day ends while the owner is still at the beach** (a mini-game ran past 20:00).
   - The summary comes once, on return, with the chain block.
   - A reload in between gives the same.
   - Covered by T3 (`dayEnded` held while advancing) and T4 (`dayEnded` held on load at the beach).
5. **An old shop already at 4–5★** sees the unlock card once. Phố cổ and Khu cao cấp read "Sắp có" and cannot be opened. Covered by T3 (`'soon'`) and T8 (pin labels).

---

### Task 1: Places, the tourist and a branch's own rules

**Files:**
- Create: `src/sim/places.ts`, `tests/sim/branch.test.ts`
- Modify:
  - `src/config.ts`;
  - `src/sim/customers.ts`;
  - `src/sim/services.ts` (`ServiceProblem`);
  - `src/sim/spa.ts`;
  - `src/sim/regulars.ts` (the guest book counts main kinds only);
  - `src/sim/save.ts` (`oldShopKinds` and `repairBook` use `MAIN_KINDS`);
  - `src/view/guestBook.ts` (`kindRows` uses `MAIN_KINDS`);
  - `src/scenes/GuestBookScene.ts` (`KIND_NAME` typed by `MainKind`);
  - `src/view/CharacterView.ts` (`WORN.tourist`);
  - `src/strings/vi.ts`;
  - `tests/sim/helpers.ts`.

**Interfaces:**
- Produces from `src/sim/places.ts`:
  - `type PlaceId = keyof typeof PLACES`
  - `PLACE_IDS: readonly PlaceId[] = ['beach', 'oldTown', 'uptown']`
  - `isPlaceId(x: unknown): x is PlaceId`
  - `PLACES_READY: readonly PlaceId[] = ['beach']`
  - `BRANCH_LAYOUT: string[]`
  - `placePrice(price: number, place: PlaceId): number`, which is `Math.round(price * PLACES[place].priceFactor / 1000) * 1000`
- Produces from `customers.ts`:
  - `CustomerKind` gains `'tourist'`.
  - `MAIN_KINDS` lists the five old kinds; `CUSTOMER_KINDS = [...MAIN_KINDS, 'tourist']`.
  - `type MainKind = (typeof MAIN_KINDS)[number]` and `isMainKind(k: CustomerKind): k is MainKind`.
  - `drawKind(day, rng, pickyFactor = 1, weights?: Readonly<Record<string, number>>)`: with `weights`, there is no celeb roll, and the draw is weighted by `weights[k] ?? 0` over `CUSTOMER_KINDS` in order.
- Produces in `regulars.ts`:
  - `GuestBook.served: Record<MainKind, number>` and `kindsMet: MainKind[]`;
  - `noteServed(book, kind: MainKind)`.
  - `payFor` calls `noteServed` only when `isMainKind(c.kind)`. This keeps `spa-regulars.test.ts`'s five-kind `served` as it is.
- Produces `ServiceProblem` gaining `'main'`.
- Produces on `SpaSim`:
  - `place: PlaceId | null = null`
  - `purse: { money: number }` and `get money()` / `set money(v)`
  - `arrivalFactor(): number`: `1 / PLACES[place].arrival` at a branch, else `eventArrivalFactor()`
  - `static newBranch(place: PlaceId, main: SpaSim, rng: Rng): SpaSim`
- Produces `starShop(stars = 3, money = 20_000_000, seed = 1): SpaSim` in `tests/sim/helpers.ts`. It returns a day-40 main shop with mask and massage open, `rank.stars = stars` and `profileDone`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/branch.test.ts`:
  - **`placePrice`:**
    - (40_000, beach) → 40_000.
    - (45_000, oldTown) → 54_000.
    - (150_000, uptown) → 240_000.
    - (41_700, oldTown) → 50_000.
  - **`drawKind` at the main shop** (day 40, 3000 draws, pickyFactor 1 and 2) never returns `'tourist'`.
  - **`drawKind` with `PLACE_KINDS.beach`** (9000 draws):
    - It returns only tourist, student, office or picky.
    - The tourist share is within 5/9 ± 0.03.
  - **Kind lists:**
    - `MAIN_KINDS` equals the old five in order.
    - `kindRows(emptyBook())` has no tourist row.
    - The keys of `emptyBook().served` are exactly `MAIN_KINDS`.
    - Serving a tourist at a branch leaves `book.served` with those same keys.
  - **`newBranch('beach', starShop(), createRng(9))`:**
    - `place` is `'beach'`.
    - `day` and `clock.minutes` equal the main shop's.
    - `services` equals the main shop's but is not the same array.
    - Every stock item is at `STOCK_START`.
    - `staff` is `[]` and `candidates.length` is `CANDIDATES_PER_DAY`.
    - `maxFloors()` is 1, and `grid.stairs` is empty.
    - `items` equals `itemsFromLayout(BRANCH_LAYOUT)`.
  - **One purse:** `branch.money -= 1000` lowers `main.money` by 1000, and the reverse holds too.
  - **No draws from the main stream:**
    - Build two main shops from `createRng(5)` and open a branch from one.
    - Advance both by 60_000 ms.
    - Their `toSave()` are equal.
  - **Price:** at a beach branch whose main shop is 3★, `ownerServes(branch, 3).amount` is `SERVICES.shampoo.price`, with no rank uplift.
  - **Gates at a branch:**
    - `questsOpen()` is false.
    - `hintDone('tapCustomer')` is true.
    - `benchOpen()` is false with massage open.
    - `serviceProblem('steam')` is `'main'`.
    - `openService('steam')` returns `'main'` and leaves the money unchanged.
    - `arrivalFactor()` is `1 / 1.2`.
  - **A festival's first day:**
    - `branch.startDay()` into it emits no `festivalStarted`, `eventToday` or `hotStarted`.
    - `festivalServiceToday()` is null.
  - **A branch's day end on a judge day:**
    - `rank` is unchanged.
    - The money changes only by its wages.
    - `vip.booking` and `eventBook.plan` stay null.
  - **A branch with the owner, autoSpawn, run for a whole day:**
    - Every customer kind is a key of `PLACE_KINDS.beach`.
    - No customer is a regular, a VIP or Mi Mi.
- [ ] **Step 2: Run them:** `npx vitest run tests/sim/branch.test.ts` fails because `places.ts` is missing.
- [ ] **Step 3: Implement the places and the kind.**
  - Add the config numbers.
  - Write `places.ts`, with `PLACE_KINDS` typed loosely in config so that lô B kinds can be named there.
  - Add `KINDS.tourist`, `MAIN_KINDS`, `isMainKind` and the `drawKind` weights.
  - Add the string `kindTourist` ("Khách du lịch"). It is used by the map sheet in Task 8.
  - Set `WORN.tourist` to `[{ key: 'sunglasses', on: 'face' }]` for now (T5 adds the hat and the shirt).
  - `emptyBook`, `repairBook` (`served` and `kindsMet`), `oldShopKinds` and `kindRows` read `MAIN_KINDS`.
  - The customers' kind repair in `parseSave` keeps `CUSTOMER_KINDS`, so a branch's tourists load.
- [ ] **Step 4: Implement the branch rules in `spa.ts`.** When `place !== null`:
  - `spawnCustomer` draws with `PLACE_KINDS[place]`.
  - The arrival gap uses `arrivalFactor()` in place of `eventArrivalFactor()`.
  - `payFor`'s plain price is `placePrice(SERVICES[s].price, place)`, not `rankPrice`.
  - `questsOpen()` is false.
  - `checkBadges` and `findBadges` do nothing.
  - `festivalServiceToday()` is null.
  - `eventArrivalFactor()` and `eventPatienceFactor()` return 1.
  - `hintDone()` is always true.
  - `benchOpen()` is false.
  - `serviceProblem` returns `'main'` right after the already-open check.
  - `startDay` skips `planDay`, the rank month, the quests and the three morning events.
  - The day end skips judging, `planBooking` and `planEvent`.
- [ ] **Step 5: Implement `newBranch`.**
  - It builds a new `SpaSim({ rng, layout: BRANCH_LAYOUT })` with `place` set.
  - It copies `day`, `clock.minutes`, `services`, `shopName`, `ownerLook`, `ownerOutfit` and `profileDone` from the main shop.
  - It sets `purse = main.purse`.
  - It calls `refreshCandidates` with the branch's own crew host, so the candidates come from the branch's rng.
- [ ] **Step 6: Check.** `npx tsc --noEmit` and `npx vitest run` are green (1007 old tests plus the new ones), and `same-draws.test.ts` is unchanged.
- [ ] **Step 7: Commit:** "Add the places, the tourist and a branch's own rules: its kinds, prices, arrivals and the main-only features it never has"

### Task 2: The shop the owner is away from

**Files:**
- Create: `tests/sim/absent.test.ts`
- Modify: `src/sim/spa.ts`, `src/sim/crew.ts`

**Interfaces:**
- Consumes `starShop`, `newBranch` and `hireStaff` from Task 1 and the helpers.
- Produces on `SpaSim`:
  - `ownerHere = true`, which is not saved;
  - `ownerLeaves(): void`;
  - `ownerArrives(): void`, which puts the owner at `OWNER_START`, facing down, with no path and no task;
  - `hasTechnician(): boolean`, which counts technicians who are not `leaving`;
  - `leaversIfOwnerGoes(): number`, which is 0 with a technician, else the customers arriving, walking to a seat or waiting, plus the one the owner is walking to a bed;
  - `clearOut(): void`;
  - `advance(ms): number` and `update(dtMs): number`, each returning the ms really stepped (private `step(dt): boolean`).

- [ ] **Step 1: Write the failing tests** in `tests/sim/absent.test.ts`. Each test uses a beach branch from `starShop()` unless it says otherwise.
  - **The ms count:**
    - `advance(1000)` → 1000.
    - Paused → 0.
    - With `servingCustomerId` set → 0.
    - After `dayOver` → 0.
  - **Leaving mid-walk:**
    - Setup: the owner is walking a waiting shampoo customer to a bed, on day 40 with stock tracked.
    - After `ownerLeaves()`:
      - the customer is `toSeat` towards a free seat;
      - the station's `customerId` is null;
      - shampoo and towel are back to what they were;
      - `owner.task` is null and `ownerHere` is false.
  - **Leaving a fetch:** a fetch task is dropped.
  - **Quiet leave:**
    - Setup: no technician and 3 waiting customers, one of them a main-shop regular (run this case on the main shop).
    - After `ownerLeaves()`:
      - all 3 are `leaving` with `mood` null;
      - `reviews`, `stats.angry`, `stats.walkedAway` and `progress.total.lost` are unchanged;
      - the regular's book state is unchanged;
      - `leaversIfOwnerGoes()` was 3 just before.
  - **Tạm nghỉ:** absent with no technician, `advance(10 min)` emits no `customerArrived`, and the shop ends empty.
  - **Absent with a technician:** customers arrive, the technician serves them, and `main.money` goes up by what they paid.
  - **The last technician fired while absent:**
    - The next step sends the waiting customers away quietly.
    - The customer already in service with that technician finishes and pays.
  - **The crew while the owner is away** (main shop, absent):
    - A regular waiting with a free bed is fetched at once, with no `REGULAR_OWNER_MS` hold.
    - With a VIP waiting for massage and a free massage bed, the technician fetches another massage customer.
    - After `ownerArrives()`, both holds are back.
  - **Auto-restock** (absent, a technician, oil used by massage):
    - Oil at 6 and one taken: the next step brings it to 25, money falls by `RESTOCK_PRICE.oil` and `stats.restock` rises by the same.
    - The purse below the price: nothing is bought.
    - Oil at 0 and the purse refilled to the price: bought on the next step.
    - An item no open service uses: never bought.
    - With the owner here: never bought automatically.
  - **`clearOut`:**
    - Setup: at minute 1200, a waiting customer and a technician mid-serve.
    - After `clearOut()` and `advance(STEP_MS)`:
      - `customers` is `[]`;
      - every staff task is null;
      - `dayOver` is true;
      - `stats.wages` is the technician's wage.
- [ ] **Step 2: Run them:** `npx vitest run tests/sim/absent.test.ts` fails.
- [ ] **Step 3: Implement.**
  - **`ownerLeaves()`:**
    - A walk to a bed is undone: stock back by one of each `STOCK_USES` item when tracked, the station freed, the customer sent to the first free seat (or to `standSpot()` when there is none).
    - Then the task and path are cleared and `ownerHere` becomes false.
    - Then, with no technician, the shop leaves quietly.
  - **The private quiet leave** applies to customers `arriving`, `toSeat` or `waiting`: `freeSeat`, `mood = null`, `startLeaving`. There is no review, no count and no `loseVisit`.
  - **In `step`:**
    - The spawn block also needs `ownerHere || hasTechnician()`.
    - After the staff update, when `!ownerHere`: run the quiet leave if there is no technician, then buy each `lowStock()` item whose `RESTOCK_PRICE` the purse covers, with `restock(item)`.
  - **In `crew.ts`:** `ownersTurn` and `vipHeld` apply only when `sim.ownerHere`.
  - **`clearOut()`** empties `customers`, frees every seat and station, and clears staff tasks with the rule `repairAfterLoad` uses.
- [ ] **Step 4: Check.** `tsc` and `vitest` are green, and `same-draws` is unchanged.
- [ ] **Step 5: Commit:** "Let a shop run without its owner: staff serve, regulars and VIP beds are not held, it restocks itself, and with no technician it rests and its customers leave quietly"

### Task 3: The chain

**Files:**
- Create: `src/sim/chain.ts`, `tests/sim/chain.test.ts`

**Interfaces:**
- Consumes everything that Task 1 and Task 2 produce.
- Produces from `src/sim/chain.ts`:
  ```ts
  export type OpenProblem = 'open' | 'stars' | 'soon' | 'money'
  export type GoProblem = 'here' | 'notOpen' | 'closed'
  export interface ChainDayRow { place: PlaceId | null; profit: number }
  export class Chain {
    readonly main: SpaSim
    branches: SpaSim[]          // in PLACE_IDS order
    at: PlaceId | null
    told: boolean
    constructor(main: SpaSim, seed: number)
    active(): SpaSim
    shop(place: PlaceId | null): SpaSim | null
    chainShown(): boolean       // main.rank.stars >= CHAIN_FROM_STARS
    shouldTell(): boolean       // chainShown() && !told
    openProblem(place: PlaceId): OpenProblem | null   // order: open, stars, soon (not in PLACES_READY), money
    open(place: PlaceId): OpenProblem | null          // charges PLACES[place].price once, then sync()
    goProblem(place: PlaceId | null): GoProblem | null // 'closed' only for a branch once main.clock.isClosed
    goTo(place: PlaceId | null): GoProblem | null
    update(dtMs: number): number                     // clamps to MAX_FRAME_MS
    advance(ms: number): number
    startDay(): void
    finishDay(capMs?: number): void                  // default CHAIN_FINISH_MS
    sync(): void
    dayRows(): ChainDayRow[]                         // main first, profit = dayProfit(stats)
    leaveCount(): number                             // active().leaversIfOwnerGoes()
    takeHeld(): SimEvent[]
    takeVipCall(): VipId | null
  }
  ```
- Branch rng: `createRng(seed + 1 + PLACE_IDS.indexOf(place))`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/chain.test.ts`, with `new Chain(starShop(), 7)`:
  - **No branch plays the same:**
    - Build two main shops from the same seed.
    - Run one bare with `advance` and one through `chain.advance`, over a whole day.
    - Their `toSave()` are equal.
  - **`openProblem`:**
    - Beach at 2★ → `'stars'`.
    - Beach with money short → `'money'`.
    - oldTown at 3★ → `'stars'`, and at 4★ → `'soon'`.
    - Beach once opened → `'open'`.
  - **`open('beach')`:**
    - It takes 5_000_000 once, and a second call changes nothing.
    - `at` stays null.
    - `chainShown()` is false at 2★; `shouldTell()` is false once `told`.
  - **`goTo`:**
    - The problems: `'here'`; `'notOpen'` for oldTown; `'closed'` for beach after 20:00, while the main shop is still allowed after 20:00.
    - After `goTo('beach')`: `at` is `'beach'`, `main.ownerHere` is false and `beach.ownerHere` is true.
  - **The clock:**
    - With the owner at the beach, after 10 game minutes the two `clock.minutes` and the two `day` values are equal.
    - With the beach paused, `advance` returns 0 and the main minutes do not move.
    - The same holds with a beach customer in a mini-game.
  - **One purse:** a beach customer paying raises `main.money`.
  - **Events:**
    - At the main shop, beach events never reach `takeHeld()`.
    - While at the beach:
      - a main `badge` event comes out of `takeHeld()` in order;
      - `vipArrived` comes out of `takeVipCall()` once, then null;
      - `review` and `customerArrived` are dropped.
    - Events still queued on the shop being left go through the same routing.
  - **`dayEnded` while away:** the main shop ending its day while the owner is at the beach puts `dayEnded` in `takeHeld()`.
  - **`startDay()`:**
    - Both shops' `day` goes up by 1.
    - `at` is null; the main shop has the owner and the beach does not.
    - The beach's `services` include steam once the main shop opened it.
  - **`sync()`** copies `ownerOutfit` and `shopName`.
  - **`finishDay()`:**
    - With a beach customer in service at the main shop's day end: afterwards `beach.dayOver` is true and `beach.stats.served` went up.
    - With `finishDay(0)`: the `clearOut` path runs, and `beach.dayOver` is true with `customers` `[]`.
  - **`dayRows()`:** `[{ place: null, profit: dayProfit(main.stats) }, { place: 'beach', profit: dayProfit(beach.stats) }]`.
  - **Review Focus 5:** a 5★ main shop: `openProblem('oldTown')` and `openProblem('uptown')` are `'soon'`, and `open('oldTown')` leaves the money unchanged.
- [ ] **Step 2: Run them:** `npx vitest run tests/sim/chain.test.ts` fails.
- [ ] **Step 3: Implement `Chain`.**
  - **`advance(ms)`:**
    - `const ran = active().advance(ms)`.
    - Each other shop runs `advance(ran)`, then drains and routes its events.
    - It returns `ran`.
  - **`goTo`:**
    - It routes the left shop's queued events.
    - Then `ownerLeaves()`, `sync()`, `at = place`, and `ownerArrives()` on the new active shop.
  - **`startDay`:**
    - The main shop first, then each branch.
    - Then `at = null`, the `ownerHere` flags and `sync()`.
    - Branch morning events are dropped.
  - **`finishDay(capMs)`:**
    - For each branch not over, `advance(STEP_MS)` until `dayOver` or the cap is spent.
    - If the branch is still not over, `clearOut()` and `advance(STEP_MS)`.
    - Branch events are dropped.
- [ ] **Step 4: Check.** `tsc` and `vitest` are green.
- [ ] **Step 5: Commit:** "Add the chain: one clock and one purse for the main shop and its branches, opening and switching, and the main shop's cards kept while the owner is away"

### Task 4: Save v23

**Files:**
- Create: `tests/fixtures/save-v21.json`
- Modify: `src/sim/save.ts`, `src/sim/spa.ts` (`toSave`, `fromSave`), `src/sim/chain.ts`, `tests/sim/save.test.ts`, `tests/sim/chain.test.ts`

**Interfaces:**
- Consumes `Chain` from Task 3.
- Produces:
  - `SaveData.place: PlaceId | null`;
  - `SaveData.chain: ChainSave | null`, with `ChainSave = { at: PlaceId | null; told: boolean; branches: SaveData[] }` exported from `save.ts`;
  - `Chain.fromSave(data: SaveData, seed: number): Chain`;
  - `Chain.toSave(): SaveData`.
- `SpaSim.toSave()` writes `place` and `chain: null`.
- `SpaSim.fromSave` sets `place` from the data before anything else and builds a branch on `BRANCH_LAYOUT`.

- [ ] **Step 1: Freeze the v21 fixture before anything changes.**
  - With the current code (v21), write `tests/fixtures/save-v21.json` from a scratch script, the way `save-v20.json` was made.
  - The shop:
    - day 36;
    - `rank.stars` 3;
    - one technician;
    - mask and massage open;
    - an away book with 3 profits;
    - a numeric `savedAt`.
  - It is never edited afterwards.
- [ ] **Step 2: Write the failing save tests** in `tests/sim/save.test.ts`, in `describe('save version 23')`:
  - **The v21 fixture:**
    - It parses with `place: null` and `chain: { at: null, told: false, branches: [] }`.
    - It keeps day 36, 3★ and `savedAt`.
  - **The version list:** add 21 to the every-version list.
  - **Repairs,** each on a saved chain edited as JSON:
    - Two beach branches → the first is kept.
    - A branch at day 3, minute 600 → set to the main shop's day and minute.
    - `at: 'oldTown'` when only the beach is open → null.
    - A branch with `place` null, `'moon'` or a non-object → dropped.
    - A branch with a `chain` → `chain: null`.
    - A branch's `money: 999` → the main shop's money.
    - The main shop's `place: 'beach'` → null.
    - `told: 'yes'` → false.
- [ ] **Step 3: Write the failing chain-save tests** in `tests/sim/chain.test.ts`:
  - **Round trip with the beach open, at the beach, `told` true:**
    - Load with `Chain.fromSave(viaJson(chain.toSave()), 8)`.
    - `at` is `'beach'`, `main.ownerHere` is false and the beach has the owner.
    - The beach's items, staff and stock are equal.
    - `main.money` is unchanged: no second 5_000_000 is charged.
    - `beach.purse === main.purse`.
  - **Review Focus 4:** saving after the main shop's day ended with the owner at the beach, then loading, gives `takeHeld()` containing `dayEnded`.
  - **A broken branch:** a branch whose item sits on a wall (`SpaSim.fromSave` throws `SaveError`) is dropped, and the main shop loads.
  - **The saved shape:** `toSave()` has `place: null`. Its branches have `place: 'beach'` and `chain: null`.
- [ ] **Step 4: Implement.**
  - `SAVE_VERSION = 23`, and `parseVersioned` also accepts 21 and 22.
  - **Split `parseSave`:**
    - The present body becomes the private `parseShop(raw)`.
    - `parseSave` then forces `place = null` and sets `chain = repairChain(raw.chain, data)` with the rules tested above.
    - A branch that throws `SaveError` in `parseShop` is dropped.
    - The `at` value is checked against the branches kept.
  - **`Chain.fromSave`:**
    - It builds the main shop with `createRng(seed)` and each branch with its own rng.
    - It skips a branch whose `SpaSim.fromSave` throws `SaveError`.
    - It shares the purse and sets `at` and the flags.
    - It routes the queued load events of the shops the owner is away from.
- [ ] **Step 5: Check.** `tsc` and `vitest` are green, and `same-draws` is unchanged.
- [ ] **Step 6: Commit:** "Save the chain in version 22: branches inside the main shop's save, where the owner is, and the unlock card told"

### Task 5: Art for the beach shop, the tourist, the map and the Chuỗi icon

**Files:**
- Create: `src/art/beach.ts`, `src/art/map.ts`, `tests/art/beach.test.ts`
- Modify:
  - `src/art/room.ts` (export the helpers the beach reuses);
  - `src/art/furniture.ts`;
  - `src/art/chibi.ts`;
  - `src/art/fx.ts`;
  - `src/art/palette.ts`;
  - `src/sim/items.ts`;
  - `src/sim/places.ts` (`PLACE_DECOR`);
  - `src/sim/spa.ts` (`newBranch` lays the decor);
  - `src/view/CharacterView.ts`;
  - `src/view/RoomView.ts`;
  - `src/scenes/BootScene.ts`, `src/scenes/SpaScene.ts` (the `RoomView` construction);
  - `src/strings/vi.ts`;
  - `tests/art/furniture.test.ts`, `tests/art/chibi.test.ts`, `tests/art/fx.test.ts`, `tests/sim/branch.test.ts`.

**Interfaces:**
- Produces:
  - `beachRoomTexture(grid: Grid): string` and `mapTexture(): string` (viewBox `0 0 940 1040`);
  - the texture keys `'room-beach'`, `'chain-map'`, `'icon-chain'` and `'decor-surfboard'`;
  - the chibi parts `strawHat-down|side|up` and `flowerShirt-down|side|up`;
  - `ITEMS.surfboard = { w: 1, h: 1, price: 0, beauty: 3, group: 'decor', giftOnly: true, name: 'itemSurfboard' }` ("Ván lướt sóng");
  - `PLACE_DECOR: Partial<Record<PlaceId, { kind: ItemKind; x: number; y: number }>> = { beach: { kind: 'surfboard', x: 11, y: 10 } }`;
  - `new RoomView(scene, grid, place: PlaceId | null)`.

- [ ] **Step 1: Write the failing tests:**
  - **`tests/art/beach.test.ts`:**
    - The viewBox of `beachRoomTexture(buildGrid(shellOf(BRANCH_LAYOUT), []))` equals `roomTexture`'s for the same grid.
    - It differs from `roomTexture`.
    - Every hex in it is a value of `C`, checked the way `floors.test.ts` does.
    - `mapTexture()` has viewBox `0 0 940 1040`, and every hex in it is in `C`.
  - **`furniture.test.ts`:** add `'surfboard'` to the gift-piece list.
  - **`chibi.test.ts`:** the six new part keys exist and have anchors.
  - **`fx.test.ts`:** `'icon-chain'` exists.
  - **`branch.test.ts`:**
    - `newBranch` holds exactly one `surfboard` item, with `gift: true`, at (11, 10).
    - `placeProblem` for it among the other items, with `{ door, ownerStart: OWNER_START, floors: 1 }`, is null.
    - `beauty()` is 3 more than the same branch without it.
- [ ] **Step 2: Run them;** they fail.
- [ ] **Step 3: Draw the beach room after the sketch.**
  - Follow `SKINS.bien()` (lines 396–423) and `shell(place)` (485–493), with the picture `c-6b-bien.png`.
  - Sand-coloured plank floor.
  - White walls with sea-blue stripes.
  - A sea window on the back wall.
  - A few shells.
  - The same shop front and street as `roomTexture`.
- [ ] **Step 4: Draw the surfboard.**
  - Follow `renderBranch` (530–560): a gold board with a teal stripe, leaning at −6°.
  - `FURNITURE['decor-surfboard'] = { w: 1, h: 2.7, body }`, about 0.8 of the sketch's height, so it does not cover the row in front.
- [ ] **Step 5: Draw the tourist.**
  - Follow `STRAW_HAT` and `FLOWER_SHIRT` (209–221) and `LOOKS.tourist` (248–273).
  - Add the parts and their anchors in the existing pattern.
  - `WORN.tourist`: `flowerShirt` on the body, `strawHat` on the hair, `sunglasses` on the face.
- [ ] **Step 6: Draw the map and the icon.**
  - The map follows `drawMapArt` (790–830): a river, a few roads, rows of trees, the sea in the bottom right, and tall buildings near uptown.
  - `'icon-chain'` is a map pin, drawn like the other nav icons.
- [ ] **Step 7: Wire the art.**
  - Add the new colours to `C`.
  - `BootScene` registers `'room-beach'` (from `BRANCH_LAYOUT`'s empty grid) and `'chain-map'`.
  - `RoomView` uses `'room-beach'` for floor 1 at the beach and hides the rank plaque at a branch.
  - `newBranch` lays `PLACE_DECOR[place]` with the next item id and rebuilds the room.
  - `SpaScene` passes `this.sim.place` to `RoomView`.
- [ ] **Step 8: Check.** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 9: Commit:** "Draw the beach shop, its surfboard, the tourist, the chain map and the Chuỗi icon"

### Task 6: SpaScene drives the chain

**Files:**
- Create: `src/view/chain.ts`, `tests/view/chain.test.ts`, `src/scenes/ChoiceScene.ts`
- Modify:
  - `src/scenes/SpaScene.ts`, `src/scenes/PauseScene.ts`, `src/scenes/ServicesScene.ts`;
  - `src/view/today.ts`, `tests/view/today.test.ts`;
  - `src/main.ts`;
  - `src/strings/vi.ts`.

**Interfaces:**
- Consumes `Chain` (Task 3 and Task 4) and `RoomView`'s `place` (Task 5).
- Produces from `src/view/chain.ts`:
  - `placeName(place: PlaceId | null): string`;
  - `signedMoney(n: number): string`;
  - `interface ChoiceText { kicker: string; title: string; lines: string[]; buttons: string[] }`;
  - `closingCard(place: PlaceId, hasTech: boolean): ChoiceText`;
  - `vipCallCard(vip: VipId): ChoiceText`, with buttons `['Về ngay', 'Ở lại']`;
  - `noTechCard(place: PlaceId): GoldCard`, which is quiet and uses the staff icon on a mustard disc.
- Produces `ChoiceData { card: ChoiceText; onChoose: (i: number) => void }` and `ChoiceScene` (key `'ChoiceScene'`).
- Produces:
  - `export interface SpaSceneData { chain: Chain; mainCards: { badgeQueue: (BadgeId | GoldCard)[]; inspectNote: Extract<SimEvent, { type: 'inspected' }> | null }; arrived: boolean }`;
  - the field `chain: Chain`, which Task 7 and Task 8 read;
  - the private `switchShop(place: PlaceId | null)`.
- `PauseData` gains `save: () => SaveData`.

- [ ] **Step 1: Write the failing text tests:**
  - **`placeName`:** null → "Tiệm gốc", and `'beach'` → "Bãi biển".
  - **`signedMoney`:** 120_000 → "+120.000 đ", 0 → "0 đ", and −40_000 → "-40.000 đ".
  - **`closingCard('beach', true)`:** exactly the closing copy with both lines. With `false`, only the first line.
  - **`vipCallCard`** uses `VIP_TEXT[vip].name` in the title.
  - **`noTechCard('beach')`:** the three notice strings.
  - **`todayShown`:** null at a branch.
- [ ] **Step 2: Run them;** they fail.
- [ ] **Step 3: Build `ChoiceScene`.**
  - It follows the sketch's `vipCard` (931–948) and `closingCard` (949–972), with the pictures `c-10-vip.png` and `c-11-closing.png`.
  - Dim the screen and draw a goldPale card.
  - The kicker, then the title, then the lines wrapped at 740.
  - The buttons are stacked, the first one primary.
  - A tap stops the scene, then calls `onChoose(i)`.
- [ ] **Step 4: Wire SpaScene.**
  - **Create:**
    - `openShop` becomes `openChain(saved): Chain`, with `seed = Date.now()`.
    - `create(data?: SpaSceneData)`: with `data.chain`, it takes that chain, makes a new `SaveSession(store, () => chain.toSave(), reload)`, and skips load, away pay and pause.
    - `this.sim` is `chain.active()` everywhere it is today.
  - **The frame:** `update()` calls `chain.update(delta)` in place of `sim.update(delta)`.
  - **At the main shop:**
    - Restore `mainCards` into `badgeQueue` and `inspectNote`.
    - Feed `chain.takeHeld()` through `handle`.
    - `say`, `sayNext` and `floatHeart` return when the customer is no longer in `sim.customers`.
  - **At a branch:**
    - Keep `mainCards` aside, untouched, and pump only the branch's own `badgeQueue`.
    - `handle('dayEnded')` does nothing.
    - **The VIP card:** when the shop is free, `takeVipCall()` opens `ChoiceScene` with `vipCallCard`. "Về ngay" switches to the main shop.
    - **The closing card** opens when `clock.isClosed`, `servingCustomerId === null`, `owner.task?.kind !== 'serve'` and nothing modal is open. Its button switches to the main shop.
  - **`switchShop(place)`:**
    - Play `chime`.
    - Close a shutter with the place name in 300 ms.
    - Then `chain.goTo(place)`, `session.saveNow()` and `scene.restart({ chain, mainCards, arrived: true })`.
    - On an `arrived` create, open the shutter in 300 ms. Then:
      - at the main shop, toast "Chủ tiệm về tiệm gốc";
      - at a branch with a technician, toast "Chủ tiệm đến {place}";
      - at a branch without one, push `noTechCard`.
  - **The main shop's `dayEnded`:** `chain.finishDay()`, then `saveNow`, then the summary as today.
  - **`showRankCards`' `begin()`** calls `chain.startDay()`.
  - **Main-shop owner and data:**
    - The owner card and the wardrobe take `sim: chain.main`; after a save, `chain.sync()` and rebuild the owner.
    - `onReturn` and the open path call `chain.main.comeBack`.
    - The autosave reads `chain.main.profileDone`.
  - **Main shop only:** `showNewOutfits`, the morning banner and the tutorial pointers.
- [ ] **Step 5: Pause and services.**
  - `PauseScene`'s export and install copy call `params.save()`.
  - In `ServicesScene`, a `'main'` problem fades the row and shows "Mở ở tiệm gốc" in the action slot, before the recipe checks.
- [ ] **Step 6: Check.** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 7: Commit:** "Run the scene on the chain: switch shops with a shutter, keep the main shop's cards for the owner's return, and call her back for a VIP and at closing time"

### Task 7: The bottom bar for the chain

**Files:**
- Create: `src/view/nav.ts`, `tests/view/nav.test.ts`
- Modify: `src/view/Hud.ts`, `src/scenes/SpaScene.ts` (`updatePointer`, the Hud construction), `src/sim/types.ts` (`HINT_IDS`), `src/strings/vi.ts`, `tests/sim/save.test.ts`

**Interfaces:**
- Consumes `Chain` from Task 3 and `SpaScene.chain` from Task 6.
- Produces from `src/view/nav.ts`:
  - `type NavId = 'build' | 'staff' | 'services' | 'quests' | 'chain'`;
  - `navIds(chain: Chain): NavId[]`;
  - `navX(i: number, n: number): number`, which is `GAME_W / n * (i + 0.5)`.
- The `Hud` constructor gains `onChain: () => void` and `nav: () => NavId[]`.
  - `hud.plateTop(id: NavId): { x: number; y: number } | null` replaces the four `*_PLATE_TOP` exports.
  - `SpaScene` passes `() => navIds(this.chain)` and `() => this.openChainMap()`.
- Produces the private `SpaScene.openChainMap()`. In this task it only marks `'openChain'` on `chain.main`; Task 8 makes it open the map.
- `HINT_IDS` gains `'openChain'`.

- [ ] **Step 1: Write the failing tests:**
  - **`navX`:**
    - `navX(0, 4)` → 135 and `navX(3, 4)` → 945 (today's places).
    - `navX(0, 5)` → 108 and `navX(4, 5)` → 972.
  - **`navIds`:**
    - At a 2★ main shop → `['build', 'staff', 'services', 'quests']`.
    - At 3★ → the same plus `'chain'`.
    - At the beach → `['build', 'staff', 'services', 'chain']`.
  - **Saved hints:** in `save.test.ts`, `hints: ['openChain']` survives `parseSave`.
- [ ] **Step 2: Run them;** they fail.
- [ ] **Step 3: Implement.**
  - **The plates** are built from `nav()` and rebuilt in `update` when the list changes (the evening the shop reaches 3★).
  - **At 5 buttons** the plates have radius 56 and 30 px labels (sketch `drawNav`, 665–684). At 4 they are as today.
  - **The Chuỗi plate:**
    - goldPale, with a mustardDark ring;
    - `'icon-chain'`;
    - hint `'openChain'`, so it wears "Mới" until that hint is done;
    - no day lock.
  - **At a branch,** a teal ribbon reads "{shop} · {place}", at y 198, 64 px high (sketch 635–641).
  - **`updatePointer`** reads `hud.plateTop`.
- [ ] **Step 4: Check.** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 5: Commit:** "Give the bottom bar a fifth button, Chuỗi, from 3 stars, and four at a branch"

### Task 8: The map and the unlock card

**Files:**
- Create: `src/scenes/ChainScene.ts`
- Modify: `src/view/chain.ts`, `tests/view/chain.test.ts`, `src/scenes/SpaScene.ts`, `src/main.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes `Chain`, `'chain-map'`, `navIds`/`plateTop` and `switchShop`.
- Produces from `src/view/chain.ts`:
  - `type PinState = 'here' | 'open' | 'can' | 'lock' | 'soon'`;
  - `pinState(chain: Chain, place: PlaceId | null): PinState`;
  - `pinLabel(chain: Chain, place: PlaceId | null): string`;
  - `mapSub(chain: Chain): string`;
  - `interface Sheet { title: string; status: string; rows: string[]; button: { text: string; on: boolean }; short: string | null; warn: string | null }`;
  - `sheetOf(chain: Chain, place: PlaceId | null): Sheet`;
  - `unlockCard(): GoldCard`, with `'icon-chain'` on a mustard disc.
- Produces `ChainData { chain: Chain; onOpen: (place: PlaceId) => void; onGo: (place: PlaceId | null) => void; onClose: () => void }` and `ChainScene` (key `'ChainScene'`).

- [ ] **Step 1: Write the failing tests:**
  - **Pins at a 3★ main shop with 6_000_000 đ:**
    - The main pin is `'here'`, and its label is "{signedMoney(profit)} hôm nay".
    - The beach is `'can'`, "Mở được · 5.000.000 đ".
    - oldTown is `'lock'`, "Cần 4★ · 8.000.000 đ".
    - uptown is `'lock'`, "Cần 5★ · 12.000.000 đ".
  - **Pins after `open('beach')`:**
    - The beach is `'open'`, labelled with its profit.
    - With no technician, it reads "Tạm nghỉ".
  - **Review Focus 5:** at 5★, oldTown and uptown are `'soon'`, "Sắp có".
  - **`mapSub`:** "Tiệm gốc 3★ · 2/4 tiệm" with the beach open.
  - **The beach sheet before opening:**
    - status "Mở được · tiệm gốc đang 3★";
    - rows "Khách riêng: Khách du lịch · lượng khách ×1,2", "Giá dịch vụ ×1,0" and "1 tầng, bày sẵn như tiệm ngày đầu, thêm ván lướt sóng.";
    - button "Mở chi nhánh · 5.000.000 đ", on.
  - **The same sheet with 4_000_000 đ:** the button is off, and `short` is "Còn thiếu 1.000.000 đ".
  - **The beach sheet when open:**
    - The rows include "Hôm nay: 0 khách · 0 bỏ về", "Lãi hôm nay: 0 đ", "0/3 thợ · 0/1 lễ tân" and "Kho đủ".
    - The button is "Đến tiệm".
    - After 20:00 the button is "Đã đóng cửa", off.
  - **While at the beach:** its button is "Chủ tiệm đang ở đây", off.
  - **With the owner at a shop with no technician and 3 waiting:** `warn` on another pin's sheet is "Rời Bãi biển: 3 khách đang chờ sẽ về, không đánh giá".
  - **The main shop's sheet:** status "Hạng 3★ · đủ các kiểu khách".
  - **`unlockCard()`:** the three unlock strings.
- [ ] **Step 2: Run them;** they fail.
- [ ] **Step 3: Build `ChainScene`.**
  - It follows `drawMapCard` (862–876), the pins (831–856) and `drawSheet` (878–918), with the pictures `c-2-map.png`, `c-3-sheet-can.png`, `c-4-opened.png` and `c-5-sheet-lock.png`.
  - A full-screen card 40/230/1000/1770 with the title and `mapSub`, and close at (970, 300).
  - `'chain-map'` at FX 70, FY 380.
  - Four pins at the sketch's coordinates:
    - the main shop [440, 880], with the shop name on its sign;
    - the beach [760, 1170];
    - oldTown [230, 610];
    - uptown [850, 560].
  - Each pin is styled by its `PinState`, and the owner's head sits on the `'here'` pin.
  - Tapping a pin opens the sheet from y 1440: a small figure (the tourist for the beach), then the title, the status and the rows.
  - The warning strip sits at 1790, and the button at 1915.
  - The button calls `onOpen` or `onGo`.
- [ ] **Step 4: Wire SpaScene.**
  - **`openChainMap()`** also opens the map, with the same guard as the other panels, by setting `modal` and launching `ChainScene`. `onClose` clears `modal`.
  - **`onOpen`:** `chain.open`, then `levelUp`, a −price float, the toast "Đã mở chi nhánh {place}" and `saveNow`. The sheet redraws with "Đến tiệm".
  - **`onGo`:** stop the map, then `switchShop`.
  - **The unlock card:** in `update`, at the main shop, when `shopFree() && chain.shouldTell()`, push `unlockCard()`, set `chain.told = true` and `saveNow`.
  - **The hand** points at `hud.plateTop('chain')` while `chain.told && !chain.main.hintDone('openChain')` at the main shop.
- [ ] **Step 5: Check.** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 6: Commit:** "Add the chain map with its pins and sheet, the Mở chuỗi spa card, and opening the beach branch"

### Task 9: The chain on the summary, then the browser check and ship

**Files:**
- Modify: `src/view/summary.ts`, `tests/view/summary.test.ts`, `src/scenes/SummaryScene.ts`, `src/scenes/SpaScene.ts`

**Interfaces:**
- Consumes `ChainDayRow` and `chain.dayRows()`.
- Produces in `src/view/summary.ts`:
  - `chainSummaryRows(rows: ChainDayRow[]): { label: string; value: number }[]`, which gives the place names, then "Tổng";
  - `interface SummaryLayout { top; nameY; titleY; rowsTop; rowH; headingH; chainTop; chainRowH; buttonY; cardH }`, all numbers;
  - `summaryLayout(kinds: SummaryRow['kind'][], chainShops: number, notesH: number): SummaryLayout`.
- `SummaryData` gains `chain: ChainDayRow[]`, which is empty when there is no branch.

- [ ] **Step 1: Write the failing tests:**
  - **`chainSummaryRows`:** `[{ place: null, profit: 1_000_000 }, { place: 'beach', profit: -50_000 }]` → Tiệm gốc 1_000_000, Bãi biển −50_000, Tổng 950_000.
  - **With 0 chain shops,** the layout is exactly today's: top 420, nameY 485, titleY 565, rowsTop 650, rowH 90, headingH 64. `buttonY` and `cardH` follow today's formula.
  - **With chain shops:** top 200, nameY 262, titleY 340, rowsTop 410, rowH 66, headingH 50, chainRowH 58. The block starts 24 px under the rows: a heading, one row per shop, then Tổng.
  - **The worst case fits:**
    - 11 count or money rows, 2 headings, 2 shops and `notesH` 330.
    - `top + cardH ≤ GAME_H − 40`.
- [ ] **Step 2: Run them;** they fail.
- [ ] **Step 3: Implement.**
  - **`SummaryScene`** lays out from `summaryLayout`. It measures the notes first, then places them.
  - **With `chain.length > 0`,** it draws the tealPale block after the sketch's `summaryCard` (973–1016, picture `c-12-summary.png`):
    - the heading "Cả chuỗi hôm nay";
    - one row per shop with `signedMoney`;
    - a rule, then "Tổng".
  - **`SpaScene`** passes `chain.branches.length ? chain.dayRows() : []`.
- [ ] **Step 4: Check.** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 5: Commit:** "Add the chain's day to the summary, kept on screen with a compact layout"
- [ ] **Step 6: Run a dev preview at iPhone width (390 px).**
  - Use inject saves made from `save-v21.json` by a scratch script.
  - Check:
    1. **A 3★ v21 shop:**
       - The unlock card shows after the pause card, once (it is gone after a reload).
       - The hand points at Chuỗi with "Mới".
       - Five buttons and their labels fit.
    2. **The map:**
       - The main sign, "Mở được · 5.000.000 đ", "Cần 4★ · 8.000.000 đ" and "Cần 5★ · 12.000.000 đ".
       - With too little money: a faded button and "Còn thiếu …".
       - Opening plays the level-up sound, floats −5.000.000 đ and shows "Đến tiệm".
    3. **Going to the beach:**
       - A shutter under 1 s and the chime.
       - The beach room with the surfboard, the ribbon and four buttons.
       - The no-technician notice.
       - Hire a technician and buy a bed. The customers are tourists, students, office workers and picky ones.
       - The services rows read "Mở ở tiệm gốc".
    4. **Back at the main shop with a technician left at the beach:**
       - The beach's numbers on the map move.
       - A badge earned at the main shop while away (forced from the console) shows on return.
    5. **Leaving a branch with no technician and waiting customers:** the warning strip, and they leave quietly.
    6. **A VIP booked at the main shop while at the beach:** the VIP card, and "Về ngay" lands at the main shop with her waiting.
    7. **At the beach until 20:00:**
       - The closing card, then the summary with the chain block, inside the screen.
       - A reload on the closing card shows it again, with the money unchanged.
    8. **A 2★ shop:** four buttons, as before.
- [ ] **Step 7: Ship.**
  - Run the whole-branch review and fix what it finds. `npx vitest run` must be green.
  - Fetch, then check that `origin/master` is still an ancestor and that the branch holds only the spec, the plan and this lô's commits.
  - Fast-forward master, push, and record the ship in memory.
