import { describe, expect, it, vi } from 'vitest'
import { beachRoomTexture } from '../../src/art/beach'
import { mapTexture } from '../../src/art/map'
import { C } from '../../src/art/palette'
import { roomTexture } from '../../src/art/room'
import { buildGrid } from '../../src/sim/grid'
import { shellOf } from '../../src/sim/items'
import { BRANCH_LAYOUT } from '../../src/sim/places'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]
const palette = Object.values(C).map(c => c.toLowerCase())
const inGameColours = (svg: string) => {
  for (const colour of svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []) expect(palette).toContain(colour.toLowerCase())
}

describe('beach art', () => {
  const grid = buildGrid(shellOf(BRANCH_LAYOUT), [])

  it('sizes the beach room like the main room, and draws it its own way', () => {
    const beach = beachRoomTexture(grid)
    expect(viewBox(beach)).toBe(viewBox(roomTexture(grid)))
    expect(beach).not.toBe(roomTexture(grid))
  })

  it('draws the beach room in the game colours', () => inGameColours(beachRoomTexture(grid)))

  it('draws the chain map 940 × 1040, in the game colours', () => {
    const map = mapTexture()
    expect(viewBox(map)).toBe('0 0 940 1040')
    inGameColours(map)
  })
})
