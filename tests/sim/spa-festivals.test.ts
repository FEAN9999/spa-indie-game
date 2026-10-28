import { describe, expect, it } from 'vitest'
import { FESTIVAL_PATIENCE, FESTIVAL_PRICE, SERVICE_PRICE, VIP_PRICE_FACTOR } from '../../src/config'
import { KINDS } from '../../src/sim/customers'
import { tipFor } from '../../src/sim/economy'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { ownerServes } from './helpers'

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

/** Mask open with one mask chair, before the month's quest is rolled. */
const withMask = (sim: SpaSim) => {
  sim.money = 1_000_000
  sim.openService('mask')
  sim.buy('maskBed', 6, 2, false)
}

describe('a festival month', () => {
  it('has a festival service only in a festival', () => {
    expect(on(37).festivalServiceToday()).toBe('shampoo')
    expect(on(46).festivalServiceToday()).toBeNull()
  })

  it('brings customers closer together only in a festival', () => {
    expect(on(37).eventArrivalFactor()).toBe(0.8)
    expect(on(46).eventArrivalFactor()).toBe(1)
  })

  it('charges the festival service 20% more, and tips on that price', () => {
    const price = SERVICE_PRICE.shampoo
    const festive = ownerServes(on(37), 3, { kind: 'office', service: 'shampoo' })
    expect(festive.amount).toBe(price * FESTIVAL_PRICE)
    expect(festive.tip).toBe(Math.round(tipFor(price * FESTIVAL_PRICE, 3) * KINDS.office.tip[2]))
    expect(ownerServes(on(46), 3, { kind: 'office', service: 'shampoo' }).amount).toBe(price)
  })

  it('charges a VIP her usual price', () => {
    expect(ownerServes(on(37), 3, { vip: 'singer', service: 'shampoo' }).amount).toBe(SERVICE_PRICE.shampoo * VIP_PRICE_FACTOR)
  })

  it('makes new customers but not VIPs wait longer', () => {
    const plain = (day: number) => on(day).spawnCustomer({ kind: 'office', service: 'shampoo' }).patienceMaxMs
    expect(Math.abs(plain(37) - plain(46) * FESTIVAL_PATIENCE)).toBeLessThanOrEqual(1)
    const vip = (day: number) => on(day).spawnCustomer({ vip: 'singer' }).patienceMaxMs
    expect(vip(37)).toBe(vip(46))
  })

  it('sends about half the plain customers to the festival service, and regulars to their own', () => {
    const sim = on(40, withMask)
    expect(sim.festivalServiceToday()).toBe('mask')
    const asks = Array.from({ length: 400 }, () => sim.spawnCustomer().service)
    const share = asks.filter(s => s === 'mask').length / asks.length
    expect(share).toBeGreaterThan(0.5)
    expect(share).toBeLessThan(0.85)
    expect(sim.spawnCustomer({ regular: 'vy' }).service).toBe('shampoo')
  })

  it('never draws the festival service when it has no bed', () => {
    const sim = on(40, withMask)
    sim.sell(sim.items.find(i => i.kind === 'maskBed')!.id)
    expect(sim.festivalServiceToday()).toBe('mask')
    for (let i = 0; i < 200; i++) expect(sim.spawnCustomer().service).toBe('shampoo')
  })

  it("keeps the month's festival service when a closer one opens mid-month", () => {
    const sim = on(40)
    expect(sim.festivalServiceToday()).toBe('shampoo')
    withMask(sim)
    expect(sim.festivalServiceToday()).toBe('shampoo')
  })
})
