import { FLOOR_ROWS, TILE } from '../config'
import type { House } from '../sim/layout'
import { pot, shutterWindow } from './floors'
import { C } from './palette'
import { FINE, GACH_BONG, gachBongTile, glassPane, outline, PLANKS, rect, street, STREET_TILES } from './room'
import { svgDoc } from './svg'

export type HouseKey = 'left1' | 'left2' | 'right1' | 'right2'

/** Each neighbour house's wall, its dark band, its gạch bông (base, corners, flower) and its roof while it is for sale. */
/** A house for sale's roof: corrugated tin, terracotta tiles, or flat concrete with a water tank. */
export type Roof = 'tin' | 'tiles' | 'flat'

export const HOUSE_LOOK: Record<HouseKey, { wall: string; wallDark: string; tiles: [string, string, string]; roof: 'tin' | 'tiles' }> = {
  right1: { wall: C.houseRose, wallDark: C.houseRoseDark, tiles: [C.tile, C.teal, C.lotus], roof: 'tin' },
  left1: { wall: C.houseSky, wallDark: C.houseSkyDark, tiles: [C.cream, C.cobalt, C.terracotta], roof: 'tiles' },
  right2: { wall: C.houseLilac, wallDark: C.houseLilacDark, tiles: [C.cream, C.lotus, C.teal], roof: 'tiles' },
  left2: { wall: C.houseLeaf, wallDark: C.houseLeafDark, tiles: [C.cream, C.wood, C.cobalt], roof: 'tin' },
}

export const houseKey = (h: House): HouseKey => `${h.side}${h.n}`

const ROWS = FLOOR_ROWS
/** A bought house's width: from the middle of the old wall column to the far side of its outer wall. */
const W = 6.5
/** Where the house's floor ends: the middle of its outer wall column. */
const IN = 6

/** Floor 1: the house's back wall and gạch bông, a seam on the old wall line, glass across the front, the street. */
function floor1(look: (typeof HOUSE_LOOK)[HouseKey]): string {
  const [base, corner, flower] = look.tiles
  // the pattern starts half a tile in, so its tiles sit on the grid's tiles
  const tile = `<pattern id="housetile" width="1" height="1" x="0.5" patternUnits="userSpaceOnUse" viewBox="0 0 24 24">${gachBongTile(base, corner, flower)}</pattern>`
  const out: string[] = [`<defs>${tile}</defs>`]
  out.push(rect(0, 2, IN, ROWS - 2.45, 'url(#housetile)'), rect(0, 2, IN, 0.1, C.ink, 'opacity="0.14"'))
  out.push(`<path d="M0,2 V${ROWS - 0.45}" stroke="${C.ink}" stroke-width="0.05" opacity="0.35"/>`)
  out.push(rect(0, 0, IN + 0.2, 2, look.wall, outline()), rect(0, 1.65, IN + 0.2, 0.35, look.wallDark, outline(0.04)))
  out.push(shutterWindow(IN / 2))
  out.push(rect(IN, 0, 0.2, ROWS, look.wallDark, outline(0.04)))
  out.push(glassPane(0, IN + 0.2, ROWS))
  out.push(street(W, ROWS))
  return svgDoc([0, 0, W, ROWS + STREET_TILES], TILE, out.join(''))
}

/** Floor 2: planks, a shuttered window in the house's wall, one glass door onto the shop's balcony, the road below. */
function floor2(look: (typeof HOUSE_LOOK)[HouseKey]): string {
  const out: string[] = [`<defs>${GACH_BONG}${PLANKS}</defs>`]
  out.push(rect(0, 2, IN, ROWS - 2.45, 'url(#planks)'), rect(0, 2, IN, 0.1, C.ink, 'opacity="0.14"'))
  out.push(rect(0, 0, IN + 0.2, 2, look.wall, outline()), rect(0, 1.65, IN + 0.2, 0.35, look.wallDark, outline(0.04)))
  out.push(shutterWindow(IN / 2))
  out.push(rect(IN, 0, 0.2, ROWS, look.wallDark, outline(0.04)))
  out.push(rect(0, ROWS - 0.45, IN + 0.2, 0.45, look.wallDark, outline(0.04)))
  out.push(rect(2, ROWS - 0.4, 2, 0.36, C.glass, outline(FINE)), `<path d="M3,${ROWS - 0.4} V${ROWS - 0.04}" ${outline(FINE)}/>`)
  out.push(rect(0, ROWS, IN + 0.2, 1.1, 'url(#gachbong)'), pot(1.2, ROWS + 0.35), pot(4.8, ROWS + 0.35))
  const bars: string[] = []
  for (let x = 0.25; x < IN + 0.2; x += 0.3) bars.push(`M${x.toFixed(2)},${ROWS + 1.12} V${ROWS + 1.8}`)
  out.push(`<path d="${bars.join(' ')}" stroke="${C.ink}" stroke-width="0.045"/>`, rect(0, ROWS + 1, IN + 0.2, 0.12, C.ink), rect(0, ROWS + 1.8, IN + 0.2, 0.08, C.ink))
  out.push(rect(0, ROWS + 1.88, W, STREET_TILES - 1.88, C.road))
  return svgDoc([0, 0, W, ROWS + STREET_TILES], TILE, out.join(''))
}

