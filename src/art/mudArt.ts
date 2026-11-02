import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
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

// Nét A+: viền ngoài, nét trong, nét chi tiết
const OUT = 7
const IN = 4.5
const DET = 3
const EYE = C.deepBrown
const BROW = '#5B3A29'
const FEATURE = `stroke="${EYE}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"`
const MOUTH = `stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"`

// đầu tròn tô màu da: mảng bóng dưới phải, bóng khăn đổ lên trán, viền
const head =
  `<circle cx="0" cy="0" r="96" fill="${TINT_SHADE}"/>` +
  `<circle cx="-10" cy="-8" r="83" fill="#ffffff"/>` +
  `<path d="M-84,-45 C-40,-62 40,-62 84,-45 L90,-29 C40,-46 -40,-46 -90,-29 Z" fill="${TINT_SHADE}"/>` +
  `<circle cx="0" cy="0" r="96" fill="none" ${ink(OUT)}/>`
// điểm sáng trên gò má, ở lớp nét nên không bị tô
const headShine = `<ellipse cx="-63" cy="12" rx="15" ry="7.5" transform="rotate(-14 -63 12)" ${HIGHLIGHT}/>`

const face = (body: string) => svgDoc(HEAD_BOX, 1, body)
const nose = `<path d="M-1.5,15 q-4.5,9 3,12" stroke="${C.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`

// khăn kem quấn đầu: nếp gấp, mảng bóng phải, búi khăn trên đỉnh
const TOWEL = 'M-111,-28 C-120,-88 -63,-121.6 0,-121.6 C63,-121.6 120,-88 111,-28 C78,-47.2 42,-54.4 0,-54.4 C-42,-54.4 -78,-47.2 -111,-28 Z'

const curve = (x: number, bottom: number, lean: number) => `M${x},120 L${x + lean},${bottom}`
// thân bồn thuôn dần xuống đáy
const TUB = 'M-258,84 L-228,290 C-180,322 180,322 228,290 L258,84 Z'
// the head's outline down to the neck, where it meets the mud: cut out of the mud and the rim, then the neck line drawn across it
const HOLE = 'M-78.1,60 A98.5,98.5 0 1 1 78.1,60 A78.1,18 0 0 1 -78.1,60Z'
const NECK = 'M-74.9,60 A74.9,16 0 0 0 74.9,60'
const bubble = (x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.clayLight}" ${ink(2.5)}/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="#FFFFFF" opacity=".6"/>`
const STEAM = `stroke="${C.steamBlue}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"`
const BAND = (d: string) =>
  `<path d="${d}" stroke="${C.ink}" stroke-width="24" fill="none"/><path d="${d}" stroke="${C.mustard}" stroke-width="14" fill="none"/>`
const MASK = 'mask="url(#neck)"'

