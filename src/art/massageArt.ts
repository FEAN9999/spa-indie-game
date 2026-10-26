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

const OUTLINE = `stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"`
const POINT_BOX: Box = [-66, -66, 132, 132]
const GLOW = `<circle cx="0" cy="0" r="${MS_POINT_R}" fill="${C.glow}" opacity=".8"/>`

export function massageTextures(): Record<string, string> {
  // lying face down, seen from above: ears either side of the head, the nape, arms along the sides,
  // the spine and shoulder blades shaded in; tinted with the skin color
  const back =
    `<ellipse cx="-122" cy="-488" rx="24" ry="36" fill="#f0f0f0" ${OUTLINE}/><ellipse cx="122" cy="-488" rx="24" ry="36" fill="#f0f0f0" ${OUTLINE}/>` +
    `<rect x="-72" y="-440" width="144" height="150" rx="30" fill="#ffffff" ${OUTLINE}/>` +
    `<rect x="-380" y="-300" width="72" height="530" rx="36" fill="#ffffff" ${OUTLINE}/><rect x="308" y="-300" width="72" height="530" rx="36" fill="#ffffff" ${OUTLINE}/>` +
    `<path d="M-100,-322 Q-250,-330 -300,-296 Q-340,-270 -322,-190 Q-300,-40 -288,100 Q-280,220 -268,300 L-280,440 L280,440 L268,300 ` +
    `Q280,220 288,100 Q300,-40 322,-190 Q340,-270 300,-296 Q250,-330 100,-322Z" fill="#ffffff" ${OUTLINE}/>` +
    `<path d="M0,-310 Q6,60 0,420" stroke="#dcdcdc" stroke-width="8" fill="none" stroke-linecap="round"/>` +
    `<path d="M-200,-200 Q-120,-160 -150,-40 M200,-200 Q120,-160 150,-40" stroke="#e2e2e2" stroke-width="7" fill="none" stroke-linecap="round"/>`
  // a terracotta towel across the waist, untinted
  const towel =
    `<rect x="-312" y="296" width="624" height="176" rx="40" fill="${C.terracotta}" ${OUTLINE}/>` +
    `<path d="M-276,336 H276" stroke="${C.cream}" stroke-width="8" stroke-linecap="round"/>`
  // the back of the head with a crown whorl, down to the nape; tinted with the hair color
  const hair =
    `<path d="M-126,-480 Q-132,-590 -60,-612 Q0,-630 60,-612 Q132,-590 126,-480 Q120,-416 76,-396 Q40,-384 0,-392 ` +
    `Q-40,-384 -76,-396 Q-120,-416 -126,-480Z" fill="#ffffff" ${OUTLINE}/>` +
    `<path d="M-40,-600 Q-96,-540 -96,-450 M40,-600 Q96,-540 96,-450 M-12,-556 Q-42,-480 -32,-400 M12,-556 Q42,-480 32,-400 ` +
    `M4,-552 Q22,-566 30,-548 Q34,-530 12,-528" stroke="#dcdcdc" stroke-width="8" fill="none" stroke-linecap="round"/>`
  return {
    // a wood massage table under a cream sheet with teal piping, and the padded face cradle the head lies in
    'ms-bed': svgDoc(
      BED_BOX,
      1,
      `<rect x="-430" y="-540" width="860" height="1040" rx="50" fill="${C.wood}" ${OUTLINE}/>` +
        `<rect x="-412" y="-522" width="824" height="1004" rx="36" fill="${C.cream}" ${INNER}/>` +
        `<rect x="-392" y="-502" width="784" height="964" rx="26" fill="none" stroke="${C.tealLight}" stroke-width="6"/>` +
        `<ellipse cx="0" cy="-484" rx="170" ry="132" fill="${C.sand}" ${OUTLINE}/>`,
    ),
    // tinted parts keep their brown lines in a `-line` texture, drawn untinted on top; the back's carries the towel too
    'ms-back': svgDoc(BACK_BOX, 1, fillsOnly(back)),
    'ms-back-line': svgDoc(BACK_BOX, 1, linesOnly(back) + towel),
    'ms-hair': svgDoc(HAIR_BOX, 1, fillsOnly(hair)),
    'ms-hair-line': svgDoc(HAIR_BOX, 1, linesOnly(hair)),
    // a tap point: a cream light with a teal heart in a warm glow
    'ms-point': svgDoc(
      POINT_BOX,
      1,
      GLOW + `<circle cx="0" cy="0" r="34" fill="${C.cream}" ${OUTLINE}/><circle cx="0" cy="0" r="15" fill="${C.tealLight}" ${INNER}/>`,
    ),
    // the ring that shrinks onto a tap point, drawn at its starting size
    'ms-ring': svgDoc(
      [-MS_RING_R - 12, -MS_RING_R - 12, 2 * MS_RING_R + 24, 2 * MS_RING_R + 24],
      1,
      `<circle cx="0" cy="0" r="${MS_RING_R}" fill="none" stroke="${C.ink}" stroke-width="20"/>` +
        `<circle cx="0" cy="0" r="${MS_RING_R}" fill="none" stroke="${C.teal}" stroke-width="12"/>`,
    ),
    // a pressure point in turmeric yellow
    'ms-hold': svgDoc(
      POINT_BOX,
      1,
      GLOW +
        `<circle cx="0" cy="0" r="38" fill="${C.mustard}" ${OUTLINE}/><circle cx="0" cy="0" r="16" fill="${C.mustardDark}" ${INNER}/>` +
        `<path d="M-22,-12 Q-16,-26 -2,-29" stroke="${C.cream}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    ),
  }
}
