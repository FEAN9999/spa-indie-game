import {
  CLEAN_DAY_MIN_SERVED,
  DAYS_PER_MONTH,
  MONTH_QUEST_REWARD_FACTOR,
  QUEST_DEFAULT_DAY,
  QUEST_FLOOR,
  QUEST_HARD_FACTOR,
  QUEST_RECENT_DAYS,
  QUEST_REWARD_MIN,
  QUEST_REWARD_SHARE,
  QUEST_SWAPS_PER_DAY,
  QUEST_TARGET_SHARE,
  QUESTS_PER_DAY,
} from '../config'
import { monthStart } from './calendar'
import { dayProfit } from './economy'
import type { Rng } from './rng'
import { SERVICE_IDS, type ServiceId } from './services'
import type { DayStats } from './types'

/** Running counts, never reset: a quest measures from what they were when it was given. */
export interface Counts {
  served: number
  /** Service money and tips; never gifts or quest rewards. */
  earned: number
  tips: number
  /** Customers the owner served with three stars. */
  owner3: number
  /** Customers a technician served. */
  staff: number
  /** Customers who walked out, out of patience or with no seat. */
  lost: number
  /** Hearts regulars gained. */
  hearts: number
  /** Courses paid for. */
  courses: number
  services: Record<ServiceId, number>
}

export const zeroCounts = (): Counts => ({
  served: 0,
  earned: 0,
  tips: 0,
  owner3: 0,
  staff: 0,
  lost: 0,
  hearts: 0,
  courses: 0,
  services: Object.fromEntries(SERVICE_IDS.map(id => [id, 0])) as Record<ServiceId, number>,
})

/** What one finished day brought; targets are sized from the last few. */
export interface DayRecord {
  served: number
  earned: number
  tips: number
  owner3: number
  staff: number
}

/** Counts over the shop's whole life, for the badges. */
export interface Life {
  /** Daily quests finished. */
  dailies: number
  bestServed: number
  bestProfit: number
  /** A day with at least CLEAN_DAY_MIN_SERVED served and nobody walking out has happened. */
  cleanDay: boolean
}

export type QuestKind = 'serve' | 'owner3' | 'earn' | 'tips' | 'service' | 'staff' | 'noWalk' | 'heart' | 'study'

export interface Quest {
  kind: QuestKind
  period: 'day' | 'month'
  /** The service a `service` quest asks for; null for every other kind. */
  service: ServiceId | null
  target: number
  reward: number
  /** The count this quest measures, when it was given. */
  base: number
  state: 'open' | 'done' | 'failed'
}

export interface Progress {
  total: Counts
  /** `total` when today began; null when today began before the shop counted, so today is not recorded. */
  dayStart: Counts | null
  /** The last finished days, newest last. */
  recent: DayRecord[]
  life: Life
  /** The day `daily` was given for; 0 for never. */
  questDay: number
  daily: Quest[]
  /** The kinds of the day before's quests, which a new day avoids. */
  yesterday: QuestKind[]
  swaps: number
  /** The first day of the month `monthly` belongs to; 0 for none. */
  monthFrom: number
  monthly: Quest | null
  /** The kind of the month before's quest, which a new month avoids. */
  lastMonthKind: QuestKind | null
  /** The day the quest panel was last opened. */
  seenDay: number
}

export const emptyProgress = (): Progress => ({
  total: zeroCounts(),
  dayStart: zeroCounts(),
  recent: [],
  life: { dailies: 0, bestServed: 0, bestProfit: 0, cleanDay: false },
  questDay: 0,
  daily: [],
  yesterday: [],
  swaps: 0,
  monthFrom: 0,
  monthly: null,
  lastMonthKind: null,
  seenDay: 0,
})

/** Closes the day's books: records what it brought when it was counted from the start, and keeps the best day. */
export function recordDay(p: Progress, stats: DayStats): void {
  const { total, dayStart } = p
  if (dayStart) {
    p.recent.push({
      served: total.served - dayStart.served,
      earned: total.earned - dayStart.earned,
      tips: total.tips - dayStart.tips,
      owner3: total.owner3 - dayStart.owner3,
      staff: total.staff - dayStart.staff,
    })
    p.recent = p.recent.slice(-QUEST_RECENT_DAYS)
  }
  p.life.bestServed = Math.max(p.life.bestServed, stats.served)
  p.life.bestProfit = Math.max(p.life.bestProfit, dayProfit(stats))
  if (stats.served >= CLEAN_DAY_MIN_SERVED && stats.angry + stats.walkedAway === 0) p.life.cleanDay = true
}

