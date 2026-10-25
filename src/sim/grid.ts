import type { Tile } from './types'

export type Cell = 'wall' | 'floor' | 'door' | 'seat' | 'chair' | 'work' | 'desk' | 'plant'

export interface Grid {
  cols: number
  rows: number
  /** Indexed [y][x]. */
  cells: Cell[][]
  door: Tile
  seats: Tile[]
  chairs: Tile[]
  works: Tile[]
  desks: Tile[]
  plants: Tile[]
}

const LEGEND: Record<string, Cell> = {
  '#': 'wall',
  '.': 'floor',
  D: 'door',
  S: 'seat',
  C: 'chair',
  W: 'work',
  R: 'desk',
  P: 'plant',
}

export function parseLayout(rows: string[]): Grid {
  const cols = rows[0]?.length ?? 0
  if (rows.some(r => r.length !== cols)) throw new Error('Layout rows must have equal length')

  const grid: Grid = { cols, rows: rows.length, cells: [], door: { x: -1, y: -1 }, seats: [], chairs: [], works: [], desks: [], plants: [] }
  rows.forEach((row, y) => {
    grid.cells.push(
      [...row].map((ch, x) => {
        const cell = LEGEND[ch]
        if (!cell) throw new Error(`Unknown layout character '${ch}' at ${x},${y}`)
        const t = { x, y }
        if (cell === 'door') grid.door = t
        else if (cell === 'seat') grid.seats.push(t)
        else if (cell === 'chair') grid.chairs.push(t)
        else if (cell === 'work') grid.works.push(t)
        else if (cell === 'desk') grid.desks.push(t)
        else if (cell === 'plant') grid.plants.push(t)
        return cell
      }),
    )
  })
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

export function tileEq(a: Tile, b: Tile): boolean {
  return a.x === b.x && a.y === b.y
}

export function manhattan(a: Tile, b: Tile): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}
