import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { C } from '../art/palette'
import { FLOOR_ROWS, GAME_W, MAP_X, MAP_Y, TILE } from '../config'
import { FESTIVALS, type FestivalId } from '../sim/festivals'
import { floorOf } from '../sim/floors'
import { tileRuns, type Grid } from '../sim/grid'
import { ITEMS, workTile, type Item } from '../sim/items'
import type { Tile, Vec } from '../sim/types'
import { t } from '../strings/vi'
import { FESTIVAL_COLORS } from './festivals'
import { retagFloors } from './floors'
import { textStyle } from './text'

/** Lanterns, mats and bed slots lie on the room, under everything standing on it. */
const PART_DEPTH = 1
/** A festival's bunting and sign hang on the back wall, over the bed slots and under everything standing in the room. */
const FESTIVAL_DEPTH = 1.5
/** The sign's centre and top in tiles: on floor 1's wall over the third and fourth bed spots, hung low enough to cover the clock. */
const SIGN = { x: 7.8, top: 0.5, h: 0.72, pad: 0.36 }
/** Where the bunting starts and ends on a wall, in tiles. */
const WALL = { left: 0.3, right: 12.7, top: 0.1 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** An item draws just under a character whose feet are on its bottom row, however late it was bought. */
const ITEM_DEPTH_BIAS = -0.5
/** The room's inner floor in tiles, right and bottom exclusive; a bench's mat is cut off at its edges. */
const FLOOR = { left: 1, top: 2, right: 12, bottom: 17 }

/**
 * The rival's sign stands on floor 1's sidewalk against the right edge, its board clear of today's line in the middle of the same band:
 * its right edge and board in pixels, its middle row in tiles.
 */
const RIVAL_SIGN = { right: GAME_W - 16, y: 19.1, w: 230, h: 100, top: -60 }
/** The dark of a power cut lies over the room and everyone in it, under the floating money and the HUD; the candles and off marks over it. */
const DARK_DEPTH = 5000
const DARK = { color: 0x1e2440, alpha: 0.48 }
/** The candles' places in tiles, the same on every floor: on the desk, on the tea table under the waiting bench, in the corner by the first bed's foot, by the stairs. */
const CANDLES = [
  { x: 9.5, y: 13.9 },
  { x: 4, y: 15.3 },
  { x: 1.5, y: 5.6 },
  { x: 11.2, y: 11.1 },
]
/** How far over a machine's footprint its off mark sits, in tiles. */
const OFF_MARK_LIFT = 0.3

/** The stairs' top-left tile, where the 1 × 3 'stairs' texture goes; the rope hangs on its bottom tile. */
const STAIRS_TILE = { x: 11, y: 7 }

/** One item on screen, with a bed's lantern or a rattan bench's mat. */
interface ItemSprite {
  body: Phaser.GameObjects.Image
  part: Phaser.GameObjects.Image | null
  /** The floor the item stands on. */
  floor: number
  /** The part is a bed's lantern, which hangs on floor 1's wall only. */
  lantern: boolean
}

/** Draws one floor of the room at a time: its fixed screen and desk (floor 1), the stairs, and one sprite per item on it; converts between tiles and world pixels. */
export class RoomView {
  /** The floor on view, from 1. */
  floor = 1
  private readonly room: Phaser.GameObjects.Image
  private readonly stairs: Phaser.GameObjects.Image
  private readonly rope: Phaser.GameObjects.Image
  /** The pigeon coop over the rooftop's stairs cells. */
  private readonly coop: Phaser.GameObjects.Image
  /** The desk and screen, which stand on floor 1 only. */
  private readonly fixtures: Phaser.GameObjects.Image[] = []
  private readonly items = new Map<number, ItemSprite>()
  private readonly slots = new Map<string, Phaser.GameObjects.Image>()
  /** The item build mode is carrying, kept hidden across syncs. */
  private hidden: number | null = null
  private festival: FestivalId | null = null
  private readonly bunting: Phaser.GameObjects.Graphics
  private readonly sign: Phaser.GameObjects.Text
  private readonly rival: Phaser.GameObjects.Container
  private rivalOn = false
  private readonly dark: Phaser.GameObjects.Rectangle
  private readonly candles: Phaser.GameObjects.Image[] = []
  private offMarks: Phaser.GameObjects.Image[] = []
  /** The power cut's floor and machine tiles as last drawn, or 'off', so a frame without a change draws nothing. */
  private powerKey = ''

  constructor(
    private readonly scene: Phaser.Scene,
    grid: Grid,
  ) {
    this.room = scene.add.image(MAP_X, MAP_Y, 'room').setOrigin(0, 0).setDepth(0)
    this.bunting = scene.add.graphics().setDepth(FESTIVAL_DEPTH)
    this.sign = scene.add.text(0, 0, '', textStyle(25)).setOrigin(0.5).setDepth(FESTIVAL_DEPTH)
    this.rival = this.rivalSign()
    this.dark = scene.add.rectangle(MAP_X, MAP_Y, this.room.width, this.room.height, DARK.color, DARK.alpha).setOrigin(0, 0).setDepth(DARK_DEPTH).setVisible(false)
    for (const c of CANDLES) {
      const at = { x: MAP_X + c.x * TILE, y: MAP_Y + c.y * TILE }
      this.candles.push(scene.add.image(at.x, at.y, 'fx-glow').setDepth(DARK_DEPTH + 1).setVisible(false))
      // the candle's texture has its 0,0 between the flame and the body, on the glow's centre
      this.candles.push(scene.add.image(at.x, at.y, 'fx-candle').setOrigin(0.5, 31 / 54).setDepth(DARK_DEPTH + 2).setVisible(false))
    }
    this.stairs = scene.add.image(MAP_X + STAIRS_TILE.x * TILE, this.rowY(STAIRS_TILE.y), 'stairs').setOrigin(0, 0).setDepth(PART_DEPTH).setVisible(false)
    // under whoever stands on the foot below it, over whoever is on the stairs
    this.rope = scene.add.image(MAP_X + STAIRS_TILE.x * TILE, this.rowY(STAIRS_TILE.y + 2), 'stairsRope').setOrigin(0, 0).setDepth(this.rowY(STAIRS_TILE.y + 3) + ITEM_DEPTH_BIAS).setVisible(false)
    // Over whoever is on the stairs cells or lifted by a climb (they go behind it), one pixel under whoever stands on the foot, whose depth is the foot's bottom edge.
    this.coop = scene.add.image(MAP_X + 10.75 * TILE, this.rowY(6), 'coop').setOrigin(0, 0).setDisplaySize(1.5 * TILE, 4 * TILE).setDepth(this.rowY(STAIRS_TILE.y + 4) - 1).setVisible(false)
    for (const [key, tiles] of [['desk', grid.desks], ['decor-screen', grid.decor.screen]] as const) {
      for (const r of tileRuns(tiles)) {
        const bottom = this.rowY(r.row + 1)
        this.fixtures.push(scene.add.image(MAP_X + ((r.left + r.right + 1) / 2) * TILE, bottom, key).setOrigin(0.5, 1).setDepth(bottom))
      }
    }
  }

  /** Shows `floor`: its room, the desk and screen on floor 1, the stairs, the coop on the rooftop, and the rope when it is the top open floor with another to open. The caller syncs afterwards. */
  setFloor(floor: number, floors: number, maxFloors: number): void {
    this.floor = floor
    this.room.setTexture(floor === 1 ? 'room' : floor === 2 ? 'room-2' : 'room-3')
    for (const f of this.fixtures) f.setVisible(floor === 1)
    // the rooftop has the coop where the stairs are, and no rope
    this.coop.setVisible(floor === 3)
    this.stairs.setVisible(maxFloors > 1 && floor < 3)
    this.rope.setVisible(floors === floor && floor < maxFloors && floor < 3)
    this.drawFestival()
    this.rival.setVisible(this.rivalOn && floor === 1)
  }

  /** Stands the rival's SPA MỚI sign on floor 1's sidewalk, or takes it away. */
  setRival(on: boolean): void {
    this.rivalOn = on
    this.rival.setVisible(on && this.floor === 1)
  }

  /** Darkens the room with four candles and marks each machine bed on the floor in view, given as its top-centre tile; or lights it again. */
  setPowerOut(on: boolean, machineBeds: Tile[]): void {
    const key = on ? `${this.floor}:${machineBeds.map(t => `${t.x},${t.y}`).join(' ')}` : 'off'
    if (key === this.powerKey) return
    this.powerKey = key
    this.dark.setVisible(on)
    for (const c of this.candles) c.setVisible(on)
    for (const m of this.offMarks) m.destroy()
    this.offMarks = on
      ? machineBeds.filter(t => this.onFloor(t.y)).map(t => this.scene.add.image(MAP_X + t.x * TILE, this.rowY(t.y - OFF_MARK_LIFT), 'power-off').setDepth(DARK_DEPTH + 3))
      : []
  }

  /** The sign: a cream board with the new shop's name over its opening, and two balloons on strings. */
  private rivalSign(): Phaser.GameObjects.Container {
    const { w, h, top } = RIVAL_SIGN
    // each balloon's string rises from just inside the board's top corner
    const edge = w / 2
    const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const string = (side: number) => new Phaser.Curves.QuadraticBezier(v((edge - 22) * side, top + 30), v((edge - 10) * side, top - 30), v((edge - 32) * side, top - 50)).getPoints(12)
    const g = this.scene.add.graphics().lineStyle(3, hex(C.ink)).strokePoints(string(-1)).strokePoints(string(1))
    for (const [side, color] of [[-1, C.lotus], [1, C.water]] as const) {
      g.fillStyle(hex(color), 1).fillEllipse((edge - 32) * side, top - 68, 40, 48).lineStyle(3, hex(C.ink)).strokeEllipse((edge - 32) * side, top - 68, 40, 48)
    }
    g.fillStyle(hex(C.cream), 1).fillRoundedRect(-edge, top, w, h, 18).lineStyle(4, hex(C.ink)).strokeRoundedRect(-edge, top, w, h, 18)
    const name = this.scene.add.text(0, top + 32, t('rivalSignName'), textStyle(36, '800', C.terracotta)).setOrigin(0.5)
    const line = this.scene.add.text(0, top + 72, t('rivalSignLine'), textStyle(24, '600', C.soft)).setOrigin(0.5)
    line.setScale(Math.min(1, (w - 28) / line.width))
    const at = { x: RIVAL_SIGN.right - edge, y: MAP_Y + RIVAL_SIGN.y * TILE }
    // whoever walks the sidewalk passes behind it: its depth is the board's bottom
    return this.scene.add.container(at.x, at.y, [g, name, line]).setDepth(at.y + top + h).setVisible(false)
  }

  /** Hangs the festival's bunting on the walls and its sign on floor 1, or takes them down for null. */
  setFestival(festival: FestivalId | null): void {
    if (festival === this.festival) return
    this.festival = festival
    this.drawFestival()
  }

  /** Bunting along the back wall of a walled floor (not the rooftop); on floor 1 it runs to the sign from both corners. */
  private drawFestival(): void {
    const g = this.bunting.clear()
    const f = this.festival
    this.sign.setVisible(f !== null && this.floor === 1)
    if (!f || this.floor === 3) return
    const colors = FESTIVAL_COLORS[f]
    const x = (tx: number) => MAP_X + tx * TILE
    const y = (ty: number) => MAP_Y + ty * TILE
    const top = y(WALL.top)
    if (this.floor === 1) {
      const [bg, ink] = [colors[0], colors[0] === C.mustard ? C.ink : C.cream]
      this.sign.setText(t(FESTIVALS[f].sign)).setColor(ink)
      const w = this.sign.width + SIGN.pad * TILE
      const cx = x(SIGN.x)
      const signTop = y(SIGN.top)
      this.sign.setPosition(cx, signTop + (SIGN.h * TILE) / 2)
      const hook = signTop + 14
      this.flags(g, x(WALL.left), top, cx - w / 2, hook, 9, colors)
      this.flags(g, cx + w / 2, hook, x(WALL.right), top, 7, colors)
      g.fillStyle(hex(bg), 1).fillRoundedRect(cx - w / 2, signTop, w, SIGN.h * TILE, 10)
      g.lineStyle(4, hex(C.ink)).strokeRoundedRect(cx - w / 2, signTop, w, SIGN.h * TILE, 10)
    } else this.flags(g, x(WALL.left), top, x(WALL.right), top, 16, colors)
  }

  /** One string of `n` triangle flags from (x0, y0) to (x1, y1), sagging between, in the two colours by turns. */
  private flags(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number, n: number, colors: [string, string]): void {
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x0, y0), new Phaser.Math.Vector2((x0 + x1) / 2, (y0 + y1) / 2 + 52), new Phaser.Math.Vector2(x1, y1))
    g.lineStyle(4, hex(C.ink)).strokePoints(curve.getPoints(24))
    for (let i = 0; i < n; i++) {
      const p = curve.getPoint((i + 0.5) / n)
      g.fillStyle(hex(colors[i % 2]), 1).fillTriangle(p.x - 14, p.y, p.x + 14, p.y, p.x, p.y + 34)
      g.lineStyle(3, hex(C.ink)).strokeTriangle(p.x - 14, p.y, p.x + 14, p.y, p.x, p.y + 34)
    }
  }

  /** Whether grid row `y` is on the floor in view. */
  onFloor(y: number): boolean {
    return floorOf(y) === this.floor
  }

  /** World y of the top of grid row `y`, on the floor in view. */
  rowY(y: number): number {
    return MAP_Y + (y - (this.floor - 1) * FLOOR_ROWS) * TILE
  }

  /** Creates, moves, flips and removes the item sprites to match `items`, and shows the bed slots that are open. */
  sync(items: Item[], slots: { tile: Tile; open: boolean }[]): void {
    const ids = new Set(items.map(i => i.id))
    for (const [id, s] of this.items) {
      if (ids.has(id)) continue
      s.body.destroy()
      s.part?.destroy()
      this.items.delete(id)
    }
    retagFloors(this.items, items)
    for (const item of items) {
      const s = this.items.get(item.id) ?? this.addItem(item)
      const { w, h } = ITEMS[item.kind]
      const bottom = this.rowY(item.y + h)
      s.body.setPosition(MAP_X + (item.x + w / 2) * TILE, bottom).setDepth(bottom + ITEM_DEPTH_BIAS).setFlipX(item.flip)
      const work = workTile(item)
      if (work) s.part?.setPosition(MAP_X + work.x * TILE, this.rowY((floorOf(item.y) - 1) * FLOOR_ROWS))
      else if (s.part) this.placeMat(s.part, item)
    }
    for (const { tile, open } of slots) {
      const key = `${tile.x},${tile.y}`
      let slot = this.slots.get(key)
      if (!slot) {
        // its top-left is half a tile left of and one tile above the head tile
        slot = this.scene.add.image(MAP_X + (tile.x - 0.5) * TILE, this.rowY(tile.y - 1), 'bedSlot').setOrigin(0, 0).setDepth(PART_DEPTH)
        this.slots.set(key, slot)
      }
      slot.setVisible(open && this.floor === 1)
    }
    this.hide(this.hidden)
  }

  /** Hides one item, with its lantern or mat, while build mode carries it; null shows every item. */
  hide(id: number | null): void {
    this.hidden = id
    for (const [key, s] of this.items) {
      const shown = key !== id && s.floor === this.floor
      s.body.setVisible(shown)
      s.part?.setVisible(shown && (!s.lantern || s.floor === 1))
    }
  }

  /** The item whose picture covers the point, the one drawn in front where several do; null when none does. */
  itemAt(x: number, y: number): number | null {
    let front: { id: number; depth: number } | null = null
    for (const [id, s] of this.items) {
      if (s.floor === this.floor && s.body.getBounds().contains(x, y) && (!front || s.body.depth > front.depth)) front = { id, depth: s.body.depth }
    }
    return front?.id ?? null
  }

  private addItem(item: Item): ItemSprite {
    const add = this.scene.add
    const body = add.image(0, 0, itemTexture(item.kind)).setOrigin(0.5, 1)
    const partKey = item.kind === 'bed' ? 'lantern' : item.kind === 'bench' ? 'benchMat' : null
    const part = partKey ? add.image(0, 0, partKey).setOrigin(0, 0).setDepth(PART_DEPTH) : null
    const s = { body, part, floor: floorOf(item.y), lantern: partKey === 'lantern' }
    this.items.set(item.id, s)
    return s
  }

  /** The mat's top-left is half a tile left of and above the bench; whatever reaches past the floor is cut off. */
  private placeMat(mat: Phaser.GameObjects.Image, bench: Item): void {
    const x = bench.x - 0.5
    const y = bench.y - 0.5
    const left = Math.max(x, FLOOR.left)
    const top = Math.max(y, FLOOR.top)
    const right = Math.min(x + mat.width / TILE, FLOOR.right)
    const bottom = Math.min(y + mat.height / TILE, FLOOR.bottom)
    mat.setPosition(MAP_X + x * TILE, this.rowY(y)).setCrop((left - x) * TILE, (top - y) * TILE, (right - left) * TILE, (bottom - top) * TILE)
  }

  /** Bottom-centre of the tile, in world pixels. */
  tileToWorld(t: Vec): { x: number; y: number } {
    return { x: MAP_X + (t.x + 0.5) * TILE, y: this.rowY(t.y + 1) }
  }

  worldToTile(x: number, y: number): Tile {
    return { x: Math.floor((x - MAP_X) / TILE), y: Math.floor((y - MAP_Y) / TILE) + (this.floor - 1) * FLOOR_ROWS }
  }
}
