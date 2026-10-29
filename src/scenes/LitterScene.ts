import * as Phaser from 'phaser'
import { C, customerColors } from '../art/palette'
import { PET_ORIGIN, petKey } from '../art/pets'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import { FREE_BREEDS, type BreedId } from '../sim/pets'
import { REGULARS } from '../sim/regulars'
import { BREED_NAME, t } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

export interface LitterData {
  onPick: (breed: BreedId) => void
  onLater: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TILE_TOP = 1090
const TILE_W = 370
const TILE_H = 330

/** Chú Sáu brings his litter: the shop's first pet, free, a kitten or a puppy. */
export class LitterScene extends Phaser.Scene {
  private params!: LitterData
  private figure: CharacterView | null = null

  constructor() {
    super('LitterScene')
  }

  init(data: LitterData) {
    this.params = data
    this.figure = null
  }

  create() {
    const { onPick, onLater } = this.params
    // stop first: the callback opens the name card
    const close = (then: () => void) => () => {
      this.scene.stop()
      then()
    }
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.add.graphics().fillStyle(hex(C.goldPale), 1).fillRoundedRect(110, 330, 860, 1420, 60).lineStyle(5, hex(C.ink)).strokeRoundedRect(110, 330, 860, 1420, 60)
    const sau = REGULARS.sau
    this.figure = new CharacterView(this, customerColors(sau.look, sau.kind, 'sau'))
    this.figure.container.setPosition(MID, 800).setScale(2.6)
    this.add.text(MID, 870, t('litterHead'), textStyle(48, '800')).setOrigin(0.5, 0)
    this.add.text(MID, 950, t('litterLine'), { ...textStyle(34, '600', C.soft), align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5, 0)
    FREE_BREEDS.forEach((breed, i) => {
      const x = MID + (i ? 210 : -210)
      this.add.graphics().fillStyle(hex(C.cream), 1).fillRoundedRect(x - TILE_W / 2, TILE_TOP, TILE_W, TILE_H, 36).lineStyle(5, hex(C.ink)).strokeRoundedRect(x - TILE_W / 2, TILE_TOP, TILE_W, TILE_H, 36)
      this.add.image(x, TILE_TOP + 230, petKey(breed, 'sit')).setOrigin(PET_ORIGIN.x, PET_ORIGIN.y).setScale(1.7)
      this.add.text(x, TILE_TOP + 280, BREED_NAME[breed], textStyle(36, '800')).setOrigin(0.5)
      this.add
        .zone(x, TILE_TOP + TILE_H / 2, TILE_W, TILE_H)
        .setInteractive()
        .on('pointerup', () => {
          sound.play('tap')
          close(() => onPick(breed))()
        })
    })
    this.add.text(MID, TILE_TOP + TILE_H + 50, t('litterFree'), textStyle(30, '800', C.teal)).setOrigin(0.5)
    addButton(this, MID, 1620, 340, 120, t('litterLater'), 'plain', close(onLater), 44)
    sound.play('levelUp')
  }

  update(_time: number, delta: number) {
    this.figure?.update(delta)
  }
}
