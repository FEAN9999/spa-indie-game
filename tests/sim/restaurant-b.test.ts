import { describe, expect, it, vi } from 'vitest'
import { AWAY_DAY_SHARE, DINER_TIP, DISH_PRICE, FIRST_ARRIVAL_MS, LOW_STOCK, RESTAURANT_RESTOCK_PRICE, RESTOCK_AMOUNT, STEP_MS, STOCK_START } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { chefWage, type Chef, type ChefStats } from '../../src/sim/chefs'
import { tileEq, tileOf } from '../../src/sim/grid'
import { DISH_IDS, RESTAURANT_STOCK_ITEMS } from '../../src/sim/menu'
import type { Diner, DinerState, DishId, RestaurantEvent, RestaurantSim } from '../../src/sim/restaurant'
import type { Customer } from '../../src/sim/types'
import { STAFF_NAMES } from '../../src/strings/vi'
import { hireStaff, restaurantFor, starShop } from './helpers'

const setup = () => {
  const main = starShop(3, 10_000_000)
  return { main, r: restaurantFor(main) }
}

/** Spawns a student for `dish` and runs until they sit with their ticket. */
const seat = (r: RestaurantSim, dish?: DishId): Diner => {
  const d = r.spawnDiner({ kind: 'student', dish })!
  for (let t = 0; d.state !== 'ordering'; t += 50) {
    expect(t).toBeLessThan(30_000)
    r.advance(50)
  }
  r.drainEvents()
  return d
}
/** Runs until an event of `type` is told; returns it, and keeps what else came with it in `seen`. */
const runUntil = <T extends RestaurantEvent['type']>(r: RestaurantSim, type: T, seen: RestaurantEvent[] = [], maxMs = 40_000): Extract<RestaurantEvent, { type: T }> => {
  for (let t = 0; t < maxMs; t += 50) {
    r.advance(50)
    const events = r.drainEvents()
    seen.push(...events)
    const hit = events.find(e => e.type === type)
    if (hit) return hit as Extract<RestaurantEvent, { type: T }>
  }
  throw new Error(`no ${type}`)
}
/** The owner takes the ticket, cooks and the diner pays. */
const serveOne = (r: RestaurantSim, d: Diner, seen: RestaurantEvent[] = []) => {
  r.tapTile(d.chair!)
  runUntil(r, 'cookReady', seen)
  r.completeCooking(d.id, 2)
  runUntil(r, 'dinerPaid', seen)
}
const emptyStock = (r: RestaurantSim) => {
  for (const item of RESTAURANT_STOCK_ITEMS) r.stock[item] = 0
}
const customer = (): Customer => ({
  id: 1, look: { skin: 0, hair: 0, hairStyle: 0, shirt: 0 }, state: 'waiting', stateMs: 0, pos: { x: 0, y: 0 }, facing: 'down', path: [],
  patienceMs: 1, patienceMaxMs: 1, seat: null, stationId: null, mood: 'happy', greet: 0, service: 'shampoo', kind: 'student',
  regular: null, heldMs: 0, vip: null, idol: null, kol: false,
})

