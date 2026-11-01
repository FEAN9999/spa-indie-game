import { ACNE_AT, ACNE_LIFT_MS, ACNE_LIFT_MS_HARD, ACNE_LIMIT_MS, ACNE_POP_MS, ACNE_SPOTS, ACNE_SPOTS_HARD, ACNE_STARS, ACNE_TAP_R } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type AcneKind = 'white' | 'red'
/** A whitehead is whole until its core pops, then cleared (or bruised, held too long) and at last dabbed; a red one pressed turns angry. */
export type AcneState = 'whole' | 'cleared' | 'bruised' | 'angry'
export interface AcneSpot {
  at: number
  kind: AcneKind
  state: AcneState
  dabbed: boolean
}
export type AcnePhase = 'pop' | 'dab' | 'done'

export const acneStars = (r: { left: number; mistakes: number }): Stars =>
  r.left === 0 && r.mistakes <= ACNE_STARS.mistakes3 ? 3 : r.left <= ACNE_STARS.left2 && r.mistakes <= ACNE_STARS.mistakes2 ? 2 : 1

/**
 * Rules of the Lấy nhân mụn game: the blemishes sit at places drawn at the start, some whiteheads and the rest red. A press on a
 * whitehead holds it; after ACNE_POP_MS its core pops, and the finger must lift within the grace or the skin bruises. Lifting
 * before the pop leaves it whole to try again. A press on a red one is a mistake. Once every whitehead is cleared or bruised,
 * each of them is dabbed with gel by a tap. The game ends when all are dabbed, or at the time limit.
 */
export class AcneGame {
  phase: AcnePhase = 'pop'
  elapsedMs = 0
  readonly spots: AcneSpot[]
  /** The whitehead held now and for how long, else null. */
  held: number | null = null
  heldMs = 0
  mistakes = 0
  private readonly liftMs: number

  constructor(
    rng: Rng,
    readonly hard = false,
  ) {
    const { total, white } = hard ? ACNE_SPOTS_HARD : ACNE_SPOTS
    const places = ACNE_AT.map((_, i) => i)
    for (let i = places.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[places[i], places[j]] = [places[j], places[i]]
    }
    const kinds: AcneKind[] = Array.from({ length: total }, (_, i) => (i < white ? 'white' : 'red'))
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[kinds[i], kinds[j]] = [kinds[j], kinds[i]]
    }
    this.spots = kinds.map((kind, i) => ({ at: places[i], kind, state: 'whole', dabbed: false }))
    this.liftMs = hard ? ACNE_LIFT_MS_HARD : ACNE_LIFT_MS
  }

  /** The blemish nearest (x, y) within reach, else null. */
  spotAt(x: number, y: number): number | null {
    let best: number | null = null
    let bestD = ACNE_TAP_R
    this.spots.forEach((s, i) => {
      const d = Math.hypot(x - ACNE_AT[s.at].x, y - ACNE_AT[s.at].y)
      if (d <= bestD) {
        best = i
        bestD = d
      }
    })
    return best
  }

  /** A touch at (x, y): it holds a whole whitehead, angers a whole red one, or dabs a cleared spot once it is time to. */
  press(x: number, y: number): 'hold' | 'red' | 'dab' | null {
    if (this.phase === 'done' || this.held !== null) return null
    const i = this.spotAt(x, y)
    if (i === null) return null
    const s = this.spots[i]
    if (this.phase === 'pop') {
      if (s.state !== 'whole') return null
      if (s.kind === 'red') {
        s.state = 'angry'
        this.mistakes++
        return 'red'
      }
      this.held = i
      this.heldMs = 0
      return 'hold'
    }
    if (s.kind !== 'white' || s.dabbed) return null
    s.dabbed = true
    if (this.whites().every(w => w.dabbed)) this.phase = 'done'
    return 'dab'
  }

  /** Lifting the finger: before the pop the whitehead stays whole ('early'); after it, it is cleared. */
  release(): 'early' | 'cleared' | null {
    if (this.held === null) return null
    const s = this.spots[this.held]
    this.held = null
    if (s.state === 'whole') return 'early'
    this.afterClear()
    return 'cleared'
  }

  /** Runs the clock; tells when the held core pops, and when a finger left on too long bruises the skin. */
  tick(ms: number): 'pop' | 'bruise' | null {
    if (this.phase === 'done' || ms <= 0) return null
    this.elapsedMs += ms
    let told: 'pop' | 'bruise' | null = null
    if (this.held !== null) {
      const s = this.spots[this.held]
      this.heldMs += ms
      if (s.state === 'whole' && this.heldMs >= ACNE_POP_MS) {
        s.state = 'cleared'
        told = 'pop'
      }
      if (this.heldMs >= ACNE_POP_MS + this.liftMs) {
        s.state = 'bruised'
        this.mistakes++
        this.held = null
        this.afterClear()
        told = 'bruise'
      }
    }
    if (this.elapsedMs >= ACNE_LIMIT_MS) {
      this.held = null
      this.phase = 'done'
    }
    return told
  }

  /** Whiteheads still whole, and cleared ones not yet dabbed. */
  left(): number {
    return this.whites().filter(s => s.state === 'whole' || !s.dabbed).length
  }

  progress(): number {
    const w = this.whites()
    return (w.filter(s => s.state !== 'whole').length + w.filter(s => s.dabbed).length) / (w.length * 2)
  }

  stars(): Stars | null {
    return this.phase === 'done' ? acneStars({ left: this.left(), mistakes: this.mistakes }) : null
  }

  private whites(): AcneSpot[] {
    return this.spots.filter(s => s.kind === 'white')
  }

  /** Once no whitehead is whole, it is time to dab. */
  private afterClear(): void {
    if (this.phase === 'pop' && this.whites().every(s => s.state !== 'whole')) this.phase = 'dab'
  }
}
