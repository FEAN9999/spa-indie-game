import { describe, expect, it } from 'vitest'
import { ACU_FILL_MS, ACU_FILL_MS_HARD, ACU_GAP_MS, ACU_GOOD, ACU_LIMIT_MS, ACU_LIT_MS, ACU_POINTS, ACU_POINTS_HARD } from '../../src/config'
import { acuBand, AcupressureGame, acuStars } from '../../src/sim/acupressure'
import { createRng } from '../../src/sim/rng'

/** Runs the pause until the next point lights. */
const toLit = (g: AcupressureGame) => {
  for (let i = 0; i < 1000 && g.phase === 'gap'; i++) g.tick(10)
}
/** Holds the lit point until the ring reaches `k`, then lets go. */
const holdTo = (g: AcupressureGame, k: number) => {
  toLit(g)
  g.press(g.current()!)
  for (let i = 0; i < 1000 && g.phase === 'held' && g.pressure < k; i++) g.tick(10)
  return g.release()
}

describe('the Bấm huyệt game', () => {
  it('lights every point once, in a shuffled order', () => {
    const g = new AcupressureGame(createRng(3))
    expect([...g.order].sort()).toEqual(Array.from({ length: ACU_POINTS }, (_, i) => i))
    const hard = new AcupressureGame(createRng(3), true)
    expect([...hard.order].sort((a, b) => a - b)).toEqual(Array.from({ length: ACU_POINTS_HARD }, (_, i) => i))
    const orders = new Set(Array.from({ length: 20 }, (_, s) => new AcupressureGame(createRng(s + 1)).order.join('')))
    expect(orders.size).toBeGreaterThan(10)
  })

  it('lights a point after the pause and holds only that one', () => {
    const g = new AcupressureGame(createRng(1))
    expect(g.current()).toBeNull()
    g.tick(ACU_GAP_MS - 1)
    expect(g.phase).toBe('gap')
    g.tick(1)
    expect(g.phase).toBe('lit')
    const lit = g.current()!
    expect(g.press((lit + 1) % ACU_POINTS)).toBe(false)
    expect(g.press(lit)).toBe(true)
    expect(g.phase).toBe('held')
    expect(g.press(lit)).toBe(false)
  })

  it('judges the ring on letting go: light below the band, good in it, hard above', () => {
    const g = new AcupressureGame(createRng(1))
    expect(holdTo(g, 0.2)).toBe('light')
    expect(holdTo(g, (ACU_GOOD.min + ACU_GOOD.max) / 2)).toBe('good')
    expect(holdTo(g, ACU_GOOD.max + 0.05)).toBe('hard')
    expect(g.results).toEqual(['light', 'good', 'hard'])
    expect(g.score()).toBe(0)
    expect(g.release()).toBeNull()
  })

  it('lets go by itself, painfully, when the ring is held full', () => {
    const g = new AcupressureGame(createRng(1))
    toLit(g)
    g.press(g.current()!)
    expect(g.tick(ACU_FILL_MS - 10)).toBeNull()
    expect(g.tick(20)).toBe('hard')
    expect(g.phase).toBe('gap')
  })

  it('fills faster for a picky customer, with a narrower band', () => {
    const g = new AcupressureGame(createRng(1), true)
    toLit(g)
    g.press(g.current()!)
    g.tick(ACU_FILL_MS_HARD / 2)
    expect(g.pressure).toBeCloseTo(0.5)
    expect(acuBand(true).max - acuBand(true).min).toBeLessThan(acuBand(false).max - acuBand(false).min)
  })

  it('misses a lit point not pressed in time', () => {
    const g = new AcupressureGame(createRng(1))
    toLit(g)
    expect(g.tick(ACU_LIT_MS - 1)).toBeNull()
    expect(g.tick(1)).toBe('miss')
    expect(g.results).toEqual(['miss'])
  })

  it('ends after the last point with its stars, and at the time limit with the rest missed', () => {
    const g = new AcupressureGame(createRng(2))
    for (let i = 0; i < ACU_POINTS; i++) {
      expect(g.stars()).toBeNull()
      holdTo(g, (ACU_GOOD.min + ACU_GOOD.max) / 2)
    }
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(3)
    expect(g.progress()).toBe(1)
    const late = new AcupressureGame(createRng(2))
    holdTo(late, 0.7)
    late.tick(ACU_LIMIT_MS)
    expect(late.phase).toBe('done')
    expect(late.results.filter(r => r === 'miss')).toHaveLength(ACU_POINTS - 1)
    expect(late.stars()).toBe(1)
  })

  it('gives 3 stars for one short of every point good, 2 for three short', () => {
    expect([acuStars(6, 6), acuStars(5, 6), acuStars(4, 6), acuStars(3, 6), acuStars(2, 6)]).toEqual([3, 3, 2, 2, 1])
  })

  it('gives a player who lets go late into the band (250 ms plain, 200 ms picky) at least 2 stars on every seed', () => {
    for (const hard of [false, true])
      for (let seed = 1; seed <= 30; seed++) {
        const g = new AcupressureGame(createRng(seed), hard)
        const late = hard ? 200 / ACU_FILL_MS_HARD : 250 / ACU_FILL_MS
        while (g.phase !== 'done') holdTo(g, acuBand(hard).min + late)
        expect(g.stars(), `seed ${seed} hard ${hard}`).toBeGreaterThanOrEqual(2)
      }
  })
})
