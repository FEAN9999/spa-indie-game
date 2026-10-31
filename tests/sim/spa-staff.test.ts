import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { DAY_END_MIN, DAY_START_MIN, LATE_MIN, OWNER_START, PATIENCE_MS, REGULAR_OWNER_MS, STAFF_REST_MS } from '../../src/config'
import { homeOf, type CrewHost } from '../../src/sim/crew'
import { dayEase, reviewScore, tipFor } from '../../src/sim/economy'
import { isWalkable, manhattan, tileEq } from '../../src/sim/grid'
import { footprint } from '../../src/sim/items'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import { courses, greetPatience, serviceMs, tipFactor, workMs } from '../../src/sim/staff'
import type { Customer, SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff, seatAndWait, startService } from './helpers'

const newSim = () => new SpaSim({ rng: createRng(5), autoSpawn: false })

describe('hiring', () => {
  it('offers three new candidates each morning from day 3', () => {
    const sim = newSim()
    sim.startDay()
    expect([sim.day, sim.candidates.length, sim.candidatesDay]).toEqual([2, 0, 0])
    sim.startDay()
    expect([sim.day, sim.candidates.length, sim.candidatesDay]).toEqual([3, 3, 3])
    expect(new Set(sim.candidates.map(c => c.name)).size).toBe(3)
    const hired = sim.candidates[0].name
    expect(sim.hire(0)).toBeNull()
    sim.startDay()
    expect(sim.candidates.map(c => c.name)).not.toContain(hired)
    expect(new Set(sim.candidates.map(c => c.name)).size).toBe(3)
  })

  it('hires at once and for free', () => {
    const sim = newSim()
    sim.startDay()
    sim.startDay()
    const name = sim.candidates[1].name
    const money = sim.money
    expect(sim.hire(1)).toBeNull()
    expect(sim.money).toBe(money)
    expect(sim.candidates).toHaveLength(2)
    expect(sim.staff).toHaveLength(1)
    const s = sim.staff[0]
    expect([s.name, s.id, s.level, s.xp, s.sinceRest, s.leaving, s.task]).toEqual([name, 1, 1, 0, 0, false, null])
    expect(s.pos).toEqual(sim.grid.door)
    expect(s.facing).toBe('up')
  })

  it('refuses a second receptionist and a fourth technician', () => {
    const sim = newSim()
    hireStaff(sim, 'receptionist')
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    for (const role of ['receptionist', 'technician'] as const) {
      sim.candidates.push({ ...sim.staff.find(s => s.role === role)!, name: 'Extra' })
      expect(sim.hire(sim.candidates.length - 1)).toBe('full')
    }
    sim.staff[0].leaving = true
    expect(sim.hire(sim.candidates.length - 2)).toBeNull()
  })

  it('refuses to hire or buy while money is negative', () => {
    const sim = newSim()
    sim.startDay()
    sim.startDay()
    sim.money = -1
    expect(sim.hire(0)).toBe('money')
    expect(sim.buy('plant', 18, 9, false)).toBe('money')
    expect(sim.staff).toHaveLength(0)
  })
})

const dayThree = () => {
  const sim = newSim()
  sim.day = 3
  return sim
}

/** Spawns a customer and waits until they sit; the next one is spawned only after this returns. */
const seated = (sim: SpaSim, n: number): Customer[] => Array.from({ length: n }, () => seatAndWait(sim))

/** Day three with mask and massage open, a bed for each and a second shampoo bed already there. */
const withBeds = () => {
  const sim = dayThree()
  sim.money = 3_000_000
  expect(sim.openService('mask')).toBeNull()
  expect(sim.openService('massage')).toBeNull()
  expect(sim.buy('maskBed', 18, 2, false)).toBeNull()
  expect(sim.buy('massageBed', 20, 2, false)).toBeNull()
  sim.drainEvents()
  return sim
}

const fetchedBy = (s: { task: unknown }) => (s.task as { kind: string; customerId: number } | null)?.customerId

