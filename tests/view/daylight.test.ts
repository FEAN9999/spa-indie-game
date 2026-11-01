import { describe, expect, it } from 'vitest'
import { daylight, litBands } from '../../src/view/daylight'

const at = (h: number, m = 0) => daylight(h * 60 + m)
const channels = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]
const brightness = (c: number) => channels(c).reduce((a, b) => a + b, 0)

describe('daylight', () => {
  it('leaves midday as it is, lamps off', () => {
    expect(at(12)).toEqual({ sky: 0xffffff, indoor: 0xffffff, rooftop: 0xffffff, lamps: 0 })
  })
  it('opens on a pale blue morning that is gone by 9:00', () => {
    const [r, , b] = channels(at(8).sky)
    expect(b).toBeGreaterThan(r)
    expect(at(8).indoor).toBe(at(8).sky)
    expect(at(9).sky).toBe(0xffffff)
  })
  it('warms the late afternoon', () => {
    const [r, g, b] = channels(at(17).sky)
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
  })
  it('is full night from 19:30, through closing: a dark blue street and warm lit rooms', () => {
    for (const d of [at(19, 30), at(20), daylight(1300)]) expect(d).toMatchObject({ sky: 0x4a5688, indoor: 0xfff0dc, lamps: 1 })
  })
  it('lights a rooftop at night halfway between the street and a lit room', () => {
    const d = at(20)
    expect(brightness(d.rooftop)).toBeGreaterThan(brightness(d.sky))
    expect(brightness(d.rooftop)).toBeLessThan(brightness(d.indoor))
    expect(at(18, 15).rooftop).toBe(at(18, 15).sky)
  })
  it('lights the lamps between 18:30 and 19:00', () => {
    expect(at(18, 30).lamps).toBe(0)
    expect(at(18, 45).lamps).toBeCloseTo(0.5)
    expect(at(19).lamps).toBe(1)
  })
  it('keeps a room as dim as the street until its lamps light, then brighter than it', () => {
    expect(at(18, 15).indoor).toBe(at(18, 15).sky)
    expect(brightness(at(18, 45).indoor)).toBeGreaterThan(brightness(at(18, 45).sky))
  })
  it('never lightens the street from 16:00 to 20:00', () => {
    for (let m = 960; m < 1200; m++) expect(brightness(daylight(m + 1).sky)).toBeLessThanOrEqual(brightness(daylight(m).sky))
  })
})

describe('litBands', () => {
  it('leaves an unlit street whole', () => {
    expect(litBands([0, 100], [])).toEqual([{ from: 0, to: 100, lit: false }])
  })
  it('cuts the street where each lit span begins and ends, left to right', () => {
    expect(litBands([0, 100], [[60, 80], [10, 30]])).toEqual([
      { from: 0, to: 10, lit: false },
      { from: 10, to: 30, lit: true },
      { from: 30, to: 60, lit: false },
      { from: 60, to: 80, lit: true },
      { from: 80, to: 100, lit: false },
    ])
  })
  it('clips a lit span to the street and drops one outside it', () => {
    expect(litBands([0, 100], [[-20, 40], [90, 130], [150, 200]])).toEqual([
      { from: 0, to: 40, lit: true },
      { from: 40, to: 90, lit: false },
      { from: 90, to: 100, lit: true },
    ])
  })
  it('joins lit spans that touch or overlap', () => {
    expect(litBands([0, 100], [[10, 50], [50, 70], [60, 65]])).toEqual([
      { from: 0, to: 10, lit: false },
      { from: 10, to: 70, lit: true },
      { from: 70, to: 100, lit: false },
    ])
  })
})
