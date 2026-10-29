import { BREED_IDS, type BreedId } from '../sim/pets'
import { svgDoc } from './svg'

// Four cats and four dogs from two body plans, drawn in px with the feet at 0,0, facing right.

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
const PL = (w: number) => `stroke="${PET_INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
/** A thick ink line under a thinner fur line: a tail or a leg with an outline, in one go. */
const furLine = (d: string, fur: string, w: number) =>
  `<path d="${d}" stroke="${PET_INK}" stroke-width="${w + 5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" stroke="${fur}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
/** A tail flipped to the body's other side. */
const swung = (tail: string) => (tail ? `<g transform="scale(-1,1)">${tail}</g>` : '')

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
function catStripes(b: Look, cx: number, cy: number, n: number, len: number): string {
  if (b.pattern !== 'tabby') return ''
  let s = ''
  for (let i = 0; i < n; i++) s += `<path d="M${cx + i * 7 - n * 3.5},${cy} q2,${len / 2} 0,${len}" stroke="${b.mark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
  return s
}

function catHeadSide(b: Look, hx: number, hy: number, closed: boolean): string {
  const pts = b.pattern === 'points'
  let s = ''
  // ears
  s += `<path d="M${hx - 9},${hy - 6} L${hx - 7},${hy - 19} L${hx},${hy - 10}Z" fill="${pts ? b.mark : b.fur}" ${PL(2.6)}/>`
  s += `<path d="M${hx + 1},${hy - 10} L${hx + 6},${hy - 20} L${hx + 10},${hy - 7}Z" fill="${pts ? b.mark : b.fur}" ${PL(2.6)}/>`
  s += `<path d="M${hx - 7},${hy - 9} L${hx - 6.4},${hy - 15} L${hx - 3},${hy - 10}Z M${hx + 3.5},${hy - 10} L${hx + 6},${hy - 16} L${hx + 8},${hy - 9}Z" fill="#F28CA0"/>`
  s += `<circle cx="${hx}" cy="${hy}" r="12" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.pattern === 'calico') s += `<path d="M${hx - 11},${hy - 4} Q${hx - 6},${hy - 13} ${hx + 1},${hy - 11} Q${hx - 3},${hy - 3} ${hx - 11},${hy - 4}Z" fill="${b.mark2}"/>`
  if (b.pattern === 'tabby') s += `<path d="M${hx - 3},${hy - 11} v4 M${hx + 1},${hy - 11.5} v4 M${hx + 5},${hy - 10.5} v3.5" stroke="${b.mark}" stroke-width="2.2" stroke-linecap="round"/>`
  if (pts) s += `<ellipse cx="${hx + 5}" cy="${hy + 3}" rx="7.5" ry="6.5" fill="${b.mark}"/>`
  // muzzle, nose, eyes
  s += `<ellipse cx="${hx + 6}" cy="${hy + 4}" rx="5" ry="3.6" fill="${pts ? b.mark : b.belly}"/>`
  s += `<path d="M${hx + 9.6},${hy + 1.6} l2,1.6 l-2,1.4z" fill="#E8708A" ${PL(1)}/>`
  if (closed) s += `<path d="M${hx - 1.5},${hy - 1} q2.5,2 5,0 M${hx + 5.5},${hy - 1} q2.2,1.8 4.4,0" stroke="${PET_INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
  else
    s +=
      `<ellipse cx="${hx + 1}" cy="${hy - 1.5}" rx="2.2" ry="2.8" fill="${PET_INK}"/><ellipse cx="${hx + 7.6}" cy="${hy - 1.5}" rx="2" ry="2.6" fill="${PET_INK}"/>` +
      `<circle cx="${hx + 1.6}" cy="${hy - 2.6}" r=".8" fill="#fff"/><circle cx="${hx + 8.1}" cy="${hy - 2.6}" r=".7" fill="#fff"/>`
  s += `<path d="M${hx + 8},${hy + 5} l9,-1.5 M${hx + 8},${hy + 6.4} l9,1.2" stroke="${PET_INK}" stroke-width=".9" stroke-linecap="round" opacity=".7"/>`
  return s
}

function catWalk(b: Look, step: boolean): string {
  const a = step ? 3 : -3
  const pts = b.pattern === 'points'
  const legC = pts ? b.mark : b.fur
  let s = ''
  s += furLine(`M-20,-20 Q-32,-24 -30,-40 Q-29,-48 -24,-49`, pts ? b.mark : b.fur, 6)
  if (b.pattern === 'tabby') s += `<path d="M-29,-33 l5,1 M-30,-40 l5,1.5" stroke="${b.mark}" stroke-width="2.4" stroke-linecap="round"/>`
  // far legs, then body, then near legs
  s += furLine(`M${-14 - a},-14 L${-14 - a},-2`, legC, 5) + furLine(`M${11 + a},-14 L${11 + a},-2`, legC, 5)
  s += `<ellipse cx="-1" cy="-19" rx="21" ry="11" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.pattern === 'calico') s += `<path d="M-14,-27 Q-6,-31 2,-27 Q0,-20 -8,-21 Q-14,-22 -14,-27Z" fill="${b.mark}"/><path d="M4,-28 Q12,-30 16,-24 Q10,-21 5,-23Z" fill="${b.mark2}"/>`
  s += catStripes(b, -2, -29, 4, 8)
  s += `<ellipse cx="2" cy="-12.5" rx="12" ry="3.6" fill="${b.belly}" opacity="${b.pattern === 'plain' ? 0 : 1}"/>`
  s += furLine(`M${-9 + a},-14 L${-9 + a},-1`, legC, 5) + furLine(`M${15 - a},-14 L${15 - a},-1`, legC, 5)
  s += catHeadSide(b, 21, -31, false)
  return s
}

