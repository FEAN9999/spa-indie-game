import { describe, expect, it } from 'vitest'
import { tileEq } from '../../src/sim/grid'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil } from './helpers'

const fresh = () => new SpaSim({ rng: createRng(1), autoSpawn: false })
const seatAndWait = (sim: SpaSim) => {
  const c = sim.spawnCustomer()
  advanceUntil(sim, () => c.state === 'waiting')
  return c
}
const startService = (sim: SpaSim) => {
  const c = seatAndWait(sim)
  sim.tapTile(c.seat!)
  advanceUntil(sim, () => c.state === 'inService')
  return c
}

describe('SpaSim owner and service', () => {
  it('tapping a floor tile walks the owner there', () => {
    const sim = fresh()
    sim.tapTile({ x: 2, y: 14 })
    advanceUntil(sim, () => tileEq(sim.ownerTile(), { x: 2, y: 14 }) && sim.owner.path.length === 0)
  })

  it('tapping a wall or furniture does nothing', () => {
    const sim = fresh()
    sim.tapTile({ x: 0, y: 5 })
    sim.tapTile({ x: 7, y: 7 })
    expect(sim.owner.path).toEqual([])
    expect(sim.owner.task).toBeNull()
  })

  it('tapping a waiting customer brings them to a chair and freezes time for the mini-game', () => {
    const sim = fresh()
    const ev: SimEvent[] = []
    const c = seatAndWait(sim)
    sim.tapTile(c.seat!)
    advanceUntil(sim, () => c.state === 'inService', 60_000, ev)
    expect(ev).toContainEqual({ type: 'serviceReady', customerId: c.id, stationId: 0 })
    expect(tileEq(sim.ownerTile(), sim.stations[0].work)).toBe(true)
    expect(sim.servingCustomerId).toBe(c.id)
    const m = sim.clock.minutes
    const p = c.patienceMs
    sim.advance(10_000)
    expect(sim.clock.minutes).toBe(m)
    expect(c.patienceMs).toBe(p)
  })

  it('completeService pays price plus tip, records a review and sends the customer home', () => {
    const sim = fresh()
    const c = startService(sim)
    sim.drainEvents()
    const before = sim.money
    sim.completeService(c.id, 3)
    expect(sim.money).toBe(before + 50_000)
    expect(sim.drainEvents()).toEqual(
      expect.arrayContaining([
        { type: 'paid', customerId: c.id, amount: 40_000, tip: 10_000, tile: sim.stations[0].chair },
        { type: 'review', customerId: c.id, score: 5 },
      ]),
    )
    expect(sim.stats).toMatchObject({ served: 1, income: 40_000, tips: 10_000 })
    expect(sim.stations[0].customerId).toBeNull()
    expect(sim.servingCustomerId).toBeNull()
    expect(c.state).toBe('leaving')
    expect(c.mood).toBe('happy')
  })

  it('shows a toast when every chair is busy', () => {
    const sim = fresh()
    sim.stations.forEach(s => (s.customerId = 999))
    const c = seatAndWait(sim)
    sim.tapTile(c.seat!)
    const ev: SimEvent[] = []
    advanceUntil(sim, () => ev.some(e => e.type === 'toast'), 30_000, ev)
    expect(ev).toContainEqual({ type: 'toast', key: 'stationsBusy' })
    expect(c.state).toBe('waiting')
    expect(sim.owner.task).toBeNull()
  })

  it('ignores taps on customers who are not waiting', () => {
    const sim = fresh()
    const c = sim.spawnCustomer() // still 'arriving' at the door
    sim.tapTile(sim.grid.door)
    expect(sim.owner.task).toBeNull()
    expect(c.state).toBe('arriving')
  })

  it('ignores taps while a service is pending or the day is over', () => {
    const sim = fresh()
    const c = startService(sim)
    sim.tapTile({ x: 2, y: 14 })
    expect(sim.owner.path).toEqual([])
    sim.completeService(c.id, 2)
    sim.dayOver = true
    sim.tapTile({ x: 2, y: 14 })
    expect(sim.owner.path).toEqual([])
  })

  it('does not end the day while a customer is being served', () => {
    const sim = fresh()
    const c = startService(sim)
    sim.clock.minutes = 1200
    sim.advance(5_000)
    expect(sim.dayOver).toBe(false)
    sim.completeService(c.id, 1)
    advanceUntil(sim, () => sim.dayOver, 30_000)
    expect(sim.customers).toHaveLength(0)
  })
})
