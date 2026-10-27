import { CELEB_CHANCE, CELEB_FROM_DAY, PREFERRED_SERVICE_CHANCE } from '../config'
import type { Rng } from './rng'
import { SERVICE_IDS, type ServiceId } from './services'

export type CustomerKind = 'student' | 'office' | 'picky' | 'elder' | 'celeb'

export const CUSTOMER_KINDS: CustomerKind[] = ['student', 'office', 'picky', 'elder', 'celeb']

/** How kindly a customer turns stars into a review. */
export type Grading = 'easy' | 'normal' | 'harsh'

export interface KindSpec {
  /** The first day this kind shows up. */
  fromDay: number
  /** Share among the kinds met so far; 0 for a kind with its own roll. */
  weight: number
  /** Multiplies the patience. */
  patience: number
  /** Multiplies the tip for 1, 2 and 3 stars. */
  tip: [number, number, number]
  prefers: ServiceId[]
  grading: Grading
  /** How many times each review counts. */
  reviews: 1 | 2
  /** Tiles per second. */
  speed: number
  /** Plays the hard version of the mini-game. */
  hard: boolean
}

export const KINDS: Record<CustomerKind, KindSpec> = {
  student: { fromDay: 1, weight: 3, patience: 1, tip: [0.5, 0.5, 0.5], prefers: ['shampoo'], grading: 'easy', reviews: 1, speed: 5, hard: false },
  office: { fromDay: 1, weight: 3, patience: 0.8, tip: [1, 1, 1], prefers: ['shampoo', 'mask'], grading: 'normal', reviews: 1, speed: 5, hard: false },
  picky: { fromDay: 3, weight: 2, patience: 1, tip: [0, 0, 2], prefers: SERVICE_IDS, grading: 'harsh', reviews: 1, speed: 5, hard: true },
  elder: { fromDay: 4, weight: 2, patience: 1.3, tip: [0.8, 0.8, 0.8], prefers: ['massage', 'steam'], grading: 'easy', reviews: 1, speed: 3.5, hard: false },
  celeb: { fromDay: CELEB_FROM_DAY, weight: 0, patience: 0.8, tip: [3, 3, 3], prefers: ['massage', 'mask'], grading: 'harsh', reviews: 2, speed: 5, hard: false },
}

/** The kind of the next customer: from day 6 a few celebrities, otherwise weighted among the kinds whose day has come. */
export function drawKind(day: number, rng: Rng): CustomerKind {
  if (day >= CELEB_FROM_DAY && rng() < CELEB_CHANCE) return 'celeb'
  const met = CUSTOMER_KINDS.filter(k => KINDS[k].fromDay <= day && KINDS[k].weight > 0)
  let roll = rng() * met.reduce((sum, k) => sum + KINDS[k].weight, 0)
  for (const k of met) {
    roll -= KINDS[k].weight
    if (roll < 0) return k
  }
  return met[met.length - 1]
}

/** The service a customer asks for: usually a favourite the shop has, else any it has. No draw when there is only one. */
export function drawService(kind: CustomerKind, available: ServiceId[], rng: Rng): ServiceId {
  if (available.length <= 1) return available[0] ?? 'shampoo'
  const favourites = available.filter(id => KINDS[kind].prefers.includes(id))
  const from = favourites.length > 0 && rng() < PREFERRED_SERVICE_CHANCE ? favourites : available
  return from.length > 1 ? from[Math.floor(rng() * from.length)] : from[0]
}
