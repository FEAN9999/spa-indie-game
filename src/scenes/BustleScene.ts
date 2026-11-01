import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { BUSTLE_PIECES, GAME_H, GAME_W } from '../config'
import { BUSTLE_IDS, BUSTLE_SCORE_MAX, bustleScore, type BustleId } from '../sim/bustle'
import { BUSTLE_TEXT } from '../strings/bustle'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { bustlePercentText } from '../view/bustle'
import { textStyle } from '../view/text'
import { addButton, whenTapped } from '../view/ui'
import { sound } from '../audio/engine'

export interface BustleListData {
  /** The pieces the street has, in the order bought. */
  bought: readonly BustleId[]
  /** Called once the list is gone: with the piece tapped, or null for Đóng. */
  onClose: (id: BustleId | null) => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const CARD = { x: 100, w: 880, r: 60 }
/** From the card's top: the kicker, the title, the line under it and the bar's top; then the rows, and the button under them. */
const KICKER_Y = 90
const TITLE_Y = 160
const LINE_Y = 225
const BAR = { y: 270, h: 22, w: 720 }
const ROWS_Y = 330
const ROW = { h: 112, step: 124, padX: 30, r: 28 }
const GAP = 50
const BUTTON = { w: 480, h: 116 }

/** The street's list over the dimmed shop: how busy it is, each piece with its price or "Đã có"; a row closes it and opens that piece's card. */
export class BustleScene extends Phaser.Scene {
  private params!: BustleListData

  constructor() {
    super('BustleScene')
  }

  init(data: BustleListData) {
    this.params = data
  }

  create() {
    const { bought, onClose } = this.params
    const close = (id: BustleId | null) => {
      // stop first: the piece's card is a scene of its own
      this.scene.stop()
      onClose(id)
    }
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    const rowsH = BUSTLE_IDS.length * ROW.step - (ROW.step - ROW.h)
    const h = ROWS_Y + rowsH + GAP + BUTTON.h + GAP
    const top = Math.round((GAME_H - h) / 2)
    this.add
      .graphics()
      .fillStyle(hex(C.goldPale), 1)
      .fillRoundedRect(CARD.x, top, CARD.w, h, CARD.r)
      .lineStyle(5, hex(C.ink))
      .strokeRoundedRect(CARD.x, top, CARD.w, h, CARD.r)
    const score = bustleScore(bought)
    this.add.text(MID, top + KICKER_Y, t('bustleKicker'), textStyle(34, '800', C.terracotta)).setOrigin(0.5)
    this.add.text(MID, top + TITLE_Y, t('bustleChip', { score, max: BUSTLE_SCORE_MAX }), textStyle(52)).setOrigin(0.5)
    this.add.text(MID, top + LINE_Y, t('bustleListLine', { percent: bustlePercentText(score) }), textStyle(32, '600', C.soft)).setOrigin(0.5)
    const bar = this.add.graphics()
    const barX = MID - BAR.w / 2
    bar.fillStyle(hex(C.tileSeam), 1).fillRoundedRect(barX, top + BAR.y, BAR.w, BAR.h, BAR.h / 2)
    if (score > 0) bar.fillStyle(hex(C.teal), 1).fillRoundedRect(barX, top + BAR.y, Math.max(BAR.h, (BAR.w * score) / BUSTLE_SCORE_MAX), BAR.h, BAR.h / 2)
    bar.lineStyle(4, hex(C.ink)).strokeRoundedRect(barX, top + BAR.y, BAR.w, BAR.h, BAR.h / 2)

    const rowW = CARD.w - 2 * 50
    BUSTLE_IDS.forEach((id, i) => {
      const y = top + ROWS_Y + i * ROW.step + ROW.h / 2
      const owned = bought.includes(id)
      const text = BUSTLE_TEXT[id]
      const bg = this.add
        .graphics()
        .fillStyle(hex(C.paper), 1)
        .fillRoundedRect(-rowW / 2, -ROW.h / 2, rowW, ROW.h, ROW.r)
        .lineStyle(3, hex(C.tileSeam))
        .strokeRoundedRect(-rowW / 2, -ROW.h / 2, rowW, ROW.h, ROW.r)
      const left = -rowW / 2 + ROW.padX
      const name = this.add.text(left, -18, text.name, textStyle(36, '800')).setOrigin(0, 0.5)
      const sub = this.add.text(left, 24, t('bustleRowSub', { where: text.where, score: BUSTLE_PIECES[id].score }), textStyle(26, '600', C.soft)).setOrigin(0, 0.5)
      const right = this.add
        .text(rowW / 2 - ROW.padX, 0, owned ? t('bustleListOwned') : formatMoney(BUSTLE_PIECES[id].price), textStyle(32, '800', owned ? C.teal : C.ink))
        .setOrigin(1, 0.5)
      const row = this.add.container(MID, y, [bg, name, sub, right]).setSize(rowW, ROW.h).setInteractive()
      whenTapped(row, () => {
        sound.play('tap')
        close(id)
      })
    })
    addButton(this, MID, top + ROWS_Y + rowsH + GAP + BUTTON.h / 2, BUTTON.w, BUTTON.h, t('bustleClose'), 'plain', () => close(null))
  }
}
