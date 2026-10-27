import { describe, expect, it } from 'vitest'
import { DAY_END_MIN, RESTOCK_AMOUNT, RESTOCK_PRICE } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { fullStock, STOCK_ITEMS, STOCK_NAME, STOCK_USES } from '../../src/sim/stock'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff, seatAndWait, startService } from './helpers'

const fresh = (day = 5) => {
  const sim = new SpaSim({ rng: createRng(3), autoSpawn: false })
  sim.day = day
  sim.money = 1_000_000
  return sim
}

const FULL = { shampoo: 20, towel: 20, mask: 20, oil: 20, herbs: 20, mud: 20 }
const OFFICE = { kind: 'office', service: 'shampoo' } as const

describe('herbs for Xông lá', () => {
  it('starts with 20 herbs, sells 20 more for 440 000, and gives a Xông lá customer one herbs and one towel', () => {
    expect(fullStock().herbs).toBe(20)
    expect(STOCK_ITEMS).toEqual(['shampoo', 'towel', 'mask', 'oil', 'herbs', 'mud'])
    expect(STOCK_NAME.herbs).toBe('stockHerbs')
    expect(STOCK_USES.steam).toEqual(['herbs', 'towel'])
    expect(RESTOCK_PRICE.herbs).toBe(440_000)
  })
})

describe('mineral mud and the stone bed', () => {
  it('starts with 20 mud, sells 20 more for 640 000, and shares the oil between massage and Đá nóng', () => {
    expect(fullStock().mud).toBe(20)
    expect(STOCK_ITEMS[STOCK_ITEMS.length - 1]).toBe('mud')
    expect(STOCK_NAME.mud).toBe('stockMud')
    expect(STOCK_USES.stone).toEqual(['oil', 'towel'])
    expect(STOCK_USES.mud).toEqual(['mud', 'towel'])
    expect(STOCK_USES.massage).toEqual(['oil', 'towel'])
    expect(RESTOCK_PRICE.mud).toBe(640_000)
  })

  it('lets technicians serve steam and mud from stock, but neither massage nor stone with the oil gone', () => {
    const sim = fresh()
    sim.services = ['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud']
    sim.money = 5_000_000
    for (const id of ['steam', 'stone', 'mud'] as const) sim.recipes[id].solved = true
    for (const [kind, x, y] of [['massageBed', 1, 8], ['stoneBed', 4, 8], ['mudTub', 8, 8], ['steamTent', 5, 12]] as const) expect(sim.buy(kind, x, y, false), kind).toBeNull()
    hireStaff(sim, 'technician', undefined, { massage: 1, stone: 1, steam: 1, mud: 1 })
    hireStaff(sim, 'technician', undefined, { massage: 1, stone: 1, steam: 1, mud: 1 })
    sim.stock.oil = 0
    const waiting = (['massage', 'stone', 'steam', 'mud'] as const).map(service => seatAndWait(sim, { kind: 'office', service }))
    const [massage, stone, steam, mud] = waiting
    advanceUntil(sim, () => steam.state !== 'waiting' && mud.state !== 'waiting')
    expect([massage.state, stone.state]).toEqual(['waiting', 'waiting'])
    expect(sim.stock).toMatchObject({ oil: 0, herbs: 19, mud: 19, towel: 18 })
  })
})

