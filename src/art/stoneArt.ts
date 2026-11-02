import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// Nét A+: viền ngoài, nét trong
const OUT = 7
const IN = 4.5

const STONE_BOX: Box = [-84, -66, 168, 132]
const SPOT_BOX: Box = [-62, -62, 124, 124]
const POT_BOX: Box = [-384, -144, 768, 334]

/** Where each stone sits in the pot, in pixels from the pot's centre: a row across the water, in front of the steam. */
export const SN_POT_STONES: readonly { x: number; y: number }[] = [-270, -90, 90, 270].map(x => ({ x, y: -8 }))

// a flat pebble with a hard shade underneath (grey, so the heat tint darkens it); tinted grey, orange or red by its heat
const stone =
  `<path d="M-76,6 C-78,-32 -38,-58 6,-58 C50,-58 80,-34 78,0 C76,36 42,58 -4,58 C-48,58 -74,40 -76,6Z" fill="#ffffff" ${ink(OUT)}/>` +
  `<path d="M78,0 C76,36 42,58 -4,58 C-30,58 -50,52 -62,40 C-30,50 40,46 78,0Z" fill="${TINT_SHADE}"/>`
// a cream shine and a white highlight that stay light whatever the tint
const shine =
  `<path d="M-52,-20 Q-42,-40 -16,-45" stroke="${C.cream}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".75"/>` +
  `<ellipse cx="34" cy="-36" rx="9" ry="5" ${HIGHLIGHT}/>`

const curl = (x: number) => `<path d="M${x},-64 q16,-18 0,-36 q-16,-18 0,-36" stroke="${C.steamBlue}" stroke-width="9" fill="none" stroke-linecap="round"/>`

// nồi gỗ sẫm nhìn chéo: bóng sàn, thân có đai và mảng bóng phải, miệng gỗ sáng, mặt nước có gợn
const POT = 'M-371.8,0 H371.8 C371.8,110 228.8,180 0,180 C-228.8,180 -371.8,110 -371.8,0 Z'

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
    // a dark wooden pot with a band round its belly and a lighter lip, brimming with rippled water, three curls of steam above
    'sn-pot': svgDoc(
      POT_BOX,
      1,
      `<clipPath id="pot"><path d="${POT}"/></clipPath>` +
        [-180, 0, 180].map(curl).join('') +
        `<ellipse cx="8" cy="176" rx="360" ry="14" ${GROUND}/>` +
        `<path d="${POT}" fill="${C.woodDark}"/>` +
        `<path d="M371.8,0 C371.8,110 228.8,180 0,180 C171.6,155 314.6,90 331.8,0 Z" fill="${shade(C.woodDark)}" clip-path="url(#pot)"/>` +
        `<ellipse cx="-297" cy="75" rx="17" ry="30" fill="#FFFFFF" opacity=".35" clip-path="url(#pot)"/>` +
        `<path d="M-320.3,85 Q0,140 320.3,85" stroke="${C.wood}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
        `<path d="${POT}" fill="none" ${ink(OUT)}/>` +
        `<ellipse cx="0" cy="0" rx="372" ry="55" fill="${C.wood}" ${ink(OUT)}/>` +
        `<path d="M-330,-20 Q-200,-48 -60,-52" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round" opacity=".45"/>` +
        `<ellipse cx="0" cy="0" rx="332" ry="35" fill="${C.waterDeep}" ${ink(IN)}/>` +
        `<path d="M-286,0 Q-223.1,-15 -171.6,-12.5 M148.7,15 Q205.9,17.5 263.1,5" stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    ),
  }
}
