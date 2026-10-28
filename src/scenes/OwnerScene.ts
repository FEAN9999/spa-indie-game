import * as Phaser from 'phaser'
import { PART_ANCHORS } from '../art/chibi'
import { C, HAIR, OWNER_SHIRT, SKIN, ownerColors } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W, OWNER_LOOK_COUNTS } from '../config'
import { SHOP_NAME_MAX, suggestShopName } from '../sim/profile'
import type { OutfitId } from '../sim/outfits'
import type { Facing, Look } from '../sim/types'
import { t, type StringKey } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { nameInput } from '../view/dom'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export type OwnerMode = 'new' | 'upgrade' | 'edit'

export interface OwnerData {
  mode: OwnerMode
  look: Look
  name: string
  /** The outfit the preview wears; a new shop is in the bà ba. */
  outfit: OutfitId
  onSave: (look: Look, name: string) => void
  onClose: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const CARD_X = 90
const CARD_W = 900
const CARD_TOP = 140
const CARD_BOTTOM = 2020
const MID = GAME_W / 2
const ROW_W = 744
const ROW_LEFT = MID - ROW_W / 2
const PREVIEW_Y = 700
const TURN_MS = 2000
const TURNS: Facing[] = ['down', 'right', 'up', 'left']
const NAME_Y = 865
const DICE_X = ROW_LEFT + ROW_W - 60
const TILE_PX = 120
const TILE_HEAD_SCALE = 1.15
const SWATCH_R = 42
const BUTTON_Y = 1885
const BUTTON_H = 150

/** The option rows by the y of their choices; each label sits 85 px above its swatches, 100 above the taller hair tiles. */
const ROWS: { key: keyof Look; label: StringKey; y: number; colors?: number[] }[] = [
  { key: 'hairStyle', label: 'hairStyle', y: 1080 },
  { key: 'hair', label: 'hairColor', y: 1290, colors: HAIR },
  { key: 'skin', label: 'skinColor', y: 1490, colors: SKIN },
  { key: 'shirt', label: 'shirtColor', y: 1690, colors: OWNER_SHIRT },
]

/** Choice i of n, spread evenly across the row. */
const choiceX = (i: number, n: number) => ROW_LEFT + ((i + 0.5) * ROW_W) / n

/** The owner and the shop name: made for a new shop, chosen once by an older shop, or changed later. Taps on the dimmed backdrop do nothing. */
export class OwnerScene extends Phaser.Scene {
  private params!: OwnerData
  private look!: Look
  private preview: CharacterView | null = null
  private turn = 0
  /** Tile frames and the rings round the chosen swatches. */
  private frames!: Phaser.GameObjects.Graphics
  private tileHeads: Phaser.GameObjects.Image[] = []
  private tileHair: Phaser.GameObjects.Image[] = []
  private nameBox!: HTMLInputElement

  constructor() {
    super('OwnerScene')
  }

  init(data: OwnerData) {
    this.params = data
    this.look = { ...data.look }
    this.preview = null
    this.turn = 0
    this.tileHeads = []
    this.tileHair = []
  }

  create() {
    const { mode, name } = this.params
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this, CARD_X, CARD_TOP, CARD_W, CARD_BOTTOM - CARD_TOP)
    const title = this.add.text(MID, CARD_TOP + 95, t(mode === 'new' ? 'createTitle' : 'profileTitle'), textStyle(64)).setOrigin(0.5)
    if (title.width > 780) title.setScale(780 / title.width)
    if (mode === 'upgrade') {
      // sized to break into two lines after "chủ tiệm"
      this.add.text(MID, CARD_TOP + 145, t('upgradeNote'), { ...textStyle(38, '600'), align: 'center', wordWrap: { width: 540 } }).setOrigin(0.5, 0)
    }

    this.time.addEvent({
      delay: TURN_MS,
      loop: true,
      callback: () => {
        this.turn = (this.turn + 1) % TURNS.length
        this.preview?.setFacing(TURNS[this.turn])
      },
    })

    // the name sits high on the card, clear of the iPhone keyboard
    this.label(NAME_Y - 100, 'shopNameLabel')
    const idea = suggestShopName(Math.random, name)
    this.nameBox = nameInput(this, ROW_LEFT + 300, NAME_Y, { value: mode === 'new' ? idea : name, placeholder: idea, maxLength: SHOP_NAME_MAX }).input
    this.add.circle(DICE_X, NAME_Y, 60, hex(C.cream)).setStrokeStyle(4, hex(C.ink))
    this.add.image(DICE_X, NAME_Y, 'icon-dice').setScale(1.25)
    this.add
      .zone(DICE_X, NAME_Y, 130, 130)
      .setInteractive()
      .on('pointerup', () => {
        sound.play('tap')
        this.nameBox.value = suggestShopName(Math.random, this.nameBox.value)
      })
    // the canvas swallows taps, so the box would keep the keyboard open
    this.input.on('pointerdown', () => this.nameBox.blur())

