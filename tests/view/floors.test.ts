import { describe, expect, it } from 'vitest'
import type { SpaSim } from '../../src/sim/spa'
import { followFloor, climbPose } from '../../src/view/floors'

const simWith = (owner: { y: number; task?: { kind: string }; climbMs?: number }) =>
  ({ owner: { pos: { x: 11, y: owner.y }, task: owner.task ?? null, climbMs: owner.climbMs } }) as unknown as SpaSim

describe('followFloor', () => {
  it('stays on the viewed floor while the owner has no task', () => {
    expect(followFloor(simWith({ y: 20 }), 1)).toBe(1)
  })

  it('goes to the owner floor while serving', () => {
    expect(followFloor(simWith({ y: 20, task: { kind: 'serve' } }), 1)).toBe(2)
  })

  it('stays put while the owner is mid-climb', () => {
    expect(followFloor(simWith({ y: 20, task: { kind: 'serve' }, climbMs: 400 }), 1)).toBe(1)
  })

  it('ignores a fetch task', () => {
    expect(followFloor(simWith({ y: 20, task: { kind: 'fetch' } }), 1)).toBe(1)
  })
})

describe('climbPose', () => {
  it('lifts and fades with the time left on the stairs', () => {
    expect(climbPose({ pos: { x: 11, y: 10 }, climbMs: 500 })).toEqual({ lift: 1.25, alpha: 0.5 })
  })

  it('is null when not climbing', () => {
    expect(climbPose({ pos: { x: 11, y: 10 } })).toBeNull()
    expect(climbPose({ pos: { x: 11, y: 10 }, climbMs: 0 })).toBeNull()
  })
})
