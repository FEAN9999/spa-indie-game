import * as Phaser from 'phaser'
import { C, customerColors } from '../art/palette'
import { ACNE_AT, ACNE_LIFT_MS, ACNE_LIFT_MS_HARD, ACNE_LIMIT_MS, ACNE_POP_MS } from '../config'
import { AcneGame, type AcneSpot } from '../sim/acne'
import type { Stars } from '../sim/economy'
import { createRng } from '../sim/rng'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'

/** The cheek close-up: the skin's middle and size, a closed eye near its top left and the side of the nose at its right. */
const FACE = { x: 540, y: 1010, rx: 410, ry: 300 }
const EYE = { x0: 300, x1: 520, y: 790, sag: 30 }
const NOSE = { x: 870, y0: 860, y1: 1060 }
/** Each blemish's look: a whitehead, a red one, one pressed in anger, and the marks left once cleared, bruised or dabbed. */
const SPOT = { white: 22, core: 9, red: 26, angry: 34, mark: 14, bruise: 18, gel: 30 }
/** The ring round a held whitehead: it fills to the pop, then empties through the grace. */
const RING = { r: 50, w: 12 }
/** The popped core jumps up and fades. */
const CORE = { risePx: 70, ms: 450 }
/** A word rises from over the cheek and fades. */
const WORD = { x: 540, y: 690, size: 54, stroke: 12, risePx: 60, ms: 800 }
const WORDS: Record<'pop' | 'bruise' | 'red' | 'dab', { key: StringKey; color: string }> = {
  pop: { key: 'acnePop', color: C.teal },
  bruise: { key: 'acneBruise', color: C.lantern },
  red: { key: 'acneRed', color: C.lantern },
  dab: { key: 'acneSoothe', color: C.teal },
}
/** A mistake makes the cheek jerk side to side, dying away. */
const FLINCH = { px: 14, ms: 320, swings: 2 }
const DEMO = { alpha: 0.6, hoverPx: 50, dipMs: 160, holdMs: 700, pauseMs: 400, pressScale: 0.92 }
const DEPTH = { word: 10, hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const ringAngle = (k: number) => -Math.PI / 2 + k * Math.PI * 2

/** Close-up Lấy nhân mụn mini-game over the frozen spa: each whitehead on the customer's cheek is held until its core pops and let go at once, the red ones are left alone, and each cleared spot is dabbed with gel. */
export class AcneScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: AcneGame
  /** The cheek and everything on it, which flinch together. */
  private face!: Phaser.GameObjects.Container
  private spots!: Phaser.GameObjects.Graphics
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private dabbing = false
  private revealed = false
  /** The faint hand pressing its target until the first touch, and how far into its press it is. */
  private demoHand: Phaser.GameObjects.Image | null = null
  private press = { k: 0 }

  constructor() {
    super('AcneScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the acne game takes no day-ease time
    this.rules = new AcneGame(createRng(Date.now()), this.params.hard)
    this.dabbing = false
    this.revealed = false
    this.demoHand = null
    this.press = { k: 0 }

    const colors = customerColors(this.params.look, this.params.kind)
    this.instruction = addMiniGameCard(this, t('acneTap'))
    const skin = this.add.graphics()
    skin.fillStyle(colors.skin, 1).fillEllipse(0, 0, FACE.rx * 2, FACE.ry * 2).lineStyle(5, hex(C.ink)).strokeEllipse(0, 0, FACE.rx * 2, FACE.ry * 2)
    const eye = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(EYE.x0 - FACE.x, EYE.y - FACE.y),
      new Phaser.Math.Vector2((EYE.x0 + EYE.x1) / 2 - FACE.x, EYE.y + EYE.sag - FACE.y),
      new Phaser.Math.Vector2(EYE.x1 - FACE.x, EYE.y - FACE.y),
    )
    skin.lineStyle(8, hex(C.ink))
    eye.draw(skin, 12)
    const nose = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(NOSE.x - FACE.x, NOSE.y0 - FACE.y),
      new Phaser.Math.Vector2(NOSE.x - 60 - FACE.x, (NOSE.y0 + NOSE.y1) / 2 - FACE.y),
      new Phaser.Math.Vector2(NOSE.x - 10 - FACE.x, NOSE.y1 - FACE.y),
    )
    skin.lineStyle(5, hex(C.ink), 0.5)
    nose.draw(skin, 12)
    this.spots = this.add.graphics()
    this.face = this.add.container(FACE.x, FACE.y, [skin, this.spots])
    this.bars = this.add.graphics()
    if (this.params.demo) this.showDemo()

    oneFinger(this.input, {
      down: p => this.onDown(p),
      up: () => this.onUp(),
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    const told = this.rules.tick(delta)
    if (told === 'pop') this.popCore()
    if (told) this.say(told)
    if (told === 'bruise') this.flinch()
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    if (this.rules.phase === 'dab' && !this.dabbing) {
      this.dabbing = true
      setInstruction(this.instruction, t('acneDab'))
    }
    this.drawSpots()
    this.moveDemo()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** Each blemish as it stands, and the ring round the held one: filling to the pop, then running down through the grace. */
  private drawSpots(): void {
    const g = this.spots.clear()
    const local = (s: AcneSpot) => ({ x: ACNE_AT[s.at].x - FACE.x, y: ACNE_AT[s.at].y - FACE.y })
    for (const s of this.rules.spots) {
      const p = local(s)
      if (s.state === 'whole' && s.kind === 'white') {
        g.fillStyle(hex(C.lotus), 1).fillCircle(p.x, p.y, SPOT.white).lineStyle(3, hex(C.lotusDark)).strokeCircle(p.x, p.y, SPOT.white)
        g.fillStyle(hex(C.cloud), 1).fillCircle(p.x, p.y - 2, SPOT.core)
      } else if (s.state === 'whole') {
        g.fillStyle(hex(C.lantern), 0.85).fillCircle(p.x, p.y, SPOT.red).lineStyle(3, hex(C.lanternDark)).strokeCircle(p.x, p.y, SPOT.red)
      } else if (s.state === 'angry') {
        g.fillStyle(hex(C.lotus), 0.6).fillCircle(p.x, p.y, SPOT.angry).fillStyle(hex(C.lanternDark), 1).fillCircle(p.x, p.y, SPOT.red)
      } else {
        g.fillStyle(hex(s.state === 'bruised' ? C.berry : C.lotus), s.state === 'bruised' ? 0.9 : 0.6).fillCircle(p.x, p.y, s.state === 'bruised' ? SPOT.bruise : SPOT.mark)
        if (s.dabbed) g.fillStyle(hex(C.mint), 0.85).fillCircle(p.x, p.y, SPOT.gel).lineStyle(3, hex(C.mintTeal)).strokeCircle(p.x, p.y, SPOT.gel)
      }
    }
    if (this.rules.held === null) return
    const p = local(this.rules.spots[this.rules.held])
    const ms = this.rules.heldMs
    g.lineStyle(RING.w, hex(C.tileSeam), 1).strokeCircle(p.x, p.y, RING.r)
    if (ms < ACNE_POP_MS) {
      g.lineStyle(RING.w, hex(C.teal), 1).beginPath().arc(p.x, p.y, RING.r, ringAngle(0), ringAngle(ms / ACNE_POP_MS)).strokePath()
    } else {
      const grace = this.params.hard ? ACNE_LIFT_MS_HARD : ACNE_LIFT_MS
      const left = Math.max(0, 1 - (ms - ACNE_POP_MS) / grace)
      g.lineStyle(RING.w, hex(C.lantern), 1).beginPath().arc(p.x, p.y, RING.r, ringAngle(0), ringAngle(left)).strokePath()
    }
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    this.hideDemo()
    const result = this.rules.press(p.x, p.y)
    if (result === 'red') {
      this.say('red')
      this.flinch()
    } else if (result === 'dab') this.say('dab')
  }

  private onUp(): void {
    this.rules.release()
  }

  /** A little white core jumps out of the held spot and fades. */
  private popCore(): void {
    const held = this.rules.held
    if (held === null) return
    const at = ACNE_AT[this.rules.spots[held].at]
    const core = this.add.circle(at.x, at.y - 4, SPOT.core, hex(C.cloud)).setStrokeStyle(3, hex(C.ink)).setDepth(DEPTH.word)
    this.tweens.add({ targets: core, y: at.y - CORE.risePx, alpha: 0, duration: CORE.ms, ease: 'Quad.easeOut', onComplete: () => core.destroy() })
  }

  private say(what: 'pop' | 'bruise' | 'red' | 'dab'): void {
    const { key, color } = WORDS[what]
    const word = this.add.text(WORD.x, WORD.y, t(key), textStyle(WORD.size, '800', color)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    this.tweens.add({ targets: word, y: word.y - WORD.risePx, alpha: 0, duration: WORD.ms, ease: 'Quad.easeOut', onComplete: () => word.destroy() })
  }

  private flinch(): void {
    this.tweens.killTweensOf(this.face)
    // the ease swings out and back and ends where it began
    this.tweens.add({
      targets: this.face,
      x: FACE.x + FLINCH.px,
      duration: FLINCH.ms,
      ease: (k: number) => Math.sin(k * Math.PI * 2 * FLINCH.swings) * (1 - k),
      onComplete: () => this.face.setX(FACE.x),
    })
  }

  /** The hand presses down over and over on the first whitehead still whole, or while dabbing on the first spot not dabbed. */
  private showDemo(): void {
    // the fingertip is at the bottom centre of the texture
    this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand).setVisible(false)
    this.tweens.add({ targets: this.press, k: 1, duration: DEMO.dipMs, yoyo: true, hold: DEMO.holdMs, repeat: -1, repeatDelay: DEMO.pauseMs, ease: 'Quad.easeIn' })
  }

  private moveDemo(): void {
    if (!this.demoHand) return
    const target = this.rules.spots.find(s => s.kind === 'white' && (this.rules.phase === 'pop' ? s.state === 'whole' : !s.dabbed))
    this.demoHand.setVisible(target !== undefined)
    if (!target) return
    const at = ACNE_AT[target.at]
    this.demoHand.setPosition(at.x, at.y - DEMO.hoverPx * (1 - this.press.k)).setScale(Phaser.Math.Linear(1, DEMO.pressScale, this.press.k))
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
    this.drawSpots()
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / ACNE_LIMIT_MS)
  }
}
