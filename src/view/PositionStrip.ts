import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import type { Look } from '../sim/types'
import type { Rect } from './camera'
import { drawFace } from './FloorBar'
import { STRIP, stripX } from './strip'
import { whenTapped } from './ui'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const TICK_H = 44
const FRAME_H = 48
const DOT_R = 11

/** What the strip shows: the map's bounds and the part on screen, and the world x of the door, the owner and each customer waiting out of sight. */
export interface StripModel {
  bounds: Rect
  visible: Rect
  door: number
  owner: number
  dots: number[]
  look: Look
}

/** The whole row in small under the map: the view's frame, the door, the owner and red dots; a tap reports the strip x tapped. */
export class PositionStrip {
  /** Made on the first show and kept: each change redraws the bar and moves the face and dots in place. */
  private box: Phaser.GameObjects.Container | null = null
  private bar: Phaser.GameObjects.Graphics | null = null
  private face: Phaser.GameObjects.Graphics | null = null
  /** The look the face was drawn with. */
  private faceLook = ''
  /** Every dot made so far; those past the waiting count are hidden. */
  private dots: Phaser.GameObjects.Arc[] = []
  /** What the strip on screen was drawn from, so an unchanged frame draws nothing. */
  private drawn = ''

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
    private readonly onTap: (sx: number) => void,
  ) {}

  show(m: StripModel): void {
    const key = JSON.stringify(m)
    if (key === this.drawn) return
    this.drawn = key
    const box = this.box ?? this.build()
    box.setVisible(true)
    const x = (wx: number) => stripX(m.bounds, wx)
    const { y, h } = STRIP
    const g = this.bar!
    g.clear()
      .fillStyle(hex(C.cream), 1)
      .fillRoundedRect(STRIP.x, y - h / 2, STRIP.w, h, h / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(STRIP.x, y - h / 2, STRIP.w, h, h / 2)
      .lineStyle(8, hex(C.mustard))
      .lineBetween(x(m.door), y - TICK_H / 2, x(m.door), y + TICK_H / 2)
    const left = x(m.visible.x)
    g.lineStyle(6, hex(C.teal)).strokeRoundedRect(left, y - FRAME_H / 2, x(m.visible.x + m.visible.w) - left, FRAME_H, 10)
    // the face is drawn again only for a new look, over the bar and under the dots
    const look = JSON.stringify(m.look)
    if (look !== this.faceLook) {
      this.face?.destroy()
      this.face = drawFace(this.scene, m.look, 0, 0)
      box.addAt(this.face, 1)
      this.faceLook = look
    }
    this.face!.setPosition(x(m.owner), y)
    m.dots.forEach((d, i) => {
      // a new dot goes under the tap band, which stays last
      const dot = this.dots[i] ?? this.addDot(box)
      dot.setPosition(x(d), y - FRAME_H / 2).setVisible(true)
    })
    for (const dot of this.dots.slice(m.dots.length)) dot.setVisible(false)
  }

  hide(): void {
    this.box?.setVisible(false)
    this.drawn = ''
  }

  /** The kept parts: the bar's graphics and the tap band, which a hidden strip does not take taps on. */
  private build(): Phaser.GameObjects.Container {
    const add = this.scene.add
    this.bar = add.graphics()
    const hit = whenTapped(add.zone(STRIP.x + STRIP.w / 2, STRIP.y, STRIP.w, STRIP.hitH).setInteractive(), p => {
      sound.play('tap')
      this.onTap(p.x)
    })
    this.box = add.container(0, 0, [this.bar, hit]).setDepth(this.depth)
    return this.box
  }

  private addDot(box: Phaser.GameObjects.Container): Phaser.GameObjects.Arc {
    const dot = this.scene.add.circle(0, 0, DOT_R, hex(C.lantern)).setStrokeStyle(4, hex(C.ink))
    box.addAt(dot, box.length - 1)
    this.dots.push(dot)
    return dot
  }
}
