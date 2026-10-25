import { TILE } from '../config'
import type { Grid } from '../sim/grid'
import { C } from './palette'
import { svgDoc } from './svg'

/** Street strip below the front wall, in tiles. */
export const STREET_TILES = 2

const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`

const LINE = 0.05
const FINE = 0.03
const outline = (w = LINE) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`

/** One gạch bông per grid tile: the board's 24-unit pattern scaled into a 1×1 tile. */
const GACH_BONG =
  `<pattern id="gachbong" width="1" height="1" patternUnits="userSpaceOnUse" viewBox="0 0 24 24">` +
  `<rect width="24" height="24" fill="${C.tile}"/>` +
  `<path d="M0,0 h6 a6,6 0 0 1 -6,6Z M24,0 v6 a6,6 0 0 1 -6,-6Z M0,24 v-6 a6,6 0 0 1 6,6Z M24,24 h-6 a6,6 0 0 1 6,-6Z" fill="${C.terracotta}"/>` +
  `<path d="M12,4.5 Q15.2,9 12,12 Q8.8,9 12,4.5Z M19.5,12 Q15,15.2 12,12 Q15,8.8 19.5,12Z M12,19.5 Q8.8,15 12,12 Q15.2,15 12,19.5Z M4.5,12 Q9,8.8 12,12 Q9,15.2 4.5,12Z" fill="${C.teal}"/>` +
  `<circle cx="12" cy="12" r="1.7" fill="${C.mustard}"/>` +
  `<path d="M12,0 L13.4,1.6 L12,3.2 L10.6,1.6Z M12,24 L13.4,22.4 L12,20.8 L10.6,22.4Z M0,12 L1.6,10.6 L3.2,12 L1.6,13.4Z M24,12 L22.4,10.6 L20.8,12 L22.4,13.4Z" fill="${C.mustard}"/>` +
  `<rect width="24" height="24" fill="none" stroke="${C.tileSeam}" stroke-width="0.6"/></pattern>`

/** Wood planks 0.5 tile tall with staggered joints. */
const PLANKS =
  `<pattern id="planks" width="3.2" height="1" patternUnits="userSpaceOnUse" x="0.5" y="2">` +
  `<rect width="3.2" height="1" fill="${C.plank}"/>` +
  `<path d="M0,0.5 H3.2 M0,1 H3.2 M1,0 V0.5 M2.6,0.5 V1" stroke="${C.plankLine}" stroke-width="${FINE}"/></pattern>`

/** Woven chiếu cói for the runner and the waiting-area mat. */
const MAT =
  `<pattern id="mat" width="0.28" height="0.28" patternUnits="userSpaceOnUse">` +
  `<rect width="0.28" height="0.28" fill="${C.mat}"/>` +
  `<path d="M0,0.07 H0.28 M0,0.21 H0.28" stroke="${C.matLine}" stroke-width="0.035"/></pattern>`

function lantern(x: number): string {
  return (
    `<g ${outline(0.035)}>` +
    `<path d="M${x},0 V0.22" stroke-width="0.03"/>` +
    rect(x - 0.12, 0.2, 0.24, 0.09, C.mustard, 'rx="0.03"') +
    `<ellipse cx="${x}" cy="0.55" rx="0.28" ry="0.27" fill="${C.lantern}"/>` +
    `<path d="M${x - 0.14},0.32 Q${x - 0.21},0.55 ${x - 0.14},0.78 M${x + 0.14},0.32 Q${x + 0.21},0.55 ${x + 0.14},0.78 M${x},0.29 V0.81" stroke="${C.lanternDark}" stroke-width="0.025" fill="none"/>` +
    rect(x - 0.12, 0.79, 0.24, 0.09, C.mustard, 'rx="0.03"') +
    `<path d="M${x - 0.06},0.88 V1.06 M${x},0.88 V1.1 M${x + 0.06},0.88 V1.06" stroke="${C.mustard}" stroke-width="0.035"/>` +
    `</g>`
  )
}

function louvreWindow(cx: number): string {
  const x = cx - 0.75
  const slats: string[] = []
  for (let y = 0.45; y < 1.2; y += 0.17) slats.push(`M${x + 0.13},${y} H${x + 0.62} M${x + 0.88},${y} H${x + 1.37}`)
  return (
    rect(x, 0.3, 1.5, 1.0, C.tealLight, `rx="0.05" ${outline(0.04)}`) +
    `<path d="M${cx},0.3 V1.3" ${outline(0.04)}/>` +
    `<path d="${slats.join(' ')}" stroke="${C.tealDark}" stroke-width="0.055" stroke-linecap="round"/>`
  )
}

function clock(cx: number): string {
  return (
    `<circle cx="${cx}" cy="0.9" r="0.3" fill="${C.cream}" ${outline(0.045)}/>` +
    `<path d="M${cx},0.9 V0.72 M${cx},0.9 H${cx + 0.13}" stroke="${C.ink}" stroke-width="0.04" stroke-linecap="round"/>`
  )
}

/** Dashed outline where a bed could go, with a "+" on its middle tile. */
function bedSlot(x: number, y: number): string {
  const cx = x + 0.5
  const cy = y + 1.5
  return (
    `<g fill="${C.cream}" fill-opacity="0.4" stroke="${C.ink}" stroke-opacity="0.5" stroke-width="0.04" stroke-dasharray="0.12 0.09">` +
    `<rect x="${x - 0.05}" y="1.3" width="1.1" height="0.6" rx="0.2"/>` +
    `<rect x="${x - 0.05}" y="1.9" width="1.1" height="${y + 3 - 1.9}" rx="0.15"/></g>` +
    `<circle cx="${cx}" cy="${cy}" r="0.3" fill="${C.cream}" stroke="${C.terracotta}" stroke-width="0.05"/>` +
    `<path d="M${cx},${cy - 0.17} V${cy + 0.17} M${cx - 0.17},${cy} H${cx + 0.17}" stroke="${C.terracotta}" stroke-width="0.06" stroke-linecap="round"/>`
  )
}

