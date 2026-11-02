import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** Hair zone of `sh-hair` relative to its top-left, used for hit tests in ShampooScene. */
export const SH_HAIR = { w: 420, h: 300 }

// Vẽ theo bản A+ đã duyệt (khung 600×500), phóng SCALE lần lên thẻ; tâm vùng tóc của bản đó, HAIR_AT,
// nằm đúng tâm vùng chạm tóc trong ShampooScene, nên mọi texture đặt ở đó với gốc trong SH_ORIGIN.
const SCALE = 1.3125
const HAIR_AT = { x: 300, y: 171 }

const BASIN_BOX: Box = [50, 14, 500, 492]
const HAIR_BOX: Box = [100, 50, 400, 245]
const HEAD_BOX: Box = [130, 176, 340, 306]
const FRINGE_BOX: Box = [200, 170, 200, 82]
/** Vòi sen gác trên mép chậu, dây thép thả xuống cạnh ghế. */
const SHOWER_BOX: Box = [428, 40, 190, 345]
/** Kệ gỗ nhỏ có khăn, chai dầu gội, hũ kem, chậu cây, vẽ thẳng theo điểm ảnh thẻ; đặt giữa đáy kệ. */
const SHELF_BOX: Box = [0, 0, 620, 360]

/** Gốc ảnh đặt tâm vùng tóc của texture vẽ trong `box` vào vị trí của ảnh. */
const at = ([x, y, w, h]: Box) => ({ x: (HAIR_AT.x - x) / w, y: (HAIR_AT.y - y) / h })

/** Gốc của từng texture khi đặt ở tâm vùng tóc. */
export const SH_ORIGIN = { basin: at(BASIN_BOX), hair: at(HAIR_BOX), head: at(HEAD_BOX), fringe: at(FRINGE_BOX), shower: at(SHOWER_BOX) }

/** Nét đậm hơn mảng bóng: sợi tóc, nếp da trong phần được tô màu. */
const TINT_DEEP = shade('#FFFFFF', 0.3)

const BASIN = 'M186,22 H414 C494,22 544,70 544,160 C544,250 494,300 414,300 H186 C106,300 56,250 56,160 C56,70 106,22 186,22 Z'
const BED = 'M150,330 H450 A56,56 0 0 1 506,386 V468 A32,32 0 0 1 474,500 H126 A32,32 0 0 1 94,468 V386 A56,56 0 0 1 150,330 Z'
const MASS =
  'M208,284 C168,268 138,226 140,176 C142,130 168,98 206,80 C224,66 246,70 262,62 C280,54 292,62 300,58 C312,54 324,62 338,62 ' +
  'C356,66 376,66 394,80 C432,98 458,130 460,176 C462,226 432,268 392,284 Z'
const FACE = 'M214,254 C214,212 250,188 300,188 C350,188 386,212 386,254 C386,302 364,340 332,358 C320,366 310,370 300,370 C290,370 280,366 268,358 C236,340 214,302 214,254 Z'
const TOWEL = 'M190,346 C226,392 374,392 410,346 L462,404 C432,476 168,476 138,404 Z'

/** Phần trong `clip` của `body`: mảng bóng và điểm sáng không tràn khỏi hình. */
const inside = (id: string, clip: string, body: string) => `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})">${body}</g>`

