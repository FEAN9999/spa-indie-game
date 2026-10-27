import {
  MUD_ACCEL,
  MUD_BAND_RANGE,
  MUD_BAND_SPEED,
  MUD_HALF,
  MUD_HALF_HARD,
  MUD_LIMIT_MS,
  MUD_MAX_SPEED,
  MUD_RETARGET_MS,
  MUD_START,
  MUD_STARS,
  MUD_STEP_MS,
} from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type MudFeel = 'cold' | 'ok' | 'hot'

export const mudStars = (insideShare: number): Stars =>
  insideShare >= MUD_STARS.three ? 3 : insideShare >= MUD_STARS.two ? 2 : 1

const between = (rng: Rng, r: { min: number; max: number }) => r.min + rng() * (r.max - r.min)

/**
 * Rules of the Tắm bùn mud-bath game: holding heats the mark, releasing lets it cool, and the green band drifts
 * between random targets. The share of the time the mark spends inside the band sets the stars.
 * A picky customer gets a narrower band.
 */
export class MudGame {
  phase: 'play' | 'done' = 'play'
  elapsedMs = 0
  insideMs = 0
  /** The heat mark, 0 at the bottom of the column to 1 at the top. */
  mark = MUD_START.mark
  /** Signed, per second. */
  speed = 0
  /** The green band's centre. */
  band = MUD_START.band
  readonly half: number
  private held = false
  private target = MUD_START.band
  private untilRetarget = MUD_RETARGET_MS.first / 1000

  constructor(private readonly rng: Rng, hard = false) {
    this.half = hard ? MUD_HALF_HARD : MUD_HALF
  }

  hold(on: boolean): void {
    this.held = on
  }

  tick(ms: number): void {
    let left = Math.min(ms, MUD_LIMIT_MS - this.elapsedMs)
    while (this.phase === 'play' && left > 0) {
      const step = Math.min(MUD_STEP_MS, left)
      left -= step
      this.advance(step / 1000)
      this.elapsedMs += step
      if (this.elapsedMs >= MUD_LIMIT_MS) this.phase = 'done'
    }
  }

  feel(): MudFeel {
    return this.mark < this.band - this.half ? 'cold' : this.mark > this.band + this.half ? 'hot' : 'ok'
  }

  stars(): Stars | null {
    return this.phase === 'done' ? mudStars(this.insideMs / MUD_LIMIT_MS) : null
  }

  /** One sub-step of `dt` seconds. A retarget draws the new target, then the wait to the next one. */
  private advance(dt: number): void {
    this.untilRetarget -= dt
    if (this.untilRetarget <= 0) {
      this.target = between(this.rng, MUD_BAND_RANGE)
      this.untilRetarget = between(this.rng, MUD_RETARGET_MS) / 1000
    }
    const gap = this.target - this.band
    this.band += Math.sign(gap) * Math.min(Math.abs(gap), MUD_BAND_SPEED * dt)

    const accel = this.held ? MUD_ACCEL.up : -MUD_ACCEL.down
    this.speed = Math.max(-MUD_MAX_SPEED, Math.min(MUD_MAX_SPEED, this.speed + accel * dt))
    this.mark += this.speed * dt
    if (this.mark < 0) {
      this.mark = 0
      if (this.speed < 0) this.speed = 0
    } else if (this.mark > 1) {
      this.mark = 1
      if (this.speed > 0) this.speed = 0
    }
    if (Math.abs(this.mark - this.band) <= this.half) this.insideMs += dt * 1000
  }
}
