import { GROUND, HIGHLIGHT, ink } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** The glass's inside, where the game draws the layers: its centre x, the rim's and the floor's y, and half its width. */
export const CHE_GLASS = { x: 540, top: 860, bottom: 1420, halfW: 170 }
/** The ice block on its picture, the part a tap counts on, as x, y, width and height. */
export const CHE_ICE_BLOCK: Box = [20, 30, 360, 200]
/** The glass is drawn in the card's own pixels and placed at its box's top left corner; the ice block and the jug are placed by their centres. */
export const CHE_GLASS_BOX: Box = [320, 740, 440, 740]

const line = (d: string, col: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
/** A thick line with an ink edge: the ink drawn wider first, the colour on top. */
const inked = (d: string, col: string, w: number, edge = 6) => line(d, C.ink, w + edge) + line(d, col, w)

let ids = 0
/** Vẽ `body` chỉ bên trong hình `d`. */
const clip = (d: string, body: string) => {
  const id = `che${ids++}`
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>`
}

/** Dãy số giả ngẫu nhiên cố định, để hạt đậu, bánh lọt nằm y nguyên mỗi lần vẽ. */
const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}

const [L, R] = [CHE_GLASS.x - CHE_GLASS.halfW, CHE_GLASS.x + CHE_GLASS.halfW]
const { top: TOP, bottom: BOTTOM } = CHE_GLASS
const W = R - L
const H = BOTTOM - TOP

// ly: bóng sàn, lót ly mây đan, thành kính dày có ánh hai bên, đế dày, vành miệng, muỗng dài; các lớp chè được vẽ trong game
const OUTER = `M350,850 L356,${BOTTOM} Q358,${BOTTOM + 24} 384,${BOTTOM + 24} H696 Q722,${BOTTOM + 24} 724,${BOTTOM} L730,850`
const GLASS =
  `<ellipse cx="548" cy="1470" rx="200" ry="9" ${GROUND}/>` +
  `<ellipse cx="540" cy="1452" rx="208" ry="24" fill="${C.weave}" ${ink(5)}/>` +
  line('M334,1458 a206,20 0 0 0 412,0', C.weaveLine, 9, 'opacity=".55"') +
  `<ellipse cx="540" cy="1450" rx="176" ry="17" fill="none" stroke="${C.weaveLine}" stroke-width="3"/>` +
  `<ellipse cx="540" cy="1449" rx="140" ry="12" fill="none" stroke="${C.weaveLine}" stroke-width="3"/>` +
  line('M352,1450 l8,8 M388,1462 l6,8 M436,1470 l4,7 M490,1474 l2,6 M590,1474 l-2,6 M644,1470 l-4,7 M692,1462 l-6,8 M728,1450 l-8,8', C.weaveLine, 3) +
  // muỗng: cán bạc có gờ sáng thò lên khỏi miệng ly
  inked('M668,880 L740,764', C.silver, 7) +
  line('M674,866 L734,770', C.cloud, 2, 'opacity=".8"') +
  `<ellipse cx="744" cy="758" rx="11" ry="7" transform="rotate(-58 744 758)" fill="${C.silver}" ${ink(3)}/>` +
  // vành sau của ly
  line(`M350,850 A190,16 0 0 1 730,850`, C.ink, 4) +
  // thành kính: lòng ly nhạt, hai dải thành dày, đế kính
  `<path d="${OUTER} Z" fill="${C.glass}" opacity=".3"/>` +
  `<path d="M350,850 L370,850 L370,${BOTTOM} L356,${BOTTOM} Z" fill="${C.glass}" opacity=".8"/>` +
  `<path d="M710,850 L730,850 L724,${BOTTOM} L710,${BOTTOM} Z" fill="${C.glass}" opacity=".8"/>` +
  `<path d="M710,850 L730,850 L724,${BOTTOM} L710,${BOTTOM} Z" fill="${C.ink}" opacity=".12"/>` +
  `<path d="M358,${BOTTOM} H722 Q720,${BOTTOM + 22} 696,${BOTTOM + 22} H384 Q360,${BOTTOM + 22} 358,${BOTTOM} Z" fill="${C.glass}"/>` +
  line(`M392,${BOTTOM + 12} C460,${BOTTOM + 6} 620,${BOTTOM + 6} 688,${BOTTOM + 12}`, C.cloud, 4, 'opacity=".7"') +
  line(`M359,880 L363,${BOTTOM - 30}`, C.cloud, 5, 'opacity=".75"') +
  line(`M720,890 L716,${BOTTOM - 40}`, C.cloud, 3, 'opacity=".45"') +
  `<path d="${OUTER}" fill="none" ${ink(7)}/>` +
  line(`M370,${BOTTOM} H710`, C.ink, 2.5, 'opacity=".5"') +
  // vành trước của ly và ánh trên vành
  line(`M350,850 A190,16 0 0 0 730,850`, C.ink, 5) +
  line(`M372,860 A180,12 0 0 0 480,866`, C.cloud, 3, 'opacity=".8"')

// các lớp chè: mỗi lớp là một tấm vừa lòng ly, game cắt lấy đoạn từ đáy lớp tới mặt lớp
const SIDE_SHADE = `<rect x="${W - 46}" y="0" width="46" height="${H}" fill="${C.ink}" opacity=".12"/>`

// đậu đỏ: nước đường sẫm, hạt đậu bóng xếp dày
const RED_BEAN = (() => {
  const rnd = seeded(7)
  let beans = ''
  let shine = ''
  for (let y = 14; y < H + 14; y += 24)
    for (let x = 16 + ((y / 24) % 2) * 15; x < W + 14; x += 30) {
      const bx = x + (rnd() - 0.5) * 10
      const by = y + (rnd() - 0.5) * 8
      const a = Math.round(rnd() * 180)
      beans += `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="13" ry="9" transform="rotate(${a} ${bx.toFixed(1)} ${by.toFixed(1)})"/>`
      shine += `<circle cx="${(bx - 4).toFixed(1)}" cy="${(by - 3).toFixed(1)}" r="2.6"/>`
    }
  return (
    `<rect width="${W}" height="${H}" fill="${C.lanternDark}"/><rect width="${W}" height="${H}" fill="${C.ink}" opacity=".3"/>` +
    `<g fill="${C.lanternDark}" stroke="${C.ink}" stroke-width="2">${beans}</g>` +
    `<g fill="${C.cloud}" opacity=".55">${shine}</g>` +
    SIDE_SHADE
  )
})()

// đậu xanh: lớp đậu đánh mịn màu bơ, có vân múc và vài hạt
const MUNG_BEAN = (() => {
  const rnd = seeded(11)
  let swirls = ''
  let dots = ''
  for (let y = 22; y < H; y += 46) {
    const x = 20 + rnd() * 60
    swirls += `M${x.toFixed(0)},${y} C${(x + 40).toFixed(0)},${y - 14} ${(x + 80).toFixed(0)},${y + 12} ${(x + 130).toFixed(0)},${y} S${(x + 210).toFixed(0)},${y - 12} ${(x + 250).toFixed(0)},${y + 2} `
    for (let k = 0; k < 4; k++) dots += `<circle cx="${(rnd() * (W - 20) + 10).toFixed(0)}" cy="${(y + rnd() * 40 - 20).toFixed(0)}" r="${(2 + rnd() * 1.5).toFixed(1)}"/>`
  }
  return (
    `<rect width="${W}" height="${H}" fill="${C.restHouseButter}"/>` +
    line(swirls, C.restHouseButterDark, 5) +
    `<g fill="${C.restHouseButterDark}">${dots}</g>` +
    SIDE_SHADE
  )
})()

// bánh lọt lá dứa: giọt xanh mập, ngắn, có ánh, nằm trong nước cốt nhạt
const JELLY = (() => {
  const rnd = seeded(23)
  let drops = ''
  for (let y = 18; y < H + 10; y += 34)
    for (let x = 18 + ((y / 34) % 2) * 22; x < W; x += 46) {
      const cx = x + (rnd() - 0.5) * 16
      const cy = y + (rnd() - 0.5) * 12
      const a = Math.round(rnd() * 360)
      drops +=
        `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${a})">` +
        `<path d="M-14,0 C-14,-7 -6,-8 2,-7 C9,-6 15,-3 15,0 C15,3 9,6 2,7 C-6,8 -14,7 -14,0 Z" fill="${C.green}" ${ink(2.2)}/>` +
        `<path d="M-8,-3 C-3,-5 3,-5 8,-3" fill="none" stroke="${C.cloud}" stroke-width="2" stroke-linecap="round" opacity=".6"/>` +
        `</g>`
    }
  return `<rect width="${W}" height="${H}" fill="${C.mint}"/>` + drops + SIDE_SHADE
})()

