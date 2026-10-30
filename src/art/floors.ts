import { FLOOR_ROWS, TILE } from '../config'
import { C } from './palette'
import { FINE, GACH_BONG, outline, PLANKS, rect, STREET_TILES } from './room'
import { svgDoc } from './svg'

const COLS = 13

/** A shuttered window: a glass pane between two green louvre leaves. */
export function shutterWindow(cx: number): string {
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
export function pot(cx: number, y: number): string {
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
  const rope = 'M0.12,0.42 Q0.5,0.62 0.88,0.42'
  const out: string[] = []
  for (const x of [0.12, 0.88]) out.push(rect(x - 0.06, 0.35, 0.12, 0.55, C.wood, `rx="0.03" ${outline(FINE)}`))
  out.push(`<path d="${rope}" fill="none" stroke="${C.ink}" stroke-width="0.12" stroke-linecap="round"/>`)
  out.push(`<path d="${rope}" fill="none" stroke="${C.cream}" stroke-width="0.08" stroke-linecap="round"/>`)
  out.push(`<path d="${rope}" fill="none" stroke="${C.lantern}" stroke-width="0.08" stroke-linecap="butt" stroke-dasharray="0.08 0.08"/>`)
  out.push(`<path d="M0.5,0.53 V0.62" ${outline(FINE)}/>`, rect(0.38, 0.62, 0.24, 0.17, C.cream, `rx="0.02" ${outline(FINE)}`))
  return svgDoc([0, 0, 1, 1], TILE, out.join(''))
}

/** Hanging bougainvillea: a row of leaves with pink and lotus flowers, seeded so it looks the same on every load. */
function bougainvillea(x0: number, x1: number, y: number, seed: number): string {
  let s = seed
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280
  const out: string[] = []
  for (let x = x0; x < x1; x += 0.3) out.push(`<ellipse cx="${x.toFixed(2)}" cy="${(y + 0.05 + rnd() * 0.25).toFixed(2)}" rx="0.22" ry="0.14" fill="${C.leaf}" ${outline(0.025)}/>`)
  for (let x = x0; x < x1; x += 0.17)
    out.push(`<circle cx="${(x + rnd() * 0.1).toFixed(2)}" cy="${(y - 0.05 + rnd() * 0.5).toFixed(2)}" r="${(0.07 + rnd() * 0.04).toFixed(3)}" fill="${rnd() < 0.5 ? C.bougainvillea : C.lotus}" ${outline(0.02)}/>`)
  return out.join('')
}

/**
 * The rooftop (floor 3), drawn like 'room-2': top-left at the map origin, 13 × (18 + STREET_TILES) tiles.
 * Behind: sky, far roofs, a steel water tank, a towel line and a low wall. A gạch tàu floor. In front: a low wall
 * with bougainvillea over it, and the neighbour's tin roof below.
 */
function roofRoom(): string {
  const rows = FLOOR_ROWS
  const tau =
    `<pattern id="gachtau" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="${C.gachTauBase}"/>` +
    `<rect x="0.035" y="0.035" width="0.93" height="0.93" fill="${C.gachTauFace}"/>` +
    `<path d="M0.16,0.2 h0.26" stroke="${C.gachTauGlint}" stroke-width="0.045" stroke-linecap="round"/></pattern>`
  const out: string[] = [`<defs>${tau}</defs>`]

  // sky, clouds, far roofs, the water tank, the towel line
  out.push(rect(0, 0, COLS, 2, C.glass), `<ellipse cx="2.3" cy="0.42" rx="0.9" ry="0.2" fill="${C.cloud}" opacity="0.85"/><ellipse cx="6.6" cy="0.22" rx="0.7" ry="0.14" fill="${C.cloud}" opacity="0.7"/>`)
  out.push(`<path d="M0.3,1.5 V1.02 H1.4 V0.84 H2.6 V1.18 H3.3 V0.95 H3.9 V1.5Z M9.0,1.5 V1.05 H9.6 V0.9 H12.7 V1.5Z" fill="${C.sidewalk}" ${outline(0.03)}/>`)
  out.push(`<path d="M10.1,1.5 V0.95 M11.5,1.5 V0.95" ${outline(0.05)}/>`, rect(9.75, 0.3, 2.1, 0.68, C.tank, `rx="0.32" ${outline(0.045)}`), `<path d="M10.35,0.3 V0.98 M11.25,0.3 V0.98" stroke="${C.tankRib}" stroke-width="0.05"/>`)
  out.push(`<path d="M4.3,1.5 V0.2 M8.7,1.5 V0.2" stroke="${C.wood}" stroke-width="0.09" stroke-linecap="round"/><path d="M4.3,0.3 Q6.5,0.52 8.7,0.3" fill="none" stroke="${C.ink}" stroke-width="0.025"/>`)
  ;([[4.75, C.cream], [5.55, C.tealLight], [6.35, C.cream], [7.15, C.mustard], [7.9, C.cream]] as const).forEach(([x, fill], i) => out.push(rect(x, 0.38 + (i % 2 ? 0.05 : 0.08), 0.55, 0.62, fill, outline(0.03))))

  // the gạch tàu floor, the back wall and the side walls
  out.push(rect(0.5, 2, COLS - 1, rows - 2.45, 'url(#gachtau)'), rect(0.5, 2, COLS - 1, 0.12, C.ink, 'opacity="0.12"'))
  out.push(rect(0.3, 1.45, COLS - 0.6, 0.55, C.cream, outline(0.045)), rect(0.3, 1.4, COLS - 0.6, 0.12, C.terracotta, outline(0.035)))
  out.push(rect(0.3, 1.45, 0.2, rows - 1.45, C.cream, outline(0.04)), rect(COLS - 0.5, 1.45, 0.2, rows - 1.45, C.cream, outline(0.04)))

  // the neighbour's tin roof below, then the low front wall with bougainvillea over it
  out.push(rect(0, rows, COLS, STREET_TILES, C.tin))
  const corrugation: string[] = []
  for (let x = 0.15; x < COLS; x += 0.3) corrugation.push(`M${x.toFixed(2)},${rows} V${rows + STREET_TILES}`)
  out.push(`<path d="${corrugation.join(' ')}" stroke="${C.tinRib}" stroke-width="0.05"/>`)
  out.push(rect(0.3, rows - 0.45, COLS - 0.6, 0.5, C.cream, outline(0.045)), rect(0.3, rows - 0.5, COLS - 0.6, 0.12, C.terracotta, outline(0.035)))
  out.push(bougainvillea(0.6, 4.6, rows - 0.5, 7), bougainvillea(8.4, 12.4, rows - 0.5, 31), bougainvillea(0.6, 2.2, 1.25, 11))
  return svgDoc([0, 0, COLS, rows + STREET_TILES], TILE, out.join(''))
}

/**
 * The pigeon coop over the rooftop's stairs: 1.5 × 4 tiles, its top-left at local tile (10.75, 6) so its bottom
 * edge is the top of the foot row. A wooden hut with a dark doorway, four steps up into it and a terracotta roof.
 */
function coop(): string {
  const out = [rect(0.12, 1.15, 1.26, 2.85, C.wall, outline()), rect(0.12, 3.62, 1.26, 0.38, C.wallDark, outline(0.04))]
  out.push(rect(0.33, 1.72, 0.84, 2.28, C.coopDoor, `rx="0.05" ${outline(0.04)}`))
  ;[C.coopStepLow, C.coopStepMid, C.woodDark, C.coopStepHigh].forEach((fill, i) => out.push(rect(0.4, +(3.58 - i * 0.45).toFixed(2), 0.7, 0.3, fill, outline(0.02))))
  out.push(`<path d="M-0.02,1.3 L0.75,0.25 L1.52,1.3Z" fill="${C.terracotta}" ${outline()}/>`)
  out.push(`<path d="M0.32,1.02 H1.18 M0.52,0.74 H0.98" stroke="${C.lanternDark}" stroke-width="0.045"/>`)
  out.push(rect(-0.04, 1.22, 1.58, 0.14, C.woodDark, outline(0.035)))
  return svgDoc([0, 0, 1.5, 4], TILE, out.join(''))
}

/** The textures for the upper floors: 'room-2', 'room-3', 'coop', 'stairs' and 'stairsRope'. */
export function floorTextures(): Record<string, string> {
  return { 'room-2': floor2Room(), 'room-3': roofRoom(), coop: coop(), stairs: stairs(), stairsRope: stairsRope() }
}
