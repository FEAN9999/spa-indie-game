import { BX_PAN } from '../config'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** The pan is drawn in the card's own pixels, centred on BX_PAN, with its handle running down to the left; it is placed at its box's top left corner. */
export const BX_PAN_BOX: Box = [60, 790, 720, 680]
/** The pan's rim and its floor, and the batter's radius on the floor. */
export const BX_PAN_R = { rim: 300, floor: 268, batter: 255 }

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
/** A thick line with an ink edge: the ink drawn wider first, the colour on top. */
const inked = (d: string, col: string, w: number, edge = 8) =>
  `<path d="${d}" stroke="${C.ink}" stroke-width="${w + edge}" fill="none" stroke-linecap="round"/>` + `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`
const wave = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`

/** A point on the pan's handle line, r away from the centre down to the left. */
const alongXY = (r: number) => [Math.round(BX_PAN.x - r * Math.SQRT1_2), Math.round(BX_PAN.y + r * Math.SQRT1_2)]
const along = (r: number) => alongXY(r).join(',')

// chảo gang: a black cast-iron pan, its steel neck riveted to a wooden grip down to the left, a lighter lip and a glint on the floor
const PAN =
  inked(`M${along(280)} L${along(350)}`, C.stone, 24) +
  inked(`M${along(345)} L${along(455)}`, C.wood, 36) +
  wave(`M${along(360)} L${along(440)}`, C.woodLight, 8) +
  `<circle cx="${BX_PAN.x}" cy="${BX_PAN.y}" r="${BX_PAN_R.rim}" fill="${C.stone}" ${ink(6)}/>` +
  `<circle cx="${BX_PAN.x}" cy="${BX_PAN.y}" r="${BX_PAN_R.floor}" fill="${C.deepBrown}" ${ink(4)}/>` +
  wave(`M${BX_PAN.x - 170},${BX_PAN.y - 150} Q${BX_PAN.x - 60},${BX_PAN.y - 220} ${BX_PAN.x + 60},${BX_PAN.y - 210}`, C.stoneLight, 10) +
  [310, 330].map(r => alongXY(r)).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${C.stoneLight}" ${ink(2)}/>`).join('')

// tôm: a pink shrimp curled into a C, with its tail fan and the lines of its shell
const TOM =
  inked('M42,14 A17,17 0 1 0 44,42', C.lotus, 13, 7) +
  `<path d="M44,42 L56,36 L54,52Z" fill="${C.lotusDark}" ${ink(3)}/>` +
  wave('M22,18 L28,26 M15,30 L24,32 M20,44 L27,38', C.lotusDark, 3) +
  `<circle cx="42" cy="15" r="2.5" fill="${C.ink}"/>`

// thịt: a slice of pork belly, pink with its white fat and a thin skin on top
const THIT =
  `<rect x="6" y="14" width="48" height="34" rx="10" fill="${C.houseRose}" ${ink(4)}/>` +
  `<path d="M8,24 Q30,18 52,24 L52,30 Q30,24 8,30Z" fill="${C.cream}"/>` +
  wave('M12,19 Q30,13 48,19', C.gachTauFace, 4) +
  wave('M16,40 q8,-4 16,0 t14,0', C.houseRoseDark, 3)

// giá: three bean sprouts, white stems curving up to their pale yellow heads
const GIA =
  inked('M14,52 Q10,32 20,14', C.cream, 6, 6) +
  inked('M30,54 Q34,34 28,14', C.cream, 6, 6) +
  inked('M46,52 Q50,30 42,12', C.cream, 6, 6) +
  [[20, 12], [28, 12], [42, 10]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="5" fill="${C.bambooLight}" ${ink(3)}/>`).join('')

/** The Bánh xèo pictures: the pan and the three fillings. The batter, the folded crêpe and the fold dial (Phở's) are drawn in the game. */
export function banhXeoTextures(): Record<string, string> {
  return {
    'bx-pan': svgDoc(BX_PAN_BOX, 1, PAN),
    'bx-tom': svgDoc([0, 0, 60, 60], 1, TOM),
    'bx-thit': svgDoc([0, 0, 60, 60], 1, THIT),
    'bx-gia': svgDoc([0, 0, 60, 60], 1, GIA),
  }
}
