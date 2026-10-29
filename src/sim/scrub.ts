import {
  SCRUB_CAP,
  SCRUB_CAP_HARD,
  SCRUB_DEAD_R,
  SCRUB_FAR_R,
  SCRUB_LIMIT_MS,
  SCRUB_REARM,
  SCRUB_SPOTS,
  SCRUB_SPOTS_HARD,
  SCRUB_STARS,
  SCRUB_TAU_S,
  SCRUB_TURNS,
} from '../config'
import type { Stars } from './economy'

export interface ScrubSpot {
  x: number
  y: number
}

const TURN = 2 * Math.PI

export const scrubStars = (cleaned: number, spots: number, burns: number): Stars =>
  cleaned === spots && burns <= SCRUB_STARS.burns ? 3 : cleaned >= SCRUB_STARS.clean2 ? 2 : 1

/**
 * Rules of the Chà muối biển game: circle a finger round each salt patch. Turns are counted by the angle swept round
 * the patch centre, either way round, and pause near the centre or far out. Going over the speed cap makes the
 * customer cry "Rát quá!" and drops the turn under way; counting resumes once the smoothed speed falls under
 * a share of the cap. Positions are relative to the back's centre.
 */
export class ScrubGame {
  phase: 'play' | 'done' = 'play'
  elapsedMs = 0
  readonly spots: readonly ScrubSpot[]
  readonly cap: number
  /** The patch being scrubbed. */
  index = 0
  /** Turns counted on it. */
  steps = 0
  /** Turns counted over the game. */
  turns = 0
  cleaned = 0
  burns = 0
  /** Signed radians swept toward the next turn. */
  acc = 0
  /** Smoothed, in turns a second. */
  speed = 0
  armed = true
  private lastA: number | null = null
  private moved = 0

  constructor(hard = false) {
    this.spots = hard ? SCRUB_SPOTS_HARD : SCRUB_SPOTS
    this.cap = hard ? SCRUB_CAP_HARD : SCRUB_CAP
  }

  spot(): ScrubSpot | null {
    return this.spots[this.index] ?? null
  }

  down(x: number, y: number): void {
    this.lastA = null
    this.move(x, y)
  }

  move(x: number, y: number): void {
    const s = this.spot()
    if (this.phase === 'done' || !s) return
    const dx = x - s.x
    const dy = y - s.y
    const r = Math.hypot(dx, dy)
    if (r < SCRUB_DEAD_R || r > SCRUB_FAR_R) {
      this.lastA = null
      return
    }
    const a = Math.atan2(dy, dx)
    if (this.lastA !== null) {
      let d = a - this.lastA
      if (d > Math.PI) d -= TURN
      else if (d <= -Math.PI) d += TURN
      this.moved += d
      if (this.armed) {
        this.acc += d
        if (Math.abs(this.acc) >= TURN) {
          this.acc = 0
          this.steps++
          this.turns++
          if (this.steps >= SCRUB_TURNS) {
            this.cleaned++
            this.index++
            this.steps = 0
            this.lastA = null
            if (this.index >= this.spots.length) this.phase = 'done'
            return
          }
        }
      }
    }
    this.lastA = a
  }

  up(): void {
    this.lastA = null
  }

  tick(ms: number): void {
    if (this.phase === 'done' || ms <= 0) return
    const dt = ms / 1000
    this.elapsedMs = Math.min(SCRUB_LIMIT_MS, this.elapsedMs + ms)
    this.speed += (Math.abs(this.moved) / dt / TURN - this.speed) * (1 - Math.exp(-dt / SCRUB_TAU_S))
    this.moved = 0
    if (this.armed && this.speed > this.cap) {
      this.armed = false
      this.burns++
      this.acc = 0
    } else if (!this.armed && this.speed < this.cap * SCRUB_REARM) {
      this.armed = true
    }
    if (this.elapsedMs >= SCRUB_LIMIT_MS) this.phase = 'done'
  }

  progress(): number {
    return (this.cleaned * SCRUB_TURNS + this.steps + Math.min(1, Math.abs(this.acc) / TURN)) / (this.spots.length * SCRUB_TURNS)
  }

  stars(): Stars | null {
    return this.phase === 'done' ? scrubStars(this.cleaned, this.spots.length, this.burns) : null
  }
}
