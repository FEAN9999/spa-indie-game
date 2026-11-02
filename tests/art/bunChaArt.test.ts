import { describe, expect, it, vi } from 'vitest'
import { bunChaTextures } from '../../src/art/bunChaArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const palette = Object.values(C).map(c => c.toLowerCase())
const textures = bunChaTextures()
const hexes = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(c => c.toLowerCase())

describe('bún chả art', () => {
  it('draws the stove, the plate, the bowl and the three sides as svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['bc-bowl', 'bc-du', 'bc-ot', 'bc-patty', 'bc-patty-line', 'bc-plate', 'bc-rau', 'bc-stove'])
    for (const svg of Object.values(textures)) expect(svg).toContain('<svg')
  })

  it('draws them in the game colours', () => {
    for (const svg of Object.values(textures)) for (const colour of hexes(svg)) expect(palette).toContain(colour)
  })
})
