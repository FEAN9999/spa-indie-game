import { BUSTLE_ART, type BustleArtKey } from '../art/bustle'
import { BUSTLE_ROWS, FLOOR_ROWS, HOUSE_COLS, HOUSES_PER_SIDE, MAP_X, MAP_Y, NIGHT_MARKET_OPEN_MIN, RESTAURANT_X0, SHOP_COLS, SHOP_X0, STREET_TILES, TILE } from '../config'
import { BUSTLE_IDS, bustlePercent, type BustleId } from '../sim/bustle'
import type { Houses } from '../sim/layout'
import type { Rect } from './camera'

/**
 * Where the street's pieces go, in street tiles: column 0 is the left edge of the spa's grid and the restaurant's grid runs on from column
 * 37 (its door at 55), as src/view/street.ts lays them; row 0 is the map's top, the sidewalk starts at row 18, the old road at 19.2, and the
 * open street adds BUSTLE_ROWS rows from row 20.
 */

/** The sidewalk's top row, the old road's top, and the first row the open street adds under it. */
export const SIDEWALK_ROW = FLOOR_ROWS
export const OLD_ROAD_ROW = FLOOR_ROWS + 1.2
export const STRIP_ROW = FLOOR_ROWS + STREET_TILES
/** The open street's last row. */
export const STREET_END_ROW = STRIP_ROW + BUSTLE_ROWS

/** A street column's left edge and a street row's top, in world pixels. */
export const colX = (col: number): number => MAP_X + col * TILE
export const rowY = (row: number): number => MAP_Y + row * TILE
/** The street tile under a world point, in fractional columns and rows. */
export const streetAt = (x: number, y: number): { col: number; row: number } => ({ col: (x - MAP_X) / TILE, row: (y - MAP_Y) / TILE })

/** A rectangle in street tiles. */
export interface StreetRect {
  col: number
  row: number
  w: number
  h: number
}

/** One picture of a piece: its texture's top-left in street tiles, and the row its foot stands on, which sets its depth among people. */
export interface PiecePicture {
  key: BustleArtKey
  col: number
  row: number
  foot: number
}

/** One mark over a piece still for sale: a + (or a faint ring at a piece's other copies, or a lot's dashed frame), top-left in street tiles. */
export interface MarkSpot {
  key: BustleArtKey
  col: number
  row: number
  scale: number
}

/** The middle of each copy of the pieces that stand on the sidewalk several times; the first gets the +. */
const TREE_COLS = [14.5, 23, 34, 44.5, 59.5]
const LAMP_COLS = [12.8, 28.6, 40.5, 52.5]
const BENCH_COLS = [20.8, 37]
/** The two carts' left edges. */
const CART_COL = { banhMi: 24.5, sugarcane: 29.6 }
/** Each lot across the road: its first and its end column. */
export const LOTS = { busStop: [13, 23], park: [24, 42], nightMarket: [43, 61] } as const
type LotId = keyof typeof LOTS
const isLot = (id: BustleId): id is LotId => id in LOTS
/** A sidewalk piece stands with its foot at this row, near the curb; walkers and the bike pass just behind it. */
const FOOT = 19.15
/** The middle of the marks on the sidewalk, and the middle of a lot's + and of its name under it: high in the lot, clear of today's line and the strip over the map's bottom. */
const MARK_ROW = 18.65
const LOT_PLUS_ROW = 22.1
export const LOT_LABEL_ROW = 23.05
const LOT_PLUS_SCALE = 1.4
/** The top of the far sidewalk, where a lot's dashed frame starts. */
const LOT_ROW = STRIP_ROW + 1

const size = (key: BustleArtKey) => BUSTLE_ART[key]
/** A picture standing on the sidewalk, its middle at `mid` and its bottom edge at `bottom`. */
const standing = (key: BustleArtKey, mid: number, bottom: number): PiecePicture => ({ key, col: mid - size(key).w / 2, row: bottom - size(key).h, foot: FOOT })

/** The pictures of a piece on the street; the night market is set out from 17:00 and under tarps before. */
export function bustlePictures(id: BustleId, minutes: number): PiecePicture[] {
  switch (id) {
    case 'trees':
      return TREE_COLS.map(c => standing('bustle-tree', c, 19.15))
    case 'lamps':
      // the pole stands 0.3 from the texture's left edge
      return LAMP_COLS.map(c => ({ key: 'bustle-lamp', col: c - 0.3, row: 19.12 - size('bustle-lamp').h, foot: FOOT }))
    case 'benches':
      return BENCH_COLS.map(c => standing('bustle-bench', c, 19.17))
    case 'banhMi':
    case 'sugarcane':
      return [{ key: `bustle-${id}`, col: CART_COL[id], row: 19.2 - size(`bustle-${id}`).h, foot: FOOT }]
    case 'busStop':
      return [{ key: 'bustle-busStop', col: LOTS.busStop[0], row: STRIP_ROW + 0.1, foot: STRIP_ROW + 0.1 }]
    case 'park':
      return [{ key: 'bustle-park', col: LOTS.park[0], row: LOT_ROW, foot: LOT_ROW }]
    case 'nightMarket':
      return [{ key: minutes >= NIGHT_MARKET_OPEN_MIN ? 'bustle-market-night' : 'bustle-market-day', col: LOTS.nightMarket[0], row: STRIP_ROW + 0.6, foot: STRIP_ROW + 0.6 }]
  }
}

