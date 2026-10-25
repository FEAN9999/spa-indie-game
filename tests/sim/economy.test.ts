import { describe, expect, it } from 'vitest'
import { arrivalIntervalMs, rating, reviewScore, tipFor } from '../../src/sim/economy'

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
    expect(arrivalIntervalMs(null)).toBe(40000)
    expect(arrivalIntervalMs(5)).toBe(28000)
    expect(arrivalIntervalMs(1)).toBe(50000)
  })
})
