import { BX_BAND, BX_BAND_HARD_SHRINK, BX_BROWN_MS, BX_FOLD_NEAR, BX_LIMIT_MS, BX_PAN, BX_RING, BX_SECTORS, BX_SPREAD_GOOD, BX_SPREAD_MIN } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type Filling = 'tom' | 'thit'
export type Crisp = 'vua' | 'ky'
export interface BanhXeoTicket {
  filling: Filling
  crisp: Crisp
  extraSprouts: boolean
}
export type BxTopping = 'tom' | 'thit' | 'gia'
export type FoldResult = 'in' | 'near' | 'far'
export type BanhXeoPhase = 'spread' | 'fill' | 'fold' | 'done'

/** Two rolls in a fixed order: filling, then crispness. A picky or hard customer adds an extra sprouts line. */
export function drawBanhXeoTicket(rng: Rng, hard: boolean): BanhXeoTicket {
  const filling: Filling = rng() < 0.5 ? 'tom' : 'thit'
  const crisp: Crisp = rng() < 0.5 ? 'vua' : 'ky'
  return { filling, crisp, extraSprouts: hard }
}

/** The share of the sectors around the pan that a swirl touched inside the ring. */
export function spreadCoverage(points: { x: number; y: number }[]): number {
  const hit = new Set<number>()
  for (const p of points) {
    const dx = p.x - BX_PAN.x
    const dy = p.y - BX_PAN.y
    const r = Math.hypot(dx, dy)
    if (r < BX_RING.inner || r > BX_RING.outer) continue
    const sector = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * BX_SECTORS) % BX_SECTORS
    hit.add(sector)
  }
  return hit.size / BX_SECTORS
}

/** The part of the needle's run that counts as folded right; a hard diner's band is narrower. */
export function foldBand(t: BanhXeoTicket, hard: boolean): [number, number] {
  const [lo, hi] = BX_BAND[t.crisp]
  const shrink = hard ? BX_BAND_HARD_SHRINK : 0
  return [lo + shrink, hi - shrink]
}

export function fillMatches(t: BanhXeoTicket, counts: Record<BxTopping, number>): boolean {
  const other: Filling = t.filling === 'tom' ? 'thit' : 'tom'
  return counts[t.filling] >= 1 && counts[other] === 0 && counts.gia >= (t.extraSprouts ? 2 : 1)
}

export function banhXeoStars(r: { spread: number; fold: FoldResult; ticketOk: boolean }): Stars {
  const n = 1 + (r.spread >= BX_SPREAD_GOOD ? 1 : 0) + (r.fold === 'in' ? 1 : 0) - (r.fold === 'far' ? 1 : 0) - (r.ticketOk ? 0 : 1)
  return Math.max(1, Math.min(3, n)) as Stars
}

/** Rules of the Bánh xèo game: swirl the batter around the pan, add the fillings to the ticket, then fold at the right brown. */
export class BanhXeoGame {
  phase: BanhXeoPhase = 'spread'
  elapsedMs = 0
  readonly limitMs = BX_LIMIT_MS
  spread = 0
  brown = 0
  fold: FoldResult | null = null
  counts: Record<BxTopping, number> = { tom: 0, thit: 0, gia: 0 }
  private finalStars: Stars | null = null

  constructor(
    readonly ticket: BanhXeoTicket,
    readonly hard = false,
  ) {}

  swirl(points: { x: number; y: number }[]): 'good' | 'thin' | 'short' | null {
    if (this.phase !== 'spread') return null
    const coverage = spreadCoverage(points)
    if (coverage < BX_SPREAD_MIN) return 'short'
    this.spread = coverage
    this.phase = 'fill'
    return coverage >= BX_SPREAD_GOOD ? 'good' : 'thin'
  }

  add(t: BxTopping): void {
    if (this.phase === 'fill') this.counts[t]++
  }

  doneFilling(): void {
    if (this.phase === 'fill') this.phase = 'fold'
  }

  foldNow(): FoldResult | null {
    if (this.phase !== 'fold') return null
    const [lo, hi] = foldBand(this.ticket, this.hard)
    const outside = this.brown < lo ? lo - this.brown : this.brown > hi ? this.brown - hi : 0
    this.fold = outside === 0 ? 'in' : outside < BX_FOLD_NEAR ? 'near' : 'far'
    this.finish()
    return this.fold
  }

  tick(ms: number): void {
    if (this.phase === 'done') return
    this.elapsedMs += ms
    if (this.phase === 'fold') {
      this.brown = Math.min(1, this.brown + ms / BX_BROWN_MS)
      if (this.brown >= 1) {
        this.foldNow()
        return
      }
    }
    if (this.elapsedMs < this.limitMs) return
    this.fold ??= 'far'
    this.finish()
  }

  /** 0..1 for the bar: nothing while spreading, a third once filling, then the browning fills the rest. */
  progress(): number {
    if (this.phase === 'done') return 1
    if (this.phase === 'spread') return 0
    if (this.phase === 'fill') return 0.35
    return 0.6 + 0.4 * this.brown
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private finish(): void {
    this.phase = 'done'
    this.finalStars = banhXeoStars({ spread: this.spread, fold: this.fold ?? 'far', ticketOk: fillMatches(this.ticket, this.counts) })
  }
}
