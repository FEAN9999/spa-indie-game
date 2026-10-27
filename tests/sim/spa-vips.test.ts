import { describe, expect, it } from 'vitest'
import { ANGRY_REVIEW, DAY_END_MIN, OWNER_START, PATIENCE_MS, SERVICE_PRICE, STEP_MS, VIP_PATIENCE } from '../../src/config'
import { dayEase, tipFor } from '../../src/sim/economy'
import { isWalkable, manhattan, tileOf } from '../../src/sim/grid'
import { createRng, type Rng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import { tipFactor } from '../../src/sim/staff'
import type { SimEvent } from '../../src/sim/types'
import { emptyVipBook, planBooking, VIP_KIND, VIPS } from '../../src/sim/vips'
import v8 from '../fixtures/save-v8.json'
import { advanceUntil, hireStaff, seatAndWait, startService } from './helpers'

const fresh = (rng: Rng = createRng(1)) => new SpaSim({ rng, autoSpawn: false })

/** A shop with mask open and one mask bed by the back wall. */
const withMask = (rng?: Rng) => {
  const sim = fresh(rng)
  sim.money = 2_000_000
  expect(sim.openService('mask')).toBeNull()
  expect(sim.buy('maskBed', 6, 2, false)).toBeNull()
  sim.drainEvents()
  return sim
}

/** Every seat taken by someone who is not there. */
const fillSeats = (sim: SpaSim) => {
  for (const s of sim.seats) s.customerId = 999
}

const endDay = (sim: SpaSim) => advanceUntil(sim, () => sim.dayOver, 200_000)

const viaJson = (sim: SpaSim, autoSpawn = false) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(1), autoSpawn })

/** A seeded rng that counts its draws. */
function counting(seed: number) {
  const rng = createRng(seed)
  const counter = { draws: 0, rng: () => (counter.draws++, rng()) }
  return counter
}

describe('booking a VIP', () => {
  it('books a VIP at the end of a day with two technicians', () => {
    const r = counting(1)
    const sim = withMask(r.rng)
    hireStaff(sim, 'technician')
    hireStaff(sim, 'technician')
    const nextId = sim.toSave().nextId
    const draws = r.draws
    endDay(sim)
    expect(sim.vip.booking?.day).toBe(sim.day + 1)
    // its own stream, never the shop's
    expect(r.draws).toBe(draws)
    expect(sim.vip.booking).toEqual(planBooking(emptyVipBook(), sim.day, 2, sim.availableServices(), createRng(sim.day * 7919 + nextId)))
  })

  it('books no one while the second technician is leaving', () => {
    const sim = withMask()
    hireStaff(sim, 'technician')
    sim.fire(hireStaff(sim, 'technician').id)
    endDay(sim)
    expect(sim.vip.booking).toBeNull()
  })

  it("books an old shop's first VIP at the end of its first eligible day", () => {
    const open = () => SpaSim.fromSave(parseSave(structuredClone(v8)), { rng: createRng(1), autoSpawn: false })
    // one technician: not yet
    const alone = open()
    endDay(alone)
    expect(alone.vip.booking).toBeNull()

    const sim = open()
    expect(sim.vip).toEqual(emptyVipBook())
    hireStaff(sim, 'technician')
    endDay(sim)
    expect(sim.vip.booking).toEqual({ vip: 'miss', day: v8.day + 1, minute: expect.any(Number) })
    expect(sim.vip.everBooked).toBe(true)
  })
})