/** Glass shop front either side of the door, with mullions, glints, door posts and a doormat. */
function shopFront(cols: number, rows: number, doorX: number): string {
  const y = rows - 0.45
  const h = 0.45
  const out: string[] = []
  for (const [x0, x1] of [[0.3, doorX], [doorX + 1, cols - 0.3]]) {
    out.push(rect(x0, y, x1 - x0, h, C.glass, outline(0.04)))
    const mullions: string[] = []
    for (let x = x0 + 0.7; x < x1 - 0.1; x += 0.7) mullions.push(`M${x},${y} V${y + h}`)
    out.push(`<path d="${mullions.join(' ')}" stroke="${C.tealLight}" stroke-width="0.06"/>`)
    out.push(`<path d="M${x0 + 0.03},${y + 0.04} H${x1 - 0.03}" stroke="${C.tealLight}" stroke-width="0.09"/>`)
    out.push(`<path d="M${x0 + 0.25},${y + 0.38} l0.2,-0.28 M${x0 + 2.9},${y + 0.38} l0.2,-0.28" stroke="#ffffff" stroke-width="0.04" opacity="0.85"/>`)
  }
  out.push(rect(doorX + 0.1, rows - 0.3, 0.8, 0.26, C.terracotta, `rx="0.05" ${outline(FINE)}`))
  out.push(rect(doorX - 0.12, y - 0.15, 0.2, 0.68, C.wood, `rx="0.05" ${outline(0.035)}`))
  out.push(rect(doorX + 0.92, y - 0.15, 0.2, 0.68, C.wood, `rx="0.05" ${outline(0.035)}`))
  return out.join('')
}

/** The whole floor in tile units: wood service room, gạch bông front, mats, walls, bed slots, shop front, street. */
function roomBody(grid: Grid): string {
  const cols = grid.cols
  const rows = grid.rows
  const door = grid.door
  const front = rows - 0.45
  const screenRow = grid.decor.screen[0]?.y
  const split = screenRow === undefined ? 2 : screenRow + 0.5
  const out: string[] = [`<defs>${GACH_BONG}${PLANKS}${MAT}</defs>`]

  // floors: planks in the service room, gạch bông from the middle of the screen row to the shop front
  if (split > 2) out.push(rect(0.5, 2, cols - 1, split - 2, 'url(#planks)'))
  out.push(rect(0.5, split, cols - 1, front - split, 'url(#gachbong)'))
  out.push(rect(0.5, 2, cols - 1, 0.1, C.ink, 'opacity="0.14"'))

  // runner from the shop front to the screen opening
  const runnerTop = screenRow === undefined ? 2 : screenRow + 1
  out.push(rect(door.x + 0.1, runnerTop, 0.8, front - runnerTop, 'url(#mat)', outline(FINE)))
  out.push(`<path d="M${door.x + 0.22},${runnerTop} V${front} M${door.x + 0.78},${runnerTop} V${front}" stroke="${C.terracotta}" stroke-width="0.05"/>`)

  // mat under the bench and the tea table
  if (grid.seats.length) {
    const xs = grid.seats.map(s => s.x)
    const x = Math.min(...xs) - 0.4
    const w = Math.max(...xs) + 1.4 - x
    const y = grid.seats[0].y - 0.2
    out.push(rect(x, y, w, 3.1, 'url(#mat)', `rx="0.1" ${outline(0.035)}`))
    out.push(rect(x + 0.12, y + 0.12, w - 0.24, 2.86, 'none', `rx="0.06" stroke="${C.terracotta}" stroke-width="0.06"`))
  }

  // back wall with its louvre window, clock and lanterns over the work tiles
  out.push(rect(0.3, 0, cols - 0.6, 2, C.wall, outline()))
  out.push(rect(0.3, 1.65, cols - 0.6, 0.35, C.wallDark, outline(0.04)))
  const cabinet = grid.decor.cabinet
  if (cabinet.length) out.push(louvreWindow((cabinet[0].x + cabinet[cabinet.length - 1].x + 1) / 2))
  out.push(clock(cols / 2))
  for (const w of grid.works) out.push(lantern(w.x + 0.5))

  for (const s of grid.bedSlots) out.push(bedSlot(s.x, s.y))

  // side walls
  out.push(rect(0.3, 0, 0.2, rows, C.wallDark, outline(0.04)))
  out.push(rect(cols - 0.5, 0, 0.2, rows, C.wallDark, outline(0.04)))

  out.push(shopFront(cols, rows, door.x))

  // street: sidewalk and road
  out.push(rect(0, rows, cols, 1.2, C.sidewalk))
  const joints: string[] = []
  for (let x = 0.45; x < cols; x += 0.9) joints.push(`M${x},${rows} V${rows + 1.2}`)
  out.push(`<path d="${joints.join(' ')}" stroke="${C.sidewalkLine}" stroke-width="${FINE}"/>`)
  out.push(rect(0, rows + 1.2, cols, STREET_TILES - 1.2, C.road))
  out.push(`<path d="M0,${rows + 1.6} H${cols}" stroke="${C.cream}" stroke-width="0.07" stroke-dasharray="0.5 0.35"/>`)

  return out.join('')
}

export function roomTexture(grid: Grid): string {
  return svgDoc([0, 0, grid.cols, grid.rows + STREET_TILES], TILE, roomBody(grid))
}
