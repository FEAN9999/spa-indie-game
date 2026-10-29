import { describe, expect, it } from 'vitest'
import { ANGRY_REVIEW, DAY_END_MIN, FESTIVAL_PRICE, GENEROUS_CHANCE, HOT_DAYS, IDOL_PRICE_FACTOR, PATIENCE_MS, SERVICE_PRICE, STEP_MS, VIP_PATIENCE } from '../../src/config'
import { KINDS } from '../../src/sim/customers'
import { tipFor } from '../../src/sim/economy'
import { emptyIdolBook, idolEligible, IDOLS, planIdol } from '../../src/sim/idols'
import { rankPrice } from '../../src/sim/rank'
import { createRng, type Rng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { tipFactor } from '../../src/sim/staff'
import type { Customer, SimEvent } from '../../src/sim/types'
import { planBooking, VIP_KIND } from '../../src/sim/vips'
import { advanceUntil, hireStaff, ownerServes, seatAndWait, startService } from './helpers'

const fresh = (rng: Rng = createRng(1), autoSpawn = false) => new SpaSim({ rng, autoSpawn })

/** A shop with the gold board, two technicians, and mask and massage open with one massage bed by the back wall. */
const boardShop = (rng?: Rng, autoSpawn = false) => {
  const sim = fresh(rng, autoSpawn)
  sim.money = 20_000_000
  expect(sim.openService('mask')).toBeNull()
  expect(sim.openService('massage')).toBeNull()
  expect(sim.buy('massageBed', 6, 2, false)).toBeNull()
  sim.vip.boardGiven = true
  hireStaff(sim, 'technician')
  hireStaff(sim, 'technician')
  sim.drainEvents()
  return sim
}

/** Every seat taken by someone who is not there. */
const fillSeats = (sim: SpaSim) => {
  for (const s of sim.seats) s.customerId = 999
}

/** Closes the shop now and runs it to the end of its day. */
const closeDay = (sim: SpaSim) => {
  sim.clock.minutes = DAY_END_MIN
  advanceUntil(sim, () => sim.dayOver, 400_000)
}

/** A seeded rng that counts its draws. */
function counting(seed: number) {
  const rng = createRng(seed)
  const counter = { draws: 0, rng: () => (counter.draws++, rng()) }
  return counter
}

/** The owner serves the customer with `stars`; returns the events of the payment. */
const serve = (sim: SpaSim, c: Customer, stars: 1 | 2 | 3): SimEvent[] => {
  sim.drainEvents()
  sim.completeService(c.id, stars)
  return sim.drainEvents()
}

const ownerOnly = (sim: SpaSim) => sim.customers.filter(c => c.vip !== null || c.idol !== null)

describe('booking a star', () => {
  it('books no star before the gold board, or with one technician', () => {
    const noBoard = boardShop()
    noBoard.vip.boardGiven = false
    const oneTech = boardShop()
    oneTech.fire(oneTech.staff[1].id)
    for (const sim of [noBoard, oneTech]) {
      for (let d = 0; d < 40; d++) {
        closeDay(sim)
        expect(sim.idol.booking).toBeNull()
        expect(sim.idol.everBooked).toBe(false)
        sim.startDay()
      }
    }
  })

  it('books Sơn Tùng for tomorrow the night the board comes', () => {
    const r = counting(1)
    const sim = boardShop(r.rng)
    sim.vip.boardGiven = false
    for (const id of ['singer', 'miss', 'star'] as const) sim.vip.vips[id].photo = true
    const chef = startService(sim, { vip: 'chef' })
    expect(serve(sim, chef, 3)).toContainEqual(expect.objectContaining({ type: 'vipServed', vip: 'chef', board: true }))
    expect(sim.idol.booking).toBeNull()
    const nextId = sim.toSave().nextId
    const vipBefore = structuredClone(sim.vip)
    const draws = r.draws
    closeDay(sim)
    // the shop's draws and the VIP's stream are as they were
    expect(r.draws).toBe(draws)
    expect(sim.vip.booking).toEqual(planBooking(vipBefore, sim.day, 2, sim.availableServices(), createRng(sim.day * 7919 + nextId)))
    expect(sim.idol.booking).toEqual({ idol: 'sontung', day: sim.day + 1, minute: expect.any(Number) })
    expect(sim.idol.booking).toEqual(planIdol(emptyIdolBook(), sim.day, true, 2, sim.availableServices(), sim.vip.booking, createRng(sim.day * 8737 + nextId)))
    expect(sim.idol.everBooked).toBe(true)
  })

  it("books a star 3 hours from tomorrow's VIP", () => {
    const unfiltered: number[] = []
    for (let day = 1; day <= 12; day++) {
      const sim = boardShop()
      sim.day = day
      sim.vip.booking = { vip: 'chef', day: day + 1, minute: 600 }
      const nextId = sim.toSave().nextId
      closeDay(sim)
      expect(sim.idol.booking?.day).toBe(day + 1)
      expect(sim.idol.booking!.minute).toBeGreaterThanOrEqual(780)
      unfiltered.push(planIdol(emptyIdolBook(), day, true, 2, sim.availableServices(), null, createRng(day * 8737 + nextId))!.minute)
    }
    // the same draws with no VIP tomorrow would have put some of them closer
    expect(unfiltered.some(m => m < 780)).toBe(true)
  })

  it("plans no event on a star's day", () => {
    // tomorrow is day 12: no festival, and events are on
    const shop = (board: boolean) => {
      const sim = boardShop()
      sim.vip.boardGiven = board
      sim.day = 11
      sim.vip.booking = { vip: 'chef', day: 14, minute: 600 }
      closeDay(sim)
      return sim
    }
    const starred = shop(true)
    expect(starred.idol.booking?.day).toBe(12)
    expect(starred.eventBook.plan).toBeNull()
    // the same night with no star booked plans an event for tomorrow
    const plain = shop(false)
    expect(plain.idol.booking).toBeNull()
    expect(plain.eventBook.plan?.day).toBe(12)
  })

  it('a branch never books a star', () => {
    const main = boardShop()
    const branch = SpaSim.newBranch('beach', main, createRng(9))
    branch.vip.boardGiven = true
    hireStaff(branch, 'technician')
    hireStaff(branch, 'technician')
    expect(branch.buy('massageBed', 8, 2, false)).toBeNull()
    expect(idolEligible(branch.vip.boardGiven, 2, branch.availableServices())).toBe(true)
    closeDay(branch)
    expect(branch.idol.booking).toBeNull()
    expect(branch.idol.everBooked).toBe(false)
  })
})

describe('a star walking in', () => {
  it('brings the star at their minute', () => {
    const sim = boardShop(createRng(1), true)
    sim.idol.booking = { idol: 'sontung', day: sim.day, minute: 600 }
    const arrivals: { minute: number; e: SimEvent }[] = []
    while (sim.clock.minutes < 640) {
      sim.advance(STEP_MS)
      for (const e of sim.drainEvents()) if (e.type === 'idolArrived') arrivals.push({ minute: sim.clock.minutes, e })
    }
    const idols = sim.customers.filter(c => c.idol !== null)
    expect(idols).toHaveLength(1)
    const c = idols[0]
    expect(arrivals).toEqual([{ minute: expect.any(Number), e: { type: 'idolArrived', customerId: c.id, idol: 'sontung', first: true } }])
    expect(arrivals[0].minute).toBeGreaterThanOrEqual(600)
    expect(arrivals[0].minute).toBeLessThan(601)
    expect([c.idol, c.vip, c.regular, c.kol, c.kind, c.service]).toEqual(['sontung', null, null, false, VIP_KIND, 'massage'])
    expect(VIP_KIND).toBe('celeb')
    expect(c.look).toEqual(IDOLS.sontung.look)
    expect(c.look).not.toBe(IDOLS.sontung.look)
    expect(c.patienceMaxMs).toBe(Math.round(PATIENCE_MS * VIP_PATIENCE))
    expect(sim.idol.idols.sontung.visits).toBe(1)
    expect(sim.idol.booking).toBeNull()
  })

  it('draws nothing from the shop when a star walks in', () => {
    const r = counting(1)
    const sim = boardShop(r.rng)
    const before = r.draws
    const c = sim.spawnCustomer({ idol: 'taylor' })
    expect(r.draws).toBe(before)
    expect(c.service).toBe('massage')
    expect(sim.drainEvents()).toEqual([
      { type: 'customerArrived', id: c.id },
      { type: 'idolArrived', customerId: c.id, idol: 'taylor', first: true },
    ])
    const again = sim.spawnCustomer({ idol: 'taylor' })
    expect(sim.drainEvents()).toContainEqual({ type: 'idolArrived', customerId: again.id, idol: 'taylor', first: false })
    expect(sim.idol.idols.taylor.visits).toBe(2)
  })

  it('keeps a star standing by the desk when every seat is taken', () => {
    const seated = boardShop()
    expect(seated.isStanding(seatAndWait(seated, { idol: 'sontung' }))).toBe(false)

    const sim = boardShop()
    fillSeats(sim)
    const ev: SimEvent[] = []
    const c = sim.spawnCustomer({ idol: 'sontung' })
    advanceUntil(sim, () => c.state === 'waiting', undefined, ev)
    expect(ev.some(e => e.type === 'noSeat')).toBe(false)
    expect(sim.stats.walkedAway).toBe(0)
    expect(sim.isStanding(c)).toBe(true)
    expect(sim.seats.every(s => s.customerId === 999)).toBe(true)
  })

  it("staff never fetch a star, and hold the star's bed while the owner is here", () => {
    const sim = boardShop()
    // a second massage bed, for the office customer once the star is on the first
    expect(sim.buy('massageBed', 8, 2, false)).toBeNull()
    const techs = sim.staff
    // in the same tick, so no technician has gone for him before the star is in
    const office = sim.spawnCustomer({ kind: 'office', service: 'massage' })
    const idol = sim.spawnCustomer({ idol: 'sontung' })
    const fetching = () => techs.flatMap(t => (t.task?.kind === 'fetch' ? [t.task.customerId] : []))
    for (let ms = 0; ms < 15_000; ms += 100) {
      sim.advance(100)
      expect(fetching()).toEqual([])
    }
    expect([office.state, idol.state]).toEqual(['waiting', 'waiting'])
    expect(sim.stations.every(s => s.customerId === null)).toBe(true)

    sim.tapTile(idol.seat!)
    while (idol.state !== 'toStation') {
      expect(fetching()).toEqual([])
      sim.advance(100)
    }
    advanceUntil(sim, () => fetching().length > 0)
    expect(fetching()).toEqual([office.id])

    // with the owner away nothing is held, but the star is still never fetched
    const away = boardShop()
    away.ownerLeaves()
    const idol2 = away.spawnCustomer({ idol: 'sontung' })
    advanceUntil(away, () => idol2.state === 'waiting')
    const fetched = new Set<number>()
    for (let ms = 0; ms < 15_000; ms += 100) {
      away.advance(100)
      for (const t of away.staff) if (t.task?.kind === 'fetch') fetched.add(t.task.customerId)
    }
    expect(fetched.has(idol2.id)).toBe(false)
    expect(idol2.stationId).toBeNull()
    // while an office customer of the same service is fetched past her
    const office2 = away.spawnCustomer({ kind: 'office', service: 'massage' })
    advanceUntil(away, () => office2.stationId !== null)
    expect(idol2.stationId).toBeNull()
  })
})

describe('serving a star', () => {
  it('charges five times the graded price on a festival day, tipping on the plain price', () => {
    const sim = boardShop()
    // Ngày 8/3, whose service is massage
    sim.day = 8
    sim.rank.stars = 3
    expect(sim.festivalServiceToday()).toBe('massage')
    const plain = rankPrice(SERVICE_PRICE.massage, 3)
    expect(plain).not.toBe(SERVICE_PRICE.massage)
    const c = startService(sim, { idol: 'sontung' })
    const before = sim.money
    const paid = serve(sim, c, 3).find(e => e.type === 'paid')
    if (paid?.type !== 'paid') throw new Error('no payment')
    expect(paid.amount).toBe(plain * IDOL_PRICE_FACTOR)
    expect(paid.tip).toBe(Math.round(tipFor(plain, 3) * KINDS[VIP_KIND].tip[2] * tipFactor(c.greet, null)))
    expect(sim.money).toBe(before + paid.amount + paid.tip)
    expect(sim.stats.income).toBe(plain * IDOL_PRICE_FACTOR)
    // anyone else pays the festival price for it
    expect(ownerServes(sim, 3, { kind: 'office', service: 'massage' }).amount).toBe(Math.round(plain * FESTIVAL_PRICE))
  })

  it('gives three reviews, and three angry ones on walking out', () => {
    const sim = boardShop()
    const c = startService(sim, { idol: 'sontung' })
    const ev = serve(sim, c, 3)
    expect(ev.filter(e => e.type === 'review')).toEqual([5, 5, 5].map(score => ({ type: 'review', customerId: c.id, score })))

    const angry = boardShop()
    const s = seatAndWait(angry, { idol: 'gd' })
    angry.drainEvents()
    s.patienceMs = 1
    const out: SimEvent[] = []
    advanceUntil(angry, () => s.mood === 'angry', undefined, out)
    out.push(...angry.drainEvents())
    expect(out.filter(e => e.type === 'review')).toEqual([1, 2, 3].map(() => ({ type: 'review', customerId: s.id, score: ANGRY_REVIEW })))
    expect(angry.reviews).toEqual([ANGRY_REVIEW, ANGRY_REVIEW, ANGRY_REVIEW])
  })

  it('leaves ownerServed, the generous tip and the kinds served alone but counts toward the quests', () => {
    // a day on which the first customer's 3 stars from the owner bring a generous tip
    const shop = () => {
      const sim = boardShop()
      const id = sim.toSave().nextId
      sim.day = Array.from({ length: 60 }, (_, i) => i + 1).find(d => createRng(d * 5303 + id)() < GENEROUS_CHANCE)!
      return sim
    }
    // an office worker in her place is generous
    const twin = shop()
    expect(ownerServes(twin, 3, { kind: 'office', service: 'massage' }).events.some(e => e.type === 'generous')).toBe(true)
    expect(twin.stats.ownerServed).toBe(1)

    const sim = shop()
    const book = structuredClone(sim.book)
    const total = structuredClone(sim.progress.total)
    const c = startService(sim, { idol: 'sontung' })
    const ev = serve(sim, c, 3)
    const paid = ev.find(e => e.type === 'paid')
    if (paid?.type !== 'paid') throw new Error('no payment')
    expect(ev.some(e => e.type === 'generous')).toBe(false)
    expect(sim.stats.ownerServed).toBe(0)
    expect(sim.stats.served).toBe(1)
    expect(sim.book.served).toEqual(book.served)
    expect(sim.book.kindsMet).toEqual(book.kindsMet)
    const t = sim.progress.total
    expect([t.served, t.owner3, t.services.massage]).toEqual([total.served + 1, total.owner3 + 1, total.services.massage + 1])
    expect([t.earned, t.tips]).toEqual([total.earned + paid.amount + paid.tip, total.tips + paid.tip])
  })

  it('makes the shop hot from tomorrow after 3 stars, giving the photo once', () => {
    const sim = boardShop()
    sim.day = 11
    const served = (stars: 1 | 2 | 3) => serve(sim, startService(sim, { idol: 'sontung' }), stars).find(e => e.type === 'idolServed')
    expect(served(2)).toMatchObject({ type: 'idolServed', idol: 'sontung', stars: 2, photo: false, wall: false })
    expect(sim.eventBook.hotUntil).toBe(0)
    expect(sim.book.gifts).toEqual([])

    const c = startService(sim, { idol: 'sontung' })
    expect(serve(sim, c, 3)).toContainEqual({ type: 'idolServed', customerId: c.id, idol: 'sontung', stars: 3, photo: true, wall: false })
    expect([sim.eventBook.hotUntil, sim.eventBook.hotBy, sim.eventBook.hotCardDay]).toEqual([11 + HOT_DAYS, 'sontung', 12])
    expect(sim.hotToday()).toBe(false)
    expect(sim.book.gifts).toEqual(['photoIdolSontung'])

    expect(served(3)).toMatchObject({ photo: false, wall: false })
    expect(sim.book.gifts).toEqual(['photoIdolSontung'])
    expect(sim.idol.idols.sontung).toMatchObject({ visits: 3, best: 3, photo: true })

    closeDay(sim)
    sim.drainEvents()
    sim.startDay()
    expect(sim.drainEvents()).toContainEqual({ type: 'hotStarted', until: 11 + HOT_DAYS })
    expect(sim.hotToday()).toBe(true)
  })

  it('counts star visits in the served badge', () => {
    const sim = boardShop()
    const before = sim.badgeShop().served
    sim.spawnCustomer({ idol: 'taylor' })
    expect(sim.badgeShop().served).toBe(before + 1)
    sim.spawnCustomer({ idol: 'jennie' })
    expect(sim.badgeShop().served).toBe(before + 2)
  })
})

describe('a VIP and a star never in the shop together', () => {
  /** The owner serves `first` and the shop steps until she is out of the door, with nobody owner-only coming in after her; returns the events. */
  const seeOut = (sim: SpaSim, first: Customer): SimEvent[] => {
    const ev: SimEvent[] = []
    sim.tapTile(first.seat!)
    advanceUntil(sim, () => first.state === 'inService', undefined, ev)
    ev.push(...serve(sim, first, 3))
    while (sim.customers.includes(first)) {
      expect(ownerOnly(sim)).toEqual([first])
      sim.advance(STEP_MS)
      ev.push(...sim.drainEvents())
    }
    expect(ownerOnly(sim)).toEqual([])
    return ev
  }

  it('the second comer waits outside until the first has left: a star due while a VIP is in', () => {
    const sim = boardShop(createRng(1), true)
    const vip = seatAndWait(sim, { vip: 'chef' })
    sim.idol.booking = { idol: 'sontung', day: sim.day, minute: Math.floor(sim.clock.minutes) }
    const pending = structuredClone(sim.idol.booking)
    sim.advance(2_000)
    expect(ownerOnly(sim)).toEqual([vip])
    const ev = [...sim.drainEvents(), ...seeOut(sim, vip)]
    expect(ev.filter(e => e.type === 'idolArrived')).toEqual([])
    expect(sim.idol.booking).toEqual(pending)
    sim.advance(STEP_MS)
    const came = ownerOnly(sim)
    expect(came.map(c => c.idol)).toEqual(['sontung'])
    expect(sim.drainEvents()).toContainEqual({ type: 'idolArrived', customerId: came[0].id, idol: 'sontung', first: true })
    expect(sim.idol.booking).toBeNull()
  })

  it('the second comer waits outside until the first has left: a VIP due while a star is in', () => {
    const sim = boardShop(createRng(1), true)
    const idol = seatAndWait(sim, { idol: 'sontung' })
    sim.vip.booking = { vip: 'chef', day: sim.day, minute: Math.floor(sim.clock.minutes) }
    const pending = structuredClone(sim.vip.booking)
    sim.advance(2_000)
    expect(ownerOnly(sim)).toEqual([idol])
    const ev = [...sim.drainEvents(), ...seeOut(sim, idol)]
    expect(ev.filter(e => e.type === 'vipArrived')).toEqual([])
    expect(sim.vip.booking).toEqual(pending)
    sim.advance(STEP_MS)
    const vip = ownerOnly(sim)
    expect(vip.map(c => c.vip)).toEqual(['chef'])
    expect(sim.drainEvents()).toContainEqual({ type: 'vipArrived', customerId: vip[0].id, vip: 'chef', first: true })
    expect(sim.vip.booking).toBeNull()
  })

  it('a star kept outside until closing does not come', () => {
    const sim = boardShop(createRng(1), true)
    sim.clock.minutes = DAY_END_MIN - 20
    const vip = seatAndWait(sim, { vip: 'chef' })
    // she waits past closing, then gives up
    vip.patienceMs = 10 * 60_000
    const day = sim.day
    sim.idol.booking = { idol: 'sontung', day, minute: Math.floor(sim.clock.minutes) }
    const pending = structuredClone(sim.idol.booking)
    // the gap since the last star has passed by tomorrow night
    sim.idol.nextDay = day + 2
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.clock.isClosed, undefined, ev)
    expect(ownerOnly(sim)).toEqual([vip])
    vip.patienceMs = 1
    advanceUntil(sim, () => sim.dayOver, 400_000, ev)
    expect(ev.filter(e => e.type === 'idolArrived')).toEqual([])
    expect(sim.idol.idols.sontung.visits).toBe(0)
    // a booking still pending books no one tonight
    expect(sim.idol.booking).toEqual(pending)
    sim.startDay()
    expect(sim.idol.booking).toBeNull()
    closeDay(sim)
    expect(sim.idol.booking).toEqual({ idol: 'sontung', day: day + 2, minute: expect.any(Number) })
  })

  it('a waiting star whose last bed is sold takes the first open service, drawing nothing from the shop', () => {
    const [rngA, rngB] = [createRng(5), createRng(5)]
    const [sim, twin] = [boardShop(rngA), boardShop(rngB)]
    // a mask bed too, so two services stay open when the massage bed goes
    for (const s of [sim, twin]) expect(s.buy('maskBed', 8, 2, false)).toBeNull()
    const star = seatAndWait(sim, { idol: 'sontung', service: 'massage' })
    const other = seatAndWait(twin, { idol: 'sontung', service: 'massage' })
    // on the twin the star already wants an open service, so the sale re-picks no one
    other.service = 'shampoo'
    for (const s of [sim, twin]) for (const bed of s.items.filter(i => i.kind === 'massageBed')) expect(s.sell(bed.id)).toBeNull()
    const available = sim.availableServices()
    expect(available).not.toContain('massage')
    expect(available.length).toBeGreaterThan(1)
    expect(star.service).toBe(available[0])
    expect(rngA()).toBe(rngB())
  })

  it('a star whose service is gone by the minute does not come, and the booking is dropped', () => {
    const [rngA, rngB] = [createRng(5), createRng(5)]
    const [sim, twin] = [boardShop(rngA, true), boardShop(rngB, true)]
    for (const s of [sim, twin]) for (const bed of s.items.filter(i => i.kind === 'massageBed')) expect(s.sell(bed.id)).toBeNull()
    expect(sim.availableServices()).not.toContain('massage')
    sim.idol.booking = { idol: 'sontung', day: sim.day, minute: Math.floor(sim.clock.minutes) }
    sim.drainEvents()
    sim.advance(STEP_MS)
    twin.advance(STEP_MS)
    expect(sim.customers).toEqual([])
    expect(sim.drainEvents().filter(e => e.type === 'customerArrived' || e.type === 'idolArrived')).toEqual([])
    expect(sim.idol.booking).toBeNull()
    expect(sim.idol.idols.sontung.visits).toBe(0)
    // the shop's own rng gives the same next value as the twin's, which had no booking
    expect(rngA()).toBe(rngB())
  })
})
