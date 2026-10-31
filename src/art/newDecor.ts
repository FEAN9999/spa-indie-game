import { silkLantern } from './lantern'
import { C } from './palette'

// The three new sets (Thiền xanh, Hoài cổ, Vườn hoa) and the loose wall pieces and rugs, in furniture.ts's style.
// Floor pieces stand seen from the front; a wall piece is a picture two tiles high whose foot is the floor line, hung
// between y 0.25 and 1.6; a rug is seen from above, exactly its footprint, and drawn by the same function turned.

const LINE = 0.05
const FINE = 0.03
const ink = (w = LINE) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`
/** Rounds a computed coordinate so the SVG stays short. */
const f = (v: number) => +v.toFixed(3)
const line = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`
const dot = (x: number, y: number, r: number, fill: string, w = 0.015) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" ${ink(w)}/>`
/** A nail in the wall with a cord running down to (x, y). */
const hook = (x: number, top: number, y: number) => line(`M${x},${top} L${x},${y}`, C.ink, 0.025) + dot(x, top, 0.04, C.woodDark)

// ---------- Thiền xanh ----------

const pebbles = (pts: [number, number][]) => pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="0.07" ry="0.045" fill="${C.cream}" ${ink(0.012)}/>`).join('')

// thác nước tiểu cảnh: a grey stone pool, a stack of rocks at the left with water falling from a bamboo spout, moss and a fern
const waterfall =
  `<path d="M0.1,1.0 Q0.1,1.42 0.4,1.45 H1.6 Q1.9,1.42 1.9,1.0Z" fill="${C.stoneLight}" ${ink()}/>` +
  `<ellipse cx="1.0" cy="1.0" rx="0.9" ry="0.2" fill="${C.stoneLight}" ${ink()}/>` +
  `<ellipse cx="1.02" cy="1.01" rx="0.78" ry="0.14" fill="${C.waterDeep}" ${ink(FINE)}/>` +
  line('M0.6,1.0 q0.12,0.05 0.24,0 M1.1,1.04 q0.12,0.05 0.24,0', C.water, 0.03) +
  `<path d="M0.12,1.02 Q0.08,0.62 0.3,0.5 Q0.5,0.42 0.62,0.6 Q0.72,0.78 0.66,1.02Z" fill="${C.stone}" ${ink()}/>` +
  `<path d="M0.2,0.56 Q0.24,0.28 0.42,0.24 Q0.58,0.26 0.56,0.5Z" fill="${C.stoneLight}" ${ink(0.04)}/>` +
  `<path d="M0.16,0.66 Q0.3,0.6 0.42,0.66" stroke="${C.leaf}" stroke-width="0.07" fill="none" stroke-linecap="round"/>` +
  rect(0.44, 0.34, 0.42, 0.09, C.bamboo, `rx="0.04" ${ink(FINE)}`) +
  rect(0.82, 0.42, 0.13, 0.62, C.water, `rx="0.05" opacity="0.9"`) +
  line('M0.86,0.48 V1.0 M0.92,0.5 V0.98', '#FFFFFF', 0.018) +
  `<path d="M1.55,1.0 Q1.5,0.72 1.6,0.5 M1.62,1.0 Q1.7,0.7 1.82,0.6 M1.58,1.0 Q1.4,0.8 1.36,0.66" stroke="${C.leaf}" stroke-width="0.05" fill="none" stroke-linecap="round"/>` +
  pebbles([[1.25, 1.3], [1.42, 1.32], [0.62, 1.32]])

// thác nước turned: the long pool runs up the floor, the rocks and the spout at its far end, its stone end to the front
const waterfallTurned =
  `<path d="M0.1,0.5 V1.96 Q0.1,2.2 0.32,2.22 H0.78 Q1.0,2.2 1.0,1.96 V0.5 Q1.0,0.3 0.78,0.28 H0.32 Q0.1,0.3 0.1,0.5Z" fill="${C.stoneLight}" ${ink()}/>` +
  rect(0.2, 0.38, 0.7, 1.62, C.waterDeep, `rx="0.18" ${ink(FINE)}`) +
  line('M0.38,1.3 q0.08,0.04 0.16,0 M0.52,1.7 q0.08,0.04 0.16,0', C.water, 0.03) +
  `<path d="M0.2,0.78 Q0.18,0.46 0.38,0.4 Q0.56,0.36 0.64,0.5 Q0.72,0.62 0.66,0.8Z" fill="${C.stone}" ${ink(0.04)}/>` +
  `<path d="M0.3,0.5 Q0.34,0.22 0.5,0.2 Q0.62,0.24 0.58,0.46Z" fill="${C.stoneLight}" ${ink(0.035)}/>` +
  line('M0.26,0.6 Q0.4,0.55 0.52,0.6', C.leaf, 0.06) +
  rect(0.5, 0.36, 0.3, 0.07, C.bamboo, `rx="0.03" ${ink(0.02)}`) +
  rect(0.72, 0.42, 0.09, 0.4, C.water, `rx="0.04"`) +
  `<path d="M0.82,1.9 Q0.78,1.66 0.86,1.5 M0.86,1.9 Q0.94,1.7 1.0,1.62" stroke="${C.leaf}" stroke-width="0.045" fill="none" stroke-linecap="round"/>` +
  rect(0.14, 1.98, 0.82, 0.26, C.stoneLight, `rx="0.06" ${ink(0.04)}`) +
  pebbles([[0.4, 2.1], [0.66, 2.12]])

// cây bonsai: a curved dark trunk, three rounded clouds of leaves and a shallow cobalt-glazed pot on little feet
const bonsai =
  `<path d="M0.46,1.18 Q0.36,0.96 0.5,0.8 Q0.66,0.62 0.5,0.46" stroke="${C.ink}" stroke-width="0.13" fill="none" stroke-linecap="round"/>` +
  `<path d="M0.46,1.18 Q0.36,0.96 0.5,0.8 Q0.66,0.62 0.5,0.46" stroke="${C.woodDark}" stroke-width="0.07" fill="none" stroke-linecap="round"/>` +
  line('M0.52,0.78 Q0.7,0.74 0.78,0.66', C.woodDark, 0.05) +
  `<ellipse cx="0.5" cy="0.36" rx="0.3" ry="0.17" fill="${C.leaf}" ${ink(0.035)}/>` +
  `<ellipse cx="0.22" cy="0.7" rx="0.2" ry="0.12" fill="${C.leafLight}" ${ink(0.035)}/>` +
  `<ellipse cx="0.8" cy="0.6" rx="0.18" ry="0.11" fill="${C.leaf}" ${ink(0.035)}/>` +
  line('M0.38,0.32 Q0.5,0.26 0.62,0.32', C.leafLight, 0.03) +
  `<path d="M0.08,1.14 H0.92 L0.84,1.36 H0.16Z" fill="${C.cobalt}" ${ink(0.04)}/>` +
  rect(0.05, 1.08, 0.9, 0.09, C.cobalt, `rx="0.03" ${ink(FINE)}`) +
  rect(0.2, 1.35, 0.1, 0.07, C.cobalt, ink(0.02)) +
  rect(0.7, 1.35, 0.1, 0.07, C.cobalt, ink(0.02))

// đèn đá: a grey stone lantern on a square foot, a lit window under a wide curved cap with a knob
const stoneLamp =
  `<circle cx="0.5" cy="0.74" r="0.36" fill="${C.glow}" opacity="0.35"/>` +
  rect(0.22, 1.42, 0.56, 0.16, C.stone, `rx="0.03" ${ink(0.04)}`) +
  rect(0.38, 1.0, 0.24, 0.44, C.stoneLight, ink(0.04)) +
  rect(0.26, 0.92, 0.48, 0.1, C.stone, `rx="0.02" ${ink(0.035)}`) +
  rect(0.3, 0.58, 0.4, 0.36, C.stoneLight, ink(0.04)) +
  rect(0.4, 0.64, 0.2, 0.24, C.glow, ink(0.025)) +
  `<path d="M0.1,0.6 Q0.5,0.5 0.9,0.6 L0.74,0.4 H0.26Z" fill="${C.stone}" ${ink(0.04)}/>` +
  dot(0.5, 0.34, 0.07, C.stone, 0.03)

// tranh thủy mặc tre: a cream hanging scroll on dark rods with three ink bamboo stalks, their leaves, and a red seal
const bambooStalk = (x: number, top: number) =>
  line(`M${x},1.42 V${top}`, C.deepBrown, 0.045) +
  [0.5, 0.8, 1.1].filter(y => y > top).map(y => line(`M${f(x - 0.04)},${y} H${f(x + 0.04)}`, C.cream, 0.02)).join('')
const bambooLeaf = (x: number, y: number, dir: number) =>
  `<path d="M${x},${y} q${f(dir * 0.12)},-0.04 ${f(dir * 0.24)},0.04 q${f(-dir * 0.12)},0.02 ${f(-dir * 0.24)},-0.04Z" fill="${C.tealDark}"/>`
const inkBamboo =
  hook(1, 0.1, 0.26) + line('M0.42,0.3 L1,0.12 L1.58,0.3', C.ink, 0.02) +
  rect(0.32, 0.26, 1.36, 0.08, C.woodDark, `rx="0.04" ${ink(0.025)}`) +
  rect(0.4, 0.33, 1.2, 1.12, C.paper, ink(FINE)) +
  rect(0.46, 0.38, 1.08, 1.02, 'none', `stroke="${C.tileSeam}" stroke-width="0.02"`) +
  bambooStalk(0.72, 0.5) + bambooStalk(0.88, 0.7) + bambooStalk(1.3, 0.56) +
  bambooLeaf(0.72, 0.58, 1) + bambooLeaf(0.72, 0.76, -1) + bambooLeaf(0.88, 0.82, 1) + bambooLeaf(1.3, 0.66, -1) + bambooLeaf(1.3, 0.9, 1) + bambooLeaf(1.3, 0.72, 1) +
  rect(1.4, 1.18, 0.08, 0.1, C.lantern) +
  rect(0.32, 1.44, 1.36, 0.08, C.woodDark, `rx="0.04" ${ink(0.025)}`)

// kệ treo nến thơm: a short wood shelf on two brackets with two lit candles and a small amber oil bottle with reeds
const candle = (x: number, h: number) =>
  `<ellipse cx="${x}" cy="${f(1.08 - h - 0.08)}" rx="0.12" ry="0.14" fill="${C.glow}" opacity="0.5"/>` +
  rect(f(x - 0.07), f(1.08 - h), 0.14, h, C.cream, `rx="0.02" ${ink(0.025)}`) +
  `<path d="M${x},${f(1.08 - h - 0.02)} q-0.04,-0.06 0,-0.13 q0.04,0.07 0,0.13Z" fill="${C.mustard}" ${ink(0.012)}/>`
const candleShelf =
  candle(0.26, 0.3) + candle(0.46, 0.2) +
  `<path d="M0.7,0.82 L0.62,0.48 M0.72,0.82 L0.76,0.44 M0.74,0.82 L0.88,0.5" stroke="${C.woodDark}" stroke-width="0.02"/>` +
  `<path d="M0.62,1.08 V0.9 Q0.62,0.84 0.7,0.82 H0.76 Q0.84,0.84 0.84,0.9 V1.08Z" fill="${C.mustardDark}" ${ink(0.025)}/>` +
  rect(0.06, 1.07, 0.88, 0.09, C.wood, `rx="0.03" ${ink(0.035)}`) +
  `<path d="M0.18,1.16 V1.36 L0.3,1.16Z M0.82,1.16 V1.36 L0.7,1.16Z" fill="${C.woodDark}" ${ink(0.02)}/>`

// ---------- Hoài cổ ----------

// máy hát đĩa than: a wood box, the black record with a red label, the tone arm, and a big brass horn opening up and out
const gramophone =
  rect(0.12, 1.12, 0.76, 0.42, C.wood, `rx="0.04" ${ink(0.04)}`) +
  rect(0.18, 1.2, 0.64, 0.26, C.woodLight, `rx="0.03" ${ink(0.02)}`) +
  dot(0.8, 1.32, 0.04, C.mustard) +
  `<ellipse cx="0.42" cy="1.1" rx="0.3" ry="0.08" fill="${C.deepBrown}" ${ink(0.03)}/>` +
  `<ellipse cx="0.42" cy="1.1" rx="0.07" ry="0.025" fill="${C.lantern}"/>` +
  `<path d="M0.62,1.06 Q0.66,0.84 0.56,0.72" stroke="${C.mustardDark}" stroke-width="0.05" fill="none" stroke-linecap="round"/>` +
  `<path d="M0.56,0.74 Q0.42,0.6 0.36,0.36 L0.08,0.16 Q0.2,0.02 0.42,0.06 Q0.66,0.14 0.72,0.3 L0.6,0.62Z" fill="${C.mustard}" ${ink(0.04)}/>` +
  `<ellipse cx="0.4" cy="0.2" rx="0.3" ry="0.12" transform="rotate(25 0.4 0.2)" fill="${C.mustardDark}" ${ink(FINE)}/>` +
  line('M0.46,0.6 L0.25,0.24 M0.58,0.6 L0.58,0.24', C.mustardDark, 0.02)

// quạt đứng: a round foot, a pole, and a teal cage with three cream blades round a mustard hub
const standFan =
  `<ellipse cx="0.5" cy="1.82" rx="0.3" ry="0.09" fill="${C.tealDark}" ${ink(0.035)}/>` +
  rect(0.46, 0.84, 0.08, 1.0, C.silver, ink(0.025)) +
  rect(0.42, 1.18, 0.16, 0.06, C.tealDark, ink(0.02)) +
  dot(0.5, 0.52, 0.4, C.cream, 0.04) +
  [0, 120, 240].map(a => `<ellipse cx="0.5" cy="0.34" rx="0.1" ry="0.17" transform="rotate(${a} 0.5 0.52)" fill="${C.tealLight}" ${ink(0.02)}/>`).join('') +
  `<g fill="none" stroke="${C.teal}" stroke-width="0.02"><circle cx="0.5" cy="0.52" r="0.4"/><circle cx="0.5" cy="0.52" r="0.27"/><path d="M0.1,0.52 H0.9 M0.5,0.12 V0.92 M0.22,0.24 L0.78,0.8 M0.78,0.24 L0.22,0.8"/></g>` +
  dot(0.5, 0.52, 0.07, C.mustard, 0.025)

// máy may: a black sewing head with gold stripes on a wood top, the cast-iron legs with their treadle and wheel
const sewingLegs = (x0: number, x1: number, top: number, foot: number) =>
  `<g fill="none" stroke="${C.deepBrown}" stroke-width="0.05" stroke-linecap="round">` +
  `<path d="M${x0},${top} L${f(x0 + 0.06)},${foot} M${x1},${top} L${f(x1 - 0.06)},${foot}"/>` +
  `<path d="M${f(x0 + 0.03)},${f((top + foot) / 2)} Q${f((x0 + x1) / 2)},${f((top + foot) / 2 - 0.1)} ${f(x1 - 0.03)},${f((top + foot) / 2)}"/></g>`
const sewingHead =
  `<path d="M0.42,0.98 V0.5 Q0.42,0.36 0.56,0.36 H1.36 Q1.5,0.36 1.5,0.5 V0.62 H0.62 V0.98Z" fill="${C.deepBrown}" ${ink(0.035)}/>` +
  rect(1.36, 0.6, 0.12, 0.38, C.deepBrown, ink(0.03)) +
  line('M0.62,0.48 H1.34', C.mustard, 0.03) +
  dot(0.5, 0.58, 0.09, C.silver, 0.02) +
  line('M1.42,0.98 V1.04', C.silver, 0.02)
const sewingMachine =
  sewingLegs(0.24, 1.76, 1.08, 1.64) +
  dot(1.46, 1.36, 0.16, 'none', 0.04) +
  rect(0.5, 1.5, 0.9, 0.1, C.deepBrown, `rx="0.03" ${ink(0.02)}`) +
  rect(0.1, 0.96, 1.8, 0.14, C.wood, `rx="0.04" ${ink(0.04)}`) +
  sewingHead

// máy may turned: the table runs up the floor, the head seen from its end with its wheel to the front, the legs either side
const sewingMachineTurned =
  `<g fill="none" stroke="${C.deepBrown}" stroke-width="0.05" stroke-linecap="round"><path d="M0.2,2.02 V2.5 M0.9,2.02 V2.5 M0.2,2.3 H0.9"/></g>` +
  rect(0.12, 0.62, 0.86, 1.46, C.wood, `rx="0.05" ${ink(0.04)}`) +
  rect(0.12, 2.0, 0.86, 0.14, C.woodDark, `rx="0.04" ${ink(0.035)}`) +
  rect(0.36, 0.5, 0.38, 0.42, C.deepBrown, `rx="0.1" ${ink(0.035)}`) +
  rect(0.44, 0.88, 0.22, 0.62, C.deepBrown, ink(0.03)) +
  rect(0.32, 1.42, 0.46, 0.3, C.deepBrown, `rx="0.06" ${ink(0.035)}`) +
  line('M0.55,0.6 V1.62', C.mustard, 0.025) +
  dot(0.82, 0.72, 0.13, C.silver, 0.03) +
  line('M0.82,0.72 L0.74,0.66', C.ink, 0.02)

// đồng hồ quả lắc: a tall wood case with a pointed top, a cream face with its hands, and a brass pendulum behind glass
const pendulumClock =
  `<path d="M0.24,1.58 V0.42 L0.5,0.22 L0.76,0.42 V1.58Z" fill="${C.wood}" ${ink()}/>` +
  dot(0.5, 0.56, 0.17, C.cream, 0.035) +
  line('M0.5,0.56 V0.45 M0.5,0.56 H0.6', C.ink, 0.03) +
  rect(0.32, 0.82, 0.36, 0.66, C.glass, ink(0.025)) +
  line('M0.5,0.84 L0.56,1.3', C.mustardDark, 0.025) +
  dot(0.56, 1.32, 0.06, C.mustard, 0.02) +
  rect(0.2, 1.56, 0.6, 0.06, C.woodDark, `rx="0.02" ${ink(0.025)}`)

// lồng chim treo: a bamboo dome cage on a hook, a yellow bird on its perch and a little water cup
const birdCage =
  hook(0.5, 0.18, 0.4) +
  `<path d="M0.18,1.42 V0.86 Q0.18,0.42 0.5,0.4 Q0.82,0.42 0.82,0.86 V1.42Z" fill="${C.cream}" fill-opacity="0.35" ${ink(0.035)}/>` +
  `<g stroke="${C.bambooDark}" stroke-width="0.018" fill="none"><path d="M0.3,1.42 V0.7 Q0.32,0.46 0.5,0.42 M0.42,1.42 V0.46 M0.58,1.42 V0.46 M0.7,1.42 V0.7 Q0.68,0.46 0.5,0.42"/></g>` +
  line('M0.24,1.12 H0.76', C.woodDark, 0.03) +
  `<ellipse cx="0.48" cy="1.0" rx="0.11" ry="0.08" fill="${C.mustard}" ${ink(0.02)}/>` +
  dot(0.56, 0.94, 0.05, C.mustard, 0.018) +
  `<path d="M0.6,0.93 l0.05,0.015 l-0.05,0.015Z" fill="${C.terracotta}"/>` +
  `<path d="M0.38,1.0 l-0.1,0.06 l0.03,-0.08Z" fill="${C.mustardDark}"/>` +
  rect(0.14, 1.4, 0.72, 0.1, C.bamboo, `rx="0.04" ${ink(0.03)}`) +
  rect(0.66, 1.3, 0.1, 0.1, C.cobalt, ink(0.015))

// ---------- Vườn hoa ----------

const fish = (x: number, y: number, dir: number) =>
  `<ellipse cx="${x}" cy="${y}" rx="0.08" ry="0.045" fill="${C.stoneHot}" ${ink(0.012)}/>` +
  `<path d="M${f(x - dir * 0.07)},${y} l${f(-dir * 0.07)},-0.045 v0.09Z" fill="${C.stoneHot}" ${ink(0.012)}/>`
const weed = (x: number, h: number) => `<path d="M${x},1.24 q-0.06,${f(-h / 2)} 0,${f(-h)}" stroke="${C.leaf}" stroke-width="0.04" fill="none" stroke-linecap="round"/>`

// bể cá: a glass tank of water on a wood stand, three orange fish, weed and a pebble floor, bubbles going up
const fishTank =
  rect(0.12, 1.24, 1.76, 0.36, C.wood, `rx="0.04" ${ink(0.04)}`) +
  rect(0.2, 1.32, 1.6, 0.2, C.woodDark, `rx="0.03" ${ink(0.02)}`) +
  rect(0.16, 0.42, 1.68, 0.84, C.glass, ink(0.04)) +
  rect(0.2, 0.56, 1.6, 0.66, C.water, ink(0.015)) +
  rect(0.2, 1.12, 1.6, 0.1, C.sand) +
  weed(0.34, 0.4) + weed(0.42, 0.28) + weed(1.6, 0.46) + weed(1.68, 0.3) +
  fish(0.7, 0.8, 1) + fish(1.18, 0.96, -1) + fish(1.36, 0.7, 1) +
  dot(0.86, 0.66, 0.025, '#FFFFFF', 0.008) + dot(0.9, 0.6, 0.018, '#FFFFFF', 0.008) +
  line('M0.26,0.5 H0.6', '#FFFFFF', 0.025) +
  rect(0.12, 0.38, 1.76, 0.06, C.tealDark, `rx="0.02" ${ink(0.02)}`)

// bể cá turned: the tank's long top runs up the floor, its glass end to the front with one fish, the stand under it
const fishTankTurned =
  rect(0.12, 1.62, 0.86, 0.34, C.wood, `rx="0.04" ${ink(0.04)}`) +
  rect(0.16, 0.18, 0.78, 1.46, C.water, ink(0.035)) +
  line('M0.3,0.4 V1.4', '#FFFFFF', 0.02) +
  fish(0.6, 0.62, 1) + fish(0.5, 1.0, -1) +
  rect(0.16, 1.2, 0.78, 0.44, C.glass, ink(0.035)) +
  rect(0.2, 1.28, 0.7, 0.32, C.water) +
  rect(0.2, 1.52, 0.7, 0.08, C.sand) +
  fish(0.55, 1.4, 1)

// chậu hoa giấy: a terracotta pot under a round bush of magenta bougainvillea with a few green leaves
const BOUGAIN: [number, number][] = [[0.3, 0.5], [0.5, 0.38], [0.7, 0.52], [0.22, 0.76], [0.44, 0.66], [0.66, 0.78], [0.8, 0.66], [0.36, 0.9], [0.58, 0.94]]
const bougainvillea =
  `<ellipse cx="0.5" cy="0.7" rx="0.42" ry="0.36" fill="${C.leaf}" ${ink(0.035)}/>` +
  BOUGAIN.map(([x, y], i) => dot(x, y, 0.09, i % 3 ? C.magenta : C.lotus, 0.015)).join('') +
  `<path d="M0.24,1.04 H0.76 L0.7,1.46 H0.3Z" fill="${C.terracotta}" ${ink(0.04)}/>` +
  rect(0.2, 1.0, 0.6, 0.1, C.terracotta, `rx="0.03" ${ink(FINE)}`)

// bình hướng dương: three sunflowers on green stems in a cream vase with a cobalt band
const sunflower = (x: number, y: number) =>
  Array.from({ length: 8 }, (_, i) => `<ellipse cx="${x}" cy="${f(y - 0.1)}" rx="0.035" ry="0.07" transform="rotate(${i * 45} ${x} ${y})" fill="${C.gold}" ${ink(0.01)}/>`).join('') +
  dot(x, y, 0.06, C.woodDark, 0.015)
const sunflowerVase =
  line('M0.5,1.2 Q0.48,0.7 0.5,0.4 M0.46,1.2 Q0.3,0.9 0.22,0.68 M0.54,1.2 Q0.7,0.9 0.78,0.74', C.leaf, 0.035) +
  `<path d="M0.36,0.96 q-0.12,-0.04 -0.14,-0.12 q0.12,0 0.14,0.12Z M0.62,0.96 q0.12,-0.04 0.14,-0.12 q-0.12,0 -0.14,0.12Z" fill="${C.leaf}" ${ink(0.012)}/>` +
  sunflower(0.5, 0.36) + sunflower(0.22, 0.64) + sunflower(0.78, 0.7) +
  `<path d="M0.32,1.72 Q0.22,1.44 0.36,1.24 V1.14 H0.64 V1.24 Q0.78,1.44 0.68,1.72Z" fill="${C.cream}" ${ink(0.04)}/>` +
  line('M0.27,1.48 H0.73', C.cobalt, 0.06)

// giỏ dương xỉ treo: a woven basket on three cords from a hook, fern fronds drooping over its rim
const fernFrond = (d: string) => `<path d="${d}" stroke="${C.leaf}" stroke-width="0.07" fill="none" stroke-linecap="round" stroke-dasharray="0.04 0.025"/>`
const fernBasket =
  hook(0.5, 0.2, 0.26) +
  line('M0.5,0.26 L0.2,0.8 M0.5,0.26 L0.5,0.8 M0.5,0.26 L0.8,0.8', C.woodDark, 0.018) +
  `<defs><pattern id="weave" width="0.16" height="0.16" patternUnits="userSpaceOnUse"><rect width="0.16" height="0.16" fill="${C.weave}"/><path d="M0,0.08 H0.16 M0.08,0 V0.16" stroke="${C.weaveLine}" stroke-width="0.025"/></pattern></defs>` +
  fernFrond('M0.4,0.82 Q0.14,0.82 0.08,1.3') + fernFrond('M0.6,0.82 Q0.86,0.82 0.92,1.34') +
  fernFrond('M0.48,0.8 Q0.3,0.6 0.2,0.7') + fernFrond('M0.52,0.8 Q0.72,0.62 0.82,0.72') + fernFrond('M0.5,0.82 Q0.46,1.2 0.34,1.48') +
  `<path d="M0.18,0.82 H0.82 Q0.8,1.12 0.5,1.16 Q0.2,1.12 0.18,0.82Z" fill="url(#weave)" ${ink(0.035)}/>`

// kệ treo sen đá: a wood plank on two brackets with four little pots of succulents in mint, teal and pink
const rosette = (x: number, top: number, col: string, tip: string) =>
  [-0.1, 0, 0.1].map(dx => `<ellipse cx="${f(x + dx)}" cy="${f(top + Math.abs(dx) * 0.6)}" rx="0.05" ry="0.09" transform="rotate(${dx * 300} ${f(x + dx)} ${f(top + 0.08)})" fill="${col}" stroke="${tip}" stroke-width="0.015"/>`).join('')
const smallPot = (x: number, fill: string) => `<path d="M${f(x - 0.13)},0.94 H${f(x + 0.13)} L${f(x + 0.1)},1.12 H${f(x - 0.1)}Z" fill="${fill}" ${ink(0.025)}/>`
const succulentShelf =
  rosette(0.36, 0.78, C.mintTeal, C.tealDark) + smallPot(0.36, C.terracotta) +
  rosette(0.8, 0.8, C.mint, C.lotusDark) + smallPot(0.8, C.cream) +
  rosette(1.2, 0.76, C.tealLight, C.tealDark) + smallPot(1.2, C.cobalt) +
  rosette(1.64, 0.8, C.mintTeal, C.lotus) + smallPot(1.64, C.terracotta) +
  rect(0.12, 1.1, 1.76, 0.1, C.wood, `rx="0.03" ${ink(0.035)}`) +
  `<path d="M0.3,1.2 V1.4 L0.46,1.2Z M1.7,1.2 V1.4 L1.54,1.2Z" fill="${C.woodDark}" ${ink(0.02)}/>`

// ---------- Món lẻ treo tường ----------

// tranh sơn mài: a red-lacquer frame round a black field with gold hills, a cream moon, a boat and a red sun's reflection
const lacquerPainting =
  hook(1, 0.12, 0.3) + line('M0.3,0.34 L1,0.14 L1.7,0.34', C.ink, 0.02) +
  rect(0.22, 0.3, 1.56, 1.14, C.lanternDark, `rx="0.04" ${ink()}`) +
  rect(0.32, 0.4, 1.36, 0.94, C.deepBrown, ink(FINE)) +
  dot(1.38, 0.62, 0.1, C.paper, 0.015) +
  `<path d="M0.32,1.06 L0.62,0.7 L0.86,0.94 L1.12,0.66 L1.46,1.06Z" fill="${C.mustardDark}" ${ink(0.015)}/>` +
  `<path d="M0.32,1.06 L0.56,0.86 L0.78,1.06Z" fill="${C.gold}" ${ink(0.015)}/>` +
  rect(0.32, 1.06, 1.36, 0.28, C.lanternDark) +
  line('M0.5,1.16 H0.8 M1.0,1.24 H1.4 M1.3,1.14 H1.5', C.gold, 0.02) +
  `<path d="M0.86,1.18 H1.12 L1.06,1.24 H0.92Z M0.99,1.18 V1.06" fill="${C.paper}" stroke="${C.paper}" stroke-width="0.015"/>`

// gương tròn khung mây: a round mirror with a glint, inside a rattan sun of spokes
const rattanMirror =
  Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8
    return line(`M${f(0.5 + Math.cos(a) * 0.28)},${f(0.86 + Math.sin(a) * 0.28)} L${f(0.5 + Math.cos(a) * 0.46)},${f(0.86 + Math.sin(a) * 0.46)}`, i % 2 ? C.weave : C.weaveLine, 0.06)
  }).join('') +
  dot(0.5, 0.86, 0.3, C.weave, 0.035) +
  dot(0.5, 0.86, 0.23, C.glass, 0.03) +
  line('M0.38,0.82 L0.48,0.7 M0.42,0.9 L0.56,0.74', '#FFFFFF', 0.03)

// đèn tường lồng đèn: a wood bracket from the wall with a red silk lantern hanging from its arm
const wallLantern =
  rect(0.16, 0.34, 0.12, 0.44, C.woodDark, `rx="0.03" ${ink(0.03)}`) +
  `<path d="M0.22,0.4 H0.7 V0.46" stroke="${C.woodDark}" stroke-width="0.06" fill="none" stroke-linecap="round"/>` +
  `<circle cx="0.62" cy="0.95" r="0.36" fill="${C.glow}" opacity="0.3"/>` +
  silkLantern(0.62, 0.62, C.lantern, 15)

// nón lá trang trí: a palm-leaf cone hat on a nail, its rings of leaf and a pink ribbon hanging under it
const conicalHat =
  hook(0.5, 0.42, 0.62) +
  `<path d="M0.5,0.6 Q0.78,0.92 0.98,1.1 Q0.5,1.3 0.02,1.1 Q0.22,0.92 0.5,0.6Z" fill="${C.bambooLight}" ${ink(0.04)}/>` +
  line('M0.36,0.78 Q0.5,0.82 0.64,0.78 M0.22,0.92 Q0.5,0.98 0.78,0.92 M0.1,1.04 Q0.5,1.13 0.9,1.04', C.bambooDark, 0.018) +
  line('M0.5,0.62 L0.5,1.2 M0.28,0.86 L0.2,1.15 M0.72,0.86 L0.8,1.15', C.bambooDark, 0.012) +
  `<path d="M0.3,1.18 q0.2,0.2 0.4,0" stroke="${C.lotus}" stroke-width="0.04" fill="none"/>` +
  `<path d="M0.36,1.26 l-0.06,0.24 M0.64,1.26 l0.06,0.24" stroke="${C.lotus}" stroke-width="0.04" stroke-linecap="round"/>`

// ---------- Thảm: seen from above, `w` × `h`, the same drawing turned ----------

/** The rug's edge: a rounded rectangle inset from the footprint. */
const rugEdge = (w: number, h: number, fill: string, inset = 0.06) =>
  rect(inset, inset, f(w - 2 * inset), f(h - 2 * inset), fill, `rx="0.1" ${ink(0.04)}`)
const inner = (w: number, h: number, pad: number, extra: string) =>
  rect(pad, pad, f(w - 2 * pad), f(h - 2 * pad), 'none', `rx="0.06" ${extra}`)

// thảm cói: a woven sedge mat with a teal and a red stripe round its edge
const sedgeRug = (w: number, h: number) =>
  `<defs><pattern id="sedge" width="0.2" height="0.2" patternUnits="userSpaceOnUse"><rect width="0.2" height="0.2" fill="${C.mat}"/><path d="M0,0.1 H0.2" stroke="${C.matLine}" stroke-width="0.03"/></pattern></defs>` +
  rugEdge(w, h, 'url(#sedge)') +
  inner(w, h, 0.18, `stroke="${C.teal}" stroke-width="0.06"`) +
  inner(w, h, 0.28, `stroke="${C.terracotta}" stroke-width="0.03"`)

// thảm hoa văn đỏ: a deep red rug with a gold border, a cream medallion in the middle, and tassels along its short ends
const redRug = (w: number, h: number) => {
  const long = w >= h
  const tassels = Array.from({ length: Math.round((long ? h : w) / 0.14) - 1 }, (_, i) => {
    const t = f(0.14 + i * 0.14)
    return long ? `M0.02,${t} H0.1 M${f(w - 0.1)},${t} H${f(w - 0.02)}` : `M${t},0.02 V0.1 M${t},${f(h - 0.1)} V${f(h - 0.02)}`
  }).join(' ')
  return (
    line(tassels, C.cream, 0.035) +
    rugEdge(w, h, C.lanternDark, 0.1) +
    inner(w, h, 0.2, `stroke="${C.gold}" stroke-width="0.06"`) +
    inner(w, h, 0.3, `stroke="${C.mustardDark}" stroke-width="0.02" stroke-dasharray="0.06 0.05"`) +
    `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${f(long ? 0.62 : 0.4)}" ry="${f(long ? 0.4 : 0.62)}" fill="${C.cream}" ${ink(0.03)}/>` +
    `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${f(long ? 0.36 : 0.22)}" ry="${f(long ? 0.22 : 0.36)}" fill="${C.lantern}" ${ink(0.02)}/>` +
    dot(w / 2, h / 2, 0.07, C.gold, 0.015)
  )
}