// đá: một khối đá lớn có mặt trên, mặt trước, mặt bên khuất, vết nứt và ánh, nằm trên khăn sọc
const ICE_SHAPE = 'M28,90 L70,36 L330,32 L374,78 L368,220 L310,232 L36,226 Z'
const ICE =
  `<ellipse cx="206" cy="291" rx="194" ry="8" ${GROUND}/>` +
  `<rect x="4" y="210" width="392" height="76" rx="18" fill="${C.cream}" ${ink(5)}/>` +
  line('M18,232 H382 M18,262 H382', C.teal, 8) +
  `<path d="M4,272 H396 V268 A18,18 0 0 1 378,286 H22 A18,18 0 0 1 4,268 Z" fill="${C.ink}" opacity=".1"/>` +
  `<path d="${ICE_SHAPE}" fill="${C.glass}"/>` +
  clip(
    ICE_SHAPE,
    `<path d="M28,90 L70,36 L330,32 L374,78 L322,104 L60,108 Z" fill="${C.cloud}" opacity=".85"/>` +
      `<path d="M322,104 L374,78 L368,220 L310,232 Z" fill="${C.ink}" opacity=".12"/>` +
      line('M150,104 l26,44 l-18,30 M246,108 l-16,46 l28,40 M300,150 l20,22', C.waterDeep, 4) +
      line('M58,124 V200 M84,132 V170', C.cloud, 9, 'opacity=".9"') +
      `<path d="M100,52 L180,46 L170,70 L96,74 Z" ${HIGHLIGHT}/>`,
  ) +
  line('M60,108 L322,104 L374,78 M322,104 L310,232', C.ink, 3) +
  `<path d="${ICE_SHAPE}" fill="none" ${ink(6)}/>` +
  `<g fill="${C.cloud}" stroke="${C.waterDeep}" stroke-width="1.5"><path d="M352,40 l3,7 l7,3 l-7,3 l-3,7 l-3,-7 l-7,-3 l7,-3 Z"/></g>`

