import { GROUND, ink, shade } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

// Nét vẽ A+ theo bản đã duyệt (docs/art/huong-net-ve/lo1/aplus-steam.svg): nồi đất nước lá trên bếp lò đất có lửa,
// hơi bốc lên. Vẽ bằng toạ độ của bản đã duyệt, thu lại cho mặt nước lá nằm ở y 36 của hộp, chỗ lá rơi vào.

const clip = (id: string, d: string, body: string) => `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>`

const STOVE = 'M212,402 L226,480 Q300,494 374,480 L388,402 Z'
const POT = 'M214,352 C212,394 250,414 300,414 C350,414 388,394 386,352 Z'

/** Nét trong bản đã duyệt vẽ ở cỡ lớn; hình thu lại 0,45 lần nên nét được nhân lên để còn dày như các hình A+ khác. */
const W = (px: number) => ink(px * 1.4)

const BODY =
  // hơi nước từ nồi
  `<path d="M262,330 C246,312 278,300 262,282 M300,322 C284,302 318,290 302,270 M338,330 C324,312 352,300 338,284" fill="none" stroke="${C.steamBlue}" stroke-width="9" stroke-linecap="round" opacity=".8"/>` +
  // bếp lò đất: thân đất nung có mảng bóng và vân ngang, cửa lò có than và lửa
  `<ellipse cx="304" cy="486" rx="112" ry="12" ${GROUND}/>` +
  `<path d="${STOVE}" fill="${C.terracotta}"/>` +
  clip(
    'st-stove',
    STOVE,
    `<path d="M346,402 L388,402 L374,482 Q360,486 340,488 Z" fill="${shade(C.terracotta)}"/>` +
      `<path d="M222,430 H380 M226,458 H376" stroke="${shade(C.terracotta)}" stroke-width="3"/>`,
  ) +
  `<path d="${STOVE}" fill="none" ${W(6)}/>` +
  `<path d="M268,486 L268,452 Q300,428 332,452 L332,486 Z" fill="${C.deepBrown}" ${W(4)}/>` +
  `<ellipse cx="286" cy="478" rx="12" ry="6" fill="${C.lantern}"/><ellipse cx="312" cy="476" rx="14" ry="7" fill="${C.stoneHot}"/><ellipse cx="300" cy="482" rx="10" ry="4" fill="${C.gold}"/>` +
  `<path d="M290,470 C284,458 294,452 292,442 C302,450 306,460 300,470 Z" fill="${C.stoneHot}"/>` +
  `<path d="M308,470 C306,462 312,458 312,452 C318,458 318,466 314,470 Z" fill="${C.gold}"/>` +
  // lửa liếm quanh đáy nồi
  `<path d="M206,404 C204,388 214,380 220,374 C224,386 230,394 228,404 Z" fill="${C.stoneHot}" ${W(3)}/>` +
  `<path d="M394,404 C396,388 386,380 380,374 C376,386 370,394 372,404 Z" fill="${C.stoneHot}" ${W(3)}/>` +
  `<ellipse cx="300" cy="402" rx="88" ry="18" fill="${C.terracotta}" ${W(5)}/>` +
  // nồi đất: thân nâu có mảng bóng, điểm sáng, đường vành; hai quai; miệng nồi đầy nước lá có lá nổi
  `<path d="${POT}" fill="${C.clay}"/>` +
  clip(
    'st-pot',
    POT,
    `<path d="M352,352 L390,352 C388,394 350,416 300,416 C342,404 360,382 352,352 Z" fill="${shade(C.clay)}"/>` +
      `<path d="M236,368 C240,386 252,398 266,404 C254,392 246,380 244,366 Z" fill="#FFFFFF" opacity=".45"/>` +
      `<path d="M216,376 C260,390 340,390 384,376" fill="none" stroke="${C.clayLight}" stroke-width="3.5"/>`,
  ) +
  `<path d="${POT}" fill="none" ${W(6)}/>` +
  `<path d="M214,364 C200,362 196,374 210,378 M386,364 C400,362 404,374 390,378" fill="none" ${W(5)}/>` +
  `<ellipse cx="300" cy="352" rx="88" ry="20" fill="${C.clayLight}" ${W(6)}/>` +
  `<ellipse cx="300" cy="353" rx="72" ry="13" fill="${C.herb}" ${W(3.5)}/>` +
  `<path d="M240,350 C262,342 300,340 330,344" fill="none" stroke="${C.cucumber}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
  `<path d="M268,357 q8,-9 20,-3 q-8,8 -20,3 Z M318,350 q10,-7 20,1 q-10,7 -20,-1 Z" fill="${C.leaf}" ${W(2)}/>`

/** The Xông lá pot: a clay pot of herb water on a clay stove with its fire, steam curling up; the herb water sits at y 36. */
export function steamTextures(): Record<string, string> {
  return {
    'st-pot': svgDoc([0, -6, 132, 106], 2, `<g transform="translate(66 36) scale(.45) translate(-300 -352)">${BODY}</g>`),
  }
}
