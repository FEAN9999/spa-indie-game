import { CHEF_CAP, CHEF_WAGE_PER_DOT, RARE_CHANCE, RARE_TIER, TIER_WORK_FACTOR, WAGE_BASE, WORK_FLOOR_MS } from '../config'
import { STAFF_NAMES } from '../strings/vi'
import type { Stars } from './economy'
import { DISH_IDS, type DishId } from './menu'
import { randomLook, type Rng } from './rng'
import { workMs } from './staff'
import type { Look, Mover } from './types'

export interface ChefStats {
  skill: number
  speed: number
}

/** How well a cook does each dish, 0 to RARE_TIER. */
export type DishTiers = Record<DishId, number>

/** Someone who can be hired as a cook. */
export interface ChefCandidate {
  name: string
  look: Look
  stats: ChefStats
  wage: number
  rare: boolean
  tiers: DishTiers
}

export type ChefTask =
  | { kind: 'order'; dinerId: number }
  | { kind: 'cook'; dinerId: number; stoveId: number; leftMs: number }
  | { kind: 'carry'; dinerId: number; stars: Stars }
  | { kind: 'exit' }

export interface Chef extends ChefCandidate, Mover {
  id: number
  task: ChefTask | null
  leaving: boolean
}

/** Daily wage: 20 000 for all ones, 5 000 more for each dot above that. */
export const chefWage = (s: ChefStats): number => WAGE_BASE + (s.skill + s.speed - 2) * CHEF_WAGE_PER_DOT

/** How many cooks a restaurant with `floors` floors and `houses` houses can hold. */
export function chefCap(floors: number, houses: number): number {
  return Math.min(CHEF_CAP.max, CHEF_CAP.base + (floors - 1) * CHEF_CAP.perFloor + houses * CHEF_CAP.perHouse)
}

/** A random cook whose name is not in `taken`, with one specialty dish. */
export function makeChefCandidate(rng: Rng, taken: string[]): ChefCandidate {
  const rare = rng() < RARE_CHANCE
  const stat = () => (rare ? 4 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 3))
  const skill = stat()
  const speed = stat()
  const look = randomLook(rng)
  const free = STAFF_NAMES.filter(n => !taken.includes(n))
  const name = free[Math.floor(rng() * free.length)]
  const tiers = Object.fromEntries(DISH_IDS.map(d => [d, 0])) as DishTiers
  tiers[DISH_IDS[Math.floor(rng() * DISH_IDS.length)]] = rare ? RARE_TIER : 1
  const stats = { skill, speed }
  return { name, look, stats, wage: chefWage(stats), rare, tiers }
}

/** Time at the stove for `dish`: each tier of it takes 15% off, down to a floor. */
export const cookMs = (c: ChefCandidate, dish: DishId): number => Math.max(Math.round(workMs(c.stats.speed) * TIER_WORK_FACTOR ** c.tiers[dish]), WORK_FLOOR_MS)

/** The skill the star roll for `dish` uses: skill plus the tier of that dish, up to 5. */
export const chefSkill = (c: ChefCandidate, dish: DishId): number => Math.min(5, c.stats.skill + c.tiers[dish])
