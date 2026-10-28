import { describe, expect, it } from 'vitest'
import { FESTIVAL_PATIENCE, HOT_ARRIVAL } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil } from './helpers'

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
