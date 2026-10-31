import * as Phaser from 'phaser'
import { C, staffColors } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { ChefCandidate, ChefStats } from '../sim/chefs'
import { DISH_IDS } from '../sim/menu'
import type { RestaurantSim } from '../sim/restaurant'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { textStyle } from '../view/text'
import { addButton, addCard, addToast } from '../view/ui'

export interface ChefData {
  restaurant: RestaurantSim
  /** After a hire or a letting go: save. */
  onChange: () => void
  onClose: () => void
}

type Tab = 'working' | 'hiring'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TITLE_Y = 290
const INTRO_Y = 385
const INTRO_WRAP = 680
const TAB_Y = 500
const TAB_W = 440
const TAB_H = 120
const TAB_X = { working: 300, hiring: 780 } as const
const ROW_TOP = 590
const ROW_H = 290
const MAX_ROWS = 4
const ROW_LEFT = 90
const ROW_RIGHT = 990
const FEET_X = 150
const TEXT_X = 250
const ACTION_X = 860
const ACTION_W = 260
const ACTION_H = 120
// the specialty: a dish icon and one small star per tier, in a line under the wage
const BADGE_DY = 172
const BADGE_ICON = 0.6
const BADGE_STAR = 0.25
const BADGE_STAR_STEP = 20
const STAT_W = 300
const DOT_R = 10
const DOT_STEP = 26
const EMPTY_Y = 800
const DONE_Y = 1895
const TOAST_Y = 2060
const FADED_ALPHA = 0.45
const CONFIRM_DEPTH = 10
const TOAST_DEPTH = 20

const STAT_KEYS: (keyof ChefStats)[] = ['skill', 'speed']
const STAT: Record<keyof ChefStats, StringKey> = { skill: 'statSkill', speed: 'statSpeed' }

/** One row's cook, hired or a candidate, and the button on its right. */
interface Row {
  person: ChefCandidate
  action: string
  kind: 'primary' | 'plain'
  faded: boolean
  onTap: () => void
}

/**
 * The cook panel over the frozen restaurant: who cooks here, with "Cho nghỉ", and today's cooks to hire, with "Thuê".
 * Every tap stays in this scene, so the restaurant, its top bar and its buttons wait underneath.
 */
export class ChefScene extends Phaser.Scene {
  private params!: ChefData
  private tab: Tab = 'working'
  /** Everything drawn for the panel on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor() {
    super('ChefScene')
  }

  init(data: ChefData) {
    this.params = data
    this.tab = !data.restaurant.hasChefs() ? 'hiring' : 'working'
    this.shown = []
    this.toastBox = null
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.show()
  }

  private keep<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.shown.push(obj)
    return obj
  }

  /** Draws the whole panel again for the tab on show. */
  private show(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
    const { restaurant } = this.params
    this.keep(addCard(this, 40, 230, 1000, 1760))
    this.keep(this.add.text(MID, TITLE_Y, t('chefTitle'), textStyle(60)).setOrigin(0.5))
    this.keep(this.add.text(MID, INTRO_Y, t('chefIntro', { n: restaurant.chefCap() }), { ...textStyle(32, '600'), align: 'center', wordWrap: { width: INTRO_WRAP } }).setOrigin(0.5))
    // a cook who is leaving is not listed
    const working = restaurant.chefs.filter(c => !c.leaving)
    const tabs: { tab: Tab; label: string }[] = [
      { tab: 'working', label: t('tabWorking', { n: working.length }) },
      { tab: 'hiring', label: t('tabHiring') },
    ]
    for (const { tab, label } of tabs) {
      this.keep(addButton(this, TAB_X[tab], TAB_Y, TAB_W, TAB_H, label, tab === this.tab ? 'primary' : 'plain', () => this.openTab(tab), 44))
    }

    if (this.tab === 'working') {
      this.rows(
        working.map(c => ({ person: c, action: t('letGo'), kind: 'plain', faded: false, onTap: () => this.confirmLetGo(c.id, c.name, c.wage) })),
        t('noStaff'),
      )
    } else {
      this.rows(
        restaurant.todayCandidates().map((c, i) => ({ person: c, action: t('hire'), kind: 'primary', faded: restaurant.hireProblem(i) !== null, onTap: () => this.hire(i) })),
        t('noCandidates'),
      )
    }

    this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
  }

  private openTab(tab: Tab): void {
    this.tab = tab
    this.show()
  }

