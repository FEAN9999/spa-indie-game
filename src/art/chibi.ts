import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

/**
 * Character parts in "chibi units" (feet at 0,0, y up is negative), drawn white or grey
 * so `setTint` colors them. CharacterView assembles them using PART_ANCHORS and CHIBI_PX.
 */
export const CHIBI_PX = 2.4 // canvas pixels per chibi unit (character ~122px, about 1.5 tiles tall)

type Part = { viewBox: [number, number, number, number]; body: string }

const W = '#ffffff'
const SHADE = '#e6e6e6'
const INK = '#4A2E22'
const LINE = `stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"`
const FINE = `stroke="${INK}" stroke-width="0.9" stroke-linecap="round" fill="none"`

const leg: Part = {
  viewBox: [-3.6, -1.2, 7.2, 13.2],
  body: `<rect x="-2.5" y="0" width="5" height="11" rx="2.3" fill="${W}" ${LINE}/><rect x="-2.7" y="8" width="5.4" height="3.2" rx="1.6" fill="#8f8f8f" ${LINE}/>`,
}

const arm: Part = {
  viewBox: [-3.2, -1.2, 6.4, 12.4],
  body: `<rect x="-2" y="0" width="4" height="10.5" rx="2" fill="${W}" ${LINE}/>`,
}

// áo bà ba: band collar and a centre seam
const body: Part = {
  viewBox: [-10, -1, 20, 20],
  body: `<rect x="-9" y="0" width="18" height="18" rx="7" fill="${W}" ${LINE}/><path d="M-3,0.4 V2.6 H3 V0.4 M0,2.6 V17" ${FINE}/>`,
}

// not tinted: the staff apron over the body, cream with a brown edge
const APRON = `fill="#FBF7EE" stroke="#8A5634" stroke-width="1.4" stroke-linejoin="round"`
const apronDown: Part = {
  viewBox: body.viewBox,
  body:
    `<path d="M-3,2 L-4.8,6.5 M3,2 L4.8,6.5" stroke="#8A5634" stroke-width="1.4" stroke-linecap="round" fill="none"/>` +
    `<path d="M-4.8,6 H4.8 L5.4,11 L8,17.4 Q0,19 -8,17.4 L-5.4,11Z" ${APRON}/>` +
    `<path d="M-5.2,11 H5.2" ${FINE}/>`,
}
const apronSide: Part = {
  viewBox: body.viewBox,
  body: `<path d="M4,5 H8.2 Q9,5 9,6 V16.6 Q9,17.6 8,17.6 H4Z" ${APRON}/><path d="M4.4,11 H8.6" ${FINE}/>`,
}

const head: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body: `<circle cx="-11" cy="1.5" r="2.6" fill="#f0f0f0" ${LINE}/><circle cx="11" cy="1.5" r="2.6" fill="#f0f0f0" ${LINE}/><circle cx="0" cy="0" r="11" fill="${W}" ${LINE}/>`,
}

