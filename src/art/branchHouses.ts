import { TILE } from '../config'
import type { Grid } from '../sim/grid'
import type { PlaceId } from '../sim/places'
import { BEACH_TILES, lifeRing, SAND_PLANKS, seashell } from './beach'
import type { HouseKey, Roof } from './houses'
import { saleTexture } from './houses'
import { silkLantern } from './lantern'
import { PHO_PLANKS, PHO_TILES, shutters } from './oldTown'
import { C } from './palette'
import { f } from './round'
import { glassPane, outline, rect, STREET_TILES, street } from './room'
import { svgDoc } from './svg'
import { CAO_PLANKS, marble } from './uptown'

/** Each branch's roof while a house is for sale, and each house's own colour: the old town's wall, the beach's board band, uptown's trim and marble seam. */
export const BRANCH_HOUSE_LOOK: Record<PlaceId, { roof: Roof; colors: Record<HouseKey, string>; darks: Record<HouseKey, string> }> = {
  oldTown: {
    roof: 'tiles',
    colors: { right1: C.phoHouseMoss, left1: C.phoHouseBlue, right2: C.phoHouseClay, left2: C.phoHouseCream },
    darks: { right1: C.phoHouseMossDark, left1: C.phoHouseBlueDark, right2: C.phoHouseClayDark, left2: C.phoHouseCreamDark },
  },
  beach: {
    roof: 'tin',
    colors: { right1: C.beachHouseCoral, left1: C.beachHouseMint, right2: C.beachHouseSun, left2: C.sea },
    darks: { right1: C.beachHouseCoralDark, left1: C.beachHouseMintDark, right2: C.beachHouseSunDark, left2: C.beachHouseSeaDark },
  },
  uptown: {
    roof: 'flat',
    colors: { right1: C.caoTrimTeal, left1: C.caoTrimSilver, right2: C.caoTrimRose, left2: C.caoTrimLeaf },
    darks: { right1: C.caoTrimTealDark, left1: C.caoTrimSilverDark, right2: C.caoTrimRoseDark, left2: C.caoTrimLeafDark },
  },
}

/** A bought house's width: from the middle of the old wall column to the far side of its outer wall. */
const W = 6.5
/** Where the house's floor ends: the middle of its outer wall column. */
const IN = 6

/** The floor patterns' ids, back and front, as each place's room has them. */
const FLOOR_IDS: Record<PlaceId, [string, string, string]> = {
  oldTown: [`${PHO_PLANKS}${PHO_TILES}`, 'phoplanks', 'photiles'],
  beach: [`${BEACH_TILES}${SAND_PLANKS}`, 'beachtiles', 'sandplanks'],
  uptown: [`${CAO_PLANKS}`, 'caoplanks', 'marble'],
}

/** A small gold-less picture in `frame`: a pale mat, a green hill and a mustard sun. */
function picture(x: number, y: number, frame: string): string {
  return (
    rect(x, y, 1.4, 0.8, frame, `rx="0.05" ${outline(0.04)}`) +
    rect(x + 0.11, y + 0.11, 1.18, 0.58, C.caoMat, outline(0.026)) +
    `<path d="M${f(x + 0.15)},${f(y + 0.63)} Q${f(x + 0.5)},${f(y + 0.25)} ${f(x + 0.75)},${f(y + 0.5)} Q${f(x + 0.98)},${f(y + 0.33)} ${f(x + 1.25)},${f(y + 0.56)}" fill="${C.caoHill}" ${outline(0.026)}/>` +
    `<circle cx="${f(x + 1)}" cy="${f(y + 0.32)}" r="0.09" fill="${C.mustard}" ${outline(0.026)}/>`
  )
}