describe('the restaurant menu and its stock', () => {
  it('seats diners with every dish on the menu', () => {
    const { r } = setup()
    const seen = new Set<DishId>()
    for (let n = 0; n < 60; n++) {
      const d = r.spawnDiner()!
      seen.add(d.dish)
      if (d.dish === 'pho') expect(d.ticket).toHaveProperty('doneness')
      if (d.dish === 'banhXeo') expect(d.ticket).toHaveProperty('crisp')
      if (d.dish === 'che') expect(d.ticket).toHaveProperty('ice')
      expect(d.chefId).toBeNull()
      r.clearOut()
    }
    expect([...seen].sort()).toEqual([...DISH_IDS].sort())
  })

  it("reserves a seated diner's portion and stops the dish when none is left", () => {
    const { main, r } = setup()
    r.ownerArrives()
    r.stock.batter = 1
    const d = seat(r, 'banhXeo')
    expect(r.portionsLeft('banhXeo')).toBe(0)
    expect(r.sellableDishes()).not.toContain('banhXeo')
    expect(r.sellableDishes()).toContain('pho')
    const seen: RestaurantEvent[] = []
    serveOne(r, d, seen)
    expect(r.stock.batter).toBe(0)
    expect(seen).toContainEqual({ type: 'stockLow', item: 'batter', out: true })

    emptyStock(r)
    expect(r.sellableDishes()).toEqual([])
    const auto = restaurantFor(main, { autoSpawn: true })
    emptyStock(auto)
    auto.advance(FIRST_ARRIVAL_MS + 3_000)
    expect(auto.diners).toHaveLength(0)
    expect(auto.drainEvents()).toEqual([])
    for (let n = 0; n < 40; n++) expect(r.walkOver(customer())).toBe(false)
    expect(r.diners.filter(x => x.state === 'street')).toHaveLength(0)
  })

  it('stops every dish when only the herbs run out, and counts every seated diner against them', () => {
    const { r } = setup()
    r.stock.herbs = 2
    r.spawnDiner({ dish: 'pho' })
    expect(r.portionsLeft('che')).toBe(1)
    r.spawnDiner({ dish: 'banhXeo' })
    expect(r.portionsLeft('pho')).toBe(0)
    expect(r.sellableDishes()).toEqual([])
    expect(r.portionsLeft('che')).toBe(0)
  })

  it('has no dish to sell without a stove', () => {
    const { r } = setup()
    expect(r.sellableDishes()).toEqual(['pho', 'banhXeo', 'che'])
    r.items = r.items.filter(i => i.kind !== 'stove')
    expect(r.sellableDishes()).toEqual([])
  })

  it('takes one herb for every dish', () => {
    const { r } = setup()
    r.ownerArrives()
    const [a, b] = [seat(r, 'pho'), seat(r, 'che')]
    serveOne(r, a)
    expect(r.stock).toMatchObject({ phoKit: STOCK_START - 1, cheKit: STOCK_START, herbs: STOCK_START - 1 })
    serveOne(r, b)
    expect(r.stock).toMatchObject({ phoKit: STOCK_START - 1, cheKit: STOCK_START - 1, batter: STOCK_START, herbs: STOCK_START - 2 })
  })

  it('tells the view when an item gets low, not before', () => {
    const { r } = setup()
    r.ownerArrives()
    r.stock.phoKit = LOW_STOCK + 1
    const d = seat(r, 'pho')
    const seen: RestaurantEvent[] = []
    serveOne(r, d, seen)
    expect(seen.filter(e => e.type === 'stockLow')).toEqual([{ type: 'stockLow', item: 'phoKit', out: false }])
  })

  it("restocks at the purse's cost, even short of money", () => {
    const { main, r } = setup()
    main.money = 0
    r.restock('cheKit')
    expect(main.money).toBe(-RESTAURANT_RESTOCK_PRICE.cheKit)
    expect(r.stock.cheKit).toBe(STOCK_START + RESTOCK_AMOUNT)
    expect(r.stats.restock).toBe(RESTAURANT_RESTOCK_PRICE.cheKit)
  })

  it('restocks a low item by itself while the owner is at a branch', () => {
    const { main, r } = setup()
    const before = main.money
    r.ownerAway = true
    r.stock.herbs = LOW_STOCK
    r.advance(STEP_MS)
    expect(r.stock.herbs).toBe(LOW_STOCK + RESTOCK_AMOUNT)
    expect(r.stock.phoKit).toBe(STOCK_START)
    expect(main.money).toBe(before - RESTAURANT_RESTOCK_PRICE.herbs)
    expect(r.stats.restock).toBe(RESTAURANT_RESTOCK_PRICE.herbs)
  })

  it('leaves a low item alone while the owner is in town, or when the purse cannot pay', () => {
    const { main, r } = setup()
    r.stock.herbs = LOW_STOCK
    r.advance(STEP_MS)
    expect(r.stock.herbs).toBe(LOW_STOCK)
    r.ownerAway = true
    main.money = RESTAURANT_RESTOCK_PRICE.herbs - 1
    r.advance(STEP_MS)
    expect(r.stock.herbs).toBe(LOW_STOCK)
  })

  it('tells the view which dish to cook', () => {
    const { r } = setup()
    r.ownerArrives()
    const d = seat(r, 'che')
    r.tapTile(d.chair!)
    expect(runUntil(r, 'cookReady')).toMatchObject({ dinerId: d.id, dish: 'che' })
  })
})

