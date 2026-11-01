import { BC_BAND, BC_BAND_HARD_SHRINK, BC_BROWN_MS, BC_FLIP_NEAR, BC_LIMIT_MS, BC_POUR_MS, BC_SAUCE_LINE, BC_SAUCE_NEAR, BC_SAUCE_TOL, BC_SAUCE_TOL_HARD } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type Grill = 'vua' | 'chay'
export interface BunChaTicket {
  grill: Grill
  chili: boolean
  extraHerb: boolean
}
export type BcSide = 'rau' | 'du' | 'ot'
export type BcResult = 'in' | 'near' | 'far'
export type BunChaPhase = 'grill' | 'sides' | 'pour' | 'done'

/** Two rolls in a fixed order: how brown the chả, then chili. A picky or hard customer adds an extra herbs line. */
export function drawBunChaTicket(rng: Rng, hard: boolean): BunChaTicket {
  const grill: Grill = rng() < 0.5 ? 'vua' : 'chay'
  const chili = rng() < 0.5
  return { grill, chili, extraHerb: hard }
}

/** The part of the needle's run that counts as grilled right; a hard diner's band is narrower. */
export function grillBand(t: BunChaTicket, hard: boolean): [number, number] {
  const [lo, hi] = BC_BAND[t.grill]
  const shrink = hard ? BC_BAND_HARD_SHRINK : 0
  return [lo + shrink, hi - shrink]
}

/** The sauce's fill that counts as right: the line, give or take the tolerance; a hard diner's is tighter. */
export function sauceBand(hard: boolean): [number, number] {
  const tol = hard ? BC_SAUCE_TOL_HARD : BC_SAUCE_TOL
  return [BC_SAUCE_LINE - tol, BC_SAUCE_LINE + tol]
}

/** How far `k` lands from the band [lo, hi]: inside, within `near` of it, or farther. */
const judge = (k: number, [lo, hi]: [number, number], near: number): BcResult => {
  const outside = k < lo ? lo - k : k > hi ? k - hi : 0
  return outside === 0 ? 'in' : outside < near ? 'near' : 'far'
}

/** Herbs (two for an extra-herbs ticket) and pickled papaya at least once each, and chili only when the ticket says so. */
export function sidesMatch(t: BunChaTicket, counts: Record<BcSide, number>): boolean {
  return counts.rau >= (t.extraHerb ? 2 : 1) && counts.du >= 1 && (t.chili ? counts.ot >= 1 : counts.ot === 0)
}

export function bunChaStars(r: { flips: BcResult[]; pour: BcResult; ticketOk: boolean }): Stars {
  const bothIn = r.flips.length === 2 && r.flips.every(f => f === 'in')
  const n = 1 + (bothIn ? 1 : 0) + (r.pour === 'in' ? 1 : 0) - (r.flips.some(f => f === 'far') ? 1 : 0) - (r.ticketOk ? 0 : 1)
  return Math.max(1, Math.min(3, n)) as Stars
}

/**
 * Rules of the Bún chả game: the grill basket browns one side, flipped when it reaches the ticket's band, then the other, taken off the same way;
 * then the sides to the ticket; then the dipping sauce poured to the line by holding. A side left until fully brown is turned by itself, burnt,
 * and sauce held to the brim stops there, spilt over. When time runs out every step not done counts as far off.
 */
export class BunChaGame {
  phase: BunChaPhase = 'grill'
  elapsedMs = 0
  readonly limitMs = BC_LIMIT_MS
  /** How brown the side over the coals is, 0 to 1. */
  brown = 0
  /** Each side's result, in the order turned, and how brown it was then. */
  flips: BcResult[] = []
  turnedAt: number[] = []
  counts: Record<BcSide, number> = { rau: 0, du: 0, ot: 0 }
  /** How full the sauce bowl is, 0 to 1, and whether it is being poured now. */
  sauce = 0
  pouring = false
  pour: BcResult | null = null
  private finalStars: Stars | null = null

  constructor(
    readonly ticket: BunChaTicket,
    readonly hard = false,
  ) {}

  /** Turns the basket: the side over the coals is judged and the other goes down, or, for the second, the chả comes off. */
  flip(): BcResult | null {
    if (this.phase !== 'grill') return null
    const result = judge(this.brown, grillBand(this.ticket, this.hard), BC_FLIP_NEAR)
    this.flips.push(result)
    this.turnedAt.push(this.brown)
    this.brown = 0
    if (this.flips.length >= 2) this.phase = 'sides'
    return result
  }

  add(side: BcSide): void {
    if (this.phase === 'sides') this.counts[side]++
  }

  doneSides(): void {
    if (this.phase === 'sides') this.phase = 'pour'
  }

  /** Holding starts the pour; only while pouring, before the sauce is judged. */
  startPour(): void {
    if (this.phase === 'pour') this.pouring = true
  }

  /** Letting go judges the sauce against the line, unless nothing was poured yet. */
  stopPour(): BcResult | null {
    if (this.phase !== 'pour' || !this.pouring) return null
    this.pouring = false
    if (this.sauce <= 0) return null
    this.pour = judge(this.sauce, sauceBand(this.hard), BC_SAUCE_NEAR)
    this.finish()
    return this.pour
  }

  tick(ms: number): void {
    if (this.phase === 'done' || ms <= 0) return
    this.elapsedMs += ms
    if (this.phase === 'grill') {
      this.brown = Math.min(1, this.brown + ms / BC_BROWN_MS)
      if (this.brown >= 1) this.flip()
    } else if (this.phase === 'pour' && this.pouring) {
      this.sauce = Math.min(1, this.sauce + ms / BC_POUR_MS)
      if (this.sauce >= 1) this.stopPour()
    }
    // a step above may have finished the game already
    if (this.finalStars !== null || this.elapsedMs < this.limitMs) return
    while (this.flips.length < 2) this.flips.push('far')
    this.pour ??= 'far'
    this.finish()
  }

  /** 0..1 for the bar: the two sides take the first half, the sides a share, then the sauce fills the rest. */
  progress(): number {
    if (this.phase === 'done') return 1
    if (this.phase === 'grill') return (this.flips.length + this.brown) * 0.25
    if (this.phase === 'sides') return 0.6
    return 0.7 + 0.3 * this.sauce
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private finish(): void {
    this.phase = 'done'
    this.pouring = false
    this.finalStars = bunChaStars({ flips: this.flips, pour: this.pour ?? 'far', ticketOk: sidesMatch(this.ticket, this.counts) })
  }
}
