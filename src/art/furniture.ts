import { TILE } from '../config'
import { canTurn, type ItemKind } from '../sim/items'
import { silkLantern } from './lantern'
import { NEW_DECOR } from './newDecor'
import { C, SKIN } from './palette'
import { svgDoc } from './svg'

const LINE = 0.05
const FINE = 0.03
const ink = (w = LINE) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`
/** Rounds a computed coordinate so the SVG stays short. */
const f = (v: number) => +v.toFixed(3)

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

// shampoo bed lying across: a basin of water standing on two legs at the head on the left, the bed on its wood frame with a cushion under the head and the folded towel at the foot
const bedTurned =
  rect(0.45, 0.35, 2.6, 0.85, C.wood, `rx="0.12" ${ink()}`) +
  rect(0.53, 0.41, 2.44, 0.75, C.tealLight, `rx="0.1" ${ink(FINE)}`) +
  rect(0.58, 0.48, 0.3, 0.62, C.cream, `rx="0.12" ${ink(FINE)}`) +
  rect(2.5, 0.53, 0.36, 0.5, C.terracotta, `rx="0.04" ${ink(FINE)}`) +
  `<path d="M2.65,0.53 V1.03" stroke="${C.cream}" stroke-width="0.045"/>` +
  rect(0.45, 1.13, 2.6, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.62, 1.27, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(2.88, 1.27, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(0.13, 0.6, 0.08, 0.81, C.woodDark, ink(0.025)) +
  rect(0.43, 0.6, 0.08, 0.81, C.woodDark, ink(0.025)) +
  `<path d="M0.05,0.4 Q0.07,0.76 0.32,0.78 Q0.57,0.76 0.59,0.4Z" fill="${C.cream}" ${ink()}/>` +
  `<path d="M0.08,0.62 Q0.32,0.7 0.56,0.62" stroke="${C.cobalt}" stroke-width="0.05" fill="none"/>` +
  `<ellipse cx="0.32" cy="0.4" rx="0.27" ry="0.15" fill="${C.cream}" ${ink()}/>` +
  `<ellipse cx="0.32" cy="0.41" rx="0.2" ry="0.09" fill="${C.water}" ${ink(FINE)}/>` +
  rect(0.27, 0.18, 0.1, 0.12, C.mustard, `rx="0.03" ${ink(0.025)}`)

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

// mask chair lying across: the mint recliner on its wood base, its back raised at the head on the left with the neck cushion, and the armrests along both sides of the seat
const maskBedTurned =
  rect(0.3, 0.35, 2.75, 0.85, C.wood, `rx="0.12" ${ink()}`) +
  rect(1.16, 0.44, 0.88, 0.7, C.mintTeal, `rx="0.1" ${ink(FINE)}`) +
  rect(2.08, 0.44, 0.88, 0.7, C.mintTeal, `rx="0.1" ${ink(FINE)}`) +
  rect(1.3, 0.32, 0.74, 0.16, C.woodLight, `rx="0.07" ${ink(0.04)}`) +
  rect(1.3, 1.0, 0.74, 0.16, C.woodLight, `rx="0.07" ${ink(0.04)}`) +
  rect(1.16, 0.44, 0.18, 0.7, C.ink, 'opacity="0.15"') +
  `<path d="M0.08,1.15 V0.3 Q0.08,0.06 0.32,0.06 L0.98,0.2 Q1.22,0.26 1.22,0.48 V1.15Z" fill="${C.mintTeal}" ${ink()}/>` +
  rect(0.15, 0.28, 0.1, 0.76, C.mint, 'rx="0.05"') +
  `<path d="M0.64,0.6 H1.16 M0.64,0.86 H1.16" stroke="${C.tealLight}" stroke-width="${FINE}" stroke-linecap="round"/>` +
  rect(0.3, 0.36, 0.34, 0.66, C.cream, `rx="0.15" ${ink(FINE)}`) +
  rect(0.05, 1.13, 3.0, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.1, 1.27, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(2.88, 1.27, 0.12, 0.14, C.woodDark, ink(0.025))

// massage bed: a wood table under a cream sheet, with a padded face hole at the head and a rolled towel at the foot
const faceHole =
  `<ellipse cx="0.55" cy="0.66" rx="0.3" ry="0.24" fill="${C.sand}" ${ink(FINE)}/>` +
  `<ellipse cx="0.55" cy="0.66" rx="0.15" ry="0.1" fill="${C.woodDark}" ${ink(FINE)}/>`
const massageBed =
  rect(0.05, 0.05, 1.0, 2.85, C.wood, `rx="0.12" ${ink()}`) +
  rect(0.14, 0.11, 0.82, 2.72, C.cream, `rx="0.1" ${ink(FINE)}`) +
  `<path d="M0.18,2.66 H0.92" stroke="${C.tileSeam}" stroke-width="0.035"/>` +
  faceHole +
  rect(0.2, 2.2, 0.7, 0.24, C.tealLight, `rx="0.12" ${ink(FINE)}`) +
  `<path d="M0.36,2.21 V2.43 M0.74,2.21 V2.43" stroke="${C.cream}" stroke-width="0.035"/>` +
  rect(0.05, 2.83, 1.0, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.1, 2.97, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(0.88, 2.97, 0.12, 0.14, C.woodDark, ink(0.025))

// massage bed lying across: the cream sheet along the table, the face hole at the head on the left, the rolled towel at the foot, and the front rail and legs along its near side
const massageBedTurned =
  rect(0.05, 0.05, 3.0, 0.85, C.wood, `rx="0.12" ${ink()}`) +
  rect(0.14, 0.11, 2.82, 0.75, C.cream, `rx="0.1" ${ink(FINE)}`) +
  `<path d="M2.66,0.15 V0.83" stroke="${C.tileSeam}" stroke-width="0.035"/>` +
  `<g transform="translate(0.11 -0.19)">${faceHole}</g>` +
  rect(2.2, 0.17, 0.24, 0.6, C.tealLight, `rx="0.12" ${ink(FINE)}`) +
  `<path d="M2.21,0.31 H2.43 M2.21,0.63 H2.43" stroke="${C.cream}" stroke-width="0.035"/>` +
  rect(0.05, 0.83, 3.0, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.1, 0.97, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(2.88, 0.97, 0.12, 0.14, C.woodDark, ink(0.025))

// stone bed: the massage bed with a column of four dark stones down the sheet, the second and fourth glowing warm round the rim
const STONE = C.stone
const STONE_YS = [1.12, 1.4, 1.68, 1.96]
const stoneBed =
  massageBed +
  STONE_YS.filter((_, i) => i % 2).map(y => `<ellipse cx="0.55" cy="${y}" rx="0.185" ry="0.15" fill="${C.mustard}"/>`).join('') +
  STONE_YS.map(y => `<ellipse cx="0.55" cy="${y}" rx="0.15" ry="0.115" fill="${STONE}" ${ink(FINE)}/>`).join('')

// stone bed lying across: the massage bed lying across with the four stones in a row along the sheet, the second and fourth glowing warm
const stoneBedTurned =
  massageBedTurned +
  STONE_YS.filter((_, i) => i % 2).map(x => `<ellipse cx="${x}" cy="0.47" rx="0.185" ry="0.15" fill="${C.mustard}"/>`).join('') +
  STONE_YS.map(x => `<ellipse cx="${x}" cy="0.47" rx="0.14" ry="0.115" fill="${STONE}" ${ink(FINE)}/>`).join('')

// mud tub: a round wooden tub at three-quarters, its staves showing below the rim, full of mud, with a towel to rest the head on
const tubStave = (x: number, bottom: number) => `<path d="M${x},2.84 V${bottom}" stroke="${C.woodDark}" stroke-width="0.035"/>`
const mudTub =
  rect(0.06, 0.5, 1.88, 2.58, C.wood, `rx="0.6" ${ink()}`) +
  tubStave(0.4, 3.0) + tubStave(0.7, 3.05) + tubStave(1, 3.06) + tubStave(1.3, 3.05) + tubStave(1.6, 3.0) +
  rect(0.06, 0.1, 1.88, 2.72, C.woodLight, `rx="0.6" ${ink()}`) +
  `<path d="M0.06,0.9 H0.3 M0.06,1.45 H0.3 M0.06,2 H0.3 M1.7,0.9 H1.94 M1.7,1.45 H1.94 M1.7,2 H1.94 M0.7,2.6 V2.82 M1,2.6 V2.82 M1.3,2.6 V2.82" ` +
  `stroke="${C.woodDark}" stroke-width="0.035"/>` +
  rect(0.3, 0.32, 1.4, 2.28, C.clay, `rx="0.45" ${ink(FINE)}`) +
  `<path d="M0.42,1.1 Q0.42,0.72 0.58,0.58" stroke="${C.clayLight}" stroke-width="0.035" fill="none" stroke-linecap="round" opacity="0.7"/>` +
  `<circle cx="0.72" cy="1.25" r="0.09" fill="${C.clayLight}" ${ink(0.02)}/>` +
  `<circle cx="1.28" cy="1.8" r="0.07" fill="${C.clayLight}" ${ink(0.02)}/>` +
  `<circle cx="0.84" cy="2.3" r="0.11" fill="${C.clayLight}" ${ink(0.02)}/>` +
  rect(0.6, 0.2, 0.8, 0.32, C.paper, `rx="0.14" ${ink(FINE)}`)

// mud tub lying across: the round tub three tiles long and two deep, its staves showing below the near rim, full of mud, with the head towel at the left
const mudTubTurned =
  rect(0.06, 0.36, 2.88, 1.72, C.wood, `rx="0.6" ${ink()}`) +
  `<g transform="translate(0 -1)">${[[0.5, 3.0], [0.9, 3.04], [1.3, 3.06], [1.7, 3.06], [2.1, 3.04], [2.5, 3.0]].map(([x, bottom]) => tubStave(x, bottom)).join('')}</g>` +
  rect(0.06, 0.1, 2.88, 1.72, C.woodLight, `rx="0.6" ${ink()}`) +
  `<path d="M0.9,0.1 V0.32 M1.5,0.1 V0.32 M2.1,0.1 V0.32 M0.9,1.6 V1.82 M1.5,1.6 V1.82 M2.1,1.6 V1.82 M2.7,0.66 H2.94 M2.7,0.96 H2.94 M2.7,1.26 H2.94" ` +
  `stroke="${C.woodDark}" stroke-width="0.035"/>` +
  rect(0.3, 0.32, 2.4, 1.28, C.clay, `rx="0.45" ${ink(FINE)}`) +
  `<path d="M0.66,0.6 Q0.7,0.44 1.1,0.43" stroke="${C.clayLight}" stroke-width="0.035" fill="none" stroke-linecap="round" opacity="0.7"/>` +
  `<circle cx="1.3" cy="1.22" r="0.09" fill="${C.clayLight}" ${ink(0.02)}/>` +
  `<circle cx="1.86" cy="0.7" r="0.07" fill="${C.clayLight}" ${ink(0.02)}/>` +
  `<circle cx="2.32" cy="1.14" r="0.11" fill="${C.clayLight}" ${ink(0.02)}/>` +
  rect(0.2, 0.68, 0.32, 0.8, C.paper, `rx="0.14" ${ink(FINE)}`)

// salt bed: a massage-style bed in sea colours, with the face cradle at the head and a bowl of salt at the foot
const waveRow = (y: number) => `M0.2,${y} q0.085,-0.07 0.17,0 t0.17,0 t0.17,0 t0.17,0`
const saltBowl =
  `<ellipse cx="0.82" cy="2.86" rx="0.2" ry="0.12" fill="${C.cobalt}" ${ink(FINE)}/>` +
  `<path d="M0.66,2.84 Q0.82,2.7 0.98,2.84Z" fill="${C.cream}" ${ink(0.02)}/>`
const scrubBed =
  rect(0.05, 0.05, 1.0, 2.85, C.wood, `rx="0.12" ${ink()}`) +
  rect(0.14, 0.11, 0.82, 2.72, C.scrubSheet, `rx="0.1" ${ink(FINE)}`) +
  `<path d="${waveRow(1.25)} ${waveRow(1.95)}" stroke="${C.sea}" stroke-width="0.035" fill="none"/>` +
  faceHole +
  rect(0.2, 2.2, 0.7, 0.24, C.sea, `rx="0.12" ${ink(FINE)}`) +
  `<path d="M0.36,2.21 V2.43 M0.74,2.21 V2.43" stroke="${C.cream}" stroke-width="0.035"/>` +
  rect(0.05, 2.83, 1.0, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.1, 2.97, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(0.88, 2.97, 0.12, 0.14, C.woodDark, ink(0.025)) +
  saltBowl

// salt bed lying across: the sea-coloured sheet with its waves running across it, the face cradle at the head on the left and the bowl of salt at the foot
const waveCol = (x: number) => `M${x},0.13 q-0.07,0.085 0,0.17 t0,0.17 t0,0.17 t0,0.17`
const scrubBedTurned =
  rect(0.05, 0.05, 3.0, 0.85, C.wood, `rx="0.12" ${ink()}`) +
  rect(0.14, 0.11, 2.82, 0.75, C.scrubSheet, `rx="0.1" ${ink(FINE)}`) +
  `<path d="${waveCol(1.25)} ${waveCol(1.95)}" stroke="${C.sea}" stroke-width="0.035" fill="none"/>` +
  `<g transform="translate(0.11 -0.19)">${faceHole}</g>` +
  rect(2.2, 0.17, 0.24, 0.6, C.sea, `rx="0.12" ${ink(FINE)}`) +
  `<path d="M2.21,0.31 H2.43 M2.21,0.63 H2.43" stroke="${C.cream}" stroke-width="0.035"/>` +
  rect(0.05, 0.83, 3.0, 0.17, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  rect(0.1, 0.97, 0.12, 0.14, C.woodDark, ink(0.025)) +
  rect(2.88, 0.97, 0.12, 0.14, C.woodDark, ink(0.025)) +
  `<g transform="translate(2 -2)">${saltBowl}</g>`

// foot chair: a padded wooden armchair with teal cushions, a basin of herb water in front of it with two leaves and a lotus petal
const footBasin =
  `<ellipse cx="0.55" cy="1.74" rx="0.5" ry="0.4" fill="${C.wood}" ${ink()}/>` +
  `<path d="M0.08,1.82 Q0.55,2.06 1.02,1.82" stroke="${C.woodDark}" stroke-width="${FINE}" fill="none"/>` +
  `<ellipse cx="0.55" cy="1.64" rx="0.4" ry="0.26" fill="${C.herb}" ${ink(FINE)}/>` +
  `<ellipse cx="0.42" cy="1.6" rx="0.08" ry="0.035" fill="${C.leaf}" transform="rotate(-25 0.42 1.6)" ${ink(0.015)}/>` +
  `<ellipse cx="0.7" cy="1.7" rx="0.08" ry="0.035" fill="${C.leafLight}" transform="rotate(20 0.7 1.7)" ${ink(0.015)}/>` +
  `<circle cx="0.6" cy="1.55" r="0.035" fill="${C.lotus}"/>`
const footChair =
  rect(0.1, 0.05, 0.9, 0.62, C.wood, `rx="0.22" ${ink()}`) +
  rect(0.18, 0.12, 0.74, 0.46, C.tealLight, `rx="0.16" ${ink(FINE)}`) +
  rect(0.06, 0.5, 0.98, 0.66, C.wood, `rx="0.14" ${ink()}`) +
  rect(0.16, 0.56, 0.78, 0.5, C.teal, `rx="0.12" ${ink(FINE)}`) +
  rect(0.02, 0.4, 0.16, 0.74, C.woodDark, `rx="0.08" ${ink(FINE)}`) +
  rect(0.92, 0.4, 0.16, 0.74, C.woodDark, `rx="0.08" ${ink(FINE)}`) +
  footBasin

// foot chair lying across: the armchair seen from its side on the left tile, its back at the left and its seat facing right, and the basin of herb water on the right tile
const footChairTurned =
  rect(0.16, 1.0, 0.12, 0.16, C.woodDark, ink(0.025)) +
  rect(0.84, 1.0, 0.12, 0.16, C.woodDark, ink(0.025)) +
  rect(0.1, 0.6, 0.92, 0.44, C.wood, `rx="0.14" ${ink()}`) +
  rect(0.3, 0.65, 0.66, 0.22, C.teal, `rx="0.1" ${ink(FINE)}`) +
  rect(0.06, 0.05, 0.32, 0.99, C.wood, `rx="0.14" ${ink()}`) +
  rect(0.24, 0.13, 0.12, 0.76, C.tealLight, `rx="0.06" ${ink(FINE)}`) +
  rect(0.28, 0.44, 0.76, 0.16, C.woodDark, `rx="0.08" ${ink(FINE)}`) +
  `<g transform="translate(1 -1)">${footBasin}</g>`

// nail desk: in the lower rows a low table with a hand cushion, a lamp and three bottles, and behind it, over the right-hand column, the customer's padded stool
const nailBottle = ([x, c]: [number, string]) =>
  `<rect x="${x - 0.055}" y="1.52" width="0.11" height="0.17" rx="0.035" fill="${c}" ${ink(0.022)}/>` +
  `<rect x="${x - 0.03}" y="1.42" width="0.06" height="0.11" fill="${C.deepBrown}" ${ink(0.018)}/>`
const nailBottles = (
  [
    [1.55, C.lantern],
    [1.71, C.teal],
    [1.87, C.mustard],
  ] as [number, string][]
)
  .map(nailBottle)
  .join('')
const nailStool =
  rect(1.2, 0.62, 0.1, 0.36, C.woodDark, ink(0.025)) +
  rect(1.7, 0.62, 0.1, 0.36, C.woodDark, ink(0.025)) +
  rect(1.1, 0.14, 0.8, 0.56, C.woodLight, `rx="0.2" ${ink()}`) +
  rect(1.2, 0.22, 0.6, 0.4, C.pinkPale, `rx="0.16" ${ink(FINE)}`)
const nailLamp =
  `<ellipse cx="0.3" cy="1.66" rx="0.13" ry="0.07" fill="${C.cream}" ${ink(0.025)}/>` +
  `<path d="M0.3,1.64 L0.38,1.42" stroke="${C.ink}" stroke-width="0.035"/>` +
  `<ellipse cx="0.42" cy="1.4" rx="0.15" ry="0.08" fill="${C.mustard}" ${ink(0.025)}/>`
const nailDesk =
  nailStool +
  rect(0.2, 2.0, 0.1, 0.4, C.woodDark, ink(0.025)) +
  rect(1.8, 2.0, 0.1, 0.4, C.woodDark, ink(0.025)) +
  rect(0.05, 1.3, 2, 0.82, C.woodLight, `rx="0.1" ${ink()}`) +
  rect(0.05, 2.0, 2, 0.18, C.wood, `rx="0.06" ${ink(0.04)}`) +
  rect(0.72, 1.48, 0.66, 0.32, C.pinkPale, `rx="0.16" ${ink(FINE)}`) +
  `<path d="M0.82,1.64 H1.28" stroke="${C.lotusDark}" stroke-width="0.025" stroke-dasharray="0.06 0.05"/>` +
  nailBottles +
  nailLamp

// nail desk lying across: the customer's padded stool on the left tile's top row, and over the right-hand column the low table running up the floor with the hand cushion near its far end, the lamp and three bottles
const nailDeskTurned =
  `<g transform="translate(-1 0)">${nailStool}</g>` +
  rect(1.2, 2.0, 0.1, 0.4, C.woodDark, ink(0.025)) +
  rect(1.84, 2.0, 0.1, 0.4, C.woodDark, ink(0.025)) +
  rect(1.92, 0.56, 0.15, 1.6, C.wood, `rx="0.05" ${ink(0.04)}`) +
  rect(1.1, 0.48, 0.9, 1.64, C.woodLight, `rx="0.1" ${ink()}`) +
  rect(1.1, 2.0, 0.9, 0.18, C.wood, `rx="0.06" ${ink(0.04)}`) +
  rect(1.39, 0.66, 0.32, 0.62, C.pinkPale, `rx="0.16" ${ink(FINE)}`) +
  `<path d="M1.55,0.76 V1.18" stroke="${C.lotusDark}" stroke-width="0.025" stroke-dasharray="0.06 0.05"/>` +
  `<g transform="translate(-0.32 0.3)">${nailBottles}</g>` +
  `<g transform="translate(1.42 0.02)">${nailLamp}</g>`

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

// bench turned: its back down the left, the three cushions down the woven seat, its seat rail down the right and its arms across both ends
const benchTurned =
  WEAVE +
  rect(0.22, 3.08, 0.1, 0.22, C.woodDark, ink(0.025)) +
  rect(0.8, 3.08, 0.1, 0.22, C.woodDark, ink(0.025)) +
  rect(0.24, 0.2, 0.74, 2.8, 'url(#weave)', `rx="0.1" ${ink()}`) +
  [0, 1, 2].map(i => rect(0.34, f(0.3 + i * 0.9), 0.54, 0.78, C.terracotta, `rx="0.14" ${ink(FINE)}`)).join('') +
  rect(0.88, 0.16, 0.16, 2.9, C.wood, `rx="0.06" ${ink(0.04)}`) +
  rect(0.05, 0.05, 0.26, 3.0, C.wood, `rx="0.08" ${ink()}`) +
  `<path d="M0.18,0.2 V2.9" stroke="${C.woodDark}" stroke-width="${FINE}"/>` +
  rect(0.03, 0.03, 1.04, 0.18, C.woodDark, `rx="0.08" ${ink(0.04)}`) +
  rect(0.03, 2.93, 1.04, 0.18, C.woodDark, `rx="0.08" ${ink(0.04)}`)

// the counter's lotus vase, appointment book and brass bell, where they stand on the lying desk
const deskVase =
  `<g ${ink(FINE)}>` +
  `<path d="M0.45,0.39 Q0.27,0.3 0.33,0.15 Q0.45,0.26 0.45,0.39Z M0.45,0.39 Q0.63,0.3 0.57,0.15 Q0.45,0.26 0.45,0.39Z" fill="${C.lotus}"/>` +
  `<path d="M0.45,0.39 Q0.38,0.22 0.45,0.06 Q0.52,0.22 0.45,0.39Z" fill="${C.lotusDark}"/>` +
  `<path d="M0.33,0.64 Q0.29,0.48 0.37,0.39 H0.53 Q0.61,0.48 0.57,0.64Z" fill="${C.cream}"/></g>` +
  `<path d="M0.32,0.53 H0.58" stroke="${C.cobalt}" stroke-width="0.035"/>`
const deskBook =
  rect(1.15, 0.42, 0.62, 0.32, C.cream, `rx="0.03" ${ink(FINE)}`) +
  `<path d="M1.23,0.53 H1.68 M1.23,0.63 H1.6" stroke="${C.terracotta}" stroke-width="0.025"/>`
const deskBell =
  `<path d="M2.27,0.64 A0.18,0.18 0 0 1 2.63,0.64Z" fill="${C.mustard}" ${ink(FINE)}/>` +
  rect(2.22, 0.62, 0.46, 0.07, C.mustardDark, `rx="0.03" ${ink(0.025)}`) +
  `<circle cx="2.45" cy="0.42" r="0.04" fill="${C.mustardDark}" ${ink(0.02)}/>`

// counter with a lotus vase, the appointment book and a brass bell; things on top rise above the counter
const desk =
  rect(0.05, 0.3, 2.9, 0.5, C.wood, `rx="0.1" ${ink()}`) +
  `<path d="M0.15,0.42 H2.85" stroke="${C.woodLight}" stroke-width="0.045" stroke-linecap="round"/>` +
  rect(0.1, 0.74, 2.8, 0.66, C.woodDark, `rx="0.08" ${ink()}`) +
  [0, 1, 2].map(i => rect(0.25 + i * 0.9, 0.86, 0.7, 0.42, 'none', `rx="0.06" stroke="${C.wood}" stroke-width="0.035"`)).join('') +
  deskVase +
  `<g transform="rotate(-5 1.46 0.58)">${deskBook}</g>` +
  deskBell

// desk turned: the counter top running up with the vase at the far end, the book and the bell, its plain end to the front and its panelled front over the right rim
const deskTurned =
  rect(0.84, 0.6, 0.19, 2.78, C.woodDark, `rx="0.06" ${ink(0.04)}`) +
  `<path d="M0.97,0.8 V1.5 M0.97,1.7 V2.4 M0.97,2.6 V3.2" stroke="${C.wood}" stroke-width="0.035" stroke-linecap="round"/>` +
  rect(0.05, 0.3, 0.88, 2.48, C.wood, `rx="0.1" ${ink()}`) +
  `<path d="M0.17,0.42 V2.66" stroke="${C.woodLight}" stroke-width="0.045" stroke-linecap="round"/>` +
  rect(0.09, 2.72, 0.8, 0.66, C.woodDark, `rx="0.08" ${ink()}`) +
  rect(0.2, 2.84, 0.58, 0.42, 'none', `rx="0.06" stroke="${C.wood}" stroke-width="0.035"`) +
  `<g transform="translate(0.04 0.24)">${deskVase}</g>` +
  `<g transform="translate(-0.97 1.02) rotate(84 1.46 0.58)">${deskBook}</g>` +
  `<g transform="translate(-1.96 1.76)">${deskBell}</g>`

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

// rattan screen turned: its top rail running up from the far post with the posts' tops at the thirds, a sliver of weave over the right rim and the near post to the front
const screenTurned =
  WEAVE +
  rect(0.55, 0.22, 0.3, 4.9, 'url(#weave)', ink(FINE)) +
  rect(0.8, 0.22, 0.07, 4.9, C.woodDark, ink(0.025)) +
  [1.48, 2.82].map(y => rect(0.55, y, 0.32, 0.12, C.wood, ink(FINE))).join('') +
  rect(0.4, 0.12, 0.17, 4.05, C.woodDark, `rx="0.05" ${ink(0.04)}`) +
  [1.46, 2.8].map(y => rect(0.39, y, 0.19, 0.16, C.wood, ink(FINE))).join('') +
  rect(0.38, 0.04, 0.21, 0.2, C.wood, `rx="0.05" ${ink(0.04)}`) +
  rect(0.38, 4.05, 0.21, 1.2, C.wood, `rx="0.05" ${ink(0.04)}`)

const TOWELS = [C.cream, C.tealLight, C.cream, C.terracotta]
const cabinet =
  rect(0.05, 0.05, 2.9, 0.42, C.woodLight, `rx="0.06" ${ink()}`) +
  TOWELS.map((fill, i) => rect(0.2 + i * 0.66, 0.12, 0.5, 0.26, fill, `rx="0.13" ${ink(FINE)}`)).join('') +
  `<path d="M0.38,0.13 V0.37 M1.7,0.13 V0.37" stroke="${C.terracotta}" stroke-width="0.035"/>` +
  rect(0.1, 0.45, 2.8, 1.0, C.wood, `rx="0.06" ${ink()}`) +
  rect(0.22, 0.57, 1.22, 0.76, 'none', `rx="0.04" stroke="${C.woodDark}" stroke-width="0.035"`) +
  rect(1.56, 0.57, 1.22, 0.76, 'none', `rx="0.04" stroke="${C.woodDark}" stroke-width="0.035"`) +
  `<circle cx="1.38" cy="0.95" r="0.05" fill="${C.mustard}" ${ink(0.02)}/><circle cx="1.62" cy="0.95" r="0.05" fill="${C.mustard}" ${ink(0.02)}/>`

// cabinet turned: towels rolled across its top, its plain end to the front, and its doors' edge with the two knobs over the right rim
const cabinetTurned =
  rect(0.84, 0.12, 0.19, 3.32, C.wood, `rx="0.05" ${ink()}`) +
  `<path d="M0.96,0.5 V1.62 M0.96,1.9 V3.1" stroke="${C.woodDark}" stroke-width="0.035"/>` +
  `<circle cx="0.99" cy="1.68" r="0.05" fill="${C.mustard}" ${ink(0.02)}/><circle cx="0.99" cy="1.84" r="0.05" fill="${C.mustard}" ${ink(0.02)}/>` +
  rect(0.05, 0.05, 0.86, 2.44, C.woodLight, `rx="0.06" ${ink()}`) +
  TOWELS.map((fill, i) => rect(0.18, f(0.2 + i * 0.58), 0.6, 0.32, fill, `rx="0.16" ${ink(FINE)}`)).join('') +
  `<path d="M0.34,0.21 V0.51 M0.34,1.37 V1.67" stroke="${C.terracotta}" stroke-width="0.035"/>` +
  rect(0.08, 2.45, 0.8, 1.0, C.wood, `rx="0.06" ${ink()}`) +
  rect(0.2, 2.57, 0.56, 0.76, 'none', `rx="0.04" stroke="${C.woodDark}" stroke-width="0.035"`)

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

// shelf turned: its bottles in two files along its top with the jar between them, its plain end to the front and its drawers' edge over the right rim
const shelfTurned =
  rect(0.84, 0.62, 0.17, 2.6, C.wood, `rx="0.05" ${ink(0.04)}`) +
  `<path d="M0.95,1.42 V1.52 M0.95,2.3 V2.4" stroke="${C.woodDark}" stroke-width="${FINE}"/>` +
  rect(0.08, 0.55, 0.84, 2.22, C.woodLight, `rx="0.05" ${ink(0.04)}`) +
  `<g transform="translate(0 0.4)">${bottle(0.3, C.cobalt)}${bottle(0.68, C.tealLight, 0.24)}</g>` +
  rect(0.29, 1.25, 0.42, 0.3, C.cream, `rx="0.08" ${ink(FINE)}`) +
  `<path d="M0.3,1.4 H0.7" stroke="${C.cobalt}" stroke-width="0.04"/>` +
  `<g transform="translate(0 1.4)">${bottle(0.3, C.terracotta)}${bottle(0.68, C.mustard)}</g>` +
  `<g transform="translate(0 1.9)">${bottle(0.3, C.cobalt, 0.24)}${bottle(0.68, C.tealLight)}</g>` +
  rect(0.12, 2.74, 0.76, 0.5, C.wood, `rx="0.05" ${ink(0.04)}`) +
  rect(0.22, 2.83, 0.56, 0.32, 'none', `rx="0.04" stroke="${C.woodDark}" stroke-width="${FINE}"`)

// blue-and-white porcelain basin with lily pads and a lotus
const lotusFlower =
  `<path d="M1.05,0.48 Q0.85,0.43 0.85,0.26 Q0.98,0.32 1.05,0.48Z M1.05,0.48 Q1.25,0.43 1.25,0.26 Q1.12,0.32 1.05,0.48Z" fill="${C.lotus}"/>` +
  `<path d="M1.05,0.48 Q0.96,0.3 1.05,0.13 Q1.14,0.3 1.05,0.48Z" fill="${C.lotusDark}"/>`
const lotus =
  `<path d="M0.15,0.5 V0.75 A0.85,0.3 0 0 0 1.85,0.75 V0.5Z" fill="${C.cobalt}" ${ink(0.04)}/>` +
  `<path d="M0.15,0.63 A0.85,0.3 0 0 0 1.85,0.63" stroke="${C.cream}" stroke-width="0.05" fill="none"/>` +
  `<ellipse cx="1" cy="0.5" rx="0.85" ry="0.3" fill="${C.cream}" ${ink(0.04)}/>` +
  `<ellipse cx="1" cy="0.5" rx="0.7" ry="0.22" fill="${C.waterDeep}" ${ink(0.025)}/>` +
  `<g ${ink(0.02)}>` +
  `<ellipse cx="0.62" cy="0.48" rx="0.15" ry="0.09" fill="${C.leaf}"/><ellipse cx="1.4" cy="0.56" rx="0.13" ry="0.08" fill="${C.leafLight}"/>` +
  lotusFlower + `</g>`

// lotus basin turned: the oval basin long up the floor with its blue side round the near end, lily pads and the lotus on its water
const lotusTurned =
  `<path d="M0.1,0.95 V1.2 A0.45,0.8 0 0 0 1,1.2 V0.95Z" fill="${C.cobalt}" ${ink(0.04)}/>` +
  `<path d="M0.1,1.08 A0.45,0.8 0 0 0 1,1.08" stroke="${C.cream}" stroke-width="0.05" fill="none"/>` +
  `<ellipse cx="0.55" cy="0.95" rx="0.45" ry="0.8" fill="${C.cream}" ${ink(0.04)}/>` +
  `<ellipse cx="0.55" cy="0.95" rx="0.36" ry="0.66" fill="${C.waterDeep}" ${ink(0.025)}/>` +
  `<g ${ink(0.02)}>` +
  `<ellipse cx="0.48" cy="0.55" rx="0.15" ry="0.09" fill="${C.leaf}"/><ellipse cx="0.64" cy="1.35" rx="0.13" ry="0.08" fill="${C.leafLight}"/>` +
  `<g transform="translate(-0.5 0.5)">${lotusFlower}</g></g>`

const BLOSSOMS: [number, number][] = [
  [0.12, 0.72], [0.22, 0.86], [0.82, 0.55], [0.7, 0.72], [0.88, 1.0], [0.5, 0.2], [0.45, 0.46], [0.33, 0.96],
]
const vase =
  `<path d="M0.5,1.22 Q0.32,0.9 0.12,0.72 M0.5,1.22 Q0.6,0.8 0.82,0.55 M0.55,1.0 Q0.72,0.95 0.88,1.0 M0.45,1.1 Q0.38,0.6 0.5,0.2" stroke="${C.woodDark}" stroke-width="0.04" stroke-linecap="round" fill="none"/>` +
  BLOSSOMS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.065" fill="${C.lotus}" ${ink(0.015)}/>`).join('') +
  `<path d="M0.3,1.85 Q0.18,1.55 0.35,1.32 V1.22 H0.65 V1.32 Q0.82,1.55 0.7,1.85Z" fill="${C.cream}" ${ink(0.04)}/>` +
  `<path d="M0.24,1.6 H0.76" stroke="${C.cobalt}" stroke-width="0.06"/>`

