import { TILE } from '../config'
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

/** Furniture sizes in tiles; RoomView anchors each at the bottom-centre of its run. */
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
}

export function furnitureTextures(): Record<string, string> {
  return Object.fromEntries(Object.entries(FURNITURE).map(([key, f]) => [key, svgDoc([0, 0, f.w, f.h], TILE, f.body)]))
}