  /** Up to four rows from ROW_TOP with a thin line between them, or `empty` when there are none. */
  private rows(rows: Row[], empty: string): void {
    if (rows.length === 0) {
      this.keep(this.add.text(MID, EMPTY_Y, empty, { ...textStyle(36, '600'), align: 'center', wordWrap: { width: 860 } }).setOrigin(0.5))
      return
    }
    const lines = this.keep(this.add.graphics()).lineStyle(3, hex(C.tileSeam), 1)
    rows.slice(0, MAX_ROWS).forEach((row, i) => {
      const y0 = ROW_TOP + i * ROW_H
      if (i > 0) lines.lineBetween(ROW_LEFT, y0, ROW_RIGHT, y0)
      this.row(row, y0)
    })
  }

  private row(row: Row, y0: number): void {
    const { person } = row
    const view = new CharacterView(this, staffColors(person.look))
    view.setFacing('down')
    view.setPose('stand')
    this.keep(view.container.setPosition(FEET_X, y0 + 185))

    this.keep(this.add.text(TEXT_X, y0 + 40, person.name, textStyle(46)).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, y0 + 86, t('roleChef'), textStyle(32, '600')).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, y0 + 126, t('wagePerDay', { money: formatMoney(person.wage) }), textStyle(32, '600')).setOrigin(0, 0.5))
    this.specialty(person, y0 + BADGE_DY)
    const button = this.keep(addButton(this, ACTION_X, y0 + 105, ACTION_W, ACTION_H, row.action, row.kind, row.onTap, 44))
    if (row.faded) button.setAlpha(FADED_ALPHA)

    STAT_KEYS.forEach((k, i) => {
      const cx = ROW_LEFT + STAT_W * i + STAT_W / 2
      this.keep(this.add.text(cx, y0 + 222, t(STAT[k]), textStyle(30, '600')).setOrigin(0.5))
      const dots = this.keep(this.add.graphics()).lineStyle(3, hex(C.ink))
      for (let d = 0; d < 5; d++) {
        const x = cx + (d - 2) * DOT_STEP
        dots.fillStyle(hex(d < person.stats[k] ? C.mustard : C.tileSeam), 1).fillCircle(x, y0 + 255, DOT_R).strokeCircle(x, y0 + 255, DOT_R)
      }
    })
  }

  /** The dish the cook is good at: its icon and one small star per tier. */
  private specialty(person: ChefCandidate, y: number): void {
    const dish = DISH_IDS.find(d => person.tiers[d] > 0)
    if (!dish) return
    this.keep(this.add.image(TEXT_X + 22, y, `dish-${dish}`).setScale(BADGE_ICON))
    for (let s = 0; s < person.tiers[dish]; s++) {
      this.keep(this.add.image(TEXT_X + 54 + s * BADGE_STAR_STEP, y, 'star').setScale(BADGE_STAR))
    }
  }

  private hire(index: number): void {
    const { restaurant } = this.params
    const problem = restaurant.hire(index)
    if (problem) {
      this.toast(problem === 'money' ? t('hireNoMoney') : t('chefFull', { n: restaurant.chefCap() }))
      return
    }
    this.params.onChange()
    this.show()
  }

  /** A card over the panel that asks before letting a cook go. */
  private confirmLetGo(id: number, name: string, wage: number): void {
    const parts: Phaser.GameObjects.GameObject[] = []
    const close = () => {
      for (const p of parts) p.destroy()
    }
    const letGo = () => {
      close()
      this.params.restaurant.fire(id)
      this.params.onChange()
      this.show()
    }
    const text = t('letGoConfirm', { name, money: formatMoney(wage) })
    parts.push(
      this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.4).setOrigin(0).setInteractive().setDepth(CONFIRM_DEPTH),
      addCard(this, 90, 800, 900, 560).setDepth(CONFIRM_DEPTH),
      this.add.text(MID, 900, text, { ...textStyle(44, '600'), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0).setDepth(CONFIRM_DEPTH),
      addButton(this, MID - 190, 1230, 340, 120, t('cancel'), 'plain', close).setDepth(CONFIRM_DEPTH),
      addButton(this, MID + 190, 1230, 340, 120, t('letGo'), 'plain', letGo).setDepth(CONFIRM_DEPTH),
    )
  }

  /** Replaces the toast on screen, if any. */
  private toast(text: string): void {
    this.toastBox?.destroy()
    this.toastBox = addToast(this, MID, TOAST_Y, text).setDepth(TOAST_DEPTH)
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
