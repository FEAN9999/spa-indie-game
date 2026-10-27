import type { StringKey } from '../strings/vi'
import { buildGrid, inBounds, isWalkable, tileEq, type Grid } from './grid'
import { footprint, ITEMS, workTile, type Item } from './items'
import { floorOf } from './floors'
import { DIRS, neighbours } from './path'
import type { Tile } from './types'

/** Why a piece of furniture cannot be bought, put down, moved or sold; a `gift` is never sold, and is put down only while it waits in the guest book. */
export type BuildProblem = 'overlap' | 'blocksPath' | 'bedWall' | 'busy' | 'lastBed' | 'lastSeat' | 'seatFloor' | 'money' | 'gift'

/** What the player is told for each problem; `money` takes the missing amount as {money}. */
export const PROBLEM_TEXT: Record<BuildProblem, StringKey> = {
  blocksPath: 'problemBlocksPath',
  overlap: 'problemOverlap',
  bedWall: 'problemBedWall',
  busy: 'problemBusy',
  lastBed: 'problemLastBed',
  lastSeat: 'problemLastSeat',
  seatFloor: 'problemSeatFloor',
  money: 'problemMoney',
  gift: 'giftNoSell',
}

/** The tiles an item keeps for itself: its footprint and a bed's work tile. */
export function claimed(item: Item): Tile[] {
  const work = workTile(item)
  return work ? [...footprint(item), work] : footprint(item)
}

/** True when part of the item, or a bed's work tile, is off the grid, on a floor not open yet, or on something fixed: a wall, the door, the stairs, the screen or the desk. */
export function offFloor(shell: Grid, item: Item, floors: number): boolean {
  return claimed(item).some(t => !inBounds(shell, t) || floorOf(t.y) > floors || shell.cells[t.y][t.x] !== 'floor')
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
 * Nothing covers the tile inside the door or the owner's start, and every bed and seat stays in reach of the door.
 */
export function placeProblem(shell: Grid, items: Item[], item: Item, extras: { door: Tile; ownerStart: Tile; floors: number }): 'overlap' | 'bedWall' | 'seatFloor' | 'blocksPath' | null {
  const { door, ownerStart, floors } = extras
  const kept = [...items.flatMap(claimed), { x: door.x, y: door.y - 1 }, ownerStart, ...shell.feet]
  if (offFloor(shell, item, floors) || claimed(item).some(t => kept.some(k => tileEq(k, t)))) return 'overlap'
  // the shampoo basin hangs on the back wall, above the bed's head
  if (item.kind === 'bed' && shell.cells[item.y - 1]?.[item.x] !== 'wall') return 'bedWall'

  if (ITEMS[item.kind].group === 'seat' && floorOf(item.y) !== 1) return 'seatFloor'

  const grid = buildGrid(shell, [...items, item], floors)
  const reached = doorReach(grid, door)
  const reachedBeside = (seat: Tile) => DIRS.some(d => reached({ x: seat.x + d.x, y: seat.y + d.y }))
  return grid.works.every(reached) && grid.seats.every(reachedBeside) && reached(ownerStart) && (!shell.feet.length || reached(shell.feet[0])) ? null : 'blocksPath'
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
