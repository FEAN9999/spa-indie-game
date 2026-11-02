import { BX_PAN } from '../config'
import { GROUND, HIGHLIGHT, ink } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** The pan is drawn in the card's own pixels, centred on BX_PAN, with its handle running down to the left; it is placed at its box's top left corner. */
export const BX_PAN_BOX: Box = [60, 790, 720, 680]
/** The pan's rim and its floor, and the batter's radius on the floor. */
export const BX_PAN_R = { rim: 300, floor: 268, batter: 255 }
/** The batter pictures are centred on BX_PAN, a little wider than the batter for its lacy edge. */
export const BX_BATTER_BOX: Box = [BX_PAN.x - 264, BX_PAN.y - 264, 528, 528]

// Bản A+ được vẽ ở khung 600×500 với chảo tâm (330, 240), vành 200; ở đây phóng 1,5 lần về tâm BX_PAN,
// nên độ dày nét viết theo đơn vị khung nhỏ (nhân 1,5 ra điểm ảnh trên thẻ).
const K = BX_PAN_R.rim / 200
const PLACE = `translate(${BX_PAN.x} ${BX_PAN.y}) scale(${K}) translate(-330 -240)`

let ids = 0
/** Vẽ `body` chỉ bên trong hình `d`. */
const clip = (d: string, body: string) => {
  const id = `bx${ids++}`
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>`
}
const line = (d: string, col: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`

// mép bột tráng: một vòng lượn nhẹ quanh tâm chảo, giòn và không tròn đều, nối bằng đường cong mềm
const BATTER_EDGE = (() => {
  const n = 48
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const r = 166 + 3.5 * Math.sin(a * 7) + 2.5 * Math.sin(a * 11 + 1) + 1.2 * Math.cos(a * 17)
    return [330 + Math.cos(a) * r, 240 + Math.sin(a) * r]
  })
  const at = (i: number) => pts[(i + n) % n]
  const f = (v: number) => v.toFixed(1)
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`
  }
  return d + ' Z'
})()

// lỗ ren cháy dọc mép bột
const LACE = [
  [178, 276, 3, 3.4], [490, 246, 5.2, 2.1], [180, 187, 2.6, 2.6], [284, 88, 4.7, 2.3], [342, 395, 4, 3.5], [455, 333, 4.5, 3.2], [194, 313, 3.3, 2.3],
  [300, 389, 3.1, 3.4], [446, 130, 3.6, 2.8], [205, 153, 4.2, 3.4], [378, 397, 2.8, 2.9], [476, 292, 4.3, 2.2], [313, 389, 5.5, 2.2], [353, 90, 3.5, 3.4],
  [189, 169, 4.9, 2.5], [461, 322, 2.8, 3.3], [486, 265, 4.9, 2.8], [430, 118, 4.5, 2.3], [236, 104, 4, 2.6], [216, 360, 4.2, 2.5], [404, 388, 3.6, 2.4],
  [173, 228, 4, 2.6], [482, 196, 3.6, 2.6],
]
  .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${Math.round((Math.atan2(y - 240, x - 330) * 180) / Math.PI + 90)} ${x} ${y})"/>`)
  .join('')