describe('using up stock', () => {
  it("uses one of the service's own item and one towel when a customer takes a bed, from day 5 only", () => {
    const before = fresh(4)
    startService(before)
    expect(before.stock).toEqual(FULL)
    expect(before.drainEvents().some(e => e.type === 'stockLow' || e.type === 'stockOut')).toBe(false)

    const owner = fresh()
    startService(owner)
    expect(owner.stock).toEqual({ shampoo: 19, towel: 19, mask: 20, oil: 20, herbs: 20, mud: 20 })

    const crew = fresh()
    hireStaff(crew, 'technician')
    const c = seatAndWait(crew)
    advanceUntil(crew, () => c.state === 'toStation' || c.state === 'inService')
    expect(crew.stock).toEqual({ shampoo: 19, towel: 19, mask: 20, oil: 20, herbs: 20, mud: 20 })
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

  it('warns for every item that reaches 5 on the same customer, in order', () => {
    const sim = fresh()
    sim.stock.shampoo = 6
    sim.stock.towel = 6
    sim.drainEvents()
    startService(sim)
    expect(sim.drainEvents().filter(e => e.type === 'stockLow')).toEqual([
      { type: 'stockLow', item: 'shampoo' },
      { type: 'stockLow', item: 'towel' },
    ])
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

    sim.completeService(other.id, 3)
    sim.advance(5000)
    expect(sim.customers.find(c => c.id === fetched)!.state).toBe('waiting')
    expect(sim.stock.towel).toBe(0)
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

  it('keeps a shop that wages pushed below zero able to restock and earn on the next day', () => {
    const sim = fresh()
    const tech = hireStaff(sim, 'technician')
    sim.money = tech.wage - 1
    sim.clock.minutes = DAY_END_MIN
    advanceUntil(sim, () => sim.dayOver, 5_000)
    expect(sim.stats.wages).toBe(tech.wage)
    expect(sim.money).toBe(-1)
    sim.startDay()
    sim.stock.shampoo = 0
    sim.stock.towel = 0
    sim.restock('shampoo')
    sim.restock('towel')
    expect(sim.stock).toMatchObject({ shampoo: RESTOCK_AMOUNT, towel: RESTOCK_AMOUNT })
    expect(sim.stats.restock).toBeGreaterThan(0)
    const poor = sim.money
    expect(poor).toBeLessThan(0)
    const c = seatAndWait(sim)
    advanceUntil(sim, () => sim.money > poor, 120_000)
    expect(c.state).not.toBe('waiting')
    expect(sim.stock).toMatchObject({ shampoo: RESTOCK_AMOUNT - 1, towel: RESTOCK_AMOUNT - 1 })
  })

  describe('when the only bed of a fetched customer is sold', () => {
    /** A mask customer waiting with the only mask bed sold on the way: the customer now wants shampoo, which has run out. */
    const soldDuringFetch = (whoFetches: 'technician' | 'owner') => {
      const sim = fresh()
      expect(sim.openService('mask')).toBeNull()
      expect(sim.buy('maskBed', 6, 2, false)).toBeNull()
      const tech = whoFetches === 'technician' ? hireStaff(sim, 'technician') : null
      const c = sim.spawnCustomer({ kind: 'office', service: 'mask' })
      if (tech) advanceUntil(sim, () => tech.task?.kind === 'fetch')
      else {
        advanceUntil(sim, () => c.state === 'waiting')
        sim.tapTile(c.seat!)
        expect(sim.owner.task).toMatchObject({ kind: 'fetch' })
      }
      sim.drainEvents()
      expect(sim.sell(sim.items.find(i => i.kind === 'maskBed')!.id)).toBeNull()
      expect(c.service).toBe('shampoo')
      sim.stock.shampoo = 0
      return { sim, c, tech }
    }

    it('makes the technician drop the fetch instead of laying the customer on a bed', () => {
      const { sim, c, tech } = soldDuringFetch('technician')
      sim.advance(10_000)
      expect(tech!.task).toBeNull()
      expect(c.state).toBe('waiting')
      expect(c.stationId).toBeNull()
      expect(sim.stock).toMatchObject({ shampoo: 0, towel: 20 })
    })

    it('tells the owner the item is out and leaves the owner where they stopped', () => {
      const { sim, c } = soldDuringFetch('owner')
      const ev: SimEvent[] = []
      advanceUntil(sim, () => sim.owner.task === null, 30_000, ev)
      ev.push(...sim.drainEvents())
      expect(ev).toContainEqual({ type: 'stockOut', item: 'shampoo' })
      expect(c.state).toBe('waiting')
      expect(sim.owner.path).toEqual([])
      expect(sim.stock).toMatchObject({ shampoo: 0, towel: 20 })
    })
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