describe('technicians and their tiers', () => {
  it('serves a tiered service in the shorter time', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician', undefined, { shampoo: 2 })
    const c = seatAndWait(sim)
    advanceUntil(sim, () => tech.task?.kind === 'serve')
    expect(c.state).not.toBe('leaving')
    const task = tech.task as { totalMs: number }
    expect(task.totalMs).toBe(serviceMs(tech, 'shampoo'))
    expect(task.totalMs).toBeLessThan(workMs(tech.stats.speed))
  })

  it('rolls stars with the tier of the service served', () => {
    const threes = (tier: number): number => {
      const sim = dayThree()
      hireStaff(sim, 'technician', { skill: 1, speed: 3, friendly: 3, stamina: 3 }, { shampoo: tier })
      for (let i = 0; i < 20; i++) {
        sim.startDay()
        const c = seatAndWait(sim)
        advanceUntil(sim, () => c.state === 'leaving')
      }
      return sim.reviews.filter(r => r === reviewScore(3)).length
    }
    expect(threes(3)).toBeGreaterThan(threes(0))
  })

  it('prefers the service of her highest tier', () => {
    const sim = withBeds()
    seatAndWait(sim)
    const mask = seatAndWait(sim, { kind: 'office', service: 'mask' })
    const tech = hireStaff(sim, 'technician', undefined, { mask: 1 })
    sim.advance(300)
    expect(fetchedBy(tech)).toBe(mask.id)
  })

  it('takes the longest wait when no customer is of her specialty', () => {
    const sim = withBeds()
    const first = seatAndWait(sim)
    seatAndWait(sim, { kind: 'office', service: 'mask' })
    const tech = hireStaff(sim, 'technician', undefined, { massage: 1 })
    sim.advance(300)
    expect(fetchedBy(tech)).toBe(first.id)
  })

  it('fetches a customer past half her patience first, specialty or not', () => {
    const sim = withBeds()
    const mask = seatAndWait(sim, { kind: 'office', service: 'mask' })
    const shampoo = seatAndWait(sim)
    shampoo.patienceMs = shampoo.patienceMaxMs / 2 - 1
    const tech = hireStaff(sim, 'technician', undefined, { mask: 2 })
    sim.advance(300)
    expect(fetchedBy(tech)).toBe(shampoo.id)
    expect(mask.state).toBe('waiting')

    // two past half: the longer wait goes first
    const both = withBeds()
    const early = seatAndWait(both)
    const late = seatAndWait(both, { kind: 'office', service: 'mask' })
    for (const c of [early, late]) c.patienceMs = c.patienceMaxMs / 2 - 1
    const t2 = hireStaff(both, 'technician', undefined, { mask: 2 })
    both.advance(300)
    expect(fetchedBy(t2)).toBe(early.id)
  })

  it("keeps the regular's owner window and the VIP hold over a specialty", () => {
    const sim = withBeds()
    const reg = seatAndWait(sim, { regular: 'hanh' })
    expect(reg.service).toBe('massage')
    reg.patienceMs = reg.patienceMaxMs / 2 - 1
    const tech = hireStaff(sim, 'technician', undefined, { massage: 2 })
    sim.advance(REGULAR_OWNER_MS / 2)
    expect(reg.heldMs).toBeLessThan(REGULAR_OWNER_MS)
    expect(tech.task).toBeNull()

    const vipShop = withBeds()
    const office = vipShop.spawnCustomer({ kind: 'office', service: 'mask' })
    const miss = vipShop.spawnCustomer({ vip: 'miss' })
    expect(miss.service).toBe('mask')
    const t2 = hireStaff(vipShop, 'technician', undefined, { mask: 3 })
    advanceUntil(vipShop, () => office.state === 'waiting' && miss.state === 'waiting')
    office.patienceMs = office.patienceMaxMs / 2 - 1
    vipShop.advance(3_000)
    expect(t2.task).toBeNull()
  })
})

describe('hire problems', () => {
  it('tells why a candidate cannot be hired without hiring them', () => {
    const sim = newSim()
    sim.startDay()
    sim.startDay()
    expect(sim.hireProblem(0)).toBeNull()
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    sim.candidates.push({ ...sim.staff[0], name: 'Extra' })
    expect(sim.hireProblem(sim.candidates.length - 1)).toBe('full')
    sim.money = -1
    expect(sim.hireProblem(0)).toBe('money')
    expect(sim.staff).toHaveLength(3)
  })
})

