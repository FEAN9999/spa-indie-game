import * as Phaser from 'phaser'
import { MS_ORIGIN } from '../art/massageArt'
import { C, customerColors } from '../art/palette'
import { SN_POT_STONES } from '../art/stoneArt'
import { GAME_W, STONE_GOOD, STONE_LIMIT_MS, STONE_SPOTS } from '../config'
import type { Stars } from '../sim/economy'
import { createRng } from '../sim/rng'
import { StoneGame, heatOf, type StoneHeat } from '../sim/stone'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { textStyle } from '../view/text'

/** The back centre on the card and the massage pictures' scale: the head just under the progress bar, the towel tucked behind the pot. */
const BACK = { x: GAME_W / 2, y: 1030, scale: 0.85 }
/** The six spots on the bare back, from the back centre, in the order the stones are laid: a pair across, shoulders down to the waist. */
const SPOTS = [-160, 0, 160].flatMap(y => [-125, 125].map(x => ({ x, y })))
/** The pot at the card's foot, its bottom just over the time bar; its stones sit at SN_POT_STONES from here. */
const POT = { x: GAME_W / 2, y: 1428 }
/** The tap box round a pot stone: its share of the row across, and a little taller than the stone. */
const HIT = { halfW: 90, halfH: 85 }
/** A laid stone is a little smaller than in the pot, to sit on its spot. */
const LAID_SCALE = 0.75
/** A good stone's mustard rim: the stone drawn larger behind itself. */
const GLOW_SCALE = 1.14
/** A hot stone rattles up and down in the pot. */
const JITTER = { px: 5, ms: 90 }
const POP_MS = 140
const FLY_MS = 380
/** The customer's line over the head as each stone lands. */
const SAY = { y: 495, size: 50, stroke: 12, showMs: 1000, fadeMs: 250 }
const LINES: Record<StoneHeat, { key: StringKey; color: string }> = {
  good: { key: 'stoneGood', color: C.teal },
  cold: { key: 'stoneCold', color: C.cobalt },
  hot: { key: 'stoneHot', color: C.lantern },
}
/** A hot stone makes the back jerk side to side, dying away. */
const FLINCH = { px: 16, ms: 350, swings: 2 }
const DEMO = { alpha: 0.6, hoverPx: 50, dipMs: 160, holdMs: 120, pauseMs: 500, pressScale: 0.92 }
const DEPTH = { flying: 6, say: 10, hand: 20 }
/** The stone's tints, from the sketch: grey warming to brown while cold, then orange, then the lantern red. */
const COLD = { from: 0x8c8580, to: 0xc08a63 }
const ORANGE = 0xee8a2e
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** Blends two 0xRRGGBB colours, `k` from 0 to 1. */
const mix = (a: number, b: number, k: number) =>
  [16, 8, 0].reduce((out, shift) => out | (Math.round(Phaser.Math.Linear((a >> shift) & 255, (b >> shift) & 255, k)) << shift), 0)
const tintOf = (heat: number): number => {
  const grade = heatOf(heat)
  return grade === 'cold' ? mix(COLD.from, COLD.to, heat / STONE_GOOD.min) : grade === 'good' ? ORANGE : hex(C.lantern)
}

interface PotStone {
  box: Phaser.GameObjects.Container
  glow: Phaser.GameObjects.Image
  fill: Phaser.GameObjects.Image
}

