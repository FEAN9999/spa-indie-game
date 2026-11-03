import * as Phaser from 'phaser'
import { BC_BASKET, BC_BOWL, BC_BOX, BC_PATTIES, BC_PATTY, BC_PLATE, bunChaTextures } from '../art/bunChaArt'
import { C } from '../art/palette'
import { PHO_BOX, PHO_DIAL, phoTextures } from '../art/phoArt'
import { preloadSvgTextures } from '../art/svg'
import { sound } from '../audio/engine'
import { BunChaGame, grillBand, sauceBand, type BcResult, type BcSide, type BunChaPhase, type BunChaTicket } from '../sim/bunCha'
import type { Stars } from '../sim/economy'
import { t, type StringKey } from '../strings/vi'
import { addPills, addTicket, type CookData } from '../view/cook'
import { HandPointer } from '../view/HandPointer'
import { addMiniGameCard, drawBars, revealStars, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'
import { addButton, aplusFrame } from '../view/ui'

type Station = Exclude<BunChaPhase, 'done'>
const STATIONS: Station[] = ['grill', 'sides', 'pour']
const INSTRUCTION: Record<Station, StringKey> = { grill: 'bcGrill', sides: 'bcSides', pour: 'bcPour' }
const STEP: Record<Station, StringKey> = { grill: 'bcStepGrill', sides: 'bcStepSides', pour: 'bcStepPour' }
/** The first game's lesson line for each station. */
const LESSON: Record<Station, StringKey> = { grill: 'bcLearnGrill', sides: 'bcLearnSides', pour: 'bcLearnPour' }
/** The turn button under the stove, the hold button under the bowl, the side buttons in a row under the plate, and Xong to its right. */
const FLIP = { x: 540, y: 1530, w: 440, h: 120 }
const HOLD = { x: 540, y: 1530, w: 520, h: 120 }
const SIDES: { id: BcSide; key: StringKey; x: number }[] = [
  { id: 'rau', key: 'bcRauTap', x: 250 },
  { id: 'du', key: 'bcDuTap', x: 540 },
  { id: 'ot', key: 'bcOtTap', x: 830 },
]
/** A side's label sits right of its picture and shrinks to fit the button when its count is added. */
const SIDE_BTN = { y: 1500, w: 260, h: 110, iconDx: -80, textDx: 38, textW: 160, size: 40 }
const DONE = { x: 880, y: 1330, w: 240, h: 120 }
/** The sides lesson's box stops this far left of the Xong button. */
const LESSON_GAP = 20
const NEEDLE = { w: 120, h: 22, ink: 4 }
/** The basket's bamboo frame and wires, the patties' ink, and how long the basket takes to turn over. */
const FRAME = { w: 16, wire: 5, ink: 4, turnMs: 140 }
/** The patties run from raw pink through golden brown to charred. */
const BROWN = [C.houseRose, C.mustardDark, C.deepBrown]
/** The sauce's colour, the band it should stop in, and how see-through that band is; and the light line on its surface. */
const SAUCE = { color: C.mustard, bandAlpha: 0.45, ink: 4, shine: 5, shineAlpha: 0.55, shineInset: 24 }
/** A word rises from where it is said and fades; a long line is scaled down to fit the card. */
const WORD = { size: 60, stroke: 12, risePx: 80, ms: 700, y: 870, x: 440, maxW: 880 }
/** The last move of a step stays on screen this long before the next station. */
const STATION_DELAY_MS = 700
const DEPTH = { word: 10 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** The patties' colour at a brown from 0 to 1. */
function brownColour(k: number): number {
  const half = k < 0.5 ? 0 : 1
  const [from, to] = [Phaser.Display.Color.HexStringToColor(BROWN[half]), Phaser.Display.Color.HexStringToColor(BROWN[half + 1])]
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, (k * 2 - half) * 100)
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b)
}

/** Half the bowl's inside width at height y, from its bottom to its brim. */
const bowlHalf = (y: number) => Phaser.Math.Linear(BC_BOWL.bottomHalf, BC_BOWL.topHalf, (BC_BOWL.bottom - y) / (BC_BOWL.bottom - BC_BOWL.top))
/** The height in the bowl of a fill from 0 (empty) to 1 (at the brim). */
const bowlY = (k: number) => BC_BOWL.bottom - (BC_BOWL.bottom - BC_BOWL.top) * k

