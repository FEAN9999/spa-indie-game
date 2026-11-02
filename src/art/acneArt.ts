import { HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// Mặt khách nhìn thẳng, phóng to qua vành đèn lúp, vẽ thẳng trong toạ độ thẻ: mọi chỗ mụn có thể mọc (ACNE_AT)
// rơi vào má, sống mũi, cằm, không đè lên mắt, mũi, miệng.

/** Ô kính: tâm và bán kính elip của vùng da, như bản cũ. */
const SKIN = { x: 540, y: 1010, rx: 410, ry: 300 }
const BOX: Box = [94, 680, 892, 660]
/** Góc trên trái của mọi texture nặn mụn trên thẻ: đặt ảnh ở đây với gốc (0, 0). */
export const AC_TOPLEFT = { x: BOX[0], y: BOX[1] }

const BROWN = '#2B201C'
/** Nét đậm hơn mảng bóng trong phần được tô màu: môi dưới, sợi lông mày. */
const TINT_DEEP = shade('#FFFFFF', 0.3)
const SKIN_PATH = `M${SKIN.x - SKIN.rx},${SKIN.y} a${SKIN.rx},${SKIN.ry} 0 1,0 ${2 * SKIN.rx},0 a${SKIN.rx},${SKIN.ry} 0 1,0 ${-2 * SKIN.rx},0 Z`
const BROW_LEFT = 'M268,790 C300,756 360,738 420,736 C448,736 470,742 482,750 C486,756 482,762 474,762 C452,756 426,754 400,756 C350,760 306,772 276,800 Z'
/** Lật một đường vẽ qua trục giữa mặt (x = 540). */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${1080 - Number(x)},${y}`)

/** Phần trong `clip` của `body`: mảng bóng và điểm sáng không tràn khỏi da. */
const inside = (id: string, clip: string, body: string) => `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})">${body}</g>`
const f = (n: number) => Math.round(n * 10) / 10

export function acneTextures(): Record<string, string> {
  // da mặt trong ô kính; tô màu da
  const skin = `<path d="${SKIN_PATH}" fill="#ffffff" ${ink(6)}/>`
  const skinShade =
    inside(
      'ss',
      SKIN_PATH,
      `<path d="M850,760 C930,870 950,1010 920,1150 C890,1250 830,1300 780,1320 L960,1320 L960,700 Z" fill="${TINT_SHADE}"/>` +
        `<path d="M300,806 C350,790 430,790 482,806 C470,794 440,784 400,782 C350,782 318,792 300,806 Z" fill="${TINT_SHADE}"/>` +
        `<path d="${mirror('M300,806 C350,790 430,790 482,806 C470,794 440,784 400,782 C350,782 318,792 300,806 Z')}" fill="${TINT_SHADE}"/>` +
        `<ellipse cx="590" cy="962" rx="28" ry="10" fill="${TINT_SHADE}"/>`,
    ) + `<path d="M516,1254 C530,1260 552,1260 566,1254" fill="none" stroke="${TINT_DEEP}" stroke-width="6" stroke-linecap="round"/>`
  // hai chân mày thuôn; tô màu tóc
  const brows =
    `<path d="${BROW_LEFT}" fill="#ffffff" ${ink(3.5)}/><path d="${mirror(BROW_LEFT)}" fill="#ffffff" ${ink(3.5)}/>` +
    `<path d="M300,776 L312,764 M330,762 L344,752 M362,752 L378,744 M396,746 L414,742 M432,744 L450,742 ${mirror('M300,776 L312,764 M330,762 L344,752 M362,752 L378,744 M396,746 L414,742 M432,744 L450,742')}" stroke="${TINT_DEEP}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  // mắt nhắm có mi, mũi, miệng: nét nâu không tô màu
  const eye = 'M300,820 Q390,860 480,820'
  const lash = (x: number) => {
    const t = (x - 300) / 180
    const y = 820 + 2 * t * (1 - t) * 40
    return `M${f(x)},${f(y + 2)} L${f(x + (t - 0.5) * 10)},${f(y + 16)}`
  }
  const lashes = [326, 352, 378, 404, 430, 456].map(lash).join(' ')
  const face =
    `<path d="${eye} ${mirror(eye)}" fill="none" stroke="${BROWN}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="${lashes} ${mirror(lashes)}" fill="none" stroke="${BROWN}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M585,840 C590,880 600,915 616,940 C604,962 572,966 552,956" fill="none" ${ink(5)}/>` +
    `<path d="M468,1212 C506,1240 576,1240 614,1212" fill="none" ${ink(6)}/>`
  const shine =
    inside(
      'sh',
      SKIN_PATH,
      `<ellipse cx="320" cy="944" rx="42" ry="14" ${HIGHLIGHT} transform="rotate(-14 320 944)"/>` +
        `<ellipse cx="576" cy="924" rx="10" ry="5" ${HIGHLIGHT}/>` +
        `<ellipse cx="330" cy="1062" rx="96" ry="42" fill="${C.lotus}" opacity=".32"/><ellipse cx="770" cy="1062" rx="96" ry="42" fill="${C.lotus}" opacity=".32"/>`,
    )
  // vành đèn lúp kem, đèn nhỏ quanh vành
  const rim =
    `<ellipse cx="${SKIN.x}" cy="${SKIN.y}" rx="${SKIN.rx + 14}" ry="${SKIN.ry + 14}" fill="none" stroke="${C.ink}" stroke-width="32"/>` +
    `<ellipse cx="${SKIN.x}" cy="${SKIN.y}" rx="${SKIN.rx + 14}" ry="${SKIN.ry + 14}" fill="none" stroke="${C.cream}" stroke-width="20"/>` +
    `<path d="M196,820 C250,760 330,724 420,712" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".7"/>` +
    `<path d="M920,1160 C870,1250 780,1306 670,1322" fill="none" stroke="${shade(C.cream)}" stroke-width="11" stroke-linecap="round"/>` +
    `<g fill="${C.glow}" ${ink(2.5)}>` +
    [0, 45, 90, 135, 180, 225, 270, 315]
      .map(d => {
        const a = (d * Math.PI) / 180
        return `<circle cx="${f(SKIN.x + Math.cos(a) * (SKIN.rx + 14))}" cy="${f(SKIN.y + Math.sin(a) * (SKIN.ry + 14))}" r="7"/>`
      })
      .join('') +
    `</g>`
  return {
    // phần tô màu giữ nét nâu ở `ac-face-line`, vẽ sau cùng không bị tô
    'ac-face': svgDoc(BOX, 1, fillsOnly(skin) + skinShade),
    'ac-brow': svgDoc(BOX, 1, fillsOnly(brows)),
    'ac-face-line': svgDoc(BOX, 1, linesOnly(skin) + linesOnly(brows) + shine + face + rim),
  }
}