// thảm cỏ hoa: a soft green rug with little white and pink flowers scattered over it
const grassRug = (w: number, h: number) =>
  rugEdge(w, h, C.leafLight) +
  inner(w, h, 0.16, `stroke="${C.leaf}" stroke-width="0.04"`) +
  [[0.4, 0.5], [1.2, 0.36], [0.8, 0.9], [1.5, 1.2], [0.5, 1.4], [1.1, 1.55], [1.55, 0.7]].map(([x, y], i) =>
    [0, 72, 144, 216, 288].map(a => `<circle cx="${f(x + Math.cos((a * Math.PI) / 180) * 0.05)}" cy="${f(y + Math.sin((a * Math.PI) / 180) * 0.05)}" r="0.035" fill="${i % 2 ? C.lotus : C.cream}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="0.025" fill="${C.mustard}"/>`,
  ).join('')

// thảm chạy dài: a narrow runner with a terracotta field and cream and teal stripes along it
const runnerRug = (w: number, h: number) => {
  const long = h >= w
  const stripes = [0.2, 0.32, w >= h ? h - 0.32 : w - 0.32, w >= h ? h - 0.2 : w - 0.2]
    .map((s, i) => (long ? line(`M${f(s)},0.14 V${f(h - 0.14)}`, i % 3 ? C.teal : C.cream, 0.04) : line(`M0.14,${f(s)} H${f(w - 0.14)}`, i % 3 ? C.teal : C.cream, 0.04)))
    .join('')
  const diamonds = [0.25, 0.5, 0.75].map(t => {
    const [x, y] = long ? [w / 2, h * t] : [w * t, h / 2]
    return `<path d="M${f(x)},${f(y - 0.1)} L${f(x + 0.1)},${f(y)} L${f(x)},${f(y + 0.1)} L${f(x - 0.1)},${f(y)}Z" fill="${C.mustard}" ${ink(0.015)}/>`
  }).join('')
  return rugEdge(w, h, C.terracotta) + stripes + diamonds
}

// thảm tròn kem: a round cream rug with soft rings
const roundRug = (w: number, h: number) =>
  `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${f(w / 2 - 0.08)}" ry="${f(h / 2 - 0.08)}" fill="${C.paper}" ${ink(0.04)}/>` +
  [0.2, 0.4, 0.6].map(d => `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${f(w / 2 - 0.08 - d)}" ry="${f(h / 2 - 0.08 - d)}" fill="none" stroke="${C.tileSeam}" stroke-width="0.035"/>`).join('') +
  dot(w / 2, h / 2, 0.1, C.sand, 0.02)

// thảm thổ cẩm: a dark rug woven in bands of red, mustard and teal diamonds across its short way
const brocadeRug = (w: number, h: number) => {
  const across = w <= h
  const len = across ? h : w
  const span = across ? w : h
  const bands = Array.from({ length: Math.floor((len - 0.3) / 0.36) }, (_, i) => {
    const at = 0.3 + i * 0.36
    const col = [C.lantern, C.mustard, C.teal][i % 3]
    const n = Math.floor((span - 0.3) / 0.24)
    return Array.from({ length: n }, (_, j) => {
      const c = 0.15 + 0.12 + j * 0.24
      const [x, y] = across ? [c, at] : [at, c]
      return `<path d="M${f(x)},${f(y - 0.1)} L${f(x + 0.1)},${f(y)} L${f(x)},${f(y + 0.1)} L${f(x - 0.1)},${f(y)}Z" fill="${col}"/>`
    }).join('')
  }).join('')
  return rugEdge(w, h, C.deepBrown) + inner(w, h, 0.14, `stroke="${C.lantern}" stroke-width="0.04"`) + bands
}

/** Each piece's picture, keyed like furniture.ts's decor; a rug's turned picture is the same rug drawn across. */
export const NEW_DECOR: Record<string, { w: number; h: number; body: string }> = {
  'decor-waterfall': { w: 2, h: 1.5, body: waterfall },
  'decor-waterfall-turned': { w: 1.1, h: 2.25, body: waterfallTurned },
  'decor-bonsai': { w: 1, h: 1.45, body: bonsai },
  'decor-stoneLamp': { w: 1, h: 1.6, body: stoneLamp },
  'decor-inkBamboo': { w: 2, h: 2, body: inkBamboo },
  'decor-candleShelf': { w: 1, h: 2, body: candleShelf },
  'decor-sedgeRug': { w: 2, h: 2, body: sedgeRug(2, 2) },
  'decor-gramophone': { w: 1, h: 1.6, body: gramophone },
  'decor-standFan': { w: 1, h: 1.92, body: standFan },
  'decor-sewingMachine': { w: 2, h: 1.68, body: sewingMachine },
  'decor-sewingMachine-turned': { w: 1.1, h: 2.55, body: sewingMachineTurned },
  'decor-pendulumClock': { w: 1, h: 2, body: pendulumClock },
  'decor-birdCage': { w: 1, h: 2, body: birdCage },
  'decor-redRug': { w: 3, h: 2, body: redRug(3, 2) },
  'decor-redRug-turned': { w: 2, h: 3, body: redRug(2, 3) },
  'decor-fishTank': { w: 2, h: 1.62, body: fishTank },
  'decor-fishTank-turned': { w: 1.1, h: 2, body: fishTankTurned },
  'decor-bougainvillea': { w: 1, h: 1.5, body: bougainvillea },
  'decor-sunflowerVase': { w: 1, h: 1.75, body: sunflowerVase },
  'decor-fernBasket': { w: 1, h: 2, body: fernBasket },
  'decor-succulentShelf': { w: 2, h: 2, body: succulentShelf },
  'decor-grassRug': { w: 2, h: 2, body: grassRug(2, 2) },
  'decor-lacquerPainting': { w: 2, h: 2, body: lacquerPainting },
  'decor-rattanMirror': { w: 1, h: 2, body: rattanMirror },
  'decor-wallLantern': { w: 1, h: 2, body: wallLantern },
  'decor-conicalHat': { w: 1, h: 2, body: conicalHat },
  'decor-runnerRug': { w: 1, h: 3, body: runnerRug(1, 3) },
  'decor-runnerRug-turned': { w: 3, h: 1, body: runnerRug(3, 1) },
  'decor-roundRug': { w: 2, h: 2, body: roundRug(2, 2) },
  'decor-brocadeRug': { w: 2, h: 3, body: brocadeRug(2, 3) },
  'decor-brocadeRug-turned': { w: 3, h: 2, body: brocadeRug(3, 2) },
}
