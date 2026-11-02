import { BREED_IDS, type BreedId } from '../sim/pets'
import { GROUND, HIGHLIGHT, ink, shade } from './aplus'
import { svgDoc } from './svg'

// Four cats and four dogs from two body plans, drawn in px with the feet at 0,0, facing right.
// A+: each body part has its hard-edged shade at the lower right and the head a highlight; lines in three weights.

/** The pet pictures: two walk steps, sitting, sitting with the tail swung over, the happy hop, and asleep. */
export const PET_POSES = ['walk0', 'walk1', 'sit', 'wag', 'happy', 'sleep'] as const
export type PetPose = (typeof PET_POSES)[number]

/** Canvas pixels per art unit. */
export const PET_PX = 1.55
/** Every pet texture's viewBox: the feet at 0,0 with room for the tallest ears and the shadow. */
export const PET_VIEWBOX: [number, number, number, number] = [-50, -70, 100, 76]
/** The feet point as a fraction of the texture. */
export const PET_ORIGIN = { x: 0.5, y: 70 / 76 }

export const petKey = (breed: BreedId, pose: PetPose) => `pet-${breed}-${pose}`

const PET_INK = '#4A2E22'
const PINK = '#F28CA0'
const NOSE = '#E8708A'
const OUTER = 2.6
const INNER = `fill="none" ${ink(1.6)}`
const DETAIL = `fill="none" ${ink(1.1)}`
const n = (v: number) => +v.toFixed(2)
const ell = (cx: number, cy: number, rx: number, ry = rx) => `M${n(cx - rx)},${n(cy)} a${rx},${ry} 0 1 0 ${n(2 * rx)},0 a${rx},${ry} 0 1 0 ${n(-2 * rx)},0Z`

let clips = 0
/** A shape in `fill`, shaded at its lower right by itself less itself moved up and left, `inner` clipped to it, then its outline. */
const solid = (d: string, fill: string, inner = '', dx = 2.4, dy = 2.2, w = OUTER) => {
  const id = `p${clips++}`
  return (
    `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${shade(fill)}"/>` +
    `<g clip-path="url(#${id})"><path d="${d}" transform="translate(${-dx} ${-dy})" fill="${fill}"/>${inner}</g><path d="${d}" fill="none" ${ink(w)}/>`
  )
}
/** A highlight ellipse turned `deg` degrees. */
const shine = (cx: number, cy: number, rx: number, ry: number, deg = -25) =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${rx}" ry="${ry}" transform="rotate(${deg} ${n(cx)} ${n(cy)})" ${HIGHLIGHT}/>`
/** A thick ink line under a fur line with its shade along the lower right: a tail or a leg with an outline, in one go. */
const furLine = (d: string, fur: string, w: number) =>
  `<path d="${d}" stroke="${PET_INK}" stroke-width="${w + 5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" stroke="${fur}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" transform="translate(${n(w * 0.22)} ${n(w * 0.16)})" stroke="${shade(fur)}" stroke-width="${n(w * 0.4)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
/** A paw at the foot of a leg, its two toes drawn in. */
const paw = (x: number, y: number, fill: string, front = false) =>
  solid(ell(front ? x : x + 0.8, y, 3.6, 2.4), fill, '', 0.9, 0.8, 2.2) +
  (front ? `<path d="M${n(x - 1.2)},${n(y - 0.6)} v1.6 M${n(x + 1.2)},${n(y - 0.6)} v1.6" ${DETAIL}/>` : `<path d="M${n(x + 1.4)},${n(y - 0.6)} v1.6 M${n(x + 3)},${n(y - 0.4)} v1.4" ${DETAIL}/>`)
/** A tail flipped to the body's other side. */
const swung = (tail: string) => (tail ? `<g transform="scale(-1,1)">${tail}</g>` : '')
/** A body seen from the side: a dip behind the shoulders, the chest full and the belly tucked up. */
const bean = (cx: number, cy: number, rx: number, ry: number) => {
  const p = (x: number, y: number) => `${n(cx + rx * x)},${n(cy + ry * y)}`
  return `M${p(-1, 0)} C${p(-1, -0.8)} ${p(-0.55, -1)} ${p(0, -0.92)} C${p(0.55, -1.02)} ${p(1, -0.7)} ${p(1, -0.05)} C${p(1, 0.7)} ${p(0.6, 1)} ${p(0.15, 0.82)} C${p(-0.3, 0.7)} ${p(-0.75, 1)} ${p(-0.94, 0.55)} C${p(-1, 0.35)} ${p(-1, 0.2)} ${p(-1, 0)}Z`
}
/** A cat's head, round with a tuft at each cheek, centred on (hx, hy) and `sx` by `sy` times the size of the walking cat's. */
const catHead = (hx: number, hy: number, sx = 1, sy = sx) => {
  const p = (x: number, y: number) => `${n(hx + x * sx)},${n(hy + y * sy)}`
  return (
    `M${p(-12, 0)} C${p(-12, -8)} ${p(-6.4, -12)} ${p(0, -12)} C${p(6.4, -12)} ${p(12, -8)} ${p(12, 0)} C${p(12, 4.2)} ${p(10, 7.4)} ${p(6.8, 9)} ` +
    `L${p(7.6, 10.6)} L${p(3.4, 10.2)} C${p(0.6, 11)} ${p(-3.4, 10.8)} ${p(-6.2, 9.4)} L${p(-9.4, 10.2)} L${p(-8.6, 7.4)} C${p(-11, 5.2)} ${p(-12, 2.8)} ${p(-12, 0)}Z`
  )
}
/** An eye with a large and a small catch light. */
const eye = (cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${rx}" ry="${ry}" fill="${PET_INK}"/><circle cx="${n(cx + 0.5)}" cy="${n(cy - 1)}" r=".9" fill="#fff"/><circle cx="${n(cx - 0.6)}" cy="${n(cy + 1)}" r=".45" fill="#fff"/>`

