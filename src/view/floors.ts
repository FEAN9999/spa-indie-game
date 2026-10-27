import { FLOOR_PRICE, STAIRS_MS, UNLOCK_DAY } from '../config'
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

/** How many floors have a pill; the roof joins in the next batch. */
export const FLOOR_PILLS = 2

/** The floor buttons show once floors have opened for the day and the layout has stairs. */
export function showPills(sim: SpaSim): boolean {
  return sim.day >= UNLOCK_DAY.floors && sim.maxFloors() > 1
}

export interface Pill {
  floor: number
  state: 'viewed' | 'open' | 'locked'
  price: number
  /** The owner is on this floor. */
  face: boolean
  /** Someone waits downstairs while another floor is on view. */
  dot: boolean
}

/** One pill per floor the shop can have: viewed, open to tap, or locked with its price. */
export function pills(sim: SpaSim, viewed: number): Pill[] {
  const ownerFloor = floorOf(sim.owner.pos.y)
  const waiting = sim.customers.some(c => c.state === 'waiting')
  const out: Pill[] = []
  for (let floor = 1; floor <= Math.min(FLOOR_PILLS, sim.maxFloors()); floor++) {
    out.push({
      floor,
      state: floor === viewed ? 'viewed' : floor <= sim.floors ? 'open' : 'locked',
      price: FLOOR_PRICE[floor] ?? 0,
      face: floor === ownerFloor,
      dot: floor === 1 && viewed !== 1 && waiting,
    })
  }
  return out
}
