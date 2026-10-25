# Step 1b Batch 1: Save, Publish Online, Install as App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The whole family opens one link, plays across many days without losing progress, installs the game on the home screen, plays offline, and gets new versions without doing anything; plus the four small bugs left from style A.

**Architecture:** Same layering as before. `SpaSim` learns to write and read a plain-JSON `SaveData` (`src/sim/save.ts`). A Phaser-free `src/save/` layer keeps three slots in `localStorage`, turns a save into a short paste-able code, and owns every write through `SaveSession`, so a reload can never be followed by a stale save. A new `PauseScene` replaces the HUD's tap-anywhere overlay and holds slots, export, import and the install card. A hand-written service worker, generated at build time by a small Vite plugin, precaches the build and serves the page network-first; the game checks `version.json` when the player returns and reloads into the same spot. GitHub Actions builds `master` and publishes it to GitHub Pages.

**Tech Stack:** TypeScript ^7.0, Phaser ^4.2.1 (with `dom.createContainer`), Vite ^8.3, Vitest ^5.0, Node 24, `@fontsource/be-vietnam-pro` ^5.3, GitHub Actions + GitHub Pages. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-25-step-1b-batch-1-design.md` (this batch), within `docs/superpowers/specs/2026-10-25-spa-game-design.md` (sections 3, 5.12, 6, 7).

## Global Constraints

- Free only, and no new npm dependencies (runtime or dev).
- Every player-visible string comes from `src/strings/vi.ts`. Only exception: the app name "Tiệm Spa" in `index.html` and `public/manifest.webmanifest`, which the browser reads before any script runs.
- `src/sim/**`, `src/save/**`, `src/app/**`, `src/art/outline.ts` and `build/**` must not import `phaser` or anything from `src/view`, `src/scenes`. `build/**` must not import Node modules either: `tsc` has no Node types (no `@types/node`), and the tests pull `build/sw.ts` into the type check. File-system work stays in `vite.config.ts`, which `tsc` does not check.
- Canvas 1080×2160, `Scale.FIT`, `CENTER_BOTH`. Primary target iPhone 17 Safari (viewport 402×874), also Android Chrome and tablets. Page background `#F3E6D3`.
- Style A for every new screen: cards `C.paper` with a 4 px `C.ink` (#4A2E22) outline and radius 60; primary button `C.teal` fill with `C.paper` text; plain button `C.cream` fill with `C.ink` text; Be Vietnam Pro at 600 or 800 only.
- Numbers from the design: 3 save slots; autosave every 10 s (`AUTOSAVE_MS = 10_000`); wait at most about 3 s for a new version (`UPDATE_WAIT_MS = 3_000`, service worker navigation timeout 3000 ms).
- Opening the game goes straight into the last-used slot (slot 1 on first open). Never show a slot picker on open.
- Never reload while the player is playing: a reload for a new version only happens on return to the app, never while the shampoo mini-game is open.
- A restored mid-day shop opens on the pause screen; a restored ended day opens on the summary; a restored mini-game restarts from its first step after "Chơi tiếp".
- A save that cannot be read is moved aside to `spa.slot.<n>.broken`, never deleted.
- The site is `https://fean9999.github.io/spa-indie-game/`; all asset URLs are relative (`base: './'`).
- Work on branch `step-1b-save-online` (already created from `master`, design committed). Never commit to `master` until anh says to merge. Never `git add -A`. Every commit runs as `git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit …`, with no attribution lines.
- Never push, change GitHub settings or sign in anywhere without anh's explicit OK (Task 10).
- Out of scope: deleting a slot or restarting a used slot, cloud sync, game name and custom domain, owner creation, tutorial, sound, the older 1a nits (`SH_HAIR`, hint tween, owner legs behind the summary, `index.html` title).

## Review Focus

1. A save that fires during a reload (`pagehide`, the autosave timer) must not overwrite the slot the player just switched to or the shop they just imported. (Task 2 tests `switching slots saves this shop, then never writes again` and `an imported shop cannot be overwritten by a later save`.)
2. Save codes pasted back from Zalo or Notes come with line breaks and spaces and must still load. (Task 2 test `accepts a code that a chat app broke into lines and padded with spaces`.)
3. Storage that throws (blocked, private mode) or is full must not stop the game from starting and playing. (Task 2 test `keeps playing when the storage refuses to work`.)
4. Coming back to the app with the mini-game open while a new version is out must not reload. (Task 6 test `never reloads while a service is in progress or in dev`.)
5. Any file the game loads that is missing from the precache list makes the first offline open a blank page. (Task 6 test `precaches every built file except maps and woff fallbacks` and the dist check in Task 6 Step 7.)

---

## File Structure

```
src/sim/save.ts            SaveData, SAVE_VERSION, SaveError, parseSave()
src/sim/spa.ts             SpaSim.toSave(), SpaSim.fromSave()
src/save/store.ts          SaveStore over localStorage: slots, current slot, flags; openStore()
src/save/code.ts           encodeSaveCode() / decodeSaveCode()
src/save/session.ts        SaveSession: the only writer; switch, import and update reloads
src/app/install.ts         installPlatform(), beforeinstallprompt capture
src/app/update.ts          BUILD_ID, service worker registration, latestVersion(), shouldReload(), onReturn()
src/globals.d.ts           declare const __BUILD_ID__: string
build/sw.ts                precacheList(), renderServiceWorker() (pure; the plugin that uses them lives in vite.config.ts)
build/sw-template.js       the service worker, with __VERSION__ and __FILES__ placeholders
src/scenes/PauseScene.ts   pause menu, slots, export, import, confirm, install card
src/view/ui.ts             addCard(), addButton() for Phaser-drawn cards and buttons
src/view/dom.ts            codeBox(), domButton(): HTML pieces over the canvas (textarea, gesture-safe buttons)
src/art/icon.ts            appIconSvg(); scripts/icons.html + scripts/icons.ts render it to PNG
src/art/outline.ts         fillsOnly() / linesOnly() for brown character outlines
public/manifest.webmanifest, public/icons/*.png
.github/workflows/deploy.yml
Modified: src/scenes/SpaScene.ts, src/view/Hud.ts, src/view/topBar.ts, src/view/text.ts,
          src/view/CharacterView.ts, src/art/chibi.ts, src/art/room.ts, src/art/fx.ts, src/sim/grid.ts,
          src/strings/vi.ts, src/config.ts, src/main.ts, index.html, vite.config.ts, tsconfig.json
```

## Browser checks

Use the gstack `/browse` skill's binary, as in the earlier plans:

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse.exe"
"$B" goto "http://localhost:5173/" && "$B" viewport 402x874
"$B" screenshot "<scratchpad>/<name>.png"   # then Read the png
"$B" js "<expression>"                       # read state
"$B" console --errors                        # expect none
```

Dev server: `npm run dev -- --port 5173 --strictPort` in the background. Production build: `npm run build`, then `npx vite preview --port 4173 --strictPort` in the background. Dev hooks: `window.__spa.sim`, `.spa`, `.game`, and from Task 3 `.store`, `.session`. iPhone user agent for install checks:
`Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1`

---

### Task 1: Save and restore the shop in the sim

**Files:**
- Create: `src/sim/save.ts`
- Modify: `src/sim/spa.ts`, `tests/sim/helpers.ts` (add `busyShop()`)
- Test: `tests/sim/save.test.ts`

**Interfaces:**
- Produces:
  - `SAVE_VERSION = 1`, `class SaveError extends Error`.
  - `interface SaveData { v: number; day: number; minutes: number; money: number; reviews: number[]; stats: DayStats; dayOver: boolean; servingCustomerId: number | null; owner: Owner; customers: Customer[]; stationCustomers: (number | null)[]; seatCustomers: (number | null)[]; nextId: number; untilArrivalMs: number }`. `minutes` is `DayClock.minutes`; `stationCustomers[i]` is station `i`'s `customerId`; `seatCustomers[i]` is `seats[i].customerId`; `reviews` holds only the last `RATING_WINDOW`.
  - `parseSave(raw: unknown): SaveData`: throws `SaveError` unless `raw` is an object with `v === SAVE_VERSION`, finite numbers for `day`, `minutes`, `money`, `nextId`, `untilArrivalMs`, arrays for `reviews`, `customers`, `stationCustomers`, `seatCustomers`, objects for `owner` (with `pos`) and `stats`, boolean `dayOver`, and `servingCustomerId` number or null. When `SAVE_VERSION` becomes 2, this is where v1 data is upgraded; an older version is never rejected.
  - `SpaSim.toSave(): SaveData`: a deep copy (`structuredClone`), safe to `JSON.stringify`.
  - `static SpaSim.fromSave(data: SaveData, options: SpaSimOptions): SpaSim`: throws `SaveError` when `stationCustomers`/`seatCustomers` lengths differ from the layout. Starts unpaused. Queues `serviceReady` (customer and station) when `servingCustomerId` is set, and `dayEnded` with a copy of `stats` when `dayOver`, so the scene's existing handlers reopen the mini-game or the summary.
  - `busyShop(): SpaSim` in `tests/sim/helpers.ts`: `autoSpawn: false`, seed 1, one customer waiting, a second one walking to a seat, the owner on the way to fetch the first, money 123456.

- [ ] **Step 0: Commit the plan**

```bash
git add docs/superpowers/plans/2026-10-25-step-1b-batch-1-save-online.md
git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "Add the plan for step 1b batch 1"
```

- [ ] **Step 1: Write the failing tests** in `tests/sim/save.test.ts`

```ts
const opts = () => ({ rng: createRng(2), autoSpawn: false })
const viaJson = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())

it('restores a busy shop exactly and keeps playing it the same way', () => {
  const sim = busyShop()
  const copy = viaJson(sim)
  expect(copy.toSave()).toEqual(sim.toSave())
  sim.advance(5000)
  copy.advance(5000)
  expect(copy.toSave()).toEqual(sim.toSave())
})

it('reopens the mini-game for a customer who was being served', () => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  const c = startService(sim) // move the helper from spa-owner.test.ts into helpers.ts
  const copy = viaJson(sim)
  expect(copy.drainEvents()).toContainEqual({ type: 'serviceReady', customerId: c.id, stationId: c.stationId })
  const before = copy.money
  copy.completeService(c.id, 3)
  expect(copy.money).toBe(before + SHAMPOO_PRICE + tipFor(SHAMPOO_PRICE, 3))
})

it('shows the summary again for a day that had ended', () => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  advanceUntil(sim, () => sim.dayOver, 8 * 60_000)
  const copy = viaJson(sim)
  expect(copy.drainEvents()).toEqual([{ type: 'dayEnded', stats: sim.stats }])
  copy.startDay()
  expect([copy.day, copy.dayOver, copy.clock.minutes]).toEqual([2, false, DAY_START_MIN])
})

it('does not reopen anything for a shop between customers', () => {
  const sim = busyShop()
  expect(viaJson(sim).drainEvents()).toEqual([])
})

it('saves only the reviews the rating uses', () => {
  const sim = busyShop()
  sim.reviews = Array.from({ length: 30 }, (_, i) => (i % 5) + 1)
  expect(sim.toSave().reviews).toHaveLength(RATING_WINDOW)
  expect(viaJson(sim).rating()).toBe(sim.rating())
})

it('rejects data that is not a saved shop', () => {
  const good = busyShop().toSave()
  for (const raw of [null, 'x', [], {}, { ...good, v: 99 }, { ...good, money: 'lots' }, { ...good, customers: null }, { ...good, owner: {} }])
    expect(() => parseSave(raw)).toThrow(SaveError)
  expect(() => SpaSim.fromSave({ ...good, seatCustomers: [null] }, opts())).toThrow(SaveError)
})
```

- [ ] **Step 2: Run** `npx vitest run tests/sim/save.test.ts`. Expected: FAIL, `src/sim/save` not found.
- [ ] **Step 3: Implement** `src/sim/save.ts`, `toSave()` and `fromSave()` in `src/sim/spa.ts` per the Interfaces block. `fromSave` builds `new SpaSim(options)` and copies every field from `structuredClone(data)`, including the private `nextId` and `untilArrivalMs`.
- [ ] **Step 4: Run** `npm test`. Expected: all pass (the old 46 plus the new ones).
- [ ] **Step 5: Commit** `src/sim/save.ts src/sim/spa.ts tests/sim/helpers.ts tests/sim/save.test.ts tests/sim/spa-owner.test.ts` with message `Save and restore the whole shop, customers included`.

---

### Task 2: Save slots, save codes and the save session

**Files:**
- Create: `src/save/store.ts`, `src/save/code.ts`, `src/save/session.ts`
- Test: `tests/save/store.test.ts`, `tests/save/code.test.ts`, `tests/save/session.test.ts`, `tests/save/memStorage.ts` (a `Map`-backed `KeyValueStorage` for tests)

**Interfaces:**
- Consumes: `SaveData`, `parseSave`, `SaveError` (Task 1).
- Produces:
  - `type SlotId = 1 | 2 | 3`, `SLOTS: SlotId[] = [1, 2, 3]`, `interface SlotInfo { day: number; money: number }`, `type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>`.
  - `class SaveStore(storage: KeyValueStorage)` with keys `spa.current`, `spa.slot.<n>`, `spa.slot.<n>.broken`, `spa.installCardSeen`:
    - `currentSlot(): SlotId` (1 when missing or not 1–3), `setCurrentSlot(slot: SlotId): void`
    - `load(slot): SaveData | null`: unreadable data is copied to `.broken`, the slot key removed, `null` returned.
    - `save(slot, data): boolean`: false when the storage throws.
    - `info(slot): SlotInfo | null`
    - `flag(name: 'installCardSeen'): boolean`, `setFlag(name: 'installCardSeen'): void`
    - No method ever throws: storage errors read as empty/default, writes report false.
  - `openStore(getStorage: () => KeyValueStorage = () => localStorage): SaveStore`: when `getStorage` throws, uses an in-memory storage so the game still runs.
  - `encodeSaveCode(data: SaveData): Promise<string>`: `'SPA1.'` + base64url (no padding) of `CompressionStream('deflate-raw')` over the UTF-8 JSON.
  - `decodeSaveCode(code: string): Promise<SaveData>`: removes all whitespace first; any failure (prefix, base64, inflate, JSON, `parseSave`) throws `SaveError`.
  - `class SaveSession(store: SaveStore, current: () => SaveData, reload: () => void)`: `readonly slot: SlotId` (the store's current slot at construction); `saveNow(): void`; `switchTo(slot: SlotId): void` (saveNow, setCurrentSlot, close, reload); `replaceWith(data: SaveData): void` (save `data` into `slot`, close, reload); `reloadForUpdate(): void` (saveNow, close, reload). After close, `saveNow` does nothing.

- [ ] **Step 1: Write the failing tests**

`tests/save/store.test.ts` (`shop(money)` = `busyShop().toSave()` with that money):
```ts
it('starts in slot 1 and remembers the slot in use', () => {
  const mem = new MemStorage()
  expect(new SaveStore(mem).currentSlot()).toBe(1)
  new SaveStore(mem).setCurrentSlot(3)
  expect(new SaveStore(mem).currentSlot()).toBe(3)
  mem.setItem('spa.current', '7')
  expect(new SaveStore(mem).currentSlot()).toBe(1)
})
it('keeps three separate shops', () => {
  const s = new SaveStore(new MemStorage())
  expect(s.save(1, shop(1))).toBe(true)
  s.save(2, shop(2))
  expect([s.load(1)?.money, s.load(2)?.money, s.load(3)]).toEqual([1, 2, null])
  expect([s.info(2), s.info(3)]).toEqual([{ day: 1, money: 2 }, null])
})
it('sets aside a save it cannot read and treats the slot as empty', () => {
  const mem = new MemStorage()
  mem.setItem('spa.slot.2', '{oops')
  expect(new SaveStore(mem).load(2)).toBeNull()
  expect([mem.getItem('spa.slot.2.broken'), mem.getItem('spa.slot.2')]).toEqual(['{oops', null])
})
it('keeps playing when the storage refuses to work', () => {
  const s = new SaveStore({ getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') }, removeItem: () => { throw new Error('denied') } })
  expect([s.currentSlot(), s.save(1, shop(1)), s.load(1), s.flag('installCardSeen')]).toEqual([1, false, null, false])
  expect(() => s.setFlag('installCardSeen')).not.toThrow()
  const fallback = openStore(() => { throw new Error('SecurityError') })
  fallback.save(1, shop(5))
  expect(fallback.load(1)?.money).toBe(5)
})
it('remembers that the install card was shown', () => { /* flag false, setFlag, new SaveStore on same storage: true */ })
```

`tests/save/code.test.ts`:
```ts
it('turns a shop into a code and back', async () => {
  const d = busyShop().toSave()
  expect(await decodeSaveCode(await encodeSaveCode(d))).toEqual(d)
})
it('makes a code short enough to paste in a chat', async () => {
  const code = await encodeSaveCode(busyShop().toSave())
  expect(code).toMatch(/^SPA1\.[A-Za-z0-9_-]+$/)
  expect(code.length).toBeLessThan(2000)
})
it('accepts a code that a chat app broke into lines and padded with spaces', async () => {
  const d = busyShop().toSave()
  const code = await encodeSaveCode(d)
  const mangled = '  ' + code.slice(0, 40) + '\n' + code.slice(40, 90) + ' \r\n' + code.slice(90) + '\n'
  expect(await decodeSaveCode(mangled)).toEqual(d)
})
it('rejects anything that is not a save code', async () => {
  const code = await encodeSaveCode(busyShop().toSave())
  const notAShop = await encodeSaveCode({ v: 1 } as unknown as SaveData)
  for (const bad of ['', 'hello', 'SPA1.', 'SPA1.!!!!', code.slice(0, -10), notAShop])
    await expect(decodeSaveCode(bad)).rejects.toThrow(SaveError)
})
```

`tests/save/session.test.ts` (`shopWith(m)` = `shop(m)`; `reload` pushes into an array):
```ts
it('saves the shop into the slot in use', ...)            // saveNow → store.load(1).money is the current shop's
it('switching slots saves this shop, then never writes again', () => {
  // current shop money 1; session.switchTo(2)
  // expect store.load(1).money 1, store.currentSlot() 2, reloads 1
  // change the current shop to money 9; session.saveNow()
  // expect store.load(2) null and store.load(1).money still 1
})
it('an imported shop cannot be overwritten by a later save', () => {
  // session.replaceWith(shopWith(5)); then current shop money 9; session.saveNow()
  // expect store.load(1).money 5, reloads 1
})
it('saves before reloading for a new version, and not after', ...) // reloadForUpdate → saved; later saveNow is a no-op
```

- [ ] **Step 2: Run** `npx vitest run tests/save`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** the three modules per the Interfaces block. base64url: `btoa`/`atob` over a binary string, `+`→`-`, `/`→`_`, strip `=`. Compression: `new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()` (and `DecompressionStream` back).
- [ ] **Step 4: Run** `npm test`. Expected: all pass.
- [ ] **Step 5: Commit** `src/save tests/save` with message `Keep three save slots, save codes and one guarded save writer`.

---

### Task 3: Open into the saved shop, save while playing, new pause screen

**Files:**
- Create: `src/scenes/PauseScene.ts`, `src/view/ui.ts`
- Modify: `src/scenes/SpaScene.ts`, `src/view/Hud.ts`, `src/main.ts`, `src/config.ts` (`AUTOSAVE_MS = 10_000`), `src/strings/vi.ts`

**Interfaces:**
- Consumes: `SpaSim.fromSave`, `openStore`, `SaveSession`, `SaveError`.
- Produces:
  - `addCard(scene, x, y, w, h): Phaser.GameObjects.Graphics` and `addButton(scene, x, y, w, h, label: string, kind: 'primary' | 'plain', onTap: () => void): Phaser.GameObjects.Container` (centred on x, y; the hit area is the full w × h; fully rounded).
  - `type PausePanel = 'menu' | 'install'` (`'install'` is used from Task 5).
  - `interface PauseData { sim: SpaSim; store: SaveStore; session: SaveSession; panel: PausePanel; onResume: () => void }`.
  - `new Hud(scene, sim, onPause: () => void)`: the HUD no longer owns a pause overlay.
  - SpaScene: `pause(panel: PausePanel = 'menu')` sets `sim.paused` and launches `PauseScene`; `resume()` clears `sim.paused` and launches the mini-game held while paused.
  - Strings: add `resume: 'Chơi tiếp'`; remove `tapToResume` (no longer used).

- [ ] **Step 1: PauseScene and HUD.** `PauseScene` draws a full-screen `C.ink` 0.6 backdrop that swallows taps and does nothing, a card, the title `t('paused')` at 80 px, and a primary 720×150 "Chơi tiếp" button that calls `onResume()` and stops the scene. Register it in `main.ts`. The HUD pause button calls `onPause`; remove the old overlay. The first-customer hint starts visible only when `sim.day === 1 && sim.stats.served === 0`.
- [ ] **Step 2: Load and save in SpaScene.** In `create()`: reset `this.customers`; `store = openStore()`; `session = new SaveSession(store, () => this.sim.toSave(), () => location.reload())`; load `store.load(session.slot)` and `SpaSim.fromSave` it (a `SaveError` falls back to a new shop); build a sprite for every customer already in the sim (move the `customerArrived` body into `addCustomerSprite(c)`). A restored shop that is not `dayOver` calls `pause()`. Save with `session.saveNow()` every `AUTOSAVE_MS` (`this.time.addEvent`), on `dayEnded` before launching the summary, right after `startDay()` in `onNewDay`, and on `visibilitychange` to hidden and on `pagehide` (remove both listeners on scene shutdown). `serviceReady` while `sim.paused` is held and launched by `resume()`. In `main.ts`, call `navigator.storage?.persist?.()` once. Add `store` and `session` to the dev hooks.
- [ ] **Step 3: Run** `npm test` and `npm run build`. Expected: all pass, no type errors.
- [ ] **Step 4: Check in the browser** (dev server, 402×874):
  1. `"$B" js "localStorage.clear(); location.reload()"` → day 1 08:00, no pause screen.
  2. Wait until a customer is waiting. `"$B" js "const d=__spa.sim.toSave(); JSON.stringify([d.day, Math.floor(d.minutes), d.money, d.customers.length])"`, then `"$B" reload` and read the same values. Expected: equal, and the pause screen shows (screenshot).
  3. Tap "Chơi tiếp" → the clock moves.
  4. `"$B" js "__spa.sim.tapTile(__spa.sim.customers.find(c=>c.state==='waiting').seat)"`, wait for the mini-game, reload → pause screen; "Chơi tiếp" → the mini-game opens at the foam step.
  5. `"$B" js "__spa.sim.clock.minutes=1199"`, wait for the summary, reload → summary again; tap "Ngày mới", reload → day 2 08:00 on the pause screen, no summary.
  6. `"$B" console --errors` → none.
- [ ] **Step 5: Commit** the modified and created files with message `Open into the saved shop, save while playing and pause on a card`.

---

### Task 4: Slots, export and import on the pause screen

**Files:**
- Create: `src/view/dom.ts`
- Modify: `src/scenes/PauseScene.ts`, `src/strings/vi.ts`, `src/main.ts` (`dom: { createContainer: true }`), `index.html` (CSS for `.spa-dom`)
- Test: `tests/strings/strings.test.ts`

**Interfaces:**
- Consumes: `PauseData`, `SLOTS`, `SaveStore.info`, `SaveSession.switchTo/replaceWith`, `encodeSaveCode`, `decodeSaveCode`.
- Produces:
  - `codeBox(scene, x, y, opts: { value?: string; readonly: boolean; placeholder?: string; button: string; onButton: (box: CodeBox) => void }): CodeBox` where `CodeBox = { dom: Phaser.GameObjects.DOMElement; textarea: HTMLTextAreaElement; button: HTMLButtonElement }`. Built with `scene.add.dom`, so it scales with the canvas and its CSS sizes are canvas px.
  - `domButton(scene, x, y, label: string, onClick: () => void): Phaser.GameObjects.DOMElement`. A real `<button>`, used wherever the browser needs a user gesture (clipboard write, install prompt).
  - Strings:

```ts
saveSlots: 'Ô lưu',
slotName: 'Ô {n}',
slotPlaying: 'Ô {n} · Đang chơi',
slotEmpty: 'Ô trống',
slotDetail: 'Ngày {day} · {money}',
exportSave: 'Xuất mã lưu',
exportHint: 'Chép mã này, cất vào ghi chú hoặc gửi qua Zalo. Nhập mã ở máy khác là có lại tiệm.',
copy: 'Chép',
copied: 'Đã chép',
importSave: 'Nhập mã lưu',
importHint: 'Dán mã lưu vào ô dưới đây.',
importIntoSlot: 'Nạp vào ô này',
importConfirm: 'Tiệm trong ô {n} (Ngày {day}) sẽ bị thay bằng tiệm trong mã. Tiếp tục?',
replace: 'Thay',
cancel: 'Thôi',
badCode: 'Mã lưu không đúng',
back: 'Quay lại',
```

- [ ] **Step 1: Write the failing string test**

```ts
it('fills the save screen strings', () => {
  expect(t('slotDetail', { day: 5, money: formatMoney(340000) })).toBe('Ngày 5 · 340.000 đ')
  expect(t('importConfirm', { n: 2, day: 5 })).toBe('Tiệm trong ô 2 (Ngày 5) sẽ bị thay bằng tiệm trong mã. Tiếp tục?')
})
```

- [ ] **Step 2: Run** `npx vitest run tests/strings`. Expected: FAIL (unknown keys, type error at runtime).
- [ ] **Step 3: Add the strings and the menu.** Card from y ≈ 380 to fit. Top to bottom: title; "Chơi tiếp" (primary 720×150); label "Ô lưu" (44 px, 600); three plain 720×120 slot rows: left `slotName` or `slotPlaying` for the slot in use (teal 6 px outline; tapping it does nothing), right `slotDetail` from `store.info(n)` or `slotEmpty`; tapping another row calls `session.switchTo(n)`. Then "Xuất mã lưu" and "Nhập mã lưu" (plain 720×120). Keep 24 px or more between buttons.
- [ ] **Step 4: Export and import panels.** Each panel replaces the menu content and has a "Quay lại" plain button back to the menu; destroy its DOM element when leaving.
  - Export: title, `exportHint` (wrapped at 760), a read-only `codeBox` filled with `await encodeSaveCode(sim.toSave())` and button "Chép": `navigator.clipboard.writeText` → label "Đã chép"; when that rejects or is missing, select the textarea text instead.
  - Import: title, `importHint`, an empty `codeBox` (placed high on the card, top at y ≈ 620, so the iPhone keyboard does not cover it) and button "Nạp vào ô này": `decodeSaveCode(value)`; on `SaveError` show `badCode` in `C.lantern` under the box and change nothing; on success show a confirm card with `importConfirm` (`n` = `session.slot`, `day` = `sim.day`), "Thay" (primary) → `session.replaceWith(data)`, "Thôi" (plain) → close the confirm.
  - CSS in `index.html` (canvas px): `.spa-dom` column 760 wide, gap 24; textarea height 300, padding 20, `600 32px "Be Vietnam Pro"`, `C.ink` text on `C.cream`, 4 px `C.ink` border, radius 24, `resize: none`, `word-break: break-all`, and `user-select: text; -webkit-user-select: text; touch-action: auto` (the page disables them); button height 120, `800 44px "Be Vietnam Pro"`, `C.paper` on `C.teal`, 4 px `C.ink` border, radius 60.
- [ ] **Step 5: Run** `npm test` and `npm run build`. Expected: all pass.
- [ ] **Step 6: Check in the browser** (dev server, 402×874), screenshot each screen:
  1. Pause → slot 1 "Ô 1 · Đang chơi", slots 2 and 3 "Ô trống".
  2. Note slot 1's money, tap slot 2 → reload into a new shop (money `STARTING_MONEY`, day 1). Pause → slot 1 shows its day and money. Tap slot 1 → the old shop is back with the same money.
  3. Export → `"$B" js "document.querySelector('.spa-dom textarea').value.slice(0,5)"` is `SPA1.`; `"$B" click ".spa-dom button"` → "Đã chép" or the text selected (note which, headless clipboard may be denied).
  4. Switch to slot 2, import slot 1's code with `"$B" fill ".spa-dom textarea" "<code>"` → Nạp → confirm → Thay → reload; slot 2 now has slot 1's day and money. Import `abc` → "Mã lưu không đúng", nothing changes.
  5. Tapping the backdrop does not resume. `"$B" console --errors` → none.
- [ ] **Step 7: Commit** with message `Switch slots and move a shop between phones with a save code`.

---

### Task 5: Install as an app

**Files:**
- Create: `src/app/install.ts`, `src/art/icon.ts`, `scripts/icons.html`, `scripts/icons.ts`, `public/manifest.webmanifest`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`
- Modify: `index.html`, `src/art/room.ts` (export the tile motif), `src/art/fx.ts` (`icon-share`), `src/scenes/PauseScene.ts`, `src/scenes/SpaScene.ts`, `src/main.ts`, `src/strings/vi.ts`
- Test: `tests/app/install.test.ts`

