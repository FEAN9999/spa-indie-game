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

// Nét vẽ A+ theo bản đã duyệt (docs/art/huong-net-ve/lo1/aplus-nails.svg), làm mềm hơn: cả bàn tay là một đường viền
// liền (ngón, kẽ ngón, mu tay, ngón cái) thay cho các ống ngón đè lên mu tay, nên kẽ ngón chỉ là một khấc ngắn ở gốc ngón.
// Đầu mỗi ngón vẫn là tâm vòng đầu ngón như bản cũ, để móng nhỏ của cảnh nằm đúng chỗ.

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
/** A card point written round HAND_AT. */
const pt = (x: number, y: number) => `${(x - HAND_AT.x).toFixed(1)},${(y - HAND_AT.y).toFixed(1)}`

/** Each finger, thumb first: its tip centre, the unit step down it, the step to its left, its length and its tip's radius. */
const FINGERS = NAILS_FINGERS.map(([tx, ty, bx, by, w]) => {
  const len = Math.hypot(bx - tx, by - ty)
  const ux = (bx - tx) / len
  const uy = (by - ty) / len
  return { tx, ty, ux, uy, nx: -uy, ny: ux, len, r: w / 2 }
})
type Finger = (typeof FINGERS)[number]
/** A finger widens a little towards its root. */
const radiusAt = (f: Finger, d: number) => f.r * (1 + (0.1 * d) / f.len)
/** The point `d` down finger `f` on its left side (`side` 1) or right side (`side` −1), on the card. */
const sideAt = (f: Finger, d: number, side: 1 | -1) => {
  const r = radiusAt(f, d) * side
  return { x: f.tx + f.nx * r + f.ux * d, y: f.ty + f.ny * r + f.uy * d }
}
/** How far down finger `f` its side reaches card height `y`. */
const downTo = (f: Finger, y: number) => (y - f.ty) / f.uy
const P2 = (p: { x: number; y: number }) => pt(p.x, p.y)
/** Up finger `f`'s left side from `dLeft`, round its tip, and down its right side to `dRight`. */
const fingerRun = (f: Finger, dLeft: number, dRight: number) =>
  `L${P2(sideAt(f, dLeft, 1))} L${P2(sideAt(f, 0, 1))} A${f.r},${f.r} 0 0 1 ${P2(sideAt(f, 0, -1))} L${P2(sideAt(f, dRight, -1))}`

const [THUMB, INDEX, MIDDLE, RING, PINKY] = FINGERS
/** Where each web between two fingers lies, on the card: the thumb's is deep, the others a short notch. */
const WEB_Y = { thumb: 1398, index: 1346, middle: 1346, ring: 1360 }
/** A web: a short rounded notch from one finger's right side over to the next finger's left side. */
const web = (a: { x: number; y: number }, b: { x: number; y: number }, dip: number) =>
  `Q${pt((a.x + b.x) / 2, Math.max(a.y, b.y) + dip)} ${P2(b)}`

/** How far down each finger its sides run before the webs, so the outline and the shades stop at the same place. */
const RUN = {
  thumbIn: THUMB.len * 0.56,
  indexIn: downTo(INDEX, 1368),
  indexOut: downTo(INDEX, WEB_Y.index - 14),
  middleIn: downTo(MIDDLE, WEB_Y.index - 14),
  middleOut: downTo(MIDDLE, WEB_Y.middle - 14),
  ringIn: downTo(RING, WEB_Y.middle - 12),
  ringOut: downTo(RING, WEB_Y.ring - 14),
  pinkyIn: downTo(PINKY, WEB_Y.ring - 10),
  pinkyOut: PINKY.len * 0.8,
}

/**
 * The whole hand as one outline, clockwise from the wrist's left: up the bulge of the thumb's root, round the thumb,
 * through each web and round each finger, then down the outer edge of the hand to the wrist under the cuff.
 */
const HAND_D = (() => {
  const thumbRoot = sideAt(THUMB, THUMB.len, 1)
  const pinkyRoot = sideAt(PINKY, RUN.pinkyOut, -1)
  return (
    `M${pt(452, 1548)} C${pt(408, 1546)} ${pt(368, 1506)} ${P2(thumbRoot)}` +
    fingerRun(THUMB, THUMB.len, RUN.thumbIn) +
    web(sideAt(THUMB, RUN.thumbIn, -1), sideAt(INDEX, RUN.indexIn, 1), 22) +
    fingerRun(INDEX, RUN.indexIn, RUN.indexOut) +
    web(sideAt(INDEX, RUN.indexOut, -1), sideAt(MIDDLE, RUN.middleIn, 1), 12) +
    fingerRun(MIDDLE, RUN.middleIn, RUN.middleOut) +
    web(sideAt(MIDDLE, RUN.middleOut, -1), sideAt(RING, RUN.ringIn, 1), 12) +
    fingerRun(RING, RUN.ringIn, RUN.ringOut) +
    web(sideAt(RING, RUN.ringOut, -1), sideAt(PINKY, RUN.pinkyIn, 1), 12) +
    fingerRun(PINKY, RUN.pinkyIn, RUN.pinkyOut) +
    `C${pt(pinkyRoot.x + 6, pinkyRoot.y + 52)} ${pt(684, 1500)} ${pt(634, 1548)} Z`
  )
})()

