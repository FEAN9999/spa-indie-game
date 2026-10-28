import { C } from './palette'
import { svgDoc } from './svg'

/** The map's size in pixels, drawn one to one. */
const W = 940
const H = 1040

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
/** A band along `d`: its edge in `edge`, then its middle in `fill` on top. */
const band = (d: string, edge: string, fill: string, w: number, inner: number) =>
  `<path d="${d}" stroke="${edge}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${fill}" stroke-width="${inner}" fill="none" stroke-linecap="round"/>`

const RIVER = 'M530,-10 C470,180 700,260 630,420 C570,570 760,630 950,600'
const STREETS = ['M-10,525 H950', 'M290,-10 V920', 'M370,525 Q530,670 690,800', 'M160,-10 Q170,240 290,320', 'M630,525 Q720,320 780,-10']
/** The trees in the parks: [x, y, r]. */
const TREES = [[80, 70, 26], [120, 100, 20], [450, 90, 22], [410, 700, 24], [450, 730, 18], [890, 380, 22], [70, 800, 26], [110, 850, 22], [870, 70, 18]]
/** Uptown's glass towers: their bottom-centre, width and height. */
const TOWERS = [[870, 120, 36, 116], [912, 160, 30, 90]]

/** A shophouse with a red-tiled roof and a teal door, for the main shop. */
const shophouse = (x: number, y: number) =>
  `<g transform="translate(${x} ${y})"><rect x="-38" y="-30" width="76" height="60" fill="${C.cream}" ${ink(4)}/>` +
  `<path d="M-46,-28 L0,-58 L46,-28Z" fill="${C.terracotta}" ${ink(4)}/><rect x="-12" y="2" width="24" height="28" fill="${C.teal}" ${ink(3)}/></g>`

/** A yellow old-town house with a dark roof and a lantern by its door. */
const oldHouse = (x: number, y: number, lantern: string) =>
  `<g transform="translate(${x} ${y})"><rect x="-28" y="-24" width="56" height="50" fill="${C.wall}" ${ink(4)}/>` +
  `<path d="M-34,-22 L0,-46 L34,-22Z" fill="${C.woodDark}" ${ink(4)}/><circle cx="0" cy="6" r="9" fill="${lantern}" ${ink(3)}/></g>`

/** A glass tower standing on (x, y), with a row of windows every 22 px. */
const tower = ([x, y, w, h]: number[]) => {
  const windows: string[] = []
  for (let k = 0; k < Math.floor(h / 22); k++) windows.push(`M${x - w / 2 + 6},${y - h + 14 + k * 22} h${w - 12}`)
  return `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="${C.tin}" ${ink(4)}/><path d="${windows.join(' ')}" stroke="${C.glass}" stroke-width="4"/>`
}

/**
 * The chain's map, 940 × 1040 px with rounded corners: a flat painted Saigon of city blocks, a bending river with a
 * bridge, a few streets, trees in the parks, the beach and the sea in the bottom-right corner, and a landmark by each
 * place: the main shop's shophouse, the old town's yellow houses, uptown's towers, and the beach's umbrella and palm.
 * The pins and their labels go on top, drawn by the map screen.
 */
export function mapTexture(): string {
  const out: string[] = [`<defs><clipPath id="map"><rect width="${W}" height="${H}" rx="30"/></clipPath></defs><g clip-path="url(#map)">`]
  out.push(`<rect width="${W}" height="${H}" fill="${C.mapLand}"/>`)
  for (let y = 14; y < H; y += 104)
    for (let x = 14; x < W; x += 118) out.push(`<rect x="${x}" y="${y}" width="98" height="84" rx="12" fill="${C.paper}" stroke="${C.tileSeam}" stroke-width="3"/>`)

  // the beach and the sea, with a few waves
  out.push(`<path d="M400,${H} Q650,870 ${W},700 V${H}Z" fill="${C.sandBeach}" ${ink(4)}/>`, `<path d="M490,${H} Q700,920 ${W},780 V${H}Z" fill="${C.sea}" ${ink(4)}/>`)
  const waves = [[710, 970], [830, 920], [860, 1010], [630, 1020]].map(([x, y]) => `M${x},${y} q12,-9 24,0 t24,0`)
  out.push(`<path d="${waves.join(' ')}" stroke="${C.cream}" stroke-width="5" fill="none" stroke-linecap="round"/>`)

  // the river with its glints, the streets over it and the bridge where the big one crosses
  out.push(band(RIVER, C.ink, C.river, 96, 86))
  out.push(`<path d="M570,180 q10,-8 20,0 M635,380 q10,-8 20,0 M730,580 q10,-8 20,0" stroke="${C.cream}" stroke-width="4" fill="none" stroke-linecap="round"/>`)
  for (const d of STREETS) out.push(band(d, C.sidewalkLine, C.cream, 34, 24))
  out.push(`<path d="M570,509 H700 M570,541 H700" stroke="${C.woodDark}" stroke-width="7"/>`)

  for (const [x, y, r] of TREES) out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.leaf}" ${ink(3.5)}/>`)

  // the landmarks
  out.push(shophouse(230, 390))
  ;[C.lantern, C.mustard, C.tealLight].forEach((lantern, i) => out.push(oldHouse(40 + i * 62, 64 + (i % 2) * 8, lantern)))
  for (const t of TOWERS) out.push(tower(t))
  out.push(
    `<g transform="translate(895 835)"><path d="M0,40 L8,-20" stroke="${C.ink}" stroke-width="5"/>` +
      `<path d="M-40,-4 Q8,-56 56,-12 Q8,-24 -40,-4Z" fill="${C.lantern}" ${ink(4)}/></g>`,
  )
  out.push(
    `<g transform="translate(520 940)"><path d="M0,40 Q-6,0 10,-30" stroke="${C.woodDark}" stroke-width="9" fill="none" stroke-linecap="round"/>` +
      `<path d="M10,-30 q-40,-12 -56,8 q26,-4 56,-8 q-20,-34 -50,-30 q34,10 50,30 q8,-36 40,-40 q-26,18 -40,40 q40,-16 56,6 q-32,-6 -56,-6Z" fill="${C.leaf}" ${ink(3.5)}/></g>`,
  )
  out.push('</g>')
  return svgDoc([0, 0, W, H], 1, out.join(''))
}