**Interfaces:**
- Produces:
  - `type InstallPlatform = 'ios' | 'android'`; `interface InstallEnv { ua: string; maxTouchPoints: number; standalone: boolean }`.
  - `installPlatform(env: InstallEnv): InstallPlatform | null`: `null` when standalone, or not a phone or tablet. iOS = `iPhone|iPad|iPod` in the UA, or `Macintosh` with `maxTouchPoints > 1` (iPadOS). Android = `Android` in the UA.
  - `currentInstallEnv(): InstallEnv` (`standalone` = `matchMedia('(display-mode: standalone)').matches || navigator.standalone === true`), `captureInstallPrompt(): void`, `canPromptInstall(): boolean`, `promptInstall(): Promise<void>`.
  - `GACH_BONG_TILE: string` exported from `room.ts`: the 24-unit motif body, used by its `<pattern>` and by the icon.
  - `appIconSvg(size: number): string`: one gạch bông tile filling the square on `C.tile`, petals and centre outlined in `C.ink` (stroke 0.5 units), no transparency, the flower inside the central 80% (maskable safe zone).
  - Strings:

```ts
installMenu: 'Cài vào màn hình chính',
installTitle: 'Cài game vào màn hình chính để không mất tiến trình',
installIosShare: 'Bấm nút Chia sẻ của Safari (có thể nằm trong nút ba chấm)',
installIosAdd: 'Chọn "Thêm vào MH chính"',
installOpenApp: 'Mở game từ biểu tượng mới trên màn hình chính',
installCopyFirst: 'Chép mã lưu trước, vì app mới chưa có tiệm này',
installImportAfter: 'Trong app: Tạm dừng, rồi Nhập mã lưu',
copySave: 'Chép mã lưu',
installAndroid: 'Cài',
installAndroidMenu: 'Mở menu ba chấm của Chrome, chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính"',
later: 'Để sau',
```

