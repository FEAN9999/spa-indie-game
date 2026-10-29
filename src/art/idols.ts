import type { IdolId } from '../sim/idols'
import type { Part } from './chibi'

// The nine stars, not tinted, in chibi units on the game's own part origins: each body piece on the body's
// (shoulders at y 0, hips at 18), each face and hair piece on the head's (its centre). Seen from the side they
// face right, like the face; seen from behind they show no front details. Every viewBox is centred on x = 0
// so a flipped piece stays in place.

const INK = '#4A2E22'
const LINE = `stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"`
const THIN = `stroke="${INK}" stroke-width=".8" stroke-linejoin="round"`
const FINE = `stroke="${INK}" stroke-width="0.9" stroke-linecap="round" fill="none"`
const EYE = '#2B201C'
const GOLD = '#E3A73B'
const RED = '#D8463A'
const RED_DARK = '#A8302A'
const CREAM = '#FBF7EE'
const SILVER = '#C9CED6'
const STRAND = '#5A4A44'
const BLUSH = '<ellipse rx="2.2" ry="1.2" fill="#F09A86" opacity=".75"'
const BODY_VB: Part['viewBox'] = [-11, -2.5, 22, 22]
const FACE_VB: Part['viewBox'] = [-14.5, -14, 29, 28]
const HAIR_VB: Part['viewBox'] = [-18, -26, 36, 40]

/** A thin band in `color` with an ink edge. */
const twoTone = (d: string, color: string, w = 1.1) =>
  `<path d="${d}" stroke="${INK}" stroke-width="${w + 1.4}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
  `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
/** Keeps what is drawn inside the body's outline; `id` is the texture's own. */
const onBody = (id: string, inner: string) =>
  `<clipPath id="${id}"><rect x="-8.35" y="0.65" width="16.7" height="16.7" rx="6.35"/></clipPath><g clip-path="url(#${id})">${inner}</g>`
const sparkle = (x: number, y: number, s: number, fill = '#ffffff') =>
  `<path d="M${x},${y - s} L${x + s * 0.28},${y - s * 0.28} L${x + s},${y} L${x + s * 0.28},${y + s * 0.28} L${x},${y + s} L${x - s * 0.28},${y + s * 0.28} L${x - s},${y} L${x - s * 0.28},${y - s * 0.28}Z" fill="${fill}"/>`
/** A daisy of `n` long white petals round a gold heart. */
const daisy = (cx: number, cy: number, r: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i * 360) / n
    return `<ellipse cx="${cx}" cy="${cy - r * 0.55}" rx="${r * 0.2}" ry="${r * 0.48}" transform="rotate(${a} ${cx} ${cy})" fill="#ffffff" stroke="${INK}" stroke-width=".6"/>`
  }).join('') + `<circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="${GOLD}" stroke="${INK}" stroke-width=".7"/>`
/** The point `deg` degrees clockwise from +x and `r` from the origin. */
const at = (deg: number, r: number): [number, number] => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r]
const xy = ([x, y]: [number, number]) => `${x.toFixed(2)},${y.toFixed(2)}`
/** A jacket from behind: its collar at the neck in `collar`, and the vent at the hem. */
const jacketBack = (collar: string) =>
  `<path d="M-5.2,0.2 Q0,2.6 5.2,0.2 L4.8,2.2 Q0,4.6 -4.8,2.2Z" fill="${collar}" ${LINE}/><path d="M0,13.4 V17.6" ${FINE}/>`

// Taylor Swift: straight bangs over her honey-blond hair, red lips, a periwinkle top sewn with sequins
const bangsDown = (color: string) =>
  `<path d="M-10.6,-2.4 Q-10.4,-11 0,-11.2 Q10.4,-11 10.6,-2.4 Q9.2,-0.8 7.8,-2.2 Q6.4,-0.4 4.8,-2 Q3.2,-0.2 1.6,-1.8 Q0,-0.2 -1.6,-1.8 Q-3.2,-0.2 -4.8,-2 Q-6.4,-0.4 -7.8,-2.2 Q-9.2,-0.8 -10.6,-2.4Z" fill="${color}" ${LINE}/>`
