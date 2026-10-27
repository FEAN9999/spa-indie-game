import { STOCK_START } from '../config'
import type { StringKey } from '../strings/vi'
import type { ServiceId } from './services'

export type StockItem = 'shampoo' | 'towel' | 'mask' | 'oil' | 'herbs'

/** Every item, in the order the stock panel lists them. */
export const STOCK_ITEMS: StockItem[] = ['shampoo', 'towel', 'mask', 'oil', 'herbs']

/** What one customer of a service uses: the service's own item first, then a towel. */
export const STOCK_USES: Record<ServiceId, StockItem[]> = {
  shampoo: ['shampoo', 'towel'],
  mask: ['mask', 'towel'],
  massage: ['oil', 'towel'],
  steam: ['herbs', 'towel'],
}

export const STOCK_NAME: Record<StockItem, StringKey> = {
  shampoo: 'stockShampoo',
  towel: 'stockTowel',
  mask: 'stockMask',
  oil: 'stockOil',
  herbs: 'stockHerbs',
}

/** A shop's first stock: the same of every item. */
export const fullStock = (): Record<StockItem, number> => ({ shampoo: STOCK_START, towel: STOCK_START, mask: STOCK_START, oil: STOCK_START, herbs: STOCK_START })
