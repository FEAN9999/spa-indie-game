import { HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// Mặt khách nằm ngửa trên gối như bản A+ đã duyệt, vẽ thẳng trong toạ độ thẻ: băng đô kem trên trán, tóc xoã trên gối,
// khăn đất nung ở vai. Mặt đủ to để mọi chỗ mụn có thể mọc (ACNE_AT) rơi vào má, sống mũi, cằm, không đè lên mắt, mũi, miệng.

const BOX: Box = [80, 450, 920, 1140]
/** Góc trên trái của mọi texture nặn mụn trên thẻ: đặt ảnh ở đây với gốc (0, 0). */
export const AC_TOPLEFT = { x: BOX[0], y: BOX[1] }
/** Vùng da trống giữa mặt (elip trong khuôn mặt) nơi các nốt mụn nằm. */
export const AC_SKIN = { x: 540, y: 1000, rx: 300, ry: 300 }
/** Mép dưới của mắt nhắm (cả mi) và mép trên của miệng: quầng mụn nằm giữa hai mép này. */
export const AC_CLEAR = { eyes: 828, mouth: 1233 }

const BROWN = '#2B201C'
/** Nét đậm hơn mảng bóng trong phần được tô màu: sợi tóc, nếp tai, môi dưới, sợi lông mày. */
const TINT_DEEP = shade('#FFFFFF', 0.3)
/** Lật một đường vẽ qua trục giữa mặt (x = 540). */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${1080 - Number(x)},${y}`)
const f = (n: number) => Math.round(n * 10) / 10

const PILLOW = 'M210,480 H870 A90,90 0 0 1 960,570 V1340 A90,90 0 0 1 870,1430 H210 A90,90 0 0 1 120,1340 V570 A90,90 0 0 1 210,480 Z'
const HAIR =
  'M160,830 C140,610 310,486 540,486 C770,486 940,610 920,830 C916,930 896,1010 876,1060 C870,1000 868,940 866,880 ' +
  'C858,700 726,592 540,592 C354,592 222,700 214,880 C212,940 210,1000 204,1060 C184,1010 164,930 160,830 Z'
const FACE = 'M540,560 C720,560 870,650 875,880 C880,1060 840,1180 760,1260 C700,1318 620,1345 540,1345 C460,1345 380,1318 320,1260 C240,1180 200,1060 205,880 C210,650 360,560 540,560 Z'
const BAND = 'M205,705 C215,615 370,555 540,555 C710,555 865,615 875,705 C775,668 660,652 540,652 C420,652 305,668 205,705 Z'
const TOWEL = 'M100,1585 C150,1450 340,1392 540,1398 C740,1392 930,1450 980,1585 Z'
const BROW_LEFT = 'M288,752 C320,724 382,712 440,716 C462,718 476,724 482,733 C484,741 476,745 468,743 C446,737 418,735 390,737 C346,741 314,751 294,765 Z'
const EYE_LEFT = { from: { x: 300, y: 790 }, bend: { x: 385, y: 832 }, to: { x: 470, y: 790 } }

/** Phần trong `clip` của `body`: mảng bóng và điểm sáng không tràn khỏi hình. */
const inside = (id: string, clip: string, body: string) => `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})">${body}</g>`

/** Mi của mắt trái: mọc từ đường mí cong xuống, nghiêng ra hai khoé. */
const lashesLeft = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]
  .map(t => {
    const { from: a, bend: b, to: c } = EYE_LEFT
    const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t * t * c.x
    const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * b.y + t * t * c.y
    return `M${f(x)},${f(y + 1)} L${f(x + (t - 0.5) * 12)},${f(y + 15)}`
  })
  .join(' ')

