import { describe, expect, it, vi } from 'vitest'
import { beachRoomTexture } from '../../src/art/beach'
import { oldTownRoomTexture } from '../../src/art/oldTown'
import { C } from '../../src/art/palette'
import { roomTexture } from '../../src/art/room'
import { uptownRoomTexture } from '../../src/art/uptown'
import { buildGrid } from '../../src/sim/grid'
import { shellOf } from '../../src/sim/items'
import { BRANCH_LAYOUT } from '../../src/sim/places'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]
const palette = Object.values(C).map(c => c.toLowerCase())

describe.each([
  ['the old town', oldTownRoomTexture],
  ['the uptown', uptownRoomTexture],
])('%s room', (_, draw) => {
  const grid = buildGrid(shellOf(BRANCH_LAYOUT), [])

  it('is sized like the main room, and drawn its own way', () => {
    const room = draw(grid)
    expect(viewBox(room)).toBe(viewBox(roomTexture(grid)))
    expect(room).not.toBe(roomTexture(grid))
    expect(room).not.toBe(beachRoomTexture(grid))
  })

  it('is drawn in the game colours', () => {
    for (const colour of draw(grid).match(/#[0-9a-fA-F]{6}\b/g) ?? []) expect(palette).toContain(colour.toLowerCase())
  })
})

it('draws the two places differently', () => {
  const grid = buildGrid(shellOf(BRANCH_LAYOUT), [])
  expect(oldTownRoomTexture(grid)).not.toBe(uptownRoomTexture(grid))
})
