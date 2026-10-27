import { describe, expect, it } from 'vitest'
import { REAL_MS_PER_GAME_MIN, STAFF_REST_MS } from '../../src/config'
import { clockLabel, DayClock } from '../../src/sim/clock'

describe('DayClock', () => {
  it('runs 8:00 to 20:00 in 2 and a half real minutes, 12.5 real seconds per game hour', () => {
    const c = new DayClock()
    expect(c.label()).toBe('08:00')
    c.advance(12500)
    expect(c.label()).toBe('09:00')
    c.advance(12500 * 10)
    expect(c.label()).toBe('19:00')
    expect(c.isClosed).toBe(false)
    c.advance(12500)
    expect(c.minutes).toBe(1200)
    expect(c.isClosed).toBe(true)
    expect(c.label()).toBe('20:00')
    c.reset()
    expect(c.label()).toBe('08:00')
    expect(c.isClosed).toBe(false)
  })

  it('keeps a tea break at one game hour', () => expect(STAFF_REST_MS).toBe(60 * REAL_MS_PER_GAME_MIN))
})

describe('clockLabel', () => {
  it('gives HH:MM from the whole minute', () => {
    expect(clockLabel(905.7)).toBe('15:05')
    expect(clockLabel(480)).toBe('08:00')
  })
})