describe('technicians at work', () => {
  it('walks in and serves the customer who has waited longest', () => {
    const sim = dayThree()
    const [a, b] = seated(sim, 2)
    const tech = hireStaff(sim, 'technician')
    const ev: SimEvent[] = []
    advanceUntil(sim, () => a.state === 'inService', 60_000, ev)
    expect(tech.task).toMatchObject({ kind: 'serve', customerId: a.id })
    expect(b.state).toBe('waiting')
    expect(sim.servingCustomerId).toBeNull()
    let ms = 0
    while (!ev.some(e => e.type === 'paid') && ms < 120_000) {
      sim.advance(100)
      ms += 100
      ev.push(...sim.drainEvents())
    }
    expect(Math.abs(ms - workMs(3))).toBeLessThanOrEqual(200)
    expect(ev).toContainEqual(expect.objectContaining({ type: 'paid', customerId: a.id, amount: 20_000 }))
    expect(sim.stats.served).toBe(1)
    expect(a.state).toBe('leaving')
    expect(sim.stations[0].customerId).toBeNull()
    expect(tech.task?.kind).not.toBe('serve') // free again: she may already be on her way to b
  })

  it('serves on a bed lying across the floor, from the work tile behind it', () => {
    const sim = dayThree()
    sim.money = 2_000_000
    expect(sim.buy('bed', 16, 9, false, true)).toBeNull()
    for (const s of sim.stations) if (s.id !== 17) s.customerId = 999
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician')
    const ev: SimEvent[] = []
    advanceUntil(sim, () => a.state === 'inService', 60_000, ev)
    expect(a.stationId).toBe(17)
    expect([tileOf(a), tileOf(tech)]).toEqual([{ x: 17, y: 9 }, { x: 17, y: 8 }])
    advanceUntil(sim, () => ev.some(e => e.type === 'paid'), 120_000, ev)
    expect(ev).toContainEqual(expect.objectContaining({ type: 'paid', customerId: a.id }))
  })

  it('pays a tip that matches the review stars', () => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician', { skill: 3, speed: 5, friendly: 5, stamina: 3 })
    const ev: SimEvent[] = []
    advanceUntil(sim, () => ev.some(e => e.type === 'paid'), 60_000, ev)
    const paid = ev.find(e => e.type === 'paid' && e.customerId === a.id)
    const review = ev.find(e => e.type === 'review' && e.customerId === a.id)
    if (paid?.type !== 'paid' || review?.type !== 'review') throw new Error('no payment')
    expect(paid.tip).toBe(Math.round(tipFor(20_000, (review.score - 2) as 1 | 2 | 3) * tipFactor(0, tech.stats.friendly)))
  })

  it('never takes the customer the owner tapped', () => {
    const sim = dayThree()
    const [a, b] = seated(sim, 2)
    sim.tapTile(a.seat!)
    const tech = hireStaff(sim, 'technician')
    sim.advance(300)
    expect(tech.task).toEqual({ kind: 'fetch', customerId: b.id })
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.servingCustomerId !== null, 60_000, ev)
    expect(ev).toContainEqual(expect.objectContaining({ type: 'serviceReady', customerId: a.id }))
  })

  it('lets the owner take a customer a technician is walking to', () => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => tech.task?.kind === 'fetch')
    expect(tech.task).toEqual({ kind: 'fetch', customerId: a.id })
    sim.tapTile(a.seat!)
    expect(sim.owner.task).toEqual({ kind: 'fetch', customerId: a.id })
    expect(tech.task).toBeNull()
    expect(tech.path).toEqual([])
  })

  it('gives the owner the last free bed when a technician is on the way to someone else', () => {
    const sim = dayThree()
    sim.money = 2_000_000
    expect(sim.buy('bed', 18, 2, false)).toBeNull()
    const free = sim.stations[2]
    for (const s of sim.stations) if (s !== free) s.customerId = 999
    const [a, b] = seated(sim, 2)
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => tech.task?.kind === 'fetch')
    expect(tech.task).toEqual({ kind: 'fetch', customerId: a.id })
    sim.drainEvents()
    sim.tapTile(b.seat!)
    expect(sim.owner.task).toEqual({ kind: 'fetch', customerId: b.id })
    expect(tech.task).toBeNull()
    const ev: SimEvent[] = []
    advanceUntil(sim, () => b.state === 'inService', 60_000, ev)
    expect(b.stationId).toBe(free.id)
    expect(ev).not.toContainEqual({ type: 'toast', key: 'stationsBusy' })
  })

  it('waits when every free bed is spoken for', () => {
    const sim = dayThree()
    const [a, b, c] = seated(sim, 3)
    sim.tapTile(a.seat!)
    const first = hireStaff(sim, 'technician')
    const second = hireStaff(sim, 'technician')
    sim.advance(300)
    expect(first.task).toEqual({ kind: 'fetch', customerId: b.id })
    expect(second.task).toBeNull()
    advanceUntil(sim, () => sim.servingCustomerId !== null)
    expect(second.task).toBeNull()
    sim.completeService(a.id, 3)
    advanceUntil(sim, () => second.task?.kind === 'fetch' && second.task.customerId === c.id)
  })

  it.each([
    [1, 24_000],
    [5, 12_000],
  ])('works for the time its speed %i gives', (speed, expected) => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    hireStaff(sim, 'technician', { skill: 3, speed, friendly: 3, stamina: 3 })
    advanceUntil(sim, () => a.state === 'inService')
    sim.drainEvents()
    let ms = 0
    while (!sim.drainEvents().some(e => e.type === 'paid') && ms < 120_000) {
      sim.advance(100)
      ms += 100
    }
    expect(Math.abs(ms - expected)).toBeLessThanOrEqual(100)
  })

  it('stands still while the owner plays', () => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician', { skill: 3, speed: 1, friendly: 3, stamina: 3 })
    advanceUntil(sim, () => a.state === 'inService')
    const b = seatAndWait(sim)
    sim.tapTile(b.seat!)
    advanceUntil(sim, () => sim.servingCustomerId !== null)
    expect(tech.task?.kind).toBe('serve')
    const before = JSON.stringify([tech.task, tech.pos])
    sim.advance(10_000)
    expect(JSON.stringify([tech.task, tech.pos])).toBe(before)
  })
})

