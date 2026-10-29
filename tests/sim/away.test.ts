import { describe, expect, it } from 'vitest'
import { AWAY_PROFIT_DAYS } from '../../src/config'
import { awayPay, closeAwayDay, emptyAwayBook, repairAway, type AwayBook } from '../../src/sim/away'
import { dayProfit } from '../../src/sim/economy'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff, ownerServes, seatAndWait } from './helpers'

const HOUR = 3_600_000
const MIN = 60_000
const book = (over: Partial<AwayBook> = {}): AwayBook => ({ profits: [1_000_000, 1_000_000, 1_000_000], ok: true, tipSeen: false, ...over })

describe('what a closed shop earns', () => {
  it('pays a quarter of a day profit for each hour away, up to the cap', () => {
    expect(awayPay(book(), 5 * HOUR + 20 * MIN)).toBe(1_333_000)
    expect(awayPay(book(), 12 * HOUR)).toBe(2_000_000)
  })

  it('pays nothing for under ten minutes or for a clock gone back', () => {
    expect(awayPay(book(), 9 * MIN + 59_000)).toBe(0)
    expect(awayPay(book(), -HOUR)).toBe(0)
  })

  it('uses the mean of the recent profits, rounded to 1.000', () => {
    expect(awayPay(book({ profits: [-300_000, 100_000, 200_000] }), 4 * HOUR)).toBe(0)
    expect(awayPay(book({ profits: [] }), 4 * HOUR)).toBe(0)
    expect(awayPay(book({ profits: [400_000] }), 2 * HOUR)).toBe(200_000)
    expect(awayPay(book({ profits: [333_333] }), HOUR)).toBe(83_000)
  })

  it('pays nothing when the last day did not qualify', () => {
    expect(awayPay(book({ ok: false }), 4 * HOUR)).toBe(0)
  })
})

describe('closing a day into the book', () => {
  it('keeps only the last three profits', () => {
    const b = emptyAwayBook()
    for (const p of [1, 2, 3, 4, 5]) closeAwayDay(b, p, 0, 1)
    expect(b.profits).toEqual([3, 4, 5])
    expect(AWAY_PROFIT_DAYS).toBe(3)
  })

  it('qualifies a day only when the owner served nobody and the staff served someone', () => {
    const b = emptyAwayBook()
    closeAwayDay(b, 1, 0, 1)
    expect(b.ok).toBe(true)
    closeAwayDay(b, 1, 1, 5)
    expect(b.ok).toBe(false)
    closeAwayDay(b, 1, 0, 0)
    expect(b.ok).toBe(false)
  })
})

describe('repairing a saved book', () => {
  it('gives an empty book for junk', () => {
    expect(repairAway(null)).toEqual(emptyAwayBook())
    expect(repairAway('x')).toEqual(emptyAwayBook())
    expect(repairAway([])).toEqual(emptyAwayBook())
  })

  it('drops profits that are not numbers and keeps the last three', () => {
    expect(repairAway({ profits: [1, 'x', 2, null, 3, 4], ok: true, tipSeen: true })).toEqual({ profits: [2, 3, 4], ok: true, tipSeen: true })
  })

  it('reads a flag that is not a boolean as false', () => {
    expect(repairAway({ profits: [], ok: 'yes', tipSeen: 1 })).toEqual(emptyAwayBook())
  })
})

const shop = (day = 5): SpaSim => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.profileDone = true
  sim.day = day
  return sim
}

/** Lets the staff serve one customer through to payment. */
function staffServes(sim: SpaSim): void {
  const before = sim.stats.served
  seatAndWait(sim)
  advanceUntil(sim, () => sim.stats.served > before, 300_000)
}

function close(sim: SpaSim): SimEvent[] {
  sim.clock.minutes = 1190
  const events: SimEvent[] = []
  advanceUntil(sim, () => sim.dayOver, 400_000, events)
  return [...events, ...sim.drainEvents()]
}

