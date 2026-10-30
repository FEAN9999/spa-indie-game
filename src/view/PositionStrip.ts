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
  private box: Phaser.GameObjects.Container | null = null
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
    this.hide()
    this.drawn = key
    const add = this.scene.add
    const x = (wx: number) => stripX(m.bounds, wx)
    const { y, h } = STRIP
    const g = add
      .graphics()
      .fillStyle(hex(C.cream), 1)
      .fillRoundedRect(STRIP.x, y - h / 2, STRIP.w, h, h / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(STRIP.x, y - h / 2, STRIP.w, h, h / 2)
      .lineStyle(8, hex(C.mustard))
      .lineBetween(x(m.door), y - TICK_H / 2, x(m.door), y + TICK_H / 2)
    const left = x(m.visible.x)
    g.lineStyle(6, hex(C.teal)).strokeRoundedRect(left, y - FRAME_H / 2, x(m.visible.x + m.visible.w) - left, FRAME_H, 10)
    const parts: Phaser.GameObjects.GameObject[] = [g, drawFace(this.scene, m.look, x(m.owner), y)]
    for (const d of m.dots) parts.push(add.circle(x(d), y - FRAME_H / 2, DOT_R, hex(C.lantern)).setStrokeStyle(4, hex(C.ink)))
    const hit = whenTapped(add.zone(STRIP.x + STRIP.w / 2, y, STRIP.w, STRIP.hitH).setInteractive(), p => {
      sound.play('tap')
      this.onTap(p.x)
    })
    this.box = add.container(0, 0, [...parts, hit]).setDepth(this.depth)
  }

  hide(): void {
    this.box?.destroy()
    this.box = null
    this.drawn = ''
  }
}
