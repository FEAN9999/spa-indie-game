import { describe, expect, it } from 'vitest'
import { buildGrid, parseLayout } from '../../src/sim/grid'
import { DEFAULT_ITEMS, ITEMS, ITEM_KINDS, beautyOf, setProgress, shellOf, workTile } from '../../src/sim/items'
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
    expect(g.decor.screen).toEqual(old.decor.screen)
    expect(Object.values(g.decor).flat()).toEqual(g.decor.screen) // the old decor kinds are items now
  })

  it("puts a flipped bed's work tile on its left", () => {
    const bed = { kind: 'bed' as const, x: 6, y: 2, flip: true, id: 9 }
    expect(workTile(bed)).toEqual({ x: 5, y: 3 })
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), [bed])
    expect(g.cells[3][5]).toBe('work')
    expect(g.cells[3][6]).toBe('bed')
  })

  it('gives the mask and massage beds a work tile like a bed, and lists the beds together', () => {
    expect(workTile({ id: 9, kind: 'maskBed', x: 6, y: 2, flip: false })).toEqual({ x: 7, y: 3 })
    expect(workTile({ id: 9, kind: 'massageBed', x: 6, y: 2, flip: true })).toEqual({ x: 5, y: 3 })
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), [{ id: 9, kind: 'massageBed', x: 6, y: 2, flip: true }])
    expect([g.cells[3][6], g.cells[3][5], g.beds.length, g.works.length]).toEqual(['bed', 'work', 1, 1])
    expect(ITEM_KINDS.slice(0, 3)).toEqual(['bed', 'maskBed', 'massageBed'])
    expect(ITEMS.maskBed).toMatchObject({ w: 1, h: 3, price: 350000, beauty: 0, group: 'bed' })
    expect(ITEMS.massageBed).toMatchObject({ price: 450000, name: 'itemMassageBed' })
  })

  it("knows every kind's price, beauty and set", () => {
    expect(ITEMS.teaChest).toMatchObject({ price: 250000, beauty: 5, set: 'saigon' })
    expect(ITEMS.areca).toMatchObject({ price: 80000, beauty: 3, set: 'bamboo' })
    expect(ITEMS.bed).toMatchObject({ price: 300000, beauty: 0 })
    expect(ITEMS.bed.set).toBeUndefined()
    expect(ITEM_KINDS.filter(k => ITEMS[k].set === 'saigon')).toHaveLength(6)
    expect(ITEM_KINDS.filter(k => ITEMS[k].set === 'bamboo')).toHaveLength(6)
  })

  it('keeps three free gift-only decor pieces out of the sets', () => {
    expect(ITEM_KINDS.filter(k => ITEMS[k].giftOnly)).toEqual(['vyPainting', 'silkScreen', 'regularsBoard'])
    expect(ITEMS.vyPainting).toEqual({ w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemVyPainting' })
    expect(ITEMS.silkScreen).toEqual({ w: 2, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemSilkScreen' })
    expect(ITEMS.regularsBoard).toEqual({ w: 2, h: 1, price: 0, beauty: 6, group: 'decor', giftOnly: true, name: 'itemRegularsBoard' })
  })

  it('scores the default shop 21 with Sài Gòn xưa at 4 of 6', () => {
    expect(beautyOf(DEFAULT_ITEMS)).toBe(21)
    expect(setProgress(DEFAULT_ITEMS, 'saigon')).toBe(4)
    expect(setProgress(DEFAULT_ITEMS, 'bamboo')).toBe(0)
  })

  it('adds half again for a full set', () => {
    const items = [
      ...DEFAULT_ITEMS,
      { id: 100, kind: 'teaChest' as const, x: 0, y: 0, flip: false },
      { id: 101, kind: 'jar' as const, x: 0, y: 0, flip: false },
    ]
    expect(setProgress(items, 'saigon')).toBe(6)
    expect(beautyOf(items)).toBe(21 + 5 + 3 + (3 + 3 + 4 + 2 + 5 + 3) * 0.5)
    expect(beautyOf(items)).toBe(39)
  })
})
