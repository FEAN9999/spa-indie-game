# Step 1b Batch 6: Stock and Restocking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From day 5 every service uses up stock (shampoo, face masks, massage oil, towels). The player restocks 20 at a time from a "Kho" tab in the services panel, and the end-of-day card splits the day into money in, money out and profit.

**Architecture:**
- **Sim:** `src/sim/stock.ts` holds what each service uses and the prices. `SpaSim` keeps the counts.
  - A customer uses their items at the moment they claim a bed (`sendToBed`), the one place both the owner and the technicians start a service.
  - The checks happen when a fetch starts and again on arrival, so nobody lies down without stock.
- **Owner first:** the owner still wins over a technician, now for the last units of stock as well as the last bed.
- **View:** the services panel gains two tabs. The HUD plate gains a red dot. The summary card gains its Thu / Chi / Lãi rows.

**Tech Stack:** TypeScript, Phaser ^4.2.1, Vite ^8.3, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-26-step-1b-batches-2-7-design.md`. Batch 6 is its §10; §6.4 has the unlock rules and §8.1 the debt rules.

## Global Constraints

### Rules carried over
- Free only. No new npm dependencies. All art is drawn in code as SVG strings, like `src/art/fx.ts`.
- **Style A:** cream, wood and teal tones, a 4 px ink `#4A2E22` outline at canvas scale, chunky rounded shapes.
- **Strings:** every player-visible string comes from `src/strings/vi.ts`.
- **Layering:** `src/sim/**`, `src/save/**`, `src/app/**` and `build/**` never import `phaser`, `src/view` or `src/scenes`.
- **Screen:** canvas 1080×2160. The primary target is iPhone 17 Safari (402×874).
  - Cards use `addCard` and buttons use `addButton`.
  - Font is Be Vietnam Pro, weight 600 or 800.
  - Every button is at least 120 px tall.
- **Keep the 2D panels simple.** Anh may move the game to a 3D view later, keeping the sim and the saves. Spend the effort on the sim, not on panel polish.
- **Old shops must survive.** A shop saved by any earlier version opens as the same shop.
  - `tests/fixtures/save-v1.json` to `save-v5.json` pin the old versions.
  - `save-v5.json` is committed with this plan. It was written by the batch-5 code: day 6, all three services open, a receptionist, two technicians serving (massage and mask), the owner in a shampoo mini-game, and a picky customer waiting.

### Stock (spec §10, §8.1)

| item | `StockItem` | name | price for 20 | used by |
|---|---|---|---|---|
| Dầu gội | `shampoo` | `stockShampoo` | 80 000 | shampoo |
| Khăn | `towel` | `stockTowel` | 60 000 | every service |
| Mặt nạ | `mask` | `stockMask` | 240 000 | mask |
| Tinh dầu | `oil` | `stockOil` | 360 000 | massage |

- **Uses and order:** each service uses one of its own item and one towel: shampoo uses `['shampoo', 'towel']`, mask uses `['mask', 'towel']`, massage uses `['oil', 'towel']`. The service's own item comes first, so a toast names it first.
- **Panel order:** `STOCK_ITEMS = ['shampoo', 'towel', 'mask', 'oil']`, the spec's table order.
- **Tracking starts on day 5** (`UNLOCK_DAY.stock`). Before that nothing is used up and nothing is ever missing.
  - Every shop starts with `STOCK_START = 20` of each item. That 20 is the spec's gift on day 5, because nothing is used before then.
  - Old saves get 20 of each, whatever their day.
- **Restocking:**
  - Adds `RESTOCK_AMOUNT = 20` at once.
  - Always allowed, even when the money is short or already below zero. The money may go negative.
  - The cost is added to the day's `restock` spending.
- **Low stock:** at `LOW_STOCK = 5` or fewer of an item (tracked, and used by an open service):
  - The "Dịch vụ" plate wears a red dot.
  - When a use takes an item from 6 down to 5, the game toasts `stockLow` once. Restocking above 5 re-arms the toast.
- **Out of stock:**
  - The owner taps a waiting customer whose service lacks an item: toast `stockOut` with that item, and the owner stays put.
  - Technicians skip that customer. The customer waits and, as always, walks out when patience runs out.
- **Summary:** shows Thu (service money and tips), Chi (wages and restocking) and Lãi trong ngày (Thu − Chi). Buying furniture and opening services are investments, so they are not in Chi.

### Strings to add to `vi.ts`

