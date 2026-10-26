import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import { ITEMS } from '../sim/items'
import { SERVICE_IDS, SERVICES, type ServiceId } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { textStyle } from '../view/text'
import { addButton, addCard, addToast } from '../view/ui'

export interface ServicesData {
  sim: SpaSim
  /** The first time the panel opens: it says where the beds are bought. */
  intro: boolean
  /** After a service opens: save. */
  onChange: () => void
  onClose: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TITLE_Y = 290
const INTRO_Y = 385
/** Breaks the intro after its first sentence. */
const INTRO_WRAP = 680
const ROW_TOP = 520
const ROW_H = 330
const ROW_LEFT = 90
const ROW_RIGHT = 990
const ICON_X = 160
const TEXT_X = 260
const TEXT_WRAP = 380
const ACTION_X = 825
const ACTION_W = 310
const ACTION_H = 120
const DONE_Y = 1895
const TOAST_Y = 2060
const FADED_ALPHA = 0.45
const TOAST_DEPTH = 20
const TOAST_MAX_W = 1000

/**
 * The services panel over the frozen shop: each service with what a customer pays, the bed it needs, and its open button.
 * Every tap stays in this scene, so the shop, its top bar and its buttons wait underneath.
 */
export class ServicesScene extends Phaser.Scene {
  private params!: ServicesData
  /** Everything drawn for the panel on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor() {
    super('ServicesScene')
  }

  init(data: ServicesData) {
    this.params = data
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

  /** Draws the whole panel again. */
  private show(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
    this.keep(addCard(this, 40, 230, 1000, 1760))
    this.keep(this.add.text(MID, TITLE_Y, t('servicesTitle'), textStyle(60)).setOrigin(0.5))
    if (this.params.intro) {
      this.keep(this.add.text(MID, INTRO_Y, t('servicesIntro'), { ...textStyle(32, '600'), align: 'center', wordWrap: { width: INTRO_WRAP } }).setOrigin(0.5))
    }
    const lines = this.keep(this.add.graphics()).lineStyle(3, hex(C.tileSeam), 1)
    SERVICE_IDS.forEach((id, i) => {
      const y0 = ROW_TOP + i * ROW_H
      if (i > 0) lines.lineBetween(ROW_LEFT, y0, ROW_RIGHT, y0)
      this.row(id, y0)
    })
    this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
  }

  private row(id: ServiceId, y0: number): void {
    const { sim } = this.params
    const spec = SERVICES[id]
    const bed = t(ITEMS[spec.bed].name)
    const cy = y0 + ROW_H / 2
    this.keep(this.add.image(ICON_X, cy, `svc-${id}`).setScale(1.5))
    this.keep(this.add.text(TEXT_X, cy - 85, t(spec.name), textStyle(46)).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, cy - 30, t('servicePrice', { money: formatMoney(spec.price) }), textStyle(32, '600')).setOrigin(0, 0.5))
    this.keep(
      this.add
        .text(TEXT_X, cy + 10, t('serviceNeeds', { bed, money: formatMoney(ITEMS[spec.bed].price) }), { ...textStyle(32, '600'), wordWrap: { width: TEXT_WRAP } })
        .setOrigin(0, 0),
    )

    if (sim.services.includes(id)) {
      if (sim.availableServices().includes(id)) this.pill(ACTION_X, cy, t('serviceOpened'))
      else {
        this.keep(this.add.text(ACTION_X, cy, t('serviceNoBed', { bed }), { ...textStyle(32, '800', C.lantern), align: 'center', wordWrap: { width: ACTION_W } }).setOrigin(0.5))
      }
      return
    }
    const button = this.keep(addButton(this, ACTION_X, cy, ACTION_W, ACTION_H, t('serviceOpen', { money: formatMoney(spec.openCost) }), 'primary', () => this.open(id), 34))
    if (sim.serviceProblem(id) !== null) button.setAlpha(FADED_ALPHA)
  }

  /** A mustard pill centred at x, y. */
  private pill(x: number, y: number, text: string): void {
    const label = this.add.text(0, 0, text, textStyle(34, '800')).setOrigin(0.5)
    const w = label.width + 56
    const pill = this.add
      .graphics()
      .fillStyle(hex(C.mustard), 1)
      .fillRoundedRect(-w / 2, -30, w, 60, 30)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -30, w, 60, 30)
    this.keep(this.add.container(x, y, [pill, label]))
  }

  private open(id: ServiceId): void {
    const { sim } = this.params
    const problem = sim.serviceProblem(id)
    if (problem === 'debt') this.toast(t('serviceDebt'))
    else if (problem === 'money') this.toast(t('problemMoney', { money: formatMoney(SERVICES[id].openCost - sim.money) }))
    else if (problem === 'order') this.toast(t('serviceOrder', { name: t(SERVICES[SERVICE_IDS[SERVICE_IDS.indexOf(id) - 1]].name) }))
    if (problem) return
    sim.openService(id)
    this.params.onChange()
    this.show()
    this.toast(t('serviceJustOpened', { name: t(SERVICES[id].name), bed: t(ITEMS[SERVICES[id].bed].name) }))
  }

  /** Replaces the toast on screen, if any. */
  private toast(text: string): void {
    this.toastBox?.destroy()
    const box = addToast(this, MID, TOAST_Y, text).setDepth(TOAST_DEPTH)
    // the opening line is longer than the screen at full size
    const width = box.getBounds().width
    if (width > TOAST_MAX_W) box.setScale(TOAST_MAX_W / width)
    this.toastBox = box
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
