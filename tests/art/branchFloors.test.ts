import { describe, expect, it, vi } from 'vitest'
import { BRANCH_UPPER, branchFloorTextures } from '../../src/art/branchFloors'
import { floorTextures } from '../../src/art/floors'
import { C } from '../../src/art/palette'
import { FLOOR_ROWS, STREET_TILES } from '../../src/config'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]
const PLACES = ['beach', 'oldTown', 'uptown'] as const

describe('branch floor art', () => {
  const textures = branchFloorTextures()
  const main = floorTextures()

  it("draws floor 2 and the rooftop of every place, sized like the main shop's", () => {
    expect(Object.keys(textures).sort()).toEqual(PLACES.flatMap(p => [`room-${p}-2`, `room-${p}-3`]).sort())
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
      expect(viewBox(svg)).toBe(`0 0 13 ${FLOOR_ROWS + STREET_TILES}`)
      expect(viewBox(svg)).toBe(viewBox(main['room-2']))
    }
  })

  it("lays each place's own floors, unlike the main shop's and each other's", () => {
    for (const p of PLACES) {
      expect(textures[`room-${p}-2`]).toContain(`fill="url(#${BRANCH_UPPER[p].floor2})"`)
      expect(textures[`room-${p}-3`]).toContain(`fill="url(#${BRANCH_UPPER[p].roof})"`)
      expect(textures[`room-${p}-3`]).toContain(BRANCH_UPPER[p].cap)
    }
    const all = [...Object.values(textures), main['room-2'], main['room-3']]
    expect(new Set(all).size).toBe(all.length)
  })

  it('roofs the neighbour below in tiles in the old town, tin at the beach and concrete uptown', () => {
    expect(textures['room-oldTown-3']).toContain(C.lanternDark)
    expect(textures['room-beach-3']).toContain(C.tinRib)
    expect(textures['room-uptown-3']).toContain(C.roofConcrete)
  })

  it('is drawn in the game colours', () => {
    const palette = Object.values(C).map(c => c.toLowerCase())
    for (const svg of Object.values(textures))
      for (const colour of svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []) expect(palette).toContain(colour.toLowerCase())
  })
})
