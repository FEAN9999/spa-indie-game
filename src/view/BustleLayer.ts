import * as Phaser from 'phaser'
import { BUSTLE_ART } from '../art/bustle'
import { C, customerColors } from '../art/palette'
import { BUSTLE_PIECES, BUSTLE_ROWS, NIGHT_MARKET_OPEN_MIN, TILE } from '../config'
import { BUSTLE_IDS, type BustleId } from '../sim/bustle'
import { createRng, randomLook } from '../sim/rng'
import { BUSTLE_TEXT } from '../strings/bustle'
import { t } from '../strings/vi'
import { busAt, bustleMarks, bustlePictures, colX, lotLabelAt, millions, OLD_ROAD_ROW, onSidewalk, roadCovers, rowY, streetLights, STRIP_ROW, walkLanes, type ColSpan, type WalkLane } from './bustle'
import type { Rect } from './camera'
import { daylight } from './daylight'
import { CharacterView } from './CharacterView'
import { addGlow, DARK, DARK_DEPTH, NIGHT_DEPTH } from './RoomView'
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
/** Passers-by are drawn smaller than customers, and each walks at its lane's speed times a share in this range. */
const WALKER = { scale: 0.8, slow: 0.7, spread: 0.6 }
/** The bus's top on the new lane, and the row its wheels stand on, which sets its depth. */
const BUS_ROW = { top: STRIP_ROW + 0.12, foot: STRIP_ROW + 0.95 }

/** One passer-by: their figure, the lane they keep to, their column and their speed in tiles a second, signed by their way. */
interface Walker {
  view: CharacterView
  lane: WalkLane
  x: number
  v: number
}

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
  /** The ms passed this frame, for the passers-by and the bus; 0 while the shop stands still. */
  dt: number
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
  /** The glows of the street's lights, lit like the shop's lamps. */
  private glows: Phaser.GameObjects.Image[] = []
  private bus: Phaser.GameObjects.Image | null = null
  /** How far the bus is into its rounds. */
  private busMs = 0
  private walkers: Walker[] = []
  /** The lanes the passers-by were made for; they are made again only when these change. */
  private walked = ''
  /** The view's own stream for the passers-by's looks and ways: the sim draws nothing for them. */
  private readonly rng = createRng(Date.now())

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const h = BUSTLE_ROWS * TILE
    this.night = scene.add.rectangle(0, rowY(STRIP_ROW), 1, h, 0xffffff).setOrigin(0, 0).setDepth(NIGHT_DEPTH).setBlendMode(Phaser.BlendModes.MULTIPLY).setVisible(false)
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
    this.night.setFillStyle(d.sky, 1).setVisible(v.open && d.sky !== 0xffffff)
    this.dark.setVisible(v.open && v.powerOut)
    // the street's lights come on with the shop's lamps, and go out with them in a power cut
    const lit = v.powerOut ? 0 : d.lamps
    for (const g of this.glows) g.setAlpha(lit).setVisible(lit > 0)
    const street = this.street(v)
    this.walk(v, street)
    if (this.bus) {
      this.busMs += v.dt
      const col = busAt(this.busMs, street)
      this.bus.setVisible(col !== null).setX(colX(col ?? 0))
    }
  }

  /** The street's columns, from the light's left edge to its right. */
  private street(v: BustleView): ColSpan {
    const start = (v.light.x - colX(0)) / TILE
    return [start, start + v.light.w / TILE]
  }

  /** Makes the passers-by again when who walks changes, then moves each along its lane; the near sidewalk's are hidden upstairs, as its pieces are. */
  private walk(v: BustleView, street: ColSpan): void {
    const lanes = v.open ? walkLanes(v.bought, v.minutes, street) : []
    const key = JSON.stringify(lanes)
    if (key !== this.walked) {
      this.walked = key
      for (const w of this.walkers) w.view.container.destroy()
      this.walkers = lanes.flatMap(lane =>
        Array.from({ length: lane.count }, () => {
          const way = this.rng() < 0.5 ? -1 : 1
          const view = new CharacterView(this.scene, customerColors(randomLook(this.rng), 'office'))
          view.container.setScale(WALKER.scale)
          view.setPose('walk')
          view.setFacing(way > 0 ? 'right' : 'left')
          return { view, lane, x: lane.from + this.rng() * (lane.to - lane.from), v: way * lane.speed * (WALKER.slow + this.rng() * WALKER.spread) }
        }),
      )
    }
    for (const w of this.walkers) {
      const { lane } = w
      w.x += (w.v * v.dt) / 1000
      if (lane.loop) {
        if (w.x > lane.to) w.x = lane.from
        else if (w.x < lane.from) w.x = lane.to
      } else if (w.x > lane.to || w.x < lane.from) {
        w.x = Math.min(lane.to, Math.max(lane.from, w.x))
        w.v = -w.v
        w.view.setFacing(w.v > 0 ? 'right' : 'left')
      }
      const y = rowY(lane.row)
      w.view.container.setPosition(colX(w.x), y).setDepth(y).setVisible(!lane.near || v.floor === 1)
      w.view.update(v.dt)
    }
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
    for (const w of this.walkers) w.view.container.destroy()
    this.walkers = []
    this.night.destroy()
    this.dark.destroy()
  }

  private clear(): void {
    for (const p of this.parts) p.destroy()
    this.parts = []
    this.pieces.clear()
    this.glows = []
    this.bus = null
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
    // the lights, unlit until sync lights them, and the bus on the new lane once its stop is bought
    this.glows = streetLights(v.bought, v.floor).map(l => addGlow(this.scene, colX(l.col), rowY(l.row), l.scale))
    this.parts.push(...this.glows)
    if (v.bought.includes('busStop')) {
      this.bus = add.image(0, rowY(BUS_ROW.top), 'bustle-bus').setOrigin(0, 0).setDepth(rowY(BUS_ROW.foot)).setVisible(false)
      this.parts.push(this.bus)
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
