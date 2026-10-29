import { describe, expect, it } from 'vitest'
import { NAILS_COAT_MS, NAILS_NAIL, NAILS_NEXT_MS, NAILS_SHAKE_MS } from '../../src/config'
import {
  NAILS_PATTERNS,
  NAILS_PATTERNS_HARD,
  NailsGame,
  inNail,
  nailGood,
  nailsBottleAt,
  nailsDots,
  nailsStars,
  type NailsPt,
} from '../../src/sim/nails'
import { createRng } from '../../src/sim/rng'

const listRng = (values: number[]) => {
  let i = 0
  return () => values[i++] ?? 0
}

/** Dot `i` in card pixels. */
const abs = (g: NailsGame, i: number): NailsPt => ({ x: NAILS_NAIL.x + g.dots[i].x, y: NAILS_NAIL.y + g.dots[i].y })

const dist = (a: NailsPt, b: NailsPt) => Math.hypot(b.x - a.x, b.y - a.y)

/** A normal game that picks the sample's bottle and ticks 16 ms frames to 'trace'. */
const traceReady = (values: number[]) => {
  const g = new NailsGame(listRng(values))
  g.pick(g.order.indexOf(g.colour))
  for (let n = 0; n < 100 && g.phase !== 'trace'; n++) g.tick(16)
  return g
}

/**
 * Plays in 16 ms frames, input then tick, as the sketch's autoplay. In 'pick', every `pickMs` it picks: the first
 * `wrong` times the first unfaded bottle of another colour, then the sample's. In 'trace', each new nail is routed
 * through its dots, with `smudge[i]` detours 150 px sideways and back; the finger goes `pxPerS` along it and lifts
 * at its end.
 */
const play = (g: NailsGame, { wrong = 0, pxPerS = 380, smudge = [] as number[], pickMs = 600 } = {}) => {
  let since = 0
  let picks = 0
  let cur = -1
  let route: NailsPt[] = []
  let pos = 0
  let pressed = false
  for (let n = 0; n < 5000 && g.phase !== 'done'; n++) {
    if (g.phase === 'pick') {
      since += 16
      if (since >= pickMs) {
        since = 0
        g.pick(picks < wrong ? g.order.findIndex((c, j) => c !== g.colour && !g.faded.includes(j)) : g.order.indexOf(g.colour))
        picks++
      }
    } else if (g.phase === 'trace') {
      if (g.nail !== cur) {
        cur = g.nail
        pos = 0
        g.up()
        pressed = false
        route = []
        const k = smudge[cur] ?? 0
        g.dots.forEach((_, i) => {
          const p = abs(g, i)
          route.push(p)
          for (let m = 1; m <= k; m++) {
            if (i === Math.floor((g.dots.length * m) / (k + 1))) route.push({ x: p.x + (p.x < NAILS_NAIL.x ? -150 : 150), y: p.y }, p)
          }
        })
      }
      pos += pxPerS * 0.016
      let s = pos
      let i = 0
      while (i < route.length - 1 && s > dist(route[i], route[i + 1])) {
        s -= dist(route[i], route[i + 1])
        i++
      }
      if (i >= route.length - 1) {
        const end = route[route.length - 1]
        g.move(end.x, end.y)
        g.up()
        pressed = false
      } else {
        const a = route[i]
        const b = route[i + 1]
        const k = s / (dist(a, b) || 1)
        const x = a.x + (b.x - a.x) * k
        const y = a.y + (b.y - a.y) * k
        if (pressed) g.move(x, y)
        else g.down(x, y)
        pressed = true
      }
    }
    g.tick(16)
  }
}

const SAMPLE = [0, 0, 0, 0.5, 0]
const STRIPES = [0, 0, 0, 0.5, 0.6]
const none = { lit: 0, smudge: false }

