import { describe, expect, it } from 'vitest'
import { floorOf, towerOf } from '../../src/sim/floors'
import { shellOf } from '../../src/sim/items'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'

describe('floors', () => {
  it('numbers floors from 1 by grid row', () => {
    expect([0, 17, 18, 53].map(floorOf)).toEqual([1, 1, 2, 3])
  })

  it('stacks three walled floors that repeat the stairs', () => {
    const tower = towerOf(shellOf(SPA_LAYOUT_1A))
    expect(tower).toHaveLength(54)
    expect(tower.every(r => r.length === 13)).toBe(true)
    expect(tower[25]).toBe('#..........U#')
    expect(tower[18]).toBe('#'.repeat(13))
    expect(tower[35]).toBe('#'.repeat(13))
  })

  it('leaves a shell without stairs alone and refuses stairs on a short one', () => {
    const flat = ['#####', '#...#', '##D##']
    expect(towerOf(flat)).toEqual(flat)
    expect(() => towerOf(['#####', '#.U.#', '#...#', '#...#', '#####'])).toThrow()
  })
})
