import * as Phaser from 'phaser'
import { C, customerColors } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { MainKind } from '../sim/customers'
import { REGULARS, isMember, type RegularId } from '../sim/regulars'
import { IDOLS, type IdolId } from '../sim/idols'
import { SERVICES } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import { VIPS, VIP_KIND, type VipId } from '../sim/vips'
import { IDOL_TEXT } from '../strings/idols'
import { REGULAR_TEXT } from '../strings/regulars'
import { VIP_TEXT } from '../strings/vips'
import { t, type StringKey } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { bookTabs, detailLines, firstTab, idolDetailLines, idolRows, kindRows, regularRows, vipDetailLines, vipRows, type IdolRow, type KindRow, type RegularRow, type Tab, type VipRow } from '../view/guestBook'
import { humText } from '../view/idol'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export interface GuestBookData {
  sim: SpaSim
  /** The first time the book opens. */
  intro: boolean
  onClose: () => void
}

type Detail = { kind: 'regular'; id: RegularId } | { kind: 'vip'; id: VipId } | { kind: 'idol'; id: IdolId }

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TITLE_Y = 290
const INTRO_Y = 380
const INTRO_WRAP = 860
const TAB_Y = 500
const TAB_H = 120
/** Two tabs of 440 across the card, three of 300 once the VIP or star tab shows, or four of 230 with both; the label shrinks as they narrow. */
const TAB_LAYOUT = {
  2: { w: 440, x: [300, 780], size: 44 },
  3: { w: 300, x: [200, 540, 880], size: 44 },
  4: { w: 230, x: [177, 419, 661, 903], size: 34 },
} as const
const TAB_LABEL: Record<Tab, StringKey> = { regulars: 'tabRegulars', kinds: 'tabKinds', vip: 'tabVip', idol: 'tabIdol' }
const DONE_Y = 1895
const GRID_TOP = 590
const CELL_W = 430
const CELL_H = 290
const COL_X = [70, 580] as const
const FIGURE_SCALE = 1.4
const DETAIL_SCALE = 2
const UNMET_ALPHA = 0.25
const TEXT_LEFT = 150
const TEXT_WRAP = 270
const HEART_SCALE = 0.7
const STORY_WRAP = 860
const KIND_ROW_H = 230
const VIP_CELL_H = 520
const STAR_SCALE = 0.5
const IDOL_COL_X = [55, 390, 725] as const
const IDOL_CELL_W = 300
const IDOL_CELL_H = 400
const IDOL_SCALE = 1.2

const KIND_NAME: Record<MainKind, StringKey> = {
  student: 'kindStudent',
  office: 'kindOffice',
  picky: 'kindPicky',
  elder: 'kindElder',
  celeb: 'kindCeleb',
}

/**
 * The guest book over the frozen shop: the regulars with their hearts, cards and stories, the five kinds of customer, the VIPs and the stars.
 * Every tap stays in this scene, so the shop waits underneath.
 */
export class GuestBookScene extends Phaser.Scene {
  private params!: GuestBookData
  /** Everything drawn for the panel on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private tab: Tab = 'regulars'
  /** The regular, VIP or star whose page is open, if any. */
  private detail: Detail | null = null

  constructor() {
    super('GuestBookScene')
  }

  init(data: GuestBookData) {
    this.params = data
    this.shown = []
    this.tab = firstTab(data.sim.book, data.sim.vip)
    this.detail = null
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.show()
  }

