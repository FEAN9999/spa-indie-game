import { describe, expect, it } from 'vitest'
import { DAY_END_MIN, STEP_MS } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, ownerServes } from './helpers'

const opts = () => ({ rng: createRng(1), autoSpawn: false })
const fresh = () => new SpaSim(opts())

/** A shop that has just started `day`. */
function onDay(day: number): SpaSim {
  const sim = fresh()
  sim.day = day - 1
  sim.startDay()
  sim.drainEvents()
  return sim
}

const badgeEvents = (events: SimEvent[]) => events.filter(e => e.type === 'badge' || e.type === 'badgesFound')

/** One step of play, and what came out of it. */
function step(sim: SpaSim): SimEvent[] {
  sim.advance(STEP_MS)
  return sim.drainEvents()
}

describe('judging badges as the shop plays', () => {
  it('gives the 100th served its badge right after the visit that brought it', () => {
    const sim = onDay(8)
    sim.book.served.office = 99
    const { events } = ownerServes(sim, 3)
    events.push(...step(sim))
    expect(sim.badges.served100).toBe(8)
    expect(badgeEvents(events)).toEqual([{ type: 'badge', id: 'served100' }])
    expect(events.findIndex(e => e.type === 'badge')).toBeGreaterThan(events.findIndex(e => e.type === 'paid'))
  })

  it('gives badges silently before day 8, and never announces them later', () => {
    const sim = onDay(5)
    sim.money = 1_000_000
    const events = step(sim)
    expect(sim.badges.million).toBe(5)
    for (let day = 6; day <= 8; day++) {
      sim.startDay()
      events.push(...sim.drainEvents(), ...step(sim))
    }
    expect(sim.day).toBe(8)
    expect(badgeEvents(events)).toEqual([])
    expect(sim.badges.million).toBe(5)
  })

  it('gives each badge once and keeps it when its condition fails', () => {
    const sim = onDay(8)
    sim.money = 1_000_000
    expect(badgeEvents(step(sim))).toEqual([{ type: 'badge', id: 'million' }])
    sim.money = 10
    const events = step(sim)
    sim.money = 2_000_000
    events.push(...step(sim))
    expect(badgeEvents(events)).toEqual([])
    expect(sim.badges.million).toBe(8)
  })

  it('judges a day-end badge before the day ends, so it comes ahead of dayEnded', () => {
    const sim = onDay(8)
    sim.stats.served = 15
    sim.clock.minutes = DAY_END_MIN
    const events: SimEvent[] = []
    advanceUntil(sim, () => sim.dayOver, 10_000, events)
    events.push(...sim.drainEvents())
    const badge = events.findIndex(e => e.type === 'badge' && e.id === 'cleanDay')
    expect(badge).toBeGreaterThanOrEqual(0)
    expect(badge).toBeLessThan(events.findIndex(e => e.type === 'dayEnded'))
    expect(sim.badges.cleanDay).toBe(8)
  })

  it('announces several badges of one moment in the table order', () => {
    const sim = onDay(8)
    sim.book.served.office = 99
    sim.money = 990_000
    const { events } = ownerServes(sim, 3)
    events.push(...step(sim))
    expect(badgeEvents(events)).toEqual([
      { type: 'badge', id: 'served100' },
      { type: 'badge', id: 'million' },
    ])
  })

  it('gives Tròn năm on the morning after the 36th day', () => {
    const sim = onDay(36)
    expect(sim.badges.fullYear).toBeUndefined()
    sim.startDay()
    expect(sim.badges.fullYear).toBe(37)
    expect(badgeEvents(sim.drainEvents())).toEqual([{ type: 'badge', id: 'fullYear' }])
  })
})

describe('the badge snapshot', () => {
  it('counts VIP visits among the served, today in the best day, and only technicians who stay', () => {
    const sim = onDay(8)
    sim.book.served.office = 40
    sim.vip.vips.singer.visits = 2
    sim.progress.life.bestServed = 12
    sim.stats.served = 20
    const shop = sim.badgeShop()
    expect(shop.served).toBe(42)
    expect(shop.bestServed).toBe(20)
    expect(shop.technicians).toBe(0)
  })
})