const EYE = '#2B201C'
const BLUSH = '<ellipse rx="2.2" ry="1.2" fill="#F09A86" opacity=".75"'
const MOUTH = `stroke="${INK}" stroke-width=".8" fill="none" stroke-linecap="round"`
const faceDown: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<ellipse cx="-4" cy="2" rx="1.6" ry="2" fill="${EYE}"/><ellipse cx="4" cy="2" rx="1.6" ry="2" fill="${EYE}"/>` +
    `<circle cx="-3.5" cy="1.2" r=".6" fill="#fff"/><circle cx="4.5" cy="1.2" r=".6" fill="#fff"/>` +
    `${BLUSH} cx="-6.8" cy="5.2"/>${BLUSH} cx="6.8" cy="5.2"/>` +
    `<path d="M-1.6,5.4 Q0,6.9 1.6,5.4" ${MOUTH}/>`,
}
const faceSide: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<ellipse cx="6" cy="2" rx="1.5" ry="2" fill="${EYE}"/><circle cx="6.4" cy="1.2" r=".55" fill="#fff"/>` +
    `${BLUSH} cx="7.6" cy="5.4"/>` +
    `<path d="M7.6,6.2 Q8.6,7 9.6,6" ${MOUTH}/>`,
}
// eyes closed, relaxed on the shampoo bed
const faceRest: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<path d="M-5.6,2 Q-4,3.4 -2.4,2 M2.4,2 Q4,3.4 5.6,2" stroke="${EYE}" stroke-width=".9" fill="none" stroke-linecap="round"/>` +
    `${BLUSH} cx="-6.8" cy="5.2"/>${BLUSH} cx="6.8" cy="5.2"/>` +
    `<path d="M-1.6,5.4 Q0,6.9 1.6,5.4" ${MOUTH}/>`,
}

// not tinted: the terracotta towel over a lying customer, origin at its top centre
const blanket: Part = {
  viewBox: [-13, -1, 26, 62],
  body: `<rect x="-12" y="0" width="24" height="60" rx="5" fill="#C65D3B" ${LINE}/><path d="M-12,6 H12" stroke="#FBF7EE" stroke-width="1.6"/>`,
}

// Not tinted: what each kind of customer wears. Body pieces share the body's origin, face and hat pieces the head's;
// every viewBox is centred on x = 0 so a flipped piece stays in place.

// student: a teal backpack, its straps seen from the front, its side, or the whole bag from behind
const BAG = '#2F7D6E'
const BAG_LIGHT = '#3E9682'
const BUCKLE = '#E3A73B'
const strap = (x: number) => `<rect x="${x}" y="-0.6" width="2.6" height="12" rx="1.3" fill="${BAG}" ${LINE}/>`
const buckle = (x: number, y: number) => `<rect x="${x}" y="${y}" width="2.4" height="2.2" rx=".6" fill="${BUCKLE}" stroke="${INK}" stroke-width=".9"/>`
const backpackDown: Part = { viewBox: body.viewBox, body: strap(-6.8) + strap(4.2) + buckle(-6.7, 7) + buckle(4.3, 7) }
const backpackSide: Part = {
  viewBox: [-16.5, -2, 33, 19],
  body:
    `<path d="M-8.4,3 Q-2,-1.2 4.4,2.6 L5,11.4" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    `<path d="M-8.4,3 Q-2,-1.2 4.4,2.6 L5,11.4" stroke="${BAG}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    `<rect x="-14.4" y="0.6" width="7.6" height="14.4" rx="3.4" fill="${BAG}" ${LINE}/>` +
    `<rect x="-15.8" y="7.4" width="4" height="6.4" rx="1.8" fill="${BAG_LIGHT}" ${LINE}/>` +
    `<path d="M-14.4,4.4 H-6.8" ${FINE}/>`,
}
const backpackUp: Part = {
  viewBox: body.viewBox,
  body:
    `<rect x="-7.2" y="1" width="14.4" height="15" rx="4.2" fill="${BAG}" ${LINE}/>` +
    `<path d="M-7.2,5.4 Q-7.2,1 -3,1 H3 Q7.2,1 7.2,5.4 V7.4 Q0,9.8 -7.2,7.4Z" fill="${BAG_LIGHT}" ${LINE}/>` +
    `<rect x="-4.8" y="10.6" width="9.6" height="4.4" rx="1.8" fill="${BAG_LIGHT}" ${LINE}/>` +
    buckle(-1.2, 7.4),
}

// office worker: a white collar and a red striped tie, seen from the front only
const tieDown: Part = {
  viewBox: body.viewBox,
  body:
    `<path d="M-0.2,1.6 L-3.8,-0.2 L-4.6,2.6 L-1.4,4Z M0.2,1.6 L3.8,-0.2 L4.6,2.6 L1.4,4Z" fill="#FBF7EE" ${LINE}/>` +
    `<path d="M-1,4.2 L-2.1,11.2 L0,13.4 L2.1,11.2 L1,4.2Z" fill="#D8463A" ${LINE}/>` +
    `<path d="M-1.4,8 L1.4,6.6 M-1.8,11 L1.8,9.4" stroke="#A8302A" stroke-width=".9" stroke-linecap="round"/>` +
    `<path d="M-1.6,2.2 H1.6 L1.1,4.6 H-1.1Z" fill="#D8463A" ${LINE}/>`,
}

// picky customer: round glasses and a frown
const GLASS = 'fill="#CFE8F0" fill-opacity=".35"'
const glassesDown: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<path d="M-7.6,1.2 L-10.8,0.2 M7.6,1.2 L10.8,0.2 M-1.2,1.4 Q0,0.6 1.2,1.4" ${FINE}/>` +
    `<circle cx="-4.2" cy="2.2" r="3.1" ${GLASS} ${LINE}/><circle cx="4.2" cy="2.2" r="3.1" ${GLASS} ${LINE}/>`,
}
const glassesSide: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body: `<path d="M4.4,1.4 L-3.6,0.4" ${FINE}/><ellipse cx="6.7" cy="2.2" rx="2.3" ry="3.1" ${GLASS} ${LINE}/>`,
}
const faceFrown: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<ellipse cx="-4" cy="2.3" rx="1.6" ry="1.7" fill="${EYE}"/><ellipse cx="4" cy="2.3" rx="1.6" ry="1.7" fill="${EYE}"/>` +
    `<path d="M-6.6,-2.4 L-2.2,-1.3 M6.6,-2.4 L2.2,-1.3" stroke="${EYE}" stroke-width="1.1" stroke-linecap="round"/>` +
    `<path d="M-1.8,6.6 Q0,5.2 1.8,6.6" ${MOUTH}/>`,
}

// celebrity: dark sunglasses and a wide-brimmed cream hat with a black band
const SHADES = `fill="${EYE}" ${LINE}`
const SHINE = 'stroke="#ffffff" stroke-opacity=".7" stroke-width=".9" stroke-linecap="round"'
const sunglassesDown: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<path d="M-8.4,0.8 L-11,0 M8.4,0.8 L11,0 M-1,1.1 Q0,0.4 1,1.1" ${FINE}/>` +
    `<path d="M-8.4,0 H-1 Q-0.6,0 -0.7,0.8 Q-1.1,5.4 -4.6,5.4 Q-8.2,5.4 -8.6,0.8 Q-8.7,0 -8.4,0Z" ${SHADES}/>` +
    `<path d="M8.4,0 H1 Q0.6,0 0.7,0.8 Q1.1,5.4 4.6,5.4 Q8.2,5.4 8.6,0.8 Q8.7,0 8.4,0Z" ${SHADES}/>` +
    `<path d="M-6.8,1.6 L-5.2,1.6 M2.6,1.6 L4.2,1.6" ${SHINE}/>`,
}
const sunglassesSide: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<path d="M4.4,0.8 L-3.6,0.2" ${FINE}/>` +
    `<path d="M4.4,0 H9 Q9.4,0 9.3,0.8 Q9,5.2 6.8,5.2 Q4.4,5.2 4.2,0.8 Q4.2,0 4.4,0Z" ${SHADES}/>` +
    `<path d="M5.6,1.6 L7,1.6" ${SHINE}/>`,
}
const HAT = `fill="#FBF7EE" ${LINE}`
const BAND = `fill="#2B201C" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"`
/** The hat's brim, its crown centred on cx and its band, then `extra` (a ribbon or a bow) on top. */
const hat = (cx: number, extra: string): Part => ({
  viewBox: [-17.5, -20.5, 35, 20],
  body:
    `<ellipse cx="0" cy="-5.4" rx="16" ry="4.2" ${HAT}/>` +
    `<path d="M${cx - 8.8},-5.6 Q${cx - 9.6},-18.6 ${cx},-18.6 Q${cx + 9.6},-18.6 ${cx + 8.8},-5.6 Q${cx},-3.6 ${cx - 8.8},-5.6Z" ${HAT}/>` +
    `<path d="M${cx - 9},-9.4 Q${cx},-7.4 ${cx + 9},-9.4 L${cx + 8.9},-6.4 Q${cx},-4.4 ${cx - 8.9},-6.4Z" ${BAND}/>` +
    extra,
})
const hatDown = hat(0, '')
const hatSide = hat(-1, `<path d="M-9.6,-8.4 Q-12.4,-6 -13,-2.2 L-10.8,-2.8 Q-10.6,-5.6 -9.4,-6.6Z" ${BAND}/>`)
const hatUp = hat(0, `<path d="M0,-7.4 Q-3.6,-10.2 -3.8,-6.6 Q-3.6,-4 0,-6.4 Q3.6,-4 3.8,-6.6 Q3.6,-10.2 0,-7.4Z" ${BAND}/>`)

