import { ARRIVAL_MAX_FACTOR, ARRIVAL_MIN_MS, BEAUTY_BASE, BEAUTY_MAX_SPEEDUP, BEAUTY_TOP, DAY_EASE, RATING_WINDOW, RECIPE_ARRIVAL_STEP, REVIEW_BY_GRADING, SERVICE_ARRIVAL_STEP, TIP_RATE } from '../config'

import type { Grading } from './customers'
import { isLessonService, isRecipeService, type ServiceId } from './services'
import type { DayStats } from './types'

export type Stars = 1 | 2 | 3

/** What the day left in the till: everything that came in, less wages and restocking. */
export const dayProfit = (s: DayStats): number => s.income + s.tips + s.gifts + s.quests - s.wages - s.restock

export function tipFor(price: number, stars: Stars): number {
  return Math.round(price * TIP_RATE[stars])
}

export function reviewScore(stars: Stars, grading: Grading = 'normal'): number {
  return REVIEW_BY_GRADING[grading][stars]
}

/** Mean of the most recent reviews, one decimal; null before the first review. */
export function rating(reviews: number[]): number | null {
  const recent = reviews.slice(-RATING_WINDOW)
  if (recent.length === 0) return null
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  return Math.round(mean * 10) / 10
}

export function arrivalIntervalMs(r: number | null): number {
  const seconds = 15 - ((r ?? 3) - 3) * 2
  return Math.min(20, Math.max(10, seconds)) * 1000
}

/** A random gap around `meanMs` (exponential, from a uniform draw `u`): customers sometimes come close together, sometimes far apart. */
export function arrivalGapMs(meanMs: number, u: number): number {
  return Math.min(ARRIVAL_MAX_FACTOR * meanMs, Math.max(ARRIVAL_MIN_MS, -meanMs * Math.log(1 - u)))
}

/** Multiplies the arrival gap: 1 at the default shop's beauty, down to 0.8 at the prettiest. */
export function beautyArrivalFactor(beauty: number): number {
  const t = Math.min(1, Math.max(0, (beauty - BEAUTY_BASE) / (BEAUTY_TOP - BEAUTY_BASE)))
  return 1 - BEAUTY_MAX_SPEEDUP * t
}

/** Multiplies the arrival gap: each available basic service beyond the first brings customers more often, and each recipe service half as much. */
export const serviceArrivalFactor = (all: readonly ServiceId[]): number => {
  const available = all.filter(id => !isLessonService(id))
  const recipe = available.filter(isRecipeService).length
  return 1 - SERVICE_ARRIVAL_STEP * (available.length - recipe - 1) - RECIPE_ARRIVAL_STEP * recipe
}

export interface DayEase {
  patience: number
  miniGameExtraMs: number
  arrival: number
}

export function dayEase(day: number): DayEase {
  return DAY_EASE[day - 1] ?? { patience: 1, miniGameExtraMs: 0, arrival: 1 }
}
