import { describe, expect, it } from 'vitest'
import { REGULAR_OWNER_MS, STEP_MS } from '../../src/config'
import { bookOpen, REGULARS } from '../../src/sim/regulars'
import { createRng, type Rng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import v7 from '../fixtures/save-v7.json'
import { advanceUntil, hireStaff, seatAndWait, startService } from './helpers'

const fresh = (rng: Rng = createRng(1)) => new SpaSim({ rng, autoSpawn: false })

/** A shop with massage open and one massage bed by the back wall. */
const withMassage = (rng?: Rng) => {
  const sim = fresh(rng)
  sim.money = 2_000_000
  expect(sim.openService('mask')).toBeNull()
  expect(sim.openService('massage')).toBeNull()
  expect(sim.buy('massageBed', 6, 2, false)).toBeNull()
  sim.drainEvents()
  return sim
}

/** A shop with a single shampoo bed. */
const oneBed = () => {
  const sim = fresh()
  expect(sim.sell(sim.items.filter(i => i.kind === 'bed')[1].id)).toBeNull()
  sim.drainEvents()
  return sim
}

/** A seeded rng that counts its draws. */
function counting(seed: number) {
  const rng = createRng(seed)
  const counter = { draws: 0, rng: () => (counter.draws++, rng()) }
  return counter
}

describe('regulars walking in', () => {
  it('spawns a regular with their look, kind, favourite and a first-time flag', () => {
    const r = counting(1)
    const sim = withMassage(r.rng)
    sim.book.regulars.hanh.visitAt = 600
    const before = r.draws
    const c = sim.spawnCustomer({ regular: 'hanh' })
    expect(r.draws).toBe(before)
    expect([c.regular, c.kind, c.service]).toEqual(['hanh', 'office', 'massage'])
    expect(c.look).toEqual(REGULARS.hanh.look)
    expect(c.look).not.toBe(REGULARS.hanh.look)
    expect(sim.drainEvents()).toEqual([
      { type: 'customerArrived', id: c.id },
      { type: 'regularArrived', customerId: c.id, regular: 'hanh', first: true },
    ])
    expect(sim.book.regulars.hanh).toMatchObject({ met: true, visitAt: null })
    const again = sim.spawnCustomer({ regular: 'hanh' })
    expect(sim.drainEvents()).toContainEqual({ type: 'regularArrived', customerId: again.id, regular: 'hanh', first: false })
  })

  it('gives a regular whose favourite is closed a service the shop has', () => {
    expect(fresh().spawnCustomer({ regular: 'tu' }).service).toBe('shampoo')
    const sim = withMassage()
    const c = seatAndWait(sim, { regular: 'hanh' })
    expect(c.service).toBe('massage')
    expect(sim.sell(sim.items.find(i => i.kind === 'massageBed')!.id)).toBeNull()
    expect(sim.availableServices()).toContain(c.service)
    sim.tapTile(c.seat!)
    advanceUntil(sim, () => c.state === 'inService')
  })

  it('makes a member more patient', () => {
    const sim = fresh()
    sim.book.regulars.hanh = { meetDay: 7, met: true, points: 12, hearts: 3, visitAt: null }
    const plain = sim.spawnCustomer({ kind: 'office', service: 'shampoo' })
    const member = sim.spawnCustomer({ regular: 'hanh' })
    expect(member.patienceMaxMs).toBe(plain.patienceMaxMs * 1.5)
    expect(member.patienceMs).toBe(member.patienceMaxMs)
  })
})

describe('when regulars come', () => {
  it('swaps a due regular in for the next arrival', () => {
    const sim = new SpaSim({ rng: createRng(1) })
    sim.book.regulars.hanh.visitAt = 540
    const steps: { minutes: number; events: SimEvent[] }[] = []
    let swapped = false
    while (sim.clock.minutes < 1020) {
      sim.advance(STEP_MS)
      const events = sim.drainEvents()
      steps.push({ minutes: sim.clock.minutes, events })
      if (!swapped && events.some(e => e.type === 'regularArrived')) {
        swapped = true
        expect(sim.book.regulars.hanh.visitAt).toBeNull()
      }
    }
    const arrivals = steps.filter(s => s.events.some(e => e.type === 'customerArrived'))
    const first = arrivals.find(s => s.minutes >= 540)!
    expect(arrivals.filter(s => s.minutes < 540).length).toBeGreaterThan(0)
    expect(first.events.filter(e => e.type === 'customerArrived')).toHaveLength(1)
    expect(first.events).toContainEqual(expect.objectContaining({ type: 'regularArrived', regular: 'hanh', first: true }))
    expect(steps.flatMap(s => s.events).filter(e => e.type === 'regularArrived')).toHaveLength(1)
  })

  it('lets a due regular in only when a seat is left for her', () => {
    /** A shop at 9:00 with cô Hạnh due and the next arrival half a second away. */
    const dueShop = () => {
      const data = fresh().toSave()
      data.minutes = 540
      data.untilArrivalMs = 500
      data.book.regulars.hanh.visitAt = 540
      return SpaSim.fromSave(data, { rng: createRng(1) })
    }
    /** The events up to and including the next arrival. */
    const nextArrival = (sim: SpaSim): SimEvent[] => {
      const ev: SimEvent[] = []
      advanceUntil(sim, () => ev.some(e => e.type === 'customerArrived'), 30_000, ev)
      return ev
    }
    const unmetAndDue = { met: false, visitAt: 540 }

    // every seat taken: a stranger comes instead, and she stays due
    const full = dueShop()
    for (const s of full.seats) s.customerId = 999
    const ev = nextArrival(full)
    expect(ev.some(e => e.type === 'regularArrived')).toBe(false)
    expect(full.book.regulars.hanh).toMatchObject(unmetAndDue)
    const arrived = ev.find(e => e.type === 'customerArrived')
    if (arrived?.type !== 'customerArrived') throw new Error('no arrival')
    const stranger = full.customers.find(c => c.id === arrived.id)!
    expect(stranger.regular).toBeNull()
    advanceUntil(full, () => stranger.state !== 'arriving')
    // a seat frees up: the next arrival is her
    full.seats[0].customerId = null
    expect(nextArrival(full)).toContainEqual(expect.objectContaining({ type: 'regularArrived', regular: 'hanh', first: true }))

    // the only free seat is spoken for by a stranger still walking in
    const spoken = dueShop()
    for (const s of spoken.seats.slice(1)) s.customerId = 999
    spoken.spawnCustomer()
    spoken.drainEvents()
    expect(nextArrival(spoken).some(e => e.type === 'regularArrived')).toBe(false)
    expect(spoken.book.regulars.hanh).toMatchObject(unmetAndDue)
  })

  it("adds chú Sáu's extra customer once a day", () => {
    const data = fresh().toSave()
    // no ordinary arrivals in the way
    data.untilArrivalMs = 1e9
    data.minutes = 590
    data.book.extraAt = 600
    const sim = SpaSim.fromSave(data, { rng: createRng(1) })
    const arrivedAt: number[] = []
    while (sim.clock.minutes < 700) {
      sim.advance(STEP_MS)
      for (const e of sim.drainEvents()) {
        if (e.type === 'customerArrived') arrivedAt.push(sim.clock.minutes)
        expect(e.type).not.toBe('regularArrived')
      }
    }
    expect(arrivedAt).toHaveLength(1)
    expect(arrivedAt[0]).toBeGreaterThanOrEqual(600)
    expect(sim.book.extraAt).toBeNull()
  })

  it("starts an old day-12 shop's meetings at the next morning, two days apart", () => {
    const sim = SpaSim.fromSave(parseSave({ ...structuredClone(v7), day: 12 }), { rng: createRng(1), autoSpawn: false })
    expect(bookOpen(sim.book)).toBe(false)
    sim.startDay()
    expect(sim.day).toBe(13)
    expect(sim.book.regulars.hanh.meetDay).toBe(13)
    expect(sim.book.regulars.hanh.visitAt).not.toBeNull()
    expect(sim.book.regulars.vy.meetDay).toBe(15)
  })
})

describe('hearts from a visit', () => {
  it("scores the owner's 3-star visit as a heart and the third as a member card", () => {
    const sim = fresh()
    sim.book.regulars.hanh = { meetDay: 7, met: true, points: 8, hearts: 2, visitAt: null }
    const c = startService(sim, { regular: 'hanh' })
    sim.drainEvents()
    sim.completeService(c.id, 3)
    const ev = sim.drainEvents()
    expect(ev).toContainEqual({ type: 'heart', customerId: c.id, regular: 'hanh', hearts: 3, member: true })
    expect(ev.some(e => e.type === 'gift' || e.type === 'bookPage')).toBe(false)
    expect(sim.book.regulars.hanh).toMatchObject({ points: 12, hearts: 3 })
  })

  it('scores a staff visit at half', () => {
    // skill 3: a roll of 0 is 3 stars, a roll of 0.5 is 2 stars
    const staffVisit = (roll: number): number => {
      const sim = fresh(() => roll)
      hireStaff(sim, 'technician')
      const c = seatAndWait(sim, { regular: 'hanh' })
      c.heldMs = REGULAR_OWNER_MS
      advanceUntil(sim, () => c.state === 'leaving')
      expect(sim.servingCustomerId).toBeNull()
      return sim.book.regulars.hanh.points
    }
    expect(staffVisit(0)).toBe(2)
    expect(staffVisit(0.5)).toBe(1)
  })

  it('scores a regular served after a reload once', () => {
    const sim = fresh()
    const c = startService(sim, { regular: 'hanh' })
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(1), autoSpawn: false })
    expect(copy.customers.find(x => x.id === c.id)?.regular).toBe('hanh')
    expect(copy.book.regulars.hanh.points).toBe(0)
    copy.completeService(c.id, 3)
    copy.completeService(c.id, 3)
    expect(copy.book.regulars.hanh.points).toBe(4)
  })

  it('pays a money gift into the day and the profit', () => {
    const sim = fresh()
    sim.book.regulars.khoa = { meetDay: 13, met: true, points: 16, hearts: 4, visitAt: null }
    const c = startService(sim, { regular: 'khoa' })
    sim.drainEvents()
    const before = sim.money
    sim.completeService(c.id, 3)
    const ev = sim.drainEvents()
    const paid = ev.find(e => e.type === 'paid')
    if (paid?.type !== 'paid') throw new Error('no payment')
    expect(sim.money).toBe(before + paid.amount + paid.tip + 300_000)
    expect(sim.stats.gifts).toBe(300_000)
    expect(ev).toContainEqual({ type: 'gift', customerId: c.id, regular: 'khoa', gift: { kind: 'money', amount: 300_000 } })
  })

  it('takes points for a walk-out but never a heart', () => {
    const sim = fresh()
    sim.book.regulars.hanh = { meetDay: 7, met: true, points: 13, hearts: 3, visitAt: null }
    const c = seatAndWait(sim, { regular: 'hanh' })
    c.patienceMs = 1
    advanceUntil(sim, () => c.mood === 'angry')
    expect(sim.book.regulars.hanh).toMatchObject({ points: 12, hearts: 3 })
    // turned away for lack of a seat: nothing changes, they come another day
    sim.book.regulars.hanh.points = 13
    for (const s of sim.seats) s.customerId = 999
    const d = sim.spawnCustomer({ regular: 'hanh' })
    advanceUntil(sim, () => d.state === 'leaving')
    expect(sim.book.regulars.hanh.points).toBe(13)
  })

  it('notes every customer served by kind', () => {
    const sim = fresh()
    sim.completeService(startService(sim).id, 3)
    sim.completeService(startService(sim, { kind: 'student', service: 'shampoo' }).id, 1)
    sim.completeService(startService(sim, { regular: 'ba' }).id, 2)
    expect(sim.book.served).toEqual({ student: 1, office: 1, picky: 0, elder: 1, celeb: 0 })
    expect(sim.book.kindsMet).toEqual(['office', 'student', 'elder'])
  })
})

