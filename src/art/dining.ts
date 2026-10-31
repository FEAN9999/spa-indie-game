import { C } from './palette'

// The restaurant's seven pieces, in furniture.ts's style: seen from the front, ink outline, palette colours. A piece that
// turns has a picture of its own standing on its end, its long side up the picture and its work side to the right.

const LINE = 0.05
const FINE = 0.03
const ink = (w = LINE) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`
/** Rounds a computed coordinate so the SVG stays short. */
const f = (v: number) => +v.toFixed(3)
const line = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`
const dot = (x: number, y: number, r: number, fill: string, w = 0.02) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" ${ink(w)}/>`

/** A counter `w` tiles wide, a top slab over a panelled front, like the reception desk; things on it rise above its top. */
const counter = (w: number, top: string, body: string, rail: string) => {
  const n = Math.max(1, Math.round(w / 0.95))
  const pitch = (w - 0.4) / n
  return (
    rect(0.05, 0.3, f(w - 0.1), 0.5, top, `rx="0.1" ${ink()}`) +
    line(`M0.15,0.42 H${f(w - 0.15)}`, rail, 0.045) +
    rect(0.1, 0.74, f(w - 0.2), 0.66, body, `rx="0.08" ${ink()}`) +
    Array.from({ length: n }, (_, i) => rect(f(0.2 + i * pitch + 0.05), 0.86, f(pitch - 0.1), 0.42, 'none', `rx="0.06" stroke="${rail}" stroke-width="0.035"`)).join('')
  )
}

/** The same counter standing on its end, `len` tiles long: its top running up, its side on the right and its panelled end to the front. */
const counterTurned = (len: number, top: string, body: string, rail: string) =>
  rect(0.84, 0.6, 0.19, f(len - 0.22), body, `rx="0.06" ${ink(0.04)}`) +
  rect(0.05, 0.3, 0.88, f(len - 0.52), top, `rx="0.1" ${ink()}`) +
  line(`M0.17,0.42 V${f(len - 0.4)}`, rail, 0.045) +
  rect(0.09, f(len - 0.28), 0.8, 0.66, body, `rx="0.08" ${ink()}`) +
  rect(0.2, f(len - 0.16), 0.58, 0.42, 'none', `rx="0.06" stroke="${rail}" stroke-width="0.035"`)

const WOOD_RAIL = C.woodLight

// bếp nấu: a steel range with two burners on its top, a stock pot on the right one steaming, an oven door and three knobs
const burner = (cx: number, cy: number, flame: boolean, r = 0.27) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${f(r / 3)}" fill="${C.deepBrown}" ${ink(FINE)}/>` +
  (flame ? `<ellipse cx="${cx}" cy="${cy}" rx="${f(r * 0.55)}" ry="${f(r / 6)}" fill="${C.stoneHot}"/>` : '')
const stockPot = (cx: number, base: number) =>
  `<path d="M${f(cx - 0.24)},${f(base - 0.34)} H${f(cx + 0.24)} V${f(base - 0.06)} Q${cx},${f(base + 0.06)} ${f(cx - 0.24)},${f(base - 0.06)}Z" fill="${C.tankRib}" ${ink(0.035)}/>` +
  rect(f(cx - 0.27), f(base - 0.38), 0.54, 0.07, C.tank, `rx="0.03" ${ink(0.025)}`) +
  line(`M${f(cx - 0.12)},${f(base - 0.46)} q-0.06,-0.1 0,-0.2 t0,-0.2 M${f(cx + 0.1)},${f(base - 0.46)} q-0.06,-0.1 0,-0.2 t0,-0.2`, C.cloud, 0.035)
