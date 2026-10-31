import { describe, expect, it } from 'vitest'
import { REGULAR_OWNER_MS, RESTOCK_PRICE, STEP_MS } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { STOCK_ITEMS } from '../../src/sim/stock'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff, seatAndWait, starShop } from './helpers'

const beachOf = (main = starShop(), seed = 9) => SpaSim.newBranch('beach', main, createRng(seed))

/** A beach branch with a technician, its owner gone. */
function absentBranch(main = starShop()): SpaSim {
  const branch = beachOf(main)
  hireStaff(branch, 'technician')
  branch.ownerLeaves()
  return branch
}

/** Every stock item well above the low count, so a test picks the one it watches. */
const fillStock = (sim: SpaSim) => {
  for (const item of STOCK_ITEMS) sim.stock[item] = 100
}

describe('the ms a shop really stepped', () => {
  it('returns what it ran', () => {
    expect(beachOf().advance(1000)).toBe(1000)
    expect(beachOf().update(100)).toBe(100)
  })

  it('returns 0 while paused, serving or over', () => {
    const paused = beachOf()
    paused.paused = true
    expect(paused.advance(1000)).toBe(0)
    const serving = beachOf()
    serving.servingCustomerId = 5
    expect(serving.advance(1000)).toBe(0)
    const over = beachOf()
    over.dayOver = true
    expect(over.advance(1000)).toBe(0)
  })
})

describe('the owner leaving', () => {
  it('undoes a walk to a bed', () => {
    const branch = beachOf()
    hireStaff(branch, 'technician')
    const c = seatAndWait(branch)
    const before = { ...branch.stock }
    branch.tapTile(c.seat!)
    advanceUntil(branch, () => c.state === 'toStation')
    expect(branch.stock.shampoo).toBe(before.shampoo - 1)
    branch.ownerLeaves()
    expect(c.state).toBe('toSeat')
    expect(branch.seats.some(s => s.customerId === c.id)).toBe(true)
    expect(branch.stations.every(s => s.customerId === null)).toBe(true)
    expect(c.stationId).toBeNull()
    expect(branch.stock).toEqual(before)
    expect(branch.owner.task).toBeNull()
    expect(branch.ownerHere).toBe(false)
  })

  it('drops a fetch', () => {
    const branch = beachOf()
    hireStaff(branch, 'technician')
    const c = seatAndWait(branch)
    branch.tapTile(c.seat!)
    branch.advance(100)
    expect(branch.owner.task?.kind).toBe('fetch')
    branch.ownerLeaves()
    expect(branch.owner.task).toBeNull()
    expect(branch.owner.path).toEqual([])
  })

  it('keeps the waiting customers when the owner leaves with no technician', () => {
    const main = starShop()
    const cs = [main.spawnCustomer({ kind: 'office', service: 'shampoo' }), main.spawnCustomer({ kind: 'office', service: 'shampoo' })]
    advanceUntil(main, () => cs.every(c => c.state === 'waiting'))
    main.ownerLeaves()
    main.advance(1000)
    expect(cs.map(c => c.state)).toEqual(['waiting', 'waiting'])
  })

  it('has the owner back at the start with nothing to do', () => {
    const branch = absentBranch()
    branch.owner.pos = { x: 15, y: 3 }
    branch.ownerArrives()
    expect(branch.ownerHere).toBe(true)
    expect(branch.owner.path).toEqual([])
    expect(branch.owner.task).toBeNull()
    expect(branch.owner.facing).toBe('down')
    expect(branch.ownerTile()).toEqual(starShop().ownerTile())
  })
})

describe('a shop with its owner away', () => {
  it('still brings customers with no technician, who leave angry when nobody serves them', () => {
    const branch = beachOf(starShop(3, 20_000_000, 1, true))
    branch.ownerLeaves()
    branch.advance(100_000)
    expect(branch.drainEvents().some(e => e.type === 'customerArrived')).toBe(true)
    expect(branch.stats.served).toBe(0)
    expect(branch.stats.angry).toBeGreaterThan(0)
    expect(branch.reviews).toContain(1)
  })

  it('serves with a technician and the main shop is paid', () => {
    const main = starShop(3, 20_000_000, 1, true)
    const branch = absentBranch(main)
    const before = main.money
    const events: SimEvent[] = []
    advanceUntil(branch, () => events.some(e => e.type === 'paid'), 140_000, events)
    events.push(...branch.drainEvents())
    const paid = events.flatMap(e => (e.type === 'paid' ? [e.amount + e.tip] : [])).reduce((a, b) => a + b, 0)
    expect(events.some(e => e.type === 'customerArrived')).toBe(true)
    expect(paid).toBeGreaterThan(0)
    expect(main.money).toBe(before + paid - branch.stats.restock)
  })

  it('keeps the waiting customer when the last technician is let go, while the one in service finishes', () => {
    const branch = beachOf()
    const tech = hireStaff(branch, 'technician')
    branch.ownerLeaves()
    const first = branch.spawnCustomer({ kind: 'office', service: 'shampoo' })
    advanceUntil(branch, () => first.state === 'inService')
    const second = branch.spawnCustomer({ kind: 'office', service: 'shampoo' })
    advanceUntil(branch, () => second.state === 'waiting')
    branch.drainEvents()
    branch.fire(tech.id)
    branch.advance(STEP_MS)
    expect(second.state).toBe('waiting')
    expect(first.state).toBe('inService')
    const events: SimEvent[] = []
    advanceUntil(branch, () => !branch.customers.includes(first), 120_000, events)
    expect(events.some(e => e.type === 'paid' && e.customerId === first.id)).toBe(true)
  })
})

