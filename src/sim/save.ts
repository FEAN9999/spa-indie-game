import { CHAT_MS_MAX, DAY_START_MIN, EVENT_FROM_DAY, HEART_AT, HOT_DAYS, LATE_MIN, LOOK_COUNTS, MAX_FLOORS, MAX_TIER, PATIENCE_MS, PLACES, QUEST_RECENT_DAYS, QUEST_SWAPS_PER_DAY, QUESTS_PER_DAY, RARE_TIER, SHOP_X0, STOCK_START } from '../config'
import { t } from '../strings/vi'
import { BADGE_IDS, type Badges } from './badges'
import { emptyIdolBook, IDOL_IDS, type IdolBook, type IdolId } from './idols'
import { emptyEventBook, EVENT_KINDS, type EventBook, type EventKind, type HotBy } from './events'
import { FESTIVAL_IDS, type FestivalBook, type FestivalId } from './festivals'
import { CUSTOMER_KINDS, KINDS, MAIN_KINDS, type MainKind } from './customers'
import { ITEM_KINDS, canTurn, itemsFromLayout, type Item, type ItemKind } from './items'
import { SPA_LAYOUT_1A } from './layout'
import { cleanShopName, DEFAULT_OWNER_LOOK, isOwnerLook } from './profile'
import { emptyRecipes, isMix, RECIPE_IDS, RECIPES, rightCount, type RecipeBook } from './recipes'
import { emptyBook, heartsFor, REGULAR_IDS, type GuestBook, type RegularState } from './regulars'
import { emptyProgress, QUEST_KINDS, zeroCounts, type Counts, type DayRecord, type Life, type Progress, type Quest, type QuestKind } from './quests'
import { fullStock, STOCK_ITEMS, type StockItem } from './stock'
import { createRng } from './rng'
import { BASIC_SERVICES, LESSON_SERVICES, SERVICE_IDS, type LessonService, type ServiceId } from './services'
import { drawTiers, drawTrait, noTiers, RECEPTIONIST_TRAITS, TRAIT_IDS, STAFF_ROLES, STAT_KEYS, type Candidate, type MoveTo, type Staff, type StaffRole, type StaffTask, type Study, type Tiers } from './staff'
import { isPlaceId, PLACE_IDS, type PlaceId } from './places'
import { repairAway, type AwayBook } from './away'
import { repairStarter, type StarterBook } from './starter'
import { branchPetBook, repairPets, type PetBook } from './pets'
import { isOutfitId, OUTFIT_IDS, unlockedOutfits, type OutfitId } from './outfits'
import { emptyRankBook, RIVAL_IDS, type MonthResult, type RankBook, type RivalId, type Stars, type YearResult } from './rank'
import { emptyVipBook, VIP_IDS, type VipBook, type VipId } from './vips'
import { HINT_IDS, TUTORIAL_HINTS, type Customer, type DayStats, type Facing, type HintId, type Look, type Owner, type Tile } from './types'

/** Bump when SaveData changes shape; parseSave then upgrades older saves instead of rejecting them. */
export const SAVE_VERSION = 33
/** The version that brought the stairs: a save from before it has its stairs spot cleared on load. */
export const STAIRS_SAVE_VERSION = 14
/** The version from which the screens and the reception desk are furniture: a shop saved from before it, main or branch, gets them where they always stood, numbered after its other items. */
export const FURNISHED_SAVE_VERSION = 30
/** The version from which shops stand on the 37-column grid: a shop saved from before it, main or branch, moves SHOP_X0 columns right once. */
export const WIDE_SAVE_VERSION = 33

/** The old shop's furniture on the 13-column grid, where the oldest saves get theirs before the move to the wide grid. */
const LEGACY_ITEMS: Item[] = itemsFromLayout(SPA_LAYOUT_1A)

export class SaveError extends Error {}
/** A save written by a newer version of the game: it is valid, just not readable here, so it must be left alone. */
export class SaveTooNewError extends SaveError {}

/** The chain of shops, written in the main shop's save: where the owner is, the unlock card, and each branch as a save of its own. */
export interface ChainSave {
  at: PlaceId | null
  told: boolean
  branches: SaveData[]
}

