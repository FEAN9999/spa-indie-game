import { LOOK_COUNTS, PATIENCE_MS, STOCK_START } from '../config'
import { t } from '../strings/vi'
import { CUSTOMER_KINDS } from './customers'
import { DEFAULT_ITEMS, ITEM_KINDS, type Item } from './items'
import { cleanShopName, DEFAULT_OWNER_LOOK, isOwnerLook } from './profile'
import { fullStock, STOCK_ITEMS, type StockItem } from './stock'
import { SERVICE_IDS, type ServiceId } from './services'
import { STAFF_ROLES, STAT_KEYS, type Candidate, type Staff, type StaffTask } from './staff'
import { HINT_IDS, TUTORIAL_HINTS, type Customer, type DayStats, type Facing, type HintId, type Look, type Owner, type Tile } from './types'

/** Bump when SaveData changes shape; parseSave then upgrades older saves instead of rejecting them. */
export const SAVE_VERSION = 7

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
  staff: Staff[]
  /** The people on offer today. */
  candidates: Candidate[]
  /** The day `candidates` were drawn for. */
  candidatesDay: number
  nextStaffId: number
  /** The services the shop has opened, in opening order. */
  services: ServiceId[]
  /** What is left of each item. */
  stock: Record<StockItem, number>
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const isNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** Saved furniture: known kinds on whole tiles, and no id twice. */
function isItems(x: unknown): x is Item[] {
  if (!Array.isArray(x)) return false
  const ok = x.every(i => isObject(i) && Number.isInteger(i.id) && (ITEM_KINDS as unknown[]).includes(i.kind) && Number.isInteger(i.x) && Number.isInteger(i.y) && typeof i.flip === 'boolean')
  return ok && new Set(x.map(i => i.id)).size === x.length
}

const isStats = (x: unknown): boolean => isObject(x) && STAT_KEYS.every(k => Number.isInteger(x[k]) && (x[k] as number) >= 1 && (x[k] as number) <= 5)
const isRole = (x: unknown): boolean => (STAFF_ROLES as unknown[]).includes(x)

/** Hired staff: a role, stats and a level in range, working numbers, and no id twice. */
function checkStaff(x: unknown): void {
  if (!Array.isArray(x)) throw new SaveError('staff is not a list')
  const ids = new Set<number>()
  for (const s of x) {
    if (!isObject(s) || !Number.isInteger(s.id)) throw new SaveError('a staff member has no whole-number id')
    if (ids.has(s.id as number)) throw new SaveError(`staff id ${String(s.id)} is used twice`)
    ids.add(s.id as number)
    if (typeof s.name !== 'string') throw new SaveError(`staff ${String(s.id)} has no name`)
    if (!isRole(s.role)) throw new SaveError(`staff ${String(s.id)} has an unknown role`)
    if (!isStats(s.stats)) throw new SaveError(`staff ${String(s.id)} has stats outside 1 to 5`)
    if (!Number.isInteger(s.level) || (s.level as number) < 1 || (s.level as number) > 5) throw new SaveError(`staff ${String(s.id)} has a level outside 1 to 5`)
    if (!isNumber(s.xp) || !isNumber(s.wage) || !isNumber(s.sinceRest)) throw new SaveError(`staff ${String(s.id)} has xp, wage or sinceRest that is not a number`)
    if (typeof s.leaving !== 'boolean') throw new SaveError(`staff ${String(s.id)} has leaving that is not a boolean`)
    if (!isObject(s.pos) || !isNumber(s.pos.x) || !isNumber(s.pos.y)) throw new SaveError(`staff ${String(s.id)} has no position`)
  }
}

/** The people on offer: a name, a role, stats, a wage and whether they are rare. */
function checkCandidates(x: unknown): void {
  if (!Array.isArray(x)) throw new SaveError('candidates is not a list')
  for (const c of x)
    if (!isObject(c) || typeof c.name !== 'string' || !isRole(c.role) || !isStats(c.stats) || !isNumber(c.wage) || typeof c.rare !== 'boolean')
      throw new SaveError('a candidate is not a candidate')
}

