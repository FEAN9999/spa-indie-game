import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** The back's half-width in canvas pixels: the rules' [−1, 1]² spans this far either side of the back centre, at (0, 0) in every texture here. */
export const MS_BACK_PX = 360
/** A point's glow radius, where a tap ring closes. */
export const MS_POINT_R = 60
/** The ring art's radius: its size as a tap point shows. */
export const MS_RING_R = 150

const BED_BOX: Box = [-440, -632, 880, 1142]
const BACK_BOX: Box = [-400, -540, 800, 1030]
const HAIR_BOX: Box = [-140, -640, 280, 270]

/** The image origin that puts the back centre of a texture drawn in `box` on the image's position. */
const centre = ([x, y, w, h]: Box) => ({ x: -x / w, y: -y / h })

/** Origins for drawing each customer texture at the back centre. */
export const MS_ORIGIN = { bed: centre(BED_BOX), back: centre(BACK_BOX), hair: centre(HAIR_BOX) }

// Nét A+: viền ngoài, nét trong, nét chi tiết
const OUT = 8
const IN = 5
const DET = 3.5
const POINT_BOX: Box = [-66, -66, 132, 132]
const GLOW = `<circle cx="0" cy="0" r="${MS_POINT_R}" fill="${C.glow}" opacity=".8"/>`
/** Phần trắng để tô màu da, tóc: nét chi tiết là màu xám ấm, tô lên thành màu da sẫm hơn. */
const WHITE = '#ffffff'
const SKIN_LINE = shade(WHITE, 0.3)
const skinLine = (w: number) => `stroke="${SKIN_LINE}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"`
const lineOnly = (w: number) => `fill="none" ${ink(w)}`

/** Hoa sen thêu: cánh giữa từ đỉnh (x, y) xuống, hai cánh bên, cỡ `s`. */
const lotus = (x: number, y: number, s: number) =>
  `<path d="M${x},${y} c${-7 * s},${9 * s} ${-7 * s},${18 * s} 0,${23 * s} c${7 * s},${-5 * s} ${7 * s},${-14 * s} 0,${-23 * s}Z" fill="${C.lotus}" ${ink(3)}/>` +
  `<path d="M${x - 2 * s},${y + 23 * s} c${-10 * s},${-3 * s} ${-14 * s},${-11 * s} ${-12 * s},${-17 * s} c${7 * s},${2 * s} ${12 * s},${8 * s} ${12 * s},${17 * s}Z` +
  `M${x + 2 * s},${y + 23 * s} c${10 * s},${-3 * s} ${14 * s},${-11 * s} ${12 * s},${-17 * s} c${-7 * s},${2 * s} ${-12 * s},${8 * s} ${-12 * s},${17 * s}Z" fill="${C.lotusDark}" ${ink(3)}/>`

// Giường massage nhìn từ trên: bóng sàn, mép gỗ dày, khung gỗ có vân và mảng bóng phải, ga kem viền xanh ngọc thêu sen, gối úp mặt có đường chỉ
const FRAME = 'x="-430" y="-540" width="860" height="1030" rx="56"'
const SHEET = 'x="-404" y="-514" width="808" height="978" rx="40"'
const bed =
  `<clipPath id="frame"><rect ${FRAME}/></clipPath><clipPath id="sheet"><rect ${SHEET}/></clipPath>` +
  `<clipPath id="cradle"><ellipse cx="0" cy="-482" rx="205" ry="147"/></clipPath>` +
  `<rect x="-410" y="-524" width="850" height="1028" rx="56" ${GROUND}/>` +
  `<rect x="-430" y="-528" width="860" height="1030" rx="56" fill="${C.woodDark}" ${ink(OUT)}/>` +
  `<rect ${FRAME} fill="${C.wood}"/>` +
  `<rect x="384" y="-540" width="48" height="1030" fill="${shade(C.wood)}" clip-path="url(#frame)"/>` +
  `<path d="M-364,-527 H-96 M0,-527 H354 M-329,477 H76 M157,477 H364 M-417,-370 V-125 M-417,84 V218 M417,-272 V-27" stroke="${C.woodLight}" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="M-396,-531 H-40" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".45"/>` +
  `<rect ${FRAME} ${lineOnly(OUT)}/>` +
  `<rect ${SHEET} fill="${C.cream}"/>` +
  `<rect x="356" y="-514" width="50" height="978" fill="${shade(C.cream)}" clip-path="url(#sheet)"/>` +
  `<rect x="-382" y="-492" width="764" height="934" rx="28" fill="none" stroke="${C.tealLight}" stroke-width="6"/>` +
  `<rect ${SHEET} ${lineOnly(IN)}/>` +
  lotus(-336, -476, 2.4) +
  lotus(336, -476, 2.4) +
  `<ellipse cx="0" cy="-482" rx="205" ry="147" fill="${shade(C.sand)}"/>` +
  `<ellipse cx="-24" cy="-500" rx="205" ry="147" fill="${C.sand}" clip-path="url(#cradle)"/>` +
  `<ellipse cx="0" cy="-482" rx="176" ry="120" fill="none" stroke="${C.matLine}" stroke-width="5" stroke-dasharray="18 15"/>` +
  `<ellipse cx="0" cy="-482" rx="205" ry="147" ${lineOnly(6)}/>`

