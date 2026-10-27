import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { FLOOR_ROWS, MAP_X, MAP_Y, TILE } from '../config'
import { floorOf } from '../sim/floors'
import { tileRuns, type Grid } from '../sim/grid'
import { ITEMS, workTile, type Item } from '../sim/items'
import type { Tile, Vec } from '../sim/types'
import { retagFloors } from './floors'

/** Lanterns, mats and bed slots lie on the room, under everything standing on it. */
const PART_DEPTH = 1
/** An item draws just under a character whose feet are on its bottom row, however late it was bought. */
const ITEM_DEPTH_BIAS = -0.5
/** The room's inner floor in tiles, right and bottom exclusive; a bench's mat is cut off at its edges. */
const FLOOR = { left: 1, top: 2, right: 12, bottom: 17 }

/** The stairs' top-left tile, where the 1 × 3 'stairs' texture goes; the rope hangs on its bottom tile. */
const STAIRS_TILE = { x: 11, y: 7 }

/** One item on screen, with a bed's lantern or a rattan bench's mat. */
interface ItemSprite {
  body: Phaser.GameObjects.Image
  part: Phaser.GameObjects.Image | null
  /** The floor the item stands on. */
  floor: number
}

/** Draws one floor of the room at a time: its fixed screen and desk (floor 1), the stairs, and one sprite per item on it; converts between tiles and world pixels. */
export class RoomView {
  /** The floor on view, from 1. */
  floor = 1
  private readonly room: Phaser.GameObjects.Image
  private readonly stairs: Phaser.GameObjects.Image
  private readonly rope: Phaser.GameObjects.Image
  /** The desk and screen, which stand on floor 1 only. */
  private readonly fixtures: Phaser.GameObjects.Image[] = []
  private readonly items = new Map<number, ItemSprite>()
  private readonly slots = new Map<string, Phaser.GameObjects.Image>()
  /** The item build mode is carrying, kept hidden across syncs. */
  private hidden: number | null = null

  constructor(
    private readonly scene: Phaser.Scene,
    grid: Grid,
  ) {
    this.room = scene.add.image(MAP_X, MAP_Y, 'room').setOrigin(0, 0).setDepth(0)
    this.stairs = scene.add.image(MAP_X + STAIRS_TILE.x * TILE, this.rowY(STAIRS_TILE.y), 'stairs').setOrigin(0, 0).setDepth(PART_DEPTH).setVisible(false)
    // under whoever stands on the foot below it, over whoever is on the stairs
    this.rope = scene.add.image(MAP_X + STAIRS_TILE.x * TILE, this.rowY(STAIRS_TILE.y + 2), 'stairsRope').setOrigin(0, 0).setDepth(this.rowY(STAIRS_TILE.y + 3) + ITEM_DEPTH_BIAS).setVisible(false)
    for (const [key, tiles] of [['desk', grid.desks], ['decor-screen', grid.decor.screen]] as const) {
      for (const r of tileRuns(tiles)) {
        const bottom = this.rowY(r.row + 1)
        this.fixtures.push(scene.add.image(MAP_X + ((r.left + r.right + 1) / 2) * TILE, bottom, key).setOrigin(0.5, 1).setDepth(bottom))
      }
    }
  }

  /** Shows `floor`: its room, the desk and screen on floor 1, the stairs, and the rope when it is the top open floor with another to open. The caller syncs afterwards. */
  setFloor(floor: number, floors: number, maxFloors: number): void {
    this.floor = floor
    this.room.setTexture(floor === 1 ? 'room' : 'room-2')
    for (const f of this.fixtures) f.setVisible(floor === 1)
    this.stairs.setVisible(maxFloors > 1)
    this.rope.setVisible(floors === floor && floor < maxFloors)
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
      s.part?.setVisible(shown)
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
    const s = { body, part, floor: floorOf(item.y) }
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
