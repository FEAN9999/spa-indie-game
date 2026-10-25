import { describe, expect, it } from 'vitest'
import { DayClock } from '../../src/sim/clock'

describe('DayClock', () => {
  it('runs 8:00 to 20:00 at 35 real seconds per game hour', () => {
    const c = new DayClock()
    expect(c.label()).toBe('08:00')
    c.advance(35000)
    expect(c.label()).toBe('09:00')
    c.advance(35000 * 20)
    expect(c.minutes).toBe(1200)
    expect(c.isClosed).toBe(true)
    expect(c.label()).toBe('20:00')
    c.reset()
    expect(c.label()).toBe('08:00')
    expect(c.isClosed).toBe(false)
  })
})
