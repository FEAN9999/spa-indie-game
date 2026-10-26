import { PATIENCE_MS } from '../config'
import { t } from '../strings/vi'
import { DEFAULT_ITEMS, ITEM_KINDS, type Item } from './items'
import { cleanShopName, DEFAULT_OWNER_LOOK, isOwnerLook } from './profile'
import { HINT_IDS, TUTORIAL_HINTS, type Customer, type DayStats, type HintId, type Look, type Owner } from './types'

/** Bump when SaveData changes shape; parseSave then upgrades older saves instead of rejecting them. */
export const SAVE_VERSION = 3

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
  /** The furniture; the beds and seats, and who is on them, are rebuilt from it and the customers. */
  items: Item[]
  nextItemId: number
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

/** Saved furniture: known kinds on whole tiles, and no id twice. */
function isItems(x: unknown): x is Item[] {
  if (!Array.isArray(x)) return false
  const ok = x.every(i => isObject(i) && Number.isInteger(i.id) && (ITEM_KINDS as unknown[]).includes(i.kind) && Number.isInteger(i.x) && Number.isInteger(i.y) && typeof i.flip === 'boolean')
  return ok && new Set(x.map(i => i.id)).size === x.length
}

/** Shops saved before version 3 had the default furniture and numbered their beds 0, 1, …; a bed is now known by its item id. */
function withDefaultItems(old: Record<string, unknown>): SaveData {
  const bedIds = DEFAULT_ITEMS.filter(i => i.kind === 'bed').map(i => i.id)
  const { stationCustomers: _, seatCustomers: __, ...rest } = old
  const owner = old.owner as Owner
  const task = owner.task?.kind === 'serve' ? { ...owner.task, stationId: bedIds[owner.task.stationId] } : owner.task
  return {
    ...rest,
    v: SAVE_VERSION,
    owner: { ...owner, task },
    customers: (old.customers as Customer[]).map(c => ({ ...c, stationId: c.stationId === null ? null : bedIds[c.stationId] })),
    items: structuredClone(DEFAULT_ITEMS),
    nextItemId: DEFAULT_ITEMS.length + 1,
  } as unknown as SaveData
}

/** Checks that `raw` looks like a saved shop; throws SaveError otherwise. */
export function parseSave(raw: unknown): SaveData {
  const data = parseVersioned(raw)
  // customers saved before the receptionist existed were never greeted
  data.customers = data.customers.map(c => ({ ...c, greet: c.greet ?? 0 }))
  return data
}

function parseVersioned(raw: unknown): SaveData {
  if (!isObject(raw)) throw new SaveError('not a saved shop')
  if (typeof raw.v === 'number' && raw.v > SAVE_VERSION) throw new SaveTooNewError(`save version ${raw.v} is newer than ${SAVE_VERSION}`)
  if (raw.v !== 1 && raw.v !== 2 && raw.v !== SAVE_VERSION) throw new SaveError(`unknown save version ${String(raw.v)}`)
  for (const key of ['day', 'minutes', 'money', 'nextId', 'untilArrivalMs'])
    if (!isNumber(raw[key])) throw new SaveError(`${key} is not a number`)
  for (const key of ['reviews', 'customers'])
    if (!Array.isArray(raw[key])) throw new SaveError(`${key} is not a list`)
  if (!(raw.reviews as unknown[]).every(isNumber)) throw new SaveError('reviews are not numbers')
  if (!isObject(raw.owner) || !isObject(raw.owner.pos)) throw new SaveError('owner is missing')
  if (!isObject(raw.stats)) throw new SaveError('stats are missing')
  if (typeof raw.dayOver !== 'boolean') throw new SaveError('dayOver is not a boolean')
  if (raw.servingCustomerId !== null && !isNumber(raw.servingCustomerId)) throw new SaveError('servingCustomerId is not a number')
  if (raw.v === 1) {
    return withDefaultItems({
      ...raw,
      customers: (raw.customers as object[]).map(c => ({ ...c, patienceMaxMs: PATIENCE_MS })),
      shopName: t('defaultShopName'),
      ownerLook: { ...DEFAULT_OWNER_LOOK },
      profileDone: false,
      // an old shop is past the first day's tips, but has not seen the build button yet
      hints: [...TUTORIAL_HINTS],
    })
  }
  if (typeof raw.shopName !== 'string') throw new SaveError('shopName is not a string')
  if (!isOwnerLook(raw.ownerLook)) throw new SaveError('ownerLook is not a look')
  if (typeof raw.profileDone !== 'boolean') throw new SaveError('profileDone is not a boolean')
  if (!Array.isArray(raw.hints)) throw new SaveError('hints is not a list')
  const data = {
    ...raw,
    shopName: cleanShopName(raw.shopName, t('defaultShopName')),
    hints: raw.hints.filter((h): h is HintId => (HINT_IDS as readonly unknown[]).includes(h)),
  }
  if (raw.v === 2) return withDefaultItems(data)
  if (!isNumber(raw.nextItemId)) throw new SaveError('nextItemId is not a number')
  if (!isItems(raw.items)) throw new SaveError('items are not furniture')
  return data as unknown as SaveData
}