// Not tinted: what each regular wears in place of their kind's things, on the same origins and centred the same way.

/** A thin band in `color` with an ink edge: a strap, a wire or a gold rim. */
const twoTone = (d: string, color: string, w = 1.1) =>
  `<path d="${d}" stroke="${INK}" stroke-width="${w + 1.4}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
  `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
const PETAL = `stroke="${INK}" stroke-width=".8"`
/** A flower of `n` round petals around a centre. */
const flower = (cx: number, cy: number, r: number, n: number, petal: string, centre: string) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((i * 360) / n - 90) * (Math.PI / 180)
    return `<circle cx="${(cx + Math.cos(a) * r * 0.56).toFixed(2)}" cy="${(cy + Math.sin(a) * r * 0.56).toFixed(2)}" r="${(r * 0.46).toFixed(2)}" fill="${petal}" ${PETAL}/>`
  }).join('') + `<circle cx="${cx}" cy="${cy}" r="${(r * 0.36).toFixed(2)}" fill="${centre}" ${PETAL}/>`
/** Hides what is drawn under the body's shape, for a thing carried behind it. */
const behindBody = (id: string, inner: string) =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="-30" y="-30" width="60" height="60"><rect x="-30" y="-30" width="60" height="60" fill="#fff"/>` +
  `<rect x="-9" y="0" width="18" height="18" rx="7" fill="#000"/></mask><g mask="url(#${id})">${inner}</g>`

// cô Hạnh: a red bib apron with a white pocket
const RED = '#D8463A'
const POCKET = `fill="#FBF7EE" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"`
const redApronDown: Part = {
  viewBox: body.viewBox,
  body:
    twoTone('M-3.4,3.8 Q-3.4,1.6 -2.4,0.4 M3.4,3.8 Q3.4,1.6 2.4,0.4', RED) +
    `<path d="M-4,3.4 H4 L4.6,9.6 L8,17.4 Q0,19 -8,17.4 L-4.6,9.6Z" fill="${RED}" ${LINE}/>` +
    `<path d="M-5,9.8 H5" ${FINE}/>` +
    `<rect x="-2.8" y="11.6" width="5.6" height="3.8" rx=".8" ${POCKET}/>`,
}
const redApronSide: Part = {
  viewBox: body.viewBox,
  body:
    twoTone('M4.6,4.6 Q2.8,1.6 0.6,0.6', RED) +
    `<path d="M4,4.4 H7.8 Q9,4.4 9,5.8 V16.6 Q9,17.6 8,17.6 H4Z" fill="${RED}" ${LINE}/>` +
    `<path d="M4.4,9.8 H8.6" ${FINE}/>` +
    `<rect x="5.4" y="11.6" width="2.8" height="3.4" rx=".6" ${POCKET}/>`,
}

// Vy: a teal drawing tube slung across her back on a brown strap; from the front its ends show past the shoulder and the hip
const TUBE = '#2F7D6E'
const TUBE_CAP = '#2A6B5C'
const BROWN = '#8A5634'
/** A drawing tube from (x1, y1) to (x2, y2), capped at both ends. */
const tube = (x1: number, y1: number, x2: number, y2: number) => {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  return (
    `<g transform="translate(${x1} ${y1}) rotate(${deg.toFixed(1)})">` +
    `<rect x="0" y="-2.2" width="${len.toFixed(2)}" height="4.4" rx="1.4" fill="${TUBE}" ${LINE}/>` +
    `<path d="M3.8,-0.9 H${(len - 3.8).toFixed(2)}" ${SHINE}/>` +
    `<rect x="-0.4" y="-2.6" width="3" height="5.2" rx="1" fill="${TUBE_CAP}" ${LINE}/>` +
    `<rect x="${(len - 2.6).toFixed(2)}" y="-2.6" width="3" height="5.2" rx="1" fill="${TUBE_CAP}" ${LINE}/></g>`
  )
}
const artTubeDown: Part = {
  viewBox: [-16, -7.5, 32, 29.5],
  body: behindBody('tube', tube(-13, -4.6, 11.6, 18.6)) + twoTone('M-5,0.6 L7.4,14.2', BROWN),
}
const artTubeSide: Part = {
  viewBox: [-16, -6.5, 32, 26],
  body: behindBody('tube', tube(-10, -4.5, -12.6, 14.5)) + twoTone('M-9.4,1.8 Q-3,-1 3.4,2.4 L6,13', BROWN),
}
const artTubeUp: Part = { viewBox: [-16, -6.5, 32, 27], body: tube(11.4, -3.4, -11.4, 17.4) }

