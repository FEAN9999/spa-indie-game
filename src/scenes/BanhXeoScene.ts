import * as Phaser from 'phaser'
import { BX_PAN_BOX, BX_PAN_R } from '../art/banhXeoArt'
import { C } from '../art/palette'
import { PHO_BOX, PHO_DIAL } from '../art/phoArt'
import { sound } from '../audio/engine'
import { BX_PAN, BX_RING, BX_SECTORS } from '../config'
import { BanhXeoGame, foldBand, spreadSectors, type BanhXeoPhase, type BanhXeoTicket, type BxTopping } from '../sim/banhXeo'
import type { Stars } from '../sim/economy'
import { t, type StringKey } from '../strings/vi'
import { addPills, addTicket, type CookData } from '../view/cook'
import { HandPointer } from '../view/HandPointer'
import { addMiniGameCard, drawBars, revealStars, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

type Station = Exclude<BanhXeoPhase, 'done'>
const STATIONS: Station[] = ['spread', 'fill', 'fold']
const INSTRUCTION: Record<Station, StringKey> = { spread: 'bxSpread', fill: 'bxFill', fold: 'bxFoldTip' }
const STEP: Record<Station, StringKey> = { spread: 'bxStepSpread', fill: 'bxStepFill', fold: 'bxStepFold' }
/** The first game's lesson line for each station. */
const LESSON: Record<Station, StringKey> = { spread: 'bxLearnSpread', fill: 'bxLearnFill', fold: 'bxLearnFold' }
const TRAIL_W = 14
/** Where the lesson's hand points for the swirl: inside the ring, above the pan's middle. */
const SWIRL_SPOT = { x: BX_PAN.x, y: BX_PAN.y - 180 }
/** The filling buttons in a row under the pan, each with its picture; Xong to the pan's right; the fold button under the pan. */
const FILLINGS: { id: BxTopping; key: StringKey; x: number }[] = [
  { id: 'tom', key: 'bxTomTap', x: 250 },
  { id: 'thit', key: 'bxThitTap', x: 540 },
  { id: 'gia', key: 'bxGiaTap', x: 830 },
]
const FILLING_BTN = { y: 1500, w: 260, h: 110, iconDx: -80, textDx: 28, size: 40 }
const DONE = { x: 880, y: 1330, w: 240, h: 120 }
const FOLD = { x: 540, y: 1520, w: 440, h: 120 }
const NEEDLE = { w: 120, h: 22, ink: 4 }
/** The batter's colour runs from raw cream through golden to dark brown as it browns. */
const BROWN = [C.cream, C.mustard, C.woodDark]
const BATTER_INK = 4
/** A word rises from where it is said and fades; a long line is scaled down to fit the card. */
const WORD = { size: 60, stroke: 12, risePx: 80, ms: 700, y: 870, x: BX_PAN.x, maxW: 880 }
/** The last move of a step stays on screen this long before the next station. */
const STATION_DELAY_MS = 700
const DEPTH = { word: 10 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** The batter's colour at a brown from 0 to 1. */
function brownColour(k: number): number {
  const half = k < 0.5 ? 0 : 1
  const [from, to] = [Phaser.Display.Color.HexStringToColor(BROWN[half]), Phaser.Display.Color.HexStringToColor(BROWN[half + 1])]
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, (k * 2 - half) * 100)
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b)
}

/** Cooking Bánh xèo over the frozen shops: swirl the batter round the pan, add the ticket's fillings, and fold when it browns into the ticket's band. */
export class BanhXeoScene extends Phaser.Scene {
  private params!: CookData<BanhXeoTicket>
  private rules!: BanhXeoGame
  /** The rules' phase as last seen, and the station on the card, which follows it after a short pause. */
  private phase: BanhXeoPhase = 'spread'
  private shown: Station = 'spread'
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private drawPills!: (at: number) => void
  /** The lesson's hand, only in the first Bánh xèo. */
  private hand: HandPointer | null = null
  /** Everything of the station on the card, and its buttons, which go at the reveal. */
  private station: Phaser.GameObjects.GameObject[] = []
  private buttons: Phaser.GameObjects.GameObject[] = []
  /** The swirl under way in the pan, as its points. */
  private swipe: { x: number; y: number }[] | null = null
  private trail: Phaser.GameObjects.Graphics | null = null
  private batter: Phaser.GameObjects.Graphics | null = null
  private needle: Phaser.GameObjects.Graphics | null = null
  /** The fillings dropped on the batter, kept to lay them again on the next station, and their pictures there. */
  private bits: { id: BxTopping; x: number; y: number; rotation: number }[] = []
  private bitImages: Phaser.GameObjects.Image[] = []
  private revealed = false

