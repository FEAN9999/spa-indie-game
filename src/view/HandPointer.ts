import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { DEPTH as HUD_DEPTH } from './Hud'
import { textStyle } from './text'

/** Over the HUD, under its toasts and the morning banner. */
const DEPTH = HUD_DEPTH + 40
const BOB_PX = 12
const BOB_MS = 700
/** Space between the hand at the top of its bob and the text box. */
const GAP = 8
const BOX = { left: 40, right: 1040, padX: 36, padY: 10, radius: 12, wrap: 900 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** The guide's hand pointing at one spot, with a line of text beside it. Never takes a tap. */
export class HandPointer {
  /** The hand bobs inside `hand`, which moves to the point. */
  private hand: Phaser.GameObjects.Container | null = null
  private finger: Phaser.GameObjects.Image | null = null
  private box: Phaser.GameObjects.Container | null = null
  /** The box's size, to place it again when only the point moves. */
  private boxW = 0
  private boxH = 0
  private shown = ''

  constructor(private readonly scene: Phaser.Scene) {}

  /** `down`: the fingertip touches (x, y) from above, the text above the hand; `up`: from below, the text below. The same text and direction only moves them. */
  show(text: string, x: number, y: number, dir: 'down' | 'up'): void {
    const key = `${text}|${dir}`
    const away = dir === 'down' ? -1 : 1
    if (key !== this.shown) {
      this.hide()
      this.shown = key

      const add = this.scene.add
      // the fingertip sits at the bottom centre of the texture; a negative scale mirrors the hand about it
      this.finger = add.image(0, 0, 'hand').setOrigin(0.5, 1).setScale(1, -away)
      this.hand = add.container(0, 0, [this.finger]).setDepth(DEPTH)
      this.scene.tweens.add({ targets: this.finger, y: away * BOB_PX, duration: BOB_MS, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

      const label = add.text(0, 0, text, { ...textStyle(38, '600'), align: 'center', wordWrap: { width: BOX.wrap } }).setOrigin(0.5)
      const w = label.width + BOX.padX * 2
      const h = label.height + BOX.padY * 2
      const bg = add
        .graphics()
        .fillStyle(hex(C.paper), 1)
        .fillRoundedRect(-w / 2, -h / 2, w, h, BOX.radius)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(-w / 2, -h / 2, w, h, BOX.radius)
      this.box = add.container(0, 0, [bg, label]).setDepth(DEPTH)
      this.boxW = w
      this.boxH = h
    }
    this.hand!.setPosition(x, y)
    const bx = Phaser.Math.Clamp(x, BOX.left + this.boxW / 2, BOX.right - this.boxW / 2)
    const by = y + away * (this.finger!.height + BOB_PX + GAP + this.boxH / 2)
    this.box!.setPosition(bx, by)
  }

  hide(): void {
    if (this.finger) this.scene.tweens.killTweensOf(this.finger)
    this.hand?.destroy()
    this.box?.destroy()
    this.hand = null
    this.finger = null
    this.box = null
    this.shown = ''
  }
}
