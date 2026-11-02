import { HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'
import { lashSlots } from '../sim/lashes'

type Box = [number, number, number, number]

// Cận cảnh một mắt nhắm qua vành đèn lúp, vẽ thẳng trong toạ độ thẻ: mí đi qua đúng các chấm gắn mi của luật.

/** Vùng da quanh mắt: tâm và bán kính elip, như bản cũ. */
const SKIN = { x: 540, y: 990, rx: 420, ry: 250 }
const BOX: Box = [80, 700, 920, 580]
/** Góc trên trái của mọi texture nối mi trên thẻ: đặt ảnh ở đây với gốc (0, 0). */
export const LS_TOPLEFT = { x: BOX[0], y: BOX[1] }
/** Cỡ ô chọn độ dài mi và thẻ mẫu; texture của chúng có lề 10 điểm ảnh bên trái, 8 bên trên. */
export const LS_PAD = { w: 230, h: 180 }
export const LS_SAMPLE = { w: 500, h: 235 }
/** Lề trên trái của thẻ trong texture ô chọn và thẻ mẫu. */
export const LS_CARD_INSET = { x: 10, y: 8 }

const BROWN = '#2B201C'
/** Nét đậm hơn mảng bóng trong phần được tô màu: nếp mí, mí dưới, sợi lông mày. */
const TINT_DEEP = shade('#FFFFFF', 0.3)
const SKIN_PATH = `M${SKIN.x - SKIN.rx},${SKIN.y} a${SKIN.rx},${SKIN.ry} 0 1,0 ${2 * SKIN.rx},0 a${SKIN.rx},${SKIN.ry} 0 1,0 ${-2 * SKIN.rx},0 Z`
const TEMPLE_EDGE = 'M560,700 C460,722 360,764 300,808 C246,848 206,910 186,1010'
const TEMPLE = `M60,700 L560,700 C460,722 360,764 300,808 C246,848 206,910 186,1010 L60,1010 Z`

/** Phần trong `clip` của `body`: mảng bóng và điểm sáng không tràn khỏi da. */
const inside = (id: string, clip: string, body: string) => `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})">${body}</g>`
const f = (n: number) => Math.round(n * 10) / 10

/** Đường mí đi qua mọi chỗ có thể có chấm, và nếp mí phía trên nó. */
const LID = lashSlots(25)
const span = LID[LID.length - 1].x - LID[0].x
const lidPath = 'M' + LID.map(p => `${f(p.x)},${f(p.y)}`).join(' L')
const creasePath = 'M' + LID.map(p => `${f(p.x)},${f(p.y - 55 - 40 * Math.sin((Math.PI * (p.x - LID[0].x)) / span))}`).join(' L')
/** Mi thật ngắn dọc chân mi, nghiêng ra hai đuôi mắt như mi nối. */
const shortLashes = lashSlots(17)
  .slice(1, -1)
  .map((p, i, all) => {
    const a = (((i + 1) / (all.length + 1) - 0.5) * 2 * 28 * Math.PI) / 180
    const len = 16 + (i % 2) * 6
    return `M${f(p.x)},${f(p.y + 4)} l${f(Math.sin(a) * len)},${f(Math.cos(a) * len)}`
  })
  .join(' ')

export function lashesTextures(): Record<string, string> {
  // da quanh mắt; tô màu da
  const skin = `<path d="${SKIN_PATH}" fill="#ffffff" ${ink(6)}/>`
  const skinShade = inside(
    'ss',
    SKIN_PATH,
    `<path d="M250,905 C350,860 730,860 830,905 C815,876 790,858 760,848 C650,826 430,826 320,848 C290,862 266,882 250,905 Z" fill="${TINT_SHADE}"/>` +
      `<path d="M880,780 C868,880 874,1000 902,1110 C930,1090 960,1010 962,960 L962,780 Z" fill="${TINT_SHADE}"/>` +
      `<path d="${creasePath}" fill="none" stroke="${TINT_DEEP}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M290,1066 C430,1122 650,1122 790,1066" fill="none" stroke="${TINT_DEEP}" stroke-width="5" stroke-linecap="round"/>`,
  )
  // chân mày thuôn có sợi; tóc mai ở góc trên trái; tô màu tóc
  const brow =
    `<path d="M262,846 C330,786 440,752 560,748 C660,744 760,766 806,792 C816,798 812,812 800,812 C748,796 664,782 560,786 C452,790 350,812 272,858 Z" fill="#ffffff" ${ink(3.5)}/>` +
    `<path d="M300,822 L314,806 M336,806 L352,792 M372,795 L390,782 M410,787 L430,776 M452,782 L472,772 M496,778 L516,769 M542,776 L562,768 M590,774 L610,768 M636,776 L656,772 M684,780 L704,778 M730,788 L748,788" stroke="${TINT_DEEP}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  const temple = inside(
    'tp',
    SKIN_PATH,
    `<path d="${TEMPLE}" fill="#ffffff"/>` +
      `<path d="M60,700 L560,700 C500,712 440,730 390,752 L60,752 Z" fill="${TINT_SHADE}"/>` +
      `<path d="M470,714 C400,740 340,776 300,812 M410,716 C346,746 296,786 262,826 M346,724 C290,756 250,796 228,840 M210,880 C196,920 188,960 184,1000" fill="none" stroke="${TINT_DEEP}" stroke-width="4" stroke-linecap="round"/>`,
  )
  // nét không tô màu: mép tóc mai, sống mũi, mí và mi thật, điểm sáng, má hồng, vành đèn lúp
  const lines =
    inside(
      'ln',
      SKIN_PATH,
      `<path d="${TEMPLE_EDGE}" fill="none" ${ink(5)}/>` +
        `<path d="M880,780 C868,880 874,1000 902,1110" fill="none" ${ink(4)}/>` +
        `<path d="M400,848 C480,832 600,832 680,842 C600,844 480,848 408,858 Z" ${HIGHLIGHT}/>` +
        `<ellipse cx="330" cy="1176" rx="52" ry="14" ${HIGHLIGHT} transform="rotate(-10 330 1176)"/>` +
        `<ellipse cx="560" cy="1222" rx="170" ry="30" fill="${C.lotus}" opacity=".3"/>`,
    ) +
    `<path d="${shortLashes}" fill="none" stroke="${BROWN}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="${lidPath}" fill="none" ${ink(9)}/>` +
    `<ellipse cx="${SKIN.x}" cy="${SKIN.y}" rx="${SKIN.rx + 14}" ry="${SKIN.ry + 14}" fill="none" stroke="${C.ink}" stroke-width="32"/>` +
    `<ellipse cx="${SKIN.x}" cy="${SKIN.y}" rx="${SKIN.rx + 14}" ry="${SKIN.ry + 14}" fill="none" stroke="${C.cream}" stroke-width="20"/>` +
    `<path d="M200,812 C260,768 330,744 400,736" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".7"/>` +
    `<path d="M930,1110 C880,1190 790,1240 680,1254" fill="none" stroke="${shade(C.cream)}" stroke-width="11" stroke-linecap="round"/>` +
    `<g fill="${C.glow}" ${ink(2.5)}>` +
    [0, 45, 90, 135, 180, 225, 270, 315]
      .map(d => {
        const a = (d * Math.PI) / 180
        return `<circle cx="${f(SKIN.x + Math.cos(a) * (SKIN.rx + 14))}" cy="${f(SKIN.y + Math.sin(a) * (SKIN.ry + 14))}" r="7"/>`
      })
      .join('') +
    `</g>`
  // thẻ kem viền nâu: mảng bóng mép cứng dọc đáy và cạnh phải, vệt sáng góc trên trái
  const card = (w: number, h: number, r: number, fill: string) => {
    const rect = `M${10 + r},8 H${10 + w - r} A${r},${r} 0 0 1 ${10 + w},${8 + r} V${8 + h - r} A${r},${r} 0 0 1 ${10 + w - r},${8 + h} H${10 + r} A${r},${r} 0 0 1 10,${8 + h - r} V${8 + r} A${r},${r} 0 0 1 ${10 + r},8 Z`
    return svgDoc(
      [0, 0, w + 20, h + 20],
      1,
      `<path d="${rect}" fill="${fill}"/>` +
        inside('cd', rect, `<path d="M10,${8 + h - 22} H${10 + w - 20} V8 H${10 + w} V${8 + h} H10 Z" fill="${shade(fill)}"/>`) +
        `<path d="M${10 + r * 0.8},${8 + 14} C${10 + w * 0.2},${8 + 12} ${10 + w * 0.35},${8 + 12} ${10 + w * 0.45},${8 + 12}" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".55"/>` +
        `<path d="${rect}" fill="none" ${ink(5)}/>`,
    )
  }
  return {
    // ba ô chọn độ dài mi và thẻ kiểu mi mẫu
    'ls-pad': card(LS_PAD.w, LS_PAD.h, 26, C.cream),
    'ls-sample': card(LS_SAMPLE.w, LS_SAMPLE.h, 24, C.paper),
    // phần tô màu giữ nét nâu ở `ls-face-line`, vẽ sau cùng không bị tô
    'ls-face': svgDoc(BOX, 1, fillsOnly(skin) + skinShade),
    'ls-brow': svgDoc(BOX, 1, fillsOnly(brow) + temple),
    'ls-face-line': svgDoc(BOX, 1, linesOnly(skin) + linesOnly(brow) + lines),
  }
}
