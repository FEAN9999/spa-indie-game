# Đợt 2 Lô A: Regulars, Member Cards and the Guest Book Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eight hand-made regulars visit the shop. They gain hearts from good service and tell a short story in speech bubbles. At 3 hearts they get a member card, and at 5 hearts they give a gift. A guest book records the regulars and the five customer kinds. Save version 8 keeps all of it, and every older shop opens with an empty book.

**Architecture:**
- **`src/sim/regulars.ts`** is a new pure module. It holds:
  - the eight regulars' fixed data;
  - the `GuestBook` state;
  - the rules: morning plan, who is due, points and hearts, gifts.
- **`SpaSim` owns a `book`:**
  - It calls `planDay` in `startDay`.
  - It swaps a due regular in for a random arrival.
  - It scores visits in `payFor` and `loseCustomer`.
  - It emits new `SimEvent`s.
- **Staff leave a waiting regular to the owner** for 10 s of free-bed time (`crew.ts`).
- **The view:**
  - draws each regular's own accessory;
  - shows speech bubbles, a heart badge and floating hearts;
  - adds a guest-book button on the top bar and a new `GuestBookScene`.
- **Gift furniture** is offered at 0 đ in build mode, can be placed once, and can never be sold.
- Everything rule-like is Phaser-free and unit-tested, so it survives a later 3D view.

**Tech Stack:** TypeScript, Phaser ^4.2.1 (view only), Vite ^8.3, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-27-dot-2-khach-design.md` §6, Lô A, approved 2026-10-27. Also §2, §4 and §8. §7 (VIP) is Lô B and is **out of scope** here.

**Branch:** `dot-2-khach-quen`, cut from master `b1bed02`, where batch 7 sound is live.

## Global Constraints

- **Layering:**
  - `src/sim/**` never imports Phaser, `src/view/**`, `src/scenes/**`, `src/art/**` or `src/audio/**`. It may import `src/strings/vi.ts`, as `staff.ts` already does.
  - `src/strings/regulars.ts` imports only types.
- **All player-facing text lives in `src/strings/`.**
  - The UI strings go in `vi.ts`.
  - The regulars' names, jobs and lines go in a new `src/strings/regulars.ts`.
  - Every speech line is at most **60 characters**, so it fits in 2 bubble lines.
- **Save:**
  - `SAVE_VERSION = 8`.
  - Saves of versions 1–7 still open as the same shop, with an empty book.
  - A damaged `book` is repaired field by field, never a reason to lose the shop.
  - Unknown regular ids are dropped.
- **No RNG draws before day 7:** `planDay` returns before touching `rng` when `day < REGULARS_FROM_DAY`. This keeps every existing seeded test stable.
- **Hearts never go down.** A story once told is never locked again. Points never drop below the threshold of the hearts already reached.
- **At most 3 regulars a day.** A regular replaces a random arrival, so the day's customer count is unchanged. The one exception is chú Sáu's gift: one extra customer a day.
- **Scheduled meetings:**
  - The six scheduled regulars are met 2 days apart. The first meeting is the first `startDay` on or after day 7.
  - This holds for old shops too. One loaded on day 12 meets cô Hạnh on day 13, Vy on day 15, and so on.
- **Gift furniture:** offered at 0 đ with the label "Quà", placed once, movable, never sellable. Selling one returns the build problem `'gift'`, whose text is "Quà không bán được".
- **Style A:** cream cards with brown borders (`addCard`), buttons at least 120 px tall (`addButton`), all text through `t()` or `src/strings/regulars.ts`. Keep the 2D panels simple.
- **Numbers (config.ts):** copy them exactly.

  ```ts
  export const REGULARS_FROM_DAY = 7
  export const REGULAR_MEET_GAP_DAYS = 2
  /** A day's regulars come between these game minutes: 9:00 and 17:00. */
  export const REGULAR_VISIT_FROM_MIN = 540
  export const REGULAR_VISIT_TO_MIN = 1020
  export const REGULARS_PER_DAY = 3
  /** The chance a met regular comes on a given day, before and after their member card. */
  export const REGULAR_VISIT_CHANCE = { plain: 1 / 3, member: 1 / 2 } as const
  /** Points for 1, 2 and 3 stars, by who served; a walk-out costs HEART_POINTS_ANGRY. */
  export const HEART_POINTS = { owner: [0, 2, 4], staff: [0, 1, 2] } as const
  export const HEART_POINTS_ANGRY = -2
  /** Points at which hearts 1 to 5 are reached. */
  export const HEART_AT = [4, 8, 12, 16, 20] as const
  export const MEMBER_HEARTS = 3
  export const MEMBER_PATIENCE = 1.5
  /** Staff leave a waiting regular to the owner this long, counted only while a bed of their service is free. */
  export const REGULAR_OWNER_MS = 10_000
  /** How long a speech bubble stays, for a greeting and for a story line. */
  export const BUBBLE_MS = { greet: 4000, story: 6000 } as const
  ```

## Review Focus

1. **An old shop already past day 7 opens on the new version.** The regulars must start at the next morning and come one at a time, 2 days apart, never all at once. Test: Task 3, `starts an old day-12 shop's meetings at the next morning, two days apart`.
2. **A regular is mid-visit when the game saves and reloads** (waiting, on the bed, or leaving). They must still be the same regular, the visit must count exactly once, and they must not come in again that day. Tests: Task 2, `keeps a regular customer and the book through a round trip`; Task 3, `scores a regular served after a reload once`.
3. **The shop lacks a regular's favourite service, or the bed is sold while they wait.** They take a service the shop has, like any customer, and never get stuck. Test: Task 3, `gives a regular whose favourite is closed a service the shop has`.
4. **A regular waits while every bed is busy.** The 10 s owner window must not run down then. Once a bed frees, staff wait 10 s, and only then fetch. Test: Task 3, `staff wait 10 s of free-bed time before fetching a regular`.
5. **Gift furniture pending when build mode opens, across a reload.** It shows once at 0 đ, places once, and survives a save. Selling it is refused. Tests: Task 4, `places a pending gift once at no cost` and `refuses to sell a gift`; Task 2, the round trip.

---

## File Structure

