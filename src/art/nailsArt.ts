import { NAILS_NAIL } from '../config'
import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** The magnifier over the hand, in the card's pixels: its centre and radius. */
export const NAILS_LENS = { x: 540, y: 930, r: 250 }

// Every texture is drawn in the card's own pixels, so each is placed at its box's top left corner.
export const NAILS_BOX = {
  cushion: [150, 1365, 780, 220] as Box,
  hand: [270, 1120, 480, 450] as Box,
  tip: [NAILS_LENS.x - NAILS_LENS.r, NAILS_LENS.y - NAILS_LENS.r, 2 * NAILS_LENS.r, 2 * NAILS_LENS.r] as Box,
}

/** The fingers on the cushion, thumb first: tip x, y, base x, y and width. */
export const NAILS_FINGERS = [
  [325, 1305, 400, 1440, 76],
  [440, 1190, 455, 1390, 70],
  [530, 1170, 530, 1380, 72],
  [620, 1188, 605, 1390, 68],
  [700, 1236, 670, 1400, 60],
] as const

// Nét vẽ A+ theo bản đã duyệt (docs/art/huong-net-ve/lo1/aplus-nails.svg): ngón thuôn dần có nếp đốt và mảng bóng,
// mu bàn tay phủ gốc ngón, cổ tay áo, gối nệm có bóng và đường may. Đầu mỗi ngón vẫn là tâm vòng đầu ngón như bản cũ,
// để móng nhỏ của cảnh nằm đúng chỗ.

/** Nếp đốt và nếp mu tay: trắng tối hơn mảng bóng, tô màu da thành nét da đậm. */
const CREASE = shade('#FFFFFF', 0.3)

/** The pale pink cushion with its shade, its dashed seam, and the hand's shadow on it. */
const CUSHION_D = 'M260,1375 H820 A100,100 0 0 1 820,1575 H260 A100,100 0 0 1 260,1375 Z'
const CUSHION =
  `<ellipse cx="548" cy="1578" rx="370" ry="7" ${GROUND}/>` +
  `<path d="${CUSHION_D}" fill="${C.pinkPale}"/>` +
  `<clipPath id="nails-cushion"><path d="${CUSHION_D}"/></clipPath><g clip-path="url(#nails-cushion)">` +
  `<path d="M150,1520 C400,1586 700,1586 930,1490 L930,1590 L150,1590 Z" fill="${shade(C.pinkPale)}"/>` +
  `<path d="M260,1396 C320,1386 400,1382 470,1382" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity=".45"/>` +
  `<ellipse cx="552" cy="1500" rx="180" ry="84" fill="${C.ink}" opacity=".18"/>` +
  `</g>` +
  `<rect x="190" y="1400" width="700" height="150" rx="75" fill="none" stroke="${C.lotusDark}" stroke-width="3.5" stroke-dasharray="11 10"/>` +
  `<path d="${CUSHION_D}" fill="none" ${ink(6)}/>`

/**
 * The hand is drawn round this point and moved into place as a whole: outline.ts masks each line in a box of ±1000
 * round the origin, so the shapes it splits must sit near it.
 */
const HAND_AT = { x: 540, y: 1350 }

/** How far down the card each finger's side lines run, thumb first: to just past the edge of the back of the hand. */
const LINE_ENDS_Y = [1405, 1358, 1358, 1358, 1378]

/** Each finger as its tip centre, its turn (local y runs from the tip down to the base), its length, its width and where its lines stop. */
const FINGERS = NAILS_FINGERS.map(([tx, ty, bx, by, w], i) => {
  const len = Math.hypot(bx - tx, by - ty)
  const turn = (Math.atan2(-(bx - tx) / len, (by - ty) / len) * 180) / Math.PI
  const lineEnd = Math.min(len + 10, (LINE_ENDS_Y[i] - ty) / ((by - ty) / len) + 8)
  return { at: `translate(${tx - HAND_AT.x} ${ty - HAND_AT.y}) rotate(${turn.toFixed(2)})`, len, rt: w / 2, rb: (w / 2) * 1.08, lineEnd }
})

/** A finger down to `end`, tapering from its base to the round tip; open at the base so no line crosses the back of the hand. */
const fingerD = (f: (typeof FINGERS)[number], end = f.len + 10) => {
  const r = f.rt + ((f.rb - f.rt) * end) / (f.len + 10)
  return `M${-r},${end} L${-f.rt},0 A${f.rt},${f.rt} 0 0 1 ${f.rt},0 L${r},${end}`
}

/** The back of the hand over the fingers' roots, down to the wrist, round HAND_AT. */
const BACK_D = 'M-148,80 C-156,42 -120,10 -78,6 L66,10 C112,16 150,38 152,78 C154,128 128,180 106,216 L-104,216 C-126,178 -142,128 -148,80 Z'

/** The back of the hand, then the fingers on top, thumb first, in white with brown lines. */
const BACK = `<path d="${BACK_D}" fill="#FFFFFF" ${ink(6)}/>`
/** Each finger's white reaches into the back of the hand; its lines stop at the back's edge. */
const FINGER_SHAPES = FINGERS.map(f => `<path d="${fingerD(f)}" transform="${f.at}" fill="#FFFFFF"/><path d="${fingerD(f, f.lineEnd)}" transform="${f.at}" fill="none" ${ink(5)}/>`).join('')

