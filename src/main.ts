import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/800.css'
import * as Phaser from 'phaser'
import { GAME_H, GAME_W } from './config'
import { BootScene } from './scenes/BootScene'
import { PauseScene } from './scenes/PauseScene'
import { ShampooScene } from './scenes/ShampooScene'
import { SpaScene } from './scenes/SpaScene'
import { SummaryScene } from './scenes/SummaryScene'

async function start() {
  // Canvas text never re-renders after a late font load, so load both weights, Vietnamese glyphs included, first.
  const sample = 'Đang tải ngày mới ặ ố ữ'
  await Promise.all([document.fonts.load(`600 40px "Be Vietnam Pro"`, sample), document.fonts.load(`800 40px "Be Vietnam Pro"`, sample)])
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    backgroundColor: '#F3E6D3',
    pixelArt: false,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, SpaScene, ShampooScene, SummaryScene, PauseScene],
  })
  if (import.meta.env.DEV) (window as any).__spa = { game }
}

// ask the browser not to clear the saves when space runs low
navigator.storage?.persist?.()

start()
