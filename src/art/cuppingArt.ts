import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

const OUTLINE = `stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"`

const CUP_BOX: Box = [-64, -64, 128, 128]
const TRAY_BOX: Box = [-300, -84, 600, 168]

/** Where each cup sits on the tray, in pixels from the tray's centre. */
export const CP_TRAY_CUPS: readonly { x: number; y: number }[] = [-170, 0, 170].map(x => ({ x, y: -6 }))

/** The Giác hơi pictures: a glass cup seen from above, the skin it pulls up and the round mark it leaves (white, to tint), an empty mark on the back, and the tray of cups. */
export function cuppingTextures(): Record<string, string> {
  return {
    // a clear glass cup from above: a thick rim, the glass a little blue, two shines that stay light
    'cp-cup': svgDoc(
      CUP_BOX,
      1,
      `<circle cx="0" cy="0" r="56" fill="${C.glass}" fill-opacity=".45" ${OUTLINE}/>` +
        `<circle cx="0" cy="0" r="43" fill="none" stroke="${C.glass}" stroke-width="7" opacity=".9"/>` +
        `<path d="M-34,-14 Q-28,-34 -8,-40" stroke="${C.cream}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".85"/>` +
        `<circle cx="26" cy="24" r="5" fill="${C.cream}" opacity=".8"/>`,
    ),
    // the skin under the cup, round and soft: tinted from the skin through pink to red
    'cp-skin': svgDoc(CUP_BOX, 1, `<circle cx="0" cy="0" r="46" fill="#ffffff"/>`),
    // a dashed ring on a pale ground, where a cup can go
    'cp-mark': svgDoc(
      CUP_BOX,
      1,
      `<circle cx="0" cy="0" r="52" fill="${C.paper}" fill-opacity=".55" stroke="${C.ink}" stroke-width="5" stroke-dasharray="13 9"/>`,
    ),
    // a low wooden tray with a well for each cup
    'cp-tray': svgDoc(
      TRAY_BOX,
      1,
      `<rect x="-288" y="-70" width="576" height="140" rx="40" fill="${C.wood}" ${OUTLINE}/>` +
        `<rect x="-268" y="-54" width="536" height="104" rx="30" fill="${C.woodLight}" ${INNER}/>` +
        CP_TRAY_CUPS.map(p => `<circle cx="${p.x}" cy="${p.y}" r="58" fill="${C.paper}" ${INNER}/>`).join('') +
        `<path d="M-250,58 Q0,80 250,58" stroke="${C.woodDark}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    ),
  }
}
