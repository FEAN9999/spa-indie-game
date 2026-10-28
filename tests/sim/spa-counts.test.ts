import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff, seatAndWait, startService } from './helpers'

const fresh = () => new SpaSim({ rng: createRng(1), autoSpawn: false })

/** The owner serves one customer with `stars`; returns what they paid. */
function ownerServes(sim: SpaSim, stars: 1 | 2 | 3, opts?: Parameters<typeof startService>[1]): { amount: number; tip: number } {
  const c = startService(sim, opts)
  sim.drainEvents()
  sim.completeService(c.id, stars)
  const paid = sim.drainEvents().find(e => e.type === 'paid')
  if (paid?.type !== 'paid') throw new Error('no payment')
  return paid
}

describe('counting as things happen', () => {
  it('counts an owner service done with three stars', () => {
    const sim = fresh()
    const paid = ownerServes(sim, 3)
    expect(sim.progress.total).toMatchObject({ served: 1, earned: paid.amount + paid.tip, tips: paid.tip, owner3: 1, staff: 0 })
    expect(sim.progress.total.services.shampoo).toBe(1)
  })

  it('does not count a two-star owner service as three stars', () => {
    const sim = fresh()
    ownerServes(sim, 2)
    expect(sim.progress.total).toMatchObject({ served: 1, owner3: 0 })
  })

  it("counts a technician's customer as staff work, not the owner's", () => {
    const sim = fresh()
    hireStaff(sim, 'technician')
    seatAndWait(sim)
    advanceUntil(sim, () => sim.stats.served === 1, 120_000)
    expect(sim.progress.total).toMatchObject({ served: 1, staff: 1, owner3: 0 })
  })

  it('counts a customer who runs out of patience, and one who finds no seat', () => {
    const sim = fresh()
    const c = seatAndWait(sim)
    advanceUntil(sim, () => !sim.customers.includes(c), 200_000)
    expect(sim.progress.total.lost).toBe(1)
    sim.seats.forEach(s => (s.customerId = 999))
    const d = sim.spawnCustomer()
    advanceUntil(sim, () => !sim.customers.includes(d), 30_000)
    expect(sim.progress.total.lost).toBe(2)
  })

  it("never counts a regular's money gift as earnings", () => {
    const sim = fresh()
    sim.book.regulars.khoa = { meetDay: 13, met: true, points: 16, hearts: 4, visitAt: null }
    const paid = ownerServes(sim, 3, { regular: 'khoa' })
    expect(sim.stats.gifts).toBe(300_000)
    expect(sim.progress.total.earned).toBe(paid.amount + paid.tip)
    expect(sim.progress.total.hearts).toBe(1)
  })

  it('counts a booked course, and not a refused one', () => {
    const sim = fresh()
    sim.money = 500_000
    sim.services = ['shampoo', 'mask']
    const tech = hireStaff(sim, 'technician', undefined, { mask: 1 })
    expect(sim.study(tech.id, 'mask')).toBeNull()
    expect(sim.progress.total.courses).toBe(1)
    sim.money = 0
    const other = hireStaff(sim, 'technician', undefined, { mask: 1 })
    expect(sim.study(other.id, 'mask')).toBe('money')
    expect(sim.progress.total.courses).toBe(1)
  })
})

describe('closing the day', () => {
  it("records each finished day's counts and keeps the last three", () => {
    const sim = fresh()
    const ev: SimEvent[] = []
    sim.startDay()
    const paid = ownerServes(sim, 3)
    advanceUntil(sim, () => sim.dayOver, 400_000, ev)
    expect(sim.progress.recent.at(-1)).toEqual({ served: 1, earned: paid.amount + paid.tip, tips: paid.tip, owner3: 1, staff: 0 })
    for (let i = 0; i < 3; i++) {
      sim.startDay()
      advanceUntil(sim, () => sim.dayOver, 400_000)
    }
    expect(sim.progress.recent).toHaveLength(3)
    expect(sim.progress.recent.every(r => r.served === 0)).toBe(true)
  })

  it('records no day that began before counting, but still keeps the best day', () => {
    const sim = fresh()
    sim.progress.dayStart = null
    ownerServes(sim, 3)
    advanceUntil(sim, () => sim.dayOver, 400_000)
    expect(sim.progress.recent).toEqual([])
    expect(sim.progress.life.bestServed).toBe(1)
  })

  it('marks a clean day from fifteen served with nobody walking out', () => {
    const at = (served: number) => {
      const sim = fresh()
      sim.stats.served = served
      advanceUntil(sim, () => sim.dayOver, 400_000)
      return sim.progress.life.cleanDay
    }
    expect(at(14)).toBe(false)
    expect(at(15)).toBe(true)
  })
})
