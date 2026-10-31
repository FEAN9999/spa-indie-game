import * as Phaser from 'phaser'
import { PHO_BOX, PHO_BROTH, PHO_DIAL, PHO_LINES } from '../art/phoArt'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_W, PHO_CUT_X } from '../config'
import type { Stars } from '../sim/economy'
import { boilBand, PhoGame, type PhoPhase, type PhoTicket, type Topping } from '../sim/pho'
import { t, type StringKey } from '../strings/vi'
import { addPills, addTicket, type CookData } from '../view/cook'
import { HandPointer } from '../view/HandPointer'
import { addMiniGameCard, drawBars, revealStars, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

type Station = Exclude<PhoPhase, 'done'>
const STATIONS: Station[] = ['cut', 'boil', 'top']
const INSTRUCTION: Record<Station, StringKey> = { cut: 'phoCut', boil: 'phoBoil', top: 'phoTop' }
const STEP: Record<Station, StringKey> = { cut: 'phoStepCut', boil: 'phoStepBoil', top: 'phoStepTop' }
/** The first game's lesson line for each station. */
const LESSON: Record<Station, StringKey> = { cut: 'phoLearnCut', boil: 'phoLearnBoil', top: 'phoLearnTop' }
/** The board's area a swipe must start in, and the beef's top and bottom, where a cut's ink line runs. */
const BOARD = { left: 130, right: 950, top: 810, bottom: 1470 }
const BEEF = { top: 940, bottom: 1340 }
const CUT_LINE_W = 8
const TRAIL_W = 12
/** The hold button under the pot, the needle over the dial, and the bubbles rising from the pot while it is held. */
const HOLD = { x: 540, y: 1530, w: 520, h: 120 }
const NEEDLE = { w: 120, h: 22, ink: 4 }
const BUBBLE = { everyMs: 70, left: 220, right: 620, y: 1120, r: [8, 16], risePx: 120, ms: 600, wobblePx: 4, wobblePerMs: 0.03 }
/** The topping buttons in a row under the bowl, each with its picture, and the serve button under them. */
const TOPPINGS: { id: Topping; key: StringKey; x: number }[] = [
  { id: 'onion', key: 'phoOnion', x: 250 },
  { id: 'chili', key: 'phoChiliTap', x: 540 },
  { id: 'herb', key: 'phoHerb', x: 830 },
]
const TOPPING_BTN = { y: 1370, w: 260, h: 110, iconDx: -80, textDx: 28, size: 40 }
const SERVE = { x: 540, y: 1520, w: 440, h: 120 }
/** The beef slices on the broth, tinted to the doneness. */
const SLICES = [[400, 930], [490, 948], [580, 930], [670, 948]]
const DONENESS_TINT = { tai: 0xf0a090, chin: 0xa0705a }
/** A word rises from where it is said and fades; a long line is scaled down to fit the card. */
const WORD = { size: 60, stroke: 12, risePx: 80, ms: 700, y: 870, minX: 280, maxX: 800, boilX: 420, maxW: 880 }
/** The last move of a step stays on screen this long before the next station. */
const STATION_DELAY_MS = 700
const DEPTH = { word: 10 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** Cooking Phở over the frozen shops: cut the beef along four dotted lines, hold the boil into the ticket's band, top the bowl to the ticket and serve. */
export class PhoScene extends Phaser.Scene {
  private params!: CookData<PhoTicket>
  private rules!: PhoGame
  /** The rules' phase as last seen, and the station on the card, which follows it after a short pause. */
  private phase: PhoPhase = 'cut'
  private shown: Station = 'cut'
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private drawPills!: (at: number) => void
  /** The lesson's hand, only in the first Phở. */
  private hand: HandPointer | null = null
  /** Everything of the station on the card, and its buttons, which go at the reveal. */
  private station: Phaser.GameObjects.GameObject[] = []
  private buttons: Phaser.GameObjects.GameObject[] = []
  /** The swipe under way on the board, as its points. */
  private swipe: { x: number; y: number }[] | null = null
  private trail: Phaser.GameObjects.Graphics | null = null
  private cuts: Phaser.GameObjects.Graphics | null = null
  private pot: Phaser.GameObjects.Image | null = null
  private needle: Phaser.GameObjects.Graphics | null = null
  private holdButton: Phaser.GameObjects.Container | null = null
  private held = false
  private bubbleMs = 0
  private revealed = false

  constructor() {
    super('PhoScene')
  }

  init(data: CookData<PhoTicket>) {
    this.params = data
  }

  create() {
    this.rules = new PhoGame(this.params.ticket, this.params.hard)
    this.phase = 'cut'
    this.station = []
    this.buttons = []
    this.swipe = null
    this.held = false
    this.bubbleMs = 0
    this.revealed = false

    this.instruction = addMiniGameCard(this, t('phoCut'))
    addTicket(this, 'pho', this.params.ticket)
    this.drawPills = addPills(this, STATIONS.map(s => t(STEP[s])))
    this.hand = this.params.demo ? new HandPointer(this) : null
    this.bars = this.add.graphics()
    this.showStation('cut')

    oneFinger(this.input, {
      down: (p, over) => this.onDown(p, over),
      move: p => this.onMove(p),
      up: () => this.onUp(),
    })
  }

  update(time: number, delta: number) {
    if (this.revealed) return
    if (this.held && this.shown === 'boil') this.rules.hold(delta)
    this.rules.tick(delta)
    if (this.rules.phase !== this.phase) this.enterPhase(this.rules.phase)
    if (this.revealed) return
    if (this.shown === 'boil') this.updateBoil(time, delta)
    this.pointLesson()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a bowl. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The first game's hand: this station's line, pointing at its target; nowhere to point (between stations) hides it. */
  private pointLesson(): void {
    if (!this.hand) return
    const spot = this.lessonSpot()
    if (spot) this.hand.show(t(LESSON[this.shown]), spot.x, spot.y, 'down')
    else this.hand.hide()
  }

  /** The first uncut line's top for the cut, the hold button's top for the boil, the onion button's top for the toppings. */
  private lessonSpot(): { x: number; y: number } | null {
    if (this.shown === 'cut') {
      const next = this.rules.cutsDone.indexOf(false)
      return next < 0 ? null : { x: PHO_CUT_X[next], y: PHO_LINES.top }
    }
    if (this.rules.phase !== this.shown) return null
    if (this.shown === 'boil') return { x: HOLD.x, y: HOLD.y - HOLD.h / 2 }
    return { x: TOPPINGS[0].x, y: TOPPING_BTN.y - TOPPING_BTN.h / 2 }
  }

  /** Clears the card's middle and lays out this step's station. */
  private showStation(s: Station): void {
    for (const o of this.station) o.destroy()
    this.station = []
    this.buttons = []
    this.trail = this.cuts = this.needle = null
    this.pot = this.holdButton = null
    this.shown = s
    setInstruction(this.instruction, t(INSTRUCTION[s]))
    this.drawPills(STATIONS.indexOf(s))
    const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.station.push(o)
      return o
    }

    if (s === 'cut') {
      keep(this.add.image(PHO_BOX.board[0], PHO_BOX.board[1], 'pho-board').setOrigin(0))
      this.cuts = keep(this.add.graphics())
      this.trail = keep(this.add.graphics())
    } else if (s === 'boil') {
      this.pot = keep(this.add.image(PHO_BOX.pot[0], PHO_BOX.pot[1], 'pho-pot').setOrigin(0))
      keep(this.add.image(PHO_BOX.dial[0], PHO_BOX.dial[1], 'pho-dial').setOrigin(0))
      const [lo, hi] = boilBand(this.params.ticket, this.params.hard)
      const band = keep(this.add.graphics()).fillStyle(hex(C.mustard), 1)
      band.fillRect(PHO_DIAL.x - PHO_DIAL.inner, this.dialY(hi), PHO_DIAL.inner * 2, this.dialY(lo) - this.dialY(hi))
      this.needle = keep(this.add.graphics())
      const bg = this.add
        .graphics()
        .fillStyle(hex(C.teal), 1)
        .fillRoundedRect(-HOLD.w / 2, -HOLD.h / 2, HOLD.w, HOLD.h, HOLD.h / 2)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(-HOLD.w / 2, -HOLD.h / 2, HOLD.w, HOLD.h, HOLD.h / 2)
      const label = this.add.text(0, 0, t('phoHold'), textStyle(56, '800', C.paper)).setOrigin(0.5)
      this.holdButton = keep(this.add.container(HOLD.x, HOLD.y, [bg, label]).setSize(HOLD.w, HOLD.h).setInteractive())
      this.buttons.push(this.holdButton)
    } else {
      keep(this.add.image(PHO_BOX.bowl[0], PHO_BOX.bowl[1], 'pho-bowl').setOrigin(0))
      for (const [x, y] of SLICES) keep(this.add.image(x, y, 'pho-beef').setTint(DONENESS_TINT[this.params.ticket.doneness]))
      for (const tp of TOPPINGS) {
        const button = addButton(this, tp.x, TOPPING_BTN.y, TOPPING_BTN.w, TOPPING_BTN.h, t(tp.key), 'plain', () => this.addTopping(tp.id, text), TOPPING_BTN.size)
        const text = (button.list[1] as Phaser.GameObjects.Text).setX(TOPPING_BTN.textDx)
        button.add(this.add.image(TOPPING_BTN.iconDx, 0, `pho-${tp.id}`))
        this.buttons.push(keep(button))
      }
      this.buttons.push(keep(addButton(this, SERVE.x, SERVE.y, SERVE.w, SERVE.h, t('phoServe'), 'primary', () => this.rules.serve())))
    }
  }

  private enterPhase(next: PhoPhase): void {
    const from = this.phase
    this.phase = next
    this.held = false
    // a needle that filled let go on its own, under a finger still down
    this.holdButton?.setScale(1)
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    if (from === 'boil') this.boilWord()
    this.time.delayedCall(STATION_DELAY_MS, () => {
      if (!this.revealed) this.showStation(next)
    })
  }

  /** Vừa tới in the band; else too raw below it or too soft above it. */
  private boilWord(): void {
    const [lo] = boilBand(this.params.ticket, this.params.hard)
    const key: StringKey = this.rules.boil === 'in' ? 'phoBoilIn' : this.rules.needle < lo ? 'phoBoilRaw' : 'phoBoilSoft'
    this.floatWord(t(key), WORD.boilX, this.rules.boil === 'in' ? C.teal : C.lantern)
  }

  private onDown(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (this.revealed) return
    if (this.shown === 'cut' && this.rules.phase === 'cut' && p.x >= BOARD.left && p.x <= BOARD.right && p.y >= BOARD.top && p.y <= BOARD.bottom) {
      this.swipe = [{ x: p.x, y: p.y }]
    } else if (this.shown === 'boil' && this.rules.phase === 'boil' && this.holdButton && over.includes(this.holdButton)) {
      this.held = true
      this.holdButton.setScale(0.95)
      sound.play('tap')
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.swipe || !this.trail) return
    this.swipe.push({ x: p.x, y: p.y })
    this.trail.clear().lineStyle(TRAIL_W, hex(C.mustard), 0.85)
    this.trail.strokePoints(this.swipe.map(q => new Phaser.Math.Vector2(q.x, q.y)))
  }

  private onUp(): void {
    if (this.held) {
      this.held = false
      this.holdButton?.setScale(1)
      this.rules.release()
    }
    const pts = this.swipe
    this.swipe = null
    this.trail?.clear()
    if (!pts || this.revealed || this.rules.phase !== 'cut') return
    const ys = pts.map(q => q.y)
    const meanX = pts.reduce((sum, q) => sum + q.x, 0) / pts.length
    const result = this.rules.cut(meanX, Math.max(...ys) - Math.min(...ys))
    const wordX = Phaser.Math.Clamp(meanX, WORD.minX, WORD.maxX)
    if (result === 'short') {
      this.floatWord(t('phoCutShort'), GAME_W / 2, C.lantern)
      return
    }
    if (!result) return
    sound.play('thud')
    this.cuts?.lineStyle(CUT_LINE_W, hex(C.ink), 1).lineBetween(meanX, BEEF.top, meanX, BEEF.bottom)
    this.floatWord(t(result === 'good' ? 'phoCutGood' : 'phoCutOff'), wordX, result === 'good' ? C.teal : C.lantern)
  }

  private addTopping(id: Topping, text: Phaser.GameObjects.Text): void {
    if (this.revealed || this.rules.phase !== 'top') return
    this.rules.add(id)
    const name = TOPPINGS.find(tp => tp.id === id)!.key
    text.setText(t('phoCount', { name: t(name), n: this.rules.counts[id] }))
    const a = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * 0.8
    const bit = this.add.image(PHO_BROTH.x + Math.cos(a) * r * PHO_BROTH.rx, PHO_BROTH.y + Math.sin(a) * r * PHO_BROTH.ry, `pho-${id}`).setScale(0).setRotation(Math.random() * Math.PI)
    this.station.push(bit)
    this.tweens.add({ targets: bit, scale: 0.8, duration: 180, ease: 'Back.easeOut' })
  }

  /** The needle on the dial; while held the pot shakes and bubbles rise from it. */
  private updateBoil(time: number, delta: number): void {
    const y = this.dialY(this.rules.needle)
    this.needle
      ?.clear()
      .fillStyle(hex(C.lantern), 1)
      .fillRoundedRect(PHO_DIAL.x - NEEDLE.w / 2, y - NEEDLE.h / 2, NEEDLE.w, NEEDLE.h, NEEDLE.h / 2)
      .lineStyle(NEEDLE.ink, hex(C.ink))
      .strokeRoundedRect(PHO_DIAL.x - NEEDLE.w / 2, y - NEEDLE.h / 2, NEEDLE.w, NEEDLE.h, NEEDLE.h / 2)
    this.pot?.setX(PHO_BOX.pot[0] + (this.held ? Math.sin(time * BUBBLE.wobblePerMs) * BUBBLE.wobblePx : 0))
    if (!this.held) return
    this.bubbleMs += delta
    for (; this.bubbleMs >= BUBBLE.everyMs; this.bubbleMs -= BUBBLE.everyMs) {
      const bubble = this.add
        .circle(Phaser.Math.Between(BUBBLE.left, BUBBLE.right), BUBBLE.y, Phaser.Math.Between(BUBBLE.r[0], BUBBLE.r[1]), hex(C.cloud))
        .setStrokeStyle(3, hex(C.ink))
      this.tweens.add({ targets: bubble, y: BUBBLE.y - BUBBLE.risePx, alpha: 0, duration: BUBBLE.ms, onComplete: () => bubble.destroy() })
    }
  }

  private floatWord(words: string, x: number, colour: string): void {
    const word = this.add.text(x, WORD.y, words, textStyle(WORD.size, '800', colour)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    word.setScale(Math.min(1, WORD.maxW / word.width))
    this.tweens.add({ targets: word, y: { value: word.y - WORD.risePx, ease: 'Quad.easeOut' }, alpha: { value: 0, ease: 'Quad.easeIn' }, duration: WORD.ms, onComplete: () => word.destroy() })
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.held = false
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

  /** The y on the dial of a needle at k, from empty at 0 to full at 1. */
  private dialY(k: number): number {
    return PHO_DIAL.empty - (PHO_DIAL.empty - PHO_DIAL.full) * k
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / this.rules.limitMs)
  }
}
