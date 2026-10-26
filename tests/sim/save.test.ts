import { describe, expect, it } from 'vitest'
import { DAY_START_MIN, PATIENCE_MS, RATING_WINDOW, SERVICE_PRICE } from '../../src/config'
import { tipFor } from '../../src/sim/economy'
import { DEFAULT_ITEMS } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import { DEFAULT_OWNER_LOOK } from '../../src/sim/profile'
import { parseSave, SaveError, SaveTooNewError } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import { TUTORIAL_HINTS, type SimEvent } from '../../src/sim/types'
import v1 from '../fixtures/save-v1.json'
import v2 from '../fixtures/save-v2.json'
import v3 from '../fixtures/save-v3.json'
import v4 from '../fixtures/save-v4.json'
import v5 from '../fixtures/save-v5.json'
import { advanceUntil, busyShop, hireStaff, seatAndWait, startService } from './helpers'

const opts = () => ({ rng: createRng(2), autoSpawn: false })
const viaJson = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())
const open = (raw: unknown) => SpaSim.fromSave(parseSave(structuredClone(raw)), opts())

describe('saving the shop', () => {
  it('restores a busy shop exactly and keeps playing it the same way', () => {
    const sim = busyShop()
    const copy = viaJson(sim)
    expect(copy.toSave()).toEqual(sim.toSave())
    expect(copy.stations).toEqual(sim.stations)
    expect(copy.seats).toEqual(sim.seats)
    sim.advance(5000)
    copy.advance(5000)
    expect(copy.toSave()).toEqual(sim.toSave())
  })

  it('reopens the mini-game for a customer who was being served', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = startService(sim)
    const copy = viaJson(sim)
    expect(copy.drainEvents()).toContainEqual({ type: 'serviceReady', customerId: c.id, stationId: c.stationId })
    const before = copy.money
    copy.completeService(c.id, 3)
    expect(copy.money).toBe(before + SERVICE_PRICE.shampoo + tipFor(SERVICE_PRICE.shampoo, 3))
  })

  it('shows the summary again for a day that had ended', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    advanceUntil(sim, () => sim.dayOver, 8 * 60_000)
    const copy = viaJson(sim)
    expect(copy.drainEvents()).toEqual([{ type: 'dayEnded', stats: sim.stats }])
    copy.startDay()
    expect([copy.day, copy.dayOver, copy.clock.minutes]).toEqual([2, false, DAY_START_MIN])
  })

  it('does not reopen anything for a shop between customers', () => {
    const sim = busyShop()
    expect(viaJson(sim).drainEvents()).toEqual([])
  })

  it('saves only the reviews the rating uses', () => {
    const sim = busyShop()
    sim.reviews = Array.from({ length: 30 }, (_, i) => (i % 5) + 1)
    expect(sim.toSave().reviews).toHaveLength(RATING_WINDOW)
    expect(viaJson(sim).rating()).toBe(sim.rating())
  })

  it('rejects data that is not a saved shop', () => {
    const good = busyShop().toSave()
    for (const raw of [null, 'x', [], {}, { ...good, v: 99 }, { ...good, money: 'lots' }, { ...good, customers: null }, { ...good, owner: {} }])
      expect(() => parseSave(raw)).toThrow(SaveError)
    // item 3 is the cabinet, not a bed
    expect(() => SpaSim.fromSave({ ...good, customers: good.customers.map(c => ({ ...c, stationId: 3 })) }, opts())).toThrow(SaveError)
  })
})

