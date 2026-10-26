import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { DAY_END_MIN, OWNER_START, PATIENCE_MS, STAFF_REST_MS } from '../../src/config'
import { dayEase, tipFor } from '../../src/sim/economy'
import { isWalkable, manhattan, tileEq } from '../../src/sim/grid'
import { footprint } from '../../src/sim/items'
import { SpaSim } from '../../src/sim/spa'
import { greetPatience, tipFactor, workMs } from '../../src/sim/staff'
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
    expect(sim.buy('plant', 6, 9, false)).toBe('money')
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
    while (!ev.some(e => e.type === 'paid')) {
      sim.advance(100)
      ms += 100
      ev.push(...sim.drainEvents())
    }
    expect(Math.abs(ms - workMs(3))).toBeLessThanOrEqual(200)
    expect(ev).toContainEqual(expect.objectContaining({ type: 'paid', customerId: a.id, amount: 40_000 }))
    expect(sim.stats.served).toBe(1)
    expect(a.state).toBe('leaving')
    expect(sim.stations[0].customerId).toBeNull()
    expect(tech.task).toBeNull()
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
    expect(paid.tip).toBe(Math.round(tipFor(40_000, (review.score - 2) as 1 | 2 | 3) * tipFactor(0, tech.stats.friendly)))
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
    while (!sim.drainEvents().some(e => e.type === 'paid')) {
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
    const c = sim.spawnCustomer()
    const patience = Math.round(PATIENCE_MS * dayEase(3).patience * greetPatience(3))
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
    expect(sim.drainEvents()).toContainEqual(expect.objectContaining({ type: 'paid', tip: 12_000 }))
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
  it('a tired technician rests by the towel cabinet for 35 s, then works again', () => {
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
    const tech = hireStaff(sim, 'technician')
    tech.xp = 2
    const wage = tech.wage
    seated(sim, 1)
    const ev: SimEvent[] = []
    advanceUntil(sim, () => ev.some(e => e.type === 'levelUp'), 60_000, ev)
    expect(ev).toContainEqual({ type: 'levelUp', staffId: tech.id, level: 2 })
    expect(tech.wage).toBe(wage + 5000)
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
      s.pos = { x: 1, y: 8 }
      s.path = [{ x: 2, y: 8 }]
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
