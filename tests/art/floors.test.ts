import { describe, expect, it, vi } from 'vitest'
import { floorTextures } from '../../src/art/floors'
import { C } from '../../src/art/palette'
import { GACH_BONG_TILE, roomTexture, STREET_TILES } from '../../src/art/room'
import { FLOOR_ROWS } from '../../src/config'
import { parseLayout } from '../../src/sim/grid'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]

describe('floor art', () => {
  const textures = floorTextures()

  it('draws the floor-2 and rooftop rooms, the coop, the stairs and the rope as well-formed SVG', () => {
    expect(Object.keys(textures).sort()).toEqual(['coop', 'room-2', 'room-3', 'stairs', 'stairsRope'])
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
  })

  it('sizes room-2 like the floor-1 room, and the stairs and rope to their tiles', () => {
    const room = roomTexture(parseLayout(SPA_LAYOUT_1A))
    expect(viewBox(textures['room-2'])).toBe(viewBox(room))
    expect(viewBox(textures['room-2'])).toBe(`0 0 13 ${FLOOR_ROWS + STREET_TILES}`)
    expect(viewBox(textures.stairs)).toBe('0 0 1 3')
    expect(viewBox(textures.stairsRope)).toBe('0 0 1 1')
  })

  it('sizes the rooftop like the floor-1 room and the coop to 1.5 × 4 tiles, and lays the roof in gạch tàu', () => {
    const room = roomTexture(parseLayout(SPA_LAYOUT_1A))
    expect(viewBox(textures['room-3'])).toBe(viewBox(room))
    expect(viewBox(textures.coop)).toBe('0 0 1.5 4')
    expect(textures['room-3']).toContain('fill="url(#gachtau)"')
  })

  it('lays floor 2 with planks inside and gạch bông on the balcony, in the game colours', () => {
    expect(textures['room-2']).toContain(GACH_BONG_TILE)
    expect(textures['room-2']).toContain('fill="url(#planks)"')
    const palette = Object.values(C).map(c => c.toLowerCase())
    for (const svg of Object.values(textures))
      for (const colour of svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []) expect(palette).toContain(colour.toLowerCase())
  })
})