function catSit(b: Look, swing = false): string {
  const pts = b.pattern === 'points'
  let s = ''
  const tail = furLine(`M8,-4 Q22,-2 20,-14 Q19,-20 14,-22`, pts ? b.mark : b.fur, 6)
  s += swing ? swung(tail) : tail
  s += `<path d="M-13,-2 Q-16,-20 -8,-27 Q0,-31 8,-27 Q16,-20 13,-2Z" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.pattern === 'calico') s += `<path d="M-12,-10 Q-10,-20 -3,-19 Q-4,-9 -12,-10Z" fill="${b.mark}"/><path d="M5,-22 Q11,-20 11,-12 Q5,-14 5,-22Z" fill="${b.mark2}"/>`
  if (b.pattern === 'tabby') s += `<path d="M-11,-15 h4 M-12,-9 h4 M7,-15 h4 M8,-9 h4" stroke="${b.mark}" stroke-width="2.4" stroke-linecap="round"/>`
  s += `<ellipse cx="0" cy="-14" rx="6" ry="9" fill="${b.belly}" opacity="${b.pattern === 'plain' ? 0 : 1}"/>`
  const paw = pts ? b.mark : b.belly === b.fur ? b.fur : b.belly
  s += `<ellipse cx="-5" cy="-2" rx="4.5" ry="3" fill="${paw}" ${PL(2.2)}/><ellipse cx="5" cy="-2" rx="4.5" ry="3" fill="${paw}" ${PL(2.2)}/>`
  // head, front view
  const hx = 0
  const hy = -38
  s += `<path d="M${hx - 11},${hy - 4} L${hx - 10},${hy - 18} L${hx - 2},${hy - 11}Z M${hx + 11},${hy - 4} L${hx + 10},${hy - 18} L${hx + 2},${hy - 11}Z" fill="${pts ? b.mark : b.fur}" ${PL(2.6)}/>`
  s += `<path d="M${hx - 9},${hy - 8} L${hx - 8.6},${hy - 14} L${hx - 4.5},${hy - 10}Z M${hx + 9},${hy - 8} L${hx + 8.6},${hy - 14} L${hx + 4.5},${hy - 10}Z" fill="#F28CA0"/>`
  s += `<ellipse cx="${hx}" cy="${hy}" rx="13" ry="11.5" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.pattern === 'calico') s += `<path d="M${hx - 12},${hy - 2} Q${hx - 8},${hy - 12} ${hx - 1},${hy - 11} Q${hx - 3},${hy - 3} ${hx - 12},${hy - 2}Z" fill="${b.mark2}"/><path d="M${hx + 3},${hy - 11} Q${hx + 10},${hy - 10} ${hx + 12},${hy - 3} Q${hx + 6},${hy - 5} ${hx + 3},${hy - 11}Z" fill="${b.mark}"/>`
  if (b.pattern === 'tabby') s += `<path d="M${hx - 3},${hy - 11} v4 M${hx},${hy - 11.5} v4.5 M${hx + 3},${hy - 11} v4" stroke="${b.mark}" stroke-width="2.2" stroke-linecap="round"/>`
  if (pts) s += `<ellipse cx="${hx}" cy="${hy + 3}" rx="8" ry="7" fill="${b.mark}"/>`
  s += `<ellipse cx="${hx - 5}" cy="${hy - 1}" rx="2.4" ry="3" fill="${PET_INK}"/><ellipse cx="${hx + 5}" cy="${hy - 1}" rx="2.4" ry="3" fill="${PET_INK}"/>`
  s += `<circle cx="${hx - 4.4}" cy="${hy - 2}" r=".9" fill="#fff"/><circle cx="${hx + 5.6}" cy="${hy - 2}" r=".9" fill="#fff"/>`
  s += `<path d="M${hx - 1.6},${hy + 3} h3.2 l-1.6,1.8z" fill="#E8708A"/><path d="M${hx - 2.6},${hy + 6} q1.3,1.2 2.6,0 q1.3,1.2 2.6,0" stroke="${PET_INK}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
  s += `<path d="M${hx - 7},${hy + 4} l-9,-1 M${hx - 7},${hy + 5.5} l-9,1.5 M${hx + 7},${hy + 4} l9,-1 M${hx + 7},${hy + 5.5} l9,1.5" stroke="${PET_INK}" stroke-width=".9" stroke-linecap="round" opacity=".7"/>`
  return s
}

function catSleep(b: Look): string {
  const pts = b.pattern === 'points'
  let s = ''
  s += `<ellipse cx="-3" cy="-10" rx="21" ry="10.5" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.pattern === 'calico') s += `<path d="M-18,-14 Q-10,-21 -2,-18 Q-6,-10 -16,-10Z" fill="${b.mark}"/><path d="M0,-19 Q8,-20 10,-14 Q4,-13 0,-19Z" fill="${b.mark2}"/>`
  s += catStripes(b, -6, -20, 4, 7)
  s += furLine(`M-20,-4 Q-6,2 12,-1`, pts ? b.mark : b.fur, 6)
  s += catHeadSide(b, 13, -13, true).replace(/r="12"/, 'r="10.5"')
  return s
}

