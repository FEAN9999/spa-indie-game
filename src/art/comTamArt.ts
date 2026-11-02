import { GROUND, HIGHLIGHT, ink } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/**
 * The plate is drawn in the card's own pixels, placed at its box's top left corner; the chop, the sides and the fan are pictures placed by their centres.
 * The heat needle and the oil spots are drawn in the game; the stove and the dial are Bún chả's and Phở's.
 */
export const CT_BOX = { plate: [150, 860, 760, 520] as Box }
/** The rice on the plate, where the chop and the sides are laid. */
export const CT_RICE = { x: 520, y: 1110, rx: 250, ry: 150 }
/** Hộp của miếng sườn trên vỉ, tâm ở giữa: thân trong elip 175 × 85, xương chìa sang phải. */
const GRILL_CHOP_BOX: Box = [-240, -105, 480, 210]

// Mọi màu ở đây lấy từ bảng màu; mảng bóng là nâu viền phủ mờ, điểm sáng là trắng phủ mờ.
const line = (d: string, col: string, w: number, extra = '') => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${extra}/>`
const dim = (op: number) => `fill="${C.ink}" opacity="${op}"`
/** Vẽ `body` chỉ trong hình `d`. */
const inside = (id: string, d: string, body: string) => `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>`

/** Mép gồ ghề của một đống quanh elip (cx, cy, rx, ry), nối mềm bằng đường cong bậc hai. */
function heap(cx: number, cy: number, rx: number, ry: number, n: number): string {
  const pts = Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n
    const r = 1 + 0.03 * Math.sin(9 * t) + 0.018 * Math.sin(17 * t + 1)
    return [cx + rx * r * Math.cos(t), cy + ry * r * Math.sin(t)]
  })
  const mid = (a: number[], b: number[]) => `${Math.round((a[0] + b[0]) / 2)},${Math.round((a[1] + b[1]) / 2)}`
  return `M${mid(pts[n - 1], pts[0])} ` + pts.map((p, i) => `Q${Math.round(p[0])},${Math.round(p[1])} ${mid(p, pts[(i + 1) % n])}`).join(' ') + ' Z'
}

// đĩa men: có độ dày, viền men xanh, lòng đĩa; cơm tấm chất thành đống có hạt, mảng bóng; hai lát dưa leo bên trái
const RICE = heap(CT_RICE.x, CT_RICE.y, CT_RICE.rx, CT_RICE.ry, 36)
const GRAINS: [number, number, number][] = []
for (let j = -4; j <= 4; j++)
  for (let i = -7; i <= 7; i++) {
    const x = CT_RICE.x + i * 31 + (j % 2 ? 15 : 0)
    const y = CT_RICE.y + j * 30
    if (((x - CT_RICE.x) / (CT_RICE.rx * 0.86)) ** 2 + ((y - CT_RICE.y) / (CT_RICE.ry * 0.84)) ** 2 < 1) GRAINS.push([x, y, (i * 37 + j * 53 + 360) % 180])
  }
const CUCUMBER = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="34" fill="${C.cucumber}" stroke="${C.leaf}" stroke-width="7"/><circle cx="${x}" cy="${y}" r="34" fill="none" ${ink(4)}/>` +
  [0, 72, 144, 216, 288].map(a => `<ellipse cx="${x + 13 * Math.cos((a * Math.PI) / 180)}" cy="${y + 13 * Math.sin((a * Math.PI) / 180)}" rx="4" ry="2.4" fill="${C.cream}" transform="rotate(${a} ${x + 13 * Math.cos((a * Math.PI) / 180)} ${y + 13 * Math.sin((a * Math.PI) / 180)})"/>`).join('')
