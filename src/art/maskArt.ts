import { MASK_BRUSH_R, MASK_EYES } from '../config'
import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from './aplus'
import { fillsOnly, linesOnly } from './outline'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/** The face's radius in canvas pixels; the face, hair, frown and pillow are drawn around the face centre at (0, 0). */
export const MK_FACE_R = 300

const FACE_BOX: Box = [-420, -420, 840, 840]
const HAIR_BOX: Box = [-440, -420, 880, 570]
const FROWN_BOX: Box = [-180, -280, 460, 210]
const PILLOW_BOX: Box = [-440, -420, 880, 790]
/** Đĩa sứ đựng dưa leo, vẽ quanh tâm đĩa: rộng TRAY.w, cao TRAY.h của MaskScene. */
const PLATE_BOX: Box = [-252, -100, 504, 204]

/** The image origin that puts the face centre of a texture drawn in `box` on the image's position. */
const centre = ([x, y, w, h]: Box) => ({ x: -x / w, y: -y / h })

/** Origins for drawing each mask texture at the face centre. */
export const MK_ORIGIN = { face: centre(FACE_BOX), hair: centre(HAIR_BOX), frown: centre(FROWN_BOX), pillow: centre(PILLOW_BOX), plate: centre(PLATE_BOX) }

const BROWN = '#2B201C'
/** Nét đậm hơn mảng bóng trong phần được tô màu: sợi tóc, môi dưới. */
const TINT_DEEP = shade('#FFFFFF', 0.3)
const FACE_CIRCLE = `M${-MK_FACE_R},0 a${MK_FACE_R},${MK_FACE_R} 0 1,0 ${2 * MK_FACE_R},0 a${MK_FACE_R},${MK_FACE_R} 0 1,0 ${-2 * MK_FACE_R},0 Z`
const HAIR =
  'M-330,130 Q-380,60 -370,-10 Q-420,-90 -380,-170 Q-370,-280 -270,-330 Q-200,-380 -110,-370 Q-50,-400 0,-380 Q50,-400 110,-370 ' +
  'Q200,-380 270,-330 Q370,-280 380,-170 Q420,-90 370,-10 Q380,60 330,130 Q290,80 250,60 L0,0 L-250,60 Q-290,80 -330,130Z'
const PILLOW = 'M-310,-410 H310 A120,120 0 0 1 430,-290 V140 A120,120 0 0 1 310,260 H-310 A120,120 0 0 1 -430,140 V-290 A120,120 0 0 1 -310,-410 Z'
const TOWEL = 'M-400,366 C-330,262 -160,240 0,244 C160,240 330,262 400,366 Z'
const PLATE = 'M-235,0 a235,85 0 1,0 470,0 a235,85 0 1,0 -470,0 Z'

/** Phần trong `clip` của `body`: mảng bóng và điểm sáng không tràn khỏi hình. */
const inside = (id: string, clip: string, body: string) => `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})">${body}</g>`

/** A closed eye, curved like a smile, centred where the rules put the eye, with its lashes. */
const closedEye = (e: { x: number; y: number }) => {
  const [x, y] = [Math.round(e.x * MK_FACE_R), Math.round(e.y * MK_FACE_R)]
  return `M${x - 34},${y - 8} Q${x},${y + 18} ${x + 34},${y - 8}`
}
const lashes = (e: { x: number; y: number }) => {
  const [x, y] = [Math.round(e.x * MK_FACE_R), Math.round(e.y * MK_FACE_R)]
  return [-24, -8, 8, 24].map(dx => `M${x + dx},${y + 4 + (Math.abs(dx) < 10 ? 2 : -2)} l${dx / 6},14`).join(' ')
}
/** Chân mày nghiêng theo bên mặt, trên mắt. */
const brow = (e: { x: number; y: number }) => {
  const [x, y] = [Math.round(e.x * MK_FACE_R), Math.round(e.y * MK_FACE_R)]
  const s = Math.sign(e.x)
  return `M${x - 44 * s},${y - 52} Q${x - 6 * s},${y - 80} ${x + 46 * s},${y - 62}`
}

