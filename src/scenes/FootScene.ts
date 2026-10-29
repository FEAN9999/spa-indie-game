import * as Phaser from 'phaser'
import { FOOT_BOX } from '../art/footArt'
import { C, customerColors } from '../art/palette'
import { sound } from '../audio/engine'
import { FOOT_LIMIT_MS, FOOT_POINTS, FOOT_WRONG_MS } from '../config'
import type { Stars } from '../sim/economy'
import { FootGame, footPointAt, type FootPhase } from '../sim/foot'
import { createRng } from '../sim/rng'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'

/** The instruction for each phase; the show and the pause before it ask for the same thing. */
const WORDS: Partial<Record<FootPhase, StringKey>> = { lead: 'footWatch', show: 'footWatch', input: 'footTap', wrong: 'footWrong', wrong2: 'footSkip', next: 'footRight' }
/** A point at rest, lit, wrong, and just tapped right: radii in px. */
const IDLE = { glow: 64, glowAlpha: 0.55, disc: 36, heart: 15 }
const LIT = { glow: 84, ring: 72, ringW: 10, disc: 44, heart: 18 }
const WRONG = { pink: 66, pinkAlpha: 0.85, disc: 40, shakePx: 12, shakePerMs: 0.06, cross: 13, crossW: 6 }
const FLASH = { ms: 300, from: 66, grow: 20, disc: 40, heart: 16 }
const INK = { disc: 4, heart: 2.5 }
/** The three round dots under the progress bar. */
const DOTS = { x: 480, step: 60, y: 492, r: 17, ink: 4, nowInk: 6, icon: 7, iconW: 4 }
const DEMO = { alpha: 0.6, tapMs: 800, hoverPx: 50, pressScale: 0.92 }
const DEPTH = { hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** Close-up Ngâm chân mini-game over the frozen spa: watch the points on the customer's sole light up, then tap them back in order. */
export class FootScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: FootGame
  private g!: Phaser.GameObjects.Graphics
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** Game time in ms, for the shake and the flash. */
  private now = 0
  private shownPhase: FootPhase = 'lead'
  /** The step of the show whose "tinh" has sounded. */
  private sounded = -1
  private flashPoint = -1
  private flashAt = -Infinity
  private demoHand: Phaser.GameObjects.Image | null = null
  private demoMs = 0

  constructor() {
    super('FootScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the foot takes no day-ease time
    this.rules = new FootGame(createRng(Date.now()), this.params.hard)
    this.revealed = false
    this.now = 0
    this.shownPhase = 'lead'
    this.sounded = -1
    this.flashPoint = -1
    this.flashAt = -Infinity
    this.demoHand = null
    this.demoMs = 0

    const colors = customerColors(this.params.look, this.params.kind)
    this.instruction = addMiniGameCard(this, t('footWatch'))
    // each texture is drawn in the card's pixels, so it sits at its box's corner
    const at = (key: string, [x, y]: readonly number[]) => this.add.image(x, y, key).setOrigin(0)
    at('foot-basin-back', FOOT_BOX.back)
    at('foot-sole', FOOT_BOX.sole).setTint(colors.skin)
    at('foot-sole-line', FOOT_BOX.sole)
    at('foot-basin-front', FOOT_BOX.front)
    this.g = this.add.graphics()
    this.bars = this.add.graphics()
    // the fingertip is at the bottom centre of the texture
    if (this.params.demo) this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand).setVisible(false)

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.revealed) return
      this.hideDemo()
      const point = footPointAt(p.x, p.y)
      if (point === null) return
      if (this.rules.tap(point) === 'right') {
        this.flashPoint = point
        this.flashAt = this.now
        sound.play('star', this.rules.idx - 1)
      }
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.now += delta
    this.rules.tick(delta)
    const { phase } = this.rules
    if (phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    if (phase !== this.shownPhase) {
      this.shownPhase = phase
      const words = WORDS[phase]
      if (words) setInstruction(this.instruction, t(words))
    }
    // the "tinh" rises with each point lit
    const lit = this.rules.lit()
    if (phase !== 'show') this.sounded = -1
    else if (lit && lit.step !== this.sounded) {
      this.sounded = lit.step
      sound.play('star', lit.step)
    }
    this.drawPoints(lit?.point ?? -1)
    this.drawDots()
    this.moveDemo(delta)
    drawBars(this.bars, this.rules.progress(), 1 - this.rules.elapsedMs / FOOT_LIMIT_MS)
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** Each point as lit, shaking red after a wrong tap, flashing after a right one, or at rest. */
  private drawPoints(litPoint: number): void {
    const g = this.g.clear()
    const { phase, wrongPoint, phaseMs } = this.rules
    const wrongNow = phase === 'wrong' || phase === 'wrong2'
    const disc = (x: number, y: number, r: number, fill: string, ink: number, alpha = 1) => {
      g.fillStyle(hex(fill), alpha).fillCircle(x, y, r)
      if (ink > 0) g.lineStyle(ink, hex(C.ink)).strokeCircle(x, y, r)
    }
    FOOT_POINTS.forEach((p, k) => {
      if (k === litPoint) {
        disc(p.x, p.y, LIT.glow, C.glow, 0)
        g.lineStyle(LIT.ringW, hex(C.mustard)).strokeCircle(p.x, p.y, LIT.ring)
        disc(p.x, p.y, LIT.disc, C.mustard, INK.disc)
        disc(p.x, p.y, LIT.heart, C.cream, INK.heart)
      } else if (wrongNow && k === wrongPoint) {
        const x = p.x + Math.sin(this.now * WRONG.shakePerMs) * WRONG.shakePx * (1 - phaseMs / FOOT_WRONG_MS)
        disc(x, p.y, WRONG.pink, C.wrongPink, 0, WRONG.pinkAlpha)
        disc(x, p.y, WRONG.disc, C.lantern, INK.disc)
        this.icon('cross', x, p.y, WRONG.cross, C.cream, WRONG.crossW)
      } else if (k === this.flashPoint && this.now - this.flashAt < FLASH.ms) {
        const left = 1 - (this.now - this.flashAt) / FLASH.ms
        disc(p.x, p.y, FLASH.from + FLASH.grow * (1 - left), C.mint, 0, left)
        disc(p.x, p.y, FLASH.disc, C.tealLight, INK.disc)
        disc(p.x, p.y, FLASH.heart, C.cream, INK.heart)
      } else {
        disc(p.x, p.y, IDLE.glow, C.glow, 0, IDLE.glowAlpha)
        disc(p.x, p.y, IDLE.disc, C.cream, INK.disc)
        disc(p.x, p.y, IDLE.heart, C.tealLight, INK.heart)
      }
    })
  }

  /** The three rounds: done, skipped, under way, to come. */
  private drawDots(): void {
    const { results, round } = this.rules
    for (let i = 0; i < 3; i++) {
      const x = DOTS.x + i * DOTS.step
      const r = results[i]
      const now = i === round && !r
      this.g.fillStyle(hex(r === 'ok' ? C.teal : r === 'skip' ? C.lantern : C.cream), 1).fillCircle(x, DOTS.y, DOTS.r)
      this.g.lineStyle(now ? DOTS.nowInk : DOTS.ink, hex(now ? C.mustardDark : C.ink)).strokeCircle(x, DOTS.y, DOTS.r)
      if (r) this.icon(r === 'ok' ? 'check' : 'cross', x, DOTS.y, DOTS.icon, C.cream, DOTS.iconW)
    }
  }

  /** A check or cross of half-size `u` centred at (x, y). */
  private icon(kind: 'check' | 'cross', x: number, y: number, u: number, colour: string, w: number): void {
    const g = this.g.lineStyle(w, hex(colour)).beginPath()
    if (kind === 'check') g.moveTo(x - u, y).lineTo(x - u * 0.3, y + u * 0.7).lineTo(x + u, y - u * 0.7)
    else g.moveTo(x - u, y - u).lineTo(x + u, y + u).moveTo(x + u, y - u).lineTo(x - u, y + u)
    g.strokePath()
  }

  /** In round 0's turn the hand taps its points in order, one every 800 ms: it drops onto the point, then presses. */
  private moveDemo(delta: number): void {
    if (!this.demoHand) return
    const { phase, round, seq } = this.rules
    const on = phase === 'input' && round === 0
    this.demoHand.setVisible(on)
    if (!on) {
      this.demoMs = 0
      return
    }
    this.demoMs += delta
    const k = Math.floor(this.demoMs / DEMO.tapMs) % this.rules.length()
    const f = (this.demoMs % DEMO.tapMs) / DEMO.tapMs
    const p = FOOT_POINTS[seq[k]]
    this.demoHand.setPosition(p.x, p.y - (f < 0.5 ? DEMO.hoverPx * (1 - f * 2) : 0)).setScale(f > 0.5 && f < 0.75 ? DEMO.pressScale : 1)
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.demoHand.destroy()
    this.demoHand = null
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.hideDemo()
    this.g.clear()
    drawBars(this.bars, this.rules.progress(), 1 - this.rules.elapsedMs / FOOT_LIMIT_MS)
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }
}
