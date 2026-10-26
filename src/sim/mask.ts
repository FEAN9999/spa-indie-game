import {
  MASK_BRUSH_R,
  MASK_ERRORS_FOR_PENALTY,
  MASK_EYE_R,
  MASK_EYE_R_HARD,
  MASK_EYES,
  MASK_GOAL,
  MASK_GOAL_HARD,
  MASK_GRID,
  MASK_SNAP_R,
  MASK_TIME_LIMIT_MS,
  STAR2_MS,
  STAR3_MS,
} from '../config'
import type { Stars } from './economy'

export type MaskPhase = 'paint' | 'cucumber' | 'done'

/**
 * Rules of the face-mask mini-game, in face units where the face is the unit circle: paint the face
 * around the eyes, then lay a cucumber slice on each eye. A picky customer has bigger eyes and needs more cover.
 */
export class MaskGame {
  phase: MaskPhase = 'paint'
  elapsedMs = 0
  /** Each time a stroke entered an eye. */
  errors = 0
  readonly limitMs = MASK_TIME_LIMIT_MS
  private readonly eyeR: number
  private readonly goal: number
  /** Centres of the grid cells on the face outside the eyes: the ones the mask has to cover. */
  private readonly cells: { x: number; y: number }[] = []
  private readonly painted: boolean[]
  private paintedCount = 0
  /** The finger is in an eye now, in the current stroke. */
  private inEye = false
  private readonly slices = [false, false]
  private finalStars: Stars | null = null

  constructor(hard = false) {
    this.eyeR = hard ? MASK_EYE_R_HARD : MASK_EYE_R
    this.goal = hard ? MASK_GOAL_HARD : MASK_GOAL
    const size = 2 / MASK_GRID
    for (let j = 0; j < MASK_GRID; j++)
      for (let i = 0; i < MASK_GRID; i++) {
        const x = -1 + (i + 0.5) * size
        const y = -1 + (j + 0.5) * size
        if (x * x + y * y < 1 && !this.inAnEye(x, y)) this.cells.push({ x, y })
      }
    this.painted = this.cells.map(() => false)
  }

  eyes(): { x: number; y: number; r: number }[] {
    return MASK_EYES.map(e => ({ x: e.x, y: e.y, r: this.eyeR }))
  }

  /** The finger is down at (x, y): the brush covers the face cells near it, and entering an eye is an error. */
  paint(x: number, y: number): void {
    if (this.phase !== 'paint') return
    const inEye = this.inAnEye(x, y)
    if (inEye && !this.inEye) this.errors++
    this.inEye = inEye
    this.cells.forEach((c, i) => {
      if (this.painted[i] || Math.hypot(c.x - x, c.y - y) > MASK_BRUSH_R) return
      this.painted[i] = true
      this.paintedCount++
    })
    if (this.coverage() >= this.goal) this.phase = 'cucumber'
  }

  /** The finger lifts: the stroke ends. */
  lift(): void {
    this.inEye = false
  }

  /** A slice dropped at (x, y) snaps onto the empty eye within reach and returns it, else null and it goes back to the tray. */
  placeCucumber(x: number, y: number): 0 | 1 | null {
    if (this.phase !== 'cucumber') return null
    const eye = ([0, 1] as const).find(i => !this.slices[i] && Math.hypot(x - MASK_EYES[i].x, y - MASK_EYES[i].y) <= MASK_SNAP_R)
    if (eye === undefined) return null
    this.slices[eye] = true
    if (this.slices.every(Boolean)) this.finish(this.timeStars())
    return eye
  }

  tick(ms: number): void {
    if (this.phase === 'done') return
    this.elapsedMs += ms
    if (this.elapsedMs >= this.limitMs) this.finish(1)
  }

  /** The share of the face outside the eyes that is covered. */
  coverage(): number {
    return this.paintedCount / this.cells.length
  }

  /** Towards the paint goal while painting, then the slices laid. */
  progress(): number {
    if (this.phase === 'paint') return Math.min(1, this.coverage() / this.goal)
    if (this.phase === 'cucumber') return this.slices.filter(Boolean).length / 2
    return 1
  }

  stars(): Stars | null {
    return this.finalStars
  }

  private inAnEye(x: number, y: number): boolean {
    return MASK_EYES.some(e => Math.hypot(x - e.x, y - e.y) <= this.eyeR)
  }

  private timeStars(): Stars {
    const stars = this.elapsedMs <= STAR3_MS ? 3 : this.elapsedMs <= STAR2_MS ? 2 : 1
    return this.errors >= MASK_ERRORS_FOR_PENALTY ? (Math.max(1, stars - 1) as Stars) : stars
  }

  private finish(stars: Stars): void {
    this.phase = 'done'
    this.finalStars = stars
  }
}
