import { MAP_X, TILE } from '../config'
import { floorOf } from '../sim/floors'
import type { Customer } from '../sim/types'
import type { Rect } from './camera'

/** The position strip on screen: its left end, middle y, length and bar height, and the height of its tap band (1734–1806, clear of the today line and the pills). */
export const STRIP = { x: 140, y: 1770, w: 800, h: 24, hitH: 72 }

/** Where a world x falls on the strip, which spans the map's bounds end to end. */
export function stripX(bounds: Rect, worldX: number): number {
  const k = Math.min(Math.max((worldX - bounds.x) / bounds.w, 0), 1)
  return STRIP.x + k * STRIP.w
}

/** The world x a point on the strip stands for. */
export function worldXAt(bounds: Rect, sx: number): number {
  const k = Math.min(Math.max((sx - STRIP.x) / STRIP.w, 0), 1)
  return bounds.x + k * bounds.w
}

/** The world x of every waiting customer on another floor than the one viewed, or out of view sideways. */
export function offscreenWaiting(customers: Customer[], viewFloor: number, visible: Rect): number[] {
  return customers
    .filter(c => c.state === 'waiting')
    .map(c => ({ x: MAP_X + (c.pos.x + 0.5) * TILE, floor: floorOf(c.pos.y) }))
    .filter(c => c.floor !== viewFloor || c.x < visible.x || c.x >= visible.x + visible.w)
    .map(c => c.x)
}
