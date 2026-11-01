import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/**
 * The plate is drawn in the card's own pixels, placed at its box's top left corner; the chop, the sides and the fan are pictures placed by their centres.
 * The chop on the grill, the heat needle and the oil spots are drawn in the game; the stove and the dial are Bún chả's and Phở's.
 */
export const CT_BOX = { plate: [150, 860, 760, 520] as Box }
/** The rice on the plate, where the chop and the sides are laid. */
export const CT_RICE = { x: 520, y: 1110, rx: 250, ry: 150 }

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const wave = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`

// a wide enamel plate with a blue rim, heaped with broken rice
const PLATE =
  `<ellipse cx="520" cy="1120" rx="370" ry="250" fill="${C.cream}" ${ink(6)}/>` +
  `<ellipse cx="520" cy="1120" rx="330" ry="214" fill="none" stroke="${C.cobalt}" stroke-width="8"/>` +
  `<ellipse cx="${CT_RICE.x}" cy="${CT_RICE.y}" rx="${CT_RICE.rx}" ry="${CT_RICE.ry}" fill="${C.paper}" ${ink(4)}/>` +
  [[400, 1060], [470, 1110], [560, 1050], [620, 1140], [450, 1180], [580, 1200], [680, 1090], [380, 1130]]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="${C.tileSeam}"/>`)
    .join('')

// sườn: a glazed grilled pork chop with its bone and grill marks
const SUON =
  `<path d="M14,40 Q10,14 46,10 Q96,6 120,24 Q138,40 120,58 Q92,76 44,70 Q16,66 14,40Z" fill="${C.woodLight}" ${ink(4)}/>` +
  wave('M36,28 L52,56 M60,22 L76,58 M84,22 L100,54', C.woodDark, 6) +
  `<rect x="112" y="30" width="34" height="14" rx="7" fill="${C.cream}" ${ink(3.5)}/>`

// bì: a little heap of pale shredded pork skin
const BI =
  `<ellipse cx="30" cy="38" rx="24" ry="14" fill="${C.sand}" ${ink(3.5)}/>` +
  wave('M12,36 q6,-8 12,0 t12,0 t12,0 M16,44 q6,-8 12,0 t12,0', C.clayLight, 3)

// chả: a slice of steamed egg meatloaf, its yolk top over the pale loaf
const CHA =
  `<rect x="8" y="22" width="44" height="26" rx="5" fill="${C.houseRose}" ${ink(3.5)}/>` +
  `<rect x="8" y="16" width="44" height="12" rx="5" fill="${C.gold}" ${ink(3.5)}/>` +
  [[18, 38], [30, 34], [42, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="${C.houseRoseDark}"/>`).join('')

// trứng: a fried egg, its white rippled and its yolk bright
const TRUNG =
  `<path d="M8,32 Q6,14 26,12 Q46,8 52,24 Q58,42 40,48 Q18,54 8,32Z" fill="${C.cloud}" ${ink(3.5)}/>` +
  `<circle cx="30" cy="30" r="10" fill="${C.mustard}" ${ink(3)}/>`

// đồ chua: carrot and daikon matchsticks in a little heap
const CHUA =
  [[12, 44, 30, 20, C.stoneHot], [20, 46, 40, 22, C.cream], [28, 46, 48, 24, C.stoneHot], [16, 40, 46, 34, C.cream]]
    .map(([x1, y1, x2, y2, c]) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>` + `<path d="M${x1},${y1} L${x2},${y2}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`)
    .join('')

// quạt nan: a round woven bamboo fan on its handle
const FAN =
  `<rect x="64" y="96" width="14" height="40" rx="6" fill="${C.woodDark}" ${ink(3.5)}/>` +
  `<circle cx="70" cy="62" r="54" fill="${C.bamboo}" ${ink(5)}/>` +
  [-36, -18, 0, 18, 36].map(d => `<path d="M${70 + d},14 V110" stroke="${C.bambooDark}" stroke-width="3"/>`).join('') +
  [-36, -18, 0, 18, 36].map(d => `<path d="M22,${62 + d} H118" stroke="${C.bambooLight}" stroke-width="3"/>`).join('') +
  `<circle cx="70" cy="62" r="54" fill="none" ${ink(5)}/>`

/** The Cơm tấm pictures: the plate, the cooked chop, the four sides and the fan. */
export function comTamTextures(): Record<string, string> {
  return {
    'ct-plate': svgDoc(CT_BOX.plate, 1, PLATE),
    'ct-suon': svgDoc([0, 0, 150, 80], 1, SUON),
    'ct-bi': svgDoc([0, 0, 60, 60], 1, BI),
    'ct-cha': svgDoc([0, 0, 60, 60], 1, CHA),
    'ct-trung': svgDoc([0, 0, 60, 60], 1, TRUNG),
    'ct-chua': svgDoc([0, 0, 60, 60], 1, CHUA),
    'ct-fan': svgDoc([0, 0, 140, 140], 1, FAN),
  }
}
