import * as Phaser from 'phaser'
import { CF_GLASS } from '../art/caPheArt'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { CaPheGame, dripBand, milkBand, type CaPhePhase, type CaPheTicket, type CfResult } from '../sim/caPhe'
import type { Stars } from '../sim/economy'
import { t, type StringKey } from '../strings/vi'
import { addPills, addTicket, type CookData } from '../view/cook'
import { HandPointer } from '../view/HandPointer'
import { addMiniGameCard, drawBars, revealStars, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'
import { addButton, aplusFrame } from '../view/ui'

type Station = Exclude<CaPhePhase, 'done'>
const STATIONS: Station[] = ['milk', 'drip', 'ice']
const INSTRUCTION: Record<Station, StringKey> = { milk: 'cfMilk', drip: 'cfDrip', ice: 'cfIce' }
const STEP: Record<Station, StringKey> = { milk: 'cfStepMilk', drip: 'cfStepDrip', ice: 'cfStepIce' }
/** The first game's lesson line for each station, in a box set in the gap under the ticket so it never covers the glass. */
const LESSON: Record<Station, StringKey> = { milk: 'cfLearnMilk', drip: 'cfLearnDrip', ice: 'cfLearnIce' }
const LESSON_BOX_Y = 795
/** The button under the glass on every station: hold to pour, lift the phin, or Xong once the ice is in. */
const BUTTON = { x: 540, y: 1530, w: 480, h: 120 }
/** The can beside the glass's right, tipping while it pours; the stream runs from its lip to the drink. */
const CAN = { x: 720, y: 1060, tip: -0.9, tipMs: 160, lip: { x: 640, y: 1010 } }
/** The phin set on the glass's brim, and the drops falling from it. */
const PHIN = { x: CF_GLASS.x, y: CF_GLASS.top - 50, dropEveryMs: 280, dropMs: 420, dropR: 7 }
/** The ice bucket beside the glass, its count under it, and the cubes floating at the top of the drink. */
const BUCKET = { x: 800, y: 1060, hitW: 110, hitH: 95, countY: 1170 }
const CUBE = { size: 52, gap: 6 }
/** The glass's tint, the condensed milk, the coffee over it, and the band to stop in. */
const LAYER = { glass: C.glass, glassAlpha: 0.45, milk: C.bambooLight, coffee: C.woodDark, bandAlpha: 0.45, ink: 5 }
/**
 * Nét A+ của ly: vạch đậm ở mặt sữa và váng cà phê, mảng bóng mép cứng sát thành phải, các vệt sáng bên trái
 * (từ chiều cao k0 tới k1, cách thành trái dx), vành miệng ly và đế dày dưới đáy.
 */
const GLASS = {
  layerLineW: 5,
  shadeAlpha: 0.12,
  shadeW: 52,
  shineW: 10,
  shineAlpha: 0.55,
  shines: [[0.92, 0.12, 24], [0.9, 0.55, 48]] as const,
  rimRy: 14,
  rimW: 6,
  rimInnerW: 3,
  foot: { out: 12, up: 6, h: 30, r: 12 },
}
/** A word rises from where it is said and fades; a long line is scaled down to fit the card. */
const WORD = { size: 60, stroke: 12, risePx: 80, ms: 700, x: 540, y: 870, maxW: 880 }
/** The last move of a step stays on screen this long before the next station. */
const STATION_DELAY_MS = 700
const DEPTH = { word: 10, stream: 4 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** Half the glass's inside width at height y, from its bottom to its brim. */
const glassHalf = (y: number) => Phaser.Math.Linear(CF_GLASS.bottomHalf, CF_GLASS.topHalf, (CF_GLASS.bottom - y) / (CF_GLASS.bottom - CF_GLASS.top))
/** The height in the glass of a fill from 0 (empty) to 1 (at the brim). */
const glassY = (k: number) => CF_GLASS.bottom - (CF_GLASS.bottom - CF_GLASS.top) * k

/** Making Cà phê sữa đá over the frozen shops: pour the condensed milk to the ticket's mark, lift the phin when the coffee stands in its band, and drop in the ticket's ice. */
export class CaPheScene extends Phaser.Scene {
  private params!: CookData<CaPheTicket>
  private rules!: CaPheGame
  /** The rules' phase as last seen, and the station on the card, which follows it after a short pause. */
  private phase: CaPhePhase = 'milk'
  private shown: Station = 'milk'
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private drawPills!: (at: number) => void
  /** The lesson's hand, only in the first cup. */
  private hand: HandPointer | null = null
  /** Everything of the station on the card, and its buttons, which go at the reveal. */
  private station: Phaser.GameObjects.GameObject[] = []
  private buttons: Phaser.GameObjects.GameObject[] = []
  private drink!: Phaser.GameObjects.Graphics
  private stream: Phaser.GameObjects.Graphics | null = null
  private can: Phaser.GameObjects.Image | null = null
  private holdButton: Phaser.GameObjects.Container | null = null
  private iceCount: Phaser.GameObjects.Text | null = null
  private cubes: Phaser.GameObjects.Image[] = []
  private dropMs = 0
  private held = false
  private revealed = false

  constructor() {
    super('CaPheScene')
  }

  init(data: CookData<CaPheTicket>) {
    this.params = data
  }

  create() {
    this.rules = new CaPheGame(this.params.ticket, this.params.hard)
    this.phase = 'milk'
    this.station = []
    this.buttons = []
    this.cubes = []
    this.dropMs = 0
    this.held = false
    this.revealed = false

    this.instruction = addMiniGameCard(this, t('cfMilk'))
    addTicket(this, 'caPhe', this.params.ticket)
    this.drawPills = addPills(this, STATIONS.map(s => t(STEP[s])))
    this.hand = this.params.demo ? new HandPointer(this) : null
    this.drink = this.add.graphics()
    this.bars = this.add.graphics()
    this.showStation('milk')

    oneFinger(this.input, {
      down: (_p, over) => this.onDown(over),
      up: () => this.onUp(),
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.rules.tick(delta)
    if (this.rules.phase !== this.phase) this.enterPhase(this.rules.phase)
    if (this.revealed) return
    if (this.shown === 'drip' && this.rules.phase === 'drip') this.dripDrops(delta)
    this.drawDrink()
    this.pointLesson()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a cup. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The first game's hand: this station's line, pointing at the button, or at the bucket for the ice. */
  private pointLesson(): void {
    if (!this.hand) return
    if (this.rules.phase !== this.shown) {
      this.hand.hide()
      return
    }
    const spot = this.shown === 'ice' ? { x: BUCKET.x, y: BUCKET.y - BUCKET.hitH } : { x: BUTTON.x, y: BUTTON.y - BUTTON.h / 2 }
    this.hand.show(t(LESSON[this.shown]), spot.x, spot.y, 'down', { boxY: LESSON_BOX_Y })
  }

  /** Clears the card's middle and lays out this step's station; the glass and its drink stay. */
  private showStation(s: Station): void {
    for (const o of this.station) o.destroy()
    this.station = []
    this.buttons = []
    this.cubes = []
    this.stream = this.can = this.holdButton = this.iceCount = null
    this.shown = s
    setInstruction(this.instruction, t(INSTRUCTION[s]))
    this.drawPills(STATIONS.indexOf(s))
    const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.station.push(o)
      return o
    }

    if (s === 'milk') {
      this.stream = keep(this.add.graphics().setDepth(DEPTH.stream))
      this.can = keep(this.add.image(CAN.x, CAN.y, 'cf-can'))
      const bg = aplusFrame(this.add.graphics(), C.teal, -BUTTON.w / 2, -BUTTON.h / 2, BUTTON.w, BUTTON.h, BUTTON.h / 2)
      const label = this.add.text(0, 0, t('cfHold'), textStyle(56, '800', C.paper)).setOrigin(0.5)
      this.holdButton = keep(this.add.container(BUTTON.x, BUTTON.y, [bg, label]).setSize(BUTTON.w, BUTTON.h).setInteractive())
      this.buttons.push(this.holdButton)
    } else if (s === 'drip') {
      keep(this.add.image(PHIN.x, PHIN.y, 'cf-phin'))
      this.buttons.push(keep(addButton(this, BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h, t('cfLift'), 'primary', () => this.lift())))
    } else {
      const bucket = keep(this.add.image(BUCKET.x, BUCKET.y, 'cf-bucket').setInteractive())
      bucket.on('pointerdown', () => this.addIce(keep))
      this.iceCount = keep(this.add.text(BUCKET.x, BUCKET.countY, t('cfIceCount', { n: 0 }), textStyle(40, '800')).setOrigin(0.5))
      this.buttons.push(bucket, keep(addButton(this, BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h, t('bxDone'), 'primary', () => this.rules.doneIce())))
    }
  }

  private enterPhase(next: CaPhePhase): void {
    const from = this.phase
    this.phase = next
    this.held = false
    this.holdButton?.setScale(1)
    this.can?.setRotation(0)
    this.stream?.clear()
    if (from === 'milk' && this.rules.milkResult) this.milkWord(this.rules.milkResult)
    if (from === 'drip' && this.rules.dripResult) this.dripWord(this.rules.dripResult)
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.time.delayedCall(STATION_DELAY_MS, () => {
      if (!this.revealed) this.showStation(next)
    })
  }

  private onDown(over: Phaser.GameObjects.GameObject[]): void {
    if (this.revealed || this.shown !== 'milk' || this.rules.phase !== 'milk' || !this.holdButton || !over.includes(this.holdButton)) return
    this.held = true
    this.holdButton.setScale(0.95)
    this.rules.startPour()
    sound.play('tap')
    if (this.can) {
      this.tweens.killTweensOf(this.can)
      this.tweens.add({ targets: this.can, rotation: CAN.tip, duration: CAN.tipMs })
    }
  }

  private onUp(): void {
    if (!this.held) return
    this.held = false
    this.holdButton?.setScale(1)
    if (this.can) {
      this.tweens.killTweensOf(this.can)
      this.tweens.add({ targets: this.can, rotation: 0, duration: CAN.tipMs })
    }
    this.stream?.clear()
    this.rules.stopPour()
  }

  private lift(): void {
    if (this.revealed || this.rules.phase !== 'drip') return
    this.rules.lift()
  }

  /** A cube drops from the bucket onto the drink's top and the count goes up. */
  private addIce(keep: <T extends Phaser.GameObjects.GameObject>(o: T) => T): void {
    if (this.revealed || this.rules.phase !== 'ice') return
    this.rules.addIce()
    sound.play('tap')
    this.iceCount?.setText(t('cfIceCount', { n: this.rules.ice }))
    const i = this.cubes.length
    const top = glassY(this.rules.level)
    const perRow = 3
    const x = CF_GLASS.x + ((i % perRow) - 1) * (CUBE.size + CUBE.gap)
    const y = top - CUBE.size / 2 - Math.floor(i / perRow) * (CUBE.size - 10)
    const cube = keep(this.add.image(BUCKET.x, BUCKET.y, 'cf-ice').setRotation(Math.random() - 0.5))
    this.cubes.push(cube)
    this.tweens.add({ targets: cube, x, y, duration: 260, ease: 'Quad.easeIn' })
  }

  /** Drops fall from the phin onto the coffee while it drips. */
  private dripDrops(delta: number): void {
    this.dropMs += delta
    if (this.dropMs < PHIN.dropEveryMs) return
    this.dropMs = 0
    const drop = this.add.circle(PHIN.x, PHIN.y + 60, PHIN.dropR, hex(C.woodDark)).setDepth(DEPTH.stream)
    this.station.push(drop)
    this.tweens.add({ targets: drop, y: glassY(this.rules.level), duration: PHIN.dropMs, ease: 'Quad.easeIn', onComplete: () => drop.destroy() })
  }

  /** The glass with its milk and coffee, the band to stop in for this station, and the milk's stream while the can pours. */
  private drawDrink(): void {
    const g = this.drink.clear()
    const { milk, level } = this.rules
    g.fillStyle(hex(LAYER.glass), LAYER.glassAlpha).fillPoints(this.slab(CF_GLASS.bottom, CF_GLASS.top), true)
    if (milk > 0) g.fillStyle(hex(LAYER.milk), 1).fillPoints(this.slab(CF_GLASS.bottom, glassY(milk)), true)
    if (level > milk) g.fillStyle(hex(LAYER.coffee), 1).fillPoints(this.slab(glassY(milk), glassY(level)), true)
    if (this.shown !== 'ice' && this.rules.phase === this.shown) {
      const [lo, hi] = this.shown === 'milk' ? milkBand(this.params.ticket, this.params.hard) : dripBand(this.params.ticket)
      g.fillStyle(hex(C.mustard), LAYER.bandAlpha).fillPoints(this.slab(glassY(lo), glassY(hi)), true)
      g.lineStyle(3, hex(C.ink), 0.6).strokePoints(this.slab(glassY(lo), glassY(hi)), true)
    }
    // A+: lớp sữa đặc có viền đậm, váng bọt trên mặt cà phê, mảng bóng sát thành phải, vệt sáng bên trái
    if (milk > 0) g.lineStyle(GLASS.layerLineW, hex(C.clayLight), 1).lineBetween(...this.across(glassY(milk)))
    if (level > milk) g.lineStyle(GLASS.layerLineW, hex(C.clay), 1).lineBetween(...this.across(glassY(level)))
    g.fillStyle(hex(C.ink), GLASS.shadeAlpha).fillPoints(this.wallShade(), true)
    g.lineStyle(GLASS.shineW, hex(C.cloud), GLASS.shineAlpha)
    for (const [k0, k1, dx] of GLASS.shines) g.lineBetween(...this.wallPoint(k0, dx), ...this.wallPoint(k1, dx))
    // the glass's walls and foot over the drink
    g.lineStyle(LAYER.ink, hex(C.ink), 1).strokePoints(
      [new Phaser.Math.Vector2(CF_GLASS.x - CF_GLASS.topHalf, CF_GLASS.top), new Phaser.Math.Vector2(CF_GLASS.x - CF_GLASS.bottomHalf, CF_GLASS.bottom), new Phaser.Math.Vector2(CF_GLASS.x + CF_GLASS.bottomHalf, CF_GLASS.bottom), new Phaser.Math.Vector2(CF_GLASS.x + CF_GLASS.topHalf, CF_GLASS.top)],
      false,
    )
    // đế ly dày và vành miệng ly
    const foot = GLASS.foot
    g.fillStyle(hex(C.glass), 1).fillRoundedRect(CF_GLASS.x - CF_GLASS.bottomHalf - foot.out, CF_GLASS.bottom - foot.up, 2 * (CF_GLASS.bottomHalf + foot.out), foot.h, foot.r)
    g.fillStyle(hex(C.ink), GLASS.shadeAlpha).fillRoundedRect(CF_GLASS.x + CF_GLASS.bottomHalf * 0.4, CF_GLASS.bottom - foot.up, CF_GLASS.bottomHalf * 0.6 + foot.out, foot.h, foot.r)
    g.lineStyle(LAYER.ink, hex(C.ink), 1).strokeRoundedRect(CF_GLASS.x - CF_GLASS.bottomHalf - foot.out, CF_GLASS.bottom - foot.up, 2 * (CF_GLASS.bottomHalf + foot.out), foot.h, foot.r)
    g.lineStyle(GLASS.rimW, hex(C.ink), 1).strokeEllipse(CF_GLASS.x, CF_GLASS.top, 2 * CF_GLASS.topHalf, 2 * GLASS.rimRy)
    g.lineStyle(GLASS.rimInnerW, hex(C.caoGlassShine), 1).strokeEllipse(CF_GLASS.x, CF_GLASS.top, 2 * CF_GLASS.topHalf - GLASS.rimW, 2 * GLASS.rimRy - GLASS.rimW)
    if (this.stream && this.held && this.rules.pouring) {
      this.stream.clear().lineStyle(14, hex(LAYER.milk), 1).lineBetween(CAN.lip.x, CAN.lip.y, CF_GLASS.x + 30, glassY(this.rules.milk))
    }
  }

  /** The two ends of the glass's inside across at height y. */
  private across(y: number): [number, number, number, number] {
    return [CF_GLASS.x - glassHalf(y), y, CF_GLASS.x + glassHalf(y), y]
  }

  /** A point inside the glass at height k (0 the bottom, 1 the brim), dx in from the left wall (or out from the right one when negative). */
  private wallPoint(k: number, dx: number): [number, number] {
    const y = glassY(k)
    return dx >= 0 ? [CF_GLASS.x - glassHalf(y) + dx, y] : [CF_GLASS.x + glassHalf(y) + dx, y]
  }

  /** The hard shade down the inside of the right wall. */
  private wallShade(): Phaser.Math.Vector2[] {
    const V = Phaser.Math.Vector2
    const w = GLASS.shadeW
    return [new V(...this.wallPoint(1, -w)), new V(...this.wallPoint(1, 0)), new V(...this.wallPoint(0, 0)), new V(...this.wallPoint(0, -w * 0.7))]
  }

  /** The glass's inside between two heights, as the four corners of its slice. */
  private slab(bottom: number, top: number): Phaser.Math.Vector2[] {
    const V = Phaser.Math.Vector2
    return [new V(CF_GLASS.x - glassHalf(bottom), bottom), new V(CF_GLASS.x + glassHalf(bottom), bottom), new V(CF_GLASS.x + glassHalf(top), top), new V(CF_GLASS.x - glassHalf(top), top)]
  }

  /** Vừa vạch in the band; else too little below it or too sweet above it. */
  private milkWord(result: CfResult): void {
    const [lo] = milkBand(this.params.ticket, this.params.hard)
    const key: StringKey = result === 'in' ? 'cfMilkIn' : this.rules.milk < lo ? 'cfMilkLittle' : 'cfMilkLots'
    this.floatWord(t(key), result === 'in' ? C.teal : C.lantern)
  }

  /** Đậm đà in the band; else weak below it or too full above it. */
  private dripWord(result: CfResult): void {
    const [lo] = dripBand(this.params.ticket)
    const key: StringKey = result === 'in' ? 'cfDripIn' : this.rules.level < lo ? 'cfDripWeak' : 'cfDripOver'
    this.floatWord(t(key), result === 'in' ? C.teal : C.lantern)
  }

  private floatWord(words: string, colour: string): void {
    const word = this.add.text(WORD.x, WORD.y, words, textStyle(WORD.size, '800', colour)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    word.setScale(Math.min(1, WORD.maxW / word.width))
    this.tweens.add({ targets: word, y: { value: word.y - WORD.risePx, ease: 'Quad.easeOut' }, alpha: { value: 0, ease: 'Quad.easeIn' }, duration: WORD.ms, onComplete: () => word.destroy() })
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.held = false
    for (const b of this.buttons) b.destroy()
    this.buttons = []
    this.hand?.hide()
    this.stream?.clear()
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
