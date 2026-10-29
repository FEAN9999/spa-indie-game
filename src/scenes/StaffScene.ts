import * as Phaser from 'phaser'
import { C, staffColors } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import { moveDest, type Chain } from '../sim/chain'
import type { PlaceId } from '../sim/places'
import type { SpaSim } from '../sim/spa'
import { SERVICES } from '../sim/services'
import { STAT_KEYS, tuition, type Candidate, type Course, type StaffRole, type StatKey, type TraitId } from '../sim/staff'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { placeName } from '../view/chain'
import { courseName, moveOptions, specialtyOf, studyButton, traitLines, type StudyButton } from '../view/staffCard'
import { textStyle } from '../view/text'
import { addButton, addCard, addToast } from '../view/ui'

export interface StaffData {
  sim: SpaSim
  /** The chain `sim` belongs to: its branches are where staff can move. */
  chain: Chain
  /** The first time the panel opens: it says how hiring works. */
  intro: boolean
  /** The first time the panel opens after the hire intro is done and a technician works here: it says what study does. */
  studyIntro: boolean
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
// the study intro is two short lines that must not wrap again (the card is 1000 wide)
const STUDY_INTRO_WRAP = 940
const TAB_Y = 500
const TAB_W = 440
const TAB_H = 120
const TAB_X = { working: 300, hiring: 780 } as const
const ROW_TOP = 590
const ROW_H = 290
const MAX_ROWS = 4
// with a branch open the working tab gives each row a move line under the stats
const MOVE_ROW_H = 380
const MOVE_MAX_ROWS = 3
const MOVE_DY = 330
// the page arrows sit either side of "Xong"
const ARROW_X = 150
const ARROW_W = 100
const ARROW_H = 130
const ROW_LEFT = 90
const ROW_RIGHT = 990
const FEET_X = 150
const TEXT_X = 250
const ACTION_X = 860
const ACTION_W = 260
const ACTION_H = 120
// on the working tab the study button sits above "Cho nghỉ"
const PAIR_W = 260
const PAIR_H = 96
const STUDY_DY = 54
const LET_GO_DY = 154
const PAIR_SIZE = 36
// the specialty badges: a service icon and up to three small stars, in a line under the wage
const BADGE_DY = 172
const BADGE_ICON = 0.7
const BADGE_STAR = 0.25
const BADGE_STAR_STEP = 20
const BADGE_STEP = 120
// with 5 or 6 specialties the step shrinks and each tier's stars stand in a column right of the icon
const BADGE_STEP_TIGHT = 80
const BADGE_STAR_COLUMN_STEP = 16
const BADGE_TIGHT_FROM = 5
// the booked box: the book at the left, the text after it, both inside the rounded ends
const BOOK_X = -100
const BOOK_SCALE = 0.71
const BOOKED_TEXT_X = -70
const BOOKED_SIZE = 26
const TRAIT_SIZE = 22
const TRAIT_H = 63
const TRAIT_TOP = 34
const TRAIT_TEXT_DY = -7
const TRAIT_DY = 38
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
  /** The study button above the action, for staff only. */
  study?: { state: StudyButton; onTap: () => void }
  /** The move line, when the chain has a branch: tomorrow's shop if one is booked, `open` asks where, `stay` cancels. */
  move?: { to: PlaceId | null | undefined; open: () => void; stay: () => void }
}

/**
 * The staff panel over the frozen shop: who works here, with "Cho nghỉ", and today's people to hire, with "Thuê".
 * Every tap stays in this scene, so the shop, its top bar and its buttons wait underneath.
 */
