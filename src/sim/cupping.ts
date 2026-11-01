import {
  CUPPING_CUPS,
  CUPPING_GOOD,
  CUPPING_LIMIT_MS,
  CUPPING_MARKS,
  CUPPING_MAX_RED,
  CUPPING_RATE,
  CUPPING_RATE_HARD,
  CUPPING_STARS,
} from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type CupGrade = 'light' | 'good' | 'dark'

export const cupGradeOf = (red: number): CupGrade => (red < CUPPING_GOOD.min ? 'light' : red > CUPPING_GOOD.max ? 'dark' : 'good')

export const cuppingStars = (score: number): Stars => (score >= CUPPING_STARS.three ? 3 : score >= CUPPING_STARS.two ? 2 : 1)

interface Cup {
  mark: number
  red: number
  rate: number
}

/**
 * Rules of the Giác hơi game: a tap on a free mark of the back sets a cup from the tray there, and the skin under it
 * reddens at the cup's own rate. A tap on a cup lifts it, graded by its red; a cup left on until CUPPING_MAX_RED comes off
 * by itself, dark. The tray holds CUPPING_CUPS, so no more sit on the back at once. When time runs out every cup still on
 * is lifted as it is. A picky customer's skin reddens faster.
 */
export class CuppingGame {
  phase: 'play' | 'done' = 'play'
  elapsedMs = 0
  /** Each mark's grade once its cup is lifted, null before. */
  readonly results: (CupGrade | null)[] = Array.from({ length: CUPPING_MARKS }, () => null)
  private cups: Cup[] = []
  private readonly rate: { min: number; max: number }

  constructor(private readonly rng: Rng, hard = false) {
    this.rate = hard ? CUPPING_RATE_HARD : CUPPING_RATE
  }

  /** Cups still in the tray. */
  free(): number {
    return CUPPING_CUPS - this.cups.length
  }

  /** The red under the cup on `mark`, or null when no cup sits there. */
  redOf(mark: number): number | null {
    return this.cups.find(c => c.mark === mark)?.red ?? null
  }

  /** A mark that has had no cup yet and has none now. */
  open(mark: number): boolean {
    return this.results[mark] === null && this.redOf(mark) === null
  }

  /** Sets a cup from the tray on `mark`, drawing its rate; false when done, the mark is taken or done, or the tray is empty. */
  place(mark: number): boolean {
    if (this.phase !== 'play' || !Number.isInteger(mark) || mark < 0 || mark >= CUPPING_MARKS) return false
    if (!this.open(mark) || this.free() <= 0) return false
    this.cups.push({ mark, red: 0, rate: this.rate.min + this.rng() * (this.rate.max - this.rate.min) })
    return true
  }

  /** Lifts the cup on `mark` and returns its grade; null when there is no cup there or the game is done. */
  lift(mark: number): CupGrade | null {
    if (this.phase !== 'play') return null
    const cup = this.cups.find(c => c.mark === mark)
    if (!cup) return null
    return this.takeOff(cup)
  }

  /** Reddens every cup; returns the marks whose cups came off by themselves, dark, or were lifted when time ran out. */
  tick(ms: number): number[] {
    if (this.phase !== 'play' || ms <= 0) return []
    const step = Math.min(ms, CUPPING_LIMIT_MS - this.elapsedMs)
    this.elapsedMs += step
    const off: number[] = []
    for (const cup of [...this.cups]) {
      cup.red = Math.min(CUPPING_MAX_RED, cup.red + (cup.rate * step) / 1000)
      if (cup.red >= CUPPING_MAX_RED) {
        off.push(cup.mark)
        this.takeOff(cup)
      }
    }
    if (this.phase === 'play' && this.elapsedMs >= CUPPING_LIMIT_MS) {
      for (const cup of [...this.cups]) {
        off.push(cup.mark)
        this.takeOff(cup)
      }
      this.phase = 'done'
    }
    return off
  }

  /** Good cups lifted minus dark ones. */
  score(): number {
    return this.results.filter(g => g === 'good').length - this.results.filter(g => g === 'dark').length
  }

  /** The share of marks whose cup is lifted. */
  progress(): number {
    return this.results.filter(g => g !== null).length / CUPPING_MARKS
  }

  stars(): Stars | null {
    return this.phase === 'done' ? cuppingStars(this.score()) : null
  }

  private takeOff(cup: Cup): CupGrade {
    const grade = cupGradeOf(cup.red)
    this.results[cup.mark] = grade
    this.cups = this.cups.filter(c => c !== cup)
    if (this.results.every(g => g !== null)) this.phase = 'done'
    return grade
  }
}
