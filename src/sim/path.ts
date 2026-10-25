import { inBounds, isWalkable, type Grid } from './grid'
import type { Tile } from './types'

const DIRS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

/**
 * Breadth-first search to the nearest tile matching `isGoal`.
 * Goal tiles may be entered even when not walkable (seats, chairs).
 * Returns the tiles after `from` up to and including the goal, or null.
 */
export function findPath(grid: Grid, from: Tile, isGoal: (t: Tile) => boolean): Tile[] | null {
  if (isGoal(from)) return []
  const key = (t: Tile) => t.y * grid.cols + t.x
  const cameFrom = new Map<number, Tile>([[key(from), from]])
  const queue: Tile[] = [from]

  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i]
    for (const d of DIRS) {
      const next = { x: cur.x + d.x, y: cur.y + d.y }
      if (!inBounds(grid, next) || cameFrom.has(key(next))) continue
      const goal = isGoal(next)
      if (!goal && !isWalkable(grid, next)) continue
      cameFrom.set(key(next), cur)
      if (goal) {
        const path = [next]
        let step = cur
        while (key(step) !== key(from)) {
          path.unshift(step)
          step = cameFrom.get(key(step))!
        }
        return path
      }
      queue.push(next)
    }
  }
  return null
}