const stove =
  rect(0.1, 0.74, 1.8, 0.66, C.tin, `rx="0.08" ${ink()}`) +
  rect(0.25, 0.86, 1.0, 0.42, C.glass, `rx="0.06" ${ink(FINE)}`) +
  line('M0.4,0.96 L0.62,0.96', C.cloud, 0.03) +
  [1.45, 1.65, 1.85].map(x => dot(x - 0.06, 1.07, 0.06, C.cream)).join('') +
  rect(0.05, 0.3, 1.9, 0.5, C.tank, `rx="0.1" ${ink()}`) +
  burner(0.55, 0.57, true) +
  burner(1.45, 0.57, false) +
  stockPot(1.45, 0.58)

// bếp nấu turned: the range standing on its end, its two burners down the right-hand top and the pot on the far one
const stoveTurned =
  counterTurned(2, C.tank, C.tin, C.tankRib) +
  burner(0.69, 1.55, true, 0.2) +
  burner(0.69, 0.95, false, 0.2) +
  stockPot(0.69, 1.0) +
  [0.3, 0.5, 0.7].map(x => dot(x, 2.2, 0.05, C.cream)).join('')

// bàn ăn: a plain wood table with a bowl and a cup of chopsticks on it
const bowl = (cx: number, cy: number) =>
  `<path d="M${f(cx - 0.17)},${f(cy - 0.12)} H${f(cx + 0.17)} Q${f(cx + 0.15)},${f(cy + 0.08)} ${cx},${f(cy + 0.08)} Q${f(cx - 0.15)},${f(cy + 0.08)} ${f(cx - 0.17)},${f(cy - 0.12)}Z" fill="${C.cream}" ${ink(FINE)}/>` +
  line(`M${f(cx - 0.13)},${f(cy - 0.06)} H${f(cx + 0.13)}`, C.cobalt, 0.025)
const chopsticks = (cx: number, cy: number) =>
  rect(f(cx - 0.07), f(cy - 0.12), 0.14, 0.16, C.terracotta, `rx="0.03" ${ink(0.025)}`) +
  line(`M${f(cx - 0.02)},${f(cy - 0.12)} L${f(cx - 0.06)},${f(cy - 0.34)} M${f(cx + 0.02)},${f(cy - 0.12)} L${f(cx + 0.07)},${f(cy - 0.33)}`, C.bambooDark, 0.03)
