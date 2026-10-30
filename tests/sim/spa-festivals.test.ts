import { describe, expect, it } from 'vitest'
import { FESTIVAL_PATIENCE, FESTIVAL_PRICE, SERVICE_PRICE, VIP_PRICE_FACTOR } from '../../src/config'
import { KINDS } from '../../src/sim/customers'
import { tipFor } from '../../src/sim/economy'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, ownerServes } from './helpers'

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

/** Mask open with one mask chair, before the month's quest is rolled. */
const withMask = (sim: SpaSim) => {
  sim.money = 1_000_000
  sim.openService('mask')
  sim.buy('maskBed', 18, 2, false)
}

/** The share of 400 new customers asking for a mask, each walking in with `waiting` mask customers already there. */
function maskShare(sim: SpaSim, waiting: number): number {
  let mask = 0
  for (let i = 0; i < 400; i++) {
    sim.customers = []
    for (let w = 0; w < waiting; w++) sim.spawnCustomer({ kind: 'office', service: 'mask' })
    if (sim.spawnCustomer().service === 'mask') mask++
  }
  return mask / 400
}

describe('a festival month', () => {
  it('has a festival service only in a festival', () => {
    expect(on(37).festivalServiceToday()).toBe('shampoo')
    expect(on(46).festivalServiceToday()).toBeNull()
  })

  it('brings customers closer together only in a festival', () => {
    expect(on(37).eventArrivalFactor()).toBe(0.8)
    expect(on(46).eventArrivalFactor()).toBe(1)
  })

  it('charges the festival service 20% more, and tips on that price', () => {
    const price = SERVICE_PRICE.shampoo
    const festive = ownerServes(on(37), 3, { kind: 'office', service: 'shampoo' })
    expect(festive.amount).toBe(price * FESTIVAL_PRICE)
    expect(festive.tip).toBe(Math.round(tipFor(price * FESTIVAL_PRICE, 3) * KINDS.office.tip[2]))
    expect(ownerServes(on(46), 3, { kind: 'office', service: 'shampoo' }).amount).toBe(price)
  })

  it('charges a VIP her usual price', () => {
    expect(ownerServes(on(37), 3, { vip: 'singer', service: 'shampoo' }).amount).toBe(SERVICE_PRICE.shampoo * VIP_PRICE_FACTOR)
  })

  it('makes new customers but not VIPs wait longer', () => {
    const plain = (day: number) => on(day).spawnCustomer({ kind: 'office', service: 'shampoo' }).patienceMaxMs
    expect(Math.abs(plain(37) - plain(46) * FESTIVAL_PATIENCE)).toBeLessThanOrEqual(1)
    const vip = (day: number) => on(day).spawnCustomer({ vip: 'singer' }).patienceMaxMs
    expect(vip(37)).toBe(vip(46))
  })

  it('sends about half the plain customers to the festival service, and regulars to their own', () => {
    const sim = on(40, withMask)
    expect(sim.festivalServiceToday()).toBe('mask')
    const share = maskShare(sim, 0)
    expect(share).toBeGreaterThan(0.5)
    expect(share).toBeLessThan(0.85)
    expect(sim.spawnCustomer({ regular: 'vy' }).service).toBe('shampoo')
  })

  it('asks for the festival service only while fewer customers wait for it than it has beds', () => {
    const sim = on(40, withMask)
    // one bed and one waiting: only the plain draw is left, about 0.4 of mask
    expect(maskShare(sim, 1)).toBeLessThan(0.5)
    expect(sim.buy('maskBed', 18, 8, false)).toBeNull()
    expect(maskShare(sim, 1)).toBeGreaterThan(0.5)
  })

  it('never draws the festival service when it has no bed', () => {
    const sim = on(40, withMask)
    sim.sell(sim.items.find(i => i.kind === 'maskBed')!.id)
    expect(sim.festivalServiceToday()).toBe('mask')
    for (let i = 0; i < 200; i++) expect(sim.spawnCustomer().service).toBe('shampoo')
  })

  it("keeps the month's festival service when a closer one opens mid-month", () => {
    const sim = on(40)
    expect(sim.festivalServiceToday()).toBe('shampoo')
    withMask(sim)
    expect(sim.festivalServiceToday()).toBe('shampoo')
  })
})