/** True for the pieces on the sidewalk, which upper floors' balconies hide; the lots across the road show on every floor. */
export const onSidewalk = (id: BustleId): boolean => !isLot(id)

/** Where a tap finds each piece: each sidewalk copy's width over the whole sidewalk, and a lot from the far sidewalk to the street's end. */
export function bustleHits(id: BustleId): StreetRect[] {
  const on = (mid: number, w: number): StreetRect => ({ col: mid - w / 2, row: SIDEWALK_ROW, w, h: OLD_ROAD_ROW - SIDEWALK_ROW })
  switch (id) {
    case 'trees':
      return TREE_COLS.map(c => on(c, 1.8))
    case 'lamps':
      return LAMP_COLS.map(c => on(c, 1))
    case 'benches':
      return BENCH_COLS.map(c => on(c, 1.8))
    case 'banhMi':
    case 'sugarcane':
      return [{ col: CART_COL[id], row: SIDEWALK_ROW, w: size(`bustle-${id}`).w, h: OLD_ROAD_ROW - SIDEWALK_ROW }]
    default: {
      const [from, to] = LOTS[id]
      return [{ col: from, row: LOT_ROW, w: to - from, h: STREET_END_ROW - LOT_ROW }]
    }
  }
}

const inside = (r: StreetRect, col: number, row: number) => col >= r.col && col < r.col + r.w && row >= r.row && row < r.row + r.h

/** The piece whose spot is under (col, row), bought or not; on an upper floor only the lots across the road. */
export function bustleAt(col: number, row: number, floor = 1): BustleId | null {
  return BUSTLE_IDS.find(id => (floor === 1 || !onSidewalk(id)) && bustleHits(id).some(r => inside(r, col, row))) ?? null
}

/** The marks over a piece still for sale: a + over a sidewalk piece's first copy and a faint ring over the rest, or a lot's frame and +. */
export function bustleMarks(id: BustleId): MarkSpot[] {
  const at = (key: BustleArtKey, midCol: number, midRow: number, scale = 1): MarkSpot => ({ key, col: midCol - (size(key).w * scale) / 2, row: midRow - (size(key).h * scale) / 2, scale })
  if (isLot(id)) {
    const [from, to] = LOTS[id]
    const key: BustleArtKey = `bustle-frame-${id}`
    return [{ key, col: (from + to - size(key).w) / 2, row: LOT_ROW, scale: 1 }, at('bustle-plus', (from + to) / 2, LOT_PLUS_ROW, LOT_PLUS_SCALE)]
  }
  return bustleHits(id).map((r, i) => at(i === 0 ? 'bustle-plus' : 'bustle-ghost', r.col + r.w / 2, MARK_ROW))
}

/** The middle of a lot's name under its +; null for a piece on the sidewalk. */
export function lotLabelAt(id: BustleId): { col: number; row: number } | null {
  if (!isLot(id)) return null
  const [from, to] = LOTS[id]
  return { col: (from + to) / 2, row: LOT_LABEL_ROW }
}

/** The world point the map slides to for a piece: its first copy on the sidewalk, or the middle of its lot. */
export function bustleFocus(id: BustleId): { x: number; y: number } {
  const r = bustleHits(id)[0]
  return { x: colX(r.col + r.w / 2), y: rowY(r.row + r.h / 2) }
}

/** A stretch of columns, from its first to its end. */
export type ColSpan = [number, number]

/** The old shop's width, and the restaurant's: the columns between its houses. */
const BLOCK_COLS = SHOP_COLS - 2 * HOUSES_PER_SIDE * HOUSE_COLS

/** The columns whose upper floors lay a balcony or a roof over the sidewalk: the spa's block and the restaurant's, each with its bought houses. */
export function upperFronts(spa: Houses, restaurant: Houses | null): ColSpan[] {
  const block = (x0: number, h: Houses): ColSpan => [x0 + SHOP_X0 - h.left * HOUSE_COLS, x0 + SHOP_X0 + BLOCK_COLS + h.right * HOUSE_COLS]
  return restaurant ? [block(0, spa), block(RESTAURANT_X0, restaurant)] : [block(0, spa)]
}

/**
 * Where plain road goes over the old road, hiding its dashed line so the lane line runs down the middle of the wider road: across the
 * whole street on floor 1; on an upper floor only under the houses still drawn down to the road, never over a balcony.
 */
export function roadCovers(floor: number, street: ColSpan, fronts: readonly ColSpan[]): ColSpan[] {
  let spans: ColSpan[] = [street]
  if (floor === 1) return spans
  for (const [a, b] of fronts) spans = spans.flatMap(([from, to]): ColSpan[] => [...(a > from ? [[from, Math.min(a, to)] as ColSpan] : []), ...(b < to ? [[Math.max(b, from), to] as ColSpan] : [])].filter(([x, y]) => y > x))
  return spans
}

/** The street's bounds once it is open: the map runs BUSTLE_ROWS rows further down. */
export const openStreetBounds = (b: Rect): Rect => ({ ...b, h: b.h + BUSTLE_ROWS * TILE })

/** How much sooner customers come, as the game writes it: "6%", "1,5%". */
export const bustlePercentText = (score: number): string => `${String(Math.round(bustlePercent(score) * 10) / 10).replace('.', ',')}%`

/** A price in whole millions as a lot's name shows it: 6, 12, 18. */
export const millions = (price: number): string => String(Math.round(price / 100_000) / 10).replace('.', ',')
