import { describe, expect, it, vi } from 'vitest'
import { menuTextures } from '../../src/art/menuArt'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('menu art', () => {
  it('draws every dish and stock icon', () => {
    const textures = menuTextures()
    expect(Object.keys(textures).sort()).toEqual(['dish-banhXeo', 'dish-che', 'dish-pho', 'rstock-batter', 'rstock-cheKit', 'rstock-herbs', 'rstock-phoKit'])
    for (const svg of Object.values(textures)) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
    expect(textures['dish-pho']).toContain('width="90"')
    expect(textures['rstock-herbs']).toContain('width="60"')
  })
})