/** The Tắm bùn pictures: a towel-wrapped head in a wooden tub of mud, its three faces, and the steam off the mud. */
export function mudTextures(): Record<string, string> {
  return {
    // a wooden tub seen from the front: staves, a darker right side, two brass bands with rivets, a lighter lip,
    // and mud to the brim with ripples round the neck, bubbles and splashes
    'mud-tub': svgDoc(
      TUB_BOX,
      1,
      `<mask id="neck" maskUnits="userSpaceOnUse" x="-266" y="32" width="532" height="290"><rect x="-266" y="32" width="532" height="290" fill="#fff"/><path d="${HOLE}" fill="#000"/></mask>` +
        `<clipPath id="tub"><path d="${TUB}"/></clipPath>` +
        `<ellipse cx="10" cy="312" rx="254" ry="8" ${GROUND}/>` +
        `<path d="${TUB}" fill="${C.wood}"/>` +
        `<path d="M190,84 L258,84 L228,290 C210,302 186,310 160,314 C178,240 192,150 190,84 Z" fill="${shade(C.wood)}" clip-path="url(#tub)"/>` +
        `<path d="${[curve(-180, 302, 8), curve(-110, 312, 4), curve(-40, 316, 1), curve(40, 316, -1), curve(110, 312, -4), curve(180, 302, -8)].join(' ')}" stroke="${C.woodDark}" stroke-width="5" stroke-linecap="round" clip-path="url(#tub)"/>` +
        `<path d="M-232,132 L-214,272" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" opacity=".3"/>` +
        `<path d="${TUB}" fill="none" ${ink(OUT)}/>` +
        BAND('M-251,150 C-150,180 150,180 251,150') +
        BAND('M-236,256 C-140,286 140,286 236,256') +
        `<path d="M-226,160 C-190,172 -150,180 -110,184 M-212,266 C-180,276 -150,282 -116,285" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>` +
        `<circle cx="0" cy="172" r="7" fill="${C.mustardDark}" ${ink(2.5)}/><circle cx="0" cy="278" r="7" fill="${C.mustardDark}" ${ink(2.5)}/>` +
        `<ellipse cx="0" cy="84" rx="262" ry="50" fill="${C.woodLight}" ${ink(OUT)} ${MASK}/>` +
        `<ellipse cx="0" cy="88" rx="236" ry="38" fill="${C.clay}" ${MASK}/>` +
        `<path d="M-112,74 A112,16 0 0 0 112,74 M-200,80 C-170,72 -140,70 -116,74 M116,74 C140,70 170,72 200,80 M-176,104 C-150,112 -120,116 -96,116" stroke="${C.clayLight}" stroke-width="5" fill="none" stroke-linecap="round" ${MASK}/>` +
        `<ellipse cx="0" cy="88" rx="236" ry="38" fill="none" ${ink(IN)} ${MASK}/>` +
        `<path d="${NECK}" stroke="${C.ink}" stroke-width="${IN}" fill="none" stroke-linecap="round"/>` +
        bubble(-196, 94, 10) + bubble(-176, 82, 6) + bubble(190, 96, 9) + bubble(170, 80, 5.5) + bubble(124, 112, 6.5) + bubble(-112, 114, 7.5) +
        `<ellipse cx="-238" cy="106" rx="9" ry="5" fill="${C.clay}" ${ink(2)}/><ellipse cx="236" cy="110" rx="8" ry="4.5" fill="${C.clay}" ${ink(2)}/><ellipse cx="20" cy="130" rx="10" ry="5" fill="${C.clay}" ${ink(2)}/>`,
    ),
    'mud-head': svgDoc(HEAD_BOX, 1, fillsOnly(head)),
    'mud-head-line': svgDoc(HEAD_BOX, 1, linesOnly(head) + headShine),
    // a cream towel wrapped round the hair: folds, a darker right side, its knot on top
    'mud-towel': svgDoc(
      HEAD_BOX,
      1,
      `<clipPath id="towel"><path d="${TOWEL}"/></clipPath>` +
        `<path d="${TOWEL}" fill="${C.cream}"/>` +
        `<path d="M78,-105 C108,-86 120,-57 111,-28 C96,-38 81,-45 66,-50 C84,-64 87,-86 78,-105 Z" fill="${shade(C.cream)}" clip-path="url(#towel)"/>` +
        `<path d="M-84,-67 C-57,-88 -21,-98 18,-98 M-72,-50 C-39,-67 0,-74 42,-72 M45,-110 C69,-98 84,-82 90,-62" stroke="${C.tileSeam}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
        `<path d="${TOWEL}" fill="none" ${ink(OUT - 1)}/>` +
        `<path d="M-34,-109 C-29,-133 29,-133 34,-109 C24,-97 -24,-97 -34,-109 Z" fill="${C.cream}" ${ink(IN)}/>` +
        `<path d="M-13,-121 C-5,-114 5,-114 13,-121" stroke="${C.tileSeam}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    ),
    // too cold: brows knitted, eyes open and worried, pale blue cheeks, teeth chattering, shivers either side
    'mud-face-cold': face(
      `<path d="M-57,-21 L-24,-33 M57,-21 L24,-33" stroke="${BROW}" stroke-width="6.5" stroke-linecap="round"/>` +
        `<circle cx="-33" cy="0" r="9.75" fill="${EYE}"/><circle cx="33" cy="0" r="9.75" fill="${EYE}"/>` +
        `<circle cx="-36" cy="-3.75" r="3.3" fill="#ffffff"/><circle cx="30" cy="-3.75" r="3.3" fill="#ffffff"/>` +
        `<ellipse cx="-57" cy="34" rx="21" ry="10.5" fill="${C.water}" opacity=".75"/><ellipse cx="57" cy="34" rx="21" ry="10.5" fill="${C.water}" opacity=".75"/>` +
        nose +
        `<path d="M-24,57 l7.5,-7.5 l7.5,7.5 l7.5,-7.5 l7.5,7.5 l7.5,-7.5 l7.5,7.5" ${MOUTH}/>` +
        `<path d="M-114,-40 L-106,-16 M-110,4 L-102,28 M114,-40 L106,-16 M110,4 L102,28" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`,
    ),
    // just right: eyes shut, pink cheeks, a soft smile
    'mud-face-ok': face(
      `<ellipse cx="-57" cy="30" rx="18" ry="9" fill="${C.lotus}" opacity=".45"/><ellipse cx="57" cy="30" rx="18" ry="9" fill="${C.lotus}" opacity=".45"/>` +
        `<path d="M-50,4 Q-36,18 -22,4 M22,4 Q36,18 50,4" ${FEATURE}/>` +
        nose +
        `<path d="M-18,40 Q0,56 18,40" ${MOUTH}/>`,
    ),
    // too hot: eyes squeezed, a wavy mouth, red cheeks, a bead of sweat at the temple
    'mud-face-hot': face(
      `<ellipse cx="-62" cy="30" rx="17" ry="10" fill="${C.lantern}" opacity=".55"/><ellipse cx="62" cy="30" rx="17" ry="10" fill="${C.lantern}" opacity=".55"/>` +
        `<path d="M-50,-4 L-26,6 L-50,16 M50,-4 L26,6 L50,16" ${FEATURE}/>` +
        nose +
        `<path d="M-22,46 Q-11,36 0,46 Q11,56 22,46" ${MOUTH}/>` +
        `<path d="M78,-24 C70,-12 70,-4 78,-2 C86,-4 86,-12 78,-24 Z" fill="${C.water}" ${ink(DET)}/>`,
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