const PLATE =
  `<ellipse cx="532" cy="1356" rx="330" ry="16" ${GROUND}/>` +
  `<ellipse cx="520" cy="1130" rx="368" ry="236" fill="${C.cream}" ${ink(7)}/>` +
  `<ellipse cx="520" cy="1116" rx="368" ry="236" fill="${C.cream}" ${ink(7)}/>` +
  inside('ct-plate', 'M152,1116 a368,236 0 1,0 736,0 a368,236 0 1,0 -736,0 Z', `<path d="M890,1000 C900,1230 700,1370 300,1350 L900,1400 Z" ${dim(0.1)}/>`) +
  `<ellipse cx="520" cy="1116" rx="330" ry="210" fill="none" stroke="${C.cobalt}" stroke-width="10"/>` +
  `<ellipse cx="520" cy="1116" rx="300" ry="188" fill="none" stroke="${C.tileSeam}" stroke-width="3"/>` +
  `<path d="M226,1040 C270,960 380,914 470,904" fill="none" stroke="${C.cloud}" stroke-width="10" stroke-linecap="round" opacity=".8"/>` +
  CUCUMBER(232, 1150) +
  CUCUMBER(262, 1214) +
  `<path d="${RICE}" fill="${C.paper}"/>` +
  inside(
    'ct-rice',
    RICE,
    `<path d="M240,1200 C380,1290 640,1290 790,1150 L800,1300 L240,1300 Z" ${dim(0.1)}/>` +
      GRAINS.map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="5" fill="${C.cloud}" stroke="${C.tileSeam}" stroke-width="2" transform="rotate(${a} ${x} ${y})"/>`).join('') +
      `<path d="M330,1040 C380,1000 440,984 500,980 C450,996 392,1018 346,1058 Z" ${HIGHLIGHT}/>`,
  ) +
  `<path d="${RICE}" fill="none" ${ink(5)}/>`

// sườn: miếng sườn nướng cánh gián lật xương sang phải, viền mỡ cháy cạnh, vết vỉ, nước ướp bóng; vẽ ở nửa cỡ rồi phóng đôi
const SUON_BODY = 'M113,29 C104,13 65,9 38,14 C14,19 3,35 11,51 C18,67 47,73 74,70 C98,68 119,59 121,45 C122,39 118,33 113,29 Z'
const SUON =
  `<path d="M118,41 C129,37 138,39 141,44 C142,49 137,53 131,50 C126,49 123,49 118,50 Z" fill="${C.sand}" ${ink(3.5)}/>` +
  line('M137,44 C135,43 131,43 129,44', C.tileSeam, 1.5) +
  `<path d="${SUON_BODY}" fill="${C.woodLight}"/>` +
  inside(
    'ct-suon',
    SUON_BODY,
    `<path d="M129,59 C89,73 35,67 -1,43 L-1,86 L129,86 Z" fill="${C.wood}"/>` +
      `<path d="M119,32 C104,15 65,11 38,17 C17,21 6,33 9,44 C14,31 26,24 38,23 C65,18 98,21 116,36 Z" fill="${C.weave}"/>` +
      [[52, 16], [86, 17], [26, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${C.woodDark}"/>`).join('') +
      line('M110,75 L77,7 M90,78 L56,10 M69,79 L35,11 M49,77 L15,13 M28,73 L-1,18', C.woodDark, 5, ' opacity=".8"') +
      line('M102,39 C95,35 87,34 80,35 M61,31 C56,30 50,30 45,32 M34,36 C29,37 25,41 23,44', C.cloud, 3, ' opacity=".5"'),
  ) +
  `<path d="${SUON_BODY}" fill="none" ${ink(4)}/>`

