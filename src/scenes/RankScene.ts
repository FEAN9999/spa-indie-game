import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import { monthOf } from '../sim/calendar'
import type { MonthResult, YearResult } from '../sim/rank'
import type { SpaSim } from '../sim/spa'
import { t } from '../strings/vi'
import { monthOutcome, partRows, yearLines } from '../view/rank'
import { addPartRow, starPoints } from '../view/rankDraw'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export interface RankData {
  sim: SpaSim
  kind: 'month' | 'year'
  onDone: () => void
}

const MID = GAME_W / 2
const COUNT_MS = 800
const POP_AT_MS = 900
const POP_MS = 500
const STAR_Y = 520
const STAR_R = 52
const STAR_DX = 124
const PART_TOP = 640
const PART_STEP = 108
const TEXT_W = 860
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** Scales a text down to fit `w` when it is wider. */
const fit = (text: Phaser.GameObjects.Text, w: number) => text.setScale(Math.min(1, w / text.width))

/** The evening's grade cards after the summary: the month's five parts and stars, or the year's table. */
export class RankScene extends Phaser.Scene {
  private params!: RankData

  constructor() {
    super('RankScene')
  }

  init(data: RankData) {
    this.params = data
  }

  create() {
    const { sim, kind, onDone } = this.params
    const done = () => {
      onDone()
      this.scene.stop()
    }
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setDepth(-2).setInteractive()
    if (kind === 'month' && sim.rank.last) this.monthCard(sim.rank.last, done)
    else if (kind === 'year' && sim.rank.lastYear) this.yearCard(sim.rank.lastYear, sim.shopName, done)
    else done()
  }

