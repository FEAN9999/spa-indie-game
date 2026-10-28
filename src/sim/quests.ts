import { CLEAN_DAY_MIN_SERVED, QUEST_RECENT_DAYS } from '../config'
import { dayProfit } from './economy'
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
