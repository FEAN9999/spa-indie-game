import type { OutfitId } from '../sim/outfits'
import type { Part } from './chibi'

// The owner's outfits, not tinted, in chibi units on the game's own part origins: each torso on the body's
// (shoulders at y 0, hips at 18, feet at 27), each sleeve on the arm's (the shoulder at 0,0) and each hat on
// the head's (its centre). Seen from the side they face right, like the face; seen from behind they show
// no front details. The bà ba has none: it stays the tinted body.

export type DressedId = Exclude<OutfitId, 'baba'> | 'teacher'

const INK = '#4A2E22'
const LINE = `stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"`
const FINE = `stroke="${INK}" stroke-width="0.9" stroke-linecap="round" fill="none"`
const EDGE = `stroke="${INK}" stroke-width=".6"`
const TORSO_VB: Part['viewBox'] = [-11, -2.5, 22, 30]
const ARM_VB: Part['viewBox'] = [-3.2, -1.2, 6.4, 12.4]
const HAT_VB: Part['viewBox'] = [-18, -26, 36, 40]

const TEAL = '#2F7D6E'
const CREAM = '#FBF7EE'
const DEEP = '#2B201C'
const SOFT = '#7A5E50'
const GOLD = '#E3A73B'
const GOLD_DARK = '#C78A22'
const RED = '#D8463A'
const RED_DARK = '#A8302A'
const LOTUS = '#F28CA0'
const MAI = '#F2C14E'
/** The teacher's purple áo dài. */
const TEACHER = '#8E6BB0'
const STRAW = '#E4C77A'
const STRAW_DARK = '#AE8E48'

/** A thin band in `color` with an ink edge. */
const twoTone = (d: string, color: string, w = 1.1) =>
  `<path d="${d}" stroke="${INK}" stroke-width="${w + 1.4}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
  `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
/** A shape filled `fill`, then the texture's pattern over it if it has one, then its ink edge on top. */
const shape = (d: string, fill: string, pattern: boolean) =>
  `<path d="${d}" fill="${fill}"/>` + (pattern ? `<path d="${d}" fill="url(#pat)"/>` : '') + `<path d="${d}" fill="none" ${LINE}/>`
/** A flower of `n` round petals around a centre. */
const flower = (cx: number, cy: number, r: number, n: number, petal: string, centre: string) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((i * 360) / n - 90) * (Math.PI / 180)
    return `<circle cx="${(cx + Math.cos(a) * r * 0.56).toFixed(2)}" cy="${(cy + Math.sin(a) * r * 0.56).toFixed(2)}" r="${(r * 0.46).toFixed(2)}" fill="${petal}" ${EDGE}/>`
  }).join('') + `<circle cx="${cx}" cy="${cy}" r="${(r * 0.36).toFixed(2)}" fill="${centre}" ${EDGE}/>`

const PATTERNS = {
  // gạch bông: cream four-petal tiles on the cloth
  tile: `<pattern id="pat" width="4.4" height="4.4" patternUnits="userSpaceOnUse"><circle cx="2.2" cy="1.2" r=".8" fill="${CREAM}"/><circle cx="2.2" cy="3.2" r=".8" fill="${CREAM}"/><circle cx="1.2" cy="2.2" r=".8" fill="${CREAM}"/><circle cx="3.2" cy="2.2" r=".8" fill="${CREAM}"/><circle cx="2.2" cy="2.2" r=".5" fill="${GOLD}"/></pattern>`,
  // gấm: a gold lattice of small diamonds
  brocade: `<pattern id="pat" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><path d="M1.6,0.5 L2.5,1.6 L1.6,2.7 L0.7,1.6Z" fill="${GOLD}" opacity=".9"/></pattern>`,
}

type Outfit = { down: string; side: string; up: string; sleeve: string; hat?: [down: string, side: string, up: string] }

// --- áo dài: white trousers at the hips, a fitted top, long panels to the ankles and a stand collar ---