    this.frames = this.add.graphics()
    for (const row of ROWS) {
      this.label(row.y - (row.colors ? 85 : 100), row.label)
      const n = OWNER_LOOK_COUNTS[row.key]
      for (let i = 0; i < n; i++) {
        const x = choiceX(i, n)
        if (row.colors) this.add.circle(x, row.y, SWATCH_R, row.colors[i]).setStrokeStyle(4, hex(C.ink))
        else this.hairTile(i, x, row.y)
        this.add
          .zone(x, row.y, ROW_W / n, TILE_PX + 10)
          .setInteractive()
          .on('pointerup', () => {
            sound.play('tap')
            this.choose(row.key, i)
          })
      }
    }

    if (mode === 'new') addButton(this, MID, BUTTON_Y, ROW_W, BUTTON_H, t('openShop'), 'primary', () => this.save(this.look, this.typedName()))
    else {
      const other = mode === 'upgrade' ? t('keepAsIs') : t('cancel')
      const onOther = mode === 'upgrade' ? () => this.save(this.params.look, this.params.name) : () => this.close()
      addButton(this, MID - 190, BUTTON_Y, 350, BUTTON_H, other, 'plain', onOther)
      addButton(this, MID + 190, BUTTON_Y, 350, BUTTON_H, t('save'), 'primary', () => this.save(this.look, this.typedName()))
    }

    this.refresh()
  }

  update(_time: number, delta: number) {
    this.preview?.update(delta)
  }

  private label(y: number, key: StringKey): void {
    this.add.text(ROW_LEFT, y, t(key), textStyle(40, '600')).setOrigin(0, 0.5)
  }

  /** A head wearing hair style `style`, tinted by refresh. */
  private hairTile(style: number, x: number, y: number): void {
    const part = (key: string) => this.add.image(x, y, key).setOrigin(PART_ANCHORS[key].ox, PART_ANCHORS[key].oy).setScale(TILE_HEAD_SCALE)
    this.tileHeads.push(part('head'))
    part('head-line')
    this.tileHair.push(part(`hair${style}-down`))
    part(`hair${style}-down-line`)
  }

  private choose(key: keyof Look, value: number): void {
    this.look = { ...this.look, [key]: value }
    this.refresh()
  }

  /** Draws the chosen look: the preview, the tile colors and the rings. */
  private refresh(): void {
    const colors = ownerColors(this.look, this.params.mode === 'new' ? 'baba' : this.params.outfit)
    this.preview?.container.destroy()
    this.preview = new CharacterView(this, colors)
    this.preview.container.setPosition(MID, PREVIEW_Y).setScale(2)
    this.preview.setFacing(TURNS[this.turn])
    for (const img of this.tileHeads) img.setTint(colors.skin)
    for (const img of this.tileHair) img.setTint(colors.hair)

    const g = this.frames.clear()
    for (const row of ROWS) {
      const chosen = this.look[row.key]
      if (row.colors) {
        const x = choiceX(chosen, row.colors.length)
        g.lineStyle(6, hex(C.teal)).strokeCircle(x, row.y, SWATCH_R + 10)
        continue
      }
      for (let i = 0; i < OWNER_LOOK_COUNTS.hairStyle; i++) {
        const x = choiceX(i, OWNER_LOOK_COUNTS.hairStyle) - TILE_PX / 2
        const top = row.y - TILE_PX / 2
        g.fillStyle(hex(C.cream), 1).fillRoundedRect(x, top, TILE_PX, TILE_PX, 24)
        g.lineStyle(i === chosen ? 6 : 4, hex(i === chosen ? C.teal : C.ink)).strokeRoundedRect(x, top, TILE_PX, TILE_PX, 24)
      }
    }
  }

  /** The box as typed; an empty box takes the suggested name shown in it. */
  private typedName(): string {
    return this.nameBox.value.trim() === '' ? this.nameBox.placeholder : this.nameBox.value
  }

  private save(look: Look, name: string): void {
    this.params.onSave(look, name)
    this.close()
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