describe('the receptionist', () => {
  it('stands behind the desk and greets each new customer', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist', { skill: 3, speed: 3, friendly: 3, stamina: 3 })
    const early = sim.spawnCustomer()
    expect(early.greet).toBe(0)
    advanceUntil(sim, () => rec.task === null && rec.path.length === 0 && tileEq(rec.pos, sim.receptionSpot()))
    const spot = sim.receptionSpot()
    expect(tileEq(spot, OWNER_START)).toBe(false)
    expect(sim.grid.desks.some(d => Math.abs(d.x - spot.x) + Math.abs(d.y - spot.y) === 1)).toBe(true)
    sim.drainEvents()
    const c = sim.spawnCustomer({ kind: 'office', service: 'shampoo' })
    const patience = Math.round(PATIENCE_MS * dayEase(3).patience * greetPatience(3) * 0.8)
    expect([c.greet, c.patienceMs, c.patienceMaxMs]).toEqual([3, patience, patience])
    expect(sim.drainEvents()).toContainEqual({ type: 'greeted', staffId: rec.id, customerId: c.id })
  })

  it('makes a greeted customer tip the owner more', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist', { skill: 3, speed: 3, friendly: 4, stamina: 3 })
    advanceUntil(sim, () => rec.path.length === 0)
    const c = startService(sim)
    expect(c.greet).toBe(4)
    sim.drainEvents()
    sim.completeService(c.id, 3)
    expect(sim.drainEvents()).toContainEqual(expect.objectContaining({ type: 'paid', tip: 6_000 }))
  })

  it('waits at the desk facing the door', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist')
    advanceUntil(sim, () => rec.path.length === 0 && tileEq(rec.pos, sim.receptionSpot()))
    expect(rec.facing).toBe('down')
  })
})

describe('homes', () => {
  it('no technician waits right behind the owner, the receptionist or another technician', () => {
    const sim = dayThree()
    hireStaff(sim, 'receptionist')
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    sim.startDay()
    const spot = sim.receptionSpot()
    const techs = sim.staff.filter(s => s.role === 'technician')
    for (const s of techs) {
      expect(tileEq(s.pos, { x: OWNER_START.x, y: OWNER_START.y - 1 })).toBe(false)
      expect(tileEq(s.pos, { x: spot.x, y: spot.y - 1 })).toBe(false)
    }
    const people = [sim.owner.pos, ...sim.staff.map(s => s.pos)]
    expect(new Set(people.map(p => `${p.x},${p.y}`)).size).toBe(people.length)
    // one tile straight above someone is hidden behind them
    for (const a of people) for (const b of people) expect(a.x === b.x && a.y === b.y - 1).toBe(false)
  })

  it('an idle technician back home faces the door', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => tech.path.length === 0)
    expect([tech.task, tech.facing]).toEqual([null, 'down'])
  })
})

const tired = () => ({ skill: 3, speed: 5, friendly: 3, stamina: 1 })

const tileOf = (m: { pos: { x: number; y: number } }) => ({ x: Math.round(m.pos.x), y: Math.round(m.pos.y) })

/** Tiles of every towel cabinet. */
const cabinetTiles = (sim: SpaSim) => sim.items.filter(i => i.kind === 'cabinet').flatMap(footprint)

const served = (c: Customer) => c.state === 'leaving' || c.state === 'exiting'

describe('rest', () => {
  it('a tired technician rests by the towel cabinet for one game hour, then works again', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician', tired())
    for (const c of seated(sim, 3)) advanceUntil(sim, () => served(c), 90_000)
    expect(sim.stats.served).toBe(3)
    expect(tech.task?.kind).toBe('rest')
    advanceUntil(sim, () => tech.path.length === 0)
    expect(cabinetTiles(sim).some(c => manhattan(c, tileOf(tech)) === 1)).toBe(true)
    expect(tech.task).toMatchObject({ kind: 'rest' })
    expect((tech.task as { leftMs: number }).leftMs).toBeGreaterThan(STAFF_REST_MS - 1_000)
    const next = seatAndWait(sim)
    sim.advance((tech.task as { leftMs: number }).leftMs - 1_000)
    expect(next.state).toBe('waiting')
    expect(tech.task?.kind).toBe('rest')
    advanceUntil(sim, () => tech.task?.kind === 'fetch', 5_000)
    expect(tech.sinceRest).toBe(0)
  })

  it('with no towel cabinet a tired technician rests where they stand', () => {
    const sim = dayThree()
    for (const i of sim.items.filter(x => x.kind === 'cabinet')) expect(sim.sell(i.id)).toBeNull()
    const tech = hireStaff(sim, 'technician', tired())
    for (const c of seated(sim, 3)) advanceUntil(sim, () => served(c), 90_000)
    expect(tech.task?.kind).toBe('rest')
    expect(tech.path).toEqual([])
    const spot = tileOf(tech)
    sim.advance(5_000)
    expect(tileOf(tech)).toEqual(spot)
  })

  it('the receptionist rests after twice as many greetings', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist', tired())
    const atSpot = () => rec.task === null && rec.path.length === 0 && tileEq(rec.pos, sim.receptionSpot())
    advanceUntil(sim, atSpot)
    for (let i = 0; i < 5; i++) sim.spawnCustomer()
    expect(rec.task).toBeNull()
    sim.spawnCustomer()
    expect(rec.task?.kind).toBe('rest')
    expect(sim.spawnCustomer().greet).toBe(0)
    advanceUntil(sim, () => rec.task === null, 60_000)
    advanceUntil(sim, atSpot)
    expect(rec.sinceRest).toBe(0)
    expect(sim.spawnCustomer().greet).toBe(rec.stats.friendly)
  })
})

