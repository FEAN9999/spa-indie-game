import { describe, expect, it } from 'vitest'
import { STONE_LIMIT_MS, STONE_MAX_HEAT, STONE_POT, STONE_SPOTS } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { heatOf, StoneGame, stoneStars, type StoneHeat } from '../../src/sim/stone'

const scripted = (draws: number[]) => {
  let i = 0
  return () => draws[i++]
}

/** Lays one stone per grade from slot 0, waiting for each fresh stone to reach the wanted grade. */
const lay = (grades: StoneHeat[]) => {
  const g = new StoneGame(createRng(9))
  for (const want of grades) {
    while (heatOf(g.heats()[0]) !== want && g.phase === 'play' && want !== 'cold') g.tick(10)
    expect(heatOf(g.heats()[0])).toBe(want)
    g.tap(0)
  }
  return g
}

describe('heatOf', () => {
  it('grades cold below 0.55, good through 0.85, hot above', () => {
    expect(heatOf(0.549)).toBe('cold')
    expect(heatOf(0.55)).toBe('good')
    expect(heatOf(0.85)).toBe('good')
    expect(heatOf(0.851)).toBe('hot')
  })
})

describe('stoneStars', () => {
  it('maps score to stars', () => {
    expect(stoneStars(5)).toBe(3)
    expect(stoneStars(4)).toBe(2)
    expect(stoneStars(3)).toBe(2)
    expect(stoneStars(2)).toBe(1)
  })
})

describe('StoneGame', () => {
  it('starts with four stones heated 0 to 0.2', () => {
    const g = new StoneGame(createRng(1))
    expect(g.phase).toBe('play')
    expect(g.heats()).toHaveLength(STONE_POT)
    for (const h of g.heats()) {
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(0.2)
    }
  })

  it('draws each stone start heat then rate in slot order', () => {
    // start 0.5 -> 0.1, rate 0.5 -> 0.25 for slot 0; slot 1 start 1 -> 0.2
    const g = new StoneGame(scripted([0.5, 0.5, 1, 0, 0, 0, 0, 0]))
    expect(g.heats()[0]).toBeCloseTo(0.1)
    expect(g.heats()[1]).toBeCloseTo(0.2)
    g.tick(1000)
    expect(g.heats()[0]).toBeCloseTo(0.35)
    expect(g.heats()[1]).toBeCloseTo(0.2 + 0.2)
  })

  it('heats a stone cold, good, then hot, and never past the cap', () => {
    // start 0.1, rate 0 -> 0.2: heat = 0.1 + 0.2 t
    const g = new StoneGame(scripted([0.5, 0, 0, 0, 0, 0, 0, 0]))
    g.tick(2200)
    expect(heatOf(g.heats()[0])).toBe('cold')
    g.tick(100)
    expect(heatOf(g.heats()[0])).toBe('good')
    g.tick(1400)
    expect(heatOf(g.heats()[0])).toBe('good')
    g.tick(100)
    expect(heatOf(g.heats()[0])).toBe('hot')
    g.tick(STONE_LIMIT_MS)
    for (const h of g.heats()) expect(h).toBeLessThanOrEqual(STONE_MAX_HEAT)
    expect(g.heats()[0]).toBe(STONE_MAX_HEAT)
  })

  it('draws rates from 0.2-0.3, or 0.26-0.39 when hard', () => {
    const rates = (hard: boolean) => {
      const out: number[] = []
      for (let seed = 1; seed <= 25; seed++) {
        const g = new StoneGame(createRng(seed), hard)
        const before = g.heats()
        g.tick(1000)
        g.heats().forEach((h, i) => out.push(h - before[i]))
      }
      return out
    }
    const normal = rates(false)
    const hard = rates(true)
    expect(normal).toHaveLength(100)
    for (const r of normal) { expect(r).toBeGreaterThanOrEqual(0.2 - 1e-9); expect(r).toBeLessThanOrEqual(0.3 + 1e-9) }
    for (const r of hard) { expect(r).toBeGreaterThanOrEqual(0.26 - 1e-9); expect(r).toBeLessThanOrEqual(0.39 + 1e-9) }
  })

  it('lays a tapped stone with its grade and puts a fresh one in its slot', () => {
    const g = new StoneGame(createRng(2))
    g.tick(5000)
    const grade = heatOf(g.heats()[2])
    expect(g.tap(2)).toBe(grade)
    expect(g.placed).toEqual([grade])
    expect(g.heats()[2]).toBeLessThanOrEqual(0.2)
    expect(g.heats()).toHaveLength(STONE_POT)
  })

  it('ignores taps out of range and taps once done', () => {
    const g = new StoneGame(createRng(3))
    const heats = g.heats()
    expect(g.tap(4)).toBeNull()
    expect(g.tap(-1)).toBeNull()
    expect(g.placed).toEqual([])
    expect(g.heats()).toEqual(heats)
    g.tick(STONE_LIMIT_MS)
    expect(g.phase).toBe('done')
    const after = g.heats()
    expect(g.tap(0)).toBeNull()
    expect(g.placed).toEqual([])
    expect(g.heats()).toEqual(after)
  })

  it('ends the moment the sixth stone is laid', () => {
    const g = new StoneGame(createRng(4))
    for (let i = 0; i < STONE_SPOTS - 1; i++) g.tap(0)
    expect(g.phase).toBe('play')
    g.tap(0)
    expect(g.phase).toBe('done')
    expect(g.placed).toHaveLength(STONE_SPOTS)
  })

  it('ends when the time limit is reached and the clock stops there', () => {
    const g = new StoneGame(createRng(5))
    g.tick(STONE_LIMIT_MS - 1)
    expect(g.phase).toBe('play')
    g.tick(1)
    expect(g.phase).toBe('done')
    g.tick(1000)
    expect(g.elapsedMs).toBe(STONE_LIMIT_MS)
    const g2 = new StoneGame(createRng(5))
    g2.tick(STONE_LIMIT_MS * 2)
    expect(g2.elapsedMs).toBe(STONE_LIMIT_MS)
  })

  it('scores good minus hot and rates stars, null before done', () => {
    expect(new StoneGame(createRng(1)).stars()).toBeNull()
    const six = lay(['good', 'good', 'good', 'good', 'good', 'good'])
    expect(six.score()).toBe(6)
    expect(six.stars()).toBe(3)
    expect(lay(['good', 'good', 'good', 'good', 'good', 'cold']).stars()).toBe(3)
    const hot5 = lay(['good', 'good', 'good', 'good', 'good', 'hot'])
    expect(hot5.score()).toBe(4)
    expect(hot5.stars()).toBe(2)
    expect(lay(['good', 'good', 'good', 'cold', 'cold', 'cold']).stars()).toBe(2)
    const hot4 = lay(['good', 'good', 'good', 'good', 'hot', 'hot'])
    expect(hot4.score()).toBe(2)
    expect(hot4.stars()).toBe(1)
  })

  it('rates 1 star when time runs out with two good laid', () => {
    const g = lay(['good', 'good'])
    expect(g.stars()).toBeNull()
    g.tick(STONE_LIMIT_MS)
    expect(g.phase).toBe('done')
    expect(g.score()).toBe(2)
    expect(g.stars()).toBe(1)
  })
})
