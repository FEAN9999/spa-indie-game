import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { starterNotes } from '../view/starter'
import { summaryRows, type SummaryRow } from '../view/summary'
import { textStyle } from '../view/text'
import { summaryNotes } from '../view/vip'

export interface SummaryData {
  sim: SpaSim
  onNewDay: () => void
  firstDay: boolean
}

const COUNT_MS = 800
const ROW_Y = 650
const ROW_H = 90
const HEADING_H = 64
const NOTE_GAP = 14
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** End-of-day card: the day's numbers count up, then the player goes on (to the grade cards on a judging evening, else the next day). */
export class SummaryScene extends Phaser.Scene {
  private params!: SummaryData

  constructor() {
    super('SummaryScene')
  }

  init(data: SummaryData) {
    this.params = data
  }

  create() {
    const { sim, onNewDay, firstDay } = this.params
    sound.endOfDay()
    const s = sim.stats
    const rating = sim.rating()
    const rows: (SummaryRow & { show: (v: number) => string; color?: string })[] = [
      ...summaryRows(s).map(row => ({
        ...row,
        show: row.kind === 'money' ? formatMoney : (v: number) => String(Math.round(v)),
        color: row.label === 'profit' && row.value < 0 ? C.lantern : undefined,
      })),
      { label: 'balance', value: sim.money, kind: 'money', show: formatMoney, color: sim.money < 0 ? C.lantern : C.ink },
      { label: 'rating', value: rating ?? 0, kind: 'count', show: v => (rating === null ? t('noRating') : v.toFixed(1)) },
    ]
    const heights = rows.map(row => (row.kind === 'heading' ? HEADING_H : ROW_H))
    const rowsEnd = ROW_Y + heights.reduce((sum, h) => sum + h, 0)
    const notes = [...starterNotes(sim), ...summaryNotes(firstDay, sim.vip, sim.eventBook, sim.day, sim.hintDone('vip'), sim.rivalTarget())]
    // each note is its own text, stacked under the rows; the button goes under their measured height, so they are drawn before the card (depth 1 keeps them above it)
    let noteBottom = rowsEnd + 20
    for (const note of notes) {
      const style = note.booking ? textStyle(36, '800', C.teal) : textStyle(34, '600')
      const text = this.add.text(GAME_W / 2, noteBottom, note.text, { ...style, align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5, 0).setDepth(1)
      noteBottom += text.height + NOTE_GAP
    }
    const buttonY = (notes.length ? noteBottom - NOTE_GAP : rowsEnd) + 20 + 75
    const cardH = buttonY + 75 + 60 - 420

    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    const card = this.add
      .graphics()
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(90, 420, 900, cardH, 60)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(90, 420, 900, cardH, 60)
    const name = this.add.text(GAME_W / 2, 485, sim.shopName, textStyle(44, '600')).setOrigin(0.5)
    if (name.width > 760) name.setScale(760 / name.width)
    this.add.text(GAME_W / 2, 565, t('summaryTitle', { day: sim.day }), textStyle(60)).setOrigin(0.5)

    let top = ROW_Y
    const values = rows.map((row, i) => {
      const y = top + heights[i] / 2
      if (row.kind === 'heading') {
        this.add.text(170, y, t(row.label), textStyle(36, '800', C.teal)).setOrigin(0, 0.5)
      }
      else if (i > 0 && rows[i - 1].kind !== 'heading') card.lineStyle(3, hex(C.tileSeam), 1).lineBetween(170, top, 910, top)
      const value =
        row.kind === 'heading'
          ? undefined
          : (this.add.text(170, y, t(row.label), textStyle(44, '600')).setOrigin(0, 0.5),
            this.add.text(910, y, row.show(0), textStyle(50, '800', row.color)).setOrigin(1, 0.5))
      top += heights[i]
      return value
    })
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: COUNT_MS,
      ease: 'Cubic.easeOut',
      onUpdate: tween => rows.forEach((row, i) => values[i]?.setText(row.show(row.value * tween.getValue()!))),
    })

    const button = this.add.container(GAME_W / 2, buttonY)
    button.add(
      this.add
        .graphics()
        .fillStyle(hex(C.teal), 1)
        .fillRoundedRect(-300, -75, 600, 150, 75)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(-300, -75, 600, 150, 75),
    )
    button.add(this.add.text(0, 0, t('newDay'), textStyle(60, '800', C.paper)).setOrigin(0.5))
    button.setSize(600, 150).setInteractive().on('pointerup', () => {
      sound.play('tap')
      onNewDay()
      this.scene.stop()
    })
  }
}
