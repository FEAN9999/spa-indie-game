import * as Phaser from 'phaser'
import { MAP_X, MAP_Y, TILE } from '../config'
import { tileRuns, type Grid } from '../sim/grid'
import type { Tile, Vec } from '../sim/types'

/** Draws the room image and its furniture, and converts between tiles and world pixels. */
export class RoomView {
  constructor(scene: Phaser.Scene, grid: Grid) {
    scene.add.image(MAP_X, MAP_Y, 'room').setOrigin(0, 0).setDepth(0)

    const place = (key: string, left: number, right: number, row: number) => {
      const bottom = MAP_Y + (row + 1) * TILE
      scene.add.image(MAP_X + ((left + right + 1) / 2) * TILE, bottom, key).setOrigin(0.5, 1).setDepth(bottom)
    }
    const placeRuns = (key: string, tiles: Tile[]) => {
      for (const r of tileRuns(tiles)) place(key, r.left, r.right, r.row)
    }
    // a bed is anchored at the bottom of its foot tile, one below the tile the customer lies on
    for (const b of grid.beds) place('bed', b.x, b.x, b.y + 1)
    placeRuns('bench', grid.seats)
    placeRuns('desk', grid.desks)
    placeRuns('plant', grid.plants)
    for (const [kind, tiles] of Object.entries(grid.decor)) placeRuns(`decor-${kind}`, tiles)
  }

  /** Bottom-centre of the tile, in world pixels. */
  tileToWorld(t: Vec): { x: number; y: number } {
    return { x: MAP_X + (t.x + 0.5) * TILE, y: MAP_Y + (t.y + 1) * TILE }
  }

  worldToTile(x: number, y: number): Tile {
    return { x: Math.floor((x - MAP_X) / TILE), y: Math.floor((y - MAP_Y) / TILE) }
  }
}
