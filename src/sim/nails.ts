import {
  NAILS_BOTTLE_HIT,
  NAILS_BOTTLE_X,
  NAILS_BOTTLE_Y,
  NAILS_COAT_MS,
  NAILS_COUNT,
  NAILS_DOT_R,
  NAILS_DOT_R_HARD,
  NAILS_EDGE_TOL,
  NAILS_GAP,
  NAILS_GAP_HARD,
  NAILS_GOOD,
  NAILS_LIMIT_MS,
  NAILS_NAIL,
  NAILS_NEXT_MS,
  NAILS_REACH,
  NAILS_REACH_HARD,
  NAILS_SHAKE_MS,
  NAILS_SHAPE,
  NAILS_STARS,
} from '../config'
import type { Stars } from './economy'
import type { Rng } from './rng'

export type NailsPattern = 'dots' | 'stripes' | 'heart' | 'flower'
export type NailsPhase = 'pick' | 'coat' | 'trace' | 'next' | 'done'

export const NAILS_PATTERNS: readonly NailsPattern[] = ['dots', 'stripes']
export const NAILS_PATTERNS_HARD: readonly NailsPattern[] = ['heart', 'flower']

export interface NailsPt {
  x: number
  y: number
}

/** What one touch did: the dots it lit, and whether it was a smudge. */
export interface NailsTouch {
  lit: number
  smudge: boolean
}

/** The bottle whose box holds the tap, else none. */
export const nailsBottleAt = (x: number, y: number): number | null => {
  const i = NAILS_BOTTLE_X.findIndex(bx => Math.abs(x - bx) <= NAILS_BOTTLE_HIT.x && Math.abs(y - NAILS_BOTTLE_Y) <= NAILS_BOTTLE_HIT.y)
  return i < 0 ? null : i
}

/** On the big nail, in card pixels, with the edge's slack: a half-ellipse top over straight sides. */
export const inNail = (x: number, y: number): boolean => {
  const { hw, top, cap, bottom } = NAILS_SHAPE
  const dx = x - NAILS_NAIL.x
  const dy = y - NAILS_NAIL.y
  if (dy < top - NAILS_EDGE_TOL || dy > bottom + NAILS_EDGE_TOL) return false
  if (dy < cap) return (dx / (hw + NAILS_EDGE_TOL)) ** 2 + ((dy - cap) / (cap - top + NAILS_EDGE_TOL)) ** 2 <= 1
  return Math.abs(dx) <= hw + NAILS_EDGE_TOL
}

/** A pattern as a dense line round the nail's centre. */
const patternLine = (pattern: NailsPattern): NailsPt[] => {
  const line: NailsPt[] = []
  if (pattern === 'dots') {
    for (let i = 0; i <= 80; i++) {
      const t = i / 80
      line.push({ x: 64 * Math.sin(t * Math.PI * 2 * 0.95), y: -122 + 248 * t })
    }
  } else if (pattern === 'stripes') {
    const v = [{ x: -70, y: -118 }, { x: 80, y: -72 }, { x: -85, y: -18 }, { x: 85, y: 36 }, { x: -85, y: 90 }, { x: 60, y: 130 }]
    for (let i = 0; i < v.length - 1; i++) {
      for (let j = 0; j < 20; j++) {
        const t = j / 20
        line.push({ x: v[i].x + (v[i + 1].x - v[i].x) * t, y: v[i].y + (v[i + 1].y - v[i].y) * t })
      }
    }
    line.push(v[v.length - 1])
  } else if (pattern === 'heart') {
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI * 2
      line.push({
        x: 6.2 * 16 * Math.sin(t) ** 3,
        y: -6.2 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) - 5,
      })
    }
  } else {
    for (let i = 0; i <= 300; i++) {
      const th = -Math.PI / 2 + (i / 300) * Math.PI * 2
      const r = 98 * (0.68 + 0.32 * Math.cos(5 * (th + Math.PI / 2)))
      line.push({ x: r * Math.cos(th), y: r * Math.sin(th) - 5 })
    }
  }
  return line
}

