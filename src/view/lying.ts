import { TILE } from '../config'
import type { Vec } from '../sim/types'

/** How far a figure lying on a bed turns so its head lies toward the bed's head (`headSide`): not at all up the floor, a quarter turn back for a head on the left, forward for one on the right. */
export const lieAngle = (head: Vec): number => (head.x * Math.PI) / 2

/**
 * Where a point `up` px over the feet of a figure lying with its feet at `p` lands once it turns its head toward `head`, about the bed tile's centre half a tile over the feet.
 * Up the floor that is just `up` over the feet; at `up` 0 it is where the turned figure's container goes.
 */
export function liePoint(p: { x: number; y: number }, up: number, head: Vec): { x: number; y: number } {
  const r = up - TILE / 2
  return { x: p.x + r * head.x, y: p.y - up + r * (1 + head.y) }
}
