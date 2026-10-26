import {
  MASSAGE_GAP_MS,
  MASSAGE_GAP_MS_HARD,
  MASSAGE_GOOD_MS,
  MASSAGE_GOOD_MS_HARD,
  MASSAGE_HIT_R,
  MASSAGE_HOLD_INDICES,
  MASSAGE_HOLD_LIMIT_MS,
  MASSAGE_HOLD_MS,
  MASSAGE_PERFECT_MS,
  MASSAGE_PERFECT_MS_HARD,
  MASSAGE_POINTS,
  MASSAGE_SCORE,
  MASSAGE_STAR2_SCORE,
  MASSAGE_STAR3_SCORE,
  RING_MS,
  RING_MS_HARD,
} from '../config'
import type { Stars } from './economy'

export type Judgement = 'perfect' | 'good' | 'miss'

/** The point showing, in back units. `ring` runs from 1 as a tap point shows down to 0 as its ring closes, and from 0 to 1 as a hold fills. */
export interface MassagePoint {
  index: number
  kind: 'tap' | 'hold'
  x: number
  y: number
  ring: number
}

const kindOf = (index: number): MassagePoint['kind'] => (MASSAGE_HOLD_INDICES.includes(index) ? 'hold' : 'tap')

/**
 * Rules of the massage mini-game, in back units where the back is [−1, 1]²: ten points show one after another.
 * A tap point is pressed as its shrinking ring closes; a pressure point is held until its ring fills.
 * A picky customer's rings close faster, with tighter windows and shorter gaps.
 */
export class MassageGame {
  phase: 'play' | 'done' = 'play'
  elapsedMs = 0
  results: Judgement[] = []
  readonly ringMs: number
  private readonly perfectMs: number
  private readonly goodMs: number
  private readonly gapMs: number
  /** Until the next point shows; the first shows at once. */
  private waitMs = 0
  /** How long the point has shown, and how long its hold has been held. */
  private ageMs = 0
  private heldMs = 0
  private holding = false

  constructor(hard = false) {
    this.ringMs = hard ? RING_MS_HARD : RING_MS
    this.perfectMs = hard ? MASSAGE_PERFECT_MS_HARD : MASSAGE_PERFECT_MS
    this.goodMs = hard ? MASSAGE_GOOD_MS_HARD : MASSAGE_GOOD_MS
    this.gapMs = hard ? MASSAGE_GAP_MS_HARD : MASSAGE_GAP_MS
  }

  /** The point showing, or null between points and once done. */
  current(): MassagePoint | null {
    if (this.phase === 'done' || this.waitMs > 0) return null
    const index = this.results.length
    const kind = kindOf(index)
    const ring = kind === 'tap' ? Math.max(0, 1 - this.ageMs / this.ringMs) : this.heldMs / MASSAGE_HOLD_MS
    return { index, kind, x: MASSAGE_POINTS[index].x, y: MASSAGE_POINTS[index].y, ring }
  }

  /** A finger goes down at (x, y): a tap point on it is judged by how near its ring is to closing, a hold point starts filling. */
  press(x: number, y: number): void {
    const p = this.current()
    if (!p || Math.hypot(x - p.x, y - p.y) > MASSAGE_HIT_R) return
    if (p.kind === 'hold') {
      this.holding = true
      return
    }
    const off = Math.abs(this.ageMs - this.ringMs)
    this.judge(off <= this.perfectMs ? 'perfect' : off <= this.goodMs ? 'good' : 'miss')
  }

  /** The finger lifts: an unfilled hold empties. */
  release(): void {
    this.holding = false
    this.heldMs = 0
  }

  /** Runs the clock, judging each point at the moment it fills or runs out, so a long tick plays on into the next point. */
  tick(ms: number): void {
    let left = ms
    while (this.phase === 'play' && left > 0) {
      let step = left
      let verdict: Judgement | null = null
      if (this.waitMs > 0) step = Math.min(left, this.waitMs)
      else if (kindOf(this.results.length) === 'tap') {
        // unpressed by close + the good window
        const untilLate = this.ringMs + this.goodMs - this.ageMs
        if (left > untilLate) [step, verdict] = [untilLate, 'miss']
      } else {
        const untilFull = this.holding ? MASSAGE_HOLD_MS - this.heldMs : Infinity
        const untilLimit = MASSAGE_HOLD_LIMIT_MS - this.ageMs
        if (untilFull <= Math.min(left, untilLimit)) [step, verdict] = [untilFull, 'perfect']
        else if (untilLimit <= left) [step, verdict] = [untilLimit, 'miss']
      }
      left -= step
      this.elapsedMs += step
      if (this.waitMs > 0) this.waitMs -= step
      else {
        this.ageMs += step
        if (this.holding) this.heldMs += step
      }
      if (verdict) this.judge(verdict)
    }
  }

  /** Perfect 2, good 1, miss 0: out of 20. */
  score(): number {
    return this.results.reduce((sum, j) => sum + MASSAGE_SCORE[j], 0)
  }

  stars(): Stars | null {
    if (this.phase !== 'done') return null
    const score = this.score()
    return score >= MASSAGE_STAR3_SCORE ? 3 : score >= MASSAGE_STAR2_SCORE ? 2 : 1
  }

  lastJudgement(): Judgement | null {
    return this.results[this.results.length - 1] ?? null
  }

  private judge(j: Judgement): void {
    this.results.push(j)
    this.ageMs = 0
    this.release()
    if (this.results.length === MASSAGE_POINTS.length) this.phase = 'done'
    else this.waitMs = this.gapMs
  }
}