  constructor() {
    super('BanhXeoScene')
  }

  init(data: CookData<BanhXeoTicket>) {
    this.params = data
  }

  create() {
    this.rules = new BanhXeoGame(this.params.ticket, this.params.hard)
    this.phase = 'spread'
    this.station = []
    this.buttons = []
    this.swipe = null
    this.bits = []
    this.bitImages = []
    this.revealed = false

    this.instruction = addMiniGameCard(this, t('bxSpread'))
    addTicket(this, 'banhXeo', this.params.ticket)
    this.drawPills = addPills(this, STATIONS.map(s => t(STEP[s])))
    this.hand = this.params.demo ? new HandPointer(this) : null
    this.bars = this.add.graphics()
    this.showStation('spread')

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
    if (this.shown === 'fold') this.updateFold()
    this.pointLesson()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a crêpe. */
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

  /** Inside the pan for the swirl, the shrimp button's top for the fillings, the fold button's top for the fold. */
  private lessonSpot(): { x: number; y: number } | null {
    if (this.rules.phase !== this.shown) return null
    if (this.shown === 'spread') return SWIRL_SPOT
    if (this.shown === 'fill') return { x: FILLINGS[0].x, y: FILLING_BTN.y - FILLING_BTN.h / 2 }
    return { x: FOLD.x, y: FOLD.y - FOLD.h / 2 }
  }

  /** Clears the card's middle and lays out this step's station. */
  private showStation(s: Station): void {
    for (const o of this.station) o.destroy()
    this.station = []
    this.buttons = []
    this.bitImages = []
    this.trail = this.batter = this.needle = null
    this.shown = s
    setInstruction(this.instruction, t(INSTRUCTION[s]))
    this.drawPills(STATIONS.indexOf(s))
    const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.station.push(o)
      return o
    }

    keep(this.add.image(BX_PAN_BOX[0], BX_PAN_BOX[1], 'bx-pan').setOrigin(0))
    this.batter = keep(this.add.graphics())
    if (s === 'spread') {
      this.trail = keep(this.add.graphics())
      return
    }
    this.drawBatter(brownColour(this.rules.brown))
    for (const bit of this.bits) this.bitImages.push(keep(this.add.image(bit.x, bit.y, `bx-${bit.id}`).setRotation(bit.rotation)))
    if (s === 'fill') {
      for (const f of FILLINGS) {
        const button = addButton(this, f.x, FILLING_BTN.y, FILLING_BTN.w, FILLING_BTN.h, t(f.key), 'plain', () => this.addFilling(f.id, text), FILLING_BTN.size)
        const text = (button.list[1] as Phaser.GameObjects.Text).setX(FILLING_BTN.textDx)
        button.add(this.add.image(FILLING_BTN.iconDx, 0, `bx-${f.id}`))
        this.buttons.push(keep(button))
      }
      this.buttons.push(keep(addButton(this, DONE.x, DONE.y, DONE.w, DONE.h, t('bxDone'), 'primary', () => this.rules.doneFilling())))
    } else {
      keep(this.add.image(PHO_BOX.dial[0], PHO_BOX.dial[1], 'pho-dial').setOrigin(0))
      const [lo, hi] = foldBand(this.params.ticket, this.params.hard)
      const band = keep(this.add.graphics()).fillStyle(hex(C.mustard), 1)
      band.fillRect(PHO_DIAL.x - PHO_DIAL.inner, this.dialY(hi), PHO_DIAL.inner * 2, this.dialY(lo) - this.dialY(hi))
      this.needle = keep(this.add.graphics())
      this.buttons.push(keep(addButton(this, FOLD.x, FOLD.y, FOLD.w, FOLD.h, t('bxFold'), 'primary', () => this.rules.foldNow())))
    }
  }

