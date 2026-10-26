import { describe, expect, it } from 'vitest'
import { dayEase } from '../../src/sim/economy'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'

describe('easier first days', () => {
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
      // a middling draw, so the gap is neither the shortest nor the longest allowed
      const sim = new SpaSim({ rng: () => 0.5 })
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
})