interface Look {
  kind: 'cat' | 'dog'
  fur: string
  mark: string
  mark2?: string
  belly: string
  pattern?: 'tabby' | 'plain' | 'calico' | 'points'
  ear?: 'up' | 'big' | 'pom'
  tail?: 'curl' | 'sickle' | 'stub' | 'pom'
  leg?: number
  ridge?: boolean
  blaze?: boolean
  fluffy?: boolean
}

const LOOKS: Record<BreedId, Look> = {
  muop: { kind: 'cat', fur: '#E8A04A', mark: '#C0702A', belly: '#FBF3E4', pattern: 'tabby' },
  mun: { kind: 'cat', fur: '#3B3230', mark: '#2B201C', belly: '#3B3230', pattern: 'plain' },
  tamthe: { kind: 'cat', fur: '#FBF7EE', mark: '#E3A73B', mark2: '#3B3230', belly: '#FBF7EE', pattern: 'calico' },
  xiem: { kind: 'cat', fur: '#F1E3C8', mark: '#5B4033', belly: '#F6ECDB', pattern: 'points' },
  chota: { kind: 'dog', fur: '#D9A35A', mark: '#B37E3A', belly: '#F3E1BF', ear: 'up', tail: 'curl', leg: 15 },
  phuquoc: { kind: 'dog', fur: '#5A4033', mark: '#3E2B22', belly: '#7A5A47', ear: 'up', tail: 'sickle', leg: 19, ridge: true },
  corgi: { kind: 'dog', fur: '#E39A4A', mark: '#C27A30', belly: '#FBF7EE', ear: 'big', tail: 'stub', leg: 7, blaze: true },
  poodle: { kind: 'dog', fur: '#E9C9A0', mark: '#D4AA7A', belly: '#E9C9A0', ear: 'pom', tail: 'pom', leg: 17, fluffy: true },
}

