import { TILE } from '../config'
import type { Grid } from '../sim/grid'
import { C } from './palette'
import { svgDoc } from './svg'

/** Street strip below the front wall, in tiles. */
export const STREET_TILES = 2

const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`

/** The whole floor in tile units: back wall, planks, rugs, side caps, front wall with door, street. */
function roomBody(grid: Grid): string {
  const cols = grid.cols
  const rows = grid.rows
  const door = grid.door
  const out: string[] = []

  // floor + planks
  out.push(rect(0.5, 2, cols - 1, rows - 2, C.floor))
  for (let i = 0, y = 2; y < rows; i++, y += 0.5) {
    out.push(`<path d="M0.5,${y} H${cols - 0.5}" stroke="${C.plank}" stroke-width="0.025"/>`)
    for (let x = (i % 2 ? 1.6 : 0.85); x < cols - 0.5; x += 1.5)
      out.push(`<path d="M${x},${y} V${y + 0.5}" stroke="${C.plank}" stroke-width="0.02"/>`)
  }

  // rugs: lavender under the shampoo chairs, cream under the sofa, mint in the open floor
  const chairXs = grid.beds.map(c => c.x)
  if (chairXs.length) out.push(rect(Math.min(...chairXs) - 1, 2.15, Math.max(...chairXs) - Math.min(...chairXs) + 3, 2.2, C.lavenderLight, 'rx="0.3"'))
  const seatXs = grid.seats.map(s => s.x)
  if (seatXs.length) {
    const y = grid.seats[0].y
    out.push(rect(Math.min(...seatXs) - 0.6, y - 0.4, seatXs.length + 1.2, 2.1, C.rugCream, 'rx="0.3"'))
  }
  out.push(`<ellipse cx="8.5" cy="13.4" rx="2.2" ry="1.4" fill="${C.mintLight}"/>`)
  out.push(`<ellipse cx="8.5" cy="13.4" rx="1.8" ry="1.05" fill="none" stroke="#ffffff" stroke-width="0.05" stroke-dasharray="0.12 0.12"/>`)

  // back wall face with windows, clock and a lotus decal
  out.push(rect(0.3, 0, cols - 0.6, 2, C.wall))
  out.push(rect(0.3, 0, cols - 0.6, 0.18, C.wallCap))
  out.push(rect(0.3, 1.88, cols - 0.6, 0.12, C.wallLine))
  for (const wx of [1.4, cols - 3.1]) {
    out.push(rect(wx, 0.45, 1.7, 1.05, C.sky, 'rx="0.08" stroke="#ffffff" stroke-width="0.1"'))
    out.push(`<path d="M${wx + 0.85},0.45 V1.5 M${wx},0.97 H${wx + 1.7}" stroke="#ffffff" stroke-width="0.06"/>`)
  }
  out.push(`<circle cx="${cols / 2}" cy="0.85" r="0.34" fill="#ffffff" stroke="${C.wallLine}" stroke-width="0.07"/>`)
  out.push(`<path d="M${cols / 2},0.85 V0.62 M${cols / 2},0.85 H${cols / 2 + 0.18}" stroke="${C.textSoft}" stroke-width="0.05" stroke-linecap="round"/>`)
  // between the first two chairs so the basins do not cover it
  const lx = grid.beds.length > 1 ? (grid.beds[0].x + grid.beds[1].x + 1) / 2 : cols / 2
  out.push(
    `<g transform="translate(${lx},1.3)" opacity="0.85">` +
      `<ellipse cx="-0.22" cy="0" rx="0.12" ry="0.26" fill="${C.pink}" transform="rotate(-35 -0.22 0)"/>` +
      `<ellipse cx="0.22" cy="0" rx="0.12" ry="0.26" fill="${C.pink}" transform="rotate(35 0.22 0)"/>` +
      `<ellipse cx="0" cy="-0.06" rx="0.13" ry="0.3" fill="${C.pinkDark}"/></g>`,
  )

  // side wall caps
  out.push(rect(0.3, 0, 0.2, rows + 0.3, C.wallCap))
  out.push(rect(cols - 0.5, 0, 0.2, rows + 0.3, C.wallCap))

  // street: sidewalk and road
  const sy = rows + 0.3
  out.push(rect(0, sy, cols, 1.2, C.sidewalk))
  for (let x = 0.5; x < cols; x += 1) out.push(`<path d="M${x},${sy} V${sy + 1.2}" stroke="#e0d3c4" stroke-width="0.03"/>`)
  out.push(rect(0, sy + 1.2, cols, rows + STREET_TILES - sy - 1.2, C.road))
  out.push(`<path d="M0,${sy + 1.6} H${cols}" stroke="#ffffff" stroke-width="0.07" stroke-dasharray="0.6 0.4"/>`)

  // front wall cap with the door opening and a doormat
  out.push(rect(0.3, rows - 1 + 0.05, door.x - 0.3, 0.3, C.wallCap))
  out.push(rect(door.x + 1, rows - 1 + 0.05, cols - 0.3 - door.x - 1, 0.3, C.wallCap))
  out.push(rect(door.x + 0.1, rows - 1 + 0.15, 0.8, 0.55, '#d9b48f', 'rx="0.08"'))
  out.push(`<path d="M${door.x + 0.2},${rows - 0.6} H${door.x + 0.8}" stroke="#c99d74" stroke-width="0.05"/>`)
  out.push(rect(door.x - 0.08, rows - 1.05, 0.1, 0.45, '#c99d74', 'rx="0.03"'))
  out.push(rect(door.x + 0.98, rows - 1.05, 0.1, 0.45, '#c99d74', 'rx="0.03"'))

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