// chảo gang: bóng sàn, cổ thép đinh tán, tay cầm gỗ có lỗ treo, vành dày có mảng bóng, lòng chảo đen có ánh dầu
const PAN =
  `<g transform="${PLACE}">` +
  `<ellipse cx="344" cy="256" rx="204" ry="200" ${GROUND}/>` +
  `<path d="M211,389 L128,472" stroke="${C.ink}" stroke-width="30" stroke-linecap="round" opacity=".18"/>` +
  `<g transform="translate(197.1 372.9) rotate(135)">` +
  `<rect x="-6" y="-9" width="66" height="18" rx="5" fill="${C.stoneLight}" ${ink(4)}/>` +
  `<rect x="-4" y="-7" width="62" height="5" fill="${C.stone}" opacity=".55"/>` +
  line('M2,5 H54', C.silver, 2.5) +
  `<circle cx="18" cy="0" r="4.5" fill="${C.silver}" ${ink(1.8)}/><circle cx="40" cy="0" r="4.5" fill="${C.silver}" ${ink(1.8)}/>` +
  `<rect x="52" y="-16" width="80" height="32" rx="15" fill="${C.wood}"/>` +
  `<path d="M52,-16 H117 A15,15 0 0 1 132,-1 V-6 H52 Z" fill="${C.woodDark}"/>` +
  line('M60,9 H122', C.woodLight, 4) +
  line('M68,-1 q12,-3 24,0 t22,0', C.woodDark, 2) +
  `<rect x="52" y="-16" width="80" height="32" rx="15" fill="none" ${ink(4.7)}/>` +
  `<circle cx="118" cy="0" r="5.5" fill="${C.deepBrown}" ${ink(2)}/>` +
  `</g>` +
  `<circle cx="330" cy="240" r="200" fill="${C.stone}" ${ink(5)}/>` +
  `<path d="M156.8,340.0 A200,200 0 0 1 430.0,66.8 L419.5,85.0 A179,179 0 0 0 175.0,329.5 Z" fill="${C.ink}" opacity=".2"/>` +
  line('M152,190 A190,190 0 0 1 250,66', C.cloud, 4, 'opacity=".35"') +
  line('M494,300 A178,178 0 0 1 430,388', C.stoneLight, 3, 'opacity=".7"') +
  `<circle cx="330" cy="240" r="179" fill="${C.deepBrown}" ${ink(2.8)}/>` +
  line('M486,300 A170,170 0 0 1 420,385', C.cloud, 7, 'opacity=".18"') +
  line('M204,150 A160,160 0 0 1 270,96', C.cloud, 5, 'opacity=".14"') +
  `</g>`

// bột tráng, phần để tô màu theo độ chín: nền trắng, mép giòn xám đậm hơn, lỗ ren sẫm, đốm bột
const BATTER =
  `<g transform="${PLACE}">` +
  `<path d="${BATTER_EDGE}" fill="${C.marbleSeam}"/>` +
  clip(
    BATTER_EDGE,
    `<ellipse cx="322" cy="232" rx="156" ry="154" fill="${C.cloud}"/>` +
      line(BATTER_EDGE, C.benchStoneDark, 26) +
      line(BATTER_EDGE, C.stoneLight, 8, 'stroke-dasharray="10 6 4 8" opacity=".75"') +
      `<g fill="${C.stone}">${LACE}</g>` +
      `<g fill="${C.marbleVein}"><circle cx="250" cy="200" r="3"/><circle cx="276" cy="168" r="2.2"/><circle cx="232" cy="262" r="2.6"/><circle cx="270" cy="318" r="2.4"/><circle cx="300" cy="142" r="2.4"/><circle cx="214" cy="226" r="2"/><circle cx="296" cy="352" r="2.6"/><circle cx="380" cy="300" r="2.4"/><circle cx="410" cy="210" r="2.2"/></g>`,
  ) +
  `</g>`

// nét viền bột và vệt sáng, không tô màu
const BATTER_LINE =
  `<g transform="${PLACE}">` +
  clip(BATTER_EDGE, line('M214,170 C232,146 258,128 288,118', C.cloud, 7, 'opacity=".45"') + line('M196,236 C196,216 202,200 210,188', C.cloud, 4, 'opacity=".35"')) +
  `<path d="${BATTER_EDGE}" fill="none" ${ink(3.5)}/>` +
  `</g>`

