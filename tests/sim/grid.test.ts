import { describe, expect, it } from 'vitest'
import { isWalkable, parseLayout } from '../../src/sim/grid'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'

describe('grid', () => {
  it('parses the 1a layout', () => {
    const g = parseLayout(SPA_LAYOUT_1A)
    expect([g.cols, g.rows]).toEqual([13, 18])
    expect(g.door).toEqual({ x: 6, y: 17 })
    expect(g.seats).toEqual([{ x: 2, y: 10 }, { x: 3, y: 10 }, { x: 4, y: 10 }])
    expect(g.chairs).toEqual([{ x: 3, y: 2 }, { x: 6, y: 2 }])
    expect(g.works).toEqual([{ x: 3, y: 3 }, { x: 6, y: 3 }])
  })

  it('knows what can be walked on', () => {
    const g = parseLayout(SPA_LAYOUT_1A)
    expect(isWalkable(g, { x: 5, y: 5 })).toBe(true) // floor
    expect(isWalkable(g, { x: 6, y: 17 })).toBe(true) // door
    expect(isWalkable(g, { x: 3, y: 3 })).toBe(true) // work
    expect(isWalkable(g, { x: 0, y: 5 })).toBe(false) // wall
    expect(isWalkable(g, { x: 7, y: 7 })).toBe(false) // desk
    expect(isWalkable(g, { x: 2, y: 10 })).toBe(false) // seat
    expect(isWalkable(g, { x: -1, y: 0 })).toBe(false) // out of bounds
  })

  it('rejects ragged layouts', () => {
    expect(() => parseLayout(['###', '##'])).toThrow('Layout rows must have equal length')
  })
})
