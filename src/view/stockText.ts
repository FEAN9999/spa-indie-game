import { RSTOCK_NAME, type RestaurantStockItem } from '../sim/menu'
import { STOCK_NAME, type StockItem } from '../sim/stock'
import { t } from '../strings/vi'

/** One "sắp hết" line for every item that ran low at once: "Dầu gội, khăn sắp hết". */
export function stockLowText(items: StockItem[]): string {
  const names = items.map((item, i) => (i === 0 ? t(STOCK_NAME[item]) : t(STOCK_NAME[item]).toLocaleLowerCase('vi')))
  return t('stockLow', { item: names.join(', ') })
}

/** One toast for the restaurant items that ran low or out in one step: the ones out win, the rest get theirs when they run out. */
export function restaurantStockText(events: { item: RestaurantStockItem; out: boolean }[]): string | null {
  const out = events.filter(e => e.out)
  const shown = out.length > 0 ? out : events
  if (shown.length === 0) return null
  const names = shown.map(e => t(RSTOCK_NAME[e.item]))
  if (out.length > 0) return t('menuStockOut', { item: names.map(n => n.toLocaleLowerCase('vi')).join(', ') })
  return t('stockLow', { item: names.map((n, i) => (i === 0 ? n : n.toLocaleLowerCase('vi'))).join(', ') })
}
