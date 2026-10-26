import { TILE } from '../config'
import type { ItemKind } from '../sim/items'
import { C } from './palette'
import { svgDoc } from './svg'

const LINE = 0.05
const FINE = 0.03
const ink = (w = LINE) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`

const WEAVE =
  `<defs><pattern id="weave" width="0.16" height="0.16" patternUnits="userSpaceOnUse">` +
  `<rect width="0.16" height="0.16" fill="${C.weave}"/>` +
  `<path d="M0,0.08 H0.16 M0.08,0 V0.16" stroke="${C.weaveLine}" stroke-width="0.025"/></pattern></defs>`

// wall basin, then the bed seen from above with its head at the wall and a folded towel at the foot
const bed =
  rect(0.05, 0.04, 1.0, 0.56, C.cream, `rx="0.2" ${ink()}`) +
  `<ellipse cx="0.55" cy="0.3" rx="0.34" ry="0.14" fill="${C.water}" ${ink(FINE)}/>` +
  `<path d="M0.12,0.5 H0.98" stroke="${C.cobalt}" stroke-width="0.05"/>` +
  rect(0.5, 0.02, 0.1, 0.12, C.mustard, `rx="0.03" ${ink(0.025)}`) +
  rect(0.05, 0.6, 1.0, 2.85, C.wood, `rx="0.12" ${ink()}`) +
  rect(0.13, 0.66, 0.84, 2.7, C.tealLight, `rx="0.1" ${ink(FINE)}`) +
  rect(0.2, 0.74, 0.7, 0.32, C.cream, `rx="0.12" ${ink(FINE)}`) +
  rect(0.3, 2.85, 0.5, 0.36, C.terracotta, `rx="0.04" ${ink(FINE)}`) +
  `<path d="M0.3,3.0 H0.8" stroke="${C.cream}" stroke-width="0.045"/>` +
  rect(0.05, 3.38, 1.0, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.1, 3.52, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(0.88, 3.52, 0.12, 0.14, C.woodDark, ink(0.025))

const bench =
  WEAVE +
  rect(0.1, 0.05, 3.0, 0.3, C.wood, `rx="0.08" ${ink()}`) +
  `<path d="M0.25,0.18 H2.95" stroke="${C.woodDark}" stroke-width="${FINE}"/>` +
  rect(0.15, 0.33, 2.9, 0.62, 'url(#weave)', `rx="0.1" ${ink()}`) +
  [0, 1, 2].map(i => rect(0.25 + i * 0.97, 0.38, 0.8, 0.5, C.terracotta, `rx="0.14" ${ink(FINE)}`)).join('') +
  rect(0.15, 0.93, 2.9, 0.18, C.wood, `rx="0.06" ${ink(0.04)}`) +
  rect(0.03, 0.15, 0.18, 0.95, C.woodDark, `rx="0.08" ${ink(0.04)}`) +
  rect(2.99, 0.15, 0.18, 0.95, C.woodDark, `rx="0.08" ${ink(0.04)}`) +
  rect(0.3, 1.08, 0.1, 0.22, C.woodDark, ink(0.025)) +
  rect(2.8, 1.08, 0.1, 0.22, C.woodDark, ink(0.025))

// counter with a lotus vase, the appointment book and a brass bell; things on top rise above the counter
const desk =
  rect(0.05, 0.3, 2.9, 0.5, C.wood, `rx="0.1" ${ink()}`) +
  `<path d="M0.15,0.42 H2.85" stroke="${C.woodLight}" stroke-width="0.045" stroke-linecap="round"/>` +
  rect(0.1, 0.74, 2.8, 0.66, C.woodDark, `rx="0.08" ${ink()}`) +
  [0, 1, 2].map(i => rect(0.25 + i * 0.9, 0.86, 0.7, 0.42, 'none', `rx="0.06" stroke="${C.wood}" stroke-width="0.035"`)).join('') +
  `<g ${ink(FINE)}>` +
  `<path d="M0.45,0.39 Q0.27,0.3 0.33,0.15 Q0.45,0.26 0.45,0.39Z M0.45,0.39 Q0.63,0.3 0.57,0.15 Q0.45,0.26 0.45,0.39Z" fill="${C.lotus}"/>` +
  `<path d="M0.45,0.39 Q0.38,0.22 0.45,0.06 Q0.52,0.22 0.45,0.39Z" fill="${C.lotusDark}"/>` +
  `<path d="M0.33,0.64 Q0.29,0.48 0.37,0.39 H0.53 Q0.61,0.48 0.57,0.64Z" fill="${C.cream}"/></g>` +
  `<path d="M0.32,0.53 H0.58" stroke="${C.cobalt}" stroke-width="0.035"/>` +
  `<g transform="rotate(-5 1.46 0.58)">` +
  rect(1.15, 0.42, 0.62, 0.32, C.cream, `rx="0.03" ${ink(FINE)}`) +
  `<path d="M1.23,0.53 H1.68 M1.23,0.63 H1.6" stroke="${C.terracotta}" stroke-width="0.025"/></g>` +
  `<path d="M2.27,0.64 A0.18,0.18 0 0 1 2.63,0.64Z" fill="${C.mustard}" ${ink(FINE)}/>` +
  rect(2.22, 0.62, 0.46, 0.07, C.mustardDark, `rx="0.03" ${ink(0.025)}`) +
  `<circle cx="2.45" cy="0.42" r="0.04" fill="${C.mustardDark}" ${ink(0.02)}/>`

const plant =
  `<g ${ink(0.035)}>` +
  `<path d="M0.5,1.12 Q0.12,0.85 0.06,0.45 Q0.32,0.65 0.5,1.08Z M0.5,1.12 Q0.88,0.85 0.94,0.45 Q0.68,0.65 0.5,1.08Z" fill="${C.leaf}"/>` +
  `<path d="M0.5,1.12 Q0.36,0.55 0.46,0.06 Q0.62,0.55 0.5,1.12Z" fill="${C.leafLight}"/>` +
  `<path d="M0.27,1.1 H0.73 Q0.73,1.45 0.66,1.54 H0.34 Q0.27,1.45 0.27,1.1Z" fill="${C.cream}"/></g>` +
  `<path d="M0.28,1.25 H0.72" stroke="${C.cobalt}" stroke-width="0.05"/>`

// rattan screen: woven panel between dark rails, posts at the thirds and taller end posts
const screen =
  WEAVE +
  rect(0.05, 0.25, 4.9, 0.85, 'url(#weave)', ink(0.04)) +
  rect(0.02, 0.15, 4.96, 0.16, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.05, 1.05, 4.9, 0.12, C.woodDark, ink(0.035)) +
  rect(5 / 3 - 0.06, 0.2, 0.12, 0.95, C.wood, ink(FINE)) +
  rect(10 / 3 - 0.06, 0.2, 0.12, 0.95, C.wood, ink(FINE)) +
  rect(0.02, 0.05, 0.17, 1.2, C.wood, `rx="0.05" ${ink(0.04)}`) +
  rect(4.81, 0.05, 0.17, 1.2, C.wood, `rx="0.05" ${ink(0.04)}`)

const TOWELS = [C.cream, C.tealLight, C.cream, C.terracotta]
const cabinet =
  rect(0.05, 0.05, 2.9, 0.42, C.woodLight, `rx="0.06" ${ink()}`) +
  TOWELS.map((fill, i) => rect(0.2 + i * 0.66, 0.12, 0.5, 0.26, fill, `rx="0.13" ${ink(FINE)}`)).join('') +
  `<path d="M0.38,0.13 V0.37 M1.7,0.13 V0.37" stroke="${C.terracotta}" stroke-width="0.035"/>` +
  rect(0.1, 0.45, 2.8, 1.0, C.wood, `rx="0.06" ${ink()}`) +
  rect(0.22, 0.57, 1.22, 0.76, 'none', `rx="0.04" stroke="${C.woodDark}" stroke-width="0.035"`) +
  rect(1.56, 0.57, 1.22, 0.76, 'none', `rx="0.04" stroke="${C.woodDark}" stroke-width="0.035"`) +
  `<circle cx="1.38" cy="0.95" r="0.05" fill="${C.mustard}" ${ink(0.02)}/><circle cx="1.62" cy="0.95" r="0.05" fill="${C.mustard}" ${ink(0.02)}/>`

const bottle = (x: number, fill: string, top = 0.18) =>
  rect(x - 0.05, top - 0.08, 0.1, 0.1, C.cream, ink(0.025)) + rect(x - 0.1, top, 0.2, 0.6 - top, fill, `rx="0.07" ${ink(FINE)}`)
const shelf =
  bottle(0.35, C.cobalt) +
  bottle(0.65, C.tealLight, 0.24) +
  bottle(0.95, C.terracotta) +
  rect(1.25, 0.3, 0.42, 0.3, C.cream, `rx="0.08" ${ink(FINE)}`) +
  `<path d="M1.26,0.45 H1.66" stroke="${C.cobalt}" stroke-width="0.04"/>` +
  bottle(2.0, C.mustard) +
  bottle(2.35, C.cobalt, 0.24) +
  bottle(2.65, C.tealLight) +
  rect(0.1, 0.55, 2.8, 0.22, C.woodLight, `rx="0.05" ${ink(0.04)}`) +
  rect(0.15, 0.74, 2.7, 0.5, C.wood, `rx="0.05" ${ink(0.04)}`) +
  [0, 1, 2].map(i => rect(0.27 + i * 0.88, 0.83, 0.7, 0.32, 'none', `rx="0.04" stroke="${C.woodDark}" stroke-width="${FINE}"`)).join('')

// blue-and-white porcelain basin with lily pads and a lotus
const lotus =
  `<path d="M0.15,0.5 V0.75 A0.85,0.3 0 0 0 1.85,0.75 V0.5Z" fill="${C.cobalt}" ${ink(0.04)}/>` +
  `<path d="M0.15,0.63 A0.85,0.3 0 0 0 1.85,0.63" stroke="${C.cream}" stroke-width="0.05" fill="none"/>` +
  `<ellipse cx="1" cy="0.5" rx="0.85" ry="0.3" fill="${C.cream}" ${ink(0.04)}/>` +
  `<ellipse cx="1" cy="0.5" rx="0.7" ry="0.22" fill="${C.waterDeep}" ${ink(0.025)}/>` +
  `<g ${ink(0.02)}>` +
  `<ellipse cx="0.62" cy="0.48" rx="0.15" ry="0.09" fill="${C.leaf}"/><ellipse cx="1.4" cy="0.56" rx="0.13" ry="0.08" fill="${C.leafLight}"/>` +
  `<path d="M1.05,0.48 Q0.85,0.43 0.85,0.26 Q0.98,0.32 1.05,0.48Z M1.05,0.48 Q1.25,0.43 1.25,0.26 Q1.12,0.32 1.05,0.48Z" fill="${C.lotus}"/>` +
  `<path d="M1.05,0.48 Q0.96,0.3 1.05,0.13 Q1.14,0.3 1.05,0.48Z" fill="${C.lotusDark}"/></g>`

const BLOSSOMS: [number, number][] = [
  [0.12, 0.72], [0.22, 0.86], [0.82, 0.55], [0.7, 0.72], [0.88, 1.0], [0.5, 0.2], [0.45, 0.46], [0.33, 0.96],
]
const vase =
  `<path d="M0.5,1.22 Q0.32,0.9 0.12,0.72 M0.5,1.22 Q0.6,0.8 0.82,0.55 M0.55,1.0 Q0.72,0.95 0.88,1.0 M0.45,1.1 Q0.38,0.6 0.5,0.2" stroke="${C.woodDark}" stroke-width="0.04" stroke-linecap="round" fill="none"/>` +
  BLOSSOMS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.065" fill="${C.lotus}" ${ink(0.015)}/>`).join('') +
  `<path d="M0.3,1.85 Q0.18,1.55 0.35,1.32 V1.22 H0.65 V1.32 Q0.82,1.55 0.7,1.85Z" fill="${C.cream}" ${ink(0.04)}/>` +
  `<path d="M0.24,1.6 H0.76" stroke="${C.cobalt}" stroke-width="0.06"/>`

