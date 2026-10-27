import { C } from './palette'
import { svgDoc } from './svg'

const LINE = `stroke="${C.ink}" stroke-width="3"`

/** The Xông lá pot: a cobalt pot heaped with green leaves over a small fire, two curls of steam above. */
export function steamTextures(): Record<string, string> {
  return {
    'st-pot': svgDoc(
      [0, -6, 132, 106],
      2,
      `<g stroke="#9FB8BF" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"><path d="M48,26 q7,-8 0,-16 q-7,-8 0,-14"/><path d="M84,26 q7,-8 0,-16 q-7,-8 0,-14"/></g>` +
        `<path d="M22,36 H110 C110,66 94,80 66,80 C38,80 22,66 22,36Z" fill="${C.cobalt}" ${LINE}/>` +
        `<ellipse cx="66" cy="36" rx="44" ry="9" fill="${C.leaf}" ${LINE}/>` +
        `<path d="M40,92 l8,-12 l8,12 M58,92 l8,-14 l8,14 M76,92 l8,-12 l8,12" fill="${C.mustard}" stroke="${C.terracotta}" stroke-width="2" stroke-linejoin="round"/>`,
    ),
  }
}
