import { GC_DIP_MS, GC_DIP_MS_HARD, GC_DIP_SPAN, GC_LIMIT_MS, GC_ROLL, GC_ROLLS } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type GcFilling = 'tomThit' | 'tom'
export interface GoiCuonTicket {
  filling: GcFilling
  extraVeg: boolean
}
export type GcPart = 'tom' | 'thit' | 'bun' | 'rau'
export type DipResult = 'in' | 'fast' | 'slow'
export type RollResult = 'tight' | 'loose'
export type GoiCuonPhase = 'dip' | 'fill' | 'roll' | 'done'

/** One roll: shrimp and pork, or shrimp only. A picky or hard customer adds an extra greens line. */
export function drawGoiCuonTicket(rng: Rng, hard: boolean): GoiCuonTicket {
  return { filling: rng() < 0.5 ? 'tomThit' : 'tom', extraVeg: hard }
}

/** How long a dip may take to soften the rice paper just right; a hard diner's band is narrower. */
export const dipBand = (hard: boolean): { min: number; max: number } => (hard ? GC_DIP_MS_HARD : GC_DIP_MS)

/** Shrimp always, pork only for the shrimp-and-pork roll, noodles, and greens (two for an extra-greens ticket). */
export function partsMatch(t: GoiCuonTicket, counts: Record<GcPart, number>): boolean {
  return counts.tom >= 1 && (t.filling === 'tomThit' ? counts.thit >= 1 : counts.thit === 0) && counts.bun >= 1 && counts.rau >= (t.extraVeg ? 2 : 1)
}

export function goiCuonStars(r: { dip: DipResult | null; tight: number; loose: number; ticketOk: boolean }): Stars {
  const n = 1 + (r.dip === 'in' ? 1 : 0) + (r.tight >= GC_ROLLS ? 1 : 0) - (r.loose >= 2 ? 1 : 0) - (r.ticketOk ? 0 : 1)
  return Math.max(1, Math.min(3, n)) as Stars
}

/**
 * Rules of the Gỏi cuốn game: one stroke draws the rice paper through the water, judged by how long it took (too quick
 * leaves it stiff, too slow makes it soggy); then the fillings to the ticket; then upward swipes roll it up, a long one
 * tight and a short one loose. When time runs out the paper not dipped counts as not right and every roll not made as loose.
 */
export class GoiCuonGame {
  phase: GoiCuonPhase = 'dip'
  elapsedMs = 0
  readonly limitMs = GC_LIMIT_MS
  dipResult: DipResult | null = null
  counts: Record<GcPart, number> = { tom: 0, thit: 0, bun: 0, rau: 0 }
  rolls: RollResult[] = []
  private finalStars: Stars | null = null

  constructor(
    readonly ticket: GoiCuonTicket,
    readonly hard = false,
  ) {}

  /** A stroke `span` pixels across the water that took `ms`: too short is 'short' and nothing happens; else the dip is judged. */
  dip(span: number, ms: number): DipResult | 'short' | null {
    if (this.phase !== 'dip') return null
    if (span < GC_DIP_SPAN) return 'short'
    const { min, max } = dipBand(this.hard)
    this.dipResult = ms < min ? 'fast' : ms > max ? 'slow' : 'in'
    this.phase = 'fill'
    return this.dipResult
  }

  add(part: GcPart): void {
    if (this.phase === 'fill') this.counts[part]++
  }

  doneFilling(): void {
    if (this.phase === 'fill') this.phase = 'roll'
  }

  /** A swipe `up` pixels upward and `across` sideways: long enough is tight, shorter is loose, and too short or too slanted is no roll. */
  roll(across: number, up: number): RollResult | null {
    if (this.phase !== 'roll' || up < GC_ROLL.short || Math.abs(across) > up * GC_ROLL.slant) return null
    const result: RollResult = up >= (this.hard ? GC_ROLL.longHard : GC_ROLL.long) ? 'tight' : 'loose'
    this.rolls.push(result)
    if (this.rolls.length >= GC_ROLLS) this.finish()
    return result
  }

  tick(ms: number): void {
    if (this.phase === 'done' || ms <= 0) return
    this.elapsedMs += ms
    if (this.elapsedMs < this.limitMs) return
    while (this.rolls.length < GC_ROLLS) this.rolls.push('loose')
    this.finish()
  }

  /** 0..1 for the bar: nothing before the dip, a third once filling, then each roll fills the rest. */
  progress(): number {
    if (this.phase === 'done') return 1
    if (this.phase === 'dip') return 0
    if (this.phase === 'fill') return 0.35
    return 0.6 + (0.4 * this.rolls.length) / GC_ROLLS
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private finish(): void {
    this.phase = 'done'
    const tight = this.rolls.filter(r => r === 'tight').length
    this.finalStars = goiCuonStars({ dip: this.dipResult, tight, loose: this.rolls.length - tight, ticketOk: partsMatch(this.ticket, this.counts) })
  }
}
