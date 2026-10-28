import { describe, expect, it } from 'vitest'
import { FESTIVAL_PATIENCE, HOT_ARRIVAL, HOT_DAYS } from '../../src/config'
import { KOL_LOOK } from '../../src/sim/events'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, ownerServes, seatAndWait } from './helpers'

const opts = () => ({ rng: createRng(1), autoSpawn: false })

/** A shop that has just started `day`. */
function on(day: number, prep: (sim: SpaSim) => void = () => {}): SpaSim {
  const sim = new SpaSim(opts())
  sim.profileDone = true
  prep(sim)
  sim.day = day - 1
  sim.startDay()
  sim.drainEvents()
  return sim
}

/** Runs the shop to the end of its day. */
function close(sim: SpaSim): SimEvent[] {
  sim.clock.minutes = 1190
  const events: SimEvent[] = []
  advanceUntil(sim, () => sim.dayOver, 400_000, events)
  return [...events, ...sim.drainEvents()]
}

const ofType = <T extends SimEvent['type']>(events: SimEvent[], type: T) => events.filter((e): e is Extract<SimEvent, { type: T }> => e.type === type)

/** What the shop's own stream draws next: a new customer's look, kind and service. */
const nextDraws = (sim: SpaSim) => {
  const c = sim.spawnCustomer()
  return [c.look, c.kind, c.service]
}

describe("planning tomorrow's event", () => {
  it('plans it at the end of the day, from a stream of its own', () => {
    const planned = on(12)
    const blocked = on(12, s => (s.eventBook.nextDay = 999))
    close(planned)
    close(blocked)
    expect(planned.eventBook.plan?.day).toBe(13)
    expect(blocked.eventBook.plan).toBeNull()
    expect(nextDraws(planned)).toEqual(nextDraws(blocked))
  })

  it('skips a day the VIP is booked for', () => {
    const sim = on(12)
    sim.vip.booking = { vip: 'singer', day: 13, minute: 700 }
    sim.vip.nextDay = 99
    close(sim)
    expect(sim.eventBook.plan).toBeNull()
  })

  it("announces today's event in the morning, and only that day", () => {
    const sim = on(12)
    sim.eventBook.plan = { kind: 'inspect', day: 13, minute: 900 }
    sim.eventBook.nextDay = 99
    sim.startDay()
    expect(ofType(sim.drainEvents(), 'eventToday')).toEqual([{ type: 'eventToday', plan: { kind: 'inspect', day: 13, minute: 900 } }])
    sim.startDay()
    expect(ofType(sim.drainEvents(), 'eventToday')).toEqual([])
    expect(sim.eventBook.plan).toBeNull()
  })

  it("resets the day's count and inspection each morning", () => {
    const sim = on(12)
    sim.eventBook.count = 3
    sim.eventBook.inspected = true
    sim.startDay()
    expect(sim.eventBook).toMatchObject({ count: 0, inspected: false })
  })
})

describe('hot days', () => {
  const hot = (s: SpaSim) => (s.eventBook.hotUntil = 14)

  it('bring customers closer together, once even in a festival', () => {
    expect(on(13, hot).eventArrivalFactor()).toBe(HOT_ARRIVAL)
    expect(on(13).eventArrivalFactor()).toBe(1)
    expect(on(38, s => (s.eventBook.hotUntil = 39)).eventArrivalFactor()).toBe(0.8)
  })

  it('make new customers wait longer, once even in a festival', () => {
    const patience = (sim: SpaSim) => sim.spawnCustomer({ kind: 'office', service: 'shampoo' }).patienceMaxMs
    expect(Math.abs(patience(on(13, hot)) - patience(on(13)) * FESTIVAL_PATIENCE)).toBeLessThanOrEqual(1)
    expect(patience(on(38, s => (s.eventBook.hotUntil = 39)))).toBe(patience(on(38)))
  })

  it('are left out of the recent days', () => {
    const plain = on(13)
    const busy = on(13, hot)
    const before = plain.progress.recent.length
    close(plain)
    close(busy)
    expect(plain.progress.recent.length).toBe(before + 1)
    expect(busy.progress.recent.length).toBe(before)
  })

  it('announce the first hot day only', () => {
    const sim = on(12, hot)
    sim.startDay()
    expect(ofType(sim.drainEvents(), 'hotStarted')).toEqual([{ type: 'hotStarted', until: 14 }])
    sim.startDay()
    expect(ofType(sim.drainEvents(), 'hotStarted')).toEqual([])
    expect(sim.hotToday()).toBe(true)
  })
})

