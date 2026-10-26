import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff, seatAndWait, startService } from './helpers'

const fresh = (day = 5) => {
  const sim = new SpaSim({ rng: createRng(3), autoSpawn: false })
  sim.day = day
  sim.money = 1_000_000
  return sim
}

const FULL = { shampoo: 20, towel: 20, mask: 20, oil: 20 }
const OFFICE = { kind: 'office', service: 'shampoo' } as const

describe('using up stock', () => {
  it("uses one of the service's own item and one towel when a customer takes a bed, from day 5 only", () => {
    const before = fresh(4)
    startService(before)
    expect(before.stock).toEqual(FULL)
    expect(before.drainEvents().some(e => e.type === 'stockLow' || e.type === 'stockOut')).toBe(false)

    const owner = fresh()
    startService(owner)
    expect(owner.stock).toEqual({ shampoo: 19, towel: 19, mask: 20, oil: 20 })

    const crew = fresh()
    hireStaff(crew, 'technician')
    const c = seatAndWait(crew)
    advanceUntil(crew, () => c.state === 'toStation' || c.state === 'inService')
    expect(crew.stock).toEqual({ shampoo: 19, towel: 19, mask: 20, oil: 20 })
  })

  it('restocks 20 for its price at any money, and counts it as today\'s spending', () => {
    const sim = fresh()
    sim.money = 50_000
    sim.restock('oil')
    expect(sim.money).toBe(-310_000)
    expect(sim.stock.oil).toBe(40)
    expect(sim.stats.restock).toBe(360_000)
    sim.restock('oil')
    expect(sim.money).toBe(-670_000)
    expect(sim.stock.oil).toBe(60)
    expect(sim.stats.restock).toBe(720_000)
  })

  it('warns once when an item reaches 5, and again after restocking above 5', () => {
    const sim = fresh()
    sim.stock.towel = 6
    sim.drainEvents()
    const first = startService(sim)
    expect(sim.drainEvents().filter(e => e.type === 'stockLow')).toEqual([{ type: 'stockLow', item: 'towel' }])
    expect(sim.lowStock()).toEqual(['towel'])
    sim.completeService(first.id, 3)
    startService(sim)
    expect(sim.stock.towel).toBe(4)
    expect(sim.drainEvents().some(e => e.type === 'stockLow')).toBe(false)

    sim.restock('towel')
    expect(sim.stock.towel).toBe(24)
    expect(sim.lowStock()).toEqual([])
    sim.stock.towel = 6
    sim.completeService(sim.customers.find(c => c.state === 'inService')!.id, 3)
    sim.drainEvents()
    startService(sim)
    expect(sim.drainEvents().filter(e => e.type === 'stockLow')).toEqual([{ type: 'stockLow', item: 'towel' }])

    sim.stock.mask = 1
    sim.stock.oil = 0
    expect(sim.lowStock()).toEqual(['towel'])
  })
})

describe('running out', () => {
  it('refuses the owner a customer whose item is out, and technicians skip that customer', () => {
    const sim = fresh()
    const tech = hireStaff(sim, 'technician')
    sim.stock.shampoo = 0
    const c = seatAndWait(sim)
    sim.drainEvents()
    sim.tapTile(c.seat!)
    expect(sim.drainEvents()).toContainEqual({ type: 'stockOut', item: 'shampoo' })
    expect(sim.owner.task).toBeNull()
    expect(sim.owner.path).toEqual([])
    sim.advance(5000)
    expect(tech.task).toBeNull()
    expect(c.state).toBe('waiting')

    sim.restock('shampoo')
    advanceUntil(sim, () => tech.task?.kind === 'fetch' && tech.task.customerId === c.id)
  })

  it('gives the owner the last towel when a technician is heading for another customer', () => {
    const sim = fresh()
    const tech = hireStaff(sim, 'technician', { skill: 3, speed: 1, friendly: 3, stamina: 3 })
    sim.stock.towel = 1
    const a = sim.spawnCustomer(OFFICE)
    const b = sim.spawnCustomer(OFFICE)
    advanceUntil(sim, () => a.state === 'waiting' && b.state === 'waiting')
    expect(tech.task).toMatchObject({ kind: 'fetch' })
    const fetched = (tech.task as { customerId: number }).customerId
    const other = fetched === a.id ? b : a
    sim.tapTile(other.seat!)
    expect(tech.task).toBeNull()
    advanceUntil(sim, () => other.state === 'inService')
    expect(sim.stock.towel).toBe(0)
    expect(sim.customers.find(c => c.id === fetched)!.state).toBe('waiting')
    expect(tech.task).toBeNull()
  })

  it('never lays a customer on a bed when the last unit went to someone else on the way', () => {
    const sim = fresh()
    hireStaff(sim, 'technician')
    hireStaff(sim, 'technician')
    sim.stock.towel = 1
    const a = sim.spawnCustomer(OFFICE)
    const b = sim.spawnCustomer(OFFICE)
    advanceUntil(sim, () => sim.stock.towel === 0)
    sim.advance(5000)
    expect(sim.stock.towel).toBe(0)
    const onBed = [a, b].filter(c => c.stationId !== null)
    expect(onBed).toHaveLength(1)
    expect([a, b].filter(c => c.state === 'waiting')).toHaveLength(1)
  })

  it('keeps a shop that is broke, out of stock and owing wages able to earn again', () => {
    const sim = fresh()
    hireStaff(sim, 'technician')
    sim.money = -200_000
    sim.stock.shampoo = 0
    sim.stock.towel = 0
    const c = seatAndWait(sim)
    sim.restock('shampoo')
    sim.restock('towel')
    expect(sim.money).toBe(-340_000)
    const events: SimEvent[] = []
    advanceUntil(sim, () => sim.money > -340_000, 120_000, events)
    expect(c.state).not.toBe('waiting')
  })

  it('takes the items once even when the shop is saved and reopened during the service', () => {
    const sim = fresh()
    const c = startService(sim)
    expect(sim.stock).toMatchObject({ shampoo: 19, towel: 19 })
    const copy = SpaSim.fromSave(sim.toSave(), { rng: createRng(2), autoSpawn: false })
    expect(copy.stock).toMatchObject({ shampoo: 19, towel: 19 })
    copy.completeService(c.id, 3)
    expect(copy.stock).toMatchObject({ shampoo: 19, towel: 19 })
  })
})
