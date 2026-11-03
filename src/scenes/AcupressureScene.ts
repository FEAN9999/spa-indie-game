import * as Phaser from 'phaser'
import { massageTextures, MS_ORIGIN } from '../art/massageArt'
import { C, customerColors } from '../art/palette'
import { preloadSvgTextures } from '../art/svg'
import { ACU_LIMIT_MS, GAME_W } from '../config'
import { acuBand, AcupressureGame, type AcuResult } from '../sim/acupressure'
import type { Stars } from '../sim/economy'
import { createRng } from '../sim/rng'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'

/** The back centre on the card and the massage pictures' scale, as in the Đá nóng game. */
const BACK = { x: GAME_W / 2, y: 1030, scale: 0.85 }
/** The points from the back centre: either side of the neck, the shoulder blades, mid-back, and for a picky customer the lower back. */
const POINTS = [
  { x: -95, y: -200 },
  { x: 95, y: -200 },
  { x: -150, y: -90 },
  { x: 150, y: -90 },
  { x: -75, y: 20 },
  { x: 75, y: 20 },
  { x: -140, y: 140 },
  { x: 140, y: 140 },
]
/** How far from a point a press still reaches it. */
const HIT_R = 95
/** A point's dot, its glow while lit, the pressure ring round a held one, and the green band just outside that ring, where the pressure never covers it. */
const DOT = { r: 16, glow: 34, ring: 62, ringW: 14, band: 82, bandW: 12 }
/** Each result's colour on the point once it is done. */
const DONE_COLOR: Record<AcuResult, string> = { good: C.teal, light: C.lotus, hard: C.berry, miss: C.tileSeam }
/** The customer's line over the head as each point ends. */
const SAY = { y: 495, size: 50, stroke: 12, showMs: 1000, fadeMs: 250 }
const LINES: Record<AcuResult, { key: StringKey; color: string }> = {
  good: { key: 'acuGood', color: C.teal },
  light: { key: 'acuLight', color: C.cobalt },
  hard: { key: 'acuHard', color: C.lantern },
  miss: { key: 'acuMiss', color: C.soft },
}
/** A painful press makes the back jerk side to side, dying away. */
const FLINCH = { px: 16, ms: 350, swings: 2 }
const DEMO = { alpha: 0.6, hoverPx: 50, dipMs: 160, holdMs: 500, pauseMs: 400, pressScale: 0.92 }
const DEPTH = { points: 5, say: 10, hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** An angle on the ring for a fill from 0 to 1, starting at the top and going clockwise. */
const ringAngle = (k: number) => -Math.PI / 2 + k * Math.PI * 2

/** Close-up Bấm huyệt mini-game over the frozen spa: the points on the customer's back light one at a time, and each is held until its pressure ring is in the green band. */
export class AcupressureScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: AcupressureGame
  /** The customer's back and head with the points drawn on it, which flinch together; the bed stays still. */
  private back!: Phaser.GameObjects.Container
  private points!: Phaser.GameObjects.Graphics
  private line!: Phaser.GameObjects.Text
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private held = false
  private revealed = false
  /** The faint hand pressing the lit point until the first touch, and how far into its press it is. */
  private demoHand: Phaser.GameObjects.Image | null = null
  private press = { k: 0 }

  constructor() {
    super('AcupressureScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  preload() {
    // the back on the massage bed is the massage close-up's
    preloadSvgTextures(this, massageTextures())
  }

  create() {
    // the acupressure game takes no day-ease time
    this.rules = new AcupressureGame(createRng(Date.now()), this.params.hard)
    this.held = false
    this.revealed = false
    this.demoHand = null
    this.press = { k: 0 }

    const colors = customerColors(this.params.look, this.params.kind)
    this.instruction = addMiniGameCard(this, t('acuTap'))
    const o = MS_ORIGIN
    const part = (key: string, origin: { x: number; y: number }) => this.add.image(0, 0, key).setOrigin(origin.x, origin.y).setScale(BACK.scale)
    part('ms-bed', o.bed).setPosition(BACK.x, BACK.y)
    this.points = this.add.graphics()
    this.back = this.add.container(BACK.x, BACK.y, [
      part('ms-back', o.back).setTint(colors.skin),
      part('ms-back-line', o.back),
      part('ms-hair', o.hair).setTint(colors.hair),
      part('ms-hair-line', o.hair),
      this.points,
    ])
    this.line = this.add
      .text(BACK.x, SAY.y, '', textStyle(SAY.size))
      .setOrigin(0.5)
      .setStroke(C.cream, SAY.stroke)
      .setDepth(DEPTH.say)
      .setAlpha(0)
    this.bars = this.add.graphics()
    if (this.params.demo) this.showDemo()

    oneFinger(this.input, {
      down: p => this.onDown(p),
      up: () => this.onUp(),
    })
  }

  update(time: number, delta: number) {
    if (this.revealed) return
    const ended = this.rules.tick(delta)
    if (ended) this.ended(ended)
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.drawPoints(time)
    this.moveDemo()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** Points not reached yet are faint dots; done ones take their result's colour; the lit one glows; the held one wears its pressure ring with the green band on it. */
  private drawPoints(time: number): void {
    const g = this.points.clear()
    const n = this.rules.order.length
    const doneAt = new Map(this.rules.results.map((r, i) => [this.rules.order[i], r]))
    const current = this.rules.current()
    for (let i = 0; i < n; i++) {
      const p = POINTS[i]
      const result = doneAt.get(i)
      if (i === current) continue
      // huyệt đang chờ có quầng vàng nhạt như bản A+
      if (!result) g.fillStyle(hex(C.glow), 0.55).fillCircle(p.x, p.y, DOT.r + 10)
      g.fillStyle(hex(result ? DONE_COLOR[result] : C.cream), result ? 1 : 0.7).fillCircle(p.x, p.y, DOT.r)
      g.lineStyle(4, hex(C.ink), result ? 1 : 0.5).strokeCircle(p.x, p.y, DOT.r)
    }
    if (current === null) return
    const p = POINTS[current]
    if (this.rules.phase === 'lit') {
      const pulse = 0.5 + 0.5 * Math.abs(Math.sin(time / 260))
      g.fillStyle(hex(C.mustard), 0.35 + 0.4 * pulse).fillCircle(p.x, p.y, DOT.glow)
    } else {
      const band = acuBand(this.params.hard)
      g.lineStyle(DOT.ringW, hex(C.tileSeam), 1).strokeCircle(p.x, p.y, DOT.ring)
      g.lineStyle(DOT.bandW, hex(C.teal), 1).beginPath().arc(p.x, p.y, DOT.band, ringAngle(band.min), ringAngle(band.max)).strokePath()
      if (this.rules.pressure > 0) g.lineStyle(DOT.ringW, hex(C.lantern), 1).beginPath().arc(p.x, p.y, DOT.ring, ringAngle(0), ringAngle(this.rules.pressure)).strokePath()
    }
    g.fillStyle(hex(C.lantern), 1).fillCircle(p.x, p.y, DOT.r).lineStyle(4, hex(C.ink)).strokeCircle(p.x, p.y, DOT.r)
    // điểm sáng trắng trên huyệt đỏ
    g.fillStyle(0xffffff, 0.45).fillCircle(p.x - DOT.r * 0.35, p.y - DOT.r * 0.35, DOT.r * 0.3)
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    this.hideDemo()
    const current = this.rules.current()
    if (current === null) return
    const at = POINTS[current]
    if (Math.hypot(p.x - (this.back.x + at.x), p.y - (BACK.y + at.y)) > HIT_R) return
    this.held = this.rules.press(current)
  }

  private onUp(): void {
    if (!this.held) return
    this.held = false
    const result = this.rules.release()
    if (result) this.ended(result)
  }

  /** A point ended, let go, held full or missed: the customer says how it felt, and a painful one makes the back flinch. */
  private ended(result: AcuResult): void {
    this.held = false
    this.tweens.killTweensOf(this.line)
    this.line.setText(t(LINES[result].key)).setColor(LINES[result].color).setAlpha(1)
    this.tweens.add({ targets: this.line, alpha: 0, delay: SAY.showMs, duration: SAY.fadeMs })
    if (result !== 'hard') return
    this.tweens.killTweensOf(this.back)
    // the ease swings out and back and ends where it began
    this.tweens.add({
      targets: this.back,
      x: BACK.x + FLINCH.px,
      duration: FLINCH.ms,
      ease: (k: number) => Math.sin(k * Math.PI * 2 * FLINCH.swings) * (1 - k),
      onComplete: () => this.back.setX(BACK.x),
    })
  }

  /** The hand presses down on the lit point over and over, holding a while each time; between points it waits, hidden. */
  private showDemo(): void {
    // the fingertip is at the bottom centre of the texture
    this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand).setVisible(false)
    this.tweens.add({ targets: this.press, k: 1, duration: DEMO.dipMs, yoyo: true, hold: DEMO.holdMs, repeat: -1, repeatDelay: DEMO.pauseMs, ease: 'Quad.easeIn' })
  }

  private moveDemo(): void {
    if (!this.demoHand) return
    const current = this.rules.phase === 'lit' ? this.rules.current() : null
    this.demoHand.setVisible(current !== null)
    if (current === null) return
    const p = POINTS[current]
    this.demoHand.setPosition(this.back.x + p.x, BACK.y + p.y - DEMO.hoverPx * (1 - this.press.k)).setScale(Phaser.Math.Linear(1, DEMO.pressScale, this.press.k))
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.tweens.killTweensOf(this.press)
    this.demoHand.destroy()
    this.demoHand = null
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.held = false
    this.hideDemo()
    this.drawPoints(0)
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / ACU_LIMIT_MS)
  }
}
