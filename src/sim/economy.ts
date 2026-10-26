import { BEAUTY_BASE, BEAUTY_MAX_SPEEDUP, BEAUTY_TOP, DAY_EASE, RATING_WINDOW, REVIEW_FOR_STARS, TIP_RATE } from '../config'

export type Stars = 1 | 2 | 3

export function tipFor(price: number, stars: Stars): number {
  return Math.round(price * TIP_RATE[stars])
}

export function reviewScore(stars: Stars): number {
  return REVIEW_FOR_STARS[stars]
}

/** Mean of the most recent reviews, one decimal; null before the first review. */
export function rating(reviews: number[]): number | null {
  const recent = reviews.slice(-RATING_WINDOW)
  if (recent.length === 0) return null
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  return Math.round(mean * 10) / 10
}

export function arrivalIntervalMs(r: number | null): number {
  const seconds = 40 - ((r ?? 3) - 3) * 6
  return Math.min(50, Math.max(25, seconds)) * 1000
}

/** Multiplies the arrival gap: 1 at the default shop's beauty, down to 0.8 at the prettiest. */
export function beautyArrivalFactor(beauty: number): number {
  const t = Math.min(1, Math.max(0, (beauty - BEAUTY_BASE) / (BEAUTY_TOP - BEAUTY_BASE)))
  return 1 - BEAUTY_MAX_SPEEDUP * t
}

export interface DayEase {
  patience: number
  miniGameExtraMs: number
  arrival: number
}

export function dayEase(day: number): DayEase {
  return DAY_EASE[day - 1] ?? { patience: 1, miniGameExtraMs: 0, arrival: 1 }
}