export function acneTextures(): Record<string, string> {
  // tóc xoã trên gối quanh đầu, sau mặt; tô màu tóc
  const hair = `<path d="${HAIR}" fill="#ffffff" ${ink(7)}/>`
  const hairShade =
    inside('hs', HAIR, `<path d="M800,540 C900,620 930,740 920,860 C914,950 896,1010 876,1060 L960,1060 L960,500 Z" fill="${TINT_SHADE}"/>`) +
    `<path d="M300,548 C250,606 222,684 208,760 M780,548 C830,606 858,684 872,760 M420,506 C380,534 352,564 334,600 M660,506 C700,534 728,564 746,600" stroke="${TINT_DEEP}" stroke-width="6" fill="none" stroke-linecap="round"/>`
  // hai tai, cổ, khuôn mặt cằm thon; tô màu da
  const skin =
    `<ellipse cx="212" cy="905" rx="34" ry="60" fill="#ffffff" ${ink(6)}/><ellipse cx="868" cy="905" rx="34" ry="60" fill="#ffffff" ${ink(6)}/>` +
    `<path d="M462,1250 L462,1440 L618,1440 L618,1250 Z" fill="#ffffff" ${ink(6)}/>` +
    `<path d="M466,1330 H614 V1436 H466 Z" fill="${TINT_SHADE}"/>` +
    `<path d="${FACE}" fill="#ffffff" ${ink(7)}/>`
  const skinShade =
    inside(
      'fs',
      FACE,
      `<path d="M790,650 C860,720 885,850 878,970 C872,1110 830,1220 750,1290 C690,1335 620,1348 560,1346 C680,1320 780,1240 815,1120 C845,1010 842,830 790,650 Z" fill="${TINT_SHADE}"/>` +
        `<path d="M205,705 C305,668 420,652 540,652 C660,652 775,668 875,705 L875,737 C775,702 660,686 540,686 C420,686 305,702 205,737 Z" fill="${TINT_SHADE}"/>` +
        `<ellipse cx="572" cy="962" rx="22" ry="8" fill="${TINT_SHADE}"/>`,
    ) +
    `<path d="M204,872 C226,890 226,924 208,944 ${mirror('M204,872 C226,890 226,924 208,944')}" fill="none" stroke="${TINT_DEEP}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M520,1272 C532,1279 548,1279 560,1272" fill="none" stroke="${TINT_DEEP}" stroke-width="6" stroke-linecap="round"/>`
  // hai chân mày thuôn; tô màu tóc
  const brows = `<path d="${BROW_LEFT}" fill="#ffffff" ${ink(3.5)}/><path d="${mirror(BROW_LEFT)}" fill="#ffffff" ${ink(3.5)}/>`
  const browStrands = `<path d="M304,758 L316,746 M334,744 L348,734 M366,734 L382,726 M400,728 L418,724 M436,726 L454,724 ${mirror('M304,758 L316,746 M334,744 L348,734 M366,734 L382,726 M400,728 L418,724 M436,726 L454,724')}" stroke="${TINT_DEEP}" stroke-width="3" fill="none" stroke-linecap="round"/>`

  // mắt nhắm có mi, mũi, miệng: nét nâu không tô màu
  const eye = `M${EYE_LEFT.from.x},${EYE_LEFT.from.y} Q${EYE_LEFT.bend.x},${EYE_LEFT.bend.y} ${EYE_LEFT.to.x},${EYE_LEFT.to.y}`
  const features =
    `<path d="${eye} ${mirror(eye)}" fill="none" stroke="${BROWN}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="${lashesLeft} ${mirror(lashesLeft)}" fill="none" stroke="${BROWN}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M560,880 C566,915 574,940 588,956 C576,972 552,976 532,968" fill="none" ${ink(5)}/>` +
    `<path d="M488,1236 C514,1258 566,1258 592,1236" fill="none" ${ink(6)}/>`
  const shine =
    inside('hh', HAIR, `<path d="M262,582 C302,532 382,502 462,496" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" opacity=".35"/>`) +
    inside(
      'sh',
      FACE,
      `<ellipse cx="300" cy="930" rx="44" ry="15" ${HIGHLIGHT} transform="rotate(-14 300 930)"/>` +
        `<ellipse cx="584" cy="944" rx="9" ry="5" ${HIGHLIGHT}/>` +
        `<ellipse cx="300" cy="1088" rx="96" ry="42" fill="${C.lotus}" opacity=".32"/><ellipse cx="780" cy="1088" rx="96" ry="42" fill="${C.lotus}" opacity=".32"/>`,
    )
  // băng đô kem vắt ngang trán, nếp gấp, mảng bóng mép dưới
  const band =
    `<path d="${BAND}" fill="${C.cream}"/>` +
    inside(
      'bd',
      BAND,
      `<path d="M205,705 C305,668 420,652 540,652 C660,652 775,668 875,705 L875,690 C775,653 660,637 540,637 C420,637 305,653 205,690 Z" fill="${shade(C.cream)}"/>` +
        `<path d="M330,590 C338,604 340,620 336,636 M450,566 C454,586 454,606 450,624 M630,566 C626,586 626,606 630,624 M750,590 C742,604 740,620 744,636" fill="none" stroke="${C.tileSeam}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M250,640 C300,600 380,574 460,566" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".45"/>`,
    ) +
    `<path d="${BAND}" fill="none" ${ink(7)}/>`
  // khăn đất nung đắp vai, hai sọc kem
  const towel =
    `<path d="${TOWEL}" fill="${C.terracotta}"/>` +
    inside(
      'tw',
      TOWEL,
      `<path d="M760,1400 C880,1420 960,1490 980,1585 L900,1585 C880,1500 840,1440 760,1400 Z" fill="${shade(C.terracotta)}"/>` +
        `<path d="M190,1520 C330,1470 750,1470 890,1520 M150,1562 C300,1516 780,1516 930,1562" fill="none" stroke="${C.cream}" stroke-width="9" stroke-linecap="round"/>`,
    ) +
    `<path d="${TOWEL}" fill="none" ${ink(7)}/>`

  return {
    // gối kem viền khâu xanh ngọc, nằm yên khi mặt giật
    'ac-pillow': svgDoc(
      BOX,
      1,
      `<path d="${PILLOW}" fill="${C.cream}"/>` +
        inside(
          'pl',
          PILLOW,
          `<path d="M900,490 C950,560 960,700 960,1340 C950,1400 910,1430 860,1430 L980,1430 L980,480 Z" fill="${shade(C.cream)}"/>` +
            `<path d="M150,640 C160,560 200,512 280,500" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" opacity=".6"/>`,
        ) +
        `<path d="M216,506 H864 A66,66 0 0 1 934,572 V1338 A66,66 0 0 1 864,1404 H216 A66,66 0 0 1 146,1338 V572 A66,66 0 0 1 216,506 Z" fill="none" stroke="${C.mintTeal}" stroke-width="6" stroke-dasharray="20 16"/>` +
        `<path d="${PILLOW}" fill="none" ${ink(7)}/>`,
    ),
    // phần tô màu giữ nét nâu ở `ac-face-line`, vẽ sau cùng không bị tô; điểm sáng, má hồng, băng đô, khăn cũng ở đó
    'ac-hair': svgDoc(BOX, 1, fillsOnly(hair) + hairShade),
    'ac-face': svgDoc(BOX, 1, fillsOnly(skin) + skinShade),
    'ac-brow': svgDoc(BOX, 1, fillsOnly(brows) + browStrands),
    'ac-face-line': svgDoc(BOX, 1, linesOnly(hair + skin + brows) + shine + features + band + towel),
  }
}