/** The back wall over the house's six columns and its outer wall, in the place's style and the house's colour, with one thing hung on it. */
function backWall(place: PlaceId, key: HouseKey, col: string, dark: string): string {
  const out: string[] = []
  const w = IN + 0.2
  const near = key.endsWith('1')
  if (place === 'oldTown') {
    out.push(rect(0, 0, w, 2, col, outline()))
    out.push(rect(0, 0, w, 0.26, C.phoWood, outline(0.04)), rect(0, 1.79, w, 0.21, C.phoWood, outline(0.04)))
    out.push(rect(2.9, 0, 0.23, 2, C.phoWood, outline(0.04)))
    out.push(near ? shutters(3.6, 0.55) : silkLantern(4.6, 0.36, C.lantern, 20) + silkLantern(1.5, 0.36, C.tealLight, 20))
  } else if (place === 'beach') {
    out.push(rect(0, 0, w, 2, C.cream, outline()))
    out.push(rect(0, 1.42, w, 0.58, col))
    const boards: string[] = []
    for (let x = 1 / 3; x < w; x += 1 / 3) boards.push(`M${f(x)},1.42 V2`)
    out.push(`<path d="${boards.join(' ')}" stroke="${dark}" stroke-width="0.026"/>`)
    out.push(rect(0, 1.12, w, 0.06, dark), rect(0, 1.24, w, 0.18, dark, outline(0.04)))
    out.push(near ? lifeRing(3, 0.65) : seashell(2.6, 0.9) + seashell(3.1, 0.98, 0.75))
  } else {
    out.push(rect(0, 0, w, 2, C.caoWall, outline()))
    const panels: string[] = []
    for (let x = 1; x < w; x += 1) panels.push(`M${x},0.18 V1.84`)
    out.push(`<path d="${panels.join(' ')}" stroke="${C.caoWallLine}" stroke-width="0.04"/>`)
    out.push(rect(0, 0, w, 0.15, col, outline(0.04)), rect(0, 1.85, w, 0.15, col, outline(0.04)))
    out.push(picture(near ? 2.3 : 3.2, 0.55, col))
  }
  out.push(rect(0, 0, w, 2, 'none', outline()))
  return out.join('')
}

/** Floor 1 of a branch's house: the place's two floors split where its room splits, its back wall in the house's colour, glass across the front, the street. */
function branchHouse(grid: Grid, place: PlaceId, key: HouseKey): string {
  const rows = grid.rows
  const front = rows - 0.45
  const screenRow = grid.decor.screen[0]?.y
  const split = screenRow === undefined ? 2 : screenRow + 0.5
  const look = BRANCH_HOUSE_LOOK[place]
  const col = look.colors[key]
  const dark = look.darks[key]
  const [defs, back, fore] = FLOOR_IDS[place]
  const out: string[] = [`<defs>${defs}${place === 'uptown' ? marble(col) : ''}</defs>`]
  // the patterns start half a tile in, so their tiles sit on the grid's tiles
  const floors: string[] = []
  if (split > 2) floors.push(rect(-0.5, 2, IN, split - 2, `url(#${back})`))
  floors.push(rect(-0.5, split, IN, front - split, `url(#${fore})`))
  out.push(`<g transform="translate(0.5 0)">${floors.join('')}</g>`)
  out.push(rect(0, 2, IN, 0.1, C.ink, 'opacity="0.14"'))
  out.push(`<path d="M0,2 V${front}" stroke="${C.ink}" stroke-width="0.05" opacity="0.35"/>`)
  out.push(backWall(place, key, col, dark))
  out.push(rect(IN, 0, 0.2, rows, place === 'oldTown' ? C.phoWood : dark, outline(0.04)))
  out.push(glassPane(0, IN + 0.2, rows))
  out.push(street(W, rows))
  return svgDoc([0, 0, W, rows + STREET_TILES], TILE, out.join(''))
}

/** Every branch's four houses, 'house-<place>-<key>', drawn for a right-hand house on `grid` (the branch room), and its roof for sale, 'sale-<place>'. */
export function branchHouseTextures(grid: Grid): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [place, look] of Object.entries(BRANCH_HOUSE_LOOK) as [PlaceId, (typeof BRANCH_HOUSE_LOOK)[PlaceId]][]) {
    for (const key of Object.keys(look.colors) as HouseKey[]) out[`house-${place}-${key}`] = branchHouse(grid, place, key)
    out[`sale-${place}`] = saleTexture(look.roof)
  }
  return out
}
