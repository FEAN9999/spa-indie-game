import { describe, expect, it } from 'vitest'
import { isWalkable, tileEq } from '../../src/sim/grid'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, seatAndWait, startService } from './helpers'

const fresh = () => new SpaSim({ rng: createRng(1), autoSpawn: false })

describe('SpaSim owner and service', () => {
  it('tapping a floor tile walks the owner there', () => {
    const sim = fresh()
    sim.tapTile({ x: 2, y: 14 })
    advanceUntil(sim, () => tileEq(sim.ownerTile(), { x: 2, y: 14 }) && sim.owner.path.length === 0)
  })

  it('tapping a wall or furniture does nothing', () => {
    const sim = fresh()
    for (const t of [{ x: 0, y: 5 }, { x: 8, y: 14 }, { x: 3, y: 12 }, { x: 5, y: 6 }, { x: 2, y: 2 }]) sim.tapTile(t)
    expect(sim.owner.path).toEqual([])
    expect(sim.owner.task).toBeNull()
  })

  it('tapping a waiting customer brings them to a bed and freezes time for the mini-game', () => {
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
        { type: 'paid', customerId: c.id, amount: 40_000, tip: 10_000, tile: sim.stations[0].bed },
        { type: 'review', customerId: c.id, score: 5 },
      ]),
    )
    expect(sim.stats).toMatchObject({ served: 1, income: 40_000, tips: 10_000 })
    expect(sim.stations[0].customerId).toBeNull()
    expect(sim.servingCustomerId).toBeNull()
    expect(c.state).toBe('leaving')
    expect(c.mood).toBe('happy')
  })

  it('shows a toast when every bed is busy', () => {
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

  it('serves each bed from the work tile on its right', () => {
    const sim = fresh()
    expect(sim.stations.map(s => [s.bed, s.work])).toEqual([
      [{ x: 2, y: 3 }, { x: 3, y: 3 }],
      [{ x: 4, y: 3 }, { x: 5, y: 3 }],
    ])
  })

  it('rejects a bed with no work tile on its right', () => {
    const layout = ['#####', '#.CW#', '#.C.#', '##D##']
    expect(() => new SpaSim({ rng: createRng(1), layout })).toThrow('Bed at 2,2 has no work tile on its right')
  })

  it('starts the day with the owner behind the reception desk', () => {
    const sim = fresh()
    const o = sim.ownerTile()
    expect(isWalkable(sim.grid, o)).toBe(true)
    expect(sim.grid.desks).toContainEqual({ x: o.x, y: o.y + 1 })
  })

  it('starts the next day with the owner back behind the reception desk', () => {
    const sim = fresh()
    const start = sim.ownerTile()
    sim.tapTile({ x: 2, y: 14 })
    advanceUntil(sim, () => tileEq(sim.ownerTile(), { x: 2, y: 14 }) && sim.owner.path.length === 0)
    advanceUntil(sim, () => sim.dayOver, 900_000)
    sim.startDay()
    expect(sim.ownerTile()).toEqual(start)
    expect(sim.owner.path).toEqual([])
    expect(sim.owner.facing).toBe('down')
  })

  it('tapping an empty bed slot says it is coming soon and leaves the owner where they are', () => {
    const sim = fresh()
    for (const y of [1, 2, 3, 4]) {
      sim.tapTile({ x: 6, y })
      expect(sim.drainEvents()).toContainEqual({ type: 'toast', key: 'comingSoon' })
    }
    expect(sim.owner.path).toEqual([])
  })

  it('brings a customer from the far end of the bench onto a bed within 8 seconds of the tap', () => {
    const sim = fresh()
    const c = seatAndWait(sim)
    expect(c.seat).toEqual({ x: 2, y: 13 }) // the first seat is the farthest from the beds
    sim.tapTile(c.seat!)
    let ms = 0
    while (c.state !== 'inService' && ms <= 20_000) {
      sim.advance(100)
      ms += 100
    }
    expect(ms).toBeLessThanOrEqual(8_000)
  })

  it('brings the next customer from the far end of the bench onto a bed within 8 seconds right after a service', () => {
    const sim = fresh()
    const first = startService(sim)
    sim.completeService(first.id, 3)
    const c = seatAndWait(sim)
    expect(c.seat).toEqual({ x: 2, y: 13 })
    expect(sim.ownerTile()).toEqual(sim.stations[0].work) // the owner is still beside the bed they just used
    sim.tapTile(c.seat!)
    let ms = 0
    while (c.state !== 'inService' && ms <= 20_000) {
      sim.advance(100)
      ms += 100
    }
    expect(ms).toBeLessThanOrEqual(8_000)
  })
})
