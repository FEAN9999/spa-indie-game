import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { SpaSim } from '../sim/spa'
import { t } from '../strings/vi'
import { addButton, addCard } from '../view/ui'

export interface GuestBookData {
  sim: SpaSim
  /** The first time the book opens. */
  intro: boolean
  onClose: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** The guest book over the frozen shop. A bare card for now: it only closes. */
export class GuestBookScene extends Phaser.Scene {
  private params!: GuestBookData

  constructor() {
    super('GuestBookScene')
  }

  init(data: GuestBookData) {
    this.params = data
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this, 40, 230, 1000, 1760)
    addButton(this, GAME_W / 2, 1895, 720, 120, t('done'), 'primary', () => {
      this.params.onClose()
      this.scene.stop()
    })
  }
}
