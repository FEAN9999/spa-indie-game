import { GROUND, HIGHLIGHT, ink } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/**
 * The stove, the plate and the bowl are drawn in the card's own pixels, so each is placed at its box's top left corner; the sides are small pictures placed by their centres.
 * The grill basket's frame, the noodles' sides and the sauce are drawn in the game; the patties are pictures tinted as they brown.
 */
export const BC_BOX = {
  stove: [100, 840, 680, 620] as Box,
  plate: [120, 860, 640, 520] as Box,
  bowl: [160, 900, 560, 560] as Box,
}

/** The grill basket over the coals: its centre, its half size, and the patties in it, from its centre. */
export const BC_BASKET = { x: 440, y: 1080, hw: 250, hh: 150 }
export const BC_PATTIES: readonly { x: number; y: number; rx: number; ry: number }[] = [
  { x: -150, y: -60, rx: 70, ry: 48 },
  { x: -10, y: -70, rx: 64, ry: 46 },
  { x: 130, y: -56, rx: 72, ry: 50 },
  { x: -90, y: 62, rx: 66, ry: 46 },
  { x: 60, y: 66, rx: 70, ry: 48 },
]
/** The patty pictures are drawn at this size, centred, and scaled to each patty. */
export const BC_PATTY = { rx: 72, ry: 50 }
/** Where the sides land on the plate, round its centre and within its radius. */
export const BC_PLATE = { x: 440, y: 1120, r: 230 }
/** The bowl's inside, which the sauce fills: its middle x, its bottom and brim, and how far the inner wall stands from the middle at each. */
export const BC_BOWL = { x: 440, bottom: 1400, top: 1010, bottomHalf: 150, topHalf: 240 }

