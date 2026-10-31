import { describe, expect, it, vi } from 'vitest'
import { DINER_GAP_MIN, DINER_TIP, EAT_MS, EXIT_MS, REAL_MS_PER_GAME_MIN } from '../../src/config'
import { DINING_START, diningSeats } from '../../src/sim/dining'
import type { Stars } from '../../src/sim/economy'
import { tileEq, tileOf } from '../../src/sim/grid'
import { ITEMS, type ItemKind } from '../../src/sim/items'
import { findPath } from '../../src/sim/path'
import { dinerGapMs, type Diner, type RestaurantEvent, type RestaurantSim } from '../../src/sim/restaurant'
import type { SpaSim } from '../../src/sim/spa'
import type { Customer } from '../../src/sim/types'
import { restaurantFor, starShop } from './helpers'

const setup = () => {
  const main = starShop(3, 10_000_000)
  return { main, r: restaurantFor(main) }
}
const count = (r: ReturnType<typeof setup>['r'], kind: ItemKind) => r.items.filter(i => i.kind === kind).length

describe('the restaurant room', () => {
  it('opens with two stoves, two tables, eight chairs and the serving counter', () => {
    const { r } = setup()
    expect(count(r, 'stove')).toBe(2)
    expect(count(r, 'diningTable')).toBe(2)
    expect(count(r, 'diningChair')).toBe(8)
    expect(count(r, 'servingCounter')).toBe(2)
    expect(diningSeats(r.items)).toHaveLength(8)
    expect(r.grid.door).toEqual({ x: 18, y: 17 })
    expect(r.grid.works).toContainEqual({ x: 15, y: 3 })
    expect(r.grid.works).toContainEqual({ x: 18, y: 3 })
  })

  it('lays every start piece where the build rules allow it', () => {
    const { r } = setup()
    expect(r.items).toHaveLength(DINING_START.length)
    for (const item of r.items) expect(r.canPlace(item.kind, item.x, item.y, item.flip, item.id), item.kind).toBeNull()
  })

  it('walks from the door to every chair and every stove', () => {
    const { r } = setup()
    for (const seat of diningSeats(r.items)) expect(findPath(r.grid, r.grid.door, t => tileEq(t, seat.tile)), JSON.stringify(seat.tile)).not.toBeNull()
    for (const work of r.grid.works) expect(findPath(r.grid, r.grid.door, t => tileEq(t, work)), JSON.stringify(work)).not.toBeNull()
  })

  it('seats a diner only on a chair that touches a table', () => {
    const { r } = setup()
    expect(r.buy('diningChair', 14, 12, false)).toBeNull()
    expect(diningSeats(r.items)).toHaveLength(8)
    expect(r.buy('diningTable', 14, 13, false)).toBeNull()
    const seats = diningSeats(r.items)
    expect(seats).toHaveLength(9)
    expect(seats.find(s => tileEq(s.tile, { x: 14, y: 12 }))?.facing).toBe('down')
  })

  it('buys and sells from the shared purse', () => {
    const { main, r } = setup()
    const before = main.money
    expect(r.money).toBe(before)
    expect(r.buy('stove', 21, 3, false)).toBeNull()
    expect(main.money).toBe(before - 600_000)
    const id = r.items[r.items.length - 1].id
    expect(r.sell(id)).toBeNull()
    expect(main.money).toBe(before - 600_000 + Math.floor(ITEMS.stove.price / 2))
    expect(r.items.some(i => i.id === id)).toBe(false)
  })

  it('refuses a purchase the purse cannot pay and a spot that is taken', () => {
    const main = starShop(3, 100_000)
    const r = restaurantFor(main)
    expect(r.buy('stove', 21, 3, false)).toBe('money')
    main.money = 10_000_000
    expect(r.buy('stove', 15, 2, false)).toBe('overlap')
    expect(main.money).toBe(10_000_000)
  })

  it('refuses spa pieces in the restaurant', () => {
    const { r } = setup()
    expect(r.canPlace('bed', 14, 12, false)).toBe('wrongShop')
    expect(r.canPlace('bench', 14, 12, false)).toBe('wrongShop')
    expect(r.canPlace('plant', 14, 12, false)).toBeNull()
  })

  it('refuses to sell the last stove, table or chair', () => {
    const { r } = setup()
    const ids = (kind: ItemKind) => r.items.filter(i => i.kind === kind).map(i => i.id)
    expect(r.sell(ids('stove')[0])).toBeNull()
    expect(r.sell(ids('diningTable')[0])).toBeNull()
    for (let n = 0; n < 7; n++) expect(r.sell(ids('diningChair')[0])).toBeNull()
    for (const kind of ['stove', 'diningTable', 'diningChair'] as const) expect(r.sell(ids(kind)[0]), kind).toBe('lastDining')
    expect(count(r, 'stove')).toBe(1)
    const stove = r.items.find(i => i.kind === 'stove')!
    expect(r.move(stove.id, 21, 3, false)).toBeNull()
    expect(r.items.find(i => i.id === stove.id)).toMatchObject({ x: 21, y: 3 })
  })

  it('tells the view the room changed, and counts beauty from its pieces', () => {
    const { r } = setup()
    expect(r.drainEvents()).toEqual([])
    r.buy('plant', 14, 12, false)
    expect(r.drainEvents()).toEqual([{ type: 'roomChanged' }])
    expect(r.drainEvents()).toEqual([])
    expect(r.beauty()).toBeGreaterThan(0)
    expect(r.isBusy(r.items[0].id)).toBe(false)
  })
})