describe('levels and wages', () => {
  const closeDay = (sim: SpaSim): SimEvent[] => {
    sim.clock.minutes = DAY_END_MIN
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.dayOver, 5_000, ev)
    ev.push(...sim.drainEvents())
    return ev
  }

  it('each customer earns experience', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician', undefined, {}, 'calm')
    tech.xp = 2
    const wage = tech.wage
    seated(sim, 1)
    const ev: SimEvent[] = []
    advanceUntil(sim, () => ev.some(e => e.type === 'levelUp'), 60_000, ev)
    expect(ev).toContainEqual({ type: 'levelUp', staffId: tech.id, level: 2 })
    expect(tech.wage).toBe(wage + 2500)
  })

  it('wages are taken when the day ends', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician')
    const money = sim.money
    const ended = closeDay(sim).find(e => e.type === 'dayEnded')
    if (ended?.type !== 'dayEnded') throw new Error('no dayEnded')
    expect(ended.stats.wages).toBe(tech.wage)
    expect(sim.money).toBe(money - tech.wage)
  })

  it('a shop with no staff pays no wages', () => {
    const sim = dayThree()
    const money = sim.money
    closeDay(sim)
    expect([sim.stats.wages, sim.money]).toEqual([0, money])
  })

  it('money below zero does not stop the shop', () => {
    const sim = dayThree()
    sim.money = 10_000
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    closeDay(sim)
    expect(sim.money).toBeLessThan(0)
    sim.startDay()
    const c = seatAndWait(sim)
    const before = sim.money
    advanceUntil(sim, () => served(c), 90_000)
    expect(sim.money).toBeGreaterThan(before)
    sim.candidates.push({ ...sim.staff[0], name: 'Extra', role: 'receptionist' })
    expect(sim.hire(sim.candidates.length - 1)).toBe('money')
    sim.money = 0
    expect(sim.hire(sim.candidates.length - 1)).toBeNull()
  })

  it('each new day starts with staff at home and rested', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist')
    const techs = [hireStaff(sim, 'technician'), hireStaff(sim, 'technician')]
    for (const s of sim.staff) {
      s.pos = { x: 13, y: 8 }
      s.path = [{ x: 14, y: 8 }]
      s.task = { kind: 'rest', leftMs: 100 }
      s.sinceRest = 4
      s.facing = 'left'
    }
    sim.startDay()
    expect(tileEq(rec.pos, sim.receptionSpot())).toBe(true)
    expect(tileEq(techs[0].pos, techs[1].pos)).toBe(false)
    for (const s of sim.staff) expect([s.task, s.sinceRest, s.path, s.facing]).toEqual([null, 0, [], 'down'])
  })
})

describe('letting go', () => {
  it('lets a technician finish the customer on the bed, then leave', () => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => a.state === 'inService')
    const wage = tech.wage
    sim.fire(tech.id)
    expect(tech.leaving).toBe(true)
    expect(tech.task?.kind).toBe('serve')
    const ev: SimEvent[] = []
    advanceUntil(sim, () => ev.some(e => e.type === 'paid'), 60_000, ev)
    expect(tech.task?.kind).toBe('exit')
    advanceUntil(sim, () => sim.staff.length === 0, 30_000)
    expect(sim.stats.wages).toBe(wage)
    const money = sim.money
    sim.clock.minutes = DAY_END_MIN
    advanceUntil(sim, () => sim.dayOver, 120_000)
    expect(sim.stats.wages).toBe(wage)
    expect(sim.money).toBe(money - wage)
  })

  it('lets an idle or fetching staff member go at once', () => {
    const sim = dayThree()
    const idle = hireStaff(sim, 'technician')
    sim.fire(idle.id)
    expect(idle.task?.kind).toBe('exit')
    advanceUntil(sim, () => sim.staff.length === 0, 30_000)

    const [a] = seated(sim, 1)
    const fetcher = hireStaff(sim, 'technician')
    advanceUntil(sim, () => fetcher.task?.kind === 'fetch')
    sim.fire(fetcher.id)
    expect(fetcher.task?.kind).toBe('exit')
    advanceUntil(sim, () => sim.staff.length === 0, 30_000)
    expect(a.state).toBe('waiting')
    expect(sim.stats.wages).toBe(idle.wage + fetcher.wage)
  })

  it('frees the bed when the customer of a serve task has gone', () => {
    const sim = dayThree()
    const [a] = seated(sim, 1)
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => a.state === 'inService')
    sim.customers = sim.customers.filter(c => c !== a)
    sim.advance(100)
    expect(tech.task).toBeNull()
    expect(sim.stations[0].customerId).toBeNull()
  })
})

describe('moved furniture', () => {
  it('moves a staff member aside when furniture is dropped on them', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => tech.path.length === 0)
    const t = tileOf(tech)
    expect(sim.buy('plant', t.x, t.y, false)).toBeNull()
    expect(isWalkable(sim.grid, tileOf(tech))).toBe(true)
    const c = seatAndWait(sim)
    const money = sim.money
    advanceUntil(sim, () => served(c), 90_000)
    expect(sim.money).toBeGreaterThan(money)
  })
})