All copy is exact:
- **Items:** `stockShampoo` 'Dầu gội', `stockTowel` 'Khăn', `stockMask` 'Mặt nạ', `stockOil` 'Tinh dầu'.
- **Toasts:**
  - `stockLow` '{item} sắp hết'.
  - `stockOut` 'Hết {item}. Nhập thêm ở Dịch vụ › Kho'. Here `{item}` is the item name lower-cased with `toLocaleLowerCase('vi')`, giving 'Hết dầu gội…'.
- **Tabs and hint:** `tabServices` 'Dịch vụ', `tabStock` 'Kho', `hintStock` 'Xem kho và nhập hàng ở đây'.
- **Stock tab:**
  - `stockIntro` 'Mỗi dịch vụ tốn 1 khăn và 1 món riêng. Thiếu tiền vẫn nhập được.'
  - `stockLeft` 'Còn {n}'.
  - `stockUsedBy` 'Dùng cho {name}' and `stockUsedByAll` 'Dùng cho mọi dịch vụ'.
  - `restock` 'Nhập {n} · {money}'.
- **Summary:** `summaryIn` 'Thu', `summaryOut` 'Chi', `restockCost` 'Nhập hàng', `profit` 'Lãi trong ngày'.

### Workflow
- Work on branch `step-1b-stock`. Never `git add -A`; list the files. Never stage `CLAUDE.md`.
- Commit with `git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "…"`.
  - No attribution lines.
  - Messages are plain sentences about what the player gets.
- Anh has authorized merging into `master` and pushing once `npm test`, `npm run build` and the browser run-through pass (Task 4). Nothing else outward-facing.

## Review Focus

1. **The last towel.** The owner's customer and a technician's customer both need the last unit of an item. Nobody lies on a bed without stock, and the owner's customer gets it, as with the last bed. (Task 1.)
2. **Broke, out of stock and owing wages, all at once.** Restocking still works with the money below zero, and the shop serves and earns its way back. (Spec §12. Task 1.)
3. **Before day 5, and old shops.**
   - Before day 5 nothing is used up or refused.
   - On day 5 the shop has 20 of each.
   - A v5 shop already on day 6 opens with 20 of each and is tracked straight away. (Task 1.)
4. **Reload during a service.** The items were taken when the customer claimed the bed. Reopening the save and finishing the service takes nothing more. (Task 1.)
5. **The warning and the red dot follow the count.**
   - `stockLow` fires once when an item reaches 5.
   - Restocking above 5 re-arms it.
   - The red dot shows exactly while some used item is at 5 or fewer. (Tasks 1 and 2.)

---

### Task 1: Stock in the shop's rules, and save version 6

**Files:**
- Create: `src/sim/stock.ts`
- Modify:
  - `src/config.ts`
  - sim: `src/sim/types.ts`, `src/sim/spa.ts`, `src/sim/crew.ts`, `src/sim/save.ts`
  - `src/scenes/SpaScene.ts`: the two new events become toasts.
  - `src/strings/vi.ts`: the item names, `stockLow` and `stockOut`.
- Test: `tests/sim/stock.test.ts` (new), `tests/sim/save.test.ts`

**Interfaces:**
- Consumes: `ServiceId` and `SERVICES`, `sendToBed` (the one place a customer claims a bed), `makeWayForOwner` and `fetchWaiting` in `crew.ts`.
- Produces:
  - **`config.ts`:**
    - `RESTOCK_PRICE = { shampoo: 80000, towel: 60000, mask: 240000, oil: 360000 } as const`
    - `RESTOCK_AMOUNT = 20`, `STOCK_START = 20`, `LOW_STOCK = 5`
  - **`src/sim/stock.ts`:**
    - `export type StockItem = 'shampoo' | 'towel' | 'mask' | 'oil'`
    - `export const STOCK_ITEMS: StockItem[]`, in the panel order.
    - `export const STOCK_USES: Record<ServiceId, StockItem[]>`
    - `export const STOCK_NAME: Record<StockItem, StringKey>`
    - `export const fullStock = (): Record<StockItem, number>`
  - **`types.ts`:**
    - `DayStats.restock: number`, the money spent restocking today.
    - Two new events: `{ type: 'stockLow'; item: StockItem }` and `{ type: 'stockOut'; item: StockItem }`.
  - **`SpaSim`:**
    - `stock: Record<StockItem, number>`
    - `stockTracked(): boolean`, true from day `UNLOCK_DAY.stock`.
    - `missingStock(service: ServiceId): StockItem | null`: the first item of `STOCK_USES[service]` with a count below 1 while tracked; else null.
    - `lowStock(): StockItem[]`: while tracked, the items at `LOW_STOCK` or fewer that an open service uses, in `STOCK_ITEMS` order.
    - `restock(item: StockItem): void`
  - **Save:** `SAVE_VERSION = 6`. `SaveData.stock` is added, and `stats.restock` is saved.

