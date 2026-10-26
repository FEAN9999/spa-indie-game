import { describe, expect, it } from 'vitest'
import { ShampooGame } from '../../src/sim/shampoo'

const finishAt = (ms: number, extraMs = 0) => {
  const g = new ShampooGame(extraMs)
  g.tick(ms)
  g.swipe(6, true)
  g.hold(2500, true)
  g.swipe(4, true)
  return g
}

describe('ShampooGame', () => {
  it('goes foam -> rinse -> dry -> done, counting only touches on the hair', () => {
    const g = new ShampooGame()
    expect(g.phase).toBe('foam')
    expect(g.stars()).toBeNull()
    g.swipe(10, false)
    expect(g.progress()).toBe(0)
    g.swipe(3, true)
    expect(g.progress()).toBeCloseTo(0.5)
    g.swipe(3, true)
    expect(g.phase).toBe('rinse')
    expect(g.progress()).toBe(0)
    g.hold(1000, false)
    expect(g.progress()).toBe(0)
    g.hold(2500, true)
    expect(g.phase).toBe('dry')
    g.swipe(4, true)
    expect(g.phase).toBe('done')
  })

  it('awards stars by speed', () => {
    expect(finishAt(10000).stars()).toBe(3)
    expect(finishAt(18000).stars()).toBe(2)
    expect(finishAt(24000).stars()).toBe(1)
  })

  it('times out kindly with one star', () => {
    const g = new ShampooGame()
    g.swipe(2, true)
    g.tick(25000)
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(1)
    g.swipe(10, true)
    expect(g.phase).toBe('done')
  })

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
})
