import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { PET_ORIGIN, petKey } from '../art/pets'
import { GAME_H, GAME_W } from '../config'
import type { Pet } from '../sim/pets'
import { t } from '../strings/vi'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

export interface PetGiveData {
  pet: Pet
  onGive: () => void
  onKeep: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2

/** Asks before a pet goes to a new home, with nothing paid back. */
export class PetGiveScene extends Phaser.Scene {
  private params!: PetGiveData

  constructor() {
    super('PetGiveScene')
  }

  init(data: PetGiveData) {
    this.params = data
  }

  create() {
    const { pet, onGive, onKeep } = this.params
    const close = (then: () => void) => () => {
      this.scene.stop()
      then()
    }
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.add.graphics().fillStyle(hex(C.goldPale), 1).fillRoundedRect(110, 400, 860, 860, 60).lineStyle(5, hex(C.ink)).strokeRoundedRect(110, 400, 860, 860, 60)
    this.add.text(MID, 500, t('petGiveHead', { name: pet.name }), textStyle(50)).setOrigin(0.5)
    this.add.image(MID, 830, petKey(pet.breed, 'sit')).setOrigin(PET_ORIGIN.x, PET_ORIGIN.y).setScale(2)
    this.add.text(MID, 880, t('petGiveLine', { name: pet.name }), { ...textStyle(34, '600', C.soft), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0)
    addButton(this, 330, 1140, 320, 120, t('petKeep'), 'primary', close(onKeep), 42)
    addButton(this, 750, 1140, 320, 120, t('petGive'), 'plain', close(onGive), 42)
  }
}
