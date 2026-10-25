import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { SaveSession } from '../save/session'
import type { SaveStore } from '../save/store'
import type { SpaSim } from '../sim/spa'
import { t } from '../strings/vi'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export type PausePanel = 'menu' | 'install'

export interface PauseData {
  sim: SpaSim
  store: SaveStore
  session: SaveSession
  panel: PausePanel
  onResume: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** The pause card over the frozen spa. Taps on the dimmed backdrop do nothing, so a stray tap never resumes. */
export class PauseScene extends Phaser.Scene {
  private params!: PauseData

  constructor() {
    super('PauseScene')
  }

  init(data: PauseData) {
    this.params = data
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this, 90, 760, 900, 520)
    this.add.text(GAME_W / 2, 890, t('paused'), textStyle(80)).setOrigin(0.5)
    addButton(this, GAME_W / 2, 1100, 720, 150, t('resume'), 'primary', () => this.resume())
  }

  private resume(): void {
    this.params.onResume()
    this.scene.stop()
  }
}
