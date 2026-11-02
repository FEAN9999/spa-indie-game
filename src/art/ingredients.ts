import { TILE } from '../config'
import { ink, shade } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

const S = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"`

/** One icon on a 40-unit square, drawn two tiles wide (156 px) so it stays sharp when a scene shows it larger. */
const icon = (body: string) => svgDoc([0, 0, 40, 40], 2 * TILE / 40, body)

// Nét vẽ A+ cho các thứ rơi trong màn Xông lá, theo bản đã duyệt (docs/art/huong-net-ve/lo1/aplus-steam.svg).
// Mỗi thứ vẽ ở toạ độ của bản đã duyệt rồi thu vào ô 40; độ dày nét ghi theo đơn vị của ô 40
// (viền ngoài 2, nét trong 1,2, chi tiết 0,8) rồi chia cho tỉ lệ thu để còn đúng độ dày sau khi thu.
const scaled = (k: number) => ({ o: ink(2 / k), i: ink(1.2 / k), d: 0.8 / k })
const shine = (d: string, w: number) => `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${w}" stroke-linecap="round" opacity=".45"/>`
const line = (d: string, color: string, w: number) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`

/** Lá bưởi: xanh đậm bóng, nửa dưới tối, gân giữa sáng, cuống có cánh. */
const POMELO = (() => {
  const k = 0.25
  const s = scaled(k)
  const leaf = 'M0,0 C18,-30 82,-38 118,-28 C96,0 40,14 0,0 Z'
  return (
    `<g transform="translate(21 20) rotate(-40) scale(${k}) translate(-37 13)">` +
    `<path d="${leaf}" fill="${C.leaf}"/>` +
    `<path d="M0,0 C40,4 90,-10 118,-28 C96,0 40,14 0,0 Z" fill="${shade(C.leaf)}"/>` +
    shine('M22,-16 C40,-26 62,-30 80,-30', 7) +
    line('M0,0 C40,-10 80,-20 116,-28', C.leafLight, s.d * 1.2) +
    `<path d="${leaf}" fill="none" ${s.o}/>` +
    `<path d="M0,0 C-10,-14 -28,-12 -32,0 C-28,10 -12,12 0,0 Z" fill="${C.leaf}" ${s.i}/>` +
    `<path d="M-32,0 L-44,2" fill="none" ${s.i}/>` +
    `</g>`
  )
})()

/** Lá ổi: xanh nhạt, nửa dưới tối, gân song song nổi rõ. */
const GUAVA = (() => {
  const k = 0.32
  const s = scaled(k)
  const leaf = 'M0,0 C8,-28 72,-32 104,-6 C78,20 16,24 0,0 Z'
  return (
    `<g transform="translate(21 21) rotate(-35) scale(${k}) translate(-45 5)">` +
    `<path d="${leaf}" fill="${C.herb}"/>` +
    `<path d="M0,0 C30,14 76,14 104,-6 C78,20 16,24 0,0 Z" fill="${shade(C.herb)}"/>` +
    shine('M14,-12 C30,-20 50,-22 64,-20', 6) +
    line('M0,0 L100,-6', C.cucumber, s.d * 1.2) +
    line('M18,-1 L28,-18 M34,-2 L46,-20 M50,-3 L62,-20 M66,-4 L78,-18 M82,-5 L92,-14 M18,-1 L28,12 M34,-2 L46,14 M50,-3 L62,13 M66,-4 L78,10 M82,-5 L90,4', C.cucumber, s.d) +
    `<path d="${leaf}" fill="none" ${s.o}/>` +
    `<path d="M0,0 L-14,4" fill="none" ${s.i}/>` +
    `</g>`
  )
})()

/** Ớt: thân cong đỏ, bụng dưới tối, vệt sáng, đài và cuống xanh. */
const CHILI = (() => {
  const k = 0.32
  const s = scaled(k)
  const body = 'M0,6 C14,-6 54,-6 90,12 C60,16 30,22 2,18 Z'
  return (
    `<g transform="translate(20 20) rotate(35) scale(${k}) translate(-34 -9)">` +
    `<path d="${body}" fill="${C.lantern}"/>` +
    `<path d="M2,18 C30,22 60,16 90,12 C60,22 28,26 2,18 Z" fill="${C.lanternDark}"/>` +
    shine('M12,4 C30,0 48,0 62,4', 5) +
    `<path d="${body}" fill="none" ${s.o}/>` +
    `<path d="M2,6 L-8,4 L-4,11 L-10,16 L2,18 Z" fill="${C.leaf}" ${s.i}/>` +
    `<path d="M-8,10 C-18,8 -22,0 -20,-8" fill="none" stroke="${C.ink}" stroke-width="${2 / k}" stroke-linecap="round"/>` +
    `<path d="M-8,10 C-18,8 -22,0 -20,-8" fill="none" stroke="${C.leafLight}" stroke-width="${1 / k}" stroke-linecap="round"/>` +
    `</g>`
  )
})()

/** Gừng: củ nhiều nhánh, vằn ngang, mảng bóng dưới, một mặt cắt vàng. */
const GINGER = (() => {
  const k = 0.4
  const s = scaled(k)
  const root = 'M440,198 C438,182 454,174 468,180 C472,164 490,160 498,174 C512,170 524,184 516,196 C526,206 514,220 500,214 C490,226 472,224 466,214 C452,220 440,212 440,198 Z'
  return (
    `<g transform="translate(20 21) scale(${k}) translate(-482 -193)">` +
    `<path d="${root}" fill="${C.matLine}"/>` +
    `<path d="M452,214 C470,222 492,224 516,206 C514,220 500,214 500,214 C490,226 472,224 466,214 C456,218 448,214 452,214 Z" fill="${C.weaveLine}" opacity=".6"/>` +
    line('M452,192 q4,6 0,12 M476,184 q5,7 0,14 M494,178 q4,6 0,12 M506,196 q4,6 0,12', C.weaveLine, s.d) +
    `<path d="${root}" fill="none" ${s.o}/>` +
    `<ellipse cx="500" cy="170" rx="9" ry="6" fill="${C.bambooLight}" ${s.i}/>` +
    `<ellipse cx="460" cy="188" rx="7" ry="3.5" fill="#FFFFFF" opacity=".45"/>` +
    `</g>`
  )
})()

/** Sả: ba cây bó lại, gốc trắng, lá mảnh xoè ra, có dây buộc. Cây mảnh nên nét mảnh hơn các thứ khác. */
const LEMONGRASS = (() => {
  // to và rõ hơn khi rơi: ba thân mập, gốc kem cắt chéo, lá xanh xoè ngắn, dây đất nung buộc ngang
  const k = 0.2
  const o = ink(1.6 / k)
  const i = ink(1.1 / k)
  const stalk = (y: number) =>
    `<rect x="0" y="${y}" width="96" height="19" rx="9.5" fill="${C.bambooLight}" ${i}/>` +
    `<path d="M10,${y + 14} H88" stroke="${shade(C.bambooLight)}" stroke-width="${0.9 / k}" stroke-linecap="round"/>`
  return (
    `<g transform="translate(20 21) rotate(-45) scale(${k}) translate(-92 -29)">` +
    `<path d="M86,6 Q130,0 176,-6 Q136,14 86,20 Z" fill="${C.cane}" ${o}/>` +
    `<path d="M86,52 Q130,58 176,64 Q136,44 86,38 Z" fill="${C.cane}" ${o}/>` +
    `<path d="M86,20 Q140,14 186,29 Q140,44 86,38 Z" fill="${C.caneLight}" ${o}/>` +
    line('M92,13 Q130,7 166,0 M92,29 Q140,28 176,29 M92,45 Q130,51 166,58', C.cucumber, 0.7 / k) +
    stalk(0) + stalk(19.5) + stalk(39) +
    line('M64,5 h26 M64,24.5 h26 M64,44 h26', C.caneLight, 0.9 / k) +
    [9.5, 29, 48.5].map(y => `<ellipse cx="2" cy="${y}" rx="4" ry="8.5" fill="${C.cream}" ${ink(0.8 / k)}/>`).join('') +
    line('M22,6 h22 M22,25.5 h22 M22,45 h22', '#FFFFFF', 0.8 / k).replace('stroke-linecap="round"', 'stroke-linecap="round" opacity=".45"') +
    `<path d="M46,-4 C54,18 40,40 50,62" fill="none" stroke="${C.ink}" stroke-width="${2.2 / k}" stroke-linecap="round"/>` +
    `<path d="M46,-4 C54,18 40,40 50,62" fill="none" stroke="${C.terracotta}" stroke-width="${1.2 / k}" stroke-linecap="round"/>` +
    `</g>`
  )
})()

/** Lá chuối: một khúc lá xé, nửa dưới tối, gân giữa sáng, gân song song, mép rách. */
const BANANA = (() => {
  const body = 'M4,36 C9,20 21,8 36,4 C33,19 22,31 4,36Z'
  return (
    `<clipPath id="ing-banana"><path d="${body}"/></clipPath>` +
    `<path d="${body}" fill="${C.green}"/>` +
    `<g clip-path="url(#ing-banana)"><path d="M4,36 C14,26 24,16 36,4 L40,40 Z" fill="${shade(C.green)}"/>` +
    line('M11,29 l-3,-6 M16,24 l-3,-7 M21,19 l-2,-7 M26,14 l-2,-6 M13,30 l6,2 M18,25 l7,2 M23,20 l7,1 M28,15 l6,0', C.leaf, 0.8) +
    shine('M9,25 C13,18 18,13 23,10', 1.4) +
    `</g>` +
    line('M5,35 C14,25 24,14 35,5', C.caneLight, 1.4) +
    `<path d="${body}" fill="none" ${ink(2)}/>` +
    `<path d="M24,26 l2,2.5 l1.5,-2 l2,2" fill="none" ${ink(0.8)}/>`
  )
})()

const THINGS: Record<string, string> = {
  pomelo: POMELO,
  lemongrass: LEMONGRASS,
  ginger: GINGER,
  // a few salt crystals in a pale dish
  salt:
    `<ellipse cx="20" cy="31" rx="15" ry="5" fill="${C.water}" ${S}/>` +
    `<g fill="${C.cream}" ${S}><rect x="10" y="20" width="8" height="8" rx="2"/><rect x="19" y="21" width="8" height="8" rx="2"/><rect x="14" y="12" width="8" height="8" rx="2"/><rect x="24" y="13" width="7" height="7" rx="2"/></g>`,
  // a bowl of mineral mud with a bubble
  mineralMud:
    `<path d="M5,18 H35 C35,28 28,35 20,35 C12,35 5,28 5,18Z" fill="${C.clayLight}" ${S}/>` +
    `<ellipse cx="20" cy="18" rx="15" ry="5" fill="${C.clay}" ${S}/>` +
    `<circle cx="25" cy="11" r="3" fill="${C.clay}" ${S}/>`,
  // a honey jar with a wooden lid
  honey:
    `<rect x="10" y="13" width="20" height="23" rx="6" fill="${C.mustard}" ${S}/>` +
    `<rect x="12" y="6" width="16" height="8" rx="2" fill="${C.wood}" ${S}/>` +
    `<rect x="14" y="20" width="12" height="8" rx="2" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"/>`,
  // half a coconut: brown shell, white flesh, a drop of water
  coconut:
    `<path d="M4,19 H36 C36,30 29,36 20,36 C11,36 4,30 4,19Z" fill="${C.woodDark}" ${S}/>` +
    `<ellipse cx="20" cy="19" rx="16" ry="6" fill="${C.cream}" ${S}/>` +
    `<path d="M17,8 q3,4 0,7" stroke="${C.waterDeep}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  // a teal dropper bottle with a black bulb and a label
  cajeput:
    `<rect x="12" y="16" width="16" height="20" rx="4" fill="${C.teal}" ${S}/>` +
    `<rect x="16" y="10" width="8" height="7" fill="${C.mint}" ${S}/>` +
    `<rect x="15" y="4" width="10" height="7" rx="2" fill="${C.ink}"/>` +
    `<rect x="15" y="22" width="10" height="7" rx="1.5" fill="${C.paper}"/>`,
  // decoys: a guava leaf, a red curved chili and a torn piece of banana leaf
  guava: GUAVA,
  chili: CHILI,
  banana: BANANA,
}

/** The 8 ingredients and the 3 leaf-game decoys, one icon each, keyed `ing-<id>`. */
export function ingredientTextures(): Record<string, string> {
  return Object.fromEntries(Object.entries(THINGS).map(([id, body]) => [`ing-${id}`, icon(body)]))
}
