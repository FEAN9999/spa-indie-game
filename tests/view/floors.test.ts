import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'
import { SpaSim } from '../../src/sim/spa'
import type { Item } from '../../src/sim/items'
import type { Customer } from '../../src/sim/types'
import { carryTo, followFloor, climbPose, pills, showPills } from '../../src/view/floors'

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

const newSim = (layout = SPA_LAYOUT_1A) => new SpaSim({ rng: createRng(5), autoSpawn: false, layout })

describe('showPills', () => {
  it('waits for the floors day', () => {
    const sim = newSim()
    sim.day = 5
    expect(showPills(sim)).toBe(false)
    sim.day = 6
    expect(showPills(sim)).toBe(true)
  })

  it('is false for a layout without stairs', () => {
    const sim = newSim(SPA_LAYOUT_1A.map(r => r.replace(/U/g, '.')))
    sim.day = 6
    expect(showPills(sim)).toBe(false)
  })
})

describe('pills', () => {
  it('gives a viewed pill and a locked one with the price', () => {
    const sim = newSim()
    const ps = pills(sim, 1)
    expect(ps.map(p => [p.floor, p.state])).toEqual([[1, 'viewed'], [2, 'locked']])
    expect(ps[1].price).toBe(2_000_000)
  })

  it('puts the owner face on the owner floor', () => {
    const ps = pills(newSim(), 1)
    expect(ps.map(p => p.face)).toEqual([true, false])
  })

  it('marks an opened floor that is not viewed as open', () => {
    const sim = newSim()
    sim.floors = 2
    expect(pills(sim, 2).map(p => p.state)).toEqual(['open', 'viewed'])
  })

  it('shows the dot on floor 1 only while viewing another floor with someone waiting', () => {
    const sim = newSim()
    sim.floors = 2
    sim.customers.push({ state: 'waiting' } as Customer)
    expect(pills(sim, 2).map(p => p.dot)).toEqual([true, false])
    expect(pills(sim, 1).map(p => p.dot)).toEqual([false, false])
  })
})

describe('carryTo', () => {
  const plant: Item = { id: 3, kind: 'plant', x: 4, y: 12, flip: false, gift: false }

  it('moves a piece up by whole floors, keeping its row in the floor', () => {
    expect(carryTo(plant, 2)).toEqual({ ...plant, y: 30 })
  })

  it('brings it back down', () => {
    expect(carryTo(carryTo(plant, 2), 1).y).toBe(12)
  })

  it('leaves the original untouched', () => {
    carryTo(plant, 3)
    expect(plant.y).toBe(12)
  })
})