// chú Sáu: an olive-green "nón cối", a round helmet with a narrow brim and a vent on top
const OLIVE = '#7E8C4A'
const OLIVE_DARK = '#5F6B36'
const OLIVE_LIGHT = '#9AA862'
const helmet = (cx: number): Part => ({
  viewBox: [-17.5, -22.5, 35, 22],
  body:
    `<ellipse cx="0" cy="-5" rx="15" ry="3.6" fill="${OLIVE_DARK}" ${LINE}/>` +
    `<path d="M${cx - 11.6},-5.4 Q${cx - 12.4},-19.4 ${cx},-19.4 Q${cx + 12.4},-19.4 ${cx + 11.6},-5.4 Q${cx},-3.2 ${cx - 11.6},-5.4Z" fill="${OLIVE}" ${LINE}/>` +
    `<path d="M${cx - 5},-18.4 Q${cx - 8},-12 ${cx - 7.4},-4.6 M${cx + 5},-18.4 Q${cx + 8},-12 ${cx + 7.4},-4.6" ${FINE}/>` +
    `<path d="M${cx - 9},-12.6 Q${cx - 7.6},-16.4 ${cx - 3.6},-17.6" ${SHINE}/>` +
    `<ellipse cx="${cx}" cy="-19.6" rx="2.4" ry="1.3" fill="${OLIVE_LIGHT}" ${LINE}/>`,
})
const helmetDown = helmet(0)
const helmetSide = helmet(-1)
const helmetUp = helmet(0)

// anh Khoa: black headphones resting round his neck
const PHONE = `fill="${EYE}" ${LINE}`
const PHONE_BAND = '#5A4A44'
const headphonesDown: Part = {
  viewBox: body.viewBox,
  body:
    twoTone('M-4.8,2.4 Q-8.4,-1.8 0,-1.8 Q8.4,-1.8 4.8,2.4', PHONE_BAND) +
    `<rect x="-7" y="1.4" width="4.6" height="5.2" rx="2" ${PHONE}/><rect x="2.4" y="1.4" width="4.6" height="5.2" rx="2" ${PHONE}/>` +
    `<path d="M-5.6,2.9 V4.6 M3.8,2.9 V4.6" ${SHINE}/>`,
}
const headphonesSide: Part = {
  viewBox: body.viewBox,
  body: twoTone('M4.4,2.4 Q-1,-2.4 -8,1', PHONE_BAND) + `<rect x="2.6" y="1" width="4.2" height="5" rx="1.9" ${PHONE}/><path d="M3.9,2.4 V3.8" ${SHINE}/>`,
}
const headphonesUp: Part = {
  viewBox: body.viewBox,
  body:
    twoTone('M-7,2.2 Q0,5.6 7,2.2', PHONE_BAND) +
    `<rect x="-9.6" y="0.4" width="4" height="4.6" rx="1.8" ${PHONE}/><rect x="5.6" y="0.4" width="4" height="4.6" rx="1.8" ${PHONE}/>`,
}

// bà Tư: gold-rimmed round glasses, and a jade silk scarf knotted at the neck
const GOLD = '#E3A73B'
const ring = (cx: number, cy: number, r: number) => `M${cx - r},${cy} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0`
const goldGlassesDown: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<circle cx="-4.2" cy="2.2" r="3.1" ${GLASS}/><circle cx="4.2" cy="2.2" r="3.1" ${GLASS}/>` +
    twoTone(`M-7.3,1.4 L-10.8,0.2 M7.3,1.4 L10.8,0.2 M-1.2,1.6 Q0,0.8 1.2,1.6 ${ring(-4.2, 2.2, 3.1)} ${ring(4.2, 2.2, 3.1)}`, GOLD, 0.9),
}
const goldGlassesSide: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<ellipse cx="6.7" cy="2.2" rx="2.3" ry="3.1" ${GLASS}/>` +
    twoTone('M4.4,1.4 L-3.6,0.4 M4.4,2.2 a2.3,3.1 0 1 0 4.6,0 a2.3,3.1 0 1 0 -4.6,0', GOLD, 0.9),
}
const JADE = '#4FA383'
const JADE_LIGHT = '#8CCFB4'
const SILK = `fill="${JADE}" ${LINE}`
const silkScarfDown: Part = {
  viewBox: body.viewBox,
  body:
    `<path d="M-6.8,0.4 Q0,4.4 6.8,0.4 L6.4,3.2 Q0,7.4 -6.4,3.2Z" ${SILK}/>` +
    `<path d="M-4.8,2.6 Q0,5 4.8,2.6" stroke="${JADE_LIGHT}" stroke-width=".9" stroke-linecap="round" fill="none"/>` +
    `<path d="M-3.8,6 L-6.2,12.4 L-3.6,11.6 L-2.6,6.4Z" ${SILK}/><path d="M-2.2,6.2 L-0.4,11.8 L1.8,10.4 L-1.2,5.8Z" ${SILK}/>` +
    `<ellipse cx="-2.8" cy="5.4" rx="1.9" ry="1.5" ${SILK}/>`,
}
const silkScarfSide: Part = {
  viewBox: body.viewBox,
  body:
    `<path d="M-7,0 Q0,3 6.6,1 L6.4,3.8 Q0,6 -6.8,2.8Z" ${SILK}/>` +
    `<path d="M5,4.4 L4.2,10.8 L6.8,10 L6.6,4.4Z" ${SILK}/>` +
    `<ellipse cx="5.6" cy="3.8" rx="1.6" ry="1.5" ${SILK}/>`,
}
const silkScarfUp: Part = {
  viewBox: body.viewBox,
  body:
    `<path d="M-6.8,0.4 Q0,3.6 6.8,0.4 L6.4,3 Q0,6.4 -6.4,3Z" ${SILK}/>` +
    `<path d="M-4.8,2.2 Q0,4.2 4.8,2.2" stroke="${JADE_LIGHT}" stroke-width=".9" stroke-linecap="round" fill="none"/>`,
}