// tôm: thân cong chữ C hai lớp, đốt vỏ, đuôi xòe, đầu có mắt và râu
const TOM =
  `<g transform="translate(27 27) scale(.72)">` +
  line('M18,-14 C2,-25 -21,-17 -23,1 C-24,16 -11,25 2,22', C.ink, 18) +
  line('M18,-14 C2,-25 -21,-17 -23,1 C-24,16 -11,25 2,22', C.beachHouseCoral, 11) +
  line('M12,-12 C2,-17 -12,-12 -15,1 C-16,10 -9,16 0,16', C.beachHouseCoralDark, 4) +
  line('M-3,-21 l2,9 M-13,-15 l6,7 M-20,-4 l9,2 M-18,10 l8,-4 M-8,19 l3,-8', C.phoTileDark, 2.2) +
  line('M6,-21 C-2,-23 -11,-21 -16,-15', C.cloud, 2.6, 'opacity=".55"') +
  `<path d="M1,19 C7,20 13,18 18,22 C17,29 11,32 7,29 C5,34 -1,35 -4,31 C-3,26 -1,22 1,19 Z" fill="${C.beachHouseCoralDark}" ${ink(2.5)}/>` +
  line('M3,22 L10,27 M2,23 L1,30', C.phoTileDark, 1.6) +
  `<ellipse cx="20" cy="-12" rx="8.5" ry="7" fill="${C.beachHouseCoral}" ${ink(3)}/>` +
  `<circle cx="22.5" cy="-14" r="2.1" fill="${C.deepBrown}"/>` +
  line('M27,-16 q10,-7 18,-3 M26,-12 q12,-2 17,4', C.ink, 1.6) +
  `</g>`

// thịt ba chỉ: bì, lớp mỡ, nạc, vết áp chảo
const THIT_D = 'M-36,-14 C-20,-18 20,-18 36,-12 C38,0 37,10 34,14 C14,18 -18,18 -34,14 C-38,4 -38,-6 -36,-14 Z'
const THIT =
  `<g transform="translate(30 31) scale(.78)">` +
  `<path d="${THIT_D}" fill="${C.restHouseClay}"/>` +
  `<path d="M-34,14 C-18,18 14,18 34,14 L35,7 C14,11 -18,11 -35,7 Z" fill="${C.restHouseClayDark}"/>` +
  `<path d="M-36,-14 C-20,-18 20,-18 36,-12 L35,-4 C18,-9 -18,-9 -35,-5 Z" fill="${C.cream}"/>` +
  line('M-30,4 C-10,0 10,2 30,3', C.cream, 3) +
  line('M-20,9 l8,-3 M8,10 l10,-2', C.wood, 3, 'opacity=".6"') +
  `<ellipse cx="-14" cy="-1" rx="9" ry="2.5" ${HIGHLIGHT}/>` +
  `<path d="${THIT_D}" fill="none" ${ink(3.5)}/>` +
  line('M-35,-15 C-20,-19 20,-19 35,-13', C.gachTauFace, 3) +
  `</g>`

// giá: ba cọng thân trắng viền nâu, đầu vàng nhạt, rễ mảnh
const SPROUT =
  line('M0,0 C-6,-14 -2,-28 8,-36', C.ink, 7.5) +
  line('M0,0 C-6,-14 -2,-28 8,-36', C.cream, 4) +
  line('M0,0 C2,5 1,9 4,13', C.clayLight, 1.6) +
  `<ellipse cx="9.5" cy="-38" rx="5.5" ry="4.2" fill="${C.bambooLight}" ${ink(2)} transform="rotate(-30 9.5 -38)"/>`
const GIA = [[16, 50, -14], [30, 52, 4], [43, 49, 22]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(.92)">${SPROUT}</g>`).join('')

/** The Bánh xèo pictures: the pan, the batter (tinted as it browns, with its untinted line), and the three fillings. The fold dial is Phở's. */
export function banhXeoTextures(): Record<string, string> {
  return {
    'bx-pan': svgDoc(BX_PAN_BOX, 1, PAN),
    'bx-batter': svgDoc(BX_BATTER_BOX, 1, BATTER),
    'bx-batter-line': svgDoc(BX_BATTER_BOX, 1, BATTER_LINE),
    'bx-tom': svgDoc([0, 0, 60, 60], 1, TOM),
    'bx-thit': svgDoc([0, 0, 60, 60], 1, THIT),
    'bx-gia': svgDoc([0, 0, 60, 60], 1, GIA),
  }
}
