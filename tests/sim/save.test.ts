import { describe, expect, it } from 'vitest'
import { DAY_START_MIN, PATIENCE_MS, RATING_WINDOW, SHAMPOO_PRICE } from '../../src/config'
import { tipFor } from '../../src/sim/economy'
import { createRng } from '../../src/sim/rng'
import { DEFAULT_OWNER_LOOK } from '../../src/sim/profile'
import { parseSave, SaveError } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import { HINT_IDS } from '../../src/sim/types'
import v1 from '../fixtures/save-v1.json'
import { advanceUntil, busyShop, startService } from './helpers'

const opts = () => ({ rng: createRng(2), autoSpawn: false })
const viaJson = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())

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
    expect(() => SpaSim.fromSave({ ...good, seatCustomers: [null] }, opts())).toThrow(SaveError)
  })
})

describe('save version 2', () => {
  it('opens a shop saved before owners and names as the same shop, with the default owner and no tutorial', () => {
    const data = parseSave(structuredClone(v1))
    expect([data.v, data.shopName, data.ownerLook, data.profileDone]).toEqual([2, 'Tiệm Spa', DEFAULT_OWNER_LOOK, false])
    expect(data.hints).toEqual([...HINT_IDS])
    expect(data.customers.map(c => c.patienceMaxMs)).toEqual(v1.customers.map(() => PATIENCE_MS))
    const sim = SpaSim.fromSave(data, opts())
    expect([sim.day, sim.money, sim.customers.length]).toEqual([v1.day, v1.money, v1.customers.length])
    expect(sim.toSave().v).toBe(2)
  })

  it('still reopens the mini-game of an upgraded shop', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = startService(sim)
    const old = { ...sim.toSave(), v: 1 } as Record<string, unknown>
    for (const k of ['shopName', 'ownerLook', 'profileDone', 'hints']) delete old[k]
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
})
