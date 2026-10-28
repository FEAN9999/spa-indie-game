import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { ChoiceText } from '../view/chain'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

export interface ChoiceData {
  card: ChoiceText
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

/** A gold card over the dimmed shop that waits for one of its stacked buttons, the first the main one; nothing else can be tapped. */
export class ChoiceScene extends Phaser.Scene {
  private params!: ChoiceData

  constructor() {
    super('ChoiceScene')
  }

  init(data: ChoiceData) {
    this.params = data
  }

  create() {
    const { card, onChoose } = this.params
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    // drawn once the lines are measured, under everything
    const bg = this.add.graphics()
    const lines = this.add
      .text(MID, 0, card.lines.join('\n'), { ...textStyle(34, '600', C.soft), align: 'center', wordWrap: { width: LINES_W }, lineSpacing: LINE_GAP })
      .setOrigin(0.5, 0)
    const buttonsTop = LINES_Y + lines.height + GAP
    const h = buttonsTop + (card.buttons.length - 1) * BUTTON.step + BUTTON.h + GAP
    const top = Math.round((GAME_H - h) / 2)
    bg.fillStyle(hex(C.goldPale), 1).fillRoundedRect(CARD.x, top, CARD.w, h, CARD.r).lineStyle(5, hex(C.ink)).strokeRoundedRect(CARD.x, top, CARD.w, h, CARD.r)
    this.add.text(MID, top + KICKER_Y, card.kicker, textStyle(34, '800', C.terracotta)).setOrigin(0.5)
    const title = this.add.text(MID, top + TITLE_Y, card.title, textStyle(56)).setOrigin(0.5)
    title.setScale(Math.min(1, TITLE_W / title.width))
    lines.setY(top + LINES_Y)
    card.buttons.forEach((label, i) => {
      // stop first: the choice may open another card, and a stop queued after that would kill it
      addButton(this, MID, top + buttonsTop + BUTTON.h / 2 + i * BUTTON.step, BUTTON.w, BUTTON.h, label, i === 0 ? 'primary' : 'plain', () => {
        this.scene.stop()
        onChoose(i)
      }, BUTTON.size)
    })
  }
}
