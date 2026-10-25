# Step 1a: Playable Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone-playable spa day: one small floor seen top-down at a slant, an owner character who walks where you tap, customers who walk in, wait, get a hands-on shampoo mini-game, pay, review and leave, and an end-of-day summary, all in animated vector art.

**Architecture:** Game rules live in `src/sim/` as plain TypeScript with no Phaser import, driven by `update(dtMs)` and read by the view, so they are unit-tested in Node. Phaser 4 scenes in `src/scenes/` render the sim every frame and forward taps. All art is SVG strings generated in `src/art/`, rasterized to textures at boot; characters are containers of white part-textures tinted per character.

**Tech Stack:** TypeScript ^7.0, Phaser ^4.2.1, Vite ^8.3, Vitest ^5.0, `@fontsource/baloo-2` ^5.3 (OFL), Node 24.

**Spec:** `docs/superpowers/specs/2026-10-25-spa-game-design.md` (step 1a in section 6; rules in section 5; art in section 7).

## Global Constraints

- Free only: every dependency is MIT/OFL/CC0; no paid service, no account needed for 1a.
- No pixel art: `pixelArt: false`, antialiasing on, all art is vector SVG drawn in code.
- Every player-visible string comes from `src/strings/vi.ts`; no Vietnamese literals elsewhere.
- `src/sim/**` must not import `phaser` or anything from `src/art`, `src/view`, `src/scenes`.
- Portrait phone, touch only. iPhone Safari (iPhone 17, viewport 402×874) is the primary target.
- Game canvas is 1080×2160, `Phaser.Scale.FIT`, `CENTER_BOTH`; page background `#fdf1e4` so letterbox bars are invisible.
- Palette (from the approved mockup): cream `#fdf1e4`, peach wall `#fbe3d3`, wall cap `#f0cdb8`, wood floor `#ecd3b4`, plank line `#e3c6a2`, lavender `#c9b6e4`, mint `#9fd8c7`, teal uniform `#5fb3a1`, pink `#f4a6b8`, gold `#f5c242`, text brown `#5a4a42`.
- Dev server listens on the LAN (`server.host: true`) so the owner can play from an iPhone on home Wi-Fi.
- Out of scope for 1a (spec puts them in 1b): saving, sound, tutorial beyond one hint line, staff, build mode, stock, multiple floors, pan/zoom, owner customization.
- Work on branch `step-1a`, never directly on `master`.

## Review Focus