- [ ] **Step 1: Write the failing tests** in `tests/app/install.test.ts`, with real UA strings: iPhone Safari → `'ios'`; the same with `standalone: true` → `null`; iPadOS (`Macintosh … Version/26.0 Safari`, `maxTouchPoints: 5`) → `'ios'`; the same with `maxTouchPoints: 0` (a Mac) → `null`; Chrome on iPhone (`CriOS`) → `'ios'`; Android Chrome → `'android'`; Windows Chrome → `null`.
- [ ] **Step 2: Run** `npx vitest run tests/app`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `src/app/install.ts`; call `captureInstallPrompt()` at the top of `main.ts`.
- [ ] **Step 4: Run** `npx vitest run tests/app`. Expected: PASS.
- [ ] **Step 5: Icons.** Implement `appIconSvg` and export `GACH_BONG_TILE`. `scripts/icons.html` loads `scripts/icons.ts`, which shows `appIconSvg(size)` from `?size=` as a `size × size` image at the page's top-left, body margin 0. With the dev server running, for each of 512 → `icon-512.png`, 192 → `icon-192.png`, 180 → `apple-touch-icon.png`:
  ```bash
  "$B" viewport 512x512 && "$B" goto "http://localhost:5173/scripts/icons.html?size=512" && "$B" screenshot --viewport public/icons/icon-512.png
  ```
  Check each PNG's size: `node -e "const b=require('fs').readFileSync('public/icons/icon-512.png');console.log(b.readUInt32BE(16),b.readUInt32BE(20))"` → `512 512` (and 192, 180). If the screenshot comes out at 2×, rerun with a viewport of half the size. Read one PNG to check it looks right.
