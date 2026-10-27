import { describe, expect, it } from 'vitest'
import { CHAT_MS_MAX, DAY_START_MIN, LATE_MIN, PATIENCE_MS, RATING_WINDOW, SERVICE_PRICE } from '../../src/config'
import { tipFor } from '../../src/sim/economy'
import { DEFAULT_ITEMS } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import { emptyBook, REGULAR_IDS } from '../../src/sim/regulars'
import { DEFAULT_OWNER_LOOK } from '../../src/sim/profile'
import { emptyRecipes } from '../../src/sim/recipes'
import { oldShopKinds, parseSave, SaveError, SaveTooNewError } from '../../src/sim/save'
import { BASIC_SERVICES } from '../../src/sim/services'
import { SpaSim } from '../../src/sim/spa'
import { noTiers, RECEPTIONIST_TRAITS, TRAIT_IDS } from '../../src/sim/staff'
import { emptyVipBook } from '../../src/sim/vips'
import { TUTORIAL_HINTS, type SimEvent } from '../../src/sim/types'
import v1 from '../fixtures/save-v1.json'
import v2 from '../fixtures/save-v2.json'
import v3 from '../fixtures/save-v3.json'
import v4 from '../fixtures/save-v4.json'
import v5 from '../fixtures/save-v5.json'
import v6 from '../fixtures/save-v6.json'
import v7 from '../fixtures/save-v7.json'
import v8 from '../fixtures/save-v8.json'
import v9 from '../fixtures/save-v9.json'
import v10 from '../fixtures/save-v10.json'
import v11 from '../fixtures/save-v11.json'
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
    expect([data.v, data.shopName, data.ownerLook, data.profileDone]).toEqual([12, 'Tiệm Spa', DEFAULT_OWNER_LOOK, false])
    expect(data.hints).toEqual([...TUTORIAL_HINTS])
    expect(data.customers.map(c => c.patienceMaxMs)).toEqual(v1.customers.map(() => PATIENCE_MS))
    const sim = SpaSim.fromSave(data, opts())
    expect([sim.day, sim.money, sim.customers.length]).toEqual([v1.day, v1.money, v1.customers.length])
    expect(sim.toSave().v).toBe(12)
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

  it('still leaves alone only saves newer than version 12', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(parseSave({ ...good, v: 12 }).v).toBe(12)
    expect(() => parseSave({ ...good, v: 13 })).toThrow(SaveTooNewError)
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
    sim.stock = { shampoo: 3, towel: 7, mask: 40, oil: 0, herbs: 11, mud: 20 }
    sim.stats.restock = 123_000
    const copy = viaJson(sim)
    expect(copy.stock).toEqual({ shampoo: 3, towel: 7, mask: 40, oil: 0, herbs: 11, mud: 20 })
    expect(copy.stats.restock).toBe(123_000)
    expect(copy.toSave().v).toBe(12)
  })

  it('opens saves of versions 1 to 5 with 20 of each item and nothing spent restocking', () => {
    for (const raw of [v1, v2, v3, v4, v5]) {
      const sim = open(raw)
      expect(sim.stock).toEqual({ shampoo: 20, towel: 20, mask: 20, oil: 20, herbs: 20, mud: 20 })
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
      expect(d.stock).toEqual({ shampoo: 20, towel: 4, mask: 20, oil: 0, herbs: 20, mud: 20 })
    }
    for (const bad of [undefined, 'x', null, NaN]) expect(parseSave({ ...good, stats: { ...good.stats, restock: bad } }).stats.restock).toBe(0)
    expect(parseSave({ ...good, stock: 'lots' }).stock).toEqual({ shampoo: 20, towel: 20, mask: 20, oil: 20, herbs: 20, mud: 20 })
  })
})

describe('save version 7', () => {
  it('opens shops saved with staff on half the wages, now that the day is half as long', () => {
    for (const raw of [v4, v5, v6] as { staff: { wage: number }[] }[]) expect(open(raw).staff.map(s => s.wage)).toEqual(raw.staff.map(s => s.wage / 2))
    expect(open(v4).candidates.map(c => c.wage)).toEqual([30000, 27500, 27500])
    expect(open(v6).candidates.map(c => c.wage)).toEqual([55000, 55000, 40000])
  })

  it('opens the batch-6 shop as it was saved, apart from the wages', () => {
    const sim = open(v6)
    expect([sim.day, sim.money, sim.stock, sim.stats.restock]).toEqual([v6.day, v6.money, { ...v6.stock, herbs: 20, mud: 20 }, v6.stats.restock])
    expect(sim.staff.map(s => [s.name, s.role, s.level, s.xp])).toEqual(v6.staff.map(s => [s.name, s.role, s.level, s.xp]))
    expect(sim.customers.map(c => [c.id, c.state, c.service])).toEqual(v6.customers.map(c => [c.id, c.state, c.service]))
    expect(sim.servingCustomerId).toBe(v6.servingCustomerId)
  })
})