| File | Role |
|---|---|
| `src/config.ts` | the numbers above |
| `src/sim/regulars.ts` (new) | `RegularId`, `REGULARS`, `GuestBook`, `emptyBook`, `heartsFor`, `planDay`, `dueRegular`, `addVisit`, `loseVisit`, `noteServed`, `bookOpen`, `isMember` |
| `src/sim/types.ts` | `Customer.regular`, `Customer.heldMs`, `DayStats.gifts`, new `SimEvent`s, new hint ids |
| `src/sim/items.ts` | three gift-only kinds, `ItemSpec.giftOnly`, `Item.gift` |
| `src/sim/save.ts` | v8: `book`, repairs, upgrades |
| `src/sim/spa.ts` | `book`, regular spawn and arrival swap, scoring, gifts, `placeGift`, sell refusal |
| `src/sim/crew.ts` | the owner window in `fetchWaiting` |
| `src/sim/build.ts` | `BuildProblem` `'gift'`, `PROBLEM_TEXT.gift` |
| `src/sim/tutorial.ts` | hints `regular` and `openBook` |
| `src/strings/vi.ts` | UI strings; drop Lan, Thảo, Vy and Hạnh from `STAFF_NAMES` |
| `src/strings/regulars.ts` (new) | names, jobs, intro lines, stories, greetings |
| `src/view/summary.ts` | a "Quà tặng" row under Thu |
| `src/view/catalog.ts` | gift entries first on the decor tab |
| `src/view/guestBook.ts` (new) | pure rows for the book |
| `src/view/SpeechBubble.ts` (new) | the bubble |
| `src/view/CharacterView.ts`, `src/art/palette.ts`, `src/art/chibi.ts` | each regular's accessory |
| `src/art/furniture.ts`, `src/art/fx.ts` | three gift pieces; heart, card and book icons |
| `src/view/Hud.ts` | the book button |
| `src/scenes/SpaScene.ts`, `src/scenes/BuildScene.ts`, `src/scenes/GuestBookScene.ts` (new), `src/main.ts` | wiring |
| `src/audio/cues.ts` | `heart` → `'star'` |
| `tests/sim/regulars.test.ts`, `tests/sim/spa-regulars.test.ts`, `tests/view/guestBook.test.ts` (new); `tests/fixtures/save-v7.json` (new); existing test files as named per task | tests |

---

### Task 1: The regulars and the guest book rules

**Files:**
- Modify: `src/config.ts` (constants above), `src/strings/vi.ts` (`STAFF_NAMES` loses `'Lan'`, `'Thảo'`, `'Vy'`, `'Hạnh'`; three item names), `src/sim/items.ts`, `src/view/catalog.ts`, `src/art/furniture.ts` (placeholders, see Step 3)
- Create: `src/sim/regulars.ts`
- Test: `tests/sim/regulars.test.ts`

**Interfaces:**
- Consumes: `Rng` (`src/sim/rng.ts`), `Stars` (`economy.ts`), `CustomerKind`, `KINDS` and `CUSTOMER_KINDS` (`customers.ts`), `ServiceId`, `Look`, and `ItemKind` (`items.ts`; the three gift kinds come in Task 4, so type `RegularGift.item` as `ItemKind` and use `'vase'` now, adding the other two in Task 4).
- Produces:

```ts
export type RegularId = 'hanh' | 'vy' | 'sau' | 'khoa' | 'tu' | 'ba' | 'thao' | 'lan'
/** Book order. */
export const REGULAR_IDS: RegularId[] = ['hanh', 'vy', 'sau', 'khoa', 'tu', 'ba', 'thao', 'lan']
/** Met on a schedule, in this order; Thảo and Lan only by introduction. */
export const SCHEDULED: RegularId[] = ['hanh', 'vy', 'sau', 'khoa', 'tu', 'ba']
export type RegularGift =
  | { kind: 'regular'; who: RegularId }
  | { kind: 'item'; item: ItemKind }
  | { kind: 'money'; amount: number }
  | { kind: 'extraCustomer' }
export interface RegularSpec { look: Look; kind: CustomerKind; likes: ServiceId; gift: RegularGift; introducedBy: RegularId | null }
export const REGULARS: Record<RegularId, RegularSpec>
export interface RegularState { meetDay: number | null; met: boolean; points: number; hearts: number; visitAt: number | null }
export interface GuestBook {
  regulars: Record<RegularId, RegularState>
  served: Record<CustomerKind, number>
  kindsMet: CustomerKind[]
  /** Gift furniture received and not yet placed, oldest first. */
  gifts: ItemKind[]
  extraCustomer: boolean
  extraAt: number | null
  boardGiven: boolean
}
export interface VisitResult { hearts: number; member: boolean; gift: RegularGift | null; board: boolean }
export function emptyBook(): GuestBook
export function heartsFor(points: number): number
export const isMember: (s: RegularState) => boolean        // hearts >= MEMBER_HEARTS
export const bookOpen: (b: GuestBook) => boolean           // some regular met
export function planDay(book: GuestBook, day: number, rng: Rng): void
export function dueRegular(book: GuestBook, minutes: number): RegularId | null
export function addVisit(book: GuestBook, id: RegularId, stars: Stars, byOwner: boolean, day: number): VisitResult
export function loseVisit(book: GuestBook, id: RegularId): void
export function noteServed(book: GuestBook, kind: CustomerKind): void
```

**`REGULARS` data:** looks are palette indices within `LOOK_COUNTS` (skin 4, hair 5, hairStyle 4, shirt 5).

| id | look `{skin, hair, hairStyle, shirt}` | kind | likes | gift | introducedBy |
|---|---|---|---|---|---|
| hanh | 1, 0, 3, 2 | office | massage | `{ kind: 'regular', who: 'thao' }` | null |
| vy | 0, 1, 1, 4 | student | shampoo | `{ kind: 'item', item: 'vyPainting' }` (Task 4) | null |
| sau | 2, 2, 2, 0 | elder | shampoo | `{ kind: 'extraCustomer' }` | null |
| khoa | 0, 0, 2, 3 | office | mask | `{ kind: 'money', amount: 300000 }` | null |
| tu | 1, 3, 3, 1 | picky | massage | `{ kind: 'item', item: 'silkScreen' }` (Task 4) | null |
| ba | 3, 4, 2, 2 | elder | massage | `{ kind: 'money', amount: 200000 }` | null |
| thao | 1, 0, 1, 1 | office | mask | `{ kind: 'regular', who: 'lan' }` | 'hanh' |
| lan | 2, 1, 0, 4 | student | mask | `{ kind: 'item', item: 'vase' }` | 'thao' |

**The rules:**

- **`planDay(book, day, rng)`, the morning plan.**
  1. Return at once when `day < REGULARS_FROM_DAY`.
  2. If no regular has a `meetDay` yet, set `SCHEDULED[i].meetDay = day + i * REGULAR_MEET_GAP_DAYS`.
  3. Clear every `visitAt`.
  4. **Forced:** every regular with `!met && meetDay !== null && meetDay <= day`, in `REGULAR_IDS` order.
  5. **Optional:** for each met regular in `REGULAR_IDS` order, draw `rng() < REGULAR_VISIT_CHANCE[isMember(s) ? 'member' : 'plain']`.
  6. Take forced, then optional, up to `REGULARS_PER_DAY`.
  7. Give each one `visitAt = REGULAR_VISIT_FROM_MIN + Math.floor(rng() * (REGULAR_VISIT_TO_MIN - REGULAR_VISIT_FROM_MIN))`.
  8. Set `extraAt` the same way when `extraCustomer`, else `null`.
