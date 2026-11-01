import { describe, expect, it } from 'vitest'
import { CUPPING_CUPS, CUPPING_GOOD, CUPPING_LIMIT_MS, CUPPING_MARKS, CUPPING_MAX_RED, CUPPING_RATE } from '../../src/config'
import { CuppingGame, cupGradeOf, cuppingStars } from '../../src/sim/cupping'
import { createRng } from '../../src/sim/rng'

/** An rng that always gives `v`: every cup reddens at the same rate. */
const fixed = (v: number) => () => v

/** Ticks until the cup on `mark` reaches `red`. */
const until = (g: CuppingGame, mark: number, red: number) => {
  for (let i = 0; i < 10_000 && (g.redOf(mark) ?? Infinity) < red; i++) g.tick(10)
}

/**
 * A player who sets a cup on the first open mark `placeDelayMs` after the tray has one free, and lifts each cup
 * `liftDelayMs` after its red reaches `liftAt`.
 */
function play(seed: number, hard: boolean, opts: { liftAt: number; liftDelayMs: number; placeDelayMs: number }) {
  const g = new CuppingGame(createRng(seed), hard)
  const reached = new Map<number, number>()
  let freeFor = 0
  for (let t = 0; g.phase === 'play' && t < CUPPING_LIMIT_MS + 1000; t += 16) {
    g.tick(16)
    freeFor = g.free() > 0 ? freeFor + 16 : 0
    if (freeFor >= opts.placeDelayMs) {
      const mark = Array.from({ length: CUPPING_MARKS }, (_, i) => i).find(i => g.open(i))
      if (mark !== undefined && g.place(mark)) freeFor = 0
    }
    for (let m = 0; m < CUPPING_MARKS; m++) {
      const red = g.redOf(m)
      if (red === null || red < opts.liftAt) continue
      const since = (reached.get(m) ?? t) + 0
      reached.set(m, since)
      if (t - since >= opts.liftDelayMs) {
        g.lift(m)
        reached.delete(m)
      }
    }
  }
  return g
}

describe('Giác hơi grades', () => {
  it('grades a cup by its red: light below the band, good in it, dark above', () => {
    expect([0, CUPPING_GOOD.min - 0.01, CUPPING_GOOD.min, CUPPING_GOOD.max, CUPPING_GOOD.max + 0.01].map(cupGradeOf)).toEqual(['light', 'light', 'good', 'good', 'dark'])
  })

  it('gives 3 stars from 5 good cups less dark ones, 2 from 3, else 1', () => {
    expect([6, 5, 4, 3, 2, 0, -2].map(cuppingStars)).toEqual([3, 3, 2, 2, 1, 1, 1])
  })
})

describe('the Giác hơi game', () => {
  it('sets one cup per free mark, no more than the tray holds', () => {
    const g = new CuppingGame(fixed(0.5))
    expect(g.place(0)).toBe(true)
    expect(g.place(0)).toBe(false)
    expect(g.place(-1)).toBe(false)
    expect(g.place(CUPPING_MARKS)).toBe(false)
    expect(g.place(1.5)).toBe(false)
    for (let m = 1; m < CUPPING_CUPS; m++) expect(g.place(m)).toBe(true)
    expect(g.free()).toBe(0)
    expect(g.place(CUPPING_CUPS)).toBe(false)
  })

  it('lifts a cup with the grade of its red, frees the tray and never takes that mark again', () => {
    const g = new CuppingGame(fixed(0.5))
    expect(g.lift(0)).toBeNull()
    g.place(0)
    g.place(1)
    expect(g.lift(1)).toBe('light')
    until(g, 0, (CUPPING_GOOD.min + CUPPING_GOOD.max) / 2)
    expect(g.lift(0)).toBe('good')
    expect(g.free()).toBe(CUPPING_CUPS)
    expect(g.place(0)).toBe(false)
    expect(g.place(1)).toBe(false)
    expect(g.results.slice(0, 2)).toEqual(['good', 'light'])
    expect(g.score()).toBe(1)
    expect(g.progress()).toBeCloseTo(2 / CUPPING_MARKS)
  })

  it('reddens each cup at its own rate, drawn when it is set', () => {
    const g = new CuppingGame(createRng(3))
    g.place(0)
    g.tick(1000)
    g.place(1)
    g.tick(1000)
    const [a, b] = [g.redOf(0)!, g.redOf(1)!]
    expect(a).toBeGreaterThanOrEqual(2 * CUPPING_RATE.min - 1e-9)
    expect(b).toBeLessThanOrEqual(CUPPING_RATE.max + 1e-9)
    expect(g.redOf(2)).toBeNull()
  })

  it('takes a forgotten cup off by itself, dark, and tells which mark', () => {
    const g = new CuppingGame(fixed(0))
    g.place(2)
    const msToMax = (CUPPING_MAX_RED / CUPPING_RATE.min) * 1000
    expect(g.tick(msToMax - 20)).toEqual([])
    expect(g.tick(40)).toEqual([2])
    expect(g.results[2]).toBe('dark')
    expect(g.redOf(2)).toBeNull()
    expect(g.score()).toBe(-1)
  })

  it('lifts every cup still on as it is when time runs out, and ends', () => {
    const g = new CuppingGame(fixed(1))
    for (let i = 0; i < 40 && g.phase === 'play'; i++) {
      g.place(0)
      g.place(1)
      g.tick(100)
      g.lift(0)
      if (g.phase === 'play') g.tick(CUPPING_LIMIT_MS)
    }
    expect(g.phase).toBe('done')
    expect(g.elapsedMs).toBe(CUPPING_LIMIT_MS)
    expect(g.results.slice(0, 2)).toEqual(['light', 'dark'])
    expect(g.results.slice(2)).toEqual(Array(CUPPING_MARKS - 2).fill(null))
    expect(g.stars()).toBe(1)
    expect(g.tick(100)).toEqual([])
    expect(g.place(3)).toBe(false)
    expect(g.lift(1)).toBeNull()
  })

  it('ends when every mark has had its cup lifted, with no stars before', () => {
    const g = new CuppingGame(fixed(0.5))
    for (let m = 0; m < CUPPING_MARKS; m++) {
      expect(g.stars()).toBeNull()
      g.place(m)
      until(g, m, CUPPING_GOOD.min + 0.05)
      expect(g.lift(m)).toBe('good')
    }
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(3)
    expect(g.progress()).toBe(1)
  })

  it('gives a careful player 3 stars on every seed, plain and picky', () => {
    for (const hard of [false, true])
      for (let seed = 1; seed <= 50; seed++) {
        const g = play(seed, hard, { liftAt: (CUPPING_GOOD.min + CUPPING_GOOD.max) / 2, liftDelayMs: 0, placeDelayMs: 0 })
        expect(g.stars(), `seed ${seed} hard ${hard}`).toBe(3)
      }
  })

  it('still gives a slow player at least 2 stars, plain and picky', () => {
    for (const hard of [false, true])
      for (let seed = 1; seed <= 50; seed++) {
        const g = play(seed, hard, { liftAt: CUPPING_GOOD.min, liftDelayMs: 450, placeDelayMs: 600 })
        expect(g.stars(), `seed ${seed} hard ${hard}`).toBeGreaterThanOrEqual(2)
      }
  })
})
