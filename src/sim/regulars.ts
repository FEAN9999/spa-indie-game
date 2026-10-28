import {
  HEART_AT, HEART_POINTS, HEART_POINTS_ANGRY, MEMBER_HEARTS, REGULARS_FROM_DAY, REGULARS_PER_DAY, REGULAR_MEET_GAP_DAYS,
  REGULAR_VISIT_CHANCE, REGULAR_VISIT_FROM_MIN, REGULAR_VISIT_TO_MIN,
} from '../config'
import { MAIN_KINDS, type CustomerKind, type MainKind } from './customers'
import type { Stars } from './economy'
import type { ItemKind } from './items'
import type { Rng } from './rng'
import type { ServiceId } from './services'
import type { Look } from './types'

export type RegularId = 'hanh' | 'vy' | 'sau' | 'khoa' | 'tu' | 'ba' | 'thao' | 'lan'
/** Book order. */
export const REGULAR_IDS: RegularId[] = ['hanh', 'vy', 'sau', 'khoa', 'tu', 'ba', 'thao', 'lan']
/** Met on a schedule, in this order; Thảo and Lan only by introduction. */
export const SCHEDULED: RegularId[] = ['hanh', 'vy', 'sau', 'khoa', 'tu', 'ba']

export type RegularGift =
  | { kind: 'regular'; who: RegularId }
  | { kind: 'item'; item: ItemKind }
  | { kind: 'money'; amount: number }
  | { kind: 'extraCustomer' }

export interface RegularSpec {
  look: Look
  kind: CustomerKind
  likes: ServiceId
  gift: RegularGift
  introducedBy: RegularId | null
}

export const REGULARS: Record<RegularId, RegularSpec> = {
  hanh: { look: { skin: 1, hair: 0, hairStyle: 3, shirt: 2 }, kind: 'office', likes: 'massage', gift: { kind: 'regular', who: 'thao' }, introducedBy: null },
  vy: { look: { skin: 0, hair: 1, hairStyle: 1, shirt: 4 }, kind: 'student', likes: 'shampoo', gift: { kind: 'item', item: 'vyPainting' }, introducedBy: null },
  sau: { look: { skin: 2, hair: 2, hairStyle: 2, shirt: 0 }, kind: 'elder', likes: 'shampoo', gift: { kind: 'extraCustomer' }, introducedBy: null },
  khoa: { look: { skin: 0, hair: 0, hairStyle: 2, shirt: 3 }, kind: 'office', likes: 'mask', gift: { kind: 'money', amount: 300000 }, introducedBy: null },
  tu: { look: { skin: 1, hair: 3, hairStyle: 3, shirt: 1 }, kind: 'picky', likes: 'massage', gift: { kind: 'item', item: 'silkScreen' }, introducedBy: null },
  ba: { look: { skin: 3, hair: 4, hairStyle: 2, shirt: 2 }, kind: 'elder', likes: 'massage', gift: { kind: 'money', amount: 200000 }, introducedBy: null },
  thao: { look: { skin: 1, hair: 0, hairStyle: 1, shirt: 1 }, kind: 'office', likes: 'mask', gift: { kind: 'regular', who: 'lan' }, introducedBy: 'hanh' },
  lan: { look: { skin: 2, hair: 1, hairStyle: 0, shirt: 4 }, kind: 'student', likes: 'mask', gift: { kind: 'item', item: 'vase' }, introducedBy: 'thao' },
}

export interface RegularState {
  meetDay: number | null
  met: boolean
  points: number
  hearts: number
  visitAt: number | null
}

export interface GuestBook {
  regulars: Record<RegularId, RegularState>
  served: Record<MainKind, number>
  kindsMet: MainKind[]
  /** Gift furniture received and not yet placed, oldest first. */
  gifts: ItemKind[]
  extraCustomer: boolean
  extraAt: number | null
  boardGiven: boolean
}

export interface VisitResult {
  /** The new heart count, or 0 when it did not change. */
  hearts: number
  /** True when this visit brought the member card. */
  member: boolean
  gift: RegularGift | null
  board: boolean
}

