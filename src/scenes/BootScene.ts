import * as Phaser from 'phaser'
import { badgeTextures } from '../art/badges'
import { beachRoomTexture } from '../art/beach'
import { chibiTextures } from '../art/chibi'
import { fxTextures } from '../art/fx'
import { floorTextures } from '../art/floors'
import { furnitureTextures } from '../art/furniture'
import { ingredientTextures } from '../art/ingredients'
import { mapTexture } from '../art/map'
import { maskTextures } from '../art/maskArt'
import { massageTextures } from '../art/massageArt'
import { scrubTextures } from '../art/scrubArt'
import { mudTextures } from '../art/mudArt'
import { oldTownRoomTexture } from '../art/oldTown'
import { roomTexture } from '../art/room'
import { shampooTextures } from '../art/shampooArt'
import { steamTextures } from '../art/steamArt'
import { stoneTextures } from '../art/stoneArt'
import { loadSvgTextures } from '../art/svg'
import { uptownRoomTexture } from '../art/uptown'
import { GAME_H, GAME_W } from '../config'
import { buildGrid } from '../sim/grid'
import { shellOf } from '../sim/items'
import { SPA_LAYOUT_1A } from '../sim/layout'
import { BRANCH_LAYOUT } from '../sim/places'
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
      'room-beach': beachRoomTexture(buildGrid(shellOf(BRANCH_LAYOUT), [])),
      'room-oldTown': oldTownRoomTexture(buildGrid(shellOf(BRANCH_LAYOUT), [])),
      'room-uptown': uptownRoomTexture(buildGrid(shellOf(BRANCH_LAYOUT), [])),
      'chain-map': mapTexture(),
      ...floorTextures(),
      ...furnitureTextures(),
      ...chibiTextures(),
      ...fxTextures(),
      ...badgeTextures(),
      ...shampooTextures(),
      ...maskTextures(),
      ...massageTextures(),
      ...scrubTextures(),
      ...ingredientTextures(),
      ...steamTextures(),
      ...stoneTextures(),
      ...mudTextures(),
    })
    this.scene.start('SpaScene')
  }
}
