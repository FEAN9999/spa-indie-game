import * as Phaser from 'phaser'
import { BUSTLE_ART } from '../art/bustle'
import { C } from '../art/palette'
import { BUSTLE_PIECES, BUSTLE_ROWS, NIGHT_MARKET_OPEN_MIN, TILE } from '../config'
import { BUSTLE_IDS, type BustleId } from '../sim/bustle'
import { BUSTLE_TEXT } from '../strings/bustle'
import { t } from '../strings/vi'
import { bustleMarks, bustlePictures, colX, lotLabelAt, millions, OLD_ROAD_ROW, onSidewalk, roadCovers, rowY, STRIP_ROW, type ColSpan } from './bustle'
import type { Rect } from './camera'
import { daylight } from './daylight'
import { DARK, DARK_DEPTH, NIGHT_DEPTH } from './RoomView'
import { textStyle } from './text'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** The open street's ground lies over the old road, on the ground with the shop fronts; its pieces stand among people by their foot. */
const GROUND_DEPTH = 0.4
/** What is for sale shows over the night and the power cut, at any hour. */
const MARK_DEPTH = DARK_DEPTH + 10
/** The ground is laid in stretches this many columns wide. */
const STRIP_COLS = BUSTLE_ART['bustle-strip'].w
/** A lot's name: its size, and the pill round it. */
const LABEL = { size: 26, padX: 18, h: 46 }
/** A piece just bought grows out of the ground. */
const POP = { from: 0.4, ms: 450 }

/** What the street shows this frame. */
export interface BustleView {
  /** The restaurant is bought and the main shop is shown. */
  open: boolean
  floor: number
  bought: readonly BustleId[]
  minutes: number
  powerOut: boolean
  /** The + marks and the lots' names show: on floor 1 of the player's own shop. */
  marks: boolean
  /** The street's extent in world pixels, where its ground and its light lie. */
  light: Rect
  /** The columns whose upper floors lay a balcony over the sidewalk. */
  fronts: readonly ColSpan[]
}

/** The street in front of the main shop once the restaurant is bought: the rows it adds under the old road, the pieces bought for it, and the marks over the rest. */
export class BustleLayer {
  private readonly scene: Phaser.Scene
  private parts: Phaser.GameObjects.GameObject[] = []
  private readonly pieces = new Map<BustleId, Phaser.GameObjects.Image[]>()
  private readonly night: Phaser.GameObjects.Rectangle
  private readonly dark: Phaser.GameObjects.Rectangle
  /** What is drawn now; the street is drawn again only when it changes. */
  private drawn = ''

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const h = BUSTLE_ROWS * TILE
    this.night = scene.add.rectangle(0, rowY(STRIP_ROW), 1, h, 0, 0).setOrigin(0, 0).setDepth(NIGHT_DEPTH).setVisible(false)
    this.dark = scene.add.rectangle(0, rowY(STRIP_ROW), 1, h, DARK.color, DARK.alpha).setOrigin(0, 0).setDepth(DARK_DEPTH).setVisible(false)
  }

  sync(v: BustleView): void {
    const key = v.open ? [v.floor, v.bought.join(','), v.minutes >= NIGHT_MARKET_OPEN_MIN, v.marks, v.light.x, v.light.w, v.fronts.flat().join(',')].join('|') : 'shut'
    if (key !== this.drawn) {
      this.drawn = key
      this.redraw(v)
    }
    // the day's light and the power cut's dark over the rows the street adds, as RoomView lays them over the rest
    const d = daylight(v.minutes)
    this.night.setFillStyle(d.color, d.alpha).setVisible(v.open && d.alpha > 0)
    this.dark.setVisible(v.open && v.powerOut)
  }

  /** The piece just bought grows out of the ground; sync first, so it is drawn. */
  pop(id: BustleId): void {
    for (const img of this.pieces.get(id) ?? []) {
      img.setScale(POP.from).setAlpha(0)
      this.scene.tweens.add({ targets: img, scale: 1, alpha: 1, duration: POP.ms, ease: 'Back.easeOut' })
    }
  }

  destroy(): void {
    this.clear()
    this.night.destroy()
    this.dark.destroy()
  }

  private clear(): void {
    for (const p of this.parts) p.destroy()
    this.parts = []
    this.pieces.clear()
  }

  private redraw(v: BustleView): void {
    this.clear()
    if (!v.open) return
    const add = this.scene.add
    for (const r of [this.night, this.dark]) r.setX(v.light.x).setSize(v.light.w, BUSTLE_ROWS * TILE)
    // the ground in stretches across the street, and plain road over the old road's dashed line wherever it shows
    const start = (v.light.x - colX(0)) / TILE
    const end = start + v.light.w / TILE
    for (let c = Math.floor(start / STRIP_COLS) * STRIP_COLS; c < end; c += STRIP_COLS)
      this.parts.push(add.image(colX(c), rowY(STRIP_ROW), 'bustle-strip').setOrigin(0, 0).setDepth(GROUND_DEPTH))
    for (const [from, to] of roadCovers(v.floor, [start, end], v.fronts))
      this.parts.push(add.rectangle(colX(from), rowY(OLD_ROAD_ROW), (to - from) * TILE, (STRIP_ROW - OLD_ROAD_ROW) * TILE, hex(C.road)).setOrigin(0, 0).setDepth(GROUND_DEPTH))
    // each piece bought, anchored at its bottom middle; an upper floor's balcony hides the sidewalk
    for (const id of v.bought) {
      if (onSidewalk(id) && v.floor !== 1) continue
      const images = bustlePictures(id, v.minutes).map(p => {
        const size = BUSTLE_ART[p.key]
        return add
          .image(colX(p.col + size.w / 2), rowY(p.row + size.h), p.key)
          .setOrigin(0.5, 1)
          .setDepth(rowY(p.foot))
      })
      this.pieces.set(id, images)
      this.parts.push(...images)
    }
    if (!v.marks) return
    for (const id of BUSTLE_IDS) {
      if (v.bought.includes(id)) continue
      for (const m of bustleMarks(id)) this.parts.push(add.image(colX(m.col), rowY(m.row), m.key).setOrigin(0, 0).setScale(m.scale).setDepth(MARK_DEPTH))
      const at = lotLabelAt(id)
      if (!at) continue
      const x = colX(at.col)
      const y = rowY(at.row)
      const label = add
        .text(x, y, t('bustleLotLabel', { name: BUSTLE_TEXT[id].name, money: millions(BUSTLE_PIECES[id].price) }), textStyle(LABEL.size))
        .setOrigin(0.5)
        .setDepth(MARK_DEPTH + 1)
      const w = label.width + 2 * LABEL.padX
      const pill = add
        .graphics()
        .fillStyle(hex(C.cream), 1)
        .fillRoundedRect(-w / 2, -LABEL.h / 2, w, LABEL.h, LABEL.h / 2)
        .lineStyle(3, hex(C.ink))
        .strokeRoundedRect(-w / 2, -LABEL.h / 2, w, LABEL.h, LABEL.h / 2)
        .setPosition(x, y)
        .setDepth(MARK_DEPTH)
      this.parts.push(pill, label)
    }
  }
}