describe('save version 2', () => {
  it('opens a shop saved before owners and names as the same shop, with the default owner and no tutorial', () => {
    const data = parseSave(structuredClone(v1))
    expect([data.v, data.shopName, data.ownerLook, data.profileDone]).toEqual([6, 'Tiệm Spa', DEFAULT_OWNER_LOOK, false])
    expect(data.hints).toEqual([...TUTORIAL_HINTS])
    expect(data.customers.map(c => c.patienceMaxMs)).toEqual(v1.customers.map(() => PATIENCE_MS))
    const sim = SpaSim.fromSave(data, opts())
    expect([sim.day, sim.money, sim.customers.length]).toEqual([v1.day, v1.money, v1.customers.length])
    expect(sim.toSave().v).toBe(6)
  })

  it('still reopens the mini-game of an upgraded shop', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = startService(sim)
    const save = sim.toSave()
    // batch 1 numbered the beds from 0
    save.customers[0].stationId = 0
    save.owner.task = { kind: 'serve', customerId: c.id, stationId: 0 }
    const old = { ...save, v: 1 } as Record<string, unknown>
    for (const k of ['shopName', 'ownerLook', 'profileDone', 'hints', 'items', 'nextItemId']) delete old[k]
    const copy = SpaSim.fromSave(parseSave(old), opts())
    expect(copy.drainEvents()).toContainEqual({ type: 'serviceReady', customerId: c.id, stationId: c.stationId })
  })

  it('keeps the owner, the shop name and the hints already shown', () => {
    const sim = busyShop()
    sim.setProfile({ skin: 3, hair: 4, hairStyle: 3, shirt: 2 }, '  Spa Hoa Sen ')
    sim.markHint('money')
    sim.markHint('money')
    const copy = viaJson(sim)
    expect([copy.shopName, copy.ownerLook, copy.profileDone, copy.hints]).toEqual(['Spa Hoa Sen', { skin: 3, hair: 4, hairStyle: 3, shirt: 2 }, true, ['tapCustomer', 'money']])
  })

  it('rejects an owner look outside the choices', () => {
    const good = busyShop().toSave()
    const look = (o: object) => ({ skin: 0, hair: 0, hairStyle: 0, shirt: 0, ...o })
    for (const ownerLook of [look({ skin: 4 }), look({ shirt: 7 }), look({ skin: -1 }), look({ hair: 1.5 }), null])
      expect(() => parseSave({ ...good, ownerLook })).toThrow(SaveError)
  })

  it('cleans the saved shop name and drops hints it does not know', () => {
    const good = busyShop().toSave()
    const d = parseSave({ ...good, shopName: '  Spa   Sen  ', hints: ['money', 'fly'] })
    expect([d.shopName, d.hints]).toEqual(['Spa Sen', ['money']])
    expect(parseSave({ ...good, shopName: '   ' }).shopName).toBe('Tiệm Spa')
    expect(() => parseSave({ ...good, shopName: 5 })).toThrow(SaveError)
  })

  it('tells a save from a newer version apart from other unknown versions', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(() => parseSave({ ...good, v: 99 })).toThrow(SaveTooNewError)
    for (const v of ['x', 0, null]) {
      let err: unknown
      try {
        parseSave({ ...good, v })
      } catch (e) {
        err = e
      }
      expect(err).toBeInstanceOf(SaveError)
      expect(err).not.toBeInstanceOf(SaveTooNewError)
    }
  })
})

