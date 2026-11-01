import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/**
 * The stove, the plate and the bowl are drawn in the card's own pixels, so each is placed at its box's top left corner; the sides are small pictures placed by their centres.
 * The grill basket's patties, the noodles' sides and the sauce are drawn in the game.
 */
export const BC_BOX = {
  stove: [100, 840, 680, 620] as Box,
  plate: [120, 860, 640, 520] as Box,
  bowl: [160, 900, 560, 560] as Box,
}

/** The grill basket over the coals: its centre, its half size, and the patties in it, from its centre. */
export const BC_BASKET = { x: 440, y: 1080, hw: 250, hh: 150 }
export const BC_PATTIES: readonly { x: number; y: number; rx: number; ry: number }[] = [
  { x: -150, y: -60, rx: 70, ry: 48 },
  { x: -10, y: -70, rx: 64, ry: 46 },
  { x: 130, y: -56, rx: 72, ry: 50 },
  { x: -90, y: 62, rx: 66, ry: 46 },
  { x: 60, y: 66, rx: 70, ry: 48 },
]
/** Where the sides land on the plate, round its centre and within its radius. */
export const BC_PLATE = { x: 440, y: 1120, r: 230 }
/** The bowl's inside, which the sauce fills: its middle x, its bottom and brim, and how far the inner wall stands from the middle at each. */
export const BC_BOWL = { x: 440, bottom: 1400, top: 1010, bottomHalf: 150, topHalf: 240 }

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const wave = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`

// lò than: a squat clay brazier, glowing coals on top under a wire rack, and a wisp of smoke at each side
const STOVE =
  wave('M150,980 q-16,-24 0,-48 t0,-48 M730,990 q16,-24 0,-48 t0,-48', C.steamBlue, 10) +
  `<path d="M140,1250 H740 L700,1440 H180Z" fill="${C.clay}" ${ink(6)}/>` +
  `<path d="M190,1300 H690" stroke="${C.clayLight}" stroke-width="10" stroke-linecap="round"/>` +
  `<rect x="330" y="1340" width="220" height="70" rx="20" fill="${C.deepBrown}" ${ink(5)}/>` +
  wave('M370,1395 q20,-20 40,0 t40,0 t40,0', C.stoneHot, 8) +
  `<rect x="130" y="1200" width="620" height="70" rx="26" fill="${C.deepBrown}" ${ink(6)}/>` +
  [180, 260, 340, 420, 500, 580, 660].map((x, i) => `<ellipse cx="${x + 20}" cy="1232" rx="34" ry="20" fill="${i % 2 ? C.stoneHot : C.lantern}"/>`).join('') +
  `<rect x="120" y="1180" width="640" height="24" rx="12" fill="${C.stoneLight}" ${ink(4)}/>`

// a round enamel plate with a blue rim and a nest of white rice noodles in its middle
const PLATE =
  `<ellipse cx="440" cy="1120" rx="300" ry="240" fill="${C.cream}" ${ink(6)}/>` +
  `<ellipse cx="440" cy="1120" rx="262" ry="206" fill="none" stroke="${C.cobalt}" stroke-width="8"/>` +
  `<ellipse cx="380" cy="1090" rx="120" ry="80" fill="${C.paper}" ${ink(4)}/>` +
  wave('M290,1080 q30,-24 60,0 t60,0 t60,0 M300,1110 q30,-24 60,0 t60,0 t50,0', C.tileSeam, 5)

// bát nước chấm: a wide bowl seen from the side, its blue band, and its foot
const BOWL =
  `<path d="M190,1000 H690 L600,1420 H280Z" fill="${C.cream}" ${ink(7)}/>` +
  `<path d="M210,1060 H670" stroke="${C.cobalt}" stroke-width="10"/>` +
  `<rect x="320" y="1410" width="240" height="34" rx="14" fill="${C.tileSeam}" ${ink(5)}/>`

// rau: a crisp lettuce leaf with its rib and veins
const RAU =
  `<path d="M30,56 Q6,40 10,20 Q14,6 30,4 Q46,6 50,20 Q54,40 30,56Z" fill="${C.leafLight}" ${ink(3.5)}/>` +
  wave('M30,54 V12 M30,40 L18,30 M30,40 L42,30 M30,26 L21,18 M30,26 L39,18', C.leaf, 3)

// đu đủ: three thin orange slices of pickled green papaya and a carrot round
const DU =
  [[16, 'M10,46 Q14,14 24,8'], [30, 'M24,50 Q28,16 38,10'], [44, 'M38,50 Q42,18 52,12']]
    .map(([, d]) => `<path d="${d}" stroke="${C.ink}" stroke-width="11" fill="none" stroke-linecap="round"/>` + wave(d as string, C.bambooLight, 6))
    .join('') + `<circle cx="18" cy="44" r="9" fill="${C.stoneHot}" ${ink(3)}/>`

// ớt: a red chili with its green cap
const OT =
  `<path d="M14,48 Q8,26 24,14 Q40,6 50,16 Q34,18 28,30 Q22,42 14,48Z" fill="${C.lantern}" ${ink(3.5)}/>` +
  `<path d="M44,14 Q50,4 56,8" stroke="${C.leaf}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="47" cy="15" rx="6" ry="5" fill="${C.leaf}" ${ink(2.5)}/>`

/** The Bún chả pictures: the stove, the plate, the bowl and the three sides. */
export function bunChaTextures(): Record<string, string> {
  return {
    'bc-stove': svgDoc(BC_BOX.stove, 1, STOVE),
    'bc-plate': svgDoc(BC_BOX.plate, 1, PLATE),
    'bc-bowl': svgDoc(BC_BOX.bowl, 1, BOWL),
    'bc-rau': svgDoc([0, 0, 60, 60], 1, RAU),
    'bc-du': svgDoc([0, 0, 60, 60], 1, DU),
    'bc-ot': svgDoc([0, 0, 60, 60], 1, OT),
  }
}
