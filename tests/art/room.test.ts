import { describe, expect, it, vi } from 'vitest'
import { C } from '../../src/art/palette'
import { roomTexture } from '../../src/art/room'
import { buildGrid, parseLayout } from '../../src/sim/grid'
import { shellOf } from '../../src/sim/items'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('room art', () => {
  it('leaves the lanterns, the bench mat and the bed slots to the room view', () => {
    const room = roomTexture(buildGrid(shellOf(SPA_LAYOUT_1A), []))
    expect(room).not.toContain(C.lantern)
    expect(room).not.toContain('stroke-dasharray="0.12 0.09"')
    expect(room.split('url(#mat)')).toHaveLength(2) // the runner only
  })

  it('draws the same room whatever furniture stands in it', () => {
    expect(roomTexture(parseLayout(SPA_LAYOUT_1A))).toBe(roomTexture(buildGrid(shellOf(SPA_LAYOUT_1A), [])))
  })
})