- [ ] **Step 6: Manifest and page.** `public/manifest.webmanifest`: `name` and `short_name` "Tiệm Spa", `lang` "vi", `start_url` and `scope` "./", `display` "standalone", `orientation` "portrait", `background_color` and `theme_color` "#F3E6D3", icons 192 and 512 (`purpose` "any") plus 512 again with `purpose` "maskable". In `index.html`: `<link rel="manifest" href="manifest.webmanifest">`, `<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">`, `apple-mobile-web-app-capable` and `mobile-web-app-capable` "yes", `apple-mobile-web-app-title` "Tiệm Spa", `apple-mobile-web-app-status-bar-style` "default"; `#game` becomes `position: fixed` with `top/right/bottom/left: env(safe-area-inset-*, 0px)` instead of `width/height: 100%`, so Phaser fits inside the safe area (Phaser measures the parent with `getBoundingClientRect`, which would include padding).
- [ ] **Step 7: Install panel.** Add `icon-share` to `fx.ts` (the iOS share square with an up arrow, style A outline). `PauseScene` panel `'install'`: `installTitle` (wrapped), then numbered steps:
  - iOS: `installIosShare` (with `icon-share` beside it), `installIosAdd`, `installOpenApp`. When `sim.day > 1`, first `installCopyFirst` with a `domButton` "Chép mã lưu" (clipboard as in the export panel, label → "Đã chép"), and last `installImportAfter`.
  - Android: when `canPromptInstall()`, a `domButton` "Cài" → `promptInstall()`; otherwise `installAndroidMenu`.
  - A plain "Để sau" button: back to the menu when opened from the menu; resumes the game when the panel was opened automatically.
  The menu shows an `installMenu` button under "Nhập mã lưu" when `installPlatform(currentInstallEnv())` is not null. In `SpaScene.create`, when no save was loaded (a new shop), the platform is not null and `!store.flag('installCardSeen')`: `store.setFlag('installCardSeen')` and `pause('install')`.
