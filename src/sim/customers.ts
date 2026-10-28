import { CELEB_CHANCE, CELEB_FROM_DAY, PREFERRED_SERVICE_CHANCE } from '../config'
import type { Rng } from './rng'
import { SERVICE_IDS, type ServiceId } from './services'

export type CustomerKind = 'student' | 'office' | 'picky' | 'elder' | 'celeb' | 'tourist' | 'backpacker' | 'lady'

/** The kinds the main shop draws and the guest book counts. */
export const MAIN_KINDS = ['student', 'office', 'picky', 'elder', 'celeb'] as const
export type MainKind = (typeof MAIN_KINDS)[number]
export const isMainKind = (k: CustomerKind): k is MainKind => (MAIN_KINDS as readonly CustomerKind[]).includes(k)

export const CUSTOMER_KINDS: CustomerKind[] = [...MAIN_KINDS, 'tourist', 'backpacker', 'lady']

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
  office: { fromDay: 1, weight: 3, patience: 0.8, tip: [1, 1, 1], prefers: ['shampoo', 'mask', 'stone'], grading: 'normal', reviews: 1, speed: 5, hard: false },
  picky: { fromDay: 3, weight: 2, patience: 1, tip: [0, 0, 2], prefers: SERVICE_IDS, grading: 'harsh', reviews: 1, speed: 5, hard: true },
  elder: { fromDay: 4, weight: 2, patience: 1.3, tip: [0.8, 0.8, 0.8], prefers: ['massage', 'steam'], grading: 'easy', reviews: 1, speed: 3.5, hard: false },
  tourist: { fromDay: 1, weight: 0, patience: 0.9, tip: [1.5, 1.5, 1.5], prefers: ['mud', 'stone', 'massage'], grading: 'easy', reviews: 1, speed: 4, hard: false },
  backpacker: { fromDay: 1, weight: 0, patience: 1.3, tip: [0.5, 1, 2], prefers: ['massage', 'steam', 'shampoo'], grading: 'normal', reviews: 1, speed: 5, hard: false },
  lady: { fromDay: 1, weight: 0, patience: 0.7, tip: [0, 1, 4], prefers: ['mask', 'mud', 'stone'], grading: 'harsh', reviews: 2, speed: 3.5, hard: true },
  celeb: { fromDay: CELEB_FROM_DAY, weight: 0, patience: 0.8, tip: [3, 3, 3], prefers: ['massage', 'mask', 'mud'], grading: 'harsh', reviews: 2, speed: 5, hard: false },
}

/**
 * The kind of the next customer: from day 6 a few celebrities, otherwise weighted among the kinds whose day has come,
 * the picky customers' weight times `pickyFactor` (the rival's day).
 * With `weights` (a branch's place) there is no celebrity, and the draw is by those weights over every kind, in order.
 */
export function drawKind(day: number, rng: Rng, pickyFactor = 1, weights?: Readonly<Record<string, number>>): CustomerKind {
  if (weights) {
    let roll = rng() * CUSTOMER_KINDS.reduce((sum, k) => sum + (weights[k] ?? 0), 0)
    for (const k of CUSTOMER_KINDS) {
      roll -= weights[k] ?? 0
      if (roll < 0) return k
    }
    return CUSTOMER_KINDS.filter(k => (weights[k] ?? 0) > 0).pop()!
  }
  if (day >= CELEB_FROM_DAY && rng() < CELEB_CHANCE) return 'celeb'
  const weight = (k: CustomerKind) => KINDS[k].weight * (k === 'picky' ? pickyFactor : 1)
  const met = CUSTOMER_KINDS.filter(k => KINDS[k].fromDay <= day && KINDS[k].weight > 0)
  let roll = rng() * met.reduce((sum, k) => sum + weight(k), 0)
  for (const k of met) {
    roll -= weight(k)
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
