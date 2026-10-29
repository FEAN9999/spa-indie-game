import { describe, expect, it } from 'vitest'
import { PATIENCE_MS } from '../../src/config'
import { drawKind, drawService, KINDS, MAIN_KINDS, type CustomerKind } from '../../src/sim/customers'
import { reviewScore, tipFor, type Stars } from '../../src/sim/economy'
import { createRng } from '../../src/sim/rng'
import { SERVICE_IDS } from '../../src/sim/services'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, seatAndWait, startService } from './helpers'

const kindsOnDay = (day: number): Set<CustomerKind> => {
  const rng = createRng(day)
  return new Set(Array.from({ length: 2000 }, () => drawKind(day, rng)))
}

const newSim = (day = 1) => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.day = day
  return sim
}

describe('kinds of customer', () => {
  it('meets only students and office workers on days 1 and 2, then picky ones, elders and from day 6 a few celebrities', () => {
    expect([...kindsOnDay(1)].sort()).toEqual(['office', 'student'])
    expect([...kindsOnDay(2)].sort()).toEqual(['office', 'student'])
    expect([...kindsOnDay(3)].sort()).toEqual(['office', 'picky', 'student'])
    expect([...kindsOnDay(5)].sort()).toEqual(['elder', 'office', 'picky', 'student'])
    expect([...kindsOnDay(6)].sort()).toEqual([...MAIN_KINDS].sort())
    const rng = createRng(6)
    const celebs = Array.from({ length: 2000 }, () => drawKind(6, rng)).filter(k => k === 'celeb').length
    expect(celebs / 2000).toBeGreaterThan(0.03)
    expect(celebs / 2000).toBeLessThan(0.07)
  })

  it('mostly picks a preferred service the shop has, else any it has', () => {
    const rng = createRng(4)
    const massage = Array.from({ length: 1000 }, () => drawService('elder', ['shampoo', 'massage'], rng)).filter(s => s === 'massage').length
    // 0.7 for the favourite, and half of the other 0.3
    expect(massage / 1000).toBeGreaterThan(0.8)
    expect(massage / 1000).toBeLessThan(0.9)
    expect(Array.from({ length: 50 }, () => drawService('elder', ['shampoo'], rng)).every(s => s === 'shampoo')).toBe(true)
  })

  it('has elders like Xông lá as well as massage, and picky customers like every service', () => {
    expect(KINDS.elder.prefers).toEqual(['massage', 'steam', 'foot'])
    expect(KINDS.picky.prefers).toContain('steam')
  })

  it('has office workers like Đá nóng, celebrities like Tắm bùn, and picky customers like all six', () => {
    expect(KINDS.office.prefers).toContain('stone')
    expect(KINDS.celeb.prefers).toContain('mud')
    expect([...KINDS.picky.prefers]).toEqual(SERVICE_IDS)
  })

  it('has students and tourists like Chà muối biển too', () => {
    expect([...KINDS.student.prefers]).toEqual(['shampoo', 'scrub'])
    expect([...KINDS.tourist.prefers]).toEqual(['mud', 'stone', 'massage', 'scrub'])
  })

  it('has elders and backpackers like Ngâm chân thảo mộc too', () => {
    expect([...KINDS.elder.prefers]).toEqual(['massage', 'steam', 'foot'])
    expect([...KINDS.backpacker.prefers]).toEqual(['massage', 'steam', 'shampoo', 'foot'])
  })

  it('draws no number when the shop has one service', () => {
    const rng = () => {
      throw new Error('drew')
    }
    expect(drawService('picky', ['shampoo'], rng)).toBe('shampoo')
  })

  it('draws look, then kind, then service', () => {
    const sim = newSim(4)
    sim.money = 1_000_000
    sim.openService('mask')
    sim.buy('maskBed', 6, 2, false)
    const mirror = createRng(1)
    for (let i = 0; i < 4; i++) mirror() // the look
    const kind = drawKind(4, mirror)
    const service = drawService(kind, sim.availableServices(), mirror)
    const c = sim.spawnCustomer()
    expect([c.kind, c.service]).toEqual([kind, service])
  })

  it('reviews by grading', () => {
    expect([1, 2, 3].map(s => reviewScore(s as Stars, 'easy'))).toEqual([4, 5, 5])
    expect([1, 2, 3].map(s => reviewScore(s as Stars))).toEqual([3, 4, 5])
    expect([1, 2, 3].map(s => reviewScore(s as Stars, 'harsh'))).toEqual([2, 3, 5])
  })

  it("pays a picky customer's tip only for three stars, and counts a celebrity twice", () => {
    const serve = (kind: CustomerKind, stars: Stars) => {
      const sim = newSim(6)
      const c = startService(sim, { kind, service: 'shampoo' })
      sim.drainEvents()
      sim.completeService(c.id, stars)
      return sim.drainEvents()
    }
    const tipOf = (ev: SimEvent[]) => ev.flatMap(e => (e.type === 'paid' ? [e.tip] : []))[0]
    const scores = (ev: SimEvent[]) => ev.flatMap(e => (e.type === 'review' ? [e.score] : []))
    const two = serve('picky', 2)
    expect([tipOf(two), scores(two)]).toEqual([0, [3]])
    const three = serve('picky', 3)
    expect([tipOf(three), scores(three)]).toEqual([Math.round(tipFor(40_000, 3) * 2), [5]])
    expect(tipOf(three)).toBe(20_000)
    expect(scores(serve('celeb', 3))).toEqual([5, 5])
    expect(tipOf(serve('celeb', 3))).toBe(Math.round(tipFor(40_000, 3) * 3))

    const sim = newSim(6)
    const c = sim.spawnCustomer({ kind: 'celeb', service: 'shampoo' })
    const ev: SimEvent[] = []
    advanceUntil(sim, () => !sim.customers.includes(c), 120_000, ev)
    expect(scores(ev)).toEqual([1, 1])
    expect(sim.reviews).toEqual([1, 1])
  })

  it('gives elders more patience and a slower walk', () => {
    const sim = newSim(4)
    const elder = sim.spawnCustomer({ kind: 'elder', service: 'shampoo' })
    expect(elder.patienceMaxMs).toBe(Math.round(PATIENCE_MS * 1.3))
    expect(sim.spawnCustomer({ kind: 'office', service: 'shampoo' }).patienceMaxMs).toBe(Math.round(PATIENCE_MS * 0.8))
    // the same walk to the first seat, timed from setting off to sitting
    const walkMs = (kind: CustomerKind) => {
      const s = newSim(4)
      const c = s.spawnCustomer({ kind, service: 'shampoo' })
      advanceUntil(s, () => c.state === 'toSeat')
      let ms = 0
      while (c.state === 'toSeat') {
        s.advance(50)
        ms += 50
      }
      return ms
    }
    expect(walkMs('elder')).toBeGreaterThan(walkMs('office'))
  })
})

describe("the rival's day", () => {
  it('draws picky customers by their weight times the factor', () => {
    const picky = (factor: number) => {
      const rng = createRng(5)
      return Array.from({ length: 6000 }, () => drawKind(20, rng, factor)).filter(k => k === 'picky').length
    }
    // picky weighs 2 of 10 on day 20; doubled it weighs 4 of 12, a share 5/3 of the usual
    const ratio = picky(2) / picky(1)
    expect(ratio).toBeGreaterThan(1.5)
    expect(ratio).toBeLessThan(1.85)
  })
})

describe('the backpacker and the lady', () => {
  it('are the two place-only kinds', () => {
    expect(KINDS.backpacker).toEqual({ fromDay: 1, weight: 0, patience: 1.3, tip: [0.5, 1, 2], prefers: ['massage', 'steam', 'shampoo', 'foot'], grading: 'normal', reviews: 1, speed: 5, hard: false })
    expect(KINDS.lady).toEqual({ fromDay: 1, weight: 0, patience: 0.7, tip: [0, 1, 4], prefers: ['mask', 'mud', 'stone'], grading: 'harsh', reviews: 2, speed: 3.5, hard: true })
  })
})
