import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import type { ChainDayRow } from '../sim/chain'
import type { RestaurantStats } from '../sim/restaurant'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { starterNotes } from '../view/starter'
import { chainSummaryRows, restaurantRows, summaryLayout, summaryRows, type SummaryRow } from '../view/summary'
import { signedMoney } from '../view/chain'
import { textStyle } from '../view/text'
import { summaryNotes } from '../view/vip'

export interface SummaryData {
  sim: SpaSim
  onNewDay: () => void
  firstDay: boolean
  /** The day's profit per shop; empty when there is no branch, and the summary is then as it always was. */
  chain: ChainDayRow[]
  /** The restaurant's day, shown in its own block; null at a branch day and before it is bought. Its money is in the purse already and in none of the rows above. */
  restaurant: RestaurantStats | null
}

const COUNT_MS = 800
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
    const { sim, onNewDay, firstDay, chain, restaurant } = this.params
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
    const kinds = rows.map(row => row.kind)
    const notes = [...starterNotes(sim), ...summaryNotes(firstDay, sim.vip, sim.idol, sim.eventBook, sim.day, sim.hintDone('vip'), sim.hintDone('idol'), sim.rivalTarget())]
    // the star's first note is shown now, once only
    if (notes.some(note => note.text === t('idolFirstNote'))) sim.markHint('idol')
    // each note is its own text, stacked under the rows; they are measured first, since the card and the button follow their height, then put in place (depth 1 keeps them above the card)
    const texts = notes.map(note => {
      const style = note.booking ? textStyle(36, '800', C.teal) : textStyle(34, '600')
      return this.add.text(GAME_W / 2, 0, note.text, { ...style, align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5, 0).setDepth(1)
    })
    const notesH = texts.reduce((sum, text) => sum + text.height, 0) + NOTE_GAP * Math.max(0, texts.length - 1)
    const restaurantLines = restaurant ? restaurantRows(restaurant) : []
    const L = summaryLayout(kinds, chain.length, notesH, restaurantLines.length)
    let noteY = L.notesTop
    for (const text of texts) {
      text.setY(noteY)
      noteY += text.height + NOTE_GAP
    }
    const heights = kinds.map(k => (k === 'heading' ? L.headingH : L.rowH))
    const { top: cardTop, buttonY, cardH } = L

    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    const card = this.add
      .graphics()
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(90, cardTop, 900, cardH, 60)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(90, cardTop, 900, cardH, 60)
    const name = this.add.text(GAME_W / 2, L.nameY, sim.shopName, textStyle(44, '600')).setOrigin(0.5)
    if (name.width > 760) name.setScale(760 / name.width)
    this.add.text(GAME_W / 2, L.titleY, t('summaryTitle', { day: sim.day }), textStyle(60)).setOrigin(0.5)

    let top = L.rowsTop
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
    if (chain.length > 0) {
      // the whole chain, in a pale block under the rows: a heading, a line per shop, a rule and the total
      const lines = chainSummaryRows(chain)
      const h = (lines.length + 1) * L.chainRowH + 20
      card
        .fillStyle(hex(C.tealPale), 1)
        .fillRoundedRect(120, L.chainTop, 840, h, 34)
        .lineStyle(4, hex(C.teal))
        .strokeRoundedRect(120, L.chainTop, 840, h, 34)
      let y = L.chainTop + 10 + L.chainRowH / 2
      this.add.text(GAME_W / 2, y, t('summaryChain'), textStyle(38, '800', C.tealDark)).setOrigin(0.5)
      y += L.chainRowH
      lines.forEach((line, i) => {
        const last = i === lines.length - 1
        if (last) card.lineStyle(3, hex(C.teal), 1).lineBetween(160, y - L.chainRowH / 2, 920, y - L.chainRowH / 2)
        const color = last ? C.tealDark : line.value < 0 ? C.lantern : C.ink
        this.add.text(160, y, line.label, textStyle(last ? 40 : 36, last ? '800' : '600', last ? C.tealDark : C.ink)).setOrigin(0, 0.5)
        this.add.text(920, y, signedMoney(line.value), textStyle(last ? 44 : 40, '800', color)).setOrigin(1, 0.5)
        y += L.chainRowH
      })
    }
    if (restaurantLines.length > 0) {
      // the restaurant's own block under the chain's: a heading and a line each for diners, dish money and tips; or, when the card is too tall for that, one line
      const h = (L.restaurantOneLine ? 1 : restaurantLines.length + 1) * L.chainRowH + 20
      card
        .fillStyle(hex(C.tealPale), 1)
        .fillRoundedRect(120, L.restaurantTop, 840, h, 34)
        .lineStyle(4, hex(C.teal))
        .strokeRoundedRect(120, L.restaurantTop, 840, h, 34)
      let y = L.restaurantTop + 10 + L.chainRowH / 2
      if (L.restaurantOneLine) {
        this.add.text(160, y, t('summaryRestaurant'), textStyle(38, '800', C.tealDark)).setOrigin(0, 0.5)
        const [served, income, tips] = restaurantLines.map(line => line.value)
        this.add.text(920, y, t('restaurantOneLine', { n: served, money: formatMoney(income + tips) }), textStyle(40, '800')).setOrigin(1, 0.5)
      }
      else {
        this.add.text(GAME_W / 2, y, t('summaryRestaurant'), textStyle(38, '800', C.tealDark)).setOrigin(0.5)
        y += L.chainRowH
        for (const line of restaurantLines) {
          this.add.text(160, y, t(line.label), textStyle(36, '600')).setOrigin(0, 0.5)
          this.add.text(920, y, line.kind === 'money' ? formatMoney(line.value) : String(line.value), textStyle(40, '800')).setOrigin(1, 0.5)
          y += L.chainRowH
        }
      }
    }
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
