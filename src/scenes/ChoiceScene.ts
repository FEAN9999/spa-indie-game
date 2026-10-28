import * as Phaser from 'phaser'
import { SCOOTER_BOX } from '../art/fx'
import { C, customerColors, type CharacterColors } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import { VIP_KIND, VIPS } from '../sim/vips'
import type { ChoiceFigure, ChoiceText } from '../view/chain'
import { CharacterView } from '../view/CharacterView'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

export interface ChoiceData {
  card: ChoiceText
  /** The owner as she looks now, for a card that pictures her. */
  owner: CharacterColors
  /** The index of the button tapped, called once the card is gone. */
  onChoose: (i: number) => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const CARD = { x: 100, w: 880, r: 60 }
/** From the card's top: the kicker's and the title's middles, and the top of the lines. */
const KICKER_Y = 90
const TITLE_Y = 165
const TITLE_W = 780
const LINES_Y = 235
const LINES_W = 740
const LINE_GAP = 12
/** Between the lines and the first button, and under the last. */
const GAP = 70
const BUTTON = { w: 560, h: 124, step: 150, size: 48 }
/** A card with a figure: the feet stand this far down the card, on a ground ellipse, and the lines start under them. */
const FIGURE = { feet: 640, scale: 2.4, linesY: 720 }
/** The VIP's five gold stars in a row over her head, and the gold glow she stands on, from the sketch. */
const VIP_STARS = { y: 255, step: 76, scale: 0.5 }
const VIP_GROUND = { rx: 210, ry: 38, alpha: 0.35 }
/** The owner left of the middle, her scooter right of it, on a sand ellipse. */
const OWNER = { x: 470, scooterX: 700, ground: { rx: 260, ry: 40 } }

/** A gold card over the dimmed shop that waits for one of its stacked buttons, the first the main one; nothing else can be tapped. */
export class ChoiceScene extends Phaser.Scene {
  private params!: ChoiceData
  private view: CharacterView | null = null

  constructor() {
    super('ChoiceScene')
  }

  init(data: ChoiceData) {
    this.params = data
    this.view = null
  }

  create() {
    const { card, onChoose } = this.params
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    // drawn once the lines are measured, under everything
    const bg = this.add.graphics()
    const lines = this.add
      .text(MID, 0, card.lines.join('\n'), { ...textStyle(34, '600', C.soft), align: 'center', wordWrap: { width: LINES_W }, lineSpacing: LINE_GAP })
      .setOrigin(0.5, 0)
    const linesY = card.figure ? FIGURE.linesY : LINES_Y
    const buttonsTop = linesY + lines.height + GAP
    const h = buttonsTop + (card.buttons.length - 1) * BUTTON.step + BUTTON.h + GAP
    const top = Math.round((GAME_H - h) / 2)
    bg.fillStyle(hex(C.goldPale), 1).fillRoundedRect(CARD.x, top, CARD.w, h, CARD.r).lineStyle(5, hex(C.ink)).strokeRoundedRect(CARD.x, top, CARD.w, h, CARD.r)
    this.add.text(MID, top + KICKER_Y, card.kicker, textStyle(34, '800', C.terracotta)).setOrigin(0.5)
    const title = this.add.text(MID, top + TITLE_Y, card.title, textStyle(56)).setOrigin(0.5)
    title.setScale(Math.min(1, TITLE_W / title.width))
    if (card.figure) this.figure(card.figure, top + FIGURE.feet)
    lines.setY(top + linesY)
    card.buttons.forEach((label, i) => {
      // stop first: the choice may open another card, and a stop queued after that would kill it
      addButton(this, MID, top + buttonsTop + BUTTON.h / 2 + i * BUTTON.step, BUTTON.w, BUTTON.h, label, i === 0 ? 'primary' : 'plain', () => {
        this.scene.stop()
        onChoose(i)
      }, BUTTON.size)
    })
  }

  update(_time: number, delta: number) {
    this.view?.update(delta)
  }

  /** The VIP on a gold glow under five stars, or the owner beside her scooter on a sand ellipse, with the feet at `feet`. */
  private figure(figure: ChoiceFigure, feet: number): void {
    if (figure.kind === 'vip') {
      this.add.ellipse(MID, feet, VIP_GROUND.rx * 2, VIP_GROUND.ry * 2, hex(C.gold), VIP_GROUND.alpha)
      this.stand(MID, feet, customerColors(VIPS[figure.vip].look, VIP_KIND, null, figure.vip))
      const starsY = feet - FIGURE.feet + VIP_STARS.y
      for (let i = 0; i < 5; i++) this.add.image(MID + (i - 2) * VIP_STARS.step, starsY, 'star').setScale(VIP_STARS.scale)
      return
    }
    this.add.ellipse(MID, feet, OWNER.ground.rx * 2, OWNER.ground.ry * 2, hex(C.sand))
    this.stand(OWNER.x, feet, this.params.owner)
    // drawn one pixel per unit, so the box's origin is where the scooter stands
    const [x, y, w, h] = SCOOTER_BOX
    this.add.image(OWNER.scooterX, feet, 'fx-scooter').setOrigin(-x / w, -y / h)
  }

  private stand(x: number, feet: number, colors: CharacterColors): void {
    this.view = new CharacterView(this, colors)
    this.view.container.setPosition(x, feet).setScale(FIGURE.scale)
  }
}
