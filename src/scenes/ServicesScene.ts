import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W, LOW_STOCK, RESTOCK_AMOUNT, RESTOCK_PRICE } from '../config'
import { ITEMS } from '../sim/items'
import { isRecipeService, SERVICE_IDS, SERVICES, type RecipeService, type ServiceId } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import { STOCK_ITEMS, STOCK_NAME, STOCK_USES, stockUsers, type StockItem } from '../sim/stock'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { textStyle } from '../view/text'
import { addButton, addCard, addToast } from '../view/ui'
import type { RecipeData } from './RecipeScene'

export interface ServicesData {
  sim: SpaSim
  /** The first time the panel opens: it says where the beds are bought. */
  intro: boolean
  /** The tab to open on; only from day 5, when the stock tab exists. */
  tab: Tab
  /** The first time the stock tab opens: it says what a service uses. */
  stockIntro: boolean
  /** The first time the services tab opens once the recipe bench is there: it says new services are mixed. */
  recipesIntro: boolean
  /** After a service opens: save. */
  onChange: () => void
  onClose: () => void
}

export type Tab = 'services' | 'stock'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TITLE_Y = 290
const INTRO_Y = 385
/** Breaks the intro after its first sentence. */
const INTRO_WRAP = 680
const ROW_TOP = 520
// six rows of each tab sit between the tabs and the Done button
const ROW_H = 200
// from day 5 two tabs sit under the title and the rows start below them
const TAB_Y = 500
const TAB_W = 440
const TAB_H = 120
const TAB_X = { services: 300, stock: 780 } as const
const TABBED_ROW_TOP = 590
const STOCK_ROW_H = 200
// the restock button is wider than the open button, so the stock text column is narrower
const STOCK_TEXT_WRAP = 330
const RESTOCK_X = 790
const RESTOCK_W = 380
const ROW_LEFT = 90
const ROW_RIGHT = 990
const ICON_X = 160
const TEXT_X = 260
const TEXT_WRAP = 400
const ACTION_X = 825
const ACTION_W = 310
const ACTION_H = 110
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
  private tab: Tab = 'services'

  constructor() {
    super('ServicesScene')
  }

  init(data: ServicesData) {
    this.params = data
    this.tab = data.sim.stockTracked() ? data.tab : 'services'
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
    const tabbed = this.params.sim.stockTracked()
    const intro =
      this.tab === 'stock' ? this.params.stockIntro && t('stockIntro') : (this.params.intro && t('servicesIntro')) || (this.params.recipesIntro && t('recipesIntro'))
    if (intro) {
      this.keep(this.add.text(MID, INTRO_Y, intro, { ...textStyle(32, '600'), align: 'center', wordWrap: { width: INTRO_WRAP } }).setOrigin(0.5))
    }
    if (tabbed) {
      const tabs: { tab: Tab; label: string }[] = [
        { tab: 'services', label: t('tabServices') },
        { tab: 'stock', label: t('tabStock') },
      ]
      for (const { tab, label } of tabs) {
        this.keep(addButton(this, TAB_X[tab], TAB_Y, TAB_W, TAB_H, label, tab === this.tab ? 'primary' : 'plain', () => this.openTab(tab), 44))
      }
    }
    const top = tabbed ? TABBED_ROW_TOP : ROW_TOP
    const lines = this.keep(this.add.graphics()).lineStyle(3, hex(C.tileSeam), 1)
    if (this.tab === 'stock') {
      const items = STOCK_ITEMS.filter(item => this.params.sim.services.some(id => STOCK_USES[id].includes(item)))
      items.forEach((item, i) => {
        const y0 = top + i * STOCK_ROW_H
        if (i > 0) lines.lineBetween(ROW_LEFT, y0, ROW_RIGHT, y0)
        this.stockRow(item, y0)
      })
    } else {
      SERVICE_IDS.forEach((id, i) => {
        const y0 = top + i * ROW_H
        if (i > 0) lines.lineBetween(ROW_LEFT, y0, ROW_RIGHT, y0)
        this.row(id, y0)
      })
    }
    this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
  }

  private openTab(tab: Tab): void {
    this.tab = tab
    this.show()
  }

  /** One stock item: its icon, what is left, who uses it, and the restock button. */
  private stockRow(item: StockItem, y0: number): void {
    const { sim } = this.params
    const cy = y0 + STOCK_ROW_H / 2
    const users = stockUsers(item, SERVICE_IDS.filter(id => sim.services.includes(id)))
    const usedBy = users.length ? t('stockUsedBy', { name: users.map(id => t(SERVICES[id].name)).join(', ') }) : t('stockUsedByAll')
    const left = sim.stock[item]
    this.keep(this.add.image(ICON_X, cy, `stock-${item}`).setScale(1.5))
    this.keep(this.add.text(TEXT_X, cy - 58, t(STOCK_NAME[item]), textStyle(40)).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, cy - 14, t('stockLeft', { n: left }), textStyle(30, '800', left <= LOW_STOCK ? C.lantern : C.ink)).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, cy + 16, usedBy, { ...textStyle(26, '600'), wordWrap: { width: STOCK_TEXT_WRAP } }).setOrigin(0, 0))
    const label = t('restock', { n: RESTOCK_AMOUNT, money: formatMoney(RESTOCK_PRICE[item]) })
    this.keep(addButton(this, RESTOCK_X, cy, RESTOCK_W, ACTION_H, label, 'primary', () => this.restock(item), 28))
  }

  private restock(item: StockItem): void {
    this.params.sim.restock(item)
    this.params.onChange()
    this.show()
  }

  private row(id: ServiceId, y0: number): void {
    const { sim } = this.params
    const spec = SERVICES[id]
    const bed = t(ITEMS[spec.bed].name)
    const cy = y0 + ROW_H / 2
    const first = this.shown.length
    this.keep(this.add.image(ICON_X, cy, `svc-${id}`).setScale(1.5))
    this.keep(this.add.text(TEXT_X, cy - 58, t(spec.name), textStyle(40)).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, cy - 14, t('servicePrice', { money: formatMoney(spec.price) }), textStyle(28, '600')).setOrigin(0, 0.5))
    this.keep(
      this.add
        .text(TEXT_X, cy + 16, t('serviceNeeds', { bed, money: formatMoney(ITEMS[spec.bed].price) }), { ...textStyle(26, '600'), wordWrap: { width: TEXT_WRAP } })
        .setOrigin(0, 0),
    )

    if (sim.services.includes(id)) {
      if (sim.availableServices().includes(id)) this.pill(ACTION_X, cy, t('serviceOpened'))
      else {
        this.keep(this.add.text(ACTION_X, cy, t('serviceNoBed', { bed }), { ...textStyle(30, '800', C.lantern), align: 'center', wordWrap: { width: ACTION_W } }).setOrigin(0.5))
      }
      return
    }
    const problem = sim.serviceProblem(id)
    // a recipe row follows the bench, not the debt: the bench opens in debt too
    if (isRecipeService(id) && !sim.benchOpen()) {
      for (const obj of this.shown.slice(first)) (obj as Phaser.GameObjects.Image).setAlpha(FADED_ALPHA)
      this.keep(this.add.text(ACTION_X, cy, t('serviceOrder', { name: t(SERVICES.massage.name) }), { ...textStyle(30, '800', C.lantern), align: 'center', wordWrap: { width: ACTION_W } }).setOrigin(0.5))
      return
    }
    if (isRecipeService(id) && !sim.recipes[id].solved) {
      this.keep(addButton(this, ACTION_X, cy, ACTION_W, ACTION_H, t('serviceRecipe'), 'primary', () => this.openBench(id), 32))
      return
    }
    const button = this.keep(addButton(this, ACTION_X, cy, ACTION_W, ACTION_H, t('serviceOpen', { money: formatMoney(spec.openCost) }), 'primary', () => this.open(id), 32))
    if (problem !== null) button.setAlpha(FADED_ALPHA)
  }

  /** A mustard pill centred at x, y. */
  private pill(x: number, y: number, text: string): void {
    const label = this.add.text(0, 0, text, textStyle(30, '800')).setOrigin(0.5)
    const w = label.width + 56
    const pill = this.add
      .graphics()
      .fillStyle(hex(C.mustard), 1)
      .fillRoundedRect(-w / 2, -30, w, 60, 30)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -30, w, 60, 30)
    this.keep(this.add.container(x, y, [pill, label]))
  }

  /** The recipe bench over this panel, which steps aside so the shop is dimmed once, then redraws with the solved row's open button. */
  private openBench(id: RecipeService): void {
    const data: RecipeData = {
      sim: this.params.sim,
      service: id,
      onChange: this.params.onChange,
      onClose: () => {
        this.scene.setVisible(true)
        this.show()
      },
    }
    this.scene.setVisible(false)
    this.scene.launch('RecipeScene', data)
  }

  private open(id: ServiceId): void {
    const { sim } = this.params
    const problem = sim.serviceProblem(id)
    if (problem === 'debt') this.toast(t('serviceDebt'))
    else if (problem === 'money') this.toast(t('problemMoney', { money: formatMoney(SERVICES[id].openCost - sim.money) }))
    else if (problem === 'order') this.toast(t('serviceOrder', { name: t(SERVICES[isRecipeService(id) ? 'massage' : SERVICE_IDS[SERVICE_IDS.indexOf(id) - 1]].name) }))
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