/** The whole shop as plain JSON. */
export interface SaveData {
  v: number
  /** Where the shop is: null for the main shop. */
  place: PlaceId | null
  /** The chain; only the main shop has one, a branch has null. */
  chain: ChainSave | null
  day: number
  /** How many floors are open; 1 in a save from before floors. */
  floors: number
  /** Set by parseSave on a save from before the stairs: fromSave clears the stairs spot of furniture. Never written by toSave. */
  clearStairs?: true
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
  /** The lesson services whose tuition is paid and whose lesson is not passed yet. */
  lessonsPaid: LessonService[]
  /** What is left of each item. */
  stock: Record<StockItem, number>
  /** The regulars, what has been served and the gifts received. */
  book: GuestBook
  /** The VIPs, the booking and the gold board. */
  vip: VipBook
  /** The idols, the booking and the star wall. */
  idol: IdolBook
  /** The recipes tried and the hints heard. */
  recipes: RecipeBook
  /** What the shop has counted, and its quests. */
  progress: Progress
  /** The badges given; null for a shop saved before badges came, judged on its first load. */
  badges: Badges | null
  /** The festivals whose keepsake the shop has been given. */
  festival: FestivalBook
  /** Tomorrow's or today's event, the hot days and the day's event counts. */
  events: EventBook
  /** The shop's grade, this month's start and the year's scores. */
  rank: RankBook
  ownerOutfit: OutfitId
  outfitsSeen: OutfitId[]
  /** The last finished days' profits and the rest of what the shop needs to pay itself while closed. */
  away: AwayBook
  /** The starter chain: past for a shop from before it, or one that never ran it. */
  starter: StarterBook
  /** The shop's pets and whether Chú Sáu's litter has been taken. */
  pets: PetBook
  /** The real time of the last write, stamped by the session; null until then. */
  savedAt: number | null
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
  const bedIds = LEGACY_ITEMS.filter(i => i.kind === 'bed').map(i => i.id)
  const { stationCustomers: _, seatCustomers: __, ...rest } = old
  const owner = old.owner as Owner
  const task = owner.task?.kind === 'serve' ? { ...owner.task, stationId: bedIds[owner.task.stationId] } : owner.task
  return {
    ...rest,
    owner: { ...owner, task },
    customers: (old.customers as Customer[]).map(c => ({ ...c, stationId: c.stationId === null ? null : bedIds[c.stationId] })),
    items: structuredClone(LEGACY_ITEMS),
    nextItemId: LEGACY_ITEMS.length + 1,
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

/** Checks that `raw` looks like a saved chain of shops: the main shop with its branches; throws SaveError otherwise. */
export function parseSave(raw: unknown): SaveData {
  const data = parseShop(raw)
  // only the main shop has a chain, and it is not at a place; shops saved before version 23 get an empty one
  data.place = null
  data.chain = repairChain((raw as Record<string, unknown>).chain, data)
  return data
}

/** A branch is a shop at a place; a damaged one is repaired or dropped, never a reason to lose the main shop. */
function repairChain(raw: unknown, main: SaveData): ChainSave {
  const c = isObject(raw) ? raw : {}
  const shops: { data: SaveData; place: PlaceId | null }[] = []
  for (const b of Array.isArray(c.branches) ? c.branches : []) {
    if (!isObject(b)) continue
    try {
      const data = parseShop(b)
      shops.push({ data, place: isPlaceId(b.place) ? b.place : null })
    } catch (e) {
      if (!(e instanceof SaveError)) throw e
    }
  }
  // the first branch at a place keeps it and a second one there is dropped; one with no place or an unknown one gets the first free place the main shop has the stars for, else it is dropped
  const taken = new Set<PlaceId>()
  const lost = new Set<(typeof shops)[number]>()
  for (const s of shops) {
    if (!s.place) continue
    if (taken.has(s.place)) lost.add(s)
    else taken.add(s.place)
  }
  const kept: SaveData[] = []
  for (const s of shops) {
    if (lost.has(s)) continue
    if (!s.place) {
      s.place = PLACE_IDS.find(id => !taken.has(id) && PLACES[id].stars <= main.rank.stars) ?? null
      if (s.place) taken.add(s.place)
    }
    if (!s.place) continue
    // one clock and one purse for the chain; no chain inside a branch
    kept.push({ ...s.data, place: s.place, chain: null, day: main.day, minutes: main.minutes, money: main.money })
  }
  kept.sort((a, b) => PLACE_IDS.indexOf(a.place!) - PLACE_IDS.indexOf(b.place!))
  const at = isPlaceId(c.at) && kept.some(b => b.place === c.at) ? c.at : null
  return { at, told: c.told === true, branches: kept }
}

/** A shop saved from version 3 to before the furnished version gets the default screens and desk as its newest items; one that already holds a screen or desk, which no save from before the version can, was furnished already and is a parsed save parsed again; anything else, damaged saves included, passes through for parseVersioned to judge. */
function withScreensAndDesk(raw: unknown): unknown {
  if (!isObject(raw) || typeof raw.v !== 'number' || raw.v < 3 || raw.v >= FURNISHED_SAVE_VERSION) return raw
  if (!isNumber(raw.nextItemId) || !isItems(raw.items)) return raw
  if (raw.items.some(i => i.kind === 'screen' || i.kind === 'desk')) return raw
  // a damaged save may count its ids short, so the new ones start past every one it holds
  const first = Math.max(raw.nextItemId, ...raw.items.map(i => i.id + 1))
  const added = LEGACY_ITEMS.slice(-3).map((item, i) => ({ ...structuredClone(item), id: first + i }))
  return { ...raw, items: [...raw.items, ...added], nextItemId: first + added.length }
}

/** Checks that `raw` looks like a saved shop; throws SaveError otherwise. */
function parseShop(raw: unknown): SaveData {
  // read before parseVersioned, whose helpers rewrite `v` for the oldest saves
  // a stored parsed save keeps the flag, with `v` already rewritten, until the sim saves itself again
  const before = isObject(raw) && typeof raw.v === 'number' && raw.v < STAIRS_SAVE_VERSION
  const flagged = before || (isObject(raw) && raw.clearStairs === true)
  const narrow = isObject(raw) && typeof raw.v === 'number' && raw.v < WIDE_SAVE_VERSION
  const data = parseVersioned(withScreensAndDesk(raw))
  // floors are a whole number from 1 to MAX_FLOORS, else one; an older save has one, and its stairs spot is cleared on load
  data.floors = !before && Number.isInteger(data.floors) && data.floors >= 1 && data.floors <= MAX_FLOORS ? data.floors : 1
  if (flagged) data.clearStairs = true
  else delete data.clearStairs
  // a climb in progress is a time from zero up, else nothing
  const climb = <T extends { climbMs?: number }>(m: T): T => {
    if (!(isNumber(m.climbMs) && m.climbMs >= 0)) delete m.climbMs
    return m
  }
  // stock counts are whole numbers from zero up, else a full shelf; money spent restocking is a number, else nothing
  const stock: Record<string, unknown> = isObject(data.stock) ? data.stock : {}
  data.stock = Object.fromEntries(STOCK_ITEMS.map(i => [i, Number.isInteger(stock[i]) && (stock[i] as number) >= 0 ? stock[i] : STOCK_START])) as Record<StockItem, number>
  data.stats = { ...data.stats, restock: isNumber(data.stats.restock) ? data.stats.restock : 0 }
  // customers saved before the receptionist existed were never greeted
  data.customers = data.customers.map(c => ({ ...c, greet: isNumber(c.greet) ? c.greet : 0 }))
  // unknown services are dropped and shampoo is always open; a customer who wants an unknown one wants shampoo
  const known = Array.isArray(data.services) ? data.services : []
  data.services = SERVICE_IDS.filter(id => id === 'shampoo' || known.includes(id))
  data.lessonsPaid = repairLessons(data.lessonsPaid, data.services)
  data.customers = data.customers.map(c => ({ ...c, service: SERVICE_IDS.includes(c.service) ? c.service : 'shampoo' }))
  // every kind of customer is known; a missing or unknown one is an office worker
  data.customers = data.customers.map(c => ({ ...c, kind: CUSTOMER_KINDS.includes(c.kind) ? c.kind : 'office' }))
  // damaged staff data is repaired, never a reason to lose the shop
  data.staff = data.staff.map(s => ({ ...s, look: repairLook(s.look), task: repairTask(s.task), path: repairPath(s.path), facing: repairFacing(s.facing), moveTo: repairMoveTo(s.moveTo) }))
  data.candidates = data.candidates.map(c => ({ ...c, look: repairLook(c.look) }))
  // tiers and courses are repaired; a record with no tiers (saved before version 10) draws a specialty from one stream, staff then candidates
  const tierRng = createRng(data.day * 1009 + data.nextStaffId)
  data.staff = data.staff.map(s => ({
    ...s,
    tiers: repairTiers(s.tiers, s.role, () => drawTiers(tierRng, s.role, 1, data.services)),
    study: repairStudy(s.study, s.role),
  }))
  data.candidates = data.candidates.map(c => ({ ...c, tiers: repairTiers(c.tiers, c.role, () => drawTiers(tierRng, c.role, c.rare ? RARE_TIER : 1, BASIC_SERVICES)) }))
  // a trait that does not fit the role (or none, saved before version 11) is drawn from its own stream, staff then candidates
  const traitRng = createRng(data.day * 2003 + data.nextStaffId)
  data.staff = data.staff.map(s => ({ ...s, trait: traitFits(s.trait, s.role) ? s.trait : drawTrait(traitRng, s.role) }))
  data.candidates = data.candidates.map(c => ({ ...c, trait: traitFits(c.trait, c.role) ? c.trait : drawTrait(traitRng, c.role) }))
  // shops saved before the regulars have an empty book; a customer who is not a known regular is an ordinary one
  data.book = repairBook(data.book, data.day)
  data.customers = data.customers.map(c => ({ ...c, regular: REGULAR_IDS.includes(c.regular as never) ? c.regular : null, heldMs: isNumber(c.heldMs) ? c.heldMs : 0 }))
  // shops saved before the VIPs have an empty book and no booking; a customer who is not a known VIP is an ordinary one
  data.vip = repairVipBook(data.vip, data.day)
  data.idol = repairIdolBook(data.idol, data.day)
  data.customers = data.customers.map(c => ({ ...c, vip: VIP_IDS.includes(c.vip as VipId) ? c.vip : null }))
  // a customer who is not a known idol is an ordinary one
  data.customers = data.customers.map(c => ({ ...c, idol: IDOL_IDS.includes(c.idol as IdolId) ? c.idol : null }))
  // only Mi Mi is the KOL; everyone saved before version 18 is not
  data.customers = data.customers.map(c => ({ ...c, kol: c.kol === true }))
  // shops saved before version 12 have an empty recipe book; a recipe whose service is open is solved
  data.recipes = repairRecipes(data.recipes, data.services)
  data.items = data.items.map(({ gift, turned, ...i }) => ({ ...i, ...(typeof gift === 'boolean' && { gift }), ...(turned === true && canTurn(i.kind) && { turned }) }))
  data.stats = { ...data.stats, gifts: isNumber(data.stats.gifts) ? data.stats.gifts : 0, quests: isNumber(data.stats.quests) ? data.stats.quests : 0 }
  climb(data.owner)
  data.customers.forEach(climb)
  data.staff.forEach(climb)
  // shops saved before version 15 start counting now, so today is not recorded
  data.progress = repairProgress(data.progress)
  // shops saved before version 16 have no badge list yet
  data.badges = repairBadges(data.badges)
  // shops saved before version 17 have been given no keepsake
  data.festival = repairFestival(data.festival)
  // shops saved before version 18 have had no event, and the first may come tomorrow
  data.events = repairEvents(data.events, data.day)
  // shops saved before version 19 start at one star, their month counted from today
  data.rank = repairRank(data.rank, data.day, data.progress.dayStart ?? data.progress.total)
  // shops saved before version 20 wear the bà ba and have been told of nothing else
  const outfits = repairOutfits(data.ownerOutfit, data.outfitsSeen, Object.keys(data.badges ?? {}).length, data.rank.wins)
  data.ownerOutfit = outfits.ownerOutfit
  data.outfitsSeen = outfits.outfitsSeen
  // shops saved before version 21 have no away book and have never been paid for time closed
  data.away = repairAway(data.away)
  // shops saved before version 22 have passed the starter chain
  data.starter = repairStarter(data.starter)
  // shops saved before version 32 have no pets and have not been offered the litter; a branch never is
  data.pets = isPlaceId(data.place) ? branchPetBook() : repairPets(data.pets)
  data.savedAt = isNumber(data.savedAt) ? data.savedAt : null
  data.stats = { ...data.stats, ownerServed: repairCount(data.stats.ownerServed) }
  // shops saved before version 33 move onto the wide grid, once: the version is raised so a parsed save parsed again stays put
  if (narrow) {
    shiftShop(data, SHOP_X0)
    data.v = SAVE_VERSION
  }
  return data
}

/** Moves every tile the shop saved `dx` columns: its furniture, and where everyone stands and walks. */
function shiftShop(data: SaveData, dx: number): void {
  const tile = <T extends { x: number }>(t: T): T => ({ ...t, x: t.x + dx })
  data.items = data.items.map(tile)
  data.owner = { ...data.owner, pos: tile(data.owner.pos), path: data.owner.path.map(tile) }
  data.customers = data.customers.map(c => ({ ...c, pos: tile(c.pos), path: c.path.map(tile), seat: c.seat && tile(c.seat) }))
  data.staff = data.staff.map(s => ({ ...s, pos: tile(s.pos), path: s.path.map(tile) }))
}

/** Every kind but the celebrities whose day had come: the kinds an old shop has already met. */
export const oldShopKinds = (day: number): MainKind[] => MAIN_KINDS.filter(k => k !== 'celeb' && KINDS[k].fromDay <= day)

const repairCount = (x: unknown): number => (Number.isInteger(x) && (x as number) >= 0 ? (x as number) : 0)
const repairBool = (x: unknown): boolean => x === true
const repairNullable = (x: unknown): number | null => (isNumber(x) ? x : null)

function repairRegular(x: unknown): RegularState {
  const r = isObject(x) ? x : {}
  const points = isNumber(r.points) ? r.points : 0
  const hearts = Math.floor(Math.min(5, Math.max(0, Math.max(isNumber(r.hearts) ? r.hearts : 0, heartsFor(points)))))
  return { meetDay: repairNullable(r.meetDay), met: repairBool(r.met), points: hearts > 0 ? Math.max(points, HEART_AT[hearts - 1]) : points, hearts, visitAt: repairNullable(r.visitAt) }
}

/** A well-formed guest book, field by field; a missing one is empty, with the kinds an old shop of that day has met. */
function repairBook(x: unknown, day: number): GuestBook {
  const book = emptyBook()
  if (!isObject(x)) return { ...book, kindsMet: oldShopKinds(day) }
  const regulars: Record<string, unknown> = isObject(x.regulars) ? x.regulars : {}
  const served: Record<string, unknown> = isObject(x.served) ? x.served : {}
  for (const id of REGULAR_IDS) book.regulars[id] = repairRegular(regulars[id])
  for (const k of MAIN_KINDS) book.served[k] = repairCount(served[k])
  const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  book.kindsMet = list(x.kindsMet).filter((k): k is MainKind => (MAIN_KINDS as readonly unknown[]).includes(k))
  book.gifts = list(x.gifts).filter((k): k is ItemKind => (ITEM_KINDS as unknown[]).includes(k))
  book.extraCustomer = repairBool(x.extraCustomer)
  book.extraAt = repairNullable(x.extraAt)
  book.boardGiven = repairBool(x.boardGiven)
  return book
}

/** A well-formed idol book, field by field; a missing one is empty. A booking more than a day ahead, or for an unknown idol, is dropped. */
export function repairIdolBook(x: unknown, day: number): IdolBook {
  const book = emptyIdolBook()
  if (!isObject(x)) return book
  const idols: Record<string, unknown> = isObject(x.idols) ? x.idols : {}
  for (const id of IDOL_IDS) {
    const v = isObject(idols[id]) ? idols[id] : {}
    book.idols[id] = { visits: repairCount(v.visits), best: Math.min(3, repairCount(v.best)), photo: repairBool(v.photo), thanked: repairBool(v.thanked) }
  }
  const b = x.booking
  book.booking = isObject(b) && IDOL_IDS.includes(b.idol as IdolId) && Number.isInteger(b.day) && (b.day as number) <= day + 1 && isNumber(b.minute) ? { idol: b.idol as IdolId, day: b.day as number, minute: b.minute } : null
  book.nextDay = repairCount(x.nextDay)
  book.everBooked = repairBool(x.everBooked) || book.booking !== null || IDOL_IDS.some(id => book.idols[id].visits > 0)
  book.wallGiven = repairBool(x.wallGiven)
  return book
}

function repairCounts(x: unknown): Counts {
  const c = isObject(x) ? x : {}
  const services: Record<string, unknown> = isObject(c.services) ? c.services : {}
  const out = zeroCounts()
  for (const k of ['served', 'earned', 'tips', 'owner3', 'staff', 'lost', 'hearts', 'courses'] as const) out[k] = repairCount(c[k])
  for (const id of SERVICE_IDS) out.services[id] = repairCount(services[id])
  return out
}

const isKind = (x: unknown): x is QuestKind => (QUEST_KINDS as readonly unknown[]).includes(x)

/** A whole quest, or null for one too damaged to keep. */
function repairQuest(x: unknown, period: Quest['period']): Quest | null {
  if (!isObject(x) || !isKind(x.kind)) return null
  const service = x.kind === 'service' ? x.service : null
  if (x.kind === 'service' && !SERVICE_IDS.includes(service as ServiceId)) return null
  if (!Number.isInteger(x.target) || (x.target as number) < 1 || !isNumber(x.base) || x.base < 0) return null
  if (x.state !== 'open' && x.state !== 'done' && x.state !== 'failed') return null
  // only a month's service quest can be a festival's; a quest saved before festivals is none
  const festival = period === 'month' && x.kind === 'service' && FESTIVAL_IDS.includes(x.festival as FestivalId) ? (x.festival as FestivalId) : null
  return { kind: x.kind, period, service: service as ServiceId | null, target: x.target as number, reward: repairCount(x.reward), base: x.base, state: x.state, festival }
}

/** A record day: a whole day from one up and what it beat; anything else is none. */
function repairRecord(x: unknown): Life['record'] {
  if (!isObject(x) || !Number.isInteger(x.day) || (x.day as number) < 1 || (x.kind !== 'served' && x.kind !== 'profit')) return null
  return { day: x.day as number, kind: x.kind }
}

/** A well-formed progress block, field by field; a missing one is empty, with today left unrecorded. */
function repairProgress(x: unknown): Progress {
  const p = emptyProgress()
  if (!isObject(x)) return { ...p, dayStart: null }
  const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  p.total = repairCounts(x.total)
  p.dayStart = isObject(x.dayStart) ? repairCounts(x.dayStart) : null
  const isRecord = (r: unknown): r is DayRecord => isObject(r) && ['served', 'earned', 'tips', 'owner3', 'staff'].every(k => isNumber(r[k]) && (r[k] as number) >= 0)
  p.recent = list(x.recent).filter(isRecord).map(r => ({ served: r.served, earned: r.earned, tips: r.tips, owner3: r.owner3, staff: r.staff })).slice(-QUEST_RECENT_DAYS)
  const life = isObject(x.life) ? x.life : {}
  p.life = { dailies: repairCount(life.dailies), bestServed: repairCount(life.bestServed), bestProfit: isNumber(life.bestProfit) ? life.bestProfit : 0, cleanDay: repairBool(life.cleanDay), record: repairRecord(life.record) }
  p.questDay = repairCount(x.questDay)
  p.daily = list(x.daily).map(q => repairQuest(q, 'day')).filter((q): q is Quest => q !== null).slice(0, QUESTS_PER_DAY)
  p.yesterday = list(x.yesterday).filter(isKind)
  p.swaps = Math.min(QUEST_SWAPS_PER_DAY, repairCount(x.swaps))
  p.monthFrom = repairCount(x.monthFrom)
  p.monthly = repairQuest(x.monthly, 'month')
  p.lastMonthKind = isKind(x.lastMonthKind) ? x.lastMonthKind : null
  p.seenDay = repairCount(x.seenDay)
  return p
}

/** The known badges, each with a whole day from zero up; null when there is no badge list at all. */
export function repairBadges(x: unknown): Badges | null {
  if (!isObject(x)) return null
  return Object.fromEntries(BADGE_IDS.filter(id => Number.isInteger(x[id]) && (x[id] as number) >= 0).map(id => [id, x[id]])) as Badges
}

/** The outfit worn, one the shop has or else the bà ba, and the outfits it has been told about, known ones in wardrobe order with the bà ba always there. */
export function repairOutfits(worn: unknown, seen: unknown, badges: number, wins: number): { ownerOutfit: OutfitId; outfitsSeen: OutfitId[] } {
  const list = Array.isArray(seen) ? seen : []
  return {
    ownerOutfit: isOutfitId(worn) && unlockedOutfits(badges, wins).includes(worn) ? worn : 'baba',
    outfitsSeen: OUTFIT_IDS.filter(id => id === 'baba' || list.includes(id)),
  }
}

/** The known festivals, each once; none when there is no list. */
export function repairFestival(x: unknown): FestivalBook {
  const list = isObject(x) && Array.isArray(x.keepsakes) ? x.keepsakes : []
  return { keepsakes: FESTIVAL_IDS.filter(id => list.includes(id)).sort((a, b) => list.indexOf(a) - list.indexOf(b)) }
}

/**
 * A well-formed event book, field by field; a missing one is empty, its first event tomorrow at the earliest.
 * A plan of an unknown kind or more than a day ahead is dropped, as a VIP booking is.
 */
export function repairEvents(x: unknown, day: number): EventBook {
  if (!isObject(x)) return emptyEventBook(Math.max(day + 1, EVENT_FROM_DAY))
  const p = x.plan
  const plan =
    isObject(p) && EVENT_KINDS.includes(p.kind as EventKind) && Number.isInteger(p.day) && (p.day as number) <= day + 1 && isNumber(p.minute)
      ? { kind: p.kind as EventKind, day: p.day as number, minute: p.minute }
      : null
  return {
    nextDay: repairCount(x.nextDay),
    last: EVENT_KINDS.includes(x.last as EventKind) ? (x.last as EventKind) : null,
    plan,
    hotUntil: repairCount(x.hotUntil),
    hotDays: Number.isInteger(x.hotDays) && (x.hotDays as number) >= 1 ? (x.hotDays as number) : HOT_DAYS,
    hotBy: x.hotBy === 'kol' || IDOL_IDS.includes(x.hotBy as IdolId) ? (x.hotBy as HotBy) : 'kol',
    hotCardDay: repairCount(x.hotCardDay),
    count: repairCount(x.count),
    inspected: repairBool(x.inspected),
    certGiven: repairBool(x.certGiven),
  }
}

const isStar = (x: unknown): boolean => Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 5

/** A saved month result when it is whole enough for the views to read; null otherwise. */
function repairMonthResult(r: unknown): MonthResult | null {
  if (!isObject(r) || !Number.isInteger(r.day) || !isObject(r.input)) return null
  const i = r.input
  const nullable = (k: string): boolean => i[k] === null || isNumber(i[k])
  if (!nullable('rating') || !nullable('lostShare') || !isNumber(i.beauty) || !isNumber(i.services) || !isNumber(i.servedPerDay)) return null
  if (!Array.isArray(r.parts) || r.parts.length !== 5 || !r.parts.every(isNumber)) return null
  if (!isNumber(r.total) || !isNumber(r.reward) || !isStar(r.before) || !isStar(r.after)) return null
  return r as unknown as MonthResult
}

/** A saved year result when it is whole enough for the views to read, its gifts filtered to the known two; null otherwise. */
function repairYearResult(r: unknown): YearResult | null {
  if (!isObject(r) || !Number.isInteger(r.day) || !isNumber(r.year) || !isNumber(r.score) || !isNumber(r.reward)) return null
  if (!Number.isInteger(r.place) || (r.place as number) < 1 || (r.place as number) > 5) return null
  // the card draws one row per entry and hangs its only button under them, so any other count could push it off the screen
  if (!Array.isArray(r.table) || r.table.length !== 5 || !Array.isArray(r.gifts)) return null
  const rows = r.table.every(row => isObject(row) && (row.rival === null || RIVAL_IDS.includes(row.rival as RivalId)) && isNumber(row.pts))
  if (!rows) return null
  return { ...(r as unknown as YearResult), gifts: r.gifts.filter((g): g is 'trophy' | 'merit' => g === 'trophy' || g === 'merit') }
}

/**
 * A well-formed rank book, field by field; a missing one is one star with the month counted from `start` today.
 * A saved month or year result is kept only with its full shape (see repairMonthResult and repairYearResult).
 */
export function repairRank(x: unknown, day: number, start: { served: number; lost: number }): RankBook {
  const book = emptyRankBook(day, start.served, start.lost)
  if (!isObject(x)) return book
  if (isStar(x.stars)) book.stars = x.stars as Stars
  const m = x.month
  if (isObject(m) && [m.from, m.served, m.lost].every(n => Number.isInteger(n) && (n as number) >= 0) && (m.from as number) <= day) {
    book.month = { from: m.from as number, served: m.served as number, lost: m.lost as number }
  }
  book.scores = (Array.isArray(x.scores) ? x.scores : []).filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 100)
  book.last = repairMonthResult(x.last)
  book.lastYear = repairYearResult(x.lastYear)
  book.wins = repairCount(x.wins)
  book.meritGiven = repairBool(x.meritGiven)
  return book
}

/** A well-formed VIP book, field by field; a missing one is empty. A booking more than a day ahead is dropped, or it would block every later one. */
function repairVipBook(x: unknown, day: number): VipBook {
  const book = emptyVipBook()
  if (!isObject(x)) return book
  const vips: Record<string, unknown> = isObject(x.vips) ? x.vips : {}
  for (const id of VIP_IDS) {
    const v = isObject(vips[id]) ? vips[id] : {}
    book.vips[id] = { visits: repairCount(v.visits), best: Math.min(3, repairCount(v.best)), photo: repairBool(v.photo) }
  }
  const b = x.booking
  book.booking = isObject(b) && VIP_IDS.includes(b.vip as VipId) && Number.isInteger(b.day) && (b.day as number) <= day + 1 && isNumber(b.minute) ? { vip: b.vip as VipId, day: b.day as number, minute: b.minute } : null
  book.nextDay = repairCount(x.nextDay)
  book.everBooked = repairBool(x.everBooked) || book.booking !== null || VIP_IDS.some(id => book.vips[id].visits > 0)
  book.boardGiven = repairBool(x.boardGiven)
  return book
}

/** The lesson services that are in the list and not open yet, once each. */
function repairLessons(x: unknown, services: ServiceId[]): LessonService[] {
  const known = Array.isArray(x) ? x : []
  return LESSON_SERVICES.filter(id => known.includes(id) && !services.includes(id))
}

/** A well-formed recipe book: tries are whole mixes with their right count recomputed, heard are that recipe's hints, and a recipe is solved by an all-right try or an open service. */
function repairRecipes(x: unknown, services: ServiceId[]): RecipeBook {
  const book = emptyRecipes()
  const saved: Record<string, unknown> = isObject(x) ? x : {}
  for (const id of RECIPE_IDS) {
    const r = isObject(saved[id]) ? saved[id] : {}
    const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
    const tries = list(r.tries).flatMap(t => (isObject(t) && isMix(t.mix) ? [{ mix: [...t.mix], right: rightCount(id, t.mix) }] : []))
    const heard = RECIPES[id].hints.filter(h => list(r.heard).includes(h))
    book[id] = { solved: r.solved === true || tries.some(t => t.right === 3) || services.includes(id), tries, heard }
  }
  return book
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
  // a huge number would hide a technician or silence a receptionist all day: cap it, and drop a negative one
  if (x.kind === 'late' && isNumber(x.untilMinute) && x.untilMinute >= 0) return { kind: 'late', untilMinute: Math.min(x.untilMinute, DAY_START_MIN + LATE_MIN) }
  if (x.kind === 'chat' && isNumber(x.leftMs) && x.leftMs >= 0) return { kind: 'chat', leftMs: Math.min(x.leftMs, CHAT_MS_MAX) }
  if (x.kind === 'fetch' && isNumber(x.customerId)) return { kind: 'fetch', customerId: x.customerId }
  if (x.kind === 'serve' && isNumber(x.customerId) && isNumber(x.stationId) && isNumber(x.leftMs) && isNumber(x.totalMs))
    return { kind: 'serve', customerId: x.customerId, stationId: x.stationId, leftMs: x.leftMs, totalMs: x.totalMs }
  return null
}

/** A receptionist has no tiers; a technician's are whole numbers from 0 to MAX_TIER, and `fresh` draws them when there is no tiers object at all. */
function repairTiers(x: unknown, role: StaffRole, fresh: () => Tiers): Tiers {
  if (role === 'receptionist') return noTiers()
  if (!isObject(x)) return fresh()
  const tiers = noTiers()
  for (const id of SERVICE_IDS) {
    const n = x[id]
    if (Number.isInteger(n)) tiers[id] = Math.min(MAX_TIER, Math.max(0, n as number))
  }
  return tiers
}

/** Whether `x` is a personality the role can have. */
const traitFits = (x: unknown, role: StaffRole): boolean => (role === 'receptionist' ? RECEPTIONIST_TRAITS : TRAIT_IDS).includes(x as never)

/** A pending course that fits the role and has a payment from zero up, or none. */
function repairStudy(x: unknown, role: StaffRole): Study | null {
  if (!isObject(x) || !isNumber(x.paid) || x.paid < 0) return null
  const fits = role === 'receptionist' ? x.course === 'greet' : SERVICE_IDS.includes(x.course as ServiceId)
  return fits ? { course: x.course as Study['course'], paid: x.paid } : null
}

/** A list of whole tiles, or an empty one. */
const repairPath = (x: unknown): Tile[] => (Array.isArray(x) && x.every(t => isObject(t) && Number.isInteger(t.x) && Number.isInteger(t.y)) ? (x as Tile[]) : [])

/** A place or 'main', else nobody moves. */
const repairMoveTo = (x: unknown): MoveTo => (x === 'main' || isPlaceId(x) ? x : null)

const repairFacing = (x: unknown): Facing => (x === 'up' || x === 'left' || x === 'right' ? x : 'down')

function parseVersioned(raw: unknown): SaveData {
  if (!isObject(raw)) throw new SaveError('not a saved shop')
  if (typeof raw.v === 'number' && raw.v > SAVE_VERSION) throw new SaveTooNewError(`save version ${raw.v} is newer than ${SAVE_VERSION}`)
  if (raw.v !== 1 && raw.v !== 2 && raw.v !== 3 && raw.v !== 4 && raw.v !== 5 && raw.v !== 6 && raw.v !== 7 && raw.v !== 8 && raw.v !== 9 && raw.v !== 10 && raw.v !== 11 && raw.v !== 12 && raw.v !== 13 && raw.v !== 14 && raw.v !== 15 && raw.v !== 16 && raw.v !== 17 && raw.v !== 18 && raw.v !== 19 && raw.v !== 20 && raw.v !== 21 && raw.v !== 22 && raw.v !== 23 && raw.v !== 24 && raw.v !== 25 && raw.v !== 26 && raw.v !== 27 && raw.v !== 28 && raw.v !== 29 && raw.v !== 30 && raw.v !== 31 && raw.v !== 32 && raw.v !== SAVE_VERSION) throw new SaveError(`unknown save version ${String(raw.v)}`)
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
