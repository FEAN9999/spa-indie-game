import { GROUND, HIGHLIGHT, ink } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/**
 * The basin and the board are drawn in the card's own pixels, so each is placed at its box's top left corner; the other pictures are placed by their centres.
 * Shrimp, pork and greens reuse Bánh xèo's and Bún chả's pictures.
 */
export const GC_BOX = {
  basin: [130, 840, 820, 520] as Box,
  board: [110, 820, 860, 560] as Box,
}

/** The water in the basin, where a dip is drawn across. */
export const GC_WATER = { x: 540, y: 1100, rx: 360, ry: 210 }
/** The rice paper on the board, and the band near its bottom where the fillings are laid. */
export const GC_PAPER = { x: 540, y: 1080, r: 230, bandY: 1170, bandHalf: 150 }
/** The soft paper's picture: its box, centred on the paper, and how far down it its top edge sits, for scaling it up from that edge. */
export const GC_WET_BOX: Box = [-GC_PAPER.r - 6, -GC_PAPER.r - 6, GC_PAPER.r * 2 + 12, GC_PAPER.r * 2 + 12]
export const GC_WET_TOP = 6 / GC_WET_BOX[3]

const line = (d: string, col: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
/** Một mảng nâu mờ: bóng phẳng của A+, vẫn giữ màu trong bảng màu. */
const shadow = (d: string, opacity = 0.16) => `<path d="${d}" fill="${C.ink}" opacity="${opacity}"/>`
const disc = (cx: number, cy: number, rx: number, ry = rx) => `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`

let ids = 0
/** Vẽ `body` chỉ bên trong hình `d`. */
const clip = (d: string, body: string) => {
  const id = `gc${ids++}`
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>`
}

/** Vân đan của bánh tráng: hai lớp nét chéo trong hình vuông cạnh 2r quanh tâm. */
const weave = (cx: number, cy: number, r: number, gap: number, col: string, w: number, extra = '') => {
  let d = ''
  for (let t = -2 * r; t <= 2 * r; t += gap) d += `M${cx + t - r},${cy - r} L${cx + t + r},${cy + r} M${cx + t + r},${cy - r} L${cx + t - r},${cy + r} `
  return line(d, col, w, extra)
}

// thau men nhìn từ trên: vành xanh men có ánh, lòng men trắng, đáy in bông hoa, nước trong có gợn.
// Bản A+ vẽ ở khung 600×500 với thau tâm (258, 226); ở đây phóng 1,68 lần về tâm nước, nét viết theo đơn vị khung nhỏ.
const BASIN =
  `<g transform="translate(${GC_WATER.x} ${GC_WATER.y}) scale(1.68) translate(-258 -226)">` +
  `<ellipse cx="264" cy="232" rx="236" ry="146" ${GROUND}/>` +
  `<ellipse cx="258" cy="226" rx="236" ry="148" fill="${C.cobalt}" ${ink(4.2)}/>` +
  `<ellipse cx="258" cy="226" rx="226" ry="140" fill="none" stroke="${C.cream}" stroke-width="1.6" opacity=".8"/>` +
  line('M40,190 A236,148 0 0 1 180,84', C.cloud, 3.2, 'opacity=".45"') +
  `<ellipse cx="258" cy="226" rx="218" ry="134" fill="${C.cream}" ${ink(2.4)}/>` +
  clip(
    disc(258, 226, 218, 134),
    shadow('M40,226 A218,134 0 0 1 476,226 L476,150 C400,110 120,110 40,150 Z', 0.1) +
      `<ellipse cx="262" cy="244" rx="184" ry="108" fill="${C.tile}"/>` +
      `<g transform="translate(318 260)">` +
      `<g fill="${C.lantern}" stroke="${C.lanternDark}" stroke-width="1.4"><ellipse cx="0" cy="-16" rx="13" ry="10"/><ellipse cx="16" cy="-2" rx="13" ry="10"/><ellipse cx="9" cy="16" rx="13" ry="10"/><ellipse cx="-10" cy="14" rx="13" ry="10"/><ellipse cx="-16" cy="-4" rx="13" ry="10"/></g>` +
      `<circle r="8" fill="${C.gold}" stroke="${C.mustardDark}" stroke-width="1.4"/>` +
      `<path d="M22,10 C40,6 52,16 56,26 C42,28 30,22 22,10 Z M-22,10 C-34,22 -34,34 -28,42 C-18,34 -16,22 -22,10 Z" fill="${C.leaf}" stroke="${C.teal}" stroke-width="1.4"/>` +
      `</g>` +
      `<ellipse cx="258" cy="230" rx="210" ry="126" fill="${C.water}" opacity=".55"/>` +
      line('M60,236 A204,122 0 0 1 166,124', C.waterDeep, 2.6, 'opacity=".7"') +
      line('M300,322 q24,-10 48,0 t48,0 M370,180 q20,-8 40,0 t40,0 M330,214 q16,-6 32,0 M110,280 q18,-8 36,0 t36,0', C.cloud, 2.6, 'opacity=".85"') +
      line('M150,180 q20,-8 40,0', C.waterDeep, 2.2, 'opacity=".6"'),
  ) +
  `</g>`

// bánh tráng khô: tấm tròn màu cát có vân đan, mép dày hơn, ánh và bóng
const DRY_R = 125
const DRY =
  `<path d="${disc(0, 0, DRY_R)}" fill="${C.sand}"/>` +
  clip(
    disc(0, 0, DRY_R),
    weave(0, 0, DRY_R, 18, C.tileSeam, 2.2) +
      shadow(`M${DRY_R},0 A${DRY_R},${DRY_R} 0 0 1 ${-DRY_R * 0.7},${DRY_R * 0.7} C${-DRY_R * 0.1},${DRY_R * 0.6} ${DRY_R * 0.6},${DRY_R * 0.3} ${DRY_R},0 Z`, 0.12) +
      `<path d="M-96,-50 C-80,-80 -50,-98 -20,-104 C-50,-88 -74,-70 -86,-40 Z" ${HIGHLIGHT}/>`,
  ) +
  `<circle r="${DRY_R - 9}" fill="none" stroke="${C.tileSeam}" stroke-width="5"/>` +
  `<circle r="${DRY_R}" fill="none" ${ink(4)}/>`

// bánh tráng đã nhúng: mềm, trong mờ, vân đan nhạt, ánh ướt
const R = GC_PAPER.r
const WET =
  `<path d="${disc(0, 0, R)}" fill="${C.paper}" opacity=".8"/>` +
  clip(
    disc(0, 0, R),
    weave(0, 0, R, 22, C.tileSeam, 2.2, 'opacity=".45"') +
      shadow(`M${R},0 A${R},${R} 0 0 1 ${-R * 0.7},${R * 0.7} C${-R * 0.1},${R * 0.6} ${R * 0.6},${R * 0.3} ${R},0 Z`, 0.08) +
      line(`M${-R * 0.72},${-R * 0.42} C${-R * 0.55},${-R * 0.7} ${-R * 0.28},${-R * 0.82} 0,${-R * 0.86}`, C.cloud, 10, 'opacity=".55"') +
      line(`M${-R * 0.3},${-R * 0.1} C${-R * 0.14},${-R * 0.2} ${R * 0.06},${-R * 0.24} ${R * 0.24},${-R * 0.22}`, C.cloud, 6, 'opacity=".45"'),
  ) +
  `<circle r="${R - 10}" fill="none" stroke="${C.tileSeam}" stroke-width="4" opacity=".7"/>` +
  `<circle r="${R}" fill="none" ${ink(4)} opacity=".8"/>`

// cuốn đã cuốn, dài 500 cao 110: qua lớp bánh tráng thấy bún, xà lách, rau thơm, thịt và nửa con tôm
const LOG_D = 'M-195,-55 H195 A55,55 0 0 1 195,55 H-195 A55,55 0 0 1 -195,-55 Z'
const HALF_SHRIMP =
  `<path d="M-32,10 C-35,-16 -10,-32 16,-26 C32,-21 38,-6 32,6 C22,0 6,-6 -6,0 C-16,5 -22,10 -32,10 Z" fill="${C.beachHouseCoral}" ${ink(3)}/>` +
  line('M-22,-10 C-19,-16 -13,-19 -6,-21 M-3,-22 C3,-24 10,-24 16,-22 M19,-19 C26,-16 29,-10 30,-3', C.lantern, 4.5) +
  line('M-22,5 C-13,-3 3,-10 19,-3', C.cream, 3, 'opacity=".8"')
const ROLL =
  `<ellipse cx="8" cy="58" rx="250" ry="10" ${GROUND}/>` +
  `<path d="${LOG_D}" fill="${C.cream}"/>` +
  clip(
    LOG_D,
    line('M-260,22 q20,-12 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 M-260,38 q20,-12 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0', C.tileSeam, 8) +
      line('M-260,22 q20,-12 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 M-260,38 q20,-12 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0', C.cloud, 4) +
      `<path d="M-262,12 L-262,-10 ${Array.from({ length: 21 }, () => 'q13,-18 26,-3').join(' ')} L262,12 Z" fill="${C.leafLight}" ${ink(2.5)}/>` +
      line('M-200,0 l9,-12 M-120,3 l9,-12 M-40,0 l9,-12 M40,3 l9,-12 M120,0 l9,-12 M200,3 l9,-12', C.leaf, 3) +
      `<g fill="${C.leaf}" stroke="${C.ink}" stroke-width="2">${[[-176, -36, -20], [-92, -38, 15], [-6, -36, -10], [84, -38, 25], [172, -36, -15]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="7" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>` +
      `<g fill="${C.houseRose}" stroke="${C.ink}" stroke-width="2"><rect x="-108" y="-22" width="34" height="11" rx="5"/><rect x="74" y="-22" width="34" height="11" rx="5"/></g>` +
      [-150, -50, 50, 150].map(x => `<g transform="translate(${x} -6)">${HALF_SHRIMP}</g>`).join('') +
      `<rect x="-260" y="-60" width="520" height="120" fill="${C.paper}" opacity=".28"/>` +
      weave(0, 0, 260, 24, C.tileSeam, 2, 'opacity=".35"') +
      shadow('M-260,26 C-90,44 90,44 260,26 L260,62 L-260,62 Z', 0.12) +
      line('M-170,-40 C-60,-50 60,-50 170,-40', C.cloud, 9, 'opacity=".6"') +
      line('M-120,-24 C-60,-29 0,-29 40,-26', C.cloud, 4, 'opacity=".5"'),
  ) +
  `<path d="${LOG_D}" fill="none" ${ink(5)}/>` +
  line('M-205,-50 C-216,-26 -216,26 -205,50 M205,-50 C216,-26 216,26 205,50', C.tileSeam, 3)

// thớt gỗ tròn có độ dày, vân gỗ, mắt gỗ; một tàu lá chuối lót dưới chỗ cuốn
const LEAF_D = 'M-132,0 C-92,-46 60,-54 132,-6 C72,40 -80,48 -132,0 Z'
const BOARD =
  `<ellipse cx="552" cy="1124" rx="420" ry="262" ${GROUND}/>` +
  `<ellipse cx="540" cy="1118" rx="420" ry="268" fill="${C.woodLight}" ${ink(6)}/>` +
  `<ellipse cx="540" cy="1100" rx="420" ry="268" fill="${C.plank}" ${ink(6)}/>` +
  clip(
    disc(540, 1100, 420, 268),
    line('M200,980 q90,-24 180,0 t160,-6 M660,1250 q90,-20 190,0 M280,1270 q70,-16 140,0 M160,1110 q40,-30 90,-20 M760,930 q70,-10 140,14', C.plankLine, 5) +
      shadow('M880,1000 C980,1100 920,1300 700,1360 L960,1380 L960,960 Z', 0.12) +
      line('M180,1040 A400,250 0 0 1 380,860', C.cloud, 8, 'opacity=".35"'),
  ) +
  `<ellipse cx="840" cy="1180" rx="26" ry="11" fill="none" stroke="${C.plankLine}" stroke-width="4"/>` +
  `<ellipse cx="840" cy="1180" rx="10" ry="4" fill="${C.plankLine}"/>` +
  `<g transform="translate(560 1130) rotate(-10) scale(2.5)">` +
  `<ellipse cx="4" cy="6" rx="128" ry="34" ${GROUND}/>` +
  `<path d="${LEAF_D}" fill="${C.leaf}"/>` +
  clip(LEAF_D, shadow('M-132,0 C-80,48 72,40 132,-6 C60,22 -60,26 -132,0 Z', 0.14)) +
  line('M-110,-14 l14,12 M-80,-26 l18,22 M-46,-34 l20,30 M-10,-38 l20,34 M26,-38 l18,32 M62,-32 l16,26 M96,-22 l12,16 M-100,14 l16,-12 M-66,24 l18,-22 M-30,28 l20,-26 M8,28 l20,-26 M46,24 l18,-22 M82,14 l14,-14', C.leafLight, 1.2, 'opacity=".8"') +
  line('M-128,0 C-40,-6 60,-8 128,-6', C.leafLight, 2.4) +
  `<path d="${LEAF_D}" fill="none" ${ink(2.2)}/>` +
  line('M40,30 l4,-10 M-60,34 l3,-9', C.ink, 1.4) +
  `</g>`

// bún: một ổ bún trắng có sợi, bóng và ánh
const NEST = disc(30, 34, 25, 18)
const NOODLE = 'M2,24 q6,-6 12,0 t12,0 t12,0 t12,0 t12,0 M2,32 q6,-6 12,0 t12,0 t12,0 t12,0 t12,0 M2,40 q6,-6 12,0 t12,0 t12,0 t12,0 t12,0 M2,48 q6,-6 12,0 t12,0 t12,0 t12,0'
const BUN =
  `<ellipse cx="32" cy="50" rx="24" ry="5" ${GROUND}/>` +
  `<path d="${NEST}" fill="${C.cloud}"/>` +
  clip(NEST, line(NOODLE, C.tileSeam, 3) + line(NOODLE, C.cloud, 1.2) + shadow('M5,38 C16,52 44,52 55,36 L56,56 L4,56 Z', 0.12)) +
  `<path d="${NEST}" fill="none" ${ink(3)}/>` +
  line('M14,24 C18,20 24,18 30,18', C.cloud, 3, 'opacity=".9"')

/** The Gỏi cuốn pictures: the basin, the dry and the soft rice paper, the roll, the board and the noodles. */
export function goiCuonTextures(): Record<string, string> {
  return {
    'gc-basin': svgDoc(GC_BOX.basin, 1, BASIN),
    'gc-paper-dry': svgDoc([-DRY_R - 6, -DRY_R - 6, DRY_R * 2 + 12, DRY_R * 2 + 12], 1, DRY),
    'gc-paper-wet': svgDoc(GC_WET_BOX, 1, WET),
    'gc-roll': svgDoc([-262, -72, 524, 144], 1, ROLL),
    'gc-board': svgDoc(GC_BOX.board, 1, BOARD),
    'gc-bun': svgDoc([0, 0, 60, 60], 1, BUN),
  }
}