describe('NailsGame draw', () => {
  it('shuffles the bottles, then draws the colour and the pattern', () => {
    const g = new NailsGame(listRng(SAMPLE))
    expect(g.order).toEqual([1, 2, 3, 0])
    expect(g.colour).toBe(2)
    expect(g.order.indexOf(g.colour)).toBe(1)
    expect(g.pattern).toBe('dots')
    expect(g.dots).toHaveLength(9)
    expect(g.reach).toBe(50)
    expect(g.dotR).toBe(16)

    const s = new NailsGame(listRng(STRIPES))
    expect(s.pattern).toBe('stripes')
    expect(s.dots).toHaveLength(19)
  })

  it('draws the heart or the flower, finer, when hard', () => {
    const h = new NailsGame(listRng(SAMPLE), true)
    expect(h.pattern).toBe('heart')
    expect(h.dots).toHaveLength(17)
    expect(h.reach).toBe(34)
    expect(h.dotR).toBe(10)
    const f = new NailsGame(listRng(STRIPES), true)
    expect(f.pattern).toBe('flower')
    expect(f.dots).toHaveLength(22)
  })

  it('deals every bottle once, a pattern from the right list, and every dot on the nail', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const hard of [false, true]) {
        const g = new NailsGame(createRng(seed), hard)
        expect([...g.order].sort()).toEqual([0, 1, 2, 3])
        expect(hard ? NAILS_PATTERNS_HARD : NAILS_PATTERNS).toContain(g.pattern)
        g.dots.forEach((_, i) => expect(inNail(abs(g, i).x, abs(g, i).y)).toBe(true))
      }
    }
  })

  it('starts each pattern at its line start', () => {
    expect(nailsDots('dots', 46)[0]).toEqual({ x: 0, y: -122 })
    expect(nailsDots('stripes', 46)[0]).toEqual({ x: -70, y: -118 })
  })
})

describe('NailsGame edges', () => {
  it('holds the nail with 8 px of slack', () => {
    expect(inNail(668, 905)).toBe(true)
    expect(inNail(540, 732)).toBe(true)
    expect(inNail(540, 1063)).toBe(true)
    expect(inNail(669, 905)).toBe(false)
    expect(inNail(540, 731)).toBe(false)
    expect(inNail(540, 1064)).toBe(false)
  })

  it('finds the bottle whose box holds the tap', () => {
    expect(nailsBottleAt(225, 930)).toBe(0)
    expect(nailsBottleAt(950, 930)).toBe(3)
    expect(nailsBottleAt(951, 930)).toBeNull()
    expect(nailsBottleAt(435, 800)).toBe(1)
    expect(nailsBottleAt(435, 799)).toBeNull()
    expect(nailsBottleAt(330, 930)).toBeNull()
  })
})

describe('NailsGame pick', () => {
  it('fades a wrong bottle once and coats on the right one', () => {
    const g = new NailsGame(listRng(SAMPLE))
    expect(g.progress()).toBe(0)
    expect(g.pick(0)).toBe('wrong')
    expect(g.wrong).toBe(1)
    expect(g.faded).toEqual([0])
    expect(g.shakeMs).toBe(NAILS_SHAKE_MS)
    g.tick(300)
    expect(g.shakeMs).toBe(300)
    g.tick(300)
    expect(g.shakeMs).toBe(0)
    expect(g.pick(0)).toBeNull()
    expect(g.wrong).toBe(1)
    expect(g.pick(1)).toBe('right')
    expect(g.phase).toBe('coat')
    expect(g.progress()).toBe(0)
    g.tick(NAILS_COAT_MS - 1)
    expect(g.phase).toBe('coat')
    g.tick(1)
    expect(g.phase).toBe('trace')
  })

  it('picks nothing outside the pick', () => {
    const g = new NailsGame(listRng(SAMPLE))
    g.pick(1)
    expect(g.pick(1)).toBeNull() // coat
    g.tick(NAILS_COAT_MS)
    expect(g.pick(1)).toBeNull() // trace
    g.down(abs(g, 8).x, abs(g, 8).y)
    g.move(abs(g, 1).x, abs(g, 1).y)
    g.up()
    expect(g.phase).toBe('next')
    expect(g.pick(1)).toBeNull()
    expect(g.wrong).toBe(0)
  })

  it('ignores touches in the pick, the coat and the pause after a nail', () => {
    const g = new NailsGame(listRng(SAMPLE))
    const ignored = () => {
      const lit = [...g.lit]
      const { smudges } = g
      const p = abs(g, 0)
      expect(g.down(p.x, p.y)).toEqual(none)
      expect(g.move(400, 905)).toEqual(none)
      expect(g.move(p.x, p.y)).toEqual(none)
      expect(g.lit).toEqual(lit)
      expect(g.smudges).toBe(smudges)
    }
    ignored() // pick
    g.pick(1)
    ignored() // coat
    g.tick(NAILS_COAT_MS)
    g.down(540, 905)
    g.move(400, 905)
    g.down(abs(g, 8).x, abs(g, 8).y)
    g.move(abs(g, 1).x, abs(g, 1).y)
    g.up()
    expect(g.phase).toBe('next')
    expect(g.smudges).toBe(1)
    ignored()
  })
})

