# Ngôi sao lô B: the guest book's "Ngôi sao" page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fourth tab "Ngôi sao" in the guest book, with the nine stars on one 3 × 3 page and a page of their own for each star met.

**Architecture:** The pure rows and lines go in `src/view/guestBook.ts` next to the VIP ones, and are unit-tested. `src/scenes/GuestBookScene.ts` draws them, following the VIP tab: a cell per star, then a detail page on tap. There is no save change, because lô A already saves everything the page shows (`IdolBook`: visits, best, photo, thanked, everBooked).

**Tech Stack:** Phaser 4, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-ngoi-sao-design.md`, §7.8 (lô B), with §7.12 for the lines.

## Global Constraints

- In code, a celebrity guest is always `idol`, never `star`. `VipId 'star'` is Bích Câu, and `'star'` is also a texture.
- No save change, no new hint, and no new dot on the book button. The button keeps its old rule (spec §7.8).
- Song titles only, never lyrics.
- The tab shows from the first star booking: `idol.everBooked`.
- The four tab labels "Khách quen", "Kiểu khách", "VIP" and "Ngôi sao" must fit their buttons at 390 px wide.
- New vi keys, verbatim:
  - `tabIdol: 'Ngôi sao'`
  - `idolHums: 'Hay ngân nga: {song}'`. `{song}` is `humText(id)`, so it reads "Hay ngân nga: ♪ Lạc Trôi ♪".
- Reuse these existing keys: `vipVisits` ("Đã ghé: {n}"), `vipPhotoYes`, `vipPhotoNo`, and `regularLikes` ("Thích: {service}") for the star's service.
- Stars are drawn as in lô A's call card: `customerColors(IDOLS[id].look, VIP_KIND, null, null, false, id)`.

## Review Focus

1. **The four tab labels at phone width.** The 44 px label of a 3-tab row overflows a 230 px button. The 4-tab layout carries its own smaller font, and the browser check looks at it at 390 px.
2. **A star booked while the VIP tab is hidden** (a damaged or odd save). The book shows three tabs, regulars, kinds and idol, in the 3-tab layout, and does not crash. Covered by a `bookTabs` test in Task 1.
3. **A star met but never at 3 stars.** The cell says "Chưa có ảnh", and the page has the arrival line only, no thanks. Covered by `idolRows` and `idolDetailLines` tests in Task 1.
4. **Long names in a narrow cell** ("Sơn Tùng M-TP", "Justin Bieber", "HIEUTHUHAI"). The names wrap inside the cell instead of running into the next one. They are wrapped to the cell width, and the browser check looks at them.
5. **The book opened at a branch.** A branch's idol book never books, so the branch shows no star tab, exactly as its VIP tab works today. The scene uses the open shop's `sim`, as it already does, so no code is needed. The browser check opens the book once at the main shop.

---

### Task 1: The star rows, lines and tab list

**Files:**
- Modify: `src/view/guestBook.ts`
- Modify: `src/scenes/GuestBookScene.ts:108-109`, the one `bookTabs` call and its `TAB_LAYOUT` index only, so tsc stays clean. The tab stays undrawn until Task 2.
- Modify: `src/strings/vi.ts`, next to `tabVip`.
- Test: `tests/view/guestBook.test.ts`

**Interfaces:**
- Consumes (lô A):
  - `IDOL_IDS`, `IdolId`, `IdolBook` and `IdolState { visits, best, photo, thanked }` from `src/sim/idols.ts`;
  - `IDOL_TEXT[id].{ name, role, song, arrive, thanks }` from `src/strings/idols.ts`;
  - `emptyIdolBook()`.
- Produces:
  - `export type Tab = 'regulars' | 'kinds' | 'vip' | 'idol'`
  - `export interface IdolRow { id: IdolId; met: boolean; visits: number; best: number; photo: boolean }`
  - `export function idolRows(idol: IdolBook): IdolRow[]`: one per star in `IDOL_IDS` order, met once `visits > 0`.
  - `export const idolDetailLines = (id: IdolId, state: IdolState): string[]`: `[]` before the first visit, then `[arrive]`, then `[arrive, thanks]` once `state.thanked`.
  - `export const bookTabs = (vip: VipBook, idol: IdolBook): Tab[]`: `'regulars'` and `'kinds'`, then `'vip'` if `vip.everBooked`, then `'idol'` if `idol.everBooked`.
  - `firstTab` is unchanged. Stars only come once the VIPs have, so the VIP rule still holds.

- [ ] **Step 1: Write the failing tests** in `tests/view/guestBook.test.ts`:
  - **"lists the nine stars in book order, unmet at first":**
    - `idolRows(emptyIdolBook()).map(r => r.id)` equals `IDOL_IDS`;
    - every row is `!met`, with 0 visits, 0 best and no photo.
  - **"shows a met star's visits, best stars and photo, and a 2-star one without a photo":**
    - set `taylor` to `{ visits: 2, best: 3, photo: true, thanked: true }` and `gd` to `{ visits: 1, best: 2, photo: false, thanked: false }`;
    - `rows[1]` equals `{ id: 'taylor', met: true, visits: 2, best: 3, photo: true }`;
    - `rows[2]` equals `{ id: 'gd', met: true, visits: 1, best: 2, photo: false }`;
    - `rows[0].met` is false.
  - **"shows a star's words only once said":**
    - `idolDetailLines('jennie', { visits: 0, best: 0, photo: false, thanked: false })` is `[]`;
    - with `{ visits: 1, best: 2, photo: false, thanked: false }` it is `[IDOL_TEXT.jennie.arrive]`;
    - with `{ visits: 2, best: 3, photo: true, thanked: true }` it is `[IDOL_TEXT.jennie.arrive, IDOL_TEXT.jennie.thanks]`.
  - **Update** "shows the VIP tab only once a VIP has been booked" to the new signature, `bookTabs(vip, emptyIdolBook())`, and add **"shows the star tab once a star has been booked, last":**
    - with `vip.everBooked` and `idol.everBooked`, the tabs are `['regulars', 'kinds', 'vip', 'idol']`;
    - with only `idol.everBooked`, they are `['regulars', 'kinds', 'idol']` (Review Focus 2).
  - In `tests/strings/strings.test.ts`, add `t('tabIdol')` and `t('idolHums', { song: '♪ Lạc Trôi ♪' })`. The second must equal `'Hay ngân nga: ♪ Lạc Trôi ♪'`.
- [ ] **Step 2: Run them.** `npx vitest run tests/view/guestBook.test.ts tests/strings` fails because `idolRows` is not exported.
- [ ] **Step 3: Write the code.**
  - Make the `guestBook.ts` changes listed under Interfaces.
  - Add the two vi keys.
  - In `GuestBookScene`, pass `this.params.sim.idol` to `bookTabs`.
  - Widen `TAB_LAYOUT`'s index type only as far as tsc needs. The 4-tab layout itself is Task 2.
- [ ] **Step 4: Run the full suite.** `npx vitest run` passes and `npx tsc --noEmit` is clean.
- [ ] **Step 5: Commit** with the message "Add the guest book's star rows, lines and tab, shown once a star has booked".

### Task 2: Draw the "Ngôi sao" tab and each star's page

**Files:**
- Modify: `src/scenes/GuestBookScene.ts`

**Interfaces:**
- Consumes:
  - Task 1's `idolRows`, `idolDetailLines` and `bookTabs`;
  - `humText(id: IdolId): string` from `src/view/idol.ts`;
  - `IDOLS[id].{ look, service }` from `src/sim/idols.ts`;
  - `IDOL_TEXT` and `VIP_KIND`.

- [ ] **Step 1: Four tabs.**
  - Add `4: { w: 230, x: [177, 419, 661, 903] }` to `TAB_LAYOUT`.
  - Give every layout its label size: 2 and 3 keep 44, and 4 uses 34. Pass the size to `addButton`.
  - Add `idol: 'tabIdol'` to `TAB_LABEL`.
  - Index the layout by `tabs.length as 2 | 3 | 4`.
- [ ] **Step 2: The grid.** When `this.tab === 'idol'`, draw `idolRows(sim.idol)` with a new `idolCell(row, i)`. Write it like `vipCell`, in 3 columns of 3 rows:
  - Constants: `IDOL_COL_X = [55, 390, 725]`, `IDOL_CELL_W = 300`, `IDOL_CELL_H = 400`, `IDOL_SCALE = 1.2`. Rows start at `GRID_TOP`, and the card is `IDOL_CELL_H - 20` tall.
  - **A met star**, centred in the cell:
    - the figure, feet at `y0 + 200`;
    - the name at `y0 + 240`, 34 px, wrapped to `IDOL_CELL_W - 30`;
    - three stars at `y0 + 290`;
    - "Đã ghé" at `y0 + 330`, 28 px;
    - the photo line at `y0 + 362`, 26 px, teal when the photo is given.
  - **An unmet star:** the figure at `UNMET_ALPHA`, and `'???'` where the name goes (spec: "bóng mờ, không tên").
  - **A tap on a met cell** opens `{ kind: 'idol', id }`.
- [ ] **Step 3: The page.** `Detail` gains `{ kind: 'idol'; id: IdolId }`. `show()` routes it to a new `showIdolDetail(id)`, written like `showVipDetail`:
  - the figure at `(230, 690)`, `DETAIL_SCALE`;
  - at `tx = 400`: the name at 450 (54 px), the role at 515, `regularLikes` with the star's service at 575, and `t('idolHums', { song: humText(id) })` at 635, all 32 px and wrapped to 600;
  - the three stars at 700, and `vipVisits` at 760;
  - from y 850, the lines of `idolDetailLines(id, state)`, laid out like the VIP lines.
- [ ] **Step 4: Verify.** `npx tsc --noEmit` is clean, `npx vitest run` passes, and `npx vite build --outDir .superpowers/dist-check` passes.
- [ ] **Step 5: Commit** with the message "Draw the guest book's Ngôi sao tab, nine stars on one page, and each met star's own page".

## After the tasks (controller)

- [ ] Run the whole-branch review over `96af35c..HEAD` against this plan and spec §7.8.
- [ ] **Browser check at 390 px** with the gstack `$B` and a dev build:
  - the book with four tabs, where the labels fit;
  - the star page with a mix of stars: unmet ones in shadow, a 2-star one with no photo, and a 3-star one with the photo;
  - a star's own page, with "Hay ngân nga: ♪ … ♪" and both lines;
  - long names inside their cells.
- [ ] **Before merging,** `git fetch` and check `origin/master`. This lô has no save change, so a moved master only needs a merge and a re-test. Then push and report to anh.