/* ---- dogs ---- */
function dogEars(b: Look, hx: number, hy: number, front: boolean): string {
  const f = b.fur
  const m = b.mark
  if (b.ear === 'pom') {
    return front
      ? `<circle cx="${hx - 12}" cy="${hy + 3}" r="6.5" fill="${b.mark}" ${PL(2.4)}/><circle cx="${hx + 12}" cy="${hy + 3}" r="6.5" fill="${b.mark}" ${PL(2.4)}/>`
      : `<circle cx="${hx - 5}" cy="${hy + 3}" r="6.5" fill="${b.mark}" ${PL(2.4)}/>`
  }
  const big = b.ear === 'big'
  const h = big ? 20 : 15
  const w = big ? 7 : 5.5
  const one = (x: number, lean: number) =>
    `<path d="M${x - w},${hy - 6} L${x + lean},${hy - 6 - h} L${x + w},${hy - 7}Z" fill="${f}" ${PL(2.6)}/><path d="M${x - w + 2.4},${hy - 7.5} L${x + lean * 0.8},${hy - 3 - h} L${x + w - 2.4},${hy - 8}Z" fill="${big ? '#F6C9B8' : m}"/>`
  return front ? one(hx - 7, -3) + one(hx + 7, 3) : one(hx - 5, -2) + one(hx + 3, 2)
}

function dogHeadSide(b: Look, hx: number, hy: number, closed: boolean, tongue = false): string {
  let s = dogEars(b, hx, hy, false)
  if (b.fluffy) s += `<circle cx="${hx - 1}" cy="${hy - 10}" r="7" fill="${b.fur}" ${PL(2.4)}/>`
  s += `<circle cx="${hx}" cy="${hy}" r="11.5" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.blaze) s += `<path d="M${hx + 2},${hy - 11} Q${hx + 5},${hy - 2} ${hx + 8},${hy + 6} L${hx + 1},${hy + 8} Q${hx},${hy - 2} ${hx + 2},${hy - 11}Z" fill="${b.belly}"/>`
  s += `<path d="M${hx + 4},${hy - 2} Q${hx + 17},${hy - 3} ${hx + 18},${hy + 3} Q${hx + 17},${hy + 9} ${hx + 5},${hy + 8}Z" fill="${b.belly}" ${PL(2.6)}/>`
  s += `<ellipse cx="${hx + 17}" cy="${hy + 0.4}" rx="3" ry="2.4" fill="${PET_INK}"/>`
  if (tongue) s += `<path d="M${hx + 9},${hy + 7.6} q2,6 5,1 z" fill="#E8708A" ${PL(1.4)}/>`
  if (closed) s += `<path d="M${hx + 1},${hy - 2} q2.6,2 5.2,0" stroke="${PET_INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
  else s += `<ellipse cx="${hx + 4}" cy="${hy - 3}" rx="2.3" ry="2.8" fill="${PET_INK}"/><circle cx="${hx + 4.7}" cy="${hy - 4}" r=".8" fill="#fff"/>`
  if (b.ear === 'pom') s += dogEars(b, hx, hy, false)
  return s
}

