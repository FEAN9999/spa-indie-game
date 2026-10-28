import { TILE } from '../config'
import type { Grid } from '../sim/grid'
import { silkLantern } from './lantern'
import { C } from './palette'
import { f } from './round'
import { FINE, outline, rect, shopFront, STREET_TILES, street } from './room'
import { svgDoc } from './svg'

/** Dark wood planks a quarter tile tall, with staggered joints and a little grain. */
const PHO_PLANKS =
  `<pattern id="phoplanks" width="2" height="0.5" patternUnits="userSpaceOnUse">` +
  `<rect width="2" height="0.5" fill="${C.phoPlank}"/>` +
  `<path d="M0,0.01 H2 M0.64,0 V0.5 M1.59,0 V0.5" stroke="${C.phoPlankLine}" stroke-width="0.04"/>` +
  `<path d="M0.15,0.26 h0.31 M1.03,0.2 h0.26" stroke="${C.phoPlankGrain}" stroke-width="0.025" stroke-linecap="round"/></pattern>`

/** Gạch tàu: terracotta squares, a darker pair on the diagonal, with a couple of specks. */
const PHO_TILES =
  `<pattern id="photiles" width="1.333" height="1.333" patternUnits="userSpaceOnUse">` +
  `<rect width="1.333" height="1.333" fill="${C.phoTile}"/>` +
  `<path d="M0.667,0 H1.333 V0.667 H0.667Z M0,0.667 H0.667 V1.333 H0Z" fill="${C.phoTileDark}"/>` +
  `<path d="M0,0 H1.333 M0,0.667 H1.333 M0,0 V1.333 M0.667,0 V1.333" stroke="${C.phoTileSeam}" stroke-width="${FINE}"/>` +
  `<circle cx="0.256" cy="0.385" r="0.026" fill="${C.phoTileSpeck}"/><circle cx="1.026" cy="0.949" r="0.026" fill="${C.phoTileSpeck}"/></pattern>`

/** The seven lanterns' silk, in turn along the string; no mustard, which would vanish on the yellow wall. */
const STRING_SILK = [C.lantern, C.tealLight, C.lotus, C.lantern, C.tealLight, C.lotus, C.lantern]

/** A cord sagging across the wall, with seven silk lanterns hung along it. */
function lanternString(cols: number): string {
  const [x0, x1, yEnd, yCtl] = [0.45, cols - 0.45, 0.45, 1.1]
  const out = [`<path d="M${x0},${yEnd} Q${f(cols / 2)},${yCtl} ${x1},${yEnd}" fill="none" stroke="${C.ink}" stroke-width="0.04"/>`]
  STRING_SILK.forEach((col, i) => {
    const t = (i + 0.5) / STRING_SILK.length
    const y = (1 - t) * (1 - t) * yEnd + 2 * t * (1 - t) * yCtl + t * t * yEnd
    out.push(silkLantern(x0 + (x1 - x0) * t, y + 0.1, col, 20))
  })
  return out.join('')
}

/** A shuttered window: a dark frame with two wooden leaves, each slatted four times. */
function shutters(x: number, y: number): string {
  const out = [rect(x, y, 1.69, 0.82, C.deepBrown, outline(0.05))]
  for (const lx of [x + 0.077, x + 0.885]) {
    out.push(rect(lx, y + 0.077, 0.73, 0.667, C.woodDark, outline(0.04)))
    for (let k = 1; k < 5; k++) out.push(`<path d="M${f(lx + 0.05)},${f(y + 0.077 + k * 0.133)} H${f(lx + 0.68)}" stroke="${C.ink}" stroke-width="0.026"/>`)
  }
  return out.join('')
}

/**
 * The old town branch's floor 1, drawn like the 'room' texture: dark wood planks in the service room and gạch tàu tiles
 * from the middle of the screen row; a Hội An yellow wall with weathered patches, dark wood beams and posts, a shuttered
 * window and a string of silk lanterns; dark wood side walls; and the main room's shop front and street.
 */
export function oldTownRoomTexture(grid: Grid): string {
  const cols = grid.cols
  const rows = grid.rows
  const front = rows - 0.45
  const screenRow = grid.decor.screen[0]?.y
  const split = screenRow === undefined ? 2 : screenRow + 0.5
  const out: string[] = [`<defs>${PHO_PLANKS}${PHO_TILES}</defs>`]

  // floors: planks in the service room, tiles from the middle of the screen row to the shop front
  if (split > 2) out.push(rect(0.5, 2, cols - 1, split - 2, 'url(#phoplanks)'))
  out.push(rect(0.5, split, cols - 1, front - split, 'url(#photiles)'))
  out.push(rect(0.5, 2, cols - 1, 0.1, C.ink, 'opacity="0.14"'))

  // back wall: yellow with weathered patches, a dark wood beam top and bottom and posts between
  out.push(rect(0.3, 0, cols - 0.6, 2, C.phoWall, outline()))
  for (const [x, y, rx, ry] of [[2.2, 1.5, 0.9, 0.28], [6.2, 0.6, 0.51, 0.18], [10.8, 1.6, 0.77, 0.23], [4.4, 1.75, 0.38, 0.13]]) {
    out.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.phoWallPatch}" opacity="0.7"/>`)
  }
  out.push(rect(0.3, 0, cols - 0.6, 0.26, C.phoWood, outline(0.04)), rect(0.3, 1.79, cols - 0.6, 0.21, C.phoWood, outline(0.04)))
  for (const x of [0.3, 3.4, 9.3, cols - 0.53]) out.push(rect(x, 0, 0.23, 2, C.phoWood, outline(0.04)))
  out.push(rect(0.3, 0, cols - 0.6, 2, 'none', outline()))

  // on the wall: the shuttered window at the right, the string of lanterns across
  out.push(shutters(9.9, 0.55), lanternString(cols))

  // side walls
  out.push(rect(0.3, 0, 0.2, rows, C.phoWood, outline(0.04)))
  out.push(rect(cols - 0.5, 0, 0.2, rows, C.phoWood, outline(0.04)))

  out.push(shopFront(cols, rows, grid.door.x))
  out.push(street(cols, rows))
  return svgDoc([0, 0, cols, rows + STREET_TILES], TILE, out.join(''))
}
