import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from '../config'

/** The month, 1 to MONTHS_PER_YEAR, that day `day` falls in. */
export const monthOf = (day: number): number => (Math.floor((day - 1) / DAYS_PER_MONTH) % MONTHS_PER_YEAR) + 1

/** The year, from 1. */
export const yearOf = (day: number): number => Math.floor((day - 1) / (DAYS_PER_MONTH * MONTHS_PER_YEAR)) + 1

/** Which day of its month `day` is, from 1. */
export const dayOfMonth = (day: number): number => ((day - 1) % DAYS_PER_MONTH) + 1

/** The days left in the month, today included. */
export const daysLeftInMonth = (day: number): number => DAYS_PER_MONTH - dayOfMonth(day) + 1

/** The first day of the month `day` falls in. */
export const monthStart = (day: number): number => day - dayOfMonth(day) + 1
