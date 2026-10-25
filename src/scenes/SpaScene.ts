import * as Phaser from 'phaser'
import { parseLayout } from '../sim/grid'
import { SPA_LAYOUT_1A } from '../sim/layout'
import { RoomView } from '../view/RoomView'

/** Stub until Task 7: draws the room only. */
export class SpaScene extends Phaser.Scene {
  constructor() {
    super('SpaScene')
  }

  create() {
    new RoomView(this, parseLayout(SPA_LAYOUT_1A))
  }
}
