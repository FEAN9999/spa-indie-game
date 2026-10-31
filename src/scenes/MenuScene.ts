import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { DISH_PRICE, GAME_H, GAME_W, LOW_STOCK, RESTAURANT_RESTOCK_PRICE, RESTOCK_AMOUNT } from '../config'
import { DISH_IDS, DISH_NAME, DISH_STOCK, RSTOCK_NAME, type DishId, type RestaurantStockItem } from '../sim/menu'
import type { RestaurantSim } from '../sim/restaurant'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export interface MenuData {
  restaurant: RestaurantSim
  /** After a restock: save. */
  onChange: () => void
  onClose: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TITLE_Y = 290
const INTRO_Y = 385
const INTRO_WRAP = 680
const ROW_TOP = 520
const ROW_H = 200
const ROW_LEFT = 90
const ROW_RIGHT = 990
const ICON_X = 160
const TEXT_X = 260
const RESTOCK_X = 790
const RESTOCK_W = 380
const ACTION_H = 110
// the name stops this far short of the restock button
const NAME_W = RESTOCK_X - RESTOCK_W / 2 - 16 - TEXT_X
const HERBS_WRAP = 330
const DONE_Y = 1895

/**
 * The restaurant's menu over the frozen shop: each dish with its price and portions left, the shared herbs, and a restock button per stock item.
 * Every tap stays in this scene, so the shop, its top bar and its buttons wait underneath.
 */
export class MenuScene extends Phaser.Scene {
  private params!: MenuData
  /** Everything drawn for the panel on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super('MenuScene')
  }

  init(data: MenuData) {
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

  /** Draws the whole panel again. */
  private show(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
    this.keep(addCard(this, 40, 230, 1000, 1760))
    this.keep(this.add.text(MID, TITLE_Y, t('menuTitle'), textStyle(60)).setOrigin(0.5))
    this.keep(this.add.text(MID, INTRO_Y, t('menuIntro'), { ...textStyle(32, '600'), align: 'center', wordWrap: { width: INTRO_WRAP } }).setOrigin(0.5))
    const lines = this.keep(this.add.graphics()).lineStyle(3, hex(C.tileSeam), 1)
    DISH_IDS.forEach((dish, i) => {
      const y0 = ROW_TOP + i * ROW_H
      if (i > 0) lines.lineBetween(ROW_LEFT, y0, ROW_RIGHT, y0)
      this.dishRow(dish, y0)
    })
    const herbsY = ROW_TOP + DISH_IDS.length * ROW_H
    lines.lineBetween(ROW_LEFT, herbsY, ROW_RIGHT, herbsY)
    this.herbsRow(herbsY)
    this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
  }

  /** One dish: its icon, name and price, the portions left (or paused), and the restock button for its stock item. */
  private dishRow(dish: DishId, y0: number): void {
    const { restaurant } = this.params
    const cy = y0 + ROW_H / 2
    const left = restaurant.portionsLeft(dish)
    this.keep(this.add.image(ICON_X, cy, `dish-${dish}`).setScale(1.5))
    const name = this.keep(this.add.text(TEXT_X, cy - 30, t('menuDish', { name: t(DISH_NAME[dish]), money: formatMoney(DISH_PRICE[dish]) }), textStyle(40)).setOrigin(0, 0.5))
    name.setScale(Math.min(1, NAME_W / name.width))
    const text = left === 0 ? t('menuPaused') : t('menuLeft', { n: left })
    this.keep(this.add.text(TEXT_X, cy + 26, text, textStyle(30, '800', left <= LOW_STOCK ? C.lantern : C.ink)).setOrigin(0, 0.5))
    this.restockButton(DISH_STOCK[dish], cy)
  }

  /** The herbs every dish uses: what is left, who uses them, and the restock button. */
  private herbsRow(y0: number): void {
    const { restaurant } = this.params
    const cy = y0 + ROW_H / 2
    const left = restaurant.herbsLeft()
    this.keep(this.add.image(ICON_X, cy, 'rstock-herbs').setScale(2))
    this.keep(this.add.text(TEXT_X, cy - 58, t(RSTOCK_NAME.herbs), textStyle(40)).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, cy - 14, t('menuLeft', { n: left }), textStyle(30, '800', left <= LOW_STOCK ? C.lantern : C.ink)).setOrigin(0, 0.5))
    this.keep(this.add.text(TEXT_X, cy + 16, t('menuHerbsUse'), { ...textStyle(26, '600'), wordWrap: { width: HERBS_WRAP } }).setOrigin(0, 0))
    this.restockButton('herbs', cy)
  }

  private restockButton(item: RestaurantStockItem, cy: number): void {
    const label = t('restock', { n: RESTOCK_AMOUNT, money: formatMoney(RESTAURANT_RESTOCK_PRICE[item]) })
    this.keep(addButton(this, RESTOCK_X, cy, RESTOCK_W, ACTION_H, label, 'primary', () => this.restock(item), 28))
  }

  private restock(item: RestaurantStockItem): void {
    this.params.restaurant.restock(item)
    this.params.onChange()
    this.show()
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