const HIPS = `<path d="M-6.3,12 H6.3 L6.1,18.2 Q3.6,18.8 1.1,18.2 L0,16.6 L-1.1,18.2 Q-3.6,18.8 -6.1,18.2Z" fill="${CREAM}" ${LINE}/>`
const AO_DAI_TORSO = 'M-8.6,4.8 Q-8.6,0.2 -4,0 H4 Q8.6,0.2 8.6,4.8 L8,12.6 Q7.6,14.4 5.2,14.4 H-5.2 Q-7.6,14.4 -8,12.6Z'
const AO_DAI_PANEL = 'M-4.4,13.4 L-5.1,23.4 Q0,24.6 5.1,23.4 L4.4,13.4Z'
const COLLAR = (fill: string) => `<path d="M-3.1,-1.6 H3.1 Q3.5,-1.6 3.5,-1.2 V1.2 Q0,2.2 -3.5,1.2 V-1.2 Q-3.5,-1.6 -3.1,-1.6Z" fill="${fill}" ${LINE}/>`
const OPENING = `<path d="M2.4,1.8 Q5.6,2.4 7.6,5.4" ${FINE}/><circle cx="4.2" cy="2.35" r=".42" fill="${INK}"/><circle cx="5.9" cy="3.3" r=".42" fill="${INK}"/>`
// in profile: the trousers between the two panels, each panel seen edge-on as it falls from the waist
const HIPS_SIDE = `<path d="M-5.4,12 H5.4 L5.2,18.2 Q2.8,18.8 0.5,18.2 L0,17.2 L-0.5,18.2 Q-2.8,18.8 -5.2,18.2Z" fill="${CREAM}" ${LINE}/>`
const FRONT_PANEL_SIDE = 'M0.6,13 H7.8 Q7.4,19 6.6,23.6 Q4.8,24.4 3,23.8 Q1.8,18.2 0.6,13Z'
const BACK_PANEL_SIDE = 'M-0.6,13 H-7.8 Q-7.4,19 -6.6,23.6 Q-4.8,24.4 -3,23.8 Q-1.8,18.2 -0.6,13Z'
const COLLAR_SIDE = (fill: string) => `<path d="M-3.4,-1.2 Q-3.4,-1.6 -3,-1.6 H3.2 Q3.6,-1.6 3.6,-1.2 V1.8 Q0,1.6 -3.4,0.6Z" fill="${fill}" ${LINE}/>`

/** A long sleeve to the wrist, the hand still showing. */
const longSleeve = (cloth: string, cuff?: string) =>
  `<rect x="-2.35" y="-0.6" width="4.7" height="8.8" rx="2.2" fill="${cloth}" ${LINE}/>` + (cuff ? `<path d="M-2.2,7.2 H2.2" stroke="${cuff}" stroke-width="1.2"/>` : '')

type AoDai = { cloth: string; pattern?: keyof typeof PATTERNS; trim?: string; cuff?: string; front?: string; side?: string; hat?: Outfit['hat'] }
/** An áo dài from the front, the side and behind; `front` and `side` are what shows only from there. */
function aoDai({ cloth, pattern, trim = cloth, cuff, front = '', side = '', hat }: AoDai): Outfit {
  const defs = pattern ? `<defs>${PATTERNS[pattern]}</defs>` : ''
  const cut = (d: string) => shape(d, cloth, !!pattern)
  const back = defs + HIPS + cut(AO_DAI_PANEL) + cut(AO_DAI_TORSO) + COLLAR(trim)
  return {
    down: back + OPENING + front,
    side: defs + HIPS_SIDE + cut(BACK_PANEL_SIDE) + cut(FRONT_PANEL_SIDE) + cut(AO_DAI_TORSO) + COLLAR_SIDE(trim) + side,
    up: back,
    sleeve: longSleeve(cloth, cuff),
    hat,
  }
}

// --- the hats, worn over the hair ---

