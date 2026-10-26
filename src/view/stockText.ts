import { STOCK_NAME, type StockItem } from '../sim/stock'
import { t } from '../strings/vi'

/** One "sắp hết" line for every item that ran low at once: "Dầu gội, khăn sắp hết". */
export function stockLowText(items: StockItem[]): string {
  const names = items.map((item, i) => (i === 0 ? t(STOCK_NAME[item]) : t(STOCK_NAME[item]).toLocaleLowerCase('vi')))
  return t('stockLow', { item: names.join(', ') })
}
