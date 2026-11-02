import { describe, expect, it, vi } from 'vitest'
import { TINT_SHADE, shade } from '../../src/art/aplus'
import { nailsTextures } from '../../src/art/nailsArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

// A+ shades a colour with shade(), so a shade of a game colour is a game colour too
const palette = Object.values(C).flatMap(c => [c, shade(c)]).map(c => c.toLowerCase())
/** The tinted parts are white with the A+ shade and darker creases, which the skin tint turns into skin tones. */
const SKIN = ['#ffffff', TINT_SHADE, shade('#FFFFFF', 0.3)].map(c => c.toLowerCase())
const textures = nailsTextures()
const hexes = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(c => c.toLowerCase())
const TINTED = ['nails-hand', 'nails-tip']

describe('nails art', () => {
  it('draws the cushion, the hand, its lines, the fingertip and its edge as svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['nails-cushion', 'nails-hand', 'nails-hand-line', 'nails-tip', 'nails-tip-line'])
    for (const svg of Object.values(textures)) expect(svg).toContain('<svg')
  })

  it('draws them in the game colours, the hand and the fingertip in white with their shade and creases to be tinted', () => {
    for (const [name, svg] of Object.entries(textures)) {
      const allowed = TINTED.includes(name) ? [...palette, ...SKIN] : palette
      for (const colour of hexes(svg)) expect(allowed).toContain(colour)
    }
    for (const name of TINTED) expect(hexes(textures[name])).toEqual(expect.arrayContaining(['#ffffff', TINT_SHADE.toLowerCase()]))
  })
})
