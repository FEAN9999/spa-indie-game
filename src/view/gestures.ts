import { TAP_SLOP_PX } from '../config'

/** What one pointer event amounts to for the map. Distances are screen pixels; a release's speed is pixels per ms. */
export type GestureStep =
  | { kind: 'none' }
  | { kind: 'pan'; dx: number; dy: number }
  | { kind: 'pinch'; factor: number; x: number; y: number; dx: number; dy: number }
  | { kind: 'tap'; x: number; y: number }
  | { kind: 'release'; vx: number; vy: number }

type Mode = 'idle' | 'press' | 'pan' | 'pinch'

const NONE: GestureStep = { kind: 'none' }

/**
 * Tells taps, pans and pinches apart from raw pointer events. One finger past TAP_SLOP_PX pans; a second finger makes the
 * whole touch a pinch, and lifting one of two leaves the other panning from where it is. Only a single press that never
 * passed the slop taps.
 */
export class Gestures {
  private readonly at = new Map<number, { x: number; y: number }>()
  private mode: Mode = 'idle'
  private press = { x: 0, y: 0 }
  /** The pan finger's last point and time, and its last step's speed. */
  private last = { x: 0, y: 0, t: 0 }
  private speed = { vx: 0, vy: 0 }
  /** The pan has moved the map at least once: only then does lifting it release. */
  private panned = false
  /** The pinch's finger distance and midpoint at its last step. */
  private span = 0
  private mid = { x: 0, y: 0 }

  get busy(): boolean {
    return this.mode === 'pan' || this.mode === 'pinch'
  }

  down(id: number, x: number, y: number, t: number): GestureStep {
    this.at.set(id, { x, y })
    if (this.at.size === 1) {
      this.mode = 'press'
      this.press = { x, y }
      this.last = { x, y, t }
      this.speed = { vx: 0, vy: 0 }
      this.panned = false
    } else this.startPinch()
    return NONE
  }

  move(id: number, x: number, y: number, t: number): GestureStep {
    if (!this.at.has(id)) return NONE
    this.at.set(id, { x, y })
    if (this.mode === 'press') {
      if (Math.hypot(x - this.press.x, y - this.press.y) <= TAP_SLOP_PX) return NONE
      this.mode = 'pan'
    }
    if (this.mode === 'pan') {
      const dx = x - this.last.x
      const dy = y - this.last.y
      const dt = t - this.last.t
      this.speed = dt > 0 ? { vx: dx / dt, vy: dy / dt } : this.speed
      this.last = { x, y, t }
      this.panned = true
      return { kind: 'pan', dx, dy }
    }
    if (this.mode === 'pinch') {
      const [a, b] = [...this.at.values()]
      const span = Math.hypot(b.x - a.x, b.y - a.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const step: GestureStep = { kind: 'pinch', factor: this.span > 0 ? span / this.span : 1, x: mid.x, y: mid.y, dx: mid.x - this.mid.x, dy: mid.y - this.mid.y }
      this.span = span
      this.mid = mid
      return step
    }
    return NONE
  }

  up(id: number, x: number, y: number, t: number): GestureStep {
    if (!this.at.delete(id)) return NONE
    if (this.at.size === 0) {
      const mode = this.mode
      this.mode = 'idle'
      if (mode === 'press') return { kind: 'tap', x, y }
      if (mode === 'pan' && this.panned) return { kind: 'release', ...this.speed }
      return NONE
    }
    if (this.at.size === 1) {
      // the finger left pans from where it is
      const [rest] = [...this.at.values()]
      this.mode = 'pan'
      this.last = { ...rest, t }
      this.speed = { vx: 0, vy: 0 }
      this.panned = false
    } else this.startPinch()
    return NONE
  }

  cancel(): void {
    this.at.clear()
    this.mode = 'idle'
  }

  private startPinch(): void {
    const [a, b] = [...this.at.values()]
    this.mode = 'pinch'
    this.span = Math.hypot(b.x - a.x, b.y - a.y)
    this.mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
}