const tea =
  rect(0.1, 0.35, 1.8, 0.35, C.wood, `rx="0.08" ${ink(0.04)}`) +
  rect(0.15, 0.66, 1.7, 0.18, C.woodDark, `rx="0.05" ${ink(0.035)}`) +
  `<path d="M0.85,0.36 Q0.98,0.31 1.0,0.2" stroke="${C.ink}" stroke-width="0.045" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="0.65" cy="0.38" rx="0.22" ry="0.15" fill="${C.cream}" ${ink(FINE)}/>` +
  `<path d="M0.47,0.42 H0.83" stroke="${C.cobalt}" stroke-width="0.03"/>` +
  `<circle cx="0.65" cy="0.21" r="0.05" fill="${C.cobalt}" ${ink(0.02)}/>` +
  `<ellipse cx="1.25" cy="0.46" rx="0.09" ry="0.06" fill="${C.cream}" ${ink(0.025)}/>` +
  `<ellipse cx="1.5" cy="0.46" rx="0.09" ry="0.06" fill="${C.cream}" ${ink(0.025)}/>`

const SLIPPERS: [number, string][] = [[0.35, C.tealLight], [0.85, C.terracotta], [1.35, C.mustard]]
const slippers =
  rect(0.15, 0.53, 1.7, 0.32, C.wood, `rx="0.04" ${ink(0.035)}`) +
  `<path d="M0.15,0.69 H1.85" stroke="${C.woodDark}" stroke-width="${FINE}"/>` +
  rect(0.1, 0.4, 1.8, 0.16, C.woodLight, `rx="0.04" ${ink(0.035)}`) +
  SLIPPERS.map(([x, fill]) =>
    `<ellipse cx="${x}" cy="0.36" rx="0.08" ry="0.13" fill="${fill}" ${ink(0.02)}/>` +
    `<ellipse cx="${x + 0.17}" cy="0.36" rx="0.08" ry="0.13" fill="${fill}" ${ink(0.02)}/>`,
  ).join('')

