import { describe, expect, it } from 'vitest'
import { Chain } from '../../src/sim/chain'
import { parseSave } from '../../src/sim/save'
import v24 from '../fixtures/save-v24.json'
import { starShop } from './helpers'

const TWO_HOURS = 2 * 3_600_000

/** A chain with the beach and the old town open, each shop's book set as given. */
function shops(main: boolean, beach: boolean, oldTown = false) {
  const chain = new Chain(starShop(4), 7)
  expect(chain.open('beach')).toBeNull()
  expect(chain.open('oldTown')).toBeNull()
  chain.main.away = { profits: [300_000], ok: main, tipSeen: false }
  chain.shop('beach')!.away = { profits: [200_000], ok: beach, tipSeen: false }
  chain.shop('oldTown')!.away = { profits: [100_000], ok: oldTown, tipSeen: false }
  return chain
}

describe('Chain.comeBack', () => {
  it('pays every shop whose book is ok into the one purse', () => {
    const chain = shops(true, true)
    const money = chain.main.money
    const r = chain.comeBack(TWO_HOURS)
    expect(r.paid).toBe(250_000)
    expect(chain.main.money).toBe(money + 250_000)
    expect(r.places).toEqual([null, 'beach'])
    expect(r.profit).toBe(500_000)
    expect(r.capped).toBe(false)
  })
  it('pays a branch alone', () => {
    const r = shops(false, true).comeBack(TWO_HOURS)
    expect(r.places).toEqual(['beach'])
    expect(r.profit).toBe(200_000)
    expect(r.days).toBe(1)
    expect(r.paid).toBe(100_000)
  })
  it('pays nothing when no shop qualifies', () => {
    const r = shops(false, false).comeBack(TWO_HOURS)
    expect(r.paid).toBe(0)
    expect(r.places).toEqual([])
  })
  it('keeps the tip when nobody paid, and drops it when a branch did', () => {
    const paid = shops(false, true)
    expect(paid.comeBack(TWO_HOURS).tip).toBe(false)
    expect(paid.main.away.tipSeen).toBe(false)
    const none = shops(false, false)
    expect(none.comeBack(TWO_HOURS).tip).toBe(true)
    expect(none.main.away.tipSeen).toBe(true)
  })
  it('never gives the chain a tip for a branch', () => {
    const chain = shops(true, false)
    expect(chain.comeBack(TWO_HOURS).tip).toBe(false)
  })
  it('pays the main shop and the beach of the v24 fixture', () => {
    const chain = Chain.fromSave(parseSave(structuredClone(v24)), 8)
    expect(chain.comeBack(TWO_HOURS).places).toEqual([null, 'beach'])
  })
})