describe('save version 3', () => {
  it('opens a batch-2 shop with its customers on the same bed and seat', () => {
    const sim = open(v2)
    const served = sim.customers.find(c => c.id === v2.servingCustomerId)!
    expect(served.stationId).toBe(2)
    expect(sim.stations.find(s => s.id === 2)?.bed).toEqual({ x: 4, y: 3 })
    expect(sim.owner.task).toEqual({ kind: 'serve', customerId: served.id, stationId: 2 })
    const waiting = sim.customers.find(c => c.id === v2.seatCustomers[2])!
    expect(waiting.seat).toEqual({ x: 4, y: 13 })
    expect(sim.seats[2].customerId).toBe(waiting.id)
    expect(sim.stations.map(s => s.customerId)).toEqual(v2.stationCustomers)
    expect(sim.seats.map(s => s.customerId)).toEqual(v2.seatCustomers)
    expect(sim.items).toEqual(DEFAULT_ITEMS)
    expect(sim.drainEvents()).toEqual([{ type: 'serviceReady', customerId: served.id, stationId: 2 }])
    const before = sim.money
    sim.completeService(served.id, 3)
    expect(sim.money).toBe(before + SERVICE_PRICE.shampoo + tipFor(SERVICE_PRICE.shampoo, 3))
    expect(sim.drainEvents()).toContainEqual(expect.objectContaining({ type: 'paid', tile: { x: 4, y: 3 } }))
  })

  it('opens a batch-1 shop the same way', () => {
    const sim = open(v1)
    expect(sim.stations.map(s => s.customerId)).toEqual(v1.stationCustomers)
    expect(sim.seats.map(s => s.customerId)).toEqual(v1.seatCustomers)
    expect(sim.customers.map(c => c.seat)).toEqual(v1.customers.map(c => c.seat))
    expect(sim.items).toEqual(DEFAULT_ITEMS)
    // played on: the owner was fetching the first customer, who goes to the first bed and pays as before
    const c = sim.customers.find(x => x.id === v1.owner.task.customerId)!
    advanceUntil(sim, () => c.state === 'inService')
    expect(c.stationId).toBe(1)
    expect(sim.stations.find(s => s.id === 1)?.bed).toEqual({ x: 2, y: 3 })
    const before = sim.money
    sim.completeService(c.id, 3)
    expect(sim.money).toBe(before + SERVICE_PRICE.shampoo + tipFor(SERVICE_PRICE.shampoo, 3))
  })

  it('keeps bought furniture across a save', () => {
    const sim = busyShop()
    sim.items.push({ id: 14, kind: 'plant', x: 6, y: 9, flip: false })
    const copy = viaJson(sim)
    expect(copy.items).toContainEqual({ id: 14, kind: 'plant', x: 6, y: 9, flip: false })
    expect(copy.grid.cells[9][6]).toBe('plant')
  })

  it('rejects furniture that is not furniture', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    const plant = { id: 14, kind: 'plant', x: 6, y: 9, flip: false }
    for (const items of [[{ id: 1, kind: 'sofa', x: 1, y: 1, flip: false }], [plant, plant], [{ ...plant, x: 6.5 }], [{ ...plant, flip: 1 }], null])
      expect(() => parseSave({ ...good, items })).toThrow('items are not furniture')
  })

  it('rejects furniture off the floor, so the shop is set aside instead of crashing', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    const plant = (x: number, y: number) => ({ id: 14, kind: 'plant', x, y, flip: false })
    // a wall, the door, the screen, the desk, off each edge, and a flipped bed whose work tile is in the wall
    const strays = [plant(0, 5), plant(6, 17), plant(3, 6), plant(9, 14), plant(-1, 9), plant(13, 9), plant(6, -1), plant(6, 18), { id: 14, kind: 'bed', x: 1, y: 2, flip: true }]
    for (const stray of strays) expect(() => SpaSim.fromSave(parseSave({ ...good, items: [...good.items, stray] }), opts())).toThrow(SaveError)
    // overlapping furniture is not checked on load
    expect(() => SpaSim.fromSave(parseSave({ ...good, items: [...good.items, plant(3, 13)] }), opts())).not.toThrow()
  })

  it('never hands out an id a saved item already has', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    const sim = SpaSim.fromSave(parseSave({ ...good, nextItemId: 5, items: [...good.items, { id: 20, kind: 'plant', x: 7, y: 9, flip: false }] }), opts())
    expect(sim.toSave().nextItemId).toBe(21)
    sim.money = 1_000_000
    expect(sim.buy('plant', 7, 10, false)).toBeNull()
    expect(sim.items.map(i => i.id).slice(-2)).toEqual([20, 21])
  })

  it('keeps the tap hint done but the build badge new for an old shop', () => {
    const sim = open(v1)
    expect(sim.hintDone('tapCustomer')).toBe(true)
    expect(sim.hintDone('openBuild')).toBe(false)
  })

  it('still leaves alone only saves newer than version 6', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(parseSave({ ...good, v: 6 }).v).toBe(6)
    expect(() => parseSave({ ...good, v: 7 })).toThrow(SaveTooNewError)
  })
})

