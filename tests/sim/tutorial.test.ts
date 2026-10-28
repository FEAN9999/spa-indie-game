import { describe, expect, it } from 'vitest'
import { UNLOCK_DAY } from '../../src/config'
import { bookOpen } from '../../src/sim/regulars'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import { STARTER_GOAL_IDS } from '../../src/sim/starter'
import { pickHint } from '../../src/sim/tutorial'
import { TUTORIAL_HINTS } from '../../src/sim/types'
import { planBooking } from '../../src/sim/vips'
import v1 from '../fixtures/save-v1.json'
import { advanceUntil, seatAndWait, startService } from './helpers'

const fresh = () => new SpaSim({ rng: createRng(1), autoSpawn: false })

describe('first-day hints', () => {
  it('points at the first customer to sit down until the player taps one', () => {
    const sim = fresh()
    expect(pickHint(sim)).toBeNull()
    const a = seatAndWait(sim)
    const b = seatAndWait(sim)
    expect(pickHint(sim)).toEqual({ hint: 'tapCustomer', customerId: a.id })
    sim.tapTile(b.seat!)
    expect(sim.hintDone('tapCustomer')).toBe(true)
    expect(pickHint(sim)).toBeNull()
  })

  it('then points once at a customer whose patience fell below half', () => {
    const sim = fresh()
    sim.markHint('tapCustomer')
    const c = seatAndWait(sim)
    expect(pickHint(sim)).toBeNull()
    c.patienceMs = c.patienceMaxMs / 2 - 1
    expect(pickHint(sim)).toEqual({ hint: 'patience', customerId: c.id })
    sim.markHint('patience')
    expect(pickHint(sim)).toBeNull()
  })

  it('shows one hint at a time, the tap hint first', () => {
    const sim = fresh()
    const c = seatAndWait(sim)
    c.patienceMs = 1
    expect(pickHint(sim)).toEqual({ hint: 'tapCustomer', customerId: c.id })
  })

  it('stays quiet while paused, during a service and after closing', () => {
    const sim = fresh()
    seatAndWait(sim)
    sim.paused = true
    expect(pickHint(sim)).toBeNull()
    sim.paused = false
    sim.dayOver = true
    expect(pickHint(sim)).toBeNull()
    sim.dayOver = false
    startService(sim)
    expect(pickHint(sim)).toBeNull()
  })

  it('never guides a shop from before the tutorial', () => {
    const sim = SpaSim.fromSave(parseSave(structuredClone(v1)), { rng: createRng(1), autoSpawn: false })
    seatAndWait(sim)
    expect(pickHint(sim)).toBeNull()
  })

  it('remembers which hints were shown across a save', () => {
    const sim = fresh()
    const c = seatAndWait(sim)
    sim.tapTile(c.seat!)
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(1), autoSpawn: false })
    expect([copy.hintDone('tapCustomer'), copy.hintDone('demoShampoo')]).toEqual([true, false])
  })
})

/** A shop on day `day` that has seen every first-day tip. */
const pastTutorial = (day: number) => {
  const sim = fresh()
  for (const h of TUTORIAL_HINTS) sim.markHint(h)
  sim.day = day
  return sim
}

describe('the regulars hints', () => {
  it('points at the first waiting regular, then at the book', () => {
    const sim = pastTutorial(7)
    expect(pickHint(sim)).toBeNull()
    seatAndWait(sim)
    expect(pickHint(sim)).toBeNull()
    // she is still walking in: the book is open, but its hand waits for hers
    const r = sim.spawnCustomer({ regular: 'hanh' })
    expect(bookOpen(sim.book)).toBe(true)
    expect(pickHint(sim)).toBeNull()
    advanceUntil(sim, () => r.state === 'waiting')
    seatAndWait(sim, { regular: 'vy' })
    expect(pickHint(sim)).toEqual({ hint: 'regular', customerId: r.id })
    sim.markHint('regular')
    expect(pickHint(sim)).toEqual({ hint: 'openBook' })
    sim.markHint('openBook')
    expect(pickHint(sim)).toBeNull()
  })
})