describe('a VIP walking in', () => {
  /** Runs the shop to 10:40, noting the minute of each VIP's arrival. */
  const arrivalsTo640 = (sim: SpaSim) => {
    const out: { minute: number; e: SimEvent }[] = []
    while (sim.clock.minutes < 640) {
      sim.advance(STEP_MS)
      for (const e of sim.drainEvents()) if (e.type === 'vipArrived') out.push({ minute: sim.clock.minutes, e })
    }
    return out
  }
  const expectChefOnce = (sim: SpaSim) => {
    const arrivals = arrivalsTo640(sim)
    const chef = sim.customers.filter(c => c.vip === 'chef')
    expect(chef).toHaveLength(1)
    expect(arrivals).toEqual([{ minute: expect.any(Number), e: { type: 'vipArrived', customerId: chef[0].id, vip: 'chef', first: true } }])
    expect(arrivals[0].minute).toBeGreaterThanOrEqual(600)
    expect(arrivals[0].minute).toBeLessThan(601)
    expect(sim.vip.booking).toBeNull()
    expect(sim.vip.vips.chef.visits).toBe(1)
  }

  it('brings a booked VIP at her minute, once', () => {
    const sim = new SpaSim({ rng: createRng(1) })
    sim.vip.booking = { vip: 'chef', day: sim.day, minute: 600 }
    expectChefOnce(sim)
  })

  it('brings a booked VIP once after a reload', () => {
    const sim = new SpaSim({ rng: createRng(1) })
    sim.vip.booking = { vip: 'chef', day: sim.day, minute: 600 }
    advanceUntil(sim, () => sim.clock.minutes >= 590)
    const copy = viaJson(sim, true)
    expect(copy.vip.booking).toEqual({ vip: 'chef', day: 1, minute: 600 })
    expectChefOnce(copy)
  })

  it('spawns a VIP with her look, the celebrity kind, her service and short patience', () => {
    const r = counting(1)
    const sim = fresh(r.rng)
    sim.vip.booking = { vip: 'miss', day: 2, minute: 600 }
    expect(dayEase(sim.day).patience).toBeGreaterThan(1)
    expect(sim.staff).toEqual([])
    const before = r.draws
    const c = sim.spawnCustomer({ vip: 'chef' })
    expect(r.draws).toBe(before)
    expect([c.vip, c.regular, c.kind, c.service]).toEqual(['chef', null, VIP_KIND, 'shampoo'])
    expect(c.look).toEqual(VIPS.chef.look)
    expect(c.look).not.toBe(VIPS.chef.look)
    expect([c.patienceMs, c.patienceMaxMs]).toEqual([Math.round(PATIENCE_MS * VIP_PATIENCE), Math.round(PATIENCE_MS * VIP_PATIENCE)])
    expect(sim.drainEvents()).toEqual([
      { type: 'customerArrived', id: c.id },
      { type: 'vipArrived', customerId: c.id, vip: 'chef', first: true },
    ])
    // another VIP's booking stays
    expect(sim.vip.booking).toEqual({ vip: 'miss', day: 2, minute: 600 })
    const again = sim.spawnCustomer({ vip: 'chef' })
    expect(sim.drainEvents()).toContainEqual({ type: 'vipArrived', customerId: again.id, vip: 'chef', first: false })
    expect(sim.vip.vips.chef.visits).toBe(2)
  })

  it('asks for a service the shop has when hers is gone', () => {
    // massage is open, but there is no massage bed
    const r = counting(1)
    const sim = withMask(r.rng)
    expect(sim.openService('massage')).toBeNull()
    expect(VIPS.singer.service).toBe('massage')
    const before = r.draws
    const c = sim.spawnCustomer({ vip: 'singer' })
    expect(c.service).not.toBe('massage')
    expect(sim.availableServices()).toContain(c.service)
    // drawService, like a regular: here one draw sends the celebrity to her favourite the shop has
    expect(r.draws).toBe(before + 1)
  })

  it('drops a booking for a day gone by when the next day starts', () => {
    const sim = fresh()
    // today's VIP never came
    sim.vip.booking = { vip: 'chef', day: sim.day, minute: 600 }
    sim.startDay()
    expect(sim.vip.booking).toBeNull()
    // tomorrow's stays
    sim.vip.booking = { vip: 'chef', day: sim.day + 1, minute: 600 }
    sim.startDay()
    expect(sim.vip.booking).toEqual({ vip: 'chef', day: sim.day, minute: 600 })
  })
})