describe('save version 3 as saved by batch 3', () => {
  it('opens a batch-3 shop as it was saved', () => {
    const sim = open(v3)
    expect([sim.day, sim.money]).toEqual([v3.day, v3.money])
    expect(sim.items).toEqual(v3.items)
    expect(sim.items.map(i => i.kind)).toEqual(expect.arrayContaining(['bed', 'teaChest']))
    expect(sim.customers.map(c => [c.id, c.stationId, c.seat])).toEqual(v3.customers.map(c => [c.id, c.stationId, c.seat]))
    expect(sim.servingCustomerId).toBe(v3.servingCustomerId)
    expect(sim.stations.map(s => s.customerId)).toEqual(sim.stations.map(s => v3.customers.find(c => c.stationId === s.id)?.id ?? null))
    const served = sim.customers.find(c => c.id === v3.servingCustomerId)!
    expect(sim.drainEvents()).toEqual([{ type: 'serviceReady', customerId: served.id, stationId: served.stationId }])
  })
})

/** Day 3 with its candidates drawn. */
const dayThree = () => {
  const sim = new SpaSim({ rng: createRng(5), autoSpawn: false })
  sim.startDay()
  sim.startDay()
  return sim
}

describe('save version 4', () => {
  it('opens batch-1, 2 and 3 shops with no staff', () => {
    for (const raw of [v1, v2, v3]) {
      const sim = open(raw)
      expect(sim.staff).toEqual([])
      expect(sim.stats.wages).toBe(0)
      expect(sim.customers.every(c => c.greet === 0)).toBe(true)
    }
    const sim = open(v3)
    expect([sim.candidates.length, sim.candidatesDay]).toEqual([3, 4])
  })

  it('opens an old shop to day end with the money unchanged', () => {
    for (const raw of [v1, v2, v3]) {
      const sim = open(raw)
      sim.customers = []
      sim.servingCustomerId = null
      sim.owner.task = null
      const before = sim.money
      advanceUntil(sim, () => sim.dayOver, 8 * 60_000)
      expect(Number.isFinite(sim.money)).toBe(true)
      expect(sim.money).toBe(before)
    }
  })

  it('keeps a technician in the middle of a service', () => {
    const sim = dayThree()
    const c = seatAndWait(sim)
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => c.state === 'inService')
    const copy = viaJson(sim)
    const t = copy.staff[0]
    expect([t.id, t.name, t.stats, t.level, t.xp, t.wage, t.pos, t.task]).toEqual([tech.id, tech.name, tech.stats, tech.level, tech.xp, tech.wage, tech.pos, tech.task])
    expect(t.task).toMatchObject({ kind: 'serve', customerId: c.id })
    const bed = copy.stations.find(s => s.id === c.stationId)!
    expect([copy.customers[0].stationId, bed.customerId]).toEqual([c.stationId, c.id])
    expect(copy.candidates.map(x => x.name)).toEqual(sim.candidates.map(x => x.name))
    const before = copy.money
    advanceUntil(copy, () => copy.stats.served === 1)
    expect(copy.money).toBeGreaterThan(before)
  })

  it('keeps a resting receptionist and a technician walking out', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist')
    const tech = hireStaff(sim, 'technician')
    sim.advance(100)
    Object.assign(rec, { task: { kind: 'rest', leftMs: 20_000 }, path: [], sinceRest: 4 })
    sim.fire(tech.id)
    const copy = viaJson(sim)
    expect(copy.staff).toEqual(sim.staff)
    expect(copy.staff[0].task).toEqual({ kind: 'rest', leftMs: 20_000 })
    expect(copy.staff[1]).toMatchObject({ leaving: true, task: { kind: 'exit' } })
    advanceUntil(copy, () => copy.staff.length === 1)
    advanceUntil(copy, () => copy.staff[0].task === null, 25_000)
    expect(copy.staff[0].sinceRest).toBe(0)
    expect(copy.toSave().nextStaffId).toBe(3)
  })

  it('drops a saved task whose customer is gone', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    hireStaff(sim, 'technician')
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    save.staff[0].task = { kind: 'fetch', customerId: 999 }
    save.staff[1].task = { kind: 'serve', customerId: 999, stationId: save.items.find((i: { kind: string }) => i.kind === 'bed').id, leftMs: 5000, totalMs: 9000 }
    const copy = SpaSim.fromSave(parseSave(save), opts())
    expect(copy.staff.map(s => s.task)).toEqual([null, null])
  })

  it('lets a let-go technician whose customer is gone walk out', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    sim.advance(100)
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    save.staff[0].leaving = true
    save.staff[0].task = { kind: 'serve', customerId: 999, stationId: save.items.find((i: { kind: string }) => i.kind === 'bed').id, leftMs: 5000, totalMs: 9000 }
    const copy = SpaSim.fromSave(parseSave(save), opts())
    expect(copy.staff[0].task).toBeNull()
    advanceUntil(copy, () => copy.staff.length === 0)
  })

  it('repairs damaged staff instead of losing the shop', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    const look = save.staff[0].look
    Object.assign(save.staff[0], { task: 5, path: null, facing: 'sideways', look: { ...look, hairStyle: 99 } })
    const copy = SpaSim.fromSave(parseSave(save), opts())
    const s = copy.staff[0]
    expect([s.task, s.path, s.facing, s.look.hairStyle]).toEqual([null, [], 'down', 0])
    expect(() => copy.advance(5000)).not.toThrow()
  })

  it('repairs a candidate with a damaged look', () => {
    const sim = dayThree()
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    save.candidates[0].look = { ...save.candidates[0].look, skin: -1, shirt: 1.5 }
    save.candidates[1].look = null
    const copy = SpaSim.fromSave(parseSave(save), opts())
    expect(copy.candidates[0].look).toMatchObject({ skin: 0, shirt: 0 })
    expect(copy.candidates[1].look).toEqual({ skin: 0, hair: 0, hairStyle: 0, shirt: 0 })
  })

  it('still lets go of a technician whose task is damaged', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    sim.advance(100)
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    Object.assign(save.staff[0], { leaving: true, task: { kind: 'serve', customerId: 'x' }, path: 'up' })
    const copy = SpaSim.fromSave(parseSave(save), opts())
    advanceUntil(copy, () => copy.staff.length === 0)
  })

  it('reads a customer with a damaged greeting as not greeted', () => {
    const sim = busyShop()
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    save.customers[0].greet = 'x'
    expect(SpaSim.fromSave(parseSave(save), opts()).customers[0].greet).toBe(0)
  })

  it('rejects staff that are not staff', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    hireStaff(sim, 'technician')
    const good = JSON.parse(JSON.stringify(sim.toSave()))
    const bad = (i: number, o: object) => ({ ...good, staff: good.staff.map((s: object, j: number) => (j === i ? { ...s, ...o } : s)) })
    for (const raw of [
      bad(0, { role: 'boss' }),
      bad(0, { stats: { ...good.staff[0].stats, skill: 7 } }),
      bad(0, { level: 6 }),
      bad(0, { leaving: 'no' }),
      bad(0, { pos: { x: 1 } }),
      bad(1, { id: good.staff[0].id }),
      { ...good, staff: 'many' },
      { ...good, candidates: [{ ...good.candidates[0], role: 'boss' }] },
      { ...good, candidatesDay: 'x' },
      { ...good, nextStaffId: null },
    ])
      expect(() => parseSave(raw)).toThrow(SaveError)
  })
})

