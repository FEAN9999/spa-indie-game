import { EVENT_FROM_DAY, EVENT_GAP_DAYS, HOT_DAYS, INSPECT_MIN, POWER_FROM_MIN, POWER_TO_MIN, RIVAL_TARGET_MIN, RIVAL_TARGET_SHARE, VIP_FROM_MIN, VIP_TO_MIN } from '../config'
import { festivalOf } from './festivals'
import { averageDay, type DayRecord } from './quests'
import type { Rng } from './rng'
import type { IdolId } from './idols'
import type { ServiceId } from './services'
import type { Look } from './types'

export type EventKind = 'kol' | 'inspect' | 'rival' | 'power'
export const EVENT_KINDS: EventKind[] = ['kol', 'inspect', 'rival', 'power']

/** The services that run on power: they rest while it is out. */
export const MACHINES: readonly ServiceId[] = ['steam', 'stone', 'mud']

/** An announced event: what, on which day, at which game minute. */
export interface EventPlan {
  kind: EventKind
  day: number
  minute: number
}

/** Who makes the shop hot: Mi Mi, or a star. */
export type HotBy = 'kol' | IdolId

export interface EventBook {
  /** The first day an event may be planned for. */
  nextDay: number
  /** The last event planned, never planned twice in a row. */
  last: EventKind | null
  /** The event announced for tomorrow or today; Mi Mi's goes once she walks in. */
  plan: EventPlan | null
  /** The last hot day of the current run, 0 if none. */
  hotUntil: number
  /** How many days the run covers, counted back from hotUntil. */
  hotDays: number
  /** Who started or last stretched the run. */
  hotBy: HotBy
  /** The morning the hot card shows next: the day after the last 3-star visit that made the shop hot. */
  hotCardDay: number
  /** Today's count for an event's challenge. */
  count: number
  /** True once today's inspector has looked round. */
  inspected: boolean
  /** True once the first pass has brought the Giấy khen. */
  certGiven: boolean
}

export const emptyEventBook = (nextDay = EVENT_FROM_DAY): EventBook => ({
  nextDay,
  last: null,
  plan: null,
  hotUntil: 0,
  hotDays: HOT_DAYS,
  hotBy: 'kol',
  hotCardDay: 0,
  count: 0,
  inspected: false,
  certGiven: false,
})

/** Mi Mi in her pink shirt. */
export const KOL_LOOK: Look = { skin: 0, hair: 1, hairStyle: 1, shirt: 3 }

/**
 * The end-of-day plan, for tomorrow. Returns null without touching the book or the rng before EVENT_FROM_DAY, in a festival month,
 * before nextDay, on the VIP's day, or when no event other than the last one is left; a power cut only for a shop with `machines`.
 * Draws, in order: which event, Mi Mi's half hour (the inspector comes at INSPECT_MIN, the power goes at POWER_FROM_MIN,
 * the rival has no minute), then the gap to the next one.
 */
export function planEvent(book: EventBook, day: number, vipDay: number | null, machines: boolean, rng: Rng): EventPlan | null {
  const d = day + 1
  const kinds = EVENT_KINDS.filter(k => k !== book.last && (k !== 'power' || machines))
  if (d < EVENT_FROM_DAY || festivalOf(d) !== null || d < book.nextDay || vipDay === d || kinds.length === 0) return null
  const kind = kinds[Math.floor(rng() * kinds.length)]
  const minute =
    kind === 'kol' ? VIP_FROM_MIN + 30 * Math.floor(rng() * ((VIP_TO_MIN - VIP_FROM_MIN) / 30 + 1)) : kind === 'inspect' ? INSPECT_MIN : kind === 'power' ? POWER_FROM_MIN : 0
  const gap = EVENT_GAP_DAYS[0] + Math.floor(rng() * (EVENT_GAP_DAYS[1] - EVENT_GAP_DAYS[0] + 1))
  book.nextDay = d + gap
  book.last = kind
  book.plan = { kind, day: d, minute }
  return book.plan
}

/** True when Mi Mi's minute has come today. */
export function dueKol(book: EventBook, day: number, minutes: number): boolean {
  const p = book.plan
  return p !== null && p.kind === 'kol' && p.day === day && p.minute <= minutes
}

/** True on the hotDays days that end on hotUntil. */
export const hotOn = (book: EventBook, day: number): boolean => book.hotUntil > 0 && day > book.hotUntil - book.hotDays && day <= book.hotUntil

/**
 * A 3-star visit on `day` makes the shop hot from tomorrow for HOT_DAYS days; if a run is still going (today is its last day
 * or earlier) it is stretched with no gap. The next morning's card names `by`.
 */
export function makeHot(book: EventBook, day: number, by: HotBy): void {
  if (book.hotUntil > 0 && book.hotUntil >= day) {
    const start = book.hotUntil - book.hotDays + 1
    book.hotUntil = Math.max(book.hotUntil, day + HOT_DAYS)
    book.hotDays = book.hotUntil - start + 1
  } else {
    book.hotUntil = day + HOT_DAYS
    book.hotDays = HOT_DAYS
  }
  book.hotBy = by
  book.hotCardDay = day + 1
}

/** True on the mornings the hot card shows: a run's first day, and the day after a visit that stretched it. */
export const hotCardToday = (book: EventBook, day: number): boolean => hotOn(book, day) && (day === book.hotUntil - book.hotDays + 1 || day === book.hotCardDay)

/** Hot days left, today counted; 0 when not hot. */
export const hotDaysLeft = (book: EventBook, day: number): number => (hotOn(book, day) ? book.hotUntil - day + 1 : 0)

/** True on the rival's opening day. */
export const rivalToday = (book: EventBook, day: number): boolean => book.plan?.kind === 'rival' && book.plan.day === day

/** True while the power is out: on a power-cut day, from POWER_FROM_MIN until POWER_TO_MIN. */
export const powerOutAt = (book: EventBook, day: number, minutes: number): boolean =>
  book.plan?.kind === 'power' && book.plan.day === day && minutes >= POWER_FROM_MIN && minutes < POWER_TO_MIN

/** The rival's challenge: 3-star customers to serve, a share of an average recent day's customers, never under RIVAL_TARGET_MIN. */
export const rivalTarget = (recent: DayRecord[]): number => Math.max(RIVAL_TARGET_MIN, Math.round(RIVAL_TARGET_SHARE * averageDay(recent).served))
