import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { PET_ORIGIN, petKey } from '../art/pets'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W, PET_NAME_MAX } from '../config'
import { BREEDS, type BreedId } from '../sim/pets'
import { formatMoney } from '../strings/format'
import { BREED_NAME, PET_NAME_IDEAS, t } from '../strings/vi'
import { nameInput } from '../view/dom'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

export interface PetNameData {
  breed: BreedId
  /** The pet's name when renaming one the shop has; absent for a new pet. */
  current?: string
  /** What the new pet costs; null for Chú Sáu's free litter. Unused when renaming. */
  price: number | null
  /** The name as typed; the sim cleans it, and an empty one takes the breed's first idea. */
  onDone: (name: string) => void
  onCancel: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
// the box sits high on the card, clear of the iPhone keyboard
const NAME_Y = 820

/** Names a new pet, free or bought, or renames one the shop has. */
export class PetNameScene extends Phaser.Scene {
  private params!: PetNameData

  constructor() {
    super('PetNameScene')
  }

  init(data: PetNameData) {
    this.params = data
  }

  create() {
    const { breed, current, price, onDone, onCancel } = this.params
    const renaming = current !== undefined
    const ideas = PET_NAME_IDEAS[breed]
    const close = (then: () => void) => () => {
      this.scene.stop()
      then()
    }
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.add.graphics().fillStyle(hex(C.goldPale), 1).fillRoundedRect(110, 200, 860, 1120, 60).lineStyle(5, hex(C.ink)).strokeRoundedRect(110, 200, 860, 1120, 60)
    const head = renaming ? t('petRenameHead', { name: current }) : t(BREEDS[breed].kind === 'cat' ? 'petNameHeadCat' : 'petNameHeadDog')
    this.add.text(MID, 290, head, textStyle(46, '800')).setOrigin(0.5)
    this.add.text(MID, 360, BREED_NAME[breed], textStyle(32, '600', C.soft)).setOrigin(0.5)
    this.add.image(MID, 690, petKey(breed, 'sit')).setOrigin(PET_ORIGIN.x, PET_ORIGIN.y).setScale(2.2)
    const box = nameInput(this, MID, NAME_Y, { value: current ?? '', placeholder: ideas[0], maxLength: PET_NAME_MAX })
    // the canvas swallows taps, so the box would keep the keyboard open
    this.input.on('pointerdown', () => box.input.blur())
    this.add.text(MID, 940, t('petNameIdeas'), textStyle(28, '600', C.soft)).setOrigin(0.5)
    ideas.forEach((idea, i) =>
      addButton(this, MID + (i - 1) * 250, 1030, 230, 90, idea, 'plain', () => {
        box.input.value = idea
      }, 34),
    )
    addButton(this, 330, 1180, 300, 120, t('petNameCancel'), 'plain', close(onCancel), 42)
    addButton(this, 720, 1180, 380, 120, t(renaming ? 'petSaveName' : 'petAdopt'), 'primary', () => close(() => onDone(box.input.value))(), 42)
    if (!renaming) this.add.text(720, 1270, price === null ? t('petFree') : formatMoney(price), textStyle(28, '800', price === null ? C.teal : C.soft)).setOrigin(0.5)
  }
}
