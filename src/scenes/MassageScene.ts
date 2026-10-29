import * as Phaser from 'phaser'
import { MS_BACK_PX, MS_ORIGIN, MS_POINT_R, MS_RING_R } from '../art/massageArt'
import { C, customerColors } from '../art/palette'
import { MASSAGE_HOLD_MS, MASSAGE_POINTS, MASSAGE_SCORE } from '../config'
import type { Stars } from '../sim/economy'
import { MassageGame, type Judgement, type MassagePoint } from '../sim/massage'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { textStyle } from '../view/text'

/** The back centre on the card; the rules' back square spans MS_BACK_PX either side of it. */
const BACK = { x: 540, y: 1090 }
const S = MS_BACK_PX
const MAX_SCORE = MASSAGE_POINTS.length * MASSAGE_SCORE.perfect
/** The ring a hold point fills, round its glow. */
const HOLD_RING = { r: 78, w: 14, ink: 8 }
const SHOW_MS = 140
const POP_MS = 250
const WORD = { size: 60, stroke: 12, startPx: 30, risePx: 80, ms: 600 }
const WORDS: Record<Judgement, { key: StringKey; color: string }> = {
  perfect: { key: 'massagePerfect', color: C.teal },
  good: { key: 'massageGood', color: C.mustardDark },
  miss: { key: 'massageMiss', color: C.lantern },
}
const DEMO = { alpha: 0.6, hoverPx: 50, dipMs: 160, tapHoldMs: 120, holdDelayMs: 350, pressScale: 0.92 }
const DEPTH = { point: 5, ring: 6, word: 10, hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const toCanvas = (p: { x: number; y: number }) => ({ x: BACK.x + p.x * S, y: BACK.y + p.y * S })

/** Close-up massage mini-game over the frozen spa: tap each glowing point as its ring closes, and hold the turmeric pressure points until their rings fill. */
export class MassageScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: MassageGame
  /** The point on screen, and how many judgements have been shown. */
  private shown = -1
  private seen = 0
  private point!: Phaser.GameObjects.Image
  private ring!: Phaser.GameObjects.Image
  private holdRing!: Phaser.GameObjects.Graphics
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** The faint hand showing the move for the point on screen. It taps every tap point until the first touch, and holds the first hold point. */
  private demoHand: Phaser.GameObjects.Image | null = null
  private demoTaps = false
  private demoHold = false

  constructor() {
    super('MassageScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the massage takes no day-ease time
    this.rules = new MassageGame(this.params.hard)
    this.shown = -1
    this.seen = 0
    this.revealed = false
    this.demoHand = null
    this.demoTaps = this.params.demo
    this.demoHold = this.params.demo

    const colors = customerColors(this.params.look, this.params.kind, null, null, false, this.params.idol ?? null)
    this.instruction = addMiniGameCard(this, t('massageTap'))
    const o = MS_ORIGIN
    this.add.image(BACK.x, BACK.y, 'ms-bed').setOrigin(o.bed.x, o.bed.y)
    this.add.image(BACK.x, BACK.y, 'ms-back').setOrigin(o.back.x, o.back.y).setTint(colors.skin)
    this.add.image(BACK.x, BACK.y, 'ms-back-line').setOrigin(o.back.x, o.back.y)
    this.add.image(BACK.x, BACK.y, 'ms-hair').setOrigin(o.hair.x, o.hair.y).setTint(colors.hair)
    this.add.image(BACK.x, BACK.y, 'ms-hair-line').setOrigin(o.hair.x, o.hair.y)
    this.holdRing = this.add.graphics().setDepth(DEPTH.ring)
    this.point = this.add.image(0, 0, 'ms-point').setVisible(false).setDepth(DEPTH.point)
    this.ring = this.add.image(0, 0, 'ms-ring').setVisible(false).setDepth(DEPTH.ring)
    this.bars = this.add.graphics()

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p))
    for (const ev of ['pointerup', 'pointerupoutside', 'gameout']) this.input.on(ev, () => this.rules.release())
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.rules.tick(delta)
    this.showJudgement()
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.drawPoint(this.rules.current())
    drawBars(this.bars, this.rules.score() / MAX_SCORE, this.pointsLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    this.hideDemo()
    this.demoTaps = false
    this.rules.press((p.x - BACK.x) / S, (p.y - BACK.y) / S)
    this.showJudgement()
  }

  /** The point showing: a tap point's ring shrinks onto its glow, a hold point's ring fills round it. */
  private drawPoint(p: MassagePoint | null): void {
    this.holdRing.clear()
    if (!p) {
      this.point.setVisible(false)
      this.ring.setVisible(false)
      this.hideDemo()
      return
    }
    const { x, y } = toCanvas(p)
    if (p.index !== this.shown) this.showPoint(p, x, y)
    if (p.kind === 'tap') this.ring.setScale(Phaser.Math.Linear(MS_POINT_R / MS_RING_R, 1, p.ring))
    else this.drawHoldRing(x, y, p.ring)
  }

  private showPoint(p: MassagePoint, x: number, y: number): void {
    this.shown = p.index
    this.tweens.killTweensOf(this.point)
    this.point.setTexture(p.kind === 'tap' ? 'ms-point' : 'ms-hold').setPosition(x, y).setVisible(true).setScale(0.5)
    this.tweens.add({ targets: this.point, scale: 1, duration: SHOW_MS, ease: 'Back.easeOut' })
    this.ring.setPosition(x, y).setVisible(p.kind === 'tap')
    setInstruction(this.instruction, t(p.kind === 'tap' ? 'massageTap' : 'massageHold'))
    this.showDemo(p, x, y)
  }

  private drawHoldRing(x: number, y: number, fill: number): void {
    const g = this.holdRing
    g.lineStyle(HOLD_RING.w + HOLD_RING.ink, hex(C.ink)).strokeCircle(x, y, HOLD_RING.r)
    g.lineStyle(HOLD_RING.w, hex(C.tileSeam)).strokeCircle(x, y, HOLD_RING.r)
    if (fill <= 0) return
    const top = -Math.PI / 2
    g.lineStyle(HOLD_RING.w, hex(C.mustard)).beginPath().arc(x, y, HOLD_RING.r, top, top + fill * Math.PI * 2).strokePath()
  }

  /** A new judgement floats its word up from its point; a hit flashes the point out. */
  private showJudgement(): void {
    const n = this.rules.results.length
    if (n === this.seen) return
    this.seen = n
    const j = this.rules.lastJudgement()!
    const { x, y } = toCanvas(MASSAGE_POINTS[n - 1])
    if (j !== 'miss') {
      const pop = this.add.image(x, y, this.point.texture.key).setDepth(DEPTH.point)
      this.tweens.add({ targets: pop, scale: 1.6, alpha: 0, duration: POP_MS, onComplete: () => pop.destroy() })
    }
    const word = this.add
      .text(x, y - WORD.startPx, t(WORDS[j].key), textStyle(WORD.size, '800', WORDS[j].color))
      .setOrigin(0.5)
      .setStroke(C.cream, WORD.stroke)
      .setDepth(DEPTH.word)
    this.tweens.add({
      targets: word,
      y: { value: word.y - WORD.risePx, ease: 'Quad.easeOut' },
      alpha: { value: 0, ease: 'Cubic.easeIn' },
      duration: WORD.ms,
      onComplete: () => word.destroy(),
    })
  }

  /** Over a tap point the hand hovers and taps as the ring closes; over the first hold point it presses and holds. */
  private showDemo(p: MassagePoint, x: number, y: number): void {
    this.hideDemo()
    if (p.kind === 'tap' ? !this.demoTaps : !this.demoHold) return
    if (p.kind === 'hold') this.demoHold = false
    // the fingertip is at the bottom centre of the texture
    const hand = this.add.image(x, y - DEMO.hoverPx, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand)
    const press = { targets: hand, y, scale: DEMO.pressScale, duration: DEMO.dipMs, yoyo: true, ease: 'Quad.easeIn' }
    if (p.kind === 'tap') this.tweens.add({ ...press, delay: this.rules.ringMs - DEMO.dipMs, hold: DEMO.tapHoldMs })
    else this.tweens.add({ ...press, delay: DEMO.holdDelayMs, hold: MASSAGE_HOLD_MS, repeat: -1, repeatDelay: DEMO.holdDelayMs })
    this.demoHand = hand
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.tweens.killTweensOf(this.demoHand)
    this.demoHand.destroy()
    this.demoHand = null
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.hideDemo()
    this.point.setVisible(false)
    this.ring.setVisible(false)
    this.holdRing.clear()
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.rules.score() / MAX_SCORE, this.pointsLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  /** The time bar: the share of the ten points still to come. */
  private pointsLeft(): number {
    return 1 - this.rules.results.length / MASSAGE_POINTS.length
  }
}
