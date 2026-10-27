import {
  CALM_WALK_FACTOR,
  DILIGENT_XP,
  GREET_PATIENCE_BASE,
  GREET_PATIENCE_PER_DOT,
  GREET_STUDY_PRICE,
  GREET_TIP_PER_DOT,
  JOLLY_GREET_PATIENCE,
  LEVEL_WAGE_RAISE,
  LEVEL_XP,
  MAX_TIER,
  QUICK_WORK_FACTOR,
  RARE_CHANCE,
  RARE_TIER,
  RECEPTIONIST_CHANCE,
  STAFF_STAR_ODDS,
  STAFF_TIP_PER_DOT,
  STAFF_WORK_MS_SLOW,
  STAFF_WORK_MS_STEP,
  STUDIOUS_RAISE,
  STUDIOUS_TUITION,
  STUDY_PRICE,
  TIER_WORK_FACTOR,
  WAGE_BASE,
  WAGE_PER_DOT,
  WORK_FLOOR_MS,
} from '../config'
import { STAFF_NAMES } from '../strings/vi'
import type { Stars } from './economy'
import { randomLook, type Rng } from './rng'
import { SERVICE_IDS, type ServiceId } from './services'
import type { Facing, Look, Tile, Vec } from './types'

export type StaffRole = 'receptionist' | 'technician'
export const STAFF_ROLES: StaffRole[] = ['receptionist', 'technician']

export const STAT_KEYS = ['skill', 'speed', 'friendly', 'stamina'] as const
export type StatKey = (typeof STAT_KEYS)[number]
export type StaffStats = Record<StatKey, number>

/** How well a technician does each service, 0 to MAX_TIER. */
export type Tiers = Record<ServiceId, number>

/** What a course teaches: a service, or greeting for a receptionist. */
export type Course = ServiceId | 'greet'

/** A paid course not yet finished: what it teaches and what has been paid so far. */
export interface Study {
  course: Course
  paid: number
}

export type TraitId = 'deft' | 'quick' | 'jolly' | 'diligent' | 'calm' | 'studious'
export const TRAIT_IDS: readonly TraitId[] = ['deft', 'quick', 'jolly', 'diligent', 'calm', 'studious']
/** The personalities a receptionist can have. */
export const RECEPTIONIST_TRAITS: readonly TraitId[] = ['jolly', 'diligent', 'studious']

/** Someone who can be hired. */
export interface Candidate {
  name: string
  role: StaffRole
  look: Look
  stats: StaffStats
  wage: number
  rare: boolean
  tiers: Tiers
  trait: TraitId
}

export type StaffTask =
  | { kind: 'fetch'; customerId: number }
  | { kind: 'serve'; customerId: number; stationId: number; leftMs: number; totalMs: number }
  | { kind: 'rest'; leftMs: number }
  | { kind: 'exit' }

export interface Staff extends Candidate {
  id: number
  level: number
  xp: number
  pos: Vec
  facing: Facing
  path: Tile[]
  task: StaffTask | null
  /** Customers served or greeted since the last rest. */
  sinceRest: number
  leaving: boolean
  study: Study | null
}

/** Daily wage: 20 000 for all ones, 2 500 more for each dot above that. */
export const wageFor = (stats: StaffStats): number => WAGE_BASE + (STAT_KEYS.reduce((sum, k) => sum + stats[k], 0) - STAT_KEYS.length) * WAGE_PER_DOT

export const noTiers = (): Tiers => Object.fromEntries(SERVICE_IDS.map(id => [id, 0])) as Tiers

/** A receptionist has no tiers; a technician has `tier` in one service picked from `pool` and 0 in the rest. */
export function drawTiers(rng: Rng, role: StaffRole, tier: number, pool: readonly ServiceId[]): Tiers {
  const tiers = noTiers()
  if (role === 'technician') tiers[pool[Math.floor(rng() * pool.length)]] = tier
  return tiers
}

/** One personality picked evenly from the ones `role` can have. */
export function drawTrait(rng: Rng, role: StaffRole): TraitId {
  const list = role === 'receptionist' ? RECEPTIONIST_TRAITS : TRAIT_IDS
  return list[Math.floor(rng() * list.length)]
}

/** The courses `s` can take: a technician's open services below MAX_TIER, a receptionist's Tiếp khách until 5 dots. */
export function courses(s: Staff, open: readonly ServiceId[]): Course[] {
  if (s.role === 'receptionist') return s.stats.friendly < 5 ? ['greet'] : []
  return SERVICE_IDS.filter(id => open.includes(id) && s.tiers[id] < MAX_TIER)
}

