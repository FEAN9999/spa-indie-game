import { describe, expect, it } from 'vitest'
import { arrivalGapMs, arrivalIntervalMs, beautyArrivalFactor, rating, reviewScore, tipFor } from '../../src/sim/economy'
import { createRng } from '../../src/sim/rng'

describe('economy', () => {
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
    expect(arrivalIntervalMs(null)).toBe(15000)
    expect(arrivalIntervalMs(5)).toBe(11000)
    expect(arrivalIntervalMs(1)).toBe(19000)
  })

  it('spaces customers at random around the average gap, never closer than 2 s or longer than 2.5 times the average', () => {
    expect(arrivalGapMs(15000, 1 - Math.exp(-1))).toBeCloseTo(15000)
    expect(arrivalGapMs(15000, 0)).toBe(2000)
    expect(arrivalGapMs(15000, 0.9999)).toBe(37500)
    const rng = createRng(1)
    const gaps = Array.from({ length: 500 }, () => arrivalGapMs(15000, rng()))
    expect(gaps.some(g => g < 5000)).toBe(true)
    expect(gaps.some(g => g > 30000)).toBe(true)
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
    expect(mean).toBeGreaterThan(12000)
    expect(mean).toBeLessThan(16000)
  })

  it('draws customers faster as the shop gets prettier, up to a quarter more', () => {
    expect([21, 51, 81, 200].map(beautyArrivalFactor)).toEqual([1, 0.9, 0.8, 0.8])
    expect(beautyArrivalFactor(0)).toBe(1)
  })
})
