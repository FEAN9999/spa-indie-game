import { FLOOR_ROWS, TILE } from '../config'
import { SCOOTER_BOX } from './fx'
import { pot, shutterWindow } from './floors'
import { floor2, floor3, saleTexture, type HouseKey, type Roof } from './houses'
import { silkLantern } from './lantern'
import { C } from './palette'
import { FINE, GACH_BONG, glassPane, outline, PLANKS, rect, shopFront, street, STREET_TILES } from './room'
import { f } from './round'
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

/** An awning over the sidewalk `cols` wide, in stripes half a tile wide alternating `a` and `b`, scalloped along its lower edge. */
function stripedAwning(cols: number, a: string, b: string): string {
  const y = ROWS
  const n = Math.round(cols * 2)
  const w = +(cols / n).toFixed(3)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const fill = i % 2 === 0 ? a : b
    const x = +(i * w).toFixed(3)
    out.push(rect(x, y, w, 0.45, fill))
    out.push(`<path d="M${x},${y + 0.45} h${w} a${+(w / 2).toFixed(3)},0.16 0 0 1 -${w},0Z" fill="${fill}" ${outline(FINE)}/>`)
  }
  out.push(rect(0, y - 0.04, cols, 0.1, C.lanternDark, outline(FINE)))
  return out.join('')
}

