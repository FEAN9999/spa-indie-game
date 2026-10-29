import {
  FOOT_GAP_HARD_MS,
  FOOT_GAP_MS,
  FOOT_LEAD_MS,
  FOOT_LIMIT_MS,
  FOOT_NEXT_MS,
  FOOT_ON_HARD_MS,
  FOOT_ON_MS,
  FOOT_POINTS,
  FOOT_ROUNDS,
  FOOT_ROUNDS_HARD,
  FOOT_STARS,
  FOOT_TAP_R,
  FOOT_WRONG_MS,
} from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type FootPhase = 'lead' | 'show' | 'input' | 'wrong' | 'wrong2' | 'next' | 'done'

/** The point a tap reaches: the nearest within the tap radius, else none. */
export const footPointAt = (x: number, y: number): number | null => {
  let best: number | null = null
  let bestD = FOOT_TAP_R
  FOOT_POINTS.forEach((p, i) => {
    const d = Math.hypot(x - p.x, y - p.y)
    if (d <= bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

export const footStars = (passed: number, mistakes: number): Stars =>
  passed === 3 && mistakes <= FOOT_STARS.mistakes ? 3 : passed >= FOOT_STARS.pass2 ? 2 : 1

/**
 * Rules of the Ngâm chân game: the points of the sole light one by one and the player taps them back in order.
 * One sequence grows over three rounds. A wrong tap replays the round once from the first point; a second skips
 * it. The clock runs only while it is the player's turn to tap.
 */
export class FootGame {
  readonly seq: readonly number[]
  readonly rounds: readonly number[]
  phase: FootPhase = 'lead'
  phaseMs = 0
  round = 0
  /** Points tapped right so far this round. */
  idx = 0
  mistakes = 0
  passed = 0
  results: ('ok' | 'skip')[] = []
  /** Input time only. */
  elapsedMs = 0
  /** The point tapped wrong, for the red shake. */
  wrongPoint: number | null = null
  private replayed = false
  private readonly on: number
  private readonly gap: number

  constructor(rng: Rng, hard = false) {
    this.rounds = hard ? FOOT_ROUNDS_HARD : FOOT_ROUNDS
    this.on = hard ? FOOT_ON_HARD_MS : FOOT_ON_MS
    this.gap = hard ? FOOT_GAP_HARD_MS : FOOT_GAP_MS
    const seq: number[] = []
    for (let i = 0; i < this.rounds[this.rounds.length - 1]; i++) {
      let p = Math.floor(rng() * FOOT_POINTS.length)
      while (i > 0 && p === seq[i - 1]) p = Math.floor(rng() * FOOT_POINTS.length)
      seq.push(p)
    }
    this.seq = seq
  }

  length(): number {
    return this.rounds[this.round]
  }

  /** The point lit now, while the round is shown. */
  lit(): { step: number; point: number } | null {
    if (this.phase !== 'show') return null
    const step = Math.floor(this.phaseMs / (this.on + this.gap))
    if (step >= this.length() || this.phaseMs - step * (this.on + this.gap) >= this.on) return null
    return { step, point: this.seq[step] }
  }

  tap(point: number): 'right' | 'wrong' | null {
    if (this.phase !== 'input') return null
    if (point === this.seq[this.idx]) {
      this.idx++
      if (this.idx >= this.length()) {
        this.results.push('ok')
        this.passed++
        this.go('next')
      }
      return 'right'
    }
    this.mistakes++
    this.wrongPoint = point
    this.go(this.replayed ? 'wrong2' : 'wrong')
    this.replayed = true
    return 'wrong'
  }

  tick(ms: number): void {
    if (this.phase === 'done' || ms <= 0) return
    this.phaseMs += ms
    if (this.phase === 'input') {
      this.elapsedMs = Math.min(FOOT_LIMIT_MS, this.elapsedMs + ms)
      if (this.elapsedMs >= FOOT_LIMIT_MS) this.phase = 'done'
      return
    }
    if (this.phase === 'lead' && this.phaseMs >= FOOT_LEAD_MS) this.go('show')
    else if (this.phase === 'show' && this.phaseMs >= this.length() * (this.on + this.gap)) this.go('input')
    else if (this.phase === 'wrong' && this.phaseMs >= FOOT_WRONG_MS) this.go('lead')
    else if (this.phase === 'wrong2' && this.phaseMs >= FOOT_WRONG_MS) {
      this.results.push('skip')
      this.nextRound()
    } else if (this.phase === 'next' && this.phaseMs >= FOOT_NEXT_MS) this.nextRound()
  }

  progress(): number {
    const part = this.phase === 'input' || this.phase === 'wrong' ? this.idx / this.length() : 0
    return (this.results.length + part) / this.rounds.length
  }

  stars(): Stars | null {
    return this.phase === 'done' ? footStars(this.passed, this.mistakes) : null
  }

  /** Enters a phase; a new show or turn starts from the round's first point. */
  private go(phase: FootPhase): void {
    this.phase = phase
    this.phaseMs = 0
    if (phase === 'lead' || phase === 'input') this.idx = 0
  }

  private nextRound(): void {
    this.round++
    this.replayed = false
    if (this.round >= this.rounds.length) this.go('done')
    else this.go('lead')
  }
}
