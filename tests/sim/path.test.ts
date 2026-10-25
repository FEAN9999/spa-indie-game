import { describe, expect, it } from 'vitest'
import { parseLayout, tileEq } from '../../src/sim/grid'
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