function dogTail(b: Look, wag: boolean): string {
  const f = b.fur
  const w = wag ? 1 : -1
  if (b.tail === 'curl') return furLine(`M-22,-26 Q-32,-36 -26,-44 Q-18,-48 ${-18 + w * 2},-40`, f, 6)
  if (b.tail === 'sickle') return furLine(`M-22,-26 Q-28,-38 ${-24 + w * 3},-50`, f, 5)
  if (b.tail === 'stub') return furLine(`M-24,-20 L${-29 + w},-22`, f, 6)
  return furLine(`M-22,-26 L${-27 + w * 2},-38`, f, 3) + `<circle cx="${-28 + w * 2}" cy="-41" r="6" fill="${b.mark}" ${PL(2.4)}/>`
}

function dogTailSit(b: Look, wag: boolean): string {
  const w = wag ? 2 : 0
  if (b.tail === 'curl') return furLine(`M9,-5 Q20,-6 ${19 + w},-15 Q18,-21 ${13 + w},-20`, b.fur, 6)
  if (b.tail === 'sickle') return furLine(`M9,-4 Q19,-8 ${18 + w},-22`, b.fur, 5)
  if (b.tail === 'stub') return ''
  return furLine(`M9,-5 L${16 + w},-11`, b.fur, 3) + `<circle cx="${18 + w}" cy="-13" r="6" fill="${b.mark}" ${PL(2.4)}/>`
}

function dogTailLie(b: Look): string {
  if (b.tail === 'curl') return furLine('M-22,-12 Q-32,-13 -31,-20 Q-29,-25 -24,-23', b.fur, 6)
  if (b.tail === 'sickle') return furLine('M-22,-11 Q-32,-11 -36,-19', b.fur, 5)
  if (b.tail === 'stub') return ''
  return furLine('M-20,-11 L-28,-13', b.fur, 3) + `<circle cx="-31" cy="-14" r="6" fill="${b.mark}" ${PL(2.4)}/>`
}