/** Cooking Bún chả over the frozen shops: turn the grill basket as each side browns into the ticket's band, add the ticket's sides, and pour the dipping sauce to the line. */
export class BunChaScene extends Phaser.Scene {
  private params!: CookData<BunChaTicket>
  private rules!: BunChaGame
  /** The rules' phase as last seen, and the station on the card, which follows it after a short pause. */
  private phase: BunChaPhase = 'grill'
  private shown: Station = 'grill'
  /** How many sides have been turned, as last seen, to tell a turn the rules made by themselves. */
  private turned = 0
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private drawPills!: (at: number) => void
  /** The lesson's hand, only in the first Bún chả. */
  private hand: HandPointer | null = null
  /** Everything of the station on the card, and its buttons, which go at the reveal. */
  private station: Phaser.GameObjects.GameObject[] = []
  private buttons: Phaser.GameObjects.GameObject[] = []
  private basket: Phaser.GameObjects.Container | null = null
  /** Chả trong vỉ: hình tô màu theo độ chín của từng miếng. */
  private patties: Phaser.GameObjects.Image[] = []
  private needle: Phaser.GameObjects.Graphics | null = null
  private flipLabel: Phaser.GameObjects.Text | null = null
  private sauce: Phaser.GameObjects.Graphics | null = null
  private holdButton: Phaser.GameObjects.Container | null = null
  private held = false
  private revealed = false

  constructor() {
    super('BunChaScene')
  }

  init(data: CookData<BunChaTicket>) {
    this.params = data
  }

  preload() {
    // the stove dial and the ticket are the phở stove's
    preloadSvgTextures(this, { ...bunChaTextures(), ...phoTextures() })
  }

