import {
  DAYS_PER_MONTH, MONTHS_PER_YEAR, RANK_BEAUTY_FULL, RANK_FROM_DAY, RANK_LOST_ZERO, RANK_PRICE_STEP, RANK_RATING, RANK_REWARD, RANK_SERVED_FULL,
  RANK_SERVICES_FULL, RANK_STAR_AT, RIVAL_BASE, RIVAL_SCORE_MAX, RIVAL_YEAR_STEP, YEAR_REWARD,
} from '../config'
import { dayOfMonth, yearOf } from './calendar'

export type Stars = 1 | 2 | 3 | 4 | 5

/** What a month is graded on; `lostShare` is null when no customer came that month. */
export interface RankInput {
  rating: number | null
  beauty: number
  services: number
  servedPerDay: number
  lostShare: number | null
}

export interface MonthResult {
  day: number
  input: RankInput
  /** Five whole numbers from 0 to 20, in the order of `RankInput`. */
  parts: number[]
  total: number
  before: Stars
  after: Stars
  reward: number
}

export type RivalId = 'coBa' | 'ngocLan' | 'hoaSen' | 'spaMoi'

/** One line of the year's table; `rival` null is the shop. */
export interface YearRow {
  rival: RivalId | null
  pts: number
}

export interface YearResult {
  day: number
  year: number
  score: number
  table: YearRow[]
  place: number
  reward: number
  gifts: ('trophy' | 'merit')[]
}

export interface RankBook {
  stars: Stars
  /** The shop's counts when this month began. */
  month: { from: number; served: number; lost: number }
  /** This year's monthly totals. */
  scores: number[]
  last: MonthResult | null
  lastYear: YearResult | null
  /** Years won so far. */
  wins: number
  /** True once the certificate has been given. */
  meritGiven: boolean
}

export const emptyRankBook = (from: number, served: number, lost: number): RankBook => ({
  stars: 1,
  month: { from, served, lost },
  scores: [],
  last: null,
  lastYear: null,
  wins: 0,
  meritGiven: false,
})

/** The rivals in street order, with their year-1 scores. */
const RIVALS: { id: RivalId; base: number }[] = [
  { id: 'coBa', base: RIVAL_BASE.coBa },
  { id: 'ngocLan', base: RIVAL_BASE.ngocLan },
  { id: 'hoaSen', base: RIVAL_BASE.hoaSen },
  { id: 'spaMoi', base: RIVAL_BASE.spaMoi },
]

export const RIVAL_IDS: RivalId[] = RIVALS.map(r => r.id)

const clamp01= (x: number): number => Math.min(1, Math.max(0, x))
const part = (x: number): number => Math.round(20 * clamp01(x))

/** The five parts of a month's grade, each a whole number from 0 to 20. */
export function rankParts(i: RankInput): number[] {
  const [lo, hi] = RANK_RATING
  return [
    i.rating === null ? 0 : part((i.rating - lo) / (hi - lo)),
    part(i.beauty / RANK_BEAUTY_FULL),
    part(i.services / RANK_SERVICES_FULL),
    part(i.servedPerDay / RANK_SERVED_FULL),
    i.lostShare === null ? 0 : part(1 - i.lostShare / RANK_LOST_ZERO),
  ]
}

export const starsFor = (total: number): Stars => (1 + RANK_STAR_AT.filter(t => total >= t).length) as Stars

/** A price at this grade: 5% more for each star after the first, to the nearest 1.000 đ. */
export const rankPrice = (price: number, stars: Stars): number =>
  Math.round((price * (1 + RANK_PRICE_STEP * (stars - 1))) / 1000 + 1e-9) * 1000

/** The month so far, read against the counts when it began. */
export function monthInput(
  book: RankBook, day: number, rating: number | null, beauty: number, services: number, total: { served: number; lost: number },
): RankInput {
  const served = total.served - book.month.served
  const lost = total.lost - book.month.lost
  const days = Math.max(1, day - book.month.from + 1)
  return { rating, beauty, services: Math.min(services, RANK_SERVICES_FULL), servedPerDay: served / days, lostShare: served + lost > 0 ? lost / (served + lost) : null }
}

/** The last day of every month from RANK_FROM_DAY on. */
export const isJudgeDay = (day: number): boolean => day >= RANK_FROM_DAY && dayOfMonth(day) === DAYS_PER_MONTH

export const isYearEnd = (day: number): boolean => day % (DAYS_PER_MONTH * MONTHS_PER_YEAR) === 0

export const rivalsFor = (year: number): YearRow[] =>
  RIVALS.map(r => ({ rival: r.id, pts: Math.min(RIVAL_SCORE_MAX, r.base + RIVAL_YEAR_STEP * (year - 1)) }))

/** The year's table, best first; the shop goes ahead of a rival on equal points. */
export function standings(mine: number, year: number): YearRow[] {
  const rivals = rivalsFor(year).sort((a, b) => b.pts - a.pts)
  const ahead = rivals.filter(r => r.pts > mine).length
  rivals.splice(ahead, 0, { rival: null, pts: mine })
  return rivals
}

/** Grades the month: climbs one star at most, never falls, and pays for the climb. */
export function judgeMonth(book: RankBook, input: RankInput, day: number): MonthResult {
  const parts = rankParts(input)
  const total = parts.reduce((a, b) => a + b, 0)
  const before = book.stars
  const after = Math.max(before, Math.min(before + 1, starsFor(total))) as Stars
  const result: MonthResult = { day, input, parts, total, before, after, reward: after > before ? RANK_REWARD[after] : 0 }
  book.stars = after
  book.scores.push(total)
  book.last = result
  return result
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length

/** Closes the year: places the shop, pays the place and gives the cup and the certificate once each. */
export function judgeYear(book: RankBook, day: number): YearResult | null {
  if (book.scores.length === 0) return null
  const year = yearOf(day)
  const score = Math.round(mean(book.scores))
  const table = standings(score, year)
  const place = table.findIndex(r => r.rival === null) + 1
  const gifts: YearResult['gifts'] = []
  if (place === 1) {
    if (book.wins === 0) gifts.push('trophy')
    book.wins++
  } else if (place === 2 && !book.meritGiven) {
    gifts.push('merit')
    book.meritGiven = true
  }
  book.scores = []
  const result: YearResult = { day, year, score, table, place, reward: YEAR_REWARD[place - 1], gifts }
  book.lastYear = result
  return result
}

/** The year's score if it ended now, counting this month's total. */
export const yearSoFar = (book: RankBook, nowTotal: number): number => Math.round(mean([...book.scores, nowTotal]))
