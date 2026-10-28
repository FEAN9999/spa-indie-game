import { C } from './palette'
import { f } from './round'

/**
 * One silk lantern hanging from (cx, y): its hook, a wooden cap, the silk in `col` with two ribs, a wooden foot and a tassel.
 * The sketch's lantern, drawn in its pixels (78 to a tile) and scaled down; `r` is the silk's radius in those pixels.
 * It stands alone, importing no art that draws furniture or rooms, so any of them may use it whatever loads first.
 */
export function silkLantern(cx: number, y: number, col: string, r = 17): string {
  const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}"`
  return (
    `<g transform="translate(${f(cx)} ${f(y)}) scale(${f(1 / 78)})">` +
    `<path d="M0,-14 V0" ${ink(3)}/>` +
    `<rect x="${-r * 0.5}" y="-3" width="${r}" height="7" rx="2" fill="${C.woodDark}" ${ink(3)}/>` +
    `<ellipse cx="0" cy="${r * 1.25}" rx="${r}" ry="${r * 1.15}" fill="${col}" ${ink(3.5)}/>` +
    `<path d="M${-r * 0.5},${r * 0.3} Q${-r * 0.75},${r * 1.25} ${-r * 0.5},${r * 2.2} M${r * 0.5},${r * 0.3} Q${r * 0.75},${r * 1.25} ${r * 0.5},${r * 2.2}" ${ink(2)} fill="none" opacity="0.45"/>` +
    `<rect x="${-r * 0.5}" y="${r * 2.3}" width="${r}" height="6" rx="2" fill="${C.woodDark}" ${ink(3)}/>` +
    `<path d="M0,${r * 2.3 + 6} v14" stroke="${col}" stroke-width="5" stroke-linecap="round"/></g>`
  )
}