- [ ] **Step 1: Write the failing tests** in `tests/sim/stock.test.ts`. Use a day-5 shop built like `fresh()` in `tests/sim/services.test.ts`, and `seatAndWait`, `startService`, `hireStaff` and `advanceUntil` from `helpers.ts`.

```ts
it('uses one of the service\'s own item and one towel when a customer takes a bed, from day 5 only', () => {
  // day 4: startService → stock unchanged (20 each), no stockLow/stockOut events
  // day 5: startService (shampoo) → shampoo 19, towel 19, mask 20, oil 20; the same for a technician's customer
})
it('restocks 20 for its price at any money, and counts it as today\'s spending', () => {
  // money 50_000, restock('oil') → money -310_000, oil 40, stats.restock 360_000; restock again → -670_000, 60, 720_000
})
it('warns once when an item reaches 5, and again after restocking above 5', () => {
  // towel 6 → one service → events contain exactly one { type: 'stockLow', item: 'towel' }; next service (towel 4) → none
  // restock('towel') → 24; set towel to 6, serve → stockLow again
  // lowStock() === ['towel'] at 5; [] after restock; never lists 'mask' or 'oil' while those services are closed
})
it('refuses the owner a customer whose item is out, and technicians skip that customer', () => {
  // shampoo 0: tap a waiting shampoo customer → event { type: 'stockOut', item: 'shampoo' }, owner.task null, owner.path []
  // a hired technician stays idle while that customer waits; after restock('shampoo') the technician fetches them
})
it('gives the owner the last towel when a technician is heading for another customer', () => {
  // towel 1: customer a waiting, technician fetching a; owner taps customer b (also needs a towel) →
  // technician's task null; b reaches 'inService'; towel 0; a is never sent to a bed while towel is 0
})
it('never lays a customer on a bed when the last unit went to someone else on the way', () => {
  // towel 1, two technicians, two waiting customers → exactly one reaches a bed; towel 0; the other stays 'waiting'
})
it('keeps a shop that is broke, out of stock and owing wages able to earn again', () => {
  // day 5, a technician hired, money -200_000, shampoo 0 and towel 0, a waiting customer
  // restock('shampoo'), restock('towel') → money -340_000; the technician serves the customer → money rises above -340_000
})
it('takes the items once even when the shop is saved and reopened during the service', () => {
  // day 5, startService → shampoo 19, towel 19; SpaSim.fromSave(sim.toSave()) → shampoo 19, towel 19;
  // completeService on the reopened sim → still 19 and 19
})
```

Add to `save.test.ts`:
- `stock` and `stats.restock` round-trip through a v6 save.
- v1–v5 saves, including the new `save-v5.json`, open with 20 of each item and `stats.restock` 0. The v5 fixture opens on day 6 with three customers in service and a picky customer waiting, and `stockTracked()` is true.
- A missing, negative, fractional or non-number count is repaired to 20, and an invalid `stats.restock` to 0.

- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/sim/stock.test.ts tests/sim/save.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement it.**
  - **`sendToBed`:** while tracked, take one of each item in `STOCK_USES[c.service]`. Emit `stockLow` when an item goes from above `LOW_STOCK` to `LOW_STOCK` or below.
  - **Owner tap** in `tapTile`, on a waiting customer, in this order:
    1. If `missingStock(service)` is not null, emit `stockOut` and return.
    2. Otherwise check for a busy bed, as today.
    3. Then call `makeWayForOwner`.
  - **Owner arrival:** in `updateOwnerTask`'s fetch branch, before `sendToBed`, if an item is missing, emit `stockOut` and drop the task, the way the busy bed does.
  - **`makeWayForOwner`:** after the bed rule, run the same rule for stock. For each item the owner's customer uses, while the technicians' fetches of customers using that item number at least the item's count, drop the last-hired such fetch.
  - **`fetchWaiting`:** a customer is fetchable only if, for each of their items, the count is above the number of fetches in flight (owner's and technicians') of customers using it. This only applies while tracked.
  - **Technician arrival:** in the fetch-to-serve step, if an item is missing, drop the task without `sendToBed`.
  - **`restock(item)`:** take the money, add `RESTOCK_AMOUNT`, and add the price to `stats.restock`. `emptyStats` gets `restock: 0`.
  - **Save:**
    - v1–v5 upgrade through a `withFullStock` step: `fullStock()` and `stats.restock` 0.
    - `parseSave` repairs each count to a non-negative integer, else `STOCK_START`, and `stats.restock` to a finite number, else 0.
  - **`SpaScene`:** shows `stockLow` as `t('stockLow', { item: t(STOCK_NAME[item]) })` and `stockOut` as `t('stockOut', { item: t(STOCK_NAME[item]).toLocaleLowerCase('vi') })`, through `hud.toast`.
