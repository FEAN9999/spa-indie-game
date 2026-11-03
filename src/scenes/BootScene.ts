import * as Phaser from 'phaser'
import { badgeTextures } from '../art/badges'
import { bustleTextures } from '../art/bustle'
import { chibiTextures } from '../art/chibi'
import { fxTextures } from '../art/fx'
import { floorTextures } from '../art/floors'
import { houseTextures } from '../art/houses'
import { furnitureTextures } from '../art/furniture'
import { ingredientTextures } from '../art/ingredients'
import { mapTexture } from '../art/map'
import { petTextures } from '../art/pets'
import { menuTextures } from '../art/menuArt'
import { restaurantTextures } from '../art/restaurant'
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
    // what the main shop shows; a branch's own pictures and each close-up's are made the first time they show, to save the phone's memory
    await loadSvgTextures(this, {
      room: roomTexture(parseLayout(SPA_LAYOUT_1A)),
      'chain-map': mapTexture(),
      ...floorTextures(),
      ...houseTextures(),
      ...furnitureTextures(),
      ...chibiTextures(),
      ...fxTextures(),
      ...badgeTextures(),
      ...ingredientTextures(),
      ...petTextures(),
      ...restaurantTextures(),
      ...bustleTextures(),
      ...menuTextures(),
    })
    // the layer over the map runs first, so the shop draws into it from its first frame
    this.scene.launch('HudScene')
    this.scene.start('SpaScene')
  }
}
