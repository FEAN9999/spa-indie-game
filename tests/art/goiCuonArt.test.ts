import { describe, expect, it, vi } from 'vitest'
import { goiCuonTextures } from '../../src/art/goiCuonArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const palette = Object.values(C).map(c => c.toLowerCase())
const textures = goiCuonTextures()
const hexes = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(c => c.toLowerCase())

describe('gỏi cuốn art', () => {
  it('draws the basin, the board and the noodles as svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['gc-basin', 'gc-board', 'gc-bun', 'gc-paper-dry', 'gc-paper-wet', 'gc-roll'])
    for (const svg of Object.values(textures)) expect(svg).toContain('<svg')
  })

  it('draws them in the game colours', () => {
    for (const svg of Object.values(textures)) for (const colour of hexes(svg)) expect(palette).toContain(colour)
  })
})
