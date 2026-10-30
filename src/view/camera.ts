import { FLOOR_ROWS, HOUSE_COLS, MAP_X, MAP_Y, SHOP_X0, STREET_TILES, TILE, ZOOM_MAX } from '../config'
import type { Houses } from '../sim/layout'
import type { Tile, Vec } from '../sim/types'

/** A rectangle in screen or world pixels. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** How the map is shown: its zoom, and the world point at the middle of the area it is shown in. */
export interface View {
  zoom: number
  cx: number
  cy: number
}

/** Where the map shows in normal play: from under the top bar down to the bottom of the street. */
export const MAP_VIEW: Rect = { x: 0, y: MAP_Y, w: 1080, h: (FLOOR_ROWS + STREET_TILES) * TILE }

/** The map's area in build mode: it ends at the top of the build panel. */
export const buildArea = (panelTop: number): Rect => ({ ...MAP_VIEW, h: Math.min(panelTop, MAP_VIEW.y + MAP_VIEW.h) - MAP_VIEW.y })

/** The world the camera may show: every bought column of floor 1 and the street under them. */
export function mapBounds(houses: Houses): Rect {
  const from = SHOP_X0 - houses.left * HOUSE_COLS
  const to = SHOP_X0 + 12 + houses.right * HOUSE_COLS
  return { x: MAP_X + from * TILE, y: MAP_Y, w: (to - from + 1) * TILE, h: MAP_VIEW.h }
}

/** The farthest out the map zooms: the whole width across the area, never past normal size. */
export const minZoom = (bounds: Rect, area: Rect): number => Math.min(1, area.w / bounds.w)

/** One axis of clampView: centred when the bounds fit the area, else never showing past them. */
function clampAxis(c: number, lo: number, size: number, span: number): number {
  const half = span / 2
  if (size <= span) return lo + size / 2
  return Math.min(Math.max(c, lo + half), lo + size - half)
}

/** The view held to the zoom limits and to the bounds. */
export function clampView(v: View, bounds: Rect, area: Rect): View {
  const zoom = Math.min(Math.max(v.zoom, minZoom(bounds, area)), ZOOM_MAX)
  return {
    zoom,
    cx: clampAxis(v.cx, bounds.x, bounds.w, area.w / zoom),
    cy: clampAxis(v.cy, bounds.y, bounds.h, area.h / zoom),
  }
}

export const toScreen = (v: View, area: Rect, wx: number, wy: number): Vec => ({
  x: area.x + area.w / 2 + (wx - v.cx) * v.zoom,
  y: area.y + area.h / 2 + (wy - v.cy) * v.zoom,
})

export const toWorld = (v: View, area: Rect, sx: number, sy: number): Vec => ({
  x: v.cx + (sx - area.x - area.w / 2) / v.zoom,
  y: v.cy + (sy - area.y - area.h / 2) / v.zoom,
})

/** The part of the world the area shows. */
export function visibleWorld(v: View, area: Rect): Rect {
  const w = area.w / v.zoom
  const h = area.h / v.zoom
  return { x: v.cx - w / 2, y: v.cy - h / 2, w, h }
}

export const contains = (r: Rect, x: number, y: number, margin = 0): boolean =>
  x >= r.x - margin && x < r.x + r.w + margin && y >= r.y - margin && y < r.y + r.h + margin

/** Zooms by `factor` keeping the world point under (sx, sy) there, then clamps. */
export function zoomAbout(v: View, area: Rect, factor: number, sx: number, sy: number, bounds: Rect): View {
  const at = toWorld(v, area, sx, sy)
  const zoom = Math.min(Math.max(v.zoom * factor, minZoom(bounds, area)), ZOOM_MAX)
  const cx = at.x - (sx - area.x - area.w / 2) / zoom
  const cy = at.y - (sy - area.y - area.h / 2) / zoom
  return clampView({ zoom, cx, cy }, bounds, area)
}

/** Moves the map with a finger that went (dx, dy) screen pixels, then clamps. */
export const panBy = (v: View, area: Rect, dx: number, dy: number, bounds: Rect): View =>
  clampView({ zoom: v.zoom, cx: v.cx - dx / v.zoom, cy: v.cy - dy / v.zoom }, bounds, area)

/** The view for a new area that keeps every world point where it was on screen, then clamped. */
export function refit(v: View, from: Rect, to: Rect, bounds: Rect): View {
  const cx = v.cx + (to.x + to.w / 2 - (from.x + from.w / 2)) / v.zoom
  const cy = v.cy + (to.y + to.h / 2 - (from.y + from.h / 2)) / v.zoom
  return clampView({ zoom: v.zoom, cx, cy }, bounds, to)
}

/** A held piece's tile after the finger went from `down` to `now`, both world points: whole tiles crossed. */
export const dragTile = (from: Tile, down: Vec, now: Vec): Tile => ({
  x: from.x + Math.round((now.x - down.x) / TILE),
  y: from.y + Math.round((now.y - down.y) / TILE),
})