export function shampooTextures(): Record<string, string> {
  // tóc xoã vào chậu, hai lọn xoăn hai bên, sợi tóc ướt chảy về phía chậu; tô màu tóc
  const hair =
    `<path d="M156,172 C124,168 106,140 116,116 C124,98 148,100 150,116 C138,116 132,128 136,140 C142,154 154,160 166,162 Z" fill="#ffffff" ${ink(4)}/>` +
    `<path d="M444,172 C476,168 494,140 484,116 C476,98 452,100 450,116 C462,116 468,128 464,140 C458,154 446,160 434,162 Z" fill="#ffffff" ${ink(4)}/>` +
    `<path d="${MASS}" fill="#ffffff" ${ink(6)}/>` +
    `<path d="M262,190 C250,150 234,120 212,96 M300,186 C300,150 298,110 296,68 M338,190 C350,150 366,120 388,96 M232,206 C200,186 176,160 164,124 M368,206 C400,186 424,160 436,124" stroke="${TINT_DEEP}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
    `<path d="M280,188 C274,150 266,110 254,74 M320,188 C326,150 334,110 346,74" fill="none" ${ink(2.5)}/>`
  const hairShade = inside('hs', MASS, `<path d="M394,78 C440,98 464,134 460,180 C458,228 430,266 392,286 C424,248 438,206 430,160 C424,124 410,98 394,78 Z" fill="${TINT_SHADE}"/>`)
  const hairShine = inside('hh', MASS, `<path d="M190,104 C214,88 244,80 270,78" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".35"/>`)

  // mặt ngửa mắt nhắm, hai tai; tô màu da
  const head =
    `<ellipse cx="214" cy="266" rx="12" ry="20" fill="${TINT_SHADE}" ${ink(4)}/><ellipse cx="386" cy="266" rx="12" ry="20" fill="${TINT_SHADE}" ${ink(4)}/>` +
    `<path d="${FACE}" fill="#ffffff" ${ink(6)}/>` +
    `<path d="M244,262 C255,272 273,272 284,262 M356,262 C345,272 327,272 316,262" fill="none" ${ink(4)}/>` +
    `<path d="M249,267 L246,274 M257,270 L256,277 M266,271 L266,278 M275,269 L277,276 M351,267 L354,274 M343,270 L344,277 M334,271 L334,278 M325,269 L323,276" fill="none" ${ink(2.5)}/>` +
    `<path d="M302,280 C300,294 296,302 292,307 C297,312 306,312 311,308" fill="none" ${ink(3)}/>` +
    `<path d="M286,334 C294,341 306,341 314,334" fill="none" ${ink(3.5)}/>`
  const headShade = inside(
    'fs',
    FACE,
    `<path d="M360,214 C380,234 386,262 382,290 C376,328 354,352 324,362 C350,334 364,300 362,262 C360,240 360,226 360,214 Z" fill="${TINT_SHADE}"/>` +
      `<path d="M214,222 C260,206 340,206 386,222 L386,236 C340,222 260,222 214,236 Z" fill="${TINT_SHADE}"/>` +
      `<ellipse cx="305" cy="308" rx="8" ry="3.5" fill="${TINT_SHADE}"/>`,
  )
  const cheeks =
    inside('fh', FACE, `<ellipse cx="246" cy="270" rx="11" ry="5" ${HIGHLIGHT} transform="rotate(-14 246 270)"/>`) +
    `<ellipse cx="250" cy="300" rx="20" ry="10" fill="${C.lotus}" opacity=".35"/><ellipse cx="350" cy="300" rx="20" ry="10" fill="${C.lotus}" opacity=".35"/>`
  // khăn xanh ngọc quấn cổ, viền kem, nếp gấp; không tô màu
  const towel =
    `<path d="${TOWEL}" fill="${C.teal}"/>` +
    inside(
      'tw',
      TOWEL,
      `<path d="M410,346 L462,404 C450,440 410,460 350,468 C400,440 430,400 410,346 Z" fill="${C.tealDark}"/>` +
        `<path d="M150,410 C200,452 400,452 450,410" fill="none" stroke="${C.cream}" stroke-width="6"/>` +
        `<path d="M168,388 C190,396 206,398 224,398" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".4"/>`,
    ) +
    `<path d="M232,392 C246,410 254,428 254,448 M368,392 C354,410 346,428 346,448 M300,396 V450" fill="none" ${ink(2.5)} opacity=".6"/>` +
    `<path d="${TOWEL}" fill="none" ${ink(6)}/>`

  // chân tóc vuốt ngược trên trán và chân mày, đặt trên mặt; tô màu tóc
  const fringe =
    `<path d="M210,250 C212,206 250,180 300,180 C350,180 388,206 390,250 C372,224 340,212 300,212 C260,212 228,224 210,250 Z" fill="#ffffff" ${ink(4.5)}/>` +
    `<path d="M246,206 C262,198 282,194 300,194 M318,195 C336,197 352,202 364,210" stroke="${TINT_DEEP}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<path d="M240,238 C252,230 270,229 282,234 C272,234 256,236 242,243 Z" fill="#ffffff" ${ink(2)}/>` +
    `<path d="M360,238 C348,230 330,229 318,234 C328,234 344,236 358,243 Z" fill="#ffffff" ${ink(2)}/>`

  const water = `stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".7"`
  return {
    // ghế gội gỗ, chậu sứ xanh trắng có nước, gối kê cổ
    'sh-basin': svgDoc(
      BASIN_BOX,
      SCALE,
      `<path d="${BED}" fill="${C.wood}"/>` +
        inside(
          'bd',
          BED,
          `<path d="M458,330 C490,340 506,360 506,386 V500 H470 C482,450 482,380 458,330 Z" fill="${shade(C.wood)}"/>` +
            `<path d="M120,360 C150,346 200,342 240,342" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".3"/>`,
        ) +
        `<path d="${BED}" fill="none" ${ink(6)}/>` +
        `<path d="${BASIN}" fill="${C.cream}"/>` +
        inside(
          'bs',
          BASIN,
          `<path d="M520,90 C548,150 540,240 470,290 C430,312 300,312 180,306 L540,306 L560,60 Z" fill="${shade(C.cream)}"/>` +
            `<path d="M110,60 C140,40 180,34 220,34" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".6"/>`,
        ) +
        `<path d="M190,40 H410 C478,40 526,80 526,160 C526,240 478,282 410,282 H190 C122,282 74,240 74,160 C74,80 122,40 190,40 Z" fill="none" stroke="${C.cobalt}" stroke-width="5"/>` +
        `<path d="${BASIN}" fill="none" ${ink(6)}/>` +
        `<ellipse cx="300" cy="150" rx="200" ry="104" fill="${C.water}" ${ink(4)}/>` +
        `<ellipse cx="300" cy="140" rx="160" ry="74" fill="${C.waterDeep}" opacity=".55"/>` +
        `<path d="M132,128 C150,118 170,116 188,120 M420,190 C440,186 456,178 466,166 M150,190 C168,198 186,200 204,198" fill="none" ${water}/>` +
        `<path d="M226,300 C238,268 362,268 374,300 Z" fill="${C.tealPale}" ${ink(4)}/>`,
    ),
    // phần tô màu giữ nét nâu ở texture `-line` riêng, vẽ trên cùng không bị tô; điểm sáng, má hồng, khăn cũng ở đó
    'sh-hair': svgDoc(HAIR_BOX, SCALE, fillsOnly(hair) + hairShade),
    'sh-hair-line': svgDoc(HAIR_BOX, SCALE, linesOnly(hair) + hairShine),
    'sh-head': svgDoc(HEAD_BOX, SCALE, fillsOnly(head) + headShade),
    'sh-head-line': svgDoc(HEAD_BOX, SCALE, linesOnly(head) + cheeks + towel),
    'sh-fringe': svgDoc(FRINGE_BOX, SCALE, fillsOnly(fringe)),
    'sh-fringe-line': svgDoc(FRINGE_BOX, SCALE, linesOnly(fringe)),
    // một chùm bọt: viền nâu, bóng xanh nhạt, chấm sáng
    'sh-foam': svgDoc(
      [0, 0, 90, 80],
      1,
      `<g opacity=".9"><circle cx="30" cy="45" r="22" fill="#FFFFFF" ${ink(3)}/><circle cx="58" cy="32" r="18" fill="#FFFFFF" ${ink(3)}/><circle cx="62" cy="58" r="13" fill="#FFFFFF" ${ink(3)}/></g>` +
        `<path d="M48,52 A20,20 0 0 1 14,56 A17,17 0 0 0 48,52 Z M74,40 A17,17 0 0 1 46,42 A14,14 0 0 0 74,40 Z" fill="${C.glass}"/>` +
        `<circle cx="22" cy="36" r="4.5" fill="#FFFFFF" stroke="${C.water}" stroke-width="1.5"/><circle cx="52" cy="25" r="4" fill="#FFFFFF" stroke="${C.water}" stroke-width="1.5"/>`,
    ),
    'sh-drop': svgDoc(
      [0, 0, 24, 34],
      1,
      `<path d="M12,2 Q22,18 21,23 A9,9 0 0 1 3,23 Q2,18 12,2Z" fill="${C.waterDeep}" ${ink(2.5)}/>` +
        `<ellipse cx="8.5" cy="20" rx="2.5" ry="4" ${HIGHLIGHT}/>`,
    ),
    // khăn đất nung gấp đôi, hai sọc kem, mảng bóng dưới
    'sh-towel': svgDoc(
      [0, 0, 230, 150],
      1,
      `<rect x="10" y="20" width="210" height="120" rx="26" fill="${C.terracotta}" ${ink(6)}/>` +
        `<path d="M14,104 H216 V114 A26,26 0 0 1 190,140 H40 A26,26 0 0 1 14,114 Z" fill="${shade(C.terracotta)}"/>` +
        `<path d="M30,96 H200 M30,116 H200" stroke="${C.cream}" stroke-width="7" stroke-linecap="round"/>` +
        `<rect x="10" y="20" width="210" height="120" rx="26" fill="none" ${ink(6)}/>` +
        `<rect x="10" y="10" width="210" height="62" rx="22" fill="${C.terracotta}" ${ink(6)}/>` +
        `<path d="M34,26 C60,20 90,18 120,20" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".4"/>` +
        `<path d="M60,48 C70,56 74,64 74,72 M150,48 C142,56 138,64 138,72" fill="none" ${ink(2.5)} opacity=".6"/>`,
    ),
    // vòi sen đồng gác trên mép chậu lúc chưa xả nước, dây thép thả xuống
    'sh-shower-rest': svgDoc(
      SHOWER_BOX,
      SCALE,
      `<path d="M520,128 C560,150 580,210 566,270 C556,312 568,350 600,370" fill="none" stroke="${C.ink}" stroke-width="15" stroke-linecap="round"/>` +
        `<path d="M520,128 C560,150 580,210 566,270 C556,312 568,350 600,370" fill="none" stroke="${C.silver}" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M556,200 C562,220 562,240 558,258" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>` +
        `<path d="M488,96 L526,132" stroke="${C.ink}" stroke-width="20" stroke-linecap="round"/>` +
        `<path d="M488,96 L526,132" stroke="${C.mustard}" stroke-width="12" stroke-linecap="round"/>` +
        `<ellipse cx="476" cy="82" rx="38" ry="34" fill="${C.mustard}" transform="rotate(-20 476 82)"/>` +
        `<path d="M500,60 C518,80 516,104 500,116 C490,100 486,80 500,60 Z" fill="${C.mustardDark}"/>` +
        `<ellipse cx="476" cy="82" rx="38" ry="34" fill="none" ${ink(6)} transform="rotate(-20 476 82)"/>` +
        `<ellipse cx="472" cy="84" rx="25" ry="22" fill="${C.glow}" ${ink(3)} transform="rotate(-20 472 84)"/>` +
        `<g fill="${C.ink}"><circle cx="464" cy="76" r="2.6"/><circle cx="476" cy="72" r="2.6"/><circle cx="460" cy="88" r="2.6"/><circle cx="472" cy="86" r="2.6"/><circle cx="484" cy="84" r="2.6"/><circle cx="468" cy="98" r="2.6"/><circle cx="480" cy="96" r="2.6"/></g>` +
        `<ellipse cx="458" cy="64" rx="9" ry="4" ${HIGHLIGHT} transform="rotate(-30 458 64)"/>`,
    ),
    // kệ gỗ thấp dưới ghế gội: khăn gấp, chai dầu gội có vòi bơm, hũ kem, chậu cây nhỏ
    'sh-shelf': svgDoc(
      SHELF_BOX,
      1,
      `<ellipse cx="312" cy="344" rx="292" ry="14" ${GROUND}/>` +
        `<rect x="50" y="330" width="30" height="16" rx="4" fill="${C.woodDark}" ${ink(4)}/><rect x="540" y="330" width="30" height="16" rx="4" fill="${C.woodDark}" ${ink(4)}/>` +
        `<rect x="30" y="188" width="560" height="148" rx="14" fill="${C.wood}"/>` +
        inside('cb', 'M44,188 H576 A14,14 0 0 1 590,202 V322 A14,14 0 0 1 576,336 H44 A14,14 0 0 1 30,322 V202 A14,14 0 0 1 44,188 Z', `<rect x="526" y="188" width="70" height="150" fill="${shade(C.wood)}"/>`) +
        `<rect x="30" y="188" width="560" height="148" rx="14" fill="none" ${ink(7)}/>` +
        `<rect x="56" y="214" width="234" height="98" rx="10" fill="${C.plank}" ${ink(3.5)}/><rect x="330" y="214" width="234" height="98" rx="10" fill="${C.plank}" ${ink(3.5)}/>` +
        `<path d="M66,298 H280 M340,298 H554" stroke="${shade(C.plank)}" stroke-width="10" stroke-linecap="round"/>` +
        `<circle cx="173" cy="256" r="10" fill="${C.mustard}" ${ink(3)}/><circle cx="447" cy="256" r="10" fill="${C.mustard}" ${ink(3)}/>` +
        `<rect x="18" y="158" width="584" height="38" rx="12" fill="${C.woodLight}" ${ink(6)}/>` +
        `<path d="M40,170 H300" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".45"/>` +
        // khăn gấp: khăn đất nung dưới, khăn kem viền xanh ngọc trên
        `<rect x="56" y="110" width="178" height="50" rx="12" fill="${C.terracotta}" ${ink(5)}/>` +
        `<path d="M70,128 H220 M70,144 H220" stroke="${C.cream}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M200,112 H222 A12,12 0 0 1 234,124 V148 A12,12 0 0 1 222,160 H200 Z" fill="${shade(C.terracotta)}"/>` +
        `<rect x="56" y="110" width="178" height="50" rx="12" fill="none" ${ink(5)}/>` +
        `<rect x="72" y="68" width="148" height="46" rx="12" fill="${C.cream}" ${ink(5)}/>` +
        `<path d="M86,92 H206" stroke="${C.tealLight}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M190,70 H208 A12,12 0 0 1 220,82 V102 A12,12 0 0 1 208,114 H190 Z" fill="${shade(C.cream)}"/>` +
        `<rect x="72" y="68" width="148" height="46" rx="12" fill="none" ${ink(5)}/>` +
        `<path d="M86,78 H150" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".6"/>` +
        // chai dầu gội xanh ngọc có vòi bơm và nhãn kem
        `<rect x="296" y="22" width="34" height="14" rx="5" fill="${C.cream}" ${ink(4)}/><rect x="326" y="24" width="28" height="9" rx="4" fill="${C.cream}" ${ink(4)}/>` +
        `<rect x="302" y="34" width="22" height="20" rx="4" fill="${C.cream}" ${ink(4)}/>` +
        `<rect x="276" y="50" width="74" height="110" rx="18" fill="${C.teal}"/>` +
        `<path d="M330,52 A18,18 0 0 1 350,68 V142 A18,18 0 0 1 332,160 H322 Z" fill="${C.tealDark}"/>` +
        `<rect x="276" y="50" width="74" height="110" rx="18" fill="none" ${ink(6)}/>` +
        `<rect x="287" y="88" width="52" height="46" rx="7" fill="${C.cream}" ${ink(3)}/>` +
        `<path d="M296,104 H330 M296,118 H322" stroke="${C.tealLight}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M286,64 V140" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".45"/>` +
        // hũ kem sứ có đai xanh men, nắp vàng nghệ
        `<rect x="384" y="98" width="92" height="62" rx="18" fill="${C.cream}" ${ink(6)}/>` +
        `<rect x="386" y="118" width="88" height="14" fill="${C.cobalt}"/>` +
        `<path d="M456,100 A18,18 0 0 1 474,118 V142 A18,18 0 0 1 456,158 Z" fill="${shade(C.cream)}" opacity=".8"/>` +
        `<rect x="384" y="98" width="92" height="62" rx="18" fill="none" ${ink(6)}/>` +
        `<rect x="378" y="80" width="104" height="24" rx="9" fill="${C.mustard}" ${ink(5)}/>` +
        `<path d="M392,88 H440" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".55"/>` +
        // chậu cây nhỏ
        `<path d="M512,116 H578 L570,160 H520 Z" fill="${C.terracotta}" ${ink(5)}/>` +
        `<path d="M556,116 H578 L570,160 H552 Z" fill="${shade(C.terracotta)}"/>` +
        `<path d="M512,116 H578 L570,160 H520 Z" fill="none" ${ink(5)}/>` +
        `<path d="M545,116 Q520,80 506,52 Q540,66 548,112 Z M547,116 Q560,70 588,44 Q584,84 552,114 Z M546,116 Q540,86 548,40 Q566,78 552,114 Z" fill="${C.leaf}" ${ink(3.5)}/>` +
        `<path d="M545,112 L512,60 M551,112 L582,52 M549,112 L548,50" stroke="${C.leafLight}" stroke-width="2.5" stroke-linecap="round"/>`,
    ),
    // vòi sen đồng: mặt vòi có lỗ, cổ đồng, dây thép
    'sh-shower': svgDoc(
      [0, 0, 150, 210],
      1,
      `<path d="M75,96 Q75,165 128,200" stroke="${C.ink}" stroke-width="17" fill="none" stroke-linecap="round"/>` +
        `<path d="M75,96 Q75,165 128,200" stroke="${C.silver}" stroke-width="10" fill="none" stroke-linecap="round"/>` +
        `<path d="M79,130 Q82,160 98,178" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>` +
        `<rect x="60" y="74" width="30" height="34" rx="9" fill="${C.mustardDark}" ${ink(5)}/>` +
        `<ellipse cx="75" cy="50" rx="62" ry="44" fill="${C.mustard}"/>` +
        inside('sw', 'M13,50 A62,44 0 1 0 137,50 A62,44 0 1 0 13,50 Z', `<path d="M110,14 C140,40 140,74 110,94 L150,94 L150,0 Z" fill="${C.mustardDark}"/>`) +
        `<ellipse cx="75" cy="50" rx="62" ry="44" fill="none" ${ink(6)}/>` +
        `<ellipse cx="72" cy="52" rx="42" ry="28" fill="${C.glow}" ${ink(3)}/>` +
        `<g fill="${C.ink}"><circle cx="58" cy="44" r="4"/><circle cx="72" cy="40" r="4"/><circle cx="86" cy="44" r="4"/><circle cx="52" cy="56" r="4"/><circle cx="66" cy="56" r="4"/><circle cx="80" cy="56" r="4"/><circle cx="94" cy="56" r="4"/><circle cx="64" cy="67" r="4"/><circle cx="80" cy="67" r="4"/></g>` +
        `<ellipse cx="40" cy="22" rx="14" ry="6" ${HIGHLIGHT} transform="rotate(-25 40 22)"/>`,
    ),
  }
}