describe('the crew while the owner is away', () => {
  it("fetches a regular at once and keeps a VIP's bed only while the owner is here", () => {
    const away = starShop()
    const tech = hireStaff(away, 'technician')
    away.ownerLeaves()
    const reg = away.spawnCustomer({ regular: 'hanh', service: 'shampoo' })
    advanceUntil(away, () => tech.task !== null, REGULAR_OWNER_MS - 1000)
    expect(reg.heldMs).toBeLessThan(REGULAR_OWNER_MS)

    const home = starShop()
    const t2 = hireStaff(home, 'technician')
    home.ownerLeaves()
    home.ownerArrives()
    const held = home.spawnCustomer({ regular: 'hanh', service: 'shampoo' })
    advanceUntil(home, () => held.state === 'waiting')
    home.advance(REGULAR_OWNER_MS / 2)
    expect(t2.task).toBeNull()
  })

  it('fetches another massage customer past a waiting VIP, and holds the bed again when the owner returns', () => {
    const build = (here: boolean) => {
      const sim = starShop()
      expect(sim.buy('massageBed', 20, 2, false)).toBeNull()
      const tech = hireStaff(sim, 'technician', undefined, { massage: 1 })
      sim.ownerLeaves()
      if (here) sim.ownerArrives()
      const office = sim.spawnCustomer({ kind: 'office', service: 'massage' })
      const singer = sim.spawnCustomer({ vip: 'singer' })
      advanceUntil(sim, () => office.state === 'waiting' && singer.state === 'waiting')
      sim.advance(3_000)
      return { tech, office }
    }
    const away = build(false)
    expect(away.tech.task).toMatchObject({ customerId: away.office.id })
    expect(build(true).tech.task).toBeNull()
  })
})

describe('auto-restock', () => {
  const stockOf = () => {
    const branch = absentBranch()
    fillStock(branch)
    return branch
  }

  it('buys oil as soon as one is taken below the low count', () => {
    const branch = stockOf()
    expect(branch.buy('massageBed', 20, 2, false)).toBeNull()
    branch.stock.oil = 6
    const money = branch.money
    const c = branch.spawnCustomer({ kind: 'office', service: 'massage' })
    advanceUntil(branch, () => c.stationId !== null)
    branch.advance(STEP_MS)
    expect(branch.stock.oil).toBe(25)
    expect(branch.money).toBe(money - RESTOCK_PRICE.oil)
    expect(branch.stats.restock).toBe(RESTOCK_PRICE.oil)
  })

  it('buys nothing the purse cannot pay, then buys when it can', () => {
    const branch = stockOf()
    branch.stock.oil = 0
    branch.money = RESTOCK_PRICE.oil - 1
    branch.advance(STEP_MS)
    expect(branch.stock.oil).toBe(0)
    branch.money = RESTOCK_PRICE.oil
    branch.advance(STEP_MS)
    expect(branch.stock.oil).toBe(20)
    expect(branch.money).toBe(0)
  })

  it('never buys an item no open service uses', () => {
    const branch = stockOf()
    branch.stock.mud = 0
    branch.advance(STEP_MS)
    expect(branch.stock.mud).toBe(0)
  })

  it('never buys by itself with the owner here', () => {
    const branch = beachOf()
    fillStock(branch)
    branch.stock.oil = 0
    branch.advance(STEP_MS)
    expect(branch.stock.oil).toBe(0)
  })
})

describe('clearing out', () => {
  it('sends everyone away at once and lets the day end, paying wages', () => {
    const branch = beachOf()
    const tech = hireStaff(branch, 'technician')
    branch.ownerLeaves()
    const c = branch.spawnCustomer({ kind: 'office', service: 'shampoo' })
    advanceUntil(branch, () => c.state === 'inService')
    const waiting = branch.spawnCustomer({ kind: 'office', service: 'shampoo' })
    advanceUntil(branch, () => waiting.state === 'waiting')
    branch.clock.minutes = 1200
    branch.clearOut()
    expect(branch.customers).toEqual([])
    expect(branch.seats.every(s => s.customerId === null)).toBe(true)
    expect(branch.stations.every(s => s.customerId === null)).toBe(true)
    expect(branch.staff.every(s => s.task === null)).toBe(true)
    branch.advance(STEP_MS)
    expect(branch.dayOver).toBe(true)
    expect(branch.stats.wages).toBe(tech.wage)
  })
})
