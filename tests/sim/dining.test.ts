import { describe, expect, it } from 'vitest'
import { DINING_SHELL, placeableIn } from '../../src/sim/dining'
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
})