- [ ] **Step 8: Run** `npm test` and `npm run build`. Expected: all pass.
- [ ] **Step 9: Check in the browser:** `"$B" useragent "<iPhone UA>"`, clear storage, reload → the install card shows (screenshot); "Để sau" → playing; reload → no card; pause menu has "Cài vào màn hình chính". `"$B" js "__spa.sim.day=3"`, open it → the copy-first steps and "Chép mã lưu" show (screenshot). `"$B" js "fetch('manifest.webmanifest').then(r=>r.json()).then(m=>m.name)"` → "Tiệm Spa"; each icon URL answers 200. Back to the default UA → no card, no menu item. Console clean.
- [ ] **Step 10: Commit** with message `Install the game on the home screen with a gạch bông icon`.

---

### Task 6: Offline play and automatic updates

**Files:**
- Create: `build/sw.ts`, `build/sw-template.js`, `src/app/update.ts`, `src/globals.d.ts`
- Modify: `vite.config.ts` (also holds `serviceWorkerPlugin`), `src/main.ts`, `src/scenes/SpaScene.ts`, `src/config.ts` (`UPDATE_WAIT_MS = 3_000`)
- Test: `tests/build/sw.test.ts`, `tests/app/update.test.ts`

**Interfaces:**
- Consumes: `SaveSession.reloadForUpdate()`.
- Produces:
  - `precacheList(bundleFiles: string[], publicFiles: string[]): string[]`: `'./'` first, then the sorted unique union with `index.html` always present, minus `*.map`, `*.woff` (woff2 stays), `sw.js`, `version.json`.
  - `renderServiceWorker(template: string, version: string, files: string[]): string`: replaces the string literal `'__VERSION__'` with `JSON.stringify(version)` and the bare token `__FILES__` with `JSON.stringify(files)`.
  - `serviceWorkerPlugin(buildId: string): Plugin` in `vite.config.ts`: `apply: 'build'`, `enforce: 'post'`; in `generateBundle` emits `sw.js` (template read with `fs`, public files listed recursively from `public/`) and `version.json` = `{"version": buildId}`.
  - `BUILD_ID: string` (= `__BUILD_ID__`, `'dev'` under `vite` and `vitest`); `registerServiceWorker(): void` (production only, `navigator.serviceWorker.register('./sw.js')`); `latestVersion(timeoutMs: number, fetchFn: typeof fetch = fetch): Promise<string | null>` (GET `version.json?t=<now>` with `cache: 'no-store'`; `null` on any failure, a non-string version, or no answer within `timeoutMs`); `shouldReload(running: string, latest: string | null, serving: boolean): boolean`; `onReturn(cb: () => void): () => void` (`visibilitychange` while `visibilityState === 'visible'`; returns the unsubscribe).

