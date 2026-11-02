import * as Phaser from 'phaser'
import { BC_BOX } from '../art/bunChaArt'
import { CT_BOX, CT_RICE } from '../art/comTamArt'
import { C } from '../art/palette'
import { PHO_BOX, PHO_DIAL } from '../art/phoArt'
import { sound } from '../audio/engine'
import { CT_BURN_MS, CT_OIL_AT } from '../config'
import { ComTamGame, ctHeat, type ComTamPhase, type ComTamTicket, type CtPart } from '../sim/comTam'
import type { Stars } from '../sim/economy'
import { createRng } from '../sim/rng'
import { t, type StringKey } from '../strings/vi'
import { addPills, addTicket, type CookData } from '../view/cook'
import { HandPointer } from '../view/HandPointer'
import { addMiniGameCard, drawBars, revealStars, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

type Station = Exclude<ComTamPhase, 'done'>
const STATIONS: Station[] = ['grill', 'top', 'oil']
const INSTRUCTION: Record<Station, StringKey> = { grill: 'ctGrill', top: 'ctTop', oil: 'ctOil' }
const STEP: Record<Station, StringKey> = { grill: 'ctStepGrill', top: 'ctStepTop', oil: 'ctStepOil' }
/** The first game's lesson line for each station. */
const LESSON: Record<Station, StringKey> = { grill: 'ctLearnGrill', top: 'ctLearnTop', oil: 'ctLearnOil' }
/** The side buttons in a row under the plate, each with its picture; Xong to the plate's right. */
const PARTS: { id: CtPart; key: StringKey; x: number }[] = [
  { id: 'bi', key: 'ctBiTap', x: 180 },
  { id: 'cha', key: 'ctChaTap', x: 400 },
  { id: 'trung', key: 'ctTrungTap', x: 620 },
  { id: 'chua', key: 'ctChuaTap', x: 840 },
]
const PART_BTN = { y: 1500, w: 205, h: 110, iconDx: -64, textDx: 34, textW: 136, size: 36 }
const DONE = { x: 880, y: 1330, w: 240, h: 120 }
/** The sides lesson's box stops this far left of the Xong button. */
const LESSON_GAP = 20
/** The chop on the grill: its middle; and the coals' glow along the stove's top, brighter as the heat rises. */
const CHOP = { x: 440, y: 1105 }
const COALS = { x: 140, y: 1205, w: 600, h: 60, alpha: 0.75 }
/** Where a finger fans: over the stove and the fan under it; the fan picture and how far it swings with each fan. */
const FAN_AREA = { left: 90, right: 790, top: 830, bottom: 1600 }
const FAN = { x: 440, y: 1505, swing: 0.35, ms: 90 }
const NEEDLE = { w: 120, h: 22, ink: 4 }
/** The chop on the plate, and where the sides go: round the rice's right, clear of the chop. */
const PLATED = { x: 450, y: 1080 }
/** An oil spot's glow while lit, and the drops it leaves when caught. */
const SPOT = { r: 46, drop: 9 }
/** A word rises from where it is said and fades; a long line is scaled down to fit the card. */
const WORD = { size: 60, stroke: 12, risePx: 80, ms: 700, x: 440, y: 870, maxW: 880 }
/** The last move of a step stays on screen this long before the next station. */
const STATION_DELAY_MS = 700
const DEPTH = { word: 10 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** Cooking Cơm tấm over the frozen shops: fan the coals to keep the heat in the band while the chop grills, lay the ticket's sides, and catch the scallion oil spots as they light on the plate. */
export class ComTamScene extends Phaser.Scene {
  private params!: CookData<ComTamTicket>
  private rules!: ComTamGame
  /** The rules' phase as last seen, and the station on the card, which follows it after a short pause. */
  private phase: ComTamPhase = 'grill'
  private shown: Station = 'grill'
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private drawPills!: (at: number) => void
  /** The lesson's hand, only in the first Cơm tấm. */
  private hand: HandPointer | null = null
  /** Everything of the station on the card, and its buttons, which go at the reveal. */
  private station: Phaser.GameObjects.GameObject[] = []
  private buttons: Phaser.GameObjects.GameObject[] = []
  /** Miếng sườn trên vỉ: lớp sống ở dưới, lớp chín và lớp cháy chồng lên hiện dần, và vết vỉ hiện khi chín. */
  private chop: { cooked: Phaser.GameObjects.Image; burnt: Phaser.GameObjects.Image; marks: Phaser.GameObjects.Image } | null = null
  private coals: Phaser.GameObjects.Graphics | null = null
  private needle: Phaser.GameObjects.Graphics | null = null
  private fan: Phaser.GameObjects.Image | null = null
  private spot: Phaser.GameObjects.Graphics | null = null
  /** The sides laid on the plate and the oil caught, kept to lay them again on the next station. */
  private bits: { texture: string; x: number; y: number; rotation: number }[] = []
  private drops: { x: number; y: number }[] = []
  /** Where the fanning finger was last seen. */
  private fanX: number | null = null
  private revealed = false

  constructor() {
    super('ComTamScene')
  }

  init(data: CookData<ComTamTicket>) {
    this.params = data
  }

  create() {
    // the oil spots' places come from a stream of their own, as the spa games' do
    this.rules = new ComTamGame(this.params.ticket, this.params.hard, createRng(Date.now()))
    this.phase = 'grill'
    this.station = []
    this.buttons = []
    this.bits = []
    this.drops = []
    this.fanX = null
    this.revealed = false

    this.instruction = addMiniGameCard(this, t('ctGrill'))
    addTicket(this, 'comTam', this.params.ticket)
    this.drawPills = addPills(this, STATIONS.map(s => t(STEP[s])))
    this.hand = this.params.demo ? new HandPointer(this) : null
    this.bars = this.add.graphics()
    this.showStation('grill')

    oneFinger(this.input, {
      down: p => this.onDown(p),
      move: p => this.onMove(p),
      up: () => (this.fanX = null),
    })
  }

  update(time: number, delta: number) {
    if (this.revealed) return
    const faded = this.rules.tick(delta)
    if (faded) this.floatWord(t('ctOilFaded'), C.lantern)
    if (this.rules.phase !== this.phase) this.enterPhase(this.rules.phase)
    if (this.revealed) return
    if (this.shown === 'grill' && this.rules.phase === 'grill') this.drawGrill()
    if (this.shown === 'oil') this.drawSpot(time)
    this.pointLesson()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a plate. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The first game's hand: this station's line, pointing at its target; nowhere to point hides it. */
  private pointLesson(): void {
    if (!this.hand) return
    const spot = this.rules.phase === this.shown ? this.lessonSpot() : null
    if (spot) this.hand.show(t(LESSON[this.shown]), spot.x, spot.y, 'down', this.shown === 'top' ? { boxRight: DONE.x - DONE.w / 2 - LESSON_GAP } : {})
    else this.hand.hide()
  }

  /** The fan's top for the grill, the ticket's side button for the sides, the lit spot for the oil (none between spots). */
  private lessonSpot(): { x: number; y: number } | null {
    if (this.shown === 'grill') return { x: FAN.x, y: FAN.y - 70 }
    if (this.shown === 'top') return { x: PARTS.find(p => p.id === this.params.ticket.combo)!.x, y: PART_BTN.y - PART_BTN.h / 2 }
    const lit = this.rules.litSpot()
    return lit === null ? null : { x: CT_OIL_AT[lit].x, y: CT_OIL_AT[lit].y - SPOT.r }
  }

  /** Clears the card's middle and lays out this step's station. */
  private showStation(s: Station): void {
    for (const o of this.station) o.destroy()
    this.station = []
    this.buttons = []
    this.chop = this.coals = this.needle = this.spot = null
    this.fan = null
    this.shown = s
    setInstruction(this.instruction, t(INSTRUCTION[s]))
    this.drawPills(STATIONS.indexOf(s))
    const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.station.push(o)
      return o
    }

    if (s === 'grill') {
      keep(this.add.image(BC_BOX.stove[0], BC_BOX.stove[1], 'bc-stove').setOrigin(0))
      this.coals = keep(this.add.graphics())
      keep(this.add.image(CHOP.x, CHOP.y, 'ct-grill-chop-raw'))
      this.chop = {
        cooked: keep(this.add.image(CHOP.x, CHOP.y, 'ct-grill-chop-cooked')),
        burnt: keep(this.add.image(CHOP.x, CHOP.y, 'ct-grill-chop-burnt')),
        marks: keep(this.add.image(CHOP.x, CHOP.y, 'ct-grill-chop-marks')),
      }
      keep(this.add.image(CHOP.x, CHOP.y, 'ct-grill-chop-line'))
      keep(this.add.image(PHO_BOX.dial[0], PHO_BOX.dial[1], 'pho-dial').setOrigin(0))
      const h = ctHeat(this.params.hard)
      const marks = keep(this.add.graphics())
      marks.fillStyle(hex(C.mustard), 1).fillRect(PHO_DIAL.x - PHO_DIAL.inner, this.dialY(h.band[1]), PHO_DIAL.inner * 2, this.dialY(h.band[0]) - this.dialY(h.band[1]))
      marks.fillStyle(hex(C.lantern), 0.85).fillRect(PHO_DIAL.x - PHO_DIAL.inner, this.dialY(1), PHO_DIAL.inner * 2, this.dialY(h.burn) - this.dialY(1))
      this.needle = keep(this.add.graphics())
      this.fan = keep(this.add.image(FAN.x, FAN.y, 'ct-fan'))
      this.drawGrill()
      return
    }
    keep(this.add.image(CT_BOX.plate[0], CT_BOX.plate[1], 'ct-plate').setOrigin(0))
    const plated = keep(this.add.image(PLATED.x, PLATED.y, 'ct-suon'))
    if (this.rules.grill === 'far') plated.setTint(hex(C.stoneLight))
    for (const bit of this.bits) keep(this.add.image(bit.x, bit.y, bit.texture).setRotation(bit.rotation))
    if (s === 'top') {
      for (const part of PARTS) {
        const button = addButton(this, part.x, PART_BTN.y, PART_BTN.w, PART_BTN.h, t(part.key), 'plain', () => this.addPart(part.id, text, keep), PART_BTN.size)
        const text = (button.list[1] as Phaser.GameObjects.Text).setX(PART_BTN.textDx)
        text.setScale(Math.min(1, PART_BTN.textW / text.width))
        button.add(this.add.image(PART_BTN.iconDx, 0, `ct-${part.id}`).setScale(0.85))
        this.buttons.push(keep(button))
      }
      this.buttons.push(keep(addButton(this, DONE.x, DONE.y, DONE.w, DONE.h, t('bxDone'), 'primary', () => this.rules.doneTopping())))
    } else {
      this.spot = keep(this.add.graphics())
    }
  }

  private enterPhase(next: ComTamPhase): void {
    const from = this.phase
    this.phase = next
    this.fanX = null
    if (from === 'grill' && this.rules.grill) {
      const key: StringKey = this.rules.grill === 'in' ? 'ctGrillIn' : this.rules.grill === 'near' ? 'ctGrillNear' : 'ctGrillFar'
      this.floatWord(t(key), this.rules.grill === 'in' ? C.teal : C.lantern)
    }
    if (next === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.time.delayedCall(STATION_DELAY_MS, () => {
      if (!this.revealed) this.showStation(next)
    })
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed || this.rules.phase !== this.shown) return
    if (this.shown === 'grill' && p.x >= FAN_AREA.left && p.x <= FAN_AREA.right && p.y >= FAN_AREA.top && p.y <= FAN_AREA.bottom) this.fanX = p.x
    else if (this.shown === 'oil' && this.rules.tap(p.x, p.y) === 'caught') this.caught()
  }

  /** Fanning: the finger's travel across turns into fans, and each swings the fan. */
  private onMove(p: Phaser.Input.Pointer): void {
    if (this.fanX === null || this.rules.phase !== 'grill') return
    const fans = this.rules.fan(p.x - this.fanX)
    const dir = Math.sign(p.x - this.fanX)
    this.fanX = p.x
    if (fans > 0 && this.fan) {
      this.tweens.killTweensOf(this.fan)
      this.fan.setRotation(0)
      this.tweens.add({ targets: this.fan, rotation: FAN.swing * (dir || 1), duration: FAN.ms, yoyo: true, ease: 'Sine.easeOut' })
    }
  }

  /** The coals glow with the heat, the chop browns and takes its grill marks as it grills and darkens as it burns, and the needle shows the heat. */
  private drawGrill(): void {
    const { heat, done, burnMs } = this.rules
    this.coals?.clear().fillStyle(hex(C.stoneHot), COALS.alpha * heat).fillRoundedRect(COALS.x, COALS.y, COALS.w, COALS.h, COALS.h / 2)
    // sống → chín theo `done`, rồi cháy theo thời gian quá lửa: cùng tỉ lệ pha màu như trước, nay pha giữa ba lớp màu thật
    this.chop?.cooked.setAlpha(Phaser.Math.Clamp(done, 0, 1))
    this.chop?.burnt.setAlpha(Phaser.Math.Clamp(burnMs / CT_BURN_MS.near, 0, 1))
    this.chop?.marks.setAlpha(done)
    const y = this.dialY(heat)
    this.needle
      ?.clear()
      .fillStyle(hex(C.ink), 1)
      .fillRoundedRect(PHO_DIAL.x - NEEDLE.w / 2, y - NEEDLE.h / 2, NEEDLE.w, NEEDLE.h, NEEDLE.h / 2)
      .lineStyle(NEEDLE.ink, hex(C.cream))
      .strokeRoundedRect(PHO_DIAL.x - NEEDLE.w / 2, y - NEEDLE.h / 2, NEEDLE.w, NEEDLE.h, NEEDLE.h / 2)
  }

  /** The lit spot pulses on the rice, and the oil caught so far shows as green drops. */
  private drawSpot(time: number): void {
    const g = this.spot?.clear()
    if (!g) return
    g.fillStyle(hex(C.leafLight), 1)
    for (const d of this.drops) g.fillCircle(d.x, d.y, SPOT.drop)
    const lit = this.rules.litSpot()
    if (lit === null) return
    const at = CT_OIL_AT[lit]
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(time / 180))
    g.fillStyle(hex(C.mustard), 0.3 + 0.35 * pulse).fillCircle(at.x, at.y, SPOT.r)
    g.lineStyle(5, hex(C.mustardDark), 1).strokeCircle(at.x, at.y, SPOT.r)
  }

  /** The caught spot leaves a few drops of scallion oil where it was. */
  private caught(): void {
    sound.play('foam')
    const at = CT_OIL_AT[this.rules.spots[this.rules.caught.length - 1]]
    for (const [dx, dy] of [[-16, -8], [12, -12], [0, 10], [18, 12], [-14, 14]]) this.drops.push({ x: at.x + dx, y: at.y + dy })
    this.floatWord(t('ctOilCaught'), C.teal)
  }

  /** A side goes onto the rice round its right, clear of the chop. */
  private addPart(id: CtPart, text: Phaser.GameObjects.Text, keep: <T extends Phaser.GameObjects.GameObject>(o: T) => T): void {
    if (this.revealed || this.rules.phase !== 'top') return
    this.rules.add(id)
    const name = PARTS.find(p => p.id === id)!.key
    text.setText(t('phoCount', { name: t(name), n: this.rules.counts[id] })).setScale(1)
    text.setScale(Math.min(1, PART_BTN.textW / text.width))
    const a = -Math.PI / 2 + Math.random() * Math.PI
    const bit = { texture: `ct-${id}`, x: CT_RICE.x + 90 + Math.cos(a) * CT_RICE.rx * 0.55, y: CT_RICE.y + Math.sin(a) * CT_RICE.ry * 0.7, rotation: (Math.random() - 0.5) * 0.8 }
    this.bits.push(bit)
    const image = keep(this.add.image(bit.x, bit.y, bit.texture).setScale(0).setRotation(bit.rotation))
    this.tweens.add({ targets: image, scale: 1.2, duration: 180, ease: 'Back.easeOut' })
  }

  private floatWord(words: string, colour: string): void {
    const word = this.add.text(WORD.x, WORD.y, words, textStyle(WORD.size, '800', colour)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    word.setScale(Math.min(1, WORD.maxW / word.width))
    this.tweens.add({ targets: word, y: { value: word.y - WORD.risePx, ease: 'Quad.easeOut' }, alpha: { value: 0, ease: 'Quad.easeIn' }, duration: WORD.ms, onComplete: () => word.destroy() })
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.fanX = null
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
