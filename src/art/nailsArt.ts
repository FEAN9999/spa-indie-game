import { NAILS_NAIL } from '../config'
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

/** The ink silhouette is this much wider than each finger, so a rim shows round the tinted hand. */
const RIM = 9
const PALM = `cx="530" cy="1455" rx="170" ry="100"`

/** The pale pink cushion with its dashed seam. */
const CUSHION =
  `<rect x="160" y="1375" width="760" height="200" rx="100" fill="${C.pinkPale}" stroke="${C.ink}" stroke-width="4"/>` +
  `<rect x="190" y="1400" width="700" height="150" rx="75" fill="none" stroke="${C.lotusDark}" stroke-width="3" stroke-dasharray="10 9"/>`

const fingers = (colour: string, extra: number) =>
  NAILS_FINGERS.map(([tx, ty, bx, by, w]) => `<path d="M${tx},${ty} L${bx},${by}" stroke="${colour}" stroke-width="${w + extra}" stroke-linecap="round"/>`).join('')

/** The fingers and the palm in white with a grey crease, tinted with the skin colour. */
const HAND =
  fingers('#FFFFFF', 0) + `<ellipse ${PALM} fill="#FFFFFF"/>` + `<path d="M470,1420 Q520,1440 580,1420" stroke="#DCDCDC" stroke-width="5" fill="none" stroke-linecap="round"/>`

/** The hand's ink silhouette, drawn under it. */
const HAND_LINE = fingers(C.ink, RIM) + `<ellipse ${PALM} fill="${C.ink}" stroke="${C.ink}" stroke-width="${RIM}"/>`

const { x: nx, y: ny } = NAILS_NAIL
/** The fingertip under the nail, big in the lens: a rounded top over straight sides. */
const TIP_D = `M${nx - 185},${ny + 420} V${ny + 30} A185,230 0 0 1 ${nx + 185},${ny + 30} V${ny + 420}Z`
const inLens = (body: string) =>
  `<clipPath id="lens"><circle cx="${NAILS_LENS.x}" cy="${NAILS_LENS.y}" r="${NAILS_LENS.r}"/></clipPath><g clip-path="url(#lens)">${body}</g>`

/** The Sơn móng pictures: the cushion, and the hand and the fingertip in the lens, each split into a skin-tinted fill and its untinted line. */
export function nailsTextures(): Record<string, string> {
  return {
    'nails-cushion': svgDoc(NAILS_BOX.cushion, 1, CUSHION),
    'nails-hand': svgDoc(NAILS_BOX.hand, 1, HAND),
    'nails-hand-line': svgDoc(NAILS_BOX.hand, 1, HAND_LINE),
    'nails-tip': svgDoc(
      NAILS_BOX.tip,
      1,
      inLens(
        `<path d="${TIP_D}" fill="#FFFFFF"/>` +
          `<path d="M${nx - 150},${ny + 172} Q${nx},${ny + 208} ${nx + 150},${ny + 172}" stroke="#DCDCDC" stroke-width="6" fill="none" stroke-linecap="round"/>`,
      ),
    ),
    'nails-tip-line': svgDoc(NAILS_BOX.tip, 1, inLens(`<path d="${TIP_D}" fill="none" stroke="${C.ink}" stroke-width="6"/>`)),
  }
}
