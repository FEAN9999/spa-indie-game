import { describe, expect, it } from 'vitest'
import { DAY_END_MIN, MAX_FRAME_MS, REAL_MS_PER_GAME_MIN, STEP_MS } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { parseSave, SaveError } from '../../src/sim/save'
import { dayProfit } from '../../src/sim/economy'
import { VIP_IDS } from '../../src/sim/vips'
import { isPast, newStarter, STARTER_GOAL_IDS } from '../../src/sim/starter'
import type { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import v23 from '../fixtures/save-v23.json'
import { hireStaff, starShop } from './helpers'

/** Runs the chain in 100 ms frames until `pred` holds. */
function chainUntil(chain: Chain, pred: () => boolean, maxMs = 120_000) {
  for (let t = 0; t <= maxMs; t += 100) {
    if (pred()) return
    chain.advance(100)
  }
  throw new Error('condition not reached')
}

/** A chain with the beach open; the owner is still at the main shop. */
function withBeach(main = starShop()): { chain: Chain; main: SpaSim; beach: SpaSim } {
  const chain = new Chain(main, 7)
  expect(chain.open('beach')).toBeNull()
  return { chain, main, beach: chain.shop('beach')! }
}

/** A chain with the beach open and the owner there. */
function atBeach(main = starShop()) {
  const all = withBeach(main)
  expect(all.chain.goTo('beach')).toBeNull()
  return all
}

const setMinutes = (shops: SpaSim[], minutes: number) => {
  for (const s of shops) s.clock.minutes = minutes
}

/** The badges a fresh day-40 shop with money earns on its first step, in the table's order. */
const FIRST_BADGES: SimEvent[] = [
  { type: 'badge', id: 'million' },
  { type: 'badge', id: 'fullYear' },
]

describe('a chain with no branch', () => {
  it('plays the main shop exactly as before over a whole day', () => {
    const bare = starShop(3, 20_000_000, 5, true)
    const chain = new Chain(starShop(3, 20_000_000, 5, true), 7)
    for (let t = 0; !bare.dayOver; t += 100) {
      if (t > 400_000) throw new Error('day did not end')
      bare.advance(100)
    }
    for (let t = 0; !chain.main.dayOver; t += 100) {
      if (t > 400_000) throw new Error('day did not end')
      chain.advance(100)
    }
    expect(chain.main.toSave()).toEqual(bare.toSave())
    expect(chain.main.drainEvents()).toEqual(bare.drainEvents())
  })
})

describe('opening a branch', () => {
  it('says what stops a place opening', () => {
    expect(new Chain(starShop(2), 7).openProblem('beach')).toBe('stars')
    expect(new Chain(starShop(3, 4_999_999), 7).openProblem('beach')).toBe('money')
    expect(new Chain(starShop(3), 7).openProblem('beach')).toBeNull()
    expect(new Chain(starShop(3), 7).openProblem('oldTown')).toBe('stars')
    expect(new Chain(starShop(4), 7).openProblem('oldTown')).toBeNull()
    expect(new Chain(starShop(4, 7_999_999), 7).openProblem('oldTown')).toBe('money')
    expect(new Chain(starShop(4), 7).openProblem('uptown')).toBe('stars')
    expect(new Chain(starShop(5), 7).openProblem('uptown')).toBeNull()
    expect(withBeach().chain.openProblem('beach')).toBe('open')
  })

  it('opens all three places at 5 stars, each with its own piece', () => {
    const chain = new Chain(starShop(5, 30_000_000), 7)
    for (const place of ['uptown', 'beach', 'oldTown'] as const) expect(chain.open(place)).toBeNull()
    expect(chain.branches.map(b => b.place)).toEqual(['beach', 'oldTown', 'uptown'])
    expect(chain.main.money).toBe(5_000_000)
    expect(chain.shop('oldTown')!.items.filter(i => i.kind === 'lanternString')).toHaveLength(1)
    expect(chain.shop('uptown')!.items.filter(i => i.kind === 'orchid')).toHaveLength(1)
  })

  it('keeps the owner, one orchid and the purse across a reload at uptown', () => {
    const chain = new Chain(starShop(5, 30_000_000), 7)
    expect(chain.open('uptown')).toBeNull()
    chain.goTo('uptown')
    const copy = viaJson(chain)
    expect(copy.at).toBe('uptown')
    expect(copy.shop('uptown')!.items.filter(i => i.kind === 'orchid')).toHaveLength(1)
    expect(copy.main.money).toBe(chain.main.money)
  })

  it('opens the old town for a v23 save and charges it once, with the owner still at the beach', () => {
    const chain = Chain.fromSave(parseSave(structuredClone(v23)), 8)
    expect(chain.openProblem('oldTown')).toBeNull()
    expect(chain.openProblem('uptown')).toBe('stars')
    const money = chain.main.money
    expect(chain.open('oldTown')).toBeNull()
    expect(chain.main.money).toBe(money - 8_000_000)
    const copy = viaJson(chain)
    expect(copy.main.money).toBe(money - 8_000_000)
    expect(copy.branches).toHaveLength(2)
    expect(copy.shop('oldTown')!.items.filter(i => i.kind === 'lanternString')).toHaveLength(1)
    expect(copy.at).toBe('beach')
  })

  it('charges the price once and leaves the owner where she is', () => {
    const { chain, main, beach } = withBeach()
    expect(main.money).toBe(15_000_000)
    expect(chain.open('beach')).toBe('open')
    expect(main.money).toBe(15_000_000)
    expect(chain.branches).toEqual([beach])
    expect(beach.place).toBe('beach')
    expect(beach.purse).toBe(main.purse)
    expect(chain.at).toBeNull()
    expect(chain.active()).toBe(main)
    expect(main.ownerHere).toBe(true)
    expect(beach.ownerHere).toBe(false)
  })

  it('gives a new empty beach no customers', () => {
    const { chain, beach } = withBeach(starShop(3, 20_000_000, 1, true))
    // a game hour: long past the first arrival a beach with its owner would get
    for (let t = 0; t < 60 * REAL_MS_PER_GAME_MIN; t += 100) {
      chain.advance(100)
      expect(beach.customers).toEqual([])
    }
    expect(beach.toSave().nextId).toBe(1)
    expect(beach.stats.walkedAway + beach.stats.angry).toBe(0)
  })

  it('shows the chain from 3 stars and tells it once', () => {
    const low = new Chain(starShop(2), 7)
    expect(low.chainShown()).toBe(false)
    expect(low.shouldTell()).toBe(false)
    const chain = new Chain(starShop(3), 7)
    expect(chain.chainShown()).toBe(true)
    expect(chain.shouldTell()).toBe(true)
    chain.told = true
    expect(chain.shouldTell()).toBe(false)
  })
})

describe('going between shops', () => {
  it('says what stops the owner going', () => {
    const { chain, main, beach } = withBeach()
    expect(chain.goProblem(null)).toBe('here')
    expect(chain.goProblem('oldTown')).toBe('notOpen')
    expect(chain.goTo('oldTown')).toBe('notOpen')
    expect(chain.goProblem('beach')).toBeNull()
    expect(chain.goTo('beach')).toBeNull()
    expect(chain.goProblem('beach')).toBe('here')
    setMinutes([main, beach], DAY_END_MIN)
    expect(chain.goProblem(null)).toBeNull()
    expect(chain.goTo(null)).toBeNull()
    expect(chain.at).toBeNull()
    expect(chain.goProblem('beach')).toBe('closed')
    expect(chain.goTo('beach')).toBe('closed')
    expect(chain.at).toBeNull()
  })

  it('moves the owner to the beach', () => {
    const { chain, main, beach } = atBeach()
    expect(chain.at).toBe('beach')
    expect(chain.active()).toBe(beach)
    expect(main.ownerHere).toBe(false)
    expect(beach.ownerHere).toBe(true)
    expect(chain.goTo(null)).toBeNull()
    expect(chain.active()).toBe(main)
    expect(main.ownerHere).toBe(true)
    expect(beach.ownerHere).toBe(false)
  })

  it('counts who would leave the shop the owner is in', () => {
    const { chain, main } = withBeach()
    const cs = [main.spawnCustomer({ kind: 'office', service: 'shampoo' }), main.spawnCustomer({ kind: 'office', service: 'shampoo' })]
    chainUntil(chain, () => cs.every(c => c.state === 'waiting'))
    expect(chain.leaveCount()).toBe(2)
    chain.goTo('beach')
    expect(cs.every(c => c.state === 'leaving')).toBe(true)
    expect(chain.leaveCount()).toBe(0)
  })
})

describe('one clock', () => {
  it('keeps the same day and minute with the owner at the beach', () => {
    const { chain, main, beach } = atBeach(starShop(3, 20_000_000, 1, true))
    const start = main.clock.minutes
    expect(chain.advance(10 * REAL_MS_PER_GAME_MIN)).toBe(10 * REAL_MS_PER_GAME_MIN)
    expect(main.clock.minutes).toBeCloseTo(start + 10)
    expect(beach.clock.minutes).toBe(main.clock.minutes)
    expect(beach.day).toBe(main.day)
    expect(chain.update(10_000)).toBe(MAX_FRAME_MS)
    expect(beach.clock.minutes).toBe(main.clock.minutes)
  })

  it('stands still while the beach is paused', () => {
    const { chain, main, beach } = atBeach()
    beach.paused = true
    const minutes = main.clock.minutes
    expect(chain.advance(1000)).toBe(0)
    expect(main.clock.minutes).toBe(minutes)
  })

  it('stands still while a beach customer is in a mini-game', () => {
    const { chain, main, beach } = atBeach()
    const c = beach.spawnCustomer({ kind: 'office', service: 'shampoo' })
    chainUntil(chain, () => c.state === 'waiting')
    beach.tapTile(c.seat!)
    chainUntil(chain, () => c.state === 'inService')
    expect(beach.servingCustomerId).toBe(c.id)
    const minutes = main.clock.minutes
    expect(chain.advance(1000)).toBe(0)
    expect(main.clock.minutes).toBe(minutes)
    expect(beach.clock.minutes).toBe(minutes)
  })
})

describe('one purse', () => {
  it('pays a beach customer into the main shop', () => {
    const { chain, main, beach } = atBeach()
    const c = beach.spawnCustomer({ kind: 'office', service: 'shampoo' })
    chainUntil(chain, () => c.state === 'waiting')
    beach.tapTile(c.seat!)
    chainUntil(chain, () => c.state === 'inService')
    beach.drainEvents()
    const before = main.money
    beach.completeService(c.id, 3)
    const paid = beach.drainEvents().find(e => e.type === 'paid')
    if (paid?.type !== 'paid') throw new Error('no payment')
    expect(main.money).toBe(before + paid.amount + paid.tip)
  })
})

describe('events of the shops the owner is away from', () => {
  it('drops every beach event while the owner is at the main shop', () => {
    const { chain, main, beach } = withBeach()
    const c = beach.spawnCustomer({ kind: 'office', service: 'shampoo' })
    chainUntil(chain, () => !beach.customers.includes(c))
    setMinutes([main, beach], DAY_END_MIN - 1)
    chainUntil(chain, () => main.dayOver)
    expect(beach.dayOver).toBe(true)
    expect(beach.drainEvents()).toEqual([])
    expect(chain.takeHeld()).toEqual([])
    expect(main.drainEvents().some(e => e.type === 'dayEnded')).toBe(true)
  })

  it("keeps the main shop's badges in order while the owner is at the beach", () => {
    const { chain } = atBeach()
    chain.advance(STEP_MS)
    expect(chain.takeHeld()).toEqual(FIRST_BADGES)
    expect(chain.takeHeld()).toEqual([])
  })

  it('calls the owner once for a VIP at the main shop', () => {
    const { chain, main } = atBeach()
    main.spawnCustomer({ vip: 'singer' })
    chain.advance(STEP_MS)
    expect(chain.takeVipCall()).toBe('singer')
    expect(chain.takeVipCall()).toBeNull()
  })

  it('calls the owner once for a star arriving at the main shop', () => {
    const { chain, main } = atBeach()
    main.spawnCustomer({ idol: 'jennie' })
    chain.advance(STEP_MS)
    expect(chain.takeIdolCall()).toBe('jennie')
    expect(chain.takeIdolCall()).toBeNull()
    expect(chain.takeVipCall()).toBeNull()
  })

  it('calls the owner to a star already waiting as she leaves the main shop', () => {
    const { chain, main } = withBeach()
    hireStaff(main, 'technician')
    main.spawnCustomer({ idol: 'jennie' })
    chainUntil(chain, () => main.customers[0]?.state === 'waiting')
    main.drainEvents()
    chain.goTo('beach')
    expect(chain.takeIdolCall()).toBe('jennie')
    expect(chain.takeIdolCall()).toBeNull()
  })

  it('clears the star calls on going back to the main shop and on a new day', () => {
    const { chain, main } = atBeach()
    main.spawnCustomer({ idol: 'jennie' })
    chain.advance(STEP_MS)
    chain.goTo(null)
    expect(chain.takeIdolCall()).toBeNull()
    chain.goTo('beach')
    main.spawnCustomer({ idol: 'gd' })
    chain.advance(STEP_MS)
    chain.startDay()
    expect(chain.takeIdolCall()).toBeNull()
  })

  it('gives a VIP call then a star call, in order, while away', () => {
    const { chain, main } = atBeach()
    main.spawnCustomer({ vip: 'singer' })
    main.spawnCustomer({ idol: 'jennie' })
    chain.advance(STEP_MS)
    expect(chain.takeVipCall()).toBe('singer')
    expect(chain.takeVipCall()).toBeNull()
    expect(chain.takeIdolCall()).toBe('jennie')
    expect(chain.takeIdolCall()).toBeNull()
  })

  it("drops the main shop's reviews and arrivals", () => {
    const { chain, main } = atBeach()
    hireStaff(main, 'technician')
    const c = main.spawnCustomer({ kind: 'office', service: 'shampoo' })
    chainUntil(chain, () => !main.customers.includes(c))
    expect(main.reviews.length).toBeGreaterThan(0)
    const types = chain.takeHeld().map(e => e.type)
    expect(types).not.toContain('review')
    expect(types).not.toContain('customerArrived')
    expect(types).not.toContain('paid')
    expect(main.drainEvents()).toEqual([])
  })

  it('routes what is still queued on the shop being left', () => {
    const { chain, main, beach } = withBeach()
    chain.advance(STEP_MS)
    main.spawnCustomer({ vip: 'singer' })
    chain.goTo('beach')
    expect(main.drainEvents()).toEqual([])
    expect(chain.takeHeld()).toEqual(FIRST_BADGES)
    expect(chain.takeVipCall()).toBe('singer')
    beach.spawnCustomer({ kind: 'office', service: 'shampoo' })
    chain.goTo(null)
    expect(beach.drainEvents()).toEqual([])
    expect(chain.takeHeld()).toEqual([])
  })

  it('calls the owner to a VIP already waiting at the main shop as she leaves it for a branch', () => {
    const { chain, main } = withBeach()
    // with no technician a waiting customer leaves with the owner, so there is no one to call her for
    hireStaff(main, 'technician')
    main.spawnCustomer({ kind: 'office', service: 'shampoo', vip: VIP_IDS[0] })
    // her arrival was already shown to the owner at the main shop; only the call on leaving is under test
    chainUntil(chain, () => main.customers[0]?.state === 'waiting')
    main.drainEvents()
    chain.goTo('beach')
    expect(chain.takeVipCall()).toBe(VIP_IDS[0])
    expect(chain.takeVipCall()).toBeNull()
    chain.goTo(null)
    expect(chain.takeVipCall()).toBeNull()
  })

  it('raises no call on leaving the main shop with no VIP waiting, and clears calls on the way home', () => {
    const { chain, main } = withBeach()
    hireStaff(main, 'technician')
    main.spawnCustomer({ kind: 'office', service: 'shampoo' })
    chain.goTo('beach')
    expect(chain.takeVipCall()).toBeNull()
    main.spawnCustomer({ kind: 'office', service: 'shampoo', vip: VIP_IDS[0] })
    chain.advance(STEP_MS)
    chain.goTo(null)
    expect(chain.takeVipCall()).toBeNull()
  })

  it('forgets a VIP call once the owner is back at the main shop', () => {
    const { chain, main } = atBeach()
    main.spawnCustomer({ vip: 'singer' })
    chain.advance(STEP_MS)
    chain.goTo(null)
    expect(chain.takeVipCall()).toBeNull()
  })

  it("keeps the main shop's day end while the owner is at the beach", () => {
    const { chain, main, beach } = atBeach()
    setMinutes([main, beach], DAY_END_MIN - 1)
    chainUntil(chain, () => main.dayOver)
    expect(chain.takeHeld().filter(e => e.type === 'dayEnded')).toEqual([{ type: 'dayEnded', stats: { ...main.stats } }])
  })
})

describe('the morning', () => {
  it('starts every shop on the next day with the owner at the main shop', () => {
    const { chain, main, beach } = atBeach()
    main.recipes.steam.solved = true
    expect(main.openService('steam')).toBeNull()
    main.eventBook.plan = { kind: 'kol', day: 41, minute: 600 }
    main.spawnCustomer({ vip: 'singer' })
    chain.advance(STEP_MS)
    chain.startDay()
    expect(main.day).toBe(41)
    expect(beach.day).toBe(41)
    expect(chain.at).toBeNull()
    expect(main.ownerHere).toBe(true)
    expect(beach.ownerHere).toBe(false)
    expect(beach.services).toContain('steam')
    expect(beach.drainEvents()).toEqual([])
    expect(beach.eventBook.plan).toBeNull()
    expect(main.drainEvents().some(e => e.type === 'eventToday')).toBe(true)
    expect(chain.takeVipCall()).toBeNull()
  })

  it("copies the owner and the shop's name to every branch", () => {
    const { chain, main, beach } = withBeach()
    main.ownerOutfit = 'uniform'
    main.shopName = 'Tiệm Sen'
    main.ownerLook = { ...main.ownerLook, hair: 3 }
    chain.sync()
    expect(beach.ownerOutfit).toBe('uniform')
    expect(beach.shopName).toBe('Tiệm Sen')
    expect(beach.ownerLook).toEqual(main.ownerLook)
    expect(beach.ownerLook).not.toBe(main.ownerLook)
  })
})

describe('the end of the day', () => {
  /** The main shop just ended its day while a beach technician still has a customer on the bed. */
  function beachStillServing() {
    const { chain, main, beach } = withBeach()
    const tech = hireStaff(beach, 'technician')
    const c = beach.spawnCustomer({ kind: 'office', service: 'shampoo' })
    chainUntil(chain, () => c.state === 'inService')
    setMinutes([main, beach], DAY_END_MIN)
    chain.advance(STEP_MS)
    expect(main.dayOver).toBe(true)
    expect(beach.dayOver).toBe(false)
    return { chain, beach, tech }
  }

  it('lets the beach finish its customer', () => {
    const { chain, beach } = beachStillServing()
    const served = beach.stats.served
    chain.finishDay()
    expect(beach.dayOver).toBe(true)
    expect(beach.stats.served).toBe(served + 1)
    expect(beach.drainEvents()).toEqual([])
  })

  it('clears the beach out when there is no time to finish', () => {
    const { chain, beach, tech } = beachStillServing()
    chain.finishDay(0)
    expect(beach.dayOver).toBe(true)
    expect(beach.customers).toEqual([])
    expect(beach.stats.wages).toBe(tech.wage)
    expect(beach.drainEvents()).toEqual([])
  })

  it("gives each shop's profit, the main shop first", () => {
    const { chain, main, beach } = withBeach()
    main.stats.income = 300_000
    beach.stats.income = 120_000
    beach.stats.wages = 50_000
    expect(chain.dayRows()).toEqual([
      { place: null, profit: dayProfit(main.stats) },
      { place: 'beach', profit: dayProfit(beach.stats) },
    ])
  })
})

/** A chain's save written as JSON and read back through parseSave, the way a slot does. */
const viaJson = (chain: Chain, seed = 8): Chain => Chain.fromSave(parseSave(JSON.parse(JSON.stringify(chain.toSave()))), seed)

describe('saving the chain', () => {
  it('writes the main shop with no place and each branch with its place and no chain', () => {
    const { chain } = withBeach()
    const data = chain.toSave()
    expect(data.place).toBeNull()
    expect(data.chain!.branches.map(b => [b.place, b.chain])).toEqual([['beach', null]])
  })

  it('round-trips a chain with the beach open, the owner there and the card told', () => {
    const { chain, main, beach } = atBeach()
    hireStaff(beach, 'technician')
    beach.stock.mud = 3
    chain.told = true
    const money = main.money
    const copy = viaJson(chain)
    const back = copy.shop('beach')!
    expect(copy.at).toBe('beach')
    expect(copy.told).toBe(true)
    expect(copy.main.ownerHere).toBe(false)
    expect(back.ownerHere).toBe(true)
    expect(back.items).toEqual(beach.items)
    expect(back.staff).toEqual(beach.staff)
    expect(back.stock).toEqual(beach.stock)
    // no second price is charged for the branch
    expect(copy.main.money).toBe(money)
    expect(back.purse).toBe(copy.main.purse)
  })

  it('keeps the main shop day card for the owner when the day ended while she was at the beach', () => {
    const { chain, main, beach } = atBeach()
    setMinutes([main, beach], DAY_END_MIN)
    chain.advance(STEP_MS)
    expect(main.dayOver).toBe(true)
    const copy = viaJson(chain)
    expect(copy.takeHeld().some(e => e.type === 'dayEnded')).toBe(true)
  })

  it('calls the owner at a branch to a VIP already waiting at the main shop when the game is loaded', () => {
    const { chain, main } = atBeach()
    main.spawnCustomer({ kind: 'office', service: 'shampoo', vip: VIP_IDS[0] })
    const copy = viaJson(chain)
    expect(copy.takeVipCall()).toBe(VIP_IDS[0])
    expect(copy.takeVipCall()).toBeNull()
    // at the main shop nobody is called
    const home = withBeach()
    home.main.spawnCustomer({ kind: 'office', service: 'shampoo', vip: VIP_IDS[0] })
    expect(viaJson(home.chain).takeVipCall()).toBeNull()
  })

  it('drops a branch that cannot be loaded and still loads the main shop', () => {
    const { chain, main } = withBeach()
    const raw = JSON.parse(JSON.stringify(chain.toSave()))
    const beach = raw.chain.branches[0]
    // a wall tile of the room
    beach.items[0] = { ...beach.items[0], x: 0, y: 0 }
    expect(() => Chain.fromSave(parseSave(structuredClone(raw)), 8)).not.toThrow(SaveError)
    const copy = Chain.fromSave(parseSave(structuredClone(raw)), 8)
    expect(copy.branches).toEqual([])
    expect(copy.at).toBeNull()
    expect(copy.main.day).toBe(main.day)
  })
})

describe("the main shop's starter chain", () => {
  it('reads a branch from a save with the chain past, whatever the save says', () => {
    const { chain } = withBeach()
    const raw = JSON.parse(JSON.stringify(chain.toSave()))
    raw.chain.branches[0].starter = newStarter()
    const copy = Chain.fromSave(parseSave(raw), 8)
    expect(isPast(copy.shop('beach')!.starter)).toBe(true)
    expect(copy.main.starter).toEqual(chain.main.starter)
  })

  it('keeps running at the main shop while the owner is at the beach, its goals kept in order for her', () => {
    const main = starShop()
    main.starter = { ...newStarter(), at: STARTER_GOAL_IDS.indexOf('serveMany') }
    main.progress.total.served = 15
    hireStaff(main, 'technician')
    const { chain } = atBeach(main)
    const money = main.money
    const c = main.spawnCustomer({ kind: 'office', service: 'shampoo' })
    chainUntil(chain, () => !main.customers.includes(c))
    const goals = chain.takeHeld().flatMap(e => (e.type === 'goalDone' ? [e.goal] : []))
    // the technician is already there and massage is open, so the next two follow at once
    expect(goals).toEqual(['serveMany', 'hireTech', 'openMassage'])
    expect(main.money).toBeGreaterThan(money)
    expect(main.drainEvents()).toEqual([])
  })
})
