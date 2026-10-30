import * as Phaser from 'phaser'
import { MUD_ORIGIN } from '../art/mudArt'
import { C, customerColors } from '../art/palette'
import { GAME_W, MUD_LIMIT_MS, MUD_STARS } from '../config'
import type { Stars } from '../sim/economy'
import { MudGame, type MudFeel } from '../sim/mud'
import { createRng } from '../sim/rng'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'

/** The heat column at the card's left: the mark runs from 0 at `bottom` to 1 at `top`, and the round ends reach half the width past them. */
const COLUMN = { x: 200, w: 110, top: 560, bottom: 1300, ink: 5, stripPx: 4 }
/** The column's colours from cold at the bottom to hot at the top, each from its share of the way up. */
const HEAT = [
  { at: 0, color: C.waterDeep },
  { at: 0.38, color: C.water },
  { at: 0.64, color: C.glow },
  { at: 0.82, color: C.mustard },
  { at: 1, color: C.lantern },
]
/** The green band is see-through over the column, and stronger while the mark is inside it. */
const BAND = { alpha: 0.45, insideAlpha: 0.8, edge: 5 }
/** The mark: an ink bar a little wider than the column, with a cream knob at its right end. */
const MARK = { overhang: 12, h: 14, knobR: 18 }
/** The head's centre in the card's right part; every mud picture is drawn from it with MUD_ORIGIN. The tub's foot is 322 px under it. */
const TUB = { x: 640, y: 780 }
/** The steam is faint over cold mud and full over the hottest. */
const STEAM_MIN_ALPHA = 0.08
/** The line under the tub saying how the customer feels. */
const SAY = { y: 1160, size: 46 }
const LINES: Record<MudFeel, { key: StringKey; color: string }> = {
  ok: { key: 'mudOk', color: C.teal },
  cold: { key: 'mudCold', color: C.cobalt },
  hot: { key: 'mudHot', color: C.lantern },
}
/** The hold button across the card's foot, just over the time bar, tall for a thumb; it sinks a little while held. */
const HOLD = { x: GAME_W / 2, y: 1500, w: 800, h: 160, size: 56, sinkPx: 6 }
/** The demo hand's fingertip rests on the button's right end, clear of the label. */
const DEMO = { x: HOLD.x + 350, y: HOLD.y + 20, alpha: 0.6, hoverPx: 50, dipMs: 160, pressScale: 0.92 }
const DEPTH = { hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** Blends two 0xRRGGBB colours, `k` from 0 to 1. */
const mix = (a: number, b: number, k: number) =>
  [16, 8, 0].reduce((out, shift) => out | (Math.round(Phaser.Math.Linear((a >> shift) & 255, (b >> shift) & 255, k)) << shift), 0)
/** The column's colour `k` of the way up, blended between the two stops round it. */
const heatColor = (k: number): number => {
  const i = Math.max(1, HEAT.findIndex(s => s.at >= k))
  const [a, b] = [HEAT[i - 1], HEAT[i]]
  return mix(hex(a.color), hex(b.color), (k - a.at) / (b.at - a.at))
}
/** Where a heat from 0 to 1 sits on the column. */
const markY = (heat: number) => Phaser.Math.Linear(COLUMN.bottom, COLUMN.top, heat)

/** Close-up Tắm bùn mini-game over the frozen spa: hold the button to add hot water, and keep the heat mark inside the drifting green band. */
export class MudScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: MudGame
  /** The band and the mark, redrawn each frame over the column. */
  private gauge!: Phaser.GameObjects.Graphics
  private steam!: Phaser.GameObjects.Image
  private face!: Phaser.GameObjects.Image
  private line!: Phaser.GameObjects.Text
  /** What the face and the line show. */
  private feel: MudFeel | null = null
  private button!: Phaser.GameObjects.Container
  private buttonFill!: Phaser.GameObjects.Graphics
  private held = false
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** The faint hand on the button until the first touch, and how far into its press it is. */
  private demoHand: Phaser.GameObjects.Image | null = null
  private press = 0

  constructor() {
    super('MudScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the mud game takes no day-ease time
    this.rules = new MudGame(createRng(Date.now()), this.params.hard)
    this.feel = null
    this.held = false
    this.revealed = false
    this.demoHand = null
    this.press = 0

    const colors = customerColors(this.params.look, this.params.kind)
    this.instruction = addMiniGameCard(this, t('mudTap'))
    this.addColumn()
    this.gauge = this.add.graphics()
    const o = MUD_ORIGIN
    const part = (key: string, origin: { x: number; y: number }) => this.add.image(TUB.x, TUB.y, key).setOrigin(origin.x, origin.y)
    this.steam = part('mud-steam', o.steam)
    part('mud-head', o.head).setTint(colors.skin)
    part('mud-head-line', o.head)
    part('mud-towel', o.head)
    this.face = part('mud-face-ok', o.head)
    part('mud-tub', o.tub)
    this.line = this.add.text(TUB.x, SAY.y, '', textStyle(SAY.size)).setOrigin(0.5)
    this.addHoldButton()
    this.bars = this.add.graphics()
    if (this.params.demo) this.showDemo()

    // the finger on the button holds; lifted anywhere, even off the button or the game, it lets go
    oneFinger(this.input, {
      down: (_, over) => {
        this.hideDemo()
        if (over.includes(this.button)) this.setHeld(true)
      },
      up: () => this.setHeld(false),
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.rules.tick(delta)
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.drawGauge()
    this.showFeel(this.rules.feel())
    this.steam.setAlpha(Phaser.Math.Linear(STEAM_MIN_ALPHA, 1, this.rules.mark))
    this.moveDemo(delta)
    drawBars(this.bars, this.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The column, cold blue at the bottom to red at the top, in thin strips between its round ends; inked round. */
  private addColumn(): void {
    const { x, w, top, bottom, ink, stripPx } = COLUMN
    const g = this.add.graphics()
    g.fillStyle(hex(HEAT[0].color), 1).fillCircle(x, bottom, w / 2)
    g.fillStyle(hex(HEAT[HEAT.length - 1].color), 1).fillCircle(x, top, w / 2)
    for (let y = top; y < bottom; y += stripPx) g.fillStyle(heatColor((bottom - y) / (bottom - top)), 1).fillRect(x - w / 2, y, w, stripPx)
    g.lineStyle(ink, hex(C.ink)).strokeRoundedRect(x - w / 2, top - w / 2, w, bottom - top + w, w / 2)
  }

  /** The band, inside the column's ink, and the mark across it. */
  private drawGauge(): void {
    const { x, w, ink } = COLUMN
    const { mark, band, half } = this.rules
    const inside = this.rules.feel() === 'ok'
    const [left, width] = [x - w / 2 + ink / 2, w - ink]
    const [bandTop, bandBottom] = [markY(band + half), markY(band - half)]
    const g = this.gauge.clear()
    g.fillStyle(hex(C.leaf), inside ? BAND.insideAlpha : BAND.alpha).fillRect(left, bandTop, width, bandBottom - bandTop)
    g.fillStyle(hex(C.tealDark), 1).fillRect(left, bandTop - BAND.edge / 2, width, BAND.edge).fillRect(left, bandBottom - BAND.edge / 2, width, BAND.edge)
    const y = markY(mark)
    g.fillStyle(hex(C.ink), 1).fillRoundedRect(x - w / 2 - MARK.overhang, y - MARK.h / 2, w + 2 * MARK.overhang, MARK.h, MARK.h / 2)
    g.fillStyle(hex(C.cream), 1).fillCircle(x + w / 2 - MARK.knobR, y, MARK.knobR)
    g.lineStyle(ink, hex(C.ink)).strokeCircle(x + w / 2 - MARK.knobR, y, MARK.knobR)
  }

  /** The face in the tub and the line under it follow the heat. */
  private showFeel(feel: MudFeel): void {
    if (feel === this.feel) return
    this.feel = feel
    this.face.setTexture(`mud-face-${feel}`)
    this.line.setText(t(LINES[feel].key)).setColor(LINES[feel].color)
  }

  /** Drawn like the house primary button, but held rather than tapped. */
  private addHoldButton(): void {
    this.buttonFill = this.add.graphics()
    const label = this.add.text(0, 0, t('mudHold'), textStyle(HOLD.size, '800', C.paper)).setOrigin(0.5)
    this.button = this.add.container(HOLD.x, HOLD.y, [this.buttonFill, label]).setSize(HOLD.w, HOLD.h).setInteractive()
    this.drawButton()
  }

  private setHeld(on: boolean): void {
    if (this.revealed || on === this.held) return
    this.held = on
    this.rules.hold(on)
    this.drawButton()
  }

  /** Teal at rest; held, it turns terracotta and sinks. */
  private drawButton(): void {
    const { w, h } = HOLD
    this.buttonFill
      .clear()
      .fillStyle(hex(this.held ? C.terracotta : C.teal), 1)
      .fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    this.button.setY(HOLD.y + (this.held ? HOLD.sinkPx : 0))
  }

  private showDemo(): void {
    // the fingertip is at the bottom centre of the texture
    this.demoHand = this.add.image(DEMO.x, DEMO.y, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand)
  }

  /** The hand presses the button while the mark is under the band, and lifts off once it is in the band or over it. */
  private moveDemo(delta: number): void {
    if (!this.demoHand) return
    const pressing = this.rules.feel() === 'cold'
    this.press = Phaser.Math.Clamp(this.press + ((pressing ? 1 : -1) * delta) / DEMO.dipMs, 0, 1)
    const k = this.press
    this.demoHand.setPosition(DEMO.x, DEMO.y - DEMO.hoverPx * (1 - k)).setScale(Phaser.Math.Linear(1, DEMO.pressScale, k))
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.demoHand.destroy()
    this.demoHand = null
  }

  private reveal(stars: Stars): void {
    this.setHeld(false)
    this.revealed = true
    this.hideDemo()
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.progress(), this.timeLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  /** A full bar is three stars' worth of time inside the band. */
  private progress(): number {
    return Math.min(1, this.rules.insideMs / (MUD_STARS.three * MUD_LIMIT_MS))
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / MUD_LIMIT_MS)
  }
}
