import { describe, expect, it } from 'vitest'
import { serviceArrivalFactor, tipFor } from '../../src/sim/economy'
import { bedTile } from '../../src/sim/items'
import { emptyRecipes } from '../../src/sim/recipes'
import { createRng } from '../../src/sim/rng'
import { BASIC_SERVICES, isRecipeService, RECIPE_SERVICES, SERVICE_IDS, SERVICES } from '../../src/sim/services'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { t } from '../../src/strings/vi'
import { advanceUntil, hireStaff, startService } from './helpers'

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

describe('opening Xông lá', () => {
  /** A shop with massage open and money to spare. */
  const afterMassage = () => {
    const sim = fresh()
    sim.services = ['shampoo', 'mask', 'massage']
    return sim
  }

  it('lists the basic services, then the recipe ones', () => {
    expect(BASIC_SERVICES).toEqual(['shampoo', 'mask', 'massage'])
    expect(RECIPE_SERVICES).toEqual(['steam'])
    expect(SERVICE_IDS).toEqual(['shampoo', 'mask', 'massage', 'steam'])
    expect(SERVICE_IDS.map(isRecipeService)).toEqual([false, false, false, true])
    expect(SERVICES.steam).toEqual({ price: 110_000, openCost: 500_000, bed: 'steamTent', name: 'serviceSteam', busy: 'busySteam' })
    expect([t('serviceSteam'), t('itemSteamTent'), t('stockHerbs'), t('busySteam')]).toEqual(['Xông lá', 'Lều xông lá', 'Gói lá xông', 'Lều xông đang bận'])
  })

  it('waits for massage, then for the recipe, then opens for its price', () => {
    const sim = fresh()
    expect(sim.recipes).toEqual(emptyRecipes())
    expect(sim.benchOpen()).toBe(false)
    expect(sim.openService('steam')).toBe('order')
    sim.services = ['shampoo', 'mask', 'massage']
    expect(sim.benchOpen()).toBe(true)
    expect(sim.serviceProblem('steam')).toBe('recipe')
    expect(sim.openService('steam')).toBe('recipe')
    sim.recipes.steam.solved = true
    sim.money = 600_000
    expect(sim.openService('steam')).toBeNull()
    expect([sim.services, sim.money]).toEqual([['shampoo', 'mask', 'massage', 'steam'], 100_000])
    expect(sim.serviceProblem('steam')).toBeNull()
  })

  it('never opens in debt or short of money', () => {
    const sim = afterMassage()
    sim.money = -1
    expect(sim.serviceProblem('steam')).toBe('debt')
    sim.services = ['shampoo']
    expect(sim.serviceProblem('steam')).toBe('debt')
    sim.services = ['shampoo', 'mask', 'massage']
    sim.recipes.steam.solved = true
    expect(sim.openService('steam')).toBe('debt')
    sim.money = 499_999
    expect(sim.openService('steam')).toBe('money')
    expect([sim.services, sim.money]).toEqual([['shampoo', 'mask', 'massage'], 499_999])
  })

  it('serves a Xông lá customer in the tent, with the owner beside it, using one herbs and one towel', () => {
    const sim = afterMassage()
    sim.day = 5
    sim.recipes.steam.solved = true
    expect(sim.openService('steam')).toBeNull()
    expect(sim.buy('steamTent', 8, 8, false)).toBeNull()
    const tent = sim.items.find(i => i.kind === 'steamTent')!
    expect(sim.availableServices()).toEqual(['shampoo', 'steam'])
    const c = startService(sim, { kind: 'elder', service: 'steam' })
    expect(c.pos).toEqual(bedTile(tent))
    expect(sim.stations.find(s => s.id === c.stationId)).toMatchObject({ service: 'steam', bed: { x: 9, y: 9 }, work: { x: 10, y: 9 } })
    expect(sim.owner.pos).toEqual({ x: 10, y: 9 })
    expect(sim.stock).toMatchObject({ herbs: 19, towel: 19, shampoo: 20 })
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
    expect(serviceArrivalFactor(['shampoo'])).toBe(1)
    expect(serviceArrivalFactor(['shampoo', 'mask', 'massage'])).toBeCloseTo(0.8)
  })
})

describe('the owner and the technician on mask chairs', () => {
  it('gives the owner the last mask chair when a technician is heading for another mask customer', () => {
    const sim = withMask()
    const a = waitingFor(sim, 'mask')
    const b = waitingFor(sim, 'mask')
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => tech.task?.kind === 'fetch')
    expect(tech.task).toEqual({ kind: 'fetch', customerId: a.id })
    sim.drainEvents()
    sim.tapTile(b.seat!)
    expect(tech.task).toBeNull()
    const ev: SimEvent[] = []
    advanceUntil(sim, () => b.state === 'inService', 60_000, ev)
    expect(sim.stations.find(s => s.id === b.stationId)!.service).toBe('mask')
    expect(ev.filter(e => e.type === 'toast')).toEqual([])
  })
})