// from the side: the fringe from the crown to the brow, its points over the eye
const bangsSide = (color: string) =>
  `<path d="M-2.4,-11.2 A11.4,11.4 0 0 1 10.9,-3.2 Q10.4,-0.4 9.2,-2 Q8.2,-0.2 7,-2 Q5.8,-0.4 4.6,-2.4 Q3.4,-1 2.2,-3.2 Q0.6,-3 -0.4,-5.4 Q-1.8,-7.6 -2.4,-11.2Z" fill="${color}" ${LINE}/>`
const TAYLOR_HAIR = '#E9C46A'
const redLipsDown = `<path d="M-2.3,5.4 Q-1.2,4.4 0,5.1 Q1.2,4.4 2.3,5.4 Q1.3,7.6 0,7.6 Q-1.3,7.6 -2.3,5.4Z" fill="${RED}" ${THIN}/><path d="M-1.6,5.8 Q0,6.4 1.6,5.8" stroke="${RED_DARK}" stroke-width=".5" fill="none"/>`
const redLipsSide = `<path d="M7.2,6 Q8.2,5 9,5.6 Q9.6,5.2 10,5.8 Q9.6,7.8 8.4,7.6 Q7.4,7.4 7.2,6Z" fill="${RED}" ${THIN}/><path d="M7.6,6.4 Q8.6,6.8 9.6,6.2" stroke="${RED_DARK}" stroke-width=".5" fill="none"/>`
const SEQUIN_DOT = '#E9EEFB'
const sequins = (id: string, stars: [number, number, number][], dots: [number, number][]) =>
  onBody(id, stars.map(([x, y, s]) => sparkle(x, y, s)).join('') + dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="${SEQUIN_DOT}"/>`).join(''))
const sequinsDown =
  sequins('sequins-down', [[-5, 4, 1.6], [3.6, 3, 1.2], [5.4, 9, 1.7], [-3, 10, 1.3], [0.6, 14.6, 1.6], [-6, 15, 1], [6, 15.6, 1]], [[-1.2, 6.6], [2, 8.4], [-6.4, 8], [3.2, 12.2], [-2.6, 15.6], [6.6, 5.4]]) +
  `<path d="M-3.6,0.2 Q0,4.6 3.6,0.2" ${FINE}/>`
const sequinsSide =
  sequins('sequins-side', [[-5.4, 4.4, 1.4], [5.4, 4.6, 1.3], [6, 10.4, 1.7], [-4.6, 11, 1.4], [3.8, 15.6, 1.4], [-6.2, 15.4, 1]], [[-6.8, 7.6], [7, 7.6], [-2.8, 15.8], [6.8, 13.4], [-3.2, 2]]) +
  `<path d="M2.4,0.2 Q4.6,3.4 6.4,1" ${FINE}/>`
const sequinsUp =
  sequins('sequins-up', [[-4.6, 4.4, 1.5], [4.4, 3.6, 1.2], [5.2, 10, 1.6], [-3.6, 10.4, 1.3], [0.4, 15, 1.5], [-6, 15.4, 1], [6, 15.8, 1]], [[1.2, 6.6], [-2, 8.4], [6.4, 8], [-3.2, 12.2], [2.6, 15.6], [-6.6, 5.4]]) +
  `<path d="M-3.6,0.2 Q0,1.8 3.6,0.2" ${FINE}/>`

// The Weeknd: a red suit with darker lapels over a black shirt, a thin moustache and a chin beard
const SUIT_RED = '#9E2530'
const redSuitDown =
  `<path d="M-3.8,-0.2 L0,7 L3.8,-0.2Z" fill="${EYE}" ${LINE}/>` +
  `<path d="M-3.8,-0.2 L-0.4,9.6 L-6.4,4.6 Z M3.8,-0.2 L0.4,9.6 L6.4,4.6 Z" fill="${SUIT_RED}" ${LINE}/>` +
  `<circle cx="1.6" cy="12" r=".8" fill="${EYE}"/><circle cx="1.6" cy="15" r=".8" fill="${EYE}"/>`
const redSuitSide =
  onBody('redSuit-side', `<path d="M3,-1 L6.6,7.4 L10,7.4 V-1Z" fill="${EYE}" ${LINE}/>`) +
  `<path d="M3,-0.4 L6.2,9.4 L1.8,5Z" fill="${SUIT_RED}" ${LINE}/>` +
  `<circle cx="7" cy="12" r=".8" fill="${EYE}"/><circle cx="6.6" cy="15" r=".8" fill="${EYE}"/>`
const redSuitUp = jacketBack(SUIT_RED)
const moustacheDown =
  `<path d="M-3.8,4.7 Q-2,3.3 0,4.2 Q2,3.3 3.8,4.7 Q2,4.6 0,4.9 Q-2,4.6 -3.8,4.7Z" fill="${EYE}"/>` +
  `<path d="M-1.4,8.6 Q0,9.8 1.4,8.6" stroke="${EYE}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`
const moustacheSide =
  `<path d="M6.6,4.9 Q8.4,3.6 10,4.4 Q8.6,4.9 6.6,4.9Z" fill="${EYE}"/>` +
  `<path d="M5.4,8.8 Q6.6,9.6 7.6,8.4" stroke="${EYE}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`

// Justin Bieber: a butter-yellow hoodie, its hood round the neck, cream drawstrings and a front pocket; a charcoal beanie
const HOODIE_DARK = '#E2B94A'
const hoodieDown =
  onBody('hoodie-down', `<path d="M-7.4,12 H7.4 L8.6,18 H-8.6Z" fill="${HOODIE_DARK}" ${LINE}/>`) +
  `<path d="M-8.4,2.4 Q-9.6,-1.8 -4.8,-1.6 Q0,2.8 4.8,-1.6 Q9.6,-1.8 8.4,2.4 Q0,7.2 -8.4,2.4Z" fill="${HOODIE_DARK}" ${LINE}/>` +
  twoTone('M-2.2,3.6 V9.4 M2.2,3.6 V9.4', CREAM, 0.8)
// from the side the hood bunches at the back of the neck, one drawstring hangs at the front and the pocket shows below
const hoodieSide =
  onBody('hoodie-side', `<path d="M1.2,12 H10 V19 H0.4Z" fill="${HOODIE_DARK}" ${LINE}/>`) +
  `<path d="M-8.6,3.4 Q-10.4,-1.4 -5,-1.6 Q-0.4,0.4 3.4,-0.8 Q5.4,2.6 1.4,4.8 Q-4.4,6.6 -8.6,3.4Z" fill="${HOODIE_DARK}" ${LINE}/>` +
  twoTone('M5,2.6 V8.6', CREAM, 0.8)
// from behind the hood lies on the back
const hoodieUp =
  `<path d="M-6.6,-0.6 Q0,-2 6.6,-0.6 Q7.6,5 3.4,8.4 Q0,10 -3.4,8.4 Q-7.6,5 -6.6,-0.6Z" fill="${HOODIE_DARK}" ${LINE}/>` +
  `<path d="M-3.6,1 Q0,5.4 3.6,1" ${FINE}/>`
/** The beanie, its crown centred on cx, with its ribs and its turned-up cuff. */
const beanie = (cx: number) =>
  `<path d="M${cx - 11.8},-3.4 Q${cx - 12.8},-16.4 ${cx},-16.8 Q${cx + 12.8},-16.4 ${cx + 11.8},-3.4Z" fill="#4A4E57" ${LINE}/>` +
  `<path d="M${cx - 4},-15.6 Q${cx - 3.4},-10 ${cx - 3.6},-6.6 M${cx + 4},-15.6 Q${cx + 3.4},-10 ${cx + 3.6},-6.6 M${cx},-16.6 V-6.8" stroke="#3A3D45" stroke-width=".8" fill="none"/>` +
  `<path d="M${cx - 12.4},-7 Q${cx},-9.6 ${cx + 12.4},-7 L${cx + 12.2},-2.4 Q${cx},-5 ${cx - 12.2},-2.4Z" fill="#5C616B" ${LINE}/>` +
  `<path d="M${cx - 8.6},-7.6 V-3.4 M${cx - 4.4},-8.4 V-4.2 M${cx},-8.6 V-4.4 M${cx + 4.4},-8.4 V-4.2 M${cx + 8.6},-7.6 V-3.4" stroke="#474B54" stroke-width=".8" fill="none"/>`

// G-Dragon: pink hair, all in black with a big white daisy on the chest, gold hoops at the ears
const daisyPinDown = daisy(-3.6, 6.6, 4.6, 11)
// from the side the daisy is at the front of the chest, seen edge-on
const daisyPinSide = `<g transform="translate(5.2 6.6) scale(.62 1)">${daisy(0, 0, 4.6, 11)}</g>`
const hoopsDown = twoTone('M-12.2,4.2 a1.4,1.4 0 1 0 2.8,0 a1.4,1.4 0 1 0 -2.8,0 M9.4,4.2 a1.4,1.4 0 1 0 2.8,0 a1.4,1.4 0 1 0 -2.8,0', GOLD, 0.7)
// from the side one hoop hangs below the hair at the back of the jaw
const hoopsSide = twoTone('M-10.7,5.8 a1.3,1.3 0 1 0 2.6,0 a1.3,1.3 0 1 0 -2.6,0', GOLD, 0.7)

// Taeyang: a tall black mohawk over shaved sides, a white tank and a silver chain with a tag
const MOHAWK =
  'M-3.2,-9.4 L-4,-14.6 L-1.8,-13.6 L-1.8,-19.4 L0.2,-16.4 L1.6,-20.6 L2.4,-15.4 L4.2,-16.2 L3.2,-9.4 Q0,-8.4 -3.2,-9.4Z'
const mohawkDown =
  `<path d="${MOHAWK}" fill="${EYE}" ${LINE}/>` +
  `<path d="M-0.8,-10.4 V-15.2 M1.4,-10.4 Q1.6,-13.4 1.8,-16" stroke="${STRAND}" stroke-width=".8" fill="none" stroke-linecap="round"/>`
/**
 * From the side, a crest from the forehead over the crown, its spikes standing up and swept a little back, tallest on top,
 * then a low strip down the back of the head to the nape; its lower edge sits inside the hair.
 */
const MOHAWK_SIDE = (() => {
  const spikes: [deg: number, h: number][] = [[-32, 5], [-50, 7.6], [-69, 9.4], [-88, 10], [-107, 9], [-126, 7.4], [-145, 5]]
  const outer = spikes.flatMap(([deg, h], i) => {
    const [bx, by] = at(deg, 11)
    // halfway between straight out and straight up, then a touch towards the back
    const [rx, ry] = at(deg, 1)
    const len = Math.hypot(rx - 0.3, ry - 1)
    const tip: [number, number] = [bx + ((rx - 0.3) / len) * h, by + ((ry - 1) / len) * h]
    const next = spikes[i + 1]
    return next ? [tip, at((deg + next[0]) / 2, 11.2)] : [tip]
  })
  const points = [at(-24, 10.8), ...outer, at(-156, 11.6), at(180, 11.8), at(162, 11.2), at(160, 9.4), at(180, 9.4), at(-150, 9.2), at(-120, 9), at(-90, 9), at(-60, 9), at(-30, 9.2)]
  return `M${points.map(xy).join(' L')}Z`
})()
const mohawkSide =
  `<path d="${MOHAWK_SIDE}" fill="${EYE}" ${LINE}/>` +
  `<path d="M${xy(at(-72, 10))} L${xy(at(-74, 15.4))} M${xy(at(-92, 10))} L${xy(at(-95, 16))}" stroke="${STRAND}" stroke-width=".8" fill="none" stroke-linecap="round"/>`
// from behind: the spikes mirrored, and the strip down the back of the head to the nape
const mohawkUp =
  `<path d="M3.2,-9.4 L3,2 Q2.4,6.6 0,7 Q-2.4,6.6 -3,2 L-3.2,-9.4Z" fill="${EYE}" ${LINE}/>` +
  `<g transform="scale(-1 1)"><path d="${MOHAWK}" fill="${EYE}" ${LINE}/></g>` +
  `<path d="M0,-12 V4.6" stroke="${STRAND}" stroke-width=".8" fill="none" stroke-linecap="round"/>`
const tankChainDown =
  `<path d="M-5.6,0.4 Q-4.4,3.6 -6.6,6.4 M5.6,0.4 Q4.4,3.6 6.6,6.4" ${FINE}/>` +
  twoTone('M-3.8,0.8 Q0,8.6 3.8,0.8', SILVER, 0.7) +
  `<rect x="-1.3" y="7" width="2.6" height="3.6" rx=".7" fill="${SILVER}" ${THIN}/>`
// from the side: the armhole round the near arm, the chain hanging at the front
const tankChainSide =
  `<path d="M-3.6,0.4 Q-4.2,7 0,7.4 Q4.2,7 3.6,0.4" ${FINE}/>` +
  twoTone('M-1.8,0.4 Q2.6,2 5.4,5.8', SILVER, 0.7) +
  `<rect x="4.4" y="5.8" width="2.2" height="3.4" rx=".7" fill="${SILVER}" ${THIN}/>`
// from behind: the racer back and the chain round the neck
const tankChainUp = `<path d="M-5.6,0.4 Q-2.4,4.4 -1.8,9.6 M5.6,0.4 Q2.4,4.4 1.8,9.6" ${FINE}/>` + twoTone('M-3.8,0.6 Q0,2.4 3.8,0.6', SILVER, 0.7)

// Daesung: the crescent-eyed grin, a navy suit, a white collar and a red bow tie
const GRIN_MOUTH = '#B8443A'
const TONGUE = '#F09A86'
const faceGrin =
  `<path d="M-5.8,2.8 Q-4,0.4 -2.2,2.8 M2.2,2.8 Q4,0.4 5.8,2.8" stroke="${EYE}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
  `${BLUSH} cx="-7" cy="5.4"/>${BLUSH} cx="7" cy="5.4"/>` +
  `<path d="M-3,4.8 Q0,5.6 3,4.8 Q2.4,9 0,9 Q-2.4,9 -3,4.8Z" fill="${GRIN_MOUTH}" ${THIN}/><path d="M-1.4,7.8 Q0,7 1.4,7.8 Q0,8.8 -1.4,7.8Z" fill="${TONGUE}"/>`
const faceGrinSide =
  `<path d="M4.4,2.8 Q6,0.4 7.6,2.8" stroke="${EYE}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
  `${BLUSH} cx="7.2" cy="5.6"/>` +
  `<path d="M6.6,5.2 Q8.2,5.6 9.4,5 Q9.2,8 7.8,8 Q6.8,7.8 6.6,5.2Z" fill="${GRIN_MOUTH}" ${THIN}/><path d="M7.2,7.4 Q8,6.8 8.8,7.4 Q8,8 7.2,7.4Z" fill="${TONGUE}"/>`
const NAVY_LAPEL = '#24304D'
const bowTieSuitDown =
  `<path d="M-3.6,-0.2 L0,6 L3.6,-0.2Z" fill="${CREAM}" ${LINE}/>` +
  `<path d="M-3.6,-0.2 L-0.4,8.6 L-6,4.4 Z M3.6,-0.2 L0.4,8.6 L6,4.4 Z" fill="${NAVY_LAPEL}" ${LINE}/>` +
  `<path d="M0,1.8 L-3.6,0.2 L-3.6,3.6Z M0,1.8 L3.6,0.2 L3.6,3.6Z" fill="${RED}" ${THIN}/><circle cx="0" cy="1.8" r="1" fill="${RED_DARK}" ${THIN}/>`
const bowTieSuitSide =
  onBody('bowTieSuit-side', `<path d="M3,-1 L6.4,6.4 L10,6.4 V-1Z" fill="${CREAM}" ${LINE}/>`) +
  `<path d="M3,-0.4 L5.8,8.6 L1.8,4.8Z" fill="${NAVY_LAPEL}" ${LINE}/>` +
  `<path d="M6,1.8 L4.2,0.4 L4.2,3.2Z M6,1.8 L7.6,0.8 L7.6,2.8Z" fill="${RED}" ${THIN}/><circle cx="6" cy="1.8" r=".9" fill="${RED_DARK}" ${THIN}/>`
const bowTieSuitUp = jacketBack(NAVY_LAPEL)

// HIEUTHUHAI: a cobalt cap worn backwards, the strap's gap over the forehead, and a cream jersey with a cobalt 2
const COBALT = '#2D5FA8'
const CAP_PEAK = '#244C86'
const CAP_SEAM = '#1E3F70'
/** The cap's dome centred on cx. */
const capDome = (cx: number) =>
  `<path d="M${cx - 11.6},-7.6 Q${cx - 12.2},-19 ${cx},-19.4 Q${cx + 12.2},-19 ${cx + 11.6},-7.6 Q${cx},-10 ${cx - 11.6},-7.6Z" fill="${COBALT}" ${LINE}/>`
/** The dome's seams and its button, centred on cx. */
const capSeams = (cx: number) =>
  `<path d="M${cx - 7},-17.6 Q${cx - 3.8},-13.6 ${cx - 4.2},-9.4 M${cx + 7},-17.6 Q${cx + 3.8},-13.6 ${cx + 4.2},-9.4" stroke="${CAP_SEAM}" stroke-width=".7" fill="none"/>` +
  `<circle cx="${cx}" cy="-19" r="1.1" fill="${COBALT}" ${THIN}/>`
const backCapDown = (hair: string) =>
  capDome(0) +
  `<path d="M-3.4,-8.8 Q-3.4,-12.8 0,-12.8 Q3.4,-12.8 3.4,-8.8Z" fill="${hair}" ${THIN}/>` +
  `<path d="M-4.8,-13.4 H4.8" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M-4.8,-13.4 H4.8" stroke="${CREAM}" stroke-width="1" stroke-linecap="round"/>` +
  capSeams(0)
// from the side: the peak points back over the nape, and the strap's gap shows at the forehead
const backCapSide = (hair: string) =>
  `<path d="M-8.6,-8.6 Q-16.4,-8.2 -17.2,-5.2 Q-10,-4.2 -5.6,-5.6Z" fill="${CAP_PEAK}" ${LINE}/>` +
  capDome(-1) +
  capSeams(-1) +
  `<path d="M6.4,-8.6 Q6.8,-11.6 8.8,-11.6 Q10.4,-11.4 10.6,-8.2Z" fill="${hair}" ${THIN}/>` +
  `<path d="M6,-12.8 L9.2,-12.4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M6,-12.8 L9.2,-12.4" stroke="${CREAM}" stroke-width="1" stroke-linecap="round"/>`
// from behind: the dome, with the peak towards us
const backCapUp = capDome(0) + capSeams(0) + `<path d="M-11.2,-8 Q0,-10.6 11.2,-8 Q12.2,-4 0,-3.6 Q-12.2,-4 -11.2,-8Z" fill="${CAP_PEAK}" ${LINE}/>`
const jerseyDown =
  twoTone('M-3.6,0.4 L0,4.6 L3.6,0.4', COBALT, 1) +
  twoTone('M-2.4,8.4 Q-2.2,6.2 0.2,6.2 Q2.6,6.2 2.6,8.2 Q2.6,10 -2.4,14.4 H2.8', COBALT, 1.5)
const jerseySide = twoTone('M2,0.4 L4.8,4.2 L6,1.6', COBALT, 1)
// from behind: the round collar and a big 2
const jerseyUp =
  twoTone('M-3.8,0.6 Q0,2.6 3.8,0.6', COBALT, 1) +
  twoTone('M-3.6,6.6 Q-3.4,3.6 0.2,3.6 Q3.8,3.6 3.8,6.4 Q3.8,9 -3.6,15 H4.2', COBALT, 1.9)

// Sơn Tùng M-TP: a high swept quiff, an open black jacket over a white tee, and a gold chain
const quiffDown = (color: string) =>
  `<path d="M-10.8,-4.6 Q-12.4,-13 -6.2,-16.8 Q0,-21 7.6,-18.4 Q11.8,-16.4 11.2,-11 Q8.8,-13.6 4.6,-13.2 Q10,-10.6 11,-5.4 Q6,-9.6 0,-9.4 Q-6.2,-9.2 -10.8,-4.6Z" fill="${color}" ${LINE}/>` +
  `<path d="M-5.6,-12.4 Q0,-17.4 6.8,-16.2 M-2.4,-10.6 Q2,-13.6 6,-13" stroke="${STRAND}" stroke-width=".8" fill="none" stroke-linecap="round"/>`
// from the side: risen high over the forehead and swept back over the crown
const quiffSide = (color: string) =>
  `<path d="M11,-3.6 Q14,-9.6 12,-15.6 Q8.4,-21.2 0.4,-19.6 Q-7,-18.2 -10.6,-11.4 Q-5.4,-13.6 0,-12.8 Q5.4,-11.8 7.6,-8.2 Q9.6,-5.6 11,-3.6Z" fill="${color}" ${LINE}/>` +
  `<path d="M-4.8,-15.6 Q2,-18.8 9.2,-15.4 M-1.6,-13.6 Q4.4,-14.6 8.8,-10.6" stroke="${STRAND}" stroke-width=".8" fill="none" stroke-linecap="round"/>`
// from behind: the hair risen higher over the crown, edged only on top so it runs into the hair below
const QUIFF_UP = 'M-11.4,-1.6 Q-12.4,-14 -6.4,-18 Q0,-20.8 6,-17.6 Q11.8,-14 11.4,-1.6'
const quiffUp = (color: string) =>
  `<path d="${QUIFF_UP} Q0,-6 -11.4,-1.6Z" fill="${color}"/><path d="${QUIFF_UP}" fill="none" ${LINE}/>` +
  `<path d="M-5.6,-14.6 Q0,-18 5.4,-15 M-6.6,-8.6 Q0,-11.4 6.4,-8.8" stroke="${STRAND}" stroke-width=".8" fill="none" stroke-linecap="round"/>`
const JACKET = '#3A302C'
const goldChainJacketDown =
  `<path d="M-3.8,-0.2 L-1.6,17.6 H1.6 L3.8,-0.2Z" fill="${CREAM}" ${LINE}/>` +
  `<path d="M-3.8,-0.2 L-1.4,9 L-6.4,4.6 Z M3.8,-0.2 L1.4,9 L6.4,4.6 Z" fill="${JACKET}" ${LINE}/>` +
  twoTone('M-3.4,0.6 Q0,7.6 3.4,0.6', GOLD, 0.8) +
  `<circle cx="0" cy="5.4" r="1.2" fill="${GOLD}" ${THIN}/>`
const goldChainJacketSide =
  onBody('goldChainJacket-side', `<path d="M3.4,-1 L6.2,19 H10 V-1Z" fill="${CREAM}" ${LINE}/>`) +
  `<path d="M3.4,-0.4 L5.6,9 L1.8,4.8Z" fill="${JACKET}" ${LINE}/>` +
  twoTone('M-2,0.6 Q2.6,1.6 5.8,5', GOLD, 0.8) +
  `<circle cx="6.2" cy="5.8" r="1.2" fill="${GOLD}" ${THIN}/>`
const goldChainJacketUp = jacketBack(JACKET)

// Jennie: bangs over long black hair and a cream bow, and a cream tweed jacket with black trim and gold buttons
const BOW =
  `<path d="M6.6,-9.6 Q3,-13.6 2.8,-9.4 Q3,-6.4 6.6,-9.6Z M6.6,-9.6 Q10.6,-13.4 10.8,-9.2 Q10.4,-6.4 6.6,-9.6Z" fill="${CREAM}" ${LINE}/>` +
  `<path d="M6.2,-9.2 L4.8,-5 M7,-9.2 L8.8,-5.4" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M6.2,-9.2 L4.8,-5 M7,-9.2 L8.8,-5.4" stroke="${CREAM}" stroke-width="1" stroke-linecap="round"/>` +
  `<circle cx="6.6" cy="-9.6" r="1.3" fill="${CREAM}" ${THIN}/>`
/** The bow moved `dx` along from where it sits seen from the front. */
const bow = (dx: number) => (dx ? `<g transform="translate(${dx} 0)">${BOW}</g>` : BOW)
const TWEED_DOTS = Array.from({ length: 26 }, (_, i) => `<circle cx="${((i * 37) % 17) - 8}" cy="${1.5 + ((i * 53) % 16)}" r=".45" fill="#CDBBA2"/>`).join('')
const tweedDown =
  onBody('tweed-down', TWEED_DOTS + `<path d="M-3.4,-0.2 Q0,4 3.4,-0.2" fill="${EYE}"/>`) +
  twoTone('M-3.4,0.2 L-1.4,17.4 M3.4,0.2 L1.4,17.4', EYE, 0.9) +
  twoTone('M-7,11.2 H-3.2 M3.2,11.2 H7', EYE, 0.9) +
  `<circle cx="-2.6" cy="7.4" r=".8" fill="${GOLD}" ${THIN}/><circle cx="2.6" cy="7.4" r=".8" fill="${GOLD}" ${THIN}/>`
const tweedSide =
  onBody('tweed-side', TWEED_DOTS + `<path d="M2.4,-0.4 Q4.8,3.6 7,0.2" fill="${EYE}"/>`) +
  twoTone('M5.4,1 Q7.2,8 4.8,17', EYE, 0.9) +
  twoTone('M3.2,11.2 H6.4', EYE, 0.9) +
  `<circle cx="5.6" cy="7.4" r=".8" fill="${GOLD}" ${THIN}/>`
const tweedUp = onBody('tweed-up', TWEED_DOTS) + twoTone('M-4,0.6 Q0,2.6 4,0.6', EYE, 0.9)

const body = (b: string): Part => ({ viewBox: BODY_VB, body: b })
const face = (b: string): Part => ({ viewBox: FACE_VB, body: b })
const hair = (b: string): Part => ({ viewBox: HAIR_VB, body: b })

/** `<piece>-<dir>` for every piece a star wears, on the body's, the face's or the head's origin, and Daesung's grin. */
export const IDOL_PARTS: Record<string, Part> = {
  'bangsTaylor-down': hair(bangsDown(TAYLOR_HAIR)),
  'bangsTaylor-side': hair(bangsSide(TAYLOR_HAIR)),
  'redLips-down': face(redLipsDown),
  'redLips-side': face(redLipsSide),
  'sequins-down': body(sequinsDown),
  'sequins-side': body(sequinsSide),
  'sequins-up': body(sequinsUp),
  'redSuit-down': body(redSuitDown),
  'redSuit-side': body(redSuitSide),
  'redSuit-up': body(redSuitUp),
  'moustache-down': face(moustacheDown),
  'moustache-side': face(moustacheSide),
  'hoodie-down': body(hoodieDown),
  'hoodie-side': body(hoodieSide),
  'hoodie-up': body(hoodieUp),
  'beanie-down': hair(beanie(0)),
  'beanie-side': hair(beanie(-1)),
  'beanie-up': hair(beanie(0)),
  'daisyPin-down': body(daisyPinDown),
  'daisyPin-side': body(daisyPinSide),
  'hoops-down': face(hoopsDown),
  'hoops-side': face(hoopsSide),
  'tankChain-down': body(tankChainDown),
  'tankChain-side': body(tankChainSide),
  'tankChain-up': body(tankChainUp),
  'mohawk-down': hair(mohawkDown),
  'mohawk-side': hair(mohawkSide),
  'mohawk-up': hair(mohawkUp),
  'face-grin': face(faceGrin),
  'face-grinSide': face(faceGrinSide),
  'bowTieSuit-down': body(bowTieSuitDown),
  'bowTieSuit-side': body(bowTieSuitSide),
  'bowTieSuit-up': body(bowTieSuitUp),
  'backCap-down': hair(backCapDown(EYE)),
  'backCap-side': hair(backCapSide(EYE)),
  'backCap-up': hair(backCapUp),
  'jersey-down': body(jerseyDown),
  'jersey-side': body(jerseySide),
  'jersey-up': body(jerseyUp),
  'quiff-down': hair(quiffDown(EYE)),
  'quiff-side': hair(quiffSide(EYE)),
  'quiff-up': hair(quiffUp(EYE)),
  'goldChainJacket-down': body(goldChainJacketDown),
  'goldChainJacket-side': body(goldChainJacketSide),
  'goldChainJacket-up': body(goldChainJacketUp),
  'bangsJennie-down': hair(bangsDown(EYE)),
  'bangsJennie-side': hair(bangsSide(EYE)),
  'bow-down': hair(bow(0)),
  'bow-side': hair(bow(-10.8)),
  'bow-up': hair(bow(-13.2)),
  'tweed-down': body(tweedDown),
  'tweed-side': body(tweedSide),
  'tweed-up': body(tweedUp),
}

/**
 * Each star's own colours: the skin is SKIN[i] of their look, written out here because palette.ts reads this
 * file and this one must not read it back; the hair, its style and the shirt are their own.
 */
export const IDOL_COLORS: Record<IdolId, { skin: number; hair: number; hairStyle: number; shirt: number }> = {
  sontung: { skin: 0xf7d5b8, hair: 0x2b201c, hairStyle: 2, shirt: 0x2b2422 },
  taylor: { skin: 0xf7d5b8, hair: 0xe9c46a, hairStyle: 1, shirt: 0xb7c3ea },
  gd: { skin: 0xf7d5b8, hair: 0xf49ab4, hairStyle: 2, shirt: 0x2e2624 },
  jennie: { skin: 0xf7d5b8, hair: 0x2b201c, hairStyle: 1, shirt: 0xf3e9da },
  hieuthuhai: { skin: 0xf7d5b8, hair: 0x2b201c, hairStyle: 2, shirt: 0xfbf7ee },
  weeknd: { skin: 0xb97f58, hair: 0x2b201c, hairStyle: 2, shirt: 0xc8323a },
  taeyang: { skin: 0xebc3a0, hair: 0x6e5d55, hairStyle: 2, shirt: 0xf4f1ea },
  bieber: { skin: 0xf7d5b8, hair: 0x9a5b36, hairStyle: 2, shirt: 0xf2d16b },
  daesung: { skin: 0xf7d5b8, hair: 0x5b3a29, hairStyle: 2, shirt: 0x2d3a5c },
}
