import { FLOOR_ROWS, TILE } from '../config'
import { SCOOTER_BOX } from './fx'
import { shutterWindow } from './floors'
import { C } from './palette'
import { FINE, glassPane, outline, rect, shopFront, street, STREET_TILES } from './room'
import { svgDoc } from './svg'

// The restaurant's street art, in room.ts's flat, ink-outlined style: a warm street restaurant with a red-and-yellow awning,
// the old house it was before it was bought, the closed lots between it and the spa, and the owner's bicycle.

/** The warm colour of the stove lamps over the restaurant's cooks, in the palette's hex form. */
export const RESTAURANT_LAMP = C.stoneHot

const COLS = 13
const ROWS = FLOOR_ROWS
/** The restaurant's door, in its own columns. */
const DOOR_X = 6
const FONT = `font-family="'Be Vietnam Pro', sans-serif" font-weight="800" text-anchor="middle"`

/** Terrazzo (cream with chips) over 2 × 2 tiles, and the kitchen's white tiles half a tile square. */
const CHIPS: [number, number, string][] = [
  [0.2, 0.3, C.terracotta],
  [0.9, 0.15, C.teal],
  [1.5, 0.45, C.mustard],
  [0.5, 0.95, C.mustard],
  [1.2, 1.1, C.terracotta],
  [1.75, 1.6, C.teal],
  [0.25, 1.65, C.teal],
  [0.95, 1.7, C.terracotta],
  [1.6, 1.0, C.stoneLight],
]
const DEFS =
  '<defs>' +
  `<pattern id="terrazzo" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${C.tile}"/>` +
  CHIPS.map(([x, y, fill]) => `<ellipse cx="${x}" cy="${y}" rx="0.07" ry="0.045" fill="${fill}" transform="rotate(${Math.round(x * 90)} ${x} ${y})"/>`).join('') +
  '</pattern>' +
  `<pattern id="resttile" width="0.5" height="0.5" patternUnits="userSpaceOnUse"><rect width="0.5" height="0.5" fill="${C.cream}"/>` +
  `<path d="M0,0 H0.5 V0.5" fill="none" stroke="${C.tileSeam}" stroke-width="0.03"/></pattern>` +
  '</defs>'

/** A roll-down shutter: ridged steel slats between two posts. */
function rollShutter(x0: number, x1: number, y0: number, y1: number): string {
  const slats: string[] = []
  for (let y = y0 + 0.2; y < y1 - 0.05; y += 0.2) slats.push(`M${x0 + 0.05},${y.toFixed(2)} H${x1 - 0.05}`)
  return (
    rect(x0, y0, x1 - x0, y1 - y0, C.tin, outline(0.04)) +
    `<path d="${slats.join(' ')}" stroke="${C.tinRib}" stroke-width="0.05"/>` +
    rect(x0 - 0.12, y0 - 0.1, 0.2, y1 - y0 + 0.1, C.wood, `rx="0.05" ${outline(0.035)}`) +
    rect(x1 - 0.08, y0 - 0.1, 0.2, y1 - y0 + 0.1, C.wood, `rx="0.05" ${outline(0.035)}`)
  )
}

/** A closed front wall `cols` wide and `rows` tall: faded paint, a dark band, damp stains and shuttered windows down it. */
function closedWall(cols: number, rows: number, windows: number[], paint: string, band: string): string {
  const out = [rect(0.3, 0, cols - 0.6, rows, paint, outline()), rect(0.3, 0, cols - 0.6, 0.35, band, outline(0.04))]
  for (let y = 4.5; y < rows - 4; y += 6) out.push(rect(0.3, y, cols - 0.6, 0.12, band, 'opacity="0.55"'))
  for (const [x, y, w, h] of [[1.2, 2.4, 1.1, 0.6], [cols - 3, 7.5, 0.9, 1.1], [cols / 2, 11, 1.3, 0.5]]) {
    out.push(`<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="${band}" opacity="0.45"/>`)
  }
  for (const cx of windows) for (const y of [2.4, 7.4, 12.4]) out.push(`<g transform="translate(0 ${y})">${shutterWindow(cx)}</g>`)
  out.push(rect(0.3, 0, 0.2, rows, band, outline(0.04)), rect(cols - 0.5, 0, 0.2, rows, band, outline(0.04)))
  return out.join('')
}