- [ ] **Step 4: Run the checks.** Run `npm test` (expected: PASS) and `npm run build` (expected: OK).
- [ ] **Step 5: Commit.** "From day 5 every service uses shampoo, masks, oil and towels from the shop's stock, restocked 20 at a time even on credit, and the shop remembers its stock".

### Task 2: The stock tab, the red dot and the day-5 hint

**Files:**
- Modify:
  - scenes: `src/scenes/ServicesScene.ts`, `src/scenes/SpaScene.ts`
  - view: `src/view/Hud.ts`
  - sim: `src/sim/types.ts`, `src/sim/tutorial.ts`
  - art: `src/art/fx.ts`
  - `src/strings/vi.ts`
- Test: `tests/sim/tutorial.test.ts`, `tests/art/fx.test.ts` (create it if there is none)

**Interfaces:**
- Consumes: `stock`, `lowStock()`, `restock(item)`, `STOCK_ITEMS`, `STOCK_USES`, `STOCK_NAME` and `RESTOCK_PRICE` (Task 1).
- Produces:
  - `HINT_IDS` gains `'openStock'`. `pickHint` returns `{ hint: 'openStock' }` when `day === UNLOCK_DAY.stock` and the hint is not done. It checks this after `openServices`.
  - **Icons** in `fx.ts`: `stock-shampoo`, `stock-towel`, `stock-mask` and `stock-oil`, round 56 px badges like `svc-*`. They show a bottle, a rolled towel, a mask sachet and an oil dropper bottle.
  - **`ServicesData`** gains `tab: 'services' | 'stock'` and `stockIntro: boolean`.
  - **`ServicesScene`:**
    - From day 5, two tabs under the title: `tabServices` and `tabStock`. They are laid out like StaffScene's tabs, and the services rows move down below them. Before day 5 the panel is unchanged.
    - **The stock tab** has one row per item in `STOCK_ITEMS` that an open service uses. Each row shows:
      - the icon and the item name;
      - `stockLeft`, in `C.lantern` at 5 or fewer;
      - `stockUsedBy` with the service's name, or `stockUsedByAll` for the towel;
      - on the right, a primary button `restock` with `n: 20` and the price.
    - Tapping the button calls `restock`, then `onChange`, then redraws the panel.
    - `stockIntro` shows under the title the first time.
  - **`SpaScene.openServices()`:**
    - Opens on the stock tab when stock is unlocked and either `openStock` is not done or `lowStock()` is not empty. Otherwise it opens on the services tab.
    - `stockIntro = !hintDone('openStock')` once stock is unlocked. It then marks `openStock` when stock is unlocked.
  - **`Hud`, on the services plate:**
    - It wears "Mới" while `openServices` is not done, or while stock is unlocked and `openStock` is not done.
    - It shows a lantern-red dot with an ink outline, about 30 px across, at its top-right while `lowStock()` is not empty.
  - **`updatePointer`** shows `hintStock` at `SERVICES_PLATE_TOP` for the `openStock` pointer.