/** What `course` costs `s` now; the one place a price is worked out. */
export const tuition = (s: Staff, course: Course): number => {
  const price = course === 'greet' ? GREET_STUDY_PRICE[s.stats.friendly - 1] : STUDY_PRICE[s.tiers[course]]
  return s.trait === 'studious' ? Math.round((price * STUDIOUS_TUITION) / 1000) * 1000 : price
}

/** A random candidate whose name is not in `taken`. */
export function makeCandidate(rng: Rng, taken: string[]): Candidate {
  const role: StaffRole = rng() < RECEPTIONIST_CHANCE ? 'receptionist' : 'technician'
  const rare = rng() < RARE_CHANCE
  const stats = {} as StaffStats
  for (const k of STAT_KEYS) stats[k] = rare ? 4 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 3)
  const look = randomLook(rng)
  const free = STAFF_NAMES.filter(n => !taken.includes(n))
  const name = free[Math.floor(rng() * free.length)]
  const tiers = drawTiers(rng, role, rare ? RARE_TIER : 1, SERVICE_IDS)
  const trait = drawTrait(rng, role)
  return { name, role, look, stats, wage: wageFor(stats), rare, tiers, trait }
}

/** Time at the bed, in ms. */
export const workMs = (speed: number): number => STAFF_WORK_MS_SLOW - (speed - 1) * STAFF_WORK_MS_STEP

/** Time at the bed for `service`: each tier of it takes 15% off, down to a floor. */
export const serviceMs = (s: Candidate, service: ServiceId): number =>
  Math.max(Math.round(workMs(s.stats.speed) * TIER_WORK_FACTOR ** s.tiers[service] * (s.trait === 'quick' ? QUICK_WORK_FACTOR : 1)), WORK_FLOOR_MS)

/** The skill the star roll for `service` uses: skill plus the tier of that service, plus a dot if deft, up to 5. */
export const starSkill = (s: Candidate, service: ServiceId): number => Math.min(5, s.stats.skill + s.tiers[service] + (s.trait === 'deft' ? 1 : 0))

/** Tiles per second. */
export const walkSpeed = (speed: number): number => 3 + 0.5 * speed

/** Tiles per second for `s`: a calm one is slower. */
export const staffWalkSpeed = (s: Candidate): number => walkSpeed(s.stats.speed) * (s.trait === 'calm' ? CALM_WALK_FACTOR : 1)

/** Customers served (or greetings, twice as many for a receptionist) before a rest, one fewer for a diligent person, never under 1. */
export const restAfter = (s: Pick<Staff, 'role' | 'stats'> & { trait?: TraitId }): number =>
  Math.max(1, (s.stats.stamina + 2) * (s.role === 'receptionist' ? 2 : 1) - (s.trait === 'diligent' ? 1 : 0))

/** The stars a technician's work earns for a roll in [0, 1). */
export function staffStars(skill: number, roll: number): Stars {
  if (roll < STAFF_STAR_ODDS.three[skill - 1]) return 3
  if (roll >= 1 - STAFF_STAR_ODDS.one[skill - 1]) return 1
  return 2
}

export function levelFor(xp: number): number {
  let level = 1
  LEVEL_XP.forEach((need, i) => {
    if (xp >= need) level = i + 1
  })
  return level
}

/** One more customer: true when that is a level up, which raises a random stat below 5 and the wage. */
export function gainXp(s: Staff, rng: Rng): boolean {
  s.xp += s.trait === 'diligent' ? DILIGENT_XP : 1
  const level = levelFor(s.xp)
  if (level <= s.level) return false
  s.level = level
  const room = STAT_KEYS.filter(k => s.stats[k] < 5)
  if (room.length > 0) s.stats[room[Math.floor(rng() * room.length)]]++
  s.wage += LEVEL_WAGE_RAISE * (s.trait === 'studious' ? STUDIOUS_RAISE : 1)
  return true
}

/** How much longer a greeted customer waits. */
export const greetPatience = (friendly: number): number => GREET_PATIENCE_BASE + GREET_PATIENCE_PER_DOT * friendly

/** The tip multiplier: `greet` is the receptionist's friendliness (0 if nobody greeted), the technician's counts above 1. */
export const tipFactor = (greet: number, technicianFriendly: number | null): number =>
  1 + GREET_TIP_PER_DOT * greet + (technicianFriendly === null ? 0 : STAFF_TIP_PER_DOT * (technicianFriendly - 1))

/** How much longer a customer waits for `greeter`: a jolly one adds a little. */
export const greeterPatience = (greeter: Candidate): number => greetPatience(greeter.stats.friendly) + (greeter.trait === 'jolly' ? JOLLY_GREET_PATIENCE : 0)
