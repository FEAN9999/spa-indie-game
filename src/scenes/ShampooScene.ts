import * as Phaser from 'phaser'
import { C, lookColors } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { Stars } from '../sim/economy'
import { ShampooGame, type ShampooPhase } from '../sim/shampoo'
import type { Look } from '../sim/types'
import { t, type StringKey } from '../strings/vi'
import { textStyle } from '../view/text'

export interface ShampooData {
  look: Look
  /** Added to the time limit and the star marks on the gentler first days. */
  extraMs: number
  /** The first shampoo shows each move with a faint hand. */
  demo: boolean
  onDone: (stars: Stars) => void
}

const CARD = { x: 60, y: 260, w: 960, h: 1440 }
/** Bounding ellipse of the `sh-hair` image, which is drawn centred on it. */
const HAIR = { x: 540, y: 710, rx: 210, ry: 150 }
const BAR = { x: 140, w: 800, h: 28, progressY: 420, timeY: 1612 }
const FOAM_STEP_PX = 28
const MAX_FOAM = 90
const DROP_EVERY_MS = 45
const BEADS = 14
const STAR_Y = 1330
const DEMO = { alpha: 0.6, swipePx: 120, swipeMs: 700, pressScale: 0.9, pressMs: 900 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

const INSTRUCTION: Record<ShampooPhase, StringKey> = { foam: 'shampooFoam', rinse: 'shampooRinse', dry: 'shampooDry', done: 'shampooDone' }

/** Close-up shampoo mini-game over the frozen spa: foam by swiping, rinse by holding, dry by swiping. */
export class ShampooScene extends Phaser.Scene {
  private params!: ShampooData
  private rules!: ShampooGame
  private phase: ShampooPhase = 'foam'
  private pointer: Phaser.Input.Pointer | null = null
  private last = { x: 0, y: 0 }
  private trail = 0
  private dropMs = 0
  private foam: Phaser.GameObjects.Image[] = []
  private beads: Phaser.GameObjects.Image[] = []
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private shower!: Phaser.GameObjects.Image
  private towel!: Phaser.GameObjects.Image
  private revealed = false
  /** The faint hand showing this phase's move, until the first touch of the phase. */
  private demoHand: Phaser.GameObjects.Image | null = null

  constructor() {
    super('ShampooScene')
  }

  init(data: ShampooData) {
    this.params = data
  }

  create() {
    this.rules = new ShampooGame(this.params.extraMs)
    this.phase = 'foam'
    this.pointer = null
    this.trail = 0
    this.dropMs = 0
    this.foam = []
    this.beads = []
    this.revealed = false
    this.demoHand = null

    const colors = lookColors(this.params.look)
    // interactive so taps stop here instead of reaching the spa's HUD underneath
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.add
      .graphics()
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 60)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 60)
    this.add.image(GAME_W / 2, HAIR.y - 190, 'sh-basin').setOrigin(0.5, 0)
    this.add.image(GAME_W / 2, HAIR.y + 190, 'sh-head').setTint(colors.skin)
    this.add.image(GAME_W / 2, HAIR.y + 190, 'sh-head-line')
    this.add.image(HAIR.x, HAIR.y, 'sh-hair').setTint(colors.hair)
    this.add.image(HAIR.x, HAIR.y, 'sh-hair-line')
    this.instruction = this.add
      .text(GAME_W / 2, 345, t('shampooFoam'), { ...textStyle(46), align: 'center', wordWrap: { width: 860 } })
      .setOrigin(0.5)
    this.bars = this.add.graphics()
    this.shower = this.add.image(0, 0, 'sh-shower').setOrigin(0.5, 0.25).setVisible(false).setDepth(10)
    this.towel = this.add.image(0, 0, 'sh-towel').setVisible(false).setDepth(10)

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.pointer = p
      this.last = { x: p.x, y: p.y }
      this.hideDemo()
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p))
    for (const ev of ['pointerup', 'pointerupoutside', 'gameout']) this.input.on(ev, () => (this.pointer = null))
    this.showDemo('foam')
  }

  update(time: number, delta: number) {
    if (this.revealed) return
    const p = this.pointer
    const held = p !== null && this.onHair(p.x, p.y)
    if (this.rules.phase === 'rinse') this.rules.hold(delta, held)
    this.rules.tick(delta)
    if (this.rules.phase !== this.phase) this.enterPhase(this.rules.phase)
    if (this.revealed) return
    // a finger carried over from foam is already rinsing, so the demo goes without a new touch
    if (this.phase === 'rinse' && held) this.hideDemo()

    const progress = this.rules.progress()
    this.shower.setVisible(this.phase === 'rinse' && p !== null)
    this.towel.setVisible(this.phase === 'dry' && p !== null)
    if (p && this.phase === 'rinse') {
      this.shower.setPosition(p.x, p.y - 110)
      this.dropMs += delta
      for (; this.dropMs >= DROP_EVERY_MS; this.dropMs -= DROP_EVERY_MS) this.spawnDrop(p.x, p.y)
    }
    if (p && this.phase === 'dry') this.towel.setPosition(p.x, p.y).setRotation(Math.sin(time / 90) * 0.15)
    if (this.phase === 'rinse') for (const f of this.foam) f.setAlpha(1 - progress)
    if (this.phase === 'dry') for (const b of this.beads) b.setAlpha(1 - progress)
    this.drawBars(progress)
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.pointer || this.revealed) return
    const dist = Phaser.Math.Distance.Between(this.last.x, this.last.y, p.x, p.y)
    this.last = { x: p.x, y: p.y }
    const onHair = this.onHair(p.x, p.y)
    if (this.phase === 'foam' || this.phase === 'dry') {
      this.rules.swipe(dist / (HAIR.rx * 2), onHair)
      // a finger carried over from rinse is already drying, so the demo goes without a new touch
      if (onHair) this.hideDemo()
    }
    if (this.phase !== 'foam' || !onHair) return
    this.trail += dist
    for (; this.trail >= FOAM_STEP_PX; this.trail -= FOAM_STEP_PX) {
      if (this.foam.length >= MAX_FOAM) break
      const bubble = this.add.image(p.x, p.y, 'sh-foam').setScale(0).setRotation(Math.random() * Math.PI)
      this.tweens.add({ targets: bubble, scale: 0.7 + Math.random() * 0.5, duration: 180, ease: 'Back.easeOut' })
      this.foam.push(bubble)
    }
  }

  private enterPhase(next: ShampooPhase): void {
    this.phase = next
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.instruction.setText(t(INSTRUCTION[next]))
    this.showDemo(next)
    if (next === 'dry') {
      for (const f of this.foam) f.destroy()
      this.foam = []
      for (let i = 0; i < BEADS; i++) {
        const a = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * 0.85
        this.beads.push(this.add.image(HAIR.x + Math.cos(a) * r * HAIR.rx, HAIR.y + Math.sin(a) * r * HAIR.ry, 'sh-drop').setScale(0.9))
      }
    }
  }

  /** Foam and dry: the hand swipes side to side across the hair; rinse: it presses slowly on the hair centre. */
  private showDemo(phase: ShampooPhase): void {
    this.hideDemo()
    if (!this.params.demo || phase === 'done') return
    // the fingertip is at the bottom centre of the texture
    const hand = this.add.image(HAIR.x, HAIR.y, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(20)
    if (phase === 'rinse') this.tweens.add({ targets: hand, scale: DEMO.pressScale, duration: DEMO.pressMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    else {
      hand.x = HAIR.x - DEMO.swipePx
      this.tweens.add({ targets: hand, x: HAIR.x + DEMO.swipePx, duration: DEMO.swipeMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    }
    this.demoHand = hand
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.tweens.killTweensOf(this.demoHand)
    this.demoHand.destroy()
    this.demoHand = null
  }

  private spawnDrop(x: number, y: number): void {
    const drop = this.add.image(x + Phaser.Math.Between(-40, 40), y - 80, 'sh-drop').setDepth(9)
    this.tweens.add({ targets: drop, y: y + 40, alpha: 0, duration: 380, onComplete: () => drop.destroy() })
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.hideDemo()
    this.shower.setVisible(false)
    this.towel.setVisible(false)
    // the hair is clean and dry, whatever phase the reveal interrupted
    for (const img of [...this.foam, ...this.beads]) img.destroy()
    this.foam = []
    this.beads = []
    this.instruction.setText(t('shampooDone'))
    this.drawBars(1)
    ;[-1, 0, 1].forEach((offset, i) => {
      const slot = this.add.image(GAME_W / 2 + offset * 170, STAR_Y, 'star-empty').setScale(1.4)
      if (i >= stars) return
      this.time.delayedCall(300 + i * 400, () => {
        slot.setTexture('star').setScale(0.6)
        this.tweens.add({ targets: slot, scale: 1.4, duration: 250, ease: 'Back.easeOut' })
      })
    })
    this.time.delayedCall(1900, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  private drawBars(progress: number): void {
    const left = Math.max(0, 1 - this.rules.elapsedMs / this.rules.limitMs)
    const g = this.bars.clear()
    const bar = (y: number, track: number, fill: number, k: number) => {
      g.fillStyle(track, 1).fillRoundedRect(BAR.x, y, BAR.w, BAR.h, BAR.h / 2)
      if (k > 0) g.fillStyle(fill, 1).fillRoundedRect(BAR.x, y, Math.max(BAR.h, BAR.w * k), BAR.h, BAR.h / 2)
    }
    bar(BAR.progressY, hex(C.tileSeam), hex(C.teal), progress)
    bar(BAR.timeY, hex(C.tileSeam), hex(C.mustard), left)
  }

  private onHair(x: number, y: number): boolean {
    return ((x - HAIR.x) / HAIR.rx) ** 2 + ((y - HAIR.y) / HAIR.ry) ** 2 <= 1
  }
}