- [ ] **Step 1: Write the failing tests**

`tests/build/sw.test.ts`:
```ts
it('precaches every built file except maps and woff fallbacks', () => {
  const bundle = ['index.html', 'assets/index-abc.js', 'assets/index-abc.js.map', 'assets/f-600-x.woff2', 'assets/f-600-x.woff']
  const pub = ['manifest.webmanifest', 'icons/icon-192.png']
  expect(precacheList(bundle, pub)).toEqual(['./', 'assets/f-600-x.woff2', 'assets/index-abc.js', 'icons/icon-192.png', 'index.html', 'manifest.webmanifest'])
  expect(precacheList(['assets/a.js'], [])).toContain('index.html')
})
it('fills the version and file list into the service worker', () => {
  const out = renderServiceWorker("const VERSION = '__VERSION__'\nconst FILES = __FILES__", 'abc', ['./', 'index.html'])
  expect(out).toBe('const VERSION = "abc"\nconst FILES = ["./","index.html"]')
})
```

`tests/app/update.test.ts`:
```ts
const answer = (body: string, status = 200) => vi.fn(async () => new Response(body, { status }))
it('reads the published version', async () => {
  const f = answer('{"version":"abc"}')
  expect(await latestVersion(1000, f)).toBe('abc')
  const [url, init] = f.mock.calls[0]
  expect(String(url)).toMatch(/^version\.json\?t=\d+$/)
  expect(init).toMatchObject({ cache: 'no-store' })
})
it('gives up quietly when the version cannot be read', async () => {
  expect(await latestVersion(1000, answer('nope', 404))).toBeNull()
  expect(await latestVersion(1000, answer('{oops'))).toBeNull()
  expect(await latestVersion(1000, answer('{"version":5}'))).toBeNull()
  expect(await latestVersion(1000, vi.fn(async () => { throw new TypeError('offline') }))).toBeNull()
  expect(await latestVersion(20, vi.fn(() => new Promise<Response>(() => {})))).toBeNull()
})
it('never reloads while a service is in progress or in dev', () => {
  expect(shouldReload('a', 'b', false)).toBe(true)
  expect([shouldReload('a', 'a', false), shouldReload('a', null, false), shouldReload('a', 'b', true), shouldReload('dev', 'b', false)]).toEqual([false, false, false, false])
})
```

- [ ] **Step 2: Run** `npx vitest run tests/build tests/app/update.test.ts`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** `build/sw.ts`, `src/app/update.ts`, `src/globals.d.ts`, and `build/sw-template.js`:

