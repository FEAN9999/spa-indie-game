import { describe, expect, it, vi } from 'vitest'
import { DINER_GAP_MIN, EXIT_MS, REAL_MS_PER_GAME_MIN } from '../../src/config'
import { DINING_START, diningSeats } from '../../src/sim/dining'
import { tileEq } from '../../src/sim/grid'
import { ITEMS, type ItemKind } from '../../src/sim/items'
import { findPath } from '../../src/sim/path'
import { dinerGapMs, type RestaurantSim } from '../../src/sim/restaurant'
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
    expect(main.money).toBe(before - 400_000)
    const id = r.items[r.items.length - 1].id
    expect(r.sell(id)).toBeNull()
    expect(main.money).toBe(before - 400_000 + Math.floor(ITEMS.stove.price / 2))
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
    const d = r.spawnDiner({ kind: 'student' })!
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
    const d = r.spawnDiner({ kind: 'student' })!
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
    const d = r.spawnDiner({ kind: 'student' })!
    advance(main, r, 8_000 + d.patienceMaxMs)
    expect(r.drainEvents()).toContainEqual({ type: 'dinerLeft', id: d.id, angry: true })
    expect(r.stats.walkedAway).toBe(1)
    expect(d.mood).toBe('angry')
    advance(main, r, 8_000 + EXIT_MS)
    expect(r.diners).toHaveLength(0)
    expect(r.freeSeats()).toHaveLength(8)
  })
})