describe('save version 8', () => {
  const good = () => JSON.parse(JSON.stringify(busyShop().toSave()))

  it('keeps a regular customer and the book through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = sim.spawnCustomer()
    c.regular = 'hanh'
    c.heldMs = 1234
    sim.book.regulars.hanh = { meetDay: 7, met: true, points: 9, hearts: 2, visitAt: null }
    sim.book.gifts = ['vase']
    sim.stats.gifts = 5000
    expect(viaJson(sim).toSave()).toEqual(sim.toSave())
    expect(viaJson(sim).customers[0].regular).toBe('hanh')
  })

  it('opens saves of versions 1 to 7 with an empty book', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7] as { day: number }[]) {
      const sim = open(raw)
      for (const id of REGULAR_IDS) expect(sim.book.regulars[id]).toEqual({ meetDay: null, met: false, points: 0, hearts: 0, visitAt: null })
      expect(sim.book.kindsMet).toEqual(oldShopKinds(raw.day))
      expect(sim.customers.every(c => c.regular === null && c.heldMs === 0)).toBe(true)
      expect(sim.stats.gifts).toBe(0)
    }
    expect(open(v6).book.kindsMet).toEqual(['student', 'office', 'picky', 'elder'])
    expect(open(v7).book.kindsMet).toEqual(['student', 'office', 'picky', 'elder'])
    expect(open(v1).book.kindsMet).toEqual(['student', 'office'])
  })

  it('opens the version-7 shop as it was saved', () => {
    const sim = open(v7)
    expect([sim.day, sim.money, sim.stock, sim.stats.restock]).toEqual([v7.day, v7.money, { ...v7.stock, herbs: 20, mud: 20 }, v7.stats.restock])
    expect(sim.staff.map(s => [s.name, s.wage])).toEqual(v7.staff.map(s => [s.name, s.wage]))
    expect(sim.customers.map(c => [c.id, c.state, c.service])).toEqual(v7.customers.map(c => [c.id, c.state, c.service]))
  })

  it('repairs a damaged book instead of losing the shop', () => {
    expect(parseSave({ ...good(), book: 'x' }).book).toEqual({ ...emptyBook(), kindsMet: oldShopKinds(good().day) })
    const book = emptyBook()
    const damaged = (over: object) => parseSave({ ...good(), book: { ...JSON.parse(JSON.stringify(book)), ...over } }).book
    expect(damaged({ regulars: { ...book.regulars, hanh: { ...book.regulars.hanh, points: 'a' } } }).regulars.hanh.points).toBe(0)
    expect(damaged({ regulars: { ...book.regulars, hanh: { ...book.regulars.hanh, points: 13, hearts: 1 } } }).regulars.hanh.hearts).toBe(3)
    const hanh = (over: object) => damaged({ regulars: { ...book.regulars, hanh: { ...book.regulars.hanh, ...over } } }).regulars.hanh
    expect(hanh({ hearts: 2.5, points: 0 })).toMatchObject({ hearts: 2, points: 8 })
    expect(hanh({ hearts: 3, points: 0 })).toMatchObject({ hearts: 3, points: 12 })
    expect(Object.keys(damaged({ regulars: { ...book.regulars, nobody: book.regulars.hanh } }).regulars)).toEqual(REGULAR_IDS)
    expect(damaged({ gifts: ['nope', 'vase'] }).gifts).toEqual(['vase'])
    expect(damaged({ served: { ...book.served, student: -1 } }).served.student).toBe(0)
    expect(damaged({ kindsMet: ['student', 'ghost'] }).kindsMet).toEqual(['student'])
    expect(damaged({ boardGiven: 'yes', extraAt: 'x' })).toMatchObject({ boardGiven: false, extraAt: null })
  })

  it('reads an unknown regular on a customer as an ordinary customer', () => {
    const raw = good()
    raw.customers = raw.customers.map((c: object) => ({ ...c, regular: 'nobody', heldMs: 'x' }))
    expect(raw.customers.length).toBeGreaterThan(0)
    const d = parseSave(raw)
    expect(d.customers.every(c => c.regular === null && c.heldMs === 0)).toBe(true)
  })

  it('drops a gift flag that is not a boolean and keeps old items valid', () => {
    const raw = good()
    raw.items[0].gift = 'yes'
    raw.items[1].gift = true
    const d = parseSave(raw)
    expect('gift' in d.items[0]).toBe(false)
    expect(d.items[1].gift).toBe(true)
  })
})