const teapot =
  `<path d="M0.85,0.36 Q0.98,0.31 1.0,0.2" stroke="${C.ink}" stroke-width="0.045" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="0.65" cy="0.38" rx="0.22" ry="0.15" fill="${C.cream}" ${ink(FINE)}/>` +
  `<path d="M0.47,0.42 H0.83" stroke="${C.cobalt}" stroke-width="0.03"/>` +
  `<circle cx="0.65" cy="0.21" r="0.05" fill="${C.cobalt}" ${ink(0.02)}/>`
const tea =
  rect(0.1, 0.35, 1.8, 0.35, C.wood, `rx="0.08" ${ink(0.04)}`) +
  rect(0.15, 0.66, 1.7, 0.18, C.woodDark, `rx="0.05" ${ink(0.035)}`) +
  teapot +
  `<ellipse cx="1.25" cy="0.46" rx="0.09" ry="0.06" fill="${C.cream}" ${ink(0.025)}/>` +
  `<ellipse cx="1.5" cy="0.46" rx="0.09" ry="0.06" fill="${C.cream}" ${ink(0.025)}/>`

// tea table turned: the teapot at the far end and two cups along its top, its end apron to the front and its front apron over the right rim
const teaTurned =
  rect(0.86, 0.28, 0.15, 1.64, C.woodDark, `rx="0.05" ${ink(0.035)}`) +
  rect(0.08, 0.2, 0.86, 1.6, C.wood, `rx="0.08" ${ink(0.04)}`) +
  rect(0.12, 1.74, 0.78, 0.18, C.woodDark, `rx="0.05" ${ink(0.035)}`) +
  `<g transform="translate(-0.14 0.32)">${teapot}</g>` +
  `<ellipse cx="0.5" cy="1.16" rx="0.09" ry="0.06" fill="${C.cream}" ${ink(0.025)}/>` +
  `<ellipse cx="0.5" cy="1.42" rx="0.09" ry="0.06" fill="${C.cream}" ${ink(0.025)}/>`

