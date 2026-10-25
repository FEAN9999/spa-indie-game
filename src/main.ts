import '@fontsource/baloo-2/500.css'
import '@fontsource/baloo-2/700.css'
import * as Phaser from 'phaser'
import { GAME_H, GAME_W } from './config'
import { BootScene } from './scenes/BootScene'
import { SpaScene } from './scenes/SpaScene'

async function start() {
  // Canvas text never re-renders after a late font load, so load both weights, Vietnamese glyphs included, first.
  const sample = 'Đang tải ngày mới ặ ố ữ'
  await Promise.all([document.fonts.load(`500 40px "Baloo 2"`, sample), document.fonts.load(`700 40px "Baloo 2"`, sample)])
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    backgroundColor: '#fdf1e4',
    pixelArt: false,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, SpaScene],
  })
  if (import.meta.env.DEV) (window as any).__spa = { game }
}

start()