export class StaffScene extends Phaser.Scene {
  private params!: StaffData
  private tab: Tab = 'working'
  private page = 0
  /** Everything drawn for the panel on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor() {
    super('StaffScene')
  }

  init(data: StaffData) {
    this.params = data
    this.tab = data.sim.staff.length === 0 ? 'hiring' : 'working'
    this.page = 0
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
    const { sim, chain, intro, studyIntro } = this.params
    this.keep(addCard(this, 40, 230, 1000, 1760))
    this.keep(this.add.text(MID, TITLE_Y, this.params.chain.branches.length ? t('staffTitleAt', { place: placeName(this.params.chain.at) }) : t('staffTitle'), textStyle(60)).setOrigin(0.5))
    if (intro || studyIntro) {
      this.keep(this.add.text(MID, INTRO_Y, t(intro ? 'staffIntro' : 'studyIntro'), { ...textStyle(32, '600'), align: 'center', wordWrap: { width: intro ? INTRO_WRAP : STUDY_INTRO_WRAP } }).setOrigin(0.5))
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
          onTap: () => this.confirmLetGo(s.id, s.name, s.wage, s.study?.paid),
          study: { state: studyButton(sim, s), onTap: () => this.studyTap(s.id) },
          move: chain.branches.length
            ? {
                to: s.moveTo === null ? undefined : moveDest(s.moveTo),
                open: () => this.chooseShop(s.id, s.name),
                stay: () => {
                  chain.stay(chain.at, s.id)
                  this.params.onChange()
                  this.show()
                },
              }
            : undefined,
        })),
        t('noStaff'),
        chain.branches.length > 0,
      )
    } else {
      this.rows(
        sim.candidates.map((c, i) => ({
          person: c,
          role: t(ROLE[c.role]),
          action: t('hire'),
          kind: 'primary',
          faded: sim.hireProblem(i) !== null,
          onTap: () => this.hire(i),
        })),
        t('noCandidates'),
        false,
      )
      if (sim.money < 0) this.keep(this.add.text(MID, NOTE_Y, t('hireNoMoney'), textStyle(34, '600', C.lantern)).setOrigin(0.5))
    }

    this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
  }

  private openTab(tab: Tab): void {
    this.tab = tab
    this.page = 0
    this.show()
  }

  private turnPage(by: number, pages: number): void {
    this.page = (this.page + by + pages) % pages
    this.show()
  }

  /** One page of up to four rows (three of the taller kind when `tall`) from ROW_TOP with a thin line between them and arrows when there are more, or `empty` when there are none. */
  private rows(rows: Row[], empty: string, tall: boolean): void {
    if (rows.length === 0) {
      this.keep(this.add.text(MID, EMPTY_Y, empty, { ...textStyle(36, '600'), align: 'center', wordWrap: { width: 860 } }).setOrigin(0.5))
      return
    }
    const lines = this.keep(this.add.graphics()).lineStyle(3, hex(C.tileSeam), 1)
    const perPage = tall ? MOVE_MAX_ROWS : MAX_ROWS
    const rowH = tall ? MOVE_ROW_H : ROW_H
    const pages = Math.ceil(rows.length / perPage)
    // a firing can leave fewer pages than the one on show
    this.page = Math.min(this.page, pages - 1)
    rows.slice(this.page * perPage, (this.page + 1) * perPage).forEach((row, i) => {
      const y0 = ROW_TOP + i * rowH
      if (i > 0) lines.lineBetween(ROW_LEFT, y0, ROW_RIGHT, y0)
      this.row(row, y0)
    })
    if (pages > 1) {
      this.keep(addButton(this, ARROW_X, DONE_Y, ARROW_W, ARROW_H, t('prevPage'), 'plain', () => this.turnPage(-1, pages), 64))
      this.keep(addButton(this, GAME_W - ARROW_X, DONE_Y, ARROW_W, ARROW_H, t('nextPage'), 'plain', () => this.turnPage(1, pages), 64))
    }
  }

