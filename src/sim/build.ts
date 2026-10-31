import type { StringKey } from '../strings/vi'
import { buildGrid, inBounds, isWalkable, tileEq, type Grid } from './grid'
import { deskSpot, footprint, ITEMS, layerOf, workTile, type Item } from './items'
import { FLOOR_ROWS } from '../config'
import { placeableIn, type ShopSide } from './dining'
import { floorOf } from './floors'
import { DIRS, neighbours } from './path'
import type { Tile } from './types'

/** Why a piece of furniture cannot be bought, put down, moved or sold; a `gift` is never sold, and is put down only while it waits in the guest book. */
export type BuildProblem = 'overlap' | 'blocksPath' | 'bedWall' | 'busy' | 'lastBed' | 'lastSeat' | 'lastDesk' | 'seatFloor' | 'deskFloor' | 'roofOnly' | 'wrongShop' | 'lastDining' | 'money' | 'gift'

/** What the player is told for each problem; `money` takes the missing amount as {money}. */
export const PROBLEM_TEXT: Record<BuildProblem, StringKey> = {
  blocksPath: 'problemBlocksPath',
  overlap: 'problemOverlap',
  bedWall: 'problemBedWall',
  busy: 'problemBusy',
  lastBed: 'problemLastBed',
  lastSeat: 'problemLastSeat',
  lastDesk: 'problemLastDesk',
  seatFloor: 'problemSeatFloor',
  deskFloor: 'problemDeskFloor',
  roofOnly: 'problemRoofOnly',
  wrongShop: 'problemWrongShop',
  lastDining: 'problemLastDining',
  money: 'problemMoney',
  gift: 'giftNoSell',
}

/** The tiles an item keeps for itself: its footprint, a bed's work tile and a desk's spot; a wall piece or a rug keeps none. */
export function claimed(item: Item): Tile[] {
  if (layerOf(item.kind) !== 'floor') return []
  const extra = workTile(item) ?? deskSpot(item)
  return extra ? [...footprint(item), extra] : footprint(item)
}

/**
 * True when part of the item, a bed's work tile or a desk's spot, is off the grid, on a floor not open yet, or on something fixed: a wall, the door or the stairs.
 * A rug lies on open floor the same way; a wall piece hangs on the back wall's lower row over open floor, on floors 1 and 2 only.
 */
export function offFloor(shell: Grid, item: Item, floors: number): boolean {
  const cell = (t: Tile) => shell.cells[t.y]?.[t.x]
  const layer = layerOf(item.kind)
  if (layer === 'wall')
    return footprint(item).some(t => !inBounds(shell, t) || t.y % FLOOR_ROWS !== 1 || floorOf(t.y) > Math.min(floors, 2) || cell(t) !== 'wall' || cell({ x: t.x, y: t.y + 1 }) !== 'floor')
  const tiles = layer === 'rug' ? footprint(item) : claimed(item)
  return tiles.some(t => !inBounds(shell, t) || floorOf(t.y) > floors || cell(t) !== 'floor')
}

/** Every tile reachable from `from` through tiles that pass `open`, nearest first, starting with `from`. */
export function flood(grid: Grid, from: Tile, open: (t: Tile) => boolean): Tile[] {
  const key = (t: Tile) => t.y * grid.cols + t.x
  const seen = new Set([key(from)])
  const out = [from]
  for (let i = 0; i < out.length; i++) {
    for (const next of neighbours(grid, out[i])) {
      if (!inBounds(grid, next) || seen.has(key(next)) || !open(next)) continue
      seen.add(key(next))
      out.push(next)
    }
  }
  return out
}

/** Whether someone coming in at the door can walk to `t`. */
export function doorReach(grid: Grid, door: Tile): (t: Tile) => boolean {
  const reach = flood(grid, door, t => isWalkable(grid, t))
  return t => reach.some(r => tileEq(r, t))
}

