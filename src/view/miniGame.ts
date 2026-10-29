import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import type { CustomerKind } from '../sim/customers'
import type { Stars } from '../sim/economy'
import type { IdolId } from '../sim/idols'
import type { Look } from '../sim/types'
import { textStyle } from './text'
import { addCard } from './ui'

/** What a mini-game scene is opened with. */
export interface MiniGameData {
  look: Look
  kind: CustomerKind
  /** A star, drawn in their own colours. */
  idol?: IdolId
  /** Added to the time limit and the star marks on the gentler first days; only the shampoo uses it. */
  extraMs: number
  /** A picky customer: the hard version of the game. */
  hard: boolean
  /** The first game of its kind shows each move with a faint hand. */
  demo: boolean
  /** The lesson's practice game, whose customer is the teacher. */
  teacher?: boolean
  onDone: (stars: Stars) => void
}

const CARD = { x: 60, y: 260, w: 960, h: 1440 }
const INSTRUCTION_Y = 345
const INSTRUCTION_MAX_W = 880
const BAR = { x: 140, w: 800, h: 28, progressY: 420, timeY: 1612 }
const STAR_Y = 1330
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** The dimmed shop, the card the game is played on and the instruction line at its top, which is returned. */
export function addMiniGameCard(scene: Phaser.Scene, instruction: string): Phaser.GameObjects.Text {
  // interactive so taps stop here instead of reaching the spa's HUD underneath
  scene.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
  addCard(scene, CARD.x, CARD.y, CARD.w, CARD.h)
  // one line, scaled down to fit the card when it is long, so no word is left alone on a second line
  const text = scene.add
    .text(GAME_W / 2, INSTRUCTION_Y, instruction, { ...textStyle(46), align: 'center', wordWrap: { width: 1100 } })
    .setOrigin(0.5)
  return fitInstruction(text)
}

/** Swaps the instruction's words, keeping it on one line. */
export function setInstruction(text: Phaser.GameObjects.Text, words: string): void {
  fitInstruction(text.setText(words))
}

const fitInstruction = (text: Phaser.GameObjects.Text) => text.setScale(Math.min(1, INSTRUCTION_MAX_W / text.width))

/** The progress bar under the instruction and the time bar at the foot of the card; both run from 0 to 1. */
export function drawBars(g: Phaser.GameObjects.Graphics, progress: number, timeLeft: number): void {
  g.clear()
  const bar = (y: number, fill: number, k: number) => {
    g.fillStyle(hex(C.tileSeam), 1).fillRoundedRect(BAR.x, y, BAR.w, BAR.h, BAR.h / 2)
    if (k > 0) g.fillStyle(fill, 1).fillRoundedRect(BAR.x, y, Math.max(BAR.h, BAR.w * k), BAR.h, BAR.h / 2)
  }
  bar(BAR.progressY, hex(C.teal), progress)
  bar(BAR.timeY, hex(C.mustard), timeLeft)
}

/** Fills the stars one after another on the card, then calls `onDone`. */
export function revealStars(scene: Phaser.Scene, stars: Stars, onDone: () => void): void {
  ;[-1, 0, 1].forEach((offset, i) => {
    const slot = scene.add.image(GAME_W / 2 + offset * 170, STAR_Y, 'star-empty').setScale(1.4)
    if (i >= stars) return
    scene.time.delayedCall(300 + i * 400, () => {
      sound.play('star', i)
      slot.setTexture('star').setScale(0.6)
      scene.tweens.add({ targets: slot, scale: 1.4, duration: 250, ease: 'Back.easeOut' })
    })
  })
  scene.time.delayedCall(1900, onDone)
}