const SLIPPERS: [number, string][] = [[0.35, C.tealLight], [0.85, C.terracotta], [1.35, C.mustard]]
const slippers =
  rect(0.15, 0.53, 1.7, 0.32, C.wood, `rx="0.04" ${ink(0.035)}`) +
  `<path d="M0.15,0.69 H1.85" stroke="${C.woodDark}" stroke-width="${FINE}"/>` +
  rect(0.1, 0.4, 1.8, 0.16, C.woodLight, `rx="0.04" ${ink(0.035)}`) +
  SLIPPERS.map(([x, fill]) =>
    `<ellipse cx="${x}" cy="0.36" rx="0.08" ry="0.13" fill="${fill}" ${ink(0.02)}/>` +
    `<ellipse cx="${x + 0.17}" cy="0.36" rx="0.08" ry="0.13" fill="${fill}" ${ink(0.02)}/>`,
  ).join('')

// slipper rack turned: three pairs side by side along its top, its end to the front and its side over the right rim
const slippersTurned =
  rect(0.86, 0.32, 0.15, 1.62, C.wood, `rx="0.04" ${ink(0.035)}`) +
  `<path d="M0.95,0.4 V1.88" stroke="${C.woodDark}" stroke-width="${FINE}"/>` +
  rect(0.1, 0.24, 0.82, 1.42, C.woodLight, `rx="0.04" ${ink(0.035)}`) +
  SLIPPERS.map(([, fill], i) =>
    `<ellipse cx="0.5" cy="${f(0.44 + i * 0.44)}" rx="0.13" ry="0.08" fill="${fill}" ${ink(0.02)}/>` +
    `<ellipse cx="0.5" cy="${f(0.61 + i * 0.44)}" rx="0.13" ry="0.08" fill="${fill}" ${ink(0.02)}/>`,
  ).join('') +
  rect(0.14, 1.63, 0.74, 0.32, C.wood, `rx="0.04" ${ink(0.035)}`) +
  `<path d="M0.14,1.79 H0.88" stroke="${C.woodDark}" stroke-width="${FINE}"/>`