/** Hires today's first candidate, with `stats` if given; returns the cook. */
const withChef = (r: RestaurantSim, stats?: ChefStats): Chef => {
  const c = r.todayCandidates()[0]
  if (stats) Object.assign(c, { stats, wage: chefWage(stats) })
  expect(r.hire(0)).toBeNull()
  return r.chefs[r.chefs.length - 1]
}
/** Advances in STEP_MS steps until `pred`, keeping the events in `seen`. */
const stepUntil = (r: RestaurantSim, pred: () => boolean, seen: RestaurantEvent[] = [], maxMs = 120_000) => {
  for (let t = 0; !pred(); t += STEP_MS) {
    if (t > maxMs) throw new Error('condition not reached')
    r.advance(STEP_MS)
    seen.push(...r.drainEvents())
  }
}
const cooking = (c: Chef) => c.task?.kind === 'cook' && c.path.length === 0

describe('the restaurant cooks', () => {
  it('hires up to two cooks, never with a negative purse', () => {
    const { main, r } = setup()
    r.todayCandidates()
    expect(r.chefCap()).toBe(2)
    expect([r.hire(0), r.hire(0), r.hire(0)]).toEqual([null, null, 'full'])
    expect(r.chefs.map(c => c.id)).toEqual([1, 2])
    const [a] = r.chefs
    expect(tileOf(a.pos)).toEqual(r.grid.door)
    expect(r.hasChefs()).toBe(true)
    stepUntil(r, () => r.chefs.every(c => c.path.length === 0))
    for (const c of r.chefs) expect(tileOf(c.pos)).toEqual(r.chefHome(c))
    expect(r.chefHome(a)).toEqual(r.stoves[a.id % r.stoves.length].work)
    r.fire(a.id)
    expect(r.hireProblem(0)).toBeNull()
    main.money = -1
    expect(r.hireProblem(0)).toBe('money')
    expect(r.hire(0)).toBe('money')
    expect(r.chefs).toHaveLength(2)
  })

  it("draws today's candidates once a day, with names free in both shops", () => {
    const { main, r } = setup()
    for (const [i, s] of [hireStaff(main, 'technician'), hireStaff(main, 'technician')].entries()) s.name = STAFF_NAMES[i]
    const first = r.todayCandidates()
    expect(first).toHaveLength(3)
    expect(r.todayCandidates()).toBe(first)
    expect(r.candidatesDay).toBe(main.day)
    const cook = withChef(r)
    const start = main.day
    for (let day = start + 1; day < start + 60; day++) {
      main.day = day
      const names = r.todayCandidates().map(c => c.name)
      expect(new Set(names).size).toBe(3)
      for (const taken of [STAFF_NAMES[0], STAFF_NAMES[1], cook.name]) expect(names).not.toContain(taken)
    }
  })

  it('lets a cook take a ticket, cook, carry and get paid for', () => {
    const { main, r } = setup()
    const c = withChef(r)
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    const before = main.money
    const states = new Set<DinerState>()
    const seen: RestaurantEvent[] = []
    stepUntil(r, () => {
      states.add(d.state)
      return seen.some(e => e.type === 'dinerPaid')
    }, seen)
    expect(d.chefId).toBe(c.id)
    expect(r.stats).toMatchObject({ served: 1, chefCooked: 1, ownerCooked: 0 })
    expect(states).toContain('waitingFood')
    expect(states).toContain('eating')
    expect(r.stock).toMatchObject({ phoKit: STOCK_START - 1, herbs: STOCK_START - 1 })
    expect(main.money).toBe(before + DISH_PRICE.pho + DINER_TIP[d.stars!])
    expect(r.stoves.every(s => s.dinerId === null)).toBe(true)
    stepUntil(r, () => c.path.length === 0 && c.task === null)
    expect(tileOf(c.pos)).toEqual(r.chefHome(c))
  })

  it("keeps the owner off a diner a cook has taken, and the cook off the owner's", () => {
    const o = setup()
    const { r } = o
    r.ownerArrives()
    const [a, b] = [seat(r), seat(r)]
    const c1 = withChef(r)
    r.advance(STEP_MS)
    expect(c1.task).toEqual({ kind: 'order', dinerId: a.id })
    expect(a.chefId).toBe(c1.id)
    r.tapTile(a.chair!)
    expect(r.owner.task).toBeNull()
    r.tapTile(b.chair!)
    expect(r.owner.task).toEqual({ kind: 'order', dinerId: b.id })
    const c2 = withChef(r)
    r.advance(STEP_MS)
    expect(c2.task).toBeNull()
    expect(b.chefId).toBeNull()

    // from the spa, a tap on a taken diner's chair does not call the owner over
    const chain = new Chain(starShop(3, 20_000_000, 7), 7)
    chain.main.day = 10
    expect(chain.buyRestaurant()).toBeNull()
    const rr = chain.restaurant!
    const d = rr.spawnDiner({ kind: 'student', dish: 'pho' })!
    for (let t = 0; d.state !== 'ordering'; t += 50) {
      expect(t).toBeLessThan(30_000)
      chain.advance(50)
    }
    withChef(rr)
    chain.advance(STEP_MS)
    expect(d.chefId).not.toBeNull()
    expect(chain.street!.tap('restaurant', d.chair!)).toBeNull()
    expect(chain.street!.where).toEqual({ at: 'spa' })
  })

  it("stops a cook's stove in a power cut and goes on after", () => {
    const { main, r } = setup()
    const c = withChef(r)
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    stepUntil(r, () => cooking(c))
    r.advance(STEP_MS)
    const power = vi.spyOn(main, 'powerOut').mockReturnValue(true)
    const left = (c.task as { leftMs: number }).leftMs
    const c2 = withChef(r)
    const e = r.spawnDiner({ kind: 'student', dish: 'che' })!
    stepUntil(r, () => e.state === 'ordering')
    r.advance(5_000)
    expect(c.task).toMatchObject({ kind: 'cook', leftMs: left })
    expect(c2.task).toBeNull()
    expect(e.chefId).toBeNull()
    r.ownerArrives()
    r.drainEvents()
    r.tapTile(e.chair!)
    expect(r.drainEvents()).toContainEqual({ type: 'toast', key: 'powerWait' })
    expect(r.owner.task).toBeNull()
    power.mockReturnValue(false)
    stepUntil(r, () => d.state === 'eating')
    stepUntil(r, () => e.chefId !== null)
    expect(r.stats.chefCooked).toBe(1)
  })

  it('finishes the dish of a cook let go mid-cook and pays the wage once', () => {
    const { main, r } = setup()
    const c = withChef(r)
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    stepUntil(r, () => cooking(c))
    r.fire(c.id)
    expect(c.leaving).toBe(true)
    expect(r.hasChefs()).toBe(false)
    expect(r.stats.wages).toBe(c.wage)
    stepUntil(r, () => d.state === 'eating')
    expect(r.chefs).toContain(c)
    const seen: RestaurantEvent[] = []
    stepUntil(r, () => seen.some(e => e.type === 'dinerPaid'), seen)
    expect(r.stats).toMatchObject({ served: 1, chefCooked: 1 })
    stepUntil(r, () => !r.chefs.includes(c))
    const before = main.money
    r.closeDay()
    expect(r.stats.wages).toBe(c.wage)
    expect(main.money).toBe(before - c.wage)
    expect(r.dayClosed).toBe(true)

    // a cook let go on the way to a ticket gives the diner back and leaves at once
    r.startDay()
    const c2 = withChef(r)
    const e = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    stepUntil(r, () => c2.task?.kind === 'order')
    r.fire(c2.id)
    expect(e.chefId).toBeNull()
    expect(c2.task).toEqual({ kind: 'exit' })
    stepUntil(r, () => !r.chefs.includes(c2))
    expect(e.state).toBe('ordering')
    // after the close, a cook let go is simply gone, unpaid again
    const c3 = withChef(r)
    r.closeDay()
    const wages = r.stats.wages
    r.fire(c3.id)
    expect(r.chefs).not.toContain(c3)
    expect(r.stats.wages).toBe(wages)
  })

  it('keeps serving with a cook while the owner is at a branch', () => {
    const { main, r } = setup()
    r.ownerArrives()
    const [a, b, cc] = [seat(r, 'pho'), seat(r, 'pho'), seat(r, 'pho')]
    cc.patienceMs = cc.patienceMaxMs = 600_000
    r.tapTile(a.chair!)
    const c = withChef(r)
    r.advance(STEP_MS)
    expect(r.owner.task).toEqual({ kind: 'order', dinerId: a.id })
    expect(b.chefId).toBe(c.id)
    expect(cc.chefId).toBeNull()
    r.leaveTown()
    expect(a.state).toBe('leaving')
    expect(b.state).toBe('ordering')
    expect(cc.state).toBe('ordering')
    const seen: RestaurantEvent[] = []
    stepUntil(r, () => seen.some(e => e.type === 'dinerPaid' && e.dinerId === b.id), seen)
    stepUntil(r, () => cc.chefId === c.id, seen)
    stepUntil(r, () => seen.some(e => e.type === 'dinerPaid' && e.dinerId === cc.id), seen)
    expect(r.stats).toMatchObject({ served: 2, chefCooked: 2, walkedAway: 0 })
    expect(seen.some(e => e.type === 'dinerLeft' && e.angry)).toBe(false)

    const auto = restaurantFor(main, { autoSpawn: true })
    withChef(auto)
    auto.leaveTown()
    auto.advance(FIRST_ARRIVAL_MS + 3_000)
    expect(auto.diners.length).toBeGreaterThan(0)
    Object.assign(auto, { rng: () => 0.1 })
    expect(auto.walkOver(customer())).toBe(true)
  })

  it("takes the cooks' wages from the purse when the day closes", () => {
    const run = (hire: boolean) => {
      const chain = new Chain(starShop(3, 20_000_000, 7), 7)
      chain.main.day = 10
      expect(chain.buyRestaurant()).toBeNull()
      const r = chain.restaurant!
      const c = hire ? withChef(r) : null
      const close = vi.spyOn(r, 'closeDay')
      chain.main.clock.minutes = 19 * 60 + 59
      for (let t = 0; !chain.main.dayOver; t += 100) {
        expect(t).toBeLessThan(30_000)
        chain.advance(100)
      }
      return { chain, r, c, close }
    }
    const without = run(false)
    const { chain, r, c, close } = run(true)
    expect(chain.main.money).toBe(without.chain.main.money - c!.wage)
    expect(r.stats.wages).toBe(c!.wage)
    expect(r.dayClosed).toBe(true)
    const money = chain.main.money
    chain.advance(100)
    chain.advance(100)
    expect(chain.main.money).toBe(money)
    expect(close).toHaveBeenCalledTimes(1)
    expect(Chain.fromSave(chain.toSave(), 7).restaurant!.dayClosed).toBe(true)
    chain.startDay()
    expect(r.dayClosed).toBe(false)
    expect(tileEq(tileOf(c!.pos), r.chefHome(c!))).toBe(true)
  })
})