/* ---- cats ---- */
function catStripes(b: Look, cx: number, cy: number, num: number, len: number): string {
  if (b.pattern !== 'tabby') return ''
  let s = ''
  for (let i = 0; i < num; i++) s += `<path d="M${cx + i * 7 - num * 3.5},${cy} q2.4,${len / 2} 0,${len}" stroke="${b.mark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
  return s
}

/** The ears, back then front, each with its pink inside. */
function catEars(b: Look, hx: number, hy: number, front: boolean, s = 1): string {
  const c = b.pattern === 'points' ? b.mark : b.fur
  const p = (x: number, y: number) => `${n(hx + x * s)},${n(hy + y * s)}`
  const ear = (x0: number, tip: [number, number], x1: number, flip: number) =>
    solid(`M${p(x0, -6)} Q${p(x0 + flip * -0.6, -14)} ${p(tip[0], tip[1])} Q${p((tip[0] + x1) / 2 + flip * 2.2, -14.6)} ${p(x1, -9.4)}Z`, c, '', 1, 1, 2.4) +
    `<path d="M${p(x0 + flip * 1.6, -8)} Q${p(x0 + flip * 1.4, -12.6)} ${p(tip[0] + flip * 0.6, tip[1] + 3.6)} Q${p((tip[0] + x1) / 2 + flip * 0.6, -12.6)} ${p(x1 - flip * 1.4, -9.6)}Z" fill="${PINK}"/>`
  return front
    ? ear(-11.4, [-10, -18.6], -2, 1) + ear(11.4, [10, -18.6], 2, -1)
    : ear(-9, [-7, -19], 0, 1) + ear(10.4, [6, -20], 1.4, -1)
}

function catHeadSide(b: Look, hx: number, hy: number, closed: boolean, s = 1): string {
  const pts = b.pattern === 'points'
  const q = (x: number) => n(hx + x * s)
  const r = (y: number) => n(hy + y * s)
  let inner = ''
  if (b.pattern === 'calico') inner += `<path d="M${q(-12)},${r(-4)} Q${q(-6)},${r(-14)} ${q(1)},${r(-12)} Q${q(-3)},${r(-3)} ${q(-12)},${r(-4)}Z" fill="${b.mark2}"/>`
  if (b.pattern === 'tabby') inner += `<path d="M${q(-3)},${r(-11.6)} v4 M${q(1)},${r(-12)} v4.4 M${q(5)},${r(-11)} v3.6" stroke="${b.mark}" stroke-width="2.2" stroke-linecap="round"/>`
  if (pts) inner += `<ellipse cx="${q(5)}" cy="${r(3)}" rx="${8 * s}" ry="${7 * s}" fill="${b.mark}"/>`
  inner += shine(hx - 5 * s, hy - 7 * s, 3.2 * s, 1.5 * s)
  let out = catEars(b, hx, hy, false, s) + solid(catHead(hx, hy, s), b.fur, inner, 2.4 * s, 2 * s)
  out += `<path d="M${q(1)},${r(4.4)} Q${q(6)},${r(1)} ${q(11)},${r(4)} Q${q(10)},${r(8.4)} ${q(5)},${r(8)} Q${q(1.4)},${r(7.6)} ${q(1)},${r(4.4)}Z" fill="${pts ? b.mark : b.belly}"/>`
  out += `<path d="M${q(9.4)},${r(1.8)} l2.4,1.6 l-2.4,1.6z" fill="${NOSE}" ${ink(1)}/>`
  out += `<path d="M${q(8.6)},${r(5.8)} q-1,1.6 -3,1.2" ${DETAIL}/>`
  if (closed) out += `<path d="M${q(-1.6)},${r(-1)} q2.6,2.2 5.2,0 M${q(5.4)},${r(-1)} q2.3,2 4.6,0" stroke="${PET_INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
  else out += eye(hx + 1 * s, hy - 1.5 * s, 2.2 * s, 2.9 * s) + eye(hx + 7.6 * s, hy - 1.5 * s, 2 * s, 2.7 * s)
  out += `<path d="M${q(8.6)},${r(5)} l9,-1.6 M${q(8.6)},${r(6.4)} l9,1.2" stroke="${PET_INK}" stroke-width=".9" stroke-linecap="round" opacity=".7"/>`
  return out
}

