# Khách ngôi sao lô A: chín ngôi sao ghé tiệm (save v26) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Once the main shop has the Bảng vàng, nine real stars book visits of their own beside the VIPs. They are owner-only guests who pay ×5, hum their song title while waiting, make the shop hot on 3 stars, give a signed photo each and the Tường ngôi sao for all nine. Save version 26.

**Architecture:**
- **A star book beside the VIP book** (spec approach B): `src/sim/idols.ts` holds the data and pure book functions, like `src/sim/vips.ts`. `SpaSim.idol` sits next to `SpaSim.vip`.
- **A star behaves as a VIP in the shop.** It has the same booking, standing, held bed, no-fetch, patience and review rules. `Customer.idol` sits next to `Customer.vip`. Every VIP check in `spa.ts`, `crew.ts`, `chain.ts` and the scene that a star shares learns about `idol`.
- **Hot runs get a length and a card day,** so a star can extend a running hot spell and the next morning's card names them.
- **The view draws stars in real hex colours** (`src/art/idols.ts`) with their own worn pieces in 3 directions. The sim keeps a plain `Look` that the view never reads for a star.

**Tech Stack:** Phaser 4, TypeScript, Vite 8, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-ngoi-sao-design.md`. Lô A covers every section except §7.8, which is lô B.

**Art source:** the approved front views are `docs/art/ngoi-sao-mat-truoc.mjs` (sketch: https://claude.ai/artifact/1XPvDk4DaUnpJ1xSDn7bTh).
- Its `body` pieces are drawn in the body part's frame and its `face`/`hairOn` pieces in the head's frame. So their (0,0) is the game's `BODY_Y`/`HEAD_Y` anchor, exactly like the VIP pieces in `src/art/chibi.ts`.

**OSS research:** none needed. This feature reuses the game's own VIP system (spec §6).

**Baseline:**
- 1239 tests in 104 files pass on `ngoi-sao` at 5b49ec4.
- Typecheck: `npx tsc --noEmit`.
- Tests: `npx vitest run`.
- Build: `npx vite build --outDir .superpowers/dist-check`.

## Global Constraints

- **The bans (spec §5):**
  - No song lyrics anywhere, not one line. Only song titles.
  - No star before the main shop's `vip.boardGiven`.
  - A shop without the Bảng vàng plays exactly as before. Every old test keeps its behaviour assertions, `same-draws.test.ts` and its fixture are untouched, and VIPs and events draw as before.
  - Nothing new draws from the shop's rng or the VIP's. Stars draw only from `createRng(day * 8737 + nextId)`.
  - A VIP and a star are never in the shop together. Whoever is due second waits outside.
  - Nothing is paid or given twice. A reload never re-gives a photo or the wall, and never extends a hot run again.
  - A star never walks out for want of a seat. Staff never fetch a star.
- **Naming:** code says `idol`, never `star` (`VipId 'star'` is Bích Câu; `'star'` is also a texture and a sound).
- **Numbers** (in `src/config.ts` next to the VIP block):
  - `IDOL_GAP_DAYS = [3, 5] as const`
  - `IDOL_PRICE_FACTOR = 5`
  - `IDOL_VIP_APART_MIN = 180`
  - `HUM_EVERY_MS = 10000`
  - `HUM_MS = 3000`
  - Stars reuse `VIP_FROM_MIN`/`VIP_TO_MIN`, `VIP_MIN_TECHNICIANS`, `VIP_PATIENCE`, `VIP_REVIEWS`, `VIP_WARN_MIN` and `HOT_DAYS`.
- **The nine stars, in first-round order:**

  | id | Name | Role | Service | Song | skin | hairStyle |
  |---|---|---|---|---|---|---|
  | `sontung` | Sơn Tùng M-TP | Ca sĩ Việt Nam | massage | Lạc Trôi | 0 | 2 |
  | `taylor` | Taylor Swift | Ca sĩ Mỹ | massage | Shake It Off | 0 | 1 |
  | `gd` | G-Dragon | Ca sĩ Hàn, BIGBANG | shampoo | Crooked | 0 | 2 |
  | `jennie` | Jennie | Ca sĩ Hàn, BLACKPINK | mask | SOLO | 0 | 1 |
  | `hieuthuhai` | HIEUTHUHAI | Rapper Việt Nam | shampoo | Ngủ Một Mình | 0 | 2 |
  | `weeknd` | The Weeknd | Ca sĩ Canada | shampoo | Blinding Lights | 3 | 2 |
  | `taeyang` | Taeyang | Ca sĩ Hàn, BIGBANG | massage | Eyes, Nose, Lips | 1 | 2 |
  | `bieber` | Justin Bieber | Ca sĩ Canada | mask | Baby | 0 | 2 |
  | `daesung` | Daesung | Ca sĩ Hàn, BIGBANG | mask | Haru Haru | 0 | 2 |

- **Lines, verbatim from spec §7.12** (arrive / thanks):
  - `sontung`
    - arrive: "Chào em! Anh vừa ra bài mới, chạy show mỏi vai quá trời."
    - thanks: "Nhẹ cả người! Lần sau anh dẫn cả ê-kíp tới luôn nha."
  - `taylor`
    - arrive: "Hi! Tối nay chị diễn ba tiếng rưỡi, bóp vai giùm chị nha!"
    - thanks: "Amazing! Vai nhẹ tênh, tối nay chị diễn thêm cũng được!"
  - `gd`
    - arrive: "Annyeong! Gội nhẹ tay giùm anh, tóc hồng này mới nhuộm đó."
    - thanks: "Màu vẫn hồng mà tóc mềm hơn! Tiệm này chất ghê."
  - `jennie`
    - arrive: "Annyeong! Mai chị chụp bìa tạp chí, làm da chị sáng lên nha."
    - thanks: "Da căng bóng luôn! Mai lên hình khỏi cần chỉnh."
  - `hieuthuhai`
    - arrive: "Mai quay MV rồi, gội cho anh thơm tho bảnh bao nha!"
    - thanks: "Thơm phức! Vô MV tóc vào nếp khỏi cần vuốt."
  - `weeknd`
    - arrive: "Hát tới khuya, ngủ chưa đủ giấc… Gội cho anh tỉnh ngủ nha."
    - thanks: "Tỉnh cả người! Đêm nay anh hát tới sáng cũng được."
  - `taeyang`
    - arrive: "Tập nhảy cả ngày, lưng cứng đơ rồi. Massage giùm anh nha!"
    - thanks: "Lưng dẻo lại rồi! Giờ nhảy thêm bài nữa cũng được."
  - `bieber`
    - arrive: "Yo! Bay mệt quá. Sorry nếu anh ngủ quên lúc đắp mặt nạ nha!"
    - thanks: "Ngủ ngon thiệt! Da mát rượi, bay về khỏi lo mệt."
  - `daesung`
    - arrive: "Hehe! Cười nhiều quá mỏi cả mặt, đắp mặt nạ cho anh nha!"
    - thanks: "Mặt mát rượi, cười tiếp được rồi! Hehe!"
- **New `vi.ts` keys, verbatim:**

  | Key | Text |
  |---|---|
  | `idolBookingNote` | `'Ngày mai {time},\nngôi sao {name} hẹn {service}'` |
  | `idolTodayToast` | `'Hôm nay {time}, ngôi sao {name} hẹn {service}'` |
  | `idolFirstNote` | `'Tiệm có Bảng vàng nên ngôi sao bắt đầu tìm tới. Ngôi sao chỉ chủ tiệm phục vụ được, trả gấp 5.'` |
  | `hotIdolHead` | `'{name} đăng ảnh tiệm mình'` |
  | `idolWallToast` | `'Đủ ảnh ngôi sao! Tường ngôi sao ở nút Xây dựng'` |
  | `idolCallKicker` | `'Tiệm gốc · ngôi sao'` |
  | `idolCallLine` | `'Chỉ chủ tiệm mới làm được. Ngôi sao chờ được một lúc, quá lâu thì về.'` |
  | `itemPhotoIdolSontung` … `itemPhotoIdolDaesung` | `'Ảnh ký tên {name}'`, written out per star, e.g. `'Ảnh ký tên Sơn Tùng M-TP'` |
  | `itemStarWall` | `'Tường ngôi sao'` |

- **Gifts:**
  - `photoIdolSontung`, `photoIdolTaylor`, `photoIdolGd`, `photoIdolJennie`, `photoIdolHieuthuhai`, `photoIdolWeeknd`, `photoIdolTaeyang`, `photoIdolBieber`, `photoIdolDaesung`: each `{ w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true }`.
  - `starWall`: `{ w: 2, h: 1, price: 0, beauty: 9, group: 'decor', giftOnly: true }`.
- **Save:** v26 (the next free number on master; see Task 6 if master has moved on by merge time).
- **Layers:** `src/sim/**` has no Phaser and no strings. Names on screen come from `IDOL_TEXT` in `src/strings/idols.ts`.
- **Sound:** none new. `idolArrived` plays the VIP cue.

## Plan Calls (mine, at planning)

- **The second comer's gate** is `ownerOnlyHere()`: some customer in `sim.customers` has `vip !== null || idol !== null`, walking out included. A customer leaves that list only once out of the door, so "vào ngay khi khách kia rời tiệm" holds. Shops without stars never trip it, because two VIPs never overlap.
- **A star whose service the shop no longer has** at their minute does not come. The booking is dropped and nothing is drawn. Spec §9 leaves this to me.
- **Star visits count in the served badge,** as VIP visits do (spec §9).
- **Stars reuse `VIP_REVIEWS`** (3) and the VIP's photo toast text `vipPhotoToast`, which already has a `{name}`.
- **The call card reuses `vipCallTitle`, `vipCallGo` and `vipCallStay`.** It adds its own kicker, and a neutral line, because the VIP line says "Chị".
- **The hot card keeps `hotHead` for Mi Mi** and adds `hotIdolHead` for stars. So the KOL card is unchanged.
- **Hot runs:**
  - `EventBook` gains `hotDays` (the run's length, default `HOT_DAYS`), `hotBy` and `hotCardDay`.
  - A run covers `hotUntil - hotDays + 1 … hotUntil`.
  - `hotStarted` keeps its shape. The scene reads `eventBook.hotBy`.
  - Tests that set only `hotUntil` keep working.
- **The first-star note** is saved as hint `idol`, appended to `HINT_IDS`. `SummaryScene` marks it when the note shows.
- **Stars hum only while walking to or waiting at their seat or spot** (`toSeat`, `waiting`). They do not hum on the way out.
- **Hair pieces stay on the bed:** the bangs, the mohawk and the quiff carry `keep: true`. Every other worn piece comes off as usual.
- **Star colours reach the three mini-games stars use** (massage, shampoo, mask) through `MiniGameData.idol`.
- **The v25 fixture is frozen from the untouched code** in Task 1, before anything changes.

## Review Focus

1. **A reload while a star waits outside behind a VIP:** after the reload the star still comes the moment the VIP leaves, and visits count once. Test in Task 6.
2. **The star's service is gone by their minute** (the player sold the last bed): no customer, the booking is dropped, the shop's rng is untouched. Test in Task 5.
3. **A star's 3 stars on the last day of Mi Mi's hot run:** every day stays hot without a gap, and the next morning's card names the star. Test in Task 4.
4. **A VIP who stays until closing keeps the star outside:**
   - no star after closing;
   - next morning the stale booking is cleared;
   - a new booking can be made that night.

   Test in Task 5.
5. **The owner away at a branch while a VIP and later a star arrive:** two "Về ngay" cards, VIP first, each once. Test in Task 8.

---

### Task 1: The nine stars as data and words

**Files:**
- Create: `tests/fixtures/save-v25.json`, `src/sim/idols.ts`, `src/strings/idols.ts`
- Modify: `src/config.ts` (the VIP block), `tests/strings/strings.test.ts`

**Interfaces:**
- Produces:
  - `IdolId`.
  - `IDOL_IDS: IdolId[]` (first-round order).
  - `IdolSpec { look: Look; service: ServiceId }`; `photo` is added in Task 2.
  - `IDOLS: Record<IdolId, IdolSpec>`.
  - `IDOL_TEXT: Record<IdolId, IdolText>` where `IdolText { name: string; role: string; song: string; arrive: string; thanks: string }`.
  - The five config constants of Global Constraints.

- [ ] **Step 1: Freeze the v25 fixture from the untouched code.**
  - Use a throwaway Vitest file (delete it after) that builds, the way `tests/sim/chain.test.ts` builds a chain:
    - a main shop on day 40 with `vip.boardGiven = true`;
    - all four VIP photos true, `goldBoard` in `book.gifts`;
    - `eventBook.hotUntil = 41`;
    - one waiting VIP customer (`vip: 'singer'`);
    - a beach branch.
  - Write `JSON.stringify(chain.toSave())` to `tests/fixtures/save-v25.json` on one line.
  - Check: `"v":25` appears at its start.
- [ ] **Step 2: Write the failing strings test** in `tests/strings/strings.test.ts`, modelled on the VIP one at line 67:
  - `it("gives every star a name, a role, a song, an arrival line and a thanks within two bubble lines")`;
  - for each `IDOL_IDS` entry, every field is non-empty, and `arrive`, `thanks` and `` `♪ ${song} ♪` `` are each `≤ BUBBLE_MAX_CHARS`;
  - `expect(IDOL_IDS).toEqual(['sontung', 'taylor', 'gd', 'jennie', 'hieuthuhai', 'weeknd', 'taeyang', 'bieber', 'daesung'])`.
- [ ] **Step 3: Run it.** `npx vitest run tests/strings/strings.test.ts` fails: the module is missing.
- [ ] **Step 4: Write the code.**
  - `src/sim/idols.ts` holds the types and `IDOLS`. Each `look` is `{ skin, hair: 0, hairStyle, shirt: 0 }` from the table; the view never reads hair or shirt for a star.
  - `src/strings/idols.ts` holds `IDOL_TEXT`, with the table's names, roles and songs and the verbatim lines.
  - Add the config constants.
- [ ] **Step 5: Run it.** The strings test passes; `npx tsc --noEmit` is clean.
- [ ] **Step 6: Commit** with the message "Add the nine star guests' data and lines, and freeze the v25 save".

### Task 2: Signed photos and the Tường ngôi sao as items

**Files:**
- Modify: `src/sim/items.ts`, `src/sim/idols.ts` (`IdolSpec.photo`), `src/strings/vi.ts` (the item names beside `itemPhotoSinger`), `src/art/furniture.ts` (beside the VIP gifts, lines 497–553 and 723–727)
- Test: `tests/sim/items.test.ts`, `tests/art/furniture.test.ts`

**Interfaces:**
- Consumes: `IdolId`, `IDOLS` (Task 1).
- Produces:
  - the ten `ItemKind`s of Global Constraints, with `ITEMS` entries named `itemPhotoIdol<Id>` and `itemStarWall`;
  - `IdolSpec.photo: ItemKind`, the star's own photo kind;
  - textures `decor-photoIdol<Id>` as `{ w: 1, h: 1.7 }` and `decor-starWall` as `{ w: 2, h: 1.75 }`.

- [ ] **Step 1: Write the failing tests.**
  - `items.test.ts`:
    - the giftOnly list at line 102 gains the ten kinds, in order after `goldBoard`;
    - `it('makes each star photo a 1-tile gift of beauty 5 and the wall a 2-tile gift of beauty 9')` checks the exact specs of Global Constraints;
    - `IDOL_IDS.map(id => IDOLS[id].photo)` are the nine distinct photo kinds.
  - `furniture.test.ts`: the gift list at line 31 gains the ten kinds. That test already asserts width, `decor-` keys and that no two gifts share a body.
- [ ] **Step 2: Run them.** `npx vitest run tests/sim/items.test.ts tests/art/furniture.test.ts` fails.
- [ ] **Step 3: Write the code.**
  - Add the items, the names and `IdolSpec.photo`.
  - Add `idolPhoto(portrait)` beside `photo()`:
    - the same easel and gold frame, plus a small gold five-point star on the frame's top edge;
    - the signature as in `photo()`.
  - Draw nine portraits with `bust(shirt)` plus hair in the star's hex colour and their mark where it fits (spec §7.7). Use the hex colours of `docs/art/ngoi-sao-mat-truoc.mjs`:
    - Taylor: honey bangs, red lips;
    - The Weeknd: red suit, moustache;
    - Bieber: beanie, yellow hoodie;
    - G-Dragon: pink hair, white daisy;
    - Taeyang: spiky mohawk;
    - Daesung: crescent-eye grin, red bow tie;
    - HIEUTHUHAI: cobalt backwards cap;
    - Sơn Tùng: tall quiff, gold chain;
    - Jennie: black bangs, cream bow.
  - `starWall`: a lacquer board like `goldBoard`'s footing, with nine small gold stars in three rows of three.
- [ ] **Step 4: Run them.** They pass; the full `npx vitest run` passes.
- [ ] **Step 5: Commit** with the message "Add the nine signed star photos and the Tường ngôi sao as gift pieces".

### Task 3: The star book

**Files:**
- Modify: `src/sim/idols.ts`
- Test: `tests/sim/idols.test.ts` (new, modelled on `tests/sim/vips.test.ts`)

**Interfaces:**
- Consumes: `Booking` from `src/sim/vips.ts`, `Rng`, `Stars`, the config constants.
- Produces:
  - `IdolState { visits: number; best: number; photo: boolean; thanked: boolean }`
  - `IdolBooking { idol: IdolId; day: number; minute: number }`
  - `IdolBook { idols: Record<IdolId, IdolState>; booking: IdolBooking | null; nextDay: number; everBooked: boolean; wallGiven: boolean }`
  - `emptyIdolBook(): IdolBook`
  - `idolEligible(board: boolean, technicians: number, available: ServiceId[]): boolean`
  - `planIdol(book: IdolBook, day: number, board: boolean, technicians: number, available: ServiceId[], vip: Booking | null, rng: Rng): IdolBooking | null`
  - `dueIdol(book: IdolBook, day: number, minutes: number): IdolBooking | null`
  - `clearIdolStale(book: IdolBook, day: number): void`
  - `scoreIdol(book: IdolBook, gifts: ItemKind[], id: IdolId, stars: Stars): { photo: boolean; wall: boolean }`

- [ ] **Step 1: Write the failing tests.**
  - `planIdol returns null and draws nothing`:
    - without the board;
    - with 1 technician;
    - with no star's service open;
    - while a booking is pending;
    - before `nextDay`.
    - Use an rng that throws when called.
  - `books Sơn Tùng first, then down the list, skipping stars whose service is closed`:
    - all three services open, fresh book: `sontung`;
    - only shampoo open: `gd`;
    - with `sontung`, `taylor` and `gd` visited: `jennie`.
  - `picks at random among open stars once all nine have visited`: with an rng of fixed values, the pick follows the first draw.
  - `books a half hour from 10:00 to 17:00 for tomorrow`: over 50 seeds, `minute % 30 === 0` and `600 ≤ minute ≤ 1020`, and `booking.day === day + 1`.
  - `keeps at least 3 hours from tomorrow's VIP`:
    - VIP at 600: every minute is ≥ 780;
    - VIP at 780: every minute is ≤ 600 or ≥ 960 (50 seeds each);
    - a VIP booked for another day changes nothing.
  - `waits 3 to 5 days before the next booking`: over 50 seeds, `nextDay - (day + 1)` is in [3, 5], and all three values occur.
  - `dueIdol` and `clearIdolStale`: same cases as the VIP tests.
  - `scoreIdol`:
    - first 3 stars → photo pushed once, `thanked` true;
    - a later 3 stars → no second photo;
    - `best` is the max;
    - the ninth photo pushes `starWall` once, and `wallGiven` turns true;
    - 2 stars → nothing.
- [ ] **Step 2: Run them.** `npx vitest run tests/sim/idols.test.ts` fails.
- [ ] **Step 3: Write the code.**
  - Draws, in order: who (only once all nine have visited), the minute, the gap.
  - The minute is drawn uniformly from the allowed half-hours:
    - `slots = [600, 630, …, 1020]`;
    - if `vip?.day === day + 1`, keep only those with `|slot - vip.minute| ≥ IDOL_VIP_APART_MIN`;
    - then `minute = slots[Math.floor(rng() * slots.length)]`.
  - Set `nextDay = day + 1 + gap` and `everBooked = true`.
- [ ] **Step 4: Run them.** They pass.
- [ ] **Step 5: Commit** with the message "Book the stars from their own book: the first round in order, 3 hours from tomorrow's VIP, 3 to 5 days apart".

### Task 4: Hot runs that a star can start or extend

**Files:**
- Modify:
  - `src/sim/events.ts`: `EventBook`, `emptyEventBook`, `hotOn`, plus `HotBy`, `makeHot` and `hotCardToday`;
  - `src/sim/spa.ts`: Mi Mi's line 640 calls `makeHot`; `startDay` line 948 uses `hotCardToday`;
  - `src/view/events.ts`: `hotCard(by)`;
  - `src/scenes/SpaScene.ts:1357`: `hotCard(this.sim.eventBook.hotBy)`;
  - `src/strings/vi.ts`: `hotIdolHead`.
- Test: `tests/sim/events.test.ts`, `tests/sim/spa-events.test.ts`, `tests/view/events.test.ts`

**Interfaces:**
- Produces:
  - `type HotBy = 'kol' | IdolId`
  - `EventBook.hotDays: number` (default `HOT_DAYS`), `EventBook.hotBy: HotBy` (default `'kol'`), `EventBook.hotCardDay: number` (default 0).
  - `makeHot(book: EventBook, day: number, by: HotBy): void`
  - `hotCardToday(book: EventBook, day: number): boolean`
  - `hotCard(by: HotBy): GoldCard`
  - `hotOn` is now `hotUntil > 0 && day > hotUntil - hotDays && day <= hotUntil`.

- [ ] **Step 1: Write the failing tests** in `events.test.ts`:
  - `makeHot starts a run from tomorrow`:
    - on day 10: `hotUntil` 12, `hotDays` 2, `hotCardDay` 11;
    - hot on 11 and 12 only.
  - `makeHot extends a running spell without a gap`:
    - run 11–12, `makeHot` on day 12 by `'taylor'`: `hotUntil` 14, every day 11–14 hot, `hotCardDay` 13, `hotBy` `'taylor'`;
    - the same run with `makeHot` on day 11: `hotUntil` 13, days 11–13 hot.
  - `makeHot after a run has ended starts a new one`: run 11–12, `makeHot` on day 14: hot on 15 and 16 only.
  - `hotCardToday`:
    - true on a run's first day and on `hotCardDay`, false otherwise;
    - a book with only `hotUntil: 14` set is true on 13.
- [ ] **Step 2: Write the failing tests** in `spa-events.test.ts` and `view/events.test.ts`:
  - Review Focus 3: `a star's 3 stars on Mi Mi's last hot day keeps every day hot and shows the star's card the next morning`. Set up Mi Mi's run 13–14, `makeHot(book, 14, 'gd')`, then `startDay()` on day 15:
    - `hotStarted` is emitted;
    - `hotToday()` is true on 15 and 16.
  - `hotCard('kol')` equals the old card at line 87.
  - `hotCard('taylor').head` is `'Taylor Swift đăng ảnh tiệm mình'`, with the same name, line and `quiet`.
  - The `hotCard()` call at line 87 becomes `hotCard('kol')`.
- [ ] **Step 3: Run them.** The new tests fail.
- [ ] **Step 4: Write the code.**
  - `makeHot`:
    - if `hotUntil > 0 && hotUntil >= day`, the run goes on: keep its start (`hotUntil - hotDays + 1`), set `hotUntil = max(hotUntil, day + HOT_DAYS)`, and recompute `hotDays` from the start;
    - otherwise a new run: `hotUntil = day + HOT_DAYS`, `hotDays = HOT_DAYS`;
    - both: `hotBy = by`, `hotCardDay = day + 1`.
  - `hotCardToday` is `hotOn(book, day) && (day === hotUntil - hotDays + 1 || day === hotCardDay)`.
  - Mi Mi's path becomes `makeHot(this.eventBook, this.day, 'kol')`. For every shop without stars it gives the old `hotUntil` and a single card on the same morning.
- [ ] **Step 5: Run the full suite.** `npx vitest run` passes. The only old expectations allowed to change are the `hotCard()` call, plus the three new fields where a test pins the event book's exact shape (`tests/sim/save.test.ts:1279` waits for Task 6).
- [ ] **Step 6: Commit** with the message "Let a hot spell be started or stretched by anyone, the next morning's card naming who did it".

### Task 5: Stars in the shop

**Files:**
- Modify:
  - `src/sim/types.ts`: `Customer.idol`, plus the `idolArrived` and `idolServed` events;
  - `src/sim/spa.ts`: `idol` field, `spawnCustomer`, `payFor`, `isStanding`, `seatCustomer`, `loseCustomer`, `addReview`, `startDay`, `badgeShop`, the spawn block at line 1422, the day end at line 1468, and a new private `ownerOnlyHere()`;
  - `src/sim/crew.ts:364-368`.
- Test: `tests/sim/spa-idols.test.ts` (new; copy the helpers of `tests/sim/spa-vips.test.ts`, plus a `boardShop()` with `vip.boardGiven = true` and 2 technicians)

**Interfaces:**
- Consumes: Task 3's book functions, Task 4's `makeHot`, `IDOLS`.
- Produces:
  - `Customer.idol: IdolId | null`
  - `SpaSim.idol: IdolBook`
  - `spawnCustomer(opts: { …; idol?: IdolId })`
  - `{ type: 'idolArrived'; customerId: number; idol: IdolId; first: boolean }`
  - `{ type: 'idolServed'; customerId: number; idol: IdolId; stars: Stars; photo: boolean; wall: boolean }`

- [ ] **Step 1: Write the failing booking tests:**
  - `books no star before the gold board, or with one technician`: 40 day ends, `idol.booking` stays null and `everBooked` false.
  - `books Sơn Tùng for tomorrow the night the board comes`.
  - `books a star 3 hours from tomorrow's VIP`: set `vip.booking` for tomorrow at 600 before the day end; the star's minute is ≥ 780.
  - `plans no event on a star's day`.
  - `a branch never books a star`.
- [ ] **Step 2: Write the failing arrival tests:**
  - `brings the star at their minute`: `idolArrived` with `first: true`, and the customer has:
    - `idol` set, `vip: null`, `kind: 'celeb'`;
    - the star's own service;
    - `patienceMaxMs === Math.round(PATIENCE_MS * VIP_PATIENCE)`.
    - Also `visits` is 1 and the booking is null.
  - `keeps a star standing by the desk when every seat is taken`: `isStanding`, never `noSeat`.
  - `staff never fetch a star, and hold the star's bed while the owner is here`.
- [ ] **Step 3: Write the failing pay and review tests:**
  - `charges five times the graded price on a festival day, tipping on the plain price`.
  - `gives three reviews, and three angry ones on walking out`.
  - `leaves ownerServed, the generous tip and the kinds served alone but counts toward the quests`.
  - `makes the shop hot from tomorrow after 3 stars, giving the photo once`.
  - `counts star visits in the served badge`.
- [ ] **Step 4: Write the failing second-comer and edge tests:**
  - `the second comer waits outside until the first has left`, in both orders (VIP in the shop with a star due, and a star in the shop with a VIP due):
    - no second customer;
    - no arrival event;
    - the booking is still pending;
    - once the first is removed from `customers`, the next step spawns the second.
  - Review Focus 4: `a star kept outside until closing does not come`. The next `startDay` clears the booking, and that night's day end books again (with the gap passed).
  - Review Focus 2: `a star whose service is gone by the minute does not come, and the booking is dropped`:
    - remove every massage bed with Sơn Tùng due;
    - no customer;
    - `idol.booking` is null;
    - `sim.rng()` gives the same next value as on a twin sim without the booking.
- [ ] **Step 5: Run them.** `npx vitest run tests/sim/spa-idols.test.ts` fails.
- [ ] **Step 6: Write the code.**
  - A star takes every VIP branch of `spawnCustomer`:
    - look `IDOLS[id].look`, kind `VIP_KIND`;
    - service `IDOLS[id].service`, never drawn;
    - no festival or mask-first;
    - patience `PATIENCE_MS * VIP_PATIENCE * greetFactor`.
  - On arrival: `visits++`, clear the booking, emit `idolArrived`.
  - `payFor`:
    - price `plain * IDOL_PRICE_FACTOR`; no festival on `base`; the tip on `base`;
    - excluded from `ownerServed`, the generous draw and `noteServed`;
    - `scoreIdol` and `idolServed`;
    - on 3 stars, `makeHot(this.eventBook, this.day, c.idol)`.
  - Reviews: `VIP_REVIEWS` for a VIP or a star.
  - `isStanding` and `seatCustomer` treat a star as a VIP.
  - `crew.ts`: leave a star out of `queue`, and add the star's service to `vipHeld`.
  - The spawn block:
    - VIP: `if (b && !this.ownerOnlyHere())`;
    - star: `dueIdol`, then `ownerOnlyHere()`. If the service is in `availableServices()`, spawn; otherwise set `this.idol.booking = null`.
  - The day end, after `planBooking`:
    - `planIdol(this.idol, this.day, this.vip.boardGiven, technicians, this.availableServices(), this.vip.booking, createRng(this.day * 8737 + this.nextId))`;
    - `planEvent` gets `day + 1` when either book is booked for tomorrow, else null.
  - `startDay`: `clearIdolStale`.
  - `badgeShop.served`: add `IDOL_IDS` visits.
- [ ] **Step 7: Run the full suite.** `npx vitest run` passes. `same-draws` and every VIP test are untouched.
- [ ] **Step 8: Commit** with the message "Bring the booked stars to the shop as owner-only guests paying five times, the second of a VIP and a star waiting outside".

### Task 6: Save version 26

**Files:**
- Modify:
  - `src/sim/save.ts`: `SAVE_VERSION`, `SaveData.idol`, `parseShop` at lines 279–281, the version list at 568, a new exported `repairIdolBook`, and `repairEvents`;
  - `src/sim/spa.ts`: `toSave` and `fromSave`.
- Test: `tests/sim/save.test.ts`, `tests/save/code.test.ts`, plus every `toSave().v` expectation of 25

**Interfaces:**
- Produces:
  - `repairIdolBook(x: unknown, day: number): IdolBook`
  - `repairEvents` also repairs:
    - `hotDays`: an integer ≥ 1, else `HOT_DAYS`;
    - `hotBy`: `'kol'` or a known `IdolId`, else `'kol'`;
    - `hotCardDay`: `repairCount`.

- [ ] **Step 1: Write the failing tests** in a new `describe('save version 26')`, modelled on `describe('save version 25')`:
  - `opens the v25 chain as it was`: `parseSave(v25)` equals the fixture plus:
    - `idol: emptyIdolBook()` on every shop;
    - `hotDays: 2, hotBy: 'kol', hotCardDay: 0` on every event book;
    - `idol: null` on every customer.
    - Also the main shop is hot on 40 and 41.
  - `opens every older save and saves it as 26`: v1–v25.
  - `opens 26 and refuses 27`.
  - `repairs a damaged star book field by field`:
    - unknown ids are dropped;
    - `best` is capped at 3;
    - a booking more than a day ahead or for an unknown star is dropped;
    - `everBooked` is implied by visits or a booking.
  - `reads an unknown idol on a customer as null`.
  - Review Focus 1: `a star waiting outside behind a VIP still comes once after a reload`. Save via `viaJson` while the gate holds; after the VIP leaves the copy, the star arrives once, with `visits === 1`.
  - `keeps a waiting star through a reload`: the same idol, state and patience. Served after it: pays ×5, the photo once; a second reload gives nothing again.
  - `keeps a stretched hot run through a reload`.
- [ ] **Step 2: Update the old shape expectations:**
  - every `toSave().v` of 25 becomes 26;
  - the v24 equality test gains the defaults above;
  - `good` at line 1279 gains the three event fields;
  - `tests/save/code.test.ts` expects 26.
- [ ] **Step 3: Run them.** `npx vitest run tests/sim/save.test.ts tests/save/code.test.ts` fails.
- [ ] **Step 4: Write the code** following `repairVipBook` and the v25 bump (commit 270a5b9).
- [ ] **Step 5: Run the full suite.** `npx vitest run` passes.
- [ ] **Step 6: Commit** with the message "Save the star book, each customer's star and the stretched hot run, with save version 26".

**If master has a newer save version at merge time** (Đợt 5 is also planning v26), handle it during integration:
- rebase onto master;
- take the next free number N;
- freeze master's last version as `save-v{N-1}.json`, made the way Step 1 of Task 1 made v25 but from master's code;
- rename this describe;
- re-run every test.

### Task 7: The stars drawn in three directions

**Files:**
- Create: `src/art/idols.ts`
- Modify:
  - `src/art/chibi.ts`: merge `...IDOL_PARTS` beside `...OUTFIT_PARTS`;
  - `src/art/palette.ts`: `customerColors`, `CharacterColors.idol`;
  - `src/view/CharacterView.ts`: `IDOL_WORN`, `IDOL_FACE`, `keep`;
  - `src/view/miniGame.ts`: `MiniGameData.idol`;
  - `src/scenes/MassageScene.ts`, `ShampooScene.ts`, `MaskScene.ts`;
  - `src/scenes/SpaScene.ts`: line 1412 and the `serviceReady` data at 1207–1211.
- Test: `tests/art/chibi.test.ts`, `tests/view/worn.test.ts`, the palette test

**Interfaces:**
- Produces:
  - `IDOL_COLORS: Record<IdolId, { skin: number; hair: number; hairStyle: number; shirt: number }>`, with skin `SKIN[i]` and the rest the sketch's hex colours.
  - `IDOL_PARTS: Record<string, Part>`.
  - `customerColors(look, kind, regular = null, vip = null, kol = false, idol: IdolId | null = null)`. With a star it returns `{ ...IDOL_COLORS[idol], kind, idol }`.
  - `export const IDOL_WORN: Record<IdolId, { key: string; on: 'body' | 'face' | 'hair'; keep?: true }[]>`. The wear priority is visitor > idol > vip > regular > kind.
  - `MiniGameData.idol?: IdolId`.
  - `MiniGameData.hard` is true for a star too.

**Pieces and sides** (front views from the `.mjs`; side views face right; up views show no front details):

| Star | Key | on | Sides | keep |
|---|---|---|---|---|
| taylor | `bangsTaylor` | hair | down, side | yes |
| taylor | `redLips` | face | down, side | |
| taylor | `sequins` | body | down, side, up | |
| weeknd | `redSuit` | body | down, side, up | |
| weeknd | `moustache` | face | down, side | |
| bieber | `hoodie` | body | down, side, up | |
| bieber | `beanie` | hair | down, side, up | |
| gd | `daisyPin` | body | down, side | |
| gd | `hoops` | face | down, side | |
| taeyang | `tankChain` | body | down, side, up | |
| taeyang | `mohawk` | hair | down, side (spikes forehead to nape), up | yes |
| daesung | `bowTieSuit` | body | down, side, up | |
| hieuthuhai | `backCap` | hair | down, side (brim pointing back), up | |
| hieuthuhai | `jersey` | body | down, side, up (a big cobalt "2") | |
| sontung | `quiff` | hair | down, side, up | yes |
| sontung | `goldChainJacket` | body | down, side, up | |
| jennie | `bangsJennie` | hair | down, side | yes |
| jennie | `bow` | hair | down, side, up | |
| jennie | `tweed` | body | down, side, up | |

Daesung's face: `face-grin` (front) and `face-grinSide` (one curved eye) replace `face-down` and `face-side`. There is no up face, as for everyone.

- [ ] **Step 1: Write the failing tests:**
  - `chibi.test.ts`: `it("has every star's pieces in each side they list")`, over the table, in the form of the VIP test (exists, no `-line`, has an anchor, absent where not listed); plus `face-grin` and `face-grinSide`.
  - `worn.test.ts`: every `IDOL_WORN` key has a `-down` texture.
  - The palette test:
    - `customerColors(IDOLS.gd.look, 'celeb', null, null, false, 'gd')` has `hair === 0xF49AB4` and `idol === 'gd'`;
    - without a star, the result is unchanged.
- [ ] **Step 2: Run them.** `npx vitest run tests/art/chibi.test.ts tests/view/worn.test.ts` fails.
- [ ] **Step 3: Write the code.**
  - Port the `.mjs` front views to TypeScript `Part`s, then draw the side and up views. Clip-path ids stay unique per texture.
  - In `CharacterView`:
    - `this.sideFace` sits beside `this.frontFace`;
    - `setFacing` shows a worn piece when `(!lying || keep) && tex in PART_ANCHORS`.
  - `SpaScene` passes `c.idol` to `customerColors`, and `idol: c.idol ?? undefined` and the star's `hard` into `MiniGameData`.
  - The three mini-game scenes pass `this.params.idol ?? null` on.
- [ ] **Step 4: Run them.** The tests pass; `npx tsc --noEmit` is clean.
- [ ] **Step 5: Render a contact sheet of all nine in down, side, up, sitting and lying**, the way the sketch's `render.mjs` did. That is a Vite SSR load of `src/art/chibi.ts` with a Phaser stub; the old copy is in scratchpad `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\0a1ee854-be56-41cc-8c60-b0e3eb24d63d\scratchpad\stars\`.
  - Write the sheet to `.superpowers/sketch/ngoi-sao-3-huong.html`; it is git-ignored.
  - Report its path for the controller to look at.
- [ ] **Step 6: Commit** with the message "Draw the nine stars with their own pieces from the front, the side and behind, the hair pieces kept on the bed".

### Task 8: "Về ngay" for a star

**Files:**
- Modify:
  - `src/sim/chain.ts`: `idolCalls`, `route`, `goTo`, `callForWaitingVips`, `startDay`, `takeIdolCall`;
  - `src/view/chain.ts`: `ChoiceFigure`, `idolCallCard`;
  - `src/scenes/ChoiceScene.ts:87`;
  - `src/scenes/SpaScene.ts:430-443` (`callOwner`);
  - `src/strings/vi.ts`: `idolCallKicker`, `idolCallLine`.
- Test: `tests/sim/chain.test.ts`, `tests/view/chain.test.ts`

**Interfaces:**
- Produces:
  - `Chain.takeIdolCall(): IdolId | null`
  - `ChoiceFigure = { kind: 'vip'; vip: VipId } | { kind: 'idol'; idol: IdolId } | { kind: 'owner' }`
  - `idolCallCard(idol: IdolId): ChoiceText`

- [ ] **Step 1: Write the failing tests:**
  - `a star arriving at the main shop while the owner is at a branch calls her, once`.
  - `a star waiting when the owner leaves calls her`.
  - `going back to the main shop, or a new day, clears the star calls`.
  - Review Focus 5: `a VIP then a star while away give two calls in order`. `takeVipCall()` then `takeIdolCall()` each return once, then null.
  - `idolCallCard('jennie')`:
    - kicker `'Tiệm gốc · ngôi sao'`;
    - title `'Jennie đã đến tiệm gốc'`;
    - lines `[idolCallLine]`;
    - buttons `['Về ngay', 'Ở lại']`;
    - figure `{ kind: 'idol', idol: 'jennie' }`.
- [ ] **Step 2: Run them.** `npx vitest run tests/sim/chain.test.ts tests/view/chain.test.ts` fails.
- [ ] **Step 3: Write the code.**
  - `ChoiceScene` draws a star like a VIP (gold glow and five stars) with `customerColors(IDOLS[id].look, VIP_KIND, null, null, false, id)`.
  - `callOwner` takes a VIP call first, then a star call, each only when `shopFree()`.
- [ ] **Step 4: Run the full suite.** `npx vitest run` passes.
- [ ] **Step 5: Commit** with the message "Call the owner home from a branch when a star comes to the main shop".

### Task 9: Notices, greetings, humming and the star's sound

**Files:**
- Create: `src/view/idol.ts`
- Modify:
  - `src/view/vip.ts`: `summaryNotes`, `clockStar`;
  - `src/view/Hud.ts:228`;
  - `src/scenes/SummaryScene.ts:54`;
  - `src/sim/types.ts`: `HINT_IDS` gets `'idol'` at the end;
  - `src/scenes/SpaScene.ts`: `showMorningBanner`, the `idolArrived` and `idolServed` cases, the head star icon at line 1502, and humming in `update`;
  - `src/audio/cues.ts:29`;
  - `src/strings/vi.ts`: the booking, toast, first-note and wall keys.
- Test: `tests/view/idol.test.ts` (new), `tests/view/vip.test.ts`, the cue test if one lists cues

**Interfaces:**
- Produces:
  - `idolBookingText(key: 'idolBookingNote' | 'idolTodayToast', b: IdolBooking): string`
  - `todayToasts(vip: VipBook, idol: IdolBook, day: number): string[]`: today's VIP and star reminders, earlier minute first.
  - `humText(id: IdolId): string`, which returns `` `♪ ${song} ♪` ``.
  - `humNow(c: Customer, sinceMs: number, talking: boolean): boolean`: true for a star in `toSeat` or `waiting` with `sinceMs ≥ HUM_EVERY_MS` and not `talking`.
  - `summaryNotes(firstDay, vip, idol, events, day, vipHintDone, idolHintDone, rivalTarget)`: the booking lines are ordered by minute, each followed by its own first note.
  - `clockStar(vip, idol, events, day, minutes)`.

- [ ] **Step 1: Write the failing tests** in `tests/view/idol.test.ts`, updating `vip.test.ts` calls to the new signatures:
  - `idolBookingText('idolBookingNote', { idol: 'taylor', day: 5, minute: 900 })` is `'Ngày mai 15:00,\nngôi sao Taylor Swift hẹn massage'`.
  - `summaryNotes` puts a star at 11:00 above a VIP at 15:00, and the reverse.
  - `idolFirstNote` follows the star's line until `idolHintDone`.
  - With no star, the notes are exactly as before.
  - `clockStar` is true for a star due today from 60 minutes before their minute.
  - `todayToasts`:
    - a VIP-only day gives the old one toast;
    - a day with both gives two, the earlier first.
  - `humText('sontung')` is `'♪ Lạc Trôi ♪'`.
  - `humNow`:
    - false for `arriving`, `toStation`, `inService` and `leaving`;
    - false for a non-star;
    - false while `talking` (so the greeting is never cut);
    - false before 10 s;
    - true otherwise.
- [ ] **Step 2: Run them.** `npx vitest run tests/view` fails.
- [ ] **Step 3: Write the code.**
  - `showMorningBanner`: the first of `todayToasts` goes through `hud.toast`, the rest through `queueToast`. `studiedToastMs = LATE_TOAST_MS` when there is any.
  - `SummaryScene` passes `sim.idol` and `sim.hintDone('idol')`, and calls `sim.markHint('idol')` once the star's first note is shown.
  - `idolArrived` → `say(arrive, BUBBLE_MS.story)`.
  - `idolServed`:
    - on 3 stars, say the thanks;
    - on `photo`, `hud.toast(t('vipPhotoToast', { name }))`;
    - on `wall`, `queueToast(t('idolWallToast'))`.
  - The head star shows for a star as for a VIP.
  - Humming: a per-customer `humMs` map, advanced in `update` only while `!sim.paused && sim.servingCustomerId === null`.
    - Talking means the customer has a bubble or a queued line.
    - When `humNow`, `say(id, humText(idol), HUM_MS)` and reset.
    - Clear the entry once the star stops waiting.
  - `cues.ts`: `idolArrived` → `'vip'`.
- [ ] **Step 4: Run the full suite.** `npx vitest run` passes, `npx tsc --noEmit` is clean, and the build passes.
- [ ] **Step 5: Commit** with the message "Tell the stars' bookings on the summary, the morning and the clock, and let a waiting star hum their song title".

## After the tasks (controller)

- [ ] **Run the whole-branch review:** `superpowers:requesting-code-review` over `86a6a92..HEAD`, against this plan and the spec.
- [ ] **Check in the browser at 390 px** (the gstack `/browse` skill):
  - a shop with the Bảng vàng and a booked star: the summary line, the morning toast and the clock star;
  - the arrival bubble, humming, standing by the desk;
  - the owner serving: the hard mini-game in the star's colours, the ×5 payment, the thanks;
  - the photo in Kho and placed in the shop;
  - the next morning's hot card with the star's name;
  - all nine on the contact sheet in three directions;
  - "Về ngay" from a branch.
- [ ] **Before merging,** `git fetch`, check `origin/master` and the save version, and integrate in a temp worktree if master moved (see Task 6). Then merge, push, and report to anh.