const advance = (main: SpaSim, r: RestaurantSim, ms: number) => {
  main.advance(ms)
  r.advance(ms)
}
const customer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 1, look: { skin: 0, hair: 0, hairStyle: 0, shirt: 0 }, state: 'waiting', stateMs: 0, pos: { x: 0, y: 0 }, facing: 'down', path: [],
  patienceMs: 1, patienceMaxMs: 1, seat: null, stationId: null, mood: 'happy', greet: 0, service: 'shampoo', kind: 'student',
  regular: null, heldMs: 0, vip: null, idol: null, kol: false, ...overrides,
})
const fillSeats = (r: RestaurantSim) => {
  for (let n = 0; n < 8; n++) expect(r.spawnDiner()).not.toBeNull()
}

describe('the restaurant diners', () => {
  it('sends walk-ins two and a half times as often at lunch and dinner', () => {
    const base = DINER_GAP_MIN * REAL_MS_PER_GAME_MIN
    expect(dinerGapMs(600)).toBe(base)
    expect(dinerGapMs(700)).toBeCloseTo(base / 2.5)
    expect(dinerGapMs(1100)).toBeCloseTo(base / 2.5)
    expect(dinerGapMs(780)).toBe(base)
  })

  it('brings more walk-ins at lunch than in the morning', () => {
    const arrivals = (minutes: number) => {
      const main = starShop(3, 10_000_000)
      const r = restaurantFor(main, { seed: 7, autoSpawn: true })
      let n = 0
      for (let t = 0; t < 120_000; t += 50) {
        main.clock.minutes = minutes
        r.advance(50)
        if (t % 10_000 === 0) r.clearOut()
        n += r.drainEvents().filter(e => e.type === 'dinerArrived' || e.type === 'dinerPassed').length
      }
      return n
    }
    expect(arrivals(720)).toBeGreaterThan(arrivals(540))
  })

  it('seats a walk-in, shows a ticket and runs down patience only while ordering', () => {
    const { main, r } = setup()
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    expect(d.state).toBe('arriving')
    for (let t = 0; d.state !== 'ordering'; t += 50) {
      expect(t).toBeLessThan(20_000)
      expect(d.patienceMs).toBe(d.patienceMaxMs)
      advance(main, r, 50)
    }
    expect(d.ticket).toBeDefined()
    expect(diningSeats(DINING_START.map((it, i) => ({ ...it, id: i + 1 }))).some(s => tileEq(s.tile, d.chair!))).toBe(true)
    expect(r.drainEvents()).toContainEqual({ type: 'dinerArrived', id: d.id })
    advance(main, r, 10_000)
    expect(d.patienceMs).toBe(d.patienceMaxMs - 10_000)
  })

  it('lets a walk-in pass by without a word when every chair is taken', () => {
    const main = starShop(3, 10_000_000)
    const r = restaurantFor(main, { autoSpawn: true })
    fillSeats(r)
    expect(r.spawnDiner()).toBeNull()
    r.drainEvents()
    r.advance(3_050)
    expect(r.drainEvents()).toContainEqual({ type: 'dinerPassed' })
    expect(r.diners).toHaveLength(8)
    expect(r.stats.walkedAway).toBe(0)
  })

  it('walks a third of the paying spa customers over', () => {
    const main = starShop(3, 10_000_000)
    const r = restaurantFor(main, { seed: 5 })
    let walked = 0
    for (let n = 0; n < 300; n++) {
      if (r.walkOver(customer())) walked++
      r.clearOut()
    }
    expect(walked).toBeGreaterThanOrEqual(70)
    expect(walked).toBeLessThanOrEqual(130)
  })

  it('never walks a customer over without a free chair, after closing, from a branch trip, or for a star guest', () => {
    const { main, r } = setup()
    const refused = (c: Customer) => {
      const before = r.diners.length
      for (let n = 0; n < 40; n++) expect(r.walkOver(c)).toBe(false)
      expect(r.diners).toHaveLength(before)
    }
    fillSeats(r)
    refused(customer())
    r.clearOut()
    main.clock.minutes = 20 * 60
    refused(customer())
    main.clock.minutes = 10 * 60
    r.ownerAway = true
    refused(customer())
    r.ownerAway = false
    refused(customer({ vip: 'singer' }))
    refused(customer({ idol: 'sontung' }))
    refused(customer({ kol: true }))
    refused(customer({ mood: 'angry' }))
    refused(customer({ mood: null }))
  })

  it('takes the walker the street leg before they come in', () => {
    const { main, r } = setup()
    while (!r.walkOver(customer({ kind: 'student' }))) { /* a refused roll draws one number and makes no diner */ }
    const d = r.diners[0]
    expect(d).toMatchObject({ state: 'street', fromSpa: true, kind: 'student', legMs: 7_400 })
    advance(main, r, 7_350)
    expect(d.state).toBe('street')
    advance(main, r, 100)
    expect(d.state).toBe('arriving')
  })

  it('freezes ticket patience in a power cut', () => {
    const { main, r } = setup()
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    for (let t = 0; d.state !== 'ordering'; t += 50) {
      expect(t).toBeLessThan(20_000)
      advance(main, r, 50)
    }
    advance(main, r, 1_000)
    const left = d.patienceMs
    expect(left).toBeLessThan(d.patienceMaxMs)
    vi.spyOn(main, 'powerOut').mockReturnValue(true)
    advance(main, r, 5_000)
    expect(d.patienceMs).toBe(left)
  })

  it('walks out angry when nobody takes the ticket', () => {
    const { main, r } = setup()
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    advance(main, r, 8_000 + d.patienceMaxMs)
    expect(r.drainEvents()).toContainEqual({ type: 'dinerLeft', id: d.id, angry: true })
    expect(r.stats.walkedAway).toBe(1)
    expect(d.mood).toBe('angry')
    advance(main, r, 8_000 + EXIT_MS)
    expect(r.diners).toHaveLength(0)
    expect(r.freeSeats()).toHaveLength(8)
  })
})