// Lưng khách nằm sấp, tô màu da: tai hai bên đầu, hai tay xuôi theo người, vai tròn, eo thon, mảng bóng mép phải,
// rãnh sống lưng, bả vai, cơ thang, hai lõm hông
const ARM_L =
  'M-264,-247.5 C-330,-242 -374,-198 -379.5,-132 C-385,-38.5 -385,71.5 -379.5,165 C-374,236.5 -385,308 -385,363 C-385,423.5 -363,467.5 -324.5,467.5 ' +
  'C-286,467.5 -269.5,429 -275,379.5 C-280.5,324.5 -275,258.5 -275,192.5 C-275,93.5 -275,-11 -269.5,-93.5 Z'
const ARM_R =
  'M264,-247.5 C330,-242 374,-198 379.5,-132 C385,-38.5 385,71.5 379.5,165 C374,236.5 385,308 385,363 C385,423.5 363,467.5 324.5,467.5 ' +
  'C286,467.5 269.5,429 275,379.5 C280.5,324.5 275,258.5 275,192.5 C275,93.5 275,-11 269.5,-93.5 Z'
const BACK =
  'M-60.5,-407 L-60.5,-330 C-99,-313.5 -176,-308 -225.5,-286 C-269.5,-264 -291.5,-214.5 -291.5,-154 C-291.5,-82.5 -269.5,-11 -253,66 ' +
  'C-236.5,132 -214.5,192.5 -209,247.5 C-203.5,302.5 -220,357.5 -231,412.5 L231,412.5 C220,357.5 203.5,302.5 209,247.5 C214.5,192.5 236.5,132 253,66 ' +
  'C269.5,-11 291.5,-82.5 291.5,-154 C291.5,-214.5 269.5,-264 225.5,-286 C176,-308 99,-313.5 60.5,-330 L60.5,-407 Z'