// nón lá: a straw cone with a pink chin strap
const NON_LA =
  `<path d="M0,-24.5 L16.4,-7.8 Q0,-3.4 -16.4,-7.8Z" fill="${STRAW}" ${LINE}/>` +
  `<path d="M-11,-12.8 Q0,-10 11,-12.8 M-5.8,-18.4 Q0,-16.8 5.8,-18.4" stroke="${STRAW_DARK}" stroke-width=".8" fill="none"/>` +
  `<path d="M0,-24.5 L-4,-5.6 M0,-24.5 L4,-5.6" stroke="${STRAW_DARK}" stroke-width=".6" fill="none"/>`
const nonLaStrap = (d: string) => `<path d="${d}" stroke="#E8708A" stroke-width=".7" fill="none"/>`
const NON_LA_HAT: Outfit['hat'] = [nonLaStrap('M-10.9,-7 Q-11.8,8.4 0,11.3 Q11.8,8.4 10.9,-7') + NON_LA, nonLaStrap('M-0.6,-6 Q-0.2,7.6 6.2,9.6') + NON_LA, NON_LA]

/** khăn vấn: a ring of twisted cloth round the head, in `cloth` with `twist` lines; from the side it sits a little further back. */
const khanVanHat = (cloth: string, twist: string): Outfit['hat'] => {
  const ring =
    `<path d="M-11.8,-4.4 Q-12.6,-12.8 0,-13.6 Q12.6,-12.8 11.8,-4.4 Q6,-8.4 0,-8.2 Q-6,-8.4 -11.8,-4.4Z" fill="${cloth}" ${LINE}/>` +
    `<path d="M-8.4,-7.8 L-5,-12.4 M-3.2,-8.4 L0.4,-13.2 M2.2,-8.4 L5.8,-12.8 M7.2,-7.8 L9.8,-11.4" stroke="${twist}" stroke-width=".9" stroke-linecap="round" fill="none"/>`
  return [ring, `<g transform="translate(-1 0)">${ring}</g>`, ring]
}

