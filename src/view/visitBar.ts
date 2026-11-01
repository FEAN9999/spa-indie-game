import type * as Phaser from 'phaser'
import { GAME_W } from '../config'
import { t } from '../strings/vi'
import { DEPTH } from './Hud'
import { textStyle } from './text'
import { addButton } from './ui'

const NAME_Y = 1995
const NAME_W = 980
const BUTTON = { y: 2085, h: 110, size: 40 }

/** Over the empty bottom bar while looking round a friend's shop: whose shop it is, its chain's map when it has branches, and the way home. */
export function addVisitBar(scene: Phaser.Scene, shopName: string, onMap: (() => void) | null, onHome: () => void): void {
  const name = scene.add.text(GAME_W / 2, NAME_Y, t('visitAt', { shop: shopName }), textStyle(36, '800')).setOrigin(0.5).setDepth(DEPTH + 1)
  if (name.width > NAME_W) name.setScale(NAME_W / name.width)
  if (onMap) {
    addButton(scene, 290, BUTTON.y, 420, BUTTON.h, t('navChain'), 'plain', onMap, BUTTON.size).setDepth(DEPTH + 1)
    addButton(scene, 790, BUTTON.y, 440, BUTTON.h, t('visitHome'), 'primary', onHome, BUTTON.size).setDepth(DEPTH + 1)
  } else addButton(scene, GAME_W / 2, BUTTON.y, 720, BUTTON.h, t('visitHome'), 'primary', onHome, BUTTON.size).setDepth(DEPTH + 1)
}
