import { describe, expect, it } from 'vitest'
import { createRng, randomLook } from '../../src/sim/rng'

describe('rng', () => {
  it('is deterministic per seed and in [0,1)', () => {
    const a = createRng(42)
    const b = createRng(42)
    const c = createRng(7)
    const xs = [a(), a(), a(), a(), a()]
    expect([b(), b(), b(), b(), b()]).toEqual(xs)
    expect(c()).not.toBe(xs[0])
    xs.forEach(x => {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    })
  })

  it('randomLook stays inside palette bounds', () => {
    const rng = createRng(1)
    for (let i = 0; i < 200; i++) {
      const l = randomLook(rng)
      expect(l.skin).toBeLessThan(3)
      expect(l.hair).toBeLessThan(5)
      expect(l.hairStyle).toBeLessThan(2)
      expect(l.shirt).toBeLessThan(5)
    }
  })
})