/** Shops saved before version 3 had the default furniture and numbered their beds 0, 1, …; a bed is now known by its item id. */
function withDefaultItems(old: Record<string, unknown>): SaveData {
  const bedIds = DEFAULT_ITEMS.filter(i => i.kind === 'bed').map(i => i.id)
  const { stationCustomers: _, seatCustomers: __, ...rest } = old
  const owner = old.owner as Owner
  const task = owner.task?.kind === 'serve' ? { ...owner.task, stationId: bedIds[owner.task.stationId] } : owner.task
  return {
    ...rest,
    owner: { ...owner, task },
    customers: (old.customers as Customer[]).map(c => ({ ...c, stationId: c.stationId === null ? null : bedIds[c.stationId] })),
    items: structuredClone(DEFAULT_ITEMS),
    nextItemId: DEFAULT_ITEMS.length + 1,
  } as unknown as SaveData
}

/** Shops saved before version 4 had no staff and paid no wages. */
function withNoStaff(old: object): SaveData {
  const stats = (old as { stats: object }).stats
  return { ...old, v: SAVE_VERSION, stats: { ...stats, wages: 0 }, staff: [], candidates: [], candidatesDay: 0, nextStaffId: 1 } as unknown as SaveData
}

/** Shops saved before version 5 offered only shampoo. */
function withShampooOnly(old: object): SaveData {
  const customers = (old as { customers: Customer[] }).customers.map(c => ({ ...c, service: 'shampoo' as const }))
  return { ...old, v: SAVE_VERSION, services: ['shampoo'], customers } as unknown as SaveData
}

/** Shops saved before version 6 had no stock: they open with a full one and nothing spent on it. */
function withFullStock(old: object): SaveData {
  const stats = (old as { stats: object }).stats
  return { ...old, v: SAVE_VERSION, stats: { ...stats, restock: 0 }, stock: fullStock() } as unknown as SaveData
}

/** Shops saved before version 7 paid wages for a day twice as long: staff and candidates now ask half. */
function withHalfWages(old: object): SaveData {
  const { staff, candidates } = old as { staff: Staff[]; candidates: Candidate[] }
  const half = <T extends { wage: number }>(p: T): T => ({ ...p, wage: Math.round(p.wage / 2) })
  return { ...old, v: SAVE_VERSION, staff: staff.map(half), candidates: candidates.map(half) } as unknown as SaveData
}

/** Checks that `raw` looks like a saved shop; throws SaveError otherwise. */
export function parseSave(raw: unknown): SaveData {
  const data = parseVersioned(raw)
  // stock counts are whole numbers from zero up, else a full shelf; money spent restocking is a number, else nothing
  const stock: Record<string, unknown> = isObject(data.stock) ? data.stock : {}
  data.stock = Object.fromEntries(STOCK_ITEMS.map(i => [i, Number.isInteger(stock[i]) && (stock[i] as number) >= 0 ? stock[i] : STOCK_START])) as Record<StockItem, number>
  data.stats = { ...data.stats, restock: isNumber(data.stats.restock) ? data.stats.restock : 0 }
  // customers saved before the receptionist existed were never greeted
  data.customers = data.customers.map(c => ({ ...c, greet: isNumber(c.greet) ? c.greet : 0 }))
  // unknown services are dropped and shampoo is always open; a customer who wants an unknown one wants shampoo
  const known = Array.isArray(data.services) ? data.services : []
  data.services = SERVICE_IDS.filter(id => id === 'shampoo' || known.includes(id))
  data.customers = data.customers.map(c => ({ ...c, service: SERVICE_IDS.includes(c.service) ? c.service : 'shampoo' }))
  // every kind of customer is known; a missing or unknown one is an office worker
  data.customers = data.customers.map(c => ({ ...c, kind: CUSTOMER_KINDS.includes(c.kind) ? c.kind : 'office' }))
  // damaged staff data is repaired, never a reason to lose the shop
  data.staff = data.staff.map(s => ({ ...s, look: repairLook(s.look), task: repairTask(s.task), path: repairPath(s.path), facing: repairFacing(s.facing) }))
  data.candidates = data.candidates.map(c => ({ ...c, look: repairLook(c.look) }))
  return data
}