/** The rooftop: sky, gạch tàu, parapets in the house's wall with a terracotta cap, tin over the street. */
function floor3(look: (typeof HOUSE_LOOK)[HouseKey]): string {
  const tau =
    `<pattern id="gachtau" width="1" height="1" x="0.5" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="${C.gachTauBase}"/>` +
    `<rect x="0.035" y="0.035" width="0.93" height="0.93" fill="${C.gachTauFace}"/>` +
    `<path d="M0.16,0.2 h0.26" stroke="${C.gachTauGlint}" stroke-width="0.045" stroke-linecap="round"/></pattern>`
  const out: string[] = [`<defs>${tau}</defs>`]
  out.push(rect(0, 0, W, 2, C.glass), `<ellipse cx="3.6" cy="0.4" rx="0.8" ry="0.17" fill="${C.cloud}" opacity="0.8"/>`)
  out.push(rect(0, 2, IN, ROWS - 2.45, 'url(#gachtau)'), rect(0, 2, IN, 0.12, C.ink, 'opacity="0.12"'))
  out.push(rect(0, 1.45, IN + 0.2, 0.55, look.wall, outline(0.045)), rect(0, 1.4, IN + 0.2, 0.12, C.terracotta, outline(0.035)))
  out.push(rect(IN, 1.45, 0.2, ROWS - 1.45, look.wall, outline(0.04)))
  out.push(rect(0, ROWS, W, STREET_TILES, C.tin))
  const corrugation: string[] = []
  for (let x = 0.15; x < W; x += 0.3) corrugation.push(`M${x.toFixed(2)},${ROWS} V${ROWS + STREET_TILES}`)
  out.push(`<path d="${corrugation.join(' ')}" stroke="${C.tinRib}" stroke-width="0.05"/>`)
  out.push(rect(0, ROWS - 0.45, IN + 0.2, 0.5, look.wall, outline(0.045)), rect(0, ROWS - 0.5, IN + 0.2, 0.12, C.terracotta, outline(0.035)))
  return svgDoc([0, 0, W, ROWS + STREET_TILES], TILE, out.join(''))
}

/** Where a house for sale's roof ends and its roller shutter starts. */
const EAVE = 16.6

/** A house for sale over its own six columns: its tin, tile or flat roof, a closed roller shutter, the street. */
export function saleTexture(roof: Roof): string {
  const w = 6
  const out: string[] = []
  if (roof === 'tin') {
    out.push(rect(0, 0, w, EAVE, C.tin, outline()))
    const ribs: string[] = []
    for (let x = 0.2; x < w; x += 0.4) ribs.push(`M${x.toFixed(2)},0 V${EAVE}`)
    out.push(`<path d="${ribs.join(' ')}" stroke="${C.tinRib}" stroke-width="0.07"/>`)
  } else if (roof === 'flat') {
    out.push(rect(0, 0, w, EAVE, C.roofConcrete, outline()))
    const joints: string[] = []
    for (let x = 1.5; x < w; x += 1.5) joints.push(`M${x},0 V${EAVE}`)
    for (let y = 1.5; y < EAVE; y += 1.5) joints.push(`M0,${y} H${w}`)
    out.push(`<path d="${joints.join(' ')}" stroke="${C.roofConcreteLine}" stroke-width="0.04"/>`)
    // the parapet round the edge, then a small water tank on legs at the back
    const p = 0.3
    out.push(rect(0, 0, w, p, C.silver, outline(0.04)), rect(0, EAVE - p, w, p, C.silver, outline(0.04)))
    out.push(rect(0, 0, p, EAVE, C.silver, outline(0.04)), rect(w - p, 0, p, EAVE, C.silver, outline(0.04)))
    out.push(rect(3.3, 1.9, 1.7, 0.25, C.roofConcreteLine, outline(0.03)))
    out.push(rect(3.45, 0.75, 1.4, 1.3, C.tank, `rx="0.35" ${outline(0.045)}`))
    out.push(`<path d="M3.5,1.15 H4.8 M3.5,1.55 H4.8" stroke="${C.tankRib}" stroke-width="0.05"/>`)
  } else {
    out.push(rect(0, 0, w, EAVE, C.terracotta, outline()))
    const courses: string[] = []
    for (let y = 0.5, row = 0; y < EAVE; y += 0.5, row++) {
      courses.push(`M0,${y.toFixed(2)} H${w}`)
      for (let x = row % 2 ? 0.25 : 0.5; x < w; x += 0.5) courses.push(`M${x.toFixed(2)},${(y - 0.5).toFixed(2)} V${y.toFixed(2)}`)
    }
    out.push(`<path d="${courses.join(' ')}" stroke="${C.lanternDark}" stroke-width="0.045"/>`)
  }
  out.push(rect(0, EAVE - 0.18, w, 0.18, C.ink, 'opacity="0.25"'))
  out.push(rect(0, EAVE, w, ROWS - EAVE, C.silver, outline(0.04)))
  const slats: string[] = []
  for (let y = EAVE + 0.14; y < ROWS; y += 0.14) slats.push(`M0.1,${y.toFixed(2)} H${w - 0.1}`)
  out.push(`<path d="${slats.join(' ')}" stroke="${C.tankRib}" stroke-width="0.035"/>`)
  out.push(street(w, ROWS))
  return svgDoc([0, 0, w, ROWS + STREET_TILES], TILE, out.join(''))
}

/** Every house's three floors, 'house-<key>-<floor>', drawn for a right-hand house, and its roof for sale, 'sale-<key>'. */
export function houseTextures(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, look] of Object.entries(HOUSE_LOOK) as [HouseKey, (typeof HOUSE_LOOK)[HouseKey]][]) {
    out[`house-${key}-1`] = floor1(look)
    out[`house-${key}-2`] = floor2(look)
    out[`house-${key}-3`] = floor3(look)
    out[`sale-${key}`] = saleTexture(look.roof)
  }
  return out
}