  private enterPhase(next: BanhXeoPhase): void {
    const from = this.phase
    this.phase = next
    if (next === 'done') {
      // folded by the button or burnt through, not cut short by the clock
      if (from === 'fold' && (this.rules.brown >= 1 || this.rules.elapsedMs < this.rules.limitMs)) this.foldCrepe()
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.time.delayedCall(STATION_DELAY_MS, () => {
      if (!this.revealed) this.showStation(next)
    })
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed || this.shown !== 'spread' || this.rules.phase !== 'spread') return
    if (Math.hypot(p.x - BX_PAN.x, p.y - BX_PAN.y) <= BX_RING.outer) this.swipe = [{ x: p.x, y: p.y }]
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.swipe || !this.trail) return
    this.swipe.push({ x: p.x, y: p.y })
    this.trail.clear().lineStyle(TRAIL_W, hex(C.cream), 0.85)
    this.trail.strokePoints(this.swipe.map(q => new Phaser.Math.Vector2(q.x, q.y)))
  }

  /** On lift the swirl is judged; a counted one paints the batter where it reached. */
  private onUp(): void {
    const pts = this.swipe
    this.swipe = null
    this.trail?.clear()
    if (!pts || this.revealed || this.rules.phase !== 'spread') return
    const result = this.rules.swirl(pts)
    if (result === 'short') {
      this.floatWord(t('bxSpreadShort'), C.lantern)
      return
    }
    if (!result) return
    sound.play('foam')
    const step = (Math.PI * 2) / BX_SECTORS
    for (const i of spreadSectors(pts)) {
      const from = -Math.PI + i * step
      this.batter?.fillStyle(hex(C.cream), 1).beginPath().slice(BX_PAN.x, BX_PAN.y, BX_PAN_R.batter, from, from + step).closePath().fillPath()
    }
    this.floatWord(t(result === 'good' ? 'bxSpreadGood' : 'bxSpreadThin'), result === 'good' ? C.teal : C.lantern)
  }

  private addFilling(id: BxTopping, text: Phaser.GameObjects.Text): void {
    if (this.revealed || this.rules.phase !== 'fill') return
    this.rules.add(id)
    const name = FILLINGS.find(f => f.id === id)!.key
    text.setText(t('phoCount', { name: t(name), n: this.rules.counts[id] }))
    const a = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * 0.75 * BX_PAN_R.batter
    const bit = { id, x: BX_PAN.x + Math.cos(a) * r, y: BX_PAN.y + Math.sin(a) * r, rotation: Math.random() * Math.PI * 2 }
    this.bits.push(bit)
    const image = this.add.image(bit.x, bit.y, `bx-${id}`).setScale(0).setRotation(bit.rotation)
    this.station.push(image)
    this.bitImages.push(image)
    this.tweens.add({ targets: image, scale: 1, duration: 180, ease: 'Back.easeOut' })
  }

  /** The batter browns and the needle climbs the dial. */
  private updateFold(): void {
    this.drawBatter(brownColour(this.rules.brown))
    const y = this.dialY(this.rules.brown)
    this.needle
      ?.clear()
      .fillStyle(hex(C.lantern), 1)
      .fillRoundedRect(PHO_DIAL.x - NEEDLE.w / 2, y - NEEDLE.h / 2, NEEDLE.w, NEEDLE.h, NEEDLE.h / 2)
      .lineStyle(NEEDLE.ink, hex(C.ink))
      .strokeRoundedRect(PHO_DIAL.x - NEEDLE.w / 2, y - NEEDLE.h / 2, NEEDLE.w, NEEDLE.h, NEEDLE.h / 2)
  }

  /** The whole batter disc in the pan. */
  private drawBatter(colour: number): void {
    this.batter?.clear().fillStyle(colour, 1).fillCircle(BX_PAN.x, BX_PAN.y, BX_PAN_R.batter).lineStyle(BATTER_INK, hex(C.ink)).strokeCircle(BX_PAN.x, BX_PAN.y, BX_PAN_R.batter)
  }

  /** The top half folds down over the fillings into a half-disc, which stays until the reveal, and the fold is named. */
  private foldCrepe(): void {
    sound.play('thud')
    for (const image of this.bitImages) image.destroy()
    this.bitImages = []
    const colour = brownColour(this.rules.brown)
    this.batter
      ?.clear()
      .fillStyle(colour, 1)
      .beginPath()
      .slice(BX_PAN.x, BX_PAN.y, BX_PAN_R.batter, 0, Math.PI)
      .closePath()
      .fillPath()
      .lineStyle(BATTER_INK, hex(C.ink))
      .strokePath()
    const [lo] = foldBand(this.params.ticket, this.params.hard)
    const key: StringKey = this.rules.fold === 'in' ? 'bxFoldIn' : this.rules.brown < lo ? 'bxFoldSoft' : 'bxFoldBurnt'
    this.floatWord(t(key), this.rules.fold === 'in' ? C.teal : C.lantern)
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

  /** The y on the dial of a needle at k, from empty at 0 to full at 1. */
  private dialY(k: number): number {
    return PHO_DIAL.empty - (PHO_DIAL.empty - PHO_DIAL.full) * k
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / this.rules.limitMs)
  }
}
