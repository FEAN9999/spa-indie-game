import { HOUSE_COLS, HOUSES_PER_SIDE, SHOP_COLS, SHOP_X0 } from '../config'

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

/** How many neighbour houses the shop has bought on each side, the inner one first. */
export interface Houses {
  left: number
  right: number
}

export const NO_HOUSES: Houses = { left: 0, right: 0 }

/**
 * Floor 1's shell with the bought houses opened: rows 2 to 16 of each house's five columns and of the wall it shares with
 * the shop become floor, its outer wall stays. Rows 0, 1 and 17 stay wall. The floors above follow through towerOf.
 */
export function withHouses(shell: string[], houses: Houses): string[] {
  if (houses.left === 0 && houses.right === 0) return shell
  if (shell[0].length !== SHOP_COLS) throw new Error(`houses need a shell ${SHOP_COLS} columns wide`)
  const open = new Set<number>()
  for (let n = 1; n <= Math.min(houses.left, HOUSES_PER_SIDE); n++)
    for (let x = SHOP_X0 - n * HOUSE_COLS + 1; x <= SHOP_X0 - (n - 1) * HOUSE_COLS; x++) open.add(x)
  const right = SHOP_COLS - 1 - SHOP_X0
  for (let n = 1; n <= Math.min(houses.right, HOUSES_PER_SIDE); n++)
    for (let x = right + (n - 1) * HOUSE_COLS; x < right + n * HOUSE_COLS; x++) open.add(x)
  return shell.map((row, y) => (y < 2 || y > 16 ? row : [...row].map((c, x) => (open.has(x) ? '.' : c)).join('')))
}
