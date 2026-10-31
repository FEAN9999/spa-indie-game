import { describe, expect, it, vi } from 'vitest'
import { BRANCH_HOUSE_LOOK, branchHouseTextures } from '../../src/art/branchHouses'
import { C } from '../../src/art/palette'
import { MARBLE, marble } from '../../src/art/uptown'
import { FLOOR_ROWS, STREET_TILES } from '../../src/config'
import { parseLayout } from '../../src/sim/grid'
import { BRANCH_ROOM } from '../../src/sim/places'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]
const PLACES = ['beach', 'oldTown', 'uptown'] as const
const KEYS = ['left1', 'left2', 'right1', 'right2'] as const
const FLOOR = { oldTown: C.phoTile, beach: C.beachPlank, uptown: C.marble }

describe('branch house art', () => {
  const textures = branchHouseTextures(parseLayout(BRANCH_ROOM))

  it('draws a house per place and side, and a roof per place', () => {
    const names = PLACES.flatMap(p => [...KEYS.map(k => `house-${p}-${k}`), `sale-${p}`]).sort()
    expect(Object.keys(textures).sort()).toEqual(names)
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
  })

  it("sizes branch houses like the main shop's", () => {
    for (const [name, svg] of Object.entries(textures))
      expect(viewBox(svg)).toBe(name.startsWith('house-') ? `0 0 6.5 ${FLOOR_ROWS + STREET_TILES}` : `0 0 6 ${FLOOR_ROWS + STREET_TILES}`)
  })

  it("paints each branch house in its own colour on its place's floor", () => {
    for (const p of PLACES) {
      for (const k of KEYS) {
        const svg = textures[`house-${p}-${k}`]
        expect(svg).toContain(BRANCH_HOUSE_LOOK[p].colors[k])
        expect(svg).toContain(FLOOR[p])
        expect(svg).not.toContain(C.tileSeam)
      }
    }
  })

  it('roofs the old town in tiles, the beach in tin and uptown flat', () => {
    expect(textures['sale-oldTown']).toContain(C.lanternDark)
    expect(textures['sale-beach']).toContain(C.tinRib)
    expect(textures['sale-uptown']).toContain(C.roofConcrete)
    expect(textures['sale-uptown']).toContain(C.tank)
  })

  it("keeps the uptown room's gold marble", () => {
    expect(MARBLE).toBe(marble(C.caoGoldLight))
  })
})