  private keep<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.shown.push(obj)
    return obj
  }

  /** Draws the whole panel again. */
  private show(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
    this.keep(addCard(this, 40, 230, 1000, 1760))
    this.keep(this.add.text(MID, TITLE_Y, t('bookTitle'), textStyle(60)).setOrigin(0.5))
    if (this.detail?.kind === 'regular') this.showDetail(this.detail.id)
    else if (this.detail?.kind === 'vip') this.showVipDetail(this.detail.id)
    else if (this.detail?.kind === 'idol') this.showIdolDetail(this.detail.id)
    else {
      if (this.params.intro && this.tab === 'regulars') {
        this.keep(this.add.text(MID, INTRO_Y, t('bookIntro'), { ...textStyle(32, '600'), align: 'center', wordWrap: { width: INTRO_WRAP } }).setOrigin(0.5))
      }
      const tabs = bookTabs(this.params.sim.vip, this.params.sim.idol)
      const layout = TAB_LAYOUT[tabs.length as 2 | 3 | 4]
      tabs.forEach((tab, i) => {
        this.keep(addButton(this, layout.x[i], TAB_Y, layout.w, TAB_H, t(TAB_LABEL[tab]), tab === this.tab ? 'primary' : 'plain', () => this.openTab(tab), layout.size))
      })
      if (this.tab === 'regulars') regularRows(this.params.sim.book).forEach((row, i) => this.cell(row, i))
      else if (this.tab === 'kinds') kindRows(this.params.sim.book).forEach((row, i) => this.kindRow(row, i))
      else if (this.tab === 'vip') vipRows(this.params.sim.vip).forEach((row, i) => this.vipCell(row, i))
      else idolRows(this.params.sim.idol).forEach((row, i) => this.idolCell(row, i))
    }
    if (this.detail) {
      this.keep(addButton(this, MID, DONE_Y, 560, 130, t('back'), 'primary', () => this.openDetail(null)))
    } else {
      this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
    }
  }

  private openTab(tab: Tab): void {
    this.tab = tab
    this.show()
  }

  private openDetail(detail: Detail | null): void {
    this.detail = detail
    this.show()
  }

  /** A figure standing, facing down, with its feet at x, y. */
  private figure(x: number, y: number, scale: number, colors: ReturnType<typeof customerColors>, alpha = 1): void {
    const view = new CharacterView(this, colors)
    view.container.setPosition(x, y).setScale(scale).setAlpha(alpha)
    this.keep(view.container)
  }

  private heartRow(x: number, y: number, hearts: number): void {
    for (let i = 0; i < 5; i++) {
      this.keep(this.add.image(x + i * 42, y, i < hearts ? 'heart-full' : 'heart-empty').setScale(HEART_SCALE).setOrigin(0, 0.5))
    }
  }

  /** One regular in the grid: a met one opens their story when tapped. */
  private cell(row: RegularRow, i: number): void {
    const x0 = COL_X[i % 2]
    const y0 = GRID_TOP + Math.floor(i / 2) * CELL_H
    const spec = REGULARS[row.id]
    const colors = customerColors(spec.look, spec.kind, row.id)
    this.keep(addCard(this, x0, y0, CELL_W, CELL_H - 20))
    this.figure(x0 + 75, y0 + CELL_H - 60, FIGURE_SCALE, colors, row.shown === 'met' ? 1 : UNMET_ALPHA)
    const tx = x0 + TEXT_LEFT
    if (row.shown === 'met') {
      this.keep(this.add.text(tx, y0 + 50, REGULAR_TEXT[row.id].name, { ...textStyle(40), wordWrap: { width: TEXT_WRAP } }).setOrigin(0, 0.5))
      this.heartRow(tx, y0 + 115, row.hearts)
      if (row.member) this.keep(this.add.image(tx, y0 + 175, 'icon-card').setScale(0.8).setOrigin(0, 0.5))
      this.keep(
        this.add
          .rectangle(x0, y0, CELL_W, CELL_H - 20, 0xffffff, 0)
          .setOrigin(0)
          .setInteractive()
          .on('pointerup', () => this.openDetail({ kind: 'regular', id: row.id })),
      )
    } else {
      this.keep(this.add.text(tx, y0 + 50, '???', textStyle(40)).setOrigin(0, 0.5))
      const text = row.shown === 'friend' ? t('regularFriend', { name: REGULAR_TEXT[row.by].name }) : t('regularSoon')
      this.keep(this.add.text(tx, y0 + 95, text, { ...textStyle(32, '600'), wordWrap: { width: TEXT_WRAP } }).setOrigin(0, 0))
    }
  }

  /** One regular's story: her first words, then lines 1 to her hearts, and a hint that more follow. */
  private showDetail(id: RegularId): void {
    const { sim } = this.params
    const spec = REGULARS[id]
    const text = REGULAR_TEXT[id]
    const hearts = sim.book.regulars[id].hearts
    this.figure(230, 690, DETAIL_SCALE, customerColors(spec.look, spec.kind, id))
    const tx = 400
    this.keep(this.add.text(tx, 450, text.name, { ...textStyle(54), wordWrap: { width: 600 } }).setOrigin(0, 0.5))
    this.keep(this.add.text(tx, 515, text.job, { ...textStyle(32, '600'), wordWrap: { width: 600 } }).setOrigin(0, 0.5))
    this.keep(this.add.text(tx, 575, t('regularLikes', { service: t(SERVICES[spec.likes].name) }), textStyle(32, '600')).setOrigin(0, 0.5))
    this.heartRow(tx, 635, hearts)
    if (isMember(sim.book.regulars[id])) {
      this.keep(this.add.image(tx + 240, 635, 'icon-card').setScale(0.8).setOrigin(0, 0.5))
      this.keep(this.add.text(tx, 700, t('memberCard'), textStyle(32, '800', C.teal)).setOrigin(0, 0.5))
    }
    let y = 790
    const lines = detailLines(sim.book, id)
    for (const words of lines) {
      const line = this.keep(this.add.text(90, y, words, { ...textStyle(32, '600'), wordWrap: { width: STORY_WRAP } }).setOrigin(0, 0))
      y += line.height + 28
    }
    if (hearts < 5) this.keep(this.add.text(MID, y + 20, t('storyLocked'), { ...textStyle(32, '800', C.lantern), align: 'center' }).setOrigin(0.5, 0))
  }

  /** One VIP's page: her figure, name, role, service and stars, then the lines she has said so far. */
  private showVipDetail(id: VipId): void {
    const { sim } = this.params
    const text = VIP_TEXT[id]
    const state = sim.vip.vips[id]
    this.figure(230, 690, DETAIL_SCALE, customerColors(VIPS[id].look, VIP_KIND, null, id))
    const tx = 400
    this.keep(this.add.text(tx, 450, text.name, { ...textStyle(54), wordWrap: { width: 600 } }).setOrigin(0, 0.5))
    this.keep(this.add.text(tx, 515, text.role, { ...textStyle(32, '600'), wordWrap: { width: 600 } }).setOrigin(0, 0.5))
    this.keep(this.add.text(tx, 575, t('regularLikes', { service: t(SERVICES[VIPS[id].service].name) }), textStyle(32, '600')).setOrigin(0, 0.5))
    for (let s = 0; s < 3; s++) {
      this.keep(this.add.image(tx + 28 + s * 56, 640, s < state.best ? 'star' : 'star-empty').setScale(STAR_SCALE))
    }
    let y = 790
    for (const words of vipDetailLines(id, state)) {
      const line = this.keep(this.add.text(90, y, words, { ...textStyle(32, '600'), wordWrap: { width: STORY_WRAP } }).setOrigin(0, 0))
      y += line.height + 28
    }
  }

  /** One star's page: their figure, name, role, service, song and stars, then the lines they have said so far. */
  private showIdolDetail(id: IdolId): void {
    const { sim } = this.params
    const text = IDOL_TEXT[id]
    const state = sim.idol.idols[id]
    this.figure(230, 690, DETAIL_SCALE, customerColors(IDOLS[id].look, VIP_KIND, null, null, false, id))
    const tx = 400
    this.keep(this.add.text(tx, 450, text.name, { ...textStyle(54), wordWrap: { width: 600 } }).setOrigin(0, 0.5))
    this.keep(this.add.text(tx, 515, text.role, { ...textStyle(32, '600'), wordWrap: { width: 600 } }).setOrigin(0, 0.5))
    this.keep(this.add.text(tx, 575, t('regularLikes', { service: t(SERVICES[IDOLS[id].service].name) }), { ...textStyle(32, '600'), wordWrap: { width: 600 } }).setOrigin(0, 0.5))
    this.keep(this.add.text(tx, 635, t('idolHums', { song: humText(id) }), { ...textStyle(32, '600'), wordWrap: { width: 600 } }).setOrigin(0, 0.5))
    for (let s = 0; s < 3; s++) {
      this.keep(this.add.image(tx + 28 + s * 56, 700, s < state.best ? 'star' : 'star-empty').setScale(STAR_SCALE))
    }
    this.keep(this.add.text(tx, 760, t('vipVisits', { n: state.visits }), textStyle(32, '600')).setOrigin(0, 0.5))
    let y = 850
    for (const words of idolDetailLines(id, state)) {
      const line = this.keep(this.add.text(90, y, words, { ...textStyle(32, '600'), wordWrap: { width: STORY_WRAP } }).setOrigin(0, 0))
      y += line.height + 28
    }
  }

  private kindRow(row: KindRow, i: number): void {
    const y0 = GRID_TOP + i * KIND_ROW_H
    const cy = y0 + KIND_ROW_H / 2
    if (i > 0) this.keep(this.add.graphics()).lineStyle(3, hex(C.tileSeam), 1).lineBetween(90, y0, 990, y0)
    this.figure(190, y0 + KIND_ROW_H - 35, FIGURE_SCALE, customerColors({ skin: 0, hair: 0, hairStyle: 0, shirt: 0 }, row.kind), row.met ? 1 : UNMET_ALPHA)
    this.keep(this.add.text(330, cy - 30, t(KIND_NAME[row.kind]), textStyle(46)).setOrigin(0, 0.5))
    const detail = row.met ? t('servedCount', { n: row.served }) : t('kindFrom', { day: row.fromDay })
    this.keep(this.add.text(330, cy + 25, detail, { ...textStyle(34, '600'), wordWrap: { width: 650 } }).setOrigin(0, 0.5))
  }

  /** One VIP in the grid: her figure in her colours, name and role, stars, visits and photo; in shadow until met, and a met one opens her page when tapped. */
  private vipCell(row: VipRow, i: number): void {
    const x0 = COL_X[i % 2]
    const y0 = GRID_TOP + Math.floor(i / 2) * VIP_CELL_H
    const colors = customerColors(VIPS[row.id].look, VIP_KIND, null, row.id)
    const mid = x0 + CELL_W / 2
    this.keep(addCard(this, x0, y0, CELL_W, VIP_CELL_H - 20))
    this.figure(mid, y0 + 230, FIGURE_SCALE, colors, row.met ? 1 : UNMET_ALPHA)
    if (!row.met) {
      this.keep(this.add.text(mid, y0 + 330, '???', textStyle(40)).setOrigin(0.5))
      return
    }
    const text = VIP_TEXT[row.id]
    this.keep(this.add.text(mid, y0 + 285, text.name, { ...textStyle(40), wordWrap: { width: CELL_W - 40 } }).setOrigin(0.5))
    this.keep(this.add.text(mid, y0 + 328, text.role, { ...textStyle(28, '600'), wordWrap: { width: CELL_W - 40 } }).setOrigin(0.5))
    for (let s = 0; s < 3; s++) {
      this.keep(this.add.image(mid + (s - 1) * 56, y0 + 378, s < row.best ? 'star' : 'star-empty').setScale(STAR_SCALE))
    }
    this.keep(this.add.text(mid, y0 + 422, t('vipVisits', { n: row.visits }), textStyle(30, '600')).setOrigin(0.5))
    this.keep(this.add.text(mid, y0 + 458, t(row.photo ? 'vipPhotoYes' : 'vipPhotoNo'), textStyle(28, '800', row.photo ? C.teal : undefined)).setOrigin(0.5))
    this.keep(
      this.add
        .rectangle(x0, y0, CELL_W, VIP_CELL_H - 20, 0xffffff, 0)
        .setOrigin(0)
        .setInteractive()
        .on('pointerup', () => this.openDetail({ kind: 'vip', id: row.id })),
    )
  }

  /** One star in the grid, three to a row: their figure, name, stars, visits and photo; in shadow until met, and a met one opens their page when tapped. */
  private idolCell(row: IdolRow, i: number): void {
    const x0 = IDOL_COL_X[i % 3]
    const y0 = GRID_TOP + Math.floor(i / 3) * IDOL_CELL_H
    const colors = customerColors(IDOLS[row.id].look, VIP_KIND, null, null, false, row.id)
    const mid = x0 + IDOL_CELL_W / 2
    this.keep(addCard(this, x0, y0, IDOL_CELL_W, IDOL_CELL_H - 20))
    this.figure(mid, y0 + 184, IDOL_SCALE, colors, row.met ? 1 : UNMET_ALPHA)
    if (!row.met) {
      this.keep(this.add.text(mid, y0 + 224, '???', textStyle(34)).setOrigin(0.5))
      return
    }
    this.keep(this.add.text(mid, y0 + 224, IDOL_TEXT[row.id].name, { ...textStyle(32), align: 'center', wordWrap: { width: IDOL_CELL_W - 30 } }).setOrigin(0.5))
    for (let s = 0; s < 3; s++) {
      this.keep(this.add.image(mid + (s - 1) * 56, y0 + 274, s < row.best ? 'star' : 'star-empty').setScale(STAR_SCALE))
    }
    this.keep(this.add.text(mid, y0 + 314, t('vipVisits', { n: row.visits }), textStyle(28, '600')).setOrigin(0.5))
    this.keep(this.add.text(mid, y0 + 346, t(row.photo ? 'vipPhotoYes' : 'vipPhotoNo'), textStyle(26, '800', row.photo ? C.teal : undefined)).setOrigin(0.5))
    this.keep(
      this.add
        .rectangle(x0, y0, IDOL_CELL_W, IDOL_CELL_H - 20, 0xffffff, 0)
        .setOrigin(0)
        .setInteractive()
        .on('pointerup', () => this.openDetail({ kind: 'idol', id: row.id })),
    )
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
