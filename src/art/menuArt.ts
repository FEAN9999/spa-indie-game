import { C } from './palette'
import { svgDoc } from './svg'

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const wave = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`

// phở: a cream bowl with a blue band, broth and noodles on top, a leaf and steam
const PHO =
  `<path d="M10,44 H80 Q76,78 45,80 Q14,78 10,44Z" fill="${C.cream}" ${ink(4)}/>` +
  wave('M18,58 Q45,70 72,58', C.cobalt, 4) +
  `<ellipse cx="45" cy="44" rx="35" ry="9" fill="${C.wall}" ${ink(4)}/>` +
  wave('M28,43 q6,-4 12,0 t12,0 t12,0', C.tile, 3) +
  `<path d="M52,40 Q54,30 68,30 Q68,42 52,40Z" fill="${C.leaf}" ${ink(2.5)}/>` +
  wave('M32,32 q-5,-6 0,-12 t0,-10 M48,30 q-5,-6 0,-12 t0,-8', C.cloud, 3)

// bánh xèo: a yellow crêpe folded over its filling, with a crisp brown edge and a few sprouts peeking out
const BANH_XEO =
  `<path d="M10,60 Q10,16 45,16 Q80,16 80,60Z" fill="${C.mustard}" ${ink(4)}/>` +
  `<path d="M16,56 Q18,26 45,24 Q72,26 74,56Z" fill="${C.gold}"/>` +
  wave('M12,60 H78', C.mustardDark, 5) +
  [[30, 40], [48, 34], [60, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${C.mustardDark}"/>`).join('') +
  wave('M24,18 q-6,-8 -2,-12 M34,14 q-4,-8 2,-10', C.leaf, 3.5)

// chè: a tall glass of red bean, mung bean and jelly in three bands, and a straw
const CHE =
  `<path d="M24,16 H66 L62,80 H28Z" fill="${C.glass}" ${ink(4)}/>` +
  `<path d="M27.5,62 H62.5 L61.5,77 H28.5Z" fill="${C.lanternDark}"/>` +
  `<path d="M26.5,46 H63.5 V62 H27.5Z" fill="${C.olive}"/>` +
  `<path d="M25.5,29 H64.5 V46 H26.5Z" fill="${C.lotus}"/>` +
  `<path d="M24,16 H66 L62,80 H28Z" fill="none" ${ink(4)}/>` +
  wave('M54,22 L64,4', C.lantern, 5)

// stock: a bundle of rice noodles tied with a band
const PHO_KIT =
  wave('M14,14 Q10,30 14,46 M24,10 Q20,30 24,50 M34,8 Q30,30 34,52 M44,10 Q40,30 44,50 M52,14 Q50,30 52,46', C.sand, 8) +
  wave('M14,14 Q10,30 14,46 M24,10 Q20,30 24,50 M34,8 Q30,30 34,52 M44,10 Q40,30 44,50 M52,14 Q50,30 52,46', C.ink, 1.5) +
  `<rect x="8" y="26" width="50" height="12" rx="4" fill="${C.terracotta}" ${ink(3)}/>`

// stock: a bag of flour, its top folded and tied
const BATTER =
  `<path d="M14,18 H46 L52,52 Q30,58 8,52Z" fill="${C.cream}" ${ink(3.5)}/>` +
  `<path d="M14,18 Q10,8 20,8 H40 Q50,8 46,18Z" fill="${C.sand}" ${ink(3.5)}/>` +
  `<rect x="18" y="26" width="24" height="16" rx="5" fill="${C.mustard}" ${ink(2.5)}/>` +
  wave('M23,34 H37', C.ink, 2.5)

// stock: a clay pot of beans with its lid, red and green beans on top
const CHE_KIT =
  `<path d="M8,26 H52 Q50,52 30,54 Q10,52 8,26Z" fill="${C.clayLight}" ${ink(3.5)}/>` +
  `<ellipse cx="30" cy="26" rx="22" ry="6" fill="${C.clay}" ${ink(3.5)}/>` +
  [[20, 24, C.lantern], [28, 22, C.olive], [36, 25, C.lantern], [43, 23, C.olive]].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="${c}"/>`).join('') +
  wave('M22,38 q8,6 16,0', C.clay, 3)

// stock: a basil sprig with three leaves on its stem
const HERBS =
  wave('M30,54 V16', C.leaf, 4) +
  `<path d="M30,16 Q22,4 12,10 Q16,22 30,16Z" fill="${C.leaf}" ${ink(3)}/>` +
  `<path d="M30,16 Q38,4 48,10 Q44,22 30,16Z" fill="${C.leafLight}" ${ink(3)}/>` +
  `<path d="M30,34 Q20,26 8,32 Q14,44 30,34Z" fill="${C.leafLight}" ${ink(3)}/>` +
  `<path d="M30,34 Q40,26 52,32 Q46,44 30,34Z" fill="${C.leaf}" ${ink(3)}/>`

/** The menu's pictures: a dish each at 90×90, and the four restaurant stock items at 60×60. */
export function menuTextures(): Record<string, string> {
  return {
    'dish-pho': svgDoc([0, 0, 90, 90], 1, PHO),
    'dish-banhXeo': svgDoc([0, 0, 90, 90], 1, BANH_XEO),
    'dish-che': svgDoc([0, 0, 90, 90], 1, CHE),
    'rstock-phoKit': svgDoc([0, 0, 60, 60], 1, PHO_KIT),
    'rstock-batter': svgDoc([0, 0, 60, 60], 1, BATTER),
    'rstock-cheKit': svgDoc([0, 0, 60, 60], 1, CHE_KIT),
    'rstock-herbs': svgDoc([0, 0, 60, 60], 1, HERBS),
  }
}
