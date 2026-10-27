import {
  STONE_GOOD,
  STONE_LIMIT_MS,
  STONE_MAX_HEAT,
  STONE_POT,
  STONE_RATE,
  STONE_RATE_HARD,
  STONE_SPOTS,
  STONE_STARS,
  STONE_START_HEAT,
} from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type StoneHeat = 'cold' | 'good' | 'hot'

export const heatOf = (h: number): StoneHeat => (h < STONE_GOOD.min ? 'cold' : h > STONE_GOOD.max ? 'hot' : 'good')

export const stoneStars = (score: number): Stars =>
  score >= STONE_STARS.three ? 3 : score >= STONE_STARS.two ? 2 : 1

interface Stone {
  heat: number
  rate: number
}

const between = (rng: Rng, r: { min: number; max: number }) => r.min + rng() * (r.max - r.min)

/**
 * Rules of the Đá nóng hot-stone game: four stones heat in a pot, and each is laid on the next of six spots by tapping.
 * A stone laid in the good band is right, one laid cold or hot is not; a fresh cold stone takes the place of each one laid.
 * A picky customer gets stones that heat faster.
 */
export class StoneGame {
  phase: 'play' | 'done' = 'play'
  elapsedMs = 0
  /** Each stone laid, in spot order. */
  placed: StoneHeat[] = []
  private pot: Stone[] = []
  private readonly rate: { min: number; max: number }

  constructor(private readonly rng: Rng, hard = false) {
    this.rate = hard ? STONE_RATE_HARD : STONE_RATE
    for (let i = 0; i < STONE_POT; i++) this.pot.push(this.fresh())
  }

  /** The pot's stones' heat, slot 0..3. */
  heats(): number[] {
    return this.pot.map(s => s.heat)
  }

  tick(ms: number): void {
    if (this.phase !== 'play' || ms <= 0) return
    const step = Math.min(ms, STONE_LIMIT_MS - this.elapsedMs)
    this.elapsedMs += step
    for (const s of this.pot) s.heat = Math.min(STONE_MAX_HEAT, s.heat + (s.rate * step) / 1000)
    if (this.elapsedMs >= STONE_LIMIT_MS) this.phase = 'done'
  }

  /** Lays pot stone `slot` on the next spot and returns its grade; a fresh stone takes its place. Out of range or done is null. */
  tap(slot: number): StoneHeat | null {
    if (this.phase !== 'play' || !Number.isInteger(slot) || slot < 0 || slot >= STONE_POT) return null
    const grade = heatOf(this.pot[slot].heat)
    this.placed.push(grade)
    this.pot[slot] = this.fresh()
    if (this.placed.length >= STONE_SPOTS) this.phase = 'done'
    return grade
  }

  /** Good stones laid minus hot ones. */
  score(): number {
    return this.placed.filter(g => g === 'good').length - this.placed.filter(g => g === 'hot').length
  }

  stars(): Stars | null {
    return this.phase === 'done' ? stoneStars(this.score()) : null
  }

  /** Draws the start heat, then the rate. */
  private fresh(): Stone {
    const heat = between(this.rng, STONE_START_HEAT)
    return { heat, rate: between(this.rng, this.rate) }
  }
}
