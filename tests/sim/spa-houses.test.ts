import { describe, expect, it } from 'vitest'
import { staffCap } from '../../src/sim/crew'
import { isWalkable, tileEq } from '../../src/sim/grid'
import { findPath } from '../../src/sim/path'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { advanceUntil, hireStaff, seatAndWait } from './helpers'

const newSim = () => new SpaSim({ rng: createRng(5), autoSpawn: false })

/** Day 10 with `money`, nothing waiting in the events. */
const day10 = (money = 18_000_000) => {
  const sim = newSim()
  sim.day = 10
  sim.money = money
  sim.drainEvents()
  return sim
}

describe('buying a neighbour house', () => {
  it('goes on sale on day 10, the near house first on each side', () => {
    const sim = newSim()
    sim.money = 18_000_000
    sim.day = 9
    expect(sim.houseForSale('right')).toBe(false)
    expect(sim.buyHouse('right')).toBe('day')
    sim.day = 10
    expect([sim.houseForSale('left'), sim.houseForSale('right')]).toEqual([true, true])
    expect(sim.housePrice('left')).toBe(3_000_000)
    expect(sim.shownHouses()).toEqual({ left: 1, right: 1 })
    expect(sim.houses).toEqual({ left: 0, right: 0 })
  })

  it('buys all four, near then far, and says so', () => {
    const sim = day10()
    expect(sim.buyHouse('right')).toBeNull()
    expect(sim.houses).toEqual({ left: 0, right: 1 })
    expect(sim.money).toBe(15_000_000)
    const events = sim.drainEvents()
    expect(events).toContainEqual({ type: 'houseBought', house: { side: 'right', n: 1 } })
    expect(events).toContainEqual({ type: 'roomChanged' })
    expect(sim.housePrice('right')).toBe(6_000_000)
    expect(sim.buyHouse('right')).toBeNull()
    expect(sim.buyHouse('right')).toBe('max')
    expect(sim.houseForSale('right')).toBe(false)
    expect(sim.buyHouse('left')).toBeNull()
    expect(sim.buyHouse('left')).toBeNull()
    expect(sim.money).toBe(0)
    expect(sim.houses).toEqual({ left: 2, right: 2 })
    expect(sim.shownHouses()).toEqual({ left: 2, right: 2 })
  })

  it('never sells the far house before the near one', () => {
    const sim = day10(6_000_000)
    expect(sim.buyHouse('left')).toBeNull()
    expect(sim.money).toBe(3_000_000)
    expect(sim.houses.left).toBe(1)
  })

  it('refuses short of money and changes nothing', () => {
    const sim = day10(2_999_999)
    expect(sim.buyHouse('right')).toBe('money')
    expect(sim.houseForSale('right')).toBe(true)
    expect(sim.money).toBe(2_999_999)
    expect(sim.houses).toEqual({ left: 0, right: 0 })
    expect(sim.drainEvents()).toEqual([])
  })

  it('never sells to a branch', () => {
    const main = day10()
    const branch = SpaSim.newBranch('beach', main, createRng(9))
    branch.day = 12
    branch.money = 18_000_000
    expect(branch.houseProblem('right')).toBe('branch')
    expect(branch.houseForSale('right')).toBe(false)
    expect(branch.shownHouses()).toEqual({ left: 0, right: 0 })
  })

  it('walks from the door through the old wall into the new house', () => {
    const sim = day10()
    sim.buyHouse('right')
    const right = findPath(sim.grid, sim.grid.door, t => tileEq(t, { x: 29, y: 3 }))
    expect(right).not.toBeNull()
    expect(right!.some(t => t.x === 24)).toBe(true)
    sim.buyHouse('left')
    sim.buyHouse('left')
    const left = findPath(sim.grid, sim.grid.door, t => tileEq(t, { x: 1, y: 3 }))
    expect(left).not.toBeNull()
    expect(left!.some(t => t.x === 12)).toBe(true)
    expect(left!.some(t => t.x === 6)).toBe(true)
  })

  it('lets beds and benches stand in a bought house and reaches them', () => {
    const sim = day10()
    expect(sim.buy('bed', 27, 2, false)).not.toBeNull()
    expect(sim.buy('bench', 26, 13, false)).not.toBeNull()
    sim.buyHouse('right')
    expect(sim.buy('bed', 27, 2, false)).toBeNull()
    expect(sim.buy('bench', 26, 13, false)).toBeNull()
  })

  it('opens the house upstairs when floor 2 opens', () => {
    const sim = day10()
    sim.buyHouse('right')
    expect(sim.openFloor(2)).toBeNull()
    expect(isWalkable(sim.grid, { x: 27, y: 18 + 5 })).toBe(true)
    expect(isWalkable(sim.grid, { x: 33, y: 18 + 5 })).toBe(false)
  })

  it('keeps everyone where they are when a house is bought mid-walk', () => {
    const sim = day10()
    seatAndWait(sim)
    hireStaff(sim, 'technician')
    const walker = sim.spawnCustomer({ kind: 'office', service: 'shampoo' })
    advanceUntil(sim, () => walker.path.length > 0)
    // where each one stands and where they are headed; the path between may be planned again, as after any build change
    const where = () => JSON.stringify([...sim.customers, ...sim.staff].map(m => [m.pos, m.path.at(-1) ?? null]))
    const before = where()
    expect(sim.buyHouse('right')).toBeNull()
    expect(where()).toBe(before)
  })

  it('keeps the bought houses through a save', () => {
    const sim = day10()
    sim.buyHouse('right')
    sim.buyHouse('left')
    const back = SpaSim.fromSave(sim.toSave(), { rng: createRng(5), autoSpawn: false })
    expect(back.houses).toEqual({ left: 1, right: 1 })
    expect(isWalkable(back.grid, { x: 27, y: 3 })).toBe(true)
    expect(back.shownHouses()).toEqual({ left: 2, right: 2 })
  })

  it('adds one technician per house, up to 11', () => {
    expect(staffCap('technician', 1, 1)).toBe(4)
    expect(staffCap('technician', 3, 4)).toBe(11)
    expect(staffCap('receptionist', 3, 4)).toBe(1)
    const sim = day10()
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    expect(() => hireStaff(sim, 'technician')).toThrow('full')
    sim.buyHouse('right')
    expect(() => hireStaff(sim, 'technician')).not.toThrow()
  })
})
