import { describe, expect, it } from 'vitest'
import { FIRST_ARRIVAL_MS, RESTAURANT_PRICE, RIDE_MS } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { tileOf, type Grid } from '../../src/sim/grid'
import type { Diner, RestaurantEvent } from '../../src/sim/restaurant'
import type { SimEvent, Tile } from '../../src/sim/types'
import { ownerServes, starShop } from './helpers'

/** A chain whose main shop is on day 10 and has bought the restaurant; nobody walks in unless `autoSpawn`. */
const owned = (seed = 7, autoSpawn = false) => {
  const chain = new Chain(starShop(3, 20_000_000, seed, autoSpawn), seed)
  chain.main.day = 10
  expect(chain.buyRestaurant()).toBeNull()
  return { chain, main: chain.main, r: chain.restaurant!, street: chain.street! }
}

type Owned = ReturnType<typeof owned>

/** Runs the chain in 50 ms steps until `pred` holds. */
const runUntil = (chain: Chain, pred: () => boolean, maxMs = 60_000) => {
  for (let t = 0; !pred(); t += 50) {
    if (t > maxMs) throw new Error('condition not reached')
    chain.advance(50)
  }
}

/** A floor tile at least `away` steps from the door, scanning rows top to bottom. */
const floorTile = (grid: Grid, away = 3): Tile => {
  for (let y = 0; y < grid.rows; y++)
    for (let x = 0; x < grid.cols; x++) {
      const t = { x, y }
      if (grid.cells[y][x] === 'floor' && Math.abs(x - grid.door.x) + Math.abs(y - grid.door.y) >= away) return t
    }
  throw new Error('no floor')
}

/** `n` students seated at the restaurant with their tickets up. */
const ordering = ({ chain, r }: Owned, n = 1): Diner[] => {
  const ds = Array.from({ length: n }, () => r.spawnDiner({ kind: 'student' })!)
  runUntil(chain, () => ds.every(d => d.state === 'ordering'))
  return ds
}

/** A spa customer waiting on a seat, with patience enough for the whole test. */
const spaWaiting = ({ chain, main }: Owned) => {
  const c = main.spawnCustomer({ kind: 'office', service: 'shampoo' })
  c.patienceMs = c.patienceMaxMs = 600_000
  runUntil(chain, () => c.state === 'waiting')
  return c
}

/** Taps the diner from the spa and runs until the owner is in the restaurant. */
const rideOver = ({ chain, street }: Owned, d: Diner) => {
  expect(street.tap('restaurant', d.chair!)).toBeNull()
  runUntil(chain, () => street.where.at === 'restaurant')
}

/** The owner takes `d`'s ticket and stands at a stove with the Phở game open. */
const toStove = (o: Owned, d: Diner) => {
  rideOver(o, d)
  runUntil(o.chain, () => o.chain.cooking())
}

describe('buying the restaurant', () => {
  it('sells the restaurant from day 10 for 7.500.000 đ, once', () => {
    const chain = new Chain(starShop(3, 20_000_000, 7), 7)
    chain.main.day = 9
    expect(chain.restaurantProblem()).toBe('day')
    expect(chain.buyRestaurant()).toBe('day')
    expect(chain.restaurant).toBeNull()
    chain.main.day = 10
    chain.main.money = 7_499_999
    expect(chain.restaurantProblem()).toBe('money')
    expect(chain.buyRestaurant()).toBe('money')
    expect(chain.restaurant).toBeNull()
    chain.main.money = 20_000_000
    expect(chain.restaurantProblem()).toBeNull()
    expect(chain.buyRestaurant()).toBeNull()
    expect(chain.main.money).toBe(20_000_000 - RESTAURANT_PRICE)
    const r = chain.restaurant!
    expect(r.items.filter(i => i.kind === 'stove')).toHaveLength(2)
    expect(r.items.filter(i => i.kind === 'diningTable')).toHaveLength(2)
    expect(r.items.filter(i => i.kind === 'diningChair')).toHaveLength(8)
    expect(chain.street!.where).toEqual({ at: 'spa' })
    expect(chain.restaurantProblem()).toBe('owned')
    expect(chain.buyRestaurant()).toBe('owned')
    expect(chain.main.money).toBe(20_000_000 - RESTAURANT_PRICE)
    expect(chain.restaurant).toBe(r)
  })

  it('never gives a branch a restaurant', () => {
    const { chain, main, r } = owned()
    expect(chain.open('beach')).toBeNull()
    const beach = chain.shop('beach')!
    expect(beach.onCustomerGone).toBeNull()
    expect(beach.keepOpen()).toBe(false)
    expect(main.onCustomerGone).not.toBeNull()
    expect(chain.restaurant).toBe(r)
  })
})

