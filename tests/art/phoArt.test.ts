import { describe, expect, it, vi } from 'vitest'
import { phoTextures } from '../../src/art/phoArt'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('pho art', () => {
  it('draws every Phở part', () => {
    const textures = phoTextures()
    expect(Object.keys(textures).sort()).toEqual(['pho-beef', 'pho-board', 'pho-bowl', 'pho-chili', 'pho-dial', 'pho-herb', 'pho-onion', 'pho-pot', 'pho-ticket'])
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
    expect(textures['pho-board'].match(/stroke-dasharray/g)).toHaveLength(4)
  })
})
