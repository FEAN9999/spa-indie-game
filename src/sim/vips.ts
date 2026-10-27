import { VIP_FROM_MIN, VIP_GAP_DAYS, VIP_MIN_TECHNICIANS, VIP_TO_MIN } from '../config'
import type { CustomerKind } from './customers'
import type { Stars } from './economy'
import type { ItemKind } from './items'
import type { Rng } from './rng'
import type { ServiceId } from './services'
import type { Look } from './types'

export type VipId = 'singer' | 'miss' | 'star' | 'chef'
/** Book order and the order they are first booked in. */
export const VIP_IDS: VipId[] = ['singer', 'miss', 'star', 'chef']

export interface VipSpec {
  look: Look
  service: ServiceId
  photo: ItemKind
}

export const VIPS: Record<VipId, VipSpec> = {
  singer: { look: { skin: 0, hair: 0, hairStyle: 3, shirt: 3 }, service: 'massage', photo: 'photoSinger' },
  miss: { look: { skin: 1, hair: 0, hairStyle: 1, shirt: 0 }, service: 'mask', photo: 'photoMiss' },
  star: { look: { skin: 1, hair: 2, hairStyle: 3, shirt: 1 }, service: 'mask', photo: 'photoStar' },
  chef: { look: { skin: 2, hair: 0, hairStyle: 2, shirt: 4 }, service: 'shampoo', photo: 'photoChef' },
}

/** Underneath, every VIP is a celebrity: her tips, her harsh grading and her pace. */
export const VIP_KIND: CustomerKind = 'celeb'

export interface VipState {
  visits: number
  /** The best stars she has given, 0 before her first visit. */
  best: number
  /** True once she has signed her photo for the shop. */
  photo: boolean
}

/** Who comes, on which day and at which game minute; the service is the VIP's own. */
export interface Booking {
  vip: VipId
  day: number
  minute: number
}

export interface VipBook {
  vips: Record<VipId, VipState>
  booking: Booking | null
  /** The first day a new booking may be made for. */
  nextDay: number
  everBooked: boolean
  boardGiven: boolean
}

export function emptyVipBook(): VipBook {
  const vips = {} as Record<VipId, VipState>
  for (const id of VIP_IDS) vips[id] = { visits: 0, best: 0, photo: false }
  return { vips, booking: null, nextDay: 0, everBooked: false, boardGiven: false }
}

const open = (available: ServiceId[]) => VIP_IDS.filter(id => available.includes(VIPS[id].service))

/** True when the shop has the technicians and at least one VIP's service. */
export function vipEligible(technicians: number, available: ServiceId[]): boolean {
  return technicians >= VIP_MIN_TECHNICIANS && open(available).length > 0
}

/**
 * The end-of-day booking, for tomorrow. Returns null without touching the book or the rng while one is pending,
 * while the gap since the last visit has not passed, or while the shop is not eligible.
 * Draws, in order: who (only once everyone has visited), the half hour, then the gap to the next booking.
 */
export function planBooking(book: VipBook, day: number, technicians: number, available: ServiceId[], rng: Rng): Booking | null {
  if (book.booking || day + 1 < book.nextDay || !vipEligible(technicians, available)) return null
  const ids = open(available)
  const vip = ids.find(id => book.vips[id].visits === 0) ?? ids[Math.floor(rng() * ids.length)]
  const minute = VIP_FROM_MIN + 30 * Math.floor(rng() * ((VIP_TO_MIN - VIP_FROM_MIN) / 30 + 1))
  const gap = VIP_GAP_DAYS[0] + Math.floor(rng() * (VIP_GAP_DAYS[1] - VIP_GAP_DAYS[0] + 1))
  book.nextDay = day + 1 + gap
  book.booking = { vip, day: day + 1, minute }
  book.everBooked = true
  return book.booking
}

/** The booking whose time has come today. */
export function dueVip(book: VipBook, day: number, minutes: number): Booking | null {
  const b = book.booking
  return b && b.day === day && b.minute <= minutes ? b : null
}

/** A booking for a day gone by is dropped. */
export function clearStale(book: VipBook, day: number): void {
  if (book.booking && book.booking.day < day) book.booking = null
}

/** Scores a served visit; her first 3 stars bring her signed photo, and all four photos bring the gold board. */
export function scoreVip(book: VipBook, gifts: ItemKind[], id: VipId, stars: Stars): { photo: boolean; board: boolean } {
  const s = book.vips[id]
  s.best = Math.max(s.best, stars)
  const result = { photo: false, board: false }
  if (stars === 3 && !s.photo) {
    s.photo = true
    gifts.push(VIPS[id].photo)
    result.photo = true
  }
  if (!book.boardGiven && VIP_IDS.every(v => book.vips[v].photo)) {
    book.boardGiven = true
    gifts.push('goldBoard')
    result.board = true
  }
  return result
}
