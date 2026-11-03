import * as Phaser from 'phaser'
import { C } from '../art/palette'
import type { Box } from './bake'
import { pictureTexture } from './bakeGraphics'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** The fill at its fullest, its height and the shortest it shrinks to, which keeps both rounded ends. */
export const BAR = { w: 72, h: 12, min: 12 }
/** The paper frame reaches this far past the fill on every side. */
const RIM = 4
/** Canvas pixels per unit: the map zooms in past normal size, so the bar is drawn at twice its size. */
const K = 2

/**
 * A bar over someone's head that empties or fills: a paper frame with an ink outline and a rounded fill of a colour inside it. Both
 * are pictures made once, the fill a white pill stretched between its two rounded ends and tinted, so a bar that changes every frame
 * costs no redrawing.
 */
export class HeadBar {
  private readonly frame: Phaser.GameObjects.Image
  private readonly fill: Phaser.GameObjects.NineSlice
  private readonly frameBox: Box
  private readonly pillBox: Box
  private fillW = -1

  constructor(scene: Phaser.Scene) {
    const side = BAR.w + 2 * RIM
    this.frameBox = pictureTexture(scene, 'head-bar-frame', K, g =>
      g.fillStyle(hex(C.paper), 1).fillRoundedRect(0, 0, side, BAR.h + 2 * RIM, 10).lineStyle(3, hex(C.ink)).strokeRoundedRect(0, 0, side, BAR.h + 2 * RIM, 10),
    )
    this.pillBox = pictureTexture(scene, 'head-bar-fill', K, g => g.fillStyle(0xffffff, 1).fillRoundedRect(0, 0, BAR.min, BAR.h, BAR.h / 2))
    this.frame = scene.add.image(0, 0, 'head-bar-frame').setOrigin(0).setScale(1 / K)
    // the pill's two rounded ends, with the room around them, stay whole; only the line between them stretches
    const left = -this.pillBox.x + BAR.min / 2
    const right = this.pillBox.x + this.pillBox.w - BAR.min / 2
    this.fill = scene.add.nineslice(0, 0, 'head-bar-fill', undefined, this.pillBox.w * K, this.pillBox.h * K, left * K, right * K, 0, 0)
    this.fill.setOrigin(0).setScale(1 / K)
    this.hide()
  }

  /** Shows the bar with its fill's top-left at (x, y), `full` of it filled (never shorter than its two ends), in `color`. */
  show(x: number, y: number, full: number, color: number): void {
    const w = Math.max(BAR.min, BAR.w * full)
    if (w !== this.fillW) {
      this.fillW = w
      this.fill.setSize((this.pillBox.w + w - BAR.min) * K, this.fill.height)
    }
    this.frame.setPosition(x - RIM + this.frameBox.x, y - RIM + this.frameBox.y).setVisible(true)
    this.fill.setPosition(x + this.pillBox.x, y + this.pillBox.y).setTint(color).setVisible(true)
  }

  hide(): void {
    this.frame.setVisible(false)
    this.fill.setVisible(false)
  }

  setDepth(depth: number): this {
    this.frame.setDepth(depth)
    this.fill.setDepth(depth)
    return this
  }

  destroy(): void {
    this.frame.destroy()
    this.fill.destroy()
  }
}
