import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// Every picture here is drawn around the head's centre at (0, 0), in canvas pixels.
const HEAD_BOX: Box = [-118, -136, 236, 240]
const TUB_BOX: Box = [-266, 32, 532, 290]
const STEAM_BOX: Box = [-240, -84, 480, 164]

/** The image origin that puts the head centre of a texture drawn in `box` on the image's position. */
const centre = ([x, y, w, h]: Box) => ({ x: -x / w, y: -y / h })

/**
 * Origins for drawing the mud pictures all at one point, the head's centre. The head's is for the head, its line,
 * the towel and the faces too. Drawn in this order: steam, head, head line, towel, face, tub; the tub's mud has a hole
 * where the head comes up through it, so the mud closes round the neck.
 */
export const MUD_ORIGIN = { tub: centre(TUB_BOX), head: centre(HEAD_BOX), steam: centre(STEAM_BOX) }

const OUTLINE = `stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"`
const EYE = '#2B201C'
const FEATURE = `stroke="${EYE}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"`
const MOUTH = `stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"`

// the round head, tinted with the skin colour
const head = `<circle cx="0" cy="0" r="96" fill="#ffffff" ${OUTLINE}/>`

const face = (body: string) => svgDoc(HEAD_BOX, 1, body)
const openEye = (x: number) => `<ellipse cx="${x}" cy="8" rx="8" ry="10" fill="${EYE}"/><circle cx="${x + 3}" cy="4" r="3" fill="#ffffff"/>`

const stave = (x: number, bottom: number) => `<path d="M${x},126 V${bottom}" stroke="${C.woodDark}" stroke-width="7" stroke-linecap="round"/>`
// the head's outline down to the neck, where it meets the mud: cut out of the mud, then the neck line drawn across it
const HOLE = 'M-78.1,60 A98.5,98.5 0 1 1 78.1,60 A78.1,18 0 0 1 -78.1,60Z'
const NECK = 'M-74.9,60 A74.9,16 0 0 0 74.9,60'
const bubble = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.clayLight}" stroke="${C.ink}" stroke-width="2.5"/>`
const STEAM = 'stroke="#9FB8BF" stroke-width="10" fill="none" stroke-linecap="round"'

/** The Tắm bùn pictures: a towel-wrapped head in a wooden tub of mud, its three faces, and the steam off the mud. */
export function mudTextures(): Record<string, string> {
  return {
    // a wooden tub seen from the front, its staves showing, filled to the brim with mud and a few pale bubbles
    'mud-tub': svgDoc(
      TUB_BOX,
      1,
      `<path d="M-260,84 H260 V250 C260,290 230,318 190,318 H-190 C-230,318 -260,290 -260,250Z" fill="${C.wood}" ${OUTLINE}/>` +
        stave(-152, 306) + stave(-60, 310) + stave(60, 310) + stave(152, 306) +
        `<mask id="neck" maskUnits="userSpaceOnUse" x="-266" y="32" width="532" height="290"><rect x="-266" y="32" width="532" height="290" fill="#fff"/><path d="${HOLE}" fill="#000"/></mask>` +
        `<ellipse cx="0" cy="84" rx="260" ry="46" fill="${C.clay}" ${OUTLINE} mask="url(#neck)"/>` +
        `<path d="M-96,68 A96,24 0 0 0 96,68" stroke="${C.clayLight}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>` +
        `<path d="${NECK}" stroke="${C.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
        `<path d="M-214,104 Q-164,118 -114,116" stroke="${C.clayLight}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>` +
        bubble(-160, 88, 12) + bubble(172, 80, 14) + bubble(124, 108, 8),
    ),
    'mud-head': svgDoc(HEAD_BOX, 1, fillsOnly(head)),
    'mud-head-line': svgDoc(HEAD_BOX, 1, linesOnly(head)),
    // a cream towel wrapped round the hair, its two ends crossed and twisted over the forehead
    'mud-towel': svgDoc(
      HEAD_BOX,
      1,
      `<path d="M-104,-14 C-110,-96 -56,-128 0,-128 C56,-128 110,-96 104,-14 C80,-34 40,-46 0,-46 C-40,-46 -80,-34 -104,-14Z" fill="${C.paper}" ${OUTLINE}/>` +
        `<path d="M-60,-108 C-80,-88 -92,-62 -96,-34 M60,-108 C80,-88 92,-62 96,-34" stroke="${C.tileSeam}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
        `<path d="M-100,-24 C-70,-48 -30,-70 -2,-112 M100,-24 C70,-48 30,-70 2,-112" ${INNER} fill="none" stroke-linecap="round"/>` +
        `<path d="M-22,-104 C-16,-124 16,-124 22,-104 C18,-88 -18,-88 -22,-104Z" fill="${C.paper}" ${INNER}/>`,
    ),
    // too cold: eyes open, a wobbly frown
    'mud-face-cold': face(openEye(-36) + openEye(36) + `<path d="M-20,48 Q-10,38 0,44 Q10,38 20,48" ${MOUTH}/>`),
    // just right: eyes shut, a soft smile
    'mud-face-ok': face(`<path d="M-50,4 Q-36,18 -22,4 M22,4 Q36,18 50,4" ${FEATURE}/><path d="M-18,36 Q0,52 18,36" ${MOUTH}/>`),
    // too hot: eyes squeezed, a wavy mouth, red cheeks
    'mud-face-hot': face(
      `<ellipse cx="-62" cy="30" rx="17" ry="10" fill="${C.lantern}" opacity=".55"/><ellipse cx="62" cy="30" rx="17" ry="10" fill="${C.lantern}" opacity=".55"/>` +
        `<path d="M-50,-4 L-26,6 L-50,16 M50,-4 L26,6 L50,16" ${FEATURE}/>` +
        `<path d="M-22,42 Q-11,32 0,42 Q11,52 22,42" ${MOUTH}/>`,
    ),
    // two tall curls beside the head and two short ones further out, rising off the mud
    'mud-steam': svgDoc(
      STEAM_BOX,
      1,
      [-150, 150].map(x => `<path d="M${x},60 q16,-22 0,-44 q-16,-22 0,-44 q16,-22 0,-44" ${STEAM}/>`).join('') +
        [-214, 214].map(x => `<path d="M${x},70 q12,-18 0,-36 q-12,-18 0,-36" ${STEAM}/>`).join(''),
    ),
  }
}