- **`dueRegular`:** the regular with the smallest `visitAt <= minutes`, or null.
- **`addVisit`:**
  - Points rise by `HEART_POINTS[byOwner ? 'owner' : 'staff'][stars - 1]`, capped at `HEART_AT[4]`.
  - `hearts` rises to `heartsFor(points)` if that is higher.
  - `VisitResult.hearts` is the new heart count, or 0 when it did not change.
  - `member` is true when `hearts` crossed `MEMBER_HEARTS` on this visit.
  - **Reaching 5 hearts gives the gift, once,** and applies it to the book:
    - `regular`: `meetDay = day + 1` for `who`, if it is null.
    - `item`: push the item onto `gifts`.
    - `extraCustomer`: set `extraCustomer = true`.
    - `money`: returned only; the sim adds the money.
  - **The board:** when every regular has 5 hearts and `!boardGiven`, set `boardGiven`, push `'regularsBoard'` (Task 4) onto `gifts`, and return `board: true`.
- **`loseVisit`:** `points = max(hearts ? HEART_AT[hearts - 1] : 0, points + HEART_POINTS_ANGRY)`.
- **`noteServed`:** `served[kind]++`, and add `kind` to `kindsMet` if it is missing.
- **`emptyBook`:**
  - every regular `{ meetDay: null, met: false, points: 0, hearts: 0, visitAt: null }`;
  - `served` 0 for every kind;
  - `kindsMet: []`, `gifts: []`, `extraCustomer: false`, `extraAt: null`, `boardGiven: false`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/regulars.test.ts`. Use `createRng(n)` and a stub rng `() => u` where a draw must be pinned.
  - `heartsFor`: 0→0, 3→0, 4→1, 11→2, 12→3, 20→5, 99→5.
  - `does nothing and draws nothing before day 7`: a counting rng is never called for day 6, and the book is unchanged.
  - `schedules the six on the first planned day, two days apart`: planning day 7 gives `meetDay` 7, 9, 11, 13, 15, 17 in `SCHEDULED` order. Thảo and Lan stay null.
  - `starts an old shop's schedule at the day it is first planned`: planning day 12 gives 12, 14, …, 22.
  - `forces an unmet regular whose day has come`: day 7 plans cô Hạnh with `visitAt` in [540, 1020).
  - `keeps a missed meeting for the next day`: cô Hạnh unmet on day 8 is forced again.
  - `caps a day at three, forced first`: with the stub rng `() => 0`, five met regulars and one forced, the forced one and the first two met in book order are planned.
  - `uses the member chance`: with the stub rng `() => 0.4`, a plain regular does not come (0.4 ≥ 1/3) and a member does (0.4 < 1/2).
  - `dueRegular picks the earliest due`: visitAt 600 and 560 at minute 650 gives the one at 560. At minute 500 it gives null.
  - `scores visits by who served and the stars`: owner 3★ → 4 points; staff 2★ → 1; 1★ → 0; cap 20.
  - `reports a new heart and the member card once`: from 8 points, owner 3★ gives `{ hearts: 3, member: true }`. The next 1★ gives `{ hearts: 0, member: false }`.
  - `never loses a heart`: at 13 points (3 hearts), `loseVisit` → 12, then → 12.
  - `gives each gift once at five hearts`:
    - cô Hạnh at 16 points plus owner 3★ on day 20 gives `gift { kind: 'regular', who: 'thao' }`, and Thảo's `meetDay` becomes 21.
    - Another visit gives `gift: null`.
    - Vy → `gifts` contains `'vyPainting'`.
    - Chú Sáu → `extraCustomer` is true.
    - Anh Khoa → `gift.amount` is 300000.
  - `gives the board when the last regular reaches five hearts`: seven at 20 points, the eighth reaching 20 gives `board: true` and `gifts` ends with `'regularsBoard'`. A further visit does not repeat it.
  - `plans chú Sáu's extra customer`: `extraCustomer` true gives `extraAt` in [540, 1020). False gives null.
  - `notes the kinds served`: `noteServed(book, 'elder')` twice → `served.elder === 2`, `kindsMet` is `['elder']`.
  - `REGULARS looks are in range and differ from each other`.
  - `staff names never clash with a regular's name`: `STAFF_NAMES` does not include `'Lan'`, `'Thảo'`, `'Vy'` or `'Hạnh'`.
