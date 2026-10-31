import { TILE } from '../config'
import type { Grid } from '../sim/grid'
import { C } from './palette'
import { f } from './round'
import { outline, rect, shopFront, STREET_TILES, street } from './room'
import { svgDoc } from './svg'

/** Light wood planks a quarter tile tall, with staggered joints. */
export const CAO_PLANKS =
  `<pattern id="caoplanks" width="3" height="0.5" patternUnits="userSpaceOnUse">` +
  `<rect width="3" height="0.5" fill="${C.caoPlank}"/>` +
  `<path d="M0,0.01 H3 M1.15,0 V0.5 M2.56,0 V0.5" stroke="${C.caoPlankLine}" stroke-width="0.032"/></pattern>`

/** White marble in two-tile slabs: a `seam` coloured seam along two edges, a grey one through the middle, and a few grey veins. */
export const marble = (seam: string): string =>
  `<pattern id="marble" width="2" height="2" patternUnits="userSpaceOnUse">` +
  `<rect width="2" height="2" fill="${C.marble}"/>` +
  `<path d="M0,0 H2 M0,0 V2" stroke="${seam}" stroke-width="0.05"/>` +
  `<path d="M1,0 V2 M0,1 H2" stroke="${C.marbleSeam}" stroke-width="0.026"/>` +
  `<path d="M0.1,0.51 Q0.51,0.28 0.74,0.59 T1.33,0.77 M1.23,1.41 Q1.54,1.23 1.92,1.51 M0.26,1.54 Q0.46,1.28 0.82,1.44" stroke="${C.marbleVein}" stroke-width="0.032" fill="none"/></pattern>`

/** The uptown room's marble, with gold seams. */
export const MARBLE = marble(C.caoGoldLight)

/** The glass wall onto three towers: sky, towers with rows of lit windows, and gold mullions between the panes. */
function glassWall(x: number, y: number, w: number, h: number): string {
  const out = [rect(x, y, w, h, C.caoGlass, outline(0.05))]
  for (const [tx, tw, th, col] of [[0.08, 0.5, 0.9, C.towerFar], [0.62, 0.42, 0.7, C.towerNear], [1.1, 0.6, 1.05, C.towerMid], [1.76, 0.6, 0.8, C.towerNear]] as const) {
    const top = y + h - th * 0.98
    out.push(rect(f(x + tx), f(top), tw, f(th * 0.98), col, `stroke="${C.ink}" stroke-width="0.026"`))
    for (let yy = top + 0.13; yy < y + h - 0.1; yy += 0.18) {
      out.push(`<path d="M${f(x + tx + 0.1)},${f(yy)} h${f(tw - 0.2)}" stroke="${C.caoGlassShine}" stroke-width="0.038" stroke-dasharray="0.077 0.077"/>`)
    }
  }
  for (let k = 1; k < 3; k++) out.push(`<path d="M${f(x + (w * k) / 3)},${y} V${f(y + h)}" stroke="${C.caoGold}" stroke-width="0.064"/>`)
  out.push(rect(x, y, w, h, 'none', `stroke="${C.caoGold}" stroke-width="0.077"`), rect(x - 0.04, y - 0.04, w + 0.08, h + 0.08, 'none', outline(0.04)))
  return out.join('')
}

/** A gold-framed landscape: a pale mat, a green hill and a mustard sun. */
function landscape(x: number, y: number): string {
  return (
    rect(x, y, 1.92, 0.97, C.caoGold, `rx="0.05" ${outline(0.04)}`) +
    rect(x + 0.13, y + 0.13, 1.67, 0.72, C.caoMat, outline(0.026)) +
    `<path d="M${f(x + 0.18)},${f(y + 0.77)} Q${f(x + 0.64)},${f(y + 0.31)} ${f(x + 0.97)},${f(y + 0.64)} Q${f(x + 1.28)},${f(y + 0.41)} ${f(x + 1.74)},${f(y + 0.69)}" fill="${C.caoHill}" ${outline(0.026)}/>` +
    `<circle cx="${f(x + 1.38)}" cy="${f(y + 0.4)}" r="0.115" fill="${C.mustard}" ${outline(0.026)}/>`
  )
}

/**
 * The uptown branch's floor 1, drawn like the 'room' texture: light wood in the service room and white marble with gold
 * seams from the middle of the screen row; a cream panelled wall with gold trim, a framed landscape at the left and a
 * glass wall onto three towers at the right; gold side walls; and the main room's shop front and street.
 */
export function uptownRoomTexture(grid: Grid): string {
  const cols = grid.cols
  const rows = grid.rows
  const front = rows - 0.45
  const screenRow = grid.decor.screen[0]?.y
  const split = screenRow === undefined ? 2 : screenRow + 0.5
  const out: string[] = [`<defs>${CAO_PLANKS}${MARBLE}</defs>`]

  // floors: wood in the service room, marble from the middle of the screen row to the shop front
  if (split > 2) out.push(rect(0.5, 2, cols - 1, split - 2, 'url(#caoplanks)'))
  out.push(rect(0.5, split, cols - 1, front - split, 'url(#marble)'))
  out.push(rect(0.5, 2, cols - 1, 0.1, C.ink, 'opacity="0.14"'))

  // back wall: cream panels one tile wide, gold trim top and bottom
  out.push(rect(0.3, 0, cols - 0.6, 2, C.caoWall, outline()))
  const panels: string[] = []
  for (let x = 1.3; x < cols - 0.3; x += 1) panels.push(`M${f(x)},0.18 V1.84`)
  out.push(`<path d="${panels.join(' ')}" stroke="${C.caoWallLine}" stroke-width="0.04"/>`)
  out.push(rect(0.3, 0, cols - 0.6, 0.15, C.caoGold, outline(0.04)), rect(0.3, 1.85, cols - 0.6, 0.15, C.caoGold, outline(0.04)))
  out.push(rect(0.3, 0, cols - 0.6, 2, 'none', outline()))

  // on the wall: the landscape at the left, the glass wall at the right
  out.push(landscape(1, 0.5), glassWall(9.9, 0.4, 2.45, 1.2))

  // side walls
  out.push(rect(0.3, 0, 0.2, rows, C.caoGold, outline(0.04)))
  out.push(rect(cols - 0.5, 0, 0.2, rows, C.caoGold, outline(0.04)))

  out.push(shopFront(cols, rows, grid.door.x))
  out.push(street(cols, rows))
  return svgDoc([0, 0, cols, rows + STREET_TILES], TILE, out.join(''))
}