// low planter behind the waiting bench
const planter =
  [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${0.3 + i * 0.48}" cy="0.4" r="0.22" fill="${i % 2 ? C.leafLight : C.leaf}" ${ink(FINE)}/>`).join('') +
  rect(0.08, 0.55, 2.84, 0.5, C.terracotta, `rx="0.06" ${ink(0.045)}`) +
  rect(0.04, 0.48, 2.92, 0.12, C.woodDark, `rx="0.05" ${ink(0.035)}`)

/** Woven chiếu cói for the runner and the waiting-area mat. */
export const MAT =
  `<pattern id="mat" width="0.28" height="0.28" patternUnits="userSpaceOnUse">` +
  `<rect width="0.28" height="0.28" fill="${C.mat}"/>` +
  `<path d="M0,0.07 H0.28 M0,0.21 H0.28" stroke="${C.matLine}" stroke-width="0.035"/></pattern>`

/** Red lantern hanging from the top of the back wall, centred on x. */
export function lantern(x: number): string {
  return (
    `<g ${ink(0.035)}>` +
    `<path d="M${x},0 V0.22" stroke-width="0.03"/>` +
    rect(x - 0.12, 0.2, 0.24, 0.09, C.mustard, 'rx="0.03"') +
    `<ellipse cx="${x}" cy="0.55" rx="0.28" ry="0.27" fill="${C.lantern}"/>` +
    `<path d="M${x - 0.14},0.32 Q${x - 0.21},0.55 ${x - 0.14},0.78 M${x + 0.14},0.32 Q${x + 0.21},0.55 ${x + 0.14},0.78 M${x},0.29 V0.81" stroke="${C.lanternDark}" stroke-width="0.025" fill="none"/>` +
    rect(x - 0.12, 0.79, 0.24, 0.09, C.mustard, 'rx="0.03"') +
    `<path d="M${x - 0.06},0.88 V1.06 M${x},0.88 V1.1 M${x + 0.06},0.88 V1.06" stroke="${C.mustard}" stroke-width="0.035"/>` +
    `</g>`
  )
}

/** Dashed outline where a bed could go, with a "+" on its middle tile; (x, y) is its head tile on the back row. */
export function bedSlot(x: number, y: number): string {
  const cx = x + 0.5
  const cy = y + 1.5
  return (
    `<g fill="${C.cream}" fill-opacity="0.4" stroke="${C.ink}" stroke-opacity="0.5" stroke-width="0.04" stroke-dasharray="0.12 0.09">` +
    `<rect x="${x - 0.05}" y="1.3" width="1.1" height="0.6" rx="0.2"/>` +
    `<rect x="${x - 0.05}" y="1.9" width="1.1" height="${y + 3 - 1.9}" rx="0.15"/></g>` +
    `<circle cx="${cx}" cy="${cy}" r="0.3" fill="${C.cream}" stroke="${C.terracotta}" stroke-width="0.05"/>` +
    `<path d="M${cx},${cy - 0.17} V${cy + 0.17} M${cx - 0.17},${cy} H${cx + 0.17}" stroke="${C.terracotta}" stroke-width="0.06" stroke-linecap="round"/>`
  )
}

/** Cói mat with a terracotta border under the seats from x = left to right on `row`, reaching down over the tea table. Needs MAT. */
export function benchMat(left: number, right: number, row: number): string {
  const x = left - 0.4
  const w = right + 1.4 - x
  const y = row - 0.2
  return (
    rect(x, y, w, 3.1, 'url(#mat)', `rx="0.1" ${ink(0.035)}`) +
    rect(x + 0.12, y + 0.12, w - 0.24, 2.86, 'none', `rx="0.06" stroke="${C.terracotta}" stroke-width="0.06"`)
  )
}

/** Rounds a computed coordinate so the SVG stays short. */
const f = (v: number) => +v.toFixed(3)

/** A bamboo pole filling the box, lit along its upper or left side, with a dark node every `step` or so. */
function pole(x: number, y: number, w: number, h: number, step = 0.6): string {
  const across = w >= h
  const r = Math.min(w, h) / 2
  const len = Math.max(w, h)
  const parts = Math.max(1, Math.round(len / step))
  const nodes = Array.from({ length: parts - 1 }, (_, i) => {
    const p = f(((i + 1) * len) / parts)
    return across ? `M${f(x + p)},${f(y + 0.015)} V${f(y + h - 0.015)}` : `M${f(x + 0.015)},${f(y + p)} H${f(x + w - 0.015)}`
  })
  const shine = across ? `M${f(x + r)},${f(y + h * 0.33)} H${f(x + w - r)}` : `M${f(x + w * 0.33)},${f(y + r)} V${f(y + h - r)}`
  return (
    rect(x, y, w, h, C.bamboo, `rx="${f(r)}" ${ink(0.035)}`) +
    `<path d="${shine}" stroke="${C.bambooLight}" stroke-width="${f(r * 0.55)}" stroke-linecap="round"/>` +
    (nodes.length ? `<path d="${nodes.join(' ')}" stroke="${C.bambooDark}" stroke-width="0.03"/>` : '')
  )
}

// tủ chè: low dark-wood chest with brass corners and mother-of-pearl flowers, a lidded caddy and a tea set on top
const CORNERS =
  `M0.1,0.6 H0.3 L0.1,0.8Z M2.9,0.6 H2.7 L2.9,0.8Z M0.1,1.16 H0.3 L0.1,0.96Z M2.9,1.16 H2.7 L2.9,0.96Z`
const teaChest =
  rect(0.22, 1.1, 0.16, 0.2, C.woodDark, ink(0.025)) +
  rect(2.62, 1.1, 0.16, 0.2, C.woodDark, ink(0.025)) +
  rect(0.1, 0.54, 2.8, 0.62, C.woodDark, `rx="0.03" ${ink()}`) +
  [0.22, 1.1, 1.98].map(x => rect(x, 0.68, 0.8, 0.38, 'none', `rx="0.04" stroke="${C.wood}" stroke-width="0.035"`)).join('') +
  `<g ${ink(0.015)}>` +
  [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) => `<circle cx="${f(1.5 + dx * 0.075)}" cy="${f(0.87 + dy * 0.075)}" r="0.05" fill="${C.cream}"/>`).join('') +
  `<circle cx="1.5" cy="0.87" r="0.035" fill="${C.mustard}"/></g>` +
  `<circle cx="0.62" cy="0.87" r="0.055" fill="none" stroke="${C.mustard}" stroke-width="0.03"/>` +
  `<circle cx="2.38" cy="0.87" r="0.055" fill="none" stroke="${C.mustard}" stroke-width="0.03"/>` +
  `<path d="${CORNERS}" fill="${C.mustard}" ${ink(0.02)}/>` +
  rect(0.04, 0.36, 2.92, 0.24, C.wood, `rx="0.06" ${ink()}`) +
  `<path d="M0.16,0.45 H2.84" stroke="${C.woodLight}" stroke-width="0.045" stroke-linecap="round"/>` +
  rect(0.33, 0.2, 0.3, 0.3, C.cream, `rx="0.08" ${ink(FINE)}`) +
  `<path d="M0.34,0.36 H0.62" stroke="${C.cobalt}" stroke-width="0.05"/>` +
  rect(0.36, 0.14, 0.24, 0.08, C.cobalt, `rx="0.03" ${ink(0.025)}`) +
  rect(0.98, 0.42, 1.14, 0.12, C.woodLight, `rx="0.05" ${ink(FINE)}`) +
  `<path d="M1.42,0.36 Q1.55,0.31 1.57,0.2" stroke="${C.ink}" stroke-width="0.045" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="1.24" cy="0.38" rx="0.2" ry="0.14" fill="${C.cream}" ${ink(FINE)}/>` +
  `<path d="M1.07,0.42 H1.41" stroke="${C.cobalt}" stroke-width="0.03"/>` +
  `<circle cx="1.24" cy="0.22" r="0.05" fill="${C.cobalt}" ${ink(0.02)}/>` +
  [1.62, 1.8, 1.98].map(x => `<ellipse cx="${x}" cy="0.45" rx="0.075" ry="0.055" fill="${C.cream}" ${ink(0.025)}/>`).join('')