const line = (d: string, col: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
/** Một mảng nâu mờ: bóng phẳng của A+, vẫn giữ màu trong bảng màu. */
const shadow = (d: string, opacity = 0.16) => `<path d="${d}" fill="${C.ink}" opacity="${opacity}"/>`

let ids = 0
/** Vẽ `body` chỉ bên trong hình `d`. */
const clip = (d: string, body: string) => {
  const id = `bc${ids++}`
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>`
}

// lò than đất nung nhìn hơi chếch: thân thót đáy có vòng trang trí, cửa lò có than, miệng lò đầy than hồng; khói hai bên
const BODY = 'M120,1232 A320,62 0 0 0 760,1232 L728,1430 Q726,1446 708,1446 L172,1446 Q154,1446 152,1430 Z'
const PIT = 'M150,1232 A290,46 0 0 1 730,1232 A290,46 0 0 1 150,1232 Z'
const COALS = [
  [196, 1238, 34, 15, C.lanternDark], [262, 1254, 38, 15, C.lantern], [336, 1264, 40, 14, C.stoneHot], [414, 1266, 40, 15, C.lantern], [494, 1266, 38, 14, C.lanternDark],
  [570, 1258, 38, 15, C.stoneHot], [640, 1244, 34, 14, C.lantern], [226, 1214, 34, 13, C.stoneHot], [298, 1222, 38, 14, C.lanternDark], [374, 1226, 40, 14, C.stoneHot],
  [450, 1228, 40, 14, C.lantern], [526, 1224, 38, 14, C.lanternDark], [600, 1214, 34, 13, C.stoneHot], [330, 1196, 32, 11, C.lantern], [440, 1198, 34, 11, C.lanternDark], [548, 1196, 30, 11, C.stoneHot],
] as const
const STOVE =
  line('M150,1000 C134,976 162,958 148,930 C138,910 154,894 146,872 M730,1010 C744,986 718,968 732,940 C742,920 726,904 734,884', C.steamBlue, 9, 'opacity=".8"') +
  `<ellipse cx="452" cy="1448" rx="300" ry="10" ${GROUND}/>` +
  `<path d="${BODY}" fill="${C.gachTauBase}"/>` +
  clip(
    BODY,
    shadow('M640,1240 L780,1240 L740,1450 L610,1450 C634,1380 646,1310 640,1240 Z') +
      line('M140,1320 Q440,1372 740,1320', C.phoTileSpeck, 8) +
      line('M150,1384 Q440,1428 730,1384', C.phoTileSpeck, 5) +
      line('M150,1290 L176,1428', C.cloud, 10, 'opacity=".3"') +
      line('M220,1360 l8,6 M286,1412 l10,-3 M602,1352 l-8,8 M650,1410 l9,3 M196,1418 l5,7', C.phoTileSpeck, 3) +
      `<path d="M380,1450 L380,1398 Q440,1350 500,1398 L500,1450 Z" fill="${C.deepBrown}" ${ink(5)}/>` +
      `<ellipse cx="412" cy="1438" rx="26" ry="11" fill="${C.lantern}"/><ellipse cx="462" cy="1436" rx="28" ry="12" fill="${C.stoneHot}"/><ellipse cx="440" cy="1444" rx="16" ry="6" fill="${C.gold}"/>`,
  ) +
  `<path d="${BODY}" fill="none" ${ink(7)}/>` +
  `<ellipse cx="440" cy="1232" rx="320" ry="62" fill="${C.gachTauFace}" ${ink(6)}/>` +
  line('M136,1220 A300,52 0 0 1 520,1172', C.cloud, 5, 'opacity=".4"') +
  `<path d="${PIT}" fill="${C.deepBrown}"/>` +
  clip(
    PIT,
    shadow('M150,1222 A290,46 0 0 1 730,1222 L730,1180 L150,1180 Z', 0.35) +
      `<g stroke="${C.ink}" stroke-width="2.5">${COALS.map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/>`).join('')}</g>` +
      `<g fill="${C.gold}"><ellipse cx="336" cy="1262" rx="16" ry="5"/><ellipse cx="570" cy="1256" rx="14" ry="5"/><ellipse cx="374" cy="1224" rx="15" ry="5"/><ellipse cx="226" cy="1212" rx="12" ry="4"/></g>` +
      `<g fill="${C.stoneLight}"><ellipse cx="206" cy="1236" rx="9" ry="3"/><ellipse cx="500" cy="1264" rx="10" ry="3"/><ellipse cx="452" cy="1196" rx="9" ry="3"/></g>` +
      line('M258,1250 l14,-5 M412,1262 l12,5 M598,1214 l-12,5', C.deepBrown, 3),
  ) +
  line('M120,1232 A320,62 0 0 0 760,1232', C.ink, 6)

// chả viên: miếng thịt viên dẹt nhìn từ trên, phần tô màu theo độ chín (trắng, xám), và lớp nét không tô
const PATTY_D = 'M-72,2 C-72,-28 -38,-50 2,-50 C42,-50 72,-30 72,0 C72,30 40,50 -2,50 C-42,50 -72,30 -72,2 Z'
const PATTY =
  `<path d="${PATTY_D}" fill="${C.cloud}"/>` +
  clip(
    PATTY_D,
    `<path d="M72,0 C72,30 40,50 -2,50 C-42,50 -72,30 -72,2 C-40,34 30,36 72,0 Z" fill="${C.marbleVein}"/>` +
      line('M-46,-30 L-30,30 M-12,-40 L4,40 M24,-38 L40,32', C.benchStoneDark, 7, 'opacity=".8"') +
      `<g fill="${C.stone}"><circle cx="-20" cy="-10" r="4"/><circle cx="34" cy="12" r="3.5"/><circle cx="-50" cy="14" r="3"/><circle cx="10" cy="26" r="3.5"/><circle cx="50" cy="-22" r="3"/></g>` +
      `<g fill="${C.marbleSeam}"><circle cx="-36" cy="-6" r="3"/><circle cx="16" cy="-24" r="3"/><circle cx="44" cy="26" r="2.5"/></g>`,
  )
const PATTY_LINE = `<ellipse cx="-26" cy="-24" rx="20" ry="7" transform="rotate(-12 -26 -24)" ${HIGHLIGHT}/>` + `<path d="${PATTY_D}" fill="none" ${ink(6)}/>`
const PATTY_BOX: Box = [-BC_PATTY.rx - 8, -BC_PATTY.ry - 8, BC_PATTY.rx * 2 + 16, BC_PATTY.ry * 2 + 16]

// đĩa men vành xanh, giữa đĩa một ổ bún trắng
const NEST = 'M262,1090 C262,1040 320,1008 380,1008 C444,1008 500,1040 500,1090 C500,1140 444,1172 380,1172 C318,1172 262,1140 262,1090 Z'
const NOODLES = Array.from({ length: 9 }, (_, i) => {
  const y = 1022 + i * 17
  return `M250,${y} q20,-12 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0`
}).join(' ')
const PLATE =
  `<ellipse cx="452" cy="1134" rx="300" ry="234" ${GROUND}/>` +
  `<ellipse cx="440" cy="1120" rx="300" ry="240" fill="${C.cream}" ${ink(6)}/>` +
  clip(
    'M140,1120 A300,240 0 0 1 740,1120 A300,240 0 0 1 140,1120 Z',
    shadow('M640,900 L760,900 L760,1380 L460,1380 C620,1320 690,1200 640,900 Z', 0.1) +
      line('M176,1060 A280,220 0 0 1 340,904', C.cloud, 8, 'opacity=".6"'),
  ) +
  `<ellipse cx="440" cy="1120" rx="272" ry="216" fill="none" stroke="${C.cobalt}" stroke-width="8"/>` +
  `<ellipse cx="440" cy="1120" rx="252" ry="198" fill="${C.paper}" stroke="${C.tileSeam}" stroke-width="3"/>` +
  shadow('M188,1120 A252,198 0 0 1 692,1120 C620,1000 260,1000 188,1120 Z', 0.07) +
  `<ellipse cx="386" cy="1100" rx="122" ry="80" ${GROUND}/>` +
  `<path d="${NEST}" fill="${C.cloud}"/>` +
  clip(NEST, line(NOODLES, C.tileSeam, 5) + line(NOODLES, C.cloud, 2) + shadow('M262,1110 C330,1160 440,1160 500,1100 L500,1180 L262,1180 Z', 0.12)) +
  `<path d="${NEST}" fill="none" ${ink(4)}/>` +
  line('M300,1050 C320,1036 344,1028 366,1028', C.cloud, 6, 'opacity=".9"')

// bát nước chấm nhìn ngang: sứ kem có đai xanh men, vành dày, chân đế; nước chấm được vẽ trong game
const BOWL_D = 'M190,1000 H690 L600,1420 H280 Z'
const BOWL =
  `<ellipse cx="452" cy="1450" rx="172" ry="9" ${GROUND}/>` +
  `<rect x="320" y="1412" width="240" height="36" rx="14" fill="${C.tileSeam}" ${ink(5)}/>` +
  line('M334,1440 H546', C.ink, 2.5, 'opacity=".25"') +
  `<path d="${BOWL_D}" fill="${C.cream}"/>` +
  clip(
    BOWL_D,
    shadow('M630,990 H700 L606,1430 H556 Z', 0.14) +
      `<path d="M220,1030 L292,1384 L306,1384 L236,1030 Z" ${HIGHLIGHT}/>` +
      line('M196,1052 H684', C.cobalt, 10) +
      line('M200,1074 H680', C.cobalt, 3) +
      `<g fill="${C.cobalt}"><circle cx="330" cy="1368" r="5"/><circle cx="440" cy="1372" r="5"/><circle cx="550" cy="1368" r="5"/></g>` +
      line('M300,1390 H580', C.cobalt, 3),
  ) +
  `<path d="${BOWL_D}" fill="none" ${ink(7)}/>` +
  `<rect x="180" y="988" width="520" height="20" rx="10" fill="${C.cream}" ${ink(5)}/>` +
  line('M200,994 H420', C.cloud, 4, 'opacity=".9"')

// rau: lá xà lách mép quăn, gân giữa, gân phụ, bóng và ánh
const RAU_D = 'M30,57 C18,54 8,44 8,32 C6,24 10,18 12,14 C14,8 20,4 26,6 C30,2 36,3 40,7 C46,6 52,12 51,18 C55,24 54,32 52,38 C50,48 42,55 30,57 Z'
const RAU =
  `<path d="${RAU_D}" fill="${C.leafLight}"/>` +
  clip(RAU_D, shadow('M52,20 C56,40 44,56 30,58 L60,60 L60,20 Z', 0.18) + `<ellipse cx="20" cy="18" rx="7" ry="4" transform="rotate(-30 20 18)" ${HIGHLIGHT}/>`) +
  `<path d="${RAU_D}" fill="none" ${ink(3.2)}/>` +
  line('M30,55 V12 M30,42 L18,32 M30,42 L42,32 M30,28 L20,20 M30,28 L40,20', C.leaf, 2.6)

// đu đủ: ba sợi đu đủ xanh ngâm và một lát cà rốt tỉa
const DU =
  [
    'M12,48 Q16,16 26,8',
    'M26,52 Q30,18 40,10',
    'M40,52 Q44,20 53,12',
  ]
    .map(d => line(d, C.ink, 10) + line(d, C.cucumber, 6) + line(d, C.cloud, 1.6, 'opacity=".7"'))
    .join('') +
  `<circle cx="18" cy="44" r="10" fill="${C.stoneHot}" ${ink(3)}/>` +
  `<circle cx="18" cy="44" r="5" fill="none" stroke="${C.mustardDark}" stroke-width="1.8"/>` +
  `<circle cx="15" cy="41" r="2.5" ${HIGHLIGHT}/>`

// ớt: quả ớt đỏ cong, cuống xanh, có ánh dọc thân
const OT_D = 'M12,50 Q6,28 22,15 Q38,5 50,15 Q34,18 28,30 Q22,42 12,50 Z'
const OT =
  `<path d="${OT_D}" fill="${C.lantern}"/>` +
  clip(OT_D, shadow('M50,15 Q34,18 28,30 Q22,42 12,50 L30,52 Q36,34 50,15 Z', 0.2)) +
  `<path d="${OT_D}" fill="none" ${ink(3.2)}/>` +
  line('M16,40 Q18,28 28,20', C.cloud, 2.6, 'opacity=".55"') +
  line('M44,14 Q50,4 56,8', C.leaf, 5) +
  `<ellipse cx="47" cy="15" rx="6" ry="5" fill="${C.leaf}" ${ink(2.5)}/>`

/** The Bún chả pictures: the stove, a patty (tinted as it browns, with its untinted line), the plate, the bowl and the three sides. */
export function bunChaTextures(): Record<string, string> {
  return {
    'bc-stove': svgDoc(BC_BOX.stove, 1, STOVE),
    'bc-patty': svgDoc(PATTY_BOX, 1, PATTY),
    'bc-patty-line': svgDoc(PATTY_BOX, 1, PATTY_LINE),
    'bc-plate': svgDoc(BC_BOX.plate, 1, PLATE),
    'bc-bowl': svgDoc(BC_BOX.bowl, 1, BOWL),
    'bc-rau': svgDoc([0, 0, 60, 60], 1, RAU),
    'bc-du': svgDoc([0, 0, 60, 60], 1, DU),
    'bc-ot': svgDoc([0, 0, 60, 60], 1, OT),
  }
}