describe('NailsGame trace', () => {
  it('lights the dots along the stretch between two touches', () => {
    const g = traceReady(SAMPLE)
    const a = { x: 440, y: 783 }
    const b = { x: 640, y: 783 }
    g.dots.forEach((_, i) => {
      expect(dist(abs(g, i), a)).toBeGreaterThan(50)
      expect(dist(abs(g, i), b)).toBeGreaterThan(50)
    })
    expect(g.down(a.x, a.y)).toEqual(none)
    expect(g.move(b.x, b.y)).toEqual({ lit: 2, smudge: false })
    expect(g.lit.flatMap((on, i) => (on ? [i] : []))).toEqual([0, 1])
  })

  it('counts each slip past the edge as one smudge', () => {
    const g = traceReady(SAMPLE)
    g.down(540, 905)
    expect(g.move(668, 905).smudge).toBe(false)
    expect(g.move(669, 905).smudge).toBe(true)
    expect(g.outside).toBe(true)
    expect(g.move(540, 905).smudge).toBe(false)
    expect(g.outside).toBe(false)
    expect(g.move(400, 905).smudge).toBe(true)
    expect(g.smudges).toBe(2)
    expect(g.blobs).toEqual([{ x: 669, y: 905 }, { x: 400, y: 905 }])
    expect(g.outside).toBe(true)
    g.up()
    expect(g.outside).toBe(false)
  })

  it('does not smudge a stroke that starts outside and slides in', () => {
    const g = traceReady(SAMPLE)
    g.down(740, 905)
    expect(g.move(540, 905)).toEqual({ lit: 3, smudge: false })
    expect(g.smudges).toBe(0)
  })

  it('ends a nail once every dot is lit', () => {
    const g = traceReady(SAMPLE)
    g.down(abs(g, 0).x, abs(g, 0).y)
    for (let i = 1; i <= 7; i++) {
      expect(g.phase).toBe('trace')
      g.move(abs(g, i).x, abs(g, i).y)
    }
    expect(g.phase).toBe('next')
    expect(g.results).toEqual([true])
    expect(g.progress()).toBe(1 / 5)
  })

  it('keeps tracing after a lift while under 80% of the dots are lit, even with the last one', () => {
    const g = traceReady(SAMPLE)
    g.down(abs(g, 0).x, abs(g, 0).y)
    g.up()
    expect(g.phase).toBe('trace')

    const h = traceReady(SAMPLE)
    expect(h.down(abs(h, 8).x, abs(h, 8).y)).toEqual({ lit: 2, smudge: false })
    expect(h.lit.flatMap((on, i) => (on ? [i] : []))).toEqual([7, 8])
    expect(h.phase).toBe('trace')
    expect(h.progress()).toBeCloseTo(2 / 9 / 5)
    h.up()
    expect(h.phase).toBe('trace')
    expect(h.results).toEqual([])
  })

  it('does not end a closed pattern when its start ring also lights the last dot', () => {
    const g = new NailsGame(listRng(STRIPES), true)
    g.pick(g.order.indexOf(g.colour))
    g.tick(NAILS_COAT_MS)
    g.down(abs(g, 0).x, abs(g, 0).y)
    expect(g.lit[g.dots.length - 1]).toBe(true)
    for (let i = 1; i < g.dots.length / 3; i++) g.move(abs(g, i).x, abs(g, i).y)
    g.up()
    expect(g.phase).toBe('trace')
    expect(g.results).toEqual([])
  })

  it('ends a nail on lifting once the last dot and 80% of the dots are lit', () => {
    const g = traceReady(SAMPLE)
    g.down(abs(g, 8).x, abs(g, 8).y)
    g.move(abs(g, 1).x, abs(g, 1).y)
    expect(g.lit.filter(Boolean).length).toBeGreaterThanOrEqual(0.8 * g.dots.length)
    expect(g.lit.every(on => on)).toBe(false)
    g.up()
    expect(g.phase).toBe('next')
    expect(g.results).toEqual([true])
  })

  it('moves to a clean next nail after the pause', () => {
    const g = traceReady(SAMPLE)
    g.down(540, 905)
    g.move(400, 905)
    g.down(abs(g, 8).x, abs(g, 8).y)
    g.move(abs(g, 1).x, abs(g, 1).y)
    const lit = [...g.lit]
    g.up()
    expect(g.phase).toBe('next')
    g.tick(NAILS_NEXT_MS - 1)
    expect(g.phase).toBe('next')
    g.tick(1)
    expect(g.phase).toBe('trace')
    expect(g.nail).toBe(1)
    expect(g.lit.every(on => !on)).toBe(true)
    expect(g.smudges).toBe(0)
    expect(g.blobs).toEqual([])
    expect(g.litAll).toEqual([lit])
  })

  it('starts a fresh stroke when a finger still down crosses into the next nail', () => {
    const g = traceReady(SAMPLE)
    g.down(abs(g, 0).x, abs(g, 0).y)
    for (let i = 1; i <= 7; i++) g.move(abs(g, i).x, abs(g, i).y)
    expect(g.phase).toBe('next')
    g.tick(NAILS_NEXT_MS)
    expect(g.phase).toBe('trace')
    expect(g.move(300, 905)).toEqual(none)
    const after = g.move(540, 905)

    const fresh = traceReady(SAMPLE)
    fresh.down(300, 905)
    expect(after).toEqual(fresh.move(540, 905))
    expect(after.lit).toBeGreaterThan(0)
    expect(g.lit).toEqual(fresh.lit)
    expect(g.smudges).toBe(0)
  })
})