describe('studying', () => {
  const stats = { skill: 3, speed: 3, friendly: 4, stamina: 3 }
  const reload = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(2), autoSpawn: false })
  const maskShop = () => {
    const sim = dayThree()
    sim.money = 500_000
    sim.services = ['shampoo', 'mask']
    return sim
  }

  it('takes the tuition at once and books the course', () => {
    const sim = maskShop()
    const tech = hireStaff(sim, 'technician', stats, { mask: 1 }, 'calm')
    const costs = { ...sim.stats }
    expect(sim.study(tech.id, 'mask')).toBeNull()
    expect(sim.money).toBe(200_000)
    expect(tech.study).toEqual({ course: 'mask', paid: 300_000 })
    expect(sim.stats).toEqual(costs)
  })

  it('refuses a second course the same night, an unoffered course and too little money', () => {
    const sim = maskShop()
    const tech = hireStaff(sim, 'technician', stats, { mask: 1, shampoo: 3 }, 'calm')
    expect(sim.study(tech.id, 'mask')).toBeNull()
    expect(sim.studyProblem(tech.id, 'mask')).toBe('booked')
    expect(sim.study(tech.id, 'mask')).toBe('booked')
    expect(sim.study(tech.id, 'massage')).toBe('course')
    expect(sim.study(tech.id, 'shampoo')).toBe('course')
    expect(sim.study(99, 'mask')).toBe('course')

    const poor = hireStaff(sim, 'technician', stats, {}, 'calm')
    const money = sim.money
    sim.money = 149_000
    expect(sim.studyProblem(poor.id, 'mask')).toBe('money')
    expect(sim.study(poor.id, 'mask')).toBe('money')
    sim.money = -5000
    expect(sim.study(poor.id, 'mask')).toBe('money')
    expect(poor.study).toBeNull()
    expect(sim.money).toBe(-5000)
    sim.money = money

    const leaver = hireStaff(sim, 'technician', stats, {}, 'calm')
    leaver.leaving = true
    expect(sim.studyProblem(leaver.id, 'mask')).toBe('course')
    expect(sim.study(leaver.id, 'mask')).toBe('course')
    expect(leaver.study).toBeNull()
    expect(sim.money).toBe(money)
  })

  it('raises the tier when the next day starts, once', () => {
    const sim = maskShop()
    const tech = hireStaff(sim, 'technician', stats, { mask: 1 }, 'calm')
    sim.study(tech.id, 'mask')
    advanceUntil(sim, () => sim.dayOver, 400_000)
    expect(tech.tiers.mask).toBe(1)
    sim.drainEvents()
    sim.startDay()
    expect(tech.tiers.mask).toBe(2)
    expect(tech.study).toBeNull()
    expect(sim.drainEvents()).toContainEqual({ type: 'studied', staffId: tech.id, course: 'mask', level: 2 })
    sim.startDay()
    expect(tech.tiers.mask).toBe(2)
    expect(sim.drainEvents().some(e => e.type === 'studied')).toBe(false)
  })

  it("raises a receptionist's friendliness, never past 5", () => {
    const sim = maskShop()
    const r = hireStaff(sim, 'receptionist', stats)
    const wage = r.wage
    expect(sim.study(r.id, 'greet')).toBeNull()
    advanceUntil(sim, () => sim.dayOver, 400_000)
    sim.startDay()
    expect(r.stats.friendly).toBe(5)
    expect(r.wage).toBe(wage)
    expect(sim.drainEvents()).toContainEqual({ type: 'studied', staffId: r.id, course: 'greet', level: 5 })
    expect(courses(r, sim.services)).toEqual([])
  })

  it('gives the tuition back when the receptionist reached 5 friendly meanwhile', () => {
    const sim = maskShop()
    const r = hireStaff(sim, 'receptionist', { skill: 3, speed: 3, friendly: 4, stamina: 3 })
    const before = sim.money
    expect(sim.study(r.id, 'greet')).toBeNull()
    const paid = before - sim.money
    expect(paid).toBeGreaterThan(0)
    r.stats.friendly = 5
    advanceUntil(sim, () => sim.dayOver, 400_000)
    sim.drainEvents()
    const money = sim.money
    sim.startDay()
    expect(sim.money).toBe(money + paid)
    expect(r.stats.friendly).toBe(5)
    expect(r.study).toBeNull()
    const events = sim.drainEvents()
    expect(events.some(e => e.type === 'studied')).toBe(false)
    expect(events.filter(e => e.type === 'studyRefunded')).toEqual([{ type: 'studyRefunded', staffId: r.id, amount: paid }])
  })

  it('gives the tuition back for a technician already at tier 3', () => {
    const sim = maskShop()
    const tech = hireStaff(sim, 'technician', stats, { mask: 3 })
    tech.study = { course: 'mask', paid: 400_000 }
    advanceUntil(sim, () => sim.dayOver, 400_000)
    sim.drainEvents()
    const money = sim.money
    sim.startDay()
    expect(sim.money).toBe(money + 400_000)
    expect(tech.tiers.mask).toBe(3)
    expect(tech.study).toBeNull()
    const events = sim.drainEvents()
    expect(events.some(e => e.type === 'studied')).toBe(false)
    expect(events.filter(e => e.type === 'studyRefunded')).toEqual([{ type: 'studyRefunded', staffId: tech.id, amount: 400_000 }])
  })

  it('keeps a booked course through a reload in the middle of the day', () => {
    const sim = maskShop()
    const tech = hireStaff(sim, 'technician', stats, { mask: 1 }, 'calm')
    sim.study(tech.id, 'mask')
    const copy = reload(sim)
    expect(copy.staff[0].tiers.mask).toBe(1)
    expect(copy.staff[0].study).toEqual({ course: 'mask', paid: 300_000 })
    advanceUntil(copy, () => copy.dayOver, 400_000)
    copy.startDay()
    expect(copy.staff[0].tiers.mask).toBe(2)
  })

  it('applies a course booked before the summary save once', () => {
    const sim = maskShop()
    const tech = hireStaff(sim, 'technician', stats, { mask: 1 })
    sim.study(tech.id, 'mask')
    advanceUntil(sim, () => sim.dayOver, 400_000)
    const copy = reload(sim)
    expect(copy.staff[0].tiers.mask).toBe(1)
    copy.startDay()
    expect(copy.staff[0].tiers.mask).toBe(2)
    copy.startDay()
    expect(copy.staff[0].tiers.mask).toBe(2)
  })

  it('refunds the tuition when a booked person is let go', () => {
    const sim = maskShop()
    const tech = hireStaff(sim, 'technician', stats, { mask: 1 }, 'calm')
    sim.study(tech.id, 'mask')
    sim.money = -50_000
    sim.fire(tech.id)
    expect(sim.money).toBe(250_000)
    expect(tech.study).toBeNull()

    const other = hireStaff(sim, 'technician', stats, { mask: 1 }, 'calm')
    advanceUntil(sim, () => sim.dayOver, 400_000)
    sim.money = 500_000
    sim.study(other.id, 'mask')
    expect(sim.money).toBe(200_000)
    sim.fire(other.id)
    expect(sim.money).toBe(500_000)
    expect(sim.staff.some(s => s.id === other.id)).toBe(false)
  })

  it("does not count tuition in the day's costs", () => {
    const sim = maskShop()
    const tech = hireStaff(sim, 'technician', stats, { mask: 1 })
    sim.study(tech.id, 'mask')
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.dayOver, 400_000, ev)
    ev.push(...sim.drainEvents())
    expect(sim.stats.wages).toBe(tech.wage)
    const ended = ev.find(e => e.type === 'dayEnded')
    expect(ended?.type === 'dayEnded' && ended.stats.wages).toBe(tech.wage)
  })
})