- [ ] **Step 2: Run** `npx vitest run tests/sim/regulars.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `src/sim/regulars.ts` and the config constants.
  - Add `'vyPainting' | 'silkScreen' | 'regularsBoard'` to the `ItemKind` union and to `ITEMS` now, with the specs and the three `item…` name strings from Task 4, so `REGULARS` type-checks.
  - Keep them out of the catalogue now: `ItemSpec.giftOnly`, filtered in `catalogPage`.
  - Add their furniture art in Task 4. Until then they may reuse the `vase` picture, so the "art for every item kind" test holds.
- [ ] **Step 4: Run** `npx vitest run tests/sim/regulars.test.ts`, then `npm test`. Expected: all pass. Fix any existing test that depended on the removed staff names.
- [ ] **Step 5: Commit** with the message "Add the eight regulars and the guest book rules: meeting days, daily visits, hearts that never drop, member cards and gifts".

### Task 2: Save version 8

**Files:**
- Modify: `src/sim/types.ts`, `src/sim/items.ts`, `src/sim/save.ts`, `src/sim/spa.ts` (book field, `toSave`, `fromSave`, `emptyStats`), `src/view/summary.ts`, `src/strings/vi.ts` (`giftMoney: 'Quà tặng'`)
- Create: `tests/fixtures/save-v7.json`. Copy `save-v6.json`, set `"v": 7` and halve every `wage` (round), which is exactly what `withHalfWages` does.
- Test: `tests/sim/save.test.ts`, `tests/view/summary.test.ts`

**Interfaces:**
- Consumes: Task 1 `GuestBook`, `emptyBook`, `RegularId`, `REGULAR_IDS`, `KINDS`.
- Produces:
  - `Customer.regular: RegularId | null` and `Customer.heldMs: number`. Both are required; `spawnCustomer` sets `null` and `0`.
  - `DayStats.gifts: number`.
  - `Item.gift?: boolean`.
  - `SaveData.book: GuestBook`.
  - `SpaSim.book: GuestBook`, starting at `emptyBook()`.
  - `export function oldShopKinds(day: number): CustomerKind[]`: every kind but `celeb` whose `KINDS[k].fromDay <= day`.
  - `summaryRows`: a `{ label: 'giftMoney', value: stats.gifts, kind: 'money' }` row after `tips` when `gifts > 0`, and the profit includes `gifts`.
  - Repairs in `parseSave`:
    - **book:** not an object → `{ ...emptyBook(), kindsMet: oldShopKinds(day) }`. Otherwise repair each field:
      - per regular, each number field must be a finite number (`meetDay` and `visitAt` may be null), else its empty value; `met` is a boolean, else false;
      - `hearts` becomes `max(hearts, heartsFor(points))`, clamped 0..5;
      - `served` counts are whole numbers ≥ 0, else 0;
      - `kindsMet` keeps only known kinds;
      - `gifts` keeps only known item kinds;
      - the booleans fall back to false and `extraAt` to null.
    - **customer:** `regular` not in `REGULAR_IDS` → null; `heldMs` not a number → 0.
    - **item:** `gift` not a boolean is dropped. `isItems` must still accept items that have no `gift`.
    - **stats:** `gifts` not a number → 0.
  - `parseVersioned` accepts versions 1–7 and `SAVE_VERSION` (8). The old saves go through the same repair path, so they open with the empty book and `oldShopKinds(day)`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/save.test.ts`, under a new `describe('save version 8')`:
  - `keeps a regular customer and the book through a round trip`:
    - Spawn a customer, set `c.regular = 'hanh'` and `c.heldMs = 1234`.
    - Set `sim.book.regulars.hanh` to `{ meetDay: 7, met: true, points: 9, hearts: 2, visitAt: null }`, `sim.book.gifts = ['vase']` and `sim.stats.gifts = 5000`.
    - `viaJson(sim).toSave()` equals `sim.toSave()`.
  - `opens saves of versions 1 to 7 with an empty book`:
    - every regular unmet with 0 points;
    - `kindsMet` is `oldShopKinds(day)` (the v6 and v7 fixtures, on day 6, give `['student', 'office', 'picky', 'elder']`; v1 on day 1 gives `['student', 'office']`);
    - each customer has `regular: null` and `heldMs: 0`;
    - `stats.gifts` is 0.
  - `opens the version-7 shop as it was saved`: the same staff, wages, stock and day as the fixture.
  - `repairs a damaged book instead of losing the shop`:
    - `book: 'x'` gives the empty book;
    - `regulars.hanh.points: 'a'` gives 0;
    - `hearts: 1` with `points: 13` gives 3;
    - an unknown regular key is dropped;
    - `gifts: ['nope', 'vase']` gives `['vase']`;
    - `served.student: -1` gives 0.
  - `reads an unknown regular on a customer as an ordinary customer`.
  - `still leaves alone only saves newer than version 8`. Update the existing "newer than version 7" test.
  - In `tests/view/summary.test.ts`: `shows gift money under Thu and in the profit`.
- [ ] **Step 2: Run** `npx vitest run tests/sim/save.test.ts tests/view/summary.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Bump `SAVE_VERSION` to 8. Add `book` to `toSave` and `fromSave`, and `gifts: 0` to `emptyStats`. Write the repairs as small helpers next to `repairLook` and `repairTask`.
- [ ] **Step 4: Run** `npm test`. Expected: all pass.
- [ ] **Step 5: Commit** with the message "Save version 8: the guest book, which customer is a regular, gift money and gift furniture, with every older shop opening with an empty book".

### Task 3: Regulars in the shop

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/crew.ts`, `src/sim/types.ts` (events and hints), `src/sim/tutorial.ts`
- Test: `tests/sim/spa-regulars.test.ts` (new), `tests/sim/tutorial.test.ts`

**Interfaces:**
- Consumes: Task 1 and Task 2.
- Produces:
  - `spawnCustomer(opts: { kind?: CustomerKind; service?: ServiceId; regular?: RegularId })`.
  - New `SimEvent`s:

    ```ts
    | { type: 'regularArrived'; customerId: number; regular: RegularId; first: boolean }
    | { type: 'heart'; customerId: number; regular: RegularId; hearts: number; member: boolean }
    | { type: 'gift'; customerId: number; regular: RegularId; gift: RegularGift }
    | { type: 'bookPage' }
    ```

  - `HINT_IDS` gains `'regular'` and `'openBook'`.
  - `Pointer` gains `{ hint: 'regular'; customerId: number }` and `{ hint: 'openBook' }`.

**Behaviour:**

- **`spawnCustomer` with `regular`:**
  - The look is `{ ...REGULARS[id].look }` and the kind is `REGULARS[id].kind`. No look draw: a regular's spawn draws only for the service when needed.
  - The service is `likes` if it is in `availableServices()`, else `drawService(kind, available, rng)`.
  - The patience is multiplied by `MEMBER_PATIENCE` when `isMember`.
  - Set `regular: id`, then `met = true` and `visitAt = null`.
  - Emit `customerArrived`, then `regularArrived` with `first` = whether they were unmet before.
- **`step` arrivals:** where a customer is due, `const due = dueRegular(this.book, this.clock.minutes)` and spawn `{ regular: due }` when it is non-null. Inside the same open-hours block, when `book.extraAt !== null && clock.minutes >= book.extraAt`, set `extraAt = null` and `spawnCustomer()`.
- **`startDay`:** `planDay(this.book, this.day, this.rng)` after `this.day++` and the crew's `startDay`.
- **`payFor`:**
  - After the review, `noteServed(book, c.kind)`.
  - If `c.regular`: `const r = addVisit(book, c.regular, stars, technicianFriendly === null, this.day)`.
  - If `r.hearts`, emit `heart`.
  - If `r.gift`, emit `gift`. For a money gift, also do `money += amount` and `stats.gifts += amount`.
  - If `r.board`, emit `bookPage`.
- **`loseCustomer`:** `loseVisit` when the customer is a regular. A regular turned away for lack of a seat changes nothing; they simply come another day.
- **The owner window:**
  - In `updateCustomer` `'waiting'`: when `c.regular` and some station of `c.service` has `customerId === null`, add `dt` to `c.heldMs`.
  - In `crew.ts`, `fetchWaiting` skips a customer with `c.regular !== null && c.heldMs < REGULAR_OWNER_MS`.
  - The owner's own tap is unchanged.
- **`pickHint`:** after `patience` and before the build hints:
  - while `!hintDone('regular')`, the first waiting regular gives `{ hint: 'regular', customerId }`;
  - then, while `bookOpen(book) && !hintDone('openBook')`, it gives `{ hint: 'openBook' }`.