describe('Mi Mi', () => {
  const kolToday = (sim: SpaSim, minute = 600) => (sim.eventBook.plan = { kind: 'kol', day: sim.day, minute })

  it('walks in at her minute, once, on top of the usual arrivals', () => {
    const sim = new SpaSim({ rng: createRng(1) })
    sim.day = 12
    kolToday(sim)
    const events: SimEvent[] = []
    advanceUntil(sim, () => sim.clock.minutes >= 599, 400_000, events)
    expect(sim.customers.filter(c => c.kol)).toEqual([])
    advanceUntil(sim, () => sim.clock.minutes >= 640, 400_000, events)
    const mimi = sim.customers.filter(c => c.kol)
    expect(mimi).toHaveLength(1)
    expect(mimi[0]).toMatchObject({ look: KOL_LOOK, kind: 'office', vip: null, regular: null })
    expect(ofType(events, 'kolArrived')).toEqual([{ type: 'kolArrived', customerId: mimi[0].id }])
    expect(sim.eventBook.plan).toBeNull()
    expect(sim.customers.filter(c => !c.kol).length).toBeGreaterThan(0)
  })

  it('is the only customer flagged as her', () => {
    const sim = on(12)
    expect(sim.spawnCustomer().kol).toBe(false)
    expect(sim.spawnCustomer({ vip: 'chef' }).kol).toBe(false)
  })

  it('stands like a VIP when every seat is taken', () => {
    const sim = on(12)
    for (const s of sim.seats) s.customerId = 999
    const events: SimEvent[] = []
    const c = sim.spawnCustomer({ kol: true })
    advanceUntil(sim, () => c.state === 'waiting', undefined, events)
    expect(ofType(events, 'noSeat')).toEqual([])
    expect(sim.stats.walkedAway).toBe(0)
  })

  it("does not count toward the shop's stars, served or walking out", () => {
    for (const stars of [3, 1] as const) {
      const sim = on(12)
      ownerServes(sim, stars, { kol: true, service: 'shampoo' })
      expect(sim.reviews).toEqual([])
    }
    const sim = on(12)
    const c = seatAndWait(sim, { kol: true, service: 'shampoo' })
    const events: SimEvent[] = []
    advanceUntil(sim, () => c.mood === 'angry', 400_000, events)
    expect(sim.reviews).toEqual([])
    expect(ofType(events, 'kolLeft')).toEqual([{ type: 'kolLeft', customerId: c.id }])
  })

  it('makes the next two days hot with her 3 stars', () => {
    const sim = on(12)
    const { events } = ownerServes(sim, 3, { kol: true, service: 'shampoo' })
    expect(sim.eventBook.hotUntil).toBe(12 + HOT_DAYS)
    expect(ofType(events, 'kolPosted')).toHaveLength(1)
    expect(ofType(events, 'kolLeft')).toEqual([])
  })

  it('only says she left below 3 stars', () => {
    const sim = on(12)
    const { events } = ownerServes(sim, 2, { kol: true, service: 'shampoo' })
    expect(sim.eventBook.hotUntil).toBe(0)
    expect(ofType(events, 'kolLeft')).toHaveLength(1)
    expect(ofType(events, 'kolPosted')).toEqual([])
  })

  it('waits no longer on a hot day or in a festival', () => {
    const patience = (sim: SpaSim) => sim.spawnCustomer({ kol: true }).patienceMaxMs
    expect(patience(on(13, s => (s.eventBook.hotUntil = 14)))).toBe(patience(on(13)))
  })
})
