import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W, RECIPE_TRY_COST } from '../config'
import { INGREDIENTS, RECIPES, sameMix, type Ingredient, type RecipeId, type RecipeState, type RecipeTry } from '../sim/recipes'
import { RECIPE_SERVICES, SERVICES } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { INGREDIENT_NAME, RECIPE_HINT_TEXT, t } from '../strings/vi'
import { textStyle } from '../view/text'
import { addButton, addCard, addToast } from '../view/ui'

export interface RecipeData {
  sim: SpaSim
  /** The recipe chosen when the bench opens. */
  service: RecipeId
  /** After a mix: save. */
  onChange: () => void
  onClose: () => void
}

/** What the result line says after the last tap; a solved recipe says so instead. */
type Line = { kind: 'full' } | { kind: 'repeat'; right: number } | { kind: 'miss'; right: number }

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TITLE_Y = 290
const MONEY_Y = 365
const COIN_GAP = 14
const CHIP = { y: 470, h: 110, pad: 80, minW: 260, gap: 24 }
// three slots in a clay bowl with a deep round bottom
const BOWL = { x: 180, y: 550, w: 720, h: 280, top: 40, bottom: 130 }
const SLOT = { y: 670, w: 200, h: 210, gap: 20, r: 28, iconPx: 120, iconDy: -25, nameDy: 72, nameSize: 30 }
const EMPTY_ALPHA = 0.45
const MIX = { y: 900, w: 600, h: 120 }
const RESULT_Y = 1010
const DOT = { r: 13, step: 36, gap: 24 }
// two rows of four ingredients
const SHELF = { top: 1060, w: 210, h: 156, gap: 12, r: 28, iconPx: 90, iconDy: -18, nameDy: 48, nameSize: 28 }
const SHELF_LEFT = MID - (4 * SHELF.w + 3 * SHELF.gap) / 2
const NAME_PAD = 16
const HINT = { top: 1410, x: 90, w: 900, padX: 28, padY: 12, gap: 10, size: 28, r: 24, tail: 6 }
// the last tries, newest first, two to a row
const TRIES_SHOWN = 4
const TRY = { x: 90, w: 440, h: 72, gapX: 20, gapY: 12, r: 20, iconPx: 56, iconX: 48, iconStep: 64, textPad: 24 }
const DONE_Y = 1895
const TOAST_Y = 2060
const FADED_ALPHA = 0.45
const TOAST_DEPTH = 20
const SPARKS = 14
const SPARK_TINTS = [C.mustard, C.lotus, C.teal]
const SPARK = { minR: 220, maxR: 380, scale: 3, ms: 900, depth: 10 }
const STAR_STEP_MS = 160

/**
 * The recipe bench over the frozen shop: put three ingredients in the bowl and mix, to learn how many are right.
 * Every tap stays in this scene, so the services panel and the shop wait underneath.
 */
export class RecipeScene extends Phaser.Scene {
  private params!: RecipeData
  private recipe!: RecipeId
  private bowl: Ingredient[] = []
  private line: Line | null = null
  /** Everything drawn for the bench on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor() {
    super('RecipeScene')
  }

  init(data: RecipeData) {
    this.params = data
    this.recipe = data.service
    this.bowl = []
    this.line = null
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

  /** Draws the whole bench again. */
  private show(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
    const recipe = this.params.sim.recipes[this.recipe]
    this.keep(addCard(this, 40, 230, 1000, 1760))
    this.keep(this.add.text(MID, TITLE_Y, t('benchTitle'), textStyle(60)).setOrigin(0.5))
    this.money()
    this.chips()
    this.bowlView(recipe.solved)
    this.mixButton(recipe)
    this.resultLine(recipe.solved)
    this.shelf(recipe.solved)
    this.tries(recipe.tries, this.hints(recipe.heard))
    this.keep(addButton(this, MID, DONE_Y, 560, 130, t('done'), 'primary', () => this.close()))
  }

