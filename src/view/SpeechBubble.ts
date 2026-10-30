import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_W } from '../config'
import { textStyle } from './text'

/** Over the shop's other effects (the mood bubble and the floating money). */
const DEPTH = 9000 + 20
const FADE_IN_MS = 150
const FADE_OUT_MS = 250
const WRAP = 520
const PAD_X = 36
const PAD_Y = 22
const RADIUS = 24
const TAIL_H = 26
const TAIL_HALF_W = 18
/** The card never gets closer than this to the edge of the view; its tail still points at the head. */
const EDGE_PX = 24
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** A line of speech over a head: paper card, ink border and a tail pointing down. It fades in, holds, fades out and is then `done`; it never takes a tap. */
export class SpeechBubble {
  private readonly box: Phaser.GameObjects.Container
  /** The card and its text, slid sideways to stay on screen while the tail stays put. */
  private readonly card: Phaser.GameObjects.Container
  private readonly halfW: number
  private readonly tween: Phaser.Tweens.TweenChain
  private over = false

  constructor(scene: Phaser.Scene, text: string, ms: number) {
    const label = scene.add.text(0, 0, text, { ...textStyle(32, '600'), align: 'center', wordWrap: { width: WRAP } }).setOrigin(0.5)
    const w = label.width + PAD_X * 2
    const h = label.height + PAD_Y * 2
    // the container sits at the tail tip; the card's bottom edge is TAIL_H above it
    const top = -TAIL_H - h
    label.setPosition(0, top + h / 2)
    this.halfW = w / 2
    const cardG = scene.add.graphics()
    cardG.fillStyle(hex(C.paper), 1).fillRoundedRect(-w / 2, top, w, h, RADIUS)
    cardG.lineStyle(4, hex(C.ink)).strokeRoundedRect(-w / 2, top, w, h, RADIUS)
    this.card = scene.add.container(0, 0, [cardG, label])
    const g = scene.add.graphics()
    // the tail covers the card's border where it joins, then is outlined on its two slanted sides only; the card is under it
    g.fillStyle(hex(C.paper), 1).fillTriangle(-TAIL_HALF_W, -TAIL_H - 2, TAIL_HALF_W, -TAIL_H - 2, 0, 0)
    g.lineStyle(4, hex(C.ink)).beginPath().moveTo(-TAIL_HALF_W, -TAIL_H).lineTo(0, 0).lineTo(TAIL_HALF_W, -TAIL_H).strokePath()
    this.box = scene.add.container(0, 0, [this.card, g]).setDepth(DEPTH).setAlpha(0)
    this.tween = scene.tweens.chain({
      targets: this.box,
      tweens: [
        { alpha: 1, duration: FADE_IN_MS },
        { alpha: 1, duration: ms },
        { alpha: 0, duration: FADE_OUT_MS },
      ],
      onComplete: () => {
        this.over = true
      },
    })
  }

  /** The tail tip, in world pixels; the card stays between `bounds`' left and right, the part of the map in view. */
  setPosition(x: number, y: number, bounds = { left: 0, right: GAME_W }): this {
    this.box.setPosition(x, y)
    // keep the tail under the card's body, and the card on screen
    const reach = this.halfW - RADIUS - TAIL_HALF_W
    const left = bounds.left + EDGE_PX + this.halfW
    const centre = Phaser.Math.Clamp(x, left, Math.max(left, bounds.right - EDGE_PX - this.halfW))
    this.card.x = Phaser.Math.Clamp(centre, x - reach, x + reach) - x
    return this
  }

  /** Hidden while its customer is on a floor that is not in view. */
  setVisible(visible: boolean): this {
    this.box.setVisible(visible)
    return this
  }

  get done(): boolean {
    return this.over
  }

  destroy(): void {
    this.tween.destroy()
    this.box.destroy()
  }
}