// chum sứ: blue-and-white lidded jar with cobalt bands and a cobalt medallion on its belly
const jar =
  `<path d="M0.36,0.5 Q0.04,0.6 0.07,0.98 Q0.1,1.36 0.27,1.52 H0.73 Q0.9,1.36 0.93,0.98 Q0.96,0.6 0.64,0.5Z" fill="${C.cream}" ${ink(0.045)}/>` +
  `<path d="M0.15,0.7 Q0.5,0.82 0.85,0.7 M0.19,1.33 Q0.5,1.42 0.81,1.33" stroke="${C.cobalt}" stroke-width="0.05" fill="none"/>` +
  `<circle cx="0.5" cy="1.04" r="0.19" fill="${C.cobalt}" ${ink(0.025)}/>` +
  [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) => `<circle cx="${f(0.5 + dx * 0.07)}" cy="${f(1.04 + dy * 0.07)}" r="0.05" fill="${C.cream}"/>`).join('') +
  `<circle cx="0.5" cy="1.04" r="0.03" fill="${C.cobalt}"/>` +
  rect(0.33, 0.4, 0.34, 0.12, C.cream, `rx="0.03" ${ink(FINE)}`) +
  `<path d="M0.27,0.43 Q0.5,0.16 0.73,0.43Z" fill="${C.cream}" ${ink(0.035)}/>` +
  `<path d="M0.32,0.37 Q0.5,0.31 0.68,0.37" stroke="${C.cobalt}" stroke-width="0.04" fill="none"/>` +
  `<circle cx="0.5" cy="0.22" r="0.055" fill="${C.cobalt}" ${ink(0.02)}/>`

