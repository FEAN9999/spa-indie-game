import * as Phaser from 'phaser'
import { C, ownerColors } from '../art/palette'
import { sound } from '../audio/engine'
import type { Look } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import type { Pill } from './floors'
import { textStyle } from './text'
import { whenTapped } from './ui'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const PILL_W = 320
const PILL_H = 96
const GAP = 24
const CENTER = { x: 540, y: 1855 }
const FACE_R = 24
const DOT_R = 13
const DASH_STEPS = 48
const NAME: Record<number, StringKey> = { 1: 'floorName1', 2: 'floorName2', 3: 'floorName3' }

/** A small head: skin disc with a cap of hair on top. */
export function drawFace(scene: Phaser.Scene, look: Look, x: number, y: number): Phaser.GameObjects.Graphics {
  const c = ownerColors(look)
  return scene.add
    .graphics()
    .fillStyle(c.skin, 1)
    .fillCircle(x, y, FACE_R)
    .fillStyle(c.hair, 1)
    .slice(x, y, FACE_R, Math.PI, 2 * Math.PI)
    .fillPath()
    .lineStyle(3, hex(C.ink))
    .strokeCircle(x, y, FACE_R)
}

/** The floor buttons in a row above the nav; a tap on any of them reports its floor. */
export class FloorBar {
  private box: Phaser.GameObjects.Container | null = null
  /** What the row on screen was drawn from, so an unchanged frame draws nothing. */
  private drawn = ''

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
    private readonly onTap: (floor: number) => void,
  ) {}

  show(pills: Pill[], look: Look): void {
    const key = JSON.stringify([pills, look])
    if (key === this.drawn) return
    this.hide()
    this.drawn = key
    const box = this.scene.add.container(0, 0).setDepth(this.depth)
    const left = CENTER.x - (pills.length * PILL_W + (pills.length - 1) * GAP) / 2 + PILL_W / 2
    pills.forEach((p, i) => box.add(this.pill(p, look, left + i * (PILL_W + GAP))))
    this.box = box
  }

  /** Whether the row is on screen. */
  get shown(): boolean {
    return this.box !== null
  }

  hide(): void {
    this.box?.destroy()
    this.box = null
    this.drawn = ''
  }

  private pill(p: Pill, look: Look, x: number): Phaser.GameObjects.Container {
    const add = this.scene.add
    const viewed = p.state === 'viewed'
    const locked = p.state === 'locked'
    const g = add.graphics().fillStyle(hex(viewed ? C.teal : C.cream), 1).fillRoundedRect(-PILL_W / 2, -PILL_H / 2, PILL_W, PILL_H, PILL_H / 2)
    if (locked) this.dashedEdge(g)
    else g.lineStyle(4, hex(C.ink)).strokeRoundedRect(-PILL_W / 2, -PILL_H / 2, PILL_W, PILL_H, PILL_H / 2)
    const parts: Phaser.GameObjects.GameObject[] = [g]
    const ink = viewed ? C.cream : C.ink
    const label = locked ? formatMoney(p.price) : t(NAME[p.floor])
    const text = add.text(24, 0, label, textStyle(locked ? 36 : 44, '800', ink)).setOrigin(0.5)
    // Fit the label between the icon slot and the pill's round end: names in -70..136, prices in -80..136.
    const from = locked ? -80 : -70
    const room = 136 - from
    if (locked || text.width > room) text.setScale(Math.min(1, room / text.width)).setX(from + room / 2)
    parts.push(text)
    if (locked) parts.push(add.image(-PILL_W / 2 + 56, 0, 'icon-lock').setScale(0.8))
    if (p.face) parts.push(drawFace(this.scene, look, -PILL_W / 2 + 56, 0))
    if (p.dot) parts.push(add.circle(PILL_W / 2 - 22, -PILL_H / 2 + 18, DOT_R, hex(C.lantern)).setStrokeStyle(4, hex(C.ink)))
    return whenTapped(add.container(x, CENTER.y, parts).setSize(PILL_W, PILL_H).setInteractive(), () => {
      sound.play('tap')
      this.onTap(p.floor)
    })
  }

  /** A stadium outline drawn as alternating dashes: two half-circles joined by straight sides. */
  private dashedEdge(g: Phaser.GameObjects.Graphics): void {
    const r = PILL_H / 2
    const half = PILL_W / 2 - r
    const straight = 2 * half
    const arc = Math.PI * r
    const total = 2 * straight + 2 * arc
    const at = (d: number) => {
      if (d < straight) return { x: -half + d, y: -r }
      d -= straight
      if (d < arc) {
        const a = -Math.PI / 2 + d / r
        return { x: half + Math.cos(a) * r, y: Math.sin(a) * r }
      }
      d -= arc
      if (d < straight) return { x: half - d, y: r }
      d -= straight
      const a = Math.PI / 2 + d / r
      return { x: -half + Math.cos(a) * r, y: Math.sin(a) * r }
    }
    g.lineStyle(4, hex(C.ink))
    const seg = total / (DASH_STEPS * 2)
    for (let i = 0; i < DASH_STEPS; i++) {
      const a = at(i * 2 * seg)
      const b = at(i * 2 * seg + seg)
      g.lineBetween(a.x, a.y, b.x, b.y)
    }
  }
}