describe('personality in the shop', () => {
  type Payer = { payFor(c: Customer, station: unknown, stars: 1 | 2 | 3, tech: unknown): void }
  const serve = (trait: 'jolly' | 'diligent' | 'calm', kind: 'office' | 'picky', stars: 1 | 2 | 3) => {
    const sim = dayThree()
    const c = seatAndWait(sim, { kind, service: 'shampoo' })
    const tech = hireStaff(sim, 'technician', undefined, {}, trait)
    c.state = 'inService'
    ;(sim as unknown as Payer).payFor(c, sim.stations[0], stars, tech)
    return sim
  }

  it('tips more after a jolly technician', () => {
    const tipOf = (trait: 'jolly' | 'diligent') => {
      const sim = serve(trait, 'office', 3)
      return sim.stats.tips
    }
    expect(tipOf('diligent')).toBeGreaterThan(0)
    expect(tipOf('jolly')).toBeGreaterThan(tipOf('diligent'))
  })

  it("lets a calm technician's picky customers grade like normal ones", () => {
    expect(serve('calm', 'picky', 2).reviews).toContain(reviewScore(2, 'normal'))
    expect(serve('diligent', 'picky', 2).reviews).toContain(reviewScore(2, 'harsh'))
  })

  it("serves a studious person's course at the cut price", () => {
    const sim = dayThree()
    sim.money = 500_000
    sim.services = ['shampoo', 'mask']
    const tech = hireStaff(sim, 'technician', { skill: 3, speed: 3, friendly: 4, stamina: 3 }, {}, 'studious')
    expect(sim.study(tech.id, 'mask')).toBeNull()
    expect(sim.money).toBe(395_000)
  })
})

