import { describe, expect, it } from 'vitest'
import { buildGrid, parseLayout } from '../../src/sim/grid'
import { DEFAULT_ITEMS, ITEMS, ITEM_KINDS, shellOf, workTile } from '../../src/sim/items'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'

describe('items', () => {
  it('reads the furniture of the default shop', () => {
    expect(DEFAULT_ITEMS).toHaveLength(13)
    const at = (kind: string) => DEFAULT_ITEMS.filter(i => i.kind === kind).map(i => [i.id, i.x, i.y, i.flip])
    expect(at('bed')).toEqual([[1, 2, 2, false], [2, 4, 2, false]])
    expect(at('cabinet')).toEqual([[3, 9, 2, false]])
    expect(at('plant').map(p => [p[1], p[2]])).toEqual([[11, 5], [1, 16], [11, 16]])
    expect(at('shelf').map(p => [p[1], p[2]])).toEqual([[2, 7]])
    expect(at('lotus').map(p => [p[1], p[2]])).toEqual([[9, 7]])
    expect(at('vase').map(p => [p[1], p[2]])).toEqual([[11, 11]])
    expect(at('planter').map(p => [p[1], p[2]])).toEqual([[2, 12]])
    expect(at('bench').map(p => [p[1], p[2]])).toEqual([[2, 13]])
    expect(at('tea').map(p => [p[1], p[2]])).toEqual([[3, 15]])
    expect(at('slippers').map(p => [p[1], p[2]])).toEqual([[4, 16]])
    expect(DEFAULT_ITEMS.map(i => i.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
  })

  it('builds the same grid the old layout gave', () => {
    const old = parseLayout(SPA_LAYOUT_1A)
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), DEFAULT_ITEMS)
    expect(g.cells).toEqual(old.cells)
    expect(g.door).toEqual(old.door)
    expect(g.seats).toEqual(old.seats)
    expect(g.beds).toEqual(old.beds)
    expect(g.works).toEqual(old.works)
    expect(g.desks).toEqual(old.desks)
    expect(g.plants).toEqual(old.plants)
    expect(g.bedSlots).toEqual(old.bedSlots)
    expect(g.decor).toEqual(old.decor)
  })

  it("puts a flipped bed's work tile on its left", () => {
    const bed = { kind: 'bed' as const, x: 6, y: 2, flip: true, id: 9 }
    expect(workTile(bed)).toEqual({ x: 5, y: 3 })
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), [bed])
    expect(g.cells[3][5]).toBe('work')
    expect(g.cells[3][6]).toBe('bed')
  })

  it("knows every kind's price, beauty and set", () => {
    expect(ITEMS.teaChest).toMatchObject({ price: 250000, beauty: 5, set: 'saigon' })
    expect(ITEMS.areca).toMatchObject({ price: 80000, beauty: 3, set: 'bamboo' })
    expect(ITEMS.bed).toMatchObject({ price: 300000, beauty: 0 })
    expect(ITEMS.bed.set).toBeUndefined()
    expect(ITEM_KINDS.filter(k => ITEMS[k].set === 'saigon')).toHaveLength(6)
    expect(ITEM_KINDS.filter(k => ITEMS[k].set === 'bamboo')).toHaveLength(6)
  })
})
