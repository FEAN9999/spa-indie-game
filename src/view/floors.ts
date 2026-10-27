import { STAIRS_MS } from '../config'
import { floorOf } from '../sim/floors'
import type { SpaSim } from '../sim/spa'
import type { Vec } from '../sim/types'

/** How far, in tiles, someone mid-climb rises toward the stairs before the next floor takes them. */
const CLIMB_LIFT_TILES = 2.5

/** The floor to draw: the owner's while serving and not mid-climb, so the screen follows them to a bed; otherwise the one already viewed. */
export function followFloor(sim: SpaSim, viewed: number): number {
  const o = sim.owner
  return o.task?.kind === 'serve' && !(o.climbMs !== undefined && o.climbMs > 0) ? floorOf(o.pos.y) : viewed
}

/** How a person on the stairs is drawn on the floor they are leaving: lifted toward the stairs and fading; null when not climbing. */
export function climbPose(m: { pos: Vec; climbMs?: number }): { lift: number; alpha: number } | null {
  if (m.climbMs === undefined || !(m.climbMs > 0)) return null
  const k = m.climbMs / STAIRS_MS
  return { lift: CLIMB_LIFT_TILES * k, alpha: 1 - k }
}