describe('save version 5', () => {
  it('opens a batch-4 shop with shampoo only and every customer wanting it', () => {
    const sim = open(v4)
    expect(sim.services).toEqual(['shampoo'])
    expect(sim.customers.length).toBeGreaterThan(0)
    expect(sim.customers.every(c => c.service === 'shampoo')).toBe(true)
    const paid: number[] = []
    const ev: SimEvent[] = []
    advanceUntil(sim, () => {
      paid.push(...ev.flatMap(e => (e.type === 'paid' ? [e.amount] : [])))
      ev.length = 0
      return paid.length >= 2
    }, 120_000, ev)
    expect(paid.slice(0, 2)).toEqual([40_000, 40_000])
  })

  it('keeps the services and what each customer wants through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.money = 1_000_000
    sim.openService('mask')
    sim.buy('maskBed', 6, 2, false)
    const c = sim.spawnCustomer({ service: 'mask' })
    const copy = viaJson(sim)
    expect(copy.services).toEqual(['shampoo', 'mask'])
    expect(copy.customers.find(x => x.id === c.id)!.service).toBe('mask')
    expect(copy.stations.map(s => s.service)).toEqual(['shampoo', 'shampoo', 'mask'])
  })

  it('repairs unknown services instead of rejecting the shop', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(parseSave({ ...good, services: ['massage', 'x'] }).services).toEqual(['shampoo', 'massage'])
    expect(parseSave({ ...good, services: 7 }).services).toEqual(['shampoo'])
    const d = parseSave({ ...good, customers: good.customers.map((c: object) => ({ ...c, service: 'x' })) })
    expect(d.customers.every(c => c.service === 'shampoo')).toBe(true)
  })
})