/** What the shop has right now that decides which quests it can be given. */
export interface QuestShop {
  /** The services customers can ask for: open, with a bed. */
  available: ServiceId[]
  /** Technicians who are not leaving. */
  technicians: number
  /** A regular already met has fewer than five hearts. */
  heartable: boolean
  /** Such a regular is due today. */
  heartDue: boolean
  /** Someone who is not leaving has a course left to take. */
  canStudy: boolean
}

/** Money rounded to ten thousand đồng, and never less than that. */
export const roundMoney = (x: number): number => Math.max(10_000, Math.round(x / 10_000) * 10_000)

const isMoney = (kind: QuestKind): boolean => kind === 'earn' || kind === 'tips'

/** The count the quest measures, as it stands in `t`. */
export function countOf(q: Quest, t: Counts): number {
  switch (q.kind) {
    case 'serve': return t.served
    case 'owner3': return t.owner3
    case 'earn': return t.earned
    case 'tips': return t.tips
    case 'service': return q.service ? t.services[q.service] : 0
    case 'staff': return t.staff
    case 'noWalk': return t.lost
    case 'heart': return t.hearts
    case 'study': return t.courses
  }
}

/** How far the quest has come, up to its target; "nobody walks out" has no count to show. */
export const progressOf = (q: Quest, t: Counts): number => (q.kind === 'noWalk' ? 0 : Math.min(q.target, countOf(q, t) - q.base))

/** The daily kinds the shop can do, in a fixed order. */
export function dailyPool(shop: QuestShop): QuestKind[] {
  const pool: QuestKind[] = ['serve', 'owner3', 'earn', 'tips']
  if (shop.available.some(id => id !== 'shampoo')) pool.push('service')
  if (shop.technicians > 0) pool.push('staff')
  pool.push('noWalk')
  return pool
}

/** The monthly kinds the shop can do with `daysLeft` whole days of the month left, today included. */
export function monthlyPool(shop: QuestShop, daysLeft: number): QuestKind[] {
  const pool: QuestKind[] = ['serve', 'earn', 'owner3']
  if (shop.heartable && (daysLeft >= 2 || shop.heartDue)) pool.push('heart')
  if (shop.canStudy) pool.push('study')
  return pool
}

function shuffled<T>(list: T[], rng: Rng): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const x = out[i]
    out[i] = out[j]
    out[j] = x
  }
  return out
}

/** `n` kinds from the pool, those not in `avoid` first. */
export function pickKinds(pool: QuestKind[], avoid: (QuestKind | null)[], n: number, rng: Rng): QuestKind[] {
  const fresh = shuffled(pool.filter(k => !avoid.includes(k)), rng)
  const stale = shuffled(pool.filter(k => avoid.includes(k)), rng)
  return [...fresh, ...stale].slice(0, n)
}

/** The mean of the recent days, or the defaults before any day is finished. */
export function averageDay(recent: DayRecord[]): DayRecord {
  if (recent.length === 0) return { ...QUEST_DEFAULT_DAY }
  const mean = (k: keyof DayRecord) => recent.reduce((sum, r) => sum + r[k], 0) / recent.length
  return { served: mean('served'), earned: mean('earned'), tips: mean('tips'), owner3: mean('owner3'), staff: mean('staff') }
}

/** What a whole day's quest of this kind asks for; `services` is how many the shop can do. */
export function fullTarget(kind: QuestKind, avg: DayRecord, services: number): number {
  const share = QUEST_TARGET_SHARE
  switch (kind) {
    case 'serve': return Math.max(QUEST_FLOOR.serve, Math.round(share * avg.served))
    case 'owner3': return Math.min(QUEST_FLOOR.owner3Max, Math.max(QUEST_FLOOR.owner3Min, Math.round(share * avg.owner3)))
    case 'earn': return Math.max(QUEST_FLOOR.earn, roundMoney(share * avg.earned))
    case 'tips': return Math.max(QUEST_FLOOR.tips, roundMoney(share * avg.tips))
    case 'service': return Math.max(QUEST_FLOOR.service, Math.round((share * avg.served) / services))
    case 'staff': return Math.max(QUEST_FLOOR.staff, Math.round(share * avg.staff))
    default: return 1
  }
}

/** A plain daily quest's reward for a whole day. */
export const baseReward = (avg: DayRecord): number => Math.max(QUEST_REWARD_MIN, roundMoney(QUEST_REWARD_SHARE * avg.earned))