describe('save version 9', () => {
  it('opens a v8 shop with an empty VIP book', () => {
    const sim = open(v8)
    expect([sim.day, sim.money, sim.book, sim.items]).toEqual([v8.day, v8.money, parseSave(structuredClone(v8)).book, v8.items])
    expect(sim.vip).toEqual(emptyVipBook())
    expect(sim.customers.length).toBeGreaterThan(0)
    expect(sim.customers.every(c => c.vip === null)).toBe(true)
  })

  it('opens every older save with an empty VIP book', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8]) {
      const sim = open(raw)
      expect(sim.vip).toEqual(emptyVipBook())
      expect(sim.vip.booking).toBeNull()
      expect(sim.customers.every(c => c.vip === null)).toBe(true)
    }
  })

  it('keeps the VIP book and a VIP customer through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = sim.spawnCustomer()
    c.vip = 'chef'
    sim.vip.vips.chef = { visits: 2, best: 3, photo: true }
    sim.vip.vips.miss = { visits: 1, best: 2, photo: false }
    sim.vip.booking = { vip: 'star', day: 2, minute: 600 }
    sim.vip.nextDay = 7
    sim.vip.everBooked = true
    expect(viaJson(sim).toSave()).toEqual(sim.toSave())
    expect(viaJson(sim).customers[0].vip).toBe('chef')
    expect(viaJson(sim).vip).toEqual(sim.vip)
  })

  it('repairs a damaged VIP book field by field', () => {
    const raw = JSON.parse(JSON.stringify(new SpaSim({ rng: createRng(1), autoSpawn: false }).toSave()))
    raw.day = 2
    raw.vip = {
      vips: { singer: { visits: -1, best: 9, photo: 'yes' }, miss: { visits: 2, best: 2, photo: true }, nobody: { visits: 5, best: 1, photo: true } },
      booking: { vip: 'miss', day: 3, minute: 540 },
      nextDay: 'x',
      boardGiven: 1,
    }
    const v = parseSave(raw).vip
    expect(v.vips.singer).toEqual({ visits: 0, best: 3, photo: false })
    expect(v.vips.miss).toEqual({ visits: 2, best: 2, photo: true })
    expect(v.vips.star).toEqual({ visits: 0, best: 0, photo: false })
    expect(Object.keys(v.vips)).toEqual(Object.keys(emptyVipBook().vips))
    expect(v.booking).toEqual({ vip: 'miss', day: 3, minute: 540 })
    expect(v.everBooked).toBe(true)
    expect(v.nextDay).toBe(0)
    expect(v.boardGiven).toBe(false)
    for (const booking of [{ vip: 'nobody' }, { vip: 'miss', day: 1.5, minute: 600 }, { vip: 'miss', day: 1, minute: 'x' }, 'x'])
      expect(parseSave({ ...raw, vip: { ...raw.vip, booking } }).vip.booking).toBeNull()
    expect(parseSave({ ...raw, vip: 'junk' }).vip).toEqual(emptyVipBook())
  })

  it('keeps a VIP booking for tomorrow, drops one further ahead, and shows the tab of a VIP who visited', () => {
    const raw = JSON.parse(JSON.stringify(new SpaSim({ rng: createRng(1), autoSpawn: false }).toSave()))
    raw.day = 4
    const vip = (booking: object | null, visits = 0, everBooked = true) => ({ ...emptyVipBook(), booking, everBooked, vips: { ...emptyVipBook().vips, miss: { visits, best: 1, photo: false } } })
    expect(parseSave({ ...raw, vip: vip({ vip: 'miss', day: 9, minute: 600 }) }).vip.booking).toBeNull()
    expect(parseSave({ ...raw, vip: vip({ vip: 'miss', day: 5, minute: 600 }) }).vip.booking).toEqual({ vip: 'miss', day: 5, minute: 600 })
    expect(parseSave({ ...raw, vip: vip(null, 2, false) }).vip.everBooked).toBe(true)
    expect(parseSave({ ...raw, vip: vip(null, 0, false) }).vip.everBooked).toBe(false)
  })

  it('drops an unknown VIP id from a customer', () => {
    const raw = JSON.parse(JSON.stringify(busyShop().toSave()))
    raw.customers = raw.customers.map((c: object) => ({ ...c, vip: 'nobody' }))
    expect(parseSave(raw).customers.every(c => c.vip === null)).toBe(true)
  })
})