  /** The coin and the money, red while in debt, like the top bar. */
  private money(): void {
    const { money } = this.params.sim
    const coin = this.add.image(0, 0, 'coin').setOrigin(0, 0.5)
    const text = this.add.text(0, 0, formatMoney(money), textStyle(40, '800', money < 0 ? C.lantern : C.ink)).setOrigin(0, 0.5)
    const w = coin.width + COIN_GAP + text.width
    coin.setX(-w / 2)
    text.setX(-w / 2 + coin.width + COIN_GAP)
    this.keep(this.add.container(MID, MONEY_Y, [coin, text]))
  }

  /** One chip per service with a recipe, the chosen one mustard, a solved one ticked. */
  private chips(): void {
    const { sim } = this.params
    const chips = RECIPE_SERVICES.map(id => {
      const name = t(SERVICES[id].name)
      const label = this.add.text(0, 0, sim.recipes[id].solved ? t('benchChipSolved', { name }) : name, textStyle(40)).setOrigin(0.5)
      return { id, label, w: Math.max(CHIP.minW, label.width + CHIP.pad) }
    })
    let x = MID - (chips.reduce((sum, c) => sum + c.w, 0) + (chips.length - 1) * CHIP.gap) / 2
    for (const { id, label, w } of chips) {
      const bg = this.add
        .graphics()
        .fillStyle(hex(id === this.recipe ? C.mustard : C.cream), 1)
        .fillRoundedRect(-w / 2, -CHIP.h / 2, w, CHIP.h, CHIP.h / 2)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(-w / 2, -CHIP.h / 2, w, CHIP.h, CHIP.h / 2)
      this.keep(this.tappable(this.add.container(x + w / 2, CHIP.y, [bg, label]), w, CHIP.h, () => this.pick(id)))
      x += w + CHIP.gap
    }
  }

  /** The bowl's three slots; a solved recipe shows its ingredients, else a tap on a filled slot takes it out. */
  private bowlView(solved: boolean): void {
    const radius = { tl: BOWL.top, tr: BOWL.top, bl: BOWL.bottom, br: BOWL.bottom }
    this.keep(
      this.add
        .graphics()
        .fillStyle(hex(C.clayLight), 1)
        .fillRoundedRect(BOWL.x, BOWL.y, BOWL.w, BOWL.h, radius)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(BOWL.x, BOWL.y, BOWL.w, BOWL.h, radius),
    )
    const items = solved ? RECIPES[this.recipe].ingredients : this.bowl
    for (let i = 0; i < 3; i++) {
      const item = items[i]
      const alpha = item ? 1 : EMPTY_ALPHA
      const bg = this.add
        .graphics()
        .fillStyle(hex(C.paper), alpha)
        .fillRoundedRect(-SLOT.w / 2, -SLOT.h / 2, SLOT.w, SLOT.h, SLOT.r)
        .lineStyle(4, hex(C.ink), alpha)
        .strokeRoundedRect(-SLOT.w / 2, -SLOT.h / 2, SLOT.w, SLOT.h, SLOT.r)
      const parts: Phaser.GameObjects.GameObject[] = [bg]
      if (item) parts.push(this.icon(item, SLOT.iconDy, SLOT.iconPx), this.itemName(item, SLOT.nameDy, SLOT.nameSize, SLOT.w))
      const slot = this.keep(this.add.container(MID + (i - 1) * (SLOT.w + SLOT.gap), SLOT.y, parts))
      if (item && !solved) this.tappable(slot, SLOT.w, SLOT.h, () => this.takeOut(i))
    }
  }

  /** Faded until the bowl is full, and while a new bowl cannot be paid for; a bowl tried before answers for free. */
  private mixButton(recipe: RecipeState): void {
    const button = this.keep(addButton(this, MID, MIX.y, MIX.w, MIX.h, t('benchMix', { money: formatMoney(RECIPE_TRY_COST) }), 'primary', () => this.mix(), 48))
    const ready = !recipe.solved && this.bowl.length === 3
    const free = recipe.tries.some(tr => sameMix(tr.mix, this.bowl))
    if (!ready || (this.params.sim.money < RECIPE_TRY_COST && !free)) button.setAlpha(FADED_ALPHA)
  }

