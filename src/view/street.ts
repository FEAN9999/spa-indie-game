import { MAP_X, MAP_Y, RESTAURANT_X0, SHOP_X0, TILE } from '../config'
import type { ShopSide } from '../sim/dining'
import type { Houses } from '../sim/layout'
import type { Diner } from '../sim/restaurant'
import type { Tile, Vec } from '../sim/types'
import { mapBounds, type Rect } from './camera'

/** The world x of the left edge of restaurant column `col`: its grid is drawn RESTAURANT_X0 columns to the right of the spa's. */
export const restaurantX = (col: number): number => MAP_X + (RESTAURANT_X0 + col) * TILE

/** The restaurant tile under a world point: restaurantX's inverse, and the row RoomView.worldToTile gives on floor 1 (the restaurant has one floor). */
export function restaurantTileAt(world: Vec): Tile {
  return { x: Math.floor((world.x - restaurantX(0)) / TILE), y: Math.floor((world.y - MAP_Y) / TILE) }
}

/** The right edge of the restaurant's main block: its 13 columns from SHOP_X0, as the spa's mapBounds ends on its own. */
const RESTAURANT_RIGHT = restaurantX(SHOP_X0 + 13)

/** The world the main shop's camera may show: the spa's bounds out to the end of the restaurant's main block. */
export function streetBounds(spaShown: Houses): Rect {
  const spa = mapBounds(spaShown)
  return { ...spa, w: RESTAURANT_RIGHT - spa.x }
}

/** The shop under a world x: the restaurant from its first column on once it is owned, else the spa. */
export const shopAt = (worldX: number, owned: boolean): ShopSide => (owned && worldX >= restaurantX(0) ? 'restaurant' : 'spa')

/** The world x of the middle of each shop's door, on column 18 of its own grid. */
export const DOOR_X = { spa: MAP_X + 18.5 * TILE, restaurant: restaurantX(18.5) }

/** The bike's x `k` (0..1) of the way from the other shop's door to `to`'s door. */
export function rideX(to: ShopSide, k: number): number {
  const from = to === 'restaurant' ? DOOR_X.spa : DOOR_X.restaurant
  return from + (DOOR_X[to] - from) * k
}

/** A street walker's x: from the spa door toward the restaurant door by the share of its leg walked. */
export function walkerX(d: Diner): number {
  const k = d.legMs > 0 ? Math.min(Math.max(d.stateMs / d.legMs, 0), 1) : 0
  return DOOR_X.spa + (DOOR_X.restaurant - DOOR_X.spa) * k
}

/** A stretch of the street on the position strip, in world x. */
export interface StripBlock {
  from: number
  to: number
  restaurant: boolean
}

/** The spa's block and the restaurant's, meeting at the restaurant's first column; the old house is part of the street from day 1. */
export function stripBlocks(spaShown: Houses): StripBlock[] {
  return [
    { from: streetBounds(spaShown).x, to: restaurantX(0), restaurant: false },
    { from: restaurantX(0), to: RESTAURANT_RIGHT, restaurant: true },
  ]
}

/** The world x of each diner holding a ticket out of view sideways (the restaurant has one floor, so there is no floor to check). */
export function ticketDots(diners: Diner[], visible: Rect): number[] {
  return diners
    .filter(d => d.state === 'ordering')
    .map(d => restaurantX(d.pos.x + 0.5))
    .filter(x => x < visible.x || x >= visible.x + visible.w)
}
