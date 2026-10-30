import { describe, expect, it } from 'vitest'
import { floorOf, towerOf } from '../../src/sim/floors'
import { shellOf } from '../../src/sim/items'
import { SHOP_LAYOUT, SPA_LAYOUT_1A, widen, withHouses } from '../../src/sim/layout'

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

  it('opens the inner left house: its five columns and the old wall become floor, its outer wall stays', () => {
    const rows = withHouses(shellOf(SHOP_LAYOUT), { left: 1, right: 0 })
    expect(rows[5].slice(6, 13)).toBe('#......')
    expect(rows[0]).toBe(shellOf(SHOP_LAYOUT)[0])
    expect(rows[17]).toBe(shellOf(SHOP_LAYOUT)[17])
  })

  it('opens both right houses through to column 36', () => {
    const rows = withHouses(shellOf(SHOP_LAYOUT), { left: 0, right: 2 })
    expect(rows[9].slice(24, 37)).toBe('............#')
  })

  it('carries a bought house up to the floors above', () => {
    const tower = towerOf(withHouses(shellOf(SHOP_LAYOUT), { left: 2, right: 0 }))
    expect(tower[18 + 5].slice(0, 13)).toBe('#............')
  })

  it('leaves a shell with no houses alone, and refuses houses on a shell of another width', () => {
    const shell = shellOf(SHOP_LAYOUT)
    expect(withHouses(shell, { left: 0, right: 0 })).toEqual(shell)
    expect(() => withHouses(shellOf(SPA_LAYOUT_1A), { left: 1, right: 0 })).toThrow()
  })

  it('leaves a shell without stairs alone and refuses stairs on a short one', () => {
    const flat = ['#####', '#...#', '##D##']
    expect(towerOf(flat)).toEqual(flat)
    expect(() => towerOf(['#####', '#.U.#', '#...#', '#...#', '#####'])).toThrow()
  })
})
