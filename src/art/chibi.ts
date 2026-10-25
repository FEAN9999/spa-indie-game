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

const STRAND = `stroke="${SHADE}" stroke-width="1.1" fill="none" stroke-linecap="round"`
const hair = (shape: string, strands: string): Part => ({ viewBox: [-14.5, -14, 29, 32], body: `${shape}${strands}` })
const path = (d: string) => `<path d="${d}" fill="${W}" ${LINE}/>`

// Style 0: short bob. Style 1: long hair.
const bobDown = 'M-12,0 A12,12 0 0 1 12,0 Q11,-5 6,-5.5 Q3,-2.5 0,-4.5 Q-3,-2.5 -6,-5.5 Q-11,-5 -12,0Z'
const bobSideLocks = 'M-12,-1 Q-12.6,5 -10,6.5 L-9.4,-1Z M12,-1 Q12.6,5 10,6.5 L9.4,-1Z'
const bobUp = 'M-12,0 A12,12 0 0 1 12,0 L12,3 Q11,9 5,10 Q0,11 -5,10 Q-11,9 -12,3Z'
const bobSide = 'M-12,2 A12,12 0 0 1 12,-1 Q9,-5.5 5,-5 Q4,-2 2,-3 Q-1,-1 -2,3 Q-3,8 -8,9.5 Q-12,8 -12,2Z'
const longLocks = 'M-12,-1 L-13,13 Q-11,15.6 -8.6,13 L-9,1Z M12,-1 L13,13 Q11,15.6 8.6,13 L9,1Z'
const longUp = 'M-12,0 A12,12 0 0 1 12,0 L12.6,14 Q6,17 0,16.4 Q-6,17 -12.6,14Z'
const longSide = 'M-12,2 A12,12 0 0 1 12,-1 Q9,-5.5 5,-5 Q4,-2 2,-3 Q-1,-1 -2,3 Q-2,10 -5,15 Q-10,16.5 -12.6,12Z'

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
  'hair0-down': hair(path(bobDown) + path(bobSideLocks), strandsFront),
  'hair0-up': hair(path(bobUp), strandsBack),
  'hair0-side': hair(path(bobSide), strandsFront),
  'hair1-down': hair(path(longLocks) + path(bobDown), strandsFront),
  'hair1-up': hair(path(longUp), strandsBack),
  'hair1-side': hair(path(longSide), strandsFront),
}

/** Phaser origin for each part, derived from its viewBox so (0,0) in chibi units is the pivot. */
export const PART_ANCHORS: Record<string, { ox: number; oy: number }> = Object.fromEntries(
  Object.entries(parts).map(([key, p]) => {
    const [x, y, w, h] = p.viewBox
    return [key, { ox: -x / w, oy: -y / h }]
  }),
)

export function chibiTextures(): Record<string, string> {
  return Object.fromEntries(Object.entries(parts).map(([key, p]) => [key, svgDoc(p.viewBox, CHIBI_PX, p.body)]))
}
