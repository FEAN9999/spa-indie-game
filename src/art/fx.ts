import { C } from './palette'
import { svgDoc } from './svg'

const STAR_PATH = 'M50,6 L62,36 L94,38 L69,58 L78,90 L50,72 L22,90 L31,58 L6,38 L38,36Z'
const OUTLINE = `stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"`
const ICON = `stroke="${C.ink}" stroke-width="2.6"`

const bubble = (inner: string) =>
  svgDoc(
    [0, 0, 70, 64],
    1,
    `<path d="M8,4 H62 Q68,4 68,10 V40 Q68,46 62,46 H42 L35,58 L28,46 H8 Q2,46 2,40 V10 Q2,4 8,4Z" fill="${C.cream}" ${OUTLINE}/>${inner}`,
  )

export function fxTextures(): Record<string, string> {
  return {
    // a coin with a square hole, like the old xu
    coin: svgDoc(
      [0, 0, 48, 48],
      1,
      `<circle cx="24" cy="24" r="20" fill="${C.mustard}" ${OUTLINE}/>` +
        `<circle cx="24" cy="24" r="14.5" fill="none" stroke="${C.mustardDark}" stroke-width="2.5"/>` +
        `<rect x="18.5" y="18.5" width="11" height="11" fill="${C.paper}" ${INNER}/>`,
    ),
    shadow: svgDoc([0, 0, 60, 20], 1, `<ellipse cx="30" cy="10" rx="28" ry="8" fill="${C.ink}" opacity="0.18"/>`),
    'bubble-happy': bubble(
      `<path d="M35,38 C22,29 20,22 24,17 C28,13 33,15 35,19 C37,15 42,13 46,17 C50,22 48,29 35,38Z" fill="${C.lotusDark}" ${INNER}/>`,
    ),
    'bubble-ok': bubble(
      `<circle cx="35" cy="25" r="15" fill="${C.mustard}" ${INNER}/><circle cx="30" cy="22" r="2" fill="${C.ink}"/><circle cx="40" cy="22" r="2" fill="${C.ink}"/>` +
        `<path d="M29,30 Q35,33 41,30" stroke="${C.ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    ),
    'bubble-angry': bubble(
      `<circle cx="35" cy="25" r="15" fill="${C.lantern}" ${INNER}/><path d="M27,19 L33,22 M43,19 L37,22" stroke="${C.cream}" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="30" cy="25" r="2" fill="${C.cream}"/><circle cx="40" cy="25" r="2" fill="${C.cream}"/>` +
        `<path d="M29,33 Q35,28 41,33" stroke="${C.cream}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    ),
    ripple: svgDoc([0, 0, 80, 80], 1, `<circle cx="40" cy="40" r="34" fill="none" stroke="#ffffff" stroke-width="6"/>`),
    star: svgDoc([0, 0, 100, 96], 0.9, `<path d="${STAR_PATH}" fill="${C.mustard}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`),
    'star-empty': svgDoc(
      [0, 0, 100, 96],
      0.9,
      `<path d="${STAR_PATH}" fill="${C.tileSeam}" stroke="${C.ink}" stroke-opacity="0.35" stroke-width="6" stroke-linejoin="round"/>`,
    ),
    // bottom bar icons, from the board
    'icon-build': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g transform="rotate(-40 32 32)" ${ICON}><rect x="28.5" y="22" width="7" height="36" rx="3.5" fill="${C.wood}"/><rect x="16" y="9" width="32" height="15" rx="5" fill="${C.terracotta}"/></g>`,
    ),
    'icon-staff': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><circle cx="43" cy="22" r="7" fill="${C.mustard}"/><rect x="33" y="31" width="20" height="21" rx="9" fill="${C.mustard}"/>` +
        `<circle cx="23" cy="21" r="8" fill="${C.teal}"/><rect x="12" y="31" width="23" height="23" rx="10" fill="${C.teal}"/></g>`,
    ),
    'icon-services': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><ellipse cx="21" cy="36" rx="7" ry="15" fill="${C.lotus}" transform="rotate(-38 21 36)"/><ellipse cx="43" cy="36" rx="7" ry="15" fill="${C.lotus}" transform="rotate(38 43 36)"/>` +
        `<ellipse cx="32" cy="31" rx="8" ry="18" fill="${C.lotusDark}"/><rect x="14" y="49" width="36" height="5" rx="2.5" fill="${C.teal}"/></g>`,
    ),
    'icon-quests': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><rect x="13" y="10" width="38" height="47" rx="6" fill="${C.terracotta}"/><rect x="18" y="16" width="28" height="36" rx="3" fill="${C.cream}"/>` +
        `<rect x="24" y="5" width="16" height="10" rx="3" fill="${C.mustard}"/>` +
        `<path d="M23,27 H41 M23,35 H41 M23,43 H34" stroke="${C.terracotta}" stroke-width="3" stroke-linecap="round"/></g>`,
    ),
  }
}