  private monthCard(r: MonthResult, done: () => void): void {
    const up = r.after > r.before
    addCard(this, 70, 250, 940, 1660)
    fit(this.add.text(MID, 330, t('rankCardKicker', { day: r.day, month: monthOf(r.day) }), textStyle(32, '800', C.terracotta)).setOrigin(0.5), TEXT_W)
    fit(this.add.text(MID, 400, t('rankCardTitle'), textStyle(62)).setOrigin(0.5), TEXT_W)

    // the stars: the new one starts empty and pops gold
    for (let i = 0; i < 5; i++) {
      const pop = up && i === r.after - 1
      const g = this.add.graphics({ x: MID + (i - 2) * STAR_DX, y: STAR_Y })
      const draw = (gold: boolean) => {
        const pts = starPoints(0, 0, STAR_R, 0.44)
        g.clear().fillStyle(hex(gold ? C.gold : C.paper), 1).lineStyle(5, hex(C.ink)).fillPoints(pts, true).strokePoints(pts, true)
      }
      draw(i < r.after && !pop)
      if (pop) {
        this.time.delayedCall(POP_AT_MS, () => {
          draw(true)
          sound.play('levelUp')
          this.tweens.add({ targets: g, scale: { from: 1, to: 1.5 }, duration: POP_MS / 2, yoyo: true, ease: 'Sine.easeInOut' })
        })
      }
    }

    const rows = partRows(r.input, r.parts).map((row, i) => addPartRow(this, PART_TOP + i * PART_STEP, row))
    const dash = this.add.graphics().lineStyle(3, hex(C.soft))
    for (let x = 120; x < 960; x += 22) dash.lineBetween(x, 1200, Math.min(x + 12, 960), 1200)
    this.add.text(150, 1262, t('rankTotal'), textStyle(40)).setOrigin(0, 0.5)
    const total = this.add.text(930, 1262, t('rankRowPts', { n: 0 }), textStyle(48, '800', C.teal)).setOrigin(1, 0.5)
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: COUNT_MS,
      ease: 'Cubic.easeOut',
      onUpdate: tween => {
        const k = tween.getValue()!
        rows.forEach((row, i) => row.fill(Math.max(0, Math.min(1, (r.parts[i] / 20) * k))))
        total.setText(t('rankRowPts', { n: Math.round(r.total * k) }))
      },
    })

    const { head, sub } = monthOutcome(r)
    this.add.graphics().fillStyle(hex(up ? C.goldPale : C.cream), 1).fillRoundedRect(120, 1330, 840, 300, 44).lineStyle(4, hex(C.ink)).strokeRoundedRect(120, 1330, 840, 300, 44)
    fit(this.add.text(MID, 1395, head, textStyle(50, '800', up ? C.mustardDark : C.ink)).setOrigin(0.5), 760)
    const body = this.add.text(MID, 1440, sub, { ...textStyle(32, '600', C.soft), align: 'center', wordWrap: { width: 740 } }).setOrigin(0.5, 0)
    // the sub text lives in the box under the head: never taller than what is left of it
    if (body.height > 170) body.setScale(170 / body.height)
    addButton(this, MID, 1770, 560, 130, t('openDay', { day: r.day + 1 }), 'primary', done, 46)
  }

  private yearCard(r: YearResult, shopName: string, done: () => void): void {
    const text = yearLines(r, shopName)
    const card = this.add.graphics()
    fit(this.add.text(MID, 300, t('yearKicker', { day: r.day, year: r.year }), textStyle(32, '800', C.terracotta)).setOrigin(0.5), TEXT_W)
    fit(this.add.text(MID, 370, t('yearTitle'), textStyle(64)).setOrigin(0.5), TEXT_W)

    if (r.place <= 2) {
      const pic = this.add.image(MID, r.place === 1 ? 640 : 670, r.place === 1 ? 'decor-trophy' : 'decor-merit').setOrigin(0.5, 1)
      pic.setScale(230 / pic.height)
    } else {
      this.add.graphics().fillStyle(hex(C.sand), 1).fillCircle(MID, 540, 110).lineStyle(5, hex(C.ink)).strokeCircle(MID, 540, 110)
      this.add.text(MID, 545, t('yearPlace', { n: r.place }), textStyle(52, '800', C.soft)).setOrigin(0.5)
    }

    const medals = [C.gold, C.silver, C.plank]
    text.rows.forEach((row, i) => {
      const y = 740 + i * 84
      this.add
        .graphics()
        .fillStyle(hex(row.me ? C.tealPale : C.cream), 1)
        .fillRoundedRect(120, y, 840, 72, 36)
        .lineStyle(row.me ? 5 : 3, hex(row.me ? C.teal : C.ink))
        .strokeRoundedRect(120, y, 840, 72, 36)
        .fillStyle(hex(medals[i] ?? C.sand), 1)
        .fillCircle(168, y + 36, 26)
        .lineStyle(3, hex(C.ink))
        .strokeCircle(168, y + 36, 26)
      this.add.text(168, y + 38, String(i + 1), textStyle(30)).setOrigin(0.5)
      fit(this.add.text(214, y + 38, row.name, textStyle(34, row.me ? '800' : '600')).setOrigin(0, 0.5), 520)
      this.add.text(920, y + 38, row.pts, textStyle(32, '800')).setOrigin(1, 0.5)
    })

    // the lines wrap inside the card, which grows to fit them
    let y = 740 + text.rows.length * 84 + 40
    text.lines.forEach((line, k) => {
      const body = this.add.text(MID, y, line, { ...textStyle(32, k === 0 ? '800' : '600', k === 0 ? C.ink : C.soft), align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5, 0)
      y += body.height + 10
    })
    card
      .fillStyle(hex(r.place === 1 ? C.goldPale : C.paper), 1)
      .fillRoundedRect(70, 220, 940, y + 210 - 220, 60)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(70, 220, 940, y + 210 - 220, 60)
    // the card is drawn last, so it goes under everything already placed
    card.setDepth(-1)
    addButton(this, MID, y + 90, 560, 130, text.button, 'primary', done, 50)
    if (r.place <= 3) this.time.delayedCall(300, () => sound.play('levelUp'))
  }
}