function dogWalk(b: Look, step: boolean): string {
  const a = step ? 3 : -3
  const L = b.leg ?? 15
  const by = -L - 9
  let s = dogTail(b, step)
  const leg = (x: number, near: boolean) => {
    const d = `M${x},${by + 4} L${x},-2`
    return furLine(d, near ? b.fur : b.mark, b.fluffy ? 5 : 5.5) + (b.fluffy ? `<circle cx="${x}" cy="${-2}" r="4" fill="${b.fur}" ${PL(2)}/>` : '')
  }
  s += leg(-16 - a, false) + leg(12 + a, false)
  if (b.fluffy) s += `<ellipse cx="-2" cy="${by}" rx="18" ry="7.5" fill="${b.fur}" ${PL(2.8)}/><circle cx="-14" cy="${by - 1}" r="8.5" fill="${b.fur}" ${PL(2.8)}/><circle cx="10" cy="${by - 1}" r="9.5" fill="${b.fur}" ${PL(2.8)}/>`
  else s += `<ellipse cx="-2" cy="${by}" rx="${b.ear === 'big' ? 24 : 22}" ry="10" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.ridge) s += `<path d="M-14,${by - 8} Q-4,${by - 12} 8,${by - 8}" stroke="${b.mark}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-12,${by - 9.5} l3,2.4 M-6,${by - 10.6} l3,2.4 M0,${by - 10.8} l3,2.4" stroke="#7A5A47" stroke-width="1.6" stroke-linecap="round"/>`
  if (!b.fluffy) s += `<ellipse cx="2" cy="${by + 6}" rx="13" ry="3.4" fill="${b.belly}"/>`
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
  if (b.fluffy) s += furLine(`M-5,${top + 16} L-5,-3`, b.fur, 5) + furLine(`M5,${top + 16} L5,-3`, b.fur, 5) + `<circle cx="0" cy="${top + 8}" r="12" fill="${b.fur}" ${PL(2.8)}/>`
  else s += `<path d="M-13,-2 Q-15,${top + 6} -6,${top} Q0,${top - 3} 6,${top} Q15,${top + 6} 13,-2Z" fill="${b.fur}" ${PL(2.8)}/>`
  if (!b.fluffy) s += `<path d="M-6,${top + 2} Q0,${top + 12} 6,${top + 2} L4,-4 H-4Z" fill="${b.belly}"/>`
  s += `<ellipse cx="-5.5" cy="-2" rx="4.5" ry="3.2" fill="${b.fluffy ? b.fur : b.belly}" ${PL(2.2)}/><ellipse cx="5.5" cy="-2" rx="4.5" ry="3.2" fill="${b.fluffy ? b.fur : b.belly}" ${PL(2.2)}/>`
  const hx = 0
  const hy = top - 12
  s += dogEars(b, hx, hy, true)
  if (b.fluffy) s += `<circle cx="${hx}" cy="${hy - 10}" r="8" fill="${b.fur}" ${PL(2.4)}/>`
  s += `<ellipse cx="${hx}" cy="${hy}" rx="12.5" ry="11.5" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.ridge) s += `<path d="M${hx - 3},${hy - 11} q3,3 6,0" stroke="${b.mark}" stroke-width="2" fill="none"/>`
  if (b.blaze) s += `<path d="M${hx - 2.5},${hy - 11} Q${hx},${hy - 2} ${hx - 5},${hy + 6} H${hx + 5} Q${hx},${hy - 2} ${hx + 2.5},${hy - 11}Z" fill="${b.belly}"/>`
  s += `<ellipse cx="${hx}" cy="${hy + 5}" rx="7" ry="5.5" fill="${b.belly}" ${PL(2.4)}/>`
  s += `<ellipse cx="${hx}" cy="${hy + 2.6}" rx="3" ry="2.3" fill="${PET_INK}"/>`
  if (opts.tongue) s += `<path d="M${hx - 2},${hy + 7} q2,6 4,0z" fill="#E8708A" ${PL(1.3)}/>`
  else s += `<path d="M${hx - 3},${hy + 7} q1.5,1.4 3,0 q1.5,1.4 3,0" stroke="${PET_INK}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
  s += `<ellipse cx="${hx - 5}" cy="${hy - 3}" rx="2.3" ry="2.8" fill="${PET_INK}"/><ellipse cx="${hx + 5}" cy="${hy - 3}" rx="2.3" ry="2.8" fill="${PET_INK}"/>`
  s += `<circle cx="${hx - 4.3}" cy="${hy - 4}" r=".8" fill="#fff"/><circle cx="${hx + 5.7}" cy="${hy - 4}" r=".8" fill="#fff"/>`
  return s
}

function dogSleep(b: Look): string {
  let s = ''
  const low = (b.leg ?? 15) < 10
  s += dogTailLie(b)
  if (b.fluffy) s += `<ellipse cx="-3" cy="-9" rx="21" ry="8.5" fill="${b.fur}" ${PL(2.8)}/><circle cx="-14" cy="-12" r="8" fill="${b.fur}" ${PL(2.6)}/>`
  else s += `<ellipse cx="-3" cy="-10" rx="${low ? 25 : 23}" ry="10" fill="${b.fur}" ${PL(2.8)}/>`
  if (b.ridge) s += `<path d="M-16,-18 Q-4,-22 8,-18" stroke="${b.mark}" stroke-width="3" fill="none" stroke-linecap="round"/>`
  s += furLine(`M8,-2 L26,-2`, b.fluffy ? b.fur : b.belly, 5)
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

const SHADOW = `<ellipse cx="0" cy="0" rx="26" ry="6" fill="${PET_INK}" opacity=".16"/>`

/** Every breed in every pose, standing on a soft shadow. */
export function petTextures(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const breed of BREED_IDS) for (const pose of PET_POSES) out[petKey(breed, pose)] = svgDoc(PET_VIEWBOX, PET_PX, SHADOW + petBody(breed, pose))
  return out
}
