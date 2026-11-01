import { ACU_FILL_MS, ACU_FILL_MS_HARD, ACU_GAP_MS, ACU_GOOD, ACU_GOOD_HARD, ACU_LIMIT_MS, ACU_LIT_MS, ACU_POINTS, ACU_POINTS_HARD, ACU_STARS } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type AcuResult = 'good' | 'light' | 'hard' | 'miss'
export type AcuPhase = 'gap' | 'lit' | 'held' | 'done'

/** The band of the pressure ring that is right to let go in; a picky customer's is narrower. */
export const acuBand = (hard: boolean): { min: number; max: number } => (hard ? ACU_GOOD_HARD : ACU_GOOD)

export const acuStars = (score: number, n: number): Stars => (score >= n - ACU_STARS.short3 ? 3 : score >= n - ACU_STARS.short2 ? 2 : 1)

/**
 * Rules of the Bấm huyệt game: every point lights once, in an order shuffled at the start, after a short pause. A press on
 * the lit point holds it and fills the pressure ring; letting go judges the ring against the band. A ring held full is
 * painful and lets go by itself, and a lit point not pressed in time is missed. At the time limit every point left is missed.
 */
export class AcupressureGame {
  phase: AcuPhase = 'gap'
  phaseMs = 0
  elapsedMs = 0
  /** How full the held point's ring is, 0 to 1. */
  pressure = 0
  readonly order: readonly number[]
  readonly results: AcuResult[] = []
  private readonly fillMs: number
  private readonly band: { min: number; max: number }

  constructor(
    rng: Rng,
    readonly hard = false,
  ) {
    const n = hard ? ACU_POINTS_HARD : ACU_POINTS
    const order = Array.from({ length: n }, (_, i) => i)
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    this.order = order
    this.fillMs = hard ? ACU_FILL_MS_HARD : ACU_FILL_MS
    this.band = acuBand(hard)
  }

  /** The point lit or held now, else null. */
  current(): number | null {
    return this.phase === 'lit' || this.phase === 'held' ? this.order[this.results.length] : null
  }

  /** A press on `point`: it holds the lit point; a press anywhere else does nothing. */
  press(point: number): boolean {
    if (this.phase !== 'lit' || point !== this.current()) return false
    this.go('held')
    this.pressure = 0
    return true
  }

  /** Letting go of the held point judges its ring. */
  release(): AcuResult | null {
    if (this.phase !== 'held') return null
    return this.judge(this.pressure < this.band.min ? 'light' : this.pressure > this.band.max ? 'hard' : 'good')
  }

  /** Runs the clock; returns the result of a point that ended by itself (held full or missed), else null. */
  tick(ms: number): AcuResult | null {
    if (this.phase === 'done' || ms <= 0) return null
    this.elapsedMs += ms
    this.phaseMs += ms
    let ended: AcuResult | null = null
    if (this.phase === 'gap' && this.phaseMs >= ACU_GAP_MS) this.go('lit')
    else if (this.phase === 'lit' && this.phaseMs >= ACU_LIT_MS) ended = this.judge('miss')
    else if (this.phase === 'held') {
      this.pressure = Math.min(1, this.pressure + ms / this.fillMs)
      if (this.pressure >= 1) ended = this.judge('hard')
    }
    if (this.elapsedMs >= ACU_LIMIT_MS && this.results.length < this.order.length) {
      while (this.results.length < this.order.length) this.results.push('miss')
      this.go('done')
    }
    return ended
  }

  /** Good presses minus painful ones. */
  score(): number {
    return this.results.filter(r => r === 'good').length - this.results.filter(r => r === 'hard').length
  }

  progress(): number {
    return this.results.length / this.order.length
  }

  stars(): Stars | null {
    return this.phase === 'done' ? acuStars(this.score(), this.order.length) : null
  }

  private judge(result: AcuResult): AcuResult {
    this.results.push(result)
    this.pressure = 0
    this.go(this.results.length >= this.order.length ? 'done' : 'gap')
    return result
  }

  private go(phase: AcuPhase): void {
    this.phase = phase
    this.phaseMs = 0
  }
}