describe('save version 10', () => {
  const nonZero = (t: Record<string, number>) => Object.entries(t).filter(([, n]) => n !== 0)

  it('opens a v9 shop: every technician gets tier 1 in one open service, nothing else changes', () => {
    const raw = structuredClone(v9)
    raw.staff.forEach((p, i) => Object.assign(p, { level: 2 + (i % 3), xp: 7 + i, wage: 123_000 + i * 1000 }))
    const sim = open(raw)
    expect(sim.staff.length).toBe(raw.staff.length)
    sim.staff.forEach((s, i) => {
      const old = raw.staff[i]
      expect([s.name, s.role, s.stats, s.level, s.xp, s.wage, s.rare]).toEqual([old.name, old.role, old.stats, old.level, old.xp, old.wage, old.rare])
      if (s.role === 'technician') {
        const set = nonZero(s.tiers)
        expect(set.length).toBe(1)
        expect(set[0][1]).toBe(1)
        expect(v9.services).toContain(set[0][0])
      } else expect(s.tiers).toEqual(noTiers())
      expect(s.study).toBeNull()
    })
    expect(sim.staff.some(s => s.role === 'technician')).toBe(true)
  })

  it('gives v9 candidates a specialty by the new-candidate rule', () => {
    const sim = open(v9)
    expect(sim.candidates.map(c => c.stats)).toEqual(v9.candidates.map(c => c.stats))
    for (const c of sim.candidates) {
      if (c.role === 'technician') {
        const set = nonZero(c.tiers)
        expect(set.length).toBe(1)
        expect(set[0][1]).toBe(c.rare ? 2 : 1)
        expect(BASIC_SERVICES).toContain(set[0][0])
      } else expect(c.tiers).toEqual(noTiers())
    }
  })

  it('draws the same specialties every time the same save is opened', () => {
    const a = open(v9)
    const b = open(v9)
    expect(a.staff.map(s => s.tiers)).toEqual(b.staff.map(s => s.tiers))
    expect(a.candidates.map(c => c.tiers)).toEqual(b.candidates.map(c => c.tiers))
    a.advance(30_000)
    b.advance(30_000)
    expect(a.toSave()).toEqual(b.toSave())
  })

  it('opens every older save with a specialty on each technician', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9]) {
      const sim = open(raw)
      for (const s of sim.staff.filter(s => s.role === 'technician')) {
        const set = nonZero(s.tiers)
        expect(set.length).toBe(1)
        expect(set[0][1]).toBe(1)
        expect(sim.services).toContain(set[0][0])
      }
    }
  })

  it('keeps tiers and a pending course through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const tech = hireStaff(sim, 'technician', undefined, { shampoo: 2, mask: 1, massage: 0 })
    tech.study = { course: 'mask', paid: 200000 }
    const rec = hireStaff(sim, 'receptionist')
    rec.study = { course: 'greet', paid: 50000 }
    expect(viaJson(sim).toSave()).toEqual(sim.toSave())
    expect(sim.toSave().staff[0].tiers).toEqual({ shampoo: 2, mask: 1, massage: 0, steam: 0, stone: 0, mud: 0 })
  })

  it('repairs damaged tiers and courses field by field', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    hireStaff(sim, 'receptionist')
    const raw = JSON.parse(JSON.stringify(sim.toSave()))
    const [t1, t2, t3, r1] = raw.staff
    t1.tiers = { shampoo: 7, mask: -1, massage: 'x' }
    t1.study = { course: 'mask', paid: -3 }
    t2.study = { course: 'nails', paid: 5 }
    t3.study = { course: 'greet', paid: 50000 }
    r1.tiers = { shampoo: 2 }
    r1.study = { course: 'greet', paid: 50000 }
    const out = parseSave(raw).staff
    expect(out[0].tiers).toEqual({ shampoo: 3, mask: 0, massage: 0, steam: 0, stone: 0, mud: 0 })
    expect(out[3].tiers).toEqual(noTiers())
    expect(out.slice(0, 3).map(s => s.study)).toEqual([null, null, null])
    expect(out[3].study).toEqual({ course: 'greet', paid: 50000 })
  })
})

