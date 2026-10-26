import { describe, expect, it } from 'vitest'
import { serviceArrivalFactor, tipFor } from '../../src/sim/economy'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { advanceUntil, hireStaff } from './helpers'

const fresh = () => {
  const sim = new SpaSim({ rng: createRng(3), autoSpawn: false })
  sim.day = 4
  sim.money = 1_000_000
  return sim
}

/** A shop with the mask service open and a mask bed by the back wall. */
const withMask = () => {
  const sim = fresh()
  expect(sim.openService('mask')).toBeNull()
  expect(sim.buy('maskBed', 6, 2, false)).toBeNull()
  sim.drainEvents()
  return sim
}

const waitingFor = (sim: SpaSim, service: 'shampoo' | 'mask' | 'massage') => {
  const c = sim.spawnCustomer({ kind: 'office', service })
  advanceUntil(sim, () => c.state === 'waiting')
  return c
}

describe('opening services', () => {
  it('opens the mask, then massage, for their price, never in debt or out of order', () => {
    const sim = fresh()
    expect(sim.openService('massage')).toBe('order')
    expect(sim.openService('mask')).toBeNull()
    expect(sim.money).toBe(800_000)
    expect(sim.openService('mask')).toBeNull()
    expect(sim.money).toBe(800_000)
    sim.money = 100_000
    expect(sim.openService('massage')).toBe('money')
    sim.money = -1
    expect(sim.openService('massage')).toBe('debt')
    expect(sim.serviceProblem('massage')).toBe('debt')
    expect(sim.services).toEqual(['shampoo', 'mask'])
    sim.money = 500_000
    expect(sim.openService('massage')).toBeNull()
    expect([sim.services, sim.money]).toEqual([['shampoo', 'mask', 'massage'], 100_000])
  })
})

describe('customers and services', () => {
  it('lets customers pick only services that are open and have a bed', () => {
    const sim = fresh()
    sim.openService('mask')
    const wants = (n: number) => new Set(Array.from({ length: n }, () => sim.spawnCustomer().service))
    expect(wants(200)).toEqual(new Set(['shampoo']))
    expect(sim.buy('maskBed', 6, 2, false)).toBeNull()
    expect(sim.availableServices()).toEqual(['shampoo', 'mask'])
    expect(wants(200)).toEqual(new Set(['shampoo', 'mask']))
  })

  it('sends each customer to a bed of their service and charges its price', () => {
    const sim = withMask()
    const c = waitingFor(sim, 'mask')
    sim.tapTile(c.seat!)
    advanceUntil(sim, () => c.state === 'inService')
    const station = sim.stations.find(s => s.id === c.stationId)!
    expect(station.service).toBe('mask')
    sim.drainEvents()
    const before = sim.money
    sim.completeService(c.id, 3)
    expect(sim.money).toBe(before + 60_000 + tipFor(60_000, 3))
    expect(sim.drainEvents()).toContainEqual({ type: 'paid', customerId: c.id, amount: 60_000, tip: tipFor(60_000, 3), tile: station.bed })
  })

  it('says the right bed is busy and keeps the owner still', () => {
    const sim = withMask()
    sim.stations.find(s => s.service === 'mask')!.customerId = 999
    const c = waitingFor(sim, 'mask')
    sim.drainEvents()
    sim.tapTile(c.seat!)
    expect(sim.drainEvents()).toContainEqual({ type: 'toast', key: 'busyMask' })
    expect(sim.owner.task).toBeNull()
    expect(sim.owner.path).toEqual([])
    expect(c.state).toBe('waiting')
  })

  it("lets a technician serve only beds of the customer's service", () => {
    const sim = withMask()
    sim.stations.find(s => s.service === 'mask')!.customerId = 999
    const c = waitingFor(sim, 'mask')
    const tech = hireStaff(sim, 'technician')
    sim.advance(5_000)
    expect(tech.task).toBeNull()
    expect(c.state).toBe('waiting')
  })

  it('moves waiting customers to another service when the last bed of theirs is sold', () => {
    const sim = withMask()
    const c = waitingFor(sim, 'mask')
    sim.sell(sim.items.find(i => i.kind === 'maskBed')!.id)
    expect(c.service).toBe('shampoo')
  })
})

describe('more services, more customers', () => {
  it('brings customers more often for each extra service the shop offers', () => {
    expect(serviceArrivalFactor(1)).toBe(1)
    expect(serviceArrivalFactor(3)).toBeCloseTo(0.8)
  })
})

