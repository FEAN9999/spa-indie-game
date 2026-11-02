import { GROUND, HIGHLIGHT, ink, shade } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

// The glass is drawn in the game, filled to its layers; these are pictures placed by their centres: the phin set on the glass,
// the can of condensed milk, the ice bowl and one cube.

/** The glass's inside: its middle x, its bottom and brim, and how far its wall stands from the middle at each. */
export const CF_GLASS = { x: 420, bottom: 1420, top: 960, bottomHalf: 115, topHalf: 150 }

// Nét vẽ A+ theo bản đã duyệt (docs/art/huong-net-ve/lo1/aplus-caphe.svg): phin nhôm có khía, lon sữa nhãn trơn,
// bát sứ xanh trắng đựng đá có cạnh. Toạ độ lấy từ bản đã duyệt rồi dời vào hộp của từng hình.

const clip = (id: string, d: string, body: string) => `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>`

// phin nhôm: đĩa rộng, thân có khía và mảng bóng, nắp vòm có núm; đĩa ngồi trên miệng ly
const CHAMBER = 'M254,128 L258,62 C260,54 340,54 342,62 L346,128 Z'
const PHIN =
  `<g transform="translate(-180 -21)">` +
  `<ellipse cx="300" cy="140" rx="86" ry="16" fill="${C.silver}" ${ink(5)}/>` +
  `<path d="M214,140 A86,16 0 0 0 386,140 L386,146 A86,16 0 0 1 214,146 Z" fill="${shade(C.silver)}" ${ink(3.5)}/>` +
  `<path d="${CHAMBER}" fill="${C.silver}"/>` +
  clip(
    'cf-chamber',
    CHAMBER,
    `<path d="M320,56 L346,56 L346,130 L326,130 C330,104 328,80 320,56 Z" fill="${shade(C.silver)}"/>` +
      `<path d="M266,70 L264,120" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".6"/>` +
      `<path d="M254,84 H346 M254,110 H346" stroke="${C.stoneLight}" stroke-width="2.5"/>`,
  ) +
  `<path d="M254,128 L258,62 C260,54 340,54 342,62 L346,128" fill="none" ${ink(6)}/>` +
  `<ellipse cx="300" cy="128" rx="46" ry="8" fill="none" ${ink(3.5)}/>` +
  `<path d="M252,62 C254,38 346,38 348,62 Z" fill="${C.silver}" ${ink(5)}/>` +
  `<ellipse cx="300" cy="62" rx="48" ry="8" fill="${shade(C.silver)}" ${ink(4)}/>` +
  `<path d="M270,50 C278,44 290,42 300,42" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".6"/>` +
  `<rect x="288" y="24" width="24" height="18" rx="5" fill="${C.silver}" ${ink(4)}/>` +
  `<ellipse cx="300" cy="24" rx="12" ry="4" fill="${C.caoGlassShine}" ${ink(3)}/>` +
  `</g>`

// lon sữa đặc: nhãn trơn hai dải xanh ngọc và giọt sữa, nắp đục hai lỗ, giọt sữa chảy ở mép trái, phía nghiêng rót
const CAN_BODY = 'M440,252 V384 C440,394 532,394 532,384 V252 Z'
const CAN =
  `<g transform="translate(60 77) scale(.96) translate(-486 -322)">` +
  `<path d="${CAN_BODY}" fill="${C.silver}"/>` +
  clip(
    'cf-can',
    CAN_BODY,
    `<rect x="436" y="272" width="100" height="84" fill="${C.cream}"/>` +
      `<rect x="436" y="272" width="100" height="14" fill="${C.teal}"/><rect x="436" y="342" width="100" height="14" fill="${C.teal}"/>` +
      `<path d="M486,296 c-12,18 -14,28 0,32 c14,-4 12,-14 0,-32 Z" fill="${C.bambooLight}" ${ink(2.5)}/>` +
      `<path d="M512,250 L536,250 L536,396 L506,396 C516,350 516,300 512,250 Z" fill="${C.ink}" opacity=".14"/>` +
      `<path d="M450,262 V380" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".5"/>` +
      `<path d="M440,364 H532 M440,370 H532" stroke="${C.stoneLight}" stroke-width="2"/>`,
  ) +
  `<path d="M440,252 V384 C440,394 532,394 532,384 V252" fill="none" ${ink(6)}/>` +
  `<path d="M440,272 C440,280 532,280 532,272 M440,356 C440,364 532,364 532,356" fill="none" ${ink(2.5)}/>` +
  `<ellipse cx="486" cy="252" rx="46" ry="10" fill="${shade(C.silver)}" ${ink(5)}/>` +
  `<ellipse cx="486" cy="252" rx="38" ry="7" fill="${C.silver}" stroke="${C.stoneLight}" stroke-width="2"/>` +
  `<ellipse cx="470" cy="253" rx="5" ry="2.5" fill="${C.deepBrown}"/><ellipse cx="502" cy="251" rx="5" ry="2.5" fill="${C.deepBrown}"/>` +
  `<path d="M462,256 C460,264 460,274 458,282 C456,286 452,284 454,278 C456,270 456,264 456,258 Z" fill="${C.bambooLight}" ${ink(2.5)}/>` +
  `</g>`

