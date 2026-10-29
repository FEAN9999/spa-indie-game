import { describe, expect, it, vi } from 'vitest'
import { nailsTextures } from '../../src/art/nailsArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const palette = Object.values(C).map(c => c.toLowerCase())
const textures = nailsTextures()
const hexes = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(c => c.toLowerCase())
const TINTED = ['nails-hand', 'nails-tip']

describe('nails art', () => {
  it('draws the cushion, the hand, its lines, the fingertip and its edge as svg', () => {
    expect(Object.keys(textures).sort()).toEqual(['nails-cushion', 'nails-hand', 'nails-hand-line', 'nails-tip', 'nails-tip-line'])
    for (const svg of Object.values(textures)) expect(svg).toContain('<svg')
  })

  it('draws them in the game colours, the hand and the fingertip in white with a grey crease to be tinted', () => {
    for (const [name, svg] of Object.entries(textures)) {
      const allowed = TINTED.includes(name) ? [...palette, '#ffffff', '#dcdcdc'] : palette
      for (const colour of hexes(svg)) expect(allowed).toContain(colour)
    }
    for (const name of TINTED) expect(hexes(textures[name])).toEqual(expect.arrayContaining(['#ffffff', '#dcdcdc']))
  })
})
