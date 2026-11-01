import { C } from './palette'
import { svgDoc } from './svg'

// The glass is drawn in the game, filled to its layers; these are pictures placed by their centres: the phin set on the glass,
// the can of condensed milk, the ice bucket and one cube.

/** The glass's inside: its middle x, its bottom and brim, and how far its wall stands from the middle at each. */
export const CF_GLASS = { x: 420, bottom: 1420, top: 960, bottomHalf: 115, topHalf: 150 }

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const wave = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`

// phin: an aluminium drip filter with its lid, sitting on its wide plate
const PHIN =
  `<rect x="20" y="112" width="200" height="22" rx="10" fill="${C.silver}" ${ink(5)}/>` +
  `<path d="M60,112 L68,40 H172 L180,112Z" fill="${C.silver}" ${ink(5)}/>` +
  wave('M78,60 V100 M100,56 V104', C.cloud, 6) +
  `<rect x="54" y="26" width="132" height="20" rx="9" fill="${C.tankRib}" ${ink(5)}/>` +
  `<rect x="108" y="6" width="24" height="22" rx="8" fill="${C.tankRib}" ${ink(4)}/>`

// a can of condensed milk: a cream body with a teal band and a lid, a drop at its lip
const CAN =
  `<rect x="18" y="20" width="84" height="120" rx="10" fill="${C.cream}" ${ink(5)}/>` +
  `<rect x="18" y="58" width="84" height="44" fill="${C.teal}" ${ink(4)}/>` +
  `<circle cx="60" cy="80" r="14" fill="${C.cream}" ${ink(3)}/>` +
  `<rect x="14" y="12" width="92" height="16" rx="6" fill="${C.silver}" ${ink(4)}/>` +
  `<path d="M24,12 Q26,2 34,4 Q38,12 30,14Z" fill="${C.paper}" ${ink(3)}/>`

// an ice bucket: a steel pail full of cubes, with its handle
const BUCKET =
  `<path d="M30,60 Q100,-10 170,60" stroke="${C.ink}" stroke-width="8" fill="none"/>` +
  `<path d="M20,60 H180 L160,160 H40Z" fill="${C.tin}" ${ink(5)}/>` +
  wave('M30,90 H170 M38,130 H162', C.tinRib, 6) +
  [[50, 48], [86, 40], [122, 44], [154, 50], [70, 30], [108, 26], [138, 32]]
    .map(([x, y]) => `<rect x="${x - 15}" y="${y - 15}" width="30" height="30" rx="7" fill="${C.glass}" ${ink(3)}/>`)
    .join('')

// one ice cube with a shine
const ICE =
  `<rect x="6" y="6" width="44" height="44" rx="10" fill="${C.glass}" ${ink(4)}/>` +
  wave('M15,22 Q16,14 24,13', C.cloud, 5)

/** The Cà phê sữa đá pictures: the phin, the can, the bucket and an ice cube. */
export function caPheTextures(): Record<string, string> {
  return {
    'cf-phin': svgDoc([0, 0, 240, 140], 1, PHIN),
    'cf-can': svgDoc([0, 0, 120, 150], 1, CAN),
    'cf-bucket': svgDoc([0, 0, 200, 170], 1, BUCKET),
    'cf-ice': svgDoc([0, 0, 56, 56], 1, ICE),
  }
}