// ông Ba: half-moon reading glasses low on the nose, and a folded paper fan held at the chest
const readingGlassesDown: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<path d="M-7.2,3 L-10.8,1.6 M7.2,3 L10.8,1.6 M-1.4,3.2 Q0,2.4 1.4,3.2" ${FINE}/>` +
    `<path d="M-7.2,2.8 H-1.4 Q-1.6,5.8 -4.3,5.8 Q-7,5.8 -7.2,2.8Z" ${GLASS} ${LINE}/>` +
    `<path d="M7.2,2.8 H1.4 Q1.6,5.8 4.3,5.8 Q7,5.8 7.2,2.8Z" ${GLASS} ${LINE}/>`,
}
const readingGlassesSide: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body: `<path d="M4.4,3 L-3.6,1" ${FINE}/><path d="M4.4,2.8 H9 Q8.8,5.6 6.8,5.6 Q4.6,5.6 4.4,2.8Z" ${GLASS} ${LINE}/>`,
}
/** The point `deg` degrees clockwise from +x and `r` from the origin, as "x,y". */
const polar = (deg: number, r: number) => `${(Math.cos((deg * Math.PI) / 180) * r).toFixed(2)},${(Math.sin((deg * Math.PI) / 180) * r).toFixed(2)}`
// a paper fan opened upward from its rivet at (0, 0), from 220 to 320 degrees: cream paper, a terracotta rim and five folds
const fan =
  `<path d="M0,0 L${polar(220, 7.4)} A7.4,7.4 0 0 1 ${polar(320, 7.4)}Z" fill="#FBF7EE" ${LINE}/>` +
  `<path d="M${polar(220, 5)} A5,5 0 0 1 ${polar(320, 5)} L${polar(320, 7.4)} A7.4,7.4 0 0 0 ${polar(220, 7.4)}Z" fill="#C65D3B" ${LINE}/>` +
  `<path d="${[1, 2, 3, 4, 5].map(i => `M0,0 L${polar(220 + (i * 100) / 6, 7.4)}`).join(' ')}" ${FINE}/>` +
  `<circle cx="0" cy="0" r="1" fill="${BROWN}" stroke="${INK}" stroke-width=".8"/>`
const paperFanDown: Part = { viewBox: body.viewBox, body: `<g transform="translate(-1.5 12.6)">${fan}</g>` }
const paperFanSide: Part = { viewBox: [-14, -1, 28, 20], body: `<g transform="translate(4.6 12.6) rotate(35)">${fan}</g>` }

// Thảo: a white flower clip on the right side of her hair
const flowerClip = (cx: number, cy: number): Part => ({ viewBox: [-14.5, -14, 29, 28], body: flower(cx, cy, 3.2, 5, '#ffffff', GOLD) })
const flowerClipDown = flowerClip(-7.4, -6.8)
const flowerClipSide = flowerClip(-4, -7.4)
const flowerClipUp = flowerClip(7.4, -6.8)

// Lan: a bunch of yellow daisies in brown paper, held at the chest
const daisies =
  `<ellipse cx="-3.8" cy="-8.4" rx="1.3" ry="2.8" transform="rotate(-35 -3.8 -8.4)" fill="#4E9A6B" ${PETAL}/>` +
  `<ellipse cx="3.8" cy="-8.4" rx="1.3" ry="2.8" transform="rotate(35 3.8 -8.4)" fill="#4E9A6B" ${PETAL}/>` +
  `<path d="M-4.2,-8 H4.2 L1.2,0 H-1.2Z" fill="#D9A866" ${LINE}/><path d="M-2.4,-3.2 H2.4" stroke="${RED}" stroke-width="1.2" stroke-linecap="round"/>` +
  flower(-2.6, -9.4, 2.8, 6, '#F2CC6B', BROWN) +
  flower(2.6, -9.4, 2.8, 6, '#F2CC6B', BROWN) +
  flower(0, -11.4, 2.8, 6, '#F2CC6B', BROWN)
const daisiesDown: Part = { viewBox: body.viewBox, body: `<g transform="translate(0 15.4)">${daisies}</g>` }
const daisiesSide: Part = { viewBox: [-14, -1, 28, 20], body: `<g transform="translate(5.4 15.2) rotate(20)">${daisies}</g>` }

// lying face up under the mask: a mint layer over the face with a cucumber slice on each eye
const CUCUMBER = 'fill="#DCEFB4" stroke="#4E9A6B" stroke-width="1.1"'
const maskFace: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<ellipse cx="0" cy="2.4" rx="9.4" ry="7.8" fill="#BFE8D2" ${LINE}/>` +
    `<circle cx="-4" cy="2" r="2.9" ${CUCUMBER}/><circle cx="4" cy="2" r="2.9" ${CUCUMBER}/>` +
    `<path d="M-4.9,2 H-3.1 M3.1,2 H4.9" stroke="#A8CC7E" stroke-width=".8" stroke-linecap="round"/>` +
    `<path d="M-1.6,6.4 Q0,7.7 1.6,6.4" ${MOUTH}/>`,
}