1. Taps while the mini-game or the summary is open must not move the owner or start a second service. (Task 5 test `ignores taps while a service is pending or the day is over`.)
2. Coming back after locking the phone delivers one huge frame delta; it must not skip the day or make every customer storm out. (Task 4 test `update clamps a huge frame delta`; Task 7 passes Phaser's delta straight to `sim.update`.)
3. Tapping a customer who is still walking in, or already leaving, must do nothing. (Task 5 test `ignores taps on customers who are not waiting`.)
4. Closing time while a customer is still being shampooed must wait for that customer instead of cutting to the summary. (Task 5 test `does not end the day while a customer is being served`.)
5. Rotating the phone to landscape must keep the game letterboxed and tappable, not stretched or cropped. (Task 9 landscape screenshot step.)

---

## File Structure

```
index.html                 page shell, iOS viewport/touch CSS
vite.config.ts             LAN host, vitest node env
src/main.ts                font load, Phaser.Game, dev debug hook
src/config.ts              every tunable number
src/strings/vi.ts          Vietnamese strings + t()
src/strings/format.ts      formatMoney()
src/sim/types.ts           shared sim types and SimEvent
src/sim/rng.ts             seeded RNG, randomLook()
src/sim/grid.ts            layout parsing, walkability
src/sim/layout.ts          SPA_LAYOUT_1A
src/sim/path.ts            BFS pathfinding
src/sim/clock.ts           DayClock
src/sim/economy.ts         tips, reviews, rating, arrival interval
src/sim/shampoo.ts         ShampooGame rules
src/sim/spa.ts             SpaSim: customers, owner, stations, day
src/art/palette.ts         hex colors, look palettes
src/art/svg.ts             loadSvgTextures()
src/art/chibi.ts           character part SVGs
src/art/room.ts            room background + furniture SVGs
src/art/fx.ts              coin, bubbles, ripple, star SVGs
src/art/shampooArt.ts      mini-game close-up SVGs
src/view/CharacterView.ts  tinted part container + animation
src/view/RoomView.ts       background + depth-sorted furniture
src/view/Hud.ts            top bar, bottom bar, toast, hint
src/scenes/BootScene.ts
src/scenes/SpaScene.ts
src/scenes/ShampooScene.ts
src/scenes/SummaryScene.ts
tests/sim/*.test.ts, tests/strings/*.test.ts
```

---

### Task 1: Project scaffold, strings, RNG

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/config.ts`, `src/strings/vi.ts`, `src/strings/format.ts`, `src/sim/types.ts`, `src/sim/rng.ts`
- Modify: `.gitignore` (add `node_modules/`, `dist/`)
- Test: `tests/sim/rng.test.ts`, `tests/strings/strings.test.ts`

**Interfaces:**
- Produces:
  - `createRng(seed: number): Rng` where `type Rng = () => number` (mulberry32, values in [0, 1)).
  - `randomLook(rng: Rng): Look` with `interface Look { skin: number; hair: number; hairStyle: number; shirt: number }` (palette indices bounded by `LOOK_COUNTS = { skin: 3, hair: 5, hairStyle: 2, shirt: 5 }` in `config.ts`).
  - `vi` (const object) and `t(key: keyof typeof vi, params?: Record<string, string | number>): string` replacing `{name}` tokens.
  - `formatMoney(n: number): string`, dot thousands separator, suffix `" đ"`, implemented without `toLocaleString`.
  - `src/config.ts` exports: `GAME_W = 1080`, `GAME_H = 2160`, `TILE = 78`, `MAP_X = 33`, `MAP_Y = 210`, `LOOK_COUNTS`. Later tasks append their constants here.

- [ ] **Step 1: Create branch and scaffold**

```bash
git checkout -b step-1a
npm init -y
npm i phaser@^4.2.1 @fontsource/baloo-2@^5.3.0
npm i -D typescript@^7.0.2 vite@^8.3.5 vitest@^5.0.5
```
`package.json` scripts: `"dev": "vite"`, `"build": "tsc --noEmit && vite build"`, `"test": "vitest run"`, `"type": "module"`. `tsconfig.json`: `target ES2022`, `module ESNext`, `moduleResolution bundler`, `strict true`, `noEmit true`, `include ["src", "tests"]`, `types ["vite/client"]`. `vite.config.ts`: `server: { host: true }`, `preview: { host: true }`, `test: { environment: 'node', include: ['tests/**/*.test.ts'] }`.

- [ ] **Step 2: Write `src/strings/vi.ts` with exactly these entries**

```ts
export const vi = {
  loading: 'Đang tải...',
  dayLabel: 'Ngày {day}',
  hintFirstCustomer: 'Chạm vào khách đang chờ để mời gội đầu',
  stationsBusy: 'Ghế gội đầu đang bận',
  comingSoon: 'Tính năng này có ở bản sau',
  paused: 'Tạm dừng',
  tapToResume: 'Chạm để chơi tiếp',
  shampooFoam: 'Vuốt qua lại trên tóc để tạo bọt',
  shampooRinse: 'Giữ ngón tay trên tóc để xả nước',
  shampooDry: 'Vuốt để lau khô bằng khăn',
  shampooDone: 'Xong rồi!',
  summaryTitle: 'Tổng kết ngày {day}',
  served: 'Khách đã phục vụ',
  leftUnhappy: 'Khách bỏ về',
  income: 'Tiền dịch vụ',
  tips: 'Tiền tip',
  balance: 'Tiền hiện có',
  rating: 'Đánh giá',
  noRating: 'Chưa có',
  newDay: 'Ngày mới',
  navBuild: 'Xây dựng',
  navStaff: 'Nhân viên',
  navServices: 'Dịch vụ',
  navQuests: 'Nhiệm vụ',
} as const
```

- [ ] **Step 3: Write failing tests**

```ts
// tests/strings/strings.test.ts
it('formats money with dot separators', () => {
  expect(formatMoney(0)).toBe('0 đ')
  expect(formatMoney(40000)).toBe('40.000 đ')
  expect(formatMoney(1234567)).toBe('1.234.567 đ')
})
it('fills params into strings', () => {
  expect(t('summaryTitle', { day: 3 })).toBe('Tổng kết ngày 3')
  expect(t('newDay')).toBe('Ngày mới')
})
// tests/sim/rng.test.ts
it('is deterministic per seed and in [0,1)', () => {
  const a = createRng(42), b = createRng(42), c = createRng(7)
  const xs = [a(), a(), a(), a(), a()]
  expect([b(), b(), b(), b(), b()]).toEqual(xs)
  expect(c()).not.toBe(xs[0])
  xs.forEach(x => { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1) })
})
it('randomLook stays inside palette bounds', () => {
  const rng = createRng(1)
  for (let i = 0; i < 200; i++) {
    const l = randomLook(rng)
    expect(l.skin).toBeLessThan(3); expect(l.hair).toBeLessThan(5)
    expect(l.hairStyle).toBeLessThan(2); expect(l.shirt).toBeLessThan(5)
  }
})
```

- [ ] **Step 4: Run `npm test`.** Expected: FAIL, modules not found.
- [ ] **Step 5: Implement `vi.ts`/`t`, `format.ts`, `rng.ts`, `types.ts` (only `Tile`, `Facing`, `Look` for now; later tasks extend it).**
- [ ] **Step 6: Write `index.html` and `src/main.ts`.** Viewport meta `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`; CSS on `html, body`: `margin 0; height 100%; background #fdf1e4; overflow hidden; touch-action none; overscroll-behavior none; -webkit-user-select none; -webkit-touch-callout none`. `main.ts` imports `@fontsource/baloo-2/500.css` and `/700.css`, awaits `document.fonts.load('700 40px "Baloo 2"')`, then creates `Phaser.Game` with `type: Phaser.AUTO`, `width: GAME_W`, `height: GAME_H`, `backgroundColor: '#fdf1e4'`, `pixelArt: false`, `antialias: true`, `scale: { mode: FIT, autoCenter: CENTER_BOTH }`, and for now one inline scene that shows `t('loading')` centered in Baloo 2, `#5a4a42`. When `import.meta.env.DEV`, set `(window as any).__spa = { game }`.
- [ ] **Step 7: Verify.** `npm test` passes; `npm run build` exits 0; start `npm run dev -- --port 5173 --strictPort` in the background; the console prints a `Network:` URL; screenshot (Task 9 Step 2 shows the `$B` commands) shows "Đang tải..." centered on cream.
- [ ] **Step 8: Commit.** `git add package.json package-lock.json tsconfig.json vite.config.ts index.html .gitignore src tests && git commit -m "Scaffold Phaser + Vite project with strings and RNG"` (never `git add -A`: `CLAUDE.md` is the owner's untracked file).

---

### Task 2: Grid, layout and pathfinding

**Files:**
- Create: `src/sim/grid.ts`, `src/sim/layout.ts`, `src/sim/path.ts`
- Test: `tests/sim/grid.test.ts`, `tests/sim/path.test.ts`

**Interfaces:**
- Consumes: `Tile` from `types.ts`.
- Produces:
  - `type Cell = 'wall' | 'floor' | 'door' | 'seat' | 'chair' | 'work' | 'desk' | 'plant'`
  - `interface Grid { cols: number; rows: number; cells: Cell[][] /* [y][x] */; door: Tile; seats: Tile[]; chairs: Tile[]; works: Tile[]; desks: Tile[]; plants: Tile[] }`, lists in row-major order.
  - `parseLayout(rows: string[]): Grid`, legend `#` wall, `.` floor, `D` door, `S` seat, `C` chair, `W` work, `R` desk, `P` plant; throws `Error('Layout rows must have equal length')`.
  - `isWalkable(grid: Grid, t: Tile): boolean`: true only for in-bounds `floor`, `door`, `work`.
  - `tileEq(a: Tile, b: Tile): boolean`, `manhattan(a: Tile, b: Tile): number`.
  - `findPath(grid: Grid, from: Tile, isGoal: (t: Tile) => boolean): Tile[] | null`: BFS over 4 neighbors in order up, right, down, left. A neighbor may be entered if `isWalkable` or `isGoal(neighbor)` (so seats and chairs can be destinations). Returns the tiles after `from` up to and including the goal, `[]` if `from` is a goal, `null` if unreachable.
  - `SPA_LAYOUT_1A: string[]`, exactly:

```ts
export const SPA_LAYOUT_1A = [
  '#############',
  '#############',
  '#P.C..C....P#',
  '#..W..W.....#',
  '#...........#',
  '#...........#',
  '#...........#',
  '#.....RRR...#',
  '#...........#',
  '#...........#',
  '#.SSS.......#',
  '#...........#',
  '#...........#',
  '#...........#',
  '#...........#',
  '#...........#',
  '#P.........P#',
  '######D######',
]
```

- [ ] **Step 1: Write failing tests**

```ts
// grid.test.ts
it('parses the 1a layout', () => {
  const g = parseLayout(SPA_LAYOUT_1A)
  expect([g.cols, g.rows]).toEqual([13, 18])
  expect(g.door).toEqual({ x: 6, y: 17 })
  expect(g.seats).toEqual([{ x: 2, y: 10 }, { x: 3, y: 10 }, { x: 4, y: 10 }])
  expect(g.chairs).toEqual([{ x: 3, y: 2 }, { x: 6, y: 2 }])
  expect(g.works).toEqual([{ x: 3, y: 3 }, { x: 6, y: 3 }])
})
it('knows what can be walked on', () => {
  const g = parseLayout(SPA_LAYOUT_1A)
  expect(isWalkable(g, { x: 5, y: 5 })).toBe(true)   // floor
  expect(isWalkable(g, { x: 6, y: 17 })).toBe(true)  // door
  expect(isWalkable(g, { x: 3, y: 3 })).toBe(true)   // work
  expect(isWalkable(g, { x: 0, y: 5 })).toBe(false)  // wall
  expect(isWalkable(g, { x: 7, y: 7 })).toBe(false)  // desk
  expect(isWalkable(g, { x: 2, y: 10 })).toBe(false) // seat
  expect(isWalkable(g, { x: -1, y: 0 })).toBe(false) // out of bounds
})
it('rejects ragged layouts', () => {
  expect(() => parseLayout(['###', '##'])).toThrow('Layout rows must have equal length')
})
// path.test.ts  (small layouts)
const open = parseLayout(['#####', '#...#', '#...#', '#####'])
it('walks a straight line, excluding start and including goal', () => {
  expect(findPath(open, { x: 1, y: 1 }, t => tileEq(t, { x: 3, y: 1 }))).toEqual([{ x: 2, y: 1 }, { x: 3, y: 1 }])
})
it('returns [] when already at the goal and null when unreachable', () => {
  expect(findPath(open, { x: 1, y: 1 }, t => tileEq(t, { x: 1, y: 1 }))).toEqual([])
  const split = parseLayout(['#####', '#.#.#', '#####'])
  expect(findPath(split, { x: 1, y: 1 }, t => tileEq(t, { x: 3, y: 1 }))).toBeNull()
})
it('goes around obstacles', () => {
  const g = parseLayout(['#####', '#.R.#', '#...#', '#####'])
  const p = findPath(g, { x: 1, y: 1 }, t => tileEq(t, { x: 3, y: 1 }))!
  expect(p).toHaveLength(4)
  expect(p.some(t => tileEq(t, { x: 2, y: 1 }))).toBe(false)
})
it('may end on a non-walkable goal such as a seat', () => {
  const g = parseLayout(['#####', '#..S#', '#####'])
  expect(findPath(g, { x: 1, y: 1 }, t => tileEq(t, { x: 3, y: 1 }))).toEqual([{ x: 2, y: 1 }, { x: 3, y: 1 }])
})
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL, modules not found.
- [ ] **Step 3: Implement `grid.ts`, `layout.ts`, `path.ts`.**
- [ ] **Step 4: Run `npm test`.** Expected: all PASS.
- [ ] **Step 5: Commit.** `git add src tests && git commit -m "Add spa grid layout and BFS pathfinding"`

---

### Task 3: Day clock, economy and the shampoo rules

**Files:**
- Create: `src/sim/clock.ts`, `src/sim/economy.ts`, `src/sim/shampoo.ts`
- Modify: `src/config.ts`
- Test: `tests/sim/clock.test.ts`, `tests/sim/economy.test.ts`, `tests/sim/shampoo.test.ts`

**Interfaces:**
- Produces, constants appended to `config.ts`:
  `DAY_START_MIN = 480`, `DAY_END_MIN = 1200`, `REAL_MS_PER_GAME_MIN = 35000 / 60`,
  `SHAMPOO_PRICE = 40000`, `TIP_RATE = { 1: 0, 2: 0.1, 3: 0.25 }`, `REVIEW_FOR_STARS = { 1: 3, 2: 4, 3: 5 }`, `ANGRY_REVIEW = 1`, `RATING_WINDOW = 20`,
  `SHAMPOO_TIME_LIMIT_MS = 25000`, `FOAM_SWIPES = 6`, `RINSE_HOLD_MS = 2500`, `DRY_SWIPES = 4`, `STAR3_MS = 15000`, `STAR2_MS = 22000`.
- `class DayClock { minutes: number; advance(realMs: number): void; get isClosed(): boolean; label(): string; reset(): void }`: starts at `DAY_START_MIN`, caps at `DAY_END_MIN`, `label()` is zero-padded `HH:MM` of the floored minute.
- `tipFor(price: number, stars: 1 | 2 | 3): number` (rounded), `reviewScore(stars: 1 | 2 | 3): number`, `rating(reviews: number[]): number | null` (mean of the last `RATING_WINDOW`, rounded to 1 decimal, `null` when empty), `arrivalIntervalMs(r: number | null): number` (= `clamp(40 - (r - 3) * 6, 25, 50)` seconds; `null` counts as 40 s).
- `type ShampooPhase = 'foam' | 'rinse' | 'dry' | 'done'`; `class ShampooGame { phase: ShampooPhase; elapsedMs: number; swipe(hairWidths: number, onHair: boolean): void; hold(ms: number, onHair: boolean): void; tick(ms: number): void; progress(): number; stars(): 1 | 2 | 3 | null }`. Swipe distances arrive pre-divided by the hair zone width. `swipe` counts only in `foam` and `dry`, `hold` only in `rinse`, and both only when `onHair`. Overflow does not carry into the next phase. `tick` past the time limit forces `done` with 1 star. Stars come from `elapsedMs` at completion: up to `STAR3_MS` gives 3, up to `STAR2_MS` gives 2, otherwise 1.

- [ ] **Step 1: Write failing tests**

```ts
// clock.test.ts
it('runs 8:00 to 20:00 at 35 real seconds per game hour', () => {
  const c = new DayClock()
  expect(c.label()).toBe('08:00')
  c.advance(35000); expect(c.label()).toBe('09:00')
  c.advance(35000 * 20); expect(c.minutes).toBe(1200); expect(c.isClosed).toBe(true); expect(c.label()).toBe('20:00')
  c.reset(); expect(c.label()).toBe('08:00'); expect(c.isClosed).toBe(false)
})
// economy.test.ts
it('computes tips and reviews from stars', () => {
  expect([tipFor(40000, 1), tipFor(40000, 2), tipFor(40000, 3)]).toEqual([0, 4000, 10000])
  expect([reviewScore(1), reviewScore(2), reviewScore(3)]).toEqual([3, 4, 5])
})
it('rates from the last 20 reviews', () => {
  expect(rating([])).toBeNull()
  expect(rating([5, 4])).toBe(4.5)
  expect(rating([...Array(5).fill(1), ...Array(20).fill(5)])).toBe(5)
  expect(rating([5, 4, 4])).toBe(4.3)
})
it('brings customers faster when the rating is higher', () => {
  expect(arrivalIntervalMs(null)).toBe(40000)
  expect(arrivalIntervalMs(5)).toBe(28000)
  expect(arrivalIntervalMs(1)).toBe(50000)
})
// shampoo.test.ts
const finishAt = (ms: number) => { const g = new ShampooGame(); g.tick(ms); g.swipe(6, true); g.hold(2500, true); g.swipe(4, true); return g }
it('goes foam -> rinse -> dry -> done, counting only touches on the hair', () => {
  const g = new ShampooGame()
  expect(g.phase).toBe('foam'); expect(g.stars()).toBeNull()
  g.swipe(10, false); expect(g.progress()).toBe(0)
  g.swipe(3, true); expect(g.progress()).toBeCloseTo(0.5)
  g.swipe(3, true); expect(g.phase).toBe('rinse'); expect(g.progress()).toBe(0)
  g.hold(1000, false); expect(g.progress()).toBe(0)
  g.hold(2500, true); expect(g.phase).toBe('dry')
  g.swipe(4, true); expect(g.phase).toBe('done')
})
it('awards stars by speed', () => {
  expect(finishAt(10000).stars()).toBe(3)
  expect(finishAt(18000).stars()).toBe(2)
  expect(finishAt(24000).stars()).toBe(1)
})
it('times out kindly with one star', () => {
  const g = new ShampooGame(); g.swipe(2, true); g.tick(25000)
  expect(g.phase).toBe('done'); expect(g.stars()).toBe(1)
  g.swipe(10, true); expect(g.phase).toBe('done')
})
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL, modules not found.
- [ ] **Step 3: Implement the three modules and constants.**
- [ ] **Step 4: Run `npm test`.** Expected: all PASS.
- [ ] **Step 5: Commit.** `git add src tests && git commit -m "Add day clock, economy rules and shampoo mini-game rules"`

---

### Task 4: SpaSim customer lifecycle and the day

**Files:**
- Create: `src/sim/spa.ts`
- Modify: `src/sim/types.ts`, `src/config.ts`
- Test: `tests/sim/spa-customers.test.ts`, `tests/sim/helpers.ts`

**Interfaces:**
- Consumes: `parseLayout`, `isWalkable`, `findPath`, `tileEq` (Task 2); `DayClock`, `rating`, `arrivalIntervalMs`, `reviewScore` (Task 3); `createRng`, `randomLook` (Task 1).
- Constants appended to `config.ts`: `STARTING_MONEY = 100000`, `FIRST_ARRIVAL_MS = 3000`, `ARRIVAL_JITTER = [0.6, 1.4]` (multiplier range, uniform), `PATIENCE_MS = 60000`, `CUSTOMER_SPEED = 2.5` and `OWNER_SPEED = 4` (tiles per second), `ARRIVE_MS = 1500`, `EXIT_MS = 1500`, `STEP_MS = 50`, `MAX_FRAME_MS = 250`, `OWNER_START = { x: 6, y: 5 }`.
- Types added to `types.ts`:

```ts
export type CustomerState = 'arriving' | 'toSeat' | 'waiting' | 'toStation' | 'inService' | 'leaving' | 'exiting'
export interface Vec { x: number; y: number }            // tile units, fractional while moving
export interface Customer { id: number; look: Look; state: CustomerState; stateMs: number; pos: Vec; facing: Facing; path: Tile[]; patienceMs: number; seat: Tile | null; stationId: number | null; mood: 'happy' | 'ok' | 'angry' | null }
export type OwnerTask = { kind: 'fetch'; customerId: number } | { kind: 'serve'; customerId: number; stationId: number }
export interface Owner { pos: Vec; facing: Facing; path: Tile[]; task: OwnerTask | null }
export interface Station { id: number; chair: Tile; work: Tile; customerId: number | null }
export interface Seat { tile: Tile; customerId: number | null }
export interface DayStats { served: number; angry: number; walkedAway: number; income: number; tips: number }
export type SimEvent =
  | { type: 'customerArrived'; id: number }
  | { type: 'noSeat'; id: number }
  | { type: 'customerLeft'; id: number; angry: boolean }
  | { type: 'serviceReady'; customerId: number; stationId: number }
  | { type: 'paid'; customerId: number; amount: number; tip: number; tile: Tile }
  | { type: 'review'; customerId: number; score: number }
  | { type: 'toast'; key: 'stationsBusy' }
  | { type: 'dayEnded'; stats: DayStats }
```

- `class SpaSim`, constructor `({ rng, layout = SPA_LAYOUT_1A, autoSpawn = true }: { rng: Rng; layout?: string[]; autoSpawn?: boolean })`. Public fields: `grid`, `owner`, `customers`, `stations` (one per chair, `work` = the tile directly below the chair), `seats`, `money`, `reviews`, `clock`, `day` (starts 1), `stats`, `paused`, `servingCustomerId: number | null`, `dayOver`. Methods:
  - `advance(ms: number): void` runs internal steps of `STEP_MS`.
  - `update(dtMs: number): void` = `advance(Math.min(dtMs, MAX_FRAME_MS))`.
  - `spawnCustomer(): Customer`
  - `ownerTile(): Tile` (rounded `pos`)
  - `rating(): number | null`
  - `drainEvents(): SimEvent[]`
  - `startDay(): void`
  - Task 5 adds `tapTile` and `completeService`.
- A step does nothing while `paused`, `dayOver` or `servingCustomerId !== null`. Otherwise it:
  1. Advances the clock.
  2. Auto-spawns while the shop is open (first arrival after `FIRST_ARRIVAL_MS`, then `arrivalIntervalMs(rating()) * jitter`).
  3. Moves entities along their paths at their speed. `facing` follows the movement direction.
  4. Runs the customer state machine.
  5. Ends the day when the clock is closed, no customers remain and nobody is being served. It then sets `dayOver` and emits `dayEnded` once.
- Customer state machine:
  1. `arriving` lasts `ARRIVE_MS` at the door.
  2. The customer reserves the first free seat and goes `toSeat`. With no free seat it emits `noSeat`, `stats.walkedAway++`, and starts `leaving`.
  3. On reaching the seat, `waiting`, during which `patienceMs` counts down from `PATIENCE_MS`.
  4. At 0 the customer frees the seat, gets `mood = 'angry'`, a review of `ANGRY_REVIEW`, `stats.angry++`, and starts `leaving`.
  5. `leaving` paths to the door, then `exiting` lasts `EXIT_MS`. Then the customer is removed and `customerLeft` is emitted (`angry` = `mood === 'angry'`).

- [ ] **Step 1: Write `tests/sim/helpers.ts`**

```ts
export function advanceUntil(sim: SpaSim, pred: () => boolean, maxMs = 120_000, sink?: SimEvent[]) {
  for (let t = 0; t <= maxMs; t += 100) {
    if (sink) sink.push(...sim.drainEvents())
    if (pred()) return
    sim.advance(100)
  }
  throw new Error('condition not reached')
}
```

- [ ] **Step 2: Write failing tests**

```ts
it('first customer arrives and sits on a free seat', () => {
  const sim = new SpaSim({ rng: createRng(1) })
  advanceUntil(sim, () => sim.customers[0]?.state === 'waiting')
  const c = sim.customers[0]
  expect(sim.grid.seats).toContainEqual(c.seat)
  expect(sim.seats.find(s => s.customerId === c.id)).toBeDefined()
})
it('a waiting customer runs out of patience and leaves angry with a 1-star review', () => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  const c = sim.spawnCustomer(); const ev: SimEvent[] = []
  advanceUntil(sim, () => !sim.customers.includes(c), 120_000, ev)
  expect(ev).toContainEqual({ type: 'review', customerId: c.id, score: 1 })
  expect(ev).toContainEqual({ type: 'customerLeft', id: c.id, angry: true })
  expect(sim.stats.angry).toBe(1); expect(sim.seats.every(s => s.customerId === null)).toBe(true)
})
it('walks away without a review when every seat is taken', () => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.seats.forEach(s => (s.customerId = 999))
  const c = sim.spawnCustomer(); const ev: SimEvent[] = []
  advanceUntil(sim, () => !sim.customers.includes(c), 30_000, ev)
  expect(ev).toContainEqual({ type: 'noSeat', id: c.id })
  expect(ev).toContainEqual({ type: 'customerLeft', id: c.id, angry: false })
  expect(ev.some(e => e.type === 'review')).toBe(false)
  expect(sim.stats.walkedAway).toBe(1)
})
it('stops spawning after closing time and ends the day once the shop is empty', () => {
  const sim = new SpaSim({ rng: createRng(3) }); const ev: SimEvent[] = []
  advanceUntil(sim, () => sim.dayOver, 900_000, ev)
  expect(sim.clock.isClosed).toBe(true); expect(sim.customers).toHaveLength(0)
  sim.advance(60_000); ev.push(...sim.drainEvents())
  expect(sim.customers).toHaveLength(0)
  expect(ev.filter(e => e.type === 'dayEnded')).toHaveLength(1)
})
it('does nothing while paused', () => {
  const sim = new SpaSim({ rng: createRng(1) }); sim.paused = true
  sim.advance(10_000); expect(sim.clock.minutes).toBe(480); expect(sim.customers).toHaveLength(0)
})
it('update clamps a huge frame delta', () => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.update(60_000)
  expect(sim.clock.minutes).toBeCloseTo(480 + 250 / REAL_MS_PER_GAME_MIN, 5)
})
it('startDay opens the next day with fresh stats and keeps the money', () => {
  const sim = new SpaSim({ rng: createRng(3) })
  advanceUntil(sim, () => sim.dayOver, 900_000)
  sim.money = 123_000; sim.startDay()
  expect(sim.day).toBe(2); expect(sim.dayOver).toBe(false); expect(sim.clock.label()).toBe('08:00')
  expect(sim.stats).toEqual({ served: 0, angry: 0, walkedAway: 0, income: 0, tips: 0 })
  expect(sim.money).toBe(123_000)
})
```

- [ ] **Step 3: Run `npm test`.** Expected: FAIL, `SpaSim` not found.
- [ ] **Step 4: Implement `SpaSim` as specified.**
- [ ] **Step 5: Run `npm test`.** Expected: all PASS.
- [ ] **Step 6: Commit.** `git add src tests && git commit -m "Add SpaSim customer lifecycle and day cycle"`

---

### Task 5: SpaSim owner and the service flow

**Files:**
- Modify: `src/sim/spa.ts`
- Test: `tests/sim/spa-owner.test.ts`

**Interfaces:**
- Consumes: everything from Task 4.
- Produces:
  - `SpaSim.tapTile(t: Tile): void`
  - `SpaSim.completeService(customerId: number, stars: 1 | 2 | 3): void`
- `tapTile` is ignored when `paused`, `dayOver`, `servingCustomerId !== null` or `owner.task?.kind === 'serve'`. Otherwise:
  - **A customer in state `waiting` sits on that tile:** `owner.task = { kind: 'fetch', customerId }`, and the owner paths to the nearest walkable tile with Manhattan distance 1 from the seat.
  - **The tile is walkable:** the task is cleared and the owner paths there.
  - **Anything else:** nothing happens.
- Fetch arrival:
  - If the customer is no longer `waiting`, drop the task.
  - If no station is free, emit `{ type: 'toast', key: 'stationsBusy' }` and drop the task.
  - Otherwise reserve the first free station. The customer frees the seat and goes `toStation` (path to the chair). The owner paths to the station's work tile, with task `serve`.
- Serve: when the customer has reached the chair and the owner the work tile, the customer goes `inService`, `servingCustomerId` is set, and `serviceReady` is emitted (time is then frozen per Task 4).
- `completeService` does the following:
  1. Pays `SHAMPOO_PRICE + tipFor(...)` into `money`, `stats.income`, `stats.tips`.
  2. Emits `paid` (with `tile` = the chair) and `review` (`reviewScore(stars)`).
  3. Sets `mood` to `'happy'` for 2–3 stars and `'ok'` for 1.
  4. Increments `stats.served`.
  5. Frees the station, clears `servingCustomerId` and the owner's task, and starts the customer `leaving`.

- [ ] **Step 1: Write failing tests**

```ts
const fresh = () => new SpaSim({ rng: createRng(1), autoSpawn: false })
const seatAndWait = (sim: SpaSim) => { const c = sim.spawnCustomer(); advanceUntil(sim, () => c.state === 'waiting'); return c }
const startService = (sim: SpaSim) => { const c = seatAndWait(sim); sim.tapTile(c.seat!); advanceUntil(sim, () => c.state === 'inService'); return c }

it('tapping a floor tile walks the owner there', () => {
  const sim = fresh(); sim.tapTile({ x: 2, y: 14 })
  advanceUntil(sim, () => tileEq(sim.ownerTile(), { x: 2, y: 14 }) && sim.owner.path.length === 0)
})
it('tapping a wall or furniture does nothing', () => {
  const sim = fresh(); sim.tapTile({ x: 0, y: 5 }); sim.tapTile({ x: 7, y: 7 })
  expect(sim.owner.path).toEqual([]); expect(sim.owner.task).toBeNull()
})
it('tapping a waiting customer brings them to a chair and freezes time for the mini-game', () => {
  const sim = fresh(); const ev: SimEvent[] = []
  const c = seatAndWait(sim); sim.tapTile(c.seat!)
  advanceUntil(sim, () => c.state === 'inService', 60_000, ev)
  expect(ev).toContainEqual({ type: 'serviceReady', customerId: c.id, stationId: 0 })
  expect(tileEq(sim.ownerTile(), sim.stations[0].work)).toBe(true)
  expect(sim.servingCustomerId).toBe(c.id)
  const m = sim.clock.minutes; const p = c.patienceMs; sim.advance(10_000)
  expect(sim.clock.minutes).toBe(m); expect(c.patienceMs).toBe(p)
})
it('completeService pays price plus tip, records a review and sends the customer home', () => {
  const sim = fresh(); const c = startService(sim); sim.drainEvents()
  const before = sim.money; sim.completeService(c.id, 3)
  expect(sim.money).toBe(before + 50_000)
  expect(sim.drainEvents()).toEqual(expect.arrayContaining([
    { type: 'paid', customerId: c.id, amount: 40_000, tip: 10_000, tile: sim.stations[0].chair },
    { type: 'review', customerId: c.id, score: 5 },
  ]))
  expect(sim.stats).toMatchObject({ served: 1, income: 40_000, tips: 10_000 })
  expect(sim.stations[0].customerId).toBeNull(); expect(sim.servingCustomerId).toBeNull()
  expect(c.state).toBe('leaving'); expect(c.mood).toBe('happy')
})
it('shows a toast when every chair is busy', () => {
  const sim = fresh(); sim.stations.forEach(s => (s.customerId = 999))
  const c = seatAndWait(sim); sim.tapTile(c.seat!); const ev: SimEvent[] = []
  advanceUntil(sim, () => ev.some(e => e.type === 'toast'), 30_000, ev)
  expect(ev).toContainEqual({ type: 'toast', key: 'stationsBusy' })
  expect(c.state).toBe('waiting'); expect(sim.owner.task).toBeNull()
})
it('ignores taps on customers who are not waiting', () => {
  const sim = fresh(); const c = sim.spawnCustomer()   // still 'arriving' at the door
  sim.tapTile(sim.grid.door)
  expect(sim.owner.task).toBeNull(); expect(c.state).toBe('arriving')
})
it('ignores taps while a service is pending or the day is over', () => {
  const sim = fresh(); const c = startService(sim)
  sim.tapTile({ x: 2, y: 14 }); expect(sim.owner.path).toEqual([])
  sim.completeService(c.id, 2); sim.dayOver = true
  sim.tapTile({ x: 2, y: 14 }); expect(sim.owner.path).toEqual([])
})
it('does not end the day while a customer is being served', () => {
  const sim = fresh(); const c = startService(sim)
  sim.clock.minutes = 1200; sim.advance(5_000); expect(sim.dayOver).toBe(false)
  sim.completeService(c.id, 1); advanceUntil(sim, () => sim.dayOver, 30_000)
  expect(sim.customers).toHaveLength(0)
})
```

- [ ] **Step 2: Run `npm test`.** Expected: the new tests FAIL (`tapTile` is not a function).
- [ ] **Step 3: Implement `tapTile`, fetch/serve progression and `completeService`.**
- [ ] **Step 4: Run `npm test`.** Expected: all PASS.
- [ ] **Step 5: Commit.** `git add src tests && git commit -m "Add owner tap-to-walk and shampoo service flow to SpaSim"`

---

### Task 6: Vector art and the room

**Files:**
- Create: `src/art/palette.ts`, `src/art/svg.ts`, `src/art/chibi.ts`, `src/art/room.ts`, `src/art/fx.ts`, `src/art/shampooArt.ts`, `src/view/RoomView.ts`, `src/scenes/BootScene.ts`
- Modify: `src/main.ts` (scenes `[BootScene, SpaScene]`; `SpaScene` is a stub that draws `RoomView` until Task 7)

**Interfaces:**
- Produces:
  - **Loader:** `loadSvgTextures(scene: Phaser.Scene, defs: Record<string, string>): Promise<void>`. It adds each SVG as a texture through a `data:image/svg+xml;charset=utf-8,` URI (`encodeURIComponent`, not `btoa`) and resolves when all are added. Every SVG string carries explicit `width`/`height` in canvas pixels.
  - **Texture keys:**
    - Room: `room` (the whole floor plus back wall, side walls and the street strip below the door, sized `13*TILE` × `18*TILE + 2*TILE`).
    - Furniture: `chair-shampoo`, `seat`, `desk`, `plant`.
    - Character parts: `head`, `body`, `leg`, `arm`, `hair{0|1}-{down|up|side}`, `face-down`, `face-side`.
    - Effects: `coin`, `bubble-happy`, `bubble-ok`, `bubble-angry`, `ripple`, `star`, `star-empty`.
    - Mini-game: `sh-basin`, `sh-head`, `sh-hair`, `sh-foam`, `sh-drop`, `sh-towel`, `sh-shower`.
  - **Part textures for tinting:** `head`, `body`, `leg`, `arm`, `hair*` and `sh-hair` are drawn in white and light greys so `setTint` colors them. `face-*` keeps its own colors: dark eyes and pink blush.
  - **Palettes** in `palette.ts`, picked by `Look` indices: `SKIN = [0xffe2cc, 0xf5cfae, 0xe0b08a]`, `HAIR = [0x3b2a22, 0x5b3b2a, 0x7a4a2f, 0x2f2a2a, 0xc98b5a]`, `SHIRT = [0xf4a6b8, 0xf6c87a, 0xc9b6e4, 0x9fd8c7, 0x8fc1e8]`, `OWNER_COLORS = { skin: 0xffe2cc, hair: 0x2f2a2a, hairStyle: 0, shirt: 0x5fb3a1 }`, `PANTS = 0x6d5a50`, and `lookColors(look: Look): { skin: number; hair: number; hairStyle: number; shirt: number }` mapping indices to these colors.
  - **Room view:** `class RoomView { constructor(scene: Phaser.Scene, grid: Grid); tileToWorld(t: Vec): { x: number; y: number } /* bottom-centre of tile */; worldToTile(x: number, y: number): Tile }`. It draws `room` at depth 0. It places furniture sprites from `grid.chairs/seats/desks/plants` with `depth = world y of the tile bottom`. `desk` spans the 3 desk tiles and is placed once.
- Style rules (spec section 7, mockup option B):
  - Slanted top-down view: the back wall shows its face (2 tile rows, windows and a clock), the floor has horizontal planks, and rugs sit under the chair zone (lavender) and the sofa zone (cream).
  - Characters are about `1.1*TILE` tall, chibi with a big head.
  - No outlines darker than the fill's own shade. Rounded corners everywhere.

- [ ] **Step 1: Implement palette, loader and all SVG modules.**
- [ ] **Step 2: Implement `BootScene`.** It shows `t('loading')`, awaits `loadSvgTextures`, then starts `SpaScene`.
- [ ] **Step 3: Implement `RoomView` and the stub `SpaScene`.**
- [ ] **Step 4: Verify.**
  - `npm run build` exits 0 and `npm test` still passes.
  - With the dev server running, take an iPhone-size screenshot (Task 9 Step 2 commands). It shows the furnished room filling the width, with no missing-texture boxes.
  - `$B console --errors` reports none.
  - Read the screenshot and compare its look against `.superpowers/brainstorm/1251-1792908216/content/perspective.html` option B.
- [ ] **Step 5: Commit.** `git add src && git commit -m "Add vector art textures and room rendering"`

---

### Task 7: Living characters, taps and HUD

**Files:**
- Create: `src/view/CharacterView.ts`, `src/view/Hud.ts`, `src/scenes/SpaScene.ts` (replace stub)

**Interfaces:**
- Consumes:
  - From Task 4/5: `SpaSim` and its events.
  - From Task 6: `RoomView` and the texture keys.
  - From Task 1: `t`, `formatMoney`.
- Produces:
  - **Character:** `class CharacterView { constructor(scene: Phaser.Scene, colors: { skin: number; hair: number; hairStyle: number; shirt: number }); setFacing(f: Facing): void; setPose(p: 'stand' | 'walk' | 'sit'): void; update(dtMs: number): void; container: Phaser.GameObjects.Container }`.
  - **Scene:** `SpaScene` exposes `sim: SpaSim`. In dev it sets `(window as any).__spa.sim = this.sim` and `(window as any).__spa.spa = this`.
  - **Mini-game launch:** it launches `ShampooScene` with `{ look: Look; onDone: (stars: 1 | 2 | 3) => void }` (built in Task 8; until then `serviceReady` immediately calls `completeService(id, 2)` so the loop is playable).
  - **Summary launch:** it launches `SummaryScene` with `{ sim: SpaSim; onNewDay: () => void }` (built in Task 9; until then `dayEnded` calls `sim.startDay()` directly).
- Character animation, drawn every frame from `update(dtMs)`, no frame-by-frame images:
  - **Walk:** legs swing ±25° in opposite phase at 8 Hz, the body bobs 3 px, arms swing.
  - **Stand:** the torso breathes with a slow 1.5% scaleY.
  - **Sit:** legs hidden, the body lowered 12 px.
  - **Facing:** `left` uses the `side` textures flipped; `up` hides the face.
- `SpaScene` each frame:
  1. Calls `sim.update(delta)`.
  2. Syncs one `CharacterView` per customer (created on `customerArrived`, destroyed on `customerLeft`) and the owner, at `RoomView.tileToWorld(pos)`, with `depth = y`.
  3. Customers in `arriving` and `exiting` are drawn along the street strip, moving from the street to the door and back, by `stateMs / ARRIVE_MS` (or `EXIT_MS`).
  4. The pose is `sit` for `waiting`/`inService`, `walk` while the path is non-empty, `stand` otherwise.
- Feedback visuals:
  - **Patience bar:** above each waiting customer, green `#7dcf8f` above 50%, yellow `#f5c242` above 25%, red `#e86a6a` below.
  - **Ripple:** a pulsing `ripple` on waiting customers while the owner has no task.
  - **On `paid`:** a `coin` plus the floating text `+formatMoney(amount + tip)` rises 60 px and fades over 1 s from the chair.
  - **On `review`:** a bubble over the customer, `bubble-happy` for 4–5, `bubble-ok` for 3, `bubble-angry` for 1, held while they leave.
  - **On `toast`:** a rounded toast with `t(key)`, near the bottom, for 2 s.
- `Hud`:
  - **Top bar (y 0–180):** money pill (`coin` + `formatMoney(sim.money)`), rating (`★` + `sim.rating()` or `t('noRating')`), and `t('dayLabel')` · `clock.label()` on the right.
  - **Pause button:** sets `sim.paused` and shows a dim overlay with `t('paused')` / `t('tapToResume')`.
  - **Bottom bar (y 1940–2160):** four round buttons with `t('navBuild')`, `t('navStaff')`, `t('navServices')`, `t('navQuests')`. Each shows the `comingSoon` toast.
  - **Hint:** `t('hintFirstCustomer')` is shown above the bottom bar until the first `serviceReady` ever.
- Input: `pointerup` on the map converts to a tile via `RoomView.worldToTile` and calls `sim.tapTile`. A drag longer than 20 px is not a tap. Taps on HUD elements stop there and do not reach the map.

- [ ] **Step 1: Implement `CharacterView`.**
- [ ] **Step 2: Implement `Hud`.**
- [ ] **Step 3: Implement `SpaScene` with the interim auto-complete for `serviceReady` and `dayEnded`.**
- [ ] **Step 4: Verify.**
  - `npm run build` exits 0 and `npm test` passes.
  - At iPhone size, run `$B js "window.__spa.sim.tapTile({x:2,y:14})"`, wait 300 ms, and take a screenshot. The owner is mid-walk with legs apart.
  - Run `$B js "window.__spa.sim.advance(12000)"` and take a screenshot. A customer sits on the sofa with a patience bar and a ripple.
  - Tap that customer via `$B js` with their seat tile, then run `advance(15000)`, and take a screenshot. A coin and amount float up, and money in the HUD increased.
  - `$B console --errors` reports none.
- [ ] **Step 5: Commit.** `git add src && git commit -m "Animate owner and customers, wire taps, HUD and feedback"`

---

### Task 8: Shampoo mini-game scene

**Files:**
- Create: `src/scenes/ShampooScene.ts`
- Modify: `src/main.ts` (register scene), `src/scenes/SpaScene.ts` (launch it on `serviceReady`, call `sim.completeService(id, stars)` in `onDone`)

**Interfaces:**
- Consumes: `ShampooGame` (Task 3); texture keys `sh-*`, `star`, `star-empty` and `lookColors` (Task 6); launch data `{ look, onDone }` (Task 7); strings `shampooFoam`, `shampooRinse`, `shampooDry`, `shampooDone`.
- Produces: in dev builds only, `ShampooScene.__finishForTest(stars: 1 | 2 | 3): void`, which skips straight to the star reveal so headless checks can finish a service.
- Layout (canvas units, over a 60% dark overlay on the frozen spa):
  - **Close-up:** a rounded card from y 260 to 1700, showing the reclined customer's head on `sh-basin`, seen from above. `sh-head` is tinted to skin and `sh-hair` to the customer's hair.
  - **Hair zone:** the hair's bounding ellipse, which defines `onHair` and the width used to normalize swipe distance.
  - **Instructions:** text for the current phase at the top of the card.
  - **Bars:** a phase progress bar (mint) under it, and a time bar (gold, shrinking over `SHAMPOO_TIME_LIMIT_MS`) at the card's bottom.
- Feel:
  - **Foam:** while dragging on the hair, `sh-foam` bubbles appear along the finger trail. They stay and grow in density with progress.
  - **Rinse:** `sh-shower` follows the held finger, `sh-drop` particles fall, and the foam fades with progress.
  - **Dry:** `sh-towel` follows the finger with a slight rotation wobble, and the remaining droplets fade.
  - **Done:** `t('shampooDone')` and 3 star slots fill one by one (`star` / `star-empty`) over 1.2 s. Then `onDone(stars)` and the scene stops.
- Input:
  - `pointermove` while down feeds `swipe(dist / hairZoneWidth, onHair)` in foam and dry.
  - `update` feeds `hold(delta, pointerIsDownOnHair)` in rinse and `tick(delta)` always.
  - `pointerup`, `pointerupoutside` and `gameout` all end a hold.

- [ ] **Step 1: Implement `ShampooScene` and wire it into `SpaScene`.**
- [ ] **Step 2: Verify.**
  - `npm run build` exits 0 and `npm test` passes.
  - At iPhone size, bring a customer into service via `$B js` (as in Task 7) and take a screenshot. The close-up card shows the foam instruction and full bars.
  - Run `$B js "window.__spa.game.scene.getScene('ShampooScene').__finishForTest(3)"` to simulate completion. Take a screenshot showing the stars, then the spa again with the coin pop.
  - Play it once by hand on an iPhone over Wi-Fi if the owner is available. Otherwise note in the hand-off that real-touch feel is unverified.
- [ ] **Step 3: Commit.** `git add src && git commit -m "Add hands-on shampoo mini-game"`

---

### Task 9: End-of-day summary, LAN play and final checks

**Files:**
- Create: `src/scenes/SummaryScene.ts`
- Modify: `src/main.ts`, `src/scenes/SpaScene.ts` (launch summary on `dayEnded`; `onNewDay` calls `sim.startDay()`)

**Interfaces:**
- Consumes: `SpaSim.stats`, `money`, `rating()`, `day`; strings `summaryTitle`, `served`, `leftUnhappy`, `income`, `tips`, `balance`, `rating`, `noRating`, `newDay`.
- Summary card over a dim overlay. It lists:
  - `t('summaryTitle', { day })`
  - `served`
  - `leftUnhappy` (= `angry + walkedAway`)
  - `income`
  - `tips`
  - `balance` (`formatMoney(money)`)
  - `rating`
  - A big mint button `t('newDay')`

  Numbers count up from 0 over 0.8 s. The button triggers `onNewDay` and stops the scene.

- [ ] **Step 1: Implement `SummaryScene` and wire it.**
- [ ] **Step 2: Verify at phone size with the gstack headless browser**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse.exe"
"$B" goto "http://localhost:5173/"
"$B" viewport 402x874
"$B" js "window.__spa.sim.advance(900000)"     # whole day passes unattended
"$B" screenshot "<scratchpad>/summary.png"      # summary card with day 1 numbers
"$B" console --errors                            # expect none
```
Read each screenshot. Then press the button through `$B js` (call the scene's `onNewDay`) and screenshot again: day 2 at 08:00 and money unchanged.
- [ ] **Step 3: Landscape check.** Run `"$B" viewport 874x402` and take a screenshot. The game is letterboxed in the centre, the HUD is fully visible, and nothing is stretched.
- [ ] **Step 4: Full checks.** `npm test` passes, and `npm run build` exits 0 with no TypeScript errors.
- [ ] **Step 5: LAN hand-off.** Start `npm run dev -- --port 5173 --strictPort` in the background and read the `Network:` URL from its output. Give that URL to the owner to open in Safari on the same Wi-Fi. Mention that Windows may ask once to allow Node.js through the firewall, and that they should allow it for private networks.
- [ ] **Step 6: Commit.** `git add src && git commit -m "Add end-of-day summary and complete step 1a loop"`
