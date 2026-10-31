import { PHO_BAND, PHO_BAND_HARD_SHRINK, PHO_BOIL_MS, PHO_BOIL_NEAR, PHO_CUT_MIN_SPAN, PHO_CUT_TOL, PHO_CUT_X, PHO_GOOD_CUTS, PHO_LIMIT_MS } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type Doneness = 'tai' | 'chin'
export interface PhoTicket {
  doneness: Doneness
  onion: 'little' | 'lots'
  chili: boolean
  extraHerb: boolean
}
export type Topping = 'onion' | 'chili' | 'herb'
export type BoilResult = 'in' | 'near' | 'far'
export type PhoPhase = 'cut' | 'boil' | 'top' | 'done'

/** Three rolls in a fixed order: doneness, onion, chili. A picky or hard customer adds an extra herb line. */
export function drawPhoTicket(rng: Rng, hard: boolean): PhoTicket {
  const doneness: Doneness = rng() < 0.5 ? 'tai' : 'chin'
  const onion = rng() < 0.5 ? 'little' : 'lots'
  const chili = rng() < 0.5
  return { doneness, onion, chili, extraHerb: hard }
}

/** The part of the needle's run that counts as cooked right; a hard customer's band is narrower. */
export function boilBand(t: PhoTicket, hard: boolean): [number, number] {
  const [lo, hi] = PHO_BAND[t.doneness]
  const shrink = hard ? PHO_BAND_HARD_SHRINK : 0
  return [lo + shrink, hi - shrink]
}

export function ticketMatches(t: PhoTicket, counts: Record<Topping, number>): boolean {
  const onionOk = t.onion === 'little' ? counts.onion === 1 : counts.onion >= 2
  const chiliOk = t.chili ? counts.chili >= 1 : counts.chili === 0
  const herbOk = counts.herb >= (t.extraHerb ? 2 : 1)
  return onionOk && chiliOk && herbOk
}

export function phoStars(r: { goodCuts: number; boil: BoilResult; ticketOk: boolean }): Stars {
  const n = 1 + (r.goodCuts >= PHO_GOOD_CUTS ? 1 : 0) + (r.boil === 'in' ? 1 : 0) - (r.boil === 'far' ? 1 : 0) - (r.ticketOk ? 0 : 1)
  return Math.max(1, Math.min(3, n)) as Stars
}

/** Rules of the Phở game: cut four times along dotted lines, hold the boil into the ticket's band, then top the bowl to the ticket. */
export class PhoGame {
  phase: PhoPhase = 'cut'
  elapsedMs = 0
  readonly limitMs = PHO_LIMIT_MS
  needle = 0
  cutsDone: boolean[] = PHO_CUT_X.map(() => false)
  goodCuts = 0
  boil: BoilResult | null = null
  counts: Record<Topping, number> = { onion: 0, chili: 0, herb: 0 }
  private finalStars: Stars | null = null

  constructor(
    readonly ticket: PhoTicket,
    readonly hard = false,
  ) {}

  cut(meanX: number, spanY: number): 'good' | 'off' | 'short' | null {
    if (this.phase !== 'cut') return null
    if (spanY < PHO_CUT_MIN_SPAN) return 'short'
    let nearest = -1
    PHO_CUT_X.forEach((x, i) => {
      if (this.cutsDone[i]) return
      if (nearest < 0 || Math.abs(meanX - x) < Math.abs(meanX - PHO_CUT_X[nearest])) nearest = i
    })
    this.cutsDone[nearest] = true
    const good = Math.abs(meanX - PHO_CUT_X[nearest]) <= PHO_CUT_TOL
    if (good) this.goodCuts++
    if (this.cutsDone.every(Boolean)) this.phase = 'boil'
    return good ? 'good' : 'off'
  }

  hold(ms: number): void {
    if (this.phase !== 'boil') return
    this.needle = Math.min(1, this.needle + ms / PHO_BOIL_MS)
    if (this.needle >= 1) this.release()
  }

  release(): BoilResult | null {
    if (this.phase !== 'boil' || this.needle <= 0) return null
    const [lo, hi] = boilBand(this.ticket, this.hard)
    const outside = this.needle < lo ? lo - this.needle : this.needle > hi ? this.needle - hi : 0
    this.boil = outside === 0 ? 'in' : outside < PHO_BOIL_NEAR ? 'near' : 'far'
    this.phase = 'top'
    return this.boil
  }

  add(t: Topping): void {
    if (this.phase === 'top') this.counts[t]++
  }

  serve(): void {
    if (this.phase === 'top') this.finish()
  }

  tick(ms: number): void {
    if (this.phase === 'done') return
    this.elapsedMs += ms
    if (this.elapsedMs < this.limitMs) return
    if (this.phase === 'boil') this.release()
    this.boil ??= 'far'
    this.finish()
  }

  /** 0..1 for the bar: cuts fill the first 0.4, the boil the next 0.3, the toppings the rest. */
  progress(): number {
    if (this.phase === 'done') return 1
    if (this.phase === 'cut') return (this.cutsDone.filter(Boolean).length / PHO_CUT_X.length) * 0.4
    if (this.phase === 'boil') return 0.4 + this.needle * 0.3
    return 0.7
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private finish(): void {
    this.phase = 'done'
    this.finalStars = phoStars({ goodCuts: this.goodCuts, boil: this.boil ?? 'far', ticketOk: ticketMatches(this.ticket, this.counts) })
  }
}