- [ ] **Step 1: Write the failing tests** in `tests/sim/spa-regulars.test.ts`. Use the existing helpers. Use `autoSpawn: false` and spawn directly, except where the arrival swap is the subject.
  - `spawns a regular with their look, kind, favourite and a first-time flag`: cô Hạnh with massage open and a massage bed gives the massage service, kind `office`, the fixed look, and the events `customerArrived` then `regularArrived { first: true }`. A second spawn gives `first: false`.
  - `gives a regular whose favourite is closed a service the shop has`: a default shop (shampoo only) gives Bà Tư shampoo. Selling the only massage bed while cô Hạnh waits gives her a service the shop still has.
  - `makes a member more patient`: hearts 3 → `patienceMaxMs` is 1.5 times a plain office worker's.
  - `swaps a due regular in for the next arrival`: autoSpawn on, cô Hạnh's `visitAt` set to 540.
    - The first arrival after 9:00 is cô Hạnh.
    - That arrival spawns exactly one customer.
    - She does not come again that day: her `visitAt` is null after she spawns.
  - `adds chú Sáu's extra customer once a day`: `extraAt` 600 → exactly one extra spawn after 10:00. `extraAt` is null afterwards.
  - `starts an old day-12 shop's meetings at the next morning, two days apart`:
    - Open the v7 fixture with `day` set to 12. The book is not open.
    - `startDay()` → day 13, with cô Hạnh's `visitAt` set and `meetDay` 13.
    - Vy's `meetDay` is 15.
  - `scores the owner's 3-star visit as a heart and the third as a member card`: owner `completeService(c.id, 3)` on cô Hạnh from 8 points emits `heart { hearts: 3, member: true }`.
  - `scores a staff visit at half`: a technician serves the regular (force `heldMs` past the window) → 2 points on 3★, 1 on 2★.
  - `scores a regular served after a reload once`: save mid-service, reload, complete → points rise once.
  - `pays a money gift into the day and the profit`: Anh Khoa at 16 points, owner 3★ → `money` +300000 beyond the price and tip, `stats.gifts` is 300000, and a `gift` event is emitted.
  - `takes points for a walk-out but never a heart`: a regular at 13 points runs out of patience → 12.
  - `staff wait 10 s of free-bed time before fetching a regular`:
    - With 1 shampoo bed, a technician and a waiting regular, at 9.9 s the technician has no task; at 10.1 s they fetch.
    - With the bed taken by another customer for 20 s, the regular's `heldMs` stays 0 while the bed is busy.
    - The owner can tap the regular at any time.
  - `notes every customer served by kind`.
  - In `tests/sim/tutorial.test.ts`: `points at the first waiting regular, then at the book`.
