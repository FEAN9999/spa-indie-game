import { SHOP_X0 } from '../config'

// # wall  . floor  D door  S seat  C bed (customer lies here)  B bed head/foot  W owner work tile  E empty bed slot
// U stairs  R desk  P plant  H screen  K towel cabinet  L product shelf  O lotus basin  V peach vase  T tea table  G slipper rack  Y planter
/** The old 13-column shop, kept as it was for its room art and for saves from before version 33; the sim lays out SHOP_LAYOUT. */
export const SPA_LAYOUT_1A = [
  '#############',
  '#############',
  '#.B.B.E.EKKK#',
  '#.CWCW......#',
  '#.B.B.......#',
  '#..........P#',
  '#HHHHH.HHHHH#',
  '#.LLL....OOU#',
  '#..........U#',
  '#..........U#',
  '#...........#',
  '#..........V#',
  '#.YYY.......#',
  '#.SSS.......#',
  '#.......RRR.#',
  '#..TT.......#',
  '#P..GG.....P#',
  '######D######',
]

/** The old shop's rows on the wide grid: SHOP_X0 wall columns either side of every row. */
export function widen(rows: string[]): string[] {
  const wall = '#'.repeat(SHOP_X0)
  return rows.map(r => wall + r + wall)
}

/** The shop the sim lays out: the old shop at columns 12 to 24, every house column walled. */
export const SHOP_LAYOUT = widen(SPA_LAYOUT_1A)