describe('the VIP hints', () => {
  it('points at a waiting VIP once', () => {
    const sim = pastTutorial(9)
    const c = sim.spawnCustomer({ vip: 'chef' })
    expect(pickHint(sim)).toBeNull()
    advanceUntil(sim, () => c.state === 'waiting')
    expect(pickHint(sim)).toEqual({ hint: 'vip', customerId: c.id })
    sim.markHint('vip')
    expect(pickHint(sim)).toBeNull()
  })

  it('points at the book once a VIP has been booked and her hint is done', () => {
    const sim = pastTutorial(9)
    expect(sim.bookShown()).toBe(false)
    expect(planBooking(sim.vip, sim.day, 2, sim.availableServices(), createRng(1))).not.toBeNull()
    expect(sim.bookShown()).toBe(true)
    expect(pickHint(sim)).toBeNull()
    sim.markHint('vip')
    expect(pickHint(sim)).toEqual({ hint: 'openBook' })
    sim.markHint('bookVip')
    expect(pickHint(sim)).toBeNull()
  })

  it('keeps the regulars their book hand after a VIP-only open, and leaves an old shop alone', () => {
    const sim = pastTutorial(9)
    planBooking(sim.vip, sim.day, 2, sim.availableServices(), createRng(1))
    sim.markHint('vip')
    expect(sim.bookHint()).toBe('bookVip')
    sim.markHint(sim.bookHint())
    expect(pickHint(sim)).toBeNull()
    sim.book.regulars.hanh.met = true
    expect(sim.bookHint()).toBe('openBook')
    expect(pickHint(sim)).toEqual({ hint: 'openBook' })
    sim.markHint('openBook')
    expect(pickHint(sim)).toBeNull()

    const old = pastTutorial(9)
    planBooking(old.vip, old.day, 2, old.availableServices(), createRng(1))
    old.markHint('vip')
    old.markHint('openBook')
    old.book.regulars.hanh.met = true
    expect(pickHint(old)).toBeNull()
  })
})

describe('the build button hint', () => {
  it('points at the build button on the morning it opens, once the first-day tips are done', () => {
    expect(pickHint(pastTutorial(UNLOCK_DAY.build))).toEqual({ hint: 'openBuild' })
  })

  it('is gone once build mode was opened', () => {
    const sim = pastTutorial(UNLOCK_DAY.build)
    sim.markHint('openBuild')
    expect(pickHint(sim)).toBeNull()
  })

  it('only shows on the day building opens, so an older shop gets no hand', () => {
    expect(pickHint(pastTutorial(UNLOCK_DAY.build - 1))).toBeNull()
    // the day after is the staff button's morning, with its own hand
    expect(pickHint(pastTutorial(UNLOCK_DAY.build + 1))?.hint).not.toBe('openBuild')
  })

  it('waits behind the first-day tips', () => {
    const sim = fresh()
    sim.day = UNLOCK_DAY.build
    expect(pickHint(sim)).toBeNull()
    const c = seatAndWait(sim)
    expect(pickHint(sim)).toEqual({ hint: 'tapCustomer', customerId: c.id })
    sim.markHint('tapCustomer')
    // the patience tip goes first only when it is due
    expect(pickHint(sim)).toEqual({ hint: 'openBuild' })
    c.patienceMs = 1
    expect(pickHint(sim)).toEqual({ hint: 'patience', customerId: c.id })
    sim.markHint('patience')
    expect(pickHint(sim)).toEqual({ hint: 'openBuild' })
  })

  it('stays quiet while paused or after closing', () => {
    const sim = pastTutorial(UNLOCK_DAY.build)
    sim.paused = true
    expect(pickHint(sim)).toBeNull()
    sim.paused = false
    sim.dayOver = true
    expect(pickHint(sim)).toBeNull()
  })
})

describe('the staff button hint', () => {
  it('points at the staff button on the morning of day 3 until it is opened', () => {
    const sim = pastTutorial(UNLOCK_DAY.staff)
    expect(pickHint(sim)).toEqual({ hint: 'openStaff' })
    sim.markHint('openStaff')
    expect(pickHint(sim)).toBeNull()
  })

  it('no staff hand on a shop past day 3', () => {
    expect(pickHint(pastTutorial(UNLOCK_DAY.staff + 1))).not.toEqual({ hint: 'openStaff' })
    expect(pickHint(pastTutorial(UNLOCK_DAY.staff + 3))).toBeNull()
  })
})