/**
 * Why `item` cannot stand where it says, or null; `items` is the rest of the shop, without it.
 * Nothing covers the tile inside the door, and every bed and seat stays in reach of the door, and so does every desk's spot, which is kept free, and so does a walkable tile beside each open floor's stairs foot (the stairs themselves would otherwise let a shut-in upper foot count as reached).
 * A foot the door did not reach without `item` either, as in an older shop built before the stairs, is left as it is.
 */
export function placeProblem(shell: Grid, items: Item[], item: Item, extras: { door: Tile; floors: number }): 'overlap' | 'bedWall' | 'seatFloor' | 'deskFloor' | 'roofOnly' | 'blocksPath' | null {
  const { door, floors } = extras
  const layer = layerOf(item.kind)
  if (layer !== 'floor') {
    const taken = items.filter(i => layerOf(i.kind) === layer).flatMap(footprint)
    return offFloor(shell, item, floors) || footprint(item).some(t => taken.some(k => tileEq(k, t))) ? 'overlap' : null
  }
  const kept = [...items.flatMap(claimed), { x: door.x, y: door.y - 1 }, ...shell.feet]
  if (offFloor(shell, item, floors) || claimed(item).some(t => kept.some(k => tileEq(k, t)))) return 'overlap'
  // the shampoo basin hangs on the back wall, above the bed's head, unless the bed lies across with its standing basin
  if (item.kind === 'bed' && !item.turned && shell.cells[item.y - 1]?.[item.x] !== 'wall') return 'bedWall'

  if (ITEMS[item.kind].group === 'seat' && floorOf(item.y) !== 1) return 'seatFloor'

  if (item.kind === 'desk' && floorOf(item.y) !== 1) return 'deskFloor'

  if (item.kind === 'umbrellaTable' && floorOf(item.y) !== 3) return 'roofOnly'

  const all = [...items, item]
  const grid = buildGrid(shell, all, floors)
  const reached = doorReach(grid, door)
  const beside = (reach: (t: Tile) => boolean) => (seat: Tile) => DIRS.some(d => reach({ x: seat.x + d.x, y: seat.y + d.y }))
  const reachedBeside = beside(reached)
  if (!(grid.works.every(reached) && grid.seats.every(reachedBeside) && all.every(i => { const spot = deskSpot(i); return !spot || reached(spot) }))) return 'blocksPath'
  const feet = shell.feet.slice(0, floors)
  if (feet.every(reachedBeside)) return null
  const before = beside(doorReach(buildGrid(shell, items, floors), door))
  return feet.every(f => reachedBeside(f) || !before(f)) ? null : 'blocksPath'
}

/** What stops `item` standing in `shop`, or null: a piece the shop does not take, else placeProblem against `items` with `item` itself out of its own way. */
export function placementProblem(shop: ShopSide, shell: Grid, items: Item[], item: Item, extras: { door: Tile; floors: number }): BuildProblem | null {
  if (!placeableIn(item.kind, shop)) return 'wrongShop'
  return placeProblem(shell, items.filter(i => i.id !== item.id), item, extras)
}

/** What selling a `kind` gives back: half its price. */
export function sellRefund(kind: Item['kind']): number {
  return Math.floor(ITEMS[kind].price / 2)
}

/** The tile nearest `from` that `fits`, trying square rings of growing size, each row by row; null when no tile on the grid fits. */
export function nearestSpot(grid: { cols: number; rows: number }, from: Tile, fits: (t: Tile) => boolean): Tile | null {
  for (let r = 0; r < Math.max(grid.cols, grid.rows); r++) {
    for (let y = from.y - r; y <= from.y + r; y++) {
      for (let x = from.x - r; x <= from.x + r; x++) {
        const t = { x, y }
        const onRing = Math.max(Math.abs(x - from.x), Math.abs(y - from.y)) === r
        if (onRing && x >= 0 && y >= 0 && x < grid.cols && y < grid.rows && fits(t)) return t
      }
    }
  }
  return null
}
