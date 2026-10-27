import {
  STEAM_DECOY_SHARE,
  STEAM_DECOY_SHARE_HARD,
  STEAM_FALL_MS,
  STEAM_FALL_MS_HARD,
  STEAM_LANE_JITTER,
  STEAM_LANES,
  STEAM_LIMIT_MS,
  STEAM_NEED,
  STEAM_SPAWN_MS,
  STEAM_STAR2,
} from '../config'
import type { Stars } from './economy'
import { RECIPES, type Ingredient } from './recipes'
import type { Rng } from './rng'

export type Decoy = 'guava' | 'chili' | 'banana'
export const DECOYS: readonly Decoy[] = ['guava', 'chili', 'banana']
export type SteamThing = Ingredient | Decoy

/** `x` runs 0..1 across, `y` from 0 at the top to 1 at the bottom. */
export interface Falling {
  id: number
  thing: SteamThing
  x: number
  y: number
  good: boolean
}

interface Item extends Falling {
  ageMs: number
  fallMs: number
}

const between = (rng: Rng, r: { min: number; max: number }) => r.min + rng() * (r.max - r.min)

/**
 * Rules of the Xông lá leaf-drop game: leaves and decoys fall down the screen, and the three recipe leaves are caught by tapping.
 * A decoy tapped is a miss; anything that reaches the bottom is simply gone. A picky customer gets more decoys that fall faster.
 */
export class SteamGame {
  phase: 'play' | 'done' = 'play'
  elapsedMs = 0
  got = 0
  misses = 0
  private items: Item[] = []
  private nextId = 1
  /** The lanes of the last two spawns, newest last. */
  private recentLanes: number[] = []
  /** Until the next spawn; the first comes at the first tick. */
  private waitMs = 0
  private readonly decoyShare: number
  private readonly fallMs: { min: number; max: number }

  constructor(private readonly rng: Rng, hard = false) {
    this.decoyShare = hard ? STEAM_DECOY_SHARE_HARD : STEAM_DECOY_SHARE
    this.fallMs = hard ? STEAM_FALL_MS_HARD : STEAM_FALL_MS
  }

  falling(): Falling[] {
    return this.items.map(({ id, thing, x, y, good }) => ({ id, thing, x, y, good }))
  }

  /** Runs the clock in one go: spawns, ages, removals, then the time limit. */
  tick(ms: number): void {
    if (this.phase !== 'play' || ms <= 0) return
    const step = Math.min(ms, STEAM_LIMIT_MS - this.elapsedMs)
    this.elapsedMs += step
    for (const it of this.items) it.ageMs += step
    this.waitMs -= step
    while (this.waitMs <= 0) {
      const it = this.spawn()
      it.ageMs = -this.waitMs
      this.items.push(it)
      this.waitMs += between(this.rng, STEAM_SPAWN_MS)
    }
    for (const it of this.items) it.y = it.ageMs / it.fallMs
    this.items = this.items.filter(it => it.y < 1)
    if (this.elapsedMs >= STEAM_LIMIT_MS) this.phase = 'done'
  }

  /** A good thing caught, a decoy wrong, nothing there null. */
  tap(id: number): 'good' | 'wrong' | null {
    if (this.phase !== 'play') return null
    const at = this.items.findIndex(it => it.id === id)
    if (at < 0) return null
    const [it] = this.items.splice(at, 1)
    if (!it.good) {
      this.misses++
      return 'wrong'
    }
    this.got++
    if (this.got >= STEAM_NEED) this.phase = 'done'
    return 'good'
  }

  stars(): Stars | null {
    if (this.phase !== 'done') return null
    if (this.got >= STEAM_NEED && this.misses === 0) return 3
    return this.got >= STEAM_STAR2.got && this.misses <= STEAM_STAR2.misses ? 2 : 1
  }

  /** Draws decoy or good, then which thing, then a lane not used by the last two spawns, the jitter in it, then the fall time. */
  private spawn(): Item {
    const good = this.rng() >= this.decoyShare
    const pool: readonly SteamThing[] = good ? RECIPES.steam.ingredients : DECOYS
    const thing = pool[Math.floor(this.rng() * pool.length)]
    const free = Array.from({ length: STEAM_LANES }, (_, i) => i).filter(l => !this.recentLanes.includes(l))
    const lane = free[Math.floor(this.rng() * free.length)]
    this.recentLanes = [...this.recentLanes, lane].slice(-2)
    const x = (lane + 0.5) / STEAM_LANES + (this.rng() * 2 - 1) * STEAM_LANE_JITTER
    const fallMs = between(this.rng, this.fallMs)
    return { id: this.nextId++, thing, x, y: 0, good, ageMs: 0, fallMs }
  }
}