function catBodyInner(b: Look): string {
  let s = ''
  if (b.pattern === 'calico') s += `<path d="M-14,-27 Q-6,-31 2,-27 Q0,-20 -8,-21 Q-14,-22 -14,-27Z" fill="${b.mark}"/><path d="M4,-28 Q12,-30 16,-24 Q10,-21 5,-23Z" fill="${b.mark2}"/>`
  s += catStripes(b, -2, -30, 4, 9)
  if (b.pattern !== 'plain') s += `<ellipse cx="3" cy="-11" rx="12" ry="3.8" fill="${b.belly}"/>`
  return s + shine(-9, -25.6, 5, 1.8, -6)
}

function catWalk(b: Look, step: boolean): string {
  const a = step ? 3 : -3
  const pts = b.pattern === 'points'
  const legC = pts ? b.mark : b.fur
  const pawC = pts ? b.mark : b.belly === b.fur ? b.fur : b.belly
  let s = ''
  s += furLine(`M-19,-21 Q-31,-25 -30,-40 Q-29,-48 -24,-49`, pts ? b.mark : b.fur, 6)
  if (b.pattern === 'tabby') s += `<path d="M-29,-33 l5,1 M-30,-40 l5,1.5" stroke="${b.mark}" stroke-width="2.4" stroke-linecap="round"/>`
  // far legs, then body, then near legs
  s += furLine(`M${-14 - a},-14 L${-14 - a},-3`, shade(legC), 5) + paw(-14 - a, -2.2, shade(pawC))
  s += furLine(`M${11 + a},-14 L${11 + a},-3`, shade(legC), 5) + paw(11 + a, -2.2, shade(pawC))
  s += solid(bean(-0.5, -19.4, 20.5, 10.6), b.fur, catBodyInner(b), 3.2, 3)
  s += furLine(`M${-9 + a},-14 L${-9 + a},-2.6`, legC, 5) + paw(-9 + a, -1.8, pawC)
  s += furLine(`M${15 - a},-14 L${15 - a},-2.6`, legC, 5) + paw(15 - a, -1.8, pawC)
  s += `<path d="M13,-16 q1.4,1.8 3.4,0.8 M16,-15 q1.2,1.6 3,0.4" ${DETAIL}/>`
  s += catHeadSide(b, 21, -31, false)
  return s
}