- [ ] **Step 1: Write the failing tests.**
  - `pickHint` on day 5 gives `openStock`, and after `markHint('openStock')` gives null.
  - On day 6, an old shop that never saw the hint gets no hand.
  - On day 5, a shop that never saw `openServices` still gets `openStock`, because the services hand belongs to day 4 only.
  - The four `stock-*` keys are in `fxTextures()`.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/sim/tutorial.test.ts tests/art`. Expected: FAIL.
- [ ] **Step 3: Implement the tab, the plate and the hint.** "Nhập 20 · 360.000 đ" must fit its button. Widen the action column or lower the font to 30, but the button stays at least 120 px tall.
- [ ] **Step 4: Run the checks.** Run `npm test` (expected: PASS) and `npm run build` (expected: OK).
- [ ] **Step 5: Look at it in the dev server at 402×874.** Screenshot these, and check no text is cut off:
  - the day-5 hand on the plate;
  - the stock tab the first time, with the intro;
  - the stock tab with an item at 5, showing the red count and the red dot on the plate;
  - the services tab with its rows below the tabs.
- [ ] **Step 6: Commit.** "Restock from a Kho tab in the services panel from day 5, with a red dot on the button when something runs low".

### Task 3: Thu, Chi and Lãi on the end-of-day card

**Files:**
- Create: `src/view/summary.ts`
- Modify: `src/scenes/SummaryScene.ts`, `src/strings/vi.ts`
- Test: `tests/view/summary.test.ts` (new)

**Interfaces:**
- Consumes: `DayStats.restock` (Task 1).
- Produces: `export function summaryRows(stats: DayStats): SummaryRow[]` in `src/view/summary.ts`. It is pure, with no Phaser, so it can be tested.
  - `SummaryRow` is `{ label: StringKey; value: number; kind: 'count' | 'money' | 'heading' }`.
  - **The rows, in order:**
    1. `served` and `leftUnhappy`.
    2. A `summaryIn` heading, then `income` and `tips`.
    3. Only when `wages` or `restock` is above 0: a `summaryOut` heading, then `wages` (negative) if above 0, then `restockCost` (negative) if above 0.
    4. `profit`, equal to income + tips − wages − restock.
  - **The scene:**
    - Appends `balance` and `rating` itself, as today.
    - Draws headings as small `C.teal` labels with no value.
    - Shows `profit` in `C.lantern` when it is below 0.
    - May grow the card or tighten the row spacing so every row and the "Ngày mới" button fit. The first-day line still fits on day 1.

- [ ] **Step 1: Write the failing tests** for `summaryRows`:
  - A day with no wages or restocking has no `summaryOut` heading, and its profit equals income + tips.
  - A day with wages 120 000 and restocking 140 000 lists both as negative values, and its profit is 400 000 + 50 000 − 120 000 − 140 000 = 190 000.
  - A day of only restocking shows `restockCost` without `wages`.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/view/summary.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `summaryRows` and use it in `SummaryScene`.**
- [ ] **Step 4: Run the checks.** Run `npm test` (expected: PASS) and `npm run build` (expected: OK).
- [ ] **Step 5: Look at it in the dev server at 402×874.** Screenshot these three cards, and check nothing overlaps or is cut off:
  - day 1, with no Chi;
  - a day-5 card with wages and restocking;
  - a card with a loss.
- [ ] **Step 6: Commit.** "Split the end-of-day card into money in, money out and the day's profit, with restocking among the costs".

### Task 4: Check everything and ship

**Files:** none new. This task only fixes what the checks find, then merges and pushes.

- [ ] **Step 1: Run the tests and the build.** Run `npm test` and `npm run build`. Expected: all pass, and the build is OK.
- [ ] **Step 2: Play through it on the dev server** at 402×874 with an iPhone user agent:
  1. On a v5 fixture shop moved to day 5:
     - the "Dịch vụ" plate wears "Mới" and the hand points at it with `hintStock`;
     - the panel opens on the Kho tab with the intro.
  2. Serve a shampoo customer: Dầu gội and Khăn each go down by one.
  3. Bring towels down to 6 and serve one customer: the "Khăn sắp hết" toast shows once, and the plate shows the red dot.
  4. With shampoo at 0, tap a waiting shampoo customer: the toast reads "Hết dầu gội. Nhập thêm ở Dịch vụ › Kho", and the owner stays put. A hired technician does not fetch that customer.
  5. Restock with the money below zero: the money goes further below zero, and the red dot clears once nothing is low.
  6. End the day: the card shows Thu, Chi (wages and Nhập hàng) and Lãi trong ngày.
  7. Reload in the middle of a service: the counts are the same after the reload.
  8. Open the v1, v2, v3, v4 and v5 fixtures.
  9. The console shows no errors.

  Save screenshots in the plan workspace.
- [ ] **Step 3: Check the production build.** Run `npx vite preview --port 4173 --strictPort` and open the v5 fixture. Expected: no console errors.
- [ ] **Step 4: Ship.**
  1. Run `git checkout master && git merge --ff-only step-1b-stock && git push origin master`.
  2. Watch the Actions run with curl until it completes with success.
  3. Check that `https://fean9999.github.io/spa-indie-game/version.json` shows the new commit.
  4. Check that the live site opens a day-5 shop whose "Dịch vụ" plate wears "Mới".
