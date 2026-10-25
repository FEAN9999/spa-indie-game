import { C } from './palette'
import { svgDoc } from './svg'

/** Hair zone of `sh-hair` relative to its top-left, used for hit tests in ShampooScene. */
export const SH_HAIR = { w: 420, h: 300 }

export function shampooTextures(): Record<string, string> {
  return {
    // basin and headrest seen from above; the customer's head lies with the hair towards the basin
    'sh-basin': svgDoc(
      [0, 0, 760, 560],
      1,
      `<rect x="20" y="10" width="720" height="380" rx="150" fill="#ffffff" stroke="#e8dcd2" stroke-width="8"/>` +
        `<ellipse cx="380" cy="190" rx="290" ry="135" fill="${C.water}"/>` +
        `<ellipse cx="380" cy="190" rx="250" ry="105" fill="#d3eef8"/>` +
        `<circle cx="380" cy="300" r="12" fill="#c9c9d6"/>` +
        `<rect x="150" y="330" width="460" height="230" rx="90" fill="${C.lavender}"/>` +
        `<rect x="200" y="360" width="360" height="200" rx="80" fill="${C.lavenderLight}"/>`,
    ),
    // face from above, eyes closed; tinted with the skin color
    'sh-head': svgDoc(
      [0, 0, 360, 380],
      1,
      `<ellipse cx="22" cy="200" rx="26" ry="36" fill="#f0f0f0"/><ellipse cx="338" cy="200" rx="26" ry="36" fill="#f0f0f0"/>` +
        `<ellipse cx="180" cy="190" rx="160" ry="180" fill="#ffffff"/>` +
        `<path d="M110,235 Q130,250 150,235 M210,235 Q230,250 250,235" stroke="#3d2c26" stroke-width="9" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="95" cy="280" rx="30" ry="16" fill="#f49a9a" opacity=".6"/><ellipse cx="265" cy="280" rx="30" ry="16" fill="#f49a9a" opacity=".6"/>` +
        `<path d="M160,300 Q180,318 200,300" stroke="#8a5a4a" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    ),
    // hair spread towards the basin; tinted with the hair color
    'sh-hair': svgDoc(
      [0, 0, 420, 300],
      1,
      `<path d="M30,250 Q0,120 90,50 Q210,-20 330,50 Q420,120 390,250 Q360,200 300,215 Q250,170 210,200 Q170,170 120,215 Q60,200 30,250Z" fill="#ffffff"/>` +
        `<path d="M110,80 Q160,40 210,60 M220,55 Q280,40 320,90 M90,140 Q140,100 190,120 M230,120 Q290,100 330,150" stroke="#dcdcdc" stroke-width="8" fill="none" stroke-linecap="round"/>`,
    ),
    'sh-foam': svgDoc(
      [0, 0, 90, 80],
      1,
      `<circle cx="30" cy="45" r="24" fill="#ffffff" stroke="#e3f1f8" stroke-width="3"/><circle cx="58" cy="32" r="20" fill="#ffffff" stroke="#e3f1f8" stroke-width="3"/>` +
        `<circle cx="62" cy="58" r="14" fill="#ffffff" stroke="#e3f1f8" stroke-width="3"/>` +
        `<circle cx="22" cy="36" r="5" fill="#dff3fb"/><circle cx="52" cy="25" r="4" fill="#dff3fb"/>`,
    ),
    'sh-drop': svgDoc([0, 0, 24, 34], 1, `<path d="M12,2 Q22,18 21,23 A9,9 0 0 1 3,23 Q2,18 12,2Z" fill="#8fd0ee"/><circle cx="9" cy="21" r="3" fill="#d6f0fb"/>`),
    'sh-towel': svgDoc(
      [0, 0, 230, 150],
      1,
      `<rect x="10" y="20" width="210" height="120" rx="26" fill="${C.pink}"/>` +
        `<rect x="10" y="10" width="210" height="60" rx="22" fill="#f8bfcd"/>` +
        `<path d="M30,100 H200 M30,118 H200" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>`,
    ),
    'sh-shower': svgDoc(
      [0, 0, 150, 210],
      1,
      `<path d="M75,90 Q75,170 130,205" stroke="#b8bccb" stroke-width="12" fill="none" stroke-linecap="round"/>` +
        `<rect x="55" y="70" width="40" height="40" rx="10" fill="#c9c9d6"/>` +
        `<ellipse cx="75" cy="50" rx="60" ry="42" fill="#dcdde6" stroke="#b8bccb" stroke-width="6"/>` +
        `<g fill="#8fa1b8"><circle cx="55" cy="40" r="5"/><circle cx="75" cy="36" r="5"/><circle cx="95" cy="40" r="5"/><circle cx="62" cy="58" r="5"/><circle cx="88" cy="58" r="5"/></g>`,
    ),
  }
}
