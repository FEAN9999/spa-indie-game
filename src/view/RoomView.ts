import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { MAP_X, MAP_Y, TILE } from '../config'
import { tileRuns, type Grid } from '../sim/grid'
import { ITEMS, workTile, type Item } from '../sim/items'
import type { Tile, Vec } from '../sim/types'

/** Lanterns, mats and bed slots lie on the room, under everything standing on it. */
const PART_DEPTH = 1
/** An item draws just under a character whose feet are on its bottom row, however late it was bought. */
const ITEM_DEPTH_BIAS = -0.5
/** The room's inner floor in tiles, right and bottom exclusive; a bench's mat is cut off at its edges. */
const FLOOR = { left: 1, top: 2, right: 12, bottom: 17 }

/** One item on screen, with a bed's lantern or a rattan bench's mat. */
interface ItemSprite {
  body: Phaser.GameObjects.Image
  part: Phaser.GameObjects.Image | null
}

/** Draws the room, its fixed screen and desk, and one sprite per item; converts between tiles and world pixels. */
export class RoomView {
  private readonly items = new Map<number, ItemSprite>()
  private readonly slots = new Map<string, Phaser.GameObjects.Image>()
  /** The item build mode is carrying, kept hidden across syncs. */
  private hidden: number | null = null

  constructor(
    private readonly scene: Phaser.Scene,
    grid: Grid,
  ) {
    scene.add.image(MAP_X, MAP_Y, 'room').setOrigin(0, 0).setDepth(0)
    for (const [key, tiles] of [['desk', grid.desks], ['decor-screen', grid.decor.screen]] as const) {
      for (const r of tileRuns(tiles)) {
        const bottom = MAP_Y + (r.row + 1) * TILE
        scene.add.image(MAP_X + ((r.left + r.right + 1) / 2) * TILE, bottom, key).setOrigin(0.5, 1).setDepth(bottom)
      }
    }
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
    for (const item of items) {
      const s = this.items.get(item.id) ?? this.addItem(item)
      const { w, h } = ITEMS[item.kind]
      const bottom = MAP_Y + (item.y + h) * TILE
      s.body.setPosition(MAP_X + (item.x + w / 2) * TILE, bottom).setDepth(bottom + ITEM_DEPTH_BIAS).setFlipX(item.flip)
      const work = workTile(item)
      if (work) s.part?.setPosition(MAP_X + work.x * TILE, MAP_Y)
      else if (s.part) this.placeMat(s.part, item)
    }
    for (const { tile, open } of slots) {
      const key = `${tile.x},${tile.y}`
      let slot = this.slots.get(key)
      if (!slot) {
        // its top-left is half a tile left of and one tile above the head tile
        slot = this.scene.add.image(MAP_X + (tile.x - 0.5) * TILE, MAP_Y + (tile.y - 1) * TILE, 'bedSlot').setOrigin(0, 0).setDepth(PART_DEPTH)
        this.slots.set(key, slot)
      }
      slot.setVisible(open)
    }
    this.hide(this.hidden)
  }

  /** Hides one item, with its lantern or mat, while build mode carries it; null shows every item. */
  hide(id: number | null): void {
    this.hidden = id
    for (const [key, s] of this.items) {
      s.body.setVisible(key !== id)
      s.part?.setVisible(key !== id)
    }
  }

  private addItem(item: Item): ItemSprite {
    const add = this.scene.add
    const body = add.image(0, 0, itemTexture(item.kind)).setOrigin(0.5, 1)
    const partKey = item.kind === 'bed' ? 'lantern' : item.kind === 'bench' ? 'benchMat' : null
    const part = partKey ? add.image(0, 0, partKey).setOrigin(0, 0).setDepth(PART_DEPTH) : null
    const s = { body, part }
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
    mat.setPosition(MAP_X + x * TILE, MAP_Y + y * TILE).setCrop((left - x) * TILE, (top - y) * TILE, (right - left) * TILE, (bottom - top) * TILE)
  }

  /** Bottom-centre of the tile, in world pixels. */
  tileToWorld(t: Vec): { x: number; y: number } {
    return { x: MAP_X + (t.x + 0.5) * TILE, y: MAP_Y + (t.y + 1) * TILE }
  }

  worldToTile(x: number, y: number): Tile {
    return { x: Math.floor((x - MAP_X) / TILE), y: Math.floor((y - MAP_Y) / TILE) }
  }
}
