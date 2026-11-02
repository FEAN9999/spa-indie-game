import { ink } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// Nét A+: viền ngoài, nét trong, nét chi tiết. Hình ở đây chỉ dùng màu trong bảng màu (bóng bằng màu sẫm hơn có sẵn)
const OUT = 7
const IN = 4.5
const DET = 3

const CUP_BOX: Box = [-64, -64, 128, 128]
const TRAY_BOX: Box = [-300, -84, 600, 168]

/** Where each cup sits on the tray, in pixels from the tray's centre. */
export const CP_TRAY_CUPS: readonly { x: number; y: number }[] = [-170, 0, 170].map(x => ({ x, y: -6 }))

const TRAY = 'x="-288" y="-70" width="576" height="140" rx="40"'

/** The Giác hơi pictures: a glass cup seen from above, the skin it pulls up and the round mark it leaves (white, to tint), an empty mark on the back, and the tray of cups. */
export function cuppingTextures(): Record<string, string> {
  return {
    // a clear glass cup from above: a thick rim, its lower right in deeper blue, a thin inner edge, two white shines
    'cp-cup': svgDoc(
      CUP_BOX,
      1,
      `<circle cx="0" cy="0" r="41.4" fill="${C.glass}" fill-opacity=".3"/>` +
        `<circle cx="0" cy="0" r="48.6" fill="none" stroke="${C.glass}" stroke-width="14.5"/>` +
        `<path d="M47.6,12.4 A48.6,48.6 0 0 1 -12.4,47.6" fill="none" stroke="${C.waterDeep}" stroke-width="14.5"/>` +
        `<circle cx="0" cy="0" r="41.4" fill="none" stroke="${C.ink}" stroke-width="${DET}"/>` +
        `<path d="M-37.3,-16.6 Q-29,-41.4 -4.1,-47.6" stroke="#FFFFFF" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        `<path d="M-16.6,-12.4 Q-12.4,-22.8 -2.1,-24.8" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>` +
        `<circle cx="0" cy="0" r="56" fill="none" ${ink(OUT - 1)}/>`,
    ),
    // the skin under the cup, round and soft: tinted from the skin through pink to red
    'cp-skin': svgDoc(CUP_BOX, 1, `<circle cx="0" cy="0" r="46" fill="#ffffff"/>`),
    // a dashed ring on a pale ground, where a cup can go
    'cp-mark': svgDoc(
      CUP_BOX,
      1,
      `<circle cx="0" cy="0" r="52" fill="${C.paper}" fill-opacity=".55" stroke="${C.ink}" stroke-width="5" stroke-dasharray="13 9"/>`,
    ),
    // a low wooden tray seen from above: its shadow on the floor, a darker right edge, a lighter bed and a hollow well for each cup
    'cp-tray': svgDoc(
      TRAY_BOX,
      1,
      `<clipPath id="tray"><rect ${TRAY}/></clipPath>` +
        `<rect x="-278" y="-58" width="576" height="140" rx="40" fill="${C.ink}" opacity=".18"/>` +
        `<rect ${TRAY} fill="${C.wood}"/>` +
        `<rect x="238" y="-70" width="52" height="140" fill="${C.woodDark}" clip-path="url(#tray)"/>` +
        `<path d="M-238,-60 H0" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".45"/>` +
        `<rect ${TRAY} fill="none" ${ink(OUT)}/>` +
        `<rect x="-260" y="-51" width="521" height="102" rx="36" fill="${C.woodLight}" ${ink(IN)}/>` +
        `<path d="M-236,40 H-120 M60,-38 H220" stroke="${C.wood}" stroke-width="5" stroke-linecap="round"/>` +
        CP_TRAY_CUPS.map(
          p =>
            `<circle cx="${p.x}" cy="${p.y}" r="58" fill="${C.tileSeam}"/>` +
            `<circle cx="${p.x + 6}" cy="${p.y + 6}" r="52" fill="${C.paper}"/>` +
            `<circle cx="${p.x}" cy="${p.y}" r="58" fill="none" ${ink(IN)}/>`,
        ).join(''),
    ),
  }
}