// lying face up in the mud tub: a cream towel wrapped round the hair, its two ends crossed and twisted over the forehead
const TOWEL = `fill="${C.paper}" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"`
const towelWrap: Part = {
  viewBox: [-14.5, -16, 29, 16],
  body:
    `<path d="M-11.9,-1.6 C-12.6,-11 -6.4,-14.4 0,-14.4 C6.4,-14.4 12.6,-11 11.9,-1.6 C9.2,-3.9 4.6,-5.3 0,-5.3 C-4.6,-5.3 -9.2,-3.9 -11.9,-1.6Z" fill="${C.paper}" ${LINE}/>` +
    `<path d="M-11.5,-2.8 C-8,-5.5 -3.4,-8 -0.2,-12.6 M11.5,-2.8 C8,-5.5 3.4,-8 0.2,-12.6" ${FINE}/>` +
    `<path d="M-2.6,-11.8 C-1.9,-14.2 1.9,-14.2 2.6,-11.8 C2.1,-10 -2.1,-10 -2.6,-11.8Z" ${TOWEL}/>`,
}

const STRAND = `stroke="${SHADE}" stroke-width="1.1" fill="none" stroke-linecap="round"`
const hair = (shape: string, strands: string, top = -14): Part => ({ viewBox: [-14.5, top, 29, 18 - top], body: `${shape}${strands}` })
const path = (d: string) => `<path d="${d}" fill="${W}" ${LINE}/>`

// Style 0: short bob. Style 1: long hair. Style 2: short crop. Style 3: bob with a bun.
const bobDown = 'M-12,0 A12,12 0 0 1 12,0 Q11,-5 6,-5.5 Q3,-2.5 0,-4.5 Q-3,-2.5 -6,-5.5 Q-11,-5 -12,0Z'
const bobSideLocks = 'M-12,-1 Q-12.6,5 -10,6.5 L-9.4,-1Z M12,-1 Q12.6,5 10,6.5 L9.4,-1Z'
const bobUp = 'M-12,0 A12,12 0 0 1 12,0 L12,3 Q11,9 5,10 Q0,11 -5,10 Q-11,9 -12,3Z'
const bobSide = 'M-12,2 A12,12 0 0 1 12,-1 Q9,-5.5 5,-5 Q4,-2 2,-3 Q-1,-1 -2,3 Q-3,8 -8,9.5 Q-12,8 -12,2Z'
const longLocks = 'M-12,-1 L-13,13 Q-11,15.6 -8.6,13 L-9,1Z M12,-1 L13,13 Q11,15.6 8.6,13 L9,1Z'
const longUp = 'M-12,0 A12,12 0 0 1 12,0 L12.6,14 Q6,17 0,16.4 Q-6,17 -12.6,14Z'
const longSide = 'M-12,2 A12,12 0 0 1 12,-1 Q9,-5.5 5,-5 Q4,-2 2,-3 Q-1,-1 -2,3 Q-2,10 -5,15 Q-10,16.5 -12.6,12Z'

const cropDown = 'M-11.5,0 A11.5,11.5 0 0 1 11.5,0 Q10.5,-3 7,-4.5 Q2,-2.5 -4,-6.5 Q-9,-5 -11.5,0Z'
const cropUp = 'M-11.5,0 A11.5,11.5 0 0 1 11.5,0 L10.4,5 Q0,10 -10.4,5Z'
const cropSide = 'M-11.5,1 A11.5,11.5 0 0 1 11.5,-1 Q10,-4 6,-4.5 Q3,-2.5 0,-4 Q-2,-1.5 -4,0 Q-6.5,-1 -8,1.5 L-9.6,5.5 Q-11.5,4 -11.5,1Z'
const bunDown = '<circle cx="0" cy="-12" r="4.6" fill="#ffffff" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>'
const bunSide = '<circle cx="-8.5" cy="-9" r="4.6" fill="#ffffff" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>'

const strandsFront = `<path d="M-6,-8.5 Q-2,-11 3,-9.8" ${STRAND}/>`
const strandsBack = `<path d="M-5,-7 Q0,-9 5,-7 M-7,0 Q0,2 7,0" ${STRAND}/>`

// Lô B's VIPs. Mây Chiều: a fluffy pink boa round the shoulders, and a small silver microphone pinned on the chest
const LOTUS = '#F28CA0'
const LOTUS_LIGHT = '#F9B9C5'
const CREAM = '#FBF7EE'
const SILVER = '#C9CED6'
const fluff = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${LOTUS}" ${LINE}/>`
const featherBoaDown: Part = {
  viewBox: body.viewBox,
  body:
    [-6.4, -3.2, 0, 3.2, 6.4].map((x, i) => fluff(x, 1.6 + (i % 2 ? 0.8 : 0) + (i === 2 ? 0.8 : 0), 2.6)).join('') +
    fluff(-7, 6, 2.4) + fluff(7, 6, 2.4) +
    `<path d="M-5,1.4 Q-3,0.4 -1.6,1.4 M1.6,1.8 Q3,0.8 5,1.6" stroke="${LOTUS_LIGHT}" stroke-width=".9" stroke-linecap="round" fill="none"/>`,
}
const featherBoaSide: Part = {
  viewBox: body.viewBox,
  body:
    [-5.6, -2.4, 0.8, 4].map((x, i) => fluff(x, 1.4 + (i % 2) * 0.9, 2.7)).join('') + fluff(4.6, 6.4, 2.5) +
    `<path d="M-4,1 Q-2,0 -0.4,1" stroke="${LOTUS_LIGHT}" stroke-width=".9" stroke-linecap="round" fill="none"/>`,
}
const featherBoaUp: Part = {
  viewBox: body.viewBox,
  body: [-6.6, -3.3, 0, 3.3, 6.6].map((x, i) => fluff(x, 1.4 + (i % 2) * 0.9, 2.8)).join('') + fluff(-7.4, 5.4, 2.4) + fluff(7.4, 5.4, 2.4),
}
const micPinDown: Part = {
  viewBox: body.viewBox,
  body:
    `<circle cx="4.2" cy="7" r="2.3" fill="${SILVER}" ${LINE}/><path d="M2.4,6.4 H6 M2.6,7.8 H5.8" ${FINE}/>` +
    `<rect x="3.5" y="9" width="1.5" height="3.6" rx=".7" fill="${SILVER}" ${LINE}/>`,
}
const micPinSide: Part = {
  viewBox: body.viewBox,
  body:
    `<circle cx="6.2" cy="7" r="2" fill="${SILVER}" ${LINE}/><path d="M4.8,6.6 H7.6" ${FINE}/>` +
    `<rect x="5.5" y="8.8" width="1.4" height="3.2" rx=".7" fill="${SILVER}" ${LINE}/>`,
}

