import * as Phaser from 'phaser'
import { customerColors } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_W } from '../config'
import type { Stars } from '../sim/economy'
import { ShampooGame, type ShampooPhase } from '../sim/shampoo'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'

/** Bounding ellipse of the `sh-hair` image, which is drawn centred on it. */
const HAIR = { x: 540, y: 710, rx: 210, ry: 150 }
/** The head's centre, where the `sh-hair` art expects it: the back of the head lies in the basin. */
const HEAD_Y = HAIR.y + 130
const FOAM_STEP_PX = 28
const MAX_FOAM = 90
const DROP_EVERY_MS = 45
const BEADS = 14
const DEMO = { alpha: 0.6, swipePx: 120, swipeMs: 700, pressScale: 0.9, pressMs: 900 }
const INSTRUCTION: Record<ShampooPhase, StringKey> = { foam: 'shampooFoam', rinse: 'shampooRinse', dry: 'shampooDry', done: 'shampooDone' }

/** Close-up shampoo mini-game over the frozen spa: foam by swiping, rinse by holding, dry by swiping; a picky customer needs more swiping. */
export class ShampooScene extends Phaser.Scene {
  private params!: MiniGameData
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

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    this.rules = new ShampooGame(this.params.extraMs, this.params.hard)
    this.phase = 'foam'
    this.pointer = null
    this.trail = 0
    this.dropMs = 0
    this.foam = []
    this.beads = []
    this.revealed = false
    this.demoHand = null

    const colors = customerColors(this.params.look, this.params.kind, null, null, false, this.params.idol ?? null)
    this.instruction = addMiniGameCard(this, t('shampooFoam'))
    this.add.image(GAME_W / 2, HAIR.y - 190, 'sh-basin').setOrigin(0.5, 0)
    this.add.image(GAME_W / 2, HEAD_Y, 'sh-head').setTint(colors.skin)
    this.add.image(GAME_W / 2, HEAD_Y, 'sh-head-line')
    this.add.image(HAIR.x, HAIR.y, 'sh-hair').setTint(colors.hair)
    this.add.image(HAIR.x, HAIR.y, 'sh-hair-line')
    this.bars = this.add.graphics()
    this.shower = this.add.image(0, 0, 'sh-shower').setOrigin(0.5, 0.25).setVisible(false).setDepth(10)
    this.towel = this.add.image(0, 0, 'sh-towel').setVisible(false).setDepth(10)

    oneFinger(this.input, {
      down: p => {
        this.pointer = p
        this.last = { x: p.x, y: p.y }
        this.hideDemo()
      },
      move: p => this.onMove(p),
      up: () => (this.pointer = null),
    })
    this.showDemo('foam')
    // the water stops however the scene ends
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => sound.water(false))
  }

  update(time: number, delta: number) {
    if (this.revealed) return
    const p = this.pointer
    const held = p !== null && this.onHair(p.x, p.y)
    sound.water(this.phase === 'rinse' && held)
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
    drawBars(this.bars, progress, this.timeLeft())
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
      sound.play('foam')
    }
  }

  private enterPhase(next: ShampooPhase): void {
    this.phase = next
    sound.water(false)
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    setInstruction(this.instruction, t(INSTRUCTION[next]))
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
    sound.water(false)
    this.hideDemo()
    this.shower.setVisible(false)
    this.towel.setVisible(false)
    // the hair is clean and dry, whatever phase the reveal interrupted
    for (const img of [...this.foam, ...this.beads]) img.destroy()
    this.foam = []
    this.beads = []
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, 1, this.timeLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / this.rules.limitMs)
  }

  private onHair(x: number, y: number): boolean {
    return ((x - HAIR.x) / HAIR.rx) ** 2 + ((y - HAIR.y) / HAIR.ry) ** 2 <= 1
  }
}
