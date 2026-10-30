import { describe, expect, it } from 'vitest'
import { floorOf, towerOf } from '../../src/sim/floors'
import { shellOf } from '../../src/sim/items'
import { SHOP_LAYOUT, SPA_LAYOUT_1A, widen } from '../../src/sim/layout'

describe('floors', () => {
  it('numbers floors from 1 by grid row', () => {
    expect([0, 17, 18, 53].map(floorOf)).toEqual([1, 1, 2, 3])
  })

  it('stacks three walled floors that repeat the stairs', () => {
    const tower = towerOf(shellOf(SHOP_LAYOUT))
    expect(tower).toHaveLength(54)
    expect(tower.every(r => r.length === 37)).toBe(true)
    expect(tower[25]).toBe('#'.repeat(12) + '#..........U#' + '#'.repeat(12))
    expect(tower[18]).toBe('#'.repeat(37))
    expect(tower[35]).toBe('#'.repeat(37))
  })

  it('widens the old shop to 37 columns, 12 walls either side', () => {
    const rows = widen(SPA_LAYOUT_1A)
    expect(rows.every(r => r.length === 37)).toBe(true)
    expect(rows[17]).toBe('#'.repeat(12) + '######D######' + '#'.repeat(12))
    expect(rows[5].slice(12, 25)).toBe(SPA_LAYOUT_1A[5])
  })

  it('keeps the walls of the unbought columns on every floor', () => {
    const tower = towerOf(shellOf(SHOP_LAYOUT))
    expect(tower[25]).toBe('#'.repeat(12) + '#..........U#' + '#'.repeat(12))
    expect(tower[18 + 5].slice(0, 13)).toBe('#'.repeat(13))
  })

  it('leaves a shell without stairs alone and refuses stairs on a short one', () => {
    const flat = ['#####', '#...#', '##D##']
    expect(towerOf(flat)).toEqual(flat)
    expect(() => towerOf(['#####', '#.U.#', '#...#', '#...#', '#####'])).toThrow()
  })
})