// low planter behind the waiting bench
const planter =
  [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${0.3 + i * 0.48}" cy="0.4" r="0.22" fill="${i % 2 ? C.leafLight : C.leaf}" ${ink(FINE)}/>`).join('') +
  rect(0.08, 0.55, 2.84, 0.5, C.terracotta, `rx="0.06" ${ink(0.045)}`) +
  rect(0.04, 0.48, 2.92, 0.12, C.woodDark, `rx="0.05" ${ink(0.035)}`)

// planter turned: six shrubs down its length inside its dark rim, its terracotta end to the front and its side over the right rim
const planterTurned =
  rect(0.86, 0.5, 0.16, 2.54, C.terracotta, `rx="0.06" ${ink(0.045)}`) +
  rect(0.06, 0.44, 0.88, 2.2, C.woodDark, `rx="0.05" ${ink(0.035)}`) +
  [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${i % 2 ? 0.62 : 0.4}" cy="${f(0.6 + i * 0.37)}" r="0.24" fill="${i % 2 ? C.leafLight : C.leaf}" ${ink(FINE)}/>`).join('') +
  rect(0.1, 2.56, 0.8, 0.49, C.terracotta, `rx="0.06" ${ink(0.045)}`) +
  rect(0.06, 2.49, 0.88, 0.12, C.woodDark, `rx="0.05" ${ink(0.035)}`)

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
const pearlFlower =
  `<g ${ink(0.015)}>` +
  [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) => `<circle cx="${f(1.5 + dx * 0.075)}" cy="${f(0.87 + dy * 0.075)}" r="0.05" fill="${C.cream}"/>`).join('') +
  `<circle cx="1.5" cy="0.87" r="0.035" fill="${C.mustard}"/></g>`
const teaCaddy =
  rect(0.33, 0.2, 0.3, 0.3, C.cream, `rx="0.08" ${ink(FINE)}`) +
  `<path d="M0.34,0.36 H0.62" stroke="${C.cobalt}" stroke-width="0.05"/>` +
  rect(0.36, 0.14, 0.24, 0.08, C.cobalt, `rx="0.03" ${ink(0.025)}`)
const teaChest =
  rect(0.22, 1.1, 0.16, 0.2, C.woodDark, ink(0.025)) +
  rect(2.62, 1.1, 0.16, 0.2, C.woodDark, ink(0.025)) +
  rect(0.1, 0.54, 2.8, 0.62, C.woodDark, `rx="0.03" ${ink()}`) +
  [0.22, 1.1, 1.98].map(x => rect(x, 0.68, 0.8, 0.38, 'none', `rx="0.04" stroke="${C.wood}" stroke-width="0.035"`)).join('') +
  pearlFlower +
  `<circle cx="0.62" cy="0.87" r="0.055" fill="none" stroke="${C.mustard}" stroke-width="0.03"/>` +
  `<circle cx="2.38" cy="0.87" r="0.055" fill="none" stroke="${C.mustard}" stroke-width="0.03"/>` +
  `<path d="${CORNERS}" fill="${C.mustard}" ${ink(0.02)}/>` +
  rect(0.04, 0.36, 2.92, 0.24, C.wood, `rx="0.06" ${ink()}`) +
  `<path d="M0.16,0.45 H2.84" stroke="${C.woodLight}" stroke-width="0.045" stroke-linecap="round"/>` +
  teaCaddy +
  rect(0.98, 0.42, 1.14, 0.12, C.woodLight, `rx="0.05" ${ink(FINE)}`) +
  `<path d="M1.42,0.36 Q1.55,0.31 1.57,0.2" stroke="${C.ink}" stroke-width="0.045" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="1.24" cy="0.38" rx="0.2" ry="0.14" fill="${C.cream}" ${ink(FINE)}/>` +
  `<path d="M1.07,0.42 H1.41" stroke="${C.cobalt}" stroke-width="0.03"/>` +
  `<circle cx="1.24" cy="0.22" r="0.05" fill="${C.cobalt}" ${ink(0.02)}/>` +
  [1.62, 1.8, 1.98].map(x => `<ellipse cx="${x}" cy="0.45" rx="0.075" ry="0.055" fill="${C.cream}" ${ink(0.025)}/>`).join('')

// tea chest turned: the caddy, then the tray with the teapot and three cups along its top, its end with brass corners and a pearl flower to the front
const teaChestTurned =
  rect(0.22, 3.1, 0.16, 0.2, C.woodDark, ink(0.025)) +
  rect(0.6, 3.1, 0.16, 0.2, C.woodDark, ink(0.025)) +
  rect(0.84, 0.5, 0.18, 2.66, C.woodDark, `rx="0.03" ${ink(0.04)}`) +
  [0.95, 1.85].map(y => `<circle cx="0.95" cy="${y}" r="0.04" fill="none" stroke="${C.mustard}" stroke-width="0.03"/>`).join('') +
  rect(0.06, 0.36, 0.86, 2.26, C.wood, `rx="0.06" ${ink()}`) +
  `<path d="M0.17,0.48 V2.5" stroke="${C.woodLight}" stroke-width="0.045" stroke-linecap="round"/>` +
  rect(0.1, 2.56, 0.78, 0.6, C.woodDark, `rx="0.03" ${ink()}`) +
  rect(0.2, 2.68, 0.58, 0.36, 'none', `rx="0.04" stroke="${C.wood}" stroke-width="0.035"`) +
  `<g transform="translate(-1.01 1.99)">${pearlFlower}</g>` +
  `<path d="M0.1,2.56 H0.26 L0.1,2.72Z M0.88,2.56 H0.72 L0.88,2.72Z M0.1,3.16 H0.26 L0.1,3Z M0.88,3.16 H0.72 L0.88,3Z" fill="${C.mustard}" ${ink(0.02)}/>` +
  `<g transform="translate(0.01 0.42)">${teaCaddy}</g>` +
  rect(0.24, 1.08, 0.5, 1.3, C.woodLight, `rx="0.05" ${ink(FINE)}`) +
  `<g transform="translate(-0.16 1)">${teapot}</g>` +
  [1.82, 2.02, 2.22].map(y => `<ellipse cx="0.49" cy="${y}" rx="0.075" ry="0.055" fill="${C.cream}" ${ink(0.025)}/>`).join('')

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

// bamboo bench turned: its two back poles down the left, the three woven seats, the seat pole down the right and the end poles across, legs to the front
const bambooBenchTurned =
  WEAVE +
  pole(0.24, 3.04, 0.11, 0.28) +
  pole(0.76, 3.04, 0.11, 0.28) +
  [0, 1, 2].map(i => rect(0.32, f(0.22 + i * 0.92), 0.58, 0.88, 'url(#weave)', `rx="0.08" ${ink(0.04)}`)).join('') +
  pole(0.05, 0.12, 0.14, 2.9) +
  pole(0.18, 0.12, 0.14, 2.9) +
  pole(0.88, 0.1, 0.16, 2.94) +
  pole(0.02, 0.04, 1.06, 0.17) +
  pole(0.02, 2.92, 1.06, 0.17)

/** A brown clay pot centred on cx from its rim at `top` to its foot, `half` wide at the rim's ends. */
const clayPot = (cx: number, top: number, bottom: number, half: number) =>
  `<path d="M${f(cx - half * 0.6)},${top} Q${f(cx - half * 1.25)},${f((top + bottom) / 2)} ${f(cx - half * 0.7)},${bottom} H${f(cx + half * 0.7)} Q${f(cx + half * 1.25)},${f((top + bottom) / 2)} ${f(cx + half * 0.6)},${top}Z" fill="${C.clay}" ${ink(FINE)}/>` +
  rect(f(cx - half * 0.7), f(top - 0.04), f(half * 1.4), 0.07, C.clayLight, `rx="0.03" ${ink(0.02)}`)

// slatted bamboo top with a clay teapot and two cups
const clayTeapot =
  `<path d="M0.85,0.36 Q0.98,0.31 1.0,0.2" stroke="${C.ink}" stroke-width="0.045" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="0.65" cy="0.38" rx="0.22" ry="0.15" fill="${C.clay}" ${ink(FINE)}/>` +
  `<path d="M0.5,0.3 Q0.65,0.25 0.8,0.3" stroke="${C.clayLight}" stroke-width="0.03" fill="none"/>` +
  `<circle cx="0.65" cy="0.21" r="0.05" fill="${C.clayLight}" ${ink(0.02)}/>`
const bambooTea =
  pole(0.2, 0.7, 0.12, 0.22) +
  pole(1.68, 0.7, 0.12, 0.22) +
  rect(0.08, 0.34, 1.84, 0.36, C.bamboo, `rx="0.06" ${ink(0.04)}`) +
  `<path d="M0.1,0.46 H1.9 M0.1,0.58 H1.9" stroke="${C.bambooDark}" stroke-width="${FINE}"/>` +
  `<path d="M0.55,0.35 V0.46 M1.35,0.35 V0.46 M0.95,0.46 V0.58 M1.7,0.46 V0.58 M0.35,0.58 V0.69 M1.2,0.58 V0.69" stroke="${C.bambooDark}" stroke-width="0.03"/>` +
  pole(0.06, 0.64, 1.88, 0.15) +
  clayTeapot +
  `<ellipse cx="1.25" cy="0.46" rx="0.09" ry="0.06" fill="${C.clayLight}" ${ink(0.025)}/>` +
  `<ellipse cx="1.5" cy="0.46" rx="0.09" ry="0.06" fill="${C.clayLight}" ${ink(0.025)}/>`

// bamboo tea table turned: its slats running up the top under the clay teapot and cups, the slats' ends and legs to the front and its front pole down the right
const bambooTeaTurned =
  pole(0.2, 1.68, 0.12, 0.26) +
  pole(0.7, 1.68, 0.12, 0.26) +
  rect(0.08, 0.12, 0.82, 1.62, C.bamboo, `rx="0.06" ${ink(0.04)}`) +
  `<path d="M0.35,0.14 V1.72 M0.62,0.14 V1.72" stroke="${C.bambooDark}" stroke-width="${FINE}"/>` +
  `<path d="M0.08,0.55 H0.35 M0.62,0.95 H0.9 M0.35,1.25 H0.62" stroke="${C.bambooDark}" stroke-width="0.03"/>` +
  rect(0.08, 1.62, 0.82, 0.14, C.bamboo, `rx="0.05" ${ink(0.035)}`) +
  `<path d="M0.35,1.63 V1.75 M0.62,1.63 V1.75" stroke="${C.bambooDark}" stroke-width="0.03"/>` +
  pole(0.86, 0.08, 0.15, 1.7) +
  `<g transform="translate(-0.15 0.3)">${clayTeapot}</g>` +
  `<ellipse cx="0.48" cy="1.14" rx="0.09" ry="0.06" fill="${C.clayLight}" ${ink(0.025)}/>` +
  `<ellipse cx="0.48" cy="1.4" rx="0.09" ry="0.06" fill="${C.clayLight}" ${ink(0.025)}/>`

// two-tier bamboo rack: a mây basket of rolled towels and a clay pot above, folded towels and a basket below
const ROLLED: [number, string][] = [[0.45, C.cream], [0.64, C.tealLight], [0.83, C.cream]]
const FOLDED: [number, string][] = [[1.18, C.cream], [1.06, C.tealLight], [0.94, C.cream]]
const rolledTowels =
  ROLLED.map(([x, fill]) => `<circle cx="${x}" cy="0.44" r="0.1" fill="${fill}" ${ink(0.025)}/>`).join('') +
  rect(0.28, 0.46, 0.72, 0.28, 'url(#weave)', `rx="0.06" ${ink(FINE)}`)
const bambooShelf =
  WEAVE +
  rolledTowels +
  clayPot(1.42, 0.42, 0.74, 0.24) +
  FOLDED.map(([y, fill]) => rect(0.3, y, 0.66, 0.14, fill, `rx="0.06" ${ink(0.025)}`)).join('') +
  rect(1.12, 1.04, 0.62, 0.34, 'url(#weave)', `rx="0.06" ${ink(FINE)}`) +
  pole(0.04, 0.72, 1.92, 0.13) +
  pole(0.04, 1.36, 1.92, 0.13) +
  pole(0.06, 0.12, 0.15, 1.52) +
  pole(1.79, 0.12, 0.15, 1.52)

// bamboo rack turned: the basket of rolled towels and the clay pot along its top tier, and its end frame to the front with the folded towels on the tier below
const bambooShelfTurned =
  WEAVE +
  rect(0.16, 0.14, 0.76, 1.62, C.bamboo, ink(FINE)) +
  `<path d="M0.35,0.16 V1.74 M0.54,0.16 V1.74 M0.73,0.16 V1.74" stroke="${C.bambooDark}" stroke-width="${FINE}"/>` +
  pole(0.05, 0.1, 0.14, 1.68) +
  pole(0.89, 0.1, 0.14, 1.68) +
  pole(0.03, 0.06, 1.04, 0.13) +
  `<g transform="translate(-0.1 0.08)">${rolledTowels}</g>` +
  clayPot(0.54, 1.22, 1.56, 0.24) +
  FOLDED.map(([y, fill]) => rect(0.28, f(y + 1), 0.52, 0.14, fill, `rx="0.06" ${ink(0.025)}`)).join('') +
  pole(0.05, 1.12, 0.15, 1.52) +
  pole(0.89, 1.12, 0.15, 1.52) +
  pole(0.03, 1.72, 1.04, 0.13) +
  pole(0.03, 2.36, 1.04, 0.13)

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

/** A `fill` board stood along its column and seen edge-on, `h` high: its foot, a sliver of its face with `marks` over the right rim, then its edge,
 * the top running up the floor and the near end, `tall` high, to the front. */
const edgeOn = (h: number, tall: number, fill: string, marks: string, foot: string = C.woodDark) => {
  const bottom = f(h - 0.33)
  return (
    rect(0.4, f(bottom - 0.04), 0.16, 0.32, foot, ink(0.025)) +
    rect(0.54, 0.12, 0.32, f(bottom - 0.16), fill, `rx="0.03" ${ink(FINE)}`) +
    marks +
    rect(0.36, 0.06, 0.22, f(bottom - 0.06), fill, `rx="0.04" ${ink()}`) +
    `<path d="M0.36,${f(bottom - tall)} H0.58" ${ink(FINE)}/>`
  )
}

// silk screen turned: the two red-lacquer panels edge-on, a sliver of the silk with the lotus and the swallows over the right rim
const silkScreenTurned = edgeOn(
  2.75, 1.46, C.lanternDark,
  rect(0.6, 0.18, 0.2, 2.14, C.cream, `stroke="${C.mustard}" stroke-width="0.02"`) +
  rect(0.54, 1.2, 0.32, 0.1, C.lanternDark, ink(FINE)) +
  rect(0.66, 1.21, 0.08, 0.08, C.mustard, ink(0.015)) +
  `<path d="M0.69,1.08 Q0.66,0.86 0.7,0.66" stroke="${C.leaf}" stroke-width="0.025" fill="none"/>` +
  `<ellipse cx="0.7" cy="0.58" rx="0.05" ry="0.09" fill="${C.lotus}" ${ink(0.015)}/>` +
  `<g transform="translate(0.35 0.8) scale(0.5)">${swallow(0.7, 1.6)}</g>` +
  `<g transform="translate(0.35 0.975) scale(0.5)">${swallow(0.7, 1.95)}</g>`,
  C.lanternDark,
)

const PORTRAITS = [C.terracotta, C.mustard, C.cobalt, C.lotus, C.teal, C.lantern, C.leaf, C.woodLight]

// bảng ảnh khách quen: a brown wooden board on two feet, eight small photos of the regulars in cream frames, and a red ribbon across its top
const ribbonBow =
  `<g ${ink(0.025)}>` +
  `<path d="M0.97,0.34 L0.9,0.56 L0.95,0.53 L1,0.36Z M1.03,0.34 L1.1,0.56 L1.05,0.53 L1,0.36Z" fill="${C.lanternDark}"/>` +
  `<path d="M1,0.3 Q0.78,0.12 0.8,0.34 Q0.9,0.4 1,0.3Z M1,0.3 Q1.22,0.12 1.2,0.34 Q1.1,0.4 1,0.3Z" fill="${C.lantern}"/>` +
  `<circle cx="1" cy="0.32" r="0.05" fill="${C.lanternDark}"/></g>`
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
  ribbonBow

// regulars' board turned: the wooden board edge-on with its ribbon's bow on top, a sliver of the photos and the ribbon over the right rim
const regularsBoardTurned =
  edgeOn(
    2.7, 1.22, C.wood,
    rect(0.58, 0.17, 0.24, 2.14, 'none', `rx="0.03" stroke="${C.woodDark}" stroke-width="${FINE}"`) +
    PORTRAITS.map((shirt, i) => {
      const x = f(0.61 + (i % 2) * 0.11)
      const y = f(0.3 + Math.floor(i / 2) * 0.5)
      return rect(x, y, 0.09, 0.34, C.cream, ink(0.012)) + rect(x, f(y + 0.2), 0.09, 0.14, shirt, ink(0.012))
    }).join('') +
    `<path d="M0.58,0.14 Q0.72,1.2 0.58,2.3" stroke="${C.ink}" stroke-width="0.09" fill="none" stroke-linecap="round"/>` +
    `<path d="M0.58,0.14 Q0.72,1.2 0.58,2.3" stroke="${C.lantern}" stroke-width="0.05" fill="none" stroke-linecap="round"/>`,
  ) +
  `<g transform="rotate(-90 0.47 0.6) translate(-0.53 0.3)">${ribbonBow}</g>`

// Gifts from the VIPs

/** A head and shoulders in a `shirt`, centred at x 0.5 in a photo's cream ground. */
const bust = (shirt: string, skin: string = C.sand) =>
  `<path d="M0.22,1.12 Q0.24,0.84 0.5,0.8 Q0.76,0.84 0.78,1.12Z" fill="${shirt}" ${ink(0.02)}/>` +
  rect(0.46, 0.72, 0.08, 0.1, skin, ink(0.015)) +
  `<circle cx="0.5" cy="0.6" r="0.15" fill="${skin}" ${ink(0.02)}/>`

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

// gold board turned: the red-lacquer board edge-on with its gold star turned sideways on top, a sliver of the gold frames over the right rim
const goldBoardTurned =
  edgeOn(
    2.75, 1.04, C.lanternDark,
    rect(0.58, 0.17, 0.24, 2.16, 'none', `rx="0.03" stroke="${C.mustard}" stroke-width="0.03"`) +
    [C.lotus, C.teal, C.cobalt, C.terracotta].map((shirt, i) => {
      const y = f(0.32 + i * 0.5)
      return rect(0.62, y, 0.16, 0.38, C.mustard, ink(0.025)) + rect(0.645, f(y + 0.03), 0.11, 0.32, C.cream, ink(0.012)) + rect(0.645, f(y + 0.2), 0.11, 0.15, shirt, ink(0.012))
    }).join(''),
  ) +
  `<path d="M0.47,0.26 L0.5,0.42 L0.59,0.44 L0.52,0.55 L0.55,0.72 L0.47,0.62 L0.39,0.72 L0.42,0.55 L0.35,0.44 L0.44,0.42Z" fill="${C.mustard}" ${ink(0.025)}/>`

const skinHex = (i: number) => `#${SKIN[i].toString(16).padStart(6, '0')}`
const star5 = (cx: number, cy: number, R: number, r: number, extra = '') => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const d = i % 2 ? r : R
    return `${f(cx + d * Math.cos(a))},${f(cy + d * Math.sin(a))}`
  })
  return `<path d="M${pts.join(' L')}Z" fill="${C.mustard}" ${extra}/>`
}
// Ngôi sao: the signed photo again, with a small gold star on the top edge of its frame
const idolPhoto = (portrait: string) => photo(portrait) + star5(0.5, 0.15, 0.1, 0.045, ink(0.02))