const back =
  `<ellipse cx="-118" cy="-469" rx="24" ry="36" fill="${WHITE}" ${ink(IN)}/>` +
  `<ellipse cx="118" cy="-469" rx="24" ry="36" fill="${TINT_SHADE}" ${ink(IN)}/>` +
  `<path d="M-124,-490 C-110,-480 -110,-458 -122,-448 M124,-490 C110,-480 110,-458 122,-448" ${skinLine(DET)}/>` +
  `<path d="${ARM_L}" fill="${WHITE}"/>` +
  `<path d="M-269.5,-93.5 C-275,-11 -275,93.5 -275,192.5 C-275,258.5 -280.5,324.5 -275,379.5 C-269.5,429 -286,467.5 -324.5,467.5 C-302.5,445.5 -297,412.5 -302.5,379.5 C-308,324.5 -302.5,258.5 -302.5,192.5 C-302.5,93.5 -302.5,-11 -297,-82.5 Z" fill="${TINT_SHADE}"/>` +
  `<path d="${ARM_L}" ${lineOnly(OUT)}/>` +
  `<path d="M-374,93.5 C-363,107.3 -346.5,107.3 -335.5,93.5 M-376.7,363 C-352,376.8 -308,376.8 -277.7,363 M-357.5,418 L-354.7,445.5 M-335.5,423.5 L-335.5,451 M-313.5,423.5 L-313.5,451 M-294.2,418 L-294.2,442.8" ${skinLine(DET)}/>` +
  `<path d="${ARM_R}" fill="${WHITE}"/>` +
  `<path d="M379.5,-132 C385,-38.5 385,71.5 379.5,165 C374,236.5 385,308 385,363 C385,423.5 363,467.5 324.5,467.5 C346.5,440 352,401.5 352,368.5 C352,308 341,236.5 346.5,165 C352,71.5 352,-33 346.5,-121 Z" fill="${TINT_SHADE}"/>` +
  `<path d="${ARM_R}" ${lineOnly(OUT)}/>` +
  `<path d="M374,93.5 C363,107.3 346.5,107.3 335.5,93.5 M376.8,363 C352,376.8 308,376.8 277.8,363 M357.5,418 L354.8,445.5 M335.5,423.5 L335.5,451 M313.5,423.5 L313.5,451 M294.3,418 L294.3,442.8" ${skinLine(DET)}/>` +
  `<path d="${BACK}" fill="${WHITE}"/>` +
  `<path d="M82.5,-319 C132,-308 181.5,-302.5 225.5,-286 C269.5,-264 291.5,-214.5 291.5,-154 C291.5,-82.5 269.5,-11 253,66 C236.5,132 214.5,192.5 209,247.5 C203.5,302.5 220,357.5 231,412.5 L187,412.5 C176,357.5 170.5,302.5 176,247.5 C181.5,192.5 203.5,126.5 220,60.5 C236.5,-11 253,-82.5 253,-148.5 C253,-198 236.5,-236.5 198,-258.5 C159.5,-280.5 121,-302.5 82.5,-319 Z" fill="${TINT_SHADE}"/>` +
  `<path d="M-60.5,-374 C-27.5,-330 33,-330 60.5,-374 L60.5,-330 C33,-308 -33,-308 -60.5,-330 Z" fill="${TINT_SHADE}"/>` +
  `<path d="${BACK}" ${lineOnly(OUT)}/>` +
  `<path d="M0,-291.5 C5.5,-126.5 -5.5,93.5 0,324.5" ${skinLine(6)}/>` +
  `<path d="M-154,-209 C-192.5,-165 -192.5,-71.5 -143,-22 M154,-209 C192.5,-165 192.5,-71.5 143,-22 M-49.5,-313.5 C-82.5,-291.5 -121,-277.7 -165,-266.7 M49.5,-313.5 C82.5,-291.5 121,-277.7 165,-266.7 M-49.5,313.5 C-63.2,327.3 -63.2,346.5 -52.2,357.5 M49.5,313.5 C63.3,327.3 63.3,346.5 52.3,357.5" ${skinLine(4.5)}/>`
// điểm sáng trên vai và tay trái: ở lớp nét, không bị tô
const backShine =
  `<ellipse cx="-352" cy="-143" rx="14" ry="38" ${HIGHLIGHT}/>` + `<ellipse cx="-209" cy="-225" rx="50" ry="19" transform="rotate(-28 -209 -225)" ${HIGHLIGHT}/>`

// Khăn đất nung đắp hông, giữ màu riêng: hai sọc kem, nếp gấp, mảng bóng phải, điểm sáng
const TOWEL =
  'M-234,316.8 C-161.2,290.8 -72.8,306.4 0,296 C72.8,285.6 161.2,301.2 234,311.6 L244.4,441.6 C244.4,467.6 228.8,483.2 202.8,483.2 L-202.8,483.2 ' +
  'C-228.8,483.2 -244.4,467.6 -244.4,441.6 Z'
const towel =
  `<clipPath id="towel"><path d="${TOWEL}"/></clipPath>` +
  `<path d="${TOWEL}" fill="${C.terracotta}"/>` +
  `<path d="M228.8,332.4 L249.6,441.6 C249.6,472.8 228.8,488.4 197.6,488.4 L41.6,488.4 C135.2,467.6 218.4,426 228.8,332.4 Z" fill="${shade(C.terracotta)}" clip-path="url(#towel)"/>` +
  `<ellipse cx="-166" cy="318" rx="52" ry="10" ${HIGHLIGHT} clip-path="url(#towel)"/>` +
  `<path d="M-218.4,348 C-140.4,327.2 -62.4,337.6 0,329.8 C67.6,322 150.8,332.4 223.6,342.8" stroke="${C.cream}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
  `<path d="M-218.4,379.2 C-140.4,358.4 -62.4,368.8 0,361 C67.6,353.2 150.8,363.6 226.2,374" stroke="${C.cream}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
  `<path d="M-130,405.2 C-119.6,439 -124.8,462.4 -135.2,480.6 M130,400 C143,433.8 145.6,457.2 156,480.6" stroke="${C.lanternDark}" stroke-width="${DET}" fill="none" stroke-linecap="round"/>` +
  `<path d="${TOWEL}" ${lineOnly(OUT)}/>`

