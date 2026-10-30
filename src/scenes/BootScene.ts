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
import { footTextures } from '../art/footArt'
import { nailsTextures } from '../art/nailsArt'
import { scrubTextures } from '../art/scrubArt'
import { mudTextures } from '../art/mudArt'
import { oldTownRoomTexture } from '../art/oldTown'
import { petTextures } from '../art/pets'
import { roomTexture } from '../art/room'
import { shampooTextures } from '../art/shampooArt'
import { steamTextures } from '../art/steamArt'
import { stoneTextures } from '../art/stoneArt'
import { loadSvgTextures } from '../art/svg'
import { uptownRoomTexture } from '../art/uptown'
import { GAME_H, GAME_W } from '../config'
import { parseLayout } from '../sim/grid'
import { SPA_LAYOUT_1A } from '../sim/layout'
import { BRANCH_ROOM } from '../sim/places'
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
      room: roomTexture(parseLayout(SPA_LAYOUT_1A)),
      'room-beach': beachRoomTexture(parseLayout(BRANCH_ROOM)),
      'room-oldTown': oldTownRoomTexture(parseLayout(BRANCH_ROOM)),
      'room-uptown': uptownRoomTexture(parseLayout(BRANCH_ROOM)),
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
      ...footTextures(),
      ...nailsTextures(),
      ...ingredientTextures(),
      ...steamTextures(),
      ...stoneTextures(),
      ...mudTextures(),
      ...petTextures(),
    })
    this.scene.start('SpaScene')
  }
}