// Tre làng: yellow bamboo with dark nodes, woven mây, brown pottery

// three woven seats in a bamboo frame
const bambooBench =
  WEAVE +
  pole(0.12, 0.06, 2.76, 0.14) +
  pole(0.12, 0.19, 2.76, 0.14) +
  pole(0.32, 1.02, 0.11, 0.28) +
  pole(2.57, 1.02, 0.11, 0.28) +
  [0, 1, 2].map(i => rect(0.17 + i * 0.9, 0.34, 0.86, 0.6, 'url(#weave)', `rx="0.08" ${ink(0.04)}`)).join('') +
  pole(0.08, 0.9, 2.84, 0.16) +
  pole(0.02, 0.04, 0.17, 1.08) +
  pole(2.81, 0.04, 0.17, 1.08)

/** A brown clay pot centred on cx from its rim at `top` to its foot, `half` wide at the rim's ends. */
const clayPot = (cx: number, top: number, bottom: number, half: number) =>
  `<path d="M${f(cx - half * 0.6)},${top} Q${f(cx - half * 1.25)},${f((top + bottom) / 2)} ${f(cx - half * 0.7)},${bottom} H${f(cx + half * 0.7)} Q${f(cx + half * 1.25)},${f((top + bottom) / 2)} ${f(cx + half * 0.6)},${top}Z" fill="${C.clay}" ${ink(FINE)}/>` +
  rect(f(cx - half * 0.7), f(top - 0.04), f(half * 1.4), 0.07, C.clayLight, `rx="0.03" ${ink(0.02)}`)

