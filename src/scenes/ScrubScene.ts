import * as Phaser from 'phaser'
import { MS_ORIGIN } from '../art/massageArt'
import { C, customerColors } from '../art/palette'
import { SCRUB_LIMIT_MS, SCRUB_PATCH_R, SCRUB_RING_R } from '../config'
import type { Stars } from '../sim/economy'
import { ScrubGame, type ScrubSpot } from '../sim/scrub'
import { t } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'

/** The back centre on the card, where MassageScene puts it; the rules work in pixels from here. */
const BACK = { x: 540, y: 1090 }
const TURN = 2 * Math.PI
/** The salt thins as turns are counted on the patch. */
const SALT_ALPHA = [1, 0.62, 0.3]
/** The dashed ring the finger circles, and the turn under way drawn over it. */
const RING = { w: 5, dash: 16, alpha: 0.45, arcInk: 22, arcW: 13 }
/** A cream ring grows from the patch and fades each time a turn is counted. */
const POP = { ms: 350, growPx: 40, w: 8 }
/** The speed meter above the patch: a box, a coloured arc to 1.6 times the cap, and a needle. */
const METER = { dy: -178, w: 152, h: 86, boxTop: -52, radius: 22, arcR: 48, arcDy: 16, arcW: 12, needleW: 6, hubR: 8, ink: 4, maxOfCap: 1.6, flashMs: 700 }
/** "Rát quá!" rises from under the patch. */
const WORD = { size: 60, stroke: 12, startDy: 70, risePx: 80, ms: 600 }
const DEMO = { alpha: 0.6, radius: 110, turnsPerS: 1.2 }
const DEPTH = { word: 10, hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** Close-up Chà muối biển mini-game over the frozen spa: circle a finger round each salt patch, slowly enough that the customer does not cry out. */
export class ScrubScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: ScrubGame
  private salt!: Phaser.GameObjects.Image
  private ringG!: Phaser.GameObjects.Graphics
  private live!: Phaser.GameObjects.Graphics
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** Game time in ms, for the pop and the flash. */
  private now = 0
  private seenTurns = 0
  private seenBurns = 0
  private popAt = -Infinity
  private popSpot: ScrubSpot | null = null
  private flashAt = -Infinity
  /** The patch drawn last frame. */
  private shown = -1
  private demoHand: Phaser.GameObjects.Image | null = null
  private demoMs = 0

  constructor() {
    super('ScrubScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the scrub takes no day-ease time
    this.rules = new ScrubGame(this.params.hard)
    this.revealed = false
    this.now = 0
    this.seenTurns = 0
    this.seenBurns = 0
    this.popAt = -Infinity
    this.popSpot = null
    this.flashAt = -Infinity
    this.shown = -1
    this.demoHand = null
    this.demoMs = 0

    const colors = customerColors(this.params.look, this.params.kind)
    this.instruction = addMiniGameCard(this, t('scrubTurn'))
    const o = MS_ORIGIN
    this.add.image(BACK.x, BACK.y, 'ms-bed').setOrigin(o.bed.x, o.bed.y)
    this.add.image(BACK.x, BACK.y, 'ms-back').setOrigin(o.back.x, o.back.y).setTint(colors.skin)
    this.add.image(BACK.x, BACK.y, 'ms-back-line').setOrigin(o.back.x, o.back.y)
    this.add.image(BACK.x, BACK.y, 'ms-hair').setOrigin(o.hair.x, o.hair.y).setTint(colors.hair)
    this.add.image(BACK.x, BACK.y, 'ms-hair-line').setOrigin(o.hair.x, o.hair.y)
    this.salt = this.add.image(0, 0, 'scrub-salt')
    this.ringG = this.add.graphics()
    this.live = this.add.graphics()
    this.bars = this.add.graphics()
    // the fingertip is at the bottom centre of the texture
    if (this.params.demo) this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand)

    oneFinger(this.input, {
      down: p => {
        if (this.revealed) return
        this.hideDemo()
        this.rules.down(p.x - BACK.x, p.y - BACK.y)
      },
      move: p => {
        if (!this.revealed && p.isDown) this.rules.move(p.x - BACK.x, p.y - BACK.y)
      },
      up: () => this.rules.up(),
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.now += delta
    this.rules.tick(delta)
    this.noticeEvents()
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.drawPatch(this.rules.spot()!)
    this.moveDemo(delta)
    drawBars(this.bars, this.rules.progress(), 1 - this.rules.elapsedMs / SCRUB_LIMIT_MS)
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** A counted turn starts the pop ring where it was counted; a cry flashes the meter and floats its word. */
  private noticeEvents(): void {
    const { turns, burns, index, spots } = this.rules
    if (turns > this.seenTurns) {
      this.seenTurns = turns
      this.popAt = this.now
      // the patch drawn last frame, as a turn that cleans a patch has already moved on to the next
      this.popSpot = spots[this.shown] ?? spots[index]
    }
    if (burns > this.seenBurns) {
      this.seenBurns = burns
      this.flashAt = this.now
      const s = spots[index]
      if (s) this.floatWord(BACK.x + s.x, BACK.y + s.y + WORD.startDy)
    }
  }

  private floatWord(x: number, y: number): void {
    const word = this.add.text(x, y, t('scrubBurn'), textStyle(WORD.size, '800', C.lantern)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    this.tweens.add({
      targets: word,
      y: { value: word.y - WORD.risePx, ease: 'Quad.easeOut' },
      alpha: { value: 0, ease: 'Cubic.easeIn' },
      duration: WORD.ms,
      onComplete: () => word.destroy(),
    })
  }

  /** The salt, its ring, the turn under way, the pop and the meter, all at the patch being scrubbed. */
  private drawPatch(s: ScrubSpot): void {
    const [x, y] = [BACK.x + s.x, BACK.y + s.y]
    if (this.rules.index !== this.shown) {
      this.shown = this.rules.index
      this.drawRing(x, y)
    }
    this.salt.setPosition(x, y).setAlpha(SALT_ALPHA[this.rules.steps])
    const g = this.live.clear()
    const k = Math.min(1, Math.abs(this.rules.acc) / TURN)
    if (k > 0.01) {
      const top = -Math.PI / 2
      const anti = this.rules.acc < 0
      const end = top + (anti ? -1 : 1) * k * TURN * 0.999
      for (const [w, c] of [[RING.arcInk, C.ink], [RING.arcW, C.teal]] as const) {
        g.lineStyle(w, hex(c)).beginPath().arc(x, y, SCRUB_RING_R, top, end, anti).strokePath()
      }
    }
    const since = this.now - this.popAt
    if (since < POP.ms && this.popSpot) {
      const left = 1 - since / POP.ms
      g.lineStyle(POP.w, hex(C.cream), left).strokeCircle(BACK.x + this.popSpot.x, BACK.y + this.popSpot.y, SCRUB_PATCH_R + POP.growPx * (1 - left))
    }
    this.drawMeter(g, x, y + METER.dy)
  }

  /** The dashed ring, drawn again only when the patch changes. */
  private drawRing(x: number, y: number): void {
    const g = this.ringG.clear().lineStyle(RING.w, hex(C.tealDark), RING.alpha)
    const step = (2 * RING.dash) / SCRUB_RING_R
    for (let a = 0; a < TURN; a += step) g.beginPath().arc(x, y, SCRUB_RING_R, a, a + RING.dash / SCRUB_RING_R).strokePath()
  }

  /** A half-dial: teal up to the cap, lantern red past it, an ink needle at the speed now; pale red while the customer is crying out. */
  private drawMeter(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const { cap, speed, armed } = this.rules
    const hot = this.now - this.flashAt < METER.flashMs || !armed
    const max = cap * METER.maxOfCap
    const cy = y + METER.arcDy
    g.fillStyle(hex(hot ? C.burnPale : C.cream), 1).fillRoundedRect(x - METER.w / 2, y + METER.boxTop, METER.w, METER.h, METER.radius)
    g.lineStyle(METER.ink, hex(C.ink)).strokeRoundedRect(x - METER.w / 2, y + METER.boxTop, METER.w, METER.h, METER.radius)
    const at = (share: number) => Math.PI + Math.min(1, share) * Math.PI
    g.lineStyle(METER.arcW, hex(C.teal)).beginPath().arc(x, cy, METER.arcR, at(0), at(cap / max)).strokePath()
    g.lineStyle(METER.arcW, hex(C.lantern)).beginPath().arc(x, cy, METER.arcR, at(cap / max), at(1)).strokePath()
    const n = at(speed / max)
    const tip = METER.arcR - METER.ink
    g.lineStyle(METER.needleW, hex(C.ink)).beginPath().moveTo(x, cy).lineTo(x + Math.cos(n) * tip, cy + Math.sin(n) * tip).strokePath()
    g.fillStyle(hex(C.ink), 1).fillCircle(x, cy, METER.hubR)
  }

  /** The hand's fingertip circles the current patch until the first touch. */
  private moveDemo(delta: number): void {
    const s = this.rules.spot()
    if (!this.demoHand || !s) return
    this.demoMs += delta
    const a = (this.demoMs / 1000) * DEMO.turnsPerS * TURN
    this.demoHand.setPosition(BACK.x + s.x + DEMO.radius * Math.cos(a), BACK.y + s.y + DEMO.radius * Math.sin(a))
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.demoHand.destroy()
    this.demoHand = null
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.hideDemo()
    this.salt.setVisible(false)
    this.ringG.clear()
    this.live.clear()
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.rules.progress(), 1 - this.rules.elapsedMs / SCRUB_LIMIT_MS)
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }
}