describe('NailsGame stars', () => {
  it('3 stars for the right colour and five good nails', () => {
    const g = new NailsGame(listRng(SAMPLE))
    play(g)
    expect(g.phase).toBe('done')
    expect(g.results).toEqual([true, true, true, true, true])
    expect(g.stars()).toBe(3)
    expect(g.progress()).toBe(1)
    expect(g.elapsedMs).toBeGreaterThanOrEqual(6_500)
    expect(g.elapsedMs).toBeLessThanOrEqual(8_000)

    const s = new NailsGame(listRng(STRIPES))
    play(s)
    expect(s.stars()).toBe(3)
    expect(s.elapsedMs).toBeGreaterThanOrEqual(12_000)
    expect(s.elapsedMs).toBeLessThanOrEqual(13_500)
  })

  it('3 stars with one smudge on every nail', () => {
    const g = new NailsGame(listRng(SAMPLE))
    play(g, { smudge: [1, 1, 1, 1, 1] })
    expect(g.results).toEqual([true, true, true, true, true])
    expect(g.stars()).toBe(3)
  })

  it('3 stars on the heart and the flower', () => {
    for (const values of [SAMPLE, STRIPES]) {
      const g = new NailsGame(listRng(values), true)
      play(g)
      expect(g.results).toEqual([true, true, true, true, true])
      expect(g.stars()).toBe(3)
    }
  })

  it('2 stars for one wrong pick', () => {
    const g = new NailsGame(listRng(SAMPLE))
    play(g, { wrong: 1 })
    expect(g.wrong).toBe(1)
    expect(g.results).toEqual([true, true, true, true, true])
    expect(g.stars()).toBe(2)
  })

  it('2 stars for two smudged nails', () => {
    const g = new NailsGame(listRng(SAMPLE))
    play(g, { smudge: [2, 2] })
    expect(g.results).toEqual([false, false, true, true, true])
    expect(g.stars()).toBe(2)
  })

  it('2 stars for one wrong pick and four good nails', () => {
    const g = new NailsGame(listRng(SAMPLE))
    play(g, { wrong: 1, smudge: [0, 0, 0, 0, 2] })
    expect(g.results).toEqual([true, true, true, true, false])
    expect(g.stars()).toBe(2)
  })

  it('2 stars when time runs out on the fourth nail, which does not count', () => {
    const g = new NailsGame(listRng(STRIPES))
    play(g, { pxPerS: 120 })
    expect(g.results).toEqual([true, true, true])
    expect(g.elapsedMs).toBe(25_000)
    expect(g.stars()).toBe(2)
  })

  it('1 star for three smudged nails, or two wrong picks', () => {
    const g = new NailsGame(listRng(SAMPLE))
    play(g, { smudge: [2, 2, 2] })
    expect(g.results).toEqual([false, false, false, true, true])
    expect(g.stars()).toBe(1)

    const h = new NailsGame(listRng(SAMPLE))
    play(h, { wrong: 2 })
    expect(h.wrong).toBe(2)
    expect(h.results).toEqual([true, true, true, true, true])
    expect(h.stars()).toBe(1)
  })

  it('1 star with no touches, at 25 seconds', () => {
    const g = new NailsGame(listRng(SAMPLE))
    g.tick(24_999)
    expect(g.phase).toBe('pick')
    expect(g.stars()).toBeNull()
    g.tick(1)
    expect(g.phase).toBe('done')
    expect(g.elapsedMs).toBe(25_000)
    expect(g.results).toEqual([])
    expect(g.stars()).toBe(1)
  })

  it('a slow thumb still gets 3 stars at 200 px/s and at least 2 at 130, on every seed', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const hard of [false, true]) {
        const g = new NailsGame(createRng(seed), hard)
        play(g, { pxPerS: 200 })
        expect(g.stars(), `seed ${seed} ${g.pattern} at 200`).toBe(3)
        const h = new NailsGame(createRng(seed), hard)
        play(h, { pxPerS: 130 })
        expect(h.stars(), `seed ${seed} ${h.pattern} at 130`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('nailsStars', () => {
    expect(nailsStars(0, 5)).toBe(3)
    expect(nailsStars(1, 5)).toBe(2)
    expect(nailsStars(0, 3)).toBe(2)
    expect(nailsStars(1, 4)).toBe(2)
    expect(nailsStars(1, 2)).toBe(1)
    expect(nailsStars(2, 5)).toBe(1)
  })

  it('nailGood', () => {
    expect(nailGood(8, 10, 1)).toBe(true)
    expect(nailGood(7, 10, 0)).toBe(false)
    expect(nailGood(10, 10, 2)).toBe(false)
  })

  it('does nothing once done', () => {
    const g = new NailsGame(listRng(SAMPLE))
    play(g)
    expect(g.phase).toBe('done')
    const state = () => [g.phase, g.phaseMs, g.elapsedMs, g.wrong, g.shakeMs, g.nail, [...g.lit], g.smudges, [...g.results]]
    const before = state()
    expect(g.pick(1)).toBeNull()
    expect(g.down(540, 905)).toEqual(none)
    expect(g.move(400, 905)).toEqual(none)
    g.up()
    g.tick(1000)
    expect(state()).toEqual(before)
  })
})