function catSit(b: Look, swing = false): string {
  const pts = b.pattern === 'points'
  let s = ''
  const tail = furLine(`M8,-4 Q22,-2 20,-14 Q19,-20 14,-22`, pts ? b.mark : b.fur, 6)
  s += swing ? swung(tail) : tail
  let inner = ''
  if (b.pattern === 'calico') inner += `<path d="M-12,-10 Q-10,-20 -3,-19 Q-4,-9 -12,-10Z" fill="${b.mark}"/><path d="M5,-22 Q11,-20 11,-12 Q5,-14 5,-22Z" fill="${b.mark2}"/>`
  if (b.pattern === 'tabby') inner += `<path d="M-12,-15 h4 M-13,-9 h4 M8,-15 h4 M9,-9 h4" stroke="${b.mark}" stroke-width="2.4" stroke-linecap="round"/>`
  if (b.pattern !== 'plain') inner += `<ellipse cx="0" cy="-14" rx="6" ry="9" fill="${b.belly}"/>`
  inner += shine(-7, -22, 3.4, 1.4, -50)
  s += solid('M-12.6,-2 C-15.4,-6 -15.6,-14 -12,-20.6 C-10,-25 -5.6,-28.4 0,-28.4 C5.6,-28.4 10,-25 12,-20.6 C15.6,-14 15.4,-6 12.6,-2Z', b.fur, inner, 2.6, 2)
  s += `<path d="M-12.4,-9.6 Q-9,-13.4 -8.4,-4.4 M12.4,-9.6 Q9,-13.4 8.4,-4.4" ${INNER}/>`
  const legC = pts ? b.mark : b.fur
  const pawC = pts ? b.mark : b.belly === b.fur ? b.fur : b.belly
  s += furLine('M-4.4,-11 L-4.8,-3.4', legC, 4.4) + furLine('M4.4,-11 L4.8,-3.4', legC, 4.4)
  s += paw(-5, -2.4, pawC, true) + paw(5, -2.4, pawC, true)
  s += `<path d="M-2.4,-23 q2.4,2 4.8,0" ${DETAIL}/>`
  // head, front view
  const hx = 0
  const hy = -38
  let face = ''
  if (b.pattern === 'calico') face += `<path d="M${hx - 13},${hy - 2} Q${hx - 8},${hy - 12} ${hx - 1},${hy - 11} Q${hx - 3},${hy - 3} ${hx - 13},${hy - 2}Z" fill="${b.mark2}"/><path d="M${hx + 3},${hy - 11} Q${hx + 10},${hy - 10} ${hx + 13},${hy - 3} Q${hx + 6},${hy - 5} ${hx + 3},${hy - 11}Z" fill="${b.mark}"/>`
  if (b.pattern === 'tabby') face += `<path d="M${hx - 3},${hy - 11} v4 M${hx},${hy - 11.5} v4.5 M${hx + 3},${hy - 11} v4" stroke="${b.mark}" stroke-width="2.2" stroke-linecap="round"/>`
  if (pts) face += `<ellipse cx="${hx}" cy="${hy + 3}" rx="8.4" ry="7.4" fill="${b.mark}"/>`
  face += shine(hx - 6.4, hy - 6.6, 3.2, 1.5)
  s += catEars(b, hx, hy, true) + solid(catHead(hx, hy, 13 / 12, 11.5 / 12), b.fur, face, 2.4, 2)
  s += eye(hx - 5, hy - 1, 2.4, 3) + eye(hx + 5, hy - 1, 2.4, 3)
  s += `<path d="M${hx - 1.8},${hy + 2.8} h3.6 l-1.8,2z" fill="${NOSE}" ${ink(1)}/>`
  s += `<path d="M${hx - 2.8},${hy + 6} q1.4,1.3 2.8,0 q1.4,1.3 2.8,0" ${INNER}/>`
  s += `<path d="M${hx - 7},${hy + 4} l-9,-1 M${hx - 7},${hy + 5.5} l-9,1.5 M${hx + 7},${hy + 4} l9,-1 M${hx + 7},${hy + 5.5} l9,1.5" stroke="${PET_INK}" stroke-width=".9" stroke-linecap="round" opacity=".7"/>`
  return s
}

function catSleep(b: Look): string {
  const pts = b.pattern === 'points'
  let inner = ''
  if (b.pattern === 'calico') inner += `<path d="M-18,-14 Q-10,-21 -2,-18 Q-6,-10 -16,-10Z" fill="${b.mark}"/><path d="M0,-19 Q8,-20 10,-14 Q4,-13 0,-19Z" fill="${b.mark2}"/>`
  inner += catStripes(b, -6, -21, 4, 7) + shine(-12, -16.6, 5, 1.6, -10)
  let s = solid(bean(-3, -10.4, 21, 10), b.fur, inner, 3, 2.6)
  s += furLine(`M-20,-4 Q-6,2 12,-1`, pts ? b.mark : b.fur, 6)
  s += catHeadSide(b, 13, -13, true, 0.875)
  return s
}

/* ---- dogs ---- */
function dogEars(b: Look, hx: number, hy: number, front: boolean): string {
  const f = b.fur
  if (b.ear === 'pom') {
    const pom = (x: number) => solid(ell(x, hy + 3, 6.5), b.mark, `<path d="M${x - 2.4},${hy + 2} q2.4,-2 4.8,0" ${DETAIL}/>`, 1.4, 1.2, 2.4)
    return front ? pom(hx - 12) + pom(hx + 12) : pom(hx - 5)
  }
  const big = b.ear === 'big'
  const h = big ? 20 : 15
  const w = big ? 7 : 5.5
  const one = (x: number, lean: number) =>
    solid(`M${x - w},${hy - 6} Q${x - w * 0.6 + lean * 0.3},${hy - 6 - h * 0.7} ${x + lean},${hy - 6 - h} Q${x + w * 0.7 + lean * 0.3},${hy - 6 - h * 0.6} ${x + w},${hy - 7}Z`, f, '', 1.2, 1, 2.4) +
    `<path d="M${x - w + 2.4},${hy - 7.5} Q${x - w * 0.4 + lean * 0.3},${hy - 4 - h * 0.6} ${x + lean * 0.8},${hy - 3 - h} Q${x + w * 0.4 + lean * 0.3},${hy - 6 - h * 0.5} ${x + w - 2.4},${hy - 8}Z" fill="${big ? '#F6C9B8' : b.mark}"/>`
  return front ? one(hx - 7, -3) + one(hx + 7, 3) : one(hx - 5, -2) + one(hx + 3, 2)
}

