import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

const OUTLINE = `stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"`

const STONE_BOX: Box = [-84, -66, 168, 132]
const SPOT_BOX: Box = [-62, -62, 124, 124]
const POT_BOX: Box = [-384, -144, 768, 334]

/** Where each stone sits in the pot, in pixels from the pot's centre: a row across the water, in front of the steam. */
export const SN_POT_STONES: readonly { x: number; y: number }[] = [-270, -90, 90, 270].map(x => ({ x, y: -8 }))

// a flat pebble, shaded underneath; tinted grey, orange or red by its heat
const stone =
  `<path d="M-76,6 C-78,-32 -38,-58 6,-58 C50,-58 80,-34 78,0 C76,36 42,58 -4,58 C-48,58 -74,40 -76,6Z" fill="#ffffff" ${OUTLINE}/>` +
  `<path d="M-40,48 C-10,54 40,50 62,24 C70,12 72,0 71,-10 C62,22 30,38 -40,48Z" fill="#d6d6d6"/>`
// a cream shine that stays light whatever the tint
const shine = `<path d="M-52,-20 Q-42,-40 -16,-45" stroke="${C.cream}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".75"/>`

const curl = (x: number) => `<path d="M${x},-64 q16,-18 0,-36 q-16,-18 0,-36" stroke="${C.steamBlue}" stroke-width="9" fill="none" stroke-linecap="round"/>`

/** The Đá nóng pictures: a stone to tint, an empty spot on the back, and the pot of hot water the stones sit across. */
export function stoneTextures(): Record<string, string> {
  return {
    'sn-stone': svgDoc(STONE_BOX, 1, fillsOnly(stone)),
    'sn-stone-line': svgDoc(STONE_BOX, 1, linesOnly(stone) + shine),
    // a dashed ring on a pale ground, where the next stone goes
    'sn-spot': svgDoc(
      SPOT_BOX,
      1,
      `<circle cx="0" cy="0" r="56" fill="${C.paper}" fill-opacity=".55" stroke="${C.ink}" stroke-width="5" stroke-dasharray="13 9"/>`,
    ),
    // a dark wooden pot with a lighter lip, brimming with water, three curls of steam above
    'sn-pot': svgDoc(
      POT_BOX,
      1,
      [-180, 0, 180].map(curl).join('') +
        `<path d="M-372,0 H372 C372,120 260,184 0,184 C-260,184 -372,120 -372,0Z" fill="${C.woodDark}" ${OUTLINE}/>` +
        `<path d="M-306,92 Q0,128 306,92" stroke="${C.wood}" stroke-width="9" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="0" cy="0" rx="372" ry="52" fill="${C.wood}" ${OUTLINE}/>` +
        `<ellipse cx="0" cy="0" rx="340" ry="38" fill="${C.waterDeep}" ${INNER}/>` +
        `<path d="M-250,-14 Q-190,-26 -120,-27" stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    ),
  }
}