describe('a VIP standing', () => {
  it('stands a VIP by the desk when every seat is taken', () => {
    const seated = fresh()
    expect(seated.isStanding(seatAndWait(seated, { vip: 'chef' }))).toBe(false)

    const sim = fresh()
    fillSeats(sim)
    const ev: SimEvent[] = []
    const c = sim.spawnCustomer({ vip: 'chef' })
    advanceUntil(sim, () => c.state === 'waiting', undefined, ev)
    expect(ev.some(e => e.type === 'noSeat')).toBe(false)
    expect(sim.stats.walkedAway).toBe(0)
    expect(sim.isStanding(c)).toBe(true)
    expect(sim.seats.every(s => s.customerId === 999)).toBe(true)
    const spot = c.seat!
    expect(tileOf(c.pos)).toEqual(spot)
    expect(isWalkable(sim.grid, spot)).toBe(true)
    expect(sim.grid.desks.some(d => manhattan(d, spot) === 1)).toBe(true)
    expect([sim.receptionSpot(), OWNER_START, sim.grid.door]).not.toContainEqual(spot)
    sim.tapTile(spot)
    advanceUntil(sim, () => c.state === 'inService')
    expect(sim.servingCustomerId).toBe(c.id)
  })

  it("keeps a standing VIP off a bed's work tile beside the desk", () => {
    const sim = fresh()
    sim.money = 2_000_000
    expect(sim.openService('mask')).toBeNull()
    // a mask bed may stand anywhere on legal floor; this one's work tile is the first free tile beside the desk from the door
    expect(sim.buy('maskBed', 6, 13, false)).toBeNull()
    const work = sim.grid.works[sim.grid.works.length - 1]
    expect(work).toEqual({ x: 7, y: 14 })
    expect(sim.grid.desks.some(d => manhattan(d, work) === 1)).toBe(true)
    fillSeats(sim)
    const c = seatAndWait(sim, { vip: 'chef' })
    expect(sim.isStanding(c)).toBe(true)
    expect(c.seat).not.toEqual(work)
    expect(sim.grid.cells[c.seat!.y][c.seat!.x]).toBe('floor')
  })

  it('keeps a standing VIP standing after a reload', () => {
    const sim = fresh()
    fillSeats(sim)
    const c = seatAndWait(sim, { vip: 'chef' })
    const copy = viaJson(sim)
    const d = copy.customers.find(x => x.id === c.id)!
    expect([d.vip, d.state, d.seat]).toEqual(['chef', 'waiting', c.seat])
    expect(copy.isStanding(d)).toBe(true)
    copy.tapTile(d.seat!)
    advanceUntil(copy, () => d.state === 'inService')
  })

  it('finds a standing VIP a new spot when furniture covers hers', () => {
    const sim = fresh()
    sim.money = 2_000_000
    fillSeats(sim)
    const c = seatAndWait(sim, { vip: 'chef' })
    const spot = { ...c.seat! }
    expect(sim.buy('plant', spot.x, spot.y, false)).toBeNull()
    expect(isWalkable(sim.grid, spot)).toBe(false)
    expect(c.seat).not.toEqual(spot)
    expect(isWalkable(sim.grid, c.seat!)).toBe(true)
    expect(sim.grid.desks.some(d => manhattan(d, c.seat!) === 1)).toBe(true)
    expect(c.state).toBe('toSeat')
    advanceUntil(sim, () => c.state === 'waiting')
    expect(tileOf(c.pos)).toEqual(c.seat)
    expect(sim.isStanding(c)).toBe(true)
  })

  it('walks a standing VIP to her new spot when the furniture over hers leaves no way out', () => {
    const sim = fresh()
    sim.money = 2_000_000
    fillSeats(sim)
    const c = seatAndWait(sim, { vip: 'chef' })
    const spot = { ...c.seat! }
    // the desk is on her right; plants above and below her leave one way out, and a tea table covers it and her
    expect(sim.grid.cells[spot.y][spot.x + 1]).toBe('desk')
    expect(sim.buy('plant', spot.x, spot.y - 1, false)).toBeNull()
    expect(sim.buy('plant', spot.x, spot.y + 1, false)).toBeNull()
    expect(c.seat).toEqual(spot)
    expect(sim.buy('tea', spot.x - 1, spot.y, false)).toBeNull()
    expect(c.seat).not.toEqual(spot)
    advanceUntil(sim, () => c.state === 'waiting')
    expect(tileOf(c.pos)).toEqual(c.seat)
  })
})