/** The red-and-yellow awning over the sidewalk, scalloped along its lower edge, with the name board across its middle. */
function awning(): string {
  const y = ROWS
  const n = 26
  const w = +(COLS / n).toFixed(3)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const fill = i % 2 === 0 ? C.lantern : C.gold
    const x = +(i * w).toFixed(3)
    out.push(rect(x, y, w, 0.45, fill))
    out.push(`<path d="M${x},${y + 0.45} h${w} a${+(w / 2).toFixed(3)},0.16 0 0 1 -${w},0Z" fill="${fill}" ${outline(FINE)}/>`)
  }
  out.push(rect(0, y - 0.04, COLS, 0.1, C.lanternDark, outline(FINE)))
  out.push(rect(4.3, y + 0.07, 4.4, 0.52, C.lanternDark, `rx="0.1" ${outline(0.04)}`))
  out.push(`<text x="${COLS / 2}" y="${y + 0.46}" ${FONT} font-size="0.34" fill="${C.goldPale}">NHÀ HÀNG</text>`)
  return out.join('')
}

/** The menu board on the back wall: a dark board in a wood frame, a heading and chalk lines for the dishes. */
function menuBoard(): string {
  const lines: string[] = []
  for (let i = 0; i < 3; i++) lines.push(`M1.7,${(0.88 + i * 0.26).toFixed(2)} H${i === 2 ? 3.2 : 3.7} M4.0,${(0.88 + i * 0.26).toFixed(2)} h0.35`)
  return (
    rect(1.3, 0.2, 3.4, 1.35, C.wood, `rx="0.08" ${outline(0.045)}`) +
    rect(1.42, 0.32, 3.16, 1.11, C.deepBrown, `rx="0.04" ${outline(0.03)}`) +
    `<path d="M2.2,0.62 H3.8" stroke="${C.goldPale}" stroke-width="0.07" stroke-linecap="round"/>` +
    `<path d="${lines.join(' ')}" stroke="${C.cream}" stroke-width="0.05" stroke-linecap="round" opacity="0.85"/>`
  )
}

/** Three paper lanterns hanging on the back wall to the right of the menu board. */
function lanterns(): string {
  return [8, 9.5, 11]
    .map(
      x =>
        `<path d="M${x},0 V0.3" ${outline(0.03)}/><ellipse cx="${x}" cy="0.72" rx="0.3" ry="0.4" fill="${C.lantern}" ${outline(0.04)}/>` +
        `<path d="M${x - 0.26},0.72 H${x + 0.26}" stroke="${C.mustard}" stroke-width="0.05"/>`,
    )
    .join('')
}

/** The restaurant's floor 1: terrazzo, the tiled kitchen strip along the back with its counter line, cream walls, the shop front and its awning. */
function restRoom(): string {
  const front = ROWS - 0.45
  const out: string[] = [DEFS]
  out.push(rect(0.5, 2, COLS - 1, front - 2, 'url(#terrazzo)'), rect(0.5, 2, COLS - 1, 0.1, C.ink, 'opacity="0.14"'))
  out.push(rect(0.5, 2, COLS - 1, 2, 'url(#resttile)'))
  out.push(rect(0.5, 3.88, COLS - 1, 0.18, C.wood, outline(0.035)), rect(0.5, 4.06, COLS - 1, 0.08, C.ink, 'opacity="0.16"'))
  out.push(rect(DOOR_X + 0.1, 4.3, 0.8, front - 4.3, C.terracotta, `opacity="0.18" ${outline(FINE)}`))
  out.push(rect(0.3, 0, COLS - 0.6, 2, C.paper, outline()), rect(0.3, 1.65, COLS - 0.6, 0.35, C.sand, outline(0.04)))
  out.push(menuBoard(), lanterns())
  out.push(rect(0.3, 0, 0.2, ROWS, C.sand, outline(0.04)), rect(COLS - 0.5, 0, 0.2, ROWS, C.sand, outline(0.04)))
  out.push(shopFront(COLS, ROWS, DOOR_X))
  out.push(street(COLS, ROWS))
  out.push(awning())
  return svgDoc([0, 0, COLS, ROWS + STREET_TILES], TILE, out.join(''))
}

