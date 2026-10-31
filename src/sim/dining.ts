import { towerOf } from './floors'
import { parseLayout, type Grid } from './grid'
import { footprint, ITEMS, type Item, type ItemKind } from './items'
import { NO_HOUSES, widen, withHouses, type Houses } from './layout'
import type { Facing, Tile } from './types'

/** The restaurant's bare room, 13 columns like the old spa shop, its stairs in the same place; widen() puts it on the wide grid. */
export const DINING_SHELL: string[] = [
  '#############',
  '#############',
  ...Array.from({ length: 5 }, () => '#...........#'),
  ...Array.from({ length: 3 }, () => '#..........U#'),
  ...Array.from({ length: 7 }, () => '#...........#'),
  '######D######',
]

/** The restaurant's bare room as a grid: walls, door and stairs, no furniture, with the bought houses opened on every floor. */
export const diningShellGrid = (houses: Houses = NO_HOUSES): Grid => parseLayout(towerOf(withHouses(widen(DINING_SHELL), houses)))

export type ShopSide = 'spa' | 'restaurant'

/** Whether a piece may stand in `shop`: beds, waiting seats and the reception desk are the spa's, the dining pieces and the restaurant's decor its own; the rest is shared. */
export function placeableIn(kind: ItemKind, shop: ShopSide): boolean {
  const { group, shop: only } = ITEMS[kind]
  if (shop === 'restaurant') return group !== 'bed' && group !== 'seat' && kind !== 'desk'
  return only !== 'restaurant'
}

const piece = (kind: ItemKind, x: number, y: number): Omit<Item, 'id'> => ({ kind, x, y, flip: false })

/** What the restaurant opens with, in the 37-column grid: the sketch's top half, two stoves, the serving counter with a gap at x 18 for the way to the stoves, two tables with their chairs; the bottom two tables are left empty on purpose. */
export const DINING_START: Omit<Item, 'id'>[] = [
  piece('stove', 15, 2), piece('stove', 18, 2),
  piece('servingCounter', 13, 5), piece('servingCounter', 19, 5),
  piece('diningTable', 14, 8), piece('diningTable', 19, 8),
  ...([[14, 7], [15, 7], [14, 9], [15, 9], [19, 7], [20, 7], [19, 9], [20, 9]] as const).map(([x, y]) => piece('diningChair', x, y)),
  piece('ingredientShelf', 13, 2), piece('ingredientShelf', 14, 2), piece('ingredientShelf', 23, 2),
  piece('sink', 21, 2), piece('cashierCounter', 20, 14),
]

export interface DiningSeat {
  tile: Tile
  facing: Facing
}

/** Where a diner may sit: every dining chair with a table tile right beside it, facing that tile; a chair touching no table is none. */
export function diningSeats(items: Item[]): DiningSeat[] {
  const tables = items.filter(i => i.kind === 'diningTable').flatMap(footprint)
  const beside: [Facing, number, number][] = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]]
  return items.filter(i => i.kind === 'diningChair').flatMap(chair => {
    const side = beside.find(([, dx, dy]) => tables.some(t => t.x === chair.x + dx && t.y === chair.y + dy))
    return side ? [{ tile: { x: chair.x, y: chair.y }, facing: side[0] }] : []
  })
}
