import { dayProfit } from '../sim/economy'
import type { ChainDayRow } from '../sim/chain'
import type { DayStats } from '../sim/types'
import { t, type StringKey } from '../strings/vi'
import { placeName } from './chain'

export interface SummaryRow {
  label: StringKey
  value: number
  kind: 'count' | 'money' | 'heading'
}

/** The day's rows on the end-of-day card: guests, Thu (gift and quest money only when there was any), Chi (only when there was any) and the profit. */
export function summaryRows(stats: DayStats): SummaryRow[] {
  const rows: SummaryRow[] = [
    { label: 'served', value: stats.served, kind: 'count' },
    { label: 'leftUnhappy', value: stats.angry + stats.walkedAway, kind: 'count' },
    { label: 'summaryIn', value: 0, kind: 'heading' },
    { label: 'income', value: stats.income, kind: 'money' },
    { label: 'tips', value: stats.tips, kind: 'money' },
  ]
  if (stats.gifts > 0) rows.push({ label: 'giftMoney', value: stats.gifts, kind: 'money' })
  if (stats.quests > 0) rows.push({ label: 'questReward', value: stats.quests, kind: 'money' })
  if (stats.wages > 0 || stats.restock > 0) {
    rows.push({ label: 'summaryOut', value: 0, kind: 'heading' })
    if (stats.wages > 0) rows.push({ label: 'wages', value: -stats.wages, kind: 'money' })
    if (stats.restock > 0) rows.push({ label: 'restockCost', value: -stats.restock, kind: 'money' })
  }
  rows.push({ label: 'profit', value: dayProfit(stats), kind: 'money' })
  return rows
}

/** The chain block's rows: each shop's profit under its place name, then the total. */
export function chainSummaryRows(rows: ChainDayRow[]): { label: string; value: number }[] {
  return [
    ...rows.map(r => ({ label: placeName(r.place), value: r.profit })),
    { label: t('summaryChainTotal'), value: rows.reduce((sum, r) => sum + r.profit, 0) },
  ]
}

export interface SummaryLayout {
  top: number
  nameY: number
  titleY: number
  rowsTop: number
  rowH: number
  headingH: number
  chainTop: number
  chainRowH: number
  buttonY: number
  cardH: number
}

const CHAIN_GAP = 24
const CHAIN_PAD = 20

/** Where the end-of-day card's parts sit. With no chain shops it is the card as it always was; with some, a compact card that leaves room for the chain block. */
export function summaryLayout(kinds: SummaryRow['kind'][], chainShops: number, notesH: number): SummaryLayout {
  const chain = chainShops > 0
  const l = chain
    ? { top: 200, nameY: 262, titleY: 340, rowsTop: 410, rowH: 66, headingH: 50, chainRowH: 58 }
    : { top: 420, nameY: 485, titleY: 565, rowsTop: 650, rowH: 90, headingH: 64, chainRowH: 0 }
  const rowsEnd = l.rowsTop + kinds.reduce((sum, k) => sum + (k === 'heading' ? l.headingH : l.rowH), 0)
  const chainTop = rowsEnd + CHAIN_GAP
  // the block: a heading, a row per shop, the total, and some air
  const chainEnd = chain ? chainTop + (chainShops + 2) * l.chainRowH + CHAIN_PAD : rowsEnd
  const buttonY = chainEnd + (notesH ? 20 + notesH : 0) + 95
  return { ...l, chainTop, buttonY, cardH: buttonY + 75 + 60 - l.top }
}
