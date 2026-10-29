import { describe, expect, it } from 'vitest'
import { offFloor } from '../../src/sim/build'
import { bedSlotAt, besideSeat, buildGrid, isWalkable, onBed, parseLayout } from '../../src/sim/grid'
import { towerOf } from '../../src/sim/floors'
import { DEFAULT_ITEMS, shellOf, type Item } from '../../src/sim/items'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'

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

  it("lays out a steam tent: the customer's tile is the bed, the other three bed ends, and the work tile beside it", () => {
    const tent = { id: 20, kind: 'steamTent' as const, x: 8, y: 8, flip: false }
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), [tent])
    expect([g.cells[9][9], g.cells[8][8], g.cells[8][9], g.cells[9][8], g.cells[9][10]]).toEqual(['bed', 'bedEnd', 'bedEnd', 'bedEnd', 'work'])
    expect([g.beds, g.works]).toEqual([[{ x: 9, y: 9 }], [{ x: 10, y: 9 }]])
    const f = buildGrid(shellOf(SPA_LAYOUT_1A), [{ ...tent, flip: true }])
    expect([f.cells[9][8], f.cells[8][8], f.cells[8][9], f.cells[9][9], f.cells[9][7]]).toEqual(['bed', 'bedEnd', 'bedEnd', 'bedEnd', 'work'])
    expect([f.beds, f.works]).toEqual([[{ x: 8, y: 9 }], [{ x: 7, y: 9 }]])
  })

  it("lays out a mud tub: the customer's tile is the bed, the other five bed ends, and the work tile beside it", () => {
    const tub = { id: 20, kind: 'mudTub' as const, x: 8, y: 8, flip: false }
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), [tub])
    expect([g.cells[9][9], g.cells[8][8], g.cells[8][9], g.cells[9][8], g.cells[10][8], g.cells[10][9], g.cells[9][10]]).toEqual(['bed', 'bedEnd', 'bedEnd', 'bedEnd', 'bedEnd', 'bedEnd', 'work'])
    expect([g.beds, g.works]).toEqual([[{ x: 9, y: 9 }], [{ x: 10, y: 9 }]])
    const f = buildGrid(shellOf(SPA_LAYOUT_1A), [{ ...tub, flip: true }])
    expect([f.cells[9][8], f.cells[9][9], f.cells[9][7]]).toEqual(['bed', 'bedEnd', 'work'])
    expect([f.beds, f.works]).toEqual([[{ x: 8, y: 9 }], [{ x: 7, y: 9 }]])
  })

  it('lays out a stone bed like a massage bed', () => {
    const at = (kind: 'stoneBed' | 'massageBed') => buildGrid(shellOf(SPA_LAYOUT_1A), [{ id: 20, kind, x: 8, y: 8, flip: false }])
    expect(at('stoneBed')).toEqual(at('massageBed'))
  })

  it('refuses a mud tub whose work tile would be on the wall', () => {
    const shell = parseLayout(shellOf(SPA_LAYOUT_1A))
    expect(offFloor(shell, { id: 20, kind: 'mudTub', x: 10, y: 8, flip: false }, 1)).toBe(true)
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    expect(sim.canPlace('mudTub', 10, 8, false)).toBe('overlap')
    expect(sim.canPlace('mudTub', 8, 8, false)).toBeNull()
  })

  it('refuses a steam tent whose work tile would be on the wall', () => {
    const shell = parseLayout(shellOf(SPA_LAYOUT_1A))
    expect(offFloor(shell, { id: 20, kind: 'steamTent', x: 10, y: 8, flip: false }, 1)).toBe(true)
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    expect(sim.canPlace('steamTent', 10, 8, false)).toBe('overlap')
    expect(sim.canPlace('steamTent', 8, 8, false)).toBeNull()
  })

  it('rejects ragged layouts', () => {
    expect(() => parseLayout(['###', '##'])).toThrow('Layout rows must have equal length')
  })

  it('knows the floor one step from a seat', () => {
    const g = parseLayout(SPA_LAYOUT_1A)
    const seat = g.seats[1]
    const beside = besideSeat(g, seat)
    const around = [{ x: seat.x, y: seat.y + 1 }, { x: seat.x, y: seat.y - 1 }, { x: seat.x - 1, y: seat.y }, { x: seat.x + 1, y: seat.y }]
    for (const t of around) expect([t, isWalkable(g, t) && beside(t)]).toEqual([t, isWalkable(g, t)])
    expect(around.some(t => beside(t))).toBe(true)
    expect(beside(seat)).toBe(false)
    expect(beside({ x: seat.x, y: seat.y + 2 })).toBe(false)
    expect(beside({ x: 0, y: 0 })).toBe(false)
  })
})

describe('stepping onto a bed', () => {
  it('counts a customer as on a turned bed only from the half step in front of or behind it, and on a standing bed from its side', () => {
    const across: Item = { id: 30, kind: 'massageBed', x: 4, y: 9, flip: false, turned: true }
    const grid = buildGrid(shellOf(SPA_LAYOUT_1A), [...DEFAULT_ITEMS, across])
    expect([onBed(grid, { x: 5, y: 8.4 }), onBed(grid, { x: 5, y: 8.6 })]).toEqual([false, true])
    expect(onBed(grid, { x: 2.5, y: 3 })).toBe(true) // the default shampoo bed at x 2, customer tile (2,3), stepped onto from (3,3)
  })
})

describe('stairs', () => {
  const tower = towerOf(shellOf(SPA_LAYOUT_1A))

  it('finds the stairs and the foot of each floor', () => {
    const g = parseLayout(tower)
    expect(g.stairs).toHaveLength(9)
    expect(g.feet).toEqual([
      { x: 11, y: 10 },
      { x: 11, y: 28 },
      { x: 11, y: 46 },
    ])
    expect(isWalkable(g, { x: 11, y: 8 })).toBe(false)
    expect(isWalkable(g, { x: 11, y: 10 })).toBe(true)
  })

  it('links the feet of the open floors', () => {
    expect(buildGrid(tower, [], 1).links).toEqual([])
    expect(buildGrid(tower, [], 2).links).toEqual([[{ x: 11, y: 10 }, { x: 11, y: 28 }]])
  })
})
