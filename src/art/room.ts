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

const shampooChair =
  // basin against the wall, then the reclined chair seen from above
  `<rect x="0.1" y="0" width="1.1" height="0.55" rx="0.12" fill="#ffffff" stroke="#e8dcd2" stroke-width="0.03"/>` +
  `<ellipse cx="0.65" cy="0.27" rx="0.38" ry="0.17" fill="${C.water}"/>` +
  `<rect x="0.6" y="0.02" width="0.1" height="0.1" rx="0.03" fill="#c9c9d6"/>` +
  `<rect x="0.22" y="0.42" width="0.86" height="0.56" rx="0.2" fill="${C.lavender}"/>` +
  `<rect x="0.15" y="0.86" width="1.0" height="0.6" rx="0.18" fill="${C.lavenderLight}"/>` +
  `<rect x="0.15" y="1.3" width="1.0" height="0.22" rx="0.1" fill="${C.lavenderDark}"/>` +
  `<rect x="0.56" y="1.5" width="0.18" height="0.16" fill="#a99ccc"/>` +
  `<ellipse cx="0.65" cy="1.68" rx="0.3" ry="0.05" fill="#a99ccc"/>`

const sofaSeat =
  `<rect x="0.04" y="0" width="0.92" height="0.5" rx="0.16" fill="${C.lavender}"/>` +
  `<rect x="0.02" y="0.38" width="0.96" height="0.62" rx="0.16" fill="${C.lavenderLight}"/>` +
  `<rect x="0.02" y="0.88" width="0.96" height="0.25" rx="0.1" fill="${C.lavenderDark}"/>` +
  `<rect x="0.12" y="1.1" width="0.08" height="0.2" fill="#9c86c0"/><rect x="0.8" y="1.1" width="0.08" height="0.2" fill="#9c86c0"/>`

const desk =
  `<rect x="0.02" y="0" width="2.96" height="0.64" rx="0.1" fill="${C.desk}"/>` +
  `<path d="M0.1,0.08 H2.9" stroke="#f8d6bf" stroke-width="0.05" stroke-linecap="round"/>` +
  `<rect x="0.02" y="0.56" width="2.96" height="0.62" rx="0.08" fill="${C.deskDark}"/>` +
  `<path d="M1,0.66 V1.1 M2,0.66 V1.1" stroke="#d8996f" stroke-width="0.04"/>` +
  // flower vase, notebook, bell
  `<rect x="0.28" y="0.18" width="0.18" height="0.24" rx="0.06" fill="#ffffff"/>` +
  `<circle cx="0.32" cy="0.12" r="0.08" fill="${C.pink}"/><circle cx="0.44" cy="0.1" r="0.07" fill="${C.gold}"/>` +
  `<rect x="1.15" y="0.16" width="0.55" height="0.36" rx="0.04" fill="#ffffff" transform="rotate(-6 1.4 0.34)"/>` +
  `<path d="M1.22,0.27 H1.6 M1.22,0.37 H1.55" stroke="${C.lavender}" stroke-width="0.03" transform="rotate(-6 1.4 0.34)"/>` +
  `<path d="M2.38,0.42 a0.14,0.14 0 0 1 0.28,0z" fill="${C.gold}"/><rect x="2.33" y="0.41" width="0.38" height="0.05" rx="0.02" fill="${C.goldDark}"/>`

const plant =
  `<ellipse cx="0.3" cy="0.6" rx="0.16" ry="0.36" fill="${C.leaf}" transform="rotate(-28 0.3 0.6)"/>` +
  `<ellipse cx="0.7" cy="0.6" rx="0.16" ry="0.36" fill="${C.leaf}" transform="rotate(28 0.7 0.6)"/>` +
  `<ellipse cx="0.5" cy="0.45" rx="0.17" ry="0.42" fill="${C.leafLight}"/>` +
  `<path d="M0.22,0.9 H0.78 L0.7,1.45 H0.3Z" fill="${C.deskDark}"/>` +
  `<rect x="0.18" y="0.86" width="0.64" height="0.12" rx="0.05" fill="#d8996f"/>`

/** Furniture sizes in tiles; RoomView anchors each at the bottom-centre of its footprint. */
export const FURNITURE = {
  'chair-shampoo': { w: 1.3, h: 1.75 },
  seat: { w: 1, h: 1.35 },
  desk: { w: 3, h: 1.25 },
  plant: { w: 1, h: 1.5 },
} as const

export function furnitureTextures(): Record<string, string> {
  const doc = (key: keyof typeof FURNITURE, body: string) => svgDoc([0, 0, FURNITURE[key].w, FURNITURE[key].h], TILE, body)
  return {
    'chair-shampoo': doc('chair-shampoo', shampooChair),
    seat: doc('seat', sofaSeat),
    desk: doc('desk', desk),
    plant: doc('plant', plant),
  }
}
