import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// Every texture is drawn in the card's own pixels, so each is placed at its box's top left corner.
export const FOOT_BOX = {
  back: [190, 1310, 700, 130] as Box,
  sole: [380, 540, 350, 870] as Box,
  front: [190, 1330, 700, 270] as Box,
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

// Chậu sâu như bản đã duyệt: miệng chậu mở rộng (vành elip cao 52), thân cao 150 thon xuống đáy, đáy cách thanh thời gian
// một khoảng nhỏ. Mặt nước thuốc nằm ở y 1382, nên gót chân (đáy y 1405) chìm trong nước.

/** Vành ngoài của miệng chậu và mặt nước bên trong. */
const RIM = { cx: 540, cy: 1376, rx: 336, ry: 52 }
const WATER = { cx: 540, cy: 1382, rx: 306, ry: 40 }
const rimArc = (sweep: 0 | 1) => `M${RIM.cx - RIM.rx},${RIM.cy} A${RIM.rx},${RIM.ry} 0 0 ${sweep} ${RIM.cx + RIM.rx},${RIM.cy}`

/** Lòng chậu gỗ phía sau chân: thành trong sẫm có ván, vành sau dày, nước thuốc có gợn, lá và cánh hoa nổi sau chân. */
const BACK =
  `<ellipse cx="${RIM.cx}" cy="${RIM.cy}" rx="${RIM.rx}" ry="${RIM.ry}" fill="${C.woodDark}"/>` +
  `<path d="M300,1336 L304,1352 M380,1330 L382,1346 M460,1327 L461,1343 M540,1326 L540,1342 M620,1327 L619,1343 M700,1330 L698,1346 M780,1336 L776,1352" stroke="${shade(C.woodDark)}" stroke-width="4" stroke-linecap="round"/>` +
  `<path d="${rimArc(1)}" fill="none" stroke="${C.ink}" stroke-width="16"/>` +
  `<path d="${rimArc(1)}" fill="none" stroke="${C.woodLight}" stroke-width="9"/>` +
  `<ellipse cx="${WATER.cx}" cy="${WATER.cy}" rx="${WATER.rx}" ry="${WATER.ry}" fill="${C.herb}" ${ink(4)}/>` +
  `<path d="M300,1366 C350,1356 420,1352 460,1354 M620,1354 C680,1352 740,1358 790,1368" fill="none" stroke="${C.phoHouseMoss}" stroke-width="3.5" stroke-linecap="round"/>` +
  leaf(340, 1368, -8) + leaf(760, 1370, 12) + petal(690, 1360, 10) + petal(400, 1362, -20)

/** Nước thuốc phía trước che gót, gợn quanh gót, lá và cánh hoa; thân chậu ván dọc thon xuống đáy, hai đai đồng; vành trước; cuộn khăn trên mép. */
const TUB_D = `${rimArc(0)} L846,1556 A306,22 0 0 1 234,1556 Z`
const FRONT =
  `<ellipse cx="548" cy="1584" rx="304" ry="12" ${GROUND}/>` +
  `<path d="M${WATER.cx - WATER.rx},${WATER.cy} A${WATER.rx},${WATER.ry} 0 0 0 ${WATER.cx + WATER.rx},${WATER.cy} Z" fill="${C.herb}" opacity=".92"/>` +
  `<ellipse cx="546" cy="1394" rx="72" ry="11" fill="none" stroke="${C.cucumber}" stroke-width="3.5"/>` +
  `<ellipse cx="546" cy="1398" rx="100" ry="16" fill="none" stroke="${C.phoHouseMoss}" stroke-width="3"/>` +
  leaf(318, 1398, 6) + leaf(782, 1400, -10) + petal(652, 1408, 15) + petal(694, 1402, -10) + petal(420, 1408, 25) +
  `<path d="${TUB_D}" fill="${C.wood}"/>` +
  `<clipPath id="foot-tub"><path d="${TUB_D}"/></clipPath><g clip-path="url(#foot-tub)">` +
  `<path d="M700,1440 L890,1370 L890,1600 L640,1600 Z" fill="${C.woodDark}" opacity=".7"/>` +
  `<path d="M262,1426 L274,1552 M334,1434 L342,1564 M406,1438 L410,1572 M478,1440 L480,1576 M550,1440 L550,1578 M622,1440 L620,1576 M694,1438 L690,1572 M766,1434 L758,1564 M826,1426 L816,1552" stroke="${C.woodDark}" stroke-width="4"/>` +
  `<path d="M214,1420 A326,50 0 0 0 866,1420" fill="none" stroke="${C.ink}" stroke-width="12"/>` +
  `<path d="M214,1420 A326,50 0 0 0 866,1420" fill="none" stroke="${C.mustardDark}" stroke-width="7"/>` +
  `<path d="M226,1500 A314,40 0 0 0 854,1500" fill="none" stroke="${C.ink}" stroke-width="12"/>` +
  `<path d="M226,1500 A314,40 0 0 0 854,1500" fill="none" stroke="${C.mustardDark}" stroke-width="7"/>` +
  `<path d="M254,1446 C264,1478 276,1508 296,1532" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".4"/>` +
  `</g>` +
  `<path d="${TUB_D}" fill="none" ${ink(6)}/>` +
  `<path d="${rimArc(0)}" fill="none" stroke="${C.ink}" stroke-width="16"/>` +
  `<path d="${rimArc(0)}" fill="none" stroke="${C.woodLight}" stroke-width="9"/>` +
  `<path d="M252,1400 C320,1418 390,1424 450,1427" fill="none" stroke="${C.plank}" stroke-width="3.5" stroke-linecap="round"/>` +
  // cuộn khăn trắng sọc xanh ngọc đặt trên mép chậu bên trái
  `<g transform="translate(216 1404) rotate(-10) scale(1.3)">` +
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