export function emptyBook(): GuestBook {
  const regulars = {} as Record<RegularId, RegularState>
  for (const id of REGULAR_IDS) regulars[id] = { meetDay: null, met: false, points: 0, hearts: 0, visitAt: null }
  const served = {} as Record<MainKind, number>
  for (const kind of MAIN_KINDS) served[kind] = 0
  return { regulars, served, kindsMet: [], gifts: [], extraCustomer: false, extraAt: null, boardGiven: false }
}

export function heartsFor(points: number): number {
  return HEART_AT.filter(at => points >= at).length
}

export const isMember = (s: RegularState): boolean => s.hearts >= MEMBER_HEARTS
export const bookOpen = (b: GuestBook): boolean => REGULAR_IDS.some(id => b.regulars[id].met)

const visitMinute = (rng: Rng) => REGULAR_VISIT_FROM_MIN + Math.floor(rng() * (REGULAR_VISIT_TO_MIN - REGULAR_VISIT_FROM_MIN))

/** The morning plan: who comes today and when. Draws nothing before the regulars begin. */
export function planDay(book: GuestBook, day: number, rng: Rng): void {
  if (day < REGULARS_FROM_DAY) return
  if (REGULAR_IDS.every(id => book.regulars[id].meetDay === null)) {
    SCHEDULED.forEach((id, i) => { book.regulars[id].meetDay = day + i * REGULAR_MEET_GAP_DAYS })
  }
  for (const id of REGULAR_IDS) book.regulars[id].visitAt = null
  const forced = REGULAR_IDS.filter(id => {
    const s = book.regulars[id]
    return !s.met && s.meetDay !== null && s.meetDay <= day
  })
  const optional = REGULAR_IDS.filter(id => {
    const s = book.regulars[id]
    return s.met && rng() < REGULAR_VISIT_CHANCE[isMember(s) ? 'member' : 'plain']
  })
  for (const id of [...forced, ...optional].slice(0, REGULARS_PER_DAY)) book.regulars[id].visitAt = visitMinute(rng)
  book.extraAt = book.extraCustomer ? visitMinute(rng) : null
}

/** The regular whose time has come, the earliest first. */
export function dueRegular(book: GuestBook, minutes: number): RegularId | null {
  let best: RegularId | null = null
  for (const id of REGULAR_IDS) {
    const at = book.regulars[id].visitAt
    if (at !== null && at <= minutes && (best === null || at < book.regulars[best].visitAt!)) best = id
  }
  return best
}

/** Scores a served visit; the first time a regular reaches five hearts their gift is applied to the book. */
export function addVisit(book: GuestBook, id: RegularId, stars: Stars, byOwner: boolean, day: number): VisitResult {
  const s = book.regulars[id]
  const had = s.hearts
  s.points = Math.min(HEART_AT[4], s.points + HEART_POINTS[byOwner ? 'owner' : 'staff'][stars - 1])
  s.hearts = Math.max(s.hearts, heartsFor(s.points))
  const result: VisitResult = {
    hearts: s.hearts > had ? s.hearts : 0,
    member: had < MEMBER_HEARTS && s.hearts >= MEMBER_HEARTS,
    gift: null,
    board: false,
  }
  if (had < 5 && s.hearts === 5) {
    const gift = REGULARS[id].gift
    result.gift = gift
    if (gift.kind === 'regular') {
      const who = book.regulars[gift.who]
      if (who.meetDay === null) who.meetDay = day + 1
    } else if (gift.kind === 'item') book.gifts.push(gift.item)
    else if (gift.kind === 'extraCustomer') book.extraCustomer = true
  }
  if (!book.boardGiven && REGULAR_IDS.every(r => book.regulars[r].hearts === 5)) {
    book.boardGiven = true
    book.gifts.push('regularsBoard')
    result.board = true
  }
  return result
}

/** A walk-out costs points, but never a heart already earned. */
export function loseVisit(book: GuestBook, id: RegularId): void {
  const s = book.regulars[id]
  s.points = Math.max(s.hearts ? HEART_AT[s.hearts - 1] : 0, s.points + HEART_POINTS_ANGRY)
}

export function noteServed(book: GuestBook, kind: MainKind): void {
  book.served[kind]++
  if (!book.kindsMet.includes(kind)) book.kindsMet.push(kind)
}
