import { STOCK_START } from '../config'
import type { StringKey } from '../strings/vi'
import { drawBanhXeoTicket, type BanhXeoTicket } from './banhXeo'
import { drawCheTicket, type CheTicket } from './che'
import { drawPhoTicket, type PhoTicket } from './pho'
import type { Rng } from './rng'

export type DishId = 'pho' | 'banhXeo' | 'che'
export const DISH_IDS: readonly DishId[] = ['pho', 'banhXeo', 'che']

export type DishTicket = PhoTicket | BanhXeoTicket | CheTicket

export type RestaurantStockItem = 'phoKit' | 'batter' | 'cheKit' | 'herbs'
export const RESTAURANT_STOCK_ITEMS: readonly RestaurantStockItem[] = ['phoKit', 'batter', 'cheKit', 'herbs']

/** The item each dish uses up; every dish also uses one herbs. */
export const DISH_STOCK: Record<DishId, Exclude<RestaurantStockItem, 'herbs'>> = { pho: 'phoKit', banhXeo: 'batter', che: 'cheKit' }

export type RestaurantStock = Record<RestaurantStockItem, number>

/** What a newly bought restaurant starts with: STOCK_START of each item. */
export const fullRestaurantStock = (): RestaurantStock => ({ phoKit: STOCK_START, batter: STOCK_START, cheKit: STOCK_START, herbs: STOCK_START })

/** A ticket for `dish`, drawn with that dish's own rolls. */
export function drawTicket(dish: DishId, rng: Rng, hard: boolean): DishTicket {
  if (dish === 'pho') return drawPhoTicket(rng, hard)
  if (dish === 'banhXeo') return drawBanhXeoTicket(rng, hard)
  return drawCheTicket(rng, hard)
}

export const DISH_NAME: Record<DishId, StringKey> = { pho: 'dishPho', banhXeo: 'dishBanhXeo', che: 'dishChe' }

export const RSTOCK_NAME: Record<RestaurantStockItem, StringKey> = { phoKit: 'rstockPhoKit', batter: 'rstockBatter', cheKit: 'rstockCheKit', herbs: 'rstockHerbs' }
