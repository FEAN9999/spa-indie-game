import * as Phaser from 'phaser'
import { CHE_GLASS, CHE_GLASS_BOX, CHE_ICE_BLOCK } from '../art/cheArt'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { CHE_LAYERS, CheGame, layerMarks, type ChePhase, type CheTicket } from '../sim/che'
import type { Stars } from '../sim/economy'
import { t, type StringKey } from '../strings/vi'
import { addPills, addTicket, type CookData } from '../view/cook'
import { HandPointer } from '../view/HandPointer'
import { addMiniGameCard, drawBars, revealStars, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'

type Station = Exclude<ChePhase, 'done'>
type Layer = (typeof CHE_LAYERS)[number]
const STATIONS: Station[] = ['layer', 'ice', 'pour']
const INSTRUCTION: Record<Station, StringKey> = { layer: 'cheLayer', ice: 'cheIce', pour: 'chePour' }
const STEP: Record<Station, StringKey> = { layer: 'cheStepLayer', ice: 'cheStepIce', pour: 'cheStepPour' }
/** The first game's lesson line for each station. */
const LESSON: Record<Station, StringKey> = { layer: 'cheLearnLayer', ice: 'cheLearnIce', pour: 'cheLearnPour' }
const LAYER_NAME: Record<Layer, StringKey> = { redBean: 'cheRedBean', mungBean: 'cheMungBean', jelly: 'cheJelly' }
const LAYER_COLOUR: Record<Layer, string> = { redBean: C.terracotta, mungBean: C.mustard, jelly: C.leaf }
const [GLASS_L, GLASS_R] = [CHE_GLASS.x - CHE_GLASS.halfW, CHE_GLASS.x + CHE_GLASS.halfW]
/** The hold button under the glass; its label names the layer being poured and is scaled down to fit. */
const HOLD = { x: 540, y: 1530, w: 680, h: 120, size: 48, padX: 40 }
/** The layer lesson's box sits above the glass rim, under the ticket and the pills, so it covers no mark. */
const LAYER_LESSON_Y = 785
/** The marks run a little past the glass's walls, in dashes. */
const MARK = { dash: 22, gap: 14, w: 6, overhang: 34 }
/** A glint down the glass's left side, over the layers. */
const GLINT = { x: GLASS_L + 26, w: 14, inset: 40, alpha: 0.35 }
/** The ice block's centre, and how much it shrinks by the last tap; each tap punches it and throws shards from the finger. */
const ICE = { x: 540, y: 1120, shrink: 0.35, punch: 0.92, punchMs: 120 }
const SHARD = { n: 6, size: [12, 24], flyPx: [80, 180], ms: 450 }
/** The count under the ice block or the glass. */
const COUNT = { y: 1530, size: 56 }
/** The crushed ice sitting on the chè in the pour station. */
const CUBE = { n: 5, w: 46, h: 40, rise: 18 }
/** The jug over the glass, tipped toward its spout; it follows the finger across the glass. */
const JUG = { y: 790, rotation: -0.5 }
/** Where a pour swipe may start: on the glass. */
const POUR_ZONE = new Phaser.Geom.Rectangle(...CHE_GLASS_BOX)
/** A pass's drizzle: a white wave over the chè's top, each a little lower than the last. */
const DRIZZLE = { w: 10, amp: 8, waveLen: 60, step: 10, ink: 3 }
/** A word rises from where it is said and fades; a long line is scaled down to fit the card. */
const WORD = { size: 60, stroke: 12, risePx: 80, ms: 700, y: 870, x: CHE_GLASS.x, maxW: 880 }
/** The last move of a step stays on screen this long before the next station. */
const STATION_DELAY_MS = 700
const DEPTH = { word: 10 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** The y in the glass of a fill at k, from its floor at 0 to its rim at 1. */
const levelY = (k: number) => CHE_GLASS.bottom - (CHE_GLASS.bottom - CHE_GLASS.top) * k

/** Cooking Chè ba màu over the frozen shops: hold three layers to their marks, crush the ice with quick taps, and pour coconut milk in passes across the glass. */
export class CheScene extends Phaser.Scene {
  private params!: CookData<CheTicket>
  private rules!: CheGame
  /** The rules' phase as last seen, and the station on the card, which follows it after a short pause. */
  private phase: ChePhase = 'layer'
  private shown: Station = 'layer'
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private drawPills!: (at: number) => void
  /** The lesson's hand, only in the first Chè. */
  private hand: HandPointer | null = null
  /** Everything of the station on the card, and its buttons, which go at the reveal. */
  private station: Phaser.GameObjects.GameObject[] = []
  private buttons: Phaser.GameObjects.GameObject[] = []
  /** The fill each poured layer reached, bottom up, and the layers and good ones the scene has already named. */
  private tops: number[] = []
  private seenGood = 0
  private layers: Phaser.GameObjects.Graphics | null = null
  private holdButton: Phaser.GameObjects.Container | null = null
  private holdLabel: Phaser.GameObjects.Text | null = null
  private held = false
  private ice: Phaser.GameObjects.Image | null = null
  private count: Phaser.GameObjects.Text | null = null
  private jug: Phaser.GameObjects.Image | null = null
  private drizzle: Phaser.GameObjects.Graphics | null = null
  private pouring = false
  private revealed = false

  constructor() {
    super('CheScene')
  }

  init(data: CookData<CheTicket>) {
    this.params = data
  }

  create() {
    this.rules = new CheGame(this.params.ticket, this.params.hard)
    this.phase = 'layer'
    this.station = []
    this.buttons = []
    this.tops = []
    this.seenGood = 0
    this.held = false
    this.pouring = false
    this.revealed = false

    this.instruction = addMiniGameCard(this, t('cheLayer'))
    addTicket(this, 'che', this.params.ticket)
    this.drawPills = addPills(this, STATIONS.map(s => t(STEP[s])))
    this.hand = this.params.demo ? new HandPointer(this) : null
    this.bars = this.add.graphics()
    this.showStation('layer')

    oneFinger(this.input, {
      down: (p, over) => this.onDown(p, over),
      move: p => this.onMove(p),
      up: () => this.onUp(),
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    if (this.held && this.shown === 'layer') this.rules.hold(delta)
    this.rules.tick(delta)
    this.noteLayers()
    if (this.rules.phase !== this.phase) this.enterPhase(this.rules.phase)
    if (this.revealed) return
    if (this.shown === 'layer') this.drawLayers()
    this.pointLesson()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a glass. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The first game's hand: this station's line, pointing at its target; nowhere to point (between stations) hides it. */
  private pointLesson(): void {
    if (!this.hand) return
    const spot = this.lessonSpot()
    if (spot) this.hand.show(t(LESSON[this.shown]), spot.x, spot.y, 'down', this.shown === 'layer' ? { boxY: LAYER_LESSON_Y } : {})
    else this.hand.hide()
  }

  /** The hold button's top for the layers, the ice block's top for the ice, the middle of the chè for the pour. */
  private lessonSpot(): { x: number; y: number } | null {
    if (this.rules.phase !== this.shown) return null
    if (this.shown === 'layer') return { x: HOLD.x, y: HOLD.y - HOLD.h / 2 }
    if (this.shown === 'ice') return { x: ICE.x, y: ICE.y - 60 }
    return { x: CHE_GLASS.x, y: levelY(this.rules.level / 2) }
  }

  /** Clears the card's middle and lays out this step's station. */
  private showStation(s: Station): void {
    for (const o of this.station) o.destroy()
    this.station = []
    this.buttons = []
    this.layers = this.drizzle = null
    this.holdButton = this.holdLabel = null
    this.ice = this.jug = null
    this.count = null
    this.shown = s
    setInstruction(this.instruction, t(INSTRUCTION[s]))
    this.drawPills(STATIONS.indexOf(s))
    const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.station.push(o)
      return o
    }

    if (s === 'ice') {
      this.rules.startIce()
      this.ice = keep(this.add.image(ICE.x, ICE.y, 'che-ice').setInteractive(new Phaser.Geom.Rectangle(...CHE_ICE_BLOCK), Phaser.Geom.Rectangle.Contains))
      this.count = keep(this.add.text(ICE.x, COUNT.y, this.iceCount(), textStyle(COUNT.size, '800')).setOrigin(0.5))
      return
    }

    keep(this.add.image(CHE_GLASS_BOX[0], CHE_GLASS_BOX[1], 'che-glass').setOrigin(0))
    this.layers = keep(this.add.graphics())
    this.drawLayers()
    if (s === 'layer') {
      const marks = keep(this.add.graphics()).lineStyle(MARK.w, hex(C.ink), 1)
      for (const m of layerMarks(this.params.ticket)) {
        const y = levelY(m)
        for (let x = GLASS_L - MARK.overhang; x < GLASS_R + MARK.overhang; x += MARK.dash + MARK.gap) marks.lineBetween(x, y, Math.min(x + MARK.dash, GLASS_R + MARK.overhang), y)
      }
    } else {
      const top = levelY(this.rules.level)
      const cubes = keep(this.add.graphics())
      for (let i = 0; i < CUBE.n; i++) {
        const x = GLASS_L + ((i + 0.5) * (GLASS_R - GLASS_L)) / CUBE.n - CUBE.w / 2
        const y = top - CUBE.rise - (i % 2) * (CUBE.h / 3)
        cubes.fillStyle(hex(C.glass), 1).fillRoundedRect(x, y, CUBE.w, CUBE.h, 10).lineStyle(3, hex(C.ink)).strokeRoundedRect(x, y, CUBE.w, CUBE.h, 10)
      }
      this.drizzle = keep(this.add.graphics())
    }
    keep(this.add.graphics())
      .fillStyle(hex(C.cloud), GLINT.alpha)
      .fillRoundedRect(GLINT.x, CHE_GLASS.top + GLINT.inset, GLINT.w, CHE_GLASS.bottom - CHE_GLASS.top - GLINT.inset * 2, GLINT.w / 2)

    if (s === 'layer') {
      const bg = this.add
        .graphics()
        .fillStyle(hex(C.teal), 1)
        .fillRoundedRect(-HOLD.w / 2, -HOLD.h / 2, HOLD.w, HOLD.h, HOLD.h / 2)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(-HOLD.w / 2, -HOLD.h / 2, HOLD.w, HOLD.h, HOLD.h / 2)
      this.holdLabel = this.add.text(0, 0, '', textStyle(HOLD.size, '800', C.paper)).setOrigin(0.5)
      this.holdButton = keep(this.add.container(HOLD.x, HOLD.y, [bg, this.holdLabel]).setSize(HOLD.w, HOLD.h).setInteractive())
      this.buttons.push(this.holdButton)
      this.nameLayer()
    } else {
      this.jug = keep(this.add.image(CHE_GLASS.x, JUG.y, 'che-coconut').setRotation(JUG.rotation))
      this.count = keep(this.add.text(CHE_GLASS.x, COUNT.y, this.pourCount(), textStyle(COUNT.size, '800')).setOrigin(0.5))
    }
  }

  private enterPhase(next: ChePhase): void {
    const from = this.phase
    this.phase = next
    this.held = false
    this.pouring = false
    // a glass that filled let go on its own, under a finger still down
    this.holdButton?.setScale(1)
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    if (from === 'ice') this.floatWord(t(this.rules.iceFast ? 'cheIceFast' : 'cheIceDone'), this.rules.iceFast ? C.teal : C.lantern)
    this.time.delayedCall(STATION_DELAY_MS, () => {
      if (!this.revealed) this.showStation(next)
    })
  }

  /** A layer the rules closed, by a lift or by a glass filling to the rim, is kept at its top and judged against its mark. */
  private noteLayers(): void {
    if (this.rules.layer === this.tops.length) return
    this.tops.push(this.rules.level)
    const good = this.rules.goodLayers > this.seenGood
    this.seenGood = this.rules.goodLayers
    sound.play('thud')
    this.floatWord(t(good ? 'cheLayerGood' : 'cheLayerOff'), good ? C.teal : C.lantern)
    this.nameLayer()
  }

  /** The hold button names the layer it pours next. */
  private nameLayer(): void {
    const layer = CHE_LAYERS[Math.min(this.tops.length, CHE_LAYERS.length - 1)]
    this.holdLabel?.setText(`${t('cheHold')} · ${t(LAYER_NAME[layer])}`)
    this.holdLabel?.setScale(Math.min(1, (HOLD.w - HOLD.padX * 2) / this.holdLabel.width))
  }

  /** The poured layers in their colours, and while pouring, the layer under way up to the current fill. */
  private drawLayers(): void {
    if (!this.layers) return
    this.layers.clear()
    const fills = this.rules.phase === 'layer' ? [...this.tops, this.rules.level] : this.tops
    let from = 0
    fills.forEach((top, i) => {
      if (top <= from) return
      this.layers!.fillStyle(hex(LAYER_COLOUR[CHE_LAYERS[i]]), 1).fillRect(GLASS_L, levelY(top), GLASS_R - GLASS_L, levelY(from) - levelY(top))
      from = top
    })
  }

  private onDown(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (this.revealed || this.rules.phase !== this.shown) return
    if (this.shown === 'layer' && this.holdButton && over.includes(this.holdButton)) {
      this.held = true
      this.holdButton.setScale(0.95)
      sound.play('tap')
    } else if (this.shown === 'ice' && this.ice && over.includes(this.ice)) {
      this.crushIce(p.x, p.y)
    } else if (this.shown === 'pour' && POUR_ZONE.contains(p.x, p.y)) {
      this.pouring = true
      this.pourTo(p.x)
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (this.pouring) this.pourTo(p.x)
  }

  private onUp(): void {
    if (this.held) {
      this.held = false
      this.holdButton?.setScale(1)
      this.rules.release()
    }
    if (this.pouring) {
      this.pouring = false
      this.rules.endSwipe()
    }
  }

  /** A tap on the block counts; the block shrinks and jolts, and shards fly from the finger. */
  private crushIce(x: number, y: number): void {
    this.rules.tap()
    sound.play('tap')
    this.count?.setText(this.iceCount())
    const scale = 1 - (ICE.shrink * this.rules.taps) / this.rules.iceTarget()
    if (this.ice) this.tweens.add({ targets: this.ice, scale: { from: scale * ICE.punch, to: scale }, duration: ICE.punchMs, ease: 'Back.easeOut' })
    for (let i = 0; i < SHARD.n; i++) {
      const size = Phaser.Math.Between(SHARD.size[0], SHARD.size[1])
      const shard = this.add.rectangle(x, y, size, size * 0.7, hex(C.glass)).setStrokeStyle(3, hex(C.ink)).setRotation(Math.random() * Math.PI)
      const a = Math.random() * Math.PI * 2
      const r = Phaser.Math.Between(SHARD.flyPx[0], SHARD.flyPx[1])
      this.tweens.add({ targets: shard, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, angle: 180, alpha: 0, duration: SHARD.ms, onComplete: () => shard.destroy() })
    }
  }

  /** The jug follows the finger over the glass; a counted pass drizzles white over the chè's top. */
  private pourTo(x: number): void {
    this.jug?.setX(Phaser.Math.Clamp(x, GLASS_L, GLASS_R))
    if (!this.rules.swipeTo(x)) return
    sound.play('foam')
    this.count?.setText(this.pourCount())
    const y = levelY(this.rules.level) + this.rules.passes * DRIZZLE.step
    const phase = Math.random() * Math.PI * 2
    const pts: Phaser.Math.Vector2[] = []
    for (let px = GLASS_L; px <= GLASS_R; px += 10) pts.push(new Phaser.Math.Vector2(px, y + Math.sin(phase + ((px - GLASS_L) / DRIZZLE.waveLen) * Math.PI * 2) * DRIZZLE.amp))
    this.drizzle?.lineStyle(DRIZZLE.w + DRIZZLE.ink * 2, hex(C.ink), 1).strokePoints(pts).lineStyle(DRIZZLE.w, hex(C.cloud), 1).strokePoints(pts)
  }

  private iceCount(): string {
    return t('cheIceCount', { n: this.rules.taps, target: this.rules.iceTarget() })
  }

  private pourCount(): string {
    return t('chePourCount', { n: this.rules.passes, target: this.rules.passTarget() })
  }

  private floatWord(words: string, colour: string): void {
    const word = this.add.text(WORD.x, WORD.y, words, textStyle(WORD.size, '800', colour)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    word.setScale(Math.min(1, WORD.maxW / word.width))
    this.tweens.add({ targets: word, y: { value: word.y - WORD.risePx, ease: 'Quad.easeOut' }, alpha: { value: 0, ease: 'Quad.easeIn' }, duration: WORD.ms, onComplete: () => word.destroy() })
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.held = false
    this.pouring = false
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