describe('flaws', () => {
  const stats = { skill: 3, speed: 5, friendly: 3, stamina: 5 }

  it('keeps a deft technician out until 8:30, then walks her in', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician', stats, {}, 'deft')
    sim.startDay()
    expect(tileOf(tech)).toEqual(sim.grid.door)
    expect(tech.task).toEqual({ kind: 'late', untilMinute: DAY_START_MIN + LATE_MIN })
    const c = seatAndWait(sim)
    sim.advance(1000)
    expect(tech.task?.kind).toBe('late')
    expect(c.state).toBe('waiting')
    advanceUntil(sim, () => sim.clock.minutes >= DAY_START_MIN + LATE_MIN)
    advanceUntil(sim, () => tech.task === null || tech.task.kind !== 'late')
    expect(['fetch', 'serve', null]).toContain(tech.task?.kind ?? null)
  })

  it('walks home and clears the task when nobody is waiting', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician', stats, {}, 'deft')
    const home = homeOf({ sim } as CrewHost, tech)
    sim.startDay()
    sim.clock.minutes = DAY_START_MIN + LATE_MIN
    advanceUntil(sim, () => tech.task === null)
    expect(tech.path).toEqual([])
    expect(tileEq(tileOf(tech), sim.grid.door)).toBe(false)
    expect(tileOf(tech)).toEqual(home)
  })

  it('is not late on the day she is hired', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician', stats, {}, 'deft')
    expect(tech.task?.kind).not.toBe('late')
  })

  it('stays away across a reload and arrives at the same minute', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician', stats, {}, 'deft')
    sim.startDay()
    sim.clock.minutes = DAY_START_MIN + 10
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(2), autoSpawn: false })
    expect(copy.staff[0].task).toEqual({ kind: 'late', untilMinute: DAY_START_MIN + LATE_MIN })
    expect(copy.staff[0].id).toBe(tech.id)
    expect(tileOf(copy.staff[0])).toEqual(copy.grid.door)
    copy.clock.minutes = DAY_START_MIN + LATE_MIN - 1
    copy.advance(200)
    expect(copy.staff[0].task?.kind).toBe('late')
    expect(tileOf(copy.staff[0])).toEqual(copy.grid.door)
    advanceUntil(copy, () => !tileEq(tileOf(copy.staff[0]), copy.grid.door))
    expect(copy.clock.minutes).toBeGreaterThanOrEqual(DAY_START_MIN + LATE_MIN)
  })

  it('leaves at once when let go before arriving', () => {
    const sim = dayThree()
    const tech = hireStaff(sim, 'technician', stats, {}, 'deft')
    sim.startDay()
    const wages = sim.stats.wages
    sim.fire(tech.id)
    sim.advance(200)
    sim.advance(200)
    expect(sim.staff).not.toContain(tech)
    expect(sim.stats.wages).toBe(wages + tech.wage)
  })

  it('a chatting receptionist greets nobody', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist', stats, {}, 'jolly')
    const atSpot = () => rec.task === null && rec.path.length === 0 && tileEq(rec.pos, sim.receptionSpot())
    advanceUntil(sim, atSpot)
    rec.task = { kind: 'chat', leftMs: 2000 }
    expect(sim.spawnCustomer().greet).toBe(0)
    advanceUntil(sim, () => rec.task === null, 5_000)
    expect(sim.spawnCustomer().greet).toBeGreaterThan(0)
  })

  const chatsOver = (trait: 'jolly' | 'studious') => {
    const sim = new SpaSim({ rng: createRng(7), autoSpawn: false })
    sim.day = 3
    const tech = hireStaff(sim, 'technician', { skill: 3, speed: 5, friendly: 3, stamina: 5 }, {}, trait)
    const lengths: number[] = []
    let last: unknown = null
    for (let i = 0; i < 40; i++) {
      const c = seatAndWait(sim)
      for (let t = 0; t < 120_000 && !served(c); t += 100) {
        sim.advance(100)
        if (tech.task?.kind === 'chat' && tech.task !== last) {
          last = tech.task
          lengths.push(tech.task.leftMs)
        }
      }
      sim.money = 1_000_000
    }
    return lengths
  }

  it('chats now and then after work, only when jolly', () => {
    const jolly = chatsOver('jolly')
    expect(jolly.length).toBeGreaterThan(0)
    // read up to one 100 ms step after the chat began
    for (const ms of jolly) {
      expect(ms).toBeGreaterThanOrEqual(2900)
      expect(ms).toBeLessThanOrEqual(5000)
    }
    expect(chatsOver('studious')).toEqual([])
  })

  it("drops a quick technician's star now and then, never below 1", () => {
    const sim = new SpaSim({ rng: createRng(3), autoSpawn: false })
    sim.day = 3
    hireStaff(sim, 'technician', { skill: 1, speed: 5, friendly: 3, stamina: 5 }, {}, 'quick')
    const ev: SimEvent[] = []
    for (let i = 0; i < 70; i++) {
      const c = seatAndWait(sim)
      for (let t = 0; t < 120_000 && !served(c); t += 100) {
        sim.advance(100)
        ev.push(...sim.drainEvents())
      }
    }
    expect(ev.some(e => e.type === 'sloppy')).toBe(true)
    expect(Math.min(...sim.reviews)).toBeGreaterThanOrEqual(reviewScore(1, 'harsh'))
  })

  it('flaws never empty the shop', () => {
    const day = (seed: number, flawed: boolean) => {
      const sim = new SpaSim({ rng: createRng(seed), autoSpawn: true })
      sim.day = 3
      sim.money = 2_000_000
      const t = flawed ? (['deft', 'quick', 'jolly'] as const) : (['studious', 'studious', 'studious'] as const)
      hireStaff(sim, 'receptionist', stats, {}, flawed ? 'jolly' : 'studious')
      for (const trait of t) hireStaff(sim, 'technician', stats, {}, trait)
      sim.startDay()
      advanceUntil(sim, () => sim.dayOver, 3_000_000)
      return sim.stats.walkedAway + sim.stats.angry
    }
    for (const seed of [1, 2, 3]) {
      const flawed = day(seed, true)
      const steady = day(seed, false)
      expect(flawed, `seed ${seed}: flawed ${flawed}, steady ${steady}`).toBeLessThanOrEqual(steady + 3)
    }
  }, 15_000)
})