// slatted bamboo top with a clay teapot and two cups
const bambooTea =
  pole(0.2, 0.7, 0.12, 0.22) +
  pole(1.68, 0.7, 0.12, 0.22) +
  rect(0.08, 0.34, 1.84, 0.36, C.bamboo, `rx="0.06" ${ink(0.04)}`) +
  `<path d="M0.1,0.46 H1.9 M0.1,0.58 H1.9" stroke="${C.bambooDark}" stroke-width="${FINE}"/>` +
  `<path d="M0.55,0.35 V0.46 M1.35,0.35 V0.46 M0.95,0.46 V0.58 M1.7,0.46 V0.58 M0.35,0.58 V0.69 M1.2,0.58 V0.69" stroke="${C.bambooDark}" stroke-width="0.03"/>` +
  pole(0.06, 0.64, 1.88, 0.15) +
  `<path d="M0.85,0.36 Q0.98,0.31 1.0,0.2" stroke="${C.ink}" stroke-width="0.045" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="0.65" cy="0.38" rx="0.22" ry="0.15" fill="${C.clay}" ${ink(FINE)}/>` +
  `<path d="M0.5,0.3 Q0.65,0.25 0.8,0.3" stroke="${C.clayLight}" stroke-width="0.03" fill="none"/>` +
  `<circle cx="0.65" cy="0.21" r="0.05" fill="${C.clayLight}" ${ink(0.02)}/>` +
  `<ellipse cx="1.25" cy="0.46" rx="0.09" ry="0.06" fill="${C.clayLight}" ${ink(0.025)}/>` +
  `<ellipse cx="1.5" cy="0.46" rx="0.09" ry="0.06" fill="${C.clayLight}" ${ink(0.025)}/>`