describe('the owner between the two shops', () => {
  it('rides from door to door in RIDE_MS', () => {
    const o = owned()
    const [d] = ordering(o)
    expect(o.street.tap('restaurant', d.chair!)).toBeNull()
    expect(o.street.where).toEqual({ at: 'leaving', from: 'spa', tap: d.chair })
    runUntil(o.chain, () => o.street.where.at === 'riding')
    expect(o.street.where).toMatchObject({ at: 'riding', to: 'restaurant', ms: 0 })
    expect(o.main.ownerNextDoor).toBe(true)
    expect(o.street.rideProgress()).toEqual({ to: 'restaurant', k: 0 })
    o.chain.advance(RIDE_MS - 50)
    expect(o.street.where.at).toBe('riding')
    expect(o.street.rideProgress()).toEqual({ to: 'restaurant', k: (RIDE_MS - 50) / RIDE_MS })
    o.chain.advance(100)
    expect(o.street.where).toEqual({ at: 'restaurant' })
    expect(o.street.rideProgress()).toBeNull()
    expect(o.r.ownerIn).toBe(true)
    expect(o.r.owner.task).toEqual({ kind: 'order', dinerId: d.id })
    expect(o.main.ownerNextDoor).toBe(true)
  })

  it('keeps waiting spa customers and new arrivals while the owner is next door', () => {
    const o = owned(7, true)
    // the spa's first walk-in comes FIRST_ARRIVAL_MS into the day, while the owner is out on the street
    const c = o.main.spawnCustomer({ kind: 'office', service: 'shampoo' })
    c.patienceMs = c.patienceMaxMs = 600_000
    expect(o.street.tap('restaurant', floorTile(o.r.grid))).toBeNull()
    const nextDoor: SimEvent[] = []
    let ran = 0
    let out = -1
    for (; o.street.where.at !== 'restaurant'; ran += 50) {
      o.chain.advance(50)
      const events = o.main.drainEvents()
      if (o.main.ownerNextDoor) nextDoor.push(...events)
      if (o.main.ownerNextDoor && out < 0) out = ran
    }
    expect(out).toBeGreaterThanOrEqual(0)
    expect(out).toBeLessThan(FIRST_ARRIVAL_MS)
    expect(ran).toBeGreaterThan(FIRST_ARRIVAL_MS)
    for (let t = 0; t < 15_000; t += 50) {
      o.chain.advance(50)
      nextDoor.push(...o.main.drainEvents())
    }
    expect(c.state).toBe('waiting')
    expect(o.main.ownerHere).toBe(true)
    expect(o.main.ownerNextDoor).toBe(true)
    expect(nextDoor.filter(e => e.type === 'customerArrived').length).toBeGreaterThanOrEqual(1)
  })

  it('cancels the trip when the spa is tapped while walking out', () => {
    const o = owned()
    const [d] = ordering(o)
    const spot = floorTile(o.main.grid)
    expect(o.street.tap('restaurant', d.chair!)).toBeNull()
    o.chain.advance(100)
    expect(o.street.where.at).toBe('leaving')
    expect(o.street.tap('spa', spot)).toBeNull()
    expect(o.street.where).toEqual({ at: 'spa' })
    expect(o.main.owner.path[o.main.owner.path.length - 1]).toEqual(spot)
    runUntil(o.chain, () => o.main.owner.path.length === 0)
    expect(tileOf(o.main.owner.pos)).toEqual(spot)
    expect(o.main.ownerNextDoor).toBe(false)
    expect(o.r.ownerIn).toBe(false)
  })

  it('acts on the last tap made while riding', () => {
    const o = owned()
    const [a, b] = ordering(o, 2)
    expect(o.street.tap('restaurant', a.chair!)).toBeNull()
    runUntil(o.chain, () => o.street.where.at === 'riding')
    expect(o.street.tap('restaurant', b.chair!)).toBeNull()
    // a tap on the shop being ridden away from is ignored
    expect(o.street.tap('spa', floorTile(o.main.grid))).toBeNull()
    expect(o.street.where).toMatchObject({ at: 'riding', to: 'restaurant', tap: b.chair })
    runUntil(o.chain, () => o.street.where.at === 'restaurant')
    expect(o.r.owner.task).toEqual({ kind: 'order', dinerId: b.id })
  })

  it('refuses to leave mid-carry', () => {
    const o = owned()
    const c = spaWaiting(o)
    const [d] = ordering(o)
    toStove(o, d)
    o.r.completeCooking(d.id, 3)
    expect(o.r.owner.task).toEqual({ kind: 'carry', dinerId: d.id })
    expect(o.street.tap('spa', c.seat!)).toBe('busy')
    expect(o.street.where).toEqual({ at: 'restaurant' })
    expect(o.r.owner.task).toEqual({ kind: 'carry', dinerId: d.id })
  })

  it('refuses to leave the spa while fetching a customer, and ignores a tap on nothing', () => {
    const o = owned()
    const c = spaWaiting(o)
    const [d] = ordering(o)
    expect(o.street.tap('restaurant', { x: 0, y: 0 })).toBeNull()
    expect(o.street.where).toEqual({ at: 'spa' })
    o.street.tap('spa', c.seat!)
    expect(o.main.owner.task).toEqual({ kind: 'fetch', customerId: c.id })
    expect(o.street.tap('restaurant', d.chair!)).toBe('busy')
    expect(o.street.where).toEqual({ at: 'spa' })
  })

  it('walks back to the spa and fetches the customer tapped', () => {
    const o = owned()
    const c = spaWaiting(o)
    rideOverTo(o)
    expect(o.street.tap('spa', c.seat!)).toBeNull()
    expect(o.street.where).toMatchObject({ at: 'leaving', from: 'restaurant', tap: c.seat })
    runUntil(o.chain, () => o.street.where.at === 'spa')
    expect(o.r.ownerIn).toBe(false)
    expect(o.main.ownerNextDoor).toBe(false)
    expect(o.main.owner.task).toEqual({ kind: 'fetch', customerId: c.id })
  })

  it('pauses everything while a Phở bowl is cooking', () => {
    const o = owned()
    const [d] = ordering(o)
    toStove(o, d)
    expect(o.chain.drainRestaurantEvents()).toContainEqual({ type: 'cookReady', dinerId: d.id, stoveId: expect.any(Number) })
    const minutes = o.main.clock.minutes
    expect(o.chain.advance(1000)).toBe(0)
    expect(o.main.clock.minutes).toBe(minutes)
  })
})

