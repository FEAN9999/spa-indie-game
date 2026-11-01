import { STOCK_START } from '../config'
import type { StringKey } from '../strings/vi'
import { drawBanhXeoTicket, type BanhXeoTicket } from './banhXeo'
import { drawBunChaTicket, type BunChaTicket } from './bunCha'
import { drawCheTicket, type CheTicket } from './che'
import { drawPhoTicket, type PhoTicket } from './pho'
import type { Rng } from './rng'

export type DishId = 'pho' | 'banhXeo' | 'che' | 'bunCha'
/** The dishes every restaurant has from the day it is bought. */
export const BASE_DISHES: readonly DishId[] = ['pho', 'banhXeo', 'che']
/** The dishes the owner puts on the menu by paying for them once, in the order the menu lists them. */
export type ExtraDish = 'bunCha'
export const EXTRA_DISHES: readonly ExtraDish[] = ['bunCha']
export const DISH_IDS: readonly DishId[] = [...BASE_DISHES, ...EXTRA_DISHES]
export const isExtraDish = (d: DishId): d is ExtraDish => (EXTRA_DISHES as readonly DishId[]).includes(d)

export type DishTicket = PhoTicket | BanhXeoTicket | CheTicket | BunChaTicket

export type RestaurantStockItem = 'phoKit' | 'batter' | 'cheKit' | 'chaKit' | 'herbs'
export const RESTAURANT_STOCK_ITEMS: readonly RestaurantStockItem[] = ['phoKit', 'batter', 'cheKit', 'chaKit', 'herbs']

/** The item each dish uses up; every dish also uses one herbs. */
export const DISH_STOCK: Record<DishId, Exclude<RestaurantStockItem, 'herbs'>> = { pho: 'phoKit', banhXeo: 'batter', che: 'cheKit', bunCha: 'chaKit' }

/** The stock items the dishes `menu` use, and the herbs, in the menu's order. */
export const stockItemsForMenu = (menu: readonly DishId[]): RestaurantStockItem[] => RESTAURANT_STOCK_ITEMS.filter(item => item === 'herbs' || menu.some(d => DISH_STOCK[d] === item))

export type RestaurantStock = Record<RestaurantStockItem, number>

/** What a newly bought restaurant starts with: STOCK_START of each item. */
export const fullRestaurantStock = (): RestaurantStock => ({ phoKit: STOCK_START, batter: STOCK_START, cheKit: STOCK_START, chaKit: STOCK_START, herbs: STOCK_START })

/** A ticket for `dish`, drawn with that dish's own rolls. */
export function drawTicket(dish: DishId, rng: Rng, hard: boolean): DishTicket {
  if (dish === 'pho') return drawPhoTicket(rng, hard)
  if (dish === 'banhXeo') return drawBanhXeoTicket(rng, hard)
  if (dish === 'bunCha') return drawBunChaTicket(rng, hard)
  return drawCheTicket(rng, hard)
}

export const DISH_NAME: Record<DishId, StringKey> = { pho: 'dishPho', banhXeo: 'dishBanhXeo', che: 'dishChe', bunCha: 'dishBunCha' }

export const RSTOCK_NAME: Record<RestaurantStockItem, StringKey> = { phoKit: 'rstockPhoKit', batter: 'rstockBatter', cheKit: 'rstockCheKit', chaKit: 'rstockChaKit', herbs: 'rstockHerbs' }