/** Two dot eyes at the head's centre line. */
const eyes = (y = 0.6) =>
  `<circle cx="0.45" cy="${y}" r="0.015" fill="${C.ink}"/><circle cx="0.55" cy="${y}" r="0.015" fill="${C.ink}"/>`

// Sơn Tùng M-TP: a tall dark quiff swept up off the forehead, a black open jacket and a thin gold chain on the lighter shirt inside
const photoIdolSontung =
  bust('#E8DCC8', skinHex(0)) +
  `<path d="M0.22,1.12 Q0.24,0.84 0.44,0.8 L0.5,1.12Z M0.78,1.12 Q0.76,0.84 0.56,0.8 L0.5,1.12Z" fill="#2B2422" ${ink(0.02)}/>` +
  `<path d="M0.36,0.56 Q0.32,0.4 0.46,0.38 Q0.5,0.24 0.64,0.3 Q0.7,0.4 0.64,0.56 Q0.6,0.46 0.5,0.46 Q0.42,0.46 0.36,0.56Z" fill="${C.woodDark}" ${ink(0.02)}/>` +
  eyes() +
  `<path d="M0.4,0.7 Q0.5,0.74 0.6,0.7" stroke="${C.ink}" stroke-width="0.015" fill="none"/>` +
  `<path d="M0.42,0.84 Q0.5,0.98 0.58,0.84" stroke="${C.mustard}" stroke-width="0.03" fill="none" stroke-linecap="round"/>`

