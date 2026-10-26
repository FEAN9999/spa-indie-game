import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { OWNER_START, PATIENCE_MS } from '../../src/config'
import { dayEase, tipFor } from '../../src/sim/economy'
import { tileEq } from '../../src/sim/grid'
import { SpaSim } from '../../src/sim/spa'
import { greetPatience, tipFactor, workMs } from '../../src/sim/staff'
import type { Customer, SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff, seatAndWait, startService } from './helpers'

const newSim = () => new SpaSim({ rng: createRng(5), autoSpawn: false })

describe('hiring', () => {
  it('offers three new candidates each morning from day 3', () => {
    const sim = newSim()
    sim.startDay()
    expect([sim.day, sim.candidates.length, sim.candidatesDay]).toEqual([2, 0, 0])
    sim.startDay()
    expect([sim.day, sim.candidates.length, sim.candidatesDay]).toEqual([3, 3, 3])
    expect(new Set(sim.candidates.map(c => c.name)).size).toBe(3)
    const hired = sim.candidates[0].name
    expect(sim.hire(0)).toBeNull()
    sim.startDay()
    expect(sim.candidates.map(c => c.name)).not.toContain(hired)
    expect(new Set(sim.candidates.map(c => c.name)).size).toBe(3)
  })

  it('hires at once and for free', () => {
    const sim = newSim()
    sim.startDay()
    sim.startDay()
    const name = sim.candidates[1].name
    const money = sim.money
    expect(sim.hire(1)).toBeNull()
    expect(sim.money).toBe(money)
    expect(sim.candidates).toHaveLength(2)
    expect(sim.staff).toHaveLength(1)
    const s = sim.staff[0]
    expect([s.name, s.id, s.level, s.xp, s.sinceRest, s.leaving, s.task]).toEqual([name, 1, 1, 0, 0, false, null])
    expect(s.pos).toEqual(sim.grid.door)
    expect(s.facing).toBe('up')
  })

  it('refuses a second receptionist and a fourth technician', () => {
    const sim = newSim()
    hireStaff(sim, 'receptionist')
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    for (const role of ['receptionist', 'technician'] as const) {
      sim.candidates.push({ ...sim.staff.find(s => s.role === role)!, name: 'Extra' })
      expect(sim.hire(sim.candidates.length - 1)).toBe('full')
    }
    sim.staff[0].leaving = true
    expect(sim.hire(sim.candidates.length - 2)).toBeNull()
  })

  it('refuses to hire or buy while money is negative', () => {
    const sim = newSim()
    sim.startDay()
    sim.startDay()
    sim.money = -1
    expect(sim.hire(0)).toBe('money')
    expect(sim.buy('plant', 6, 9, false)).toBe('money')
    expect(sim.staff).toHaveLength(0)
  })
})

const dayThree = () => {
  const sim = newSim()
  sim.day = 3
  return sim
}

/** Spawns a customer and waits until they sit; the next one is spawned only after this returns. */
const seated = (sim: SpaSim, n: number): Customer[] => Array.from({ length: n }, () => seatAndWait(sim))

