import { describe, expect, it } from 'vitest'
import { BUSTLE_PIECES } from '../../src/config'
import { BUSTLE_IDS, BUSTLE_SCORE_MAX, bustleArrivalFactor, bustlePercent, bustleScore, type BustleId } from '../../src/sim/bustle'
import { Chain } from '../../src/sim/chain'
import { advanceUntil, restaurantFor, starShop } from './helpers'

/** A main shop with its restaurant bought and `money` left in the purse. */
function withRestaurant(money: number): Chain {
  const chain = new Chain(starShop(3, 40_000_000), 7)
  if (chain.buyRestaurant()) throw new Error('no restaurant')
  chain.main.money = money
  return chain
}

describe("the street's pieces", () => {
  it('add up to 30, the eight costing 44.900.000 đ in all', () => {
    expect(BUSTLE_IDS).toHaveLength(8)
    expect(BUSTLE_SCORE_MAX).toBe(30)
    expect(BUSTLE_IDS.reduce((sum, id) => sum + BUSTLE_PIECES[id].price, 0)).toBe(44_900_000)
    expect(bustleScore(['park', 'lamps'])).toBe(8)
    expect(bustleScore([])).toBe(0)
  })

  it('leave the gap between customers exactly as it was at 0, and 15% shorter at 30', () => {
    expect(bustleArrivalFactor(0)).toBe(1)
    expect(bustleArrivalFactor(30)).toBeCloseTo(0.85, 10)
    expect(bustleArrivalFactor(12)).toBeCloseTo(0.94, 10)
    expect(bustlePercent(12)).toBeCloseTo(6, 10)
    expect(bustlePercent(3)).toBeCloseTo(1.5, 10)
  })
})

describe('buying a piece', () => {
  it('is locked until the restaurant is bought', () => {
    const chain = new Chain(starShop(3, 40_000_000), 7)
    expect(chain.bustleOpen()).toBe(false)
    expect(chain.buyBustle('trees')).toBe('locked')
    expect([chain.main.money, chain.main.bustle]).toEqual([40_000_000, []])
  })

  it('takes the price once and puts the piece on the street', () => {
    const chain = withRestaurant(3_000_000)
    expect(chain.bustleOpen()).toBe(true)
    expect(chain.buyBustle('banhMi')).toBeNull()
    expect([chain.main.money, chain.main.bustle]).toEqual([500_000, ['banhMi']])
    expect(chain.buyBustle('banhMi')).toBe('owned')
    expect(chain.main.money).toBe(500_000)
  })

  it('is refused when the purse is short, taking nothing', () => {
    const chain = withRestaurant(899_999)
    expect(chain.bustleProblem('benches')).toBe('money')
    expect(chain.buyBustle('benches')).toBe('money')
    expect([chain.main.money, chain.main.bustle]).toEqual([899_999, []])
    chain.main.money = 900_000
    expect(chain.buyBustle('benches')).toBeNull()
    expect(chain.main.money).toBe(0)
  })

  it('stays on the main shop: a branch has no street and its customers come as before', () => {
    const chain = withRestaurant(60_000_000)
    for (const id of BUSTLE_IDS) expect(chain.buyBustle(id)).toBeNull()
    expect(chain.main.money).toBe(15_100_000)
    expect(chain.main.bustleArrivalFactor()).toBeCloseTo(0.85, 10)
    expect(chain.open('beach')).toBeNull()
    const beach = chain.shop('beach')!
    expect(beach.bustle).toEqual([])
    expect(beach.bustleArrivalFactor()).toBe(1)
  })
})

describe('customers on a busier street', () => {
  /** The gap the main spa draws after its first customer, on the same stream, with `bought` on the street. */
  const spaGap = (seed: number, bought: BustleId[]): number => {
    const sim = starShop(3, 0, seed, true)
    sim.bustle = [...bought]
    advanceUntil(sim, () => sim.customers.length > 0)
    return sim.toSave().untilArrivalMs
  }

  /** The gap the restaurant draws after its first walk-in is due, on the same stream, with `bought` on the street. */
  const dinerGap = (seed: number, bought: BustleId[]): number => {
    const main = starShop(3, 10_000_000)
    main.bustle = [...bought]
    const r = restaurantFor(main, { seed, autoSpawn: true })
    r.advance(3_050)
    return r.toSave().untilArrivalMs
  }

  it('come sooner at the main spa, never later', () => {
    let plain = 0
    let busy = 0
    for (let seed = 1; seed <= 8; seed++) {
      const a = spaGap(seed, [])
      const b = spaGap(seed, [...BUSTLE_IDS])
      expect(b).toBeLessThanOrEqual(a)
      plain += a
      busy += b
    }
    expect(busy).toBeLessThan(plain * 0.95)
  })

  it('walk in sooner at the restaurant, never later', () => {
    let plain = 0
    let busy = 0
    for (let seed = 1; seed <= 8; seed++) {
      const a = dinerGap(seed, [])
      const b = dinerGap(seed, [...BUSTLE_IDS])
      expect(b).toBeLessThanOrEqual(a)
      plain += a
      busy += b
    }
    expect(busy).toBeLessThan(plain * 0.95)
  })

  it('draw exactly the same gaps with nothing bought', () => {
    for (let seed = 1; seed <= 4; seed++) {
      expect(spaGap(seed, [])).toBe(spaGap(seed, []))
      expect(dinerGap(seed, [])).toBe(dinerGap(seed, []))
    }
  })
})
