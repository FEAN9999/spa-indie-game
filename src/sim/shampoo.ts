import { DRY_SWIPES, DRY_SWIPES_HARD, FOAM_SWIPES, FOAM_SWIPES_HARD, RINSE_HOLD_MS, SHAMPOO_TIME_LIMIT_MS, STAR2_MS, STAR3_MS } from '../config'
import type { Stars } from './economy'

export type ShampooPhase = 'foam' | 'rinse' | 'dry' | 'done'

const NEXT: Record<Exclude<ShampooPhase, 'done'>, ShampooPhase> = { foam: 'rinse', rinse: 'dry', dry: 'done' }

/** Rules of the shampoo mini-game: foam by swiping, rinse by holding, dry by swiping. A picky customer needs more swiping. */
export class ShampooGame {
  phase: ShampooPhase = 'foam'
  elapsedMs = 0
  private amount = 0
  readonly limitMs: number
  private readonly goal: Record<Exclude<ShampooPhase, 'done'>, number>
  private finalStars: Stars | null = null

  constructor(
    private readonly extraMs = 0,
    hard = false,
  ) {
    this.limitMs = SHAMPOO_TIME_LIMIT_MS + extraMs
    this.goal = { foam: hard ? FOAM_SWIPES_HARD : FOAM_SWIPES, rinse: RINSE_HOLD_MS, dry: hard ? DRY_SWIPES_HARD : DRY_SWIPES }
  }

  swipe(hairWidths: number, onHair: boolean): void {
    if ((this.phase === 'foam' || this.phase === 'dry') && onHair) this.add(hairWidths)
  }

  hold(ms: number, onHair: boolean): void {
    if (this.phase === 'rinse' && onHair) this.add(ms)
  }

  tick(ms: number): void {
    if (this.phase === 'done') return
    this.elapsedMs += ms
    if (this.elapsedMs >= this.limitMs) this.finish(1)
  }

  progress(): number {
    if (this.phase === 'done') return 1
    return Math.min(1, this.amount / this.goal[this.phase])
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private add(value: number): void {
    if (this.phase === 'done') return
    this.amount += value
    if (this.amount < this.goal[this.phase]) return
    this.amount = 0
    this.phase = NEXT[this.phase]
    if (this.phase === 'done') this.finish(this.elapsedMs <= STAR3_MS + this.extraMs ? 3 : this.elapsedMs <= STAR2_MS + this.extraMs ? 2 : 1)
  }

  private finish(stars: Stars): void {
    this.phase = 'done'
    this.finalStars = stars
  }
}
