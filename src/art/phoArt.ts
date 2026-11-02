import { PHO_CUT_X } from '../config'
import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// The board, the pot, the dial and the bowl are drawn in the card's own pixels, so each is placed at its box's top left corner;
// the beef slice, the toppings and the ticket are small pictures placed by their centres.
export const PHO_BOX = {
  board: [120, 800, 840, 680] as Box,
  pot: [120, 840, 600, 600] as Box,
  dial: [800, 820, 140, 640] as Box,
  bowl: [190, 820, 700, 420] as Box,
  ticket: [0, 0, 470, 270] as Box,
}

/** The dotted lines run this far down the board, over the beef. */
export const PHO_LINES = { top: 880, bottom: 1400 }
/** The dial's tube: its centre x, and where its needle's run starts (empty) and ends (full). */
export const PHO_DIAL = { x: 870, empty: 1420, full: 860, inner: 26 }
/** The broth's top in the bowl, where the beef and the toppings land. */
export const PHO_BROTH = { x: 540, y: 950, rx: 300, ry: 56 }

const line = (d: string, col: string, w: number, extra = '') => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${extra}/>`
/** Một sợi hai lớp: nét nâu bên dưới, màu bên trên (sợi bánh phở, cán vợt). */
const cord = (d: string, col: string, w: number) => line(d, C.ink, w + 6) + line(d, col, w)
/** Vẽ `body` chỉ trong hình `d` (mảng bóng, vân, dải mỡ không lem ra ngoài). */
const inside = (id: string, d: string, body: string) => `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>`

// thớt: tấm gỗ có độ dày ở mép trước, vân gỗ và mắt gỗ, lỗ treo; miếng bò có dải mỡ, vân mỡ, ánh ướt; bốn vạch thái và con dao
const SLAB = 'M256,994 C303,936 477,924 603,941 C729,954 824,978 836,1061 C849,1153 808,1246 729,1276 C603,1321 414,1312 303,1276 C233,1249 212,1162 221,1086 C225,1044 234,1019 256,994 Z'
const BOARD =
  `<rect x="130" y="846" width="820" height="624" rx="46" fill="${C.woodLight}" ${ink(7)}/>` +
  `<rect x="130" y="810" width="820" height="620" rx="46" fill="${C.plank}" ${ink(7)}/>` +
  line('M184,840 H896', C.cloud, 6, ' opacity=".35"') +
  line('M177,927 C303,910 382,941 493,924 M193,1366 C335,1346 477,1386 635,1363 C729,1349 808,1376 903,1359 M587,894 C698,880 792,904 887,890 M171,1162 C187,1212 180,1279 199,1329 M887,1128 C906,1195 900,1262 912,1312', C.plankLine, 5) +
  `<ellipse cx="821" cy="1333" rx="34" ry="15" fill="none" stroke="${C.plankLine}" stroke-width="5"/><ellipse cx="821" cy="1333" rx="14" ry="6" fill="${C.plankLine}"/>` +
  `<circle cx="887" cy="877" r="22" fill="${C.woodDark}" ${ink(6)}/>` +
  `<path d="${SLAB}" fill="${C.terracotta}"/>` +
  inside(
    'pho-slab',
    SLAB,
    `<path d="M162,1246 C382,1296 666,1279 887,1128 L887,1413 L162,1413 Z" fill="${C.lanternDark}" opacity=".55"/>` +
      `<path d="M288,1078 C367,1044 508,1038 603,1055 C540,1078 414,1088 303,1132 Z" fill="${C.lantern}" opacity=".7"/>` +
      line('M288,1101 C367,1078 417,1125 480,1098 S590,1058 641,1085 C685,1105 729,1095 780,1122', C.wrongPink, 9) +
      line('M480,1098 C496,1132 486,1158 512,1182 M641,1085 C654,1122 685,1138 691,1172', C.wrongPink, 5) +
      line('M332,1205 C395,1182 445,1225 527,1202 C587,1185 647,1215 748,1189', C.wrongPink, 8) +
      line('M433,1215 C442,1239 461,1252 464,1272 M666,1205 C679,1232 704,1242 713,1262', C.wrongPink, 5) +
      `<path d="M225,1011 C303,951 477,937 603,954 C729,967 808,988 840,1051 C802,1021 729,1008 603,998 C477,988 319,994 225,1038 Z" fill="${C.cream}"/>` +
      line('M225,1038 C319,994 477,988 603,998 C729,1008 802,1021 840,1051', C.wrongPink, 4),
  ) +
  `<path d="${SLAB}" fill="none" ${ink(7)}/>` +
  line('M297,1071 C319,1055 351,1048 379,1051 M717,1044 C736,1048 754,1058 767,1071', C.cloud, 9, ' opacity=".55"') +
  PHO_CUT_X.map(x => `<path d="M${x},${PHO_LINES.top} V${PHO_LINES.bottom}" stroke="${C.cream}" stroke-width="9" stroke-dasharray="14 18" stroke-linecap="round"/>`).join('') +
  // dao: lưỡi thép có gờ sáng, cán gỗ ba đinh tán, nằm ở góc dưới thớt
  `<g transform="translate(676 1446) rotate(-5)">` +
  `<path d="M0,-12 L218,-18 C246,-18 262,0 244,16 L0,18 Z" fill="${C.silver}" ${ink(6)}/>` +
  line('M8,-3 L226,-8', C.cloud, 4, ' opacity=".8"') +
  line('M2,10 L238,8', C.stoneLight, 3) +
  `<rect x="-128" y="-16" width="132" height="36" rx="14" fill="${C.woodDark}" ${ink(6)}/>` +
  line('M-116,-6 H-10', C.wood, 4) +
  [-98, -60, -22].map(x => `<circle cx="${x}" cy="3" r="5.5" fill="${C.mustard}" ${ink(2.5)}/>`).join('') +
  `</g>`

// nồi: lò đất có cửa lửa, lưỡi lửa liếm hai bên đáy nồi; nồi nhôm có quai, gờ thân, mảng bóng, vệt sáng;
// nước dùng vàng có váng; vợt tre trụng bánh với cán dài; hơi bốc
const POT_BODY = 'M165,1120 V1300 C165,1352 675,1352 675,1300 V1120 Z'
const POT =
  `<ellipse cx="420" cy="1430" rx="262" ry="9" ${GROUND}/>` +
  [[176, 1350, 1290], [206, 1352, 1306], [634, 1352, 1306], [664, 1350, 1290]]
    .map(([x, y, top]) => `<path d="M${x - 16},${y} Q${x - 14},${top + 22} ${x},${top} Q${x + 14},${top + 22} ${x + 16},${y} Z" fill="${C.stoneHot}" ${ink(3.5)}/><path d="M${x - 7},${y} Q${x - 5},${top + 30} ${x},${top + 18} Q${x + 5},${top + 30} ${x + 7},${y} Z" fill="${C.gold}"/>`)
    .join('') +
  `<path d="M168,1372 L672,1372 L646,1432 L194,1432 Z" fill="${C.terracotta}" ${ink(7)}/>` +
  `<path d="M590,1374 L670,1374 L645,1430 L574,1430 Z" fill="${shade(C.terracotta)}"/>` +
  `<path d="M372,1432 V1404 Q420,1376 468,1404 V1432 Z" fill="${C.deepBrown}" ${ink(4)}/>` +
  `<path d="M396,1430 Q404,1404 418,1396 Q414,1414 426,1404 Q440,1414 444,1430 Z" fill="${C.stoneHot}"/><path d="M410,1430 Q416,1414 424,1412 Q426,1422 432,1430 Z" fill="${C.gold}"/>` +
  `<rect x="150" y="1346" width="540" height="28" rx="12" fill="${C.clay}" ${ink(6)}/>` +
  `<rect x="131" y="1150" width="40" height="24" rx="11" fill="${C.tin}" ${ink(5)}/><rect x="669" y="1150" width="40" height="24" rx="11" fill="${C.tin}" ${ink(5)}/>` +
  `<path d="${POT_BODY}" fill="${C.tin}"/>` +
  inside(
    'pho-pot',
    POT_BODY,
    `<path d="M606,1110 H690 V1360 H560 C600,1330 614,1250 606,1110 Z" fill="${shade(C.tin)}"/>` +
      `<path d="M194,1150 C190,1210 192,1262 204,1310 C214,1262 214,1206 212,1150 Z" ${HIGHLIGHT}/>`,
  ) +
  line('M165,1206 C300,1246 540,1246 675,1206 M165,1278 C300,1318 540,1318 675,1278', C.tinRib, 8) +
  `<path d="${POT_BODY}" fill="none" ${ink(7)}/>` +
  `<ellipse cx="420" cy="1120" rx="255" ry="76" fill="${C.tin}" ${ink(7)}/>` +
  `<ellipse cx="420" cy="1124" rx="228" ry="60" fill="${C.wall}" ${ink(4)}/>` +
  `<path d="M193,1122 C230,1078 610,1078 647,1122 C600,1092 240,1092 193,1122 Z" fill="${shade(C.wall)}"/>` +
  [[262, 1138, 14, 5], [520, 1156, 18, 6], [590, 1120, 10, 4], [300, 1108, 9, 3]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${C.glow}"/>`).join('') +
  `<path d="M190,1082 C220,1060 238,1066 252,1050" fill="none" stroke="${C.cloud}" stroke-width="6" stroke-linecap="round" opacity=".45"/>` +
  // vợt tre: miệng vợt đan, bánh phở trắng bên trong, cán gỗ chĩa lên phải
  cord('M470,1108 L660,872', C.woodDark, 14) +
  `<circle cx="664" cy="866" r="9" fill="${C.mustard}" ${ink(3)}/>` +
  `<ellipse cx="380" cy="1116" rx="96" ry="30" fill="${C.weave}" ${ink(6)}/>` +
  `<ellipse cx="380" cy="1118" rx="78" ry="20" fill="${C.weaveLine}" ${ink(3)}/>` +
  line('M318,1118 C340,1104 362,1126 384,1112 S420,1120 440,1110 M326,1126 C350,1114 372,1134 398,1120 S430,1126 446,1118', C.cream, 6) +
  `<ellipse cx="380" cy="1116" rx="96" ry="30" fill="none" stroke="${C.weaveLine}" stroke-width="5" stroke-dasharray="10 9" opacity=".9"/>` +
  `<ellipse cx="380" cy="1116" rx="96" ry="30" fill="none" ${ink(6)}/>` +
  line('M250,1038 C232,1006 268,984 250,950 M420,1024 C402,992 438,970 420,936 M590,1038 C572,1006 608,984 590,950', C.steamBlue, 9, ' opacity=".8"')

