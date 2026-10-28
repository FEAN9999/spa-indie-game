import { describe, expect, it } from 'vitest'
import { FESTIVAL_IDS, FESTIVALS, festivalOf, festivalService } from '../../src/sim/festivals'
import { SERVICE_IDS } from '../../src/sim/services'

describe('festivals by month', () => {
  it('has a festival from day 8 in the months that have one', () => {
    for (const day of [1, 4, 7, 10, 46]) expect(festivalOf(day)).toBeNull()
    expect(festivalOf(8)).toBe('march8')
    expect(festivalOf(9)).toBe('march8')
    for (const day of [22, 23, 24]) expect(festivalOf(day)).toBe('midAutumn')
    expect(festivalOf(28)).toBe('october20')
    expect(festivalOf(34)).toBe('noel')
    expect(festivalOf(37)).toBe('tet')
    expect(festivalOf(39)).toBe('tet')
    expect(festivalOf(40)).toBe('valentine')
  })

  it('gives each of months 1, 2, 3, 8, 10 and 12 one festival', () => {
    expect(FESTIVAL_IDS.map(id => FESTIVALS[id].month).sort((a, b) => a - b)).toEqual([1, 2, 3, 8, 10, 12])
  })

  it('falls back to the nearest cheaper service the shop has', () => {
    expect(festivalService('october20', SERVICE_IDS)).toBe('mud')
    expect(festivalService('noel', ['shampoo', 'mask', 'massage', 'steam'])).toBe('steam')
    expect(festivalService('noel', ['shampoo'])).toBe('shampoo')
    expect(festivalService('tet', ['shampoo'])).toBe('shampoo')
  })
})
