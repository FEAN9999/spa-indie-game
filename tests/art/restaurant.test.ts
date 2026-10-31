import { describe, expect, it, vi } from 'vitest'
import { restaurantTextures } from '../../src/art/restaurant'
import { STREET_TILES } from '../../src/art/room'
import { FLOOR_ROWS } from '../../src/config'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]

describe('restaurant art', () => {
  const textures = restaurantTextures()

  it('draws every restaurant texture as one svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['fx-bike', 'lot-front', 'rest-old', 'rest-room', 'rest-upper'])
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
  })

  it('sizes the room, the old house and a lot to their columns and the street', () => {
    expect(viewBox(textures['rest-room'])).toBe(`0 0 13 ${FLOOR_ROWS + STREET_TILES}`)
    expect(viewBox(textures['rest-old'])).toBe(`0 0 13 ${FLOOR_ROWS + STREET_TILES}`)
    expect(viewBox(textures['lot-front'])).toBe(`0 0 6 ${FLOOR_ROWS + STREET_TILES}`)
    expect(viewBox(textures['rest-upper'])).toBe(`0 0 13 ${FLOOR_ROWS}`)
  })

  it('hangs the SANG NHƯỢNG sign on the old house', () => {
    expect(textures['rest-old']).toContain('SANG NHƯỢNG')
  })
})