describe('technicians at work', () => {
  it('walks in and serves the customer who has waited longest', () => {
    const sim = dayThree()
    const [a, b] = seated(sim, 2)
    const tech = hireStaff(sim, 'technician')
    const ev: SimEvent[] = []
    advanceUntil(sim, () => a.state === 'inService', 60_000, ev)
    expect(tech.task).toMatchObject({ kind: 'serve', customerId: a.id })
    expect(b.state).toBe('waiting')
    expect(sim.servingCustomerId).toBeNull()
    let ms = 0
    while (!ev.some(e => e.type === 'paid')) {
      sim.advance(100)
      ms += 100
      ev.push(...sim.drainEvents())
    }
    expect(Math.abs(ms - workMs(3))).toBeLessThanOrEqual(200)
    expect(ev).toContainEqual(expect.objectContaining({ type: 'paid', customerId: a.id, amount: 40_000 }))
    expect(sim.stats.served).toBe(1)
    expect(a.state).toBe('leaving')
    expect(sim.stations[0].customerId).toBeNull()
    expect(tech.task).toBeNull()
  })

  it('pays a tip that matches the review stars', () => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician', { skill: 3, speed: 5, friendly: 5, stamina: 3 })
    const ev: SimEvent[] = []
    advanceUntil(sim, () => ev.some(e => e.type === 'paid'), 60_000, ev)
    const paid = ev.find(e => e.type === 'paid' && e.customerId === a.id)
    const review = ev.find(e => e.type === 'review' && e.customerId === a.id)
    if (paid?.type !== 'paid' || review?.type !== 'review') throw new Error('no payment')
    expect(paid.tip).toBe(Math.round(tipFor(40_000, (review.score - 2) as 1 | 2 | 3) * tipFactor(0, tech.stats.friendly)))
  })

  it('never takes the customer the owner tapped', () => {
    const sim = dayThree()
    const [a, b] = seated(sim, 2)
    sim.tapTile(a.seat!)
    const tech = hireStaff(sim, 'technician')
    sim.advance(300)
    expect(tech.task).toEqual({ kind: 'fetch', customerId: b.id })
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.servingCustomerId !== null, 60_000, ev)
    expect(ev).toContainEqual(expect.objectContaining({ type: 'serviceReady', customerId: a.id }))
  })

  it('lets the owner take a customer a technician is walking to', () => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => tech.task?.kind === 'fetch')
    expect(tech.task).toEqual({ kind: 'fetch', customerId: a.id })
    sim.tapTile(a.seat!)
    expect(sim.owner.task).toEqual({ kind: 'fetch', customerId: a.id })
    expect(tech.task).toBeNull()
    expect(tech.path).toEqual([])
  })

  it('waits when every free bed is spoken for', () => {
    const sim = dayThree()
    const [a, b, c] = seated(sim, 3)
    sim.tapTile(a.seat!)
    const first = hireStaff(sim, 'technician')
    const second = hireStaff(sim, 'technician')
    sim.advance(300)
    expect(first.task).toEqual({ kind: 'fetch', customerId: b.id })
    expect(second.task).toBeNull()
    advanceUntil(sim, () => sim.servingCustomerId !== null)
    expect(second.task).toBeNull()
    sim.completeService(a.id, 3)
    advanceUntil(sim, () => second.task?.kind === 'fetch' && second.task.customerId === c.id)
  })

  it.each([
    [1, 24_000],
    [5, 12_000],
  ])('works for the time its speed %i gives', (speed, expected) => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    hireStaff(sim, 'technician', { skill: 3, speed, friendly: 3, stamina: 3 })
    advanceUntil(sim, () => a.state === 'inService')
    sim.drainEvents()
    let ms = 0
    while (!sim.drainEvents().some(e => e.type === 'paid')) {
      sim.advance(100)
      ms += 100
    }
    expect(Math.abs(ms - expected)).toBeLessThanOrEqual(100)
  })

  it('stands still while the owner plays', () => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician', { skill: 3, speed: 1, friendly: 3, stamina: 3 })
    advanceUntil(sim, () => a.state === 'inService')
    const b = seatAndWait(sim)
    sim.tapTile(b.seat!)
    advanceUntil(sim, () => sim.servingCustomerId !== null)
    expect(tech.task?.kind).toBe('serve')
    const before = JSON.stringify([tech.task, tech.pos])
    sim.advance(10_000)
    expect(JSON.stringify([tech.task, tech.pos])).toBe(before)
  })
})

describe('the receptionist', () => {
  it('stands behind the desk and greets each new customer', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist', { skill: 3, speed: 3, friendly: 3, stamina: 3 })
    const early = sim.spawnCustomer()
    expect(early.greet).toBe(0)
    advanceUntil(sim, () => rec.task === null && rec.path.length === 0 && tileEq(rec.pos, sim.receptionSpot()))
    const spot = sim.receptionSpot()
    expect(tileEq(spot, OWNER_START)).toBe(false)
    expect(sim.grid.desks.some(d => Math.abs(d.x - spot.x) + Math.abs(d.y - spot.y) === 1)).toBe(true)
    sim.drainEvents()
    const c = sim.spawnCustomer()
    const patience = Math.round(PATIENCE_MS * dayEase(3).patience * greetPatience(3))
    expect([c.greet, c.patienceMs, c.patienceMaxMs]).toEqual([3, patience, patience])
    expect(sim.drainEvents()).toContainEqual({ type: 'greeted', staffId: rec.id, customerId: c.id })
  })

  it('makes a greeted customer tip the owner more', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist', { skill: 3, speed: 3, friendly: 4, stamina: 3 })
    advanceUntil(sim, () => rec.path.length === 0)
    const c = startService(sim)
    expect(c.greet).toBe(4)
    sim.drainEvents()
    sim.completeService(c.id, 3)
    expect(sim.drainEvents()).toContainEqual(expect.objectContaining({ type: 'paid', tip: 12_000 }))
  })
})