/** Each look field in range, or 0. */
function repairLook(x: unknown): Look {
  const look = isObject(x) ? x : {}
  const field = (k: keyof typeof LOOK_COUNTS): number => (Number.isInteger(look[k]) && (look[k] as number) >= 0 && (look[k] as number) < LOOK_COUNTS[k] ? (look[k] as number) : 0)
  return { skin: field('skin'), hair: field('hair'), hairStyle: field('hairStyle'), shirt: field('shirt') }
}

/** A well-formed task, or none. */
function repairTask(x: unknown): StaffTask | null {
  if (!isObject(x)) return null
  if (x.kind === 'exit') return { kind: 'exit' }
  if (x.kind === 'rest' && isNumber(x.leftMs)) return { kind: 'rest', leftMs: x.leftMs }
  if (x.kind === 'fetch' && isNumber(x.customerId)) return { kind: 'fetch', customerId: x.customerId }
  if (x.kind === 'serve' && isNumber(x.customerId) && isNumber(x.stationId) && isNumber(x.leftMs) && isNumber(x.totalMs))
    return { kind: 'serve', customerId: x.customerId, stationId: x.stationId, leftMs: x.leftMs, totalMs: x.totalMs }
  return null
}

/** A list of whole tiles, or an empty one. */
const repairPath = (x: unknown): Tile[] => (Array.isArray(x) && x.every(t => isObject(t) && Number.isInteger(t.x) && Number.isInteger(t.y)) ? (x as Tile[]) : [])

const repairFacing = (x: unknown): Facing => (x === 'up' || x === 'left' || x === 'right' ? x : 'down')

function parseVersioned(raw: unknown): SaveData {
  if (!isObject(raw)) throw new SaveError('not a saved shop')
  if (typeof raw.v === 'number' && raw.v > SAVE_VERSION) throw new SaveTooNewError(`save version ${raw.v} is newer than ${SAVE_VERSION}`)
  if (raw.v !== 1 && raw.v !== 2 && raw.v !== 3 && raw.v !== 4 && raw.v !== 5 && raw.v !== 6 && raw.v !== SAVE_VERSION) throw new SaveError(`unknown save version ${String(raw.v)}`)
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
    return withFullStock(withShampooOnly(withNoStaff(withDefaultItems({
      ...raw,
      customers: (raw.customers as object[]).map(c => ({ ...c, patienceMaxMs: PATIENCE_MS })),
      shopName: t('defaultShopName'),
      ownerLook: { ...DEFAULT_OWNER_LOOK },
      profileDone: false,
      // an old shop is past the first day's tips, but has not seen the build button yet
      hints: [...TUTORIAL_HINTS],
    }))))
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
  if (raw.v === 2) return withFullStock(withShampooOnly(withNoStaff(withDefaultItems(data))))
  if (!isNumber(raw.nextItemId)) throw new SaveError('nextItemId is not a number')
  if (!isItems(raw.items)) throw new SaveError('items are not furniture')
  if (raw.v === 3) return withFullStock(withShampooOnly(withNoStaff(data)))
  if (!isNumber(raw.stats.wages)) throw new SaveError('stats.wages is not a number')
  checkStaff(raw.staff)
  checkCandidates(raw.candidates)
  if (!isNumber(raw.candidatesDay)) throw new SaveError('candidatesDay is not a number')
  if (!isNumber(raw.nextStaffId)) throw new SaveError('nextStaffId is not a number')
  if (raw.v === 4) return withHalfWages(withFullStock(withShampooOnly(data)))
  if (raw.v === 5) return withHalfWages(withFullStock(data))
  if (raw.v === 6) return withHalfWages(data)
  return data as unknown as SaveData
}
