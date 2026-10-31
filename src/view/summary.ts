import { GAME_H } from '../config'
import { dayProfit } from '../sim/economy'
import type { ChainDayRow } from '../sim/chain'
import type { RestaurantStats } from '../sim/restaurant'
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

/** The restaurant block's rows: the diners, the dish money and the tips, then the cooks' wages and the stock bought when there are any. Its money is in the purse already and stays out of the spa's rows and profit. */
export function restaurantRows(stats: RestaurantStats): { label: StringKey; value: number; kind: 'count' | 'money' }[] {
  return [
    { label: 'restaurantServed', value: stats.served, kind: 'count' },
    { label: 'restaurantIncome', value: stats.income, kind: 'money' },
    { label: 'restaurantTips', value: stats.tips, kind: 'money' },
    ...(stats.wages > 0 ? [{ label: 'restaurantWages' as const, value: stats.wages, kind: 'money' as const }] : []),
    ...(stats.restock > 0 ? [{ label: 'restockCost' as const, value: stats.restock, kind: 'money' as const }] : []),
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
  /** Where the restaurant block starts, under the chain block (or the rows); it is the end of the card's content when there is none. */
  restaurantTop: number
  /** True when the restaurant block is the one-line form (it would not fit as a heading and rows): its box is one row high. */
  restaurantOneLine: boolean
  /** Where the first note under the rows (and the chain block) goes. */
  notesTop: number
  buttonY: number
  cardH: number
}

const CHAIN_GAP = 24
const CHAIN_PAD = 20
/** The one-line restaurant form's gap above it; a little tighter than CHAIN_GAP. */
const ONE_LINE_GAP = 16
/** The lowest the compact card may reach. */
const CARD_BOTTOM = GAME_H - 40

/**
 * Where the end-of-day card's parts sit. With no chain shops it is the card as it always was; with some, a compact card that leaves room for the chain block,
 * moved up over the top bar when its notes would take it past CARD_BOTTOM. A restaurant block (`restaurantRows` rows under a heading) goes after the chain block, on the same compact card;
 * when that would lift the card's top off the screen, the block is one line instead (`restaurantOneLine`).
 */
export function summaryLayout(kinds: SummaryRow['kind'][], chainShops: number, notesH: number, restaurantRows = 0): SummaryLayout {
  const full = layoutOf(kinds, chainShops, notesH, restaurantRows, false)
  return restaurantRows > 0 && full.top < 0 ? layoutOf(kinds, chainShops, notesH, restaurantRows, true) : full
}

function layoutOf(kinds: SummaryRow['kind'][], chainShops: number, notesH: number, restaurantRows: number, oneLine: boolean): SummaryLayout {
  const chain = chainShops > 0
  const compact = chain || restaurantRows > 0
  const l = compact
    ? { top: 200, nameY: 262, titleY: 340, rowsTop: 410, rowH: 66, headingH: 50, chainRowH: 58 }
    : { top: 420, nameY: 485, titleY: 565, rowsTop: 650, rowH: 90, headingH: 64, chainRowH: 0 }
  const rowsEnd = l.rowsTop + kinds.reduce((sum, k) => sum + (k === 'heading' ? l.headingH : l.rowH), 0)
  const chainTop = rowsEnd + CHAIN_GAP
  // the block: a heading, a row per shop, the total, and some air
  const chainEnd = chain ? chainTop + (chainShops + 2) * l.chainRowH + CHAIN_PAD : rowsEnd
  // the restaurant's block: a heading, its rows and some air, the same gap under whatever came before; or one row and a little air
  const restaurantTop = chainEnd + (restaurantRows > 0 ? (oneLine ? ONE_LINE_GAP : CHAIN_GAP) : 0)
  const blockH = oneLine ? l.chainRowH + CHAIN_PAD : (restaurantRows + 1) * l.chainRowH + CHAIN_PAD
  const contentEnd = restaurantRows > 0 ? restaurantTop + blockH : chainEnd
  const buttonY = contentEnd + (notesH ? 20 + notesH : 0) + 95
  const cardH = buttonY + 75 + 60 - l.top
  const lift = compact ? Math.max(0, l.top + cardH - CARD_BOTTOM) : 0
  return {
    ...l,
    top: l.top - lift,
    nameY: l.nameY - lift,
    titleY: l.titleY - lift,
    rowsTop: l.rowsTop - lift,
    chainTop: chainTop - lift,
    restaurantTop: restaurantTop - lift,
    restaurantOneLine: restaurantRows > 0 && oneLine,
    notesTop: contentEnd + 20 - lift,
    buttonY: buttonY - lift,
    cardH,
  }
}