  private row(row: Row, y0: number): void {
    const { person } = row
    const view = new CharacterView(this, staffColors(person.look))
    view.setFacing('down')
    view.setPose('stand')
    this.keep(view.container.setPosition(FEET_X, y0 + 185))

    const name = this.keep(this.add.text(TEXT_X, y0 + 40, person.name, textStyle(46)).setOrigin(0, 0.5))
    const rare = person.rare ? this.rarePill(name.x + name.width + 18, y0 + 40) : 0
    this.traitPill(name.x + name.width + (rare ? rare + 36 : 18), y0 + TRAIT_DY, person.trait)
    this.keep(this.add.text(TEXT_X, y0 + 86, row.role, textStyle(32, '600')).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, y0 + 126, t('wagePerDay', { money: formatMoney(person.wage) }), textStyle(32, '600')).setOrigin(0, 0.5))
    this.badges(person, y0 + BADGE_DY)
    if (row.study) {
      this.studyButtonView(row.study.state, y0 + STUDY_DY, row.study.onTap)
      this.keep(addButton(this, ACTION_X, y0 + LET_GO_DY, PAIR_W, PAIR_H, row.action, row.kind, row.onTap, PAIR_SIZE))
    } else {
      const button = this.keep(addButton(this, ACTION_X, y0 + 105, ACTION_W, ACTION_H, row.action, row.kind, row.onTap, 44))
      if (row.faded) button.setAlpha(FADED_ALPHA)
    }

    if (row.move) this.moveLine(row.move, y0 + MOVE_DY)

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

  /** The move line: a button that asks where, or tomorrow's shop on a mustard strip with a button that cancels. */
  private moveLine(move: NonNullable<Row['move']>, y: number): void {
    if (move.to === undefined) {
      this.keep(addButton(this, ACTION_X, y, PAIR_W, PAIR_H, t('moveButton'), 'plain', move.open, PAIR_SIZE))
      return
    }
    const w = ACTION_X - PAIR_W / 2 - 20 - TEXT_X
    const bg = this.add
      .graphics()
      .fillStyle(hex(C.mustard), 1)
      .fillRoundedRect(-w / 2, -PAIR_H / 2, w, PAIR_H, PAIR_H / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -PAIR_H / 2, w, PAIR_H, PAIR_H / 2)
    const text = this.add.text(0, 0, t('moveTomorrow', { place: placeName(move.to) }), textStyle(32, '600')).setOrigin(0.5)
    this.keep(this.add.container(TEXT_X + w / 2, y, [bg, text]))
    this.keep(addButton(this, ACTION_X, y, PAIR_W, PAIR_H, t('moveStay'), 'plain', move.stay, PAIR_SIZE))
  }

  /** A service icon and its tier's stars for each specialty, closed services faded. */
  private badges(person: Candidate, y: number): void {
    const list = specialtyOf(person, this.params.sim.services)
    const tight = list.length >= BADGE_TIGHT_FROM
    const step = tight ? BADGE_STEP_TIGHT : BADGE_STEP
    list.forEach((b, i) => {
      const x = TEXT_X + i * step
      const alpha = b.dim ? FADED_ALPHA : 1
      this.keep(this.add.image(x + 22, y, `svc-${b.service}`).setScale(BADGE_ICON).setAlpha(alpha))
      for (let s = 0; s < b.tier; s++) {
        const sx = tight ? x + 54 : x + 54 + s * BADGE_STAR_STEP
        const sy = tight ? y + (s - (b.tier - 1) / 2) * BADGE_STAR_COLUMN_STEP : y
        this.keep(this.add.image(sx, sy, 'star').setScale(BADGE_STAR).setAlpha(alpha))
      }
    })
  }

  /** The study button: tonight's course with a book when one is booked, else a button that is faded when it does nothing. */
  private studyButtonView(state: StudyButton, y: number, onTap: () => void): void {
    if (state.kind === 'booked') {
      const bg = this.add
        .graphics()
        .fillStyle(hex(C.cream), 1)
        .fillRoundedRect(-PAIR_W / 2, -PAIR_H / 2, PAIR_W, PAIR_H, PAIR_H / 2)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(-PAIR_W / 2, -PAIR_H / 2, PAIR_W, PAIR_H, PAIR_H / 2)
      const book = this.add.image(BOOK_X, 0, 'icon-book').setScale(BOOK_SCALE)
      const text = this.add.text(BOOKED_TEXT_X, 0, t('studyTonight', { course: courseName(state.course) }), textStyle(BOOKED_SIZE, '600')).setOrigin(0, 0.5)
      this.keep(this.add.container(ACTION_X, y, [bg, book, text]))
      return
    }
    const label = t(state.kind === 'best' ? 'studyBest' : 'study')
    const button = this.keep(addButton(this, ACTION_X, y, PAIR_W, PAIR_H, label, 'plain', onTap, PAIR_SIZE))
    if (state.kind !== 'open') button.setAlpha(FADED_ALPHA)
  }

