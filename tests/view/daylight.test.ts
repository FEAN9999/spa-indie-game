import { describe, expect, it } from 'vitest'
import { daylight } from '../../src/view/daylight'

const at = (h: number, m = 0) => daylight(h * 60 + m)

describe('daylight', () => {
  it('leaves midday as it is, lamps off', () => {
    expect(at(12)).toMatchObject({ alpha: 0, lamps: 0 })
  })
  it('opens on a pale blue morning that is gone by 9:00', () => {
    expect(at(8)).toEqual({ color: 0x9fb8d8, alpha: 0.12, lamps: 0 })
    expect(at(9).alpha).toBe(0)
  })
  it('warms the late afternoon', () => {
    expect(at(17).color).toBe(0xf2a65a)
    expect(at(17).alpha).toBeCloseTo(0.14)
  })
  it('is full night from 19:30, through closing, with the lamps lit', () => {
    for (const d of [at(19, 30), at(20), daylight(1300)]) expect(d).toEqual({ color: 0x1e2440, alpha: 0.58, lamps: 1 })
  })
  it('lights the lamps between 18:30 and 19:00', () => {
    expect(at(18, 30).lamps).toBe(0)
    expect(at(18, 45).lamps).toBeCloseTo(0.5)
    expect(at(19).lamps).toBe(1)
  })
  it('never lightens from 16:00 to 20:00', () => {
    for (let m = 960; m < 1200; m++) expect(daylight(m + 1).alpha).toBeGreaterThanOrEqual(daylight(m).alpha)
  })
})