// thước độ chín: ống kem trên chân gỗ, có mảng bóng mép phải và vệt sáng mép trái; dải và kim vẽ đè trong game
const DIAL =
  `<ellipse cx="${PHO_DIAL.x + 4}" cy="1452" rx="70" ry="7" ${GROUND}/>` +
  `<rect x="${PHO_DIAL.x - 36}" y="840" width="72" height="600" rx="36" fill="${C.cream}" ${ink(7)}/>` +
  `<path d="M${PHO_DIAL.x + 30},870 V1410" stroke="${shade(C.cream)}" stroke-width="8" stroke-linecap="round"/>` +
  `<path d="M${PHO_DIAL.x - 29},880 V1100" stroke="${C.cloud}" stroke-width="5" stroke-linecap="round" opacity=".7"/>` +
  `<rect x="${PHO_DIAL.x - 60}" y="1434" width="120" height="22" rx="10" fill="${C.woodDark}" ${ink(5)}/>` +
  line(`M${PHO_DIAL.x - 48},1441 H${PHO_DIAL.x + 30}`, C.wood, 4)

// tô: tô sứ xanh trắng có chân, ánh men, mảng bóng bên phải, hai dải men xanh và chấm hoa; nước dùng vàng có váng mỡ, bánh phở
const BOWL_BODY = 'M200,945 C206,1090 360,1200 540,1200 C720,1200 874,1090 880,945 Z'
const BOWL =
  `<ellipse cx="548" cy="1222" rx="252" ry="15" ${GROUND}/>` +
  `<ellipse cx="540" cy="1204" rx="120" ry="22" fill="${C.cream}" ${ink(5)}/>` +
  `<path d="${BOWL_BODY}" fill="${C.cream}"/>` +
  inside(
    'pho-bowl',
    BOWL_BODY,
    `<path d="M880,945 C874,1090 720,1200 540,1200 C680,1180 838,1080 846,945 Z" fill="${shade(C.cream)}"/>` +
      `<path d="M240,1000 C254,1080 290,1130 340,1165 C300,1120 272,1070 262,1006 Z" fill="${C.cloud}"/>`,
  ) +
  line('M226,1040 C320,1150 760,1150 854,1040', C.cobalt, 16) +
  line('M420,1186 C500,1203 580,1203 660,1186', C.cobalt, 7) +
  [[330, 1132], [440, 1160], [640, 1160], [750, 1132]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.cobalt}"/>`).join('') +
  `<path d="${BOWL_BODY}" fill="none" ${ink(7)}/>` +
  `<ellipse cx="540" cy="945" rx="340" ry="88" fill="${C.cream}" ${ink(7)}/>` +
  `<path d="M232,922 C300,880 440,864 540,864 C440,872 320,892 246,934 Z" fill="${C.cloud}"/>` +
  `<ellipse cx="${PHO_BROTH.x}" cy="952" rx="306" ry="66" fill="${C.wall}" ${ink(4)}/>` +
  `<path d="M236,950 C280,894 800,894 844,950 C790,914 290,914 236,950 Z" fill="${shade(C.wall)}"/>` +
  [[300, 978, 20, 7], [360, 1000, 12, 4], [700, 990, 18, 6], [780, 960, 12, 4], [270, 944, 10, 4]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${C.glow}"/>`).join('') +
  ['M290,966 C330,936 390,944 430,964 S520,986 560,960', 'M310,992 C360,970 410,982 460,996 S560,1004 600,982', 'M330,944 C370,926 430,930 470,944', 'M380,1010 C430,998 490,1010 540,1016', 'M600,1004 C640,990 700,1000 740,990']
    .map(d => cord(d, C.paper, 9))
    .join('')

// một lát bò vẽ trắng để tô theo độ chín: nền xám rất nhạt, vân mỡ trắng, mảng bóng mép dưới
const BEEF_SLICE = 'M10,32 C14,14 44,8 70,10 C96,12 112,22 110,36 C108,50 84,54 58,52 C32,50 8,46 10,32 Z'
const BEEF =
  `<path d="${BEEF_SLICE}" fill="${shade('#FFFFFF', 0.07)}"/>` +
  inside(
    'pho-beef',
    BEEF_SLICE,
    `<path d="M0,44 C30,54 80,52 120,34 L120,60 L0,60 Z" fill="${TINT_SHADE}"/>` +
      line('M22,30 C36,22 50,34 66,26 S90,24 102,30', '#FFFFFF', 4) +
      line('M30,42 C46,38 60,44 78,40', '#FFFFFF', 3),
  ) +
  `<path d="${BEEF_SLICE}" fill="none" ${ink(4)}/>`

// hành: khoanh hành lá xanh, lớp màng nhạt, lõi rỗng; ớt: khoanh ớt đỏ, thịt nhạt, hạt; rau: lá húng có gân
const RING = (id: string, outer: string, inner: string, core: string) =>
  `<circle cx="30" cy="30" r="24" fill="${outer}"/>` +
  inside(id, 'M6,30 a24,24 0 1,0 48,0 a24,24 0 1,0 -48,0 Z', `<path d="M60,22 C56,48 38,60 6,58 L60,60 Z" fill="${shade(outer)}"/>`) +
  `<circle cx="30" cy="30" r="24" fill="none" ${ink(4)}/>` +
  `<circle cx="30" cy="30" r="14" fill="${inner}" ${ink(2.5)}/>` +
  core +
  `<path d="M14,22 Q18,13 27,10" fill="none" stroke="${C.cloud}" stroke-width="4" stroke-linecap="round" opacity=".6"/>`
const ONION = RING('pho-onion', C.leafLight, C.cucumber, `<circle cx="30" cy="30" r="6" fill="${C.wall}" ${ink(2)}/>`)
const CHILI = RING(
  'pho-chili',
  C.lantern,
  C.burnPale,
  line('M30,16 V24 M30,36 V44 M16,30 H24 M36,30 H44', C.lanternDark, 2.5) +
    [[25, 25], [35, 26], [27, 35], [36, 35]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="2.2" fill="${C.glow}" ${ink(1.2)}/>`).join(''),
)
const LEAF = 'M8,50 Q6,12 52,8 Q56,52 8,50 Z'
const HERB =
  `<path d="${LEAF}" fill="${C.leaf}"/>` +
  inside('pho-herb', LEAF, `<path d="M8,50 L52,8 L60,60 L0,60 Z" fill="${shade(C.leaf)}"/>`) +
  `<path d="${LEAF}" fill="none" ${ink(4)}/>` +
  line('M12,46 L46,14', C.leafLight, 3.5) +
  line('M22,36 L18,22 M30,28 L28,16 M24,34 L38,36 M32,26 L44,28', C.leafLight, 2) +
  `<path d="M16,40 Q16,24 30,16" fill="none" stroke="${C.cloud}" stroke-width="3" stroke-linecap="round" opacity=".45"/>`

// the order ticket: cream paper with a dashed ink edge; its lines are written over it in the game
const TICKET = `<rect x="4" y="4" width="462" height="262" rx="24" fill="${C.cream}" stroke="${C.ink}" stroke-width="4" stroke-dasharray="14 10"/>`

/** The Phở pictures: the board, the pot, the dial, the bowl, a beef slice, the three toppings and the ticket. */
export function phoTextures(): Record<string, string> {
  return {
    'pho-board': svgDoc(PHO_BOX.board, 1, BOARD),
    'pho-pot': svgDoc(PHO_BOX.pot, 1, POT),
    'pho-dial': svgDoc(PHO_BOX.dial, 1, DIAL),
    'pho-bowl': svgDoc(PHO_BOX.bowl, 1, BOWL),
    'pho-beef': svgDoc([0, 0, 120, 60], 1, BEEF),
    'pho-onion': svgDoc([0, 0, 60, 60], 1, ONION),
    'pho-chili': svgDoc([0, 0, 60, 60], 1, CHILI),
    'pho-herb': svgDoc([0, 0, 60, 60], 1, HERB),
    'pho-ticket': svgDoc(PHO_BOX.ticket, 1, TICKET),
  }
}
