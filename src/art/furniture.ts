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

// The new beds have no wall basin, but measured from their head tile they match the shampoo bed: a cushion under a
// lying customer's head, the frame ending where the blanket does, and the same front rail and legs.

// mask chair: a padded mint recliner on a wood base, its back raised at the head above the base, with a neck cushion and armrests
const maskBed =
  rect(0.05, 1.05, 1.0, 2.15, C.wood, `rx="0.12" ${ink()}`) +
  rect(0.14, 1.5, 0.82, 0.92, C.mintTeal, `rx="0.1" ${ink(FINE)}`) +
  rect(0.14, 2.46, 0.82, 0.66, C.mintTeal, `rx="0.1" ${ink(FINE)}`) +
  rect(0.02, 1.64, 0.16, 0.76, C.woodLight, `rx="0.07" ${ink(0.04)}`) +
  rect(0.92, 1.64, 0.16, 0.76, C.woodLight, `rx="0.07" ${ink(0.04)}`) +
  rect(0.14, 1.5, 0.82, 0.18, C.ink, 'opacity="0.15"') +
  rect(0.08, 0.1, 0.94, 1.46, C.mintTeal, `rx="0.2" ${ink()}`) +
  rect(0.17, 0.17, 0.76, 0.12, C.mint, 'rx="0.06"') +
  `<path d="M0.42,0.8 V1.44 M0.68,0.8 V1.44" stroke="${C.tealLight}" stroke-width="${FINE}" stroke-linecap="round"/>` +
  rect(0.22, 0.36, 0.66, 0.34, C.cream, `rx="0.15" ${ink(FINE)}`) +
  rect(0.05, 3.13, 1.0, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.1, 3.27, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(0.88, 3.27, 0.12, 0.14, C.woodDark, ink(0.025))

// massage bed: a wood table under a cream sheet, with a padded face hole at the head and a rolled towel at the foot
const massageBed =
  rect(0.05, 0.05, 1.0, 2.85, C.wood, `rx="0.12" ${ink()}`) +
  rect(0.14, 0.11, 0.82, 2.72, C.cream, `rx="0.1" ${ink(FINE)}`) +
  `<path d="M0.18,2.66 H0.92" stroke="${C.tileSeam}" stroke-width="0.035"/>` +
  `<ellipse cx="0.55" cy="0.66" rx="0.3" ry="0.24" fill="${C.sand}" ${ink(FINE)}/>` +
  `<ellipse cx="0.55" cy="0.66" rx="0.15" ry="0.1" fill="${C.woodDark}" ${ink(FINE)}/>` +
  rect(0.2, 2.2, 0.7, 0.24, C.tealLight, `rx="0.12" ${ink(FINE)}`) +
  `<path d="M0.36,2.21 V2.43 M0.74,2.21 V2.43" stroke="${C.cream}" stroke-width="0.035"/>` +
  rect(0.05, 2.83, 1.0, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.1, 2.97, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(0.88, 2.97, 0.12, 0.14, C.woodDark, ink(0.025))

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
function lantern(x: number): string {
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
function bedSlot(x: number, y: number): string {
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
function benchMat(left: number, right: number, row: number): string {
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

// Gifts from the regulars

/** A wooden pole along `d`, outlined in ink. */
const stick = (d: string, fill: string, w = 0.05) =>
  `<path d="${d}" stroke="${C.ink}" stroke-width="${f(w + 0.045)}" stroke-linecap="round" fill="none"/>` +
  `<path d="${d}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`

// tranh của Vy: a wooden easel holding her small painting of a shop front with a red lantern under its awning
const vyPainting =
  stick('M0.5,0.14 L0.62,1.82', C.woodDark) +
  stick('M0.46,0.14 L0.16,1.84', C.wood) +
  stick('M0.54,0.14 L0.84,1.84', C.wood) +
  `<circle cx="0.5" cy="0.12" r="0.05" fill="${C.woodLight}" ${ink(0.025)}/>` +
  rect(0.12, 0.24, 0.76, 0.92, C.wood, `rx="0.03" ${ink()}`) +
  rect(0.18, 0.3, 0.64, 0.8, C.water, ink(FINE)) +
  rect(0.18, 0.94, 0.64, 0.16, C.sand) +
  rect(0.28, 0.6, 0.44, 0.38, C.wall, ink(0.02)) +
  rect(0.5, 0.72, 0.14, 0.26, C.teal, ink(0.02)) +
  `<path d="M0.22,0.62 L0.33,0.47 H0.67 L0.78,0.62Z" fill="${C.terracotta}" ${ink(0.02)}/>` +
  `<path d="M0.38,0.62 V0.7" stroke="${C.ink}" stroke-width="0.015"/>` +
  rect(0.355, 0.68, 0.05, 0.02, C.mustard) +
  `<ellipse cx="0.38" cy="0.75" rx="0.055" ry="0.06" fill="${C.lantern}" ${ink(0.015)}/>` +
  rect(0.355, 0.8, 0.05, 0.02, C.mustard) +
  `<path d="M0.18,1.1 H0.82" stroke="${C.ink}" stroke-width="${FINE}"/>` +
  rect(0.08, 1.12, 0.84, 0.08, C.woodLight, `rx="0.03" ${ink(FINE)}`)

/** A swallow on the wing, centred on (x, y): swept wings and a forked tail. */
const swallow = (x: number, y: number) =>
  `<path d="M${f(x - 0.16)},${f(y - 0.06)} Q${f(x - 0.06)},${f(y - 0.05)} ${x},${f(y + 0.02)} Q${f(x + 0.06)},${f(y - 0.05)} ${f(x + 0.16)},${f(y - 0.06)} ` +
  `Q${f(x + 0.08)},${f(y + 0.03)} ${f(x + 0.03)},${f(y + 0.06)} L${f(x + 0.07)},${f(y + 0.15)} L${x},${f(y + 0.09)} L${f(x - 0.07)},${f(y + 0.15)} ` +
  `L${f(x - 0.03)},${f(y + 0.06)} Q${f(x - 0.08)},${f(y + 0.03)} ${f(x - 0.16)},${f(y - 0.06)}Z" fill="${C.ink}"/>`

// bình phong lụa: two red-lacquer panels with gold trim, their cream silk painted with a lotus on the left and two swallows on the right
const silkScreen =
  [0.06, 1.02].map(x =>
    rect(f(x + 0.1), 1.5, 0.12, 0.2, C.lanternDark, ink(0.025)) +
    rect(f(x + 0.7), 1.5, 0.12, 0.2, C.lanternDark, ink(0.025)) +
    rect(x, 0.06, 0.92, 1.46, C.lanternDark, `rx="0.04" ${ink()}`) +
    rect(f(x + 0.05), 0.11, 0.82, 1.36, 'none', `rx="0.02" stroke="${C.mustard}" stroke-width="0.02"`) +
    rect(f(x + 0.09), 0.15, 0.74, 1.28, C.cream, ink(FINE)),
  ).join('') +
  rect(0.96, 0.36, 0.08, 0.1, C.mustard, ink(0.02)) +
  rect(0.96, 1.14, 0.08, 0.1, C.mustard, ink(0.02)) +
  `<path d="M0.5,1.38 Q0.44,1.1 0.52,0.86" stroke="${C.leaf}" stroke-width="0.03" fill="none"/>` +
  `<path d="M0.62,1.38 Q0.66,1.24 0.72,1.16" stroke="${C.leaf}" stroke-width="0.03" fill="none"/>` +
  `<ellipse cx="0.74" cy="1.12" rx="0.14" ry="0.07" fill="${C.leaf}" ${ink(0.015)}/>` +
  `<g ${ink(0.02)}>` +
  `<path d="M0.52,0.86 Q0.34,0.78 0.38,0.6 Q0.5,0.7 0.52,0.86Z M0.52,0.86 Q0.7,0.78 0.66,0.6 Q0.54,0.7 0.52,0.86Z" fill="${C.lotus}"/>` +
  `<path d="M0.52,0.86 Q0.44,0.66 0.52,0.48 Q0.6,0.66 0.52,0.86Z" fill="${C.lotusDark}"/></g>` +
  swallow(1.36, 0.42) +
  swallow(1.6, 0.74)

const PORTRAITS = [C.terracotta, C.mustard, C.cobalt, C.lotus, C.teal, C.lantern, C.leaf, C.woodLight]

// bảng ảnh khách quen: a brown wooden board on two feet, eight small photos of the regulars in cream frames, and a red ribbon across its top
const regularsBoard =
  rect(0.3, 1.36, 0.14, 0.32, C.woodDark, ink(0.025)) +
  rect(1.56, 1.36, 0.14, 0.32, C.woodDark, ink(0.025)) +
  rect(0.06, 0.18, 1.88, 1.22, C.wood, `rx="0.06" ${ink()}`) +
  rect(0.13, 0.25, 1.74, 1.08, 'none', `rx="0.04" stroke="${C.woodDark}" stroke-width="${FINE}"`) +
  PORTRAITS.map((shirt, i) => {
    const x = f(0.22 + (i % 4) * 0.42)
    const y = f(0.44 + Math.floor(i / 4) * 0.46)
    return (
      rect(x, y, 0.3, 0.36, C.cream, `rx="0.02" ${ink(FINE)}`) +
      `<path d="M${f(x + 0.06)},${f(y + 0.31)} Q${f(x + 0.15)},${f(y + 0.17)} ${f(x + 0.24)},${f(y + 0.31)}Z" fill="${shirt}" ${ink(0.012)}/>` +
      `<circle cx="${f(x + 0.15)}" cy="${f(y + 0.13)}" r="0.06" fill="${C.sand}" ${ink(0.012)}/>`
    )
  }).join('') +
  `<path d="M0.12,0.26 Q1,0.46 1.88,0.26" stroke="${C.ink}" stroke-width="0.09" fill="none" stroke-linecap="round"/>` +
  `<path d="M0.12,0.26 Q1,0.46 1.88,0.26" stroke="${C.lantern}" stroke-width="0.05" fill="none" stroke-linecap="round"/>` +
  `<g ${ink(0.025)}>` +
  `<path d="M0.97,0.34 L0.9,0.56 L0.95,0.53 L1,0.36Z M1.03,0.34 L1.1,0.56 L1.05,0.53 L1,0.36Z" fill="${C.lanternDark}"/>` +
  `<path d="M1,0.3 Q0.78,0.12 0.8,0.34 Q0.9,0.4 1,0.3Z M1,0.3 Q1.22,0.12 1.2,0.34 Q1.1,0.4 1,0.3Z" fill="${C.lantern}"/>` +
  `<circle cx="1" cy="0.32" r="0.05" fill="${C.lanternDark}"/></g>`

// Gifts from the VIPs

/** A head and shoulders in a `shirt`, centred at x 0.5 in a photo's cream ground. */
const bust = (shirt: string) =>
  `<path d="M0.22,1.12 Q0.24,0.84 0.5,0.8 Q0.76,0.84 0.78,1.12Z" fill="${shirt}" ${ink(0.02)}/>` +
  rect(0.46, 0.72, 0.08, 0.1, C.sand, ink(0.015)) +
  `<circle cx="0.5" cy="0.6" r="0.15" fill="${C.sand}" ${ink(0.02)}/>`

/** A signed photo: a gold frame on a small easel, `portrait` on its cream ground and an ink signature across the lower corner. */
const photo = (portrait: string) =>
  stick('M0.5,0.12 L0.58,1.68', C.woodDark) +
  stick('M0.46,0.12 L0.18,1.7', C.wood) +
  stick('M0.54,0.12 L0.82,1.7', C.wood) +
  rect(0.1, 0.14, 0.8, 1.08, C.mustard, `rx="0.03" ${ink()}`) +
  rect(0.17, 0.21, 0.66, 0.94, C.cream, `${ink(FINE)}`) +
  rect(0.1, 0.14, 0.8, 1.08, 'none', `rx="0.03" stroke="${C.mustardDark}" stroke-width="0.02"`) +
  portrait +
  `<path d="M0.55,1.07 Q0.6,0.97 0.63,1.06 Q0.67,1.12 0.7,1.02 Q0.74,0.98 0.78,1.06" stroke="${C.ink}" stroke-width="0.02" fill="none" stroke-linecap="round"/>`

// Mây Chiều: pink shirt, hair in a wave, a fluffy pink feather boa round her neck and a mic in her hand
const photoSinger =
  `<path d="M0.34,0.6 Q0.32,0.4 0.5,0.4 Q0.68,0.4 0.66,0.6 Q0.58,0.5 0.5,0.5 Q0.42,0.5 0.34,0.6Z" fill="${C.woodDark}" ${ink(0.02)}/>` +
  bust(C.lotus) +
  `<path d="M0.38,0.5 Q0.46,0.44 0.62,0.48 Q0.66,0.54 0.64,0.58 Q0.56,0.5 0.4,0.56Z" fill="${C.woodDark}" ${ink(0.015)}/>` +
  `<path d="M0.27,0.9 Q0.36,0.8 0.5,0.84 Q0.64,0.8 0.73,0.9" stroke="${C.ink}" stroke-width="0.12" stroke-linecap="round" fill="none"/>` +
  `<path d="M0.27,0.9 Q0.36,0.8 0.5,0.84 Q0.64,0.8 0.73,0.9" stroke="${C.lotusDark}" stroke-width="0.08" stroke-linecap="round" stroke-dasharray="0.05 0.03" fill="none"/>` +
  stick('M0.28,1.1 L0.4,0.78', C.ink, 0.03) +
  `<circle cx="0.41" cy="0.75" r="0.045" fill="${C.woodLight}" ${ink(0.02)}/>`

// Ngân Sa: a gold tiara on dark hair and a cream sash with red edges across her teal dress
const photoMiss =
  `<path d="M0.33,0.62 Q0.3,0.4 0.5,0.4 Q0.7,0.4 0.67,0.62 Q0.6,0.48 0.5,0.48 Q0.4,0.48 0.33,0.62Z" fill="${C.woodDark}" ${ink(0.02)}/>` +
  bust(C.teal) +
  `<path d="M0.27,0.9 L0.36,0.83 L0.78,1.12 H0.6Z" fill="${C.cream}" stroke="${C.lantern}" stroke-width="0.03" stroke-linejoin="round"/>` +
  `<path d="M0.38,0.47 L0.4,0.38 L0.45,0.44 L0.5,0.34 L0.55,0.44 L0.6,0.38 L0.62,0.47Z" fill="${C.mustard}" ${ink(0.02)}/>` +
  `<circle cx="0.5" cy="0.36" r="0.015" fill="${C.lantern}"/>`

// Bích Câu: big dark round glasses and a mustard headscarf knotted at the side, in a cobalt blouse
const photoStar =
  bust(C.cobalt) +
  `<path d="M0.34,0.58 Q0.34,0.4 0.5,0.4 Q0.66,0.4 0.66,0.58 Q0.5,0.5 0.34,0.58Z" fill="${C.mustard}" ${ink(0.02)}/>` +
  `<path d="M0.64,0.5 L0.74,0.44 L0.72,0.56 L0.62,0.54Z" fill="${C.mustard}" ${ink(0.02)}/>` +
  `<circle cx="0.43" cy="0.62" r="0.07" fill="${C.ink}"/>` +
  `<circle cx="0.57" cy="0.62" r="0.07" fill="${C.ink}"/>` +
  `<path d="M0.46,0.62 H0.54" stroke="${C.ink}" stroke-width="0.02"/>` +
  `<path d="M0.4,0.6 L0.42,0.59" stroke="${C.cream}" stroke-width="0.015" stroke-linecap="round"/>` +
  `<path d="M0.54,0.6 L0.56,0.59" stroke="${C.cream}" stroke-width="0.015" stroke-linecap="round"/>`

// Tám Lửa: a tall white chef's hat over a round face, in a terracotta jacket
const photoChef =
  bust(C.terracotta) +
  rect(0.4, 0.42, 0.2, 0.1, '#fff', `rx="0.01" ${ink(0.02)}`) +
  `<path d="M0.4,0.44 Q0.3,0.3 0.38,0.26 Q0.4,0.18 0.5,0.22 Q0.6,0.18 0.62,0.26 Q0.7,0.3 0.6,0.44Z" fill="#fff" ${ink(0.02)}/>` +
  `<path d="M0.46,0.3 V0.42 M0.54,0.3 V0.42" stroke="${C.sand}" stroke-width="0.015"/>`

// bảng vàng: a red-lacquer board with a gold border on two feet, four small gold frames in a row and a gold star on top
const goldBoard =
  rect(0.3, 1.38, 0.14, 0.32, C.woodDark, ink(0.025)) +
  rect(1.56, 1.38, 0.14, 0.32, C.woodDark, ink(0.025)) +
  rect(0.06, 0.4, 1.88, 1.04, C.lanternDark, `rx="0.05" ${ink()}`) +
  rect(0.13, 0.47, 1.74, 0.9, 'none', `rx="0.03" stroke="${C.mustard}" stroke-width="0.03"`) +
  [C.lotus, C.teal, C.cobalt, C.terracotta].map((shirt, i) => {
    const x = f(0.24 + i * 0.4)
    return (
      rect(x, 0.62, 0.32, 0.58, C.mustard, `rx="0.02" ${ink(0.025)}`) +
      rect(f(x + 0.04), 0.66, 0.24, 0.5, C.cream, ink(0.012)) +
      `<path d="M${f(x + 0.07)},${f(1.14)} Q${f(x + 0.16)},0.98 ${f(x + 0.25)},1.14Z" fill="${shirt}" ${ink(0.012)}/>` +
      `<circle cx="${f(x + 0.16)}" cy="0.88" r="0.06" fill="${C.sand}" ${ink(0.012)}/>`
    )
  }).join('') +
  `<path d="M1,0.04 L1.07,0.2 L1.25,0.22 L1.11,0.33 L1.16,0.5 L1,0.4 L0.84,0.5 L0.89,0.33 L0.75,0.22 L0.93,0.2Z" fill="${C.mustard}" ${ink(0.025)}/>`

// lều xông: a round cream-and-terracotta striped tent seen from above at three-quarters, a wedge per stripe up to a mustard knob
const TENT_APEX: [number, number] = [1, 0.8]
const TENT_BASE = { cx: 1, cy: 1.75, rx: 0.92, ry: 0.72 }
const tentEdge = (i: number, n: number): [number, number] => {
  const a = (i / n) * Math.PI * 2 + Math.PI / n
  return [f(TENT_BASE.cx + TENT_BASE.rx * Math.sin(a)), f(TENT_BASE.cy + TENT_BASE.ry * Math.cos(a))]
}
const tentWedges = Array.from({ length: 10 }, (_, i) => {
  const [x0, y0] = tentEdge(i, 10)
  const [x1, y1] = tentEdge(i + 1, 10)
  return `<path d="M${TENT_APEX[0]},${TENT_APEX[1]} L${x0},${y0} A${TENT_BASE.rx},${TENT_BASE.ry} 0 0 0 ${x1},${y1}Z" fill="${i % 2 ? C.terracotta : C.cream}" ${ink(FINE)}/>`
}).join('')
const steamTent =
  `<ellipse cx="1" cy="2.3" rx="0.95" ry="0.26" fill="${C.ink}" opacity="0.15"/>` +
  `<ellipse cx="${TENT_BASE.cx}" cy="${TENT_BASE.cy}" rx="${TENT_BASE.rx}" ry="${TENT_BASE.ry}" fill="${C.cream}" ${ink()}/>` +
  tentWedges +
  `<path d="M${TENT_APEX[0]},${TENT_APEX[1]} L${f(TENT_BASE.cx - TENT_BASE.rx)},${TENT_BASE.cy} A${TENT_BASE.rx},${TENT_BASE.ry} 0 0 0 ${f(TENT_BASE.cx + TENT_BASE.rx)},${TENT_BASE.cy}Z" fill="none" ${ink()}/>` +
  `<path d="M0.45,2.18 Q1,2.55 1.55,2.18" fill="none" stroke="${C.ink}" stroke-opacity="0.3" stroke-width="0.04" stroke-linecap="round"/>` +
  `<circle cx="${TENT_APEX[0]}" cy="${TENT_APEX[1] - 0.03}" r="0.11" fill="${C.mustard}" ${ink(0.04)}/>`

/** Furniture sizes in tiles; RoomView anchors each piece at the bottom-centre of the tiles it stands on, and the room parts at the end by their top-left. */
export const FURNITURE: Record<string, { w: number; h: number; body: string }> = {
  bed: { w: 1.1, h: 3.7, body: bed },
  maskBed: { w: 1.1, h: 3.45, body: maskBed },
  massageBed: { w: 1.1, h: 3.15, body: massageBed },
  bench: { w: 3.2, h: 1.35, body: bench },
  desk: { w: 3, h: 1.45, body: desk },
  plant: { w: 1, h: 1.6, body: plant },
  'decor-screen': { w: 5, h: 1.3, body: screen },
  'decor-cabinet': { w: 3, h: 1.5, body: cabinet },
  'decor-shelf': { w: 3, h: 1.3, body: shelf },
  'decor-lotus': { w: 2, h: 1.1, body: lotus },
  'decor-vase': { w: 1, h: 1.9, body: vase },
  'decor-vyPainting': { w: 1, h: 1.9, body: vyPainting },
  'decor-silkScreen': { w: 2, h: 1.75, body: silkScreen },
  'decor-regularsBoard': { w: 2, h: 1.7, body: regularsBoard },
  'decor-photoSinger': { w: 1, h: 1.7, body: photo(photoSinger) },
  'decor-photoMiss': { w: 1, h: 1.7, body: photo(photoMiss) },
  'decor-photoStar': { w: 1, h: 1.7, body: photo(photoStar) },
  'decor-photoChef': { w: 1, h: 1.7, body: photo(photoChef) },
  'decor-goldBoard': { w: 2, h: 1.75, body: goldBoard },
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
  steamTent: { w: 2, h: 2.6, body: steamTent },
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
