import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// Every texture is drawn in the card's own pixels, so each is placed at its box's top left corner.
export const FOOT_BOX = {
  back: [190, 1340, 700, 180] as Box,
  sole: [380, 540, 350, 870] as Box,
  front: [190, 1370, 700, 202] as Box,
}

const O = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`

/** The sole toes up and the heel on the water: white with grey pads, tinted with the skin colour. */
const SOLE =
  `<path d="M545,1400 C470,1402 430,1350 425,1270 C420,1190 455,1130 452,1060 C449,990 398,930 395,850 C392,760 400,690 445,665 C520,640 640,640 690,668 C720,690 712,760 705,830 C698,920 668,1000 655,1100 C645,1180 660,1250 650,1310 C640,1370 600,1400 545,1400Z" fill="#FFFFFF" ${O(5)}/>` +
  `<ellipse cx="548" cy="760" rx="135" ry="62" fill="#E6E6E6"/><ellipse cx="550" cy="1300" rx="80" ry="62" fill="#E6E6E6"/>` +
  [[440, 612, 50, 56], [525, 582, 32, 36], [588, 592, 29, 33], [642, 616, 26, 30], [688, 652, 23, 27]]
    .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#FFFFFF" ${O(4)}/>`)
    .join('')

/** The basin's back rim and the herb water with its leaves and petals. */
const BACK =
  `<ellipse cx="540" cy="1430" rx="340" ry="80" fill="${C.wood}" ${O(5)}/><ellipse cx="540" cy="1436" rx="306" ry="58" fill="${C.herb}" ${O(3)}/>` +
  [[330, 1430, -20, C.leaf], [740, 1446, 25, C.leafLight], [420, 1460, 10, C.leafLight], [690, 1418, -35, C.leaf]]
    .map(([x, y, a, c]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="11" fill="${c}" transform="rotate(${a} ${x} ${y})" ${O(2.5)}/>`)
    .join('') +
  `<circle cx="790" cy="1430" r="9" fill="${C.lotus}" ${O(2)}/><circle cx="300" cy="1452" r="7" fill="${C.cream}" ${O(2)}/>`

/** Where the heel meets the water, the basin's front wall, and a folded towel over the rim. */
const FRONT =
  `<ellipse cx="548" cy="1398" rx="118" ry="20" fill="${C.herb}" ${O(3)}/>` +
  `<path d="M200,1430 Q204,1520 262,1562 H818 Q876,1520 880,1430 A340,80 0 0 1 200,1430Z" fill="${C.wood}" ${O(5)}/>` +
  `<path d="M236,1500 Q540,1560 844,1500" stroke="${C.woodDark}" stroke-width="5" fill="none"/>` +
  `<rect x="214" y="1392" width="120" height="56" rx="14" fill="${C.cream}" transform="rotate(-8 274 1420)" ${O(4)}/>` +
  `<path d="M226,1412 H322" stroke="${C.terracotta}" stroke-width="6" transform="rotate(-8 274 1420)"/>`

/** The Ngâm chân pictures: the herb basin, and the sole split into skin-tinted fills and untinted lines. */
export function footTextures(): Record<string, string> {
  return {
    'foot-basin-back': svgDoc(FOOT_BOX.back, 1, BACK),
    'foot-sole': svgDoc(FOOT_BOX.sole, 1, fillsOnly(SOLE)),
    'foot-sole-line': svgDoc(FOOT_BOX.sole, 1, linesOnly(SOLE)),
    'foot-basin-front': svgDoc(FOOT_BOX.front, 1, FRONT),
  }
}