  private resultLine(solved: boolean): void {
    if (solved) {
      const text = t('benchSolved', { name: t(SERVICES[this.recipe].name) })
      this.keep(this.add.text(MID, RESULT_Y, text, textStyle(40, '800', C.teal)).setOrigin(0.5))
      return
    }
    const line = this.line
    if (!line) return
    if (line.kind !== 'miss') {
      const text = line.kind === 'full' ? t('benchFull') : t('benchRepeat', { n: line.right })
      this.keep(this.add.text(MID, RESULT_Y, text, textStyle(40)).setOrigin(0.5))
      return
    }
    // "Đúng n món" and a filled dot for each right ingredient, centred together
    const text = this.add.text(0, 0, t('benchRight', { n: line.right }), textStyle(40)).setOrigin(0, 0.5)
    const w = text.width + DOT.gap + 2 * DOT.r + 2 * DOT.step
    text.setX(-w / 2)
    const dots = this.add.graphics().lineStyle(3, hex(C.ink))
    for (let d = 0; d < 3; d++) {
      const x = -w / 2 + text.width + DOT.gap + DOT.r + d * DOT.step
      dots.fillStyle(hex(d < line.right ? C.leaf : C.tileSeam), 1).fillCircle(x, 0, DOT.r).strokeCircle(x, 0, DOT.r)
    }
    this.keep(this.add.container(MID, RESULT_Y, [text, dots]))
  }

  /** The 8 ingredients; one already in the bowl, or any once the recipe is solved, is faded and does nothing. */
  private shelf(solved: boolean): void {
    INGREDIENTS.forEach((item, i) => {
      const bg = this.add
        .graphics()
        .fillStyle(hex(C.cream), 1)
        .fillRoundedRect(-SHELF.w / 2, -SHELF.h / 2, SHELF.w, SHELF.h, SHELF.r)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(-SHELF.w / 2, -SHELF.h / 2, SHELF.w, SHELF.h, SHELF.r)
      const x = SHELF_LEFT + (i % 4) * (SHELF.w + SHELF.gap) + SHELF.w / 2
      const y = SHELF.top + Math.floor(i / 4) * (SHELF.h + SHELF.gap) + SHELF.h / 2
      const cell = this.keep(
        this.add.container(x, y, [bg, this.icon(item, SHELF.iconDy, SHELF.iconPx), this.itemName(item, SHELF.nameDy, SHELF.nameSize, SHELF.w)]),
      )
      if (solved || this.bowl.includes(item)) cell.setAlpha(FADED_ALPHA)
      else this.tappable(cell, SHELF.w, SHELF.h, () => this.putIn(item))
    })
  }

  /** The lines regulars told about this recipe, each in a speech bubble; returns the y under the last. */
  private hints(heard: Ingredient[]): number {
    let y = HINT.top
    for (const item of heard) {
      const words = RECIPE_HINT_TEXT[this.recipe][item]
      if (!words) continue
      const bg = this.keep(this.add.graphics())
      const text = this.keep(
        this.add.text(HINT.x + HINT.padX, y + HINT.padY, words, { ...textStyle(HINT.size, '600'), wordWrap: { width: HINT.w - 2 * HINT.padX } }),
      )
      const h = text.height + 2 * HINT.padY
      const radius = { tl: HINT.r, tr: HINT.r, br: HINT.r, bl: HINT.tail }
      bg.fillStyle(hex(C.cream), 1).fillRoundedRect(HINT.x, y, HINT.w, h, radius).lineStyle(4, hex(C.ink)).strokeRoundedRect(HINT.x, y, HINT.w, h, radius)
      y += h + HINT.gap
    }
    return y
  }

