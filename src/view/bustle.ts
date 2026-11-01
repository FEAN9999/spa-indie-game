import { BUS_SHELTER, BUSTLE_ART, LAMP_HEAD, MARKET_LANTERNS, PARK_LAMPS, type BustleArtKey } from '../art/bustle'
import { BUSTLE_ROWS, FLOOR_ROWS, HOUSE_COLS, HOUSES_PER_SIDE, MAP_X, MAP_Y, NIGHT_MARKET_OPEN_MIN, RESTAURANT_X0, SHOP_COLS, SHOP_X0, STREET_TILES, TILE } from '../config'
import { BUSTLE_IDS, bustlePercent, bustleScore, type BustleId } from '../sim/bustle'
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

/** A bend in a lane round something standing on it: from `from` to `to` the walkers keep to `row`, easing there and back over `ramp` columns either side. */
export interface Detour {
  from: number
  to: number
  ramp: number
  row: number
}

/**
 * One lane of passers-by: the row their feet walk, the columns they keep to, how many and how fast (tiles a second); `loop` walkers come back
 * in at the other end, the rest turn round at the ends. `near` lanes are on the shop's own sidewalk, which upper floors hide. `detour` bends it.
 */
export interface WalkLane {
  row: number
  from: number
  to: number
  count: number
  speed: number
  loop: boolean
  near: boolean
  detour: Detour | null
}

/** The near sidewalk's walkers keep to the diners' line, just behind the pieces at the curb; the far ones to the far sidewalk; the park's to its path, the market's to the front of its stalls. */
export const WALK_ROWS = { near: SIDEWALK_ROW + 0.85, far: STRIP_ROW + 1.5, park: STRIP_ROW + 2.42, market: STRIP_ROW + 4.25 }
/** The most walkers on the near sidewalk. */
const NEAR_MAX = 8
/** The far sidewalk's walkers go round behind the bus shelter and its sign, on the paving in front of its bench and clear of its flower bed. */
const SHELTER_DETOUR: Detour = { from: LOTS.busStop[0] + BUS_SHELTER.from, to: LOTS.busStop[0] + BUS_SHELTER.to, ramp: 1.4, row: STRIP_ROW + 2.8 }

/** Who walks the open street: two on the near sidewalk to start and more as it gets busier, a few on the far sidewalk once a lot is bought, strollers in the park, and shoppers at the night market from 17:00. */
export function walkLanes(bought: readonly BustleId[], minutes: number, street: ColSpan): WalkLane[] {
  const score = bustleScore(bought)
  const [from, to] = street
  const lanes: WalkLane[] = [{ row: WALK_ROWS.near, from, to, count: Math.min(NEAR_MAX, 2 + Math.floor(score / 5)), speed: 0.9, loop: true, near: true, detour: null }]
  if (bought.some(id => !onSidewalk(id)))
    lanes.push({ row: WALK_ROWS.far, from, to, count: 1 + Math.floor(score / 10), speed: 0.8, loop: true, near: false, detour: bought.includes('busStop') ? SHELTER_DETOUR : null })
  if (bought.includes('park')) lanes.push({ row: WALK_ROWS.park, from: LOTS.park[0] + 0.6, to: LOTS.park[1] - 0.6, count: 2, speed: 0.45, loop: false, near: false, detour: null })
  if (bought.includes('nightMarket') && minutes >= NIGHT_MARKET_OPEN_MIN)
    lanes.push({ row: WALK_ROWS.market, from: LOTS.nightMarket[0] + 0.6, to: LOTS.nightMarket[1] - 0.6, count: 6, speed: 0.35, loop: false, near: false, detour: null })
  return lanes
}

/** The row a walker's feet are at in column `col` of its lane: the lane's own, or round its detour, eased in and out. */
export function laneRow(lane: WalkLane, col: number): number {
  const d = lane.detour
  if (!d) return lane.row
  const k = col <= d.from - d.ramp || col >= d.to + d.ramp ? 0 : col < d.from ? (col - (d.from - d.ramp)) / d.ramp : col > d.to ? (d.to + d.ramp - col) / d.ramp : 1
  return lane.row + (d.row - lane.row) * ((1 - Math.cos(Math.PI * k)) / 2)
}

/** The bus: its length, its speed in tiles a second, the column its left end stops at in the bay, how long it stops, and how long the lane is empty before the next. */
export const BUS = { len: BUSTLE_ART['bustle-bus'].w, speed: 6, stopCol: 14.4, stopMs: 1800, gapMs: 2000 }

/** The bus's left end `ms` into its round along the new lane, from off the street's left end to off its right, stopping at the bay; null while the lane is empty. */
export function busAt(ms: number, street: ColSpan): number | null {
  const start = street[0] - BUS.len - 1
  const end = street[1] + 1
  const toStop = ((BUS.stopCol - start) / BUS.speed) * 1000
  const onward = ((end - BUS.stopCol) / BUS.speed) * 1000
  const t = ms % (toStop + BUS.stopMs + onward + BUS.gapMs)
  // clamped either side of the stop, so rounding never steps it back
  if (t < toStop) return Math.min(BUS.stopCol, start + (BUS.speed * t) / 1000)
  if (t < toStop + BUS.stopMs) return BUS.stopCol
  if (t < toStop + BUS.stopMs + onward) return BUS.stopCol + Math.max(0, (BUS.speed * (t - toStop - BUS.stopMs)) / 1000)
  return null
}

/** One light of the street at night: its middle in street tiles and the glow's scale. */
export interface StreetLight {
  col: number
  row: number
  scale: number
}

/** The lights of the pieces bought, lit from 18:30 like the shop's: lamps with a pool on the sidewalk, the carts, the bus shelter, the park's lamps, the market's lanterns and stalls; the sidewalk's only on floor 1. */
export function streetLights(bought: readonly BustleId[], floor: number): StreetLight[] {
  const out: StreetLight[] = []
  for (const id of bought) {
    if (onSidewalk(id) && floor !== 1) continue
    const p = bustlePictures(id, NIGHT_MARKET_OPEN_MIN)
    if (id === 'lamps')
      for (const lamp of p) out.push({ col: lamp.col + LAMP_HEAD.x, row: lamp.row + LAMP_HEAD.y, scale: 0.8 }, { col: lamp.col + LAMP_HEAD.x - 0.2, row: WALK_ROWS.near + 0.1, scale: 1.1 })
    if (id === 'banhMi') out.push({ col: p[0].col + 1.1, row: p[0].row + 0.45, scale: 0.7 })
    if (id === 'sugarcane') out.push({ col: p[0].col + 1, row: p[0].row + 0.5, scale: 0.6 })
    if (id === 'busStop') out.push({ col: p[0].col + 4.1, row: p[0].row + 1.35, scale: 1.2 })
    if (id === 'park') for (const lamp of PARK_LAMPS) out.push({ col: p[0].col + lamp.x, row: p[0].row + lamp.y, scale: 0.8 })
    if (id === 'nightMarket') {
      for (const l of MARKET_LANTERNS) out.push({ col: p[0].col + l.x, row: p[0].row + l.y, scale: 0.3 })
      for (let i = 0; i < 4; i++) out.push({ col: p[0].col + 0.5 + i * 4.4 + 1.9, row: p[0].row + 2.9, scale: 1 })
    }
  }
  return out
}
