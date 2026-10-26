import * as Phaser from 'phaser'
import { C, staffColors } from '../art/palette'
import { GAME_H, GAME_W, STAFF_CAP } from '../config'
import type { HireProblem, SpaSim } from '../sim/spa'
import { STAT_KEYS, type Candidate, type StaffRole, type StatKey } from '../sim/staff'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { textStyle } from '../view/text'
import { addButton, addCard, addToast } from '../view/ui'

export interface StaffData {
  sim: SpaSim
  /** The first time the panel opens: it says how hiring works. */
  intro: boolean
  /** After a hire or a letting go: save. */
  onChange: () => void
  onClose: () => void
}

type Tab = 'working' | 'hiring'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
// the title and the two-line intro sit high enough that their boxes clear each other and the tabs
const TITLE_Y = 290
const INTRO_Y = 385
/** Breaks the intro after its first sentence. */
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
const STAT_W = 225
const DOT_R = 10
const DOT_STEP = 26
const EMPTY_Y = 800
const NOTE_Y = 1785
const DONE_Y = 1895
const TOAST_Y = 2060
const FADED_ALPHA = 0.45
const CONFIRM_DEPTH = 10
const TOAST_DEPTH = 20

const ROLE: Record<StaffRole, StringKey> = { receptionist: 'roleReceptionist', technician: 'roleTechnician' }
const FULL: Record<StaffRole, StringKey> = { receptionist: 'hireFullReceptionist', technician: 'hireFullTechnician' }
const STAT: Record<StatKey, StringKey> = { skill: 'statSkill', speed: 'statSpeed', friendly: 'statFriendly', stamina: 'statStamina' }

/** One row's person, staff or candidate, and the button on its right. */
interface Row {
  person: Candidate
  /** The role line: the role, and the level for staff. */
  role: string
  action: string
  kind: 'primary' | 'plain'
  faded: boolean
  onTap: () => void
}

/**
 * The staff panel over the frozen shop: who works here, with "Cho nghỉ", and today's people to hire, with "Thuê".
 * Every tap stays in this scene, so the shop, its top bar and its buttons wait underneath.
 */
export class StaffScene extends Phaser.Scene {
  private params!: StaffData
  private tab: Tab = 'working'
  /** Everything drawn for the panel on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor() {
    super('StaffScene')
  }

  init(data: StaffData) {
    this.params = data
    this.tab = 'working'
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
    const { sim, intro } = this.params
    this.keep(addCard(this, 40, 230, 1000, 1760))
    this.keep(this.add.text(MID, TITLE_Y, t('staffTitle'), textStyle(60)).setOrigin(0.5))
    if (intro) {
      this.keep(this.add.text(MID, INTRO_Y, t('staffIntro'), { ...textStyle(32, '600'), align: 'center', wordWrap: { width: INTRO_WRAP } }).setOrigin(0.5))
    }
    const working = sim.staff.filter(s => !s.leaving)
    const tabs: { tab: Tab; label: string }[] = [
      { tab: 'working', label: t('tabWorking', { n: working.length }) },
      { tab: 'hiring', label: t('tabHiring') },
    ]
    for (const { tab, label } of tabs) {
      this.keep(addButton(this, TAB_X[tab], TAB_Y, TAB_W, TAB_H, label, tab === this.tab ? 'primary' : 'plain', () => this.openTab(tab), 44))
    }

    if (this.tab === 'working') {
      this.rows(
        working.map(s => ({
          person: s,
          role: `${t(ROLE[s.role])} · ${t('staffLevel', { n: s.level })}`,
          action: t('letGo'),
          kind: 'plain',
          faded: false,
          onTap: () => this.confirmLetGo(s.id, s.name, s.wage),
        })),
        t('noStaff'),
      )
    } else {
      this.rows(
        sim.candidates.map((c, i) => ({
          person: c,
          role: t(ROLE[c.role]),
          action: t('hire'),
          kind: 'primary',
          faded: this.refusal(c) !== null,
          onTap: () => this.hire(i),
        })),
        t('noCandidates'),
      )
      if (sim.money < 0) this.keep(this.add.text(MID, NOTE_Y, t('hireNoMoney'), textStyle(34, '600', C.lantern)).setOrigin(0.5))
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

    const name = this.keep(this.add.text(TEXT_X, y0 + 50, person.name, textStyle(46)).setOrigin(0, 0.5))
    if (person.rare) this.rarePill(name.x + name.width + 18, y0 + 50)
    this.keep(this.add.text(TEXT_X, y0 + 108, row.role, textStyle(32, '600')).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, y0 + 160, t('wagePerDay', { money: formatMoney(person.wage) }), textStyle(32, '600')).setOrigin(0, 0.5))
    const button = this.keep(addButton(this, ACTION_X, y0 + 105, ACTION_W, ACTION_H, row.action, row.kind, row.onTap, 44))
    if (row.faded) button.setAlpha(FADED_ALPHA)

    STAT_KEYS.forEach((k, i) => {
      const cx = ROW_LEFT + STAT_W * i + STAT_W / 2
      this.keep(this.add.text(cx, y0 + 215, t(STAT[k]), textStyle(26, '600')).setOrigin(0.5))
      const dots = this.keep(this.add.graphics()).lineStyle(3, hex(C.ink))
      for (let d = 0; d < 5; d++) {
        const x = cx + (d - 2) * DOT_STEP
        dots.fillStyle(hex(d < person.stats[k] ? C.mustard : C.tileSeam), 1).fillCircle(x, y0 + 255, DOT_R).strokeCircle(x, y0 + 255, DOT_R)
      }
    })
  }

  /** A mustard "Hiếm" pill whose left edge is at x. */
  private rarePill(x: number, y: number): void {
    const label = this.add.text(0, 0, t('rare'), textStyle(26, '800')).setOrigin(0.5)
    const w = label.width + 28
    const pill = this.add
      .graphics()
      .fillStyle(hex(C.mustard), 1)
      .fillRoundedRect(-w / 2, -21, w, 42, 21)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -21, w, 42, 21)
    this.keep(this.add.container(x + w / 2, y, [pill, label]))
  }

  /** What `hire` would refuse with, so its button can be faded beforehand. */
  private refusal(c: Candidate): HireProblem | null {
    const { sim } = this.params
    if (sim.money < 0) return 'money'
    return sim.staff.filter(s => s.role === c.role && !s.leaving).length >= STAFF_CAP[c.role] ? 'full' : null
  }

  private hire(index: number): void {
    const { sim } = this.params
    const role = sim.candidates[index].role
    const problem = sim.hire(index)
    if (problem) {
      this.toast(t(problem === 'money' ? 'hireNoMoney' : FULL[role]))
      return
    }
    this.params.onChange()
    this.show()
  }

  /** A card over the panel that asks before letting someone go. */
  private confirmLetGo(id: number, name: string, wage: number): void {
    const parts: Phaser.GameObjects.GameObject[] = []
    const close = () => {
      for (const p of parts) p.destroy()
    }
    const letGo = () => {
      close()
      this.params.sim.fire(id)
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