function dogHeadSide(b: Look, hx: number, hy: number, closed: boolean, tongue = false): string {
  let s = dogEars(b, hx, hy, false)
  if (b.fluffy) s += solid(ell(hx - 1, hy - 10, 7), b.fur, `<path d="M${hx - 3.4},${hy - 11} q2.4,-2.4 4.8,0" ${DETAIL}/>`, 1.4, 1.2, 2.4)
  let inner = ''
  if (b.blaze) inner += `<path d="M${hx + 2},${hy - 12} Q${hx + 5},${hy - 2} ${hx + 8},${hy + 6} L${hx + 1},${hy + 8} Q${hx},${hy - 2} ${hx + 2},${hy - 12}Z" fill="${b.belly}"/>`
  inner += shine(hx - 4.6, hy - 6.4, 3.2, 1.5)
  s += solid(ell(hx, hy, 11.5), b.fur, inner, 2.4, 2)
  if (b.ridge) s += `<path d="M${hx - 6},${hy - 9} q3,2 6,0" ${DETAIL}/>`
  s += solid(`M${hx + 4},${hy - 2} Q${hx + 17},${hy - 3.4} ${hx + 18},${hy + 3} Q${hx + 17},${hy + 9} ${hx + 5},${hy + 8}Z`, b.belly, '', 1, 1.4, 2.4)
  s += `<ellipse cx="${hx + 17}" cy="${hy + 0.4}" rx="3" ry="2.4" fill="${PET_INK}"/><circle cx="${hx + 16.2}" cy="${hy - 0.4}" r=".8" fill="#fff" opacity=".7"/>`
  s += `<path d="M${hx + 16.4},${hy + 4.6} q-3,2 -6.4,0.8" ${INNER}/>`
  if (tongue) s += `<path d="M${hx + 9},${hy + 7.6} q2,6 5,1 z" fill="${NOSE}" ${ink(1.4)}/>`
  if (closed) s += `<path d="M${hx + 1},${hy - 2} q2.6,2.2 5.2,0" stroke="${PET_INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
  else s += eye(hx + 4, hy - 3, 2.3, 2.8)
  if (b.ear === 'pom') s += dogEars(b, hx, hy, false)
  return s
}

function dogTail(b: Look, wag: boolean): string {
  const f = b.fur
  const w = wag ? 1 : -1
  if (b.tail === 'curl') return furLine(`M-22,-26 Q-32,-36 -26,-44 Q-18,-48 ${-18 + w * 2},-40`, f, 6)
  if (b.tail === 'sickle') return furLine(`M-22,-26 Q-28,-38 ${-24 + w * 3},-50`, f, 5)
  if (b.tail === 'stub') return furLine(`M-24,-20 L${-29 + w},-22`, f, 6)
  return furLine(`M-22,-26 L${-27 + w * 2},-38`, f, 3) + solid(ell(-28 + w * 2, -41, 6), b.mark, '', 1.4, 1.2, 2.4)
}

function dogTailSit(b: Look, wag: boolean): string {
  const w = wag ? 2 : 0
  if (b.tail === 'curl') return furLine(`M9,-5 Q20,-6 ${19 + w},-15 Q18,-21 ${13 + w},-20`, b.fur, 6)
  if (b.tail === 'sickle') return furLine(`M9,-4 Q19,-8 ${18 + w},-22`, b.fur, 5)
  if (b.tail === 'stub') return ''
  return furLine(`M9,-5 L${16 + w},-11`, b.fur, 3) + solid(ell(18 + w, -13, 6), b.mark, '', 1.4, 1.2, 2.4)
}

function dogTailLie(b: Look): string {
  if (b.tail === 'curl') return furLine('M-22,-12 Q-32,-13 -31,-20 Q-29,-25 -24,-23', b.fur, 6)
  if (b.tail === 'sickle') return furLine('M-22,-11 Q-32,-11 -36,-19', b.fur, 5)
  if (b.tail === 'stub') return ''
  return furLine('M-20,-11 L-28,-13', b.fur, 3) + solid(ell(-31, -14, 6), b.mark, '', 1.4, 1.2, 2.4)
}

/** The fluffy dog's body: three round tufts of curls. */
const curls = (b: Look, parts: [number, number, number][]) =>
  parts.map(([x, y, r]) => solid(ell(x, y, r), b.fur, `<path d="M${x - r * 0.4},${y - r * 0.2} q${r * 0.4},${-r * 0.4} ${r * 0.8},0" ${DETAIL}/>`, r * 0.18, r * 0.16)).join('')

function dogWalk(b: Look, step: boolean): string {
  const a = step ? 3 : -3
  const L = b.leg ?? 15
  const by = -L - 9
  let s = dogTail(b, step)
  const leg = (x: number, near: boolean) => {
    const c = near ? b.fur : b.mark
    return furLine(`M${x},${by + 4} L${x},-3`, c, b.fluffy ? 5 : 5.5) + (b.fluffy ? solid(ell(x, -2.4, 4), c, '', 0.8, 0.7, 2.2) : paw(x, -2, near ? b.fur : b.mark))
  }
  s += leg(-16 - a, false) + leg(12 + a, false)
  if (b.fluffy) s += solid(ell(-2, by, 18, 7.5), b.fur, '', 2, 1.6) + curls(b, [[-14, by - 1, 8.5], [10, by - 1, 9.5]])
  else {
    let inner = `<ellipse cx="3" cy="${by + 7.4}" rx="13" ry="3.6" fill="${b.belly}"/>`
    if (b.ridge) inner += `<path d="M-14,${by - 8} Q-4,${by - 12} 8,${by - 8}" stroke="${b.mark}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    inner += shine(-10, by - 6.4, 5, 1.8, -6)
    s += solid(bean(-2, by, b.ear === 'big' ? 24 : 22, 10), b.fur, inner, 3.2, 3)
    if (b.ridge) s += `<path d="M-12,${by - 9.5} l3,2.4 M-6,${by - 10.6} l3,2.4 M0,${by - 10.8} l3,2.4" ${DETAIL}/>`
  }
  s += leg(-11 + a, true) + leg(16 - a, true)
  s += dogHeadSide(b, 20, by - 13, false)
  return s
}