// cốt dừa: bình sứ kem có đai xanh men, quai, vòi bên trái, nước cốt trắng ở miệng
const JUG_BODY = 'M34,34 H104 Q120,80 108,124 Q70,136 32,124 Q20,80 34,34 Z'
const JUG =
  inked('M106,52 q32,6 26,36 q-4,22 -26,22', C.cream, 8) +
  `<path d="M36,34 L10,22 L28,54 Z" fill="${C.cream}" ${ink(4)}/>` +
  `<path d="${JUG_BODY}" fill="${C.cream}"/>` +
  clip(
    JUG_BODY,
    `<path d="M90,34 H130 V140 H70 Q100,110 90,34 Z" fill="${C.ink}" opacity=".14"/>` +
      line('M24,84 Q70,96 116,84', C.cobalt, 9) +
      line('M24,98 Q70,110 116,98', C.cobalt, 3) +
      `<path d="M40,50 Q36,80 44,108 L50,108 Q44,80 48,50 Z" ${HIGHLIGHT}/>`,
  ) +
  `<path d="${JUG_BODY}" fill="none" ${ink(5)}/>` +
  `<ellipse cx="69" cy="34" rx="36" ry="9" fill="${C.cloud}" ${ink(4)}/>` +
  `<ellipse cx="60" cy="32" rx="12" ry="3" fill="${C.tileSeam}"/>`

/** The Chè pictures: the glass, a fill for each layer that the game crops to its height, the ice block and the coconut milk jug. The marks and the drizzle are drawn in the game. */
export function cheTextures(): Record<string, string> {
  const fill = (body: string) => svgDoc([0, 0, W, H], 1, body)
  return {
    'che-glass': svgDoc(CHE_GLASS_BOX, 1, GLASS),
    'che-fill-redBean': fill(RED_BEAN),
    'che-fill-mungBean': fill(MUNG_BEAN),
    'che-fill-jelly': fill(JELLY),
    'che-ice': svgDoc([0, 0, 400, 300], 1, ICE),
    'che-coconut': svgDoc([0, 0, 140, 140], 1, JUG),
  }
}
