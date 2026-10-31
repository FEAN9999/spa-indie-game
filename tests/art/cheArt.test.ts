import { describe, expect, it, vi } from 'vitest'
import { cheTextures } from '../../src/art/cheArt'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('che art', () => {
  it('draws every Chè part', () => {
    const textures = cheTextures()
    expect(Object.keys(textures).sort()).toEqual(['che-coconut', 'che-glass', 'che-ice'])
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
  })
})