// Đầu nhìn từ trên, tô màu tóc: mảng bóng dưới phải, sợi tóc, búi tóc có vòng xoáy
const hair =
  `<ellipse cx="0" cy="-502" rx="117.5" ry="127" fill="${TINT_SHADE}"/>` +
  `<ellipse cx="-11" cy="-511" rx="104" ry="113" fill="${WHITE}"/>` +
  `<path d="M-56.4,-596 C-89.3,-530.2 -89.3,-445.6 -51.7,-384.5 M0,-605.4 C-4.7,-525.5 0,-450.3 0,-379.8 M56.4,-596 C89.3,-530.2 89.3,-445.6 51.7,-384.5" ${lineOnly(DET)}/>` +
  `<ellipse cx="0" cy="-502" rx="117.5" ry="127" ${lineOnly(OUT)}/>` +
  `<circle cx="0" cy="-563" r="51.7" fill="${TINT_SHADE}"/>` +
  `<circle cx="-9" cy="-572" r="40" fill="${WHITE}"/>` +
  `<path d="M-25.8,-567.8 C-23.5,-593.6 18.8,-596 23.5,-572.5 C28.2,-549 0,-539.6 -14.1,-553.7" ${lineOnly(DET)}/>` +
  `<circle cx="0" cy="-563" r="51.7" ${lineOnly(6)}/>`
// điểm sáng trên tóc và búi, chun buộc tóc đất nung: ở lớp nét, không bị tô
const hairOver =
  `<path d="M-89.3,-544.3 C-75.2,-581.9 -42.3,-605.4 -9.4,-610.1 C-37.6,-591.3 -61.1,-567.8 -70.5,-530.2 Z" ${HIGHLIGHT}/>` +
  `<ellipse cx="-23.5" cy="-586.6" rx="16.5" ry="9.4" transform="rotate(-30 -23.5 -586.6)" ${HIGHLIGHT}/>` +
  `<path d="M-42.3,-520.8 C-18.8,-506.7 18.8,-506.7 42.3,-520.8" stroke="${C.ink}" stroke-width="20" fill="none" stroke-linecap="round"/>` +
  `<path d="M-42.3,-520.8 C-18.8,-506.7 18.8,-506.7 42.3,-520.8" stroke="${C.terracotta}" stroke-width="11" fill="none" stroke-linecap="round"/>`

export function massageTextures(): Record<string, string> {
  return {
    'ms-bed': svgDoc(BED_BOX, 1, bed),
    // tinted parts keep their brown lines in a `-line` texture, drawn untinted on top; the back's carries the shines and the towel too
    'ms-back': svgDoc(BACK_BOX, 1, fillsOnly(back)),
    'ms-back-line': svgDoc(BACK_BOX, 1, linesOnly(back) + backShine + towel),
    'ms-hair': svgDoc(HAIR_BOX, 1, fillsOnly(hair)),
    'ms-hair-line': svgDoc(HAIR_BOX, 1, linesOnly(hair) + hairOver),
    // a tap point: a cream light with a teal heart in a warm glow, a shine on the cream
    'ms-point': svgDoc(
      POINT_BOX,
      1,
      GLOW +
        `<circle cx="0" cy="0" r="34" fill="${C.cream}" ${ink(6)}/><circle cx="0" cy="0" r="15" fill="${C.tealLight}" ${ink(4)}/>` +
        `<path d="M-24,-10 Q-20,-22 -8,-26" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`,
    ),
    // the ring that shrinks onto a tap point, drawn at its starting size, a shine along its top left
    'ms-ring': svgDoc(
      [-MS_RING_R - 12, -MS_RING_R - 12, 2 * MS_RING_R + 24, 2 * MS_RING_R + 24],
      1,
      `<circle cx="0" cy="0" r="${MS_RING_R}" fill="none" stroke="${C.ink}" stroke-width="20"/>` +
        `<circle cx="0" cy="0" r="${MS_RING_R}" fill="none" stroke="${C.teal}" stroke-width="12"/>` +
        `<path d="M${-MS_RING_R * 0.82},${-MS_RING_R * 0.57} A${MS_RING_R},${MS_RING_R} 0 0 1 ${-MS_RING_R * 0.34},${-MS_RING_R * 0.94}" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`,
    ),
    // a pressure point in turmeric yellow
    'ms-hold': svgDoc(
      POINT_BOX,
      1,
      GLOW +
        `<circle cx="0" cy="0" r="38" fill="${C.mustard}" ${ink(6)}/><circle cx="0" cy="0" r="16" fill="${C.mustardDark}" ${ink(4)}/>` +
        `<path d="M-22,-12 Q-16,-26 -2,-29" stroke="${C.cream}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    ),
  }
}
