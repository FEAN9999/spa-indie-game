import { describe, expect, it } from 'vitest'
import { DAY_START_MIN, PATIENCE_MS, RATING_WINDOW, SHAMPOO_PRICE } from '../../src/config'
import { tipFor } from '../../src/sim/economy'
import { DEFAULT_ITEMS } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import { DEFAULT_OWNER_LOOK } from '../../src/sim/profile'
import { parseSave, SaveError, SaveTooNewError } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import { TUTORIAL_HINTS } from '../../src/sim/types'
import v1 from '../fixtures/save-v1.json'
import v2 from '../fixtures/save-v2.json'
import { advanceUntil, busyShop, startService } from './helpers'

const opts = () => ({ rng: createRng(2), autoSpawn: false })
const viaJson = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())
const open = (raw: unknown) => SpaSim.fromSave(parseSave(structuredClone(raw)), opts())

describe('saving the shop', () => {
  it('restores a busy shop exactly and keeps playing it the same way', () => {
    const sim = busyShop()
    const copy = viaJson(sim)
    expect(copy.toSave()).toEqual(sim.toSave())
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
    expect(copy.money).toBe(before + SHAMPOO_PRICE + tipFor(SHAMPOO_PRICE, 3))
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
    expect([data.v, data.shopName, data.ownerLook, data.profileDone]).toEqual([3, 'Tiệm Spa', DEFAULT_OWNER_LOOK, false])
    expect(data.hints).toEqual([...TUTORIAL_HINTS])
    expect(data.customers.map(c => c.patienceMaxMs)).toEqual(v1.customers.map(() => PATIENCE_MS))
    const sim = SpaSim.fromSave(data, opts())
    expect([sim.day, sim.money, sim.customers.length]).toEqual([v1.day, v1.money, v1.customers.length])
    expect(sim.toSave().v).toBe(3)
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
    expect(sim.money).toBe(before + SHAMPOO_PRICE + tipFor(SHAMPOO_PRICE, 3))
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
    expect(sim.money).toBe(before + SHAMPOO_PRICE + tipFor(SHAMPOO_PRICE, 3))
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

  it('keeps the tap hint done but the build badge new for an old shop', () => {
    const sim = open(v1)
    expect(sim.hintDone('tapCustomer')).toBe(true)
    expect(sim.hintDone('openBuild')).toBe(false)
  })

  it('still leaves alone only saves newer than version 3', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(parseSave({ ...good, v: 3 }).v).toBe(3)
    expect(() => parseSave({ ...good, v: 4 })).toThrow(SaveTooNewError)
  })
})