/** The red-and-yellow awning over the sidewalk, scalloped along its lower edge, with the name board across its middle. */
function awning(): string {
  const y = ROWS
  const out = [stripedAwning(COLS, C.lantern, C.gold)]
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

/** A red paper lantern hanging on the back wall at `x`. */
function paperLantern(x: number): string {
  return (
    `<path d="M${x},0 V0.3" ${outline(0.03)}/><ellipse cx="${x}" cy="0.72" rx="0.3" ry="0.4" fill="${C.lantern}" ${outline(0.04)}/>` +
    `<path d="M${x - 0.26},0.72 H${x + 0.26}" stroke="${C.mustard}" stroke-width="0.05"/>`
  )
}

/** Three paper lanterns hanging on the back wall to the right of the menu board. */
function lanterns(): string {
  return [8, 9.5, 11].map(paperLantern).join('')
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

/**
 * Floor 2, drawn like the spa's 'room-2': planks, cream walls with a row of three shuttered windows and two paper lanterns
 * between them, two glass doors onto a gạch bông balcony with pots and an iron railing, the road below. The stairs' cells
 * (x 11, rows 7–9) are bare floor for the shared 'stairs' image.
 */
function restRoom2(): string {
  const out: string[] = [`<defs>${GACH_BONG}${PLANKS}</defs>`]
  out.push(rect(0.5, 2, COLS - 1, ROWS - 2.45, 'url(#planks)'), rect(0.5, 2, COLS - 1, 0.1, C.ink, 'opacity="0.14"'))
  out.push(rect(0.3, 0, COLS - 0.6, 2, C.paper, outline()), rect(0.3, 1.65, COLS - 0.6, 0.35, C.sand, outline(0.04)))
  out.push(shutterWindow(2.3), shutterWindow(6.5), shutterWindow(10.7), paperLantern(4.4), paperLantern(8.6))
  out.push(rect(0.3, 0, 0.2, ROWS, C.sand, outline(0.04)), rect(COLS - 0.5, 0, 0.2, ROWS, C.sand, outline(0.04)))
  out.push(rect(0.3, ROWS - 0.45, COLS - 0.6, 0.45, C.sand, outline(0.04)))
  for (const x of [2.5, 8.5]) out.push(rect(x, ROWS - 0.4, 2, 0.36, C.glass, outline(FINE)), `<path d="M${x + 1},${ROWS - 0.4} V${ROWS - 0.04}" ${outline(FINE)}/>`)
  out.push(rect(0.3, ROWS, COLS - 0.6, 1.1, 'url(#gachbong)'))
  for (const x of [1.3, 4.2, 8.8, 11.7]) out.push(pot(x, ROWS + 0.35))
  const bars: string[] = []
  for (let x = 0.55; x < COLS - 0.3; x += 0.3) bars.push(`M${x.toFixed(2)},${ROWS + 1.12} V${ROWS + 1.8}`)
  out.push(`<path d="${bars.join(' ')}" stroke="${C.ink}" stroke-width="0.045"/>`, rect(0.3, ROWS + 1, COLS - 0.6, 0.12, C.ink), rect(0.3, ROWS + 1.8, COLS - 0.6, 0.08, C.ink))
  out.push(rect(0, ROWS + 1.88, COLS, STREET_TILES - 1.88, C.road))
  return svgDoc([0, 0, COLS, ROWS + STREET_TILES], TILE, out.join(''))
}

/** The silk of a rooftop lantern, in silkLantern's pixels (78 to a tile). */
const LANTERN_R = 20
/** The posts on the rooftop's side parapets that the lantern strings hang between. */
const POST_X = [0.75, 12.25] as const
/** The two lantern strings: where each meets the posts, its low point mid-way, and where along it (0 to 1) each lantern hangs. */
const ROOF_STRINGS = [
  { y: 2.7, low: 3.5, at: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5].map(i => i / 6) },
  { y: 3.7, low: 4.5, at: [1, 2, 3, 4, 5].map(i => i / 6) },
]
/** Where each rooftop lantern's hook meets its string: a quadratic sag between the posts. */
const LANTERN_HOOKS = ROOF_STRINGS.flatMap(s =>
  s.at.map(t => ({ x: POST_X[0] + (POST_X[1] - POST_X[0]) * t, y: s.y + 4 * t * (1 - t) * (s.low - s.y) })),
)

/** The middle of each rooftop lantern's silk, in tiles within the 13-column block, for the night glow. */
export const ROOF_LANTERNS: { x: number; y: number }[] = LANTERN_HOOKS.map(h => ({ x: f(h.x), y: f(h.y + (14 + LANTERN_R * 1.25) / 78) }))

/** The stairwell's opening at x 11, rows 7–9: a cream curb round a dark well with steps going down, lit near the foot. */
function stairHatch(): string {
  const out = [rect(10.86, 6.86, 1.28, 3.14, C.cream, `rx="0.06" ${outline(0.04)}`), rect(11, 7, 1, 3, C.coopDoor, outline(FINE))]
  ;[C.plank, C.woodLight, C.wood, C.woodDark].forEach((fill, i) => out.push(rect(11.08, +(9.5 - i * 0.55).toFixed(2), 0.84, 0.38, fill, `rx="0.03" ${outline(FINE)}`)))
  return out.join('')
}

/**
 * The rooftop (floor 3), drawn like the spa's 'room-3': sky and far roofs behind a low back wall, a gạch tàu floor, low
 * parapets on the sides and the front with the neighbour's tin roof below, a pot of flowers in each corner, the stairwell's
 * opening on the stairs' cells, and two strings of red and yellow lanterns between posts on the side parapets, over rows 3–4.
 */
function restRoom3(): string {
  const tau =
    `<pattern id="gachtau" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="${C.gachTauBase}"/>` +
    `<rect x="0.035" y="0.035" width="0.93" height="0.93" fill="${C.gachTauFace}"/>` +
    `<path d="M0.16,0.2 h0.26" stroke="${C.gachTauGlint}" stroke-width="0.045" stroke-linecap="round"/></pattern>`
  const out: string[] = [`<defs>${tau}</defs>`]

  // sky, clouds and the far roofs
  out.push(rect(0, 0, COLS, 2, C.glass), `<ellipse cx="3.4" cy="0.36" rx="0.8" ry="0.18" fill="${C.cloud}" opacity="0.85"/><ellipse cx="10.2" cy="0.26" rx="0.9" ry="0.16" fill="${C.cloud}" opacity="0.7"/>`)
  out.push(`<path d="M0.3,1.5 V0.9 H1.8 V1.1 H3.0 V0.8 H4.6 V1.5Z M7.4,1.5 V1.0 H8.6 V0.75 H10.4 V1.05 H12.7 V1.5Z" fill="${C.sidewalk}" ${outline(0.03)}/>`)

  // the gạch tàu floor, the back wall and the side parapets, the stairwell, a pot in each corner
  out.push(rect(0.5, 2, COLS - 1, ROWS - 2.45, 'url(#gachtau)'), rect(0.5, 2, COLS - 1, 0.12, C.ink, 'opacity="0.12"'))
  out.push(rect(0.3, 1.45, COLS - 0.6, 0.55, C.cream, outline(0.045)), rect(0.3, 1.4, COLS - 0.6, 0.12, C.terracotta, outline(0.035)))
  out.push(rect(0.3, 1.45, 0.2, ROWS - 1.45, C.cream, outline(0.04)), rect(COLS - 0.5, 1.45, 0.2, ROWS - 1.45, C.cream, outline(0.04)))
  out.push(stairHatch())
  for (const [x, y] of [[1.3, 2.5], [11.7, 2.5], [1.3, ROWS - 1.4], [11.7, ROWS - 1.4]]) out.push(pot(x, y))

  // the neighbour's tin roof below, then the low front parapet
  out.push(rect(0, ROWS, COLS, STREET_TILES, C.tin))
  const corrugation: string[] = []
  for (let x = 0.15; x < COLS; x += 0.3) corrugation.push(`M${x.toFixed(2)},${ROWS} V${ROWS + STREET_TILES}`)
  out.push(`<path d="${corrugation.join(' ')}" stroke="${C.tinRib}" stroke-width="0.05"/>`)
  out.push(rect(0.3, ROWS - 0.45, COLS - 0.6, 0.5, C.cream, outline(0.045)), rect(0.3, ROWS - 0.5, COLS - 0.6, 0.12, C.terracotta, outline(0.035)))

  // the posts, the two strings and their lanterns, red and yellow by turns
  for (const x of POST_X) out.push(rect(x - 0.06, 2.4, 0.12, 2.6, C.wood, `rx="0.04" ${outline(0.035)}`))
  for (const s of ROOF_STRINGS) out.push(`<path d="M${POST_X[0]},${s.y} Q${COLS / 2},${2 * s.low - s.y} ${POST_X[1]},${s.y}" fill="none" ${outline(0.035)}/>`)
  LANTERN_HOOKS.forEach((h, i) => out.push(silkLantern(h.x, h.y + 14 / 78, i % 2 === 0 ? C.lantern : C.gold, LANTERN_R)))
  return svgDoc([0, 0, COLS, ROWS + STREET_TILES], TILE, out.join(''))
}

/** Each restaurant house's warm wall, its dark band, and its roof while it is for sale. */
export const REST_HOUSE_LOOK: Record<HouseKey, { wall: string; wallDark: string; roof: Roof }> = {
  right1: { wall: C.restHouseMango, wallDark: C.restHouseMangoDark, roof: 'tiles' },
  left1: { wall: C.restHouseClay, wallDark: C.restHouseClayDark, roof: 'flat' },
  right2: { wall: C.restHouseButter, wallDark: C.restHouseButterDark, roof: 'tin' },
  left2: { wall: C.restHouseCinnamon, wallDark: C.restHouseCinnamonDark, roof: 'tiles' },
}

/** A bought house's width, like the spa's: from the middle of the old wall column to the far side of its outer wall. */
const HOUSE_W = 6.5
/** Where the house's floor ends: the middle of its outer wall column. */
const HOUSE_IN = 6

/**
 * A restaurant house's floor 1, drawn for a right-hand house: the restaurant's terrazzo with the kitchen's tiled strip carried
 * along the back, a seam on the old wall line, the house's wall with a shuttered window and two paper lanterns, glass across
 * the front, the street and a terracotta-and-cream awning.
 */
function houseFloor1(look: (typeof REST_HOUSE_LOOK)[HouseKey]): string {
  const out: string[] = [DEFS]
  out.push(rect(0, 2, HOUSE_IN, ROWS - 2.45, 'url(#terrazzo)'), rect(0, 2, HOUSE_IN, 0.1, C.ink, 'opacity="0.14"'))
  out.push(rect(0, 2, HOUSE_IN, 2, 'url(#resttile)'))
  out.push(rect(0, 3.88, HOUSE_IN, 0.18, C.wood, outline(0.035)), rect(0, 4.06, HOUSE_IN, 0.08, C.ink, 'opacity="0.16"'))
  out.push(`<path d="M0,2 V${ROWS - 0.45}" stroke="${C.ink}" stroke-width="0.05" opacity="0.35"/>`)
  out.push(rect(0, 0, HOUSE_IN + 0.2, 2, look.wall, outline()), rect(0, 1.65, HOUSE_IN + 0.2, 0.35, look.wallDark, outline(0.04)))
  out.push(shutterWindow(HOUSE_IN / 2), paperLantern(1), paperLantern(5))
  out.push(rect(HOUSE_IN, 0, 0.2, ROWS, look.wallDark, outline(0.04)))
  out.push(glassPane(0, HOUSE_IN + 0.2, ROWS))
  out.push(street(HOUSE_W, ROWS))
  out.push(stripedAwning(HOUSE_W, C.terracotta, C.cream))
  return svgDoc([0, 0, HOUSE_W, ROWS + STREET_TILES], TILE, out.join(''))
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

/** The spa's main shop on a floor it has not opened: the closed wall in the spa's own yellow, shuttered windows, a plain glass front. */
function spaUpper(): string {
  const out = [closedWall(COLS, ROWS, [3.3, 9.7], C.wall, C.wallDark)]
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

/** The restaurant's textures: its floors, the old house, a closed lot, the closed upper fronts, the bike, and every house's three floors ('rest-house-<key>-<floor>', drawn for a right-hand house) and its roof for sale ('rest-sale-<key>'). */
export function restaurantTextures(): Record<string, string> {
  const out: Record<string, string> = {
    'rest-room': restRoom(),
    'rest-room-2': restRoom2(),
    'rest-room-3': restRoom3(),
    'rest-old': restOld(),
    'lot-front': lotFront(),
    'rest-upper': restUpper(),
    'spa-upper': spaUpper(),
    'fx-bike': svgDoc(SCOOTER_BOX, 1, bike()),
  }
  for (const [key, look] of Object.entries(REST_HOUSE_LOOK) as [HouseKey, (typeof REST_HOUSE_LOOK)[HouseKey]][]) {
    out[`rest-house-${key}-1`] = houseFloor1(look)
    out[`rest-house-${key}-2`] = floor2(look)
    out[`rest-house-${key}-3`] = floor3(look)
    out[`rest-sale-${key}`] = saleTexture(look.roof)
  }
  return out
}