  /** A tap on a study button: nothing to learn does nothing, no money says so, one course asks to confirm, more let the owner pick. */
  private studyTap(id: number): void {
    const { sim } = this.params
    const person = sim.staff.find(s => s.id === id)
    if (!person) return
    const state = studyButton(sim, person)
    if (state.kind === 'noMoney') this.toast(t('studyNoMoney'))
    else if (state.kind === 'open' && state.courses.length === 1) this.confirmStudy(id, state.courses[0])
    else if (state.kind === 'open') this.chooseCourse(id, state.courses)
  }

  /** A mustard "Hiếm" pill whose left edge is at x; returns its width. */
  private rarePill(x: number, y: number): number {
    const label = this.add.text(0, 0, t('rare'), textStyle(26, '800')).setOrigin(0.5)
    const w = label.width + 28
    const pill = this.add
      .graphics()
      .fillStyle(hex(C.mustard), 1)
      .fillRoundedRect(-w / 2, -21, w, 42, 21)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -21, w, 42, 21)
    this.keep(this.add.container(x + w / 2, y, [pill, label]))
    return w
  }

  /** A cream two-line pill, good side over flaw, whose left edge is at x and centre line at y. */
  private traitPill(x: number, y: number, trait: TraitId): void {
    const [good, flaw] = traitLines(trait)
    const top = this.add.text(0, TRAIT_TEXT_DY - 13, good, textStyle(TRAIT_SIZE, '800')).setOrigin(0.5)
    const bottom = this.add.text(0, TRAIT_TEXT_DY + 13, flaw, textStyle(TRAIT_SIZE, '600')).setOrigin(0.5)
    const w = Math.max(top.width, bottom.width) + 24
    const pill = this.add
      .graphics()
      .fillStyle(hex(C.cream), 1)
      .fillRoundedRect(-w / 2, -TRAIT_TOP, w, TRAIT_H, 18)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -TRAIT_TOP, w, TRAIT_H, 18)
    this.keep(this.add.container(x + w / 2, y, [pill, top, bottom]))
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
  private confirmLetGo(id: number, name: string, wage: number, refund?: number): void {
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
    // a booked course is paid back when they go
    const text = t('letGoConfirm', { name, money: formatMoney(wage) }) + (refund ? `\n${t('letGoRefund', { money: formatMoney(refund) })}` : '')
    parts.push(
      this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.4).setOrigin(0).setInteractive().setDepth(CONFIRM_DEPTH),
      addCard(this, 90, 800, 900, 560).setDepth(CONFIRM_DEPTH),
      this.add.text(MID, 900, text, { ...textStyle(44, '600'), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0).setDepth(CONFIRM_DEPTH),
      addButton(this, MID - 190, 1230, 340, 120, t('cancel'), 'plain', close).setDepth(CONFIRM_DEPTH),
      addButton(this, MID + 190, 1230, 340, 120, t('letGo'), 'plain', letGo).setDepth(CONFIRM_DEPTH),
    )
  }

  /** The overlay and card of a question over the panel; `close` takes all of it down. */
  private askCard(x: number, y: number, w: number, h: number): { parts: Phaser.GameObjects.GameObject[]; close: () => void } {
    const parts: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.4).setOrigin(0).setInteractive().setDepth(CONFIRM_DEPTH),
      addCard(this, x, y, w, h).setDepth(CONFIRM_DEPTH),
    ]
    return {
      parts,
      close: () => {
        for (const p of parts) p.destroy()
      },
    }
  }

  /** A card that lists what the person can learn, one button each, faded when it costs more than the money. */
  private chooseCourse(id: number, open: Course[]): void {
    const { sim } = this.params
    const person = sim.staff.find(s => s.id === id)
    if (!person) return
    const rowH = 130
    const h = 240 + open.length * rowH + 140
    const y = 1100 - h / 2
    const { parts, close } = this.askCard(90, y, 900, h)
    parts.push(this.add.text(MID, y + 70, t('studyPick', { name: person.name }), { ...textStyle(44, '600'), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0).setDepth(CONFIRM_DEPTH))
    open.forEach((course, i) => {
      const price = tuition(person, course)
      const money = formatMoney(price)
      const label = course === 'greet' ? t('studyGreetOption', { n: person.stats.friendly + 1, money }) : t('studyOption', { course: t(SERVICES[course].name), n: person.tiers[course] + 1, money })
      const pick = () => {
        if (sim.money < price) {
          this.toast(t('studyNoMoney'))
          return
        }
        close()
        this.confirmStudy(id, course)
      }
      const button = addButton(this, MID, y + 250 + i * rowH, 760, 110, label, 'plain', pick, 36).setDepth(CONFIRM_DEPTH)
      if (sim.money < price) button.setAlpha(FADED_ALPHA)
      parts.push(button)
    })
    parts.push(addButton(this, MID, y + 250 + open.length * rowH + 20, 340, 110, t('cancel'), 'plain', close).setDepth(CONFIRM_DEPTH))
  }

  /** A card that lists the shops the person can move to, one button each, faded and inert when it has no room. */
  private chooseShop(id: number, name: string): void {
    const { chain } = this.params
    const options = moveOptions(chain, chain.at, id)
    const rowH = 130
    const h = 240 + options.length * rowH + 140
    const y = 1100 - h / 2
    const { parts, close } = this.askCard(90, y, 900, h)
    parts.push(this.add.text(MID, y + 70, t('movePick', { name }), { ...textStyle(44, '600'), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0).setDepth(CONFIRM_DEPTH))
    options.forEach(({ place, full }, i) => {
      const pick = () => {
        if (full) return
        close()
        chain.move(chain.at, id, place)
        this.params.onChange()
        this.show()
      }
      const label = full ? t('moveFull', { place: placeName(place) }) : placeName(place)
      const button = addButton(this, MID, y + 250 + i * rowH, 760, 110, label, 'plain', pick, 36).setDepth(CONFIRM_DEPTH)
      if (full) button.setAlpha(FADED_ALPHA)
      parts.push(button)
    })
    parts.push(addButton(this, MID, y + 250 + options.length * rowH + 20, 340, 110, t('cancel'), 'plain', close).setDepth(CONFIRM_DEPTH))
  }

  /** A card over the panel that asks before the course is paid for. */
  private confirmStudy(id: number, course: Course): void {
    const { sim } = this.params
    const person = sim.staff.find(s => s.id === id)
    if (!person) return
    const { parts, close } = this.askCard(90, 800, 900, 560)
    const go = () => {
      close()
      const problem = sim.study(id, course)
      if (problem === 'money') {
        this.toast(t('studyNoMoney'))
        return
      }
      this.params.onChange()
      this.show()
    }
    const text = t('studyConfirm', { name: person.name, course: courseName(course), money: formatMoney(tuition(person, course)) })
    parts.push(
      this.add.text(MID, 900, text, { ...textStyle(44, '600'), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0).setDepth(CONFIRM_DEPTH),
      addButton(this, MID - 190, 1230, 340, 120, t('cancel'), 'plain', close).setDepth(CONFIRM_DEPTH),
      addButton(this, MID + 190, 1230, 340, 120, t('study'), 'plain', go).setDepth(CONFIRM_DEPTH),
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
