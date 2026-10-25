import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { textStyle } from '../view/text'

export interface SummaryData {
  sim: SpaSim
  onNewDay: () => void
}

const COUNT_MS = 800
const ROW_Y = 690
const ROW_STEP = 120
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** End-of-day card: the day's numbers count up, then the player starts the next day. */
export class SummaryScene extends Phaser.Scene {
  private params!: SummaryData

  constructor() {
    super('SummaryScene')
  }

  init(data: SummaryData) {
    this.params = data
  }

  create() {
    const { sim, onNewDay } = this.params
    const s = sim.stats
    const rating = sim.rating()
    const rows: { label: StringKey; value: number; show: (v: number) => string }[] = [
      { label: 'served', value: s.served, show: v => String(Math.round(v)) },
      { label: 'leftUnhappy', value: s.angry + s.walkedAway, show: v => String(Math.round(v)) },
      { label: 'income', value: s.income, show: formatMoney },
      { label: 'tips', value: s.tips, show: formatMoney },
      { label: 'balance', value: sim.money, show: formatMoney },
      { label: 'rating', value: rating ?? 0, show: v => (rating === null ? t('noRating') : v.toFixed(1)) },
    ]

    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    const card = this.add
      .graphics()
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(90, 420, 900, 1300, 60)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(90, 420, 900, 1300, 60)
    this.add.text(GAME_W / 2, 545, t('summaryTitle', { day: sim.day }), textStyle(64)).setOrigin(0.5)

    const values = rows.map((row, i) => {
      const y = ROW_Y + i * ROW_STEP
      if (i > 0) card.lineStyle(3, hex(C.tileSeam), 1).lineBetween(170, y - ROW_STEP / 2, 910, y - ROW_STEP / 2)
      this.add.text(170, y, t(row.label), textStyle(44, '600')).setOrigin(0, 0.5)
      return this.add.text(910, y, row.show(0), textStyle(50)).setOrigin(1, 0.5)
    })
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: COUNT_MS,
      ease: 'Cubic.easeOut',
      onUpdate: tween => rows.forEach((row, i) => values[i].setText(row.show(row.value * tween.getValue()!))),
    })

    const button = this.add.container(GAME_W / 2, 1545)
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
      onNewDay()
      this.scene.stop()
    })
  }
}
