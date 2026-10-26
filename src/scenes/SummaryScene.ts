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
  firstDay: boolean
}

const COUNT_MS = 800
const ROW_Y = 690
/** The rows spread evenly down to here: 120 apart, or 100 with the wages row. */
const LAST_ROW_Y = 1290
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
    const { sim, onNewDay, firstDay } = this.params
    const s = sim.stats
    const rating = sim.rating()
    const rows: { label: StringKey; value: number; show: (v: number) => string; color?: string }[] = [
      { label: 'served', value: s.served, show: v => String(Math.round(v)) },
      { label: 'leftUnhappy', value: s.angry + s.walkedAway, show: v => String(Math.round(v)) },
      { label: 'income', value: s.income, show: formatMoney },
      { label: 'tips', value: s.tips, show: formatMoney },
      ...(s.wages > 0 ? [{ label: 'wages' as const, value: -s.wages, show: formatMoney }] : []),
      { label: 'balance', value: sim.money, show: formatMoney, color: sim.money < 0 ? C.lantern : C.ink },
      { label: 'rating', value: rating ?? 0, show: v => (rating === null ? t('noRating') : v.toFixed(1)) },
    ]
    const step = (LAST_ROW_Y - ROW_Y) / (rows.length - 1)

    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    const card = this.add
      .graphics()
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(90, 420, 900, 1300, 60)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(90, 420, 900, 1300, 60)
    const name = this.add.text(GAME_W / 2, 485, sim.shopName, textStyle(44, '600')).setOrigin(0.5)
    if (name.width > 760) name.setScale(760 / name.width)
    this.add.text(GAME_W / 2, 565, t('summaryTitle', { day: sim.day }), textStyle(60)).setOrigin(0.5)
    if (firstDay) {
      this.add
        .text(GAME_W / 2, 1420, t('summaryFirstDay'), { ...textStyle(34, '600'), align: 'center', wordWrap: { width: 760 } })
        .setOrigin(0.5)
    }

    const values = rows.map((row, i) => {
      const y = ROW_Y + i * step
      if (i > 0) card.lineStyle(3, hex(C.tileSeam), 1).lineBetween(170, y - step / 2, 910, y - step / 2)
      this.add.text(170, y, t(row.label), textStyle(44, '600')).setOrigin(0, 0.5)
      return this.add.text(910, y, row.show(0), textStyle(50, '800', row.color)).setOrigin(1, 0.5)
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