/** Sitting facing out; `wag` nudges the tail tip, `swing` flips the tail to the other side. */
function dogSit(b: Look, opts: { wag?: boolean; tongue?: boolean; swing?: boolean } = {}): string {
  let s = ''
  const L = b.leg ?? 15
  const tail = dogTailSit(b, !!opts.wag)
  s += opts.swing ? swung(tail) : tail
  const top = -22 - L * 0.6
  if (b.fluffy) s += furLine(`M-5,${top + 16} L-5,-3`, b.fur, 5) + furLine(`M5,${top + 16} L5,-3`, b.fur, 5) + curls(b, [[0, top + 8, 12]])
  else {
    const inner = `<path d="M-6,${top + 2} Q0,${top + 12} 6,${top + 2} L4,-4 H-4Z" fill="${b.belly}"/>` + shine(-7.6, top + 7, 3.4, 1.4, -55)
    s += solid(`M-13,-2 C-15.4,-8 -15,${top + 10} -6,${top} Q0,${top - 3} 6,${top} C15,${top + 10} 15.4,-8 13,-2Z`, b.fur, inner, 2.6, 2)
    s += `<path d="M-12.6,-9.6 Q-9.4,-13.6 -8.6,-4.4 M12.6,-9.6 Q9.4,-13.6 8.6,-4.4" ${INNER}/>`
    s += furLine(`M-4.6,${top + 17} L-4.8,-3.4`, b.fur, 4.6) + furLine(`M4.6,${top + 17} L4.8,-3.4`, b.fur, 4.6)
  }
  const pawC = b.fluffy ? b.fur : b.belly
  s += paw(-5.5, -2.2, pawC, true) + paw(5.5, -2.2, pawC, true)
  const hx = 0
  const hy = top - 12
  s += dogEars(b, hx, hy, true)
  if (b.fluffy) s += solid(ell(hx, hy - 10, 8), b.fur, `<path d="M${hx - 3},${hy - 11} q3,-3 6,0" ${DETAIL}/>`, 1.4, 1.2, 2.4)
  let inner = ''
  if (b.blaze) inner += `<path d="M${hx - 2.5},${hy - 12} Q${hx},${hy - 2} ${hx - 5},${hy + 6} H${hx + 5} Q${hx},${hy - 2} ${hx + 2.5},${hy - 12}Z" fill="${b.belly}"/>`
  inner += shine(hx - 6, hy - 5.6, 3.2, 1.5)
  s += solid(ell(hx, hy, 12.5, 11.5), b.fur, inner, 2.4, 2)
  if (b.ridge) s += `<path d="M${hx - 3},${hy - 11} q3,3 6,0" ${DETAIL}/>`
  s += solid(ell(hx, hy + 5, 7, 5.5), b.belly, '', 1, 1.2, 2.4)
  s += `<ellipse cx="${hx}" cy="${hy + 2.6}" rx="3" ry="2.3" fill="${PET_INK}"/><circle cx="${hx - 0.9}" cy="${hy + 1.8}" r=".8" fill="#fff" opacity=".7"/>`
  if (opts.tongue) s += `<path d="M${hx - 2},${hy + 7} q2,6 4,0z" fill="${NOSE}" ${ink(1.3)}/>`
  else s += `<path d="M${hx - 3},${hy + 7} q1.5,1.4 3,0 q1.5,1.4 3,0" ${INNER}/>`
  s += eye(hx - 5, hy - 3, 2.3, 2.8) + eye(hx + 5, hy - 3, 2.3, 2.8)
  return s
}

