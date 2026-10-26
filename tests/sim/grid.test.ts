import { describe, expect, it } from 'vitest'
import { bedSlotAt, isWalkable, onBed, parseLayout, tileRuns } from '../../src/sim/grid'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'

describe('grid', () => {
  it('parses the shop layout', () => {
    const g = parseLayout(SPA_LAYOUT_1A)
    expect([g.cols, g.rows]).toEqual([13, 18])
    expect(g.door).toEqual({ x: 6, y: 17 })
    expect(g.seats).toEqual([{ x: 2, y: 13 }, { x: 3, y: 13 }, { x: 4, y: 13 }])
    expect(g.beds).toEqual([{ x: 2, y: 3 }, { x: 4, y: 3 }])
    expect(g.works).toEqual([{ x: 3, y: 3 }, { x: 5, y: 3 }])
    expect(g.desks).toEqual([{ x: 8, y: 14 }, { x: 9, y: 14 }, { x: 10, y: 14 }])
    expect(g.bedSlots).toEqual([{ x: 6, y: 2 }, { x: 8, y: 2 }])
    expect(g.decor.screen).toHaveLength(10)
    expect(g.decor.cabinet).toEqual([{ x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 }])
    expect(g.decor.planter).toEqual([{ x: 2, y: 12 }, { x: 3, y: 12 }, { x: 4, y: 12 }])
    expect(g.decor.vase).toEqual([{ x: 11, y: 11 }])
  })

  it('knows what can be walked on', () => {
    const g = parseLayout(SPA_LAYOUT_1A)
    const walk = (x: number, y: number) => isWalkable(g, { x, y })
    expect([walk(5, 9), walk(6, 17), walk(3, 3), walk(6, 2), walk(6, 6)]).toEqual([true, true, true, true, true]) // floor, door, work, bed slot, screen opening
    expect([walk(0, 5), walk(2, 3), walk(2, 2), walk(2, 4), walk(5, 6), walk(8, 14), walk(2, 13), walk(3, 12), walk(-1, 0)]).toEqual(
      [false, false, false, false, false, false, false, false, false], // wall, bed, bed head, bed foot, screen, desk, seat, planter, out of bounds
    )
  })

  it('groups tiles into horizontal runs', () => {
    const tiles = [{ x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 4, y: 9 }]
    expect(tileRuns(tiles)).toEqual([{ left: 1, right: 3, row: 6 }, { left: 7, right: 8, row: 6 }, { left: 4, right: 4, row: 9 }])
  })

  it('treats a bed slot, its basin above and the two tiles below as the slot', () => {
    const g = parseLayout(SPA_LAYOUT_1A)
    const head = { x: 6, y: 2 }
    expect([0, 1, 2, 3, 4, 5].map(y => bedSlotAt(g, { x: 6, y }))).toEqual([undefined, head, head, head, head, undefined])
    expect(bedSlotAt(g, { x: 7, y: 3 })).toBeUndefined()
  })

  it('counts a position on a bed, or stepping on or off it, as on the bed', () => {
    const g = parseLayout(SPA_LAYOUT_1A)
    const on = (x: number, y: number) => onBed(g, { x, y })
    expect([on(2, 3), on(2.5, 3), on(1.5, 3), on(4, 3)]).toEqual([true, true, true, true]) // on bed 1, stepping to its work tile, from its left, on bed 2
    expect([on(1, 3), on(3, 3), on(2, 5), on(6, 3)]).toEqual([false, false, false, false]) // beside bed 1, its work tile, below it, a bed slot
  })

  it('rejects ragged layouts', () => {
    expect(() => parseLayout(['###', '##'])).toThrow('Layout rows must have equal length')
  })
})
