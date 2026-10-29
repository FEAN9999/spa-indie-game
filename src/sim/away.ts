import type { PlaceId } from './places'
import { AWAY_DAY_SHARE, AWAY_MAX_HOURS, AWAY_MIN_MS, AWAY_PROFIT_DAYS } from '../config'

/** What a shop needs to pay itself while closed: the last days' profits, whether the last day was the staff's alone, and whether the tip was shown. */
export interface AwayBook {
  profits: number[]
  ok: boolean
  tipSeen: boolean
}

/** What coming back brings: `places` the shops that paid (the main shop is null), `profit` the mean used, `days` how many days it is over, `tip` whether to show the tip card. */
export interface AwayResult {
  paid: number
  places: (PlaceId | null)[]
  ms: number
  profit: number
  days: number
  capped: boolean
  tip: boolean
}

export const emptyAwayBook = (): AwayBook => ({ profits: [], ok: false, tipSeen: false })

/** Records a finished day; it qualifies when the owner served no ordinary customer and the staff served at least one. */
export function closeAwayDay(book: AwayBook, profit: number, ownerServed: number, staffServed: number): void {
  book.profits.push(profit)
  book.profits.splice(0, book.profits.length - AWAY_PROFIT_DAYS)
  book.ok = ownerServed === 0 && staffServed >= 1
}

/** The mean of the recent profits, rounded to 1.000. */
export const awayMean = (book: AwayBook): number =>
  book.profits.length === 0 ? 0 : Math.round(book.profits.reduce((a, b) => a + b, 0) / book.profits.length / 1000) * 1000

/** Money for `ms` away: nothing for a short or negative time, a day that did not qualify, or a profit at or below 0. */
export function awayPay(book: AwayBook, ms: number): number {
  if (!book.ok || book.profits.length === 0 || ms < AWAY_MIN_MS) return 0
  const mean = book.profits.reduce((a, b) => a + b, 0) / book.profits.length
  const hours = Math.min(AWAY_MAX_HOURS, ms / 3_600_000)
  return Math.round((hours * AWAY_DAY_SHARE * Math.max(0, mean)) / 1000) * 1000
}

/** A saved book, or an empty one: only numbers kept in the profits, the last few of them. */
export function repairAway(x: unknown): AwayBook {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return emptyAwayBook()
  const o = x as Record<string, unknown>
  const profits = Array.isArray(o.profits) ? o.profits.filter((p): p is number => typeof p === 'number' && Number.isFinite(p)) : []
  return { profits: profits.slice(-AWAY_PROFIT_DAYS), ok: o.ok === true, tipSeen: o.tipSeen === true }
}