describe('the services button hint', () => {
  it('points at the services button on the morning of day 4 until it is opened', () => {
    const sim = pastTutorial(UNLOCK_DAY.services)
    expect(pickHint(sim)).toEqual({ hint: 'openServices' })
    sim.markHint('openServices')
    expect(pickHint(sim)).toBeNull()
  })

  it('no services hand on a shop past day 4 (day 5 has the stock hand)', () => {
    expect(pickHint(pastTutorial(UNLOCK_DAY.services + 2))).toBeNull()
  })
})

describe('the stock hint', () => {
  it('points at the services button on day 5 until the stock was seen', () => {
    const sim = pastTutorial(UNLOCK_DAY.stock)
    expect(pickHint(sim)).toEqual({ hint: 'openStock' })
    sim.markHint('openStock')
    expect(pickHint(sim)).toBeNull()
  })

  it('gives an old shop on day 6 no hand', () => {
    expect(pickHint(pastTutorial(UNLOCK_DAY.stock + 1))).toBeNull()
  })

  it('still points on day 5 when the services hint was never shown', () => {
    const sim = pastTutorial(UNLOCK_DAY.stock)
    expect(sim.hintDone('openServices')).toBe(false)
    expect(pickHint(sim)).toEqual({ hint: 'openStock' })
  })
})

describe('the floor hint', () => {
  it('points at the build button once a second floor is open, until it is marked', () => {
    const sim = fresh()
    sim.markHint('tapCustomer')
    sim.day = 6
    sim.money = 2_000_000
    expect(pickHint(sim)).toBeNull()
    sim.openFloor(2)
    expect(pickHint(sim)).toEqual({ hint: 'openFloor' })
    sim.markHint('openFloor')
    expect(pickHint(sim)).toBeNull()
  })
})

describe('the quests hint', () => {
  it('points at the quests button on day 8 until it is opened', () => {
    const sim = pastTutorial(UNLOCK_DAY.quests)
    expect(pickHint(sim)).toEqual({ hint: 'openQuests' })
    sim.markHint('openQuests')
    expect(pickHint(sim)).toBeNull()
  })

  it('gives an old shop on day 9 no hand', () => {
    expect(pickHint(pastTutorial(UNLOCK_DAY.quests + 1))).toBeNull()
  })
})

describe('the starter chain hints', () => {
  /** A shop on the starter chain that has seen every first-day tip. */
  const chain = () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false, starter: true })
    for (const h of TUTORIAL_HINTS) sim.markHint(h)
    return sim
  }

  it('points at Build from the day its goal opens it until its old day, while it has not been opened', () => {
    const sim = chain()
    expect(pickHint(sim)).toBeNull()
    sim.starter.opened.build = 1
    expect(pickHint(sim)).toEqual({ hint: 'openBuild' })
    sim.day = 2
    expect(pickHint(sim)).toEqual({ hint: 'openBuild' })
    sim.markHint('openBuild')
    expect(pickHint(sim)).toBeNull()
  })

  it('points at Quests on the first morning of the daily quests, never while the chain runs', () => {
    const sim = chain()
    for (const h of ['openBuild', 'openStaff', 'openServices', 'openStock'] as const) sim.markHint(h)
    for (let day = 1; day <= 7; day++) {
      sim.day = day
      expect(pickHint(sim), `day ${day}`).toBeNull()
    }
    sim.starter.at = STARTER_GOAL_IDS.length
    sim.starter.doneDay = 4
    sim.day = 4
    expect(pickHint(sim)).toBeNull()
    sim.day = 5
    expect(pickHint(sim)).toEqual({ hint: 'openQuests' })
  })

  it('points at Build while the mask bed gift waits on its goal', () => {
    const sim = chain()
    sim.markHint('openBuild')
    sim.starter.opened.build = 1
    sim.starter.at = STARTER_GOAL_IDS.indexOf('placeMaskBed')
    expect(pickHint(sim)).toBeNull()
    sim.book.gifts.push('maskBed')
    expect(pickHint(sim)).toEqual({ hint: 'placeGift' })
    sim.starter.at++
    expect(pickHint(sim)).toBeNull()
  })
})