describe('customer kinds in saves', () => {
  it('keeps the kind of each customer through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = sim.spawnCustomer({ kind: 'celeb', service: 'shampoo' })
    expect(viaJson(sim).customers.find(x => x.id === c.id)!.kind).toBe('celeb')
  })

  it('turns a missing or unknown kind into an office worker', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(good.customers.length).toBeGreaterThan(0)
    for (const kind of [undefined, 'x', 7, null]) {
      const d = parseSave({ ...good, customers: good.customers.map((c: object) => ({ ...c, kind })) })
      expect(d.customers.every(c => c.kind === 'office')).toBe(true)
    }
  })

  it('opens every customer of versions 1 to 4 as an office worker', () => {
    for (const raw of [v1, v2, v3, v4]) {
      const customers = parseSave(structuredClone(raw)).customers
      expect(customers.length).toBeGreaterThan(0)
      expect(customers.every(c => c.kind === 'office')).toBe(true)
    }
  })
})

describe('save version 6', () => {
  it('keeps the stock and the money spent restocking through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.day = 5
    sim.stock = { shampoo: 3, towel: 7, mask: 40, oil: 0 }
    sim.stats.restock = 123_000
    const copy = viaJson(sim)
    expect(copy.stock).toEqual({ shampoo: 3, towel: 7, mask: 40, oil: 0 })
    expect(copy.stats.restock).toBe(123_000)
    expect(copy.toSave().v).toBe(6)
  })

  it('opens saves of versions 1 to 5 with 20 of each item and nothing spent restocking', () => {
    for (const raw of [v1, v2, v3, v4, v5]) {
      const sim = open(raw)
      expect(sim.stock).toEqual({ shampoo: 20, towel: 20, mask: 20, oil: 20 })
      expect(sim.stats.restock).toBe(0)
    }
  })

  it('opens the batch-5 shop on day 6 with its customers and tracked stock', () => {
    const sim = open(v5)
    expect(sim.day).toBe(6)
    expect(sim.stockTracked()).toBe(true)
    expect(sim.customers.filter(c => c.state === 'inService')).toHaveLength(3)
    expect(sim.customers.some(c => c.state === 'waiting' && c.kind === 'picky')).toBe(true)
    expect(sim.drainEvents().some(e => e.type === 'serviceReady')).toBe(true)
  })

  it('repairs a missing, negative, fractional or non-number count to 20, and a bad restock total to 0', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    for (const bad of [undefined, -1, 2.5, 'x', null, NaN]) {
      const d = parseSave({ ...good, stock: { shampoo: bad, towel: 4, mask: bad, oil: 0 } })
      expect(d.stock).toEqual({ shampoo: 20, towel: 4, mask: 20, oil: 0 })
    }
    for (const bad of [undefined, 'x', null, NaN]) expect(parseSave({ ...good, stats: { ...good.stats, restock: bad } }).stats.restock).toBe(0)
    expect(parseSave({ ...good, stock: 'lots' }).stock).toEqual({ shampoo: 20, towel: 20, mask: 20, oil: 20 })
  })
})
