import { FLOOR_ROWS, TILE } from '../config'
import { C } from './palette'
import { FINE, GACH_BONG, outline, PLANKS, rect, STREET_TILES } from './room'
import { svgDoc } from './svg'

const COLS = 13

/** A shuttered window: a glass pane between two green louvre leaves. */
function shutterWindow(cx: number): string {
  const out = [rect(cx - 0.45, 0.3, 0.9, 1.05, C.glass, `rx="0.04" ${outline(0.04)}`), `<path d="M${cx},0.3 V1.35 M${cx - 0.45},0.82 H${cx + 0.45}" ${outline(FINE)}/>`]
  for (const x of [cx - 0.97, cx + 0.47]) {
    out.push(rect(x, 0.28, 0.5, 1.1, C.tealLight, `rx="0.04" ${outline(0.04)}`))
    const slats: string[] = []
    for (let y = 0.42; y < 1.3; y += 0.14) slats.push(`M${x + 0.08},${y.toFixed(2)} H${x + 0.42}`)
    out.push(`<path d="${slats.join(' ')}" stroke="${C.tealDark}" stroke-width="0.05" stroke-linecap="round"/>`)
  }
  return out.join('')
}

/** A terracotta pot of leaves and pink flowers; (cx, y) is the middle of its rim. */
function pot(cx: number, y: number): string {
  const flowers = [[-0.18, -0.2], [0.1, -0.26], [0.22, -0.06], [-0.05, -0.02]]
    .map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${y + dy}" r="0.08" fill="${C.lotus}" ${outline(0.025)}/>`)
    .join('')
  return (
    `<path d="M${cx - 0.28},${y} L${cx + 0.28},${y} L${cx + 0.2},${y + 0.42} L${cx - 0.2},${y + 0.42}Z" fill="${C.terracotta}" ${outline(0.04)}/>` +
    `<ellipse cx="${cx}" cy="${y - 0.1}" rx="0.38" ry="0.24" fill="${C.leaf}" ${outline(0.04)}/>` +
    flowers
  )
}

/**
 * Floor 2, drawn like the 'room' texture: top-left at the map origin, 13 × (18 + STREET_TILES) tiles.
 * A plank floor, two shuttered windows and a lantern on the back wall, two glass doors in the front wall
 * onto a gạch bông balcony with an iron railing and four pots, with the road below.
 */
function floor2Room(): string {
  const rows = FLOOR_ROWS
  const out: string[] = [`<defs>${GACH_BONG}${PLANKS}</defs>`]
  out.push(rect(0.5, 2, COLS - 1, rows - 2.45, 'url(#planks)'), rect(0.5, 2, COLS - 1, 0.1, C.ink, 'opacity="0.14"'))

  // back wall with its windows and lantern
  out.push(rect(0.3, 0, COLS - 0.6, 2, C.wall, outline()), rect(0.3, 1.65, COLS - 0.6, 0.35, C.wallDark, outline(0.04)))
  out.push(shutterWindow(3.3), shutterWindow(9.7))
  out.push(
    `<path d="M6.5,0 V0.32" ${outline(0.03)}/><ellipse cx="6.5" cy="0.74" rx="0.32" ry="0.42" fill="${C.lantern}" ${outline(0.04)}/>` +
      `<path d="M6.22,0.74 H6.78" stroke="${C.mustard}" stroke-width="0.05"/><path d="M6.5,1.16 V1.4" stroke="${C.mustard}" stroke-width="0.06"/>`,
  )

  // side walls, then the front wall with its two glass doors
  out.push(rect(0.3, 0, 0.2, rows, C.wallDark, outline(0.04)), rect(COLS - 0.5, 0, 0.2, rows, C.wallDark, outline(0.04)))
  out.push(rect(0.3, rows - 0.45, COLS - 0.6, 0.45, C.wallDark, outline(0.04)))
  for (const x of [2.5, 8.5]) out.push(rect(x, rows - 0.4, 2, 0.36, C.glass, outline(FINE)), `<path d="M${x + 1},${rows - 0.4} V${rows - 0.04}" ${outline(FINE)}/>`)

  // balcony: gạch bông, pots, iron railing; the road beyond
  out.push(rect(0.3, rows, COLS - 0.6, 1.1, 'url(#gachbong)'))
  for (const x of [1.3, 4.2, 8.8, 11.7]) out.push(pot(x, rows + 0.35))
  const bars: string[] = []
  for (let x = 0.55; x < COLS - 0.3; x += 0.3) bars.push(`M${x.toFixed(2)},${rows + 1.12} V${rows + 1.8}`)
  out.push(`<path d="${bars.join(' ')}" stroke="${C.ink}" stroke-width="0.045"/>`, rect(0.3, rows + 1, COLS - 0.6, 0.12, C.ink), rect(0.3, rows + 1.8, COLS - 0.6, 0.08, C.ink))
  out.push(rect(0, rows + 1.88, COLS, STREET_TILES - 1.88, C.road))
  return svgDoc([0, 0, COLS, rows + STREET_TILES], TILE, out.join(''))
}