// Taylor Swift: honey hair falling past the shoulders under straight bangs, red lips, a periwinkle dress with white sparkles
const photoIdolTaylor =
  `<path d="M0.31,0.62 Q0.28,0.38 0.5,0.38 Q0.72,0.38 0.69,0.62 L0.72,0.9 H0.28Z" fill="#E9C46A" ${ink(0.02)}/>` +
  bust('#B7C3EA', skinHex(0)) +
  [[0.34,1],[0.44,0.92],[0.58,0.97],[0.66,1.06],[0.5,1.07]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.02" fill="#fff"/>`).join('') +
  `<path d="M0.34,0.58 Q0.34,0.42 0.5,0.42 Q0.66,0.42 0.66,0.58 Q0.5,0.5 0.34,0.58Z" fill="#E9C46A" ${ink(0.02)}/>` +
  eyes(0.63) +
  `<path d="M0.46,0.7 Q0.5,0.73 0.54,0.7 Q0.5,0.69 0.46,0.7Z" fill="${C.lantern}"/>`

// G-Dragon: bright pink hair swept to one side and a white daisy with a gold heart on a black jacket
const photoIdolGd =
  bust(C.ink, skinHex(0)) +
  `<path d="M0.34,0.6 Q0.3,0.4 0.5,0.4 Q0.7,0.4 0.66,0.58 Q0.58,0.48 0.46,0.5 Q0.38,0.54 0.34,0.6Z" fill="#F49AB4" ${ink(0.02)}/>` +
  eyes(0.62) +
  [0, 72, 144, 216, 288].map(a => `<ellipse cx="0.64" cy="0.95" rx="0.03" ry="0.05" fill="#fff" ${ink(0.012)} transform="rotate(${a} 0.64 1)"/>`).join('') +
  `<circle cx="0.64" cy="1" r="0.025" fill="${C.mustard}"/>`

// Jennie: a black bob with straight bangs, a cream bow in her hair at the side and a cream tweed jacket with dark trim
const photoIdolJennie =
  `<path d="M0.31,0.7 Q0.28,0.38 0.5,0.38 Q0.72,0.38 0.69,0.7 Q0.66,0.52 0.5,0.52 Q0.34,0.52 0.31,0.7Z" fill="${C.ink}"/>` +
  bust('#F3E9DA', skinHex(0)) +
  `<path d="M0.4,0.84 L0.5,1.12 L0.6,0.84" stroke="${C.woodDark}" stroke-width="0.03" fill="none"/>` +
  `<path d="M0.34,0.58 Q0.34,0.42 0.5,0.42 Q0.66,0.42 0.66,0.58 Q0.5,0.5 0.34,0.58Z" fill="${C.ink}"/>` +
  eyes(0.63) +
  `<path d="M0.65,0.49 L0.73,0.44 L0.73,0.54Z M0.65,0.49 L0.57,0.44 L0.57,0.54Z" fill="#FBF7EE" ${ink(0.015)}/>` +
  `<circle cx="0.65" cy="0.49" r="0.02" fill="#F3E9DA" ${ink(0.012)}/>`

// HIEUTHUHAI: a cobalt cap worn backwards, only its crown and strap gap showing, over a cream jersey with a cobalt 2
const photoIdolHieuthuhai =
  bust('#FBF7EE', skinHex(0)) +
  `<path d="M0.46,0.91 Q0.5,0.85 0.54,0.91 Q0.54,0.95 0.46,1 H0.55" stroke="${C.cobalt}" stroke-width="0.03" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M0.35,0.56 Q0.35,0.4 0.5,0.4 Q0.65,0.4 0.65,0.56Z" fill="${C.cobalt}" ${ink(0.02)}/>` +
  `<path d="M0.42,0.56 Q0.5,0.5 0.58,0.56" stroke="${C.cream}" stroke-width="0.015" fill="none"/>` +
  `<circle cx="0.5" cy="0.4" r="0.015" fill="${C.cream}"/>` +
  eyes(0.63) +
  `<path d="M0.46,0.7 H0.54" stroke="${C.ink}" stroke-width="0.015"/>`

// The Weeknd: a red suit over a white shirt, dark hair swept up and a thick moustache
const photoIdolWeeknd =
  bust(C.lanternDark, skinHex(3)) +
  `<path d="M0.46,0.82 L0.5,1 L0.54,0.82Z" fill="#fff" ${ink(0.015)}/>` +
  `<path d="M0.34,0.58 Q0.3,0.36 0.5,0.36 Q0.7,0.36 0.66,0.58 Q0.6,0.46 0.5,0.46 Q0.4,0.46 0.34,0.58Z" fill="${C.ink}"/>` +
  eyes() +
  `<path d="M0.42,0.69 Q0.5,0.65 0.58,0.69 Q0.5,0.72 0.42,0.69Z" fill="${C.ink}"/>`

// Taeyang: a black spiky mohawk down the middle of a head shaved at the sides, in a white tank with a silver chain
const photoIdolTaeyang =
  bust('#F4F1EA', skinHex(1)) +
  `<path d="M0.42,0.47 L0.4,0.3 L0.46,0.38 L0.5,0.24 L0.54,0.38 L0.6,0.3 L0.58,0.47Z" fill="${C.ink}" ${ink(0.015)}/>` +
  `<path d="M0.36,0.55 Q0.36,0.47 0.42,0.46 M0.64,0.55 Q0.64,0.47 0.58,0.46" stroke="#6E5D55" stroke-width="0.03" fill="none"/>` +
  eyes() +
  `<path d="M0.45,0.7 Q0.5,0.72 0.55,0.7" stroke="${C.ink}" stroke-width="0.015" fill="none"/>` +
  `<path d="M0.42,0.84 Q0.5,0.98 0.58,0.84" stroke="#B8BEC6" stroke-width="0.025" fill="none" stroke-linecap="round"/>`

// Justin Bieber: a grey beanie over a brown fringe and a yellow hoodie with its hood behind the neck
const photoIdolBieber =
  bust('#F2D16B', skinHex(0)) +
  `<path d="M0.28,0.86 Q0.5,0.98 0.72,0.86" stroke="${C.ink}" stroke-width="0.02" fill="none"/>` +
  `<path d="M0.35,0.56 Q0.35,0.42 0.5,0.42 Q0.65,0.42 0.65,0.56 Q0.5,0.52 0.35,0.56Z" fill="#9A5B36" ${ink(0.015)}/>` +
  `<path d="M0.34,0.5 Q0.34,0.34 0.5,0.34 Q0.66,0.34 0.66,0.5Z" fill="#9AA0A6" ${ink(0.02)}/>` +
  rect(0.33, 0.48, 0.34, 0.05, '#7E858B', ink(0.015)) +
  eyes(0.62)

// Daesung: a big crescent-eyed grin, dark hair and a red bow tie on a dark jacket
const photoIdolDaesung =
  bust('#3B3B48', skinHex(0)) +
  `<path d="M0.35,0.56 Q0.33,0.4 0.5,0.4 Q0.67,0.4 0.65,0.56 Q0.5,0.48 0.35,0.56Z" fill="${C.ink}"/>` +
  `<path d="M0.38,0.62 Q0.43,0.57 0.48,0.62 M0.52,0.62 Q0.57,0.57 0.62,0.62" stroke="${C.ink}" stroke-width="0.02" fill="none" stroke-linecap="round"/>` +
  `<path d="M0.42,0.67 Q0.5,0.77 0.58,0.67Z" fill="#fff" ${ink(0.015)}/>` +
  `<path d="M0.5,0.86 L0.4,0.8 L0.4,0.92Z M0.5,0.86 L0.6,0.8 L0.6,0.92Z" fill="${C.lantern}" ${ink(0.015)}/>`

// Tường ngôi sao: a red-lacquer board with a gold border on two feet and nine small gold stars in three rows of three
const starWall =
  rect(0.3, 1.38, 0.14, 0.32, C.woodDark, ink(0.025)) +
  rect(1.56, 1.38, 0.14, 0.32, C.woodDark, ink(0.025)) +
  rect(0.06, 0.4, 1.88, 1.04, C.lanternDark, `rx="0.05" ${ink()}`) +
  rect(0.13, 0.47, 1.74, 0.9, 'none', `rx="0.03" stroke="${C.mustard}" stroke-width="0.03"`) +
  [0, 1, 2].map(row => [0, 1, 2].map(col => star5(f(0.5 + col * 0.5), f(0.72 + row * 0.26), 0.11, 0.05, ink(0.02))).join('')).join('')

// star wall turned: the red-lacquer board edge-on, a sliver of its gold stars over the right rim
const starWallTurned = edgeOn(
  2.75, 1.04, C.lanternDark,
  rect(0.58, 0.17, 0.24, 2.16, 'none', `rx="0.03" stroke="${C.mustard}" stroke-width="0.03"`) +
  [0, 1, 2].map(row => [0.65, 0.77].map(x => star5(x, f(0.5 + row * 0.7), 0.075, 0.035, ink(0.015))).join('')).join(''),
)

// festival keepsakes, drawn in the sketch's pixels (80 to a tile, origin at the foot, y up) and scaled into the tile
const KEEP = 0.011875
const keepsake = (body: string) =>
  `<g transform="translate(0.5,1.78) scale(${KEEP})"><ellipse cx="0" cy="0" rx="38" ry="9" fill="${C.ink}" opacity="0.2"/>${body}</g>`
const ks = `stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"`
const ks3 = `stroke="${C.ink}" stroke-width="3"`
const bloom = (x: number, y: number, r: number, fill: string) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${ks3}/><circle cx="${x}" cy="${y}" r="${f(r * 0.35)}" fill="${C.mustardDark}"/>`
const starPath = (cx: number, cy: number, R: number, r: number) =>
  'M' + Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const k = i % 2 ? r : R
    return `${f(cx + Math.cos(a) * k)},${f(cy + Math.sin(a) * k)}`
  }).join(' L') + 'Z'

// cành mai: bare dark twigs with yellow blossoms in a red-rimmed terracotta pot
const maiBranch = keepsake(
  `<path d="M0,-40 Q-4,-70 -26,-104 M-3,-62 Q14,-90 30,-116 M-12,-84 Q-28,-94 -40,-92 M12,-88 Q26,-86 36,-76" fill="none" stroke="${C.woodDark}" stroke-width="6" stroke-linecap="round"/>` +
    [[-26, -104], [30, -116], [-40, -92], [36, -76], [-6, -74], [18, -100], [-16, -58]].map(([x, y]) => bloom(x, y, 9, C.mustard)).join('') +
    `<path d="M-32,0 L-26,-40 H26 L32,0Z" fill="${C.terracotta}" ${ks}/><rect x="-30" y="-46" width="60" height="10" rx="4" fill="${C.lantern}" ${ks}/>`,
)

// khung tim: a wooden frame on two legs with a red heart on cream
const heartFrame = keepsake(
  `<path d="M-26,0 L-14,-40 M26,0 L14,-40" stroke="${C.woodDark}" stroke-width="6" stroke-linecap="round"/><rect x="-40" y="-124" width="80" height="88" rx="8" fill="${C.woodLight}" ${ks}/>` +
    `<rect x="-28" y="-112" width="56" height="64" rx="4" fill="${C.paper}" ${ks}/><path d="M0,-58 C-26,-74 -22,-100 -8,-98 C-3,-97 0,-92 0,-89 C0,-92 3,-97 8,-98 C22,-100 26,-74 0,-58Z" fill="${C.lantern}" ${ks}/>`,
)

// bình hoa hồng: three red roses on green stems in a cobalt vase
const roseVase = keepsake(
  `<path d="M0,-44 V-96 M-4,-50 Q-20,-70 -24,-90 M4,-50 Q20,-70 26,-86" fill="none" stroke="${C.leaf}" stroke-width="5" stroke-linecap="round"/>` +
    [[0, -100], [-24, -92], [26, -88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.lantern}" ${ks3}/><path d="M${x - 6},${y} q6,-8 12,0 q-6,7 -12,0" fill="none" stroke="${C.lanternDark}" stroke-width="3"/>`).join('') +
    `<path d="M-18,0 Q-30,-28 -12,-48 H12 Q30,-28 18,0Z" fill="${C.cobalt}" ${ks}/>`,
)

