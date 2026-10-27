import { describe, expect, it } from 'vitest'
import { buildGrid, parseLayout, tileEq } from '../../src/sim/grid'
import { towerOf } from '../../src/sim/floors'
import { shellOf } from '../../src/sim/items'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'
import type { Tile } from '../../src/sim/types'
import { findPath } from '../../src/sim/path'

const open = parseLayout(['#####', '#...#', '#...#', '#####'])

describe('findPath', () => {
  it('walks a straight line, excluding start and including goal', () => {
    expect(findPath(open, { x: 1, y: 1 }, t => tileEq(t, { x: 3, y: 1 }))).toEqual([
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ])
  })

  it('returns [] when already at the goal and null when unreachable', () => {
    expect(findPath(open, { x: 1, y: 1 }, t => tileEq(t, { x: 1, y: 1 }))).toEqual([])
    const split = parseLayout(['#####', '#.#.#', '#####'])
    expect(findPath(split, { x: 1, y: 1 }, t => tileEq(t, { x: 3, y: 1 }))).toBeNull()
  })

  it('goes around obstacles', () => {
    const g = parseLayout(['#####', '#.R.#', '#...#', '#####'])
    const p = findPath(g, { x: 1, y: 1 }, t => tileEq(t, { x: 3, y: 1 }))!
    expect(p).toHaveLength(4)
    expect(p.some(t => tileEq(t, { x: 2, y: 1 }))).toBe(false)
  })

  it('may end on a non-walkable goal such as a seat', () => {
    const g = parseLayout(['#####', '#..S#', '#####'])
    expect(findPath(g, { x: 1, y: 1 }, t => tileEq(t, { x: 3, y: 1 }))).toEqual([
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ])
  })
})

describe('findPath across floors', () => {
  const tower = towerOf(shellOf(SPA_LAYOUT_1A))
  const to = (x: number, y: number) => (t: Tile) => tileEq(t, { x, y })

  it('steps from foot to foot when both floors are open', () => {
    const p = findPath(buildGrid(tower, [], 2), { x: 9, y: 13 }, to(5, 30))!
    const i = p.findIndex(t => tileEq(t, { x: 11, y: 10 }))
    expect(i).toBeGreaterThan(-1)
    expect(p[i + 1]).toEqual({ x: 11, y: 28 })
  })

  it('finds nothing while the upper floor is locked', () => {
    expect(findPath(buildGrid(tower, [], 1), { x: 9, y: 13 }, to(5, 30))).toBeNull()
  })
})