/** Step tops from the lowest (light) to the highest (dark). */
const STEPS = [C.weave, C.plank, C.clayLight, C.woodLight, C.wood, C.clay]

/**
 * The stairs: top-left at the top-left of tile (11, 7), 1 × 3 tiles (the sketch's handrail bleed is dropped so the
 * texture is exactly its tiles). Six steps climb to the top, with two chevrons and a wooden handrail on the left.
 */
function stairs(): string {
  const out = [rect(0.04, 0, 0.92, 3, C.woodDark, outline())]
  STEPS.forEach((fill, i) => out.push(rect(0.14, +(3 - (i + 1) * 0.5 + 0.05).toFixed(2), 0.78, 0.4, fill, `rx="0.03" ${outline(FINE)}`)))
  out.push(rect(0.04, 0, 0.92, 0.55, C.ink, 'opacity="0.3"'))
  out.push(`<path d="M0.38,2.1 L0.53,1.93 L0.68,2.1 M0.38,1.6 L0.53,1.43 L0.68,1.6" fill="none" stroke="${C.cream}" stroke-width="0.06" stroke-linecap="round" stroke-linejoin="round"/>`)
  out.push(rect(0.02, 0, 0.13, 3, C.wood, `rx="0.05" ${outline(0.035)}`), `<circle cx="0.085" cy="2.93" r="0.09" fill="${C.woodDark}" ${outline(FINE)}/>`)
  return svgDoc([0, 0, 1, 3], TILE, out.join(''))
}

/**
 * The rope across the bottom step: top-left at the top-left of tile (11, 9), 1 × 1 tile. Two short posts hold a
 * red-and-cream rope with a small cream sign hanging from it.
 */
function stairsRope(): string {
  const out: string[] = []
  for (const x of [0.12, 0.88]) out.push(rect(x - 0.06, 0.35, 0.12, 0.55, C.wood, `rx="0.03" ${outline(FINE)}`))
  out.push(`<path d="M0.12,0.42 Q0.5,0.62 0.88,0.42" fill="none" stroke="${C.ink}" stroke-width="0.12" stroke-linecap="round"/>`)
  out.push(`<path d="M0.12,0.42 Q0.5,0.62 0.88,0.42" fill="none" stroke="${C.cream}" stroke-width="0.08" stroke-linecap="round"/>`)
  out.push(`<path d="M0.12,0.42 Q0.5,0.62 0.88,0.42" fill="none" stroke="${C.lantern}" stroke-width="0.08" stroke-linecap="butt" stroke-dasharray="0.08 0.08"/>`)
  out.push(`<path d="M0.5,0.53 V0.62" ${outline(FINE)}/>`, rect(0.38, 0.62, 0.24, 0.17, C.cream, `rx="0.02" ${outline(FINE)}`))
  return svgDoc([0, 0, 1, 1], TILE, out.join(''))
}

/** The textures for the upper floors: 'room-2', 'stairs' and 'stairsRope'. */
export function floorTextures(): Record<string, string> {
  return { 'room-2': floor2Room(), stairs: stairs(), stairsRope: stairsRope() }
}
