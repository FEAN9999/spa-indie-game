# Đợt 3 Phần 1 Lô B: Huy hiệu thành tựu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Nhiệm vụ panel gets a "Thành tựu" tab with 20 badges in a 4 × 5 grid and a detail box. A new badge shows a gold banner with the `levelUp` sound. Badges earned before day 8 are given silently. An old shop's first load gives what it already has as "Có từ trước", with one toast and no banner. Save v16 keeps the badges.

**Architecture:**
- **Pure rules.** `src/sim/badges.ts` holds the 20 badges as data. Each one has a count read from a `BadgeShop` snapshot, a goal, and whether it shows a progress ring. `newBadges(got, shop)` lists the ones just reached, in table order.
- **Judging in the sim.** `SpaSim` builds the snapshot (`badgeShop()`) and judges (`checkBadges()`) at three places:
  - at the end of every `step` that runs, which covers payments, walk-outs, finished courses, money, and every Build, Staff, Services or recipe action, since each is followed by a step;
  - in the day-end branch, after `recordDay` and before `dayEnded`;
  - at the end of `startDay`.

  A badge is stored as `id → day`. It emits `badge` only once the quest button is open.
- **Old shops.** In `fromSave`, a save with no badge list (`null`) gets every badge it already meets with day 0. That emits one `badgesFound` (when the button is open), and never `badge`.
- **View.** `QuestsScene` gets two tabs. `src/view/badges.ts` (pure) gives each badge's icon, text and status line. `SpaScene` queues the banners: one at a time, 3 s each, held while the summary is up and until the morning banner has gone.