  create() {
    this.rules = new BunChaGame(this.params.ticket, this.params.hard)
    this.phase = 'grill'
    this.turned = 0
    this.station = []
    this.buttons = []
    this.held = false
    this.revealed = false

    this.instruction = addMiniGameCard(this, t('bcGrill'))
    addTicket(this, 'bunCha', this.params.ticket)
    this.drawPills = addPills(this, STATIONS.map(s => t(STEP[s])))
    this.hand = this.params.demo ? new HandPointer(this) : null
    this.bars = this.add.graphics()
    this.showStation('grill')

    oneFinger(this.input, {
      down: (_p, over) => this.onDown(over),
      up: () => this.onUp(),
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.rules.tick(delta)
    // a side left to burn turned by itself
    if (this.rules.flips.length > this.turned) this.onTurned()
    if (this.rules.phase !== this.phase) this.enterPhase(this.rules.phase)
    if (this.revealed) return
    if (this.shown === 'grill' && this.rules.phase === 'grill') this.drawGrill()
    if (this.shown === 'pour') this.drawSauce()
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
    if (spot) this.hand.show(t(LESSON[this.shown]), spot.x, spot.y, 'down', this.shown === 'sides' ? { boxRight: DONE.x - DONE.w / 2 - LESSON_GAP } : {})
    else this.hand.hide()
  }

  /** The turn button's top, the herbs button's top (every ticket wants herbs), the hold button's top. */
  private lessonSpot(): { x: number; y: number } | null {
    if (this.rules.phase !== this.shown) return null
    if (this.shown === 'grill') return { x: FLIP.x, y: FLIP.y - FLIP.h / 2 }
    if (this.shown === 'sides') return { x: SIDES[0].x, y: SIDE_BTN.y - SIDE_BTN.h / 2 }
    return { x: HOLD.x, y: HOLD.y - HOLD.h / 2 }
  }

  /** Clears the card's middle and lays out this step's station. */
  private showStation(s: Station): void {
    for (const o of this.station) o.destroy()
    this.station = []
    this.buttons = []
    this.basket = this.needle = this.sauce = null
    this.patties = []
    this.flipLabel = null
    this.holdButton = null
    this.shown = s
    setInstruction(this.instruction, t(INSTRUCTION[s]))
    this.drawPills(STATIONS.indexOf(s))
    const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.station.push(o)
      return o
    }

    if (s === 'grill') {
      keep(this.add.image(BC_BOX.stove[0], BC_BOX.stove[1], 'bc-stove').setOrigin(0))
      this.patties = BC_PATTIES.map(p => this.add.image(p.x, p.y, 'bc-patty').setScale(p.rx / BC_PATTY.rx, p.ry / BC_PATTY.ry))
      const pattyLines = BC_PATTIES.map(p => this.add.image(p.x, p.y, 'bc-patty-line').setScale(p.rx / BC_PATTY.rx, p.ry / BC_PATTY.ry))
      const frame = this.add.graphics()
      const { hw, hh } = BC_BASKET
      frame.lineStyle(FRAME.wire, hex(C.stoneLight), 1)
      for (let x = -hw + 50; x < hw; x += 50) frame.lineBetween(x, -hh, x, hh)
      frame.lineStyle(FRAME.w + FRAME.ink * 2, hex(C.ink)).strokeRoundedRect(-hw, -hh, hw * 2, hh * 2, 30)
      frame.lineStyle(FRAME.w, hex(C.bamboo)).strokeRoundedRect(-hw, -hh, hw * 2, hh * 2, 30)
      this.basket = keep(this.add.container(BC_BASKET.x, BC_BASKET.y, [...this.patties, ...pattyLines, frame]))
      keep(this.add.image(PHO_BOX.dial[0], PHO_BOX.dial[1], 'pho-dial').setOrigin(0))
      const [lo, hi] = grillBand(this.params.ticket, this.params.hard)
      keep(this.add.graphics())
        .fillStyle(hex(C.mustard), 1)
        .fillRect(PHO_DIAL.x - PHO_DIAL.inner, this.dialY(hi), PHO_DIAL.inner * 2, this.dialY(lo) - this.dialY(hi))
      this.needle = keep(this.add.graphics())
      const button = addButton(this, FLIP.x, FLIP.y, FLIP.w, FLIP.h, t(this.rules.flips.length === 0 ? 'bcFlip' : 'bcTake'), 'primary', () => this.flip())
      this.flipLabel = button.list[1] as Phaser.GameObjects.Text
      this.buttons.push(keep(button))
      this.drawGrill()
    } else if (s === 'sides') {
      keep(this.add.image(BC_BOX.plate[0], BC_BOX.plate[1], 'bc-plate').setOrigin(0))
      for (const side of SIDES) {
        const button = addButton(this, side.x, SIDE_BTN.y, SIDE_BTN.w, SIDE_BTN.h, t(side.key), 'plain', () => this.addSide(side.id, text, keep), SIDE_BTN.size)
        const text = (button.list[1] as Phaser.GameObjects.Text).setX(SIDE_BTN.textDx)
        button.add(this.add.image(SIDE_BTN.iconDx, 0, `bc-${side.id}`))
        this.buttons.push(keep(button))
      }
      this.buttons.push(keep(addButton(this, DONE.x, DONE.y, DONE.w, DONE.h, t('bxDone'), 'primary', () => this.rules.doneSides())))
    } else {
      keep(this.add.image(BC_BOX.bowl[0], BC_BOX.bowl[1], 'bc-bowl').setOrigin(0))
      this.sauce = keep(this.add.graphics())
      const [lo, hi] = sauceBand(this.params.hard)
      const band = keep(this.add.graphics()).fillStyle(hex(C.mustard), SAUCE.bandAlpha)
      band.fillPoints(this.slab(bowlY(lo), bowlY(hi)), true)
      band.lineStyle(SAUCE.ink, hex(C.ink), 0.6).strokePoints(this.slab(bowlY(lo), bowlY(hi)), true)
      const bg = aplusFrame(this.add.graphics(), C.teal, -HOLD.w / 2, -HOLD.h / 2, HOLD.w, HOLD.h, HOLD.h / 2)
      const label = this.add.text(0, 0, t('bcHold'), textStyle(56, '800', C.paper)).setOrigin(0.5)
      this.holdButton = keep(this.add.container(HOLD.x, HOLD.y, [bg, label]).setSize(HOLD.w, HOLD.h).setInteractive())
      this.buttons.push(this.holdButton)
      this.drawSauce()
    }
  }

  private enterPhase(next: BunChaPhase): void {
    const from = this.phase
    this.phase = next
    this.held = false
    // a pour that reached the brim let go on its own, under a finger still down
    this.holdButton?.setScale(1)
    if (from === 'pour' && this.rules.pour && this.rules.sauce > 0) this.pourWord()
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.time.delayedCall(STATION_DELAY_MS, () => {
      if (!this.revealed) this.showStation(next)
    })
  }

  private flip(): void {
    if (this.revealed || this.shown !== 'grill' || this.rules.phase !== 'grill') return
    this.rules.flip()
    this.onTurned()
  }

  /** A side was turned, by the button or by burning: its word rises, the basket turns over and the button says what comes next. */
  private onTurned(): void {
    const last = this.rules.flips.length - 1
    this.turned = this.rules.flips.length
    sound.play('thud')
    this.flipWord(this.rules.flips[last], this.rules.turnedAt[last])
    this.flipLabel?.setText(t('bcTake'))
    if (this.basket) {
      this.tweens.killTweensOf(this.basket)
      this.basket.setScale(1)
      this.tweens.add({ targets: this.basket, scaleY: 0, duration: FRAME.turnMs, yoyo: true, ease: 'Quad.easeIn' })
    }
  }

  /** Vàng đều in the band; else too raw below it or burnt above it. */
  private flipWord(result: BcResult, brown: number): void {
    const [lo] = grillBand(this.params.ticket, this.params.hard)
    const key: StringKey = result === 'in' ? 'bcFlipIn' : brown < lo ? 'bcFlipRaw' : 'bcFlipBurnt'
    this.floatWord(t(key), result === 'in' ? C.teal : C.lantern)
  }

  /** Vừa vạch in the band; else too little below it or too much above it. */
  private pourWord(): void {
    const [lo] = sauceBand(this.params.hard)
    const key: StringKey = this.rules.pour === 'in' ? 'bcPourIn' : this.rules.sauce < lo ? 'bcPourLittle' : 'bcPourLots'
    this.floatWord(t(key), this.rules.pour === 'in' ? C.teal : C.lantern)
  }

  private onDown(over: Phaser.GameObjects.GameObject[]): void {
    if (this.revealed || this.shown !== 'pour' || this.rules.phase !== 'pour' || !this.holdButton || !over.includes(this.holdButton)) return
    this.held = true
    this.holdButton.setScale(0.95)
    this.rules.startPour()
    sound.play('tap')
  }

  private onUp(): void {
    if (!this.held) return
    this.held = false
    this.holdButton?.setScale(1)
    this.rules.stopPour()
  }

  private addSide(id: BcSide, text: Phaser.GameObjects.Text, keep: <T extends Phaser.GameObjects.GameObject>(o: T) => T): void {
    if (this.revealed || this.rules.phase !== 'sides') return
    this.rules.add(id)
    const name = SIDES.find(s => s.id === id)!.key
    text.setText(t('phoCount', { name: t(name), n: this.rules.counts[id] }))
    text.setScale(Math.min(1, SIDE_BTN.textW / text.width))
    // the sides go round the noodles, on the plate's right
    const a = -Math.PI / 2 + Math.random() * Math.PI
    const r = (0.45 + Math.random() * 0.4) * BC_PLATE.r
    const image = keep(this.add.image(BC_PLATE.x + 40 + Math.cos(a) * r, BC_PLATE.y + Math.sin(a) * r * 0.75, `bc-${id}`).setScale(0).setRotation(Math.random() * Math.PI * 2))
    this.tweens.add({ targets: image, scale: 1.3, duration: 180, ease: 'Back.easeOut' })
  }

  /** The patties take the colour of the side over the coals, and the needle climbs the dial. */
  private drawGrill(): void {
    const brown = this.rules.brown
    for (const patty of this.patties) patty.setTint(brownColour(brown))
    const y = this.dialY(brown)
    this.needle
      ?.clear()
      .fillStyle(hex(C.lantern), 1)
      .fillRoundedRect(PHO_DIAL.x - NEEDLE.w / 2, y - NEEDLE.h / 2, NEEDLE.w, NEEDLE.h, NEEDLE.h / 2)
      .lineStyle(NEEDLE.ink, hex(C.ink))
      .strokeRoundedRect(PHO_DIAL.x - NEEDLE.w / 2, y - NEEDLE.h / 2, NEEDLE.w, NEEDLE.h, NEEDLE.h / 2)
  }

  /** The sauce in the bowl, from its bottom up to its fill. */
  private drawSauce(): void {
    this.sauce?.clear()
    if (!this.sauce || this.rules.sauce <= 0) return
    const top = bowlY(this.rules.sauce)
    this.sauce.fillStyle(hex(SAUCE.color), 1).fillPoints(this.slab(BC_BOWL.bottom, top), true)
    this.sauce.lineStyle(SAUCE.shine, hex(C.cloud), SAUCE.shineAlpha).lineBetween(BC_BOWL.x - bowlHalf(top) + SAUCE.shineInset, top + SAUCE.shine, BC_BOWL.x + bowlHalf(top) - SAUCE.shineInset, top + SAUCE.shine)
  }

  /** The bowl's inside between two heights, as the four corners of its slice. */
  private slab(bottom: number, top: number): Phaser.Math.Vector2[] {
    const V = Phaser.Math.Vector2
    return [new V(BC_BOWL.x - bowlHalf(bottom), bottom), new V(BC_BOWL.x + bowlHalf(bottom), bottom), new V(BC_BOWL.x + bowlHalf(top), top), new V(BC_BOWL.x - bowlHalf(top), top)]
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
