import { PATIENCE_MS } from '../config'
import { t } from '../strings/vi'
import { cleanShopName, DEFAULT_OWNER_LOOK, isOwnerLook } from './profile'
import { HINT_IDS, type Customer, type DayStats, type HintId, type Look, type Owner } from './types'

/** Bump when SaveData changes shape; parseSave then upgrades older saves instead of rejecting them. */
export const SAVE_VERSION = 2

export class SaveError extends Error {}
/** A save written by a newer version of the game: it is valid, just not readable here, so it must be left alone. */
export class SaveTooNewError extends SaveError {}

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
  shopName: string
  ownerLook: Look
  profileDone: boolean
  /** Hints already shown. */
  hints: HintId[]
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const isNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** Checks that `raw` looks like a saved shop; throws SaveError otherwise. */
export function parseSave(raw: unknown): SaveData {
  if (!isObject(raw)) throw new SaveError('not a saved shop')
  if (typeof raw.v === 'number' && raw.v > SAVE_VERSION) throw new SaveTooNewError(`save version ${raw.v} is newer than ${SAVE_VERSION}`)
  if (raw.v !== 1 && raw.v !== SAVE_VERSION) throw new SaveError(`unknown save version ${String(raw.v)}`)
  for (const key of ['day', 'minutes', 'money', 'nextId', 'untilArrivalMs'])
    if (!isNumber(raw[key])) throw new SaveError(`${key} is not a number`)
  for (const key of ['reviews', 'customers', 'stationCustomers', 'seatCustomers'])
    if (!Array.isArray(raw[key])) throw new SaveError(`${key} is not a list`)
  if (!(raw.reviews as unknown[]).every(isNumber)) throw new SaveError('reviews are not numbers')
  if (!isObject(raw.owner) || !isObject(raw.owner.pos)) throw new SaveError('owner is missing')
  if (!isObject(raw.stats)) throw new SaveError('stats are missing')
  if (typeof raw.dayOver !== 'boolean') throw new SaveError('dayOver is not a boolean')
  if (raw.servingCustomerId !== null && !isNumber(raw.servingCustomerId)) throw new SaveError('servingCustomerId is not a number')
  if (raw.v === 1) {
    return {
      ...raw,
      customers: (raw.customers as object[]).map(c => ({ ...c, patienceMaxMs: PATIENCE_MS })),
      v: SAVE_VERSION,
      shopName: t('defaultShopName'),
      ownerLook: { ...DEFAULT_OWNER_LOOK },
      profileDone: false,
      hints: [...HINT_IDS],
    } as unknown as SaveData
  }
  if (typeof raw.shopName !== 'string') throw new SaveError('shopName is not a string')
  if (!isOwnerLook(raw.ownerLook)) throw new SaveError('ownerLook is not a look')
  if (typeof raw.profileDone !== 'boolean') throw new SaveError('profileDone is not a boolean')
  if (!Array.isArray(raw.hints)) throw new SaveError('hints is not a list')
  return {
    ...raw,
    shopName: cleanShopName(raw.shopName, t('defaultShopName')),
    hints: raw.hints.filter((h): h is HintId => (HINT_IDS as readonly unknown[]).includes(h)),
  } as unknown as SaveData
}
