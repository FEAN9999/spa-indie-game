import { describe, expect, it } from 'vitest'
import { DISH_PRICE, STOCK_START } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { BASE_DISHES, DISH_IDS, DISH_STOCK, drawTicket, EXTRA_DISHES, fullRestaurantStock, RESTAURANT_STOCK_ITEMS, stockItemsForMenu } from '../../src/sim/menu'

describe('menu', () => {
  it('maps each dish to its own stock item', () => {
    expect(DISH_STOCK).toEqual({ pho: 'phoKit', banhXeo: 'batter', che: 'cheKit', bunCha: 'chaKit', goiCuon: 'cuonKit' })
    expect(DISH_IDS.map(d => DISH_STOCK[d])).toEqual(['phoKit', 'batter', 'cheKit', 'chaKit', 'cuonKit'])
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
    expect(drawTicket('bunCha', rng, false)).toHaveProperty('grill')
    expect(drawTicket('goiCuon', rng, false)).toHaveProperty('filling')
  })

  it('prices the dishes from §10', () => {
    expect(DISH_PRICE).toEqual({ pho: 30_000, banhXeo: 28_000, che: 18_000, bunCha: 35_000, goiCuon: 25_000 })
  })

  it('lists the first three dishes, then Bún chả and Gỏi cuốn, which are bought', () => {
    expect(BASE_DISHES).toEqual(['pho', 'banhXeo', 'che'])
    expect(EXTRA_DISHES).toEqual(['bunCha', 'goiCuon'])
    expect(DISH_IDS).toEqual(['pho', 'banhXeo', 'che', 'bunCha', 'goiCuon'])
  })

  it('names the stock a menu uses, with the herbs, in the menu order', () => {
    expect(stockItemsForMenu(BASE_DISHES)).toEqual(['phoKit', 'batter', 'cheKit', 'herbs'])
    expect(stockItemsForMenu([...BASE_DISHES, 'bunCha'])).toEqual(['phoKit', 'batter', 'cheKit', 'chaKit', 'herbs'])
    expect(stockItemsForMenu(DISH_IDS)).toEqual(['phoKit', 'batter', 'cheKit', 'chaKit', 'cuonKit', 'herbs'])
  })
})
