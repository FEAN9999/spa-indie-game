import { describe, expect, it, vi } from 'vitest'
import { cuppingTextures } from '../../src/art/cuppingArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const palette = Object.values(C).map(c => c.toLowerCase())
const textures = cuppingTextures()
const hexes = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(c => c.toLowerCase())

describe('cupping art', () => {
  it('draws the cup, the skin under it, the mark and the tray as svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['cp-cup', 'cp-mark', 'cp-skin', 'cp-tray'])
    for (const svg of Object.values(textures)) expect(svg).toContain('<svg')
  })

  it('draws them in the game colours, the skin in white to be tinted', () => {
    for (const [name, svg] of Object.entries(textures)) {
      const allowed = name === 'cp-skin' ? ['#ffffff'] : palette
      for (const colour of hexes(svg)) expect(allowed).toContain(colour)
    }
  })
})
