import { TILE } from '../config'
import { C, SKIN } from './palette'
import { FINE, outline, rect } from './room'
import { liftScene } from './lift'
import { svgDoc } from './svg'

/**
 * The street in front of the main shop once the restaurant is bought: the ground across the road, the eight pieces bought for it, and the
 * marks over what is still for sale. Everything is in tiles from each texture's top-left; the view places them by BUSTLE_ART.
 */

/** A customer's skin tone, as a colour the SVG takes. */
const SKIN_TONE = `#${SKIN[1].toString(16).padStart(6, '0')}`
const FONT = `font-family="'Be Vietnam Pro', sans-serif" font-weight="800" text-anchor="middle"`
const f = (n: number) => Math.round(n * 1000) / 1000
const circle = (cx: number, cy: number, r: number, fill: string, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${extra}/>`
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`
const line = (d: string, stroke: string, w: number, extra = '') => `<path d="${d}" stroke="${stroke}" stroke-width="${w}" fill="none" stroke-linecap="round" ${extra}/>`
const box = (x: number, y: number, w: number, h: number, fill: string, extra = '') => rect(f(x), f(y), f(w), f(h), fill, extra)
const text = (x: number, y: number, size: number, fill: string, words: string) => `<text x="${f(x)}" y="${f(y)}" ${FONT} font-size="${size}" fill="${fill}">${words}</text>`

/** Each texture's size in tiles. */
export const BUSTLE_ART = {
  /** One 6-column stretch of what the open street adds under the old road: the second lane, the far sidewalk, the bare lots. */
  'bustle-strip': { w: 6, h: 5 },
  'bustle-tree': { w: 1.8, h: 2.4 },
  'bustle-lamp': { w: 1.3, h: 2.7 },
  'bustle-bench': { w: 1.8, h: 0.95 },
  'bustle-banhMi': { w: 3.1, h: 1.7 },
  'bustle-sugarcane': { w: 3.1, h: 1.7 },
  'bustle-busStop': { w: 10, h: 4.9 },
  'bustle-park': { w: 18, h: 4 },
  'bustle-market-day': { w: 18, h: 4.4 },
  'bustle-market-night': { w: 18, h: 4.4 },
  /** The green city bus, seen from the side on the new lane. */
  'bustle-bus': { w: 4.4, h: 0.9 },
  'bustle-plus': { w: 0.9, h: 0.9 },
  'bustle-ghost': { w: 0.7, h: 0.7 },
  'bustle-frame-busStop': { w: 9.8, h: 3.9 },
  'bustle-frame-park': { w: 18, h: 3.9 },
  'bustle-frame-nightMarket': { w: 18, h: 3.9 },
} as const
export type BustleArtKey = keyof typeof BUSTLE_ART

/** Where each lamp's light is, in its texture's tiles: the street lamp's head, the park's two lamps, the night market's lanterns. */
export const LAMP_HEAD = { x: 0.92, y: 0.32 }
export const PARK_LAMPS = [{ x: 2.42, y: 0.45 }, { x: 15.82, y: 0.45 }]
export const MARKET_LANTERNS = Array.from({ length: 12 }, (_, i) => ({ x: 1 + i * 1.4, y: 0.36 }))
/** The bus stop's shelter and its sign stand on the far sidewalk between these columns of its texture; passers-by go round behind them. */
export const BUS_SHELTER = { from: 1.6, to: 7.45 }
/** The middle of the bus sign's pole, just right of the shelter's roof. */
const BUS_SIGN_X = 7.05

const doc = (key: BustleArtKey, body: string) => svgDoc([0, 0, BUSTLE_ART[key].w, BUSTLE_ART[key].h], TILE, liftScene(body, TILE))

/** A chibi like the game's customers, the middle of their body at (x, y), with a nón lá when `hat`. */
function chibi(x: number, y: number, shirt: string, hair: string, hat = false): string {
  return (
    ellipse(x, y + 0.3, 0.26, 0.07, C.ink, 'opacity="0.2"') +
    box(x - 0.2, y - 0.12, 0.4, 0.42, shirt, `rx="0.14" ${outline(0.035)}`) +
    circle(x, y - 0.33, 0.24, SKIN_TONE, outline(0.035)) +
    `<path d="M${f(x - 0.24)},${f(y - 0.33)} a0.24,0.24 0 0 1 0.48,0 q-0.24,-0.09 -0.48,0Z" fill="${hair}" ${outline(0.03)}/>` +
    circle(x - 0.12, y - 0.27, 0.04, C.lotus) +
    circle(x + 0.12, y - 0.27, 0.04, C.lotus) +
    (hat ? `<path d="M${f(x - 0.47)},${f(y - 0.4)} L${f(x)},${f(y - 0.82)} L${f(x + 0.47)},${f(y - 0.4)} Z" fill="${C.mat}" ${outline(0.035)}/>` : '')
  )
}

function strip(): string {
  let joints = ''
  for (let x = 0.5; x < 6; x += 1) joints += `M${x},1 V1.7 `
  let tufts = ''
  for (const [x, y] of [[0.8, 2.6], [2.4, 4.1], [3.7, 2.9], [5.2, 3.8], [1.6, 4.6]]) tufts += `M${x},${y} l-0.1,-0.22 M${x},${y} v-0.28 M${x},${y} l0.1,-0.22 `
  return (
    box(0, 0, 6, 1, C.road) +
    `<path d="M0,0.1 H6" stroke="${C.cream}" stroke-width="0.07" stroke-dasharray="0.55 0.45"/>` +
    box(0, 1, 6, 0.7, C.sidewalk) +
    line(joints, C.sidewalkLine, FINE) +
    box(0, 0.97, 6, 0.06, C.sidewalkLine) +
    box(0, 1.7, 6, 3.3, C.lotDirt) +
    line(tufts, C.leafLight, 0.05)
  )
}

function tree(): string {
  return (
    box(0.53, 2, 0.74, 0.36, C.stoneLight, outline(0.035)) +
    line('M0.78,2 v0.36 M1.02,2 v0.36 M0.53,2.18 h0.74', C.stone, 0.025) +
    box(0.83, 1.4, 0.14, 0.7, C.woodDark, outline(0.03)) +
    circle(0.9, 0.92, 0.82, C.leaf, outline(0.06)) +
    circle(0.64, 0.68, 0.34, C.leafLight) +
    circle(1.22, 1.2, 0.2, C.leafLight) +
    circle(1.1, 0.48, 0.14, C.leafLight)
  )
}

function lamp(): string {
  return (
    ellipse(0.3, 2.6, 0.2, 0.08, C.stone, outline(0.03)) +
    box(0.24, 0.22, 0.12, 2.38, C.stone, outline(0.03)) +
    line('M0.3,0.3 q0.3,-0.25 0.62,-0.02', C.stone, 0.09) +
    ellipse(LAMP_HEAD.x, LAMP_HEAD.y, 0.26, 0.12, C.cream, outline(0.035))
  )
}

function bench(): string {
  return (
    box(0.2, 0.55, 0.16, 0.32, C.stone, outline(0.02)) +
    box(1.44, 0.55, 0.16, 0.32, C.stone, outline(0.02)) +
    box(0.1, 0.05, 1.6, 0.2, C.benchStoneDark, `rx="0.05" ${outline(0.04)}`) +
    box(0.1, 0.25, 1.6, 0.32, C.benchStone, `rx="0.05" ${outline(0.04)}`)
  )
}

function banhMi(): string {
  let loaves = ''
  for (let i = 0; i < 3; i++) {
    const x = 0.62 + i * 0.48
    loaves += ellipse(x, 0.43, 0.26, 0.1, C.mustard, outline(0.03)) + line(`M${f(x - 0.07)},0.38 l0.06,0.1 M${f(x + 0.05)},0.38 l0.06,0.1`, C.mustardDark, 0.03)
  }
  return (
    circle(0.35, 1.5, 0.17, C.ink) +
    circle(1.85, 1.5, 0.17, C.ink) +
    box(0, 0.7, 2.2, 0.78, C.cream, `rx="0.08" ${outline(0.05)}`) +
    box(0.25, 0.88, 1.7, 0.36, C.lantern, `rx="0.05" ${outline(0.04)}`) +
    text(1.1, 1.14, 0.24, C.cream, 'BÁNH MÌ') +
    box(0.1, 0.12, 2, 0.6, C.glass, outline(0.05)) +
    loaves +
    chibi(2.6, 1.0, C.terracotta, C.deepBrown, true)
  )
}

function sugarcane(): string {
  let cane = ''
  for (let i = 0; i < 4; i++) cane += box(0, 0.32 + i * 0.1, 1.5, 0.09, i % 2 ? C.caneLight : C.cane, outline(0.015))
  return (
    circle(0.35, 1.5, 0.16, C.ink) +
    circle(1.75, 1.5, 0.16, C.ink) +
    box(0.05, 0.75, 2, 0.72, C.green, `rx="0.08" ${outline(0.05)}`) +
    box(0.25, 0.9, 1.6, 0.32, C.cream, `rx="0.05" ${outline(0.04)}`) +
    text(1.05, 1.13, 0.21, C.teal, 'NƯỚC MÍA') +
    cane +
    box(1.5, 0.05, 0.5, 0.72, C.silver, `rx="0.06" ${outline(0.04)}`) +
    circle(1.75, 0.28, 0.14, C.stoneLight, outline(0.025)) +
    box(2.23, 0.82, 0.34, 0.34, C.lantern, `rx="0.06" ${outline(0.035)}`) +
    box(2.65, 1.18, 0.34, 0.34, C.lantern, `rx="0.06" ${outline(0.035)}`)
  )
}

/** The bus stop across from the spa, its top at the middle of the new lane: the bay marked on the road, the shelter on the far sidewalk, the paved lot. */
function busStop(): string {
  let seams = ''
  for (let x = 1; x < 9.8; x += 0.8) seams += `M${f(x)},1.75 v3.05 `
  for (let y = 2.55; y < 4.8; y += 0.8) seams += `M0.2,${f(y)} h9.6 `
  let flowers = ''
  for (let i = 0; i < 10; i++) flowers += circle(1.4 + i * 0.8, 4.1, 0.12, i % 2 ? C.lotus : C.mustard, outline(0.02))
  return (
    box(1.4, 0.05, 5.6, 0.78, 'none', `stroke="${C.mustard}" stroke-width="0.06" stroke-dasharray="0.3 0.2"`) +
    text(4.2, 0.58, 0.32, C.mustardDark, 'XE BUÝT') +
    box(0.2, 1.75, 9.6, 3.05, C.tile, outline(0.04)) +
    line(seams, C.tileSeam, FINE) +
    box(1, 3.75, 8.2, 0.7, C.parkGrass, `rx="0.2" ${outline(0.04)}`) +
    flowers +
    box(8.2, 2.45, 1.5, 0.7, C.woodDark, `rx="0.06" ${outline(0.04)}`) +
    circle(8.55, 2.4, 0.25, C.leaf, outline(0.03)) +
    circle(9.05, 2.35, 0.28, C.leafLight, outline(0.03)) +
    box(1.95, 1.15, 0.12, 1.1, C.stone) +
    box(6.35, 1.15, 0.12, 1.1, C.stone) +
    box(2.2, 1.85, 4, 0.4, C.wood, `rx="0.06" ${outline(0.04)}`) +
    chibi(3.2, 2.05, C.cobalt, C.deepBrown) +
    box(1.6, 0.95, 5, 0.55, C.teal, `rx="0.06" ${outline(0.05)}`) +
    box(1.6, 0.95, 5, 0.16, C.tealLight) +
    box(BUS_SIGN_X - 0.05, 0.85, 0.1, 1.15, C.stone, outline(0.02)) +
    circle(BUS_SIGN_X, 0.85, 0.34, C.cobalt, outline(0.04)) +
    text(BUS_SIGN_X, 0.93, 0.2, C.cream, 'BUS')
  )
}

function parkTree(x: number, y: number): string {
  return circle(x, y, 0.62, C.leaf, outline(0.05)) + circle(x - 0.2, y - 0.18, 0.26, C.leafLight)
}

/** The lotus park across the road, its top at the far sidewalk's edge: grass, paths, the pond, a flower bed, a bench, trees and two lamps. */
function park(): string {
  // the pond is drawn round its middle; its pads, with a flower on some
  const pads = [[-2.3, -0.1, 1], [-1.1, 0.35, 0], [1.3, -0.25, 1], [2.4, 0.3, 0], [0.1, -0.5, 1], [-2.9, 0.3, 0]]
  let lotus = ''
  for (const [dx, dy, flower] of pads) lotus += circle(9 + dx, 2.6 + dy, 0.26, C.leafLight, outline(0.03)) + (flower ? circle(9.05 + dx, 2.55 + dy, 0.12, C.lotus, outline(0.02)) : '')
  let bed = ''
  for (let i = 0; i < 5; i++) bed += circle(3.4 + i * 0.42, 2.02, 0.11, i % 2 ? C.mustard : C.lotus, outline(0.02))
  let lamps = ''
  for (const p of PARK_LAMPS) lamps += box(p.x - 0.05, p.y, 0.1, 0.6, C.stone) + circle(p.x, p.y, 0.16, C.cream, outline(0.03))
  return (
    box(0.1, 0.85, 17.8, 3.05, C.parkGrass, `rx="0.3" ${outline(0.05)}`) +
    box(0.1, 1.05, 17.8, 0.45, C.mat) +
    box(2.2, 1.05, 0.45, 2.85, C.mat) +
    box(15.6, 1.05, 0.45, 2.85, C.mat) +
    ellipse(9, 2.6, 3.5, 1, C.waterDeep, outline(0.06)) +
    ellipse(9, 2.55, 3.2, 0.8, C.water) +
    lotus +
    box(3.1, 1.8, 2.2, 0.45, C.woodLight, `rx="0.1" ${outline(0.03)}`) +
    bed +
    box(12, 1.65, 1.5, 0.3, C.benchStone, `rx="0.05" ${outline(0.03)}`) +
    parkTree(1.1, 2.95) +
    parkTree(16.9, 2.9) +
    parkTree(4.6, 3.25) +
    parkTree(13.6, 3.3) +
    lamps
  )
}

/** The night market across from the restaurant, its top above the far sidewalk where its string of lanterns hangs: four stalls, set out from 17:00 and under tarps before. */
function market(open: boolean): string {
  const out: string[] = [box(0.1, 1.25, 17.8, 3.05, C.tile, outline(0.05))]
  let seams = ''
  for (let x = 1.1; x < 17.9; x += 1) seams += `M${f(x)},1.25 v3.05 `
  out.push(line(seams, C.tileSeam, FINE))
  const awnings = [[C.terracotta, C.cream], [C.teal, C.cream], [C.mustard, C.cream], [C.lotus, C.cream]]
  const goods = [C.lantern, C.mustard, C.green, C.lotus, C.cream, C.mustardDark]
  for (let i = 0; i < 4; i++) {
    const sx = 0.5 + i * 4.4
    out.push(box(sx, 2.45, 3.8, 0.95, C.woodLight, `rx="0.06" ${outline(0.05)}`))
    if (open) {
      for (let k = 0; k < 10; k++) {
        const col = awnings[i][k % 2]
        out.push(box(sx - 0.1 + k * 0.4, 1.65, 0.4, 0.7, col), circle(sx + 0.1 + k * 0.4, 2.35, 0.2, col))
      }
      let scallops = `M${f(sx - 0.1)},2.35`
      for (let k = 0; k < 10; k++) scallops += ' a0.2,0.2 0 0 0 0.4,0'
      out.push(`<path d="${scallops}" fill="none" ${outline(0.04)}/>`, box(sx - 0.1, 1.65, 4, 0.7, 'none', outline(0.05)))
      for (let k = 0; k < 6; k++) out.push(circle(sx + 0.4 + k * 0.6, 2.9, 0.17, goods[(k + i) % goods.length], outline(0.025)))
      for (const [dx, col] of [[0.4, C.lantern], [1.6, C.cobalt], [2.8, C.lantern]] as const)
        out.push(box(sx + dx, 3.7, 0.32, 0.32, col, `rx="0.06" ${outline(0.03)}`))
    } else {
      out.push(box(sx - 0.05, 2.15, 3.9, 1.3, C.tin, `rx="0.1" ${outline(0.05)}`))
      out.push(line(`M${f(sx + 0.9)},2.15 v1.3 M${f(sx + 1.9)},2.15 v1.3 M${f(sx + 2.9)},2.15 v1.3`, C.tinRib, 0.04))
    }
  }
  if (!open) out.push(box(0.9, 1.45, 3.6, 0.55, C.cream, `rx="0.1" ${outline(0.04)}`), `<text x="2.7" y="1.83" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" text-anchor="middle" font-size="0.28" fill="${C.ink}">Chợ mở 17:00</text>`)
  // the string of lanterns between two posts on the far sidewalk
  let d = 'M0.25,0.08'
  for (const p of MARKET_LANTERNS) d += ` Q${f(p.x - 0.7)},0.28 ${f(p.x)},0.12`
  d += ' Q17.4,0.28 17.75,0.08'
  out.push(box(0.2, 0, 0.1, 1.1, C.woodDark), box(17.7, 0, 0.1, 1.1, C.woodDark), line(d, C.ink, 0.03))
  MARKET_LANTERNS.forEach((p, i) => out.push(box(p.x - 0.07, 0.12, 0.14, 0.06, C.woodDark), ellipse(p.x, p.y, 0.14, 0.19, i % 2 ? C.mustard : C.lantern, outline(0.03))))
  return out.join('')
}

/** The green city bus: body, cream stripe, windows, the door at its front (right) end, two wheels. */
function bus(): string {
  let windows = ''
  for (let x = 0.95; x < 3.9; x += 0.6) windows += `M${f(x)},0.12 v0.3 `
  return (
    box(0, 0.04, 4.4, 0.72, C.leafLight, `rx="0.15" ${outline(0.06)}`) +
    box(0.35, 0.12, 3.6, 0.3, C.glass, outline(0.03)) +
    line(windows, C.ink, 0.03) +
    box(0, 0.5, 4.4, 0.1, C.cream) +
    box(3.65, 0.42, 0.5, 0.34, C.cream, outline(0.03)) +
    circle(0.8, 0.74, 0.15, C.ink) +
    circle(3.5, 0.74, 0.15, C.ink)
  )
}

const plus = (w: number) => {
  const r = w / 2 - 0.03
  const c = w / 2
  return (
    circle(c, c, r, C.cream, `stroke="${C.ink}" stroke-width="0.05" stroke-dasharray="0.13 0.09"`) +
    line(`M${f(c - r * 0.45)},${f(c)} h${f(r * 0.9)} M${f(c)},${f(c - r * 0.45)} v${f(r * 0.9)}`, C.teal, f(r * 0.22))
  )
}
const ghost = (w: number) => circle(w / 2, w / 2, w / 2 - 0.03, C.cream, `fill-opacity="0.5" stroke="${C.ink}" stroke-width="0.04" stroke-dasharray="0.1 0.08" opacity="0.8"`)
const frame = (w: number, h: number) =>
  box(0.05, 0.05, w - 0.1, h - 0.1, C.cream, `fill-opacity="0.22" rx="0.25" stroke="${C.ink}" stroke-width="0.05" stroke-dasharray="0.28 0.18"`)

export function bustleTextures(): Record<BustleArtKey, string> {
  return {
    'bustle-strip': doc('bustle-strip', strip()),
    'bustle-tree': doc('bustle-tree', tree()),
    'bustle-lamp': doc('bustle-lamp', lamp()),
    'bustle-bench': doc('bustle-bench', bench()),
    'bustle-banhMi': doc('bustle-banhMi', banhMi()),
    'bustle-sugarcane': doc('bustle-sugarcane', sugarcane()),
    'bustle-busStop': doc('bustle-busStop', busStop()),
    'bustle-park': doc('bustle-park', park()),
    'bustle-market-day': doc('bustle-market-day', market(false)),
    'bustle-market-night': doc('bustle-market-night', market(true)),
    'bustle-bus': doc('bustle-bus', bus()),
    'bustle-plus': doc('bustle-plus', plus(BUSTLE_ART['bustle-plus'].w)),
    'bustle-ghost': doc('bustle-ghost', ghost(BUSTLE_ART['bustle-ghost'].w)),
    'bustle-frame-busStop': doc('bustle-frame-busStop', frame(BUSTLE_ART['bustle-frame-busStop'].w, BUSTLE_ART['bustle-frame-busStop'].h)),
    'bustle-frame-park': doc('bustle-frame-park', frame(BUSTLE_ART['bustle-frame-park'].w, BUSTLE_ART['bustle-frame-park'].h)),
    'bustle-frame-nightMarket': doc('bustle-frame-nightMarket', frame(BUSTLE_ART['bustle-frame-nightMarket'].w, BUSTLE_ART['bustle-frame-nightMarket'].h)),
  }
}
