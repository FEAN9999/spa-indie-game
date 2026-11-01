import { CT_BURN_MS, CT_FAN_PX, CT_GRILL_MS, CT_HEAT, CT_HEAT_HARD, CT_LIMIT_MS, CT_OIL_AT, CT_OIL_GOOD, CT_OIL_SPOTS, CT_SPOT_GAP_MS, CT_SPOT_MS, CT_SPOT_MS_HARD, CT_SPOT_R } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type CtCombo = 'bi' | 'cha' | 'trung'
export interface ComTamTicket {
  combo: CtCombo
  extraPickle: boolean
}
export type CtPart = CtCombo | 'chua'
export type CtGrill = 'in' | 'near' | 'far'
export type ComTamPhase = 'grill' | 'top' | 'oil' | 'done'

export const CT_COMBOS: readonly CtCombo[] = ['bi', 'cha', 'trung']

/** One roll for what goes beside the chop: shredded pork skin, steamed egg meatloaf or a fried egg. A picky or hard customer adds an extra pickles line. */
export function drawComTamTicket(rng: Rng, hard: boolean): ComTamTicket {
  return { combo: CT_COMBOS[Math.floor(rng() * CT_COMBOS.length)], extraPickle: hard }
}

/** The coals' numbers for a diner. */
export const ctHeat = (hard: boolean) => (hard ? CT_HEAT_HARD : CT_HEAT)

/** The ticket's side and nothing else of the three, and pickles (two for an extra-pickles ticket). */
export function partsMatch(t: ComTamTicket, counts: Record<CtPart, number>): boolean {
  return CT_COMBOS.every(c => (c === t.combo ? counts[c] >= 1 : counts[c] === 0)) && counts.chua >= (t.extraPickle ? 2 : 1)
}

export function comTamStars(r: { grill: CtGrill; caught: number; ticketOk: boolean }): Stars {
  const n = 1 + (r.grill === 'in' ? 1 : 0) + (r.caught >= CT_OIL_GOOD ? 1 : 0) - (r.grill === 'far' ? 1 : 0) - (r.ticketOk ? 0 : 1)
  return Math.max(1, Math.min(3, n)) as Stars
}

/**
 * Rules of the Cơm tấm game: fanning the coals keeps their heat up, and the chop grills while the heat is in the band, burning
 * while it is over the burn mark; it is judged by how long it burnt. Then the sides to the ticket. Then scallion oil: spots light on
 * the plate one after another, each caught by a tap before it fades. When time runs out the chop is far off if not grilled.
 */
export class ComTamGame {
  phase: ComTamPhase = 'grill'
  elapsedMs = 0
  readonly limitMs = CT_LIMIT_MS
  heat: number
  /** How grilled the chop is, 0 to 1, and how long the coals have been over the burn mark. */
  done = 0
  burnMs = 0
  grill: CtGrill | null = null
  counts: Record<CtPart, number> = { bi: 0, cha: 0, trung: 0, chua: 0 }
  /** The oil spots: where each lit, in order, and which were caught. */
  readonly spots: readonly number[]
  caught: boolean[] = []
  /** Time into the current spot: first its pause, then its light. */
  spotMs = 0
  private travel = 0
  private finalStars: Stars | null = null

  constructor(
    readonly ticket: ComTamTicket,
    readonly hard: boolean,
    rng: Rng,
  ) {
    this.heat = ctHeat(hard).start
    const spots: number[] = []
    for (let i = 0; i < CT_OIL_SPOTS; i++) {
      let at = Math.floor(rng() * CT_OIL_AT.length)
      while (spots.includes(at)) at = (at + 1) % CT_OIL_AT.length
      spots.push(at)
    }
    this.spots = spots
  }

  /** A finger moved `dx` pixels across the coals: every CT_FAN_PX of travel is one fan, which raises the heat. Returns the fans made. */
  fan(dx: number): number {
    if (this.phase !== 'grill') return 0
    this.travel += Math.abs(dx)
    let fans = 0
    while (this.travel >= CT_FAN_PX) {
      this.travel -= CT_FAN_PX
      this.heat = Math.min(1, this.heat + ctHeat(this.hard).fan)
      fans++
    }
    return fans
  }

  add(part: CtPart): void {
    if (this.phase === 'top') this.counts[part]++
  }

  doneTopping(): void {
    if (this.phase === 'top') this.go('oil')
  }

  /** The oil spot lit now, as its place in CT_OIL_AT, or null between spots. */
  litSpot(): number | null {
    if (this.phase !== 'oil' || this.spotMs < CT_SPOT_GAP_MS) return null
    return this.spots[this.caught.length]
  }

  /** A tap at (x, y): it catches the lit spot when close enough; 'missed' when a spot is lit but the tap is wide; null otherwise. */
  tap(x: number, y: number): 'caught' | 'missed' | null {
    const lit = this.litSpot()
    if (lit === null) return null
    const at = CT_OIL_AT[lit]
    if (Math.hypot(x - at.x, y - at.y) > CT_SPOT_R) return 'missed'
    this.nextSpot(true)
    return 'caught'
  }

  /** Runs the clock; returns 'faded' when a lit oil spot went out uncaught. */
  tick(ms: number): 'faded' | null {
    if (this.phase === 'done' || ms <= 0) return null
    this.elapsedMs += ms
    let faded: 'faded' | null = null
    if (this.phase === 'grill') {
      const h = ctHeat(this.hard)
      this.heat = Math.max(0, this.heat - (h.decay * ms) / 1000)
      if (this.heat > h.burn) this.burnMs += ms
      if (this.heat >= h.band[0] && this.heat <= h.band[1]) this.done = Math.min(1, this.done + ms / CT_GRILL_MS)
      if (this.done >= 1) {
        this.grill = this.burnMs <= CT_BURN_MS.in ? 'in' : this.burnMs <= CT_BURN_MS.near ? 'near' : 'far'
        this.go('top')
      }
    } else if (this.phase === 'oil') {
      this.spotMs += ms
      if (this.spotMs >= CT_SPOT_GAP_MS + (this.hard ? CT_SPOT_MS_HARD : CT_SPOT_MS)) {
        this.nextSpot(false)
        faded = 'faded'
      }
    }
    if (this.finalStars === null && this.elapsedMs >= this.limitMs) {
      this.grill ??= 'far'
      while (this.caught.length < CT_OIL_SPOTS) this.caught.push(false)
      this.finish()
    }
    return faded
  }

  /** 0..1 for the bar: the grill fills the first half, the sides a share, and each oil spot the rest. */
  progress(): number {
    if (this.phase === 'done') return 1
    if (this.phase === 'grill') return this.done * 0.5
    if (this.phase === 'top') return 0.6
    return 0.7 + (0.3 * this.caught.length) / CT_OIL_SPOTS
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private nextSpot(caught: boolean): void {
    this.caught.push(caught)
    this.spotMs = 0
    if (this.caught.length >= CT_OIL_SPOTS) this.finish()
  }

  private go(phase: ComTamPhase): void {
    this.phase = phase
    this.spotMs = 0
  }

  private finish(): void {
    this.phase = 'done'
    this.finalStars = comTamStars({ grill: this.grill ?? 'far', caught: this.caught.filter(c => c).length, ticketOk: partsMatch(this.ticket, this.counts) })
  }
}
