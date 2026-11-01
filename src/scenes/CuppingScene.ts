import * as Phaser from 'phaser'
import { CP_TRAY_CUPS } from '../art/cuppingArt'
import { MS_ORIGIN } from '../art/massageArt'
import { C, customerColors } from '../art/palette'
import { CUPPING_CUPS, CUPPING_GOOD, CUPPING_LIMIT_MS, CUPPING_MARKS, GAME_W } from '../config'
import { CuppingGame, cupGradeOf, type CupGrade } from '../sim/cupping'
import type { Stars } from '../sim/economy'
import { createRng } from '../sim/rng'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { textStyle } from '../view/text'

/** The back centre on the card and the massage pictures' scale, as in the Đá nóng game. */
const BACK = { x: GAME_W / 2, y: 1030, scale: 0.85 }
/** The marks on the bare back, from the back centre: a pair across, shoulders down to the waist. */
const MARKS = [-160, 0, 160].flatMap(y => [-125, 125].map(x => ({ x, y })))
/** The tray at the card's foot, just over the time bar; its cups sit at CP_TRAY_CUPS from here. */
const TRAY = { x: GAME_W / 2, y: 1428 }
/** How far from a mark's centre a tap still reaches it. */
const HIT_R = 90
/** The red under a good cup glows mustard: the skin drawn larger behind it. */
const GLOW_SCALE = 1.3
/** A lifted cup leaves a round mark on the skin a little smaller than the cup. */
const RING_SCALE = 0.9
const FLY_MS = 320
/** The customer's line over the head as each cup comes off. */
const SAY = { y: 495, size: 50, stroke: 12, showMs: 1000, fadeMs: 250 }
const LINES: Record<CupGrade, { key: StringKey; color: string }> = {
  good: { key: 'cuppingGood', color: C.teal },
  light: { key: 'cuppingLight', color: C.cobalt },
  dark: { key: 'cuppingDark', color: C.lantern },
}
/** A dark cup makes the back jerk side to side, dying away. */
const FLINCH = { px: 16, ms: 350, swings: 2 }
const DEMO = { alpha: 0.6, hoverPx: 50, dipMs: 160, holdMs: 120, pauseMs: 500, pressScale: 0.92 }
const DEPTH = { flying: 6, say: 10, hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** Blends two 0xRRGGBB colours, `k` from 0 to 1. */
const mix = (a: number, b: number, k: number) =>
  [16, 8, 0].reduce((out, shift) => out | (Math.round(Phaser.Math.Linear((a >> shift) & 255, (b >> shift) & 255, Phaser.Math.Clamp(k, 0, 1))) << shift), 0)

interface OnBack {
  box: Phaser.GameObjects.Container
  glow: Phaser.GameObjects.Image
  skin: Phaser.GameObjects.Image
}

/** Close-up Giác hơi mini-game over the frozen spa: cups from the tray are set on the lit marks of the customer's back and lifted as the skin under them turns red. */
export class CuppingScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: CuppingGame
  /** The customer's back and head with the marks, the cups and the marks they leave, which flinch together; the bed stays still. */
  private back!: Phaser.GameObjects.Container
  private marks: Phaser.GameObjects.Image[] = []
  private cups = new Map<number, OnBack>()
  private trayCups: Phaser.GameObjects.Image[] = []
  private skinColor = 0
  private line!: Phaser.GameObjects.Text
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** The faint hand tapping its target until the first touch, and how far into its tap it is. */
  private demoHand: Phaser.GameObjects.Image | null = null
  private press = { k: 0 }

  constructor() {
    super('CuppingScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the cupping game takes no day-ease time
    this.rules = new CuppingGame(createRng(Date.now()), this.params.hard)
    this.revealed = false
    this.demoHand = null
    this.press = { k: 0 }
    this.cups = new Map()

    const colors = customerColors(this.params.look, this.params.kind)
    this.skinColor = colors.skin
    this.instruction = addMiniGameCard(this, t('cuppingTap'))
    const o = MS_ORIGIN
    const part = (key: string, origin: { x: number; y: number }) => this.add.image(0, 0, key).setOrigin(origin.x, origin.y).setScale(BACK.scale)
    part('ms-bed', o.bed).setPosition(BACK.x, BACK.y)
    this.marks = MARKS.map(m => this.add.image(m.x, m.y, 'cp-mark'))
    this.back = this.add.container(BACK.x, BACK.y, [
      part('ms-back', o.back).setTint(colors.skin),
      part('ms-back-line', o.back),
      part('ms-hair', o.hair).setTint(colors.hair),
      part('ms-hair-line', o.hair),
      ...this.marks,
    ])
    this.add.image(TRAY.x, TRAY.y, 'cp-tray')
    this.trayCups = CP_TRAY_CUPS.map(p => this.add.image(TRAY.x + p.x, TRAY.y + p.y, 'cp-cup'))
    this.line = this.add
      .text(BACK.x, SAY.y, '', textStyle(SAY.size))
      .setOrigin(0.5)
      .setStroke(C.cream, SAY.stroke)
      .setDepth(DEPTH.say)
      .setAlpha(0)
    this.bars = this.add.graphics()
    if (this.params.demo) this.showDemo()

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p))
  }

  update(time: number, delta: number) {
    if (this.revealed) return
    for (const mark of this.rules.tick(delta)) this.cupOff(mark, this.rules.results[mark] ?? 'dark')
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.drawCups(time)
    this.moveDemo()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The skin's colour under a cup: from the customer's own skin to pink while light, pink to red in the good band, then a deep berry. */
  private redTint(red: number): number {
    const grade = cupGradeOf(red)
    if (grade === 'light') return mix(this.skinColor, hex(C.lotus), red / CUPPING_GOOD.min)
    if (grade === 'good') return mix(hex(C.lotus), hex(C.lantern), (red - CUPPING_GOOD.min) / (CUPPING_GOOD.max - CUPPING_GOOD.min))
    return hex(C.berry)
  }

  /** Each cup's skin takes the colour of its red and a good one glows; the open marks pulse while the tray has a cup; the tray shows the cups left. */
  private drawCups(time: number): void {
    for (const [mark, cup] of this.cups) {
      const red = this.rules.redOf(mark) ?? 0
      cup.skin.setTint(this.redTint(red))
      cup.glow.setVisible(cupGradeOf(red) === 'good')
    }
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(time / 400))
    this.marks.forEach((m, i) => m.setAlpha(this.rules.open(i) ? (this.rules.free() > 0 ? pulse : 0.35) : 0))
    this.trayCups.forEach((c, i) => c.setVisible(i < this.rules.free()))
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    this.hideDemo()
    const mark = this.markAt(p.x, p.y)
    if (mark === null) return
    if (this.rules.redOf(mark) !== null) {
      const grade = this.rules.lift(mark)
      if (grade) this.cupOff(mark, grade)
      return
    }
    const fromSlot = this.rules.free() - 1
    if (!this.rules.place(mark)) return
    this.cupOn(mark, fromSlot)
  }

  /** The mark nearest a tap within reach, else null. */
  private markAt(x: number, y: number): number | null {
    let best: number | null = null
    let bestD = HIT_R
    MARKS.forEach((m, i) => {
      const d = Math.hypot(x - (this.back.x + m.x), y - (BACK.y + m.y))
      if (d <= bestD) {
        best = i
        bestD = d
      }
    })
    return best
  }

  /** A cup flies from the tray's last full slot to the mark and stays there over its skin. */
  private cupOn(mark: number, slot: number): void {
    const m = MARKS[mark]
    const glow = this.add.image(0, 0, 'cp-skin').setTint(hex(C.mustard)).setScale(GLOW_SCALE).setVisible(false)
    const skin = this.add.image(0, 0, 'cp-skin').setTint(this.skinColor)
    const glass = this.add.image(0, 0, 'cp-cup')
    const from = CP_TRAY_CUPS[Math.max(0, Math.min(CUPPING_CUPS - 1, slot))]
    const box = this.add.container(TRAY.x + from.x - this.back.x, TRAY.y + from.y - BACK.y, [glow, skin, glass])
    skin.setAlpha(0)
    this.back.add(box)
    this.cups.set(mark, { box, glow, skin })
    this.tweens.add({ targets: box, x: m.x, y: m.y, duration: FLY_MS, ease: 'Quad.easeOut', onComplete: () => skin.setAlpha(1) })
  }

  /** The cup goes back to the tray, leaving a round mark the colour of its grade; then the customer says how it feels, and a dark one makes the back flinch. */
  private cupOff(mark: number, grade: CupGrade): void {
    const cup = this.cups.get(mark)
    if (!cup) return
    this.cups.delete(mark)
    const m = MARKS[mark]
    const tint = grade === 'light' ? mix(this.skinColor, hex(C.lotus), 0.5) : grade === 'good' ? hex(C.lantern) : hex(C.berry)
    const ring = this.add.image(m.x, m.y, 'cp-skin').setTint(tint).setScale(RING_SCALE).setAlpha(grade === 'light' ? 0.6 : 0.85)
    // under the cups still on, over the back
    this.back.addAt(ring, this.back.getIndex(this.marks[0]))
    this.tweens.killTweensOf(cup.box)
    cup.glow.destroy()
    cup.skin.destroy()
    this.tweens.add({
      targets: cup.box,
      x: TRAY.x - this.back.x,
      y: TRAY.y - BACK.y,
      alpha: 0,
      duration: FLY_MS,
      ease: 'Quad.easeIn',
      onComplete: () => cup.box.destroy(),
    })
    this.say(grade)
    if (grade === 'dark') this.flinch()
  }

  private say(grade: CupGrade): void {
    this.tweens.killTweensOf(this.line)
    this.line.setText(t(LINES[grade].key)).setColor(LINES[grade].color).setAlpha(1)
    this.tweens.add({ targets: this.line, alpha: 0, delay: SAY.showMs, duration: SAY.fadeMs })
  }

  private flinch(): void {
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

  /** The hand dips onto its target over and over; `moveDemo` keeps it on the cup to lift or the mark to fill. */
  private showDemo(): void {
    // the fingertip is at the bottom centre of the texture
    this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand).setVisible(false)
    this.tweens.add({ targets: this.press, k: 1, duration: DEMO.dipMs, yoyo: true, hold: DEMO.holdMs, repeat: -1, repeatDelay: DEMO.pauseMs, ease: 'Quad.easeIn' })
  }

  /** Over a good cup the hand taps; else over the first open mark while the tray has a cup; else it waits, still, over the reddest cup. */
  private moveDemo(): void {
    if (!this.demoHand) return
    const on = Array.from({ length: CUPPING_MARKS }, (_, i) => i).filter(i => this.rules.redOf(i) !== null)
    const good = on.find(i => cupGradeOf(this.rules.redOf(i)!) === 'good')
    const open = this.rules.free() > 0 ? Array.from({ length: CUPPING_MARKS }, (_, i) => i).find(i => this.rules.open(i)) : undefined
    const reddest = on.reduce<number | undefined>((best, i) => (best === undefined || this.rules.redOf(i)! > this.rules.redOf(best)! ? i : best), undefined)
    const target = good ?? open ?? reddest
    this.demoHand.setVisible(target !== undefined)
    if (target === undefined) return
    const k = good !== undefined || open !== undefined ? this.press.k : 0
    const m = MARKS[target]
    this.demoHand.setPosition(this.back.x + m.x, BACK.y + m.y - DEMO.hoverPx * (1 - k)).setScale(Phaser.Math.Linear(1, DEMO.pressScale, k))
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.tweens.killTweensOf(this.press)
    this.demoHand.destroy()
    this.demoHand = null
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.hideDemo()
    // the stars come up over the tray, so the cups left in it go
    for (const c of this.trayCups) c.setVisible(false)
    for (const m of this.marks) m.setVisible(false)
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / CUPPING_LIMIT_MS)
  }
}
