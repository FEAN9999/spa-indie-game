import type { StringKey } from '../strings/vi'
import { buildGrid, inBounds, isWalkable, tileEq, type Grid } from './grid'
import { footprint, workTile, type Item } from './items'
import { DIRS } from './path'
import type { Tile } from './types'

/** Why a piece of furniture cannot be bought, put down, moved or sold. */
export type BuildProblem = 'overlap' | 'blocksPath' | 'bedWall' | 'busy' | 'lastBed' | 'lastSeat' | 'money'

/** What the player is told for each problem; `money` takes the missing amount as {money}. */
export const PROBLEM_TEXT: Record<BuildProblem, StringKey> = {
  blocksPath: 'problemBlocksPath',
  overlap: 'problemOverlap',
  bedWall: 'problemBedWall',
  busy: 'problemBusy',
  lastBed: 'problemLastBed',
  lastSeat: 'problemLastSeat',
  money: 'problemMoney',
}

/** The tiles an item keeps for itself: its footprint and a bed's work tile. */
function claimed(item: Item): Tile[] {
  const work = workTile(item)
  return work ? [...footprint(item), work] : footprint(item)
}

/** True when part of the item, or a bed's work tile, is off the grid or on something fixed: a wall, the door, the screen or the desk. */
export function offFloor(shell: Grid, item: Item): boolean {
  return claimed(item).some(t => !inBounds(shell, t) || shell.cells[t.y][t.x] !== 'floor')
}

/** Every tile reachable from `from` through tiles that pass `open`, nearest first, starting with `from`. */
export function flood(grid: Grid, from: Tile, open: (t: Tile) => boolean): Tile[] {
  const key = (t: Tile) => t.y * grid.cols + t.x
  const seen = new Set([key(from)])
  const out = [from]
  for (let i = 0; i < out.length; i++) {
    for (const d of DIRS) {
      const next = { x: out[i].x + d.x, y: out[i].y + d.y }
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
export function placeProblem(shell: Grid, items: Item[], item: Item, extras: { door: Tile; ownerStart: Tile }): 'overlap' | 'bedWall' | 'blocksPath' | null {
  const { door, ownerStart } = extras
  const kept = [...items.flatMap(claimed), { x: door.x, y: door.y - 1 }, ownerStart]
  if (offFloor(shell, item) || claimed(item).some(t => kept.some(k => tileEq(k, t)))) return 'overlap'
  // the shampoo basin hangs on the back wall, above the bed's head
  if (item.kind === 'bed' && shell.cells[item.y - 1]?.[item.x] !== 'wall') return 'bedWall'

  const grid = buildGrid(shell, [...items, item])
  const reached = doorReach(grid, door)
  const reachedBeside = (seat: Tile) => DIRS.some(d => reached({ x: seat.x + d.x, y: seat.y + d.y }))
  return grid.works.every(reached) && grid.seats.every(reachedBeside) && reached(ownerStart) ? null : 'blocksPath'
}