/** Dots every `gap` along the line. An open line gets its end unless a dot sits near it; a closed one drops a last dot that would sit on the first. */
const dotsAlong = (line: NailsPt[], gap: number, closed: boolean): NailsPt[] => {
  const out = [line[0]]
  let left = gap
  for (let i = 1; i < line.length; i++) {
    let { x, y } = line[i - 1]
    const b = line[i]
    let seg = Math.hypot(b.x - x, b.y - y)
    while (seg >= left) {
      const t = left / seg
      x += (b.x - x) * t
      y += (b.y - y) * t
      out.push({ x, y })
      seg -= left
      left = gap
    }
    left -= seg
  }
  const last = out[out.length - 1]
  const end = line[line.length - 1]
  if (!closed && Math.hypot(last.x - end.x, last.y - end.y) > gap * 0.4) out.push(end)
  if (closed && Math.hypot(last.x - out[0].x, last.y - out[0].y) < gap * 0.6) out.pop()
  return out
}

/** The pattern's dots round the nail's centre, `gap` apart along its line. */
export const nailsDots = (pattern: NailsPattern, gap: number): NailsPt[] =>
  dotsAlong(patternLine(pattern), gap, pattern === 'heart' || pattern === 'flower')

/** Distance from p to the segment a–b. */
const segDist = (p: NailsPt, a: NailsPt, b: NailsPt): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l = dx * dx + dy * dy
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}

export const nailGood = (lit: number, total: number, smudges: number): boolean =>
  lit / total >= NAILS_GOOD.lit && smudges <= NAILS_GOOD.smudges

export const nailsStars = (wrong: number, good: number): Stars =>
  wrong === 0 && good === NAILS_COUNT ? 3 : wrong <= NAILS_STARS.wrong2 && good >= NAILS_STARS.good2 ? 2 : 1

/**
 * Rules of the Sơn móng game: tap the bottle of the sample's colour, then trace the sample's dotted pattern on five
 * nails in turn. A dot lights when the finger's path, counting the stretch between two touches, comes within reach
 * of it. A nail ends when every dot is lit, or on lifting once its last dot is; each slip past the nail's edge is a
 * smudge. The clock runs through the whole game. Positions are game pixels on the card.
 */
export class NailsGame {
  /** The colour on each bottle, left to right. */
  readonly order: readonly number[]
  /** The sample's colour. */
  readonly colour: number
  readonly pattern: NailsPattern
  readonly dots: readonly NailsPt[]
  /** How far from the finger's path a dot lights, and its drawn radius. */
  readonly reach: number
  readonly dotR: number
  phase: NailsPhase = 'pick'
  phaseMs = 0
  elapsedMs = 0
  wrong = 0
  /** The bottles picked wrong, in order. */
  faded: number[] = []
  /** Time left on the customer's head shake. */
  shakeMs = 0
  /** The nail being painted. */
  nail = 0
  lit: boolean[]
  smudges = 0
  /** Where the finger left the nail. */
  blobs: NailsPt[] = []
  /** From a smudge until the finger is back on the nail or lifts. */
  outside = false
  /** Good or not, per finished nail. */
  results: boolean[] = []
  /** Each finished nail's lit dots. */
  litAll: boolean[][] = []
  /** The stroke's last point, while one is under way, and whether it was on the nail. */
  private last: NailsPt | null = null
  private onNail = false