describe('save version 11', () => {
  const fits = (p: { role: string; trait: string }) => (p.role === 'receptionist' ? RECEPTIONIST_TRAITS : TRAIT_IDS).includes(p.trait as never)

  it('opens a v10 shop with a trait for everyone and nothing else changed', () => {
    const sim = open(v10)
    expect(sim.staff.length).toBe(v10.staff.length)
    sim.staff.forEach((s, i) => {
      const old = v10.staff[i]
      expect([s.name, s.role, s.stats, s.level, s.xp, s.wage, s.tiers, s.study]).toEqual([old.name, old.role, old.stats, old.level, old.xp, old.wage, { ...old.tiers, steam: 0, stone: 0, mud: 0 }, old.study])
      expect(fits(s)).toBe(true)
    })
    expect(sim.candidates.length).toBe(v10.candidates.length)
    sim.candidates.forEach((c, i) => {
      expect([c.stats, c.tiers]).toEqual([v10.candidates[i].stats, { ...v10.candidates[i].tiers, steam: 0, stone: 0, mud: 0 }])
      expect(fits(c)).toBe(true)
    })
  })

  it('draws the same traits every time the same save is opened', () => {
    const a = open(v10)
    const b = open(v10)
    expect(a.staff.map(s => s.trait)).toEqual(b.staff.map(s => s.trait))
    expect(a.candidates.map(c => c.trait)).toEqual(b.candidates.map(c => c.trait))
    a.advance(30_000)
    b.advance(30_000)
    expect(a.toSave()).toEqual(b.toSave())
  })

  it('opens every older save with a fitting trait on everyone', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10]) {
      const sim = open(raw)
      expect([...sim.staff, ...sim.candidates].every(fits)).toBe(true)
    }
  })

  it('keeps traits through a round trip', () => {
    const sim = open(v10)
    const tech = sim.staff.find(s => s.role === 'technician')!
    tech.trait = 'calm'
    const copy = viaJson(sim)
    expect(copy.staff.find(s => s.id === tech.id)!.trait).toBe('calm')
    expect(copy.staff.map(s => s.trait)).toEqual(sim.staff.map(s => s.trait))
    expect(copy.candidates.map(c => c.trait)).toEqual(sim.candidates.map(c => c.trait))
  })

  it('redraws a damaged trait', () => {
    const raw = structuredClone(v10) as any
    const tech = raw.staff.find((s: any) => s.role === 'technician')
    const desk = raw.staff.find((s: any) => s.role === 'receptionist')
    tech.trait = 'grumpy'
    desk.trait = 'deft'
    delete raw.candidates[0].trait
    const sim = open(raw)
    expect(TRAIT_IDS).toContain(sim.staff.find(s => s.id === tech.id)!.trait)
    expect(RECEPTIONIST_TRAITS).toContain(sim.staff.find(s => s.id === desk.id)!.trait)
    expect(TRAIT_IDS).toContain(sim.candidates[0].trait)
  })
})

describe('late and chatting tasks', () => {
  const withTask = (task: unknown) => {
    const raw = structuredClone(v10) as any
    raw.staff.find((s: any) => s.role === 'technician').task = task
    return open(raw).staff.find(s => s.role === 'technician')!.task
  }

  it('keeps a late or chatting task through a round trip', () => {
    expect(withTask({ kind: 'late', untilMinute: 510 })).toEqual({ kind: 'late', untilMinute: 510 })
    expect(withTask({ kind: 'chat', leftMs: 1234 })).toEqual({ kind: 'chat', leftMs: 1234 })
  })

  it('drops a damaged late or chat task', () => {
    expect(withTask({ kind: 'late', untilMinute: 'soon' })).toBeNull()
    expect(withTask({ kind: 'chat' })).toBeNull()
  })

  it('caps a huge late or chat number and drops a negative or infinite one', () => {
    expect(withTask({ kind: 'late', untilMinute: 1e9 })).toEqual({ kind: 'late', untilMinute: DAY_START_MIN + LATE_MIN })
    expect(withTask({ kind: 'chat', leftMs: 1e9 })).toEqual({ kind: 'chat', leftMs: CHAT_MS_MAX })
    expect(withTask({ kind: 'late', untilMinute: -5 })).toBeNull()
    expect(withTask({ kind: 'chat', leftMs: -1 })).toBeNull()
    expect(withTask({ kind: 'late', untilMinute: null })).toBeNull() // Infinity becomes null in JSON
    expect(withTask({ kind: 'chat', leftMs: Infinity })).toBeNull()
  })
})