- [ ] **Step 2: Run** `npx vitest run tests/sim/spa-regulars.test.ts tests/sim/tutorial.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the behaviour above.
- [ ] **Step 4: Run** `npm test`. Expected: all pass, with no change to existing seeded tests, since no draws happen before day 7.
- [ ] **Step 5: Commit** with the message "Regulars come into the shop: one swapped in for a stranger at their hour, hearts and member cards from good service, gifts at five hearts, and staff leaving a regular to the owner for ten seconds".

### Task 4: Gift furniture

**Files:**
- Modify: `src/sim/items.ts`, `src/sim/build.ts`, `src/sim/spa.ts`, `src/view/catalog.ts`, `src/scenes/BuildScene.ts`, `src/art/furniture.ts`, `src/strings/vi.ts`
- Test: `tests/sim/items.test.ts`, `tests/sim/build.test.ts` (or `spa-regulars.test.ts`), `tests/view/catalog.test.ts`, `tests/art/furniture.test.ts`

**Interfaces:**
- Consumes: `book.gifts` (Task 1) and `Item.gift` (Task 2).
- Produces:
  - **Gift-only kinds:** `ItemSpec.giftOnly?: true`. If Task 1 already added them, check the values:

    ```ts
    vyPainting: { w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemVyPainting' },
    silkScreen: { w: 2, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemSilkScreen' },
    regularsBoard: { w: 2, h: 1, price: 0, beauty: 6, group: 'decor', giftOnly: true, name: 'itemRegularsBoard' },
    ```

  - `BuildProblem` gains `'gift'`, and `PROBLEM_TEXT.gift = 'giftNoSell'`.
  - `SpaSim.placeGift(kind: ItemKind, x: number, y: number, flip: boolean): BuildProblem | null`:
    - `'gift'` when `kind` is not in `book.gifts`;
    - otherwise `canPlace`;
    - otherwise push `{ id, kind, x, y, flip, gift: true }`, remove the first `kind` from `book.gifts`, and `changeRoom()`.
  - `SpaSim.sell` returns `'gift'` for an item with `gift: true`, before any other check.
  - `catalogPage(group, page, open, gifts: ItemKind[]): { entries: { kind: ItemKind; gift: boolean }[]; page: number; pages: number }`:
    - For `'decor'`: one gift entry per pending gift, oldest first, then the decor kinds without `giftOnly`.
    - Other groups never show `giftOnly` kinds and have no gift entries.
  - **BuildScene:**
    - Opens on the `'decor'` tab when `sim.book.gifts.length > 0`.
    - A gift card shows `t('giftLabel')` where the price goes, and is never faded.
    - Tapping it holds the piece with `gift: true`; "Đặt" calls `placeGift`.
    - Holding a placed gift shows the same row, but the sell button reads `t('sellGiftButton')`. Tapping it toasts `t('giftNoSell')`.
  - **Furniture art:** `FURNITURE.vyPainting` (w 1), `silkScreen` (w 2) and `regularsBoard` (w 2), in style A:
    - `vyPainting`: a wooden easel with a small painting of a shop front with a red lantern;
    - `silkScreen`: a two-panel lacquered frame with cream silk painted with a lotus and two swallows;
    - `regularsBoard`: a brown wooden board with eight small cream photo frames and a red ribbon.
  - **Strings:**

    ```ts
    itemVyPainting: 'Tranh của Vy', itemSilkScreen: 'Bình phong lụa', itemRegularsBoard: 'Bảng ảnh khách quen',
    giftLabel: 'Quà', giftNoSell: 'Quà không bán được', sellGiftButton: 'Bán',
    ```

- [ ] **Step 1: Write the failing tests:**
  - `places a pending gift once at no cost`: `book.gifts = ['vase']` → `placeGift('vase', …)` returns null, money is unchanged, the item has `gift: true`, and `gifts` is empty. A second `placeGift` returns `'gift'`.
  - `refuses to sell a gift`: `sell(id)` of that item returns `'gift'`, and the item and money stay.
  - `moves a gift like any piece`.
  - `catalog shows pending gifts first on the decor tab and never the gift-only kinds otherwise`.
  - Furniture: `draws each gift piece as wide as its footprint`, plus the existing "art for every item kind" covering the new kinds.
  - Strings: `PROBLEM_TEXT.gift` resolves to "Quà không bán được".
- [ ] **Step 2: Run** the named test files. Expected: FAIL.
- [ ] **Step 3: Implement** the sim, the catalogue, BuildScene and the art.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: all pass, build OK.
- [ ] **Step 5: Commit** with the message "Gift furniture: Vy's painting, Bà Tư's silk screen and the regulars' board, offered free in build mode, placed once and never sold".

### Task 5: How regulars look and what they say

**Files:**
- Create: `src/strings/regulars.ts`
- Modify: `src/art/chibi.ts`, `src/art/palette.ts`, `src/view/CharacterView.ts`, `src/art/fx.ts`, `src/strings/vi.ts`
- Test: `tests/strings/strings.test.ts`, `tests/art/chibi.test.ts`, `tests/art/fx.test.ts` (or wherever fx textures are covered)

**Interfaces:**
- Consumes: `RegularId` and `REGULAR_IDS` (Task 1).
- Produces:
  - `src/strings/regulars.ts`:

    ```ts
    export interface RegularText { name: string; job: string; intro: string; story: readonly [string, string, string, string, string] }
    export const REGULAR_TEXT: Record<RegularId, RegularText>
    export const GREETINGS: readonly string[]
    export const BUBBLE_MAX_CHARS = 60
    ```

  - `customerColors(look, kind, regular: RegularId | null = null)`: passes `regular` through on `CharacterColors.regular`.
  - `CharacterView` wears `REGULAR_WORN[regular]` in place of `WORN[kind]` when `regular` is set. Bà Tư keeps the picky frown, because the face comes from `kind`.
  - **New chibi parts** (each in the sides listed; `on` is body, face or hair, as `WORN` uses it):

    | regular | key | on | sides |
    |---|---|---|---|
    | hanh | `redApron` (red apron with a white pocket) | body | down, side |
    | vy | `artTube` (a teal drawing tube on a strap) | body | down, side, up |
    | sau | `helmet` (an olive-green round helmet, "nón cối") | hair | down, side, up |
    | khoa | `headphones` (black headphones round the neck) | body | down, side, up |
    | tu | `goldGlasses` (gold-rimmed round glasses) | face | down, side |
    | tu | `silkScarf` (a jade silk scarf at the neck) | body | down, side, up |
    | ba | `readingGlasses` (half-moon glasses) | face | down, side |
    | ba | `paperFan` (a folded paper fan in hand) | body | down, side |
    | thao | `flowerClip` (a white flower hair clip) | hair | down, side, up |
    | lan | `daisies` (a bunch of yellow daisies held at the chest) | body | down, side |

  - **New fx textures:**
    - `heart-full`: lantern-red heart, ink outline;
    - `heart-empty`: cream heart, ink outline;
    - `icon-card`: a small teal card with a gold stripe;
    - `icon-book`: a closed brown book with a gạch bông-tile cover motif, for the top-bar button.
  - **New `vi.ts` strings:**

    ```ts
    greetingLine: '{name}: {text}',
    hintRegular: 'Khách quen! Tự tay phục vụ thì tim tăng gấp đôi',
    hintBook: 'Xem khách quen trong sổ khách ở đây',
    memberToast: '{name} nhận thẻ thành viên',
    giftMoneyToast: '{name} tặng tiệm {money}',
    giftItemToast: '{name} tặng quà! Xem ở nút Xây dựng',
    giftFriendToast: '{friend} sẽ ghé tiệm ngày mai',
    giftExtraToast: '{name} chở thêm khách tới mỗi ngày',
    bookPageToast: 'Đủ trang khách quen! Quà ở nút Xây dựng',
    bookTitle: 'Sổ khách',
    bookIntro: 'Phục vụ tốt để thêm tim. Đủ 3 tim khách nhận thẻ, đủ 5 tim khách tặng quà.',
    tabRegulars: 'Khách quen',
    tabKinds: 'Kiểu khách',
    regularSoon: 'Sắp ghé',
    regularFriend: '{name} sẽ giới thiệu',
    regularLikes: 'Thích: {service}',
    storyLocked: 'Thêm tim để nghe tiếp',
    servedCount: 'Đã phục vụ: {n}',
    kindFrom: 'Từ ngày {day}',
    memberCard: 'Thẻ thành viên',
    back: 'Quay lại',
    kindStudent: 'Sinh viên', kindOffice: 'Dân văn phòng', kindPicky: 'Khách khó tính', kindElder: 'Cô chú lớn tuổi', kindCeleb: 'Người nổi tiếng',
    ```

    If a key already exists with the same meaning (for example `back`), reuse it instead.

  - **`REGULAR_TEXT`, exact copy:**

    | id | name | job | intro |
    |---|---|---|---|
    | hanh | Cô Hạnh | Bán bánh mì đầu hẻm | Cô bán bánh mì đầu hẻm nè. Nghe nói tiệm mới mở, cô ghé thử! |
    | vy | Vy | Sinh viên mỹ thuật | Em là Vy, học mỹ thuật. Tiệm mình xinh quá trời! |
    | sau | Chú Sáu | Chạy xe ôm | Chú chạy xe ôm ngoài ngã tư. Bụi quá, gội giùm chú cái đầu! |
    | khoa | Anh Khoa | Lập trình viên | Khoa nè, làm IT. Mặt mũi bơ phờ quá, cứu em với! |
    | tu | Bà Tư | Chủ sạp vải chợ Bến Thành | Tiệm mới hả? Để bà coi làm ăn ra sao. |
    | ba | Ông Ba | Thầy giáo về hưu | Tôi dạy học bốn chục năm, giờ về hưu. Cái vai nó mỏi quá. |
    | thao | Thảo | Kế toán, cô dâu sắp cưới | Con là Thảo, con gái má Hạnh. Má khen tiệm hoài! |
    | lan | Lan | Bán hoa chợ Hồ Thị Kỷ | Lan bán hoa ở chợ Hồ Thị Kỷ. Thảo rủ ghé, Lan tới liền! |

    Stories, hearts 1 to 5. Heart 3 mentions the card, heart 5 the gift:

    - **hanh:**
      1. Đứng bán từ sáng tới trưa, cái lưng cô muốn gãy luôn.
      2. Tay con mát ghê, về cô ngủ một giấc tới sáng.
      3. Con Thảo nhà cô sắp cưới rồi! Cô làm thẻ ở đây luôn nha.
      4. Lo đám cưới mệt ghê. Cô để dành ổ bánh mì cho con nè.
      5. Cưới xong rồi! Bữa sau cô dắt con Thảo qua làm đẹp nha.
    - **vy:**
      1. Em nhịn trà sữa cả tuần để đi gội đó chị.
      2. Cho em ngồi vẽ ký họa tiệm mình một bữa nha?
      3. Bức ký họa tiệm được thầy khen! Em làm thẻ luôn nè.
      4. Tranh em được chọn đi triển lãm rồi chị ơi!
      5. Em vẽ tặng tiệm một bức, treo cho em vui nha!
    - **sau:**
      1. Chạy xe cả ngày, gội cái là mát rượi.
      2. Hồi nãy chú chở mối quen, chú giới thiệu tiệm mình rồi đó.
      3. Thằng cháu nội chú sắp thi đại học. Chú làm thẻ nghen!
      4. Nó ôn tới khuya, chú thương nó quá.
      5. Cháu chú đậu rồi! Từ giờ chú chở khách tới tiệm mỗi ngày!
    - **khoa:**
      1. Chạy dự án ba đêm liền, da mặt khô như bánh tráng.
      2. Bị sếp la nhưng đắp mặt nạ xong thấy đời tươi lại.
      3. Dự án xong rồi! Em làm thẻ, tuần nào cũng ghé.
      4. Em được lên trưởng nhóm rồi đó!
      5. Cả phòng em muốn làm thẻ. Em gửi trước tiền cho tiệm nha!
    - **tu:**
      1. Khăn hơi cứng. Mà thôi, tay nghề cũng được.
      2. Ừ... lần này làm khá đó.
      3. Bà bán vải chợ Bến Thành năm chục năm rồi. Làm thẻ cho bà.
      4. Hồi xưa sạp bà đông lắm, cô dâu nào cũng ghé mua lụa.
      5. Bà tặng tấm bình phong lụa, tiệm cho sang. Nhớ giữ kỹ!
    - **ba:**
      1. Cầm phấn mấy chục năm, cái vai không còn nghe lời.
      2. Học trò cũ của tôi giờ làm bác sĩ, kỹ sư đủ cả.
      3. Tiệm này làm có tâm. Cho tôi làm cái thẻ.
      4. Hôm qua học trò cũ về thăm, tôi mừng muốn khóc.
      5. Tôi gửi chút lì xì, chúc tiệm làm ăn phát đạt.
    - **thao:**
      1. Sắp cưới mà da nổi mụn, con lo quá trời.
      2. Chụp ảnh cưới xong rồi, da đẹp hơn hẳn đó!
      3. Con làm thẻ luôn, má với con giờ là khách ruột.
      4. Đám cưới vui lắm! Con khoe ảnh nè.
      5. Con rủ Lan, bạn phù dâu của con, qua tiệm nha!
    - **lan:**
      1. Lan dậy 3 giờ sáng lấy hoa, mặt mũi phờ phạc hết.
      2. Lan để dành tiền, mơ mở một tiệm hoa nho nhỏ.
      3. Gom góp gần đủ rồi! Lan làm thẻ cho tiệm luôn.
      4. Lan thuê được mặt bằng rồi, sắp khai trương!
      5. Tiệm hoa mở rồi! Lan tặng tiệm một bình hoa nè.

    `GREETINGS`: `['Ghé nè!', 'Hôm nay đông ghê ha!', 'Lại là tui nè!', 'Nhớ tiệm quá nên ghé.', 'Làm như lần trước nha!']`.

- [ ] **Step 1: Write the failing tests:**
  - `every regular has a name, a job, an intro and five story lines, each at most 60 characters`;
  - `greetings fit a bubble with the longest name`;
  - chibi: `has every regular's accessory in each side it lists`;
  - fx: `has the heart, card and book icons`.
- [ ] **Step 2: Run** the named test files. Expected: FAIL.
- [ ] **Step 3: Implement** the strings, parts, `REGULAR_WORN`, the `customerColors` parameter and the icons.
- [ ] **Step 4: Run** `npm test`. Expected: all pass.
- [ ] **Step 5: Commit** with the message "Give each regular their own look, name, job, first words and five-part story, with heart, card and book icons".

### Task 6: Regulars on screen

**Files:**
- Create: `src/view/SpeechBubble.ts`
- Modify: `src/scenes/SpaScene.ts`, `src/view/Hud.ts`, `src/audio/cues.ts`
- Test: `tests/audio/cues.test.ts`

**Interfaces:**
- Consumes: the Task 3 events and hints, the Task 5 strings and textures, and `bookOpen`.
- Produces:
  - `export class SpeechBubble`:
    - `constructor(scene: Phaser.Scene, text: string, ms: number)`
    - `setPosition(x: number, y: number): this`
    - `get done(): boolean`
    - `destroy(): void`
    - **Drawing:** paper fill, 4 px ink border, radius 24, and a tail pointing down at the head. Text is `textStyle(32, '600')`, wrapped at 520 and centred. It fades in over 150 ms, holds for `ms`, fades out over 250 ms, then is `done`. It never takes input. Depth is `FX_DEPTH + 20`.
  - **Hud:**
    - `export const BOOK_BUTTON = { x: 870, y: 152 }` and a constructor callback `onBook`.
    - The button is a teal circle, r 38, with ink stroke and `icon-book`, and a 120×110 hit area. It is visible only while `bookOpen(sim.book)`.
    - A "Mới" badge shows until `hintDone('openBook')`.
  - `cueFor`: `'heart'` → `'star'`.
- **SpaScene:**
  - `CustomerSprite` gains `heart: Phaser.GameObjects.Image` (`heart-full` at scale 0.5, just left of the service badge). It is visible for a waiting regular.
  - A scene-level `bubbles: Map<number, SpeechBubble>` keyed by customer id. A new bubble replaces that customer's old one.
  - Each frame, every bubble follows its customer, its bottom at `p.y - CHARACTER_HEIGHT_PX - 70`, above the mood bubble.
  - **When a customer leaves,** the bubble stays where it last was until `done`. Then remove it.
  - **Events:**
    - `regularArrived`: intro line when `first`; else `t('greetingLine', { name, text: GREETINGS[customerId % GREETINGS.length] })`, for `BUBBLE_MS.greet`.
    - `heart`:
      - the story line `story[hearts - 1]` for `BUBBLE_MS.story`;
      - a floating `heart-full` with "+1" over the customer, tweened like `floatMoney`;
      - when `member`, `hud.toast(t('memberToast', { name }))`.
    - `gift`:
      - money: `floatMoney` at the customer's tile, plus `giftMoneyToast`;
      - item: `giftItemToast`;
      - regular: `giftFriendToast` with the friend's name;
      - extraCustomer: `giftExtraToast`.
    - `bookPage`: `this.time.delayedCall(2200, () => this.hud.toast(t('bookPageToast')))`, so it does not overwrite the gift toast.
  - **Pointer:**
    - `regular` shows `hintRegular` at the customer the way `patience` does, and marks it done after `PATIENCE_HINT_MS` seen.
    - `openBook` shows `hintBook` at `BOOK_BUTTON` with `dir: 'up'`, the fingertip at `y + 40`.
  - `openBook()` mirrors `openServices()`: modal, `intro = !hintDone('openBook')`, then `markHint('openBook')`, then launch `GuestBookScene` (Task 7) with `{ sim, intro, onClose }`.
  - `addCustomerSprite` passes `c.regular` to `customerColors`.

- [ ] **Step 1: Write the failing test:** `cueFor({ type: 'heart', … })` is `'star'`.
- [ ] **Step 2: Run** `npx vitest run tests/audio/cues.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the bubble, the HUD button and the wiring.
  - Add a stub `src/scenes/GuestBookScene.ts`. It exports `interface GuestBookData { sim: SpaSim; intro: boolean; onClose: () => void }`. Its card has a "Xong" button that calls `onClose` and stops the scene. Task 7 fills it in.
  - Register the scene in `src/main.ts`.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: pass. Then, in the dev server at an iPhone viewport, use `__spa.sim` to set `day = 7`, call `startDay()`, and advance:
  - cô Hạnh walks in with her red apron and the intro bubble;
  - the heart badge shows while she waits;
  - the regular hint points at her;
  - serving her 3★ floats "+1" with a heart and tells story line 1;
  - the book button appears with "Mới".

  Screenshot each.
- [ ] **Step 5: Commit** with the message "Show regulars in the shop: speech bubbles that stay readable as they leave, a heart over a waiting regular, floating hearts, gift toasts and the guest-book button".

### Task 7: The guest book

**Files:**
- Create: `src/view/guestBook.ts`; fill in `src/scenes/GuestBookScene.ts`
- Test: `tests/view/guestBook.test.ts`

**Interfaces:**
- Consumes: `GuestBook`, `REGULARS`, `REGULAR_IDS`, `KINDS`, `CUSTOMER_KINDS`, `isMember`, and `REGULAR_TEXT`.
- Produces:

  ```ts
  export type RegularRow =
    | { id: RegularId; shown: 'met'; hearts: number; member: boolean }
    | { id: RegularId; shown: 'soon' }
    | { id: RegularId; shown: 'friend'; by: RegularId }
  export function regularRows(book: GuestBook): RegularRow[]   // REGULAR_IDS order
  export interface KindRow { kind: CustomerKind; met: boolean; served: number; fromDay: number }
  export function kindRows(book: GuestBook): KindRow[]         // CUSTOMER_KINDS order
  /** Story lines told so far: one per heart. */
  export const toldLines = (book: GuestBook, id: RegularId): number => book.regulars[id].hearts
  ```

  `GuestBookData { sim: SpaSim; intro: boolean; onClose: () => void }` is exported from `GuestBookScene.ts`, defined there by Task 6's stub.

  - A regular not met with `introducedBy === null` is `'soon'`.
  - One with `introducedBy` set is `'friend'` (by that regular), even when their `meetDay` is set but they have not come yet.
- **GuestBookScene** (full-screen card like ServicesScene, the shop frozen underneath):
  - **Header:** title `bookTitle` at the top. While `intro`, `bookIntro` shows below the title, wrapped.
  - **Tabs:** `tabRegulars` and `tabKinds`, 440×120, at y 500 like the services tabs. `t('done')` sits at y 1895 and closes the scene.
  - **Regulars tab:** a 2×4 grid of cells, each about 430×300.
    - **A met regular:** a `CharacterView` standing, facing down, with their colours, scaled 1.4; their name; a row of 5 `heart-full`/`heart-empty`; `icon-card` when a member.
    - **A not-met regular:** the same figure at alpha 0.25, the name replaced by "???", and `regularSoon` or `regularFriend` with the friend's name.
    - **Tapping a met cell opens its detail:**
      - the large figure, name and job;
      - `regularLikes`, using the service's name string;
      - `memberCard` when a member;
      - then lines 1..`toldLines` of the story, each wrapped at 860, `textStyle(32)`;
      - `storyLocked` under them while fewer than 5;
      - `back` returns to the grid.
  - **Kinds tab:** 5 rows. Each has the kind's figure (look `{0, 0, 0, 0}` with the kind's accessories), its name, and `servedCount` when met. When not met, the figure is at alpha 0.25 and the row shows `kindFrom` with the day.
- [ ] **Step 1: Write the failing tests** in `tests/view/guestBook.test.ts`:
  - `shows a new shop's book with six soon and two by introduction`;
  - `shows a met regular's hearts and card`;
  - `counts the lines told`;
  - `marks kinds met and their counts`;
  - `gives each kind its first day`.
- [ ] **Step 2: Run** `npx vitest run tests/view/guestBook.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the rows and the scene.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: pass. In the dev server at an iPhone viewport, fill a book via `__spa.sim.book` with mixed states, then open the book. Screenshot the grid, a detail with 3 lines, and the kinds tab. Check that no text is cut and that the Vietnamese diacritics render.
- [ ] **Step 5: Commit** with the message "Add the guest book: the regulars with their hearts, cards and stories to read again, and the five customer kinds served so far".

### Task 8: Verify and ship

**Files:** none new. The controller does this, with one browser run-through subagent.

- [ ] **Step 1: Checks.** `npm test` passes and `npm run build` is OK.
- [ ] **Step 2: Browser run-through** (own tab; back up and restore `localStorage`; iPhone viewport):
  1. A new shop plays days 1–6 with no regular, no book button and no new console errors.
  2. Set `day = 6` via `__spa.sim`, end the day, then take "Ngày mới" to day 7:
     - cô Hạnh comes;
     - the regular hint shows;
     - a technician does not take her in the first 10 s while a bed is free;
     - serving her gives a heart and a story line;
     - the book opens with the intro.
  3. Force cô Hạnh to 16 points, then serve her 3★: the gift toast shows, and Thảo comes the next day.
  4. Force Vy to 5 hearts: build mode opens on the decor tab with "Tranh của Vy" at "Quà". Place it, try to sell it ("Quà không bán được"), then move it.
  5. Reload mid-visit: the regular, the bubble state and the book survive, and the visit counts once.
  6. Load the v6 and v7 fixtures through the import screen: they open. On their next new day from day 7, cô Hạnh comes.
  7. No console errors.
- [ ] **Step 3: Ship.**
  1. Check that `origin/master` has not moved since `b1bed02`. If it has, merge it and run the tests again.
  2. Run `git checkout master && git merge --ff-only dot-2-khach-quen && git push origin master`.
  3. Watch Actions. Check that `version.json` matches the new HEAD.
  4. Do a live smoke check in your own tab: no console errors, and a fresh shop starts.
- [ ] **Step 4: Report to anh.** Name what to look at on the iPhone (spec §8): whether the stories read well, whether the bubbles are readable in time, and whether staff leaving regulars to the owner feels right.
