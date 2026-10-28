import { TILE } from '../config'
import type { Grid } from '../sim/grid'
import { C } from './palette'
import { FINE, outline, rect, shopFront, STREET_TILES, street } from './room'
import { svgDoc } from './svg'

const f = (v: number) => +v.toFixed(3)

/** Pale blue tiles checked in half tiles, one to a grid tile. */
const BEACH_TILES =
  `<pattern id="beachtiles" width="1" height="1" patternUnits="userSpaceOnUse">` +
  `<rect width="1" height="1" fill="${C.beachTile}"/>` +
  `<path d="M0,0 H0.5 V0.5 H0Z M0.5,0.5 H1 V1 H0.5Z" fill="${C.beachTileDark}"/>` +
  `<path d="M0,0 H1 V1" fill="none" stroke="${C.beachTileSeam}" stroke-width="${FINE}"/></pattern>`

/** Sand-coloured planks half a tile tall, with staggered joints and a little grain. */
const SAND_PLANKS =
  `<pattern id="sandplanks" width="2" height="1" patternUnits="userSpaceOnUse">` +
  `<rect width="2" height="1" fill="${C.beachPlank}"/>` +
  `<path d="M0,0.02 H2 M0,0.5 H2 M0.77,0 V0.5 M1.77,0 V0.5 M0.26,0.5 V1 M1.26,0.5 V1" stroke="${C.beachPlankLine}" stroke-width="0.04"/>` +
  `<path d="M0.18,0.23 h0.23 M1.41,0.74 h0.28" stroke="${C.beachPlankGrain}" stroke-width="0.025" stroke-linecap="round"/></pattern>`

/** A round window on the sea: a silver frame round sky over water, with one wave. */
function porthole(cx: number, cy: number, id: string): string {
  const r = 0.27
  return (
    `<circle cx="${cx}" cy="${cy}" r="0.385" fill="${C.silver}" ${outline()}/>` +
    `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    `<g clip-path="url(#${id})">${rect(f(cx - r), f(cy - r), 2 * r, r, C.glass)}${rect(f(cx - r), cy, 2 * r, r, C.sea)}` +
    `<path d="M${f(cx - r)},${f(cy + 0.08)} q${r / 2},-0.064 ${r},0 q${r / 2},0.064 ${r},0" fill="none" stroke="${C.cream}" stroke-width="0.04"/></g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${outline(0.04)}/>`
  )
}

/** A life ring on the wall, red and cream by quarters. */
function lifeRing(cx: number, cy: number): string {
  const r = 0.3
  const dash = f((2 * Math.PI * r) / 8)
  const ring = (stroke: string, w: number, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${w}" ${extra}/>`
  return ring(C.ink, 0.25) + ring(C.cream, 0.18) + ring(C.lantern, 0.18, `stroke-dasharray="${dash} ${dash}"`)
}

/** A scallop shell hung by its hinge at (x, y), its fan above. */
const seashell = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})">` +
  `<path d="M0,0 l-0.205,-0.333 q0.205,-0.154 0.41,0Z" fill="${C.seashell}" ${outline(0.04)}/>` +
  `<path d="M0,0 l-0.103,-0.359 M0,0 v-0.385 M0,0 l0.103,-0.359" stroke="${C.ink}" stroke-width="0.025"/></g>`

/**
 * The beach branch's floor 1, drawn like the 'room' texture: pale blue tiles in the service room and sand-coloured planks
 * from the middle of the screen row; a white wall with sea-blue stripes, two round windows on the sea, a life ring and
 * a few shells; pale blue side walls; and the main room's shop front and street.
 */
export function beachRoomTexture(grid: Grid): string {
  const cols = grid.cols
  const rows = grid.rows
  const front = rows - 0.45
  const screenRow = grid.decor.screen[0]?.y
  const split = screenRow === undefined ? 2 : screenRow + 0.5
  const out: string[] = [`<defs>${BEACH_TILES}${SAND_PLANKS}</defs>`]

  // floors: tiles in the service room, planks from the middle of the screen row to the shop front
  if (split > 2) out.push(rect(0.5, 2, cols - 1, split - 2, 'url(#beachtiles)'))
  out.push(rect(0.5, split, cols - 1, front - split, 'url(#sandplanks)'))
  out.push(rect(0.5, 2, cols - 1, 0.1, C.ink, 'opacity="0.14"'))

  // back wall: white over pale blue boards, two sea-blue stripes between
  out.push(rect(0.3, 0, cols - 0.6, 2, C.cream, outline()))
  out.push(rect(0.3, 1.42, cols - 0.6, 0.58, C.seaWash))
  const boards: string[] = []
  for (let x = 0.3 + 1 / 3; x < cols - 0.3; x += 1 / 3) boards.push(`M${f(x)},1.42 V2`)
  out.push(`<path d="${boards.join(' ')}" stroke="${C.seaWashLine}" stroke-width="0.026"/>`)
  out.push(rect(0.3, 1.12, cols - 0.6, 0.06, C.sea), rect(0.3, 1.24, cols - 0.6, 0.18, C.sea, outline(0.04)))
  out.push(rect(0.3, 0, cols - 0.6, 2, 'none', outline()))

  // on the wall: the life ring and a shell at the left, two shells in the middle, the windows on the sea at the right
  out.push(lifeRing(1.2, 0.72), seashell(2.25, 0.95))
  out.push(seashell(6.3, 0.9), seashell(6.75, 0.98, 0.75))
  out.push(porthole(9.85, 0.75, 'porthole1'), porthole(11.15, 0.75, 'porthole2'))

  // side walls
  out.push(rect(0.3, 0, 0.2, rows, C.seaWall, outline(0.04)))
  out.push(rect(cols - 0.5, 0, 0.2, rows, C.seaWall, outline(0.04)))

  out.push(shopFront(cols, rows, grid.door.x))
  out.push(street(cols, rows))
  return svgDoc([0, 0, cols, rows + STREET_TILES], TILE, out.join(''))
}
