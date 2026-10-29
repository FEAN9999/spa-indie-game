import { BADGE_GOALS, MAX_TIER } from '../config'
import { REGULAR_IDS } from './regulars'

export const BADGE_IDS = [
  'served100',
  'served1000',
  'goldHands',
  'busyDay',
  'cleanDay',
  'firstCard',
  'fullBook',
  'vipPhoto',
  'vipBoard',
  'allServices',
  'firstRecipe',
  'floor2',
  'rooftop',
  'pretty',
  'fullCrew',
  'masterTech',
  'million',
  'bigProfit',
  'diligent',
  'fullYear',
] as const
export type BadgeId = (typeof BADGE_IDS)[number]

/** The badges a shop has: each one's day, or 0 for one an old shop already had when badges came. */
export type Badges = Partial<Record<BadgeId, number>>

/** What the badges are judged from, read off the shop at one moment. */
export interface BadgeShop {
  /** Customers served over the shop's life, VIPs included. */
  served: number
  owner3: number
  /** The most served in one day, today included. */
  bestServed: number
  cleanDay: boolean
  /** Regulars with the member card. */
  members: number
  /** Regulars with all five hearts. */
  fullHearts: number
  /** VIPs who signed their photo. */
  photos: number
  /** The VIPs' gold board hangs in the shop. */
  boardHung: boolean
  services: number
  /** Recipes mixed right. */
  recipes: number
  floors: number
  beauty: number
  /** Technicians who are not leaving. */
  technicians: number
  /** The highest tier any technician has in any service. */
  masterTier: number
  money: number
  bestProfit: number
  /** Daily quests finished. */
  dailies: number
  day: number
}

/** Each badge's number, the goal it must reach, and whether its medal shows a ring of how far it has come; a yes-or-no badge counts 1 for yes. */
export const BADGES: Record<BadgeId, { count: (s: BadgeShop) => number; goal: number; ring: boolean }> = {
  served100: { count: s => s.served, goal: BADGE_GOALS.served100, ring: true },
  served1000: { count: s => s.served, goal: BADGE_GOALS.served1000, ring: true },
  goldHands: { count: s => s.owner3, goal: BADGE_GOALS.goldHands, ring: true },
  busyDay: { count: s => s.bestServed, goal: BADGE_GOALS.busyDay, ring: true },
  cleanDay: { count: s => Number(s.cleanDay), goal: 1, ring: false },
  firstCard: { count: s => s.members, goal: 1, ring: false },
  fullBook: { count: s => s.fullHearts, goal: REGULAR_IDS.length, ring: true },
  vipPhoto: { count: s => s.photos, goal: 1, ring: false },
  vipBoard: { count: s => Number(s.boardHung), goal: 1, ring: false },
  allServices: { count: s => s.services, goal: BADGE_GOALS.allServices, ring: true },
  firstRecipe: { count: s => s.recipes, goal: 1, ring: false },
  floor2: { count: s => s.floors, goal: 2, ring: false },
  rooftop: { count: s => s.floors, goal: 3, ring: false },
  pretty: { count: s => s.beauty, goal: BADGE_GOALS.pretty, ring: true },
  fullCrew: { count: s => s.technicians, goal: BADGE_GOALS.fullCrew, ring: true },
  masterTech: { count: s => s.masterTier, goal: MAX_TIER, ring: false },
  million: { count: s => s.money, goal: BADGE_GOALS.million, ring: false },
  bigProfit: { count: s => s.bestProfit, goal: BADGE_GOALS.bigProfit, ring: true },
  diligent: { count: s => s.dailies, goal: BADGE_GOALS.diligent, ring: true },
  // a year is 36 days the shop has finished
  fullYear: { count: s => s.day - 1, goal: BADGE_GOALS.fullYear, ring: true },
}

export const badgeEarned = (id: BadgeId, s: BadgeShop): boolean => BADGES[id].count(s) >= BADGES[id].goal

/** How far a badge with a ring has come, as [done, goal] with done kept between 0 and the goal; null for one without a ring. */
export function badgeProgress(id: BadgeId, s: BadgeShop): [number, number] | null {
  const b = BADGES[id]
  return b.ring ? [Math.min(b.goal, Math.max(0, b.count(s))), b.goal] : null
}

/** The badges the shop has just reached and not been given, in the table's order. */
export const newBadges = (got: Badges, s: BadgeShop): BadgeId[] => BADGE_IDS.filter(id => got[id] === undefined && badgeEarned(id, s))