// two-tier bamboo rack: a mây basket of rolled towels and a clay pot above, folded towels and a basket below
const ROLLED: [number, string][] = [[0.45, C.cream], [0.64, C.tealLight], [0.83, C.cream]]
const FOLDED: [number, string][] = [[1.18, C.cream], [1.06, C.tealLight], [0.94, C.cream]]
const bambooShelf =
  WEAVE +
  ROLLED.map(([x, fill]) => `<circle cx="${x}" cy="0.44" r="0.1" fill="${fill}" ${ink(0.025)}/>`).join('') +
  rect(0.28, 0.46, 0.72, 0.28, 'url(#weave)', `rx="0.06" ${ink(FINE)}`) +
  clayPot(1.42, 0.42, 0.74, 0.24) +
  FOLDED.map(([y, fill]) => rect(0.3, y, 0.66, 0.14, fill, `rx="0.06" ${ink(0.025)}`)).join('') +
  rect(1.12, 1.04, 0.62, 0.34, 'url(#weave)', `rx="0.06" ${ink(FINE)}`) +
  pole(0.04, 0.72, 1.92, 0.13) +
  pole(0.04, 1.36, 1.92, 0.13) +
  pole(0.06, 0.12, 0.15, 1.52) +
  pole(1.79, 0.12, 0.15, 1.52)

// standing lamp: a glowing bamboo-ribbed shade on a bamboo stem
const bambooLamp =
  `<circle cx="0.5" cy="0.56" r="0.48" fill="${C.glow}" opacity="0.35"/>` +
  rect(0.24, 1.9, 0.52, 0.12, C.bambooDark, `rx="0.06" ${ink(0.035)}`) +
  pole(0.45, 0.86, 0.1, 1.08, 0.36) +
  `<ellipse cx="0.5" cy="0.56" rx="0.3" ry="0.34" fill="${C.glow}" ${ink(0.04)}/>` +
  `<path d="M0.36,0.25 Q0.26,0.56 0.36,0.87 M0.64,0.25 Q0.74,0.56 0.64,0.87 M0.5,0.22 V0.9" stroke="${C.bambooDark}" stroke-width="0.025" fill="none"/>` +
  pole(0.3, 0.17, 0.4, 0.09) +
  pole(0.3, 0.86, 0.4, 0.09) +
  `<circle cx="0.5" cy="0.13" r="0.05" fill="${C.bamboo}" ${ink(0.025)}/>`

// chum nước: brown glazed water jar with a wooden lid and a coconut-shell ladle on a bamboo handle
const clayJar =
  `<path d="M0.3,0.45 Q0.02,0.6 0.06,0.95 Q0.1,1.3 0.28,1.4 H0.72 Q0.9,1.3 0.94,0.95 Q0.98,0.6 0.7,0.45Z" fill="${C.clay}" ${ink(0.045)}/>` +
  `<path d="M0.12,0.66 Q0.5,0.78 0.88,0.66 M0.14,1.2 Q0.5,1.3 0.86,1.2" stroke="${C.clayLight}" stroke-width="0.035" fill="none"/>` +
  `<path d="M0.18,0.82 Q0.16,0.95 0.2,1.06" stroke="${C.clayLight}" stroke-width="0.05" fill="none" stroke-linecap="round"/>` +
  rect(0.22, 0.38, 0.56, 0.12, C.clayLight, `rx="0.05" ${ink(0.035)}`) +
  `<ellipse cx="0.5" cy="0.38" rx="0.3" ry="0.09" fill="${C.wood}" ${ink(0.035)}/>` +
  `<path d="M0.3,0.36 Q0.5,0.31 0.7,0.36" stroke="${C.woodLight}" stroke-width="0.03" fill="none"/>` +
  `<path d="M0.52,0.32 L0.9,0.1" stroke="${C.ink}" stroke-width="0.09" stroke-linecap="round"/>` +
  `<path d="M0.52,0.32 L0.9,0.1" stroke="${C.bamboo}" stroke-width="0.045" stroke-linecap="round"/>` +
  `<path d="M0.27,0.3 A0.15,0.1 0 0 0 0.57,0.3Z" fill="${C.woodDark}" ${ink(FINE)}/>`