function dogSleep(b: Look): string {
  let s = ''
  const low = (b.leg ?? 15) < 10
  s += dogTailLie(b)
  if (b.fluffy) s += solid(ell(-3, -9, 21, 8.5), b.fur, '', 2.4, 1.8) + curls(b, [[-14, -12, 8]])
  else {
    let inner = ''
    if (b.ridge) inner += `<path d="M-16,-18 Q-4,-22 8,-18" stroke="${b.mark}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    inner += shine(-12, -16.4, 5, 1.6, -8)
    s += solid(bean(-3, -10, low ? 25 : 23, 10), b.fur, inner, 3, 2.6)
  }
  s += furLine(`M8,-2.4 L24,-2.4`, b.fluffy ? b.fur : b.belly, 5) + paw(25, -2.2, b.fluffy ? b.fur : b.belly)
  s += dogHeadSide(b, 18, -11, true)
  return s
}

/** One pose's SVG body, in px with the feet at 0,0, facing right. */
export function petBody(breed: BreedId, pose: PetPose): string {
  const b = LOOKS[breed]
  if (b.kind === 'cat') {
    if (pose === 'sit' || pose === 'happy') return catSit(b)
    if (pose === 'wag') return catSit(b, true)
    if (pose === 'sleep') return catSleep(b)
    return catWalk(b, pose === 'walk1')
  }
  if (pose === 'sit') return dogSit(b)
  if (pose === 'wag') return dogSit(b, { swing: true, tongue: true })
  if (pose === 'happy') return dogSit(b, { wag: true, tongue: true })
  if (pose === 'sleep') return dogSleep(b)
  return dogWalk(b, pose === 'walk1')
}

const SHADOW = `<ellipse cx="0" cy="0" rx="26" ry="6" ${GROUND}/>`

/** Every breed in every pose, standing on a soft shadow. */
export function petTextures(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const breed of BREED_IDS) for (const pose of PET_POSES) out[petKey(breed, pose)] = svgDoc(PET_VIEWBOX, PET_PX, SHADOW + petBody(breed, pose))
  return out
}