/** Serves one shampoo with the month's festival quest cut to one, so it finishes; returns the events. */
function finishFestivalQuest(sim: SpaSim): SimEvent[] {
  sim.progress.monthly!.target = 1
  return ownerServes(sim, 3, { kind: 'office', service: 'shampoo' }).events
}

const ofType = <T extends SimEvent['type']>(events: SimEvent[], type: T) => events.filter((e): e is Extract<SimEvent, { type: T }> => e.type === type)

describe('the festival quest and its keepsake', () => {
  it('pays the festival quest and gives its keepsake the first time', () => {
    const sim = on(37)
    const events = finishFestivalQuest(sim)
    const done = ofType(events, 'festivalQuestDone')
    expect(done).toHaveLength(1)
    expect(done[0]).toMatchObject({ festival: 'tet', gift: true, quest: { festival: 'tet', state: 'done' } })
    expect(ofType(events, 'questDone').filter(e => e.quest.period === 'month')).toEqual([])
    expect(sim.book.gifts).toContain('maiBranch')
    expect(sim.festival.keepsakes).toEqual(['tet'])
    expect(sim.stats.quests).toBeGreaterThanOrEqual(done[0].quest.reward)
  })

  it('pays only money when the keepsake was given before', () => {
    const sim = on(37, s => (s.festival.keepsakes = ['tet']))
    const before = sim.money
    const events = finishFestivalQuest(sim)
    const done = ofType(events, 'festivalQuestDone')
    expect(done[0].gift).toBe(false)
    expect(sim.book.gifts).toEqual([])
    expect(sim.festival.keepsakes).toEqual(['tet'])
    expect(sim.money - before).toBeGreaterThanOrEqual(done[0].quest.reward)
  })

  it('reloading after the festival quest pays nothing again', () => {
    const sim = on(37)
    finishFestivalQuest(sim)
    sim.clock.minutes = 1190
    advanceUntil(sim, () => sim.dayOver, 400_000)
    sim.drainEvents()
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())
    const events = copy.drainEvents()
    expect(ofType(events, 'festivalQuestDone')).toEqual([])
    expect(ofType(events, 'festivalStarted')).toEqual([])
    expect(copy.money).toBe(sim.money)
    expect(copy.book.gifts).toEqual(['maiBranch'])
  })
})

describe('festival announcements', () => {
  const startOf = (day: number) => {
    const sim = new SpaSim(opts())
    sim.day = day - 1
    sim.startDay()
    return ofType(sim.drainEvents(), 'festivalStarted')
  }

  it('announces a festival on its first day only', () => {
    expect(startOf(37)).toEqual([{ type: 'festivalStarted', festival: 'tet', service: 'shampoo' }])
    expect(startOf(38)).toEqual([])
    expect(startOf(8)).toEqual([{ type: 'festivalStarted', festival: 'march8', service: 'shampoo' }])
    expect(startOf(46)).toEqual([])
  })

  it('tells the next month which festival quest ended unfinished', () => {
    const monthAfter = (day: number, prep: (sim: SpaSim) => void = () => {}) => {
      const sim = on(day)
      prep(sim)
      sim.day = day + 2
      sim.startDay()
      return ofType(sim.drainEvents(), 'monthStarted')[0].ended
    }
    expect(monthAfter(37)).toBe('tet')
    expect(monthAfter(37, sim => (sim.progress.monthly!.state = 'done'))).toBeNull()
    expect(monthAfter(40)).toBe('valentine')
    expect(monthAfter(46)).toBeNull()
  })
})
