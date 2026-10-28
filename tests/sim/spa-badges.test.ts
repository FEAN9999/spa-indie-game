import { describe, expect, it } from 'vitest'
import { DAY_END_MIN, STEP_MS } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import v15 from '../fixtures/save-v15.json'
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

/** A shop that has just closed `day` with 15 served and nobody walking out. */
function closeCleanDay(day: number): SpaSim {
  const sim = onDay(day)
  sim.stats.served = 15
  sim.clock.minutes = DAY_END_MIN
  advanceUntil(sim, () => sim.dayOver, 10_000)
  return sim
}

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

  it('judges a day-end badge on the next morning, dated the day that closed, and never under the summary', () => {
    const sim = closeCleanDay(8)
    expect(badgeEvents(sim.drainEvents())).toEqual([])
    expect(sim.badges.cleanDay).toBeUndefined()
    sim.startDay()
    expect(badgeEvents(sim.drainEvents())).toEqual([{ type: 'badge', id: 'cleanDay' }])
    expect(sim.badges.cleanDay).toBe(8)
  })

  it('still announces a day-end badge when the shop is reopened on the summary', () => {
    const again = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(closeCleanDay(8).toSave()))), opts())
    expect(badgeEvents(again.drainEvents())).toEqual([])
    again.startDay()
    expect(badgeEvents(again.drainEvents())).toEqual([{ type: 'badge', id: 'cleanDay' }])
    expect(again.badges.cleanDay).toBe(8)
  })

  it('gives a clean day 7 silently on the morning of day 8', () => {
    const sim = closeCleanDay(7)
    sim.drainEvents()
    sim.startDay()
    expect(badgeEvents(sim.drainEvents())).toEqual([])
    expect(sim.badges.cleanDay).toBe(7)
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

describe("an old shop's first load", () => {
  const open = (raw: unknown) => SpaSim.fromSave(parseSave(structuredClone(raw)), opts())
  const HAD = { served100: 0, cleanDay: 0, firstCard: 0, vipPhoto: 0, floor2: 0, million: 0 }

  it('gives what it already has as Có từ trước, with one found event and no banner', () => {
    const sim = open(v15)
    expect(sim.badges).toEqual(HAD)
    const events = sim.drainEvents()
    expect(badgeEvents(events)).toEqual([{ type: 'badgesFound', n: 6 }])
    expect(badgeEvents(step(sim))).toEqual([])
  })

  it('gives nothing more when its new save is opened again', () => {
    const again = open(JSON.parse(JSON.stringify(open(v15).toSave())))
    expect(again.badges).toEqual(HAD)
    expect(badgeEvents(again.drainEvents())).toEqual([])
  })

  it('does the same on the summary, and still reopens it', () => {
    const sim = open({ ...v15, dayOver: true })
    expect(sim.badges).toEqual(HAD)
    const events = sim.drainEvents()
    expect(badgeEvents(events)).toEqual([{ type: 'badgesFound', n: 6 }])
    expect(events.some(e => e.type === 'dayEnded')).toBe(true)
  })

  it('stays quiet before day 8', () => {
    const sim = open({ ...v15, day: 6 })
    expect(sim.badges).toEqual(HAD)
    expect(badgeEvents(sim.drainEvents())).toEqual([])
  })
})