  /** The last few tries from `top`, newest first: the three ingredients and how many were right. */
  private tries(tries: RecipeTry[], top: number): void {
    tries
      .slice(-TRIES_SHOWN)
      .reverse()
      .forEach((tr, i) => {
        const x0 = TRY.x + (i % 2) * (TRY.w + TRY.gapX)
        const cy = top + Math.floor(i / 2) * (TRY.h + TRY.gapY) + TRY.h / 2
        this.keep(this.add.graphics().fillStyle(hex(C.sand), 1).fillRoundedRect(x0, cy - TRY.h / 2, TRY.w, TRY.h, TRY.r))
        tr.mix.forEach((item, k) => this.keep(this.icon(item, 0, TRY.iconPx).setPosition(x0 + TRY.iconX + k * TRY.iconStep, cy)))
        this.keep(this.add.text(x0 + TRY.w - TRY.textPad, cy, t('benchTry', { n: tr.right }), textStyle(32)).setOrigin(1, 0.5))
      })
  }

  private icon(item: Ingredient, dy: number, px: number): Phaser.GameObjects.Image {
    return this.add.image(0, dy, `ing-${item}`).setDisplaySize(px, px)
  }

  /** The ingredient's name, shrunk to fit a box `w` wide. */
  private itemName(item: Ingredient, dy: number, size: number, w: number): Phaser.GameObjects.Text {
    const text = this.add.text(0, dy, INGREDIENT_NAME[item], textStyle(size)).setOrigin(0.5)
    return text.setScale(Math.min(1, (w - 2 * NAME_PAD) / text.width))
  }

  /** Lets a drawn container take taps over its w×h box, with the buttons' tap sound. */
  private tappable(obj: Phaser.GameObjects.Container, w: number, h: number, onTap: () => void): Phaser.GameObjects.Container {
    return obj
      .setSize(w, h)
      .setInteractive()
      .on('pointerup', () => {
        sound.play('tap')
        onTap()
      })
  }

  private pick(id: RecipeId): void {
    if (id === this.recipe) return
    this.recipe = id
    this.bowl = []
    this.line = null
    this.show()
  }

  private putIn(item: Ingredient): void {
    if (this.bowl.length >= 3) this.line = { kind: 'full' }
    else {
      this.bowl.push(item)
      this.line = null
    }
    this.show()
  }

  private takeOut(slot: number): void {
    this.bowl.splice(slot, 1)
    this.line = null
    this.show()
  }

  /** A full bowl: a repeat answers again, a new mix is paid and empties the bowl, and all 3 right solves it. */
  private mix(): void {
    const { sim } = this.params
    if (sim.recipes[this.recipe].solved || this.bowl.length < 3) return
    const outcome = sim.mixRecipe(this.recipe, this.bowl)
    if (outcome.kind === 'problem') {
      this.toast(outcome.problem === 'debt' ? t('benchDebt') : t('problemMoney', { money: formatMoney(RECIPE_TRY_COST - sim.money) }))
      return
    }
    this.params.onChange()
    if (outcome.kind === 'repeat') this.line = { kind: 'repeat', right: outcome.right }
    else {
      this.bowl = []
      this.line = outcome.right === 3 ? null : { kind: 'miss', right: outcome.right }
    }
    this.show()
    if (outcome.kind === 'tried' && outcome.right === 3) this.celebrate()
  }

  /** The solve: a rising ting for each right ingredient, and sparks out of the bowl like a staff member's level-up. */
  private celebrate(): void {
    for (let i = 0; i < 3; i++) this.time.delayedCall(i * STAR_STEP_MS, () => sound.play('star', i))
    for (let i = 0; i < SPARKS; i++) {
      const a = (i / SPARKS) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.25, 0.25)
      const r = Phaser.Math.Between(SPARK.minR, SPARK.maxR)
      const spark = this.add
        .image(MID, SLOT.y, 'spark')
        .setTint(hex(SPARK_TINTS[i % SPARK_TINTS.length]))
        .setScale(SPARK.scale)
        .setDepth(SPARK.depth)
      this.tweens.add({ targets: spark, x: MID + r * Math.cos(a), y: SLOT.y + r * Math.sin(a), scale: 1.2, duration: SPARK.ms, ease: 'Cubic.easeOut' })
      this.tweens.add({ targets: spark, alpha: 0, duration: SPARK.ms, ease: 'Cubic.easeIn', onComplete: () => spark.destroy() })
    }
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