/** The hand in white with its brown outline, and the short fold where the thumb meets the palm. */
const HAND =
  `<path d="${HAND_D}" fill="#FFFFFF" ${ink(6)}/>` +
  `<path d="M${pt(410, 1392)} C${pt(420, 1418)} ${pt(430, 1440)} ${pt(452, 1458)}" fill="none" ${ink(3.5)}/>`

/** A shade strip down a finger's right side from its tip to `end`, and two knuckle creases. */
const fingerShade = (f: Finger, end: number, creases: number[]) => {
  const tip = sideAt(f, 0, -1)
  const inner = (d: number) => ({ x: f.tx - f.nx * radiusAt(f, d) * 0.42 + f.ux * d, y: f.ty - f.ny * radiusAt(f, d) * 0.42 + f.uy * d })
  const top = { x: f.tx - f.nx * f.r * 0.42 - f.ux * f.r * 0.9, y: f.ty - f.ny * f.r * 0.42 - f.uy * f.r * 0.9 }
  const crease = (d: number) => {
    const a = sideAt(f, d, 1)
    const b = sideAt(f, d, -1)
    const k = 0.22
    const from = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
    const to = { x: a.x + (b.x - a.x) * (1 - k), y: a.y + (b.y - a.y) * (1 - k) }
    return `M${P2(from)} Q${pt((a.x + b.x) / 2 + f.ux * 7, (a.y + b.y) / 2 + f.uy * 7)} ${P2(to)}`
  }
  return (
    `<path d="M${P2(top)} A${f.r},${f.r} 0 0 1 ${P2(tip)} L${P2(sideAt(f, end, -1))} L${P2(inner(end))} Z" fill="${TINT_SHADE}"/>` +
    `<path d="${creases.map(crease).join(' ')}" fill="none" stroke="${CREASE}" stroke-width="4" stroke-linecap="round"/>`
  )
}

/** In the skin-tinted layer, inside the outline: the shade down each finger's right and the hand's right, the knuckle creases, two tendons. */
const HAND_SHADE =
  `<clipPath id="nails-hand"><path d="${HAND_D}"/></clipPath><g clip-path="url(#nails-hand)">` +
  fingerShade(THUMB, RUN.thumbIn, [THUMB.len * 0.42]) +
  fingerShade(INDEX, RUN.indexOut + 6, [INDEX.len * 0.4, INDEX.len * 0.64]) +
  fingerShade(MIDDLE, RUN.middleOut + 6, [MIDDLE.len * 0.4, MIDDLE.len * 0.64]) +
  fingerShade(RING, RUN.ringOut + 6, [RING.len * 0.4, RING.len * 0.64]) +
  fingerShade(PINKY, RUN.pinkyOut, [PINKY.len * 0.42, PINKY.len * 0.68]) +
  `<path d="M${pt(712, 1360)} C${pt(716, 1430)} ${pt(684, 1500)} ${pt(634, 1552)} L${pt(586, 1552)} C${pt(632, 1500)} ${pt(660, 1436)} ${pt(656, 1372)} Z" fill="${TINT_SHADE}"/>` +
  `</g>` +
  `<path d="M${pt(496, 1400)} C${pt(500, 1440)} ${pt(504, 1476)} ${pt(508, 1506)} M${pt(574, 1404)} C${pt(570, 1442)} ${pt(566, 1478)} ${pt(562, 1506)}" ` +
  `fill="none" stroke="${CREASE}" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>`

/** On the line layer, untinted: a highlight down each finger's left and on the back of the hand, and the shirt cuff at the wrist. */
const HAND_TOP =
  FINGERS.map(f => {
    const a = sideAt(f, f.len * 0.18, 1)
    const b = sideAt(f, f.len * 0.5, 1)
    const inset = (p: { x: number; y: number }) => ({ x: p.x - f.nx * 11, y: p.y - f.ny * 11 })
    return `<path d="M${P2(inset(a))} L${P2(inset(b))}" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".45"/>`
  }).join('') +
  `<ellipse cx="${(486 - HAND_AT.x).toFixed(1)}" cy="${(1432 - HAND_AT.y).toFixed(1)}" rx="16" ry="34" transform="rotate(28 ${(486 - HAND_AT.x).toFixed(1)} ${(1432 - HAND_AT.y).toFixed(1)})" ${HIGHLIGHT}/>` +
  `<rect x="${(420 - HAND_AT.x).toFixed(1)}" y="${(1528 - HAND_AT.y).toFixed(1)}" width="242" height="40" rx="12" fill="${C.cobalt}" ${ink(6)}/>` +
  `<path d="M${pt(434, 1540)} H${(648 - HAND_AT.x).toFixed(1)}" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".45"/>`
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
    'nails-hand': svgDoc(NAILS_BOX.hand, 1, placeHand(fillsOnly(HAND) + HAND_SHADE)),
    'nails-hand-line': svgDoc(NAILS_BOX.hand, 1, placeHand(linesOnly(HAND) + HAND_TOP)),
    'nails-tip': svgDoc(NAILS_BOX.tip, 1, inLens(TIP_FILL)),
    'nails-tip-line': svgDoc(NAILS_BOX.tip, 1, inLens(TIP_LINE)),
  }
}
