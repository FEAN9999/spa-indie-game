# Step 1b Batch 2: Owner, Shop Name, First-Day Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new player creates the owner and names the shop, is guided through day 1 by doing, plays easier first days, and sees the bottom buttons lock and open by day; family shops saved by the current version open as before with a one-time owner card.

**Architecture:** Same layering as batch 1. The sim gains the shop profile (`shopName`, `ownerLook`, `profileDone`), the hints already shown (`hints`), each customer's full patience (`patienceMaxMs`) and a per-day ease table; `SaveData` becomes version 2 and `parseSave` upgrades version 1. Pure rules decide which hint to show (`src/sim/tutorial.ts`) and which feature is open (`src/sim/unlocks.ts`). A new `OwnerScene` card creates or edits the owner; `SpaScene` holds the shop still (`modal`) while it is open. A `HandPointer` view replaces the HUD's static hint.

**Tech Stack:** TypeScript ^7.0, Phaser ^4.2.1 (DOM layer), Vite ^8.3, Vitest ^5.0. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-26-step-1b-batches-2-7-design.md` (sections 1–4, 6 and 12), within `docs/superpowers/specs/2026-10-25-spa-game-design.md` (5.4, 5.14, 7.2).

## Global Constraints

- Free only, no new npm dependencies.
- Every player-visible string comes from `src/strings/vi.ts` (shop name ideas included, as the exported `SHOP_NAME_IDEAS` array).
- `src/sim/**`, `src/save/**`, `src/app/**`, `src/art/outline.ts`, `build/**` must not import `phaser` or anything from `src/view`, `src/scenes`. The sim may import `src/strings/vi.ts`, which imports nothing.
- Art tests mock Phaser: `vi.mock('phaser', () => ({}))`, as `tests/art/shampooArt.test.ts` does.
- Canvas 1080×2160, primary target iPhone 17 Safari (402×874). Style A: cards `C.paper`, 4 px `C.ink` outline, radius 60; primary button `C.teal` + `C.paper` text; plain button `C.cream` + `C.ink` text; Be Vietnam Pro 600 or 800 only.
- Every shop saved by the current version (`SAVE_VERSION` 1) must open in this version as the same shop. `tests/fixtures/save-v1.json` pins that.
- Numbers from the design: owner choices 4 hair styles, 5 hair colors, 4 skin tones, 4 owner shirt colors (teal `#2F7D6E` default, leaf `#4E9A6B`, lantern red, wood `#8A5634`); shop name at most 24 characters; ease table day 1 patience ×1.6, mini-game +10 s, arrivals ×1.3; day 2 ×1.4, +10 s; day 3 ×1.2, +5 s; day 4 on none; unlock days build 2, staff 3, services 4, stock 5.
- The owner-only red is `#A8302A` (`C.lanternDark`): `#D8463A` sits too close to the customers' terracotta `#C65D3B`.
- Hints never block input; only one hint at a time; only shops created in this version get the tutorial.
- In this batch a feature button that is open but not built yet still says `comingSoon`. "Mới" badges, unlock-morning pointers and first-open panel lines belong to the batches that build each panel.
- Work on branch `step-1b-owner` (design already committed). Never `git add -A`. Commit as `git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit …`, no attribution lines.
- Anh has authorized merging into `master` and pushing once `npm test`, `npm run build` and the browser run-through all pass (Task 8). Nothing else outward-facing.

## Review Focus

1. A shop name typed on iPhone with decomposed marks, runs of spaces, 30+ characters, or only spaces is stored as NFC, trimmed, at most 24 characters, never empty. (Task 1 `cleanShopName` tests.)
2. A save code copied from the old version and pasted here loads with the default owner and shows the owner card once. (Task 1 `reads a code made before owners and names`.)
3. An upgraded shop that was mid-service or at the end of the day shows the owner card first, and the mini-game or the summary only after it closes; never two cards at once. (Task 1 `still reopens the mini-game of an upgraded shop`; Task 5 browser check.)
4. An out-of-range owner look in a pasted code (`shirt: 7`, `skin: -1`, `hair: 1.5`) is "Mã lưu không đúng", not a crash. (Task 1 `rejects an owner look outside the choices`.)
5. Closing the game during the first mini-game shows the demo finger again on reopening, but the tap hint never returns once done. (Task 2 `remembers which hints were shown across a save`; Task 7 marks `demoShampoo` only on completion.)

---

## File Structure

```
tests/fixtures/save-v1.json   a busy shop saved by the current code, before any change
src/sim/profile.ts            SHOP_NAME_MAX, DEFAULT_OWNER_LOOK, cleanShopName(), isOwnerLook(), suggestShopName()
src/sim/tutorial.ts           pickHint()
src/sim/unlocks.ts            Feature, isUnlocked()
src/scenes/OwnerScene.ts      create / upgrade / edit the owner and the shop name
src/view/HandPointer.ts       the pointing hand with its line of text
Modified: src/sim/types.ts, save.ts, spa.ts, economy.ts, shampoo.ts; src/save/store.ts; src/config.ts;
          src/strings/vi.ts; src/art/chibi.ts, palette.ts, fx.ts; src/view/dom.ts, Hud.ts;
          src/scenes/SpaScene.ts, PauseScene.ts, SummaryScene.ts, ShampooScene.ts; src/main.ts;
          index.html; tsconfig.json ("resolveJsonModule": true)
```

## Browser checks

As in batch 1, with the gstack browse binary:

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse.exe"
"$B" goto "http://localhost:5173/" && "$B" viewport 402x874
"$B" screenshot "<scratchpad>/<name>.png"   # then Read the png
"$B" js "<expression>"                       # read or set state
"$B" console --errors                        # expect none
```

Dev server: `npm run dev -- --port 5173 --strictPort` in the background. Dev hooks: `window.__spa.sim`, `.spa`, `.game`, `.store`, `.session`. Fresh start: `localStorage.clear()` then reload. Old shop: `localStorage.setItem('spa.slot.1', <contents of tests/fixtures/save-v1.json>)`, `localStorage.setItem('spa.current', '1')`, reload. Finish a mini-game: `__spa.game.scene.getScene('ShampooScene').__finishForTest(3)`.

---

### Task 1: Save version 2: shop profile, hints, full patience

**Files:**
- Create: `tests/fixtures/save-v1.json`, `src/sim/profile.ts`, `tests/sim/profile.test.ts`
- Modify: `src/sim/types.ts`, `src/sim/save.ts`, `src/sim/spa.ts`, `src/save/store.ts`, `src/config.ts`, `src/strings/vi.ts`, `tsconfig.json`, `tests/sim/save.test.ts`, `tests/save/code.test.ts`, `tests/save/store.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `HINT_IDS = ['tapCustomer', 'demoShampoo', 'money', 'star', 'patience', 'summary'] as const`, `type HintId = (typeof HINT_IDS)[number]`; `Customer.patienceMaxMs: number`.
  - `config.ts`: `OWNER_LOOK_COUNTS = { skin: 4, hair: 5, hairStyle: 4, shirt: 4 } as const`.
  - `profile.ts`: `SHOP_NAME_MAX = 24`; `DEFAULT_OWNER_LOOK: Look = { skin: 0, hair: 0, hairStyle: 0, shirt: 0 }`; `cleanShopName(raw: string, fallback: string): string` (NFC, whitespace runs to one space, trim, first 24 code points, trim again, fallback when empty); `isOwnerLook(x: unknown): x is Look` (four integers each in `[0, OWNER_LOOK_COUNTS[k])`); `suggestShopName(rng: Rng, current?: string): string` (an idea from `SHOP_NAME_IDEAS` other than `current`).
  - `vi.ts`: key `defaultShopName: 'Tiệm Spa'`; `export const SHOP_NAME_IDEAS = ['Spa Hoa Sen', 'Spa Gạch Bông', 'Tiệm Gội Cô Ba', 'Spa Mây Tre', 'Spa Sen Hồng', 'Tiệm Spa Phố Cũ', 'Spa Thảo Mộc', 'Spa Lá Dừa'] as const`.
  - `save.ts`: `SAVE_VERSION = 2`; `SaveData` adds `shopName: string`, `ownerLook: Look`, `profileDone: boolean`, `hints: HintId[]`. `parseSave` accepts `v` 1 and 2; v1 becomes v2 with `shopName` `t('defaultShopName')`, `ownerLook` a copy of `DEFAULT_OWNER_LOOK`, `profileDone: false`, `hints: [...HINT_IDS]` (old shops get no tutorial), each customer `patienceMaxMs = PATIENCE_MS`. For v2 it throws `SaveError` unless `shopName` is a string and `isOwnerLook(ownerLook)` and `profileDone` is boolean and `hints` an array; it then cleans `shopName` with `cleanShopName(name, t('defaultShopName'))` and keeps only known hint ids.
  - `SpaSim`: fields `shopName = t('defaultShopName')`, `ownerLook: Look` (copy of default), `profileDone = false`, `hints: HintId[] = []`; `setProfile(look: Look, name: string): void` (copies `look`, `shopName = cleanShopName(name, this.shopName)`, `profileDone = true`); `hintDone(id: HintId): boolean`; `markHint(id: HintId): void` (no duplicates). `spawnCustomer` sets `patienceMaxMs` equal to its `patienceMs`. `toSave`/`fromSave` carry all four fields.
  - `SlotInfo` adds `name: string`.

- [ ] **Step 1: Pin today's save format.** Before changing any source file, `mkdir tests/fixtures`, add a throwaway `tests/dump.test.ts` that writes `JSON.stringify(busyShop().toSave(), null, 2) + '\n'` to `tests/fixtures/save-v1.json` with `node:fs`, run `npx vitest run tests/dump.test.ts`, delete the throwaway file. Expected: the fixture has `"v": 1`, `"money": 123456`, two customers.

- [ ] **Step 2: Write the failing tests**

`tests/sim/profile.test.ts`:

```ts
describe('shop names', () => {
  it('trims and squeezes spaces', () => expect(cleanShopName('  Spa   Hoa  Sen ', 'X')).toBe('Spa Hoa Sen'))
  it('stores marks typed as separate characters as single letters', () =>
    expect(cleanShopName('Spa Hoà Bình Ặ'.normalize('NFD'), 'X')).toBe('Spa Hoà Bình Ặ'.normalize('NFC')))
  it('keeps at most 24 letters', () => expect(cleanShopName('Spa Thảo Mộc Hương Quê Nhà Mình', 'X')).toBe('Spa Thảo Mộc Hương Quê N'))
  it('uses the fallback for an empty name', () => expect(cleanShopName(' \n ', 'Tiệm Spa')).toBe('Tiệm Spa'))
  it('has ideas that fit as they are', () => { for (const n of SHOP_NAME_IDEAS) expect(cleanShopName(n, 'X')).toBe(n) })
  it('suggests another idea than the current one', () => {
    const rng = createRng(4)
    for (const current of [...SHOP_NAME_IDEAS, ...SHOP_NAME_IDEAS]) {
      const s = suggestShopName(rng, current)
      expect(SHOP_NAME_IDEAS).toContain(s)
      expect(s).not.toBe(current)
    }
  })
})
```

`tests/sim/save.test.ts` (add; `import v1 from '../fixtures/save-v1.json'`):

```ts
it('opens a shop saved before owners and names as the same shop, with the default owner and no tutorial', () => {
  const data = parseSave(structuredClone(v1))
  expect([data.v, data.shopName, data.ownerLook, data.profileDone]).toEqual([2, 'Tiệm Spa', DEFAULT_OWNER_LOOK, false])
  expect(data.hints).toEqual([...HINT_IDS])
  expect(data.customers.map(c => c.patienceMaxMs)).toEqual(v1.customers.map(() => PATIENCE_MS))
  const sim = SpaSim.fromSave(data, opts())
  expect([sim.day, sim.money, sim.customers.length]).toEqual([v1.day, v1.money, v1.customers.length])
  expect(sim.toSave().v).toBe(2)
})

it('still reopens the mini-game of an upgraded shop', () => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  const c = startService(sim)
  const old = { ...sim.toSave(), v: 1 } as Record<string, unknown>
  for (const k of ['shopName', 'ownerLook', 'profileDone', 'hints']) delete old[k]
  const copy = SpaSim.fromSave(parseSave(old), opts())
  expect(copy.drainEvents()).toContainEqual({ type: 'serviceReady', customerId: c.id, stationId: c.stationId })
})

it('keeps the owner, the shop name and the hints already shown', () => {
  const sim = busyShop()
  sim.setProfile({ skin: 3, hair: 4, hairStyle: 3, shirt: 2 }, '  Spa Hoa Sen ')
  sim.markHint('money')
  sim.markHint('money')
  const copy = viaJson(sim)
  expect([copy.shopName, copy.ownerLook, copy.profileDone, copy.hints]).toEqual(['Spa Hoa Sen', { skin: 3, hair: 4, hairStyle: 3, shirt: 2 }, true, ['money']])
})

it('rejects an owner look outside the choices', () => {
  const good = busyShop().toSave()
  const look = (o: object) => ({ skin: 0, hair: 0, hairStyle: 0, shirt: 0, ...o })
  for (const ownerLook of [look({ skin: 4 }), look({ shirt: 7 }), look({ skin: -1 }), look({ hair: 1.5 }), null])
    expect(() => parseSave({ ...good, ownerLook })).toThrow(SaveError)
})

it('cleans the saved shop name and drops hints it does not know', () => {
  const good = busyShop().toSave()
  const d = parseSave({ ...good, shopName: '  Spa   Sen  ', hints: ['money', 'fly'] })
  expect([d.shopName, d.hints]).toEqual(['Spa Sen', ['money']])
  expect(parseSave({ ...good, shopName: '   ' }).shopName).toBe('Tiệm Spa')
  expect(() => parseSave({ ...good, shopName: 5 })).toThrow(SaveError)
})
```

`tests/save/code.test.ts` (add):

```ts
it('reads a code made before owners and names', async () => {
  const d = await decodeSaveCode(await encodeSaveCode(v1 as unknown as SaveData))
  expect([d.v, d.shopName, d.profileDone, d.money]).toEqual([2, 'Tiệm Spa', false, v1.money])
})
```

`tests/save/store.test.ts`: the `keeps three separate shops` expectation becomes `[{ day: 1, money: 2, name: 'Tiệm Spa' }, null]`.

- [ ] **Step 3: Run** `npm test`. Expected: the new tests fail (missing exports, `v` still 1).

- [ ] **Step 4: Implement** the interfaces above. Add `"resolveJsonModule": true` to `tsconfig.json` so `tsc` accepts the fixture import.

- [ ] **Step 5: Run** `npm test` and `npm run build`. Expected: all pass, including every pre-existing test.

- [ ] **Step 6: Commit**

```bash
git add tests/fixtures/save-v1.json src/sim/profile.ts tests/sim/profile.test.ts src/sim/types.ts src/sim/save.ts src/sim/spa.ts src/save/store.ts src/config.ts src/strings/vi.ts tsconfig.json tests/sim/save.test.ts tests/save/code.test.ts tests/save/store.test.ts
git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "Save the owner, the shop name and the hints shown, and open older shops with a default owner"
```

### Task 2: Which hint to show, which feature is open

**Files:**
- Create: `src/sim/tutorial.ts`, `src/sim/unlocks.ts`, `tests/sim/tutorial.test.ts`, `tests/sim/unlocks.test.ts`
- Modify: `src/sim/spa.ts` (`tapTile`), `src/config.ts`

**Interfaces:**
- Consumes: `SpaSim.hintDone`, `markHint`, `Customer.patienceMaxMs` (Task 1).
- Produces:
  - `type Pointer = { hint: 'tapCustomer' | 'patience'; customerId: number }`; `pickHint(sim: SpaSim): Pointer | null`. Null while `paused`, `dayOver` or `servingCustomerId !== null`. Otherwise `tapCustomer` when that hint is not done, `owner.task === null` and someone is `waiting` (lowest id). Otherwise `patience` when it is not done, `tapCustomer` is done, and a `waiting` customer has `patienceMs < patienceMaxMs / 2` (lowest id).
  - `SpaSim.tapTile` calls `markHint('tapCustomer')` when it gives the owner a `fetch` task.
  - `config.ts`: `UNLOCK_DAY = { build: 2, staff: 3, services: 4, stock: 5 } as const`. `unlocks.ts`: `type Feature = keyof typeof UNLOCK_DAY`; `isUnlocked(f: Feature, day: number): boolean`.

- [ ] **Step 1: Write the failing tests**

`tests/sim/tutorial.test.ts` (`fresh = () => new SpaSim({ rng: createRng(1), autoSpawn: false })`):

```ts
it('points at the first customer to sit down until the player taps one', () => {
  const sim = fresh()
  expect(pickHint(sim)).toBeNull()
  const a = seatAndWait(sim)
  const b = seatAndWait(sim)
  expect(pickHint(sim)).toEqual({ hint: 'tapCustomer', customerId: a.id })
  sim.tapTile(b.seat!)
  expect(sim.hintDone('tapCustomer')).toBe(true)
  expect(pickHint(sim)).toBeNull()
})

it('then points once at a customer whose patience fell below half', () => {
  const sim = fresh()
  sim.markHint('tapCustomer')
  const c = seatAndWait(sim)
  expect(pickHint(sim)).toBeNull()
  c.patienceMs = c.patienceMaxMs / 2 - 1
  expect(pickHint(sim)).toEqual({ hint: 'patience', customerId: c.id })
  sim.markHint('patience')
  expect(pickHint(sim)).toBeNull()
})

it('shows one hint at a time, the tap hint first', () => {
  const sim = fresh()
  const c = seatAndWait(sim)
  c.patienceMs = 1
  expect(pickHint(sim)).toEqual({ hint: 'tapCustomer', customerId: c.id })
})

it('stays quiet while paused, during a service and after closing', () => {
  const sim = fresh()
  seatAndWait(sim)
  sim.paused = true
  expect(pickHint(sim)).toBeNull()
  sim.paused = false
  sim.dayOver = true
  expect(pickHint(sim)).toBeNull()
  sim.dayOver = false
  startService(sim)
  expect(pickHint(sim)).toBeNull()
})

it('never guides a shop from before the tutorial', () => {
  const sim = SpaSim.fromSave(parseSave(structuredClone(v1)), { rng: createRng(1), autoSpawn: false })
  seatAndWait(sim)
  expect(pickHint(sim)).toBeNull()
})

it('remembers which hints were shown across a save', () => {
  const sim = fresh()
  const c = seatAndWait(sim)
  sim.tapTile(c.seat!)
  const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(1), autoSpawn: false })
  expect([copy.hintDone('tapCustomer'), copy.hintDone('demoShampoo')]).toEqual([true, false])
})
```

`tests/sim/unlocks.test.ts`:

```ts
it('opens building on day 2, staff on day 3, services on day 4 and stock on day 5', () => {
  expect([1, 2].map(d => isUnlocked('build', d))).toEqual([false, true])
  expect([2, 3].map(d => isUnlocked('staff', d))).toEqual([false, true])
  expect([3, 4].map(d => isUnlocked('services', d))).toEqual([false, true])
  expect([4, 5, 40].map(d => isUnlocked('stock', d))).toEqual([false, true, true])
})
```

- [ ] **Step 2: Run** `npm test`. Expected: the new tests fail.
- [ ] **Step 3: Implement** the interfaces above.
- [ ] **Step 4: Run** `npm test`. Expected: all pass.
- [ ] **Step 5: Commit**

```bash
git add src/sim/tutorial.ts src/sim/unlocks.ts tests/sim/tutorial.test.ts tests/sim/unlocks.test.ts src/sim/spa.ts src/config.ts
git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "Decide which first-day hint to show and which button is open by day"
```

### Task 3: Easier first days

**Files:**
- Modify: `src/config.ts`, `src/sim/economy.ts`, `src/sim/spa.ts`, `src/sim/shampoo.ts`, `tests/sim/shampoo.test.ts`
- Create: `tests/sim/ease.test.ts`

**Interfaces:**
- Produces:
  - `config.ts`: `DAY_EASE = [{ patience: 1.6, miniGameExtraMs: 10_000, arrival: 1.3 }, { patience: 1.4, miniGameExtraMs: 10_000, arrival: 1 }, { patience: 1.2, miniGameExtraMs: 5_000, arrival: 1 }] as const`.
  - `economy.ts`: `interface DayEase { patience: number; miniGameExtraMs: number; arrival: number }`; `dayEase(day: number): DayEase` (`DAY_EASE[day - 1]`, else `{ patience: 1, miniGameExtraMs: 0, arrival: 1 }`).
  - `spawnCustomer`: `patienceMs = patienceMaxMs = Math.round(PATIENCE_MS * dayEase(this.day).patience)`. The next-arrival interval is multiplied by `dayEase(this.day).arrival`.
  - `class ShampooGame { constructor(extraMs = 0); readonly limitMs: number }`: time limit `SHAMPOO_TIME_LIMIT_MS + extraMs`, star marks `STAR3_MS + extraMs` and `STAR2_MS + extraMs`.

- [ ] **Step 1: Write the failing tests**

`tests/sim/ease.test.ts`:

```ts
it('gives customers more patience on the first three days, starting full', () => {
  const on = (day: number) => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.day = day
    const c = sim.spawnCustomer()
    return [c.patienceMaxMs, c.patienceMs]
  }
  expect([1, 2, 3, 4, 9].map(on)).toEqual([[96_000, 96_000], [84_000, 84_000], [72_000, 72_000], [60_000, 60_000], [60_000, 60_000]])
})

it('gives the mini-game 10 extra seconds on days 1 and 2 and 5 on day 3', () =>
  expect([1, 2, 3, 4].map(d => dayEase(d).miniGameExtraMs)).toEqual([10_000, 10_000, 5_000, 0]))

it('sends customers 1.3 times further apart on day 1', () => {
  const gapOn = (day: number) => {
    const sim = new SpaSim({ rng: createRng(5) })
    sim.day = day
    const times: number[] = []
    for (let ms = 0; times.length < 2; ms += 50) {
      sim.advance(50)
      if (sim.customers.length > times.length) times.push(ms)
    }
    return times[1] - times[0]
  }
  expect(gapOn(1) / gapOn(4)).toBeCloseTo(1.3, 1)
})
```

`tests/sim/shampoo.test.ts`: `finishAt(ms, extraMs = 0)` builds `new ShampooGame(extraMs)`; add

```ts
it('moves the time limit and the star marks by the extra time', () => {
  const g = new ShampooGame(10_000)
  expect(g.limitMs).toBe(35_000)
  g.tick(34_000)
  expect(g.phase).toBe('foam')
  g.tick(1_000)
  expect(g.stars()).toBe(1)
  expect(finishAt(24_000, 10_000).stars()).toBe(3)
  expect(finishAt(31_000, 10_000).stars()).toBe(2)
})
```

- [ ] **Step 2: Run** `npm test`. Expected: the new tests fail.
- [ ] **Step 3: Implement** the interfaces above.
- [ ] **Step 4: Run** `npm test`. Expected: all pass. The existing `a waiting customer runs out of patience` test still fits in its 120 s on day 1 (96 s of patience).
- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/sim/economy.ts src/sim/spa.ts src/sim/shampoo.ts tests/sim/shampoo.test.ts tests/sim/ease.test.ts
git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "Make the first three days gentler: more patience, more time, fewer customers on day 1"
```

### Task 4: Owner and guide art

**Files:**
- Modify: `src/art/chibi.ts`, `src/art/palette.ts`, `src/art/fx.ts`, `src/config.ts`, `src/scenes/SpaScene.ts` (one line)
- Create: `tests/art/palette.test.ts`, `tests/art/chibi.test.ts`

**Interfaces:**
- Produces:
  - `config.ts`: `LOOK_COUNTS = { skin: 4, hair: 5, hairStyle: 4, shirt: 5 }`.
  - `palette.ts`: `SKIN` gains a deeper tone `0xb97f58`; `OWNER_SHIRT = [0x2f7d6e, 0x4e9a6b, 0xa8302a, 0x8a5634]`; `ownerColors(look: Look): CharacterColors` (`SKIN`, `HAIR`, `look.hairStyle`, `OWNER_SHIRT`). `OWNER_COLORS` is removed; `SpaScene` uses `ownerColors(this.sim.ownerLook)`.
  - `chibi.ts`: `hair2-*` short crop (close to the head, a small side-swept fringe, ears showing) and `hair3-*` bun (bob-length cap plus a round bun on top; seen from behind the bun sits centred, from the side at the back), each for `down`, `up`, `side`, built with the existing `hair()` helper so the `-line` split applies.
  - `fx.ts`: `hand` (a style A cartoon hand pointing down with the index finger, cream `C.cream` with ink outline and a teal cuff, about 100×130 px, fingertip at the bottom centre), `icon-dice` (64×64 cream die, ink outline, terracotta pips), `icon-lock` (about 40×46, mustard body, ink outline).

- [ ] **Step 1: Write the failing tests**

`tests/art/palette.test.ts`:

```ts
it('has a color for every look choice', () => {
  expect([SKIN.length, HAIR.length, SHIRT.length]).toEqual([LOOK_COUNTS.skin, LOOK_COUNTS.hair, LOOK_COUNTS.shirt])
  expect([SKIN.length, HAIR.length, OWNER_SHIRT.length]).toEqual([OWNER_LOOK_COUNTS.skin, OWNER_LOOK_COUNTS.hair, OWNER_LOOK_COUNTS.shirt])
  expect([LOOK_COUNTS.hairStyle, OWNER_LOOK_COUNTS.hairStyle]).toEqual([4, 4])
})

it('never dresses a customer like the owner', () => {
  const rgb = (c: number) => [c >> 16, (c >> 8) & 255, c & 255]
  for (const o of OWNER_SHIRT)
    for (const s of SHIRT) expect(Math.hypot(...rgb(o).map((v, i) => v - rgb(s)[i]))).toBeGreaterThan(50)
})

it('turns an owner look into colors', () =>
  expect(ownerColors({ skin: 3, hair: 1, hairStyle: 2, shirt: 2 })).toEqual({ skin: SKIN[3], hair: HAIR[1], hairStyle: 2, shirt: 0xa8302a }))
```

`tests/art/chibi.test.ts` (mock Phaser):

```ts
it('draws four hair styles from every side, each with its brown lines', () => {
  const keys = Object.keys(chibiTextures())
  for (const s of [0, 1, 2, 3]) for (const d of ['down', 'up', 'side']) expect(keys).toEqual(expect.arrayContaining([`hair${s}-${d}`, `hair${s}-${d}-line`]))
})
it('draws the hand, the dice and the lock', () => expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['hand', 'icon-dice', 'icon-lock'])))
```

- [ ] **Step 2: Run** `npm test`. Expected: the new tests fail.
- [ ] **Step 3: Implement** the interfaces above.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: all pass.
- [ ] **Step 5: Look at it.** Dev server at 402×874. The owner view is built once, so check the new hair on customers: spawn until all four styles show (`for (let i = 0; i < 8; i++) __spa.sim.spawnCustomer()`, wait 3 s), screenshot and `zoom` on the bench and the walkers. Check each new style in every facing that appears, brown outlines, no stray lines. Fix and re-check until clean.
- [ ] **Step 6: Commit**

```bash
git add src/art/chibi.ts src/art/palette.ts src/art/fx.ts src/config.ts src/scenes/SpaScene.ts tests/art/palette.test.ts tests/art/chibi.test.ts
git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "Draw short and bun hair, a deeper skin tone, owner-only shirts, and the guide's hand"
```

### Task 5: The owner card and opening a shop

**Files:**
- Create: `src/scenes/OwnerScene.ts`
- Modify: `src/scenes/SpaScene.ts`, `src/view/Hud.ts` (banner), `src/view/dom.ts`, `src/main.ts` (register the scene), `index.html` (input style), `src/strings/vi.ts`

**Interfaces:**
- Consumes: `SpaSim.setProfile`, `profileDone`, `shopName`, `ownerLook` (Task 1); `suggestShopName`, `SHOP_NAME_MAX` (Task 1); `ownerColors`, `OWNER_SHIRT`, `SKIN`, `HAIR`, textures `hair{0..3}-down`, `head`, `icon-dice` (Task 4).
- Produces:
  - `type OwnerMode = 'new' | 'upgrade' | 'edit'`; `interface OwnerData { mode: OwnerMode; look: Look; name: string; onSave: (look: Look, name: string) => void; onClose: () => void }`. `OwnerScene` stops itself after calling `onSave` then `onClose`, or only `onClose` ("Thôi").
  - `dom.ts`: `nameInput(scene: Phaser.Scene, x: number, y: number, opts: { value: string; placeholder: string; maxLength: number }): { dom: Phaser.GameObjects.DOMElement; input: HTMLInputElement }`: `<input type="text">` with `maxlength`, `autocapitalize="words"`, `autocomplete="off"`, `autocorrect="off"`, `spellcheck=false`, `enterkeyhint="done"`; Enter blurs; blur runs `window.scrollTo(0, 0)` so iOS does not leave the page shifted after the keyboard closes. Root class `spa-dom spa-name` (width 600 px).
  - `index.html`: `.spa-dom input` styled like the textarea (block, width 100%, height 120 px, padding 0 32 px, font 600 44px Be Vietnam Pro, ink text, cream fill, 4 px ink border, radius 60 px, `user-select: text`, `-webkit-touch-callout: default`, `touch-action: auto`); `.spa-dom.spa-name { width: 600px }`.
  - `Hud.banner(text: string): void`: paper card with ink outline centred at (540, 300), text 46 px 800 shrunk to fit 900 px, slides down 40 px while fading in (250 ms), stays 2000 ms, fades out; depth above the HUD.
  - `SpaScene`: `private modal = false`; while `modal`, no `sim.update` and no event draining (sprites still sync). `openOwnerCard(mode: OwnerMode, after: () => void): void` sets `modal`, launches `OwnerScene` with the sim's look and name; `onSave` → `sim.setProfile`, rebuild the owner `CharacterView` from `ownerColors`, `session.saveNow()`; `onClose` → `modal = false`, `after()`.
  - Strings: `createTitle: 'Tạo chủ tiệm'`, `profileTitle: 'Chủ tiệm và tên tiệm'`, `upgradeNote: 'Giờ đã chọn được chủ tiệm và đặt tên tiệm.'`, `hairStyle: 'Kiểu tóc'`, `hairColor: 'Màu tóc'`, `skinColor: 'Màu da'`, `shirtColor: 'Màu áo'`, `shopNameLabel: 'Tên tiệm'`, `openShop: 'Mở tiệm'`, `save: 'Lưu'`, `keepAsIs: 'Giữ như cũ'`, `morningBanner: '{name} · Ngày {day} · Mở cửa!'`.

- [ ] **Step 1: Build `OwnerScene`.** Dimmed backdrop that swallows taps; one card from y 140 to 2020. Top to bottom: title (`createTitle` for `new`, `profileTitle` otherwise; `upgrade` adds `upgradeNote` under it); the owner preview, a `CharacterView` scaled ×2 with feet at y ≈ 700, turning `down → right → up → left` every 2000 ms; the shop name row (label, then `nameInput` 600 px wide with the dice button, a 120 px cream circle with `icon-dice`, on its right; the dice fills the box with `suggestShopName(rng, box value)`; `new` starts with a suggestion as the value, the others with the current name; the placeholder is a suggestion); four option rows, each a label over its choices: hair style as four 120 px tiles showing `head` + `hair{n}-down` tinted with the chosen skin and hair colors; hair color, skin and shirt as swatch circles (r 42) in `HAIR`, `SKIN`, `OWNER_SHIRT`; the chosen one has a 6 px teal ring; every tap redraws the preview. Buttons at the bottom: `new` → one primary `openShop` (150 tall); `upgrade` → primary `save` and plain `keepAsIs` (keep = `onSave` with the original look and name, so the card never returns); `edit` → primary `save` and plain `cancel`. The name sent to `onSave` is the box value; an empty box sends the placeholder.

The order puts the name row right under the preview, above the options: the spec lists it last, but a text box in the lower half of an iPhone screen sits under the keyboard. Say so in the task report.

- [ ] **Step 2: Wire the opening flow in `SpaScene.create()`:**
  - no save → `openOwnerCard('new', …)`; after it: if the install card is due (today's rule), set a flag so `resume()` shows the morning banner, then `pause('install')`; otherwise show the banner at once.
  - a save with `profileDone === false` → `openOwnerCard('upgrade', …)`; after it: `pause()` unless `sim.dayOver` (the queued `dayEnded` then opens the summary).
  - otherwise unchanged.
  - The summary's `onNewDay` shows the banner after `startDay()`.

- [ ] **Step 3: Check in the browser** (dev server, 402×874, cleared storage):
  - the card shows with a suggested name; tap every hair style and a few colors, screenshot; type `Spa Hoà Bình Ẵ` in the box; "Mở tiệm" → the banner reads `Spa Hoà Bình Ẵ · Ngày 1 · Mở cửa!` with no clipped marks; the owner behind the desk matches the choices (screenshot);
  - reload → the pause card, no owner card;
  - load the v1 fixture into slot 1, reload → the upgrade card with `Tiệm Spa` and both buttons; "Giữ như cũ" → the pause card; reload → no owner card;
  - the v1 fixture edited to `dayOver: true`, `customers: []`, `stationCustomers: [null, null]`, `seatCustomers: [null, null, null]` → the owner card alone, then the summary after "Lưu" (never both at once);
  - with the iPhone user agent and cleared storage → owner card, then the install card, then the banner after "Để sau";
  - console clean.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: all pass.
- [ ] **Step 5: Commit**

```bash
git add src/scenes/OwnerScene.ts src/scenes/SpaScene.ts src/view/Hud.ts src/view/dom.ts src/main.ts index.html src/strings/vi.ts
git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "Create the owner and name the shop before opening, and greet each morning with the shop name"
```

### Task 6: Shop names on the pause card, the slots and the summary

**Files:**
- Modify: `src/scenes/PauseScene.ts`, `src/scenes/SummaryScene.ts`, `src/scenes/SpaScene.ts`, `src/strings/vi.ts`, `tests/strings/strings.test.ts`

**Interfaces:**
- Consumes: `SlotInfo.name` (Task 1), `SpaScene.openOwnerCard` (Task 5), `sim.hintDone/markHint` (Task 1).
- Produces:
  - `PauseData.onEditProfile: () => void`. The menu gains a plain `profileTitle` button after "Nhập mã lưu"; it stops the pause scene and calls `onEditProfile`, which `SpaScene` wires to `openOwnerCard('edit', () => this.pause())`.
  - Pause card header: the shop name (64 px 800, scaled down to fit 780 px) at `CARD_TOP + 95`, `paused` (40 px 600) at `CARD_TOP + 170`.
  - Slot rows on two lines, left-aligned at `left + 50`: line 1 the shop name (40 px 800, scaled to fit 620 px) or `slotEmpty`; line 2 (32 px 600) `slotPlaying` for the slot in use, `slotSummary` `'Ô {n} · Ngày {day} · {money}'` for a saved one, `slotName` for an empty one. `slotDetail` is removed.
  - `SummaryData.firstDay: boolean` (`!sim.hintDone('summary')`): the shop name (44 px 600, fit 760 px) at y 485, the title (60 px) at y 565, and when `firstDay` the line `summaryFirstDay: 'Bấm Ngày mới để mở cửa tiếp. Game tự lưu.'` (34 px 600, centred, wrap 760) at y 1420. `SpaScene`'s `onNewDay` marks `summary` before `startDay()`.

- [ ] **Step 1: Update the strings test** — replace the `slotDetail` line with `expect(t('slotSummary', { n: 2, day: 5, money: formatMoney(340000) })).toBe('Ô 2 · Ngày 5 · 340.000 đ')` and add `expect(t('morningBanner', { name: 'Spa Sen', day: 3 })).toBe('Spa Sen · Ngày 3 · Mở cửa!')`. Run `npm test`: the first fails.
- [ ] **Step 2: Implement** the interfaces above.
- [ ] **Step 3: Check in the browser:** slot 2 holding a shop named `Tiệm Gội Đầu Cô Ba Q.3 ạ` (24 characters) and slot 3 empty → pause card screenshot: names fit, marks not clipped, rows readable; "Chủ tiệm và tên tiệm" → edit card → change shirt and name → "Lưu" → back on the pause card with the new name, the owner redrawn; "Thôi" changes nothing; end day 1 (`__spa.sim.clock.minutes = 1199`, wait for the summary) → name, title and the first-day line; "Ngày mới" → banner; end day 2 → no first-day line. Console clean.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: all pass.
- [ ] **Step 5: Commit**

```bash
git add src/scenes/PauseScene.ts src/scenes/SummaryScene.ts src/scenes/SpaScene.ts src/strings/vi.ts tests/strings/strings.test.ts
git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "Show the shop name on the pause card, the save slots and the summary, and edit the owner from the pause card"
```

### Task 7: The guiding hand, the mini-game demo, locked buttons

**Files:**
- Create: `src/view/HandPointer.ts`
- Modify: `src/view/Hud.ts`, `src/scenes/SpaScene.ts`, `src/scenes/ShampooScene.ts`, `src/strings/vi.ts`

**Interfaces:**
- Consumes: `pickHint`, `isUnlocked`, `UNLOCK_DAY` (Task 2); `dayEase`, `ShampooGame(extraMs)`, `limitMs` (Task 3); `hand`, `icon-lock` textures (Task 4).
- Produces:
  - `class HandPointer { constructor(scene: Phaser.Scene); show(text: string, x: number, y: number, dir: 'down' | 'up'): void; hide(): void }`. `down`: the fingertip at (x, y) from above, the text box above the hand; `up`: the hand flipped, fingertip at (x, y) from below, the box below. The hand bobs 12 px (700 ms, yoyo). The box is the old hint's style (paper, ink 4 px, radius 12, 38 px 600, wrap 800), kept inside x 40–1040. Depth above the HUD. Calling `show` again with the same arguments keeps the running animation.
  - `ShampooData` adds `extraMs: number` and `demo: boolean`. The bars use `rules.limitMs`. With `demo`, each phase (foam, rinse, dry) starts with the `hand` at 60 % alpha showing the move — side to side across the hair (±120 px, 700 ms yoyo) for foam and dry, a slow press (scale 1 → 0.9 yoyo) on the hair centre for rinse — until the first `pointerdown` of that phase.
  - Hud: the static first-customer hint, `hideHint()` and `hintFirstCustomer` go. Each nav entry may carry a `Feature` (`navBuild` build, `navStaff` staff, `navServices` services, `navQuests` none). While `!isUnlocked(feature, sim.day)` the plate's icon and label are at 45 % alpha with `icon-lock` on the plate's top-right, and a tap toasts `unlocksOn: 'Mở vào ngày {day}'`; otherwise a tap toasts `comingSoon` as now. Checked every frame, so a new day shows at once.
  - `SpaScene` each frame, with the pointer hidden while `sim.paused`, `servingCustomerId !== null`, `modal` or `holding`:
    - a timed queue first: on the first `paid` event while `money` is not done, mark `money` and `star`, then show `hintMoney: 'Tiền công và tiền tip cộng vào đây'` pointing up at the money (x `TOP_BAR.moneyX` + 80, y 120) for 3000 ms, then `hintStar: 'Khách vui thì sao tăng, tiệm đông khách hơn'` pointing up at the star for 3000 ms;
    - else `pickHint`: `tapCustomer` → `hintTapCustomer: 'Chạm vào khách để mời gội đầu'` pointing down at the customer's head (feet y − `CHARACTER_HEIGHT_PX` − 10); `patience` → `hintPatience: 'Khách chờ lâu sẽ bực rồi bỏ về'` pointing down at the bar's top, and `markHint('patience')` after it has shown for 4000 ms of unpaused time.
  - `serviceReady` builds `ShampooData` with `extraMs: dayEase(sim.day).miniGameExtraMs`, `demo: !sim.hintDone('demoShampoo')`, and an `onDone` that marks `demoShampoo` before `completeService`.

- [ ] **Step 1: Implement** the interfaces above (view code; the rules behind it are tested in Tasks 2 and 3).
- [ ] **Step 2: Check in the browser** (cleared storage, 402×874), screenshots of each:
  - the first customer sits → the hand over them with the line; tap the customer → it goes;
  - the mini-game → the demo finger in foam; touch → it goes; finish foam by script or by `drag` and see the rinse demo; reload during the mini-game → the pause card, "Chơi tiếp" → the mini-game with the demo again;
  - finish → the money pointer, then the star pointer, then nothing;
  - a second customer with `patienceMs` set below half → the patience hand for about 4 s, then never again;
  - the nav plates: Xây dựng, Nhân viên, Dịch vụ locked on day 1, tap Xây dựng → "Mở vào ngày 2"; finish the day, "Ngày mới" → Xây dựng open, tap → "Tính năng này có ở bản sau"; Nhiệm vụ never locked;
  - an upgraded v1 shop on day 1 shows none of the hints;
  - console clean.
- [ ] **Step 3: Run** `npm test` and `npm run build`. Expected: all pass.
- [ ] **Step 4: Commit**

```bash
git add src/view/HandPointer.ts src/view/Hud.ts src/scenes/SpaScene.ts src/scenes/ShampooScene.ts src/strings/vi.ts
git -c user.name="phatlee" -c user.email="ptsc.sti@gmail.com" commit -m "Guide day 1 with a pointing hand and a demo finger, and lock the bottom buttons until their day"
```

### Task 8: Whole-branch check and going live

- [ ] **Step 1: Run** `npm test` and `npm run build`. Expected: all pass, no errors.
- [ ] **Step 2: Run through the production build** (`npx vite preview --port 4173 --strictPort` in the background, iPhone UA, 402×874, cleared storage): owner card → name with marks → "Mở tiệm" → install card → "Để sau" → banner → first customer hand → serve with the demo → money and star pointers → reload mid-day → pause card shows the name → edit the owner → switch to slot 2 (owner card for the new shop) and back → paste the v1 fixture as a save code into slot 3 via "Nhập mã lưu" (encode it in the console with the dev build's `encodeSaveCode`, or keep a code made on `master` before the branch) → owner upgrade card → stop the server, reload (offline) → the game opens. Screenshots of each card. Console clean.
- [ ] **Step 3: Final review** of the whole branch by a fresh reviewer against the design (sections 4 and 6) and this plan; fix what it finds, test first; `npm test` green after.
- [ ] **Step 4: Go live** (anh's standing OK): `git checkout master && git merge --ff-only step-1b-owner && git push origin master`.
- [ ] **Step 5: Check the run:** `curl -s "https://api.github.com/repos/FEAN9999/spa-indie-game/actions/runs?per_page=1"` until `status` is `completed`; expect `conclusion` `success`.
- [ ] **Step 6: Check the live site:** `https://fean9999.github.io/spa-indie-game/` at 402×874: `version.json` matches the first 8 characters of the pushed commit; a fresh visit shows the owner card; console clean. Then `git branch -d step-1b-owner`.
- [ ] **Step 7: Tell anh** in two or three plain Vietnamese lines what is live, and add to the iPhone list: type a shop name with marks; check the keyboard does not leave the screen shifted.
