import { MASK_EYES } from '../config'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** The face's radius in canvas pixels; the face, hair, frown and pillow are drawn around the face centre at (0, 0). */
export const MK_FACE_R = 300

const FACE_BOX: Box = [-400, -340, 800, 680]
const HAIR_BOX: Box = [-440, -420, 880, 570]
const FROWN_BOX: Box = [-180, -280, 460, 210]
const PILLOW_BOX: Box = [-440, -420, 880, 790]

/** The image origin that puts the face centre of a texture drawn in `box` on the image's position. */
const centre = ([x, y, w, h]: Box) => ({ x: -x / w, y: -y / h })

/** Origins for drawing each mask texture at the face centre. */
export const MK_ORIGIN = { face: centre(FACE_BOX), hair: centre(HAIR_BOX), frown: centre(FROWN_BOX), pillow: centre(PILLOW_BOX) }

const OUTLINE = `stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"`
const BROWN = '#2B201C'

/** A closed eye, curved like a smile, centred where the rules put the eye. */
const closedEye = (e: { x: number; y: number }) => {
  const [x, y] = [Math.round(e.x * MK_FACE_R), Math.round(e.y * MK_FACE_R)]
  return `M${x - 32},${y - 8} Q${x},${y + 16} ${x + 32},${y - 8}`
}

export function maskTextures(): Record<string, string> {
  // the face from above, lying face up with the eyes closed where the rules put them; tinted with the skin color
  const face =
    `<ellipse cx="-300" cy="16" rx="44" ry="66" fill="#f0f0f0" ${OUTLINE}/><ellipse cx="300" cy="16" rx="44" ry="66" fill="#f0f0f0" ${OUTLINE}/>` +
    `<circle cx="0" cy="0" r="${MK_FACE_R}" fill="#ffffff" ${OUTLINE}/>` +
    `<path d="${MASK_EYES.map(closedEye).join(' ')}" stroke="${BROWN}" stroke-width="10" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="-170" cy="80" rx="46" ry="24" fill="#F09A86" opacity=".75"/><ellipse cx="170" cy="80" rx="46" ry="24" fill="#F09A86" opacity=".75"/>` +
    `<path d="M-30,138 Q0,162 30,138" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>`
  // hair fanned out on the pillow around the top of the head, behind the face; tinted with the hair color
  const hair =
    `<path d="M-330,130 Q-380,60 -370,-10 Q-420,-90 -380,-170 Q-370,-280 -270,-330 Q-200,-380 -110,-370 Q-50,-400 0,-380 Q50,-400 110,-370 ` +
    `Q200,-380 270,-330 Q370,-280 380,-170 Q420,-90 370,-10 Q380,60 330,130 Q290,80 250,60 L0,0 L-250,60 Q-290,80 -330,130Z" fill="#ffffff" ${OUTLINE}/>` +
    `<path d="M-250,-300 Q-320,-220 -330,-120 M-150,-345 Q-230,-300 -270,-240 M150,-345 Q230,-300 270,-240 M250,-300 Q320,-220 330,-120 ` +
    `M-345,-60 Q-360,20 -330,90 M345,-60 Q360,20 330,90" stroke="#dcdcdc" stroke-width="8" fill="none" stroke-linecap="round"/>`
  const anger = 'M228,-228 Q250,-240 272,-228 M228,-172 Q250,-160 272,-172 M222,-222 Q210,-200 222,-178 M278,-222 Q290,-200 278,-178'
  return {
    // a cream pillow with teal piping, and a towel across the shoulders under the chin
    'mk-pillow': svgDoc(
      PILLOW_BOX,
      1,
      `<rect x="-430" y="-410" width="860" height="670" rx="120" fill="${C.cream}" ${OUTLINE}/>` +
        `<rect x="-404" y="-384" width="808" height="618" rx="100" fill="none" stroke="${C.tealLight}" stroke-width="6"/>` +
        `<rect x="-380" y="230" width="760" height="130" rx="50" fill="${C.terracotta}" ${OUTLINE}/>` +
        `<path d="M-340,322 H340" stroke="${C.cream}" stroke-width="8" stroke-linecap="round"/>`,
    ),
    // tinted parts keep their brown lines in a `-line` texture, drawn untinted on top
    'mk-face': svgDoc(FACE_BOX, 1, fillsOnly(face)),
    'mk-face-line': svgDoc(FACE_BOX, 1, linesOnly(face)),
    'mk-hair': svgDoc(HAIR_BOX, 1, fillsOnly(hair)),
    'mk-hair-line': svgDoc(HAIR_BOX, 1, linesOnly(hair)),
    // a cucumber slice: dark green skin, pale flesh and a ring of seeds
    'mk-cucumber': svgDoc(
      [0, 0, 132, 132],
      1,
      `<circle cx="66" cy="66" r="60" fill="${C.leaf}" ${OUTLINE}/>` +
        `<circle cx="66" cy="66" r="50" fill="${C.cucumber}" ${INNER}/>` +
        `<circle cx="66" cy="66" r="26" fill="none" stroke="${C.leafLight}" stroke-opacity=".5" stroke-width="4"/>` +
        [0, 1, 2, 3, 4, 5, 6, 7]
          .map(i => `<ellipse cx="66" cy="44" rx="4" ry="7" fill="${C.cream}" transform="rotate(${i * 45} 66 66)"/>`)
          .join(''),
    ),
    // knitted brows over the closed eyes and a red cross mark: the customer frowns
    'mk-frown': svgDoc(
      FROWN_BOX,
      1,
      `<path d="M-168,-104 Q-130,-118 -84,-82 M168,-104 Q130,-118 84,-82" stroke="${BROWN}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
        `<path d="${anger}" stroke="${C.cream}" stroke-width="17" fill="none" stroke-linecap="round"/>` +
        `<path d="${anger}" stroke="${C.lantern}" stroke-width="9" fill="none" stroke-linecap="round"/>`,
    ),
  }
}
