import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import { BADGE_IDS, badgeProgress, type BadgeId } from '../sim/badges'
import { daysLeftInMonth, monthOf, yearOf } from '../sim/calendar'
import { FESTIVALS } from '../sim/festivals'
import { progressOf, type Quest } from '../sim/quests'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { BADGE_TEXT, badgeStatus } from '../view/badges'
import { FESTIVAL_COLORS, keepsakeLine } from '../view/festivals'
import { addMedal } from '../view/medal'
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
const INTRO_WRAP = 860
const TAB_Y = 418
const TAB_W = 440
const TAB_H = 110
const TAB_X = { quests: 300, badges: 780 } as const
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
/** A festival quest's row is this much taller, for its keepsake line, and the footer moves down with it. */
const FESTIVAL_EXTRA = 50
/** The keepsake line under the bar: how far below the bar, and its little picture's height. */
const KEEP_DY = 52
const KEEP_ICON = 40
const DONE_Y = 1895
const FAILED_ALPHA = 0.6
const GRID_X = 175
const GRID_DX = 243
const GRID_Y = 655
const GRID_DY = 200
const GRID_COLS = 4
/** From a medal's centre down to its name. */
const NAME_DY = 96
const PICK_W = 220
const PICK_H = 200
/** From a medal's centre down to the middle of its tap area. */
const PICK_DY = 20
const PICKED_R = 78
const DETAIL_TOP = 1600
const DETAIL_H = 190
const DETAIL_TEXT_X = 120
const DETAIL_NAME_Y = 1650
const DETAIL_COND_Y = 1702
const DETAIL_STATUS_Y = 1752

type Tab = keyof typeof TAB_X

/**
 * The quest panel over the frozen shop, in two tabs: today's three quests with the swap and the month's quest, and the badges.
 * Every tap stays in this scene, so the shop waits underneath.
 */
export class QuestsScene extends Phaser.Scene {
  private params!: QuestsData
  /** Everything drawn for the panel on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private tab: Tab = 'quests'
  /** The badge whose detail shows; kept while the panel stays open. */
  private picked: BadgeId = 'served100'

  constructor() {
    super('QuestsScene')
  }

  init(data: QuestsData) {
    this.params = data
    this.shown = []
    this.tab = 'quests'
    this.picked = 'served100'
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
    this.keep(addCard(this, 40, 230, 1000, 1760))
    // the first open's intro sits where the title is, as the tabs took its old spot
    if (this.params.intro && this.tab === 'quests') {
      this.keep(this.add.text(MID, TITLE_Y, t('questsIntro'), { ...textStyle(32, '600'), align: 'center', wordWrap: { width: INTRO_WRAP } }).setOrigin(0.5))
    } else this.keep(this.add.text(MID, TITLE_Y, t('navQuests'), textStyle(60)).setOrigin(0.5))
    for (const tab of ['quests', 'badges'] as const) {
      const label = tab === 'quests' ? t('navQuests') : t('tabBadges')
      this.keep(addButton(this, TAB_X[tab], TAB_Y, TAB_W, TAB_H, label, tab === this.tab ? 'primary' : 'plain', () => this.openTab(tab), 44))
    }
    if (this.tab === 'quests') this.questsTab()
    else this.badgesTab()
    this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
  }

  private openTab(tab: Tab): void {
    this.tab = tab
    this.show()
  }

  /** Today's quests and the month's. */
  private questsTab(): void {
    const { sim } = this.params
    const p = sim.progress
    this.keep(this.label(LEFT, DAY_HEAD_Y, t('questsToday', { day: sim.day }), 40))
    if (p.daily.length > 0) {
      const swaps = this.canSwap() ? t('questSwapsLeft', { n: p.swaps }) : t('questNoSwaps')
      this.keep(this.label(RIGHT, DAY_HEAD_Y, swaps, 30, '600', C.soft).setOrigin(1, 0.5))
    } else this.keep(this.add.text(MID, DAY_ROW_TOP + DAY_ROW_H / 2, t('questsNoneToday'), textStyle(34, '600', C.soft)).setOrigin(0.5))
    p.daily.forEach((q, i) => this.row(q, i, DAY_ROW_TOP + i * DAY_ROW_STEP, DAY_ROW_H))

    const left = daysLeftInMonth(sim.day)
    const month = monthOf(sim.day)
    const festival = p.monthly?.festival ?? null
    const head = festival
      ? left === 1
        ? t('questMonthFestivalToday', { month, festival: t(FESTIVALS[festival].name) })
        : t('questMonthFestival', { month, festival: t(FESTIVALS[festival].name), n: left })
      : left === 1
        ? t('questMonthToday', { month })
        : t('questMonth', { month, n: left })
    this.keep(this.label(LEFT, MONTH_HEAD_Y, head, 40))
    this.keep(this.label(RIGHT, MONTH_HEAD_Y, t('questYear', { year: yearOf(sim.day) }), 30, '600', C.soft).setOrigin(1, 0.5))
    const extra = festival ? FESTIVAL_EXTRA : 0
    if (p.monthly) this.row(p.monthly, null, MONTH_ROW_TOP, MONTH_ROW_H + extra)
    else this.keep(this.add.text(MID, MONTH_ROW_TOP + MONTH_ROW_H / 2, t('questsNoneToday'), textStyle(34, '600', C.soft)).setOrigin(0.5))

    this.keep(this.add.text(MID, FOOTER_Y + extra, t('questFooter'), textStyle(30, '600', C.soft)).setOrigin(0.5))
  }

