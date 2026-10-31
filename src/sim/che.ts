import { CHE_ICE_MS_PER_TAP, CHE_ICE_TAPS, CHE_LAYER_THICK, CHE_LAYER_TOL, CHE_LAYER_TOL_HARD, CHE_LIMIT_MS, CHE_PASS_PX, CHE_POUR_MS, CHE_POUR_PASSES } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type CheMix = 'beans' | 'jelly'
export type IceAmount = 'little' | 'lots'
export interface CheTicket {
  mix: CheMix
  ice: IceAmount
  extraCoconut: boolean
}
export type ChePhase = 'layer' | 'ice' | 'pour' | 'done'

/** The layers from the bottom up. */
export const CHE_LAYERS = ['redBean', 'mungBean', 'jelly'] as const

/** Two rolls in a fixed order: the mix, then the ice. A hard diner asks for extra coconut. */
export function drawCheTicket(rng: Rng, hard: boolean): CheTicket {
  const mix: CheMix = rng() < 0.5 ? 'beans' : 'jelly'
  const ice: IceAmount = rng() < 0.5 ? 'little' : 'lots'
  return { mix, ice, extraCoconut: hard }
}

/** The glass fill each layer should reach: the running sums of the layer thicknesses. */
export function layerMarks(t: CheTicket): [number, number, number] {
  const [a, b, c] = CHE_LAYER_THICK[t.mix]
  return [a, a + b, a + b + c]
}

export function cheStars(r: { goodLayers: number; iceFast: boolean; pourDone: boolean }): Stars {
  const n = 1 + (r.goodLayers >= 2 ? 1 : 0) + (r.iceFast ? 1 : 0) - (r.goodLayers === 0 ? 1 : 0) - (r.pourDone ? 0 : 1)
  return Math.max(1, Math.min(3, n)) as Stars
}

/** Rules of the Chè game: pour three layers up to their marks, crush the ice with quick taps, then pour the coconut milk in passes across the glass. */
export class CheGame {
  phase: ChePhase = 'layer'
  elapsedMs = 0
  readonly limitMs = CHE_LIMIT_MS
  layer = 0
  level = 0
  goodLayers = 0
  taps = 0
  iceMs = 0
  iceFast = false
  passes = 0
  private layerStart = 0
  private anchor: number | null = null
  private far = 0
  private dir: 1 | -1 | 0 = 0
  private finalStars: Stars | null = null

  constructor(
    readonly ticket: CheTicket,
    readonly hard = false,
  ) {}

  hold(ms: number): void {
    if (this.phase !== 'layer') return
    this.level = Math.min(1, this.level + ms / CHE_POUR_MS)
    if (this.level >= 1) this.release()
  }

  release(): 'good' | 'off' | null {
    if (this.phase !== 'layer' || this.level <= this.layerStart) return null
    const tol = this.hard ? CHE_LAYER_TOL_HARD : CHE_LAYER_TOL
    const good = Math.abs(this.level - layerMarks(this.ticket)[this.layer]) <= tol
    if (good) this.goodLayers++
    this.layer++
    this.layerStart = this.level
    // A full glass has no room for the layers still to come, so they count as off.
    if (this.layer >= 3 || this.level >= 1) this.phase = 'ice'
    return good ? 'good' : 'off'
  }

  tap(): void {
    if (this.phase !== 'ice') return
    this.taps++
    if (this.taps < this.iceTarget()) return
    this.iceFast = this.iceMs <= CHE_ICE_MS_PER_TAP * this.iceTarget()
    this.phase = 'pour'
  }

  /** True when this move counted a pass. The first pass is CHE_PASS_PX from where the swipe began, the next ones CHE_PASS_PX back from the furthest point. */
  swipeTo(x: number): boolean {
    if (this.phase !== 'pour') return false
    if (this.anchor === null) {
      this.anchor = x
      this.far = x
      return false
    }
    if (this.dir === 0) {
      if (Math.abs(x - this.anchor) < CHE_PASS_PX) return false
      this.dir = x > this.anchor ? 1 : -1
      this.far = x
      return this.countPass()
    }
    if ((x - this.far) * this.dir > 0) {
      this.far = x
      return false
    }
    if (Math.abs(x - this.far) < CHE_PASS_PX) return false
    this.dir = this.dir === 1 ? -1 : 1
    this.far = x
    return this.countPass()
  }

  endSwipe(): void {
    this.anchor = null
    this.dir = 0
  }

  iceTarget(): number {
    return CHE_ICE_TAPS[this.ticket.ice]
  }

  passTarget(): number {
    return this.ticket.extraCoconut ? CHE_POUR_PASSES.extra : CHE_POUR_PASSES.base
  }

  tick(ms: number): void {
    if (this.phase === 'done') return
    this.elapsedMs += ms
    if (this.phase === 'ice') this.iceMs += ms
    if (this.elapsedMs >= this.limitMs) this.finish(false)
  }

  /** 0..1 for the bar: the layers fill the first 0.4, the ice the next 0.3 and the coconut milk the last 0.3. */
  progress(): number {
    if (this.phase === 'done') return 1
    if (this.phase === 'layer') return this.level * 0.4
    if (this.phase === 'ice') return 0.4 + (0.3 * this.taps) / this.iceTarget()
    return 0.7 + (0.3 * this.passes) / this.passTarget()
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private countPass(): boolean {
    this.passes++
    if (this.passes >= this.passTarget()) this.finish(true)
    return true
  }

  private finish(pourDone: boolean): void {
    this.phase = 'done'
    this.finalStars = cheStars({ goodLayers: this.goodLayers, iceFast: this.iceFast, pourDone })
  }
}