const diningTable =
  rect(0.12, 0.74, 0.12, 0.6, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(1.76, 0.74, 0.12, 0.6, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(0.05, 0.4, 1.9, 0.4, C.wood, `rx="0.1" ${ink()}`) +
  line('M0.17,0.52 H1.83', C.woodLight, 0.045) +
  rect(0.05, 0.72, 1.9, 0.12, C.woodDark, `rx="0.05" ${ink(0.035)}`) +
  bowl(0.6, 0.5) +
  chopsticks(1.4, 0.52)

// bàn ăn turned: the top running up the picture, its legs at the near end and the bowl on it
const diningTableTurned =
  rect(0.13, 1.84, 0.13, 0.42, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(0.76, 1.84, 0.13, 0.42, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(0.12, 0.3, 0.78, 1.7, C.wood, `rx="0.1" ${ink()}`) +
  line('M0.24,0.42 V1.88', C.woodLight, 0.045) +
  rect(0.05, 1.86, 0.92, 0.2, C.woodDark, `rx="0.06" ${ink(0.04)}`) +
  bowl(0.5, 0.78) +
  chopsticks(0.52, 1.4)

// ghế ăn: a little chair with a slatted back and a stool seat of red cushion
const diningChair =
  rect(0.25, 0.1, 0.5, 0.5, C.wood, `rx="0.07" ${ink()}`) +
  line('M0.38,0.2 V0.5 M0.5,0.2 V0.5 M0.62,0.2 V0.5', C.woodDark, 0.035) +
  rect(0.14, 0.58, 0.72, 0.2, C.terracotta, `rx="0.08" ${ink()}`) +
  rect(0.2, 0.76, 0.1, 0.54, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(0.7, 0.76, 0.1, 0.54, C.woodDark, `rx="0.03" ${ink(0.035)}`)

// quầy chia món: a long counter with a steel top, a stack of bowls, a pot, a tray of plates and a service bell
const plateStack = (cx: number, base: number) =>
  [0, 1, 2].map(i => `<ellipse cx="${cx}" cy="${f(base - i * 0.07)}" rx="0.2" ry="0.06" fill="${C.cream}" ${ink(0.025)}/>`).join('')
const bell = (cx: number, base: number) =>
  `<path d="M${f(cx - 0.12)},${base} A0.12,0.12 0 0 1 ${f(cx + 0.12)},${base}Z" fill="${C.mustard}" ${ink(0.025)}/>` +
  rect(f(cx - 0.15), base - 0.01, 0.3, 0.05, C.mustardDark, `rx="0.02" ${ink(0.02)}`)
const servingCounter =
  counter(5, C.tank, C.wood, WOOD_RAIL) +
  stockPot(0.9, 0.5) +
  plateStack(2.0, 0.5) +
  rect(2.8, 0.2, 0.9, 0.12, C.tankRib, `rx="0.04" ${ink(0.03)}`) +
  [2.95, 3.25, 3.55].map(x => `<ellipse cx="${x}" cy="0.17" rx="0.12" ry="0.04" fill="${C.cream}" ${ink(0.02)}/>`).join('') +
  bell(4.4, 0.5)

// quầy chia món turned: the counter standing on its end with the pot at the far end and the plates and the bell down its top
const servingCounterTurned =
  counterTurned(5, C.tank, C.wood, WOOD_RAIL) +
  stockPot(0.5, 0.9) +
  plateStack(0.5, 2.4) +
  bell(0.5, 4.3)

// kệ nguyên liệu: a small wooden shelf of three rows with jars of sauce, a sack of rice below
const jarOf = (x: number, y: number, fill: string) =>
  rect(x, y, 0.2, 0.2, fill, `rx="0.05" ${ink(0.025)}`) + rect(f(x + 0.03), f(y - 0.05), 0.14, 0.07, C.woodDark, `rx="0.02" ${ink(0.02)}`)
const ingredientShelf =
  rect(0.12, 0.05, 0.76, 1.3, C.wood, `rx="0.05" ${ink()}`) +
  [0.45, 0.8].map(y => rect(0.08, y, 0.84, 0.07, C.woodDark, `rx="0.02" ${ink(0.03)}`)).join('') +
  rect(0.18, 0.1, 0.64, 0.3, C.woodDark, `rx="0.03"`) +
  jarOf(0.23, 0.2, C.lantern) + jarOf(0.5, 0.2, C.mustard) +
  rect(0.18, 0.5, 0.64, 0.3, C.woodDark, `rx="0.03"`) +
  jarOf(0.23, 0.6, C.leaf) + jarOf(0.5, 0.6, C.cream) +
  `<path d="M0.2,1.3 Q0.18,0.98 0.32,0.9 H0.68 Q0.82,0.98 0.8,1.3Z" fill="${C.sand}" ${ink(0.035)}/>` +
  line('M0.3,0.93 H0.7', C.bambooDark, 0.04) +
  rect(0.14, 1.3, 0.1, 0.12, C.woodDark, ink(0.025)) +
  rect(0.76, 1.3, 0.1, 0.12, C.woodDark, ink(0.025))

// chậu rửa: a steel double basin on a wood cabinet with a tap, a bottle of soap and a dish rack
const tap =
  rect(0.96, 0.12, 0.08, 0.3, C.tankRib, `rx="0.03" ${ink(0.025)}`) +
  `<path d="M1.0,0.14 H0.82 V0.26" stroke="${C.tankRib}" stroke-width="0.07" fill="none" stroke-linecap="round"/>` +
  `<path d="M1.0,0.14 H0.82 V0.26" stroke="${C.ink}" stroke-width="0.015" fill="none"/>`
const sink =
  counter(2, C.tank, C.wood, WOOD_RAIL) +
  rect(0.2, 0.36, 0.66, 0.26, C.waterDeep, `rx="0.08" ${ink(FINE)}`) +
  rect(1.14, 0.36, 0.66, 0.26, C.waterDeep, `rx="0.08" ${ink(FINE)}`) +
  tap +
  rect(1.64, 0.1, 0.12, 0.22, C.leafLight, `rx="0.03" ${ink(0.025)}`)

// chậu rửa turned: the cabinet standing on its end, its two basins one behind the other and the tap between them
const sinkTurned =
  counterTurned(2, C.tank, C.wood, WOOD_RAIL) +
  rect(0.2, 0.5, 0.6, 0.62, C.waterDeep, `rx="0.08" ${ink(FINE)}`) +
  rect(0.2, 1.22, 0.6, 0.62, C.waterDeep, `rx="0.08" ${ink(FINE)}`) +
  rect(0.7, 1.08, 0.08, 0.2, C.tankRib, `rx="0.03" ${ink(0.025)}`) +
  rect(0.52, 0.99, 0.28, 0.08, C.tankRib, `rx="0.03" ${ink(0.025)}`)

// quầy thu ngân: a counter with a till and its drawer, a lucky-cat bell and a tip jar
const till =
  rect(0.35, 0.16, 0.7, 0.42, C.deepBrown, `rx="0.05" ${ink(0.03)}`) +
  rect(0.42, 0.2, 0.4, 0.16, C.mint, `rx="0.03"`) +
  [0, 1, 2].map(i => rect(f(0.45 + i * 0.14), 0.42, 0.1, 0.07, C.cream, `rx="0.02"`)).join('') +
  rect(0.3, 0.52, 0.8, 0.08, C.tankRib, `rx="0.03" ${ink(0.025)}`)
/** A piece drawn at the origin of its own, moved to (x, y). */
const at = (x: number, y: number, body: string) => `<g transform="translate(${f(x)} ${f(y)})">${body}</g>`
const tipJar =
  rect(2.3, 0.28, 0.24, 0.3, C.glass, `rx="0.05" ${ink(0.03)}`) +
  rect(2.34, 0.4, 0.16, 0.14, C.leafLight, `rx="0.03"`) +
  rect(2.28, 0.24, 0.28, 0.06, C.woodDark, `rx="0.02" ${ink(0.02)}`)
const cashierCounter =
  counter(3, C.woodLight, C.terracotta, C.cream) +
  till +
  bell(1.7, 0.42) +
  tipJar

// quầy thu ngân turned: standing on its end with the till at the far end and the jar near it
const cashierCounterTurned =
  counterTurned(3, C.woodLight, C.terracotta, C.cream) +
  at(-0.03, 0.1, till) +
  bell(0.5, 1.4) +
  at(-1.75, 0.95, tipJar)

type Piece = { w: number; h: number; body: string }

/** The restaurant's furniture pictures, keyed like furniture.ts's decor under `decor-`; every piece that can turn also has a `-turned` picture. */
export const DINING_FURNITURE: Record<string, Piece> = {
  'decor-stove': { w: 2, h: 1.5, body: stove },
  'decor-stove-turned': { w: 1.1, h: 2.45, body: stoveTurned },
  'decor-diningTable': { w: 2, h: 1.4, body: diningTable },
  'decor-diningTable-turned': { w: 1.1, h: 2.3, body: diningTableTurned },
  'decor-diningChair': { w: 1, h: 1.45, body: diningChair },
  'decor-servingCounter': { w: 5, h: 1.45, body: servingCounter },
  'decor-servingCounter-turned': { w: 1.1, h: 5.45, body: servingCounterTurned },
  'decor-ingredientShelf': { w: 1, h: 1.45, body: ingredientShelf },
  'decor-sink': { w: 2, h: 1.45, body: sink },
  'decor-sink-turned': { w: 1.1, h: 2.45, body: sinkTurned },
  'decor-cashierCounter': { w: 3, h: 1.45, body: cashierCounter },
  'decor-cashierCounter-turned': { w: 1.1, h: 3.45, body: cashierCounterTurned },
}
