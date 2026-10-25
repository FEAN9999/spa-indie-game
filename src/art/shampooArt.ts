import { C } from './palette'
import { svgDoc } from './svg'

/** Hair zone of `sh-hair` relative to its top-left, used for hit tests in ShampooScene. */
export const SH_HAIR = { w: 420, h: 300 }

const OUTLINE = `stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"`

export function shampooTextures(): Record<string, string> {
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
    // face from above, eyes closed; tinted with the skin color
    'sh-head': svgDoc(
      [0, 0, 360, 380],
      1,
      `<ellipse cx="30" cy="200" rx="24" ry="36" fill="#f0f0f0" ${OUTLINE}/><ellipse cx="330" cy="200" rx="24" ry="36" fill="#f0f0f0" ${OUTLINE}/>` +
        `<ellipse cx="180" cy="190" rx="160" ry="180" fill="#ffffff" ${OUTLINE}/>` +
        `<path d="M110,235 Q130,250 150,235 M210,235 Q230,250 250,235" stroke="#2B201C" stroke-width="9" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="95" cy="280" rx="30" ry="16" fill="#F09A86" opacity=".75"/><ellipse cx="265" cy="280" rx="30" ry="16" fill="#F09A86" opacity=".75"/>` +
        `<path d="M160,300 Q180,318 200,300" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    ),
    // hair spread towards the basin; tinted with the hair color
    'sh-hair': svgDoc(
      [0, 0, 420, 300],
      1,
      `<path d="M30,250 Q0,120 90,50 Q210,-20 330,50 Q420,120 390,250 Q360,200 300,215 Q250,170 210,200 Q170,170 120,215 Q60,200 30,250Z" fill="#ffffff" ${OUTLINE}/>` +
        `<path d="M110,80 Q160,40 210,60 M220,55 Q280,40 320,90 M90,140 Q140,100 190,120 M230,120 Q290,100 330,150" stroke="#dcdcdc" stroke-width="8" fill="none" stroke-linecap="round"/>`,
    ),
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