// the flower crown: a green vine of pink and cream flowers, a gold jewel at the front
const VINE = `<path d="M-11.6,-6 Q0,-15.6 11.6,-6" stroke="#4E9A6B" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
const CROWN_FLOWERS = ([[-10.4, -7.6, LOTUS], [-6.6, -11.2, CREAM], [-2.2, -12.8, LOTUS], [2.2, -12.8, CREAM], [6.6, -11.2, LOTUS], [10.4, -7.6, CREAM]] as const)
  .map(([x, y, c]) => flower(x, y, 3, 5, c, GOLD))
  .join('')
const FLOWER_CROWN: Outfit['hat'] = [
  VINE + CROWN_FLOWERS + `<path d="M0,-17.6 L1.6,-14.6 L0,-12.6 L-1.6,-14.6Z" fill="${GOLD}" ${LINE}/>`,
  `<g transform="translate(-1 0)">${VINE}${CROWN_FLOWERS}</g>` + `<path d="M8.4,-16 L9.6,-13.4 L8.4,-11.6 L7.2,-13.4Z" fill="${GOLD}" ${LINE}/>`,
  VINE + CROWN_FLOWERS,
]

// --- the nine outfits but the bà ba ---

/** The cream lotus on the front panel, centred on cx and squeezed to `k` of its width. */
const lotusFlower = (cx: number, k: number) => {
  const x = (v: number) => (cx + v * k).toFixed(2)
  return `<path d="M${x(0)},16.8 Q${x(-2.4)},19.6 ${x(0)},22 Q${x(2.4)},19.6 ${x(0)},16.8Z M${x(0)},22 Q${x(-4)},21.4 ${x(-3.8)},18.6 Q${x(-1.4)},19.6 ${x(0)},22Z M${x(0)},22 Q${x(4)},21.4 ${x(3.8)},18.6 Q${x(1.4)},19.6 ${x(0)},22Z" fill="${CREAM}" ${EDGE}/>`
}
const maiFlowers = (at: [number, number][]) => at.map(([x, y]) => flower(x, y, 2.2, 5, '#FFF2D3', RED)).join('')
const MEDAL =
  `<circle cx="-4.6" cy="8.6" r="2.2" fill="${GOLD}" ${LINE}/>` +
  `<path d="M-4.6,7.4 L-4.1,8.4 L-3.2,8.5 L-3.9,9.2 L-3.7,10 L-4.6,9.6 L-5.5,10 L-5.3,9.2 L-6,8.5 L-5.1,8.4Z" fill="${CREAM}"/>`

// Đồng phục spa: a cream tunic with a teal hem, collar and piping, and a teal leaf on the chest
const UNIFORM_BODY =
  `<defs><clipPath id="b"><rect x="-9" y="0" width="18" height="18" rx="7"/></clipPath></defs>` +
  `<rect x="-9" y="0" width="18" height="18" rx="7" fill="${CREAM}"/>` +
  `<g clip-path="url(#b)"><rect x="-10" y="14" width="20" height="5" fill="${TEAL}"/></g>` +
  `<path d="M-9,14 H9" ${FINE}/><rect x="-9" y="0" width="18" height="18" rx="7" fill="none" ${LINE}/>`
const UNIFORM_COLLAR = `<path d="M-3.2,-0.9 H3.2 V1.8 Q0,2.8 -3.2,1.8Z" fill="${TEAL}" ${LINE}/>`
const leaf = (x: number) => `<path d="M${x},4.4 Q${(x + 2).toFixed(1)},6.6 ${x},8.8 Q${(x - 2).toFixed(1)},6.6 ${x},4.4Z" fill="${TEAL}" ${EDGE}/>`

/** A short sleeve over the shoulder, with a band of `band` at its hem. */
const shortSleeve = (cloth: string, band?: string) =>
  `<rect x="-2.35" y="-0.6" width="4.7" height="5.4" rx="2.2" fill="${cloth}" ${LINE}/>` + (band ? `<path d="M-2.2,3.4 H2.2" stroke="${band}" stroke-width="1.2"/>` : '')

// Bà ba khăn rằn: a deep brown bà ba with a checked scarf tied at the throat
const CHECK = `<defs><pattern id="ck" width="1.8" height="1.8" patternUnits="userSpaceOnUse"><rect width="1.8" height="1.8" fill="${CREAM}"/><rect width=".9" height=".9" fill="${DEEP}"/><rect x=".9" y=".9" width=".9" height=".9" fill="${DEEP}"/></pattern></defs>`
const BABA_DEEP = `<rect x="-9" y="0" width="18" height="18" rx="7" fill="${DEEP}" ${LINE}/>`
const checked = (d: string) => `<path d="${d}" fill="url(#ck)" ${LINE}/>`

const OUTFITS: Record<DressedId, Outfit> = {
  uniform: {
    down: UNIFORM_BODY + UNIFORM_COLLAR + twoTone('M3,2 Q6.2,3.2 7.6,6.8', TEAL) + leaf(-4.6),
    // from the side: the collar dips at the throat and the leaf sits at the front; the piping is on the far side
    side: UNIFORM_BODY + `<path d="M-3,-0.9 H3.4 V2.4 Q0,2.2 -3,1.2Z" fill="${TEAL}" ${LINE}/>` + leaf(5.2),
    up: UNIFORM_BODY + UNIFORM_COLLAR,
    sleeve: shortSleeve(CREAM, TEAL),
  },
  khanran: {
    down:
      CHECK + BABA_DEEP + `<path d="M-3,0.4 V2.6 H3 V0.4 M0,2.6 V17" stroke="${SOFT}" stroke-width=".9" fill="none"/>` +
      checked('M-4.6,1.6 L4.6,1.6 L0,9.6Z') + checked('M-6.6,0.4 Q0,4 6.6,0.4 L5.6,-1 Q0,1.8 -5.6,-1Z') +
      `<circle cx="0" cy="2.2" r="1.5" fill="${CREAM}" ${LINE}/>`,
    // from the side: the scarf round the neck, its tail down the front of the chest and the knot at the throat
    side:
      CHECK + BABA_DEEP + checked('M-4.6,-0.4 Q0.6,1.6 5.6,1 L6.4,3.6 Q0.4,4.2 -5,2Z') + checked('M3.2,2.6 L8.2,3.6 L6.2,10.6Z') +
      `<circle cx="5.4" cy="2.8" r="1.5" fill="${CREAM}" ${LINE}/>`,
    up: CHECK + BABA_DEEP + checked('M-6.6,0.2 Q0,2.8 6.6,0.2 L5.6,-1 Q0,1 -5.6,-1Z'),
    sleeve: shortSleeve(DEEP),
  },
  teal: aoDai({ cloth: TEAL }),
  lotus: aoDai({ cloth: LOTUS, front: lotusFlower(0, 1), side: lotusFlower(4.7, 0.5), hat: NON_LA_HAT }),
  tile: aoDai({ cloth: '#2D5FA8', pattern: 'tile', trim: CREAM }),
  mai: aoDai({
    cloth: MAI,
    trim: RED,
    front: maiFlowers([[-2.2, 16.6], [2.4, 19.4], [-1.6, 21.8], [4.6, 7.6], [-5, 5]]),
    side: maiFlowers([[4.8, 17.2], [4.4, 21.4], [-4.8, 19.4], [5.4, 6.2], [-5.2, 9.4]]),
    hat: khanVanHat(MAI, GOLD_DARK),
  }),
  gam: aoDai({ cloth: RED_DARK, pattern: 'brocade', trim: GOLD, cuff: GOLD, hat: khanVanHat(RED_DARK, GOLD) }),
  teacher: aoDai({ cloth: TEACHER, trim: CREAM, hat: NON_LA_HAT }),
  year: aoDai({
    cloth: '#FFF8EC',
    trim: GOLD,
    cuff: GOLD,
    // a red sash with a gold stripe from the right shoulder to the left hip, and a gold medal
    front: `<path d="M-7.4,1.6 L-4.6,0.2 L8.2,12.4 L7.4,15.4Z" fill="${RED}" ${LINE}/><path d="M-6.6,2.2 L7.8,14.4" stroke="${GOLD}" stroke-width=".7"/>` + MEDAL,
    side: `<path d="M-3.4,0.8 L-0.2,-0.2 L8.4,10.4 L7.8,13.8Z" fill="${RED}" ${LINE}/><path d="M-1.8,0.4 L8.1,12.1" stroke="${GOLD}" stroke-width=".7"/>` + `<g transform="translate(9.8 0)">${MEDAL}</g>`,
    hat: FLOWER_CROWN,
  }),
}

/** The trouser colour each outfit tints the legs with: cream under every áo dài. */
export const OUTFIT_PANTS: Record<DressedId, number> = {
  uniform: 0x2a6b5c,
  khanran: 0x2b201c,
  teal: 0xfbf7ee,
  lotus: 0xfbf7ee,
  tile: 0xfbf7ee,
  mai: 0xfbf7ee,
  gam: 0xfbf7ee,
  year: 0xfbf7ee,
  teacher: 0xfbf7ee,
}

/** The outfits worn with a hat over the hair. */
export const OUTFIT_HAS_HAT: readonly (OutfitId | 'teacher')[] = (Object.keys(OUTFITS) as DressedId[]).filter(id => OUTFITS[id].hat)

const DIRS = ['down', 'side', 'up'] as const

/** `outfit-<id>-<dir>` on the body's origin, `sleeve-<id>` on each arm's and `outfitHat-<id>-<dir>` on the head's. */
export const OUTFIT_PARTS: Record<string, Part> = Object.fromEntries(
  Object.entries(OUTFITS).flatMap(([id, o]) => [
    ...DIRS.map(d => [`outfit-${id}-${d}`, { viewBox: TORSO_VB, body: o[d] }]),
    [`sleeve-${id}`, { viewBox: ARM_VB, body: o.sleeve }],
    ...(o.hat ?? []).map((body, i) => [`outfitHat-${id}-${DIRS[i]}`, { viewBox: HAT_VB, body }]),
  ]),
)
