import * as Phaser from 'phaser'
import { chibiTextures } from '../art/chibi'
import { fxTextures } from '../art/fx'
import { furnitureTextures } from '../art/furniture'
import { ingredientTextures } from '../art/ingredients'
import { maskTextures } from '../art/maskArt'
import { massageTextures } from '../art/massageArt'
import { mudTextures } from '../art/mudArt'
import { roomTexture } from '../art/room'
import { shampooTextures } from '../art/shampooArt'
import { steamTextures } from '../art/steamArt'
import { stoneTextures } from '../art/stoneArt'
import { loadSvgTextures } from '../art/svg'
import { GAME_H, GAME_W } from '../config'
import { buildGrid } from '../sim/grid'
import { shellOf } from '../sim/items'
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
    await loadSvgTextures(this, {
      room: roomTexture(buildGrid(shellOf(SPA_LAYOUT_1A), [])),
      ...furnitureTextures(),
      ...chibiTextures(),
      ...fxTextures(),
      ...shampooTextures(),
      ...maskTextures(),
      ...massageTextures(),
      ...ingredientTextures(),
      ...steamTextures(),
      ...stoneTextures(),
      ...mudTextures(),
    })
    this.scene.start('SpaScene')
  }
}
