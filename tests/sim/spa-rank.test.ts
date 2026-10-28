import { describe, expect, it } from 'vitest'
import { FESTIVAL_PRICE, VIP_PRICE_FACTOR } from '../../src/config'
import { monthInput, rankParts, type Stars } from '../../src/sim/rank'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { VIP_IDS } from '../../src/sim/vips'
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

const monthPrep = (stars: Stars) => (s: SpaSim) => {
  s.reviews = Array(20).fill(5)
  s.progress.total.served = 45
  s.rank.month = { from: 7, served: 0, lost: 0 }
  s.rank.stars = stars
}

describe("the shop's grade", () => {
  it("takes the month's snapshot on its first day", () => {
    const sim = on(13, s => {
      s.progress.total.served = 50
      s.progress.total.lost = 4
    })
    expect(sim.rank.month).toEqual({ from: 13, served: 50, lost: 4 })
    sim.progress.total.served = 60
    sim.day = 13
    sim.startDay()
    expect(sim.rank.month).toEqual({ from: 13, served: 50, lost: 4 })
  })

  it("judges day 9's evening and pays a new star once", () => {
    const sim = on(9, monthPrep(1))
    const twin = on(9, monthPrep(5))
    const before = [sim.money, twin.money]
    close(sim)
    close(twin)
    expect(sim.rank.stars).toBe(2)
    expect(sim.rank.last?.day).toBe(9)
    expect(sim.rank.last?.total).toBe(62)
    expect(twin.rank.stars).toBe(5)
    expect(sim.money - before[0] - (twin.money - before[1])).toBe(200_000)
    expect(sim.stats.quests).toBe(twin.stats.quests)
    expect(sim.progress.total.earned).toBe(twin.progress.total.earned)
  })

  it('judges nothing before day 9 or mid-month', () => {
    const a = on(8, monthPrep(1))
    const b = on(13, monthPrep(1))
    close(a)
    close(b)
    expect(a.rank.last).toBeNull()
    expect(b.rank.last).toBeNull()
  })

  it('judges the year after the month on day 36', () => {
    const prep = (scores: number[]) => (s: SpaSim) => {
      monthPrep(5)(s)
      s.rank.month = { from: 34, served: 0, lost: 0 }
      s.rank.scores = scores
    }
    const sim = on(36, prep([72, 72, 72]))
    const twin = on(36, prep([0, 0, 0]))
    const before = [sim.money, twin.money]
    close(sim)
    close(twin)
    expect(sim.rank.lastYear?.place).toBe(2)
    expect(sim.rank.lastYear?.reward).toBe(1_000_000)
    expect(twin.rank.lastYear?.reward).toBe(0)
    expect(sim.money - before[0] - (twin.money - before[1])).toBe(1_000_000)
    expect(sim.book.gifts.filter(g => g === 'merit')).toHaveLength(1)
    expect(sim.rank.scores).toEqual([])
  })

  it("charges the grade's price before the festival and VIP factors", () => {
    const paid = (stars: Stars, setup: (sim: SpaSim, c: ReturnType<SpaSim['spawnCustomer']>) => void = () => {}) => {
      const sim = on(2)
      sim.rank.stars = stars
      const c = sim.spawnCustomer()
      c.service = 'shampoo'
      setup(sim, c)
      const events: SimEvent[] = []
      const station = sim.stations[0]
      ;(sim as unknown as { payFor: (...a: unknown[]) => void }).payFor(c, station, 3, null)
      events.push(...sim.drainEvents())
      return events.find((e): e is Extract<SimEvent, { type: 'paid' }> => e.type === 'paid')!.amount
    }
    expect(paid(1)).toBe(40000)
    expect(paid(2)).toBe(42000)
    const festival = (sim: SpaSim) => {
      ;(sim as unknown as { festivalServiceToday: () => string }).festivalServiceToday = () => 'shampoo'
    }
    expect(paid(2, festival)).toBe(Math.round(42000 * FESTIVAL_PRICE))
    expect(paid(2, (_s, c) => (c.vip = VIP_IDS[0]))).toBe(42000 * VIP_PRICE_FACTOR)
  })

  it('reads the month so far for the tab', () => {
    const sim = on(8, monthPrep(1))
    const now = sim.rankNow()
    const expected = rankParts(monthInput(sim.rank, sim.day, sim.rating(), sim.beauty(), sim.services.length, sim.progress.total))
    expect(now.parts).toEqual(expected)
    expect(now.total).toBe(expected.reduce((a, b) => a + b, 0))
  })
})