function given(kind: QuestKind, period: Quest['period'], service: ServiceId | null, target: number, reward: number, t: Counts): Quest {
  const q: Quest = { kind, period, service, target, reward, base: 0, state: 'open' }
  q.base = countOf(q, t)
  return q
}

/** A daily quest for `share` of a day, counting from `t`; a service quest draws its service from `rng`. */
export function dailyQuest(kind: QuestKind, avg: DayRecord, shop: QuestShop, share: number, t: Counts, rng: Rng): Quest {
  const options = shop.available.filter(id => id !== 'shampoo')
  const service = kind === 'service' ? options[Math.floor(rng() * options.length)] : null
  const full = fullTarget(kind, avg, shop.available.length) * share
  const target = kind === 'noWalk' ? 1 : isMoney(kind) ? roundMoney(full) : Math.max(1, Math.round(full))
  const hard = kind === 'owner3' || kind === 'noWalk' ? QUEST_HARD_FACTOR : 1
  return given(kind, 'day', service, target, roundMoney(baseReward(avg) * hard * share), t)
}

/** A monthly quest for `daysLeft` days, which may end in part of a day, counting from `t`. */
export function monthlyQuest(kind: QuestKind, avg: DayRecord, shop: QuestShop, daysLeft: number, t: Counts): Quest {
  const full = fullTarget(kind, avg, shop.available.length) * daysLeft
  let target = 1
  if (kind === 'earn') target = roundMoney(full)
  else if (kind === 'owner3') target = Math.max(Math.round(QUEST_FLOOR.monthOwner3 * Math.min(1, daysLeft)), Math.round(full))
  else if (kind === 'serve') target = Math.round(full)
  const reward = roundMoney((MONTH_QUEST_REWARD_FACTOR * baseReward(avg) * daysLeft) / DAYS_PER_MONTH)
  return given(kind, 'month', null, Math.max(1, target), reward, t)
}

/** Today's quests for `share` of a day, avoiding yesterday's kinds while there are others, with today's swap. */
export function rollDay(p: Progress, day: number, shop: QuestShop, share: number, rng: Rng): void {
  p.yesterday = p.questDay === day - 1 ? p.daily.map(q => q.kind) : []
  const avg = averageDay(p.recent)
  p.daily = pickKinds(dailyPool(shop), p.yesterday, QUESTS_PER_DAY, rng).map(k => dailyQuest(k, avg, shop, share, p.total, rng))
  p.swaps = QUEST_SWAPS_PER_DAY
  p.questDay = day
}

/** The month's quest for `daysLeft` days, avoiding last month's kind while there are others. */
export function rollMonth(p: Progress, day: number, shop: QuestShop, daysLeft: number, rng: Rng): void {
  p.lastMonthKind = p.monthly?.kind ?? p.lastMonthKind
  const [kind] = pickKinds(monthlyPool(shop, Math.ceil(daysLeft)), [p.lastMonthKind], 1, rng)
  p.monthly = monthlyQuest(kind, averageDay(p.recent), shop, daysLeft, p.total)
  p.monthFrom = monthStart(day)
}

/** Swaps daily quest `i`, failed or still open, for a kind none of today's quests has, sized for `share` of a day. */
export function swap(p: Progress, i: number, shop: QuestShop, share: number, rng: Rng): 'swaps' | 'done' | null {
  if (p.swaps <= 0) return 'swaps'
  if (p.daily[i].state === 'done') return 'done'
  const today = p.daily.map(q => q.kind)
  const [kind] = pickKinds(dailyPool(shop).filter(k => !today.includes(k)), p.yesterday, 1, rng)
  p.daily[i] = dailyQuest(kind, averageDay(p.recent), shop, share, p.total, rng)
  p.swaps--
  return null
}

/** Marks open quests done when their count reaches the target, daily ones first, and returns them; fails "nobody walks out" once someone has. */
export function settle(p: Progress): Quest[] {
  const done: Quest[] = []
  for (const q of [...p.daily, ...(p.monthly ? [p.monthly] : [])]) {
    if (q.state !== 'open') continue
    if (q.kind === 'noWalk') {
      if (p.total.lost > q.base) q.state = 'failed'
    } else if (countOf(q, p.total) - q.base >= q.target) {
      q.state = 'done'
      done.push(q)
    }
  }
  return done
}

/** At closing, "nobody walks out" still open is done; returns those. */
export function closeNoWalk(p: Progress): Quest[] {
  const done = p.daily.filter(q => q.kind === 'noWalk' && q.state === 'open')
  for (const q of done) q.state = 'done'
  return done
}
