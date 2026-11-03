import { C } from './palette'
import { liftPiece } from './lift'
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

// bún chả: a bowl of dipping sauce with two grilled patties and a slice of papaya, beside a nest of rice noodles
const BUN_CHA =
  `<ellipse cx="28" cy="66" rx="22" ry="14" fill="${C.paper}" ${ink(3.5)}/>` +
  wave('M12,64 q8,-6 16,0 t16,0', C.tileSeam, 3) +
  `<path d="M34,40 H86 Q82,80 60,82 Q38,80 34,40Z" fill="${C.cream}" ${ink(4)}/>` +
  `<ellipse cx="60" cy="42" rx="26" ry="8" fill="${C.mustardDark}" ${ink(3.5)}/>` +
  `<ellipse cx="52" cy="40" rx="9" ry="6" fill="${C.woodDark}" ${ink(2.5)}/>` +
  `<ellipse cx="68" cy="41" rx="9" ry="6" fill="${C.wood}" ${ink(2.5)}/>` +
  wave('M42,40 q4,-4 8,0', C.bambooLight, 4) +
  wave('M48,26 q-4,-6 0,-12 M64,24 q-4,-6 0,-12', C.cloud, 3)

// gỏi cuốn: two see-through rolls with shrimp pink and greens showing, beside a small bowl of dipping sauce
const goiRoll = (y: number) =>
  `<rect x="10" y="${y}" width="56" height="22" rx="11" fill="${C.cream}" ${ink(3.5)}/>` +
  `<ellipse cx="26" cy="${y + 11}" rx="7" ry="5" fill="${C.lotus}"/>` +
  `<ellipse cx="42" cy="${y + 12}" rx="7" ry="5" fill="${C.lotus}"/>` +
  wave(`M18,${y + 16} H58`, C.leafLight, 4) +
  `<rect x="10" y="${y}" width="56" height="22" rx="11" fill="none" ${ink(3.5)}/>`
const GOI_CUON =
  goiRoll(30) +
  goiRoll(54) +
  `<path d="M60,66 H86 Q84,84 73,84 Q62,84 60,66Z" fill="${C.clay}" ${ink(3.5)}/>` +
  `<ellipse cx="73" cy="66" rx="13" ry="4" fill="${C.woodDark}" ${ink(2.5)}/>`

// cơm tấm: a plate of broken rice with a grilled chop and a fried egg
const COM_TAM =
  `<ellipse cx="45" cy="56" rx="40" ry="26" fill="${C.cream}" ${ink(4)}/>` +
  `<ellipse cx="38" cy="54" rx="24" ry="15" fill="${C.paper}" ${ink(3)}/>` +
  `<path d="M44,46 Q46,34 66,34 Q82,36 80,48 Q74,58 56,56 Q44,54 44,46Z" fill="${C.woodLight}" ${ink(3)}/>` +
  wave('M54,38 L58,52 M64,36 L68,52', C.woodDark, 3) +
  `<path d="M14,58 Q14,48 24,48 Q32,46 34,54 Q34,62 24,64 Q14,64 14,58Z" fill="${C.cloud}" ${ink(3)}/>` +
  `<circle cx="24" cy="56" r="5" fill="${C.mustard}"/>`

// cà phê sữa đá: a tall glass of coffee over a layer of condensed milk, ice on top and a straw
const CA_PHE =
  `<path d="M24,14 H66 L61,82 H29Z" fill="${C.glass}" ${ink(4)}/>` +
  `<path d="M28.5,66 H61.5 L61,81 H29Z" fill="${C.paper}"/>` +
  `<path d="M26,34 H64 L61.5,66 H28.5Z" fill="${C.woodDark}"/>` +
  `<rect x="31" y="24" width="13" height="13" rx="3" fill="${C.cloud}" ${ink(2)}/>` +
  `<rect x="46" y="22" width="13" height="13" rx="3" fill="${C.cloud}" ${ink(2)}/>` +
  `<path d="M24,14 H66 L61,82 H29Z" fill="none" ${ink(4)}/>` +
  wave('M56,20 L66,2', C.lantern, 5)

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

// stock: two patties of minced pork on a sheet of paper
const CHA_KIT =
  `<path d="M6,40 L30,52 L56,40 L32,28Z" fill="${C.paper}" ${ink(3)}/>` +
  `<ellipse cx="22" cy="30" rx="13" ry="9" fill="${C.houseRose}" ${ink(3)}/>` +
  `<ellipse cx="38" cy="24" rx="13" ry="9" fill="${C.houseRoseDark}" ${ink(3)}/>` +
  wave('M16,30 q6,-3 12,0 M32,24 q6,-3 12,0', C.cream, 2.5)

