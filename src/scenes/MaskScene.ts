import * as Phaser from 'phaser'
import { MK_FACE_R, MK_ORIGIN } from '../art/maskArt'
import { C, customerColors } from '../art/palette'
import { MASK_BRUSH_R } from '../config'
import type { Stars } from '../sim/economy'
import { MaskGame, type MaskPhase } from '../sim/mask'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'

/** The face centre on the card; the face circle, the rules' unit circle, is MK_FACE_R px round it. */
const FACE = { x: 540, y: 880 }
const R = MK_FACE_R
/** The plate the two slices wait on, under the face. */
const TRAY = { x: 540, y: 1390, w: 470, h: 170, sliceDx: 85 }
/** A paint dab is as wide as the brush reaches, with an ink rim this wide round the painted patch. */
const DAB_PX = MASK_BRUSH_R * R
const RIM_PX = 4
const DAB_STEP_PX = 12
/** The slice art's radius; a slice is drawn this much wider than the eye it covers. */
const SLICE_ART_R = 60
const SLICE_OVER_EYE_PX = 12
const FROWN_MS = 600
const DEMO = { alpha: 0.6, swipePx: 130, swipeMs: 700, cheekY: 110, dragMs: 1100, dragPauseMs: 600 }
const DEPTH = { slice: 5, dragged: 15, hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

const INSTRUCTION: Record<MaskPhase, StringKey> = { paint: 'maskPaint', cucumber: 'maskCucumber', done: 'shampooDone' }

interface Slice {
  img: Phaser.GameObjects.Image
  home: { x: number; y: number }
  /** The eye it lies on, once dropped there. */
  eye: 0 | 1 | null
}

/** Close-up face-mask mini-game over the frozen spa: paint the mint mask around the eyes, then lay a cucumber slice on each eye. */
export class MaskScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: MaskGame
  private phase: MaskPhase = 'paint'
  private painting = false
  private last = { x: 0, y: 0 }
  /** The mint paint, over an ink layer a rim wider that shows only round its edge. */
  private paint!: Phaser.GameObjects.RenderTexture
  private rim!: Phaser.GameObjects.RenderTexture
  private dab!: Phaser.GameObjects.Graphics
  private rimDab!: Phaser.GameObjects.Graphics
  /** What each paint layer loses after every stroke: everything off the face, and the eyes. */
  private paintClip!: Phaser.GameObjects.Graphics
  private rimClip!: Phaser.GameObjects.Graphics
  private frown!: Phaser.GameObjects.Image
  private frownTimer: Phaser.Time.TimerEvent | null = null
  private tray!: Phaser.GameObjects.Graphics
  private slices: Slice[] = []
  private sliceScale = 1
  private dragging: Slice | null = null
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** The faint hand showing this phase's move, until the first touch of the phase. */
  private demoHand: Phaser.GameObjects.Image | null = null

  constructor() {
    super('MaskScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the mask game takes no day-ease time
    this.rules = new MaskGame(this.params.hard)
    this.phase = 'paint'
    this.painting = false
    this.frownTimer = null
    this.slices = []
    this.dragging = null
    this.revealed = false
    this.demoHand = null

    const colors = customerColors(this.params.look, this.params.kind)
    this.instruction = addMiniGameCard(this, t('maskPaint'))
    const o = MK_ORIGIN
    this.add.image(FACE.x, FACE.y, 'mk-pillow').setOrigin(o.pillow.x, o.pillow.y)
    this.add.image(FACE.x, FACE.y, 'mk-hair').setOrigin(o.hair.x, o.hair.y).setTint(colors.hair)
    this.add.image(FACE.x, FACE.y, 'mk-hair-line').setOrigin(o.hair.x, o.hair.y)
    this.add.image(FACE.x, FACE.y, 'mk-face').setOrigin(o.face.x, o.face.y).setTint(colors.skin)
    this.makePaintLayers()
    this.add.image(FACE.x, FACE.y, 'mk-face-line').setOrigin(o.face.x, o.face.y)
    this.frown = this.add.image(FACE.x, FACE.y, 'mk-frown').setOrigin(o.frown.x, o.frown.y).setVisible(false)

    this.tray = this.add
      .graphics()
      .fillStyle(hex(C.cream), 1)
      .fillEllipse(TRAY.x, TRAY.y, TRAY.w, TRAY.h)
      .lineStyle(4, hex(C.ink))
      .strokeEllipse(TRAY.x, TRAY.y, TRAY.w, TRAY.h)
      .lineStyle(5, hex(C.cobalt))
      .strokeEllipse(TRAY.x, TRAY.y, TRAY.w - 50, TRAY.h - 40)
    // the slices wait faded until the mask is on
    this.sliceScale = (this.rules.eyes()[0].r * R + SLICE_OVER_EYE_PX) / SLICE_ART_R
    for (const dx of [-TRAY.sliceDx, TRAY.sliceDx]) {
      const home = { x: TRAY.x + dx, y: TRAY.y - 6 }
      this.slices.push({ img: this.add.image(home.x, home.y, 'mk-cucumber').setScale(this.sliceScale).setAlpha(0.5).setDepth(DEPTH.slice), home, eye: null })
    }
    this.bars = this.add.graphics()

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p))
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p))
    for (const ev of ['pointerup', 'pointerupoutside', 'gameout']) this.input.on(ev, () => this.onUp())
    this.showDemo('paint')
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.rules.tick(delta)
    if (this.rules.phase !== this.phase) this.enterPhase(this.rules.phase)
    if (this.revealed) return
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** Two paint layers over the face's bounding square, and the brushes and clips drawn into them. */
  private makePaintLayers(): void {
    this.rim = this.add.renderTexture(FACE.x - R, FACE.y - R, 2 * R, 2 * R).setOrigin(0).setAlpha(0.3)
    this.paint = this.add.renderTexture(FACE.x - R, FACE.y - R, 2 * R, 2 * R).setOrigin(0)
    this.rimDab = this.make.graphics({}, false).fillStyle(hex(C.ink), 1).fillCircle(0, 0, DAB_PX + RIM_PX)
    this.dab = this.make.graphics({}, false).fillStyle(hex(C.mint), 1).fillCircle(0, 0, DAB_PX)
    // in the layers' own pixels, where the face centre is (R, R); a thick ring covers the corners outside the face
    const clip = (eyeShrink: number) => {
      const g = this.make.graphics({}, false).lineStyle(R, 0x000000, 1).strokeCircle(R, R, R * 1.5).fillStyle(0x000000, 1)
      for (const e of this.rules.eyes()) g.fillCircle(R + e.x * R, R + e.y * R, e.r * R - eyeShrink)
      return g
    }
    this.paintClip = clip(0)
    // the ink layer keeps a rim inside each eye hole, so the holes have an edge too
    this.rimClip = clip(RIM_PX)
    // made off the display list, so the scene does not clean them up
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const g of [this.rimDab, this.dab, this.paintClip, this.rimClip]) g.destroy()
    })
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    this.hideDemo()
    if (this.phase === 'paint') {
      this.painting = true
      this.last = { x: p.x, y: p.y }
      this.paintTo(p.x, p.y)
      return
    }
    if (this.phase !== 'cucumber') return
    const grab = this.slices.find(s => s.eye === null && Phaser.Math.Distance.Between(p.x, p.y, s.img.x, s.img.y) <= s.img.displayWidth / 2 + 20)
    if (!grab) return
    this.tweens.killTweensOf(grab.img)
    this.dragging = grab
    grab.img.setPosition(p.x, p.y).setScale(this.sliceScale).setDepth(DEPTH.dragged)
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    if (this.dragging) this.dragging.img.setPosition(p.x, p.y)
    else if (this.painting && p.isDown) this.paintTo(p.x, p.y)
  }

  private onUp(): void {
    if (this.painting) this.rules.lift()
    this.painting = false
    const slice = this.dragging
    if (!slice || this.revealed) return
    this.dragging = null
    slice.img.setDepth(DEPTH.slice)
    const eye = this.rules.placeCucumber((slice.img.x - FACE.x) / R, (slice.img.y - FACE.y) / R)
    if (eye === null) {
      this.tweens.add({ targets: slice.img, x: slice.home.x, y: slice.home.y, duration: 200, ease: 'Cubic.easeOut' })
      return
    }
    slice.eye = eye
    const at = this.rules.eyes()[eye]
    this.tweens.add({ targets: slice.img, x: FACE.x + at.x * R, y: FACE.y + at.y * R, duration: 120, ease: 'Back.easeOut' })
  }

  /**
   * Paints dabs from the last point to (x, y), so a quick stroke leaves no gaps; the rules see every dab.
   * A stroke that reaches the goal keeps painting until the finger lifts, though the rules no longer count it.
   */
  private paintTo(x: number, y: number): void {
    const errors = this.rules.errors
    const steps = Math.max(1, Math.ceil(Phaser.Math.Distance.Between(this.last.x, this.last.y, x, y) / DAB_STEP_PX))
    for (let i = 1; i <= steps; i++) {
      const dx = Phaser.Math.Linear(this.last.x, x, i / steps)
      const dy = Phaser.Math.Linear(this.last.y, y, i / steps)
      this.rules.paint((dx - FACE.x) / R, (dy - FACE.y) / R)
      this.rim.draw(this.rimDab, dx - this.rim.x, dy - this.rim.y)
      this.paint.draw(this.dab, dx - this.paint.x, dy - this.paint.y)
    }
    this.last = { x, y }
    this.rim.erase(this.rimClip).render()
    this.paint.erase(this.paintClip).render()
    if (this.rules.errors > errors) this.showFrown()
  }

  /** The customer frowns for a moment when the paint touches an eye. */
  private showFrown(): void {
    this.frown.setVisible(true)
    this.frownTimer?.remove()
    this.frownTimer = this.time.delayedCall(FROWN_MS, () => this.frown.setVisible(false))
  }

  private enterPhase(next: MaskPhase): void {
    this.phase = next
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    setInstruction(this.instruction, t(INSTRUCTION[next]))
    this.frown.setVisible(false)
    for (const s of this.slices) {
      s.img.setAlpha(1)
      this.tweens.add({ targets: s.img, scale: this.sliceScale * 1.15, duration: 160, yoyo: true, ease: 'Sine.easeOut' })
    }
    this.showDemo(next)
  }

  /** Paint: the hand sweeps side to side across the cheeks; cucumber: it drags from the tray to the left eye. */
  private showDemo(phase: MaskPhase): void {
    this.hideDemo()
    if (!this.params.demo || phase === 'done') return
    // the fingertip is at the bottom centre of the texture
    const hand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand)
    if (phase === 'paint') {
      hand.setPosition(FACE.x - DEMO.swipePx, FACE.y + DEMO.cheekY)
      this.tweens.add({ targets: hand, x: FACE.x + DEMO.swipePx, duration: DEMO.swipeMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    } else {
      const from = this.slices[0].home
      const eye = this.rules.eyes()[0]
      hand.setPosition(from.x, from.y)
      this.tweens.add({ targets: hand, x: FACE.x + eye.x * R, y: FACE.y + eye.y * R, duration: DEMO.dragMs, repeat: -1, repeatDelay: DEMO.dragPauseMs, ease: 'Sine.easeInOut' })
    }
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
    this.painting = false
    this.dragging = null
    this.hideDemo()
    this.frown.setVisible(false)
    // the stars show where the tray was; a slice not on an eye goes with it
    this.tray.setVisible(false)
    for (const s of this.slices) if (s.eye === null) s.img.setVisible(false)
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
}
