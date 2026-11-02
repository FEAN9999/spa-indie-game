import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
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

// Nét vẽ A+ theo bản đã duyệt (docs/art/huong-net-ve/lo1/aplus-foot.svg). Lòng bàn chân lấy từ bản đã duyệt, kéo giãn
// vào hộp của bàn chân; mép vòm bên trong nới ra một chút để sáu huyệt của luật chơi nằm trọn trên bàn chân.

/** Nếp da: trắng tối hơn mảng bóng, tô màu da thành nét da đậm. */
const CREASE = shade('#FFFFFF', 0.3)

const SOLE_D =
  'M433,1344 C412,1265 410,1180 440,1100 C462,1040 420,980 410,908 C393,855 384,764 415,707 C447,655 541,633 631,646 ' +
  'C690,655 712,711 703,785 C694,873 672,982 667,1091 C663,1200 676,1291 640,1348 C600,1405 465,1413 433,1344 Z'

/** Năm ngón (ngón cái trước) rồi lòng bàn chân phủ lên gốc ngón: trắng, viền nâu, tách thành lớp tô màu da và lớp nét. */
const SOLE_SHAPES =
  [[460, 624, 56, 68, '#FFFFFF'], [555, 589, 34, 44, '#FFFFFF'], [618, 598, 29, 37, '#FFFFFF'], [667, 624, 27, 33, TINT_SHADE], [701, 663, 22, 26, TINT_SHADE]]
    .map(([x, y, rx, ry, fill]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${ink(5)}/>`)
    .join('') + `<path d="${SOLE_D}" fill="#FFFFFF" ${ink(6)}/>`

/** Trong lớp màu da: bóng mép ngoài, bóng vòm bên trong, nếp da. */
const SOLE_SHADE =
  `<clipPath id="foot-sole"><path d="${SOLE_D}"/></clipPath><g clip-path="url(#foot-sole)">` +
  `<path d="M663,676 C721,742 703,894 681,1025 C667,1134 681,1265 640,1352 L766,1352 L766,655 Z" fill="${TINT_SHADE}"/>` +
  `<path d="M440,1100 C470,1040 430,975 418,908 C445,947 500,1025 492,1112 C483,1178 455,1200 440,1100 Z" fill="${TINT_SHADE}"/>` +
  `</g>` +
  `<path d="M447,690 C496,672 586,668 658,685 M492,842 C532,860 586,860 631,842 M541,1003 C555,1025 568,1038 591,1043 M505,1173 C541,1191 582,1191 613,1173" ` +
  `fill="none" stroke="${CREASE}" stroke-width="5" stroke-linecap="round"/>`

/** Trên lớp nét, không bị tô: đệm hồng ở mu và gót, mép móng, điểm sáng. */
const SOLE_TOP =
  `<ellipse cx="541" cy="737" rx="130" ry="65" fill="${C.lotus}" opacity=".22"/><ellipse cx="546" cy="1291" rx="99" ry="61" fill="${C.lotus}" opacity=".22"/>` +
  `<g fill="${C.nailBare}" ${ink(3)}>` +
  `<path d="M429,572 C442,554 478,554 492,572 C474,567 447,567 429,572 Z"/><path d="M537,554 C546,543 564,543 573,554 C559,552 550,552 537,554 Z"/>` +
  `<path d="M602,567 C609,557 627,557 634,567 C622,565 613,565 602,567 Z"/></g>` +
  `<ellipse cx="442" cy="607" rx="16" ry="22" ${HIGHLIGHT}/><ellipse cx="544" cy="578" rx="9" ry="13" ${HIGHLIGHT}/>` +
  `<path d="M429,759 C433,724 456,698 487,685 C469,716 456,746 456,781 Z" ${HIGHLIGHT}/>` +
  `<path d="M469,1243 C478,1221 496,1208 519,1204 C501,1221 492,1239 492,1261 Z" ${HIGHLIGHT}/>`

/** Một chiếc lá nổi: thân lá, gân giữa. */
const leaf = (x: number, y: number, a: number) =>
  `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-26,0 q18,-16 52,0 q-18,16 -52,0 Z" fill="${C.leaf}" ${ink(3)}/>` +
  `<path d="M-18,0 H18" stroke="${C.leafLight}" stroke-width="3" stroke-linecap="round"/></g>`
/** Một cánh hoa nổi. */
const petal = (x: number, y: number, a: number) =>
  `<path d="M-10,0 q10,-12 20,0 q-10,10 -20,0 Z" transform="translate(${x} ${y}) rotate(${a})" fill="${C.lotus}" stroke="${C.lotusDark}" stroke-width="2.5"/>`

/** Lòng chậu gỗ, vành sau dày, nước thuốc có gợn, lá và cánh hoa nổi phía sau chân. */
const BACK =
  `<ellipse cx="540" cy="1378" rx="330" ry="30" fill="${C.woodDark}"/>` +
  `<path d="M210,1378 A330,30 0 0 1 870,1378" fill="none" stroke="${C.ink}" stroke-width="16"/>` +
  `<path d="M210,1378 A330,30 0 0 1 870,1378" fill="none" stroke="${C.woodLight}" stroke-width="9"/>` +
  `<ellipse cx="540" cy="1386" rx="304" ry="24" fill="${C.herb}" ${ink(4)}/>` +
  `<path d="M300,1382 C350,1374 420,1372 460,1374 M620,1374 C680,1372 740,1376 790,1382" fill="none" stroke="${C.phoHouseMoss}" stroke-width="3.5" stroke-linecap="round"/>` +
  leaf(340, 1380, -8) + leaf(760, 1382, 12) + petal(690, 1376, 10) + petal(400, 1384, -20)

/** Nước thuốc phía trước che gót, gợn quanh gót, lá và cánh hoa; thân chậu ván dọc hai đai đồng; vành trước; cuộn khăn trên mép. */
const TUB_D = 'M210,1378 A330,30 0 0 0 870,1378 L842,1500 A302,24 0 0 1 238,1500 Z'
const FRONT =
  `<ellipse cx="548" cy="1540" rx="300" ry="14" ${GROUND}/>` +
  `<path d="M236,1386 A304,24 0 0 0 844,1386 Z" fill="${C.herb}" opacity=".92"/>` +
  `<ellipse cx="546" cy="1392" rx="72" ry="10" fill="none" stroke="${C.cucumber}" stroke-width="3.5"/>` +
  `<ellipse cx="546" cy="1396" rx="98" ry="14" fill="none" stroke="${C.phoHouseMoss}" stroke-width="3"/>` +
  leaf(320, 1396, 6) + leaf(780, 1398, -10) + petal(650, 1400, 15) + petal(690, 1404, -10) + petal(420, 1398, 25) +
  `<path d="${TUB_D}" fill="${C.wood}"/>` +
  `<clipPath id="foot-tub"><path d="${TUB_D}"/></clipPath><g clip-path="url(#foot-tub)">` +
  `<path d="M700,1430 L890,1370 L890,1570 L650,1570 Z" fill="${C.woodDark}" opacity=".7"/>` +
  `<path d="M270,1414 L280,1508 M340,1420 L346,1516 M410,1424 L413,1522 M480,1426 L481,1524 M550,1426 L550,1526 M620,1426 L619,1524 M690,1424 L687,1522 M760,1420 L754,1516 M820,1414 L810,1508" stroke="${C.woodDark}" stroke-width="4"/>` +
  `<path d="M218,1412 A322,30 0 0 0 862,1412" fill="none" stroke="${C.ink}" stroke-width="12"/>` +
  `<path d="M218,1412 A322,30 0 0 0 862,1412" fill="none" stroke="${C.mustardDark}" stroke-width="7"/>` +
  `<path d="M230,1466 A310,26 0 0 0 850,1466" fill="none" stroke="${C.ink}" stroke-width="12"/>` +
  `<path d="M230,1466 A310,26 0 0 0 850,1466" fill="none" stroke="${C.mustardDark}" stroke-width="7"/>` +
  `<path d="M258,1432 C268,1456 280,1474 298,1488" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".4"/>` +
  `</g>` +
  `<path d="${TUB_D}" fill="none" ${ink(6)}/>` +
  `<path d="M210,1378 A330,30 0 0 0 870,1378" fill="none" stroke="${C.ink}" stroke-width="16"/>` +
  `<path d="M210,1378 A330,30 0 0 0 870,1378" fill="none" stroke="${C.woodLight}" stroke-width="9"/>` +
  `<path d="M260,1394 C320,1404 380,1408 440,1410" fill="none" stroke="${C.plank}" stroke-width="3.5" stroke-linecap="round"/>` +
  // cuộn khăn trắng sọc xanh ngọc đặt trên mép chậu bên trái
  `<g transform="translate(222 1400) rotate(-10) scale(1.3)">` +
  `<rect x="0" y="-20" width="104" height="40" rx="20" fill="${C.cream}"/>` +
  `<path d="M20,10 H92 Q100,10 102,4 L102,14 Q98,20 84,20 H20 Z" fill="${C.tileSeam}"/>` +
  `<path d="M40,-20 V20 M76,-20 V20" stroke="${C.teal}" stroke-width="5"/>` +
  `<path d="M30,-14 H70" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".6"/>` +
  `<rect x="0" y="-20" width="104" height="40" rx="20" fill="none" ${ink(5)}/>` +
  `<ellipse cx="6" cy="0" rx="13" ry="20" fill="${C.cream}" ${ink(4.5)}/>` +
  `<path d="M6,-4 a4,4 0 1,1 -3,6 a8,9 0 1,1 9,-12" fill="none" stroke="${shade(C.tileSeam)}" stroke-width="2.5" stroke-linecap="round"/>` +
  `</g>`

/** The Ngâm chân pictures: the herb basin, and the sole split into skin-tinted fills and untinted lines. */
export function footTextures(): Record<string, string> {
  return {
    'foot-basin-back': svgDoc(FOOT_BOX.back, 1, BACK),
    'foot-sole': svgDoc(FOOT_BOX.sole, 1, fillsOnly(SOLE_SHAPES) + SOLE_SHADE),
    'foot-sole-line': svgDoc(FOOT_BOX.sole, 1, linesOnly(SOLE_SHAPES) + SOLE_TOP),
    'foot-basin-front': svgDoc(FOOT_BOX.front, 1, FRONT),
  }
}
