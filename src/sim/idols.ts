import { IDOL_GAP_DAYS, IDOL_VIP_APART_MIN, VIP_FROM_MIN, VIP_MIN_TECHNICIANS, VIP_TO_MIN } from '../config'
import type { Stars } from './economy'
import type { ItemKind } from './items'
import type { Rng } from './rng'
import type { ServiceId } from './services'
import type { Look } from './types'
import type { Booking } from './vips'

export type IdolId = 'sontung' | 'taylor' | 'gd' | 'jennie' | 'hieuthuhai' | 'weeknd' | 'taeyang' | 'bieber' | 'daesung'
/** Book order and the order they are first booked in. */
export const IDOL_IDS: IdolId[] = ['sontung', 'taylor', 'gd', 'jennie', 'hieuthuhai', 'weeknd', 'taeyang', 'bieber', 'daesung']

export interface IdolSpec {
  look: Look
  service: ServiceId
  /** The signed photo this star gives. */
  photo: ItemKind
}

/** The view reads only the skin and the hair style of a star's look. */
const look = (skin: number, hairStyle: number): Look => ({ skin, hair: 0, hairStyle, shirt: 0 })

export const IDOLS: Record<IdolId, IdolSpec> = {
  sontung: { look: look(0, 2), service: 'massage', photo: 'photoIdolSontung' },
  taylor: { look: look(0, 1), service: 'massage', photo: 'photoIdolTaylor' },
  gd: { look: look(0, 2), service: 'shampoo', photo: 'photoIdolGd' },
  jennie: { look: look(0, 1), service: 'mask', photo: 'photoIdolJennie' },
  hieuthuhai: { look: look(0, 2), service: 'shampoo', photo: 'photoIdolHieuthuhai' },
  weeknd: { look: look(3, 2), service: 'shampoo', photo: 'photoIdolWeeknd' },
  taeyang: { look: look(1, 2), service: 'massage', photo: 'photoIdolTaeyang' },
  bieber: { look: look(0, 2), service: 'mask', photo: 'photoIdolBieber' },
  daesung: { look: look(0, 2), service: 'mask', photo: 'photoIdolDaesung' },
}

export interface IdolState {
  visits: number
  /** The best stars this idol has given, 0 before the first visit. */
  best: number
  /** True once the signed photo has been given to the shop. */
  photo: boolean
  /** True once the idol has said thanks after a 3-star visit. */
  thanked: boolean
}

/** Who comes, on which day and at which game minute; the service is the idol's own. */
export interface IdolBooking {
  idol: IdolId
  day: number
  minute: number
}

export interface IdolBook {
  idols: Record<IdolId, IdolState>
  booking: IdolBooking | null
  /** The first day a new booking may be made for. */
  nextDay: number
  everBooked: boolean
  wallGiven: boolean
}

export function emptyIdolBook(): IdolBook {
  const idols = {} as Record<IdolId, IdolState>
  for (const id of IDOL_IDS) idols[id] = { visits: 0, best: 0, photo: false, thanked: false }
  return { idols, booking: null, nextDay: 0, everBooked: false, wallGiven: false }
}

const open = (available: ServiceId[]) => IDOL_IDS.filter(id => available.includes(IDOLS[id].service))

/** True when the shop has the gold board, the technicians and at least one idol's service. */
export function idolEligible(board: boolean, technicians: number, available: ServiceId[]): boolean {
  return board && technicians >= VIP_MIN_TECHNICIANS && open(available).length > 0
}

/**
 * The end-of-day booking, for tomorrow. Returns null without touching the book or the rng while one is pending,
 * while the gap since the last visit has not passed, or while the shop is not eligible.
 * Draws, in order: who (only once all nine have visited), the half hour, then the gap to the next booking.
 * The half hour keeps IDOL_VIP_APART_MIN from tomorrow's VIP booking.
 */
export function planIdol(
  book: IdolBook,
  day: number,
  board: boolean,
  technicians: number,
  available: ServiceId[],
  vip: Booking | null,
  rng: Rng,
): IdolBooking | null {
  if (book.booking || day + 1 < book.nextDay || !idolEligible(board, technicians, available)) return null
  const ids = open(available)
  // Like the VIP book: once no open idol is unmet, the pick is random among the open ones.
  const idol = ids.find(id => book.idols[id].visits === 0) ?? ids[Math.floor(rng() * ids.length)]
  let slots: number[] = []
  for (let m = VIP_FROM_MIN; m <= VIP_TO_MIN; m += 30) slots.push(m)
  if (vip?.day === day + 1) slots = slots.filter(m => Math.abs(m - vip.minute) >= IDOL_VIP_APART_MIN)
  const minute = slots[Math.floor(rng() * slots.length)]
  const gap = IDOL_GAP_DAYS[0] + Math.floor(rng() * (IDOL_GAP_DAYS[1] - IDOL_GAP_DAYS[0] + 1))
  book.nextDay = day + 1 + gap
  book.booking = { idol, day: day + 1, minute }
  book.everBooked = true
  return book.booking
}

/** The booking whose time has come today. */
export function dueIdol(book: IdolBook, day: number, minutes: number): IdolBooking | null {
  const b = book.booking
  return b && b.day === day && b.minute <= minutes ? b : null
}

/** A booking for a day gone by is dropped. */
export function clearIdolStale(book: IdolBook, day: number): void {
  if (book.booking && book.booking.day < day) book.booking = null
}

/** Scores a served visit; the first 3 stars bring the signed photo, and all nine photos bring the star wall. */
export function scoreIdol(book: IdolBook, gifts: ItemKind[], id: IdolId, stars: Stars): { photo: boolean; wall: boolean } {
  const s = book.idols[id]
  s.best = Math.max(s.best, stars)
  const result = { photo: false, wall: false }
  if (stars === 3 && !s.photo) {
    s.photo = true
    s.thanked = true
    gifts.push(IDOLS[id].photo)
    result.photo = true
  }
  if (!book.wallGiven && IDOL_IDS.every(i => book.idols[i].photo)) {
    book.wallGiven = true
    gifts.push('starWall')
    result.wall = true
  }
  return result
}
