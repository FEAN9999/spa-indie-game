import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/800.css'
import * as Phaser from 'phaser'
import { captureInstallPrompt } from './app/install'
import { BUILD_ID, registerServiceWorker } from './app/update'
import { sound } from './audio/engine'
import { GAME_H, GAME_W } from './config'
import { AwayScene } from './scenes/AwayScene'
import { BootScene } from './scenes/BootScene'
import { BuildScene } from './scenes/BuildScene'
import { ChainScene } from './scenes/ChainScene'
import { ChoiceScene } from './scenes/ChoiceScene'
import { GuestBookScene } from './scenes/GuestBookScene'
import { InspectScene } from './scenes/InspectScene'
import { NewOutfitScene } from './scenes/NewOutfitScene'
import { MaskScene } from './scenes/MaskScene'
import { MassageScene } from './scenes/MassageScene'
import { MudScene } from './scenes/MudScene'
import { OwnerScene } from './scenes/OwnerScene'
import { PauseScene } from './scenes/PauseScene'
import { QuestsScene } from './scenes/QuestsScene'
import { RankScene } from './scenes/RankScene'
import { RecipeScene } from './scenes/RecipeScene'
import { ShampooScene } from './scenes/ShampooScene'
import { SpaScene } from './scenes/SpaScene'
import { ServicesScene } from './scenes/ServicesScene'
import { StaffScene } from './scenes/StaffScene'
import { SteamScene } from './scenes/SteamScene'
import { StoneScene } from './scenes/StoneScene'
import { SummaryScene } from './scenes/SummaryScene'
import { WardrobeScene } from './scenes/WardrobeScene'

async function start() {
  // Canvas text never re-renders after a late font load, so load both weights, Vietnamese glyphs included, first.
  const sample = 'Đang tải ngày mới ặ ố ữ'
  await Promise.all([document.fonts.load(`600 40px "Be Vietnam Pro"`, sample), document.fonts.load(`800 40px "Be Vietnam Pro"`, sample)])
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    // HTML text boxes for save codes sit over the canvas and scale with it
    dom: { createContainer: true },
    width: GAME_W,
    height: GAME_H,
    backgroundColor: '#F3E6D3',
    pixelArt: false,
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // all sound is made by src/audio, so Phaser never opens its own AudioContext
    audio: { noAudio: true },
    scene: [BootScene, SpaScene, ShampooScene, MaskScene, MassageScene, SteamScene, StoneScene, MudScene, SummaryScene, PauseScene, OwnerScene, BuildScene, StaffScene, ServicesScene, GuestBookScene, RecipeScene, QuestsScene, InspectScene, RankScene, WardrobeScene, NewOutfitScene, ChoiceScene, ChainScene, AwayScene],
  })
  if (import.meta.env.DEV) (window as any).__spa = { game, audio: sound }
}

// Chrome offers the install prompt once, early; keep it for the "Cài" button
captureInstallPrompt()
// ask the browser not to clear the saves when space runs low
navigator.storage?.persist?.()
registerServiceWorker()
// which version is running, for checking a deploy from the browser
document.documentElement.dataset.build = BUILD_ID
// sound may only start at the player's first touch
sound.listenForFirstTouch(window)

start()
