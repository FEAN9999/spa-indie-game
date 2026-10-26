import { BED_SLOTS, footprint, ITEMS, seatTiles, workTile } from './items'
import type { Item } from './items'
import type { Tile, Vec } from './types'

export type Cell = 'wall' | 'floor' | 'door' | 'seat' | 'bed' | 'bedEnd' | 'work' | 'desk' | 'plant' | 'decor'

export type DecorKind = 'screen' | 'cabinet' | 'shelf' | 'lotus' | 'vase' | 'tea' | 'slippers' | 'planter'

export interface Grid {
  cols: number
  rows: number
  /** Indexed [y][x]. */
  cells: Cell[][]
  door: Tile
  seats: Tile[]
  /** The middle tile of each bed, where the customer lies. */
  beds: Tile[]
  works: Tile[]
  desks: Tile[]
  plants: Tile[]
  /** Head tile of each empty bed slot; see bedSlotAt. */
  bedSlots: Tile[]
  decor: Record<DecorKind, Tile[]>
}

/** Tiles in one row with consecutive x. */
export interface TileRun {
  left: number
  right: number
  row: number
}

const LEGEND: Record<string, Cell> = {
  '#': 'wall',
  '.': 'floor',
  D: 'door',
  S: 'seat',
  C: 'bed',
  B: 'bedEnd',
  W: 'work',
  E: 'floor',
  R: 'desk',
  P: 'plant',
}

const DECOR: Record<string, DecorKind> = {
  H: 'screen',
  K: 'cabinet',
  L: 'shelf',
  O: 'lotus',
  V: 'vase',
  T: 'tea',
  G: 'slippers',
  Y: 'planter',
}

export function parseLayout(rows: string[]): Grid {
  const cols = rows[0]?.length ?? 0
  if (rows.some(r => r.length !== cols)) throw new Error('Layout rows must have equal length')

  const decor = Object.fromEntries(Object.values(DECOR).map(k => [k, []])) as unknown as Record<DecorKind, Tile[]>
  const grid: Grid = {
    cols,
    rows: rows.length,
    cells: [],
    door: { x: -1, y: -1 },
    seats: [],
    beds: [],
    works: [],
    desks: [],
    plants: [],
    bedSlots: [],
    decor,
  }
  rows.forEach((row, y) => {
    grid.cells.push(
      [...row].map((ch, x) => {
        const t = { x, y }
        const kind = DECOR[ch]
        if (kind) {
          grid.decor[kind].push(t)
          return 'decor'
        }
        const cell = LEGEND[ch]
        if (!cell) throw new Error(`Unknown layout character '${ch}' at ${x},${y}`)
        if (ch === 'E') grid.bedSlots.push(t)
        else if (cell === 'door') grid.door = t
        else if (cell === 'seat') grid.seats.push(t)
        else if (cell === 'bed') grid.beds.push(t)
        else if (cell === 'work') grid.works.push(t)
        else if (cell === 'desk') grid.desks.push(t)
        else if (cell === 'plant') grid.plants.push(t)
        return cell
      }),
    )
  })
  return grid
}

/** Builds the floor grid from a bare shell, as layout rows or already parsed, plus the items standing on it. */
export function buildGrid(shell: string[] | Grid, items: Item[]): Grid {
  const grid = Array.isArray(shell) ? parseLayout(shell) : structuredClone(shell)
  grid.bedSlots = BED_SLOTS
  const sorted = [...items].sort((a, b) => a.id - b.id)
  for (const item of sorted) {
    const tiles = footprint(item)
    const set = (cell: Cell) => tiles.forEach(t => (grid.cells[t.y][t.x] = cell))
    if (ITEMS[item.kind].group === 'bed') {
      tiles.forEach((t, i) => (grid.cells[t.y][t.x] = i === 1 ? 'bed' : 'bedEnd'))
      const work = workTile(item)!
      grid.cells[work.y][work.x] = 'work'
      grid.beds.push(tiles[1])
      grid.works.push(work)
    } else if (ITEMS[item.kind].group === 'seat') {
      set('seat')
      grid.seats.push(...seatTiles(item))
    } else if (item.kind === 'plant') {
      set('plant')
      grid.plants.push(...tiles)
    } else {
      set('decor')
    }
  }
  return grid
}

export function inBounds(grid: Grid, t: Tile): boolean {
  return t.x >= 0 && t.y >= 0 && t.x < grid.cols && t.y < grid.rows
}

export function isWalkable(grid: Grid, t: Tile): boolean {
  if (!inBounds(grid, t)) return false
  const cell = grid.cells[t.y][t.x]
  return cell === 'floor' || cell === 'door' || cell === 'work'
}

/**
 * The head tile of the bed slot covering `t`, if any.
 * An empty bed slot covers its dashed basin on the wall above, its head tile and the two tiles below, like a bed.
 */
export function bedSlotAt(grid: Grid, t: Tile): Tile | undefined {
  return grid.bedSlots.find(s => s.x === t.x && t.y >= s.y - 1 && t.y <= s.y + 2)
}

/** True on a bed's middle tile and while stepping on or off it from either side. */
export function onBed(grid: Grid, p: Vec): boolean {
  return grid.beds.some(b => Math.abs(p.x - b.x) < 1 && Math.abs(p.y - b.y) < 0.5)
}

/** Groups tiles given in reading order (row, then x) into horizontal runs. */
export function tileRuns(tiles: Tile[]): TileRun[] {
  const runs: TileRun[] = []
  for (const t of tiles) {
    const last = runs[runs.length - 1]
    if (last && last.row === t.y && last.right + 1 === t.x) last.right = t.x
    else runs.push({ left: t.x, right: t.x, row: t.y })
  }
  return runs
}

export function tileEq(a: Tile, b: Tile): boolean {
  return a.x === b.x && a.y === b.y
}

export function manhattan(a: Tile, b: Tile): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

/** The tile a mover is standing on, or heading for if it is between two. */
export function tileOf(pos: Vec): Tile {
  return { x: Math.round(pos.x), y: Math.round(pos.y) }
}

/** True for a walkable tile one step from the seat: where whoever fetches the seat's customer stands. */
export const besideSeat =
  (grid: Grid, seat: Tile) =>
  (t: Tile): boolean =>
    isWalkable(grid, t) && manhattan(t, seat) === 1
