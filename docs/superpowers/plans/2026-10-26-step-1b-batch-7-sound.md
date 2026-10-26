# Step 1b Batch 7: Sound Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the spa background music and sound effects, all made in code: a slow pentatonic đàn tranh-like tune, a short end-of-day jingle, and nine effects. The pause screen gets two toggles, "Nhạc" and "Tiếng động", which the game remembers per device.

**Architecture:**
- **`src/audio/`** is a new Phaser-free layer on the Web Audio API, so it survives a later 3D remake of the view.
  - Pure parts are unit-tested: preferences, the event→sound map, notes and plucks, melody phrases, throttling.
  - Recipe and music functions take any `BaseAudioContext`, so they can also be rendered offline for checking.
  - One `SoundEngine` singleton owns the live `AudioContext`. It is created on the first touch, suspended while the page is hidden, and silent wherever Web Audio is missing.
- **Phaser's own audio is turned off.**
- **Scenes call the engine:**
  - `SpaScene` maps sim events through `cueFor`.
  - Buttons, mini-games, build mode and the summary card call `sound.play(...)` directly.

**Tech Stack:** TypeScript, Phaser ^4.2.1 (view only), Web Audio API, Vite ^8.3, Vitest (node environment). No new dependencies, no audio files.

**Spec:** `docs/superpowers/specs/2026-10-26-step-1b-batches-2-7-design.md` §11 (sound), §5 (sound made in code), §12 (checks, "Anh kiểm tra giúp … nghe nhạc, thử gạt nút im lặng"), §13 (the exact sounds are the builder's call, "miễn nhẹ nhàng, hợp không khí thư giãn").

## Global Constraints

- **Layering:**
  - `src/audio/**` never imports `phaser`, `src/scenes/**`, `src/view/**` or `src/art/**`.
  - It may import types from `src/sim/types.ts` and the `KeyValueStorage` type from `src/save/store.ts`.
  - `src/sim/**` never imports `src/audio/**`.
- **Generated in code only:** no audio files, no downloads, no `HTMLAudioElement` (it ignores the iPhone silent switch). Only Web Audio nodes and buffers filled in code.
- **Phaser audio off:** `audio: { noAudio: true }` in the `Phaser.Game` config, so Phaser never opens its own `AudioContext`.
- **First touch:** nothing is created or played before the first user gesture. The engine listens on `window` for `pointerdown`, `touchend`, `click` and `keydown`. In the handler it creates or resumes the context synchronously, and removes the listeners once `ctx.state === 'running'`.
- **Silent switch:**
  - Before creating the context, set `navigator.audioSession.type = 'ambient'` when `navigator.audioSession` exists (Safari 16.4+), inside try/catch. Ambient follows the iPhone silent switch and mixes with other apps' audio.
  - Declare the type locally: `(navigator as Navigator & { audioSession?: { type: string } })`.
- **No sound support, no crash:** a missing `AudioContext` or `webkitAudioContext`, or a constructor that throws, leaves the engine in state `'off'`. Every engine method is then a silent no-op, and the game plays on.
- **Hidden page:** on `visibilitychange`, when hidden, call `ctx.suspend()` and stop the water loop. When visible, call `ctx.resume()`, which also covers iOS's `'interrupted'` state after a call.
- **Preferences:**
  - localStorage key `'spa.sound'`, JSON `{ "music": boolean, "sfx": boolean }`, default `{ music: true, sfx: true }`.
  - A missing, corrupt or partial value falls back per field to `true`. Storage errors are swallowed.
  - The value is per device and never part of a save slot or save code.
- **Levels:**
  - master gain 0.8, music bus 0.35, sfx bus 0.7.
  - Toggling fades its bus over 0.3 s (`setTargetAtTime` with time constant 0.1).
  - Every recipe's own peak is ≤ 0.9 before the buses.
- **Scale (đàn tranh tuning "Hò Xự Xang Xê Cống"):** semitone offsets `[0, 2, 5, 7, 9]` from C4 = 261.63 Hz. Degree d means octave `floor(d/5)` and step `d mod 5`.
  - `noteFreq(0)` = 261.63
  - `noteFreq(1)` = 293.66
  - `noteFreq(2)` = 349.23
  - `noteFreq(5)` = 523.25
  - `noteFreq(-1)` = 220.00
- **Music:**
  - Generative and scheduled ahead, so there is no loop seam.
  - Eighth note 0.42 s. A phrase is 4 bars of 8 eighths (32 eighths).
  - Melody degrees stay within 0..9. The last note of a phrase is degree 0 or 5.
  - A soft pad crossfades under each phrase. Some notes get the đàn tranh "nhấn" bend: detune up 200 cents and back.
  - A soft echo runs on the music bus: feedback delay about 0.3 s, feedback ≤ 0.3, lowpassed.
- **Jingle:**
  - It plays when the summary card opens: the music bus fades out, then a pluck arpeggio up the scale (about 2 s) ends on a bent high note.
  - The music comes back when "Ngày mới" is tapped.
- **Effects:** `type Sfx = 'chime' | 'coin' | 'water' | 'foam' | 'star' | 'tap' | 'huff' | 'thud' | 'levelUp'`

  | Sfx | Where it plays | Throttle (min gap) |
  |---|---|---|
  | chime | wind chime, a customer arrives (`customerArrived`) | 500 ms |
  | coin | coins, a customer pays (`paid`) | 60 ms |
  | water | running water, held loop while rinsing in the shampoo game | (loop) |
  | foam | foam crackle, a foam bubble appears | 80 ms |
  | star | "ting", each star revealed; pitch rises with the star's index 0..2 | none |
  | tap | soft click, a button press | 50 ms |
  | huff | "hừ", an angry customer leaves (`customerLeft` with `angry`) | 300 ms |
  | thud | "cộp", furniture placed or a bed bought | 80 ms |
  | levelUp | cheerful arpeggio, a staff member levels up (`levelUp`) | 500 ms |

- **Strings:** add to `src/strings/vi.ts`:
  - `soundMusic: 'Nhạc'`
  - `soundSfx: 'Tiếng động'`
  - `soundOn: '{name}: bật'`
  - `soundOff: '{name}: tắt'`
- **Pause toggles:** a row of two buttons right under "Tiếp tục".
  - Each is 350 wide and 120 tall, 20 apart, centred, font 36.
  - A toggle that is on draws `primary` (teal); one that is off draws `plain`.
  - Tapping it flips the preference and redraws the menu.
  - Everything below the row moves down by `ROW_STEP` (144).
- **Style A:** cream cards with brown borders, buttons at least 120 px tall, all text from `t()`.
- **Keep the 2D panels simple:** the remake may replace the view. All sound logic lives in `src/audio/`; scenes only call it.

## Review Focus

1. **No Web Audio, or a blocked context** (Zalo's in-app browser, old iOS, a test runner):
   - The game must load and play silently, with no thrown errors.
   - Covered by Task 2's `engine.test.ts` 'off without AudioContext' and the Task 4 console check.
2. **Water left running:**
   - Finishing the rinse, the reveal interrupting it, closing the shampoo game mid-hold, and hiding the page must all stop the water.
   - Covered by Task 3's wiring (`sound.water(false)` on phase change and scene shutdown) and the Task 4 run-through item 4.
3. **Toggle memory:**
   - The choice survives a reload and a slot switch.
   - A corrupt `spa.sound` falls back to on.
   - Covered by Task 1's prefs tests and Task 4 items 6–7.
4. **Bursts:**
   - Six customers arriving at once, or fast foam swiping, must not stack into a loud wall.
   - Covered by Task 1's throttle tests and Task 4's offline peak check.
5. **Backgrounding the app** (switching apps or locking the phone): the music stops, and comes back on return. Covered by the Task 4 item 8 `visibilitychange` check.

---

## File Structure

| File | Role |
|---|---|
| `src/audio/prefs.ts` (new) | `SoundPrefs`, `loadPrefs`, `savePrefs` |
| `src/audio/cues.ts` (new) | `Sfx`, `SFX_THROTTLE_MS`, `cueFor(e: SimEvent)`, `Throttle` |
| `src/audio/notes.ts` (new) | `SCALE`, `noteFreq`, `pluckSamples`, `phrase` |
| `src/audio/sounds.ts` (new) | Web Audio recipes: `playSfx`, `startWater`, `playJingle` |
| `src/audio/music.ts` (new) | `MusicPlayer`: pad, melody, echo, scheduled ahead |
| `src/audio/engine.ts` (new) | `SoundEngine` and the `sound` singleton |
| `src/main.ts` | `noAudio`, first-touch listener, `__spa.audio` in DEV |
| `src/view/ui.ts`, `src/view/dom.ts`, `src/view/Hud.ts`, `src/view/miniGame.ts` | tap and star sounds |
| `src/scenes/SpaScene.ts`, `BuildScene.ts`, `ShampooScene.ts`, `SummaryScene.ts`, `PauseScene.ts` | cues, thud, foam/water, jingle, toggles |
| `src/strings/vi.ts` | four strings |
| `tests/audio/*.test.ts` (new) | pure-part tests |

---

### Task 1: Pure sound core: preferences, cues, notes and phrases

**Files:**
- Create: `src/audio/prefs.ts`, `src/audio/cues.ts`, `src/audio/notes.ts`
- Test: `tests/audio/prefs.test.ts`, `tests/audio/cues.test.ts`, `tests/audio/notes.test.ts`

**Interfaces:**
- Consumes: `SimEvent` (`src/sim/types.ts`), `KeyValueStorage` (`src/save/store.ts`), `createRng`/`Rng` (`src/sim/rng.ts`, tests only), `MemStorage` (`tests/save/memStorage.ts`).
- Produces:
  - `prefs.ts`:
    - `interface SoundPrefs { music: boolean; sfx: boolean }`
    - `const PREFS_KEY = 'spa.sound'`
    - `loadPrefs(storage: KeyValueStorage | null): SoundPrefs`
    - `savePrefs(storage: KeyValueStorage | null, prefs: SoundPrefs): void`
  - `cues.ts`:
    - `type Sfx` (the nine names) and `type OneShot = Exclude<Sfx, 'water'>`
    - `const SFX_THROTTLE_MS: Record<Sfx, number>`, with 0 for star and water
    - `cueFor(e: SimEvent): OneShot | null`
    - `class Throttle { allow(name: Sfx, nowMs: number): boolean }`
  - `notes.ts`:
    - `const SCALE = [0, 2, 5, 7, 9] as const`
    - `const C4 = 261.63`
    - `noteFreq(degree: number): number`
    - `pluckSamples(freq: number, sampleRate: number, seconds: number, rng: () => number): Float32Array`
    - `interface NoteEvent { eighth: number; degree: number; bend: boolean; velocity: number }`
    - `const PHRASE_EIGHTHS = 32`
    - `phrase(rng: () => number, startDegree: number): NoteEvent[]`

- [ ] **Step 1: Write the failing tests**

`tests/audio/prefs.test.ts`:
```ts
it('defaults to music and effects on', () => expect(loadPrefs(new MemStorage())).toEqual({ music: true, sfx: true }))
it('remembers both choices', () => {
  const s = new MemStorage()
  savePrefs(s, { music: false, sfx: true })
  expect(s.getItem(PREFS_KEY)).toBe('{"music":false,"sfx":true}')
  expect(loadPrefs(s)).toEqual({ music: false, sfx: true })
})
it('falls back to on for corrupt or partial values', () => {
  const s = new MemStorage()
  s.setItem(PREFS_KEY, '{not json')
  expect(loadPrefs(s)).toEqual({ music: true, sfx: true })
  s.setItem(PREFS_KEY, '{"music":false}')
  expect(loadPrefs(s)).toEqual({ music: false, sfx: true })
  s.setItem(PREFS_KEY, '{"music":"no","sfx":0}')
  expect(loadPrefs(s)).toEqual({ music: true, sfx: true })
})
it('survives storage that throws or is missing', () => {
  const bad = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') }, removeItem: () => {} }
  expect(loadPrefs(bad)).toEqual({ music: true, sfx: true })
  expect(() => savePrefs(bad, { music: false, sfx: false })).not.toThrow()
  expect(loadPrefs(null)).toEqual({ music: true, sfx: true })
})
```

`tests/audio/cues.test.ts`:
```ts
it('maps shop events to sounds', () => {
  expect(cueFor({ type: 'customerArrived', id: 1 })).toBe('chime')
  expect(cueFor({ type: 'paid', customerId: 1, amount: 50000, tip: 0, tile: { x: 1, y: 1 } })).toBe('coin')
  expect(cueFor({ type: 'customerLeft', id: 1, angry: true })).toBe('huff')
  expect(cueFor({ type: 'levelUp', staffId: 1, level: 2 })).toBe('levelUp')
})
it('stays quiet for a calm leave and other events', () => {
  expect(cueFor({ type: 'customerLeft', id: 1, angry: false })).toBeNull()
  expect(cueFor({ type: 'roomChanged' })).toBeNull()
  expect(cueFor({ type: 'stockLow', item: 'towel' })).toBeNull()
})
it('throttles each sound on its own', () => {
  const th = new Throttle()
  expect(th.allow('chime', 0)).toBe(true)
  expect(th.allow('chime', 499)).toBe(false)
  expect(th.allow('coin', 499)).toBe(true)
  expect(th.allow('chime', 500)).toBe(true)
  expect(th.allow('star', 500)).toBe(true)
  expect(th.allow('star', 500)).toBe(true)
})
it('six arrivals in one second make two chimes', () => {
  const th = new Throttle()
  expect([0, 100, 200, 300, 600, 700].filter(t => th.allow('chime', t)).length).toBe(2)
})
```
(Use the `Tile` shape that `src/sim/types.ts` defines for `paid.tile`.)

`tests/audio/notes.test.ts`:
```ts
it('tunes the scale to Hò Xự Xang Xê Cống from C4', () => {
  expect(noteFreq(0)).toBeCloseTo(261.63, 1)
  expect(noteFreq(1)).toBeCloseTo(293.66, 1)
  expect(noteFreq(2)).toBeCloseTo(349.23, 1)
  expect(noteFreq(5)).toBeCloseTo(523.25, 1)
  expect(noteFreq(-1)).toBeCloseTo(220.0, 1)
})
it('plucks a string that starts loud and dies away', () => {
  const s = pluckSamples(noteFreq(0), 44100, 2, createRng(1))
  expect(s.length).toBe(88200)
  const peak = (a: Float32Array) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  expect(peak(s)).toBeLessThanOrEqual(0.9)
  expect(peak(s)).toBeGreaterThan(0.5)
  expect(peak(s.subarray(79380))).toBeLessThan(peak(s.subarray(0, 8820)) * 0.2)
})
it('writes the same phrase for the same seed', () => {
  expect(phrase(createRng(7), 0)).toEqual(phrase(createRng(7), 0))
})
it('keeps every phrase singable and resolved', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const p = phrase(createRng(seed), seed % 5)
    expect(p.length).toBeGreaterThanOrEqual(10)
    expect(p.length).toBeLessThanOrEqual(24)
    p.forEach((n, i) => {
      expect(n.eighth).toBeGreaterThanOrEqual(0)
      expect(n.eighth).toBeLessThan(PHRASE_EIGHTHS)
      expect(n.degree).toBeGreaterThanOrEqual(0)
      expect(n.degree).toBeLessThanOrEqual(9)
      expect(n.velocity).toBeGreaterThan(0)
      expect(n.velocity).toBeLessThanOrEqual(1)
      if (i > 0) {
        expect(n.eighth).toBeGreaterThan(p[i - 1].eighth)
        expect(Math.abs(n.degree - p[i - 1].degree)).toBeLessThanOrEqual(3)
      }
    })
    expect([0, 5]).toContain(p[p.length - 1].degree)
  }
})
```

- [ ] **Step 2: Run `npx vitest run tests/audio`.** Expected: FAIL, the modules are missing.

- [ ] **Step 3: Implement the three modules**
  - `loadPrefs`: reads `PREFS_KEY` in try/catch and parses JSON. Each field keeps only a real boolean; anything else becomes `true`.
  - `savePrefs`: writes `JSON.stringify({ music, sfx })` in try/catch.
  - `Throttle`: a `Map<Sfx, number>` of last-allowed times. It allows a sound when its throttle is 0 or `nowMs - last >= SFX_THROTTLE_MS[name]`.
  - `pluckSamples` (Karplus–Strong):
    - Fill a delay line of `round(sampleRate / freq)` samples with noise from `rng` in −1..1.
    - Each step outputs the head and feeds back `0.996 × average of the two oldest samples`. Brighter strings may use a slightly lower factor.
    - Normalise the whole buffer so the peak is 0.85.
  - `phrase`:
    - A random walk from `startDegree`, mostly by step (±1) with occasional leaps (±2 or ±3), reflected inside 0..9.
    - About half of the 32 eighths carry a note. Notes on beats 0, 8, 16 and 24 are more likely.
    - About one note in six has `bend: true`.
    - Velocity is 0.5–0.9, with downbeats louder.
    - The last note lands on eighth 28–30 and is forced to the nearer of 0 and 5 within 3 steps of the previous note. If neither is within 3, add a passing note first.

- [ ] **Step 4: Run `npx vitest run tests/audio`.** Expected: PASS. Then run `npm test`: all pass.

- [ ] **Step 5: Commit**
```bash
git add src/audio/prefs.ts src/audio/cues.ts src/audio/notes.ts tests/audio/prefs.test.ts tests/audio/cues.test.ts tests/audio/notes.test.ts
git commit -m "Add the sound core: per-device music and effects choices, which shop events make which sound, and a đàn tranh scale with plucked strings and short tunes"
```

---

### Task 2: Web Audio engine, effect recipes and music

**Files:**
- Create: `src/audio/sounds.ts`, `src/audio/music.ts`, `src/audio/engine.ts`
- Modify: `src/main.ts`
- Test: `tests/audio/engine.test.ts`

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces:
  - `sounds.ts`:
    - `playSfx(ctx: BaseAudioContext, out: AudioNode, name: OneShot, at: number, step?: number): void`, where `step` (0..2) raises the star's pitch
    - `startWater(ctx: BaseAudioContext, out: AudioNode): () => void`, which returns a stop function that fades out over 0.15 s
    - `playJingle(ctx: BaseAudioContext, out: AudioNode, at: number, plucks: AudioBuffer[]): number`, which returns the jingle's end time
    - `makePlucks(ctx: BaseAudioContext, rng: () => number): AudioBuffer[]`, one 2.5 s buffer per degree 0..9 (indexed by degree)
  - `music.ts`:
    - `class MusicPlayer { constructor(ctx: BaseAudioContext, out: AudioNode, plucks: AudioBuffer[], rng: () => number); scheduleUntil(time: number): void; stop(at: number): void }`
    - `scheduleUntil` queues whole phrases (pad plus melody) until `time` is covered, carrying the last degree into the next `phrase` call.
  - `engine.ts`:
    - `type EngineState = 'locked' | 'running' | 'suspended' | 'off'`
    - `class SoundEngine`, with:
      - `constructor(getStorage: () => KeyValueStorage | null, makeContext?: () => AudioContext | null)`
      - `state: EngineState`, `prefs: SoundPrefs`
      - `listenForFirstTouch(target: EventTarget): void`, `unlock(): void`
      - `play(name: OneShot, step?: number): void`, `water(on: boolean): void`
      - `setMusic(on: boolean): void`, `setSfx(on: boolean): void`
      - `endOfDay(): void`, `startOfDay(): void`
      - `readonly played: (Sfx | 'jingle')[]`, the last 30 names actually played, for browser checks
      - `readonly waterOn: boolean`, `readonly dayOver: boolean`, for browser checks
    - `export const sound: SoundEngine`

- [ ] **Step 1: Write the failing engine test** (node has no `AudioContext`):
```ts
it('stays off and silent without Web Audio', () => {
  const s = new SoundEngine(() => new MemStorage(), () => null)
  expect(s.state).toBe('locked')
  s.unlock()
  expect(s.state).toBe('off')
  expect(() => { s.play('coin'); s.water(true); s.water(false); s.endOfDay(); s.startOfDay() }).not.toThrow()
  expect(s.played).toEqual([])
})
it('stays off when the context cannot be made', () => {
  const s = new SoundEngine(() => new MemStorage(), () => { throw new Error('blocked') })
  s.unlock()
  expect(s.state).toBe('off')
})
it('saves the toggles even with no sound', () => {
  const storage = new MemStorage()
  const s = new SoundEngine(() => storage, () => null)
  s.setMusic(false)
  s.setSfx(false)
  expect(loadPrefs(storage)).toEqual({ music: false, sfx: false })
  expect(new SoundEngine(() => storage, () => null).prefs).toEqual({ music: false, sfx: false })
})
it('the default singleton loads in node without touching localStorage', async () => {
  const { sound } = await import('../../src/audio/engine')
  expect(sound.state).toBe('locked')
})
```

- [ ] **Step 2: Run `npx vitest run tests/audio/engine.test.ts`.** Expected: FAIL, the module is missing.

- [ ] **Step 3: Implement `sounds.ts`.** Every recipe uses only oscillators, gains, biquad filters, buffer sources, and noise buffers made in code. Each ends by itself; there is no loop except water. The recipe sketches below are the builder's call within §13, "nhẹ nhàng":

  | Sfx | Recipe | Length |
  |---|---|---|
  | chime | 4–6 staggered strikes (40–160 ms apart) of high sines at inharmonic ratios (about 1, 2.76, 5.4) around 1.6–3 kHz, quick attack, 1.2–1.8 s exponential decay | ≤ 2 s |
  | coin | two quick triangle blips, about B5 then E6, the second longer | ≤ 0.35 s |
  | water | bandpassed white noise around 900–1600 Hz with a slow random wobble on the filter frequency | loops until stopped |
  | foam | 3–6 tiny highpassed noise ticks (5–15 ms each) in 120 ms at random gaps | ≤ 0.15 s |
  | star | sine plus a quiet octave above at about 1320 Hz × 2^(step×4/12), 0.6 s decay | ≤ 0.7 s |
  | tap | sine sweeping 700 → 350 Hz in 50 ms with a fast decay | ≤ 0.08 s |
  | huff | sawtooth around 140 → 95 Hz through a lowpass near 900 Hz plus breathy bandpassed noise, a short "hừm" | ≤ 0.4 s |
  | thud | sine 150 → 55 Hz in 120 ms plus a 15 ms lowpassed noise click | ≤ 0.25 s |
  | levelUp | four plucks up the scale (degrees 5, 6, 7, 10 sounded at `noteFreq`) 90 ms apart, plus a soft chime tail | ≤ 1.2 s |

  - `playJingle` plucks degrees 0..5 about 0.13 s apart, then sounds degree 5 and 7 together with a "nhấn" bend on 7. It returns the end time.
  - Plucks for degrees outside the buffers are made by `playbackRate` on the nearest buffer.

- [ ] **Step 4: Implement `music.ts`.**
  - `MusicPlayer` keeps `nextPhraseAt` and `lastDegree`. `scheduleUntil(t)` loops while `nextPhraseAt < t`.
  - For each phrase:
    - **Pad:** two triangle oscillators, a root and a fifth above it, through a lowpass at about 700 Hz. Gain 0.06, a 2 s attack and a 2.5 s release that overlaps the next phrase's pad. Roots cycle through C3, F3 and D3 (`noteFreq(-5)`, `noteFreq(-3)`, `noteFreq(-4)`).
    - **Melody:** each `NoteEvent` becomes a buffer source from `plucks[degree]` at `nextPhraseAt + eighth × 0.42`, with gain `velocity × 0.5`. A `bend` note ramps `detune` 0 → 200 cents over 0.12 s starting 0.08 s after onset, holds, and returns over 0.2 s.
    - Then `nextPhraseAt += 32 × 0.42 + rest`, where rest is 0 or 0.84 s.
  - The melody runs through a shared echo (`DelayNode` 0.3 s, feedback gain 0.25, lowpass 2.5 kHz) into `out`.
  - `stop(at)` stops the sources and oscillators scheduled after `at`, and fades the pad gains.

- [ ] **Step 5: Implement `engine.ts`.**
  - **Default context maker:** `new (window.AudioContext ?? window.webkitAudioContext)()`, or `null` when `typeof window === 'undefined'` or neither exists.
  - **`unlock()`:**
    - When `locked`: set `audioSession` ambient (Global Constraints). Make the context; on `null` or a throw, set `off`.
    - Build master → destination, music bus → master and sfx bus → master. Set bus gains from `prefs`. Make the plucks.
    - Start a `setInterval` of 250 ms that, while music is wanted, calls `music.scheduleUntil(ctx.currentTime + 1.5)`. Music is wanted when `prefs.music`, not `endOfDay`, and the state is running.
    - Install the `visibilitychange` handler.
    - Any state: if `ctx.state !== 'running'`, call `ctx.resume()`. Set `state` from `ctx.state` (`'interrupted'` counts as `'suspended'`).
  - **`listenForFirstTouch`:** adds the four listeners with `{ capture: true }`. Each calls `unlock()` and removes all four once the state is `running` or `off`.
  - **`play`:** returns unless `state === 'running'`, `prefs.sfx`, and `throttle.allow(name, performance.now())`. Then `playSfx(ctx, sfxBus, name, ctx.currentTime, step)` and push to `played` (keep 30).
  - **`water(on)`:**
    - It is idempotent: it starts only when no loop is running and the same checks pass, and stops when one is.
    - Turning `prefs.sfx` off or hiding the page stops it too.
  - **`setMusic` / `setSfx`:**
    - Update `prefs`, `savePrefs`, and fade the bus to its level or 0.
    - Turning music back on restarts scheduling from `ctx.currentTime + 0.1`. Any pending phrase is stopped first, so nothing doubles.
  - **`endOfDay`:** set the end-of-day flag, fade the music bus to 0 over about 0.6 s, and stop the player. The jingle is music, so it follows the music toggle: when `prefs.music` is on, `playJingle` runs through its own gain (0.35) into master, and `'jingle'` is pushed to `played`.
  - **`startOfDay`:** clear the end-of-day flag and restart the music as in `setMusic(true)` when `prefs.music`.
  - **The singleton:** `export const sound = new SoundEngine(() => (typeof localStorage === 'undefined' ? null : localStorage))`. Preferences are read lazily on first access, so importing in node never touches storage.

- [ ] **Step 6: Wire `src/main.ts`.**
  - Add `audio: { noAudio: true }` to the game config.
  - Call `sound.listenForFirstTouch(window)` before `start()`.
  - In DEV, set `(window as any).__spa = { game, audio: sound }`.

- [ ] **Step 7: Run `npx vitest run tests/audio` and `npm test`.** Expected: all pass. Then `npm run build`: OK.

- [ ] **Step 8: Browser check.** Use `npm run dev` and the gstack browse tool, in your own tab: back up and restore `localStorage`, and close your tab after. Check:
  - **Before any tap:** `__spa.audio.state === 'locked'`.
  - **After one canvas tap:** `'running'`.
  - **Offline render of every effect:** in the page, `const m = await import('/src/audio/sounds.ts')`. Render each `Sfx` except water into an `OfflineAudioContext(1, 3 × 44100, 44100)`. Render water for 1 s, started and stopped. Record the peak and RMS of each.
    - Every peak must be > 0.01 and ≤ 1.0. Every non-silent sound must end within its length in the table.
  - **Offline render of 30 s of music:** `MusicPlayer` with `scheduleUntil(30)`, plus the jingle on its own. Peak ≤ 1.0, RMS > 0.005, and no stretch of silence longer than 2 s inside the music.
  - Write the numbers into the report. No console errors.

- [ ] **Step 9: Commit**
```bash
git add src/audio/sounds.ts src/audio/music.ts src/audio/engine.ts src/main.ts tests/audio/engine.test.ts
git commit -m "Make the music and effects in code with Web Audio: a slow đàn tranh tune, a closing jingle and nine effects, silent until the first touch, following the iPhone silent switch, and quiet where sound is unavailable"
```

---

### Task 3: Hook the sounds into the game and add the pause toggles

**Files:**
- Modify:
  - view: `src/view/ui.ts`, `src/view/dom.ts`, `src/view/Hud.ts`, `src/view/miniGame.ts`
  - scenes: `src/scenes/SpaScene.ts`, `src/scenes/BuildScene.ts`, `src/scenes/ShampooScene.ts`, `src/scenes/SummaryScene.ts`, `src/scenes/PauseScene.ts`
  - strings: `src/strings/vi.ts`
- Test: none new. This is view wiring of tested parts; the browser check in Step 3 covers it.

**Interfaces:**
- Consumes: `sound` (`src/audio/engine.ts`), `cueFor` (`src/audio/cues.ts`).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Wire the effects.**
  - **tap:**
    - `addButton` wraps `onTap` as `() => { sound.play('tap'); onTap() }`.
    - `domButton`'s click handler plays `tap` first.
    - The Hud pause button and the nav plates play `tap` first, including locked plates that only toast.
    - SummaryScene's "Ngày mới" plays `tap`.
  - **SpaScene:**
    - At the top of `handle(e)`: `const cue = cueFor(e); if (cue) sound.play(cue)`.
    - In `dayEnded`, call nothing extra: the summary scene owns the jingle.
    - The quick-buy bed in `offerBed`: on success (no problem returned) play `thud`.
  - **BuildScene:** in `place()`, on success (the `else this.changed()` branch), play `thud` before `changed()`.
  - **miniGame.ts `revealStars`:** in each star's `delayedCall`, play `star` with step `i`.
  - **ShampooScene:**
    - Each new foam bubble pushed plays `foam`. The engine throttles it.
    - Each `update` calls `sound.water(this.phase === 'rinse' && held)`.
    - `enterPhase` and the scene's shutdown (`this.events.once(Phaser.Scenes.Events.SHUTDOWN, …)`) call `sound.water(false)`.
  - **SummaryScene:**
    - `create()` calls `sound.endOfDay()`.
    - The "Ngày mới" tap calls `sound.startOfDay()` before `onNewDay()`.

- [ ] **Step 2: Add the pause toggles.**
  - Add the four strings.
  - In `PauseScene.showMenu`, right after the resume button, add a row at `CARD_TOP + 450`: two `addButton`s 350×120 at x `MID ∓ 185`, font 36.
    - Labels: `t(on ? 'soundOn' : 'soundOff', { name: t('soundMusic') })` and the same with `soundSfx`.
    - Kind: `primary` when on, `plain` when off.
    - Taps call `sound.setMusic(!sound.prefs.music)` or `sound.setSfx(!sound.prefs.sfx)`, then `this.showMenu()`.
  - Move the "Ô lưu" heading and everything after it down by `ROW_STEP` (heading at `CARD_TOP + 579`, first slot at `CARD_TOP + 684`). The tallest card (with the install row) then ends at 2078, inside 2160.

- [ ] **Step 3: Browser check.** Use `npm run dev` and gstack browse, in your own tab, at viewport 402×874 with the iPhone UA so the install row shows. Back up and restore `localStorage`, and close your tab after.
  1. Screenshot the pause menu with both toggles on, and again with music off. Nothing overlaps, and the card ends above 2160 in canvas units.
  2. Tap the music toggle off, then reload: it is still off, and `localStorage['spa.sound']` is `{"music":false,"sfx":true}`.
  3. Load `/tests/fixtures/save-v5.json` into a slot and play. `__spa.audio.played` gains:
     - `tap` (a button)
     - `chime` (an arrival)
     - `coin` (a payment)
     - `foam`, then `star`
     During the rinse hold, the water loop is on; it turns off when the rinse ends.
  4. Place a piece in build mode: `thud`.
  5. Reach the summary: `__spa.audio.dayOver === true` and `played` ends with `'jingle'`. Tap "Ngày mới": `dayOver === false` and the music is scheduled again.

  Save the screenshots next to the report.

- [ ] **Step 4: Run `npm test` and `npm run build`.** Expected: all pass.

- [ ] **Step 5: Commit**
```bash
git add src/view/ui.ts src/view/dom.ts src/view/Hud.ts src/view/miniGame.ts src/scenes/SpaScene.ts src/scenes/BuildScene.ts src/scenes/ShampooScene.ts src/scenes/SummaryScene.ts src/scenes/PauseScene.ts src/strings/vi.ts
git commit -m "Play the sounds in the shop: a chime at the door, coins, foam and water at the basin, stars, buttons, a huff, a thud for furniture and a level-up tune, with music and effects toggles on the pause card"
```

---

### Task 4: Verify and ship

**Files:** none new. The controller does this, with one browser run-through subagent.

- [ ] **Step 1: Checks.** Run `npm test` (all pass) and `npm run build` (OK).
- [ ] **Step 2: Browser run-through** (sonnet subagent, own tab, back up and restore `localStorage`, iPhone viewport and UA):
  1. A fresh load: `state` stays `'locked'` until the first tap, with no console errors.
  2. After the first tap: `'running'`, and the music is scheduled (`played` stays empty until an effect).
  3. Play `save-v5.json` for one in-game hour: chime, coin, tap, foam, star and water each appear in `played`. Huff appears when a customer is let run out of patience.
  4. Stop the shampoo game mid-rinse, while holding, with `__spa.game.scene.stop('ShampooScene')`. Then `__spa.audio.waterOn === false`.
  5. Build mode place: thud. Staff level-up via the dev hook: levelUp.
  6. Toggle music and effects off: `played` stops growing, the buses go to 0, and `spa.sound` is saved.
  7. Reload, then switch slot: the toggles stay off. Set `spa.sound` to `'garbage'` and reload: both are back on.
  8. `document.dispatchEvent(new Event('visibilitychange'))` with `document.hidden` stubbed true: the context is suspended. Stub it false: resumed.
  9. Fixtures v1–v6 still open. No console errors.
- [ ] **Step 3: Ship.**
  - Preview on 4173. Check that `origin/master` has not moved.
  - Run `git checkout master && git merge --ff-only step-1b-sound && git push origin master`.
  - Watch Actions. Check `version.json` against the new HEAD, then do a live smoke check in your own tab: after a tap, `__spa` is absent in production, so check that there are no console errors and the pause toggles render.
- [ ] **Step 4: Ask anh to listen on the iPhone 17** (spec §12): the music, the effects, and the silent switch. If he does not like the sound, the spec's fallback is CC0 files, asking before each download.
