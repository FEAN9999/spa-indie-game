import { STOCK_START } from '../config'
import type { StringKey } from '../strings/vi'
import type { ServiceId } from './services'

export type StockItem = 'shampoo' | 'towel' | 'mask' | 'oil' | 'herbs' | 'mud' | 'salt'

/** Every item, in the order the stock panel lists them. */
export const STOCK_ITEMS: StockItem[] = ['shampoo', 'towel', 'mask', 'oil', 'herbs', 'mud', 'salt']

/** What one customer of a service uses: the service's own item first, then a towel. */
export const STOCK_USES: Record<ServiceId, StockItem[]> = {
  shampoo: ['shampoo', 'towel'],
  mask: ['mask', 'towel'],
  massage: ['oil', 'towel'],
  steam: ['herbs', 'towel'],
  stone: ['oil', 'towel'],
  mud: ['mud', 'towel'],
  scrub: ['salt', 'towel'],
}

/** The open services whose own item this is; none for the towel, which every service uses. */
export const stockUsers = (item: StockItem, open: readonly ServiceId[]): ServiceId[] => open.filter(id => STOCK_USES[id][0] === item)

/** The items some open service uses, in the order the stock panel lists them. */
export const stockItemsFor = (open: readonly ServiceId[]): StockItem[] => STOCK_ITEMS.filter(item => open.some(id => STOCK_USES[id].includes(item)))

export const STOCK_NAME: Record<StockItem, StringKey> = {
  shampoo: 'stockShampoo',
  towel: 'stockTowel',
  mask: 'stockMask',
  oil: 'stockOil',
  herbs: 'stockHerbs',
  mud: 'stockMud',
  salt: 'stockSalt',
}

/** A shop's first stock: the same of every item. */
export const fullStock = (): Record<StockItem, number> => ({ shampoo: STOCK_START, towel: STOCK_START, mask: STOCK_START, oil: STOCK_START, herbs: STOCK_START, mud: STOCK_START, salt: STOCK_START })
