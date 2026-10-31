import { FLOOR_PRICE, FLOOR_ROWS, STAIRS_MS, UNLOCK_DAY } from '../config'
import { floorOf } from '../sim/floors'
import { ITEMS, layerOf, size, type Item, type ItemKind } from '../sim/items'
import type { RestaurantSim } from '../sim/restaurant'
import type { SpaSim } from '../sim/spa'
import type { Vec } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'

/** How far, in tiles, someone mid-climb rises toward the stairs before the next floor takes them. */
const CLIMB_LIFT_TILES = 2.5

/**
 * The floor to draw: the owner's, on the frame a walk to a bed takes them off the stairs onto it (`lastOwnerFloor` is where they were the frame before);
 * otherwise the one already viewed, so a floor picked with a pill meanwhile stays.
 */
export function followFloor(sim: SpaSim, viewed: number, lastOwnerFloor: number): number {
  const floor = floorOf(sim.owner.pos.y)
  return sim.owner.task?.kind === 'serve' && floor !== lastOwnerFloor ? floor : viewed
}

/** How a person on the stairs is drawn on the floor they are leaving: lifted toward the stairs and fading; null when not climbing. */
export function climbPose(m: { pos: Vec; climbMs?: number }): { lift: number; alpha: number } | null {
  if (m.climbMs === undefined || !(m.climbMs > 0)) return null
  const k = m.climbMs / STAIRS_MS
  return { lift: CLIMB_LIFT_TILES * k, alpha: 1 - k }
}

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
  for (let floor = 1; floor <= sim.maxFloors(); floor++) {
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

/**
 * The restaurant's pills, one per floor it can have, at the spa's floor prices: the owner's face on her floor while she is in it (`ownerHere`),
 * and a dot on another floor than the one viewed where a diner waits to order with no cook on them.
 */
export function restaurantPills(r: RestaurantSim, viewed: number, ownerHere: boolean): Pill[] {
  const ownerFloor = floorOf(r.owner.pos.y)
  const out: Pill[] = []
  for (let floor = 1; floor <= r.maxFloors(); floor++) {
    out.push({
      floor,
      state: floor === viewed ? 'viewed' : floor <= r.floors ? 'open' : 'locked',
      price: FLOOR_PRICE[floor] ?? 0,
      face: ownerHere && floor === ownerFloor,
      dot: floor !== viewed && r.diners.some(d => d.state === 'ordering' && d.chefId === null && floorOf(d.pos.y) === floor),
    })
  }
  return out
}

/** Which parts of the stairs show on `floor` of a tower of `maxFloors` with `floors` open: the stairs on an open floor under the rooftop, and the rope across them on the top open floor while another can still open. */
export function stairsParts(floor: number, floors: number, maxFloors: number): { stairs: boolean; rope: boolean } {
  return { stairs: maxFloors > 1 && floor < 3 && floor <= floors, rope: floors === floor && floor < maxFloors && floor < 3 }
}

/** The same piece moved by whole floors onto `floor`, keeping its row within the floor. */
export function carryTo(item: Item, floor: number): Item {
  return { ...item, y: item.y + (floor - floorOf(item.y)) * FLOOR_ROWS }
}

/** The same piece moved the least that puts all of its size within the `cols` columns and the rows of `floor`; a wall piece hangs on the floor's lower wall row. */
export function clampToFloor(item: Item, floor: number, cols: number): Item {
  const { w, h } = size(item)
  const top = (floor - 1) * FLOOR_ROWS
  return {
    ...item,
    x: Math.min(Math.max(item.x, 0), cols - w),
    y: layerOf(item.kind) === 'wall' ? top + 1 : Math.min(Math.max(item.y, top), top + FLOOR_ROWS - h),
  }
}

/** Where the power cut's first candle stands: the middle of the desk, in floor-local tiles. */
export function deskCandle(desk: Item): Vec {
  const { w, h } = size(desk)
  const localY = desk.y - (floorOf(desk.y) - 1) * FLOOR_ROWS
  return { x: desk.x + w / 2, y: localY + h / 2 - 0.6 }
}

/** Gives each sprite the floor its item now stands on, so one carried to another floor shows there. */
export function retagFloors(tags: Map<number, { floor: number }>, items: Item[]): void {
  for (const item of items) {
    const tag = tags.get(item.id)
    if (tag) tag.floor = floorOf(item.y)
  }
}

/** The toasts for an older shop's cleared stairs spot, in the order they show: the refund, the gifts back in the guest book, then what to buy again. */
export function stairsToasts(e: { count: number; refund: number; gifts: number; rebuy: ItemKind | null }): string[] {
  const texts: string[] = []
  if (e.refund > 0) texts.push(t('stairsRefund', { count: e.count, money: formatMoney(e.refund) }))
  if (e.gifts > 0) texts.push(t('stairsGifts'))
  if (e.rebuy) texts.push(t('stairsRebuy', { item: t(ITEMS[e.rebuy].name).toLocaleLowerCase('vi') }))
  return texts
}
