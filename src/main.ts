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
import { HudScene } from './scenes/HudScene'
import { InspectScene } from './scenes/InspectScene'
import { NewOutfitScene } from './scenes/NewOutfitScene'
import { LitterScene } from './scenes/LitterScene'
import { PetNameScene } from './scenes/PetNameScene'
import { PetGiveScene } from './scenes/PetGiveScene'
import { MenuScene } from './scenes/MenuScene'
import { ChefScene } from './scenes/ChefScene'
import { PhoScene } from './scenes/PhoScene'
import { BanhXeoScene } from './scenes/BanhXeoScene'
import { CheScene } from './scenes/CheScene'
import { PhayScene } from './scenes/PhayScene'
import { MaskScene } from './scenes/MaskScene'
import { MassageScene } from './scenes/MassageScene'
import { MudScene } from './scenes/MudScene'
import { OwnerScene } from './scenes/OwnerScene'
import { PauseScene } from './scenes/PauseScene'
import { QuestsScene } from './scenes/QuestsScene'
import { RankScene } from './scenes/RankScene'
import { LessonScene } from './scenes/LessonScene'
import { RecipeScene } from './scenes/RecipeScene'
import { ScrubScene } from './scenes/ScrubScene'
import { FootScene } from './scenes/FootScene'
import { NailsScene } from './scenes/NailsScene'
import { ShampooScene } from './scenes/ShampooScene'
import { SpaScene } from './scenes/SpaScene'
import { StarterScene } from './scenes/StarterScene'
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
    // two fingers on the map pinch it
    input: { activePointers: 2 },
    scene: [BootScene, SpaScene, HudScene, ShampooScene, MaskScene, MassageScene, SteamScene, StoneScene, MudScene, SummaryScene, PauseScene, OwnerScene, BuildScene, StaffScene, ServicesScene, GuestBookScene, RecipeScene, LessonScene, ScrubScene, FootScene, NailsScene, PhoScene, BanhXeoScene, CheScene, MenuScene, ChefScene, QuestsScene, InspectScene, RankScene, WardrobeScene, NewOutfitScene, LitterScene, PetNameScene, PetGiveScene, ChoiceScene, ChainScene, AwayScene, StarterScene, PhayScene],
  })
  if (import.meta.env.DEV) (window as any).__spa = { game, audio: sound }
  // frame timing over the game for measuring on a phone, only with ?perf in the address
  if (new URLSearchParams(location.search).has('perf')) void import('./app/perf').then(m => m.showPerf(game))
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