describe('the owner window', () => {
  it('staff wait 10 s of free-bed time before fetching a regular', () => {
    // a free bed from the moment the regular sits down
    const sim = oneBed()
    const tech = hireStaff(sim, 'technician')
    const c = seatAndWait(sim, { regular: 'hanh' })
    sim.advance(9_900 - c.heldMs)
    expect(c.heldMs).toBe(9_900)
    expect(tech.task).toBeNull()
    sim.advance(200)
    expect(tech.task).toEqual({ kind: 'fetch', customerId: c.id })

    // the only bed busy with another customer: the window does not run down until it frees
    const busy = oneBed()
    const slow = hireStaff(busy, 'technician', { skill: 3, speed: 1, friendly: 3, stamina: 3 })
    const other = seatAndWait(busy)
    advanceUntil(busy, () => other.state === 'inService')
    const r = seatAndWait(busy, { regular: 'hanh' })
    let busyMs = 0
    while (busy.stations[0].customerId !== null) {
      expect(r.heldMs).toBe(0)
      busy.advance(STEP_MS)
      busyMs += STEP_MS
    }
    expect(busyMs).toBeGreaterThan(15_000)
    expect([r.state, r.heldMs]).toEqual(['waiting', 0])
    busy.advance(9_900)
    expect(slow.task).toBeNull()
    busy.advance(200)
    expect(slow.task).toEqual({ kind: 'fetch', customerId: r.id })

    // the owner can take a regular at any time
    const own = oneBed()
    hireStaff(own, 'technician')
    const mine = seatAndWait(own, { regular: 'hanh' })
    expect(mine.heldMs).toBeLessThan(REGULAR_OWNER_MS)
    own.tapTile(mine.seat!)
    expect(own.owner.task).toEqual({ kind: 'fetch', customerId: mine.id })
    advanceUntil(own, () => mine.state === 'inService')
    expect(own.servingCustomerId).toBe(mine.id)
  })

  it("keeps a regular's place: nobody who came after her takes her service's bed in her window", () => {
    const setup = () => {
      const sim = oneBed()
      const tech = hireStaff(sim, 'technician')
      const first = seatAndWait(sim)
      advanceUntil(sim, () => first.state === 'inService')
      return { sim, tech, first }
    }
    const { sim, tech, first } = setup()
    const reg = seatAndWait(sim, { regular: 'hanh' })
    const stranger = seatAndWait(sim)
    expect(stranger.stateMs).toBeLessThanOrEqual(reg.stateMs)
    advanceUntil(sim, () => sim.stations[0].customerId === null)
    // the bed is free and the regular is in her window: the stranger who came later does not take it
    for (let ms = 0; ms < 9_000 && reg.heldMs < REGULAR_OWNER_MS - 200; ms += 100) {
      sim.advance(100)
      expect(stranger.state).toBe('waiting')
      expect(tech.task?.kind === 'fetch' && tech.task.customerId === stranger.id).toBe(false)
    }
    advanceUntil(sim, () => tech.task?.kind === 'fetch')
    expect(tech.task).toEqual({ kind: 'fetch', customerId: reg.id })

    // a stranger who wants another service is fetched at once
    const other = withMassage()
    const t2 = hireStaff(other, 'technician')
    const r2 = seatAndWait(other, { regular: 'hanh', service: 'shampoo' })
    const m = seatAndWait(other, { kind: 'office', service: 'massage' })
    advanceUntil(other, () => t2.task !== null)
    expect(t2.task).toEqual({ kind: 'fetch', customerId: m.id })
    expect(r2.state).toBe('waiting')
  })
})