describe('serving a VIP', () => {
  it("staff never fetch a VIP and leave her service's beds to her", () => {
    const sim = withMask()
    // a second mask bed, for the office customer once she is on the first
    expect(sim.buy('maskBed', 8, 2, false)).toBeNull()
    const techs = [hireStaff(sim, 'technician'), hireStaff(sim, 'technician')]
    // in the same tick, so no technician has gone for him before she is in
    const office = sim.spawnCustomer({ kind: 'office', service: 'mask' })
    const miss = sim.spawnCustomer({ vip: 'miss' })
    expect(miss.service).toBe('mask')
    const fetching = () => techs.flatMap(t => (t.task?.kind === 'fetch' ? [t.task.customerId] : []))
    for (let ms = 0; ms < 15_000; ms += 100) {
      sim.advance(100)
      expect(fetching()).toEqual([])
    }
    expect([office.state, miss.state]).toEqual(['waiting', 'waiting'])
    expect(sim.stations.every(s => s.customerId === null)).toBe(true)

    sim.tapTile(miss.seat!)
    while (miss.state !== 'toStation') {
      expect(fetching()).toEqual([])
      sim.advance(100)
    }
    advanceUntil(sim, () => fetching().length > 0)
    expect(fetching()).toEqual([office.id])
  })

  it('pays three times the price and reviews three times', () => {
    const sim = fresh()
    const c = startService(sim, { vip: 'chef' })
    sim.drainEvents()
    const before = sim.money
    sim.completeService(c.id, 3)
    const ev = sim.drainEvents()
    const paid = ev.find(e => e.type === 'paid')
    if (paid?.type !== 'paid') throw new Error('no payment')
    expect(paid.amount).toBe(3 * SERVICE_PRICE.shampoo)
    expect(paid.tip).toBe(Math.round(tipFor(SERVICE_PRICE.shampoo, 3) * 3 * tipFactor(c.greet, null)))
    expect(sim.money).toBe(before + paid.amount + paid.tip)
    expect(sim.stats.income).toBe(3 * SERVICE_PRICE.shampoo)
    expect(ev.filter(e => e.type === 'review')).toEqual([5, 5, 5].map(score => ({ type: 'review', customerId: c.id, score })))
  })

  it('a VIP who walks out leaves three angry reviews', () => {
    const sim = fresh()
    const c = seatAndWait(sim, { vip: 'chef' })
    sim.drainEvents()
    c.patienceMs = 1
    const ev: SimEvent[] = []
    advanceUntil(sim, () => c.mood === 'angry', undefined, ev)
    ev.push(...sim.drainEvents())
    expect(ev.filter(e => e.type === 'review')).toEqual([1, 2, 3].map(() => ({ type: 'review', customerId: c.id, score: ANGRY_REVIEW })))
    expect(sim.reviews).toEqual([ANGRY_REVIEW, ANGRY_REVIEW, ANGRY_REVIEW])
  })

  it('gives her photo on her first 3 stars only, and the gold board with the fourth', () => {
    const sim = fresh()
    const serve = (vip: 'singer' | 'miss' | 'star' | 'chef', stars: 1 | 2 | 3) => {
      const c = startService(sim, { vip, service: 'shampoo' })
      sim.drainEvents()
      sim.completeService(c.id, stars)
      return sim.drainEvents().find(e => e.type === 'vipServed')
    }
    expect(serve('chef', 2)).toMatchObject({ type: 'vipServed', vip: 'chef', stars: 2, photo: false, board: false })
    expect(serve('chef', 3)).toMatchObject({ vip: 'chef', stars: 3, photo: true, board: false })
    expect(serve('chef', 3)).toMatchObject({ photo: false, board: false })
    expect(sim.book.gifts).toEqual(['photoChef'])
    expect(serve('singer', 3)).toMatchObject({ photo: true, board: false })
    expect(serve('miss', 3)).toMatchObject({ photo: true, board: false })
    expect(serve('star', 3)).toMatchObject({ vip: 'star', photo: true, board: true })
    expect(sim.book.gifts).toEqual(['photoChef', 'photoSinger', 'photoMiss', 'photoStar', 'goldBoard'])
    expect(sim.vip.vips.chef).toEqual({ visits: 3, best: 3, photo: true })
  })

  it('does not count a VIP among the kinds served', () => {
    const sim = fresh()
    const before = structuredClone(sim.book)
    sim.completeService(startService(sim, { vip: 'chef' }).id, 3)
    expect(sim.book.served.celeb).toBe(before.served.celeb)
    expect(sim.book.kindsMet).toEqual(before.kindsMet)
  })

  it('still comes after the technicians leave, but books no one new', () => {
    const sim = viaJson(withMask(), true)
    for (const s of [hireStaff(sim, 'technician'), hireStaff(sim, 'technician')]) sim.fire(s.id)
    sim.vip.booking = { vip: 'miss', day: sim.day + 1, minute: 600 }
    sim.clock.minutes = DAY_END_MIN
    endDay(sim)
    expect(sim.staff).toEqual([])
    sim.startDay()
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.dayOver, 300_000, ev)
    expect(ev).toContainEqual(expect.objectContaining({ type: 'vipArrived', vip: 'miss' }))
    expect(sim.vip.booking).toBeNull()
  })
})
