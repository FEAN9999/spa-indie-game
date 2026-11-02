import { describe, expect, it, vi } from 'vitest'
import { TINT_SHADE, shade } from '../../src/art/aplus'
import { footTextures } from '../../src/art/footArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

// A+ shades a colour with shade(), so a shade of a game colour is a game colour too
const palette = Object.values(C).flatMap(c => [c, shade(c)]).map(c => c.toLowerCase())
/** The tinted sole is white with the A+ shade and darker creases, which the skin tint turns into skin tones. */
const SOLE = ['#ffffff', TINT_SHADE, shade('#FFFFFF', 0.3)].map(c => c.toLowerCase())
const textures = footTextures()
const hexes = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(c => c.toLowerCase())

describe('foot art', () => {
  it('draws the basin back, the sole, its lines and the basin front as svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['foot-basin-back', 'foot-basin-front', 'foot-sole', 'foot-sole-line'])
    for (const svg of Object.values(textures)) expect(svg).toContain('<svg')
  })

  it('draws them in the game colours, the sole in white with its shade and creases to be tinted', () => {
    for (const [name, svg] of Object.entries(textures)) {
      const allowed = name === 'foot-sole' ? [...palette, ...SOLE] : palette
      for (const colour of hexes(svg)) expect(allowed).toContain(colour)
    }
    expect(hexes(textures['foot-sole'])).toEqual(expect.arrayContaining(['#ffffff', TINT_SHADE.toLowerCase()]))
  })
})
