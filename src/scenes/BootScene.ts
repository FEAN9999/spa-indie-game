import * as Phaser from 'phaser'
import { badgeTextures } from '../art/badges'
import { bustleTextures } from '../art/bustle'
import { chibiTextures } from '../art/chibi'
import { fxTextures } from '../art/fx'
import { floorTextures } from '../art/floors'
import { saleRoofTextures } from '../art/houses'
import { furnitureTextures } from '../art/furniture'
import { ingredientTextures } from '../art/ingredients'
import { petTextures } from '../art/pets'
import { menuTextures } from '../art/menuArt'
import { streetRestaurantTextures } from '../art/restaurant'
import { roomTexture } from '../art/room'
import { loadSvgTextures } from '../art/svg'
import { GAME_H, GAME_W } from '../config'
import { parseLayout } from '../sim/grid'
import { SPA_LAYOUT_1A } from '../sim/layout'
import { t } from '../strings/vi'
import { textStyle } from '../view/text'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  async create() {
    this.add
      .text(GAME_W / 2, GAME_H / 2, t('loading'), textStyle(56, '600'))
      .setOrigin(0.5)
    // what a new main shop shows; what it grows into (see LaterArt), the chain's map and each close-up's pictures are made the first time they show, to save the phone's memory
    await loadSvgTextures(this, {
      room: roomTexture(parseLayout(SPA_LAYOUT_1A)),
      ...floorTextures(),
      ...saleRoofTextures(),
      ...furnitureTextures(),
      ...chibiTextures(),
      ...fxTextures(),
      ...badgeTextures(),
      ...ingredientTextures(),
      ...petTextures(),
      ...streetRestaurantTextures(),
      ...bustleTextures(),
      ...menuTextures(),
    })
    // the layer over the map runs first, so the shop draws into it from its first frame
    this.scene.launch('HudScene')
    this.scene.start('SpaScene')
  }
}
