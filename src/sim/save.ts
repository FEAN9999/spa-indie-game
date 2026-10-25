import type { Customer, DayStats, Owner } from './types'

/** Bump when SaveData changes shape; parseSave then upgrades older saves instead of rejecting them. */
export const SAVE_VERSION = 1

export class SaveError extends Error {}

/** The whole shop as plain JSON. */
export interface SaveData {
  v: number
  day: number
  /** DayClock.minutes */
  minutes: number
  money: number
  /** Only the last RATING_WINDOW reviews, the ones the rating uses. */
  reviews: number[]
  stats: DayStats
  dayOver: boolean
  servingCustomerId: number | null
  owner: Owner
  customers: Customer[]
  /** Station i's customerId. */
  stationCustomers: (number | null)[]
  /** seats[i].customerId */
  seatCustomers: (number | null)[]
  nextId: number
  untilArrivalMs: number
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const isNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** Checks that `raw` looks like a saved shop; throws SaveError otherwise. */
export function parseSave(raw: unknown): SaveData {
  if (!isObject(raw)) throw new SaveError('not a saved shop')
  if (raw.v !== SAVE_VERSION) throw new SaveError(`unknown save version ${String(raw.v)}`)
  for (const key of ['day', 'minutes', 'money', 'nextId', 'untilArrivalMs'])
    if (!isNumber(raw[key])) throw new SaveError(`${key} is not a number`)
  for (const key of ['reviews', 'customers', 'stationCustomers', 'seatCustomers'])
    if (!Array.isArray(raw[key])) throw new SaveError(`${key} is not a list`)
  if (!(raw.reviews as unknown[]).every(isNumber)) throw new SaveError('reviews are not numbers')
  if (!isObject(raw.owner) || !isObject(raw.owner.pos)) throw new SaveError('owner is missing')
  if (!isObject(raw.stats)) throw new SaveError('stats are missing')
  if (typeof raw.dayOver !== 'boolean') throw new SaveError('dayOver is not a boolean')
  if (raw.servingCustomerId !== null && !isNumber(raw.servingCustomerId)) throw new SaveError('servingCustomerId is not a number')
  return raw as unknown as SaveData
}