/** The sign across the old house's shutter. */
const SANG_NHUONG =
  rect(3.4, ROWS - 3.35, 6.2, 1.0, C.cream, `rx="0.08" ${outline(0.05)}`) +
  rect(3.55, ROWS - 3.2, 5.9, 0.7, 'none', `rx="0.05" stroke="${C.lantern}" stroke-width="0.04"`) +
  `<text x="${COLS / 2}" y="${ROWS - 2.62}" ${FONT} font-size="0.5" fill="${C.lantern}">SANG NHƯỢNG</text>`

/** The old house the restaurant was: faded paint, shuttered windows, the shutter down over the front and the sign across it. */
function restOld(): string {
  const front = ROWS - 0.45
  const out = [closedWall(COLS, ROWS, [3.3, 9.7], C.sand, C.sidewalkLine)]
  out.push(rollShutter(2.2, 10.8, ROWS - 4.6, front))
  out.push(SANG_NHUONG)
  out.push(rect(0.3, front, COLS - 0.6, 0.45, C.sidewalkLine, outline(0.04)))
  out.push(street(COLS, ROWS))
  return svgDoc([0, 0, COLS, ROWS + STREET_TILES], TILE, out.join(''))
}

/** An empty lot's front: a closed street front 6 columns wide, faded paint over a rolled-down shutter, with the street. */
function lotFront(): string {
  const cols = 6
  const front = ROWS - 0.45
  const out = [closedWall(cols, ROWS, [cols / 2], C.sidewalk, C.sidewalkLine)]
  out.push(rollShutter(1, cols - 1, ROWS - 3.4, front))
  out.push(rect(0.3, front, cols - 0.6, 0.45, C.sidewalkLine, outline(0.04)))
  out.push(street(cols, ROWS))
  return svgDoc([0, 0, cols, ROWS + STREET_TILES], TILE, out.join(''))
}

/** A closed upper floor of the restaurant's block: the same faded wall, shuttered windows, a plain glass front. */
function restUpper(): string {
  const out = [closedWall(COLS, ROWS, [3.3, 9.7], C.paper, C.sand)]
  out.push(glassPane(0.3, COLS - 0.3, ROWS))
  return svgDoc([0, 0, COLS, ROWS], TILE, out.join(''))
}

/** The owner's bicycle in SCOOTER_BOX's units, standing on the origin and facing right: two spoked wheels, a frame, a basket and a seat. */
function bike(): string {
  const wheel = (cx: number) =>
    `<circle cx="${cx}" cy="-30" r="30" fill="none" stroke="${C.ink}" stroke-width="7"/>` +
    `<circle cx="${cx}" cy="-30" r="26" fill="none" stroke="${C.silver}" stroke-width="3"/>` +
    `<path d="M${cx - 26},-30 H${cx + 26} M${cx},-56 V-4" stroke="${C.silver}" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="-30" r="6" fill="${C.mustard}" stroke="${C.ink}" stroke-width="3"/>`
  const frame = `stroke="${C.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"`
  return (
    wheel(-72) +
    wheel(72) +
    `<path d="M-72,-30 L-16,-84 L50,-84 L72,-30 M-16,-84 L8,-30 L-72,-30 M50,-84 L44,-124 M44,-124 H84" ${frame}/>` +
    `<path d="M-30,-98 H-4" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="M-16,-84 L-22,-98" ${frame}/>` +
    `<rect x="64" y="-122" width="50" height="34" rx="6" fill="${C.weave}" stroke="${C.ink}" stroke-width="5"/>` +
    `<path d="M76,-120 V-90 M89,-120 V-90 M102,-120 V-90 M64,-106 H114" stroke="${C.weaveLine}" stroke-width="3"/>` +
    `<path d="M44,-124 L40,-136 M28,-138 H52" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>` +
    `<circle cx="8" cy="-30" r="9" fill="${C.cream}" stroke="${C.ink}" stroke-width="4"/>` +
    `<path d="M8,-30 L-6,-14 H-18" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  )
}

export function restaurantTextures(): Record<string, string> {
  return {
    'rest-room': restRoom(),
    'rest-old': restOld(),
    'lot-front': lotFront(),
    'rest-upper': restUpper(),
    'fx-bike': svgDoc(SCOOTER_BOX, 1, bike()),
  }
}