/** Close-up Đá nóng mini-game over the frozen spa: stones heat in a pot, and each is tapped onto the customer's back as it turns orange. */
export class StoneScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: StoneGame
  /** The customer's back and head with the spots and the stones laid on them, which flinch together; the bed stays still. */
  private back!: Phaser.GameObjects.Container
  private potStones: PotStone[] = []
  private line!: Phaser.GameObjects.Text
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** The faint hand tapping a good stone until the first touch, and how far into its tap it is. */
  private demoHand: Phaser.GameObjects.Image | null = null
  private press = { k: 0 }

  constructor() {
    super('StoneScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the stone game takes no day-ease time
    this.rules = new StoneGame(createRng(Date.now()), this.params.hard)
    this.revealed = false
    this.demoHand = null
    this.press = { k: 0 }

    const colors = customerColors(this.params.look, this.params.kind)
    this.instruction = addMiniGameCard(this, t('stoneTap'))
    const o = MS_ORIGIN
    const part = (key: string, origin: { x: number; y: number }) => this.add.image(0, 0, key).setOrigin(origin.x, origin.y).setScale(BACK.scale)
    part('ms-bed', o.bed).setPosition(BACK.x, BACK.y)
    this.back = this.add.container(BACK.x, BACK.y, [
      part('ms-back', o.back).setTint(colors.skin),
      part('ms-back-line', o.back),
      part('ms-hair', o.hair).setTint(colors.hair),
      part('ms-hair-line', o.hair),
      ...SPOTS.map(s => this.add.image(s.x, s.y, 'sn-spot')),
    ])
    this.add.image(POT.x, POT.y, 'sn-pot')
    this.potStones = SN_POT_STONES.map(p => this.addPotStone(POT.x + p.x, POT.y + p.y))
    this.line = this.add
      .text(GAME_W / 2, SAY.y, '', textStyle(SAY.size))
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
    this.rules.tick(delta)
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    const heats = this.rules.heats()
    this.drawPot(heats, time)
    this.moveDemo(heats)
    drawBars(this.bars, this.rules.placed.length / STONE_SPOTS, this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  private addPotStone(x: number, y: number): PotStone {
    const glow = this.add.image(0, 0, 'sn-stone').setTint(hex(C.mustard)).setScale(GLOW_SCALE)
    const fill = this.add.image(0, 0, 'sn-stone')
    return { box: this.add.container(x, y, [glow, fill, this.add.image(0, 0, 'sn-stone-line')]), glow, fill }
  }

  /** Each stone takes the colour of its heat; a good one glows and a hot one rattles. */
  private drawPot(heats: number[], time: number): void {
    heats.forEach((heat, i) => {
      const { box, glow, fill } = this.potStones[i]
      const grade = heatOf(heat)
      fill.setTint(tintOf(heat))
      glow.setVisible(grade === 'good')
      const rattle = grade === 'hot' ? -JITTER.px * Math.abs(Math.sin((time / JITTER.ms + i) * Math.PI)) : 0
      box.setPosition(POT.x + SN_POT_STONES[i].x, POT.y + SN_POT_STONES[i].y + rattle)
    })
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    this.hideDemo()
    const slot = this.potStones.findIndex(s => Math.abs(p.x - s.box.x) <= HIT.halfW && Math.abs(p.y - s.box.y) <= HIT.halfH)
    if (slot < 0) return
    const color = tintOf(this.rules.heats()[slot])
    const spot = SPOTS[this.rules.placed.length]
    const grade = this.rules.tap(slot)
    if (!grade) return
    const { box } = this.potStones[slot]
    this.lay(box, color, spot, grade)
    // a fresh cold stone takes its place
    this.tweens.killTweensOf(box)
    box.setScale(0.5)
    this.tweens.add({ targets: box, scale: 1, duration: POP_MS, ease: 'Back.easeOut' })
  }

  /** A copy of the tapped stone flies to its spot and stays there in its colour; then the customer says how it feels, and a hot one makes the back flinch. */
  private lay(from: Phaser.GameObjects.Container, color: number, spot: { x: number; y: number }, grade: StoneHeat): void {
    const stone = this.add.image(0, 0, 'sn-stone').setTint(color)
    const box = this.add.container(from.x, from.y, [stone, this.add.image(0, 0, 'sn-stone-line')]).setDepth(DEPTH.flying)
    this.tweens.add({
      targets: box,
      x: BACK.x + spot.x,
      y: BACK.y + spot.y,
      scale: LAID_SCALE,
      duration: FLY_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.back.add(box.setPosition(spot.x, spot.y))
        this.say(grade)
        if (grade === 'hot') this.flinch()
      },
    })
  }

  private say(grade: StoneHeat): void {
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

  /** The hand dips onto its target over and over; `moveDemo` keeps it on the first good stone. */
  private showDemo(): void {
    // the fingertip is at the bottom centre of the texture
    this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand).setVisible(false)
    this.tweens.add({ targets: this.press, k: 1, duration: DEMO.dipMs, yoyo: true, hold: DEMO.holdMs, repeat: -1, repeatDelay: DEMO.pauseMs, ease: 'Quad.easeIn' })
  }

  /** Over the first good stone the hand taps; while none is good it waits, still, over the warmest cold one. */
  private moveDemo(heats: number[]): void {
    if (!this.demoHand) return
    const good = heats.findIndex(h => heatOf(h) === 'good')
    const warmest = heats.reduce((best, h, i) => (heatOf(h) === 'cold' && (best < 0 || h > heats[best]) ? i : best), -1)
    const slot = good >= 0 ? good : warmest
    this.demoHand.setVisible(slot >= 0)
    if (slot < 0) return
    const k = good >= 0 ? this.press.k : 0
    const { box } = this.potStones[slot]
    this.demoHand.setPosition(box.x, box.y - DEMO.hoverPx * (1 - k)).setScale(Phaser.Math.Linear(1, DEMO.pressScale, k))
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
    // the stars come up over the pot, so the stones left in it go
    for (const s of this.potStones) s.box.setVisible(false)
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.rules.placed.length / STONE_SPOTS, this.timeLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / STONE_LIMIT_MS)
  }
}
