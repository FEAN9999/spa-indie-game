import { describe, expect, it, vi } from 'vitest'
import { HOUSE_LOOK, houseKey, houseTextures } from '../../src/art/houses'
import { C } from '../../src/art/palette'
import { GACH_BONG_TILE, gachBongTile } from '../../src/art/room'
import { FLOOR_ROWS, STREET_TILES } from '../../src/config'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]
const KEYS = ['left1', 'left2', 'right1', 'right2'] as const

describe('house art', () => {
  const textures = houseTextures()

  it('draws three floors for each house and a roof for each house for sale', () => {
    const names = KEYS.flatMap(k => [`house-${k}-1`, `house-${k}-2`, `house-${k}-3`, `sale-${k}`]).sort()
    expect(Object.keys(textures).sort()).toEqual(names)
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
  })

  it('sizes a bought house half a column wider than its own six', () => {
    for (const [name, svg] of Object.entries(textures))
      expect(viewBox(svg)).toBe(name.startsWith('house-') ? `0 0 6.5 ${FLOOR_ROWS + STREET_TILES}` : `0 0 6 ${FLOOR_ROWS + STREET_TILES}`)
  })

  it('paints each house in its own wall and tiles', () => {
    for (const k of KEYS) {
      const svg = textures[`house-${k}-1`]
      expect(svg).toContain(HOUSE_LOOK[k].wall)
      for (const c of HOUSE_LOOK[k].tiles) expect(svg).toContain(c)
    }
    expect(textures['house-right1-1']).not.toContain(C.wall)
  })

  it('roofs R1 and L2 in tin, L1 and R2 in tiles', () => {
    expect(textures['sale-right1']).toContain(C.tinRib)
    expect(textures['sale-left1']).toContain(C.lanternDark)
    expect([HOUSE_LOOK.right1.roof, HOUSE_LOOK.left2.roof, HOUSE_LOOK.left1.roof, HOUSE_LOOK.right2.roof]).toEqual(['tin', 'tin', 'tiles', 'tiles'])
  })

  it('keeps the old gạch bông', () => {
    expect(GACH_BONG_TILE).toBe(gachBongTile(C.tile, C.terracotta, C.teal))
  })

  it('names a house by its side and place', () => {
    expect(houseKey({ side: 'right', n: 1 })).toBe('right1')
    expect(houseKey({ side: 'left', n: 2 })).toBe('left2')
  })
})