describe('lessons and the away money of the restaurant', () => {
  it('marks a dish learned after its first cook, once', () => {
    const { r } = setup()
    r.ownerArrives()
    expect(r.learned).toEqual([])
    expect(r.needsLesson('che')).toBe(true)
    serveOne(r, seat(r, 'che'))
    expect(r.needsLesson('che')).toBe(false)
    expect(r.needsLesson('pho')).toBe(true)
    serveOne(r, seat(r, 'che'))
    expect(r.learned).toEqual(['che'])
  })
  it('pays the restaurant for time away after a cooks-only day', () => {
    const { main, r } = setup()
    r.stats.income = 200_000
    r.stats.chefCooked = 3
    r.closeDay()
    const money = main.money
    const back = r.comeBack(2 * 3_600_000)
    const pay = Math.round((2 * AWAY_DAY_SHARE * 200_000) / 1000) * 1000
    expect(pay).toBeGreaterThan(0)
    expect(main.money).toBe(money + pay)
    expect(back).toEqual({ paid: pay, places: ['restaurant'], ms: 2 * 3_600_000, profit: 200_000, days: 1, capped: false, tip: false })
  })
  it('pays nothing after a day the owner cooked', () => {
    const { main, r } = setup()
    r.stats.income = 200_000
    r.stats.chefCooked = 3
    r.stats.ownerCooked = 1
    r.closeDay()
    const money = main.money
    const back = r.comeBack(2 * 3_600_000)
    expect(back.paid).toBe(0)
    expect(back.places).toEqual([])
    expect(main.money).toBe(money)
  })
  it('takes the wages and stock of the day off the profit', () => {
    const { r } = setup()
    r.stats.income = 100_000
    r.stats.tips = 20_000
    r.stats.restock = 40_000
    r.stats.chefCooked = 1
    r.closeDay()
    expect(r.away.profits).toEqual([80_000])
  })
})