describe('the restaurant on the chain\'s day', () => {
  it('keeps the day open until the last diner has paid', () => {
    const o = owned()
    const [d] = ordering(o)
    toStove(o, d)
    o.r.completeCooking(d.id, 3)
    runUntil(o.chain, () => d.state === 'eating')
    o.main.drainEvents()
    o.main.clock.minutes = 19 * 60 + 59
    const ended = () => o.main.drainEvents().filter(e => e.type === 'dayEnded').length
    let closedWithDiner = false
    for (let t = 0; o.r.diners.includes(d); t += 100) {
      expect(t).toBeLessThan(30_000)
      o.chain.advance(100)
      if (o.main.clock.isClosed) closedWithDiner = true
      expect(ended()).toBe(0)
    }
    expect(closedWithDiner).toBe(true)
    let count = 0
    for (let t = 0; t < 5_000; t += 100) {
      o.chain.advance(100)
      count += ended()
    }
    expect(count).toBe(1)
    expect(o.main.dayOver).toBe(true)
  })

  it('leaves the restaurant tidy when the owner goes to a branch mid-carry', () => {
    const o = owned(7, true)
    const [a, b] = ordering(o, 2)
    toStove(o, a)
    o.r.completeCooking(a.id, 3)
    expect(b.state).toBe('ordering')
    expect(o.chain.open('beach')).toBeNull()
    o.main.clock.minutes = 9 * 60
    const before = o.main.money
    const lastId = Math.max(...o.r.diners.map(x => x.id))
    o.chain.drainRestaurantEvents()
    expect(o.chain.goTo('beach')).toBeNull()
    expect(o.street.where).toEqual({ at: 'spa' })
    expect(a.state).toBe('eating')
    const seen: RestaurantEvent[] = []
    for (let t = 0; t < 120_000; t += 100) {
      o.chain.advance(100)
      seen.push(...o.chain.drainRestaurantEvents())
      if (!o.r.diners.includes(a)) expect(o.main.money).toBe(before + 80_000)
    }
    expect(seen).toContainEqual({ type: 'dinerPaid', dinerId: a.id, amount: 60_000, tip: 20_000, tile: expect.anything() })
    expect(o.main.money).toBe(before + 80_000)
    expect(o.r.diners).toHaveLength(0)
    expect(o.r.stats.walkedAway).toBe(0)
    expect(seen.some(e => e.type === 'dinerLeft' && e.angry)).toBe(false)
    expect(seen.some(e => e.type === 'dinerArrived')).toBe(false)
    expect(o.r.diners.every(x => x.id <= lastId)).toBe(true)
    o.main.clock.minutes = 10 * 60
    expect(o.chain.goTo(null)).toBeNull()
    expect(o.r.ownerAway).toBe(false)
    runUntil(o.chain, () => o.r.diners.some(x => x.id > lastId), 30_000)
  })

  it('starts each day with the owner in the spa', () => {
    const o = owned()
    rideOverTo(o)
    o.r.stats = { served: 1, income: 60_000, tips: 20_000, walkedAway: 1 }
    o.chain.startDay()
    expect(o.street.where).toEqual({ at: 'spa' })
    expect(o.main.ownerNextDoor).toBe(false)
    expect(o.r.ownerIn).toBe(false)
    expect(o.r.ownerAway).toBe(false)
    expect(o.r.stats).toEqual({ served: 0, income: 0, tips: 0, walkedAway: 0 })
  })

  it('walks a paying spa customer over through the chain', () => {
    const o = owned()
    Object.assign(o.r, { rng: () => 0.1 })
    ownerServes(o.main, 3)
    const c = o.main.customers.find(x => x.mood === 'happy')!
    expect(c.state).toBe('leaving')
    runUntil(o.chain, () => !o.main.customers.includes(c))
    expect(o.r.diners).toHaveLength(1)
    expect(o.r.diners[0]).toMatchObject({ fromSpa: true, state: 'street', kind: c.kind })
  })
})

/** Runs the owner over to the restaurant by tapping a floor tile there. */
function rideOverTo({ chain, street, r }: Owned): void {
  expect(street.tap('restaurant', floorTile(r.grid))).toBeNull()
  runUntil(chain, () => street.where.at === 'restaurant')
  expect(r.ownerIn).toBe(true)
}
