import { describe, expect, it, vi } from 'vitest'
import { banhXeoTextures } from '../../src/art/banhXeoArt'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('banh xeo art', () => {
  it('draws every Bánh xèo part', () => {
    const textures = banhXeoTextures()
    expect(Object.keys(textures).sort()).toEqual(['bx-gia', 'bx-pan', 'bx-thit', 'bx-tom'])
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
    for (const key of ['bx-tom', 'bx-thit', 'bx-gia']) expect(textures[key]).toContain('width="60" height="60"')
  })
})