// Ngân Sa: a small gold tiara with a red gem, and a cream sash with red edges across the chest
const gem = (cx: number, cy: number) => `<path d="M${cx},${cy - 1.9} L${cx + 1.5},${cy} L${cx},${cy + 1.9} L${cx - 1.5},${cy}Z" fill="${RED}" ${LINE}/>`
const tiara = (cx: number, w: number): Part => ({
  viewBox: [-17.5, -22.5, 35, 22],
  body:
    `<path d="M${cx - w},-10.6 L${cx - w + 1.2},-15 L${cx - w / 2},-12.8 L${cx},-17.6 L${cx + w / 2},-12.8 L${cx + w - 1.2},-15 L${cx + w},-10.6 Q${cx},-8.4 ${cx - w},-10.6Z" fill="${GOLD}" ${LINE}/>` +
    gem(cx, -13.2) +
    `<path d="M${cx - w + 2.4},-11.2 Q${cx - w / 2},-10.2 ${cx - 2.4},-10.4" ${SHINE}/>`,
})
const tiaraDown = tiara(0, 8)
const tiaraSide = tiara(-1, 6.4)
const tiaraUp = tiara(0, 8)
const sashDown: Part = {
  viewBox: body.viewBox,
  body:
    `<path d="M-6.6,2 L-3.4,0.8 L8.6,13.6 L7.8,17 Z" fill="${CREAM}" ${LINE}/>` +
    `<path d="M-6,2.6 L8.2,15.4 M-4.4,0.9 L8.9,13.9" stroke="${RED}" stroke-width="1" stroke-linecap="round" fill="none"/>`,
}
const sashSide: Part = {
  viewBox: body.viewBox,
  body:
    `<path d="M-6,3 L-2.4,1.6 L8.8,11.6 L8.8,15 Z" fill="${CREAM}" ${LINE}/>` +
    `<path d="M-5.4,3.4 L8.6,14.4 M-3.2,1.8 L8.7,12.4" stroke="${RED}" stroke-width="1" stroke-linecap="round" fill="none"/>`,
}

