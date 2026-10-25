import * as Phaser from 'phaser'
import { MAP_X, MAP_Y, TILE } from '../config'
import type { Grid } from '../sim/grid'
import type { Tile, Vec } from '../sim/types'

/** Draws the room image and its furniture, and converts between tiles and world pixels. */
export class RoomView {
  constructor(scene: Phaser.Scene, grid: Grid) {
    scene.add.image(MAP_X, MAP_Y, 'room').setOrigin(0, 0).setDepth(0)

    const place = (key: string, left: number, right: number, row: number) => {
      const bottom = MAP_Y + (row + 1) * TILE
      scene.add.image(MAP_X + ((left + right + 1) / 2) * TILE, bottom, key).setOrigin(0.5, 1).setDepth(bottom)
    }
    for (const c of grid.chairs) place('chair-shampoo', c.x, c.x, c.y)
    for (const s of grid.seats) place('seat', s.x, s.x, s.y)
    for (const p of grid.plants) place('plant', p.x, p.x, p.y)
    if (grid.desks.length) {
      const xs = grid.desks.map(d => d.x)
      place('desk', Math.min(...xs), Math.max(...xs), grid.desks[0].y)
    }
  }

  /** Bottom-centre of the tile, in world pixels. */
  tileToWorld(t: Vec): { x: number; y: number } {
    return { x: MAP_X + (t.x + 0.5) * TILE, y: MAP_Y + (t.y + 1) * TILE }
  }

  worldToTile(x: number, y: number): Tile {
    return { x: Math.floor((x - MAP_X) / TILE), y: Math.floor((y - MAP_Y) / TILE) }
  }
}