/** In the skin-tinted layer: the shade down the hand's right, and on each finger, down to its lines' end, its right-hand shade and two knuckle creases. */
const BACK_SHADE =
  `<clipPath id="nails-back"><path d="${BACK_D}"/></clipPath><g clip-path="url(#nails-back)">` +
  `<path d="M66,6 C112,16 154,38 156,78 C158,128 132,180 110,220 L58,220 C88,170 108,120 106,78 C104,46 88,24 66,6 Z" fill="${TINT_SHADE}"/>` +
  `</g>` +
  `<path d="M-70,102 C-60,128 -56,154 -58,184 M20,100 C26,128 26,156 22,188" fill="none" stroke="${CREASE}" stroke-width="4" stroke-linecap="round"/>`
const FINGER_SHADE = FINGERS.map(f => {
  const { rt, lineEnd: end } = f
  const rb = f.rt + ((f.rb - f.rt) * end) / (f.len + 10)
  const len = f.len
  const crease = (y: number) => `M${-rt * 0.62},${y} Q0,${y + 7} ${rt * 0.62},${y}`
  return (
    `<g transform="${f.at}">` +
    `<path d="M${rt * 0.42},${-rt * 0.9} A${rt},${rt} 0 0 1 ${rt},0 L${rb},${end} L${rb * 0.45},${end} Z" fill="${TINT_SHADE}"/>` +
    `<path d="${crease(len * 0.4)} ${crease(len * 0.68)}" fill="none" stroke="${CREASE}" stroke-width="4" stroke-linecap="round"/>` +
    `</g>`
  )
}).join('')

/** On the line layer, untinted: a highlight down each finger and on the back of the hand, and the shirt cuff at the wrist. */
const HAND_TOP =
  FINGERS.map(f => `<ellipse cx="${-f.rt * 0.48}" cy="${f.len * 0.52}" rx="5" ry="${f.len * 0.16}" transform="${f.at}" ${HIGHLIGHT}/>`).join('') +
  `<path d="M-100,190 C-104,160 -98,135 -84,120 C-88,140 -90,165 -86,192 Z" ${HIGHLIGHT}/>` +
  `<rect x="-120" y="178" width="242" height="40" rx="12" fill="${C.cobalt}" ${ink(6)}/>` +
  `<path d="M-106,190 H108" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".45"/>`
/** The hand's parts moved from round HAND_AT into the card. */
const placeHand = (body: string) => `<g transform="translate(${HAND_AT.x} ${HAND_AT.y})">${body}</g>`

const { x: nx, y: ny } = NAILS_NAIL
/** The fingertip under the nail, big in the lens: a rounded top over straight sides. */
const TIP_D = `M${nx - 185},${ny + 420} V${ny + 30} A185,230 0 0 1 ${nx + 185},${ny + 30} V${ny + 420}Z`
const inLens = (body: string) =>
  `<clipPath id="lens"><circle cx="${NAILS_LENS.x}" cy="${NAILS_LENS.y}" r="${NAILS_LENS.r}"/></clipPath><g clip-path="url(#lens)">${body}</g>`
/** The fingertip's right-hand shade and the crease under the nail, tinted with the skin. */
const TIP_FILL =
  `<path d="${TIP_D}" fill="#FFFFFF"/>` +
  `<clipPath id="nails-tip"><path d="${TIP_D}"/></clipPath><g clip-path="url(#nails-tip)">` +
  `<path d="M${nx + 100},${ny - 150} Q${nx + 200},${ny} ${nx + 190},${ny + 430} L${nx + 110},${ny + 430} Q${nx + 150},${ny + 60} ${nx + 100},${ny - 150} Z" fill="${TINT_SHADE}"/>` +
  `</g>` +
  `<path d="M${nx - 150},${ny + 172} Q${nx},${ny + 208} ${nx + 150},${ny + 172}" stroke="${CREASE}" stroke-width="6" fill="none" stroke-linecap="round"/>`
/** The fingertip's outline and a highlight down its left, untinted. */
const TIP_LINE = `<ellipse cx="${nx - 140}" cy="${ny + 250}" rx="14" ry="70" ${HIGHLIGHT}/>` + `<path d="${TIP_D}" fill="none" ${ink(7)}/>`

/** The Sơn móng pictures: the cushion, and the hand and the fingertip in the lens, each split into a skin-tinted fill and its untinted line. */
export function nailsTextures(): Record<string, string> {
  return {
    'nails-cushion': svgDoc(NAILS_BOX.cushion, 1, CUSHION),
    'nails-hand': svgDoc(NAILS_BOX.hand, 1, placeHand(fillsOnly(BACK) + BACK_SHADE + fillsOnly(FINGER_SHAPES) + FINGER_SHADE)),
    'nails-hand-line': svgDoc(NAILS_BOX.hand, 1, placeHand(linesOnly(BACK + FINGER_SHAPES) + HAND_TOP)),
    'nails-tip': svgDoc(NAILS_BOX.tip, 1, inLens(TIP_FILL)),
    'nails-tip-line': svgDoc(NAILS_BOX.tip, 1, inLens(TIP_LINE)),
  }
}