**Tech Stack:** TypeScript, Phaser ^4.2.1 (view only), Vite ^8.3, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-3-nhiem-vu-design.md`, Lô B (§9), approved 2026-10-28. Rules in §5, §7.7, §7.8, §8.7, §8.8. Numbers in §10. Builder calls in §11. The look follows the approved sketch's "Thành tựu" tab and banner.

**Branch:** `dot-3-huy-hieu-b` in worktree `.superpowers/worktrees/dot-3-huy-hieu-b`, cut from master after the plan commit. Task 0 runs first, before any code change.

## Global Constraints

- **Layering:** `src/sim/**` never imports Phaser, `src/view/**`, `src/scenes/**`, `src/art/**` or `src/audio/**`. `src/view/badges.ts` never imports Phaser, so Vitest can load it.
- **Text:** all player-facing text lives in `src/strings/vi.ts`, copied exactly as listed in Task 4.
- **Numbers (`src/config.ts`), exactly:** `BADGE_GOALS = { served100: 100, served1000: 1000, goldHands: 50, busyDay: 25, pretty: 60, fullCrew: 7, million: 1_000_000, bigProfit: 1_000_000, diligent: 20, fullYear: 36 }` and `BADGE_BANNER_MS = 3000`.
- **Badge ids, in this order:** `served100, served1000, goldHands, busyDay, cleanDay, firstCard, fullBook, vipPhoto, vipBoard, allServices, firstRecipe, floor2, rooftop, pretty, fullCrew, masterTech, million, bigProfit, diligent, fullYear`.
- **Given once, kept forever.** A badge whose condition later fails (money spent, a technician leaves, the board sold) stays, and is never announced again.
- **No banner before day 8.** Badges earned while `questsOpen()` is false are stored with their day and emit nothing, then or later.
- **Save:**
  - `SAVE_VERSION = 16`, and every v1–v15 fixture still opens.
  - `badges` is `null` for a save without the field, so the first load judges it as an old shop.
  - A damaged list keeps only known ids with whole numbers ≥ 0, never a `SaveError`.
- **The shop's draws are untouched:** badges use no random stream, and `same-draws.test.ts` stays green.
- **Commits:** plain English subject lines in the repo's style, no attribution lines. Never stage `CLAUDE.md`.

## Review Focus

1. **An old shop's first load lands on the summary** (a v15 save with `dayOver`).
   - It gets its badges with day 0 and at most one `badgesFound`, and no `badge`.
   - Saving and loading again gives nothing more.
   - Test in Task 3.
2. **Badges earned before day 8 never turn into banners later**, on day 8 or after a reload. Test in Task 2.
3. **A badge whose condition later fails** (money below 1.000.000 đ, the seventh technician let go) stays earned and is not announced again when the condition comes back. Test in Task 2.
4. **Day-end badges** (Vẹn cả ngày, Ngày lãi lớn) are emitted before `dayEnded` in the same drain. The view holds their banner until the next morning's banner has gone, so it never plays under the summary. Sim order is tested in Task 2; the view is checked in the browser in Task 7.
5. **Several badges in one step** (a payment that reaches 100 served and 1.000.000 đ together) come out in table order, and the banners follow one another 3 s apart. Order is tested in Task 2; spacing in the browser.

---

### Task 0: A v15 fixture from the untouched code (before any code change)

**Files:**
- Create: `tests/fixtures/save-v15.json`

- [ ] **Step 1: Generate it with a throwaway vitest file, then delete the file.**
  - Start from the v14 fixture: `SpaSim.fromSave(parseSave(structuredClone(v14)), { rng: createRng(15), autoSpawn: false })`.
  - Then set:
    - `day = 20`, `clock.minutes = 600`, `money = 1_200_000`;
    - `services = ['shampoo', 'mask', 'massage']`;
    - `book.served.office = 120`;
    - `book.regulars.hanh` to `met: true, hearts: 3, meetDay: 9`;
    - `vip.vips.singer.photo = true`;
    - `progress.total.owner3 = 12`;
    - `progress.life = { dailies: 5, bestServed: 18, bestProfit: 640_000, cleanDay: true }`.
  - Assert `sim.beauty() < 60` before writing.
  - Write `sim.toSave()` as 2-space JSON.
  - Check: `v` 15, `floors` 2, `day` 20, no `badges` key.
- [ ] **Step 2: Commit.** `Add a v15 save fixture from before badges`

### Task 1: The badge rules

**Files:**
- Create: `src/sim/badges.ts`, `tests/sim/badges.test.ts`
- Modify: `src/config.ts`

**Interfaces:**
- **Produces:**
  - `BADGE_IDS` (the order in Global Constraints), `type BadgeId`.
  - `type Badges = Partial<Record<BadgeId, number>>`, mapping id to the day it was earned, with 0 for "Có từ trước".
- **Produces `interface BadgeShop`:**
  - `served` (lifetime);
  - `owner3`;
  - `bestServed` (the best day, today included);
  - `cleanDay: boolean`;
  - `members`, `fullHearts`, `photos`;
  - `boardHung: boolean`;
  - `services`, `recipes`, `floors`, `beauty`, `technicians`;
  - `masterTier`, the highest tier any technician has in any service;
  - `money`, `bestProfit`, `dailies`, `day`.
- **Produces `BADGES: Record<BadgeId, { count: (s: BadgeShop) => number; goal: number; ring: boolean }>`.** Yes/no badges count 1 for yes, with goal 1.

  | id | count | goal | ring |
  |---|---|---|---|
  | served100 | `served` | 100 | yes |
  | served1000 | `served` | 1000 | yes |
  | goldHands | `owner3` | 50 | yes |
  | busyDay | `bestServed` | 25 | yes |
  | cleanDay | `cleanDay` | 1 | no |
  | firstCard | `members` | 1 | no |
  | fullBook | `fullHearts` | `REGULAR_IDS.length` (8) | yes |
  | vipPhoto | `photos` | 1 | no |
  | vipBoard | `boardHung` | 1 | no |
  | allServices | `services` | `SERVICE_IDS.length` (6) | yes |
  | firstRecipe | `recipes` | 1 | no |
  | floor2 | `floors` | 2 | no |
  | rooftop | `floors` | 3 | no |
  | pretty | `beauty` | 60 | yes |
  | fullCrew | `technicians` | 7 | yes |
  | masterTech | `masterTier` | `MAX_TIER` (3) | no |
  | million | `money` | 1.000.000 | no |
  | bigProfit | `bestProfit` | 1.000.000 | yes |
  | diligent | `dailies` | 20 | yes |
  | fullYear | `day − 1` | 36 | yes |

- **Produces functions:**
  - `badgeEarned(id, s): boolean` is `count ≥ goal`.
  - `badgeProgress(id, s): [number, number] | null` is `[clamp(count, 0, goal), goal]` for ring badges and null for the rest.
  - `newBadges(got: Badges, s): BadgeId[]` lists the earned ids not in `got`, in `BADGE_IDS` order.

- [ ] **Step 1: Write the failing tests.**
  - `zeroShop()` is a helper with every field 0 or false, `floors` 1 and `day` 1.
  - For each of the 20 ids: earned at the goal and not one below it. For floor2 and rooftop, use floors 2 and 3. For fullYear, use day 37 against day 36.
  - `badgeProgress('served100', { ...zero, served: 63 })` equals `[63, 100]`. It caps at `[100, 100]` with 250. `badgeProgress('million', …)` is null.
  - `newBadges({ served100: 4 }, { ...zero, served: 100, money: 1_000_000 })` equals `['million']`.
  - The table order holds: a shop meeting floor2 and served100 gives `['served100', 'floor2']`.
- [ ] **Step 2: Run `npx vitest run tests/sim/badges.test.ts`.** Expected: FAIL, because the module is missing.
- [ ] **Step 3: Implement `badges.ts` and `BADGE_GOALS`.**
- [ ] **Step 4: Run `npm test`.** Expected: all pass.
- [ ] **Step 5: Commit.** `Add the twenty badges as rules over a snapshot of the shop`

### Task 2: Judging badges in the sim

**Files:**
- Modify: `src/sim/spa.ts`, `src/sim/types.ts`
- Create: `tests/sim/spa-badges.test.ts`

**Interfaces:**
- **Consumes:** Task 1.
- **Produces, events:** `SimEvent` adds `{ type: 'badge'; id: BadgeId }` and `{ type: 'badgesFound'; n: number }`.
- **Produces, `SpaSim`:**
  - `badges: Badges = {}`.
  - `badgeShop(): BadgeShop`, built from:
    - `served`: the sum of `book.served` plus every VIP's `visits`;
    - `owner3`: `progress.total.owner3`;
    - `bestServed`: `max(progress.life.bestServed, stats.served)`;
    - `cleanDay`, `bestProfit`, `dailies`: from `progress.life`;
    - `members`: regulars with `isMember`;
    - `fullHearts`: regulars with `hearts >= 5`;
    - `photos`: VIPs with `photo`;
    - `boardHung`: some item of kind `goldBoard`;
    - `services`: `services.length`;
    - `recipes`: solved recipes;
    - `floors`, `beauty()`, `money`, `day`;
    - `technicians`: technicians not leaving;
    - `masterTier`: the highest tier across technicians.
  - `private checkBadges(): void`. For each id from `newBadges`, it sets `badges[id] = day`, and emits `badge` only when `questsOpen()`.
  - `private findBadges(): void`, for an old shop's first load. Every earned id gets 0. If `n > 0` and `questsOpen()`, it emits `badgesFound` once.
- **Calls:** `checkBadges()` runs:
  - at the end of `step` (after the work, so not on its early return);
  - in the day-end branch, right after `recordDay` and before `planBooking` and `dayEnded`;
  - at the end of `startDay`.

- [ ] **Step 1: Write the failing tests**, on shops from `fresh()` and `day8()` as in `spa-quests.test.ts`.
  - **The 100th served:** with `book.served.office = 99`, `ownerServes` one customer. Then `advance(STEP_MS)`. Expect `badges.served100 === day` and one `{ type: 'badge', id: 'served100' }` after that visit's `questDone` and `paid` events.
  - **Before day 8:** on day 5 with `money = 1_000_000`, `advance(STEP_MS)` stores `million: 5` and emits nothing. Then step on to day 8 through `startDay`, with a step in between. Still no `badge`.
  - **Once, kept:** after `million` is earned, set `money = 10`, step, set `money = 2_000_000`, step. No second event, and the day is unchanged.
  - **Day end:** give the day 15 served and no walk-outs, end it with `advanceUntil(sim, () => sim.dayOver)`. The drain has `{ type: 'badge', id: 'cleanDay' }` before `dayEnded`.
  - **Table order:** with `book.served.office = 99` and `money = 990_000`, a paid visit gives `served100` then `million`.
  - **A full year:** with `day = 36`, `startDay()` stores `fullYear: 37` and emits it.
  - **The same draws:** `same-draws.test.ts` still passes.
- [ ] **Step 2: Run `npx vitest run tests/sim/spa-badges.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test`.** Expected: all pass.
- [ ] **Step 5: Commit.** `Judge the badges as the shop plays, silently before day 8, and once each`

### Task 3: Save v16 and an old shop's first load

**Files:**
- Modify: `src/sim/save.ts`, `src/sim/spa.ts`
- Modify: `tests/sim/save.test.ts`, `tests/save/code.test.ts`, and any test pinned to version 15
- Test: `tests/sim/spa-badges.test.ts`

**Interfaces:**
- **Save:**
  - `SAVE_VERSION = 16`.
  - `parseVersioned` accepts 15.
  - `SaveData.badges: Badges | null`.
  - `repairBadges(x): Badges | null`:
    - `undefined` or not an object gives null;
    - an object keeps only `BADGE_IDS` keys whose values are whole numbers ≥ 0.
- **SpaSim:**
  - `toSave` writes `badges`.
  - `fromSave` sets `sim.badges = data.badges ?? {}`, then calls `findBadges()` when `data.badges` was null. This runs before the `dayEnded` re-emit, next to `catchUpQuests`.

- [ ] **Step 1: Write the failing tests.**
  - **Parsing the v15 fixture:** `badges` is null.
  - **Repair:** `repairBadges({ served100: 9, nope: 3, million: -1, floor2: 2.5, vipPhoto: 0 })` equals `{ served100: 9, vipPhoto: 0 }`.
  - **Round trip:** a v16 save keeps `badges` through `toSave` and `parseSave`.
  - **The v15 fixture loaded:**
    - `badges` equals `{ served100: 0, cleanDay: 0, firstCard: 0, vipPhoto: 0, floor2: 0, million: 0 }`;
    - the drained events have exactly one `{ type: 'badgesFound', n: 6 }` and no `badge`;
    - loading its `toSave()` again gives no badge events;
    - after one `advance(STEP_MS)` there is still no `badge`.
  - **On the summary:** the same fixture with `dayOver: true` gives the same `badges`, one `badgesFound`, and `dayEnded` re-emitted.
  - **Before day 8:** the fixture with `day: 6` gets the same `badges` and no `badgesFound`.
  - **Old fixtures:** the v14 fixture opens, with `badges` null and then judged.
  - **Version pins:** tests pinned to 15 move to 16, the way lô A moved 14 to 15.
- [ ] **Step 2: Run `npx vitest run tests/sim/save.test.ts tests/sim/spa-badges.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test`.** Expected: all pass.
- [ ] **Step 5: Commit.** `Save v16 keeps the badges, and an old shop's first load gives what it has as Có từ trước`

### Task 4: Badge text, status lines and icons

**Files:**
- Create: `src/view/badges.ts`, `src/art/badges.ts`, `tests/view/badges.test.ts`
- Modify: `src/strings/vi.ts`, `src/strings/format.ts`, `src/scenes/BootScene.ts`

**Interfaces:**
- **`format.ts`:** `formatCount(n)` groups thousands with dots ("1.000"). `formatMoney(n)` becomes `formatCount(n) + ' đ'`.
- **`view/badges.ts`:**
  - `BADGE_TEXT: Record<BadgeId, { name: StringKey; cond: StringKey }>`.
  - `BADGE_ICON: Record<BadgeId, string>`, the texture keys `badge-<icon>`, with icons from the sketch:

    | Icon | Badges |
    |---|---|
    | person | served100 |
    | people | served1000, busyDay, fullCrew |
    | star | goldHands |
    | heart | cleanDay |
    | card | firstCard |
    | book | fullBook |
    | photo | vipPhoto |
    | plaque | vipBoard |
    | lotus | allServices |
    | bowl | firstRecipe |
    | stairs | floor2 |
    | flower | rooftop |
    | sparkle | pretty |
    | medal | masterTech |
    | coins | million |
    | chart | bigProfit |
    | list | diligent |
    | cake | fullYear |
  - `badgeStatus(id, got: Badges, s: BadgeShop): { text: string; done: boolean }` gives one of:
    - "Có từ ngày {day}", when got with a day above 0;
    - "Có từ trước", when got with 0;
    - "Đã được {n}/{goal}" for a ring badge, with `formatCount`;
    - "Đã được {n} / {goal}" with `formatMoney`, for bigProfit;
    - "Chưa có" otherwise.
- **`art/badges.ts`:**
  - `badgeTextures()` returns one 60 × 60 SVG texture per icon (`viewBox -30 -30 60 60`, `pxPerUnit` 1.15). Each is the sketch's path, stroked white at width 4.35 with round caps and joins, and no fill. The view tints it.
  - It is registered in `BootScene` beside `fxTextures()`.
- **Strings, exactly:**
  - `tabBadges: 'Thành tựu'`
  - `badgesCount: 'Đã có {n}/{total} huy hiệu'`
  - `badgeNew: 'Huy hiệu mới'`
  - `badgeSince: 'Có từ ngày {day}'`
  - `badgeFromBefore: 'Có từ trước'`
  - `badgeProgress: 'Đã được {n}/{goal}'`
  - `badgeProgressMoney: 'Đã được {n} / {goal}'`
  - `badgeNotYet: 'Chưa có'`
  - `badgesFoundToast: 'Tiệm đã có sẵn {n} huy hiệu. Xem ở nút Nhiệm vụ.'`
- **The 20 names and conditions**, as `badge<Id>` and `badge<Id>Cond`:

  | Id | Name | Condition |
  |---|---|---|
  | Served100 | Trăm khách | Phục vụ 100 khách. |
  | Served1000 | Nghìn khách | Phục vụ 1.000 khách. |
  | GoldHands | Tay vàng | Tự tay làm 50 khách 3 sao. |
  | BusyDay | Ngày đông | Phục vụ 25 khách trong một ngày. |
  | CleanDay | Vẹn cả ngày | Một ngày có từ 15 khách, không ai bỏ về. |
  | FirstCard | Thẻ đầu tiên | Một khách quen làm thẻ thành viên. |
  | FullBook | Sổ đầy trang | Mọi khách quen đủ 5 tim. |
  | VipPhoto | Ảnh ký tặng | Có ảnh ký tên đầu tiên của khách VIP. |
  | VipBoard | Bảng vàng | Treo bảng vàng của khách VIP. |
  | AllServices | Đủ món | Mở đủ 6 dịch vụ. |
  | FirstRecipe | Pha đúng | Pha đúng công thức đầu tiên. |
  | Floor2 | Lên lầu | Mở tầng 2. |
  | Rooftop | Sân thượng | Mở sân thượng. |
  | Pretty | Tiệm xinh | Điểm đẹp của tiệm đạt 60. |
  | FullCrew | Đủ thợ | Có 7 kỹ thuật viên. |
  | MasterTech | Thợ cả | Một thợ lên bậc 3 ở một dịch vụ. |
  | Million | Triệu đầu | Có 1.000.000 đ trong két. |
  | BigProfit | Ngày lãi lớn | Lãi 1.000.000 đ trong một ngày. |
  | Diligent | Chăm chỉ | Xong 20 nhiệm vụ trong ngày. |
  | FullYear | Tròn năm | Tiệm mở tròn một năm, 36 ngày. |

- [ ] **Step 1: Write the failing tests.**
  - `formatCount(1000)` is '1.000' and `formatCount(63)` is '63'.
  - `badgeStatus` gives, with the zero shop from Task 1:
    - "Có từ ngày 9" for `{ million: 9 }`;
    - "Có từ trước" for `{ million: 0 }`;
    - "Đã được 63/100" for served 63;
    - "Đã được 120/1.000" for served1000 with served 120;
    - "Đã được 450.000 đ / 1.000.000 đ" for bigProfit;
    - "Chưa có" for an unearned vipPhoto.
  - Every id has a name, a condition and an icon key.
- [ ] **Step 2: Run `npx vitest run tests/view/badges.test.ts tests/strings`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test` and `npm run build`.** Expected: all pass, and the build is clean.
- [ ] **Step 5: Commit.** `Name the badges, word their status, and draw their icons`

### Task 5: The two tabs and the badge grid

**Files:**
- Modify: `src/scenes/QuestsScene.ts`, `src/art/palette.ts` (add `terracotta` only if it is missing)

**Interfaces:**
- **Consumes:** Task 4, `sim.badges` and `sim.badgeShop()`.
- **Produces:** `addMedal(scene, id, x, y, opts: { got: boolean; ring: [number, number] | null }): Phaser.GameObjects.Container` in a new `src/view/medal.ts`, for both the grid and the banner.
  - **Got:** a mustard disc of r 64 with an ink stroke of 5, an inner ring of r 50 in `mustardDark` at width 4, and the icon tinted ink.
  - **Not got:** a sand disc with a dashed ink stroke of 4. Phaser has no dash, so draw it as arcs of 14 px with gaps of 10. The icon is tinted `C.soft` at alpha 0.55.
  - **Ring:** when `ring` is set and above 0, a teal arc of width 9 from the top, clockwise to `n/goal`, with round dots at its ends.
- **Layout, from the sketch:**
  - **Tabs:** `TAB_Y` 418, height 110, width 440, x 300 and 780. Labels are `navQuests` and `tabBadges` at size 44, with `'primary'` for the open tab and `'plain'` for the other.
  - **The first open's intro** now takes the title's place (y 290, wrap 860, 32 px) on the quests tab. On the badges tab, the title shows. **(em quyết: the tabs take the spot where the intro sat)**
  - **The quests tab** is unchanged below the tabs.
  - **The badges tab:**
    - `badgesCount` at (90, 545), 40 px, weight 800.
    - Medals at `cx = 175 + (i % 4) × 243`, `cy = 655 + ⌊i / 4⌋ × 200`. Each name sits at `cy + 96`, 27 px, weight 700, in ink if got and soft if not.
    - A tap area of 220 × 200 around each medal selects it. The selected one gets a teal ring of r 78 and width 7.
    - **Detail box:** a cream rounded rect at (80, 1600, 920, 190), radius 40, with an ink stroke of 4.
      - name at (120, 1650), 40 px, weight 800;
      - condition at (120, 1702), 30 px, weight 600;
      - status at (120, 1752), 30 px, weight 700, in teal when `done` and soft otherwise.
  - **Selection:** it starts on `served100` and is kept while the panel stays open.

- [ ] **Step 1: Implement.** View-only, with no unit test. The pure parts are tested in Task 4.
- [ ] **Step 2: Run `npm test` and `npm run build`.** Expected: all pass, and the build is clean.
- [ ] **Step 3: Commit.** `Add the Thành tựu tab: twenty medals with progress rings and a detail box`

### Task 6: The gold banner, the sound and the found toast

**Files:**
- Modify: `src/scenes/SpaScene.ts`, `src/view/Hud.ts`, `src/audio/cues.ts`, `tests/audio/cues.test.ts`

**Interfaces:**
- **Hud:**
  - `lastBannerAt` is a public field set in `banner()`, like `lastToastAt`.
  - `BANNER_MS = 2500` is exported, the morning banner's on-screen time.
- **cues:** `badge` and `badgesFound` map to null. The banner plays `levelUp` itself when it shows, so queued banners each get their sound.
- **SpaScene:**
  - `private badgeQueue: BadgeId[]` and `private badgeUntil = 0` are reset in `create`.
  - `case 'badge'` pushes the id.
  - `case 'badgesFound'` stores the toast text in `private foundToast: string | null`.
  - `private pumpBadges()` runs at the end of the non-modal branch of `update`. It does nothing while `sim.dayOver`. Otherwise:
    - a waiting `foundToast` goes out through `queueToast`;
    - when `now >= max(badgeUntil, hud.lastBannerAt + BANNER_MS)` and the queue has an id, it shows that banner and sets `badgeUntil = now + BADGE_BANNER_MS`.
  - **The banner** is a container at depth `HUD_DEPTH + 60`:
    - a `goldPale` rounded rect at (110, 236, 860, 200), radius 50, with an ink stroke of 5;
    - `addMedal` at (230, 336), got;
    - `badgeNew` at (330, 300), 32 px, weight 700, terracotta;
    - the name at (330, 352), 50 px, weight 800;
    - the condition at (330, 400), 28 px, weight 600, soft.

    It fades in over 250 ms, stays, fades out over the last 250 ms of `BADGE_BANNER_MS`, and plays `sound.play('levelUp')` when it shows.

- [ ] **Step 1: Write the failing test.** `cueFor({ type: 'badge', id: 'million' })` is null, and so is `cueFor({ type: 'badgesFound', n: 3 })`.
- [ ] **Step 2: Run `npx vitest run tests/audio/cues.test.ts`.** Expected: FAIL. The new events do not typecheck until Task 2's types exist; if they already do, the switch's default may already pass. In that case, note it in the ledger.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test` and `npm run build`.** Expected: all pass, and the build is clean.
- [ ] **Step 5: Commit.** `Show a gold banner with the level-up sound for each new badge, one at a time and never under the summary`

### Task 7: Verify and ship

- [ ] **Step 1: Run `npm test` and `npm run build` on the branch.** Expected: all pass.
- [ ] **Step 2: Browser checks at iPhone size.** Use gstack `$B` on a dev build:

  ```bash
  NODE_ENV=development npx vite build --outDir .superpowers/dist-dev
  npx vite preview --outDir .superpowers/dist-dev
  ```

  Press buttons with a single `emit('pointerup')`.
  1. **Tabs:** both tabs show, and switching keeps the panel. The first open's intro sits in the title's place.
  2. **Grid:** it fits the card. "Ngày lãi lớn", "Sổ đầy trang" and the longest condition do not overflow. The rings show progress. A tap selects and fills the detail box, including "Có từ trước" and a money status.
  3. **Banners:** two badges at once show one after another, 3 s each, each with the sound, and they clear the morning banner.
  4. **Day end:** a Vẹn cả ngày badge at closing shows after "Ngày mới", not under the summary.
  5. **Old shop:** the v15 fixture shows "Tiệm đã có sẵn 6 huy hiệu. Xem ở nút Nhiệm vụ." with no banner, and its six medals read "Có từ trước".
  6. **Console:** no errors.
- [ ] **Step 3: Final whole-branch review, then ship.**
  - Fetch, and merge onto the latest `origin/master` in a temp worktree if master moved.
  - Run the tests again and push master.
  - Report to anh in Vietnamese.