/** An areca frond along the curve from the crown (x0, y0) bowed toward (cx, cy) to its tip, with pointed leaflets down both sides. */
function frond(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, fill: string): string {
  // the point on the rib at t, pushed `side` across it
  const at = (t: number, side: number): [number, number] => {
    const u = 1 - t
    const tx = u * (cx - x0) + t * (x1 - cx)
    const ty = u * (cy - y0) + t * (y1 - cy)
    const k = side / Math.hypot(tx, ty)
    return [u * u * x0 + 2 * u * t * cx + t * t * x1 - ty * k, u * u * y0 + 2 * u * t * cy + t * t * y1 + tx * k]
  }
  // a lens-shaped leaflet from its base on the rib to its point
  const leaflet = ([bx, by]: [number, number], [px, py]: [number, number]) => {
    const mx = (bx + px) / 2
    const my = (by + py) / 2
    const nx = (by - py) * 0.3
    const ny = (px - bx) * 0.3
    return `M${f(bx)},${f(by)} Q${f(mx + nx)},${f(my + ny)} ${f(px)},${f(py)} Q${f(mx - nx)},${f(my - ny)} ${f(bx)},${f(by)}Z`
  }
  const leaflets = [1, -1].flatMap(s =>
    [0, 1, 2, 3, 4].map(i => leaflet(at(0.08 + i * 0.16, 0), at(0.32 + i * 0.16, s * 0.14 * (1 - i * 0.1)))),
  )
  const rib = fill === C.leaf ? C.leafLight : C.leaf
  const [rx, ry] = at(0.9, 0)
  return (
    `<path d="${leaflets.join(' ')} ${leaflet(at(0.78, 0), at(1, 0))}" fill="${fill}" ${ink(0.02)}/>` +
    `<path d="M${x0},${y0} Q${cx},${cy} ${f(rx)},${f(ry)}" stroke="${rib}" stroke-width="0.025" fill="none"/>`
  )
}

// cây cau: a golden-cane areca with arching fronds in a brown clay pot
const areca =
  frond(0.5, 0.72, 0.18, 0.3, 0.1, 1.0, C.leaf) +
  frond(0.5, 0.72, 0.82, 0.3, 0.9, 1.0, C.leaf) +
  pole(0.46, 0.7, 0.08, 0.86, 0.15) +
  frond(0.5, 0.72, 0.72, 0.05, 0.92, 0.4, C.leaf) +
  frond(0.5, 0.72, 0.28, 0.05, 0.08, 0.4, C.leafLight) +
  frond(0.5, 0.72, 0.42, 0.15, 0.6, 0.04, C.leafLight) +
  clayPot(0.5, 1.5, 1.96, 0.26)

/** Furniture sizes in tiles; RoomView anchors each piece at the bottom-centre of the tiles it stands on, and the room parts at the end by their top-left. */
export const FURNITURE: Record<string, { w: number; h: number; body: string }> = {
  bed: { w: 1.1, h: 3.7, body: bed },
  bench: { w: 3.2, h: 1.35, body: bench },
  desk: { w: 3, h: 1.45, body: desk },
  plant: { w: 1, h: 1.6, body: plant },
  'decor-screen': { w: 5, h: 1.3, body: screen },
  'decor-cabinet': { w: 3, h: 1.5, body: cabinet },
  'decor-shelf': { w: 3, h: 1.3, body: shelf },
  'decor-lotus': { w: 2, h: 1.1, body: lotus },
  'decor-vase': { w: 1, h: 1.9, body: vase },
  'decor-tea': { w: 2, h: 0.9, body: tea },
  'decor-slippers': { w: 2, h: 0.9, body: slippers },
  'decor-planter': { w: 3, h: 1.1, body: planter },
  teaChest: { w: 3, h: 1.35, body: teaChest },
  jar: { w: 1, h: 1.6, body: jar },
  bambooBench: { w: 3, h: 1.35, body: bambooBench },
  bambooTea: { w: 2, h: 0.95, body: bambooTea },
  bambooShelf: { w: 2, h: 1.7, body: bambooShelf },
  bambooLamp: { w: 1, h: 2.05, body: bambooLamp },
  clayJar: { w: 1, h: 1.45, body: clayJar },
  areca: { w: 1, h: 2, body: areca },
  // Parts the room bakes today, cut on whole and half tiles so they land on the same pixels:
  // a lantern's top-left is (work tile x, 0); a bed slot's is half a tile left of and one tile above its head tile;
  // a bench mat's is half a tile left of and above the bench's top-left tile, framed on the default bench so the weave matches.
  lantern: { w: 1, h: 1.5, body: lantern(0.5) },
  bedSlot: { w: 2, h: 4.5, body: `<g transform="translate(0.5 -1)">${bedSlot(0, 2)}</g>` },
  benchMat: { w: 4, h: 3.5, body: `<defs>${MAT}</defs><g transform="translate(-1.5 -12.5)">${benchMat(2, 4, 13)}</g>` },
}

/** The texture of an item kind: the first pieces keep their keys, the old decor is under `decor-`. */
export function itemTexture(kind: ItemKind): string {
  return kind in FURNITURE ? kind : `decor-${kind}`
}

export function furnitureTextures(): Record<string, string> {
  return Object.fromEntries(Object.entries(FURNITURE).map(([key, piece]) => [key, svgDoc([0, 0, piece.w, piece.h], TILE, piece.body)]))
}
