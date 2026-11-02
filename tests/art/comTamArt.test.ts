import { describe, expect, it, vi } from 'vitest'
import { comTamTextures } from '../../src/art/comTamArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const palette = Object.values(C).map(c => c.toLowerCase())
const textures = comTamTextures()
const hexes = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(c => c.toLowerCase())

describe('cơm tấm art', () => {
  it('draws the plate, the chop, the four sides, the fan and the chop on the grill as svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['ct-bi', 'ct-cha', 'ct-chua', 'ct-fan', 'ct-grill-chop-burnt', 'ct-grill-chop-cooked', 'ct-grill-chop-line', 'ct-grill-chop-marks', 'ct-grill-chop-raw', 'ct-plate', 'ct-suon', 'ct-trung'])
    for (const svg of Object.values(textures)) expect(svg).toContain('<svg')
  })

  it('draws the chop on the grill raw pink, glazed brown and burnt in their own colours, its lines and bone apart', () => {
    expect(textures['ct-grill-chop-raw']).toContain(C.beachHouseCoral)
    expect(textures['ct-grill-chop-cooked']).toContain(C.phoTileSpeck)
    expect(textures['ct-grill-chop-burnt']).toContain(C.coopStepHigh)
    for (const key of ['ct-grill-chop-raw', 'ct-grill-chop-cooked', 'ct-grill-chop-burnt']) expect(textures[key]).not.toContain(`stroke="${C.ink}"`)
    expect(textures['ct-grill-chop-line']).toContain(`stroke="${C.ink}"`)
    expect(textures['ct-grill-chop-line']).toContain(C.sand)
  })

  it('draws them in the game colours', () => {
    for (const svg of Object.values(textures)) for (const colour of hexes(svg)) expect(palette).toContain(colour)
  })
})
