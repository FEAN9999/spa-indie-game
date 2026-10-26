import type { DayStats } from '../sim/types'
import type { StringKey } from '../strings/vi'

export interface SummaryRow {
  label: StringKey
  value: number
  kind: 'count' | 'money' | 'heading'
}

/** The day's rows on the end-of-day card: guests, Thu, Chi (only when there was any) and the profit. */
export function summaryRows(stats: DayStats): SummaryRow[] {
  const rows: SummaryRow[] = [
    { label: 'served', value: stats.served, kind: 'count' },
    { label: 'leftUnhappy', value: stats.angry + stats.walkedAway, kind: 'count' },
    { label: 'summaryIn', value: 0, kind: 'heading' },
    { label: 'income', value: stats.income, kind: 'money' },
    { label: 'tips', value: stats.tips, kind: 'money' },
  ]
  if (stats.wages > 0 || stats.restock > 0) {
    rows.push({ label: 'summaryOut', value: 0, kind: 'heading' })
    if (stats.wages > 0) rows.push({ label: 'wages', value: -stats.wages, kind: 'money' })
    if (stats.restock > 0) rows.push({ label: 'restockCost', value: -stats.restock, kind: 'money' })
  }
  rows.push({ label: 'profit', value: stats.income + stats.tips - stats.wages - stats.restock, kind: 'money' })
  return rows
}