  /** The twenty medals, four to a row, and the picked one's name, condition and status. */
  private badgesTab(): void {
    const { sim } = this.params
    const shop = sim.badgeShop()
    const has = (id: BadgeId) => sim.badges[id] !== undefined
    this.keep(this.label(LEFT, DAY_HEAD_Y, t('badgesCount', { n: BADGE_IDS.filter(has).length, total: BADGE_IDS.length }), 40))
    BADGE_IDS.forEach((id, i) => {
      const cx = GRID_X + (i % GRID_COLS) * GRID_DX
      const cy = GRID_Y + Math.floor(i / GRID_COLS) * GRID_DY
      if (id === this.picked) this.keep(this.add.graphics().lineStyle(7, hex(C.teal)).strokeCircle(cx, cy, PICKED_R))
      this.keep(addMedal(this, id, cx, cy, { got: has(id), ring: badgeProgress(id, shop) }))
      this.keep(this.add.text(cx, cy + NAME_DY, t(BADGE_TEXT[id].name), textStyle(27, '800', has(id) ? C.ink : C.soft)).setOrigin(0.5))
      this.keep(this.add.zone(cx, cy + PICK_DY, PICK_W, PICK_H).setInteractive()).on('pointerup', () => {
        this.picked = id
        this.show()
      })
    })

    this.keep(
      this.add
        .graphics()
        .fillStyle(hex(C.cream), 1)
        .fillRoundedRect(ROW_X, DETAIL_TOP, ROW_W, DETAIL_H, ROW_R)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(ROW_X, DETAIL_TOP, ROW_W, DETAIL_H, ROW_R),
    )
    const status = badgeStatus(this.picked, sim.badges, shop)
    this.keep(this.label(DETAIL_TEXT_X, DETAIL_NAME_Y, t(BADGE_TEXT[this.picked].name), 40))
    this.keep(this.label(DETAIL_TEXT_X, DETAIL_COND_Y, t(BADGE_TEXT[this.picked].cond), 30, '600'))
    this.keep(this.label(DETAIL_TEXT_X, DETAIL_STATUS_Y, status.text, 30, '800', status.done ? C.teal : C.soft))
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
        .fillStyle(hex(q.festival ? FESTIVAL_COLORS[q.festival][0] : monthly ? C.mustard : C.sand), 1)
        .fillCircle(DISC_X, cy, DISC_R)
        .strokeCircle(DISC_X, cy, DISC_R),
    )
    const icon = this.add.image(DISC_X, cy, q.festival ? itemTexture(FESTIVALS[q.festival].keepsake) : questIcon(q))
    row.add(icon.setScale(ICON_W / Math.max(icon.width, icon.height)))
    const title = this.add.text(TEXT_X, top + TITLE_TOP, questTitle(q), monthly ? { ...textStyle(36), wordWrap: { width: TITLE_WRAP } } : textStyle(36))
    // a day's row has room for one line, so a long title (a big money target) is drawn smaller instead
    if (!monthly) title.setScale(Math.min(1, TITLE_WRAP / title.width))
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

    // a festival quest says what keepsake it gives, or that the shop has it and this time pays only money
    if (q.festival) {
      const keepY = lineY + KEEP_DY
      const gift = this.add.image(TEXT_X + KEEP_ICON / 2, keepY, itemTexture(FESTIVALS[q.festival].keepsake))
      row.add(gift.setScale(KEEP_ICON / Math.max(gift.width, gift.height)))
      row.add(this.label(TEXT_X + KEEP_ICON + 10, keepY, keepsakeLine(q.festival, sim.festival.keepsakes.includes(q.festival) && q.state !== 'done'), 28, '800', C.terracotta))
    }

    if (q.state === 'done') row.add(this.stamp(lineY))
    else if (i !== null && this.canSwap()) row.add(addButton(this, SIDE_X, lineY, SIDE_W, SIDE_H, t('questSwap'), 'plain', () => this.swap(i), 30))
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
      .moveTo(-58, 0)
      .lineTo(-46, 12)
      .lineTo(-24, -12)
      .strokePath()
    const text = this.add.text(19, 0, t('questStamp'), textStyle(30, '800', C.paper)).setOrigin(0.5)
    return this.add.container(SIDE_X, y, [g, text])
  }

  /** A swap is left today and the shop has not reached closing time. */
  private canSwap(): boolean {
    const { sim } = this.params
    return sim.progress.swaps > 0 && !sim.clock.isClosed
  }

  private swap(i: number): void {
    if (this.params.sim.swapQuest(i) === null) this.show()
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
