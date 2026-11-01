import { describe, expect, it } from 'vitest'
import { DINING_SHELL, diningSeats, placeableIn } from '../../src/sim/dining'
import { buildGrid } from '../../src/sim/grid'
import { ITEM_KINDS, workTile, type Item } from '../../src/sim/items'
import { widen } from '../../src/sim/layout'
import { starShop } from './helpers'

const at = (id: number, kind: Item['kind'], x: number, y: number, extra: Partial<Item> = {}): Item => ({ id, kind, x, y, flip: false, ...extra })

describe('the restaurant furniture', () => {
  it('gives a stove a work tile in front of it, either way round', () => {
    expect(workTile(at(1, 'stove', 15, 2))).toEqual({ x: 15, y: 3 })
    expect(workTile(at(1, 'stove', 15, 2, { flip: true }))).toEqual({ x: 16, y: 3 })
    expect(workTile(at(1, 'stove', 15, 2, { turned: true, flip: false }))).toEqual({ x: 16, y: 2 })
  })

  it('makes a stove a work spot and a dining chair a seat on the grid', () => {
    const grid = buildGrid(widen(DINING_SHELL), [at(1, 'stove', 15, 2), at(2, 'diningChair', 14, 7), at(3, 'diningTable', 14, 8)])
    expect(grid.works).toContainEqual({ x: 15, y: 3 })
    expect(grid.cells[3][15]).toBe('work')
    expect(grid.cells[2][15]).toBe('decor')
    expect(grid.cells[2][16]).toBe('decor')
    expect(grid.seats).toContainEqual({ x: 14, y: 7 })
    expect(grid.cells[8][14]).toBe('decor')
  })

  it('keeps spa pieces in the spa, restaurant pieces in the restaurant, and shares the rest', () => {
    for (const kind of ['bed', 'bench', 'desk'] as const) expect(placeableIn(kind, 'restaurant'), kind).toBe(false)
    for (const kind of ['stove', 'servingCounter'] as const) expect(placeableIn(kind, 'spa'), kind).toBe(false)
    expect(placeableIn('plant', 'restaurant')).toBe(true)
    expect(placeableIn('plant', 'spa')).toBe(true)
    for (const kind of ITEM_KINDS) expect(placeableIn(kind, 'spa') || placeableIn(kind, 'restaurant'), kind).toBe(true)
  })

  it('refuses a restaurant piece in the spa', () => {
    expect(starShop(3, 10_000_000).canPlace('stove', 14, 4, false)).toBe('wrongShop')
  })

  it('counts a chair beside an umbrella table as a seat', () => {
    expect(diningSeats([at(1, 'umbrellaTable', 15, 44), at(2, 'diningChair', 15, 43)])).toEqual([{ tile: { x: 15, y: 43 }, facing: 'down' }])
  })

  it('seats a diner on any kind of chair beside any kind of table', () => {
    const items = [
      at(1, 'streetTable', 15, 8), at(2, 'plasticStool', 15, 7), at(3, 'bambooChair', 16, 8),
      at(4, 'roundTable', 19, 8), at(5, 'plasticStool', 19, 7), at(6, 'bambooChair', 21, 9), at(7, 'diningChair', 20, 10),
      at(8, 'bambooChair', 24, 12),
    ]
    expect(diningSeats(items)).toEqual([
      { tile: { x: 15, y: 7 }, facing: 'down' },
      { tile: { x: 16, y: 8 }, facing: 'left' },
      { tile: { x: 19, y: 7 }, facing: 'down' },
      { tile: { x: 21, y: 9 }, facing: 'left' },
      { tile: { x: 20, y: 10 }, facing: 'up' },
    ])
    const grid = buildGrid(widen(DINING_SHELL), items)
    for (const t of [{ x: 15, y: 7 }, { x: 16, y: 8 }, { x: 24, y: 12 }]) expect(grid.cells[t.y][t.x], JSON.stringify(t)).toBe('seat')
    expect([grid.cells[8][19], grid.cells[9][20]]).toEqual(['decor', 'decor'])
  })

  it('seats a diner at the grill table, the bar table and the low table on any of the new chairs', () => {
    const items = [
      at(1, 'grillTable', 15, 40), at(2, 'foldingChair', 15, 39), at(3, 'barStool', 16, 41),
      at(4, 'barTable', 20, 40), at(5, 'barStool', 21, 40),
      at(6, 'lowTable', 15, 46), at(7, 'floorCushion', 17, 46), at(8, 'floorCushion', 15, 47),
    ]
    expect(diningSeats(items)).toEqual([
      { tile: { x: 15, y: 39 }, facing: 'down' },
      { tile: { x: 16, y: 41 }, facing: 'up' },
      { tile: { x: 21, y: 40 }, facing: 'left' },
      { tile: { x: 17, y: 46 }, facing: 'left' },
      { tile: { x: 15, y: 47 }, facing: 'up' },
    ])
    for (const kind of ['grillTable', 'barTable', 'lowTable', 'barStool', 'foldingChair', 'floorCushion'] as const) expect(placeableIn(kind, 'spa'), kind).toBe(false)
  })

  it("keeps the spa's own decor out of the restaurant and the restaurant's out of the spa", () => {
    for (const kind of ['velvetSofa', 'rattanArmchair', 'vanity', 'towelSteamer', 'aromaDiffuser'] as const) expect(placeableIn(kind, 'restaurant'), kind).toBe(false)
    for (const kind of ['streetTable', 'roundTable', 'plasticStool', 'bambooChair', 'menuBoard', 'drinkFridge', 'icedTeaStand'] as const) expect(placeableIn(kind, 'spa'), kind).toBe(false)
    for (const kind of ['sunLounger', 'charcoalGrill', 'lightArch', 'gardenSwing', 'hammock', 'bananaPlant'] as const) expect(placeableIn(kind, 'spa'), kind).toBe(false)
    for (const kind of ['tileRug', 'tearCalendar', 'pool'] as const) expect([placeableIn(kind, 'spa'), placeableIn(kind, 'restaurant')], kind).toEqual([true, true])
  })
})