```js
const VERSION = '__VERSION__'
const FILES = __FILES__
const CACHE = `spa-${VERSION}`
const NAV_TIMEOUT_MS = 3000

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)))
  self.skipWaiting()
})
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('spa-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/version.json')) return
  if (req.mode === 'navigate') e.respondWith(page(req))
  else e.respondWith(caches.match(req).then(hit => hit ?? fetch(req)))
})

// Newest page when the network answers within NAV_TIMEOUT_MS, else the cached one.
async function page(req) {
  const cache = await caches.open(CACHE)
  const fresh = fetch(req.url, { cache: 'no-cache' }).then(res => {
    if (res.ok) cache.put('./', res.clone())
    return res
  })
  const late = new Promise(resolve => setTimeout(resolve, NAV_TIMEOUT_MS, null))
  const res = await Promise.race([fresh.catch(() => null), late])
  return res ?? (await cache.match('./')) ?? fresh
}
```

  `vite.config.ts` becomes `defineConfig(({ command }) => …)` with `base: './'`, `define: { __BUILD_ID__: JSON.stringify(buildId) }` where `buildId = command === 'build' ? (process.env.BUILD_ID ?? process.env.GITHUB_SHA?.slice(0, 8) ?? Date.now().toString(36)) : 'dev'`, `plugins: [serviceWorkerPlugin(buildId)]`, and the existing `server`, `preview`, `test` blocks. `main.ts`: `registerServiceWorker()` and `document.documentElement.dataset.build = BUILD_ID`.
- [ ] **Step 4: Check for a new version on return** in `SpaScene`: `onReturn` (unsubscribe on shutdown) runs `checkForUpdate()`: return when `BUILD_ID === 'dev'` or `sim.servingCustomerId !== null`; set `this.holding = true` (while holding, `update()` skips `sim.update` and `onTap` ignores taps); `latest = await latestVersion(UPDATE_WAIT_MS)`; when `shouldReload(BUILD_ID, latest, sim.servingCustomerId !== null)`, `session.reloadForUpdate()`, else `holding = false`.
- [ ] **Step 5: Run** `npm test`. Expected: all pass.
- [ ] **Step 6: Build** `npm run build`. Expected: no errors; `dist/` has `sw.js`, `version.json`, `manifest.webmanifest`, `icons/`.
- [ ] **Step 7: Check the precache list against the build:**

```bash
node -e "const fs=require('fs');const sw=fs.readFileSync('dist/sw.js','utf8');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);const miss=walk('dist').map(f=>f.slice(5)).filter(f=>!/\.(map|woff)$/.test(f)&&f!=='sw.js'&&f!=='version.json'&&!sw.includes(JSON.stringify(f)));console.log(miss.length?'MISSING '+miss.join(' '):'all precached')"
```
Expected: `all precached`.
- [ ] **Step 8: Check offline and updates on the production build** (402×874):
  1. `BUILD_ID=one npm run build`, start `npx vite preview --port 4173 --strictPort`, open `http://localhost:4173/`, wait, reload once. `"$B" js "[navigator.serviceWorker.controller!==null, document.documentElement.dataset.build]"` → `[true, "one"]`.
  2. Stop the preview server, `"$B" reload` → the shop shows (screenshot). Start it again.
  3. Play a little, note day, minutes and money. `BUILD_ID=two npm run build`, restart the preview, `"$B" js "document.dispatchEvent(new Event('visibilitychange'))"` → the page reloads: build `"two"`, same day and money, pause screen.
  4. Tap "Chơi tiếp", start a service and wait for the mini-game. `BUILD_ID=three npm run build`, restart the preview, dispatch `visibilitychange` again → no reload: build still `"two"`, mini-game still open.
- [ ] **Step 9: Commit** with message `Play offline and pick up new versions when coming back to the game`.

---

### Task 7: Publish to GitHub Pages on every push to master

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow.** Triggers: `push` to `master` and `workflow_dispatch`. `permissions: { contents: read, pages: write, id-token: write }`, `concurrency: { group: pages, cancel-in-progress: true }`. Job `build` on `ubuntu-latest`: `actions/checkout@v5`, `actions/setup-node@v5` (`node-version: 24`, `cache: npm`), `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact@v4` with `path: dist`. Job `deploy` (`needs: build`, environment `github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`): `actions/deploy-pages@v4` with `id: deployment`. A failing test stops the run before anything is published.
- [ ] **Step 2: Run** `npm test` and `npm run build`, the same commands the workflow runs. Expected: pass. (The real run is checked in Task 10.)
- [ ] **Step 3: Commit** `.github/workflows/deploy.yml` with message `Publish master to GitHub Pages after the tests pass`.

---

### Task 8: Brown outlines, tall capitals, the empty bed's basin

**Files:**
- Create: `src/art/outline.ts`
- Modify: `src/art/chibi.ts`, `src/view/CharacterView.ts`, `src/view/text.ts`, `src/sim/grid.ts`
- Test: `tests/art/outline.test.ts`, `tests/view/text.test.ts`, `tests/sim/grid.test.ts`, `tests/sim/spa-owner.test.ts`

**Interfaces:**
- Produces:
  - `fillsOnly(body: string): string`: for SVG made of self-closing elements, drops elements that are only an ink line (`fill="none"` with an ink stroke), removes the ink `stroke`, `stroke-width`, `stroke-linejoin`, `stroke-linecap` attributes from the rest, keeps non-ink strokes (hair strands) untouched.
  - `linesOnly(body: string): string`: keeps only elements with an ink stroke, with their fill set to `none`.
  - Textures: every tinted chibi part (`leg`, `arm`, `body`, `head`, `hair*`) gets `<key>` from `fillsOnly` and `<key>-line` from `linesOnly`, same viewBox and same `PART_ANCHORS`. Faces and the blanket are unchanged.
  - `isBedSlot` also covers the wall tile above the slot (the dashed basin), so rows `s.y - 1` to `s.y + 2`.

- [ ] **Step 1: Write the failing tests**

`tests/art/outline.test.ts`:
```ts
const SHAPE = '<rect x="0" y="0" width="5" height="11" rx="2.3" fill="#ffffff" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>'
const SEAM = '<path d="M0,2.6 V17" stroke="#4A2E22" stroke-width="0.9" stroke-linecap="round" fill="none"/>'
const STRAND = '<path d="M-6,-8.5 Q-2,-11 3,-9.8" stroke="#e6e6e6" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
it('keeps the fills and the hair strands for tinting', () => {
  expect(fillsOnly(SHAPE + SEAM + STRAND)).toBe('<rect x="0" y="0" width="5" height="11" rx="2.3" fill="#ffffff"/>' + STRAND)
})
it('keeps only the brown lines, unfilled', () => {
  expect(linesOnly(SHAPE + SEAM + STRAND)).toBe(
    '<rect x="0" y="0" width="5" height="11" rx="2.3" fill="none" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>' + SEAM,
  )
})
```
`tests/view/text.test.ts`: `it('measures the tallest Vietnamese capitals and the lowest dots', () => { for (const ch of ['Ẳ', 'Ẵ', 'Ỵ']) expect(textStyle(40).testString).toContain(ch) })`.
`tests/sim/grid.test.ts`: rename `treats a bed slot and the two tiles below it as the slot` to `treats a bed slot, its basin above and the two tiles below as the slot`, expecting `[0, 1, 2, 3, 4, 5].map(y => isBedSlot(g, { x: 6, y }))` to be `[false, true, true, true, true, false]`.
`tests/sim/spa-owner.test.ts`: in `tapping an empty bed slot says it is coming soon and leaves the owner where they are`, loop over `[1, 2, 3, 4]`.

