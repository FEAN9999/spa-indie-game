import * as Phaser from 'phaser'
import { C, ownerColors } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import type { OutfitId } from '../sim/outfits'
import type { SpaSim } from '../sim/spa'
import { t } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { OUTFIT_NAME, newOutfitHead, newOutfitMore } from '../view/outfits'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

export interface NewOutfitData {
  sim: SpaSim
  /** The outfit shown: the highest of the ones just unlocked. */
  id: OutfitId
  /** How many other new outfits wait in the wardrobe. */
  more: number
  onLater: () => void
  onWear: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2

/** The Áo mới card: an outfit just unlocked, to wear now or leave for the wardrobe. */
export class NewOutfitScene extends Phaser.Scene {
  private params!: NewOutfitData
  private figure: CharacterView | null = null

  constructor() {
    super('NewOutfitScene')
  }

  init(data: NewOutfitData) {
    this.params = data
    this.figure = null
  }

  create() {
    const { sim, id, more, onLater, onWear } = this.params
    // stop first: the callback may open another card, and a stop queued after that would kill it
    const close = (then: () => void) => () => {
      this.scene.stop()
      then()
    }
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.add.graphics().fillStyle(hex(C.goldPale), 1).fillRoundedRect(110, 380, 860, 1300, 60).lineStyle(5, hex(C.ink)).strokeRoundedRect(110, 380, 860, 1300, 60)
    this.add.text(MID, 470, newOutfitHead(id), textStyle(34, '800', C.terracotta)).setOrigin(0.5)
    this.add.ellipse(MID, 1040, 380, 72, hex(C.gold), 0.35)
    this.figure = new CharacterView(this, ownerColors(sim.ownerLook, id))
    this.figure.container.setPosition(MID, 1050).setScale(3.1)
    this.add.text(MID, 1130, t(OUTFIT_NAME[id]), textStyle(50)).setOrigin(0.5)
    const note = this.add.text(MID, 1200, t('newOutfitNote'), { ...textStyle(32, '600', C.soft), align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5, 0)
    const rest = newOutfitMore(more)
    if (rest) this.add.text(MID, 1200 + note.height + 16, rest, textStyle(32, '600', C.soft)).setOrigin(0.5, 0)
    addButton(this, 340, 1540, 340, 120, t('newOutfitLater'), 'plain', close(onLater), 44)
    addButton(this, 740, 1540, 340, 120, t('newOutfitTry'), 'primary', close(onWear), 44)
    sound.play('levelUp')
  }

  update(_time: number, delta: number) {
    this.figure?.update(delta)
  }
}