// bát sứ xanh trắng đựng ba viên đá có cạnh, mặt trên sáng, mặt bên tối
const CUBE = (pts: string, top: string, side: string) =>
  `<path d="${pts}" fill="${C.water}" ${ink(3.5)}/><path d="${top}" fill="${C.caoGlassShine}" ${ink(3.5)}/><path d="${side}" fill="${shade(C.water)}" ${ink(3.5)}/>`
const BOWL_D = 'M58,368 C62,412 92,432 130,432 C168,432 198,412 202,368 Z'
const BUCKET =
  `<g transform="translate(100 90) scale(1.3) translate(-130 -378)">` +
  `<ellipse cx="134" cy="436" rx="66" ry="7" ${GROUND}/>` +
  CUBE('M78,352 L104,338 L128,350 L128,380 L102,394 L78,380 Z', 'M78,352 L104,338 L128,350 L102,364 Z', 'M102,364 L128,350 L128,380 L102,394 Z') +
  CUBE('M126,346 L150,330 L176,342 L176,372 L150,388 L126,374 Z', 'M126,346 L150,330 L176,342 L152,356 Z', 'M152,356 L176,342 L176,372 L150,388 Z') +
  CUBE('M100,330 L122,320 L144,330 L144,356 L122,366 L100,356 Z', 'M100,330 L122,320 L144,330 L122,340 Z', 'M122,340 L144,330 L144,356 L122,366 Z') +
  `<path d="M86,350 L100,343 M108,330 L120,325 M134,344 L148,337" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>` +
  `<path d="${BOWL_D}" fill="${C.cream}"/>` +
  clip(
    'cf-bowl',
    BOWL_D,
    `<path d="M176,368 L206,368 C202,412 170,434 130,434 C160,420 178,398 176,368 Z" fill="${shade(C.cream)}"/>` +
      `<path d="M64,392 C90,410 170,410 196,392" fill="none" stroke="${C.cobalt}" stroke-width="7"/>` +
      `<path d="M74,376 C76,392 84,404 94,412" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".6"/>`,
  ) +
  `<path d="${BOWL_D}" fill="none" ${ink(5)}/>` +
  `<ellipse cx="130" cy="368" rx="72" ry="9" fill="none" ${ink(4)}/>` +
  `</g>`

// một viên đá: mặt trước xanh nước, mặt trên sáng, mặt bên tối, một vệt sáng
const ICE =
  `<path d="M6,18 L28,8 L50,18 L50,42 L28,52 L6,42 Z" fill="${C.water}" ${ink(4)}/>` +
  `<path d="M6,18 L28,8 L50,18 L28,28 Z" fill="${C.caoGlassShine}" ${ink(3.5)}/>` +
  `<path d="M28,28 L50,18 L50,42 L28,52 Z" fill="${shade(C.water)}" ${ink(3.5)}/>` +
  `<path d="M12,24 L12,38" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".8"/>` +
  `<ellipse cx="18" cy="17" rx="5" ry="2" ${HIGHLIGHT}/>`

/** The Cà phê sữa đá pictures: the phin, the can, the ice bowl (keyed bucket) and an ice cube. */
export function caPheTextures(): Record<string, string> {
  return {
    'cf-phin': svgDoc([0, 0, 240, 140], 1, PHIN),
    'cf-can': svgDoc([0, 0, 120, 150], 1, CAN),
    'cf-bucket': svgDoc([0, 0, 200, 170], 1, BUCKET),
    'cf-ice': svgDoc([0, 0, 56, 56], 1, ICE),
  }
}
