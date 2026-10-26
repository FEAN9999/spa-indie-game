import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

/** Hair zone of `sh-hair` relative to its top-left, used for hit tests in ShampooScene. */
export const SH_HAIR = { w: 420, h: 300 }

const OUTLINE = `stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"`

export function shampooTextures(): Record<string, string> {
  // face from above, eyes closed; tinted with the skin color
  const head =
    `<ellipse cx="30" cy="200" rx="24" ry="36" fill="#f0f0f0" ${OUTLINE}/><ellipse cx="330" cy="200" rx="24" ry="36" fill="#f0f0f0" ${OUTLINE}/>` +
    `<ellipse cx="180" cy="190" rx="160" ry="180" fill="#ffffff" ${OUTLINE}/>` +
    `<path d="M110,235 Q130,250 150,235 M210,235 Q230,250 250,235" stroke="#2B201C" stroke-width="9" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="95" cy="280" rx="30" ry="16" fill="#F09A86" opacity=".75"/><ellipse cx="265" cy="280" rx="30" ry="16" fill="#F09A86" opacity=".75"/>` +
    `<path d="M160,300 Q180,318 200,300" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`
  // hair over the top of the head, locks down both cheeks, ends fanned out in the basin; tinted with the hair color.
  // Drawn around the head's centre at (210, 280), where ShampooScene puts it.
  const hair =
    `<path d="M58,288 Q30,250 36,200 Q8,150 30,96 Q58,30 130,22 Q170,4 210,16 Q250,4 290,22 Q362,30 390,96 Q412,150 384,200 Q390,250 362,288 ` +
    `Q350,240 334,210 Q316,180 270,186 Q236,190 210,166 Q184,190 150,186 Q104,180 86,210 Q70,240 58,288Z" fill="#ffffff" ${OUTLINE}/>` +
    `<path d="M150,160 Q130,100 90,64 M190,140 Q180,90 160,48 M230,140 Q240,90 260,48 M270,160 Q290,100 330,64 M64,190 Q50,150 62,110 M356,190 Q370,150 358,110" stroke="#dcdcdc" stroke-width="8" fill="none" stroke-linecap="round"/>`
  return {
    // porcelain basin and headrest seen from above; the customer's head lies with the hair towards the basin
    'sh-basin': svgDoc(
      [0, 0, 760, 560],
      1,
      `<rect x="20" y="10" width="720" height="380" rx="150" fill="${C.cream}" ${OUTLINE}/>` +
        `<rect x="36" y="26" width="688" height="348" rx="136" fill="none" stroke="${C.cobalt}" stroke-width="6"/>` +
        `<ellipse cx="380" cy="190" rx="290" ry="135" fill="${C.waterDeep}" ${INNER}/>` +
        `<ellipse cx="380" cy="190" rx="250" ry="105" fill="${C.water}"/>` +
        `<circle cx="380" cy="300" r="12" fill="${C.waterDeep}" ${INNER}/>` +
        `<rect x="150" y="330" width="460" height="225" rx="90" fill="${C.wood}" ${OUTLINE}/>` +
        `<rect x="200" y="360" width="360" height="170" rx="70" fill="${C.tealLight}" ${INNER}/>`,
    ),
    // tinted parts keep their brown lines in a `-line` texture, drawn untinted on top
    'sh-head': svgDoc([0, 0, 360, 380], 1, fillsOnly(head)),
    'sh-head-line': svgDoc([0, 0, 360, 380], 1, linesOnly(head)),
    'sh-hair': svgDoc([0, 0, 420, 300], 1, fillsOnly(hair)),
    'sh-hair-line': svgDoc([0, 0, 420, 300], 1, linesOnly(hair)),
    'sh-foam': svgDoc(
      [0, 0, 90, 80],
      1,
      `<g fill="#ffffff" stroke="${C.ink}" stroke-opacity="0.4" stroke-width="2.5">` +
        `<circle cx="30" cy="45" r="24"/><circle cx="58" cy="32" r="20"/><circle cx="62" cy="58" r="14"/></g>` +
        `<circle cx="22" cy="36" r="5" fill="${C.water}"/><circle cx="52" cy="25" r="4" fill="${C.water}"/>`,
    ),
    'sh-drop': svgDoc(
      [0, 0, 24, 34],
      1,
      `<path d="M12,2 Q22,18 21,23 A9,9 0 0 1 3,23 Q2,18 12,2Z" fill="${C.waterDeep}" ${INNER}/><circle cx="9" cy="21" r="3" fill="${C.water}"/>`,
    ),
    'sh-towel': svgDoc(
      [0, 0, 230, 150],
      1,
      `<rect x="10" y="20" width="210" height="120" rx="26" fill="${C.terracotta}" ${OUTLINE}/>` +
        `<rect x="10" y="10" width="210" height="60" rx="22" fill="${C.terracotta}" ${OUTLINE}/>` +
        `<path d="M30,100 H200 M30,118 H200" stroke="${C.cream}" stroke-width="7" stroke-linecap="round"/>`,
    ),
    // brass shower head on its hose
    'sh-shower': svgDoc(
      [0, 0, 150, 210],
      1,
      `<path d="M75,90 Q75,165 128,200" stroke="${C.ink}" stroke-width="18" fill="none" stroke-linecap="round"/>` +
        `<path d="M75,90 Q75,165 128,200" stroke="${C.mustardDark}" stroke-width="11" fill="none" stroke-linecap="round"/>` +
        `<rect x="55" y="70" width="40" height="40" rx="10" fill="${C.mustardDark}" ${OUTLINE}/>` +
        `<ellipse cx="75" cy="50" rx="60" ry="42" fill="${C.mustard}" ${OUTLINE}/>` +
        `<g fill="${C.ink}"><circle cx="55" cy="40" r="5"/><circle cx="75" cy="36" r="5"/><circle cx="95" cy="40" r="5"/><circle cx="62" cy="58" r="5"/><circle cx="88" cy="58" r="5"/></g>`,
    ),
  }
}
