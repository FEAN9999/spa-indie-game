import { describe, expect, it, vi } from 'vitest'
import { caPheTextures } from '../../src/art/caPheArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const palette = Object.values(C).map(c => c.toLowerCase())
const textures = caPheTextures()
const hexes = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(c => c.toLowerCase())

describe('cà phê art', () => {
  it('draws the phin, the can, the bucket and an ice cube as svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['cf-bucket', 'cf-can', 'cf-ice', 'cf-phin'])
    for (const svg of Object.values(textures)) expect(svg).toContain('<svg')
  })

  it('draws them in the game colours', () => {
    for (const svg of Object.values(textures)) for (const colour of hexes(svg)) expect(palette).toContain(colour)
  })
})