describe('the recipe book', () => {
  const withRecipes = (recipes: unknown) => {
    const raw = structuredClone(v11) as any
    raw.recipes = recipes
    return open(raw).recipes
  }

  it('keeps solved, tries and heard through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.recipes.steam = { solved: false, tries: [{ mix: ['pomelo', 'salt', 'honey'], right: 1 }], heard: ['lemongrass'] }
    expect(viaJson(sim).recipes).toEqual(sim.recipes)
    sim.recipes.steam.solved = true
    expect(viaJson(sim).recipes).toEqual(sim.recipes)
  })

  it('opens a v11 shop with an empty book, fresh herbs and no steam tier, and nothing else changed', () => {
    const raw = v11 as any
    const sim = open(raw)
    const saved = sim.toSave() as any
    for (const key of Object.keys(raw)) {
      // candidates are redrawn on load, so their day moves with them
      if (['v', 'stock', 'staff', 'candidates', 'candidatesDay', 'recipes'].includes(key)) continue
      expect([key, saved[key]]).toEqual([key, raw[key]])
    }
    expect(saved.v).toBe(12)
    expect(sim.recipes).toEqual(emptyRecipes())
    expect(saved.stock).toEqual({ ...raw.stock, herbs: 20, mud: 20 })
    const parsed = parseSave(structuredClone(raw))
    expect(parsed.staff.length).toBe(raw.staff.length)
    for (const p of [...parsed.staff, ...parsed.candidates]) expect(p.tiers.steam).toBe(0)
    expect(sim.staff.find(s => s.study)!.study).toEqual(raw.staff.find((s: any) => s.study).study)
  })

  it('opens every older save with empty recipes', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10]) expect(open(raw).recipes).toEqual(emptyRecipes())
  })

  it('drops a try with two items, an unknown ingredient or a repeat', () => {
    const tries = [
      { mix: ['pomelo', 'salt'], right: 1 },
      { mix: ['pomelo', 'salt', 'pepper'], right: 1 },
      { mix: ['pomelo', 'pomelo', 'salt'], right: 1 },
      { mix: ['pomelo', 'salt', 'honey'], right: 1 },
    ]
    expect(withRecipes({ steam: { solved: false, tries, heard: [] } }).steam.tries).toEqual([{ mix: ['pomelo', 'salt', 'honey'], right: 1 }])
  })

  it('recomputes a right count that disagrees', () => {
    expect(withRecipes({ steam: { solved: false, tries: [{ mix: ['pomelo', 'salt', 'honey'], right: 3 }], heard: [] } }).steam.tries[0].right).toBe(1)
  })

  it('drops a heard ingredient that is not one of the hints', () => {
    expect(withRecipes({ steam: { solved: false, tries: [], heard: ['lemongrass', 'ginger', 'salt', 'lemongrass', 'x'] } }).steam.heard).toEqual(['lemongrass'])
  })

  it('marks a recipe solved by a try with all three right, or by an open service', () => {
    expect(withRecipes({ steam: { solved: false, tries: [{ mix: ['ginger', 'pomelo', 'lemongrass'], right: 0 }], heard: [] } }).steam.solved).toBe(true)
    const raw = structuredClone(v11) as any
    raw.services = [...raw.services, 'steam']
    expect(open(raw).recipes.steam.solved).toBe(true)
  })

  it('turns a non-object recipes into an empty book', () => {
    for (const bad of [undefined, null, 5, 'steam', [1]]) expect(withRecipes(bad)).toEqual(emptyRecipes())
    expect(withRecipes({ steam: 7 })).toEqual(emptyRecipes())
  })
})