  constructor(rng: Rng, hard = false) {
    const order = [0, 1, 2, 3]
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      const x = order[i]
      order[i] = order[j]
      order[j] = x
    }
    this.order = order
    this.colour = Math.floor(rng() * order.length)
    const patterns = hard ? NAILS_PATTERNS_HARD : NAILS_PATTERNS
    this.pattern = patterns[Math.floor(rng() * patterns.length)]
    this.dots = nailsDots(this.pattern, hard ? NAILS_GAP_HARD : NAILS_GAP)
    this.reach = hard ? NAILS_REACH_HARD : NAILS_REACH
    this.dotR = hard ? NAILS_DOT_R_HARD : NAILS_DOT_R
    this.lit = this.dots.map(() => false)
  }

  /** A tap on a bottle: the sample's colour starts the coat, another fades and counts as wrong, a faded one does nothing. */
  pick(bottle: number): 'right' | 'wrong' | null {
    if (this.phase !== 'pick' || this.faded.includes(bottle)) return null
    if (this.order[bottle] === this.colour) {
      this.go('coat')
      return 'right'
    }
    this.wrong++
    this.faded.push(bottle)
    this.shakeMs = NAILS_SHAKE_MS
    return 'wrong'
  }

  down(x: number, y: number): NailsTouch {
    if (this.phase !== 'trace') return { lit: 0, smudge: false }
    this.last = { x, y }
    this.onNail = inNail(x, y)
    this.outside = false
    return { lit: this.light(this.last, this.last), smudge: false }
  }

  /** Paints from the stroke's last point; with no stroke under way it starts one here and lights nothing. */
  move(x: number, y: number): NailsTouch {
    if (this.phase !== 'trace') return { lit: 0, smudge: false }
    const from = this.last
    const on = inNail(x, y)
    this.last = { x, y }
    if (!from) {
      this.onNail = on
      return { lit: 0, smudge: false }
    }
    const smudge = this.onNail && !on
    if (smudge) {
      this.smudges++
      this.blobs.push({ x, y })
      this.outside = true
    } else if (on) this.outside = false
    this.onNail = on
    return { lit: this.light(from, { x, y }), smudge }
  }

  /** Lifting once the last dot is lit ends the nail. */
  up(): void {
    if (this.phase === 'trace' && this.last && this.lit[this.lit.length - 1]) this.endNail()
    this.last = null
    this.outside = false
  }

  tick(ms: number): void {
    if (this.phase === 'done' || ms <= 0) return
    this.phaseMs += ms
    this.shakeMs = Math.max(0, this.shakeMs - ms)
    this.elapsedMs = Math.min(NAILS_LIMIT_MS, this.elapsedMs + ms)
    if (this.elapsedMs >= NAILS_LIMIT_MS) this.go('done')
    else if (this.phase === 'coat' && this.phaseMs >= NAILS_COAT_MS) this.go('trace')
    else if (this.phase === 'next' && this.phaseMs >= NAILS_NEXT_MS) this.nextNail()
  }

  progress(): number {
    if (this.phase === 'pick' || this.phase === 'coat') return 0
    const part = this.phase === 'trace' ? this.litCount() / this.dots.length : 0
    return (this.results.length + part) / NAILS_COUNT
  }

  stars(): Stars | null {
    return this.phase === 'done' ? nailsStars(this.wrong, this.results.filter(Boolean).length) : null
  }

  private go(phase: NailsPhase): void {
    this.phase = phase
    this.phaseMs = 0
  }

  private litCount(): number {
    return this.lit.filter(Boolean).length
  }

  /** Lights the dots within reach of the segment a–b and returns how many; the nail ends once every dot is lit. */
  private light(a: NailsPt, b: NailsPt): number {
    let n = 0
    this.dots.forEach((d, i) => {
      if (!this.lit[i] && segDist({ x: NAILS_NAIL.x + d.x, y: NAILS_NAIL.y + d.y }, a, b) <= this.reach) {
        this.lit[i] = true
        n++
      }
    })
    if (this.litCount() === this.dots.length) this.endNail()
    return n
  }

  private endNail(): void {
    this.results.push(nailGood(this.litCount(), this.dots.length, this.smudges))
    this.litAll.push([...this.lit])
    this.last = null
    this.outside = false
    this.go('next')
  }

  private nextNail(): void {
    if (this.nail + 1 >= NAILS_COUNT) return this.go('done')
    this.nail++
    this.lit = this.dots.map(() => false)
    this.smudges = 0
    this.blobs = []
    this.go('trace')
  }
}
