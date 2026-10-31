import { describe, expect, it } from 'vitest'
import { FIRST_ARRIVAL_MS, LOW_STOCK, RESTAURANT_RESTOCK_PRICE, RESTOCK_AMOUNT, STEP_MS, STOCK_START } from '../../src/config'
import { DISH_IDS, RESTAURANT_STOCK_ITEMS } from '../../src/sim/menu'
import type { Diner, DishId, RestaurantEvent, RestaurantSim } from '../../src/sim/restaurant'
import type { Customer } from '../../src/sim/types'
import { restaurantFor, starShop } from './helpers'

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
