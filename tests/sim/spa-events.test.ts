import { describe, expect, it } from 'vitest'
import { FESTIVAL_PATIENCE, HOT_ARRIVAL, HOT_DAYS, INSPECT_BEAUTY, LOW_STOCK, POWER_FROM_MIN, POWER_TIP_FACTOR, RIVAL_TARGET_MIN } from '../../src/config'
import { averageDay, baseReward, type DayRecord } from '../../src/sim/quests'
import { parseSave } from '../../src/sim/save'
import { reviewScore } from '../../src/sim/economy'
import { KOL_LOOK, MACHINES, powerOutAt, rivalTarget } from '../../src/sim/events'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { REGULAR_IDS } from '../../src/sim/regulars'
import { advanceUntil, hireStaff, ownerServes, seatAndWait } from './helpers'

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

  it('knows whether the shop has a machine service it can do', () => {
    const sim = on(12)
    expect(sim.hasMachines()).toBe(false)
    sim.services.push('steam')
    expect(sim.hasMachines()).toBe(false)
    sim.items.push({ id: 99, kind: 'steamTent', x: 8, y: 8, flip: false })
    expect(sim.hasMachines()).toBe(true)
  })

  it('never plans a power cut for a shop without machines', () => {
    // every day whose tomorrow is outside a festival month, each a different draw
    for (const day of [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24, 25, 26, 30, 31, 32]) {
      const sim = on(day)
      close(sim)
      expect(sim.eventBook.plan?.kind).not.toBe('power')
    }
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
    // on her feet by the desk, drawn standing and moved like a VIP if her spot is built over
    expect(sim.isStanding(c)).toBe(true)
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
    // spec 7.5: her walking out costs nothing, so no angry customer on the summary and no lost one for the quests
    expect(sim.stats.angry).toBe(0)
    expect(sim.progress.total.lost).toBe(0)
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

describe('the inspector', () => {
  /** A shop on day 12 that the inspector visits today, with decor enough to be tidy. */
  const inspectDay = (prep: (sim: SpaSim) => void = () => {}) => {
    const sim = on(12)
    sim.eventBook.plan = { kind: 'inspect', day: 12, minute: 900 }
    let id = 900
    while (sim.beauty() < INSPECT_BEAUTY) sim.items.push({ id: id++, kind: 'goldBoard', x: 0, y: 0, flip: false })
    prep(sim)
    return sim
  }
  /** Steps the shop from 14:59 past 15:00 and returns the inspections it made. */
  const toThree = (sim: SpaSim) => {
    sim.clock.minutes = 899
    const events: SimEvent[] = []
    advanceUntil(sim, () => sim.clock.minutes >= 899.5, 400_000, events)
    expect(ofType(events, 'inspected')).toEqual([])
    advanceUntil(sim, () => sim.clock.minutes >= 905, 400_000, events)
    return ofType([...events, ...sim.drainEvents()], 'inspected')
  }

  it('inspects once, at the first step at or after 15:00, and pays twice a daily reward when all three pass', () => {
    const sim = inspectDay()
    const money = sim.money
    const reward = 2 * baseReward(averageDay(sim.progress.recent))
    const [e, ...more] = toThree(sim)
    expect(more).toEqual([])
    expect(e).toMatchObject({ checks: { stock: true, calm: true, tidy: true }, low: null, lost: 0, reward, cert: true })
    expect(e.beauty).toBe(sim.beauty())
    expect(sim.money).toBe(money + reward)
    expect(sim.stats.quests).toBe(reward)
    expect(sim.book.gifts).toEqual(['certificate'])
    expect(sim.eventBook).toMatchObject({ inspected: true, certGiven: true })
  })

  it('gives the Giấy khen only on the first pass', () => {
    const sim = inspectDay(s => (s.eventBook.certGiven = true))
    const [e] = toThree(sim)
    expect(e.cert).toBe(false)
    expect(e.reward).toBeGreaterThan(0)
    expect(sim.book.gifts).toEqual([])
  })

  it('fails a check and pays nothing', () => {
    const low = inspectDay(s => (s.stock.towel = LOW_STOCK - 2))
    const lost = inspectDay(s => (s.stats.walkedAway = 1))
    const plain = inspectDay(s => (s.items = s.items.filter(i => i.id < 900)))
    const results = [low, lost, plain].map(sim => {
      const money = sim.money
      const [e] = toThree(sim)
      expect(sim.money).toBe(money)
      expect(sim.book.gifts).toEqual([])
      expect(e).toMatchObject({ reward: 0, cert: false })
      return e
    })
    expect(results[0]).toMatchObject({ checks: { stock: false, calm: true, tidy: true }, low: { item: 'towel', count: LOW_STOCK - 2 } })
    expect(results[1]).toMatchObject({ checks: { stock: true, calm: false, tidy: true }, lost: 1 })
    expect(results[2]).toMatchObject({ checks: { stock: true, calm: true, tidy: false } })
  })

  it('inspects nothing on another day', () => {
    const sim = inspectDay(s => (s.eventBook.plan = { kind: 'inspect', day: 13, minute: 900 }))
    expect(toThree(sim)).toEqual([])
    expect(sim.eventBook.inspected).toBe(false)
  })
})

describe("the rival's day", () => {
  /** A shop on day 13 with the rival opening next door today. */
  const rivalDay = () => on(13, s => (s.eventBook.plan = { kind: 'rival', day: 13, minute: 0 }))

  it('grades picky customers like normal ones that day only', () => {
    const rival = rivalDay()
    ownerServes(rival, 1, { kind: 'picky', service: 'shampoo' })
    expect(rival.reviews).toEqual([reviewScore(1, 'normal')])
    const plain = on(13)
    ownerServes(plain, 1, { kind: 'picky', service: 'shampoo' })
    expect(plain.reviews).toEqual([reviewScore(1, 'harsh')])
  })

  it('counts every 3-star customer that day, of any kind, and nothing else', () => {
    const sim = rivalDay()
    ownerServes(sim, 3, { kind: 'picky', service: 'shampoo' })
    ownerServes(sim, 3, { kind: 'office', service: 'shampoo' })
    ownerServes(sim, 3, { vip: 'singer', service: 'shampoo' })
    ownerServes(sim, 2, { kind: 'student', service: 'shampoo' })
    expect(sim.eventBook.count).toBe(3)
    const plain = on(13)
    ownerServes(plain, 3, { kind: 'office', service: 'shampoo' })
    expect(plain.eventBook.count).toBe(0)
  })

  it('pays the rival reward once, when the count reaches the target', () => {
    const sim = rivalDay()
    const target = sim.rivalTarget()
    const reward = 2 * baseReward(averageDay(sim.progress.recent))
    sim.eventBook.count = target - 1
    const quests = sim.stats.quests
    const { events } = ownerServes(sim, 3, { kind: 'office', service: 'shampoo' })
    expect(ofType(events, 'rivalBeaten')).toEqual([{ type: 'rivalBeaten', reward }])
    expect(sim.stats.quests - quests).toBeGreaterThanOrEqual(reward)
    const again = ownerServes(sim, 3, { kind: 'office', service: 'shampoo' })
    expect(ofType(again.events, 'rivalBeaten')).toEqual([])
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())
    expect(copy.eventBook.count).toBe(target + 1)
    expect(ofType(ownerServes(copy, 3, { kind: 'office', service: 'shampoo' }).events, 'rivalBeaten')).toEqual([])
  })

  it('sets the target from the average day, never under the minimum', () => {
    const day = (served: number): DayRecord => ({ served, earned: 0, tips: 0, owner3: 0, staff: 0 })
    expect(rivalTarget([])).toBe(RIVAL_TARGET_MIN)
    expect(rivalTarget([day(10)])).toBe(RIVAL_TARGET_MIN)
    expect(rivalTarget([day(25)])).toBe(8)
    expect(rivalTarget([day(20), day(40)])).toBe(9)
    expect(rivalDay().rivalTarget()).toBe(rivalTarget(rivalDay().progress.recent))
  })
})

describe('the power cut', () => {
  /** A shop on day 20 with a Xông lá tent and a Đá nóng bed, whose power goes from 14:00 to 16:00 today. */
  const powerDay = (power = true) =>
    on(20, s => {
      s.services = ['shampoo', 'mask', 'massage', 'steam', 'stone']
      s.money = 5_000_000
      expect(s.buy('steamTent', 8, 8, false)).toBeNull()
      expect(s.buy('stoneBed', 4, 8, false)).toBeNull()
      if (power) s.eventBook.plan = { kind: 'power', day: 20, minute: POWER_FROM_MIN }
    })
  /** Steps the shop until the clock reaches `minute`, keeping what it says. */
  const stepTo = (sim: SpaSim, minute: number, events: SimEvent[] = []) => {
    advanceUntil(sim, () => sim.clock.minutes >= minute, 400_000, events)
    return [...events, ...sim.drainEvents()]
  }
  const toasts = (events: SimEvent[]) => ofType(events, 'toast').map(e => e.key)
  const powerSaid = (events: SimEvent[]) => events.filter(e => e.type === 'powerWarn' || e.type === 'powerOff' || e.type === 'powerOn')

  it('is out from 14:00 until 16:00 on its day only', () => {
    const book = { ...on(20).eventBook, plan: { kind: 'power' as const, day: 20, minute: POWER_FROM_MIN } }
    expect([839, 840, 959, 960].map(m => powerOutAt(book, 20, m))).toEqual([false, true, true, false])
    expect(powerOutAt(book, 21, 900)).toBe(false)
    expect(powerOutAt({ ...book, plan: { kind: 'inspect', day: 20, minute: 900 } }, 20, 900)).toBe(false)
  })

  it('says each power change once, and not again after a reload', () => {
    const sim = powerDay()
    sim.clock.minutes = 770
    const events = stepTo(sim, 1000)
    expect(powerSaid(events)).toEqual([{ type: 'powerWarn', machines: ['steam', 'stone'] }, { type: 'powerOff' }, { type: 'powerOn' }])

    const out = powerDay()
    out.clock.minutes = 900
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(out.toSave()))), opts())
    expect(copy.powerOut()).toBe(true)
    expect(powerSaid(stepTo(copy, 950))).toEqual([])
    expect(copy.powerOut()).toBe(true)
  })

  it('says nothing on a day without a power cut', () => {
    const sim = powerDay(false)
    sim.clock.minutes = 770
    expect(powerSaid(stepTo(sim, 1000))).toEqual([])
    sim.clock.minutes = 900
    expect(sim.powerOut()).toBe(false)
  })

  it('asks the owner to wait when she taps a customer of a machine', () => {
    const sim = powerDay()
    sim.clock.minutes = 800
    const c = seatAndWait(sim, { kind: 'office', service: 'steam' })
    sim.clock.minutes = 845
    sim.drainEvents()
    sim.tapTile(c.seat!)
    expect(toasts(sim.drainEvents())).toEqual(['powerWait'])
    expect(sim.owner.task).toBeNull()
  })

  it("calls off the owner's fetch of a machine customer when the power goes on the way", () => {
    const sim = powerDay()
    sim.clock.minutes = 800
    const c = seatAndWait(sim, { kind: 'office', service: 'steam' })
    sim.clock.minutes = 839.9
    sim.tapTile(c.seat!)
    expect(sim.owner.task).toEqual({ kind: 'fetch', customerId: c.id })
    const events: SimEvent[] = []
    advanceUntil(sim, () => sim.owner.task === null, 120_000, events)
    expect(sim.clock.minutes).toBeGreaterThanOrEqual(840)
    expect(c.state).toBe('waiting')
    expect(c.stationId).toBeNull()
    expect(toasts([...events, ...sim.drainEvents()])).toContain('powerWait')
  })

  it('lets a technician pass over a machine customer for a hand service', () => {
    const sim = powerDay()
    sim.clock.minutes = 800
    const steam = seatAndWait(sim, { kind: 'office', service: 'steam' })
    const shampoo = seatAndWait(sim, { kind: 'office', service: 'shampoo' })
    sim.clock.minutes = 845
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => tech.task !== null)
    expect(tech.task).toMatchObject({ kind: 'fetch', customerId: shampoo.id })
    advanceUntil(sim, () => shampoo.state === 'inService')
    expect(steam.state).toBe('waiting')
    expect(steam.stationId).toBeNull()
  })

  it("calls off a technician's fetch of a machine customer when the power goes on the way", () => {
    const sim = powerDay()
    sim.clock.minutes = 800
    const steam = seatAndWait(sim, { kind: 'office', service: 'steam' })
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => tech.task !== null)
    expect(tech.task).toMatchObject({ kind: 'fetch', customerId: steam.id })
    expect(tech.path.length).toBeGreaterThan(0)
    sim.clock.minutes = 839.9
    stepTo(sim, 860)
    expect(steam.state).toBe('waiting')
    expect(steam.stationId).toBeNull()
    expect(tech.task?.kind).not.toBe('serve')
  })

  it('finishes and pays a machine service already running when the power goes', () => {
    const sim = powerDay()
    sim.clock.minutes = 800
    const c = seatAndWait(sim, { kind: 'office', service: 'stone' })
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => c.state === 'inService')
    sim.clock.minutes = 845
    const events: SimEvent[] = []
    advanceUntil(sim, () => ofType(events, 'paid').length > 0, 400_000, events)
    expect(ofType(events, 'paid')[0].customerId).toBe(c.id)
    expect(sim.powerOut()).toBe(true)
    expect(tech.task?.kind).not.toBe('serve')
  })

  it('new customers ask for a hand service while the power is out', () => {
    const sim = powerDay()
    sim.clock.minutes = 900
    const asked = [...REGULAR_IDS.map(regular => sim.spawnCustomer({ regular })), ...Array.from({ length: 200 }, () => sim.spawnCustomer())].map(c => c.service)
    expect(asked.filter(s => MACHINES.includes(s))).toEqual([])
    sim.clock.minutes = 970
    const later = Array.from({ length: 200 }, () => sim.spawnCustomer().service)
    expect(later.some(s => MACHINES.includes(s))).toBe(true)
  })

  it('keeps every waiting customer patient while it is out', () => {
    const sim = powerDay()
    sim.clock.minutes = 830
    const c = seatAndWait(sim, { kind: 'office', service: 'shampoo' })
    stepTo(sim, 845)
    const patience = c.patienceMs
    stepTo(sim, 950)
    expect(c.patienceMs).toBe(patience)
    sim.clock.minutes = 959
    stepTo(sim, 962)
    expect(c.patienceMs).toBeLessThan(patience)
  })

  it('tips half again for a service paid while it is out', () => {
    const plain = powerDay(false)
    plain.clock.minutes = 900
    const { tip } = ownerServes(plain, 3, { kind: 'office', service: 'shampoo' })
    expect(tip).toBeGreaterThan(0)
    const out = powerDay()
    out.clock.minutes = 900
    expect(Math.abs(ownerServes(out, 3, { kind: 'office', service: 'shampoo' }).tip - tip * POWER_TIP_FACTOR)).toBeLessThanOrEqual(1)
    out.clock.minutes = 970
    expect(ownerServes(out, 3, { kind: 'office', service: 'shampoo' }).tip).toBe(tip)
  })
})
