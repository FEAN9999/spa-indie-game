import { fillsOnly, linesOnly } from './outline'
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
  'mask-face': maskFace,
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

/** Parts that are tinted; their brown lines go in a separate `<key>-line` texture, drawn untinted on top. */
const TINTED = /^(leg|arm|body|head|hair\d)/

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
