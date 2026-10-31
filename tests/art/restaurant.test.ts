import { describe, expect, it, vi } from 'vitest'
import { REST_HOUSE_LOOK, restaurantTextures, ROOF_LANTERNS } from '../../src/art/restaurant'
import { HOUSE_LOOK } from '../../src/art/houses'
import { STREET_TILES } from '../../src/art/room'
import { FLOOR_ROWS } from '../../src/config'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]
const KEYS = ['left1', 'left2', 'right1', 'right2'] as const

describe('restaurant art', () => {
  const textures = restaurantTextures()

  it('draws every restaurant texture as one svg', () => {
    const houses = KEYS.flatMap(k => [`rest-house-${k}-1`, `rest-house-${k}-2`, `rest-house-${k}-3`, `rest-sale-${k}`])
    const names = ['fx-bike', 'lot-front', 'rest-old', 'rest-room', 'rest-room-2', 'rest-room-3', 'rest-upper', 'spa-upper', ...houses]
    expect(Object.keys(textures).sort()).toEqual(names.sort())
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

  it("sizes the upper floors like the room, the spa's closed upper front like the restaurant's", () => {
    expect(viewBox(textures['rest-room-2'])).toBe(viewBox(textures['rest-room']))
    expect(viewBox(textures['rest-room-3'])).toBe(viewBox(textures['rest-room']))
    expect(viewBox(textures['spa-upper'])).toBe(viewBox(textures['rest-upper']))
  })

  it("sizes a house to its six columns and half the old wall, like the spa's, and its sale sign to its six", () => {
    for (const k of KEYS) {
      for (const floor of [1, 2, 3]) expect(viewBox(textures[`rest-house-${k}-${floor}`])).toBe(`0 0 6.5 ${FLOOR_ROWS + STREET_TILES}`)
      expect(viewBox(textures[`rest-sale-${k}`])).toBe(`0 0 6 ${FLOOR_ROWS + STREET_TILES}`)
    }
  })

  it("paints each house in its own warm wall, none of them the spa's", () => {
    const spa = Object.values(HOUSE_LOOK).map(l => l.wall)
    for (const k of KEYS) {
      expect(spa).not.toContain(REST_HOUSE_LOOK[k].wall)
      for (const floor of [1, 2, 3]) expect(textures[`rest-house-${k}-${floor}`]).toContain(REST_HOUSE_LOOK[k].wall)
    }
    expect(new Set(KEYS.map(k => REST_HOUSE_LOOK[k].wall)).size).toBe(4)
  })

  it('strings the rooftop lanterns across the rooftop, overhead', () => {
    expect(ROOF_LANTERNS.length).toBeGreaterThanOrEqual(4)
    for (const { x, y } of ROOF_LANTERNS) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(13)
      expect(y).toBeGreaterThanOrEqual(2)
      expect(y).toBeLessThanOrEqual(6)
    }
  })

  it('hangs the SANG NHƯỢNG sign on the old house', () => {
    expect(textures['rest-old']).toContain('SANG NHƯỢNG')
  })
})