// Bích Câu: big round dark glasses with gold rims, and a mustard silk scarf over the hair
const bigShadesDown: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<circle cx="-4.6" cy="2.4" r="4.2" fill="${EYE}" ${LINE}/><circle cx="4.6" cy="2.4" r="4.2" fill="${EYE}" ${LINE}/>` +
    twoTone(`M-0.4,1.6 Q0,0.8 0.4,1.6 M-8.8,1.4 L-11.2,0.4 M8.8,1.4 L11.2,0.4 ${ring(-4.6, 2.4, 4.2)} ${ring(4.6, 2.4, 4.2)}`, GOLD, 0.9) +
    `<path d="M-7.2,0.8 Q-6,-0.2 -4.6,-0.2 M2,0.8 Q3.2,-0.2 4.6,-0.2" ${SHINE}/>`,
}
const bigShadesSide: Part = {
  viewBox: [-14.5, -14, 29, 28],
  body:
    `<ellipse cx="6.6" cy="2.4" rx="3.2" ry="4.2" fill="${EYE}" ${LINE}/>` +
    twoTone('M3.4,1.6 L-3.8,0.4 M3.4,2.4 a3.2,4.2 0 1 0 6.4,0 a3.2,4.2 0 1 0 -6.4,0', GOLD, 0.9) +
    `<path d="M5.2,0.4 Q6.2,-0.2 7.4,0.2" ${SHINE}/>`,
}
const MUSTARD_DARK = '#C98A1F'
const headscarf = (cx: number): Part => ({
  viewBox: [-17.5, -22.5, 35, 22],
  body:
    `<path d="M${cx - 11.8},-5 Q${cx - 13},-20 ${cx},-20 Q${cx + 13},-20 ${cx + 11.8},-5 Q${cx},-9.6 ${cx - 11.8},-5Z" fill="${GOLD}" ${LINE}/>` +
    `<path d="M${cx - 8},-15.4 Q${cx - 2},-11.6 ${cx + 9},-14.6 M${cx - 10.4},-9.4 Q${cx},-6.2 ${cx + 10.6},-9.4" stroke="${MUSTARD_DARK}" stroke-width=".9" stroke-linecap="round" fill="none"/>` +
    `<path d="M${cx + 9.6},-8 L${cx + 14.6},-3.6 L${cx + 11.4},-2.4 L${cx + 8.6},-5.2Z" fill="${GOLD}" ${LINE}/>`,
})
const headscarfDown = headscarf(0)
const headscarfSide = headscarf(-1)
const headscarfUp = headscarf(0)

// Tám Lửa: a tall white chef's hat, puffed at the top and pleated on the band
const chefHat = (cx: number): Part => ({
  viewBox: [-17.5, -32.5, 35, 32],
  body:
    `<path d="M${cx - 9},-5.6 Q${cx - 11.4},-15 ${cx - 7.4},-17.6 Q${cx - 8.6},-26 ${cx - 2},-26.4 Q${cx + 1},-30.4 ${cx + 4.6},-26.4 Q${cx + 11},-26 ${cx + 7.4},-17.6 Q${cx + 11.4},-15 ${cx + 9},-5.6 Q${cx},-3.6 ${cx - 9},-5.6Z" fill="${CREAM}" ${LINE}/>` +
    `<path d="M${cx - 5},-16.6 Q${cx - 5.6},-10 ${cx - 4.6},-4.8 M${cx},-16.8 V-4 M${cx + 5},-16.6 Q${cx + 5.6},-10 ${cx + 4.6},-4.8" ${FINE}/>` +
    `<path d="M${cx - 9},-12 Q${cx},-10 ${cx + 9},-12" ${FINE}/>`,
})
const chefHatDown = chefHat(0)
const chefHatSide = chefHat(-1)
const chefHatUp = chefHat(0)

const parts: Record<string, Part> = {
  leg,
  arm,
  body,
  head,
  'face-down': faceDown,
  'face-side': faceSide,
  'face-rest': faceRest,
  blanket,
  'apron-down': apronDown,
  'apron-side': apronSide,
  'backpack-down': backpackDown,
  'backpack-side': backpackSide,
  'backpack-up': backpackUp,
  'tie-down': tieDown,
  'glasses-down': glassesDown,
  'glasses-side': glassesSide,
  'face-frown': faceFrown,
  'sunglasses-down': sunglassesDown,
  'sunglasses-side': sunglassesSide,
  'hat-down': hatDown,
  'hat-side': hatSide,
  'hat-up': hatUp,
  'redApron-down': redApronDown,
  'redApron-side': redApronSide,
  'artTube-down': artTubeDown,
  'artTube-side': artTubeSide,
  'artTube-up': artTubeUp,
  'helmet-down': helmetDown,
  'helmet-side': helmetSide,
  'helmet-up': helmetUp,
  'headphones-down': headphonesDown,
  'headphones-side': headphonesSide,
  'headphones-up': headphonesUp,
  'goldGlasses-down': goldGlassesDown,
  'goldGlasses-side': goldGlassesSide,
  'silkScarf-down': silkScarfDown,
  'silkScarf-side': silkScarfSide,
  'silkScarf-up': silkScarfUp,
  'readingGlasses-down': readingGlassesDown,
  'readingGlasses-side': readingGlassesSide,
  'paperFan-down': paperFanDown,
  'paperFan-side': paperFanSide,
  'flowerClip-down': flowerClipDown,
  'flowerClip-side': flowerClipSide,
  'flowerClip-up': flowerClipUp,
  'daisies-down': daisiesDown,
  'daisies-side': daisiesSide,
  'featherBoa-down': featherBoaDown,
  'featherBoa-side': featherBoaSide,
  'featherBoa-up': featherBoaUp,
  'micPin-down': micPinDown,
  'micPin-side': micPinSide,
  'tiara-down': tiaraDown,
  'tiara-side': tiaraSide,
  'tiara-up': tiaraUp,
  'sash-down': sashDown,
  'sash-side': sashSide,
  'bigShades-down': bigShadesDown,
  'bigShades-side': bigShadesSide,
  'headscarf-down': headscarfDown,
  'headscarf-side': headscarfSide,
  'headscarf-up': headscarfUp,
  'chefHat-down': chefHatDown,
  'chefHat-side': chefHatSide,
  'chefHat-up': chefHatUp,
  'mask-face': maskFace,
  'towel-wrap': towelWrap,
  'hair0-down': hair(path(bobDown) + path(bobSideLocks), strandsFront),
  'hair0-up': hair(path(bobUp), strandsBack),
  'hair0-side': hair(path(bobSide), strandsFront),
  'hair1-down': hair(path(longLocks) + path(bobDown), strandsFront),
  'hair1-up': hair(path(longUp), strandsBack),
  'hair1-side': hair(path(longSide), strandsFront),
  'hair2-down': hair(path(cropDown), strandsFront),
  'hair2-up': hair(path(cropUp), strandsBack),
  'hair2-side': hair(path(cropSide), strandsFront),
  'hair3-down': hair(bunDown + path(bobDown) + path(bobSideLocks), strandsFront, -18),
  'hair3-up': hair(bunDown + path(bobUp), strandsBack, -18),
  'hair3-side': hair(bunSide + path(bobSide), strandsFront, -18),
}

/** Parts that are tinted; their brown lines go in a separate `<key>-line` texture, drawn untinted on top. Whole names, so `headphones` stays untinted. */
const TINTED = /^(leg|arm|body|head|hair\d)(-|$)/

const textures: Record<string, Part> = Object.fromEntries(
  Object.entries(parts).flatMap(([key, p]) =>
    TINTED.test(key)
      ? [
          [key, { viewBox: p.viewBox, body: fillsOnly(p.body) }],
          [`${key}-line`, { viewBox: p.viewBox, body: linesOnly(p.body) }],
        ]
      : [[key, p]],
  ),
)

/** Phaser origin for each texture, derived from its viewBox so (0,0) in chibi units is the pivot. */
export const PART_ANCHORS: Record<string, { ox: number; oy: number }> = Object.fromEntries(
  Object.entries(textures).map(([key, p]) => {
    const [x, y, w, h] = p.viewBox
    return [key, { ox: -x / w, oy: -y / h }]
  }),
)

export function chibiTextures(): Record<string, string> {
  return Object.fromEntries(Object.entries(textures).map(([key, p]) => [key, svgDoc(p.viewBox, CHIBI_PX, p.body)]))
}
