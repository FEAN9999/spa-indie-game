import * as Phaser from 'phaser'
import { chibiTextures } from '../art/chibi'
import { fxTextures } from '../art/fx'
import { furnitureTextures, roomTexture } from '../art/room'
import { shampooTextures } from '../art/shampooArt'
import { loadSvgTextures } from '../art/svg'
import { GAME_H, GAME_W } from '../config'
import { parseLayout } from '../sim/grid'
import { SPA_LAYOUT_1A } from '../sim/layout'
import { t } from '../strings/vi'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  async create() {
    this.add
      .text(GAME_W / 2, GAME_H / 2, t('loading'), { fontFamily: '"Baloo 2"', fontStyle: '500', fontSize: '56px', color: '#5a4a42' })
      .setOrigin(0.5)
    await loadSvgTextures(this, {
      room: roomTexture(parseLayout(SPA_LAYOUT_1A)),
      ...furnitureTextures(),
      ...chibiTextures(),
      ...fxTextures(),
      ...shampooTextures(),
    })
    this.scene.start('SpaScene')
  }
}