/** Spawns `n` students and runs until each sits with its ticket. */
const seatDiners = (r: RestaurantSim, n: number): Diner[] => {
  const ds = Array.from({ length: n }, () => r.spawnDiner({ kind: 'student', dish: 'pho' })!)
  for (let t = 0; ds.some(d => d.state !== 'ordering'); t += 50) {
    expect(t).toBeLessThan(30_000)
    r.advance(50)
  }
  r.drainEvents()
  return ds
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
/** The owner takes the ticket, cooks with `stars` and the diner pays; returns the payment. */
const serveOne = (r: RestaurantSim, d: Diner, stars: Stars) => {
  r.tapTile(d.chair!)
  runUntil(r, 'cookReady')
  r.completeCooking(d.id, stars)
  return runUntil(r, 'dinerPaid')
}

describe('the owner working the restaurant', () => {
  it('serves Phở from the ticket to the till', () => {
    const { main, r } = setup()
    r.ownerArrives()
    const [d] = seatDiners(r, 1)
    const chair = { ...d.chair! }
    const spa = structuredClone(main.stats)
    const before = main.money
    r.tapTile(d.chair!)
    expect(r.owner.task).toMatchObject({ kind: 'order', dinerId: d.id })
    const ready = runUntil(r, 'cookReady')
    expect(ready.dinerId).toBe(d.id)
    expect(r.stoves.map(s => s.id)).toContain(ready.stoveId)
    expect(d.state).toBe('waitingFood')
    expect(r.cookingDinerId).toBe(d.id)
    expect(r.ownerBusy()).toBe(true)
    expect(r.busy()).toBe(true)
    expect(r.advance(1_000)).toBe(0)
    r.completeCooking(d.id, 3)
    expect(r.cookingDinerId).toBeNull()
    expect(r.owner.task).toMatchObject({ kind: 'carry', dinerId: d.id })
    const seen: RestaurantEvent[] = []
    const paid = runUntil(r, 'dinerPaid', seen)
    expect(paid).toMatchObject({ dinerId: d.id, amount: 30_000, tip: 10_000, tile: chair })
    expect(d.state).toBe('leaving')
    expect(main.money).toBe(before + 40_000)
    expect(r.stats).toEqual({ served: 1, income: 30_000, tips: 10_000, walkedAway: 0, wages: 0, restock: 0, ownerCooked: 0, chefCooked: 0 })
    expect(d.mood).toBe('happy')
    expect(main.stats).toEqual(spa)
    expect(r.owner.task).toBeNull()
    r.advance(3_000 + EXIT_MS + 1_000)
    expect(r.diners).toHaveLength(0)
    expect(r.freeSeats()).toHaveLength(8)
    expect(r.stoves.every(s => s.dinerId === null)).toBe(true)
  })

  it('eats for EAT_MS before paying', () => {
    const { r } = setup()
    r.ownerArrives()
    const [d] = seatDiners(r, 1)
    r.tapTile(d.chair!)
    runUntil(r, 'cookReady')
    r.completeCooking(d.id, 2)
    for (let t = 0; d.state !== 'eating'; t += 50) {
      expect(t).toBeLessThan(10_000)
      r.advance(50)
    }
    r.drainEvents()
    r.advance(EAT_MS - 100)
    expect(r.drainEvents().some(e => e.type === 'dinerPaid')).toBe(false)
    r.advance(200)
    expect(r.drainEvents().some(e => e.type === 'dinerPaid')).toBe(true)
  })

  it('tips by the stars', () => {
    const { r } = setup()
    r.ownerArrives()
    const tips: number[] = []
    const moods: (string | null)[] = []
    for (const stars of [1, 2, 3] as const) {
      const [d] = seatDiners(r, 1)
      tips.push(serveOne(r, d, stars).tip)
      moods.push(d.mood)
    }
    expect(tips).toEqual([DINER_TIP[1], DINER_TIP[2], DINER_TIP[3]])
    expect(tips).toEqual([2_500, 5_000, 10_000])
    expect(moods).toEqual(['ok', 'happy', 'happy'])
    expect(r.stats.walkedAway).toBe(0)
    expect(r.stats.served).toBe(3)
  })

  it('says no stove is free when both are taken', () => {
    const { r } = setup()
    r.ownerArrives()
    const ds = seatDiners(r, 3)
    r.stoves[0].dinerId = ds[0].id
    r.stoves[1].dinerId = ds[1].id
    r.tapTile(ds[2].chair!)
    expect(r.drainEvents()).toContainEqual({ type: 'toast', key: 'stovesBusy' })
    expect(r.owner.task).toBeNull()
  })

  it('says no stove is free if the stoves fill up while the owner walks over', () => {
    const { r } = setup()
    r.ownerArrives()
    const ds = seatDiners(r, 3)
    r.tapTile(ds[2].chair!)
    expect(r.owner.task).toMatchObject({ kind: 'order' })
    r.stoves[0].dinerId = ds[0].id
    r.stoves[1].dinerId = ds[1].id
    runUntil(r, 'toast')
    expect(r.owner.task).toBeNull()
    expect(ds[2].state).toBe('ordering')
  })

  it('starts no cook in a power cut and waits at the stove until the power is back', () => {
    const { main, r } = setup()
    r.ownerArrives()
    const [d] = seatDiners(r, 1)
    const out = vi.spyOn(main, 'powerOut').mockReturnValue(true)
    r.tapTile(d.chair!)
    expect(r.drainEvents()).toContainEqual({ type: 'toast', key: 'powerWait' })
    expect(r.owner.task).toBeNull()
    out.mockReturnValue(false)
    r.tapTile(d.chair!)
    for (let t = 0; r.owner.task?.kind !== 'cook'; t += 50) {
      expect(t).toBeLessThan(20_000)
      r.advance(50)
    }
    r.drainEvents()
    out.mockReturnValue(true)
    const seen: RestaurantEvent[] = []
    for (let t = 0; t < 5_000; t += 50) {
      r.advance(50)
      seen.push(...r.drainEvents())
    }
    expect(seen.filter(e => e.type === 'cookReady')).toHaveLength(0)
    expect(seen.filter(e => e.type === 'toast' && e.key === 'powerWait')).toHaveLength(1)
    expect(r.cookingDinerId).toBeNull()
    out.mockReturnValue(false)
    expect(runUntil(r, 'cookReady').dinerId).toBe(d.id)
  })

  it('refuses to move a stove being cooked at or a chair with a diner', () => {
    const { r } = setup()
    r.ownerArrives()
    const [d] = seatDiners(r, 1)
    const stoveIds = r.stoves.map(s => s.id)
    r.tapTile(d.chair!)
    const { stoveId } = runUntil(r, 'cookReady')
    expect(r.cookingDinerId).toBe(d.id)
    expect(r.isBusy(stoveId)).toBe(true)
    expect(r.move(stoveId, 21, 3, false)).toBe('busy')
    expect(r.sell(stoveId)).toBe('busy')
    const other = stoveIds.find(id => id !== stoveId)!
    expect(r.isBusy(other)).toBe(false)
    const chair = r.items.find(i => i.kind === 'diningChair' && tileEq(i, d.chair!))!
    const table = r.items.find(i => i.kind === 'diningTable' && Math.abs(i.x - chair.x) <= 2 && Math.abs(i.y - chair.y) <= 2)!
    expect(r.move(chair.id, 22, 12, false)).toBe('busy')
    expect(r.sell(chair.id)).toBe('busy')
    expect(r.move(table.id, 22, 12, false)).toBe('busy')
    expect(r.sell(table.id)).toBe('busy')
    r.completeCooking(d.id, 3)
    expect(r.isBusy(stoveId)).toBe(false)
    expect(r.isBusy(chair.id)).toBe(true)
    runUntil(r, 'dinerPaid')
    r.advance(EXIT_MS + 5_000)
    expect(r.isBusy(chair.id)).toBe(false)
    expect(r.isBusy(table.id)).toBe(false)
  })

  it('ignores taps while cooking or carrying', () => {
    const { r } = setup()
    r.ownerArrives()
    const [a, b] = seatDiners(r, 2)
    r.tapTile(a.chair!)
    runUntil(r, 'cookReady')
    r.tapTile(b.chair!)
    r.tapTile(r.grid.door)
    expect(r.owner.task).toMatchObject({ kind: 'cook', dinerId: a.id })
    r.completeCooking(a.id, 2)
    r.tapTile(b.chair!)
    expect(r.owner.task).toMatchObject({ kind: 'carry', dinerId: a.id })
    expect(r.stoves.filter(s => s.dinerId !== null)).toHaveLength(0)
  })

  it('ignores taps while the owner is not in this shop and walks to a plain tile', () => {
    const { r } = setup()
    const [d] = seatDiners(r, 1)
    r.tapTile(d.chair!)
    expect(r.owner.task).toBeNull()
    r.ownerArrives()
    expect(r.ownerAtDoor()).toBe(true)
    const goal = { x: 16, y: 12 }
    r.tapTile(goal)
    expect(r.owner.task).toBeNull()
    expect(r.ownerAtDoor()).toBe(false)
    r.advance(10_000)
    expect(tileOf(r.owner.pos)).toEqual(goal)
  })

  it('walks the owner out only when no work is held', () => {
    const { r } = setup()
    r.ownerArrives()
    const [d] = seatDiners(r, 1)
    r.tapTile(d.chair!)
    expect(r.ownerBusy()).toBe(true)
    expect(r.ownerWalksOut()).toBe(false)
    runUntil(r, 'cookReady')
    expect(r.ownerWalksOut()).toBe(false)
    r.completeCooking(d.id, 3)
    runUntil(r, 'dinerPaid')
    expect(r.ownerBusy()).toBe(false)
    expect(r.ownerWalksOut()).toBe(true)
    r.advance(10_000)
    expect(r.ownerAtDoor()).toBe(true)
    r.ownerLeaves()
    expect(r.ownerIn).toBe(false)
    expect(r.owner.task).toBeNull()
  })

  it('gives up the order when the diner walks out before the owner arrives', () => {
    const { r } = setup()
    r.ownerArrives()
    const [d] = seatDiners(r, 1)
    d.patienceMs = 50
    r.tapTile(d.chair!)
    runUntil(r, 'dinerLeft')
    r.advance(100)
    expect(r.owner.task).toBeNull()
    expect(r.stoves.every(s => s.dinerId === null)).toBe(true)
  })

  it('keeps going when furniture is bought in the owner\'s way', () => {
    const { r } = setup()
    r.ownerArrives()
    const [d] = seatDiners(r, 1)
    r.tapTile(d.chair!)
    r.advance(300)
    expect(r.buy('plant', 18, 14, false)).toBeNull()
    expect(runUntil(r, 'cookReady').dinerId).toBe(d.id)
  })

  it('serves the carried dish and lets the waiting go when the owner leaves town', () => {
    const { main, r } = setup()
    r.ownerArrives()
    const [a, b, c] = seatDiners(r, 3)
    r.tapTile(a.chair!)
    runUntil(r, 'cookReady')
    r.completeCooking(a.id, 2)
    expect(r.owner.task).toMatchObject({ kind: 'carry' })
    r.tapTile(b.chair!)
    while (!r.walkOver(customer({ kind: 'student' }))) { /* a refused roll makes no diner */ }
    const street = r.diners.find(x => x.state === 'street')!
    const before = main.money
    r.leaveTown()
    expect(r.ownerAway).toBe(true)
    expect(r.ownerIn).toBe(false)
    expect(r.owner.task).toBeNull()
    expect(a.state).toBe('eating')
    expect(r.cookingDinerId).toBeNull()
    const seen: RestaurantEvent[] = []
    runUntil(r, 'dinerPaid', seen)
    expect(main.money).toBe(before + 30_000 + 5_000)
    r.advance(EXIT_MS + 6_000)
    seen.push(...r.drainEvents())
    expect(r.diners).toHaveLength(0)
    expect(r.diners.includes(street)).toBe(false)
    expect(r.stats).toMatchObject({ served: 1, walkedAway: 0 })
    expect(seen).not.toContainEqual(expect.objectContaining({ type: 'dinerLeft', angry: true }))
    expect(b.mood).toBeNull()
    expect(c.mood).toBeNull()
    expect(r.freeSeats()).toHaveLength(8)
    expect(r.stoves.every(s => s.dinerId === null)).toBe(true)
  })

  it('sends away a diner still coming in or walking to a chair when the owner leaves town', () => {
    const { r } = setup()
    r.ownerArrives()
    const walking = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    for (let t = 0; walking.state !== 'toChair'; t += 50) {
      expect(t).toBeLessThan(5_000)
      r.advance(50)
    }
    const coming = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    expect(coming.state).toBe('arriving')
    r.drainEvents()
    r.leaveTown()
    expect(r.freeSeats()).toHaveLength(8)
    r.advance(EXIT_MS + 8_000)
    expect(r.drainEvents().some(e => e.type === 'dinerLeft' || e.type === 'dinerArrived')).toBe(false)
    expect(r.diners).toHaveLength(0)
    expect(r.stats).toEqual({ served: 0, income: 0, tips: 0, walkedAway: 0, wages: 0, restock: 0, ownerCooked: 0, chefCooked: 0 })
    expect(walking.mood).toBeNull()
    expect(coming.mood).toBeNull()
  })

  it('lets go of a diner waiting at the stove when the owner leaves town mid-cook', () => {
    const { r } = setup()
    r.ownerArrives()
    const [d] = seatDiners(r, 1)
    r.tapTile(d.chair!)
    runUntil(r, 'cookReady')
    r.leaveTown()
    expect(r.cookingDinerId).toBeNull()
    expect(r.busy()).toBe(true)
    r.advance(EXIT_MS + 6_000)
    expect(r.diners).toHaveLength(0)
    expect(r.stats).toEqual({ served: 0, income: 0, tips: 0, walkedAway: 0, wages: 0, restock: 0, ownerCooked: 0, chefCooked: 0 })
    expect(r.stoves.every(s => s.dinerId === null)).toBe(true)
  })
})