// đèn ông sao: a red five-point star lantern with a gold heart and two tassels, on a stick
const starLantern = keepsake(
  `<path d="M0,0 V-62" stroke="${C.woodDark}" stroke-width="7" stroke-linecap="round"/><path d="M-30,-84 l-8,24 M30,-84 l8,24" stroke="${C.mustard}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="${starPath(0, -100, 44, 19)}" fill="${C.lantern}" ${ks}/><path d="${starPath(0, -100, 20, 9)}" fill="${C.mustard}" opacity="0.85"/>`,
)

// lẵng hoa: a woven basket with a handle, full of pink, yellow, cream and red flowers
const flowerBasket = keepsake(
  `<path d="M-36,-44 Q0,-118 36,-44" fill="none" stroke="${C.woodDark}" stroke-width="6"/>` +
    ([[-22, -60, C.lotus], [0, -72, C.mustard], [22, -60, C.paper], [-10, -50, C.lantern], [12, -50, C.lotus]] as const).map(([x, y, fill]) => bloom(x, y, 13, fill)).join('') +
    `<path d="M-40,-44 H40 L30,0 H-30Z" fill="${C.plank}" ${ks}/><path d="M-35,-30 H35 M-32,-16 H32" stroke="${C.woodDark}" stroke-width="3"/>`,
)

// cây thông: a three-tier fir with red and gold baubles and a gold star on top
const xmasTree = keepsake(
  `<rect x="-9" y="-22" width="18" height="22" fill="${C.wood}" ${ks}/><path d="M0,-128 L28,-88 H14 L38,-52 H20 L46,-20 H-46 L-20,-52 H-38 L-14,-88 H-28Z" fill="${C.leaf}" ${ks}/>` +
    [[-16, -34], [18, -42], [-6, -68], [10, -94], [-22, -58], [22, -70]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${i % 2 ? C.mustard : C.lantern}" ${ks3}/>`).join('') +
    `<path d="${starPath(0, -130, 17, 7)}" fill="${C.mustard}" ${ks}/>`,
)

// giấy khen: a framed certificate on a stand, a red heading bar, two lines of writing and a red seal
const certificate = keepsake(
  `<path d="M-24,0 L-12,-40 M24,0 L12,-40" stroke="${C.woodDark}" stroke-width="6" stroke-linecap="round"/>` +
    `<rect x="-50" y="-122" width="100" height="86" rx="6" fill="${C.woodLight}" ${ks}/>` +
    `<rect x="-40" y="-112" width="80" height="66" rx="3" fill="${C.paper}" stroke="${C.lantern}" stroke-width="3"/>` +
    `<rect x="-24" y="-104" width="48" height="9" rx="3" fill="${C.lantern}"/>` +
    `<path d="M-28,-82 H24 M-28,-68 H10" stroke="${C.wallDark}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="26" cy="-60" r="8" fill="${C.lantern}" ${ks3}/>`,
)

// cúp vàng: a gold cup with two handles and a cream star on a dark wooden base, scaled to stay near its tile
const trophy = keepsake(
  `<g transform="scale(0.7)"><rect x="-34" y="-30" width="68" height="30" rx="6" fill="${C.woodDark}" ${ks}/>` +
    `<rect x="-22" y="-44" width="44" height="16" rx="4" fill="${C.gold}" ${ks}/>` +
    `<path d="M-8,-44 V-62 H8 V-44" fill="${C.gold}" ${ks}/>` +
    `<path d="M-36,-124 Q-60,-124 -54,-100 Q-48,-84 -24,-82 M36,-124 Q60,-124 54,-100 Q48,-84 24,-82" fill="none" stroke="${C.ink}" stroke-width="13" stroke-linecap="round"/>` +
    `<path d="M-36,-124 Q-60,-124 -54,-100 Q-48,-84 -24,-82 M36,-124 Q60,-124 54,-100 Q48,-84 24,-82" fill="none" stroke="${C.gold}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M-40,-136 H40 V-112 Q40,-62 0,-62 Q-40,-62 -40,-112Z" fill="${C.gold}" ${ks}/>` +
    `<path d="M-28,-128 V-110 Q-28,-90 -16,-80" fill="none" stroke="${C.cream}" stroke-width="5" stroke-linecap="round" opacity="0.7"/>` +
    `<path d="${starPath(0, -106, 17, 7.5)}" fill="${C.cream}" ${ks3}/></g>`,
)

// bằng khen: a wide framed certificate on a stand with writing and a silver seal, scaled to stay inside its tile
const merit = keepsake(
  `<g transform="scale(0.8)"><path d="M-24,0 L-12,-46 M24,0 L12,-46" stroke="${C.woodDark}" stroke-width="6" stroke-linecap="round"/>` +
    `<rect x="-62" y="-150" width="124" height="104" rx="8" fill="${C.woodLight}" ${ks}/>` +
    `<rect x="-50" y="-138" width="100" height="80" rx="4" fill="${C.paper}" stroke="${C.lantern}" stroke-width="3"/>` +
    `<path d="M-34,-118 H34 M-34,-102 H20 M-34,-86 H10" stroke="${C.soft}" stroke-width="4"/>` +
    `<circle cx="32" cy="-74" r="14" fill="${C.silver}" ${ks3}/></g>`,
)

// ván lướt sóng: the beach's gold surfboard with a teal stripe and a red band, leaning back on its tail, drawn in the
// sketch's pixels (78 to a tile, origin at the tail) and scaled to about 0.8 of the sketch's height
const surfboard =
  `<ellipse cx="0.5" cy="2.64" rx="0.3" ry="0.06" fill="${C.ink}" opacity="0.18"/>` +
  `<g transform="translate(0.6,2.64) rotate(-6) scale(0.0098)">` +
  `<path d="M0,0 Q-30,-10 -30,-150 Q-28,-250 0,-268 Q28,-250 30,-150 Q30,-10 0,0Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>` +
  `<path d="M0,-8 V-256" stroke="${C.teal}" stroke-width="12"/><path d="M-22,-60 Q0,-70 22,-60" stroke="${C.lantern}" stroke-width="8" fill="none"/></g>`

// dây đèn lồng Hội An: the old town's dark wood post with an arm at the top, a cord hanging three silk lanterns one under another
const lanternString =
  `<ellipse cx="0.25" cy="2.64" rx="0.22" ry="0.06" fill="${C.ink}" opacity="0.18"/>` +
  `<path d="M0.25,2.64 V0.22 H0.62" fill="none" stroke="${C.ink}" stroke-width="0.17" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M0.25,2.64 V0.22 H0.62" fill="none" stroke="${C.phoWood}" stroke-width="0.1" stroke-linecap="round" stroke-linejoin="round"/>` +
  [C.lantern, C.mustard, C.tealLight].map((col, i) => silkLantern(0.62, 0.3 + i * 0.8, col, 13)).join('')

// chậu lan hồ điệp: the uptown's cream pot with a mustard band, an arching stem with five flowers and two leaves, drawn in the
// sketch's pixels (origin at the pot's foot) and scaled to fit its tile
const orchidFlower = ([x, y]: number[]) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180)
    const [px, py] = [f(x + Math.cos(a) * 7), f(y + Math.sin(a) * 7)]
    return `<ellipse cx="${px}" cy="${py}" rx="8" ry="6" transform="rotate(${i * 72} ${px} ${py})" fill="${C.orchid}" stroke="${C.ink}" stroke-width="2.5"/>`
  }).join('') + `<circle cx="${x}" cy="${y}" r="4.5" fill="${C.lotus}" stroke="${C.ink}" stroke-width="2"/>`