// bì: đống bì sợi nhạt trộn thính, có bóng dưới
const BI =
  `<ellipse cx="31" cy="48" rx="22" ry="5" ${GROUND}/>` +
  `<path d="M8,42 C8,30 18,22 30,22 C44,22 54,30 54,42 C54,48 44,50 30,50 C16,50 8,48 8,42 Z" fill="${C.mat}" ${ink(3.5)}/>` +
  `<path d="M38,48 C48,46 54,44 54,40 C54,46 48,50 30,50 Z" ${dim(0.14)}/>` +
  line('M13,40 q6,-9 12,-2 M20,34 q7,-8 13,0 M30,30 q6,-6 12,2 M36,40 q6,-8 12,-1 M16,46 q8,-6 14,0 M30,44 q6,-7 12,0', C.cloud, 2.5) +
  line('M18,38 q5,-6 10,0 M34,36 q5,-5 9,1', C.weaveLine, 1.6) +
  [[20, 44], [28, 37], [40, 34], [46, 44], [24, 30], [36, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${C.clayLight}"/>`).join('')

// chả: lát chả trứng, lớp lòng đỏ trên mặt, thân hồng lấm tấm, mặt cắt bên phải có bóng
const CHA =
  `<ellipse cx="31" cy="50" rx="22" ry="4" ${GROUND}/>` +
  `<path d="M8,24 L44,18 L54,24 L54,46 L18,52 L8,46 Z" fill="${C.houseRose}" ${ink(3.5)}/>` +
  `<path d="M44,18 L54,24 L54,46 L44,40 Z" ${dim(0.14)}/>` +
  `<path d="M8,24 L44,18 L54,24 L18,30 Z" fill="${C.gold}" ${ink(3)}/>` +
  line('M18,30 L18,52 M44,18 L44,40', C.ink, 2) +
  [[24, 38], [32, 44], [38, 34], [28, 46], [48, 32], [12, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${C.houseRoseDark}"/>`).join('') +
  `<path d="M12,25 L30,22" stroke="${C.cloud}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`

// trứng: trứng ốp la, lòng trắng gợn mép, viền giòn vàng, lòng đỏ có mảng bóng và điểm sáng
const EGG = 'M8,32 Q4,16 22,12 Q30,6 40,12 Q56,14 54,30 Q58,44 42,48 Q30,56 18,48 Q4,46 8,32 Z'
const TRUNG =
  `<path d="${EGG}" fill="${C.cloud}"/>` +
  inside('ct-trung', EGG, `<path d="${EGG}" fill="none" stroke="${C.mustard}" stroke-width="7" opacity=".55"/>`) +
  `<path d="${EGG}" fill="none" ${ink(3.5)}/>` +
  `<circle cx="30" cy="30" r="11" fill="${C.mustard}" ${ink(3)}/>` +
  `<path d="M40,28 A11,11 0 0 1 24,40 A13,13 0 0 0 40,28 Z" fill="${C.mustardDark}"/>` +
  `<circle cx="26" cy="26" r="3.2" ${HIGHLIGHT}/>`

// đồ chua: cà rốt và củ cải thái que xếp thành đống nhỏ, có bóng
const CHUA =
  `<ellipse cx="30" cy="50" rx="22" ry="4" ${GROUND}/>` +
  ([
    [10, 46, 30, 22, C.cream],
    [14, 48, 36, 26, C.stoneHot],
    [22, 48, 44, 22, C.cream],
    [28, 48, 50, 28, C.stoneHot],
    [18, 40, 46, 36, C.cream],
    [12, 36, 38, 44, C.stoneHot],
  ] as const)
    .map(([x1, y1, x2, y2, c]) => line(`M${x1},${y1} L${x2},${y2}`, C.ink, 8) + line(`M${x1},${y1} L${x2},${y2}`, c, 4.5) + line(`M${x1},${y1} L${(x1 + x2) / 2},${(y1 + y2) / 2}`, C.cloud, 1.5, ' opacity=".6"'))
    .join('')

// quạt nan: mặt quạt tre đan chéo, viền nẹp, mảng bóng, cán gỗ có bóng
const FACE = 'M16,62 a54,54 0 1,0 108,0 a54,54 0 1,0 -108,0 Z'
const FAN =
  `<rect x="63" y="98" width="15" height="40" rx="6" fill="${C.woodDark}" ${ink(3.5)}/>` +
  `<path d="M72,100 V134" stroke="${C.wood}" stroke-width="4" stroke-linecap="round"/>` +
  `<path d="${FACE}" fill="${C.bamboo}"/>` +
  inside(
    'ct-fan',
    FACE,
    Array.from({ length: 12 }, (_, i) => -40 + i * 16)
      .map(o => line(`M${o},0 L${o + 140},140`, C.bambooDark, 2.5) + line(`M${o + 140},0 L${o},140`, C.bambooLight, 2.5))
      .join('') + `<path d="M124,40 C132,90 100,124 50,118 L140,140 L140,30 Z" ${dim(0.14)}/>` + `<path d="M34,40 Q44,22 64,18" fill="none" stroke="${C.cloud}" stroke-width="5" stroke-linecap="round" opacity=".55"/>`,
  ) +
  `<path d="${FACE}" fill="none" stroke="${C.ink}" stroke-width="10"/>` +
  `<path d="${FACE}" fill="none" stroke="${C.clay}" stroke-width="5"/>`

// miếng sườn trên vỉ, chia ba lớp: phần thịt vẽ trắng để tô từ hồng sống sang cánh gián rồi cháy,
// vết vỉ hiện dần khi chín, và lớp nét không tô (viền, xương, điểm sáng)
const CHOP = 'M152,-30 C124,-75 3,-86 -80,-71 C-155,-58 -187,-15 -164,30 C-141,75 -52,89 31,82 C105,76 170,52 175,15 C178,-4 166,-19 152,-30 Z'
const FAT = 'M170,-22 C124,-69 3,-79 -80,-64 C-145,-52 -177,-18 -169,12 C-155,-25 -117,-43 -80,-48 C3,-60 105,-52 161,-12 Z'
const GRILL_CHOP =
  `<path d="${CHOP}" fill="${C.cloud}"/>` +
  inside('ct-grill-chop', CHOP, `<path d="${CHOP}" ${dim(0.07)}/><path d="${FAT}" fill="${C.cloud}"/><path d="M198,52 C78,89 -90,75 -201,7 L-201,127 L198,127 Z" ${dim(0.16)}/>`)
const GRILL_MARKS = inside('ct-grill-marks', CHOP, line('M143,97 L39,-89 M79,104 L-25,-82 M16,106 L-88,-81 M-47,101 L-151,-75 M-110,89 L-201,-60', C.deepBrown, 20, ' opacity=".7"'))
const GRILL_LINE =
  `<path d="M167,1 C200,-7 228,-3 235,10 C241,24 224,34 206,28 C191,24 180,24 167,28 Z" fill="${C.sand}" ${ink(5)}/>` +
  line('M224,12 C217,7 206,7 198,12', C.tileSeam, 3) +
  `<path d="${CHOP}" fill="none" ${ink(6)}/>` +
  line('M117,-3 C96,-13 72,-16 48,-15 M-8,-25 C-25,-28 -43,-27 -58,-22 M-93,-12 C-108,-7 -119,1 -125,12', C.cloud, 7, ' opacity=".45"')

/** The Cơm tấm pictures: the plate, the cooked chop, the four sides, the fan, and the chop on the grill in its three layers. */
export function comTamTextures(): Record<string, string> {
  return {
    'ct-plate': svgDoc(CT_BOX.plate, 1, PLATE),
    'ct-suon': svgDoc([0, 0, 300, 160], 1, `<g transform="scale(2)">${SUON}</g>`),
    'ct-bi': svgDoc([0, 0, 60, 60], 1, BI),
    'ct-cha': svgDoc([0, 0, 60, 60], 1, CHA),
    'ct-trung': svgDoc([0, 0, 60, 60], 1, TRUNG),
    'ct-chua': svgDoc([0, 0, 60, 60], 1, CHUA),
    'ct-fan': svgDoc([0, 0, 140, 140], 1, FAN),
    'ct-grill-chop': svgDoc(GRILL_CHOP_BOX, 1, GRILL_CHOP),
    'ct-grill-chop-marks': svgDoc(GRILL_CHOP_BOX, 1, GRILL_MARKS),
    'ct-grill-chop-line': svgDoc(GRILL_CHOP_BOX, 1, GRILL_LINE),
  }
}
