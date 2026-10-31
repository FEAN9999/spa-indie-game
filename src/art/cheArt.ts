import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** The glass's inside, where the game draws the layers: its centre x, the rim's and the floor's y, and half its width. */
export const CHE_GLASS = { x: 540, top: 860, bottom: 1420, halfW: 170 }
/** The ice block on its picture, the part a tap counts on, as x, y, width and height. */
export const CHE_ICE_BLOCK: Box = [20, 30, 360, 200]
/** The glass is drawn in the card's own pixels and placed at its box's top left corner; the ice block and the jug are placed by their centres. */
export const CHE_GLASS_BOX: Box = [320, 740, 440, 740]

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
/** A thick line with an ink edge: the ink drawn wider first, the colour on top. */
const inked = (d: string, col: string, w: number, edge = 8) =>
  `<path d="${d}" stroke="${C.ink}" stroke-width="${w + edge}" fill="none" stroke-linecap="round"/>` + `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`
const wave = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`

const [L, R] = [CHE_GLASS.x - CHE_GLASS.halfW, CHE_GLASS.x + CHE_GLASS.halfW]
const WALL = 18

// ly: a tall clear glass on a thick foot, a red-striped straw standing in its slot by the rim; the layers are drawn inside it in the game
const GLASS =
  inked(`M${R - 60},${CHE_GLASS.bottom - 40} L${R - 10},760`, C.lantern, 22) +
  wave(`M${R - 52},${CHE_GLASS.bottom - 120} L${R - 10},760`, C.cream, 6) +
  `<path d="M${L - WALL},${CHE_GLASS.top - 14} V${CHE_GLASS.bottom - 10} Q${L - WALL},${CHE_GLASS.bottom + 20} ${L + 20},${CHE_GLASS.bottom + 20} H${R - 20} Q${R + WALL},${CHE_GLASS.bottom + 20} ${R + WALL},${CHE_GLASS.bottom - 10} V${CHE_GLASS.top - 14}" fill="${C.glass}" fill-opacity="0.55" ${ink(6)}/>` +
  `<rect x="${L - WALL - 12}" y="${CHE_GLASS.bottom + 14}" width="${R - L + (WALL + 12) * 2}" height="44" rx="18" fill="${C.glass}" ${ink(6)}/>` +
  `<rect x="${L - WALL - 6}" y="${CHE_GLASS.top - 24}" width="${R - L + (WALL + 6) * 2}" height="18" rx="9" fill="${C.cloud}" ${ink(4)}/>` +
  `<rect x="${R - 34}" y="${CHE_GLASS.top - 28}" width="40" height="26" rx="8" fill="${C.cloud}" ${ink(4)}/>`

// đá: a big clear block of ice on a striped towel, with its cracks and glints
const ICE =
  `<rect x="0" y="210" width="400" height="80" rx="20" fill="${C.cream}" ${ink(5)}/>` +
  wave('M20,236 H380 M20,264 H380', C.teal, 8) +
  `<rect x="${CHE_ICE_BLOCK[0]}" y="${CHE_ICE_BLOCK[1]}" width="${CHE_ICE_BLOCK[2]}" height="${CHE_ICE_BLOCK[3]}" rx="30" fill="${C.glass}" ${ink(6)}/>` +
  `<path d="M40,60 Q200,30 360,60 L360,80 Q200,50 40,80Z" fill="${C.cloud}" fill-opacity="0.7"/>` +
  wave('M150,100 l30,40 l-20,30 M260,90 l-20,50 l30,40', C.waterDeep, 5) +
  wave('M60,110 v70 M84,120 v34', C.cloud, 9)

// cốt dừa: a small cream jug with a wooden band and a handle, its spout on the left and white coconut milk at its rim
const JUG =
  inked('M104,50 q32,6 26,36 q-4,22 -26,22', C.cream, 8, 8) +
  `<path d="M34,32 L10,20 L28,52Z" fill="${C.cream}" ${ink(4)}/>` +
  `<path d="M34,32 H104 Q118,80 106,124 Q70,134 34,124 Q20,80 34,32Z" fill="${C.cream}" ${ink(5)}/>` +
  wave('M30,88 Q70,98 110,88', C.wood, 8) +
  `<ellipse cx="69" cy="32" rx="36" ry="9" fill="${C.cloud}" ${ink(4)}/>`

/** The Chè pictures: the glass, the ice block and the coconut milk jug. The layers, their marks and the drizzle are drawn in the game. */
export function cheTextures(): Record<string, string> {
  return {
    'che-glass': svgDoc(CHE_GLASS_BOX, 1, GLASS),
    'che-ice': svgDoc([0, 0, 400, 300], 1, ICE),
    'che-coconut': svgDoc([0, 0, 140, 140], 1, JUG),
  }
}