describe('counting the owner serving', () => {
  it('goes up when the owner serves an ordinary customer', () => {
    const sim = shop()
    ownerServes(sim, 2)
    expect(sim.stats.ownerServed).toBe(1)
  })

  it('does not go up for a VIP or for Mi Mi', () => {
    const sim = shop()
    ownerServes(sim, 2, { vip: 'star' })
    ownerServes(sim, 2, { kol: true })
    expect(sim.stats.served).toBe(2)
    expect(sim.stats.ownerServed).toBe(0)
  })

  it("does not go up for a technician's customer", () => {
    const sim = shop()
    hireStaff(sim, 'technician')
    staffServes(sim)
    expect(sim.stats.served).toBe(1)
    expect(sim.stats.ownerServed).toBe(0)
  })
})

describe('the day end', () => {
  it('pushes the profit and qualifies a day only the staff worked', () => {
    const sim = shop()
    hireStaff(sim, 'technician')
    staffServes(sim)
    close(sim)
    expect(sim.away.ok).toBe(true)
    expect(sim.away.profits).toEqual([dayProfit(sim.stats)])
  })

  it('does not qualify a day the owner served an ordinary customer', () => {
    const sim = shop()
    hireStaff(sim, 'technician')
    staffServes(sim)
    ownerServes(sim, 2)
    close(sim)
    expect(sim.away.ok).toBe(false)
    expect(sim.away.profits).toHaveLength(1)
  })

  it('does not push the profit again when a shop saved after the day ended is reloaded', () => {
    const sim = shop()
    hireStaff(sim, 'technician')
    staffServes(sim)
    close(sim)
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(1), autoSpawn: false })
    expect(copy.away).toEqual(sim.away)
    expect(copy.drainEvents().some(e => e.type === 'dayEnded')).toBe(true)
    expect(copy.away.profits).toHaveLength(1)
  })
})

describe('coming back', () => {
  const qualifying = (day = 5): SpaSim => {
    const sim = shop(day)
    sim.away = book()
    return sim
  }

  it('pays into money only', () => {
    const sim = qualifying()
    sim.money = 500
    const before = JSON.stringify([sim.stats, sim.progress.total, sim.day])
    const r = sim.comeBack(5 * HOUR + 20 * MIN)
    expect(r).toEqual({ paid: 1_333_000, places: [null], ms: 5 * HOUR + 20 * MIN, profit: 1_000_000, days: 3, capped: false, tip: false })
    expect(sim.money).toBe(1_333_500)
    expect(JSON.stringify([sim.stats, sim.progress.total, sim.day])).toBe(before)
  })

  it('says when the time was capped', () => {
    const r = qualifying().comeBack(9 * HOUR)
    expect(r.capped).toBe(true)
    expect(r.paid).toBe(2_000_000)
  })

  it('shows the tip once, from day 3, to a shop that did not qualify', () => {
    const sim = shop(3)
    expect(sim.comeBack(HOUR).tip).toBe(true)
    expect(sim.away.tipSeen).toBe(true)
    expect(sim.comeBack(HOUR).tip).toBe(false)
  })

  it('shows no tip before day 3, for a short time, or when the shop was paid', () => {
    expect(shop(2).comeBack(HOUR).tip).toBe(false)
    expect(shop(3).comeBack(9 * MIN).tip).toBe(false)
    expect(qualifying().comeBack(HOUR).tip).toBe(false)
  })

  it('shows no tip to a qualifying shop with a negative mean', () => {
    const sim = shop(5)
    sim.away = book({ profits: [-100_000] })
    const r = sim.comeBack(HOUR)
    expect(r.paid).toBe(0)
    expect(r.tip).toBe(false)
  })

  it('keeps the book through a save', () => {
    const sim = qualifying()
    sim.away.tipSeen = true
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(1), autoSpawn: false })
    expect(copy.away).toEqual(sim.away)
  })
})