export function maskTextures(): Record<string, string> {
  // mặt nhìn từ trên, nằm ngửa mắt nhắm đúng chỗ luật đặt mắt, hai tai; tô màu da
  const face =
    `<ellipse cx="-300" cy="16" rx="44" ry="66" fill="${TINT_SHADE}" ${ink(6)}/><ellipse cx="300" cy="16" rx="44" ry="66" fill="${TINT_SHADE}" ${ink(6)}/>` +
    `<circle cx="0" cy="0" r="${MK_FACE_R}" fill="#ffffff" ${ink(7)}/>` +
    `<path d="${MASK_EYES.map(brow).join(' ')}" fill="none" ${ink(9)}/>` +
    `<path d="${MASK_EYES.map(closedEye).join(' ')}" fill="none" stroke="${BROWN}" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="${MASK_EYES.map(lashes).join(' ')}" fill="none" ${ink(4)}/>` +
    `<path d="M10,20 C6,48 -2,62 -12,74 C-2,84 18,84 28,76" fill="none" ${ink(5)}/>` +
    `<path d="M-30,136 Q0,160 30,136" fill="none" ${ink(6)}/>`
  const faceShade =
    inside(
      'fs',
      FACE_CIRCLE,
      `<path d="M150,-262 C250,-170 292,-40 272,80 C252,190 172,262 60,294 L340,340 L340,-340 Z" fill="${TINT_SHADE}"/>` +
        `<ellipse cx="16" cy="76" rx="24" ry="9" fill="${TINT_SHADE}"/>`,
    ) +
    `<path d="M-14,166 Q0,174 14,166" stroke="${TINT_DEEP}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="-170" cy="84" rx="50" ry="25" fill="${C.lotus}" opacity=".5"/><ellipse cx="170" cy="84" rx="50" ry="25" fill="${C.lotus}" opacity=".5"/>`
  const faceShine = inside('fh', FACE_CIRCLE, `<ellipse cx="-190" cy="20" rx="32" ry="13" ${HIGHLIGHT} transform="rotate(-14 -190 20)"/>`)

  // tóc xoã trên gối quanh đỉnh đầu, sau mặt; tô màu tóc
  const hair =
    `<path d="${HAIR}" fill="#ffffff" ${ink(7)}/>` +
    `<path d="M-250,-300 Q-320,-220 -330,-120 M-150,-345 Q-230,-300 -270,-240 M150,-345 Q230,-300 270,-240 M250,-300 Q320,-220 330,-120 ` +
    `M-345,-60 Q-360,20 -330,90 M345,-60 Q360,20 330,90" stroke="${TINT_DEEP}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<path d="M-60,-372 Q-110,-340 -140,-300 M60,-372 Q110,-340 140,-300 M-372,-120 Q-386,-60 -366,-20 M372,-120 Q386,-60 366,-20" fill="none" ${ink(3.5)}/>`
  const hairShade = inside('hs', HAIR, `<path d="M300,-300 C380,-220 410,-100 390,-10 C380,60 350,110 320,140 L460,140 L460,-420 Z" fill="${TINT_SHADE}"/>`)
  // tóc xoã có vệt sáng; nằm dưới mặt
  const hairShine = inside('hh', HAIR, `<path d="M-300,-250 C-260,-310 -190,-350 -120,-360" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity=".35"/>`)
  // băng đô kem ôm sát mép trán, nằm ngoài vòng tô mặt nạ nên không che chỗ nào phải tô; mép trong trùng viền mặt
  const BAND = 'M-281.9,-102.6 A300,300 0 0 1 281.9,-102.6 L330.8,-120.4 A352,352 0 0 0 -330.8,-120.4 Z'
  const fold = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return `M${Math.round(Math.cos(a) * 312)},${Math.round(Math.sin(a) * 312)} L${Math.round(Math.cos(a) * 342)},${Math.round(Math.sin(a) * 342)}`
  }
  const band =
    `<path d="${BAND}" fill="${C.cream}"/>` +
    inside(
      'bd',
      BAND,
      `<path d="M-281.9,-102.6 A300,300 0 0 1 281.9,-102.6 L293.2,-106.7 A312,312 0 0 0 -293.2,-106.7 Z" fill="${shade(C.cream)}"/>` +
        `<path d="${[-128, -104, -76, -52].map(fold).join(' ')}" fill="none" stroke="${C.tileSeam}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M-294,-170 A340,340 0 0 1 -116,-320" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".45"/>`,
    ) +
    `<path d="${BAND}" fill="none" ${ink(6)}/>`
  // một chấm cọ bùn đất sét: lông cọ để lại vệt sáng tối chạy theo hướng vuốt (cảnh xoay chấm theo hướng ngón tay)
  const DAB_R = Math.round(MASK_BRUSH_R * MK_FACE_R)
  const dab = (base: string, light: string, dark: string) => {
    const circle = `M${-DAB_R},0 a${DAB_R},${DAB_R} 0 1,0 ${2 * DAB_R},0 a${DAB_R},${DAB_R} 0 1,0 ${-2 * DAB_R},0 Z`
    const rows = (ys: number[]) => ys.map(y => `M${-DAB_R},${y} H${DAB_R}`).join(' ')
    return svgDoc(
      [-DAB_R - 2, -DAB_R - 2, 2 * DAB_R + 4, 2 * DAB_R + 4],
      1,
      `<path d="${circle}" fill="${base}"/>` +
        inside('dc', circle, `<path d="${rows([-30, 12, 38])}" stroke="${light}" stroke-width="4" opacity=".7"/><path d="${rows([-12, 28])}" stroke="${dark}" stroke-width="2.5" opacity=".7"/>`),
    )
  }

  const anger = 'M228,-228 Q250,-240 272,-228 M228,-172 Q250,-160 272,-172 M222,-222 Q210,-200 222,-178 M278,-222 Q290,-200 278,-178'
  return {
    // gối kem viền khâu xanh ngọc, khăn đất nung sọc kem đắp vai dưới cằm
    'mk-pillow': svgDoc(
      PILLOW_BOX,
      1,
      `<path d="${PILLOW}" fill="${C.cream}"/>` +
        inside(
          'pl',
          PILLOW,
          `<path d="M330,-410 C410,-330 432,-200 430,140 C420,220 360,262 300,262 L440,262 L440,-410 Z" fill="${shade(C.cream)}"/>` +
            `<path d="M-380,-300 C-360,-360 -300,-392 -220,-396" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" opacity=".6"/>`,
        ) +
        `<path d="M-300,-384 H300 A100,100 0 0 1 404,-284 V136 A100,100 0 0 1 300,236 H-300 A100,100 0 0 1 -404,136 V-284 A100,100 0 0 1 -300,-384 Z" fill="none" stroke="${C.mintTeal}" stroke-width="6" stroke-dasharray="20 16"/>` +
        `<path d="${PILLOW}" fill="none" ${ink(7)}/>` +
        `<path d="${TOWEL}" fill="${C.terracotta}"/>` +
        inside(
          'tw',
          TOWEL,
          `<path d="M160,240 C330,262 400,366 400,366 L160,366 C260,330 250,276 160,240 Z" fill="${shade(C.terracotta)}"/>` +
            `<path d="M-340,330 C-240,288 240,288 340,330 M-290,356 C-200,326 200,326 290,356" fill="none" stroke="${C.cream}" stroke-width="9" stroke-linecap="round"/>`,
        ) +
        `<path d="${TOWEL}" fill="none" ${ink(7)}/>`,
    ),
    // tinted parts keep their brown lines in a `-line` texture, drawn untinted on top
    'mk-face': svgDoc(FACE_BOX, 1, fillsOnly(face) + faceShade),
    'mk-face-line': svgDoc(FACE_BOX, 1, linesOnly(face) + faceShine + band),
    'mk-hair': svgDoc(HAIR_BOX, 1, fillsOnly(hair) + hairShade),
    'mk-hair-line': svgDoc(HAIR_BOX, 1, linesOnly(hair) + hairShine),
    // chấm cọ bùn đất sét, và chấm ở vùng bóng phía dưới phải của mặt
    'mk-dab': dab(C.phoHouseMoss, C.houseLeaf, C.phoHouseMossDark),
    'mk-dab-shade': dab(C.phoHouseMossDark, C.phoHouseMoss, shade(C.phoHouseMossDark)),
    // một lát dưa leo có độ dày: vỏ xanh, ruột nhạt, vòng hạt kem, điểm sáng
    'mk-cucumber': svgDoc(
      [0, 0, 132, 132],
      1,
      `<circle cx="66" cy="69" r="60" fill="${shade(C.leaf)}" ${ink(5)}/>` +
        `<circle cx="66" cy="63" r="60" fill="${C.leaf}" ${ink(5)}/>` +
        `<circle cx="66" cy="63" r="50" fill="${C.cucumber}" ${ink(3)}/>` +
        `<circle cx="66" cy="63" r="26" fill="${C.mint}" opacity=".6"/>` +
        [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<ellipse cx="66" cy="41" rx="4" ry="7" fill="${C.cream}" stroke="${C.leafLight}" stroke-width="1.5" transform="rotate(${i * 45} 66 63)"/>`).join('') +
        `<path d="M28,46 C34,34 44,26 56,22" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".55"/>`,
    ),
    // knitted brows over the closed eyes and a red cross mark: the customer frowns
    'mk-frown': svgDoc(
      FROWN_BOX,
      1,
      `<path d="M-168,-104 Q-130,-118 -84,-82 M168,-104 Q130,-118 84,-82" stroke="${BROWN}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
        `<path d="${anger}" stroke="${C.cream}" stroke-width="17" fill="none" stroke-linecap="round"/>` +
        `<path d="${anger}" stroke="${C.lantern}" stroke-width="9" fill="none" stroke-linecap="round"/>`,
    ),
    // đĩa sứ viền xanh men chờ hai lát dưa leo, có bóng sàn
    'mk-plate': svgDoc(
      PLATE_BOX,
      1,
      `<ellipse cx="6" cy="12" rx="238" ry="86" ${GROUND}/>` +
        `<path d="${PLATE}" fill="${C.cream}"/>` +
        inside('pt', PLATE, `<path d="M120,-80 C230,-50 250,40 160,80 C100,96 40,98 -20,96 L250,96 L250,-90 Z" fill="${shade(C.cream)}"/>`) +
        `<ellipse cx="0" cy="0" rx="208" ry="64" fill="none" stroke="${C.cobalt}" stroke-width="6"/>` +
        `<ellipse cx="0" cy="4" rx="172" ry="48" fill="none" stroke="${C.tileSeam}" stroke-width="3"/>` +
        `<path d="M-190,-30 C-150,-56 -90,-68 -30,-72" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".7"/>` +
        `<path d="${PLATE}" fill="none" ${ink(6)}/>`,
    ),
  }
}
