import { CF_DRIP_BAND, CF_DRIP_NEAR, CF_DRIP_RATE, CF_ICE, CF_LIMIT_MS, CF_MILK, CF_MILK_MOST, CF_MILK_NEAR, CF_MILK_POUR_MS, CF_MILK_TOL, CF_MILK_TOL_HARD } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type CfSweet = 'it' | 'vua'
export type CfIce = 'it' | 'nhieu'
export interface CaPheTicket {
  sweet: CfSweet
  ice: CfIce
  /** A strong cup: the coffee drips higher. */
  strong: boolean
}
export type CfResult = 'in' | 'near' | 'far'
export type CaPhePhase = 'milk' | 'drip' | 'ice' | 'done'

/** Two rolls in a fixed order: sweetness, then ice. A picky or hard customer wants it strong. */
export function drawCaPheTicket(rng: Rng, hard: boolean): CaPheTicket {
  const sweet: CfSweet = rng() < 0.5 ? 'it' : 'vua'
  const ice: CfIce = rng() < 0.5 ? 'it' : 'nhieu'
  return { sweet, ice, strong: hard }
}

/** The milk's right band round the ticket's mark; a hard diner's is tighter. */
export function milkBand(t: CaPheTicket, hard: boolean): [number, number] {
  const tol = hard ? CF_MILK_TOL_HARD : CF_MILK_TOL
  return [CF_MILK[t.sweet] - tol, CF_MILK[t.sweet] + tol]
}

/** Where the coffee should stand when the phin is lifted: higher for a strong cup. */
export const dripBand = (t: CaPheTicket): [number, number] => [...CF_DRIP_BAND[t.strong ? 'dam' : 'vua']]

const judge = (k: number, [lo, hi]: [number, number], near: number): CfResult => {
  const outside = k < lo ? lo - k : k > hi ? k - hi : 0
  return outside === 0 ? 'in' : outside < near ? 'near' : 'far'
}

export function caPheStars(r: { milk: CfResult; drip: CfResult; iceOk: boolean }): Stars {
  const n = 1 + (r.milk === 'in' ? 1 : 0) + (r.drip === 'in' ? 1 : 0) - (r.drip === 'far' ? 1 : 0) - (r.iceOk ? 0 : 1)
  return Math.max(1, Math.min(3, n)) as Stars
}

/**
 * Rules of the Cà phê sữa đá game: hold to pour condensed milk to the ticket's mark, judged on letting go (a can held to the
 * most stops there); then the phin drips coffee on top, lifted when it stands in the ticket's band (a glass dripped full runs
 * over); then ice cubes one by one, the ticket's count exactly. When time runs out every step not done counts as far off.
 */
export class CaPheGame {
  phase: CaPhePhase = 'milk'
  elapsedMs = 0
  readonly limitMs = CF_LIMIT_MS
  /** The milk's height in the glass, and the whole drink's once the coffee drips on it. */
  milk = 0
  level = 0
  pouring = false
  milkResult: CfResult | null = null
  dripResult: CfResult | null = null
  ice = 0
  private finalStars: Stars | null = null

  constructor(
    readonly ticket: CaPheTicket,
    readonly hard = false,
  ) {}

  startPour(): void {
    if (this.phase === 'milk') this.pouring = true
  }

  /** Letting go judges the milk, unless none was poured yet. */
  stopPour(): CfResult | null {
    if (this.phase !== 'milk' || !this.pouring) return null
    this.pouring = false
    if (this.milk <= 0) return null
    this.milkResult = judge(this.milk, milkBand(this.ticket, this.hard), CF_MILK_NEAR)
    this.level = this.milk
    this.phase = 'drip'
    return this.milkResult
  }

  /** Lifting the phin judges where the coffee stands. */
  lift(): CfResult | null {
    if (this.phase !== 'drip') return null
    this.dripResult = judge(this.level, dripBand(this.ticket), CF_DRIP_NEAR)
    this.phase = 'ice'
    return this.dripResult
  }

  addIce(): void {
    if (this.phase === 'ice') this.ice++
  }

  doneIce(): void {
    if (this.phase === 'ice') this.finish()
  }

  tick(ms: number): void {
    if (this.phase === 'done' || ms <= 0) return
    this.elapsedMs += ms
    if (this.phase === 'milk' && this.pouring) {
      this.milk = Math.min(CF_MILK_MOST, this.milk + ms / CF_MILK_POUR_MS)
      if (this.milk >= CF_MILK_MOST) this.stopPour()
    } else if (this.phase === 'drip') {
      this.level = Math.min(1, this.level + (CF_DRIP_RATE * ms) / 1000)
      if (this.level >= 1) this.lift()
    }
    if (this.finalStars !== null || this.elapsedMs < this.limitMs) return
    this.finish()
  }

  /** 0..1 for the bar: the milk a fifth, the drip up to two thirds, the ice the rest. */
  progress(): number {
    if (this.phase === 'done') return 1
    if (this.phase === 'milk') return 0
    if (this.phase === 'drip') return 0.2 + 0.45 * Math.min(1, (this.level - this.milk) / Math.max(0.01, dripBand(this.ticket)[0] - this.milk))
    return 0.7
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private finish(): void {
    this.phase = 'done'
    this.pouring = false
    this.finalStars = caPheStars({ milk: this.milkResult ?? 'far', drip: this.dripResult ?? 'far', iceOk: this.ice === CF_ICE[this.ticket.ice] })
  }
}