const orchid =
  `<ellipse cx="0.47" cy="2.34" rx="0.3" ry="0.06" fill="${C.ink}" opacity="0.18"/>` +
  `<g transform="translate(0.47,2.34) scale(0.0095)">` +
  `<path d="M-30,0 L-24,-58 H24 L30,0Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>` +
  `<path d="M-27,-30 H27" stroke="${C.mustard}" stroke-width="7"/>` +
  `<path d="M-2,-58 Q-10,-120 8,-160 Q22,-190 30,-196" stroke="${C.leaf}" stroke-width="6" fill="none"/>` +
  `<path d="M-14,-60 q-24,-8 -30,-28 q24,2 30,28 M8,-60 q24,-12 34,-4 q-20,14 -34,4" fill="${C.leaf}" stroke="${C.ink}" stroke-width="3"/>` +
  [[-4, -112], [12, -140], [26, -166], [34, -192], [10, -176]].map(orchidFlower).join('') + `</g>`

// lều xông: one round striped dome seen from the front at three-quarters; seven wedges from the knob along the front of the base, alternating cream and terracotta
const TENT_APEX: [number, number] = [1, 0.8]
const TENT_BASE = { cx: 1, cy: 1.75, rx: 0.92, ry: 0.72 }
const TENT_WEDGES = 7
const tentEdge = (i: number): [number, number] => {
  const a = (i / TENT_WEDGES) * Math.PI
  return [f(TENT_BASE.cx - TENT_BASE.rx * Math.cos(a)), f(TENT_BASE.cy + TENT_BASE.ry * Math.sin(a))]
}
const tentArc = `A${TENT_BASE.rx},${TENT_BASE.ry} 0 0 0`
const tentWedges = Array.from({ length: TENT_WEDGES }, (_, i) => {
  const [x0, y0] = tentEdge(i)
  const [x1, y1] = tentEdge(i + 1)
  return `<path d="M${TENT_APEX[0]},${TENT_APEX[1]} L${x0},${y0} ${tentArc} ${x1},${y1}Z" fill="${i % 2 ? C.cream : C.terracotta}" ${ink(FINE)}/>`
}).join('')
const steamTent =
  `<ellipse cx="1" cy="2.3" rx="0.95" ry="0.26" fill="${C.ink}" opacity="0.15"/>` +
  tentWedges +
  `<path d="M${TENT_APEX[0]},${TENT_APEX[1]} L${f(TENT_BASE.cx - TENT_BASE.rx)},${TENT_BASE.cy} ${tentArc} ${f(TENT_BASE.cx + TENT_BASE.rx)},${TENT_BASE.cy}Z" fill="none" ${ink()}/>` +
  `<circle cx="${TENT_APEX[0]}" cy="${TENT_APEX[1] - 0.03}" r="0.11" fill="${C.mustard}" ${ink(0.04)}/>`

/** Furniture sizes in tiles; RoomView anchors each piece at the bottom-centre of the tiles it stands on, and the room parts at the end by their top-left. */
export const FURNITURE: Record<string, { w: number; h: number; body: string }> = {
  bed: { w: 1.1, h: 3.7, body: bed },
  'bed-turned': { w: 3.1, h: 1.45, body: bedTurned },
  maskBed: { w: 1.1, h: 3.45, body: maskBed },
  'maskBed-turned': { w: 3.1, h: 1.45, body: maskBedTurned },
  massageBed: { w: 1.1, h: 3.15, body: massageBed },
  'massageBed-turned': { w: 3.1, h: 1.15, body: massageBedTurned },
  bench: { w: 3.2, h: 1.35, body: bench },
  'bench-turned': { w: 1.1, h: 3.35, body: benchTurned },
  desk: { w: 3, h: 1.45, body: desk },
  'desk-turned': { w: 1.1, h: 3.45, body: deskTurned },
  plant: { w: 1, h: 1.6, body: plant },
  'decor-screen': { w: 5, h: 1.3, body: screen },
  'decor-screen-turned': { w: 1.1, h: 5.3, body: screenTurned },
  'decor-cabinet': { w: 3, h: 1.5, body: cabinet },
  'decor-cabinet-turned': { w: 1.1, h: 3.5, body: cabinetTurned },
  'decor-shelf': { w: 3, h: 1.3, body: shelf },
  'decor-shelf-turned': { w: 1.1, h: 3.3, body: shelfTurned },
  'decor-lotus': { w: 2, h: 1.1, body: lotus },
  'decor-lotus-turned': { w: 1.1, h: 2.1, body: lotusTurned },
  'decor-vase': { w: 1, h: 1.9, body: vase },
  'decor-vyPainting': { w: 1, h: 1.9, body: vyPainting },
  'decor-silkScreen': { w: 2, h: 1.75, body: silkScreen },
  'decor-silkScreen-turned': { w: 1.1, h: 2.75, body: silkScreenTurned },
  'decor-regularsBoard': { w: 2, h: 1.7, body: regularsBoard },
  'decor-regularsBoard-turned': { w: 1.1, h: 2.7, body: regularsBoardTurned },
  'decor-photoSinger': { w: 1, h: 1.7, body: photo(photoSinger) },
  'decor-photoMiss': { w: 1, h: 1.7, body: photo(photoMiss) },
  'decor-photoStar': { w: 1, h: 1.7, body: photo(photoStar) },
  'decor-photoChef': { w: 1, h: 1.7, body: photo(photoChef) },
  'decor-goldBoard': { w: 2, h: 1.75, body: goldBoard },
  'decor-goldBoard-turned': { w: 1.1, h: 2.75, body: goldBoardTurned },
  'decor-photoIdolSontung': { w: 1, h: 1.7, body: idolPhoto(photoIdolSontung) },
  'decor-photoIdolTaylor': { w: 1, h: 1.7, body: idolPhoto(photoIdolTaylor) },
  'decor-photoIdolGd': { w: 1, h: 1.7, body: idolPhoto(photoIdolGd) },
  'decor-photoIdolJennie': { w: 1, h: 1.7, body: idolPhoto(photoIdolJennie) },
  'decor-photoIdolHieuthuhai': { w: 1, h: 1.7, body: idolPhoto(photoIdolHieuthuhai) },
  'decor-photoIdolWeeknd': { w: 1, h: 1.7, body: idolPhoto(photoIdolWeeknd) },
  'decor-photoIdolTaeyang': { w: 1, h: 1.7, body: idolPhoto(photoIdolTaeyang) },
  'decor-photoIdolBieber': { w: 1, h: 1.7, body: idolPhoto(photoIdolBieber) },
  'decor-photoIdolDaesung': { w: 1, h: 1.7, body: idolPhoto(photoIdolDaesung) },
  'decor-starWall': { w: 2, h: 1.75, body: starWall },
  'decor-starWall-turned': { w: 1.1, h: 2.75, body: starWallTurned },
  'decor-maiBranch': { w: 1, h: 1.9, body: maiBranch },
  'decor-heartFrame': { w: 1, h: 1.9, body: heartFrame },
  'decor-roseVase': { w: 1, h: 1.9, body: roseVase },
  'decor-starLantern': { w: 1, h: 1.9, body: starLantern },
  'decor-flowerBasket': { w: 1, h: 1.9, body: flowerBasket },
  'decor-xmasTree': { w: 1, h: 1.9, body: xmasTree },
  'decor-certificate': { w: 1, h: 1.9, body: certificate },
  'decor-trophy': { w: 1, h: 1.9, body: trophy },
  'decor-merit': { w: 1, h: 1.9, body: merit },
  'decor-surfboard': { w: 1, h: 2.7, body: surfboard },
  'decor-lanternString': { w: 1, h: 2.7, body: lanternString },
  'decor-orchid': { w: 1, h: 2.4, body: orchid },
  'decor-tea': { w: 2, h: 0.9, body: tea },
  'decor-tea-turned': { w: 1.1, h: 2, body: teaTurned },
  'decor-slippers': { w: 2, h: 0.9, body: slippers },
  'decor-slippers-turned': { w: 1.1, h: 2, body: slippersTurned },
  'decor-planter': { w: 3, h: 1.1, body: planter },
  'decor-planter-turned': { w: 1.1, h: 3.1, body: planterTurned },
  teaChest: { w: 3, h: 1.35, body: teaChest },
  'teaChest-turned': { w: 1.1, h: 3.35, body: teaChestTurned },
  jar: { w: 1, h: 1.6, body: jar },
  bambooBench: { w: 3, h: 1.35, body: bambooBench },
  'bambooBench-turned': { w: 1.1, h: 3.35, body: bambooBenchTurned },
  bambooTea: { w: 2, h: 0.95, body: bambooTea },
  'bambooTea-turned': { w: 1.1, h: 2, body: bambooTeaTurned },
  bambooShelf: { w: 2, h: 1.7, body: bambooShelf },
  'bambooShelf-turned': { w: 1.1, h: 2.7, body: bambooShelfTurned },
  bambooLamp: { w: 1, h: 2.05, body: bambooLamp },
  clayJar: { w: 1, h: 1.45, body: clayJar },
  areca: { w: 1, h: 2, body: areca },
  steamTent: { w: 2, h: 2.6, body: steamTent },
  'steamTent-turned': { w: 2, h: 2.6, body: steamTent },
  stoneBed: { w: 1.1, h: 3.15, body: stoneBed },
  'stoneBed-turned': { w: 3.1, h: 1.15, body: stoneBedTurned },
  mudTub: { w: 2, h: 3.15, body: mudTub },
  'mudTub-turned': { w: 3, h: 2.15, body: mudTubTurned },
  scrubBed: { w: 1.1, h: 3.15, body: scrubBed },
  'scrubBed-turned': { w: 3.1, h: 1.15, body: scrubBedTurned },
  footChair: { w: 1.1, h: 2.2, body: footChair },
  'footChair-turned': { w: 2.1, h: 1.2, body: footChairTurned },
  nailDesk: { w: 2.1, h: 2.45, body: nailDesk },
  'nailDesk-turned': { w: 2.1, h: 2.45, body: nailDeskTurned },
  // Parts the room bakes today, cut on whole and half tiles so they land on the same pixels:
  // a lantern's top-left is (work tile x, 0); a bed slot's is half a tile left of and one tile above its head tile;
  // a bench mat's is half a tile left of and above the bench's top-left tile, framed on the default bench so the weave matches.
  lantern: { w: 1, h: 1.5, body: lantern(0.5) },
  bedSlot: { w: 2, h: 4.5, body: `<g transform="translate(0.5 -1)">${bedSlot(0, 2)}</g>` },
  benchMat: { w: 4, h: 3.5, body: `<defs>${MAT}</defs><g transform="translate(-1.5 -12.5)">${benchMat(2, 4, 13)}</g>` },
  ...NEW_DECOR,
}

/** The texture of an item kind: the first pieces keep their keys, the old decor is under `decor-`; turned, a piece that can turn has its upright picture under `-turned`. */
export function itemTexture(kind: ItemKind, turned = false): string {
  const key = kind in FURNITURE ? kind : `decor-${kind}`
  return turned && canTurn(kind) ? `${key}-turned` : key
}

export function furnitureTextures(): Record<string, string> {
  return Object.fromEntries(Object.entries(FURNITURE).map(([key, piece]) => [key, svgDoc([0, 0, piece.w, piece.h], TILE, piece.body)]))
}
