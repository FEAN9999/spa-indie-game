import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import { daysLeftInMonth, monthOf, yearOf } from '../sim/calendar'
import { progressOf, type Quest } from '../sim/quests'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { questCount, questIcon, questTitle } from '../view/quests'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export interface QuestsData {
  sim: SpaSim
  /** The first time the panel opens. */
  intro: boolean
  onClose: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TITLE_Y = 290
const INTRO_Y = 400
const INTRO_WRAP = 860
const LEFT = 90
const RIGHT = 990
const DAY_HEAD_Y = 545
const DAY_ROW_TOP = 590
const DAY_ROW_STEP = 212
const DAY_ROW_H = 192
const MONTH_HEAD_Y = 1270
const MONTH_ROW_TOP = 1315
const MONTH_ROW_H = 236
const ROW_X = 80
const ROW_W = 920
const ROW_R = 40
const DISC_X = 165
const DISC_R = 54
/** How wide the icon in a disc is drawn. */
const ICON_W = 72
const TEXT_X = 245
const TITLE_TOP = 34
const TITLE_WRAP = 500
/** From the title's last line down to the middle of the bar line. */
const LINE_GAP = 30
const BAR_W = 330
const BAR_H = 40
const COUNT_X = 592
const REWARD_X = 895
const REWARD_Y = 58
const SIDE_X = 905
const SIDE_W = 140
const SIDE_H = 64
const FOOTER_Y = 1620
const DONE_Y = 1895
const FAILED_ALPHA = 0.6

/**
 * The quest panel over the frozen shop: today's three quests with the swap, and the month's quest.
 * Every tap stays in this scene, so the shop waits underneath.
 */
export class QuestsScene extends Phaser.Scene {
  private params!: QuestsData
  /** Everything drawn for the panel on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super('QuestsScene')
  }

  init(data: QuestsData) {
    this.params = data
    this.shown = []
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.show()
  }

  private keep<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.shown.push(obj)
    return obj
  }

  private label(x: number, y: number, text: string, size: number, weight: '600' | '800' = '800', color: string = C.ink): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, textStyle(size, weight, color)).setOrigin(0, 0.5)
  }

  /** Draws the whole panel again. */
  private show(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
    const { sim } = this.params
    const p = sim.progress
    this.keep(addCard(this, 40, 230, 1000, 1760))
    this.keep(this.add.text(MID, TITLE_Y, t('navQuests'), textStyle(60)).setOrigin(0.5))
    if (this.params.intro) {
      this.keep(this.add.text(MID, INTRO_Y, t('questsIntro'), { ...textStyle(32, '600'), align: 'center', wordWrap: { width: INTRO_WRAP } }).setOrigin(0.5))
    }

    this.keep(this.label(LEFT, DAY_HEAD_Y, t('questsToday', { day: sim.day }), 40))
    if (p.daily.length > 0) {
      const swaps = p.swaps > 0 ? t('questSwapsLeft', { n: p.swaps }) : t('questNoSwaps')
      this.keep(this.label(RIGHT, DAY_HEAD_Y, swaps, 30, '600', C.soft).setOrigin(1, 0.5))
    } else this.keep(this.add.text(MID, DAY_ROW_TOP + DAY_ROW_H / 2, t('questsNoneToday'), textStyle(34, '600', C.soft)).setOrigin(0.5))
    p.daily.forEach((q, i) => this.row(q, i, DAY_ROW_TOP + i * DAY_ROW_STEP, DAY_ROW_H))

    const left = daysLeftInMonth(sim.day)
    const month = monthOf(sim.day)
    this.keep(this.label(LEFT, MONTH_HEAD_Y, left === 1 ? t('questMonthToday', { month }) : t('questMonth', { month, n: left }), 40))
    this.keep(this.label(RIGHT, MONTH_HEAD_Y, t('questYear', { year: yearOf(sim.day) }), 30, '600', C.soft).setOrigin(1, 0.5))
    if (p.monthly) this.row(p.monthly, null, MONTH_ROW_TOP, MONTH_ROW_H)
    else this.keep(this.add.text(MID, MONTH_ROW_TOP + MONTH_ROW_H / 2, t('questsNoneToday'), textStyle(34, '600', C.soft)).setOrigin(0.5))

    this.keep(this.add.text(MID, FOOTER_Y, t('questFooter'), textStyle(30, '600', C.soft)).setOrigin(0.5))
    this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
  }

  /** One quest's row from `top`: disc, title, progress or the closing-time line, reward, and the stamp or the swap. `i` is a daily quest's place, null for the month's. */
  private row(q: Quest, i: number | null, top: number, h: number): void {
    const { sim } = this.params
    const monthly = i === null
    const row = this.keep(this.add.container(0, 0)).setAlpha(q.state === 'failed' ? FAILED_ALPHA : 1)
    const fill = q.state === 'done' ? C.tealPale : monthly ? C.goldPale : C.cream
    const cy = top + h / 2
    row.add(
      this.add
        .graphics()
        .fillStyle(hex(fill), 1)
        .fillRoundedRect(ROW_X, top, ROW_W, h, ROW_R)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(ROW_X, top, ROW_W, h, ROW_R)
        .fillStyle(hex(monthly ? C.mustard : C.sand), 1)
        .fillCircle(DISC_X, cy, DISC_R)
        .strokeCircle(DISC_X, cy, DISC_R),
    )
    const icon = this.add.image(DISC_X, cy, questIcon(q))
    row.add(icon.setScale(ICON_W / Math.max(icon.width, icon.height)))
    const title = this.add.text(TEXT_X, top + TITLE_TOP, questTitle(q), { ...textStyle(36), wordWrap: { width: TITLE_WRAP } })
    row.add(title)
    row.add(this.add.text(REWARD_X, top + REWARD_Y, '+' + formatMoney(q.reward), textStyle(30, '800', C.mustardDark)).setOrigin(0.5))

    const lineY = title.y + title.height + LINE_GAP
    if (q.kind === 'noWalk') {
      const key = q.state === 'failed' ? 'questNoWalkFailed' : q.state === 'done' ? 'questNoWalkDone' : 'questNoWalkOpen'
      row.add(this.label(TEXT_X, lineY, t(key), 28, '600', C.soft))
    } else {
      const k = progressOf(q, sim.progress.total) / q.target
      const bar = this.add
        .graphics()
        .fillStyle(hex(C.paper), 1)
        .fillRoundedRect(TEXT_X, lineY - BAR_H / 2, BAR_W, BAR_H, BAR_H / 2)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(TEXT_X, lineY - BAR_H / 2, BAR_W, BAR_H, BAR_H / 2)
      if (k > 0) bar.fillStyle(hex(C.teal), 1).fillRoundedRect(TEXT_X + 4, lineY - BAR_H / 2 + 4, Math.max(BAR_H - 8, (BAR_W - 8) * k), BAR_H - 8, (BAR_H - 8) / 2)
      row.add(bar)
      row.add(this.label(COUNT_X, lineY, questCount(q, sim.progress.total), 30))
    }

    if (q.state === 'done') row.add(this.stamp(lineY))
    else if (i !== null && sim.progress.swaps > 0) row.add(addButton(this, SIDE_X, lineY, SIDE_W, SIDE_H, t('questSwap'), 'plain', () => this.swap(i), 30))
  }

  /** A teal "Xong" pill with a tick, where the swap button would be. */
  private stamp(y: number): Phaser.GameObjects.Container {
    const g = this.add
      .graphics()
      .fillStyle(hex(C.teal), 1)
      .fillRoundedRect(-SIDE_W / 2, -SIDE_H / 2, SIDE_W, SIDE_H, SIDE_H / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-SIDE_W / 2, -SIDE_H / 2, SIDE_W, SIDE_H, SIDE_H / 2)
      .lineStyle(7, hex(C.paper))
      .beginPath()
      .moveTo(-47, 0)
      .lineTo(-35, 12)
      .lineTo(-13, -12)
      .strokePath()
    const text = this.add.text(30, 0, t('questStamp'), textStyle(30, '800', C.paper)).setOrigin(0.5)
    return this.add.container(SIDE_X, y, [g, text])
  }

  private swap(i: number): void {
    if (this.params.sim.swapQuest(i) === null) this.show()
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
