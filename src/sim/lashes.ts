import { LASHES_LID, LASHES_LIMIT_MS, LASHES_REACH, LASHES_REACH_HARD, LASHES_SLOTS, LASHES_SLOTS_HARD, LASHES_STARS } from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type LashLen = 's' | 'm' | 'l'
export type LashStyle = 'natural' | 'cat' | 'doll'
export type LashDrop = 'right' | 'wrong' | 'stuck'

export const LASH_LENS: readonly LashLen[] = ['s', 'm', 'l']
export const LASH_STYLES: readonly LashStyle[] = ['natural', 'cat', 'doll']

/**
 * The length each dot of a style asks for, from the inner corner to the outer one: natural is middle with short ends,
 * cat grows from short to long in thirds, doll is long in the middle third, middle around it and short at the ends.
 */
export function lashPattern(style: LashStyle, n: number): LashLen[] {
  const last = n - 1
  return Array.from({ length: n }, (_, i): LashLen => {
    if (style === 'natural') return i === 0 || i === last ? 's' : 'm'
    // whole numbers only, so the thirds never fall on a rounding edge
    if (style === 'cat') return 3 * i < last ? 's' : 3 * i < 2 * last ? 'm' : 'l'
    const fromMiddle = Math.abs(6 * i - 3 * last)
    return fromMiddle > 2 * last ? 's' : fromMiddle > last ? 'm' : 'l'
  })
}

/** Where each of `n` dots sits along the lid, inner corner first: evenly across, the line sagging in the middle like a closed eye. */
export function lashSlots(n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    return { x: LASHES_LID.x - LASHES_LID.span / 2 + LASHES_LID.span * t, y: LASHES_LID.y + LASHES_LID.sag * Math.sin(Math.PI * t) }
  })
}

export const lashesStars = (right: number, n: number, stuck: number): Stars =>
  right === n && stuck <= LASHES_STARS.stuck3 ? 3 : right >= n - LASHES_STARS.miss2 && stuck <= LASHES_STARS.stuck2 ? 2 : 1

/**
 * Rules of the Nối mi game: the sample card names a style, and each dot along the lid wants the style's length there.
 * A lash dropped within reach of a free dot sticks to the nearest one, right or wrong; dropped on a dot that has a lash
 * already it glues the two together and is lost ("stuck"); dropped anywhere else nothing happens. The game ends when
 * every dot has a lash, or at the time limit. A picky customer has more dots, a shorter reach and never the natural style.
 */
export class LashesGame {
  phase: 'play' | 'done' = 'play'
  elapsedMs = 0
  readonly style: LashStyle
  readonly pattern: readonly LashLen[]
  readonly slots: readonly { x: number; y: number }[]
  /** The lash on each dot, null while it is bare. */
  readonly lashes: (LashLen | null)[]
  stuck = 0
  private readonly reach: number

  constructor(rng: Rng, hard = false) {
    const styles = hard ? LASH_STYLES.filter(s => s !== 'natural') : LASH_STYLES
    this.style = styles[Math.floor(rng() * styles.length)]
    const n = hard ? LASHES_SLOTS_HARD : LASHES_SLOTS
    this.pattern = lashPattern(this.style, n)
    this.slots = lashSlots(n)
    this.lashes = Array.from({ length: n }, () => null)
    this.reach = hard ? LASHES_REACH_HARD : LASHES_REACH
  }

  /** The dot nearest (x, y) within reach, else null. */
  slotAt(x: number, y: number): number | null {
    let best: number | null = null
    let bestD = this.reach
    this.slots.forEach((s, i) => {
      const d = Math.hypot(x - s.x, y - s.y)
      if (d <= bestD) {
        best = i
        bestD = d
      }
    })
    return best
  }

  /** Drops a lash of `len` with its root at (x, y); null when it lands on no dot or the game is done. */
  drop(len: LashLen, x: number, y: number): LashDrop | null {
    if (this.phase !== 'play') return null
    const slot = this.slotAt(x, y)
    if (slot === null) return null
    if (this.lashes[slot] !== null) {
      this.stuck++
      return 'stuck'
    }
    this.lashes[slot] = len
    if (this.lashes.every(l => l !== null)) this.phase = 'done'
    return len === this.pattern[slot] ? 'right' : 'wrong'
  }

  tick(ms: number): void {
    if (this.phase !== 'play' || ms <= 0) return
    this.elapsedMs = Math.min(LASHES_LIMIT_MS, this.elapsedMs + ms)
    if (this.elapsedMs >= LASHES_LIMIT_MS) this.phase = 'done'
  }

  /** Dots whose lash is the length the style asks for. */
  right(): number {
    return this.lashes.filter((l, i) => l === this.pattern[i]).length
  }

  /** The first bare dot, inner corner first, or null. */
  nextBare(): number | null {
    const i = this.lashes.indexOf(null)
    return i < 0 ? null : i
  }

  progress(): number {
    return this.lashes.filter(l => l !== null).length / this.lashes.length
  }

  stars(): Stars | null {
    return this.phase === 'done' ? lashesStars(this.right(), this.lashes.length, this.stuck) : null
  }
}
