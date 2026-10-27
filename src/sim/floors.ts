import { FLOOR_ROWS, MAX_FLOORS } from '../config'

/** The floor, from 1, that grid row `y` belongs to. */
export function floorOf(y: number): number {
  return Math.floor(y / FLOOR_ROWS) + 1
}

/**
 * The whole tall grid from floor 1's shell: every floor walled round, with floor 1's stairs repeated above it.
 * A shell without stairs stays one floor.
 */
export function towerOf(shell: string[]): string[] {
  if (!shell.some(r => r.includes('U'))) return shell
  if (shell.length !== FLOOR_ROWS) throw new Error(`A shell with stairs needs ${FLOOR_ROWS} rows`)
  const cols = shell[0].length
  const wall = '#'.repeat(cols)
  const upper = [wall, wall, ...shell.slice(2, FLOOR_ROWS - 1).map(r => `#${r.slice(1, -1).replace(/[^U]/g, '.')}#`), wall]
  return [...shell, ...Array.from({ length: MAX_FLOORS - 1 }, () => upper).flat()]
}
