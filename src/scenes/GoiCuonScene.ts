import * as Phaser from 'phaser'
import { GC_BOX, GC_PAPER, GC_WATER } from '../art/goiCuonArt'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GC_ROLLS } from '../config'
import type { Stars } from '../sim/economy'
import { GoiCuonGame, type DipResult, type GcPart, type GoiCuonPhase, type GoiCuonTicket, type RollResult } from '../sim/goiCuon'
import { t, type StringKey } from '../strings/vi'
import { addPills, addTicket, type CookData } from '../view/cook'
import { HandPointer } from '../view/HandPointer'
import { addMiniGameCard, drawBars, revealStars, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

type Station = Exclude<GoiCuonPhase, 'done'>
const STATIONS: Station[] = ['dip', 'fill', 'roll']
const INSTRUCTION: Record<Station, StringKey> = { dip: 'gcDip', fill: 'gcFill', roll: 'gcRoll' }
const STEP: Record<Station, StringKey> = { dip: 'gcStepDip', fill: 'gcStepFill', roll: 'gcStepRoll' }
/** The first game's lesson line for each station. */
const LESSON: Record<Station, StringKey> = { dip: 'gcLearnDip', fill: 'gcLearnFill', roll: 'gcLearnRoll' }
/** The part buttons in a row under the board, each with its picture (shrimp and pork are Bánh xèo's, greens Bún chả's); Xong to the board's right. */
const PARTS: { id: GcPart; key: StringKey; texture: string; x: number }[] = [
  { id: 'tom', key: 'gcTomTap', texture: 'bx-tom', x: 180 },
  { id: 'thit', key: 'gcThitTap', texture: 'bx-thit', x: 400 },
  { id: 'bun', key: 'gcBunTap', texture: 'gc-bun', x: 620 },
  { id: 'rau', key: 'gcRauTap', texture: 'bc-rau', x: 840 },
]
const PART_BTN = { y: 1500, w: 205, h: 110, iconDx: -62, textDx: 30, textW: 120, size: 36 }
const DONE = { x: 880, y: 1330, w: 240, h: 120 }
/** The fill lesson's box stops this far left of the Xong button. */
const LESSON_GAP = 20
/** The rice paper's look: dry it is stiff cream with a woven mark; dipped it is pale and see-through. */
const PAPER = { dryR: 125, dryX: 300, ink: 4, wetAlpha: 0.75 }
/** Where a swipe counts: the dip starts on the water; a roll anywhere over the board. */
const BOARD_AREA = { left: 110, right: 970, top: 820, bottom: 1380 }
/** The roll as it grows: a log this tall and this much wider than half the paper, the paper shrinking above it. */
const LOG = { h: 110, halfW: 250, shrink: 0.8 }
const TRAIL_W = 12
/** A word rises from where it is said and fades; a long line is scaled down to fit the card. */
const WORD = { size: 60, stroke: 12, risePx: 80, ms: 700, x: 540, y: 870, maxW: 880 }
/** The last move of a step stays on screen this long before the next station. */
const STATION_DELAY_MS = 700
const DEPTH = { paper: 5, word: 10 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

const DIP_WORD: Record<DipResult, { key: StringKey; color: string }> = {
  in: { key: 'gcDipIn', color: C.teal },
  fast: { key: 'gcDipFast', color: C.lantern },
  slow: { key: 'gcDipSlow', color: C.lantern },
}
const ROLL_WORD: Record<RollResult, { key: StringKey; color: string }> = {
  tight: { key: 'gcRollTight', color: C.teal },
  loose: { key: 'gcRollLoose', color: C.lantern },
}

/** Cooking Gỏi cuốn over the frozen shops: draw the rice paper through the water at an even pace, lay the ticket's fillings, and roll it up with long upward swipes. */
export class GoiCuonScene extends Phaser.Scene {
  private params!: CookData<GoiCuonTicket>
  private rules!: GoiCuonGame
  /** The rules' phase as last seen, and the station on the card, which follows it after a short pause. */
  private phase: GoiCuonPhase = 'dip'
  private shown: Station = 'dip'
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private drawPills!: (at: number) => void
  /** The lesson's hand, only in the first Gỏi cuốn. */
  private hand: HandPointer | null = null
  /** Everything of the station on the card, and its buttons, which go at the reveal. */
  private station: Phaser.GameObjects.GameObject[] = []
  private buttons: Phaser.GameObjects.GameObject[] = []
  private paper: Phaser.GameObjects.Graphics | null = null
  private trail: Phaser.GameObjects.Graphics | null = null
  /** The fillings laid on the paper, kept to lay them again on the next station, and their pictures there. */
  private bits: { texture: string; x: number; y: number; rotation: number }[] = []
  private bitImages: Phaser.GameObjects.Image[] = []
  /** The swipe under way: its points and when it began. */
  private swipe: { pts: { x: number; y: number }[]; at: number } | null = null
  private revealed = false

  constructor() {
    super('GoiCuonScene')
  }

  init(data: CookData<GoiCuonTicket>) {
    this.params = data
  }

  create() {
    this.rules = new GoiCuonGame(this.params.ticket, this.params.hard)
    this.phase = 'dip'
    this.station = []
    this.buttons = []
    this.bits = []
    this.bitImages = []
    this.swipe = null
    this.revealed = false

    this.instruction = addMiniGameCard(this, t('gcDip'))
    addTicket(this, 'goiCuon', this.params.ticket)
    this.drawPills = addPills(this, STATIONS.map(s => t(STEP[s])))
    this.hand = this.params.demo ? new HandPointer(this) : null
    this.bars = this.add.graphics()
    this.showStation('dip')

    oneFinger(this.input, {
      down: p => this.onDown(p),
      move: p => this.onMove(p),
      up: () => this.onUp(),
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.rules.tick(delta)
    if (this.rules.phase !== this.phase) this.enterPhase(this.rules.phase)
    if (this.revealed) return
    this.pointLesson()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a roll. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The first game's hand: this station's line, pointing at its target; nowhere to point (between stations or mid-swipe) hides it. */
  private pointLesson(): void {
    if (!this.hand) return
    const spot = this.rules.phase === this.shown && !this.swipe ? this.lessonSpot() : null
    if (spot) this.hand.show(t(LESSON[this.shown]), spot.x, spot.y, 'down', this.shown === 'fill' ? { boxRight: DONE.x - DONE.w / 2 - LESSON_GAP } : {})
    else this.hand.hide()
  }

  /** The dry paper at the water's left for the dip, the shrimp button's top for the fillings, the paper's bottom for the roll. */
  private lessonSpot(): { x: number; y: number } {
    if (this.shown === 'dip') return { x: PAPER.dryX, y: GC_WATER.y - PAPER.dryR / 2 }
    if (this.shown === 'fill') return { x: PARTS[0].x, y: PART_BTN.y - PART_BTN.h / 2 }
    return { x: GC_PAPER.x, y: GC_PAPER.y + GC_PAPER.r - 40 }
  }

  /** Clears the card's middle and lays out this step's station. */
  private showStation(s: Station): void {
    for (const o of this.station) o.destroy()
    this.station = []
    this.buttons = []
    this.bitImages = []
    this.paper = this.trail = null
    this.shown = s
    setInstruction(this.instruction, t(INSTRUCTION[s]))
    this.drawPills(STATIONS.indexOf(s))
    const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.station.push(o)
      return o
    }

    if (s === 'dip') {
      keep(this.add.image(GC_BOX.basin[0], GC_BOX.basin[1], 'gc-basin').setOrigin(0))
      this.paper = keep(this.add.graphics().setDepth(DEPTH.paper))
      this.drawDryPaper(PAPER.dryX, GC_WATER.y)
      this.trail = keep(this.add.graphics().setDepth(DEPTH.paper + 1))
      return
    }
    keep(this.add.image(GC_BOX.board[0], GC_BOX.board[1], 'gc-board').setOrigin(0))
    this.paper = keep(this.add.graphics())
    this.drawWetPaper(0)
    for (const bit of this.bits) this.bitImages.push(keep(this.add.image(bit.x, bit.y, bit.texture).setRotation(bit.rotation)))
    if (s === 'fill') {
      for (const part of PARTS) {
        const button = addButton(this, part.x, PART_BTN.y, PART_BTN.w, PART_BTN.h, t(part.key), 'plain', () => this.addPart(part.id, part.texture, text, keep), PART_BTN.size)
        const text = (button.list[1] as Phaser.GameObjects.Text).setX(PART_BTN.textDx)
        button.add(this.add.image(PART_BTN.iconDx, 0, part.texture).setScale(0.85))
        this.buttons.push(keep(button))
      }
      this.buttons.push(keep(addButton(this, DONE.x, DONE.y, DONE.w, DONE.h, t('bxDone'), 'primary', () => this.rules.doneFilling())))
    } else {
      this.trail = keep(this.add.graphics())
    }
  }

  private enterPhase(next: GoiCuonPhase): void {
    this.phase = next
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.time.delayedCall(STATION_DELAY_MS, () => {
      if (!this.revealed) this.showStation(next)
    })
  }

  /** The dry rice paper at (x, y): stiff cream with its woven cross-hatch. */
  private drawDryPaper(x: number, y: number): void {
    const g = this.paper?.clear()
    if (!g) return
    g.fillStyle(hex(C.cream), 1).fillCircle(x, y, PAPER.dryR).lineStyle(PAPER.ink, hex(C.ink)).strokeCircle(x, y, PAPER.dryR)
    g.lineStyle(2, hex(C.tileSeam), 1)
    for (let d = -PAPER.dryR + 25; d < PAPER.dryR; d += 25) {
      const half = Math.sqrt(PAPER.dryR * PAPER.dryR - d * d)
      g.lineBetween(x - half, y + d, x + half, y + d)
      g.lineBetween(x + d, y - half, x + d, y + half)
    }
  }

  /** The soft paper on the board after `rolls` rolls: it shrinks up from its bottom into the log under it. */
  private drawWetPaper(rolls: number): void {
    const g = this.paper?.clear()
    if (!g) return
    const k = (rolls / GC_ROLLS) * LOG.shrink
    const top = GC_PAPER.y - GC_PAPER.r
    const ry = GC_PAPER.r * (1 - k)
    g.fillStyle(hex(C.paper), PAPER.wetAlpha).fillEllipse(GC_PAPER.x, top + ry, GC_PAPER.r * 2, ry * 2)
    g.lineStyle(PAPER.ink, hex(C.ink), 0.7).strokeEllipse(GC_PAPER.x, top + ry, GC_PAPER.r * 2, ry * 2)
    if (rolls === 0) return
    const logY = top + ry * 2 - LOG.h / 2
    g.fillStyle(hex(C.cream), 1).fillRoundedRect(GC_PAPER.x - LOG.halfW, logY - LOG.h / 2, LOG.halfW * 2, LOG.h, LOG.h / 2)
    g.fillStyle(hex(C.lotus), 0.8)
    for (const dx of [-150, -50, 50, 150]) g.fillEllipse(GC_PAPER.x + dx, logY, 54, 36)
    g.lineStyle(6, hex(C.leafLight), 0.9).lineBetween(GC_PAPER.x - LOG.halfW + 40, logY + 22, GC_PAPER.x + LOG.halfW - 40, logY + 22)
    g.lineStyle(PAPER.ink, hex(C.ink)).strokeRoundedRect(GC_PAPER.x - LOG.halfW, logY - LOG.h / 2, LOG.halfW * 2, LOG.h, LOG.h / 2)
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed || this.rules.phase !== this.shown) return
    const onWater = this.shown === 'dip' && Math.abs(p.x - GC_WATER.x) <= GC_WATER.rx + 40 && Math.abs(p.y - GC_WATER.y) <= GC_WATER.ry + 40
    const onBoard = this.shown === 'roll' && p.x >= BOARD_AREA.left && p.x <= BOARD_AREA.right && p.y >= BOARD_AREA.top && p.y <= BOARD_AREA.bottom
    if (onWater || onBoard) this.swipe = { pts: [{ x: p.x, y: p.y }], at: this.time.now }
  }

  /** The dry paper follows the finger through the water; a roll's swipe leaves a trail. */
  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.swipe) return
    this.swipe.pts.push({ x: p.x, y: p.y })
    if (this.shown === 'dip') this.drawDryPaper(p.x, p.y)
    this.trail?.clear().lineStyle(TRAIL_W, hex(C.cloud), 0.8).strokePoints(this.swipe.pts.map(q => new Phaser.Math.Vector2(q.x, q.y)))
  }

  /** On lift the stroke is judged: the dip by how long it took to cross, a roll by how far up it went. */
  private onUp(): void {
    const swipe = this.swipe
    this.swipe = null
    this.trail?.clear()
    if (!swipe || this.revealed || this.rules.phase !== this.shown) return
    const xs = swipe.pts.map(q => q.x)
    const first = swipe.pts[0]
    const last = swipe.pts[swipe.pts.length - 1]
    if (this.shown === 'dip') {
      const result = this.rules.dip(Math.max(...xs) - Math.min(...xs), this.time.now - swipe.at)
      if (result === 'short') {
        this.drawDryPaper(PAPER.dryX, GC_WATER.y)
        this.floatWord(t('gcDipShort'), C.lantern)
      } else if (result) {
        sound.play('foam')
        this.paper?.clear()
        this.floatWord(t(DIP_WORD[result].key), DIP_WORD[result].color)
      }
      return
    }
    const result = this.rules.roll(last.x - first.x, first.y - last.y)
    if (!result) return
    sound.play('thud')
    for (const image of this.bitImages) image.setVisible(false)
    this.drawWetPaper(this.rules.rolls.length)
    this.floatWord(t(ROLL_WORD[result].key), ROLL_WORD[result].color)
  }

  /** A part goes onto the band near the paper's bottom, where a roll starts. */
  private addPart(id: GcPart, texture: string, text: Phaser.GameObjects.Text, keep: <T extends Phaser.GameObjects.GameObject>(o: T) => T): void {
    if (this.revealed || this.rules.phase !== 'fill') return
    this.rules.add(id)
    const name = PARTS.find(p => p.id === id)!.key
    text.setText(t('phoCount', { name: t(name), n: this.rules.counts[id] })).setScale(1)
    text.setScale(Math.min(1, PART_BTN.textW / text.width))
    const bit = { texture, x: GC_PAPER.x + (Math.random() * 2 - 1) * GC_PAPER.bandHalf, y: GC_PAPER.bandY + (Math.random() * 2 - 1) * 24, rotation: (Math.random() - 0.5) * 0.8 }
    this.bits.push(bit)
    const image = keep(this.add.image(bit.x, bit.y, texture).setScale(0).setRotation(bit.rotation))
    this.bitImages.push(image)
    this.tweens.add({ targets: image, scale: 1, duration: 180, ease: 'Back.easeOut' })
  }

  private floatWord(words: string, colour: string): void {
    const word = this.add.text(WORD.x, WORD.y, words, textStyle(WORD.size, '800', colour)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    word.setScale(Math.min(1, WORD.maxW / word.width))
    this.tweens.add({ targets: word, y: { value: word.y - WORD.risePx, ease: 'Quad.easeOut' }, alpha: { value: 0, ease: 'Quad.easeIn' }, duration: WORD.ms, onComplete: () => word.destroy() })
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.swipe = null
    this.trail?.clear()
    for (const b of this.buttons) b.destroy()
    this.buttons = []
    this.hand?.hide()
    this.drawPills(STATIONS.length)
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