- [ ] **Step 2: Run** `npm test`. Expected: the new and changed tests FAIL.
- [ ] **Step 3: Before fixing, record the clipping in the browser** (dev server): add a text `'ẲẴ Ỵ'` with `textStyle(64)` through `__spa.spa.add.text`, then compare `[t.style.metrics.ascent, t.style.metrics.descent]` with `Math.ceil` of a 2D canvas `measureText('ẲẴỴ')` `actualBoundingBoxAscent` / `actualBoundingBoxDescent` at `800 64px "Be Vietnam Pro"`. Expected now: Phaser's ascent smaller.
- [ ] **Step 4: Implement** `outline.ts`; the `-line` textures in `chibi.ts`; in `CharacterView`, draw each tinted part as its tinted fill image with its untinted line image on top, both following the same position, rotation, flip, texture changes (hair by facing) and visibility; `testString: '|MÉqgyẶỖẲẴỴ'`; `isBedSlot` from `s.y - 1`.
- [ ] **Step 5: Run** `npm test`. Expected: all pass.
- [ ] **Step 6: Check in the browser:** repeat Step 3 → Phaser's ascent and descent are at least the canvas ones. `"$B" js` over `__spa.spa.children.list` (and container children) → every image whose texture key ends in `-line` has `isTinted === false`. Screenshot the owner and a customer close up (`--clip`): the outlines are brown, not black. Tap the dashed basin above an empty slot → "Tính năng này có ở bản sau".
- [ ] **Step 7: Commit** with message `Keep character outlines brown, fit tall capitals, and answer taps on the empty bed's basin`.

---

### Task 9: A bigger top bar on two rows

**Files:**
- Modify: `src/view/topBar.ts`, `src/view/Hud.ts`
- Test: `tests/view/topBar.test.ts`

**Interfaces:**
- Produces: `TOP_BAR = { moneyX: 135, starLeft: 441, starW: 45, rowRight: 920 }`; `layoutTopBar(moneyW: number, ratingW: number): TopBarLayout` (same `TopBarLayout`). The star sits at `starLeft` unless the money reaches it, then 16 px after the money; the money shrinks only when the rating's right edge would pass `rowRight`.
- Layout (canvas px): bar rounded rect x 24, y 30, w 1032, h 170, radius 52, with a tap-blocking zone of the same size. Row 1 centre y 84: coin at (95, 84) scale 1.25, money at `moneyX` 52 px weight 800, star scale 0.5, rating 44 px weight 800. Row 2 centre y 152: "Ngày N · HH:MM" at x 135, left-aligned, 40 px weight 600. Pause button centre (995, 115), circle radius 44, hit area 130 × 130. The bar ends at y 200, above the room (`MAP_Y` 210).

- [ ] **Step 1: Write the failing tests** (replace the three in `tests/view/topBar.test.ts`):

```ts
it('keeps the star where the board has it while the money is short', () => {
  expect(layoutTopBar(260, 170)).toEqual({ moneyScale: 1, starX: 463.5, ratingX: 502 })
})
it('moves the star right of money in the hundreds of millions', () => {
  const l = layoutTopBar(400, 70) // 999.999.999 đ at 52 px, 4.5 at 44 px: replace with the widths measured in the game
  expect(l.moneyScale).toBe(1)
  expect(l.starX - TOP_BAR.starW / 2 - (TOP_BAR.moneyX + 400)).toBe(16)
})
it('shrinks the money only when the rating would pass the pause button', () => {
  const l = layoutTopBar(800, 170)
  expect(l.moneyScale).toBeLessThan(1)
  expect(l.ratingX + 170).toBeCloseTo(TOP_BAR.rowRight)
  expect(l.starX - TOP_BAR.starW / 2 - (TOP_BAR.moneyX + 800 * l.moneyScale)).toBeCloseTo(16)
})
```

- [ ] **Step 2: Run** `npx vitest run tests/view/topBar.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the layout function and the HUD per the Interfaces block. Measure the real widths (`"$B" js` on the HUD texts) and put them into the second test.
- [ ] **Step 4: Run** `npm test`. Expected: all pass.
- [ ] **Step 5: Screenshots** at 402×874: money 100.000 đ with "Chưa có", and money 999.999.999 đ with rating 4.5 on day 100 (`__spa.sim.money=999999999; __spa.sim.day=100`). Expected: nothing overlaps, the day line is about 16 px tall on the phone, the bar does not cover the room. These screenshots go to anh.
- [ ] **Step 6: Commit** with message `Make the top bar bigger on two rows`.

---

### Task 10: Whole-branch check and going live

- [ ] **Step 1: Run** `npm test` and `npm run build`. Expected: all pass, no errors.
- [ ] **Step 2: Run through the production build** (`npx vite preview`, iPhone UA, 402×874, cleared storage): install card → "Để sau" → serve one customer → reload mid-day → pause screen → "Chơi tiếp" → switch to slot 2 and back → export and import → stop the server and reload (offline) → restart, new `BUILD_ID`, return → reloaded into the same spot. Screenshots: pause menu, export, import, install card, top bar. Console clean.
- [ ] **Step 3: Final review** of the whole branch by a fresh reviewer against the design and this plan, as the execution skill says; fix what it finds (test first), `npm test` green after.
- [ ] **Step 4: Stop and ask anh** for two things, in plain words: (a) on GitHub, repo `FEAN9999/spa-indie-game` → Settings → Pages → Build and deployment → Source: "GitHub Actions" (one time); (b) OK to merge `step-1b-save-online` into `master` and push.
- [ ] **Step 5: After the OK:** `git checkout master && git merge --ff-only step-1b-save-online && git push origin master`.
- [ ] **Step 6: Check the run:** `curl -s "https://api.github.com/repos/FEAN9999/spa-indie-game/actions/runs?per_page=1"` until `status` is `completed`, then expect `conclusion` `success`.
- [ ] **Step 7: Check the live site:** open `https://fean9999.github.io/spa-indie-game/` at 402×874: the shop loads; `version.json` matches the first 8 characters of the pushed commit; after one reload the service worker controls the page; console clean.
- [ ] **Step 8: Hand anh the iPhone checklist** from the design, section 8: open the link and install; airplane mode then open; play part of a day, close the app fully, reopen; after the next push, come back to the game and see the new version. Also confirm on the real iPhone the share-menu wording ("Thêm vào MH chính") and the status bar and home-bar spacing.
