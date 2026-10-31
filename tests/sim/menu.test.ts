import { describe, expect, it } from 'vitest'
import { DISH_PRICE, STOCK_START } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { DISH_IDS, DISH_STOCK, drawTicket, fullRestaurantStock, RESTAURANT_STOCK_ITEMS } from '../../src/sim/menu'

describe('menu', () => {
  it('maps each dish to its own stock item', () => {
    expect(DISH_STOCK).toEqual({ pho: 'phoKit', banhXeo: 'batter', che: 'cheKit' })
    expect(DISH_IDS.map(d => DISH_STOCK[d])).toEqual(['phoKit', 'batter', 'cheKit'])
  })

  it('starts a bought restaurant with STOCK_START of everything', () => {
    const stock = fullRestaurantStock()
    expect(Object.keys(stock).sort()).toEqual([...RESTAURANT_STOCK_ITEMS].sort())
    for (const item of RESTAURANT_STOCK_ITEMS) expect(stock[item]).toBe(STOCK_START)
  })

  it("draws each dish's own ticket", () => {
    const rng = createRng(7)
    expect(drawTicket('che', rng, false)).toHaveProperty('mix')
    expect(drawTicket('che', rng, false)).toHaveProperty('ice')
    expect(drawTicket('banhXeo', rng, false)).toHaveProperty('filling')
    expect(drawTicket('pho', rng, false)).toHaveProperty('doneness')
  })

  it('prices the dishes from §10', () => {
    expect(DISH_PRICE).toEqual({ pho: 30_000, banhXeo: 28_000, che: 18_000 })
  })
})