// stock: a stack of round rice papers with a shrimp on top
const CUON_KIT =
  [44, 38, 32].map(y => `<ellipse cx="30" cy="${y}" rx="24" ry="9" fill="${C.cream}" ${ink(3)}/>`).join('') +
  `<path d="M38,22 A9,9 0 1 0 39,34" stroke="${C.ink}" stroke-width="9" fill="none" stroke-linecap="round"/>` +
  `<path d="M38,22 A9,9 0 1 0 39,34" stroke="${C.lotus}" stroke-width="5" fill="none" stroke-linecap="round"/>`

// stock: a sack of broken rice beside a raw chop
const TAM_KIT =
  `<path d="M8,20 H34 L38,52 H4Z" fill="${C.sand}" ${ink(3)}/>` +
  `<path d="M8,20 Q20,12 34,20" stroke="${C.ink}" stroke-width="3" fill="none"/>` +
  wave('M12,36 H30', C.clayLight, 3) +
  `<path d="M32,44 Q30,30 44,28 Q58,28 58,40 Q56,52 44,52 Q34,52 32,44Z" fill="${C.houseRose}" ${ink(3)}/>`

// stock: a bag of ground coffee beside a small can of condensed milk
const CAFE_KIT =
  `<path d="M6,16 H32 L34,52 H4Z" fill="${C.woodLight}" ${ink(3)}/>` +
  `<path d="M6,16 L10,10 H28 L32,16" fill="${C.wood}" ${ink(3)}/>` +
  `<ellipse cx="19" cy="34" rx="6" ry="8" fill="${C.woodDark}"/>` +
  `<rect x="34" y="28" width="22" height="26" rx="4" fill="${C.cream}" ${ink(3)}/>` +
  `<rect x="34" y="36" width="22" height="9" fill="${C.teal}"/>`

// stock: a basil sprig with three leaves on its stem
const HERBS =
  wave('M30,54 V16', C.leaf, 4) +
  `<path d="M30,16 Q22,4 12,10 Q16,22 30,16Z" fill="${C.leaf}" ${ink(3)}/>` +
  `<path d="M30,16 Q38,4 48,10 Q44,22 30,16Z" fill="${C.leafLight}" ${ink(3)}/>` +
  `<path d="M30,34 Q20,26 8,32 Q14,44 30,34Z" fill="${C.leafLight}" ${ink(3)}/>` +
  `<path d="M30,34 Q40,26 52,32 Q46,44 30,34Z" fill="${C.leaf}" ${ink(3)}/>`

/** The menu's pictures: a dish each at 90×90, and each restaurant stock item at 60×60. */
export function menuTextures(): Record<string, string> {
  return {
    'dish-pho': svgDoc([0, 0, 90, 90], 1, liftPiece(PHO, 1)),
    'dish-banhXeo': svgDoc([0, 0, 90, 90], 1, liftPiece(BANH_XEO, 1)),
    'dish-che': svgDoc([0, 0, 90, 90], 1, liftPiece(CHE, 1)),
    'dish-bunCha': svgDoc([0, 0, 90, 90], 1, liftPiece(BUN_CHA, 1)),
    'dish-goiCuon': svgDoc([0, 0, 90, 90], 1, liftPiece(GOI_CUON, 1)),
    'dish-comTam': svgDoc([0, 0, 90, 90], 1, liftPiece(COM_TAM, 1)),
    'dish-caPhe': svgDoc([0, 0, 90, 90], 1, liftPiece(CA_PHE, 1)),
    'rstock-phoKit': svgDoc([0, 0, 60, 60], 1, liftPiece(PHO_KIT, 1)),
    'rstock-batter': svgDoc([0, 0, 60, 60], 1, liftPiece(BATTER, 1)),
    'rstock-cheKit': svgDoc([0, 0, 60, 60], 1, liftPiece(CHE_KIT, 1)),
    'rstock-chaKit': svgDoc([0, 0, 60, 60], 1, liftPiece(CHA_KIT, 1)),
    'rstock-cuonKit': svgDoc([0, 0, 60, 60], 1, liftPiece(CUON_KIT, 1)),
    'rstock-tamKit': svgDoc([0, 0, 60, 60], 1, liftPiece(TAM_KIT, 1)),
    'rstock-cafeKit': svgDoc([0, 0, 60, 60], 1, liftPiece(CAFE_KIT, 1)),
    'rstock-herbs': svgDoc([0, 0, 60, 60], 1, liftPiece(HERBS, 1)),
  }
}
